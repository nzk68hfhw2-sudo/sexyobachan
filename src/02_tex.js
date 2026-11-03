// ---- procedural textures (canvas). No external image except the face jpgs. ---
var TEX = {};
var MAX_ANISO = 1;
function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function toTex(c, opt) {
  opt = opt || {};
  var t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = opt.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.anisotropy = opt.aniso || Math.min(4, MAX_ANISO);
  if (opt.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  t.encoding = THREE.sRGBEncoding;
  return t;
}
function pixels(c, fn) { // fn(x,y,rgba)-> modifies
  var g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height, id = g.getImageData(0, 0, w, h), d = id.data, p = [0, 0, 0, 255];
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var i = (y * w + x) * 4; p[0] = d[i]; p[1] = d[i + 1]; p[2] = d[i + 2]; p[3] = d[i + 3];
    fn(x, y, p); d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = p[3];
  }
  g.putImageData(id, 0, 0);
}
function grain(c, amt, seed) {
  var s = seed || 1;
  pixels(c, function (x, y, p) { var n = (hash2(x + s * 131, y + s * 71) - 0.5) * amt; p[0] += n; p[1] += n; p[2] += n; });
}
function stain(g, x, y, r, col, a) { // water stain ring
  var gr = g.createRadialGradient(x, y, r * 0.2, x, y, r);
  gr.addColorStop(0, 'rgba(' + col + ',' + a * 0.4 + ')'); gr.addColorStop(0.8, 'rgba(' + col + ',' + a * 0.55 + ')');
  gr.addColorStop(0.93, 'rgba(' + col + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * (0.7 + Math.random() * 0.4), Math.random() * 3, 0, TAU); g.fill();
}
function scuffs(g, w, h, n, rnd) {
  for (var i = 0; i < n; i++) {
    g.strokeStyle = 'rgba(10,10,12,' + (0.08 + rnd() * 0.25) + ')'; g.lineWidth = 0.6 + rnd() * 2.2;
    var x = rnd() * w, y = rnd() * h, a = rnd() * TAU, l = 6 + rnd() * 30;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rnd() * 6, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}

// linoleum VCT checker (texture = 1.2m x 1.2m, 4x4 tiles of 30cm)
function texLino(cA, cB, seed) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 7);
  for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) {
    var dark = (x + y) & 1; var base = dark ? cB : cA;
    var v = (rnd() - 0.5) * 14;
    g.fillStyle = 'rgb(' + (base[0] + v | 0) + ',' + (base[1] + v | 0) + ',' + (base[2] + v | 0) + ')';
    g.fillRect(x * 128, y * 128, 128, 128);
  }
  // vinyl chips
  for (var i = 0; i < 2600; i++) {
    var xx = rnd() * 512, yy = rnd() * 512, l = rnd() < 0.5;
    g.fillStyle = l ? 'rgba(255,250,235,' + rnd() * 0.25 + ')' : 'rgba(20,18,15,' + rnd() * 0.28 + ')';
    g.fillRect(xx, yy, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  // wax build-up near seams + grout
  g.strokeStyle = 'rgba(30,26,20,0.55)'; g.lineWidth = 2;
  for (var k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 128, 0); g.lineTo(k * 128, 512); g.stroke(); g.beginPath(); g.moveTo(0, k * 128); g.lineTo(512, k * 128); g.stroke(); }
  scuffs(g, 512, 512, 70, rnd);
  for (var j = 0; j < 5; j++) stain(g, rnd() * 512, rnd() * 512, 20 + rnd() * 60, '70,55,30', 0.08);
  grain(c, 16, seed);
  return c;
}
function texWoodFloor(seed) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 3);
  var pw = 32; // plank width
  for (var x = 0; x < 512; x += pw) {
    var off = rnd() * 512;
    for (var y = -512; y < 512; y += 180 + rnd() * 160) {
      var t = rnd(); var r = 176 + t * 30, gg = 128 + t * 24, b = 78 + t * 18;
      g.fillStyle = 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')';
      var yy = (y + off) % 512; g.fillRect(x, yy, pw, 340); g.fillRect(x, yy - 512, pw, 340);
      g.fillStyle = 'rgba(40,20,5,0.5)'; g.fillRect(x, yy, pw, 1.5);
    }
    for (var s = 0; s < 26; s++) { g.strokeStyle = 'rgba(80,45,15,' + rnd() * 0.18 + ')'; g.lineWidth = 1; var sx = x + rnd() * pw; g.beginPath(); g.moveTo(sx, 0); g.bezierCurveTo(sx + rnd() * 4 - 2, 170, sx + rnd() * 4 - 2, 340, sx, 512); g.stroke(); }
    g.fillStyle = 'rgba(30,15,5,0.6)'; g.fillRect(x, 0, 1.2, 512);
  }
  scuffs(g, 512, 512, 60, rnd);
  grain(c, 10, seed);
  return c;
}
function texSmallTile(seed, base) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 5);
  base = base || [214, 214, 206];
  g.fillStyle = '#6d6a60'; g.fillRect(0, 0, 512, 512);
  for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
    var v = (rnd() - 0.5) * 18, bl = rnd() < 0.05 ? -60 : 0;
    g.fillStyle = 'rgb(' + (base[0] + v + bl | 0) + ',' + (base[1] + v + bl | 0) + ',' + (base[2] + v + bl * 0.6 | 0) + ')';
    g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29);
  }
  for (var j = 0; j < 8; j++) stain(g, rnd() * 512, rnd() * 512, 20 + rnd() * 70, '90,80,40', 0.12);
  grain(c, 12, seed);
  return c;
}
function texTerrazzo(seed) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 9);
  g.fillStyle = '#b9b2a2'; g.fillRect(0, 0, 512, 512);
  var cols = ['#8a8172', '#e6e0d2', '#5e5a52', '#9c6f5a', '#6f7f78'];
  for (var i = 0; i < 4200; i++) { g.fillStyle = cols[i % 5]; var r = 0.6 + rnd() * 2.4; g.beginPath(); g.ellipse(rnd() * 512, rnd() * 512, r, r * (0.5 + rnd()), rnd() * 3, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(60,55,45,0.6)'; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512);
  scuffs(g, 512, 512, 50, rnd);
  grain(c, 14, seed);
  return c;
}
function texCarpet(seed) {
  var c = mkCanvas(256, 256), g = c.getContext('2d'), rnd = makeRNG(seed || 11);
  g.fillStyle = '#4a3a52'; g.fillRect(0, 0, 256, 256);
  pixels(c, function (x, y, p) { var n = fbm(x * 0.08, y * 0.08, 3) * 30 + (hash2(x, y) - 0.5) * 40; p[0] += n; p[1] += n * 0.8; p[2] += n; });
  for (var j = 0; j < 6; j++) stain(g, rnd() * 256, rnd() * 256, 10 + rnd() * 30, '30,20,10', 0.2);
  return c;
}
function texConcrete(seed) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 13);
  g.fillStyle = '#77736b'; g.fillRect(0, 0, 512, 512);
  pixels(c, function (x, y, p) { var n = (fbm(x * 0.02, y * 0.02, 5) - 0.5) * 70 + (hash2(x, y) - 0.5) * 22; p[0] += n; p[1] += n; p[2] += n * 0.95; });
  for (var j = 0; j < 10; j++) stain(g, rnd() * 512, rnd() * 512, 20 + rnd() * 90, '40,35,25', 0.25);
  g.strokeStyle = 'rgba(20,20,20,0.5)'; for (var k = 0; k < 6; k++) { g.lineWidth = 0.7; g.beginPath(); var x = rnd() * 512, y = rnd() * 512; g.moveTo(x, y); for (var s = 0; s < 8; s++) { x += rnd() * 30 - 15; y += rnd() * 30 - 15; g.lineTo(x, y); } g.stroke(); }
  return c;
}
// acoustic ceiling tiles: texture covers 2.4 x 2.4 m (8 panels of 0.6 x 1.2), few stained
function texCeiling(seed) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 17);
  g.fillStyle = '#dcd9cf'; g.fillRect(0, 0, 512, 512);
  pixels(c, function (x, y, p) { var n = (hash2(x * 3, y * 3) - 0.5) * 22 + (fbm(x * 0.04, y * 0.04, 3) - 0.5) * 14; if (hash2(x * 7 + 3, y * 5) > 0.992) n -= 45; p[0] += n; p[1] += n; p[2] += n * 0.97; });
  // fissures
  g.strokeStyle = 'rgba(120,115,105,0.25)'; g.lineWidth = 1;
  for (var f = 0; f < 140; f++) { var x = rnd() * 512, y = rnd() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd() * 8 - 4, y + rnd() * 8 - 4); g.stroke(); }
  if (seed !== 99) { stain(g, 64 + rnd() * 60, 300 + rnd() * 120, 30 + rnd() * 25, '125,88,40', 0.5); }
  if (seed === 18) { stain(g, 330, 100, 50, '110,80,40', 0.6); g.fillStyle = 'rgba(12,10,9,0.95)'; g.fillRect(387, 260, 122, 248); }
  // T-bar grid: panels 128 x 256 px (0.6 x 1.2 m)
  g.fillStyle = '#f0f0ea';
  for (var i = 0; i <= 4; i++) g.fillRect(i * 128 - 3, 0, 6, 512);
  for (var j = 0; j <= 2; j++) g.fillRect(0, j * 256 - 3, 512, 6);
  g.fillStyle = 'rgba(0,0,0,0.22)';
  for (var i2 = 0; i2 <= 4; i2++) g.fillRect(i2 * 128 + 3, 0, 2, 512);
  for (var j2 = 0; j2 <= 2; j2++) g.fillRect(0, j2 * 256 + 3, 512, 2);
  return c;
}
// painted cinder block (CMU). light grayscale so vertex color tints it. 1.6m x 1.6m
function texCMU(seed) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 19);
  g.fillStyle = '#e8e6e0'; g.fillRect(0, 0, 512, 512);
  pixels(c, function (x, y, p) { var n = (hash2(x, y) - 0.5) * 26 + (fbm(x * 0.06, y * 0.06, 3) - 0.5) * 24; if (hash2(x * 5 + 1, y * 3) > 0.99) n -= 40; p[0] += n; p[1] += n; p[2] += n; });
  g.fillStyle = 'rgba(70,66,60,0.55)';
  for (var r = 0; r < 8; r++) { g.fillRect(0, r * 64, 512, 3); var off = (r & 1) ? 64 : 0; for (var b = -1; b < 4; b++) g.fillRect(off + b * 128, r * 64, 3, 64); }
  // paint drips / chips
  for (var j = 0; j < 30; j++) { g.fillStyle = 'rgba(90,85,75,' + rnd() * 0.3 + ')'; g.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 6, 2 + rnd() * 5); }
  for (var k = 0; k < 3; k++) { var gx = rnd() * 512; var gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, 'rgba(110,90,50,0.0)'); gr.addColorStop(1, 'rgba(110,90,50,0.22)'); g.fillStyle = gr; g.fillRect(gx, 0, 10 + rnd() * 30, 512); }
  return c;
}
function texGlazed(seed, col) { // glazed tile wainscot 1.2m wide x 1.2m tall
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 23);
  col = col || [120, 40, 38];
  g.fillStyle = '#2a2420'; g.fillRect(0, 0, 512, 512);
  for (var y = 0; y < 8; y++) for (var x = 0; x < 4; x++) {
    var v = (rnd() - 0.5) * 20;
    var gr = g.createLinearGradient(0, y * 64, 0, y * 64 + 64);
    gr.addColorStop(0, 'rgb(' + (col[0] + 25 + v | 0) + ',' + (col[1] + 20 + v | 0) + ',' + (col[2] + 20 + v | 0) + ')');
    gr.addColorStop(1, 'rgb(' + (col[0] + v | 0) + ',' + (col[1] + v | 0) + ',' + (col[2] + v | 0) + ')');
    g.fillStyle = gr; g.fillRect(x * 128 + 2, y * 64 + 2, 124, 60);
  }
  for (var j = 0; j < 6; j++) { g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.8; g.beginPath(); var sx = rnd() * 512, sy = rnd() * 512; g.moveTo(sx, sy); g.lineTo(sx + rnd() * 40 - 20, sy + rnd() * 40); g.stroke(); }
  scuffs(g, 512, 512, 40, rnd);
  grain(c, 10, seed);
  return c;
}
function texBrick(seed) { // 1.6m x 1.6m
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 29);
  g.fillStyle = '#7f776c'; g.fillRect(0, 0, 512, 512);
  var bh = 21.33, bw = 64;
  for (var r = 0; r < 24; r++) {
    var off = (r & 1) ? bw / 2 : 0;
    for (var b = -1; b < 9; b++) {
      var t = rnd(); var cr = 120 + t * 50, cg = 52 + t * 22, cb = 38 + t * 16;
      if (rnd() < 0.08) { cr *= 0.65; cg *= 0.65; cb *= 0.7; }
      g.fillStyle = 'rgb(' + (cr | 0) + ',' + (cg | 0) + ',' + (cb | 0) + ')';
      g.fillRect(off + b * bw + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }
  pixels(c, function (x, y, p) { var n = (hash2(x, y) - 0.5) * 30 + (fbm(x * 0.03, y * 0.03, 4) - 0.5) * 40; p[0] += n; p[1] += n * 0.8; p[2] += n * 0.7; });
  for (var j = 0; j < 4; j++) stain(g, rnd() * 512, rnd() * 512, 40 + rnd() * 90, '20,20,15', 0.3);
  return c;
}
var CHALK_BASE = null;
function texChalkboard(lines, seed, dirty) {
  if (!CHALK_BASE) { CHALK_BASE = mkCanvas(1024, 384); var tmpC = CHALK_BASE; var cg = CHALK_BASE.getContext('2d'); cg.fillStyle = '#23392d'; cg.fillRect(0, 0, 1024, 384); pixels(CHALK_BASE, function (x, y, p) { var n = (fbm(x * 0.01, y * 0.02, 4) - 0.5) * 30 + (hash2(x, y) - 0.5) * 8; p[0] += n * 0.8; p[1] += n; p[2] += n * 0.85; }); }
  var c = mkCanvas(1024, 384), g = c.getContext('2d'), rnd = makeRNG(seed || 31);
  g.drawImage(CHALK_BASE, 0, 0);
  // eraser smudges
  for (var i = 0; i < 18; i++) { g.fillStyle = 'rgba(200,210,200,' + (0.03 + rnd() * 0.05) + ')'; g.beginPath(); g.ellipse(rnd() * 1024, rnd() * 384, 40 + rnd() * 120, 10 + rnd() * 30, rnd() * 0.5 - 0.25, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(240,240,230,0.92)'; g.textBaseline = 'top';
  (lines || []).forEach(function (l, k) {
    g.font = (l.size || 40) + 'px "Special Elite", "Courier New", monospace';
    g.fillStyle = l.color || 'rgba(240,240,230,0.9)';
    g.save(); g.translate(l.x || 50, l.y || 40 + k * 56); g.rotate((rnd() - 0.5) * 0.03); g.fillText(l.t, 0, 0); g.restore();
  });
  if (dirty) { g.fillStyle = 'rgba(240,240,230,0.85)'; g.font = '30px "Special Elite", monospace'; g.fillText(dirty, 60 + rnd() * 500, 300); }
  // frame & chalk tray
  g.strokeStyle = '#6a4a2c'; g.lineWidth = 18; g.strokeRect(0, 0, 1024, 384);
  return c;
}
// locker front atlas: 4 variants side by side (each 128 x 512) for one locker 0.48 x 1.8 m
function texLockers(seed) {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 37);
  for (var v = 0; v < 4; v++) {
    var ox = v * 128;
    g.fillStyle = '#c9cbc8'; g.fillRect(ox, 0, 128, 512);
    var gr = g.createLinearGradient(ox, 0, ox + 128, 0); gr.addColorStop(0, 'rgba(0,0,0,0.35)'); gr.addColorStop(0.08, 'rgba(255,255,255,0.15)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(0.95, 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)');
    g.fillStyle = gr; g.fillRect(ox, 0, 128, 512);
    // vents
    for (var k = 0; k < 6; k++) { g.fillStyle = '#1b1c1c'; g.fillRect(ox + 30, 26 + k * 11, 68, 5); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(ox + 30, 31 + k * 11, 68, 1.5); }
    for (var k2 = 0; k2 < 6; k2++) { g.fillStyle = '#1b1c1c'; g.fillRect(ox + 30, 420 + k2 * 11, 68, 5); }
    // handle + dial lock
    g.fillStyle = '#7d7f80'; g.fillRect(ox + 96, 230, 14, 70); g.fillStyle = '#3b3c3c'; g.fillRect(ox + 99, 234, 8, 62);
    if (v !== 2) { g.fillStyle = '#222'; g.beginPath(); g.arc(ox + 103, 330, 11, 0, TAU); g.fill(); g.fillStyle = '#aaa'; g.beginPath(); g.arc(ox + 103, 330, 8, 0, TAU); g.fill(); g.fillStyle = '#111'; g.fillRect(ox + 102, 322, 2, 6); }
    // number plate
    g.fillStyle = '#d8c27a'; g.fillRect(ox + 44, 120, 40, 16); g.fillStyle = '#222'; g.font = 'bold 12px monospace'; g.fillText(String(100 + Math.floor(rnd() * 800)), ox + 51, 132);
    // dents, rust, stickers
    for (var d = 0; d < 4; d++) { var dx = ox + 10 + rnd() * 108, dy = rnd() * 512; var rg = g.createRadialGradient(dx, dy, 1, dx, dy, 10 + rnd() * 14); rg.addColorStop(0, 'rgba(0,0,0,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(dx - 30, dy - 30, 60, 60); }
    for (var r = 0; r < 3 + v * 2; r++) { var rx = ox + rnd() * 128, ry = rnd() * 512; var rr = g.createLinearGradient(rx, ry, rx, ry + 60); rr.addColorStop(0, 'rgba(120,60,20,0.55)'); rr.addColorStop(1, 'rgba(120,60,20,0)'); g.fillStyle = rr; g.fillRect(rx, ry, 2 + rnd() * 4, 30 + rnd() * 60); }
    if (v === 1) { g.fillStyle = '#e63'; g.beginPath(); g.arc(ox + 64, 380, 16, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.fillText('GO', ox + 57, 383); g.fillText('OWLS', ox + 52, 392); }
    if (v === 3) { g.fillStyle = '#ffd400'; g.save(); g.translate(ox + 50, 170); g.rotate(0.2); g.fillRect(0, 0, 36, 22); g.fillStyle = '#222'; g.font = 'bold 9px sans-serif'; g.fillText('★ A+', 4, 15); g.restore(); g.strokeStyle = 'rgba(10,10,10,0.7)'; g.lineWidth = 1.2; g.font = '15px "Special Elite", monospace'; g.fillStyle = 'rgba(15,15,15,0.7)'; g.fillText('HELP', ox + 20, 470); }
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(ox, 0, 2, 512); g.fillRect(ox + 126, 0, 2, 512);
  }
  grain(c, 14, seed);
  return c;
}
function texWood(seed, base) {
  var c = mkCanvas(256, 256), g = c.getContext('2d');
  base = base || [150, 102, 60];
  pixels(c, function (x, y, p) {
    var w = Math.sin((x * 0.06 + fbm(x * 0.02, y * 0.01, 3) * 6)) * 0.5 + 0.5;
    var n = (hash2(x, y) - 0.5) * 14;
    p[0] = base[0] * (0.8 + w * 0.25) + n; p[1] = base[1] * (0.8 + w * 0.25) + n; p[2] = base[2] * (0.8 + w * 0.25) + n; p[3] = 255;
  });
  return c;
}
function texDoor(seed, label) { // classroom door 1m x 2.1m (256 x 538)
  var c = mkCanvas(256, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 41);
  var w = texWood(seed, [138, 92, 52]); g.drawImage(w, 0, 0, 256, 512);
  // window (wired glass)
  g.fillStyle = '#0c1214'; g.fillRect(70, 70, 116, 150);
  g.strokeStyle = 'rgba(160,170,170,0.35)'; g.lineWidth = 1;
  for (var i = 0; i < 12; i++) { g.beginPath(); g.moveTo(70, 70 + i * 13); g.lineTo(186, 70 + i * 13); g.stroke(); g.beginPath(); g.moveTo(70 + i * 10, 70); g.lineTo(70 + i * 10, 220); g.stroke(); }
  g.strokeStyle = '#3a2a18'; g.lineWidth = 6; g.strokeRect(70, 70, 116, 150);
  // kick plate + handle
  g.fillStyle = '#8f8f88'; g.fillRect(0, 450, 256, 62); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 450, 256, 2);
  g.fillStyle = '#b9b7ad'; g.fillRect(200, 270, 26, 50); g.fillStyle = '#5c5a55'; g.fillRect(205, 290, 28, 8);
  scuffs(g, 256, 512, 30, rnd);
  if (label) { g.fillStyle = '#f3efe0'; g.fillRect(60, 240, 136, 30); g.fillStyle = '#222'; g.font = 'bold 18px "Special Elite",monospace'; g.textAlign = 'center'; g.fillText(label, 128, 262); }
  return c;
}
function texMetal(seed, base) {
  var c = mkCanvas(128, 128); base = base || [150, 150, 150];
  pixels(c, function (x, y, p) { var n = (hash2(x, y * 9) - 0.5) * 20 + (fbm(x * 0.05, y * 0.05, 3) - 0.5) * 30; p[0] = base[0] + n; p[1] = base[1] + n; p[2] = base[2] + n; p[3] = 255; });
  return c;
}
function texNoiseGray(size, scale, contrast) {
  var c = mkCanvas(size, size);
  pixels(c, function (x, y, p) { var n = fbm(x * scale, y * scale, 5); var v = clamp(128 + (n - 0.5) * 255 * contrast, 0, 255); p[0] = p[1] = p[2] = v; p[3] = 255; });
  return c;
}
// procedural skin (monsters): veins, blotches, sores, wet sheen handled by material
function texSkin(base, seed, opt) {
  opt = opt || {};
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 43);
  pixels(c, function (x, y, p) {
    var n = fbm(x * 0.012, y * 0.012, 5), m = fbm(x * 0.05 + 9, y * 0.05, 3);
    var blot = smooth((fbm(x * 0.008 + 3, y * 0.008, 3) - 0.55) * 6);
    p[0] = base[0] * (0.75 + n * 0.5) - blot * 40 + (m - 0.5) * 20;
    p[1] = base[1] * (0.75 + n * 0.5) - blot * 35 + (m - 0.5) * 18;
    p[2] = base[2] * (0.75 + n * 0.5) - blot * 25 + (m - 0.5) * 18;
    p[3] = 255;
  });
  // veins
  g.lineCap = 'round';
  for (var v = 0; v < (opt.veins || 26); v++) {
    var x = rnd() * 512, y = rnd() * 512, a = rnd() * TAU, w = 0.6 + rnd() * 1.8;
    g.strokeStyle = 'rgba(' + (opt.veinCol || '60,40,90') + ',' + (0.25 + rnd() * 0.35) + ')';
    for (var s = 0; s < 18; s++) { g.lineWidth = w * (1 - s / 18); g.beginPath(); g.moveTo(x, y); a += (rnd() - 0.5) * 0.9; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); g.stroke(); if (rnd() < 0.15) { var bx = x, by = y, ba = a + (rnd() - 0.5) * 2; for (var q = 0; q < 6; q++) { g.lineWidth = w * 0.4; g.beginPath(); g.moveTo(bx, by); bx += Math.cos(ba) * 6; by += Math.sin(ba) * 6; g.lineTo(bx, by); g.stroke(); } } }
  }
  // sores / blood
  for (var b = 0; b < (opt.sores || 10); b++) {
    var sx = rnd() * 512, sy = rnd() * 512, sr = 3 + rnd() * 14;
    var rg = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 2);
    rg.addColorStop(0, 'rgba(70,8,8,0.85)'); rg.addColorStop(0.4, 'rgba(110,30,25,0.5)'); rg.addColorStop(1, 'rgba(110,40,30,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(sx, sy, sr * 2, 0, TAU); g.fill();
  }
  if (opt.blood) for (var d = 0; d < opt.blood; d++) {
    var dx = rnd() * 512, dy = rnd() * 400; g.fillStyle = 'rgba(80,5,5,' + (0.5 + rnd() * 0.4) + ')';
    g.beginPath(); g.ellipse(dx, dy, 3 + rnd() * 6, 3 + rnd() * 4, 0, 0, TAU); g.fill();
    g.fillRect(dx - 1, dy, 2 + rnd() * 2, 20 + rnd() * 80);
  }
  return c;
}
function texCloth(base, seed, opt) {
  opt = opt || {};
  var c = mkCanvas(256, 256), g = c.getContext('2d'), rnd = makeRNG(seed || 47);
  pixels(c, function (x, y, p) {
    var weave = ((x & 3) < 2 ? 1 : 0) ^ ((y & 3) < 2 ? 1 : 0);
    var n = fbm(x * 0.03, y * 0.03, 4);
    var k = 0.7 + n * 0.5 + weave * 0.05 + (hash2(x, y) - 0.5) * 0.12;
    p[0] = base[0] * k; p[1] = base[1] * k; p[2] = base[2] * k; p[3] = 255;
  });
  for (var i = 0; i < (opt.stains || 6); i++) stain(g, rnd() * 256, rnd() * 256, 10 + rnd() * 40, opt.stainCol || '40,25,15', 0.35);
  if (opt.blood) for (var b = 0; b < opt.blood; b++) stain(g, rnd() * 256, rnd() * 256, 8 + rnd() * 30, '90,5,5', 0.7);
  return c;
}
function texFur(base, seed) {
  var c = mkCanvas(256, 256), g = c.getContext('2d'), rnd = makeRNG(seed || 53);
  g.fillStyle = 'rgb(' + base.join(',') + ')'; g.fillRect(0, 0, 256, 256);
  for (var i = 0; i < 9000; i++) {
    var x = rnd() * 256, y = rnd() * 256, l = 2 + rnd() * 5, a = PI / 2 + (rnd() - 0.5) * 0.8, k = 0.65 + rnd() * 0.6;
    g.strokeStyle = 'rgba(' + (base[0] * k | 0) + ',' + (base[1] * k | 0) + ',' + (base[2] * k | 0) + ',0.7)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}
function texHair(seed, col) { // alpha strands, vertical
  var c = mkCanvas(128, 512), g = c.getContext('2d'), rnd = makeRNG(seed || 59);
  col = col || [12, 10, 10];
  g.clearRect(0, 0, 128, 512);
  for (var i = 0; i < 90; i++) {
    var x = rnd() * 128, w = 0.6 + rnd() * 1.6, k = 0.6 + rnd() * 0.9;
    g.strokeStyle = 'rgba(' + (col[0] * k + 8 | 0) + ',' + (col[1] * k + 7 | 0) + ',' + (col[2] * k + 8 | 0) + ',' + (0.55 + rnd() * 0.45) + ')';
    g.lineWidth = w; g.beginPath(); g.moveTo(x, 0);
    var cx = x; for (var y = 0; y <= 512; y += 32) { cx += (rnd() - 0.5) * 5; g.lineTo(cx, y); }
    g.stroke();
  }
  // taper bottom alpha
  var gr = g.createLinearGradient(0, 380, 0, 512); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = gr; g.fillRect(0, 380, 128, 132); g.globalCompositeOperation = 'source-over';
  return c;
}
function texNightSky() {
  var c = mkCanvas(1024, 512), g = c.getContext('2d'), rnd = makeRNG(61);
  var gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#02040a'); gr.addColorStop(0.55, '#0b1424'); gr.addColorStop(0.75, '#16243a'); gr.addColorStop(1, '#0a0f18');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (var i = 0; i < 500; i++) { g.fillStyle = 'rgba(220,230,255,' + rnd() * 0.8 + ')'; g.fillRect(rnd() * 1024, rnd() * 300, rnd() < 0.1 ? 2 : 1, 1); }
  // clouds
  for (var k = 0; k < 40; k++) { g.fillStyle = 'rgba(40,55,80,' + rnd() * 0.16 + ')'; g.beginPath(); g.ellipse(rnd() * 1024, 180 + rnd() * 160, 60 + rnd() * 160, 8 + rnd() * 24, 0, 0, TAU); g.fill(); }
  // moon
  var mx = 300, my = 120; var mg = g.createRadialGradient(mx, my, 10, mx, my, 120); mg.addColorStop(0, 'rgba(210,225,255,0.5)'); mg.addColorStop(1, 'rgba(210,225,255,0)'); g.fillStyle = mg; g.fillRect(mx - 120, my - 120, 240, 240);
  g.fillStyle = '#e6ecf4'; g.beginPath(); g.arc(mx, my, 26, 0, TAU); g.fill(); g.fillStyle = 'rgba(150,160,180,0.4)'; g.beginPath(); g.arc(mx - 8, my - 5, 7, 0, TAU); g.arc(mx + 9, my + 8, 5, 0, TAU); g.fill();
  // pine tree line silhouette
  g.fillStyle = '#020305';
  for (var x = 0; x < 1024; x += 6) { var h = 30 + fbm(x * 0.01, 0, 3) * 90 + rnd() * 20; g.beginPath(); g.moveTo(x - 12, 512); g.lineTo(x, 512 - h - 160); g.lineTo(x + 12, 512); g.fill(); }
  g.fillRect(0, 380, 1024, 132);
  return c;
}
function texDaySky() {
  var c = mkCanvas(512, 512), g = c.getContext('2d'), rnd = makeRNG(67);
  var gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2f8cff'); gr.addColorStop(0.6, '#8cd3ff'); gr.addColorStop(1, '#fff3c4');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (var k = 0; k < 14; k++) { var x = rnd() * 512, y = 60 + rnd() * 240; g.fillStyle = 'rgba(255,255,255,0.9)'; for (var b = 0; b < 5; b++) { g.beginPath(); g.arc(x + b * 18, y + Math.sin(b) * 6, 16 + rnd() * 14, 0, TAU); g.fill(); } }
  return c;
}
function texGlow(col, size) { // radial sprite
  var c = mkCanvas(size || 128, size || 128), g = c.getContext('2d'), s = size || 128;
  var gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, s, s); return c;
}
function texShaft() { // light shaft gradient
  var c = mkCanvas(64, 256), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  var gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.25, 'rgba(0,0,0,0)'); gx.addColorStop(0.75, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
  return c;
}
function texSign(text, bg, fg, w, h, font) {
  var c = mkCanvas(w || 256, h || 64), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = fg; g.font = font || ('bold ' + (c.height * 0.62 | 0) + 'px "Bungee", Impact, sans-serif'); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, c.width / 2, c.height / 2 + 2);
  return c;
}
