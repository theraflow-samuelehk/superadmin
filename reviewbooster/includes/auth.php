<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function current_user(): ?array {
    return $_SESSION['user'] ?? null;
}

function impersonating_as(): ?array {
    return $_SESSION['impersonating_as'] ?? null;
}

function effective_user(): ?array {
    return impersonating_as() ?? current_user();
}

function require_login(): array {
    $u = current_user();
    if (!$u) {
        header('Location: /login.php');
        exit;
    }
    return $u;
}

function require_super_admin(): array {
    $u = require_login();
    if (($u['role'] ?? null) !== 'super_admin') {
        http_response_code(403);
        exit('Accesso negato.');
    }
    return $u;
}

function require_admin_area(): array {
    $u = require_login();
    $eff = effective_user();
    if (($eff['role'] ?? null) === 'super_admin' && !impersonating_as()) {
        header('Location: /super/');
        exit;
    }
    return $eff;
}

function csrf_token(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_check(): void {
    $sent = $_POST['csrf'] ?? '';
    if (!hash_equals($_SESSION['csrf'] ?? '', $sent)) {
        http_response_code(400);
        exit('Richiesta non valida (CSRF).');
    }
}
