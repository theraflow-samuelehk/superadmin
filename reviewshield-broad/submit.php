<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once 'config.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

$nome = trim($data['nome'] ?? '');
$cognome = trim($data['cognome'] ?? '');
$telefono = trim($data['telefono'] ?? '');
$email = trim($data['email'] ?? '');
$attivita = trim($data['attivita'] ?? '');

if (!$nome || !$cognome || !$telefono || !$email) {
    echo json_encode(['ok' => false, 'error' => 'Compila tutti i campi: nome, cognome, email e telefono']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'error' => 'Email non valida']);
    exit;
}

try {
    $db = getDB();
    try { $db->exec("ALTER TABLE leads ADD COLUMN email VARCHAR(150) DEFAULT ''"); } catch (PDOException $e) {}
    try { $db->exec("ALTER TABLE leads ADD COLUMN fonte VARCHAR(20) DEFAULT 'form'"); } catch (PDOException $e) {}
    try { $db->exec("ALTER TABLE leads ADD COLUMN attivita VARCHAR(200) DEFAULT ''"); } catch (PDOException $e) {}

    $stmt = $db->prepare('INSERT INTO leads (nome, cognome, telefono, email, attivita, fonte, stato) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$nome, $cognome, $telefono, $email, $attivita, 'form', 'nuovo']);
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    echo json_encode(['ok' => false, 'error' => 'Errore server']);
}
