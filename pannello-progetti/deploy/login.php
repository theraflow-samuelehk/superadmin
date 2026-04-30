<?php
session_start();
require_once 'config.php';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (($_POST['pass'] ?? '') === 'Digital2026') {
        $_SESSION['authed'] = true;
        header('Location: index.php');
        exit;
    }
    $error = 'Password errata';
}
if (!empty($_SESSION['authed'])) { header('Location: index.php'); exit; }
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#030014">
<title>Workspace - Login</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#030014;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.login{width:100%;max-width:360px;padding:40px 24px;text-align:center}
.login svg{width:48px;height:48px;margin-bottom:20px}
.login h1{font-size:22px;font-weight:800;margin-bottom:6px}
.login p{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:28px}
.login input{width:100%;padding:14px 18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:12px;color:#fff;font-size:15px;font-family:'Inter',sans-serif;outline:none;margin-bottom:14px;transition:border-color .2s;text-align:center;letter-spacing:2px}
.login input:focus{border-color:rgba(124,58,237,.4)}
.login button{width:100%;padding:14px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:box-shadow .2s}
.login button:hover{box-shadow:0 0 30px rgba(124,58,237,.3)}
.error{color:#ef4444;font-size:12px;margin-bottom:12px}
</style>
</head>
<body>
<form class="login" method="POST">
  <svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#7c3aed" stroke-width="1.5"/><circle cx="14" cy="14" r="6" stroke="#06b6d4" stroke-width="1.5"/><circle cx="14" cy="14" r="2" fill="#06b6d4"/></svg>
  <h1>Workspace</h1>
  <p>Inserisci la password per accedere</p>
  <?php if ($error): ?><div class="error"><?= $error ?></div><?php endif; ?>
  <input type="password" name="pass" placeholder="Password" autofocus required>
  <button type="submit">Accedi</button>
</form>
</body>
</html>
