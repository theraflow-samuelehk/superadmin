<?php
session_start();
require_once 'config.php';
if (empty($_SESSION['authed'])) { http_response_code(401); echo '{"ok":false,"error":"auth"}'; exit; }

header('Content-Type: application/json');

$project = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['project'] ?? '');
if ($project === '' || strlen($project) > 48) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid project key']);
    exit;
}

if (empty($_FILES['files']) || !is_array($_FILES['files']['name'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No files received']);
    exit;
}

$uploadsRoot = __DIR__ . '/uploads';
if (!is_dir($uploadsRoot)) @mkdir($uploadsRoot, 0755, true);
// Self-heal: ensure .htaccess protects uploads folder
$htFile = $uploadsRoot . '/.htaccess';
if (!file_exists($htFile)) {
    @file_put_contents($htFile, "<FilesMatch \"\\.(php|phtml|phar|pht|cgi|py|pl|rb|sh|htaccess)$\">\n  Require all denied\n</FilesMatch>\nOptions -ExecCGI\nRemoveHandler .php .phtml .phar .pht\nAddType text/plain .php .phtml .phar .pht\n");
}

$uploadsDir = $uploadsRoot . '/' . $project;
if (!is_dir($uploadsDir)) {
    if (!mkdir($uploadsDir, 0755, true) && !is_dir($uploadsDir)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'mkdir failed']);
        exit;
    }
}

$blockedExt = ['php','phtml','phar','pht','cgi','py','pl','rb','sh','htaccess','exe','bat'];
$saved = [];
$errors = [];

foreach ($_FILES['files']['name'] as $i => $origName) {
    $err = $_FILES['files']['error'][$i];
    if ($err === UPLOAD_ERR_NO_FILE) continue;
    if ($err !== UPLOAD_ERR_OK) {
        $errors[] = ['name' => $origName, 'error' => 'upload_err_' . $err];
        continue;
    }

    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    if (in_array($ext, $blockedExt, true)) {
        $errors[] = ['name' => $origName, 'error' => 'blocked_extension'];
        continue;
    }

    $base = pathinfo($origName, PATHINFO_FILENAME);
    $baseSafe = preg_replace('/[^a-zA-Z0-9._-]/', '_', $base);
    if ($baseSafe === '') $baseSafe = 'file';
    $extSafe = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
    $stored = time() . '-' . bin2hex(random_bytes(3)) . '-' . substr($baseSafe, 0, 60) . ($extSafe ? '.' . $extSafe : '');
    $target = $uploadsDir . '/' . $stored;

    if (!move_uploaded_file($_FILES['files']['tmp_name'][$i], $target)) {
        $errors[] = ['name' => $origName, 'error' => 'move_failed'];
        continue;
    }

    $saved[] = [
        'name' => $origName,
        'file' => $stored,
        'size' => filesize($target),
        'url'  => 'uploads/' . rawurlencode($project) . '/' . rawurlencode($stored),
        'mtime' => filemtime($target),
    ];
}

echo json_encode(['ok' => true, 'saved' => $saved, 'errors' => $errors]);
