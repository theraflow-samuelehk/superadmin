<?php
require __DIR__ . '/includes/auth.php';
require __DIR__ . '/includes/layout.php';
require __DIR__ . '/includes/map_bg.php';
layout_head('Più recensioni Google a 5 stelle, ogni giorno', true);
?>

<style>
  /* Stelle che brillano */
  @keyframes twinkle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .7; transform: scale(1.08); } }
  .twinkle { animation: twinkle 2.4s ease-in-out infinite; }
  .twinkle:nth-child(2) { animation-delay: .3s; }
  .twinkle:nth-child(3) { animation-delay: .6s; }
  .twinkle:nth-child(4) { animation-delay: .9s; }
  .twinkle:nth-child(5) { animation-delay: 1.2s; }

  /* Marquee live recensioni */
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .marquee { display: flex; gap: 1rem; animation: marquee 50s linear infinite; width: max-content; }
  .marquee-pause:hover .marquee { animation-play-state: paused; }

  /* Pulse del badge "+1 recensione" */
  @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(15,142,92,.55); } 70% { box-shadow: 0 0 0 14px rgba(15,142,92,0); } 100% { box-shadow: 0 0 0 0 rgba(15,142,92,0); } }
  .pulse-ring { animation: pulseRing 2.5s infinite; }

  /* Conta-numeri "salita" */
  @keyframes countUp { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* Linea collegamento card */
  .arrow-deco { stroke-dasharray: 4 4; }

  /* Mockup di Google Maps card */
  .gmaps-card { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .gmaps-card .photo {
    height: 130px;
    background:
      linear-gradient(135deg, rgba(15,142,92,.0), rgba(15,142,92,.0)),
      linear-gradient(180deg, #c8d8c8 0%, #b3c9b8 100%);
    position: relative; overflow: hidden;
  }
  .gmaps-card.before .photo { background: linear-gradient(180deg, #d4d4d4 0%, #b8b8b8 100%); filter: grayscale(.4); }
  .gmaps-card.after .photo { background: linear-gradient(180deg, #d8e9d4 0%, #b1d3a8 100%); }

  /* Pin Google */
  .gmaps-pin {
    position: absolute; left: 50%; top: 55%; transform: translate(-50%, -50%);
    width: 36px; height: 48px;
  }
</style>

<!-- ─────────────────  HERO  ───────────────── -->
<section class="relative overflow-hidden">
  <!-- Background: mappa stile Google Maps densa -->
  <div class="absolute inset-0 z-0" aria-hidden="true">
    <?php render_map_bg(); ?>
    <!-- Overlay leggero solo nei punti del testo per leggibilità (NON copre la mappa) -->
    <div class="absolute inset-0" style="background: radial-gradient(ellipse 70% 55% at 50% 35%, rgba(255,255,255,.55) 0%, rgba(255,255,255,.25) 50%, transparent 80%), linear-gradient(180deg, transparent 60%, rgba(255,255,255,.4) 85%, #fff 100%);"></div>
    <!-- Tinte di colore decorative -->
    <div class="absolute inset-x-0 top-0 h-[500px] opacity-70 mix-blend-multiply" style="background-image: radial-gradient(50% 60% at 80% 0%, rgba(15,142,92,.10), transparent 70%), radial-gradient(40% 50% at 15% 30%, rgba(244,196,0,.08), transparent 70%);"></div>
  </div>

  <!-- decorative stars sparse -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
    <span class="stars twinkle absolute text-2xl" style="top:18%; left:8%;">★</span>
    <span class="stars twinkle absolute text-lg" style="top:32%; right:12%;">★</span>
    <span class="stars twinkle absolute text-3xl opacity-60" style="top:58%; left:5%;">★</span>
    <span class="stars twinkle absolute text-xl opacity-50" style="top:12%; right:25%;">★</span>
  </div>

  <div class="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16 text-center relative z-10">
    <span class="chip rise d1"><span class="dot"></span> Operativo per oltre 200 centri in Italia</span>

    <h1 class="h-display mt-7 text-5xl sm:text-6xl md:text-7xl lg:text-[5.4rem] max-w-4xl mx-auto rise d2 leading-[1.02]">
      Più <span class="font-script text-primary-500">stelle</span> sulla tua scheda Google.<br>
      <span class="font-script">Ogni giorno.</span> Senza <span class="font-script">fatica</span>.
    </h1>

    <p class="mt-7 text-lg md:text-xl text-body max-w-2xl mx-auto leading-relaxed rise d3">
      ReviewBoost è la piattaforma che la tua receptionist apre la mattina, clicca un bottone e parte un WhatsApp ai clienti del giorno prima. Loro lasciano la recensione su Google. <span class="text-ink font-semibold">Tu vedi crescere il tuo punteggio.</span>
    </p>

    <div class="mt-9 flex flex-wrap items-center justify-center gap-3 rise d4">
      <a href="tel:+390000000000" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372a1.125 1.125 0 00-.852-1.091l-4.423-1.106a1.125 1.125 0 00-1.173.417l-.97 1.293a.75.75 0 01-.93.225 12.75 12.75 0 01-5.586-5.586.75.75 0 01.225-.93l1.293-.97a1.125 1.125 0 00.417-1.173L7.345 4.852A1.125 1.125 0 006.255 4H4.875A2.625 2.625 0 002.25 6.625v.125z"/></svg>
        Inizia 14 giorni gratis
      </a>
      <a href="#prima-dopo" class="btn-secondary">Guarda il prima/dopo</a>
    </div>

    <div class="mt-7 flex items-center justify-center gap-6 text-sm text-muted rise d5">
      <span class="flex items-center gap-2">
        <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        Carta solo all'attivazione
      </span>
      <span class="flex items-center gap-2">
        <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        Disdici quando vuoi
      </span>
    </div>
  </div>

  <!-- Hero mockup prodotto -->
  <div class="max-w-5xl mx-auto px-6 pb-16 rise d6 relative">
    <!-- Pillola "+128 recensioni" in alto a sinistra -->
    <div class="absolute -top-3 left-2 md:left-6 z-10 hidden sm:flex items-center gap-2 bg-mint border border-primary-100 px-3 py-1.5 rounded-full shadow-soft">
      <svg class="w-4 h-4 text-primary-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .8l3 7.5 8.2.6-6.3 5.3 2 8L12 17.7 5.1 22.2l2-8L.8 8.9l8.2-.6z"/></svg>
      <span class="text-xs font-bold text-primary-700">+128 recensioni · ultimi 90gg</span>
    </div>

    <!-- Badge "+1 recensione" floating in alto a destra -->
    <div class="absolute -top-2 right-2 md:right-6 z-10 flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-line shadow-lift pulse-ring">
      <span class="grid place-items-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs">★</span>
      <span class="text-xs font-semibold">+1 recensione 5★ · ora</span>
    </div>

    <!-- Card flottante in basso a sx — "Da 4.1 a 4.8" -->
    <div class="absolute -bottom-4 -left-4 md:-left-10 z-10 hidden md:block bg-white rounded-2xl border border-line shadow-lift p-3 max-w-[230px] transform -rotate-3">
      <div class="flex items-center gap-2 mb-1.5">
        <div class="grid place-items-center w-6 h-6 rounded-full bg-primary-500 text-white">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
        </div>
        <span class="text-xs font-bold text-ink">Punteggio Google</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-xs text-muted line-through">4.1</span>
        <span class="text-xs text-muted">→</span>
        <span class="font-display text-2xl font-semibold text-primary-600">4.8</span>
        <span class="text-xs font-semibold text-primary-600">▲ +0.7</span>
      </div>
      <div class="flex items-center gap-0.5 mt-1">
        <span class="stars text-xs">★★★★★</span>
        <span class="text-[10px] text-muted ml-1">156 recensioni</span>
      </div>
    </div>

    <!-- Card flottante in basso a destra — "Posizione locale" -->
    <div class="absolute -bottom-4 -right-2 md:-right-10 z-10 hidden md:block bg-cream border border-yellow-200 rounded-2xl shadow-lift p-3 max-w-[200px] transform rotate-2">
      <div class="text-[10px] font-bold uppercase tracking-widest text-yellow-800 mb-1">Posizione locale</div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-xs text-muted line-through">#9</span>
        <span class="text-xs text-muted">→</span>
        <span class="font-display text-3xl font-bold text-yellow-800">#1</span>
      </div>
      <div class="text-[10px] text-yellow-800/80 mt-0.5">"Centro estetico Milano"</div>
    </div>

    <div class="bg-white rounded-2xl border border-line shadow-lift overflow-hidden">
      <div class="px-5 py-3 border-b border-line bg-bone flex items-center gap-3">
        <div class="flex gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-line2 border border-line"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-line2 border border-line"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-line2 border border-line"></span>
        </div>
        <div class="flex-1 text-center text-xs text-muted font-medium">app.reviewboost.it · Centro Estetico Bellezza</div>
      </div>
      <div class="grid md:grid-cols-3 gap-5 p-6">
        <div class="bg-mint rounded-xl p-5 border border-primary-100">
          <div class="text-xs font-semibold uppercase tracking-wider text-primary-700">Recensioni questo mese</div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="h-display text-4xl">+34</span>
            <span class="text-sm text-primary-700 font-semibold">▲ 47%</span>
          </div>
          <div class="flex items-end gap-1 h-10 mt-3">
            <?php $bars = [30,42,38,52,48,62,58,72,68,82,76,90]; foreach ($bars as $h): ?>
              <div class="flex-1 rounded-sm bg-primary-500/80" style="height: <?= $h ?>%; min-width: 4px;"></div>
            <?php endforeach; ?>
          </div>
        </div>
        <div class="bg-cream rounded-xl p-5 border border-yellow-200/50">
          <div class="text-xs font-semibold uppercase tracking-wider text-yellow-800">Punteggio Google</div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="h-display text-4xl">4.8</span>
            <span class="stars text-lg">★★★★★</span>
          </div>
          <div class="text-xs text-muted mt-3">su 312 recensioni · <span class="text-yellow-800 font-semibold">+0.4 quest'anno</span></div>
        </div>
        <div class="bg-sage rounded-xl p-5 border border-line">
          <div class="text-xs font-semibold uppercase tracking-wider text-muted">Coda di oggi</div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="h-display text-4xl">7</span>
            <span class="text-sm text-muted">clienti</span>
          </div>
          <div class="text-xs text-muted mt-3"><span class="text-primary-600 font-semibold">3 contattati</span> · 4 da fare</div>
        </div>
      </div>
      <div class="border-t border-line">
        <div class="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted bg-bone border-b border-line">Clienti di oggi</div>
        <?php
        $queue = [
          ['Anna Russo', 'Manicure gel', false],
          ['Marco Bianchi', 'Piega + tinta', true],
          ['Giulia Conti', 'Massaggio 60min', false],
        ];
        foreach ($queue as $i => $row): ?>
          <div class="flex items-center gap-4 px-6 py-3.5 <?= $i < count($queue)-1 ? 'border-b border-line2' : '' ?>">
            <div class="grid place-items-center w-9 h-9 rounded-full bg-sage text-primary-700 font-semibold text-sm">
              <?= strtoupper(substr($row[0],0,1) . substr(explode(' ', $row[0])[1] ?? '',0,1)) ?>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-ink text-sm"><?= $row[0] ?></div>
              <div class="text-xs text-muted"><?= $row[1] ?></div>
            </div>
            <?php if ($row[2]): ?>
              <span class="text-xs font-semibold text-primary-700 bg-mint px-3 py-1 rounded-full">✓ Inviato</span>
            <?php else: ?>
              <button class="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-[#1faa54]">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4 7.94 7.94 0 0 0 4.1 12a7.9 7.9 0 0 0 1.05 3.95L4 20l4.18-1.1a7.93 7.93 0 0 0 3.87 1h.01a7.94 7.94 0 0 0 7.95-7.95 7.9 7.9 0 0 0-2.41-5.63z"/></svg>
                Invia WhatsApp
              </button>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>

<!-- ─────────────────  MARQUEE LIVE RECENSIONI  ───────────────── -->
<section class="border-y border-line bg-bone py-5 marquee-pause overflow-hidden">
  <div class="flex items-center gap-6">
    <div class="flex-shrink-0 pl-6 hidden md:flex items-center gap-2">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
      </span>
      <span class="text-xs font-semibold uppercase tracking-wider text-primary-700">Live · oggi</span>
    </div>
    <div class="flex-1 overflow-hidden">
      <div class="marquee">
        <?php
        $live = [
          ['Anna L.', 'Centro Estetico Iris', '5★', '"Esperienza top, le ragazze sono bravissime!"', '12 min fa'],
          ['Marco R.', 'Capelli & Co Milano', '5★', '"Taglio perfetto, servizio impeccabile."', '34 min fa'],
          ['Giulia T.', 'Trattoria Da Maria', '5★', '"Cibo eccezionale, torno presto!"', '1 h fa'],
          ['Luca B.', 'Studio Dentistico Bianchi', '5★', '"Professionalità e gentilezza, consigliato."', '2 h fa'],
          ['Sara M.', 'Glam Beauty Lounge', '5★', '"Coccole pure, mi sono sentita una regina."', '3 h fa'],
          ['Paolo V.', 'Barber Shop Centrale', '5★', '"Atmosfera vintage, taglio impeccabile."', '4 h fa'],
        ];
        // duplico per loop infinito
        foreach (array_merge($live, $live) as $r): ?>
          <div class="flex items-center gap-3 bg-white border border-line rounded-full px-4 py-2 flex-shrink-0">
            <div class="grid place-items-center w-7 h-7 rounded-full bg-mint text-primary-700 text-xs font-bold flex-shrink-0">
              <?= strtoupper(substr($r[0],0,1) . substr(explode(' ', $r[0])[1] ?? '',0,1)) ?>
            </div>
            <span class="stars text-sm">★★★★★</span>
            <span class="text-sm text-body whitespace-nowrap"><?= $r[3] ?></span>
            <span class="text-xs text-muted whitespace-nowrap">— <?= $r[1] ?> · <?= $r[4] ?></span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</section>

<!-- ─────────────────  PRIMA / DOPO  ───────────────── -->
<section id="prima-dopo" class="relative py-24 md:py-32 overflow-hidden">
  <div class="absolute inset-0 -z-10" aria-hidden="true">
    <div class="absolute inset-0 bg-gradient-to-b from-bone via-white to-bone"></div>
    <div class="absolute inset-0 opacity-50" style="background-image: radial-gradient(60% 50% at 20% 0%, rgba(15,142,92,.08), transparent 50%), radial-gradient(50% 50% at 90% 90%, rgba(244,196,0,.08), transparent 50%);"></div>
  </div>

  <div class="max-w-6xl mx-auto px-6">
  <div class="text-center max-w-2xl mx-auto mb-14">
    <span class="chip mb-5"><span class="dot"></span> Risultato visibile</span>
    <h2 class="h-display text-4xl md:text-6xl">Il tuo Google. <span class="hl-cream">Prima e dopo.</span></h2>
    <p class="mt-5 text-lg text-body">90 giorni di ReviewBoost, raccontati con la scheda Google del Centro Estetico Bellezza di Milano.</p>
  </div>

  <div class="relative grid md:grid-cols-2 gap-6 lg:gap-12 items-center">
    <!-- PRIMA -->
    <div class="relative rise d2">
      <div class="absolute -top-3 left-6 z-10 bg-white border border-line text-xs font-semibold px-3 py-1 rounded-full text-muted">PRIMA</div>
      <div class="gmaps-card before bg-white rounded-3xl border border-line shadow-soft overflow-hidden">
        <!-- Photo header con pin -->
        <div class="photo">
          <svg class="gmaps-pin" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#9CA3A0"/>
            <circle cx="12" cy="12" r="5" fill="#fff"/>
          </svg>
        </div>
        <div class="p-5">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-muted">Centro Estetico</div>
          <h3 class="h-display text-2xl mt-1">Centro Bellezza Milano</h3>
          <div class="flex items-center gap-2 mt-2.5">
            <span class="h-display text-xl text-yellow-700">4.1</span>
            <div class="flex">
              <span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-yellow-500">★</span><span class="text-line">★</span>
            </div>
            <span class="text-sm text-muted">(28)</span>
          </div>
          <div class="text-sm text-muted mt-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
            Via Manzoni 12 · Aperto · 09:00 — 19:00
          </div>
          <div class="grid grid-cols-4 gap-2 mt-4">
            <button class="text-xs text-blue-700 font-semibold py-2 border border-line rounded-lg hover:bg-bone">Indicazioni</button>
            <button class="text-xs text-blue-700 font-semibold py-2 border border-line rounded-lg hover:bg-bone">Salva</button>
            <button class="text-xs text-blue-700 font-semibold py-2 border border-line rounded-lg hover:bg-bone">Vicino</button>
            <button class="text-xs text-blue-700 font-semibold py-2 border border-line rounded-lg hover:bg-bone">Invia</button>
          </div>
          <div class="mt-5 pt-4 border-t border-line">
            <div class="text-xs text-muted mb-2">Ultima recensione</div>
            <div class="flex items-center gap-2 text-xs text-muted">
              <span class="text-yellow-500">★★★★</span><span class="text-line">★</span>
              <span class="font-semibold">5 mesi fa</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Stats sotto -->
      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="bg-white border border-line rounded-2xl p-4 text-center">
          <div class="text-xs uppercase tracking-wider text-muted">Recensioni / mese</div>
          <div class="h-display text-3xl mt-1 text-muted">~5</div>
        </div>
        <div class="bg-white border border-line rounded-2xl p-4 text-center">
          <div class="text-xs uppercase tracking-wider text-muted">Posizione locale</div>
          <div class="h-display text-3xl mt-1 text-muted">#9</div>
        </div>
      </div>
    </div>

    <!-- Freccia in mezzo -->
    <div class="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center pointer-events-none">
      <div class="bg-white rounded-full shadow-lift border border-line p-4">
        <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </div>
    </div>

    <!-- DOPO -->
    <div class="relative rise d3">
      <div class="absolute -top-3 left-6 z-10 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-soft">DOPO · 90 giorni</div>
      <div class="absolute -top-4 -right-4 z-10 bg-cream border border-yellow-200 px-3 py-2 rounded-full shadow-soft transform rotate-6 hidden sm:block">
        <span class="text-xs font-bold text-yellow-800">+128 recensioni</span>
      </div>
      <div class="gmaps-card after bg-white rounded-3xl border-2 border-primary-500 shadow-lift overflow-hidden ring-4 ring-primary-500/10">
        <div class="photo">
          <svg class="gmaps-pin" viewBox="0 0 24 32" fill="none">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#0F8E5C"/>
            <circle cx="12" cy="12" r="5" fill="#fff"/>
          </svg>
          <!-- sparkle stars sopra il pin -->
          <span class="stars twinkle absolute text-base" style="top:18%; left:30%;">★</span>
          <span class="stars twinkle absolute text-sm" style="top:25%; right:30%;">★</span>
          <span class="stars twinkle absolute text-xs" style="top:35%; left:60%;">★</span>
        </div>
        <div class="p-5">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-primary-700">Centro Estetico</div>
          <h3 class="h-display text-2xl mt-1">Centro Bellezza Milano</h3>
          <div class="flex items-center gap-2 mt-2.5">
            <span class="h-display text-xl text-yellow-700">4.8</span>
            <div class="flex">
              <span class="text-yellow-500 twinkle">★</span><span class="text-yellow-500 twinkle">★</span><span class="text-yellow-500 twinkle">★</span><span class="text-yellow-500 twinkle">★</span><span class="text-yellow-500 twinkle">★</span>
            </div>
            <span class="text-sm text-muted">(156)</span>
            <span class="text-xs text-primary-600 font-semibold ml-1">▲ +0.7</span>
          </div>
          <div class="text-sm text-muted mt-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
            Via Manzoni 12 · Aperto · 09:00 — 19:00
          </div>
          <div class="grid grid-cols-4 gap-2 mt-4">
            <button class="text-xs text-primary-700 font-semibold py-2 border border-primary-100 bg-mint rounded-lg">Indicazioni</button>
            <button class="text-xs text-primary-700 font-semibold py-2 border border-primary-100 bg-mint rounded-lg">Salva</button>
            <button class="text-xs text-primary-700 font-semibold py-2 border border-primary-100 bg-mint rounded-lg">Vicino</button>
            <button class="text-xs text-primary-700 font-semibold py-2 border border-primary-100 bg-mint rounded-lg">Invia</button>
          </div>
          <div class="mt-5 pt-4 border-t border-line">
            <div class="text-xs text-muted mb-2">Ultima recensione</div>
            <div class="flex items-center gap-2 text-xs">
              <span class="stars">★★★★★</span>
              <span class="font-semibold text-primary-600">2 ore fa</span>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="bg-mint border border-primary-100 rounded-2xl p-4 text-center">
          <div class="text-xs uppercase tracking-wider text-primary-700">Recensioni / mese</div>
          <div class="h-display text-3xl mt-1 text-primary-700">~70</div>
        </div>
        <div class="bg-mint border border-primary-100 rounded-2xl p-4 text-center">
          <div class="text-xs uppercase tracking-wider text-primary-700">Posizione locale</div>
          <div class="h-display text-3xl mt-1 text-primary-700">#1</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quote sotto -->
  <div class="mt-16 max-w-2xl mx-auto text-center">
    <div class="stars text-2xl mb-4">★★★★★</div>
    <p class="font-display text-2xl md:text-3xl leading-snug text-ink">
      "Da 4.1 a 4.8 in tre mesi. La gente ci trova prima, e questo per noi <span class="hl-mint">vale ogni euro speso</span>."
    </p>
    <p class="mt-4 text-sm text-muted">— Laura Marchesi · Titolare, Centro Bellezza Milano</p>
  </div>
  </div><!-- /max-w-6xl wrapper aggiunto per il bg Maps -->
</section>

<!-- ─────────────────  GROWTH CHART DRAMATIC  ───────────────── -->
<section class="bg-gradient-to-b from-white via-mint/30 to-white border-y border-line py-24">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-2xl mx-auto mb-14">
      <span class="chip mb-5"><span class="dot"></span> 90 giorni in un grafico</span>
      <h2 class="h-display text-4xl md:text-5xl">La curva che <span class="hl-cream">i tuoi concorrenti</span> non hanno.</h2>
    </div>

    <div class="card p-8 md:p-12 shadow-soft relative overflow-hidden">
      <!-- Asse Y label -->
      <div class="flex items-end justify-between mb-3 text-xs text-muted">
        <span class="font-semibold uppercase tracking-wider">Recensioni Google al mese</span>
        <span class="font-semibold uppercase tracking-wider">Centro Bellezza · 2026</span>
      </div>

      <div class="relative h-72 md:h-80">
        <!-- Linee orizzontali grid -->
        <div class="absolute inset-0 flex flex-col justify-between">
          <?php for ($i = 0; $i < 5; $i++): ?>
            <div class="border-t border-line2 relative">
              <span class="absolute -left-1 -top-2 text-[10px] text-soft font-mono"><?= 80 - $i*20 ?></span>
            </div>
          <?php endfor; ?>
        </div>

        <!-- SVG curva -->
        <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 320">
          <!-- Area sotto la curva -->
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0F8E5C" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#0F8E5C" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Path area: piatta bassa, poi sale ripida -->
          <path d="M 0 290 L 100 285 L 200 280 L 300 275 L 350 270 L 400 240 L 450 200 L 520 160 L 600 120 L 680 90 L 760 65 L 840 50 L 920 40 L 1000 35 L 1000 320 L 0 320 Z" fill="url(#grad)"/>
          <!-- Linea della curva -->
          <path d="M 0 290 L 100 285 L 200 280 L 300 275 L 350 270 L 400 240 L 450 200 L 520 160 L 600 120 L 680 90 L 760 65 L 840 50 L 920 40 L 1000 35"
                fill="none" stroke="#0F8E5C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Punto inizio "Inizia ReviewBoost" -->
          <circle cx="350" cy="270" r="6" fill="#fff" stroke="#0F8E5C" stroke-width="3"/>
          <circle cx="350" cy="270" r="14" fill="#0F8E5C" fill-opacity="0.15"/>
          <line x1="350" y1="270" x2="350" y2="200" stroke="#0F8E5C" stroke-width="1.5" stroke-dasharray="4 4"/>

          <!-- Punto finale -->
          <circle cx="1000" cy="35" r="8" fill="#0F8E5C"/>
          <circle cx="1000" cy="35" r="16" fill="#0F8E5C" fill-opacity="0.2"/>
        </svg>

        <!-- Badge "Inizia ReviewBoost" -->
        <div class="absolute" style="left: 33%; top: 38%;">
          <div class="bg-ink text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lift whitespace-nowrap">
            <span class="text-cream">▼</span> Inizia ReviewBoost
          </div>
        </div>

        <!-- Etichetta inizio "5 / mese" -->
        <div class="absolute left-2 bottom-1">
          <div class="text-xs">
            <div class="font-semibold text-muted">~5 / mese</div>
            <div class="text-[10px] text-soft">Prima</div>
          </div>
        </div>

        <!-- Etichetta finale "70 / mese" -->
        <div class="absolute right-0 -top-2">
          <div class="text-right">
            <div class="font-display text-3xl text-primary-600 font-semibold">70 / mese</div>
            <div class="text-xs text-primary-700 font-semibold">▲ +1300% in 90 giorni</div>
          </div>
        </div>
      </div>

      <!-- Asse X label -->
      <div class="flex justify-between mt-3 text-[11px] text-muted font-mono">
        <span>Gen</span><span>Feb</span><span>Mar</span><span class="text-primary-600 font-semibold">Apr · ↑ start</span><span>Mag</span><span>Giu</span><span>Lug</span><span>Ago</span>
      </div>
    </div>
  </div>
</section>

<!-- ─────────────────  SOCIAL PROOF / LOGOS  ───────────────── -->
<section class="border-b border-line bg-bone">
  <div class="max-w-6xl mx-auto px-6 py-10">
    <p class="text-center text-sm text-muted font-medium mb-6">Scelto da centri estetici, parrucchieri, ristoranti e studi medici in tutta Italia</p>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-items-center opacity-70">
      <?php
      $logos = ['BELLEZZA', 'CAPELLI&CO', 'TRATTORIA·DA·MARIA', 'STUDIO·BIANCHI', 'GLAM&GO', 'NAILS·HOUSE'];
      foreach ($logos as $l): ?>
        <span class="font-display font-semibold text-muted tracking-tight text-sm md:text-base whitespace-nowrap"><?= $l ?></span>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- ─────────────────  COME FUNZIONA  ───────────────── -->
<section id="come-funziona" class="bg-bone py-24 md:py-32 border-b border-line">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-2xl mx-auto mb-16">
      <span class="chip mb-5"><span class="dot"></span> Come funziona</span>
      <h2 class="h-display text-4xl md:text-5xl">Tre passaggi. <span class="hl-mint">Trenta secondi</span> al giorno.</h2>
      <p class="mt-5 text-lg text-body">Pensata per la receptionist, non per il programmatore. Si apre, si clicca, si chiude.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      <article class="card p-8 relative">
        <div class="absolute top-7 right-7 font-display text-6xl text-primary-100 leading-none">01</div>
        <div class="w-12 h-12 rounded-2xl bg-mint grid place-items-center text-primary-600 mb-6">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        </div>
        <h3 class="font-display text-xl font-semibold mb-3">Carichi la lista</h3>
        <p class="text-body text-sm leading-relaxed">Incolli i clienti del giorno o trascini un file Excel. Bastano nome e numero. Trenta secondi.</p>
      </article>

      <article class="card p-8 relative">
        <div class="absolute top-7 right-7 font-display text-6xl text-primary-100 leading-none">02</div>
        <div class="w-12 h-12 rounded-2xl bg-mint grid place-items-center text-primary-600 mb-6">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4 7.94 7.94 0 0 0 4.1 12a7.9 7.9 0 0 0 1.05 3.95L4 20l4.18-1.1a7.93 7.93 0 0 0 3.87 1h.01a7.94 7.94 0 0 0 7.95-7.95 7.9 7.9 0 0 0-2.41-5.63z"/></svg>
        </div>
        <h3 class="font-display text-xl font-semibold mb-3">Lei clicca</h3>
        <p class="text-body text-sm leading-relaxed">Bottone WhatsApp accanto a ogni nome. Si apre la chat con il messaggio già scritto. Lei lo invia.</p>
      </article>

      <article class="card p-8 relative">
        <div class="absolute top-7 right-7 font-display text-6xl text-primary-100 leading-none">03</div>
        <div class="w-12 h-12 rounded-2xl bg-mint grid place-items-center text-primary-600 mb-6">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .8l3 7.5 8.2.6-6.3 5.3 2 8L12 17.7 5.1 22.2l2-8L.8 8.9l8.2-.6z"/></svg>
        </div>
        <h3 class="font-display text-xl font-semibold mb-3">Recensioni a 5 stelle</h3>
        <p class="text-body text-sm leading-relaxed">I clienti soddisfatti vanno su Google. Quelli scontenti scrivono solo a te, in privato.</p>
      </article>
    </div>
  </div>
</section>

<!-- ─────────────────  FEATURES  ───────────────── -->
<section class="max-w-6xl mx-auto px-6 py-24 md:py-32">
  <div class="max-w-2xl mb-14">
    <span class="chip mb-5"><span class="dot"></span> Cosa c'è dentro</span>
    <h2 class="h-display text-4xl md:text-5xl">Tutto quello che ti serve. <span class="hl-mint">Niente di più.</span></h2>
  </div>

  <div class="grid md:grid-cols-2 gap-5">
    <?php
    $feats = [
      ['Recupero feedback negativi', 'Le valutazioni sotto 5 stelle non vanno su Google. Arrivano in privato a te, con tutto il dettaglio. Hai 24 ore per recuperare il cliente.', 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z'],
      ['Sondaggio brandizzato',     'Ogni centro ha il suo URL pubblico (/r/nome) con i tuoi colori, il tuo logo e il tuo regalo. I clienti vedono te, non noi.', 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'],
      ['Receptionist friendly',    'Funziona da telefono, tablet, computer. Niente da imparare: una vista, un bottone, fatto. La tua receptionist sarà operativa in 5 minuti.', 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'],
      ['Statistiche & andamento',   'Vedi quante recensioni hai generato, il punteggio Google nel tempo, quanti clienti hanno cliccato il sondaggio. In un grafico chiaro.',  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'],
      ['Multi-tenant rigoroso',    'Ogni centro vede solo i propri clienti, le proprie recensioni, le proprie statistiche. Zero rischio di mescolare i dati con un altro centro.',  'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'],
      ['Configurazione in 24h',    'Una telefonata, ti spieghiamo come funziona, configuriamo il tuo sondaggio, sei online entro la giornata. Niente di tecnico da imparare.',   'M13 10V3L4 14h7v7l9-11h-7z'],
    ];
    foreach ($feats as $f): ?>
      <div class="card p-7 hover:shadow-soft transition group">
        <div class="flex items-start gap-4">
          <div class="w-11 h-11 rounded-xl bg-mint grid place-items-center text-primary-600 flex-shrink-0 group-hover:bg-primary-500 group-hover:text-white transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="<?= $f[2] ?>"/></svg>
          </div>
          <div>
            <h3 class="font-display text-lg font-semibold mb-1.5"><?= $f[0] ?></h3>
            <p class="text-sm text-body leading-relaxed"><?= $f[1] ?></p>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</section>

<!-- ─────────────────  MOCKUP IPHONE — SONDAGGIO  ───────────────── -->
<section class="relative py-24 md:py-32 overflow-hidden">
  <div class="absolute inset-0 -z-10 bg-gradient-to-br from-cream/40 via-white to-mint/40"></div>
  <div class="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
    <!-- Copy a sx -->
    <div>
      <span class="chip mb-5"><span class="dot"></span> Lato cliente</span>
      <h2 class="h-display text-4xl md:text-5xl mb-6">Quello che <span class="hl-mint">ricevono i tuoi clienti</span>.</h2>
      <p class="text-lg text-body leading-relaxed mb-6">Una pagina semplicissima, brandizzata col tuo logo. Cinque stelline. Niente registrazione, niente app, niente fatica. Si apre direttamente da WhatsApp.</p>
      <ul class="space-y-3 mb-8">
        <li class="flex items-start gap-3">
          <span class="grid place-items-center w-6 h-6 rounded-full bg-mint text-primary-600 mt-0.5 flex-shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </span>
          <span class="text-body"><strong class="text-ink">5 stelle</strong> → bottone "Lascia recensione su Google" + il tuo regalo</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="grid place-items-center w-6 h-6 rounded-full bg-mint text-primary-600 mt-0.5 flex-shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </span>
          <span class="text-body"><strong class="text-ink">4 stelle</strong> → commento opzionale che vedi solo tu</span>
        </li>
        <li class="flex items-start gap-3">
          <span class="grid place-items-center w-6 h-6 rounded-full bg-mint text-primary-600 mt-0.5 flex-shrink-0">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
          </span>
          <span class="text-body"><strong class="text-ink">1–3 stelle</strong> → modulo di feedback privato + alert email a te</span>
        </li>
      </ul>
      <p class="text-sm text-muted">Tempo medio per il cliente: <strong class="text-ink">10 secondi</strong>. Tasso di completamento: <strong class="text-primary-600">73%</strong>.</p>
    </div>

    <!-- Mockup iPhone -->
    <div class="flex justify-center relative">
      <!-- decorative pin sparsi -->
      <span class="stars twinkle absolute text-lg" style="top:5%; left:8%;">★</span>
      <span class="stars twinkle absolute text-2xl" style="top:25%; right:5%;">★</span>
      <span class="stars twinkle absolute text-base" style="bottom:20%; left:0;">★</span>

      <div class="relative">
        <!-- iPhone frame -->
        <div class="w-[300px] md:w-[340px] aspect-[9/19] bg-ink rounded-[3rem] p-3 shadow-lift relative">
          <!-- Notch -->
          <div class="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-ink rounded-b-2xl z-10"></div>
          <div class="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-3 bg-black rounded-full z-20"></div>
          <!-- Screen -->
          <div class="w-full h-full bg-white rounded-[2.4rem] overflow-hidden flex flex-col">
            <div class="bg-mint border-b border-primary-100 pt-10 pb-5 px-5 text-center">
              <div class="grid place-items-center w-12 h-12 rounded-2xl bg-primary-500 text-white mx-auto mb-2 shadow-soft">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M12 .8l3 7.5 8.2.6-6.3 5.3 2 8L12 17.7 5.1 22.2l2-8L.8 8.9l8.2-.6z"/></svg>
              </div>
              <div class="text-[10px] uppercase tracking-widest text-primary-700 font-semibold">Centro Estetico</div>
              <div class="font-display font-semibold text-lg leading-tight">Bellezza Milano</div>
            </div>
            <div class="flex-1 px-5 py-6 flex flex-col items-center justify-center">
              <h3 class="font-display text-xl font-semibold text-center mb-1">Come è andata oggi?</h3>
              <p class="text-xs text-muted text-center mb-6">Ciao Anna! Ci dai un feedback in 10 secondi?</p>

              <div class="flex gap-1.5 mb-7">
                <span class="text-3xl text-yellow-400 twinkle">★</span>
                <span class="text-3xl text-yellow-400 twinkle">★</span>
                <span class="text-3xl text-yellow-400 twinkle">★</span>
                <span class="text-3xl text-yellow-400 twinkle">★</span>
                <span class="text-3xl text-yellow-400 twinkle">★</span>
              </div>

              <div class="bg-mint border border-primary-100 rounded-2xl p-4 w-full text-center mb-3">
                <p class="text-xs text-primary-700 font-semibold mb-2">🎁 Per te oggi</p>
                <p class="text-sm font-display font-semibold">10% di sconto sul prossimo trattamento</p>
              </div>

              <button class="w-full bg-primary-500 hover:bg-primary-700 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-soft">
                <svg viewBox="0 0 48 48" class="w-4 h-4"><path fill="#fff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#fff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#fff" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#fff" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Lascia recensione su Google
              </button>
              <p class="text-[10px] text-muted mt-3 text-center">Si apre direttamente la tua scheda Google</p>
            </div>
          </div>
        </div>

        <!-- Card che esce dal phone (recensione che parte) -->
        <div class="hidden md:block absolute -right-12 top-1/3 bg-white border border-line rounded-2xl p-3 shadow-lift transform rotate-3 w-52">
          <div class="flex items-center gap-2 mb-1">
            <div class="w-7 h-7 rounded-full bg-mint text-primary-700 grid place-items-center text-[10px] font-bold">AR</div>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] font-semibold truncate">Anna R.</div>
              <div class="stars text-[10px]">★★★★★</div>
            </div>
          </div>
          <p class="text-[11px] text-body leading-snug">"Servizio top, le ragazze sono bravissime. Tornerò!"</p>
          <div class="text-[9px] text-primary-600 font-semibold mt-1.5 flex items-center gap-1">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .8l3 7.5 8.2.6-6.3 5.3 2 8L12 17.7 5.1 22.2l2-8L.8 8.9l8.2-.6z"/></svg>
            su Google · 1 min fa
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ─────────────────  TESTIMONIALS  ───────────────── -->
<section class="bg-bone py-24 md:py-32 border-y border-line">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center max-w-2xl mx-auto mb-14">
      <span class="chip mb-5"><span class="dot"></span> Storie vere</span>
      <h2 class="h-display text-4xl md:text-5xl">Dicono di noi.</h2>
    </div>

    <div class="grid md:grid-cols-3 gap-5">
      <?php
      $testimonials = [
        ['Da 2 recensioni alla settimana siamo passati a 8. In 3 mesi il punteggio è salito da 4.3 a 4.7. Cose che si sentono al telefono — la gente ci trova prima.', 'Laura M.', 'Centro Estetico Bellezza, Milano', 'LM', 'mint'],
        ['La cosa che mi piace di più è che le lamentele non finiscono più su Google. Mi arrivano in mail e le sistemo prima. Ne sto recuperando 1 su 3.', 'Marco C.', 'Trattoria da Marco, Bologna', 'MC', 'cream'],
        ['Le ragazze in reception ci hanno messo cinque minuti a capire come funziona. Ora è abitudine, come fare il caffè la mattina. Zero stress.', 'Giulia R.', 'Capelli & Co, Firenze', 'GR', 'sage'],
      ];
      foreach ($testimonials as $t): ?>
        <article class="card p-7 flex flex-col">
          <div class="stars text-base mb-4">★★★★★</div>
          <p class="text-body leading-relaxed flex-1 text-[15px]">"<?= $t[0] ?>"</p>
          <div class="mt-6 pt-5 border-t border-line2 flex items-center gap-3">
            <div class="grid place-items-center w-10 h-10 rounded-full bg-<?= $t[4] ?> text-primary-700 font-display font-semibold text-sm"><?= $t[3] ?></div>
            <div>
              <div class="font-semibold text-sm text-ink"><?= $t[1] ?></div>
              <div class="text-xs text-muted"><?= $t[2] ?></div>
            </div>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- ─────────────────  PRICING  ───────────────── -->
<section id="prezzi" class="max-w-6xl mx-auto px-6 py-24 md:py-32">
  <div class="text-center max-w-2xl mx-auto mb-14">
    <span class="chip mb-5"><span class="dot"></span> Prezzo</span>
    <h2 class="h-display text-4xl md:text-5xl">Un piano. <span class="hl-cream">Tutto incluso.</span></h2>
    <p class="mt-5 text-lg text-body">Niente trabocchetti, niente costi nascosti, niente tier "Enterprise" assurdi.</p>
  </div>

  <div class="max-w-2xl mx-auto">
    <div class="card p-10 md:p-12 shadow-lift relative overflow-hidden">
      <div class="absolute -top-12 -right-12 w-56 h-56 bg-primary-500/10 rounded-full blur-3xl"></div>

      <div class="relative">
        <div class="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <span class="chip mb-3"><span class="dot"></span> ReviewBoost Pro</span>
            <h3 class="h-display text-3xl">Tutto, sempre, per tutti i tuoi clienti.</h3>
          </div>
          <div class="text-right">
            <div class="flex items-baseline gap-1 justify-end">
              <span class="h-display text-6xl">50</span>
              <span class="font-display text-3xl">€</span>
            </div>
            <div class="text-sm text-muted">/ mese · IVA inclusa</div>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-8">
          <?php
          $included = [
            'Clienti illimitati',
            'Sondaggio personalizzato',
            'Recupero feedback negativi',
            'Statistiche e grafici',
            'Multi-utente (titolare + receptionist)',
            'Supporto WhatsApp dedicato',
            'Aggiornamenti automatici',
            'Backup giornalieri',
          ];
          foreach ($included as $i): ?>
            <div class="flex items-center gap-2.5 text-sm">
              <svg class="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              <span class="text-body"><?= $i ?></span>
            </div>
          <?php endforeach; ?>
        </div>

        <div class="bg-mint rounded-2xl p-5 border border-primary-100 mb-7 flex items-center gap-4">
          <div class="grid place-items-center w-10 h-10 rounded-full bg-primary-500 text-white flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.32.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
          </div>
          <div>
            <div class="font-semibold text-ink">14 giorni gratis</div>
            <div class="text-sm text-body">Carta di credito richiesta solo all'attivazione. Niente addebiti per i primi 14 giorni. Disdici quando vuoi.</div>
          </div>
        </div>

        <a href="tel:+390000000000" class="btn-primary w-full justify-center text-base py-4">
          Chiamaci e parti oggi
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"/></svg>
        </a>
      </div>
    </div>
  </div>
</section>

<!-- ─────────────────  FAQ  ───────────────── -->
<section id="faq" class="bg-bone py-24 md:py-32 border-y border-line">
  <div class="max-w-3xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="chip mb-5"><span class="dot"></span> Domande frequenti</span>
      <h2 class="h-display text-4xl md:text-5xl">Le risposte che cercavi.</h2>
    </div>

    <div>
      <details class="faq" open>
        <summary>Devo installare qualcosa?</summary>
        <p>No, niente. Apri il sito, fai login, sei dentro. Funziona da computer, tablet o telefono. La receptionist usa quello che ha sotto mano.</p>
      </details>
      <details class="faq">
        <summary>Quanto ci mette ad essere operativo?</summary>
        <p>Una telefonata di 15 minuti per spiegarti come funziona, poi configuriamo insieme il tuo sondaggio. Sei online entro la giornata.</p>
      </details>
      <details class="faq">
        <summary>I miei clienti devono installare app?</summary>
        <p>Assolutamente no. Ricevono un WhatsApp normale con un link. Cliccano, vedono una pagina web semplice con 5 stelline, scelgono. Fine.</p>
      </details>
      <details class="faq">
        <summary>Cosa succede se un cliente è scontento?</summary>
        <p>Se mette meno di 5 stelle, il sistema NON lo manda su Google. Gli chiede invece di scrivere cosa non è andato — quel feedback arriva direttamente a te in mail. Hai 24 ore per chiamarlo e recuperarlo prima che ne parli con qualcun altro.</p>
      </details>
      <details class="faq">
        <summary>Posso disdire quando voglio?</summary>
        <p>Sì, in qualsiasi momento, dalla tua area. Niente penali, niente vincoli. Se disdici durante i 14 giorni di prova non ti viene addebitato nulla.</p>
      </details>
      <details class="faq">
        <summary>I dati dei miei clienti sono al sicuro?</summary>
        <p>Sì. Ogni centro vede solo i propri dati, server in Italia, backup giornalieri, tutto in linea col GDPR. I numeri di telefono non vengono mai venduti né condivisi.</p>
      </details>
    </div>
  </div>
</section>

<!-- ─────────────────  CTA FINALE  ───────────────── -->
<section class="max-w-6xl mx-auto px-6 py-24 md:py-32">
  <div class="card-soft p-10 md:p-16 text-center relative overflow-hidden">
    <div class="absolute -top-24 -right-24 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-24 -left-24 w-72 h-72 bg-cream rounded-full blur-3xl"></div>

    <div class="relative">
      <span class="chip mb-6"><span class="dot"></span> Pronti in 24h</span>
      <h2 class="h-display text-4xl md:text-6xl max-w-3xl mx-auto">
        Una telefonata. <span class="hl-mint">Sei online stasera.</span>
      </h2>
      <p class="mt-6 text-lg text-body max-w-xl mx-auto">14 giorni gratuiti, senza vincoli. Ti spieghiamo come funziona, configuriamo tutto, ti accompagniamo.</p>

      <div class="mt-9 inline-flex flex-col items-center">
        <a href="tel:+390000000000" class="font-display text-4xl md:text-5xl text-primary-600 hover:text-primary-700 font-medium tracking-tightest">
          +39 XXX XXX XXXX
        </a>
        <span class="text-sm text-muted mt-1">Lun–Ven 9:00 — 19:00 · Risposta entro 1h</span>
      </div>
    </div>
  </div>
</section>

<?php layout_foot();
