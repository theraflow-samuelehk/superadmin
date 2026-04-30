<?php
session_start();
require_once 'config.php';
if (empty($_SESSION['authed'])) { http_response_code(401); echo '{}'; exit; }

header('Content-Type: application/json');

try {
    $db = getDB();
    // Auto-create kv_store table if missing
    $db->exec("CREATE TABLE IF NOT EXISTS kv_store (
        k VARCHAR(255) PRIMARY KEY,
        v LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB init: '.$e->getMessage()]);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $key = $_GET['key'] ?? '';
        if ($key === '__all__') {
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
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $key = $data['key'] ?? '';
        $val = $data['value'] ?? null;
        if (!$key) { echo json_encode(['ok'=>false,'error'=>'missing key']); exit; }
        $stmt = $db->prepare('INSERT INTO kv_store (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
        $json = json_encode($val);
        $stmt->execute([$key, $json]);
        echo json_encode(['ok'=>true]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()]);
}
