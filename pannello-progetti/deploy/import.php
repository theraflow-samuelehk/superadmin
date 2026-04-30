<?php
session_start();
require_once 'config.php';
if (empty($_SESSION['authed'])) { header('Location: login.php'); exit; }

$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['data'])) {
    try {
        $data = json_decode($_POST['data'], true);
        if (!$data || !is_array($data)) throw new Exception('JSON non valido');
        $db = getDB();
        $stmt = $db->prepare('INSERT INTO kv_store (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = ?');
        $count = 0;
        foreach ($data as $k => $v) {
            $json = is_string($v) ? $v : json_encode($v);
            $stmt->execute([$k, $json, $json]);
            $count++;
        }
        $msg = "Importati $count record con successo!";
    } catch (Exception $e) {
        $msg = "Errore: " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Importa Dati</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#030014;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.wrap{width:100%;max-width:500px;text-align:center}
h1{font-size:20px;margin-bottom:8px}
p{color:rgba(255,255,255,.4);font-size:13px;margin-bottom:20px}
textarea{width:100%;height:200px;padding:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:12px;color:#fff;font-size:12px;font-family:monospace;outline:none;resize:vertical;margin-bottom:14px}
button{padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer}
.msg{margin-top:14px;padding:12px;border-radius:8px;background:rgba(34,197,94,.1);color:#22c55e;font-size:13px}
a{color:#7c3aed;margin-top:16px;display:inline-block;font-size:13px}
</style>
</head>
<body>
<div class="wrap">
  <h1>Importa Dati Locali</h1>
  <p>Incolla qui il JSON esportato dal Workspace locale</p>
  <?php if ($msg): ?><div class="msg"><?= htmlspecialchars($msg) ?></div><?php endif; ?>
  <form method="POST">
    <textarea name="data" placeholder='{"todos":[...],"tools":[...],...}'></textarea>
    <button type="submit">Importa</button>
  </form>
  <a href="index.php">&larr; Torna al Workspace</a>
</div>
</body>
</html>
