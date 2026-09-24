<?php
/**
 * cors.php — Centralized CORS + Cross-Origin Session Cookie Handler
 *
 * Include this at the TOP of every public-facing PHP endpoint.
 * Handles:
 *   - Dynamic CORS: allows Cloudflare Pages domains + localhost dev
 *   - Session cookie: SameSite=None; Secure (required for cross-origin auth)
 *   - OPTIONS preflight: returns 204 and exits immediately
 */

$allowedPatterns = [
    '/^https:\/\/church-accounting\.pages\.dev$/',
    '/^https:\/\/[a-z0-9\-]+\.church-accounting\.pages\.dev$/',
    '/^https:\/\/[a-z0-9\-]+\.pages\.dev$/',
    '/^http:\/\/localhost(:\d+)?$/',
    '/^http:\/\/127\.0\.0\.1(:\d+)?$/',
];

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$originAllowed = false;
foreach ($allowedPatterns as $pattern) {
    if (preg_match($pattern, $origin)) {
        $originAllowed = true;
        break;
    }
}

if ($originAllowed) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
} else {
    // Fallback for direct curl/testing — no credentials
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Vary: Origin");

// Handle OPTIONS preflight immediately
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configure session cookie to work cross-origin (SameSite=None; Secure)
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400,   // 24 hours
        'path'     => '/',
        'domain'   => '',
        'secure'   => true,    // HTTPS only
        'httponly' => true,
        'samesite' => 'None',  // Required for cross-origin cookies
    ]);
}
?>
