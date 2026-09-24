<?php
// ไฟล์ db.php สำหรับเชื่อมต่อ MySQL ด้วย PDO
// Clever Cloud จะ inject environment variables ให้อัตโนมัติ
// ถ้ารันใน local (XAMPP) จะใช้ fallback ค่า localhost
$host     = getenv('MYSQL_ADDON_HOST')     ?: 'localhost';
$dbname   = getenv('MYSQL_ADDON_DB')       ?: 'church_db';
$username = getenv('MYSQL_ADDON_USER')     ?: 'root';
$password = getenv('MYSQL_ADDON_PASSWORD') ?: '';

try {
    $conn = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8",
        $username,
        $password,
        [
            PDO::ATTR_PERSISTENT => true,          // ใช้ connection เดิมซ้ำ (เร็วขึ้น)
            PDO::ATTR_ERRMODE    => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT    => 5,             // หมดเวลา 5 วินาที
        ]
    );
} catch(PDOException $e) {
    http_response_code(503);
    echo json_encode(["error" => $e->getMessage()]);
    exit;
}
?>