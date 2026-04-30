<?php
require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/layout.php';

if (!current_user()) { header('Location: /login.php'); exit; }

$user = require_admin_area();
$tenantId = (int)$user['tenant_id'];

$stmt = $pdo->prepare('SELECT name, slug FROM tenants WHERE id = ?');
$stmt->execute([$tenantId]);
$tenant = $stmt->fetch();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM customers WHERE tenant_id = ?');
$stmt->execute([$tenantId]);
$customersTotal = (int)$stmt->fetchColumn();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM customers WHERE tenant_id = ? AND DATE(created_at) = CURDATE()');
$stmt->execute([$tenantId]);
$customersToday = (int)$stmt->fetchColumn();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM customers WHERE tenant_id = ? AND contacted_at IS NOT NULL');
$stmt->execute([$tenantId]);
$contacted = (int)$stmt->fetchColumn();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM customers WHERE tenant_id = ? AND rating = 5');
$stmt->execute([$tenantId]);
$fiveStars = (int)$stmt->fetchColumn();

$conv = $contacted ? round(($fiveStars / max(1,$contacted)) * 100) : 0;
$pubUrl = '/r/' . ($tenant['slug'] ?? '');

layout_head('Dashboard ' . ($tenant['name'] ?? ''));
?>

<section class="max-w-6xl mx-auto px-6 py-10 md:py-14">
  <div class="flex flex-wrap items-end justify-between gap-6 mb-10 rise d1">
    <div>
      <span class="chip mb-3"><span class="dot"></span> Operativo</span>
      <h1 class="h-display text-4xl md:text-5xl"><?= htmlspecialchars($tenant['name'] ?? 'Area') ?></h1>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-body">
        <span>Sondaggio pubblico:</span>
        <code class="bg-mint border border-primary-100 text-primary-700 px-2.5 py-1 rounded-lg text-xs font-semibold"><?= htmlspecialchars($pubUrl) ?></code>
        <button onclick="navigator.clipboard.writeText(window.location.origin + '<?= htmlspecialchars($pubUrl) ?>'); this.textContent='Copiato ✓'; setTimeout(()=>this.textContent='Copia',1500)" class="text-xs text-muted hover:text-ink">Copia</button>
      </div>
    </div>
    <div class="flex gap-2">
      <a href="#" class="btn-secondary text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Aggiungi cliente
      </a>
      <a href="#" class="btn-primary text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
        Importa CSV
      </a>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
    <div class="card p-6 rise d2 relative overflow-hidden bg-mint border-primary-100">
      <div class="text-xs font-semibold uppercase tracking-wider text-primary-700">Clienti oggi</div>
      <div class="mt-2 h-display text-5xl text-primary-700"><?= $customersToday ?></div>
      <div class="mt-1 text-xs text-primary-700/70">Da contattare</div>
    </div>
    <div class="card p-6 rise d3">
      <div class="text-xs font-semibold uppercase tracking-wider text-muted">Inviati WhatsApp</div>
      <div class="mt-2 h-display text-5xl"><?= $contacted ?></div>
      <div class="mt-1 text-xs text-muted">In totale</div>
    </div>
    <div class="card p-6 rise d4">
      <div class="text-xs font-semibold uppercase tracking-wider text-muted">Recensioni 5★</div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="h-display text-5xl"><?= $fiveStars ?></span>
        <span class="stars">★</span>
      </div>
      <div class="mt-1 text-xs text-muted">Generate</div>
    </div>
    <div class="card p-6 rise d5">
      <div class="text-xs font-semibold uppercase tracking-wider text-muted">Conversion</div>
      <div class="mt-2 flex items-baseline gap-1">
        <span class="h-display text-5xl"><?= $conv ?></span>
        <span class="font-display text-2xl text-muted">%</span>
      </div>
      <div class="mt-1 text-xs text-muted">5★ / contattati</div>
    </div>
  </div>

  <!-- Coda di oggi -->
  <div class="card overflow-hidden rise d6">
    <div class="px-6 py-5 border-b border-line flex items-center justify-between">
      <div>
        <h2 class="font-display text-xl font-semibold">Coda di oggi</h2>
        <p class="text-sm text-muted mt-0.5">Lista dei clienti da contattare via WhatsApp.</p>
      </div>
      <span class="chip"><?= $customersToday ?> oggi</span>
    </div>

    <?php if ($customersToday === 0): ?>
      <div class="px-6 py-20 text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-mint grid place-items-center mb-5">
          <svg class="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        </div>
        <h3 class="font-display text-2xl font-semibold">Inizia da qui</h3>
        <p class="text-body mt-2 max-w-sm mx-auto">Carica la lista dei clienti del giorno per iniziare. Bastano nome e numero WhatsApp.</p>
        <div class="mt-6 inline-flex gap-2">
          <button class="btn-secondary text-sm">Incolla lista</button>
          <button class="btn-primary text-sm">Carica CSV</button>
        </div>
      </div>
    <?php endif; ?>
  </div>

  <!-- Azioni rapide -->
  <div class="grid md:grid-cols-3 gap-4 mt-8">
    <?php
    $actions = [
      ['Personalizza messaggio', 'Modifica il testo WhatsApp inviato ai clienti.', 'M3.75 21v-4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125V21m-7.5 0V11.25M3.75 21H21m-1.5-9.75v-4.5l-7.5-3.75-7.5 3.75v4.5'],
      ['Imposta il regalo', 'Cosa offri a chi lascia 5 stelle.',                  'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'],
      ['Statistiche',           'Andamento recensioni nel tempo.',                'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z'],
    ];
    foreach ($actions as $a): ?>
      <a href="#" class="card p-6 hover:border-primary-500/40 hover:shadow-soft transition group">
        <div class="w-11 h-11 rounded-xl bg-mint group-hover:bg-primary-500 group-hover:text-white text-primary-600 grid place-items-center mb-4 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="<?= $a[2] ?>"/></svg>
        </div>
        <h3 class="font-display text-lg font-semibold mb-1"><?= $a[0] ?></h3>
        <p class="text-sm text-body"><?= $a[1] ?></p>
      </a>
    <?php endforeach; ?>
  </div>
</section>

<?php layout_foot();
