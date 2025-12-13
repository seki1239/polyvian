<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // 本番環境では特定のオリジンに制限する
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once __DIR__ . '/../config/database.php'; // DB接続設定ファイル
require_once __DIR__ . '/../utils/jwt.php'; // JWTユーティリティファイル

// データベース接続
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET, DB_USER, DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        handleRegister($pdo, $input);
        break;
    case 'login':
        handleLogin($pdo, $input);
        break;
    case 'me':
        handleMe($pdo);
        break;
    default:
        http_response_code(400);
        echo json_encode(["message" => "Invalid action"]);
        break;
}

function handleRegister($pdo, $input) {
    if (!isset($input['username'], $input['password'])) {
        http_response_code(400);
        echo json_encode(["message" => "Username and password are required"]);
        return;
    }

    $username = $input['username'];
    $password = password_hash($input['password'], PASSWORD_BCRYPT);

    try {
        $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        $stmt->execute([$username, $password]);

        $userId = $pdo->lastInsertId();
        $token = generateJwtToken($userId, $username);

        echo json_encode(["message" => "User registered successfully", "token" => $token, "user" => ["id" => $userId, "username" => $username]]);
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') { // Duplicate entry
            http_response_code(409);
            echo json_encode(["message" => "Username already exists"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Registration failed: " . $e->getMessage()]);
        }
    }
}

function handleLogin($pdo, $input) {
    if (!isset($input['username'], $input['password'])) {
        http_response_code(400);
        echo json_encode(["message" => "Username and password are required"]);
        return;
    }

    $username = $input['username'];
    $password = $input['password'];

    try {
        $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $token = generateJwtToken($user['id'], $user['username']);
            echo json_encode(["message" => "Login successful", "token" => $token, "user" => ["id" => $user['id'], "username" => $user['username']]]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Invalid credentials"]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Login failed: " . $e->getMessage()]);
    }
}

function handleMe($pdo) {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(["message" => "Authorization token not provided"]);
        return;
    }

    $decoded = verifyJwtToken($token);
    if ($decoded) {
        $userId = $decoded->user_id;
        try {
            $stmt = $pdo->prepare("SELECT id, username FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            if ($user) {
                echo json_encode(["message" => "Token valid", "user" => $user]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "User not found"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Error fetching user data: " . $e->getMessage()]);
        }
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid or expired token"]);
    }
}