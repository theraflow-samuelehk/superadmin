<?php
require __DIR__ . '/includes/auth.php';
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/layout.php';

$error = null;
$values = ['business_name' => '', 'slug' => '', 'email' => '', 'name' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $values = [
        'business_name' => trim($_POST['business_name'] ?? ''),
        'slug' => strtolower(preg_replace('/[^a-z0-9-]/i', '-', trim($_POST['slug'] ?? ''))),
        'email' => trim($_POST['email'] ?? ''),
        'name' => trim($_POST['name'] ?? ''),
    ];
    $password = $_POST['password'] ?? '';

    if ($values['business_name'] === '' || $values['slug'] === '' || $values['email'] === '' || strlen($password) < 8) {
        $error = 'Compila tutti i campi. La password deve avere almeno 8 caratteri.';
    } elseif (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
        $error = 'Email non valida.';
    } else {
        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('SELECT 1 FROM tenants WHERE slug = ?');
            $stmt->execute([$values['slug']]);
            if ($stmt->fetch()) throw new RuntimeException('Questo slug è già in uso, scegline un altro.');

            $stmt = $pdo->prepare('SELECT 1 FROM users WHERE email = ?');
            $stmt->execute([$values['email']]);
            if ($stmt->fetch()) throw new RuntimeException('Esiste già un account con questa email.');

            $stmt = $pdo->prepare('INSERT INTO tenants (name, slug, language) VALUES (?, ?, ?)');
            $stmt->execute([$values['business_name'], $values['slug'], 'it']);
            $tenantId = (int)$pdo->lastInsertId();

            $stmt = $pdo->prepare('INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $tenantId,
                $values['email'],
                password_hash($password, PASSWORD_BCRYPT),
                $values['name'] ?: null,
                'admin',
            ]);
            $userId = (int)$pdo->lastInsertId();

            $pdo->commit();

            $_SESSION['user'] = [
                'id' => $userId,
                'tenant_id' => $tenantId,
                'email' => $values['email'],
                'name' => $values['name'] ?: null,
                'role' => 'admin',
            ];
            header('Location: /checkout.php?welcome=1');
            exit;
        } catch (RuntimeException $e) {
            $pdo->rollBack();
            $error = $e->getMessage();
        } catch (PDOException $e) {
            $pdo->rollBack();
            error_log('Register failed: ' . $e->getMessage());
            $error = 'Errore durante la registrazione. Riprova.';
        }
    }
}

layout_head('Registra il tuo centro');
?>

<section class="relative min-h-[calc(100vh-220px)] flex items-center justify-center px-6 py-16">
  <div class="absolute inset-0 bg-gradient-to-b from-sage to-white -z-10"></div>

  <div class="relative w-full max-w-xl">
    <div class="text-center mb-8 rise d1">
      <div class="flex items-center justify-center gap-3 mb-4">
        <div class="flex items-center gap-2">
          <span class="grid place-items-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold">1</span>
          <span class="text-sm font-semibold text-ink">Account</span>
        </div>
        <span class="w-8 h-px bg-line"></span>
        <div class="flex items-center gap-2 opacity-50">
          <span class="grid place-items-center w-6 h-6 rounded-full bg-line2 text-muted text-xs font-bold">2</span>
          <span class="text-sm text-muted">Pagamento</span>
        </div>
      </div>
      <h1 class="h-display text-4xl md:text-5xl">Crea il tuo centro.</h1>
      <p class="text-body mt-3">14 giorni gratis. La carta serve solo nel passaggio successivo.</p>
    </div>

    <div class="card p-8 shadow-soft rise d2">
      <?php if ($error): ?>
        <div class="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          <?= htmlspecialchars($error) ?>
        </div>
      <?php endif; ?>

      <form method="post" class="space-y-5">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token()) ?>">
        <div>
          <label class="block text-sm font-semibold text-ink mb-2">Nome attività</label>
          <input name="business_name" required value="<?= htmlspecialchars($values['business_name']) ?>" placeholder="Centro Estetico Bellezza">
        </div>
        <div>
          <label class="block text-sm font-semibold text-ink mb-2">Indirizzo del tuo sondaggio</label>
          <div class="relative">
            <input name="slug" required value="<?= htmlspecialchars($values['slug']) ?>" placeholder="centro-bellezza" class="pl-14">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-soft font-medium">/r/</span>
          </div>
          <p class="text-xs text-muted mt-1.5">Solo lettere, numeri e trattini. Sarà il link che invii ai clienti.</p>
        </div>
        <div class="grid sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-semibold text-ink mb-2">Il tuo nome</label>
            <input name="name" value="<?= htmlspecialchars($values['name']) ?>" placeholder="Anna">
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-2">Email</label>
            <input type="email" name="email" required value="<?= htmlspecialchars($values['email']) ?>" placeholder="anna@centro.it">
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold text-ink mb-2">Password (min 8 caratteri)</label>
          <input type="password" name="password" required minlength="8" placeholder="••••••••">
        </div>
        <button class="btn-primary w-full justify-center mt-3 py-3.5">
          Continua al pagamento
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"/></svg>
        </button>
      </form>

      <div class="mt-7 pt-6 border-t border-line text-center">
        <p class="text-sm text-muted">Hai già un account? <a href="/login.php" class="in-link">Accedi</a></p>
      </div>
    </div>
  </div>
</section>

<?php layout_foot();
