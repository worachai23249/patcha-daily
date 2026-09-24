<?php
require_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");
// Cache หมวดหมู่ 30 วินาที (ข้อมูลไม่ค่อยเปลี่ยน)
header("Cache-Control: public, max-age=30");

require 'db.php';

try {
    $sql = "SELECT id, name, type, color FROM categories ORDER BY type ASC, id ASC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results);
} catch(PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
