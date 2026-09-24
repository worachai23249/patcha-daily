<?php
require_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

require 'db.php';

$last_id = isset($_GET['last_id']) ? intval($_GET['last_id']) : 0;

try {
    $sql = "SELECT id, transaction_date, type, description, amount, created_at
            FROM transactions
            WHERE id > :last_id
            ORDER BY id ASC
            LIMIT 20";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':last_id', $last_id, PDO::PARAM_INT);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results, JSON_INVALID_UTF8_SUBSTITUTE);
} catch(PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
