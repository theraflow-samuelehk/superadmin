<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
?><!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ReviewShield</title>
    <meta name="description" content="Rimuoviamo le recensioni negative da Google. Prima analisi gratuita, paghi solo a risultato ottenuto">
    <meta name="author" content="ReviewShield" />
    <link rel="canonical" href="https://reviewshield.it" />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://reviewshield.it" />
    <meta property="og:image" content="/og-image.jpg">
    <meta property="og:title" content="ReviewShield">
    <meta property="og:description" content="Rimuoviamo le recensioni negative da Google. Prima analisi gratuita, paghi solo a risultato ottenuto">
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="/og-image.jpg">
    <meta name="twitter:title" content="ReviewShield">
    <meta name="twitter:description" content="Rimuoviamo le recensioni negative da Google. Prima analisi gratuita, paghi solo a risultato ottenuto">

    <!-- Favicon ReviewShield (scudo verde con spunta) -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/icon-192.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#059669">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <!-- TODO: Google Analytics (GA4) — sostituire G-XXXXXXXXXX col tuo ID -->
    <!-- TODO: Meta Pixel — sostituire YOUR_PIXEL_ID col tuo Pixel ID -->

    <!-- CSS pre-React: nascondi bubble WhatsApp PRIMA che il bundle lo renderizzi -->
    <style>
      /* Nascondi link diretti wa.me/whatsapp (sono sempre solo link specifici) */
      a[href*="wa.me"], a[href*="whatsapp"], a[href*="api.whatsapp"] { display: none !important; }
      /* Nascondi solo anchor/button che contengono SVG WhatsApp - NO div (per non rompere layout) */
      a:has(svg path[d^="M17.472"]),
      button:has(svg path[d^="M17.472"]) {
        display: none !important;
      }
      /* Class/id specifici bubble */
      [class*="whatsapp" i], [id*="whatsapp" i],
      [class*="wa-bubble" i],
      [class*="whats-bubble" i], [aria-label*="whatsapp" i] {
        display: none !important;
      }
    </style>

    <script type="module" crossorigin src="/assets/index-DW4n5zfc.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-BNl2Bqut.css">
  </head>

  <body>
    <div id="root"></div>

    <!-- Success banner per lead inviato -->
    <div id="rs-lead-banner" style="display:none;position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;background:#059669;color:#fff;padding:14px 24px;border-radius:12px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;box-shadow:0 10px 40px rgba(0,0,0,.3)"></div>

    <script>
    (function(){
      // Text replacements per rimuovere ogni riferimento residuo a WhatsApp
      var TEXT_REPL = [
        [/Scrivici su WhatsApp/g, 'Richiedi Analisi Gratuita'],
        [/Invia su WhatsApp/g, 'Invia richiesta'],
        [/Apri WhatsApp/g, 'Richiedi analisi'],
        [/Compila e ti si apre WhatsApp con il messaggio pronto/g, 'Lascia i tuoi dati: ti ricontattiamo entro 24 ore'],
        [/ti si apre WhatsApp con il messaggio pronto/g, 'ti ricontattiamo entro 24 ore'],
        [/Risposta entro 2 ore/g, 'Ti ricontattiamo entro 24 ore'],
        [/risposta entro 2 ore/g, 'ti ricontattiamo entro 24 ore'],
        [/Rispondiamo in 2 min/g, 'Ti ricontattiamo entro 24 ore'],
        [/Scrivici ora/g, 'Richiedi analisi'],
        [/Scrivici/g, 'Richiedi analisi'],
        [/via WhatsApp/g, ''],
        [/su WhatsApp/g, ''],
        [/tramite WhatsApp/g, ''],
        [/in WhatsApp/g, ''],
        [/\bWhatsApp\b/g, 'Analisi Gratuita'],
      ];

      function patchText(root){
        if(!root) return;
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: function(n){
            if (!n.textContent || !n.textContent.trim()) return NodeFilter.FILTER_REJECT;
            var tag = n.parentElement && n.parentElement.tagName;
            if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        var n, toChange=[];
        while (n = w.nextNode()) {
          var orig = n.textContent, ch = orig;
          for (var i=0;i<TEXT_REPL.length;i++) ch = ch.replace(TEXT_REPL[i][0], TEXT_REPL[i][1]);
          if (ch !== orig) toChange.push([n, ch]);
        }
        toChange.forEach(function(p){ p[0].textContent = p[1]; });
      }

      function hideBubbleJS(){
        // Backup del CSS :has() per browser che non lo supportano o per elementi che sfuggono
        document.querySelectorAll('svg path').forEach(function(path){
          var d = path.getAttribute('d') || '';
          if (d.indexOf('M17.472') === 0 || d.indexOf('17.472 14.382') > -1) {
            var el = path;
            for (var i=0; i<10 && el && el !== document.body; i++) {
              if (el.tagName === 'A' || el.tagName === 'BUTTON') { el.style.display = 'none'; return; }
              try {
                var cs = getComputedStyle(el);
                if (cs.position === 'fixed' || cs.position === 'sticky') { el.style.display = 'none'; return; }
              } catch(e){}
              el = el.parentElement;
            }
            var svg = path.closest && path.closest('svg');
            if (svg && svg.parentElement) svg.parentElement.style.display = 'none';
          }
        });
        // Qualsiasi elemento fixed/sticky in basso-destra con innerHTML "WhatsApp"
        document.querySelectorAll('a,button,div,aside').forEach(function(el){
          try {
            var cs = getComputedStyle(el);
            if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
            var b = parseInt(cs.bottom); var r = parseInt(cs.right);
            if (isNaN(b) || isNaN(r) || b > 200 || r > 200) return;
            var inner = (el.innerHTML || '').toLowerCase();
            if (/whatsapp|wa\.me|17\.472|rispondiamo in|risposta in/i.test(inner)) {
              el.style.display = 'none';
            }
          } catch(e){}
        });
      }

      // === SOSTITUISCI IL FORM REACT CON UN FORM CUSTOM ===
      // Strategia: nascondo il form React con display:none e inserisco un form
      // nostro (completamente fuori dal controllo di React) nello stesso slot.
      // Questo evita qualsiasi lotta con la CSS grid interna del form React.
      var RS_FORM_ID = 'rs-custom-form';

      function findReactHeroForm(){
        var forms = document.querySelectorAll('form');
        for (var i=0; i<forms.length; i++) {
          var f = forms[i];
          if (f.id === RS_FORM_ID) continue;
          var inputs = f.querySelectorAll('input');
          if (inputs.length === 0) continue;
          // Cerca un input con "nome" nel placeholder/name/aria-label
          for (var j=0; j<inputs.length; j++) {
            var ph = ((inputs[j].placeholder||'')+' '+(inputs[j].name||'')+' '+(inputs[j].getAttribute('aria-label')||'')).toLowerCase();
            if (/nome|mario/i.test(ph)) return f;
          }
        }
        return null;
      }

      function buildCustomForm(){
        var f = document.createElement('form');
        f.id = RS_FORM_ID;
        f.setAttribute('novalidate','');
        // Card bianca self-contained: non dipende da nessun wrapper esterno
        f.style.cssText = [
          'background:#ffffff',
          'padding:28px 24px',
          'border-radius:20px',
          'box-shadow:0 20px 60px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.06)',
          'border:1px solid rgba(5,150,105,.12)',
          'display:flex',
          'flex-direction:column',
          'gap:14px',
          'width:100%',
          'max-width:460px',
          'margin:0 auto',
          'box-sizing:border-box',
          'font-family:inherit',
          'color:#111827'
        ].join(';');

        var inputCss = 'width:100%;padding:13px 14px;border:1px solid #e5e7eb;border-radius:10px;font-size:15px;box-sizing:border-box;font-family:inherit;outline:none;background:#ffffff;color:#111827;transition:border-color .15s,box-shadow .15s;-webkit-appearance:none';
        var labelCss = 'display:block;font-weight:600;font-size:13.5px;margin-bottom:6px;color:#111827;letter-spacing:-.01em';

        f.innerHTML = [
          // Header
          '<div style="text-align:center;margin-bottom:4px">',
            '<h3 style="margin:0 0 6px;font-size:21px;font-weight:700;color:#111827;letter-spacing:-.02em">Richiedi Analisi Gratuita</h3>',
            '<p style="margin:0;font-size:13.5px;color:#6b7280;line-height:1.4">Lascia i tuoi dati: ti ricontattiamo entro 24 ore</p>',
          '</div>',
          // Nome
          '<div>',
            '<label for="rs-nome" style="'+labelCss+'">Nome e cognome</label>',
            '<input id="rs-nome" type="text" placeholder="Mario Rossi" autocomplete="name" required style="'+inputCss+'">',
          '</div>',
          // Email
          '<div>',
            '<label for="rs-email" style="'+labelCss+'">Email</label>',
            '<input id="rs-email" type="email" placeholder="mario@studio.it" autocomplete="email" required style="'+inputCss+'">',
          '</div>',
          // Telefono
          '<div>',
            '<label for="rs-tel" style="'+labelCss+'">Numero di telefono</label>',
            '<input id="rs-tel" type="tel" placeholder="333 1234567" autocomplete="tel" required style="'+inputCss+'">',
          '</div>',
          // Nome attività con badge "Opzionale" inline a destra
          '<div>',
            '<label for="rs-attivita" style="display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:13.5px;margin-bottom:6px;color:#111827;letter-spacing:-.01em">',
              '<span>Nome attività</span>',
              '<span style="font-weight:500;color:#9ca3af;font-size:11.5px;background:#f3f4f6;padding:2px 8px;border-radius:999px;letter-spacing:.01em;text-transform:uppercase">Opzionale</span>',
            '</label>',
            '<input id="rs-attivita" type="text" placeholder="Es. Ristorante La Terrazza" autocomplete="organization" style="'+inputCss+'">',
          '</div>',
          // Submit
          '<button id="rs-submit" type="submit" style="margin-top:6px;width:100%;padding:15px 20px;background:linear-gradient(180deg,#10b981,#059669);color:#ffffff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform .1s,box-shadow .15s,filter .15s;box-shadow:0 6px 18px rgba(5,150,105,.35);letter-spacing:-.01em">',
            '<span>Invia richiesta</span>',
            '<span style="font-size:18px;line-height:1;transform:translateY(-1px)">→</span>',
          '</button>',
          // Trust row: 3 micro-punti
          '<div style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:4px;font-size:12px;color:#6b7280">',
            '<span style="display:inline-flex;align-items:center;gap:4px"><span style="color:#10b981;font-weight:700">✓</span>Risposta 24h</span>',
            '<span style="display:inline-flex;align-items:center;gap:4px"><span style="color:#10b981;font-weight:700">✓</span>Analisi gratuita</span>',
            '<span style="display:inline-flex;align-items:center;gap:4px"><span style="color:#10b981;font-weight:700">✓</span>Paghi a risultato</span>',
          '</div>',
          // Privacy
          '<p style="text-align:center;font-size:11.5px;color:#9ca3af;margin:2px 0 0;line-height:1.4">Inviando il form accetti la nostra <a href="/privacy" style="color:#059669;text-decoration:underline">Privacy Policy</a></p>'
        ].join('');

        // Focus ring verde sui campi
        f.querySelectorAll('input').forEach(function(inp){
          inp.addEventListener('focus', function(){ inp.style.borderColor='#059669'; inp.style.boxShadow='0 0 0 3px rgba(5,150,105,.15)'; });
          inp.addEventListener('blur', function(){ inp.style.borderColor='#d1d5db'; inp.style.boxShadow='none'; });
        });
        var btn = f.querySelector('#rs-submit');
        btn.addEventListener('mouseenter', function(){ btn.style.background='#047857'; });
        btn.addEventListener('mouseleave', function(){ btn.style.background='#059669'; });

        f.addEventListener('submit', function(e){
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(f);
        });
        return f;
      }

      function patchHeroForm(){
        // Se il form custom è già presente, non rifare nulla
        if (document.getElementById(RS_FORM_ID) && document.getElementById(RS_FORM_ID).isConnected) return;
        var reactForm = findReactHeroForm();
        if (!reactForm) return;
        // Nascondi il form React SENZA rimuoverlo (React continua a gestirlo)
        reactForm.style.display = 'none';
        // Inserisci il form custom subito prima
        var custom = buildCustomForm();
        reactForm.parentNode.insertBefore(custom, reactForm);
      }

      function showBanner(text, ok){
        var b = document.getElementById('rs-lead-banner');
        if (!b) return;
        b.textContent = text;
        b.style.background = ok ? '#059669' : '#dc2626';
        b.style.display = 'block';
        setTimeout(function(){ b.style.display = 'none'; }, 4500);
      }

      function handleSubmit(form){
        var nomeRaw = ((document.getElementById('rs-nome')||{}).value || '').trim();
        var email = ((document.getElementById('rs-email')||{}).value || '').trim();
        var tel = ((document.getElementById('rs-tel')||{}).value || '').trim();
        var attivita = ((document.getElementById('rs-attivita')||{}).value || '').trim();
        var parts = nomeRaw.split(/\s+/).filter(Boolean);
        var nome = parts[0] || '';
        var cognome = parts.slice(1).join(' ') || '';

        if (!nome || !cognome) { showBanner('Inserisci nome e cognome', false); return; }
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showBanner('Email non valida', false); return; }
        if (!tel) { showBanner('Inserisci telefono', false); return; }

        var btn = form.querySelector('#rs-submit');
        var origHTML = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = '<span>Invio in corso...</span>'; btn.style.opacity='.7'; }

        fetch('submit.php', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({nome:nome, cognome:cognome, email:email, telefono:tel, attivita:attivita})
        }).then(function(r){ return r.json(); }).then(function(d){
          if (btn) { btn.disabled = false; btn.innerHTML = origHTML; btn.style.opacity='1'; }
          if (d && d.ok) {
            showBanner('Grazie! Ti ricontattiamo entro 24 ore.', true);
            form.querySelectorAll('input').forEach(function(i){ i.value = ''; });
          } else {
            showBanner((d && d.error) || 'Errore invio', false);
          }
        }).catch(function(){
          if (btn) { btn.disabled = false; btn.innerHTML = origHTML; btn.style.opacity='1'; }
          showBanner('Errore di connessione', false);
        });
      }

      // CTA esterni al form hero -> scrolla al form custom
      document.addEventListener('click', function(e){
        var el = e.target.closest && e.target.closest('a,button,[role="button"]');
        if (!el) return;
        var href = (el.getAttribute && el.getAttribute('href')) || '';
        if (href && (href.indexOf('/privacy') === 0 || href.indexOf('/termini') === 0 || href.indexOf('/policy') === 0)) return;
        // Dentro il nostro form custom -> lascia al submit nativo
        if (el.closest && el.closest('#'+RS_FORM_ID)) return;
        var txt = ((el.textContent||'')+' '+(el.getAttribute('aria-label')||'')).toLowerCase();
        var isCta = /wa\.me|whatsapp|^tel:|^mailto:/i.test(href) ||
                    /^#(contatto|contatti|contact|hero)/i.test(href) ||
                    /analisi|richiedi|contatta|contatto|scrivi|prenota|parla con|inizia/i.test(txt);
        if (!isCta) return;
        e.preventDefault();
        e.stopPropagation();
        var form = document.getElementById(RS_FORM_ID) || findReactHeroForm();
        if (form) {
          form.scrollIntoView({behavior:'smooth', block:'center'});
          var firstInp = form.querySelector('input');
          if (firstInp) setTimeout(function(){ firstInp.focus(); }, 400);
        }
      }, true);

      function run(){
        try { patchText(document.body); } catch(e){}
        try { hideBubbleJS(); } catch(e){}
        try { patchHeroForm(); } catch(e){}
      }

      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
      else run();

      var mo = new MutationObserver(function(){ run(); });
      setTimeout(function(){
        if (document.body) mo.observe(document.body, {childList:true, subtree:true, characterData:true});
      }, 200);

      // Retry veloce per catturare widget con render ritardato
      var ticks = 0;
      var iv = setInterval(function(){
        run();
        if (++ticks > 30) clearInterval(iv);
      }, 500);
    })();
    </script>
  </body>
</html>
