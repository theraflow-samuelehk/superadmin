<?php
require __DIR__ . '/includes/auth.php';
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/layout.php';

$error = null;
$email = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email === '' || $password === '') {
        $error = 'Inserisci email e password.';
    } else {
        $stmt = $pdo->prepare('SELECT id, tenant_id, email, name, role, password_hash FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $u = $stmt->fetch();
        if (!$u || !password_verify($password, $u['password_hash'])) {
            $error = 'Email o password errate.';
        } else {
            unset($u['password_hash']);
            $_SESSION['user'] = $u;
            header('Location: ' . ($u['role'] === 'super_admin' ? '/super/' : '/admin/'));
            exit;
        }
    }
}

layout_head('Accedi');
?>

<section class="relative min-h-[calc(100vh-220px)] flex items-center justify-center px-6 py-16">
  <div class="absolute inset-0 bg-gradient-to-b from-sage to-white -z-10"></div>

  <div class="relative w-full max-w-md">
    <div class="text-center mb-8 rise d1">
      <span class="chip"><span class="dot"></span> Area riservata</span>
      <h1 class="h-display text-4xl md:text-5xl mt-5">Bentornato.</h1>
      <p class="text-body mt-3">Accedi per gestire il tuo centro.</p>
    </div>

    <div class="card p-8 shadow-soft rise d2">
      <?php if ($error): ?>
        <div class="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          <?= htmlspecialchars($error) ?>
        </div>
      <?php endif; ?>

      <form method="post" action="/login.php" class="space-y-5">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token()) ?>">
        <div>
          <label class="block text-sm font-semibold text-ink mb-2">Email</label>
          <input type="email" name="email" required autofocus value="<?= htmlspecialchars($email) ?>" placeholder="tu@centro.it">
        </div>
        <div>
          <label class="block text-sm font-semibold text-ink mb-2">Password</label>
          <input type="password" name="password" required placeholder="••••••••">
        </div>
        <button class="btn-primary w-full justify-center mt-2 py-3.5">
          Accedi
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"/></svg>
        </button>
      </form>

      <div class="mt-7 pt-6 border-t border-line text-center">
        <p class="text-sm text-muted">
          Sei un nuovo centro?
          <a href="/register.php" class="in-link ml-1">Registrati →</a>
        </p>
      </div>
    </div>

    <p class="text-center text-xs text-soft mt-6">
      Hai bisogno di aiuto? <a href="tel:+390000000000" class="in-link">Chiamaci</a>
    </p>
  </div>
</section>

<?php layout_foot();
