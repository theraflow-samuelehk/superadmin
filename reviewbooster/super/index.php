<?php
require __DIR__ . '/../includes/auth.php';
require __DIR__ . '/../includes/db.php';
require __DIR__ . '/../includes/layout.php';

if (impersonating_as()) { header('Location: /admin/'); exit; }
require_super_admin();

$rows = $pdo->query('
    SELECT t.id, t.name, t.slug, t.created_at,
           (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) AS users_count,
           (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id) AS customers_count,
           (SELECT email FROM users WHERE tenant_id = t.id ORDER BY id LIMIT 1) AS first_admin_email,
           (SELECT id FROM users WHERE tenant_id = t.id ORDER BY id LIMIT 1) AS first_admin_id
    FROM tenants t
    ORDER BY t.id DESC
')->fetchAll();

$totalTenants = count($rows);
$totalUsers = array_sum(array_column($rows, 'users_count'));
$totalCustomers = array_sum(array_column($rows, 'customers_count'));

layout_head('Super Admin');
?>

<section class="max-w-6xl mx-auto px-6 py-10 md:py-14">
  <div class="mb-10 rise d1">
    <span class="chip mb-3" style="background:#FFF6DD; border-color:#FCE69E; color:#8A6D00"><span class="dot" style="background:#F4C400;box-shadow:0 0 0 3px rgba(244,196,0,.18)"></span> Super Admin</span>
    <h1 class="h-display text-4xl md:text-5xl">Tutti i centri sulla piattaforma.</h1>
    <p class="text-body mt-3 max-w-2xl">Vedi ogni tenant, le metriche aggregate, e impersona qualsiasi admin per dare assistenza.</p>
  </div>

  <!-- Stats globali -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
    <div class="card p-6 bg-mint border-primary-100 rise d2">
      <div class="text-xs font-semibold uppercase tracking-wider text-primary-700">Centri totali</div>
      <div class="mt-2 h-display text-5xl text-primary-700"><?= $totalTenants ?></div>
      <div class="mt-1 text-xs text-primary-700/70">Sulla piattaforma</div>
    </div>
    <div class="card p-6 rise d3">
      <div class="text-xs font-semibold uppercase tracking-wider text-muted">Utenti</div>
      <div class="mt-2 h-display text-5xl"><?= $totalUsers ?></div>
      <div class="mt-1 text-xs text-muted">Admin + receptionist</div>
    </div>
    <div class="card p-6 rise d4">
      <div class="text-xs font-semibold uppercase tracking-wider text-muted">Clienti gestiti</div>
      <div class="mt-2 h-display text-5xl"><?= $totalCustomers ?></div>
      <div class="mt-1 text-xs text-muted">Aggregati</div>
    </div>
    <div class="card p-6 rise d5">
      <div class="text-xs font-semibold uppercase tracking-wider text-muted">Stato sistema</div>
      <div class="mt-2 flex items-center gap-2 h-display text-2xl text-primary-600">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
        </span>
        Operativo
      </div>
      <div class="mt-1 text-xs text-muted">Tutti i servizi attivi</div>
    </div>
  </div>

  <!-- Tabella -->
  <div class="card overflow-hidden rise d6">
    <div class="px-6 py-5 border-b border-line flex items-center justify-between">
      <div>
        <h2 class="font-display text-xl font-semibold">Centri registrati</h2>
        <p class="text-sm text-muted mt-0.5">Più recenti in alto.</p>
      </div>
      <span class="chip"><?= $totalTenants ?> totali</span>
    </div>

    <?php if (!$rows): ?>
      <div class="px-6 py-20 text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-bone grid place-items-center mb-5 border border-line">
          <svg class="w-7 h-7 text-muted" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"/></svg>
        </div>
        <h3 class="font-display text-2xl font-semibold">Nessun centro registrato</h3>
        <p class="text-body mt-2">Quando un nuovo cliente si iscriverà apparirà qui.</p>
      </div>
    <?php else: ?>
      <div class="overflow-x-auto">
        <table class="tbl">
          <thead><tr>
            <th>Centro</th><th>Slug</th><th>Admin</th>
            <th class="text-right">Utenti</th><th class="text-right">Clienti</th>
            <th>Iscritto</th><th></th>
          </tr></thead>
          <tbody>
            <?php foreach ($rows as $r): ?>
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="grid place-items-center w-9 h-9 rounded-xl bg-mint text-primary-700 font-display font-semibold text-sm">
                      <?= strtoupper(substr($r['name'], 0, 2)) ?>
                    </div>
                    <span class="font-semibold"><?= htmlspecialchars($r['name']) ?></span>
                  </div>
                </td>
                <td><code class="text-xs text-primary-700 bg-mint border border-primary-100 px-2 py-0.5 rounded font-semibold">/r/<?= htmlspecialchars($r['slug']) ?></code></td>
                <td class="text-body text-sm"><?= htmlspecialchars($r['first_admin_email'] ?? '—') ?></td>
                <td class="text-right text-sm font-semibold"><?= $r['users_count'] ?></td>
                <td class="text-right text-sm font-semibold"><?= $r['customers_count'] ?></td>
                <td class="text-muted text-sm"><?= htmlspecialchars(substr($r['created_at'], 0, 10)) ?></td>
                <td class="text-right">
                  <?php if ($r['first_admin_id']): ?>
                    <form method="post" action="/super/impersonate.php" class="inline">
                      <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token()) ?>">
                      <input type="hidden" name="user_id" value="<?= (int)$r['first_admin_id'] ?>">
                      <button class="btn-secondary text-xs py-1.5 px-3">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Impersona
                      </button>
                    </form>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
</section>

<?php layout_foot();
