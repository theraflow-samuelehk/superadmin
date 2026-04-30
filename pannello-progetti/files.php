<?php
session_start();
require_once 'config.php';
if (empty($_SESSION['authed'])) { http_response_code(401); echo '{"ok":false}'; exit; }

header('Content-Type: application/json');

$project = preg_replace('/[^a-zA-Z0-9_-]/', '', $_REQUEST['project'] ?? '');
if ($project === '' || strlen($project) > 48) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid project']);
    exit;
}

$dir = __DIR__ . '/uploads/' . $project;

$method = $_SERVER['REQUEST_METHOD'];

// DELETE (POST with _method=DELETE works everywhere, true DELETE kept as fallback)
$isDelete = ($method === 'DELETE') || ($method === 'POST' && ($_POST['_method'] ?? '') === 'DELETE');

if ($isDelete) {
    $file = $_REQUEST['file'] ?? '';
    if (!preg_match('/^[a-zA-Z0-9._-]+$/', $file) || strpos($file, '..') !== false) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid file']);
        exit;
    }
    $path = $dir . '/' . $file;
    if (is_file($path)) @unlink($path);
    echo json_encode(['ok' => true]);
    exit;
}

// GET list
$files = [];
if (is_dir($dir)) {
    foreach (scandir($dir) as $f) {
        if ($f === '.' || $f === '..' || $f[0] === '.') continue;
        $path = $dir . '/' . $f;
        if (!is_file($path)) continue;
        // Original name = strip "<timestamp>-<hex>-" prefix
        $display = preg_replace('/^\d+-[a-f0-9]{6}-/', '', $f);
        $files[] = [
            'name' => $display,
            'file' => $f,
            'size' => filesize($path),
            'url'  => 'uploads/' . rawurlencode($project) . '/' . rawurlencode($f),
            'mtime' => filemtime($path),
        ];
    }
    usort($files, function ($a, $b) { return $b['mtime'] - $a['mtime']; });
}
echo json_encode(['ok' => true, 'files' => $files]);
