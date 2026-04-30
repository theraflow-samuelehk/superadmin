<?php
declare(strict_types=1);

$candidates = [
    __DIR__ . '/config.local.php',
    '/home/u749757264/config-reviewbooster.php',
];
if ($env = getenv('REVIEWBOOST_CONFIG')) {
    array_unshift($candidates, $env);
}

$configPath = null;
foreach ($candidates as $c) {
    if ($c && is_file($c)) { $configPath = $c; break; }
}
if (!$configPath) {
    http_response_code(500);
    exit('Configurazione mancante. Contatta l\'amministratore.');
}
$config = require $configPath;

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db']['host'], $config['db']['name']),
        $config['db']['user'],
        $config['db']['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    error_log('DB connection failed: ' . $e->getMessage());
    exit('Servizio temporaneamente non disponibile.');
}
