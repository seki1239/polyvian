<?php
require_once __DIR__ . '/../vendor/autoload.php'; // Composerのオートロードを読み込む
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// .envファイルを読み込むための設定
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// JWTの秘密鍵（環境変数から取得、またはデフォルト値を設定）
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'your_super_secret_key');
// JWTの発行者
define('JWT_ISSUER', $_ENV['JWT_ISSUER'] ?? 'polyvian.com');
// JWTの有効期限（秒）
define('JWT_EXPIRATION_SECONDS', $_ENV['JWT_EXPIRATION_SECONDS'] ?? 3600); // 1時間

function generateJwtToken($userId, $username) {
    $issuedAt = time();
    $expirationTime = $issuedAt + JWT_EXPIRATION_SECONDS;

    $payload = [
        'iss' => JWT_ISSUER,
        'aud' => JWT_ISSUER, // Audience も Issuer と同じにする
        'iat' => $issuedAt,
        'exp' => $expirationTime,
        'user_id' => $userId,
        'username' => $username
    ];

    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

function verifyJwtToken($token) {
    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
        return $decoded;
    } catch (Exception $e) {
        // エラーログを出力するなど、必要に応じて処理を追加
        error_log("JWT Verification Failed: " . $e->getMessage());
        return false;
    }
}

// AuthorizationヘッダーからBearerトークンを取得するヘルパー関数
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}