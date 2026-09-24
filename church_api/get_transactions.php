<?php
require_once 'cors.php';
header("Content-Type: application/json; charset=UTF-8");

require 'db.php';

try {
$sql = "SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC";
$stmt = $conn->prepare($sql);
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
$json = json_encode($results, JSON_INVALID_UTF8_SUBSTITUTE);
if ($json === false) {
    echo json_encode(["error" => json_last_error_msg()]);
} else {
    echo $json;
}
} catch(PDOException $e) {
echo json_encode(["error" => $e->getMessage()]);
}
?>