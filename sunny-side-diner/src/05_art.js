// ---- 2D art: the mascot "Sunny", signs, posters, menu board (all canvas) ------
var FONT_OK = false;
function waitFonts(cb) {
  var done = false, fin = function () { if (done) return; done = true; FONT_OK = true; cb(); };
  try {
    if (document.fonts && document.fonts.load) {
      Promise.all(['40px Pacifico', '40px "Alfa Slab One"', '40px Caveat', '40px "Special Elite"', '40px Oswald', '40px DotGothic16', '40px "Shadows Into Light"', '40px "Reenie Beanie"', '20px "Zen Kaku Gothic New"', '20px "Klee One"']
        .map(function (f) { return document.fonts.load(f).catch(function () {}); })).then(fin, fin);
      setTimeout(fin, 3500);
    } else fin();
  } catch (e) { fin(); }
}
var F = {
  logo: 'Pacifico, "Brush Script MT", cursive', slab: '"Alfa Slab One", Georgia, serif', ui: 'Oswald, "Arial Narrow", sans-serif',
  hand: 'Caveat, "Comic Sans MS", cursive', fake: '"Reenie Beanie", "Comic Sans MS", cursive', ticket: '"Shadows Into Light", "Comic Sans MS", cursive',
  type: '"Special Elite", "Courier New", monospace', dot: 'DotGothic16, "Courier New", monospace', ja: '"Zen Kaku Gothic New", "Hiragino Sans", sans-serif', jahand: '"Klee One", "Hiragino Mincho ProN", serif'
};

// Sunny: a sunny-side-up egg with a big yolk face, tiny chef toque, stick arms with gloves, little sneakers.
// opt: mood happy|stare|grin|hollow, look [-1..1], wave (rad), line (coloring page), scribble, s (scale)
function eggPath(g, cx, cy, s, seed) {
  var rnd = makeRNG(seed || 5), n = 14, pts = [];
  for (var i = 0; i < n; i++) { var a = i / n * TAU, rr = s * (0.95 + rnd() * 0.18) * (1 + 0.12 * Math.cos(a * 2)); pts.push([cx + Math.cos(a) * rr * 1.08, cy + Math.sin(a) * rr * 0.86]); }
  g.beginPath();
  for (var k = 0; k <= n; k++) {
    var p0 = pts[k % n], p1 = pts[(k + 1) % n], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    if (k === 0) g.moveTo(mx, my); else g.quadraticCurveTo(p0[0], p0[1], mx, my);
  }
  g.closePath();
}
function drawSunny(g, cx, cy, s, opt) {
  opt = opt || {};
  var mood = opt.mood || 'happy', look = opt.look || 0, line = !!opt.line, lw = s * 0.045, ink = opt.ink || '#2a1608';
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  var yolkR = s * 0.52, yx = cx, yy = cy - s * 0.02;
  // legs + sneakers
  g.strokeStyle = ink; g.lineWidth = lw * 1.1;
  g.beginPath(); g.moveTo(cx - s * 0.28, cy + s * 0.72); g.lineTo(cx - s * 0.34, cy + s * 1.08); g.moveTo(cx + s * 0.28, cy + s * 0.72); g.lineTo(cx + s * 0.36, cy + s * 1.08); g.stroke();
  [[-0.36, 1], [0.38, -1]].forEach(function (f) {
    g.fillStyle = line ? '#fff' : '#c8282e'; g.beginPath(); g.ellipse(cx + s * f[0] - f[1] * s * 0.06, cy + s * 1.12, s * 0.17, s * 0.09, 0, 0, TAU); g.fill(); g.lineWidth = lw * 0.8; g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx + s * f[0] - f[1] * s * 0.06, cy + s * 1.17, s * 0.15, s * 0.035, 0, 0, TAU); g.fill(); g.stroke();
  });
  // egg white
  eggPath(g, cx, cy + s * 0.08, s * 0.82, opt.seed || 5);
  g.fillStyle = line ? '#fff' : '#fffaf0'; g.fill();
  if (!line) { var gw = g.createRadialGradient(cx - s * 0.3, cy - s * 0.3, s * 0.1, cx, cy, s); gw.addColorStop(0, 'rgba(255,255,255,0)'); gw.addColorStop(1, 'rgba(200,180,150,0.35)'); g.fillStyle = gw; g.fill(); }
  g.strokeStyle = ink; g.lineWidth = lw; g.stroke();
  // arms
  var wave = opt.wave == null ? 0.4 : opt.wave;
  g.lineWidth = lw * 1.1;
  g.beginPath(); g.moveTo(cx - s * 0.78, cy + s * 0.1); g.quadraticCurveTo(cx - s * 1.0, cy + s * 0.3, cx - s * 1.05, cy + s * 0.52); g.stroke();
  var ax = cx + s * 0.8, ay = cy - s * 0.02, ex = ax + Math.cos(-0.9 - wave) * s * 0.5, ey = ay + Math.sin(-0.9 - wave) * s * 0.5;
  g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(ax + s * 0.25, ay - s * 0.05, ex, ey); g.stroke();
  [[cx - s * 1.06, cy + s * 0.58], [ex, ey - s * 0.04]].forEach(function (h, i) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(h[0], h[1], s * 0.13, 0, TAU); g.fill(); g.lineWidth = lw * 0.8; g.stroke();
    if (i === 1) { for (var f = -1; f <= 1; f++) { g.beginPath(); g.ellipse(h[0] + f * s * 0.075, h[1] - s * 0.13, s * 0.04, s * 0.07, f * 0.25, 0, TAU); g.fill(); g.stroke(); } }
  });
  // yolk
  g.beginPath(); g.arc(yx, yy, yolkR, 0, TAU);
  if (line) g.fillStyle = '#fff';
  else { var gy = g.createRadialGradient(yx - yolkR * 0.35, yy - yolkR * 0.4, yolkR * 0.1, yx, yy, yolkR); gy.addColorStop(0, '#ffe27a'); gy.addColorStop(0.55, '#ffb21c'); gy.addColorStop(1, '#f08a00'); g.fillStyle = gy; }
  g.fill(); g.lineWidth = lw; g.stroke();
  if (opt.scribble) { // colored by "someone" — red crayon outside the lines
    var rs = makeRNG(opt.scribble); g.strokeStyle = 'rgba(170,10,20,0.75)'; g.lineWidth = s * 0.05;
    for (var q = 0; q < 26; q++) { g.beginPath(); var sx = yx + (rs() - 0.5) * yolkR * 2.2, sy = yy + (rs() - 0.5) * yolkR * 2.2; g.moveTo(sx, sy); g.lineTo(sx + (rs() - 0.5) * s * 0.9, sy + (rs() - 0.5) * s * 0.5); g.stroke(); }
    g.strokeStyle = ink;
  }
  if (!line) { g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(yx - yolkR * 0.42, yy - yolkR * 0.45, yolkR * 0.2, yolkR * 0.11, -0.6, 0, TAU); g.fill(); }
  // cheeks
  if (mood !== 'hollow' && !line) { g.fillStyle = 'rgba(240,80,90,0.45)'; g.beginPath(); g.ellipse(yx - yolkR * 0.58, yy + yolkR * 0.18, yolkR * 0.17, yolkR * 0.1, 0, 0, TAU); g.ellipse(yx + yolkR * 0.58, yy + yolkR * 0.18, yolkR * 0.17, yolkR * 0.1, 0, 0, TAU); g.fill(); }
  // eyes
  var eo = look * yolkR * 0.1;
  [-1, 1].forEach(function (sd) {
    var ex2 = yx + sd * yolkR * 0.32, ey2 = yy - yolkR * 0.16;
    if (mood === 'hollow') { g.fillStyle = '#000'; g.beginPath(); g.ellipse(ex2, ey2 + yolkR * 0.03, yolkR * 0.15, yolkR * 0.22, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(120,0,0,0.8)'; g.fillRect(ex2 - 1.5, ey2 + yolkR * 0.2, 3, yolkR * 0.45); return; }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex2, ey2, yolkR * 0.15, yolkR * 0.2, 0, 0, TAU); g.fill(); g.lineWidth = lw * 0.7; g.stroke();
    var pr = mood === 'stare' ? 0.05 : 0.1;
    g.fillStyle = ink; g.beginPath(); g.ellipse(ex2 + eo, ey2 + yolkR * 0.03, yolkR * pr, yolkR * (pr + 0.035), 0, 0, TAU); g.fill();
    if (mood !== 'stare') { g.fillStyle = '#fff'; g.beginPath(); g.arc(ex2 + eo - yolkR * 0.04, ey2 - yolkR * 0.03, yolkR * 0.035, 0, TAU); g.fill(); }
  });
  // mouth
  g.lineWidth = lw; g.strokeStyle = ink;
  if (mood === 'grin' || mood === 'hollow') {
    g.fillStyle = '#3a0505'; g.beginPath(); g.moveTo(yx - yolkR * 0.55, yy + yolkR * 0.15); g.quadraticCurveTo(yx, yy + yolkR * 0.95, yx + yolkR * 0.55, yy + yolkR * 0.15); g.quadraticCurveTo(yx, yy + yolkR * 0.4, yx - yolkR * 0.55, yy + yolkR * 0.15); g.fill(); g.stroke();
    g.fillStyle = '#fff'; for (var t = 0; t < 7; t++) { var tx = yx - yolkR * 0.42 + t * yolkR * 0.14; g.beginPath(); g.moveTo(tx, yy + yolkR * 0.3); g.lineTo(tx + yolkR * 0.06, yy + yolkR * 0.46); g.lineTo(tx + yolkR * 0.12, yy + yolkR * 0.31); g.fill(); }
  } else {
    g.fillStyle = line ? '#fff' : '#8a1a10'; g.beginPath(); g.moveTo(yx - yolkR * 0.36, yy + yolkR * 0.16); g.quadraticCurveTo(yx, yy + yolkR * 0.72, yx + yolkR * 0.36, yy + yolkR * 0.16); g.quadraticCurveTo(yx, yy + yolkR * 0.3, yx - yolkR * 0.36, yy + yolkR * 0.16); g.fill(); g.stroke();
    if (!line) { g.fillStyle = '#ff7b8a'; g.beginPath(); g.ellipse(yx, yy + yolkR * 0.44, yolkR * 0.14, yolkR * 0.07, 0, 0, TAU); g.fill(); }
  }
  // chef toque (tilted)
  g.save(); g.translate(yx + yolkR * 0.25, yy - yolkR * 0.92); g.rotate(0.28);
  g.fillStyle = '#fff'; g.lineWidth = lw * 0.9;
  g.beginPath(); g.rect(-yolkR * 0.34, -yolkR * 0.1, yolkR * 0.68, yolkR * 0.26); g.fill(); g.stroke();
  g.beginPath(); g.arc(-yolkR * 0.26, -yolkR * 0.3, yolkR * 0.22, PI * 0.6, PI * 1.9); g.arc(0, -yolkR * 0.45, yolkR * 0.26, PI * 1.05, PI * 1.95); g.arc(yolkR * 0.26, -yolkR * 0.3, yolkR * 0.22, PI * 1.1, PI * 2.4); g.closePath(); g.fill(); g.stroke();
  g.restore();
  g.restore();
}
function sunnyCanvas(size, opt) { var c = mkCanvas(size, size), g = c.getContext('2d'); drawSunny(g, size / 2, size * 0.46, size * 0.33, opt); return c; }

// neon tube look: draw path with glow layers
function neonStroke(g, drawPath, col, w) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = col; g.globalAlpha = 0.25; g.lineWidth = w * 3.2; g.filter = 'blur(' + (w * 0.9) + 'px)'; drawPath(); g.stroke();
  g.filter = 'none'; g.globalAlpha = 1; g.lineWidth = w; drawPath(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = w * 0.35; drawPath(); g.stroke();
  g.restore();
}
function neonText(g, txt, x, y, font, col, w) {
  g.save(); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = col; g.globalAlpha = 0.3; g.lineWidth = w * 3; g.filter = 'blur(' + w + 'px)'; g.strokeText(txt, x, y);
  g.filter = 'none'; g.globalAlpha = 1; g.lineWidth = w; g.strokeText(txt, x, y);
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = w * 0.33; g.strokeText(txt, x, y);
  g.restore();
}
// interior neon over the pass window: "Sunny Side" + mascot outline. eyes drawn separately.
function canvasNeonInterior(eyeLook) {
  var c = mkCanvas(1024, 384), g = c.getContext('2d');
  neonText(g, 'Sunny Side', 600, 170, '150px ' + F.logo, '#ff4fa3', 9);
  neonText(g, 'D I N E R', 610, 315, '64px ' + F.slab, '#5be8ff', 6);
  // mascot outline in neon (yolk circle, toque, egg white)
  var cx = 170, cy = 200;
  neonStroke(g, function () { g.beginPath(); eggPath(g, cx, cy + 10, 128, 5); }, '#fff2d0', 7);
  neonStroke(g, function () { g.beginPath(); g.arc(cx, cy, 78, 0, TAU); }, '#ffb21c', 8);
  neonStroke(g, function () { g.beginPath(); g.moveTo(cx - 40, cy + 22); g.quadraticCurveTo(cx, cy + 66, cx + 40, cy + 22); }, '#ff4fa3', 7);
  neonStroke(g, function () { g.beginPath(); g.moveTo(cx - 10, cy - 86); g.lineTo(cx + 50, cy - 70); g.moveTo(cx - 20, cy - 92); g.arc(cx + 5, cy - 125, 34, PI * 0.85, PI * 2.1); g.lineTo(cx + 50, cy - 72); }, '#ffffff', 6);
  return c;
}
function canvasNeonEyes(look, mood) {
  var c = mkCanvas(256, 128), g = c.getContext('2d');
  [-1, 1].forEach(function (sd) {
    var x = 128 + sd * 26, y = 64;
    neonStroke(g, function () { g.beginPath(); g.ellipse(x, y, 11, 16, 0, 0, TAU); }, '#5be8ff', 4);
    var px = x + (look || 0) * 6;
    g.fillStyle = mood === 'red' ? '#ff2020' : '#e8fbff'; g.beginPath(); g.arc(px, y + 3, mood === 'red' ? 5 : 4, 0, TAU); g.fill();
  });
  return c;
}
// letter board menu above the back bar
function canvasMenuBoard(prices) {
  var c = mkCanvas(1024, 512), g = c.getContext('2d');
  g.fillStyle = '#141313'; g.fillRect(0, 0, 1024, 512);
  for (var y = 8; y < 512; y += 10) { g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(0, y, 1024, 4); }
  g.strokeStyle = '#b9bec4'; g.lineWidth = 14; g.strokeRect(7, 7, 1010, 498);
  g.fillStyle = '#f4efe2'; g.textBaseline = 'middle';
  g.font = '44px ' + F.slab; g.textAlign = 'center'; g.fillText('~ MENU ~', 512, 54);
  var items = [['PANCAKES', '2.95'], ['SUNNY SIDE EGGS', '1.95'], ['CHEESEBURGER', '3.45'], ['COFFEE', '0.50'], ['CHERRY PIE', '1.75'], ['MILKSHAKE', '1.95']];
  g.font = '34px ' + F.ui; g.textAlign = 'left';
  items.forEach(function (it, i) {
    var yy = 120 + i * 58; g.fillStyle = '#f4efe2'; g.fillText(it[0], 70, yy);
    g.textAlign = 'right'; g.fillText(it[1], 950, yy); g.textAlign = 'left';
    g.fillStyle = 'rgba(244,239,226,0.35)'; for (var d = 440; d < 860; d += 16) g.fillRect(d, yy + 8, 5, 3);
  });
  g.font = '24px ' + F.ui; g.fillStyle = '#ff8fb8'; g.textAlign = 'center'; g.fillText('OPEN 24 HOURS  ·  WE NEVER CLOSE', 512, 478);
  // a missing letter / crooked letter for realism
  return c;
}
function canvasPoster(kind) {
  var c = mkCanvas(512, 704), g = c.getContext('2d'), rnd = makeRNG(kind.length * 7);
  if (kind === 'rise') {
    var gr = g.createLinearGradient(0, 0, 0, 704); gr.addColorStop(0, '#ffd36a'); gr.addColorStop(1, '#f39a3a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 704);
    for (var i = 0; i < 18; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(255,240,200,0.0)'; g.beginPath(); g.moveTo(256, 380); g.arc(256, 380, 700, i / 18 * TAU, (i + 0.5) / 18 * TAU); g.fill(); }
    drawSunny(g, 256, 360, 140, { wave: 0.6 });
    g.font = '86px ' + F.logo; g.fillStyle = '#c8282e'; g.textAlign = 'center'; g.strokeStyle = '#fff'; g.lineWidth = 10; g.strokeText('Rise and', 256, 110); g.fillText('Rise and', 256, 110); g.strokeText('shine!', 256, 200); g.fillText('shine!', 256, 200);
    g.font = '30px ' + F.slab; g.fillStyle = '#7e1418'; g.fillText('BREAKFAST ALL NIGHT', 256, 640);
  } else if (kind === 'pie') {
    g.fillStyle = '#8fd3c1'; g.fillRect(0, 0, 512, 704);
    g.fillStyle = '#fbf3e0'; g.fillRect(30, 30, 452, 644);
    g.font = '64px ' + F.logo; g.fillStyle = '#c8282e'; g.textAlign = 'center'; g.fillText('Pie of the Day', 256, 120);
    g.fillStyle = '#d99a4e'; g.beginPath(); g.moveTo(256, 300); g.arc(256, 300, 170, -0.3, PI + 0.3, true); g.fill();
    g.fillStyle = '#a3121e'; g.beginPath(); g.arc(256, 300, 140, -0.2, PI + 0.2, true); g.fill();
    for (var k = 0; k < 7; k++) { g.strokeStyle = '#e3b06a'; g.lineWidth = 16; g.beginPath(); g.moveTo(130 + k * 40, 180); g.lineTo(110 + k * 40, 420); g.stroke(); }
    g.font = '70px ' + F.slab; g.fillStyle = '#22201c'; g.fillText('CHERRY', 256, 560); g.font = '40px ' + F.ui; g.fillText('35¢ A SLICE', 256, 620);
  } else if (kind === 'photo') { // 1958 opening day, B/W
    g.fillStyle = '#efe8d8'; g.fillRect(0, 0, 512, 704);
    var ph = mkCanvas(440, 520), p = ph.getContext('2d'); p.fillStyle = '#777'; p.fillRect(0, 0, 440, 520);
    var sky = p.createLinearGradient(0, 0, 0, 300); sky.addColorStop(0, '#bbb'); sky.addColorStop(1, '#ddd'); p.fillStyle = sky; p.fillRect(0, 0, 440, 300);
    p.fillStyle = '#555'; p.fillRect(40, 190, 360, 150); p.fillStyle = '#999'; for (var w = 0; w < 6; w++) p.fillRect(60 + w * 56, 230, 44, 60);
    p.fillStyle = '#333'; p.fillRect(150, 120, 140, 60); p.fillStyle = '#eee'; p.font = '26px ' + F.logo; p.textAlign = 'center'; p.fillText('Sunny Side', 220, 158);
    p.fillStyle = '#444'; p.fillRect(0, 340, 440, 180);
    [[120, 0.9], [175, 1], [250, 0.55], [310, 1]].forEach(function (pp) { p.fillStyle = '#2a2a2a'; p.beginPath(); p.arc(pp[0], 380 - 60 * pp[1], 16 * pp[1], 0, TAU); p.fill(); p.fillRect(pp[0] - 18 * pp[1], 390 - 45 * pp[1], 36 * pp[1], 95 * pp[1]); });
    p.globalCompositeOperation = 'overlay'; for (var n2 = 0; n2 < 4000; n2++) { p.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '255,255,255') + ',0.2)'; p.fillRect(rnd() * 440, rnd() * 520, 2, 2); }
    g.drawImage(ph, 36, 36);
    g.font = '30px ' + F.hand; g.fillStyle = '#334'; g.textAlign = 'center'; g.fillText('Opening day — June 1958', 256, 620); g.fillText('Hal, June & little Daisy', 256, 660);
  } else if (kind === 'employee') {
    g.fillStyle = '#2b2a2c'; g.fillRect(0, 0, 512, 704); g.fillStyle = '#d4b46a'; g.fillRect(16, 16, 480, 672); g.fillStyle = '#fbf3e0'; g.fillRect(36, 36, 440, 632);
    g.font = '38px ' + F.slab; g.fillStyle = '#c8282e'; g.textAlign = 'center'; g.fillText('EMPLOYEE', 256, 96); g.fillText('OF THE MONTH', 256, 140);
    g.fillStyle = '#bbb'; g.fillRect(110, 180, 292, 340);
    g.fillStyle = '#888'; g.beginPath(); g.arc(256, 300, 70, 0, TAU); g.fill(); g.fillRect(170, 380, 172, 140);
    g.font = '40px ' + F.hand; g.fillStyle = '#22201c'; g.fillText('Dale', 256, 590);
  } else if (kind === 'wanted') {
    g.fillStyle = '#f1e7cf'; g.fillRect(0, 0, 512, 704);
    g.font = '58px ' + F.slab; g.fillStyle = '#22201c'; g.textAlign = 'center'; g.fillText('HELP', 256, 110); g.fillText('WANTED', 256, 180);
    g.font = '34px ' + F.type; g.fillText('Night Shift', 256, 260); g.fillText('No Experience', 256, 320); g.fillText('Needed!', 256, 370);
    drawSunny(g, 256, 520, 80, {});
  }
  // age: yellowing, edges, pin
  var ag = g.createRadialGradient(256, 352, 200, 256, 352, 460); ag.addColorStop(0, 'rgba(120,90,40,0)'); ag.addColorStop(1, 'rgba(120,90,40,0.45)'); g.fillStyle = ag; g.fillRect(0, 0, 512, 704);
  for (var s2 = 0; s2 < 1500; s2++) { g.fillStyle = 'rgba(90,70,40,' + rnd() * 0.12 + ')'; g.fillRect(rnd() * 512, rnd() * 704, 2, 2); }
  return c;
}
function canvasClock() {
  var c = mkCanvas(512, 512), g = c.getContext('2d');
  g.fillStyle = '#f6f0df'; g.beginPath(); g.arc(256, 256, 250, 0, TAU); g.fill();
  g.fillStyle = '#c8282e'; g.font = '46px ' + F.logo; g.textAlign = 'center'; g.fillText('Sunny Side', 256, 190);
  g.fillStyle = '#22201c'; g.font = '44px ' + F.slab;
  for (var i = 1; i <= 12; i++) { var a = i / 12 * TAU - PI / 2; g.fillText(String(i), 256 + Math.cos(a) * 196, 256 + Math.sin(a) * 196 + 16); }
  for (var k = 0; k < 60; k++) { var b = k / 60 * TAU; g.fillRect(256 + Math.cos(b) * 236 - 2, 256 + Math.sin(b) * 236 - 2, k % 5 ? 3 : 6, k % 5 ? 3 : 6); }
  return c;
}
function canvasSign(lines, bg, fg, w, h, font) {
  var c = mkCanvas(w || 512, h || 256), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(14, 14, c.width - 28, c.height - 28);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(function (l, i) { g.font = (l[1] || 48) + 'px ' + (l[2] || font || F.slab); g.fillText(l[0], c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * (l[3] || 60)); });
  return c;
}
function canvasExteriorSign(on) {
  var c = mkCanvas(1024, 768), g = c.getContext('2d');
  g.fillStyle = '#0d1a1c'; g.fillRect(0, 0, 1024, 768);
  // marquee bulbs
  for (var i = 0; i < 40; i++) { var x = 40 + (i % 20) * 50, y = i < 20 ? 30 : 738; g.fillStyle = on ? '#ffe9a8' : '#555'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
  neonText(g, 'Sunny Side', 512, 250, '200px ' + F.logo, '#ff4fa3', 11);
  neonText(g, 'DINER', 512, 470, '150px ' + F.slab, '#5be8ff', 9);
  neonText(g, 'OPEN 24 HOURS', 512, 640, '70px ' + F.ui, '#ffe27a', 6);
  return c;
}
function canvasGasSign() {
  var c = mkCanvas(512, 768), g = c.getContext('2d');
  g.fillStyle = '#f3e6c8'; g.fillRect(0, 0, 512, 768);
  g.fillStyle = '#c8282e'; g.fillRect(0, 0, 512, 220);
  g.fillStyle = '#fff'; g.font = '110px ' + F.slab; g.textAlign = 'center'; g.fillText('GAS', 256, 150);
  g.fillStyle = '#22201c'; g.font = '56px ' + F.ui;
  [['REGULAR', '0.89'], ['SUPER', '0.97'], ['DIESEL', '0.79']].forEach(function (r, i) { g.textAlign = 'left'; g.fillText(r[0], 40, 330 + i * 150); g.textAlign = 'right'; g.font = '80px ' + F.slab; g.fillText(r[1], 480, 330 + i * 150); g.font = '56px ' + F.ui; });
  g.fillStyle = 'rgba(60,40,20,0.25)'; for (var k = 0; k < 30; k++) g.fillRect(Math.random() * 512, Math.random() * 768, 30, 3);
  return c;
}
function canvasJukeboxFace(label) {
  var c = mkCanvas(512, 768), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, '#ff7a2e'); gr.addColorStop(0.5, '#ffd36a'); gr.addColorStop(1, '#ff4fa3');
  g.fillStyle = '#111'; g.fillRect(0, 0, 512, 768);
  g.fillStyle = gr; g.beginPath(); g.moveTo(40, 760); g.lineTo(40, 260); g.arc(256, 260, 216, PI, 0); g.lineTo(472, 760); g.lineTo(420, 760); g.lineTo(420, 270); g.arc(256, 270, 164, 0, PI, true); g.lineTo(92, 760); g.fill();
  // record window
  g.fillStyle = '#1b1a20'; g.beginPath(); g.moveTo(110, 470); g.lineTo(110, 290); g.arc(256, 290, 146, PI, 0); g.lineTo(402, 470); g.fill();
  g.fillStyle = '#060606'; g.beginPath(); g.ellipse(256, 380, 110, 40, 0, 0, TAU); g.fill(); g.fillStyle = '#c8282e'; g.beginPath(); g.ellipse(256, 380, 30, 11, 0, 0, TAU); g.fill();
  // title strips
  g.fillStyle = '#f6f0df'; g.fillRect(110, 500, 292, 150);
  g.fillStyle = '#22201c'; g.font = '19px ' + F.type; g.textAlign = 'left';
  ['A1  Diner Boogie', 'A2  Highway Moon', 'A3  Rise & Shine', 'B1  Desert Rain', 'B2  Neon Heart', 'B3  Last Call'].forEach(function (s, i) { g.fillText(s, 124, 524 + i * 22); });
  g.fillStyle = '#c8282e'; g.fillRect(110, 650, 292, 6);
  return c;
}
