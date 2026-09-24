<?php
require_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

require_once 'auth_check.php';
include_once 'db.php'; 

// ตรวจสอบและแก้ไขชนิดข้อมูลของคอลัมน์รูปภาพอัตโนมัติ (เผื่อข้อมูลยาวเกิน TEXT = 65KB ทำให้เซฟไม่ติด)
try {
    $conn->exec("ALTER TABLE transactions MODIFY image_url LONGTEXT;");
} catch(PDOException $e) {
    // ปล่อยผ่านถ้าเปลี่ยนไม่ได้
}

$data = json_decode(file_get_contents("php://input"));

if(is_array($data)) {
    // บันทึกหลายรายการพร้อมกัน (Import)
    $successCount = 0;
    $errorCount = 0;
    
    $conn->beginTransaction();
    
    try {
        $query = "INSERT INTO transactions (transaction_date, type, description, amount, note, image_url) VALUES (:transaction_date, :type, :description, :amount, :note, :image_url)";
        $stmt = $conn->prepare($query);
        
        foreach($data as $tx) {
            if(!empty($tx->transaction_date) && !empty($tx->type) && !empty($tx->description) && isset($tx->amount)) {
                $stmt->bindParam(":transaction_date", $tx->transaction_date);
                $stmt->bindParam(":type", $tx->type);
                $stmt->bindParam(":description", $tx->description);
                $stmt->bindParam(":amount", $tx->amount);
                
                $note = isset($tx->note) ? $tx->note : null;
                $image_url = isset($tx->image_url) ? $tx->image_url : null;
                
                $stmt->bindParam(":note", $note);
                $stmt->bindParam(":image_url", $image_url);
                
                if($stmt->execute()) {
                    $successCount++;
                } else {
                    $errorCount++;
                }
            } else {
                $errorCount++;
            }
        }
        
        $conn->commit();
        echo json_encode(array("status" => "success", "message" => "นำเข้าข้อมูลสำเร็จ $successCount รายการ, ล้มเหลว $errorCount รายการ"));
        
    } catch (Exception $e) {
        $conn->rollBack();
        echo json_encode(array("status" => "error", "message" => "Database Error: " . $e->getMessage()));
    }

} else if(!empty($data->transaction_date) && !empty($data->type) && !empty($data->description) && isset($data->amount)) {
    // บันทึกรายการเดียว (ของเดิม)
    try {
        $query = "INSERT INTO transactions (transaction_date, type, description, amount, note, image_url) VALUES (:transaction_date, :type, :description, :amount, :note, :image_url)";
        $stmt = $conn->prepare($query);

        $stmt->bindParam(":transaction_date", $data->transaction_date);
        $stmt->bindParam(":type", $data->type);
        $stmt->bindParam(":description", $data->description);
        $stmt->bindParam(":amount", $data->amount);
        
        $note = isset($data->note) ? $data->note : null;
        $image_url = isset($data->image_url) ? $data->image_url : null;
        
        $stmt->bindParam(":note", $note);
        $stmt->bindParam(":image_url", $image_url);

        if($stmt->execute()) {
            require_once 'send_push.php';
            $titleMsg = ($data->type == 'INCOME') ? "📥 เงินเข้าใหม่!" : "📤 เงินออก";
            $amountMsg = number_format($data->amount, 2);
            $descMsg = mb_substr($data->description, 0, 30, 'UTF-8');
            sendOneSignalPush($titleMsg, "รายการ " . $descMsg . " จำนวน ฿" . $amountMsg);

            echo json_encode(array("status" => "success", "message" => "บันทึกข้อมูลสำเร็จ"));
        } else {
            echo json_encode(array("status" => "error", "message" => "ไม่สามารถบันทึกข้อมูลได้: " . implode(", ", $stmt->errorInfo())));
        }
    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => "Database Error: " . $e->getMessage()));
    }

} else {
    echo json_encode(array("status" => "error", "message" => "ข้อมูลไม่ครบถ้วนหรือไม่ถูกรูปแบบ"));
}
?>