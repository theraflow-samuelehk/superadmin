<?php
// panels-hidden.php — endpoint pubblico per la lista admin nascosti dallo switcher.
// GET: restituisce {hidden: ["host1.com", ...]} con CORS aperto (qualsiasi admin puo' leggere).
// POST: aggiorna la lista, richiede sessione autenticata workspace.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once 'config.php';

try {
    $db = getDB();
    $db->exec("CREATE TABLE IF NOT EXISTS kv_store (k VARCHAR(255) PRIMARY KEY, v LONGTEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['hidden' => [], 'error' => 'db_init']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare('SELECT v FROM kv_store WHERE k = ?');
    $stmt->execute(['panels_hidden']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $hidden = $row ? json_decode($row['v'], true) : [];
    if (!is_array($hidden)) $hidden = [];
    echo json_encode(['hidden' => array_values($hidden)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    session_start();
    if (empty($_SESSION['authed'])) { http_response_code(401); echo json_encode(['ok' => false, 'error' => 'auth']); exit; }

    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $hidden = $data['hidden'] ?? [];
    if (!is_array($hidden)) $hidden = [];
    $hidden = array_values(array_unique(array_filter(array_map(function ($h) {
        return strtolower(trim((string)$h));
    }, $hidden))));

    $stmt = $db->prepare('INSERT INTO kv_store (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
    $stmt->execute(['panels_hidden', json_encode($hidden)]);
    echo json_encode(['ok' => true, 'hidden' => $hidden]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'method']);
