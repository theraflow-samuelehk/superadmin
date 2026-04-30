<?php
require_once 'config.php';
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS candidature (
        id INT AUTO_INCREMENT PRIMARY KEY,
        corso VARCHAR(100) NOT NULL DEFAULT 'lash-art-academy',
        nome VARCHAR(100) NOT NULL,
        cognome VARCHAR(100) NOT NULL,
        telefono VARCHAR(30) NOT NULL,
        email VARCHAR(150) DEFAULT '',
        citta VARCHAR(100) NOT NULL,
        metodo_pagamento VARCHAR(20) NOT NULL,
        stato VARCHAR(20) DEFAULT 'nuovo',
        note TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "Tabella creata con successo!";
} catch (PDOException $e) {
    echo "Errore: " . $e->getMessage();
}
