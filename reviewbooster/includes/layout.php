<?php
function layout_head(string $title = 'ReviewBoost', bool $marketing = false): void {
    $u = effective_user();
    $imp = impersonating_as();
    ?><!doctype html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= htmlspecialchars($title) ?> · ReviewBoost</title>
<meta name="description" content="ReviewBoost: la piattaforma che trasforma ogni cliente del giorno in una recensione Google a 5 stelle, in automatico, via WhatsApp.">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Plus+Jakarta+Sans:wght@300..800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">

<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Georgia', 'serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink:     '#0F1411',
        body:    '#3F4744',
        muted:   '#6B7370',
        soft:    '#9AA09D',
        line:    '#E6E8E5',
        line2:   '#EFF1EE',
        bone:    '#FAF9F5',
        sage:    '#F1F4EC',
        mint:    '#E4F1E9',
        cream:   '#FFF6DD',
        primary: { 50:'#E8F4EE', 100:'#C9E6D6', 500:'#0F8E5C', 600:'#0B7549', 700:'#0A6740', 900:'#053826' },
        sun:     '#F4C400',
        // alias retrocompat
        brand: { 50:'#E8F4EE', 100:'#C9E6D6', 500:'#0F8E5C', 600:'#0B7549', 700:'#0A6740', 800:'#053826' },
        accent: { 500:'#0F8E5C', 600:'#0B7549', 700:'#0A6740' },
      },
      letterSpacing: { tightest: '-0.045em' },
      boxShadow: {
        'soft':  '0 1px 2px rgba(15,20,17,.04), 0 8px 24px -12px rgba(15,20,17,.10)',
        'lift':  '0 1px 2px rgba(15,20,17,.04), 0 24px 48px -16px rgba(15,20,17,.18)',
        'inner-line': 'inset 0 0 0 1px rgba(15,20,17,.06)',
      },
    }
  }
};
</script>
<style>
  :root {
    --ink:#0F1411; --body:#3F4744; --muted:#6B7370; --soft:#9AA09D;
    --line:#E6E8E5; --line2:#EFF1EE; --bone:#FAF9F5; --sage:#F1F4EC; --mint:#E4F1E9; --cream:#FFF6DD;
    --primary:#0F8E5C; --primary-700:#0A6740; --sun:#F4C400;
  }
  html, body { background: #FFFFFF; color: var(--ink); }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; font-feature-settings: 'ss01', 'ss03'; }
  .font-display { font-family: 'Bricolage Grotesque', Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.025em; }
  .font-script  { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; letter-spacing: -0.005em; font-weight: 400; }

  .h-display { font-family: 'Bricolage Grotesque', Georgia, serif; font-weight: 500; letter-spacing: -0.035em; line-height: 1.02; font-optical-sizing: auto; }

  /* Bottoni */
  .btn-primary {
    display: inline-flex; align-items: center; gap: .55rem;
    background: var(--primary); color: #fff;
    padding: .85rem 1.35rem; border-radius: 999px;
    font-weight: 600; font-size: .95rem;
    box-shadow: 0 1px 0 rgba(255,255,255,.2) inset, 0 6px 18px -6px rgba(15,142,92,.6);
    transition: background .2s, transform .15s, box-shadow .25s;
  }
  .btn-primary:hover { background: var(--primary-700); transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,.2) inset, 0 10px 22px -6px rgba(15,142,92,.55); }
  .btn-secondary {
    display: inline-flex; align-items: center; gap: .55rem;
    background: #fff; color: var(--ink);
    padding: .85rem 1.35rem; border-radius: 999px;
    font-weight: 600; font-size: .95rem;
    border: 1px solid var(--line);
    transition: border-color .15s, background .15s;
  }
  .btn-secondary:hover { border-color: #cdd1cd; background: var(--bone); }

  /* Chip eyebrow */
  .chip {
    display: inline-flex; align-items: center; gap: .45rem;
    padding: .35rem .75rem; border-radius: 999px;
    background: var(--mint); border: 1px solid #cce4d5;
    font-size: .78rem; color: var(--primary-700); font-weight: 600;
    letter-spacing: 0.02em;
  }
  .chip .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--primary); box-shadow: 0 0 0 3px rgba(15,142,92,.18); }

  /* Card base */
  .card { background: #fff; border: 1px solid var(--line); border-radius: 20px; }
  .card-soft { background: var(--bone); border: 1px solid var(--line); border-radius: 20px; }

  /* Input form */
  input[type=text], input[type=email], input[type=password], input[type=tel], textarea, select {
    background: #fff; border: 1px solid var(--line); color: var(--ink);
    border-radius: 12px; padding: .85rem 1rem; width: 100%; font-size: .95rem;
    transition: border-color .15s, box-shadow .15s;
  }
  input:focus, textarea:focus, select:focus {
    outline: none; border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(15,142,92,.10);
  }
  ::placeholder { color: var(--soft); }

  /* Animazioni */
  @keyframes rise { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
  .rise { animation: rise .8s cubic-bezier(.2,.8,.2,1) both; }
  .d1 { animation-delay:.04s } .d2 { animation-delay:.14s } .d3 { animation-delay:.26s }
  .d4 { animation-delay:.4s }  .d5 { animation-delay:.55s } .d6 { animation-delay:.7s }

  /* Stelle */
  .stars { color: var(--sun); letter-spacing: .03em; }

  /* Tabella admin */
  table.tbl { width:100%; border-collapse: collapse; }
  table.tbl th { text-align:left; padding: 14px 18px; font-size:.74rem; font-weight: 600; letter-spacing:.05em; text-transform:uppercase; color: var(--muted); border-bottom: 1px solid var(--line); background: var(--bone); }
  table.tbl td { padding: 16px 18px; border-bottom: 1px solid var(--line2); font-size: .94rem; }
  table.tbl tr:hover td { background: var(--bone); }
  table.tbl tr:last-child td { border-bottom: none; }

  /* FAQ accordion CSS-only */
  details.faq { border-bottom: 1px solid var(--line); padding: 1.4rem 0; }
  details.faq summary { display: flex; justify-content: space-between; align-items: center; cursor: pointer; list-style: none; font-family: 'Bricolage Grotesque', serif; font-weight: 500; font-size: 1.15rem; letter-spacing: -0.01em; color: var(--ink); }
  details.faq summary::-webkit-details-marker { display: none; }
  details.faq summary::after { content: '+'; font-size: 1.5rem; color: var(--primary); transition: transform .2s; line-height: 1; }
  details.faq[open] summary::after { transform: rotate(45deg); }
  details.faq p { margin-top: .9rem; color: var(--body); line-height: 1.65; max-width: 60ch; }

  /* Highlight underline */
  .hl-mint { background: linear-gradient(180deg, transparent 70%, var(--mint) 70%); padding: 0 .12em; }
  .hl-cream { background: linear-gradient(180deg, transparent 70%, var(--cream) 70%); padding: 0 .12em; }

  /* link underline animato */
  a.in-link { color: var(--primary); font-weight: 600; position: relative; }
  a.in-link::after { content:''; position:absolute; left:0; right:0; bottom:-2px; height:1px; background: currentColor; transform-origin: left; transition: transform .35s cubic-bezier(.2,.8,.2,1); }
  a.in-link:hover::after { transform: scaleX(0); transform-origin: right; }

  /* ─── FAB WhatsApp con bolla popup (in stile competitor) ─── */
  .fab-wrap { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 60; display: flex; align-items: center; gap: .75rem; }
  .fab-bubble {
    background: #fff; border-radius: 14px;
    padding: .75rem 2.2rem .75rem 1rem;
    box-shadow: 0 12px 28px -8px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.08);
    position: relative; max-width: 260px;
    animation: bubbleIn .6s cubic-bezier(.2,.8,.2,1) .8s both;
  }
  .fab-bubble .b-title { font-weight: 700; font-size: .95rem; color: var(--ink); line-height: 1.25; }
  .fab-bubble .b-sub   { font-size: .82rem; color: var(--muted); margin-top: 1px; }
  .fab-bubble::after {
    content:''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%) rotate(45deg);
    width: 12px; height: 12px; background: #fff;
    box-shadow: 2px -2px 4px -2px rgba(0,0,0,.05);
  }
  .fab-bubble .b-close {
    position: absolute; top: 4px; right: 4px;
    width: 22px; height: 22px; border-radius: 999px; border: none;
    background: var(--bone); color: var(--muted);
    display: grid; place-items: center; cursor: pointer; font-size: 12px; line-height: 1;
    transition: background .15s, color .15s;
  }
  .fab-bubble .b-close:hover { background: var(--line); color: var(--ink); }

  .fab-circle {
    width: 64px; height: 64px; border-radius: 999px;
    background: #25D366; color: #fff;
    display: grid; place-items: center;
    box-shadow: 0 14px 30px -8px rgba(37,211,102,.6), 0 2px 6px rgba(0,0,0,.12);
    transition: background .15s, transform .2s;
    position: relative;
  }
  .fab-circle:hover { background: #1faa54; transform: scale(1.04); }
  .fab-circle::before {
    content:''; position: absolute; inset: 0; border-radius: inherit;
    box-shadow: 0 0 0 0 rgba(37,211,102,.55);
    animation: fabPulse 2.4s infinite;
    pointer-events: none;
  }
  .fab-badge {
    position: absolute; top: -2px; right: -2px;
    min-width: 22px; height: 22px; padding: 0 6px;
    border-radius: 999px; background: #EF4444; color: #fff;
    font-size: 12px; font-weight: 700;
    display: grid; place-items: center;
    box-shadow: 0 0 0 3px #fff;
  }
  @keyframes fabPulse {
    0%   { box-shadow: 0 0 0 0 rgba(37,211,102,.55); }
    70%  { box-shadow: 0 0 0 18px rgba(37,211,102,0); }
    100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
  }
  @keyframes bubbleIn {
    from { opacity: 0; transform: translateX(8px) scale(.96); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  .fab-wrap[data-hidden="true"] .fab-bubble { display: none; }

  /* Mobile: nascondo bolla, lascio solo cerchio */
  @media (max-width: 640px) {
    .fab-bubble { display: none; }
  }

  /* Bumper dei contenuti per non far coprire dal FAB */
  main { padding-bottom: 1rem; }
</style>
</head>
<body class="min-h-screen">

<?php if ($imp): ?>
<div class="bg-sun text-ink text-xs py-2 px-4 text-center font-semibold tracking-wide">
  Stai impersonando <strong><?= htmlspecialchars($imp['email']) ?></strong> ·
  <a href="/super/stop-impersonate.php" class="underline">Torna a Super Admin</a>
</div>
<?php endif; ?>

<header class="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-line">
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2.5 group">
      <span class="grid place-items-center w-9 h-9 rounded-xl bg-primary-500 text-white shadow-soft">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 .8l3 7.5 8.2.6-6.3 5.3 2 8L12 17.7 5.1 22.2l2-8L.8 8.9l8.2-.6z"/></svg>
      </span>
      <span class="font-display text-xl font-semibold tracking-tightest text-ink">ReviewBoost</span>
    </a>
    <nav class="flex items-center gap-2 text-sm">
      <?php if ($u && !$marketing): ?>
        <?php if (($u['role'] ?? null) === 'super_admin' && !$imp): ?>
          <a href="/super/" class="btn-secondary text-sm py-2 px-4">Super Admin</a>
        <?php else: ?>
          <a href="/admin/" class="btn-secondary text-sm py-2 px-4">Area</a>
        <?php endif; ?>
        <span class="hidden md:inline-block text-xs text-muted px-2"><?= htmlspecialchars($u['email']) ?></span>
        <a href="/logout.php" class="text-sm text-muted hover:text-ink px-3 py-2">Esci</a>
      <?php elseif ($marketing): ?>
        <a href="#come-funziona" class="hidden md:inline-block text-sm text-body hover:text-ink font-medium px-3 py-2">Come funziona</a>
        <a href="#prezzi" class="hidden md:inline-block text-sm text-body hover:text-ink font-medium px-3 py-2">Prezzi</a>
        <a href="#faq" class="hidden md:inline-block text-sm text-body hover:text-ink font-medium px-3 py-2">FAQ</a>
        <a href="tel:+390000000000" class="btn-primary text-sm py-2.5 px-5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372a1.125 1.125 0 00-.852-1.091l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a.75.75 0 01-.93.225 12.75 12.75 0 01-5.586-5.586.75.75 0 01.225-.93l1.293-.97a1.125 1.125 0 00.417-1.173L7.345 4.852A1.125 1.125 0 006.255 4H4.875A2.625 2.625 0 002.25 6.625v.125z"/></svg>
          Chiamaci
        </a>
      <?php endif; ?>
    </nav>
  </div>
</header>

<main>
<?php
}

function layout_foot(): void {
?>
</main>

<footer class="bg-bone border-t border-line mt-24">
  <div class="max-w-6xl mx-auto px-6 py-14 grid md:grid-cols-12 gap-10">
    <div class="md:col-span-5">
      <div class="flex items-center gap-2.5 mb-4">
        <span class="grid place-items-center w-8 h-8 rounded-xl bg-primary-500 text-white">
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="currentColor"><path d="M12 .8l3 7.5 8.2.6-6.3 5.3 2 8L12 17.7 5.1 22.2l2-8L.8 8.9l8.2-.6z"/></svg>
        </span>
        <span class="font-display text-lg font-semibold tracking-tightest">ReviewBoost</span>
      </div>
      <p class="text-sm text-body leading-relaxed max-w-sm">La piattaforma che la tua receptionist apre la mattina per trasformare i clienti soddisfatti in recensioni Google.</p>
    </div>
    <div class="md:col-span-3">
      <h4 class="font-semibold text-sm mb-3">Prodotto</h4>
      <ul class="space-y-2 text-sm text-body">
        <li><a href="#come-funziona" class="hover:text-ink">Come funziona</a></li>
        <li><a href="#prezzi" class="hover:text-ink">Prezzi</a></li>
        <li><a href="#faq" class="hover:text-ink">Domande frequenti</a></li>
      </ul>
    </div>
    <div class="md:col-span-4">
      <h4 class="font-semibold text-sm mb-3">Contatti</h4>
      <a href="tel:+390000000000" class="font-display text-2xl text-primary-600 hover:text-primary-700 block">+39 XXX XXX XXXX</a>
      <p class="text-sm text-muted mt-1">Lun–Ven · 9:00 — 19:00</p>
    </div>
  </div>
  <div class="border-t border-line">
    <div class="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted">
      <span>© <?= date('Y') ?> ReviewBoost · Tutti i diritti riservati</span>
      <span>Made with care in Italy</span>
    </div>
  </div>
</footer>

<!-- FAB WhatsApp · bolla popup + cerchio con pulse + badge -->
<div class="fab-wrap" id="fab-wa" data-hidden="false">
  <div class="fab-bubble">
    <button class="b-close" onclick="document.getElementById('fab-wa').dataset.hidden='true'" aria-label="Chiudi">×</button>
    <div class="b-title">Scrivici su WhatsApp</div>
    <div class="b-sub">Rispondiamo in 2 min</div>
  </div>
  <a class="fab-circle" href="https://wa.me/390000000000?text=Ciao%2C%20vorrei%20attivare%20ReviewBoost" target="_blank" rel="noopener" aria-label="Chatta su WhatsApp">
    <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4 7.94 7.94 0 0 0 4.1 12a7.9 7.9 0 0 0 1.05 3.95L4 20l4.18-1.1a7.93 7.93 0 0 0 3.87 1h.01a7.94 7.94 0 0 0 7.95-7.95 7.9 7.9 0 0 0-2.41-5.63zm-5.55 12.22h-.01a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.49.65.66-2.42-.16-.25a6.58 6.58 0 0 1-1.01-3.5 6.6 6.6 0 0 1 11.27-4.66 6.55 6.55 0 0 1 1.93 4.66 6.6 6.6 0 0 1-6.59 6.58zm3.62-4.93c-.2-.1-1.18-.58-1.36-.65-.18-.07-.31-.1-.45.1-.13.2-.51.65-.63.78-.12.13-.23.15-.43.05-.2-.1-.83-.31-1.59-.98-.59-.52-.99-1.17-1.1-1.37-.12-.2-.01-.31.09-.41.09-.09.2-.23.3-.35.1-.12.13-.2.2-.33.07-.13.03-.25-.02-.35-.05-.1-.45-1.08-.62-1.48-.16-.39-.33-.34-.45-.35-.12 0-.25-.02-.38-.02-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66 0 .98.71 1.92.81 2.05.1.13 1.41 2.15 3.41 3.01.48.21.85.33 1.14.42.48.15.91.13 1.26.08.38-.06 1.18-.48 1.34-.95.17-.47.17-.86.12-.95-.05-.08-.18-.13-.38-.23z"/></svg>
    <span class="fab-badge">1</span>
  </a>
</div>

</body>
</html>
<?php
}

function flash_set(string $key, string $msg): void { $_SESSION['flash'][$key] = $msg; }
function flash_get(string $key): ?string { $m = $_SESSION['flash'][$key] ?? null; unset($_SESSION['flash'][$key]); return $m; }
