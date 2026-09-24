<?php
require_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Max-Age: 3600");

// เปลี่ยนชื่อเรียกไฟล์ฐานข้อมูลให้ตรงกับของคุณ (db.php)
require_once 'auth_check.php';
include_once 'db.php'; 

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    $query = "DELETE FROM transactions WHERE id=:id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":id", $data->id);

    if($stmt->execute()) {
        echo json_encode(array("status" => "success", "message" => "ลบข้อมูลสำเร็จ"));
    } else {
        echo json_encode(array("status" => "error", "message" => "ไม่สามารถลบข้อมูลได้"));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "ไม่พบ ID ที่ต้องการลบ"));
}
?>