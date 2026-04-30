<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: index.html'); exit; }

$corso = trim($_POST['corso'] ?? 'lash-art-academy');
$nome = trim($_POST['nome'] ?? '');
$cognome = trim($_POST['cognome'] ?? '');
$telefono = trim($_POST['telefono'] ?? '');
$email = trim($_POST['email'] ?? '');
$citta = trim($_POST['citta'] ?? '');
$metodo = trim($_POST['metodo_pagamento'] ?? 'contrassegno');
$indirizzo = trim($_POST['indirizzo'] ?? '');
$cap = trim($_POST['cap'] ?? '');
$scala = trim($_POST['scala'] ?? '');

if (empty($nome) || empty($cognome) || empty($telefono)) { header('Location: index.html'); exit; }

try {
    $stmt = $pdo->prepare("INSERT INTO candidature (corso, nome, cognome, telefono, email, citta, metodo_pagamento, indirizzo, cap, scala) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$corso, $nome, $cognome, $telefono, $email, $citta, $metodo, $indirizzo, $cap, $scala]);
    $id = $pdo->lastInsertId();
    header("Location: grazie.php?id=$id");
} catch (PDOException $e) {
    echo "Errore: " . $e->getMessage();
}
