<?php
require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/db.php';

require_super_admin();
csrf_check();

$userId = (int)($_POST['user_id'] ?? 0);
if ($userId <= 0) { http_response_code(400); exit('user_id mancante'); }

$stmt = $pdo->prepare('SELECT id, tenant_id, email, name, role FROM users WHERE id = ? AND role = "admin"');
$stmt->execute([$userId]);
$target = $stmt->fetch();
if (!$target) { http_response_code(404); exit('Utente non trovato'); }

$_SESSION['impersonating_as'] = $target;
header('Location: /admin/');
exit;
