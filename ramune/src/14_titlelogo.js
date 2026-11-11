// ---- pixel-art title logo (title screen only) -------------------------------------------
// Text is drawn big in a heavy font, shrunk onto a pixel grid and thresholded, then animated
// with pixel capsules, drips, sparkles and a little glitch.
var TLOGO = { masks: null, cv: null, timer: null, t: 0, W: 168, H: 104 };

function tlMask(str, hpx, thr) {
  var Z = 8, fs = Math.round(hpx * Z * 1.16);
  var big = document.createElement('canvas'); big.width = 180 * Z; big.height = (hpx + 6) * Z;
  var g = big.getContext('2d'); g.font = '900 ' + fs + 'px "Zen Maru Gothic"'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.fillText(str, 2 * Z, big.height / 2);
  var sm = document.createElement('canvas'); sm.width = 180; sm.height = hpx + 6;
  var sg = sm.getContext('2d'); sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high'; sg.drawImage(big, 0, 0, sm.width, sm.height);
  var d = sg.getImageData(0, 0, sm.width, sm.height).data, m = [], minX = 999, maxX = 0, minY = 99, maxY = 0;
  for (var y = 0; y < sm.height; y++) for (var x = 0; x < sm.width; x++) if (d[(y * sm.width + x) * 4 + 3] > (thr || 100)) { m.push([x, y]); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  m.forEach(function (p) { p[0] -= minX; p[1] -= minY; });
  var set = {}; m.forEach(function (p) { set[p[0] + ',' + p[1]] = 1; });
  var bottoms = {}; m.forEach(function (p) { if (bottoms[p[0]] == null || p[1] > bottoms[p[0]]) bottoms[p[0]] = p[1]; });
  return { m: m, set: set, w: maxX - minX + 1, h: maxY - minY + 1, bottoms: bottoms };
}

function mountTitleLogo(host) {
  if (!host) return;
  var W = TLOGO.W, H = TLOGO.H;
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'rm-pxlogo';
  host.appendChild(cv); TLOGO.cv = cv;
  var draw = function () {
    if (!TLOGO.masks) {
      TLOGO.masks = { kiken: tlMask('キケンな', 15, 92), ramune: tlMask('ラムネ', 36, 100), sim: tlMask('シミュレーター', 12, 95) };
      // fixed random drip columns
      var r = 0.37; var rnd2 = function () { r = (r * 9301 + 49297) % 233280 / 233280; return r; };
      TLOGO.drK = Object.keys(TLOGO.masks.kiken.bottoms).filter(function () { return rnd2() < 0.3; }).map(function (x) { return [+x, 2 + Math.floor(rnd2() * 6), rnd2() * 6]; });
      TLOGO.drR = Object.keys(TLOGO.masks.ramune.bottoms).filter(function () { return rnd2() < 0.12; }).map(function (x) { return [+x, 1 + Math.floor(rnd2() * 4), rnd2() * 6]; });
    }
    renderTitleLogo();
  };
  var go = function () { draw(); clearInterval(TLOGO.timer); TLOGO.timer = setInterval(function () { if (!cv.isConnected) { clearInterval(TLOGO.timer); return; } TLOGO.t += 0.12; renderTitleLogo(); }, 120); };
  try { Promise.all([document.fonts.load('900 100px "Zen Maru Gothic"', 'キケンなラムネシミュレーター')]).then(function () { TLOGO.masks = null; go(); }, go); } catch (e) { go(); }
}

function renderTitleLogo() {
  var cv = TLOGO.cv; if (!cv || !TLOGO.masks) return;
  var g = cv.getContext('2d'), W = TLOGO.W, H = TLOGO.H, t = SAVE.settings.calm ? 0 : TLOGO.t, M = TLOGO.masks;
  g.clearRect(0, 0, W, H);
  function px(x, y, c) { if (x < 0 || y < 0 || x >= W || y >= H) return; g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); }
  function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w, h); }
  var K = '#06030b', RED = '#ff2d55', BLOOD = '#8a0f25', PINK = '#ff4fa3', PINK2 = '#ffa3cf', CYAN = '#4fe3ff', WHITE = '#f6f2ff', YEL = '#ffd23f';
  var glitch = !SAVE.settings.calm && (Math.sin(t * 7.3) > 0.93 || Math.sin(t * 3.1 + 1) > 0.97);

  // ---- pixel capsules & pills (behind the text) ----
  function capsule(cx, cy, ang, c1, c2, len, rad) {
    var ca = Math.cos(ang), sa = Math.sin(ang), L = len / 2;
    for (var y = -L - rad - 1; y <= L + rad + 1; y++) for (var x = -L - rad - 1; x <= L + rad + 1; x++) {
      var u = x * ca + y * sa, v = -x * sa + y * ca;
      var cu = Math.max(-L, Math.min(L, u)), dd = Math.hypot(u - cu, v);
      if (dd <= rad + 1) {
        var c = dd > rad ? K : (u < 0 ? c1[0] : c2[0]);
        if (dd <= rad && v < -rad * 0.35) c = u < 0 ? c1[1] : c2[1];
        if (dd <= rad && v > rad * 0.45) c = u < 0 ? c1[2] : c2[2];
        if (dd <= rad && Math.abs(u) < 0.6) c = K;
        px(Math.round(cx + x), Math.round(cy + y), c);
      }
    }
    // shine
    px(Math.round(cx - ca * L * 0.6 - sa * rad * 0.5), Math.round(cy - sa * L * 0.6 + ca * -rad * 0.5), '#ffffff');
  }
  var b1 = Math.sin(t * 1.3) * 2, b2 = Math.sin(t * 1.1 + 2) * 2, b3 = Math.sin(t * 1.7 + 1) * 1.5;
  capsule(15, 40 + b1, -0.9 + Math.sin(t * 0.6) * 0.08, ['#e0123f', '#ff8aa6', '#8a0f25'], ['#f6f2ff', '#ffffff', '#b8b0c8'], 18, 6);
  capsule(153, 44 + b2, 0.85 + Math.sin(t * 0.7) * 0.08, ['#1679c9', '#8fe9ff', '#0c3f73'], ['#f2b705', '#fff59a', '#9a6f00'], 16, 5.5);
  capsule(150, 12 + b3, 0.3, ['#7a3cff', '#c9a6ff', '#3a1a7a'], ['#3fe08a', '#b6ffd6', '#14653a'], 10, 3.5);
  capsule(18, 9 - b3, -0.4, ['#ff4fa3', '#ffd1e8', '#8a1550'], ['#4fe3ff', '#d0fbff', '#12687a'], 10, 3.5);
  // round tablets
  function tablet(x, y, c, c2) { for (var yy = -3; yy <= 3; yy++) for (var xx = -3; xx <= 3; xx++) { var d2 = xx * xx + yy * yy; if (d2 <= 12) px(x + xx, y + yy, d2 > 8 ? K : (yy > 0 ? c2 : c)); } px(x - 1, y - 1, '#fff'); for (var k = -2; k <= 2; k++) px(x + k, y, c2); }
  tablet(34, 70 + b2 * 0.7, YEL, '#c98a00');
  tablet(136, 72 + b1 * 0.7, PINK, '#a3165c');
  tablet(6, 64 - b1 * 0.5, CYAN, '#1a8fb0');
  tablet(162, 66 - b2 * 0.5, '#b07cff', '#5a2aa8');
  // sparkles
  [[30, 22, 0], [140, 28, 1.3], [46, 6, 2.1], [124, 6, 0.7], [160, 88, 1.7], [8, 88, 2.6]].forEach(function (s) {
    var on = SAVE.settings.calm ? 1 : (Math.sin(t * 3 + s[2] * 3) + 1) / 2;
    if (on > 0.35) { px(s[0], s[1], '#fff'); if (on > 0.7) { px(s[0] - 1, s[1], YEL); px(s[0] + 1, s[1], YEL); px(s[0], s[1] - 1, YEL); px(s[0], s[1] + 1, YEL); } }
  });

  // ---- text helpers ----
  function blit(mask, left, top, color, outline, glitchOn) {
    if (outline) mask.m.forEach(function (p) { for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) if (!mask.set[(p[0] + ox) + ',' + (p[1] + oy)]) px(left + p[0] + ox, top + p[1] + oy, outline); });
    if (glitchOn) { mask.m.forEach(function (p) { px(left + p[0] - 1, top + p[1], CYAN); }); mask.m.forEach(function (p) { px(left + p[0] + 1, top + p[1], PINK); }); }
    mask.m.forEach(function (p) { px(left + p[0], top + p[1], typeof color === 'function' ? color(p[0], p[1] / mask.h) : color); });
  }
  // "キケンな" on a red tag
  var mk = M.kiken, kl = Math.round(W / 2 - mk.w / 2), kt = 4;
  rect(kl - 6, kt - 3, mk.w + 12, mk.h + 6, K); rect(kl - 5, kt - 2, mk.w + 10, mk.h + 4, '#2a0612');
  blit(mk, kl, kt, function (x, t2) { return t2 > 0.7 ? BLOOD : RED; }, K, false);
  TLOGO.drK.forEach(function (d) {
    var L = Math.max(1, Math.round(d[1] * (SAVE.settings.calm ? 1 : (0.6 + 0.4 * Math.sin(t * 0.8 + d[2]))))), bx = kl + d[0], by = kt + mk.bottoms[d[0]];
    for (var k = 1; k <= L; k++) px(bx, by + k, k === L ? RED : BLOOD);
  });
  // "ラムネ" big white with glitch + chromatic edges
  var mr = M.ramune, rl = Math.round(W / 2 - mr.w / 2) + (glitch ? 2 : 0), rt = 26;
  blit(mr, rl, rt, function (x, t2) { return t2 > 0.82 ? '#cfc6e6' : WHITE; }, K, true);
  if (glitch) { var sy = rt + Math.floor(Math.random() * mr.h); var row = g.getImageData(0, sy, W, 2); g.putImageData(row, 4, sy); }
  TLOGO.drR.forEach(function (d) {
    var L = Math.max(1, Math.round(d[1] * (SAVE.settings.calm ? 1 : (0.5 + 0.5 * Math.sin(t * 0.9 + d[2]))))), bx = rl + d[0], by = rt + mr.bottoms[d[0]];
    for (var k = 1; k <= L; k++) px(bx, by + k, k === L ? PINK : PINK2);
  });
  // "シミュレーター" inside a big red/white capsule
  var ms = M.sim, cw = ms.w + 22, ch = ms.h + 8, cx0 = Math.round(W / 2 - cw / 2), cy0 = 78;
  for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) {
    var r = ch / 2, ex = x < r ? r - x : x > cw - r ? x - (cw - r) : 0, ey = y - r + 0.5, inside = ex * ex + ey * ey <= r * r;
    if (!inside) continue;
    var edge = (ex + 1) * (ex + 1) + (Math.abs(ey) + 1) * (Math.abs(ey) + 1) > r * r || y === 0 || y === ch - 1;
    var left = x < cw / 2, c = edge ? K : left ? (y < 3 ? '#ff8aa6' : y > ch - 4 ? BLOOD : '#e0123f') : (y < 3 ? '#ffffff' : y > ch - 4 ? '#b8b0c8' : WHITE);
    if (!edge && Math.abs(x - cw / 2) < 0.6) c = K;
    px(cx0 + x, cy0 + y, c);
  }
  rect(cx0 + 6, cy0 + 2, cw - 12, 1, 'rgba(255,255,255,.6)');
  blit(ms, Math.round(W / 2 - ms.w / 2), cy0 + 4, function (x) { return (Math.round(W / 2 - ms.w / 2) + x) < W / 2 ? WHITE : '#e0123f'; }, null, false);
}
