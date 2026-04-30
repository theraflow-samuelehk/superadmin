<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'config.php';

$db = getDB();
$out = [];

try {
    $db->exec("CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        cognome VARCHAR(100) NOT NULL,
        email VARCHAR(150) DEFAULT '',
        telefono VARCHAR(30) NOT NULL,
        stato VARCHAR(30) DEFAULT 'nuovo',
        fonte VARCHAR(20) DEFAULT 'form',
        note TEXT,
        assegnato VARCHAR(50) DEFAULT '',
        prossimo_contatto DATETIME DEFAULT NULL,
        nr_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $out[] = "Tabella leads OK";
} catch (Exception $e) { $out[] = "leads: " . $e->getMessage(); }

// Migrazioni colonne (idempotenti)
$alters = [
    "ALTER TABLE leads ADD COLUMN email VARCHAR(150) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN fonte VARCHAR(20) DEFAULT 'form'",
    "ALTER TABLE leads ADD COLUMN assegnato VARCHAR(50) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN prossimo_contatto DATETIME DEFAULT NULL",
    "ALTER TABLE leads ADD COLUMN nr_count INT DEFAULT 0",
    "ALTER TABLE leads MODIFY COLUMN stato VARCHAR(30) DEFAULT 'nuovo'",
];
foreach ($alters as $sql) {
    try { $db->exec($sql); } catch(PDOException $e) {}
}

try {
    $db->exec("CREATE TABLE IF NOT EXISTS operatori (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $out[] = "Tabella operatori OK";
} catch (Exception $e) { $out[] = "operatori: " . $e->getMessage(); }

try {
    $db->exec("CREATE TABLE IF NOT EXISTS log_attivita (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT,
        operatore VARCHAR(50),
        azione VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_lead (lead_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $out[] = "Tabella log_attivita OK";
} catch (Exception $e) { $out[] = "log_attivita: " . $e->getMessage(); }

echo "<pre>" . implode("\n", $out) . "\n\nSetup completato.</pre>";
