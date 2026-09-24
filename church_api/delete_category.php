<?php
require_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once 'auth_check.php';
include_once 'db.php'; 

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    try {
        $query = "DELETE FROM categories WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":id", $data->id);

        if($stmt->execute()) {
            echo json_encode(array("status" => "success", "message" => "ลบหมวดหมู่สำเร็จ"));
        } else {
            echo json_encode(array("status" => "error", "message" => "ไม่สามารถลบหมวดหมู่ได้"));
        }
    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => "Database Error: " . $e->getMessage()));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "ไม่มีรหัสข้อมูล"));
}
?>
