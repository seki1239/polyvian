<?php
// PHPスクリプトの実行時間を最大に設定（必要に応じて調整）
set_time_limit(300);

// エラー報告設定
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// データベース接続情報 (TODO: 実際は設定ファイルなどから読み込む)
$host = 'localhost';
$db   = 'polyvian';
$user = 'root';
$pass = 'password'; // 開発環境用パスワード

$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

$pdo = null; // PDOオブジェクトを初期化

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// POSTリクエストのデータを取得
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON received: ' . json_last_error_msg()]);
    exit();
}

// クライアントからの最終同期時刻
$lastSyncTime = isset($data['last_sync_time']) ? $data['last_sync_time'] : null;
$syncQueue = isset($data['sync_queue']) ? $data['sync_queue'] : [];

$response = [
    'status' => 'success',
    'diff' => [ // クライアントに返す差分データ
        'cards' => [],
        'review_logs' => [],
        'users' => []
    ],
    'new_sync_time' => (new DateTime())->format('Y-m-d H:i:s')
];

$pdo->beginTransaction();
try {
    // 1. sync_queue の内容を MySQL に反映
    foreach ($syncQueue as $item) {
        $tableName = $item['table_name'];
        $operation = $item['operation'];
        $payload = $item['payload'];

        switch ($tableName) {
            case 'cards':
                handleCardSync($pdo, $operation, $payload);
                break;
            case 'review_logs':
                handleReviewLogSync($pdo, $operation, $payload);
                break;
            case 'users':
                handleUserSync($pdo, $operation, $payload);
                break;
            default:
                // 未知のテーブル名はスキップまたはエラー
                error_log("Unknown table name for sync: " . $tableName);
                break;
        }
    }

    // 2. 最終同期時刻以降の差分データをクライアントに返す
    if ($lastSyncTime) {
        $response['diff']['cards'] = getDiffData($pdo, 'cards', $lastSyncTime);
        $response['diff']['review_logs'] = getDiffData($pdo, 'review_logs', $lastSyncTime);
        $response['diff']['users'] = getDiffData($pdo, 'users', $lastSyncTime);
    }

    $pdo->commit();
    echo json_encode($response);

} catch (\Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Sync failed: ' . $e->getMessage()]);
    exit();
}

/**
 * カードデータの同期処理
 * @param PDO $pdo
 * @param string $operation
 * @param array $payload
 */
function handleCardSync(PDO $pdo, string $operation, array $payload) {
    switch ($operation) {
        case 'add':
            $stmt = $pdo->prepare("INSERT INTO cards (id, user_id, word, meaning, example_sentence, due_date, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review, created_at, updated_at) VALUES (:id, :user_id, :word, :meaning, :example_sentence, :due_date, :stability, :difficulty, :elapsed_days, :scheduled_days, :reps, :lapses, :state, :last_review, :created_at, :updated_at) ON DUPLICATE KEY UPDATE word=VALUES(word), meaning=VALUES(meaning), example_sentence=VALUES(example_sentence), due_date=VALUES(due_date), stability=VALUES(stability), difficulty=VALUES(difficulty), elapsed_days=VALUES(elapsed_days), scheduled_days=VALUES(scheduled_days), reps=VALUES(reps), lapses=VALUES(lapses), state=VALUES(state), last_review=VALUES(last_review), updated_at=VALUES(updated_at)");
            $stmt->execute([
                ':id' => $payload['id'], // クライアント側のIDを保持
                ':user_id' => $payload['user_id'],
                ':word' => $payload['word'],
                ':meaning' => $payload['meaning'],
                ':example_sentence' => $payload['example_sentence'],
                ':due_date' => (new DateTime($payload['due_date']))->format('Y-m-d'),
                ':stability' => $payload['stability'],
                ':difficulty' => $payload['difficulty'],
                ':elapsed_days' => $payload['elapsed_days'],
                ':scheduled_days' => $payload['scheduled_days'],
                ':reps' => $payload['reps'],
                ':lapses' => $payload['lapses'],
                ':state' => $payload['state'],
                ':last_review' => $payload['last_review'] ? (new DateTime($payload['last_review']))->format('Y-m-d H:i:s') : null,
                ':created_at' => (new DateTime($payload['created_at']))->format('Y-m-d H:i:s'),
                ':updated_at' => (new DateTime($payload['updated_at']))->format('Y-m-d H:i:s')
            ]);
            break;
        case 'update':
            $stmt = $pdo->prepare("UPDATE cards SET user_id=:user_id, word=:word, meaning=:meaning, example_sentence=:example_sentence, due_date=:due_date, stability=:stability, difficulty=:difficulty, elapsed_days=:elapsed_days, scheduled_days=:scheduled_days, reps=:reps, lapses=:lapses, state=:state, last_review=:last_review, updated_at=:updated_at WHERE id=:id");
            $stmt->execute([
                ':id' => $payload['id'],
                ':user_id' => $payload['user_id'],
                ':word' => $payload['word'],
                ':meaning' => $payload['meaning'],
                ':example_sentence' => $payload['example_sentence'],
                ':due_date' => (new DateTime($payload['due_date']))->format('Y-m-d'),
                ':stability' => $payload['stability'],
                ':difficulty' => $payload['difficulty'],
                ':elapsed_days' => $payload['elapsed_days'],
                ':scheduled_days' => $payload['scheduled_days'],
                ':reps' => $payload['reps'],
                ':lapses' => $payload['lapses'],
                ':state' => $payload['state'],
                ':last_review' => $payload['last_review'] ? (new DateTime($payload['last_review']))->format('Y-m-d H:i:s') : null,
                ':updated_at' => (new DateTime($payload['updated_at']))->format('Y-m-d H:i:s')
            ]);
            break;
        case 'delete':
            $stmt = $pdo->prepare("DELETE FROM cards WHERE id=:id");
            $stmt->execute([':id' => $payload['id']]);
            break;
    }
}

/**
 * 学習ログデータの同期処理
 * @param PDO $pdo
 * @param string $operation
 * @param array $payload
 */
function handleReviewLogSync(PDO $pdo, string $operation, array $payload) {
    switch ($operation) {
        case 'add':
            $stmt = $pdo->prepare("INSERT INTO review_logs (id, card_id, user_id, review_date, rating, elapsed_days, scheduled_days, state, due_date) VALUES (:id, :card_id, :user_id, :review_date, :rating, :elapsed_days, :scheduled_days, :state, :due_date) ON DUPLICATE KEY UPDATE review_date=VALUES(review_date), rating=VALUES(rating), elapsed_days=VALUES(elapsed_days), scheduled_days=VALUES(scheduled_days), state=VALUES(state), due_date=VALUES(due_date)");
            $stmt->execute([
                ':id' => $payload['id'], // クライアント側のIDを保持
                ':card_id' => $payload['card_id'],
                ':user_id' => $payload['user_id'],
                ':review_date' => (new DateTime($payload['review_date']))->format('Y-m-d H:i:s'),
                ':rating' => $payload['rating'],
                ':elapsed_days' => $payload['elapsed_days'],
                ':scheduled_days' => $payload['scheduled_days'],
                ':state' => $payload['state'],
                ':due_date' => (new DateTime($payload['due_date']))->format('Y-m-d')
            ]);
            break;
        case 'delete': // 基本的に学習ログは削除しない想定だが、念のため
            $stmt = $pdo->prepare("DELETE FROM review_logs WHERE id=:id");
            $stmt->execute([':id' => $payload['id']]);
            break;
    }
}

/**
 * ユーザーデータの同期処理
 * @param PDO $pdo
 * @param string $operation
 * @param array $payload
 */
function handleUserSync(PDO $pdo, string $operation, array $payload) {
    switch ($operation) {
        case 'add':
            $stmt = $pdo->prepare("INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (:id, :username, :password_hash, :created_at, :updated_at) ON DUPLICATE KEY UPDATE username=VALUES(username), password_hash=VALUES(password_hash), updated_at=VALUES(updated_at)");
            $stmt->execute([
                ':id' => $payload['id'],
                ':username' => $payload['username'],
                ':password_hash' => $payload['password_hash'],
                ':created_at' => (new DateTime($payload['created_at']))->format('Y-m-d H:i:s'),
                ':updated_at' => (new DateTime($payload['updated_at']))->format('Y-m-d H:i:s')
            ]);
            break;
        case 'update':
            $stmt = $pdo->prepare("UPDATE users SET username=:username, password_hash=:password_hash, updated_at=:updated_at WHERE id=:id");
            $stmt->execute([
                ':id' => $payload['id'],
                ':username' => $payload['username'],
                ':password_hash' => $payload['password_hash'],
                ':updated_at' => (new DateTime($payload['updated_at']))->format('Y-m-d H:i:s')
            ]);
            break;
        case 'delete':
            $stmt = $pdo->prepare("DELETE FROM users WHERE id=:id");
            $stmt->execute([':id' => $payload['id']]);
            break;
    }
}

/**
 * 指定されたテーブルと最終同期時刻以降の差分データを取得
 * @param PDO $pdo
 * @param string $tableName
 * @param string $lastSyncTime
 * @return array
 */
function getDiffData(PDO $pdo, string $tableName, string $lastSyncTime): array {
    // MySQLではcreated_atとupdated_atがTIMESTAMP型なので、`Y-m-d H:i:s`形式で比較
    $stmt = $pdo->prepare("SELECT * FROM `$tableName` WHERE updated_at > :last_sync_time OR created_at > :last_sync_time");
    $stmt->execute([':last_sync_time' => $lastSyncTime]);
    return $stmt->fetchAll();
}