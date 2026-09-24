<?php
require_once 'cors.php';
require 'auth_config.php';
header("Content-Type: application/json; charset=UTF-8");


$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid request. Please provide email and password."]);
    exit;
}

if ($data['email'] === $ADMIN_EMAIL && $data['password'] === $ADMIN_PASSWORD) {
    session_start();
    session_regenerate_id(true); // ป้องกัน Fixation

    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_email'] = $data['email'];

    echo json_encode(["status" => "success", "message" => "Logged in successfully"]);
} else {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "อีเมลหรือรหัสผ่านไม่ถูกต้อง"]);
}
?>
