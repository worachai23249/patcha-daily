<?php
// ไฟล์ตั้งค่ารหัสผ่านเบื้องต้น
$ADMIN_EMAIL = "admin@gmail.com";
$ADMIN_PASSWORD = "123456";

// ป้องกัน Session Hijacking & Fixation
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
?>
