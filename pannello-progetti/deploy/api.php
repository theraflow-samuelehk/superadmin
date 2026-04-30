<?php
session_start();
require_once 'config.php';
if (empty($_SESSION['authed'])) { http_response_code(401); echo '{}'; exit; }

header('Content-Type: application/json');
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $key = $_GET['key'] ?? '';
    if ($key === '__all__') {
        // Return all keys for initial sync
        $stmt = $db->query('SELECT k, v FROM kv_store');
        $result = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $result[$row['k']] = $row['v'];
        }
        echo json_encode($result);
        exit;
    }
    if (!$key) { echo 'null'; exit; }
    $stmt = $db->prepare('SELECT v FROM kv_store WHERE k = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo $row ? $row['v'] : 'null';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $key = $data['key'] ?? '';
    $val = $data['value'] ?? null;
    if (!$key) { echo '{"ok":false}'; exit; }
    $stmt = $db->prepare('INSERT INTO kv_store (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = ?');
    $json = json_encode($val);
    $stmt->execute([$key, $json, $json]);
    echo '{"ok":true}';
}
