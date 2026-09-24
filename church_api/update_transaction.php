<?php
require_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once 'auth_check.php';
include_once 'db.php'; 

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->transaction_date) && !empty($data->type) && !empty($data->description) && isset($data->amount)) {
    
    try {
        $query = "UPDATE transactions SET transaction_date=:transaction_date, type=:type, description=:description, amount=:amount, note=:note, image_url=:image_url WHERE id=:id";
        $stmt = $conn->prepare($query);

        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":transaction_date", $data->transaction_date);
        $stmt->bindParam(":type", $data->type);
        $stmt->bindParam(":description", $data->description);
        $stmt->bindParam(":amount", $data->amount);
        
        $note = isset($data->note) ? $data->note : null;
        $image_url = isset($data->image_url) ? $data->image_url : null;
        
        $stmt->bindParam(":note", $note);
        $stmt->bindParam(":image_url", $image_url);

        if($stmt->execute()) {
            echo json_encode(array("status" => "success", "message" => "อัปเดตข้อมูลสำเร็จ"));
        } else {
            echo json_encode(array("status" => "error", "message" => "ไม่สามารถอัปเดตข้อมูลได้"));
        }
    } catch (Exception $e) {
        // ดักจับ Error แล้วส่งไปให้ React โชว์!
        echo json_encode(array("status" => "error", "message" => "Database Error: " . $e->getMessage()));
    }
    
} else {
    echo json_encode(array("status" => "error", "message" => "ข้อมูลไม่ครบถ้วน"));
}
?>