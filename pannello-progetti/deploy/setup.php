<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once 'config.php';
try {
    $db = getDB();
    $db->exec("CREATE TABLE IF NOT EXISTS kv_store (
        k VARCHAR(255) PRIMARY KEY,
        v LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "Database setup completato!";
} catch (Exception $e) {
    echo "Errore: " . $e->getMessage();
}
