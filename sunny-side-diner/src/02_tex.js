// ---- procedural PBR textures (albedo + normal + roughness), all canvas -----
var MAX_ANISO = 1;
var TEXQ = 1024; // base texture size, set by quality
function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function ctx2(c) { return c.getContext('2d', { willReadFrequently: true }); }
function toTex(c, opt) {
  opt = opt || {};
  var t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = opt.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.anisotropy = opt.aniso || Math.min(8, MAX_ANISO);
  if (opt.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  t.encoding = opt.linear ? THREE.LinearEncoding : THREE.sRGBEncoding;
  if (opt.repeat) t.repeat.set(opt.repeat[0], opt.repeat[1]);
  return t;
}
function rgba(r, g, b, a) { return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + (a == null ? 1 : a) + ')'; }
function grey(v, a) { v = clamp(v, 0, 255) | 0; return 'rgba(' + v + ',' + v + ',' + v + ',' + (a == null ? 1 : a) + ')'; }

// A texture set: albedo (sRGB), height (-> normal), rough (grey: 0 = mirror, 255 = matte)
function TexSet(w, h, seed) {
  this.w = w; this.h = h; this.rnd = makeRNG(seed || 1);
  this.A = mkCanvas(w, h); this.H = mkCanvas(w, h); this.Rg = mkCanvas(w, h);
  this.a = ctx2(this.A); this.hg = ctx2(this.H); this.r = ctx2(this.Rg);
  this.hg.fillStyle = grey(128); this.hg.fillRect(0, 0, w, h);
}
TexSet.prototype.noisePass = function (canvasKey, amt, scale, oct, seed) {
  var c = this[canvasKey], g = ctx2(c), w = c.width, h = c.height, id = g.getImageData(0, 0, w, h), d = id.data;
  var s = seed || 3, sc = scale || 0;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var n = sc ? (fbm((x + s * 17) / sc, (y + s * 31) / sc, oct || 3) - 0.5) * 2 : (hash2(x + s * 131, y + s * 71) - 0.5);
    var i = (y * w + x) * 4; var v = n * amt;
    d[i] += v; d[i + 1] += v; d[i + 2] += v;
  }
  g.putImageData(id, 0, 0);
};
TexSet.prototype.build = function (opt) {
  opt = opt || {};
  var res = {};
  res.map = toTex(this.A, { repeat: opt.repeat });
  res.normalMap = toTex(heightToNormal(this.H, opt.nstr || 2.0, opt.wrap !== false), { linear: true, repeat: opt.repeat });
  res.roughnessMap = toTex(this.Rg, { linear: true, repeat: opt.repeat });
  return res;
};
function heightToNormal(hc, strength, wrap) {
  var w = hc.width, h = hc.height, src = ctx2(hc).getImageData(0, 0, w, h).data;
  var out = mkCanvas(w, h), og = ctx2(out), id = og.createImageData(w, h), d = id.data;
  function H(x, y) { if (wrap) { x = (x + w) % w; y = (y + h) % h; } else { x = clamp(x, 0, w - 1); y = clamp(y, 0, h - 1); } return src[(y * w + x) * 4] / 255; }
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength;
    var nx = -dx, ny = dy, nz = 1, l = Math.sqrt(nx * nx + ny * ny + nz * nz);
    var i = (y * w + x) * 4;
    d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255; d[i + 2] = (nz / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  og.putImageData(id, 0, 0);
  return out;
}
function blurCanvas(c, px) { var o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.filter = 'blur(' + px + 'px)'; g.drawImage(c, 0, 0); if (g.filter === 'none' || g.filter === '') return c; return o; }
function ring(g, x, y, r, col, a, wdt) { // coffee ring
  g.save(); g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = wdt || r * 0.08;
  g.beginPath(); g.ellipse(x, y, r, r * (0.92 + Math.random() * 0.1), Math.random() * 3, 0.2 + Math.random(), TAU - Math.random() * 0.8); g.stroke();
  g.globalAlpha = a * 0.25; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
}
function smudge(g, x, y, r, col, a) {
  var gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, col.replace('A', a)); gr.addColorStop(1, col.replace('A', 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
function scratches(g, w, h, n, rnd, col, len, horiz) {
  g.save(); g.strokeStyle = col;
  for (var i = 0; i < n; i++) {
    g.globalAlpha = 0.15 + rnd() * 0.5; g.lineWidth = 0.4 + rnd() * 1.1;
    var x = rnd() * w, y = rnd() * h, a = horiz ? (rnd() - 0.5) * 0.15 : rnd() * TAU, l = (len || 30) * (0.3 + rnd());
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.restore();
}
function fingerprints(g, w, h, n, rnd, col) {
  g.save();
  for (var i = 0; i < n; i++) {
    var x = rnd() * w, y = rnd() * h, s = 6 + rnd() * 10;
    g.strokeStyle = col; g.globalAlpha = 0.12 + rnd() * 0.12; g.lineWidth = 0.8;
    for (var k = 0; k < 7; k++) { g.beginPath(); g.ellipse(x, y, s * (k + 1) / 7, s * 1.3 * (k + 1) / 7, rnd(), 0, TAU); g.stroke(); }
  }
  g.restore();
}

// ---------------------------------------------------------------------------
var TEX = {};
// checker floor : 1 texture = 1.2m (4x4 tiles of 30cm). black & cream VCT, worn, waxed.
function texFloor() {
  var S = TEXQ, T = new TexSet(S, S, 11), a = T.a, hg = T.hg, r = T.r, rnd = T.rnd, t = S / 4;
  for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) {
    var dark = (x + y) & 1, v = (rnd() - 0.5) * 10;
    a.fillStyle = dark ? rgba(22 + v, 22 + v, 24 + v) : rgba(226 + v, 219 + v, 200 + v);
    a.fillRect(x * t, y * t, t, t);
    // vinyl chips (marble look of VCT)
    for (var i = 0; i < 260; i++) {
      var cx = x * t + rnd() * t, cy = y * t + rnd() * t;
      a.fillStyle = dark ? rgba(70, 68, 66, rnd() * 0.25) : rgba(150, 140, 120, rnd() * 0.18);
      a.beginPath(); a.ellipse(cx, cy, 1 + rnd() * t * 0.03, 0.6 + rnd() * t * 0.012, rnd() * 3, 0, TAU); a.fill();
    }
    r.fillStyle = grey(70 + rnd() * 40); r.fillRect(x * t, y * t, t, t);
    // slightly uneven tiles
    hg.fillStyle = grey(128 + (rnd() - 0.5) * 16); hg.fillRect(x * t + 2, y * t + 2, t - 4, t - 4);
  }
  // grout lines (dirty, rough, recessed)
  for (var k = 0; k <= 4; k++) {
    a.fillStyle = 'rgba(40,34,26,0.7)'; a.fillRect(k * t - 1.5, 0, 3, S); a.fillRect(0, k * t - 1.5, S, 3);
    hg.fillStyle = grey(40); hg.fillRect(k * t - 2, 0, 4, S); hg.fillRect(0, k * t - 2, S, 4);
    r.fillStyle = grey(230); r.fillRect(k * t - 2, 0, 4, S); r.fillRect(0, k * t - 2, S, 4);
  }
  // dirt along grout
  a.save(); a.globalCompositeOperation = 'multiply';
  for (var k2 = 0; k2 <= 4; k2++) {
    var gr = a.createLinearGradient(k2 * t - 10, 0, k2 * t + 10, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(180,165,140,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    a.fillStyle = gr; a.fillRect(k2 * t - 10, 0, 20, S);
    var gr2 = a.createLinearGradient(0, k2 * t - 10, 0, k2 * t + 10); gr2.addColorStop(0, 'rgba(255,255,255,0)'); gr2.addColorStop(0.5, 'rgba(180,165,140,0.5)'); gr2.addColorStop(1, 'rgba(255,255,255,0)');
    a.fillStyle = gr2; a.fillRect(0, k2 * t - 10, S, 20);
  }
  a.restore();
  // scuffs (black heel marks on light, light scratches on dark)
  scratches(a, S, S, 90, rnd, 'rgba(15,12,10,1)', S * 0.05);
  scratches(r, S, S, 160, rnd, grey(200), S * 0.06);
  // wax swirls -> roughness variation (mop strokes)
  r.save(); r.globalAlpha = 0.25;
  for (var m = 0; m < 30; m++) { r.strokeStyle = grey(rnd() < 0.5 ? 30 : 140); r.lineWidth = S * 0.02 + rnd() * S * 0.04; r.beginPath(); var mx = rnd() * S, my = rnd() * S; r.arc(mx, my, S * 0.1 + rnd() * S * 0.2, rnd() * 6, rnd() * 6 + 2); r.stroke(); }
  r.restore();
  T.noisePass('Rg', 30, S / 6, 3, 5);
  T.noisePass('A', 7, 0, 0, 2);
  T.noisePass('H', 6, 0, 0, 9);
  return T.build({ nstr: 3 });
}
// red tufted vinyl (booths & stools). 1 texture = 0.6m
function texVinyl(base, seed, patched) {
  var S = TEXQ >> 1, T = new TexSet(S, S, seed || 21), a = T.a, hg = T.hg, r = T.r, rnd = T.rnd;
  var b = base || [150, 22, 28];
  a.fillStyle = rgba(b[0], b[1], b[2]); a.fillRect(0, 0, S, S);
  r.fillStyle = grey(95); r.fillRect(0, 0, S, S);
  // vertical channels (pleats) with piping seams
  var n = 4, cw = S / n;
  for (var i = 0; i < n; i++) {
    var x0 = i * cw;
    var g1 = hg.createLinearGradient(x0, 0, x0 + cw, 0);
    g1.addColorStop(0, grey(70)); g1.addColorStop(0.18, grey(150)); g1.addColorStop(0.5, grey(185)); g1.addColorStop(0.82, grey(150)); g1.addColorStop(1, grey(70));
    hg.fillStyle = g1; hg.fillRect(x0, 0, cw, S);
    var ga = a.createLinearGradient(x0, 0, x0 + cw, 0);
    ga.addColorStop(0, 'rgba(0,0,0,0.35)'); ga.addColorStop(0.25, 'rgba(0,0,0,0)'); ga.addColorStop(0.55, 'rgba(255,220,220,0.07)'); ga.addColorStop(0.85, 'rgba(0,0,0,0)'); ga.addColorStop(1, 'rgba(0,0,0,0.35)');
    a.fillStyle = ga; a.fillRect(x0, 0, cw, S);
    // stitching
    a.fillStyle = 'rgba(230,200,190,0.55)';
    for (var y = 0; y < S; y += 7) { a.fillRect(x0 + 3, y, 1.2, 3.5); a.fillRect(x0 + cw - 4, y + 3, 1.2, 3.5); }
  }
  // wrinkles
  for (var k = 0; k < 40; k++) {
    var wx = rnd() * S, wy = rnd() * S, l = 10 + rnd() * 40, ang = (rnd() - 0.5) * 1.2 + (rnd() < 0.5 ? 0 : PI / 2);
    hg.strokeStyle = grey(rnd() < 0.5 ? 100 : 160, 0.5); hg.lineWidth = 1 + rnd() * 2.5;
    hg.beginPath(); hg.moveTo(wx, wy); hg.quadraticCurveTo(wx + Math.cos(ang) * l * 0.5 + rnd() * 6, wy + Math.sin(ang) * l * 0.5, wx + Math.cos(ang) * l, wy + Math.sin(ang) * l); hg.stroke();
  }
  // worn patches (pinkish, matte) and cracks
  for (var p = 0; p < 6; p++) {
    var px = rnd() * S, py = rnd() * S, pr = 8 + rnd() * 30;
    smudge(a, px, py, pr, 'rgba(225,150,140,A)', 0.22); smudge(r, px, py, pr, 'rgba(210,210,210,A)', 0.5);
  }
  for (var c = 0; c < 8; c++) {
    var cx = rnd() * S, cy = rnd() * S; a.strokeStyle = 'rgba(40,5,5,0.7)'; a.lineWidth = 0.8; hg.strokeStyle = grey(40); hg.lineWidth = 1;
    a.beginPath(); hg.beginPath(); a.moveTo(cx, cy); hg.moveTo(cx, cy);
    for (var s = 0; s < 5; s++) { cx += (rnd() - 0.5) * 14; cy += (rnd() - 0.5) * 14; a.lineTo(cx, cy); hg.lineTo(cx, cy); }
    a.stroke(); hg.stroke();
  }
  if (patched) { // duct tape repair
    var tx = S * (0.25 + rnd() * 0.4), ty = S * (0.2 + rnd() * 0.5), tw = S * 0.28, th = S * 0.09;
    a.save(); a.translate(tx, ty); a.rotate((rnd() - 0.5) * 0.5);
    a.fillStyle = '#9a9c9e'; a.fillRect(-tw / 2, -th / 2, tw, th);
    a.fillStyle = 'rgba(255,255,255,0.18)'; for (var q = 0; q < 30; q++) a.fillRect(-tw / 2 + rnd() * tw, -th / 2, 1, th);
    a.fillStyle = 'rgba(0,0,0,0.25)'; a.fillRect(-tw / 2, th / 2 - 2, tw, 2);
    a.restore();
    r.save(); r.translate(tx, ty); r.fillStyle = grey(150); r.fillRect(-tw / 2, -th / 2, tw, th); r.restore();
    hg.save(); hg.translate(tx, ty); hg.fillStyle = grey(175); hg.fillRect(-tw / 2, -th / 2, tw, th); hg.restore();
  }
  T.noisePass('A', 6, 0, 0, seed);
  T.noisePass('H', 10, 0, 0, seed + 1); // pebbled vinyl grain
  T.noisePass('Rg', 25, S / 5, 2, seed);
  return T.build({ nstr: 2.4 });
}
// chrome : brushed scratches + fingerprint haze (roughness drives everything)
function texChrome() {
  var S = TEXQ >> 1, T = new TexSet(S, S, 31), a = T.a, r = T.r, rnd = T.rnd;
  a.fillStyle = '#f4f6f8'; a.fillRect(0, 0, S, S);
  r.fillStyle = grey(28); r.fillRect(0, 0, S, S);
  scratches(r, S, S, 500, rnd, grey(90), S * 0.12, true);
  scratches(r, S, S, 120, rnd, grey(120), S * 0.05);
  fingerprints(r, S, S, 14, rnd, grey(170));
  for (var i = 0; i < 10; i++) smudge(r, rnd() * S, rnd() * S, 20 + rnd() * 50, 'rgba(110,110,110,A)', 0.4);
  for (var j = 0; j < 8; j++) smudge(a, rnd() * S, rnd() * S, 10 + rnd() * 40, 'rgba(200,190,170,A)', 0.3);
  T.noisePass('Rg', 14, S / 10, 3, 4);
  T.noisePass('H', 5, 0, 0, 3);
  return T.build({ nstr: 0.6 });
}
// formica counter top : mint with boomerang pattern + coffee rings. 1 tex = 1m
function texFormica(bg, seed) {
  var S = TEXQ, T = new TexSet(S, S, seed || 41), a = T.a, r = T.r, rnd = T.rnd;
  a.fillStyle = bg || '#cfe8dd'; a.fillRect(0, 0, S, S);
  // speckle
  for (var i = 0; i < 1400; i++) { a.fillStyle = rnd() < 0.5 ? 'rgba(60,90,80,0.25)' : 'rgba(255,255,255,0.4)'; a.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2); }
  // boomerangs
  var cols = ['rgba(200,40,46,0.55)', 'rgba(40,40,46,0.45)', 'rgba(230,180,60,0.5)', 'rgba(255,255,255,0.65)'];
  for (var k = 0; k < 120; k++) {
    var x = rnd() * S, y = rnd() * S, s = S * (0.014 + rnd() * 0.016), ang = rnd() * TAU;
    a.save(); a.translate(x, y); a.rotate(ang); a.strokeStyle = cols[k % 4]; a.lineWidth = s * 0.28; a.lineCap = 'round';
    a.beginPath(); a.moveTo(-s, s * 0.4); a.quadraticCurveTo(0, -s * 0.6, s, s * 0.4); a.stroke(); a.restore();
    // wrap copies
    if (x < s * 2 || y < s * 2) { a.save(); a.translate(x + (x < s * 2 ? S : 0), y + (y < s * 2 ? S : 0)); a.rotate(ang); a.strokeStyle = cols[k % 4]; a.lineWidth = s * 0.28; a.lineCap = 'round'; a.beginPath(); a.moveTo(-s, s * 0.4); a.quadraticCurveTo(0, -s * 0.6, s, s * 0.4); a.stroke(); a.restore(); }
  }
  for (var st = 0; st < 60; st++) { a.fillStyle = cols[st % 3]; a.beginPath(); a.arc(rnd() * S, rnd() * S, S * 0.004, 0, TAU); a.fill(); }
  r.fillStyle = grey(92); r.fillRect(0, 0, S, S);
  // wear in front (lighter, rougher)
  for (var c = 0; c < 7; c++) { var rx = rnd() * S, ry = rnd() * S, rr = S * (0.035 + rnd() * 0.02); ring(a, rx, ry, rr, 'rgb(120,80,40)', 0.25 + rnd() * 0.2); ring(r, rx, ry, rr, grey(140), 0.6); }
  scratches(a, S, S, 80, rnd, 'rgba(255,255,255,1)', S * 0.04);
  scratches(r, S, S, 200, rnd, grey(150), S * 0.05);
  T.noisePass('Rg', 20, S / 8, 3, 8);
  return T.build({ nstr: 0.8 });
}
// wall tiles 15cm, mint glaze (1 tex = 0.6m, 4x4)
function texTiles(col, seed, dirty) {
  var S = TEXQ >> 1, T = new TexSet(S, S, seed || 51), a = T.a, hg = T.hg, r = T.r, rnd = T.rnd, n = 4, t = S / n;
  var c = col || [143, 211, 193];
  a.fillStyle = 'rgb(190,185,170)'; a.fillRect(0, 0, S, S); hg.fillStyle = grey(40); hg.fillRect(0, 0, S, S); r.fillStyle = grey(220); r.fillRect(0, 0, S, S);
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
    var v = (rnd() - 0.5) * 16, g0 = 2;
    a.fillStyle = rgba(c[0] + v, c[1] + v, c[2] + v); a.fillRect(x * t + g0, y * t + g0, t - g0 * 2, t - g0 * 2);
    var gg = a.createLinearGradient(x * t, y * t, x * t + t, y * t + t); gg.addColorStop(0, 'rgba(255,255,255,0.18)'); gg.addColorStop(0.5, 'rgba(255,255,255,0)'); gg.addColorStop(1, 'rgba(0,0,0,0.12)');
    a.fillStyle = gg; a.fillRect(x * t + g0, y * t + g0, t - g0 * 2, t - g0 * 2);
    // pillowed edges
    var hgr = hg.createRadialGradient(x * t + t / 2, y * t + t / 2, t * 0.2, x * t + t / 2, y * t + t / 2, t * 0.72);
    hgr.addColorStop(0, grey(200)); hgr.addColorStop(0.7, grey(185)); hgr.addColorStop(1, grey(120));
    hg.fillStyle = hgr; hg.fillRect(x * t + g0, y * t + g0, t - g0 * 2, t - g0 * 2);
    r.fillStyle = grey(25 + rnd() * 25); r.fillRect(x * t + g0, y * t + g0, t - g0 * 2, t - g0 * 2);
    if (rnd() < 0.12) { a.strokeStyle = 'rgba(60,60,50,0.6)'; a.lineWidth = 0.8; a.beginPath(); var cx = x * t + rnd() * t, cy = y * t + rnd() * t; a.moveTo(cx, cy); for (var q = 0; q < 4; q++) { cx += (rnd() - 0.5) * t * 0.5; cy += (rnd() - 0.5) * t * 0.5; a.lineTo(cx, cy); } a.stroke(); }
  }
  if (dirty) { var gd = a.createLinearGradient(0, 0, 0, S); gd.addColorStop(0, 'rgba(90,70,40,0)'); gd.addColorStop(1, 'rgba(90,70,40,0.25)'); a.fillStyle = gd; a.fillRect(0, 0, S, S); }
  T.noisePass('A', 5, 0, 0, seed);
  return T.build({ nstr: 2.2 });
}
// painted plaster (cream). 1 tex = 2m
function texPlaster(col, seed) {
  var S = TEXQ >> 1, T = new TexSet(S, S, seed || 61), a = T.a, r = T.r;
  a.fillStyle = col || '#efe0bf'; a.fillRect(0, 0, S, S);
  r.fillStyle = grey(200); r.fillRect(0, 0, S, S);
  T.noisePass('A', 12, S / 4, 4, seed);
  T.noisePass('A', 5, 0, 0, seed + 3);
  T.noisePass('H', 24, S / 30, 3, seed);
  T.noisePass('Rg', 25, S / 8, 2, seed);
  return T.build({ nstr: 1.2 });
}
// brushed stainless (kitchen) with grease. 1 tex = 1m
function texSteel(seed, greasy) {
  var S = TEXQ >> 1, T = new TexSet(S, S, seed || 71), a = T.a, r = T.r, rnd = T.rnd;
  a.fillStyle = '#d9dcdf'; a.fillRect(0, 0, S, S);
  r.fillStyle = grey(85); r.fillRect(0, 0, S, S);
  for (var y = 0; y < S; y++) { r.fillStyle = grey(70 + rnd() * 50, 0.5); r.fillRect(0, y, S, 1); a.fillStyle = grey(200 + rnd() * 40, 0.3); a.fillRect(0, y, S, 1); }
  for (var i = 0; i < (greasy ? 16 : 8); i++) { var x = rnd() * S, yy = rnd() * S, rr = 25 + rnd() * 70; smudge(a, x, yy, rr, 'rgba(120,105,80,A)', greasy ? 0.12 : 0.06); smudge(r, x, yy, rr, 'rgba(150,150,150,A)', 0.45); }
  if (greasy) { var gd = a.createLinearGradient(0, 0, 0, S); gd.addColorStop(0, 'rgba(80,65,40,0.16)'); gd.addColorStop(1, 'rgba(80,65,40,0)'); a.fillStyle = gd; a.fillRect(0, 0, S, S); }
  fingerprints(r, S, S, 10, rnd, grey(170));
  scratches(r, S, S, 200, rnd, grey(150), S * 0.1);
  return T.build({ nstr: 0.4 });
}
// griddle: dark seasoned steel with burnt rings
function texGriddle() {
  var S = TEXQ >> 1, T = new TexSet(S, S, 81), a = T.a, r = T.r, rnd = T.rnd;
  a.fillStyle = '#625d57'; a.fillRect(0, 0, S, S); r.fillStyle = grey(120); r.fillRect(0, 0, S, S);
  // seasoning: irregular dark patina + scraper streaks, brighter worn centre
  for (var i = 0; i < 70; i++) { var x = rnd() * S, y = rnd() * S, rr = 6 + rnd() * 26; smudge(a, x, y, rr, 'rgba(18,12,8,A)', 0.18 + rnd() * 0.2); }
  for (var j = 0; j < 9; j++) { var x2 = rnd() * S, y2 = rnd() * S; ring(a, x2, y2, 14 + rnd() * 22, 'rgb(70,45,25)', 0.18, 2); }
  var wc = a.createRadialGradient(S * 0.5, S * 0.5, S * 0.1, S * 0.5, S * 0.5, S * 0.6); wc.addColorStop(0, 'rgba(160,150,140,0.18)'); wc.addColorStop(1, 'rgba(0,0,0,0.25)'); a.fillStyle = wc; a.fillRect(0, 0, S, S);
  for (var o2 = 0; o2 < 12; o2++) smudge(r, rnd() * S, rnd() * S, 30 + rnd() * 60, 'rgba(30,30,30,A)', 0.5); // oil sheen
  scratches(a, S, S, 300, rnd, 'rgba(120,110,100,1)', S * 0.1, true);
  scratches(r, S, S, 300, rnd, grey(60), S * 0.1, true);
  T.noisePass('A', 10, S / 12, 3, 3);
  T.noisePass('H', 14, S / 40, 2, 2);
  return T.build({ nstr: 1 });
}
// ceiling acoustic tile 60cm with water stains
function texCeiling() {
  var S = TEXQ >> 1, T = new TexSet(S, S, 91), a = T.a, hg = T.hg, r = T.r, rnd = T.rnd;
  a.fillStyle = '#e4dccb'; a.fillRect(0, 0, S, S); r.fillStyle = grey(235); r.fillRect(0, 0, S, S);
  for (var i = 0; i < 900; i++) { var x = rnd() * S, y = rnd() * S; hg.fillStyle = grey(95); hg.beginPath(); hg.arc(x, y, 1.5 + rnd() * 2, 0, TAU); hg.fill(); a.fillStyle = 'rgba(120,110,90,0.25)'; a.fillRect(x, y, 1.5, 1.5); }
  a.fillStyle = '#b9b2a2'; a.fillRect(0, 0, S, 5); a.fillRect(0, 0, 5, S); hg.fillStyle = grey(30); hg.fillRect(0, 0, S, 5); hg.fillRect(0, 0, 5, S);
  T.noisePass('A', 8, S / 6, 3, 4);
  return T.build({ nstr: 1.5 });
}
// wet asphalt (parking lot) 1 tex = 6m
function texAsphalt() {
  var S = TEXQ >> 1, T = new TexSet(S, S, 101), a = T.a, r = T.r, hg = T.hg, rnd = T.rnd;
  a.fillStyle = '#38383c'; a.fillRect(0, 0, S, S); r.fillStyle = grey(95); r.fillRect(0, 0, S, S);
  for (var i = 0; i < 9000; i++) { var v = rnd() * 70; a.fillStyle = rgba(30 + v, 30 + v, 32 + v, 0.5); a.fillRect(rnd() * S, rnd() * S, 1.5, 1.5); }
  for (var p = 0; p < 9; p++) { // puddles (mirror)
    var px = rnd() * S, py = rnd() * S, pr = 20 + rnd() * 70;
    var g = r.createRadialGradient(px, py, pr * 0.3, px, py, pr); g.addColorStop(0, grey(8)); g.addColorStop(1, grey(150, 0)); r.fillStyle = g; r.beginPath(); r.ellipse(px, py, pr * 1.6, pr, rnd(), 0, TAU); r.fill();
    var g2 = a.createRadialGradient(px, py, 0, px, py, pr); g2.addColorStop(0, 'rgba(5,5,8,0.6)'); g2.addColorStop(1, 'rgba(5,5,8,0)'); a.fillStyle = g2; a.beginPath(); a.ellipse(px, py, pr * 1.6, pr, 0, 0, TAU); a.fill();
  }
  // cracks with tar
  for (var c = 0; c < 6; c++) { var cx = rnd() * S, cy = rnd() * S; a.strokeStyle = 'rgba(8,8,8,0.8)'; a.lineWidth = 2; a.beginPath(); a.moveTo(cx, cy); for (var q = 0; q < 8; q++) { cx += (rnd() - 0.5) * 50; cy += (rnd() - 0.5) * 50; a.lineTo(cx, cy); } a.stroke(); }
  T.noisePass('H', 30, 0, 0, 5);
  T.noisePass('Rg', 40, S / 5, 3, 3);
  return T.build({ nstr: 2 });
}
function texSand() {
  var S = 256, T = new TexSet(S, S, 111), a = T.a, r = T.r;
  a.fillStyle = '#6d5a44'; a.fillRect(0, 0, S, S); r.fillStyle = grey(240); r.fillRect(0, 0, S, S);
  T.noisePass('A', 30, S / 4, 4, 2); T.noisePass('A', 12, 0, 0, 3); T.noisePass('H', 50, S / 10, 3, 4);
  return T.build({ nstr: 2 });
}
// red quarry tile (kitchen floor) 1 tex = 0.9m (3x3 of 30cm)
function texQuarry() {
  var S = TEXQ >> 1, T = new TexSet(S, S, 121), a = T.a, hg = T.hg, r = T.r, rnd = T.rnd, n = 3, t = S / n;
  a.fillStyle = '#5a4a3c'; a.fillRect(0, 0, S, S); hg.fillStyle = grey(50); hg.fillRect(0, 0, S, S); r.fillStyle = grey(230); r.fillRect(0, 0, S, S);
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
    var v = (rnd() - 0.5) * 20; a.fillStyle = rgba(142 + v, 74 + v * 0.5, 56 + v * 0.4); a.fillRect(x * t + 3, y * t + 3, t - 6, t - 6);
    hg.fillStyle = grey(170); hg.fillRect(x * t + 3, y * t + 3, t - 6, t - 6);
    r.fillStyle = grey(120 + rnd() * 50); r.fillRect(x * t + 3, y * t + 3, t - 6, t - 6);
  }
  for (var i = 0; i < 12; i++) smudge(a, rnd() * S, rnd() * S, 20 + rnd() * 60, 'rgba(40,25,10,A)', 0.3);
  for (var j = 0; j < 8; j++) smudge(r, rnd() * S, rnd() * S, 20 + rnd() * 60, 'rgba(40,40,40,A)', 0.6); // greasy shiny
  T.noisePass('A', 14, S / 8, 3, 6); T.noisePass('H', 12, 0, 0, 6);
  return T.build({ nstr: 2 });
}
// dark wood (jukebox cabinet, trims)
function texWood(col, seed) {
  var S = TEXQ >> 1, T = new TexSet(S, S, seed || 131), a = T.a, r = T.r, rnd = T.rnd, c = col || [92, 48, 26];
  var id = a.createImageData(S, S), d = id.data;
  for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
    var n = fbm(x / 140, y / 9, 4), ring2 = Math.sin((x / 18 + n * 6)) * 0.5 + 0.5, v = 0.75 + ring2 * 0.25 + (hash2(x, y) - 0.5) * 0.05;
    var i = (y * S + x) * 4; d[i] = c[0] * v; d[i + 1] = c[1] * v; d[i + 2] = c[2] * v; d[i + 3] = 255;
  }
  a.putImageData(id, 0, 0);
  r.fillStyle = grey(70); r.fillRect(0, 0, S, S);
  T.noisePass('Rg', 20, S / 6, 2, 1);
  return T.build({ nstr: 0.5 });
}
function texCardboard() {
  var S = 256, T = new TexSet(S, S, 141), a = T.a; a.fillStyle = '#a9865a'; a.fillRect(0, 0, S, S); T.r.fillStyle = grey(230); T.r.fillRect(0, 0, S, S);
  T.noisePass('A', 14, S / 8, 3, 2); return T.build();
}
// frost (freezer walls)
function texFrost() {
  var S = TEXQ >> 1, T = new TexSet(S, S, 151), a = T.a, r = T.r, rnd = T.rnd;
  a.fillStyle = '#c9d4da'; a.fillRect(0, 0, S, S); r.fillStyle = grey(140); r.fillRect(0, 0, S, S);
  for (var y = 0; y < S; y += S / 8) { a.fillStyle = 'rgba(120,130,140,0.5)'; a.fillRect(0, y, S, 3); T.hg.fillStyle = grey(200); T.hg.fillRect(0, y, S, 6); }
  for (var i = 0; i < 400; i++) { var x = rnd() * S, yy = rnd() * S; a.fillStyle = 'rgba(255,255,255,' + rnd() * 0.5 + ')'; a.beginPath(); a.arc(x, yy, rnd() * 4, 0, TAU); a.fill(); }
  T.noisePass('A', 16, S / 10, 3, 2); T.noisePass('H', 40, S / 20, 3, 2); T.noisePass('Rg', 60, S / 10, 3, 3);
  return T.build({ nstr: 1.5 });
}
function buildTextures() {
  TEX.floor = texFloor();
  TEX.vinylRed = texVinyl([152, 20, 28], 21, false);
  TEX.vinylRedP = texVinyl([146, 18, 26], 23, true);
  TEX.vinylCream = texVinyl([226, 214, 186], 25, false);
  TEX.chrome = texChrome();
  TEX.formica = texFormica('#b4d9c9', 41);
  TEX.formicaRed = texFormica('#e9e0cc', 43);
  TEX.tiles = texTiles([143, 211, 193], 51, true);
  TEX.tilesWhite = texTiles([226, 228, 222], 53, true);
  TEX.plaster = texPlaster('#efdfbc', 61);
  TEX.steel = texSteel(71, false);
  TEX.steelG = texSteel(73, true);
  TEX.griddle = texGriddle();
  TEX.ceiling = texCeiling();
  TEX.asphalt = texAsphalt();
  TEX.sand = texSand();
  TEX.quarry = texQuarry();
  TEX.wood = texWood([96, 50, 26], 131);
  TEX.woodLight = texWood([170, 120, 70], 133);
  TEX.frost = texFrost();
  TEX.card = texCardboard();
}
