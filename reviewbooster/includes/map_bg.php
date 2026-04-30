<?php
/**
 * Background SVG mappa stilizzata stile Google Maps.
 * Densa: griglia di strade + blocchi edifici + highway + fiume + parchi + pin con label.
 */
function render_map_bg(): void {
?>
<svg class="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 2000 1500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- Background tile color (Google Maps light) -->
  <rect width="2000" height="1500" fill="#F1ECE2"/>

  <!-- Aree verdi (parchi) -->
  <g fill="#C8DDC1">
    <path d="M 80 130 q 20 -40 80 -30 l 200 0 q 60 -10 80 30 l 0 180 q -10 40 -60 40 l -240 0 q -50 -5 -60 -40 z"/>
    <ellipse cx="1280" cy="270" rx="180" ry="120"/>
    <path d="M 540 870 l 280 -10 q 40 5 50 50 l -10 130 q -10 40 -60 40 l -260 -10 q -40 -5 -50 -40 z"/>
    <rect x="1080" y="1180" width="320" height="200" rx="14"/>
  </g>

  <!-- Fiume / lago -->
  <path d="M 1700 -50 Q 1820 280 1620 540 Q 1380 820 1700 1080 Q 1920 1280 1900 1600"
        stroke="#A8D2EC" stroke-width="110" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 1700 -50 Q 1820 280 1620 540 Q 1380 820 1700 1080 Q 1920 1280 1900 1600"
        stroke="#7DB8DB" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Griglia strade locali (sottili) -->
  <g stroke="#FFFFFF" stroke-width="3" opacity="0.85">
    <?php for ($i = 1; $i < 38; $i++): if ($i % 4 === 0) continue; ?>
      <line x1="0" y1="<?= $i*40 ?>" x2="2000" y2="<?= $i*40 ?>"/>
    <?php endfor; ?>
    <?php for ($i = 1; $i < 50; $i++): if ($i % 4 === 0) continue; ?>
      <line x1="<?= $i*40 ?>" y1="0" x2="<?= $i*40 ?>" y2="1500"/>
    <?php endfor; ?>
  </g>

  <!-- Blocchi/edifici grigi (riempimento tra le strade) -->
  <g fill="#E5E0D5">
    <?php
    // pseudo-random ma deterministico
    $seed = 17;
    for ($x = 0; $x < 50; $x++) {
      for ($y = 0; $y < 38; $y++) {
        $seed = ($seed * 1103515245 + 12345) & 0x7fffffff;
        $r = $seed % 100;
        if ($r < 38) {
          $px = $x * 40 + 3;
          $py = $y * 40 + 3;
          $w = 34;
          $h = 34;
          // skip se cade dentro fiume/parco
          if ($px > 1450 && $px < 1850 && $py > 0 && $py < 1500 && (($py + 60) % 400 < 220)) continue;
          if ($px < 380 && $py < 320) continue;
          if ($px > 1080 && $px < 1420 && $py > 1180 && $py < 1380) continue;
          echo "<rect x=\"$px\" y=\"$py\" width=\"$w\" height=\"$h\" rx=\"2\"/>";
        }
      }
    }
    ?>
  </g>

  <!-- Strade secondarie (medie) -->
  <g stroke="#FFFFFF" stroke-width="8">
    <line x1="0" y1="160" x2="2000" y2="160"/>
    <line x1="0" y1="480" x2="2000" y2="480"/>
    <line x1="0" y1="960" x2="2000" y2="960"/>
    <line x1="0" y1="1280" x2="2000" y2="1280"/>
    <line x1="240" y1="0" x2="240" y2="1500"/>
    <line x1="800" y1="0" x2="800" y2="1500"/>
    <line x1="1360" y1="0" x2="1360" y2="1500"/>
  </g>

  <!-- Strade principali (larghe, bianche con bordo chiaro) -->
  <g>
    <line x1="0" y1="320" x2="2000" y2="320" stroke="#FFFFFF" stroke-width="18"/>
    <line x1="0" y1="320" x2="2000" y2="320" stroke="#E5DAB5" stroke-width="2"/>
    <line x1="0" y1="800" x2="2000" y2="800" stroke="#FFFFFF" stroke-width="18"/>
    <line x1="0" y1="800" x2="2000" y2="800" stroke="#E5DAB5" stroke-width="2"/>
    <line x1="0" y1="1120" x2="2000" y2="1120" stroke="#FFFFFF" stroke-width="14"/>
    <line x1="500" y1="0" x2="500" y2="1500" stroke="#FFFFFF" stroke-width="18"/>
    <line x1="500" y1="0" x2="500" y2="1500" stroke="#E5DAB5" stroke-width="2"/>
    <line x1="1100" y1="0" x2="1100" y2="1500" stroke="#FFFFFF" stroke-width="14"/>
  </g>

  <!-- Highway (gialla) diagonale -->
  <g>
    <path d="M -120 1050 Q 600 950 1100 990 T 2100 920" stroke="#FFFFFF" stroke-width="26" fill="none" stroke-linecap="round"/>
    <path d="M -120 1050 Q 600 950 1100 990 T 2100 920" stroke="#FCD24A" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M -120 1050 Q 600 950 1100 990 T 2100 920" stroke="#fff" stroke-width="2" stroke-dasharray="14 12" fill="none"/>
  </g>

  <!-- Etichette strade -->
  <g font-family="Plus Jakarta Sans, sans-serif" font-size="11" fill="#9AA09D" font-weight="500">
    <text x="60"  y="316">Via Manzoni</text>
    <text x="60"  y="796">Corso Buenos Aires</text>
    <text x="900" y="316">Via Dante</text>
    <text x="510" y="60" transform="rotate(90 510 60)">Via Garibaldi</text>
    <text x="1110" y="60" transform="rotate(90 1110 60)">Via Po</text>
  </g>

  <!-- Pin con label di centri -->
  <?php
  $pins = [
    [340, 240, 'Centro Bellezza'],
    [820, 540, 'Capelli & Co'],
    [1320, 350, 'Trattoria Da Maria'],
    [420, 1080, 'Studio Bianchi'],
    [1180, 1040, 'Glam Beauty'],
    [680, 1240, 'Nails House'],
  ];
  foreach ($pins as [$x, $y, $name]):
      $w = max(78, strlen($name) * 7 + 20);
  ?>
    <g transform="translate(<?= $x ?>,<?= $y ?>)">
      <!-- pin -->
      <path d="M 0 0 C -13 -15 -13 -36 0 -42 C 13 -36 13 -15 0 0 Z" fill="#0F8E5C"/>
      <circle cx="0" cy="-32" r="5" fill="#fff"/>
      <!-- label -->
      <rect x="14" y="-40" rx="6" width="<?= $w ?>" height="22" fill="#fff" stroke="#E6E8E5"/>
      <text x="22" y="-25" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="600" fill="#0F8E5C"><?= htmlspecialchars($name) ?></text>
    </g>
  <?php endforeach; ?>
</svg>
<?php }
