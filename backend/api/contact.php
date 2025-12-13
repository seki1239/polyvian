<?php
// backend/api/contact.php

// エラー設定
ini_set('display_errors', 0);
header('Content-Type: application/json');

// CORS設定 (本番環境のドメインに合わせて調整してください)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// データ取得
$input = json_decode(file_get_contents('php://input'), true);

$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$message = $input['message'] ?? '';

if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required.']);
    exit;
}

// メール送信設定
// ★★★ ここを受信したいメールアドレスに変更してください ★★★
$to = "info@polyvian.com"; 

$subject = "Contact from CogniVocab: " . $name;
$headers = "From: noreply@polyvian.com" . "\r\n" .
           "Reply-To: " . $email . "\r\n" .
           "X-Mailer: PHP/" . phpversion();

$body = "Name: $name\n";
$body .= "Email: $email\n\n";
$body .= "Message:\n$message\n";

// メール送信
if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email.']);
}
?>