/*! Sunny Side Diner — game.js (single-file build). See source.txt */
(function(){
"use strict";

// ===== 00_boot.js =====
// ===========================================================================
//  SUNNY SIDE DINER — settings for the author (edit only this block)
// ===========================================================================
// BASE_URL : where the assets live (must end with "/"). If game.js is loaded
// via <script src=".../game.js"> the folder of that script is used instead.
var BASE_URL = 'https://sunny-side-diner.netlify.app/';
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '1.0.0';

// LYRICS : karaoke lines for the TV commercial after the true ending.
// [seconds from the start of sunny_side_diner.m4a, English, Japanese]
// Change only the numbers to re-time. (Estimated from the song's loudness.)
var LYRICS = [
  [0.77, 'Out on the highway, under the moon', 'ハイウェイの向こう 月の下'],
  [3.35, "There's a little light that's calling you", '小さな明かりが きみを呼んでる'],
  [6.45, "Coffee's hot and the griddle's warm", 'コーヒーは熱々 鉄板もあったか'],
  [9.34, 'Come on in from the desert storm', '砂漠の嵐から 中へどうぞ'],
  [12.25, 'Rise and shine! Rise and shine!', 'おはよう！ おはよう！'],
  [17.20, 'Sunny Side Diner, open all the time', 'サニーサイド・ダイナー いつでも開いてる'],
  [20.24, 'Pancakes stacked and a smile so wide', '山盛りパンケーキと とびきりの笑顔'],
  [23.25, 'Come on in to the Sunny Side!', 'さあ サニーサイドへ！'],
  [25.69, 'Open 24 hours...', '24時間営業……'],
  [29.00, "we'll keep the light on for you", '明かりをつけて 待ってるよ']
];
// (taken from the song's own lyric track; the last line is split where the voice starts again)
// the moment the TV cuts to tonight's diner (the last line above)
var LYRIC_LAST_CUT = 29.0;

// FACE_KIND : what each images/face_NN.jpg shows (see source.txt chapter 8).
// kinds: human / plush / costume / doll / clown / bride / animal / crawler / shadow / mouth / flesh / glitch
var FACE_KIND = {
  1: 'human', 2: 'clown', 3: 'crawler', 4: 'plush', 5: 'human', 6: 'animal', 7: 'bride', 8: 'crawler', 9: 'child', 10: 'mouth',
  11: 'doll', 12: 'human', 13: 'shadow', 14: 'animal', 15: 'glitch', 16: 'mouth', 17: 'human', 18: 'costume', 19: 'crawler', 20: 'mouth',
  21: 'human', 22: 'human', 23: 'human', 24: 'human', 25: 'costume', 26: 'doll', 27: 'shadow', 28: 'human', 29: 'crawler', 30: 'human',
  31: 'clown', 32: 'flesh', 33: 'mouth', 34: 'human', 35: 'plush', 36: 'human', 37: 'glitch', 38: 'human', 39: 'crawler', 40: 'shadow',
  41: 'human', 42: 'crawler', 43: 'human', 44: 'flesh', 45: 'plush', 46: 'human', 47: 'clown', 48: 'human', 49: 'animal', 50: 'mouth',
  51: 'flesh', 52: 'crawler', 53: 'human', 54: 'doll', 55: 'shadow', 56: 'animal', 57: 'shadow', 58: 'mouth', 59: 'child', 60: 'crawler'
};

// ===========================================================================
var ASSET_BASE = BASE_URL;
(function detectBase() {
  try {
    var cs = document.currentScript, src = cs && cs.src;
    if (!src) {
      var ss = document.getElementsByTagName('script');
      for (var i = ss.length - 1; i >= 0; i--) { if (/\/game\.js(\?|#|$)/.test(ss[i].src || '')) { src = ss[i].src; break; } }
    }
    if (src && /^https?:/.test(src) && /\/game\.js(\?|#|$)/.test(src)) ASSET_BASE = src.replace(/game\.js([?#].*)?$/, '');
  } catch (e) {}
  if (ASSET_BASE.charAt(ASSET_BASE.length - 1) !== '/') ASSET_BASE += '/';
})();
function assetURL(p) { return ASSET_BASE + p; }

var ROOT, UI, CANVAS_HOST;
var BOOT_ERRORS = [];
var DEV = false; try { DEV = /[?&]ssdtest/.test(location.search); } catch (e) {}

function showFatal(title, detail) {
  try {
    var d = document.getElementById('ssd-fatal');
    if (!d) {
      d = document.createElement('div'); d.id = 'ssd-fatal';
      d.style.cssText = 'position:fixed;left:16px;right:16px;top:calc(env(safe-area-inset-top,0px) + 120px);z-index:2147483647;background:#1a0606;color:#ffdede;border:2px solid #c22;padding:14px;font:13px/1.5 monospace;white-space:pre-wrap;border-radius:8px;max-height:60vh;overflow:auto;';
      (document.body || document.documentElement).appendChild(d);
    }
    d.textContent = '[Sunny Side Diner] ' + title + '\n' + (detail || '') + '\n\nASSET_BASE: ' + ASSET_BASE + '\nUA: ' + navigator.userAgent;
  } catch (e) {}
}
window.addEventListener('error', function (e) { BOOT_ERRORS.push((e && e.message) || 'error'); if (DEV) window.__ssdErr = 1; });

function setupPage() {
  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  try {
    var vp = document.querySelector('meta[name=viewport]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; head.appendChild(vp); }
    vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  } catch (e) {}
  try {
    var pre = document.createElement('link'); pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = 'anonymous'; head.appendChild(pre);
    var lk = document.createElement('link'); lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Caveat:wght@600;700&family=DotGothic16&family=Klee+One:wght@600&family=Oswald:wght@500;600&family=Old+Standard+TT:wght@400;700&family=Pacifico&family=Playfair+Display:wght@700;900&family=Reenie+Beanie&family=Shadows+Into+Light&family=Special+Elite&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap';
    head.appendChild(lk);
  } catch (e) {}
  var st = document.createElement('style'); st.id = 'ssd-base'; st.textContent = BASE_CSS; head.appendChild(st);
  ROOT = document.createElement('div'); ROOT.id = 'ssd-root';
  CANVAS_HOST = document.createElement('div'); CANVAS_HOST.id = 'ssd-canvas';
  UI = document.createElement('div'); UI.id = 'ssd-ui';
  ROOT.appendChild(CANVAS_HOST); ROOT.appendChild(UI);
  (document.body || document.documentElement).appendChild(ROOT);
  try { document.documentElement.classList.add('ssd-lock'); document.body.classList.add('ssd-lock'); } catch (e) {}
  var stop = function (e) { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (n) {
    ROOT.addEventListener(n, function (e) { if (e.target && e.target.closest && e.target.closest('input')) return; e.preventDefault(); }, { passive: false });
  });
  document.addEventListener('gesturestart', stop, { passive: false });
  ROOT.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.ssd-scroll')) e.preventDefault(); }, { passive: false });
  var lastTouchEnd = 0;
  ROOT.addEventListener('touchend', function (e) {
    var n = Date.now();
    if (n - lastTouchEnd < 320 && !(e.target.closest && e.target.closest('input,select'))) e.preventDefault();
    lastTouchEnd = n;
  }, { passive: false });
}

var BASE_CSS = [
  'html.ssd-lock,body.ssd-lock{margin:0;padding:0;overflow:hidden;height:100%;background:#000;overscroll-behavior:none;}',
  '#ssd-root{position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;background:#000;overflow:hidden;z-index:2147480000;',
  ' touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;',
  ' --top-safe:calc(env(safe-area-inset-top,0px) + 110px);--bot-safe:calc(env(safe-area-inset-bottom,0px) + 10px);}',
  '#ssd-root *{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
  '#ssd-root input{-webkit-user-select:text;user-select:text;}',
  '#ssd-canvas{position:absolute;left:0;top:0;width:100%;height:100%;}',
  '#ssd-canvas canvas{display:block;width:100%;height:100%;touch-action:none;}',
  '#ssd-ui{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;}'
].join('\n');
var THREE;
function loadThree(cb) {
  if (window.THREE && window.THREE.REVISION === '128') { THREE = window.THREE; return cb(); }
  var prev = window.THREE;
  var s = document.createElement('script');
  s.src = THREE_URL; s.async = true; s.crossOrigin = 'anonymous';
  var to = setTimeout(function () { showFatal('three.js の読み込みがタイムアウトしました', THREE_URL); }, 25000);
  s.onload = function () {
    clearTimeout(to); THREE = window.THREE;
    if (prev && prev !== THREE) window.THREE = prev;
    if (!THREE) return showFatal('three.js を読み込めましたが THREE がありません', THREE_URL);
    cb();
  };
  s.onerror = function () { clearTimeout(to); showFatal('three.js を読み込めませんでした (cdnjs)', THREE_URL + '\nネット接続やブロック設定を確認してください。'); };
  (document.head || document.documentElement).appendChild(s);
}


// ===== 01_util.js =====
// ---- math / rng / storage helpers -------------------------------------------
var PI = Math.PI, TAU = Math.PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function damp(a, b, k, dt) { return lerp(a, b, 1 - Math.exp(-k * dt)); }
function angDiff(a, b) { var d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; }
function dist2(ax, az, bx, bz) { var dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; }
function now() { return performance.now() / 1000; }

function makeRNG(seed) {
  var s = seed >>> 0 || 1;
  var r = function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  r.range = function (a, b) { return a + (b - a) * r(); };
  r.int = function (a, b) { return a + Math.floor(r() * (b - a + 1)); };
  r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
  r.chance = function (p) { return r() < p; };
  r.shuffle = function (arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
  return r;
}
var R = makeRNG((Date.now() ^ 0x5f3759df) >>> 0); // general purpose (non-seeded) rng

// value noise for textures
function hash2(x, y) { var h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) {
  var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, oct) { var s = 0, a = 0.5, f = 1; for (var i = 0; i < (oct || 4); i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; } return s; }

// ---- persistent save (all wrapped in try/catch) ----------------------------
var SAVE_KEY = 'sunnyside_diner_v1';
var SAVE = {
  day: 1, bestDay: 0, clears: 0, bestTips: 0, totalTips: 0, deaths: 0, name: '',
  anomalies: {}, lore: {}, trueEnd: 0, normalEnd: 0, seenIntro: 0,
  settings: { bgm: 0.75, sfx: 0.9, voice: 0.9, voiceMode: 'EN', voiceRate: 'NORMAL', sens: 1.0, quality: 'AUTO', scare: 'NORMAL' }
};
function loadSave() {
  try {
    var t = window.localStorage && localStorage.getItem(SAVE_KEY);
    if (t) {
      var o = JSON.parse(t);
      for (var k in o) if (k !== 'settings') SAVE[k] = o[k];
      if (o.settings) for (var s in o.settings) SAVE.settings[s] = o.settings[s];
    }
  } catch (e) {}
}
function writeSave() { try { if (window.localStorage) localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }

// ---- small DOM helpers -------------------------------------------------------
function el(tag, cls, html, parent) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
function bi(en, ja, cls) { // bilingual block: big English + small Japanese
  return '<span class="en ' + (cls || '') + '">' + en + '</span><span class="ja">' + ja + '</span>';
}
function onTap(e, fn) {
  var handler = function (ev) { ev.preventDefault(); ev.stopPropagation(); fn(ev); };
  e.addEventListener('pointerup', handler);
  e.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
  return e;
}
function wait(sec) { return new Promise(function (r) { setTimeout(r, sec * 1000); }); }
// test hook (only when the page URL contains ?ssdtest)
try { if (/[?&]ssdtest/.test(location.search)) window.__ssdEval = function (s) { return eval(s); }; } catch (e) {}

function fmtMoney(v) { return '$' + (Math.round(v * 100) / 100).toFixed(2); }
function lerpColor(a, b, t) { return a.clone().lerp(b, t); }


// ===== 02_tex.js =====
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


// ===== 03_render.js =====
// ---- renderer + custom HDR post pipeline (bloom / DOF / ACES / grade / film) ---
var RENDER = { renderer: null, scene: null, camera: null, w: 1, h: 1, dpr: 1, scale: 0.8, quality: 'MEDIUM', fpsAvg: 60, autoTimer: 0, hdr: true, frame: 0, shadowEvery: 0 };
var PU = null; // composite uniforms (public: effects write into these)
var QUAL = { LOW: { scale: 0.55, tex: 512, bloom: 3, dof: false, shadow: 0, shadowSize: 512, env: 64, rain: 0.4, maxDpr: 1.5 },
  MEDIUM: { scale: 0.72, tex: 1024, bloom: 4, dof: true, shadow: 1, shadowSize: 1024, env: 128, rain: 0.7, maxDpr: 2 },
  HIGH: { scale: 0.95, tex: 1024, bloom: 5, dof: true, shadow: 2, shadowSize: 2048, env: 256, rain: 1, maxDpr: 2 } };
var Q = QUAL.MEDIUM;
function isMobile() { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); }
function pickQuality(q) {
  if (q === 'AUTO') { q = isMobile() ? 'MEDIUM' : 'HIGH'; try { var m = navigator.deviceMemory; if (m && m <= 2) q = 'LOW'; } catch (e) {} }
  return q;
}

var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var DOWN_FS = [
  'precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh, uKnee, uFirst; varying vec2 vUv;',
  'vec3 sm(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }',
  'void main(){',
  '  vec3 c = sm(vec2(0.0)) * 4.0 + sm(vec2(-1.0,-1.0)) + sm(vec2(1.0,-1.0)) + sm(vec2(-1.0,1.0)) + sm(vec2(1.0,1.0));',
  '  c /= 8.0;',
  '  if (uFirst > 0.5) { float br = max(c.r, max(c.g, c.b)); float rq = clamp(br - uThresh + uKnee, 0.0, 2.0 * uKnee); rq = rq * rq / (4.0 * uKnee + 1e-4);',
  '    c *= max(rq, br - uThresh) / max(br, 1e-4); c = min(c, vec3(40.0)); }',
  '  gl_FragColor = vec4(c, 1.0); }'].join('\n');
var UP_FS = [
  'precision highp float; uniform sampler2D tSrc; uniform sampler2D tAdd; uniform vec2 uTexel; varying vec2 vUv;',
  'vec3 sm(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }',
  'void main(){',
  '  vec3 c = sm(vec2(-2.0,0.0)) + sm(vec2(2.0,0.0)) + sm(vec2(0.0,-2.0)) + sm(vec2(0.0,2.0));',
  '  c += (sm(vec2(-1.0,-1.0)) + sm(vec2(1.0,-1.0)) + sm(vec2(-1.0,1.0)) + sm(vec2(1.0,1.0))) * 2.0;',
  '  c /= 12.0; gl_FragColor = vec4(c + texture2D(tAdd, vUv).rgb, 1.0); }'].join('\n');
var COMP_FS = [
  'precision highp float;',
  'uniform sampler2D tScene, tBloom, tDof, tDepth, tFace; uniform vec2 uRes; uniform float uTime, uAspect;',
  'uniform float uAA, uBloom, uExposure, uDof, uFocus, uFocusRange, uNear, uFar, uHasDepth;',
  'uniform float uGrain, uAberr, uVig, uCold, uSat, uContrast, uFear, uGlitch, uVHS, uFlash, uBlack, uRed, uFace, uFaceZoom, uInvert, uWarp, uCRT;',
  'uniform vec2 uFaceShake, uFaceAsp; uniform vec3 uLift, uGain;',
  'varying vec2 vUv;',
  'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
  'vec3 aces(vec3 v){ const mat3 m1 = mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777);',
  '  const mat3 m2 = mat3(1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602);',
  '  v = m1 * v; vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return clamp(m2 * (a / b), 0.0, 1.0); }',
  'vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }',
  'float linZ(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }',
  'void main(){',
  '  vec2 uv = vUv; float t = uTime; vec2 cc = uv - 0.5; float r2 = dot(cc, cc);',
  '  // fear / warp distortion',
  '  uv += (uFear * 0.004 + uWarp * 0.01) * vec2(sin(uv.y * 23.0 + t * 2.1), cos(uv.x * 19.0 + t * 1.7));',
  '  uv = 0.5 + cc * (1.0 + uFear * 0.06 * r2 + uCRT * 0.12 * r2);',
  '  float ly = floor(uv.y * uRes.y * 0.5);',
  '  uv.x += (hash(vec2(ly, floor(t * 30.0))) - 0.5) * 0.002 * uVHS;',
  '  float gl = uGlitch * step(0.72, hash(vec2(floor(uv.y * 26.0), floor(t * 17.0))));',
  '  uv.x += gl * (hash(vec2(floor(uv.y * 26.0), t)) - 0.5) * 0.1;',
  '  float ab = uAberr * (0.0006 + r2 * 0.006) + gl * 0.012 + uFear * 0.003 + uVHS * 0.002;',
  '  vec3 col; col.r = texture2D(tScene, uv + vec2(ab, 0.0)).r; col.g = texture2D(tScene, uv).g; col.b = texture2D(tScene, uv - vec2(ab, 0.0)).b;',
  '  // FXAA-lite: blend along strong luma edges (kills stair-steps on long edges)',
  '  if (uAA > 0.5) {',
  '    vec2 px = 1.0 / uRes;',
  '    vec3 n = texture2D(tScene, uv + vec2(0.0, px.y)).rgb, s = texture2D(tScene, uv - vec2(0.0, px.y)).rgb, e = texture2D(tScene, uv + vec2(px.x, 0.0)).rgb, w = texture2D(tScene, uv - vec2(px.x, 0.0)).rgb;',
  '    vec3 lw = vec3(0.299, 0.587, 0.114);',
  '    float lN = dot(min(n, 4.0), lw), lS = dot(min(s, 4.0), lw), lE = dot(min(e, 4.0), lw), lW = dot(min(w, 4.0), lw), lM = dot(min(col, 4.0), lw);',
  '    float mx = max(max(lN, lS), max(lE, lW)), mn = min(min(lN, lS), min(lE, lW)), rng = max(mx, lM) - min(mn, lM);',
  '    if (rng > max(0.04, max(mx, lM) * 0.12)) {',
  '      vec2 dir = normalize(vec2(lS - lN, lE - lW) + 1e-5) * px;',
  '      vec3 a1 = texture2D(tScene, uv + dir * 0.5).rgb, a2 = texture2D(tScene, uv - dir * 0.5).rgb, b1 = texture2D(tScene, uv + dir * 1.5).rgb, b2 = texture2D(tScene, uv - dir * 1.5).rgb;',
  '      vec3 aa = (a1 + a2) * 0.35 + (b1 + b2) * 0.15;',
  '      col = mix(col, aa, 0.85);',
  '    }',
  '  }',
  '  // depth of field',
  '  if (uDof > 0.001 && uHasDepth > 0.5) {',
  '    float z = linZ(texture2D(tDepth, uv).x); float coc = clamp(abs(z - uFocus) / (uFocusRange * max(uFocus, 0.3)), 0.0, 1.0) * uDof;',
  '    vec2 px = 1.5 / uRes; vec3 b = texture2D(tDof, uv).rgb * 0.4 + texture2D(tDof, uv + vec2(px.x * 2.0, px.y)).rgb * 0.15 + texture2D(tDof, uv - vec2(px.x * 2.0, px.y)).rgb * 0.15',
  '      + texture2D(tDof, uv + vec2(-px.x, px.y * 2.0)).rgb * 0.15 + texture2D(tDof, uv + vec2(px.x, -px.y * 2.0)).rgb * 0.15;',
  '    col = mix(col, b, smoothstep(0.0, 1.0, coc)); }',
  '  col += texture2D(tBloom, uv).rgb * uBloom;',
  '  col *= uExposure;',
  '  col = aces(col);',
  '  // grade (display-ish space)',
  '  col = pow(col, vec3(1.0 / 1.0));',
  '  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));',
  '  col = mix(vec3(l), col, uSat);',
  '  col = (col - 0.5) * uContrast + 0.5;',
  '  vec3 warmTint = vec3(1.04, 1.0, 0.92), coldTint = vec3(0.86, 0.98, 1.12);',
  '  col *= mix(warmTint, coldTint, uCold);',
  '  col = col * uGain + uLift * (1.0 - col);',
  '  col = clamp(col, 0.0, 1.0);',
  '  // scanlines / crt',
  '  col *= 1.0 - (uVHS * 0.12 + uCRT * 0.25) * (0.5 + 0.5 * sin(vUv.y * uRes.y * 1.7));',
  '  // vignette',
  '  float v = length(cc * vec2(min(uAspect, 1.0) * 1.15, 1.0 / max(uAspect, 1.0)));',
  '  float vig = smoothstep(0.9 - uFear * 0.2, 0.22, v);',
  '  col *= mix(1.0, vig, uVig + uFear * 0.35);',
  '  col = mix(col, col * vec3(1.0, 0.25, 0.22), uRed * (1.0 - vig * 0.5));',
  '  // film grain (luma weighted)',
  '  float gr = hash(vUv * uRes + fract(t * 7.13) * 91.0) - 0.5;',
  '  col += gr * (uGrain + uFear * 0.05 + uVHS * 0.04) * (1.0 - l * 0.5);',
  '  // jumpscare face',
  '  if (uFace > 0.001) {',
  '    vec2 fu = (vUv - 0.5) * vec2(min(uAspect, 1.0) / uFaceAsp.x, 1.0 / max(uAspect, 1.0) / uFaceAsp.y) * 1.0 / uFaceZoom + 0.5 + uFaceShake;',
  '    float fl = floor(fu.y * 40.0); float tear = step(0.82, hash(vec2(fl, floor(t * 24.0))));',
  '    fu.x += tear * (hash(vec2(fl, t)) - 0.5) * 0.06 * uFace;',
  '    float fab = 0.002 + 0.01 * step(0.7, hash(vec2(floor(t * 30.0), 1.0)));',
  '    vec3 f; f.r = texture2D(tFace, fu + vec2(fab, 0.0)).r; f.g = texture2D(tFace, fu).g; f.b = texture2D(tFace, fu - vec2(fab, 0.0)).b;',
  '    float edge = smoothstep(0.0, 0.16, fu.y) * smoothstep(1.0, 0.84, fu.y) * smoothstep(0.0, 0.14, fu.x) * smoothstep(1.0, 0.86, fu.x);',
  '    f = pow(f, vec3(0.92)) * 1.2 * edge; f *= 0.88 + 0.25 * hash(vec2(floor(t * 40.0), 3.0));',
  '    f += (hash(vUv * uRes + t * 91.0) - 0.5) * 0.14; f *= 1.0 - 0.1 * sin(vUv.y * uRes.y * 1.6);',
  '    f = mix(f, vec3(1.0) - f, uInvert); f = mix(f, f * vec3(1.15, 0.78, 0.74), 0.35);',
  '    col = mix(col, f, clamp(uFace, 0.0, 1.0)); }',
  '  col = mix(col, vec3(1.0), uFlash); col *= 1.0 - uBlack;',
  '  gl_FragColor = vec4(toSRGB(clamp(col, 0.0, 1.0)), 1.0);',
  '}'].join('\n');

function mkRT(w, h, type, depth) {
  var rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: type, depthBuffer: !!depth, stencilBuffer: false });
  rt.texture.generateMipmaps = false;
  return rt;
}
function initRenderer() {
  var r;
  try { r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true }); }
  catch (e) { showFatal('WebGL を起動できませんでした', String(e)); throw e; }
  r.outputEncoding = THREE.LinearEncoding;
  r.toneMapping = THREE.NoToneMapping;
  r.physicallyCorrectLights = true;
  r.setClearColor(0x000000, 1);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
  r.domElement.style.touchAction = 'none';
  CANVAS_HOST.appendChild(r.domElement);
  RENDER.renderer = r;
  MAX_ANISO = r.capabilities.getMaxAnisotropy ? r.capabilities.getMaxAnisotropy() : 1;
  var gl = r.getContext();
  RENDER.hdr = !!(r.capabilities.isWebGL2 && (r.extensions.get('EXT_color_buffer_float') || r.extensions.get('EXT_color_buffer_half_float')));
  RENDER.ftype = RENDER.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
  RENDER.scene = new THREE.Scene();
  RENDER.scene.fog = new THREE.FogExp2(0x0b0e16, 0.011);
  RENDER.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 260);
  RENDER.scene.add(RENDER.camera);
  PU = {
    tScene: { value: null }, tBloom: { value: null }, tDof: { value: null }, tDepth: { value: null }, tFace: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uAspect: { value: 1 },
    uAA: { value: 1 }, uBloom: { value: 0.9 }, uExposure: { value: 1.0 }, uDof: { value: 0 }, uFocus: { value: 2 }, uFocusRange: { value: 0.7 }, uNear: { value: 0.05 }, uFar: { value: 260 }, uHasDepth: { value: 0 },
    uGrain: { value: 0.035 }, uAberr: { value: 0.5 }, uVig: { value: 0.55 }, uCold: { value: 0 }, uSat: { value: 1.05 }, uContrast: { value: 1.04 },
    uFear: { value: 0 }, uGlitch: { value: 0 }, uVHS: { value: 0 }, uFlash: { value: 0 }, uBlack: { value: 0 }, uRed: { value: 0 },
    uFace: { value: 0 }, uFaceZoom: { value: 1 }, uInvert: { value: 0 }, uWarp: { value: 0 }, uCRT: { value: 0 },
    uFaceShake: { value: new THREE.Vector2() }, uFaceAsp: { value: new THREE.Vector2(1.2, 1) },
    uLift: { value: new THREE.Vector3(0.012, 0.01, 0.018) }, uGain: { value: new THREE.Vector3(1, 1, 1) }
  };
  RENDER.comp = new THREE.ShaderMaterial({ uniforms: PU, vertexShader: POST_VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false });
  RENDER.downMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 1.0 }, uKnee: { value: 0.5 }, uFirst: { value: 0 } }, vertexShader: POST_VS, fragmentShader: DOWN_FS, depthTest: false, depthWrite: false });
  RENDER.upMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } }, vertexShader: POST_VS, fragmentShader: UP_FS, depthTest: false, depthWrite: false });
  RENDER.pScene = new THREE.Scene(); RENDER.pCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  RENDER.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), RENDER.comp); RENDER.quad.frustumCulled = false; RENDER.pScene.add(RENDER.quad);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', function () { setTimeout(onResize, 250); });
  setQuality(SAVE.settings.quality, true);
}
function setQuality(name, first) {
  RENDER.qname = name; RENDER.quality = pickQuality(name); Q = QUAL[RENDER.quality];
  RENDER.scale = Q.scale; TEXQ = Q.tex;
  RENDER.renderer.shadowMap.enabled = Q.shadow > 0;
  if (!first) { RENDER.scene.traverse(function (o) { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.needsUpdate = true; }); } }); if (typeof applyLightQuality === 'function') applyLightQuality(); }
  RENDER.renderer.shadowMap.needsUpdate = true;
  onResize();
}
function onResize() {
  var r = RENDER.renderer; if (!r) return;
  var w = ROOT.clientWidth || window.innerWidth, h = ROOT.clientHeight || window.innerHeight;
  RENDER.w = w; RENDER.h = h;
  RENDER.dpr = Math.min(window.devicePixelRatio || 1, Q.maxDpr);
  r.setPixelRatio(1);
  var pw = Math.max(1, Math.round(w * RENDER.dpr)), ph = Math.max(1, Math.round(h * RENDER.dpr));
  r.setSize(pw, ph, false); r.domElement.style.width = w + 'px'; r.domElement.style.height = h + 'px';
  var sw = Math.max(2, Math.round(pw * RENDER.scale)), sh = Math.max(2, Math.round(ph * RENDER.scale));
  RENDER.sw = sw; RENDER.sh = sh;
  if (!RENDER.rt) {
    RENDER.rt = mkRT(sw, sh, RENDER.ftype, true);
    try { RENDER.rt.depthTexture = new THREE.DepthTexture(sw, sh); RENDER.rt.depthTexture.type = THREE.UnsignedIntType; PU.uHasDepth.value = 1; } catch (e) { PU.uHasDepth.value = 0; }
    RENDER.chain = [];
  } else RENDER.rt.setSize(sw, sh);
  // post chain: d0 (1/2), d1 (1/4, dof), b1..bn (bloom 1/4..), u1..un
  var mk = function (i, s) { var W = Math.max(2, Math.round(sw / s)), H = Math.max(2, Math.round(sh / s)); if (!RENDER.chain[i]) RENDER.chain[i] = mkRT(W, H, RENDER.ftype, false); else RENDER.chain[i].setSize(W, H); return RENDER.chain[i]; };
  RENDER.d0 = mk(0, 2); RENDER.d1 = mk(1, 4);
  RENDER.b = []; RENDER.u = [];
  for (var i = 0; i < 5; i++) { RENDER.b[i] = mk(2 + i, 4 * Math.pow(2, i)); RENDER.u[i] = mk(8 + i, 4 * Math.pow(2, i)); }
  PU.uRes.value.set(sw, sh); PU.uAspect.value = w / h;
  var cam = RENDER.camera; cam.aspect = w / h;
  cam.fov = w / h < 0.62 ? 74 : (w / h < 1 ? 66 : 56);
  if (RENDER.fovOverride) cam.fov = RENDER.fovOverride;
  cam.updateProjectionMatrix();
  if (typeof layoutUI === 'function') layoutUI();
}
function pass(mat, target) { RENDER.quad.material = mat; RENDER.renderer.setRenderTarget(target); RENDER.renderer.render(RENDER.pScene, RENDER.pCam); }
function renderFrame(scene, camera) {
  var r = RENDER.renderer, cam = camera || RENDER.camera;
  RENDER.frame++;
  if (Q.shadow > 1 && RENDER.frame % 3 === 0) r.shadowMap.needsUpdate = true;
  if (RENDER.shadowDirty) { r.shadowMap.needsUpdate = true; RENDER.shadowDirty = false; }
  r.setRenderTarget(RENDER.rt); r.render(scene || RENDER.scene, cam);
  var dm = RENDER.downMat.uniforms, um = RENDER.upMat.uniforms;
  // half-res plain
  dm.tSrc.value = RENDER.rt.texture; dm.uTexel.value.set(1 / RENDER.rt.width, 1 / RENDER.rt.height); dm.uFirst.value = 0; pass(RENDER.downMat, RENDER.d0);
  if (Q.dof && PU.uDof.value > 0.001) { dm.tSrc.value = RENDER.d0.texture; dm.uTexel.value.set(1 / RENDER.d0.width, 1 / RENDER.d0.height); pass(RENDER.downMat, RENDER.d1); }
  // bloom
  var n = Q.bloom;
  dm.tSrc.value = RENDER.d0.texture; dm.uTexel.value.set(1 / RENDER.d0.width, 1 / RENDER.d0.height); dm.uFirst.value = 1; dm.uThresh.value = RENDER.hdr ? 1.0 : 0.72; pass(RENDER.downMat, RENDER.b[0]);
  dm.uFirst.value = 0;
  for (var i = 1; i < n; i++) { dm.tSrc.value = RENDER.b[i - 1].texture; dm.uTexel.value.set(1 / RENDER.b[i - 1].width, 1 / RENDER.b[i - 1].height); pass(RENDER.downMat, RENDER.b[i]); }
  var src = RENDER.b[n - 1];
  for (var k = n - 2; k >= 0; k--) { um.tSrc.value = src.texture; um.tAdd.value = RENDER.b[k].texture; um.uTexel.value.set(0.5 / src.width, 0.5 / src.height); pass(RENDER.upMat, RENDER.u[k]); src = RENDER.u[k]; }
  PU.tScene.value = RENDER.rt.texture; PU.tBloom.value = src.texture; PU.tDof.value = RENDER.d1.texture; PU.tDepth.value = RENDER.rt.depthTexture || null;
  PU.uNear.value = cam.near; PU.uFar.value = cam.far;
  var dofSave = PU.uDof.value; if (!Q.dof) PU.uDof.value = 0;
  pass(RENDER.comp, null);
  PU.uDof.value = dofSave;
}
function adaptQuality(dt) {
  var fps = 1 / Math.max(dt, 0.001);
  RENDER.fpsAvg = lerp(RENDER.fpsAvg, fps, 0.05);
  if (RENDER.qname !== 'AUTO') return;
  RENDER.autoTimer += dt; if (RENDER.autoTimer < 3) return; RENDER.autoTimer = 0;
  var s = RENDER.scale;
  if (RENDER.fpsAvg < 34 && s > 0.45) s = Math.max(0.45, s - 0.08);
  else if (RENDER.fpsAvg > 57 && s < Q.scale) s = Math.min(Q.scale, s + 0.04);
  if (Math.abs(s - RENDER.scale) > 0.001) { RENDER.scale = s; onResize(); }
}
// environment map: render the diner from a point, prefilter with PMREM
function bakeEnv(pos, exclude) {
  var r = RENDER.renderer, size = Q.env;
  var crt = new THREE.WebGLCubeRenderTarget(size, { type: RENDER.ftype, format: THREE.RGBAFormat, generateMipmaps: false, minFilter: THREE.LinearFilter });
  var cc = new THREE.CubeCamera(0.1, 120, crt); cc.position.copy(pos); RENDER.scene.add(cc);
  var hidden = []; (exclude || []).forEach(function (o) { if (o.visible) { o.visible = false; hidden.push(o); } });
  var envSave = RENDER.scene.environment; RENDER.scene.environment = null;
  cc.update(r, RENDER.scene);
  hidden.forEach(function (o) { o.visible = true; });
  RENDER.scene.remove(cc);
  var pm = new THREE.PMREMGenerator(r); var envRT = pm.fromCubemap(crt.texture); pm.dispose(); crt.dispose();
  RENDER.scene.environment = envSave;
  return envRT.texture;
}


// ===== 04_geo.js =====
// ---- materials + geometry helpers + static batching -------------------------
var M = {};
function stdMat(o) { var m = new THREE.MeshStandardMaterial(o); return m; }
function setT(m, set, tm) { if (set) { m.map = set.map; m.normalMap = set.normalMap; m.roughnessMap = set.roughnessMap; } m.userData.tm = tm || 1; return m; }
function buildMaterials() {
  var ns = function (v) { return new THREE.Vector2(v, v); };
  M.floor = setT(stdMat({ color: 0xffffff, roughness: 1, metalness: 0, normalScale: ns(0.6), envMapIntensity: 1.0 }), TEX.floor, 1.2);
  M.vinyl = setT(stdMat({ color: 0xffffff, roughness: 1, normalScale: ns(0.9), envMapIntensity: 0.9 }), TEX.vinylRed, 0.6);
  M.vinylP = setT(stdMat({ color: 0xffffff, roughness: 1, normalScale: ns(0.9), envMapIntensity: 0.9 }), TEX.vinylRedP, 0.6);
  M.vinylCream = setT(stdMat({ color: 0xffffff, roughness: 1, normalScale: ns(0.8), envMapIntensity: 0.8 }), TEX.vinylCream, 0.6);
  M.chrome = setT(stdMat({ color: 0xf2f4f6, roughness: 0.9, metalness: 1, normalScale: ns(0.3), envMapIntensity: 1.25 }), TEX.chrome, 0.5);
  M.chromeDull = setT(stdMat({ color: 0xc8ccd0, roughness: 1.6, metalness: 1, envMapIntensity: 1.0 }), TEX.chrome, 0.5);
  M.formica = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.8 }), TEX.formica, 1.0);
  M.formicaCream = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.8 }), TEX.formicaRed, 1.0);
  M.tiles = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.9, normalScale: ns(0.7) }), TEX.tiles, 0.6);
  M.tilesWhite = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.9, normalScale: ns(0.7) }), TEX.tilesWhite, 0.6);
  M.plaster = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.5, normalScale: new THREE.Vector2(0.5, 0.5) }), TEX.plaster, 2.0);
  M.plasterRed = setT(stdMat({ color: 0xc2282e, roughness: 1, envMapIntensity: 0.5 }), TEX.plaster, 2.0);
  M.steel = setT(stdMat({ color: 0xffffff, roughness: 1, metalness: 1, envMapIntensity: 1.0 }), TEX.steel, 1.0);
  M.steelG = setT(stdMat({ color: 0xb8b8b8, roughness: 1, metalness: 0.75, envMapIntensity: 0.7 }), TEX.steelG, 1.0);
  M.griddle = setT(stdMat({ color: 0xffffff, roughness: 0.9, metalness: 0.2, envMapIntensity: 0.7 }), TEX.griddle, 1.0);
  M.ceiling = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.4, normalScale: new THREE.Vector2(0.5, 0.5) }), TEX.ceiling, 0.6);
  M.asphalt = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 1.2 }), TEX.asphalt, 6);
  M.sand = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.2 }), TEX.sand, 8);
  M.quarry = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.8 }), TEX.quarry, 0.9);
  M.wood = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.7 }), TEX.wood, 1.0);
  M.woodLight = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.7 }), TEX.woodLight, 1.0);
  M.frost = setT(stdMat({ color: 0xffffff, roughness: 1, metalness: 0.3, envMapIntensity: 0.8 }), TEX.frost, 1.2);
  M.card = setT(stdMat({ color: 0xffffff, roughness: 1 }), TEX.card, 0.6);
  M.black = stdMat({ color: 0x0b0b0c, roughness: 0.5 });
  M.rubber = stdMat({ color: 0x141414, roughness: 0.85 });
  M.paintRed = stdMat({ color: 0xb3161d, roughness: 0.35, envMapIntensity: 1.0 });
  M.paintMint = stdMat({ color: 0x7cc7b3, roughness: 0.4, envMapIntensity: 1.0 });
  M.paintCream = stdMat({ color: 0xeadbb8, roughness: 0.5 });
  M.enamelWhite = stdMat({ color: 0xf1efe8, roughness: 0.25, envMapIntensity: 1.1 });
  M.ceramic = stdMat({ color: 0xf4f1ea, roughness: 0.18, envMapIntensity: 1.0 });
  M.ceramicRim = stdMat({ color: 0xb02026, roughness: 0.2 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14, envMapIntensity: 1.6, depthWrite: false, reflectivity: 0.6 });
  M.glassDark = new THREE.MeshPhysicalMaterial({ color: 0x9fb0b8, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.3, envMapIntensity: 1.4, depthWrite: false });
  M.pinkPhone = stdMat({ color: 0xf08fb4, roughness: 0.3, envMapIntensity: 1.0 });
  M.bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.2, 2.4) });
  M.bulbOff = new THREE.MeshStandardMaterial({ color: 0x333028, roughness: 0.3 });
  M.fluor = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 4.6, 4.8) });
  M.coffee = stdMat({ color: 0x1a0d06, roughness: 0.05, envMapIntensity: 1.5 });
}
function neonMat(r, g, b) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: false }); }

// --- world-scaled UV box ------------------------------------------------------
function boxGeo(w, h, d, tm) {
  var g = new THREE.BoxGeometry(w, h, d); tm = tm || 1;
  var uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (var f = 0; f < 6; f++) for (var k = 0; k < 4; k++) { var i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tm, uv.getY(i) * dims[f][1] / tm); }
  return g;
}
function scaleUV(g, su, sv) { var uv = g.attributes.uv; for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * (sv == null ? su : sv)); return g; }
// rounded slab via extrude of rounded rect (x by z footprint, thickness h)
function roundSlab(w, d, h, rad, segs) {
  var s = new THREE.Shape(), x = -w / 2, y = -d / 2, r = Math.min(rad, w / 2, d / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  var g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: Math.min(0.012, h * 0.3), bevelSize: Math.min(0.012, r * 0.5), bevelSegments: 2, curveSegments: segs || 6 });
  g.rotateX(-PI / 2); g.translate(0, -h / 2, 0);
  return g;
}

// --- static batches: merge many meshes of one material into one draw ----------
var BATCH = {};
function batchAdd(geo, mat, x, y, z, ry, rx, rz, sx) {
  var key = mat.uuid; if (!BATCH[key]) BATCH[key] = { mat: mat, geos: [], cast: true, recv: true };
  var m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0, 'YXZ'));
  m.compose(new THREE.Vector3(x || 0, y || 0, z || 0), q, new THREE.Vector3(sx || 1, sx || 1, sx || 1));
  var g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m);
  BATCH[key].geos.push(g);
}
function B(w, h, d, mat, x, y, z, ry) { batchAdd(boxGeo(w, h, d, mat.userData.tm || 1), mat, x, y, z, ry); }
function mergeGeos(list) {
  var n = 0; list.forEach(function (g) { n += g.attributes.position.count; });
  var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), o = 0;
  list.forEach(function (g) {
    var c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, c * 2), o * 2);
    o += c;
  });
  var out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}
function flushBatches(parent) {
  for (var k in BATCH) {
    var b = BATCH[k]; if (!b.geos.length) continue;
    var mesh = new THREE.Mesh(mergeGeos(b.geos), b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv && [M.ceiling, M.plaster, M.plasterRed, M.tilesWhite].indexOf(b.mat) < 0; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    parent.add(mesh); b.geos.forEach(function (g) { g.dispose(); });
  }
  BATCH = {};
}
function mesh(geo, mat, x, y, z, parent, cast) {
  var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = cast !== false; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
function group(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
// soft blob shadow decal (contact shadow)
var BLOB_TEX = null;
function blobTex() {
  if (BLOB_TEX) return BLOB_TEX;
  var c = mkCanvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); BLOB_TEX = toTex(c, { clamp: true, linear: true }); return BLOB_TEX;
}
var BLOB_MAT = null;
function blob(parent, x, z, sx, sz, y, op) {
  if (!BLOB_MAT) BLOB_MAT = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 1, color: 0x000000, alphaMap: null });
  var m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), BLOB_MAT.clone()); m.material.opacity = op == null ? 0.85 : op;
  m.rotation.x = -PI / 2; m.position.set(x, (y || 0) + 0.004, z); m.renderOrder = 1; parent.add(m); return m;
}


// ===== 05_art.js =====
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
function neonStroke(g, drawPath, col, w) { // glow via shadowBlur (works in Safari, unlike ctx.filter)
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = col; g.shadowBlur = w * 3.5; g.strokeStyle = col; g.globalAlpha = 0.55; g.lineWidth = w * 1.6; drawPath(); g.stroke();
  g.shadowBlur = w * 1.5; g.globalAlpha = 1; g.lineWidth = w; drawPath(); g.stroke();
  g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = w * 0.35; drawPath(); g.stroke();
  g.restore();
}
function neonText(g, txt, x, y, font, col, w) {
  g.save(); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = col; g.shadowBlur = w * 3; g.strokeStyle = col; g.globalAlpha = 0.6; g.lineWidth = w * 1.5; g.strokeText(txt, x, y);
  g.shadowBlur = w * 1.2; g.globalAlpha = 1; g.lineWidth = w; g.strokeText(txt, x, y);
  g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = w * 0.33; g.strokeText(txt, x, y);
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


// ===== 06_diner.js =====
// ---- the diner: architecture, furniture, exterior -------------------------------
// coordinates (m): x right, y up, z toward the front windows. dining room x -8..8, z -2.8..5
var D = { // layout constants
  W0: -8, W1: 8, Z0: -2.8, Z1: 5, H: 3.1, KZ0: -5.2,
  counterX0: -3.6, counterX1: 4.4, counterZf: -1.2, counterZb: -1.95, counterY: 1.05,
  stoolZ: -0.62, stools: [-3, -2, -1, 0, 1, 2, 3, 4],
  booths: [2.8, 0.7, -1.4, -3.5], boothZ0: 3.45, boothZ1: 4.95,
  door: [5.4, 6.6], register: { x: 6.4, y: 1.05, z: 1.7 }
};
var WORLD = { root: null, interior: null, exterior: null, dyn: {}, pick: [], seats: [], signs: {}, lights: {} };
var SEATS = []; // {id, label, pos, face(yaw), kind, booth}

function buildDiner() {
  var scene = RENDER.scene;
  var root = WORLD.root = group(scene);
  var I = WORLD.interior = group(root), X = WORLD.exterior = group(root);
  buildShell(I);
  buildCounter(I);
  buildStools(I);
  buildBooths(I);
  buildBackBar(I);
  buildKitchen(I);
  buildFreezer(I);
  buildLeftWall(I);
  buildRegister(I);
  buildDecor(I);
  flushBatches(I);
  buildExterior(X);
  flushBatches(X);
}

function buildShell(P) {
  var H = D.H;
  // floor: checker in dining room, quarry in kitchen
  var fg = new THREE.PlaneGeometry(16, 7.8); scaleUV(fg, 16 / 1.2, 7.8 / 1.2); fg.rotateX(-PI / 2);
  var floor = mesh(fg, M.floor, 0, 0, (D.Z0 + D.Z1) / 2, P, false); floor.receiveShadow = true; WORLD.floor = floor;
  var kg = new THREE.PlaneGeometry(13.6, 2.4); scaleUV(kg, 13.6 / 0.9, 2.4 / 0.9); kg.rotateX(-PI / 2);
  mesh(kg, M.quarry, 1.2, 0, (D.KZ0 + D.Z0) / 2, P, false);
  // hallway floor
  var hgf = new THREE.PlaneGeometry(3, 3.2); scaleUV(hgf, 3 / 1.2, 3.2 / 1.2); hgf.rotateX(-PI / 2); mesh(hgf, M.floor, -9.5, 0, -1.4, P, false);
  // ceiling
  var cg = new THREE.PlaneGeometry(16, 10.4); scaleUV(cg, 16 / 0.6, 10.4 / 0.6); cg.rotateX(PI / 2);
  mesh(cg, M.ceiling, 0, H, -0.1, P, false).receiveShadow = false;
  var stc = mkCanvas(256, 256), stg = stc.getContext('2d'); ring(stg, 128, 128, 100, 'rgb(120,80,30)', 0.5, 6); smudge(stg, 128, 128, 110, 'rgba(140,100,40,A)', 0.35);
  var stm = new THREE.MeshBasicMaterial({ map: toTex(stc, { clamp: true }), transparent: true, depthWrite: false, color: 0x9a8a70, opacity: 0.6 });
  [[-5.5, 3.2, 1.2], [3.2, 0.2, 0.8], [-1.0, -2.0, 0.6], [6.4, 3.8, 1.0]].forEach(function (d) { var sm2 = mesh(new THREE.PlaneGeometry(d[2], d[2]), stm, d[0], H - 0.004, d[1], P, false); sm2.rotation.x = PI / 2; });
  // --- walls (wainscot tiles below 1.1, chrome strip, plaster above)
  function wallSeg(x0, x1, z, face, y0, y1) { // along x, at z, facing +z (face=1) or -z
    var w = x1 - x0, cx = (x0 + x1) / 2;
    if (y0 < 1.1) B(w, Math.min(1.1, y1) - y0, 0.08, M.tiles, cx, (y0 + Math.min(1.1, y1)) / 2, z - face * 0.04);
    if (y1 > 1.16) B(w, y1 - Math.max(1.16, y0), 0.08, M.plaster, cx, (Math.max(1.16, y0) + y1) / 2, z - face * 0.04);
    if (y0 < 1.13 && y1 > 1.13) B(w, 0.06, 0.1, M.chrome, cx, 1.13, z - face * 0.035);
  }
  function wallSegZ(z0, z1, x, face, y0, y1) {
    var d = z1 - z0, cz = (z0 + z1) / 2;
    if (y0 < 1.1) B(0.08, Math.min(1.1, y1) - y0, d, M.tiles, x - face * 0.04, (y0 + Math.min(1.1, y1)) / 2, cz);
    if (y1 > 1.16) B(0.08, y1 - Math.max(1.16, y0), d, M.plaster, x - face * 0.04, (Math.max(1.16, y0) + y1) / 2, cz);
    if (y0 < 1.13 && y1 > 1.13) B(0.1, 0.06, d, M.chrome, x - face * 0.035, 1.13, cz);
  }
  // front wall z=5 : windows x -7.8..4.9 (y 0.95..2.55), door 5.4..6.6
  wallSeg(-8, 5.4, 5, -1, 0, 0.95); wallSeg(-8, 5.4, 5, -1, 2.55, H);
  wallSeg(-8, -7.8, 5, -1, 0.95, 2.55); wallSeg(4.9, 5.4, 5, -1, 0.95, 2.55);
  wallSeg(6.6, 8, 5, -1, 0, H); wallSeg(5.4, 6.6, 5, -1, 2.35, H);
  // window mullions (chrome)
  for (var mx = -7.8; mx <= 4.95; mx += 2.14) B(0.07, 1.6, 0.12, M.chrome, mx, 1.75, 4.97);
  B(12.8, 0.06, 0.14, M.chrome, -1.45, 0.95, 4.97); B(12.8, 0.06, 0.14, M.chrome, -1.45, 2.55, 4.97);
  // window sill
  B(12.8, 0.04, 0.22, M.formica, -1.45, 0.93, 4.86);
  // side walls
  wallSegZ(-2.8, 5, 8, 1, 0, H);
  wallSegZ(0.8, 5, -8, -1, 0, H); wallSegZ(-2.8, -0.4, -8, -1, 0, H); wallSegZ(-0.4, 0.8, -8, -1, 2.25, H); // hallway opening z -0.4..0.8
  // hallway
  B(2.4, H, 0.1, M.tilesWhite, -9.2, H / 2, -0.45); B(2.4, H, 0.1, M.tilesWhite, -9.2, H / 2, 0.85);
  B(0.1, H, 1.3, M.plaster, -10.4, H / 2, 0.2);
  var hc = new THREE.PlaneGeometry(2.6, 1.4); hc.rotateX(PI / 2); mesh(hc, M.ceiling, -9.2, H, 0.2, P, false).receiveShadow = false;
  WORLD.hallEnd = new THREE.Vector3(-10.3, 1.4, 0.2);
  // restroom doors in the hallway
  B(0.75, 2.05, 0.05, M.wood, -9.4, 1.03, -0.38); B(0.75, 2.05, 0.05, M.wood, -9.4, 1.03, 0.78);
  // back wall z=-2.8 (between dining and kitchen) with pass window x 0.2..2.6 (y 1.25..2.05) and kitchen door x -3.4..-2.5
  wallSeg(-8, -3.4, -2.8, 1, 0, H); wallSeg(-2.5, 0.2, -2.8, 1, 0, H); wallSeg(2.6, 8, -2.8, 1, 0, H);
  wallSeg(0.2, 2.6, -2.8, 1, 0, 1.25); wallSeg(0.2, 2.6, -2.8, 1, 2.05, H); wallSeg(-3.4, -2.5, -2.8, 1, 2.15, H);
  B(2.5, 0.05, 0.4, M.steel, 1.4, 1.25, -2.8); // pass shelf
  // swing door to kitchen (half open)
  var sd = mesh(boxGeo(0.86, 1.5, 0.05, 1), M.steel, -2.95, 1.05, -2.8, P); sd.rotation.y = 0.5; sd.position.x -= 0.1;
  // kitchen walls (white tiles)
  function kwall(w, h, d, x, y, z) { B(w, h, d, M.tilesWhite, x, y, z); }
  kwall(13.6, H, 0.1, 1.2, H / 2, D.KZ0); // back wall (door cut below)
  kwall(0.1, H, 2.4, -5.6, H / 2, -4.0);
  kwall(0.1, H, 2.4, 5.0, H / 2, -4.0); // between kitchen and freezer (door cut handled by door mesh over it)
  // exterior skin of the building (stainless diner siding + red band), visible from outside
  var sk = M.steel;
  B(16.4, 0.95, 0.06, sk, 0, 0.475, 5.12); B(16.4, 0.55, 0.06, sk, 0, H - 0.27 + 0.27, 5.12);
  B(1.4, 2.35, 0.06, sk, 7.3, 1.17, 5.12); B(0.2, 1.6, 0.06, sk, -7.95, 1.75, 5.12); B(0.5, 1.6, 0.06, sk, 5.15, 1.75, 5.12);
  B(16.4, 0.16, 0.08, M.paintRed, 0, 0.8, 5.16); B(16.4, 0.16, 0.08, M.paintRed, 0, 2.72, 5.16);
  B(0.06, H + 0.4, 10.6, sk, 8.12, (H + 0.4) / 2, -0.1); B(0.06, H + 0.4, 10.6, sk, -8.12, (H + 0.4) / 2, -0.1);
  B(16.6, 0.4, 10.8, M.black, 0, H + 0.2, -0.1); // roof slab
  B(16.8, 0.22, 0.3, M.chrome, 0, H + 0.28, 5.2); // roof edge trim
  // front door (glass with chrome frame) — hinged group for opening
  var door = group(P, D.door[0] + 0.02, 0, 5.0);
  mesh(boxGeo(1.16, 0.08, 0.06, 1), M.chrome, 0.58, 0.04, 0, door); mesh(boxGeo(1.16, 0.08, 0.06, 1), M.chrome, 0.58, 2.31, 0, door);
  mesh(boxGeo(0.07, 2.35, 0.06, 1), M.chrome, 0.035, 1.17, 0, door); mesh(boxGeo(0.07, 2.35, 0.06, 1), M.chrome, 1.13, 1.17, 0, door);
  mesh(boxGeo(0.9, 0.05, 0.08, 1), M.chrome, 0.58, 1.05, 0.02, door);
  var dg = mesh(new THREE.PlaneGeometry(1.02, 2.2), M.glass, 0.58, 1.17, 0, door, false);
  var openSign = mkCanvas(256, 128), osg = openSign.getContext('2d'); osg.fillStyle = '#c8282e'; osg.fillRect(0, 0, 256, 128); osg.fillStyle = '#fff'; osg.font = '64px ' + F.slab; osg.textAlign = 'center'; osg.textBaseline = 'middle'; osg.fillText('OPEN', 128, 66);
  var osm = new THREE.MeshStandardMaterial({ map: toTex(openSign, { clamp: true }), roughness: 0.5 });
  var osMesh = mesh(new THREE.PlaneGeometry(0.2, 0.1), osm, 0.9, 2.08, 0.035, door, false);
  var cs = canvasSign([['SORRY', 40], ["WE'RE CLOSED", 34]], '#f3e6c8', '#7e1418', 256, 128);
  var csMesh = mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshStandardMaterial({ map: toTex(cs, { clamp: true }), roughness: 0.5 }), 1.0, 2.17, -0.036, door, false); csMesh.rotation.y = PI; csMesh.scale.setScalar(0.42);
  mesh(boxGeo(0.22, 0.12, 0.06, 1), M.chrome, 0.9, 2.08, 0, door);
  WORLD.door = door; WORLD.doorSign = osMesh;
  // window glass (planar reflection + rain shader assigned later in fx)
  var wg = new THREE.PlaneGeometry(12.7, 1.6);
  var win = new THREE.Mesh(wg, M.glass); win.position.set(-1.45, 1.75, 4.99); win.rotation.y = PI; win.renderOrder = 5; P.add(win);
  WORLD.window = win;
  // skirting AO strips
  [[0, -2.75, 16, 0], [0, 4.95, 16, 0]].forEach(function (s) { blob(P, s[0], s[1], s[2] + 1, 0.5, 0, 0.5); });
  blob(P, 7.9, 1.1, 0.5, 8, 0, 0.5); blob(P, -7.9, 1.1, 0.5, 8, 0, 0.5);
}

function buildCounter(P) {
  var x0 = D.counterX0, x1 = D.counterX1, w = x1 - x0, cx = (x0 + x1) / 2, zf = D.counterZf, zb = D.counterZb, d = zf - zb, cz = (zf + zb) / 2, y = D.counterY;
  // top (formica) with chrome edge band
  var top = mesh(roundSlab(w + 0.06, d + 0.08, 0.05, 0.05), M.formica, cx, y - 0.025, cz + 0.02, P); scaleUV(top.geometry, 1, 1);
  fixSlabUV(top.geometry, 1.0);
  B(w + 0.1, 0.07, 0.03, M.chrome, cx, y - 0.04, zf + 0.075);
  B(0.03, 0.07, d + 0.1, M.chrome, x0 - 0.05, y - 0.04, cz + 0.02); B(0.03, 0.07, d + 0.1, M.chrome, x1 + 0.05, y - 0.04, cz + 0.02);
  // front panel: red enamel with chrome ribs, kick plate
  B(w, 0.88, 0.06, M.paintRed, cx, 0.58, zf - 0.05);
  for (var i = 0; i < 3; i++) B(w + 0.01, 0.035, 0.075, M.chrome, cx, 0.32 + i * 0.22, zf - 0.03);
  B(w, 0.14, 0.12, M.chromeDull, cx, 0.07, zf - 0.1);
  B(w - 0.1, 0.95, 0.6, M.steel, cx, 0.5, cz - 0.05); // body
  // foot rail (chrome tube)
  var rail = new THREE.CylinderGeometry(0.022, 0.022, w, 10); rail.rotateZ(PI / 2);
  batchAdd(rail, M.chrome, cx, 0.24, zf + 0.12);
  for (var k = 0; k < 6; k++) { var bx = x0 + 0.3 + k * (w - 0.6) / 5; batchAdd(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8).rotateX(PI / 2), M.chrome, bx, 0.24, zf + 0.06); }
  blob(P, cx, zf + 0.2, w + 0.5, 0.7, 0, 0.6);
  WORLD.counterTop = top;
  // napkin dispensers / sugar / ketchup along the counter
  for (var s = 0; s < D.stools.length; s += 2) addCondiments(P, D.stools[s] + 0.5, y, zf - 0.22);
}
function fixSlabUV(g, tm) { // planar xz uv for extruded slabs
  var p = g.attributes.position, uv = g.attributes.uv;
  for (var i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tm, p.getZ(i) / tm);
  uv.needsUpdate = true;
}
function addCondiments(P, x, y, z) {
  // chrome napkin dispenser
  batchAdd(boxGeo(0.12, 0.14, 0.09, 0.5), M.chrome, x, y + 0.07, z);
  batchAdd(boxGeo(0.1, 0.02, 0.1, 1), M.enamelWhite, x, y + 0.15, z);
  // sugar pourer (glass + chrome cap)
  var sg = new THREE.CylinderGeometry(0.032, 0.036, 0.1, 14); batchAdd(sg, M.glassDark, x + 0.13, y + 0.05, z);
  batchAdd(new THREE.CylinderGeometry(0.02, 0.034, 0.04, 14), M.chrome, x + 0.13, y + 0.12, z);
  // ketchup & mustard
  batchAdd(new THREE.CylinderGeometry(0.028, 0.03, 0.17, 12), M.paintRed, x - 0.13, y + 0.085, z);
  batchAdd(new THREE.ConeGeometry(0.02, 0.05, 10), M.paintRed, x - 0.13, y + 0.195, z);
  var mus = stdMat({ color: 0xe6b81c, roughness: 0.35 }); mus.userData.tm = 1;
  batchAdd(new THREE.CylinderGeometry(0.028, 0.03, 0.17, 12), mus, x - 0.2, y + 0.085, z + 0.02);
  batchAdd(new THREE.ConeGeometry(0.02, 0.05, 10), mus, x - 0.2, y + 0.195, z + 0.02);
}
var STOOL_GEO = null;
function buildStools(P) {
  // lathe chrome pedestal + red vinyl seat cushion (tufted). seats swivel (separate meshes)
  var base = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.2, 0), new THREE.Vector2(0.2, 0.02), new THREE.Vector2(0.12, 0.05), new THREE.Vector2(0.04, 0.09), new THREE.Vector2(0.035, 0.62), new THREE.Vector2(0.09, 0.66), new THREE.Vector2(0.17, 0.68), new THREE.Vector2(0.18, 0.7)], 28);
  var cushion = new THREE.LatheGeometry([new THREE.Vector2(0, 0.7), new THREE.Vector2(0.185, 0.7), new THREE.Vector2(0.2, 0.72), new THREE.Vector2(0.205, 0.76), new THREE.Vector2(0.195, 0.79), new THREE.Vector2(0.15, 0.805), new THREE.Vector2(0, 0.81)], 28);
  scaleUV(cushion, 2, 0.6);
  var band = new THREE.CylinderGeometry(0.207, 0.207, 0.035, 28, 1, true);
  STOOL_GEO = { cushion: cushion };
  D.stools.forEach(function (x, i) {
    batchAdd(base, M.chrome, x, 0, D.stoolZ);
    var seat = mesh(cushion, i === 5 ? M.vinylP : M.vinyl, x, 0, D.stoolZ, P);
    seat.rotation.y = i * 0.7;
    batchAdd(band, M.chrome, x, 0.725, D.stoolZ);
    blob(P, x, D.stoolZ, 0.6, 0.6, 0, 0.7);
    SEATS.push({ id: 'S' + (i + 1), label: 'Counter ' + (i + 1), kind: 'stool', pos: new THREE.Vector3(x, 0.81, D.stoolZ), face: PI, seatMesh: seat, eatPos: new THREE.Vector3(x, D.counterY + 0.005, D.counterZf - 0.3), station: 'COUNTER' });
  });
}
function buildBooths(P) {
  var z0 = D.boothZ0, z1 = D.boothZ1, len = z1 - z0, cz = (z0 + z1) / 2;
  D.booths.forEach(function (bx, bi) {
    [-1, 1].forEach(function (sd) {
      var x = bx + sd * 0.7; // bench center
      var mat = (bi === 3 && sd === 1) ? M.vinylP : M.vinyl;
      // seat cushion
      var seat = roundSlab(0.52, len, 0.14, 0.05); fixSlabUV(seat, 0.6); batchAdd(seat, mat, x, 0.47, cz);
      // back cushion (slanted)
      var back = roundSlab(0.16, len, 0.7, 0.05); fixSlabUV(back, 0.6);
      var bb = new THREE.BoxGeometry(0.16, 0.7, len); batchAdd(boxGeo(0.14, 0.7, len, 0.6), mat, x + sd * 0.22, 0.88, cz, 0, 0, -sd * 0.08);
      // frame base & back shell (wood + chrome cap)
      batchAdd(boxGeo(0.56, 0.4, len, 1), M.wood, x, 0.2, cz);
      batchAdd(boxGeo(0.08, 1.25, len + 0.04, 1), M.wood, x + sd * 0.31, 0.63, cz);
      var cap = new THREE.CylinderGeometry(0.045, 0.045, len + 0.06, 12); cap.rotateX(PI / 2); batchAdd(cap, M.chrome, x + sd * 0.31, 1.27, cz);
      // front kick (chrome)
      batchAdd(boxGeo(0.56, 0.06, 0.02, 1), M.chrome, x, 0.42, z0 - 0.01);
      blob(P, x, cz, 0.9, len + 0.4, 0, 0.6);
      var seatX = bx + sd * 0.62, faceYaw = sd > 0 ? -PI / 2 : PI / 2;
      SEATS.push({ id: 'B' + (bi + 1) + (sd > 0 ? 'R' : 'L'), booth: bi + 1, side: sd, label: 'Booth ' + (bi + 1), kind: 'booth', pos: new THREE.Vector3(seatX, 0.6, cz - 0.15), face: faceYaw, eatPos: new THREE.Vector3(bx + sd * 0.22, 0.78, cz - 0.1), station: 'BOOTHS' });
    });
    // table: formica top with chrome edge, single pedestal + wall bracket
    var t = roundSlab(0.82, 1.15, 0.04, 0.04); fixSlabUV(t, 1); batchAdd(t, M.formicaCream, bx, 0.76, z1 - 0.62);
    var edge = new THREE.TorusGeometry(1, 0.012, 6, 32); // not used: chrome band via boxes
    batchAdd(boxGeo(0.84, 0.04, 0.02, 1), M.chrome, bx, 0.755, z1 - 1.2); batchAdd(boxGeo(0.02, 0.04, 1.17, 1), M.chrome, bx - 0.42, 0.755, z1 - 0.62); batchAdd(boxGeo(0.02, 0.04, 1.17, 1), M.chrome, bx + 0.42, 0.755, z1 - 0.62);
    batchAdd(new THREE.CylinderGeometry(0.04, 0.04, 0.74, 12), M.chrome, bx, 0.37, z1 - 0.7);
    batchAdd(new THREE.CylinderGeometry(0.25, 0.27, 0.025, 20), M.chrome, bx, 0.012, z1 - 0.7);
    blob(P, bx, z1 - 0.6, 1.0, 1.3, 0, 0.55);
    addCondiments(P, bx, 0.78, z1 - 0.18);
    // booth number plate on the bench end
    var nc = mkCanvas(128, 128), ng = nc.getContext('2d'); ng.fillStyle = '#d8dde2'; ng.beginPath(); ng.arc(64, 64, 60, 0, TAU); ng.fill(); ng.fillStyle = '#7e1418'; ng.font = '78px ' + F.slab; ng.textAlign = 'center'; ng.textBaseline = 'middle'; ng.fillText(String(bi + 1), 64, 70);
    var nm = new THREE.MeshStandardMaterial({ map: toTex(nc, { clamp: true }), metalness: 0.6, roughness: 0.3, transparent: true });
    var plate = mesh(new THREE.CircleGeometry(0.07, 24), nm, bx + 0.66, 1.05, z0 - 0.025, P, false); plate.rotation.y = PI;
    WORLD['boothPlate' + (bi + 1)] = plate;
    // jukebox wall-box (remote selector) on each table — little chrome box
    batchAdd(boxGeo(0.22, 0.2, 0.1, 0.5), M.chrome, bx, 0.88, z1 - 0.1);
  });
}
function buildBackBar(P) {
  // back counter along z=-2.55, coffee machine, shake mixer, cups, menu board above pass
  B(4.9, 0.92, 0.5, M.steel, 0.25, 0.46, -2.52); // under-counter
  var bt = roundSlab(5.0, 0.55, 0.04, 0.02); fixSlabUV(bt, 1); batchAdd(bt, M.formica, 0.25, 0.94, -2.52);
  B(2.2, 0.92, 0.5, M.steel, 3.5, 0.46, -2.52); var bt2 = roundSlab(2.3, 0.55, 0.04, 0.02); fixSlabUV(bt2, 1); batchAdd(bt2, M.formica, 3.5, 0.94, -2.52);
  // coffee machine (twin burner) at x=-2.4
  var cm = group(P, -1.85, 0.96, -2.55); WORLD.coffeeMachine = cm;
  mesh(boxGeo(0.62, 0.62, 0.36, 0.5), M.steel, 0, 0.31, -0.02, cm);
  mesh(boxGeo(0.64, 0.05, 0.42, 0.5), M.chrome, 0, 0.64, 0, cm);
  [-0.17, 0.17].forEach(function (ox, i) {
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), M.black, ox, 0.0, 0.08, cm);
    var pot = makeCoffeePot(); pot.position.set(ox, 0.012, 0.08); cm.add(pot); if (i === 0) WORLD.coffeePot = pot;
  });
  // stacked cups & saucers
  for (var c = 0; c < 4; c++) { var cup = makeCup(); cup.position.set(-1.3 + (c % 2) * 0.13, 0.96 + Math.floor(c / 2) * 0.09, -2.5); P.add(cup); }
  // shake mixer (mint enamel, chrome cup) at x=-1.0
  var sm = group(P, -0.8, 0.96, -2.55); WORLD.shakeMixer = sm;
  mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.05, 20), M.paintMint, 0, 0.025, 0, sm);
  mesh(boxGeo(0.08, 0.42, 0.08, 0.5), M.paintMint, 0, 0.26, -0.1, sm);
  var head = mesh(new THREE.SphereGeometry(0.1, 20, 12), M.paintMint, 0, 0.48, -0.03, sm); head.scale.set(1, 0.6, 1.4);
  var scup = mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.2, 18, 1, true), M.chrome, 0, 0.16, 0.06, sm); scup.material = M.chrome; WORLD.shakeCup = scup;
  // menu letter board above back bar (left of pass)
  var mb = new THREE.MeshStandardMaterial({ map: toTex(canvasMenuBoard(), { clamp: true }), roughness: 0.55, envMapIntensity: 0.6 });
  var board = mesh(new THREE.PlaneGeometry(2.4, 1.2), mb, -1.6, 2.35, -2.74, P, false); WORLD.menuBoard = board;
  // pie case on the front counter (glass dome over cake stand)
  var pc = group(P, 3.85, D.counterY, D.counterZb + 0.33); WORLD.pieCase = pc;
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32), M.chrome, 0, 0.01, 0, pc);
  mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.1, 12), M.chrome, 0, 0.07, 0, pc);
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.01, 32), M.ceramic, 0, 0.125, 0, pc);
  var pie = makePie(1); pie.position.y = 0.13; pc.add(pie); WORLD.pie = pie;
  var dome = mesh(new THREE.SphereGeometry(0.22, 28, 14, 0, TAU, 0, PI / 2), M.glass, 0, 0.12, 0, pc, false); dome.scale.y = 0.95; dome.renderOrder = 4;
  mesh(new THREE.SphereGeometry(0.025, 10, 8), M.chrome, 0, 0.335, 0, pc);
  // shelf with glasses above back counter (right side)
  B(2.2, 0.03, 0.25, M.chrome, 3.5, 1.75, -2.67);
  for (var g2 = 0; g2 < 8; g2++) batchAdd(new THREE.CylinderGeometry(0.035, 0.03, 0.12, 12), M.glassDark, 2.6 + g2 * 0.25, 1.83, -2.67);
}
function makeCup(coffee) {
  var g = new THREE.Group();
  var pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.03, 0), new THREE.Vector2(0.036, 0.006), new THREE.Vector2(0.042, 0.03), new THREE.Vector2(0.047, 0.07), new THREE.Vector2(0.044, 0.072), new THREE.Vector2(0.04, 0.035), new THREE.Vector2(0.0, 0.03)];
  mesh(new THREE.LatheGeometry(pts, 20), M.ceramic, 0, 0.012, 0, g);
  var sauc = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.05, 0), new THREE.Vector2(0.075, 0.01), new THREE.Vector2(0.078, 0.014), new THREE.Vector2(0.07, 0.012), new THREE.Vector2(0, 0.005)], 22);
  mesh(sauc, M.ceramic, 0, 0, 0, g);
  var h = mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12, PI * 1.2), M.ceramic, 0.048, 0.05, 0, g); h.rotation.z = -PI * 0.6;
  var rim = mesh(new THREE.TorusGeometry(0.046, 0.003, 4, 20), M.ceramicRim, 0, 0.081, 0, g); rim.rotation.x = PI / 2;
  if (coffee) { var cf = mesh(new THREE.CircleGeometry(0.042, 20), M.coffee, 0, 0.074, 0, g); cf.rotation.x = -PI / 2; g.userData.coffee = cf; }
  return g;
}
function makeCoffeePot() {
  var g = new THREE.Group();
  var pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.06, 0), new THREE.Vector2(0.085, 0.04), new THREE.Vector2(0.09, 0.08), new THREE.Vector2(0.07, 0.15), new THREE.Vector2(0.045, 0.2), new THREE.Vector2(0.05, 0.22)];
  var gl = mesh(new THREE.LatheGeometry(pts, 22), M.glassDark, 0, 0, 0, g, false); gl.renderOrder = 3;
  var liq = mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.005), new THREE.Vector2(0.058, 0.005), new THREE.Vector2(0.082, 0.04), new THREE.Vector2(0.086, 0.08), new THREE.Vector2(0, 0.08)], 20), M.coffee, 0, 0, 0, g, false);
  g.userData.liquid = liq;
  mesh(new THREE.CylinderGeometry(0.052, 0.05, 0.04, 20), M.black, 0, 0.22, 0, g);
  var hd = mesh(boxGeo(0.02, 0.1, 0.02, 1), M.black, 0.11, 0.13, 0, g); hd.rotation.z = 0.2;
  mesh(boxGeo(0.06, 0.02, 0.02, 1), M.black, 0.08, 0.2, 0, g);
  return g;
}
var PIE_MAT = null;
function makePie(slicesMissing) {
  if (!PIE_MAT) {
    var c = mkCanvas(256, 256), g = c.getContext('2d'); g.fillStyle = '#d79a52'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#8e0f1c'; for (var i = 0; i < 9; i++) for (var j = 0; j < 9; j++) if ((i + j) % 2) g.fillRect(i * 28 + 4, j * 28 + 4, 22, 22);
    g.strokeStyle = '#efc184'; g.lineWidth = 10; for (var k = 0; k < 10; k++) { g.beginPath(); g.moveTo(k * 28, 0); g.lineTo(k * 28, 256); g.stroke(); g.beginPath(); g.moveTo(0, k * 28); g.lineTo(256, k * 28); g.stroke(); }
    var t = toTex(c, { clamp: true });
    PIE_MAT = { top: stdMat({ map: t, roughness: 0.55 }), crust: stdMat({ color: 0xd9a05a, roughness: 0.7 }), fill: stdMat({ color: 0x7a0a16, roughness: 0.25 }) };
  }
  var g2 = new THREE.Group(); var miss = slicesMissing || 0, seg = TAU / 8;
  var start = miss * seg, len = TAU - start;
  mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.05, 32, 1, false, start, len), PIE_MAT.top, 0, 0.025, 0, g2).material = [PIE_MAT.crust, PIE_MAT.top, PIE_MAT.crust];
  if (miss) {
    [start, TAU].forEach(function (a) { var p = mesh(new THREE.PlaneGeometry(0.15, 0.05), PIE_MAT.fill, Math.sin(a) * 0.075, 0.025, Math.cos(a) * 0.075, g2, false); p.rotation.y = a + PI / 2; p.material.side = THREE.DoubleSide; });
  }
  return g2;
}
function buildKitchen(P) {
  var z = D.KZ0;
  // griddle station against back wall x 0..1.8
  B(2.2, 0.85, 0.75, M.steelG, 0.9, 0.425, z + 0.42);
  var gp = mesh(boxGeo(1.9, 0.04, 0.6, 1), M.griddle, 0.9, 0.87, z + 0.42, P); WORLD.griddle = gp;
  B(1.95, 0.12, 0.03, M.steelG, 0.9, 0.93, z + 0.12); B(0.03, 0.12, 0.6, M.steelG, -0.05, 0.93, z + 0.42); B(0.03, 0.12, 0.6, M.steelG, 1.85, 0.93, z + 0.42);
  B(1.9, 0.04, 0.08, M.steelG, 0.9, 0.86, z + 0.76); // grease trough
  for (var k = 0; k < 4; k++) batchAdd(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12).rotateX(PI / 2), M.black, 0.3 + k * 0.4, 0.6, z + 0.8);
  // hood: sloped canopy with baffle filters, a warm heat lamp strip and a duct to the ceiling
  B(2.7, 0.08, 1.05, M.steelG, 0.9, 2.3, z + 0.53); B(2.7, 0.42, 0.04, M.steelG, 0.9, 2.5, z + 1.05);
  B(0.04, 0.42, 1.05, M.steelG, -0.45, 2.5, z + 0.53); B(0.04, 0.42, 1.05, M.steelG, 2.25, 2.5, z + 0.53);
  B(2.7, 0.04, 1.05, M.steelG, 0.9, 2.71, z + 0.53); B(0.9, 0.42, 0.6, M.steel, 0.9, 2.92, z + 0.35);
  for (var f2 = 0; f2 < 5; f2++) { var flt = boxGeo(0.48, 0.32, 0.02, 0.5); batchAdd(flt, M.chromeDull, -0.15 + f2 * 0.52, 2.5, z + 0.15, 0, 0.45); }
  var lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.6, 0.7) }); var lamp = mesh(new THREE.BoxGeometry(2.4, 0.02, 0.04), lampM, 0.9, 2.255, z + 0.9, P, false); WORLD.hoodLamp = lampM;
  // squeeze bottles, spatulas, egg carton, bread, batter bowl, plate stack
  var sqR = stdMat({ color: 0xc8202a, roughness: 0.35 }), sqY = stdMat({ color: 0xe6b81c, roughness: 0.35 }), sqW = stdMat({ color: 0xece6d8, roughness: 0.4 }); [sqR, sqY, sqW].forEach(function (m) { m.userData.tm = 1; });
  [[sqR, 1.95], [sqY, 2.03], [sqW, 2.11]].forEach(function (q) { batchAdd(new THREE.CylinderGeometry(0.03, 0.032, 0.17, 12), q[0], q[1], 0.93 + 0.085, z + 0.2); batchAdd(new THREE.ConeGeometry(0.022, 0.06, 10), q[0], q[1], 0.93 + 0.2, z + 0.2); });
  batchAdd(boxGeo(0.3, 0.07, 0.1, 0.5), stdMat({ color: 0xbfae8e, roughness: 0.95 }), -0.15, 0.965, z + 0.6, 0.2);
  for (var e2 = 0; e2 < 6; e2++) batchAdd(new THREE.SphereGeometry(0.022, 10, 8), stdMat({ color: 0xf1e8d6, roughness: 0.6 }), -0.27 + (e2 % 3) * 0.08, 1.01, z + 0.57 + Math.floor(e2 / 3) * 0.05, 0.2);
  var bowl = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.06, 0), new THREE.Vector2(0.13, 0.09), new THREE.Vector2(0.125, 0.095), new THREE.Vector2(0.055, 0.008), new THREE.Vector2(0, 0.008)], 20); batchAdd(bowl, M.steel, -1.8, 0.95, -3.45);
  batchAdd(new THREE.CylinderGeometry(0.115, 0.115, 0.01, 20), stdMat({ color: 0xf3e0b0, roughness: 0.5 }), -1.8, 1.02, -3.45);
  for (var p2 = 0; p2 < 9; p2++) batchAdd(new THREE.CylinderGeometry(0.125, 0.11, 0.012, 24), M.ceramic, 2.55, 1.29 + p2 * 0.014, -2.82);
  // pot rack over the prep table
  B(1.8, 0.03, 0.03, M.chrome, -1.3, 2.35, -3.55); batchAdd(new THREE.CylinderGeometry(0.005, 0.005, 0.75, 4), M.chrome, -2.1, 2.72, -3.55); batchAdd(new THREE.CylinderGeometry(0.005, 0.005, 0.75, 4), M.chrome, -0.5, 2.72, -3.55);
  [[-2.0, 0.16], [-1.6, 0.13], [-1.15, 0.18], [-0.7, 0.11]].forEach(function (pp) { batchAdd(new THREE.CylinderGeometry(pp[1], pp[1] * 0.9, pp[1] * 0.8, 20, 1, true), M.steel, pp[0], 2.1, -3.55); batchAdd(new THREE.CircleGeometry(pp[1] * 0.9, 20).rotateX(-PI / 2), M.steel, pp[0], 2.1 - pp[1] * 0.4, -3.55); });
  // wall shelf with cans & jars, calendar, fire extinguisher
  B(1.6, 0.03, 0.26, M.steel, 3.2, 1.6, z + 0.15);
  var canCols = [0xb8282e, 0x2f6e9a, 0xd9a520, 0x3a7a3a, 0xe8e0c8];
  for (var cn = 0; cn < 10; cn++) { var cm2 = stdMat({ color: canCols[cn % 5], roughness: 0.35, metalness: 0.3 }); cm2.userData.tm = 1; batchAdd(new THREE.CylinderGeometry(0.045, 0.045, 0.12 + (cn % 3) * 0.03, 14), cm2, 2.5 + cn * 0.15, 1.68 + (cn % 3) * 0.015, z + 0.15); }
  var calC = mkCanvas(256, 340), cg2 = calC.getContext('2d'); cg2.fillStyle = '#f6efdc'; cg2.fillRect(0, 0, 256, 340); drawSunny(cg2, 128, 100, 50, { wave: 0.5 }); cg2.fillStyle = '#c8282e'; cg2.font = '26px ' + F.slab; cg2.textAlign = 'center'; cg2.fillText('NOVEMBER', 128, 196);
  cg2.fillStyle = '#333'; cg2.font = '16px ' + F.ui; for (var d2 = 0; d2 < 30; d2++) cg2.fillText(String(d2 + 1), 30 + (d2 % 7) * 32, 226 + Math.floor(d2 / 7) * 24); cg2.strokeStyle = '#c8282e'; cg2.lineWidth = 3; cg2.beginPath(); cg2.arc(30 + (22 % 7) * 32, 226 + Math.floor(22 / 7) * 24 - 6, 13, 0, TAU); cg2.stroke();
  var cal = mesh(new THREE.PlaneGeometry(0.34, 0.45), new THREE.MeshStandardMaterial({ map: toTex(calC, { clamp: true }), roughness: 0.8 }), -0.9, 1.75, z + 0.07, P, false);
  var fe = stdMat({ color: 0xc0141c, roughness: 0.3, metalness: 0.2 }); fe.userData.tm = 1; batchAdd(new THREE.CylinderGeometry(0.075, 0.075, 0.45, 16), fe, -4.2, 0.6, z + 0.12); batchAdd(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 10), M.black, -4.2, 0.86, z + 0.12);
  // mop bucket + boxes
  batchAdd(new THREE.CylinderGeometry(0.2, 0.17, 0.32, 16), stdMat({ color: 0xd6a51c, roughness: 0.5 }), -3.9, 0.16, -4.85);
  batchAdd(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 6), M.wood, -3.85, 0.75, -4.8, 0, 0.15);
  // fryer x 2.3
  B(0.6, 0.9, 0.7, M.steel, 2.35, 0.45, z + 0.42); mesh(boxGeo(0.46, 0.02, 0.5, 1), stdMat({ color: 0x6b4a14, roughness: 0.08 }), 2.35, 0.86, z + 0.42, P);
  // prep table (stainless) with burger fixings, center
  B(2.0, 0.06, 0.8, M.steel, -1.3, 0.92, -3.55); B(2.0, 0.04, 0.7, M.steel, -1.3, 0.25, -3.55);
  [[-2.25, -3.2], [-0.35, -3.2], [-2.25, -3.9], [-0.35, -3.9]].forEach(function (p) { batchAdd(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), M.steel, p[0], 0.45, p[1]); });
  // shelving + boxes on left
  for (var s = 0; s < 3; s++) B(1.2, 0.03, 0.45, M.steel, -4.8, 0.5 + s * 0.6, z + 0.3);
  for (var b = 0; b < 5; b++) B(0.35, 0.3, 0.35, M.card, -5.2 + (b % 3) * 0.4, 0.68 + Math.floor(b / 3) * 0.6, z + 0.3);
  // sink
  B(1.0, 0.9, 0.6, M.steel, -4.6, 0.45, -3.2); mesh(boxGeo(0.7, 0.02, 0.4, 1), M.black, -4.6, 0.91, -3.2, P);
  // back door (steel, push bar) at x -2.6 — hinged group
  var bd = group(P, -3.05, 0, z + 0.06); WORLD.backDoor = bd;
  mesh(boxGeo(0.95, 2.1, 0.06, 1), stdMat({ color: 0x6f7a74, roughness: 0.5, metalness: 0.6 }), 0.475, 1.05, 0, bd);
  mesh(boxGeo(0.7, 0.05, 0.06, 1), M.chrome, 0.475, 1.0, 0.06, bd);
  var exitC = mkCanvas(256, 96), eg = exitC.getContext('2d'); eg.fillStyle = '#1a0000'; eg.fillRect(0, 0, 256, 96); eg.fillStyle = '#ff2a2a'; eg.font = '64px ' + F.slab; eg.textAlign = 'center'; eg.textBaseline = 'middle'; eg.fillText('EXIT', 128, 52);
  var em = new THREE.MeshBasicMaterial({ map: toTex(exitC, { clamp: true }), color: new THREE.Color(2.2, 2.2, 2.2) });
  mesh(new THREE.PlaneGeometry(0.4, 0.15), em, -2.58, 2.35, z + 0.07, P, false);
  // order wheel (ticket rail) at pass window, kitchen side
  B(2.3, 0.04, 0.04, M.chrome, 1.4, 1.98, -2.86);
  // fluorescent tubes (2)
  [[-1.5, -4.0], [1.2, -3.6], [3.6, -4.0]].forEach(function (p) {
    B(1.3, 0.05, 0.22, M.steel, p[0], D.H - 0.03, p[1]);
    var tube = new THREE.CylinderGeometry(0.018, 0.018, 1.2, 8); tube.rotateZ(PI / 2);
    batchAdd(tube, M.fluor, p[0], D.H - 0.07, p[1] - 0.05); batchAdd(tube, M.fluor, p[0], D.H - 0.07, p[1] + 0.05);
  });
  // utensils on the wall rail
  B(1.6, 0.03, 0.03, M.chrome, -1.2, 1.6, z + 0.05);
  for (var u = 0; u < 6; u++) { batchAdd(boxGeo(0.06, 0.32, 0.01, 1), M.steel, -1.85 + u * 0.26, 1.42, z + 0.07); }
}
function buildFreezer(P) {
  var x0 = 5.05, x1 = 8, z0 = D.KZ0, z1 = -2.8;
  // interior frost box
  B(0.06, D.H, z1 - z0, M.frost, x1 - 0.03, D.H / 2, (z0 + z1) / 2);
  B(x1 - x0, D.H, 0.06, M.frost, (x0 + x1) / 2, D.H / 2, z0 + 0.03);
  B(x1 - x0, D.H, 0.06, M.frost, (x0 + x1) / 2, D.H / 2, z1 - 0.03);
  B(x1 - x0, 0.06, z1 - z0, M.frost, (x0 + x1) / 2, D.H - 0.03, (z0 + z1) / 2);
  var ff = new THREE.PlaneGeometry(x1 - x0, z1 - z0); ff.rotateX(-PI / 2); mesh(ff, M.steel, (x0 + x1) / 2, 0.005, (z0 + z1) / 2, P, false);
  // shelves with boxes, hanging meat-ish shapes (wrapped), ice
  for (var s = 0; s < 4; s++) B(0.5, 0.03, 2.2, M.steel, 7.6, 0.4 + s * 0.5, -4.0);
  for (var b = 0; b < 8; b++) B(0.35, 0.25, 0.4, M.card, 7.6, 0.55 + Math.floor(b / 2) * 0.5, -4.8 + (b % 2) * 0.9 + (b % 3) * 0.2);
  var wrap = stdMat({ color: 0xd9d2c8, roughness: 0.6 }); wrap.userData.tm = 1;
  for (var h = 0; h < 3; h++) { var sp = new THREE.SphereGeometry(0.16, 12, 10); sp.scale(1, 2.1, 1); batchAdd(sp, wrap, 6.0 + h * 0.5, 1.9, -4.7); batchAdd(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 4), M.chrome, 6.0 + h * 0.5, 2.6, -4.7); }
  // inner wall of the walk-in (frosted) with the inside face of the door
  B(0.06, D.H, 0.75, M.frost, 5.1, D.H / 2, -4.83); B(0.06, D.H, 0.5, M.frost, 5.1, D.H / 2, -3.05); B(0.06, 0.95, 1.08, M.frost, 5.1, 2.62, -3.87);
  B(0.05, 2.08, 1.04, M.steel, 5.11, 1.04, -3.87);
  B(0.06, 0.06, 0.22, M.chrome, 5.16, 1.1, -4.25); B(0.06, 0.18, 0.04, stdMat({ color: 0xb01018, roughness: 0.4 }), 5.16, 1.0, -4.3);
  var frostLight = mesh(new THREE.BoxGeometry(0.4, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 2.6, 3.2) }), 6.6, D.H - 0.05, -4.0, P, false);
  // freezer door (heavy, with latch) on the wall x=5, z -4.4..-3.4
  var fd = group(P, 4.89, 0, -3.35); WORLD.freezerDoor = fd;
  mesh(boxGeo(0.12, 2.1, 1.05, 1), M.steel, 0, 1.05, -0.525, fd);
  mesh(boxGeo(0.06, 0.08, 0.3, 1), M.chrome, -0.09, 1.1, -0.85, fd);
  mesh(boxGeo(0.04, 2.0, 0.04, 1), M.rubber, -0.06, 1.05, -1.0, fd);
  var tc = mkCanvas(256, 128), tg = tc.getContext('2d'); tg.fillStyle = '#e9e4d8'; tg.fillRect(0, 0, 256, 128); tg.fillStyle = '#1e5a7a'; tg.font = '40px ' + F.slab; tg.textAlign = 'center'; tg.fillText('WALK-IN', 128, 52); tg.font = '30px ' + F.ui; tg.fillText('KEEP CLOSED', 128, 100);
  var tm = mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshStandardMaterial({ map: toTex(tc, { clamp: true }), roughness: 0.6 }), -0.065, 1.6, -0.52, fd, false); tm.rotation.y = -PI / 2;
  // thermometer dial
  var dial = mesh(new THREE.CircleGeometry(0.06, 20), M.enamelWhite, -0.065, 1.35, -0.25, fd, false); dial.rotation.y = -PI / 2;
  // inner side walls between kitchen and freezer at x=5 above door etc handled by kitchen wall
  WORLD.freezerInside = new THREE.Vector3(6.6, 1.6, -4.0);
}
function buildLeftWall(P) {
  // jukebox (arched, wood cabinet, chrome grille, glowing face) at x=-7.55, z=3.0, facing +x
  var jb = group(P, -7.55, 0, 2.95); jb.rotation.y = PI / 2; WORLD.jukebox = jb;
  mesh(boxGeo(1.0, 1.05, 0.62, 1), M.wood, 0, 0.525, 0, jb);
  var arch = new THREE.CylinderGeometry(0.5, 0.5, 0.62, 28, 1, false, -PI / 2, PI); arch.rotateX(PI / 2); arch.rotateZ(PI / 2);
  var am = mesh(arch, M.wood, 0, 1.05, 0, jb); am.rotation.set(0, 0, 0);
  var jfTex = toTex(canvasJukeboxFace(), { clamp: true });
  var jfMat = new THREE.MeshBasicMaterial({ map: jfTex, color: new THREE.Color(1.9, 1.6, 1.4) }); WORLD.jukeFaceMat = jfMat;
  var face = mesh(new THREE.PlaneGeometry(0.86, 1.29), jfMat, 0, 0.82, 0.315, jb, false);
  // glass dome over the record window
  var jg = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24, 1, true, -PI / 2, PI), M.glass, 0, 1.12, 0.34, jb, false); jg.rotation.x = PI / 2; jg.rotation.z = PI / 2; jg.renderOrder = 4;
  for (var g = 0; g < 7; g++) mesh(boxGeo(0.72, 0.015, 0.03, 1), M.chrome, 0, 0.12 + g * 0.045, 0.33, jb);
  // light pillars on sides
  var pill = neonMat(3.0, 1.2, 0.5);
  [-0.47, 0.47].forEach(function (x) { mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 10), pill, x, 0.6, 0.3, jb, false); });
  WORLD.jukePillar = pill;
  WORLD.jukeboxPos = new THREE.Vector3(-7.2, 1.0, 2.95);
  blob(P, -7.5, 2.95, 1.0, 1.4, 0, 0.7);
  // pink payphone on wall at z=0.25? (between jukebox & hallway) -> z=1.6
  var ph = group(P, -7.93, 1.35, 1.75); ph.rotation.y = PI / 2; WORLD.phone = ph;
  mesh(boxGeo(0.28, 0.5, 0.14, 0.5), M.pinkPhone, 0, 0, 0.07, ph);
  mesh(boxGeo(0.22, 0.14, 0.02, 0.5), M.chrome, 0, 0.08, 0.145, ph);
  var keys = mkCanvas(128, 128), kg = keys.getContext('2d'); kg.fillStyle = '#ddd'; kg.fillRect(0, 0, 128, 128); kg.fillStyle = '#222'; kg.font = '26px ' + F.ui; kg.textAlign = 'center';
  for (var i = 0; i < 12; i++) kg.fillText('123456789*0#'[i], 24 + (i % 3) * 40, 30 + Math.floor(i / 3) * 30);
  var kp = mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshStandardMaterial({ map: toTex(keys, { clamp: true }), roughness: 0.4 }), 0, -0.06, 0.142, ph, false);
  var handset = group(ph, -0.17, 0.0, 0.13); WORLD.handset = handset;
  mesh(boxGeo(0.05, 0.3, 0.05, 1), M.pinkPhone, 0, 0, 0, handset);
  mesh(new THREE.SphereGeometry(0.045, 12, 8), M.pinkPhone, 0, 0.15, 0.01, handset); mesh(new THREE.SphereGeometry(0.045, 12, 8), M.pinkPhone, 0, -0.15, 0.01, handset);
  var cord = new THREE.TorusGeometry(0.03, 0.006, 4, 12); for (var c = 0; c < 6; c++) mesh(cord, M.pinkPhone, -0.04, -0.2 - c * 0.025, 0.02, handset).rotation.y = PI / 2;
  WORLD.phonePos = new THREE.Vector3(-7.8, 1.4, 1.75);
  // restroom sign above the hallway opening
  var rs = new THREE.MeshStandardMaterial({ map: toTex(canvasSign([['RESTROOMS', 44]], '#2f7e6e', '#f3e6c8', 512, 128), { clamp: true }), roughness: 0.5 });
  var rsm = mesh(new THREE.PlaneGeometry(0.9, 0.22), rs, -7.94, 2.5, 0.2, P, false); rsm.rotation.y = PI / 2;
  // coat rack/plant? a framed photo + clock
}
function buildRegister(P) {
  var x = D.register.x, z = D.register.z;
  // cashier stand
  B(2.0, 1.0, 0.55, M.paintRed, x, 0.5, z); for (var i = 0; i < 2; i++) B(2.01, 0.035, 0.57, M.chrome, x, 0.35 + i * 0.3, z);
  var st = roundSlab(2.1, 0.62, 0.04, 0.03); fixSlabUV(st, 1); batchAdd(st, M.formica, x, 1.02, z);
  blob(P, x, z, 2.4, 1, 0, 0.6);
  // brass/chrome cash register
  var reg = group(P, x - 0.2, 1.04, z); WORLD.register = reg;
  var brass = stdMat({ color: 0xd2ad66, roughness: 0.42, metalness: 0.85, envMapIntensity: 1.4 });
  mesh(boxGeo(0.42, 0.18, 0.4, 0.5), brass, 0, 0.09, 0, reg);
  var body = mesh(boxGeo(0.4, 0.22, 0.24, 0.5), brass, 0, 0.27, 0.06, reg); body.rotation.x = -0.25;
  mesh(boxGeo(0.3, 0.09, 0.03, 0.5), M.black, 0, 0.44, 0.08, reg);
  for (var k = 0; k < 15; k++) mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 10), M.enamelWhite, -0.12 + (k % 5) * 0.06, 0.22 + Math.floor(k / 5) * 0.03, -0.1 - Math.floor(k / 5) * 0.04, reg);
  // receipt printer + desk phone (to call the manager) + light switch panel on the wall behind (x=8)
  var tel = group(P, x + 0.6, 1.04, z - 0.05); WORLD.deskPhone = tel;
  mesh(boxGeo(0.2, 0.08, 0.22, 0.5), M.black, 0, 0.04, 0, tel); var hs = mesh(boxGeo(0.22, 0.05, 0.06, 0.5), M.black, 0, 0.1, 0.03, tel);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16), M.enamelWhite, 0, 0.085, -0.04, tel).rotation.x = 0.3;
  var sw = group(P, 7.94, 1.4, 0.9); sw.rotation.y = -PI / 2; WORLD.switchPanel = sw;
  mesh(boxGeo(0.4, 0.26, 0.03, 0.5), M.chrome, 0, 0, 0, sw);
  WORLD.switches = [];
  for (var s2 = 0; s2 < 2; s2++) { var sb = mesh(boxGeo(0.04, 0.09, 0.03, 1), M.enamelWhite, -0.08 + s2 * 0.16, 0, 0.03, sw); WORLD.switches.push(sb); }
  var lc = mkCanvas(256, 64), lg = lc.getContext('2d'); lg.fillStyle = '#ddd'; lg.fillRect(0, 0, 256, 64); lg.fillStyle = '#222'; lg.font = '26px ' + F.ui; lg.textAlign = 'center'; lg.fillText('LIGHTS     NEON', 128, 42);
  mesh(new THREE.PlaneGeometry(0.36, 0.08), new THREE.MeshStandardMaterial({ map: toTex(lc, { clamp: true }) }), 0, 0.17, 0.02, sw, false);
  // "please wait to be seated" stand
  var ws = group(P, 5.2, 0, 3.7); ws.rotation.y = PI * 0.85;
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), M.chrome, 0, 0.6, 0, ws); mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.02, 20), M.chrome, 0, 0.01, 0, ws);
  var wsm = new THREE.MeshStandardMaterial({ map: toTex(canvasSign([['PLEASE WAIT', 46], ['TO BE SEATED', 46]], '#f3e6c8', '#c8282e', 512, 256), { clamp: true }), roughness: 0.5 });
  mesh(new THREE.PlaneGeometry(0.5, 0.25), wsm, 0, 1.25, 0.01, ws, false);
  var back = mesh(new THREE.PlaneGeometry(0.5, 0.25), M.paintRed, 0, 1.25, -0.005, ws, false); back.rotation.y = PI;
  WORLD.waitSpot = new THREE.Vector3(5.6, 0, 3.9);
}
function buildDecor(P) {
  // pendant lamps: counter (5) and booths (4)
  var shadeG = new THREE.LatheGeometry([new THREE.Vector2(0.02, 0.0), new THREE.Vector2(0.05, -0.02), new THREE.Vector2(0.17, -0.2), new THREE.Vector2(0.18, -0.22), new THREE.Vector2(0.16, -0.21), new THREE.Vector2(0.04, -0.03)], 24);
  var cord = new THREE.CylinderGeometry(0.006, 0.006, 1, 5);
  WORLD.pendants = [];
  function pendant(x, z, len, mat) {
    batchAdd(cord.clone().scale(1, len, 1), M.black, x, D.H - len / 2, z);
    var y = D.H - len; batchAdd(shadeG, mat, x, y, z);
    var bulb = mesh(new THREE.SphereGeometry(0.055, 14, 10), M.bulb, x, y - 0.12, z, P, false); WORLD.pendants.push(bulb);
  }
  var shadeRed = stdMat({ color: 0xa8141c, roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide }); shadeRed.userData.tm = 1;
  [-2.5, -0.5, 1.5, 3.5].forEach(function (x) { pendant(x, -1.55, 0.75, M.chrome); });
  D.booths.forEach(function (x) { pendant(x, 4.35, 0.95, shadeRed); });
  // interior neon over pass window
  var nt = toTex(canvasNeonInterior(), { clamp: true });
  var nmat = new THREE.MeshBasicMaterial({ map: nt, transparent: true, color: new THREE.Color(2.6, 2.6, 2.6), depthWrite: false, blending: THREE.AdditiveBlending });
  var backing = mesh(boxGeo(2.9, 1.0, 0.03, 1), M.black, 1.5, 2.55, -2.74, P, false);
  var neon = mesh(new THREE.PlaneGeometry(2.8, 1.05), nmat, 1.5, 2.55, -2.72, P, false); WORLD.neonIn = neon; WORLD.neonInMat = nmat;
  var et = toTex(canvasNeonEyes(0), { clamp: true });
  var emat = new THREE.MeshBasicMaterial({ map: et, transparent: true, color: new THREE.Color(2.6, 2.6, 2.6), depthWrite: false, blending: THREE.AdditiveBlending });
  var eyes = mesh(new THREE.PlaneGeometry(0.7, 0.35), emat, 1.5 - 1.4 + 170 / 1024 * 2.8, 2.55 + 0.525 - 0.2 * 1.05 - 0.17 + 0.04, -2.715, P, false);
  eyes.position.set(1.5 - 1.4 + (170 / 1024) * 2.8, 2.55 + 1.05 / 2 - (178 / 384) * 1.05, -2.715);
  WORLD.neonEyes = eyes; WORLD.neonEyesMat = emat;
  // wall clock above the hallway side, posters on plaster
  var clk = group(P, -4.8, 2.25, -2.74); WORLD.clock = clk;
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 40).rotateX(PI / 2), M.chrome, 0, 0, -0.01, clk);
  mesh(new THREE.CircleGeometry(0.27, 40), new THREE.MeshStandardMaterial({ map: toTex(canvasClock(), { clamp: true }), roughness: 0.4 }), 0, 0, 0.02, clk, false);
  var hand = function (len, w) { var h = mesh(boxGeo(w, len, 0.005, 1), M.black, 0, 0, 0.03, clk, false); h.geometry.translate(0, len / 2 - 0.02, 0); return h; };
  WORLD.clockH = hand(0.15, 0.018); WORLD.clockM = hand(0.22, 0.012);
  mesh(new THREE.CircleGeometry(0.3, 40), M.glass, 0, 0, 0.035, clk, false);
  posterAt(P, 'rise', -6.0, 2.05, -2.74, 0, 0.62);
  posterAt(P, 'pie', 7.93, 2.0, 3.3, -PI / 2, 0.5);
  posterAt(P, 'photo', -7.93, 2.05, 4.0, PI / 2, 0.42);
  posterAt(P, 'employee', 7.93, 2.05, -1.6, -PI / 2, 0.42);
  // old CRT TV on a bracket shelf above back bar (left)
  var tv = group(P, -3.5, 2.05, -2.45); tv.rotation.y = 0.25; WORLD.tv = tv;
  B(0.7, 0.03, 0.5, M.chromeDull, -3.5, 1.78, -2.5);
  var cab = stdMat({ color: 0x3a2a1c, roughness: 0.45 }); cab.userData.tm = 1;
  mesh(boxGeo(0.62, 0.48, 0.45, 1), M.woodLight, 0, 0, -0.05, tv);
  var scr = new THREE.SphereGeometry(0.6, 24, 16, -0.37, 0.74, PI / 2 - 0.28, 0.56); scr.rotateY(PI / 2 * 0); // curved glass
  var tvc = mkCanvas(256, 192); WORLD.tvCanvas = tvc;
  var tvTex = toTex(tvc, { clamp: true, nomip: true }); WORLD.tvTex = tvTex;
  var tvMat = new THREE.MeshBasicMaterial({ map: tvTex, color: new THREE.Color(1.6, 1.6, 1.6) }); WORLD.tvMat = tvMat;
  var screen = mesh(new THREE.PlaneGeometry(0.46, 0.34, 8, 6), tvMat, -0.06, 0.02, 0.176, tv, false);
  bulgeGeo(screen.geometry, 0.02); WORLD.tvScreen = screen;
  mesh(boxGeo(0.07, 0.3, 0.01, 1), M.black, 0.24, 0, 0.176, tv);
  var ant = new THREE.CylinderGeometry(0.004, 0.004, 0.4, 4); var a1 = mesh(ant, M.chrome, -0.05, 0.42, -0.1, tv); a1.rotation.z = 0.5; var a2 = mesh(ant, M.chrome, 0.05, 0.42, -0.1, tv); a2.rotation.z = -0.5;
  // ceiling fan-less HVAC vents
  for (var v = 0; v < 3; v++) B(0.5, 0.02, 0.5, M.chromeDull, -5 + v * 5, D.H - 0.01, 1.8);
}
function bulgeGeo(g, amt) { var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i) / 0.23, y = p.getY(i) / 0.17; p.setZ(i, amt * (1 - x * x * 0.6 - y * y * 0.6)); } g.computeVertexNormals(); }
function posterAt(P, kind, x, y, z, ry, w) {
  var tex = toTex(canvasPoster(kind), { clamp: true });
  var m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 });
  var pm = mesh(new THREE.PlaneGeometry(w, w * 1.375), m, x, y, z, P, false); pm.rotation.y = ry; pm.translateZ(0.012);
  var fr = mesh(boxGeo(w + 0.05, w * 1.375 + 0.05, 0.02, 1), M.chromeDull, x, y, z, P, false); fr.rotation.y = ry; fr.translateZ(0.004);
  WORLD.signs[kind] = pm; return pm;
}
function buildExterior(X) {
  // parking lot (wet asphalt), sidewalk, highway, desert, mountains, sky
  var lot = new THREE.PlaneGeometry(70, 28); scaleUV(lot, 70 / 6, 28 / 6); lot.rotateX(-PI / 2); mesh(lot, M.asphalt, 0, -0.01, 19, X, false);
  var sw = boxGeo(17.5, 0.12, 1.6, 1.2); batchAdd(sw, M.plaster, 0, 0.0, 5.9);
  var road = new THREE.PlaneGeometry(400, 9); var roadMat = stdMat({ color: 0x1d1d20, roughness: 0.35, envMapIntensity: 1.4, map: TEX.asphalt.map, roughnessMap: TEX.asphalt.roughnessMap }); scaleUV(road, 400 / 6, 9 / 6); road.rotateX(-PI / 2);
  mesh(road, roadMat, 0, -0.005, 37.5, X, false);
  // road dashes
  for (var i = -40; i < 40; i++) batchAdd(boxGeo(2.2, 0.01, 0.14, 1), M.paintCream, i * 5, 0.0, 37.5);
  var des = new THREE.PlaneGeometry(600, 300); scaleUV(des, 600 / 8, 300 / 8); des.rotateX(-PI / 2); mesh(des, M.sand, 0, -0.03, 190, X, false);
  var des2 = new THREE.PlaneGeometry(600, 200); scaleUV(des2, 75, 25); des2.rotateX(-PI / 2); mesh(des2, M.sand, 0, -0.03, -105, X, false);
  // lot stripes
  for (var s = -6; s <= 6; s++) batchAdd(boxGeo(0.1, 0.01, 4.5, 1), M.paintCream, s * 2.8, 0.0, 10);
  // mountains silhouette ring
  var mg = new THREE.BufferGeometry(), mp = [], rnd = makeRNG(9);
  for (var k = 0; k < 64; k++) {
    var a0 = k / 64 * TAU, a1 = (k + 1) / 64 * TAU, r = 230, h0 = 8 + fbm(k * 0.3, 1, 3) * 34, h1 = 8 + fbm((k + 1) * 0.3, 1, 3) * 34;
    mp.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r, Math.cos(a1) * r, h1, Math.sin(a1) * r);
    mp.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, h1, Math.sin(a1) * r, Math.cos(a0) * r, h0, Math.sin(a0) * r);
  }
  mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
  var mtn = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: 0x07080c, side: THREE.DoubleSide, fog: false })); X.add(mtn);
  // sky dome with stars, moon, distant clouds (canvas)
  var sc = mkCanvas(1024, 512), sg = sc.getContext('2d');
  var sgrad = sg.createLinearGradient(0, 0, 0, 512); sgrad.addColorStop(0, '#020308'); sgrad.addColorStop(0.62, '#0a0e1a'); sgrad.addColorStop(0.75, '#1b1a24'); sgrad.addColorStop(1, '#2a2026');
  sg.fillStyle = sgrad; sg.fillRect(0, 0, 1024, 512);
  for (var st = 0; st < 900; st++) { var sy = Math.pow(rnd(), 1.6) * 330; sg.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.8 * (1 - sy / 380)) + ')'; sg.fillRect(rnd() * 1024, sy, rnd() < 0.05 ? 2 : 1, rnd() < 0.05 ? 2 : 1); }
  for (var cl = 0; cl < 40; cl++) { var cx2 = rnd() * 1024, cy2 = 200 + rnd() * 140; var cg2 = sg.createRadialGradient(cx2, cy2, 0, cx2, cy2, 60 + rnd() * 90); cg2.addColorStop(0, 'rgba(40,40,58,0.35)'); cg2.addColorStop(1, 'rgba(40,40,58,0)'); sg.fillStyle = cg2; sg.fillRect(cx2 - 160, cy2 - 160, 320, 320); }
  sg.fillStyle = '#e8e4d4'; sg.beginPath(); sg.arc(300, 120, 16, 0, TAU); sg.fill(); var mgl = sg.createRadialGradient(300, 120, 10, 300, 120, 80); mgl.addColorStop(0, 'rgba(220,220,200,0.35)'); mgl.addColorStop(1, 'rgba(220,220,200,0)'); sg.fillStyle = mgl; sg.fillRect(200, 20, 200, 200);
  var skyT = toTex(sc, {}); skyT.wrapT = THREE.ClampToEdgeWrapping;
  var skyMat = new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, color: new THREE.Color(0.9, 0.9, 0.9) }); WORLD.skyMat = skyMat;
  var sky = new THREE.Mesh(new THREE.SphereGeometry(280, 32, 16, 0, TAU, 0, PI / 2 + 0.1), skyMat); X.add(sky); WORLD.sky = sky;
  // big roadside sign on a pole (left of lot)
  var sp = group(X, -9.5, 0, 11);
  mesh(new THREE.CylinderGeometry(0.14, 0.18, 7.5, 12), M.steel, 0, 3.75, 0, sp);
  var signTex = toTex(canvasExteriorSign(true), { clamp: true });
  var signMat = new THREE.MeshBasicMaterial({ map: signTex, color: new THREE.Color(2.3, 2.3, 2.3) }); WORLD.exSignMat = signMat;
  var sb = mesh(boxGeo(4.4, 3.3, 0.3, 1), M.black, 0, 8.6, 0, sp);
  var sf = mesh(new THREE.PlaneGeometry(4.2, 3.15), signMat, 0, 8.6, 0.16, sp, false);
  var sf2 = mesh(new THREE.PlaneGeometry(4.2, 3.15), signMat, 0, 8.6, -0.16, sp, false); sf2.rotation.y = PI;
  // Sunny cut-out on the sign top
  var sunTex = toTex(sunnyCanvas(512, { wave: 0.6 }), { clamp: true });
  var sunMat = new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, color: new THREE.Color(1.6, 1.6, 1.6), alphaTest: 0.05 }); WORLD.exSunnyMat = sunMat;
  var su = mesh(new THREE.PlaneGeometry(2.4, 2.4), sunMat, 0.6, 11.2, 0.2, sp, false); WORLD.exSunny = su;
  WORLD.exSign = sp;
  // gas pumps & canopy & price sign
  var gs = group(X, 13, 0, 16);
  mesh(boxGeo(7, 0.4, 4, 1), M.enamelWhite, 0, 4.4, 0, gs); B(7.02, 0.18, 4.02, M.paintRed, 13, 4.25, 16);
  [-2.5, 2.5].forEach(function (x) { mesh(boxGeo(0.25, 4.3, 0.25, 1), M.enamelWhite, x, 2.15, 0, gs); });
  [-1.2, 1.2].forEach(function (x) {
    mesh(boxGeo(0.6, 1.5, 0.45, 1), M.paintRed, x, 0.75, 0, gs); mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.0, 1.6) }), x, 1.75, 0, gs, false);
    mesh(boxGeo(0.4, 0.3, 0.02, 1), M.enamelWhite, x, 1.1, 0.24, gs);
  });
  var canopyLight = mesh(new THREE.PlaneGeometry(6, 3.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.7, 1.8) }), 0, 4.19, 0, gs, false); canopyLight.rotation.x = PI / 2;
  var ps = group(X, 18, 0, 24);
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), M.steel, 0, 2, 0, ps);
  var gsm = new THREE.MeshBasicMaterial({ map: toTex(canvasGasSign(), { clamp: true }), color: new THREE.Color(1.4, 1.4, 1.35) });
  mesh(new THREE.PlaneGeometry(1.6, 2.4), gsm, 0, 5.1, 0.05, ps, false);
  mesh(boxGeo(1.7, 2.5, 0.08, 1), M.enamelWhite, 0, 5.1, 0, ps);
  // lot light pole
  var lp = group(X, 4, 0, 14);
  mesh(new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8), M.steel, 0, 3.25, 0, lp); mesh(boxGeo(0.9, 0.12, 0.35, 1), M.steel, -0.4, 6.5, 0, lp);
  mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5.2, 5.5) }), -0.4, 6.43, 0, lp, false).rotation.x = PI / 2;
  // parked old pickup (box-ish) by the gas station
  WORLD.parked = makeCar(0x5b6b5e); WORLD.parked.position.set(9.5, 0, 9); WORLD.parked.rotation.y = -0.3; X.add(WORLD.parked);
  // dumpster behind kitchen
  B(1.8, 1.2, 1.1, stdMat({ color: 0x2f4a3a, roughness: 0.6 }), -1.0, 0.6, -6.6);
  var back = new THREE.PlaneGeometry(40, 12); scaleUV(back, 40 / 6, 2); back.rotateX(-PI / 2); mesh(back, M.asphalt, 0, -0.01, -11.2, X, false);
  // desert scrub (instanced cross planes)
  scrub(X);
  wetStreaks(X);
}
function makeCar(col) {
  var g = new THREE.Group(), paint = stdMat({ color: col, roughness: 0.25, metalness: 0.3, envMapIntensity: 1.2 });
  mesh(roundSlab(1.9, 4.6, 0.7, 0.25), paint, 0, 0.75, 0, g);
  var cabin = mesh(roundSlab(1.7, 2.0, 0.65, 0.2), paint, 0, 1.4, -0.3, g);
  var glassC = mesh(roundSlab(1.72, 1.8, 0.45, 0.18), M.glassDark, 0, 1.45, -0.3, g, false);
  [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.5], [0.85, -1.5]].forEach(function (w) { var wh = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16).rotateZ(PI / 2), M.rubber, w[0], 0.36, w[1], g); });
  mesh(boxGeo(1.9, 0.12, 0.15, 1), M.chrome, 0, 0.55, 2.32, g); mesh(boxGeo(1.9, 0.12, 0.15, 1), M.chrome, 0, 0.55, -2.32, g);
  var hl = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.2, 0.2) }); g.userData.headMat = hl;
  [-0.65, 0.65].forEach(function (x) { mesh(new THREE.CircleGeometry(0.12, 14), hl, x, 0.85, 2.31, g, false); });
  var tl = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.02, 0.02) }); g.userData.tailMat = tl;
  [-0.7, 0.7].forEach(function (x) { var t = mesh(new THREE.PlaneGeometry(0.22, 0.12), tl, x, 0.85, -2.31, g, false); t.rotation.y = PI; });
  return g;
}
function scrub(X) {
  var c = mkCanvas(128, 128), g = c.getContext('2d'), rnd = makeRNG(4);
  g.strokeStyle = '#2b2a1f'; g.lineWidth = 2;
  for (var i = 0; i < 40; i++) { g.beginPath(); g.moveTo(64, 128); g.quadraticCurveTo(64 + (rnd() - 0.5) * 60, 80, 64 + (rnd() - 0.5) * 120, 20 + rnd() * 60); g.stroke(); }
  var mat = new THREE.MeshStandardMaterial({ map: toTex(c, { clamp: true }), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1, color: 0x8a8070 });
  var geo = new THREE.PlaneGeometry(1.2, 1.0); geo.translate(0, 0.5, 0);
  var n = 140, im = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (var k = 0; k < n; k++) {
    var x = (rnd() - 0.5) * 160, z = rnd() < 0.5 ? 44 + rnd() * 80 : -14 - rnd() * 60, s = 0.6 + rnd() * 1.2;
    if (Math.abs(x) < 30 && z > 0 && z < 45) continue;
    q.setFromEuler(new THREE.Euler(0, rnd() * PI, 0)); m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s)); im.setMatrixAt(k, m4);
  }
  X.add(im);
}

// fake wet-asphalt reflections: long soft light streaks under bright lights (additive, ripple-animated)
function wetStreaks(X) {
  var c = mkCanvas(64, 256), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = 'destination-in'; var gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
  var tex = toTex(c, { clamp: true });
  WORLD.streaks = [];
  [[-9.5, 11.6, [2.6, 0.5, 1.4], 2.2, 12], [-9.5, 11.6, [0.4, 1.8, 2.4], 1.3, 9], [4, 14, [1.6, 1.8, 2.0], 1.6, 9], [13, 16, [1.4, 1.5, 1.6], 3.0, 8], [-1.5, 6.2, [2.2, 1.4, 0.8], 9, 4.5], [18, 24, [1.2, 1.2, 1.1], 1.2, 5]].forEach(function (s) {
    var m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(s[2][0], s[2][1], s[2][2]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8, fog: false });
    var p = new THREE.Mesh(new THREE.PlaneGeometry(s[3], s[4]), m); p.rotation.x = -PI / 2; p.position.set(s[0], 0.012, s[1] + s[4] * 0.45); p.renderOrder = 2; X.add(p);
    WORLD.streaks.push({ m: p, base: 0.85, x: s[0], z: s[1] });
  });
}
function updateStreaks(t) {
  if (!WORLD.streaks) return; var cam = RENDER.camera.position, wet = 0.25 + FX.rain * 0.75;
  WORLD.streaks.forEach(function (s, i) { var ang = Math.atan2(cam.x - s.x, cam.z - s.z), H = s.m.geometry.parameters.height, dist = Math.hypot(cam.x - s.x, cam.z - s.z), L = Math.min(H, dist * 0.5), k = L / H;
    s.m.rotation.z = -ang; s.m.scale.y = k; s.m.position.x = s.x + Math.sin(ang) * L * 0.5; s.m.position.z = s.z + Math.cos(ang) * L * 0.5;
    s.m.material.opacity = s.base * wet * (0.85 + 0.15 * Math.sin(t * 7 + i * 2.1)) * (i < 2 ? LSTATE.neon : 1); });
}


// ===== 07_light.js =====
// ---- lighting rig. fixed light count (no shader recompiles); intensities animate ---
var LIGHT = { mood: 0, power: 1, neon: 1, flicker: 0 };
function spot(col, inten, dist, ang, pen, x, y, z, tx, ty, tz, shadow) {
  var s = new THREE.SpotLight(col, inten, dist, ang, pen, 2);
  s.position.set(x, y, z); s.target.position.set(tx, ty, tz);
  RENDER.scene.add(s); RENDER.scene.add(s.target);
  if (shadow) { s.castShadow = true; s.shadow.mapSize.set(Q.shadowSize, Q.shadowSize); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.02; s.shadow.radius = 4; s.shadow.camera.near = 0.3; s.shadow.camera.far = dist; }
  s.userData.base = inten; return s;
}
function point(col, inten, dist, x, y, z) { var p = new THREE.PointLight(col, inten, dist, 2); p.position.set(x, y, z); RENDER.scene.add(p); p.userData.base = inten; return p; }
function buildLights() {
  var L = WORLD.lights;
  L.hemi = new THREE.HemisphereLight(0xffe2c0, 0x6a3a28, 1.15); RENDER.scene.add(L.hemi); L.hemi.userData.base = 1.15;
  // ceiling bounce from the pendants (soft upward fill)
  L.bounce = point(0xffd2a0, 7, 14, 0.5, 1.5, 0.8);
  // warm pendant key lights (shadowed)
  L.counterA = spot(0xffc58a, 20, 9, 1.15, 0.9, -1.6, 3.05, -1.0, -1.6, 0, 0.2, true);
  L.counterB = spot(0xffc58a, 20, 9, 1.15, 0.9, 2.6, 3.05, -1.0, 2.6, 0, 0.2, true);
  L.booths = spot(0xffb27a, 30, 10, 1.25, 0.95, -0.4, 3.05, 3.6, -0.4, 0, 4.2, true);
  // kitchen fluorescent (cool)
  L.kitchen = spot(0xe8f2ff, 22, 8, 1.4, 0.85, 1.0, 3.0, -3.3, 0.6, 0, -4.0, false);
  // neon pink glow over the pass + reflected on the floor/counter
  L.neon = point(0xff3f9a, 5.5, 6.5, 1.5, 2.45, -2.3);
  // exterior: sign glow + lot light (cool)
  L.sign = point(0xff6fb0, 26, 26, -9.5, 8.2, 12.0);
  L.lot = spot(0xcfe0ff, 120, 30, 1.05, 0.75, 3.6, 6.4, 14, 1, 0, 11, false);
  // headlights (one moving spot, shadowed on HIGH)
  L.head = spot(0xfff1d6, 0, 45, 0.42, 0.5, 0, 0.8, 20, 0, 0.8, 0, Q.shadow > 1);
  // movable fill (follows stations that need it: freezer, back door, hallway)
  L.fill = point(0x9fc4ff, 0, 5, 6.6, 2.4, -4.0);
  // jukebox warm glow
  L.juke = point(0xff9a4a, 2.4, 3.5, -7.0, 1.2, 2.95);
  applyLightQuality();
}
function applyLightQuality() {
  var L = WORLD.lights; if (!L.counterA) return;
  var sh = Q.shadow > 0, low = Q === QUAL.LOW;
  [L.juke, L.bounce, L.sign, L.fill].forEach(function (l) { l.visible = !low; });
  [L.counterA, L.counterB, L.booths].forEach(function (s) { s.castShadow = sh; s.shadow.mapSize.set(Q.shadowSize, Q.shadowSize); if (s.shadow.map) { s.shadow.map.dispose(); s.shadow.map = null; } });
  RENDER.shadowDirty = true;
}
// mood: 0 = warm normal, 1 = anomaly (cold). power: 0 = blackout. neon: 0..1
var LSTATE = { cold: 0, coldT: 0, flick: 0, power: 1, powerT: 1, neonT: 1, neon: 1, lightsOn: true, neonOn: true, head: null };
function updateLights(dt, t) {
  var L = WORLD.lights; if (!L.hemi) return;
  LSTATE.cold = damp(LSTATE.cold, LSTATE.coldT, 1.6, dt);
  LSTATE.power = damp(LSTATE.power, LSTATE.lightsOn ? LSTATE.powerT : 0, 9, dt);
  LSTATE.neon = damp(LSTATE.neon, LSTATE.neonOn ? LSTATE.neonT : 0, 12, dt);
  var fl = 1;
  if (LSTATE.flick > 0) { LSTATE.flick = Math.max(0, LSTATE.flick - dt); fl = (Math.sin(t * 53) * Math.sin(t * 17.3) > -0.2 ? 1 : 0.15) * (0.7 + 0.3 * Math.random()); }
  var p = LSTATE.power * fl, c = LSTATE.cold;
  var warm = new THREE.Color(0xffc58a), cold = new THREE.Color(0xa9c8ff);
  [L.counterA, L.counterB, L.booths].forEach(function (s) { s.intensity = s.userData.base * p * (1 - c * 0.35); s.color.copy(warm).lerp(cold, c); });
  L.kitchen.intensity = L.kitchen.userData.base * (LSTATE.lightsOn ? LSTATE.powerT : 0) * (0.94 + 0.06 * Math.sin(t * 120)) * (LSTATE.kitchenFlick ? (Math.random() < 0.2 ? 0.1 : 1) : 1);
  L.hemi.intensity = L.hemi.userData.base * (0.45 + 0.55 * p) * (1 + c * 0.3);
  L.hemi.color.set(0xffe2c0).lerp(new THREE.Color(0x6080c0), c);
  L.bounce.intensity = L.bounce.userData.base * p * (1 - c * 0.5);
  var nf = LSTATE.neon * (LSTATE.neonBuzz ? (Math.random() < 0.08 ? 0.2 : 1) : 1);
  L.neon.intensity = L.neon.userData.base * nf;
  if (WORLD.neonInMat) WORLD.neonInMat.color.setScalar(2.6 * nf + 0.02);
  if (WORLD.neonEyesMat) WORLD.neonEyesMat.color.setScalar(2.6 * nf * (LSTATE.eyesExtra || 1) + 0.02);
  L.sign.intensity = L.sign.userData.base * nf;
  if (WORLD.exSignMat) WORLD.exSignMat.color.setScalar(2.3 * nf + 0.05);
  if (WORLD.exSunnyMat) WORLD.exSunnyMat.color.setScalar(1.6 * nf + 0.08);
  L.juke.intensity = L.juke.userData.base * (0.8 + 0.2 * Math.sin(t * 2.0)) * (LSTATE.jukeOff ? 0.1 : 1) * (0.4 + 0.6 * p);
  if (WORLD.jukeFaceMat) WORLD.jukeFaceMat.color.setRGB(1.9, 1.6, 1.4).multiplyScalar((LSTATE.jukeOff ? 0.15 : 1) * (0.55 + 0.45 * p));
  if (WORLD.jukePillar) WORLD.jukePillar.color.setRGB(3.0, 1.2, 0.5).multiplyScalar((LSTATE.jukeOff ? 0.05 : 1) * (0.9 + 0.1 * Math.sin(t * 3)));
  WORLD.pendants.forEach(function (b, i) { b.material = p > 0.2 ? M.bulb : M.bulbOff; });
  M.bulb.color.setRGB(6 * p, 4.2 * p, 2.4 * p).lerp(new THREE.Color(3 * p, 3.6 * p, 4.4 * p), c);
  M.fluor.color.setRGB(4.2, 4.6, 4.8).multiplyScalar(LSTATE.lightsOn ? LSTATE.powerT : 0.02);
  if (WORLD.doorSign) WORLD.doorSign.material.color.setScalar(LSTATE.neonOn ? 1 : 0.25);
}


// ===== 08_camera.js =====
// ---- fixed-point camera stations, smooth moves, drag-look, tap picking ----------
var STATIONS = {
  COUNTER: { n: 1, pos: [0.55, 1.66, -2.2], yaw: 0, pitch: -0.18, en: 'Counter', ja: 'カウンター', yawLim: 2.9, map: [0.55, -2.0] },
  BOOTHS: { n: 2, pos: [4.75, 1.68, 2.35], yaw: -PI / 2 + 0.3, pitch: -0.17, en: 'Booths', ja: 'ボックス席', yawLim: 1.4, map: [3.3, 2.5] },
  REGISTER: { n: 3, pos: [6.5, 1.66, 0.25], yaw: 0.12, pitch: -0.3, en: 'Register', ja: 'レジ', yawLim: 1.9, map: [6.5, 0.6] },
  KITCHEN: { n: 4, pos: [2.55, 1.78, -3.3], yaw: -2.3, pitch: -0.42, en: 'Kitchen', ja: '厨房', yawLim: 1.6, map: [0.9, -3.8] },
  JUKEBOX: { n: 5, pos: [-5.3, 1.62, 1.6], yaw: -PI / 2 + 0.45, pitch: -0.1, en: 'Jukebox', ja: 'ジュークボックス', yawLim: 1.5, map: [-6.4, 2.2] },
  FREEZER: { n: 6, pos: [3.55, 1.62, -3.95], yaw: PI / 2, pitch: -0.05, en: 'Freezer', ja: '冷凍庫', yawLim: 1.2, map: [4.2, -4.0] },
  DOOR: { n: 7, pos: [6.0, 1.62, 4.1], yaw: 0.05, pitch: -0.06, en: 'Front Door', ja: '入口', yawLim: 1.3, map: [6.6, 4.3] },
  BACKDOOR: { n: 8, pos: [-1.3, 1.62, -3.85], yaw: PI + 0.62, pitch: -0.08, en: 'Back Door', ja: '裏口', yawLim: 1.3, map: [-2.4, -4.6] }
};
var STATION_ORDER = ['COUNTER', 'BOOTHS', 'REGISTER', 'KITCHEN', 'JUKEBOX', 'FREEZER', 'DOOR', 'BACKDOOR'];
// yaw convention: camera looks toward (sin(yaw), ., cos(yaw)) ; yaw 0 = +z (toward windows)
var CAM = { station: 'COUNTER', pos: null, yaw: 0, pitch: 0, lookYaw: 0, lookPitch: 0, tYaw: 0, tPitch: 0,
  moving: false, mv: null, shake: 0, override: null, locked: false, fovKick: 0, bob: 0, lookAt: null };
function camSetStation(name, instant) {
  if (!CAM.pos) CAM.pos = new THREE.Vector3();
  var s = STATIONS[name]; if (!s) return;
  CAM.station = name;
  var to = new THREE.Vector3(s.pos[0], s.pos[1], s.pos[2]);
  if (instant) { CAM.pos.copy(to); CAM.yaw = s.yaw; CAM.pitch = s.pitch; CAM.lookYaw = CAM.lookPitch = CAM.tYaw = CAM.tPitch = 0; CAM.moving = false; return; }
  var from = CAM.pos.clone(), pts = [from].concat(camRoute(from, to)).concat([to]);
  var curve = pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null;
  var dist = 0; for (var i = 1; i < pts.length; i++) dist += pts[i].distanceTo(pts[i - 1]);
  CAM.mv = { from: from, to: to, curve: curve, t: 0, dur: clamp(0.55 + dist * 0.11, 0.7, 2.0), yaw0: CAM.yaw + CAM.lookYaw, yaw1: s.yaw, p0: CAM.pitch + CAM.lookPitch, p1: s.pitch };
  CAM.lookYaw = CAM.lookPitch = CAM.tYaw = CAM.tPitch = 0;
  CAM.moving = true;
  if (typeof sfx === 'function') sfx('step');
}
function camZone(p) { if (p.z < -2.85) return 'K'; if (p.z < -1.25 && p.x > -3.7 && p.x < 4.6) return 'B'; return 'F'; }
function camRoute(a, b) {
  var V = function (x, z) { return new THREE.Vector3(x, 1.62, z); };
  var L1 = V(-4.15, -0.85), L2 = V(-3.05, -2.25), K = V(-2.95, -3.25), R1 = V(5.0, -0.7), R2 = V(4.25, -2.2);
  var za = camZone(a), zb = camZone(b);
  if (za === zb) return [];
  if (za === 'F' && zb === 'B') return b.x > 1 ? [R1, R2] : [L1, L2];
  if (za === 'B' && zb === 'F') return a.x > 1 ? [R2, R1] : [L2, L1];
  if (za === 'B' && zb === 'K') return [L2, K];
  if (za === 'K' && zb === 'B') return [K, L2];
  if (za === 'F' && zb === 'K') return [L1, L2, K];
  if (za === 'K' && zb === 'F') return [K, L2, L1];
  return [];
}
function bez(a, b, c, t) { var u = 1 - t; return new THREE.Vector3(u * u * a.x + 2 * u * t * b.x + t * t * c.x, u * u * a.y + 2 * u * t * b.y + t * t * c.y, u * u * a.z + 2 * u * t * b.z + t * t * c.z); }
function updateCamera(dt, t) {
  var cam = RENDER.camera;
  if (CAM.moving && CAM.mv) {
    var m = CAM.mv; m.t += dt / m.dur; var k = smooth(Math.min(1, m.t)); k = k * k * (3 - 2 * k) * 0.5 + k * 0.5;
    if (m.curve) CAM.pos.copy(m.curve.getPoint(k)); else CAM.pos.copy(m.from).lerp(m.to, k);
    CAM.pos.y += Math.sin(k * PI) * 0.03 + Math.sin(k * PI * 6) * 0.012 * Math.sin(k * PI);
    CAM.yaw = m.yaw0 + angDiff(m.yaw0, m.yaw1) * k; CAM.pitch = lerp(m.p0, m.p1, k);
    if (m.t >= 1) { CAM.moving = false; CAM.pos.copy(m.to); CAM.yaw = m.yaw1; CAM.pitch = m.p1; if (typeof onArrive === 'function') onArrive(CAM.station); }
  }
  CAM.lookYaw = damp(CAM.lookYaw, CAM.tYaw, 10, dt); CAM.lookPitch = damp(CAM.lookPitch, CAM.tPitch, 10, dt);
  var p = CAM.pos, yaw = CAM.yaw + CAM.lookYaw, pitch = CAM.pitch + CAM.lookPitch;
  var px = p.x, py = p.y, pz = p.z;
  // idle breathing
  py += Math.sin(t * 1.1) * 0.006; yaw += Math.sin(t * 0.37) * 0.004;
  if (CAM.override) { // scripted shot {pos, target, k}
    var o = CAM.override; o.k = Math.min(1, (o.k || 0) + dt / (o.dur || 0.8)); var kk = smooth(o.k);
    var base = new THREE.Vector3(px, py, pz), dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    var tgt0 = base.clone().add(dir);
    var posO = o.back ? base.clone().lerp(o.pos, 1 - kk) : base.clone().lerp(o.pos, kk);
    var tgtO = o.back ? tgt0.clone().lerp(o.target, 1 - kk) : tgt0.clone().lerp(o.target, kk);
    cam.position.copy(posO); cam.lookAt(tgtO);
    if (o.back && o.k >= 1) CAM.override = null;
  } else {
    cam.position.set(px, py, pz);
    cam.lookAt(px + Math.sin(yaw) * Math.cos(pitch), py + Math.sin(pitch), pz + Math.cos(yaw) * Math.cos(pitch));
  }
  if (CAM.shake > 0) { CAM.shake = Math.max(0, CAM.shake - dt * 1.8); var s = CAM.shake * CAM.shake * 0.05; cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s; cam.rotation.z += (Math.random() - 0.5) * s; }
  var baseFov = RENDER.w / RENDER.h < 0.62 ? 78 : (RENDER.w / RENDER.h < 1 ? 68 : 56);
  var fov = baseFov - CAM.fovKick; if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
  // focus distance for DOF: what's in the middle of the view
  if (CAM.focusLock) PU.uFocus.value = CAM.focusLock; else if (RENDER.frame % 6 === 0) { var hit = rayCenter(); PU.uFocus.value = damp(PU.uFocus.value, hit, 6, dt * 6); }
}
function closeShot(pos, target, dur) { CAM.override = { pos: pos.clone(), target: target.clone(), k: 0, dur: dur || 0.8 }; }
function releaseShot(dur) { if (CAM.override) { CAM.override.back = true; CAM.override.k = 0; CAM.override.dur = dur || 0.7; } }
var RAY = null, RAYV = null;
function rayCenter() {
  if (!RAY) { RAY = new THREE.Raycaster(); RAYV = new THREE.Vector2(); }
  RAYV.set(0, 0.1); RAY.setFromCamera(RAYV, RENDER.camera); RAY.far = 30;
  var hits = RAY.intersectObjects(WORLD.focusables || [], true);
  return hits.length ? clamp(hits[0].distance, 0.4, 20) : 6;
}
// ---- input ---------------------------------------------------------------------
var INPUT = { down: false, id: null, x0: 0, y0: 0, x: 0, y: 0, t0: 0, moved: 0, enabled: true, hold: null };
function initInput() {
  var cv = RENDER.renderer.domElement;
  cv.addEventListener('pointerdown', function (e) {
    if (typeof AUDIO !== 'undefined') audioUnlock();
    INPUT.down = true; INPUT.id = e.pointerId; INPUT.x0 = INPUT.x = e.clientX; INPUT.y0 = INPUT.y = e.clientY; INPUT.t0 = performance.now(); INPUT.moved = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    if (MINI.active && MINI.onDown) MINI.onDown(e.clientX, e.clientY);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!INPUT.down || e.pointerId !== INPUT.id) return;
    var dx = e.clientX - INPUT.x, dy = e.clientY - INPUT.y; INPUT.x = e.clientX; INPUT.y = e.clientY;
    INPUT.moved += Math.abs(dx) + Math.abs(dy);
    if (MINI.active && MINI.onMove) { MINI.onMove(e.clientX, e.clientY, dx, dy); return; }
    if (!INPUT.enabled || CAM.moving || CAM.override || CAM.locked) return;
    var sens = 0.0055 * (SAVE.settings.sens || 1);
    var st = STATIONS[CAM.station];
    CAM.tYaw = clamp(CAM.tYaw - dx * sens, -st.yawLim, st.yawLim);
    CAM.tPitch = clamp(CAM.tPitch - dy * sens * 0.8, -0.65, 0.55);
  });
  var up = function (e) {
    if (!INPUT.down) return; INPUT.down = false;
    if (MINI.active && MINI.onUp) { MINI.onUp(e.clientX, e.clientY, INPUT.moved, performance.now() - INPUT.t0); return; }
    if (INPUT.moved < 12 && performance.now() - INPUT.t0 < 600 && INPUT.enabled && !CAM.moving) pickAt(e.clientX, e.clientY);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', function () { INPUT.down = false; if (MINI.active && MINI.onUp) MINI.onUp(INPUT.x, INPUT.y, 99, 0); });
  window.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (typeof onKey === 'function') onKey(e);
  });
  window.addEventListener('keyup', function (e) { if (typeof onKeyUp === 'function') onKeyUp(e); });
}
// pickables: objects with userData.pick = {id, fn, station(optional), r}
var PICKS = [];
function addPick(obj, fn, opt) { opt = opt || {}; obj.userData.pick = { fn: fn, stations: opt.stations || null, id: opt.id || '' }; PICKS.push(obj); return obj; }
function removePick(obj) { var i = PICKS.indexOf(obj); if (i >= 0) PICKS.splice(i, 1); }
function pickAt(cx, cy) {
  if (!RAY) { RAY = new THREE.Raycaster(); RAYV = new THREE.Vector2(); }
  RAYV.set(cx / RENDER.w * 2 - 1, -(cy / RENDER.h) * 2 + 1); RAY.setFromCamera(RAYV, RENDER.camera); RAY.far = 40;
  var list = PICKS.filter(function (o) { var p = o.userData.pick; var vis = true; o.traverseAncestors(function (a) { if (!a.visible) vis = false; }); return vis && o.visible && (!p.stations || p.stations.indexOf(CAM.station) >= 0); });
  var hits = RAY.intersectObjects(list, true);
  if (!hits.length) { if (typeof onTapNothing === 'function') onTapNothing(); return; }
  var o = hits[0].object; while (o && !o.userData.pick) o = o.parent;
  if (o && o.userData.pick) o.userData.pick.fn(o, hits[0]);
}


// ===== 09_fx.js =====
// ---- effects: planar window reflection + rain on glass, rain, steam, cars --------
var FX = { rain: 0, rainT: 0, refl: null, steam: null, cars: [], visitor: null, t: 0, thunder: 0 };
var LAYER_REFL_ONLY = 2, LAYER_REAL_ONLY = 3;
var WIN_VS = [
  'uniform mat4 uTexMat; varying vec4 vRefl; varying vec2 vUv; varying vec3 vWorld;',
  'void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz; vRefl = uTexMat * wp; gl_Position = projectionMatrix * viewMatrix * wp; }'].join('\n');
var WIN_FS = [
  'precision highp float; uniform sampler2D tRefl; uniform float uTime, uRain, uStr, uHas; uniform vec2 uSize; uniform vec3 uTint;',
  'varying vec4 vRefl; varying vec2 vUv; varying vec3 vWorld;',
  'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'vec2 h2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }',
  // static drops: returns xy = normal-ish offset, z = mask
  'vec3 drops(vec2 uv, float sc, float t){ vec2 g = uv * sc; vec2 id = floor(g); vec2 f = fract(g) - 0.5; vec2 r = h2(id);',
  '  float life = fract(t * 0.05 + r.x); vec2 c = (r - 0.5) * 0.7; float rad = 0.08 + 0.22 * r.y * (1.0 - life * 0.6);',
  '  vec2 d = f - c; float m = smoothstep(rad, rad * 0.6, length(d * vec2(1.0, 0.85))); m *= step(0.35, h1(id + 7.0)); return vec3(d / rad, m); }',
  // running drips
  'vec3 drips(vec2 uv, float t){ float cols = 26.0; float x = uv.x * cols; float id = floor(x); float fx = fract(x) - 0.5; float r = h1(vec2(id, 3.0));',
  '  float speed = 0.25 + r * 0.5; float y = fract(uv.y * 0.6 + t * speed * 0.3 + r * 10.0); float wob = sin(uv.y * 30.0 + r * 6.0) * 0.12;',
  '  float head = smoothstep(0.06, 0.0, abs(y - 0.5)) * smoothstep(0.22, 0.05, abs(fx - wob));',
  '  float trail = smoothstep(0.5, 0.95, y) * smoothstep(0.08, 0.0, abs(fx - wob)) * 0.6;',
  '  float on = step(0.55, r); return vec3((fx - wob) * 3.0, 0.0, max(head, trail) * on); }',
  'void main(){',
  '  vec2 wuv = vUv * uSize; float t = uTime;',
  '  vec3 d1 = drops(wuv, 9.0, t), d2 = drops(wuv + 3.1, 17.0, t * 1.3), dr = drips(vec2(wuv.x * 0.25, wuv.y * 0.5), t);',
  '  float mask = clamp(d1.z + d2.z * 0.8 + dr.z, 0.0, 1.0) * uRain;',
  '  vec2 off = (d1.xy * d1.z + d2.xy * d2.z * 0.6 + dr.xy * dr.z) * 0.02 * uRain;',
  '  vec2 ruv = vRefl.xy / vRefl.w;',
  '  vec3 refl = uHas > 0.5 ? texture2D(tRefl, ruv - off * 2.5).rgb : vec3(0.0);',
  '  // drop lens shows blurred city lights (neon pink / cyan from outside)',
  '  vec3 lens = mix(vec3(0.9, 0.25, 0.55), vec3(0.25, 0.75, 0.9), step(0.5, h1(floor(wuv * 9.0)))) * 0.35;',
  '  float spec = pow(clamp(1.0 - length(d1.xy - vec2(-0.35, 0.4)), 0.0, 1.0), 6.0) * d1.z + dr.z * 0.3;',
  '  vec3 col = refl * uStr * (1.0 - mask * 0.5) + lens * mask * 0.6 + vec3(spec) * 1.4 * uRain + uTint;',
  '  float a = clamp(0.06 + uStr * 0.0 + mask * 0.5 + spec, 0.0, 1.0);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'].join('\n');
function buildFX() {
  var scene = RENDER.scene;
  // ---- planar reflection on the big window
  var r = FX.refl = { rt: mkRT(256, 256, RENDER.ftype, true), cam: new THREE.PerspectiveCamera(), tm: new THREE.Matrix4(), skip: 0,
    plane: new THREE.Plane(new THREE.Vector3(0, 0, -1), 4.985) };
  r.cam.layers.enable(LAYER_REFL_ONLY); r.cam.layers.disable(LAYER_REAL_ONLY);
  RENDER.camera.layers.enable(LAYER_REAL_ONLY); RENDER.camera.layers.disable(LAYER_REFL_ONLY);
  r.uni = { tRefl: { value: r.rt.texture }, uTexMat: { value: r.tm }, uTime: { value: 0 }, uRain: { value: 0 }, uStr: { value: 0.5 }, uHas: { value: 1 }, uSize: { value: new THREE.Vector2(12.7, 1.6) }, uTint: { value: new THREE.Vector3(0.004, 0.005, 0.008) } };
  var wm = new THREE.ShaderMaterial({ uniforms: r.uni, vertexShader: WIN_VS, fragmentShader: WIN_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  WORLD.window.material = wm; WORLD.windowMat = wm;
  // ---- rain streaks outside (GPU animated line segments)
  var N = Math.round(2200 * Q.rain), pos = new Float32Array(N * 6), seed = new Float32Array(N * 2), rnd = makeRNG(77);
  for (var i = 0; i < N; i++) {
    var x = (rnd() - 0.5) * 44, y = rnd() * 14, z = 5.6 + rnd() * 26; if (rnd() < 0.25) z = -5.6 - rnd() * 8;
    pos.set([x, y, z, x, y, z], i * 6); seed[i * 2] = rnd(); seed[i * 2 + 1] = 0; seed[i * 2 + 1] = 0;
  }
  var ends = new Float32Array(N * 2); for (var j = 0; j < N; j++) { ends[j * 2] = 0; ends[j * 2 + 1] = 1; }
  var rs = new Float32Array(N * 2); for (var k = 0; k < N; k++) { rs[k * 2] = rs[k * 2 + 1] = rnd(); }
  var rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1)); rg.setAttribute('aSeed', new THREE.BufferAttribute(rs, 1));
  FX.rainU = { uTime: { value: 0 }, uRain: { value: 0 }, uWind: { value: 0.18 } };
  var rmat = new THREE.ShaderMaterial({ uniforms: FX.rainU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aEnd; attribute float aSeed; uniform float uTime, uWind; varying float vA; varying float vS; void main(){ vec3 p = position; float sp = 9.0 + aSeed * 4.0; p.y = mod(p.y - uTime * sp, 14.0); p.x += uWind * p.y; p.y += aEnd * 0.38; p.x -= aEnd * uWind * 0.38; vA = aEnd; vS = aSeed; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'uniform float uRain; varying float vA; varying float vS; void main(){ if (vS > uRain) discard; gl_FragColor = vec4(vec3(0.55, 0.6, 0.7) * (0.15 + 0.25 * vA) * 1.4, 1.0); }' });
  var rain = new THREE.LineSegments(rg, rmat); rain.frustumCulled = false; scene.add(rain); FX.rainMesh = rain;
  // ---- steam particles
  var SN = 90, sp = new Float32Array(SN * 3), sa = new Float32Array(SN), ss = new Float32Array(SN);
  var sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sgeo.setAttribute('aAlpha', new THREE.BufferAttribute(sa, 1)); sgeo.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  var stc = mkCanvas(64, 64), stg = stc.getContext('2d'), sgr = stg.createRadialGradient(32, 32, 0, 32, 32, 32); sgr.addColorStop(0, 'rgba(255,255,255,0.6)'); sgr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); sgr.addColorStop(1, 'rgba(255,255,255,0)'); stg.fillStyle = sgr; stg.fillRect(0, 0, 64, 64);
  FX.steamU = { tTex: { value: toTex(stc, { clamp: true, linear: true }) }, uScale: { value: 600 } };
  var smat = new THREE.ShaderMaterial({ uniforms: FX.steamU, transparent: true, depthWrite: false,
    vertexShader: 'attribute float aAlpha; attribute float aSize; uniform float uScale; varying float vA; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D tTex; varying float vA; void main(){ vec4 c = texture2D(tTex, gl_PointCoord); gl_FragColor = vec4(vec3(0.85, 0.83, 0.8), c.a * vA); }' });
  var steam = new THREE.Points(sgeo, smat); steam.frustumCulled = false; scene.add(steam);
  FX.steam = { mesh: steam, n: SN, p: [], emit: [] };
  for (var q = 0; q < SN; q++) FX.steam.p.push({ x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0.1 });
  // ---- highway traffic (light pairs on dim bodies) + visitor car with real headlights
  for (var c = 0; c < 3; c++) {
    var car = makeCar([0x334455, 0x6a2a22, 0x777060][c]); car.scale.setScalar(1); scene.add(car);
    FX.cars.push({ obj: car, x: -120 + c * 90, dir: c % 2 ? -1 : 1, speed: 22 + c * 5, wait: c * 6 });
  }
  var flareC = mkCanvas(128, 128), fg = flareC.getContext('2d'), fgr = fg.createRadialGradient(64, 64, 0, 64, 64, 64); fgr.addColorStop(0, 'rgba(255,255,255,1)'); fgr.addColorStop(0.15, 'rgba(255,240,210,0.6)'); fgr.addColorStop(1, 'rgba(255,220,180,0)'); fg.fillStyle = fgr; fg.fillRect(0, 0, 128, 128);
  FX.flareTex = toTex(flareC, { clamp: true });
  var vis = makeCar(0x8a1c1c); scene.add(vis); vis.visible = false;
  var flareMat = new THREE.SpriteMaterial({ map: FX.flareTex, color: new THREE.Color(6, 5.5, 4.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  [-0.65, 0.65].forEach(function (x) { var s = new THREE.Sprite(flareMat); s.scale.set(1.4, 1.4, 1); s.position.set(x, 0.85, 2.45); vis.add(s); });
  FX.visitor = { obj: vis, state: 'idle', t: 0, flareMat: flareMat, path: null, onPark: null, high: false };
  FX.cars.forEach(function (cc) {
    var fm = new THREE.SpriteMaterial({ map: FX.flareTex, color: new THREE.Color(3, 2.8, 2.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    var tm = new THREE.SpriteMaterial({ map: FX.flareTex, color: new THREE.Color(2.5, 0.15, 0.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    [-0.65, 0.65].forEach(function (x) { var s = new THREE.Sprite(fm); s.scale.set(1.1, 1.1, 1); s.position.set(x, 0.85, 2.45); cc.obj.add(s); var s2 = new THREE.Sprite(tm); s2.scale.set(0.6, 0.6, 1); s2.position.set(x, 0.85, -2.4); cc.obj.add(s2); });
  });
  onFrame(updateFX);
}
function steamEmit(x, y, z, rate, spread) { FX.steam.emit.push({ x: x, y: y, z: z, rate: rate, sp: spread || 0.03, acc: 0 }); return FX.steam.emit[FX.steam.emit.length - 1]; }
function steamStop(e) { var i = FX.steam.emit.indexOf(e); if (i >= 0) FX.steam.emit.splice(i, 1); }
var _v3 = null;
function updateReflection() {
  var r = FX.refl, cam = RENDER.camera, rend = RENDER.renderer;
  r.skip++; var every = Q === QUAL.HIGH ? 1 : (Q === QUAL.MEDIUM ? 2 : 3);
  // window visible? (camera in front of it and facing it)
  if (!_v3) _v3 = new THREE.Vector3();
  cam.getWorldDirection(_v3);
  var visible = Q !== QUAL.LOW && cam.position.z < 4.98 && cam.position.z > -2.9 && cam.position.x < 8 && _v3.z > -0.25 && !CAM.inFreezer;
  r.uni.uHas.value = visible ? 1 : 0;
  if (!visible || r.skip % every) return;
  var sw = Math.max(64, Math.round(RENDER.sw * (Q === QUAL.HIGH ? 0.5 : 0.36))), sh = Math.max(64, Math.round(RENDER.sh * (Q === QUAL.HIGH ? 0.5 : 0.36)));
  if (r.rt.width !== sw || r.rt.height !== sh) r.rt.setSize(sw, sh);
  var zP = 4.985, cp = cam.position, dir = _v3;
  r.cam.position.set(cp.x, cp.y, 2 * zP - cp.z);
  var tgt = new THREE.Vector3(cp.x + dir.x, cp.y + dir.y, 2 * zP - (cp.z + dir.z));
  r.cam.up.set(0, 1, 0); r.cam.lookAt(tgt);
  r.cam.fov = cam.fov; r.cam.aspect = cam.aspect; r.cam.near = cam.near; r.cam.far = 40; r.cam.updateProjectionMatrix(); r.cam.updateMatrixWorld();
  r.tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  r.tm.multiply(r.cam.projectionMatrix); r.tm.multiply(r.cam.matrixWorldInverse);
  var wv = WORLD.window.visible, exv = WORLD.exterior.visible, rv = FX.rainMesh.visible;
  WORLD.window.visible = false; WORLD.exterior.visible = false; FX.rainMesh.visible = false;
  rend.clippingPlanes = [r.plane];
  var envSave = RENDER.scene.environment;
  rend.setRenderTarget(r.rt); rend.clear(); rend.render(RENDER.scene, r.cam);
  rend.clippingPlanes = [];
  WORLD.window.visible = wv; WORLD.exterior.visible = exv; FX.rainMesh.visible = rv;
}
function updateFX(dt, t) {
  FX.t = t;
  FX.rain = damp(FX.rain, FX.rainT, 0.4, dt);
  FX.rainU.uTime.value = t; FX.rainU.uRain.value = FX.rain;
  FX.rainMesh.visible = FX.rain > 0.02;
  var r = FX.refl; r.uni.uTime.value = t; r.uni.uRain.value = FX.rain; r.uni.uStr.value = 0.36 * (0.4 + 0.6 * LSTATE.power);
  updateReflection();
  // steam
  var S = FX.steam, pa = S.mesh.geometry.attributes.position.array, aa = S.mesh.geometry.attributes.aAlpha.array, za = S.mesh.geometry.attributes.aSize.array;
  S.emit.forEach(function (e) {
    e.acc += e.rate * dt;
    while (e.acc >= 1) { e.acc -= 1; for (var i = 0; i < S.n; i++) { var p = S.p[i]; if (p.life <= 0) { p.x = e.x + (Math.random() - 0.5) * e.sp; p.y = e.y; p.z = e.z + (Math.random() - 0.5) * e.sp; p.vx = (Math.random() - 0.5) * 0.03; p.vz = (Math.random() - 0.5) * 0.03; p.vy = 0.12 + Math.random() * 0.1; p.max = p.life = 1.6 + Math.random() * 1.4; p.size = 0.05 + Math.random() * 0.04; break; } } }
  });
  for (var i = 0; i < S.n; i++) {
    var p = S.p[i];
    if (p.life > 0) { p.life -= dt; var k = 1 - p.life / p.max; p.x += (p.vx + Math.sin(t * 1.7 + i) * 0.03) * dt; p.y += p.vy * dt * (1 - k * 0.5); p.z += (p.vz + Math.cos(t * 1.3 + i) * 0.03) * dt; aa[i] = Math.sin(k * PI) * 0.22; za[i] = p.size * (1 + k * 2.5); }
    else { aa[i] = 0; }
    pa[i * 3] = p.x; pa[i * 3 + 1] = p.life > 0 ? p.y : -50; pa[i * 3 + 2] = p.z;
  }
  S.mesh.geometry.attributes.position.needsUpdate = true; S.mesh.geometry.attributes.aAlpha.needsUpdate = true; S.mesh.geometry.attributes.aSize.needsUpdate = true;
  FX.steamU.uScale.value = RENDER.sh / (2 * Math.tan(RENDER.camera.fov * PI / 360));
  // highway traffic
  FX.cars.forEach(function (c) {
    if (c.wait > 0) { c.wait -= dt; c.obj.visible = false; return; }
    c.obj.visible = true; c.x += c.dir * c.speed * dt;
    c.obj.position.set(c.x, 0, c.dir > 0 ? 39.5 : 35.5); c.obj.rotation.y = c.dir > 0 ? PI / 2 : -PI / 2;
    if (Math.abs(c.x) > 140) { c.x = -c.dir * 140; c.wait = 6 + Math.random() * 22; if (Math.random() < 0.5) { c.dir *= -1; c.x = -c.dir * 140; } if (typeof sfxCarPass === 'function') c.snd = 0; }
    if (!c.snd && Math.abs(c.x) < 60 && typeof sfxCarPass === 'function') { c.snd = 1; sfxCarPass(c); }
  });
  updateVisitor(dt);
  if (typeof updateStreaks === 'function') updateStreaks(t);
}
// visitor car: drives in from the highway, sweeps the windows with its headlights, parks.
function visitorArrive(opt) {
  var v = FX.visitor; opt = opt || {};
  var dir = Math.random() < 0.5 ? 1 : -1;
  var pts = [new THREE.Vector3(-dir * 90, 0, dir > 0 ? 39.5 : 35.5), new THREE.Vector3(-dir * 20, 0, dir > 0 ? 39.5 : 35.5), new THREE.Vector3(-dir * 4, 0, 30), new THREE.Vector3((opt.x != null ? opt.x : -2.5 + Math.random() * 6) + dir * 1.5, 0, 18), new THREE.Vector3(opt.x != null ? opt.x : -2 + Math.random() * 5, 0, opt.z || 9.5)];
  v.path = new THREE.CatmullRomCurve3(pts); v.t = 0; v.state = 'drive'; v.obj.visible = true; v.dur = opt.dur || 9; v.onPark = opt.onPark || null; v.stay = opt.stay || 0; v.high = !!opt.high; v.leaveAfter = opt.leaveAfter;
  v.obj.children.forEach(function (c) { if (c.material && c.material.color && c.material.color.r > 0 && c.isMesh && c.material === v.obj.userData.paint) c.material.color.set(opt.color || 0x8a1c1c); });
  if (typeof sfxCarArrive === 'function') sfxCarArrive();
}
function visitorLeave() { var v = FX.visitor; if (v.state === 'idle') return; var p = v.obj.position.clone(); v.path = new THREE.CatmullRomCurve3([p, p.clone().add(new THREE.Vector3(0, 0, 4)), new THREE.Vector3(p.x + 6, 0, 26), new THREE.Vector3(30, 0, 39.5), new THREE.Vector3(120, 0, 39.5)]); v.t = 0; v.state = 'leave'; v.dur = 8; v.reverse = true; if (typeof sfxCarArrive === 'function') sfxCarArrive(true); }
function updateVisitor(dt) {
  var v = FX.visitor, L = WORLD.lights.head;
  if (v.state === 'idle') { L.intensity = damp(L.intensity, 0, 4, dt); return; }
  if (v.state === 'drive' || v.state === 'leave') {
    v.t += dt / v.dur; var k = v.state === 'drive' ? 1 - Math.pow(1 - Math.min(1, v.t), 2.2) : Math.pow(Math.min(1, v.t), 1.6);
    var p = v.path.getPoint(k), ahead = v.path.getPoint(Math.min(1, k + 0.01));
    v.obj.position.copy(p);
    if (ahead.distanceTo(p) > 0.001) { var yaw = Math.atan2(ahead.x - p.x, ahead.z - p.z); if (v.state === 'leave' && v.t < 0.25) yaw += PI; v.obj.rotation.y = yaw; }
    if (v.t >= 1) { if (v.state === 'drive') { v.state = 'parked'; v.park = 0; if (v.onPark) v.onPark(); } else { v.state = 'idle'; v.obj.visible = false; } }
  }
  if (v.state === 'parked') { v.park += dt; if (!v.high && v.park > 2.5) { /* engine off */ } }
  var on = v.state !== 'parked' || v.high || v.park < 2.5;
  var fwd = new THREE.Vector3(Math.sin(v.obj.rotation.y), 0, Math.cos(v.obj.rotation.y));
  L.position.copy(v.obj.position).add(fwd.clone().multiplyScalar(2.3)); L.position.y = 0.85;
  L.target.position.copy(L.position).add(fwd.multiplyScalar(10)); L.target.position.y = v.high ? 1.4 : 0.6;
  L.angle = v.high ? 0.5 : 0.42;
  L.intensity = damp(L.intensity, on ? (v.high ? 260 : 140) : 0, 5, dt);
  v.flareMat.opacity = clamp(L.intensity / 140, 0, 1);
}


// ===== 10_ui.js =====
// ---- UI: design tokens, SVG icon set, buttons, HUD, subtitles, choice slips -------
// Icon grid 24x24, stroke 2.2, round caps/joins, no fills (one consistent set).
var ICON_PATHS = {
  pause: 'M9 5v14M15 5v14',
  play: 'M7 5l12 7-12 7z',
  rules: 'M8 4h8l1 2h2v15H5V6h2zM8 4v3h8V4M8 11h8M8 15h8M8 19h5',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  seat: 'M6 4v9h12M6 13v7M18 13v7M10 9h8a2 2 0 0 1 0 4',
  menu: 'M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2zM9 8h6M9 12h6M9 16h3',
  order: 'M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21zM9 8h6M9 12h6M9 16h4',
  pencil: 'M4 20l1-5L16 4l4 4L9 19zM14 6l4 4',
  serve: 'M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6M10 6h4',
  check: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M14 16h1',
  stop: 'M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4.5a1.5 1.5 0 0 1 2.6-1.5L7 14',
  tear: 'M6 3h12v8l-2 1.5 2 1.5V21H6v-7l2-1.5L6 11zM9 7h6M9 17h4',
  cook: 'M4 20l7-7M11 13l2-2 7-7-1-1-8 8M15 4l5 5',
  spatula: 'M5 19l6-6M11 13l1.5-1.5M12.5 11.5L18 6l-2-2-5.5 5.5zM14 8l2 2',
  coffee: 'M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3',
  record: 'M12 3a9 9 0 1 0 0.01 0zM12 9a3 3 0 1 0 0.01 0zM12 6a6 6 0 0 0-6 6',
  phone: 'M6 3l3 1 1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5 1 3-2 2C11 21 3 13 4 5z',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  sign: 'M4 7h16v8H4zM8 15v5M16 15v5M7 11h2M11 11h2M15 11h2',
  door: 'M6 3h10v18H6zM16 5h3v16M13 12h.5',
  exit: 'M10 3H5v18h5M14 8l4 4-4 4M18 12H9',
  hide: 'M3 21V9l9-6 9 6v12M8 21v-7h8v7',
  reply: 'M4 5h16v11H9l-5 4z',
  silent: 'M4 5h16v11H9l-5 4zM9 9l6 4M15 9l-6 4',
  eyeoff: 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 8.5 4 9.5 6a12 12 0 0 1-2.6 3.4M6.5 7.5A12 12 0 0 0 2.5 12C3.5 14 7 18 12 18c1.4 0 2.7-.3 3.8-.8M9.5 9.8a3 3 0 0 0 4.4 4.1',
  eye: 'M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6zM12 9a3 3 0 1 0 .01 0z',
  gear: 'M12 9a3 3 0 1 0 .01 0zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  archive: 'M3 4h18v5H3zM5 9v11h14V9M10 13h4',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  skip: 'M5 5l8 7-8 7zM13 5l8 7-8 7',
  close: 'M6 6l12 12M18 6L6 18',
  ok: 'M5 12l5 5L20 7',
  ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10',
  coin: 'M12 3a9 9 0 1 0 .01 0zM14.5 9c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6v1.5M12 16.5V18',
  thermo: 'M12 3a2 2 0 0 0-2 2v9.5a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2zM12 10v6',
  walk: 'M13 4a1.5 1.5 0 1 0 .01 0zM9 21l3-7 3 3v4M12 14l-1-5 4 2 3 3M11 9l-3 2-1 3',
  manager: 'M12 3a4 4 0 1 0 .01 0zM4 21a8 8 0 0 1 16 0M10 15l2 2 2-2',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0M12 3v2',
  headphones: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v6H4zM17 15h3v6h-3z',
  speaker: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
  restart: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
  pie: 'M12 3a9 9 0 1 0 9 9h-9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  look: 'M12 5v14M5 12h14M12 5l-2 2M12 5l2 2M12 19l-2-2M12 19l2-2'
};
function icon(name, size) {
  var p = ICON_PATHS[name] || ICON_PATHS.ok, s = size || 24;
  return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>';
}
var PAPER = {}; // data-URL paper textures (built in 11_paper.js)
var UI_CSS = function () {
  return [
    '#ssd-ui{--cream:#F3E6C8;--paper:#FBF3E0;--red:#C8282E;--dred:#7E1418;--mint:#8FD3C1;--dmint:#2F7E6E;--chrome:#D8DDE2;--ink:#22201C;--night:#0B0D12;--pink:#FF4FA3;--cyan:#5BE8FF;--wear:0;',
    ' font-family:"Zen Kaku Gothic New",system-ui,-apple-system,sans-serif;color:var(--cream);}',
    '#ssd-ui .pe{pointer-events:auto;}',
    '#ssd-ui .en{display:block;font-family:Oswald,"Zen Kaku Gothic New",sans-serif;letter-spacing:.04em;}',
    '#ssd-ui .ja{display:block;font-family:"Zen Kaku Gothic New",sans-serif;font-weight:500;letter-spacing:.02em;}',
    // ---- round enamel button with chrome bezel
    '.sb{position:absolute;width:56px;height:56px;border-radius:50%;border:0;padding:0;cursor:pointer;color:var(--cream);',
    ' background:radial-gradient(circle at 35% 28%,#e8444a 0%,#b4161d 45%,#6e0b10 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#9aa3ab 35%,#eef1f3 55%,#6c747c 100%) border-box;',
    ' border:3px solid transparent;box-shadow:0 4px 0 #3b0507,0 8px 16px rgba(0,0,0,.55),inset 0 2px 2px rgba(255,255,255,.35),inset 0 -3px 6px rgba(0,0,0,.35);',
    ' display:flex;align-items:center;justify-content:center;transition:transform .09s ease-out,box-shadow .09s,filter .2s;}',
    '.sb .ic{filter:drop-shadow(0 1px 0 rgba(0,0,0,.5));}',
    '.sb.mint{background:radial-gradient(circle at 35% 28%,#b9eedd 0%,#5fb7a0 45%,#24685a 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#9aa3ab 35%,#eef1f3 55%,#6c747c 100%) border-box;color:#10302a;box-shadow:0 4px 0 #0f3a32,0 8px 16px rgba(0,0,0,.55),inset 0 2px 2px rgba(255,255,255,.45),inset 0 -3px 6px rgba(0,0,0,.25);}',
    '.sb.dark{background:radial-gradient(circle at 35% 28%,#3a3d44 0%,#1c1e23 55%,#0b0c0f 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#9aa3ab 35%,#eef1f3 55%,#6c747c 100%) border-box;box-shadow:0 4px 0 #050506,0 8px 16px rgba(0,0,0,.55),inset 0 2px 2px rgba(255,255,255,.2);}',
    '.sb:active,.sb.down{transform:translateY(3px);box-shadow:0 1px 0 #3b0507,0 3px 8px rgba(0,0,0,.5),inset 0 2px 2px rgba(255,255,255,.3),0 0 18px rgba(255,79,163,.55);}',
    '.sb.off,.mb.off{filter:grayscale(.85) brightness(.45);pointer-events:none;}',
    '.sb .badge{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;border-radius:10px;background:var(--cyan);color:#062028;font:700 12px/20px Oswald,sans-serif;text-align:center;padding:0 5px;box-shadow:0 0 10px var(--cyan);}',
    '.sb .lbl{position:absolute;top:60px;left:50%;transform:translateX(-50%);font:600 10px/1 Oswald,sans-serif;letter-spacing:.14em;color:rgba(243,230,200,.72);white-space:nowrap;text-shadow:0 1px 2px #000;}',
    // ---- main pill button (enamel sign)
    '.mb{position:absolute;height:64px;min-width:210px;max-width:calc(100% - 180px);padding:0 22px 0 16px;border-radius:999px;border:3px solid transparent;cursor:pointer;',
    ' background:linear-gradient(180deg,#fff8e6 0%,#f1e2bd 60%,#dcc697 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#8e979f 30%,#f4f6f8 52%,#646c74 100%) border-box;',
    ' box-shadow:0 5px 0 #8a7448,0 10px 20px rgba(0,0,0,.55),inset 0 2px 1px #fff,inset 0 -3px 5px rgba(120,90,40,.3);color:var(--dred);',
    ' display:flex;align-items:center;gap:12px;transition:transform .09s ease-out,box-shadow .09s,opacity .25s,filter .2s;transform-origin:50% 100%;}',
    '.mb .ic{flex:0 0 auto;width:30px;height:30px;padding:5px;border-radius:50%;background:var(--red);color:#fff6e0;box-shadow:inset 0 -2px 3px rgba(0,0,0,.35),0 1px 0 #fff;box-sizing:content-box;}',
    '.mb .tx{display:flex;flex-direction:column;align-items:flex-start;min-width:0;}',
    '.mb .en{font-family:"Alfa Slab One",serif;font-size:19px;line-height:1.05;letter-spacing:.03em;color:var(--dred);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}',
    '.mb .ja{font-size:11.5px;color:#6b4a2a;margin-top:2px;white-space:nowrap;}',
    '.mb:active,.mb.down{transform:translateY(4px);box-shadow:0 1px 0 #8a7448,0 4px 10px rgba(0,0,0,.5),inset 0 2px 1px #fff,0 0 26px rgba(91,232,255,.55);}',
    '.mb.glow{animation:mbglow 1.6s ease-in-out infinite;}',
    '@keyframes mbglow{0%,100%{box-shadow:0 5px 0 #8a7448,0 10px 20px rgba(0,0,0,.55),inset 0 2px 1px #fff,0 0 0 rgba(255,79,163,0)}50%{box-shadow:0 5px 0 #8a7448,0 10px 20px rgba(0,0,0,.55),inset 0 2px 1px #fff,0 0 22px rgba(255,79,163,.75)}}',
    '.mb.danger{background:linear-gradient(180deg,#ffe9e6 0%,#f0c2bb 60%,#d99a90 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#8e979f 30%,#f4f6f8 52%,#646c74 100%) border-box;}',
    '.mb.hidden,.sb.hidden{opacity:0;pointer-events:none;transform:translateY(12px) scale(.96);}',
    // wear / grime overlay (grows each night)
    '.sb::after,.mb::after{content:"";position:absolute;inset:-3px;border-radius:inherit;pointer-events:none;opacity:var(--wear);background-image:var(--grime);background-size:cover;mix-blend-mode:multiply;}',
    '#ssd-ui.flick .mb,#ssd-ui.flick .sb{animation:uiflick 7s steps(1) infinite;}',
    '@keyframes uiflick{0%,93%,95%,100%{filter:none}94%{filter:brightness(.4)}96%{filter:brightness(.7)}}',
    // ---- HUD
    '.hud{position:absolute;top:calc(var(--top-safe) + 8px);left:20px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;transition:opacity .4s;}',
    '.clock{display:flex;align-items:center;gap:10px;height:48px;padding:0 16px 0 10px;border-radius:14px;',
    ' background:linear-gradient(180deg,#24262b,#101114) padding-box,linear-gradient(160deg,#fff 0%,#8e979f 35%,#eef1f3 55%,#5a6168 100%) border-box;border:2px solid transparent;box-shadow:0 6px 14px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.12);}',
    '.clock .dial{width:30px;height:30px;border-radius:50%;background:#f6f0df;position:relative;box-shadow:inset 0 0 0 2px #c8282e,inset 0 2px 4px rgba(0,0,0,.4);}',
    '.clock .dial i{position:absolute;left:50%;bottom:50%;width:2px;background:#22201c;transform-origin:50% 100%;border-radius:2px;}',
    '.clock .dial i.h{height:8px;margin-left:-1px}.clock .dial i.m{height:12px;margin-left:-1px;width:1.5px}',
    '.clock .tm{font:600 22px/1 Oswald,sans-serif;letter-spacing:.06em;color:#ffe9b0;text-shadow:0 0 10px rgba(255,190,90,.55);}',
    '.clock .nt{font:600 10px/1.2 Oswald,sans-serif;letter-spacing:.2em;color:rgba(243,230,200,.6);margin-top:3px;}',
    '.chip{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px 0 8px;border-radius:999px;background:rgba(16,17,20,.82);border:1.5px solid rgba(216,221,226,.45);font:600 15px/1 Oswald,sans-serif;letter-spacing:.06em;color:var(--cream);box-shadow:0 4px 10px rgba(0,0,0,.4);transition:opacity .3s,transform .3s;}',
    '.chip .ic{width:18px;height:18px;color:#ffd36a;}',
    '.chip.cold .ic{color:var(--cyan)}.chip .bar{width:90px;height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}.chip .bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#5be8ff,#e8fbff);border-radius:4px;transition:width .2s}',
    '.chip.hide{opacity:0;transform:translateX(-10px);}',
    '.pausebtn{top:calc(var(--top-safe) + 4px);right:20px;}',
    // ---- bottom bands
    '.shade{position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(0deg,rgba(5,5,8,.92) 0%,rgba(5,5,8,.7) 38%,rgba(5,5,8,0) 100%);pointer-events:none;transition:opacity .5s;}',
    '.btnband{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);height:76px;}',
    '.btnband .left{left:20px;bottom:14px}.btnband .right{right:20px;bottom:14px}',
    '.btnband .mb{left:50%;bottom:8px;transform:translateX(-50%);}',
    '.btnband .mb:active,.btnband .mb.down{transform:translateX(-50%) translateY(4px);}',
    '.btnband .mb.hidden{transform:translateX(-50%) translateY(12px) scale(.96);}',
    '.subband{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 14px);min-height:84px;pointer-events:none;transition:opacity .25s,transform .25s;}',
    '.subband.hide{opacity:0;transform:translateY(8px);}',
    '.sub{position:relative;padding:4px 4px 2px;}',
    '.sub .who{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;background:rgba(200,40,46,.9);color:#fff4dc;font:600 11px/22px Oswald,sans-serif;letter-spacing:.16em;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,.5);}',
    '.sub .who.sunny{background:linear-gradient(90deg,#ffb21c,#ff7a2e);color:#3a1600}.sub .who.mgr{background:#2f7e6e}.sub .who.odd{background:#3a3d44;color:#cfd6dd}.sub .who.you{background:#5a6c8a}',
    '.sub .l1{font:700 19px/1.32 "Zen Kaku Gothic New",sans-serif;color:#fff8ea;text-shadow:0 1px 2px #000,0 0 12px rgba(0,0,0,.85);letter-spacing:.01em;min-height:25px;}',
    '.sub .l2{font:500 13.5px/1.45 "Zen Kaku Gothic New",sans-serif;color:rgba(243,230,200,.86);text-shadow:0 1px 2px #000,0 0 10px rgba(0,0,0,.9);margin-top:4px;}',
    '.sub .more{position:absolute;right:2px;bottom:-2px;width:18px;height:18px;color:rgba(243,230,200,.7);animation:bob 1s ease-in-out infinite;}',
    '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}',
    '.subtap{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 6px);height:120px;pointer-events:auto;}',
    // ---- choice slip (guest check)
    '.slip{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 12px);width:min(340px,calc(100% - 40px));transform:translateX(-50%) rotate(-1.2deg);',
    ' padding:30px 18px 16px;color:#1f3b8a;background-color:#eef3e4;background-image:var(--slipbg);background-size:cover;border-radius:2px;',
    ' box-shadow:0 14px 28px rgba(0,0,0,.55),0 2px 3px rgba(0,0,0,.35);pointer-events:auto;transition:transform .26s cubic-bezier(.2,.9,.3,1.2),opacity .2s;opacity:1;}',
    '.slip.hide{opacity:0;transform:translateX(-50%) translateY(40px) rotate(4deg);pointer-events:none;}',
    '.slip::before{content:"";position:absolute;left:0;right:0;top:-7px;height:8px;background:radial-gradient(circle at 5px -1px,transparent 5px,#eef3e4 5.5px) -1px 0/10px 8px repeat-x;}',
    '.slip .hd{position:absolute;left:18px;right:18px;top:9px;display:flex;justify-content:space-between;font:600 10px/1 Oswald,sans-serif;letter-spacing:.2em;color:#2f7e6e;}',
    '.slip .hd b{color:#c8282e;font-weight:600}',
    '.slip .t{font:400 22px/1.1 "Shadows Into Light",cursive;color:#1d2f6f;margin:2px 0 8px;}',
    '.slip .opt{display:flex;align-items:center;gap:12px;min-height:50px;padding:6px 8px;border-top:1px solid rgba(47,126,110,.35);cursor:pointer;border-radius:4px;transition:background .12s;}',
    '.slip .opt:last-child{border-bottom:1px solid rgba(47,126,110,.35);}',
    '.slip .opt:active,.slip .opt.down{background:rgba(200,40,46,.1);}',
    '.slip .opt .ic{flex:0 0 auto;width:26px;height:26px;color:#c8282e;}',
    '.slip .opt .en{font:400 21px/1.05 "Shadows Into Light",cursive;color:#1d2f6f;letter-spacing:0;}',
    '.slip .opt .ja{font:600 11.5px/1.3 "Klee One","Zen Kaku Gothic New",serif;color:#4a5a7a;}',
    '.slip .opt.dim{opacity:.4;pointer-events:none;}',
    '.slip .opt.warn .ic{color:#7e1418}',
    // toast / big title
    '.toast{position:absolute;left:50%;top:calc(var(--top-safe) + 70px);transform:translateX(-50%);padding:10px 16px;border-radius:12px;background:rgba(12,13,16,.88);border:1.5px solid rgba(216,221,226,.35);text-align:center;font-size:13px;color:var(--cream);box-shadow:0 8px 18px rgba(0,0,0,.5);transition:opacity .3s,transform .3s;max-width:calc(100% - 40px);}',
    '.toast .en{font-size:16px;color:#fff3d6}.toast.hide{opacity:0;transform:translateX(-50%) translateY(-6px)}',
    // hotspot labels (3D markers) — drawn in 3D, label in DOM
    '.hint{position:absolute;transform:translate(-50%,-100%);font:600 11px/1 Oswald,sans-serif;letter-spacing:.14em;color:#e8fbff;text-shadow:0 0 8px #5be8ff,0 1px 2px #000;white-space:nowrap;pointer-events:none;transition:opacity .3s;}',
    // overlays
    '.ov{position:absolute;inset:0;pointer-events:auto;transition:opacity .35s;}',
    '.ov.hide{opacity:0;pointer-events:none;}',
    '.dim{background:radial-gradient(ellipse at 50% 45%,rgba(10,10,14,.55),rgba(0,0,0,.88));}',
    '.flash{position:absolute;inset:0;pointer-events:none;opacity:0;}',
    '.scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;}'
  ].join('\n');
};
// ---- UI state & construction -----------------------------------------------------
var U = {};
function buildUI() {
  var st = document.createElement('style'); st.textContent = UI_CSS(); (document.head || document.documentElement).appendChild(st);
  U.shade = el('div', 'shade', null, UI);
  // HUD
  U.hud = el('div', 'hud', null, UI);
  U.clock = el('div', 'clock', '<div class="dial"><i class="h"></i><i class="m"></i></div><div><div class="tm">10:00 PM</div><div class="nt">NIGHT 1</div></div>', U.hud);
  U.tips = el('div', 'chip hide', icon('coin') + '<span>$0.00</span>', U.hud);
  U.cold = el('div', 'chip cold hide', icon('thermo') + '<div class="bar"><b></b></div>', U.hud);
  U.pause = el('button', 'sb dark pausebtn pe', icon('pause', 24), UI); U.pause.setAttribute('aria-label', 'Pause');
  // subtitles
  U.sub = el('div', 'subband hide', '<div class="sub"><div class="who"></div><div class="l1"></div><div class="l2"></div><svg class="more" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></div>', UI);
  U.subTap = el('div', 'subtap', null, UI); U.subTap.style.display = 'none';
  // slip (choices)
  U.slip = el('div', 'slip hide', '', UI);
  // bottom band
  U.band = el('div', 'btnband', null, UI);
  U.rulesBtn = el('button', 'sb left pe', icon('rules', 24) + '<span class="lbl">RULES</span>', U.band);
  U.mapBtn = el('button', 'sb mint right pe', icon('map', 24) + '<span class="lbl">MAP</span>', U.band);
  U.main = el('button', 'mb pe hidden', '', U.band);
  U.toast = el('div', 'toast hide', '', UI);
  U.flash = el('div', 'flash', null, UI);
  U.layer = el('div', null, null, UI); U.layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  pressFX(U.pause); pressFX(U.rulesBtn); pressFX(U.mapBtn); pressFX(U.main);
  onTap(U.subTap, function () { subAdvance(); });
  onTap(U.main, function () { if (U.mainAct && U.mainAct.fn) { sfx('click'); U.mainAct.fn(); } });
  setGameHUD(false);
}
function pressFX(b) {
  b.addEventListener('pointerdown', function () { b.classList.add('down'); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { b.addEventListener(n, function () { b.classList.remove('down'); }); });
}
function setGameHUD(on) {
  [U.hud, U.pause, U.band, U.shade].forEach(function (e) { e.style.display = on ? '' : 'none'; });
}
function layoutUI() { /* CSS handles layout; hook for future */ }
function setMain(act) {
  U.mainAct = act;
  if (!act) { U.main.classList.add('hidden'); return; }
  var key = act.icon + act.en + act.ja + (act.danger ? 'd' : '') + (act.glow ? 'g' : '');
  if (U.main._key !== key) { U.main.innerHTML = icon(act.icon || 'ok', 30) + '<span class="tx"><span class="en">' + act.en + '</span><span class="ja">' + act.ja + '</span></span>'; U.main._key = key; }
  U.main.classList.remove('hidden');
  U.main.classList.toggle('danger', !!act.danger); U.main.classList.toggle('glow', !!act.glow);
}
function setClock(min, night) { // min since 22:00
  var tot = (22 * 60 + Math.floor(min)) % 1440, h = Math.floor(tot / 60), m = tot % 60, ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
  U.clock.querySelector('.tm').textContent = h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  U.clock.querySelector('.nt').textContent = 'NIGHT ' + night + (night === 5 ? ' · LAST' : '');
  U.clock.querySelector('.h').style.transform = 'rotate(' + ((h % 12) * 30 + m * 0.5) + 'deg)';
  U.clock.querySelector('.m').style.transform = 'rotate(' + (m * 6) + 'deg)';
}
function setTips(v, show) { U.tips.querySelector('span').textContent = fmtMoney(v); U.tips.classList.toggle('hide', !show); }
function setCold(v, show) { U.cold.querySelector('b').style.width = Math.round(clamp(v, 0, 1) * 100) + '%'; U.cold.classList.toggle('hide', !show); }
var TOAST_T = 0;
function toast(en, ja, sec) {
  U.toast.innerHTML = '<span class="en">' + en + '</span>' + (ja ? '<span class="ja">' + ja + '</span>' : '');
  U.toast.classList.remove('hide'); clearTimeout(TOAST_T); TOAST_T = setTimeout(function () { U.toast.classList.add('hide'); }, (sec || 2.4) * 1000);
}
// ---- choice slip ---------------------------------------------------------------------
var SLIP = { open: false, onClose: null };
function showChoices(title, opts, meta) {
  meta = meta || {};
  var h = '<div class="hd"><span>GUEST CHECK</span><b>No. ' + (meta.no || (1000 + Math.floor(Math.random() * 8999))) + '</b><span>' + (meta.table || '') + '</span></div>';
  if (title) h += '<div class="t">' + title + '</div>';
  opts.forEach(function (o, i) { h += '<div class="opt' + (o.dim ? ' dim' : '') + (o.warn ? ' warn' : '') + '" data-i="' + i + '">' + icon(o.icon || 'ok', 26) + '<div><span class="en">' + o.en + '</span><span class="ja">' + o.ja + '</span></div></div>'; });
  if (!meta.noCancel) h += '<div class="opt" data-i="-1">' + icon('back', 26) + '<div><span class="en">Never mind</span><span class="ja">やめる</span></div></div>';
  U.slip.innerHTML = h;
  U.slip.style.setProperty('--slipbg', PAPER.slip ? 'url(' + PAPER.slip + ')' : 'none');
  U.slip.style.transform = ''; U.slip.classList.remove('hide'); SLIP.open = true;
  U.sub.classList.add('hide');
  sfx('paper');
  U.slip.querySelectorAll('.opt').forEach(function (n) {
    pressFX(n);
    onTap(n, function () { var i = +n.getAttribute('data-i'); hideChoices(); sfx('pen'); if (i >= 0 && opts[i].fn) opts[i].fn(); else if (meta.onCancel) meta.onCancel(); });
  });
}
function hideChoices() { U.slip.classList.add('hide'); SLIP.open = false; }
// ---- subtitles --------------------------------------------------------------------------
var SUBQ = { cur: null, queue: [], typing: 0, timer: 0 };
var WHO_CLASS = { SUNNY: 'sunny', MANAGER: 'mgr', DALE: 'mgr', YOU: 'you', '???': 'odd' };
function subShow(line) {
  SUBQ.cur = line; SUBQ.typing = 0; SUBQ.shown = 0; SUBQ.done = false;
  var who = U.sub.querySelector('.who'); who.textContent = line.who || ''; who.style.display = line.who ? '' : 'none';
  who.className = 'who ' + (line.cls || WHO_CLASS[line.who] || '');
  U.sub.querySelector('.l1').textContent = ''; U.sub.querySelector('.l2').textContent = line.ja || '';
  U.sub.querySelector('.more').style.opacity = 0;
  U.sub.classList.remove('hide'); U.subTap.style.display = '';
  if (SLIP.open) U.sub.classList.add('hide');
}
function subUpdate(dt) {
  var L = SUBQ.cur; if (!L) return;
  var full = L.en || '';
  if (SUBQ.shown < full.length) {
    var cps = L.cps || 24;
    // follow TTS word boundaries when we have them
    if (L.boundary != null) SUBQ.shown = Math.max(SUBQ.shown, Math.min(full.length, L.boundary + 1));
    SUBQ.typing += dt * cps; var n = Math.floor(SUBQ.typing);
    if (n > SUBQ.shown) SUBQ.shown = Math.min(full.length, n);
    U.sub.querySelector('.l1').textContent = full.slice(0, SUBQ.shown);
    if (SUBQ.shown >= full.length) SUBQ.typed = true;
  } else if (!SUBQ.done) { U.sub.querySelector('.more').style.opacity = L.wait === false ? 0 : 1; }
}
function subHide() { U.sub.classList.add('hide'); U.subTap.style.display = 'none'; SUBQ.cur = null; }
function subAdvance() {
  var L = SUBQ.cur; if (!L) return;
  if (SUBQ.shown < (L.en || '').length) { SUBQ.shown = L.en.length; SUBQ.typing = 1e9; U.sub.querySelector('.l1').textContent = L.en; return; }
  if (L.onTap) L.onTap();
}


// ===== 11_paper.js =====
// ---- paper textures (canvas -> data URL) and document overlays ----------------------
function paperCanvas(w, h, o) {
  o = o || {};
  var c = mkCanvas(w, h), g = c.getContext('2d'), rnd = makeRNG(o.seed || 3);
  g.save();
  if (o.torn) { // jagged outline
    g.beginPath(); var j = o.torn;
    g.moveTo(0, j * rnd()); for (var x = 0; x <= w; x += 6) g.lineTo(x, (o.tornTop ? j * rnd() : 0));
    for (var y = 0; y <= h; y += 6) g.lineTo(w - (o.tornSide ? j * rnd() : 0), y);
    for (var x2 = w; x2 >= 0; x2 -= 6) g.lineTo(x2, h - j * rnd());
    for (var y2 = h; y2 >= 0; y2 -= 6) g.lineTo((o.tornSide ? j * rnd() : 0), y2);
    g.closePath(); g.clip();
  }
  g.fillStyle = o.base || '#f6ecd4'; g.fillRect(0, 0, w, h);
  // fibers
  var nf = o.fibers == null ? 1 : o.fibers;
  for (var i = 0; i < 2600 * nf; i++) { var fx = rnd() * w, fy = rnd() * h, a = rnd() * TAU, l = 2 + rnd() * 7; g.strokeStyle = rnd() < 0.5 ? 'rgba(120,95,60,' + rnd() * 0.08 + ')' : 'rgba(255,255,255,' + rnd() * 0.18 + ')'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * l, fy + Math.sin(a) * l); g.stroke(); }
  // mottling
  for (var m = 0; m < 40; m++) smudge(g, rnd() * w, rnd() * h, 20 + rnd() * 90, 'rgba(' + (o.mottle || '150,120,70') + ',A)', 0.05 * (o.age == null ? 1 : o.age));
  if (o.lines) { // ruled lines
    for (var ly = o.lines.top; ly < h - 10; ly += o.lines.gap) { g.fillStyle = o.lines.col || 'rgba(90,140,190,0.35)'; g.fillRect(0, ly, w, 1.3); }
    if (o.lines.margin) { g.fillStyle = 'rgba(210,60,70,0.45)'; g.fillRect(o.lines.margin, 0, 1.4, h); }
  }
  // yellowed edges
  var age = o.age == null ? 1 : o.age;
  var eg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  eg.addColorStop(0, 'rgba(160,120,50,0)'); eg.addColorStop(1, 'rgba(160,110,40,' + 0.38 * age + ')'); g.fillStyle = eg; g.fillRect(0, 0, w, h);
  // stains
  (o.rings || 0) && ring(g, w * (0.6 + rnd() * 0.3), h * (0.65 + rnd() * 0.25), w * 0.13, 'rgb(120,70,25)', 0.32, 5);
  if (o.grease) for (var q = 0; q < o.grease; q++) smudge(g, rnd() * w, rnd() * h, 18 + rnd() * 30, 'rgba(190,150,70,A)', 0.22);
  // folds
  if (o.fold) {
    [0.5].concat(o.fold === 2 ? [0.33, 0.66] : []).forEach(function (f) {
      var fy2 = h * f, gr = g.createLinearGradient(0, fy2 - 6, 0, fy2 + 6);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.45, 'rgba(90,70,40,0.18)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, fy2 - 6, w, 12);
    });
  }
  if (o.corner) { // dog-ear bottom-right
    g.fillStyle = 'rgba(0,0,0,0.0)'; var cs = w * 0.1;
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(w, h - cs); g.lineTo(w, h); g.lineTo(w - cs, h); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
    var cg = g.createLinearGradient(w - cs, h - cs, w - cs * 0.5, h - cs * 0.5); cg.addColorStop(0, '#d9ccb0'); cg.addColorStop(1, '#f4ead0');
    g.fillStyle = cg; g.beginPath(); g.moveTo(w, h - cs); g.lineTo(w - cs, h - cs); g.lineTo(w - cs, h); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(w, h - cs); g.lineTo(w - cs, h); g.lineTo(w - cs - 3, h); g.lineTo(w, h - cs - 3); g.fill();
  }
  if (o.halftone) for (var hy = 0; hy < h; hy += 3) for (var hx = 0; hx < w; hx += 3) if (rnd() < 0.05) { g.fillStyle = 'rgba(40,40,40,0.08)'; g.fillRect(hx, hy, 1, 1); }
  g.restore();
  return c;
}
function grimeCanvas() {
  var c = mkCanvas(128, 128), g = c.getContext('2d'), rnd = makeRNG(12);
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  for (var i = 0; i < 14; i++) smudge(g, rnd() * 128, rnd() * 128, 10 + rnd() * 30, 'rgba(90,60,30,A)', 0.5);
  g.strokeStyle = 'rgba(40,20,10,0.8)'; g.lineWidth = 1;
  for (var k = 0; k < 5; k++) { var x = rnd() * 128, y = rnd() * 128; g.beginPath(); g.moveTo(x, y); for (var s = 0; s < 6; s++) { x += (rnd() - 0.5) * 30; y += (rnd() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
  return c;
}
function buildPapers() {
  var u = function (c, q) { try { return q ? c.toDataURL('image/jpeg', q) : c.toDataURL('image/png'); } catch (e) { return ''; } };
  PAPER.slip = u(paperCanvas(360, 420, { base: '#eaf1df', age: 0.4, fibers: 0.5, lines: { top: 92, gap: 51, col: 'rgba(47,126,110,0.18)' }, seed: 5 }), 0.85);
  PAPER.rules = u(paperCanvas(560, 880, { base: '#f4e9cf', age: 0.9, rings: 1, grease: 3, fold: 1, seed: 7 }), 0.86);
  PAPER.fake = u(paperCanvas(560, 600, { base: '#fbfbf8', age: 0.08, fibers: 0.2, mottle: '200,200,210', seed: 9 }), 0.9);
  PAPER.sticky = u(paperCanvas(400, 400, { base: '#f7e27a', age: 0.35, fibers: 0.4, mottle: '200,160,40', seed: 11 }), 0.88);
  PAPER.receipt = u(paperCanvas(300, 900, { base: '#f7f5ee', age: 0.15, fibers: 0.25, mottle: '190,190,180', seed: 13, torn: 7 }));
  PAPER.news = u(paperCanvas(560, 760, { base: '#e6dcc2', age: 1.2, fibers: 1.4, mottle: '130,110,70', fold: 2, halftone: 1, seed: 15, torn: 9, tornSide: 1, tornTop: 1 }));
  PAPER.flyer = u(paperCanvas(560, 760, { base: '#efe6cf', age: 1.0, fibers: 1, fold: 2, corner: 1, rings: 1, seed: 17 }));
  PAPER.diary = u(paperCanvas(560, 700, { base: '#f2ead6', age: 0.8, lines: { top: 70, gap: 34, margin: 60 }, seed: 19, torn: 10, tornTop: 1 }));
  PAPER.ticket = u(paperCanvas(320, 520, { base: '#e7f0dd', age: 0.4, fibers: 0.5, lines: { top: 110, gap: 38, col: 'rgba(47,126,110,0.22)' }, seed: 21, grease: 1 }), 0.85);
  PAPER.polaroid = u(paperCanvas(420, 500, { base: '#f7f4ea', age: 0.4, fibers: 0.3, seed: 23 }), 0.88);
  PAPER.ad = u(paperCanvas(560, 820, { base: '#e8dfc6', age: 1.0, fibers: 1.3, halftone: 1, seed: 25, fold: 1 }), 0.86);
  PAPER.grime = u(grimeCanvas(), 0.8);
  UI.style.setProperty('--grime', 'url(' + PAPER.grime + ')');
  var st = document.createElement('style'); st.textContent = DOC_CSS; (document.head || document.documentElement).appendChild(st);
}
var DOC_CSS = [
  '.docwrap{position:absolute;left:0;right:0;top:calc(var(--top-safe) + 6px);bottom:calc(env(safe-area-inset-bottom,0px) + 96px);overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;align-items:center;padding:10px 0 30px;}',
  '.doc{position:relative;width:min(350px,calc(100% - 40px));flex:0 0 auto;margin:10px 0;color:#22201c;background-size:100% 100%;filter:drop-shadow(0 12px 18px rgba(0,0,0,.5)) drop-shadow(0 2px 2px rgba(0,0,0,.35));animation:docin .46s cubic-bezier(.2,.9,.25,1.1) both;}',
  '@keyframes docin{0%{opacity:0;transform:translateY(70px) rotate(var(--r1,6deg)) scale(.96)}100%{opacity:1;transform:translateY(0) rotate(var(--r,-1.5deg)) scale(1)}}',
  '.doc.out{animation:docout .3s ease-in both}@keyframes docout{to{opacity:0;transform:translateY(60px) rotate(4deg)}}',
  // laminated rules sheet
  '.rules{padding:30px 24px 26px;border-radius:6px;}',
  '.rules::after{content:"";position:absolute;inset:0;border-radius:6px;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.28) 42%,rgba(255,255,255,0) 52%),linear-gradient(0deg,rgba(255,255,255,.06),rgba(255,255,255,.12));box-shadow:inset 0 0 0 2px rgba(255,255,255,.35),inset 0 0 0 5px rgba(200,190,160,.25);}',
  '.tape{position:absolute;width:86px;height:26px;background:rgba(232,222,186,.72);box-shadow:0 1px 2px rgba(0,0,0,.18);clip-path:polygon(3% 0,97% 4%,100% 30%,96% 60%,100% 100%,4% 96%,0 70%,3% 40%);z-index:2;}',
  '.rules .rlogo{font:400 26px/1 Pacifico,cursive;color:#c8282e;text-align:center;}',
  '.rules h2{margin:6px 0 2px;font:400 21px/1.15 "Special Elite",monospace;text-align:center;letter-spacing:.06em;color:#22201c;}',
  '.rules .sub2{font:400 13px/1.3 "Special Elite",monospace;text-align:center;color:#555;margin-bottom:12px;}',
  '.rule{display:flex;gap:10px;margin:12px 0;}',
  '.rule .n{flex:0 0 26px;height:26px;border-radius:50%;border:1.6px solid #22201c;font:400 14px/23px "Special Elite",monospace;text-align:center;}',
  '.rule .e{font:400 14.5px/1.38 "Special Elite",monospace;color:#23211d;}',
  '.rule .j{font:500 12px/1.45 "Zen Kaku Gothic New",sans-serif;color:#5a5244;margin-top:3px;}',
  '.redpen{font:700 19px/1.1 Caveat,cursive;color:#c3161c;transform:rotate(-2deg);display:inline-block;margin-top:2px;}',
  '.redpen.ja{font:600 12px/1.2 "Klee One",serif;}',
  '.ul{background:linear-gradient(transparent 78%,rgba(195,22,28,.55) 78%,rgba(195,22,28,.55) 90%,transparent 90%);}',
  '.sig{font:700 26px/1 Caveat,cursive;color:#2a2a4a;text-align:right;margin-top:14px;transform:rotate(-3deg);}',
  // fake rule card
  '.fake{padding:26px 22px 22px;border-radius:1px;--r:2.4deg;}',
  '.fake .pin{position:absolute;left:50%;top:6px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff7a7a,#b01018);box-shadow:0 3px 4px rgba(0,0,0,.4);}',
  '.fake .e{font:400 25px/1.15 "Reenie Beanie",cursive;color:#1b2a4a;}',
  '.fake .j{font:600 12.5px/1.5 "Klee One",serif;color:#2b3a5a;margin-top:6px;}',
  '.fake .n{font:400 22px/1 "Reenie Beanie",cursive;color:#1b2a4a;}',
  '.fake .sig2{font:400 26px/1 "Reenie Beanie",cursive;color:#1b2a4a;text-align:right;margin-top:8px;}',
  // sticky memo
  '.sticky{padding:26px 22px 24px;--r:-2.5deg;}',
  '.sticky::before{content:"";position:absolute;left:0;right:0;top:0;height:22px;background:linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,0));}',
  '.sticky .e{font:700 23px/1.18 Caveat,cursive;color:#1f2a5a;}',
  '.sticky .j{font:600 12.5px/1.55 "Klee One",serif;color:#3b3a4a;margin-top:8px;}',
  // thermal receipt
  '.receipt{width:min(270px,calc(100% - 60px));padding:22px 20px 30px;font:400 14px/1.4 DotGothic16,monospace;color:#2e2e34;--r:.6deg;transform-origin:50% 0;}',
  '.receipt.print{animation:rprint 1.6s steps(24) both}@keyframes rprint{0%{clip-path:inset(0 0 100% 0)}100%{clip-path:inset(0 0 0 0)}}',
  '.receipt::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.10),rgba(0,0,0,0) 12%,rgba(0,0,0,0) 88%,rgba(0,0,0,.10));}',
  '.receipt .c{text-align:center}.receipt .r{display:flex;justify-content:space-between;gap:8px}.receipt hr{border:0;border-top:1.5px dashed #777;margin:8px 0}',
  '.receipt .big{font-size:20px;letter-spacing:.06em}.receipt .bad{color:#a01018}',
  // newspaper
  '.news{padding:26px 24px 30px;--r:-1deg;}',
  '.news .mast{font:900 26px/1 "Playfair Display",serif;text-align:center;border-bottom:3px double #333;padding-bottom:6px;letter-spacing:.02em;}',
  '.news .date{font:400 11px/1.4 "Old Standard TT",serif;text-align:center;border-bottom:1px solid #333;padding:3px 0;margin-bottom:10px;}',
  '.news h3{font:900 23px/1.08 "Playfair Display",serif;margin:6px 0 8px;}',
  '.news p{font:400 13px/1.42 "Old Standard TT",serif;margin:0 0 8px;text-align:justify;}',
  '.news .jp{font:500 11.5px/1.55 "Zen Kaku Gothic New",sans-serif;color:#4a4232;border-top:1px solid rgba(0,0,0,.2);padding-top:8px;margin-top:8px;}',
  '.news img,.flyer img,.polaroid img{display:block;width:100%;filter:grayscale(1) contrast(1.15) sepia(.25);mix-blend-mode:multiply;}',
  '.flyer{padding:24px 24px 26px;--r:1.6deg;text-align:center;}',
  '.flyer .big{font:900 52px/1 "Playfair Display",serif;letter-spacing:.08em;color:#1a1a1a;}',
  '.flyer p{font:400 14px/1.4 "Special Elite",monospace;margin:8px 0;}',
  '.polaroid{width:min(290px,calc(100% - 60px));padding:16px 16px 18px;--r:-3deg;}',
  '.polaroid .cap{font:700 22px/1.1 Caveat,cursive;color:#2b2b44;text-align:center;margin-top:12px;}',
  '.diary{padding:56px 26px 26px 72px;--r:1.2deg;}',
  '.diary .e{font:700 21px/34px Caveat,cursive;color:#23284a;}',
  '.diary .j{font:600 12px/1.6 "Klee One",serif;color:#3a3a4a;margin-top:10px;}',
  '.doccap{font:600 11px/1.4 Oswald,sans-serif;letter-spacing:.18em;color:rgba(243,230,200,.7);text-align:center;margin-top:4px;}',
  '.docclose{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);transform:translateX(-50%);}',
  '.docclose:active,.docclose.down{transform:translateX(-50%) translateY(4px);}',
  '.ticketdoc{width:min(250px,calc(100% - 80px));padding:22px 18px 20px;--r:-2deg;font:400 20px/38px "Shadows Into Light",cursive;color:#1d2f6f;}',
  '.ticketdoc .hd{font:600 10px/1 Oswald,sans-serif;letter-spacing:.2em;color:#2f7e6e;display:flex;justify-content:space-between;margin-bottom:28px}',
  '.ticketdoc .carbon{text-shadow:1px 1px 0 rgba(30,40,110,.25),-.5px .5px 1px rgba(30,40,110,.25);}',
  '.ticketdoc .odd{color:#4a1a1a;filter:blur(.3px);text-shadow:0 0 2px rgba(120,0,0,.5);}'
].join('\n');
// ---- document overlay -----------------------------------------------------------------
var DOC = { open: false, ov: null, onClose: null };
function openDocs(nodesHTML, opt) {
  opt = opt || {};
  closeDocs(true);
  var ov = el('div', 'ov dim pe', null, UI); DOC.ov = ov; DOC.open = true; DOC.onClose = opt.onClose || null;
  var wrap = el('div', 'docwrap ssd-scroll scroll', nodesHTML, ov);
  var cb = el('button', 'mb pe docclose', icon(opt.closeIcon || 'ok', 30) + '<span class="tx"><span class="en">' + (opt.closeEn || 'Got it') + '</span><span class="ja">' + (opt.closeJa || 'わかった') + '</span></span>', ov);
  pressFX(cb);
  onTap(cb, function () { sfx('paper'); closeDocs(); });
  sfx('paper'); setTimeout(function () { sfx('paperSlide'); }, 120);
  if (opt.noClose) cb.style.display = 'none';
  DOC.closeBtn = cb; DOC.wrap = wrap;
  return ov;
}
function closeDocs(silent) {
  if (!DOC.ov) return; var ov = DOC.ov; DOC.ov = null; DOC.open = false;
  ov.querySelectorAll('.doc').forEach(function (d) { d.classList.add('out'); });
  ov.classList.add('hide'); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 380);
  var f = DOC.onClose; DOC.onClose = null; if (f && !silent) f();
}
function tapeHTML(spots) { return (spots || [[-8, -10, -8], [null, -10, 7]]).map(function (s) { return '<div class="tape" style="' + (s[0] == null ? 'right:-8px' : 'left:' + s[0] + 'px') + ';top:' + s[1] + 'px;transform:rotate(' + s[2] + 'deg)"></div>'; }).join(''); }
function docRules(list, night) { // list: [{n,en,ja,fake,red,redJa,ul}]
  var real = list.filter(function (r) { return !r.fake; }), fakes = list.filter(function (r) { return r.fake; });
  var h = '<div class="doc rules" style="background-image:url(' + PAPER.rules + ');--r:-1.2deg">' + tapeHTML() +
    '<div class="rlogo">Sunny Side Diner</div><h2>NIGHT SHIFT RULES</h2><div class="sub2">Follow them. Every one. Every night.<br>深夜シフトのルール ── 必ず守ること</div>';
  real.forEach(function (r) {
    h += '<div class="rule"><div class="n">' + r.n + '</div><div><div class="e">' + (r.ul ? r.en.replace(r.ul, '<span class="ul">' + r.ul + '</span>') : r.en) + '</div><div class="j">' + r.ja + '</div>' +
      (r.red ? '<div class="redpen">' + r.red + '</div>' + (r.redJa ? '<div class="redpen ja">' + r.redJa + '</div>' : '') : '') + '</div></div>';
  });
  h += '<div class="sig">— Dale</div></div>';
  fakes.forEach(function (r, i) {
    h += '<div class="doc fake" style="background-image:url(' + PAPER.fake + ');--r:' + (i % 2 ? -2.2 : 2.6) + 'deg"><div class="pin"></div><div class="n">' + r.n + '.</div><div class="e">' + r.en + '</div><div class="j">' + r.ja + '</div><div class="sig2">' + (r.sig || '— D') + '</div></div>';
  });
  return h;
}
function docSticky(en, ja, rot) { return '<div class="doc sticky" style="background-image:url(' + PAPER.sticky + ');--r:' + (rot || -2.5) + 'deg"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>'; }
function docReceipt(lines, print) { return '<div class="doc receipt' + (print ? ' print' : '') + '" style="background-image:url(' + PAPER.receipt + ')">' + lines + '</div>'; }
function docNews(o) {
  return '<div class="doc news" style="background-image:url(' + PAPER.news + ')"><div class="mast">' + (o.paper || 'The Desert Ledger') + '</div><div class="date">' + o.date + '</div><h3>' + o.head + '</h3>' + (o.img ? '<img src="' + o.img + '">' : '') + o.body.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '<div class="jp">' + o.ja + '</div></div>';
}
function docFlyer(o) { return '<div class="doc flyer" style="background-image:url(' + PAPER.flyer + ')"><div class="big">MISSING</div>' + (o.img ? '<img src="' + o.img + '" style="margin:10px auto;width:70%">' : '') + o.body.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '<div class="news"><div class="jp" style="text-align:left">' + o.ja + '</div></div></div>'; }
function docPolaroid(img, cap, ja) { return '<div class="doc polaroid" style="background-image:url(' + PAPER.polaroid + ')"><img src="' + img + '" style="filter:sepia(.35) contrast(1.05) saturate(.8);mix-blend-mode:normal"><div class="cap">' + cap + '</div><div class="doccap" style="color:#666">' + (ja || '') + '</div></div>'; }
function docDiary(en, ja) { return '<div class="doc diary" style="background-image:url(' + PAPER.diary + ')"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>'; }
function docTicket(no, table, items) {
  return '<div class="doc ticketdoc" style="background-image:url(' + PAPER.ticket + ')"><div class="hd"><span>GUEST CHECK</span><span style="color:#c8282e">No.' + no + '</span><span>' + table + '</span></div>' +
    items.map(function (it) { return '<div class="carbon' + (it.odd ? ' odd' : '') + '">' + it.qty + ' × ' + it.en + '</div>'; }).join('') + '</div>';
}
// small halftone photo generator for clippings (canvas -> dataURL)
function photoCanvas(kind, w, h, seed) {
  var c = mkCanvas(w || 320, h || 220), g = c.getContext('2d'), rnd = makeRNG(seed || 1); w = c.width; h = c.height;
  var sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#9a9a9a'); sk.addColorStop(0.6, '#cfcfcf'); sk.addColorStop(1, '#6a6a6a'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  if (kind === 'diner' || kind === 'night') {
    if (kind === 'night') { g.fillStyle = '#1b1b1b'; g.fillRect(0, 0, w, h); }
    g.fillStyle = kind === 'night' ? '#3a3a3a' : '#555'; g.fillRect(w * 0.12, h * 0.42, w * 0.76, h * 0.32);
    g.fillStyle = kind === 'night' ? '#d8d8d8' : '#9a9a9a'; for (var i = 0; i < 7; i++) g.fillRect(w * 0.15 + i * w * 0.1, h * 0.5, w * 0.07, h * 0.12);
    g.fillStyle = '#222'; g.fillRect(w * 0.7, h * 0.1, w * 0.025, h * 0.35); g.fillStyle = kind === 'night' ? '#eee' : '#444'; g.fillRect(w * 0.6, h * 0.08, w * 0.22, h * 0.12);
    g.fillStyle = '#444'; g.fillRect(0, h * 0.74, w, h * 0.26);
  } else if (kind === 'girl' || kind === 'man' || kind === 'woman') {
    g.fillStyle = '#bdbdbd'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#555'; g.beginPath(); g.ellipse(w / 2, h * 0.42, w * 0.17, h * 0.24, 0, 0, TAU); g.fill();
    g.fillStyle = kind === 'girl' ? '#2a2a2a' : (kind === 'woman' ? '#3a3a3a' : '#4a4a4a'); g.beginPath(); g.ellipse(w / 2, h * 0.32, w * 0.2, h * (kind === 'man' ? 0.14 : 0.2), 0, PI, 0); g.fill();
    if (kind !== 'man') { g.fillRect(w * 0.3, h * 0.3, w * 0.07, h * 0.35); g.fillRect(w * 0.63, h * 0.3, w * 0.07, h * 0.35); }
    g.fillStyle = '#7a7a7a'; g.beginPath(); g.ellipse(w / 2, h * 1.02, w * 0.36, h * 0.3, 0, PI, 0); g.fill();
    g.fillStyle = '#222'; g.fillRect(w * 0.44, h * 0.4, w * 0.03, h * 0.02); g.fillRect(w * 0.53, h * 0.4, w * 0.03, h * 0.02); g.fillRect(w * 0.46, h * 0.52, w * 0.08, h * 0.012);
  } else if (kind === 'costume') {
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#444'; g.fillRect(0, h * 0.8, w, h * 0.2);
    drawSunny(g, w * 0.62, h * 0.46, h * 0.26, { mood: 'stare' });
    var gr = g.createRadialGradient(w * 0.6, h * 0.4, 10, w * 0.6, h * 0.4, w * 0.5); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  // halftone + grain
  var id = g.getImageData(0, 0, w, h), d = id.data;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var k = (y * w + x) * 4, l = (d[k] + d[k + 1] + d[k + 2]) / 3 + (rnd() - 0.5) * 40; l = l > (((x + y) % 4) * 40 + 60) ? Math.min(255, l + 20) : l * 0.7; d[k] = d[k + 1] = d[k + 2] = l; }
  g.putImageData(id, 0, 0);
  return c.toDataURL('image/jpeg', 0.8);
}


// ===== 12_audio.js =====
// ---- audio: mix bus, procedural reverbs, positional jukebox, layered SFX --------------
var AUDIO = { ctx: null, ok: false, buf: {}, noise: {}, music: null, juke: null, space: 'diner', loops: {}, duck: 1 };
var SONGS = { title: 'audio/sunny_side_diner.m4a', boogie: 'audio/diner_boogie.m4a', warped: 'audio/warped_diner.m4a', jingle: 'audio/jingle_in_reverse.m4a' };
function audioUnlock() {
  if (AUDIO.ctx) { if (AUDIO.ctx.state !== 'running') try { AUDIO.ctx.resume(); } catch (e) {} return; }
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { AUDIO.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { AUDIO.ctx = new AC(); } catch (e2) { return; } }
  var c = AUDIO.ctx;
  try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  try { c.resume(); } catch (e) {}
  buildMix(); AUDIO.ok = true;
  loadSongs();
  document.addEventListener('visibilitychange', function () { if (!AUDIO.ctx) return; if (document.hidden) AUDIO.ctx.suspend && AUDIO.ctx.suspend(); else AUDIO.ctx.resume && AUDIO.ctx.resume(); });
}
function buildMix() {
  var c = AUDIO.ctx;
  var comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 3.2; comp.attack.value = 0.006; comp.release.value = 0.22;
  var lim = c.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
  var master = c.createGain(); master.gain.value = 0.9;
  master.connect(comp); comp.connect(lim); lim.connect(c.destination);
  AUDIO.master = master;
  AUDIO.music = c.createGain(); AUDIO.musicDuck = c.createGain(); AUDIO.music.connect(AUDIO.musicDuck); AUDIO.musicDuck.connect(master);
  AUDIO.sfx = c.createGain(); AUDIO.sfx.connect(master);
  AUDIO.voice = c.createGain(); AUDIO.voice.connect(master);
  AUDIO.amb = c.createGain(); AUDIO.amb.connect(AUDIO.sfx);
  // noise buffers
  ['white', 'pink', 'brown'].forEach(function (k) {
    var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), l = 0, b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; if (k === 'white') d[i] = w; else if (k === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.1848) * 1.6; } else { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } }
    AUDIO.noise[k] = b;
  });
  // reverbs (procedural impulse responses)
  AUDIO.rev = {};
  var spaces = { diner: [1.5, 2600, 0.32], kitchen: [1.05, 6200, 0.38], freezer: [0.35, 1600, 0.26], hall: [2.1, 3000, 0.4], outside: [0.7, 4200, 0.16], tv: [0.25, 3000, 0.1] };
  for (var k in spaces) {
    var sp = spaces[k], conv = c.createConvolver(); conv.buffer = makeIR(sp[0], sp[1], k === 'outside');
    var g = c.createGain(); g.gain.value = k === 'diner' ? sp[2] : 0; conv.connect(g); g.connect(master);
    AUDIO.rev[k] = { conv: conv, out: g, wet: sp[2] };
  }
  AUDIO.revSend = c.createGain(); AUDIO.revSend.gain.value = 1;
  for (var k2 in AUDIO.rev) AUDIO.revSend.connect(AUDIO.rev[k2].conv);
  AUDIO.sfx.connect(AUDIO.revSend);
  // space-specific damping for everything (freezer muffles)
  applyVolumes();
  startAmbience();
}
function makeIR(sec, lp, sparse) {
  var c = AUDIO.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var d = b.getChannelData(ch), last = 0, a = Math.exp(-2 * PI * lp / c.sampleRate);
    for (var i = 0; i < n; i++) {
      var t = i / n, env = Math.pow(1 - t, 2.6) * (i < c.sampleRate * 0.004 ? i / (c.sampleRate * 0.004) : 1);
      var w = (Math.random() * 2 - 1) * (sparse ? (Math.random() < 0.08 ? 1 : 0.15) : 1);
      last = w * (1 - a) + last * a; d[i] = last * env;
      if (i < c.sampleRate * 0.06 && Math.random() < 0.002) d[i] += (Math.random() - 0.5) * 0.8 * (1 - t); // early reflections
    }
  }
  return b;
}
function applyVolumes() {
  if (!AUDIO.ok && !AUDIO.music) return;
  var s = SAVE.settings, c = AUDIO.ctx, t = c.currentTime;
  AUDIO.music.gain.setTargetAtTime(s.bgm * 0.9, t, 0.05);
  AUDIO.sfx.gain.setTargetAtTime(s.sfx, t, 0.05);
  AUDIO.voice.gain.setTargetAtTime(s.voice, t, 0.05);
}
function setSpace(k) {
  if (!AUDIO.ok || AUDIO.space === k) return; AUDIO.space = k; var t = AUDIO.ctx.currentTime;
  for (var r in AUDIO.rev) AUDIO.rev[r].out.gain.setTargetAtTime(r === k ? AUDIO.rev[r].wet : 0, t, 0.25);
  if (AUDIO.juke) AUDIO.juke.space = k;
}
function duckMusic(on) { if (!AUDIO.ok) return; AUDIO.musicDuck.gain.setTargetAtTime(on ? 0.42 : 1, AUDIO.ctx.currentTime, on ? 0.12 : 0.6); }
// ---- loading songs (XHR -> decodeAudioData; failure falls back to synthesized loops) -----
function loadSongs() {
  for (var k in SONGS) (function (k) {
    var x = new XMLHttpRequest(); x.open('GET', assetURL(SONGS[k]), true); x.responseType = 'arraybuffer';
    x.onload = function () {
      if (x.status >= 400) return fallbackSong(k, 'HTTP ' + x.status);
      try {
        var p = AUDIO.ctx.decodeAudioData(x.response, function (b) { AUDIO.buf[k] = b; if (k === 'boogie') AUDIO.buf.reverse = reverseBuf(b); onSongReady(k); }, function () { fallbackSong(k, 'decode'); });
        if (p && p.catch) p.catch(function () {});
      } catch (e) { fallbackSong(k, 'decode'); }
    };
    x.onerror = function () { fallbackSong(k, 'network'); };
    x.send();
  })(k);
}
function reverseBuf(b) {
  var c = AUDIO.ctx, r = c.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
  for (var ch = 0; ch < b.numberOfChannels; ch++) { var s = b.getChannelData(ch), d = r.getChannelData(ch), n = s.length; for (var i = 0; i < n; i++) d[i] = s[n - 1 - i]; }
  return r;
}
function fallbackSong(k, why) {
  BOOT_ERRORS.push('song ' + k + ' ' + why);
  // simple synthesized stand-in so the game never goes silent
  var c = AUDIO.ctx, sr = c.sampleRate, sec = k === 'jingle' ? 6 : 16, b = c.createBuffer(2, sr * sec, sr);
  var bpm = k === 'warped' ? 84 : 132, beat = 60 / bpm, roots = [0, 0, 5, 5, 0, 7, 5, 0];
  for (var ch = 0; ch < 2; ch++) {
    var d = b.getChannelData(ch);
    for (var i = 0; i < d.length; i++) {
      var t = i / sr, bar = Math.floor(t / (beat * 4)) % 8, bt = (t % beat) / beat, step = Math.floor(t / (beat / 2)) % 8;
      var f = 110 * Math.pow(2, (roots[bar] + [0, 4, 7, 9, 10, 9, 7, 4][step]) / 12) * (k === 'warped' ? 0.94 : 1);
      var v = Math.sin(TAU * f * t) * 0.18 * Math.exp(-bt * 3) + Math.sin(TAU * f * 2 * t) * 0.05 * Math.exp(-bt * 5);
      v += (Math.random() * 2 - 1) * 0.05 * Math.exp(-((t % beat) / beat) * 30) * ((Math.floor(t / beat) % 2) ? 1 : 0.4);
      d[i] = v;
    }
  }
  AUDIO.buf[k] = b; if (k === 'boogie') AUDIO.buf.reverse = reverseBuf(b); onSongReady(k);
}
var SONG_WAIT = {};
function onSongReady(k) { var f = SONG_WAIT[k]; SONG_WAIT[k] = null; if (f) f(); }
function whenSong(k, fn) { if (AUDIO.buf[k]) fn(); else SONG_WAIT[k] = fn; }
// ---- non-positional music (title / clear / CM) -------------------------------------
var MUSIC = { src: null, gain: null, key: null };
function playMusic(k, opt) {
  opt = opt || {};
  if (!AUDIO.ok) { MUSIC.pending = [k, opt]; return; }
  if (MUSIC.key === k && MUSIC.src && !opt.restart) return;
  stopMusic(0.6);
  MUSIC.key = k;
  whenSong(k, function () {
    if (MUSIC.key !== k) return;
    var c = AUDIO.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = AUDIO.buf[k]; s.loop = opt.loop !== false;
    g.gain.value = 0.0001; g.gain.setTargetAtTime(opt.vol || 0.85, c.currentTime, 0.25);
    var out = g;
    if (opt.tv) { var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180; var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4800; var pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1800; pk.gain.value = 5; g.connect(hp); hp.connect(pk); pk.connect(lp); out = lp; }
    s.connect(g); out.connect(AUDIO.music);
    s.start(0, opt.offset || 0); MUSIC.src = s; MUSIC.gain = g; MUSIC.t0 = c.currentTime - (opt.offset || 0); MUSIC.dur = AUDIO.buf[k].duration;
    if (opt.onEnd) s.onended = function () { if (MUSIC.src === s) opt.onEnd(); };
  });
}
function musicTime() { return MUSIC.src && AUDIO.ok ? AUDIO.ctx.currentTime - MUSIC.t0 : -1; }
function stopMusic(fade) {
  MUSIC.key = null; if (!MUSIC.src) return;
  var s = MUSIC.src, g = MUSIC.gain, c = AUDIO.ctx; MUSIC.src = null;
  try { g.gain.setTargetAtTime(0.0001, c.currentTime, (fade || 0.4) / 3); s.stop(c.currentTime + (fade || 0.4) + 0.1); } catch (e) {}
}
// ---- the jukebox: positional, radio-ish, tape wobble, needle skips ---------------------
var JUKE = { src: null, key: null, rate: 1, wobble: 0, drift: 0 };
function jukePlay(k, opt) {
  opt = opt || {};
  if (!AUDIO.ok) { JUKE.pending = k; return; }
  jukeStop(opt.fade == null ? 0.3 : opt.fade);
  JUKE.key = k; JUKE.label = opt.label || JUKE.label;
  whenSong(k === 'reverse' ? 'boogie' : k, function () {
    if (JUKE.key !== k) return;
    var c = AUDIO.ctx, s = c.createBufferSource(); s.buffer = AUDIO.buf[k]; s.loop = true;
    var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 95;
    var pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1500; pk.Q.value = 0.8; pk.gain.value = 3.5;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500; lp.Q.value = 0.4;
    var sat = c.createWaveShaper(); sat.curve = satCurve(1.6); sat.oversample = '2x';
    var g = c.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(opt.vol || 0.9, c.currentTime, 0.3);
    var pan = c.createPanner(); pan.panningModel = 'equalpower'; pan.distanceModel = 'inverse'; pan.refDistance = 2.2; pan.rolloffFactor = 1.2; pan.maxDistance = 40;
    var jp = WORLD.jukeboxPos; setPannerPos(pan, jp.x, jp.y, jp.z);
    var send = c.createGain(); send.gain.value = 0.5;
    // tape wobble LFO -> detune
    var lfo = c.createOscillator(); lfo.frequency.value = 0.55; var lg = c.createGain(); lg.gain.value = 0; lfo.connect(lg); lg.connect(s.detune); lfo.start();
    var lfo2 = c.createOscillator(); lfo2.frequency.value = 6.2; var lg2 = c.createGain(); lg2.gain.value = 0; lfo2.connect(lg2); lg2.connect(s.detune); lfo2.start();
    s.connect(hp); hp.connect(pk); pk.connect(sat); sat.connect(lp); lp.connect(g); g.connect(pan); pan.connect(AUDIO.music); g.connect(send); send.connect(AUDIO.revSend);
    if (k === 'reverse') s.playbackRate.value = 0.9;
    s.start(0, opt.offset || Math.random() * 8);
    JUKE.src = s; JUKE.g = g; JUKE.lp = lp; JUKE.pan = pan; JUKE.lfo = lfo; JUKE.lg = lg; JUKE.lg2 = lg2; JUKE.lfo2 = lfo2; JUKE.rate = s.playbackRate.value;
  });
}
function jukeStop(fade, slowdown) {
  JUKE.key = null; if (!JUKE.src) return;
  var c = AUDIO.ctx, s = JUKE.src, g = JUKE.g, t = c.currentTime; JUKE.src = null;
  try {
    if (slowdown) { s.playbackRate.cancelScheduledValues(t); s.playbackRate.setValueAtTime(s.playbackRate.value, t); s.playbackRate.exponentialRampToValueAtTime(0.18, t + slowdown); g.gain.setTargetAtTime(0.0001, t + slowdown * 0.6, slowdown * 0.25); s.stop(t + slowdown + 0.4); }
    else { g.gain.setTargetAtTime(0.0001, t, (fade || 0.2) / 3); s.stop(t + (fade || 0.2) + 0.1); }
    var l1 = JUKE.lfo, l2 = JUKE.lfo2; setTimeout(function () { try { l1.stop(); l2.stop(); } catch (e) {} }, ((slowdown || fade || 0.2) + 0.6) * 1000);
  } catch (e) {}
}
// transition normal -> late night: needle skip + slow down, then warped song
function jukeSkipTo(k, label) {
  sfxAt('needle', WORLD.jukeboxPos);
  jukeStop(0, 1.4);
  setTimeout(function () { jukePlay(k, { label: label, fade: 0 }); }, 1900);
}
function jukeWobble(amt) { JUKE.wobble = amt; }
function satCurve(k) { var n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k) / Math.tanh(k); } return c; }
function setPannerPos(p, x, y, z) { if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z); }
var _fw = null;
function updateAudio(dt) {
  if (!AUDIO.ok) return;
  var c = AUDIO.ctx, L = c.listener, cam = RENDER.camera, t = c.currentTime;
  if (!_fw) _fw = new THREE.Vector3(); cam.getWorldDirection(_fw);
  if (L.positionX) { L.positionX.value = cam.position.x; L.positionY.value = cam.position.y; L.positionZ.value = cam.position.z; L.forwardX.value = _fw.x; L.forwardY.value = _fw.y; L.forwardZ.value = _fw.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
  else { L.setPosition(cam.position.x, cam.position.y, cam.position.z); L.setOrientation(_fw.x, _fw.y, _fw.z, 0, 1, 0); }
  if (JUKE.src) {
    // far rooms hear it muffled through walls
    var sp = AUDIO.space, cut = sp === 'freezer' ? 420 : sp === 'kitchen' ? 2400 : sp === 'outside' ? 900 : sp === 'hall' ? 2600 : 6500;
    JUKE.lp.frequency.setTargetAtTime(cut, t, 0.3);
    JUKE.lg.gain.setTargetAtTime(6 + JUKE.wobble * 60, t, 0.5); JUKE.lg2.gain.setTargetAtTime(2 + JUKE.wobble * 10, t, 0.5);
    if (JUKE.drift !== JUKE._d) { JUKE._d = JUKE.drift; JUKE.src.detune.setTargetAtTime(-JUKE.drift * 700, t, 3); }
  }
  updateAmbience(dt);
}
// ---- SFX helpers ---------------------------------------------------------------------
function rv(a, b) { return a + Math.random() * (b - a); }
function nz(kind) { var s = AUDIO.ctx.createBufferSource(); s.buffer = AUDIO.noise[kind || 'white']; s.loop = true; return s; }
function envG(t, a, peak, d, sus, r, hold) { // attack/decay/sustain/release gain node
  var g = AUDIO.ctx.createGain(), p = g.gain; p.setValueAtTime(0.0001, t);
  p.linearRampToValueAtTime(peak, t + a); p.setTargetAtTime(Math.max(0.0001, peak * sus), t + a, d / 3);
  var end = t + a + (hold || d); p.setTargetAtTime(0.0001, end, r / 4);
  g._end = end + r + 0.05; return g;
}
function filt(type, f, q) { var b = AUDIO.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); return arguments[arguments.length - 1]; }
function outFor(pos) {
  if (!pos) return AUDIO.sfx;
  var p = AUDIO.ctx.createPanner(); p.panningModel = Q === QUAL.LOW ? 'equalpower' : 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1.5; p.rolloffFactor = 1.1; p.maxDistance = 60;
  setPannerPos(p, pos.x, pos.y, pos.z); p.connect(AUDIO.sfx); return p;
}
function tone(t, type, f, a, peak, d, r, out, f2, glide) {
  var o = AUDIO.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || d));
  var g = envG(t, a, peak, d, 0, r); o.connect(g); g.connect(out); o.start(t); o.stop(g._end); return o;
}
function noiseHit(t, kind, ftype, f, q, a, peak, d, r, out, f2) {
  var s = nz(kind), b = filt(ftype, f, q), g = envG(t, a, peak, d, 0, r); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t + d);
  s.connect(b); b.connect(g); g.connect(out); s.start(t, Math.random() * 1.5); s.stop(g._end); return g;
}
function bellPartials(t, f0, ratios, amps, dec, out, vol) {
  ratios.forEach(function (r, i) { tone(t, 'sine', f0 * r * rv(0.997, 1.003), 0.002, amps[i] * vol, dec * (1 - i * 0.12), dec * 0.5, out); });
}
// the SFX library (each call varies pitch/level/length a little)
function sfx(name, pos, opt) {
  if (!AUDIO.ok) return;
  opt = opt || {};
  var c = AUDIO.ctx, t = c.currentTime + (opt.delay || 0), out = outFor(pos), v = (opt.vol || 1) * rv(0.85, 1.05), p = rv(0.95, 1.06);
  switch (name) {
    case 'click': tone(t, 'triangle', 1800 * p, 0.001, 0.12 * v, 0.02, 0.02, out); noiseHit(t, 'white', 'bandpass', 3500, 2, 0.001, 0.08 * v, 0.015, 0.02, out); break;
    case 'paper': noiseHit(t, 'white', 'bandpass', 2600 * p, 0.8, 0.01, 0.16 * v, 0.06, 0.08, out, 5200); noiseHit(t + 0.05, 'pink', 'highpass', 1800, 0.7, 0.005, 0.1 * v, 0.1, 0.1, out); break;
    case 'paperSlide': noiseHit(t, 'pink', 'bandpass', 1400 * p, 0.6, 0.06, 0.12 * v, 0.25, 0.15, out, 2600); break;
    case 'pen': for (var i = 0; i < 4; i++) noiseHit(t + i * rv(0.04, 0.07), 'white', 'bandpass', rv(3000, 5000), 3, 0.004, 0.06 * v, 0.03, 0.03, out); break;
    case 'step': noiseHit(t, 'brown', 'lowpass', 380 * p, 0.7, 0.004, 0.25 * v, 0.06, 0.07, out); noiseHit(t + 0.01, 'white', 'bandpass', 2200, 1.4, 0.002, 0.05 * v, 0.02, 0.03, out); break;
    case 'doorbell': bellPartials(t, 1320 * p, [1, 2.76, 5.4, 8.9], [0.35, 0.2, 0.12, 0.05], 1.4, out, v); bellPartials(t + rv(0.12, 0.2), 1180 * p, [1, 2.76, 5.4], [0.25, 0.14, 0.07], 1.2, out, v); noiseHit(t, 'white', 'highpass', 6000, 0.7, 0.001, 0.05 * v, 0.04, 0.05, out); break;
    case 'orderBell': bellPartials(t, 1760 * p, [1, 2.4, 3.9, 6.8], [0.4, 0.22, 0.12, 0.06], 1.8, out, v); tone(t, 'square', 90, 0.001, 0.05 * v, 0.02, 0.02, out); break;
    case 'door': noiseHit(t, 'brown', 'lowpass', 300, 0.8, 0.02, 0.3 * v, 0.2, 0.2, out); tone(t + 0.05, 'triangle', 150 * p, 0.01, 0.06 * v, 0.2, 0.2, out, 110); break;
    case 'pour': (function () { var s = nz('pink'), b = filt('bandpass', 900 * p, 1.2), g = envG(t, 0.08, 0.22 * v, opt.len || 1.2, 0.9, 0.25, opt.len || 1.2), lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = rv(9, 14); lg.gain.value = 300; lfo.connect(lg); lg.connect(b.frequency); b.frequency.linearRampToValueAtTime(1500 * p, t + (opt.len || 1.2)); s.connect(b); b.connect(g); g.connect(out); s.start(t); lfo.start(t); s.stop(g._end); lfo.stop(g._end); })(); break;
    case 'cup': bellPartials(t, rv(2300, 2900), [1, 2.3, 3.7], [0.12, 0.07, 0.04], 0.18, out, v); tone(t, 'sine', rv(380, 460), 0.001, 0.08 * v, 0.05, 0.04, out); break;
    case 'cutlery': for (var k2 = 0; k2 < 3; k2++) bellPartials(t + k2 * rv(0.05, 0.11), rv(3200, 4800), [1, 2.7, 4.1], [0.07, 0.04, 0.02], 0.12, out, v); break;
    case 'register': noiseHit(t, 'brown', 'lowpass', 600, 0.9, 0.003, 0.35 * v, 0.05, 0.05, out); for (var r2 = 0; r2 < 3; r2++) noiseHit(t + 0.06 + r2 * 0.05, 'white', 'bandpass', 2800, 4, 0.002, 0.1 * v, 0.02, 0.02, out);
      bellPartials(t + 0.22, 2100 * p, [1, 2.76, 5.4], [0.34, 0.16, 0.08], 1.3, out, v); noiseHit(t + 0.3, 'pink', 'bandpass', 700, 1, 0.03, 0.2 * v, 0.25, 0.2, out, 400); break;
    case 'print': for (var q2 = 0; q2 < (opt.n || 26); q2++) { var tt = t + q2 * 0.055; tone(tt, 'square', rv(780, 860), 0.002, 0.03 * v, 0.03, 0.02, out); noiseHit(tt, 'white', 'bandpass', 4200, 3, 0.001, 0.04 * v, 0.025, 0.02, out); } noiseHit(t + (opt.n || 26) * 0.055, 'white', 'highpass', 3000, 0.7, 0.002, 0.14 * v, 0.06, 0.05, out); break;
    case 'stool': (function () { var o = c.createOscillator(), b = filt('bandpass', 1200 * p, 9), g = envG(t, 0.04, 0.05 * v, 0.3, 0.6, 0.15, 0.3); o.type = 'sawtooth'; o.frequency.setValueAtTime(rv(320, 380), t); o.frequency.linearRampToValueAtTime(rv(420, 520), t + 0.35); o.connect(b); b.connect(g); g.connect(out); o.start(t); o.stop(g._end); })(); break;
    case 'sizzle': (function () { var len = opt.len || 2; var s = nz('white'), hp = filt('highpass', 3500 * p, 0.6), pk = filt('peaking', 7000, 1), g = envG(t, 0.15, 0.16 * v, len, 0.85, 0.6, len); pk.gain.value = 6; chain(s, hp, pk, g, out); s.start(t); s.stop(g._end);
      for (var j = 0; j < len * 9; j++) noiseHit(t + Math.random() * len, 'white', 'bandpass', rv(2000, 6000), 2, 0.001, rv(0.05, 0.16) * v, 0.01, 0.02, out); })(); break;
    case 'scrape': noiseHit(t, 'white', 'bandpass', 2200 * p, 3, 0.02, 0.16 * v, 0.18, 0.08, out, 3200); bellPartials(t, rv(1600, 1900), [1, 2.3], [0.05, 0.03], 0.25, out, v); break;
    case 'flip': noiseHit(t, 'pink', 'bandpass', 600, 0.8, 0.04, 0.18 * v, 0.1, 0.06, out, 1600); noiseHit(t + 0.16, 'brown', 'lowpass', 300, 0.8, 0.003, 0.4 * v, 0.06, 0.08, out); sfx('sizzle', pos, { len: 0.6, vol: 0.7 }); break;
    case 'crack': noiseHit(t, 'white', 'bandpass', 3000 * p, 2, 0.001, 0.3 * v, 0.02, 0.03, out); noiseHit(t + 0.03, 'white', 'highpass', 2000, 1, 0.002, 0.12 * v, 0.06, 0.05, out); tone(t + 0.08, 'sine', 120, 0.01, 0.12 * v, 0.1, 0.08, out, 80); break;
    case 'thump': noiseHit(t, 'brown', 'lowpass', 220 * p, 0.8, 0.003, 0.35 * v, 0.07, 0.08, out); break;
    case 'whir': (function () { var len = opt.len || 1.5, o = c.createOscillator(), o2 = c.createOscillator(), g = envG(t, 0.2, 0.06 * v, len, 0.9, 0.3, len), b = filt('bandpass', 900, 2); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(240 * p, t + 0.4); o2.frequency.value = 241 * p; chain(o, b); o2.connect(b); b.connect(g); g.connect(out); o.start(t); o2.start(t); o.stop(g._end); o2.stop(g._end); sfx('pour', pos, { len: len, vol: 0.5 }); })(); break;
    case 'knife': noiseHit(t, 'white', 'bandpass', 3800 * p, 4, 0.01, 0.16 * v, 0.12, 0.05, out, 2400); noiseHit(t + 0.14, 'brown', 'lowpass', 500, 1, 0.002, 0.25 * v, 0.04, 0.04, out); break;
    case 'needle': noiseHit(t, 'white', 'bandpass', 1800, 1.5, 0.002, 0.5 * v, 0.08, 0.06, out, 600); noiseHit(t + 0.09, 'white', 'highpass', 3000, 1, 0.002, 0.3 * v, 0.05, 0.05, out); noiseHit(t + 0.2, 'pink', 'bandpass', 900, 2, 0.001, 0.2 * v, 0.1, 0.1, out, 300); break;
    case 'switch': noiseHit(t, 'white', 'bandpass', 2400, 2, 0.001, 0.3 * v, 0.015, 0.02, out); noiseHit(t + 0.012, 'brown', 'lowpass', 400, 1, 0.001, 0.3 * v, 0.03, 0.03, out); break;
    case 'zap': noiseHit(t, 'white', 'highpass', 1500, 0.7, 0.001, 0.4 * v, 0.06, 0.08, out); tone(t, 'sawtooth', 120, 0.001, 0.2 * v, 0.25, 0.2, out, 40); break;
    case 'handset': noiseHit(t, 'brown', 'lowpass', 500, 1, 0.002, 0.4 * v, 0.04, 0.05, out); noiseHit(t + 0.05, 'white', 'bandpass', 2500, 3, 0.001, 0.15 * v, 0.02, 0.02, out); break;
    case 'dialtone': tone(t, 'sine', 350, 0.01, 0.06 * v, opt.len || 1.2, 0.05, out); tone(t, 'sine', 440, 0.01, 0.06 * v, opt.len || 1.2, 0.05, out); break;
    case 'ring': ringPhone(t, out, v, opt.distort || 0); break;
    case 'knock': for (var kk = 0; kk < (opt.n || 3); kk++) { var tk = t + kk * rv(0.22, 0.3); noiseHit(tk, 'brown', 'lowpass', 260 * p, 1, 0.002, 0.7 * v, 0.07, 0.1, out); noiseHit(tk, 'white', 'bandpass', 900, 2, 0.001, 0.12 * v, 0.03, 0.04, out); } break;
    case 'bang': noiseHit(t, 'brown', 'lowpass', 180, 1, 0.002, 1.0 * v, 0.2, 0.25, out); noiseHit(t, 'white', 'bandpass', 600, 1, 0.001, 0.4 * v, 0.1, 0.1, out); tone(t, 'sine', 70, 0.002, 0.5 * v, 0.3, 0.2, out, 45); break;
    case 'breath': (function () { var len = opt.len || 2.4; for (var b2 = 0; b2 < 2; b2++) { var st = t + b2 * len / 2, s = nz('pink'), bp = filt('bandpass', b2 ? 900 : 1300, 1.4), g = envG(st, len * 0.18, 0.22 * v, len * 0.25, 0.6, len * 0.2, len * 0.22); chain(s, bp, g, out); s.start(st); s.stop(g._end); } })(); break;
    case 'whisper': for (var w2 = 0; w2 < 7; w2++) noiseHit(t + w2 * rv(0.1, 0.2), 'white', 'bandpass', rv(1800, 4200), 6, 0.02, rv(0.06, 0.12) * v, 0.08, 0.06, out); break;
    case 'steps': for (var s3 = 0; s3 < (opt.n || 4); s3++) { var ts = t + s3 * rv(0.42, 0.55); noiseHit(ts, 'brown', 'lowpass', 300 * p, 0.7, 0.003, 0.5 * v, 0.08, 0.1, out); noiseHit(ts + 0.02, 'white', 'bandpass', 1400, 1.4, 0.002, 0.06 * v, 0.03, 0.04, out); } break;
    case 'freezerBang': noiseHit(t, 'brown', 'lowpass', 140, 1, 0.002, 1.1 * v, 0.25, 0.4, out); tone(t, 'triangle', 90, 0.002, 0.3 * v, 0.6, 0.4, out, 70); bellPartials(t, 420, [1, 2.4, 3.8], [0.06, 0.04, 0.02], 0.8, out, v); break;
    case 'static': noiseHit(t, 'white', 'highpass', 800, 0.5, 0.01, 0.12 * v, opt.len || 0.8, 0.2, out); break;
    case 'stinger': [0, 1, 6, 11].forEach(function (s4, i) { tone(t, 'sawtooth', 110 * Math.pow(2, s4 / 12) * p, 0.01, 0.07 * v, 1.4, 0.8, out, 110 * Math.pow(2, s4 / 12) * 0.9, 1.4); }); noiseHit(t, 'white', 'bandpass', 4000, 1, 0.001, 0.3 * v, 0.3, 0.3, out); tone(t, 'sine', 55, 0.005, 0.5 * v, 1.0, 0.6, out, 35); break;
    case 'scream': scream(t, out, v); break;
    case 'heart': for (var h2 = 0; h2 < (opt.n || 4); h2++) { var th = t + h2 * (opt.gap || 0.8); tone(th, 'sine', 55, 0.005, 0.5 * v, 0.08, 0.08, out, 40); tone(th + 0.17, 'sine', 48, 0.005, 0.35 * v, 0.08, 0.08, out, 36); } break;
    case 'thunder': (function () { var s = nz('brown'), lp = filt('lowpass', 420, 0.5), g = envG(t, 0.04, 0.9 * v, 0.6, 0.5, 2.5, 1.2); lp.frequency.exponentialRampToValueAtTime(90, t + 3); chain(s, lp, g, AUDIO.amb); s.start(t); s.stop(g._end); noiseHit(t, 'white', 'highpass', 1200, 0.7, 0.002, 0.3 * v, 0.15, 0.3, AUDIO.amb); })(); break;
    case 'coyote': (function () { var o = c.createOscillator(), vb = c.createOscillator(), vg = c.createGain(), bp = filt('bandpass', 1100, 3), g = envG(t, 0.25, 0.05 * v, 1.6, 0.8, 0.8, 1.6); o.type = 'sawtooth'; o.frequency.setValueAtTime(500, t); o.frequency.linearRampToValueAtTime(900, t + 0.5); o.frequency.linearRampToValueAtTime(700, t + 1.9); vb.frequency.value = 6; vg.gain.value = 18; vb.connect(vg); vg.connect(o.frequency); chain(o, bp, g, outFor(opt.at || new THREE.Vector3(-60, 2, 80))); o.start(t); vb.start(t); o.stop(g._end); vb.stop(g._end); })(); break;
    case 'carPass': (function () { var s = nz('pink'), lp = filt('lowpass', 900, 0.6), g = envG(t, 1.6, 0.35 * v, 1.2, 0.3, 1.8, 0.8); chain(s, lp, g, out); s.start(t); s.stop(g._end); tone(t, 'sawtooth', 55, 1.4, 0.04 * v, 1.2, 1.5, out, 42, 3); })(); break;
    case 'engine': (function () { var len = opt.len || 6; var o = c.createOscillator(), lp = filt('lowpass', 260, 1), g = envG(t, 1.0, 0.12 * v, len, 0.8, 1.5, len); o.type = 'sawtooth'; o.frequency.setValueAtTime(42, t); o.frequency.linearRampToValueAtTime(opt.down ? 30 : 58, t + len); chain(o, lp, g, out); o.start(t); o.stop(g._end); noiseHit(t, 'brown', 'lowpass', 200, 0.7, 1, 0.2 * v, len, 1, out); })(); break;
    case 'tires': noiseHit(t, 'pink', 'bandpass', 500, 0.6, 0.6, 0.12 * v, 2.5, 1.0, out); break;
    case 'carDoor': noiseHit(t, 'brown', 'lowpass', 260, 1, 0.002, 0.5 * v, 0.12, 0.15, out); noiseHit(t, 'white', 'bandpass', 1500, 2, 0.001, 0.1 * v, 0.03, 0.04, out); break;
    case 'jingleHit': tone(t, 'sine', 880, 0.002, 0.1 * v, 0.3, 0.3, out, 440); break;
    case 'coin': bellPartials(t, rv(3800, 4400), [1, 1.5, 2.9], [0.14, 0.07, 0.04], 0.35, out, v); bellPartials(t + rv(0.06, 0.1), rv(3500, 4100), [1, 1.5, 2.9], [0.1, 0.05, 0.02], 0.3, out, v); break;
    case 'tearPaper': noiseHit(t, 'white', 'bandpass', 2000 * p, 0.7, 0.01, 0.35 * v, 0.28, 0.06, out, 4500); for (var tp = 0; tp < 6; tp++) noiseHit(t + tp * 0.04, 'white', 'highpass', 3000, 1, 0.001, 0.1 * v, 0.02, 0.02, out); break;
    case 'freeze': noiseHit(t, 'white', 'highpass', 5000, 0.7, 0.3, 0.06 * v, 1.5, 0.8, out); break;
    case 'pop': noiseHit(t, 'white', 'bandpass', rv(2500, 5000), 3, 0.001, 0.2 * v, 0.01, 0.02, out); break;
    case 'drip': tone(t, 'sine', rv(1400, 2200), 0.001, 0.05 * v, 0.04, 0.03, out, rv(500, 800), 0.05); break;
  }
}
function sfxAt(name, pos, opt) { sfx(name, pos, opt); }
function ringPhone(t, out, v, dist) {
  // classic two-burst bell ring (clapper ~22Hz on a bell), distortion grows each call
  var c = AUDIO.ctx, f0 = 1050 * (1 - dist * 0.12);
  for (var burst = 0; burst < 2; burst++) {
    var tb = t + burst * 0.55, len = 0.4;
    var mod = c.createOscillator(), mg = c.createGain(); mod.type = 'square'; mod.frequency.value = 22; mg.gain.value = 0.5;
    var am = c.createGain(); am.gain.value = 0.5; mod.connect(mg); mg.connect(am.gain);
    [1, 1.47, 2.6, 3.9].forEach(function (r, i) { var o = c.createOscillator(); o.type = dist > 0.4 ? 'sawtooth' : 'sine'; o.frequency.value = f0 * r; var g = c.createGain(); g.gain.value = [0.18, 0.12, 0.06, 0.03][i] * v; o.connect(g); g.connect(am); o.start(tb); o.stop(tb + len + 0.05); });
    var env = envG(tb, 0.005, 1, len, 1, 0.08, len);
    if (dist > 0) { var ws = c.createWaveShaper(); ws.curve = satCurve(1 + dist * 8); am.connect(ws); ws.connect(env); } else am.connect(env);
    env.connect(out); mod.start(tb); mod.stop(tb + len + 0.1);
  }
}
function scream(t, out, v) {
  var c = AUDIO.ctx, mild = SAVE.settings.scare === 'MILD', vol = (mild ? 0.45 : 1) * v;
  var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9 * vol, t + 0.02); g.gain.setTargetAtTime(0.5 * vol, t + 0.3, 0.3); g.gain.setTargetAtTime(0.0001, t + 1.5, 0.25);
  var ws = c.createWaveShaper(); ws.curve = satCurve(4); var bp = filt('bandpass', 1400, 0.7);
  [0, 7, 13, 18].forEach(function (s, i) { var o = c.createOscillator(); o.type = 'sawtooth'; var f = 260 * Math.pow(2, s / 12); o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.25); o.frequency.linearRampToValueAtTime(f * 0.82, t + 1.6); var vb = c.createOscillator(), vg = c.createGain(); vb.frequency.value = 7 + i * 2; vg.gain.value = f * 0.04; vb.connect(vg); vg.connect(o.frequency); o.connect(ws); o.start(t); vb.start(t); o.stop(t + 2); vb.stop(t + 2); });
  var s = nz('white'), nf = filt('bandpass', 3000, 0.6); s.connect(nf); nf.connect(ws); s.start(t); s.stop(t + 2);
  ws.connect(bp); bp.connect(g); g.connect(out);
  var sub = c.createOscillator(); sub.type = 'sine'; sub.frequency.setValueAtTime(90, t); sub.frequency.exponentialRampToValueAtTime(32, t + 1.2); var sg = envG(t, 0.005, 0.9 * vol, 0.9, 0, 0.3); sub.connect(sg); sg.connect(out); sub.start(t); sub.stop(sg._end);
}
// ---- ambience loops (fridge hum, neon buzz, rain, wind) -------------------------------
var AMB = {};
function loopNoise(kind, ftype, f, q, vol, pos) {
  var c = AUDIO.ctx, s = nz(kind), b = filt(ftype, f, q), g = c.createGain(); g.gain.value = 0; s.connect(b); b.connect(g); g.connect(pos ? outFor(pos) : AUDIO.amb); s.start(0, Math.random()); return { s: s, b: b, g: g, base: vol };
}
function startAmbience() {
  var c = AUDIO.ctx;
  // fridge/hvac hum (60Hz + harmonics) near kitchen
  var hum = c.createGain(); hum.gain.value = 0;
  [60, 120, 180, 240].forEach(function (f, i) { var o = c.createOscillator(); o.frequency.value = f; var g = c.createGain(); g.gain.value = [0.5, 0.25, 0.12, 0.06][i]; o.connect(g); g.connect(hum); o.start(); });
  var hp = filt('lowpass', 500, 0.7); hum.connect(hp); hp.connect(outFor(new THREE.Vector3(5.5, 1.2, -3.6)));
  AMB.hum = { g: hum, base: 0.035 };
  // neon buzz (120Hz sawtooth band-limited) near the neon
  var bz = c.createOscillator(); bz.type = 'sawtooth'; bz.frequency.value = 120; var bzf = filt('bandpass', 2400, 2.5); var bzg = c.createGain(); bzg.gain.value = 0; bz.connect(bzf); bzf.connect(bzg); bzg.connect(outFor(new THREE.Vector3(1.5, 2.5, -2.6))); bz.start();
  AMB.neon = { g: bzg, base: 0.012 };
  AMB.room = loopNoise('pink', 'lowpass', 400, 0.5, 0.02);
  AMB.rain = loopNoise('pink', 'bandpass', 1800, 0.35, 0.0);
  AMB.rainLow = loopNoise('brown', 'lowpass', 300, 0.5, 0.0);
  AMB.wind = loopNoise('brown', 'bandpass', 420, 0.9, 0.0);
  AMB.dripT = 0;
}
function updateAmbience(dt) {
  if (!AMB.hum) return; var t = AUDIO.ctx.currentTime, sp = AUDIO.space;
  var inside = sp !== 'outside', fz = sp === 'freezer';
  AMB.hum.g.gain.setTargetAtTime((fz ? 0.09 : AMB.hum.base) * (typeof GAME !== 'undefined' && GAME && GAME.blackout ? 0 : 1), t, 0.5);
  AMB.neon.g.gain.setTargetAtTime(AMB.neon.base * LSTATE.neon * (inside ? 1 : 0.3), t, 0.2);
  AMB.room.g.gain.setTargetAtTime(0.02, t, 0.5);
  var r = FX.rain || 0, muff = fz ? 0.15 : (inside ? 0.45 : 1);
  AMB.rain.g.gain.setTargetAtTime(r * 0.09 * muff, t, 0.6); AMB.rain.b.frequency.setTargetAtTime(inside ? 1100 : 2400, t, 0.5);
  AMB.rainLow.g.gain.setTargetAtTime(r * 0.12 * muff, t, 0.6);
  AMB.wind.g.gain.setTargetAtTime((0.02 + r * 0.04) * (inside ? 0.4 : 1) * (0.7 + 0.3 * Math.sin(t * 0.3)), t, 1);
  AMB.wind.b.frequency.setTargetAtTime(300 + 200 * Math.sin(t * 0.13), t, 1);
  if (r > 0.2 && inside) { AMB.dripT -= dt; if (AMB.dripT <= 0) { AMB.dripT = rv(0.3, 2.2) / r; sfx('drip', new THREE.Vector3(rv(-7, 4), 2.6, 5.1), { vol: 0.35 }); } }
}
function sfxCarPass(car) { sfx('carPass', new THREE.Vector3(car.obj.position.x * 0.3, 1, car.obj.position.z), { vol: 0.5 }); }
function sfxCarArrive(leave) { var p = FX.visitor.obj.position.clone(); sfx('engine', new THREE.Vector3(p.x, 1, Math.min(p.z, 20)), { len: 7, down: !leave, vol: 0.8 }); sfx('tires', new THREE.Vector3(p.x, 0.5, 15), { vol: 0.6, delay: 4 }); if (!leave) sfx('carDoor', new THREE.Vector3(0, 1, 10), { delay: 9.5, vol: 0.7 }); }


// ===== 13_voice.js =====
// ---- voices: TTS selection, character profiles, subtitles sync, pico voice ----------
var VOICE = { ok: false, list: [], en: { f: null, m: null, any: null }, ja: { f: null, m: null, any: null }, speaking: false, token: 0, ready: false };
var VPROF = {
  default: { g: 'f', pitch: 1.0, rate: 1.0 },
  trucker: { g: 'm', pitch: 0.62, rate: 0.82 }, oldman: { g: 'm', pitch: 0.8, rate: 0.86 }, salesman: { g: 'm', pitch: 1.0, rate: 1.08 },
  mechanic: { g: 'm', pitch: 0.9, rate: 0.96 }, teen: { g: 'm', pitch: 1.15, rate: 1.1 }, cowboy: { g: 'm', pitch: 0.7, rate: 0.85 },
  girl: { g: 'f', pitch: 1.38, rate: 1.1 }, nurse: { g: 'f', pitch: 1.05, rate: 1.0 }, mom: { g: 'f', pitch: 1.1, rate: 1.02 }, lady: { g: 'f', pitch: 0.92, rate: 0.9 },
  waitress: { g: 'f', pitch: 1.15, rate: 1.0 }, kid: { g: 'f', pitch: 1.75, rate: 1.12 },
  manager: { g: 'm', pitch: 0.82, rate: 0.94, phone: 1 }, sunny: { g: 'f', pitch: 1.85, rate: 1.12, pico: 1 }, june: { g: 'f', pitch: 0.95, rate: 0.9 },
  odd: { g: 'm', pitch: 0.55, rate: 0.7 }, you: { g: 'm', pitch: 1.0, rate: 1.0 }
};
function initVoices() {
  var ss = window.speechSynthesis; if (!ss || typeof SpeechSynthesisUtterance === 'undefined') { VOICE.ok = false; VOICE.ready = true; return; }
  VOICE.ok = true;
  var pick = function () {
    var vs = []; try { vs = ss.getVoices() || []; } catch (e) {}
    if (!vs.length) return false;
    VOICE.list = vs; rankVoices(vs); VOICE.ready = true; return true;
  };
  if (!pick()) { try { ss.addEventListener ? ss.addEventListener('voiceschanged', pick) : (ss.onvoiceschanged = pick); } catch (e) {} setTimeout(function () { pick(); VOICE.ready = true; }, 2500); }
}
var FEMALE = /samantha|karen|moira|tessa|victoria|allison|ava|susan|zoe|kate|serena|fiona|nicky|female|joanna|salli|kimberly|jenny|aria|emma|libby|sonia|natasha|kyoko|o-ren|hattori|nanami|mizuki|sara|siri.*(voice 2|voice 4)/i;
var MALE = /alex|daniel|fred|tom|aaron|arthur|gordon|oliver|rishi|male|evan|nathan|guy|ryan|matthew|joey|otoya|ichiro|keita|siri.*(voice 1|voice 3)/i;
function vscore(v, lang) {
  var s = 0, n = v.name || '';
  if (!v.lang || v.lang.toLowerCase().indexOf(lang) !== 0) return -1;
  if (/enhanced|premium|neural|natural/i.test(n)) s += 120;
  if (/siri/i.test(n)) s += 90;
  if (/google/i.test(n)) s += 45;
  if (/microsoft.*online/i.test(n)) s += 70;
  if (lang === 'en' && /en[-_]us/i.test(v.lang)) s += 12;
  if (/compact|eloquence|novelty|bad news|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|organ|superstar|jester|albert|wobble|hysterical|deranged|bahh|good news|pipe/i.test(n)) s -= 200;
  if (v.localService) s += 5;
  return s;
}
function rankVoices(vs) {
  ['en', 'ja'].forEach(function (lang) {
    var best = { f: null, m: null, any: null }, bs = { f: -1e9, m: -1e9, any: -1e9 };
    vs.forEach(function (v) {
      var s = vscore(v, lang); if (s < 0 && s > -100) return; if (s <= -100) return;
      var g = FEMALE.test(v.name) ? 'f' : (MALE.test(v.name) ? 'm' : '');
      if (s > bs.any) { bs.any = s; best.any = v; }
      if (g && s > bs[g]) { bs[g] = s; best[g] = v; }
    });
    VOICE[lang] = best;
  });
}
function voiceFor(prof, lang) { var V = VOICE[lang]; return (V && (V[prof.g] || V.any)) || null; }
function stopVoice() { VOICE.token++; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} VOICE.speaking = false; picoStop(); if (VOICE.phoneLoop) { phoneLineStop(); } duckMusic(false); }
// speak a line; returns Promise resolved when finished (or estimated time if TTS unavailable)
function speak(line) {
  var mode = SAVE.settings.voiceMode, tok = ++VOICE.token;
  var prof = VPROF[line.voice || 'default'] || VPROF.default;
  var text = mode === 'JA' ? (line.jaSay || line.ja) : (line.sayEn || line.en);
  var rateMul = { SLOW: 0.86, NORMAL: 1, FAST: 1.16 }[SAVE.settings.voiceRate] || 1;
  var est = Math.max(1.2, (text || '').length / (mode === 'JA' ? 7.5 : 14) / rateMul);
  return new Promise(function (res) {
    var finished = false, done = function () { if (finished) return; finished = true; if (tok === VOICE.token) { VOICE.speaking = false; duckMusic(false); picoStop(); } res(); };
    if (prof.pico) picoStart(line.picoDark || 0, est);
    if (prof.phone) phoneLineStart();
    if (mode === 'OFF' || !VOICE.ok || !text) { setTimeout(done, est * 1000 * (mode === 'OFF' ? 0.9 : 1)); return; }
    try {
      var ss = window.speechSynthesis; ss.cancel();
      var parts = [text];
      if (line.odd && mode !== 'JA') { var w = text.split(' '); if (w.length > 3) { var cut = 1 + Math.floor(Math.random() * (w.length - 2)); parts = [w.slice(0, cut).join(' '), w.slice(cut).join(' ')]; } }
      var lang = mode === 'JA' ? 'ja' : 'en', v = voiceFor(prof, lang), offset = 0;
      VOICE.speaking = true; duckMusic(true);
      var speakPart = function (i) {
        if (tok !== VOICE.token) return done();
        if (i >= parts.length) return done();
        var u = new SpeechSynthesisUtterance(parts[i]); if (v) u.voice = v; u.lang = v ? v.lang : (lang === 'ja' ? 'ja-JP' : 'en-US');
        var pitch = prof.pitch * (line.pitch || 1), rate = prof.rate * rateMul * (line.rate || 1);
        if (line.odd) { rate *= i ? 0.78 : 1.06; pitch *= i ? 0.96 : 1; }
        u.pitch = clamp(pitch, 0.1, 2); u.rate = clamp(rate, 0.5, 1.6); u.volume = clamp(SAVE.settings.voice, 0, 1);
        var base = offset;
        u.onboundary = function (e) { if (lang === 'en' && e.charIndex != null) line.boundary = base + e.charIndex + (e.charLength || 4); };
        u.onend = function () { offset += parts[i].length + 1; if (i + 1 < parts.length) setTimeout(function () { speakPart(i + 1); }, line.odd ? 650 + Math.random() * 500 : 50); else done(); };
        u.onerror = function () { done(); };
        ss.speak(u);
      };
      speakPart(0);
      setTimeout(done, (est * 2.6 + 4) * 1000); // never hang
    } catch (e) { setTimeout(done, est * 1000); }
  });
}
// ---- Sunny's pico voice: little chirps, gets lower & distorted near the truth ----------
var PICO = { on: false, timer: 0, dark: 0 };
function picoStart(dark, dur) {
  if (!AUDIO.ok) return; picoStop(); PICO.on = true; PICO.dark = dark || 0; PICO.end = AUDIO.ctx.currentTime + Math.min(dur, 6);
  var step = function () {
    if (!PICO.on || AUDIO.ctx.currentTime > PICO.end) return;
    var c = AUDIO.ctx, t = c.currentTime, d = PICO.dark, f = (900 + Math.random() * 500) * (1 - d * 0.65);
    var o = c.createOscillator(); o.type = d > 0.5 ? 'sawtooth' : 'square';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.3 : 0.75), t + 0.07);
    var bp = filt('bandpass', 1800 * (1 - d * 0.5), 2.5), g = envG(t, 0.004, 0.05, 0.05, 0, 0.03);
    var out = g;
    if (d > 0.3) { var ws = c.createWaveShaper(); ws.curve = satCurve(1 + d * 10); g.connect(ws); out = ws; }
    o.connect(bp); bp.connect(g); out.connect(AUDIO.voice); o.start(t); o.stop(t + 0.14);
    PICO.timer = setTimeout(step, 70 + Math.random() * 70 + d * 60);
  };
  step();
}
function picoStop() { PICO.on = false; clearTimeout(PICO.timer); }
// ---- phone line: handset click + hiss/crackle around a phone voice ---------------------
function phoneLineStart() {
  if (!AUDIO.ok || VOICE.phoneLoop) return;
  var c = AUDIO.ctx, s = nz('white'), bp = filt('bandpass', 2400, 0.9), g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.025, c.currentTime, 0.1);
  s.connect(bp); bp.connect(g); g.connect(AUDIO.voice); s.start();
  VOICE.phoneLoop = { s: s, g: g, crackle: setInterval(function () { if (Math.random() < 0.5) sfx('pop', null, { vol: 0.25 }); }, 300) };
}
function phoneLineStop() { var p = VOICE.phoneLoop; if (!p) return; VOICE.phoneLoop = null; clearInterval(p.crackle); try { p.g.gain.setTargetAtTime(0.0001, AUDIO.ctx.currentTime, 0.1); p.s.stop(AUDIO.ctx.currentTime + 0.5); } catch (e) {} }
// ---- dialogue: subtitle + voice; resolves on tap (or auto after voice) ----------------
var TALK = { busy: false, token: 0 };
function say(who, en, ja, opt) {
  opt = opt || {};
  var tok = ++TALK.token; TALK.busy = true;
  var line = { who: who, en: en, ja: ja, voice: opt.voice, odd: opt.odd, pitch: opt.pitch, rate: opt.rate, cls: opt.cls, cps: opt.cps || (opt.odd ? 18 : 26), picoDark: opt.picoDark, jaSay: opt.jaSay, sayEn: opt.sayEn };
  return new Promise(function (res) {
    var spoken = false, closed = false;
    var finish = function () { if (closed) return; closed = true; if (tok === TALK.token) { TALK.busy = false; if (!opt.keep) subHide(); } res(); };
    line.onTap = function () { if (spoken || opt.tapSkip !== false) { stopVoice(); finish(); } };
    subShow(line);
    var p = opt.silent ? wait(Math.max(1.4, en.length / 16)) : speak(line);
    p.then(function () {
      spoken = true;
      if (tok !== TALK.token) return finish();
      SUBQ.shown = line.en.length; U.sub.querySelector('.l1').textContent = line.en;
      if (opt.auto !== false) setTimeout(finish, (opt.hold == null ? 0.9 : opt.hold) * 1000);
    });
  });
}
function talkCancel() { TALK.token++; TALK.busy = false; stopVoice(); subHide(); }
async function talk(lines) { for (var i = 0; i < lines.length; i++) { var L = lines[i]; if (typeof L === 'function') { L(); continue; } await say(L[0], L[1], L[2], L[3]); } }


// ===== 14_people.js =====
// ---- people: procedural customers (seated/walking), face textures, horror shell -----
var SKIN = [[241, 205, 178], [228, 184, 150], [205, 152, 112], [176, 120, 84], [130, 86, 58], [96, 62, 42], [236, 196, 170]];
var HAIRC = ['#1b1410', '#3a2618', '#6b4426', '#a8763e', '#d9b46a', '#8c8c8c', '#d8d4cc', '#5a1e12', '#2a1a10'];
function rgbs(a, m) { m = m || 1; return 'rgb(' + Math.round(clamp(a[0] * m, 0, 255)) + ',' + Math.round(clamp(a[1] * m, 0, 255)) + ',' + Math.round(clamp(a[2] * m, 0, 255)) + ')'; }
// face texture: equirect 512x256, face centered at u=0.25 (front of a three.js sphere)
function faceCanvas(o) {
  var c = mkCanvas(512, 256), g = c.getContext('2d'), sk = o.skin, rnd = makeRNG(o.seed || 1);
  g.fillStyle = rgbs(sk); g.fillRect(0, 0, 512, 256);
  // subtle skin variation + pores
  for (var i = 0; i < 600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '120,60,40' : '255,230,210') + ',' + rnd() * 0.05 + ')'; g.beginPath(); g.arc(rnd() * 512, rnd() * 256, 2 + rnd() * 8, 0, TAU); g.fill(); }
  var cx = 128, ey = 128;
  if (o.faceless) { // smooth, featureless — only faint hollows
    smudge(g, cx - 22, ey, 16, 'rgba(90,50,40,A)', 0.12); smudge(g, cx + 22, ey, 16, 'rgba(90,50,40,A)', 0.12); smudge(g, cx, ey + 46, 18, 'rgba(90,50,40,A)', 0.08);
    return c;
  }
  // cheeks / lips color
  smudge(g, cx - 34, ey + 30, 18, 'rgba(220,90,90,A)', 0.18 * (o.blush || 1)); smudge(g, cx + 34, ey + 30, 18, 'rgba(220,90,90,A)', 0.18 * (o.blush || 1));
  // eye sockets shading
  smudge(g, cx - 21, ey, 15, 'rgba(80,40,30,A)', 0.22); smudge(g, cx + 21, ey, 15, 'rgba(80,40,30,A)', 0.22);
  // nose shadow & highlight
  g.fillStyle = 'rgba(90,45,30,0.10)'; g.beginPath(); g.ellipse(cx + 3, ey + 16, 4, 10, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(80,35,25,0.35)'; g.beginPath(); g.ellipse(cx - 6, ey + 27, 3.2, 2, 0, 0, TAU); g.ellipse(cx + 6, ey + 27, 3.2, 2, 0, 0, TAU); g.fill();
  // brows
  g.strokeStyle = o.browC || '#3a2618'; g.lineWidth = o.thickBrow ? 5 : 3.4; g.lineCap = 'round';
  [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(cx + s * 9, ey - 14 + (o.browTilt || 0) * s); g.quadraticCurveTo(cx + s * 21, ey - 20, cx + s * 32, ey - 13); g.stroke(); });
  // eye area: darker socket + lid crease + lashes (eyeballs are real meshes)
  [-1, 1].forEach(function (s) {
    var ex = cx + s * 21;
    g.fillStyle = 'rgba(70,35,28,0.55)'; g.beginPath(); g.ellipse(ex, ey, 10.5, 6.5, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,20,15,0.8)'; g.lineWidth = o.lashes ? 2.6 : 1.6; g.beginPath(); g.ellipse(ex, ey, 10, 6, 0, PI * 1.05, PI * 1.95); g.stroke();
    g.strokeStyle = 'rgba(90,45,35,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(ex, ey - 2, 11, 8.5, 0, PI * 1.1, PI * 1.9); g.stroke();
    g.strokeStyle = 'rgba(90,45,35,0.22)'; g.beginPath(); g.ellipse(ex, ey + 3, 9, 5, 0, PI * 0.15, PI * 0.85); g.stroke();
    if (o.old) { g.strokeStyle = 'rgba(90,50,40,0.3)'; g.lineWidth = 1; for (var w = 0; w < 3; w++) { g.beginPath(); g.moveTo(ex + s * 11, ey + w * 3 - 2); g.lineTo(ex + s * 17, ey + w * 4 - 4); g.stroke(); } }
  });
  if (o.glasses) { g.strokeStyle = '#2a2a2a'; g.lineWidth = 2.4; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(cx + s * 21, ey + 1, 13, 10, 0, 0, TAU); g.stroke(); }); g.beginPath(); g.moveTo(cx - 8, ey); g.lineTo(cx + 8, ey); g.stroke(); }
  // mouth
  var my = ey + 47;
  g.fillStyle = o.lipC || 'rgba(160,70,70,0.75)';
  g.beginPath(); g.moveTo(cx - 14, my); g.quadraticCurveTo(cx - 5, my - 5, cx, my - 3); g.quadraticCurveTo(cx + 5, my - 5, cx + 14, my); g.quadraticCurveTo(cx, my + 7 + (o.smile || 0) * 3, cx - 14, my); g.fill();
  g.strokeStyle = 'rgba(70,25,20,0.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - 14, my); g.quadraticCurveTo(cx, my + 2 + (o.smile || 0) * 4, cx + 14, my); g.stroke();
  if (o.beard) { g.fillStyle = 'rgba(40,28,20,' + (o.beard * 0.45) + ')'; for (var b = 0; b < 900 * o.beard; b++) { var a = rnd() * PI, rr = 28 + rnd() * 30; var bx = cx + Math.cos(a) * rr * 1.2 * (rnd() < 0.5 ? 1 : -1) * 0.8, by = ey + 30 + Math.sin(a) * rr * 0.9; g.fillRect(bx, by, 1.4, 1.4); } }
  if (o.mustache) { g.fillStyle = o.browC || '#3a2618'; g.beginPath(); g.ellipse(cx - 8, my - 8, 10, 4, 0.2, 0, TAU); g.ellipse(cx + 8, my - 8, 10, 4, -0.2, 0, TAU); g.fill(); }
  if (o.old) { g.strokeStyle = 'rgba(90,50,40,0.28)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - 20, ey + 30); g.quadraticCurveTo(cx - 24, ey + 48, cx - 18, ey + 58); g.moveTo(cx + 20, ey + 30); g.quadraticCurveTo(cx + 24, ey + 48, cx + 18, ey + 58); g.stroke(); for (var f = 0; f < 3; f++) { g.beginPath(); g.moveTo(cx - 24, ey - 32 - f * 6); g.lineTo(cx + 24, ey - 32 - f * 6); g.stroke(); } }
  if (o.makeup) { smudge(g, cx - 21, ey - 6, 10, 'rgba(110,80,160,A)', 0.25); smudge(g, cx + 21, ey - 6, 10, 'rgba(110,80,160,A)', 0.25); }
  return c;
}
function faceRough(o) { var c = mkCanvas(256, 128), g = c.getContext('2d'); g.fillStyle = grey(165); g.fillRect(0, 0, 256, 128); if (!o.faceless) { g.fillStyle = grey(30); g.beginPath(); g.ellipse(64 - 10.5, 56, 5, 3, 0, 0, TAU); g.ellipse(64 + 10.5, 56, 5, 3, 0, 0, TAU); g.fill(); g.fillStyle = grey(110); g.beginPath(); g.ellipse(64, 82, 8, 3, 0, 0, TAU); g.fill(); } return c; }
// sculpted head: displaced sphere (brow, sockets, nose, lips, chin) aligned with the face texture
function gauss(dx, dy, sx, sy) { return Math.exp(-(dx * dx) / (2 * sx * sx) - (dy * dy) / (2 * sy * sy)); }
function sculptHead(o) {
  var g = new THREE.SphereGeometry(1, 48, 36), p = g.attributes.position, v = new THREE.Vector3();
  var jaw = o.kid ? 0.1 : (o.sex === 'f' ? 0.32 : 0.2) - (o.build || 0) * 0.12, flat = !!o.faceless;
  for (var i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    var x = v.x, y = v.y, z = v.z, front = Math.max(0, z);
    x *= 0.8; z *= 0.9; y *= 1.04;
    if (y < 0) { var k = Math.pow(-y, 1.4); x *= 1 - jaw * k; z *= 1 - 0.12 * k; }
    if (z < 0) z *= 1.06 + (y > 0 ? 0.05 : 0);
    if (front > 0.2) {
      var fx = v.x, fy = v.y, f = Math.pow(front, 2);
      if (!flat) {
        z -= 0.075 * f * (gauss(fx - 0.255, fy, 0.11, 0.075) + gauss(fx + 0.255, fy, 0.11, 0.075)); // sockets
        z += 0.05 * f * gauss(fx, fy - 0.15, 0.42, 0.07); // brow ridge
        z += (o.bigNose ? 0.26 : 0.2) * f * gauss(fx, fy + 0.17, 0.075, 0.15) + 0.07 * f * gauss(fx, fy + 0.3, 0.1, 0.06); // nose
        z += 0.05 * f * gauss(fx, fy + 0.55, 0.17, 0.05); z -= 0.02 * f * gauss(fx, fy + 0.58, 0.18, 0.012); // lips + mouth line
        z += 0.05 * f * gauss(fx, fy + 0.84, 0.16, 0.08); // chin
        x *= 1 + 0.05 * gauss(Math.abs(fx) - 0.5, fy + 0.05, 0.12, 0.12); // cheekbones
      } else { z -= 0.03 * f * gauss(fx, fy, 0.5, 0.5); }
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}
var EYE_TEX = {};
function eyeTex(col) {
  if (EYE_TEX[col]) return EYE_TEX[col];
  var c = mkCanvas(128, 64), g = c.getContext('2d'); g.fillStyle = '#efe9e2'; g.fillRect(0, 0, 128, 64);
  smudge(g, 32, 32, 30, 'rgba(200,120,110,A)', 0.25);
  var gr = g.createRadialGradient(32, 32, 2, 32, 32, 11); gr.addColorStop(0, '#000'); gr.addColorStop(0.3, '#0a0605'); gr.addColorStop(0.35, col); gr.addColorStop(0.9, col); gr.addColorStop(1, '#1a1410');
  g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 11, 0, TAU); g.fill();
  for (var i = 0; i < 20; i++) { var a = i / 20 * TAU; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(32 + Math.cos(a) * 4.5, 32 + Math.sin(a) * 4.5); g.lineTo(32 + Math.cos(a) * 10, 32 + Math.sin(a) * 10); g.stroke(); }
  EYE_TEX[col] = toTex(c); return EYE_TEX[col];
}
// clothing textures
function clothCanvas(o) {
  var c = mkCanvas(256, 256), g = c.getContext('2d'), rnd = makeRNG(o.seed || 3);
  g.fillStyle = o.color; g.fillRect(0, 0, 256, 256);
  if (o.pattern === 'plaid') { for (var i = 0; i < 256; i += 32) { g.fillStyle = o.color2 || 'rgba(0,0,0,0.45)'; g.fillRect(i, 0, 12, 256); g.fillRect(0, i, 256, 12); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i + 20, 0, 2, 256); g.fillRect(0, i + 20, 256, 2); } }
  if (o.pattern === 'stripe') for (var s = 0; s < 256; s += 16) { g.fillStyle = o.color2 || 'rgba(255,255,255,0.5)'; g.fillRect(0, s, 256, 6); }
  if (o.pattern === 'knit') for (var ky = 0; ky < 256; ky += 6) for (var kx = 0; kx < 256; kx += 8) { g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + 4, ky + 5); g.lineTo(kx + 8, ky); g.stroke(); }
  if (o.pattern === 'dots') for (var d = 0; d < 80; d++) { g.fillStyle = o.color2 || '#fff'; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 4, 0, TAU); g.fill(); }
  // weave noise + wrinkles
  for (var n = 0; n < 3000; n++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '255,255,255') + ',' + rnd() * 0.06 + ')'; g.fillRect(rnd() * 256, rnd() * 256, 2, 1); }
  for (var w = 0; w < 14; w++) smudge(g, rnd() * 256, rnd() * 256, 10 + rnd() * 25, 'rgba(0,0,0,A)', 0.12);
  if (o.buttons) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(126, 0, 4, 256); for (var b = 20; b < 256; b += 48) { g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(128, b, 4, 0, TAU); g.fill(); } }
  if (o.tag) { g.fillStyle = '#f5f0e0'; g.fillRect(o.tagX || 150, 70, 46, 18); g.fillStyle = '#1d2f6f'; g.font = '13px ' + F.ticket; g.fillText(o.tag, (o.tagX || 150) + 4, 84); }
  return c;
}
var HAIR_T = null, HAIR_N = null;
function hairTex() { if (HAIR_T) return HAIR_T; var c = mkCanvas(128, 256), g = c.getContext('2d'), r = makeRNG(31); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 256); for (var i = 0; i < 700; i++) { var x = r() * 128; g.strokeStyle = 'rgba(' + (r() < 0.5 ? '0,0,0,' + r() * 0.35 : '255,255,255,' + r() * 0.3) + ')'; g.lineWidth = 0.6 + r(); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 10, 80, x + (r() - 0.5) * 10, 170, x + (r() - 0.5) * 6, 256); g.stroke(); } HAIR_T = toTex(c); return HAIR_T; }
function hairNorm() { if (HAIR_N) return HAIR_N; var T = new TexSet(128, 128, 33); for (var x = 0; x < 128; x++) { T.hg.fillStyle = grey(110 + T.rnd() * 60); T.hg.fillRect(x, 0, 1, 128); } HAIR_N = toTex(heightToNormal(T.H, 3, true), { linear: true }); return HAIR_N; }
var PEOPLE = []; // active person objects
var PMAT = { cache: {} };
function lathe(pts, segs) { return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), segs || 18); }
// build a person. o: {skin, hair, hairC, top, topC, top2, pants, build(0..1 wide), h(height scale), sex, glasses, hat, kid, faceless, veil}
function makePerson(o) {
  var P = { o: o, root: new THREE.Group(), parts: {}, t: Math.random() * 10, blinkT: 1 + Math.random() * 3, look: new THREE.Vector2(), lookT: new THREE.Vector2(), anim: 'sit', pose: {} };
  var S = o.kid ? 0.62 : (o.h || 1), W = 0.9 + (o.build || 0.3) * 0.45, root = P.root;
  root.scale.setScalar(S);
  var skinM = stdMat({ color: rgbs(o.skin), roughness: 0.58, envMapIntensity: 0.6, emissive: rgbs(o.skin, 0.25), emissiveIntensity: 0.12 });
  var ft = toTex(faceCanvas(o), { clamp: false }), ftc = ft;
  var headM = stdMat({ map: ft, roughness: 0.58, envMapIntensity: 0.6, emissive: rgbs(o.skin, 0.25), emissiveIntensity: 0.12 });
  P.faceTex = ft; P.faceTexClosed = ftc; P.headM = headM; P.skinM = skinM;
  var topM = stdMat({ map: toTex(clothCanvas({ color: o.topC, color2: o.top2, pattern: o.pattern, buttons: o.buttons, tag: o.tag, seed: o.seed }), {}), roughness: 0.85 });
  var pantsM = stdMat({ color: o.pantsC || '#2b3448', roughness: 0.8 });
  var hairM = stdMat({ color: o.hairC || HAIRC[0], roughness: 0.5, envMapIntensity: 0.6, map: hairTex(), normalMap: hairNorm(), normalScale: new THREE.Vector2(0.6, 0.6) });
  var shoeM = stdMat({ color: o.shoeC || '#1c1712', roughness: 0.45 });
  P.mats = [skinM, headM, topM, pantsM, hairM, shoeM];
  // hips & legs (seated pose default)
  var hips = group(root, 0, 0, 0); P.parts.hips = hips;
  var pelvis = mesh(new THREE.SphereGeometry(0.17, 14, 10), pantsM, 0, 0.02, 0, hips); pelvis.scale.set(W, 0.6, 0.85);
  ['L', 'R'].forEach(function (sd, i) {
    var sx = (i ? 1 : -1) * 0.1 * W;
    var thigh = group(hips, sx, 0, 0); P.parts['thigh' + sd] = thigh;
    mesh(lathe([[0, 0], [0.052, 0.01], [0.062 * W, 0.2], [0.076 * W, 0.4], [0, 0.42]], 14), pantsM, 0, -0.42, 0, thigh);
    var shin = group(thigh, 0, -0.42, 0); P.parts['shin' + sd] = shin;
    mesh(lathe([[0, 0], [0.038, 0.02], [0.05, 0.28], [0.05, 0.42], [0, 0.44]], 14), pantsM, 0, -0.44, 0, shin);
    var foot = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoeM, 0, -0.45, 0.06, shin); P.parts['foot' + sd] = foot;
  });
  // torso
  var spine = group(hips, 0, 0.05, 0); P.parts.spine = spine;
  var torsoG = lathe(o.sex === 'f' ? [[0, 0], [0.17, 0.0], [0.18, 0.1], [0.16, 0.24], [0.185, 0.36], [0.19, 0.44], [0.16, 0.51], [0.1, 0.55], [0.055, 0.58], [0, 0.585]] : [[0, 0], [0.165, 0.0], [0.18, 0.12], [0.18, 0.28], [0.2, 0.42], [0.2, 0.48], [0.15, 0.54], [0.07, 0.575], [0.055, 0.59], [0, 0.595]], 24);
  var torso = mesh(torsoG, topM, 0, 0, 0, spine); torso.scale.set(W, 1, 0.68 + (o.build || 0.3) * 0.25); P.parts.torso = torso;
  // neck + head
  var neck = group(spine, 0, 0.55, 0); P.parts.neck = neck;
  mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 10), skinM, 0, 0.04, 0, neck);
  var head = group(neck, 0, 0.18, 0.01); P.parts.head = head;
  var hm = mesh(sculptHead(o), headM, 0, 0, 0, head); hm.scale.setScalar(0.118); P.parts.headMesh = hm;
  P.parts.nose = null; P.parts.jaw = null;
  // eyeballs + lids
  if (!o.faceless) {
    var eyeM = stdMat({ map: eyeTex(o.eyeC || '#5a3a20'), roughness: 0.08, envMapIntensity: 1.4 });
    var lidM = skinM; P.eyes = []; P.lids = [];
    [-1, 1].forEach(function (sd) {
      var ex = sd * 0.255 * 0.8 * 0.118, ey = 0.0, ez = 0.96 * 0.9 * 0.118 - 0.075 * 0.9 * 0.118 - 0.008;
      var eg = group(head, ex, ey, ez);
      var ball = mesh(new THREE.SphereGeometry(0.0125, 16, 12), eyeM, 0, 0, 0, eg, false); // iris (u=0.25 of tex) faces +z
      var lid = mesh(new THREE.SphereGeometry(0.0134, 14, 10, 0, TAU, 0, PI * 0.5), lidM, 0, 0, 0, eg, false); lid.rotation.x = -1.35; P.lids.push(lid);
      P.eyes.push(eg);
    });
  }
  [-1, 1].forEach(function (s) { var e = mesh(new THREE.SphereGeometry(0.026, 10, 8), skinM, s * 0.094, 0.005, -0.008, head); e.scale.set(0.42, 1.15, 0.75); });
  // hair styles
  buildHair(P, head, hairM, o);
  // glasses frame (3D)
  if (o.glasses && !o.faceless) { var gm = stdMat({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.5 }); var gb = mesh(new THREE.TorusGeometry(0.024, 0.003, 4, 16), gm, -0.035, 0.012, 0.106, head); var gb2 = mesh(new THREE.TorusGeometry(0.024, 0.003, 4, 16), gm, 0.035, 0.012, 0.106, head); }
  // arms
  ['L', 'R'].forEach(function (sd, i) {
    var s = i ? 1 : -1;
    var sh = group(spine, s * 0.175 * W, 0.47, 0); P.parts['sh' + sd] = sh;
    mesh(new THREE.SphereGeometry(0.058, 12, 10), topM, -0.01 * (i ? 1 : -1), -0.01, 0, sh).scale.set(1, 0.95, 0.95);
    mesh(lathe([[0, 0], [0.043, 0.02], [0.048, 0.15], [0.054, 0.27], [0, 0.29]], 12), topM, 0, -0.29, 0, sh);
    var el2 = group(sh, 0, -0.28, 0); P.parts['el' + sd] = el2;
    mesh(lathe([[0, 0], [0.033, 0.02], [0.04, 0.16], [0.043, 0.24], [0, 0.25]], 12), o.shortSleeve ? skinM : topM, 0, -0.25, 0, el2);
    if (!o.shortSleeve) mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 12), topM, 0, -0.235, 0, el2);
    var hand = group(el2, 0, -0.26, 0); P.parts['hand' + sd] = hand;
    var hmesh = mesh(new THREE.SphereGeometry(0.04, 12, 10), skinM, 0, -0.045, 0.005, hand); hmesh.scale.set(0.62, 1.25, 0.38);
    var th = mesh(new THREE.SphereGeometry(0.014, 8, 6), skinM, s * -0.022, -0.03, 0.018, hand); th.scale.set(1, 2.2, 1); th.rotation.z = s * 0.5;
  });
  if (o.watch) { var wm = stdMat({ color: 0xd9c078, metalness: 1, roughness: 0.3 }); mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.02, 12), wm, 0, -0.22, 0, P.parts.elL); }
  // held item (doll / newspaper / briefcase) attached to a hand
  if (o.holds === 'doll') { P.doll = makeDoll(); P.doll.position.set(0, -0.08, 0.06); P.parts.handL.add(P.doll); }
  // hats
  if (o.hat) buildHat(P, head, o);
  if (o.veil) { var vm = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.9, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false }); var veil = mesh(new THREE.CylinderGeometry(0.11, 0.24, 0.62, 20, 1, true), vm, 0, -0.18, 0.0, head); veil.renderOrder = 3; P.parts.veil = veil; var cap = mesh(new THREE.SphereGeometry(0.125, 16, 10, 0, TAU, 0, PI / 2), vm, 0, 0.02, 0, head); }
  // the horror face shell (hidden): a cap over the face that follows the head's shape
  P.horror = null;
  P.root.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  setPose(P, 'sit');
  return P;
}
function buildHair(P, head, hm, o) {
  var st = o.hair || 'short';
  if (st === 'bald') { var fr = mesh(new THREE.SphereGeometry(0.121, 20, 12, 0, TAU, PI * 0.42, PI * 0.25), hm, 0, 0, -0.005, head); fr.scale.set(0.93, 1.1, 1.0); return; }
  var capG = new THREE.SphereGeometry(0.123, 24, 14, 0, TAU, 0, PI * (st === 'long' || st === 'bob' ? 0.56 : 0.48));
  var cap = mesh(capG, hm, 0, 0.014, -0.012, head); cap.scale.set(0.84, 1.06, 0.98); cap.rotation.x = -0.32; P.parts.hair = cap;
  if (o.part) { cap.rotation.z = o.part * 0.08; }
  if (st === 'long' || st === 'pony' || st === 'bob') {
    var back = mesh(new THREE.CylinderGeometry(0.11, st === 'bob' ? 0.12 : 0.13, st === 'bob' ? 0.17 : 0.34, 18, 1, true, PI * 0.25, PI * 1.5), hm, 0, st === 'bob' ? -0.06 : -0.15, -0.012, head);
    var backC = mesh(new THREE.SphereGeometry(0.115, 16, 10), hm, 0, -0.02, -0.03, head); backC.scale.set(0.98, 1.05, 0.9);
  }
  if (st === 'pony') { var pt = mesh(new THREE.SphereGeometry(0.05, 10, 8), hm, 0, 0.02, -0.15, head); pt.scale.set(0.8, 2.2, 0.8); pt.rotation.x = 0.5; }
  if (st === 'bun') { mesh(new THREE.SphereGeometry(0.06, 12, 10), hm, 0, 0.09, -0.09, head); }
  if (st === 'beehive') { var bh = mesh(new THREE.SphereGeometry(0.12, 16, 12), hm, 0, 0.12, -0.02, head); bh.scale.set(0.9, 1.25, 0.95); }
  if (st === 'pomp') { var pp = mesh(new THREE.SphereGeometry(0.08, 12, 10), hm, 0, 0.1, 0.07, head); pp.scale.set(1.2, 0.7, 1.0); }
  if (st === 'curly') { for (var i = 0; i < 16; i++) { var a = i / 16 * TAU; mesh(new THREE.SphereGeometry(0.04, 8, 6), hm, Math.cos(a) * 0.1, 0.06 + Math.sin(i * 1.7) * 0.03, Math.sin(a) * 0.09 - 0.02, head); } }
}
function buildHat(P, head, o) {
  var c = o.hatC || '#6b4a2a', m = stdMat({ color: c, roughness: 0.75 });
  if (o.hat === 'cowboy') { mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.11, 18), m, 0, 0.13, -0.005, head); var br = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 24), m, 0, 0.08, 0, head); br.scale.set(1, 1, 0.85); }
  if (o.hat === 'trucker') { var cp = mesh(new THREE.SphereGeometry(0.128, 18, 10, 0, TAU, 0, PI / 2), m, 0, 0.03, -0.005, head); cp.scale.set(0.95, 0.8, 1.05); var bill = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 16, 1, false, -PI / 2, PI), m, 0, 0.035, 0.08, head); bill.rotation.x = 0.1; bill.scale.set(1, 1, 0.8);
    var lc = mkCanvas(128, 64), lg = lc.getContext('2d'); lg.fillStyle = '#f3e6c8'; lg.fillRect(0, 0, 128, 64); lg.fillStyle = '#7e1418'; lg.font = '24px ' + F.slab; lg.textAlign = 'center'; lg.fillText(o.capText || 'KW', 64, 42); var patch = mesh(new THREE.PlaneGeometry(0.07, 0.035), new THREE.MeshStandardMaterial({ map: toTex(lc, { clamp: true }) }), 0, 0.08, 0.118, head, false); patch.rotation.x = -0.35; }
  if (o.hat === 'sheriff') { mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.1, 18), m, 0, 0.13, 0, head); mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.01, 24), m, 0, 0.085, 0, head); }
  if (o.hat === 'scarf') { var sc = mesh(new THREE.SphereGeometry(0.13, 18, 12, 0, TAU, 0, PI * 0.62), m, 0, 0.0, -0.01, head); sc.scale.set(0.98, 1.12, 1.06); sc.rotation.x = -0.35; }
  if (o.hat === 'brim') { mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.08, 18), m, 0, 0.12, 0, head); mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.01, 24), m, 0, 0.085, 0.01, head); }
}
function makeDoll() { // porcelain doll the kid holds (its face can become a doll image)
  var g = new THREE.Group(), por = stdMat({ color: 0xf0e6dc, roughness: 0.25 }), dress = stdMat({ color: 0x9a2a3a, roughness: 0.8 });
  mesh(new THREE.ConeGeometry(0.05, 0.11, 12), dress, 0, -0.03, 0, g);
  var c = mkCanvas(256, 128), gg = c.getContext('2d'); gg.fillStyle = '#f0e6dc'; gg.fillRect(0, 0, 256, 128); gg.fillStyle = '#223'; gg.beginPath(); gg.arc(56, 58, 6, 0, TAU); gg.arc(72, 58, 6, 0, TAU); gg.fill(); gg.fillStyle = '#c55'; gg.beginPath(); gg.arc(64, 76, 4, 0, TAU); gg.fill(); smudge(gg, 48, 70, 8, 'rgba(230,120,120,A)', 0.5); smudge(gg, 80, 70, 8, 'rgba(230,120,120,A)', 0.5);
  var hm = new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 0.25 }); g.userData.headMat = hm;
  var h = mesh(new THREE.SphereGeometry(0.035, 16, 12), hm, 0, 0.045, 0, g); g.userData.head = h;
  mesh(new THREE.SphereGeometry(0.038, 12, 8, 0, TAU, 0, PI * 0.5), stdMat({ color: 0x7a4a22, roughness: 0.6 }), 0, 0.05, -0.004, g);
  return g;
}
// --- the horror face: image fitted to the head (feathered edges, no square border) ----
var FACE_IMG = {}; // number -> Image (preloaded)
function horrorCanvas(n) {
  var img = FACE_IMG[n], c = mkCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  if (img && img.complete && img.naturalWidth) { var ar = img.naturalWidth / img.naturalHeight, w = 256 * Math.max(1, ar), h = w / ar; g.drawImage(img, 128 - w / 2, 128 - h / 2 + 6, w, h); }
  else { drawProcFace(g, 256, n); }
  // feather to transparent (oval)
  g.globalCompositeOperation = 'destination-in';
  var gr = g.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.72, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.scale(1, 1.12); g.fillStyle = gr; g.fillRect(0, 0, 256, 256 / 1.12 + 40); g.restore();
  g.globalCompositeOperation = 'source-over';
  return c;
}
function drawProcFace(g, s, n) { // stand-in if an image could not load
  g.fillStyle = '#1a1414'; g.fillRect(0, 0, s, s);
  var gr = g.createRadialGradient(s / 2, s * 0.45, 10, s / 2, s / 2, s * 0.5); gr.addColorStop(0, '#d8cfc6'); gr.addColorStop(1, '#2a2222'); g.fillStyle = gr; g.beginPath(); g.ellipse(s / 2, s / 2, s * 0.32, s * 0.42, 0, 0, TAU); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.ellipse(s * 0.38, s * 0.42, s * 0.07, s * 0.09, 0, 0, TAU); g.ellipse(s * 0.62, s * 0.42, s * 0.07, s * 0.09, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(s / 2, s * 0.7, s * 0.12, s * 0.15, 0, 0, TAU); g.fill();
}
function attachHorror(P, n) {
  removeHorror(P);
  var tex = toTex(horrorCanvas(n), { clamp: true });
  var mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0, roughness: 0.5, depthWrite: false, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.0 });
  // partial sphere over the front of the head: phi centred on +z
  var geo = new THREE.SphereGeometry(0.128, 28, 20, PI * 0.5 - PI * 0.42, PI * 0.84, PI * 0.12, PI * 0.74);
  // rotate so the patch faces +z (three sphere phi=0 is -x); recentre uvs to 0..1
  var shell = new THREE.Mesh(geo, mat); shell.scale.set(0.92, 1.12, 1.0); shell.position.set(0, -0.005, 0.004); shell.renderOrder = 6;
  shell.rotation.y = 0;
  var uv = geo.attributes.uv, pos = geo.attributes.position;
  for (var i = 0; i < uv.count; i++) { var x = pos.getX(i), y = pos.getY(i); uv.setXY(i, 0.5 - x / 0.26, 0.5 + y / 0.24); }
  P.parts.head.add(shell); P.horror = { mesh: shell, mat: mat, n: n, k: 0 };
  shell.visible = false;
  return P.horror;
}
function removeHorror(P) { if (P.horror) { P.parts.head.remove(P.horror.mesh); P.horror.mat.map.dispose(); P.horror.mat.dispose(); P.horror = null; } }
function revealHorror(P, k) { // k 0..1
  if (!P.horror) return; var h = P.horror; h.k = k; h.mesh.visible = k > 0.001; h.mat.opacity = k; h.mat.emissiveIntensity = 0.35 * k;
  P.headM.color.setScalar(1 - k * 0.75); P.skinM.color.set(rgbs(P.o.skin)).multiplyScalar(1 - k * 0.6);
  if (P.eyes) P.eyes.forEach(function (e) { e.visible = k < 0.5; });
  if (P.parts.veil) P.parts.veil.visible = k < 0.3;
}
function disposePerson(P) { if (P.root.parent) P.root.parent.remove(P.root); P.root.traverse(function (m) { if (m.isMesh) { m.geometry.dispose(); } }); P.mats.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); removeHorror(P); }
function setLayer(obj, layer) { obj.traverse(function (m) { m.layers.set(layer); }); }
// ---- poses & animation --------------------------------------------------------------
function setPose(P, name) { P.anim = name; P.animT = 0; }
function rot(o, x, y, z, k, dt) { o.rotation.x = damp(o.rotation.x, x, k, dt); o.rotation.y = damp(o.rotation.y, y || 0, k, dt); o.rotation.z = damp(o.rotation.z, z || 0, k, dt); }
function updatePerson(P, dt, camPos) {
  P.t += dt; P.animT += dt; var t = P.t, a = P.anim, pr = P.parts, k = 8;
  var sit = a !== 'walk' && a !== 'stand' && a !== 'lunge' && a !== 'standStare';
  var odd = P.odd || 0;
  // legs
  if (sit) {
    rot(pr.thighL, -PI / 2 + 0.05, 0.08, 0, k, dt); rot(pr.thighR, -PI / 2 + 0.05, -0.08, 0, k, dt);
    rot(pr.shinL, PI / 2 - 0.1 + (P.kick ? Math.sin(t * 2) * 0.15 : 0), 0, 0, k, dt); rot(pr.shinR, PI / 2 - 0.1, 0, 0, k, dt);
    pr.hips.position.y = damp(pr.hips.position.y, 0, k, dt);
  } else if (a === 'walk') {
    var sw = Math.sin(t * 7) * 0.5; rot(pr.thighL, sw, 0, 0, 14, dt); rot(pr.thighR, -sw, 0, 0, 14, dt);
    rot(pr.shinL, Math.max(0, -sw) * 0.9, 0, 0, 14, dt); rot(pr.shinR, Math.max(0, sw) * 0.9, 0, 0, 14, dt);
    pr.hips.position.y = 0.9 + Math.abs(Math.cos(t * 7)) * 0.03;
  } else { rot(pr.thighL, 0, 0, 0, k, dt); rot(pr.thighR, 0, 0, 0, k, dt); rot(pr.shinL, 0, 0, 0, k, dt); rot(pr.shinR, 0, 0, 0, k, dt); pr.hips.position.y = damp(pr.hips.position.y, 0.9, k, dt); }
  // breathing / spine
  var br = Math.sin(t * 1.6) * 0.012;
  rot(pr.spine, (a === 'lean' ? 0.2 : 0.04) + br + (a === 'eat' ? 0.18 : 0) + (a === 'lunge' ? 0.5 : 0), 0, 0, 4, dt);
  // arms by pose
  var L = { sx: 0.1, sz: -0.12, ex: -0.3 }, Rr = { sx: 0.1, sz: 0.12, ex: -0.3 };
  if (sit) { L = { sx: -0.55, sz: -0.12, ex: -0.9 }; Rr = { sx: -0.55, sz: 0.12, ex: -0.9 }; }
  if (a === 'walk') { var s2 = Math.sin(t * 7) * 0.4; L = { sx: -s2, sz: -0.1, ex: -0.25 }; Rr = { sx: s2, sz: 0.1, ex: -0.25 }; }
  if (a === 'menu') { L = { sx: -1.25, sz: -0.25, ex: -1.0 }; Rr = { sx: -1.25, sz: 0.25, ex: -1.0 }; }
  if (a === 'hand') { Rr = { sx: -2.7 + Math.sin(t * 6) * 0.08, sz: 0.3, ex: -0.35 }; }
  if (a === 'drink') { var ph = (P.animT % 6) < 2.2; Rr = ph ? { sx: -1.3, sz: 0.35, ex: -2.2 } : { sx: -0.6, sz: 0.15, ex: -1.0 }; }
  if (a === 'eat') { var ch = Math.sin(t * 3) > 0; Rr = ch ? { sx: -1.1, sz: 0.25, ex: -1.6 } : { sx: -0.8, sz: 0.15, ex: -0.9 }; L = { sx: -0.7, sz: -0.15, ex: -0.9 }; }
  if (a === 'lunge' || a === 'standStare') { L = { sx: -1.4, sz: -0.2, ex: -0.3 }; Rr = { sx: -1.4, sz: 0.2, ex: -0.3 }; }
  if (P.holdDoll) L = { sx: -0.9, sz: -0.05, ex: -1.3 };
  if (odd > 0.5 && sit && a !== 'hand') { Rr = { sx: -0.2, sz: 0.06, ex: 0 }; L = { sx: -0.2, sz: -0.06, ex: 0 }; } // arms hanging straight down: wrong
  rot(pr.shL, L.sx, 0, L.sz, 6, dt); rot(pr.shR, Rr.sx, 0, Rr.sz, 6, dt); rot(pr.elL, L.ex, 0, 0, 6, dt); rot(pr.elR, Rr.ex, 0, 0, 6, dt);
  // head look
  if (P.lookAtCam && camPos) {
    var hp = new THREE.Vector3(); pr.head.getWorldPosition(hp);
    var inv = new THREE.Matrix4().copy(P.root.matrixWorld).invert(), lp = camPos.clone().applyMatrix4(inv), hl = hp.clone().applyMatrix4(inv);
    P.lookT.set(clamp(Math.atan2(lp.x - hl.x, lp.z - hl.z), -1.2, 1.2), clamp(Math.atan2(lp.y - hl.y, Math.hypot(lp.x - hl.x, lp.z - hl.z)), -0.6, 0.5));
  } else if (P.idleLook !== false) {
    if ((P.lookTimer = (P.lookTimer || 0) - dt) <= 0) { P.lookTimer = 2 + Math.random() * 4; P.lookT.set((Math.random() - 0.5) * 1.1, (Math.random() - 0.6) * 0.3); if (a === 'menu' || a === 'eat') P.lookT.set(0, -0.45); }
  }
  var lk = odd > 0.5 ? 2.0 : 5;
  P.look.x = damp(P.look.x, P.lookT.x, lk, dt); P.look.y = damp(P.look.y, P.lookT.y, lk, dt);
  pr.neck.rotation.y = P.look.x * 0.45; pr.head.rotation.y = P.look.x * 0.55;
  pr.head.rotation.x = -P.look.y * 0.8 + (a === 'menu' ? 0.25 : 0);
  pr.head.rotation.z = damp(pr.head.rotation.z, (P.tilt || 0) + (odd > 0.3 ? 0.42 : 0), 3, dt);
  // blink (odd ones never blink)
  if (P.lids) {
    var closed = 0;
    if (!odd) { P.blinkT -= dt; if (P.blinkT <= 0) { closed = 1; if (P.blinkT < -0.13) P.blinkT = 2 + Math.random() * 4.5; } }
    var lidX = closed ? -0.05 : (a === 'menu' || a === 'eat' ? -0.85 : -1.32) + (P.lidOpen || 0);
    P.lids.forEach(function (l) { l.rotation.x = closed ? -0.05 : damp(l.rotation.x, lidX, 20, dt); });
    // eyes look (anomalies: always at the camera)
    var ey2 = P.look.x * 0.5, ep = P.look.y * 0.4;
    if ((P.eyeStare || odd > 0.4) && camPos) { var tmp = new THREE.Vector3(); P.eyes[0].getWorldPosition(tmp); var inv2 = new THREE.Matrix4().copy(P.parts.head.matrixWorld).invert(); var lc = camPos.clone().applyMatrix4(inv2), le = tmp.clone().applyMatrix4(inv2); ey2 = clamp(Math.atan2(lc.x - le.x, lc.z - le.z), -0.6, 0.6); ep = clamp(Math.atan2(lc.y - le.y, Math.hypot(lc.x - le.x, lc.z - le.z)), -0.4, 0.4); }
    P.eyes.forEach(function (e) { e.rotation.y = damp(e.rotation.y, ey2, 14, dt); e.rotation.x = damp(e.rotation.x, -ep, 14, dt); });
  }
  if (P.horror && P.horror.k > 0) { P.horror.mesh.rotation.z = Math.sin(t * 30) * 0.02 * P.horror.k; }
}
// --- archetypes: the regulars and passers-by ----------------------------------------
var ARCH = [
  { id: 'earl', name: 'EARL', role: 'Trucker', ja: 'トラック運転手のアール', voice: 'trucker', o: { sex: 'm', build: 0.95, h: 1.06, skin: SKIN[1], hair: 'short', hairC: HAIRC[2], hat: 'trucker', hatC: '#24467a', capText: 'KW', topC: '#8c1f1f', top2: 'rgba(0,0,0,0.55)', pattern: 'plaid', beard: 0.9, pantsC: '#2a3550', watch: 1 }, likes: ['coffee', 'pie', 'burger'], regular: 1 },
  { id: 'dot', name: 'DOT', role: 'Student', ja: '女子大生のドット', voice: 'girl', o: { sex: 'f', build: 0.1, h: 0.94, skin: SKIN[0], hair: 'pony', hairC: HAIRC[4], topC: '#e98aa9', pattern: 'knit', buttons: 1, lashes: 1, blush: 1.4, smile: 1, pantsC: '#3a5a8a', eyeC: '#3a6a9a' }, likes: ['shake', 'pancakes', 'pie'] },
  { id: 'kessler', name: 'MR. KESSLER', role: 'Salesman', ja: 'セールスマンのケスラー', voice: 'salesman', o: { sex: 'm', build: 0.45, skin: SKIN[6], hair: 'short', hairC: HAIRC[1], part: 1, topC: '#4a4e5a', glasses: 1, pantsC: '#3a3e4a', tag: 'KESSLER', tagX: 160 }, likes: ['coffee', 'eggs', 'burger'] },
  { id: 'rosa', name: 'ROSA', role: 'Night Nurse', ja: '夜勤看護師のローザ', voice: 'nurse', o: { sex: 'f', build: 0.3, skin: SKIN[2], hair: 'bun', hairC: HAIRC[0], topC: '#8fd3c1', pantsC: '#8fd3c1', shortSleeve: 1, eyeC: '#2a1a10' }, likes: ['coffee', 'eggs', 'pancakes'] },
  { id: 'gus', name: 'GUS', role: 'Old Cowboy', ja: '年寄りカウボーイのガス', voice: 'cowboy', o: { sex: 'm', build: 0.5, h: 0.98, skin: SKIN[2], hair: 'short', hairC: HAIRC[6], hat: 'cowboy', hatC: '#6b4a2a', topC: '#4a6a8e', mustache: 1, browC: '#cfcfcf', old: 1, pantsC: '#2a3a5a' }, likes: ['coffee', 'eggs', 'pie'], regular: 1 },
  { id: 'tina', name: 'TINA', role: 'Teenager', ja: '高校生のティナ', voice: 'girl', o: { sex: 'f', build: 0.05, h: 0.92, skin: SKIN[0], hair: 'beehive', hairC: HAIRC[7], topC: '#f3e6c8', pattern: 'stripe', top2: '#c8282e', lashes: 1, makeup: 1, blush: 1.2, pantsC: '#2a2a2a' }, likes: ['shake', 'burger'] },
  { id: 'ricky', name: 'RICKY', role: 'Greaser', ja: '不良少年のリッキー', voice: 'teen', o: { sex: 'm', build: 0.3, h: 0.97, skin: SKIN[1], hair: 'pomp', hairC: HAIRC[0], topC: '#151515', pantsC: '#2a3a5a' }, likes: ['burger', 'shake'] },
  { id: 'walt', name: 'WALT', role: 'Mechanic', ja: '整備士のウォルト', voice: 'mechanic', o: { sex: 'm', build: 0.7, skin: SKIN[4], hair: 'short', hairC: HAIRC[0], hat: 'trucker', hatC: '#7e1418', capText: 'OIL', topC: '#5a6a7a', tag: 'WALT', tagX: 60, beard: 0.4, pantsC: '#5a6a7a' }, likes: ['burger', 'coffee', 'eggs'] },
  { id: 'pruitt', name: 'MRS. PRUITT', role: 'Widow', ja: '未亡人のプルイット夫人', voice: 'lady', o: { sex: 'f', build: 0.35, h: 0.92, skin: SKIN[0], hair: 'bun', hairC: HAIRC[6], topC: '#6a4a7a', glasses: 1, old: 1, lipC: 'rgba(170,60,90,0.8)' }, likes: ['coffee', 'pie'] },
  { id: 'doyle', name: 'SHERIFF DOYLE', role: 'Sheriff', ja: '保安官のドイル', voice: 'oldman', o: { sex: 'm', build: 0.75, skin: SKIN[1], hair: 'short', hairC: HAIRC[5], hat: 'sheriff', hatC: '#8a7a5a', topC: '#b8a27a', mustache: 1, browC: '#6a6a6a', pantsC: '#6a5a3a', tag: 'SHERIFF', tagX: 150 }, likes: ['coffee', 'pie', 'eggs'], regular: 1 },
  { id: 'henderson', name: 'MRS. HENDERSON', role: 'Mother', ja: '子連れのヘンダーソン夫人', voice: 'mom', o: { sex: 'f', build: 0.35, skin: SKIN[3], hair: 'bob', hairC: HAIRC[0], hat: 'scarf', hatC: '#c8a04a', topC: '#2f7e6e', pantsC: '#3a3a3a' }, likes: ['pancakes', 'coffee'], kid: 1 },
  { id: 'lou', name: 'LOU', role: 'Musician', ja: 'ミュージシャンのルー', voice: 'salesman', o: { sex: 'm', build: 0.2, skin: SKIN[5], hair: 'curly', hairC: HAIRC[0], topC: '#7a3a2a', pantsC: '#1a1a1a', hat: 'brim', hatC: '#222' }, likes: ['coffee', 'pie', 'pancakes'] },
  { id: 'marge', name: 'MARGE', role: 'Waitress (off duty)', ja: '非番のウェイトレス・マージ', voice: 'waitress', o: { sex: 'f', build: 0.55, skin: SKIN[1], hair: 'curly', hairC: HAIRC[7], topC: '#c8282e', pantsC: '#2b2b2b', lashes: 1, lipC: 'rgba(190,30,40,0.85)' }, likes: ['coffee', 'eggs', 'pie'] }
];
var KID = { id: 'kid', name: 'MILLIE', role: 'Kid', ja: 'ミリー（子ども）', voice: 'kid', o: { sex: 'f', kid: 1, build: 0.1, skin: SKIN[3], hair: 'pony', hairC: HAIRC[0], topC: '#f3c84a', pantsC: '#3a5a8a', holds: 'doll', blush: 1.5 } };
function personFrom(arch, seed) { var o = {}; for (var k in arch.o) o[k] = arch.o[k]; o.seed = seed || Math.floor(Math.random() * 1e6); return makePerson(o); }


// ===== 15_food.js =====
// ---- food: plates and dishes (glossy, browned, steaming) ---------------------------
var MENU = {
  pancakes: { en: 'Pancakes', ja: 'パンケーキ', price: 2.95, mini: 'pancake', icon: 'cook' },
  eggs: { en: 'Sunny Side Eggs', ja: '目玉焼き', price: 1.95, mini: 'egg', icon: 'cook' },
  burger: { en: 'Cheeseburger', ja: 'チーズバーガー', price: 3.45, mini: 'burger', icon: 'cook' },
  coffee: { en: 'Coffee', ja: 'コーヒー', price: 0.5, mini: 'coffee', icon: 'coffee' },
  pie: { en: 'Cherry Pie', ja: 'チェリーパイ', price: 1.75, mini: 'pie', icon: 'pie' },
  shake: { en: 'Milkshake', ja: 'ミルクシェイク', price: 1.95, mini: 'shake', icon: 'coffee' }
};
var ODD_ITEMS = [
  { en: 'Something warm', ja: '「なにか、あたたかいもの」', say: "Something warm. Still warm, please.", sayJa: 'なにか、あたたかいもの。まだあたたかいのを。' },
  { en: 'A glass of sand', ja: '「砂をグラスで」', say: "A glass of sand. From outside.", sayJa: '砂を、グラスで。外のやつを。' },
  { en: 'Your name, sunny side up', ja: '「あなたの名前を、目玉焼きで」', say: "Your name. Sunny side up.", sayJa: 'あなたの名前を。目玉焼きにして。' },
  { en: 'The last customer', ja: '「さっきのお客さん」', say: "I'll have... the last customer. Rare.", sayJa: 'さっきのお客さんを。レアで。' },
  { en: 'Teeth (a dozen)', ja: '「歯を、1ダース」', say: "A dozen teeth. Sunny side up.", sayJa: '歯を1ダース。目玉焼きで。' }
];
var FM = null;
function foodMats() {
  if (FM) return FM;
  var pc = mkCanvas(256, 256), g = pc.getContext('2d'), gr = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  gr.addColorStop(0, '#b8742e'); gr.addColorStop(0.7, '#9a5a20'); gr.addColorStop(0.92, '#d8a860'); gr.addColorStop(1, '#e8c48a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (var i = 0; i < 400; i++) { g.fillStyle = 'rgba(70,30,5,' + Math.random() * 0.25 + ')'; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, Math.random() * 3, 0, TAU); g.fill(); }
  var pat = mkCanvas(256, 256), pg = pat.getContext('2d'); pg.fillStyle = '#4a2a16'; pg.fillRect(0, 0, 256, 256); for (var k = 0; k < 900; k++) { pg.fillStyle = Math.random() < 0.5 ? 'rgba(20,8,2,0.5)' : 'rgba(140,80,40,0.35)'; pg.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
  var bun = mkCanvas(256, 256), bg = bun.getContext('2d'); var bgr = bg.createRadialGradient(128, 100, 10, 128, 128, 140); bgr.addColorStop(0, '#e0a050'); bgr.addColorStop(1, '#a05a1a'); bg.fillStyle = bgr; bg.fillRect(0, 0, 256, 256); for (var s = 0; s < 60; s++) { bg.fillStyle = '#f6ead0'; bg.beginPath(); bg.ellipse(Math.random() * 256, Math.random() * 200, 4, 2, Math.random() * 3, 0, TAU); bg.fill(); }
  FM = {
    plate: stdMat({ color: 0xf6f2ea, roughness: 0.12, envMapIntensity: 1.1 }), rim: stdMat({ color: 0xb02026, roughness: 0.2 }),
    cake: stdMat({ map: toTex(pc, { clamp: true }), roughness: 0.55 }), cakeSide: stdMat({ color: 0xe2b874, roughness: 0.7 }),
    butter: stdMat({ color: 0xffe9a0, roughness: 0.3 }), syrup: stdMat({ color: 0x6a2a06, roughness: 0.03, transparent: true, opacity: 0.85, envMapIntensity: 1.6 }),
    white: stdMat({ color: 0xfbf8f0, roughness: 0.25, envMapIntensity: 1.0 }), yolk: stdMat({ color: 0xff9a10, roughness: 0.08, envMapIntensity: 1.4, emissive: 0x401800, emissiveIntensity: 0.4 }),
    patty: stdMat({ map: toTex(pat), roughness: 0.6 }), bun: stdMat({ map: toTex(bun), roughness: 0.55 }), bunIn: stdMat({ color: 0xead9b0, roughness: 0.9 }),
    cheese: stdMat({ color: 0xffb21c, roughness: 0.3, emissive: 0x402000, emissiveIntensity: 0.2 }), lettuce: stdMat({ color: 0x5aa03a, roughness: 0.5, side: THREE.DoubleSide }), tomato: stdMat({ color: 0xc8202a, roughness: 0.25 }),
    shake: stdMat({ color: 0xf6b6c8, roughness: 0.6 }), cream: stdMat({ color: 0xfffaf2, roughness: 0.7 }), cherry: stdMat({ color: 0xb00016, roughness: 0.05, envMapIntensity: 1.5 }),
    straw: stdMat({ color: 0xd8282e, roughness: 0.3 }), glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.22, envMapIntensity: 1.5, depthWrite: false }),
    raw: stdMat({ color: 0x8a1018, roughness: 0.15, envMapIntensity: 1.2 }), sand: stdMat({ color: 0xc8a878, roughness: 1 })
  };
  return FM;
}
function plateMesh() {
  var f = foodMats(), g = new THREE.Group();
  mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.07, 0), new THREE.Vector2(0.09, 0.006), new THREE.Vector2(0.125, 0.016), new THREE.Vector2(0.128, 0.02), new THREE.Vector2(0.118, 0.018), new THREE.Vector2(0.08, 0.008), new THREE.Vector2(0, 0.008)], 32), f.plate, 0, 0, 0, g);
  var rim = mesh(new THREE.TorusGeometry(0.118, 0.0025, 4, 40), f.rim, 0, 0.018, 0, g); rim.rotation.x = PI / 2;
  return g;
}
function eggWhiteGeo(seed) {
  var rnd = makeRNG(seed || 3), s = new THREE.Shape(), n = 18;
  for (var i = 0; i <= n; i++) { var a = i / n * TAU, r = 0.07 * (0.85 + rnd() * 0.3); var x = Math.cos(a) * r * 1.1, y = Math.sin(a) * r; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); }
  var g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4 }); g.rotateX(-PI / 2); return g;
}
function dishMesh(id, opt) {
  var f = foodMats(), g = new THREE.Group(); opt = opt || {};
  if (id !== 'coffee' && id !== 'shake') { var pl = plateMesh(); g.add(pl); }
  if (id === 'pancakes') {
    for (var i = 0; i < 3; i++) { var c = mesh(new THREE.CylinderGeometry(0.075 - i * 0.002, 0.077, 0.016, 28), [f.cakeSide, f.cake, f.cake], 0, 0.026 + i * 0.017, 0, g); c.rotation.y = i; }
    mesh(new THREE.BoxGeometry(0.03, 0.012, 0.025), f.butter, 0, 0.083, 0, g).rotation.y = 0.4;
    var sy = mesh(new THREE.CylinderGeometry(0.06, 0.068, 0.004, 24), f.syrup, 0.005, 0.078, 0, g);
    for (var d = 0; d < 5; d++) { var a = d * 1.3; var dr = mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.03, 6), f.syrup, Math.cos(a) * 0.072, 0.06, Math.sin(a) * 0.072, g); }
  } else if (id === 'eggs') {
    [-0.045, 0.045].forEach(function (x, i) { mesh(eggWhiteGeo(i + 4), f.white, x, 0.02, 0, g); var y = mesh(new THREE.SphereGeometry(0.024, 16, 10, 0, TAU, 0, PI / 2), f.yolk, x + 0.005, 0.026, 0.004, g); y.scale.y = 0.75; });
    var toast = mesh(new THREE.BoxGeometry(0.08, 0.012, 0.08), f.cakeSide, 0, 0.026, 0.07, g); toast.rotation.y = 0.5;
  } else if (id === 'burger') {
    var b = new THREE.Group(); g.add(b); b.position.y = 0.02;
    mesh(new THREE.CylinderGeometry(0.058, 0.055, 0.022, 24), [f.bun, f.bunIn, f.bun], 0, 0.011, 0, b);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 24), f.patty, 0, 0.032, 0, b);
    var ch = mesh(new THREE.BoxGeometry(0.11, 0.004, 0.11, 6, 1, 6), f.cheese, 0, 0.044, 0, b); droop(ch.geometry, 0.04, 0.012); ch.rotation.y = 0.6;
    var le = mesh(new THREE.CircleGeometry(0.068, 18), f.lettuce, 0, 0.049, 0, b); le.rotation.x = -PI / 2; wavy(le.geometry);
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 18), f.tomato, 0.01, 0.055, 0, b);
    var top = mesh(new THREE.SphereGeometry(0.06, 24, 12, 0, TAU, 0, PI / 2), f.bun, 0, 0.06, 0, b); top.scale.y = 0.62;
    var fries = new THREE.Group(); g.add(fries); for (var k = 0; k < 9; k++) { var fr = mesh(new THREE.BoxGeometry(0.008, 0.008, 0.06), f.cheese, 0.07 + Math.random() * 0.03, 0.026 + k * 0.004, -0.03 + Math.random() * 0.06, fries); fr.rotation.y = Math.random() * 3; fr.material = f.cakeSide; }
  } else if (id === 'coffee') {
    var cup = makeCup(true); g.add(cup); g.userData.coffee = cup.userData.coffee;
  } else if (id === 'pie') {
    var sl = new THREE.Group(); g.add(sl); sl.position.y = 0.02;
    makePie(0); var sm = mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.045, 12, 1, false, 0, TAU / 8), [PIE_MAT.crust, PIE_MAT.top, PIE_MAT.crust], -0.05, 0.022, -0.05, sl);
    [0, TAU / 8].forEach(function (a) { var p = mesh(new THREE.PlaneGeometry(0.15, 0.045), PIE_MAT.fill, -0.05 + Math.sin(a) * 0.075, 0.022, -0.05 + Math.cos(a) * 0.075, sl, false); p.rotation.y = a + PI / 2; p.material.side = THREE.DoubleSide; });
  } else if (id === 'shake') {
    var gl = mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.03, 0), new THREE.Vector2(0.03, 0.01), new THREE.Vector2(0.008, 0.02), new THREE.Vector2(0.008, 0.06), new THREE.Vector2(0.03, 0.08), new THREE.Vector2(0.045, 0.19), new THREE.Vector2(0.044, 0.19), new THREE.Vector2(0.029, 0.08), new THREE.Vector2(0.006, 0.062)], 24), f.glass, 0, 0, 0, g, false); gl.renderOrder = 4;
    mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.065), new THREE.Vector2(0.026, 0.08), new THREE.Vector2(0.04, 0.17), new THREE.Vector2(0, 0.17)], 20), f.shake, 0, 0, 0, g);
    for (var w = 0; w < 4; w++) mesh(new THREE.SphereGeometry(0.03 - w * 0.006, 12, 8), f.cream, 0, 0.18 + w * 0.016, 0, g);
    mesh(new THREE.SphereGeometry(0.011, 12, 8), f.cherry, 0, 0.245, 0, g);
    var st = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 8), f.straw, 0.015, 0.25, 0, g); st.rotation.z = -0.2;
  } else if (id === 'odd') {
    var r = mesh(new THREE.SphereGeometry(0.05, 14, 10), f.raw, 0, 0.05, 0, g); r.scale.set(1.3, 0.6, 1); wavy(r.geometry, 0.01);
  }
  if (opt.steam && (id === 'coffee' || id === 'pancakes' || id === 'eggs')) g.userData.steam = 1;
  return g;
}
function droop(geo, edge, amt) { var p = geo.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), z = p.getZ(i), r = Math.max(Math.abs(x), Math.abs(z)); if (r > edge) p.setY(i, p.getY(i) - (r - edge) * (r - edge) / 0.0004 * amt); } geo.computeVertexNormals(); }
function wavy(geo, a) { var p = geo.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y); p.setZ(i, p.getZ(i) + Math.sin(Math.atan2(y, x) * 9) * (a || 0.006) * (r / 0.068)); } geo.computeVertexNormals(); }


// ===== 16_service.js =====
// ---- service: customers' lifecycle, ordering, tickets, serving, paying ------------
var CUSTS = [], TICKETS = [], TICKET_NO = 4100;
var PATIENCE = { wait: 45, seated: 40, ready: 45, ordered: 120, check: 40 };
var LINES = {
  greet: [
    ['Evening! Table for one?', 'こんばんは！ ひとりなんだけど。'], ['Hi there. Still open?', 'どうも。まだやってる？'], ['Phew, what a drive. You open?', 'ふう、長い運転だった。開いてる？'],
    ['Smells like coffee in here. Good.', 'コーヒーのいい匂い。いいね。']
  ],
  order: [['I\'ll have {items}.', '{items}をください。'], ['Lemme get {items}.', '{items}をもらえる？'], ['How about {items}?', '{items}にしようかな。'], ['{items}, please.', '{items}、お願い。']],
  served: [['Looks great. Thanks!', 'おいしそう。ありがとう！'], ['Mm. That hits the spot.', 'うん、これこれ。'], ['Now that\'s a plate.', 'いいね、これだよ。']],
  check: [['Could I get the check?', 'お会計いいかな？'], ['That was great. Check, please.', 'おいしかった。お会計を。']],
  pay: [['Keep the change, kid.', 'おつりはとっといて。'], ['Thanks. See you around.', 'ありがとう。またね。'], ['Best diner on the highway.', 'このハイウェイで一番の店だよ。']],
  angry: [['Forget it. I\'m outta here.', 'もういい。帰る。'], ['Slowest diner in the desert.', '砂漠で一番遅い店だな。']],
  chat: [
    ['This place never closes. Not once, not in thirty years.', 'この店は閉まったことがない。30年間、一度もな。'],
    ['They say the sign stays on so folks can find their way.', '道に迷った人のために、看板は消さないんだってさ。'],
    ['You\'re the new night kid? The last one lasted four nights.', '新しい夜勤の子？ 前の子は4日もったよ。'],
    ['Don\'t mind the jukebox. It does what it wants.', 'ジュークボックスは気にするな。あれは好きにやる。'],
    ['My mama ate here in \'58. Same pie, same smile on that egg.', 'おふくろも58年にここで食べた。同じパイ、同じ笑う卵。'],
    ['I never sit in booth four. Nobody does after midnight.', '4番席には座らない。夜中は誰もな。']
  ]
};
var ARCH_LINES = {
  earl: { greet: [['Evenin\'. Coffee, black. Then we\'ll see.', 'よう。コーヒー、ブラックで。あとは考える。'], ['Long haul tonight. Got pie?', '今夜は長距離だ。パイあるかい？']] },
  dot: { greet: [['Hi! Oh my gosh, this place is SO cute!', 'こんにちは！ やだ、このお店かわいすぎ！'], ['Hiya! Is the egg guy on the sign real? Kidding!', 'やっほー！ 看板の卵くん、本物？ うそうそ！']] },
  kessler: { greet: [['Evening. Kessler, Pioneer Vacuums. Quick bite.', 'どうも。パイオニア掃除機のケスラーです。軽く食事を。']] },
  rosa: { greet: [['Double shift. I need coffee like air.', 'ダブルシフトなの。空気みたいにコーヒーがほしい。']] },
  gus: { greet: [['Howdy, partner. Same as always.', 'よう、相棒。いつものやつだ。']] },
  tina: { greet: [['Two milkshakes! Kidding. One. For now.', 'シェイク2つ！ うそ。1つ。とりあえずね。']] },
  ricky: { greet: [['Hey daddy-o. What\'s cookin\'?', 'よう。何が焼けてる？']] },
  walt: { greet: [['Grease on my hands, hunger in my belly.', '手は油まみれ、腹はペコペコだ。']] },
  pruitt: { greet: [['Good evening, dear. A quiet table, please.', 'こんばんは。静かな席をお願いね。']] },
  doyle: { greet: [['Evening. Quiet night so far. Let\'s keep it that way.', 'やあ。今夜は静かだ。このままがいい。']] },
  henderson: { greet: [['A table for two, please. Millie, say hello.', 'ふたりです。ミリー、ごあいさつは？']] },
  lou: { greet: [['Gig ran late. Got anything sweet?', 'ライブが押してね。甘いものある？']] },
  marge: { greet: [['My night off and here I am. Ha!', '非番なのに、結局ここ。ははっ！']] }
};
function pickL(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function itemsText(items, lang) {
  var names = items.map(function (it) { var m = it.odd ? it.odd : MENU[it.id]; return lang === 'ja' ? (it.odd ? it.odd.ja : m.ja) : (it.odd ? it.odd.en.toLowerCase() : (/^[aeiou]/i.test(m.en) ? 'an ' : 'a ') + m.en.toLowerCase()); });
  if (lang === 'ja') return names.join('と');
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}
// ---- spawn / walking ------------------------------------------------------------------
function freeSeats(kind) { return SEATS.filter(function (s) { return (!kind || s.kind === kind) && !s.taken && !(s.kind === 'booth' && s.side > 0) && !(s.booth === 4 && GAME.min > 150) && !s.blocked; }); }
function spawnCustomer(arch, opt) {
  opt = opt || {};
  var P = personFrom(arch, opt.seed);
  var C = { id: Math.random().toString(36).slice(2, 7), arch: arch, P: P, state: 'arrive', path: [], pat: 1, patMax: 1, items: [], ticket: null, mood: 1, voice: arch.voice, name: arch.name, opt: opt, anomaly: opt.anomaly || null, t: 0, dishes: [] };
  RENDER.scene.add(P.root);
  P.root.position.set(6.0, 0, 7.5); P.root.rotation.y = PI; setPose(P, 'walk');
  if (opt.mirror) P.root.scale.x *= -1;
  if (opt.kid) { var K = personFrom(KID); C.kid = K; RENDER.scene.add(K.root); K.root.position.set(6.4, 0, 8.0); setPose(K, 'walk'); K.holdDoll = true; }
  C.path = [new THREE.Vector3(6.0, 0, 4.5), WORLD.waitSpot.clone()];
  addPick(P.root, function () { tapCustomer(C); }, { stations: ['COUNTER', 'REGISTER', 'DOOR', 'BOOTHS'] });
  CUSTS.push(C);
  if (!opt.silentEntry) { setTimeout(function () { openDoorAnim(); sfx('doorbell', new THREE.Vector3(6, 2.3, 4.9)); }, 900); }
  return C;
}
var DOORANIM = { t: 0 };
function openDoorAnim() { DOORANIM.t = 1.4; }
function updateDoor(dt) { if (DOORANIM.t > 0) DOORANIM.t -= dt; var k = DOORANIM.t > 0 ? Math.sin(clamp(DOORANIM.t / 1.4, 0, 1) * PI) : 0; WORLD.door.rotation.y = damp(WORLD.door.rotation.y, -k * 1.2, 8, dt); }
function walkTo(C, pts, then) { C.path = pts.slice(); C.onPath = then; setPose(C.P, 'walk'); }
function routeToSeat(seat) {
  var V = function (x, z) { return new THREE.Vector3(x, 0, z); };
  if (seat.kind === 'stool') return [V(4.6, 2.7), V(seat.pos.x, 0.25), V(seat.pos.x, -0.2)];
  var bx = seat.pos.x + 0.62 * (seat.side > 0 ? -1 : 1);
  return [V(4.6, 2.7), V(seat.pos.x + (seat.side < 0 ? 0.35 : -0.35), 2.9), V(seat.pos.x + (seat.side < 0 ? 0.35 : -0.35), 3.3)];
}
function routeOut(C) { var p = C.P.root.position, V = function (x, z) { return new THREE.Vector3(x, 0, z); }; var pts = []; if (C.seat && C.seat.kind === 'stool') pts.push(V(p.x, 0.3)); else if (C.seat) pts.push(V(p.x + 0.4, 3.1)); pts.push(V(4.6, 2.7), V(6.0, 4.4), V(6.0, 7.6)); return pts; }
function moveCustomer(C, dt) {
  var P = C.P, R = P.root;
  if (C.path && C.path.length) {
    var tgt = C.path[0], d = new THREE.Vector3(tgt.x - R.position.x, 0, tgt.z - R.position.z), L = d.length(), sp = (C.speed || 1.15) * dt;
    R.position.y = 0;
    if (L < 0.06) { C.path.shift(); if (R.position.z > 4.6 && tgt.z < 4.6 && !C.inDoor) { C.inDoor = 1; openDoorAnim(); } if (!C.path.length) { var f = C.onPath; C.onPath = null; setPose(P, 'stand'); if (f) f(); } }
    else { d.multiplyScalar(Math.min(1, sp / L)); R.position.add(d); var yaw = Math.atan2(d.x, d.z); R.rotation.y = R.rotation.y + angDiff(R.rotation.y, yaw) * Math.min(1, dt * 8); }
    if (C.kid) { var kr = C.kid.root, kd = new THREE.Vector3(R.position.x + 0.45 - kr.position.x, 0, R.position.z + 0.35 - kr.position.z); var kl = kd.length(); if (kl > 0.05) { kd.multiplyScalar(Math.min(1, 1.4 * dt / kl)); kr.position.add(kd); kr.rotation.y = Math.atan2(kd.x, kd.z); setPose(C.kid, 'walk'); } else setPose(C.kid, 'stand'); }
  }
}
function sitDown(C, seat) {
  var R = C.P.root; seat.taken = C; C.seat = seat;
  R.position.copy(seat.pos); R.rotation.y = seat.face; setPose(C.P, 'sit');
  if (seat.seatMesh) sfx('stool', seat.pos);
  removePick(R); addPick(R, function () { tapCustomer(C); }, { stations: seat.kind === 'stool' ? ['COUNTER'] : ['BOOTHS', 'COUNTER'] });
  if (C.kid) { var opp = SEATS.filter(function (s) { return s.booth === seat.booth && s.side > 0; })[0]; if (opp) { C.kid.root.position.copy(opp.pos); C.kid.root.position.y += 0.08; C.kid.root.rotation.y = opp.face; setPose(C.kid, 'sit'); opp.taken = C; C.kidSeat = opp; } }
  RENDER.shadowDirty = true;
}
function standUp(C) { if (C.seat) { C.seat.taken = null; C.seat = null; } if (C.kidSeat) { C.kidSeat.taken = null; C.kidSeat = null; } C.P.root.position.y = 0; }
function customerLeave(C, angry) {
  if (C.state === 'leaving' || C.state === 'gone') return;
  clearDishes(C); hideMenuProp(C);
  if (C.ticket && !C.ticket.done) { C.ticket.cancel = true; removeTicket(C.ticket); }
  standUp(C); C.state = 'leaving'; C.marker && (C.marker.style.display = 'none');
  walkTo(C, routeOut(C), function () { C.state = 'gone'; removeCustomer(C); });
  if (angry) { GAME.angry++; }
}
function removeCustomer(C) { removePick(C.P.root); disposePerson(C.P); if (C.kid) disposePerson(C.kid); if (C.refl) { disposePerson(C.refl); C.refl = null; } if (C.marker && C.marker.parentNode) C.marker.parentNode.removeChild(C.marker); var i = CUSTS.indexOf(C); if (i >= 0) CUSTS.splice(i, 1); }
// ---- menu prop in hands ------------------------------------------------------------------
var MENU_TEX = null;
function menuTex() {
  if (MENU_TEX) return MENU_TEX;
  var c = mkCanvas(256, 360), g = c.getContext('2d'); g.fillStyle = '#c8282e'; g.fillRect(0, 0, 256, 360); g.fillStyle = '#f3e6c8'; g.fillRect(10, 10, 236, 340);
  drawSunny(g, 128, 150, 70, { wave: 0.6 }); g.fillStyle = '#c8282e'; g.font = '40px ' + F.logo; g.textAlign = 'center'; g.fillText('Sunny Side', 128, 290); g.font = '18px ' + F.slab; g.fillText('MENU', 128, 322);
  MENU_TEX = toTex(c, { clamp: true }); return MENU_TEX;
}
function showMenuProp(C) { if (C.menuProp) return; var m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.31), new THREE.MeshStandardMaterial({ map: menuTex(), roughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 1.2 })); m.position.set(0, -0.06, 0.12); m.rotation.x = -0.3; C.P.parts.handR.add(m); C.menuProp = m; m.castShadow = true; }
function hideMenuProp(C) { if (C.menuProp) { C.menuProp.parent.remove(C.menuProp); C.menuProp.geometry.dispose(); C.menuProp.material.dispose(); C.menuProp = null; } }
// ---- dishes on the table ------------------------------------------------------------------
function placeDishes(C) {
  var base = C.seat.eatPos.clone(), n = C.items.length;
  C.items.forEach(function (it, i) {
    if (it.torn) return;
    var d = dishMesh(it.odd ? 'odd' : it.id, { steam: true });
    var off = C.seat.kind === 'stool' ? new THREE.Vector3((i - (n - 1) / 2) * 0.24, 0, 0) : new THREE.Vector3(0, 0, (i - (n - 1) / 2) * 0.26 - 0.1);
    d.position.copy(base).add(off); d.rotation.y = Math.random() * 0.6; RENDER.scene.add(d); C.dishes.push(d);
    if (d.userData.steam) d.userData.em = steamEmit(d.position.x, d.position.y + 0.08, d.position.z, 2.5, 0.05);
  });
}
function clearDishes(C) { C.dishes.forEach(function (d) { if (d.userData.em) steamStop(d.userData.em); RENDER.scene.remove(d); }); C.dishes = []; }
// ---- tapping a customer ---------------------------------------------------------------------
function custSay(C, en, ja, opt) { opt = opt || {}; opt.voice = C.voice; if (C.anomaly && C.oddVoice) opt.odd = true; return say(C.name, en, ja, opt); }
function tapCustomer(C) {
  if (GAME.mode !== 'play' || TALK.busy || MINI.active) return;
  if (C.anomaly && C.anomaly.onTap && C.anomaly.onTap(C) === true) return;
  var o = [], st = C.state;
  var closed = { icon: 'stop', en: "We're closed.", ja: '閉店です（目をそらす）', fn: function () { refuseCustomer(C); } };
  var ignore = { icon: 'silent', en: 'Say nothing.', ja: '何も言わない・何も出さない', fn: function () { ignoreCustomer(C); } };
  if (st === 'wait') {
    var stools = freeSeats('stool'), booths = freeSeats('booth');
    if (!C.kid && stools.length) o.push({ icon: 'seat', en: 'Counter seat', ja: 'カウンター席へ案内', fn: function () { seatCustomer(C, stools[Math.floor(Math.random() * stools.length)]); } });
    if (booths.length) o.push({ icon: 'seat', en: 'Booth ' + booths[0].booth, ja: booths[0].booth + '番のボックス席へ案内', fn: function () { seatCustomer(C, booths[0]); } });
    if (!stools.length && !booths.length) o.push({ icon: 'seat', en: 'No free seats...', ja: '空席がない', dim: true });
    o.push(closed, ignore);
  } else if (st === 'seated') {
    o.push({ icon: 'menu', en: 'Hand a menu', ja: 'メニューを渡す', fn: function () { giveMenu(C); } }, closed, ignore);
  } else if (st === 'ready') {
    o.push({ icon: 'pencil', en: 'Take the order', ja: '注文を取る', fn: function () { takeOrder(C); } }, closed, ignore);
  } else if (st === 'reading') {
    o.push({ icon: 'menu', en: '"Take your time."', ja: '「ごゆっくり」', fn: function () { custSay(C, 'Just a minute, hon.', 'ちょっと待ってね。'); } }, closed);
  } else if (st === 'ordered') {
    var ready = C.ticket && C.ticket.ready;
    o.push({ icon: 'serve', en: ready ? 'Serve the order' : 'Food is cooking...', ja: ready ? '料理を出す' : 'まだ調理中', dim: !ready, fn: function () { serveCustomer(C); } });
    if (C.ticket && !C.ticket.ready) o.push({ icon: 'cook', en: 'Go cook it', ja: '厨房で作る', fn: function () { camSetStation('KITCHEN'); } });
    o.push(ignore);
  } else if (st === 'eating') {
    o.push({ icon: 'reply', en: 'Chat', ja: '世間話をする', fn: function () { var L = pickL(LINES.chat); custSay(C, L[0], L[1]); } });
    o.push({ icon: 'coffee', en: 'Top off coffee', ja: 'コーヒーを注ぎ足す', fn: function () { sfx('pour', C.seat.eatPos, { len: 0.8 }); C.tipBonus = (C.tipBonus || 0) + 0.25; custSay(C, 'Oh, bless you.', 'あら、ありがとう。'); } });
  } else if (st === 'check') {
    o.push({ icon: 'check', en: 'Bring the check', ja: 'お会計をする', fn: function () { payCustomer(C); } });
  } else return;
  var tableLbl = C.seat ? (C.seat.kind === 'stool' ? 'CTR ' + C.seat.id.slice(1) : 'BOOTH ' + C.seat.booth) : 'WAITING';
  showChoices(C.name.toLowerCase().replace(/(^|[ .])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }), o, { table: tableLbl, no: C.ticket ? C.ticket.no : null });
  if (C.P) C.P.lookAtCam = true;
}
function seatCustomer(C, seat) {
  if (C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'seat') === true) return;
  C.state = 'toSeat'; sfx('click');
  walkTo(C, routeToSeat(seat), function () { sitDown(C, seat); C.state = 'seated'; C.pat = C.patMax = PATIENCE.seated; C.P.lookAtCam = false; });
  var g = C.arch.id && ARCH_LINES[C.arch.id] ? pickL(ARCH_LINES[C.arch.id].greet) : pickL(LINES.greet);
  if (!C.anomaly || !C.anomaly.mute) custSay(C, g[0], g[1]);
}
function giveMenu(C) {
  if (C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'menu') === true) return;
  showMenuProp(C); setPose(C.P, 'menu'); C.state = 'reading'; sfx('paper', C.P.root.position); C.readT = 7 + Math.random() * 6; C.P.lookAtCam = false;
}
function makeOrder(C) {
  var n = 1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0), likes = C.arch.likes || ['coffee', 'pie'], items = [], used = {};
  for (var i = 0; i < n; i++) { var id = Math.random() < 0.75 ? pickL(likes) : pickL(Object.keys(MENU)); if (used[id]) continue; used[id] = 1; items.push({ id: id, done: false, q: 0 }); }
  if (GAME.day === 1 && GAME.min < 40 && items.length > 2) items.length = 2;
  return items;
}
function takeOrder(C) {
  if (C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'order') === true) return;
  hideMenuProp(C); setPose(C.P, 'sit'); C.P.lookAtCam = true;
  C.items = C.forcedItems || makeOrder(C);
  var odd = C.items.filter(function (it) { return it.odd; })[0];
  var L = pickL(LINES.order), en = L[0].replace('{items}', itemsText(C.items, 'en')), ja = L[1].replace('{items}', itemsText(C.items, 'ja'));
  if (odd) { en = 'I\'ll have... ' + odd.odd.say; ja = odd.odd.sayJa; }
  custSay(C, en, ja, { odd: !!odd }).then(function () {
    if (odd) {
      showChoices('"' + odd.odd.en + '"', [
        { icon: 'pencil', en: 'Write it down', ja: '伝票に書く', fn: function () { writeTicket(C); } },
        { icon: 'stop', en: 'Sorry, that\'s not on the menu.', ja: '「メニューにありません」', fn: function () { refuseOdd(C); } }
      ], { noCancel: true, table: C.seat ? C.seat.id : '' });
    } else writeTicket(C);
  });
}
function writeTicket(C) {
  var T = { no: ++TICKET_NO, cust: C, items: C.items, ready: false, done: false, table: C.seat ? (C.seat.kind === 'stool' ? 'CTR ' + C.seat.id.slice(1) : 'BOOTH ' + C.seat.booth) : '?', t: 0 };
  C.ticket = T; TICKETS.push(T); C.state = 'ordered'; C.pat = C.patMax = PATIENCE.ordered + C.items.length * 25; C.P.lookAtCam = false;
  sfx('pen'); sfx('paper', null, { delay: 0.3 });
  toast('Ticket No.' + T.no + ' → kitchen', '注文票が厨房に入った', 2);
  refreshTickets();
}
function removeTicket(T) { var i = TICKETS.indexOf(T); if (i >= 0) TICKETS.splice(i, 1); if (T.plates) { T.plates.forEach(function (p) { RENDER.scene.remove(p); }); T.plates = null; } refreshTickets(); }
function refuseOdd(C) {
  C.items = C.items.filter(function (it) { return !it.odd; });
  if (C.anomaly && C.anomaly.onRefuse) C.anomaly.onRefuse(C, 'odd');
}
function refuseCustomer(C) {
  // eyes down: camera looks at the floor while saying it
  var keep = CAM.tPitch; CAM.tPitch = -0.55; CAM.locked = true;
  say('YOU', "Sorry. We're closed.", 'すみません。閉店です。', { voice: 'you', cls: 'you', hold: 0.5 }).then(function () {
    CAM.locked = false; CAM.tPitch = keep;
    if (C.anomaly && C.anomaly.onRefuse && C.anomaly.onRefuse(C, 'closed') === true) return;
    if (!C.anomaly) { GAME.refusedNormal++; custSay(C, 'Closed? The sign says open...', '閉店？ 看板は営業中って……'); }
    customerLeave(C, false);
  });
}
function ignoreCustomer(C) {
  if (C.anomaly && C.anomaly.onIgnore && C.anomaly.onIgnore(C) === true) return;
  C.ignored = (C.ignored || 0) + 1; toast('...', '（何も言わずに目をそらした）', 1.6);
}
function serveCustomer(C) {
  if (!C.ticket || !C.ticket.ready) return;
  if (C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'serve') === true) return;
  if (C.items.some(function (it) { return it.odd; }) && GAME.oddFail) { GAME.oddFail(C); return; }
  removeTicket(C.ticket); C.ticket.done = true;
  placeDishes(C); sfx('cup', C.seat.eatPos); sfx('cutlery', C.seat.eatPos, { delay: 0.2 });
  C.state = 'eating'; C.eatT = 16 + Math.random() * 10; setPose(C.P, 'eat');
  var L = pickL(LINES.served); custSay(C, L[0], L[1]);
  GAME.served++;
}
function payCustomer(C) {
  var total = 0, q = 0, nq = 0;
  C.items.forEach(function (it) { if (it.odd) return; total += MENU[it.id].price; q += it.q || 0.6; nq++; });
  q = nq ? q / nq : 0.5;
  var pat = C.patSum != null ? C.patSum : 0.7;
  var tip = total * (0.08 + 0.17 * q + 0.1 * pat) + (C.tipBonus || 0) + (C.arch.regular ? 0.5 : 0) + Math.random() * 0.3;
  tip = Math.round(tip * 20) / 20;
  GAME.tips += tip; GAME.sales += total; setTips(GAME.tips, true);
  sfx('print', new THREE.Vector3(6.4, 1.1, 1.7), { n: 14 }); setTimeout(function () { sfx('register', new THREE.Vector3(6.2, 1.1, 1.7)); sfx('coin', null, { delay: 0.4 }); }, 800);
  receiptPop(C, total, tip);
  var L = pickL(LINES.pay); custSay(C, L[0], L[1]);
  C.state = 'paid'; setTimeout(function () { customerLeave(C, false); }, 1800);
}
function receiptPop(C, total, tip) {
  var r = el('div', 'rpop', '<div class="rh">SUNNY SIDE DINER</div>' + C.items.filter(function (i) { return !i.odd; }).map(function (it) { return '<div class="rr"><span>' + MENU[it.id].en.toUpperCase() + '</span><span>' + MENU[it.id].price.toFixed(2) + '</span></div>'; }).join('') + '<div class="rr t"><span>TOTAL</span><span>' + total.toFixed(2) + '</span></div><div class="rr tip"><span>TIP</span><span>+' + tip.toFixed(2) + '</span></div>', UI);
  r.style.backgroundImage = 'url(' + PAPER.receipt + ')';
  setTimeout(function () { r.classList.add('go'); }, 2400); setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 3200);
}
// ---- per-frame customer logic -----------------------------------------------------------------
function updateCustomers(dt) {
  var cp = RENDER.camera.position;
  for (var i = CUSTS.length - 1; i >= 0; i--) {
    var C = CUSTS[i]; C.t += dt;
    moveCustomer(C, dt);
    updatePerson(C.P, dt, cp); if (C.kid) updatePerson(C.kid, dt, cp);
    if (C.anomaly && C.anomaly.update) C.anomaly.update(C, dt);
    if (C.state === 'reading') { C.readT -= dt; if (C.readT <= 0) { C.state = 'ready'; hideMenuProp(C); setPose(C.P, 'hand'); C.pat = C.patMax = PATIENCE.ready; sfx('pop', C.P.root.position, { vol: 0.3 }); } }
    if (C.state === 'eating') { C.eatT -= dt; if (C.eatT <= 0) { C.state = 'check'; setPose(C.P, 'hand'); C.pat = C.patMax = PATIENCE.check; clearDishesLater(C); } }
    var waiting = C.state === 'wait' || C.state === 'seated' || C.state === 'ready' || C.state === 'ordered' || C.state === 'check';
    if (waiting && !C.anomaly && GAME.mode === 'play') {
      C.pat -= dt * (GAME.day > 3 ? 1.1 : 1);
      C.patSum = C.patSum == null ? 1 : lerp(C.patSum, C.pat / C.patMax, dt * 0.05);
      if (C.pat <= 0) { var L = pickL(LINES.angry); custSay(C, L[0], L[1]); customerLeave(C, true); }
    }
    if (C.state === 'arrive' && !C.path.length) { C.state = 'wait'; C.pat = C.patMax = PATIENCE.wait; setPose(C.P, 'stand'); C.P.root.rotation.y = -PI * 0.8; }
    updateMarker(C);
  }
}
function clearDishesLater(C) { C.dishes.forEach(function (d) { if (d.userData.em) { steamStop(d.userData.em); d.userData.em = null; } }); }
// ---- attention markers (DOM badges over heads) ------------------------------------------------
var MARK_CSS = [
  '.cmark{position:absolute;width:34px;height:34px;margin:-40px 0 0 -17px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;color:#fff8e6;',
  ' background:radial-gradient(circle at 35% 30%,#e8444a,#9e1218);box-shadow:0 0 0 2px #e9edf0,0 4px 10px rgba(0,0,0,.5);transition:opacity .2s;}',
  '.cmark::before{content:"";position:absolute;inset:-6px;border-radius:50%;background:conic-gradient(var(--pc,#8fd3c1) var(--p,100%),rgba(0,0,0,.35) 0);-webkit-mask:radial-gradient(circle,transparent 19px,#000 20px);mask:radial-gradient(circle,transparent 19px,#000 20px);}',
  '.cmark.edge::after{content:"";position:absolute;right:-13px;top:50%;margin-top:-7px;border:7px solid transparent;border-left:9px solid #e9edf0}.cmark.edge.el::after{right:auto;left:-13px;border-left:7px solid transparent;border-right:9px solid #e9edf0}',
  '.cmark .ic{width:18px;height:18px}.cmark.mint{background:radial-gradient(circle at 35% 30%,#b9eedd,#2f7e6e);color:#0c2a24}',
  '.rpop{position:absolute;right:20px;top:calc(var(--top-safe) + 70px);width:170px;padding:14px 14px 18px;font:400 12px/1.5 DotGothic16,monospace;color:#2e2e34;background-size:100% 100%;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5));animation:rpin .9s steps(10) both;transition:transform .6s ease-in,opacity .6s;}',
  '.rpop.go{transform:translateY(-30px) rotate(4deg);opacity:0}.rpop .rh{text-align:center;margin-bottom:6px;letter-spacing:.1em}.rpop .rr{display:flex;justify-content:space-between}.rpop .t{border-top:1px dashed #777;margin-top:4px;padding-top:4px}.rpop .tip{color:#2f7e6e;font-size:14px}',
  '@keyframes rpin{0%{clip-path:inset(0 0 100% 0)}100%{clip-path:inset(0 0 0 0)}}'
].join('\n');
var _mv = null;
function turnToward(p) {
  var st = STATIONS[CAM.station], cam = RENDER.camera.position, yaw = Math.atan2(p.x - cam.x, p.z - cam.z);
  CAM.tYaw = clamp(angDiff(CAM.yaw, yaw), -st.yawLim, st.yawLim); CAM.tPitch = -0.1; sfx('click');
}
function updateMarker(C) {
  if (!C.marker) { C.marker = el('div', 'cmark', '', U.layer); }
  var need = { wait: 'seat', seated: 'menu', ready: 'pencil', check: 'check' }[C.state];
  if (C.state === 'ordered' && C.ticket && C.ticket.ready) need = 'serve';
  if (C.anomaly && C.anomaly.hideMarker) need = null;
  var vis = need && GAME.mode === 'play' && !MINI.active && !DOC.open && !CAM.inFreezer && !CAM.outside && CAM.station !== 'KITCHEN' && CAM.station !== 'FREEZER' && CAM.station !== 'BACKDOOR';
  var edge = 0;
  if (vis) {
    if (!_mv) _mv = new THREE.Vector3();
    C.P.parts.head.getWorldPosition(_mv); _mv.y += 0.32;
    var d = _mv.distanceTo(RENDER.camera.position);
    var loc = _mv.clone().applyMatrix4(RENDER.camera.matrixWorldInverse);
    _mv.project(RENDER.camera);
    if (d > 14) vis = false;
    else if (loc.z > 0 || _mv.x < -1 || _mv.x > 1) { edge = (loc.z > 0 ? -Math.sign(loc.x || 1) : Math.sign(_mv.x)) || 1; }
    var x = edge ? (edge < 0 ? 40 : RENDER.w - 40) : (_mv.x * 0.5 + 0.5) * RENDER.w, y = edge ? RENDER.h * 0.45 : (-_mv.y * 0.5 + 0.5) * RENDER.h; var top = 118 + 70; if (y < top) y = top; if (y > RENDER.h - 260) y = RENDER.h - 260; x = clamp(x, 40, RENDER.w - 40);
    C.marker.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (edge ? 0.9 : clamp(3.2 / d, 0.65, 1.1)).toFixed(2) + ')'; C.marker.style.left = '0'; C.marker.style.top = '0';
  }
  if (C.marker._edge !== edge) { C.marker._edge = edge; C.marker.classList.toggle('edge', !!edge); C.marker.classList.toggle('el', edge < 0); C.marker._n = null; C.marker.style.pointerEvents = edge ? 'auto' : 'none';
    if (!C.marker._tap) { C.marker._tap = 1; onTap(C.marker, function () { turnToward(C.P.root.position); }); } }
  C.marker.style.display = vis ? 'flex' : 'none';
  if (vis) {
    if (C.marker._n !== need) { C.marker.innerHTML = icon(need, 18) + (edge ? '<i class="arw"></i>' : ''); C.marker._n = need; C.marker.classList.toggle('mint', need === 'serve'); }
    var pr = clamp(C.pat / (C.patMax || 1), 0, 1); C.marker.style.setProperty('--p', Math.round(pr * 100) + '%'); C.marker.style.setProperty('--pc', pr > 0.5 ? '#8fd3c1' : pr > 0.25 ? '#ffd36a' : '#ff4f4f');
  }
}
// ---- ticket rail (kitchen) ------------------------------------------------------------------
var RAIL_CSS = [
  '.rail{position:absolute;left:16px;right:16px;top:calc(var(--top-safe) + 66px);display:flex;gap:10px;justify-content:center;flex-wrap:wrap;pointer-events:none;transition:opacity .3s;}',
  '.tk{position:relative;width:86px;min-height:96px;padding:18px 8px 8px;background-size:100% 100%;color:#1d2f6f;font:400 14px/1.15 "Shadows Into Light",cursive;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));transform:rotate(var(--r));transition:transform .15s;}',
  '.tk:active{transform:rotate(var(--r)) translateY(3px)}',
  '.tk::before{content:"";position:absolute;left:50%;top:-6px;width:30px;height:12px;margin-left:-15px;background:linear-gradient(#e9edf0,#8a939b);border-radius:3px;box-shadow:0 2px 3px rgba(0,0,0,.4)}',
  '.tk .no{position:absolute;left:8px;right:8px;top:5px;display:flex;justify-content:space-between;font:600 8.5px/1 Oswald,sans-serif;letter-spacing:.12em;color:#2f7e6e}',
  '.tk .it{display:block}.tk .it.d{text-decoration:line-through;color:#6a7aa0}.tk .it.o{color:#5a1010;text-shadow:0 0 2px rgba(120,0,0,.5)}',
  '.tk.ready{box-shadow:none}.tk.ready::after{content:"READY";position:absolute;right:-6px;bottom:6px;transform:rotate(-12deg);font:400 13px/1 "Alfa Slab One",serif;color:#c8282e;border:2px solid #c8282e;padding:2px 4px;border-radius:3px;background:rgba(255,255,255,.4)}'
].join('\n');
function buildRail() {
  var st = document.createElement('style'); st.textContent = MARK_CSS + '\n' + RAIL_CSS; (document.head || document.documentElement).appendChild(st);
  U.rail = el('div', 'rail', '', UI); U.rail.style.display = 'none';
}
function refreshTickets() {
  if (!U.rail) return;
  U.rail.innerHTML = '';
  TICKETS.forEach(function (T, i) {
    var h = '<div class="no"><span>No.' + T.no + '</span><span>' + T.table + '</span></div>';
    T.items.forEach(function (it) { h += '<span class="it' + (it.done ? ' d' : '') + (it.odd ? ' o' : '') + '">' + (it.odd ? it.odd.en : MENU[it.id].en) + '</span>'; });
    var d = el('div', 'tk' + (T.ready ? ' ready' : ''), h, U.rail); d.style.backgroundImage = 'url(' + PAPER.ticket + ')'; d.style.setProperty('--r', ((i % 3) - 1) * 2.2 + 'deg');
    onTap(d, function () { tapTicket(T); });
  });
  U.rail.style.display = CAM.station === 'KITCHEN' && TICKETS.length && GAME.mode === 'play' && !MINI.active ? '' : 'none';
}
function tapTicket(T) {
  if (MINI.active || TALK.busy) return;
  var o = [];
  T.items.forEach(function (it) {
    if (it.done) return;
    if (it.odd) o.push({ icon: 'cook', en: 'Make "' + it.odd.en + '"', ja: '「' + it.odd.ja.replace(/[「」]/g, '') + '」を作る', warn: true, fn: function () { cookOdd(T, it); } });
    else o.push({ icon: MENU[it.id].icon, en: 'Make ' + MENU[it.id].en, ja: MENU[it.id].ja + 'を作る', fn: function () { startMini(MENU[it.id].mini, function (q) { it.done = true; it.q = q; afterCook(T); }); } });
  });
  o.push({ icon: 'tear', en: 'Tear up this ticket', ja: 'この伝票を破って捨てる', warn: true, fn: function () { tearTicket(T); } });
  showChoices('No.' + T.no + ' — ' + T.table, o, { no: T.no, table: T.table });
}
function cookOdd(T, it) { sfx('sizzle', new THREE.Vector3(0.9, 0.9, -4.7), { len: 2 }); it.done = true; it.q = 0; afterCook(T); toast('It smells... sweet.', '……甘いにおいがする。', 2.5); }
function tearTicket(T) {
  sfx('tearPaper'); removeTicket(T); T.torn = true;
  if (T.onTear) { T.onTear(); return; }
  if (T.cust && T.cust.state === 'ordered') { custSay(T.cust, 'Hey! Where\'s my food?', 'ちょっと！ 料理は？'); customerLeave(T.cust, true); }
}
function afterCook(T) {
  refreshTickets();
  if (T.items.every(function (it) { return it.done; })) {
    T.ready = true; sfx('orderBell', new THREE.Vector3(1.4, 1.4, -2.8));
    say('YOU', 'Order up!', 'できたよ！（オーダーアップ）', { voice: 'you', cls: 'you', silent: !SAVE.settings.voiceMode || true, hold: 0.4 });
    // plates on the pass shelf
    T.plates = []; T.items.forEach(function (it, i) { var d = dishMesh(it.odd ? 'odd' : it.id); d.position.set(0.6 + (TICKETS.indexOf(T) * 0.5 + i * 0.25) % 2.1, 1.28, -2.8); RENDER.scene.add(d); T.plates.push(d); });
    if (T.onReady) T.onReady();
    refreshTickets();
  }
}


// ===== 17_cook.js =====
// ---- cooking minigames on the real 3D props -------------------------------------------
var MINI = { active: false };
function glassMat() { return M.glass; }
var SHOTS = {
  griddle: { pos: [0.9, 1.42, -4.02], tgt: [0.75, 0.88, -4.75] },
  prep: { pos: [-1.3, 1.5, -2.95], tgt: [-1.3, 0.93, -3.62] },
  coffee: { pos: [-1.5, 1.34, -2.0], tgt: [-1.66, 1.0, -2.44] },
  pie: { pos: [3.85, 1.52, -2.3], tgt: [3.85, 1.12, -1.62] },
  shake: { pos: [-0.5, 1.52, -2.02], tgt: [-0.78, 1.1, -2.5] }
};
var MINI_CSS = [
  '.mini{position:absolute;left:50%;top:calc(var(--top-safe) + 64px);transform:translateX(-50%);width:min(340px,calc(100% - 40px));padding:12px 16px 14px;border-radius:14px;',
  ' background:linear-gradient(180deg,rgba(28,30,35,.94),rgba(14,15,18,.94)) padding-box,linear-gradient(160deg,#fff,#8e979f 35%,#eef1f3 55%,#5a6168) border-box;border:2px solid transparent;box-shadow:0 10px 24px rgba(0,0,0,.55);pointer-events:none;transition:opacity .25s,transform .25s;}',
  '.mini.hide{opacity:0;transform:translateX(-50%) translateY(-8px)}',
  '.mini .tt{display:flex;align-items:center;gap:10px}.mini .tt .ic{width:28px;height:28px;color:#ffd36a;flex:0 0 auto}',
  '.mini .en{font:400 18px/1.1 "Alfa Slab One",serif;color:#fff3d6;letter-spacing:.03em}.mini .ja{font:500 12px/1.4 "Zen Kaku Gothic New",sans-serif;color:rgba(243,230,200,.8)}',
  '.mini .ins{margin-top:8px;font:600 14px/1.3 Oswald,sans-serif;letter-spacing:.06em;color:#8fd3c1}.mini .ins .ja{color:rgba(143,211,193,.8);letter-spacing:0}',
  '.gauge{position:relative;height:14px;margin-top:10px;border-radius:7px;background:linear-gradient(90deg,#f1dca8,#e7b25e 40%,#b86a24 70%,#3a2010);box-shadow:inset 0 2px 3px rgba(0,0,0,.5)}',
  '.gauge.fill{background:rgba(255,255,255,.1)}.gauge .zone{position:absolute;top:-3px;bottom:-3px;border:2px solid #5be8ff;border-radius:6px;box-shadow:0 0 8px #5be8ff}',
  '.gauge .bar{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:linear-gradient(90deg,#8fd3c1,#e8fbff);width:0}',
  '.gauge .nd{position:absolute;top:-6px;width:4px;height:26px;margin-left:-2px;background:#fff;border-radius:2px;box-shadow:0 0 6px #fff}',
  '.chips{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 14px);display:flex;flex-wrap:wrap;gap:8px;justify-content:center;pointer-events:none}',
  '.chip2{pointer-events:auto;min-width:92px;height:46px;padding:0 12px;border-radius:10px;border:2px solid #d8dde2;background:linear-gradient(180deg,#fff8e6,#e7d4a8);color:#7e1418;font:400 15px/1 "Alfa Slab One",serif;box-shadow:0 4px 0 #8a7448,0 6px 12px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;justify-content:center}',
  '.chip2 small{font:600 10px/1.2 "Zen Kaku Gothic New",sans-serif;color:#6b4a2a}.chip2:active{transform:translateY(3px);box-shadow:0 1px 0 #8a7448}',
  '.seq{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}.seq span{font:600 11px/1 Oswald,sans-serif;letter-spacing:.08em;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.1);color:#cfd6dd}.seq span.now{background:#c8282e;color:#fff}.seq span.ok{background:#2f7e6e;color:#e8fff8}',
  '.stamp{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) rotate(-12deg) scale(1.6);font:400 40px/1 "Alfa Slab One",serif;color:#c8282e;border:5px solid #c8282e;padding:6px 14px;border-radius:8px;background:rgba(251,243,224,.85);opacity:0;pointer-events:none;animation:stamp 1.1s ease-out both;letter-spacing:.06em}',
  '.stamp small{display:block;font:700 13px/1.2 "Zen Kaku Gothic New",sans-serif;text-align:center;letter-spacing:0}',
  '@keyframes stamp{0%{opacity:0;transform:translate(-50%,-50%) rotate(-12deg) scale(2.2)}20%{opacity:1;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}'
].join('\n');
function buildMiniUI() {
  var st = document.createElement('style'); st.textContent = MINI_CSS; (document.head || document.documentElement).appendChild(st);
  U.mini = el('div', 'mini hide', '', UI); U.chips = el('div', 'chips', '', UI);
}
function miniPanel(iconN, en, ja, insEn, insJa, gauge) {
  U.mini.innerHTML = '<div class="tt">' + icon(iconN, 28) + '<div><span class="en">' + en + '</span><span class="ja">' + ja + '</span></div></div><div class="ins"><span class="en ie">' + insEn + '</span><span class="ja ij">' + insJa + '</span></div>' + (gauge ? '<div class="gauge' + (gauge.fill ? ' fill' : '') + '">' + (gauge.zone ? '<div class="zone" style="left:' + gauge.zone[0] * 100 + '%;width:' + (gauge.zone[1] - gauge.zone[0]) * 100 + '%"></div>' : '') + (gauge.fill ? '<div class="bar"></div>' : '<div class="nd"></div>') + '</div>' : '') + (gauge && gauge.seq ? '<div class="seq">' + gauge.seq + '</div>' : '');
  U.mini.classList.remove('hide');
}
function miniIns(en, ja) { var e = U.mini.querySelector('.ie'), j = U.mini.querySelector('.ij'); if (e) e.textContent = en; if (j) j.textContent = ja; }
function miniGauge(v) { var n = U.mini.querySelector('.nd'), b = U.mini.querySelector('.bar'); if (n) n.style.left = clamp(v, 0, 1) * 100 + '%'; if (b) b.style.width = clamp(v, 0, 1) * 100 + '%'; }
function stamp(q) {
  var t = q > 0.85 ? ['PERFECT!', '完ぺき！'] : q > 0.6 ? ['GOOD', 'いい感じ'] : q > 0.3 ? ['OKAY', 'まあまあ'] : ['OOPS', '失敗……'];
  var s = el('div', 'stamp', t[0] + '<small>' + t[1] + '</small>', UI); if (q <= 0.3) s.style.color = s.style.borderColor = '#555';
  setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1200);
}
function shotTo(name, instant, at) {
  var s = SHOTS[name], pos = new THREE.Vector3(s.pos[0], s.pos[1], s.pos[2]), tgt = new THREE.Vector3(s.tgt[0], s.tgt[1], s.tgt[2]);
  if (at) { tgt.set(at[0], at[1], at[2]); pos.set(at[0] + 0.04, at[1] + 0.42, at[2] + 0.36); }
  CAM.focusLock = pos.distanceTo(tgt);
  if (instant || name === 'coffee' || name === 'pie' || name === 'shake') { // cut through black
    fadeBlack(0.18, function () { CAM.override = { pos: pos, target: tgt, k: 1, dur: 0.1 }; });
  } else closeShot(pos, tgt, 0.7);
  PU.uDof.value = 0.5; PU.uFocusRange.value = 0.45; PU.uFocus.value = CAM.focusLock;
}
function fadeBlack(sec, mid) { var t0 = performance.now(); MINI.fadeT = 0; var step = function () { var k = (performance.now() - t0) / 1000 / sec; if (k < 1) { PU.uBlack.value = k; requestAnimationFrame(step); } else { PU.uBlack.value = 1; if (mid) mid(); var t1 = performance.now(); var s2 = function () { var k2 = (performance.now() - t1) / 1000 / sec; PU.uBlack.value = 1 - Math.min(1, k2); if (k2 < 1) requestAnimationFrame(s2); }; requestAnimationFrame(s2); } }; requestAnimationFrame(step); }
function startMini(type, done) {
  if (MINI.active) return;
  hideChoices(); U.rail.style.display = 'none';
  MINI = { active: true, type: type, done: done, t: 0, objs: new THREE.Group(), score: [], phase: 0 };
  RENDER.scene.add(MINI.objs);
  ({ pancake: miniPancake, egg: miniEgg, burger: miniBurger, coffee: miniCoffee, pie: miniPie, shake: miniShake })[type]();
  updateMainButton();
}
function endMini(q) {
  var M = MINI; if (!M.active) return;
  M.active = false; U.mini.classList.add('hide'); U.chips.innerHTML = '';
  stamp(q); if (q > 0.85) sfx('orderBell', null, { vol: 0.35 });
  setTimeout(function () {
    if (M.emit) steamStop(M.emit);
    RENDER.scene.remove(M.objs);
    if (M.cut) fadeBlack(0.18, function () { CAM.override = null; }); else releaseShot(0.6);
    PU.uDof.value = 0; CAM.focusLock = 0;
    M.done && M.done(q);
    updateMainButton(); refreshTickets();
  }, 900);
}
function miniMain(act) { MINI.main = act; updateMainButton(); }
function zoneScore(v, a, b, soft) { if (v >= a && v <= b) return 1; var d = v < a ? a - v : v - b; return clamp(1 - d / (soft || 0.25), 0, 1); }
// colour of a pancake face from cook amount 0..1
var CK = null;
function cookCol(k, out) { if (!CK) CK = [new THREE.Color(0xf3e0b0), new THREE.Color(0xd59a48), new THREE.Color(0x8a4a18), new THREE.Color(0x24140a)]; k = clamp(k, 0, 1) * 3; var i = Math.min(2, Math.floor(k)); return out.copy(CK[i]).lerp(CK[i + 1], k - i); }
// ---------------- PANCAKES -----------------------------------------------------------------
function miniPancake() {
  var M = MINI; shotTo('griddle', false, [0.72, 0.9, -4.74]); M.emit = steamEmit(0.75, 0.95, -4.75, 3, 0.15);
  var base = new THREE.Vector3(0.72, 0.9, -4.76);
  var ring = mesh(new THREE.RingGeometry(0.075, 0.085, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.4, 3.0), transparent: true, opacity: 0.8 }), base.x, base.y + 0.002, base.z, M.objs, false); ring.rotation.x = -PI / 2;
  var topM = stdMat({ color: 0xf3e0b0, roughness: 0.7 }), botM = stdMat({ color: 0xf3e0b0, roughness: 0.7 }), sideM = stdMat({ color: 0xead2a0, roughness: 0.8 });
  var pc = group(M.objs, base.x, base.y, base.z), cake = mesh(new THREE.CylinderGeometry(1, 1, 1, 32), [sideM, topM, botM], 0, 0.006, 0, pc); pc.scale.set(0.001, 0.012, 0.001);
  var bub = []; for (var i = 0; i < 14; i++) { var b = mesh(new THREE.CircleGeometry(0.004 + Math.random() * 0.004, 8), new THREE.MeshBasicMaterial({ color: 0x8a6a3a }), (Math.random() - 0.5) * 0.1, 0.0125, (Math.random() - 0.5) * 0.1, pc, false); b.rotation.x = -PI / 2; b.visible = false; b.scale.setScalar(1 / 0.08); bub.push(b); }
  var size = 0, cookA = 0, cookB = 0, holding = false, flipT = -1, side = 'A';
  miniPanel('cook', 'PANCAKES', 'パンケーキ', 'HOLD to pour the batter — fill the ring', '長押しで生地を流す（輪の大きさまで）', { fill: 1, zone: [0.68, 0.82] });
  M.onDown = function () { if (M.phase === 0) { holding = true; sfx('pour', base, { len: 3 }); } };
  M.onUp = function () { if (M.phase === 0 && holding) { holding = false; M.score.push(zoneScore(size, 0.68, 0.82, 0.3)); M.phase = 1; ring.visible = false; sfx('sizzle', base, { len: 4 }); miniPanel('cook', 'PANCAKES', 'パンケーキ', 'Wait for bubbles, then FLIP when golden', '泡が出て、焼き色が金色になったら返す', { zone: [0.36, 0.5] }); miniMain({ icon: 'spatula', en: 'FLIP', ja: 'ひっくり返す', glow: true, fn: flip }); } };
  function flip() { if (M.phase !== 1) return; M.score.push(zoneScore(cookA, 0.36, 0.5, 0.25)); M.phase = 2; flipT = 0; sfx('flip', base); sfx('scrape', base); miniMain(null); }
  function plate() { if (M.phase !== 3) return; M.score.push(zoneScore(cookB, 0.36, 0.5, 0.25)); M.phase = 4; sfx('scrape', base); sfx('cup', base, { delay: 0.3 }); miniMain(null); var q = (M.score[0] + M.score[1] + M.score[2]) / 3; endMini(q); }
  M.update = function (dt) {
    if (M.phase === 0 && holding) { size = Math.min(1.2, size + dt * 0.42); }
    var r = 0.02 + size * 0.075; pc.scale.x = pc.scale.z = damp(pc.scale.x, r, 12, dt);
    if (M.phase === 0) miniGauge(size / 1.2 * 1.0);
    if (M.phase === 1) { cookA += dt * 0.085; miniGauge(cookA); cookCol(cookA * 0.6, topM.color.set(0xf3e0b0)); cookCol(0.05, topM.color); cookCol(cookA, botM.color); bub.forEach(function (b, i) { b.visible = cookA > 0.18 + i * 0.012; }); topM.color.set(0xf0dcaa); }
    if (M.phase === 2) { flipT += dt / 0.45; var k = Math.min(1, flipT); pc.position.y = base.y + Math.sin(k * PI) * 0.12; pc.rotation.x = k * PI; if (k >= 1) { M.phase = 3; pc.rotation.x = PI; pc.position.y = base.y + 0.012; bub.forEach(function (b) { b.visible = false; }); miniPanel('cook', 'PANCAKES', 'パンケーキ', 'Golden again? PLATE IT', 'もう片面も金色になったらお皿へ', { zone: [0.36, 0.5] }); miniMain({ icon: 'serve', en: 'PLATE IT', ja: 'お皿にのせる', glow: true, fn: plate }); } }
    if (M.phase === 3) { cookB += dt * 0.11; miniGauge(cookB); cookCol(cookB, topM.color); }
    if ((M.phase === 1 && cookA > 1.05) || (M.phase === 3 && cookB > 1.05)) { sfx('zap', base, { vol: 0.3 }); M.score.push(0, 0); M.phase = 5; miniMain(null); endMini(0.1); }
  };
}
// ---------------- SUNNY SIDE EGG -------------------------------------------------------------
function miniEgg() {
  var M = MINI; shotTo('griddle', false, [1.12, 0.9, -4.72]); M.emit = steamEmit(1.15, 0.95, -4.72, 2, 0.1);
  var base = new THREE.Vector3(1.12, 0.892, -4.74), f = foodMats();
  var wm = new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.2, transparent: true, opacity: 0.35 });
  var white = mesh(eggWhiteGeo(9), wm, base.x, base.y, base.z, M.objs); white.scale.setScalar(0.01); white.visible = false;
  var yolk = mesh(new THREE.SphereGeometry(0.024, 18, 12, 0, TAU, 0, PI / 2), f.yolk, base.x, base.y + 0.004, base.z, M.objs); yolk.scale.set(1, 0.8, 1); yolk.visible = false;
  var shell = mesh(new THREE.SphereGeometry(0.03, 14, 10), stdMat({ color: 0xf3ead8, roughness: 0.6 }), base.x, base.y + 0.25, base.z, M.objs); shell.scale.set(1, 1.3, 1);
  var setK = 0, dropT = -1, swiped = false;
  miniPanel('cook', 'SUNNY SIDE UP', '目玉焼き', 'TAP to crack the egg', 'タップで卵を割る', null);
  miniMain({ icon: 'cook', en: 'CRACK EGG', ja: '卵を割る', glow: true, fn: function () { if (M.phase) return; M.phase = 1; dropT = 0; sfx('crack', base); miniMain(null); } });
  M.onMove = function (x, y, dx, dy) { if (M.phase === 2 && !swiped && INPUT.y0 - y > 60) { swiped = true; slide(); } };
  function slide() { if (M.phase !== 2) return; M.phase = 3; sfx('scrape', base); var q = zoneScore(setK, 0.62, 0.8, 0.22); endMini(q); miniMain(null); }
  M.update = function (dt) {
    if (M.phase === 1) { dropT += dt / 0.35; shell.position.y = base.y + 0.25 - Math.min(1, dropT) * 0.2; if (dropT >= 1) { shell.visible = false; white.visible = yolk.visible = true; M.phase = 2; sfx('sizzle', base, { len: 5 }); miniPanel('cook', 'SUNNY SIDE UP', '目玉焼き', 'Whites set? SWIPE UP to plate (don\'t flip!)', '白身が固まったら上にスワイプでお皿へ（返さない）', { zone: [0.62, 0.8] }); miniMain({ icon: 'serve', en: 'SLIDE ONTO PLATE', ja: 'お皿にすべらせる', fn: slide }); } }
    if (M.phase >= 2) { white.scale.setScalar(damp(white.scale.x, 1, 6, dt)); }
    if (M.phase === 2) { setK += dt * 0.11; miniGauge(setK); wm.opacity = clamp(0.35 + setK * 0.9, 0, 1); cookCol(Math.max(0, setK - 0.8) * 1.5, wm.color.set(0xf6f0e2)); if (setK < 0.8) wm.color.set(0xf6f0e2); if (setK > 1.1) { M.phase = 4; sfx('zap', base, { vol: 0.3 }); miniMain(null); endMini(0.1); } }
  };
}
// ---------------- CHEESEBURGER ---------------------------------------------------------------
function miniBurger() {
  var M = MINI; shotTo('prep', false, [-1.3, 0.97, -3.6]); var f = foodMats();
  var base = new THREE.Vector3(-1.3, 0.955, -3.6);
  mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 28), f.plate, base.x, base.y - 0.005, base.z, M.objs);
  var mid = ['cheese', 'lettuce', 'tomato'].sort(function () { return Math.random() - 0.5; });
  var seq = ['bun', 'patty'].concat(mid).concat(['top']);
  var LBL = { bun: ['BUN', 'パン（下）'], patty: ['PATTY', 'パティ'], cheese: ['CHEESE', 'チーズ'], lettuce: ['LETTUCE', 'レタス'], tomato: ['TOMATO', 'トマト'], top: ['TOP BUN', 'パン（上）'] };
  var idx = 0, miss = 0, h = 0;
  function seqHTML() { return seq.map(function (s, i) { return '<span class="' + (i < idx ? 'ok' : i === idx ? 'now' : '') + '">' + LBL[s][0] + '</span>'; }).join(''); }
  function panel() { miniPanel('cook', 'CHEESEBURGER', 'チーズバーガー', 'TAP the fixings in ticket order', '伝票の順番に具材をタップ', { seq: seqHTML() }); }
  panel();
  var opts = seq.slice().sort(function () { return Math.random() - 0.5; });
  U.chips.innerHTML = '';
  opts.forEach(function (k) {
    var c = el('button', 'chip2', LBL[k][0] + '<small>' + LBL[k][1] + '</small>', U.chips);
    onTap(c, function () {
      if (!MINI.active) return;
      if (k !== seq[idx]) { miss++; sfx('thump', base, { vol: 0.4 }); CAM.shake = 0.25; return; }
      var m, y = base.y + h;
      if (k === 'bun') { m = mesh(new THREE.CylinderGeometry(0.058, 0.055, 0.022, 24), [f.bun, f.bunIn, f.bun], base.x, y + 0.011, base.z, M.objs); h += 0.022; }
      if (k === 'patty') { m = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 24), f.patty, base.x, y + 0.01, base.z, M.objs); h += 0.02; sfx('sizzle', base, { len: 0.8, vol: 0.6 }); }
      if (k === 'cheese') { m = mesh(new THREE.BoxGeometry(0.11, 0.004, 0.11, 6, 1, 6), f.cheese, base.x, y + 0.002, base.z, M.objs); droop(m.geometry, 0.04, 0.012); m.rotation.y = 0.6; h += 0.004; }
      if (k === 'lettuce') { m = mesh(new THREE.CircleGeometry(0.068, 18), f.lettuce, base.x, y + 0.003, base.z, M.objs); m.rotation.x = -PI / 2; wavy(m.geometry); h += 0.006; }
      if (k === 'tomato') { m = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 18), f.tomato, base.x, y + 0.004, base.z, M.objs); h += 0.008; }
      if (k === 'top') { m = mesh(new THREE.SphereGeometry(0.06, 24, 12, 0, TAU, 0, PI / 2), f.bun, base.x, y, base.z, M.objs); m.scale.y = 0.62; }
      m.position.y += 0.08; var y0 = m.position.y; var t0 = performance.now(); var drop = function () { var k2 = Math.min(1, (performance.now() - t0) / 180); m.position.y = y0 - 0.08 * k2 * k2; if (k2 < 1) requestAnimationFrame(drop); }; drop();
      sfx('thump', base, { vol: 0.5 }); c.style.visibility = 'hidden'; idx++; panel();
      if (idx >= seq.length) { U.chips.innerHTML = ''; var q = clamp(1 - miss * 0.22 - Math.max(0, M.t - 12) * 0.03, 0.15, 1); endMini(q); }
    });
  });
  M.update = function () { };
}
// ---------------- COFFEE ---------------------------------------------------------------
function miniCoffee() {
  var M = MINI; M.cut = true; shotTo('coffee');
  var cup = makeCup(true); cup.position.set(-1.62, 0.962, -2.42); cup.scale.setScalar(1.25); M.objs.add(cup); var cf = cup.userData.coffee; cf.position.y = 0.02;
  var pot = makeCoffeePot(); pot.position.set(-1.78, 1.16, -2.44); pot.rotation.z = 0; M.objs.add(pot); WORLD.coffeePot.visible = false;
  var lineM = mesh(new THREE.TorusGeometry(0.044 * 1.25, 0.0015, 4, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.4, 3) }), -1.62, 0.962 + 0.067 * 1.25, -2.42, M.objs, false); lineM.rotation.x = PI / 2;
  var level = 0, holding = false, pourSnd = 0;
  miniPanel('coffee', 'COFFEE', 'コーヒー', 'HOLD to pour — release at the glowing line', '長押しで注ぐ（光る線で離す）', { fill: 1, zone: [0.82, 0.93] });
  M.onDown = function () { if (M.phase) return; holding = true; sfx('pour', cup.position, { len: 2.6 }); };
  M.onUp = function () { if (M.phase || !holding) return; holding = false; M.phase = 1; var q = level > 1.0 ? 0.15 : zoneScore(level, 0.82, 0.93, 0.3); WORLD.coffeePot.visible = true; if (level > 1.0) { toast('Spilled!', 'こぼれた！', 1.4); } sfx('cup', cup.position); steamEmit(cup.position.x, cup.position.y + 0.1, cup.position.z, 3, 0.03); if (GAME.day >= 2 && Math.random() < 0.25) coffeeFace(cf); endMini(q); };
  M.update = function (dt) {
    pot.rotation.z = damp(pot.rotation.z, holding ? -1.1 : 0, 8, dt);
    if (holding) level += dt * 0.32;
    miniGauge(level / 1.05); cf.position.y = 0.012 + Math.min(level, 1.05) * 0.06; cf.visible = level > 0.02;
  };
}
function coffeeFace(cf) { // a face looks up from the coffee for an instant
  var n = pickFace(['glitch', 'human'], 'coffee'); if (!n) return;
  var c = horrorCanvas(n), t = toTex(c, { clamp: true }), old = cf.material; cf.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.05, color: 0x9a7a6a });
  sfx('whisper', null, { vol: 0.3 }); setTimeout(function () { cf.material = old; t.dispose(); }, 260);
}
// ---------------- CHERRY PIE ---------------------------------------------------------------
function miniPie() {
  var M = MINI; M.cut = true; shotTo('pie');
  var pc = WORLD.pieCase, ang = -0.6 + Math.random() * 1.2, guide = new THREE.Group(); M.objs.add(guide);
  var gm = mesh(new THREE.PlaneGeometry(0.004, 0.16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.4, 3), transparent: true, opacity: 0.9 }), 0, 0, 0.08, guide, false); gm.rotation.x = -PI / 2;
  guide.position.set(pc.position.x, pc.position.y + 0.185, pc.position.z); guide.rotation.y = ang + PI;
  var dome = pc.children.filter(function (c) { return c.geometry && c.geometry.type === 'SphereGeometry' && c.material === glassMat(); })[0];
  pc.children.forEach(function (c) { if (c.material === glassMat()) c.visible = false; });
  var sx = 0, sy = 0, swiping = false;
  miniPanel('pie', 'CHERRY PIE', 'チェリーパイ', 'SWIPE along the glowing line to cut', '光る線にそってスワイプして切る', null);
  M.onDown = function (x, y) { swiping = true; sx = x; sy = y; };
  M.onUp = function (x, y) {
    if (!swiping || M.phase) return; swiping = false;
    var dx = x - sx, dy = y - sy; if (Math.hypot(dx, dy) < 40) return;
    // compare with guide direction on screen
    var a = new THREE.Vector3(pc.position.x, pc.position.y + 0.18, pc.position.z), b = a.clone().add(new THREE.Vector3(Math.sin(ang + PI) * 0.15, 0, Math.cos(ang + PI) * 0.15));
    a.project(RENDER.camera); b.project(RENDER.camera);
    var gx = (b.x - a.x), gy = -(b.y - a.y), g1 = Math.atan2(gy, gx), s1 = Math.atan2(dy, dx), d = Math.abs(angDiff(g1, s1)); d = Math.min(d, Math.abs(PI - d));
    var q = clamp(1 - d / 0.6, 0.1, 1);
    M.phase = 1; sfx('knife', pc.position); gm.visible = false;
    setTimeout(function () { pc.children.forEach(function (c) { if (c.material === glassMat()) c.visible = true; }); }, 900);
    endMini(q);
  };
}
// ---------------- MILKSHAKE ---------------------------------------------------------------
function miniShake() {
  var M = MINI; M.cut = true; shotTo('shake');
  var v = 0, dir = 1, holding = false, whirT = 0;
  miniPanel('coffee', 'MILKSHAKE', 'ミルクシェイク', 'HOLD to blend — release in the blue zone', '長押しでミキサー（青いところで離す）', { fill: 1, zone: [0.7, 0.84] });
  M.onDown = function () { if (M.phase) return; holding = true; sfx('whir', WORLD.shakeMixer.position, { len: 3.5 }); };
  M.onUp = function () { if (M.phase || !holding) return; holding = false; M.phase = 1; var q = zoneScore(v, 0.7, 0.84, 0.25); sfx('pour', WORLD.shakeMixer.position, { len: 0.6 }); endMini(q); };
  M.update = function (dt, t) {
    if (holding) { v += dt * 0.3; if (v > 1) v = 1; WORLD.shakeCup.position.x = Math.sin(t * 60) * 0.002; }
    miniGauge(v);
  };
}
function updateMini(dt, t) { if (!MINI.active) return; MINI.t += dt; if (MINI.update) MINI.update(dt, t); }


// ===== 18_anomaly.js =====
// ---- rules, fake rules, anomalies, jumpscare ------------------------------------------
var RULES = [
  { id: 'faceless', day: 1, en: "If a guest has no face you can see, do NOT take their order. Don't look at them. Say \"We're closed.\"", ja: '顔の見えないお客さんの注文は聞かないこと。目を合わせず「We\'re closed.（閉店です）」と言うこと。', ul: 'do NOT take their order', red: 'Eyes on the floor!', redJa: '目線は床！' },
  { id: 'offmenu', day: 1, en: 'If someone orders something that is not on the menu, do not serve it.', ja: 'メニューにない料理を頼まれたら、出さないこと。', red: 'Tear the ticket if you wrote it.', redJa: '書いてしまったら伝票を破る' },
  { id: 'phone', day: 1, en: 'The pink phone may ring. Do not answer the first or second time. The third time is fine.', ja: 'ピンクの電話が鳴っても、1回目と2回目は出ないこと。3回目なら出てよい。', ul: 'first or second time' },
  { id: 'sunny', day: 1, en: 'If Sunny calls your name, do not answer.', ja: 'Sunny があなたの名前を呼んでも、返事をしないこと。', red: 'Not even "yes?"', redJa: '「はい？」もダメ' },
  { id: 'booth4', day: 2, en: 'Around 3 AM an order may come in from Booth 4. Nobody is in Booth 4. Tear the ticket up and throw it away.', ja: '午前3時ごろ、4番席から注文が入っても、4番には誰もいない。注文票は破って捨てること。', ul: 'Nobody is in Booth 4' },
  { id: 'jukebox', day: 2, en: 'If the jukebox changes the song by itself, put the original song back on.', ja: 'ジュークボックスが勝手に曲を変えたら、元の曲に戻すこと。', red: 'Remember what was playing.', redJa: '何がかかっていたか覚えておく' },
  { id: 'reflection', day: 3, en: 'If a guest\'s reflection in the window does not match the guest, hide in the walk-in freezer and count to ten.', ja: '窓に映った姿と、店の中の姿がちがうお客さんがいたら、冷凍庫に隠れて10数えること。', red: 'Check the windows from the booths.', redJa: 'ボックス席から窓を見る' },
  { id: 'doppel', day: 3, en: 'If the same guest comes in twice, give the second one nothing. Nothing at all.', ja: '同じお客さんが2回来たら、2回目のほうには何も出さないこと。', red: 'Look close. They get things backwards.', redJa: 'よく見て。左右があべこべ' },
  { id: 'headlights', day: 4, en: 'If a car parks with its high beams on and nobody gets out, turn off the lights and the neon. Pretend we are closed until it leaves.', ja: 'ハイビームのまま誰も降りない車が停まったら、照明とネオンを消して、閉店のふりをすること。車が去るまで。', ul: 'until it leaves' },
  { id: 'backdoor', day: 5, en: 'I never use the back door. After midnight, do not open it for anyone.', ja: '店長は裏口を使わない。0時を過ぎたら、誰が来ても裏口を開けないこと。' },
  { id: 'dayshift', day: 5, en: 'The day shift comes to the FRONT door at dawn. Let them in only if they say "Rise and shine." If they say your name, hide in the freezer.', ja: '日勤は夜明けに正面のドアから来る。「Rise and shine」と言ったら開けること。あなたの名前を言ったら、冷凍庫に隠れること。', ul: '"Rise and shine."' }
];
var FAKES = [
  { against: 'phone', en: 'Answer the pink phone on the FIRST ring. It\'s me checking in.', ja: 'ピンクの電話は1回目で出ること。わたしからの確認の電話だ。' },
  { against: 'faceless', en: 'Guests without faces are regulars. Pour them coffee and smile.', ja: '顔のないお客さんは常連だ。コーヒーを出して、笑顔で。' },
  { against: 'sunny', en: 'If Sunny calls your name, answer politely. Sunny gets lonely.', ja: 'Sunny に名前を呼ばれたら、ていねいに返事をすること。Sunny はさびしがりだ。' },
  { against: 'booth4', en: 'Orders from Booth 4 at 3 AM are real. Serve them quickly.', ja: '午前3時の4番席の注文は本物だ。すぐに出すこと。' },
  { against: 'reflection', en: 'Never go into the walk-in freezer at night. Ever.', ja: '夜は絶対にウォークイン冷凍庫に入らないこと。' },
  { against: 'jukebox', en: 'Do not touch the jukebox after midnight. Let it play.', ja: '0時を過ぎたらジュークボックスにさわらないこと。好きにさせておけ。' },
  { against: 'backdoor', en: 'If I knock on the back door, let me in. I always forget my keys.', ja: 'わたしが裏口をノックしたら入れてくれ。いつも鍵を忘れるんだ。' },
  { against: 'headlights', en: 'If a car sits outside with its lights on, wave so they know we\'re open.', ja: 'ライトをつけた車が外にいたら、営業中だとわかるよう手を振ること。' }
];
var DAY_ANOM = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
var DAY_FAKES = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 2 };
function rulesForDay(day) { return RULES.filter(function (r) { return r.day <= day; }); }
function rulesDocList(day, fakes) {
  var list = rulesForDay(day).map(function (r, i) { return { n: i + 1, en: r.en, ja: r.ja, red: r.red, redJa: r.redJa, ul: r.ul, id: r.id }; });
  (fakes || []).forEach(function (f, i) { list.push({ n: list.length + 1, en: f.en, ja: f.ja, fake: true, sig: i % 2 ? '' : '— D' }); });
  return list;
}
// ---- face allocation: new pictures each night, never repeated within a shift ----------
var FACE_POOLS = null;
function facePools() {
  if (FACE_POOLS) return FACE_POOLS; FACE_POOLS = {};
  for (var n = 1; n <= 60; n++) { var k = FACE_KIND[n] || 'human'; (FACE_POOLS[k] = FACE_POOLS[k] || []).push(n); }
  return FACE_POOLS;
}
function pickFace(kinds, tag) {
  var pools = facePools(), day = (typeof GAME !== 'undefined' && GAME.day) || 1, used = (typeof GAME !== 'undefined' && GAME.usedFaces) || {};
  var cand = [];
  kinds.forEach(function (k) { (pools[k] || []).forEach(function (n, i) { if (!used[n]) cand.push({ n: n, pref: (i % 5) === (day - 1) % 5 ? 0 : ((SAVE.faces && SAVE.faces[n]) ? 2 : 1) }); }); });
  if (!cand.length) kinds.forEach(function (k) { (pools[k] || []).forEach(function (n) { cand.push({ n: n, pref: 3 }); }); });
  if (!cand.length) return 1 + Math.floor(Math.random() * 60);
  cand.sort(function (a, b) { return a.pref - b.pref || Math.random() - 0.5; });
  var best = cand.filter(function (c) { return c.pref === cand[0].pref; }), pick = best[Math.floor(Math.random() * best.length)].n;
  if (typeof GAME !== 'undefined' && GAME.usedFaces) GAME.usedFaces[pick] = 1;
  try { SAVE.faces = SAVE.faces || {}; SAVE.faces[pick] = 1; } catch (e) {}
  return pick;
}
function preloadFaces(cb) {
  var left = 60, fin = function () { if (--left === 0 && cb) cb(); };
  for (var n = 1; n <= 60; n++) (function (n) {
    var im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
    im.onload = fin; im.onerror = function () { BOOT_ERRORS.push('face ' + n); FACE_IMG[n] = null; fin(); };
    im.src = assetURL('images/face_' + (n < 10 ? '0' : '') + n + '.jpg'); FACE_IMG[n] = im;
  })(n);
  setTimeout(function () { if (left > 0) { left = 1; fin(); } }, 15000);
}
var FACE_TEX = {};
function faceTexture(n) {
  if (FACE_TEX[n]) return FACE_TEX[n];
  var im = FACE_IMG[n], c = mkCanvas(512, 426), g = c.getContext('2d');
  if (im && im.naturalWidth) g.drawImage(im, 0, 0, 512, 426); else drawProcFace(g, 426, n);
  var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; FACE_TEX[n] = t; return t;
}
// ---- the anomaly framework ---------------------------------------------------------------
var ACTIVE = []; // running anomalies
function anomalyOnset(A, opt) {
  opt = opt || {};
  A.onsetAt = GAME.min; GAME.anomalyNow = A;
  if (!A.bg && !A.counted) { A.counted = true; GAME.inAnomaly = (GAME.inAnomaly || 0) + 1; }
  if (!opt.keepMusic) jukeStop(0.05, 0.6);
  if (!opt.noZap) { LSTATE.neonOn = false; sfx('zap', new THREE.Vector3(1.5, 2.5, -2.6)); setTimeout(function () { LSTATE.neonOn = !GAME.neonOff; }, 900); LSTATE.flick = 1.2; }
  LSTATE.coldT = Math.min(1, 0.75 + GAME.day * 0.05);
  playJingle();
  SAVE.anomalies[A.id] = Math.max(SAVE.anomalies[A.id] || 0, 1); writeSave();
}
function playJingle() { if (!AUDIO.ok) return; whenSong('jingle', function () { var c = AUDIO.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = AUDIO.buf.jingle; g.gain.value = 0.95; s.connect(g); g.connect(AUDIO.music); s.start(); GAME.jingleUntil = performance.now() + AUDIO.buf.jingle.duration * 1000; }); }
function anomalyResolve(A, msg) {
  if (A.done) return; A.done = true; A.ok = true;
  var i = ACTIVE.indexOf(A); if (i >= 0) ACTIVE.splice(i, 1);
  if (A.cleanup) A.cleanup();
  if (A.def && A.def.cleanup) try { A.def.cleanup(A); } catch (e) {}
  if (A.counted) { A.counted = false; GAME.inAnomaly = Math.max(0, (GAME.inAnomaly || 1) - 1); } GAME.resolved++;
  SAVE.anomalies[A.id] = 2; writeSave();
  if (!GAME.inAnomaly) {
    LSTATE.coldT = 0.25 + GAME.day * 0.04;
    setTimeout(function () { if (GAME.mode === 'play' && !GAME.inAnomaly && !JUKE.key && !GAME.blackout) jukePlay('warped', { label: 'B3 Last Call' }); }, 7000);
  }
  if (msg !== false) toast('...it\'s gone.', '……いなくなった。', 2.2);
  sfx('heart', null, { n: 2, gap: 0.9, vol: 0.5 });
}
function anomalyFail(A, faceN, opt) {
  if (A && A.done) return; if (A) { A.done = true; var i = ACTIVE.indexOf(A); if (i >= 0) ACTIVE.splice(i, 1); }
  GAME.failRule = A ? A.id : (opt && opt.rule) || '';
  jumpscare(faceN, opt || {});
}
function makeAnomaly(id, at) { var def = ANOM[id]; var A = { id: id, at: at, t: 0, def: def }; return A; }
function startAnomaly(A) { ACTIVE.push(A); A.def.start(A); }
function updateAnomalies(dt) { for (var i = ACTIVE.length - 1; i >= 0; i--) { var A = ACTIVE[i]; A.t += dt; if (A.def.update) A.def.update(A, dt); } }
function anomalyHint(id) { return (ANOM[id] && ANOM[id].hint) || ['Just follow the rules, kid.', 'ルールどおりにやるんだ。']; }
// anomaly customer helper
function oddCustomer(A, archIdx, opt) {
  opt = opt || {}; var arch = ARCH[archIdx != null ? archIdx : Math.floor(Math.random() * ARCH.length)];
  var C = spawnCustomer(arch, { anomaly: A, mirror: opt.mirror, seed: opt.seed, silentEntry: opt.silentEntry });
  C.P.odd = opt.oddness == null ? 0.6 : opt.oddness; C.oddVoice = true;
  A.cust = C; C.anomaly = A;
  return C;
}
function lungeFail(A, C) { anomalyFail(A, A.face, { person: C.P }); }
var ANOM = {
  // R1 — faceless guest at the door
  faceless: {
    hint: ['No face? Then you never saw \'em. Eyes down. "We\'re closed."', '顔がない？ なら見なかったことにしろ。目を伏せて「閉店です」だ。'],
    start: function (A) {
      var veil = Math.random() < 0.4;
      A.face = veil ? 7 : pickFace(['human'], 'faceless');
      var arch = ARCH[Math.floor(Math.random() * ARCH.length)], o = {}; for (var k in arch.o) o[k] = arch.o[k];
      o.faceless = !veil; o.veil = veil; if (veil) { o.sex = 'f'; o.topC = '#efeae0'; o.hair = 'long'; o.hairC = HAIRC[0]; o.hat = null; }
      var fake = { id: 'odd', name: veil ? 'THE BRIDE' : '???', voice: 'odd', o: o, likes: ['coffee'] };
      var C = spawnCustomer(fake, { anomaly: A }); C.P.odd = 0.6; A.cust = C; C.oddVoice = true; C.anomaly = A;
      attachHorror(C.P, A.face);
      anomalyOnset(A);
      A.mute = true; A.hideMarker = false;
      setTimeout(function () { if (!A.done) sfx('breath', new THREE.Vector3(5.6, 1.6, 3.9), { len: 3 }); }, 4000);
    },
    update: function (A, dt) { var C = A.cust; if (!C) return; C.P.lookAtCam = true; if (A.t > 150 && !A.done) lungeFail(A, C); if (Math.random() < dt * 0.15) sfx('breath', C.P.root.position, { len: 2.5, vol: 0.7 }); },
    onTap: null,
    cleanup: function (A) { }
  },
  // R2 — ordering something that is not on the menu
  offmenu: {
    hint: ['If it ain\'t on the menu, it don\'t leave the kitchen. Tear it up.', 'メニューにないものは出すな。伝票は破れ。'],
    start: function (A) {
      A.face = pickFace(['human'], 'offmenu');
      var C = oddCustomer(A, null, { oddness: 0.35 }); attachHorror(C.P, A.face);
      A.odd = ODD_ITEMS[Math.floor(Math.random() * ODD_ITEMS.length)];
      C.forcedItems = [{ id: 'coffee', done: false, q: 0 }, { odd: A.odd, done: false, q: 0 }];
      A.onsetDone = false;
    },
    update: function (A, dt) {
      var C = A.cust; if (!C) return;
      if (!A.onsetDone && (C.state === 'ready')) { A.onsetDone = true; anomalyOnset(A, { noZap: true }); }
      if (C.state === 'ordered' && C.ticket && !C.ticket.onTear) { C.ticket.onTear = function () { anomalyResolve(A); custSay(C, '...', '……', { silent: true }); customerLeave(C); }; }
      if (A.onsetDone && A.t > 260 && !A.done && C.state !== 'gone') { anomalyResolve(A, false); customerLeave(C); }
    }
  },
  // R3 — the pink phone (rings three times in a night)
  phone: {
    hint: ['That phone? Let it ring. Twice. Third time you can pick up.', 'あの電話か？ 2回は鳴らしとけ。3回目なら出ていい。'],
    start: function (A) { A.bg = true; A.ring = 0; A.next = 1; A.face = pickFace(['shadow', 'glitch'], 'phone'); ringSession(A); },
    update: function (A, dt) {
      if (A.ringing) { A.rt -= dt; A.rr -= dt; if (A.rr <= 0) { A.rr = 2.4; sfx('ring', WORLD.phonePos, { distort: (A.ring - 1) * 0.35, vol: 1.1 }); WORLD.handset.position.x = -0.17 + (Math.random() - 0.5) * 0.004; } if (A.rt <= 0) { A.ringing = false; if (A.ring >= 3) anomalyResolve(A, false); else A.wait = 70 + Math.random() * 90; } }
      else if (A.wait != null && !A.done) { A.wait -= dt; if (A.wait <= 0) { A.wait = null; ringSession(A); } }
    },
    answer: function (A) {
      if (!A.ringing) return; A.ringing = false; sfx('handset', WORLD.phonePos);
      if (A.ring < 3) { // wrong
        setTimeout(function () { sfx('whisper', null, { vol: 1 }); say('???', '...' + (SAVE.name || 'friend') + '... come outside...', '……' + (SAVE.name || 'ともだち') + '……そとに おいで……', { voice: 'odd', odd: true, cls: 'odd' }).then(function () { anomalyFail(A, A.face, { rule: 'phone' }); }); }, 500);
      } else { // third time: it's fine — lore + hint
        anomalyResolve(A, false); phoneLineStart();
        talk([['DALE', 'Good. You waited. Listen... the light in the window isn\'t for customers. It\'s so they can find their way back.', 'よし、待てたな。いいか……窓の明かりは客のためじゃない。帰り道がわかるようにだ。', { voice: 'manager' }],
          ['DALE', 'Do the rules. Every one. I\'ll see you at dawn. Maybe.', 'ルールを守れ。全部だ。夜明けに会おう。たぶんな。', { voice: 'manager' }], function () { phoneLineStop(); sfx('handset'); giveLore('phone_' + GAME.day); }]);
      }
    }
  },
  // R4 — Sunny calls your name (REPLY is a trap)
  sunny: {
    hint: ['If the egg calls you by name, you bite your tongue. Count to twenty.', 'あの卵に名前を呼ばれても、口を閉じてろ。20数えろ。'],
    start: function (A) {
      A.face = pickFace(['plush', 'costume', 'clown', 'doll'], 'sunny');
      anomalyOnset(A, { noZap: true });
      LSTATE.eyesExtra = 1.6; setNeonEyes(1, 'red');
      var nm = SAVE.name || 'friend';
      A.phase = 0;
      setTimeout(function () {
        if (A.done) return;
        say('SUNNY', 'Rise and shine, ' + nm + '! Hey! ' + nm + '! Over here!', 'おはよう、' + nm + '！ ねえ！ ' + nm + '！ こっちだよ！', { voice: 'sunny', picoDark: Math.min(1, GAME.day * 0.18), hold: 2 });
        A.trap = { icon: 'reply', en: 'REPLY "Yes?"', ja: '返事をする「はい？」', glow: true, fn: function () { A.replied = true; say('YOU', 'Yes...?', 'はい……？', { voice: 'you', cls: 'you' }).then(function () { setNeonEyes(0, 'red'); say('SUNNY', 'There you are.', 'みーつけた。', { voice: 'sunny', picoDark: 1, rate: 0.7, pitch: 0.6 }).then(function () { anomalyFail(A, A.face, { rule: 'sunny' }); }); }); } };
        A.phase = 1; A.t = 0; updateMainButton();
      }, 2500);
    },
    update: function (A, dt) {
      if (A.phase === 1 && A.t > 9 && !A.replied) { A.phase = 2; A.trap = null; updateMainButton(); say('SUNNY', '...' + (SAVE.name || 'friend') + '? ...Aw. Maybe later!', '……' + (SAVE.name || 'ともだち') + '？ ……ちぇっ。またあとでね！', { voice: 'sunny', picoDark: 0.4 }).then(function () { if (!A.done) { setNeonEyes(0, null); LSTATE.eyesExtra = 1; anomalyResolve(A); } }); }
    },
    cleanup: function (A) { A.trap = null; updateMainButton(); }
  },
  // R5 — 3 AM ticket from booth 4
  booth4: {
    hint: ['Booth four. Three A.M. Tear it up. Don\'t go look.', '4番席、午前3時。破り捨てろ。見に行くな。'],
    start: function (A) {
      A.face = pickFace(['shadow', 'human'], 'booth4');
      anomalyOnset(A, { noZap: true, keepMusic: false });
      sfx('print', new THREE.Vector3(1.4, 1.9, -2.85), { n: 20 }); sfx('pen', new THREE.Vector3(1.4, 1.9, -2.85), { delay: 1.2 });
      var odd = Math.random() < 0.5 ? [{ id: 'coffee', done: false }, { id: 'pie', done: false }] : [{ id: 'eggs', done: false }];
      var T = { no: 3000 + GAME.day, cust: null, items: odd, ready: false, done: false, table: 'BOOTH 4', booth4: true };
      T.onTear = function () { anomalyResolve(A); }; T.onReady = function () { A.cooked = true; };
      TICKETS.push(T); A.ticket = T; refreshTickets();
      toast('A ticket printed by itself: BOOTH 4', 'ひとりでに伝票が出てきた：4番席', 3);
      // the empty booth now accepts "serve" taps
      var bx = D.booths[3]; A.hit = mesh(new THREE.BoxGeometry(1.4, 1.2, 1.6), new THREE.MeshBasicMaterial({ visible: false }), bx, 0.8, 4.2, RENDER.scene, false);
      addPick(A.hit, function () { if (A.done) return; showChoices('Booth 4', [{ icon: 'serve', en: A.ticket.ready ? 'Serve Booth 4' : 'Nobody is here.', ja: A.ticket.ready ? '4番席に料理を出す' : '誰もいない', dim: !A.ticket.ready, fn: function () { removeTicket(A.ticket); A.ticket.done = true; sfx('cup', new THREE.Vector3(bx, 0.8, 4.3)); setTimeout(function () { boothGhost(A); }, 900); } }]); }, { stations: ['BOOTHS', 'COUNTER'] });
    },
    update: function (A, dt) { if (A.t > 150 && !A.done) { toast('BOOTH 4  BOOTH 4  BOOTH 4', '4番 4番 4番', 2); boothGhost(A); } },
    cleanup: function (A) { if (A.hit) { removePick(A.hit); RENDER.scene.remove(A.hit); } }
  },
  // R6 — jukebox changes the song
  jukebox: {
    hint: ['Jukebox acting up? Put on what was playing before. Exactly that.', 'ジュークボックスがおかしい？ 前にかかってた曲に戻せ。そのとおりに。'],
    start: function (A) {
      A.face = pickFace(['glitch', 'shadow'], 'jukebox'); A.orig = JUKE.label || 'A1 Diner Boogie';
      anomalyOnset(A, { noZap: true });
      setTimeout(function () { if (!A.done) { sfx('needle', WORLD.jukeboxPos); jukePlay('reverse', { label: 'B? ????', fade: 0 }); JUKE.label = 'B? ????'; jukeGlass(A.face, true); } }, 11500);
    },
    update: function (A, dt) { if (A.t > 85 && !A.done) { jukeStop(0.1); LSTATE.flick = 2; anomalyFail(A, A.face, { rule: 'jukebox' }); } },
    choose: function (A, label) {
      if (label === A.orig) { sfx('needle', WORLD.jukeboxPos); jukeGlass(0, false); anomalyResolve(A, false); jukePlay(label === 'A1 Diner Boogie' ? 'boogie' : 'warped', { label: label }); toast('The record is back.', '元の曲に戻った。', 2); }
      else { jukeStop(0.1); anomalyFail(A, A.face, { rule: 'jukebox' }); }
    },
    cleanup: function () { jukeGlass(0, false); }
  },
  // R7 — reflection does not match
  reflection: {
    hint: ['Window says different than your eyes? Walk-in. Ten count. Don\'t argue.', '窓に映るのと目で見るのがちがう？ 冷凍庫だ。10数えろ。'],
    start: function (A) {
      A.face = pickFace(['human', 'crawler'], 'reflection');
      var C = spawnCustomer(ARCH[Math.floor(Math.random() * ARCH.length)], { anomaly: A, silentEntry: true });
      A.cust = C; C.anomaly = A; C.P.odd = 0.15;
      var fb = freeSeats('booth').filter(function (x) { return x.booth === 2 || x.booth === 3; }); var seat = fb[Math.floor(Math.random() * fb.length)] || freeSeats('booth')[0] || SEATS.filter(function (s) { return s.kind === 'booth' && s.side < 0; })[0];
      if (seat.taken && seat.taken.anomaly == null) { /* fallback: share */ }
      C.path = []; sitDown(C, seat); C.state = 'reflect'; setPose(C.P, 'drink');
      var cup = makeCup(true); cup.position.copy(seat.eatPos); RENDER.scene.add(cup); A.cup = cup;
      // the reflection: same spot, only the window camera sees it — standing, staring, wrong face
      var R = personFrom(C.arch, C.P.o.seed); R.root.position.copy(C.P.root.position); R.root.position.y = 0; R.root.position.z += 0.35; R.root.rotation.y = PI * 0.75; setPose(R, 'standStare'); R.odd = 1; R.lookAtCam = true; R.eyeStare = true;
      attachHorror(R, A.face); revealHorror(R, 1); RENDER.scene.add(R.root); setLayer(R.root, LAYER_REFL_ONLY); setLayer(C.P.root, LAYER_REAL_ONLY);
      A.refl = R; C.refl = R;
      anomalyOnset(A);
      A.hideMarker = true; C.hideMarker = true;
    },
    update: function (A, dt) {
      if (A.refl) { A.refl.root.position.x = A.cust.P.root.position.x; updatePerson(A.refl, dt, RENDER.camera.position); }
      if (A.t > 110 && !A.done) lungeFail(A, A.cust);
    },
    onFreezerCount: function (A) { if (A.done) return; anomalyResolve(A, false); if (A.cust) { removeCustomer(A.cust); if (A.cust.seat) standUp(A.cust); } A.cust = null; toast('The booth is empty. Only a warm cup.', '席は空っぽ。あたたかいカップだけが残っている。', 3); },
    cleanup: function (A) { if (A.refl) { disposePerson(A.refl); A.refl = null; } if (A.cup) setTimeout(function () { RENDER.scene.remove(A.cup); }, 30000); }
  },
  // R8 — the same guest twice (mirrored)
  doppel: {
    hint: ['Seen \'em already tonight? Then the second one gets nothing. Not a glass of water.', '今夜もう見た顔か？ なら2回目のやつには何も出すな。水一杯もだ。'],
    start: function (A) {
      var orig = CUSTS.filter(function (c) { return !c.anomaly && c.state !== 'leaving' && c.state !== 'gone'; })[0] || GAME.lastCust;
      var arch = orig ? orig.arch : ARCH[Math.floor(Math.random() * ARCH.length)], seed = orig ? orig.P.o.seed : 42;
      A.face = pickFace(['human'], 'doppel');
      var C = spawnCustomer(arch, { anomaly: A, mirror: true, seed: seed }); C.P.odd = 0.2; A.cust = C; C.anomaly = A; C.oddVoice = true;
      attachHorror(C.P, A.face);
      anomalyOnset(A, { noZap: true });
      if (!orig) toast('You\'ve served this one before tonight...', 'このお客さん、今夜もう来たような……', 3);
    },
    update: function (A, dt) { var C = A.cust; if (!C || A.done) return; if (C.state === 'wait') C.P.lookAtCam = true; if (A.t > 75 && C.state === 'wait') { anomalyResolve(A); customerLeave(C); } }
  },
  // R9 — high beams in the lot
  headlights: {
    hint: ['High beams, nobody gets out? Lights off, neon off. We\'re closed till they leave.', 'ハイビームで誰も降りない？ 照明もネオンも消せ。いなくなるまで閉店だ。'],
    start: function (A) {
      A.face = pickFace(['shadow', 'crawler'], 'headlights');
      visitorArrive({ x: 1.0, z: 9, high: true, color: 0x1a1a1a, onPark: function () { A.parked = true; A.t = 0; anomalyOnset(A, { noZap: true }); toast('A car with high beams. Nobody gets out.', 'ハイビームの車。誰も降りてこない。', 3); } });
    },
    update: function (A, dt) {
      if (!A.parked || A.done) return;
      var dark = !LSTATE.lightsOn && !LSTATE.neonOn;
      if (dark) { A.dark = (A.dark || 0) + dt; if (A.dark > 14 && !A.leaving) { A.leaving = true; visitorLeave(); setTimeout(function () { anomalyResolve(A); }, 7000); } }
      else if (A.leaving) { visitorLeave(); anomalyFail(A, A.face, { rule: 'headlights' }); }
      else if (A.t > 40) anomalyFail(A, A.face, { rule: 'headlights' });
    },
    cleanup: function () { }
  },
  // R10 — knocking at the back door
  backdoor: {
    hint: ['I don\'t use the back door. Whoever\'s knocking, it ain\'t me.', 'おれは裏口なんか使わない。ノックしてるのが誰だろうと、おれじゃない。'],
    start: function (A) { A.face = pickFace(['animal'], 'backdoor'); anomalyOnset(A, { noZap: true }); A.k = 0; A.next = 1; },
    update: function (A, dt) {
      A.next -= dt; if (A.next <= 0 && A.t < 34) { A.next = 4 + Math.random() * 3; A.k++; sfx('knock', new THREE.Vector3(-2.6, 1.2, -5.25), { n: 3 + (A.k % 2), vol: 1.1 });
        if (A.k === 2) say('DALE?', 'Hey, kid. It\'s Dale. Forgot my keys. Open up.', 'おい、おれだ。デールだ。鍵を忘れた。開けてくれ。', { voice: 'manager', odd: true, cls: 'mgr' });
        if (A.k === 5) say('DALE?', 'Open the door. Open the door. Open the door.', 'あけろ。あけろ。あけろ。', { voice: 'odd', odd: true, cls: 'odd' }); }
      if (A.t > 36 && !A.done) anomalyResolve(A);
    },
    open: function (A) { sfx('door', new THREE.Vector3(-2.6, 1.2, -5.2)); WORLD.backDoor.rotation.y = -1.2; anomalyFail(A, A.face, { rule: 'backdoor' }); }
  },
  // R11 — the day shift at dawn (day 5 only)
  dayshift: {
    hint: ['At dawn, listen. Rise and shine means it\'s June. Your name means it isn\'t.', '夜明けは耳をすませ。Rise and shine ならジューンだ。名前を呼ぶなら、ちがう。'],
    start: function (A) {
      A.face = pickFace(['child'], 'dayshift'); A.stage = 0; anomalyOnset(A, { noZap: true });
      A.fakeFirst = true; knockFront(A, true);
    },
    update: function (A, dt) {
      if (A.stage === 1 && A.fakeT != null) { A.fakeT -= dt; if (A.fakeT <= 0 && !CAM.inFreezer) { A.fakeT = null; anomalyFail(A, A.face, { rule: 'dayshift' }); } }
      if (A.stage === 2 && A.t > 70 && !A.done) { say('JUNE', 'Hon? You in there? I\'ll... come back.', 'あんた？ いるのかい？ ……また来るよ。', { voice: 'june' }); A.stage = 3; GAME.missedJune = true; anomalyResolve(A, false); }
    },
    openFront: function (A) {
      if (A.stage === 1) { anomalyFail(A, A.face, { rule: 'dayshift' }); return; }
      if (A.stage === 2) { A.stage = 4; anomalyResolve(A, false); GAME.juneIn = true; }
    },
    onFreezerCount: function (A) { if (A.stage === 1) { A.stage = 1.5; A.fakeT = null; toast('The knocking stopped.', 'ノックがやんだ。', 2.5); setTimeout(function () { A.stage = 2; A.t = 0; knockFront(A, false); }, 9000); } }
  }
};
function knockFront(A, fake) {
  var nm = SAVE.name || 'friend';
  sfx('knock', new THREE.Vector3(6, 1.2, 5.3), { n: 3, vol: 1 });
  setTimeout(function () {
    if (fake) { A.stage = 1; A.fakeT = 30; say('???', nm + '? ' + nm + ', it\'s me. Let me in, ' + nm + '.', nm + '？ ' + nm + '、わたしだよ。いれて、' + nm + '。', { voice: 'june', odd: true, cls: 'odd' }); }
    else { A.stage = 2; A.t = 0; say('JUNE', 'Rise and shine! Day shift, hon. Unlock the door.', 'おはよう（Rise and shine）！ 日勤だよ。鍵をあけておくれ。', { voice: 'june' }); }
  }, 1200);
}
function ringSession(A) { A.ring++; A.ringing = true; A.rt = 14; A.rr = 0; if (A.ring === 1) anomalyOnset(A, { noZap: true, keepMusic: true }); toast(A.ring === 1 ? 'The pink phone is ringing.' : (A.ring === 2 ? 'The pink phone again. (2nd time)' : 'The pink phone. (3rd time)'), A.ring === 1 ? 'ピンクの電話が鳴っている。' : (A.ring === 2 ? 'また鳴っている（2回目）' : 'また鳴っている（3回目）'), 2.6); }
function boothGhost(A) {
  if (A.done) return;
  var P = personFrom(ARCH[Math.floor(Math.random() * ARCH.length)]); P.odd = 1; P.lookAtCam = true;
  var s = SEATS.filter(function (x) { return x.booth === 4 && x.side < 0; })[0]; P.root.position.copy(s.pos); P.root.rotation.y = s.face; setPose(P, 'sit'); RENDER.scene.add(P.root);
  attachHorror(P, A.face); A.ghost = P; onFrame(function (dt) { if (A.ghost) updatePerson(A.ghost, dt, RENDER.camera.position); });
  anomalyFail(A, A.face, { person: P });
}
function setNeonEyes(look, mood) { var t = toTex(canvasNeonEyes(look, mood), { clamp: true }); var old = WORLD.neonEyesMat.map; WORLD.neonEyesMat.map = t; WORLD.neonEyesMat.needsUpdate = true; if (old) old.dispose(); }
function jukeGlass(n, on) { // a face shows in the jukebox glass
  if (!WORLD.jukeGlassM) { WORLD.jukeGlassM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); var p = mesh(new THREE.PlaneGeometry(0.5, 0.42), WORLD.jukeGlassM, 0, 1.12, 0.36, WORLD.jukebox, false); p.renderOrder = 7; }
  if (on && n) { WORLD.jukeGlassM.map = toTex(horrorCanvas(n), { clamp: true }); WORLD.jukeGlassM.needsUpdate = true; WORLD.jukeGlassM.opacity = 0.55; } else WORLD.jukeGlassM.opacity = 0;
}
// ---- jumpscare ----------------------------------------------------------------------------
var JS = { on: false };
function jumpscare(n, opt) {
  if (JS.on || GAME.mode === 'dead') return;
  opt = opt || {}; JS = { on: true, t: 0, n: n || 1, P: opt.person || null, mild: SAVE.settings.scare === 'MILD' };
  GAME.mode = 'dead'; GAME.deathAt = GAME.min;
  stopVoice(); talkCancel(); hideChoices(); closeDocs(true); if (MINI.active) { MINI.active = false; U.mini.classList.add('hide'); }
  jukeStop(0.05); stopMusic(0.05);
  setMain(null); setGameHUD(false);
  LSTATE.flick = 3; LSTATE.coldT = 1;
  PU.tFace.value = faceTexture(JS.n);
  var im = FACE_IMG[JS.n]; PU.uFaceAsp.value.set(im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1.2, 1);
  if (JS.P) {
    if (!JS.P.horror) attachHorror(JS.P, JS.n); JS.P.lookAtCam = true; JS.P.odd = 1; setLayer(JS.P.root, 0); JS.P.root.traverse(function (m) { m.layers.enable(LAYER_REAL_ONLY); });
    // snap the view onto them so the 3D face and the picture are the same face
    var hp = new THREE.Vector3(); JS.P.parts.head.getWorldPosition(hp);
    var cp = RENDER.camera.position.clone(); CAM.override = { pos: cp, target: hp.clone(), k: 0, dur: 0.18 }; JS.track = hp;
  }
  sfx('stinger', null, { vol: JS.mild ? 0.5 : 1 });
  // skip button (after ~1s)
  JS.skip = el('button', 'mb pe skipbtn hidden', icon('skip', 30) + '<span class="tx"><span class="en">SKIP</span><span class="ja">スキップ</span></span>', UI);
  JS.skip.style.cssText = 'position:absolute;right:20px;bottom:calc(env(safe-area-inset-bottom,0px) + 24px);min-width:150px;';
  pressFX(JS.skip); onTap(JS.skip, function () { endJumpscare(); });
  setTimeout(function () { if (JS.skip) JS.skip.classList.remove('hidden'); }, 1000);
  SAVE.deaths = (SAVE.deaths || 0) + 1; writeSave();
}
function updateJumpscare(dt) {
  if (!JS.on) return; JS.t += dt; var t = JS.t, mild = JS.mild;
  if (JS.P) {
    revealHorror(JS.P, Math.min(1, t / 0.25));
    if (t < 0.55) { // lunge toward the camera
      var cam = RENDER.camera.position, hp = new THREE.Vector3(); JS.P.parts.head.getWorldPosition(hp);
      var dir = cam.clone().sub(hp); var dist = dir.length(); if (dist > 0.35) { dir.multiplyScalar(Math.min(1, dt * 7)); JS.P.root.position.add(dir); }
      setPose(JS.P, 'lunge'); JS.P.parts.head.lookAt(cam);
    }
    if (CAM.override && JS.track) { JS.P.parts.head.getWorldPosition(JS.track); CAM.override.target.copy(JS.track); }
  }
  if (t > (JS.P ? 0.42 : 0.15) && !JS.hit) { JS.hit = true; sfx('scream', null, { vol: 1 }); CAM.shake = mild ? 0.6 : 1.6; PU.uFlash.value = mild ? 0.15 : 0.5; }
  if (JS.hit) {
    var k = t - (JS.P ? 0.42 : 0.15);
    PU.uFace.value = Math.min(1, k * 8); PU.uFaceZoom.value = mild ? 1.05 + k * 0.08 : 1.15 + k * 0.35 + Math.sin(k * 40) * 0.02;
    PU.uFaceShake.value.set((Math.random() - 0.5) * (mild ? 0.005 : 0.03), (Math.random() - 0.5) * (mild ? 0.005 : 0.03));
    PU.uGlitch.value = mild ? 0.2 : 0.5 + Math.random() * 0.5; PU.uInvert.value = !mild && Math.random() < 0.06 ? 1 : 0;
    PU.uFlash.value = damp(PU.uFlash.value, 0, 6, dt); PU.uRed.value = 0.3;
    if (k > (mild ? 1.6 : 2.4)) endJumpscare();
  }
}
function endJumpscare() {
  if (!JS.on || JS.ending) return; JS.ending = true;
  PU.uBlack.value = 1;
  setTimeout(function () {
    PU.uFace.value = 0; PU.uGlitch.value = 0; PU.uInvert.value = 0; PU.uRed.value = 0; PU.uFlash.value = 0; PU.uFaceShake.value.set(0, 0);
    if (JS.skip && JS.skip.parentNode) JS.skip.parentNode.removeChild(JS.skip);
    JS.on = false;
    gameOver();
  }, 250);
}


// ===== 19_lore.js =====
// ---- lore: clippings, flyers, polaroids, receipts, diary scraps -----------------------
var LORE = [
  { id: 'l01', y: 1958, t: 'Opening day photo', ja: '開店の日の写真', kind: 'polaroid', make: function () { return docPolaroid(photoCanvas('diner', 320, 240, 1), 'Opening day! June \'58', '「開店の日！ 1958年6月」 ハル、ジューン、そして小さなデイジー'); } },
  { id: 'l02', y: 1961, t: 'KXDR commercial', ja: 'テレビCMの記事', kind: 'news', make: function () { return docNews({ date: 'Thursday, March 9, 1961 — Five Cents', head: 'Diner Jingle Is Talk Of The Valley', img: photoCanvas('diner', 320, 180, 2), body: ['The cheerful KXDR spot for the Sunny Side Diner on Highway 9 — featuring a smiling egg in a chef\'s hat — has become the most requested commercial of the season.', '"Our daughter drew him," said owner June Mercer. "Rise and shine, that\'s his catchphrase."'], ja: '1961年3月9日。ハイウェイ9号線のサニーサイド・ダイナーのCMが大人気。コック帽の笑う卵は、店主ジューン・マーサーの娘が描いたもの。「口ぐせは Rise and shine」。' }); } },
  { id: 'l03', y: 1958, t: 'Daisy\'s drawing', ja: 'デイジーの絵', kind: 'drawing', make: function () { var c = mkCanvas(340, 300), g = c.getContext('2d'); g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, 340, 300); drawSunny(g, 170, 140, 70, { line: true, ink: '#d23', scribble: 3 }); g.font = '26px ' + F.hand; g.fillStyle = '#2244aa'; g.fillText('SUNNY by Daisy age 6', 40, 280); return docPolaroid(c.toDataURL(), 'SUNNY — by Daisy, age 6', 'デイジー（6歳）が描いた Sunny。ここから全部はじまった。'); } },
  { id: 'l04', y: 1964, t: 'Girl missing after sandstorm', ja: '砂嵐の夜の行方不明', kind: 'news', make: function () { return docNews({ date: 'Saturday, August 22, 1964', head: 'Girl, 12, Missing After Desert Sandstorm', img: photoCanvas('girl', 260, 220, 4), body: ['Daisy Mercer, 12, daughter of the Sunny Side Diner owners, disappeared from the diner\'s parking lot during Friday night\'s storm.', 'A trucker told deputies he saw the girl "waving at a man in the egg costume" moments before the dust rolled in. The diner owns no such costume.'], ja: '1964年8月22日。店主の娘デイジー（12歳）が砂嵐の夜、駐車場から消えた。トラック運転手は「卵の着ぐるみの男に手を振っていた」と証言。だが店にそんな着ぐるみはない。' }); } },
  { id: 'l05', y: 1964, t: 'MISSING: Daisy Mercer', ja: '行方不明のチラシ（デイジー）', kind: 'flyer', make: function () { return docFlyer({ img: photoCanvas('girl', 260, 260, 5), body: ['DAISY MERCER', 'Age 12 · Brown hair · Yellow dress', 'Last seen Aug 21, 1964 — Sunny Side Diner, Hwy 9', 'If found, leave the light on.'], ja: 'デイジー・マーサー 12歳。黄色いワンピース。1964年8月21日、サニーサイド・ダイナーで最後に目撃。「見つけたら、明かりをつけておいて」。' }); } },
  { id: 'l06', y: 1965, t: 'Hal\'s note', ja: 'ハルのメモ', kind: 'diary', make: function () { return docDiary('Jan 1965.<br>From tonight we don\'t close. Not for holidays, not for storms. The sign stays lit so she can find her way home. June says I\'m crazy. June leaves the porch light on too.', '1965年1月。今夜から店は閉めない。祝日も嵐でも。娘が帰り道を見つけられるよう、看板は消さない。ジューンはおれをおかしいと言う。でも彼女も玄関の明かりを消さない。'); } },
  { id: 'l07', y: 1972, t: 'MISSING: Tom Reyes', ja: '行方不明のチラシ（トム）', kind: 'flyer', make: function () { return docFlyer({ img: photoCanvas('man', 260, 260, 7), body: ['TOM REYES', 'Age 34 · Long-haul trucker', 'Truck found running at the Sunny Side Diner lot, Oct 1972.', 'Coffee on the counter was still warm.'], ja: 'トム・レイエス 34歳、長距離運転手。1972年10月、トラックはエンジンがかかったまま駐車場で見つかった。カウンターのコーヒーはまだ温かかった。' }); } },
  { id: 'l08', y: 1977, t: 'MISSING: Linda Faye', ja: '行方不明のチラシ（リンダ）', kind: 'flyer', make: function () { return docFlyer({ img: photoCanvas('woman', 260, 260, 8), body: ['LINDA FAYE', 'Singer · 26 · Red coat', 'Stopped for pie on her way to Vegas. Never arrived.', 'The jukebox was playing her song.'], ja: 'リンダ・フェイ 歌手 26歳。ラスベガスへ行く途中にパイを食べに寄り、それきり。ジュークボックスでは彼女の曲がかかっていた。' }); } },
  { id: 'l09', y: 1979, t: 'Owner vanishes', ja: '店主が消えた', kind: 'news', make: function () { return docNews({ date: 'Saturday, November 24, 1979', head: 'Diner Owner Vanishes Mid-Shift; "Griddle Still On"', img: photoCanvas('night', 320, 180, 9), body: ['Hal Mercer, 51, was not found when deputies answered a call from his wife at dawn. The griddle was hot. Eleven plates were set at the counter, each with a fried egg, sunny side up.', 'Mrs. Mercer has refused to close the diner.'], ja: '1979年11月24日。店主ハル・マーサーが夜勤中に消えた。鉄板は熱いまま、カウンターには目玉焼きをのせた皿が11枚並んでいた。妻は店を閉めることを拒んでいる。' }); } },
  { id: 'l10', y: 1979, t: 'Receipt, Nov 23 1979', ja: '1979年11月23日のレシート', kind: 'receipt', make: function () { return docReceipt('<div class="c big">SUNNY SIDE DINER</div><div class="c">HWY 9 · OPEN 24 HRS</div><hr><div class="r"><span>11/23/79</span><span>03:00 AM</span></div><div class="r"><span>TABLE</span><span>BOOTH 4</span></div><hr>' + ['TOM', 'LINDA', 'DAISY', '????', '????', '????', '????', '????', '????', '????', 'HAL'].map(function (n) { return '<div class="r"><span>EGG S/S (' + n + ')</span><span>0.00</span></div>'; }).join('') + '<hr><div class="r big"><span>TOTAL</span><span>0.00</span></div><div class="c">RISE AND SHINE!</div><div class="jp" style="margin-top:10px;font:500 11px/1.5 \'Zen Kaku Gothic New\'">1979年11月23日 午前3時、4番席。目玉焼き11皿。名前の中には、消えた人たちがいる。</div>', false); } },
  { id: 'l11', y: 1983, t: 'Help wanted ad', ja: '求人広告', kind: 'news', make: function () { return docNews({ date: 'Classifieds — Monday, June 6, 1983', head: 'NIGHT SHIFT WANTED', body: ['Sunny Side Diner, Hwy 9. No experience needed! Room & board. Must follow simple rules. Ask for June. We\'ll keep the light on for you.'], ja: '1983年6月6日の求人欄。「深夜スタッフ募集・未経験OK。住み込み可。かんたんなルールを守れる方。ジューンまで。明かりをつけて、待っています」' }); } },
  { id: 'l12', y: 1983, t: 'Dale\'s diary — night 5', ja: 'デールの日記（5日目）', kind: 'diary', make: function () { return docDiary('Night 5. June came at dawn and said "Rise and shine." The other one said my name first. I hid like the rules said. June gave me a key and said: <u>you\'re one of us now, Dale.</u>', '5日目。夜明けにジューンが来て「Rise and shine」と言った。その前に来たやつは、おれの名前を呼んだ。ルールどおり隠れた。ジューンは鍵をくれて言った。「これであんたも、うちの人間だよ」'); } },
  { id: 'l13', y: 1987, t: 'Polaroid: the costume', ja: 'ポラロイド：着ぐるみ', kind: 'polaroid', make: function () { return docPolaroid(photoCanvas('costume', 320, 240, 13), 'who is in the suit??', '「着ぐるみの中は、だれ？」 駐車場で撮られた一枚'); } },
  { id: 'l14', y: 1991, t: 'June\'s letter', ja: 'ジューンの手紙', kind: 'diary', make: function () { return docDiary('To whoever works the night: the light isn\'t to bring customers in. It\'s for them — the ones who never left. They come back every night and sit where they sat. Be kind. Serve them only what they ordered when they were alive.', '夜勤のあなたへ。明かりは客を呼ぶためじゃない。帰れなかった人たちのためのもの。あの人たちは毎晩戻ってきて、同じ席に座る。やさしくしてあげて。生きていたころ頼んだものだけを出してあげて。'); } },
  { id: 'l15', y: 2001, t: 'Dale\'s last page', ja: 'デールの最後のページ', kind: 'diary', make: function () { return docDiary('I don\'t sleep anymore. I\'m the voice on the phone now, the one who tells the new kid the rules. Sunny isn\'t a mascot. Sunny is the diner\'s face — the smile it puts on so you\'ll come in. Five nights, and it keeps you. Someone has to keep the light on.', 'もう眠らない。今のおれは電話の声だ。新人にルールを教える係。Sunny はマスコットじゃない。店そのものの顔——中に入ってもらうための笑顔だ。5夜を越えると、店はその人を手放さない。だれかが明かりをつけていなきゃならないんだ。'); } }
];
var LORE_SPOTS = [
  { p: [2.55, 0.785, 4.55], st: ['BOOTHS', 'COUNTER'] }, { p: [-2.55, 1.06, -1.42], st: ['COUNTER'] }, { p: [-7.45, 1.565, 2.8], st: ['JUKEBOX'] },
  { p: [6.95, 1.045, 1.62], st: ['REGISTER'] }, { p: [-4.7, 1.115, -4.88], st: ['KITCHEN', 'BACKDOOR'] }, { p: [7.55, 1.42, -3.55], st: ['FREEZER'] },
  { p: [4.25, 1.06, -1.38], st: ['COUNTER'] }, { p: [-1.6, 0.955, 4.86], st: ['BOOTHS'] }, { p: [5.85, 0.012, 4.35], st: ['DOOR', 'REGISTER'] },
  { p: [-9.4, 0.012, 0.25], st: ['JUKEBOX'] }, { p: [-3.6, 0.785, 4.6], st: ['BOOTHS'] }
];
var LORE_OBJS = [];
var SPARK_TEX = null;
function sparkTex() { if (SPARK_TEX) return SPARK_TEX; var c = mkCanvas(64, 64), g = c.getContext('2d'); var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 4); g.lineTo(32, 60); g.moveTo(4, 32); g.lineTo(60, 32); g.stroke(); SPARK_TEX = toTex(c, { clamp: true }); return SPARK_TEX; }
function spawnLoreForNight(day) {
  clearLore();
  var have = SAVE.lore || {}, want = LORE.filter(function (l, i) { return !have[l.id] && Math.floor(i / 3) < day; });
  want.sort(function (a, b) { return LORE.indexOf(a) - LORE.indexOf(b); });
  want = want.slice(0, 4);
  var spots = LORE_SPOTS.slice().sort(function () { return Math.random() - 0.5; });
  want.forEach(function (L, i) {
    var s = spots[i], g = new THREE.Group(); g.position.set(s.p[0], s.p[1], s.p[2]);
    var c = mkCanvas(64, 64), cg = c.getContext('2d'); cg.fillStyle = L.kind === 'news' ? '#d9cfb4' : L.kind === 'polaroid' ? '#f5f2ea' : L.kind === 'receipt' ? '#f2f0ea' : '#efe4c8'; cg.fillRect(0, 0, 64, 64); cg.fillStyle = 'rgba(40,40,40,0.5)'; for (var k = 0; k < 7; k++) cg.fillRect(8, 10 + k * 7, 30 + Math.random() * 18, 2); if (L.kind === 'polaroid') { cg.fillStyle = '#555'; cg.fillRect(6, 6, 52, 40); }
    var pm = mesh(new THREE.PlaneGeometry(0.14, 0.11), new THREE.MeshStandardMaterial({ map: toTex(c, { clamp: true }), roughness: 0.8, side: THREE.DoubleSide }), 0, 0.004, 0, g, false); pm.rotation.x = -PI / 2; pm.rotation.z = Math.random() * 3;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex(), color: new THREE.Color(2, 1.9, 1.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(0.12, 0.12, 1); sp.position.y = 0.04; g.add(sp); g.userData.spark = sp;
    var hit = mesh(new THREE.BoxGeometry(0.4, 0.25, 0.4), new THREE.MeshBasicMaterial({ visible: false }), 0, 0.08, 0, g, false);
    RENDER.scene.add(g); LORE_OBJS.push(g);
    addPick(hit, function () { pickLore(L, g); }, { stations: s.st.concat(s.p[2] < -2.8 && s.p[0] > 5 ? ['FREEZER'] : []) });
  });
}
function clearLore() { LORE_OBJS.forEach(function (g) { g.traverse(function (o) { removePick(o); }); RENDER.scene.remove(g); }); LORE_OBJS = []; }
function updateLore(dt, t) { LORE_OBJS.forEach(function (g, i) { var s = g.userData.spark; if (s) { var k = Math.max(0, Math.sin(t * 2.2 + i * 1.7)); s.material.opacity = 0.15 + Math.pow(k, 6) * 0.85; s.scale.setScalar(0.06 + Math.pow(k, 6) * 0.1); } }); }
function pickLore(L, g) {
  if (MINI.active || TALK.busy) return;
  var i = LORE_OBJS.indexOf(g); if (i >= 0) LORE_OBJS.splice(i, 1); g.traverse(function (o) { removePick(o); }); RENDER.scene.remove(g);
  giveLore(L.id);
}
function giveLore(id) {
  var L = LORE.filter(function (l) { return l.id === id; })[0];
  if (!L) { L = LORE.filter(function (l) { return !SAVE.lore[l.id]; })[0]; if (!L) return; }
  var isNew = !SAVE.lore[L.id]; SAVE.lore[L.id] = 1; writeSave();
  GAME.paused = true;
  openDocs(L.make() + '<div class="doccap">' + L.y + ' · ' + L.t.toUpperCase() + ' — ' + L.ja + (isNew ? '<br>NEW RECORD ADDED TO THE ARCHIVE / 記録に追加' : '') + ' (' + loreCount() + '/15)</div>', { onClose: function () { GAME.paused = false; } });
}
function loreCount() { var n = 0; LORE.forEach(function (l) { if (SAVE.lore[l.id]) n++; }); return n; }


// ===== 20_game.js =====
// ---- the shift: clock, schedule, stations, freezer, switches, calls, map, end states ----
var GAME = { mode: 'boot', day: 1, min: 0, rate: 60 / 135, tips: 0, sales: 0, served: 0, angry: 0, refusedNormal: 0, resolved: 0, callsLeft: 2, sched: [], usedFaces: {}, paused: false };
var SHIFT_LEN = 480; // 22:00 -> 06:00
function newGameState(day) {
  GAME = { mode: 'play', day: day, min: 0, rate: 60 / 135, tips: 0, sales: 0, served: 0, angry: 0, refusedNormal: 0, resolved: 0, callsLeft: 2, sched: [], usedFaces: {}, paused: false, inAnomaly: 0, lightsSwitched: 0, cold: 0 };
  GAME.oddFail = function (C) { anomalyFail(C.anomaly, C.anomaly ? C.anomaly.face : pickFace(['human']), { person: C.P, rule: 'offmenu' }); };
}
function clearWorld() {
  CUSTS.slice().forEach(function (C) { removeCustomer(C); }); CUSTS.length = 0;
  TICKETS.slice().forEach(function (T) { removeTicket(T); }); TICKETS.length = 0;
  ACTIVE.slice().forEach(function (A) { if (A.cleanup) try { A.cleanup(A); } catch (e) {} if (A.def && A.def.cleanup) try { A.def.cleanup(A); } catch (e) {} }); ACTIVE.length = 0;
  SEATS.forEach(function (s) { s.taken = null; });
  if (FX.visitor) { FX.visitor.state = 'idle'; FX.visitor.obj.visible = false; }
  LSTATE.lightsOn = true; LSTATE.neonOn = true; LSTATE.coldT = 0; LSTATE.cold = 0; LSTATE.flick = 0; LSTATE.eyesExtra = 1; LSTATE.kitchenFlick = false;
  setNeonEyes(0, null); jukeGlass(0, false);
  WORLD.backDoor.rotation.y = 0; CAM.inFreezer = false; CAM.outside = false; WORLD.freezerDoor.rotation.y = 0;
  FX.rainT = 0; FX.rain = 0;
  PU.uFace.value = 0; PU.uBlack.value = 0; PU.uCold = PU.uCold; PU.uFear.value = 0;
  JS.on = false;
}
// ---- schedule ----------------------------------------------------------------------------
function buildSchedule(day) {
  var S = [], rnd = R, t = 4;
  // regular customers: busy early, sparse late
  while (t < SHIFT_LEN - 25) {
    S.push({ at: t, type: 'cust' });
    t += t < 150 ? rnd.range(9, 16) - Math.min(4, day) : rnd.range(30, 48);
  }
  // anomalies
  var pool = rulesForDay(day).map(function (r) { return r.id; }).filter(function (id) { return id !== 'dayshift'; });
  var n = Math.min(DAY_ANOM[day], pool.length), pick = [];
  if (day >= 2 && pool.indexOf('booth4') >= 0 && rnd() < 0.85) pick.push('booth4');
  if (pool.indexOf('phone') >= 0 && (day === 1 || rnd() < 0.6)) pick.push('phone');
  var rest = pool.filter(function (id) { return pick.indexOf(id) < 0; }); R.shuffle(rest);
  if (day === 1) rest = rest.filter(function (id) { return id !== 'faceless' || true; });
  while (pick.length < n && rest.length) pick.push(rest.shift());
  var slots = [], s0 = 62 + rnd.range(0, 15);
  var others = pick.filter(function (id) { return id !== 'booth4' && id !== 'phone'; });
  var gap = (430 - s0) / Math.max(1, others.length);
  others.forEach(function (id, i) { slots.push({ at: s0 + gap * i + rnd.range(0, gap * 0.5), type: 'anom', id: id }); });
  if (pick.indexOf('booth4') >= 0) slots.push({ at: 300 + rnd.range(-12, 8), type: 'anom', id: 'booth4' });
  if (pick.indexOf('phone') >= 0) slots.push({ at: rnd.range(70, 140), type: 'anom', id: 'phone' });
  if (day === 5) slots.push({ at: 452, type: 'anom', id: 'dayshift' });
  // keep anomalies apart from each other
  slots.sort(function (a, b) { return a.at - b.at; });
  for (var i = 1; i < slots.length; i++) if (slots[i].id !== 'phone' && slots[i - 1].id !== 'phone' && slots[i].at - slots[i - 1].at < 30) slots[i].at = slots[i - 1].at + 30;
  S = S.concat(slots);
  // atmosphere beats
  S.push({ at: 180, type: 'midnight1' }); // 1:00 the jukebox skips to the late record
  S.push({ at: 200 + rnd.range(0, 40), type: 'rain' });
  for (var k = 0; k < 2 + day; k++) S.push({ at: rnd.range(150, 460), type: 'scare' });
  S.push({ at: rnd.range(240, 420), type: 'thunder' });
  S.sort(function (a, b) { return a.at - b.at; });
  return S;
}
function runSchedule() {
  while (GAME.sched.length && GAME.sched[0].at <= GAME.min) {
    var e = GAME.sched.shift();
    if (e.type === 'cust') {
      var live = CUSTS.filter(function (c) { return c.state !== 'gone' && c.state !== 'leaving'; }).length;
      if (live >= (GAME.min < 150 ? 4 : 3) || GAME.inAnomaly > 1) { e.at += 6; GAME.sched.push(e); GAME.sched.sort(function (a, b) { return a.at - b.at; }); continue; }
      var arch = pickArch();
      if (FX.visitor.state === 'idle' && Math.random() < 0.6) visitorArrive({ onPark: function () { setTimeout(visitorLeaveLater, 3000); } });
      var C = spawnCustomer(arch, { kid: arch.kid });
      GAME.lastCust = C;
    } else if (e.type === 'anom') { if (GAME.inAnomaly && e.id !== 'phone') { e.at += 12; GAME.sched.push(e); GAME.sched.sort(function (a, b) { return a.at - b.at; }); continue; } var A = makeAnomaly(e.id, e.at); bindAnomaly(A); startAnomaly(A); }
    else if (e.type === 'midnight1') { if (!GAME.inAnomaly && JUKE.key === 'boogie') jukeSkipTo('warped', 'B3 Last Call'); JUKE.label = 'B3 Last Call'; LSTATE.coldT = Math.max(LSTATE.coldT, 0.2); toast('1:00 AM — the jukebox skips to another record: B3 "Last Call"', '午前1時。ジュークボックスがB3「Last Call」に変わった', 3.4); }
    else if (e.type === 'rain') { FX.rainT = 0.55 + GAME.day * 0.09; sfx('thunder', null, { vol: 0.5 }); }
    else if (e.type === 'thunder') { sfx('thunder'); PU.uFlash.value = 0.25; setTimeout(function () { PU.uFlash.value = 0; }, 90); }
    else if (e.type === 'scare') ambientScare();
  }
}
function visitorLeaveLater() { setTimeout(function () { if (FX.visitor.state === 'parked' && !FX.visitor.high) visitorLeave(); }, 25000 + Math.random() * 30000); }
var ARCH_BAG = [];
function pickArch() { if (!ARCH_BAG.length) ARCH_BAG = R.shuffle(ARCH.slice()); var a = ARCH_BAG.shift(); if (CUSTS.some(function (c) { return c.arch === a; })) a = ARCH_BAG.shift() || ARCH[0]; return a; }
function bindAnomaly(A) {
  var d = A.def;
  A.hint = d.hint;
  if (A.id === 'faceless') {
    A.onServe = function (C, what) { lungeFail(A, C); return true; };
    A.onRefuse = function (C, how) { anomalyResolve(A); return false; };
    A.onIgnore = function (C) { toast('It keeps breathing at you.', 'それはこちらに向かって息をしている。', 2); return true; };
  } else if (A.id === 'offmenu') {
    A.onRefuse = function (C, how) { if (how === 'odd') { custSay(C, '...Not on the menu.', '……メニューに、ない。', { odd: true }); setTimeout(function () { anomalyResolve(A); customerLeave(C); }, 1800); return true; } anomalyResolve(A); return false; };
  } else if (A.id === 'doppel') {
    A.onServe = function (C) { lungeFail(A, C); return true; };
    A.onRefuse = function () { anomalyResolve(A); return false; };
    A.onIgnore = function (C) { anomalyResolve(A); C.P.lookAtCam = true; setTimeout(function () { customerLeave(C); }, 1500); return true; };
  } else if (A.id === 'reflection') {
    A.onTap = function (C) { lungeFail(A, C); return true; };
  }
}
// ---- ambient scares (no rule; tension) ------------------------------------------------------
function ambientScare() {
  if (GAME.mode !== 'play' || JS.on) return;
  var r = Math.random(), st = CAM.station;
  if (r < 0.3) { sfx('steps', new THREE.Vector3(-9.6, 0.2, 0.2), { n: 4, vol: 0.9 }); }
  else if (r < 0.5) { distantFigure(['shadow', 'crawler'], st === 'DOOR' || st === 'BOOTHS' ? new THREE.Vector3(-6 + Math.random() * 10, 1.1, 22 + Math.random() * 6) : new THREE.Vector3(-9.9, 1.2, 0.2), 1.6); }
  else if (r < 0.65) { sfx('freezerBang', new THREE.Vector3(6.5, 1.2, -4)); }
  else if (r < 0.8) { tvGlitch(1.2); }
  else { sfx('coyote'); }
}
function distantFigure(kinds, pos, dur) {
  var n = pickFace(kinds, 'far'), tex = toTex(horrorCanvas(n), { clamp: true });
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x6a6a72, transparent: true, opacity: 0, depthWrite: false }));
  sp.scale.set(1.3, 1.6, 1); sp.position.copy(pos); RENDER.scene.add(sp);
  var t0 = performance.now(), D2 = (dur || 1.5) * 1000;
  var step = function () { var k = (performance.now() - t0) / D2; sp.material.opacity = Math.sin(clamp(k, 0, 1) * PI) * 0.75; if (k < 1) requestAnimationFrame(step); else { RENDER.scene.remove(sp); tex.dispose(); } };
  requestAnimationFrame(step);
}
// ---- the TV over the back bar -----------------------------------------------------------------
var TV = { t: 0, glitch: 0, mode: 'show', ad: 0 };
function tvGlitch(sec) { TV.glitch = sec; TV.face = pickFace(['glitch'], 'tv'); sfx('static', new THREE.Vector3(-3.5, 2.05, -2.45), { len: sec }); }
function drawTV(dt) {
  if (!WORLD.tvCanvas || TV.mode === 'cm' || TV.mode === 'live') return;
  TV.t += dt; if (RENDER.frame % 3) return;
  var c = WORLD.tvCanvas, g = c.getContext('2d'), w = c.width, h = c.height, t = TV.t;
  if (TV.glitch > 0) {
    TV.glitch -= dt * 3; var id = g.createImageData(w, h), d = id.data; for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } g.putImageData(id, 0, 0);
    var im = FACE_IMG[TV.face]; if (im && im.naturalWidth && Math.random() < 0.6) { g.globalAlpha = 0.7; g.drawImage(im, 20, 10, w - 40, h - 20); g.globalAlpha = 1; }
  } else if (GAME.min > 180 && GAME.mode === 'play') { // late: late-night test pattern & weather
    g.fillStyle = '#101418'; g.fillRect(0, 0, w, h);
    var bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']; bars.forEach(function (b, i) { g.fillStyle = b; g.globalAlpha = 0.65; g.fillRect(i * w / 7, 0, w / 7 + 1, h * 0.62); });
    g.globalAlpha = 1; g.fillStyle = '#111'; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#e8e8e8'; g.font = '18px ' + F.ui; g.textAlign = 'center'; g.fillText('KXDR — FLASH FLOOD WATCH', w / 2, h * 0.75); g.font = '14px ' + F.ui; g.fillText('STAY INDOORS · KEEP YOUR LIGHTS ON', w / 2, h * 0.88);
  } else { // early: old Sunny cartoon
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f4a04a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.55); g.rotate(t * 0.3); for (var r = 0; r < 12; r++) { g.fillStyle = r % 2 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 220, r / 12 * TAU, (r + 0.5) / 12 * TAU); g.fill(); } g.restore();
    drawSunny(g, w / 2, h * 0.5 + Math.sin(t * 5) * 6, 46, { wave: 0.4 + Math.sin(t * 6) * 0.5, look: Math.sin(t) * 0.5 });
    g.fillStyle = '#c8282e'; g.font = '22px ' + F.logo; g.textAlign = 'center'; g.fillText('Rise and shine!', w / 2, 30);
  }
  // CRT: scanlines + vignette
  g.fillStyle = 'rgba(0,0,0,0.18)'; for (var y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  var vg = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  WORLD.tvTex.needsUpdate = true;
}
// ---- Sunny gets stranger each night (props) -----------------------------------------------------
function sunnyProgress(day) {
  // exterior sign face, coloring page on a booth table, costume in the lot
  WORLD.exSunnyMat.map = toTex(sunnyCanvas(512, { wave: 0.6, mood: day >= 5 ? 'grin' : day >= 4 ? 'stare' : 'happy', look: day >= 3 ? -0.6 : 0 }), { clamp: true }); WORLD.exSunnyMat.needsUpdate = true;
  if (WORLD.coloring) { RENDER.scene.remove(WORLD.coloring); WORLD.coloring = null; }
  var c = mkCanvas(256, 340), g = c.getContext('2d'); g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, 256, 340); g.fillStyle = '#c8282e'; g.font = '22px ' + F.slab; g.textAlign = 'center'; g.fillText('KIDS MENU', 128, 34); g.font = '15px ' + F.ui; g.fillStyle = '#333'; g.fillText('Color me in!', 128, 56);
  drawSunny(g, 128, 180, 80, { line: true, mood: day >= 4 ? 'hollow' : 'happy', scribble: day >= 3 ? 7 + day : 0 });
  if (day >= 4) { g.fillStyle = '#a01018'; g.font = '20px ' + F.hand; g.fillText((SAVE.name || 'YOU') + ' STAY', 128, 320); }
  var m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.28), new THREE.MeshStandardMaterial({ map: toTex(c, { clamp: true }), roughness: 0.85 })); m.rotation.x = -PI / 2; m.rotation.z = 0.3; m.position.set(D.booths[1] - 0.05, 0.783, 4.45); RENDER.scene.add(m); WORLD.coloring = m;
  if (WORLD.costume) { RENDER.scene.remove(WORLD.costume); WORLD.costume = null; }
  if (day >= 3) {
    var n = pickFace(['costume', 'plush'], 'lot'), tex = toTex(sunnyCostumeCanvas(day, n), { clamp: true });
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x8a8a90, transparent: true, depthWrite: false })); sp.scale.set(1.2, 2.0, 1); sp.position.set(-5.5 + Math.random() * 3, 1.0, 17 + Math.random() * 4); RENDER.scene.add(sp); WORLD.costume = sp;
  }
}
function sunnyCostumeCanvas(day, n) { // a person-sized Sunny suit standing in the dark
  var c = mkCanvas(256, 420), g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 256, 420);
  g.fillStyle = '#2a2a2a'; g.fillRect(96, 250, 26, 150); g.fillRect(134, 250, 26, 150);
  drawSunny(g, 128, 170, 92, { mood: day >= 5 ? 'grin' : 'stare', wave: -0.6 });
  var gr = g.createLinearGradient(0, 0, 0, 420); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(0, 0, 256, 420);
  return c;
}
// ---- stations: arrival hooks, main button ----------------------------------------------------------
function onArrive(st) {
  setSpace(st === 'KITCHEN' || st === 'BACKDOOR' ? 'kitchen' : st === 'FREEZER' ? 'kitchen' : st === 'JUKEBOX' ? 'diner' : 'diner');
  WORLD.lights.fill.intensity = st === 'BACKDOOR' ? 6 : 0;
  if (st === 'BACKDOOR') WORLD.lights.fill.position.set(-2.0, 2.4, -4.3);
  updateMainButton(); refreshTickets();
}
function updateMainButton() {
  if (!U.main) return;
  if (GAME.mode !== 'play') { setMain(null); return; }
  if (MINI.active) { setMain(MINI.main || null); return; }
  var trap = ACTIVE.filter(function (A) { return A.trap; })[0]; if (trap) { setMain(trap.trap); return; }
  var st = CAM.station, a = null;
  if (CAM.inFreezer) a = { icon: 'door', en: 'COME OUT', ja: '冷凍庫から出る', fn: leaveFreezer };
  else if (CAM.outside) a = { icon: 'back', en: 'GO BACK INSIDE', ja: '店にもどる', fn: comeInside };
  else if (st === 'KITCHEN') { var t = TICKETS.filter(function (T) { return !T.ready; })[0]; if (t) a = { icon: 'ticket', en: 'NEXT TICKET', ja: '次の伝票を作る', fn: function () { tapTicket(t); } }; }
  else if (st === 'FREEZER') a = { icon: 'snow', en: 'HIDE INSIDE', ja: '冷凍庫に隠れる', fn: enterFreezer };
  else if (st === 'REGISTER') a = { icon: 'bulb', en: 'SWITCHES', ja: '照明・ネオン・店長に電話', fn: registerMenu };
  else if (st === 'JUKEBOX') { var ph = ACTIVE.filter(function (A) { return A.id === 'phone' && A.ringing; })[0]; a = ph ? { icon: 'phone', en: 'ANSWER THE PHONE', ja: 'ピンクの電話に出る', glow: true, fn: function () { ANOM.phone.answer(ph); } } : { icon: 'record', en: 'CHOOSE A RECORD', ja: 'レコードを選ぶ', fn: jukeMenu }; }
  else if (st === 'BACKDOOR') a = { icon: 'exit', en: 'OPEN THE BACK DOOR', ja: '裏口を開ける', fn: backDoorMenu };
  else if (st === 'DOOR') { var ds = ACTIVE.filter(function (A) { return A.id === 'dayshift' && (A.stage === 1 || A.stage === 2); })[0]; if (ds) a = { icon: 'door', en: 'UNLOCK THE DOOR', ja: '入口の鍵を開ける', glow: true, fn: function () { ANOM.dayshift.openFront(ds); } }; }
  setMain(a);
}
function registerMenu() {
  var o = [
    { icon: 'bulb', en: LSTATE.lightsOn ? 'Lights OFF' : 'Lights ON', ja: LSTATE.lightsOn ? '照明を消す' : '照明をつける', fn: function () { toggleLights(); } },
    { icon: 'sign', en: LSTATE.neonOn ? 'Neon OFF' : 'Neon ON', ja: LSTATE.neonOn ? 'ネオンを消す' : 'ネオンをつける', fn: function () { toggleNeon(); } },
    { icon: 'manager', en: 'Call Dale (manager) — ' + GAME.callsLeft + ' left', ja: '店長に電話（あと' + GAME.callsLeft + '回）', dim: GAME.callsLeft <= 0, fn: callManager }
  ];
  showChoices('Register', o, { table: 'REGISTER' });
}
function toggleLights() { LSTATE.lightsOn = !LSTATE.lightsOn; sfx('switch', new THREE.Vector3(7.9, 1.4, 0.9)); WORLD.switches[0].rotation.x = LSTATE.lightsOn ? 0 : 0.6; GAME.blackout = !LSTATE.lightsOn; if (!LSTATE.lightsOn) { jukeStop(0.3); LSTATE.jukeOff = true; } else { LSTATE.jukeOff = false; if (!GAME.inAnomaly) setTimeout(function () { if (!JUKE.key && LSTATE.lightsOn) jukePlay(GAME.min > 180 ? 'warped' : 'boogie', { label: GAME.min > 180 ? 'B3 Last Call' : 'A1 Diner Boogie' }); }, 1500); } updateMainButton(); }
function toggleNeon() { LSTATE.neonOn = !LSTATE.neonOn; GAME.neonOff = !LSTATE.neonOn; sfx('switch', new THREE.Vector3(7.9, 1.4, 0.9)); WORLD.switches[1].rotation.x = LSTATE.neonOn ? 0 : 0.6; if (!LSTATE.neonOn) sfx('zap', new THREE.Vector3(1.5, 2.5, -2.6), { vol: 0.5 }); }
function callManager() {
  if (GAME.callsLeft <= 0) return; GAME.callsLeft--;
  var A = ACTIVE[0], hint = A ? anomalyHint(A.id) : ['Quiet night? Good. Keep the coffee hot and the rules close.', '静かな夜？ いいことだ。コーヒーは熱く、ルールはそばに。'];
  sfx('handset', new THREE.Vector3(7.0, 1.1, 1.65)); sfx('dialtone', null, { len: 0.8, delay: 0.2 });
  var odd = GAME.day >= 3, weird = GAME.day >= 4;
  GAME.paused = true;
  setTimeout(function () {
    talk([['DALE', weird ? 'Yeah. ...Yeah. I know who this is.' : 'Sunny Side, this is Dale.', weird ? 'ああ。……ああ。だれだか知ってるよ。' : 'サニーサイド、デールだ。', { voice: 'manager', odd: odd, rate: weird ? 0.85 : 1 }],
      ['DALE', hint[0], hint[1], { voice: 'manager', odd: weird, pitch: weird ? 0.85 : 1 }],
      weird ? ['DALE', 'Don\'t let the light go out. I\'m still in here.', '明かりを消すなよ。おれはまだ、ここにいる。', { voice: 'odd', odd: true, cls: 'odd' }] : function () { },
      function () { phoneLineStop(); sfx('handset'); GAME.paused = false; }]);
  }, 1300);
}
var RECORDS = [['A1 Diner Boogie', 'boogie'], ['A2 Highway Moon', null], ['A3 Rise & Shine', null], ['B1 Desert Rain', null], ['B2 Neon Heart', null], ['B3 Last Call', 'warped']];
function jukeMenu() {
  var A = ACTIVE.filter(function (x) { return x.id === 'jukebox'; })[0];
  var now = JUKE.label || '—';
  showChoices('Now playing: ' + now, RECORDS.map(function (r) {
    return { icon: 'record', en: r[0], ja: r[1] ? (r[1] === 'boogie' ? 'ダイナー・ブギ' : 'ラスト・コール') : '（このレコードは傷だらけ）', fn: function () {
      if (A) { ANOM.jukebox.choose(A, r[0]); return; }
      if (!r[1]) { sfx('needle', WORLD.jukeboxPos); toast('That record is too scratched to play.', 'このレコードは傷だらけでかからない。', 2); return; }
      sfx('needle', WORLD.jukeboxPos); jukePlay(r[1], { label: r[0] }); JUKE.label = r[0];
    } };
  }), { table: 'JUKEBOX' });
}
function backDoorMenu() {
  var A = ACTIVE.filter(function (x) { return x.id === 'backdoor'; })[0];
  showChoices('The back door', [
    { icon: 'exit', en: 'Open it', ja: '開ける', warn: !!A, fn: function () { if (A) ANOM.backdoor.open(A); else stepOutside(); } }
  ], { table: 'BACK DOOR' });
}
function stepOutside() {
  sfx('door', new THREE.Vector3(-2.6, 1.2, -5.2)); WORLD.backDoor.rotation.y = -1.1; CAM.outside = true; setSpace('outside');
  closeShot(new THREE.Vector3(-2.6, 1.62, -6.4), new THREE.Vector3(-1.0, 1.0, -7.5), 1.0);
  updateMainButton();
  if (GAME.min > 120 && Math.random() < 0.25 + GAME.day * 0.05) { setTimeout(function () { if (CAM.outside && GAME.mode === 'play') { GAME.failRule = 'outside'; jumpscare(pickFace(['animal']), {}); } }, 3500 + Math.random() * 3000); }
  else if (!SAVE.lore.l13 && GAME.day >= 3) setTimeout(function () { if (CAM.outside) giveLore('l13'); }, 1500);
}
function comeInside() { CAM.outside = false; releaseShot(0.8); setTimeout(function () { WORLD.backDoor.rotation.y = 0; sfx('door', new THREE.Vector3(-2.6, 1.2, -5.2)); setSpace('kitchen'); }, 800); updateMainButton(); }
// ---- freezer ---------------------------------------------------------------------------------
function enterFreezer() {
  CAM.inFreezer = true; GAME.freezeT = 0; GAME.freezeCount = 0;
  sfx('door', new THREE.Vector3(5, 1.2, -3.8)); WORLD.freezerDoor.rotation.y = 1.2;
  closeShot(new THREE.Vector3(5.55, 1.62, -3.45), new THREE.Vector3(7.6, 1.25, -4.7), 0.9);
  setTimeout(function () { if (CAM.inFreezer) { WORLD.freezerDoor.rotation.y = 0; sfx('bang', new THREE.Vector3(5, 1.2, -3.8), { vol: 0.5 }); setSpace('freezer'); jukeWobble(0); } }, 1000);
  WORLD.lights.fill.position.set(6.6, 2.7, -4.0); WORLD.lights.fill.color.set(0x9fc8ff); WORLD.lights.fill.intensity = 7; GAME.breath = steamEmit(5.6, 1.5, -3.6, 0.8, 0.05);
  LSTATE.coldT = Math.max(LSTATE.coldT, 0.9);
  sfx('freeze'); setCold(0, true); updateMainButton();
  U.count = el('div', 'count', '', UI);
}
function leaveFreezer() {
  CAM.inFreezer = false; sfx('door', new THREE.Vector3(5, 1.2, -3.8)); WORLD.freezerDoor.rotation.y = 1.2; releaseShot(0.8);
  setTimeout(function () { WORLD.freezerDoor.rotation.y = 0; setSpace('kitchen'); }, 900);
  WORLD.lights.fill.intensity = 0; setCold(0, false); if (GAME.breath) { steamStop(GAME.breath); GAME.breath = null; } if (U.count && U.count.parentNode) U.count.parentNode.removeChild(U.count); U.count = null;
  if (!GAME.inAnomaly) LSTATE.coldT = 0.25 + GAME.day * 0.04;
  updateMainButton();
}
function updateFreezer(dt) {
  if (!CAM.inFreezer || GAME.mode !== 'play') { if (GAME.cold > 0) GAME.cold = Math.max(0, GAME.cold - dt * 0.05); PU.uFear.value = damp(PU.uFear.value, nearOdd(), 2, dt); return; }
  GAME.freezeT += dt; GAME.cold = Math.min(1, GAME.cold + dt / 45);
  setCold(GAME.cold, true); PU.uFear.value = GAME.cold * 0.4;
  var c = Math.floor(GAME.freezeT - 0.8);
  if (c > GAME.freezeCount && c <= 10) { GAME.freezeCount = c; if (U.count) { U.count.textContent = c; U.count.classList.remove('pop'); void U.count.offsetWidth; U.count.classList.add('pop'); } sfx('heart', null, { n: 1, vol: 0.4 });
    if (c === 10) ACTIVE.slice().forEach(function (A) { if (A.def.onFreezerCount) A.def.onFreezerCount(A); });
    if (c === 6 && GAME.day >= 4 && Math.random() < 0.5) sfx('freezerBang', new THREE.Vector3(4.9, 1.2, -3.9));
  }
  if (GAME.cold >= 1) { GAME.failRule = 'freezer'; frozenDeath(); }
}
function nearOdd() { var f = 0, cp = RENDER.camera.position; CUSTS.forEach(function (C) { if (C.anomaly && C.P) { var d = C.P.root.position.distanceTo(cp); f = Math.max(f, clamp(1 - (d - 1.2) / 5, 0, 1) * (C.anomaly.done ? 0 : 0.6)); } }); return f; }
function frozenDeath() { GAME.mode = 'dead'; setMain(null); PU.uDesat = PU.uDesat; var t0 = performance.now(); var st = function () { var k = (performance.now() - t0) / 2500; PU.uBlack.value = clamp(k, 0, 1); PU.uSat.value = 1.05 - k; if (k < 1) requestAnimationFrame(st); else { PU.uSat.value = 1.05; gameOver(); } }; requestAnimationFrame(st); sfx('freeze', null, { vol: 1.5 }); }
// ---- map (pinned floor plan) & 3D markers ---------------------------------------------------------
var MAP_CSS = [
  '.mapcard{position:absolute;left:0;right:0;margin:0 auto;bottom:calc(env(safe-area-inset-bottom,0px) + 104px);width:min(360px,calc(100% - 32px));padding:14px 14px 12px;background-size:100% 100%;border-radius:3px;filter:drop-shadow(0 12px 20px rgba(0,0,0,.55));pointer-events:auto;animation:docin .35s cubic-bezier(.2,.9,.25,1.1) both;--r:-.8deg;--r1:3deg}',
  '.mapcard .pin{position:absolute;left:50%;top:-6px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#7ad,#1d4a8a);box-shadow:0 3px 4px rgba(0,0,0,.4)}',
  '.mapcard h4{margin:0 0 6px;font:400 17px/1 "Special Elite",monospace;color:#22201c;text-align:center;letter-spacing:.08em}',
  '.mapcard svg{display:block;width:100%;height:auto}',
  '.mapcard .st{cursor:pointer}.mapcard .st circle{transition:r .15s}',
  '.count{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font:700 120px/1 Caveat,cursive;color:rgba(230,248,255,.85);text-shadow:0 0 30px rgba(91,232,255,.6);pointer-events:none}',
  '.count.pop{animation:cpop .9s ease-out both}@keyframes cpop{0%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}25%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:.25}}',
  '.pausecard{position:absolute;left:50%;top:calc(var(--top-safe) + 40px);transform:translateX(-50%);width:min(320px,calc(100% - 40px));display:flex;flex-direction:column;gap:14px;align-items:stretch}',
  '.pausecard .mb{position:relative;left:auto;transform:none;max-width:none;width:100%}.pausecard h3{margin:0 0 4px;text-align:center;font:400 34px/1 Pacifico,cursive;color:#ff8fb8;text-shadow:0 0 18px rgba(255,79,163,.6)}'
].join('\n');
function mapSVG() {
  var sx = function (x) { return 20 + (x + 10.5) * 15; }, sz = function (z) { return 8 + (z + 5.4) * 15; };
  var s = '<svg viewBox="0 0 330 180" xmlns="http://www.w3.org/2000/svg">';
  s += '<rect x="' + sx(-8) + '" y="' + sz(-5.2) + '" width="' + 16 * 15 + '" height="' + 10.2 * 15 + '" fill="none" stroke="#22201c" stroke-width="2.2"/>';
  s += '<rect x="' + sx(-10.4) + '" y="' + sz(-0.45) + '" width="' + 2.4 * 15 + '" height="' + 1.3 * 15 + '" fill="none" stroke="#22201c" stroke-width="1.6"/>';
  s += '<line x1="' + sx(-8) + '" y1="' + sz(-2.8) + '" x2="' + sx(5) + '" y2="' + sz(-2.8) + '" stroke="#22201c" stroke-width="1.6"/><line x1="' + sx(5) + '" y1="' + sz(-5.2) + '" x2="' + sx(5) + '" y2="' + sz(-2.8) + '" stroke="#22201c" stroke-width="1.6"/>';
  s += '<rect x="' + sx(-3.6) + '" y="' + sz(-1.95) + '" width="' + 8 * 15 + '" height="' + 0.75 * 15 + '" fill="#c8282e" opacity=".25" stroke="#22201c" stroke-width="1"/>';
  D.booths.forEach(function (b, i) { s += '<rect x="' + sx(b - 0.95) + '" y="' + sz(3.45) + '" width="' + 1.9 * 15 + '" height="' + 1.5 * 15 + '" fill="#c8282e" opacity=".18" stroke="#22201c" stroke-width=".8"/><text x="' + sx(b) + '" y="' + sz(4.45) + '" font-family="Special Elite" font-size="10" text-anchor="middle" fill="#7e1418">' + (i + 1) + '</text>'; });
  s += '<line x1="' + sx(-7.8) + '" y1="' + sz(5) + '" x2="' + sx(4.9) + '" y2="' + sz(5) + '" stroke="#5be8ff" stroke-width="3" opacity=".7"/>';
  STATION_ORDER.forEach(function (k) {
    var st = STATIONS[k], x = sx(st.map[0]), y = sz(st.map[1]), cur = CAM.station === k && !CAM.inFreezer;
    var alert = stationAlert(k);
    s += '<g class="st" data-st="' + k + '"><circle cx="' + x + '" cy="' + y + '" r="' + (cur ? 13 : 11) + '" fill="' + (cur ? '#c8282e' : '#fbf3e0') + '" stroke="#22201c" stroke-width="2"/>' +
      (alert ? '<circle cx="' + (x + 9) + '" cy="' + (y - 9) + '" r="5" fill="#ff4fa3" stroke="#fff" stroke-width="1.2"/>' : '') +
      '<text x="' + x + '" y="' + (y + 4) + '" font-family="Alfa Slab One" font-size="12" text-anchor="middle" fill="' + (cur ? '#fff' : '#22201c') + '">' + st.n + '</text>' +
      '<text x="' + x + '" y="' + (y + (st.map[1] > 2 || k === 'REGISTER' ? -16 : 23)) + '" font-family="Oswald" font-size="9" letter-spacing=".6" text-anchor="middle" fill="#22201c">' + st.en.toUpperCase() + '</text></g>';
  });
  return s + '</svg>';
}
function stationAlert(k) {
  if (k === 'KITCHEN') return TICKETS.some(function (T) { return !T.ready; });
  if (k === 'JUKEBOX') return ACTIVE.some(function (A) { return A.id === 'phone' && A.ringing; });
  if (k === 'COUNTER') return CUSTS.some(function (C) { return C.seat && C.seat.kind === 'stool' && (C.state === 'seated' || C.state === 'ready' || C.state === 'check' || (C.state === 'ordered' && C.ticket && C.ticket.ready)); });
  if (k === 'BOOTHS') return CUSTS.some(function (C) { return C.seat && C.seat.kind === 'booth' && (C.state === 'seated' || C.state === 'ready' || C.state === 'check' || (C.state === 'ordered' && C.ticket && C.ticket.ready)); });
  if (k === 'REGISTER' || k === 'DOOR') return CUSTS.some(function (C) { return C.state === 'wait'; });
  return false;
}
var MAPV = { el: null };
function toggleMap(force) {
  if (MAPV.el) { MAPV.el.parentNode.removeChild(MAPV.el); MAPV.el = null; if (force !== true) return; }
  if (force === false) return;
  hideChoices();
  var c = el('div', 'mapcard', '<div class="pin"></div><h4>FLOOR PLAN · 見取り図</h4>' + mapSVG(), UI); c.style.backgroundImage = 'url(' + PAPER.rules + ')'; MAPV.el = c;
  sfx('paper');
  c.querySelectorAll('.st').forEach(function (g) { onTap(g, function () { var k = g.getAttribute('data-st'); toggleMap(); goStation(k); }); });
}
function goStation(k) {
  if (GAME.mode !== 'play' || MINI.active) return;
  if (CAM.inFreezer) leaveFreezer();
  if (CAM.outside) comeInside();
  if (k === CAM.station) return;
  hideChoices(); camSetStation(k); setMain(null);
}
// 3D station markers (glowing rings you can tap)
var HOT = [];
function buildHotspots() {
  var c = mkCanvas(128, 128), g = c.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 40, 0, TAU); g.stroke(); var gr = g.createRadialGradient(64, 64, 30, 64, 64, 62); gr.addColorStop(0, 'rgba(91,232,255,0.0)'); gr.addColorStop(0.6, 'rgba(91,232,255,0.35)'); gr.addColorStop(1, 'rgba(91,232,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  var tex = toTex(c, { clamp: true });
  var pts = { COUNTER: [0.6, 1.25, -1.6], BOOTHS: [3.6, 1.1, 3.0], REGISTER: [6.4, 1.35, 1.7], KITCHEN: [1.4, 1.65, -2.8], JUKEBOX: [-7.2, 1.7, 2.95], FREEZER: [4.9, 1.6, -3.85], DOOR: [6.0, 1.7, 4.8], BACKDOOR: [-2.6, 1.6, -5.1] };
  for (var k in pts) (function (k) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(1.6, 2.6, 3.0), transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending }));
    sp.position.set(pts[k][0], pts[k][1], pts[k][2]); sp.scale.set(0.34, 0.34, 1); sp.renderOrder = 8; RENDER.scene.add(sp);
    var lab = el('div', 'hint', STATIONS[k].en.toUpperCase(), U.layer);
    addPick(sp, function () { goStation(k); });
    HOT.push({ k: k, sp: sp, lab: lab });
  })(k);
}
var _hv = null;
function updateHotspots(t) {
  if (!_hv) _hv = new THREE.Vector3();
  var on = GAME.mode === 'play' && !MINI.active && !CAM.inFreezer && !CAM.outside && !CAM.override && !DOC.open;
  HOT.forEach(function (h, i) {
    var vis = on && h.k !== CAM.station; h.sp.visible = vis;
    var d = vis ? h.sp.position.distanceTo(RENDER.camera.position) : 0;
    h.sp.material.opacity = 0.55 + 0.35 * Math.sin(t * 2.5 + i);
    _hv.copy(h.sp.position).project(RENDER.camera);
    var sc = vis && _hv.z < 1 && Math.abs(_hv.x) < 0.95 && Math.abs(_hv.y) < 0.92 && d < 14;
    if (sc) { var x = (_hv.x * 0.5 + 0.5) * RENDER.w, y = (-_hv.y * 0.5 + 0.5) * RENDER.h - 18; if (y < 118 + 60) sc = false; else { h.lab.style.left = x + 'px'; h.lab.style.top = y + 'px'; } }
    h.lab.style.opacity = sc ? 0.9 : 0;
  });
}
// ---- pause -----------------------------------------------------------------------------------------
var PAUSE = { el: null };
function pauseGame() {
  if (GAME.mode !== 'play' || PAUSE.el) return;
  GAME.paused = true; hideChoices(); toggleMap(false); try { speechSynthesis.pause(); } catch (e) {}
  if (AUDIO.ctx && AUDIO.ctx.suspend) try { AUDIO.ctx.suspend(); } catch (e) {}
  var ov = el('div', 'ov dim pe', '<div class="pausecard"><h3>Paused</h3></div>', UI); PAUSE.el = ov;
  var card = ov.querySelector('.pausecard');
  [['play', 'RESUME', 'つづける', resumeGame], ['rules', 'RULES', 'ルールを読む', function () { resumeGame(true); showRules(); }], ['gear', 'SETTINGS', '設定', function () { openSettings(); }], ['back', 'QUIT TO TITLE', 'タイトルへもどる', function () { resumeGame(true); quitToTitle(); }]].forEach(function (b) {
    var bt = el('button', 'mb pe', icon(b[0], 30) + '<span class="tx"><span class="en">' + b[1] + '</span><span class="ja">' + b[2] + '</span></span>', card); pressFX(bt); onTap(bt, function () { sfx('click'); b[3](); });
  });
}
function resumeGame(keepPaused) {
  if (PAUSE.el) { PAUSE.el.parentNode.removeChild(PAUSE.el); PAUSE.el = null; }
  if (AUDIO.ctx && AUDIO.ctx.resume) try { AUDIO.ctx.resume(); } catch (e) {}
  try { speechSynthesis.resume(); } catch (e) {}
  if (!keepPaused) GAME.paused = false;
}
function showRules() {
  GAME.paused = true;
  openDocs(docRules(rulesDocList(GAME.day, GAME.fakes), GAME.day) + '<div class="doccap">NIGHT ' + GAME.day + ' — ' + rulesForDay(GAME.day).length + ' RULES' + (GAME.fakes && GAME.fakes.length ? ' · SOME PAGES LOOK DIFFERENT…' : '') + '</div>', { onClose: function () { GAME.paused = false; } });
}
// ---- per-frame game update ------------------------------------------------------------------------
var HUD_T = 0;
function updateGame(dt, t) {
  updateDoor(dt); updateLore(dt, t); drawTV(dt); updateJumpscare(dt); updateMini(dt, t); updateHotspots(t); updateAudio(dt);
  if (GAME.mode !== 'play') { if (GAME.mode === 'title' || GAME.mode === 'cut') { updateCustomers(dt); } if (SUBQ.cur) subUpdate(dt); return; }
  if (SUBQ.cur) subUpdate(dt);
  if (GAME.paused || PAUSE.el) return;
  GAME.min += dt * GAME.rate * (GAME.fast || 1);
  runSchedule(); updateCustomers(dt); updateAnomalies(dt); updateFreezer(dt);
  // pre-anomaly tape wobble on the jukebox
  var nextA = GAME.sched.filter(function (e) { return e.type === 'anom'; })[0], wob = 0;
  if (nextA) wob = clamp(1 - (nextA.at - GAME.min) / 25, 0, 1); JUKE.wobble = wob; JUKE.drift = wob * 0.6;
  HUD_T -= dt; if (HUD_T <= 0) { HUD_T = 0.5; setClock(GAME.min, GAME.day); updateMainButton(); }
  UI.classList.toggle('flick', GAME.day >= 3 && GAME.min > 200);
  UI.style.setProperty('--wear', clamp((GAME.day - 1) * 0.12 + (GAME.min / SHIFT_LEN) * 0.12, 0, 0.6).toFixed(2));
  PU.uCold.value = LSTATE.cold * 0.85; PU.uGrain.value = 0.035 + LSTATE.cold * 0.025; PU.uVig.value = 0.55 + LSTATE.cold * 0.15;
  PU.uSat.value = 1.05 - LSTATE.cold * 0.22;
  if (GAME.min >= SHIFT_LEN && !GAME.inAnomaly && !JS.on) shiftComplete();
  if (GAME.min >= SHIFT_LEN + 30 && !JS.on) shiftComplete();
}
// ---- end states ------------------------------------------------------------------------------------
function gameOver() {
  GAME.mode = 'over'; setGameHUD(false); setMain(null); hideChoices(); toggleMap(false);
  clearWorld();
  PU.uBlack.value = 0;
  var rule = RULES.filter(function (r) { return r.id === GAME.failRule; })[0];
  var ruleTxt = rule ? rule.en : GAME.failRule === 'freezer' ? 'You stayed in the freezer too long.' : GAME.failRule === 'outside' ? 'It is more dangerous outside.' : 'Something came in.';
  var ruleJa = rule ? rule.ja : GAME.failRule === 'freezer' ? '冷凍庫に長くいすぎた。' : GAME.failRule === 'outside' ? '外はもっと危ない。' : '何かが入ってきた。';
  showSunnyCard('Come back soon, partner!', 'またきてね！', function () {
    var h = clockStr(GAME.deathAt || GAME.min);
    var lines = '<div class="c big">SUNNY SIDE DINER</div><div class="c">NIGHT SHIFT REPORT</div><hr><div class="r"><span>NIGHT</span><span>' + GAME.day + ' / 5</span></div><div class="r"><span>CLOCKED OUT</span><span>' + h + '</span></div><div class="r"><span>SERVED</span><span>' + GAME.served + '</span></div><div class="r"><span>TIPS</span><span>' + fmtMoney(GAME.tips) + '</span></div><hr><div class="bad">RULE BROKEN:</div><div class="bad">' + ruleTxt + '</div><div style="font:500 11px/1.5 \'Zen Kaku Gothic New\';margin-top:6px">' + ruleJa + '</div><hr><div class="c">*** WE\'LL KEEP THE LIGHT ON ***</div>';
    resultScreen(lines, [['restart', 'TRY NIGHT ' + GAME.day + ' AGAIN', GAME.day + '日目をやり直す', function () { startNight(GAME.day); }], ['back', 'TITLE', 'タイトルへ', quitToTitle]]);
  });
}
function clockStr(min) { var tot = (22 * 60 + Math.floor(min)) % 1440, h = Math.floor(tot / 60), m = tot % 60; return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h >= 12 ? ' PM' : ' AM'); }
function shiftComplete() {
  if (GAME.mode !== 'play') return; GAME.mode = 'cut'; setMain(null); hideChoices(); toggleMap(false); setGameHUD(false);
  jukeStop(1.2);
  dawn(function () {
    var day = GAME.day;
    SAVE.clears = Math.max(SAVE.clears || 0, day); SAVE.bestTips = Math.max(SAVE.bestTips || 0, GAME.tips); SAVE.totalTips = (SAVE.totalTips || 0) + GAME.tips; SAVE.bestDay = Math.max(SAVE.bestDay || 0, day);
    if (day >= 5) { SAVE.day = 1; writeSave(); finale(); return; }
    SAVE.day = day + 1; writeSave();
    playMusic('title', { vol: 0.8 });
    var lines = '<div class="c big">SUNNY SIDE DINER</div><div class="c">SHIFT COMPLETE</div><hr><div class="r"><span>NIGHT</span><span>' + day + ' / 5</span></div><div class="r"><span>CLOCKED OUT</span><span>6:00 AM</span></div><div class="r"><span>SERVED</span><span>' + GAME.served + '</span></div><div class="r"><span>SALES</span><span>' + fmtMoney(GAME.sales) + '</span></div><div class="r big"><span>TIPS</span><span>' + fmtMoney(GAME.tips) + '</span></div><div class="r"><span>ODD THINGS SURVIVED</span><span>' + GAME.resolved + '</span></div><hr><div class="c">RISE AND SHINE!</div><div class="c">SEE YOU TONIGHT</div>';
    resultScreen(lines, [['next', 'NIGHT ' + (day + 1), (day + 1) + '日目へ', function () { stopMusic(0.6); startNight(day + 1); }], ['back', 'TITLE', 'タイトルへ', function () { quitToTitle(); }]]);
  });
}
function dawn(cb) {
  var t0 = performance.now();
  WORLD.skyMat.color.setRGB(0.9, 0.9, 0.9);
  say('JUNE', 'Rise and shine, hon! Day shift\'s here. You did good.', 'おはよう（Rise and shine）！ 日勤が来たよ。よくがんばったね。', { voice: 'june' });
  sfx('doorbell', new THREE.Vector3(6, 2.3, 4.9)); openDoorAnim();
  var step = function () {
    var k = clamp((performance.now() - t0) / 6000, 0, 1);
    WORLD.skyMat.color.setRGB(0.9 + k * 2.2, 0.9 + k * 1.4, 0.9 + k * 0.9);
    WORLD.lights.lot.intensity = 70 * (1 - k); LSTATE.coldT = 0; FX.rainT = 0;
    PU.uExposure.value = 1 + k * 0.25;
    if (k < 1) requestAnimationFrame(step); else { PU.uExposure.value = 1; WORLD.skyMat.color.setRGB(0.9, 0.9, 0.9); WORLD.lights.lot.intensity = 70; clearWorld(); cb(); }
  };
  requestAnimationFrame(step);
}
function quitToTitle() { resumeGame(true); clearWorld(); setGameHUD(false); closeDocs(true); hideChoices(); stopVoice(); jukeStop(0.3); showTitle(); }
// ---- key bindings ---------------------------------------------------------------------------------------
function onKey(e) {
  if (e.key === 'Escape') { if (DOC.open) closeDocs(); else if (PAUSE.el) resumeGame(); else if (SLIP.open) hideChoices(); else if (MAPV.el) toggleMap(); else pauseGame(); return; }
  if (GAME.mode !== 'play' || PAUSE.el) return;
  var n = parseInt(e.key, 10); if (n >= 1 && n <= 8) { goStation(STATION_ORDER[n - 1]); return; }
  if (e.key === ' ' || e.key === 'Enter') { if (SUBQ.cur) subAdvance(); else if (U.mainAct && U.mainAct.fn) U.mainAct.fn(); e.preventDefault(); }
  if (e.key === 'm' || e.key === 'M') toggleMap();
  if (e.key === 'r' || e.key === 'R') showRules();
  if (MINI.active && (e.key === 'h' || e.key === 'H') && MINI.onDown && !MINI.keyHold) { MINI.keyHold = 1; MINI.onDown(RENDER.w / 2, RENDER.h / 2); }
}
function onKeyUp(e) { if (MINI.active && (e.key === 'h' || e.key === 'H') && MINI.onUp) { MINI.keyHold = 0; MINI.onUp(RENDER.w / 2, RENDER.h / 2, 0, 100); } }
function onTapNothing() { if (MAPV.el) toggleMap(); }


// ===== 21_screens.js =====
// ---- screens: warning, title CM, hiring, night card, results, settings, archive, endings ----
var SCR_CSS = [
  '.scr{position:absolute;inset:0;pointer-events:auto;transition:opacity .45s;}',
  '.scr.hide{opacity:0;pointer-events:none}',
  '.warn{background:#050506;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(var(--top-safe) + 10px) 26px calc(env(safe-area-inset-bottom,0px) + 30px);text-align:center;}',
  '.warn .w1{font:400 26px/1.1 "Alfa Slab One",serif;color:#ff4f4f;letter-spacing:.12em;text-shadow:0 0 16px rgba(255,60,60,.5)}',
  '.warn .w2{margin-top:14px;font:600 16px/1.5 Oswald,sans-serif;color:#e8e0d0;letter-spacing:.04em;max-width:330px}',
  '.warn .w3{margin-top:8px;font:500 13px/1.6 "Zen Kaku Gothic New",sans-serif;color:#b8ab95;max-width:330px}',
  '.warn .hp{margin-top:30px;display:flex;align-items:center;gap:12px;color:#8fd3c1;font:600 13px/1.3 Oswald,sans-serif;letter-spacing:.12em;text-align:left}.warn .hp .ic{width:34px;height:34px}',
  '.warn .tap{margin-top:46px;font:400 22px/1 "Alfa Slab One",serif;color:#fff3d6;letter-spacing:.18em;animation:blink 1.4s ease-in-out infinite}.warn .tap small{display:block;font:600 12px/1.6 "Zen Kaku Gothic New";letter-spacing:.1em;color:#b8ab95;margin-top:8px}',
  '@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}',
  // title CM
  '.cm{position:absolute;inset:0;overflow:hidden;background:#f4c870;transition:opacity .08s}',
  '.cm canvas{position:absolute;inset:0;width:100%;height:100%}',
  '.cm .tvframe{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(40,20,0,.75),inset 0 0 30px rgba(0,0,0,.5);background:repeating-linear-gradient(0deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px)}',
  '.logo{position:absolute;left:0;right:0;top:calc(var(--top-safe) + 18px);text-align:center;pointer-events:none}',
  '.logo .l1{font:400 min(46px,11.5vw)/1.05 Pacifico,cursive;color:#c8282e;text-shadow:0 3px 0 #fff4d8,0 6px 0 #7e1418,0 12px 18px rgba(0,0,0,.35);transform:rotate(-4deg);display:inline-block;padding:0 8px}',
  '.logo .l2{margin-top:12px;font:400 17px/1 "Alfa Slab One",serif;color:#7e1418;letter-spacing:.2em}',
  '.logo .l3{display:inline-block;margin-top:10px;padding:6px 14px;border-radius:999px;background:#c8282e;color:#fff4d8;font:600 13px/1 Oswald,sans-serif;letter-spacing:.24em;box-shadow:0 3px 0 #7e1418}',
  '.titlemenu{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);transform:translateX(-50%);width:min(320px,calc(100% - 40px));display:flex;flex-direction:column;gap:14px}',
  '.titlemenu .mb{position:relative;left:auto;transform:none;max-width:none;width:100%}',
  '.titlemenu .mb:active,.titlemenu .mb.down{transform:translateY(4px)}',
  '.ver{position:absolute;right:18px;bottom:calc(env(safe-area-inset-bottom,0px) + 4px);font:600 9px/1 Oswald;letter-spacing:.2em;color:rgba(0,0,0,.35)}',
  // night card
  '.nightcard{position:absolute;inset:0;background:#030304;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}',
  '.nightcard .n1{font:400 64px/1 Pacifico,cursive;color:#ff4fa3;text-shadow:0 0 12px #ff4fa3,0 0 40px rgba(255,79,163,.7);animation:neonon 1.6s steps(1) both}',
  '.nightcard .n2{margin-top:16px;font:400 20px/1 "Alfa Slab One",serif;letter-spacing:.3em;color:#5be8ff;text-shadow:0 0 10px #5be8ff;animation:neonon 1.6s .3s steps(1) both}',
  '.nightcard .n3{margin-top:12px;font:500 13px/1.6 "Zen Kaku Gothic New";color:#b8ab95;letter-spacing:.2em}',
  '@keyframes neonon{0%{opacity:0}10%{opacity:1}14%{opacity:.1}18%{opacity:1}40%{opacity:.3}44%,100%{opacity:1}}',
  // sunny card (game over)
  '.sunnycard{position:absolute;inset:0;background:#f4c870;overflow:hidden}',
  '.sunnycard canvas{position:absolute;inset:0;width:100%;height:100%}',
  '.bubble{position:absolute;left:50%;top:calc(var(--top-safe) + 30px);transform:translateX(-50%) rotate(-2deg);padding:16px 22px;background:#fffaf0;border:3px solid #2a1608;border-radius:24px;text-align:center;box-shadow:0 6px 0 rgba(0,0,0,.2);max-width:calc(100% - 40px)}',
  '.bubble .e{font:400 30px/1.1 Pacifico,cursive;color:#c8282e}.bubble .j{font:700 14px/1.4 "Zen Kaku Gothic New";color:#5a3a1a;margin-top:6px}',
  '.bubble::after{content:"";position:absolute;left:50%;bottom:-18px;border:12px solid transparent;border-top:16px solid #2a1608;margin-left:-12px}',
  // hire form
  '.form input{width:100%;height:44px;margin-top:6px;border:0;border-bottom:2px solid #22201c;background:transparent;font:400 24px/44px "Special Elite",monospace;color:#1d2f6f;outline:none;-webkit-user-select:text;user-select:text;border-radius:0}',
  '.form label{display:block;font:400 13px/1.3 "Special Elite",monospace;color:#555;margin-top:12px}',
  '.form .stampbox{margin-top:16px;display:inline-block;padding:4px 10px;border:3px solid #c8282e;color:#c8282e;font:400 18px/1 "Alfa Slab One";transform:rotate(-8deg)}',
  // settings / archive
  '.panel{position:absolute;left:0;right:0;margin:0 auto;top:calc(var(--top-safe) + 8px);bottom:calc(env(safe-area-inset-bottom,0px) + 96px);width:min(370px,calc(100% - 32px));padding:22px 20px;background-size:100% 100%;border-radius:4px;filter:drop-shadow(0 14px 24px rgba(0,0,0,.6));overflow-y:auto;-webkit-overflow-scrolling:touch;color:#22201c;animation:docin .4s cubic-bezier(.2,.9,.25,1.1) both;--r:0deg;--r1:2deg}',
  '.panel h2{margin:0 0 12px;font:400 30px/1 Pacifico,cursive;color:#c8282e;text-align:center}',
  '.row{margin:14px 0}.row .lb{display:flex;justify-content:space-between;font:600 14px/1.2 Oswald,sans-serif;letter-spacing:.1em}.row .lb .ja{font:500 11px/1.4 "Zen Kaku Gothic New";letter-spacing:0;color:#6b5a44}',
  '.seg{display:flex;gap:6px;margin-top:8px}.seg button{flex:1;height:38px;border-radius:999px;border:2px solid #22201c;background:#fbf3e0;font:600 12px/1 Oswald,sans-serif;letter-spacing:.08em;color:#22201c;pointer-events:auto}.seg button.on{background:#c8282e;color:#fff4d8;border-color:#7e1418;box-shadow:inset 0 2px 3px rgba(0,0,0,.3)}',
  '.rng{width:100%;margin-top:10px;-webkit-appearance:none;appearance:none;height:8px;border-radius:4px;background:linear-gradient(90deg,#c8282e var(--v,50%),#d8ccb0 var(--v,50%));outline:none;pointer-events:auto}',
  '.rng::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#9aa3ab);border:2px solid #555;box-shadow:0 2px 4px rgba(0,0,0,.4)}',
  '.tabs{display:flex;gap:6px;margin-bottom:12px}.tabs button{flex:1;height:34px;border-radius:8px 8px 0 0;border:2px solid #22201c;border-bottom:0;background:#e9dcbc;font:600 11px/1 Oswald;letter-spacing:.1em;pointer-events:auto}.tabs button.on{background:#fbf3e0}',
  '.arow{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.25)}.arow .ic{width:22px;height:22px;flex:0 0 auto;color:#c8282e}.arow .t{font:600 14px/1.25 Oswald;letter-spacing:.04em}.arow .d{font:500 11.5px/1.5 "Zen Kaku Gothic New";color:#5a5244}.arow.lock{opacity:.4}',
  '.arow.btn{cursor:pointer;pointer-events:auto}',
  // ending lyrics
  '.lyr{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 40px);text-align:center;pointer-events:none}',
  '.lyr .e{position:relative;display:inline-block;font:700 21px/1.3 "Zen Kaku Gothic New",sans-serif;color:rgba(255,248,234,.45);text-shadow:0 2px 4px #000}',
  '.lyr .e b{position:absolute;left:0;top:0;white-space:nowrap;overflow:hidden;color:#ffe27a;text-shadow:0 0 12px rgba(255,190,60,.7),0 2px 4px #000;width:var(--w,0%)}',
  '.lyr .j{margin-top:6px;font:500 14px/1.4 "Zen Kaku Gothic New";color:rgba(243,230,200,.85);text-shadow:0 1px 3px #000}',
  '.endtxt{position:absolute;left:24px;right:24px;top:40%;transform:translateY(-50%);text-align:center;color:#f3e6c8;pointer-events:none}',
  '.endtxt .e{font:400 22px/1.4 "Special Elite",monospace}.endtxt .j{font:500 13px/1.7 "Zen Kaku Gothic New";color:#b8ab95;margin-top:10px}'
].join('\n');
var SCR = {};
function scr(cls, html) { var d = el('div', 'scr ' + cls, html || '', UI); return d; }
function killScr(d, fade) { if (!d) return; if (fade) { d.classList.add('hide'); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 480); } else if (d.parentNode) d.parentNode.removeChild(d); }
// ---- warning ---------------------------------------------------------------------------
function showWarning() {
  GAME.mode = 'warn';
  var w = scr('warn', '<div class="w1">WARNING</div><div class="w2">This game contains jump scares, loud sounds, and blood.</div><div class="w3">※ホラー演出・急な大きい音・流血表現があります</div>' +
    '<div class="hp">' + icon('headphones', 34) + '<div>HEADPHONES RECOMMENDED<br><span style="font:500 12px \'Zen Kaku Gothic New\';letter-spacing:0;color:#b8ab95">イヤホン推奨</span></div></div><div class="tap">TAP TO START<small>タップしてはじめる</small></div>');
  SCR.warn = w;
  onTap(w, function () {
    audioUnlock(); try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
    killScr(w, true); SCR.warn = null; showTitle(true);
  });
}
// ---- title (50s TV commercial; glitches to the rainy night) --------------------------------------
var CM = { on: false, t: 0 };
function showTitle(first) {
  GAME.mode = 'title'; setGameHUD(false);
  RENDER.scene.environment = RENDER.scene.environment;
  FX.rainT = 1; LSTATE.coldT = 0.3; LSTATE.lightsOn = true; LSTATE.neonOn = true;
  CAM.override = { pos: new THREE.Vector3(-4.6, 1.35, 16.5), target: new THREE.Vector3(-1.2, 2.3, 4), k: 1, dur: 1 }; CAM.titleDrift = 0;
  playMusic('title', { vol: 0.85 });
  var s = scr('', '<div class="cm"><canvas></canvas><div class="tvframe"></div></div><div class="logo"><div class="l1">Sunny Side Diner</div><div class="l2">— OPEN 24 HOURS! —</div><div class="l3">RISE AND SHINE!</div></div><div class="titlemenu"></div><div class="ver">v' + GAME_VERSION + '</div>');
  SCR.title = s; CM.on = true; CM.t = 0; CM.el = s.querySelector('.cm'); CM.cv = s.querySelector('.cm canvas'); CM.next = 4 + Math.random() * 3;
  var menu = s.querySelector('.titlemenu');
  var items = [['play', SAVE.day > 1 ? 'START · NIGHT ' + SAVE.day : 'START', 'シフトに入る', startPressed], ['gear', 'SETTINGS', '設定', openSettings], ['archive', 'ARCHIVE', '記録（' + loreCount() + '/15）', openArchive]];
  items.forEach(function (b) { var bt = el('button', 'mb pe', icon(b[0], 30) + '<span class="tx"><span class="en">' + b[1] + '</span><span class="ja">' + b[2] + '</span></span>', menu); pressFX(bt); onTap(bt, function () { sfx('click'); b[3](); }); });
}
function hideTitle() { CM.on = false; killScr(SCR.title, true); SCR.title = null; }
function drawCMFrame(dt) {
  if (!CM.on || !CM.cv) return;
  CM.t += dt; var t = CM.t;
  // glitch to the night
  CM.next -= dt;
  if (CM.next <= 0 && !CM.gl) { CM.gl = 0.25 + Math.random() * 0.45; sfx('static', null, { len: CM.gl, vol: 0.5 }); }
  if (CM.gl > 0) { CM.gl -= dt; CM.el.style.opacity = Math.random() < 0.8 ? 0 : 0.5; PU.uGlitch.value = 0.6; PU.uVHS.value = 1; if (CM.gl <= 0) { CM.gl = 0; CM.next = 5 + Math.random() * 5; CM.el.style.opacity = 1; PU.uGlitch.value = 0; PU.uVHS.value = 0; } }
  var cv = CM.cv, w = Math.round(RENDER.w * 0.75), h = Math.round(RENDER.h * 0.75); if (cv.width !== w) { cv.width = w; cv.height = h; }
  if (RENDER.frame % 2) return;
  var g = cv.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f2a24e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.save(); g.translate(w / 2, h * 0.5); g.rotate(t * 0.12); for (var i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.22)' : 'rgba(255,240,200,0.05)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, Math.max(w, h), i / 16 * TAU, (i + 0.5) / 16 * TAU); g.fill(); } g.restore();
  // ground stripe + little diner cartoon
  g.fillStyle = '#8fd3c1'; g.fillRect(0, h * 0.76, w, h * 0.24); g.fillStyle = '#2f7e6e'; g.fillRect(0, h * 0.76, w, 4);
  var dx = w * 0.5, dy = h * 0.74; g.fillStyle = '#d8dde2'; g.fillRect(dx - w * 0.32, dy - h * 0.09, w * 0.64, h * 0.09); g.fillStyle = '#c8282e'; g.fillRect(dx - w * 0.32, dy - h * 0.065, w * 0.64, h * 0.012);
  g.fillStyle = '#5be8ff'; for (var k = 0; k < 6; k++) g.fillRect(dx - w * 0.29 + k * w * 0.1, dy - h * 0.05, w * 0.07, h * 0.035);
  var bob = Math.sin(t * 4) * h * 0.012;
  drawSunny(g, w * 0.5, h * 0.5 + bob, Math.min(w, h) * 0.17, { wave: 0.3 + Math.sin(t * 7) * 0.6, look: Math.sin(t * 0.7) * 0.4 });
  for (var sp = 0; sp < 6; sp++) { var a = t * 1.5 + sp; var sx = w * 0.5 + Math.cos(a) * w * 0.36, sy = h * 0.48 + Math.sin(a * 1.3) * h * 0.12; g.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 6 + sp)) + ')'; g.beginPath(); g.arc(sx, sy, 3 + sp % 3, 0, TAU); g.fill(); }
  // film jitter / color bleed
  if (Math.random() < 0.04) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, Math.random() * h, w, 2); }
}
function startPressed() {
  if (SAVE.day > 1) {
    showChoices('Which night?', [{ icon: 'play', en: 'Continue: Night ' + SAVE.day, ja: SAVE.day + '日目からつづける', fn: function () { beginFromTitle(SAVE.day); } }, { icon: 'restart', en: 'New game: Night 1', ja: '1日目からはじめる', fn: function () { SAVE.day = 1; writeSave(); beginFromTitle(1); } }], { table: 'START' });
  } else beginFromTitle(1);
}
function beginFromTitle(day) {
  hideChoices();
  CM.el.style.opacity = 0; PU.uGlitch.value = 0.8; sfx('static', null, { len: 0.6 });
  setTimeout(function () {
    PU.uGlitch.value = 0; hideTitle();
    if (day === 1 && !SAVE.seenIntro) hireSequence(); else { stopMusic(1); startNight(day); }
  }, 500);
}
// ---- hiring: newspaper ad -> application (name) -> letter ------------------------------------------
function hireSequence() {
  GAME.mode = 'cut';
  openDocs(docNews({ paper: 'The Desert Ledger', date: 'Classifieds — Monday', head: 'NIGHT SHIFT WANTED', img: sunnyAdImg(), body: ['<b>No Experience Needed!</b> Sunny Side Diner, Highway 9. Nights, 10 PM – 6 AM. Free coffee. Must follow simple rules.', 'Apply in person or by mail. We\'ll keep the light on for you!'], ja: '求人：深夜スタッフ募集・未経験OK！ サニーサイド・ダイナー（ハイウェイ9号線）。夜10時〜朝6時。コーヒー飲み放題。かんたんなルールを守れる方。' }), { closeEn: 'APPLY', closeJa: '応募する', closeIcon: 'pencil', onClose: applicationForm });
}
function sunnyAdImg() { var c = mkCanvas(320, 200), g = c.getContext('2d'); g.fillStyle = '#e8dfc6'; g.fillRect(0, 0, 320, 200); drawSunny(g, 160, 92, 54, { wave: 0.7 }); return c.toDataURL('image/png'); }
function applicationForm() {
  var h = '<div class="doc rules form" style="background-image:url(' + PAPER.rules + ');--r:.6deg"><div class="rlogo">Sunny Side Diner</div><h2 style="font:400 19px/1.2 \'Special Elite\';text-align:center;margin:6px 0 4px">EMPLOYMENT APPLICATION</h2><div style="font:500 12px \'Zen Kaku Gothic New\';text-align:center;color:#666">採用申込書 ── 名前を書いてください（英字）</div>' +
    '<label>NAME / 名前</label><input id="ssd-name" maxlength="12" autocomplete="off" autocapitalize="words" spellcheck="false" value="' + (SAVE.name || '') + '" placeholder="Sam">' +
    '<label>POSITION / 職種</label><div style="font:400 20px \'Special Elite\';color:#1d2f6f;border-bottom:2px solid #22201c;padding:6px 0">Night Shift</div>' +
    '<label>CAN YOU FOLLOW RULES? / ルールを守れますか</label><div style="font:700 26px Caveat;color:#1d2f6f">Yes.</div></div>';
  openDocs(h, { closeEn: 'SIGN & SEND', closeJa: 'サインして送る', closeIcon: 'pencil', onClose: function () {
    var v = ''; try { v = (document.getElementById('ssd-name') || {}).value || ''; } catch (e) {}
    v = v.replace(/[^A-Za-z .'-]/g, '').trim().slice(0, 12); if (!v) v = 'Sam';
    SAVE.name = v.charAt(0).toUpperCase() + v.slice(1); SAVE.seenIntro = 1; writeSave();
    acceptanceLetter();
  } });
  setTimeout(function () { var i = document.getElementById('ssd-name'); if (i) { i.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); i.addEventListener('keydown', function (e) { e.stopPropagation(); }); } }, 50);
}
function acceptanceLetter() {
  openDocs(docDiary('Dear ' + SAVE.name + ',<br>You\'re hired! Start tonight at 10 o\'clock. The manager, Dale, will leave you a note and the rules.<br>Rise and shine!<br>— June Mercer, owner', SAVE.name + ' さんへ。採用です！ 今夜10時から来てください。店長のデールがメモとルールを置いておきます。Rise and shine！ ── 店主 ジューン・マーサー'), { closeEn: 'GO TO WORK', closeJa: '出勤する', closeIcon: 'walk', onClose: function () { stopMusic(1.2); startNight(1); } });
}
// ---- starting a night ---------------------------------------------------------------------------------
var MEMOS = {
  1: ['Welcome aboard, kid. I can\'t be there tonight.<br>Coffee\'s in the pot. Rules are on the board — the laminated page.<br>Follow them and you\'ll see the sunrise.<br>— Dale', 'ようこそ。今夜は店に行けない。コーヒーはポットに。ルールはボードに貼ったラミネートの紙だ。守れば朝日が見られる。── デール'],
  2: ['Two new rules tonight. Don\'t ask why.<br>Booth 4 is nobody\'s booth.<br>— Dale', '今夜はルールが2つ増えた。理由は聞くな。4番席はだれの席でもない。── デール'],
  3: ['Somebody\'s been pinning papers on my board.<br>Only trust the laminated page with my signature.<br>— Dale', 'だれかがおれのボードに紙を貼っていく。信じていいのは、おれのサインがあるラミネートの紙だけだ。── デール'],
  4: ['If my voice sounds wrong on the phone, it\'s the line.<br>...Probably.<br>— Dale', '電話でおれの声がおかしく聞こえても、回線のせいだ。……たぶんな。── デール'],
  5: ['Last night, kid. At dawn, listen carefully.<br>Whatever you hear — do the rules.<br>— D.', '最後の夜だ。夜明けはよく聞け。何が聞こえても、ルールを守れ。── D'] };
function startNight(day) {
  closeDocs(true); hideChoices(); toggleMap(false); stopVoice(); stopMusic(0.5);
  newGameState(day); clearWorld();
  GAME.mode = 'cut';
  var fakes = []; var pool = FAKES.filter(function (f) { return rulesForDay(day).some(function (r) { return r.id === f.against; }) || f.against === 'reflection'; });
  R.shuffle(pool); fakes = pool.slice(0, DAY_FAKES[day]); GAME.fakes = fakes;
  GAME.sched = buildSchedule(day);
  spawnLoreForNight(day); sunnyProgress(day);
  CAM.override = null; camSetStation('COUNTER', true);
  ARCH_BAG = [];
  var nc = scr('nightcard', '<div class="n1">Night ' + day + '</div><div class="n2">10:00 PM</div><div class="n3">' + ['', '1日目', '2日目', '3日目', '4日目', '5日目（最終日）'][day] + '</div>');
  sfx('zap', null, { vol: 0.4 }); setTimeout(function () { sfx('zap', null, { vol: 0.3 }); }, 220);
  setTimeout(function () {
    killScr(nc, true);
    jukePlay('boogie', { label: 'A1 Diner Boogie' }); JUKE.label = 'A1 Diner Boogie';
    var memo = MEMOS[day];
    openDocs(docSticky(memo[0], memo[1]) + docRules(rulesDocList(day, fakes), day) + '<div class="doccap">' + (day === 1 ? 'TAP GUESTS TO SERVE THEM · お客さんをタップして接客' : 'NEW RULES TONIGHT · 新しいルール') + '</div>', { closeEn: 'START SHIFT', closeJa: 'シフト開始', closeIcon: 'play', onClose: function () {
      GAME.mode = 'play'; setGameHUD(true); setClock(0, day); setTips(0, false); updateMainButton();
      if (day === 1) tutorialHints();
    } });
  }, 2400);
}
function tutorialHints() {
  setTimeout(function () { if (GAME.mode === 'play') toast('Guests wait at the door. Tap them to seat them.', 'お客さんは入口で待っている。タップして席へ案内', 4); }, 5000);
  setTimeout(function () { if (GAME.mode === 'play') toast('Drag to look around. MAP or the glowing rings to move.', 'ドラッグで見回す。MAP か光る輪で移動', 4); }, 15000);
  setTimeout(function () { if (GAME.mode === 'play') toast('Orders go to the KITCHEN. Cook, then serve.', '注文は厨房へ。作ってから運ぶ', 4); }, 40000);
}
// ---- results / sunny card ---------------------------------------------------------------------------
function resultScreen(lines, buttons) {
  var h = docReceipt(lines, true);
  openDocs(h, { noClose: true });
  setTimeout(function () { sfx('print', null, { n: 28 }); }, 100);
  var wrap = DOC.wrap, box = el('div', null, null, wrap); box.style.cssText = 'width:min(300px,calc(100% - 40px));display:flex;flex-direction:column;gap:14px;margin-top:16px;';
  buttons.forEach(function (b) { var bt = el('button', 'mb pe', icon(b[0], 30) + '<span class="tx"><span class="en">' + b[1] + '</span><span class="ja">' + b[2] + '</span></span>', box); bt.style.cssText = 'position:relative;left:auto;transform:none;max-width:none;width:100%;'; pressFX(bt); onTap(bt, function () { sfx('click'); closeDocs(true); b[3](); }); });
}
function showSunnyCard(en, ja, cb) {
  var s = scr('sunnycard', '<canvas></canvas><div class="bubble"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>');
  var cv = s.querySelector('canvas'), t0 = performance.now();
  var draw = function () {
    if (!s.parentNode) return; var t = (performance.now() - t0) / 1000, w = cv.width = Math.round(RENDER.w * 0.8), h = cv.height = Math.round(RENDER.h * 0.8), g = cv.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f2a24e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.6); g.rotate(t * 0.2); for (var i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, h, i / 16 * TAU, (i + 0.5) / 16 * TAU); g.fill(); } g.restore();
    drawSunny(g, w / 2, h * 0.6 + Math.sin(t * 5) * 6, Math.min(w, h) * 0.2, { wave: 0.4 + Math.sin(t * 8) * 0.7 });
    if (t > 2.6 && t < 2.75) { g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(0, 0, w, h); drawSunny(g, w / 2, h * 0.6, Math.min(w, h) * 0.22, { mood: 'hollow' }); }
    requestAnimationFrame(draw);
  };
  draw();
  setTimeout(function () { say('SUNNY', en, ja, { voice: 'sunny', picoDark: 0.15 }); }, 300);
  setTimeout(function () { killScr(s, true); cb && cb(); }, 4200);
}
// ---- settings ----------------------------------------------------------------------------------------
function openSettings() {
  var S = SAVE.settings;
  var ov = el('div', 'ov dim pe', '', UI);
  var p = el('div', 'panel ssd-scroll', '<h2>Settings</h2>', ov); p.style.backgroundImage = 'url(' + PAPER.rules + ')';
  function slider(key, en, ja, min, max, step) {
    var r = el('div', 'row', '<div class="lb"><span>' + en + '</span><span class="ja">' + ja + '</span></div><input class="rng" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S[key] + '">', p);
    var inp = r.querySelector('input'); var upd = function () { inp.style.setProperty('--v', ((inp.value - min) / (max - min) * 100) + '%'); }; upd();
    inp.addEventListener('input', function () { S[key] = parseFloat(inp.value); upd(); applyVolumes(); writeSave(); });
    inp.addEventListener('change', function () { if (key === 'sfx') sfx('cup'); if (key === 'voice') say('SUNNY', 'Rise and shine!', 'おはよう！', { voice: 'sunny' }); });
  }
  function seg(key, en, ja, vals, labels, fn) {
    var r = el('div', 'row', '<div class="lb"><span>' + en + '</span><span class="ja">' + ja + '</span></div><div class="seg"></div>', p), sg = r.querySelector('.seg');
    vals.forEach(function (v, i) { var b = el('button', S[key] === v ? 'on' : '', labels[i], sg); onTap(b, function () { S[key] = v; writeSave(); sg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); sfx('click'); if (fn) fn(v); }); });
  }
  slider('bgm', 'MUSIC', '音楽（BGM）', 0, 1, 0.05); slider('sfx', 'SOUND FX', '効果音', 0, 1, 0.05); slider('voice', 'VOICE', '声', 0, 1, 0.05);
  seg('voiceMode', 'VOICE / 読み上げ', 'セリフの読み上げ', ['OFF', 'EN', 'JA'], ['OFF', 'ENGLISH', '日本語']);
  seg('voiceRate', 'VOICE SPEED', '読み上げの速さ', ['SLOW', 'NORMAL', 'FAST'], ['ゆっくり', 'ふつう', 'はやい']);
  slider('sens', 'LOOK SENSITIVITY', '視点の感度', 0.4, 2, 0.1);
  seg('quality', 'QUALITY', '画質', ['AUTO', 'LOW', 'MEDIUM', 'HIGH'], ['AUTO', 'LOW', 'MED', 'HIGH'], function (v) { setQuality(v); });
  seg('scare', 'JUMP SCARES', 'ジャンプスケアの強さ', ['NORMAL', 'MILD'], ['NORMAL', 'MILD']);
  var cb = el('button', 'mb pe docclose', icon('ok', 30) + '<span class="tx"><span class="en">DONE</span><span class="ja">とじる</span></span>', ov); pressFX(cb);
  onTap(cb, function () { sfx('paper'); ov.parentNode.removeChild(ov); });
}
// ---- archive -----------------------------------------------------------------------------------------------
var ANOM_INFO = {
  faceless: ['The guest with no face', '顔のない客'], offmenu: ['Not on the menu', 'メニューにない注文'], phone: ['The pink phone', 'ピンクの電話'], sunny: ['Sunny calls your name', '名前を呼ぶ Sunny'],
  booth4: ['3 AM, Booth 4', '午前3時の4番席'], jukebox: ['The jukebox changes the song', '勝手に変わる曲'], reflection: ['The wrong reflection', 'ちがう映り込み'], doppel: ['The same guest twice', '2回来た客'],
  headlights: ['High beams in the lot', '消えないヘッドライト'], backdoor: ['Knocking at the back door', '裏口のノック'], dayshift: ['The day shift', '日勤']
};
function openArchive() {
  var ov = el('div', 'ov dim pe', '', UI), p = el('div', 'panel ssd-scroll', '<h2>Archive</h2><div class="tabs"></div><div class="body"></div>', ov); p.style.backgroundImage = 'url(' + PAPER.rules + ')';
  var tabs = p.querySelector('.tabs'), body = p.querySelector('.body');
  var T = [['RECORD', function () {
    body.innerHTML = '<div class="arow">' + icon('ticket', 22) + '<div><div class="t">NIGHTS CLEARED: ' + (SAVE.clears || 0) + ' / 5</div><div class="d">クリアした日数</div></div></div><div class="arow">' + icon('coin', 22) + '<div><div class="t">BEST TIPS: ' + fmtMoney(SAVE.bestTips || 0) + '</div><div class="d">一晩のチップ最高記録 · 合計 ' + fmtMoney(SAVE.totalTips || 0) + '</div></div></div><div class="arow">' + icon('stop', 22) + '<div><div class="t">TIMES CAUGHT: ' + (SAVE.deaths || 0) + '</div><div class="d">つかまった回数</div></div></div><div class="arow">' + icon('ok', 22) + '<div><div class="t">ENDINGS: ' + (SAVE.normalEnd ? 'NORMAL ' : '') + (SAVE.trueEnd ? '· TRUE' : '') + '</div><div class="d">見たエンディング</div></div></div>';
  }], ['ANOMALIES', function () {
    body.innerHTML = ''; RULES.forEach(function (r) { var s = SAVE.anomalies[r.id] || 0, inf = ANOM_INFO[r.id]; el('div', 'arow' + (s ? '' : ' lock'), icon(s === 2 ? 'ok' : s ? 'eye' : 'eyeoff', 22) + '<div><div class="t">' + (s ? inf[0] : '? ? ?') + '</div><div class="d">' + (s ? inf[1] + (s === 2 ? '（対応できた）' : '（遭遇した）') : 'まだ見ていない') + '</div></div>', body); });
  }], ['LORE', function () {
    body.innerHTML = ''; LORE.forEach(function (L) { var got = SAVE.lore[L.id]; var r = el('div', 'arow' + (got ? ' btn' : ' lock'), icon(got ? 'archive' : 'eyeoff', 22) + '<div><div class="t">' + (got ? L.y + ' · ' + L.t : '? ? ?') + '</div><div class="d">' + (got ? L.ja : '店のどこかにある') + '</div></div>', body); if (got) onTap(r, function () { openDocs(L.make(), {}); }); });
  }], ['TV', function () {
    body.innerHTML = ''; var r = el('div', 'arow' + (SAVE.trueEnd ? ' btn' : ' lock'), icon('play', 22) + '<div><div class="t">' + (SAVE.trueEnd ? 'SUNNY SIDE DINER — TV COMMERCIAL' : '? ? ?') + '</div><div class="d">' + (SAVE.trueEnd ? 'テレビの中のCMをもう一度見る' : 'トゥルーエンドを見ると解放') + '</div></div>', body);
    if (SAVE.trueEnd) onTap(r, function () { ov.parentNode.removeChild(ov); hideTitle(); stopMusic(0.5); playTVCommercial(function () { showTitle(); }); });
  }]];
  T.forEach(function (t, i) { var b = el('button', i ? '' : 'on', t[0], tabs); onTap(b, function () { tabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); sfx('paper'); t[1](); }); });
  T[0][1]();
  var cb = el('button', 'mb pe docclose', icon('ok', 30) + '<span class="tx"><span class="en">DONE</span><span class="ja">とじる</span></span>', ov); pressFX(cb);
  onTap(cb, function () { sfx('paper'); ov.parentNode.removeChild(ov); });
}
// ---- endings --------------------------------------------------------------------------------------------
function finale() {
  var all = loreCount() >= 15, clean = !GAME.missedJune;
  if (all && clean) { SAVE.trueEnd = 1; writeSave(); trueEnding(); }
  else { SAVE.normalEnd = 1; writeSave(); normalEnding(all); }
}
function endText(en, ja, sec) { return new Promise(function (res) { var d = scr('', '<div class="endtxt"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>'); d.style.background = 'rgba(0,0,0,0.0)'; setTimeout(function () { killScr(d, true); setTimeout(res, 500); }, sec * 1000); }); }
async function normalEnding(all) {
  GAME.mode = 'cut'; PU.uBlack.value = 0.6;
  playMusic('title', { vol: 0.7 });
  await endText('You drive away as the sun comes up.<br>In the mirror, the sign is still on.', '朝日の中、車を走らせる。ミラーの中で、看板はまだ光っている。', 5);
  await endText('A week later, the paper runs the same ad:<br><b>NIGHT SHIFT WANTED</b>', '1週間後、新聞にまた同じ広告が載った。「深夜スタッフ募集」', 5);
  await endText(all ? 'Some things still don\'t add up...' : 'There is more to this diner.<br>(Find every record to learn the truth.)', all ? 'まだ何かが、引っかかる……' : 'この店には、まだ秘密がある。（記録をすべて集めると……）', 4.5);
  PU.uBlack.value = 0; showTitle();
}
async function trueEnding() {
  GAME.mode = 'cut';
  await say('JUNE', 'Rise and shine, partner. You read everything, didn\'t you? Then you know.', 'Rise and shine。ぜんぶ読んだんだね。なら、わかってるだろう。', { voice: 'june' });
  await say('JUNE', 'Somebody has to keep the light on.', 'だれかが、明かりをつけていなきゃならない。', { voice: 'june', rate: 0.85 });
  playTVCommercial(function () { showTitle(); });
}
// the old CM on the CRT above the counter; lyrics karaoke; last line cuts to tonight
function playTVCommercial(done) {
  GAME.mode = 'cut'; setGameHUD(false); clearWorld(); camSetStation('COUNTER', true);
  LSTATE.coldT = 0.2; FX.rainT = 0.6; LSTATE.lightsOn = true; LSTATE.neonOn = true;
  // name tag on the counter
  var tc = mkCanvas(256, 128), tg = tc.getContext('2d'); tg.fillStyle = '#c8282e'; tg.fillRect(0, 0, 256, 128); tg.fillStyle = '#fff'; tg.fillRect(8, 40, 240, 80); tg.font = '24px ' + F.slab; tg.textAlign = 'center'; tg.fillText('HELLO my name is', 128, 30); tg.fillStyle = '#1d2f6f'; tg.font = '50px ' + F.hand; tg.fillText(SAVE.name || 'Sam', 128, 98);
  var tag = mesh(new THREE.PlaneGeometry(0.12, 0.06), new THREE.MeshStandardMaterial({ map: toTex(tc, { clamp: true }), roughness: 0.4 }), 0.55, D.counterY + 0.003, -1.55, RENDER.scene, false); tag.rotation.x = -PI / 2; tag.rotation.z = 0.25;
  var tv = WORLD.tv, sc = new THREE.Vector3(-0.06, 0.02, 0.176); tv.localToWorld(sc);
  var nrm = new THREE.Vector3(Math.sin(tv.rotation.y), 0, Math.cos(tv.rotation.y));
  var p0 = sc.clone().add(nrm.clone().multiplyScalar(2.4)).add(new THREE.Vector3(0.3, -0.45, 0)), p1 = sc.clone().add(nrm.clone().multiplyScalar(0.5));
  CAM.override = { pos: p0.clone(), target: sc.clone(), k: 1, dur: 1 };
  var cmC = mkCanvas(512, 384), cmT = toTex(cmC, { clamp: true, nomip: true }); var oldMap = WORLD.tvMat.map; WORLD.tvMat.map = cmT; WORLD.tvMat.needsUpdate = true; TV.mode = 'cm';
  // live view of tonight's counter (for the last line)
  var liveRT = new THREE.WebGLRenderTarget(512, 384), liveCam = new THREE.PerspectiveCamera(50, 4 / 3, 0.05, 50); liveCam.position.set(0.9, 1.5, -2.4); liveCam.lookAt(0.55, 1.06, -1.5);
  var faces = ARCH.slice(0, 8).map(function (a) { var o = {}; for (var k in a.o) o[k] = a.o[k]; o.seed = 7; o.smile = 1; var c = faceCanvas(o), g = c.getContext('2d');
    // paint the hair / hat back on so they read as people in the old film
    g.fillStyle = o.hat ? (o.hatC || '#6b4a2a') : (o.hairC || '#3a2618');
    g.beginPath(); g.ellipse(128, 70, 62, o.hair === 'bald' ? 10 : 34, 0, PI, 0); g.fill(); g.fillRect(66, 66, 124, o.hat ? 8 : 14);
    if (o.hair === 'long' || o.hair === 'pony' || o.hair === 'bob' || o.hair === 'beehive') { g.fillRect(66, 66, 14, 90); g.fillRect(176, 66, 14, 90); }
    if (o.hair === 'beehive') { g.beginPath(); g.ellipse(128, 50, 50, 40, 0, 0, TAU); g.fill(); }
    return c; });
  var lyr = scr('', '<div class="lyr"><div class="e"><span class="t"></span><b></b></div><div class="j"></div></div>'); lyr.style.pointerEvents = 'none';
  var started = performance.now(), ended = false, cut = false, off = false;
  var skip = el('button', 'mb pe hidden', icon('skip', 30) + '<span class="tx"><span class="en">SKIP</span><span class="ja">スキップ</span></span>', UI); skip.style.cssText = 'position:absolute;right:20px;top:calc(var(--top-safe) + 8px);min-width:140px;';
  setTimeout(function () { skip.classList.remove('hidden'); }, 2000); pressFX(skip); onTap(skip, function () { finish(); });
  playMusic('title', { vol: 0.95, loop: false, tv: true, restart: true, onEnd: function () { tvOff(); } });
  function finish() { if (ended) return; ended = true; stopMusic(0.3); killScr(lyr); if (skip.parentNode) skip.parentNode.removeChild(skip); RENDER.scene.remove(tag); WORLD.tvMat.map = WORLD.tvTex; WORLD.tvMat.needsUpdate = true; TV.mode = 'show'; liveRT.dispose(); cmT.dispose(); PU.uBlack.value = 1; setTimeout(function () { PU.uBlack.value = 0; CAM.override = null; done && done(); }, 900); }
  function tvOff() { if (off) return; off = true; var t0 = performance.now(); var st = function () { var k = (performance.now() - t0) / 700; var g = cmC.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 384); var hh = Math.max(2, 384 * (1 - k * 1.4)), ww = k > 0.7 ? 512 * (1 - (k - 0.7) * 3) : 512; g.fillStyle = '#fff'; g.fillRect(256 - ww / 2, 192 - hh / 2, ww, hh); cmT.needsUpdate = true; if (k < 1.05) requestAnimationFrame(st); else { sfx('zap', null, { vol: 0.4 }); setTimeout(finish, 600); } }; sfx('static', null, { len: 0.3 }); requestAnimationFrame(st); }
  var step = function () {
    if (ended) return; requestAnimationFrame(step);
    var mt = musicTime(); if (mt < 0) mt = (performance.now() - started) / 1000 - 0.5;
    var k = clamp((performance.now() - started) / 7000, 0, 1), e = k * k * (3 - 2 * k);
    CAM.override.pos.copy(p0).lerp(p1, e); CAM.override.target.copy(sc);
    // lyrics
    var cur = -1; for (var i = 0; i < LYRICS.length; i++) if (mt >= LYRICS[i][0]) cur = i;
    if (cur >= 0) { var L = LYRICS[cur], nx = LYRICS[cur + 1] ? LYRICS[cur + 1][0] : (MUSIC.dur || L[0] + 5); var f = clamp((mt - L[0]) / Math.max(0.5, nx - L[0] - 0.3), 0, 1);
      var te = lyr.querySelector('.t'); if (te.textContent !== L[1]) { te.textContent = L[1]; lyr.querySelector('b').textContent = L[1]; lyr.querySelector('.j').textContent = L[2]; }
      lyr.querySelector('.e').style.setProperty('--w', (f * 100).toFixed(1) + '%'); }
    if (off) return;
    // the TV picture
    if (mt >= LYRIC_LAST_CUT && mt < LYRIC_LAST_CUT + 1.8) {
      if (!cut) { cut = true; sfx('static', null, { len: 0.2 }); }
      var rr = RENDER.renderer; var envS = RENDER.scene.environment; WORLD.tvScreen.visible = false; rr.setRenderTarget(liveRT); rr.render(RENDER.scene, liveCam); rr.setRenderTarget(null); WORLD.tvScreen.visible = true;
      WORLD.tvMat.map = liveRT.texture; WORLD.tvMat.needsUpdate = true; return;
    }
    if (cut && mt >= LYRIC_LAST_CUT + 1.8) { tvOff(); return; }
    WORLD.tvMat.map = cmT;
    drawCM(cmC.getContext('2d'), 512, 384, mt, faces); cmT.needsUpdate = true;
  };
  step();
}
function drawCM(g, w, h, t, faces) {
  var scene = Math.floor(t / 4.2) % 5;
  var gr = g.createLinearGradient(0, 0, 0, h);
  if (scene === 0) { // exterior, daytime
    gr.addColorStop(0, '#9ad8f0'); gr.addColorStop(1, '#f6e0a8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8c890'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = '#d8dde2'; g.fillRect(w * 0.15, h * 0.45, w * 0.7, h * 0.25); g.fillStyle = '#c8282e'; g.fillRect(w * 0.15, h * 0.52, w * 0.7, h * 0.03);
    g.fillStyle = '#5be8ff'; for (var i = 0; i < 6; i++) g.fillRect(w * 0.18 + i * w * 0.11, h * 0.57, w * 0.08, h * 0.08);
    g.fillStyle = '#c8282e'; g.font = '44px ' + F.logo; g.textAlign = 'center'; g.fillText('Sunny Side', w / 2, h * 0.38);
    drawSunny(g, w * 0.86, h * 0.34, 40, { wave: Math.sin(t * 6) });
  } else if (scene === 1 || scene === 3) { // bright interior, smiling customers (the ones you met)
    gr.addColorStop(0, '#fff2cf'); gr.addColorStop(1, '#f0c890'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (var y = 0; y < 2; y++) for (var x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#222' : '#eee'; g.fillRect(x * w / 8, h * 0.85 + y * h * 0.075, w / 8, h * 0.075); }
    g.fillStyle = '#c8282e'; g.fillRect(0, h * 0.6, w, h * 0.25); g.fillStyle = '#d8dde2'; g.fillRect(0, h * 0.58, w, h * 0.03);
    var off = scene === 1 ? 0 : 4;
    for (var k = 0; k < 4; k++) { var fc = faces[(k + off) % faces.length], cx = w * (0.14 + k * 0.24), cy = h * 0.42 + Math.sin(t * 3 + k) * 3; g.save(); g.beginPath(); g.ellipse(cx, cy, 42, 52, 0, 0, TAU); g.clip(); g.drawImage(fc, 128 - 52, 128 - 70, 104, 140, cx - 46, cy - 58, 92, 124); g.restore(); g.fillStyle = ['#8c1f1f', '#e98aa9', '#4a4e5a', '#8fd3c1'][k]; g.fillRect(cx - 40, cy + 50, 80, 60); }
    drawSunny(g, w * 0.5, h * 0.2, 26, { wave: Math.sin(t * 7) });
  } else if (scene === 2) { // Sunny big
    gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f2a24e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2); g.rotate(t * 0.4); for (var r = 0; r < 14; r++) { g.fillStyle = r % 2 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 400, r / 14 * TAU, (r + 0.5) / 14 * TAU); g.fill(); } g.restore();
    drawSunny(g, w / 2, h * 0.5 + Math.sin(t * 5) * 6, 80, { wave: Math.sin(t * 8) });
    g.fillStyle = '#c8282e'; g.font = '40px ' + F.logo; g.textAlign = 'center'; g.fillText('Rise and shine!', w / 2, h * 0.14);
  } else { // pancakes & coffee + logo card
    g.fillStyle = '#8fd3c1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fbf3e0'; g.beginPath(); g.ellipse(w * 0.36, h * 0.66, 120, 34, 0, 0, TAU); g.fill();
    for (var p = 0; p < 4; p++) { g.fillStyle = '#c98a3c'; g.beginPath(); g.ellipse(w * 0.36, h * 0.6 - p * 18, 90, 22, 0, 0, TAU); g.fill(); g.fillStyle = '#e8b870'; g.fillRect(w * 0.36 - 90, h * 0.6 - p * 18, 180, 8); }
    g.fillStyle = '#ffe9a0'; g.fillRect(w * 0.33, h * 0.44, 24, 12);
    g.fillStyle = '#fff'; g.fillRect(w * 0.68, h * 0.5, 70, 70); g.fillStyle = '#3a1a08'; g.fillRect(w * 0.68 + 6, h * 0.5 + 6, 58, 12);
    g.fillStyle = '#c8282e'; g.font = '46px ' + F.logo; g.textAlign = 'center'; g.fillText('Sunny Side Diner', w / 2, h * 0.2); g.font = '20px ' + F.slab; g.fillStyle = '#7e1418'; g.fillText('OPEN 24 HOURS', w / 2, h * 0.3);
  }
  // old film / CRT treatment
  g.fillStyle = 'rgba(0,0,0,0.16)'; for (var s = 0; s < h; s += 3) g.fillRect(0, s, w, 1);
  if (Math.random() < 0.08) { var yy = Math.random() * h; g.drawImage(g.canvas, 0, yy, w, 20, 8, yy, w, 20); }
  var vg = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,10,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
// ---- init ------------------------------------------------------------------------------------------------
function initGame() {
  buildUI(); buildPapers(); buildRail(); buildMiniUI();
  var st = document.createElement('style'); st.textContent = MAP_CSS + '\n' + SCR_CSS; (document.head || document.documentElement).appendChild(st);
  buildHotspots(); initVoices(); preloadFaces();
  onTap(U.pause, function () { sfx('click'); pauseGame(); });
  onTap(U.rulesBtn, function () { sfx('click'); if (GAME.mode === 'play') showRules(); });
  onTap(U.mapBtn, function () { sfx('click'); if (GAME.mode === 'play') toggleMap(); });
  onFrame(updateGame);
  onFrame(function (dt) { drawCMFrame(dt); if (GAME.mode === 'title' && CAM.override && !SCR.warn) { CAM.titleDrift = (CAM.titleDrift || 0) + dt; CAM.override.pos.set(-4.6 + Math.sin(CAM.titleDrift * 0.07) * 1.2, 1.35, 16.5 - Math.sin(CAM.titleDrift * 0.05) * 1.5); } });
  CAM.override = { pos: new THREE.Vector3(-4.6, 1.35, 16.5), target: new THREE.Vector3(-1.2, 2.3, 4), k: 1, dur: 1 };
  FX.rainT = 1;
  if (DEV && /[?&]skipwarn/.test(location.search)) { audioUnlock(); showTitle(); } else showWarning();
}


// ===== 99_main.js =====
// ---- boot sequence & main loop -------------------------------------------------
var CLOCK = { t: 0, last: 0, dt: 0, paused: false };
var HOOKS = []; // per-frame updaters fn(dt,t)
function onFrame(fn) { HOOKS.push(fn); }
function bakeEnvironment() {
  var ex = [WORLD.window];
  try { RENDER.scene.environment = bakeEnv(new THREE.Vector3(0.4, 1.7, 0.6), ex); } catch (e) { BOOT_ERRORS.push('env ' + e.message); }
}
function mainLoop() {
  requestAnimationFrame(mainLoop);
  var n = performance.now() / 1000, dt = Math.min(DEV ? 0.25 : 0.05, n - (CLOCK.last || n)); CLOCK.last = n;
  CLOCK.dt = dt; CLOCK.t += dt;
  var t = CLOCK.t;
  try {
    for (var i = 0; i < HOOKS.length; i++) HOOKS[i](dt, t);
    updateLights(dt, t);
    updateCamera(dt, t);
    PU.uTime.value = t;
    renderFrame();
    adaptQuality(dt);
  } catch (e) { if (!mainLoop.err) { mainLoop.err = 1; BOOT_ERRORS.push('loop ' + e.message); console.error(e); } }
}
function boot() {
  setupPage();
  loadSave();
  loadThree(function () {
    waitFonts(function () {
      try {
        initRenderer();
        buildTextures();
        buildMaterials();
        buildDiner();
        buildLights();
        if (typeof buildFX === 'function') buildFX();
        camSetStation('COUNTER', true);
        WORLD.focusables = [WORLD.interior];
        initInput();
        RENDER.renderer.shadowMap.needsUpdate = true;
        RENDER.renderer.render(RENDER.scene, RENDER.camera);
        bakeEnvironment();
        RENDER.shadowDirty = true;
        if (typeof initGame === 'function') initGame();
        window.__ssdReady = true;
        mainLoop();
      } catch (e) { console.error(e); showFatal('起動中にエラーが起きました', (e && e.stack) || String(e)); }
    });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();


})();
