<?php
require __DIR__ . '/includes/auth.php';
require __DIR__ . '/includes/layout.php';

$user = require_login();
if (($user['role'] ?? null) === 'super_admin') { header('Location: /super/'); exit; }

layout_head('Attiva la prova gratuita');
?>

<section class="relative min-h-[calc(100vh-220px)] px-6 py-16">
  <div class="absolute inset-0 bg-gradient-to-b from-sage to-white -z-10"></div>

  <div class="relative max-w-3xl mx-auto">
    <div class="text-center mb-8 rise d1">
      <div class="flex items-center justify-center gap-3 mb-4">
        <div class="flex items-center gap-2 opacity-60">
          <span class="grid place-items-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </span>
          <span class="text-sm text-muted">Account</span>
        </div>
        <span class="w-8 h-px bg-line"></span>
        <div class="flex items-center gap-2">
          <span class="grid place-items-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold">2</span>
          <span class="text-sm font-semibold text-ink">Pagamento</span>
        </div>
      </div>
      <h1 class="h-display text-4xl md:text-5xl">Attiva 14 giorni gratis.</h1>
      <p class="text-body mt-3">Niente addebito per i primi 14 giorni. Disdici quando vuoi.</p>
    </div>

    <div class="grid md:grid-cols-5 gap-5 rise d2">
      <!-- Riepilogo -->
      <div class="card p-7 md:col-span-2 h-fit">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted mb-5">Riepilogo</div>
        <div class="space-y-3.5 text-sm">
          <div class="flex justify-between items-baseline">
            <span class="text-body">Piano</span>
            <span class="font-semibold">ReviewBoost Pro</span>
          </div>
          <div class="flex justify-between items-baseline">
            <span class="text-body">Prezzo</span>
            <span class="font-semibold">50€<span class="text-muted text-xs">/mese</span></span>
          </div>
          <div class="flex justify-between items-baseline pb-3 border-b border-line">
            <span class="text-body">Prova gratuita</span>
            <span class="font-semibold text-primary-600">14 giorni</span>
          </div>
          <div class="flex justify-between items-baseline pt-1">
            <span class="font-semibold">Oggi paghi</span>
            <span class="font-display text-2xl">0€</span>
          </div>
        </div>
        <div class="mt-6 pt-5 border-t border-line space-y-2.5 text-xs text-body">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Disdici quando vuoi
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Nessun vincolo contrattuale
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Pagamento sicuro Stripe
          </div>
        </div>
      </div>

      <!-- Pagamento -->
      <div class="card p-7 md:col-span-3 shadow-soft">
        <div class="text-xs font-semibold uppercase tracking-wider text-muted mb-5">Dati carta di credito</div>
        <div class="rounded-2xl bg-bone border border-line p-10 text-center">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-white border border-line grid place-items-center mb-4 shadow-soft">
            <svg class="w-6 h-6 text-muted" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
          </div>
          <p class="text-sm font-semibold text-ink">Modulo di pagamento Stripe</p>
          <p class="text-xs text-muted mt-1">Integrazione in arrivo</p>
        </div>
        <button disabled class="btn-primary w-full justify-center mt-5 py-4 opacity-40 cursor-not-allowed">
          Attiva 14 giorni gratuiti
        </button>
        <p class="text-xs text-muted mt-3 text-center flex items-center justify-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
          Pagamento crittografato 256-bit · Stripe
        </p>

        <div class="mt-7 pt-5 border-t border-line">
          <div class="flex items-center justify-between gap-4">
            <div>
              <span class="text-[10px] font-semibold uppercase tracking-widest text-yellow-700 bg-cream px-2 py-0.5 rounded">Modalità sviluppo</span>
              <p class="text-sm text-muted mt-1">Salta il pagamento per testare l'area.</p>
            </div>
            <a href="/admin/" class="btn-secondary text-sm whitespace-nowrap">
              Salta →
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<?php layout_foot();
