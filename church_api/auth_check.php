<?php
require_once 'cors.php';
if (session_status() === PHP_SESSION_NONE) { session_start(); }


if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Please login first."]);
    exit;
}
?>
