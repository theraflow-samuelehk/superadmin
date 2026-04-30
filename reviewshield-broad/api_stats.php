<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';
try {
    $db = getDB();
    $totali = $db->query("SELECT COUNT(*) FROM leads")->fetchColumn();
    $nuovi = $db->query("SELECT COUNT(*) FROM leads WHERE stato='nuovo'")->fetchColumn();
    $oggi = $db->query("SELECT COUNT(*) FROM leads WHERE DATE(created_at)=CURDATE()")->fetchColumn();
    $contattati = $db->query("SELECT COUNT(*) FROM leads WHERE stato='contattato'")->fetchColumn();
    $confermati = $db->query("SELECT COUNT(*) FROM leads WHERE stato='confermato'")->fetchColumn();
    $completati = $db->query("SELECT COUNT(*) FROM leads WHERE stato='completato'")->fetchColumn();
    echo json_encode([
        'totali' => (int)$totali,
        'nuovi' => (int)$nuovi,
        'oggi' => (int)$oggi,
        'contattato' => (int)$contattati,
        'confermato' => (int)$confermati,
        'completato' => (int)$completati,
    ]);
} catch (Exception $e) {
    echo json_encode(['totali'=>0,'nuovi'=>0,'oggi'=>0]);
}
