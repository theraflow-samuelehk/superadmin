<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
require_once 'config.php';

$project_name = 'ReviewShield';
$accent = '#059669';
$session_key = 'admin_logged_reviewshield';
$reminder_template = "Ciao {NOME}, ti scriviamo da ReviewShield.\n\nNei giorni scorsi abbiamo provato a contattarti ma non siamo riusciti a raggiungerti. Avevi richiesto l'analisi gratuita delle recensioni Google sulla tua attivita e volevamo ricordarti che l'offerta e ancora valida.\n\nSe sei ancora interessato, rispondi a questo messaggio indicandoci un orario comodo: ti richiameremo per mostrarti il report dell'analisi e spiegarti come possiamo aiutarti a rimuovere le recensioni negative. Proveremo comunque a ricontattarti noi nei prossimi giorni.\n\nGrazie e a presto!";

function wa_link($phone, $text='') {
    $d = preg_replace('/[^0-9]/','', (string)$phone);
    if (substr($d,0,2)==='00') $d = substr($d,2);
    if (preg_match('/^3\d{8,9}$/', $d)) $d = '39'.$d;
    $url = 'https://web.whatsapp.com/send?phone='.$d;
    if ($text !== '') $url .= '&text='.rawurlencode($text);
    return $url;
}

$pdo = getDB();

// Auto-migrazioni leads (idempotenti)
$alters = [
    "ALTER TABLE leads ADD COLUMN email VARCHAR(150) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN fonte VARCHAR(20) DEFAULT 'form'",
    "ALTER TABLE leads ADD COLUMN note TEXT",
    "ALTER TABLE leads ADD COLUMN assegnato VARCHAR(50) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN prossimo_contatto DATETIME DEFAULT NULL",
    "ALTER TABLE leads ADD COLUMN nr_count INT DEFAULT 0",
    "ALTER TABLE leads ADD COLUMN attivita VARCHAR(200) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN indirizzo VARCHAR(255) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN cap VARCHAR(10) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN citta VARCHAR(100) DEFAULT ''",
    "ALTER TABLE leads ADD COLUMN provincia VARCHAR(10) DEFAULT ''",
    "ALTER TABLE leads MODIFY COLUMN stato VARCHAR(30) DEFAULT 'nuovo'",
];
foreach ($alters as $sql) { try { $pdo->exec($sql); } catch(PDOException $e) {} }

try { $pdo->exec("CREATE TABLE IF NOT EXISTS operatori (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(50) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"); } catch(PDOException $e) {}
try { $pdo->exec("CREATE TABLE IF NOT EXISTS log_attivita (id INT AUTO_INCREMENT PRIMARY KEY, lead_id INT, operatore VARCHAR(50), azione VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_lead (lead_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"); } catch(PDOException $e) {}
try { $pdo->exec("CREATE TABLE IF NOT EXISTS chiamate_registrate (id INT AUTO_INCREMENT PRIMARY KEY, lead_id INT NOT NULL, operatore VARCHAR(50) DEFAULT '', filename VARCHAR(255) NOT NULL, durata INT DEFAULT 0, size_bytes BIGINT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_lead (lead_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"); } catch(PDOException $e) {}
try { $pdo->exec("CREATE TABLE IF NOT EXISTS sop (id INT AUTO_INCREMENT PRIMARY KEY, titolo VARCHAR(255) NOT NULL, link VARCHAR(500) NOT NULL, descrizione TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"); } catch(PDOException $e) {}

if (!is_dir(__DIR__.'/uploads')) @mkdir(__DIR__.'/uploads', 0755, true);
if (!is_dir(__DIR__.'/uploads/calls')) @mkdir(__DIR__.'/uploads/calls', 0755, true);

// Auth
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_password'])) {
    if ($_POST['login_password'] === ADMIN_PASS) $_SESSION[$session_key] = true;
}
if (isset($_GET['logout'])) { unset($_SESSION[$session_key]); header('Location: admin.php'); exit; }
$logged = !empty($_SESSION[$session_key]);

// Actions
$qs = isset($_GET['filter'])?'?filter='.$_GET['filter']:'';
if ($logged && isset($_POST['update_stato'])) {
    $old = $pdo->prepare("SELECT stato,nr_count FROM leads WHERE id=?"); $old->execute([$_POST['cid']]); $oldRow=$old->fetch(PDO::FETCH_ASSOC);
    $oldStato = $oldRow['stato'] ?? '';
    $newStato = $_POST['nuovo_stato'];
    $nr = (int)($oldRow['nr_count'] ?? 0);
    if ($newStato === 'non_risponde') {
        $nr++;
        $pdo->prepare("UPDATE leads SET stato=?, nr_count=? WHERE id=?")->execute([$newStato, $nr, $_POST['cid']]);
        $pdo->prepare("INSERT INTO log_attivita (lead_id,operatore,azione) VALUES (?,?,?)")->execute([$_POST['cid'],$_POST['operatore_azione']??'','Tentativo NR #'.$nr.' - non risponde']);
    } else {
        if (in_array($newStato, ['contattato','confermato','completato'], true)) $nr = 0;
        $pdo->prepare("UPDATE leads SET stato=?, nr_count=? WHERE id=?")->execute([$newStato, $nr, $_POST['cid']]);
        $pdo->prepare("INSERT INTO log_attivita (lead_id,operatore,azione) VALUES (?,?,?)")->execute([$_POST['cid'],$_POST['operatore_azione']??'','Stato: '.$oldStato.' -> '.$newStato]);
    }
    header('Location: admin.php'.$qs.'#lead-'.$_POST['cid']); exit;
}
if ($logged && isset($_POST['update_note'])) {
    $pdo->prepare("UPDATE leads SET note=? WHERE id=?")->execute([$_POST['note'], $_POST['cid']]);
    $pdo->prepare("INSERT INTO log_attivita (lead_id,operatore,azione) VALUES (?,?,?)")->execute([$_POST['cid'],$_POST['operatore_azione']??'','Nota aggiornata']);
    header('Location: admin.php'.$qs.'#lead-'.$_POST['cid']); exit;
}
if ($logged && isset($_POST['update_assegnato'])) {
    $pdo->prepare("UPDATE leads SET assegnato=? WHERE id=?")->execute([$_POST['assegnato'], $_POST['cid']]);
    $pdo->prepare("INSERT INTO log_attivita (lead_id,operatore,azione) VALUES (?,?,?)")->execute([$_POST['cid'],$_POST['assegnato'],'Lead assegnato a '.$_POST['assegnato']]);
    header('Location: admin.php'.$qs.'#lead-'.$_POST['cid']); exit;
}
if ($logged && isset($_POST['update_prossimo'])) {
    $val = !empty($_POST['prossimo_contatto']) ? $_POST['prossimo_contatto'] : null;
    $pdo->prepare("UPDATE leads SET prossimo_contatto=? WHERE id=?")->execute([$val, $_POST['cid']]);
    header('Location: admin.php'.$qs.'#lead-'.$_POST['cid']); exit;
}
if ($logged && isset($_POST['dismiss_reminder'])) {
    $pdo->prepare("UPDATE leads SET prossimo_contatto=NULL WHERE id=?")->execute([$_POST['cid']]);
    header('Location: admin.php'.$qs); exit;
}
if ($logged && isset($_POST['update_anagrafica'])) {
    $pdo->prepare("UPDATE leads SET nome=?, cognome=?, email=?, telefono=?, attivita=? WHERE id=?")
        ->execute([trim($_POST['nome']??''), trim($_POST['cognome']??''), trim($_POST['email']??''), trim($_POST['telefono']??''), trim($_POST['attivita']??''), $_POST['cid']]);
    $pdo->prepare("INSERT INTO log_attivita (lead_id,operatore,azione) VALUES (?,?,?)")->execute([$_POST['cid'],$_POST['operatore_azione']??'','Anagrafica aggiornata']);
    header('Location: admin.php'.$qs.'#lead-'.$_POST['cid']); exit;
}
if ($logged && isset($_POST['update_indirizzo_lead'])) {
    $pdo->prepare("UPDATE leads SET indirizzo=?, cap=?, citta=?, provincia=? WHERE id=?")
        ->execute([trim($_POST['indirizzo']??''), trim($_POST['cap']??''), trim($_POST['citta_lead']??''), trim($_POST['provincia_lead']??''), $_POST['cid']]);
    $pdo->prepare("INSERT INTO log_attivita (lead_id,operatore,azione) VALUES (?,?,?)")->execute([$_POST['cid'],$_POST['operatore_azione']??'','Indirizzo aggiornato']);
    header('Location: admin.php'.$qs.'#lead-'.$_POST['cid']); exit;
}
if ($logged && isset($_POST['add_manual'])) {
    $tel = trim($_POST['m_telefono']??'');
    $tel_clean = preg_replace('/[^0-9]/', '', $tel);
    $existing = $pdo->prepare("SELECT id FROM leads WHERE REPLACE(REPLACE(REPLACE(telefono,' ',''),'+',''),'-','') LIKE ?");
    $existing->execute(['%'.$tel_clean.'%']);
    $found = $existing->fetch(PDO::FETCH_ASSOC);
    if ($found) {
        $pdo->prepare("UPDATE leads SET fonte='whatsapp' WHERE id=?")->execute([$found['id']]);
    } else {
        $pdo->prepare("INSERT INTO leads (nome, cognome, telefono, email, attivita, fonte, stato) VALUES (?, ?, ?, ?, ?, 'whatsapp', 'nuovo')")
            ->execute([trim($_POST['m_nome']??''),trim($_POST['m_cognome']??''),$tel,trim($_POST['m_email']??''),trim($_POST['m_attivita']??'')]);
    }
    header('Location: admin.php'); exit;
}
if ($logged && isset($_POST['elimina'])) {
    $pdo->prepare("DELETE FROM leads WHERE id=?")->execute([$_POST['cid']]);
    header('Location: admin.php'); exit;
}
// Operatori management
if ($logged && isset($_POST['add_operatore'])) {
    $nome = trim($_POST['nome_operatore']??'');
    if ($nome) $pdo->prepare("INSERT INTO operatori (nome) VALUES (?)")->execute([$nome]);
    header('Location: admin.php?tab=team'); exit;
}
if ($logged && isset($_POST['del_operatore'])) {
    $pdo->prepare("DELETE FROM operatori WHERE id=?")->execute([$_POST['op_id']]);
    header('Location: admin.php?tab=team'); exit;
}
// SOP actions
if ($logged && isset($_POST['add_sop'])) {
    $titolo = trim($_POST['sop_titolo']??'');
    $link = trim($_POST['sop_link']??'');
    $desc = trim($_POST['sop_desc']??'');
    if ($titolo && $link) $pdo->prepare("INSERT INTO sop (titolo, link, descrizione) VALUES (?, ?, ?)")->execute([$titolo, $link, $desc]);
    header('Location: admin.php?tab=sop'); exit;
}
if ($logged && isset($_POST['del_sop'])) {
    $pdo->prepare("DELETE FROM sop WHERE id=?")->execute([$_POST['sop_id']]);
    header('Location: admin.php?tab=sop'); exit;
}

if (!$logged) { ?>
<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin - <?=$project_name?></title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#f5f5f7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.card{background:#fff;padding:40px;border-radius:16px;box-shadow:0 2px 20px rgba(0,0,0,.06);width:360px;text-align:center}h1{font-size:20px;font-weight:800;margin-bottom:4px;color:#111}p{font-size:12px;color:#888;margin-bottom:24px}input{width:100%;padding:12px 16px;border:1px solid #e0e0e0;border-radius:10px;font-size:14px;font-family:inherit;margin-bottom:14px;outline:none;background:#fafafa}input:focus{border-color:<?=$accent?>}button{width:100%;padding:12px;background:<?=$accent?>;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}</style>
</head><body><div class="card"><h1><?=$project_name?></h1><p>Pannello Admin</p><form method="POST"><input type="password" name="login_password" placeholder="Password" autofocus><button type="submit">Accedi</button></form></div></body></html>
<?php exit; }

// Data
$stati = ['nuovo','contattato','non_risponde','da_ricontattare','confermato','completato','annullato'];
$stato_label = ['nuovo'=>'Nuovo','contattato'=>'Contattato','non_risponde'=>'Non Risponde','da_ricontattare'=>'Da Ricontattare','confermato'=>'Confermato','completato'=>'Completato','annullato'=>'Annullato'];
$stato_color = ['nuovo'=>'#eab308','contattato'=>'#3b82f6','non_risponde'=>'#ef4444','da_ricontattare'=>'#f97316','confermato'=>'#22c55e','completato'=>'#059669','annullato'=>'#9ca3af'];
$operatori = $pdo->query("SELECT * FROM operatori ORDER BY nome")->fetchAll(PDO::FETCH_ASSOC);
$op_names = array_column($operatori, 'nome');

$filter = $_GET['filter'] ?? 'tutti';
$tab = $_GET['tab'] ?? 'leads';
$where = '';
if ($filter === 'oggi') $where = "WHERE DATE(created_at)=CURDATE()";
elseif (in_array($filter, $stati)) $where = "WHERE stato='$filter'";
elseif ($filter === 'whatsapp') $where = "WHERE fonte='whatsapp'";
elseif ($filter === 'scaduti') $where = "WHERE prossimo_contatto IS NOT NULL AND prossimo_contatto < NOW() AND stato NOT IN ('completato','annullato')";
elseif (strpos($filter,'op_')===0) { $opf=substr($filter,3); $where = "WHERE assegnato='".addslashes($opf)."'"; }

$totali = $pdo->query("SELECT COUNT(*) FROM leads")->fetchColumn();
$oggi_count = $pdo->query("SELECT COUNT(*) FROM leads WHERE DATE(created_at)=CURDATE()")->fetchColumn();
$nuovi = $pdo->query("SELECT COUNT(*) FROM leads WHERE stato='nuovo'")->fetchColumn();
$non_risponde = $pdo->query("SELECT COUNT(*) FROM leads WHERE stato='non_risponde'")->fetchColumn();
$da_ricontattare = $pdo->query("SELECT COUNT(*) FROM leads WHERE stato='da_ricontattare'")->fetchColumn();
$scaduti = $pdo->query("SELECT COUNT(*) FROM leads WHERE prossimo_contatto IS NOT NULL AND prossimo_contatto < NOW() AND stato NOT IN ('completato','annullato')")->fetchColumn();
$annullati = $pdo->query("SELECT COUNT(*) FROM leads WHERE stato='annullato'")->fetchColumn();
$confermati = $pdo->query("SELECT COUNT(*) FROM leads WHERE stato='confermato'")->fetchColumn();
$completati = $pdo->query("SELECT COUNT(*) FROM leads WHERE stato='completato'")->fetchColumn();
$leads = $pdo->query("SELECT * FROM leads $where ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);

// Registrazioni indicizzate per lead
$recs_by_lead = [];
try {
    $_rs = $pdo->query("SELECT * FROM chiamate_registrate ORDER BY created_at DESC");
    while ($_r = $_rs->fetch(PDO::FETCH_ASSOC)) { $recs_by_lead[$_r['lead_id']][] = $_r; }
} catch (Exception $e) {}

// Stats per operatore
$op_stats = [];
foreach ($op_names as $op) {
    $s = $pdo->prepare("SELECT COUNT(*) FROM leads WHERE assegnato=?"); $s->execute([$op]);
    $s2 = $pdo->prepare("SELECT COUNT(*) FROM leads WHERE assegnato=? AND stato='completato'"); $s2->execute([$op]);
    $op_stats[$op] = ['totali'=>$s->fetchColumn(), 'chiusi'=>$s2->fetchColumn()];
}
?>
<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin - <?=$project_name?></title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f5f5f7;color:#333;min-height:100vh}
.container{max-width:960px;margin:0 auto;padding:20px}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.header h1{font-size:20px;font-weight:800;color:#111;display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap}
.btn-copy-site{background:<?=$accent?>;color:#fff;border:none;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.3px;transition:all .15s;font-family:inherit}
.btn-copy-site:hover{filter:brightness(1.1);transform:translateY(-1px)}
.btn-copy-site.copied{background:#22c55e}
.header-links{display:flex;gap:12px;align-items:center}
.header-links a{font-size:12px;text-decoration:none;padding:5px 12px;border-radius:6px}
.tab-link{color:#888;background:#fff;border:1px solid #e8e8e8}
.tab-link.active{background:<?=$accent?>;color:#fff;border-color:<?=$accent?>}
.logout{color:#888!important;background:none!important;border:none!important}
.logout:hover{color:#ef4444!important}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:6px;margin-bottom:14px}
.stat{background:#fff;border-radius:10px;padding:12px 8px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.stat .num{font-size:20px;font-weight:800}
.stat .lbl{font-size:8px;color:#999;text-transform:uppercase;font-weight:700;margin-top:2px}
.filters{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
.filters a{padding:4px 10px;background:#fff;border:1px solid #e8e8e8;border-radius:6px;color:#888;font-size:10px;text-decoration:none;font-weight:600}
.filters a:hover,.filters a.active{background:<?=$accent?>;color:#fff;border-color:<?=$accent?>}
.wa-form{background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;border-left:4px solid #25d366;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.wa-form .title{font-size:11px;font-weight:700;color:#25d366;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.wa-form .title svg{width:14px;height:14px}
.wa-form form{display:flex;flex-wrap:wrap;gap:5px}
.wa-form input,.wa-form select{padding:7px 8px;border:1px solid #e8e8e8;border-radius:6px;background:#fafafa;color:#333;font-size:11px;font-family:inherit;flex:1;min-width:70px}
.wa-form button{padding:7px 12px;background:#25d366;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer}
.lead{background:#fff;border-radius:10px;padding:14px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,.04);border-left:4px solid #e8e8e8}
.lead.scaduto{border-left-color:#ef4444!important;background:#fff5f5}
.lead__top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:4px}
.lead__name{font-size:15px;font-weight:700;color:#111;display:flex;align-items:center;gap:5px}
.wa-icon{width:16px;height:16px;flex-shrink:0}
.lead__date{font-size:10px;color:#aaa}
.lead__email{font-size:11px;color:#888;margin-top:1px}
.lead__fields{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px}
.lead__field{background:#f9f9f9;padding:7px 10px;border-radius:6px}
.lead__field-label{font-size:8px;color:#aaa;text-transform:uppercase;font-weight:700}
.lead__field-value{font-size:12px;color:#333;font-weight:600;margin-top:1px}
.lead__field-value a{color:#333;text-decoration:none}
.lead__badges{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;align-items:center}
.badge{padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase}
.badge-op{background:#e8e8e8;color:#555}
.lead__followup{font-size:10px;padding:4px 8px;border-radius:6px;margin-bottom:8px;display:inline-block}
.followup-ok{background:#f0fdf4;color:#059669}
.followup-scaduto{background:#fef2f2;color:#ef4444;font-weight:700}
.lead__actions{display:flex;gap:3px;flex-wrap:wrap;align-items:center}
.lead__actions select,.lead__actions input{padding:5px 6px;border:1px solid #e8e8e8;border-radius:5px;background:#fafafa;color:#333;font-size:10px;font-family:inherit}
.lead__actions input[type="text"]{flex:1;min-width:80px}
.lead__actions input[type="datetime-local"]{width:150px;font-size:10px}
.btn-sm{padding:4px 10px;border:none;border-radius:5px;font-size:9px;font-weight:700;cursor:pointer;font-family:inherit}
.btn-blue{background:<?=$accent?>;color:#fff}
.btn-red{background:#fff;color:#ef4444;border:1px solid #fecaca}
.btn-wa{background:#25d366;color:#fff;text-decoration:none;padding:4px 8px;border-radius:5px;font-size:9px;font-weight:700;display:inline-flex;align-items:center;gap:3px}
.btn-wa-r{background:#dc2626;color:#fff;text-decoration:none;padding:4px 8px;border-radius:5px;font-size:9px;font-weight:700;display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
.btn-wa-r:hover{background:#b91c1c}
.lead__recs{margin-top:8px;padding-top:8px;border-top:1px dashed #eee}
.rec-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.btn-rec{background:#dc2626;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:inherit}
.btn-rec:hover{background:#b91c1c}
.btn-rec.recording{background:#7f1d1d;animation:pulse-rec 1.2s infinite}
.btn-rec:disabled{opacity:.6;cursor:wait}
@keyframes pulse-rec{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.6)}50%{box-shadow:0 0 0 10px rgba(220,38,38,0)}}
.rec-item{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:#666}
.rec-item audio{height:30px;flex:1;min-width:0;max-width:280px}
.rec-item__meta{white-space:nowrap;font-size:10px;color:#999}
.rec-item__dl{color:#06b6d4;text-decoration:none;font-size:13px;padding:2px 4px}
.rec-item__del{background:transparent;border:none;cursor:pointer;color:#999;padding:2px 4px;font-size:12px}
.rec-item__del:hover{color:#ef4444}
.empty{text-align:center;padding:40px;color:#aaa;font-size:13px}
.log{margin-top:6px;border-top:1px solid #f0f0f0;padding-top:6px}
.log-item{font-size:9px;color:#aaa;padding:1px 0}
.log-item b{color:#888}
.team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:14px}
.team-card{background:#fff;border-radius:10px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.04);display:flex;justify-content:space-between;align-items:center}
.team-card__name{font-size:14px;font-weight:700;color:#111}
.team-card__stats{font-size:11px;color:#888}
.team-card__del{background:none;border:none;color:#ccc;cursor:pointer;font-size:16px}
.team-card__del:hover{color:#ef4444}
.team-add{display:flex;gap:6px;margin-top:14px}
.team-add input{padding:10px 14px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;flex:1;font-family:inherit;outline:none}
.team-add button{padding:10px 20px;background:<?=$accent?>;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
.reminder-bar{background:#fff;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:10px;padding:12px 14px;margin-bottom:14px;box-shadow:0 2px 8px rgba(239,68,68,.08);display:none}
.reminder-bar.active{display:block;animation:pulse-border 2s infinite}
@keyframes pulse-border{0%,100%{border-color:#fecaca;box-shadow:0 2px 8px rgba(239,68,68,.08)}50%{border-color:#ef4444;box-shadow:0 2px 12px rgba(239,68,68,.15)}}
.reminder-bar__title{font-size:11px;font-weight:800;color:#ef4444;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.reminder-bar__title svg{width:16px;height:16px}
.reminder-list{display:flex;flex-direction:column;gap:6px}
.reminder-item{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#fef2f2;border-radius:8px;gap:8px;flex-wrap:wrap}
.reminder-item__info{display:flex;flex-direction:column;gap:2px}
.reminder-item__name{font-size:13px;font-weight:700;color:#111}
.reminder-item__time{font-size:10px;color:#ef4444;font-weight:600}
.reminder-item__op{font-size:10px;color:#888}
.reminder-item__actions{display:flex;gap:4px;align-items:center}
.reminder-item__actions a{padding:4px 10px;border-radius:5px;font-size:9px;font-weight:700;text-decoration:none;color:#fff}
.search-bar{position:relative;margin-bottom:14px}
.search-bar input{width:100%;padding:10px 14px 10px 36px;border:1px solid #e0e0e0;border-radius:10px;font-size:13px;font-family:inherit;outline:none;background:#fff}
.search-bar input:focus{border-color:<?=$accent?>;box-shadow:0 0 0 3px <?=$accent?>15}
.search-bar svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#aaa}
@media(max-width:600px){.container{padding:10px}.lead__fields{grid-template-columns:1fr}.stats{grid-template-columns:repeat(3,1fr)}.lead__actions{flex-direction:column;align-items:stretch}.lead__actions form{display:flex;gap:3px}}
</style></head><body>
<div class="container">
  <?php $site_url = (!empty($_SERVER['HTTPS']) ? 'https' : 'http').'://'.$_SERVER['HTTP_HOST'].'/'; ?>
  <div class="header">
    <h1><?=$project_name?> <button type="button" class="btn-copy-site" onclick="copySite(this,'<?=htmlspecialchars($site_url,ENT_QUOTES)?>')" title="Copia il link del sito">Copia Link Sito</button></h1>
    <div class="header-links">
      <a href="?tab=leads" class="tab-link <?=$tab==='leads'?'active':''?>">Lead</a>
      <a href="?tab=team" class="tab-link <?=$tab==='team'?'active':''?>">Team</a>
      <a href="?tab=sop" class="tab-link <?=$tab==='sop'?'active':''?>">SOP</a>
      <a href="?logout=1" class="logout">Esci</a>
    </div>
  </div>

  <div class="search-bar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input type="text" id="local-search" placeholder="Cerca per nome, cognome, telefono, email, attivita..." oninput="localSearch(this.value)">
  </div>

  <?php
  $soon = date('Y-m-d H:i:s', strtotime('+30 minutes'));
  $reminders = $pdo->query("SELECT * FROM leads WHERE prossimo_contatto IS NOT NULL AND prossimo_contatto <= '$soon' AND stato NOT IN ('completato','annullato') ORDER BY prossimo_contatto ASC")->fetchAll(PDO::FETCH_ASSOC);
  if (!empty($reminders)): ?>
  <div class="reminder-bar active">
    <div class="reminder-bar__title">
      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      Reminder - <?=count($reminders)?> lead da contattare
    </div>
    <div class="reminder-list">
      <?php foreach($reminders as $r):
        $scaduto = strtotime($r['prossimo_contatto']) < time();
        $tempo = $scaduto ? 'SCADUTO da '.round((time()-strtotime($r['prossimo_contatto']))/60).' min' : 'Tra '.round((strtotime($r['prossimo_contatto'])-time())/60).' min';
      ?>
      <div class="reminder-item">
        <div class="reminder-item__info">
          <div class="reminder-item__name"><?=htmlspecialchars($r['nome'].' '.$r['cognome'])?> - <?=htmlspecialchars($r['telefono'])?></div>
          <div class="reminder-item__time"><?=$tempo?> (<?=date('H:i', strtotime($r['prossimo_contatto']))?>)</div>
          <?php if(!empty($r['assegnato'])): ?><div class="reminder-item__op">Assegnato a: <b><?=htmlspecialchars($r['assegnato'])?></b></div><?php endif; ?>
        </div>
        <div class="reminder-item__actions">
          <a href="tel:<?=htmlspecialchars($r['telefono'])?>" style="background:#059669">Chiama</a>
          <a href="<?=wa_link($r['telefono']??'')?>" target="_blank" style="background:#25d366">WA</a>
          <a href="#lead-<?=$r['id']?>" style="background:<?=$accent?>" onclick="document.getElementById('lead-<?=$r['id']?>').scrollIntoView({block:'center'})">Vai</a>
          <form method="POST" style="display:inline;margin:0" onsubmit="return confirm('Eliminare questo reminder?')">
            <input type="hidden" name="cid" value="<?=$r['id']?>">
            <button type="submit" name="dismiss_reminder" value="1" title="Elimina reminder" style="background:#9ca3af;border:none;color:#fff;padding:4px 8px;border-radius:5px;font-size:9px;font-weight:700;cursor:pointer;font-family:inherit">&times;</button>
          </form>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

<?php if ($tab === 'sop'): ?>
  <h2 style="font-size:16px;color:#111;margin-bottom:4px">SOP - Procedure Operative</h2>
  <p style="font-size:12px;color:#888;margin-bottom:14px">Documenti e procedure che gli operatori devono seguire</p>

  <form method="POST" style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.04);margin-bottom:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end">
    <div style="flex:1;min-width:150px">
      <label style="font-size:10px;color:#888;font-weight:700;text-transform:uppercase;display:block;margin-bottom:4px">Titolo SOP</label>
      <input type="text" name="sop_titolo" placeholder="Es: Script Chiamata Primo Contatto" required style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;font-family:inherit;outline:none">
    </div>
    <div style="flex:1;min-width:200px">
      <label style="font-size:10px;color:#888;font-weight:700;text-transform:uppercase;display:block;margin-bottom:4px">Link Google Drive / Docs</label>
      <input type="url" name="sop_link" placeholder="https://docs.google.com/..." required style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;font-family:inherit;outline:none">
    </div>
    <div style="flex:1;min-width:150px">
      <label style="font-size:10px;color:#888;font-weight:700;text-transform:uppercase;display:block;margin-bottom:4px">Descrizione (opzionale)</label>
      <input type="text" name="sop_desc" placeholder="Breve descrizione..." style="width:100%;padding:10px 12px;border:1px solid #e0e0e0;border-radius:8px;font-size:13px;font-family:inherit;outline:none">
    </div>
    <button type="submit" name="add_sop" value="1" style="padding:10px 20px;background:<?=$accent?>;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">+ Aggiungi SOP</button>
  </form>

  <?php
  $sops = $pdo->query("SELECT * FROM sop ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
  if (empty($sops)): ?>
    <div style="text-align:center;padding:30px;color:#aaa;font-size:13px;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.04)">Nessuna SOP aggiunta</div>
  <?php else: ?>
    <?php foreach ($sops as $sop): ?>
    <div style="background:#fff;border-radius:10px;padding:16px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,.04);display:flex;align-items:center;gap:12px;flex-wrap:wrap;border-left:4px solid <?=$accent?>">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="<?=$accent?>" stroke-width="1.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      <div style="flex:1;min-width:150px">
        <div style="font-size:14px;font-weight:700;color:#111"><?=htmlspecialchars($sop['titolo'])?></div>
        <?php if(!empty($sop['descrizione'])): ?><div style="font-size:11px;color:#888;margin-top:2px"><?=htmlspecialchars($sop['descrizione'])?></div><?php endif; ?>
        <div style="font-size:10px;color:#aaa;margin-top:4px">Aggiunto il <?=date('d/m/Y', strtotime($sop['created_at']))?></div>
      </div>
      <a href="<?=htmlspecialchars($sop['link'])?>" target="_blank" style="padding:8px 16px;background:<?=$accent?>;color:#fff;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Apri Documento
      </a>
      <form method="POST" onsubmit="return confirm('Eliminare questa SOP?')" style="display:inline">
        <input type="hidden" name="sop_id" value="<?=$sop['id']?>">
        <button type="submit" name="del_sop" style="padding:8px 14px;background:#fff;color:#ef4444;border:1px solid #fecaca;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Elimina</button>
      </form>
    </div>
    <?php endforeach; ?>
  <?php endif; ?>

<?php elseif ($tab === 'team'): ?>
  <h2 style="font-size:16px;color:#111;margin-bottom:4px">Gestione Operatori</h2>
  <p style="font-size:12px;color:#888;margin-bottom:14px">Aggiungi o rimuovi le persone che gestiscono i lead</p>
  <div class="team-grid">
    <?php foreach($operatori as $op): ?>
    <div class="team-card">
      <div>
        <div class="team-card__name"><?=htmlspecialchars($op['nome'])?></div>
        <div class="team-card__stats"><?=$op_stats[$op['nome']]['totali']??0?> lead &middot; <?=$op_stats[$op['nome']]['chiusi']??0?> chiusi</div>
      </div>
      <form method="POST" onsubmit="return confirm('Rimuovere?')"><input type="hidden" name="op_id" value="<?=$op['id']?>"><button type="submit" name="del_operatore" class="team-card__del">&times;</button></form>
    </div>
    <?php endforeach; ?>
    <?php if(empty($operatori)): ?><div class="empty" style="padding:20px">Nessun operatore aggiunto</div><?php endif; ?>
  </div>
  <form method="POST" class="team-add">
    <input type="text" name="nome_operatore" placeholder="Nome operatore..." required>
    <button type="submit" name="add_operatore" value="1">+ Aggiungi</button>
  </form>

<?php else: ?>
  <div class="stats">
    <div class="stat"><div class="num"><?=$totali?></div><div class="lbl">Totali</div></div>
    <div class="stat"><div class="num" style="color:#eab308"><?=$oggi_count?></div><div class="lbl">Oggi</div></div>
    <div class="stat"><div class="num" style="color:#3b82f6"><?=$nuovi?></div><div class="lbl">Nuovi</div></div>
    <div class="stat"><div class="num" style="color:#ef4444"><?=$non_risponde?></div><div class="lbl">Non Risp.</div></div>
    <div class="stat"><div class="num" style="color:#f97316"><?=$da_ricontattare?></div><div class="lbl">Da Ricont.</div></div>
    <div class="stat"><div class="num" style="color:<?=$scaduti>0?'#ef4444':'#999'?>"><?=$scaduti?></div><div class="lbl">Scaduti</div></div>
    <div class="stat"><div class="num" style="color:#22c55e"><?=$confermati?></div><div class="lbl">Confermati</div></div>
    <div class="stat"><div class="num" style="color:#059669"><?=$completati?></div><div class="lbl">Completati</div></div>
    <div class="stat"><div class="num" style="color:#9ca3af"><?=$annullati?></div><div class="lbl">Annullati</div></div>
    <?php foreach($op_names as $opn): ?><div class="stat"><div class="num"><?=$op_stats[$opn]['totali']?></div><div class="lbl"><?=htmlspecialchars($opn)?></div></div><?php endforeach; ?>
  </div>
  <div class="filters">
    <a href="?filter=tutti" class="<?=$filter==='tutti'?'active':''?>">Tutti</a>
    <a href="?filter=oggi" class="<?=$filter==='oggi'?'active':''?>">Oggi</a>
    <a href="?filter=nuovo" class="<?=$filter==='nuovo'?'active':''?>">Nuovi</a>
    <a href="?filter=contattato" class="<?=$filter==='contattato'?'active':''?>">Contattati</a>
    <a href="?filter=non_risponde" class="<?=$filter==='non_risponde'?'active':''?>">Non Risponde</a>
    <a href="?filter=da_ricontattare" class="<?=$filter==='da_ricontattare'?'active':''?>">Da Ricontattare</a>
    <a href="?filter=confermato" class="<?=$filter==='confermato'?'active':''?>">Confermati</a>
    <a href="?filter=completato" class="<?=$filter==='completato'?'active':''?>">Completati</a>
    <a href="?filter=annullato" class="<?=$filter==='annullato'?'active':''?>">Annullati</a>
    <a href="?filter=scaduti" class="<?=$filter==='scaduti'?'active':''?>" style="<?=$scaduti>0?'color:#ef4444;border-color:#fecaca':''?>">Scaduti (<?=$scaduti?>)</a>
    <a href="?filter=whatsapp" class="<?=$filter==='whatsapp'?'active':''?>">WhatsApp</a>
    <?php foreach($op_names as $opn): ?><a href="?filter=op_<?=urlencode($opn)?>" class="<?=$filter==='op_'.$opn?'active':''?>"><?=htmlspecialchars($opn)?></a><?php endforeach; ?>
  </div>
  <div class="wa-form">
    <div class="title"><svg viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg> Aggiungi Lead da WhatsApp / manuale</div>
    <form method="POST">
      <input type="text" name="m_nome" placeholder="Nome" required>
      <input type="text" name="m_cognome" placeholder="Cognome">
      <input type="tel" name="m_telefono" placeholder="Telefono" required>
      <input type="email" name="m_email" placeholder="Email">
      <input type="text" name="m_attivita" placeholder="Attivita">
      <button type="submit" name="add_manual" value="1">+</button>
    </form>
  </div>

  <?php foreach ($leads as $c):
    $is_wa = ($c['fonte']??'')==='whatsapp';
    $sc = $stato_color[$c['stato']] ?? '#999';
    $has_followup = !empty($c['prossimo_contatto']);
    $is_scaduto = $has_followup && strtotime($c['prossimo_contatto']) < time() && !in_array($c['stato'],['completato','annullato']);
    $log_stmt = $pdo->prepare("SELECT * FROM log_attivita WHERE lead_id=? ORDER BY created_at DESC LIMIT 5");
    $log_stmt->execute([$c['id']]);
    $logs = $log_stmt->fetchAll(PDO::FETCH_ASSOC);
    $search_blob = strtolower(($c['nome']??'').' '.($c['cognome']??'').' '.($c['email']??'').' '.($c['attivita']??'').' '.preg_replace('/[^0-9]/','',($c['telefono']??'')));
  ?>
  <div class="lead <?=$is_scaduto?'scaduto':''?>" id="lead-<?=$c['id']?>" data-search="<?=htmlspecialchars($search_blob)?>" style="border-left-color:<?=$sc?>">
    <div class="lead__top">
      <div style="flex:1;min-width:0">
        <div id="nview-<?=$c['id']?>">
          <div class="lead__name">
            <?php if($is_wa): ?><svg class="wa-icon" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg><?php endif; ?>
            <?=htmlspecialchars($c['nome'].' '.$c['cognome'])?>
            <button type="button" onclick="document.getElementById('nedit-<?=$c['id']?>').style.display='flex';document.getElementById('nview-<?=$c['id']?>').style.display='none'" title="Modifica anagrafica" style="margin-left:6px;background:transparent;border:none;cursor:pointer;color:#999;padding:2px 4px;font-size:12px;vertical-align:middle">&#9998;</button>
          </div>
          <?php if(!empty($c['email'])): ?><div class="lead__email"><?=htmlspecialchars($c['email'])?></div><?php endif; ?>
        </div>
        <form method="POST" id="nedit-<?=$c['id']?>" style="display:none;gap:4px;flex-wrap:wrap;align-items:center">
          <input type="hidden" name="cid" value="<?=$c['id']?>">
          <input type="text" name="nome" value="<?=htmlspecialchars($c['nome']??'')?>" placeholder="Nome" style="flex:1;min-width:90px;padding:5px 7px;border:1px solid #e0e0e0;border-radius:5px;font-size:12px;font-family:inherit;outline:none">
          <input type="text" name="cognome" value="<?=htmlspecialchars($c['cognome']??'')?>" placeholder="Cognome" style="flex:1;min-width:90px;padding:5px 7px;border:1px solid #e0e0e0;border-radius:5px;font-size:12px;font-family:inherit;outline:none">
          <input type="email" name="email" value="<?=htmlspecialchars($c['email']??'')?>" placeholder="Email" style="flex:1.5;min-width:140px;padding:5px 7px;border:1px solid #e0e0e0;border-radius:5px;font-size:12px;font-family:inherit;outline:none">
          <input type="text" name="telefono" value="<?=htmlspecialchars($c['telefono']??'')?>" placeholder="Telefono" style="flex:1;min-width:110px;padding:5px 7px;border:1px solid #e0e0e0;border-radius:5px;font-size:12px;font-family:inherit;outline:none">
          <input type="text" name="attivita" value="<?=htmlspecialchars($c['attivita']??'')?>" placeholder="Attivita" style="flex:1.5;min-width:140px;padding:5px 7px;border:1px solid #e0e0e0;border-radius:5px;font-size:12px;font-family:inherit;outline:none">
          <button type="submit" name="update_anagrafica" value="1" class="btn-sm btn-blue">Salva</button>
          <button type="button" onclick="document.getElementById('nedit-<?=$c['id']?>').style.display='none';document.getElementById('nview-<?=$c['id']?>').style.display='block'" class="btn-sm" style="background:#eee;color:#333">Annulla</button>
        </form>
      </div>
      <div class="lead__date">#<?=$c['id']?> &middot; <?=date('d/m/Y H:i', strtotime($c['created_at']))?></div>
    </div>
    <div class="lead__fields">
      <div class="lead__field"><div class="lead__field-label">Telefono</div><div class="lead__field-value"><a href="tel:<?=htmlspecialchars($c['telefono'])?>"><?=htmlspecialchars($c['telefono'])?></a></div></div>
      <div class="lead__field"><div class="lead__field-label">Fonte</div><div class="lead__field-value"><?=htmlspecialchars(ucfirst($c['fonte']??'form'))?></div></div>
      <?php if(!empty($c['attivita'])): ?>
      <div class="lead__field" style="grid-column:1/-1"><div class="lead__field-label">Attivita</div><div class="lead__field-value"><?=htmlspecialchars($c['attivita'])?></div></div>
      <?php endif; ?>
    </div>
    <div class="lead__badges">
      <span class="badge" style="background:<?=$sc?>20;color:<?=$sc?>"><?=$stato_label[$c['stato']]??ucfirst($c['stato'])?><?php if((int)($c['nr_count']??0)>0 && $c['stato']==='non_risponde'): ?> &middot; NR <?=(int)$c['nr_count']?><?php endif; ?></span>
      <?php if((int)($c['nr_count']??0)>0 && $c['stato']!=='non_risponde'): ?><span class="badge" style="background:#fee2e2;color:#b91c1c" title="Tentativi NR storici">NR <?=(int)$c['nr_count']?></span><?php endif; ?>
      <?php if(!empty($c['assegnato'])): ?><span class="badge badge-op"><?=htmlspecialchars($c['assegnato'])?></span><?php endif; ?>
    </div>
    <?php if($has_followup): ?>
    <div class="lead__followup <?=$is_scaduto?'followup-scaduto':'followup-ok'?>">
      <?=$is_scaduto?'SCADUTO - ':''?>Ricontattare: <?=date('d/m/Y H:i', strtotime($c['prossimo_contatto']))?>
    </div>
    <?php endif; ?>
    <?php if(!empty($c['note'])): ?><div style="font-size:11px;color:#666;padding:5px 8px;background:#f9f9f9;border-radius:6px;margin-bottom:6px"><?=htmlspecialchars($c['note'])?></div><?php endif; ?>
    <div class="lead__actions">
      <form method="POST" style="display:flex;gap:3px;align-items:center">
        <input type="hidden" name="cid" value="<?=$c['id']?>"><input type="hidden" name="operatore_azione" value="">
        <select name="nuovo_stato"><?php foreach($stati as $s): ?><option value="<?=$s?>" <?=$c['stato']===$s?'selected':''?>><?=$stato_label[$s]?></option><?php endforeach; ?></select>
        <button type="submit" name="update_stato" value="1" class="btn-sm btn-blue">Stato</button>
      </form>
      <form method="POST" style="display:flex;gap:3px;align-items:center">
        <input type="hidden" name="cid" value="<?=$c['id']?>">
        <select name="assegnato"><option value="">- Assegna -</option><?php foreach($op_names as $opn): ?><option value="<?=$opn?>" <?=($c['assegnato']??'')===$opn?'selected':''?>><?=$opn?></option><?php endforeach; ?></select>
        <button type="submit" name="update_assegnato" value="1" class="btn-sm btn-blue">Assegna</button>
      </form>
      <form method="POST" style="display:flex;gap:3px;align-items:center">
        <input type="hidden" name="cid" value="<?=$c['id']?>">
        <input type="datetime-local" name="prossimo_contatto" value="<?=!empty($c['prossimo_contatto'])?date('Y-m-d\TH:i',strtotime($c['prossimo_contatto'])):''?>">
        <button type="submit" name="update_prossimo" value="1" class="btn-sm btn-blue">Follow</button>
      </form>
      <form method="POST" style="display:flex;gap:3px;align-items:center;flex:1">
        <input type="hidden" name="cid" value="<?=$c['id']?>"><input type="hidden" name="operatore_azione" value="">
        <input type="text" name="note" placeholder="Nota..." value="<?=htmlspecialchars($c['note']??'')?>">
        <button type="submit" name="update_note" value="1" class="btn-sm btn-blue">Nota</button>
      </form>
      <?php $reminder_msg = str_replace('{NOME}', trim($c['nome']??''), $reminder_template); ?>
      <a href="<?=wa_link($c['telefono']??'')?>" target="_blank" class="btn-wa"><svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>WA</a>
      <a href="<?=wa_link($c['telefono']??'', $reminder_msg)?>" target="_blank" class="btn-wa-r" title="Invia messaggio di reminder"><svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>Reminder</a>
      <form method="POST" onsubmit="return confirm('Eliminare?')" style="display:inline">
        <input type="hidden" name="cid" value="<?=$c['id']?>">
        <button type="submit" name="elimina" class="btn-sm btn-red">X</button>
      </form>
    </div>
    <div class="lead__recs">
      <div class="rec-row">
        <button type="button" class="btn-rec" onclick="toggleRec(<?=$c['id']?>,this)">Registra Chiamata</button>
      </div>
      <?php foreach (($recs_by_lead[$c['id']] ?? []) as $rec): ?>
        <div class="rec-item" id="rec-<?=$rec['id']?>">
          <audio controls preload="metadata" src="uploads/calls/<?=htmlspecialchars($rec['filename'])?>"></audio>
          <div class="rec-item__meta"><?=date('d/m H:i', strtotime($rec['created_at']))?> &middot; <?=gmdate('i:s', (int)$rec['durata'])?></div>
          <a class="rec-item__dl" href="uploads/calls/<?=htmlspecialchars($rec['filename'])?>" download title="Scarica">&darr;</a>
          <button type="button" class="rec-item__del" onclick="delRec(<?=$rec['id']?>)" title="Elimina">&times;</button>
        </div>
      <?php endforeach; ?>
    </div>
    <?php if(!empty($logs)): ?>
    <div class="log">
      <?php foreach($logs as $l): ?><div class="log-item"><?=date('d/m H:i',strtotime($l['created_at']))?> <?php if($l['operatore']): ?><b><?=htmlspecialchars($l['operatore'])?></b> - <?php endif; ?><?=htmlspecialchars($l['azione'])?></div><?php endforeach; ?>
    </div>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>
  <?php if(empty($leads)): ?><div class="empty">Nessun lead</div><?php endif; ?>
<?php endif; ?>
</div>
<script>
function copySite(btn,url){
  var done=function(){var orig=btn.innerHTML;btn.innerHTML='Copiato!';btn.classList.add('copied');setTimeout(function(){btn.innerHTML=orig;btn.classList.remove('copied')},1500)};
  if(navigator.clipboard && navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done).catch(function(){prompt('Copia manualmente:',url)})}
  else {var ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(e){prompt('Copia manualmente:',url)}document.body.removeChild(ta)}
}
function localSearch(q){
  q=q.toLowerCase().trim();
  document.querySelectorAll('.lead').forEach(function(el){
    if(!q){el.style.display='';return}
    var blob=(el.getAttribute('data-search')||'')+' '+(el.textContent||'').toLowerCase();
    el.style.display=blob.indexOf(q)>=0 ? '' : 'none';
  });
}
if('scrollRestoration' in history) history.scrollRestoration='manual';
document.addEventListener('submit',function(e){
  if(e.target.tagName==='FORM'){sessionStorage.setItem('adminScroll',window.scrollY);sessionStorage.setItem('adminFromSubmit','1');}
},true);
window.addEventListener('DOMContentLoaded',function(){
  var s=sessionStorage.getItem('adminScroll');
  var fromSubmit=sessionStorage.getItem('adminFromSubmit');
  if(s && (fromSubmit || !location.hash)){
    setTimeout(function(){window.scrollTo(0,parseInt(s))},0);
    sessionStorage.removeItem('adminScroll');
    sessionStorage.removeItem('adminFromSubmit');
  }
  if(location.hash){var el=document.querySelector(location.hash);if(el){el.scrollIntoView({block:'nearest'});el.style.boxShadow='0 0 0 3px rgba(0,0,0,.08)';setTimeout(function(){el.style.boxShadow=''},2000)}}
});
setInterval(function(){
  if(document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='SELECT'&&document.activeElement.tagName!=='TEXTAREA'){
    sessionStorage.setItem('adminScroll',window.scrollY);
    location.reload();
  }
},60000);
if('Notification' in window && Notification.permission==='default'){Notification.requestPermission()}
var reminderBar=document.querySelector('.reminder-bar.active');
if(reminderBar && 'Notification' in window && Notification.permission==='granted'){
  var count=reminderBar.querySelectorAll('.reminder-item').length;
  new Notification('<?=$project_name?> - Reminder',{body:count+' lead da contattare adesso!'});
}
if(reminderBar){document.title='(!) '+document.title}

// === CALL RECORDING ===
var __rec=null;
async function toggleRec(leadId, btn){
  if(__rec){
    if(__rec.leadId!==leadId){alert('Ferma prima la registrazione del lead #'+__rec.leadId);return}
    __rec.recorder.stop();return;
  }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){alert('Browser non supporta la registrazione audio');return}
  try{
    var stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
    var opts={audioBitsPerSecond:32000};
    try{opts.mimeType='audio/webm;codecs=opus'}catch(e){}
    var recorder=new MediaRecorder(stream, opts);
    var chunks=[],startTime=Date.now();
    recorder.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
    var state={leadId:leadId,recorder:recorder,stream:stream,chunks:chunks,startTime:startTime,btn:btn};
    __rec=state;
    state.timerInterval=setInterval(function(){
      var s=Math.floor((Date.now()-startTime)/1000);
      var m=Math.floor(s/60), sec=s%60;
      btn.innerHTML='Stop '+m+':'+(sec<10?'0':'')+sec;
    },500);
    recorder.onstop=async function(){
      clearInterval(state.timerInterval);
      stream.getTracks().forEach(function(t){t.stop()});
      btn.classList.remove('recording');
      btn.innerHTML='Caricamento...';btn.disabled=true;
      var blob=new Blob(chunks,{type:'audio/webm'});
      var durata=Math.round((Date.now()-startTime)/1000);
      var fd=new FormData();
      fd.append('file',blob,'rec.webm');
      fd.append('lead_id',leadId);
      fd.append('durata',durata);
      try{
        var r=await fetch('api_call_upload.php',{method:'POST',credentials:'same-origin',body:fd});
        var txt=await r.text();
        var j; try{j=JSON.parse(txt)}catch(_){j=null}
        if(j && j.ok){__rec=null;sessionStorage.setItem('adminScroll',window.scrollY);location.hash='lead-'+leadId;location.reload();return}
        else{
          var msg=j? (j.error||'sconosciuto') : ('HTTP '+r.status+' - '+txt.substring(0,300));
          alert('Errore upload:\n'+msg);
          console.error('Upload raw response:', txt);
          btn.innerHTML='Registra Chiamata';btn.disabled=false;
        }
      }catch(e){alert('Errore upload: '+e.message);btn.innerHTML='Registra Chiamata';btn.disabled=false}
      __rec=null;
    };
    recorder.start();
    btn.classList.add('recording');
    btn.innerHTML='Stop 0:00';
  }catch(err){alert('Impossibile accedere al microfono: '+err.message)}
}
async function delRec(recId){
  if(!confirm('Eliminare questa registrazione?'))return;
  try{
    var fd=new FormData();fd.append('id',recId);
    var r=await fetch('api_call_delete.php',{method:'POST',credentials:'same-origin',body:fd});
    var j=await r.json();
    if(j.ok){sessionStorage.setItem('adminScroll',window.scrollY);location.reload()}
    else{alert('Errore: '+(j.error||'eliminazione fallita'))}
  }catch(e){alert('Errore: '+e.message)}
}
window.addEventListener('beforeunload',function(e){
  if(__rec){e.preventDefault();e.returnValue='Registrazione in corso. Uscire comunque?';return e.returnValue}
});
function fixWebmDuration(audio){
  if (audio._durFixed) return; audio._durFixed = true;
  if (audio.readyState >= 1 && !isFinite(audio.duration)) {
    var handler = function(){ audio.removeEventListener('timeupdate', handler); audio.currentTime = 0; };
    audio.addEventListener('timeupdate', handler);
    try { audio.currentTime = 1e101; } catch(e) {}
  }
}
document.querySelectorAll('.rec-item audio').forEach(function(a){
  a.addEventListener('loadedmetadata', function(){ fixWebmDuration(a); });
  if (a.readyState >= 1) fixWebmDuration(a);
});
</script>
</body></html>
