<?php
// Esegui UNA SOLA VOLTA via SSH/CLI dal server:
//   php /home/u749757264/domains/darkviolet-bee-231154.hostingersite.com/public_html/tools/create-super-admin.php "email" "password"
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(403); exit("Solo da CLI\n"); }
if ($argc < 3) { fwrite(STDERR, "Uso: php create-super-admin.php <email> <password>\n"); exit(1); }

$email = $argv[1];
$password = $argv[2];

require __DIR__ . '/../includes/db.php';

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) { fwrite(STDERR, "Esiste già un utente con questa email\n"); exit(1); }

$stmt = $pdo->prepare('INSERT INTO users (tenant_id, email, password_hash, role) VALUES (NULL, ?, ?, "super_admin")');
$stmt->execute([$email, password_hash($password, PASSWORD_BCRYPT)]);
echo "Super admin creato: $email\n";
