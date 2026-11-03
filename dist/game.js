/*! Hollow Pines Night School — game.js (single-file build). See source.txt */
(function(){
"use strict";

// ===== 00_boot.js =====
// ---------------------------------------------------------------------------
// BASE_URL : the ONLY place to change when publishing (must end with "/").
// If game.js is loaded through <script src=".../game.js">, the folder of that
// script is detected automatically and used instead (safer).
// ---------------------------------------------------------------------------
var BASE_URL = 'https://hollow-pines-night-school.netlify.app/';
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '1.0.0';

var ASSET_BASE = BASE_URL;
(function detectBase() {
  try {
    var cs = document.currentScript;
    var src = cs && cs.src;
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

// ---- diagnostics overlay --------------------------------------------------
function showFatal(title, detail) {
  try {
    var d = document.getElementById('hp-fatal');
    if (!d) {
      d = document.createElement('div'); d.id = 'hp-fatal';
      d.style.cssText = 'position:fixed;left:16px;right:16px;top:calc(env(safe-area-inset-top,0px) + 120px);z-index:2147483647;background:#1a0606;color:#ffdede;border:2px solid #c22;padding:14px;font:13px/1.5 monospace;white-space:pre-wrap;border-radius:6px;max-height:60vh;overflow:auto;';
      (document.body || document.documentElement).appendChild(d);
    }
    d.textContent = '[Hollow Pines] ' + title + '\n' + (detail || '') + '\n\nASSET_BASE: ' + ASSET_BASE + '\nUA: ' + navigator.userAgent;
  } catch (e) {}
}
window.addEventListener('error', function (e) {
  var msg = (e && e.message) || 'error';
  BOOT_ERRORS.push(msg);
  if (window.__HP_DEBUG) showFatal('Runtime error', msg + '\n' + (e.filename || '') + ':' + (e.lineno || ''));
});

// ---- page setup -----------------------------------------------------------
function setupPage() {
  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  // viewport: no zoom, cover the notch
  try {
    var vp = document.querySelector('meta[name=viewport]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; head.appendChild(vp); }
    vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  } catch (e) {}
  // fonts (Google Fonts only)
  try {
    var pre = document.createElement('link'); pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = 'anonymous'; head.appendChild(pre);
    var lk = document.createElement('link'); lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Bungee&family=Luckiest+Guy&family=Special+Elite&family=VT323&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap';
    head.appendChild(lk);
  } catch (e) {}

  var st = document.createElement('style'); st.id = 'hp-style'; st.textContent = BASE_CSS; head.appendChild(st);

  ROOT = document.createElement('div'); ROOT.id = 'hp-root';
  CANVAS_HOST = document.createElement('div'); CANVAS_HOST.id = 'hp-canvas';
  UI = document.createElement('div'); UI.id = 'hp-ui';
  ROOT.appendChild(CANVAS_HOST); ROOT.appendChild(UI);
  (document.body || document.documentElement).appendChild(ROOT);
  try { document.documentElement.classList.add('hp-lock'); document.body.classList.add('hp-lock'); } catch (e) {}

  // block page zoom / scroll / context menus / text selection
  var stop = function (e) { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (n) {
    ROOT.addEventListener(n, stop, { passive: false });
  });
  document.addEventListener('gesturestart', stop, { passive: false });
  ROOT.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.hp-scroll')) e.preventDefault(); }, { passive: false });
  var lastTouchEnd = 0;
  ROOT.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouchEnd < 320 && !(e.target.closest && e.target.closest('input,select'))) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}

var BASE_CSS = [
  'html.hp-lock,body.hp-lock{margin:0;padding:0;overflow:hidden;height:100%;background:#000;overscroll-behavior:none;}',
  '#hp-root{position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;background:#000;overflow:hidden;z-index:2147480000;',
  ' touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;',
  ' --top-safe:calc(env(safe-area-inset-top,0px) + 110px);--bot-safe:calc(env(safe-area-inset-bottom,0px) + 12px);',
  ' font-family:"Zen Kaku Gothic New",system-ui,-apple-system,sans-serif;color:#fff;}',
  '#hp-root *{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
  '#hp-canvas{position:absolute;inset:0;}',
  '#hp-canvas canvas{display:block;width:100%;height:100%;touch-action:none;}',
  '#hp-ui{position:absolute;inset:0;pointer-events:none;}',
  '#hp-ui .pe{pointer-events:auto;}'
].join('\n');

// ---- load three.js (cdnjs r128) ---------------------------------------------
var THREE; // local reference used by the whole game
function loadThree(cb) {
  if (window.THREE && window.THREE.REVISION === '128') { THREE = window.THREE; return cb(); }
  var prev = window.THREE;
  var s = document.createElement('script');
  s.src = THREE_URL; s.async = true; s.crossOrigin = 'anonymous';
  var to = setTimeout(function () { showFatal('three.js の読み込みがタイムアウトしました (timeout)', THREE_URL); }, 20000);
  s.onload = function () {
    clearTimeout(to);
    THREE = window.THREE;
    if (prev && prev !== THREE) { window.THREE = prev; }
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
var SAVE_KEY = 'hollowpines_ns_v1';
var SAVE = {
  bestNight: 0, clears: 0, nightsSurvived: 0, deaths: 0, monsters: {}, lore: {}, continueNight: 0,
  settings: { bgm: 0.7, sfx: 0.9, sens: 1.0, quality: 'AUTO', scare: 'NORMAL', invertY: false, subtitles: true }
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
// test hook (only when the page URL contains ?hptest)
try { if (/[?&]hptest/.test(location.search)) window.__hpEval = function (s) { return eval(s); }; } catch (e) {}


// ===== 02_tex.js =====
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


// ===== 03_audio.js =====
// ---- audio: BGM (media elements -> WebAudio), synthesized SFX, 3D panning ---
var AU = { ctx: null, master: null, bgmBus: null, sfxBus: null, comp: null, noise: null, pink: null, tracks: {}, cur: null, loops: {}, ready: false, unlocked: false, voices: [], listenerPos: null };

function initAudio() {
  if (AU.ctx) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { AU.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { AU.ctx = new AC(); } catch (e2) { return; } }
  var c = AU.ctx;
  AU.comp = c.createDynamicsCompressor(); AU.comp.threshold.value = -10; AU.comp.knee.value = 8; AU.comp.ratio.value = 6; AU.comp.attack.value = 0.003; AU.comp.release.value = 0.2;
  AU.master = c.createGain(); AU.master.gain.value = 1;
  AU.bgmBus = c.createGain(); AU.sfxBus = c.createGain(); AU.scareBus = c.createGain();
  AU.bgmBus.connect(AU.master); AU.sfxBus.connect(AU.comp); AU.scareBus.connect(AU.master); AU.comp.connect(AU.master); AU.master.connect(c.destination);
  // reverb (procedural impulse) for hallway feel
  AU.verb = c.createConvolver(); AU.verb.buffer = makeImpulse(2.6, 2.2); AU.verbGain = c.createGain(); AU.verbGain.gain.value = 0.35;
  AU.verb.connect(AU.verbGain); AU.verbGain.connect(AU.comp);
  var len = c.sampleRate * 2, nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0);
  for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AU.noise = nb;
  var pb = c.createBuffer(1, len, c.sampleRate), pd = pb.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
  for (var j = 0; j < len; j++) { var w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; pd[j] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
  AU.pink = pb;
  applyVolumes();
  ['happy', 'nursery'].forEach(function (n) { AU.tracks[n] = makeTrack(n); });
  AU.ready = true;
}
function makeImpulse(sec, decay) {
  var c = AU.ctx, len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 200 ? i / 200 : 1); }
  return b;
}
function makeTrack(name) {
  var a = new Audio();
  a.crossOrigin = 'anonymous'; a.loop = true; a.preload = 'auto';
  a.setAttribute('playsinline', ''); a.setAttribute('webkit-playsinline', '');
  try { a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; } catch (e) {}
  var t = { el: a, gain: AU.ctx.createGain(), routed: false, name: name, vol: 0, failed: false };
  t.gain.gain.value = 0; t.gain.connect(AU.bgmBus);
  var tried = false;
  a.addEventListener('error', function () {
    if (!tried) { tried = true; t.failed = true; var b = new Audio(); b.loop = true; b.preload = 'auto'; b.setAttribute('playsinline', ''); b.src = assetURL('audio/' + name + '.m4a'); t.el = b; t.routed = false; t.direct = true; console.warn('[HP] audio CORS fallback for', name); }
  });
  a.src = assetURL('audio/' + name + '.m4a');
  try { var src = AU.ctx.createMediaElementSource(a); src.connect(t.gain); t.routed = true; } catch (e) { t.routed = false; t.direct = true; }
  return t;
}
// must be called inside a user gesture (TAP TO START)
function unlockAudio() {
  initAudio();
  if (!AU.ctx) return;
  try { if (AU.ctx.state === 'suspended') AU.ctx.resume(); } catch (e) {}
  var o = AU.ctx.createOscillator(), g = AU.ctx.createGain(); g.gain.value = 0.0001; o.connect(g); g.connect(AU.ctx.destination); o.start(); o.stop(AU.ctx.currentTime + 0.05);
  for (var n in AU.tracks) { (function (t) { var el = t.el; var p = el.play(); if (p && p.then) p.then(function () { if (AU.cur !== t.name) el.pause(); }).catch(function () {}); })(AU.tracks[n]); }
  try { if (window.speechSynthesis) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } } catch (e) {}
  AU.unlocked = true;
}
document.addEventListener('visibilitychange', function () {
  if (!AU.ctx) return;
  if (document.hidden) { try { AU.ctx.suspend(); } catch (e) {} for (var n in AU.tracks) AU.tracks[n].el.pause(); }
  else { try { AU.ctx.resume(); } catch (e) {} if (AU.cur && AU.tracks[AU.cur]) AU.tracks[AU.cur].el.play().catch(function () {}); }
});
function applyVolumes() {
  if (!AU.ctx) return;
  var s = SAVE.settings;
  AU.bgmBus.gain.value = s.bgm * 0.8;
  AU.sfxBus.gain.value = s.sfx;
  AU.scareBus.gain.value = s.sfx * (s.scare === 'MILD' ? 0.35 : 1);
  for (var n in AU.tracks) { var t = AU.tracks[n]; if (t.direct) t.el.volume = (AU.cur === n ? 1 : 0) * s.bgm * 0.8; }
}
// play BGM: name or null. cut=true -> instant stop (lights out)
function playBGM(name, opt) {
  opt = opt || {};
  if (!AU.ctx) return;
  var c = AU.ctx, t0 = c.currentTime;
  for (var n in AU.tracks) {
    var t = AU.tracks[n];
    if (n === name) continue;
    if (AU.cur === n || t.el && !t.el.paused) {
      t.gain.gain.cancelScheduledValues(t0);
      if (opt.cut) { t.gain.gain.setValueAtTime(0, t0); t.el.pause(); if (t.direct) t.el.volume = 0; }
      else { t.gain.gain.setValueAtTime(t.gain.gain.value, t0); t.gain.gain.linearRampToValueAtTime(0, t0 + (opt.fade || 1)); (function (el, tt) { setTimeout(function () { if (AU.cur !== tt.name) el.pause(); }, (opt.fade || 1) * 1000 + 50); })(t.el, t); if (t.direct) t.el.volume = 0; }
    }
  }
  AU.cur = name;
  if (!name) return;
  var tr = AU.tracks[name];
  if (!tr) return;
  tr.el.playbackRate = 1;
  if (opt.restart) { try { tr.el.currentTime = 0; } catch (e) {} }
  var p = tr.el.play(); if (p && p.catch) p.catch(function () {});
  tr.gain.gain.cancelScheduledValues(t0);
  tr.gain.gain.setValueAtTime(tr.gain.gain.value, t0);
  tr.gain.gain.linearRampToValueAtTime(1, t0 + (opt.fade != null ? opt.fade : 1.2));
  if (tr.direct) tr.el.volume = SAVE.settings.bgm * 0.8;
}
function setBGMRate(r) { var t = AU.tracks[AU.cur]; if (t) { try { t.el.playbackRate = r; } catch (e) {} } }

// ---- helpers ---------------------------------------------------------------
function AT() { return AU.ctx.currentTime; }
function outNode(pos, opt) {
  // returns a node to connect sources into. positional if pos provided.
  var c = AU.ctx; opt = opt || {};
  var g = c.createGain(); g.gain.value = opt.gain != null ? opt.gain : 1;
  if (pos) {
    var p = c.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = opt.ref || 1.5; p.maxDistance = 60; p.rolloffFactor = opt.roll || 1.1;
    var y = pos.y != null ? pos.y : LV_Y[pos.li || 1] + 1.2;
    // different floor -> muffle & attenuate
    var lp = null;
    if (PL && pos.li != null && pos.li !== PL.li) { lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; g.gain.value *= 0.45; }
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, y, pos.z);
    if (lp) { g.connect(lp); lp.connect(p); } else g.connect(p);
    p.connect(opt.bus || AU.sfxBus);
    if (opt.verb !== false) { var sv = c.createGain(); sv.gain.value = opt.verbAmt != null ? opt.verbAmt : 0.5; p.connect(sv); sv.connect(AU.verb); }
    g._panner = p;
  } else {
    g.connect(opt.bus || AU.sfxBus);
    if (opt.verb) { var sv2 = c.createGain(); sv2.gain.value = opt.verbAmt || 0.3; g.connect(sv2); sv2.connect(AU.verb); }
  }
  return g;
}
function env(g, t, a, peak, d, sustain, r, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain || 0.0001), t + a + d);
  if (dur) { g.gain.setValueAtTime(Math.max(0.0001, sustain || 0.0001), t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (r || 0.1)); }
}
function osc(type, f, t, dur, dest, gain, opt) {
  var c = AU.ctx; opt = opt || {};
  var o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (opt.f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f2), t + (opt.glide || dur));
  if (opt.detune) o.detune.value = opt.detune;
  var g = c.createGain(); o.connect(g);
  var last = g;
  if (opt.filter) { var f1 = c.createBiquadFilter(); f1.type = opt.filter; f1.frequency.value = opt.ff || 1000; f1.Q.value = opt.q || 1; g.connect(f1); last = f1; }
  last.connect(dest);
  env(g, t, opt.a || 0.005, gain, opt.d || dur, opt.s || 0.0001, opt.r, opt.hold);
  o.start(t); o.stop(t + dur + (opt.r || 0.1) + (opt.hold || 0) + 0.05);
  return { o: o, g: g };
}
function noise(t, dur, dest, gain, opt) {
  var c = AU.ctx; opt = opt || {};
  var s = c.createBufferSource(); s.buffer = opt.pink ? AU.pink : AU.noise; s.loop = true;
  s.playbackRate.value = opt.rate || 1;
  var f = c.createBiquadFilter(); f.type = opt.type || 'bandpass'; f.frequency.setValueAtTime(opt.f || 1000, t); f.Q.value = opt.q || 1;
  if (opt.f2) f.frequency.exponentialRampToValueAtTime(opt.f2, t + dur);
  var g = c.createGain(); s.connect(f); f.connect(g); g.connect(dest);
  env(g, t, opt.a || 0.002, gain, opt.d || dur, opt.s || 0.0001, opt.r, opt.hold);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + (opt.r || 0.1) + (opt.hold || 0) + 0.05);
  return { s: s, f: f, g: g };
}
function distCurve(k) { var n = 1024, cv = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; cv[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return cv; }

// ---- SFX library --------------------------------------------------------------
var STEP_TONE = {}; STEP_TONE[M_LINO] = [1800, 0.9]; STEP_TONE[M_LINO2] = [1800, 0.9]; STEP_TONE[M_GYM] = [600, 1.1]; STEP_TONE[M_TILE] = [2600, 1.0]; STEP_TONE[M_TERRAZZO] = [2200, 1.0];
STEP_TONE[M_CARPET] = [400, 0.4]; STEP_TONE[M_CONCRETE] = [1200, 1.0]; STEP_TONE[M_ASPHALT] = [900, 0.8]; STEP_TONE[M_GRASS] = [500, 0.5]; STEP_TONE[M_BUS] = [700, 1.1];
function sfxStep(mat, loud, pos, opt) {
  if (!AU.ready) return;
  opt = opt || {};
  var t = AT() + 0.005, st = STEP_TONE[mat] || [1500, 1];
  var out = outNode(pos, { gain: 1, verbAmt: 0.6 });
  var v = (0.12 + loud * 0.35) * st[1] * (opt.gain || 1);
  noise(t, 0.05, out, v, { type: 'bandpass', f: st[0] * (0.85 + Math.random() * 0.3), q: 1.2, d: 0.06 });
  noise(t, 0.09, out, v * 0.7, { type: 'lowpass', f: 300 + loud * 200, q: 0.7, d: 0.1 });
  if (mat === M_LINO || mat === M_LINO2 || mat === M_GYM) if (Math.random() < 0.25 && loud > 0.3) osc('sine', 2400 + Math.random() * 800, t + 0.02, 0.06, out, v * 0.25, { f2: 1800 }); // sneaker squeak
  if (mat === M_GRASS) noise(t, 0.12, out, v * 0.5, { type: 'highpass', f: 3000, d: 0.12 });
}
function sfx(name, pos, o) {
  if (!AU.ready || !AU.ctx) return;
  o = o || {};
  var c = AU.ctx, t = AT() + 0.01, out;
  switch (name) {
    case 'click': out = outNode(null); noise(t, 0.02, out, 0.3, { type: 'highpass', f: 3000, d: 0.02 }); osc('square', 1800, t, 0.015, out, 0.05); break;
    case 'ui': out = outNode(null); osc('triangle', 880, t, 0.06, out, 0.12, { f2: 1320 }); break;
    case 'uiBack': out = outNode(null); osc('triangle', 660, t, 0.07, out, 0.1, { f2: 440 }); break;
    case 'door': out = outNode(pos, { verbAmt: 0.7 });
      osc('sawtooth', 180 + Math.random() * 60, t, 0.7, out, 0.05, { f2: 320, filter: 'bandpass', ff: 900, q: 8, a: 0.05, d: 0.7 });
      noise(t + 0.6, 0.12, out, 0.35, { type: 'lowpass', f: 400, d: 0.15 }); break;
    case 'doorBang': out = outNode(pos, { verbAmt: 0.9 }); noise(t, 0.25, out, 0.7, { type: 'lowpass', f: 500, d: 0.3 }); osc('sine', 80, t, 0.25, out, 0.5, { f2: 50 }); noise(t, 0.05, out, 0.3, { type: 'bandpass', f: 2500, d: 0.06 }); break;
    case 'rattle': out = outNode(pos); for (var r = 0; r < 4; r++) noise(t + r * 0.07, 0.04, out, 0.4, { type: 'bandpass', f: 1600 + r * 200, q: 6, d: 0.05 }); break;
    case 'lockerOpen': out = outNode(pos, { verbAmt: 0.8 }); metal(t, out, 0.4, 420); noise(t, 0.3, out, 0.08, { type: 'bandpass', f: 3000, q: 4, d: 0.3 }); break;
    case 'lockerClose': out = outNode(pos, { verbAmt: 0.9 }); metal(t, out, 0.7, 300); noise(t, 0.08, out, 0.5, { type: 'lowpass', f: 900, d: 0.1 }); break;
    case 'cough': out = outNode(null, { verb: true }); for (var k = 0; k < 3; k++) { noise(t + k * 0.28, 0.2, out, 0.5, { type: 'bandpass', f: 500 + k * 80, q: 2, d: 0.22 }); osc('sawtooth', 140 - k * 10, t + k * 0.28, 0.15, out, 0.08, { filter: 'lowpass', ff: 800 }); } break;
    case 'gasp': out = outNode(null); noise(t, 0.5, out, 0.25, { type: 'bandpass', f: 1200, f2: 2200, q: 1.5, a: 0.05, d: 0.5 }); break;
    case 'exhale': out = outNode(null); noise(t, 0.9, out, 0.18, { type: 'bandpass', f: 900, f2: 500, q: 1, a: 0.1, d: 0.9 }); break;
    case 'bell': bell(t, pos, false, o.len || 3.2); break;
    case 'bellBad': bell(t, pos, true, o.len || 3.6); break;
    case 'lightsOut': out = outNode(null, { verb: true, verbAmt: 0.8 });
      noise(t, 0.04, out, 1.0, { type: 'lowpass', f: 3000, d: 0.05 }); osc('sine', 60, t, 0.5, out, 0.8, { f2: 30 }); osc('square', 120, t, 0.08, out, 0.15, { filter: 'lowpass', ff: 600 });
      noise(t + 0.05, 1.5, out, 0.06, { type: 'lowpass', f: 200, d: 1.5 }); break;
    case 'lightsOn': out = outNode(null, { verb: true });
      for (var q = 0; q < 5; q++) { noise(t + q * 0.09 + Math.random() * 0.05, 0.02, out, 0.25, { type: 'highpass', f: 2500, d: 0.02 }); osc('square', 120, t + q * 0.09, 0.03, out, 0.03); } break;
    case 'flicker': out = outNode(pos); noise(t, 0.04, out, 0.15, { type: 'highpass', f: 3000, d: 0.04 }); osc('sawtooth', 120, t, 0.08, out, 0.04, { filter: 'lowpass', ff: 900 }); break;
    case 'chime': out = outNode(null, { verb: true, verbAmt: 0.6 }); [784, 659, 523].forEach(function (f, i) { osc('sine', f, t + i * 0.45, 1.4, out, 0.18); osc('sine', f * 2.01, t + i * 0.45, 0.6, out, 0.04); }); break;
    case 'chimeBad': out = outNode(null, { verb: true, verbAmt: 0.9 }); [392, 330, 247].forEach(function (f, i) { osc('sine', f * (0.98 + Math.random() * 0.04), t + i * 0.55, 1.8, out, 0.2, { f2: f * 0.94 }); }); break;
    case 'paStatic': out = outNode(null, { verb: true }); noise(t, o.len || 1.2, out, 0.12, { type: 'bandpass', f: 1800, q: 0.8, a: 0.05, d: o.len || 1.2, s: 0.06 }); osc('sine', 60, t, o.len || 1.2, out, 0.03); break;
    case 'feedback': out = outNode(null, { verb: true }); osc('sine', 2900, t, 1.2, out, 0.06, { a: 0.6, d: 1.2, f2: 3100 }); break;
    case 'pickup': out = outNode(null); osc('triangle', 660, t, 0.08, out, 0.15); osc('triangle', 990, t + 0.07, 0.12, out, 0.15); break;
    case 'paper': out = outNode(null); noise(t, 0.25, out, 0.2, { type: 'highpass', f: 2500, d: 0.25 }); break;
    case 'sparkle': out = outNode(pos); for (var s2 = 0; s2 < 6; s2++) osc('sine', 1800 + s2 * 300, t + s2 * 0.05, 0.3, out, 0.08); break;
    case 'horn': out = outNode(pos, { ref: 4, roll: 0.6, verbAmt: 0.9 }); [370, 466, 554].forEach(function (f) { osc('sawtooth', f, t, o.len || 6, out, 0.09, { a: 0.02, d: 0.05, s: 0.09, hold: o.len || 6, r: 0.2, filter: 'lowpass', ff: 2500 }); }); break;
    case 'chalk': out = outNode(pos, { verbAmt: 0.8 }); noise(t, 0.03, out, 0.6, { type: 'bandpass', f: 2800, q: 3, d: 0.04 }); noise(t + 0.12, 0.02, out, 0.3, { type: 'bandpass', f: 2600, q: 3, d: 0.03 }); noise(t + 0.2, 0.02, out, 0.15, { type: 'bandpass', f: 2600, q: 3, d: 0.03 }); break;
    case 'throw': out = outNode(null); noise(t, 0.2, out, 0.15, { type: 'bandpass', f: 600, f2: 1500, d: 0.2 }); break;
    case 'heart': out = outNode(null, { bus: AU.scareBus }); var hv = o.v || 0.5; osc('sine', 55, t, 0.12, out, hv, { f2: 40 }); osc('sine', 50, t + 0.17, 0.14, out, hv * 0.75, { f2: 36 }); break;
    case 'scream': out = outNode(pos, { ref: 3, roll: 0.7, verbAmt: 1.0 }); scream(t, out, o.len || 1.4, o.pitch || 1); break;
    case 'drag': out = outNode(pos, { ref: 3, verbAmt: 1 }); noise(t, o.len || 2.5, out, 0.25, { type: 'lowpass', f: 300, q: 2, a: 0.2, d: o.len || 2.5, s: 0.2 }); for (var dr = 0; dr < 6; dr++) noise(t + dr * 0.4, 0.15, out, 0.25, { type: 'bandpass', f: 900, q: 2, d: 0.15 }); break;
    case 'thump': out = outNode(pos, { verbAmt: 1 }); osc('sine', 70, t, 0.4, out, 0.6, { f2: 35 }); noise(t, 0.2, out, 0.3, { type: 'lowpass', f: 300, d: 0.2 }); break;
    case 'creak': out = outNode(pos, { verbAmt: 1 }); osc('sawtooth', 90 + Math.random() * 60, t, 1.2, out, 0.04, { f2: 60 + Math.random() * 90, filter: 'bandpass', ff: 700, q: 12, a: 0.3, d: 1.2 }); break;
    case 'drip': out = outNode(pos, { verbAmt: 1 }); osc('sine', 1400 + Math.random() * 600, t, 0.08, out, 0.1, { f2: 700 }); break;
    case 'whisper': out = outNode(pos, { verbAmt: 1 }); for (var w = 0; w < 8; w++) noise(t + w * 0.12 + Math.random() * 0.05, 0.1, out, 0.08, { type: 'bandpass', f: 2500 + Math.random() * 2500, q: 5, d: 0.1 }); break;
    case 'giggle': out = outNode(pos, { verbAmt: 1 }); for (var gk = 0; gk < 5; gk++) { osc('triangle', 520 - gk * 20, t + gk * 0.14, 0.1, out, 0.1, { f2: 460, filter: 'bandpass', ff: 1200, q: 3 }); noise(t + gk * 0.14, 0.08, out, 0.05, { type: 'bandpass', f: 2000, q: 3, d: 0.08 }); } break;
    case 'breathM': out = outNode(pos, { verbAmt: 0.6 }); noise(t, 1.2, out, (o.v || 0.3), { type: 'bandpass', f: 500, q: 2.5, a: 0.4, d: 1.2, pink: true }); noise(t + 1.3, 1.0, out, (o.v || 0.3) * 0.7, { type: 'bandpass', f: 380, q: 2.5, a: 0.2, d: 1.0, pink: true }); break;
    case 'clicks': out = outNode(pos, { verbAmt: 0.8 }); for (var ck = 0; ck < (o.n || 10); ck++) noise(t + ck * (0.04 + Math.random() * 0.05), 0.012, out, 0.35, { type: 'bandpass', f: 3500 + Math.random() * 2000, q: 4, d: 0.015 }); break;
    case 'growl': out = outNode(pos, { verbAmt: 0.7 }); var gg = osc('sawtooth', 70 * (o.pitch || 1), t, o.len || 1.2, out, 0.22, { f2: 55 * (o.pitch || 1), filter: 'lowpass', ff: 500, a: 0.1, d: o.len || 1.2 }); noise(t, o.len || 1.2, out, 0.12, { type: 'bandpass', f: 300, q: 3, a: 0.1, d: o.len || 1.2 }); break;
    case 'squeak': out = outNode(pos, { verbAmt: 0.8 }); osc('sine', 1500 + Math.random() * 400, t, 0.25, out, 0.06, { f2: 1200, a: 0.03 }); osc('sine', 1600, t + 0.4, 0.2, out, 0.05, { f2: 1900 }); break;
    case 'staticBurst': out = outNode(pos, { verbAmt: 0.5 }); noise(t, o.len || 0.8, out, 0.35, { type: 'highpass', f: 1500, a: 0.01, d: o.len || 0.8, s: 0.2 }); osc('square', 15700, t, o.len || 0.8, out, 0.02); break;
    case 'hoot': out = outNode(pos, { verbAmt: 0.6 }); var hp = o.pitch || 1; osc('sine', 420 * hp, t, 0.35, out, 0.25, { f2: 380 * hp, a: 0.04 }); osc('sine', 420 * hp, t + 0.45, 0.6, out, 0.25, { f2: 330 * hp, a: 0.04 }); break;
    case 'hootBad': out = outNode(pos, { verbAmt: 1 }); var wsh = c.createWaveShaper(); wsh.curve = distCurve(30); wsh.connect(out); osc('sawtooth', 210, t, 1.6, wsh, 0.2, { f2: 90, a: 0.05, d: 1.6 }); osc('sine', 205, t, 1.6, wsh, 0.2, { f2: 70 }); break;
    case 'tape': out = outNode(null); noise(t, 0.08, out, 0.4, { type: 'lowpass', f: 1500, d: 0.08 }); osc('sine', 90, t + 0.1, 0.6, out, 0.08, { a: 0.1, d: 0.6 }); noise(t + 0.15, 0.6, out, 0.05, { type: 'bandpass', f: 4000, q: 1, d: 0.6 }); break;
    case 'rewind': out = outNode(null); osc('sawtooth', 300, t, 1.5, out, 0.05, { f2: 1800, filter: 'bandpass', ff: 1500, q: 2 }); noise(t, 1.5, out, 0.05, { type: 'highpass', f: 3000, d: 1.5 }); break;
    case 'jumpscare': jumpscareSound(t, o); break;
    case 'stinger': out = outNode(null, { bus: AU.scareBus, verb: true, verbAmt: 1 }); [110, 116.5, 155.6, 233].forEach(function (f) { osc('sawtooth', f, t, 2.4, out, 0.07, { a: 0.01, d: 2.4, filter: 'lowpass', ff: 1800 }); }); noise(t, 0.4, out, 0.3, { type: 'highpass', f: 2000, d: 0.4 }); break;
    case 'win': out = outNode(null, { verb: true }); [523, 659, 784, 1046].forEach(function (f, i) { osc('triangle', f, t + i * 0.12, 0.5, out, 0.14); }); break;
    case 'wrong': out = outNode(null); osc('square', 180, t, 0.25, out, 0.08, { f2: 120, filter: 'lowpass', ff: 900 }); break;
    case 'right': out = outNode(null); osc('triangle', 880, t, 0.1, out, 0.13); osc('triangle', 1320, t + 0.08, 0.15, out, 0.13); break;
    case 'note': out = outNode(null, { verb: true, verbAmt: 0.3 }); osc('triangle', o.f || 440, t, 0.4, out, 0.18); osc('sine', (o.f || 440) * 2, t, 0.2, out, 0.05); break;
    case 'tick': out = outNode(null); osc('square', 2000, t, 0.01, out, 0.05); break;
    case 'bubble': out = outNode(null); osc('sine', 300 + Math.random() * 500, t, 0.12, out, 0.12, { f2: 900 }); break;
    case 'bandaid': out = outNode(null); noise(t, 0.3, out, 0.15, { type: 'highpass', f: 4000, d: 0.3 }); osc('sine', 600, t, 0.4, out, 0.1, { f2: 900 }); break;
    case 'stab': out = outNode(null, { bus: AU.scareBus }); noise(t, 0.3, out, 0.8, { type: 'lowpass', f: 2000, d: 0.3 }); osc('sine', 60, t, 0.4, out, 0.9, { f2: 30 }); break;
    case 'engine': out = outNode(pos, { ref: 4 }); osc('sawtooth', 45, t, o.len || 3, out, 0.12, { a: 0.4, d: o.len || 3, s: 0.1, filter: 'lowpass', ff: 300 }); noise(t, o.len || 3, out, 0.08, { type: 'lowpass', f: 200, a: 0.4, d: o.len || 3, s: 0.06 }); break;
  }
}
function metal(t, out, v, base) { [1, 2.76, 5.4, 8.93].forEach(function (m, i) { osc('sine', base * m * (0.98 + Math.random() * 0.04), t, 0.5 - i * 0.08, out, v * 0.18 / (i + 1), { d: 0.5 - i * 0.08 }); }); }
function bell(t, pos, bad, len) {
  var out = outNode(pos || null, { verb: true, verbAmt: 0.8, ref: 6, roll: 0.4 });
  var c = AU.ctx;
  var ws = c.createWaveShaper(); ws.curve = distCurve(bad ? 25 : 4); ws.connect(out);
  var am = c.createGain(); am.gain.value = 0; am.connect(ws);
  var lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = bad ? 19 : 28;
  var lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
  var base = bad ? 980 : 1250;
  [1, 2.3, 3.4, 4.9].forEach(function (m, i) { var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = base * m; if (bad) o.frequency.linearRampToValueAtTime(base * m * 0.82, t + len); var g = c.createGain(); g.gain.value = 0.12 / (i + 1); o.connect(g); g.connect(am); o.start(t); o.stop(t + len + 0.2); });
  var mg = c.createGain(); am.disconnect(); am.connect(mg); mg.connect(ws);
  mg.gain.setValueAtTime(0.0001, t); mg.gain.linearRampToValueAtTime(1, t + 0.02); mg.gain.setValueAtTime(1, t + len); mg.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.25);
  lfo.start(t); lfo.stop(t + len + 0.3);
  noise(t, len, out, 0.05, { type: 'bandpass', f: 4000, q: 2, a: 0.01, d: len, s: 0.05 });
}
function scream(t, out, len, pitch) {
  var c = AU.ctx;
  var f0 = 520 * pitch;
  var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * 0.7, t); o.frequency.linearRampToValueAtTime(f0 * 1.25, t + 0.15); o.frequency.linearRampToValueAtTime(f0, t + len);
  var vib = c.createOscillator(); vib.frequency.value = 7; var vg = c.createGain(); vg.gain.value = f0 * 0.04; vib.connect(vg); vg.connect(o.frequency);
  var g = c.createGain();
  [800, 1300, 2800].forEach(function (ff, i) { var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff * pitch; bp.Q.value = 5; o.connect(bp); var bg = c.createGain(); bg.gain.value = [1, 0.7, 0.4][i]; bp.connect(bg); bg.connect(g); });
  g.connect(out); env(g, t, 0.03, 0.8, len, 0.3, 0.3, len);
  o.start(t); vib.start(t); o.stop(t + len + 0.5); vib.stop(t + len + 0.5);
  noise(t, len, out, 0.25, { type: 'bandpass', f: 1800 * pitch, q: 1, a: 0.02, d: len, s: 0.15 });
}
function jumpscareSound(t, o) {
  var c = AU.ctx, mild = SAVE.settings.scare === 'MILD';
  var out = c.createGain(); out.gain.value = mild ? 0.35 : 1; out.connect(AU.scareBus);
  var ws = c.createWaveShaper(); ws.curve = distCurve(mild ? 8 : 40); ws.connect(out);
  var sv = c.createGain(); sv.gain.value = 0.6; ws.connect(sv); sv.connect(AU.verb);
  var p = o.pitch || 1;
  scream(t, ws, 1.6, 1.15 * p); scream(t + 0.03, ws, 1.4, 0.72 * p);
  noise(t, 1.6, ws, 0.9, { type: 'bandpass', f: 2200, q: 0.6, a: 0.005, d: 1.6, s: 0.3 });
  osc('sine', 48, t, 1.2, out, 1.0, { f2: 28, d: 1.2 });
  osc('square', 3100 * p, t, 0.9, ws, 0.2, { f2: 1200 });
  for (var k = 0; k < 10; k++) noise(t + k * 0.06, 0.04, ws, 0.6, { type: 'highpass', f: 3000, d: 0.04 });
}
// ---- continuous loops (hum, wind, heartbeat) ----------------------------
function loopNoise(name, opt) {
  if (!AU.ready) return null;
  if (AU.loops[name]) return AU.loops[name];
  var c = AU.ctx, s = c.createBufferSource(); s.buffer = opt.pink ? AU.pink : AU.noise; s.loop = true;
  var f = c.createBiquadFilter(); f.type = opt.type || 'lowpass'; f.frequency.value = opt.f || 400; f.Q.value = opt.q || 0.7;
  var g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(opt.bus || AU.sfxBus); s.start();
  var L = { s: s, f: f, g: g, target: 0 };
  if (opt.hum) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 120; var of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 600; var og = c.createGain(); og.gain.value = opt.hum; o.connect(of); of.connect(og); og.connect(g); o.start(); L.o = o; }
  AU.loops[name] = L; return L;
}
function setLoop(name, v, k) { var L = AU.loops[name]; if (!L) return; L.g.gain.setTargetAtTime(v, AT(), k || 0.3); }
function initLoops() {
  loopNoise('hum', { type: 'bandpass', f: 4000, q: 0.5, hum: 0.25 });
  loopNoise('wind', { type: 'bandpass', f: 350, q: 0.6, pink: true });
  loopNoise('room', { type: 'lowpass', f: 180, pink: true });
  loopNoise('tapehiss', { type: 'highpass', f: 3500 });
}
var HEART = { t: 0 };
function updateAudio(dt, cam) {
  if (!AU.ready) return;
  var L = AU.ctx.listener, p = cam.position;
  var fw = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  if (L.positionX) { L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z; L.forwardX.value = fw.x; L.forwardY.value = fw.y; L.forwardZ.value = fw.z; L.upX.value = up.x; L.upY.value = up.y; L.upZ.value = up.z; }
  else { L.setPosition(p.x, p.y, p.z); L.setOrientation(fw.x, fw.y, fw.z, up.x, up.y, up.z); }
  // heartbeat by fear
  if (PL && GAME.mode === 'play') {
    var fear = PL.fear;
    if (fear > 0.15) { HEART.t -= dt; if (HEART.t <= 0) { HEART.t = lerp(1.1, 0.38, fear); sfx('heart', null, { v: 0.15 + fear * 0.75 }); } }
  }
}

// ---- voice (TTS) ------------------------------------------------------------
var VOICE = { en: null };
function pickVoice() {
  try {
    var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    var best = null;
    for (var i = 0; i < vs.length; i++) { var v = vs[i]; if (/^en(-|_)US/i.test(v.lang)) { if (!best || /Samantha|Karen|Moira|Google US|Aaron|Fred/i.test(v.name)) best = v; } }
    if (!best) for (var j = 0; j < vs.length; j++) if (/^en/i.test(vs[j].lang)) { best = vs[j]; break; }
    VOICE.en = best;
  } catch (e) {}
}
try { if (window.speechSynthesis) { speechSynthesis.onvoiceschanged = pickVoice; pickVoice(); } } catch (e) {}
// style: 'cute' (high, fast), 'creepy' (very low, slow), 'pa' (normal), 'npc' with pitch
function say(text, style, opt) {
  opt = opt || {};
  try {
    if (!window.speechSynthesis || SAVE.settings.sfx <= 0.01) return;
    if (opt.interrupt !== false) speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    if (!VOICE.en) pickVoice();
    if (VOICE.en) u.voice = VOICE.en;
    u.lang = 'en-US';
    var s = style || 'pa';
    u.pitch = s === 'cute' ? 1.9 : s === 'creepy' ? 0.1 : s === 'npc' ? (opt.pitch || 1) : 1.0;
    u.rate = s === 'cute' ? 1.12 : s === 'creepy' ? 0.62 : (opt.rate || 1.0);
    u.volume = clamp(SAVE.settings.sfx * (opt.vol || 0.9), 0, 1);
    speechSynthesis.speak(u);
    if (s === 'cute' && opt.hoot !== false) sfx('hoot', null, { pitch: 1.2 });
    if (s === 'creepy') sfx('hootBad');
  } catch (e) {}
}
function stopVoice() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }


// ===== 04_map.js =====
// ---- school map: grid model, generation, validation, navigation -----------
var CELL = 0.5, OX = -20, OZ = -18, NX = 208, NZ = 88, NL = 3;
var LV_Y = [-4, 0, 4];          // level base heights: 0=Basement 1=Ground 2=Upper
var LV_NAME = ['B', '1F', '2F'];
var T_VOID = 0, T_FLOOR = 1, T_WALL = 2, T_STAIR = 3, T_DOOR = 4, T_BLOCK = 5;
// floor materials
var M_LINO = 0, M_GYM = 1, M_TILE = 2, M_TERRAZZO = 3, M_CARPET = 4, M_CONCRETE = 5, M_ASPHALT = 6, M_GRASS = 7, M_LINO2 = 8, M_BUS = 9;

var ROLE_INFO = {
  MATH: { en: 'MATH', ja: '数学', lesson: true, kind: 'class' },
  ENGLISH: { en: 'ENGLISH', ja: '英語', lesson: true, kind: 'class' },
  SCIENCE: { en: 'SCIENCE LAB', ja: '理科室', lesson: true, kind: 'science' },
  MUSIC: { en: 'MUSIC', ja: '音楽室', lesson: true, kind: 'music' },
  ART: { en: 'ART', ja: '美術室', lesson: true, kind: 'art' },
  HISTORY: { en: 'HISTORY', ja: '歴史', kind: 'class' },
  DETENTION: { en: 'DETENTION', ja: '居残り部屋', kind: 'class' },
  HOME_EC: { en: 'HOME EC', ja: '家庭科室', kind: 'homeec' },
  LIBRARY: { en: 'LIBRARY', ja: '図書室', kind: 'library' },
  NURSE: { en: "NURSE'S OFFICE", ja: '保健室', kind: 'nurse' },
  PRINCIPAL: { en: "PRINCIPAL'S OFFICE", ja: '校長室', kind: 'principal' },
  AV: { en: 'AV ROOM', ja: '視聴覚室', kind: 'av' },
  RESTROOM_B: { en: 'BOYS', ja: '男子トイレ', kind: 'restroom' },
  RESTROOM_G: { en: 'GIRLS', ja: '女子トイレ', kind: 'restroom' },
  LOUNGE: { en: "TEACHERS' LOUNGE", ja: '職員休憩室', kind: 'lounge' },
  STORAGE: { en: 'STORAGE', ja: '倉庫', kind: 'storage' },
  COUNSELOR: { en: 'COUNSELOR', ja: 'カウンセリング室', kind: 'office' },
  CAFETERIA: { en: 'CAFETERIA', ja: 'カフェテリア', kind: 'cafeteria' },
  GYM: { en: 'GYMNASIUM', ja: '体育館', kind: 'gym' },
  LOBBY: { en: 'MAIN OFFICE / LOBBY', ja: 'ロビー', kind: 'lobby' },
  CORRIDOR: { en: 'HALLWAY', ja: '廊下', kind: 'corridor' },
  STAIRS: { en: 'STAIRS', ja: '階段', kind: 'stairs' },
  BOILER: { en: 'BOILER ROOM', ja: 'ボイラー室', kind: 'boiler' },
  BSTORAGE: { en: 'PROP STORAGE', ja: '小道具倉庫', kind: 'bstorage' },
  BCORR: { en: 'MAINTENANCE', ja: '保守通路', kind: 'bcorr' },
  OUTSIDE: { en: 'BUS LOOP', ja: 'バス乗り場', kind: 'outside' },
  BUS: { en: 'SCHOOL BUS', ja: 'スクールバス', kind: 'bus' }
};
var SLOT_DEFS = [
  ['S1', 0.5, 12, 'S'], ['S2', 12.5, 24, 'S'], ['SC', 24.5, 35.5, 'S'], ['S3', 36, 47.5, 'S'], ['S4', 48, 59.5, 'S'],
  ['N1', 0.5, 12, 'N'], ['N2', 17.5, 29, 'N'], ['N3', 29.5, 41, 'N'], ['N4', 46.5, 59.5, 'N']
];
var RANDOM_ROLES = ['MATH', 'ENGLISH', 'SCIENCE', 'MUSIC', 'ART', 'HISTORY', 'DETENTION', 'HOME_EC', 'LIBRARY', 'NURSE', 'PRINCIPAL', 'AV', 'RESTROOM_B', 'RESTROOM_G', 'LOUNGE', 'STORAGE', 'COUNSELOR'];

var MAP = null;

function m2c(x) { return Math.floor((x - OX) / CELL + 1e-6); }
function m2r(z) { return Math.floor((z - OZ) / CELL + 1e-6); }
function c2x(cx) { return OX + (cx + 0.5) * CELL; }
function r2z(cz) { return OZ + (cz + 0.5) * CELL; }
function cidx(cx, cz) { return cz * NX + cx; }
function inGrid(cx, cz) { return cx >= 0 && cz >= 0 && cx < NX && cz < NZ; }

function newLevel() {
  var n = NX * NZ;
  return {
    type: new Uint8Array(n), room: new Int16Array(n).fill(-1), mat: new Uint8Array(n),
    opaque: new Uint8Array(n), door: new Int16Array(n).fill(-1), stair: new Int16Array(n).fill(-1),
    ceil: new Float32Array(n), blockTall: new Uint8Array(n), hide: new Int16Array(n).fill(-1)
  };
}

function generateMap(seed) {
  for (var attempt = 0; attempt < 40; attempt++) {
    var m = buildMapAttempt((seed + attempt * 7919) >>> 0);
    if (m.valid) { m.attempts = attempt + 1; return m; }
  }
  // last resort: no random obstacles
  var mm = buildMapAttempt(seed >>> 0, true); mm.attempts = 41; return mm;
}

function buildMapAttempt(seed, safe) {
  var rnd = makeRNG(seed);
  var M = { seed: seed, lv: [newLevel(), newLevel(), newLevel()], rooms: [], doors: [], stairs: [], hides: [], props: [], chairs: [], lights: [], dlights: [], tvs: [], posters: [], itemSpots: [], windows: [], signs: [], blockers: [], valid: false };
  MAP = M;
  function rectCells(x0, z0, x1, z1, fn) {
    var a = m2c(x0), b = m2c(x1 - 1e-4), c = m2r(z0), d = m2r(z1 - 1e-4);
    for (var cz = c; cz <= d; cz++) for (var cx = a; cx <= b; cx++) if (inGrid(cx, cz)) fn(cidx(cx, cz), cx, cz);
  }
  function fill(li, x0, z0, x1, z1, type, room, mat, ceil) {
    var L = M.lv[li];
    rectCells(x0, z0, x1, z1, function (i) { L.type[i] = type; if (room !== undefined) L.room[i] = room; if (mat !== undefined) L.mat[i] = mat; if (ceil !== undefined) L.ceil[i] = ceil; L.opaque[i] = (type === T_WALL || type === T_VOID) ? 1 : 0; });
  }
  function addRoom(li, role, x0, z0, x1, z1, mat, ceil, extra) {
    var r = { id: M.rooms.length, li: li, role: role, x0: x0, z0: z0, x1: x1, z1: z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, mat: mat, ceil: ceil, doors: [], chairs: [], hides: [], number: 0 };
    if (extra) for (var k in extra) r[k] = extra[k];
    M.rooms.push(r);
    fill(li, x0, z0, x1, z1, T_FLOOR, r.id, mat, ceil);
    return r;
  }
  function addDoor(li, x0, z0, x1, z1, axis, roomA, opt) {
    opt = opt || {};
    var d = { id: M.doors.length, li: li, x0: x0, z0: z0, x1: x1, z1: z1, x: (x0 + x1) / 2, z: (z0 + z1) / 2, axis: axis, room: roomA, open: opt.open != null ? opt.open : 0, locked: false, cells: [], kind: opt.kind || 'wood', width: axis === 'z' ? (x1 - x0) : (z1 - z0), label: opt.label || '', anim: 0, exit: !!opt.exit, noLock: !!opt.noLock };
    var L = M.lv[li];
    rectCells(x0, z0, x1, z1, function (i) { L.type[i] = T_DOOR; L.door[i] = d.id; L.opaque[i] = 0; d.cells.push(i); if (L.room[i] < 0) L.room[i] = roomA; L.mat[i] = M_LINO; L.ceil[i] = 3.2; });
    M.doors.push(d);
    if (roomA >= 0 && M.rooms[roomA]) M.rooms[roomA].doors.push(d.id);
    return d;
  }
  function addStair(x0, x1, z0, z1, yA, yB, liLow, liHigh) {
    var s = { id: M.stairs.length, x0: x0, x1: x1, z0: z0, z1: z1, yA: yA, yB: yB, lo: liLow, hi: liHigh };
    M.stairs.push(s);
    [liLow, liHigh].forEach(function (li) {
      var L = M.lv[li];
      rectCells(x0, z0, x1, z1, function (i) { L.type[i] = T_STAIR; L.stair[i] = s.id; L.opaque[i] = 0; L.mat[i] = M_CONCRETE; });
    });
    return s;
  }
  function block(li, x0, z0, x1, z1, tall, tag) {
    var L = M.lv[li];
    rectCells(x0, z0, x1, z1, function (i) { if (L.type[i] === T_FLOOR || L.type[i] === T_DOOR) { L.type[i] = T_BLOCK; if (tall) { L.blockTall[i] = 1; L.opaque[i] = tall > 1 ? 1 : 0; } } });
  }
  M.block = block; M.rectCells = rectCells;
  function prop(kind, li, x, z, rot, o) { var p = { kind: kind, li: li, x: x, z: z, rot: rot || 0 }; if (o) for (var k in o) p[k] = o[k]; M.props.push(p); return p; }
  function light(li, x, y, z, room, opt) { var l = { li: li, x: x, y: y, z: z, room: room, int: (opt && opt.int) || 1, r: (opt && opt.r) || 7, col: (opt && opt.col) || [1, 1, 0.92], kind: (opt && opt.kind) || 'tube', broken: false, g: M.lights.length % 8 }; M.lights.push(l); return l; }
  function dlight(li, x, y, z, col, r, opt) { var l = { li: li, x: x, y: y, z: z, col: col, r: r, dir: opt && opt.dir, int: (opt && opt.int) || 1 }; M.dlights.push(l); return l; }
  M.prop = prop;

  // ---- 1. solid shells ----
  fill(1, 0, 0, 60, 22, T_WALL); fill(2, 0, 0, 60, 22, T_WALL);
  fill(1, 60, -1.5, 80.5, 23.5, T_WALL); // gym shell
  fill(1, -18.5, 0, 0, 22, T_WALL);      // cafeteria shell
  fill(0, 29.5, 7.5, 60.5, 23.5, T_WALL); // basement shell

  // ---- 2. outside (front lawn / bus loop) ----
  var outside = addRoom(1, 'OUTSIDE', -19, -16.5, 83, 0, M_GRASS, 0);
  // gym footprint overlaps outside at z[-1.5,0]: restore gym wall there
  fill(1, 60, -1.5, 80.5, 0, T_WALL, -1);
  rectCells(-19, -16.5, 83, 0, function (i, cx, cz) {
    var L = M.lv[1]; if (L.room[i] !== outside.id) return;
    var x = c2x(cx), z = r2z(cz);
    if (z > -3) L.mat[i] = M_CONCRETE; else if (x > 8 && x < 52 && z > -15) L.mat[i] = M_ASPHALT; else L.mat[i] = M_GRASS;
  });

  // ---- 3. ground floor ----
  var corrG = addRoom(1, 'CORRIDOR', 0.5, 9.5, 59.5, 13, M_LINO, 3.2);
  var corrU = addRoom(2, 'CORRIDOR', 0.5, 9.5, 59.5, 13, M_LINO, 3.2);
  var gym = addRoom(1, 'GYM', 60.5, -1, 80, 23, M_GYM, 8);
  var cafe = addRoom(1, 'CAFETERIA', -18, 0.5, -0.5, 21.5, M_TERRAZZO, 4.2);
  var lobby = addRoom(1, 'LOBBY', 24.5, 0.5, 35.5, 9, M_TERRAZZO, 3.2);
  var stW_G = addRoom(1, 'STAIRS', 12.5, 13.5, 17, 21.5, M_CONCRETE, 3.2, { name: 'WEST STAIRS' });
  var stE_G = addRoom(1, 'STAIRS', 41.5, 13.5, 46, 21.5, M_CONCRETE, 3.2, { name: 'EAST STAIRS' });
  var stW_U = addRoom(2, 'STAIRS', 12.5, 13.5, 17, 21.5, M_CONCRETE, 3.2, { name: 'WEST STAIRS' });
  var stE_U = addRoom(2, 'STAIRS', 41.5, 13.5, 46, 21.5, M_CONCRETE, 3.2, { name: 'EAST STAIRS' });
  // stair internals
  fill(1, 14.5, 13.5, 15, 21.5, T_WALL, -1); fill(2, 14.5, 13.5, 15, 20, T_WALL, -1);   // west divider
  fill(1, 12.5, 20, 14.5, 21.5, T_WALL, -1); fill(2, 12.5, 13.5, 14.5, 14, T_VOID, -1);
  fill(1, 43.5, 13.5, 44, 21.5, T_WALL, -1); fill(2, 43.5, 13.5, 44, 20, T_WALL, -1);   // east divider
  fill(1, 41.5, 20, 46, 21.5, T_WALL, -1); fill(2, 41.5, 13.5, 43.5, 14, T_VOID, -1);
  var sW = addStair(12.5, 14.5, 14, 20, 0, 4, 1, 2);
  var sE = addStair(41.5, 43.5, 14, 20, 0, 4, 1, 2);
  // basement
  var bcorr = addRoom(0, 'BCORR', 30, 20, 60, 23, M_CONCRETE, 2.8);
  var bstore = addRoom(0, 'BSTORAGE', 30, 8, 40, 19.5, M_CONCRETE, 2.8);
  var boiler = addRoom(0, 'BOILER', 48, 8, 60, 19.5, M_CONCRETE, 2.8);
  var sB = addStair(44, 46, 14, 20, 0, -4, 0, 1);
  // keep G cells of the down ramp; ground floor cell above the b-corr remains wall
  addDoor(0, 34, 19.5, 35, 20, 'z', bstore.id, { open: 0.0, noLock: true });
  addDoor(0, 52, 19.5, 53, 20, 'z', boiler.id, { open: 1, noLock: true });

  // slot rooms
  var slots = [];
  [1, 2].forEach(function (li) {
    SLOT_DEFS.forEach(function (sd, k) {
      if (li === 1 && sd[0] === 'SC') return;
      var z0 = sd[3] === 'S' ? 0.5 : 13.5, z1 = sd[3] === 'S' ? 9 : 21.5;
      var r = addRoom(li, 'TBD', sd[1], z0, sd[2], z1, M_LINO2, 3.2, { side: sd[3], slot: sd[0] });
      slots.push(r);
    });
  });

  // ---- 4. doors ----
  // classroom doors on corridor wall
  slots.forEach(function (r) {
    var wz0 = r.side === 'S' ? 9 : 13, wz1 = wz0 + 0.5;
    var w = r.x1 - r.x0;
    addDoor(r.li, r.x0 + 1, wz0, r.x0 + 2, wz1, 'z', r.id, { open: rnd() < 0.7 ? 1 : 0 });
    if (w > 9) addDoor(r.li, r.x1 - 2, wz0, r.x1 - 1, wz1, 'z', r.id, { open: rnd() < 0.6 ? 1 : 0 });
  });
  // lobby: open archway + front doors
  fill(1, 27, 9, 33, 9.5, T_FLOOR, lobby.id, M_TERRAZZO, 3.2);
  var frontDoor = addDoor(1, 29, 0, 31, 0.5, 'z', lobby.id, { open: 0, kind: 'glass', exit: true, label: 'FRONT' });
  var gymDoor = addDoor(1, 59.5, 10.25, 60.5, 12.25, 'x', gym.id, { open: 1, kind: 'double', exit: true, noLock: true });
  var gymExit = addDoor(1, 63, -1.5, 65, -1, 'z', gym.id, { open: 0, kind: 'double', exit: true });
  var cafeDoor = addDoor(1, -0.5, 10.25, 0.5, 12.25, 'x', cafe.id, { open: 1, kind: 'double', noLock: true, exit: true });
  // stair doors
  var sdW1 = addDoor(1, 12.5, 13, 14.5, 13.5, 'z', stW_G.id, { open: 1, kind: 'double', exit: true, noLock: true });
  addDoor(1, 15, 13, 17, 13.5, 'z', stW_G.id, { open: 0, kind: 'double', noLock: true });
  var sdW2 = addDoor(2, 15, 13, 17, 13.5, 'z', stW_U.id, { open: 1, kind: 'double', exit: true, noLock: true });
  var sdE1 = addDoor(1, 41.5, 13, 43.5, 13.5, 'z', stE_G.id, { open: 1, kind: 'double', exit: true, noLock: true });
  var sdEB = addDoor(1, 44, 13, 46, 13.5, 'z', stE_G.id, { open: 0, kind: 'double', exit: true, noLock: true, label: 'BASEMENT' });
  var sdE2 = addDoor(2, 44, 13, 46, 13.5, 'z', stE_U.id, { open: 1, kind: 'double', exit: true, noLock: true });
  M.stairDoors = [sdW1, sdW2, sdE1, sdE2];
  M.frontDoor = frontDoor; M.gymExit = gymExit;

  // ---- 5. the bus ----
  var bus = { x0: 25, x1: 36, z0: -12.5, z1: -9.5 };
  fill(1, 25, -12.5, 36, -9.5, T_WALL, -1);
  var busRoom = addRoom(1, 'BUS', 25.5, -12, 35.5, -10, M_BUS, 2.3);
  addDoor(1, 34, -10, 35, -9.5, 'z', busRoom.id, { open: 1, kind: 'bus', noLock: true });
  M.bus = bus; M.busRoom = busRoom;

  // ---- 6. role assignment ----
  var roles = RANDOM_ROLES.slice(); rnd.shuffle(roles);
  slots.forEach(function (r, i) { r.role = roles[i]; });
  var num = { 1: { S: 101, N: 102 }, 2: { S: 201, N: 202 } };
  slots.slice().sort(function (a, b) { return a.x0 - b.x0; }).forEach(function (r) { r.number = num[r.li][r.side]; num[r.li][r.side] += 2; });
  lobby.number = 100; cafe.number = 110; gym.number = 120;
  M.slots = slots; M.cafe = cafe; M.gym = gym; M.lobby = lobby; M.corrG = corrG; M.corrU = corrU; M.boiler = boiler; M.bstore = bstore; M.bcorr = bcorr; M.outside = outside;

  // ---- 7. furniture / content ----
  furnishAll(M, rnd);

  // ---- 8. random obstacles ----
  if (!safe) {
    // locked classroom doors
    M.doors.forEach(function (d) {
      if (d.noLock || d.room < 0) return;
      var r = M.rooms[d.room];
      if (r.role === 'TBD' || r.role === 'BUS') return;
      if (d === frontDoor) { d.locked = rnd() < 0.35; }
      else if (d === gymExit) { d.locked = !frontDoor.locked && rnd() < 0.5; }
      else d.locked = rnd() < 0.22;
      if (d.locked) d.open = 0;
    });
    // corridor barricades (full or partial)
    [1, 2].forEach(function (li) {
      var n = rnd.int(0, 2);
      for (var k = 0; k < n; k++) {
        var full = rnd() < 0.55;
        for (var tries = 0; tries < 20; tries++) {
          var bx = Math.round(rnd.range(4, 55) * 2) / 2;
          var ok = M.doors.every(function (d) { return d.li !== li || Math.abs(d.x - bx) > 2.2 || d.axis !== 'z'; });
          if (!ok) continue;
          var side = rnd() < 0.5;
          var z0 = full ? 9.5 : (side ? 9.5 : 11.25), z1 = full ? 13 : (side ? 11.25 : 13);
          block(li, bx, z0, bx + 1.5, z1, 2);
          M.blockers.push({ li: li, x0: bx, x1: bx + 1.5, z0: z0, z1: z1, full: full });
          break;
        }
      }
    });
    // stairwell blocked ("CLOSED" pile of desks)
    if (rnd() < 0.4) {
      var sd = rnd.pick(M.stairDoors);
      var bz0 = sd.z0 < 13.2 ? 13.5 : 12.5;
      block(sd.li, sd.x0, 13.5, sd.x1, 14, 2);
      M.blockers.push({ li: sd.li, x0: sd.x0, x1: sd.x1, z0: 13.5, z1: 14, full: true, stair: true });
    }
  }
  validateMap(M);
  return M;
}

// --------------------------------------------------------------------------
// navigation helpers
function cellType(li, cx, cz) { if (li < 0 || li >= NL || !inGrid(cx, cz)) return T_VOID; return MAP.lv[li].type[cidx(cx, cz)]; }
function cellAt(li, x, z) { return cellType(li, m2c(x), m2r(z)); }
// passable for a given agent mode: 'p' player/npc, 'm' monster
function passable(li, cx, cz, mode) {
  if (li < 0 || li >= NL || !inGrid(cx, cz)) return false;
  var L = MAP.lv[li], i = cidx(cx, cz), t = L.type[i];
  if (t === T_FLOOR || t === T_STAIR) return true;
  if (t === T_DOOR) { var d = MAP.doors[L.door[i]]; if (!d.locked) return true; return mode === 'm'; }
  return false;
}
function stairHeight(s, z) { var t = clamp((z - s.z0) / (s.z1 - s.z0), 0, 1); return s.yA + (s.yB - s.yA) * t; }
function floorY(li, x, z) {
  var cx = m2c(x), cz = m2r(z);
  if (!inGrid(cx, cz)) return LV_Y[li];
  var L = MAP.lv[li], i = cidx(cx, cz);
  if (L.type[i] === T_STAIR) return stairHeight(MAP.stairs[L.stair[i]], z);
  return LV_Y[li];
}
// after moving: re-evaluate the level of an agent standing on stairs
function resolveLevel(li, x, z) {
  var L = MAP.lv[li], cx = m2c(x), cz = m2r(z);
  if (!inGrid(cx, cz)) return li;
  var i = cidx(cx, cz);
  if (L.type[i] !== T_STAIR) return li;
  var s = MAP.stairs[L.stair[i]], y = stairHeight(s, z);
  var mid = (LV_Y[s.lo] + LV_Y[s.hi]) / 2;
  return y > mid ? s.hi : s.lo;
}
function roomAt(li, x, z) { var cx = m2c(x), cz = m2r(z); if (!inGrid(cx, cz)) return null; var r = MAP.lv[li].room[cidx(cx, cz)]; return r >= 0 ? MAP.rooms[r] : null; }

// line of sight on one level (vision): true if clear
function losClear(li, x0, z0, x1, z1) {
  var L = MAP.lv[li];
  var dx = x1 - x0, dz = z1 - z0, d = Math.sqrt(dx * dx + dz * dz);
  var steps = Math.ceil(d / (CELL * 0.5));
  for (var s = 1; s < steps; s++) {
    var t = s / steps, cx = m2c(x0 + dx * t), cz = m2r(z0 + dz * t);
    if (!inGrid(cx, cz)) return false;
    var i = cidx(cx, cz);
    if (L.opaque[i]) return false;
    if (L.type[i] === T_DOOR) { var dr = MAP.doors[L.door[i]]; if (dr.open < 0.5) return false; }
  }
  return true;
}
// walkable straight line (for path smoothing)
function walkClear(li, x0, z0, x1, z1, mode) {
  var dx = x1 - x0, dz = z1 - z0, d = Math.sqrt(dx * dx + dz * dz);
  var steps = Math.ceil(d / (CELL * 0.35));
  var nx = -dz / (d || 1) * 0.22, nz = dx / (d || 1) * 0.22;
  for (var s = 0; s <= steps; s++) {
    var t = s / steps, x = x0 + dx * t, z = z0 + dz * t;
    if (!passable(li, m2c(x + nx), m2r(z + nz), mode) || !passable(li, m2c(x - nx), m2r(z - nz), mode)) return false;
    if (cellAt(li, x, z) === T_STAIR) return false; // never shortcut across stairs
  }
  return true;
}

// A* over (level, cell). Returns array of {li,x,z}
var _heap = null;
function findPath(li0, x0, z0, li1, x1, z1, mode, maxIter) {
  var N = NX * NZ, NN = N * NL;
  if (!findPath.g) { findPath.g = new Float32Array(NN); findPath.came = new Int32Array(NN); findPath.stamp = new Uint32Array(NN); findPath.closed = new Uint32Array(NN); findPath.cur = 0; }
  var g = findPath.g, came = findPath.came, stamp = findPath.stamp, closed = findPath.closed;
  var tag = ++findPath.cur;
  var sx = m2c(x0), sz = m2r(z0), tx = m2c(x1), tz = m2r(z1);
  var start = li0 * N + cidx(sx, sz), goal = li1 * N + cidx(tx, tz);
  if (!passable(li1, tx, tz, mode)) { // goal blocked: find nearest passable neighbor
    var best = -1, bd = 1e9;
    for (var oz = -2; oz <= 2; oz++) for (var ox = -2; ox <= 2; ox++) if (passable(li1, tx + ox, tz + oz, mode)) { var dd = ox * ox + oz * oz; if (dd < bd) { bd = dd; best = li1 * N + cidx(tx + ox, tz + oz); } }
    if (best < 0) return null; goal = best; tx = goal % N % NX; tz = Math.floor(goal % N / NX);
  }
  var heap = [], hk = [];
  function push(n, f) { heap.push(n); hk.push(f); var i = heap.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; var t = heap[p]; heap[p] = heap[i]; heap[i] = t; t = hk[p]; hk[p] = hk[i]; hk[i] = t; i = p; } }
  function pop() { var top = heap[0], lastN = heap.pop(), lastK = hk.pop(); if (heap.length) { heap[0] = lastN; hk[0] = lastK; var i = 0, n = heap.length; for (;;) { var l = i * 2 + 1, r = l + 1, m = i; if (l < n && hk[l] < hk[m]) m = l; if (r < n && hk[r] < hk[m]) m = r; if (m === i) break; var t = heap[m]; heap[m] = heap[i]; heap[i] = t; t = hk[m]; hk[m] = hk[i]; hk[i] = t; i = m; } } return top; }
  stamp[start] = tag; g[start] = 0; came[start] = -1; push(start, 0);
  var gx = tx, gzz = tz, gl = li1, it = 0, found = false;
  maxIter = maxIter || 40000;
  var dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  while (heap.length && it++ < maxIter) {
    var n = pop();
    if (closed[n] === tag) continue; closed[n] = tag;
    if (n === goal) { found = true; break; }
    var l = Math.floor(n / N), c = n - l * N, cx = c % NX, cz = (c - cx) / NX;
    var L = MAP.lv[l];
    var isStair = L.type[c] === T_STAIR;
    for (var k = 0; k < 8; k++) {
      var nx = cx + dirs[k][0], nz = cz + dirs[k][1];
      if (!passable(l, nx, nz, mode)) continue;
      if (k >= 4 && (!passable(l, cx + dirs[k][0], cz, mode) || !passable(l, cx, cz + dirs[k][1], mode))) continue;
      var nn = l * N + cidx(nx, nz);
      var cost = g[n] + dirs[k][2];
      if (L.type[cidx(nx, nz)] === T_BLOCK) continue;
      if (stamp[nn] !== tag || cost < g[nn]) { stamp[nn] = tag; g[nn] = cost; came[nn] = n; var h = Math.abs(nx - gx) + Math.abs(nz - gzz) + Math.abs(l - gl) * 16; push(nn, cost + h); }
    }
    if (isStair) { // link to the same stair cell on the other level
      var s = MAP.stairs[L.stair[c]], ol = l === s.lo ? s.hi : s.lo;
      var on = ol * N + c;
      var cst = g[n] + 0.5;
      if (stamp[on] !== tag || cst < g[on]) { stamp[on] = tag; g[on] = cst; came[on] = n; push(on, cst + Math.abs(cx - gx) + Math.abs(cz - gzz) + Math.abs(ol - gl) * 16); }
    }
  }
  if (!found) return null;
  var pts = [], cur = goal;
  while (cur >= 0) { var ll = Math.floor(cur / N), cc = cur - ll * N; pts.push({ li: ll, x: c2x(cc % NX), z: r2z(Math.floor(cc / NX)) }); if (cur === start) break; cur = came[cur]; }
  pts.reverse();
  // fix level of stair points (choose by height) and smooth
  for (var i = 0; i < pts.length; i++) pts[i].li = resolveLevel(pts[i].li, pts[i].x, pts[i].z);
  var out = [pts[0]], a = 0;
  for (var j = 2; j < pts.length; j++) {
    var A = pts[a], B = pts[j];
    if (A.li !== B.li || !walkClear(A.li, A.x, A.z, B.x, B.z, mode)) { out.push(pts[j - 1]); a = j - 1; }
  }
  if (pts.length > 1) out.push(pts[pts.length - 1]);
  out.len = g[goal] * CELL;
  return out;
}
function pathLength(p) { var s = 0; for (var i = 1; i < p.length; i++) s += Math.sqrt(dist2(p[i].x, p[i].z, p[i - 1].x, p[i - 1].z)); return s; }

// spot where agents stand to reach a room: inside, near first unlocked door
function roomEntryPoint(r, allowLocked) {
  for (var k = 0; k < r.doors.length; k++) {
    var d = MAP.doors[r.doors[k]];
    if (d.locked && !allowLocked) continue;
    var inside = (r.cz > d.z) ? 1 : -1;
    if (d.axis === 'z') return { li: r.li, x: d.x, z: d.z + inside * 1.2 };
    var insx = (r.cx > d.x) ? 1 : -1; return { li: r.li, x: d.x + insx * 1.5, z: d.z };
  }
  return null;
}

// validate: every room the night may use is reachable for players without hall pass
function validateMap(M) {
  var pts = [];
  var lessonRooms = M.slots.filter(function (r) { return ROLE_INFO[r.role].lesson; });
  var ok = true;
  var bus = { li: 1, x: 33, z: -11 };
  var start = roomEntryPoint(M.cafe);
  if (!start) { M.valid = false; return; }
  lessonRooms.concat([M.cafe]).forEach(function (r) {
    if (!ok) return;
    var e = roomEntryPoint(r);
    if (!e) { ok = false; return; }
    var p = findPath(start.li, start.x, start.z, e.li, e.x, e.z, 'p');
    if (!p) ok = false;
    // every chair spot inside must be reachable from the door
    if (ok && r.chairs.length) {
      var c = r.chairs[0];
      if (!findPath(e.li, e.x, e.z, r.li, c.x, c.z, 'p')) ok = false;
    }
  });
  if (ok) { var pb = findPath(start.li, start.x, start.z, 1, bus.x, bus.z, 'p'); if (!pb) ok = false; }
  M.valid = ok;
}


// ===== 05_furnish.js =====
// ---- room furnishing: props, chairs, hide spots, lights, windows, posters ---
function furnishAll(M, rnd) {
  M.win = [new Uint8Array(NX * NZ), new Uint8Array(NX * NZ), new Uint8Array(NX * NZ)];
  var prop = M.prop, block = M.block;
  function addChair(r, x, z, rot, kind, lesson) {
    var c = { id: M.chairs.length, li: r.li, x: x, z: z, rot: rot, room: r.id, kind: kind || 'chair', occ: -1, avail: true, lesson: lesson !== false };
    M.chairs.push(c); r.chairs.push(c); return c;
  }
  function addHide(r, type, x, z, rot, ex, ez, y, li) {
    var h = { id: M.hides.length, type: type, li: li != null ? li : r.li, x: x, z: z, rot: rot, ex: ex, ez: ez, y: y, room: r ? r.id : -1 };
    M.hides.push(h); if (r) r.hides.push(h);
    var L = M.lv[h.li], cx = m2c(x), cz = m2r(z); if (inGrid(cx, cz)) L.hide[cidx(cx, cz)] = h.id;
    return h;
  }
  function light(li, x, y, z, room, opt) { opt = opt || {}; var l = { li: li, x: x, y: y, z: z, room: room, int: opt.int || 1, r: opt.r || 7.5, col: opt.col || [1, 1, 0.93], kind: opt.kind || 'tube', broken: false, g: M.lights.length % 8, rot: opt.rot || 0 }; M.lights.push(l); return l; }
  function dlight(li, x, y, z, col, r, opt) { opt = opt || {}; var l = { li: li, x: x, y: y, z: z, col: col, r: r, nx: opt.nx || 0, nz: opt.nz || 0, int: opt.int || 1, kind: opt.kind || '' }; M.dlights.push(l); return l; }
  function poster(li, x, y, z, rot, kind, w, h, o) { var p = { li: li, x: x, y: y, z: z, rot: rot, kind: kind, w: w || 0.6, h: h || 0.85 }; if (o) for (var k in o) p[k] = o[k]; M.posters.push(p); return p; }
  function item(li, x, z, room) { M.itemSpots.push({ li: li, x: x, z: z, room: room }); }
  function windowsAlong(li, x0, x1, zWall, inward, room, strength) {
    var L = M.win[li];
    for (var x = x0 + 0.5; x + 1.5 <= x1 - 0.25; x += 2) {
      for (var k = 0; k < 3; k++) { var cx = m2c(x + k * 0.5 + 0.25), cz = m2r(zWall + 0.25); if (inGrid(cx, cz) && M.lv[li].type[cidx(cx, cz)] === T_WALL) L[cidx(cx, cz)] = 1; }
      M.windows.push({ li: li, x: x + 0.75, z: zWall + 0.25, nx: 0, nz: inward, room: room });
      dlight(li, x + 0.75, LV_Y[li] + 1.7, zWall + 0.25 + inward * 0.6, [0.36, 0.48, 0.78], 7.5, { nz: inward, int: strength * 0.55, kind: 'moon' });
    }
  }
  function windowsAlongZ(li, z0, z1, xWall, inward, room, strength) {
    var L = M.win[li];
    for (var z = z0 + 0.5; z + 1.5 <= z1 - 0.25; z += 2) {
      for (var k = 0; k < 3; k++) { var cx = m2c(xWall + 0.25), cz = m2r(z + k * 0.5 + 0.25); if (inGrid(cx, cz) && M.lv[li].type[cidx(cx, cz)] === T_WALL) L[cidx(cx, cz)] = 1; }
      M.windows.push({ li: li, x: xWall + 0.25, z: z + 0.75, nx: inward, nz: 0, room: room });
      dlight(li, xWall + 0.25 + inward * 0.6, LV_Y[li] + 1.7, z + 0.75, [0.36, 0.48, 0.78], 7.5, { nx: inward, int: strength * 0.55, kind: 'moon' });
    }
  }
  function ceilingGrid(r, nx, nz, opt) {
    var y = LV_Y[r.li] + r.ceil - 0.02;
    for (var i = 0; i < nx; i++) for (var j = 0; j < nz; j++) {
      var x = r.x0 + (r.x1 - r.x0) * (i + 0.5) / nx, z = r.z0 + (r.z1 - r.z0) * (j + 0.5) / nz;
      light(r.li, x, y, z, r.id, opt);
    }
  }
  function exitSign(li, x, z, rot) {
    M.signs.push({ kind: 'exit', li: li, x: x, y: LV_Y[li] + 2.75, z: z, rot: rot });
    dlight(li, x + Math.sin(rot) * 0.4, LV_Y[li] + 2.5, z + Math.cos(rot) * 0.4, [1.0, 0.12, 0.08], 4.2, { int: 1.1, kind: 'exit' });
  }

  // --- outside ---
  var out = M.outside;
  for (var i = 0; i < 70; i++) {
    var tx = rnd.range(-19, 83), tz = rnd.range(-16.5, -2);
    if (tx > 6 && tx < 54 && tz > -15.5) continue;
    if (tx > 58 && tz > -4) continue;
    prop('tree', 1, tx, tz, rnd() * TAU, { s: rnd.range(0.8, 1.4) });
    block(1, tx - 0.3, tz - 0.3, tx + 0.3, tz + 0.3, 1);
  }
  prop('flagpole', 1, 22, -2.5, 0); block(1, 21.8, -2.7, 22.2, -2.3, 1);
  prop('schoolsign', 1, 40, -3.2, 0); block(1, 38.5, -3.5, 41.5, -3, 1);
  [[14, -8], [46, -8], [30, -15], [5, -5], [55, -5]].forEach(function (p) {
    prop('lamppost', 1, p[0], p[1], 0); block(1, p[0] - 0.2, p[1] - 0.2, p[0] + 0.2, p[1] + 0.2, 1);
    dlight(1, p[0], 5.5, p[1], [1.0, 0.55, 0.22], 11, { int: 1.2, kind: 'sodium' });
    light(1, p[0], 5.5, p[1], out.id, { col: [1.0, 0.6, 0.3], r: 11, int: 1.0, kind: 'none' });
  });
  prop('fence', 1, 0, 0, 0);
  prop('busbody', 1, 30.5, -11, 0);
  // bus seats: 10 rows x 2, facing +x? the bus faces west: driver at x=35 front -> seats face +x (toward front)
  var bus = M.busRoom;
  for (var row = 0; row < 9; row++) {
    var sx = 26.0 + row * 1.0;
    addChair(bus, sx, -11.75, PI / 2, 'busseat');
    addChair(bus, sx, -10.25, PI / 2, 'busseat');
  }
  light(1, 30.5, 2.2, -11, bus.id, { col: [1, 0.95, 0.8], r: 6, int: 0.8, kind: 'none' });
  dlight(1, 30.5, 2.0, -11, [0.9, 0.8, 0.55], 5, { int: 0.45, kind: 'bus' });

  // --- corridors ---
  [M.corrG, M.corrU].forEach(function (r) {
    var li = r.li;
    for (var x = 2; x < 59; x += 3) light(li, x, LV_Y[li] + 3.18, 11.25, r.id, { r: 7.5, int: 1.05 });
    // lockers along both walls (skip near doors/openings)
    [[9.5, 0], [12.5, PI]].forEach(function (side) {
      var zc = side[0], rot = side[1];
      var wallz = rot === 0 ? 9.25 : 13.25;
      for (var cx = m2c(1); cx <= m2c(59); cx++) {
        var x = c2x(cx);
        var wc = cidx(cx, m2r(wallz)), cc = cidx(cx, m2r(zc + 0.25));
        var L = M.lv[li];
        if (L.type[wc] !== T_WALL || L.type[cc] !== T_FLOOR) continue;
        if (L.type[cidx(cx - 1, m2r(wallz))] !== T_WALL || L.type[cidx(cx + 1, m2r(wallz))] !== T_WALL) continue;
        if ((x > 22 && x < 24 && li === 1 && rot === 0) || (Math.abs(x - 36.5) < 1.2 && li === 1 && rot === PI)) continue; // trophy case / fountain gaps
        var hideable = rnd() < 0.22;
        var pz = zc + 0.25;
        prop('locker', li, x, pz, rot, { v: hideable ? 2 : rnd.pick([0, 1, 3, 0, 1]), hide: hideable });
        L.type[cc] = T_BLOCK;
        if (hideable) addHide(r, 'locker', x, pz, rot, x, pz + (rot === 0 ? 0.6 : -0.6), LV_Y[li] + 1.55);
      }
    });
    // posters above lockers and banners
    for (var px = 3; px < 58; px += rnd.range(2.5, 4.5)) {
      var onS = rnd() < 0.5;
      poster(li, px, LV_Y[li] + 2.35 + rnd.range(-0.08, 0.1), onS ? 9.52 : 12.98, onS ? 0 : PI, 'hall');
    }
    M.signs.push({ kind: 'banner', li: li, x: li === 1 ? 30 : 20, y: LV_Y[li] + 2.75, z: 11.25, rot: 0, text: li === 1 ? 'WELCOME BACK, STUDENTS!' : 'HOO-RAY FOR LEARNING!' });
    M.signs.push({ kind: 'banner', li: li, x: li === 1 ? 50 : 45, y: LV_Y[li] + 2.75, z: 11.25, rot: PI, text: li === 1 ? 'NO RUNNING IN THE HALLS' : 'SMILE! YOU\'RE ON CAMERA' });
    // PA speakers, clocks, extinguishers, fountains
    for (var sx2 = 8; sx2 < 58; sx2 += 16) prop('speaker', li, sx2, 12.95, PI, { y: LV_Y[li] + 2.95 });
    prop('clock', li, 30, 12.98, PI, { y: LV_Y[li] + 2.6 });
    prop('extinguisher', li, 18.0, 9.55, 0, { y: LV_Y[li] + 1.1 });
    prop('extinguisher', li, 48.0, 12.95, PI, { y: LV_Y[li] + 1.1 });
    if (li === 1) {
      prop('trophy', 1, 23.0, 9.75, 0); block(1, 22, 9.5, 24, 10, 1);
      prop('fountain', 1, 36.5, 12.75, PI); block(1, 36, 12.5, 37, 13, 0);
    } else {
      prop('fountain', 2, 23.0, 9.75, 0); block(2, 22.5, 9.5, 23.5, 10, 0);
    }
    // camera (SMILE! YOU'RE ON CAMERA)
    prop('cctv', li, 1.0, 12.9, PI * 0.75, { y: LV_Y[li] + 3.0 });
    prop('cctv', li, 58.8, 9.6, -PI * 0.25, { y: LV_Y[li] + 3.0 });
    // scattered paper
    for (var k = 0; k < 18; k++) prop('paper', li, rnd.range(1, 59), rnd.range(10.3, 12.2), rnd() * TAU);
    // TV cart in hallway
    var tvx = rnd.range(6, 54);
    if (cellType(li, m2c(tvx), m2r(10.25)) === T_BLOCK) {
      // replace a locker? no; place on the floor strip near north wall instead
    }
    // emergency lights in corridor (lights-out)
    for (var ex = 6 + rnd() * 4; ex < 58; ex += 12 + rnd() * 6) {
      if (rnd() < 0.25) continue;
      prop('emerg', li, ex, 12.95, PI, { y: LV_Y[li] + 2.9 });
      dlight(li, ex, LV_Y[li] + 2.6, 12.4, [0.85, 0.9, 1.0], 5.5, { int: 0.55, kind: 'emerg' });
    }
    item(li, rnd.range(3, 57), rnd.range(10.5, 12), r.id); item(li, rnd.range(3, 57), rnd.range(10.5, 12), r.id);
  });
  // exits
  exitSign(1, 13.5, 13.0, PI); exitSign(1, 42.5, 13.0, PI); exitSign(2, 16, 13.0, PI); exitSign(2, 45, 13.0, PI);
  exitSign(1, 59.4, 11.25, -PI / 2); exitSign(1, 0.6, 11.25, PI / 2); exitSign(1, 30, 0.6, 0); exitSign(1, 64, -0.9, 0);
  exitSign(1, 45, 13.0, PI);

  // --- stairs ---
  [M.stairs[0], M.stairs[1]].forEach(function (s, k) {
    light(2, (s.x0 + s.x1) / 2, LV_Y[2] + 3.15, 20.7, -1, { r: 8, int: 1.0 });
    light(1, s.x0 + 3.3, LV_Y[1] + 3.15, 17.5, -1, { r: 6, int: 0.8 });
    dlight(2, (s.x0 + s.x1) / 2, LV_Y[2] + 2.8, 20.8, [0.8, 0.85, 1.0], 6, { int: 0.5, kind: 'emerg' });
    windowsAlong(2, s.x0, s.x1 + 2.5, 21.5, -1, -1, 0.6);
  });

  // --- basement ---
  [[35, 21.5], [42, 21.5], [50, 21.5], [57, 21.5]].forEach(function (p, k) {
    prop('bulb', 0, p[0], p[1], 0, { y: -4 + 2.55 });
    light(0, p[0], -4 + 2.5, p[1], M.bcorr.id, { col: [1, 0.8, 0.55], r: 6, int: 0.9, kind: 'bulb' });
    if (k === 1 || k === 3) dlight(0, p[0], -4 + 2.4, p[1], [1.0, 0.45, 0.2], 4.5, { int: 0.6, kind: 'bulb' });
  });
  prop('pipes', 0, 45, 22.6, 0);
  [M.boiler, M.bstore].forEach(function (r) { ceilingGrid(r, 2, 2, { col: [1, 0.82, 0.6], r: 7, int: 0.8, kind: 'bulb' }); });
  prop('boilertank', 0, 52, 13, 0); block(0, 50.5, 11, 53.5, 15, 2);
  prop('boilertank', 0, 57, 13, 0); block(0, 55.5, 11, 58.5, 15, 2);
  dlight(0, 52, -4 + 0.6, 15.6, [1.0, 0.35, 0.1], 5, { int: 1.0, kind: 'fire' });
  dlight(0, 57, -4 + 0.6, 15.6, [1.0, 0.35, 0.1], 5, { int: 1.0, kind: 'fire' });
  addHide(M.boiler, 'behind', 54.25, 9.0, PI, 54.25, 10.0, -4 + 1.2);
  item(0, 55, 17.5, M.boiler.id); item(0, 50, 9, M.boiler.id);
  // prop storage: empty mascot costumes on racks (the friends from the show)
  prop('costume', 0, 32.5, 9.4, 0, { who: 'penny' });
  prop('costume', 0, 35, 9.4, 0, { who: 'bitsy' });
  prop('costume', 0, 37.5, 9.4, 0, { who: 'marbles' });
  block(0, 31.5, 8, 38.5, 10, 1);
  for (var b = 0; b < 10; b++) { var bx = rnd.range(31, 39), bz = rnd.range(12, 18.5); prop('boxes', 0, bx, bz, rnd() * PI, { s: rnd.range(0.7, 1.2) }); block(0, bx - 0.45, bz - 0.45, bx + 0.45, bz + 0.45, 1); }
  addHide(M.bstore, 'behind', 39.4, 18.9, -PI * 0.75, 38.5, 18.5, -4 + 1.1);
  item(0, 35, 14, M.bstore.id);
  poster(0, 34, -4 + 1.6, 8.05, 0, 'hoots', 0.8, 1.1);

  // --- lobby ---
  var lb = M.lobby;
  ceilingGrid(lb, 3, 2, {});
  prop('counter', 1, 26.5, 5, PI / 2, { len: 5 }); block(1, 26, 2.5, 27, 7.5, 1);
  prop('bench', 1, 33.5, 4.5, -PI / 2); block(1, 33, 3.5, 34, 5.5, 0);
  prop('standee', 1, 32.5, 7.5, PI * 0.85);
  poster(1, 30, 1.9, 8.95, PI, 'hoots', 1.2, 1.5);
  M.signs.push({ kind: 'banner', li: 1, x: 30, y: 2.85, z: 8.6, rot: PI, text: 'HOLLOW PINES NIGHT SCHOOL' });
  windowsAlong(1, 24.5, 28.5, 0, 1, lb.id, 1.0); windowsAlong(1, 31.5, 35.5, 0, 1, lb.id, 1.0);
  dlight(1, 30, 1.6, 1.3, [0.42, 0.55, 0.85], 7, { nz: 1, int: 1.1, kind: 'moon' });
  item(1, 33, 7, lb.id);

  // --- cafeteria ---
  var cf = M.cafe;
  ceilingGrid(cf, 4, 5, { r: 8 });
  [[-9.5, 5.5], [-4.5, 5.5], [-9.5, 16.5], [-4.5, 16.5]].forEach(function (t) {
    prop('ctable', 1, t[0], t[1], 0, { len: 4.2 });
    block(1, t[0] - 0.45, t[1] - 2.1, t[0] + 0.45, t[1] + 2.1, 0);
    for (var s = 0; s < 4; s++) {
      var z = t[1] - 1.55 + s * 1.03;
      addChair(cf, t[0] - 0.85, z, PI / 2, 'chair');
      addChair(cf, t[0] + 0.85, z, -PI / 2, 'chair');
    }
    addHide(cf, 'table', t[0], t[1] - 1.0, PI / 2, t[0] - 0.95, t[1] - 1.0, 0.35);
  });
  prop('servecounter', 1, -13.25, 11, PI / 2, { len: 14 }); block(1, -13.5, 4, -13, 18, 1);
  for (var k2 = 0; k2 < 4; k2++) { prop('stove', 1, -17.4, 4 + k2 * 4, PI / 2); block(1, -18, 3.4 + k2 * 4, -17, 4.6 + k2 * 4, 1); }
  prop('vending', 1, -1.0, 3.0, -PI / 2); block(1, -1.5, 2.5, -0.5, 3.5, 2);
  prop('vending', 1, -1.0, 19.5, -PI / 2); block(1, -1.5, 19, -0.5, 20, 2);
  dlight(1, -1.9, 1.5, 3.0, [0.5, 0.85, 1.0], 4.2, { int: 0.9, kind: 'vend' });
  dlight(1, -1.9, 1.5, 19.5, [0.5, 0.85, 1.0], 4.2, { int: 0.9, kind: 'vend' });
  prop('trash', 1, -2.0, 8.5, 0); prop('trash', 1, -2.0, 14.5, 0);
  poster(1, -8, 2.1, 21.45, PI, 'lunch', 1.0, 0.7); poster(1, -4, 2.1, 0.55, 0, 'milk', 0.7, 0.9);
  windowsAlongZ(1, 0.5, 21.5, -18.5, 1, cf.id, 1.0);
  windowsAlong(1, -12, -0.5, 0, 1, cf.id, 1.0);
  addHide(cf, 'behind', -15.5, 20.8, PI, -14.5, 20.6, 1.1);
  item(1, -15.5, 8, cf.id); item(1, -7, 11, cf.id);

  // --- gym ---
  var gy = M.gym;
  ceilingGrid(gy, 4, 3, { r: 17, int: 3.2, kind: 'highbay' });
  prop('bleachers', 1, 70.25, 20.75, 0, { len: 16 }); block(1, 62.25, 18.5, 78.25, 23, 1);
  for (var hx = 63; hx <= 77; hx += 2.8) addHide(gy, 'bleacher', hx, 19.0, PI, hx, 18.0, 0.7);
  prop('hoop', 1, 61.0, 11, PI / 2); prop('hoop', 1, 79.5, 11, -PI / 2);
  prop('scoreboard', 1, 70.25, -0.9, 0, { y: 5.6 });
  prop('mats', 1, 79, 1.5, 0); block(1, 78, 0.5, 80, 2.5, 1);
  prop('ballcart', 1, 62, 2, 0); block(1, 61.5, 1.5, 62.5, 2.5, 0);
  poster(1, 66, 2.2, -0.95, 0, 'gym', 1.0, 0.7);
  M.signs.push({ kind: 'banner', li: 1, x: 70.25, y: 6.5, z: 22.9, rot: PI, text: 'GO NIGHT OWLS!', big: true });
  for (var gw = 62; gw < 79; gw += 3) { dlight(1, gw + 0.75, 5.8, -0.5, [0.42, 0.55, 0.85], 9, { nz: 1, int: 0.7, kind: 'moon' }); M.windows.push({ li: 1, x: gw + 0.75, z: -1.25, nx: 0, nz: 1, high: true, room: gy.id }); }
  item(1, 75, 5, gy.id); item(1, 65, 15, gy.id);

  // --- slot rooms by role ---
  M.slots.forEach(function (r) { furnishRoom(M, r, rnd, addChair, addHide, light, dlight, poster, item, windowsAlong, ceilingGrid); });
}

function furnishRoom(M, r, rnd, addChair, addHide, light, dlight, poster, item, windowsAlong, ceilingGrid) {
  var prop = M.prop, block = M.block, li = r.li, Y = LV_Y[li];
  var info = ROLE_INFO[r.role];
  var winZ = r.side === 'S' ? 0 : 21.5, inward = r.side === 'S' ? 1 : -1;
  var moonStrength = r.side === 'S' ? 1.0 : 0.55;
  windowsAlong(li, r.x0, r.x1, winZ, inward, r.id, moonStrength);
  var corrWallZ = r.side === 'S' ? r.z1 - 0.03 : r.z0 + 0.03, corrRot = r.side === 'S' ? PI : 0;
  var x0 = r.x0, x1 = r.x1, cz = r.cz;
  ceilingGrid(r, 3, 2, {});
  // room sign by the door (corridor side) + clock + flag
  var d0 = M.doors[r.doors[0]];
  M.signs.push({ kind: 'roomplate', li: li, x: d0.x + 0.95, y: Y + 1.75, z: r.side === 'S' ? 9.53 : 12.97, rot: r.side === 'S' ? 0 : PI, text: String(r.number), sub: info.en });
  prop('clock', li, (x0 + x1) / 2, corrWallZ, corrRot, { y: Y + 2.55 });
  prop('speaker', li, x0 + 0.05, cz + 2.8, PI / 2, { y: Y + 2.9 });
  item(li, rnd.range(x0 + 1, x1 - 1), rnd.range(r.z0 + 1, r.z1 - 1), r.id);
  var kind = info.kind;
  var board = function (lines) { prop('board', li, x0 + 0.04, cz, PI / 2, { y: Y + 1.55, w: 5.2, lines: lines, room: r.id }); };

  if (kind === 'class' || kind === 'science' || kind === 'music' || kind === 'art' || kind === 'homeec') {
    board(null);
    prop('tdesk', li, x0 + 1.7, cz - 1.8, PI / 2); block(li, x0 + 1.2, cz - 2.6, x0 + 2.2, cz - 1.0, 0);
    prop('flag', li, x0 + 0.35, r.z1 - 0.6, PI / 2, { y: Y });
    poster(li, x1 - 0.03, Y + 1.7, cz, -PI / 2, 'class', 0.9, 1.2);
    prop('bboard', li, (x0 + x1) / 2 + 1.5, corrWallZ, corrRot, { y: Y + 1.55 });
  }
  var lesson = !!info.lesson;
  if (kind === 'class') {
    for (var row = 0; row < 4; row++) for (var col = 0; col < 3; col++) {
      var dx = x0 + 3.5 + row * 2.0, dz = cz + (col - 1) * 2.4;
      if (dx > x1 - 1.2) continue;
      prop('desk', li, dx, dz, -PI / 2); block(li, dx - 0.25, dz - 0.25, dx + 0.25, dz + 0.25, 0);
      var ch = addChair(r, dx + 0.6, dz, -PI / 2, 'chair', lesson);
      if (r.role === 'DETENTION' && rnd() < 0.4) ch.rot = PI / 2; // facing the wall...
      addHide(r, 'desk', dx, dz, -PI / 2, dx + 0.7, dz, Y + 0.32);
    }
    if (r.role === 'DETENTION') board([{ t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT', size: 34 }]);
    if (r.role === 'HISTORY') prop('globe', li, x0 + 1.7, cz - 1.8, 0, { y: Y + 0.78 });
  } else if (kind === 'science') {
    for (var b = 0; b < 3; b++) {
      var bx = x0 + 3.8 + b * 2.6;
      prop('labbench', li, bx, cz, 0, { len: 4.4 }); block(li, bx - 0.4, cz - 2.2, bx + 0.4, cz + 2.2, 0);
      for (var s = 0; s < 4; s++) { var sz = cz - 1.65 + s * 1.1; addChair(r, bx + 0.75, sz, -PI / 2, 'stool', lesson); }
      addHide(r, 'desk', bx, cz + 0.5, -PI / 2, bx + 0.9, cz + 0.5, Y + 0.32);
    }
    prop('skeleton', li, x1 - 0.7, r.z0 + 0.8, -PI * 0.75); block(li, x1 - 1, r.z0 + 0.5, x1 - 0.5, r.z0 + 1, 1);
    prop('cabinet', li, x1 - 0.35, cz + 2, -PI / 2); block(li, x1 - 0.5, cz + 1.5, x1, cz + 2.5, 2);
    poster(li, x1 - 0.03, Y + 1.7, cz - 1.2, -PI / 2, 'periodic', 1.2, 0.8);
  } else if (kind === 'music') {
    prop('piano', li, x0 + 1.4, cz + 2.2, PI / 2); block(li, x0 + 0.5, cz + 1.4, x0 + 2.0, cz + 3.0, 1);
    for (var mr = 0; mr < 3; mr++) for (var mc = 0; mc < 4; mc++) {
      var mx = x0 + 3.6 + mr * 2.2, mz = cz - 2.7 + mc * 1.8;
      addChair(r, mx, mz, -PI / 2, 'chair', lesson);
      prop('stand', li, mx - 0.55, mz, -PI / 2);
    }
    prop('drums', li, x1 - 1.2, r.z0 + 1.2, -PI * 0.75); block(li, x1 - 2, r.z0 + 0.5, x1 - 0.5, r.z0 + 2, 1);
    poster(li, x1 - 0.03, Y + 1.7, cz - 1.5, -PI / 2, 'music', 0.9, 0.7);
  } else if (kind === 'art') {
    for (var t = 0; t < 3; t++) {
      var ax = x0 + 3.8 + t * 2.7;
      prop('arttable', li, ax, cz, 0); block(li, ax - 0.6, cz - 0.9, ax + 0.6, cz + 0.9, 0);
      addChair(r, ax - 0.95, cz - 0.45, PI / 2, 'stool', lesson); addChair(r, ax - 0.95, cz + 0.45, PI / 2, 'stool', lesson);
      addChair(r, ax + 0.95, cz - 0.45, -PI / 2, 'stool', lesson); addChair(r, ax + 0.95, cz + 0.45, -PI / 2, 'stool', lesson);
      addHide(r, 'desk', ax, cz, PI / 2, ax - 1.1, cz, Y + 0.32);
    }
    for (var e = 0; e < 3; e++) prop('easel', li, x1 - 0.9, r.z0 + 1.5 + e * 2.2, -PI / 2);
    block(li, x1 - 1.2, r.z0 + 1, x1 - 0.6, r.z0 + 6, 0);
    prop('paint', li, (x0 + x1) / 2, cz, 0);
  } else if (kind === 'homeec') {
    for (var st = 0; st < 3; st++) { prop('stove', li, x1 - 0.45, r.z0 + 1.5 + st * 2.5, -PI / 2); block(li, x1 - 1, r.z0 + 0.9 + st * 2.5, x1, r.z0 + 2.1 + st * 2.5, 1); }
    for (var ht = 0; ht < 2; ht++) {
      var hx = x0 + 4 + ht * 3.5;
      prop('arttable', li, hx, cz, 0); block(li, hx - 0.6, cz - 0.9, hx + 0.6, cz + 0.9, 0);
      addChair(r, hx - 0.95, cz, PI / 2, 'chair', false); addChair(r, hx + 0.95, cz, -PI / 2, 'chair', false);
      addHide(r, 'desk', hx, cz, PI / 2, hx - 1.1, cz, Y + 0.32);
    }
  } else if (kind === 'library') {
    for (var sh = 0; sh < 4; sh++) {
      var shx = x0 + 4.5 + sh * 1.8;
      prop('shelf', li, shx, cz - 0.6, 0, { len: 5 }); block(li, shx - 0.25, cz - 3.1, shx + 0.25, cz + 1.9, 2);
    }
    prop('ltable', li, x0 + 2, cz, 0); block(li, x0 + 1.5, cz - 1, x0 + 2.5, cz + 1, 0);
    addChair(r, x0 + 1.2, cz - 0.5, PI / 2, 'chair', false); addChair(r, x0 + 1.2, cz + 0.5, PI / 2, 'chair', false);
    addHide(r, 'table', x0 + 2, cz, PI / 2, x0 + 1.1, cz, Y + 0.32);
    prop('cardcat', li, x1 - 0.5, r.z0 + 1, -PI / 2); block(li, x1 - 1, r.z0 + 0.5, x1, r.z0 + 1.5, 1);
    poster(li, x1 - 0.03, Y + 1.7, cz + 2.5, -PI / 2, 'read', 0.7, 1.0);
    board([{ t: 'QUIET PLEASE.', size: 48 }, { t: 'Overdue books must be returned', size: 30 }, { t: 'before the bell.', size: 30 }]);
  } else if (kind === 'nurse') {
    for (var cb = 0; cb < 2; cb++) {
      var cx2 = x0 + 3 + cb * 3.2;
      prop('cot', li, cx2, r.side === 'S' ? r.z0 + 1.2 : r.z1 - 1.2, r.side === 'S' ? 0 : PI);
      var zz = r.side === 'S' ? r.z0 + 1.2 : r.z1 - 1.2;
      block(li, cx2 - 1, zz - 0.4, cx2 + 1, zz + 0.4, 0);
      addHide(r, 'cot', cx2, zz, r.side === 'S' ? PI : 0, cx2, zz + inward * 0.9, Y + 0.25);
      prop('curtain', li, cx2 + 1.4, zz, PI / 2);
    }
    prop('cabinet', li, x1 - 0.35, cz, -PI / 2); block(li, x1 - 0.5, cz - 0.5, x1, cz + 0.5, 2);
    prop('tdesk', li, x0 + 1.5, cz + 2, PI / 2); block(li, x0 + 1, cz + 1.2, x0 + 2, cz + 2.8, 0);
    poster(li, x0 + 0.03, Y + 1.6, cz - 1.5, PI / 2, 'eyechart', 0.55, 0.85);
    poster(li, x1 - 0.03, Y + 1.7, cz + 2, -PI / 2, 'germs', 0.7, 0.9);
  } else if (kind === 'principal') {
    prop('tdesk', li, x1 - 3, cz, -PI / 2); block(li, x1 - 3.5, cz - 0.8, x1 - 2.5, cz + 0.8, 0);
    addHide(r, 'desk', x1 - 3, cz, -PI / 2, x1 - 3.9, cz, Y + 0.32);
    prop('pamic', li, x1 - 3, cz + 0.4, -PI / 2, { y: Y + 0.78 });
    for (var f = 0; f < 4; f++) { prop('filing', li, x1 - 0.4, r.z0 + 0.8 + f * 0.9, -PI / 2); block(li, x1 - 0.7, r.z0 + 0.4 + f * 0.9, x1, r.z0 + 1.2 + f * 0.9, 1); }
    for (var wc = 0; wc < 4; wc++) addChair(r, x0 + 1.5 + wc * 1.1, r.side === 'S' ? r.z0 + 0.7 : r.z1 - 0.7, r.side === 'S' ? 0 : PI, 'chair', false);
    prop('flag', li, x1 - 1.2, r.z1 - 0.6, -PI / 2, { y: Y });
    poster(li, x0 + 0.03, Y + 1.7, cz, PI / 2, 'portrait', 0.7, 0.9);
    poster(li, x0 + 0.03, Y + 1.7, cz + 2, PI / 2, 'certificate', 0.7, 0.5);
  } else if (kind === 'av') {
    for (var tv = 0; tv < 3; tv++) {
      var tvx = x0 + 2 + tv * 3.2, tvz = r.side === 'S' ? r.z0 + 1.0 : r.z1 - 1.0;
      prop('tvcart', li, tvx, tvz, r.side === 'S' ? 0 : PI);
      block(li, tvx - 0.4, tvz - 0.4, tvx + 0.4, tvz + 0.4, 1);
      M.tvs.push({ li: li, x: tvx, z: tvz, rot: r.side === 'S' ? 0 : PI, room: r.id, y: Y + 1.15 });
    }
    prop('vhsshelf', li, x1 - 0.35, cz, PI, { len: 4 }); block(li, x1 - 0.5, cz - 2, x1, cz + 2, 2);
    prop('vcr', li, x0 + 1.2, cz, PI / 2); block(li, x0 + 0.8, cz - 0.6, x0 + 1.6, cz + 0.6, 0);
    r.vcr = { li: li, x: x0 + 1.9, z: cz };
    for (var ar = 0; ar < 2; ar++) for (var ac = 0; ac < 4; ac++) addChair(r, x0 + 4 + ar * 2, cz - 2.4 + ac * 1.6, -PI / 2, 'chair', false);
    poster(li, x0 + 0.03, Y + 1.7, cz + 2.5, PI / 2, 'vhs', 0.7, 0.9);
  } else if (kind === 'restroom') {
    // stalls along the window-opposite side
    var stz = r.side === 'S' ? r.z0 : r.z1, dirz = r.side === 'S' ? 1 : -1;
    for (var sI = 0; sI < 4; sI++) {
      var sx = x0 + 1.5 + sI * 1.4;
      prop('stall', li, sx, stz + dirz * 0.75, r.side === 'S' ? 0 : PI);
      block(li, sx - 0.75, Math.min(stz, stz + dirz * 1.5), sx - 0.6, Math.max(stz, stz + dirz * 1.5), 2);
      addHide(r, 'stall', sx, stz + dirz * 0.7, r.side === 'S' ? 0 : PI, sx, stz + dirz * 2.0, Y + 1.1);
    }
    block(li, x0 + 6.75, Math.min(stz, stz + dirz * 1.5), x0 + 6.9, Math.max(stz, stz + dirz * 1.5), 2);
    for (var sk = 0; sk < 3; sk++) { var skx = x0 + 8 + sk * 1.0; prop('sink', li, skx, r.side === 'S' ? r.z1 - 0.35 : r.z0 + 0.35, r.side === 'S' ? PI : 0); }
    block(li, x0 + 7.5, r.side === 'S' ? r.z1 - 0.5 : r.z0, x0 + 10.5, r.side === 'S' ? r.z1 : r.z0 + 0.5, 0);
    prop('mirror', li, x0 + 9, r.side === 'S' ? r.z1 - 0.03 : r.z0 + 0.03, r.side === 'S' ? PI : 0, { y: Y + 1.6, w: 3 });
    r.mirror = { x: x0 + 9, z: r.side === 'S' ? r.z1 - 0.05 : r.z0 + 0.05, y: Y + 1.6 };
    r.tiled = true;
  } else if (kind === 'lounge') {
    prop('couch', li, x0 + 2.5, cz, PI / 2); block(li, x0 + 2, cz - 1.2, x0 + 3, cz + 1.2, 1);
    prop('ltable', li, x0 + 4.2, cz, 0); block(li, x0 + 3.7, cz - 0.6, x0 + 4.7, cz + 0.6, 0);
    prop('vending', li, x1 - 0.5, r.z0 + 1, -PI / 2); block(li, x1 - 1, r.z0 + 0.5, x1, r.z0 + 1.5, 2);
    dlight(li, x1 - 1.4, Y + 1.5, r.z0 + 1, [0.5, 0.85, 1.0], 4, { int: 0.8, kind: 'vend' });
    prop('fridge', li, x1 - 0.45, r.z1 - 1, -PI / 2); block(li, x1 - 1, r.z1 - 1.5, x1, r.z1 - 0.5, 2);
    for (var lc = 0; lc < 4; lc++) addChair(r, x0 + 7 + (lc % 2) * 1.4, cz - 0.8 + Math.floor(lc / 2) * 1.6, lc % 2 ? -PI / 2 : PI / 2, 'chair', false);
    prop('ltable', li, x0 + 7.7, cz, 0); block(li, x0 + 7.2, cz - 0.6, x0 + 8.2, cz + 0.6, 0);
    addHide(r, 'table', x0 + 7.7, cz, PI / 2, x0 + 6.6, cz, Y + 0.32);
    poster(li, x0 + 0.03, Y + 1.7, cz, PI / 2, 'memo', 0.6, 0.8);
  } else if (kind === 'storage') {
    for (var bI = 0; bI < 12; bI++) { var bx2 = rnd.range(x0 + 1.5, x1 - 1), bz2 = rnd.range(r.z0 + 1, r.z1 - 1); prop('boxes', li, bx2, bz2, rnd() * PI, { s: rnd.range(0.6, 1.1) }); block(li, bx2 - 0.4, bz2 - 0.4, bx2 + 0.4, bz2 + 0.4, 1); }
    prop('shelf', li, x1 - 0.4, cz, 0, { len: 6, metal: true }); block(li, x1 - 0.6, cz - 3, x1, cz + 3, 2);
    addHide(r, 'behind', x1 - 1.0, r.side === 'S' ? r.z0 + 0.5 : r.z1 - 0.5, PI / 2, x1 - 1.8, r.side === 'S' ? r.z0 + 0.8 : r.z1 - 0.8, Y + 1.1);
  } else if (kind === 'office') {
    prop('tdesk', li, x0 + 3, cz, PI / 2); block(li, x0 + 2.5, cz - 0.8, x0 + 3.5, cz + 0.8, 0);
    addHide(r, 'desk', x0 + 3, cz, PI / 2, x0 + 3.9, cz, Y + 0.32);
    prop('couch', li, x1 - 1, cz, -PI / 2); block(li, x1 - 1.5, cz - 1.2, x1 - 0.5, cz + 1.2, 1);
    poster(li, x1 - 0.03, Y + 1.8, cz, -PI / 2, 'help', 0.8, 0.9);
    prop('plant', li, x0 + 0.6, r.z0 + 0.6, 0);
    addChair(r, x0 + 4.5, cz, -PI / 2, 'chair', false);
  }
  // decoration chairs & desks list for raids: classroom-like rooms keep their chairs
  r.lesson = lesson;
  if (lesson) r.subject = r.role;
}


// ===== 06_mats.js =====
// ---- materials: Phong + baked dual lighting (lights ON / lights OFF) --------
var LIGHTU = { uMix: { value: 1 }, uFlick: { value: [1, 1, 1, 1, 1, 1, 1, 1] }, uTime: { value: 0 }, uEmerg: { value: 1 } };
// mode: 'attr' (merged static geometry), 'inst' (instanced), 'probe' (per-object uniforms)
function bakeMat(params, mode, extra) {
  var m = new THREE.MeshPhongMaterial(params);
  m.userData.mode = mode || 'attr';
  m.userData.probeOn = { value: new THREE.Color(0.6, 0.6, 0.6) };
  m.userData.probeOff = { value: new THREE.Color(0.03, 0.035, 0.05) };
  extra = extra || {};
  m.onBeforeCompile = function (sh) {
    sh.uniforms.uMix = LIGHTU.uMix; sh.uniforms.uFlick = LIGHTU.uFlick; sh.uniforms.uTime = LIGHTU.uTime; sh.uniforms.uEmerg = LIGHTU.uEmerg;
    sh.uniforms.uProbeOn = m.userData.probeOn; sh.uniforms.uProbeOff = m.userData.probeOff;
    var mode = m.userData.mode;
    var decl = '\nuniform float uMix; uniform float uFlick[8]; uniform float uTime; uniform float uEmerg; uniform vec3 uProbeOn; uniform vec3 uProbeOff; varying vec3 vBake;\n' +
      (mode === 'attr' ? 'attribute vec4 bOn; attribute vec4 bOff;\n' : '') +
      (mode === 'inst' ? 'attribute vec3 bOnI; attribute vec3 bOffI;\n' : '') + (extra.vdecl || '');
    var body;
    if (mode === 'attr') body = 'int gi = int(bOn.a * 7.0 + 0.5); float fl = 1.0;\n for (int k = 0; k < 8; k++) { if (k == gi) fl = uFlick[k]; }\n float em = mix(1.0, uEmerg, bOff.a);\n vBake = mix(bOff.rgb * 2.0 * em, bOn.rgb * 2.0 * fl, uMix);\n';
    else if (mode === 'inst') body = 'vBake = mix(bOffI * 2.0, bOnI * 2.0 * uFlick[0], uMix);\n';
    else body = 'vBake = mix(uProbeOff, uProbeOn, uMix);\n';
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + decl)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + body + (extra.vbody || ''));
    if (extra.fmap) sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', extra.fmap);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBake; uniform float uTime;\n' + (extra.fdecl || ''))
      .replace('#include <aomap_fragment>', (extra.fbody || '') + 'reflectedLight.indirectDiffuse += vBake * diffuseColor.rgb;\n#include <aomap_fragment>');
    if (extra.uniforms) for (var k in extra.uniforms) sh.uniforms[k] = extra.uniforms[k];
    m.userData.shader = sh;
  };
  m.customProgramCacheKey = function () { return 'bake-' + m.userData.mode + (extra.key || ''); };
  return m;
}
function setProbe(mat, on, off) { mat.userData.probeOn.value.setRGB(on[0], on[1], on[2]); mat.userData.probeOff.value.setRGB(off[0], off[1], off[2]); }

var MATS = {};
function makeWorldMaterials() {
  var aniso = MAX_ANISO;
  function tx(c, rx, ry) { var t = toTex(c, { aniso: Math.min(8, aniso) }); if (rx) t.repeat.set(rx, ry || rx); return t; }
  TEX.lino = tx(texLino([206, 198, 176], [58, 64, 74], 7));
  TEX.lino2 = tx(texLino([210, 202, 180], [150, 138, 112], 8));
  TEX.gym = tx(texWoodFloor(3));
  TEX.tile = tx(texSmallTile(5));
  TEX.terrazzo = tx(texTerrazzo(9));
  TEX.carpet = tx(texCarpet(11));
  TEX.concrete = tx(texConcrete(13));
  TEX.ceiling = tx(texCeiling(17));
  TEX.ceiling2 = tx(texCeiling(18));
  TEX.cmu = tx(texCMU(19));
  TEX.glazed = tx(texGlazed(23, [112, 38, 36]));
  TEX.glazedG = tx(texGlazed(24, [52, 88, 74]));
  TEX.brick = tx(texBrick(29));
  TEX.lockers = tx(texLockers(37));
  TEX.wood = tx(texWood(41, [150, 102, 60]));
  TEX.woodDark = tx(texWood(42, [92, 60, 36]));
  TEX.metal = tx(texMetal(43, [160, 162, 160]));
  var asph = texConcrete(71); pixels(asph, function (x, y, p) { p[0] = p[0] * 0.45; p[1] = p[1] * 0.45; p[2] = p[2] * 0.47; });
  TEX.asphalt = tx(asph);
  var grass = mkCanvas(256, 256); pixels(grass, function (x, y, p) { var n = fbm(x * 0.05, y * 0.05, 4); var h = hash2(x, y); p[0] = 40 + n * 30 + h * 20; p[1] = 58 + n * 40 + h * 25; p[2] = 30 + n * 18; p[3] = 255; });
  TEX.grass = tx(grass);
  var bump = toTex(texNoiseGray(256, 0.08, 1.2)); TEX.bump = bump;

  MATS.floor = {};
  MATS.floor[M_LINO] = bakeMat({ map: TEX.lino, shininess: 70, specular: new THREE.Color(0.28, 0.28, 0.26) });
  MATS.floor[M_LINO2] = bakeMat({ map: TEX.lino2, shininess: 70, specular: new THREE.Color(0.28, 0.28, 0.26) });
  MATS.floor[M_GYM] = bakeMat({ map: TEX.gym, shininess: 90, specular: new THREE.Color(0.35, 0.3, 0.25) });
  MATS.floor[M_TILE] = bakeMat({ map: TEX.tile, shininess: 60, specular: new THREE.Color(0.25, 0.25, 0.25) });
  MATS.floor[M_TERRAZZO] = bakeMat({ map: TEX.terrazzo, shininess: 60, specular: new THREE.Color(0.25, 0.25, 0.24) });
  MATS.floor[M_CARPET] = bakeMat({ map: TEX.carpet, shininess: 2, specular: new THREE.Color(0, 0, 0) });
  MATS.floor[M_CONCRETE] = bakeMat({ map: TEX.concrete, shininess: 8, specular: new THREE.Color(0.05, 0.05, 0.05) });
  MATS.floor[M_ASPHALT] = bakeMat({ map: TEX.asphalt, shininess: 30, specular: new THREE.Color(0.12, 0.12, 0.13) });
  MATS.floor[M_GRASS] = bakeMat({ map: TEX.grass, shininess: 3, specular: new THREE.Color(0, 0, 0) });
  MATS.floor[M_BUS] = bakeMat({ map: TEX.concrete, color: 0x555048, shininess: 10 });
  MATS.ceiling = bakeMat({ map: TEX.ceiling, shininess: 4, specular: new THREE.Color(0.02, 0.02, 0.02) });
  MATS.ceiling2 = bakeMat({ map: TEX.ceiling2, shininess: 4, specular: new THREE.Color(0.02, 0.02, 0.02) });
  MATS.ceilingDark = bakeMat({ map: TEX.concrete, color: 0x6a6660, shininess: 4 });
  MATS.cmu = bakeMat({ map: TEX.cmu, vertexColors: true, shininess: 14, specular: new THREE.Color(0.06, 0.06, 0.06) });
  MATS.glazed = bakeMat({ map: TEX.glazed, vertexColors: true, shininess: 90, specular: new THREE.Color(0.4, 0.4, 0.4) });
  MATS.brick = bakeMat({ map: TEX.brick, shininess: 4, specular: new THREE.Color(0.03, 0.03, 0.03), bumpMap: TEX.bump, bumpScale: 0.02 });
  MATS.tilewall = bakeMat({ map: TEX.tile, vertexColors: true, shininess: 70, specular: new THREE.Color(0.3, 0.3, 0.3) });
  MATS.concreteWall = bakeMat({ map: TEX.concrete, vertexColors: true, shininess: 6 });
  MATS.paint = bakeMat({ vertexColors: true, shininess: 24, specular: new THREE.Color(0.12, 0.12, 0.12) }); // generic props
  MATS.metalP = bakeMat({ map: TEX.metal, vertexColors: true, shininess: 60, specular: new THREE.Color(0.45, 0.45, 0.45) });
  MATS.wood = bakeMat({ map: TEX.wood, vertexColors: true, shininess: 30, specular: new THREE.Color(0.15, 0.13, 0.1) });
  MATS.lockers = bakeMat({ map: TEX.lockers, vertexColors: true, shininess: 50, specular: new THREE.Color(0.35, 0.35, 0.35) });
  MATS.emit = bakeMat({ vertexColors: true, shininess: 0, specular: new THREE.Color(0, 0, 0) }); // light fixtures / signs (lit by bake)
  MATS.glass = new THREE.MeshPhongMaterial({ color: 0x0a1420, transparent: true, opacity: 0.42, shininess: 120, specular: new THREE.Color(0.6, 0.65, 0.7), depthWrite: false });
  MATS.outsideBlack = new THREE.MeshBasicMaterial({ color: 0x000000 });
}


// ===== 07_build.js =====
// ---- world mesh builder ---------------------------------------------------
var WORLD = null; // { group, chunks:[{li, mesh...}], doors:[], chairs:InstancedMeshes, boards:[], tvs:[], ... }
var CHUNK = 26;

function Acc(li, mat) { this.li = li; this.mat = mat; this.p = []; this.n = []; this.uv = []; this.c = []; this.ov = []; this.idx = []; this.vc = 0; }
Acc.prototype.vert = function (x, y, z, nx, ny, nz, u, v, col, ov) {
  this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v);
  this.c.push(col ? col[0] : 1, col ? col[1] : 1, col ? col[2] : 1); this.ov.push(ov || null);
  return this.vc++;
};
Acc.prototype.quad = function (a, b, c, d) { this.idx.push(a, b, c, a, c, d); };

var _m4 = null, _m3 = null, _v3 = null;
var GEO = {};
function initGeoTemplates() {
  _m4 = new THREE.Matrix4(); _m3 = new THREE.Matrix3(); _v3 = new THREE.Vector3();
  function prep(g) { g = g.index ? g : g; return { p: g.attributes.position.array, n: g.attributes.normal.array, uv: g.attributes.uv.array, idx: g.index ? g.index.array : null, count: g.attributes.position.count }; }
  GEO.box = prep(new THREE.BoxGeometry(1, 1, 1));
  GEO.cyl = prep(new THREE.CylinderGeometry(1, 1, 1, 12, 1));
  GEO.cyl6 = prep(new THREE.CylinderGeometry(1, 1, 1, 6, 1));
  GEO.cone = prep(new THREE.ConeGeometry(1, 1, 8, 1));
  GEO.sph = prep(new THREE.SphereGeometry(1, 12, 8));
  GEO.plane = prep(new THREE.PlaneGeometry(1, 1));
}
// append template geometry transformed by (pos, rotY around prop) + local part transform
function appendGeo(acc, tpl, mtx, col, uvs, ov) {
  _m3.getNormalMatrix(mtx);
  var base = acc.vc, e = mtx.elements, ne = _m3.elements;
  for (var i = 0; i < tpl.count; i++) {
    var x = tpl.p[i * 3], y = tpl.p[i * 3 + 1], z = tpl.p[i * 3 + 2];
    var px = e[0] * x + e[4] * y + e[8] * z + e[12], py = e[1] * x + e[5] * y + e[9] * z + e[13], pz = e[2] * x + e[6] * y + e[10] * z + e[14];
    var nx = tpl.n[i * 3], ny = tpl.n[i * 3 + 1], nz = tpl.n[i * 3 + 2];
    var qx = ne[0] * nx + ne[3] * ny + ne[6] * nz, qy = ne[1] * nx + ne[4] * ny + ne[7] * nz, qz = ne[2] * nx + ne[5] * ny + ne[8] * nz;
    var l = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
    var u = tpl.uv[i * 2], v = tpl.uv[i * 2 + 1];
    if (uvs) { u = uvs[0] + u * uvs[2]; v = uvs[1] + v * uvs[3]; }
    acc.vert(px, py, pz, qx / l, qy / l, qz / l, u, v, col, ov);
  }
  if (tpl.idx) for (var k = 0; k < tpl.idx.length; k++) acc.idx.push(base + tpl.idx[k]);
  else for (var k2 = 0; k2 < tpl.count; k2++) acc.idx.push(base + k2);
}

// world builder context
function Builder() { this.accs = {}; }
Builder.prototype.acc = function (li, mat, x, z) {
  var ch = Math.floor((x - OX) / CHUNK), cz = Math.floor((z - OZ) / 22);
  var key = li + '|' + ch + '|' + cz + '|' + mat.uuid;
  var a = this.accs[key];
  if (!a) { a = this.accs[key] = new Acc(li, mat); a.ch = ch; a.cz = cz; }
  return a;
};
// part placement relative to a prop frame
function PF(b, li, x, y, z, rot) { this.b = b; this.li = li; this.x = x; this.y = y; this.z = z; this.rot = rot; this.c = Math.cos(rot); this.s = Math.sin(rot); }
var _pfQ = null, _pfE = null, _pfP = null, _pfS = null;
PF.prototype.m = function (lx, ly, lz, sx, sy, sz, rx, ry, rz) {
  if (!_pfQ) { _pfQ = new THREE.Quaternion(); _pfE = new THREE.Euler(); _pfP = new THREE.Vector3(); _pfS = new THREE.Vector3(); }
  _pfE.set(rx || 0, (ry || 0) + this.rot, rz || 0, 'YXZ'); _pfQ.setFromEuler(_pfE);
  var wx = this.x + this.c * lx + this.s * lz, wz = this.z - this.s * lx + this.c * lz;
  _pfP.set(wx, this.y + ly, wz); _pfS.set(sx, sy, sz);
  _m4.compose(_pfP, _pfQ, _pfS);
  return _m4;
};
PF.prototype.part = function (tpl, mat, lx, ly, lz, sx, sy, sz, col, o) {
  o = o || {};
  var m = this.m(lx, ly, lz, sx, sy, sz, o.rx, o.ry, o.rz);
  var acc = this.b.acc(this.li, mat, this.x, this.z);
  appendGeo(acc, tpl, m, col, o.uv, o.ov);
};
PF.prototype.box = function (mat, lx, ly, lz, sx, sy, sz, col, o) { this.part(GEO.box, mat, lx, ly + sy / 2, lz, sx, sy, sz, col, o); };
PF.prototype.cyl = function (mat, lx, ly, lz, r, h, col, o) { this.part(o && o.six ? GEO.cyl6 : GEO.cyl, mat, lx, ly + h / 2, lz, r, h, r, col, o); };
PF.prototype.sph = function (mat, lx, ly, lz, r, col, o) { this.part(GEO.sph, mat, lx, ly, lz, r, (o && o.sy) || r, r, col, o); };
PF.prototype.plane = function (mat, lx, ly, lz, w, h, col, o) { this.part(GEO.plane, mat, lx, ly, lz, w, h, 1, col, o); };

// ---------------------------------------------------------------------------
function C(hex) { return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]; }
var COL = {
  metal: C(0x8d9094), dark: C(0x2a2a2c), black: C(0x111112), wood: C(0xc49a6c), woodD: C(0x6e4a2e), white: C(0xe8e6df), red: C(0xb02020),
  chairBlue: C(0x2f5b8f), chairOr: C(0xc8662a), green: C(0x2f5a3a), cream: C(0xd8cfb4), steel: C(0xb7bcc0), yellow: C(0xe0a81c), rubber: C(0x1c1c1c)
};

function buildWorld(M) {
  initGeoTemplates();
  if (!MATS.floor) makeWorldMaterials();
  var B = new Builder();
  var specials = { boards: [], tvs: [], doors: [], banners: [], plates: [], hootsEyes: [], mirrors: [], screens: [] };
  buildShell(M, B);
  buildStairs(M, B);
  buildFixtures(M, B);
  M.props.forEach(function (p) { buildProp(M, B, p, specials); });
  buildBarricades(M, B);
  var posterMesh = buildPosters(M, B, specials);
  buildSigns(M, B, specials);
  // finalize: bake + meshes
  var group = new THREE.Group();
  var chunks = [];
  var bk = new Baker(M);
  for (var key in B.accs) {
    var a = B.accs[key];
    if (!a.idx.length) continue;
    var mesh = finalizeAcc(a, bk);
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    group.add(mesh); chunks.push({ li: a.li, ch: a.ch, cz: a.cz, mesh: mesh, outside: a.outside });
  }
  // dynamic: doors, chairs, boards, tvs
  var doors = buildDoors(M, bk, group);
  var chairs = buildChairs(M, bk, group);
  specials.boards.forEach(function (bd) { setProbeAt(bk, bd.mesh.material, bd.li, bd.x, bd.y, bd.z, 0, 0, 1); group.add(bd.mesh); });
  specials.tvs.forEach(function (t) { group.add(t.mesh); });
  specials.banners.forEach(function (bn) { setProbeAt(bk, bn.mesh.material, bn.li, bn.x, bn.y - 0.4, bn.z, 0, -1, 0); group.add(bn.mesh); });
  // sky & outside ground
  var sky = new THREE.Mesh(new THREE.SphereGeometry(160, 24, 12), new THREE.MeshBasicMaterial({ map: toTex(texNightSky(), { clamp: false }), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.material.map.wrapT = THREE.ClampToEdgeWrapping; sky.position.y = -20; sky.renderOrder = -10; group.add(sky);
  var gplane = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), bakeMat({ map: TEX.grass, color: 0x6a7a60 }, 'probe'));
  gplane.material.map = TEX.grass.clone(); gplane.material.map.needsUpdate = true; gplane.material.map.repeat.set(160, 160);
  setProbe(gplane.material, [0.12, 0.14, 0.16], [0.05, 0.065, 0.1]);
  gplane.rotation.x = -PI / 2; gplane.position.y = -0.4; group.add(gplane);
  // glass panes (one transparent merged mesh per level)
  var gl = [[], [], []];
  WORLD_GLASS.forEach(function (gp) { gl[gp.li].push(gp); });
  var glassMeshes = [];
  gl.forEach(function (list, li) {
    if (!list.length) return;
    var pos = [], idx = [], nrm = [];
    list.forEach(function (gp) {
      var c = Math.cos(gp.rot), s = Math.sin(gp.rot), hw = gp.w / 2, hh = gp.h / 2, b = pos.length / 3;
      [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].forEach(function (q) { pos.push(gp.x + c * q[0], gp.y + q[1], gp.z - s * q[0]); nrm.push(s, 0, c); });
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
    var m = new THREE.Mesh(g, MATS.glass); m.renderOrder = 5; MATS.glass.side = THREE.DoubleSide;
    m.userData.li = li; group.add(m); glassMeshes.push(m);
  });
  WORLD = { group: group, chunks: chunks, glass: glassMeshes, doors: doors, chairs: chairs, specials: specials, baker: bk, sky: sky, ground: gplane, posterMesh: posterMesh };
  return WORLD;
}

function finalizeAcc(a, bk) {
  var n = a.vc;
  var pos = new Float32Array(a.p), nor = new Float32Array(a.n), uv = new Float32Array(a.uv);
  var col = new Uint8Array(n * 3), bon = new Uint8Array(n * 4), boff = new Uint8Array(n * 4);
  var res = [0, 0, 0, 0], res2 = [0, 0, 0, 0];
  for (var i = 0; i < n; i++) {
    col[i * 3] = clamp(a.c[i * 3] * 255, 0, 255); col[i * 3 + 1] = clamp(a.c[i * 3 + 1] * 255, 0, 255); col[i * 3 + 2] = clamp(a.c[i * 3 + 2] * 255, 0, 255);
    var ov = a.ov[i];
    if (ov) {
      bon[i * 4] = clamp(ov.on[0] * 127.5, 0, 255); bon[i * 4 + 1] = clamp(ov.on[1] * 127.5, 0, 255); bon[i * 4 + 2] = clamp(ov.on[2] * 127.5, 0, 255); bon[i * 4 + 3] = clamp((ov.g || 0) / 7 * 255, 0, 255);
      boff[i * 4] = clamp(ov.off[0] * 127.5, 0, 255); boff[i * 4 + 1] = clamp(ov.off[1] * 127.5, 0, 255); boff[i * 4 + 2] = clamp(ov.off[2] * 127.5, 0, 255); boff[i * 4 + 3] = ov.em ? 255 : 0;
      continue;
    }
    bk.on(a.li, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2], res);
    bk.off(a.li, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2], res2);
    bon[i * 4] = clamp(res[0] * 127.5, 0, 255); bon[i * 4 + 1] = clamp(res[1] * 127.5, 0, 255); bon[i * 4 + 2] = clamp(res[2] * 127.5, 0, 255); bon[i * 4 + 3] = clamp(res[3] / 7 * 255, 0, 255);
    boff[i * 4] = clamp(res2[0] * 127.5, 0, 255); boff[i * 4 + 1] = clamp(res2[1] * 127.5, 0, 255); boff[i * 4 + 2] = clamp(res2[2] * 127.5, 0, 255); boff[i * 4 + 3] = clamp(res2[3] * 255, 0, 255);
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  g.setAttribute('bOn', new THREE.BufferAttribute(bon, 4, true));
  g.setAttribute('bOff', new THREE.BufferAttribute(boff, 4, true));
  g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(a.idx), 1) : new THREE.BufferAttribute(new Uint16Array(a.idx), 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  var mesh = new THREE.Mesh(g, a.mat);
  mesh.receiveShadow = true;
  return mesh;
}

// ---- light baking --------------------------------------------------------
function Baker(M) {
  this.M = M; this.bins = [{}, {}, {}]; this.dbins = [{}, {}, {}]; this.cache = new Map();
  var self = this;
  M.lights.forEach(function (l, i) { l.i = i; self.addBin(self.bins, l); });
  M.dlights.forEach(function (l, i) { l.i = 100000 + i; self.addBin(self.dbins, l); });
}
Baker.prototype.addBin = function (bins, l) {
  var r = Math.ceil(l.r / 4);
  var bx = Math.floor(l.x / 4), bz = Math.floor(l.z / 4);
  for (var i = -r; i <= r; i++) for (var j = -r; j <= r; j++) { var k = (bx + i) + ',' + (bz + j); (bins[l.li][k] || (bins[l.li][k] = [])).push(l); }
};
Baker.prototype.vis = function (l, li, x, z) {
  var cx = m2c(x), cz = m2r(z);
  var k2 = ((l.i * 3 + li) * NZ + cz) * NX + cx;
  var v = this.cache.get(k2);
  if (v === undefined) { v = losClearBake(li, l.x, l.z, x, z) ? 1 : 0; this.cache.set(k2, v); }
  return v;
};
function losClearBake(li, x0, z0, x1, z1) {
  var L = MAP.lv[li];
  var dx = x1 - x0, dz = z1 - z0, d = Math.sqrt(dx * dx + dz * dz);
  var steps = Math.ceil(d / (CELL * 0.4));
  var c0 = cidx(m2c(x0), m2r(z0));
  for (var s = 1; s < steps; s++) {
    var t = s / steps, cx = m2c(x0 + dx * t), cz = m2r(z0 + dz * t);
    if (!inGrid(cx, cz)) return false;
    var i = cidx(cx, cz);
    if (i === c0) continue;
    if (L.opaque[i] || L.blockTall[i] > 1 && L.type[i] === T_BLOCK) return false;
    if (L.type[i] === T_DOOR) { var dr = MAP.doors[L.door[i]]; if (dr.open < 0.5 && dr.kind !== 'glass') return false; }
  }
  return true;
}
Baker.prototype.on = function (li, px, py, pz, nx, ny, nz, out) {
  var sx = px + nx * 0.2, sy = py + ny * 0.2, sz = pz + nz * 0.2;
  var list = this.bins[li][Math.floor(sx / 4) + ',' + Math.floor(sz / 4)];
  var r = 0, g = 0, b = 0, best = 0, bg = 0;
  if (list) for (var k = 0; k < list.length; k++) {
    var l = list[k]; if (l.broken) continue;
    var dx = l.x - sx, dy = l.y - sy, dz = l.z - sz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > l.r) continue;
    if (!this.vis(l, li, sx, sz)) continue;
    var ix = dx / d, iy = dy / d, iz = dz / d;
    var ndl = nx * ix + ny * iy + nz * iz;
    var wrap = Math.max(0, (ndl + 0.3) / 1.3);
    var down = 0.45 + 0.55 * Math.max(0, iy); // fixtures face downward
    var q = 1 - (d / l.r) * (d / l.r);
    var att = q * q / (1 + d * d * 0.06) * l.int;
    var w = att * (wrap * down * 0.9 + 0.12);
    if (ny < -0.5) w = att * (0.42 + 0.3 * Math.max(0, ndl));
    r += l.col[0] * w; g += l.col[1] * w; b += l.col[2] * w;
    if (w > best) { best = w; bg = l.g; }
  }
  // indirect fill (only where some light reaches)
  var lum = (r + g + b) / 3;
  var amb = Math.min(0.12, lum * 0.25) + 0.012;
  out[0] = r * 0.95 + amb * 0.95; out[1] = g * 0.98 + amb; out[2] = b * 0.92 + amb * 0.9; out[3] = bg;
  if (li === 1) { var rm = roomAt(1, sx, sz); if (rm && rm.role === 'OUTSIDE') { out[0] += 0.05; out[1] += 0.065; out[2] += 0.1; } }
  return out;
};
Baker.prototype.off = function (li, px, py, pz, nx, ny, nz, out) {
  var sx = px + nx * 0.2, sy = py + ny * 0.2, sz = pz + nz * 0.2;
  var list = this.dbins[li][Math.floor(sx / 4) + ',' + Math.floor(sz / 4)];
  var r = 0, g = 0, b = 0, em = 0, tot = 0;
  if (list) for (var k = 0; k < list.length; k++) {
    var l = list[k];
    var dx = l.x - sx, dy = l.y - sy, dz = l.z - sz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > l.r) continue;
    if (!this.vis(l, li, sx, sz)) continue;
    var ix = dx / d, iy = dy / d, iz = dz / d;
    var ndl = nx * ix + ny * iy + nz * iz;
    var wrap = Math.max(0, (ndl + 0.25) / 1.25);
    var dirw = 1;
    if (l.nx || l.nz) { dirw = Math.max(0, -(ix * l.nx + iz * l.nz)); dirw = 0.08 + dirw * dirw * 1.3; if (iy > 0.2) dirw *= 0.9; }
    var q = 1 - (d / l.r) * (d / l.r);
    var att = q * q / (1 + d * d * 0.09) * l.int;
    var w = att * (wrap * 0.85 + 0.12) * dirw;
    r += l.col[0] * w; g += l.col[1] * w; b += l.col[2] * w; tot += w;
    if (l.kind === 'emerg') em += w;
  }
  var amb = [0.014, 0.017, 0.028];
  if (li === 1) { var rm = roomAt(1, sx, sz); if (rm && rm.role === 'OUTSIDE') { amb = [0.06, 0.075, 0.115]; } }
  if (li === 0) amb = [0.012, 0.01, 0.01];
  out[0] = r + amb[0]; out[1] = g + amb[1]; out[2] = b + amb[2]; out[3] = tot > 0 ? clamp(em / tot, 0, 1) : 0;
  return out;
};
Baker.prototype.probe = function (li, x, y, z) {
  var a = [0, 0, 0, 0], b = [0, 0, 0, 0], c = [0, 0, 0, 0], d = [0, 0, 0, 0];
  this.on(li, x, y, z, 0, 1, 0, a); this.on(li, x, y, z, 0, 0, 0, c);
  this.off(li, x, y, z, 0, 1, 0, b); this.off(li, x, y, z, 0, 0, 0, d);
  return { on: [(a[0] + c[0]) * 0.5, (a[1] + c[1]) * 0.5, (a[2] + c[2]) * 0.5], off: [(b[0] + d[0]) * 0.5, (b[1] + d[1]) * 0.5, (b[2] + d[2]) * 0.5] };
};
function setProbeAt(bk, mat, li, x, y, z, nx, ny, nz) {
  var a = [0, 0, 0, 0], b = [0, 0, 0, 0];
  bk.on(li, x, y, z, nx, ny, nz, a); bk.off(li, x, y, z, nx, ny, nz, b);
  setProbe(mat, a, b);
}

// ---- shell: floors, ceilings, walls, windows --------------------------------
function wallStyle(M, li, room, cx, cz) {
  var r = room >= 0 ? M.rooms[room] : null;
  var role = r ? r.role : 'CORRIDOR';
  var kind = ROLE_INFO[role] ? ROLE_INFO[role].kind : 'class';
  if (kind === 'corridor') return { low: li === 2 ? 'glazedU' : 'glazed', up: MATS.cmu, upCol: [0.86, 0.82, 0.7], lowH: 1.25 };
  if (kind === 'gym') return { low: null, up: MATS.brick, upCol: null, lowH: 0 };
  if (kind === 'lobby') return { low: null, up: MATS.brick, upCol: null, lowH: 0 };
  if (kind === 'restroom') return { low: null, up: MATS.tilewall, upCol: [0.86, 0.9, 0.86], lowH: 0 };
  if (kind === 'cafeteria') return { low: null, up: MATS.cmu, upCol: [0.92, 0.83, 0.55], lowH: 0 };
  if (kind === 'stairs') return { low: null, up: MATS.cmu, upCol: [0.7, 0.72, 0.72], lowH: 0 };
  if (kind === 'boiler' || kind === 'bstorage' || kind === 'bcorr') return { low: null, up: MATS.concreteWall, upCol: [0.75, 0.72, 0.66], lowH: 0 };
  if (kind === 'bus' || kind === 'outside') return { low: null, up: MATS.brick, upCol: null, lowH: 0 };
  var tints = [[0.74, 0.82, 0.72], [0.88, 0.84, 0.7], [0.72, 0.8, 0.88], [0.9, 0.78, 0.7]];
  return { low: null, up: MATS.cmu, upCol: tints[(r ? r.id : 0) % 4], lowH: 0 };
}
function buildShell(M, B) {
  if (!MATS.glazedU) { MATS.glazedU = bakeMat({ map: TEX.glazedG, vertexColors: true, shininess: 90, specular: new THREE.Color(0.4, 0.4, 0.4) }); }
  for (var li = 0; li < NL; li++) {
    var L = M.lv[li], Y = LV_Y[li], W = M.win[li];
    for (var cz = 0; cz < NZ; cz++) for (var cx = 0; cx < NX; cx++) {
      var i = cidx(cx, cz), t = L.type[i];
      var x0 = OX + cx * CELL, z0 = OZ + cz * CELL, x1 = x0 + CELL, z1 = z0 + CELL;
      var rid = L.room[i], room = rid >= 0 ? M.rooms[rid] : null;
      var isOut = room && room.role === 'OUTSIDE';
      if (t === T_FLOOR || t === T_DOOR || t === T_BLOCK) {
        // floor
        var fm = MATS.floor[L.mat[i]] || MATS.floor[M_LINO];
        var a = B.acc(li, fm, x0, z0); if (isOut) a.outside = true;
        var sc = (L.mat[i] === M_LINO || L.mat[i] === M_LINO2) ? 1.2 : (L.mat[i] === M_GYM ? 3.2 : (L.mat[i] === M_TILE ? 2 : 2.4));
        var v0 = a.vert(x0, Y, z0, 0, 1, 0, x0 / sc, -z0 / sc), v1 = a.vert(x0, Y, z1, 0, 1, 0, x0 / sc, -z1 / sc), v2 = a.vert(x1, Y, z1, 0, 1, 0, x1 / sc, -z1 / sc), v3 = a.vert(x1, Y, z0, 0, 1, 0, x1 / sc, -z0 / sc);
        a.quad(v0, v1, v2, v3);
        // ceiling
        var ch = t === T_DOOR ? 2.1 : L.ceil[i];
        if (!isOut && ch > 0 && !(room && room.role === 'BUS')) {
          var cm = (room && (room.role === 'GYM' || li === 0)) ? MATS.ceilingDark : ((room && (room.id * 7) % 5 === 0) ? MATS.ceiling2 : MATS.ceiling);
          var ac = B.acc(li, cm, x0, z0), yc = Y + ch;
          var c0 = ac.vert(x0, yc, z0, 0, -1, 0, x0 / 2.4, z0 / 2.4), c1 = ac.vert(x1, yc, z0, 0, -1, 0, x1 / 2.4, z0 / 2.4), c2 = ac.vert(x1, yc, z1, 0, -1, 0, x1 / 2.4, z1 / 2.4), c3 = ac.vert(x0, yc, z1, 0, -1, 0, x0 / 2.4, z1 / 2.4);
          ac.quad(c0, c1, c2, c3);
        }
        if (t === T_DOOR) buildDoorLintel(M, B, li, cx, cz);
      } else if (t === T_STAIR) {
        var s = M.stairs[L.stair[i]];
        if (li === s.hi) {
          var acs = B.acc(li, MATS.ceiling, x0, z0), yc2 = Y + 3.2;
          var d0 = acs.vert(x0, yc2, z0, 0, -1, 0, x0 / 1.2, z0 / 1.2), d1 = acs.vert(x1, yc2, z0, 0, -1, 0, x1 / 1.2, z0 / 1.2), d2 = acs.vert(x1, yc2, z1, 0, -1, 0, x1 / 1.2, z1 / 1.2), d3 = acs.vert(x0, yc2, z1, 0, -1, 0, x0 / 1.2, z1 / 1.2);
          acs.quad(d0, d1, d2, d3);
        }
      } else if (t === T_WALL) {
        buildWallCell(M, B, li, cx, cz, x0, z0, x1, z1);
      }
    }
  }
}
// returns [y0,y1] of the open neighbor for a wall face, or null
function faceSpan(M, li, ncx, ncz, fromCx, fromCz) {
  if (!inGrid(ncx, ncz)) return null;
  var L = M.lv[li], i = cidx(ncx, ncz), t = L.type[i], Y = LV_Y[li];
  if (t === T_FLOOR || t === T_BLOCK) {
    var r = L.room[i] >= 0 ? M.rooms[L.room[i]] : null;
    if (r && r.role === 'OUTSIDE') return 'out';
    if (r && r.role === 'BUS') return null;
    return [Y, Y + L.ceil[i]];
  }
  if (t === T_DOOR) return [Y, Y + 2.1];
  if (t === T_STAIR) { var s = M.stairs[L.stair[i]]; if (li === s.lo) return [Y, LV_Y[s.hi]]; return [Y, Y + 3.2]; }
  if (t === T_VOID && li === 2) { // exterior above ground-floor outside
    var g = M.lv[1], gi = cidx(ncx, ncz);
    if (g.type[gi] === T_FLOOR && g.room[gi] >= 0 && M.rooms[g.room[gi]].role === 'OUTSIDE') return 'out2';
  }
  return null;
}
function buildWallCell(M, B, li, cx, cz, x0, z0, x1, z1) {
  var L = M.lv[li], W = M.win[li];
  var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var isWin = W[cidx(cx, cz)];
  var wx = (x0 + x1) / 2;
  for (var k = 0; k < 4; k++) {
    var ncx = cx + nb[k][0], ncz = cz + nb[k][1];
    var sp = faceSpan(M, li, ncx, ncz, cx, cz);
    if (!sp) continue;
    var room = inGrid(ncx, ncz) ? L.room[cidx(ncx, ncz)] : -1;
    var st, y0, y1;
    if (sp === 'out' || sp === 'out2') {
      st = { up: MATS.brick, upCol: null, lowH: 0 };
      if (sp === 'out') { y0 = 0; y1 = 4.0; if (wx < 0) y1 = 4.8; if (wx > 60) y1 = 9.2; }
      else { y0 = 4.0; y1 = 8.4; }
      if (cx >= m2c(25) && cx <= m2c(36) && cz >= m2r(-12.5) && cz <= m2r(-9.5)) continue; // bus
    } else { st = wallStyle(M, li, room, ncx, ncz); y0 = sp[0]; y1 = sp[1]; }
    // face geometry: normal = neighbor direction
    var nx = nb[k][0], nz = nb[k][1];
    var fx0, fz0, fx1, fz1; // edge endpoints (counter-clockwise seen from neighbor)
    if (nx === 1) { fx0 = x1; fz0 = z1; fx1 = x1; fz1 = z0; }
    else if (nx === -1) { fx0 = x0; fz0 = z0; fx1 = x0; fz1 = z1; }
    else if (nz === 1) { fx0 = x0; fz0 = z1; fx1 = x1; fz1 = z1; }
    else { fx0 = x1; fz0 = z0; fx1 = x0; fz1 = z0; }
    var Y = LV_Y[li];
    var bands = [];
    var winBand = isWin && (sp !== 'out' || true);
    if (winBand && y1 - y0 > 2.6) {
      var wb = (sp === 'out2') ? 4 : Y;
      if (sp === 'out') wb = 0;
      bands.push([y0, wb + 0.9]); bands.push(['win', wb + 0.9, wb + 2.5]); bands.push([wb + 2.5, y1]);
    } else bands.push([y0, y1]);
    for (var bI = 0; bI < bands.length; bI++) {
      var bd = bands[bI];
      if (bd[0] === 'win') { buildWindow(M, B, li, fx0, fz0, fx1, fz1, nx, nz, bd[1], bd[2], sp); continue; }
      var ya = bd[0], yb = bd[1];
      // baseboard + wainscot split (interior only)
      var cuts = [ya];
      var fl = Y;
      if (st.lowH && ya < fl + st.lowH && yb > fl + st.lowH) cuts.push(fl + st.lowH);
      if (yb - ya > 1.6) { var mid = Math.max(cuts[cuts.length - 1], fl + 2.2); if (mid < yb - 0.3) cuts.push(mid); }
      cuts.push(yb);
      for (var ci = 0; ci < cuts.length - 1; ci++) {
        var ca = cuts[ci], cb = cuts[ci + 1];
        var useLow = st.lowH && cb <= fl + st.lowH + 1e-3;
        var mat = useLow ? MATS[st.low] : st.up;
        var col = useLow ? [1, 1, 1] : st.upCol;
        var sc = mat === MATS.brick ? 1.6 : (mat === MATS.cmu ? 1.6 : (useLow ? 1.2 : 2));
        var a = B.acc(li, mat, wx, (z0 + z1) / 2);
        var along0 = (nx !== 0) ? fz0 : fx0, along1 = (nx !== 0) ? fz1 : fx1;
        var p0 = a.vert(fx0, ca, fz0, nx, 0, nz, along0 / sc, ca / sc, col), p1 = a.vert(fx1, ca, fz1, nx, 0, nz, along1 / sc, ca / sc, col);
        var p2 = a.vert(fx1, cb, fz1, nx, 0, nz, along1 / sc, cb / sc, col), p3 = a.vert(fx0, cb, fz0, nx, 0, nz, along0 / sc, cb / sc, col);
        a.quad(p0, p1, p2, p3);
      }
      // baseboard strip (interior)
      if (sp !== 'out' && sp !== 'out2' && ya === Y && st.up !== MATS.brick) {
        var ab = B.acc(li, MATS.paint, wx, (z0 + z1) / 2);
        var off = 0.012;
        var q0 = ab.vert(fx0 + nx * off, Y, fz0 + nz * off, nx, 0, nz, 0, 0, COL.rubber), q1 = ab.vert(fx1 + nx * off, Y, fz1 + nz * off, nx, 0, nz, 1, 0, COL.rubber);
        var q2 = ab.vert(fx1 + nx * off, Y + 0.11, fz1 + nz * off, nx, 0, nz, 1, 1, COL.rubber), q3 = ab.vert(fx0 + nx * off, Y + 0.11, fz0 + nz * off, nx, 0, nz, 0, 1, COL.rubber);
        ab.quad(q0, q1, q2, q3);
      }
    }
  }
  if (isWin) buildJambs(M, B, li, cx, cz, x0, z0, x1, z1);
}
function buildJambs(M, B, li, cx, cz, x0, z0, x1, z1) {
  var L = M.lv[li], W = M.win[li], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var base = LV_Y[li];
  if (li === 1) { // check outside to know facade base
    var outs = false; for (var q = 0; q < 4; q++) { var s0 = faceSpan(M, li, cx + nb[q][0], cz + nb[q][1]); if (s0 && s0 !== 'out' && s0 !== 'out2') { base = s0[0]; outs = true; } }
  }
  for (var k = 0; k < 4; k++) {
    var ncx = cx + nb[k][0], ncz = cz + nb[k][1];
    if (!inGrid(ncx, ncz)) continue;
    var ni = cidx(ncx, ncz);
    if (L.type[ni] !== T_WALL || W[ni]) continue;
    var nx = -nb[k][0], nz = -nb[k][1]; // face points back into this (window) cell
    var fx0, fz0, fx1, fz1;
    if (nb[k][0] === 1) { fx0 = x1; fz0 = z0; fx1 = x1; fz1 = z1; } else if (nb[k][0] === -1) { fx0 = x0; fz0 = z1; fx1 = x0; fz1 = z0; } else if (nb[k][1] === 1) { fx0 = x1; fz0 = z1; fx1 = x0; fz1 = z1; } else { fx0 = x0; fz0 = z0; fx1 = x1; fz1 = z0; }
    var a = B.acc(li, MATS.cmu, x0, z0), ya = base + 0.9, yb = base + 2.5, col = [0.8, 0.78, 0.72];
    var p0 = a.vert(fx0, ya, fz0, nx, 0, nz, 0, 0, col), p1 = a.vert(fx1, ya, fz1, nx, 0, nz, 0.3, 0, col), p2 = a.vert(fx1, yb, fz1, nx, 0, nz, 0.3, 1, col), p3 = a.vert(fx0, yb, fz0, nx, 0, nz, 0, 1, col);
    a.quad(p0, p1, p2, p3);
  }
}
function buildWindow(M, B, li, fx0, fz0, fx1, fz1, nx, nz, ya, yb, sp) {
  // recessed opening: glass at wall center, frame + sill
  var cxm = (fx0 + fx1) / 2, czm = (fz0 + fz1) / 2;
  var depth = CELL / 2;
  var gx = cxm - nx * depth, gz = czm - nz * depth;
  var rot = Math.atan2(nx, nz);
  var pf = new PF(B, li, gx, 0, gz, rot);
  var wl = Math.abs(fx1 - fx0) + Math.abs(fz1 - fz0);
  // glass (separate transparent mesh list)
  var gk = li + ':' + Math.round(gx * 4) + ':' + Math.round(gz * 4);
  if (!WORLD_GLASS_KEYS[gk]) { WORLD_GLASS_KEYS[gk] = 1; WORLD_GLASS.push({ li: li, x: gx, y: (ya + yb) / 2, z: gz, rot: rot, w: wl, h: yb - ya }); }
  // sill & frame (aluminium)
  pf.box(MATS.metalP, 0, ya - 0.04, depth * 0.5, wl, 0.05, depth, [0.75, 0.75, 0.72]);
  pf.box(MATS.metalP, 0, yb - 0.02, depth * 0.5, wl, 0.04, depth, [0.6, 0.6, 0.6]);
  pf.box(MATS.metalP, 0, ya, 0.02, 0.05, yb - ya, 0.06, [0.55, 0.56, 0.55]);
  pf.box(MATS.metalP, 0, ya + (yb - ya) * 0.62, 0.02, wl, 0.04, 0.06, [0.55, 0.56, 0.55]);
  // reveal sides (jamb faces) are covered by neighbor wall cells
  // sill inside face & reveal top
  var st = sp === 'out' || sp === 'out2' ? MATS.brick : MATS.cmu;
  pf.box(st, 0, ya - 0.9 + 0.86, depth * 0.5, wl, 0.02, depth * 0.98, [0.8, 0.78, 0.7]);
}
var WORLD_GLASS = [], WORLD_GLASS_KEYS = {};
function buildDoorLintel(M, B, li, cx, cz) {
  var L = M.lv[li], d = M.doors[L.door[cidx(cx, cz)]];
  var x0 = OX + cx * CELL, z0 = OZ + cz * CELL, x1 = x0 + CELL, z1 = z0 + CELL, Y = LV_Y[li];
  var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (var k = 0; k < 4; k++) {
    var ncx = cx + nb[k][0], ncz = cz + nb[k][1];
    if (!inGrid(ncx, ncz)) continue;
    var t = L.type[cidx(ncx, ncz)];
    if (t === T_WALL || t === T_DOOR || t === T_VOID) continue;
    var sp = faceSpan(M, li, ncx, ncz, cx, cz);
    var y1 = (sp && sp !== 'out' && sp !== 'out2') ? sp[1] : Y + 3.2;
    if (sp === 'out') y1 = 4.0;
    if (y1 <= Y + 2.1) continue;
    var nx = nb[k][0], nz = nb[k][1], fx0, fz0, fx1, fz1;
    if (nx === 1) { fx0 = x1; fz0 = z1; fx1 = x1; fz1 = z0; } else if (nx === -1) { fx0 = x0; fz0 = z0; fx1 = x0; fz1 = z1; } else if (nz === 1) { fx0 = x0; fz0 = z1; fx1 = x1; fz1 = z1; } else { fx0 = x1; fz0 = z0; fx1 = x0; fz1 = z0; }
    var room = L.room[cidx(ncx, ncz)];
    var st = (sp === 'out' || sp === 'out2') ? { up: MATS.brick, upCol: null } : wallStyle(M, li, room, ncx, ncz);
    var a = B.acc(li, st.up, x0, z0);
    var al0 = nx !== 0 ? fz0 : fx0, al1 = nx !== 0 ? fz1 : fx1, ya = Y + 2.1;
    var p0 = a.vert(fx0, ya, fz0, nx, 0, nz, al0 / 1.6, ya / 1.6, st.upCol), p1 = a.vert(fx1, ya, fz1, nx, 0, nz, al1 / 1.6, ya / 1.6, st.upCol);
    var p2 = a.vert(fx1, y1, fz1, nx, 0, nz, al1 / 1.6, y1 / 1.6, st.upCol), p3 = a.vert(fx0, y1, fz0, nx, 0, nz, al0 / 1.6, y1 / 1.6, st.upCol);
    a.quad(p0, p1, p2, p3);
  }
}

function buildStairs(M, B) {
  M.stairs.forEach(function (s) {
    var li = s.lo;
    var n = 20, run = (s.z1 - s.z0) / n, rise = (s.yB - s.yA) / n;
    var w = s.x1 - s.x0, cx = (s.x0 + s.x1) / 2;
    var pf = new PF(B, li, cx, 0, 0, 0);
    for (var k = 0; k < n; k++) {
      var zA = s.z0 + k * run;
      var yTop = Math.max(s.yA + rise * k, s.yA + rise * (k + 1));
      var yBot = Math.min(s.yA, s.yB) - 0.02;
      pf.box(MATS.floor[M_CONCRETE], 0, yBot, zA + run / 2, w, yTop - yBot, run, [0.72, 0.7, 0.66]);
      pf.box(MATS.paint, 0, yTop - 0.005, zA + (rise > 0 ? run - 0.04 : 0.04), w, 0.012, 0.06, [0.85, 0.7, 0.15]); // nosing
    }
    // handrail
    var dz = s.z1 - s.z0, dy = s.yB - s.yA, len = Math.sqrt(dz * dz + dy * dy), ang = Math.atan2(dy, dz);
    var hr = new PF(B, li, s.x1 - 0.06, 0, (s.z0 + s.z1) / 2, 0);
    hr.part(GEO.box, MATS.metalP, 0, (s.yA + s.yB) / 2 + 0.95, 0, 0.05, 0.05, len, [0.5, 0.52, 0.55], { rx: -ang });
    for (var p = 0; p <= 4; p++) { var zz = s.z0 + dz * p / 4, yy = s.yA + dy * p / 4; hr.box(MATS.metalP, 0, yy, zz - (s.z0 + s.z1) / 2, 0.03, 0.95, 0.03, [0.5, 0.52, 0.55]); }
  });
}

// ---- light fixtures ---------------------------------------------------------
function buildFixtures(M, B) {
  M.lights.forEach(function (l) {
    if (l.kind === 'none') return;
    var pf = new PF(B, l.li, l.x, l.y, l.z, l.rot || 0);
    var lens = { on: [l.col[0] * 1.9, l.col[1] * 1.9, l.col[2] * 1.85], off: [0.05, 0.055, 0.06], g: l.g };
    if (l.broken) lens.on = [0.08, 0.08, 0.08];
    if (l.kind === 'tube') {
      pf.box(MATS.metalP, 0, -0.06, 0, 0.62, 0.06, 1.22, [0.85, 0.85, 0.82]);
      pf.box(MATS.emit, 0, -0.075, 0, 0.54, 0.02, 1.14, [1, 1, 1], { ov: lens });
    } else if (l.kind === 'highbay') {
      pf.cyl(MATS.metalP, 0, -0.5, 0, 0.35, 0.3, [0.4, 0.42, 0.44]);
      pf.cyl(MATS.emit, 0, -0.52, 0, 0.3, 0.03, [1, 1, 1], { ov: lens });
      pf.box(MATS.metalP, 0, -0.2, 0, 0.02, 0.3, 0.02, COL.dark);
    } else if (l.kind === 'bulb') {
      pf.sph(MATS.emit, 0, -0.18, 0, 0.06, [1, 1, 1], { ov: { on: [2, 1.6, 1.1], off: [0.03, 0.03, 0.03], g: l.g } });
      pf.box(MATS.paint, 0, -0.12, 0, 0.01, 0.12, 0.01, COL.black);
    }
  });
}

// ---- barricades -------------------------------------------------------------
function buildBarricades(M, B) {
  var rnd = makeRNG(M.seed ^ 0xbeef);
  M.blockers.forEach(function (b) {
    var li = b.li, Y = LV_Y[li];
    var w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    var n = Math.round(w * d * 3) + 3;
    for (var k = 0; k < n; k++) {
      var px = cx + rnd.range(-w / 2, w / 2) * 0.8, pz = cz + rnd.range(-d / 2, d / 2) * 0.85;
      var pf = new PF(B, li, px, Y, pz, rnd() * TAU);
      var t = rnd();
      if (t < 0.35) { pf.part(GEO.box, MATS.lockers, 0, 0.3 + rnd() * 0.6, 0, 0.48, 1.8, 0.45, [0.3, 0.38, 0.55], { rx: PI / 2 * (0.6 + rnd() * 0.4), rz: rnd() * 0.6, uv: [0.25, 0, 0.25, 1] }); }
      else if (t < 0.7) { pf.part(GEO.box, MATS.wood, 0, 0.5 + rnd() * 1.0, 0, 0.6, 0.04, 0.45, COL.wood, { rx: rnd() * 2, rz: rnd() * 2 }); pf.part(GEO.box, MATS.metalP, 0.2, 0.4 + rnd(), 0, 0.03, 0.7, 0.03, COL.metal, { rz: rnd() * 3 }); }
      else { pf.part(GEO.box, MATS.paint, 0, 0.3 + rnd() * 1.2, 0, 0.42, 0.04, 0.42, rnd() < 0.5 ? COL.chairBlue : COL.chairOr, { rx: rnd() * 3, rz: rnd() * 3 }); }
    }
    // caution tape
    var tp = new PF(B, li, cx, Y, cz, 0);
    if (b.full) {
      tp.box(MATS.emit, -w / 2 - 0.08, 1.05, 0, 0.01, 0.05, d, [1, 1, 1], { ov: { on: [1.1, 0.9, 0.1], off: [0.05, 0.045, 0.005] } });
      tp.box(MATS.emit, w / 2 + 0.08, 1.05, 0, 0.01, 0.05, d, [1, 1, 1], { ov: { on: [1.1, 0.9, 0.1], off: [0.05, 0.045, 0.005] } });
    }
  });
}


// ===== 08_props.js =====
// ---- prop models (merged into baked chunks) ------------------------------
var LOCKER_TINT = [[0.32, 0.42, 0.62], [0.7, 0.55, 0.22]];
function buildProp(M, B, p, SP) {
  var li = p.li, Y = LV_Y[li], y = p.y != null ? p.y : Y;
  var f = new PF(B, li, p.x, y, p.z, p.rot);
  var P = MATS.paint, MT = MATS.metalP, WD = MATS.wood, E = MATS.emit;
  switch (p.kind) {
    case 'locker': {
      var tint = LOCKER_TINT[li === 2 ? 1 : 0];
      if ((p.x * 7 | 0) % 11 === 0) tint = [0.55, 0.2, 0.18];
      var v = p.v || 0;
      f.box(MT, 0, 0, -0.02, 0.47, 1.85, 0.43, tint);
      f.part(GEO.plane, MATS.lockers, 0, 0.98, 0.195, 0.46, 1.72, 1, tint, { uv: [v * 0.25, 0, 0.25, 1] });
      f.box(P, 0, 0, 0.17, 0.48, 0.09, 0.03, COL.black);
      if (p.hide) f.box(E, 0.17, 1.62, 0.2, 0.02, 0.02, 0.005, [1, 1, 1], { ov: { on: [0.4, 0.4, 0.38], off: [0.05, 0.05, 0.05] } });
      break;
    }
    case 'desk':
      f.box(WD, 0, 0.7, 0, 0.62, 0.035, 0.47, COL.wood);
      f.box(MT, 0, 0.5, 0.05, 0.56, 0.16, 0.36, [0.35, 0.38, 0.4]);
      [[-0.27, -0.2], [0.27, -0.2], [-0.27, 0.2], [0.27, 0.2]].forEach(function (q) { f.cyl(MT, q[0], 0, q[1], 0.012, 0.7, COL.metal, { six: 1 }); });
      break;
    case 'tdesk':
      f.box(WD, 0, 0.73, 0, 1.55, 0.04, 0.78, COL.woodD);
      f.box(WD, -0.55, 0, 0, 0.42, 0.73, 0.74, [0.55, 0.38, 0.24]); f.box(WD, 0.55, 0, 0, 0.42, 0.73, 0.74, [0.55, 0.38, 0.24]);
      f.box(WD, 0, 0.2, -0.33, 0.7, 0.5, 0.03, [0.5, 0.34, 0.22]);
      f.box(P, 0.35, 0.77, 0.1, 0.25, 0.04, 0.32, [0.8, 0.75, 0.6]); f.cyl(P, -0.4, 0.77, 0.12, 0.05, 0.12, [0.6, 0.15, 0.12]);
      f.sph(P, -0.1, 0.81, 0.15, 0.045, [0.75, 0.12, 0.1]); // apple
      break;
    case 'board': {
      var bt = toTex(mkCanvas(4, 4));
      var bm = bakeMat({ map: bt, shininess: 6, specular: new THREE.Color(0.05, 0.05, 0.05) }, 'probe');
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, 1.6), bm);
      mesh.position.set(p.x + Math.sin(p.rot) * 0.03, y, p.z + Math.cos(p.rot) * 0.03); mesh.rotation.y = p.rot; mesh.updateMatrix(); mesh.matrixAutoUpdate = false;
      SP.boards.push({ li: li, x: p.x, y: y, z: p.z, mesh: mesh, room: p.room, rot: p.rot, w: p.w, lines: p.lines });
      f.box(WD, 0, -0.85, 0.02, p.w + 0.1, 0.06, 0.04, COL.woodD); f.box(WD, 0, 0.8, 0.02, p.w + 0.1, 0.06, 0.04, COL.woodD);
      f.box(WD, 0, -0.86, 0.07, p.w, 0.03, 0.12, COL.woodD); // tray
      f.box(P, -0.8, -0.82, 0.09, 0.14, 0.04, 0.05, [0.9, 0.9, 0.88]); f.box(P, 1.1, -0.83, 0.08, 0.08, 0.015, 0.015, [0.95, 0.95, 0.95]);
      f.box(E, 0, 0.92, 0.12, p.w, 0.05, 0.08, [1, 1, 1], { ov: { on: [1.6, 1.6, 1.5], off: [0.03, 0.03, 0.03] } }); // board light
      break;
    }
    case 'bboard':
      f.box(WD, 0, -0.6, 0, 1.9, 1.25, 0.03, [0.62, 0.45, 0.28]);
      for (var k = 0; k < 7; k++) { var hx = -0.75 + (k % 4) * 0.48 + (k * 0.13 % 0.1), hy = -0.45 + Math.floor(k / 4) * 0.55; f.box(P, hx, hy, 0.02, 0.32, 0.4, 0.005, [[0.95, 0.95, 0.9], [0.95, 0.85, 0.4], [0.6, 0.8, 0.95], [0.95, 0.6, 0.6]][k % 4], { rz: (k % 3 - 1) * 0.08 }); }
      break;
    case 'clock':
      f.part(GEO.cyl, P, 0, 0, 0.02, 0.17, 0.04, 0.17, [0.15, 0.15, 0.15], { rx: PI / 2 });
      f.part(GEO.cyl, E, 0, 0, 0.042, 0.15, 0.005, 0.15, [1, 1, 1], { rx: PI / 2, ov: { on: [1.3, 1.3, 1.25], off: [0.05, 0.05, 0.06] } });
      f.box(P, 0, 0, 0.05, 0.012, 0.1, 0.004, COL.black, { rz: -0.4 }); f.box(P, 0.03, -0.02, 0.05, 0.012, 0.07, 0.004, COL.black, { rz: 1.9 });
      break;
    case 'speaker':
      f.box(P, 0, -0.15, 0.03, 0.32, 0.3, 0.06, [0.78, 0.75, 0.68]);
      for (var s = 0; s < 5; s++) f.box(P, 0, -0.1 + s * 0.045 - 0.04, 0.061, 0.24, 0.012, 0.004, COL.dark);
      break;
    case 'extinguisher':
      f.cyl(P, 0, -0.35, 0.1, 0.07, 0.5, COL.red); f.box(P, 0, 0.15, 0.1, 0.04, 0.06, 0.04, COL.black);
      f.box(E, 0, 0.45, 0.01, 0.25, 0.25, 0.01, [1, 1, 1], { ov: { on: [1.4, 0.2, 0.15], off: [0.05, 0.01, 0.01] } });
      break;
    case 'flag': {
      f.cyl(MT, 0, 0, 0, 0.02, 2.4, [0.8, 0.7, 0.3]); f.sph(MT, 0, 2.42, 0, 0.04, [0.9, 0.8, 0.3]);
      f.box(P, 0, 1.6, 0.4, 0.01, 0.6, 0.8, [0.18, 0.2, 0.42]); f.box(P, 0.006, 1.6, 0.4, 0.01, 0.1, 0.8, [0.85, 0.85, 0.82]);
      f.box(E, 0.008, 1.8, 0.25, 0.01, 0.12, 0.12, [1, 1, 1], { ov: { on: [1.6, 1.4, 0.4], off: [0.06, 0.05, 0.02] } });
      break;
    }
    case 'trophy':
      f.box(WD, 0, 0, 0, 2.0, 0.8, 0.45, COL.woodD); f.box(WD, 0, 2.1, 0, 2.0, 0.12, 0.45, COL.woodD);
      f.box(P, 0, 0.8, -0.2, 2.0, 1.3, 0.03, [0.15, 0.1, 0.08]);
      [1.0, 1.45].forEach(function (sh) { f.box(MT, 0, 0.8 + sh - 0.75, 0, 1.95, 0.02, 0.4, [0.7, 0.72, 0.72]); });
      for (var t = 0; t < 9; t++) { var tx = -0.8 + t * 0.2, ty = t < 5 ? 0.82 : 1.27; f.cyl(MT, tx, ty, 0, 0.035, 0.12 + (t % 3) * 0.08, [0.85, 0.65, 0.2]); f.sph(MT, tx, ty + 0.2 + (t % 3) * 0.08, 0, 0.05, [0.9, 0.7, 0.25]); }
      f.box(E, 0.6, 1.72, -0.15, 0.4, 0.3, 0.01, [1, 1, 1], { ov: { on: [0.9, 0.8, 0.6], off: [0.04, 0.04, 0.04] } }); // team photo
      WORLD_GLASS.push({ li: li, x: p.x + Math.sin(p.rot) * 0.23, y: y + 1.45, z: p.z + Math.cos(p.rot) * 0.23, rot: p.rot, w: 2.0, h: 1.3 });
      break;
    case 'fountain':
      f.box(MT, 0, 0.6, 0, 0.5, 0.35, 0.4, COL.steel); f.box(MT, 0, 0.94, 0.02, 0.4, 0.02, 0.3, [0.6, 0.62, 0.65]);
      f.box(MT, 0, 0.0, -0.1, 0.12, 0.6, 0.12, COL.steel);
      break;
    case 'cctv':
      f.box(P, 0, -0.08, 0.1, 0.12, 0.1, 0.25, [0.85, 0.85, 0.82], { rx: 0.4 }); f.box(P, 0, 0, 0, 0.05, 0.05, 0.12, COL.dark);
      f.sph(E, 0.04, -0.05, 0.24, 0.012, [1, 1, 1], { ov: { on: [2, 0.1, 0.1], off: [2, 0.1, 0.1] } });
      break;
    case 'paper':
      f.part(GEO.plane, P, 0, 0.006, 0, 0.22, 0.28, 1, [0.82, 0.8, 0.74], { rx: -PI / 2 });
      break;
    case 'emerg':
      f.box(P, 0, -0.12, 0.05, 0.36, 0.14, 0.1, [0.85, 0.84, 0.8]);
      [-0.12, 0.12].forEach(function (ex) { f.sph(E, ex, -0.15, 0.14, 0.05, [1, 1, 1], { ov: { on: [0.3, 0.3, 0.3], off: [2, 2, 2], em: 1 } }); });
      break;
    case 'tree': {
      var sc = p.s || 1;
      f.cyl(P, 0, 0, 0, 0.18 * sc, 2.2 * sc, [0.2, 0.14, 0.1]);
      for (var tl = 0; tl < 5; tl++) f.part(GEO.cone, P, 0, (1.8 + tl * 1.4) * sc, 0, (2.3 - tl * 0.4) * sc, 2.4 * sc, (2.3 - tl * 0.4) * sc, [0.06, 0.11, 0.08]);
      break;
    }
    case 'flagpole':
      f.cyl(MT, 0, 0, 0, 0.06, 9, [0.7, 0.72, 0.74]); f.sph(MT, 0, 9.05, 0, 0.12, [0.8, 0.7, 0.3]);
      f.box(P, 0.75, 7.6, 0, 1.4, 0.9, 0.02, [0.18, 0.2, 0.42], { rz: 0.04 });
      f.box(E, 0.5, 7.75, 0.012, 0.45, 0.45, 0.004, [1, 1, 1], { ov: { on: [0.6, 0.55, 0.2], off: [0.25, 0.22, 0.1] } });
      break;
    case 'schoolsign':
      f.box(MATS.brick, 0, 0, 0, 3.2, 0.8, 0.5, null);
      f.box(E, 0, 0.8, 0, 3.0, 1.1, 0.12, [1, 1, 1], { ov: { on: [0.9, 0.85, 0.7], off: [0.7, 0.66, 0.55] } });
      SP.plates.push({ kind: 'marquee', li: 1, x: p.x, y: 1.35, z: p.z + 0.07, rot: 0 });
      SP.plates.push({ kind: 'marquee', li: 1, x: p.x, y: 1.35, z: p.z - 0.07, rot: PI });
      break;
    case 'lamppost':
      f.cyl(MT, 0, 0, 0, 0.08, 5.6, [0.35, 0.36, 0.38]); f.box(MT, 0.4, 5.6, 0, 0.9, 0.08, 0.1, [0.35, 0.36, 0.38]);
      f.box(E, 0.8, 5.45, 0, 0.45, 0.14, 0.3, [1, 1, 1], { ov: { on: [2, 1.2, 0.5], off: [2, 1.2, 0.5] } });
      break;
    case 'fence':
      for (var fx = -19; fx <= 83; fx += 3) { var fp = new PF(B, 1, fx, 0, -16.6, 0); fp.cyl(MT, 0, 0, 0, 0.04, 1.9, [0.45, 0.46, 0.47]); fp.box(MT, 1.5, 1.85, 0, 3, 0.04, 0.04, [0.45, 0.46, 0.47]); fp.box(MATS.paint, 1.5, 0, 0, 3, 1.85, 0.01, [0.22, 0.24, 0.25]); }
      break;
    case 'busbody': buildBus(B, p); break;
    case 'counter':
      f.box(WD, 0, 0, 0, p.len, 1.05, 0.6, [0.6, 0.45, 0.3]); f.box(P, 0, 1.05, 0, p.len + 0.05, 0.04, 0.66, [0.75, 0.72, 0.65]);
      f.box(P, 0.6, 1.09, 0.1, 0.4, 0.3, 0.35, [0.82, 0.8, 0.72]); f.box(E, 0.6, 1.17, 0.28, 0.3, 0.2, 0.005, [1, 1, 1], { ov: { on: [0.15, 0.35, 0.2], off: [0.02, 0.06, 0.03] } }); // old computer
      f.box(P, -1.4, 1.09, 0, 0.25, 0.08, 0.2, [0.25, 0.25, 0.25]); // bell
      break;
    case 'bench':
      f.box(WD, 0, 0.42, 0, 2.0, 0.05, 0.4, COL.wood); [-0.85, 0.85].forEach(function (bx) { f.box(MT, bx, 0, 0, 0.05, 0.42, 0.35, COL.dark); });
      break;
    case 'standee':
      SP.plates.push({ kind: 'standee', li: li, x: p.x, y: 0, z: p.z, rot: p.rot });
      break;
    case 'ctable':
      f.box(P, 0, 0.72, 0, 0.9, 0.04, p.len, [0.72, 0.7, 0.62]); f.box(MT, 0, 0.0, 0, 0.06, 0.72, p.len * 0.8, COL.dark);
      f.box(MT, 0, 0, 0, 0.8, 0.04, 0.06, COL.dark); f.box(MT, 0, 0, p.len * 0.4, 0.8, 0.04, 0.06, COL.dark); f.box(MT, 0, 0, -p.len * 0.4, 0.8, 0.04, 0.06, COL.dark);
      f.box(P, 0.1, 0.76, 0.6, 0.35, 0.02, 0.25, [0.85, 0.7, 0.3]); f.box(P, -0.15, 0.76, -1.1, 0.3, 0.02, 0.22, [0.6, 0.75, 0.85]); // trays
      break;
    case 'servecounter':
      f.box(MT, 0, 0, 0, p.len, 0.9, 0.7, COL.steel); f.box(MT, 0, 0.9, 0, p.len, 0.03, 0.75, [0.8, 0.82, 0.84]);
      for (var sp = 0; sp < 6; sp++) f.box(MT, -p.len / 2 + 1.2 + sp * 2.2, 0.86, 0, 0.8, 0.06, 0.5, [0.5, 0.52, 0.55]);
      f.box(MT, 0, 1.32, 0.15, p.len, 0.02, 0.4, [0.75, 0.78, 0.8]);
      break;
    case 'stove':
      f.box(MT, 0, 0, 0, 1.1, 0.9, 0.8, [0.7, 0.72, 0.74]); f.box(P, 0, 0.9, 0, 1.0, 0.04, 0.7, COL.dark);
      for (var bn = 0; bn < 4; bn++) f.cyl(P, -0.25 + (bn % 2) * 0.5, 0.94, -0.15 + Math.floor(bn / 2) * 0.3, 0.1, 0.01, COL.black);
      f.box(P, 0, 0.3, 0.41, 0.8, 0.4, 0.01, [0.2, 0.2, 0.2]);
      break;
    case 'vending':
      f.box(P, 0, 0, 0, 0.95, 1.85, 0.8, [0.6, 0.1, 0.1]);
      f.box(E, -0.12, 0.6, 0.405, 0.6, 1.1, 0.01, [1, 1, 1], { ov: { on: [1.2, 1.5, 1.6], off: [0.7, 1.0, 1.2] } });
      f.box(E, 0.34, 1.0, 0.405, 0.14, 0.3, 0.01, [1, 1, 1], { ov: { on: [0.3, 1.2, 0.4], off: [0.2, 0.9, 0.3] } });
      f.box(P, 0, 0.12, 0.41, 0.7, 0.18, 0.02, COL.black);
      break;
    case 'trash':
      f.cyl(P, 0, 0, 0, 0.28, 0.85, [0.35, 0.4, 0.5]); f.cyl(P, 0, 0.85, 0, 0.3, 0.05, [0.25, 0.3, 0.38]);
      break;
    case 'bleachers':
      for (var row = 0; row < 7; row++) {
        var by = 0.3 + row * 0.42, bz = -2.1 + row * 0.62;
        f.box(WD, 0, by, bz, p.len, 0.05, 0.3, [0.75, 0.55, 0.32]);
        f.box(WD, 0, by - 0.42, bz + 0.2, p.len, 0.04, 0.3, [0.6, 0.44, 0.26]);
        for (var bs = -p.len / 2; bs <= p.len / 2; bs += 2) f.box(MT, bs, 0, bz, 0.05, by, 0.05, COL.dark);
      }
      f.box(MT, 0, 0, 2.3, p.len, 3.2, 0.05, [0.35, 0.35, 0.37]);
      f.box(MT, -p.len / 2, 0, 0, 0.05, 3.2, 4.4, [0.35, 0.35, 0.37]); f.box(MT, p.len / 2, 0, 0, 0.05, 3.2, 4.4, [0.35, 0.35, 0.37]);
      break;
    case 'hoop':
      f.box(MT, 0, 3.4, -0.3, 0.12, 0.12, 0.7, COL.dark);
      f.box(P, 0, 2.95, 0.05, 1.8, 1.05, 0.04, [0.9, 0.9, 0.9]); f.box(P, 0, 3.05, 0.075, 0.6, 0.45, 0.01, [0.75, 0.2, 0.15]);
      f.part(GEO.cyl, MT, 0, 3.05, 0.3, 0.23, 0.02, 0.23, [0.9, 0.35, 0.1]);
      for (var ng = 0; ng < 8; ng++) { var a = ng / 8 * TAU; f.box(P, Math.cos(a) * 0.2, 2.75, 0.3 + Math.sin(a) * 0.2, 0.01, 0.3, 0.01, [0.9, 0.9, 0.9]); }
      break;
    case 'scoreboard':
      f.box(P, 0, -0.9, 0.05, 4, 1.8, 0.15, COL.black);
      SP.plates.push({ kind: 'score', li: 1, x: p.x, y: y, z: p.z + 0.14, rot: p.rot });
      break;
    case 'mats': for (var mt = 0; mt < 5; mt++) f.box(P, 0, mt * 0.12, 0, 1.9, 0.11, 1.9, mt % 2 ? [0.2, 0.3, 0.6] : [0.7, 0.2, 0.2]); break;
    case 'ballcart':
      f.box(MT, 0, 0.1, 0, 0.8, 0.5, 0.5, COL.dark);
      for (var bb = 0; bb < 6; bb++) f.sph(P, -0.25 + (bb % 3) * 0.25, 0.7 + Math.floor(bb / 3) * 0.2, -0.1 + Math.floor(bb / 3) * 0.2, 0.12, [0.8, 0.4, 0.15]);
      break;
    case 'labbench':
      f.box(WD, 0, 0, 0, 0.75, 0.88, p.len, [0.45, 0.32, 0.2]); f.box(P, 0, 0.88, 0, 0.8, 0.05, p.len + 0.05, [0.08, 0.08, 0.09]);
      f.box(MT, 0, 0.93, -p.len * 0.3, 0.3, 0.02, 0.4, [0.4, 0.42, 0.44]); f.cyl(MT, -0.25, 0.93, -p.len * 0.3, 0.015, 0.35, COL.steel);
      for (var gz = -1; gz <= 1; gz++) { f.cyl(MT, -0.3, 0.93, gz * 1.2, 0.012, 0.1, [0.7, 0.6, 0.2]); f.cyl(P, 0.1, 0.93, gz * 1.3 + 0.3, 0.04, 0.16, [0.6, 0.9, 0.8]); }
      break;
    case 'skeleton':
      f.cyl(MT, 0, 0, 0, 0.15, 0.03, COL.dark); f.cyl(MT, 0, 0, 0, 0.015, 1.1, COL.dark);
      f.sph(P, 0, 1.62, 0, 0.11, [0.92, 0.9, 0.82], { sy: 0.13 }); f.box(P, 0, 1.12, 0, 0.3, 0.38, 0.16, [0.88, 0.86, 0.78]);
      f.box(P, 0, 0.72, 0, 0.04, 0.4, 0.04, [0.88, 0.86, 0.78]); f.box(P, 0, 0.88, 0, 0.28, 0.1, 0.12, [0.88, 0.86, 0.78]);
      [-0.1, 0.1].forEach(function (lx) { f.box(P, lx, 0.05, 0, 0.04, 0.8, 0.04, [0.88, 0.86, 0.78]); f.box(P, lx * 2.1, 0.75, 0, 0.035, 0.6, 0.035, [0.88, 0.86, 0.78], { rz: lx * 0.6 }); });
      f.box(P, -0.04, 1.6, 0.1, 0.03, 0.03, 0.01, COL.black); f.box(P, 0.04, 1.6, 0.1, 0.03, 0.03, 0.01, COL.black);
      break;
    case 'cabinet': f.box(MT, 0, 0, 0, 0.9, 1.9, 0.5, [0.7, 0.72, 0.7]); f.box(P, 0, 0.0, 0.251, 0.01, 1.85, 0.005, COL.dark); f.box(MT, 0.08, 1.0, 0.26, 0.03, 0.15, 0.02, COL.dark); break;
    case 'piano':
      f.box(WD, 0, 0, 0, 1.5, 1.25, 0.6, [0.22, 0.12, 0.08]); f.box(P, 0, 0.72, 0.38, 1.4, 0.04, 0.2, [0.95, 0.94, 0.9]);
      for (var key = 0; key < 20; key++) if (key % 7 !== 2 && key % 7 !== 6) f.box(P, -0.66 + key * 0.07, 0.75, 0.33, 0.035, 0.03, 0.1, COL.black);
      f.box(WD, 0, 0.6, 0.35, 1.5, 0.12, 0.25, [0.22, 0.12, 0.08]);
      break;
    case 'stand': f.cyl(MT, 0, 0, 0, 0.012, 1.0, COL.dark); f.box(MT, 0, 1.0, 0, 0.45, 0.32, 0.01, COL.dark, { rx: -0.35 }); break;
    case 'drums':
      f.cyl(P, 0, 0, 0, 0.3, 0.45, [0.7, 0.12, 0.12]); f.cyl(P, 0.5, 0.5, 0.2, 0.18, 0.18, [0.9, 0.9, 0.88]); f.cyl(MT, -0.5, 0.95, 0.2, 0.22, 0.01, [0.8, 0.65, 0.2]); f.cyl(MT, -0.5, 0, 0.2, 0.01, 0.95, COL.dark);
      break;
    case 'arttable':
      f.box(WD, 0, 0.74, 0, 1.2, 0.05, 1.8, [0.8, 0.7, 0.55]);
      [[-0.55, -0.85], [0.55, -0.85], [-0.55, 0.85], [0.55, 0.85]].forEach(function (q) { f.box(WD, q[0], 0, q[1], 0.06, 0.74, 0.06, [0.6, 0.5, 0.35]); });
      for (var sp2 = 0; sp2 < 5; sp2++) f.box(P, (sp2 * 0.31 % 1) - 0.4, 0.795, (sp2 * 0.47 % 1.4) - 0.7, 0.18, 0.003, 0.12, [[0.8, 0.2, 0.2], [0.2, 0.4, 0.8], [0.9, 0.8, 0.2], [0.2, 0.6, 0.3], [0.1, 0.1, 0.1]][sp2]);
      break;
    case 'easel':
      f.box(WD, 0, 0, -0.15, 0.04, 1.7, 0.04, COL.wood, { rx: -0.15 }); f.box(WD, -0.3, 0, 0.1, 0.04, 1.6, 0.04, COL.wood, { rz: -0.1 }); f.box(WD, 0.3, 0, 0.1, 0.04, 1.6, 0.04, COL.wood, { rz: 0.1 });
      SP.plates.push({ kind: 'drawing', li: li, x: p.x + Math.sin(p.rot) * 0.16, y: Y + 1.25, z: p.z + Math.cos(p.rot) * 0.16, rot: p.rot });
      break;
    case 'paint': for (var pp = 0; pp < 6; pp++) f.part(GEO.cyl, P, (pp * 0.73 % 4) - 2, 0.004, (pp * 1.37 % 4) - 2, 0.1 + pp * 0.03, 0.002, 0.08 + pp * 0.02, [[0.7, 0.1, 0.1], [0.1, 0.3, 0.7], [0.8, 0.7, 0.1]][pp % 3]); break;
    case 'shelf': {
      var col = p.metal ? [0.5, 0.52, 0.5] : [0.45, 0.3, 0.18];
      var mat = p.metal ? MT : WD;
      f.box(mat, 0, 0, 0, 0.45, 2.1, p.len, col);
      if (!p.metal) {
        for (var sl = 0; sl < 5; sl++) for (var side = -1; side <= 1; side += 2) f.part(GEO.plane, MATS.books || (MATS.books = makeBooksMat()), side * 0.226, 0.25 + sl * 0.4, 0, p.len - 0.1, 0.33, 1, [1, 1, 1], { ry: side * PI / 2, uv: [sl * 0.2 * 0.5, 0, 1, 1] });
      } else {
        for (var bx2 = 0; bx2 < 6; bx2++) f.box(P, 0, 0.1 + (bx2 % 3) * 0.7, -p.len / 2 + 0.5 + bx2 * 0.9, 0.4, 0.3, 0.5, [0.62, 0.5, 0.36]);
      }
      break;
    }
    case 'ltable': f.box(WD, 0, 0.72, 0, 1.0, 0.04, 1.6, [0.7, 0.55, 0.35]); [[-0.45, -0.7], [0.45, -0.7], [-0.45, 0.7], [0.45, 0.7]].forEach(function (q) { f.box(WD, q[0], 0, q[1], 0.05, 0.72, 0.05, [0.5, 0.38, 0.25]); }); break;
    case 'cardcat': f.box(WD, 0, 0, 0, 0.9, 1.3, 0.5, [0.55, 0.38, 0.22]); for (var dr = 0; dr < 12; dr++) f.box(MT, -0.3 + (dr % 4) * 0.2, 0.2 + Math.floor(dr / 4) * 0.38, 0.252, 0.06, 0.02, 0.01, [0.8, 0.7, 0.3]); break;
    case 'cot':
      f.box(MT, 0, 0.4, 0, 1.9, 0.12, 0.75, [0.85, 0.85, 0.85]); f.box(P, 0, 0.52, 0, 1.85, 0.03, 0.72, [0.95, 0.95, 0.92]);
      f.box(P, -0.75, 0.55, 0, 0.35, 0.08, 0.5, [0.95, 0.95, 0.95]);
      [[-0.9, -0.33], [0.9, -0.33], [-0.9, 0.33], [0.9, 0.33]].forEach(function (q) { f.box(MT, q[0], 0, q[1], 0.03, 0.4, 0.03, COL.metal); });
      break;
    case 'curtain': f.box(MT, 0, 2.2, 0, 0.02, 0.02, 1.8, COL.metal); f.box(P, 0, 0.3, 0, 0.02, 1.9, 1.7, [0.55, 0.7, 0.68]); break;
    case 'filing': f.box(MT, 0, 0, 0, 0.5, 1.35, 0.6, [0.55, 0.56, 0.5]); for (var fd = 0; fd < 4; fd++) f.box(MT, 0, 0.15 + fd * 0.32, 0.301, 0.2, 0.03, 0.02, COL.dark); break;
    case 'pamic': f.cyl(MT, 0, 0, 0, 0.06, 0.02, COL.dark); f.cyl(MT, 0, 0, 0, 0.008, 0.3, COL.dark); f.sph(MT, 0, 0.32, 0.03, 0.035, [0.6, 0.6, 0.6]); break;
    case 'tvcart': {
      f.box(MT, 0, 0.15, 0, 0.7, 0.03, 0.5, COL.dark); f.box(MT, 0, 0.8, 0, 0.7, 0.03, 0.5, COL.dark);
      [[-0.32, -0.22], [0.32, -0.22], [-0.32, 0.22], [0.32, 0.22]].forEach(function (q) { f.box(MT, q[0], 0.05, q[1], 0.03, 0.78, 0.03, COL.dark); });
      f.box(P, 0, 0.83, -0.05, 0.62, 0.52, 0.5, [0.2, 0.2, 0.21]);
      f.box(P, 0, 0.2, 0, 0.45, 0.1, 0.35, [0.15, 0.15, 0.15]); // VCR
      var tvm = makeTVScreen(); tvm.position.set(p.x + Math.sin(p.rot) * 0.2, y + 1.09, p.z + Math.cos(p.rot) * 0.2); tvm.rotation.y = p.rot;
      SP.tvs.push({ mesh: tvm, li: li, x: p.x, z: p.z, rot: p.rot });
      break;
    }
    case 'vhsshelf':
      f.box(WD, 0, 0, 0, 0.4, 2.0, p.len, [0.35, 0.25, 0.18]);
      for (var vs = 0; vs < 4; vs++) for (var vb = 0; vb < 14; vb++) f.box(P, 0.2, 0.2 + vs * 0.45, -p.len / 2 + 0.2 + vb * 0.27, 0.02, 0.2, 0.025, vb % 3 ? COL.black : [0.9, 0.85, 0.7]);
      break;
    case 'vcr':
      f.box(WD, 0, 0, 0, 0.8, 0.75, 1.1, COL.woodD);
      f.box(P, 0, 0.75, 0, 0.62, 0.52, 0.5, [0.2, 0.2, 0.21]); f.box(P, 0.2, 0.75, 0, 0.1, 0.08, 0.35, COL.black);
      var tv2 = makeTVScreen(); tv2.position.set(p.x + Math.sin(p.rot) * 0.26, y + 1.01, p.z + Math.cos(p.rot) * 0.26); tv2.rotation.y = p.rot;
      SP.tvs.push({ mesh: tv2, li: li, x: p.x, z: p.z, rot: p.rot, vcr: true });
      break;
    case 'stall':
      f.box(P, -0.68, 0.15, 0, 0.04, 1.7, 1.5, [0.55, 0.62, 0.6]); f.box(P, 0.68, 0.15, 0, 0.04, 1.7, 1.5, [0.55, 0.62, 0.6]);
      f.box(P, 0, 0.15, 0.72, 1.3, 1.7, 0.04, [0.6, 0.67, 0.64], { ry: 0.0 });
      f.box(P, 0.4, 1.0, 0.75, 0.08, 0.05, 0.03, COL.metal);
      f.box(P, 0, 0, -0.45, 0.4, 0.42, 0.55, [0.95, 0.95, 0.92]); f.box(P, 0, 0.42, -0.65, 0.42, 0.35, 0.2, [0.95, 0.95, 0.92]);
      break;
    case 'sink': f.box(P, 0, 0.78, 0, 0.55, 0.15, 0.45, [0.95, 0.95, 0.93]); f.box(MT, 0, 0.0, -0.15, 0.06, 0.78, 0.06, COL.metal); f.cyl(MT, 0, 0.92, -0.12, 0.015, 0.15, COL.steel); break;
    case 'mirror':
      f.box(MT, 0, -0.45, 0, p.w + 0.06, 0.96, 0.02, COL.steel);
      f.box(P, 0, -0.42, 0.012, p.w, 0.9, 0.005, [0.08, 0.1, 0.11]);
      SP.mirrors.push({ li: li, x: p.x + Math.sin(p.rot) * 0.03, y: y, z: p.z + Math.cos(p.rot) * 0.03, rot: p.rot, w: p.w });
      break;
    case 'couch':
      f.box(P, 0, 0.2, 0, 2.2, 0.25, 0.85, [0.45, 0.32, 0.24]); f.box(P, 0, 0.2, -0.35, 2.2, 0.75, 0.2, [0.42, 0.3, 0.22]);
      f.box(P, -1.05, 0.2, 0, 0.18, 0.5, 0.85, [0.42, 0.3, 0.22]); f.box(P, 1.05, 0.2, 0, 0.18, 0.5, 0.85, [0.42, 0.3, 0.22]);
      break;
    case 'fridge': f.box(P, 0, 0, 0, 0.75, 1.75, 0.7, [0.85, 0.84, 0.78]); f.box(MT, 0.3, 0.8, 0.36, 0.03, 0.5, 0.03, COL.steel); break;
    case 'boxes': { var s2 = p.s || 1; f.box(P, 0, 0, 0, 0.7 * s2, 0.55 * s2, 0.6 * s2, [0.62, 0.48, 0.32]); if (s2 > 0.85) f.box(P, 0.05, 0.55 * s2, 0, 0.5 * s2, 0.4 * s2, 0.45 * s2, [0.66, 0.52, 0.36], { ry: 0.3 }); f.box(P, 0, 0.55 * s2 - 0.01, 0, 0.71 * s2, 0.012, 0.08, [0.7, 0.66, 0.5]); break; }
    case 'plant': f.cyl(P, 0, 0, 0, 0.18, 0.35, [0.6, 0.35, 0.2]); f.sph(P, 0, 0.6, 0, 0.3, [0.25, 0.18, 0.1], { sy: 0.4 }); break; // dead plant
    case 'globe': f.cyl(MT, 0, 0, 0, 0.08, 0.02, COL.dark); f.cyl(MT, 0, 0, 0, 0.01, 0.15, COL.dark); f.sph(P, 0, 0.3, 0, 0.15, [0.25, 0.45, 0.6]); break;
    case 'bulb': break; // handled by fixture
    case 'pipes':
      for (var pi = 0; pi < 3; pi++) f.part(GEO.cyl, MT, 0, 2.35 + pi * 0.12 - 4, -0.2 * pi, 0.06, 30, 0.06, [0.45, 0.35, 0.25], { rz: PI / 2 });
      break;
    case 'boilertank':
      f.part(GEO.cyl, MT, 0, 1.5, 0, 1.3, 3.2, 1.3, [0.42, 0.36, 0.3]);
      f.box(MT, 0, 0.3, 1.25, 0.5, 0.35, 0.1, COL.dark);
      f.box(E, 0, 0.35, 1.31, 0.4, 0.22, 0.01, [1, 1, 1], { ov: { on: [2, 0.8, 0.2], off: [2, 0.7, 0.15] } });
      f.cyl(MT, 0.7, 2.8, 0, 0.12, 0.6, COL.dark);
      for (var gg = 0; gg < 2; gg++) f.part(GEO.cyl, E, -0.5 + gg * 0.4, 1.6, 1.31, 0.08, 0.01, 0.08, [1, 1, 1], { rx: PI / 2, ov: { on: [1, 1, 0.9], off: [0.4, 0.4, 0.35] } });
      break;
    case 'costume': buildCostume(f, p.who); break;
    default: break;
  }
}
function makeBooksMat() {
  var c = mkCanvas(512, 128), g = c.getContext('2d'), rnd = makeRNG(77);
  g.fillStyle = '#2a1d14'; g.fillRect(0, 0, 512, 128);
  for (var x = 0; x < 512;) { var w = 6 + rnd() * 12, h = 80 + rnd() * 44; var hue = rnd(); g.fillStyle = 'hsl(' + (hue * 360 | 0) + ',' + (25 + rnd() * 35 | 0) + '%,' + (18 + rnd() * 30 | 0) + '%)'; if (rnd() < 0.08) { x += w; continue; } g.fillRect(x, 128 - h, w - 1, h); g.fillStyle = 'rgba(230,210,150,0.5)'; g.fillRect(x + 1, 128 - h + 10, w - 3, 2); x += w; }
  var t = toTex(c); t.repeat.set(4, 1);
  return bakeMat({ map: t, vertexColors: true, shininess: 4 });
}
function buildCostume(f, who) {
  var P = MATS.paint, MT = MATS.metalP;
  f.box(MT, 0, 2.2, 0, 1.0, 0.03, 0.03, COL.metal); f.box(MT, 0, 2.15, 0, 0.02, 0.1, 0.02, COL.dark);
  if (who === 'penny') { // pencil girl: yellow body, pink eraser head
    f.cyl(P, 0, 0.55, 0, 0.32, 1.25, [0.85, 0.7, 0.2], { six: 1 }); f.part(GEO.cone, P, 0, 0.35, 0, 0.32, 0.4, 0.32, [0.8, 0.65, 0.5], { rx: PI });
    f.cyl(MT, 0, 1.8, 0, 0.33, 0.12, [0.7, 0.7, 0.7]); f.cyl(P, 0, 1.92, 0, 0.32, 0.22, [0.9, 0.55, 0.62]);
    f.box(P, 0, 1.2, 0.3, 0.5, 0.5, 0.05, [0.4, 0.1, 0.1]); // stain
  } else if (who === 'bitsy') { // bookworm: green segments, glasses
    for (var s = 0; s < 4; s++) f.sph(P, 0, 0.5 + s * 0.38, 0, 0.3 - s * 0.02, [0.35, 0.62, 0.3]);
    f.box(P, -0.1, 1.72, 0.25, 0.14, 0.12, 0.02, COL.black); f.box(P, 0.1, 1.72, 0.25, 0.14, 0.12, 0.02, COL.black);
    f.box(P, 0, 1.0, 0.27, 0.35, 0.3, 0.02, [0.35, 0.08, 0.08]);
  } else { // hamster: brown round
    f.sph(P, 0, 1.1, 0, 0.5, [0.62, 0.42, 0.25], { sy: 0.62 }); f.sph(P, 0, 1.85, 0, 0.32, [0.65, 0.45, 0.28]);
    f.sph(P, -0.22, 2.1, 0, 0.09, [0.85, 0.6, 0.55]); f.sph(P, 0.22, 2.1, 0, 0.09, [0.85, 0.6, 0.55]);
    f.box(P, 0, 0.9, 0.48, 0.3, 0.6, 0.02, [0.3, 0.05, 0.05]);
  }
}
function buildBus(B, p) {
  var f = new PF(B, 1, p.x, 0, p.z, 0);
  var Y = [0.95, 0.68, 0.08], P = MATS.paint, MT = MATS.metalP, E = MATS.emit;
  var L = 11, Wd = 2.9;
  // floor & roof
  f.box(P, 0, 0.0, 0, L, 0.06, Wd, [0.3, 0.3, 0.3]);
  f.box(P, 0, 2.45, 0, L, 0.08, Wd, Y); f.box(P, 0, 2.43, 0, L - 0.2, 0.02, Wd - 0.2, [0.8, 0.78, 0.7]);
  // sides: lower panels, window posts, upper band
  [-1, 1].forEach(function (sd) {
    var z = sd * Wd / 2;
    var doorSide = sd === 1;
    for (var x = -L / 2; x < L / 2 - 0.01; x += 1.0) {
      var isDoor = doorSide && x > 3.4 && x < 4.6;
      if (!isDoor) f.box(P, x + 0.5, 0.06, z, 1.0, 1.1, 0.06, Y);
      f.box(P, x + 0.05, 1.16, z, 0.1, 0.9, 0.07, isDoor ? [0.2, 0.2, 0.2] : Y);
    }
    f.box(P, 0, 2.06, z, L, 0.4, 0.06, Y);
    f.box(P, 0, 0.66, z + sd * 0.035, L, 0.06, 0.01, COL.black); f.box(P, 0, 0.88, z + sd * 0.035, L, 0.06, 0.01, COL.black);
  });
  // front/back
  f.box(P, -L / 2, 0.06, 0, 0.06, 2.4, Wd, Y); f.box(P, L / 2, 0.06, 0, 0.06, 1.1, Wd, Y); f.box(P, L / 2, 2.0, 0, 0.06, 0.45, Wd, Y);
  f.box(P, L / 2 + 0.9, 0.3, 0, 1.8, 0.9, Wd - 0.1, Y); // hood
  f.box(E, L / 2 + 1.81, 0.7, 0.9, 0.02, 0.2, 0.3, [1, 1, 1], { ov: { on: [1, 0.95, 0.8], off: [0.4, 0.38, 0.3] } }); f.box(E, L / 2 + 1.81, 0.7, -0.9, 0.02, 0.2, 0.3, [1, 1, 1], { ov: { on: [1, 0.95, 0.8], off: [0.4, 0.38, 0.3] } });
  [[-3.5, 1], [-3.5, -1], [3.8, 1], [3.8, -1]].forEach(function (w) { f.part(GEO.cyl, P, w[0], 0.45, w[1] * (Wd / 2 + 0.05), 0.48, 0.32, 0.48, COL.black, { rx: PI / 2 }); });
  f.box(E, -L / 2 - 0.02, 1.9, 0.9, 0.02, 0.2, 0.2, [1, 1, 1], { ov: { on: [2, 0.2, 0.1], off: [1.6, 0.1, 0.05] } }); f.box(E, -L / 2 - 0.02, 1.9, -0.9, 0.02, 0.2, 0.2, [1, 1, 1], { ov: { on: [2, 0.2, 0.1], off: [1.6, 0.1, 0.05] } });
  // stop arm
  f.part(GEO.cyl, P, 3.0, 1.4, Wd / 2 + 0.25, 0.22, 0.02, 0.22, [0.8, 0.1, 0.1], { rx: PI / 2 });
  // driver seat + wheel
  f.box(P, 4.6, 0.4, -0.8, 0.5, 0.5, 0.5, [0.2, 0.3, 0.25]); f.part(GEO.cyl, P, 5.1, 1.1, -0.8, 0.22, 0.03, 0.22, COL.black, { rz: 1.1 });
  // windows glass
  [-1, 1].forEach(function (sd) { WORLD_GLASS.push({ li: 1, x: p.x, y: 1.6, z: p.z + sd * Wd / 2, rot: sd === 1 ? 0 : PI, w: L, h: 0.85, bus: true }); });
  B.busText = true;
}

// ---- TV screen (shader: static noise / content) ---------------------------
var TV_MATS = [];
function makeTVScreen() {
  var m = new THREE.ShaderMaterial({
    uniforms: { uTime: LIGHTU.uTime, uOn: { value: 0 }, uFace: { value: null }, uFaceAmt: { value: 0 }, uSeed: { value: Math.random() * 100 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uTime,uOn,uFaceAmt,uSeed; uniform sampler2D uFace; varying vec2 vUv;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}' +
      'void main(){ vec2 uv=vUv; vec2 c=uv-0.5; float vig=1.0-dot(c,c)*1.6;' +
      ' float n=h(floor(uv*vec2(160.0,120.0))+floor(uTime*30.0)+uSeed);' +
      ' float roll=smoothstep(0.0,0.08,abs(fract(uv.y-uTime*0.3)-0.5));' +
      ' vec3 col=vec3(n)*0.75*roll+0.05; col*=0.8+0.2*sin(uv.y*400.0);' +
      ' if(uFaceAmt>0.0){ vec2 fu=uv+vec2(h(vec2(floor(uv.y*40.0),floor(uTime*20.0)))*0.06-0.03,0.0); vec3 f=texture2D(uFace,fu).rgb; col=mix(col,f*1.3+n*0.15,uFaceAmt); }' +
      ' gl_FragColor=vec4(col*vig*uOn+vec3(0.01,0.012,0.012)*(1.0-uOn),1.0); }'
  });
  TV_MATS.push(m);
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), m);
  return mesh;
}

// ---- doors -----------------------------------------------------------------
function buildDoors(M, bk, group) {
  var out = [];
  var woodTex = toTex(texDoor(3, ''));
  M.doors.forEach(function (d) {
    if (d.kind === 'bus') return;
    var Y = LV_Y[d.li];
    var g = new THREE.Group();
    var leaves = d.width > 1.5 ? 2 : 1;
    var lw = d.width / leaves;
    var mat;
    if (d.kind === 'glass') mat = bakeMat({ color: 0x9aa0a4, shininess: 80, specular: new THREE.Color(0.5, 0.5, 0.5) }, 'probe');
    else if (d.kind === 'double') mat = bakeMat({ color: 0x8a3a30, shininess: 40, specular: new THREE.Color(0.25, 0.25, 0.25) }, 'probe');
    else mat = bakeMat({ map: woodTex, shininess: 30 }, 'probe');
    var pr = bk.probe(d.li, d.x, Y + 1.2, d.z);
    setProbe(mat, pr.on, pr.off);
    d.leaves = [];
    for (var k = 0; k < leaves; k++) {
      var pivot = new THREE.Group();
      var sign = k === 0 ? 1 : -1;
      var geo = new THREE.BoxGeometry(lw - 0.02, 2.08, 0.05);
      geo.translate(sign * (lw / 2), 1.04, 0);
      var leaf = new THREE.Mesh(geo, mat); leaf.castShadow = true;
      pivot.add(leaf);
      if (d.kind === 'double' || d.kind === 'glass') { // push bar + window
        var bar = new THREE.Mesh(new THREE.BoxGeometry(lw * 0.7, 0.06, 0.08), mat); bar.position.set(sign * lw / 2, 1.0, 0.05); pivot.add(bar);
        var win = new THREE.Mesh(new THREE.PlaneGeometry(lw * 0.5, d.kind === 'glass' ? 1.5 : 0.6), MATS.glass); win.position.set(sign * lw / 2, d.kind === 'glass' ? 1.2 : 1.55, 0.03); pivot.add(win);
      }
      pivot.position.set(k === 0 ? -d.width / 2 : d.width / 2, 0, 0);
      g.add(pivot); d.leaves.push({ pivot: pivot, sign: sign });
    }
    g.position.set(d.x, Y, d.z);
    g.rotation.y = d.axis === 'z' ? 0 : PI / 2;
    group.add(g);
    d.group = g; d.anim = d.open;
    applyDoorPose(d);
    out.push(d);
  });
  return out;
}
function applyDoorPose(d) {
  if (!d.leaves) return;
  var a = d.anim * 1.45;
  for (var k = 0; k < d.leaves.length; k++) d.leaves[k].pivot.rotation.y = d.leaves[k].sign * a * (d.openDir || 1);
}

// ---- chairs (instanced, per-instance baked probes) -------------------------
function chairGeometry(kind) {
  var b = new Builder(); var f = new PF(b, 0, 0, 0, 0, 0);
  var P = MATS.paint;
  if (kind === 'chair') {
    f.box(P, 0, 0.44, 0, 0.42, 0.03, 0.4, [1, 1, 1]); f.box(P, 0, 0.55, -0.2, 0.42, 0.38, 0.03, [1, 1, 1], { rx: -0.08 });
    [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(function (q) { f.cyl(P, q[0], 0, q[1], 0.012, 0.44, [0.35, 0.35, 0.37], { six: 1 }); });
    f.cyl(P, -0.19, 0.44, -0.19, 0.012, 0.4, [0.35, 0.35, 0.37], { six: 1 }); f.cyl(P, 0.19, 0.44, -0.19, 0.012, 0.4, [0.35, 0.35, 0.37], { six: 1 });
  } else if (kind === 'stool') {
    f.cyl(P, 0, 0.62, 0, 0.17, 0.04, [0.2, 0.2, 0.2]);
    [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(function (q) { f.box(P, q[0], 0, q[1], 0.025, 0.62, 0.025, [0.4, 0.4, 0.42]); });
    f.box(P, 0, 0.25, 0, 0.26, 0.02, 0.02, [0.4, 0.4, 0.42]);
  } else { // busseat bench
    f.box(P, 0, 0.42, 0, 0.92, 0.12, 0.6, [0.22, 0.38, 0.3]); f.box(P, 0, 0.5, -0.3, 0.92, 0.6, 0.1, [0.22, 0.38, 0.3]);
    f.box(P, 0, 0, 0, 0.06, 0.42, 0.06, [0.25, 0.25, 0.25]);
  }
  var a = b.accs[Object.keys(b.accs)[0]];
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(a.n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(a.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(a.c, 3));
  g.setIndex(a.idx);
  return g;
}
function buildChairs(M, bk, group) {
  var res = {};
  ['chair', 'stool', 'busseat'].forEach(function (kind) {
    var list = M.chairs.filter(function (c) { return c.kind === kind; });
    if (!list.length) return;
    var geo = chairGeometry(kind);
    var n = list.length;
    var bOn = new Float32Array(n * 3), bOff = new Float32Array(n * 3), col = new Float32Array(n * 3);
    geo.setAttribute('bOnI', new THREE.InstancedBufferAttribute(bOn, 3));
    geo.setAttribute('bOffI', new THREE.InstancedBufferAttribute(bOff, 3));
    var mat = bakeMat({ vertexColors: true, shininess: 40, specular: new THREE.Color(0.2, 0.2, 0.2) }, 'inst');
    var im = new THREE.InstancedMesh(geo, mat, n);
    im.instanceColor = new THREE.InstancedBufferAttribute(col, 3);
    var cols = [COL.chairBlue, COL.chairOr, [0.25, 0.45, 0.35], [0.6, 0.55, 0.3]];
    var tmp = new THREE.Color();
    list.forEach(function (c, i) {
      c.inst = i; c.im = im;
      var pr = bk.probe(c.li, c.x, LV_Y[c.li] + 0.6, c.z);
      bOn[i * 3] = pr.on[0] * 0.5; bOn[i * 3 + 1] = pr.on[1] * 0.5; bOn[i * 3 + 2] = pr.on[2] * 0.5;
      bOff[i * 3] = pr.off[0] * 0.5; bOff[i * 3 + 1] = pr.off[1] * 0.5; bOff[i * 3 + 2] = pr.off[2] * 0.5;
      var cc = kind === 'chair' ? cols[(c.room * 3 + i) % 2] : [1, 1, 1];
      col[i * 3] = cc[0]; col[i * 3 + 1] = cc[1]; col[i * 3 + 2] = cc[2];
    });
    im.castShadow = true; im.receiveShadow = true;
    im.frustumCulled = false;
    res[kind] = { im: im, list: list };
    group.add(im);
    list.forEach(function (c) { setChairPose(c, 'normal'); });
  });
  return res;
}
var _cm4 = null;
function setChairPose(c, pose) {
  if (!_cm4) _cm4 = new THREE.Matrix4();
  var Y = LV_Y[c.li];
  var q = new THREE.Quaternion(), p = new THREE.Vector3(c.x, Y, c.z), s = new THREE.Vector3(1, 1, 1);
  if (pose === 'normal') q.setFromEuler(new THREE.Euler(0, c.rot, 0));
  else if (pose === 'stacked') { // upside down on the table/desk in front
    var fx = Math.sin(c.rot), fz = Math.cos(c.rot);
    if (c.kind === 'chair') { p.set(c.x + fx * 0.6, Y + 0.74 + 0.47, c.z + fz * 0.6); q.setFromEuler(new THREE.Euler(PI, c.rot, 0)); }
    else if (c.kind === 'stool') { p.set(c.x + fx * 0.55, Y + 0.92 + 0.66, c.z + fz * 0.55); q.setFromEuler(new THREE.Euler(PI, c.rot, 0)); }
    else { p.set(c.x, Y + 0.48, c.z); q.setFromEuler(new THREE.Euler(0, c.rot, 0)); s.set(1, 0.25, 1); }
  } else if (pose === 'gone') { s.set(0.0001, 0.0001, 0.0001); }
  else if (pose === 'fallen') { q.setFromEuler(new THREE.Euler(PI / 2, c.rot, 0.3)); p.y += 0.2; }
  _cm4.compose(p, q, s);
  c.im.setMatrixAt(c.inst, _cm4);
  c.im.instanceMatrix.needsUpdate = true;
  c.pose = pose;
}


// ===== 09_art.js =====
// ---- 2D art: mascots, posters, signs ---------------------------------------
// Professor Hoots: round brown owl, cream belly, huge round eyes, orange beak, blue mortarboard with yellow tassel.
function drawHoots(g, x, y, s, o) {
  o = o || {};
  var wave = o.wave || 0, creepy = o.creepy || 0, blink = o.blink || 0, look = o.look || 0;
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.tilt || 0);
  g.lineJoin = 'round'; g.lineCap = 'round';
  var ink = '#2b1a10';
  // wings
  g.fillStyle = '#7a4a26'; g.strokeStyle = ink; g.lineWidth = 5;
  g.save(); g.translate(-78, 10); g.rotate(-0.3 - wave * 0.9); g.beginPath(); g.ellipse(-10, 30, 26, 52, 0.25, 0, TAU); g.fill(); g.stroke(); g.restore();
  g.save(); g.translate(78, 10); g.rotate(0.3); g.beginPath(); g.ellipse(10, 30, 26, 52, -0.25, 0, TAU); g.fill(); g.stroke(); g.restore();
  // body
  g.fillStyle = '#8b5a2e'; g.beginPath(); g.ellipse(0, 20, 88, 96, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#f2dfb5'; g.beginPath(); g.ellipse(0, 45, 56, 62, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(140,90,50,0.55)'; g.lineWidth = 3;
  for (var r = 0; r < 3; r++) for (var c = -1; c <= 1; c++) { g.beginPath(); g.arc(c * 22 + (r % 2) * 11, 20 + r * 22, 9, 0.2, PI - 0.2); g.stroke(); }
  // ear tufts
  g.fillStyle = '#7a4a26'; g.strokeStyle = ink; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-70, -55); g.lineTo(-58, -105); g.lineTo(-30, -70); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(70, -55); g.lineTo(58, -105); g.lineTo(30, -70); g.closePath(); g.fill(); g.stroke();
  // eyes
  [-34, 34].forEach(function (ex) {
    g.fillStyle = '#f7c948'; g.beginPath(); g.arc(ex, -30, 34, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = creepy ? '#000' : '#fff'; g.beginPath(); g.arc(ex, -30, 27, 0, TAU); g.fill();
    if (!creepy) {
      g.fillStyle = '#111'; g.beginPath(); g.arc(ex + look * 8, -28, 14, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + look * 8 - 5, -34, 5, 0, TAU); g.fill();
    } else { g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ex, -30, 2.2, 0, TAU); g.fill(); }
    if (blink > 0) { g.fillStyle = '#8b5a2e'; g.fillRect(ex - 35, -65, 70, 35 * blink * 2); }
  });
  // beak
  g.fillStyle = '#f08a24'; g.beginPath(); g.moveTo(-14, -8); g.lineTo(14, -8); g.lineTo(0, 18 + creepy * 6); g.closePath(); g.fill(); g.stroke();
  if (o.mouth) { g.fillStyle = '#5a1010'; g.beginPath(); g.moveTo(-9, -2); g.lineTo(9, -2); g.lineTo(0, 10 + o.mouth * 10); g.closePath(); g.fill(); }
  // feet
  g.fillStyle = '#f08a24'; [-30, 30].forEach(function (fx) { g.beginPath(); g.ellipse(fx, 112, 20, 9, 0, 0, TAU); g.fill(); g.stroke(); });
  // mortarboard
  g.fillStyle = '#1f3c88'; g.beginPath(); g.moveTo(-70, -78); g.lineTo(0, -102); g.lineTo(70, -78); g.lineTo(0, -56); g.closePath(); g.fill(); g.stroke();
  g.fillRect(-34, -78, 68, 20); g.strokeRect(-34, -78, 68, 20);
  g.strokeStyle = '#f7c948'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -80); g.quadraticCurveTo(40, -80, 52, -48); g.stroke();
  g.fillStyle = '#f7c948'; g.beginPath(); g.arc(52, -44, 6, 0, TAU); g.fill();
  if (creepy > 0.5) { g.fillStyle = 'rgba(90,0,0,0.85)'; g.fillRect(-36, -4, 3, 30 + creepy * 30); g.fillRect(32, -4, 3, 20 + creepy * 40); }
  g.restore();
}
function drawPenny(g, x, y, s, o) { // pencil girl
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.strokeStyle = '#2b1a10'; g.lineJoin = 'round';
  g.fillStyle = '#f5c22e'; g.beginPath(); g.moveTo(-34, -60); g.lineTo(34, -60); g.lineTo(34, 70); g.lineTo(0, 120); g.lineTo(-34, 70); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#f0d3a8'; g.beginPath(); g.moveTo(-34, 70); g.lineTo(34, 70); g.lineTo(0, 120); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#333'; g.beginPath(); g.moveTo(-9, 106); g.lineTo(9, 106); g.lineTo(0, 120); g.closePath(); g.fill();
  g.fillStyle = '#c0c0c0'; g.fillRect(-36, -78, 72, 18); g.strokeRect(-36, -78, 72, 18);
  g.fillStyle = '#ef8aa6'; g.beginPath(); g.ellipse(0, -96, 36, 26, 0, PI, 0); g.lineTo(36, -78); g.lineTo(-36, -78); g.closePath(); g.fill(); g.stroke();
  [-13, 13].forEach(function (ex) { g.fillStyle = o.creepy ? '#000' : '#fff'; g.beginPath(); g.arc(ex, -25, 11, 0, TAU); g.fill(); g.stroke(); if (!o.creepy) { g.fillStyle = '#111'; g.beginPath(); g.arc(ex, -23, 5, 0, TAU); g.fill(); } });
  g.beginPath(); g.arc(0, 0, 14, 0.2, PI - 0.2); g.stroke();
  g.restore();
}
function drawBitsy(g, x, y, s, o) { // bookworm
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.strokeStyle = '#1f2a10';
  for (var i = 3; i >= 0; i--) { g.fillStyle = i % 2 ? '#7cc356' : '#68ad46'; g.beginPath(); g.arc(-60 + i * 30, 40 - Math.sin(i + (o.t || 0) * 3) * 6, 30, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = '#7cc356'; g.beginPath(); g.arc(40, -10, 44, 0, TAU); g.fill(); g.stroke();
  [22, 58].forEach(function (ex) { g.fillStyle = o.creepy ? '#000' : '#fff'; g.beginPath(); g.arc(ex, -20, 12, 0, TAU); g.fill(); if (!o.creepy) { g.fillStyle = '#111'; g.beginPath(); g.arc(ex + 2, -18, 5, 0, TAU); g.fill(); } g.strokeStyle = '#111'; g.lineWidth = 4; g.beginPath(); g.arc(ex, -20, 17, 0, TAU); g.stroke(); });
  g.beginPath(); g.moveTo(34, -20); g.lineTo(46, -20); g.stroke();
  g.strokeStyle = '#1f2a10'; g.beginPath(); g.arc(40, 2, 16, 0.3, PI - 0.3); g.stroke();
  g.restore();
}
function drawMarbles(g, x, y, s, o) { // hamster
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.strokeStyle = '#2b1a10';
  g.fillStyle = '#c98c4f'; g.beginPath(); g.ellipse(0, 20, 70, 62, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#f6e3c5'; g.beginPath(); g.ellipse(0, 38, 42, 36, 0, 0, TAU); g.fill();
  g.fillStyle = '#c98c4f'; [-48, 48].forEach(function (ex) { g.beginPath(); g.arc(ex, -32, 18, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#f1a7a0'; g.beginPath(); g.arc(ex, -32, 9, 0, TAU); g.fill(); g.fillStyle = '#c98c4f'; });
  [-20, 20].forEach(function (ex) { g.fillStyle = o.creepy ? '#000' : '#111'; g.beginPath(); g.arc(ex, -2, o.creepy ? 12 : 8, 0, TAU); g.fill(); g.fillStyle = '#fff'; if (!o.creepy) { g.beginPath(); g.arc(ex - 3, -5, 3, 0, TAU); g.fill(); } });
  g.fillStyle = '#e57373'; g.beginPath(); g.arc(0, 12, 6, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.fillRect(-7, 20, 6, 9); g.fillRect(1, 20, 6, 9);
  g.restore();
}
function drawStar(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); for (var i = 0; i < 10; i++) { var a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }

// NPC portrait used on MISSING posters & yearbook
function drawPortrait(G, X, Y, w, h, look, seed) {
  w = Math.round(w); h = Math.round(h);
  var tc = document.createElement('canvas'); tc.width = w; tc.height = h;
  var g = tc.getContext('2d', { willReadFrequently: true }), x = 0, y = 0;
  var rnd = makeRNG(seed || 1);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#7d8a96'; g.fillRect(x, y, w, h);
  var sk = look.skin, hr = look.hair;
  var cx = x + w / 2, cy = y + h * 0.48;
  g.fillStyle = rgbs(look.shirt); g.beginPath(); g.ellipse(cx, y + h * 1.05, w * 0.45, h * 0.35, 0, 0, TAU); g.fill();
  g.fillStyle = rgbs(sk); g.fillRect(cx - w * 0.08, cy + h * 0.15, w * 0.16, h * 0.2);
  g.beginPath(); g.ellipse(cx, cy, w * 0.22, h * 0.27, 0, 0, TAU); g.fill();
  g.fillStyle = rgbs(hr);
  if (look.hairStyle === 0) { g.beginPath(); g.ellipse(cx, cy - h * 0.12, w * 0.24, h * 0.17, 0, PI, 0); g.fill(); }
  else if (look.hairStyle === 1) { g.beginPath(); g.ellipse(cx, cy - h * 0.05, w * 0.27, h * 0.3, 0, PI * 0.95, PI * 2.05); g.fill(); g.fillRect(cx - w * 0.27, cy - h * 0.05, w * 0.08, h * 0.32); g.fillRect(cx + w * 0.19, cy - h * 0.05, w * 0.08, h * 0.32); }
  else if (look.hairStyle === 2) { g.beginPath(); g.ellipse(cx, cy - h * 0.18, w * 0.2, h * 0.08, 0, PI, 0); g.fill(); }
  else if (look.hairStyle === 3) { g.fillStyle = 'rgb(200,200,200)'; g.beginPath(); g.ellipse(cx, cy - h * 0.14, w * 0.23, h * 0.12, 0, PI, 0); g.fill(); }
  g.fillStyle = '#111'; g.fillRect(cx - w * 0.1, cy - h * 0.02, w * 0.05, h * 0.03); g.fillRect(cx + w * 0.05, cy - h * 0.02, w * 0.05, h * 0.03);
  g.fillStyle = 'rgba(80,30,30,0.8)'; g.fillRect(cx - w * 0.06, cy + h * 0.13, w * 0.12, h * 0.015);
  if (look.glasses) { g.strokeStyle = '#222'; g.lineWidth = 1.5; g.strokeRect(cx - w * 0.13, cy - h * 0.05, w * 0.1, h * 0.08); g.strokeRect(cx + w * 0.03, cy - h * 0.05, w * 0.1, h * 0.08); }
  // photocopy look
  var id = g.getImageData(x, y, w, h), d = id.data;
  for (var i = 0; i < d.length; i += 4) { var v = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11); v = v > 120 ? 230 : v * 0.6; v += (rnd() - 0.5) * 40; d[i] = d[i + 1] = d[i + 2] = v; }
  g.putImageData(id, x, y);
  g.restore();
  G.drawImage(tc, X, Y);
}
function rgbs(c) { return 'rgb(' + (c[0] * 255 | 0) + ',' + (c[1] * 255 | 0) + ',' + (c[2] * 255 | 0) + ')'; }

// ---------------------------------------------------------------------------
var HALL_POSTERS = ['welcome', 'norun', 'camera', 'lost', 'hallpass', 'read', 'newspaper', 'hoots', 'attend', 'seat', 'picture', 'dance', 'moonlight', 'bus'];
function paperBG(g, w, h, col, rnd) {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  pixelsRect(g, w, h, rnd);
  g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
}
function pixelsRect(g, w, h, rnd) { for (var i = 0; i < 300; i++) { g.fillStyle = 'rgba(90,70,40,' + rnd() * 0.08 + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 2 + rnd() * 10); } }
function fitText(g, t, x, y, maxW, size, font, col, align) {
  g.font = size + 'px ' + font; var w = g.measureText(t).width; if (w > maxW) { size = size * maxW / w; g.font = size + 'px ' + font; }
  g.fillStyle = col; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y);
}
function drawPoster(g, kind, w, h, night, rnd, extra) {
  var BG = '"Bungee", Impact, sans-serif', TW = '"Special Elite", "Courier New", monospace', LG = '"Luckiest Guy", Impact, sans-serif';
  var creepy = night >= 2 && rnd() < 0.25 + night * 0.08;
  switch (kind) {
    case 'welcome': paperBG(g, w, h, '#ffe36e', rnd); for (var s = 0; s < 6; s++) drawStar(g, rnd() * w, rnd() * h, 10 + rnd() * 10, '#ff6b3d');
      fitText(g, 'WELCOME', w / 2, h * 0.3, w * 0.9, 46, BG, '#1f3c88'); fitText(g, creepy ? 'BACK. AGAIN.' : 'BACK,', w / 2, h * 0.5, w * 0.9, 46, BG, '#c62828'); fitText(g, creepy ? 'YOU NEVER LEFT' : 'STUDENTS!', w / 2, h * 0.72, w * 0.9, 40, BG, '#1f3c88'); break;
    case 'norun': paperBG(g, w, h, '#fff', rnd); g.strokeStyle = '#c62828'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h * 0.38, w * 0.3, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(w * 0.29, h * 0.17); g.lineTo(w * 0.71, h * 0.59); g.stroke();
      g.strokeStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h * 0.27, 8, 0, TAU); g.moveTo(w / 2, h * 0.3); g.lineTo(w / 2 - 6, h * 0.42); g.lineTo(w / 2 - 22, h * 0.52); g.moveTo(w / 2 - 6, h * 0.42); g.lineTo(w / 2 + 16, h * 0.5); g.moveTo(w / 2 - 2, h * 0.34); g.lineTo(w / 2 + 20, h * 0.32); g.moveTo(w / 2 - 2, h * 0.34); g.lineTo(w / 2 - 22, h * 0.38); g.stroke();
      fitText(g, 'NO RUNNING', w / 2, h * 0.78, w * 0.9, 34, BG, '#111'); fitText(g, creepy ? 'IT HEARS YOU.' : 'IN THE HALLS', w / 2, h * 0.9, w * 0.9, 24, BG, '#c62828'); break;
    case 'camera': paperBG(g, w, h, '#bfe3ff', rnd); g.fillStyle = '#222'; g.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.22); g.beginPath(); g.arc(w / 2, h * 0.31, w * 0.09, 0, TAU); g.fillStyle = '#69c'; g.fill();
      fitText(g, creepy ? 'SMILE.' : 'SMILE!', w / 2, h * 0.58, w * 0.9, 44, BG, '#1f3c88'); fitText(g, creepy ? "WE'RE WATCHING." : "YOU'RE ON CAMERA", w / 2, h * 0.76, w * 0.9, 26, BG, '#c62828'); break;
    case 'lost': paperBG(g, w, h, '#f4f0e0', rnd); fitText(g, 'LOST & FOUND', w / 2, h * 0.15, w * 0.9, 30, BG, '#2e7d32'); g.font = '16px ' + TW; g.fillStyle = '#222'; g.textAlign = 'left';
      ['- 1 lunch box (owl)', '- red mitten', '- retainer', '- glasses, cracked', creepy ? '- a left shoe, still warm' : '- yo-yo', '- hall pass #0'].forEach(function (t, i) { g.fillText(t, w * 0.1, h * 0.32 + i * h * 0.1); }); break;
    case 'hallpass': paperBG(g, w, h, '#ffffff', rnd); g.fillStyle = '#c62828'; g.fillRect(0, 0, w, h * 0.25); fitText(g, 'HALL PASS', w / 2, h * 0.13, w * 0.9, 34, BG, '#fff'); fitText(g, 'REQUIRED', w / 2, h * 0.42, w * 0.9, 38, BG, '#111');
      g.font = '15px ' + TW; g.fillStyle = '#333'; g.textAlign = 'center'; g.fillText('All students in the halls', w / 2, h * 0.62); g.fillText('after the bell must carry', w / 2, h * 0.7); g.fillText(creepy ? 'nothing. They will not need it.' : 'a valid hall pass.', w / 2, h * 0.78); break;
    case 'read': paperBG(g, w, h, '#7fd3c6', rnd); g.fillStyle = '#fff'; g.fillRect(w * 0.25, h * 0.25, w * 0.5, h * 0.3); g.fillStyle = '#c62828'; g.fillRect(w * 0.49, h * 0.25, w * 0.02, h * 0.3); drawBitsy(g, w * 0.5, h * 0.12, 0.35, { creepy: creepy }); fitText(g, 'READ!', w / 2, h * 0.7, w * 0.9, 56, BG, '#1f3c88'); fitText(g, 'with Bitsy Bookworm', w / 2, h * 0.86, w * 0.9, 18, TW, '#111'); break;
    case 'newspaper': paperBG(g, w, h, '#ece6d6', rnd); fitText(g, 'THE HOWL', w / 2, h * 0.1, w * 0.9, 34, '"Special Elite", serif', '#111'); g.fillStyle = '#111'; g.fillRect(w * 0.06, h * 0.18, w * 0.88, 2);
      fitText(g, creepy ? 'ENROLLMENT AT 100%' : 'NIGHT SCHOOL OPENS!', w / 2, h * 0.26, w * 0.9, 20, BG, '#111'); g.fillStyle = '#999'; g.fillRect(w * 0.08, h * 0.33, w * 0.4, h * 0.3); drawHoots(g, w * 0.28, h * 0.48, 0.28, { creepy: creepy });
      g.fillStyle = '#444'; for (var ln = 0; ln < 12; ln++) g.fillRect(w * 0.52 + (ln > 5 ? 0 : 0), h * 0.35 + (ln % 6) * h * 0.05 + (ln > 5 ? h * 0.32 : 0), w * 0.4, 3);
      for (var l2 = 0; l2 < 5; l2++) g.fillRect(w * 0.08, h * 0.68 + l2 * h * 0.05, w * 0.4, 3); break;
    case 'hoots': paperBG(g, w, h, '#ffd54f', rnd); var gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#fff7c2'); gr.addColorStop(1, 'rgba(255,170,60,0.6)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (var st = 0; st < 8; st++) drawStar(g, rnd() * w, rnd() * h * 0.4, 8 + rnd() * 8, '#fff');
      drawHoots(g, w / 2, h * 0.5, Math.min(w, h) / 300, { creepy: creepy ? 1 : 0, wave: 0.6 });
      fitText(g, creepy ? 'HOO-RAY FOR STAYING!' : 'HOO-RAY FOR LEARNING!', w / 2, h * 0.9, w * 0.95, 26, LG, '#c62828'); fitText(g, 'Professor Hoots', w / 2, h * 0.08, w * 0.9, 20, LG, '#1f3c88'); break;
    case 'attend': paperBG(g, w, h, '#ffffff', rnd); fitText(g, 'ATTENDANCE', w / 2, h * 0.25, w * 0.9, 34, BG, '#1f3c88'); fitText(g, 'IS', w / 2, h * 0.42, w * 0.9, 30, BG, '#1f3c88'); fitText(g, 'MANDATORY', w / 2, h * 0.58, w * 0.9, 34, BG, '#c62828'); drawStar(g, w / 2, h * 0.8, 24, '#f7c948'); break;
    case 'seat': paperBG(g, w, h, '#ffccbc', rnd); fitText(g, 'BE IN YOUR SEAT', w / 2, h * 0.3, w * 0.92, 30, BG, '#111'); fitText(g, 'WHEN THE', w / 2, h * 0.48, w * 0.9, 28, BG, '#111'); fitText(g, 'BELL RINGS', w / 2, h * 0.64, w * 0.92, 36, BG, '#c62828');
      g.fillStyle = '#795548'; g.fillRect(w * 0.4, h * 0.76, w * 0.2, h * 0.04); g.fillRect(w * 0.42, h * 0.8, w * 0.03, h * 0.1); g.fillRect(w * 0.55, h * 0.8, w * 0.03, h * 0.1); g.fillRect(w * 0.55, h * 0.66, w * 0.03, h * 0.1); break;
    case 'picture': paperBG(g, w, h, '#e1bee7', rnd); fitText(g, 'PICTURE DAY', w / 2, h * 0.15, w * 0.9, 32, BG, '#4a148c'); g.fillStyle = '#fff'; g.fillRect(w * 0.2, h * 0.27, w * 0.6, h * 0.45); drawHoots(g, w / 2, h * 0.5, 0.32, { creepy: creepy }); fitText(g, creepy ? 'SAY CHEESE. FOREVER.' : 'Say "Cheese!"', w / 2, h * 0.85, w * 0.9, 22, TW, '#111'); break;
    case 'dance': paperBG(g, w, h, '#b3e5fc', rnd); fitText(g, 'MOONLIGHT DANCE', w / 2, h * 0.2, w * 0.92, 28, BG, '#0d47a1'); fitText(g, 'Fri. Oct 29 · GYM', w / 2, h * 0.36, w * 0.9, 20, TW, '#111');
      g.fillStyle = 'rgba(200,0,0,0.85)'; g.save(); g.translate(w / 2, h * 0.6); g.rotate(-0.25); g.fillRect(-w * 0.45, -22, w * 0.9, 44); g.restore(); fitText(g, 'CANCELLED', w / 2, h * 0.6, w * 0.8, 34, BG, '#fff'); break;
    case 'moonlight': paperBG(g, w, h, '#1a237e', rnd); g.fillStyle = '#fff59d'; g.beginPath(); g.arc(w * 0.7, h * 0.25, w * 0.15, 0, TAU); g.fill(); g.fillStyle = '#1a237e'; g.beginPath(); g.arc(w * 0.64, h * 0.22, w * 0.14, 0, TAU); g.fill();
      for (var s2 = 0; s2 < 14; s2++) drawStar(g, rnd() * w, rnd() * h * 0.6, 3 + rnd() * 4, '#fff');
      fitText(g, 'MOONLIGHT', w / 2, h * 0.58, w * 0.9, 34, LG, '#fff59d'); fitText(g, 'LEARNING CO.', w / 2, h * 0.7, w * 0.9, 24, LG, '#fff59d'); fitText(g, creepy ? 'Learn All Night. Forever.' : '"Learn All Night!"', w / 2, h * 0.84, w * 0.9, 18, TW, '#fff'); break;
    case 'bus': paperBG(g, w, h, '#fff3c4', rnd); g.fillStyle = '#f5b400'; g.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.25); g.fillStyle = '#111'; g.beginPath(); g.arc(w * 0.3, h * 0.57, 12, 0, TAU); g.arc(w * 0.7, h * 0.57, 12, 0, TAU); g.fill();
      fitText(g, 'THE LAST BUS', w / 2, h * 0.14, w * 0.9, 30, BG, '#111'); fitText(g, creepy ? 'HAS NO DRIVER' : 'LEAVES AT DISMISSAL', w / 2, h * 0.75, w * 0.92, 20, BG, '#c62828'); fitText(g, 'Do not be late.', w / 2, h * 0.88, w * 0.9, 18, TW, '#111'); break;
    case 'missing': {
      var nm = extra || { name: 'DANA', look: null };
      paperBG(g, w, h, '#fafafa', rnd); fitText(g, 'MISSING', w / 2, h * 0.1, w * 0.92, 44, BG, '#111');
      if (nm.look) drawPortrait(g, w * 0.2, h * 0.19, w * 0.6, h * 0.42, nm.look, nm.seed); else { g.fillStyle = '#888'; g.fillRect(w * 0.2, h * 0.19, w * 0.6, h * 0.42); }
      fitText(g, nm.name.toUpperCase(), w / 2, h * 0.7, w * 0.9, 26, BG, '#111');
      g.font = '13px ' + TW; g.fillStyle = '#222'; g.textAlign = 'center';
      g.fillText(nm.when || 'Last seen: hallway, after the bell', w / 2, h * 0.79); g.fillText('If seen, do NOT approach.', w / 2, h * 0.86); g.fillText('Call the office. Ext. 0', w / 2, h * 0.92);
      break;
    }
    case 'lunch': paperBG(g, w, h, '#c8e6c9', rnd); fitText(g, "TODAY'S LUNCH", w / 2, h * 0.15, w * 0.9, 30, BG, '#1b5e20'); g.font = '18px ' + TW; g.fillStyle = '#222'; g.textAlign = 'center';
      ['Sloppy Joe', 'Tater Tots', 'Mystery Meat Surprise', 'Chocolate Milk', creepy ? 'You' : 'Jell-O'].forEach(function (t, i) { g.fillText(t, w / 2, h * 0.35 + i * h * 0.12); }); break;
    case 'milk': paperBG(g, w, h, '#e3f2fd', rnd); g.fillStyle = '#fff'; g.fillRect(w * 0.35, h * 0.2, w * 0.3, h * 0.4); g.fillStyle = '#1976d2'; g.fillRect(w * 0.35, h * 0.35, w * 0.3, h * 0.1); fitText(g, 'DRINK YOUR', w / 2, h * 0.72, w * 0.9, 26, BG, '#0d47a1'); fitText(g, 'MILK!', w / 2, h * 0.86, w * 0.9, 40, BG, '#c62828'); break;
    case 'gym': paperBG(g, w, h, '#ffcdd2', rnd); fitText(g, 'GO NIGHT OWLS!', w / 2, h * 0.3, w * 0.92, 34, BG, '#b71c1c'); drawHoots(g, w / 2, h * 0.65, 0.3, { wave: 1, creepy: creepy }); break;
    case 'class': paperBG(g, w, h, '#fff9c4', rnd); fitText(g, 'CLASS RULES', w / 2, h * 0.1, w * 0.9, 30, BG, '#1f3c88'); g.font = '15px ' + TW; g.fillStyle = '#222'; g.textAlign = 'left';
      ['1. Raise your hand.', '2. Be kind.', '3. Stay in your seat.', '4. Never be late.', creepy ? '5. Do not look at the window.' : '5. Have fun learning!', creepy ? '6. There is no 6.' : '6. Hoo-ray!'].forEach(function (t, i) { g.fillText(t, w * 0.08, h * 0.25 + i * h * 0.12); }); break;
    case 'periodic': paperBG(g, w, h, '#fff', rnd); fitText(g, 'PERIODIC TABLE', w / 2, h * 0.08, w * 0.9, 24, BG, '#111'); for (var e = 0; e < 90; e++) { var ex = e % 18, ey = Math.floor(e / 18); g.fillStyle = 'hsl(' + (ex * 20) + ',60%,70%)'; g.fillRect(w * 0.04 + ex * w * 0.051, h * 0.2 + ey * h * 0.14, w * 0.045, h * 0.12); } break;
    case 'music': paperBG(g, w, h, '#f8bbd0', rnd); g.strokeStyle = '#111'; g.lineWidth = 2; for (var ml = 0; ml < 5; ml++) { g.beginPath(); g.moveTo(w * 0.08, h * 0.3 + ml * 12); g.lineTo(w * 0.92, h * 0.3 + ml * 12); g.stroke(); }
      for (var nn = 0; nn < 6; nn++) { g.fillStyle = '#111'; g.beginPath(); g.ellipse(w * 0.2 + nn * w * 0.12, h * 0.32 + (nn * 7 % 40), 7, 5, -0.3, 0, TAU); g.fill(); g.fillRect(w * 0.2 + nn * w * 0.12 + 5, h * 0.32 + (nn * 7 % 40) - 34, 2, 34); }
      fitText(g, 'SING ALONG!', w / 2, h * 0.75, w * 0.9, 34, BG, '#880e4f'); break;
    case 'eyechart': paperBG(g, w, h, '#fff', rnd); ['E', 'F P', 'T O Z', 'L P E D', creepy ? 'S T A Y' : 'P E C F D', creepy ? 'I N Y O U R' : 'E D F C Z P', creepy ? 'S E A T' : 'F E L O P Z D'].forEach(function (t, i) { fitText(g, t, w / 2, h * 0.1 + i * h * 0.13, w * 0.9, 50 - i * 6.5, 'Arial, sans-serif', '#111'); }); break;
    case 'germs': paperBG(g, w, h, '#dcedc8', rnd); fitText(g, 'WASH YOUR', w / 2, h * 0.15, w * 0.9, 28, BG, '#33691e'); fitText(g, 'HANDS!', w / 2, h * 0.3, w * 0.9, 40, BG, '#33691e'); for (var gm = 0; gm < 5; gm++) { g.fillStyle = '#8bc34a'; g.beginPath(); g.arc(w * 0.2 + gm * w * 0.15, h * 0.6 + (gm % 2) * 30, 18, 0, TAU); g.fill(); g.fillStyle = '#111'; g.fillRect(w * 0.2 + gm * w * 0.15 - 6, h * 0.58 + (gm % 2) * 30, 3, 3); g.fillRect(w * 0.2 + gm * w * 0.15 + 3, h * 0.58 + (gm % 2) * 30, 3, 3); } break;
    case 'portrait': g.fillStyle = '#5d4037'; g.fillRect(0, 0, w, h); g.fillStyle = '#3e2723'; g.fillRect(10, 10, w - 20, h - 20); drawPortrait(g, 18, 18, w - 36, h - 50, { skin: [0.85, 0.7, 0.6], hair: [0.5, 0.5, 0.5], shirt: [0.15, 0.15, 0.25], hairStyle: 3, glasses: true }, 9); fitText(g, 'PRINCIPAL D. MERRIWEATHER', w / 2, h - 18, w * 0.85, 12, TW, '#d7ccc8'); break;
    case 'certificate': paperBG(g, w, h, '#fffde7', rnd); g.strokeStyle = '#c9a227'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); fitText(g, 'CERTIFICATE', w / 2, h * 0.3, w * 0.8, 24, '"Special Elite", serif', '#5d4037'); fitText(g, '100% ATTENDANCE · 1993', w / 2, h * 0.55, w * 0.8, 16, TW, '#333'); fitText(g, 'Moonlight Learning Co.', w / 2, h * 0.75, w * 0.8, 14, TW, '#333'); break;
    case 'vhs': paperBG(g, w, h, '#212121', rnd); g.fillStyle = '#ff5252'; g.fillRect(0, h * 0.4, w, h * 0.06); g.fillStyle = '#ffeb3b'; g.fillRect(0, h * 0.47, w, h * 0.06); g.fillStyle = '#40c4ff'; g.fillRect(0, h * 0.54, w, h * 0.06);
      fitText(g, 'AV CLUB', w / 2, h * 0.2, w * 0.9, 34, BG, '#fff'); fitText(g, 'Please rewind', w / 2, h * 0.75, w * 0.9, 20, TW, '#fff'); fitText(g, creepy ? 'Do not watch tape #0' : 'Be kind!', w / 2, h * 0.85, w * 0.9, 16, TW, '#aaa'); break;
    case 'memo': paperBG(g, w, h, '#fffde7', rnd); fitText(g, 'MEMO', w / 2, h * 0.1, w * 0.9, 28, TW, '#111'); g.font = '13px ' + TW; g.fillStyle = '#222'; g.textAlign = 'left';
      ['To: All Night Staff', 'Re: Seating Chart Protocol', '', 'Chairs are to be counted', 'before every period.', 'There must ALWAYS be', 'one fewer chair.', '', '- Moonlight Learning Co.'].forEach(function (t, i) { g.fillText(t, w * 0.08, h * 0.22 + i * h * 0.085); }); break;
    case 'help': paperBG(g, w, h, '#e1f5fe', rnd); fitText(g, "IT'S OK TO", w / 2, h * 0.3, w * 0.9, 28, BG, '#01579b'); fitText(g, 'ASK FOR HELP', w / 2, h * 0.48, w * 0.9, 30, BG, '#01579b'); g.font = '16px ' + TW; g.fillStyle = '#333'; g.textAlign = 'center'; g.fillText(creepy ? 'No one is coming.' : 'Talk to a grown-up you trust.', w / 2, h * 0.7); break;
    default: paperBG(g, w, h, '#eee', rnd);
  }
  // wear: torn corner, tape, grime
  if (kind !== 'portrait') {
    g.fillStyle = 'rgba(240,235,200,0.75)'; g.save(); g.translate(w / 2, 4); g.rotate(rnd() * 0.3 - 0.15); g.fillRect(-18, -6, 36, 14); g.restore();
    if (rnd() < 0.35) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(w, h); g.lineTo(w - 30 - rnd() * 30, h); g.lineTo(w, h - 30 - rnd() * 40); g.fill(); g.globalCompositeOperation = 'source-over'; }
    var gr2 = g.createLinearGradient(0, 0, 0, h); gr2.addColorStop(0, 'rgba(80,60,30,0)'); gr2.addColorStop(1, 'rgba(80,60,30,0.25)'); g.fillStyle = gr2; g.fillRect(0, 0, w, h);
  }
}

// poster atlas: 8 x 8 slots of 256
var POSTER = { canvas: null, tex: null, mat: null, slots: [] };
function buildPosters(M, B, SP) {
  if (!POSTER.canvas) {
    POSTER.canvas = mkCanvas(2048, 2048); POSTER.tex = toTex(POSTER.canvas, { clamp: true });
    POSTER.mat = bakeMat({ map: POSTER.tex, transparent: true, alphaTest: 0.5, shininess: 10, side: THREE.DoubleSide });
  }
  var rnd = makeRNG(M.seed ^ 0x51);
  M.posters.forEach(function (p, i) {
    if (p.kind === 'hall') p.kind = rnd.pick(HALL_POSTERS);
    p.slot = i % 64;
    var aspect = p.w / p.h;
    var sw = aspect >= 1 ? 256 : 256 * aspect, sh = aspect >= 1 ? 256 / aspect : 256;
    p.sw = sw; p.sh = sh;
    var sx = (p.slot % 8) * 256, sy = Math.floor(p.slot / 8) * 256;
    var uv = [sx / 2048, 1 - (sy + sh) / 2048, sw / 2048, sh / 2048];
    var f = new PF(B, p.li, p.x, p.y, p.z, p.rot);
    f.part(GEO.plane, POSTER.mat, 0, 0, 0.006, p.w, p.h, 1, [1, 1, 1], { uv: uv, rz: (rnd() - 0.5) * 0.06 });
  });
  return POSTER;
}
// redraw atlas contents for a night (missing posters for past victims, creepier text)
function paintPosters(M, night, missing) {
  var g = POSTER.canvas.getContext('2d');
  g.clearRect(0, 0, 2048, 2048);
  var rnd = makeRNG(M.seed + night * 101);
  var mi = 0;
  var hallIdx = [];
  M.posters.forEach(function (p, i) { if (HALL_POSTERS.indexOf(p.kind) >= 0 || p.kind === 'missing') hallIdx.push(i); });
  // swap some hall posters to MISSING posters
  var nMiss = Math.min(missing.length, hallIdx.length);
  var missSet = {};
  rnd.shuffle(hallIdx);
  for (var k = 0; k < nMiss; k++) missSet[hallIdx[k]] = missing[k];
  M.posters.forEach(function (p, i) {
    if (i >= 64) return;
    var sx = (p.slot % 8) * 256, sy = Math.floor(p.slot / 8) * 256;
    g.save(); g.translate(sx, sy); g.beginPath(); g.rect(0, 0, p.sw, p.sh); g.clip();
    drawPoster(g, missSet[i] ? 'missing' : p.kind, p.sw, p.sh, night, rnd, missSet[i]);
    g.restore();
  });
  POSTER.tex.needsUpdate = true;
}

// signs: exit, room plates, banners, marquee, standee, score, drawings
function buildSigns(M, B, SP) {
  var E = MATS.emit;
  M.signs.forEach(function (s) {
    var f = new PF(B, s.li, s.x, s.y, s.z, s.rot);
    if (s.kind === 'exit') {
      f.box(MATS.paint, 0, -0.12, 0.05, 0.42, 0.22, 0.1, [0.9, 0.9, 0.88]);
      SP.plates.push({ kind: 'exit', li: s.li, x: s.x + Math.sin(s.rot) * 0.105, y: s.y - 0.01, z: s.z + Math.cos(s.rot) * 0.105, rot: s.rot });
    } else if (s.kind === 'roomplate') {
      SP.plates.push({ kind: 'room', li: s.li, x: s.x, y: s.y, z: s.z, rot: s.rot, text: s.text, sub: s.sub });
    } else if (s.kind === 'banner') {
      var c = mkCanvas(1024, 160), g = c.getContext('2d');
      var big = s.big;
      g.fillStyle = big ? '#7a1010' : ['#1f3c88', '#c62828', '#2e7d32', '#f9a825'][(s.x | 0) % 4]; g.fillRect(0, 0, 1024, 160);
      g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 140);
      fitText(g, s.text, 512, 86, 940, 92, '"Bungee", Impact, sans-serif', '#fff');
      for (var i = 0; i < 4; i++) drawStar(g, 40 + i * 315, 26, 12, '#ffe36e');
      var t = toTex(c, { clamp: true });
      var mat = bakeMat({ map: t, side: THREE.DoubleSide, shininess: 5 }, 'probe');
      var w = big ? 9 : 5.2, h = w * 160 / 1024;
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 8, 1), mat);
      var pos = mesh.geometry.attributes.position; for (var v = 0; v < pos.count; v++) { var xx = pos.getX(v); pos.setZ(v, Math.cos(xx / w * PI) * 0.04); pos.setY(v, pos.getY(v) - Math.cos(xx / w * PI) * 0.06); }
      mesh.position.set(s.x, s.y, s.z); mesh.rotation.y = s.rot + (s.z > 10 && s.z < 12.5 ? PI / 2 * 0 : 0);
      if (s.z > 10 && s.z < 12.5 && !big) { mesh.rotation.y = PI / 2 * (s.rot === 0 ? 1 : -1); }
      mesh.updateMatrix(); mesh.matrixAutoUpdate = false;
      SP.banners.push({ mesh: mesh, li: s.li, x: s.x, y: s.y, z: s.z });
    }
  });
  // plate atlas (canvas 1024x1024, 128x64 cells)
  var pc = mkCanvas(1024, 1024), pg = pc.getContext('2d');
  var slots = 0;
  var pmat = bakeMat({ map: toTex(pc, { clamp: true }), vertexColors: true, shininess: 20, transparent: true, alphaTest: 0.4 });
  SP.plates.forEach(function (pl) {
    var cw = 128, chh = 64, big = pl.kind === 'marquee' || pl.kind === 'standee' || pl.kind === 'score' || pl.kind === 'drawing';
    if (big) { cw = 256; chh = pl.kind === 'standee' ? 256 : 128; }
    var slot = slots; slots += big ? (pl.kind === 'standee' ? 8 : 4) : 1;
    var sx, sy;
    if (!big) { sx = (slot % 8) * 128; sy = Math.floor(slot / 8) * 64; }
    // big plates go to the lower half of atlas
    if (big) { var bi = SP.plates.filter(function (q) { return q.big; }).length; pl.big = true; sx = (bi % 4) * 256; sy = 512 + Math.floor(bi / 4) * 256; }
    pg.save(); pg.translate(sx, sy);
    var ov = null, w = 0.3, h = 0.15;
    if (pl.kind === 'exit') { pg.fillStyle = '#1a0000'; pg.fillRect(0, 0, 128, 64); fitText(pg, 'EXIT', 64, 34, 112, 46, '"Bungee", Impact, sans-serif', '#ff2a1a'); ov = { on: [2, 2, 2], off: [2, 2, 2] }; w = 0.38; h = 0.19; }
    else if (pl.kind === 'room') { pg.fillStyle = '#1f2a3a'; pg.fillRect(0, 0, 128, 64); pg.fillStyle = '#e8e2cf'; pg.fillRect(4, 4, 120, 56); fitText(pg, pl.text, 64, 24, 110, 30, '"Bungee", Impact, sans-serif', '#1f2a3a'); fitText(pg, pl.sub, 64, 50, 116, 14, '"Zen Kaku Gothic New", sans-serif', '#333'); w = 0.36; h = 0.18; }
    else if (pl.kind === 'marquee') { pg.fillStyle = '#f2efe4'; pg.fillRect(0, 0, 256, 128); fitText(pg, 'HOLLOW PINES', 128, 22, 240, 26, '"Bungee", Impact', '#7a1010'); fitText(pg, 'MIDDLE SCHOOL', 128, 48, 240, 18, '"Bungee", Impact', '#7a1010'); fitText(pg, 'NIGHT SCHOOL', 128, 78, 240, 22, '"Special Elite", monospace', '#111'); fitText(pg, 'ENROLLING NOW', 128, 104, 240, 18, '"Special Elite", monospace', '#111'); w = 2.9; h = 1.0; ov = { on: [1.2, 1.15, 1.0], off: [0.9, 0.86, 0.75] }; }
    else if (pl.kind === 'standee') { pg.clearRect(0, 0, 256, 256); drawHoots(pg, 128, 140, 0.95, { wave: 1 }); w = 1.1; h = 1.1; }
    else if (pl.kind === 'score') { pg.fillStyle = '#111'; pg.fillRect(0, 0, 256, 128); fitText(pg, 'HOME', 60, 24, 100, 22, '"Bungee"', '#fff'); fitText(pg, 'GUEST', 196, 24, 100, 22, '"Bungee"', '#fff'); fitText(pg, '00', 60, 78, 100, 60, 'VT323, monospace', '#ff2a1a'); fitText(pg, '00', 196, 78, 100, 60, 'VT323, monospace', '#ff2a1a'); fitText(pg, '0:00', 128, 112, 80, 22, 'VT323, monospace', '#ffb300'); w = 3.8; h = 1.7; ov = { on: [1.6, 1.6, 1.6], off: [0.5, 0.5, 0.5] }; }
    else if (pl.kind === 'drawing') { pg.fillStyle = '#fbfaf5'; pg.fillRect(0, 0, 256, 128); var rr = makeRNG(sx + sy); kidDrawing(pg, 256, 128, rr); w = 0.8; h = 0.4; }
    pg.restore();
    var u = sx / 1024, vv = 1 - (sy + (big ? chh : 64)) / 1024, uw = (big ? cw : 128) / 1024, vh = (big ? chh : 64) / 1024;
    var f = new PF(B, pl.li, pl.x, pl.y, pl.z, pl.rot);
    if (pl.kind === 'standee') {
      f.part(GEO.plane, pmat, 0, 1.0, 0, 1.4, 1.4, 1, [1, 1, 1], { uv: [u, vv, uw, vh] });
      f.part(GEO.plane, pmat, 0, 1.0, -0.005, 1.4, 1.4, 1, [0.6, 0.6, 0.6], { uv: [u, vv, uw, vh], ry: PI });
    } else f.part(GEO.plane, pmat, 0, 0, 0.004, w, h, 1, [1, 1, 1], { uv: [u, vv, uw, vh], ov: ov });
  });
  pmat.map.needsUpdate = true;
}
function kidDrawing(g, w, h, rnd) {
  g.lineWidth = 3; g.lineCap = 'round';
  var cols = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#111'];
  g.strokeStyle = '#43a047'; g.beginPath(); g.moveTo(0, h - 15); g.lineTo(w, h - 15); g.stroke();
  for (var i = 0; i < 4; i++) { var x = 30 + i * 50, hh = 40 + rnd() * 15; g.strokeStyle = cols[i % 4]; g.beginPath(); g.arc(x, h - 15 - hh, 9, 0, TAU); g.moveTo(x, h - 15 - hh + 9); g.lineTo(x, h - 35); g.lineTo(x - 8, h - 15); g.moveTo(x, h - 35); g.lineTo(x + 8, h - 15); g.moveTo(x - 10, h - 15 - hh + 22); g.lineTo(x + 10, h - 15 - hh + 22); g.stroke(); }
  // tall owl shape with black eyes
  g.fillStyle = '#5d4037'; g.beginPath(); g.ellipse(w - 40, h - 60, 24, 45, 0, 0, TAU); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.arc(w - 48, h - 82, 7, 0, TAU); g.arc(w - 32, h - 82, 7, 0, TAU); g.fill();
  g.font = '14px "Special Elite", monospace'; g.fillStyle = '#111'; g.textAlign = 'left'; g.fillText(rnd() < 0.5 ? 'MY CLASS' : 'ME AND MY FRENDS', 8, 16);
}


// ===== 10_render.js =====
// ---- renderer, post-processing, quality -------------------------------------
var RENDER = { renderer: null, scene: null, camera: null, rt: null, post: null, postScene: null, postCam: null, scale: 0.75, dpr: 1, w: 1, h: 1, fpsAvg: 60, autoTimer: 0, quality: 'MEDIUM' };
var POSTU = null;

function initRenderer() {
  var r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
  r.outputEncoding = THREE.sRGBEncoding;
  r.setClearColor(0x000000, 1);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; r.shadowMap.autoUpdate = true;
  CANVAS_HOST.appendChild(r.domElement);
  RENDER.renderer = r;
  MAX_ANISO = r.capabilities.getMaxAnisotropy ? r.capabilities.getMaxAnisotropy() : 1;
  RENDER.scene = new THREE.Scene();
  RENDER.camera = new THREE.PerspectiveCamera(70, 1, 0.07, 220);
  RENDER.scene.add(RENDER.camera);
  POSTU = {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uVHS: { value: 0 }, uFear: { value: 0 },
    uGrain: { value: 0.05 }, uAberr: { value: 0.6 }, uTrack: { value: 0 }, uFlash: { value: 0 }, uBlack: { value: 0 }, uTint: { value: 0 },
    uDesat: { value: 0 }, uExposure: { value: 1 }, tFace: { value: null }, uFace: { value: 0 }, uFaceZoom: { value: 1 }, uFaceShake: { value: new THREE.Vector2() },
    uInvert: { value: 0 }, uAspect: { value: 1 }, uGlitch: { value: 0 }, uRed: { value: 0 }, uWarm: { value: 0 }, uLowHP: { value: 0 }
  };
  var post = new THREE.ShaderMaterial({ uniforms: POSTU, vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false, depthWrite: false });
  RENDER.postScene = new THREE.Scene();
  RENDER.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false;
  RENDER.postScene.add(quad);
  RENDER.post = post;
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', function () { setTimeout(onResize, 200); });
  applyQuality(SAVE.settings.quality);
  onResize();
}
function applyQuality(q) {
  RENDER.quality = q;
  var r = RENDER.renderer;
  if (q === 'LOW') { RENDER.scale = 0.5; r.shadowMap.enabled = false; }
  else if (q === 'MEDIUM') { RENDER.scale = 0.72; r.shadowMap.enabled = false; }
  else if (q === 'HIGH') { RENDER.scale = 1.0; r.shadowMap.enabled = true; }
  else { RENDER.scale = 0.72; r.shadowMap.enabled = !isMobile(); } // AUTO
  if (PLAYER_LIGHT.spot) { PLAYER_LIGHT.spot.castShadow = r.shadowMap.enabled; }
  RENDER.scene.traverse(function (o) { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
  onResize();
}
function isMobile() { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); }
function onResize() {
  var r = RENDER.renderer; if (!r) return;
  var w = ROOT.clientWidth || window.innerWidth, h = ROOT.clientHeight || window.innerHeight;
  RENDER.w = w; RENDER.h = h;
  RENDER.dpr = Math.min(window.devicePixelRatio || 1, 2);
  r.setPixelRatio(1);
  var pw = Math.max(1, Math.round(w * RENDER.dpr)), ph = Math.max(1, Math.round(h * RENDER.dpr));
  r.setSize(pw, ph, false);
  r.domElement.style.width = w + 'px'; r.domElement.style.height = h + 'px';
  var sw = Math.max(1, Math.round(pw * RENDER.scale)), sh = Math.max(1, Math.round(ph * RENDER.scale));
  if (!RENDER.rt) {
    RENDER.rt = new THREE.WebGLRenderTarget(sw, sh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false });
    RENDER.rt.texture.encoding = THREE.sRGBEncoding;
    try { RENDER.rt.depthTexture = new THREE.DepthTexture(sw, sh); RENDER.rt.depthTexture.type = THREE.UnsignedIntType; } catch (e) {}
    RENDER.rt.texture.generateMipmaps = false;
  } else RENDER.rt.setSize(sw, sh);
  POSTU.uRes.value.set(sw, sh);
  POSTU.uAspect.value = w / h;
  RENDER.camera.aspect = w / h;
  RENDER.camera.fov = w / h < 0.7 ? 78 : 68; // portrait phones need a wider view
  RENDER.camera.updateProjectionMatrix();
  if (typeof layoutUI === 'function') layoutUI();
}
function renderFrame(scene, camera) {
  var r = RENDER.renderer;
  POSTU.tDiffuse.value = RENDER.rt.texture;
  r.setRenderTarget(RENDER.rt);
  r.render(scene || RENDER.scene, camera || RENDER.camera);
  r.setRenderTarget(null);
  r.render(RENDER.postScene, RENDER.postCam);
}
// adaptive resolution (AUTO)
function adaptQuality(dt) {
  var fps = 1 / Math.max(dt, 0.001);
  RENDER.fpsAvg = lerp(RENDER.fpsAvg, fps, 0.05);
  if (RENDER.quality !== 'AUTO') return;
  RENDER.autoTimer += dt;
  if (RENDER.autoTimer < 2.5) return;
  RENDER.autoTimer = 0;
  var s = RENDER.scale;
  if (RENDER.fpsAvg < 32 && s > 0.45) s = Math.max(0.45, s - 0.1);
  else if (RENDER.fpsAvg > 56 && s < 0.9) s = Math.min(0.9, s + 0.05);
  if (s !== RENDER.scale) { RENDER.scale = s; onResize(); }
}

var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var POST_FS = [
  'precision highp float;',
  'uniform sampler2D tDiffuse; uniform sampler2D tFace; uniform vec2 uRes; uniform float uTime;',
  'uniform float uVHS, uFear, uGrain, uAberr, uTrack, uFlash, uBlack, uTint, uDesat, uExposure, uFace, uFaceZoom, uInvert, uAspect, uGlitch, uRed, uWarm, uLowHP;',
  'uniform vec2 uFaceShake; varying vec2 vUv;',
  'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
  'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }',
  'vec3 sampleScene(vec2 uv, float ab){ vec3 c; c.r = texture2D(tDiffuse, uv + vec2(ab, 0.0)).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - vec2(ab, 0.0)).b; return c; }',
  'void main(){',
  '  vec2 uv = vUv; float t = uTime;',
  '  vec2 cc = uv - 0.5; float r2 = dot(cc, cc);',
  '  // fear: slow wobble + pull toward center',
  '  uv += uFear * 0.0045 * vec2(sin(uv.y * 22.0 + t * 2.3), cos(uv.x * 18.0 + t * 1.9));',
  '  uv = 0.5 + cc * (1.0 + (0.035 * uVHS + uFear * 0.07) * r2 - uFear * 0.015);',
  '  // VHS line jitter + tracking band',
  '  float ly = floor(uv.y * uRes.y * 0.5);',
  '  float jit = (hash(vec2(ly, floor(t * 30.0))) - 0.5) * 0.0018 * uVHS;',
  '  float bandY = fract(t * 0.09 + 0.3); float bd = abs(uv.y - bandY);',
  '  float band = (1.0 - smoothstep(0.0, 0.035 + uTrack * 0.05, bd)) * (0.25 * uVHS + uTrack);',
  '  uv.x += jit + band * (hash(vec2(ly, t)) - 0.3) * 0.03;',
  '  float gl = uGlitch * step(0.7, hash(vec2(floor(uv.y * 24.0), floor(t * 18.0))));',
  '  uv.x += gl * (hash(vec2(floor(uv.y * 24.0), t)) - 0.5) * 0.12;',
  '  float ab = uAberr * (0.0012 + r2 * 0.008) + uVHS * 0.0016 + gl * 0.01 + uFear * 0.003;',
  '  vec3 col = sampleScene(uv, ab);',
  '  // chroma bleed (VHS): smear color horizontally, keep luma sharp',
  '  if (uVHS > 0.01) { vec3 s1 = texture2D(tDiffuse, uv - vec2(0.004, 0.0)).rgb; vec3 s2 = texture2D(tDiffuse, uv - vec2(0.008, 0.0)).rgb;',
  '    float l0 = dot(col, vec3(0.299, 0.587, 0.114)); vec3 chroma = (col + s1 + s2) / 3.0; float lc = dot(chroma, vec3(0.299, 0.587, 0.114));',
  '    col = mix(col, chroma - lc + l0, 0.55 * uVHS); }',
  '  col *= uExposure;',
  '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
  '  col = mix(col, vec3(lum), uDesat);',
  '  col *= mix(vec3(1.0, 1.03, 0.95), vec3(0.82, 0.96, 1.16), uTint);',
  '  col = mix(col, col * vec3(1.12, 1.0, 0.85), uWarm);',
  '  // scanlines',
  '  col *= 1.0 - uVHS * 0.13 * (0.5 + 0.5 * sin(vUv.y * uRes.y * 1.6));',
  '  // tracking noise streaks',
  '  float streak = step(0.985 - band * 0.2, hash(vec2(floor(vUv.y * uRes.y * 0.35), floor(t * 20.0) + floor(vUv.x * 6.0))));',
  '  col += streak * (0.12 * uVHS + band * 0.6) * vec3(0.9, 0.95, 1.0);',
  '  // grain',
  '  float gr = hash(vUv * uRes + fract(t * 7.0) * 100.0) - 0.5;',
  '  col += gr * (uGrain + uVHS * 0.035 + uFear * 0.05);',
  '  // vignette (fear makes edges close in)',
  '  float v = length(cc * vec2(uAspect < 1.0 ? 1.0 : uAspect, uAspect < 1.0 ? 1.0 / uAspect * 0.7 : 1.0));',
  '  float vig = smoothstep(0.95 - uFear * 0.25, 0.25 - uFear * 0.1, v);',
  '  col *= mix(1.0, vig, 0.55 + uFear * 0.4);',
  '  col = mix(col, col * vec3(1.0, 0.3, 0.3), uRed * (1.0 - vig * 0.6));',
  '  col *= 1.0 - uLowHP * 0.5 * (1.0 - vig) * (0.6 + 0.4 * sin(t * 6.0));',
  '  // jumpscare face',
  '  if (uFace > 0.001) {',
  '    vec2 fu = (vUv - 0.5) * vec2(uAspect < 1.0 ? uAspect : 1.0, uAspect < 1.0 ? 1.0 : 1.0 / uAspect) / uFaceZoom + 0.5 + uFaceShake;',
  '    float fl = floor(fu.y * 40.0); float tear = step(0.8, hash(vec2(fl, floor(t * 25.0))));',
  '    fu.x += tear * (hash(vec2(fl, t)) - 0.5) * 0.08 * uFace;',
  '    float fab = 0.0015 + 0.009 * step(0.75, hash(vec2(floor(t * 30.0), 1.0)));',
  '    vec3 f; f.r = texture2D(tFace, fu + vec2(fab, 0.0)).r; f.g = texture2D(tFace, fu).g; f.b = texture2D(tFace, fu - vec2(fab, 0.0)).b;',
  '    float inb = step(0.0, fu.x) * step(fu.x, 1.0) * step(0.0, fu.y) * step(fu.y, 1.0);',
  '    float edge = smoothstep(0.0, 0.12, fu.y) * smoothstep(1.0, 0.88, fu.y) * smoothstep(0.0, 0.08, fu.x) * smoothstep(1.0, 0.92, fu.x);',
  '    f *= inb * edge; f = pow(f, vec3(0.9)) * 1.25;',
  '    f *= 0.85 + 0.3 * hash(vec2(floor(t * 40.0), 3.0));',
  '    f += (hash(vUv * uRes + t * 91.0) - 0.5) * 0.16;',
  '    f *= 1.0 - 0.12 * sin(vUv.y * uRes.y * 1.6);',
  '    f = mix(f, vec3(1.0) - f, uInvert);',
  '    f = mix(f, f * vec3(1.2, 0.7, 0.7), 0.3);',
  '    col = mix(col, f, clamp(uFace, 0.0, 1.0));',
  '  }',
  '  col = mix(col, vec3(1.0), uFlash);',
  '  col *= 1.0 - uBlack;',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

var PLAYER_LIGHT = { spot: null, target: null };


// ===== 11_input.js =====
// ---- input: touch (stick + look drag + buttons), keyboard, mouse -----------
var INPUT = {
  mx: 0, mz: 0, stickMag: 0, lookDX: 0, lookDY: 0,
  keys: {}, run: false, crouchToggle: false, breath: false,
  pressed: {}, // edge-triggered actions: interact, flash, item, crouch, pause, next
  stick: null, look: null, enabled: false, pointerLocked: false, lastTouchTime: 0
};
function press(a) { INPUT.pressed[a] = true; }
function consume(a) { var v = INPUT.pressed[a]; INPUT.pressed[a] = false; return !!v; }
function clearPressed() { INPUT.pressed = {}; INPUT.lookDX = 0; INPUT.lookDY = 0; }

function initInput() {
  var host = CANVAS_HOST;
  var stickEl = el('div', 'hp-stick', '<div class="knob"></div>', UI); stickEl.style.display = 'none';
  INPUT.stickEl = stickEl;
  host.addEventListener('pointerdown', function (e) {
    if (!INPUT.enabled) return;
    if (e.pointerType === 'mouse') {
      if (!INPUT.pointerLocked && host.requestPointerLock && !isTouchDevice()) { try { host.requestPointerLock(); } catch (er) {} }
      return;
    }
    INPUT.lastTouchTime = now();
    var w = RENDER.w, h = RENDER.h;
    var topSafe = uiTopSafe();
    if (e.clientX < w * 0.45 && e.clientY > topSafe && !INPUT.stick) {
      INPUT.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
      stickEl.style.display = 'block'; stickEl.style.left = (e.clientX - 60) + 'px'; stickEl.style.top = (e.clientY - 60) + 'px';
      stickEl.firstChild.style.transform = 'translate(0px,0px)';
    } else if (!INPUT.look) {
      INPUT.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
    try { host.setPointerCapture(e.pointerId); } catch (er) {}
    e.preventDefault();
  }, { passive: false });
  host.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') {
      if (INPUT.pointerLocked && INPUT.enabled) { INPUT.lookDX += e.movementX || 0; INPUT.lookDY += e.movementY || 0; }
      return;
    }
    var s = INPUT.stick;
    if (s && s.id === e.pointerId) {
      var dx = e.clientX - s.ox, dy = e.clientY - s.oy, d = Math.sqrt(dx * dx + dy * dy), R = 60;
      if (d > R * 1.6) { s.ox += dx * (1 - R * 1.6 / d); s.oy += dy * (1 - R * 1.6 / d); stickEl.style.left = (s.ox - 60) + 'px'; stickEl.style.top = (s.oy - 60) + 'px'; dx = e.clientX - s.ox; dy = e.clientY - s.oy; d = Math.sqrt(dx * dx + dy * dy); }
      var k = Math.min(1, d / R);
      INPUT.mx = d > 4 ? dx / d * k : 0; INPUT.mz = d > 4 ? dy / d * k : 0; INPUT.stickMag = k;
      var kx = Math.min(d, R) * (d ? dx / d : 0), ky = Math.min(d, R) * (d ? dy / d : 0);
      stickEl.firstChild.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
      stickEl.classList.toggle('run', k > 0.92);
    }
    var l = INPUT.look;
    if (l && l.id === e.pointerId) { INPUT.lookDX += (e.clientX - l.x) * 1.6; INPUT.lookDY += (e.clientY - l.y) * 1.6; l.x = e.clientX; l.y = e.clientY; }
  });
  var end = function (e) {
    if (INPUT.stick && INPUT.stick.id === e.pointerId) { INPUT.stick = null; INPUT.mx = INPUT.mz = 0; INPUT.stickMag = 0; stickEl.style.display = 'none'; }
    if (INPUT.look && INPUT.look.id === e.pointerId) INPUT.look = null;
  };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end); host.addEventListener('lostpointercapture', end);
  document.addEventListener('pointerlockchange', function () { INPUT.pointerLocked = document.pointerLockElement === host; });
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (!INPUT.keys[k]) {
      if (k === 'e' || k === 'enter') press('interact');
      if (k === 'f') press('flash');
      if (k === 'q') press('item');
      if (k === 'tab' || k === 'r') press('next');
      if (k === 'control' || k === 'c') press('crouch');
      if (k === 'escape' || k === 'p') press('pause');
      if (k >= '1' && k <= '9') press('slot' + k);
    }
    INPUT.keys[k] = true;
    if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { INPUT.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function () { INPUT.keys = {}; INPUT.breathBtn = false; });
}
function isTouchDevice() { return INPUT.lastTouchTime > 0 || ('ontouchstart' in window && navigator.maxTouchPoints > 0); }
function readMove() {
  var K = INPUT.keys, x = INPUT.mx, z = INPUT.mz, run = INPUT.stickMag > 0.92;
  var kx = (K['d'] || K['arrowright'] ? 1 : 0) - (K['a'] || K['arrowleft'] ? 1 : 0);
  var kz = (K['s'] || K['arrowdown'] ? 1 : 0) - (K['w'] || K['arrowup'] ? 1 : 0);
  if (kx || kz) { var l = Math.sqrt(kx * kx + kz * kz); x = kx / l; z = kz / l; run = !!K['shift']; if (!run) { x *= 0.75; z *= 0.75; } }
  return { x: x, z: z, mag: Math.min(1, Math.sqrt(x * x + z * z)), run: run, breath: !!(K[' '] || INPUT.breathBtn) };
}


// ===== 12_player.js =====
// ---- player controller ------------------------------------------------------
var PL = null;
var NOISES = []; // {li,x,z,r,t,src}
function emitNoise(li, x, z, r, src) { NOISES.push({ li: li, x: x, z: z, r: r, t: 0, src: src || 'misc' }); }

function newPlayer(li, x, z, yaw) {
  PL = {
    li: li, x: x, z: z, y: floorY(li, x, z), yaw: yaw || 0, pitch: 0, vx: 0, vz: 0,
    eye: 1.6, crouch: false, stamina: 1, battery: 100, flash: false, flashDead: 0,
    hidden: null, seated: null, breath: false, breathT: 0, breathCD: 0, coughT: 0,
    bob: 0, stepDist: 0, speed: 0, noise: 0, alive: true, lookTarget: null, inv: [], sel: 0,
    bandaid: 0, invuln: 0, lastSafe: { li: li, x: x, z: z }, shake: 0, fear: 0, hearts: 0, moving: false, running: false, exhausted: false
  };
  return PL;
}
var PR = 0.27; // player radius
function blockedAt(li, x, z, mode) {
  // test the circle against grid cells
  var r = PR;
  for (var k = 0; k < 8; k++) {
    var a = k / 8 * TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    if (!passable(li, m2c(px), m2r(pz), mode || 'p')) return { cx: m2c(px), cz: m2r(pz) };
  }
  if (!passable(li, m2c(x), m2r(z), mode || 'p')) return { cx: m2c(x), cz: m2r(z) };
  return null;
}
function doorAtCell(li, cx, cz) { if (!inGrid(cx, cz)) return null; var d = MAP.lv[li].door[cidx(cx, cz)]; return d >= 0 ? MAP.doors[d] : null; }

function updatePlayer(dt) {
  var P = PL;
  if (!P.alive) return;
  var sens = SAVE.settings.sens || 1;
  var lookScale = INPUT.pointerLocked ? 0.0022 : 0.0042;
  P.yaw -= INPUT.lookDX * lookScale * sens;
  P.pitch -= INPUT.lookDY * lookScale * sens * (SAVE.settings.invertY ? -1 : 1);
  INPUT.lookDX = 0; INPUT.lookDY = 0;
  var pmax = P.hidden ? 0.5 : 1.35;
  P.pitch = clamp(P.pitch, -pmax, pmax);
  if (P.hidden) {
    var h = P.hidden;
    var dy = angDiff(h.rot, P.yaw); var lim = h.type === 'locker' || h.type === 'stall' ? 0.55 : 0.9;
    if (Math.abs(dy) > lim) P.yaw = h.rot + clamp(dy, -lim, lim);
  }
  var mv = readMove();
  P.breath = mv.breath && (P.hidden || P.seated || true) && P.breathCD <= 0;
  updateBreath(dt, P);
  if (P.hidden || P.seated) { P.speed = 0; P.moving = false; P.running = false; updateFlashBattery(dt); return; }
  if (consume('crouch')) P.crouch = !P.crouch;
  var crouch = P.crouch || INPUT.keys['control'];
  var wantRun = mv.run && !crouch && P.stamina > 0.05 && !P.exhausted && mv.mag > 0.5;
  var spd = crouch ? 1.15 : (wantRun ? 4.4 : 2.2);
  if (P.limp) spd *= 0.75;
  var fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  var tx = (rx * mv.x - fx * mv.z) * spd, tz = (rz * mv.x - fz * mv.z) * spd;
  var acc = 1 - Math.exp(-dt * (mv.mag > 0.05 ? 12 : 9));
  P.vx += (tx - P.vx) * acc; P.vz += (tz - P.vz) * acc;
  P.running = wantRun && mv.mag > 0.5;
  if (P.running) P.stamina = Math.max(0, P.stamina - dt * 0.14);
  else P.stamina = Math.min(1, P.stamina + dt * (crouch ? 0.13 : (mv.mag > 0.1 ? 0.08 : 0.16)));
  if (P.stamina <= 0.01) P.exhausted = true; if (P.exhausted && P.stamina > 0.35) P.exhausted = false;
  // move with collision (axis separated)
  var nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
  var hitX = blockedAt(P.li, nx, P.z), hitZ = null;
  if (!hitX) P.x = nx; else { touchCell(P.li, hitX.cx, hitX.cz); P.vx *= 0.2; }
  hitZ = blockedAt(P.li, P.x, nz);
  if (!hitZ) P.z = nz; else { touchCell(P.li, hitZ.cx, hitZ.cz); P.vz *= 0.2; }
  var li2 = resolveLevel(P.li, P.x, P.z);
  if (li2 !== P.li) P.li = li2;
  var fy = floorY(P.li, P.x, P.z);
  P.y = damp(P.y, fy, 18, dt);
  var sp = Math.sqrt(P.vx * P.vx + P.vz * P.vz);
  P.speed = sp; P.moving = sp > 0.3;
  P.eye = damp(P.eye, crouch ? 0.95 : 1.6, 10, dt);
  // footsteps + noise
  P.bob += sp * dt * (P.running ? 1.55 : 1.9);
  P.stepDist += sp * dt;
  var stride = P.running ? 0.85 : (crouch ? 0.6 : 0.72);
  if (P.stepDist > stride) {
    P.stepDist = 0;
    var mat = MAP.lv[P.li].mat[cidx(m2c(P.x), m2r(P.z))];
    if (cellAt(P.li, P.x, P.z) === T_STAIR) mat = M_CONCRETE;
    var loud = P.running ? 1 : (crouch ? 0.18 : 0.45);
    if (typeof sfxStep === 'function') sfxStep(mat, loud, null);
    emitNoise(P.li, P.x, P.z, P.running ? 12 : (crouch ? 1.5 : 5), 'player');
  }
  P.noise = P.running ? 1 : (P.moving ? (crouch ? 0.12 : 0.4) : 0);
  var cell = cellType(P.li, m2c(P.x), m2r(P.z));
  if (cell !== T_STAIR) P.lastSafe = { li: P.li, x: P.x, z: P.z };
  updateFlashBattery(dt);
}
function updateFlashBattery(dt) {
  var P = PL;
  if (P.flashDead > 0) P.flashDead -= dt;
  if (P.flash) { P.battery = Math.max(0, P.battery - dt * 1.05); if (P.battery <= 0) { P.flash = false; if (typeof sfx === 'function') sfx('click'); showToast('BATTERY DEAD', '電池切れ'); } }
}
function updateBreath(dt, P) {
  if (P.breathCD > 0) P.breathCD -= dt;
  if (P.breath) {
    P.breathT += dt;
    if (P.breathT > 7.5) { // cough!
      P.breath = false; P.breathT = 0; P.breathCD = 3; P.coughT = 1.2;
      if (typeof sfx === 'function') sfx('cough');
      emitNoise(P.li, P.x, P.z, 9, 'cough');
      showToast('*COUGH*', '息が続かない！');
    }
  } else P.breathT = Math.max(0, P.breathT - dt * 2);
}
function toggleFlash() {
  var P = PL;
  if (P.flashDead > 0) { sfx('click'); return; }
  if (P.battery <= 0) { sfx('click'); showToast('NO BATTERY', '電池がない'); return; }
  P.flash = !P.flash; sfx('click');
  emitNoise(P.li, P.x, P.z, 1.5, 'click');
}
// bump into a door: open if unlocked
function touchCell(li, cx, cz) {
  var d = doorAtCell(li, cx, cz);
  if (!d) return;
  if (d.locked) {
    if (!d._rattle || now() - d._rattle > 1.2) { d._rattle = now(); sfx('rattle', { li: d.li, x: d.x, z: d.z }); showToast('LOCKED', 'カギがかかっている' + (hasItem('hallpass') ? '（ホールパスで開けられる）' : '')); emitNoise(li, d.x, d.z, 4, 'door'); }
    return;
  }
}
// called every frame for agents: push doors open when walking through
function updateDoors(dt, agents) {
  for (var i = 0; i < MAP.doors.length; i++) {
    var d = MAP.doors[i];
    if (!d.group) continue;
    if (!d.locked) {
      for (var k = 0; k < agents.length; k++) {
        var a = agents[k]; if (!a || a.li !== d.li) continue;
        var dd = dist2(a.x, a.z, d.x, d.z);
        if (dd < 1.6 * 1.6 && d.open < 1) { d.open = 1; if (d.anim < 0.2) { d.openDir = (d.axis === 'z' ? (a.z > d.z ? 1 : -1) : (a.x > d.x ? -1 : 1)); sfx(d.kind === 'double' ? 'doorBang' : 'door', { li: d.li, x: d.x, z: d.z }); emitNoise(d.li, d.x, d.z, 6, 'door'); } }
      }
    }
    var target = d.open;
    if (Math.abs(d.anim - target) > 0.001) { d.anim = damp(d.anim, target, d.anim < target ? 7 : 2, dt); applyDoorPose(d); }
  }
}
// treat doors with anim>0.5 as open for LOS


// ===== 13_rig.js =====
// ---- rig builder: rigid parts skinned to bones -> one SkinnedMesh ---------------
function Rig() { this.bones = []; this.byName = {}; this.parts = []; }
Rig.prototype.bone = function (name, parent, x, y, z) {
  var b = new THREE.Bone(); b.name = name; b.position.set(x, y, z);
  if (parent) this.byName[parent].add(b);
  b.userData.idx = this.bones.length; this.bones.push(b); this.byName[name] = b;
  return b;
};
// add a template part to a bone, local transform relative to bone
Rig.prototype.part = function (bone, tpl, lx, ly, lz, sx, sy, sz, col, rx, ry, rz) {
  this.parts.push({ bone: bone, tpl: tpl, m: [lx, ly, lz, sx, sy, sz, rx || 0, ry || 0, rz || 0], col: col });
};
// tapered limb from bone origin downward (length l, radii r0 at top, r1 at bottom)
Rig.prototype.limb = function (bone, l, r0, r1, col, dir) {
  var g = new THREE.CylinderGeometry(r0, r1, l, 8, 2);
  g.translate(0, (dir || -1) * l / 2, 0);
  this.parts.push({ bone: bone, geo: g, col: col });
};
Rig.prototype.build = function (mat) {
  var root = this.bones[0];
  root.updateMatrixWorld(true);
  var pos = [], nor = [], uv = [], col = [], si = [], sw = [], idx = [];
  var m4 = new THREE.Matrix4(), m3 = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3();
  var self = this;
  this.parts.forEach(function (p) {
    var b = self.byName[p.bone];
    var g = p.geo;
    var local = new THREE.Matrix4();
    if (!g) {
      g = p.tpl.clone ? p.tpl : null;
      var mm = p.m;
      local.compose(new THREE.Vector3(mm[0], mm[1], mm[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(mm[6], mm[7], mm[8])), new THREE.Vector3(mm[3], mm[4], mm[5]));
      g = p.tpl;
    }
    m4.multiplyMatrices(b.matrixWorld, local);
    m3.getNormalMatrix(m4);
    var P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    var base = pos.length / 3;
    for (var i = 0; i < P.count; i++) {
      v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(m4);
      n.set(N.getX(i), N.getY(i), N.getZ(i)).applyMatrix3(m3).normalize();
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0);
      col.push(p.col[0], p.col[1], p.col[2]);
      si.push(b.userData.idx, 0, 0, 0); sw.push(1, 0, 0, 0);
    }
    if (g.index) { var I = g.index.array; for (var k = 0; k < I.length; k++) idx.push(base + I[k]); }
    else for (var k2 = 0; k2 < P.count; k2++) idx.push(base + k2);
  });
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geo.setIndex(idx);
  var mesh = new THREE.SkinnedMesh(geo, mat);
  mesh.add(root);
  mesh.bind(new THREE.Skeleton(this.bones));
  mesh.frustumCulled = false; mesh.castShadow = true;
  this.mesh = mesh;
  this.rest = this.bones.map(function (b) { return b.rotation.clone(); });
  return mesh;
};
var GT = null; // shared template geometries for rigs
function rigTemplates() {
  if (GT) return GT;
  GT = { box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 12, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), cone: new THREE.ConeGeometry(1, 1, 8) };
  return GT;
}
// standard humanoid skeleton. p: proportions
function humanoidRig(p) {
  var R = new Rig(); var T = rigTemplates();
  var H = p.height || 1.7, s = H / 1.7;
  var hipY = 0.92 * s * (p.legLen || 1);
  R.bone('hips', null, 0, hipY, 0);
  R.bone('spine', 'hips', 0, 0.12 * s, 0);
  R.bone('chest', 'spine', 0, 0.24 * s, 0);
  R.bone('neck', 'chest', 0, 0.22 * s, 0);
  R.bone('head', 'neck', 0, 0.09 * s * (p.neckLen || 1), 0);
  var sw = 0.19 * s * (p.shoulder || 1);
  ['L', 'R'].forEach(function (sd, k) {
    var x = k === 0 ? sw : -sw;
    R.bone('sh' + sd, 'chest', x, 0.16 * s, 0);
    R.bone('ua' + sd, 'sh' + sd, 0, 0, 0);
    R.bone('fa' + sd, 'ua' + sd, 0, -0.28 * s * (p.armLen || 1), 0);
    R.bone('hand' + sd, 'fa' + sd, 0, -0.25 * s * (p.armLen || 1), 0);
    R.bone('th' + sd, 'hips', k === 0 ? 0.1 * s : -0.1 * s, -0.04 * s, 0);
    R.bone('sn' + sd, 'th' + sd, 0, -0.43 * s * (p.legLen || 1), 0);
    R.bone('ft' + sd, 'sn' + sd, 0, -0.43 * s * (p.legLen || 1), 0);
  });
  R.s = s; R.p = p;
  return R;
}
// dress a humanoid with simple clothing. c: colors {skin, shirt, pants, shoes, hair}
function dressHumanoid(R, c, o) {
  var T = rigTemplates(), s = R.s, p = R.p; o = o || {};
  var thin = p.thin || 1, al = p.armLen || 1, ll = p.legLen || 1;
  // torso
  R.part('hips', T.sph, 0, 0.0, 0, 0.17 * s * thin, 0.13 * s, 0.11 * s, c.pants);
  R.part('spine', T.sph, 0, 0.12 * s, 0, 0.15 * s * thin, 0.17 * s, 0.1 * s, c.shirt);
  R.part('chest', T.sph, 0, 0.07 * s, 0, 0.2 * s * thin * (p.shoulder || 1), 0.17 * s, 0.115 * s * (p.chestD || 1), c.shirt);
  ['L', 'R'].forEach(function (sd) { R.part('sh' + sd, T.sph, 0, 0, 0, 0.065 * s * thin, 0.06 * s, 0.06 * s, o.bareArms ? c.skin : c.shirt); });
  if (p.belly) R.part('spine', T.sph, 0, 0.1 * s, 0.06 * s, 0.17 * s, 0.16 * s, 0.14 * s, c.shirt);
  R.part('neck', T.cyl, 0, 0.06 * s, 0, 0.045 * s * thin, 0.16 * s * (p.neckLen || 1), 0.045 * s * thin, c.skin);
  if (o.skirt) R.part('hips', T.cone, 0, -0.12 * s, 0, 0.24 * s, 0.38 * s, 0.2 * s, c.pants, PI);
  if (o.gown) R.part('hips', T.cone, 0, -0.35 * s, 0, 0.28 * s * thin, 1.0 * s, 0.22 * s, c.shirt, PI);
  ['L', 'R'].forEach(function (sd) {
    R.limb('ua' + sd, 0.28 * s * al, 0.055 * s * thin, 0.045 * s * thin, o.shortSleeve ? c.skin : c.shirt);
    if (o.shortSleeve) R.part('ua' + sd, T.cyl, 0, -0.06 * s, 0, 0.06 * s * thin, 0.12 * s, 0.06 * s * thin, c.shirt);
    R.limb('fa' + sd, 0.25 * s * al, 0.045 * s * thin, 0.035 * s * thin, o.longSleeve === false ? c.skin : (o.bareArms ? c.skin : c.shirt));
    if (o.claws) { for (var f = 0; f < 4; f++) R.part('hand' + sd, T.box, (f - 1.5) * 0.018 * s, -0.09 * s, 0, 0.008 * s, 0.16 * s, 0.01 * s, c.skin, 0, 0, (f - 1.5) * 0.06); R.part('hand' + sd, T.box, 0, -0.03 * s, 0, 0.07 * s, 0.07 * s, 0.03 * s, c.skin); }
    else R.part('hand' + sd, T.box, 0, -0.05 * s, 0, 0.07 * s, 0.1 * s, 0.03 * s, o.gloves ? c.gloves : c.skin);
    var legCol = o.bareLegs ? c.skin : c.pants;
    R.limb('th' + sd, 0.43 * s * ll, 0.075 * s * thin, 0.055 * s * thin, o.skirt ? c.skin : legCol);
    R.limb('sn' + sd, 0.43 * s * ll, 0.055 * s * thin, 0.04 * s * thin, o.skirt || o.bareLegs ? c.skin : legCol);
    if (o.barefoot) R.part('ft' + sd, T.box, 0, -0.02 * s, 0.05 * s, 0.07 * s, 0.04 * s, 0.2 * s, c.skin);
    else R.part('ft' + sd, T.box, 0, -0.03 * s, 0.05 * s, 0.09 * s, 0.07 * s, 0.25 * s, c.shoes);
  });
}

// ---- simple procedural humans (NPC students) ------------------------------------
var NPC_NAMES = [
  ['Dale', 'm', 62], ['Rosa', 'f', 58], ['Tyrell', 'm', 19], ['Mrs. Kowalski', 'f', 74], ['Jun', 'm', 33], ['Amara', 'f', 27], ['Earl', 'm', 68], ['Lupe', 'f', 45],
  ['Vince', 'm', 22], ['Priya', 'f', 31], ['Otis', 'm', 51], ['Hannah', 'f', 24], ['Mateo', 'm', 38], ['Gloria', 'f', 66], ['Kenji', 'm', 47], ['Shay', 'f', 20],
  ['Walt', 'm', 79], ['Nadia', 'f', 36], ['Bo', 'm', 29], ['Ruthie', 'f', 55], ['Marcus', 'm', 41], ['Ingrid', 'f', 60], ['Ray', 'm', 18], ['Fatima', 'f', 34]
];
var SKIN_TONES = [[0.96, 0.8, 0.68], [0.88, 0.68, 0.52], [0.72, 0.52, 0.36], [0.52, 0.36, 0.24], [0.36, 0.24, 0.16], [0.92, 0.76, 0.6]];
var HAIR_COLS = [[0.08, 0.06, 0.05], [0.3, 0.18, 0.1], [0.55, 0.4, 0.22], [0.8, 0.65, 0.4], [0.12, 0.1, 0.1], [0.6, 0.15, 0.08]];
function makeLook(rnd, nameEntry) {
  var age = nameEntry[2], female = nameEntry[1] === 'f';
  var look = {
    skin: rnd.pick(SKIN_TONES), hair: age > 58 ? [0.78, 0.78, 0.76] : rnd.pick(HAIR_COLS),
    shirt: [rnd.range(0.15, 0.85), rnd.range(0.15, 0.7), rnd.range(0.15, 0.7)], pants: rnd.pick([[0.18, 0.22, 0.35], [0.25, 0.22, 0.2], [0.4, 0.38, 0.34], [0.12, 0.12, 0.14]]),
    hairStyle: age > 58 && !female ? 3 : (female ? rnd.pick([1, 1, 0, 2]) : rnd.pick([0, 0, 2, 3])), glasses: rnd() < (age > 45 ? 0.5 : 0.2),
    height: (female ? 1.6 : 1.74) + rnd.range(-0.08, 0.08) - (age > 70 ? 0.06 : 0), belly: !female && rnd() < 0.35 && age > 30, female: female, age: age, hat: !female && rnd() < 0.2
  };
  return look;
}
function faceCanvas(look, mood) {
  var c = mkCanvas(128, 128), g = c.getContext('2d');
  g.fillStyle = rgbs(look.skin); g.fillRect(0, 0, 128, 128);
  var dk = [look.skin[0] * 0.7, look.skin[1] * 0.62, look.skin[2] * 0.6];
  // brows / eyes / mouth (front is u=0.5)
  g.fillStyle = rgbs(look.hair); g.fillRect(44, 48, 14, 3); g.fillRect(70, 48, 14, 3);
  g.fillStyle = '#f4f2ea'; g.fillRect(46, 55, 11, 7); g.fillRect(71, 55, 11, 7);
  g.fillStyle = '#2a1a10'; g.fillRect(50, 55, 5, 7); g.fillRect(74, 55, 5, 7);
  g.fillStyle = rgbs(dk); g.fillRect(61, 62, 6, 14);
  g.fillStyle = mood === 'scared' ? '#3a1010' : 'rgb(140,70,60)'; if (mood === 'scared') g.fillRect(56, 84, 16, 9); else g.fillRect(55, 86, 18, 3);
  if (look.age > 50) { g.strokeStyle = rgbs(dk); g.lineWidth = 1; g.beginPath(); g.moveTo(42, 66); g.lineTo(46, 70); g.moveTo(86, 66); g.lineTo(82, 70); g.moveTo(52, 84); g.lineTo(50, 90); g.moveTo(76, 84); g.lineTo(78, 90); g.stroke(); }
  if (look.glasses) { g.strokeStyle = '#222'; g.lineWidth = 2; g.strokeRect(43, 52, 17, 13); g.strokeRect(68, 52, 17, 13); g.beginPath(); g.moveTo(60, 57); g.lineTo(68, 57); g.stroke(); }
  // hair region on top/back
  g.fillStyle = rgbs(look.hair);
  if (look.hairStyle !== 3) g.fillRect(0, 0, 128, look.hairStyle === 2 ? 30 : 40);
  else g.fillRect(0, 0, 128, 18);
  g.fillRect(0, 0, 30, 128); g.fillRect(98, 0, 30, 128);
  return c;
}
function buildHumanNPC(look, seed) {
  var R = humanoidRig({ height: look.height, thin: look.female ? 0.9 : 1.0, shoulder: look.female ? 0.88 : 1.0, belly: look.belly });
  var c = { skin: look.skin, shirt: look.shirt, pants: look.pants, shoes: [0.12, 0.1, 0.09] };
  dressHumanoid(R, c, { skirt: look.female && seed % 3 === 0 });
  var T = rigTemplates(), s = R.s;
  // hair volume
  if (look.hairStyle === 1) { R.part('head', T.sph, 0, 0.06 * s, -0.035 * s, 0.112 * s, 0.17 * s, 0.1 * s, look.hair); }
  if (look.hairStyle === 0 || look.hairStyle === 2) R.part('head', T.sph, 0, 0.16 * s, -0.01 * s, 0.103 * s, 0.07 * s, 0.11 * s, look.hair);
  if (look.hat) R.part('head', T.cyl, 0, 0.21 * s, 0, 0.13 * s, 0.06 * s, 0.13 * s, [0.2, 0.25, 0.5]);
  var mat = bakeMat({ vertexColors: true, shininess: 12, specular: new THREE.Color(0.08, 0.08, 0.08), skinning: true }, 'probe');
  var body = R.build(mat);
  // head with painted face
  var ft = toTex(faceCanvas(look, 'calm'), { clamp: false });
  var hm = bakeMat({ map: ft, shininess: 20, specular: new THREE.Color(0.1, 0.1, 0.1) }, 'probe');
  var hg = new THREE.SphereGeometry(0.115 * s, 16, 12); hg.scale(0.85, 1.05, 0.95); hg.rotateY(-PI / 2);
  var head = new THREE.Mesh(hg, hm); head.position.y = 0.12 * s; head.castShadow = true;
  R.byName.head.add(head);
  var root = new THREE.Group(); root.add(body);
  return { root: root, rig: R, mats: [mat, hm], faceTex: ft, look: look, head: head };
}

// ---- face head for monsters (projected face image + relief + jaw) ------------
var FACE_TEX = []; // preloaded face textures, index 1..40
function makeFaceHead(def, radius) {
  var R0 = radius || 0.13;
  var g = new THREE.SphereGeometry(1, 48, 36);
  var P = g.attributes.position, n = P.count;
  var uvA = new Float32Array(n * 2), jaw = new Float32Array(n);
  var cx = def.cx, cy = def.cy, rx = def.rx, ry = def.ry;
  function toHead(u, vImg) { return [(u - cx) * 0.74 / rx, (cy - vImg) * 0.86 / ry]; }
  var lm = { eyes: def.eyes.map(function (e) { return toHead(e[0], e[1]); }), nose: toHead(def.nose[0], def.nose[1]), mouth: toHead(def.mouth[0], def.mouth[1]) };
  function gs(x, y, px, py, sx, sy) { var dx = (x - px) / sx, dy = (y - py) / (sy || sx); return Math.exp(-(dx * dx + dy * dy)); }
  var v = new THREE.Vector3();
  for (var i = 0; i < n; i++) {
    v.set(P.getX(i), P.getY(i), P.getZ(i));
    var X = v.x, Y = v.y, Z = v.z;
    var u = cx + X * rx / 0.74, vi = cy - Y * ry / 0.86;
    uvA[i * 2] = u; uvA[i * 2 + 1] = 1 - vi;
    var front = smooth((Z - 0.05) / 0.5);
    var d = 0;
    d += gs(X, Y, lm.nose[0], lm.nose[1] - 0.05, 0.13, 0.2) * 0.2 * (def.noseAmt != null ? def.noseAmt : 1);
    lm.eyes.forEach(function (e) { d -= gs(X, Y, e[0], e[1], 0.16, 0.12) * 0.1; d += gs(X, Y, e[0], e[1] + 0.17, 0.2, 0.07) * 0.05; d += gs(X, Y, e[0] * 1.25, e[1] - 0.2, 0.14, 0.1) * 0.04; });
    var mw = def.mouthW || 0.25, mh = def.mouthH || 0.12;
    d -= gs(X, Y, lm.mouth[0], lm.mouth[1], mw, mh) * (def.mouthDepth || 0.12);
    d += gs(X, Y, lm.mouth[0], lm.mouth[1] - 0.28, 0.2, 0.1) * 0.04;
    var k = 1 + d * front;
    // head shape: flattened face, longer back, narrow jaw
    var sx = 0.86 - (Y < -0.3 ? (-Y - 0.3) * 0.25 : 0), sy = 1.12, sz = Z > 0 ? 0.92 : 1.02;
    P.setXYZ(i, X * k * sx * R0, Y * k * sy * R0, Z * (Z > 0 ? (1 + d * front * 0.6) : 1) * sz * R0);
    var jw = smooth((lm.mouth[1] + 0.05 - Y) / 0.25) * smooth((Z + 0.2) / 0.5) * (1 - smooth((Math.abs(X) - 0.45) / 0.3));
    jaw[i] = jw;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uvA, 2));
  g.setAttribute('aJaw', new THREE.BufferAttribute(jaw, 1));
  g.computeVertexNormals();
  var U = { uJaw: { value: 0 }, uFC: { value: new THREE.Vector2(cx, cy) }, uFR: { value: new THREE.Vector2(rx * 1.05, ry * 1.0) }, uEdge: { value: new THREE.Color(def.edge[0], def.edge[1], def.edge[2]) }, uGlow: { value: def.glow || 0.35 }, uR: { value: R0 }, uTwitch: { value: 0 } };
  var mat = bakeMat({ map: FACE_TEX[def.img], shininess: 40, specular: new THREE.Color(0.25, 0.22, 0.22) }, 'probe', {
    key: 'face',
    uniforms: U,
    vdecl: 'attribute float aJaw; uniform float uJaw; uniform float uR; uniform float uTwitch; varying float vFront;\n',
    vbody: 'transformed.y -= uJaw * aJaw * uR * 0.95; transformed.z -= uJaw * aJaw * uR * 0.18; transformed.x *= 1.0 + uJaw * aJaw * 0.12;\n transformed.x += uTwitch * sin(position.y * 80.0 + uTime * 60.0) * uR * 0.03;\n vFront = smoothstep(-0.1, 0.55, normalize(position).z);\n',
    fdecl: 'uniform vec2 uFC; uniform vec2 uFR; uniform vec3 uEdge; uniform float uGlow; uniform float uJaw; varying float vFront;\n',
    fmap: 'vec4 fcol = mapTexelToLinear(texture2D(map, vUv));\n vec2 dd = (vec2(vUv.x, 1.0 - vUv.y) - uFC) / uFR; float fd = length(dd);\n float fm = (1.0 - smoothstep(0.6, 1.0, fd)) * vFront;\n vec3 edgeC = uEdge * (0.75 + 0.5 * fract(sin(dot(floor(vUv * 60.0), vec2(12.9898, 78.233))) * 43758.5453) * 0.4);\n diffuseColor.rgb *= mix(edgeC, fcol.rgb, fm);\n float flum = dot(fcol.rgb, vec3(0.3, 0.59, 0.11));\n',
    fbody: 'reflectedLight.indirectDiffuse += diffuseColor.rgb * uGlow * smoothstep(0.35, 0.9, flum) * fm;\n'
  });
  var mesh = new THREE.Mesh(g, mat); mesh.castShadow = true;
  mesh.userData.U = U;
  return mesh;
}
// hanging hair strips
var HAIR_TEX = null;
function makeHair(R0, opt) {
  if (!HAIR_TEX) { HAIR_TEX = toTex(texHair(59, [10, 9, 9]), { clamp: true }); }
  opt = opt || {};
  var rnd = makeRNG(opt.seed || 5), N = opt.count || 140, seg = 7;
  var pos = [], uv = [], sway = [], idx = [];
  for (var s = 0; s < N; s++) {
    // root on scalp
    var th, ph, front = s < (opt.fringe || 0);
    if (front) { th = rnd.range(-0.9, 0.9); ph = rnd.range(0.2, 0.55); }
    else { th = rnd.range(0, TAU); ph = rnd.range(0.05, 1.25); if (Math.cos(th) > 0.55 && ph > 0.55) ph = rnd.range(0.05, 0.4); }
    // direction: th around Y (0 = front +z), ph from top
    var dx = Math.sin(ph) * Math.sin(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.cos(th);
    var rx = dx * R0 * 1.03, ry = dy * R0 * 1.08, rz = dz * R0 * 0.98;
    var L = (opt.len || 0.6) * rnd.range(0.6, 1.1) * (front ? (opt.fringeLen || 0.7) : 1);
    var w = rnd.range(0.025, 0.055);
    var tx = Math.cos(th), tz = -Math.sin(th); // tangent around head
    var base = pos.length / 3, phase = rnd() * TAU;
    for (var k = 0; k <= seg; k++) {
      var t = k / seg;
      var out = R0 * (0.15 + t * 0.15) * (front ? 0.6 : 1);
      var px = rx + dx * out * t * 2, pz = rz + dz * out * t * 2 + (front ? 0.02 * t : 0), py = ry - L * t * t * 0.4 - L * t * 0.6 + (dy > 0.6 ? R0 * 0.2 * t * (1 - t) : 0);
      if (front) { pz = rz + 0.015 + t * 0.03; px = rx + (rnd() - 0.5) * 0.01; }
      var ww = w * (1 - t * 0.5);
      pos.push(px - tx * ww, py, pz - tz * ww, px + tx * ww, py, pz + tz * ww);
      uv.push(0, 1 - t, 1, 1 - t);
      sway.push(phase, t, phase, t);
      if (k < seg) { var a = base + k * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 2)); g.setIndex(idx); g.computeVertexNormals();
  var U = { uWind: { value: 0.3 } };
  var mat = bakeMat({ map: HAIR_TEX, color: new THREE.Color(opt.col || 0x0b0a0a), alphaTest: 0.35, side: THREE.DoubleSide, shininess: 50, specular: new THREE.Color(0.15, 0.15, 0.17), transparent: false }, 'probe', {
    key: 'hair', uniforms: U,
    vdecl: 'attribute vec2 aSway; uniform float uWind;\n',
    vbody: 'float sw = aSway.y * aSway.y; transformed.x += sin(uTime * 1.7 + aSway.x) * sw * 0.03 * (1.0 + uWind * 3.0); transformed.z += cos(uTime * 1.3 + aSway.x * 1.7) * sw * 0.02 * (1.0 + uWind * 3.0);\n'
  });
  var m = new THREE.Mesh(g, mat); m.userData.U = U; m.castShadow = true;
  return m;
}


// ===== 14_monsters.js =====
// ---- monsters: definitions, models, animation, AI -------------------------
var FACE_DEFS = {
  student0: { img: 8, cx: 0.54, cy: 0.58, rx: 0.27, ry: 0.44, eyes: [[0.37, 0.45], [0.70, 0.45]], nose: [0.55, 0.64], mouth: [0.53, 0.84], mouthW: 0.2, edge: [0.025, 0.025, 0.03], glow: 0.45 },
  crawler: { img: 27, cx: 0.52, cy: 0.5, rx: 0.3, ry: 0.42, eyes: [[0.39, 0.46], [0.64, 0.46]], nose: [0.53, 0.56], mouth: [0.52, 0.74], mouthW: 0.24, mouthDepth: 0.2, edge: [0.3, 0.29, 0.26], glow: 0.5 },
  gaper: { img: 2, cx: 0.53, cy: 0.52, rx: 0.38, ry: 0.48, eyes: [[0.31, 0.33], [0.75, 0.37]], nose: [0.52, 0.52], mouth: [0.52, 0.82], mouthW: 0.45, mouthH: 0.22, mouthDepth: 0.3, edge: [0.04, 0.04, 0.045], glow: 0.4 },
  smiles: { img: 29, cx: 0.52, cy: 0.56, rx: 0.45, ry: 0.5, eyes: [[0.32, 0.5], [0.73, 0.5]], nose: [0.53, 0.63], mouth: [0.53, 0.8], mouthW: 0.3, mouthDepth: 0.04, noseAmt: 0.6, edge: [0.08, 0.08, 0.075], glow: 0.55 },
  static: { img: 10, cx: 0.55, cy: 0.46, rx: 0.32, ry: 0.44, eyes: [[0.36, 0.38], [0.66, 0.36]], nose: [0.56, 0.6], mouth: [0.55, 0.72], mouthW: 0.2, edge: [0.01, 0.01, 0.02], glow: 0.9 },
  hoots: { img: 40, cx: 0.52, cy: 0.55, rx: 0.46, ry: 0.5, eyes: [[0.36, 0.26], [0.75, 0.44]], nose: [0.55, 0.5], mouth: [0.33, 0.85], mouthW: 0.3, mouthH: 0.2, mouthDepth: 0.28, edge: [0.07, 0.07, 0.07], glow: 0.5 }
};
var MONSTER_INFO = {
  student0: { name: 'STUDENT #0', ja: '生徒ゼロ番', file: 'SUBJECT #0 — STATUS: ENROLLED', fileJa: '被験者#0 ― 在籍中', desc: 'First test subject of PROJECT LULLABY (1990). Did not take a seat when the bell rang. Still waiting in the halls. DO NOT MAINTAIN EYE CONTACT.', descJa: 'PROJECT LULLABYの最初の被験者（1990年）。ベルが鳴っても席に着かなかった。今も廊下で待っている。目を合わせ続けてはいけない。', tip: 'Don\'t stare. Look away and break line of sight.', tipJa: '見つめない。目をそらして視界から外れること。' },
  crawler: { name: 'THE CRAWLER', ja: 'クローラー', file: 'SUBJECT #4 — STATUS: CRAWLING', fileJa: '被験者#4 ― 這行中', desc: 'Blind. Moves along ceilings. Hunts by sound alone. Former hall monitor (1991). Sensitive hearing reported by staff.', descJa: '目が見えない。天井を這う。音だけで獲物を探す。元・廊下当番（1991年）。', tip: 'Crouch-walk. Throw chalk to lure it away.', tipJa: 'しゃがんで歩く。チョークを投げて気をそらす。' },
  gaper: { name: 'THE GAPER', ja: 'ゲイパー', file: 'SUBJECT #9 — STATUS: SCREAMING', fileJa: '被験者#9 ― 絶叫中', desc: 'Black hollow eyes, split mouth. Its scream disrupts electrical equipment and calls the others.', descJa: '黒い穴の目と裂けた口。叫び声は電気機器を狂わせ、他の者を呼び寄せる。', tip: 'If it sees you, it screams: your flashlight dies. Hide fast.', tipJa: '見つかると叫ぶ。懐中電灯が消える。すぐ隠れろ。' },
  smiles: { name: 'MR. SMILES', ja: 'ミスター・スマイルズ', file: 'STAFF #12 — STATUS: ON DUTY', fileJa: '職員#12 ― 勤務中', desc: 'Night janitor. Always smiling. Staff note: "He only works when no one is watching."', descJa: '夜の用務員。いつも笑顔。職員メモ「誰も見ていない時だけ働く」。', tip: 'He moves only when you are not looking. Keep him in your light.', tipJa: '見ていない時だけ動く。ライトで照らし続けろ。' },
  static: { name: 'STATIC', ja: 'スタティック', file: 'TAPE #0 — STATUS: BROADCASTING', fileJa: 'テープ#0 ― 放送中', desc: 'Something recorded onto the master tape of Episode 0. Emerges from CRT screens. The picture gets worse when it is near.', descJa: '第0話のマスターテープに記録された何か。ブラウン管から出てくる。近いほど映像が乱れる。', tip: 'Stay away from switched-on TVs.', tipJa: '点いたテレビに近づかない。' },
  hoots: { name: 'PROFESSOR HOOTS', ja: 'プロフェッサー・フーツ', file: 'MASCOT #1 — STATUS: NEVER REMOVED', fileJa: 'マスコット#1 ― 一度も脱がれていない', desc: 'The suit must never be removed during broadcast. It has not been removed since 1993. Performer: unknown.', descJa: '放送中は着ぐるみを脱いではならない。1993年から一度も脱がれていない。中の人：不明。', tip: 'Hears well, sees well. Hide and hold your breath.', tipJa: '耳も目もいい。隠れて息を止めろ。' }
};
var MONSTERS = [];
var SKIN_CACHE = {};
function skinMat(key, base, opt) {
  var t = SKIN_CACHE[key] || (SKIN_CACHE[key] = toTex(texSkin(base, key.length * 13, opt)));
  return bakeMat({ map: t, vertexColors: true, shininess: 60, specular: new THREE.Color(0.25, 0.22, 0.2), skinning: true }, 'probe');
}

function buildMonsterModel(type) {
  var root = new THREE.Group(), R, mats = [], head = null, hair = null, extra = {};
  var T = rigTemplates();
  var def = FACE_DEFS[type];
  if (type === 'student0') {
    R = humanoidRig({ height: 1.62, thin: 0.72, shoulder: 0.85, armLen: 1.12, neckLen: 1.3 });
    var sk = [0.62, 0.64, 0.68];
    dressHumanoid(R, { skin: sk, shirt: [0.12, 0.13, 0.2], pants: [0.25, 0.25, 0.27], shoes: [0.1, 0.1, 0.1] }, { skirt: true, barefoot: true });
    R.part('chest', T.box, 0, 0.17 * R.s, 0.09 * R.s, 0.16 * R.s, 0.05 * R.s, 0.02, [0.85, 0.85, 0.8]); // collar
    var m = skinMat('s0skin', [170, 172, 182], { veins: 16, veinCol: '70,50,90', sores: 4, blood: 6 });
    mats.push(m); root.add(R.build(m));
    head = makeFaceHead(def, 0.145); head.position.set(0, 0.14 * R.s, 0.01);
    R.byName.head.add(head);
    hair = makeHair(0.145, { count: 220, len: 0.85, fringe: 26, fringeLen: 0.55, seed: 8 }); hair.position.copy(head.position); R.byName.head.add(hair);
  } else if (type === 'crawler') {
    R = humanoidRig({ height: 1.8, thin: 0.6, shoulder: 0.9, armLen: 1.5, legLen: 1.15, neckLen: 1.6 });
    var sk2 = [0.55, 0.57, 0.5];
    dressHumanoid(R, { skin: sk2, shirt: sk2, pants: [0.4, 0.38, 0.33], shoes: sk2 }, { barefoot: true, bareArms: true, claws: true });
    // ribs
    for (var rb = 0; rb < 5; rb++) R.part('chest', T.box, 0, 0.0 + rb * 0.04, 0.1 * R.s, 0.3 * R.s * 0.6, 0.012, 0.03, [0.7, 0.7, 0.62]);
    var m2 = skinMat('crawlskin', [150, 158, 140], { veins: 30, veinCol: '50,60,40', sores: 14, blood: 4 });
    mats.push(m2); root.add(R.build(m2));
    head = makeFaceHead(def, 0.155); head.position.set(0, 0.14 * R.s, 0.02); R.byName.head.add(head);
  } else if (type === 'gaper') {
    R = humanoidRig({ height: 2.15, thin: 0.62, shoulder: 0.9, armLen: 1.35, neckLen: 1.8 });
    var sk3 = [0.78, 0.78, 0.76];
    dressHumanoid(R, { skin: sk3, shirt: [0.6, 0.58, 0.52], pants: [0.6, 0.58, 0.52], shoes: sk3 }, { gown: true, barefoot: true, claws: true, longSleeve: false, bareArms: true });
    var m3 = skinMat('gapeskin', [200, 200, 196], { veins: 22, veinCol: '60,40,60', sores: 8, blood: 10 });
    mats.push(m3); root.add(R.build(m3));
    head = makeFaceHead(def, 0.18); head.position.set(0, 0.17 * R.s, 0.02); R.byName.head.add(head);
    hair = makeHair(0.18, { count: 70, len: 0.5, seed: 21 }); hair.position.copy(head.position); R.byName.head.add(hair);
  } else if (type === 'smiles') {
    R = humanoidRig({ height: 1.86, thin: 1.0, shoulder: 1.05, belly: true });
    var cov = [0.24, 0.3, 0.36];
    dressHumanoid(R, { skin: [0.85, 0.8, 0.72], shirt: cov, pants: cov, shoes: [0.08, 0.07, 0.06], gloves: [0.75, 0.6, 0.2] }, { gloves: true });
    R.part('chest', T.box, 0.09 * R.s, 0.12 * R.s, 0.11 * R.s, 0.07, 0.03, 0.005, [0.9, 0.9, 0.9]); // name tag
    R.part('hips', T.box, 0.2 * R.s, -0.02, 0, 0.04, 0.12, 0.12, [0.5, 0.5, 0.52]); // keys
    var m4 = skinMat('smileskin', [150, 160, 170], { veins: 4, sores: 2, blood: 3 });
    mats.push(m4); root.add(R.build(m4));
    head = makeFaceHead(def, 0.155); head.position.set(0, 0.14 * R.s, 0.01); R.byName.head.add(head);
    // mop bucket + mop (separate group so it can lag behind)
    var bucket = new THREE.Group();
    var bm = bakeMat({ color: 0xd6b02a, shininess: 30 }, 'probe'); mats.push(bm);
    var b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 12), bm); b1.position.y = 0.25; bucket.add(b1);
    var mopm = bakeMat({ color: 0x6d6a60, shininess: 5 }, 'probe'); mats.push(mopm);
    var mop = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), mopm); mop.position.set(0.1, 0.8, 0); mop.rotation.z = 0.25; bucket.add(mop);
    var mh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.12), mopm); mh.position.set(0.25, 0.2, 0); bucket.add(mh);
    extra.bucket = bucket;
  } else if (type === 'static') {
    R = humanoidRig({ height: 1.75, thin: 0.8, armLen: 1.1 });
    var dk = [0.06, 0.06, 0.08];
    dressHumanoid(R, { skin: dk, shirt: dk, pants: dk, shoes: dk }, {});
    var m5 = bakeMat({ vertexColors: true, shininess: 80, specular: new THREE.Color(0.3, 0.35, 0.4), skinning: true, transparent: true, opacity: 0.92, emissive: new THREE.Color(0.02, 0.03, 0.05) }, 'probe', {
      key: 'static', vbody: 'transformed.x += (fract(sin(floor(position.y * 30.0) + floor(uTime * 24.0)) * 43758.5) - 0.5) * 0.06;\n'
    });
    mats.push(m5); root.add(R.build(m5));
    head = makeFaceHead(def, 0.155); head.position.set(0, 0.14 * R.s, 0.01); R.byName.head.add(head);
  } else if (type === 'hoots') {
    R = humanoidRig({ height: 1.9, thin: 1.25, shoulder: 1.1 });
    var fur = [0.55, 0.36, 0.2], belly = [0.95, 0.88, 0.7];
    var s = R.s;
    // costume body: big round torso
    R.part('spine', T.sph, 0, 0.18 * s, 0.02, 0.36 * s, 0.46 * s, 0.32 * s, fur);
    R.part('spine', T.sph, 0, 0.16 * s, 0.2 * s, 0.24 * s, 0.32 * s, 0.14 * s, belly);
    ['L', 'R'].forEach(function (sd) {
      R.part('ua' + sd, T.sph, 0, -0.18 * s, 0, 0.11 * s, 0.24 * s, 0.07 * s, fur);
      R.part('fa' + sd, T.sph, 0, -0.16 * s, 0, 0.1 * s, 0.2 * s, 0.06 * s, fur);
      R.part('hand' + sd, T.sph, 0, -0.05 * s, 0, 0.06 * s, 0.07 * s, 0.04 * s, [0.3, 0.2, 0.12]);
      R.limb('th' + sd, 0.43 * s, 0.11 * s, 0.09 * s, fur);
      R.limb('sn' + sd, 0.43 * s, 0.08 * s, 0.07 * s, [0.9, 0.55, 0.15]);
      R.part('ft' + sd, T.box, 0, -0.03 * s, 0.08 * s, 0.16 * s, 0.07 * s, 0.3 * s, [0.95, 0.55, 0.15]);
    });
    R.part('neck', T.cyl, 0, 0.04, 0, 0.06, 0.1, 0.06, [0.45, 0.42, 0.4]);
    var furT = SKIN_CACHE.fur || (SKIN_CACHE.fur = toTex(texFur([150, 100, 60], 5)));
    var m6 = bakeMat({ map: furT, vertexColors: true, shininess: 4, specular: new THREE.Color(0.02, 0.02, 0.02), skinning: true }, 'probe');
    mats.push(m6); root.add(R.build(m6));
    // true face underneath (inside the suit's neck)
    head = makeFaceHead(def, 0.16); head.position.set(0, 0.13, 0.05); R.byName.head.add(head);
    // costume head (separate group, pivots back to reveal)
    var ch = new THREE.Group(); ch.position.set(0, 0.02, -0.12);
    var cm = bakeMat({ map: furT, color: 0xffffff, shininess: 4 }, 'probe'); mats.push(cm);
    var big = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), cm); big.scale.set(1, 0.92, 0.9); big.position.set(0, 0.2, 0.12); ch.add(big);
    var wm = bakeMat({ color: 0xf6f2e6, shininess: 40 }, 'probe'), ym = bakeMat({ color: 0xf2c33c, shininess: 30 }, 'probe'), km = bakeMat({ color: 0x111111, shininess: 90, specular: new THREE.Color(0.6, 0.6, 0.6) }, 'probe'), om = bakeMat({ color: 0xee8822, shininess: 40 }, 'probe'), bl = bakeMat({ color: 0x1f3c88, shininess: 20 }, 'probe');
    mats.push(wm, ym, km, om, bl);
    [-1, 1].forEach(function (sd) {
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20), ym); ring.rotation.x = PI / 2; ring.position.set(sd * 0.13, 0.27, 0.4); ch.add(ring);
      var eye = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.05, 20), wm); eye.rotation.x = PI / 2; eye.position.set(sd * 0.13, 0.27, 0.42); ch.add(eye);
      var pup = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), km); pup.scale.z = 0.4; pup.position.set(sd * 0.13, 0.26, 0.45); ch.add(pup); extra['pupil' + sd] = pup;
      var tuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 6), cm); tuft.position.set(sd * 0.22, 0.52, 0.12); tuft.rotation.z = -sd * 0.4; ch.add(tuft);
    });
    var beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), om); beak.rotation.x = PI / 2 + 0.6; beak.position.set(0, 0.14, 0.43); ch.add(beak);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.62), bl); cap.position.set(0, 0.52, 0.1); cap.rotation.y = PI / 4; ch.add(cap);
    var capb = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.1, 16), bl); capb.position.set(0, 0.47, 0.1); ch.add(capb);
    var tas = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), ym); tas.position.set(0.25, 0.43, 0.2); ch.add(tas);
    R.byName.neck.add(ch);
    extra.costumeHead = ch;
  }
  root.add(R.mesh);
  if (extra.bucket) root.add(extra.bucket);
  mats.push(head.material); if (hair) mats.push(hair.material);
  root.traverse(function (o) { o.castShadow = true; });
  return { root: root, rig: R, mats: mats, head: head, hair: hair, extra: extra };
}

// ---- animation helpers --------------------------------------------------------
function poseReset(R) { for (var i = 0; i < R.bones.length; i++) R.bones[i].rotation.copy(R.rest[i]); }
function animWalk(R, ph, amt, opt) {
  opt = opt || {};
  var B = R.byName, sw = Math.sin(ph), cw = Math.cos(ph);
  var a = amt * (opt.stride || 0.55);
  B.thL.rotation.x = -sw * a; B.thR.rotation.x = sw * a;
  B.snL.rotation.x = Math.max(0, cw) * a * 1.3; B.snR.rotation.x = Math.max(0, -cw) * a * 1.3;
  B.ftL.rotation.x = -0.1 * amt; B.ftR.rotation.x = -0.1 * amt;
  var arm = opt.armSwing != null ? opt.armSwing : 0.6;
  B.uaL.rotation.x = sw * a * arm; B.uaR.rotation.x = -sw * a * arm;
  B.faL.rotation.x = -0.25 - Math.max(0, sw) * 0.3 * amt; B.faR.rotation.x = -0.25 - Math.max(0, -sw) * 0.3 * amt;
  B.uaL.rotation.z = 0.08; B.uaR.rotation.z = -0.08;
  B.hips.position.y = R.bones[0].userData.y0 + Math.abs(cw) * 0.04 * amt;
  B.spine.rotation.x = (opt.lean || 0) * amt;
  B.chest.rotation.y = sw * 0.08 * amt;
}
function animIdle(R, t, opt) {
  var B = R.byName; opt = opt || {};
  B.chest.rotation.x = Math.sin(t * 1.3) * 0.02;
  B.uaL.rotation.z = 0.1 + Math.sin(t * 0.9) * 0.02; B.uaR.rotation.z = -0.1 - Math.sin(t * 0.9) * 0.02;
  B.hips.position.y = R.bones[0].userData.y0;
}
function animCrawl(R, ph, amt, onCeil) {
  var B = R.byName, sw = Math.sin(ph), cw = Math.cos(ph);
  B.hips.rotation.x = 1.25;
  B.hips.position.y = 0.55;
  B.spine.rotation.x = 0.15; B.chest.rotation.x = 0.1;
  B.neck.rotation.x = -1.1; B.head.rotation.x = -0.35;
  B.uaL.rotation.x = -1.5 + sw * 0.5 * amt; B.uaR.rotation.x = -1.5 - sw * 0.5 * amt;
  B.uaL.rotation.z = 0.35; B.uaR.rotation.z = -0.35;
  B.faL.rotation.x = -0.5 - Math.max(0, cw) * 0.6 * amt; B.faR.rotation.x = -0.5 - Math.max(0, -cw) * 0.6 * amt;
  B.thL.rotation.x = -1.0 - sw * 0.45 * amt; B.thR.rotation.x = -1.0 + sw * 0.45 * amt;
  B.thL.rotation.z = 0.3; B.thR.rotation.z = -0.3;
  B.snL.rotation.x = 1.6 + Math.max(0, -cw) * 0.5 * amt; B.snR.rotation.x = 1.6 + Math.max(0, cw) * 0.5 * amt;
}

// ---- monster entity --------------------------------------------------------------
function spawnMonster(type, li, x, z, opt) {
  var mdl = buildMonsterModel(type);
  mdl.rig.bones[0].userData.y0 = mdl.rig.bones[0].position.y;
  var m = {
    type: type, mdl: mdl, li: li, x: x, z: z, y: floorY(li, x, z), yaw: R.range(0, TAU), state: 'patrol', t: 0, stateT: 0,
    path: null, pathI: 0, repath: 0, target: null, speed: 0, ph: 0, seen: 0, lastSeen: null, probeT: 0, voiceT: R.range(2, 6),
    stare: 0, ceil: false, ceilAmt: 0, alpha: 1, visible: true, active: true, raid: false, frozen: false, screamT: 0, reveal: 0, jaw: 0,
    hearMul: 1, home: null, watcher: !!(opt && opt.watcher), checkHide: null, lungeT: 0, killNPC: null, tv: null, leaveT: 0, life: 0
  };
  m.mdl.root.position.set(x, m.y, z);
  RENDER.scene.add(m.mdl.root);
  MONSTERS.push(m);
  if (type === 'crawler') { m.ceil = true; m.ceilAmt = 1; m.hearMul = 1.6; }
  if (type === 'hoots') m.hearMul = 1.25;
  if (type === 'static') { m.state = 'dormant'; m.mdl.root.visible = false; m.visible = false; }
  if (m.watcher) m.state = 'watch';
  SAVE.monsters[type] = SAVE.monsters[type] || 1;
  return m;
}
function removeMonster(m) {
  RENDER.scene.remove(m.mdl.root);
  m.mdl.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
  m.mdl.mats.forEach(function (mt) { mt.dispose(); });
  var i = MONSTERS.indexOf(m); if (i >= 0) MONSTERS.splice(i, 1);
}
function clearMonsters() { while (MONSTERS.length) removeMonster(MONSTERS[0]); }

var MSPEED = { student0: [1.0, 4.7], crawler: [1.4, 4.1], gaper: [1.2, 3.7], smiles: [0, 3.1], static: [0, 3.9], hoots: [1.4, 3.95] };
function camForward() { return { x: -Math.sin(PL.yaw) * Math.cos(PL.pitch), y: Math.sin(PL.pitch), z: -Math.cos(PL.yaw) * Math.cos(PL.pitch) }; }
function playerHeadPos() { return { x: PL.x, y: PL.y + PL.eye, z: PL.z }; }
// how visible is the player to monster m (0..1)
function monsterSees(m, tx, tz, tli, targetIsPlayer) {
  if (tli !== m.li) return 0;
  var dx = tx - m.x, dz = tz - m.z, d = Math.sqrt(dx * dx + dz * dz);
  if (m.type === 'crawler') return 0; // blind
  var lit = LIGHTU.uMix.value > 0.5;
  var range = lit ? 22 : 8.5;
  if (targetIsPlayer) {
    if (PL.flash) range = 18;
    if (PL.crouch && !PL.flash) range *= 0.55;
    if (PL.hidden || PL.seated && !m.raid) return 0;
  }
  if (d > range) return 0;
  var fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
  var dot = (dx * fx + dz * fz) / (d || 1);
  if (d > 2.2 && dot < 0.25) return 0;
  if (!losClear(m.li, m.x, m.z, tx, tz)) return 0;
  return 1 - d / range * 0.5;
}
function playerLooksAt(m, maxAngle, maxDist) {
  if (m.li !== PL.li || !m.visible) return false;
  var hp = playerHeadPos(), dx = m.x - hp.x, dy = (m.y + 1.4) - hp.y, dz = m.z - hp.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (d > (maxDist || 20)) return false;
  var f = camForward(); var dot = (dx * f.x + dy * f.y + dz * f.z) / d;
  if (dot < Math.cos(maxAngle)) return false;
  if (!losClear(m.li, hp.x, hp.z, m.x, m.z)) return false;
  // in the dark you only "see" it when lit, close, or with the flashlight
  if (LIGHTU.uMix.value < 0.5 && !PL.flash && d > 6) return m.type === 'student0' ? d < 11 : false;
  return true;
}
function randomPatrolPoint(li, rnd) {
  rnd = rnd || R;
  var rooms = MAP.rooms.filter(function (r) { return r.li === li && r.role !== 'OUTSIDE' && r.role !== 'BUS'; });
  for (var k = 0; k < 20; k++) {
    var r = rnd.pick(rooms), x = rnd.range(r.x0 + 0.6, r.x1 - 0.6), z = rnd.range(r.z0 + 0.6, r.z1 - 0.6);
    if (passable(li, m2c(x), m2r(z), 'm') && cellType(li, m2c(x), m2r(z)) !== T_STAIR) return { li: li, x: x, z: z };
  }
  return { li: li, x: 30, z: 11.25 };
}
function monsterGoto(m, li, x, z) {
  var p = findPath(m.li, m.x, m.z, li, x, z, 'm', 30000);
  m.path = p; m.pathI = 1; m.target = { li: li, x: x, z: z };
  return !!p;
}
function followPath(m, spd, dt) {
  if (!m.path || m.pathI >= m.path.length) return true;
  var p = m.path[m.pathI];
  var dx = p.x - m.x, dz = p.z - m.z, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 0.25) { m.pathI++; if (m.pathI >= m.path.length) return true; return false; }
  var step = Math.min(d, spd * dt);
  m.x += dx / d * step; m.z += dz / d * step;
  var ty = Math.atan2(dx, dz);
  m.yaw += angDiff(m.yaw, ty) * Math.min(1, dt * 8);
  m.li = resolveLevel(m.li, m.x, m.z);
  if (p.li !== m.li && cellType(m.li, m2c(m.x), m2r(m.z)) !== T_STAIR) m.li = p.li;
  m.speed = spd;
  return false;
}
function hearNoises(m) {
  var best = null, bs = 0;
  for (var i = 0; i < NOISES.length; i++) {
    var n = NOISES[i]; if (n.src === 'monster') continue;
    var sameL = n.li === m.li, d = Math.sqrt(dist2(n.x, n.z, m.x, m.z));
    var r = n.r * m.hearMul * (sameL ? 1 : 0.35);
    if (d < r) { var s = (1 - d / r) * n.r; if (s > bs) { bs = s; best = n; } }
  }
  return best;
}

function updateMonsters(dt) {
  for (var i = MONSTERS.length - 1; i >= 0; i--) { var m = MONSTERS[i]; if (m.active) updateMonster(m, dt); }
  NOISES.length = 0;
}
function updateMonster(m, dt) {
  m.t += dt; m.stateT += dt; m.life += dt;
  var spd = MSPEED[m.type] || [1, 3.5];
  var dark = LIGHTU.uMix.value < 0.5 || m.raid;
  if (m.grace > 0) { m.grace -= dt; dark = false; }
  var dp = Math.sqrt(dist2(m.x, m.z, PL.x, PL.z)), samePL = m.li === PL.li;
  var sees = dark ? monsterSees(m, PL.x, PL.z, PL.li, true) : 0;
  if (sees > 0) { m.lastSeen = { li: PL.li, x: PL.x, z: PL.z, t: m.t }; }
  var heard = dark ? hearNoises(m) : null;
  var moved = false, wantSpeed = 0;
  if (m.watcher) { monsterWatcher(m, dt, dp); finishMonster(m, dt); return; }
  // type specific overrides
  switch (m.type) {
    case 'student0':
      if (m.state === 'patrol' || m.state === 'stand') {
        if (playerLooksAt(m, 0.22, 18)) { m.stare += dt; if (m.stare > 0.15 && !m._noticeSfx) { m._noticeSfx = true; sfx('whisper', mpos(m)); } }
        else m.stare = Math.max(0, m.stare - dt * 0.6);
        if (m.stare > 1.0 || (samePL && dp < 2.6 && !PL.hidden)) { setState(m, 'tilt'); sfx('giggle', mpos(m)); }
      }
      break;
    case 'smiles':
      m.frozen = dark && samePL && playerLooksAt(m, 0.62, 30) && (PL.flash || dp < 5 || LIGHTU.uMix.value > 0.5);
      break;
  }
  if (m.state === 'patrol') {
    if (sees > 0.0 && m.type !== 'student0' && m.type !== 'smiles') { onSpotPlayer(m); }
    else if (heard) { setState(m, 'investigate'); monsterGoto(m, heard.li, heard.x, heard.z); if (m.type === 'crawler') sfx('clicks', mpos(m), { n: 14 }); }
    else {
      if (!m.path || m.pathI >= m.path.length || m.stateT > 25) {
        if (m.type === 'student0' && R() < 0.5 && m.stateT > 2) { setState(m, 'stand'); }
        else { var pp = randomPatrolPoint(R() < 0.75 ? m.li : R.pick([0, 1, 2].filter(function (l) { return l !== 0 || m.type === 'crawler'; })), R); monsterGoto(m, pp.li, pp.x, pp.z); m.stateT = 0; }
      }
      wantSpeed = spd[0];
      if (m.type === 'smiles') wantSpeed = m.frozen ? 0 : 1.4;
      followPath(m, wantSpeed, dt); moved = wantSpeed > 0;
    }
    if (m.type === 'smiles' && !m.frozen && m.stateT > 3 && dp < 40) { setState(m, 'stalk'); }
  } else if (m.state === 'stand') {
    if (sees > 0 && dp < 7) { m.yaw += angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)) * dt * 1.5; }
    if (m.stateT > R.range(6, 14)) setState(m, 'patrol');
    if (heard && heard.r > 6) { setState(m, 'investigate'); monsterGoto(m, heard.li, heard.x, heard.z); }
  } else if (m.state === 'tilt') {
    m.yaw += angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)) * dt * 6;
    if (m.stateT > 0.9) { setState(m, 'chase'); sfx('scream', mpos(m), { len: 0.8, pitch: 1.5 }); }
  } else if (m.state === 'scream') {
    m.yaw += angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)) * dt * 6;
    m.jaw = Math.min(1, m.jaw + dt * 4);
    if (m.stateT > 1.8) setState(m, 'chase');
  } else if (m.state === 'chase' || m.state === 'stalk') {
    var tgt = m.lastSeen;
    if (m.state === 'stalk' || m.type === 'smiles') tgt = { li: PL.li, x: PL.x, z: PL.z, t: m.t };
    if (m.type === 'crawler') { tgt = heard ? { li: heard.li, x: heard.x, z: heard.z, t: m.t } : (m._lastHeard || tgt); if (heard) m._lastHeard = tgt; }
    if (tgt) {
      m.repath -= dt;
      if (m.repath <= 0 || !m.path) { monsterGoto(m, tgt.li, tgt.x, tgt.z); m.repath = 0.6; }
      wantSpeed = spd[1];
      if (m.type === 'smiles') wantSpeed = m.frozen ? 0 : (dp > 12 ? 4.2 : spd[1]);
      if (m.type === 'static') { wantSpeed = spd[1] * (0.6 + 0.6 * (Math.sin(m.t * 9) > 0 ? 1 : 0)); }
      var arrived = followPath(m, wantSpeed, dt); moved = wantSpeed > 0;
      if (arrived && (m.type !== 'smiles')) { setState(m, 'search'); }
    }
    if (m.type !== 'smiles' && m.type !== 'crawler' && m.lastSeen && m.t - m.lastSeen.t > (m.type === 'student0' ? 3 : 5)) setState(m, 'search');
    if (m.type === 'crawler' && m.stateT > 10 && !heard) setState(m, 'search');
    if (m.type === 'static' && m.stateT > 12) { staticVanish(m); }
    if (m.type === 'smiles' && dp > 45) { smilesTeleport(m); }
  } else if (m.state === 'investigate') {
    if (sees > 0 && m.type !== 'student0' && m.type !== 'smiles') onSpotPlayer(m);
    else {
      if (heard && m.repath <= 0) { monsterGoto(m, heard.li, heard.x, heard.z); m.repath = 1; }
      m.repath -= dt;
      var arr = followPath(m, m.type === 'crawler' ? 3.6 : spd[0] * 1.6, dt); moved = true;
      if (arr) setState(m, 'search');
    }
  } else if (m.state === 'search') {
    // look around, maybe check a nearby hiding spot
    m.yaw += Math.sin(m.stateT * 2.2) * dt * 1.6;
    if (sees > 0 && m.type !== 'smiles') onSpotPlayer(m);
    if (!m.checkHide && m.stateT > 1.0) {
      var hs = nearestHide(m, 5);
      if (hs && R() < (PL.hidden === hs ? 0.85 : 0.4)) { m.checkHide = hs; monsterGoto(m, hs.li, hs.ex, hs.ez); }
    }
    if (m.checkHide) {
      var a2 = followPath(m, spd[0] * 1.3, dt); moved = true;
      if (a2) { inspectHide(m, m.checkHide); m.checkHide = null; }
    }
    if (m.stateT > 7 && !m.checkHide) { setState(m, 'patrol'); m.path = null; }
  } else if (m.state === 'raid') {
    updateRaidMonster(m, dt); moved = m.speed > 0.1;
  } else if (m.state === 'leave') {
    var la = followPath(m, spd[0] * 1.5, dt); moved = true;
    if (la || m.stateT > 12) { m.active = false; m.mdl.root.visible = false; m.gone = true; }
  } else if (m.state === 'dormant') {
    if (m.type === 'static') staticDormant(m, dt, dp);
  } else if (m.state === 'flinch') {
    if (m.stateT > 2.2) { setState(m, 'leave'); var far = randomPatrolPoint(m.li); monsterGoto(m, far.li, far.x, far.z); }
  }
  if (!moved) m.speed = damp(m.speed, 0, 8, dt);
  // NPC hunting
  if (dark && m.state !== 'dormant' && m.state !== 'flinch' && m.state !== 'leave' && m.active) monsterHuntNPCs(m, dt);
  // catch player
  if (dark && m.active && m.visible && samePL && !PL.hidden && PL.alive && m.state !== 'dormant' && m.state !== 'flinch' && m.state !== 'leave' && m.state !== 'tilt' && m.state !== 'scream' && !(m.type === 'smiles' && m.frozen)) {
    var dy = Math.abs((m.y) - PL.y);
    var reach = m.type === 'crawler' ? 1.2 : 0.95;
    if (dp < reach && dy < 1.5 && !(PL.seated && !m.raid)) { onMonsterCatch(m); }
    else if (m.type === 'crawler' && dp < 2.2 && dy < 1.5 && !PL.breath && PL.moving && !(PL.seated && !m.raid)) { onMonsterCatch(m); }
  }
  finishMonster(m, dt);
}
function mpos(m) { return { li: m.li, x: m.x, z: m.z, y: m.y + 1.4 }; }
function setState(m, s) { m.state = s; m.stateT = 0; if (s !== 'stand') m._noticeSfx = false; if (s === 'chase') m.repath = 0; if (s !== 'scream') m.jaw = 0; }
function onSpotPlayer(m) {
  if (m.type === 'gaper' && m.screamT <= 0) {
    setState(m, 'scream'); m.screamT = 14;
    sfx('scream', mpos(m), { len: 2.0, pitch: 0.75 }); sfx('staticBurst', null, { len: 0.6 });
    PL.flashDead = 6; if (PL.flash) { PL.flash = false; showToast('YOUR FLASHLIGHT DIED', 'ライトが消えた！'); }
    MONSTERS.forEach(function (o) { if (o !== m && o.active && o.state !== 'dormant' && !o.watcher) { o.lastSeen = { li: PL.li, x: PL.x, z: PL.z, t: o.t }; setState(o, o.type === 'crawler' ? 'investigate' : 'chase'); if (o.type === 'crawler') monsterGoto(o, PL.li, PL.x, PL.z); } });
    return;
  }
  if (m.state !== 'chase') { setState(m, 'chase'); sfx(m.type === 'hoots' ? 'hootBad' : 'growl', mpos(m), { len: 1.0, pitch: m.type === 'hoots' ? 0.8 : 1 }); }
}
function nearestHide(m, r) {
  var best = null, bd = r * r;
  for (var i = 0; i < MAP.hides.length; i++) { var h = MAP.hides[i]; if (h.li !== m.li) continue; var d = dist2(h.x, h.z, m.x, m.z); if (d < bd) { bd = d; best = h; } }
  return best;
}
function inspectHide(m, h) {
  m.yaw = Math.atan2(h.x - m.x, h.z - m.z);
  if (h.type === 'locker') sfx('lockerOpen', { li: h.li, x: h.x, z: h.z });
  if (PL.hidden === h) {
    if (PL.breath && !PL.sawHide && R() < 0.75) { sfx('breathM', mpos(m), { v: 0.4 }); showToast('...', '（息を殺した…）'); return; }
    onMonsterCatch(m);
  }
}
function monsterHuntNPCs(m, dt) {
  if (typeof NPCS === 'undefined') return;
  for (var i = 0; i < NPCS.length; i++) {
    var n = NPCS[i]; if (!n.alive || n.seated || n.hidden || n.li !== m.li || n.state === 'raidHide' || m.raid) continue;
    var d = Math.sqrt(dist2(n.x, n.z, m.x, m.z));
    if (d < 0.9 && (GAME.monKills || 0) < (GAME.night >= 3 ? 2 : 1) && m.state !== 'patrol') { GAME.monKills = (GAME.monKills || 0) + 1; npcKilled(n, m); setState(m, 'search'); return; }
    if (m.state === 'patrol' && d < 7 && m.type !== 'smiles' && (m.type === 'crawler' ? n.running : losClear(m.li, m.x, m.z, n.x, n.z))) { monsterGoto(m, n.li, n.x, n.z); m.state = 'investigate'; m.stateT = 0; }
  }
}
function smilesTeleport(m) {
  // reappear somewhere behind the player, out of sight
  for (var k = 0; k < 30; k++) {
    var p = randomPatrolPoint(PL.li);
    var d = Math.sqrt(dist2(p.x, p.z, PL.x, PL.z));
    if (d > 14 && d < 28 && !playerLooksAtPoint(p)) { m.li = p.li; m.x = p.x; m.z = p.z; m.path = null; return; }
  }
}
function playerLooksAtPoint(p) { var f = camForward(); var dx = p.x - PL.x, dz = p.z - PL.z, d = Math.sqrt(dx * dx + dz * dz); return (dx * f.x + dz * f.z) / d > 0.3 && losClear(PL.li, PL.x, PL.z, p.x, p.z); }
// Static lives in TVs
function staticDormant(m, dt, dp) {
  m.tvT = (m.tvT || R.range(6, 12)) - dt;
  if (m.tv) {
    m.tv.mesh.material.uniforms.uOn.value = 1; m.tv.mesh.material.uniforms.uFaceAmt.value = (Math.sin(m.t * 13) > 0.85) ? 0.8 : 0;
    var d = Math.sqrt(dist2(m.tv.x, m.tv.z, PL.x, PL.z));
    if (m.tv.li === PL.li && d < 7 && LIGHTU.uMix.value < 0.5) { // emerge
      m.li = m.tv.li; var fx = Math.sin(m.tv.rot), fz = Math.cos(m.tv.rot);
      m.x = m.tv.x + fx * 0.9; m.z = m.tv.z + fz * 0.9; m.yaw = m.tv.rot; m.visible = true; m.mdl.root.visible = true;
      m.lastSeen = { li: PL.li, x: PL.x, z: PL.z, t: m.t }; setState(m, 'chase'); sfx('staticBurst', mpos(m), { len: 1.4 }); sfx('scream', mpos(m), { len: 1.0, pitch: 1.3 });
      return;
    }
    if (m.tvT < 0) { tvOff(m.tv); m.tv = null; m.tvT = R.range(5, 12); }
  } else if (m.tvT < 0) {
    var tvs = WORLD.specials.tvs.filter(function (t) { return t.li === PL.li; });
    if (tvs.length) { tvs.sort(function (a, b) { return dist2(a.x, a.z, PL.x, PL.z) - dist2(b.x, b.z, PL.x, PL.z); }); m.tv = tvs[Math.min(tvs.length - 1, R.int(0, 1))]; sfx('staticBurst', { li: m.tv.li, x: m.tv.x, z: m.tv.z }, { len: 2.5 }); }
    m.tvT = R.range(10, 16);
  }
}
function tvOff(tv) { tv.mesh.material.uniforms.uOn.value = 0; tv.mesh.material.uniforms.uFaceAmt.value = 0; }
function staticVanish(m) { sfx('staticBurst', mpos(m), { len: 0.5 }); m.visible = false; m.mdl.root.visible = false; setState(m, 'dormant'); if (m.tv) { tvOff(m.tv); m.tv = null; } m.tvT = R.range(8, 14); }
// harmless watcher (Hoots in the dark on early nights)
function monsterWatcher(m, dt, dp) {
  m.yaw = m.yaw; // body still
  var h = m.mdl.rig.byName.neck;
  var target = Math.atan2(PL.x - m.x, PL.z - m.z) - m.yaw;
  m._neck = damp(m._neck || 0, clamp(angDiff(0, target), -1.4, 1.4), 1.2, dt);
  if (m.li === PL.li && dp < 7) { if (!playerLooksAt(m, 0.7, 30)) { m.active = false; m.mdl.root.visible = false; sfx('whisper', mpos(m)); } }
}
function finishMonster(m, dt) {
  var mdl = m.mdl, R2 = mdl.rig;
  if (m.screamT > 0) m.screamT -= dt;
  var fy = floorY(m.li, m.x, m.z);
  m.y = damp(m.y, fy, 12, dt);
  // crawler ceiling
  var ceilY = LV_Y[m.li] + 3.15;
  var cell = cidx(m2c(m.x), m2r(m.z)), L = MAP.lv[m.li];
  if (L.ceil[cell] > 0) ceilY = LV_Y[m.li] + L.ceil[cell] - 0.05;
  if (m.type === 'crawler') {
    var wantCeil = (m.state === 'patrol') && L.type[cell] !== T_STAIR && L.type[cell] !== T_DOOR;
    m.ceilAmt = damp(m.ceilAmt, wantCeil ? 1 : 0, 3, dt);
  }
  var root = mdl.root;
  root.position.set(m.x, lerp(m.y, ceilY, m.ceilAmt), m.z);
  root.rotation.set(0, m.yaw, 0);
  if (m.ceilAmt > 0.01) root.rotation.z = m.ceilAmt * PI;
  // animation
  poseReset(R2);
  var spd = m.speed;
  m.ph += dt * (2.2 + spd * 2.4);
  var T = m.t;
  if (m.type === 'crawler') animCrawl(R2, m.ph, Math.min(1, spd / 2 + 0.15));
  else if (spd > 0.15) animWalk(R2, m.ph, Math.min(1.25, spd / 2.6), { lean: m.type === 'student0' ? 0.3 : 0.15, armSwing: m.type === 'student0' && m.state === 'chase' ? 1.6 : 0.6, stride: m.type === 'gaper' ? 0.4 : 0.55 });
  else animIdle(R2, T);
  var B = R2.byName;
  // head behaviours
  if (m.type === 'student0') {
    if (m.state === 'stand' || m.state === 'patrol') { B.head.rotation.z = Math.sin(T * 0.4) * 0.06; B.neck.rotation.x = 0.3; }
    if (m.state === 'tilt') { B.head.rotation.z = smooth(m.stateT / 0.8) * 1.25; B.neck.rotation.z = smooth(m.stateT / 0.8) * 0.4; }
    if (m.state === 'chase') { B.head.rotation.z = 1.0 + Math.sin(T * 17) * 0.15; B.uaL.rotation.x = -1.5 + Math.sin(m.ph * 2) * 0.6; B.uaR.rotation.x = -1.3 - Math.sin(m.ph * 2) * 0.6; }
  } else if (m.type === 'gaper') {
    B.neck.rotation.x = 0.45; B.head.rotation.x = -0.2 + Math.sin(T * 0.7) * 0.05;
    if (Math.sin(T * 1.3) > 0.97) B.head.rotation.z = (R() - 0.5) * 0.8;
  } else if (m.type === 'smiles') {
    if (m.frozen) { /* keep last pose */ if (m._frozenPose) { for (var i = 0; i < R2.bones.length; i++) R2.bones[i].rotation.copy(m._frozenPose[i]); } }
    else m._frozenPose = R2.bones.map(function (b) { return b.rotation.clone(); });
    B.head.rotation.z = 0.18; B.uaR.rotation.x = -0.9; B.faR.rotation.x = -0.6;
    if (mdl.extra.bucket) { var bk = mdl.extra.bucket; bk.position.set(m.x + Math.sin(m.yaw) * 0.9 + Math.cos(m.yaw) * 0.3, m.y, m.z + Math.cos(m.yaw) * 0.9 - Math.sin(m.yaw) * 0.3); bk.rotation.y = m.yaw; }
    if (!m.frozen && spd > 0.2) { m._sq = (m._sq || 0) - dt; if (m._sq < 0) { m._sq = R.range(1.2, 2.5); sfx('squeak', mpos(m)); } }
  } else if (m.type === 'hoots') {
    var ch = mdl.extra.costumeHead;
    var rev = m.watcher ? 0 : (m.state === 'chase' || m.state === 'raid' || m.state === 'scream' ? 1 : (m.reveal || 0) * 0.3);
    m._rev = damp(m._rev || 0, rev, 2.5, dt);
    if (ch) { ch.rotation.x = -m._rev * 1.25; ch.position.z = -0.12 - m._rev * 0.06; }
    mdl.head.visible = m._rev > 0.08;
    if (m.watcher) B.neck.rotation.y = m._neck || 0;
    if (mdl.extra['pupil1']) { var lk = clamp(angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)), -1, 1) * 0.03; mdl.extra.pupil1.position.x = 0.13 + lk; mdl.extra['pupil-1'].position.x = -0.13 + lk; }
  } else if (m.type === 'crawler') {
    B.head.rotation.z = Math.sin(T * 3) * 0.15 + (Math.sin(T * 0.9) > 0.9 ? 0.6 : 0);
  }
  // twitch
  if (!m.watcher && m.type !== 'smiles' && Math.sin(T * 2.7 + m.x) > 0.985) { B.head.rotation.y += (R() - 0.5) * 0.9; B.neck.rotation.x += (R() - 0.5) * 0.4; }
  var U = mdl.head.userData.U;
  if (U) { U.uJaw.value = damp(U.uJaw.value, Math.max(m.jaw, (m.state === 'chase' ? 0.55 + Math.sin(T * 9) * 0.15 : 0.08 + Math.max(0, Math.sin(T * 0.8)) * 0.1)), 6, dt); U.uTwitch.value = m.type === 'static' ? 1 : (m.state === 'chase' ? 0.3 : 0); }
  if (mdl.hair) mdl.hair.userData.U.uWind.value = Math.min(1, spd / 3);
  // lighting probe
  m.probeT -= dt;
  if (m.probeT <= 0 && WORLD) {
    m.probeT = 0.25;
    var pr = WORLD.baker.probe(m.li, m.x, m.y + 1.2, m.z);
    var on = pr.on, off = [pr.off[0] * 1.8 + 0.02, pr.off[1] * 1.8 + 0.022, pr.off[2] * 1.8 + 0.03];
    mdl.mats.forEach(function (mt) { if (mt.userData.probeOn) setProbe(mt, on, off); });
  }
  // voices
  m.voiceT -= dt;
  if (m.voiceT <= 0 && m.visible && m.active && LIGHTU.uMix.value < 0.5) {
    m.voiceT = R.range(3, 7);
    var p = mpos(m);
    if (m.type === 'student0') sfx(R() < 0.5 ? 'breathM' : 'whisper', p, { v: 0.35 });
    else if (m.type === 'crawler') sfx('clicks', p, { n: R.int(6, 16) });
    else if (m.type === 'gaper') sfx('growl', p, { len: 1.6, pitch: 0.7 });
    else if (m.type === 'static') sfx('staticBurst', p, { len: 0.6 });
    else if (m.type === 'hoots') sfx(m.watcher ? 'hoot' : 'hootBad', p, { pitch: 0.6 });
    else if (m.type === 'smiles' && !m.frozen) sfx('growl', p, { len: 0.8, pitch: 1.4 });
  }
  // footsteps
  if (m.speed > 0.4 && m.type !== 'static') {
    m._stp = (m._stp || 0) + m.speed * dt;
    if (m._stp > (m.type === 'crawler' ? 0.5 : 0.9)) { m._stp = 0; if (m.ceilAmt < 0.5) sfxStep(MAP.lv[m.li].mat[cell], m.state === 'chase' ? 1 : 0.4, mpos(m), { gain: m.type === 'gaper' ? 1.4 : 1 }); else sfx('clicks', mpos(m), { n: 2 }); }
  }
  root.visible = m.visible && m.active;
}
// fear level from nearby monsters (for heartbeat / post)
function monsterFear() {
  var f = 0, near = null;
  for (var i = 0; i < MONSTERS.length; i++) {
    var m = MONSTERS[i]; if (!m.active || !m.visible || m.state === 'dormant') continue;
    var d = Math.sqrt(dist2(m.x, m.z, PL.x, PL.z)) + (m.li !== PL.li ? 10 : 0);
    var v = clamp(1 - d / 14, 0, 1);
    if (m.state === 'chase') v = Math.min(1, v * 1.5 + 0.2);
    if (m.watcher) v *= 0.4;
    if (v > f) { f = v; near = m; }
  }
  return { f: f, m: near };
}


// ===== 15_npc.js =====
// ---- NPC students --------------------------------------------------------------
var NPCS = [];
var PERSONALITIES = {
  fast: { en: 'Fast', ja: '足が速い', speed: 3.5, delay: [1, 4] },
  timid: { en: 'Timid', ja: '臆病', speed: 1.9, delay: [8, 18] },
  kind: { en: 'Kind', ja: '親切', speed: 2.3, delay: [2, 5] },
  sneaky: { en: 'Sneaky', ja: 'ずるい', speed: 2.9, delay: [2, 6] },
  normal: { en: 'Normal', ja: '普通', speed: 2.2, delay: [5, 14] },
  slow: { en: 'Slow', ja: 'のんびり', speed: 1.7, delay: [10, 22] }
};
var NPC_LINES = {
  fast: [['Keep up or get left behind.', 'ついて来られないなら置いてくよ。'], ['I always get a seat. Always.', '俺はいつも座れる。いつもな。']],
  timid: [['D-did you hear that? In the vents?', 'い、今の聞こえた？通気口の中…'], ['I just wanted my diploma...', '卒業証書が欲しかっただけなのに…']],
  kind: [['Stick with me when the lights go out.', '電気が消えたら、私のそばにいて。'], ['If you get lost, look for the room numbers.', '迷ったら、部屋番号を見るのよ。']],
  sneaky: [['Musical chairs, huh? I was champion in third grade.', '椅子取りゲーム？小3の時チャンピオンだったぜ。'], ["Nothing personal. It's just math.", '悪く思うなよ。ただの算数さ。']],
  normal: [["My letter came with no stamp. Weird, right?", '僕の手紙、切手がなかったんだ。変だろ？'], ["Was there always one less chair?", '椅子って、ずっと1個足りなかった？']],
  slow: [['My knees aren\'t what they used to be.', '膝がもう昔みたいじゃなくてねえ。'], ['Back in my day the bell meant recess.', '昔はベルといえば休み時間だったのに。']]
};
function makeNPCs(night, count, rnd) {
  clearNPCs();
  var names = rnd.shuffle(NPC_NAMES.slice());
  var pers = ['kind', 'sneaky', 'fast', 'timid', 'normal', 'slow', 'normal', 'normal', 'fast', 'timid'];
  for (var i = 0; i < count; i++) {
    var ne = names[i], look = makeLook(rnd, ne);
    var model = buildHumanNPC(look, i + night * 7);
    model.rig.bones[0].userData.y0 = model.rig.bones[0].position.y;
    var n = { id: i, name: ne[0], look: look, pers: pers[i % pers.length], model: model, li: 1, x: 0, z: 0, y: 0, yaw: 0, state: 'seated', alive: true, seated: null, hidden: null,
      chair: null, path: null, pathI: 0, delay: 0, t: 0, ph: 0, speed: 0, running: false, friend: false, probeT: 0, talkT: 0, followP: false, lost: false, seed: rnd.int(1, 9999), sayT: 0, stuck: 0 };
    RENDER.scene.add(model.root);
    NPCS.push(n);
  }
  return NPCS;
}
function clearNPCs() { NPCS.forEach(function (n) { RENDER.scene.remove(n.model.root); n.model.mats.forEach(function (m) { m.dispose(); }); n.model.faceTex.dispose(); }); NPCS.length = 0; }
function npcSeat(n, c) {
  if (n.seated) n.seated.occ = -1;
  n.seated = c; c.occ = n.id; n.chair = c; n.state = 'seated'; n.li = c.li; n.x = c.x; n.z = c.z; n.yaw = c.rot; n.path = null; n.hidden = null;
}
function npcStand(n) { if (n.seated) { n.seated.occ = -1; n.seated = null; } n.state = 'idle'; }
// called at lights out: start moving to target room
function npcsBeginTransit(target, night, rnd) {
  var aliveN = NPCS.filter(function (n) { return n.alive; });
  var lostOne = rnd() < 0.45 ? rnd.pick(aliveN.filter(function (n) { return n.pers !== 'sneaky' && n.pers !== 'fast'; })) : null;
  aliveN.forEach(function (n) {
    npcStand(n);
    var P = PERSONALITIES[n.pers];
    n.delay = rnd.range(P.delay[0], P.delay[1]) * (night > 2 ? 0.85 : 1);
    n.target = target; n.state = 'wait'; n.path = null; n.lost = false; n.followP = false; n.waitP = 0;
    if (n === lostOne) {
      // teleport to a random nearby room: lost and crying, needs help
      var rooms = MAP.slots.filter(function (r) { return r !== target && r.li === PL.li; });
      var r = rnd.pick(rooms), e = roomEntryPoint(r, true);
      if (e) { n.li = e.li; n.x = r.cx + rnd.range(-2, 2); n.z = r.cz + rnd.range(-1.5, 1.5); if (!passable(n.li, m2c(n.x), m2r(n.z), 'p')) { n.x = e.x; n.z = e.z; } n.state = 'lost'; n.lost = true; }
    }
  });
}
function npcSay(n, en, ja, dur) { if (typeof showSubtitle === 'function') showSubtitle(n.name.toUpperCase() + ': ' + en, ja, dur || 2.6, 'npc'); say(en, 'npc', { pitch: n.look.female ? 1.25 : 0.85, rate: 1.05, interrupt: true }); }
function freeChairs(room) { return room.chairs.filter(function (c) { return c.avail && c.occ === -1; }); }
function updateNPCs(dt, phase) {
  for (var i = 0; i < NPCS.length; i++) {
    var n = NPCS[i];
    if (!n.alive) { n.model.root.visible = false; continue; }
    n.t += dt; n.sayT -= dt;
    var moving = false;
    if (n.state === 'seated') {
      // stay
    } else if (n.state === 'wait') {
      n.delay -= dt;
      if (n.delay <= 0) n.state = 'go';
      if (n.pers === 'kind' && Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) < 6 && !n._offered && PL.li === n.li) { n._offered = true; npcSay(n, 'This way! Follow me!', 'こっちよ！ついて来て！'); }
    } else if (n.state === 'lost') {
      n.yaw += dt * 0.3;
      if (n.sayT <= 0 && Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) < 7 && n.li === PL.li) { n.sayT = 6; npcSay(n, "Please... I can't find the room.", 'お願い…教室が見つからないの。'); }
    } else if (n.state === 'go' || n.state === 'follow' || n.state === 'toChair') {
      var tgt = null;
      if (n.state === 'follow') {
        tgt = { li: PL.li, x: PL.x, z: PL.z };
        var dP = Math.sqrt(dist2(n.x, n.z, PL.x, PL.z));
        if (n.target && roomAt(n.li, n.x, n.z) === n.target) { n.state = 'go'; n.friend = true; npcSay(n, "We made it. I owe you one.", '着いた…借りができたわ。'); }
        if (dP < 1.6 && n.li === PL.li) tgt = null;
      } else if (n.state === 'toChair') {
        tgt = { li: n.chair.li, x: n.chair.x, z: n.chair.z };
      } else tgt = roomEntryPoint(n.target) || { li: n.target.li, x: n.target.cx, z: n.target.cz };
      if (tgt) {
        n.repath = (n.repath || 0) - dt;
        if (!n.path || n.repath <= 0 || n.pathI >= n.path.length) { n.path = findPath(n.li, n.x, n.z, tgt.li, tgt.x, tgt.z, 'p', 25000); n.pathI = 1; n.repath = n.state === 'follow' ? 0.8 : 4; }
        var spd = PERSONALITIES[n.pers].speed * (n.scared ? 1.25 : 1);
        if (n.state === 'follow') spd = Math.min(4.2, Math.max(1.5, Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) * 1.2));
        if (n.pers === 'kind' && n.state === 'go' && n._offered && PL.li === n.li && Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) > 7 && (n.waitP += dt) < 12) spd = 0; // waits for you
        var arrived = npcFollow(n, spd, dt);
        moving = spd > 0.1 && n.path;
        n.running = spd > 3;
        if (n.state === 'go' && roomAt(n.li, n.x, n.z) === n.target) {
          var fc = freeChairs(n.target);
          if (fc.length) {
            fc.sort(function (a, b) { return dist2(a.x, a.z, n.x, n.z) - dist2(b.x, b.z, n.x, n.z); });
            // sneaky: grab the chair the player is heading to
            var pick = fc[0];
            if (n.pers === 'sneaky' && PL.li === n.li) { var pc = fc.slice().sort(function (a, b) { return dist2(a.x, a.z, PL.x, PL.z) - dist2(b.x, b.z, PL.x, PL.z); })[0]; if (Math.sqrt(dist2(pc.x, pc.z, PL.x, PL.z)) < 3.5) { pick = pc; if (n.sayT <= 0) { n.sayT = 8; npcSay(n, 'Too slow!', 'おっそいなあ！'); } } }
            n.chair = pick; pick.claim = n.id; n.state = 'toChair'; n.path = null;
          } else { n.state = 'panic'; npcSay(n, "No... no no no. There's no seat!", 'うそ…席がない！'); }
        }
        if (n.state === 'toChair') {
          if (n.chair.occ !== -1 && n.chair.occ !== n.id) { n.state = 'go'; n.path = null; }
          else if (Math.sqrt(dist2(n.x, n.z, n.chair.x, n.chair.z)) < 0.45) { npcSeat(n, n.chair); sfx('thump', { li: n.li, x: n.x, z: n.z }); }
        }
        if (n.path === null && n.state === 'go') { n.stuck += dt; if (n.stuck > 6) { n.stuck = 0; } }
      }
      // timid: hide when a monster is close
      if (n.pers === 'timid' || n.pers === 'slow') {
        var mf = nearestMonsterTo(n, 7);
        if (mf && !n.hidden && n.state !== 'toChair') { var h = nearestHideFor(n, 6); if (h) { n.hidden = h; n.state = 'hiding'; n.hideT = R.range(4, 9); n.x = h.x; n.z = h.z; } }
      }
    } else if (n.state === 'hiding') {
      n.hideT -= dt; if (n.hideT <= 0 && !nearestMonsterTo(n, 8)) { n.hidden = null; n.state = 'go'; n.path = null; n.scared = true; }
    } else if (n.state === 'panic') {
      n.yaw += Math.sin(n.t * 3) * dt * 2;
      var fc2 = freeChairs(n.target); if (fc2.length) { n.state = 'go'; }
    } else if (n.state === 'raidHide') {
      // under desk during raid
    }
    n.speed = damp(n.speed, moving ? PERSONALITIES[n.pers].speed : 0, 8, dt);
    finishNPC(n, dt);
  }
}
function npcFollow(n, spd, dt) {
  if (!n.path || n.pathI >= n.path.length) return true;
  var p = n.path[n.pathI], dx = p.x - n.x, dz = p.z - n.z, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 0.25) { n.pathI++; return n.pathI >= n.path.length; }
  var st = Math.min(d, spd * dt);
  var nx = n.x + dx / d * st, nz = n.z + dz / d * st;
  // light separation from other agents
  for (var k = 0; k < NPCS.length; k++) { var o = NPCS[k]; if (o === n || !o.alive || o.li !== n.li || o.seated) continue; var dd = dist2(nx, nz, o.x, o.z); if (dd < 0.36 && dd > 1e-4) { var q = Math.sqrt(dd); nx += (nx - o.x) / q * 0.02; nz += (nz - o.z) / q * 0.02; } }
  if (passable(n.li, m2c(nx), m2r(nz), 'p')) { n.x = nx; n.z = nz; } else { n.x += dx / d * st; n.z += dz / d * st; }
  n.yaw += angDiff(n.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
  n.li = resolveLevel(n.li, n.x, n.z);
  if (p.li !== n.li && cellType(n.li, m2c(n.x), m2r(n.z)) !== T_STAIR) n.li = p.li;
  return false;
}
function nearestMonsterTo(n, r) { for (var i = 0; i < MONSTERS.length; i++) { var m = MONSTERS[i]; if (m.active && m.visible && !m.watcher && m.li === n.li && m.state !== 'dormant' && dist2(m.x, m.z, n.x, n.z) < r * r) return m; } return null; }
function nearestHideFor(n, r) { var best = null, bd = r * r; MAP.hides.forEach(function (h) { if (h.li !== n.li || h.occ) return; var d = dist2(h.x, h.z, n.x, n.z); if (d < bd) { bd = d; best = h; } }); return best; }
function finishNPC(n, dt) {
  var mdl = n.model, R2 = mdl.rig, B = R2.byName;
  var fy = floorY(n.li, n.x, n.z);
  n.y = damp(n.y || fy, fy, 12, dt);
  poseReset(R2);
  var root = mdl.root;
  root.visible = !(n.hidden && n.hidden.type !== 'desk' && n.hidden.type !== 'table' && n.hidden.type !== 'bleacher');
  if (n.state === 'seated') {
    var c = n.seated;
    var seatH = c.kind === 'stool' ? 0.62 : (c.kind === 'busseat' ? 0.48 : 0.46);
    var back = c.kind === 'chair' ? -0.08 : 0;
    root.position.set(c.x + Math.sin(c.rot) * back, LV_Y[c.li] + seatH - R2.bones[0].userData.y0 + 0.05, c.z + Math.cos(c.rot) * back);
    root.rotation.y = c.rot;
    B.thL.rotation.x = -1.5; B.thR.rotation.x = -1.5; B.snL.rotation.x = 1.5; B.snR.rotation.x = 1.5;
    B.uaL.rotation.x = -0.5; B.uaR.rotation.x = -0.5; B.faL.rotation.x = -0.9; B.faR.rotation.x = -0.9;
    B.neck.rotation.x = 0.12 + Math.sin(n.t * 0.5 + n.id) * 0.05; B.head.rotation.y = Math.sin(n.t * 0.31 + n.id * 2) * 0.35;
    if (GAME.phase === 'lesson' && GAME.lessonLookAt) { B.head.rotation.y = 0; }
  } else if (n.state === 'hiding' || n.state === 'raidHide') {
    root.position.set(n.x, n.y - 0.55, n.z);
    B.hips.rotation.x = 0.9; B.thL.rotation.x = -2.2; B.thR.rotation.x = -2.2; B.snL.rotation.x = 2.4; B.snR.rotation.x = 2.4; B.neck.rotation.x = 0.4;
    B.uaL.rotation.x = -1.2; B.uaR.rotation.x = -1.2;
  } else {
    root.position.set(n.x, n.y, n.z); root.rotation.y = n.yaw;
    n.ph += dt * (2 + n.speed * 2.6);
    if (n.speed > 0.15) animWalk(R2, n.ph, Math.min(1.2, n.speed / 2.4), { lean: n.running ? 0.25 : 0.05 });
    else animIdle(R2, n.t);
    if (n.state === 'lost' || n.state === 'panic') { B.neck.rotation.x = 0.5; B.uaL.rotation.x = -1.8; B.uaR.rotation.x = -1.8; B.faL.rotation.x = -1.8; B.faR.rotation.x = -1.8; }
    if (n.speed > 0.15) { n._stp = (n._stp || 0) + n.speed * dt; if (n._stp > 0.8) { n._stp = 0; if (dist2(n.x, n.z, PL.x, PL.z) < 400) sfxStep(MAP.lv[n.li].mat[cidx(m2c(n.x), m2r(n.z))], n.running ? 0.8 : 0.35, { li: n.li, x: n.x, z: n.z, y: n.y + 0.1 }); if (n.running) emitNoise(n.li, n.x, n.z, 9, 'npc'); } }
  }
  n.probeT -= dt;
  if (n.probeT <= 0 && WORLD) { n.probeT = 0.3 + R() * 0.1; var pr = WORLD.baker.probe(n.li, n.x, LV_Y[n.li] + 1.2, n.z); mdl.mats.forEach(function (mt) { setProbe(mt, pr.on, [pr.off[0] * 1.5 + 0.01, pr.off[1] * 1.5 + 0.012, pr.off[2] * 1.5 + 0.02]); }); }
}
function npcKilled(n, m) {
  if (!n.alive) return;
  n.alive = false; n.killedBy = m ? m.type : 'bell';
  if (n.seated) { n.seated.occ = -1; n.seated = null; }
  if (n.chair && n.chair.claim === n.id) n.chair.claim = -1;
  n.model.root.visible = false;
  var p = { li: n.li, x: n.x, z: n.z, y: n.y + 1.5 };
  sfx('scream', p, { len: 1.2, pitch: n.look.female ? 1.25 : 0.85 });
  setTimeoutG(function () { sfx('drag', p, { len: 2 }); }, 700);
  GAME.lost.push(n);
  if (typeof showToast === 'function' && dist2(n.x, n.z, PL.x, PL.z) < 900) showToast('', n.name + 'の悲鳴が聞こえた…');
}
function nearestNPC(r) { var best = null, bd = r * r; NPCS.forEach(function (n) { if (!n.alive || n.li !== PL.li) return; var d = dist2(n.x, n.z, PL.x, PL.z); if (d < bd) { bd = d; best = n; } }); return best; }


// ===== 16_ui.js =====
// ---- UI: HUD, buttons, screens ----------------------------------------------
var UIX = {};
var UI_CSS = [
  '#hp-ui .en{display:block;font-family:"Bungee",Impact,sans-serif;letter-spacing:.02em;}',
  '#hp-ui .ja{display:block;font-family:"Zen Kaku Gothic New",sans-serif;font-weight:700;font-size:.62em;opacity:.85;letter-spacing:.04em;margin-top:2px;}',
  '#hp-ui .tw{font-family:"Special Elite","Courier New",monospace;}',
  '#hp-ui .vt{font-family:"VT323",monospace;}',
  // HUD top strip (below the Gravity no-go zone)
  '.hp-hudtop{position:absolute;top:calc(var(--top-safe) + 4px);left:16px;right:16px;height:58px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;transition:opacity .4s;}',
  '.hp-bars{width:104px;padding-top:4px;}',
  '.hp-bar{height:7px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);margin-bottom:7px;position:relative;overflow:hidden;}',
  '.hp-bar i{position:absolute;left:0;top:0;bottom:0;background:#e9e4d6;transition:width .15s;}',
  '.hp-bar.bat i{background:#f2d26a;} .hp-bar.low i{background:#e04a3a;}',
  '.hp-bar b{position:absolute;right:-1px;top:-14px;font:11px "VT323",monospace;color:#cfc8b8;}',
  '.hp-barlbl{font:12px "VT323",monospace;color:rgba(235,230,215,.75);margin:-4px 0 3px;letter-spacing:.08em;}',
  '.hp-obj{flex:1;text-align:center;font-family:"Bungee",Impact;font-size:13px;line-height:1.1;color:#f2ede0;text-shadow:0 1px 3px #000;padding-top:2px;min-width:0;}',
  '.hp-obj .ja{font-size:11px;}',
  '.hp-obj .seats{display:inline-block;margin-top:3px;font:15px "VT323",monospace;color:#ffcf6a;letter-spacing:.06em;}',
  '.hp-bell{font:22px "VT323",monospace;color:#f2ede0;text-align:right;min-width:62px;padding-top:2px;text-shadow:0 0 6px rgba(0,0,0,.9);}',
  '.hp-bell.warn{color:#ff5544;animation:hpblink .5s infinite;}',
  '.hp-pausebtn{width:56px;height:56px;border-radius:12px;background:rgba(10,10,12,.45);border:1.5px solid rgba(255,255,255,.35);color:#fff;font:22px "Bungee";display:flex;align-items:center;justify-content:center;}',
  '.hp-rec{position:absolute;top:calc(var(--top-safe) + 66px);right:16px;font:18px "VT323",monospace;color:rgba(255,255,255,.75);letter-spacing:.08em;text-shadow:0 0 4px #000;}',
  '.hp-rec i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#ff2b2b;margin-right:6px;animation:hpblink 1s steps(1) infinite;}',
  '@keyframes hpblink{50%{opacity:0}}',
  // buttons
  '.hp-btn{position:absolute;border-radius:50%;background:rgba(12,12,14,.42);border:1.5px solid rgba(255,255,255,.4);color:#f3efe3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;line-height:1;touch-action:none;transition:transform .08s,background .15s;}',
  '.hp-btn.on{background:rgba(242,210,106,.35);border-color:#f2d26a;}',
  '.hp-btn.dn{transform:scale(.92);background:rgba(255,255,255,.22);}',
  '.hp-btn .ic{font-size:22px;} .hp-btn .lb{font:10px "Bungee";margin-top:3px;letter-spacing:.02em;} .hp-btn .lj{font:700 9px "Zen Kaku Gothic New";opacity:.8;margin-top:1px;}',
  '.hp-btn.big{width:86px;height:86px;} .hp-btn.big .ic{font-size:30px;}',
  '.hp-btn.hide{display:none;}',
  '.hp-btn.pulse{animation:hppulse 1s infinite;} @keyframes hppulse{50%{box-shadow:0 0 0 8px rgba(255,255,255,.12)}}',
  '.hp-stick{position:absolute;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06);pointer-events:none;}',
  '.hp-stick .knob{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.35);}',
  '.hp-stick.run{border-color:#f2d26a;} .hp-stick.run .knob{background:rgba(242,210,106,.6);}',
  '.hp-stickhint{position:absolute;left:28px;width:110px;height:110px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.35);font:11px "Bungee";text-align:center;}',
  '.hp-inv{position:absolute;display:flex;gap:6px;}',
  '.hp-inv div{width:44px;height:44px;border-radius:9px;border:1.5px solid rgba(255,255,255,.3);background:rgba(10,10,12,.5);display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;}',
  '.hp-inv div.sel{border-color:#f2d26a;background:rgba(242,210,106,.22);} .hp-inv div b{position:absolute;right:2px;bottom:0;font:12px "VT323";color:#fff;}',
  '.hp-prompt{position:absolute;left:50%;transform:translateX(-50%);text-align:center;font-size:17px;color:#fff;text-shadow:0 2px 6px #000;white-space:nowrap;opacity:0;transition:opacity .15s;}',
  '.hp-prompt.show{opacity:1;}',
  '.hp-prompt .k{display:inline-block;border:1.5px solid #fff;border-radius:50%;width:22px;height:22px;line-height:20px;font-size:12px;margin-right:6px;vertical-align:2px;}',
  '.hp-sub{position:absolute;left:16px;right:16px;text-align:center;pointer-events:none;}',
  '.hp-sub span.box{display:inline-block;background:rgba(0,0,0,.62);padding:6px 12px 7px;border-radius:4px;max-width:100%;}',
  '.hp-sub .en{font-family:"Special Elite",monospace!important;font-size:16px;color:#fff;letter-spacing:0!important;}',
  '.hp-sub .ja{font-size:13px!important;color:#e8e1c8;}',
  '.hp-sub.hoots .en{color:#ffe07a;} .hp-sub.pa .en{color:#bfe3ff;} .hp-sub.evil .en{color:#ff6b5a;}',
  '.hp-toast{position:absolute;left:16px;right:16px;top:38%;text-align:center;pointer-events:none;opacity:0;transition:opacity .3s;}',
  '.hp-toast.show{opacity:1;} .hp-toast .en{font-size:20px;color:#fff;text-shadow:0 0 8px #000,0 0 2px #000;} .hp-toast .ja{font-size:14px;text-shadow:0 0 6px #000;}',
  '.hp-hint{position:absolute;left:16px;right:16px;text-align:center;font:13px "VT323",monospace;color:rgba(255,255,255,.55);}',
  '.hp-minimap{position:absolute;left:16px;width:124px;height:124px;border:1.5px solid rgba(255,255,255,.35);background:rgba(10,12,14,.6);border-radius:6px;}',
  '.hp-minimap canvas{width:100%;height:100%;display:block;}',
  '.hp-minimap b{position:absolute;left:4px;top:2px;font:12px "VT323";color:#cfe;}',
  // screens
  '.hp-scr{position:absolute;inset:0;pointer-events:auto;display:none;overflow:hidden;}',
  '.hp-scr.show{display:block;}',
  '.hp-panel{position:absolute;left:16px;right:16px;top:calc(var(--top-safe) + 8px);bottom:calc(var(--bot-safe) + 8px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}',
  '.hp-menu-btn{display:block;width:min(300px,100%);min-height:62px;margin:10px auto;border-radius:14px;border:3px solid #1b1b1b;background:#ffd84a;color:#1b1b1b;font-size:22px;padding:8px 10px;box-shadow:0 6px 0 #1b1b1b;}',
  '.hp-menu-btn .ja{font-size:13px;}',
  '.hp-menu-btn.alt{background:#7fd3ff;} .hp-menu-btn.alt2{background:#ff8f8f;} .hp-menu-btn.dark{background:#2a2a2e;color:#eee;border-color:#555;box-shadow:0 6px 0 #000;}',
  '.hp-menu-btn:active{transform:translateY(4px);box-shadow:0 2px 0 #1b1b1b;}',
  '.hp-dlg{background:#141416;border:1px solid #444;border-radius:10px;padding:16px;width:min(420px,100%);max-height:100%;overflow:auto;text-align:left;color:#ddd;}',
  '.hp-dlg h2{margin:0 0 10px;font-family:"Bungee";font-size:22px;color:#fff;}',
  '.hp-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #2a2a2a;}',
  '.hp-row .lbl .en{font-size:14px;} .hp-row .lbl .ja{font-size:11px;}',
  '.hp-seg{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;} .hp-seg button{min-width:56px;min-height:44px;border-radius:8px;border:1px solid #555;background:#222;color:#ddd;font:13px "Bungee";} .hp-seg button.sel{background:#ffd84a;color:#111;border-color:#ffd84a;}',
  '.hp-range{width:140px;height:44px;}',
  '.hp-x{min-width:56px;min-height:56px;border-radius:10px;border:1px solid #555;background:#222;color:#fff;font:16px "Bungee";}',
  '.hp-blink{animation:hpblink 1.1s steps(1) infinite;}',
  '.hp-black{background:#000;}',
  '.hp-chapter{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-2deg);width:min(330px,86%);background:#f2ead2;color:#151515;border-radius:4px;padding:16px 14px 14px;box-shadow:0 0 40px rgba(0,0,0,.8);text-align:center;}',
  '.hp-chapter:before{content:"";position:absolute;left:10px;right:10px;top:7px;height:4px;background:repeating-linear-gradient(90deg,#c62828 0 18px,#1f3c88 18px 36px);}',
  '.hp-chapter .n{font:15px "Special Elite";letter-spacing:.2em;margin-top:6px;}',
  '.hp-chapter .t{font:28px/1.05 "Special Elite";margin:6px 0;}',
  '.hp-chapter .s{font:12px "Special Elite";opacity:.7;}',
  '.hp-chapter .ja{font-size:13px!important;color:#333;}',
  '.hp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;}',
  '.hp-loading{position:absolute;left:0;right:0;bottom:calc(var(--bot-safe) + 30px);text-align:center;font:18px "VT323";color:#bbb;}'
].join('\n');

function initUI() {
  var st = document.createElement('style'); st.textContent = UI_CSS; document.head.appendChild(st);
  // HUD
  var hud = UIX.hud = el('div', 'hp-hud', null, UI);
  hud.style.display = 'none';
  var top = el('div', 'hp-hudtop', null, hud);
  var bars = el('div', 'hp-bars', null, top);
  el('div', 'hp-barlbl', 'STAMINA', bars); UIX.stam = el('div', 'hp-bar', '<i></i>', bars).firstChild;
  el('div', 'hp-barlbl', 'BATTERY', bars); var bb = el('div', 'hp-bar bat', '<i></i>', bars); UIX.batBar = bb; UIX.bat = bb.firstChild;
  UIX.obj = el('div', 'hp-obj', '', top);
  UIX.bell = el('div', 'hp-bell', '', top);
  UIX.pauseBtn = el('div', 'hp-pausebtn pe', 'II', top);
  onTap(UIX.pauseBtn, function () { press('pause'); });
  UIX.rec = el('div', 'hp-rec', '<i></i>REC <span></span>', hud);
  UIX.prompt = el('div', 'hp-prompt', '', hud);
  UIX.sub = el('div', 'hp-sub', '', UI);
  UIX.toast = el('div', 'hp-toast', '', UI);
  UIX.minimap = el('div', 'hp-minimap', '<canvas width="248" height="248"></canvas><b>MAP</b>', hud); UIX.minimap.style.display = 'none';
  UIX.stickHint = el('div', 'hp-stickhint', 'MOVE<br>移動', hud);
  UIX.hint = el('div', 'hp-hint', 'WASD move · MOUSE look · SHIFT run · C crouch · E interact · F light · Q item · SPACE hold breath', hud);
  // buttons
  function mkBtn(cls, ic, en, ja, cb, hold) {
    var b = el('div', 'hp-btn pe ' + cls, '<span class="ic">' + ic + '</span><span class="lb">' + en + '</span><span class="lj">' + ja + '</span>', hud);
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); b.classList.add('dn'); if (hold) hold(true); else cb(); });
    var up = function (e) { b.classList.remove('dn'); if (hold) hold(false); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    return b;
  }
  UIX.bInteract = mkBtn('big', '✋', 'USE', '調べる', function () { press('interact'); });
  UIX.bCrouch = mkBtn('', '⤓', 'CROUCH', 'しゃがむ', function () { press('crouch'); });
  UIX.bFlash = mkBtn('', '🔦', 'LIGHT', 'ライト', function () { press('flash'); });
  UIX.bItem = mkBtn('', '✦', 'ITEM', 'アイテム', function () { press('item'); });
  UIX.bBreath = mkBtn('', '🫁', 'HOLD', '息を止める', null, function (v) { INPUT.breathBtn = v; });
  UIX.inv = el('div', 'hp-inv pe', '', hud);
  // screens container
  UIX.screens = {};
  ['loading', 'warning', 'title', 'letter', 'chapter', 'settings', 'archive', 'pause', 'gameover', 'clear', 'vhs', 'note', 'lesson', 'fade', 'dialog'].forEach(function (n) { UIX.screens[n] = el('div', 'hp-scr', '', UI); });
  UIX.screens.fade.style.background = '#000'; UIX.screens.fade.style.pointerEvents = 'none'; UIX.screens.fade.style.transition = 'opacity .5s'; UIX.screens.fade.style.opacity = 0; UIX.screens.fade.style.display = 'block';
  layoutUI();
}
function uiTopSafe() { var d = document.createElement('div'); d.style.cssText = 'position:absolute;top:0;height:var(--top-safe);'; ROOT.appendChild(d); var h = d.getBoundingClientRect().height; ROOT.removeChild(d); return h || 110; }
function uiBotSafe() { var d = document.createElement('div'); d.style.cssText = 'position:absolute;bottom:0;height:var(--bot-safe);'; ROOT.appendChild(d); var h = d.getBoundingClientRect().height; ROOT.removeChild(d); return h || 12; }
function layoutUI() {
  if (!UIX.hud) return;
  var W = RENDER.w || window.innerWidth, H = RENDER.h || window.innerHeight;
  var bs = uiBotSafe();
  var small = H < 700;
  var by = H - bs - 8; // bottom line
  function place(b, cx, cy, size) { b.style.width = size + 'px'; b.style.height = size + 'px'; b.style.left = (cx - size / 2) + 'px'; b.style.top = (cy - size / 2) + 'px'; }
  var big = small ? 80 : 88, sm = small ? 58 : 62;
  var ix = W - 16 - big / 2, iy = by - big / 2;
  place(UIX.bInteract, ix, iy, big);
  place(UIX.bCrouch, ix - big / 2 - sm / 2 - 12, iy + 6, sm);
  place(UIX.bFlash, ix - big / 2 - sm / 2 - 8, iy - big / 2 - sm / 2 - 6, sm);
  place(UIX.bItem, ix, iy - big / 2 - sm / 2 - 14, sm);
  place(UIX.bBreath, ix - big / 2 - sm * 1.5 - 22, iy - 20, sm);
  UIX.inv.style.right = '16px'; UIX.inv.style.top = (iy - big / 2 - sm - 14 - 54) + 'px';
  UIX.stickHint.style.top = (by - 118) + 'px';
  UIX.prompt.style.top = (iy - big / 2 - sm - 130) + 'px';
  UIX.sub.style.bottom = (H - (iy - big / 2 - sm - 76)) + 'px';
  UIX.minimap.style.top = (by - 118 - 136) + 'px';
  UIX.hint.style.bottom = (bs + 6) + 'px';
  var pc = !isTouchDevice();
  [UIX.bInteract, UIX.bCrouch, UIX.bFlash, UIX.bItem, UIX.bBreath, UIX.stickHint].forEach(function (b) { b.style.display = pc ? 'none' : ''; });
  UIX.hint.style.display = pc ? '' : 'none';
  if (pc) { UIX.inv.style.top = ''; UIX.inv.style.bottom = (bs + 30) + 'px'; UIX.prompt.style.top = (H * 0.62) + 'px'; UIX.sub.style.bottom = (bs + 90) + 'px'; UIX.minimap.style.top = (H - bs - 190) + 'px'; }
}
function showScreen(n, html) { var s = UIX.screens[n]; if (html != null) s.innerHTML = html; s.classList.add('show'); return s; }
function hideScreen(n) { UIX.screens[n].classList.remove('show'); }
function hideAllScreens() { for (var n in UIX.screens) if (n !== 'fade') hideScreen(n); }
function fadeTo(v, sec) { var f = UIX.screens.fade; f.style.transition = 'opacity ' + (sec || 0.5) + 's'; f.style.opacity = v; return wait(sec || 0.5); }
var SUB = { t: 0 };
function showSubtitle(en, ja, dur, kind) {
  if (!SAVE.settings.subtitles && kind !== 'force') { /* JA still needed for comprehension */ }
  UIX.sub.className = 'hp-sub ' + (kind || '');
  UIX.sub.innerHTML = '<span class="box">' + bi(en, ja) + '</span>';
  SUB.t = dur || 3;
}
var TOAST = { t: 0 };
function showToast(en, ja, dur) {
  if (!UIX.toast) return;
  UIX.toast.innerHTML = (en ? '<span class="en">' + en + '</span>' : '') + (ja ? '<span class="ja">' + ja + '</span>' : '');
  UIX.toast.classList.add('show'); TOAST.t = dur || 2.2;
}
function updateUITimers(dt) {
  if (SUB.t > 0) { SUB.t -= dt; if (SUB.t <= 0) UIX.sub.innerHTML = ''; }
  if (TOAST.t > 0) { TOAST.t -= dt; if (TOAST.t <= 0) UIX.toast.classList.remove('show'); }
}
function setPrompt(en, ja) {
  if (!en) { UIX.prompt.classList.remove('show'); UIX.bInteract.classList.remove('pulse'); UIX._prompt = null; return; }
  var key = en + ja;
  if (UIX._prompt !== key) { UIX._prompt = key; UIX.prompt.innerHTML = '<span class="en" style="font-size:17px"><span class="k">' + (isTouchDevice() ? '✋' : 'E') + '</span>' + en + '</span><span class="ja" style="font-size:12px">' + ja + '</span>'; }
  UIX.prompt.classList.add('show'); UIX.bInteract.classList.add('pulse');
}
var ITEM_DEFS = {
  flashlight: { ic: '🔦', en: 'Flashlight', ja: '懐中電灯' },
  battery: { ic: '🔋', en: 'Batteries', ja: '電池', desc: 'Refills the flashlight.', descJa: '懐中電灯の電池を補充する。' },
  hallpass: { ic: '🎫', en: 'Hall Pass', ja: 'ホールパス', desc: 'Opens one locked door.', descJa: 'カギのかかったドアを1回だけ開けられる。' },
  horn: { ic: '📢', en: 'Air Horn', ja: '防犯ブザー', desc: 'Throw it. It screams for a long time and lures monsters.', descJa: '投げると長く鳴り続け、モンスターを引き寄せる。' },
  chalk: { ic: '🖍', en: 'Chalk', ja: 'チョーク', desc: 'Throw it to make a small sound.', descJa: '投げると小さな音で短時間気をそらす。' },
  star: { ic: '⭐', en: 'Gold Star', ja: '金星シール', desc: 'Makes a monster flinch once. Hoo-ray!', descJa: 'モンスターを1回だけひるませる。' },
  lunch: { ic: '🍱', en: 'Lunch Box', ja: 'ランチボックス', desc: 'Give it to a student to make a friend.', descJa: '生徒に渡すと味方になってくれる。' },
  bandaid: { ic: '🩹', en: 'Band-Aid', ja: '絆創膏', desc: 'Survive one attack.', descJa: '1回だけ攻撃に耐える。' },
  map: { ic: '🗺', en: 'Map Scrap', ja: '校内図の切れはし', desc: 'Shows part of the school map.', descJa: 'ミニマップの一部が見える。' }
};
function renderInventory() {
  var h = '';
  var counts = {}, order = [];
  PL.inv.forEach(function (it) { if (!counts[it]) { counts[it] = 0; order.push(it); } counts[it]++; });
  PL.invOrder = order;
  if (PL.sel >= order.length) PL.sel = 0;
  order.forEach(function (it, i) { h += '<div data-i="' + i + '" class="' + (i === PL.sel ? 'sel' : '') + '">' + ITEM_DEFS[it].ic + (counts[it] > 1 ? '<b>' + counts[it] + '</b>' : '') + '</div>'; });
  UIX.inv.innerHTML = h;
  Array.prototype.forEach.call(UIX.inv.children, function (d) { onTap(d, function () { PL.sel = +d.getAttribute('data-i'); renderInventory(); var it = PL.invOrder[PL.sel]; showToast(ITEM_DEFS[it].en, ITEM_DEFS[it].ja + '：' + ITEM_DEFS[it].descJa, 2.5); }); });
  var cur = order[PL.sel];
  UIX.bItem.querySelector('.ic').textContent = cur ? ITEM_DEFS[cur].ic : '✦';
  UIX.bItem.style.opacity = cur ? 1 : 0.4;
}
function hasItem(it) { return PL && PL.inv.indexOf(it) >= 0; }
function addItem(it) { PL.inv.push(it); renderInventory(); }
function takeItem(it) { var i = PL.inv.indexOf(it); if (i >= 0) { PL.inv.splice(i, 1); renderInventory(); return true; } return false; }
function updateHUD(dt) {
  if (!PL) return;
  UIX.stam.style.width = (PL.stamina * 100) + '%';
  UIX.stam.parentNode.classList.toggle('low', PL.exhausted);
  UIX.bat.style.width = PL.battery + '%';
  UIX.batBar.classList.toggle('low', PL.battery < 20);
  UIX.bFlash.classList.toggle('on', PL.flash);
  UIX.bCrouch.classList.toggle('on', PL.crouch);
  UIX.bBreath.classList.toggle('on', PL.breath);
  var dark = LIGHTU.uMix.value < 0.5;
  UIX.rec.style.display = dark && GAME.phase === 'transit' ? '' : 'none';
  if (dark) { var tt = GAME.clock || 0; var hh = 3, mm = Math.floor(tt / 60) % 60, ss = Math.floor(tt) % 60; UIX.rec.lastChild.textContent = '0' + hh + ':' + (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss + ' AM'; }
}


// ===== 17_lessons.js =====
// ---- lesson minigames -------------------------------------------------------------
var LESSON = null;
var LESSON_CSS = [
  '.hp-lesson{position:absolute;left:12px;right:12px;bottom:calc(var(--bot-safe) + 6px);max-height:56%;background:#f4efe0;color:#1b1b1b;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.6);padding:12px 12px 14px;overflow:hidden;',
  ' background-image:repeating-linear-gradient(#f4efe0 0 25px,#cfd8e8 25px 26px);}',
  '.hp-lesson:before{content:"";position:absolute;left:34px;top:0;bottom:0;width:2px;background:#e6a0a0;}',
  '.hp-lesson .hd{display:flex;justify-content:space-between;align-items:flex-start;padding-left:30px;}',
  '.hp-lesson .sub{font:20px Bungee;color:#1f3c88;} .hp-lesson .sub .ja{font-size:11px;color:#333;}',
  '.hp-lesson .qn{font:15px VT323;color:#555;}',
  '.hp-lesson .tbar{height:6px;background:#ddd;margin:6px 0 8px 30px;border-radius:3px;overflow:hidden;} .hp-lesson .tbar i{display:block;height:100%;background:#c62828;}',
  '.hp-lesson .q{font:22px/1.2 "Special Elite";padding-left:30px;min-height:34px;} .hp-lesson .q .ja{font-size:13px;color:#444;}',
  '.hp-lesson .opts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px;}',
  '.hp-lesson .opt{min-width:64px;min-height:56px;padding:6px 12px;border-radius:10px;border:2.5px solid #1b1b1b;background:#ffd84a;font:24px Bungee;color:#1b1b1b;box-shadow:0 4px 0 #1b1b1b;display:flex;align-items:center;justify-content:center;}',
  '.hp-lesson .opt:active{transform:translateY(3px);box-shadow:0 1px 0 #1b1b1b;}',
  '.hp-lesson .opt.ok{background:#8bdc6a;} .hp-lesson .opt.ng{background:#ff8f8f;} .hp-lesson .opt.used{opacity:.25;pointer-events:none;}',
  '.hp-lesson .slots{display:flex;gap:6px;justify-content:center;margin:8px 0;} .hp-lesson .slots span{width:34px;height:42px;border-bottom:3px solid #1b1b1b;font:28px Bungee;text-align:center;}',
  '.hp-lesson .beakers{display:flex;gap:10px;justify-content:center;margin-top:10px;}',
  '.hp-lesson .beaker{width:62px;height:80px;border-radius:0 0 18px 18px;border:3px solid #1b1b1b;border-top:none;position:relative;opacity:.55;transition:opacity .1s,transform .1s;}',
  '.hp-lesson .beaker.lit{opacity:1;transform:scale(1.12);box-shadow:0 0 22px currentColor;}',
  '.hp-lesson .lane{position:relative;height:120px;margin-top:6px;}',
  '.hp-lesson .ring{position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:4px solid #1f3c88;}',
  '.hp-lesson .note{position:absolute;left:50%;top:50%;border-radius:50%;border:4px solid #c62828;pointer-events:none;}',
  '.hp-lesson .tapz{position:absolute;inset:0;}',
  '.hp-lesson .art{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;width:min(260px,70%);margin:6px auto 0;}',
  '.hp-lesson .art div{aspect-ratio:1;border:2px solid #1b1b1b;background:#fff;font:16px Bungee;display:flex;align-items:center;justify-content:center;}',
  '.hp-lesson .pal{display:flex;gap:10px;justify-content:center;margin-top:8px;} .hp-lesson .pal div{width:56px;height:56px;border-radius:50%;border:3px solid #1b1b1b;font:18px Bungee;display:flex;align-items:center;justify-content:center;color:#fff;text-shadow:0 1px 2px #000;} .hp-lesson .pal div.sel{box-shadow:0 0 0 4px #fff,0 0 0 7px #1b1b1b;}',
  '.hp-lesson .fb{position:absolute;right:14px;top:10px;font:36px Bungee;transform:rotate(-8deg);}'
].join('\n');
var _lessonCssDone = false;
function runLesson(role, night, done, raidFn) {
  if (!_lessonCssDone) { var st = document.createElement('style'); st.textContent = LESSON_CSS; document.head.appendChild(st); _lessonCssDone = true; }
  var kinds = { MATH: lessonMath, ENGLISH: lessonEnglish, SCIENCE: lessonScience, MUSIC: lessonMusic, ART: lessonArt };
  var info = ROLE_INFO[role];
  var scr = showScreen('lesson', '');
  scr.style.pointerEvents = 'none';
  var panel = el('div', 'hp-lesson pe', '', scr);
  LESSON = { role: role, night: night, done: done, raidFn: raidFn, panel: panel, score: 0, total: 3, q: 0, paused: false, t: 0, upd: null, raidAt: raidFn ? R.int(1, 2) : -1, info: info, finished: false };
  kinds[role](LESSON);
}
function lessonHeader(L, extra) {
  return '<div class="hd"><div class="sub">' + L.info.en + '<span class="ja">' + L.info.ja + '・' + (L.subtitle || '') + '</span></div><div class="qn">Q ' + Math.min(L.q + 1, L.total) + '/' + L.total + '</div></div><div class="tbar"><i style="width:100%"></i></div>' + (extra || '');
}
function lessonTimer(L, sec, onTimeout) {
  L.qT = sec; L.qMax = sec; L.onTimeout = onTimeout;
  L.upd = function (dt) { L.qT -= dt; var b = L.panel.querySelector('.tbar i'); if (b) b.style.width = Math.max(0, L.qT / L.qMax * 100) + '%'; if (L.qT <= 0 && L.onTimeout) { var f = L.onTimeout; L.onTimeout = null; f(); } };
}
function lessonAnswer(L, ok, then) {
  if (ok) { L.score++; sfx('right'); } else sfx('wrong');
  var fb = el('div', 'fb', ok ? '<span style="color:#2e7d32">✓</span>' : '<span style="color:#c62828">✗</span>', L.panel);
  L.onTimeout = null;
  setTimeoutG(function () {
    if (!LESSON || LESSON !== L) return;
    L.q++;
    if (L.q === L.raidAt && L.raidFn && !L.raided) { L.raided = true; L.resumeFn = then; L.raidFn(); return; }
    if (L.q >= L.total) finishLesson(L); else then();
  }, 700);
}
function finishLesson(L) {
  if (L.finished) return; L.finished = true;
  var sc = clamp(Math.round(L.score / L.total * 3), 0, 3);
  hideScreen('lesson'); LESSON = null;
  L.done(sc);
}
function pauseLesson(v) {
  var L = LESSON; if (!L) return;
  if (v === 'hide') { UIX.screens.lesson.style.display = 'none'; L.paused = true; return; }
  if (v) { L.paused = true; return; }
  UIX.screens.lesson.style.display = ''; L.paused = false;
  if (L.resumeFn) { var f = L.resumeFn; L.resumeFn = null; if (L.q >= L.total) finishLesson(L); else f(); }
}
function abortLesson() { if (LESSON) { hideScreen('lesson'); UIX.screens.lesson.style.display = ''; LESSON = null; } }
function updateLesson(dt) { if (LESSON && !LESSON.paused && LESSON.upd) LESSON.upd(dt); }

// MATH -----------------------------------------------------------------
function lessonMath(L) {
  L.subtitle = '計算';
  var creepy = L.night >= 2;
  function gen(i) {
    if (creepy && i === 2) { var s = 6 + L.night, c = s - (L.night >= 3 ? 2 : 1); return { en: s + ' students. ' + c + ' chairs. How many are left standing?', ja: '生徒' + s + '人、椅子' + c + '個。立ったままの子は何人？', a: s - c }; }
    var a = R.int(2, 9 + L.night * 2), b = R.int(2, 9 + L.night), op = R.pick(L.night >= 2 ? ['+', '-', '×'] : ['+', '-']);
    if (op === '-' && b > a) { var t = a; a = b; b = t; }
    var ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    return { en: a + ' ' + op + ' ' + b + ' = ?', ja: '計算しよう', a: ans };
  }
  function ask() {
    var q = gen(L.q);
    var opts = [q.a]; while (opts.length < 4) { var w = q.a + R.int(-5, 5); if (w >= 0 && opts.indexOf(w) < 0) opts.push(w); }
    R.shuffle(opts);
    L.panel.innerHTML = lessonHeader(L, '<div class="q">' + q.en + '<span class="ja">' + q.ja + '</span></div><div class="opts">' + opts.map(function (o) { return '<div class="opt" data-v="' + o + '">' + o + '</div>'; }).join('') + '</div>');
    var answered = false;
    Array.prototype.forEach.call(L.panel.querySelectorAll('.opt'), function (b) { onTap(b, function () { if (answered) return; answered = true; var ok = +b.getAttribute('data-v') === q.a; b.classList.add(ok ? 'ok' : 'ng'); lessonAnswer(L, ok, ask); }); });
    lessonTimer(L, 11, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); });
  }
  ask();
}
// ENGLISH --------------------------------------------------------------
var WORDS = [['APPLE', 'りんご', '🍎'], ['CHAIR', '椅子', '🪑'], ['PENCIL', '鉛筆', '✏️'], ['SCHOOL', '学校', '🏫'], ['LUNCH', '昼ごはん', '🍱'], ['BELL', 'ベル', '🔔'], ['FRIEND', '友だち', '🤝'], ['LOCKER', 'ロッカー', '🗄'], ['TEACHER', '先生', '👩‍🏫'], ['OWL', 'フクロウ', '🦉'], ['BOOK', '本', '📕'], ['NIGHT', '夜', '🌙']];
var WORDS_CREEPY = [['STAY', 'ここにいて', '🪑'], ['SEAT', '席', '🪑'], ['HUSH', '静かに', '🤫'], ['ALWAYS', 'ずっと', '♾'], ['MISSING', '行方不明', '❓']];
function lessonEnglish(L) {
  L.subtitle = 'スペル';
  var pool = R.shuffle(WORDS.slice()).filter(function (w) { return w[0].length <= 4 + L.night; });
  function ask() {
    var w = (L.night >= 2 && L.q === 2) ? R.pick(WORDS_CREEPY) : pool[L.q % pool.length];
    var letters = w[0].split('');
    var extra = 'AEIOUXZQRT'.split('').filter(function (c) { return letters.indexOf(c) < 0; }); R.shuffle(extra);
    var tiles = R.shuffle(letters.concat(extra.slice(0, 2)).map(function (c, i) { return { c: c, i: i }; }));
    var pos = 0;
    L.panel.innerHTML = lessonHeader(L, '<div class="q">' + w[2] + ' Spell: <b>' + w[1] + '</b><span class="ja">「' + w[1] + '」を英語でつづろう</span></div><div class="slots">' + letters.map(function () { return '<span></span>'; }).join('') + '</div><div class="opts">' + tiles.map(function (t, i) { return '<div class="opt" data-i="' + i + '">' + t.c + '</div>'; }).join('') + '</div>');
    var slots = L.panel.querySelectorAll('.slots span'), answered = false;
    Array.prototype.forEach.call(L.panel.querySelectorAll('.opt'), function (b) {
      onTap(b, function () {
        if (answered) return;
        var c = tiles[+b.getAttribute('data-i')].c;
        if (c === letters[pos]) { slots[pos].textContent = c; pos++; b.classList.add('used'); sfx('tick'); if (pos >= letters.length) { answered = true; lessonAnswer(L, true, ask); } }
        else { b.classList.add('ng'); answered = true; lessonAnswer(L, false, ask); }
      });
    });
    lessonTimer(L, 9 + letters.length * 1.6, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); });
  }
  ask();
}
// SCIENCE (sequence memory) ------------------------------------------------
function lessonScience(L) {
  L.subtitle = '実験（順番を覚えて）';
  var cols = ['#e53935', '#1e88e5', '#fdd835', '#43a047'], names = ['RED', 'BLUE', 'YELLOW', 'GREEN'], freqs = [392, 494, 587, 698];
  function ask() {
    var len = 3 + L.q + (L.night >= 3 ? 1 : 0);
    var seq = []; for (var i = 0; i < len; i++) seq.push(R.int(0, 3));
    L.panel.innerHTML = lessonHeader(L, '<div class="q">Watch the experiment!<span class="ja">光る順番を覚えて、同じ順番でタップ！</span></div><div class="beakers">' + cols.map(function (c, i) { return '<div class="beaker" data-i="' + i + '" style="background:linear-gradient(transparent 30%,' + c + ' 30%);color:' + c + '"></div>'; }).join('') + '</div>');
    var bk = L.panel.querySelectorAll('.beaker'), input = false, pos = 0, answered = false;
    var show = 0, st = 0.6;
    L.qT = 99; L.onTimeout = null;
    L.upd = function (dt) {
      if (!input) {
        st -= dt;
        if (st <= 0) {
          Array.prototype.forEach.call(bk, function (b) { b.classList.remove('lit'); });
          if (show < seq.length * 2) { if (show % 2 === 0) { var k = seq[show / 2]; bk[k].classList.add('lit'); sfx('note', null, { f: freqs[k] }); } show++; st = show % 2 ? 0.55 : 0.18; }
          else { input = true; lessonTimer(L, 3 + len * 1.4, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); }); var q = L.panel.querySelector('.q'); q.innerHTML = 'Your turn! Mix it!<span class="ja">あなたの番！</span>'; }
        }
      } else if (L.qT !== undefined) { L.qT -= dt; var b = L.panel.querySelector('.tbar i'); if (b) b.style.width = Math.max(0, L.qT / L.qMax * 100) + '%'; if (L.qT <= 0 && L.onTimeout) { var f = L.onTimeout; L.onTimeout = null; f(); } }
    };
    Array.prototype.forEach.call(bk, function (b) {
      onTap(b, function () {
        if (!input || answered) return;
        var k = +b.getAttribute('data-i');
        b.classList.add('lit'); setTimeoutG(function () { b.classList.remove('lit'); }, 160);
        sfx('note', null, { f: freqs[k] });
        if (k === seq[pos]) { pos++; if (pos >= seq.length) { answered = true; sfx('bubble'); lessonAnswer(L, true, ask); } }
        else { answered = true; lessonAnswer(L, false, ask); }
      });
    });
  }
  ask();
}
// MUSIC (rhythm) ---------------------------------------------------------
function lessonMusic(L) {
  L.subtitle = 'リズム';
  L.total = 3; // 3 phrases
  var scaleF = [262, 294, 330, 349, 392, 440, 494, 523];
  function ask() {
    var n = 6, hits = 0, judged = 0, notes = [], t = 0, bpm = 96 + L.night * 8 + L.q * 6, beat = 60 / bpm;
    for (var i = 0; i < n; i++) notes.push({ at: 1.2 + i * beat * (i % 3 === 2 ? 1.5 : 1) + (i > 2 ? beat * 0.5 : 0), el: null, done: false, f: scaleF[(i * 3 + L.q) % 8] });
    L.panel.innerHTML = lessonHeader(L, '<div class="q">Tap when the circle hits the ring!<span class="ja">赤い円がリングに重なった瞬間にタップ！</span></div><div class="lane"><div class="ring"></div><div class="tapz pe"></div></div>');
    var lane = L.panel.querySelector('.lane');
    notes.forEach(function (nt) { nt.el = el('div', 'note', '', lane); });
    var tapz = L.panel.querySelector('.tapz');
    tapz.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      var best = null, bd = 9;
      notes.forEach(function (nt) { if (nt.done) return; var d = Math.abs(nt.at - t); if (d < bd) { bd = d; best = nt; } });
      if (best && bd < 0.2) { best.done = true; hits++; judged++; best.el.style.borderColor = '#2e7d32'; sfx('note', null, { f: best.f }); }
      else sfx('tick');
    });
    L.upd = function (dt) {
      t += dt;
      notes.forEach(function (nt) {
        var dtn = nt.at - t, sz = 70 + Math.max(0, dtn) * 120;
        nt.el.style.width = sz + 'px'; nt.el.style.height = sz + 'px'; nt.el.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px';
        nt.el.style.opacity = dtn > 1.4 ? 0 : (nt.done ? 0.3 : 1);
        if (!nt.done && dtn < -0.2) { nt.done = true; judged++; nt.el.style.borderColor = '#999'; }
      });
      if (judged >= n && !L._ansd) { L._ansd = true; lessonAnswer(L, hits >= n - 2, function () { L._ansd = false; ask(); }); }
    };
  }
  ask();
}
// ART (color by number) ----------------------------------------------------
function lessonArt(L) {
  L.subtitle = 'ぬりえ（番号の色でぬろう）';
  var pal = [['#f7c948', 1], ['#8b5a2e', 2], ['#1f3c88', 3]];
  var pics = [
    [3, 3, 3, 3, 3, 0, 2, 2, 2, 0, 2, 1, 2, 1, 2, 2, 2, 1, 2, 2, 0, 2, 2, 2, 0], // owl face
    [0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1], // star
    [2, 2, 2, 2, 2, 2, 3, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2] // creepy face
  ];
  function ask() {
    var pic = pics[L.night >= 3 && L.q === 2 ? 2 : L.q % 2];
    var sel = 0, cells, answered = false;
    L.panel.innerHTML = lessonHeader(L, '<div class="q" style="font-size:17px">Color the numbers!<span class="ja">色を選んで、同じ番号のマスをぬろう（空白はそのまま）</span></div><div class="art">' + pic.map(function (v, i) { return '<div data-i="' + i + '">' + (v || '') + '</div>'; }).join('') + '</div><div class="pal">' + pal.map(function (p, i) { return '<div data-c="' + i + '" class="' + (i === 0 ? 'sel' : '') + '" style="background:' + p[0] + '">' + p[1] + '</div>'; }).join('') + '</div>');
    var filled = pic.map(function () { return 0; });
    cells = L.panel.querySelectorAll('.art div');
    Array.prototype.forEach.call(L.panel.querySelectorAll('.pal div'), function (d) { onTap(d, function () { sel = +d.getAttribute('data-c'); Array.prototype.forEach.call(L.panel.querySelectorAll('.pal div'), function (x) { x.classList.remove('sel'); }); d.classList.add('sel'); sfx('tick'); }); });
    Array.prototype.forEach.call(cells, function (c) {
      onTap(c, function () {
        if (answered) return; var i = +c.getAttribute('data-i'); if (!pic[i]) return;
        filled[i] = sel + 1; c.style.background = pal[sel][0]; c.textContent = ''; sfx('bubble');
        var need = pic.filter(function (v) { return v; }).length, ok = 0, all = 0;
        pic.forEach(function (v, k) { if (v && filled[k]) all++; if (v && filled[k] === v) ok++; });
        if (all >= need) { answered = true; lessonAnswer(L, ok >= need - 1, ask); }
      });
    });
    lessonTimer(L, 22, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); });
  }
  ask();
}


// ===== 18_lore.js =====
// ---- lore: tapes, notes, archive -------------------------------------------------
var LORE = [
  { id: 'letter', kind: 'note', night: 1, kindEn: 'ENVELOPE', kindJa: '封筒', title: 'Your Admission Letter (no stamp)', titleJa: 'あなたの入学許可証（切手なし）',
    en: 'The envelope has no stamp and no return address. Only a gold star sticker and a smell of chalk dust. On the back, in pencil, a child has written: "THERE IS ALWAYS ONE LESS CHAIR."',
    ja: '封筒には切手も差出人もない。金星シールが1枚と、チョークの粉のにおい。裏には子どもの字で鉛筆書き：「椅子はいつも1つ足りない」' },
  { id: 'ep1', kind: 'vhs', night: 1, kindEn: 'VHS TAPE', kindJa: 'VHSテープ', title: "HOOTS' HOOT-HOOT HOMEROOM — EP.1 (1986)", titleJa: '「フーツのフーフー・ホームルーム」第1話（1986）',
    script: [
      { d: 2.5, s: 'bars', en: '', ja: '', tone: true },
      { d: 3, s: 'logo', en: 'Moonlight Learning Company presents...', ja: 'ムーンライト・ラーニング社がお届けします…', say: 'Moonlight Learning Company presents', st: 'pa' },
      { d: 4, s: 'title', en: "It's HOOTS' HOOT-HOOT HOMEROOM!", ja: '「フーツのフーフー・ホームルーム」はじまるよ！', say: "It's Hoots' Hoot Hoot Homeroom!", st: 'cute' },
      { d: 4, s: 'dance', en: "Hoo-ray for learning! I'm Professor Hoots!", ja: '学ぶって楽しい！フーツ先生だよ！', say: "Hoo-ray for learning! I'm Professor Hoots!", st: 'cute' },
      { d: 4.5, s: 'friends', en: 'And my friends: Penny Pencil, Bitsy Bookworm, and Mister Marbles!', ja: 'お友だちのペニー・ペンシル、ビッツィ・ブックワーム、ミスター・マーブルズ！', say: 'And my friends! Penny Pencil, Bitsy Bookworm, and Mister Marbles!', st: 'cute' },
      { d: 4, s: 'classroom', en: 'Remember, kids: a good student is always in their seat!', ja: 'いい子はいつも自分の席にいるんだよ！', say: 'Remember kids. A good student is always in their seat!', st: 'cute' },
      { d: 1.2, s: 'classroomExtra', en: '', ja: '（教室の後ろに、もう1人立っている…？）' },
      { d: 1.5, s: 'static', en: '', ja: '' }
    ] },
  { id: 'seating', kind: 'memo', night: 1, kindEn: 'MEMO', kindJa: 'メモ', title: 'MEMO: Seating Chart Protocol (1991)', titleJa: 'メモ：座席表規定（1991年）',
    en: 'TO: All Night School Staff\nRE: SEATING CHART PROTOCOL\n\nChairs are to be counted before every period. There must ALWAYS be one (1) fewer chair than enrolled students.\n\nStudents who remain standing when the bell rings are to be marked ABSENT.\n\nAbsent students do not go home.\n\n— Moonlight Learning Co., Dept. of Attendance',
    ja: '宛先：夜間学校の全職員\n件名：座席表規定\n\n椅子は毎時間の前に数えること。椅子は必ず在籍生徒数より1つ少なくすること。\n\nベルが鳴った時に立っている生徒は「欠席」とする。\n\n欠席の生徒は家に帰らない。\n\n― ムーンライト・ラーニング社 出席管理部' },
  { id: 'news88', kind: 'news', night: 1, kindEn: 'NEWSPAPER', kindJa: '新聞の切り抜き', title: 'Hollow Pines Gazette — Sept. 12, 1988', titleJa: 'ホロウパインズ・ガゼット 1988年9月12日',
    en: '"LEARN ALL NIGHT!" — TV OWL COMES TO HOLLOW PINES\n\nMoonlight Learning Co., makers of the hit children\'s show "Hoots\' Hoot-Hoot Homeroom," will open an experimental night school at Hollow Pines Middle School. "Children learn best when they are sleepy," said company founder Dr. Agnes Whitlow. "Our special lullaby helps the lessons stick." Enrollment is free.',
    ja: '「夜通し学ぼう！」テレビのフクロウがホロウパインズに\n\n人気子ども番組「フーツのフーフー・ホームルーム」を作るムーンライト・ラーニング社が、ホロウパインズ中学で実験的な夜間学校を開く。創業者アグネス・ウィットロー博士は「子どもは眠い時にこそよく学ぶ。特別な子守唄が勉強を定着させる」と語った。入学金は無料。' },
  { id: 'yearbook', kind: 'note', night: 2, kindEn: 'YEARBOOK PAGE', kindJa: '卒業アルバムの1ページ', title: 'Night Owls Yearbook 1990', titleJa: 'ナイトアウルズ卒業アルバム 1990',
    en: 'MOST LIKELY TO SUCCEED: Danny R.\nBEST SMILE: (photo removed)\nPERFECT ATTENDANCE: Student #0\n\nUnder Student #0 there is no photo, just long black scribbles. Someone has written "she never sat down" in the margin, then crossed it out, then written it again.',
    ja: '成功しそうな人：ダニー・R\nベストスマイル：（写真なし）\n皆勤賞：生徒ゼロ番\n\n生徒ゼロ番の欄に写真はなく、黒く長いなぐり書きだけ。余白に「あの子は一度も座らなかった」と書かれ、消され、また書かれている。' },
  { id: 'whitlow7', kind: 'cassette', night: 2, kindEn: 'CASSETTE', kindJa: 'カセットテープ', title: 'Dr. Whitlow — PROJECT LULLABY, log 7', titleJa: 'ウィットロー博士 ― PROJECT LULLABY 記録7',
    en: '"Log seven. The lullaby works. Subjects fall asleep in their chairs and wake up knowing the lesson. Remarkable. But the ones who do not get a chair... they do not wake up at all. They keep walking the halls. Subject zero has been standing in the east hallway for three weeks. She does not blink. She tilts her head when you look at her."',
    ja: '「記録7。子守唄は効いている。被験者は椅子で眠り、目覚めると授業内容を覚えている。驚異的だ。だが椅子に座れなかった者は…二度と目覚めない。廊下を歩き続ける。被験者ゼロは3週間、東廊下に立ったままだ。まばたきをしない。見つめると、首をかしげる。」' },
  { id: 'suit', kind: 'memo', night: 2, kindEn: 'MEMO', kindJa: 'メモ', title: 'Costume Dept. — Re: The Hoots Suit', titleJa: '衣装部 ― フーツの着ぐるみについて',
    en: 'The Hoots suit must NEVER be removed during broadcast hours. Broadcast hours are now 24 hours a day.\n\nIf the performer asks to remove the head, refuse politely. If the performer stops asking, that is normal.\n\nPlease stop leaving food inside the beak.',
    ja: 'フーツの着ぐるみは放送時間中、絶対に脱がないこと。放送時間は現在24時間である。\n\n演者が頭を外したいと言っても丁重に断ること。演者が頼まなくなったら、それは正常である。\n\nくちばしの中に食べ物を入れるのはやめてください。' },
  { id: 'ep0', kind: 'vhs', night: 3, kindEn: 'VHS TAPE', kindJa: 'VHSテープ', title: 'EPISODE 0 — MASTER — DO NOT AIR', titleJa: '第0話 ― マスター ― 放送禁止',
    script: [
      { d: 2, s: 'static', en: '', ja: '' },
      { d: 3.5, s: 'title', en: 'Hoots\' Hoot-Hoot Homeroom... episode... zero.', ja: '「フーツのフーフー・ホームルーム」…第…0話。', say: 'Hoots Hoot Hoot Homeroom. Episode zero.', st: 'creepy' },
      { d: 4, s: 'classroom', en: 'Today we learn musical chairs! Everyone stand up!', ja: '今日は椅子取りゲームを習います！みんな立って！', say: 'Today we learn musical chairs. Everyone stand up.', st: 'cute' },
      { d: 3.5, s: 'classroomExtra', en: 'Oh dear. Someone is left standing.', ja: 'あらあら。誰かが立ったままね。', say: 'Oh dear. Someone is left standing.', st: 'creepy' },
      { d: 3.5, s: 'hall', en: 'That is okay. She can wait in the hall. Forever.', ja: 'いいのよ。廊下で待ってもらいましょう。ずっと。', say: 'That is okay. She can wait in the hall. Forever.', st: 'creepy' },
      { d: 0.6, s: 'face', img: 10 },
      { d: 2, s: 'static', en: '', ja: '' }
    ] },
  { id: 'news93', kind: 'news', night: 3, kindEn: 'NEWSPAPER', kindJa: '新聞の切り抜き', title: 'Hollow Pines Gazette — Oct. 30, 1993', titleJa: 'ホロウパインズ・ガゼット 1993年10月30日',
    en: '"THE LONG BELL": 14 STUDENTS, 2 PERFORMERS MISSING AFTER SCHOOL BLACKOUT\n\nA power outage during a Moonlight Learning night session left 14 students and two costumed performers unaccounted for. Witnesses outside reported the school bell ringing for nearly an hour. Police found every classroom chair occupied — by no one. The company says the program will continue.',
    ja: '「長いベル」停電の夜間学校で生徒14人と着ぐるみ演者2人が行方不明\n\nムーンライト・ラーニングの夜間授業中に停電が起き、生徒14人と着ぐるみの演者2人の行方がわからなくなった。外にいた人々は、ベルが1時間近く鳴り続けていたと証言。警察が見つけたのは、全ての椅子が「誰にも」埋められていない教室だった。会社は授業を続けると発表した。' },
  { id: 'penny', kind: 'cassette', night: 3, kindEn: 'CASSETTE', kindJa: 'カセットテープ', title: 'Cassette labeled "PENNY — IF YOU FIND THIS"', titleJa: '「ペニー ― これを見つけたら」と書かれたカセット',
    en: '"If you find this, we are in the basement. Bitsy\'s suit is empty. Marbles\' suit is empty. Mine will be soon. Gerald wouldn\'t take off the owl head. He kept saying: it\'s not me wearing it anymore. It\'s wearing me. Don\'t... don\'t let it teach you anything."',
    ja: '「これを見つけたなら、私たちは地下にいる。ビッツィの着ぐるみは空っぽ。マーブルズのも空っぽ。私のもすぐそうなる。ジェラルドはフクロウの頭を外さなかった。ずっと言ってた。もう俺が着てるんじゃない、こいつが俺を着てるんだって。お願い…あいつに何も教わらないで。」' },
  { id: 'janitor', kind: 'memo', night: 4, kindEn: 'CUSTODIAN LOG', kindJa: '用務員の日誌', title: 'Custodian Log — Night Shift', titleJa: '用務員日誌 ― 夜勤',
    en: 'Mr. S — Halls mopped. Smile maintained.\nMr. S — Halls mopped. Smile maintained.\nMr. S — Halls mopped. Smile maintained.\n\nNote from Principal Merriweather: "He works best when nobody watches him. Do NOT watch him. If you see him standing still, he is waiting for you to look away."',
    ja: 'S氏 ― 廊下モップがけ済み。笑顔を維持。（×3）\n\nメリウェザー校長より：「彼は誰にも見られていない時に一番よく働く。見てはいけない。彼が止まっているのは、あなたが目をそらすのを待っているのだ。」' },
  { id: 'picture', kind: 'vhs', night: 4, kindEn: 'VHS TAPE', kindJa: 'VHSテープ', title: 'PICTURE DAY 1993 (Raw Footage)', titleJa: '写真撮影の日 1993（未編集映像）',
    script: [
      { d: 2, s: 'bars', en: '', ja: '', tone: true },
      { d: 4, s: 'photo', en: 'Okay class, squeeze in! Everybody say cheese!', ja: 'はい、みんな詰めて！チーズって言って！', say: 'Okay class, squeeze in! Everybody say cheese!', st: 'pa' },
      { d: 3.5, s: 'photoExtra', en: 'Wait. Who is that in the back row?', ja: '待って。後ろの列のあれは誰？', say: 'Wait. Who is that in the back row?', st: 'pa' },
      { d: 3, s: 'photoHoots', en: 'Hoo-ray! Say cheese forever!', ja: 'フーレイ！ずっとチーズって言っててね！', say: 'Hoo ray. Say cheese forever.', st: 'creepy' },
      { d: 0.5, s: 'face', img: 29 },
      { d: 1.5, s: 'static', en: '', ja: '' }
    ] },
  { id: 'closure', kind: 'news', night: 4, kindEn: 'NEWSPAPER', kindJa: '新聞の切り抜き', title: 'Hollow Pines Gazette — May 2, 1994', titleJa: 'ホロウパインズ・ガゼット 1994年5月2日',
    en: 'MOONLIGHT LEARNING CO. CLOSES ITS DOORS\n\nThe company behind "Hoots\' Hoot-Hoot Homeroom" has ceased operations. Dr. Agnes Whitlow could not be reached for comment; her office was found with every chair stacked upside down on the desks. Hollow Pines Middle School will close at the end of the term. "The school will be locked," said the mayor. "Nobody will be going there at night."',
    ja: 'ムーンライト・ラーニング社、閉鎖\n\n「フーツのフーフー・ホームルーム」の制作会社が事業を停止した。ウィットロー博士とは連絡が取れず、彼女の事務所では全ての椅子が机の上に逆さに積まれていた。ホロウパインズ中学は学期末で閉校する。市長は「校舎は施錠される。夜にあそこへ行く者はいない」と語った。' },
  { id: 'gerald', kind: 'cassette', night: 5, kindEn: 'CASSETTE', kindJa: 'カセットテープ', title: 'Cassette labeled "GERALD — DO NOT PLAY"', titleJa: '「ジェラルド ― 再生禁止」と書かれたカセット',
    en: '"I can\'t find the zipper. There isn\'t a zipper anymore. It\'s warm in here. The kids love me. They always loved me. Hoo... hoo. I just want them to finish school. Everyone should finish school. Nobody leaves early. Nobody. Leaves. Early. Hoo-ray... for learning."',
    ja: '「ファスナーが見つからない。もうファスナーなんてないんだ。中はあたたかい。子どもたちは僕が大好きだ。ずっと大好きだった。フー…フー。ただ卒業してほしいだけ。みんな学校を終えるべきなんだ。誰も早退しない。誰も。早退。しない。学ぶって…すばらしい。」' },
  { id: 'mailing', kind: 'memo', night: 5, kindEn: 'MEMO', kindJa: 'メモ', title: 'Admissions Office — Mailing List', titleJa: '入学事務局 ― 送付先リスト',
    en: 'Admission letters are to be sent to every adult who never finished school.\n\nEnrollment must reach 100%.\n\nThe bus will pick them up.\n\n(Your name is on the list. It has been circled in red crayon, with a little gold star next to it.)',
    ja: '入学許可証は、学校を卒業できなかった全ての大人に送ること。\n\n在籍率は100％に達しなければならない。\n\nバスが迎えに行く。\n\n（リストにあなたの名前がある。赤いクレヨンで丸がつけられ、横に小さな金星シールが貼ってある。）' }
];
LORE.forEach(function (l) { l.kindEn = l.kindEn || 'NOTE'; });
function unlockLore(l) {
  SAVE.lore[l.id] = 1; writeSave(); GAME.stats.lore = (GAME.stats.lore || 0) + 1;
  if (l.kind === 'vhs') { showToast('VHS TAPE: ' + l.title, l.titleJa + '（ARCHIVEか視聴覚室のビデオで再生）', 3.5); sfx('tape'); return; }
  if (l.kind === 'cassette') { showToast('CASSETTE', l.titleJa + '（ARCHIVEで再生できる）', 3); sfx('tape'); return; }
  openNote(l, true);
}
function openNote(l, inGame) {
  var prevMode = GAME.mode;
  if (inGame) { GAME.mode = 'read'; }
  var body = l.kind === 'cassette' ? '<div style="font:13px VT323;color:#777">▶ PLAY ──────── ' + (l.en.length / 14 | 0) + 's</div>' : '';
  var paper = l.kind === 'news' ? '#e9e2cf' : l.kind === 'memo' ? '#fffbe9' : '#f3ead6';
  var s = showScreen('note', '<div style="position:absolute;inset:0;background:rgba(0,0,0,.82)"></div><div class="hp-panel"><div class="hp-scroll pe" style="background:' + paper + ';color:#1b1b1b;border-radius:4px;padding:16px;max-height:100%;width:min(420px,100%);text-align:left;box-shadow:0 10px 40px #000;transform:rotate(-1deg)">' +
    '<div style="font:12px VT323;color:#666;letter-spacing:.15em">' + l.kindEn + ' · ' + l.kindJa + '</div><div style="font:20px/1.15 \'Special Elite\';margin:4px 0 2px">' + l.title + '</div><div style="font:700 12px Zen Kaku Gothic New;color:#555;margin-bottom:10px">' + l.titleJa + '</div>' + body +
    '<div class="tw" style="font-size:15px;line-height:1.5;white-space:pre-wrap">' + l.en + '</div><hr style="border:none;border-top:1px dashed #999;margin:12px 0"><div style="font:500 13px/1.7 Zen Kaku Gothic New;white-space:pre-wrap;color:#333">' + l.ja + '</div>' +
    '<button class="hp-menu-btn pe" id="hp-note-x" style="margin-top:14px">' + bi('CLOSE', '閉じる') + '</button></div></div>');
  if (l.kind === 'cassette') { sfx('tape'); setTimeout(function () { say(l.en.replace(/["\n]/g, ' '), l.id === 'gerald' ? 'creepy' : 'npc', { pitch: l.id === 'penny' ? 1.3 : 0.8, rate: 0.95 }); }, 500); if (AU.ready) setLoop('tapehiss', 0.05, 0.2); }
  onTap(document.getElementById('hp-note-x'), function () { hideScreen('note'); stopVoice(); if (AU.ready) setLoop('tapehiss', 0, 0.1); sfx('uiBack'); if (inGame && GAME.mode === 'read') GAME.mode = prevMode === 'read' ? 'play' : prevMode; });
}

// ---- VHS player -------------------------------------------------------------
var VHS = null;
function openVHSPicker(inGame) {
  var tapes = LORE.filter(function (l) { return l.kind === 'vhs' && SAVE.lore[l.id]; });
  if (!tapes.length) { showToast('NO TAPES', 'VHSテープを持っていない（校内で探そう）'); return; }
  if (inGame) GAME.mode = 'read';
  var h = '<div style="position:absolute;inset:0;background:rgba(0,0,0,.85)"></div><div class="hp-panel"><div class="hp-dlg"><h2>' + bi('VCR — CHOOSE A TAPE', 'テープを選ぶ') + '</h2>';
  tapes.forEach(function (t) { h += '<button class="hp-menu-btn dark pe" data-t="' + t.id + '" style="font-size:14px">' + bi(t.title, t.titleJa) + '</button>'; });
  h += '<button class="hp-x pe" id="hp-vhs-x" style="width:100%;margin-top:8px">CLOSE / 閉じる</button></div></div>';
  showScreen('vhs', h);
  Array.prototype.forEach.call(UIX.screens.vhs.querySelectorAll('[data-t]'), function (b) { onTap(b, function () { playVHS(LORE.filter(function (l) { return l.id === b.getAttribute('data-t'); })[0], inGame); }); });
  onTap(document.getElementById('hp-vhs-x'), function () { hideScreen('vhs'); if (inGame) GAME.mode = 'play'; });
}
function playVHS(tape, inGame) {
  sfx('tape');
  var bgmWas = AU.cur;
  playBGM(null, { fade: 0.3 });
  var s = showScreen('vhs', '<div style="position:absolute;inset:0;background:#000"></div><div class="hp-panel" style="justify-content:center"><div style="position:relative;width:min(420px,100%);aspect-ratio:4/3;background:#000;border-radius:18px;overflow:hidden;box-shadow:0 0 0 10px #222,0 0 0 12px #444">' +
    '<canvas id="hp-vhs-cv" width="320" height="240" style="width:100%;height:100%;display:block;image-rendering:pixelated;filter:contrast(1.15) saturate(1.2) blur(.4px)"></canvas>' +
    '<div style="position:absolute;inset:0;background:repeating-linear-gradient(rgba(0,0,0,.18) 0 1px,transparent 1px 3px);pointer-events:none"></div>' +
    '<div id="hp-vhs-osd" style="position:absolute;left:10px;top:8px;font:20px VT323;color:#fff;text-shadow:2px 2px #000">PLAY ▶</div></div>' +
    '<div id="hp-vhs-sub" style="min-height:64px;margin-top:12px;width:min(420px,100%)"></div>' +
    '<button class="hp-x pe" id="hp-vhs-stop" style="min-width:140px;margin-top:6px">■ STOP / 停止</button></div>');
  var cv = document.getElementById('hp-vhs-cv'), g = cv.getContext('2d');
  var i = -1, t = 0, segT = 0, last = performance.now();
  VHS = { tape: tape, stop: false };
  if (AU.ready) setLoop('tapehiss', 0.06, 0.2);
  function stop() { VHS.stop = true; stopVoice(); if (AU.ready) setLoop('tapehiss', 0, 0.1); hideScreen('vhs'); sfx('rewind'); if (inGame) { GAME.mode = 'play'; } else if (bgmWas) playBGM(bgmWas, { fade: 1 }); }
  onTap(document.getElementById('hp-vhs-stop'), stop);
  function nextSeg() {
    i++; segT = 0;
    if (i >= tape.script.length) { stop(); return; }
    var sg = tape.script[i];
    var sub = document.getElementById('hp-vhs-sub');
    if (sub) sub.innerHTML = sg.en || sg.ja ? '<div class="hp-sub" style="position:static"><span class="box">' + bi(sg.en || '', sg.ja || '') + '</span></div>' : '';
    if (sg.say) say(sg.say, sg.st || 'pa');
    if (sg.s === 'static' || sg.s === 'face') sfx('staticBurst', null, { len: sg.d });
    if (sg.tone) sfx('feedback');
  }
  nextSeg();
  (function frame() {
    if (VHS.stop) return;
    var n = performance.now(), dt = Math.min(0.05, (n - last) / 1000); last = n; t += dt; segT += dt;
    var sg = tape.script[i]; if (!sg) return;
    vhsDraw(g, sg, segT, t);
    if (segT > sg.d) nextSeg();
    requestAnimationFrame(frame);
  })();
}
function vhsDraw(g, sg, st, t) {
  var W = 320, H = 240;
  g.save();
  switch (sg.s) {
    case 'bars': ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'].forEach(function (c, i) { g.fillStyle = c; g.fillRect(i * W / 7, 0, W / 7 + 1, H * 0.7); }); g.fillStyle = '#111'; g.fillRect(0, H * 0.7, W, H * 0.3); fitText(g, 'MOONLIGHT LEARNING · MASTER', W / 2, H * 0.85, W * 0.9, 16, 'VT323', '#fff'); break;
    case 'logo': g.fillStyle = '#0d1a4a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff59d'; g.beginPath(); g.arc(W / 2, H * 0.4, 40, 0, TAU); g.fill(); g.fillStyle = '#0d1a4a'; g.beginPath(); g.arc(W / 2 - 14, H * 0.37, 38, 0, TAU); g.fill(); for (var s = 0; s < 20; s++) drawStar(g, (s * 61) % W, (s * 37) % (H * 0.7), 3, 'rgba(255,255,255,' + (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + s))) + ')'); fitText(g, 'MOONLIGHT LEARNING CO.', W / 2, H * 0.75, W * 0.9, 24, '"Luckiest Guy"', '#fff59d'); break;
    case 'title': { var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ff8a65'); gr.addColorStop(1, '#ffd54f'); g.fillStyle = gr; g.fillRect(0, 0, W, H); for (var r = 0; r < 7; r++) { g.strokeStyle = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'][r]; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, H * 1.05, 190 - r * 9, PI, 0); g.stroke(); } drawHoots(g, W / 2, H * 0.55, 0.6 + Math.sin(st * 6) * 0.02, { wave: (Math.sin(st * 6) + 1) / 2, creepy: sg.st === 'creepy' && Math.sin(st * 9) > 0.6 ? 1 : 0 }); fitText(g, "HOOTS' HOOT-HOOT HOMEROOM", W / 2, H * 0.12, W * 0.95, 22, '"Luckiest Guy"', '#1f3c88'); break; }
    case 'dance': case 'friends': { g.fillStyle = '#7fd3ff'; g.fillRect(0, 0, W, H); g.fillStyle = '#5d9b3a'; g.fillRect(0, H * 0.78, W, H * 0.22); var b = Math.abs(Math.sin(st * 5)) * 10; drawHoots(g, sg.s === 'dance' ? W / 2 : W * 0.2, H * 0.55 - b, 0.42, { wave: (Math.sin(st * 6) + 1) / 2 }); if (sg.s === 'friends') { drawPenny(g, W * 0.45, H * 0.5 - (st > 1 ? b : -80), 0.45); drawBitsy(g, W * 0.63, H * 0.62 - (st > 2 ? b * 0.5 : -80), 0.45, { t: st }); drawMarbles(g, W * 0.85, H * 0.6 - (st > 3 ? b : -80), 0.45); } for (var k = 0; k < 6; k++) drawStar(g, (k * 70 + st * 40) % W, 20 + (k * 23) % 60, 6, '#fff'); break; }
    case 'classroom': case 'classroomExtra': {
      g.fillStyle = '#d9d0b0'; g.fillRect(0, 0, W, H); g.fillStyle = '#23392d'; g.fillRect(40, 20, 240, 70); fitText(g, 'MUSICAL CHAIRS!', W / 2, 55, 220, 22, '"Special Elite"', '#eee');
      for (var row = 0; row < 3; row++) for (var c2 = 0; c2 < 5; c2++) { var x = 40 + c2 * 60, y = 120 + row * 38; g.fillStyle = '#8b5a2e'; g.fillRect(x, y + 14, 34, 6); g.fillStyle = ['#f28b82', '#a7ffeb', '#fff475', '#cbf0f8', '#d7aefb'][(row + c2) % 5]; g.beginPath(); g.arc(x + 17, y + 4, 9, 0, TAU); g.fill(); }
      drawHoots(g, 26, 150, 0.22, { wave: 0.5 });
      if (sg.s === 'classroomExtra') { g.fillStyle = 'rgba(10,10,12,0.92)'; g.fillRect(292, 96, 14, 60); g.beginPath(); g.arc(299, 92, 9, 0, TAU); g.fill(); g.fillRect(290, 92, 18, 40); }
      break; }
    case 'hall': { g.fillStyle = '#0b0f0d'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2a3a30'; for (var l = 0; l < 10; l++) { g.beginPath(); g.moveTo(W / 2, H * 0.45); g.lineTo(l * W / 9, H); g.stroke(); } g.fillStyle = '#1c2a22'; g.fillRect(W / 2 - 30, H * 0.3, 60, 50); g.fillStyle = 'rgba(200,210,200,0.85)'; g.fillRect(W / 2 - 3, H * 0.36, 6, 26); g.beginPath(); g.arc(W / 2, H * 0.35, 4, 0, TAU); g.fill(); fitText(g, 'CAM 04  10-30-93  03:12 AM', W / 2, H - 14, W * 0.9, 16, 'VT323', '#fff'); break; }
    case 'photo': case 'photoExtra': case 'photoHoots': {
      g.fillStyle = '#4a6fa5'; g.fillRect(0, 0, W, H); for (var pr = 0; pr < 3; pr++) for (var pc = 0; pc < 7; pc++) { var px = 30 + pc * 40 + (pr % 2) * 18, py = 70 + pr * 45; g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(px, py, 11, 0, TAU); g.fill(); g.fillStyle = ['#c62828', '#2e7d32', '#1565c0', '#f9a825'][(pr + pc) % 4]; g.fillRect(px - 13, py + 11, 26, 24); }
      if (sg.s !== 'photo') { g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(W - 30, 48, 12, 0, TAU); g.fill(); g.fillRect(W - 42, 48, 24, 40); }
      if (sg.s === 'photoHoots') drawHoots(g, W / 2, 50, 0.28, { creepy: 1 });
      fitText(g, 'HOLLOW PINES NIGHT SCHOOL · 1993', W / 2, H - 16, W * 0.9, 16, '"Special Elite"', '#fff'); break; }
    case 'face': g.fillStyle = '#000'; g.fillRect(0, 0, W, H); var im = FACE_TEX[sg.img] && FACE_TEX[sg.img].image; if (im) { g.drawImage(im, 40 + (R() - 0.5) * 20, (R() - 0.5) * 20, 240, 240); } break;
    case 'static': default: { var id = g.createImageData(W, H), d = id.data; for (var p = 0; p < d.length; p += 4) { var v = Math.random() * 255; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; } g.putImageData(id, 0, 0); }
  }
  // tape noise overlay
  if (sg.s !== 'static') { var yb = (t * 60) % H; g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, yb, W, 6); if (R() < 0.08) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, R() * H, W, 1); } }
  g.restore();
}

// ---- archive -----------------------------------------------------------------
function openArchive(tab) {
  tab = tab || 'record';
  var tabs = [['record', 'RECORD', '記録'], ['files', 'FILES', '図鑑'], ['tapes', 'TAPES & NOTES', '資料']];
  var h = '<div style="position:absolute;inset:0;background:#0c0c0e"></div><div class="hp-panel" style="justify-content:flex-start"><div style="display:flex;gap:6px;width:100%;margin-bottom:10px">';
  tabs.forEach(function (t) { h += '<button class="hp-x pe" data-tab="' + t[0] + '" style="flex:1;' + (t[0] === tab ? 'background:#ffd84a;color:#111' : '') + '">' + t[1] + '<br><span style="font:700 10px Zen Kaku Gothic New">' + t[2] + '</span></button>'; });
  h += '</div><div class="hp-scroll pe" style="flex:1;width:100%;text-align:left">';
  if (tab === 'record') {
    h += '<div style="background:#f2ead2;color:#151515;padding:14px;border-radius:4px;font-family:\'Special Elite\'">' +
      '<div style="font-size:22px">STUDENT RECORD</div><div style="font:700 12px Zen Kaku Gothic New">生徒記録</div><hr>' +
      row('BEST NIGHT', '最高到達夜', SAVE.bestNight || 0) + row('NIGHTS SURVIVED', 'クリアした夜の数', SAVE.clears || 0) + row('TIMES LATE (DEATHS)', '遅刻（死亡）回数', SAVE.deaths || 0) +
      row('FILES', 'モンスター図鑑', Object.keys(SAVE.monsters).length + ' / 6') + row('TAPES & NOTES', '資料', Object.keys(SAVE.lore).length + ' / ' + LORE.length) + '</div>';
  } else if (tab === 'files') {
    Object.keys(MONSTER_INFO).forEach(function (k) {
      var info = MONSTER_INFO[k], known = SAVE.monsters[k];
      h += '<div style="display:flex;gap:10px;background:#1a1712;border:1px solid #3a3226;padding:10px;margin-bottom:10px;border-radius:4px">';
      h += '<div style="width:84px;height:84px;flex:none;background:#000;border:1px solid #444;position:relative;overflow:hidden">' + (known ? '<img src="' + assetURL('images/face_' + ('0' + FACE_DEFS[k].img).slice(-2) + '.jpg') + '" style="width:100%;height:100%;object-fit:cover;filter:grayscale(.5) contrast(1.2)">' : '<div style="color:#555;font:40px Bungee;text-align:center;line-height:84px">?</div>') + '<div style="position:absolute;left:0;right:0;bottom:0;background:#a00;color:#fff;font:10px VT323;text-align:center">' + (known ? 'CLASSIFIED' : 'UNKNOWN') + '</div></div>';
      h += '<div style="min-width:0"><div style="font:16px Bungee;color:#eee">' + (known ? info.name : '???') + '</div><div style="font:700 11px Zen Kaku Gothic New;color:#aaa">' + (known ? info.ja : '未遭遇') + '</div>';
      if (known) h += '<div style="font:13px VT323;color:#ff6b5a;margin:4px 0">' + info.file + '<br>' + info.fileJa + '</div><div class="tw" style="font-size:12px;color:#ccc;line-height:1.35">' + info.desc + '</div><div style="font:500 11px/1.5 Zen Kaku Gothic New;color:#999;margin-top:4px">' + info.descJa + '</div><div style="font:700 11px Zen Kaku Gothic New;color:#ffd84a;margin-top:4px">TIP: ' + info.tipJa + '</div>';
      h += '</div></div>';
    });
  } else {
    LORE.forEach(function (l) {
      var got = SAVE.lore[l.id];
      h += '<button class="hp-menu-btn dark pe" data-lore="' + l.id + '" style="font-size:13px;text-align:left;' + (got ? '' : 'opacity:.4') + '"><span class="en" style="font-size:11px;color:#ffd84a">' + l.kindEn + '</span>' + bi(got ? l.title : '— NOT FOUND —', got ? l.titleJa : '未発見') + '</button>';
    });
  }
  h += '</div><button class="hp-menu-btn alt pe" id="hp-arc-x" style="margin-top:10px">' + bi('BACK', 'もどる') + '</button></div>';
  showScreen('archive', h);
  function row(a, b, v) { return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #aaa"><span>' + a + '<br><span style="font:700 11px Zen Kaku Gothic New">' + b + '</span></span><span style="font-size:26px">' + v + '</span></div>'; }
  Array.prototype.forEach.call(UIX.screens.archive.querySelectorAll('[data-tab]'), function (b) { onTap(b, function () { sfx('ui'); openArchive(b.getAttribute('data-tab')); }); });
  Array.prototype.forEach.call(UIX.screens.archive.querySelectorAll('[data-lore]'), function (b) { onTap(b, function () { var l = LORE.filter(function (q) { return q.id === b.getAttribute('data-lore'); })[0]; if (!SAVE.lore[l.id]) return; sfx('ui'); if (l.kind === 'vhs') playVHS(l, false); else openNote(l, false); }); });
  onTap(document.getElementById('hp-arc-x'), function () { sfx('uiBack'); hideScreen('archive'); });
}


// ===== 19_title.js =====
// ---- title scene (bright 90s kids show), warning, letter, settings -------------
var TITLE = null;
function buildTitleScene() {
  var sc = new THREE.Scene();
  var sky = toTex(texDaySky(), { clamp: true });
  sc.background = sky;
  sc.fog = new THREE.Fog(0xbfe6ff, 30, 90);
  var hemi = new THREE.HemisphereLight(0xcfefff, 0x6a8a40, 0.75); sc.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff2d0, 0.9); sun.position.set(-10, 20, 14); sc.add(sun);
  function mat(c, o) { var m = new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 20 }, o || {})); return m; }
  var g = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(0x6fbf4a)); g.rotation.x = -PI / 2; sc.add(g);
  var road = new THREE.Mesh(new THREE.PlaneGeometry(60, 9), mat(0x555a60)); road.rotation.x = -PI / 2; road.position.set(0, 0.01, 9); sc.add(road);
  var walk = new THREE.Mesh(new THREE.PlaneGeometry(4, 8), mat(0xd8d2c0)); walk.rotation.x = -PI / 2; walk.position.set(0, 0.02, 3); sc.add(walk);
  // school facade
  var brickT = toTex(texBrick(29)); brickT.repeat.set(10, 3);
  var school = new THREE.Mesh(new THREE.BoxGeometry(34, 8.4, 12), mat(0xffffff, { map: brickT })); school.position.set(0, 4.2, -6); sc.add(school);
  var trim = new THREE.Mesh(new THREE.BoxGeometry(34.6, 0.5, 12.6), mat(0xf2efe4)); trim.position.set(0, 8.5, -6); sc.add(trim);
  var winM = mat(0x8fd6ff, { emissive: 0x2a5a80, shininess: 90 }), frameM = mat(0xf2efe4);
  for (var fl = 0; fl < 2; fl++) for (var i = 0; i < 12; i++) {
    var x = -15 + i * 2.7; if (Math.abs(x) < 2.5) continue;
    var w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.6), winM); w.position.set(x, 2.2 + fl * 4, 0.02); sc.add(w);
    var f1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.2), frameM); f1.position.set(x, 1.36 + fl * 4, 0.05); sc.add(f1);
  }
  var door = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.6), mat(0x8a3a30)); door.position.set(0, 1.3, 0.03); sc.add(door);
  var awn = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 2), mat(0xc62828)); awn.position.set(0, 3, 0.9); sc.add(awn);
  // sign on facade
  var sc2 = mkCanvas(1024, 160), sg = sc2.getContext('2d'); sg.fillStyle = '#f2efe4'; sg.fillRect(0, 0, 1024, 160); fitText(sg, 'HOLLOW PINES MIDDLE SCHOOL', 512, 84, 960, 80, '"Bungee", Impact', '#7a1010');
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.9), new THREE.MeshBasicMaterial({ map: toTex(sc2, { clamp: true }) })); sign.position.set(0, 6.6, 0.05); sc.add(sign);
  // flagpole, trees, bus
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 10, 8), mat(0xcccccc)); pole.position.set(-8, 5, 4); sc.add(pole);
  var flagC = mkCanvas(128, 80), fg = flagC.getContext('2d'); fg.fillStyle = '#1f3c88'; fg.fillRect(0, 0, 128, 80); fg.fillStyle = '#fff'; fg.fillRect(0, 34, 128, 12); drawStar(fg, 40, 40, 22, '#f7c948');
  var flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4, 10, 1), new THREE.MeshPhongMaterial({ map: toTex(flagC, { clamp: true }), side: THREE.DoubleSide })); flag.position.set(-6.85, 9, 4); sc.add(flag);
  for (var t = 0; t < 26; t++) {
    var tx = (t % 2 ? -1 : 1) * (20 + R() * 25), tz = -20 + R() * 30;
    var tr = new THREE.Group(); var tk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2, 6), mat(0x6d4c2e)); tk.position.y = 1; tr.add(tk);
    for (var k = 0; k < 3; k++) { var c = new THREE.Mesh(new THREE.ConeGeometry(2.2 - k * 0.5, 2.6, 8), mat(0x2e7d32)); c.position.y = 2.6 + k * 1.5; tr.add(c); }
    tr.position.set(tx, 0, tz); tr.scale.setScalar(0.8 + R() * 0.6); sc.add(tr);
  }
  var bus = new THREE.Group();
  var bb = new THREE.Mesh(new THREE.BoxGeometry(10, 2.6, 2.8), mat(0xf5b400)); bb.position.y = 1.8; bus.add(bb);
  var hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 2.6), mat(0xf5b400)); hood.position.set(5.7, 1.15, 0); bus.add(hood);
  for (var b = 0; b < 7; b++) { var bw = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), winM); bw.position.set(-4 + b * 1.25, 2.4, 1.41); bus.add(bw); }
  var stripe = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.15), mat(0x111111)); stripe.position.set(0, 1.5, 1.41); bus.add(stripe);
  [-3, 3.5].forEach(function (wx) { [-1.4, 1.4].forEach(function (wz) { var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14), mat(0x111111)); wh.rotation.x = PI / 2; wh.position.set(wx, 0.5, wz); bus.add(wh); }); });
  bus.position.set(8, 0, 9); sc.add(bus);
  // Professor Hoots
  var h = buildMonsterModel('hoots');
  h.rig.bones[0].userData.y0 = h.rig.bones[0].position.y;
  h.mats.forEach(function (m) { if (m.userData.probeOn) setProbe(m, [0.75, 0.72, 0.68], [0.75, 0.72, 0.68]); });
  h.head.visible = false;
  h.root.position.set(-0.9, 0, 7.2); h.root.rotation.y = 0.2; sc.add(h.root);
  // confetti stars
  var stars = new THREE.Group();
  var starTex = mkCanvas(64, 64); drawStar(starTex.getContext('2d'), 32, 32, 30, '#ffffff');
  var stT = toTex(starTex, { clamp: true });
  var cols = [0xffd84a, 0xff6b9d, 0x7fd3ff, 0x9cff7a, 0xffffff];
  for (var s = 0; s < 40; s++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: stT, color: cols[s % 5], transparent: true })); sp.position.set(R.range(-12, 12), R.range(1, 10), R.range(-2, 8)); sp.scale.setScalar(R.range(0.2, 0.5)); sp.userData.v = R.range(0.3, 1); stars.add(sp); }
  sc.add(stars);
  var cam = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
  TITLE = { scene: sc, cam: cam, hoots: h, t: 0, glitchT: 6, glitch: 0, flag: flag, stars: stars };
}
function updateTitle(dt) {
  var T = TITLE; T.t += dt;
  var asp = RENDER.w / RENDER.h;
  T.cam.aspect = asp; T.cam.fov = asp < 0.7 ? 68 : 52; T.cam.updateProjectionMatrix();
  var a = Math.sin(T.t * 0.12) * 0.25;
  T.cam.position.set(Math.sin(a) * 13, 2.3 + Math.sin(T.t * 0.3) * 0.2, 13 + Math.cos(a) * 1);
  T.cam.lookAt(-1, asp < 0.7 ? 1.1 : 2.6, 2);
  var R2 = T.hoots.rig, B = R2.byName;
  poseReset(R2); animIdle(R2, T.t);
  B.uaR.rotation.z = -2.3 + Math.sin(T.t * 7) * 0.45; B.faR.rotation.z = -0.3;
  B.uaL.rotation.z = 0.4; B.hips.position.y = R2.bones[0].userData.y0 + Math.abs(Math.sin(T.t * 3.5)) * 0.06;
  B.neck.rotation.y = Math.sin(T.t * 0.7) * 0.25;
  var ch = T.hoots.extra.costumeHead; ch.rotation.z = Math.sin(T.t * 3.5) * 0.08; ch.rotation.x = 0;
  T.stars.children.forEach(function (s) { s.position.y -= s.userData.v * dt; s.material.rotation += dt; if (s.position.y < 0) s.position.y = 10; });
  var fp = T.flag.geometry.attributes.position; for (var i = 0; i < fp.count; i++) { var x = fp.getX(i); fp.setZ(i, Math.sin(x * 2 + T.t * 5) * 0.12 * (x + 1.1)); } fp.needsUpdate = true;
  // occasional glitch: something else is on the tape
  T.glitchT -= dt;
  if (T.glitchT < 0) { T.glitch = 0.35; T.glitchT = R.range(7, 14); sfx('staticBurst', null, { len: 0.35 }); }
  if (T.glitch > 0) {
    T.glitch -= dt;
    POSTU.uGlitch.value = 1; POSTU.uTrack.value = 1; POSTU.uTint.value = 1; POSTU.uExposure.value = 0.45;
    ch.rotation.x = -1.2; T.hoots.head.visible = true; T.hoots.head.userData.U.uJaw.value = 0.9;
    if (T.glitch < 0.2 && T.glitch > 0.12) { POSTU.tFace.value = FACE_TEX[40]; POSTU.uFace.value = 0.6; POSTU.uFaceZoom.value = 0.8; } else POSTU.uFace.value = 0;
  } else {
    POSTU.uGlitch.value = 0; POSTU.uTrack.value = 0.05; POSTU.uTint.value = 0; POSTU.uExposure.value = 1.05; POSTU.uFace.value = 0;
    T.hoots.head.visible = false;
  }
  POSTU.uVHS.value = 0.4; POSTU.uFear.value = 0; POSTU.uDesat.value = 0; POSTU.uWarm.value = 0.15; POSTU.uGrain.value = 0.04; POSTU.uBlack.value = 0; POSTU.uRed.value = 0;
  LIGHTU.uTime.value = T.t;
  renderFrame(T.scene, T.cam);
}

// ---- screens -----------------------------------------------------------------
function showWarning() {
  GAME.mode = 'warning';
  showScreen('warning', '<div style="position:absolute;inset:0;background:#000"></div><div class="hp-panel">' +
    '<div style="font:30px Bungee;color:#ff3b30;letter-spacing:.05em">WARNING</div>' +
    '<div class="tw" style="font-size:16px;line-height:1.45;color:#eee;margin:10px 0 4px;max-width:360px">This game contains jump scares, loud sounds, and blood.</div>' +
    '<div style="font:700 14px/1.6 Zen Kaku Gothic New;color:#bbb;max-width:360px">※ホラー演出・急な大きい音・流血表現があります</div>' +
    '<div style="margin:22px 0 6px;font:22px VT323;color:#ddd;letter-spacing:.1em">🎧 HEADPHONES RECOMMENDED</div><div style="font:700 13px Zen Kaku Gothic New;color:#999">イヤホン推奨</div>' +
    '<div id="hp-tap" class="pe" style="margin-top:40px;padding:18px 26px;border:2px solid #fff;border-radius:8px;font:26px Bungee;color:#fff" ><span class="hp-blink">TAP TO START</span><div style="font:700 13px Zen Kaku Gothic New;color:#ccc;margin-top:4px">タップしてスタート</div></div>' +
    '<div style="position:absolute;bottom:0;left:0;right:0;font:13px VT323;color:#555">HOLLOW PINES NIGHT SCHOOL v' + GAME_VERSION + '</div></div>');
  var go = function (e) { e.preventDefault(); unlockAudio(); initLoops(); sfx('ui'); hideScreen('warning'); goTitle(); };
  var tap = document.getElementById('hp-tap');
  UIX.screens.warning.addEventListener('pointerup', go, { once: true });
}
function goTitle() {
  TIMERS.length = 0;
  hideAllScreens();
  UIX.hud.style.display = 'none';
  abortLesson(); removeTeacher(); stopVoice();
  clearMonsters(); clearNPCs();
  INPUT.enabled = false;
  try { if (document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
  if (AU.ready) { setLoop('wind', 0); setLoop('room', 0); setLoop('hum', 0); setLoop('tapehiss', 0); }
  POSTU.uBlack.value = 0; POSTU.uFace.value = 0; POSTU.uInvert.value = 0; POSTU.uRed.value = 0;
  if (!TITLE) buildTitleScene();
  GAME.mode = 'title';
  playBGM('happy', { fade: 1.2 });
  fadeTo(0, 0.6);
  var cont = SAVE.continueNight > 1 ? '<button class="hp-menu-btn alt pe" id="hp-cont">' + bi('CONTINUE · NIGHT ' + SAVE.continueNight, SAVE.continueNight + '夜目から続ける') + '</button>' : '';
  showScreen('title', '<div class="hp-panel" style="justify-content:space-between;padding:4px 0">' +
    '<div id="hp-logo" style="transform:rotate(-4deg);margin-top:18px">' +
    '<div style="font:clamp(40px,12vw,62px)/0.9 \'Luckiest Guy\';color:#ffd84a;-webkit-text-stroke:3px #1b1b1b;text-shadow:0 6px 0 #1b1b1b,0 0 30px rgba(255,255,255,.5)">HOLLOW PINES</div>' +
    '<div style="display:inline-block;margin-top:6px;padding:4px 14px;background:#1f3c88;border:3px solid #1b1b1b;border-radius:10px;font:clamp(20px,6vw,30px) Bungee;color:#fff;box-shadow:0 5px 0 #1b1b1b">NIGHT SCHOOL</div>' +
    '<div style="margin-top:8px;font:700 13px Zen Kaku Gothic New;color:#1b1b1b;text-shadow:0 0 6px #fff">ホロウパインズ夜間学校</div></div>' +
    '<div style="width:100%;padding-bottom:4px">' + cont +
    '<button class="hp-menu-btn pe" id="hp-start">' + bi('START', '入学する') + '</button>' +
    '<div style="display:flex;gap:10px;justify-content:center"><button class="hp-menu-btn alt pe" id="hp-set" style="width:auto;flex:1;max-width:145px;font-size:18px">' + bi('SETTINGS', '設定') + '</button>' +
    '<button class="hp-menu-btn alt2 pe" id="hp-arc" style="width:auto;flex:1;max-width:145px;font-size:18px">' + bi('ARCHIVE', '記録') + '</button></div>' +
    '<div style="font:13px VT323;color:#1b1b1b;opacity:.7">© 1986 MOONLIGHT LEARNING CO. · BEST NIGHT ' + (SAVE.bestNight || 0) + '</div></div></div>');
  onTap(document.getElementById('hp-start'), function () { sfx('ui'); showLetter(); });
  if (cont) onTap(document.getElementById('hp-cont'), function () { sfx('ui'); hideScreen('title'); GAME.hootsRevealed = !!SAVE.hootsRevealed; startNight(SAVE.continueNight); });
  onTap(document.getElementById('hp-set'), function () { sfx('ui'); openSettings(); });
  onTap(document.getElementById('hp-arc'), function () { sfx('ui'); openArchive(); });
}
function showLetter() {
  var html = '<div style="position:absolute;inset:0;background:rgba(20,40,80,.55)"></div><div class="hp-panel"><div class="hp-scroll pe" style="width:min(400px,100%);max-height:100%;background:#fffdf3;border-radius:6px;padding:18px 18px 14px;color:#1b1b1b;text-align:left;box-shadow:0 12px 40px rgba(0,0,0,.5);transform:rotate(1deg);border:8px solid transparent;border-image:repeating-linear-gradient(45deg,#c62828 0 12px,#fff 12px 24px,#1f3c88 24px 36px,#fff 36px 48px) 8">' +
    '<div style="text-align:center"><div style="font:24px \'Luckiest Guy\';color:#1f3c88">★ ADMISSION LETTER ★</div><div style="font:700 12px Zen Kaku Gothic New;color:#555">入学許可証</div></div>' +
    '<canvas id="hp-let-cv" width="200" height="120" style="display:block;margin:6px auto;width:140px;height:84px"></canvas>' +
    '<div class="tw" style="font-size:15px;line-height:1.5">Dear Student,<br><br>Congratulations! You have been accepted to <b>Hollow Pines Night School</b>, a second chance for grown-ups who never got to finish school.<br><br>Classes begin tonight. The bus will pick you up.</div>' +
    '<div style="font:500 12.5px/1.65 Zen Kaku Gothic New;color:#444;margin-top:6px">親愛なる生徒さんへ<br>おめでとう！あなたは「ホロウパインズ夜間学校」への入学を許可されました。学校を卒業できなかった大人のための、もう一度のチャンスです。授業は今夜から。バスが迎えに行きます。</div>' +
    '<div style="margin-top:10px;padding:10px;background:#fff3c4;border-radius:6px"><div class="tw" style="font-size:14px;line-height:1.5"><b>SCHOOL RULES</b><br>1. Attendance is mandatory.<br>2. Be in your seat when the bell rings.<br>3. Never stay in the halls after the lights go out.<br>4. If Professor Hoots asks you to stay after class, <u>say no</u>.</div>' +
    '<div style="font:500 12px/1.6 Zen Kaku Gothic New;color:#444;margin-top:4px">校則　1.出席は義務です。2.ベルが鳴る時は席に着いていること。3.電気が消えた後、廊下に残らないこと。4.フーツ先生に「放課後残りなさい」と言われたら、<u>断ること</u>。</div></div>' +
    '<div class="tw" style="text-align:right;font-size:14px;margin-top:8px">Hoo-ray for learning!<br>— Prof. Hoots, Moonlight Learning Co.</div>' +
    '<button class="hp-menu-btn pe" id="hp-enroll" style="margin-top:12px">' + bi('ENROLL', '入学する') + '</button>' +
    '<button class="hp-x pe" id="hp-let-back" style="width:100%;margin-top:4px">BACK / もどる</button></div></div>';
  showScreen('letter', html);
  var g = document.getElementById('hp-let-cv').getContext('2d'); drawHoots(g, 100, 64, 0.42, { wave: 1 }); drawStar(g, 30, 30, 14, '#f7c948'); drawStar(g, 172, 34, 11, '#f7c948');
  say('Congratulations! You have been accepted to Hollow Pines Night School!', 'cute');
  onTap(document.getElementById('hp-enroll'), function () {
    sfx('win'); SAVE.lore.letter = 1; SAVE.runSeed = (Date.now() & 0xffff) + 1; GAME.missing = []; GAME.carry = []; GAME.hootsRevealed = false; SAVE.hootsRevealed = false; writeSave();
    hideScreen('letter'); hideScreen('title'); startNight(1);
  });
  onTap(document.getElementById('hp-let-back'), function () { sfx('uiBack'); stopVoice(); hideScreen('letter'); });
}
function openSettings(onClose) {
  var S = SAVE.settings;
  function seg(key, vals) { return '<div class="hp-seg">' + vals.map(function (v) { return '<button class="pe ' + (S[key] === v[0] ? 'sel' : '') + '" data-k="' + key + '" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>'; }
  function rng(key, min, max, step) { return '<input class="hp-range pe" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S[key] + '" data-k="' + key + '">'; }
  function rowH(en, ja, ctl) { return '<div class="hp-row"><div class="lbl">' + bi(en, ja) + '</div>' + ctl + '</div>'; }
  var h = '<div style="position:absolute;inset:0;background:rgba(0,0,0,.85)"></div><div class="hp-panel"><div class="hp-dlg hp-scroll pe"><h2>' + bi('SETTINGS', '設定') + '</h2>' +
    rowH('MUSIC', 'BGM音量', rng('bgm', 0, 1, 0.05)) + rowH('SOUND FX', '効果音・声', rng('sfx', 0, 1, 0.05)) + rowH('LOOK SPEED', '視点感度', rng('sens', 0.3, 2.5, 0.05)) +
    rowH('GRAPHICS', '画質', seg('quality', [['AUTO', 'AUTO'], ['LOW', 'LOW'], ['MEDIUM', 'MED'], ['HIGH', 'HIGH']])) +
    rowH('JUMP SCARES', 'ジャンプスケアの強さ', seg('scare', [['NORMAL', 'NORMAL'], ['MILD', 'MILD']])) +
    rowH('INVERT Y', '上下反転', seg('invertY', [[false, 'OFF'], [true, 'ON']])) +
    '<div style="font:500 11px/1.6 Zen Kaku Gothic New;color:#888;margin-top:8px">MILD：叫び声の音量と画面のブレ・点滅を抑えます。<br>AUTO：動作が重いと自動で解像度を下げます。</div>' +
    '<button class="hp-menu-btn pe" id="hp-set-x" style="margin-top:12px">' + bi('DONE', '完了') + '</button></div></div>';
  var s = showScreen('settings', h);
  Array.prototype.forEach.call(s.querySelectorAll('button[data-k]'), function (b) {
    onTap(b, function () {
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); if (v === 'true') v = true; if (v === 'false') v = false;
      S[k] = v; writeSave(); sfx('ui');
      Array.prototype.forEach.call(s.querySelectorAll('button[data-k="' + k + '"]'), function (x) { x.classList.toggle('sel', x === b); });
      if (k === 'quality') applyQuality(v);
    });
  });
  Array.prototype.forEach.call(s.querySelectorAll('input[data-k]'), function (inp) {
    inp.addEventListener('input', function () { S[inp.getAttribute('data-k')] = +inp.value; applyVolumes(); });
    inp.addEventListener('change', function () { writeSave(); sfx('tick'); });
    inp.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  });
  onTap(document.getElementById('hp-set-x'), function () { sfx('uiBack'); hideScreen('settings'); writeSave(); if (onClose) onClose(); });
}


// ===== 20_game.js =====
// game-time timers (pause-safe; only tick while playing)
var TIMERS = [], TIMER_ID = 0;
function setTimeoutG(fn, ms) { var id = ++TIMER_ID; TIMERS.push({ id: id, t: (ms || 0) / 1000, fn: fn }); return id; }
function clearTimeoutG(id) { for (var i = 0; i < TIMERS.length; i++) if (TIMERS[i].id === id) { TIMERS.splice(i, 1); return; } }
function updateTimers(dt) { for (var i = 0; i < TIMERS.length; i++) TIMERS[i].t -= dt; var due = TIMERS.filter(function (t) { return t.t <= 0; }); if (!due.length) return; TIMERS = TIMERS.filter(function (t) { return t.t > 0; }); due.forEach(function (t) { try { t.fn(); } catch (e) { console.error(e); } }); }
// ---- game flow ------------------------------------------------------------------
var GAME = { mode: 'boot', phase: '', night: 1, lost: [], clock: 0, schedule: [], period: 0, timer: 0, items: [], hint: 0, mapReveal: {}, stats: {}, raidDone: false, lightMix: 1, lightTarget: 1, lessonLookAt: false, cut: false };
var CHAPTERS = [
  null,
  ['ORIENTATION', 'オリエンテーション'], ['DETENTION', '居残り'], ['PARENT-TEACHER NIGHT', '保護者面談の夜'], ['PICTURE DAY', '写真撮影の日'], ['GRADUATION', '卒業式']
];
var PERIOD_LABEL = [['1ST PERIOD', '1時間目'], ['2ND PERIOD', '2時間目'], ['LUNCH', '昼休み'], ['3RD PERIOD', '3時間目'], ['4TH PERIOD', '4時間目'], ['DISMISSAL', '下校']];
var DEATH_LINES = {
  student0: ["YOU'RE LATE FOR CLASS.", '遅刻だよ。'], crawler: ['NO RUNNING IN THE HALLS.', '廊下は走っちゃだめ。'], gaper: ['INDOOR VOICES, PLEASE.', '静かにね。'],
  smiles: ["SMILE! YOU'RE ON CAMERA.", '笑って。撮ってるよ。'], static: ['PLEASE STAND BY.', 'しばらくお待ちください。'], hoots: ['SEE ME AFTER CLASS.', '放課後、残りなさい。'], bell: ['THERE WAS NO SEAT FOR YOU.', 'あなたの席は、なかった。']
};
function nightParams(n) {
  return {
    transit: Math.max(45, [0, 90, 80, 70, 62, 55][Math.min(n, 5)] - Math.max(0, n - 5) * 2),
    deficit: n <= 2 ? 1 : (n <= 5 ? 2 : 3),
    npcs: Math.min(9, 6 + Math.min(n, 3)),
    maxMon: Math.min(4, n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 3 : 4),
    raid: n <= 1 ? 0.0 : Math.min(0.85, 0.35 + n * 0.1)
  };
}
function monstersForNight(n) {
  var pool = ['student0'];
  if (n >= 2) pool.push('crawler');
  if (n >= 3) pool.push('gaper', 'hoots');
  if (n >= 4) pool.push('smiles');
  if (n >= 5) pool.push('static');
  if (n <= 5) { // story order: newest first, then fill
    var list = [];
    var newest = { 1: 'student0', 2: 'crawler', 3: 'gaper', 4: 'smiles', 5: 'static' }[n];
    list.push(newest);
    if (n >= 3 && list.indexOf('hoots') < 0 && GAME.hootsRevealed) list.push('hoots');
    var rest = R.shuffle(pool.filter(function (t) { return list.indexOf(t) < 0 && (t !== 'hoots' || GAME.hootsRevealed); }));
    while (list.length < nightParams(n).maxMon && rest.length) list.push(rest.pop());
    return list;
  }
  return R.shuffle(pool).slice(0, nightParams(n).maxMon);
}

// ---------------------------------------------------------------------------
function disposeWorld() {
  if (!WORLD) return;
  RENDER.scene.remove(WORLD.group);
  WORLD.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
  WORLD = null;
  WORLD_GLASS.length = 0; for (var k in WORLD_GLASS_KEYS) delete WORLD_GLASS_KEYS[k];
  TV_MATS.length = 0;
  GAME.items.forEach(function (it) { if (it.mesh) RENDER.scene.remove(it.mesh); }); GAME.items = [];
  if (WFACE) { RENDER.scene.remove(WFACE); WFACE = null; }
}
async function startNight(n, fromRetry) {
  TIMERS.length = 0;
  GAME.mode = 'loading'; GAME.night = n; GAME.cut = true;
  INPUT.enabled = false;
  hideAllScreens(); UIX.hud.style.display = 'none';
  stopVoice();
  playBGM(null, { fade: 0.8 });
  await fadeTo(1, 0.6);
  showChapterCard(n);
  await wait(0.05);
  // build
  var t0 = performance.now();
  clearMonsters(); clearNPCs(); disposeWorld();
  var seed = (n * 7919 + (SAVE.runSeed || 1) * 104729 + (fromRetry ? 0 : 0)) >>> 0;
  GAME.rnd = makeRNG(seed ^ 0xa5a5);
  var M = generateMap(seed);
  buildWorld(M);
  RENDER.scene.add(WORLD.group);
  paintPosters(M, n, GAME.missing || []);
  paintBoards();
  setupSchedule(M, GAME.rnd);
  var P = nightParams(n);
  makeNPCs(n, P.npcs, GAME.rnd);
  GAME.lost = []; GAME.stats = { lost: 0, lore: 0, start: now() };
  GAME.items = []; GAME.period = 0; GAME.raidDone = false; GAME.hint = 0; GAME.mapReveal = {};
  newPlayer(1, 0, 0, 0);
  PL.inv = ['flashlight']; PL.battery = 100; if (n >= 2) PL.inv.push('chalk');
  if (GAME.carry) { GAME.carry.forEach(function (i) { if (i !== 'flashlight') PL.inv.push(i); }); }
  renderInventory();
  // first period: everyone seated in homeroom
  var room = GAME.schedule[0].room;
  room.chairs.forEach(function (c) { c.avail = true; c.occ = -1; setChairPose(c, 'normal'); });
  var free = room.chairs.slice();
  var pc = free.splice(GAME.rnd.int(0, Math.min(5, free.length - 1)), 1)[0];
  seatPlayer(pc, true);
  NPCS.forEach(function (np, i) { if (free.length) npcSeat(np, free.shift()); });
  NPCS.forEach(function (np) { finishNPC(np, 0.016); });
  setLights(1, true);
  // warm up shaders (avoid first-frame stalls)
  try { RENDER.renderer.compile(RENDER.scene, RENDER.camera); } catch (e) {}
  var buildMs = performance.now() - t0;
  window.__lastBuildMs = buildMs;
  await wait(Math.max(0.2, 2.2 - buildMs / 1000));
  GAME.mode = 'play'; GAME.cut = false;
  hideScreen('chapter');
  UIX.hud.style.display = '';
  INPUT.enabled = true;
  await fadeTo(0, 0.8);
  playBGM('nursery', { fade: 1.5, restart: true });
  SAVE.continueNight = n; writeSave();
  beginLesson(0);
}
function setupSchedule(M, rnd) {
  var lessonRooms = M.slots.filter(function (r) { return ROLE_INFO[r.role].lesson; });
  rnd.shuffle(lessonRooms);
  var four = lessonRooms.slice(0, 4);
  GAME.schedule = [
    { kind: 'class', room: four[0] }, { kind: 'class', room: four[1] }, { kind: 'lunch', room: M.cafe },
    { kind: 'class', room: four[2] }, { kind: 'class', room: four[3] }, { kind: 'bus', room: M.busRoom }
  ];
  GAME.schedule.forEach(function (s, i) { s.label = PERIOD_LABEL[i]; });
  // raid period choice
  var P = nightParams(GAME.night);
  GAME.raidPeriods = {};
  if (GAME.night === 1) GAME.raidPeriods[1] = true;
  else { [0, 1, 3, 4].forEach(function (i) { if (i > 0 && rnd() < P.raid) GAME.raidPeriods[i] = true; }); if (!GAME.raidPeriods[1] && !GAME.raidPeriods[3] && !GAME.raidPeriods[4]) GAME.raidPeriods[rnd.pick([1, 3, 4])] = true; }
  if (GAME.night === 3 && !GAME.hootsRevealed) GAME.hootsRevealPeriod = 3;
}
function paintBoards() {
  WORLD.specials.boards.forEach(function (bd) {
    var r = MAP.rooms[bd.room];
    var info = ROLE_INFO[r.role];
    var lines = bd.lines || [{ t: info.en + ' — Rm ' + r.number, size: 46 }, { t: 'Teacher: Prof. Hoots', size: 30 }, { t: GAME.night >= 2 ? 'Attendance: ' + (GAME.night >= 4 ? 'FOREVER' : 'MANDATORY') : 'Welcome, Night Students!', size: 30 }];
    if (GAME.night >= 3 && R() < 0.3) lines = lines.concat([{ t: 'THERE IS ALWAYS ONE LESS CHAIR', size: 26, color: 'rgba(255,200,200,0.85)' }]);
    var c = texChalkboard(lines, bd.room * 3 + GAME.night);
    var old = bd.mesh.material.map; bd.mesh.material.map = toTex(c, { clamp: true }); bd.mesh.material.needsUpdate = true; if (old) old.dispose();
  });
}
function showChapterCard(n) {
  var ch = CHAPTERS[n] || ['SUMMER SCHOOL — NIGHT ' + n, '夏期講習 ' + n + '夜目'];
  showScreen('chapter', '<div class="hp-black" style="position:absolute;inset:0"></div><div class="hp-chapter"><div class="n">NIGHT ' + n + ' · CHAPTER ' + n + '</div><div class="t">' + ch[0] + '</div><span class="ja">' + ch[1] + '</span><div class="s">HOLLOW PINES NIGHT SCHOOL · TAPE ' + (100 + n) + ' · SP</div></div><div class="hp-loading hp-blink">▶ PLAY</div>');
}

// ---- lights -------------------------------------------------------------------
var FLICK = { t: 0, amt: 0, groups: [1, 1, 1, 1, 1, 1, 1, 1] };
function setLights(on, instant) {
  GAME.lightTarget = on ? 1 : 0;
  if (instant) { GAME.lightMix = GAME.lightTarget; LIGHTU.uMix.value = GAME.lightMix; }
}
function updateLights(dt) {
  if (GAME.lightTarget === 1 && GAME.lightMix < 1) {
    GAME._onT = (GAME._onT || 0) + dt;
    // fluorescent start: blink a few times
    var t = GAME._onT; var v = t < 0.15 ? 0 : t < 0.25 ? 1 : t < 0.4 ? 0 : t < 0.5 ? 0.8 : t < 0.65 ? 0.2 : Math.min(1, (t - 0.65) * 4 + 0.6);
    GAME.lightMix = v >= 1 ? 1 : v;
  } else if (GAME.lightTarget === 0) { GAME.lightMix = 0; GAME._onT = 0; }
  else GAME._onT = 0;
  LIGHTU.uMix.value = GAME.lightMix;
  // flicker per group
  FLICK.t += dt;
  var amt = FLICK.amt + (GAME.night >= 3 ? 0.04 : 0.015);
  for (var g = 0; g < 8; g++) {
    var f = 1;
    var n = Math.sin(FLICK.t * (13 + g * 3.1) + g * 7) * Math.sin(FLICK.t * (7.3 + g) + g);
    if (n > 1 - amt * 2) f = 0.25 + R() * 0.5;
    if (FLICK.amt > 0.5 && R() < FLICK.amt * 0.3) f = R() * 0.3;
    FLICK.groups[g] = damp(FLICK.groups[g], f, 30, dt);
    LIGHTU.uFlick.value[g] = FLICK.groups[g];
  }
  LIGHTU.uEmerg.value = 0.85 + Math.sin(FLICK.t * 31) * 0.05 + (Math.sin(FLICK.t * 2.3) > 0.97 ? -0.6 : 0);
  if (AU.ready) setLoop('hum', GAME.lightMix > 0.5 && GAME.mode === 'play' ? 0.03 * (0.6 + FLICK.amt) : 0, 0.1);
}
function lightsOut() {
  setLights(0, true);
  playBGM(null, { cut: true });
  sfx('lightsOut');
  POSTU.uFlash.value = 0;
  if (AU.ready) { setLoop('wind', 0.05, 1); setLoop('room', 0.08, 1); }
}
function lightsOn() {
  setLights(1);
  sfx('lightsOn');
  setTimeoutG(function () { if (GAME.mode === 'play') playBGM('nursery', { fade: 1.2 }); }, 700);
  if (AU.ready) { setLoop('wind', 0.0, 1); setLoop('room', 0.02, 1); }
  MONSTERS.forEach(function (m) { if (!m.raidKeep) { m.active = false; m.mdl.root.visible = false; } });
  WORLD.specials.tvs.forEach(tvOff);
}

// ---- player seat / hide --------------------------------------------------------
function seatPlayer(c, instant) {
  if (PL.seated) PL.seated.occ = -1;
  PL.seated = c; c.occ = -2; c.claim = -2;
  PL.li = c.li; PL.x = c.x; PL.z = c.z; PL.yaw = c.rot + PI; PL.pitch = -0.05; PL.vx = PL.vz = 0; PL.crouch = false;
  PL.y = LV_Y[c.li];
  if (!instant) sfx('thump');
}
function standPlayer() {
  var c = PL.seated; if (!c) return;
  c.occ = -1; c.claim = -1; PL.seated = null;
  // step out sideways or backward to a passable cell
  var cands = [[-Math.sin(c.rot) * 0.55, -Math.cos(c.rot) * 0.55], [Math.cos(c.rot) * 0.6, -Math.sin(c.rot) * 0.6], [-Math.cos(c.rot) * 0.6, Math.sin(c.rot) * 0.6], [0, 0]];
  for (var i = 0; i < cands.length; i++) { var x = c.x + cands[i][0], z = c.z + cands[i][1]; if (!blockedAt(c.li, x, z)) { PL.x = x; PL.z = z; break; } }
}
function enterHide(h) {
  PL.hidden = h; h.occ = 'P';
  PL.hideFrom = { x: PL.x, z: PL.z };
  PL.yaw = h.rot + PI; PL.pitch = 0; PL.vx = PL.vz = 0;
  // did a monster see me hide?
  PL.sawHide = MONSTERS.some(function (m) { return m.active && m.visible && m.state === 'chase' && m.li === PL.li && dist2(m.x, m.z, PL.x, PL.z) < 100 && losClear(m.li, m.x, m.z, PL.x, PL.z); });
  if (h.type === 'locker') { sfx('lockerClose', { li: h.li, x: h.x, z: h.z }); emitNoise(h.li, h.x, h.z, 4, 'locker'); }
  else if (h.type === 'stall') sfx('door', { li: h.li, x: h.x, z: h.z });
  else sfx('paper');
  showHideOverlay(h.type);
}
function exitHide() {
  var h = PL.hidden; if (!h) return;
  h.occ = null; PL.hidden = null; PL.sawHide = false;
  PL.x = h.ex; PL.z = h.ez;
  if (blockedAt(h.li, PL.x, PL.z) && PL.hideFrom) { PL.x = PL.hideFrom.x; PL.z = PL.hideFrom.z; }
  if (h.type === 'locker') sfx('lockerOpen', { li: h.li, x: h.x, z: h.z });
  showHideOverlay(null);
}
var HIDE_OV = null;
function showHideOverlay(type) {
  if (!HIDE_OV) {
    HIDE_OV = new THREE.Group(); RENDER.camera.add(HIDE_OV);
    // locker vents (slats)
    var slat = new THREE.MeshBasicMaterial({ color: 0x050505, fog: false });
    var lk = new THREE.Group(); lk.name = 'locker';
    for (var i = 0; i < 9; i++) { var b = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.032), slat); b.position.set(0, -0.15 + i * 0.045, -0.12); lk.add(b); }
    var fr1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), slat); fr1.position.set(0, 0.36, -0.12); lk.add(fr1);
    var fr2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), slat); fr2.position.set(0, -0.33, -0.12); lk.add(fr2);
    var fr3 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.4), slat); fr3.position.set(-0.2, 0.05, -0.119); lk.add(fr3);
    var fr4 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.4), slat); fr4.position.set(0.2, 0.05, -0.119); lk.add(fr4);
    HIDE_OV.add(lk);
    var st = new THREE.Group(); st.name = 'stall'; // stall door gap
    var sd = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ color: 0x0d1210, fog: false })); sd.position.set(-0.035, 0, -0.12); sd.scale.x = 0.9; st.add(sd);
    var sd2 = sd.clone(); sd2.position.x = 0.27; st.add(sd2);
    HIDE_OV.add(st);
    var bl = new THREE.Group(); bl.name = 'bleacher';
    for (var j = 0; j < 4; j++) { var p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.05), new THREE.MeshBasicMaterial({ color: 0x1b120a, fog: false })); p.position.set(0, 0.08 + j * 0.09, -0.12); bl.add(p); }
    HIDE_OV.add(bl);
    var dk = new THREE.Group(); dk.name = 'desk';
    var top = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.25), new THREE.MeshBasicMaterial({ color: 0x1a120a, fog: false })); top.position.set(0, 0.16, -0.12); dk.add(top);
    var leg = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.4), new THREE.MeshBasicMaterial({ color: 0x222222, fog: false })); leg.position.set(-0.14, -0.05, -0.119); dk.add(leg); var leg2 = leg.clone(); leg2.position.x = 0.14; dk.add(leg2);
    HIDE_OV.add(dk);
    HIDE_OV.children.forEach(function (c) { c.traverse(function (o) { if (o.material) { o.material.depthTest = false; o.renderOrder = 999; } }); });
  }
  var map = { locker: 'locker', stall: 'stall', bleacher: 'bleacher', desk: 'desk', table: 'desk', cot: 'desk', behind: null };
  HIDE_OV.children.forEach(function (c) { c.visible = map[type] === c.name; });
}

// ---- schedule / lessons ----------------------------------------------------------
function currentStop() { return GAME.schedule[GAME.period]; }
function beginLesson(i) {
  GAME.period = i;
  var st = currentStop();
  GAME.phase = st.kind === 'lunch' ? 'lunch' : 'lesson';
  GAME.lessonLookAt = true;
  hideHUDForLesson(true);
  updateObjective();
  if (st.kind === 'class') {
    var info = ROLE_INFO[st.room.role];
    var label = st.label;
    showToast(label[0] + ': ' + info.en, label[1] + '：' + info.ja + '（' + st.room.number + '）', 3);
    spawnTeacher(st.room);
    var intro = i === 0 ? introLines() : [['Welcome to ' + info.en.toLowerCase() + ', students! Hoo-ray for learning!', info.ja + 'の時間ですよ！学ぶって楽しいね！']];
    runLines(intro, 'hoots', function () {
      if (GAME.mode !== 'play') return;
      var raid = GAME.raidPeriods[i] || (GAME.hootsRevealPeriod === i);
      runLesson(st.room.role, GAME.night, function (score) { lessonFinished(score); }, raid ? function () { startRaid(); } : null);
    });
  } else if (st.kind === 'lunch') {
    showToast('LUNCH', '昼休み（カフェテリア）', 3);
    runLunch();
  }
}
function introLines() {
  if (GAME.night === 1) return [
    ['Good evening, night students! I am Professor Hoots! Hoo-hoo!', 'こんばんは、夜間学校のみなさん！フーツ先生ですよ！'],
    ['Here at Hollow Pines, we learn all night long!', 'ホロウパインズでは、夜通しお勉強！'],
    ['When the bell rings, the lights go out. Find your next classroom...', 'ベルが鳴ると電気が消えます。次の教室を探してね…'],
    ['...and sit in a chair before the next bell! There are never enough chairs. Hoo-ray!', '…次のベルまでに椅子に座ること！椅子はいつも足りないの。フーレイ！']
  ];
  var L = [[["Welcome back! Did everyone sleep well? No? Hoo-hoo!", 'おかえりなさい！よく眠れた？眠れてない？フーフー！']], [["Some friends didn't come back today. Let's not talk about them.", '今日は来なかったお友達もいます。その話はやめましょうね。']], [["Parents are welcome tonight. They're waiting in the halls.", '今夜は保護者の方も来ています。廊下で待っていますよ。']], [["Picture day! Say cheese! Say it forever!", '写真撮影の日！チーズって言って！ずっと言っててね！']], [["Graduation night. Everyone graduates. Eventually.", '卒業の夜。みんな卒業するの。いつかはね。']]];
  return L[Math.min(GAME.night - 2, L.length - 1)] || L[0];
}
function runLines(lines, who, done) {
  var i = 0;
  GAME._linesSkip = false;
  function next() {
    if (GAME.mode !== 'play' && GAME.mode !== 'cut') return;
    if (i >= lines.length) { if (done) done(); return; }
    var l = lines[i++];
    var dur = Math.max(2.4, l[0].length * 0.065);
    showSubtitle((who === 'hoots' ? 'PROF. HOOTS: ' : who === 'pa' ? 'PA: ' : '') + l[0], l[1], dur, who);
    if (who === 'hoots') { say(l[0], GAME.night >= 4 && R() < 0.3 ? 'creepy' : 'cute'); if (TEACHER) TEACHER.talk = dur; }
    else if (who === 'pa') say(l[0], 'pa');
    else if (who === 'evil') say(l[0], 'creepy');
    GAME._lineTimer = setTimeoutG(next, dur * 1000);
  }
  next();
}
function lessonFinished(score) {
  if (GAME.mode !== 'play') return;
  GAME.hint = score; // 0..3
  var next = GAME.schedule[GAME.period + 1];
  var nr = next.room;
  var where = next.kind === 'bus' ? ['the SCHOOL BUS out front', '正面のスクールバス'] : next.kind === 'lunch' ? ['the CAFETERIA (west wing, 1F)', '1階 西ウィングのカフェテリア'] : [ROLE_INFO[nr.role].en + (score >= 1 ? ', Room ' + nr.number + ' (' + LV_NAME[nr.li] + ')' : ''), ROLE_INFO[nr.role].ja + (score >= 1 ? '（' + nr.number + '号室・' + (nr.li === 2 ? '2階' : '1階') + '）' : '')];
  var lines = [];
  var grade = ['F', 'C', 'B', 'A+'][score];
  lines.push(['Grade: ' + grade + '! ' + (score >= 2 ? 'Hoo-ray! Gold star for you!' : score === 1 ? 'Not bad, not bad.' : 'Oh dear. Pay attention next time...'), '成績：' + grade + '！' + (score >= 2 ? 'すばらしい！' : score === 1 ? 'まあまあね。' : 'あらあら。次はちゃんと聞いてね…')]);
  lines.push(['Your next class is ' + where[0] + '.', '次の授業は ' + where[1] + ' です。']);
  if (score >= 2) {
    var route = routeHint(nr);
    if (route) lines.push(route);
    revealMapAround(nr);
  }
  if (score >= 3) { var gift = R.pick(['battery', 'chalk', 'star', 'bandaid', 'horn']); addItem(gift); lines.push(['Extra credit! Take this: ' + ITEM_DEFS[gift].en + '.', 'ごほうび！' + ITEM_DEFS[gift].ja + 'をどうぞ。']); sfx('sparkle'); }
  lines.push(['Remember: be in your seat when the bell rings!', 'ベルが鳴るまでに席に着くこと！']);
  runLines(lines, 'hoots', function () { endOfPeriod(); });
}
function routeHint(room) {
  var from = PL.seated ? { li: PL.li, x: PL.x, z: PL.z } : { li: PL.li, x: PL.x, z: PL.z };
  var e = roomEntryPoint(room);
  if (!e) return null;
  var p = findPath(from.li, from.x, from.z, e.li, e.x, e.z, 'p');
  if (!p) return null;
  GAME.routePath = p;
  var stairs = null;
  for (var i = 1; i < p.length; i++) if (p[i].li !== p[i - 1].li) { stairs = p[i].x < 30 ? ['the WEST stairs', '西階段'] : ['the EAST stairs', '東階段']; break; }
  var blocked = MAP.blockers.length ? ['Some halls are blocked tonight.', '今夜はふさがった廊下があるの。'] : null;
  if (stairs) return ['Psst... take ' + stairs[0] + '. ' + (blocked ? blocked[0] : ''), 'ヒント：' + stairs[1] + 'を使ってね。' + (blocked ? blocked[1] : '')];
  return ['Psst... stay on this floor. ' + (blocked ? blocked[0] : ''), 'ヒント：同じ階にあるわ。' + (blocked ? blocked[1] : '')];
}
function revealMapAround(room) { GAME.mapReveal[room.li] = true; GAME.mapReveal['t' + room.id] = true; }
function endOfPeriod() {
  if (GAME.mode !== 'play') return;
  removeTeacher();
  GAME.lessonLookAt = false;
  sfx('bell', null, { len: 2.4 });
  showSubtitle('*RRRRRRING*', '（ベルの音）', 2);
  setTimeoutG(function () { if (GAME.mode === 'play') startTransit(); }, 2300);
}

// ---- transit ----------------------------------------------------------------
function startTransit() {
  var next = GAME.schedule[GAME.period + 1];
  var P = nightParams(GAME.night);
  GAME.target = next.room;
  var alive = NPCS.filter(function (n) { return n.alive; }).length + 1;
  var k = Math.max(1, alive - P.deficit);
  // chairs: only k available in target room
  var chairs = next.room.chairs.filter(function (c) { return c.lesson !== false; });
  chairs.forEach(function (c) { c.avail = false; c.occ = -1; c.claim = -1; setChairPose(c, next.kind === 'bus' ? 'stacked' : 'stacked'); });
  var pick = GAME.rnd.shuffle(chairs.slice()).slice(0, Math.min(k, chairs.length));
  pick.forEach(function (c) { c.avail = true; setChairPose(c, 'normal'); });
  GAME.seatsTotal = pick.length;
  // leave current seat
  if (PL.seated) standPlayer();
  hideHUDForLesson(false);
  lightsOut();
  GAME.phase = 'transit'; GAME.monKills = 0;
  GAME.timer = P.transit; GAME.transitDur = P.transit; GAME.clock = 3 * 60 * 0 + GAME.period * 600 + 120;
  npcsBeginTransit(next.room, GAME.night, GAME.rnd);
  spawnNightMonsters();
  spawnItems();
  updateObjective();
  var paL = next.kind === 'bus' ? [['Dismissal. The last bus leaves at the bell. Do not miss it.', '下校です。最後のバスはベルと同時に出発します。乗り遅れないで。']] : [['Please proceed to your next class.', '次の教室へ移動してください。']];
  setTimeoutG(function () { if (GAME.phase === 'transit') { sfx('paStatic', null, { len: 3 }); runLines(paL, GAME.night >= 2 ? 'evil' : 'pa'); } }, 900);
  if (GAME.night === 1 && GAME.period === 0 && !SAVE.tutDone) { SAVE.tutDone = 1; writeSave(); setTimeoutG(function () { if (GAME.phase === 'transit') tutorialTip(); }, 1200); }
}
function tutorialTip() {
  GAME.mode = 'read';
  showDialog('<h2>' + bi('LIGHTS OUT', '消灯') + '</h2><p class="tw" style="font-size:15px;line-height:1.45">Find <b>' + ROLE_INFO[GAME.target.role].en + '</b> and sit in an empty chair before the bell.<br><span style="font-family:Zen Kaku Gothic New;font-size:13px;color:#ccc">次の教室（' + ROLE_INFO[GAME.target.role].ja + '）を探して、ベルが鳴る前に空いている椅子に座ろう。椅子は人数より少ない！</span></p>' +
    '<p style="font-size:13px;line-height:1.6;color:#ccc">・左下をドラッグで移動（強く倒すと走る）<br>・画面右側をドラッグで見回す<br>・🔦ライト：見えるけど見つかりやすい<br>・✋：調べる／隠れる／座る<br>・🫁 長押し：息を止める（止めすぎると咳き込む）<br>・扉の上の<b>部屋番号</b>を見て教室を探そう</p>', 'GOT IT / わかった', function () { if (GAME.mode === 'read') GAME.mode = 'play'; });
}
function spawnNightMonsters() {
  var types = monstersForNight(GAME.night);
  // keep existing ones, reactivate
  MONSTERS.slice().forEach(function (m) { if (m.gone || m.watcher) removeMonster(m); });
  types.forEach(function (t) {
    var m = MONSTERS.filter(function (q) { return q.type === t && !q.watcher; })[0];
    var sp = farSpawn(t === 'crawler' ? 12 : 18);
    if (!m) m = spawnMonster(t, sp.li, sp.x, sp.z);
    else { m.li = sp.li; m.x = sp.x; m.z = sp.z; m.y = floorY(sp.li, sp.x, sp.z); }
    m.active = true; m.raid = false; m.visible = t !== 'static'; m.mdl.root.visible = m.visible; m.path = null;
    setState(m, t === 'static' ? 'dormant' : 'patrol');
    m.grace = 4 + R() * 3; // no hunting right at lights-out
  });
  // harmless watcher Hoots before the reveal
  if (!GAME.hootsRevealed && R() < 0.7) {
    var w = farSpawn(14, true);
    var mw = spawnMonster('hoots', w.li, w.x, w.z, { watcher: true });
    mw.yaw = Math.atan2(PL.x - w.x, PL.z - w.z);
  }
}
function farSpawn(minD, corridor) {
  for (var k = 0; k < 60; k++) {
    var li = R() < 0.6 ? PL.li : R.pick([1, 2]);
    var p = corridor ? { li: li, x: R.range(3, 57), z: 11.25 } : randomPatrolPoint(li);
    if (!passable(p.li, m2c(p.x), m2r(p.z), 'p')) continue;
    var d = Math.sqrt(dist2(p.x, p.z, PL.x, PL.z)) + (p.li !== PL.li ? 15 : 0);
    if (d < minD) continue;
    if (GAME.target && roomAt(p.li, p.x, p.z) === GAME.target) continue;
    if (!corridor && !findPath(p.li, p.x, p.z, PL.li, PL.x, PL.z, 'm', 20000)) continue;
    return p;
  }
  return { li: 1, x: 55, z: 11.25 };
}
var ITEM_WEIGHTS = [['battery', 4], ['chalk', 4], ['horn', 2], ['star', 1.5], ['bandaid', 1.5], ['lunch', 1.5], ['map', 2], ['hallpass', 1.5]];
function spawnItems() {
  GAME.items.forEach(function (it) { if (it.mesh) RENDER.scene.remove(it.mesh); }); GAME.items = [];
  var spots = GAME.rnd.shuffle(MAP.itemSpots.slice());
  var n = 4 + GAME.rnd.int(0, 2);
  for (var i = 0; i < n && i < spots.length; i++) {
    var s = spots[i]; if (!passable(s.li, m2c(s.x), m2r(s.z), 'p')) continue;
    var tot = 0; ITEM_WEIGHTS.forEach(function (w) { tot += w[1]; });
    var r = GAME.rnd() * tot, kind = 'battery';
    for (var k = 0; k < ITEM_WEIGHTS.length; k++) { r -= ITEM_WEIGHTS[k][1]; if (r <= 0) { kind = ITEM_WEIGHTS[k][0]; break; } }
    addWorldItem(kind, s.li, s.x, s.z);
  }
  // lore pickup (one per transit if any left)
  var left = LORE.filter(function (l) { return !SAVE.lore[l.id] && (l.night || 1) <= GAME.night; });
  if (left.length && spots.length > n + 1) { var ls = spots[n + 1]; if (passable(ls.li, m2c(ls.x), m2r(ls.z), 'p')) addWorldItem('lore', ls.li, ls.x, ls.z, left[0]); }
}
var ITEM_MESH_CACHE = {};
function itemMesh(kind) {
  var g = new THREE.Group();
  var mk = function (geo, col, emi) { var m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: col, emissive: emi || 0x000000, shininess: 60 })); m.castShadow = true; g.add(m); return m; };
  if (kind === 'battery') { mk(new THREE.CylinderGeometry(0.02, 0.02, 0.07, 10), 0x222222).rotation.z = PI / 2; var t = mk(new THREE.CylinderGeometry(0.0205, 0.0205, 0.03, 10), 0xd4a020); t.rotation.z = PI / 2; t.position.x = 0.02; }
  else if (kind === 'chalk') { for (var i = 0; i < 3; i++) { var c = mk(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), [0xffffff, 0xffe0e0, 0xe0f0ff][i]); c.rotation.z = PI / 2; c.position.z = i * 0.02; } }
  else if (kind === 'horn') { mk(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), 0xc62828); var h = mk(new THREE.CylinderGeometry(0.05, 0.02, 0.08, 10), 0xeeeeee); h.position.y = 0.09; }
  else if (kind === 'star') { var s = new THREE.Shape(); for (var k = 0; k < 10; k++) { var a = k / 10 * TAU, r = k % 2 ? 0.025 : 0.06; if (k === 0) s.moveTo(Math.sin(a) * r, Math.cos(a) * r); else s.lineTo(Math.sin(a) * r, Math.cos(a) * r); } mk(new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }), 0xffd23f, 0x332200).rotation.x = -PI / 2; }
  else if (kind === 'lunch') { mk(new THREE.BoxGeometry(0.22, 0.14, 0.1), 0x2f6fd0); var hh = mk(new THREE.BoxGeometry(0.1, 0.03, 0.02), 0x222222); hh.position.y = 0.09; }
  else if (kind === 'bandaid') { mk(new THREE.BoxGeometry(0.09, 0.005, 0.03), 0xe8b48a); }
  else if (kind === 'map') { mk(new THREE.BoxGeometry(0.18, 0.004, 0.13), 0xe8e2c8).rotation.y = 0.4; }
  else if (kind === 'hallpass') { mk(new THREE.BoxGeometry(0.16, 0.006, 0.07), 0xd23b3b); }
  else if (kind === 'lore') { mk(new THREE.BoxGeometry(0.19, 0.025, 0.1), 0x111111); var lb = mk(new THREE.BoxGeometry(0.12, 0.027, 0.05), 0xf2ead2); }
  // glint
  var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: ITEM_MESH_CACHE.glint || (ITEM_MESH_CACHE.glint = toTex(texGlow('rgba(255,240,200,0.9)', 64), { clamp: true })), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 }));
  spr.scale.set(0.35, 0.35, 0.35); spr.position.y = 0.06; g.add(spr); g.userData.glint = spr;
  return g;
}
function addWorldItem(kind, li, x, z, lore) {
  var m = itemMesh(kind);
  m.position.set(x, floorY(li, x, z) + 0.03, z);
  RENDER.scene.add(m);
  GAME.items.push({ kind: kind, li: li, x: x, z: z, mesh: m, lore: lore });
}

// ---- interactions --------------------------------------------------------------
function findInteraction() {
  var P = PL;
  if (P.hidden) return { en: 'LEAVE', ja: '出る', fn: exitHide };
  if (P.seated) {
    if (GAME.phase === 'transit') return { en: 'STAND UP', ja: '立ち上がる', fn: standPlayer };
    if (GAME.phase === 'lunch' && GAME.lunchBox && !GAME.lunchBox.taken) return { en: 'TAKE LUNCH BOX', ja: 'ランチボックスを取る', fn: function () { GAME.lunchBox.taken = true; RENDER.scene.remove(GAME.lunchBox.mesh); addItem('lunch'); sfx('pickup'); showToast('LUNCH BOX', 'ランチボックスを手に入れた（生徒に渡すと味方に）'); } };
    return null;
  }
  if (GAME.phase !== 'transit' && GAME.phase !== 'raid') return null;
  var best = null, bd = 1e9;
  function cand(d, it) { if (d < bd) { bd = d; best = it; } }
  // items
  GAME.items.forEach(function (it) { if (it.li !== P.li) return; var d = Math.sqrt(dist2(it.x, it.z, P.x, P.z)); if (d < 1.3) cand(d - 0.3, { en: it.kind === 'lore' ? 'PICK UP ' + it.lore.kindEn : 'PICK UP ' + ITEM_DEFS[it.kind].en.toUpperCase(), ja: it.kind === 'lore' ? it.lore.kindJa + 'を拾う' : ITEM_DEFS[it.kind].ja + 'を拾う', fn: function () { pickupItem(it); } }); });
  // chairs in target room
  if (GAME.phase === 'transit' && GAME.target) GAME.target.chairs.forEach(function (c) { if (!c.avail || c.occ !== -1 || c.li !== P.li) return; var d = Math.sqrt(dist2(c.x, c.z, P.x, P.z)); if (d < 1.15) cand(d - 0.5, { en: 'SIT', ja: '座る', fn: function () { seatPlayer(c); checkAllSeated(); } }); });
  // hides
  MAP.hides.forEach(function (h) { if (h.li !== P.li || h.occ) return; var d = Math.sqrt(dist2(h.ex, h.ez, P.x, P.z)); if (d < 1.0) cand(d, { en: 'HIDE', ja: h.type === 'locker' ? 'ロッカーに隠れる' : h.type === 'desk' || h.type === 'table' ? '机の下に隠れる' : h.type === 'stall' ? '個室に隠れる' : h.type === 'bleacher' ? '観客席の下に隠れる' : h.type === 'cot' ? 'ベッドの下に隠れる' : '物陰に隠れる', fn: function () { enterHide(h); } }); });
  // npcs
  NPCS.forEach(function (n) {
    if (!n.alive || n.li !== P.li || n.seated) return;
    var d = Math.sqrt(dist2(n.x, n.z, P.x, P.z)); if (d > 1.8) return;
    if (n.state === 'lost') cand(d, { en: 'HELP ' + n.name.toUpperCase(), ja: n.name + 'を助ける（連れて行く）', fn: function () { n.state = 'follow'; n.lost = false; npcSay(n, "Thank you! I'll stay close.", 'ありがとう！ついて行くね。'); } });
    else if (hasItem('lunch') && !n.friend) cand(d + 0.2, { en: 'GIVE LUNCH BOX', ja: n.name + 'にランチを渡す', fn: function () { takeItem('lunch'); n.friend = true; npcSay(n, "For me? You're a real friend.", '私に？あなた、本当にいい人ね。'); } });
  });
  // locked doors
  MAP.doors.forEach(function (d) { if (!d.locked || d.li !== P.li) return; var dd = Math.sqrt(dist2(d.x, d.z, P.x, P.z)); if (dd < 1.6) cand(dd + 0.1, hasItem('hallpass') ? { en: 'USE HALL PASS', ja: 'ホールパスで開ける', fn: function () { takeItem('hallpass'); d.locked = false; d.open = 1; sfx('door', { li: d.li, x: d.x, z: d.z }); showToast('UNLOCKED', 'カギが開いた'); } } : { en: 'LOCKED', ja: 'カギがかかっている（ホールパスが必要）', fn: function () { sfx('rattle', { li: d.li, x: d.x, z: d.z }); } }); });
  // VCR
  MAP.slots.forEach(function (r) { if (!r.vcr || r.li !== P.li) return; var d = Math.sqrt(dist2(r.vcr.x, r.vcr.z, P.x, P.z)); if (d < 1.3) cand(d, { en: 'WATCH A TAPE', ja: 'ビデオを見る', fn: function () { openVHSPicker(true); } }); });
  return best;
}
function pickupItem(it) {
  RENDER.scene.remove(it.mesh);
  GAME.items.splice(GAME.items.indexOf(it), 1);
  sfx('pickup');
  if (it.kind === 'lore') { unlockLore(it.lore); return; }
  if (it.kind === 'battery') { PL.battery = Math.min(100, PL.battery + 55); showToast('BATTERIES', '電池を入れた（+55%）'); return; }
  if (it.kind === 'map') { var li = PL.li; GAME.mapReveal[li] = true; GAME.mapScrap = true; showToast('MAP SCRAP', '校内図の切れはし：' + (li === 2 ? '2階' : li === 0 ? '地下' : '1階') + 'の地図が見えるようになった'); return; }
  if (it.kind === 'bandaid') { PL.bandaid++; }
  addItem(it.kind);
  showToast(ITEM_DEFS[it.kind].en.toUpperCase(), ITEM_DEFS[it.kind].ja + '：' + ITEM_DEFS[it.kind].descJa, 3);
}
function useItem() {
  var it = PL.invOrder && PL.invOrder[PL.sel];
  if (!it) return;
  if (it === 'flashlight') { toggleFlash(); return; }
  if (it === 'battery') { takeItem('battery'); PL.battery = Math.min(100, PL.battery + 55); sfx('click'); return; }
  if (it === 'horn' || it === 'chalk') { throwItem(it); return; }
  if (it === 'star') {
    var m = MONSTERS.filter(function (q) { return q.active && q.visible && !q.watcher && q.li === PL.li && dist2(q.x, q.z, PL.x, PL.z) < 9; })[0];
    if (!m) { showToast('NO ONE IS CLOSE', '近くにモンスターがいない時は使えない'); return; }
    takeItem('star'); sfx('sparkle', mpos(m)); sfx('hoot', null, { pitch: 1.4 }); showSubtitle('"Gold star for you!"', '「金星シールをあげる！」', 2, 'hoots');
    setState(m, 'flinch'); m.path = null; POSTU.uFlash.value = 0.6;
    return;
  }
  if (it === 'bandaid') { showToast('BAND-AID', '絆創膏は持っているだけで1回攻撃に耐える'); return; }
  if (it === 'hallpass') { showToast('HALL PASS', 'カギのかかったドアの前で ✋'); return; }
  if (it === 'lunch') { showToast('LUNCH BOX', '生徒の近くで ✋ を押すと渡せる'); return; }
}
var THROWN = [];
function throwItem(kind) {
  takeItem(kind);
  sfx('throw');
  var f = camForward();
  var mesh = itemMesh(kind); mesh.position.set(PL.x + f.x * 0.4, PL.y + PL.eye - 0.2, PL.z + f.z * 0.4);
  RENDER.scene.add(mesh);
  var sp = kind === 'horn' ? 7 : 9;
  THROWN.push({ kind: kind, mesh: mesh, li: PL.li, vx: f.x * sp, vy: f.y * sp + 2.5, vz: f.z * sp, t: 0, landed: false, life: kind === 'horn' ? 8 : 1.5 });
}
function updateThrown(dt) {
  for (var i = THROWN.length - 1; i >= 0; i--) {
    var t = THROWN[i], m = t.mesh;
    if (!t.landed) {
      t.vy -= 9.8 * dt;
      var nx = m.position.x + t.vx * dt, nz = m.position.z + t.vz * dt, ny = m.position.y + t.vy * dt;
      if (!passable(t.li, m2c(nx), m2r(nz), 'm') || cellType(t.li, m2c(nx), m2r(nz)) === T_BLOCK && ny < LV_Y[t.li] + 1) { t.vx *= -0.3; t.vz *= -0.3; nx = m.position.x; nz = m.position.z; }
      var fy = floorY(t.li, nx, nz) + 0.03;
      if (ny <= fy) { ny = fy; t.landed = true; var p = { li: t.li, x: nx, z: nz };
        if (t.kind === 'chalk') { sfx('chalk', p); emitNoise(t.li, nx, nz, 14, 'chalk'); }
        else { sfx('horn', p, { len: t.life }); }
      }
      m.position.set(nx, ny, nz); m.rotation.x += dt * 8;
    } else {
      t.t += dt;
      if (t.kind === 'horn' && t.t < t.life) { t._n = (t._n || 0) - dt; if (t._n <= 0) { t._n = 0.5; emitNoise(t.li, m.position.x, m.position.z, 30, 'horn'); } }
      if (t.t > t.life + 6) { RENDER.scene.remove(m); THROWN.splice(i, 1); }
    }
  }
}
function checkAllSeated() {
  if (GAME.phase !== 'transit') return;
  var taken = GAME.target.chairs.filter(function (c) { return c.avail && c.occ !== -1; }).length;
  if (taken >= GAME.seatsTotal) endTransit('full');
}

// ---- end of transit: the bell ------------------------------------------------------
function endTransit(reason) {
  if (GAME.phase !== 'transit') return;
  GAME.phase = 'resolve';
  stopVoice();
  sfx('bellBad', null, { len: 3.2 });
  showSubtitle('*RRRRRRING*', reason === 'full' ? '（全部の席が埋まった！）' : '（時間切れ！）', 2.5, 'evil');
  if (PL.hidden) exitHide();
  var playerOK = !!PL.seated && roomAt(PL.li, PL.x, PL.z) === GAME.target;
  if (!playerOK) {
    // the player didn't get a seat
    setTimeoutG(function () { if (GAME.mode === 'play') caughtByBell(); }, 1500);
    return;
  }
  INPUT.enabled = true;
  // unseated NPCs are taken
  var victims = NPCS.filter(function (n) { return n.alive && !(n.seated && roomAt(n.li, n.x, n.z) === GAME.target); });
  victims.forEach(function (n, i) { setTimeoutG(function () { npcKilled(n, null); }, 1500 + i * 900); });
  // monsters vanish
  MONSTERS.forEach(function (m) { if (m.state === 'chase') setState(m, 'patrol'); });
  setTimeoutG(function () {
    if (GAME.mode !== 'play') return;
    lightsOn();
    GAME.items.forEach(function (it) { RENDER.scene.remove(it.mesh); }); GAME.items = [];
    if (victims.length) showToast(victims.length === 1 ? victims[0].name.toUpperCase() + ' IS GONE' : victims.length + ' STUDENTS ARE GONE', victims.map(function (v) { return v.name; }).join('、') + ' がいなくなった…', 3.5);
    GAME.stats.lost += victims.length;
    var next = GAME.period + 1;
    setTimeoutG(function () {
      if (GAME.mode !== 'play') return;
      if (GAME.schedule[next].kind === 'bus') nightCleared();
      else beginLesson(next);
    }, 2200);
  }, 1500 + victims.length * 900 + 1200);
}
function caughtByBell() {
  // pick a monster to take the player: nearest active (or student0)
  var m = MONSTERS.filter(function (q) { return q.active && !q.watcher; }).sort(function (a, b) { return dist2(a.x, a.z, PL.x, PL.z) - dist2(b.x, b.z, PL.x, PL.z); })[0];
  if (!m) m = spawnMonster('student0', PL.li, PL.x + 1, PL.z);
  startJumpscare(m, 'bell');
}
function onMonsterCatch(m) {
  if (GAME.mode !== 'play' || !PL.alive || PL.invuln > 0) return;
  if (PL.bandaid > 0 && GAME.phase !== 'resolve') {
    PL.bandaid--; takeItem('bandaid'); PL.invuln = 2.5;
    sfx('stab'); sfx('bandaid'); POSTU.uRed.value = 1; PL.shake = 1;
    showToast('THE BAND-AID HELD!', '絆創膏で耐えた！今のうちに逃げろ！', 2.5);
    setState(m, 'flinch'); m.path = null;
    return;
  }
  startJumpscare(m, m.type);
}

// ---- JUMPSCARE ------------------------------------------------------------------
var JS = null;
function startJumpscare(m, cause) {
  TIMERS.length = 0;
  GAME.mode = 'dead'; PL.alive = false; INPUT.enabled = false;
  stopVoice(); clearTimeoutG(GAME._lineTimer);
  if (typeof abortLesson === 'function') abortLesson();
  hideScreen('dialog');
  if (PL.hidden) { PL.hidden.occ = null; PL.hidden = null; showHideOverlay(null); }
  UIX.hud.style.display = 'none'; setPrompt(null);
  SAVE.deaths = (SAVE.deaths || 0) + 1; SAVE.monsters[m.type] = 2; writeSave();
  var mild = SAVE.settings.scare === 'MILD';
  JS = { m: m, t: 0, cause: cause, mild: mild, phase: 0, face: FACE_TEX[FACE_DEFS[m.type].img] };
  // place monster right in front of the player, lunging
  var f = camForward();
  m.active = true; m.visible = true; m.mdl.root.visible = true; m.ceilAmt = 0; m.watcher = false;
  m.li = PL.li;
  JS.start = { x: PL.x + f.x * 2.2, z: PL.z + f.z * 2.2 };
  m.x = JS.start.x; m.z = JS.start.z; m.yaw = Math.atan2(PL.x - m.x, PL.z - m.z);
  setState(m, 'chase'); m.jaw = 1;
  m.reveal = 1;
  POSTU.tFace.value = JS.face;
  sfx('jumpscare', null, { pitch: m.type === 'gaper' ? 0.8 : m.type === 'student0' ? 1.2 : 1 });
  playBGM(null, { cut: true });
  setTimeout(function () { showSkip(); }, 1000);
}
function showSkip() { if (!JS) return; showScreen('dialog', '<div style="position:absolute;right:16px;bottom:calc(var(--bot-safe) + 16px)"><button class="hp-x pe" id="hp-skip" style="min-width:110px">SKIP ▶▶<br><span style="font:11px Zen Kaku Gothic New">スキップ</span></button></div>'); onTap(document.getElementById('hp-skip'), function () { if (JS) JS.t = Math.max(JS.t, 2.4); }); }
function updateJumpscare(dt) {
  var J = JS; J.t += dt;
  var m = J.m, mild = J.mild;
  // phase A (0..0.35): 3D lunge, camera snaps to the face
  var t = J.t;
  var hp = playerHeadPos();
  var k = smooth(t / 0.32);
  var tx = lerp(J.start.x, PL.x + (J.start.x - PL.x) * 0.2, k), tz = lerp(J.start.z, PL.z + (J.start.z - PL.z) * 0.2, k);
  m.x = tx; m.z = tz;
  var headY = m.mdl.head.getWorldPosition(new THREE.Vector3()).y;
  var dx = m.x - PL.x, dz = m.z - PL.z;
  var wantYaw = Math.atan2(-dx, -dz);
  PL.yaw += angDiff(PL.yaw, wantYaw) * Math.min(1, dt * 18);
  var dy = headY - hp.y, dh = Math.sqrt(dx * dx + dz * dz);
  PL.pitch = damp(PL.pitch, Math.atan2(dy, dh), 18, dt);
  finishMonster(m, dt);
  m.mdl.rig.byName.neck.rotation.x = -0.2; m.mdl.rig.byName.head.rotation.z = Math.sin(t * 40) * 0.12;
  if (m.mdl.head.userData.U) m.mdl.head.userData.U.uJaw.value = 1;
  // phase B: full-screen face
  var f = 0;
  if (t > 0.3) f = 1;
  var zoom = 0.78 + Math.min(1, (t - 0.3) / 1.6) * (mild ? 0.15 : 0.55) + (t < 0.45 && !mild ? (0.45 - t) * 2 : 0);
  POSTU.uFace.value = f;
  POSTU.uFaceZoom.value = Math.min(3.5, zoom);
  var sh = mild ? 0.006 : 0.03;
  POSTU.uFaceShake.value.set((R() - 0.5) * sh * (1 + t), (R() - 0.5) * sh * (1 + t));
  POSTU.uInvert.value = !mild && (Math.floor(t * 14) % 7 === 0) && t > 0.35 && t < 1.6 ? 1 : 0;
  POSTU.uFlash.value = t > 0.3 && t < 0.36 && !mild ? 0.8 : 0;
  POSTU.uGlitch.value = t > 0.3 ? (mild ? 0.3 : 1) : 0.3;
  POSTU.uVHS.value = 1; POSTU.uRed.value = 0.3;
  PL.shake = mild ? 0.2 : 1.2;
  if (t > 2.4 && J.phase === 0) {
    J.phase = 1;
    POSTU.uFace.value = 0; POSTU.uInvert.value = 0; POSTU.uGlitch.value = 0; POSTU.uFlash.value = 0; POSTU.uBlack.value = 1;
    hideScreen('dialog');
    setTimeout(showGameOver, 500);
  }
}
function showGameOver() {
  var m = JS.m, line = DEATH_LINES[JS.cause] || DEATH_LINES[m.type] || DEATH_LINES.bell;
  JS = null;
  GAME.mode = 'gameover';
  POSTU.uBlack.value = 1;
  sfx('tape');
  var html = '<div style="position:absolute;inset:0;background:#000"></div>' +
    '<div class="hp-panel" style="justify-content:flex-start;padding-top:10px">' +
    '<div style="font:15px VT323;color:#888;letter-spacing:.2em;margin-bottom:8px">■ STOP  ·  NIGHT ' + GAME.night + '  ·  ' + GAME.schedule[Math.min(GAME.period + 1, 5)].label[0] + '</div>' +
    '<div style="font:34px/1.05 \'Special Elite\';color:#f2ede0;margin:10px 0 4px;text-shadow:0 0 12px rgba(255,0,0,.4)">' + line[0] + '</div>' +
    '<div style="font:700 15px Zen Kaku Gothic New;color:#b9b1a0;margin-bottom:14px">' + line[1] + '</div>' +
    '<div id="hp-go-card" style="width:min(330px,100%);border-radius:16px;background:linear-gradient(#7fd3ff,#ffe36e);border:3px solid #1b1b1b;padding:10px;opacity:0;transition:opacity .8s;box-shadow:0 6px 0 #1b1b1b">' +
    '<canvas id="hp-go-cv" width="300" height="190" style="width:100%;height:auto;display:block"></canvas>' +
    '<div style="font:24px \'Luckiest Guy\';color:#1f3c88;-webkit-text-stroke:1px #fff">"See you tomorrow, student!"</div><div style="font:700 13px Zen Kaku Gothic New;color:#333">「また明日ね、生徒さん！」</div></div>' +
    '<div style="margin-top:14px;width:100%">' +
    '<button class="hp-menu-btn pe" id="hp-retry">' + bi('TRY AGAIN', 'この夜をやり直す') + '</button>' +
    '<button class="hp-menu-btn alt pe" id="hp-totitle">' + bi('TITLE', 'タイトルへ') + '</button></div>' +
    '<div style="font:13px VT323;color:#777;margin-top:6px">BEST NIGHT: ' + (SAVE.bestNight || 0) + '  ·  DEATHS: ' + SAVE.deaths + '</div></div>';
  showScreen('gameover', html);
  setTimeout(function () {
    var cv = document.getElementById('hp-go-cv'); if (!cv) return;
    var g = cv.getContext('2d'); var tt = 0;
    var card = document.getElementById('hp-go-card'); card.style.opacity = 1;
    say('See you tomorrow, student!', 'cute');
    playBGM('happy', { fade: 2, restart: true });
    (function anim() { if (GAME.mode !== 'gameover') return; tt += 0.05; g.clearRect(0, 0, 300, 190); for (var i = 0; i < 12; i++) drawStar(g, (i * 53 + tt * 20) % 320 - 10, 20 + (i * 37) % 150, 6 + (i % 3) * 3, 'rgba(255,255,255,.8)'); drawHoots(g, 150, 105, 0.62, { wave: (Math.sin(tt * 4) + 1) / 2, blink: Math.sin(tt * 1.3) > 0.97 ? 0.5 : 0, glitch: 0 }); if (Math.sin(tt * 0.7) > 0.995) { g.fillStyle = '#000'; g.fillRect(0, 0, 300, 190); drawHoots(g, 150, 105, 0.62, { creepy: 1 }); } requestAnimationFrame(anim); })();
  }, 1200);
  onTap(document.getElementById('hp-retry'), function () { sfx('ui'); POSTU.uBlack.value = 0; startNight(GAME.night, true); });
  onTap(document.getElementById('hp-totitle'), function () { sfx('uiBack'); POSTU.uBlack.value = 0; goTitle(); });
}
// ---- night clear -------------------------------------------------------------
function nightCleared() {
  GAME.mode = 'cut'; INPUT.enabled = false;
  hideScreen('dialog');
  var n = GAME.night;
  SAVE.bestNight = Math.max(SAVE.bestNight || 0, n); SAVE.clears = (SAVE.clears || 0) + 1; SAVE.nightsSurvived = (SAVE.nightsSurvived || 0) + 1; SAVE.continueNight = n + 1;
  GAME.missing = (GAME.missing || []).concat(GAME.lost.map(function (v) { return { name: v.name, look: v.look, seed: v.seed, when: 'Last seen: night ' + n + ', after the bell' }; })).slice(-12);
  GAME.carry = PL.inv.filter(function (i) { return i !== 'flashlight'; }).slice(0, 4);
  if (n === 3) GAME.hootsRevealed = true;
  SAVE.hootsRevealed = GAME.hootsRevealed || SAVE.hootsRevealed;
  writeSave();
  sfx('engine', null, { len: 4 });
  UIX.hud.style.display = 'none';
  fadeTo(1, 1.5).then(function () {
    GAME.mode = 'clear';
    lightsOn(); playBGM('happy', { fade: 1.5, restart: true });
    var ending = n === 5 ? '<div class="tw" style="font-size:15px;line-height:1.5;color:#333;margin:8px 0">You graduated. The bus drives on through the pines.<br>On the seat next to you: a new envelope.<br><b>"ADMISSION LETTER — SUMMER SCHOOL"</b></div><div style="font:700 12px Zen Kaku Gothic New;color:#333">卒業した。バスは松林を走り続ける。隣の席には新しい封筒。「入学許可証 ― 夏期講習」</div>' : '';
    var html = '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#fff6b8,#ffb74d 60%,#ff7043)"></div><div class="hp-panel">' +
      '<div style="font:42px/1 \'Luckiest Guy\';color:#1f3c88;-webkit-text-stroke:2px #fff;transform:rotate(-3deg)">NIGHT ' + n + '</div><div style="font:34px \'Luckiest Guy\';color:#c62828;-webkit-text-stroke:2px #fff">SURVIVED!</div>' +
      '<div style="font:700 15px Zen Kaku Gothic New;color:#3b2a1a">' + n + '夜目 クリア！</div>' +
      '<canvas id="hp-cl-cv" width="300" height="170" style="width:min(300px,90%);height:auto"></canvas>' +
      '<div class="tw" style="font-size:16px;color:#1b1b1b">Students lost tonight: ' + GAME.stats.lost + '<br>いなくなった生徒：' + GAME.stats.lost + '人</div>' + ending +
      '<div style="width:100%;margin-top:10px"><button class="hp-menu-btn pe" id="hp-next">' + bi('NEXT NIGHT ▶', n + 1 + '夜目へ') + '</button><button class="hp-menu-btn alt pe" id="hp-cl-title">' + bi('TITLE', 'タイトルへ') + '</button></div></div>';
    showScreen('clear', html);
    fadeTo(0, 0.6);
    say(n === 5 ? 'Congratulations, graduate! See you at summer school!' : 'Great job tonight! See you tomorrow, student!', 'cute');
    var cv = document.getElementById('hp-cl-cv'), g = cv.getContext('2d'), tt = 0;
    (function anim() { if (GAME.mode !== 'clear') return; tt += 0.05; g.clearRect(0, 0, 300, 170); drawHoots(g, 150, 95, 0.55, { wave: (Math.sin(tt * 5) + 1) / 2 }); for (var i = 0; i < 8; i++) drawStar(g, 150 + Math.cos(tt + i) * 120, 85 + Math.sin(tt * 1.3 + i) * 60, 7, '#fff'); requestAnimationFrame(anim); })();
    onTap(document.getElementById('hp-next'), function () { sfx('ui'); startNight(n + 1); });
    onTap(document.getElementById('hp-cl-title'), function () { sfx('uiBack'); goTitle(); });
  });
}

// ---- raid during lesson ---------------------------------------------------------
function startRaid() {
  if (GAME.mode !== 'play' || GAME.phase !== 'lesson') return;
  GAME.phase = 'raidWarn';
  var room = currentStop().room;
  if (typeof pauseLesson === 'function') pauseLesson(true);
  FLICK.amt = 0.6; setBGMRate(0.82); sfx('paStatic', null, { len: 2.5 });
  if (TEACHER) TEACHER.lookWindow = true;
  var hootsReveal = GAME.hootsRevealPeriod === GAME.period && !GAME.hootsRevealed;
  showSubtitle(hootsReveal ? 'PROF. HOOTS: ...stay after class.' : '*the lights flicker*', hootsReveal ? '…放課後、残りなさい。' : '（蛍光灯がチカチカする…）', 2.5, hootsReveal ? 'evil' : '');
  if (hootsReveal) say('Stay. After. Class.', 'creepy');
  setTimeoutG(function () {
    if (GAME.mode !== 'play') return;
    FLICK.amt = 0; setBGMRate(1);
    lightsOut(); hideHUDForLesson(false); UIX.hud.style.display = '';
    GAME.phase = 'raid'; GAME.raidT = 0;
    if (typeof pauseLesson === 'function') pauseLesson('hide');
    // NPCs dive under desks (most of them)
    NPCS.forEach(function (n) { if (!n.alive || !n.seated) return; if (n.pers === 'timid' || R() < 0.82) { var c = n.seated; npcStand(n); n.state = 'raidHide'; n.x = c.x + Math.sin(c.rot) * 0.55; n.z = c.z + Math.cos(c.rot) * 0.55; n.raidChair = c; } });
    // stand the player up next to the chair; they must hide
    var c = PL.seated; standPlayer(); PL.raidChair = c;
    showToast('HIDE UNDER A DESK!', '机の下に隠れろ！（✋）', 3);
    // monster comes in through the door
    var type = hootsReveal ? 'hoots' : R.pick(monstersForNight(Math.max(GAME.night, 2)).filter(function (t) { return t !== 'static' && t !== 'smiles'; }).concat(['student0']));
    if (hootsReveal) { GAME.hootsRevealed = true; }
    var e = roomEntryPoint(room, true);
    var door = MAP.doors[room.doors[0]];
    setTimeoutG(function () {
      if (GAME.mode !== 'play' || GAME.phase !== 'raid') return;
      var m = spawnMonster(type, room.li, door.x, door.z + (room.cz > door.z ? -0.8 : 0.8));
      m.raid = true; m.raidKeep = true; m.active = true; m.visible = true; m.ceilAmt = 0; m.ceil = false; m.raidRoom = room; m.raidLeft = 16 + GAME.night;
      setState(m, 'raid'); GAME.raidMon = m;
      door.open = 1;
      sfx('doorBang', mpos(m));
    }, 2500 + R() * 1500);
  }, 2800);
}
function updateRaidMonster(m, dt) {
  m.raidLeft -= dt;
  var room = m.raidRoom;
  if (!m.path || m.pathI >= m.path.length) {
    if (m.raidLeft <= 0) { endRaid(m); return; }
    // wander to a random desk / chair
    var c = R.pick(room.chairs); monsterGoto(m, room.li, c.x + R.range(-0.5, 0.5), c.z + R.range(-0.5, 0.5));
    m._pause = R.range(0.8, 2);
  }
  if (m._pause > 0 && m.pathI >= (m.path ? m.path.length : 0)) { m._pause -= dt; m.speed = 0; return; }
  followPath(m, 1.25, dt);
  // check unhidden people
  if (!PL.hidden && PL.li === m.li && Math.sqrt(dist2(m.x, m.z, PL.x, PL.z)) < 9 && losClear(m.li, m.x, m.z, PL.x, PL.z)) { monsterGoto(m, PL.li, PL.x, PL.z); followPath(m, 3.5, dt); }
  NPCS.forEach(function (n) { if (n.alive && n.state !== 'raidHide' && !n.seated && n.li === m.li && dist2(n.x, n.z, m.x, m.z) < 1) npcKilled(n, m); });
  // close to the player's hiding desk: hold your breath
  if (PL.hidden && dist2(PL.hidden.x, PL.hidden.z, m.x, m.z) < 2.4 * 2.4) {
    m._sniff = (m._sniff || 0) + dt;
    if (m._sniff > 0.3 && !m._warned) { m._warned = true; showToast('HOLD YOUR BREATH!', '息を止めろ！（🫁 長押し / SPACE）', 2); sfx('breathM', mpos(m), { v: 0.5 }); }
    if (!PL.breath && m._sniff > 1.2) { m._sniff = 0; if (R() < 0.6) onMonsterCatch(m); }
  } else { m._sniff = 0; }
}
function endRaid(m) {
  // leave through the door, lights return
  setState(m, 'leave'); var door = MAP.doors[m.raidRoom.doors[0]]; monsterGoto(m, m.li, door.x, door.z + (m.raidRoom.cz > door.z ? -3 : 3));
  setTimeoutG(function () {
    if (GAME.mode !== 'play') return;
    removeMonster(m); GAME.raidMon = null;
    lightsOn(); GAME.phase = 'lesson';
    if (PL.hidden) exitHide();
    var c = PL.raidChair; if (c) seatPlayer(c);
    NPCS.forEach(function (n) { if (n.alive && n.state === 'raidHide' && n.raidChair) npcSeat(n, n.raidChair); });
    var gone = NPCS.filter(function (n) { return !n.alive && !n._reported; }); gone.forEach(function (n) { n._reported = true; });
    if (gone.length) showToast(gone.map(function (n) { return n.name.toUpperCase(); }).join(', ') + ' — EMPTY SEAT', gone.map(function (n) { return n.name; }).join('、') + 'の席が空いている…', 3);
    hideHUDForLesson(true);
    if (TEACHER) TEACHER.lookWindow = false;
    var hootsWas = GAME.hootsRevealPeriod === GAME.period;
    if (hootsWas) { removeTeacher(); GAME.hootsRevealPeriod = -1; runLines([['Hoo... hoo. Sorry about that, class. The suit... gets itchy.', 'フー…フー。ごめんなさいね。着ぐるみが…かゆくて。']], 'hoots', function () { if (typeof pauseLesson === 'function') pauseLesson(false); }); spawnTeacher(currentStop().room); }
    else if (typeof pauseLesson === 'function') pauseLesson(false);
  }, 3500);
}

// ---- lunch ----------------------------------------------------------------------
function runLunch() {
  var room = currentStop().room;
  // lunch box on the table in front of the player
  var c = PL.seated;
  var lm = itemMesh('lunch'); lm.position.set(c.x + Math.sin(c.rot) * 0.55, LV_Y[c.li] + 0.76, c.z + Math.cos(c.rot) * 0.55);
  RENDER.scene.add(lm); GAME.lunchBox = { mesh: lm, taken: false };
  var alive = NPCS.filter(function (n) { return n.alive; });
  var lines = [];
  alive.slice(0, 3).forEach(function (n) { var L = R.pick(NPC_LINES[n.pers]); lines.push({ n: n, l: L }); });
  lines.push({ n: null, l: ['Lunch is over in one minute. Please clean up your trays.', 'あと1分で昼休みは終わりです。トレイを片付けてください。'] });
  var i = 0;
  function next() {
    if (GAME.mode !== 'play' || GAME.phase !== 'lunch') return;
    if (i >= lines.length) { setTimeoutG(function () { if (GAME.phase === 'lunch' && GAME.lunchBox) { RENDER.scene.remove(GAME.lunchBox.mesh); } endOfLunch(); }, 4000); return; }
    var L = lines[i++];
    if (L.n) npcSay(L.n, L.l[0], L.l[1], 4); else { sfx('chime'); showSubtitle('PA: ' + L.l[0], L.l[1], 4, 'pa'); say(L.l[0], 'pa'); }
    GAME._lineTimer = setTimeoutG(next, 4800);
  }
  setTimeoutG(next, 1500);
  showToast('LUNCH', '昼休み。生徒の話にヒントがあるかも。🍱 を取っておこう', 3.5);
}
function endOfLunch() {
  if (GAME.mode !== 'play') return;
  GAME.hint = 1;
  var next = GAME.schedule[GAME.period + 1], nr = next.room;
  runLines([['Next: ' + ROLE_INFO[nr.role].en + ', Room ' + nr.number + '. Go, go, go!', '次は ' + ROLE_INFO[nr.role].ja + '（' + nr.number + '号室・' + (nr.li === 2 ? '2階' : '1階') + '）です。']], 'pa', endOfPeriod);
}

// ---- teacher (lights-on Hoots at the board) ----------------------------------------
var TEACHER = null;
function spawnTeacher(room) {
  removeTeacher();
  var m = buildMonsterModel('hoots');
  m.rig.bones[0].userData.y0 = m.rig.bones[0].position.y;
  var x = room.x0 + 1.2, z = room.cz + 0.8;
  m.root.position.set(x, LV_Y[room.li], z); m.root.rotation.y = PI / 2;
  RENDER.scene.add(m.root);
  m.head.visible = false;
  TEACHER = { mdl: m, room: room, t: 0, talk: 0, x: x, z: z, li: room.li, lookWindow: false };
  var pr = WORLD.baker.probe(room.li, x, LV_Y[room.li] + 1.2, z);
  m.mats.forEach(function (mt) { if (mt.userData.probeOn) setProbe(mt, pr.on, pr.off); });
}
function removeTeacher() { if (!TEACHER) return; RENDER.scene.remove(TEACHER.mdl.root); TEACHER.mdl.mats.forEach(function (m) { m.dispose(); }); TEACHER = null; }
function updateTeacher(dt) {
  if (!TEACHER) return;
  var T = TEACHER; T.t += dt; T.talk -= dt;
  var R2 = T.mdl.rig, B = R2.byName;
  poseReset(R2);
  animIdle(R2, T.t);
  // waving & gesturing at the board
  B.uaR.rotation.z = -0.4 - (T.talk > 0 ? 0.9 + Math.sin(T.t * 6) * 0.4 : 0.2);
  B.uaL.rotation.x = -0.4 + Math.sin(T.t * 1.5) * 0.2;
  B.chest.rotation.y = Math.sin(T.t * 0.8) * 0.15;
  var ch = T.mdl.extra.costumeHead;
  var lookAt = Math.atan2(PL.x - T.x, PL.z - T.z) - PI / 2;
  if (T.lookWindow) lookAt = (T.room.side === 'S' ? -1 : 1) * 1.2;
  B.neck.rotation.y = damp(B.neck.rotation.y || 0, clamp(angDiff(0, lookAt), -1.2, 1.2), 2, dt);
  if (ch) { ch.rotation.z = T.talk > 0 ? Math.sin(T.t * 9) * 0.06 : 0; ch.rotation.x = 0; }
  if (T.mdl.extra.pupil1) { T.mdl.extra.pupil1.position.y = 0.26 + Math.sin(T.t * 3) * 0.004; }
  T.mdl.root.position.y = LV_Y[T.li] + Math.abs(Math.sin(T.t * 3)) * (T.talk > 0 ? 0.02 : 0);
}
function hideHUDForLesson(lesson) {
  if (!UIX.hud) return;
  var vis = lesson ? 'hidden' : 'visible';
  [UIX.bCrouch, UIX.bFlash, UIX.bItem, UIX.bBreath, UIX.stickHint, UIX.inv].forEach(function (b) { b.style.visibility = vis; });
  UIX.bInteract.style.visibility = (!lesson || GAME.phase === 'lunch') ? 'visible' : 'hidden';
}
function updateObjective() {
  var st = GAME.schedule[GAME.period], next = GAME.schedule[GAME.period + 1];
  var h = '';
  if (GAME.phase === 'transit' || GAME.phase === 'resolve') {
    var r = GAME.target, info = ROLE_INFO[r.role];
    var num = next.kind === 'class' ? (GAME.hint >= 1 ? 'RM ' + r.number + ' · ' : '') : '';
    h = '<span class="en">NEXT: ' + num + (next.kind === 'bus' ? 'SCHOOL BUS' : info.en) + '</span><span class="ja">次：' + (next.kind === 'bus' ? 'スクールバス（正面玄関の外）' : info.ja + (GAME.hint >= 1 && next.kind === 'class' ? '・' + (r.li === 2 ? '2階' : '1階') : '')) + '</span>';
    var taken = r.chairs.filter(function (c) { return c.avail && c.occ !== -1; }).length;
    h += '<span class="seats">SEATS ' + (GAME.seatsTotal - taken) + '/' + GAME.seatsTotal + '</span>';
  } else if (st) {
    h = '<span class="en">' + st.label[0] + '</span><span class="ja">' + st.label[1] + (st.kind === 'class' ? '：' + ROLE_INFO[st.room.role].ja : '') + '</span>';
  }
  if (UIX._objH !== h) { UIX.obj.innerHTML = h; UIX._objH = h; }
}
function showDialog(inner, btn, cb) {
  var s = showScreen('dialog', '<div class="hp-panel"><div class="hp-dlg">' + inner + '<button class="hp-menu-btn pe" id="hp-dlg-ok" style="margin-top:14px">' + (btn || 'OK') + '</button></div></div>');
  onTap(document.getElementById('hp-dlg-ok'), function () { hideScreen('dialog'); sfx('ui'); if (cb) cb(); });
}

// ---- per-frame update in play -------------------------------------------------------
var _promptT = 0;
function updatePlay(dt) {
  if (consume('pause')) { openPause(); return; }
  if (PL.invuln > 0) PL.invuln -= dt;
  if (consume('flash')) { if (GAME.phase === 'transit' || GAME.phase === 'raid' || GAME.phase === 'resolve') toggleFlash(); }
  if (consume('item')) { if (GAME.phase === 'transit' || GAME.phase === 'raid') useItem(); }
  if (consume('next')) { if (PL.invOrder && PL.invOrder.length) { PL.sel = (PL.sel + 1) % PL.invOrder.length; renderInventory(); } }
  for (var s = 1; s <= 9; s++) if (consume('slot' + s)) { if (PL.invOrder && PL.invOrder[s - 1]) { PL.sel = s - 1; renderInventory(); } }
  updatePlayer(dt);
  updateDoors(dt, [PL].concat(NPCS.filter(function (n) { return n.alive && !n.seated; })).concat(MONSTERS.filter(function (m) { return m.active && m.visible && !m.watcher; })));
  if (GAME.phase === 'transit' || GAME.phase === 'resolve' || GAME.phase === 'raid' || GAME.phase === 'raidWarn') updateMonsters(dt);
  else NOISES.length = 0;
  updateNPCs(dt, GAME.phase);
  updateTeacher(dt);
  updateThrown(dt);
  // interaction prompt
  _promptT -= dt;
  var it = findInteraction();
  if (it) setPrompt(it.en, it.ja); else setPrompt(null);
  if (consume('interact') && it) { it.fn(); sfx('click'); }
  if (GAME.phase === 'transit') {
    GAME.timer -= dt; GAME.clock += dt;
    if (GAME.timer <= 0) endTransit('time');
    else checkAllSeated();
    // ambient scares
    ambientScares(dt);
  }
  // fear
  var mf = monsterFear();
  PL.fear = damp(PL.fear, Math.max(mf.f, GAME.phase === 'raid' ? 0.4 : 0), 3, dt);
  updateObjective();
  var tb = GAME.phase === 'transit' ? Math.max(0, GAME.timer) : -1;
  if (tb >= 0) { var mm = Math.floor(tb / 60), ss = Math.floor(tb % 60); var txt = 'BELL ' + mm + ':' + (ss < 10 ? '0' : '') + ss; if (UIX.bell._t !== txt) { UIX.bell.textContent = txt; UIX.bell._t = txt; } UIX.bell.classList.toggle('warn', tb < 15); }
  else if (UIX.bell._t !== '') { UIX.bell.textContent = ''; UIX.bell._t = ''; }
  updateMinimap();
  updateHUD(dt);
  // items glint
  GAME.items.forEach(function (it) { it.mesh.rotation.y += dt; it.mesh.userData.glint.material.opacity = 0.25 + Math.sin(now() * 4 + it.x) * 0.2; });
}
// spooky one-shots while walking in the dark
var SCARE = { t: 8 };
var FLASH_FACES = [1, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
function ambientScares(dt) {
  SCARE.t -= dt;
  if (SCARE.t > 0) return;
  SCARE.t = R.range(9, 18) - Math.min(5, GAME.night);
  var r = R();
  var p = { li: PL.li, x: PL.x + R.range(-10, 10), z: PL.z + R.range(-10, 10) };
  if (r < 0.25) sfx('creak', p);
  else if (r < 0.4) sfx('thump', p);
  else if (r < 0.5) sfx('drip', p);
  else if (r < 0.6) sfx('whisper', p);
  else if (r < 0.7) { sfx('giggle', p); }
  else if (r < 0.8) { sfx('paStatic', null, { len: 1.4 }); if (GAME.night >= 2) setTimeoutG(function () { say(R.pick(['Hoo... are you... in your seat?', 'Nobody leaves... early.', 'Hoo-ray... for... staying.']), 'creepy'); }, 300); }
  else if (r < 0.9 && windowFace()) { }
  else { // face flash: a frame of tape
    subliminalFlash(R.pick(FLASH_FACES));
  }
}
function subliminalFlash(img) {
  if (SAVE.settings.scare === 'MILD' && R() < 0.5) return;
  POSTU.tFace.value = FACE_TEX[img];
  var t0 = now(); POSTU.uFaceZoom.value = 0.5; POSTU.uFaceShake.value.set(R.range(-0.25, 0.25), R.range(-0.15, 0.15));
  (function f() { var t = now() - t0; POSTU.uFace.value = t < 0.06 ? 0.55 : t < 0.1 ? 0.15 : 0; if (t < 0.12 && GAME.mode === 'play') requestAnimationFrame(f); else POSTU.uFace.value = 0; })();
  sfx('staticBurst', null, { len: 0.12 });
}
// minimap
function updateMinimap() {
  var show = (GAME.mapScrap || GAME.hint >= 2) && (GAME.phase === 'transit' || GAME.phase === 'raid');
  UIX.minimap.style.display = show ? '' : 'none';
  if (!show) return;
  var cv = UIX.minimap.firstChild, g = cv.getContext('2d');
  var W = 248, px = 3.1; // pixels per cell
  g.fillStyle = 'rgba(6,10,12,0.9)'; g.fillRect(0, 0, W, W);
  var L = MAP.lv[PL.li];
  var reveal = GAME.mapReveal[PL.li] || GAME.mapScrap;
  var r0 = 40, pcx = m2c(PL.x), pcz = m2r(PL.z);
  for (var dz = -r0; dz < r0; dz++) for (var dx = -r0; dx < r0; dx++) {
    var cx = pcx + dx, cz = pcz + dz; if (!inGrid(cx, cz)) continue;
    var i = cidx(cx, cz), t = L.type[i];
    if (t === T_WALL || t === T_VOID) continue;
    if (!reveal && (Math.abs(dx) > 12 || Math.abs(dz) > 12)) continue;
    var rm = L.room[i];
    g.fillStyle = t === T_BLOCK ? '#3a3226' : t === T_STAIR ? '#6a8a9a' : t === T_DOOR ? (MAP.doors[L.door[i]].locked ? '#c33' : '#8a7') : (GAME.target && rm === GAME.target.id && GAME.hint >= 1 ? '#d4ad3a' : '#2b3943');
    g.fillRect(W / 2 + dx * px, W / 2 + dz * px, px + 0.4, px + 0.4);
  }
  g.fillStyle = '#fff'; g.save(); g.translate(W / 2, W / 2); g.rotate(-PL.yaw); g.beginPath(); g.moveTo(0, -8); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore();
}
function openPause() {
  if (GAME.mode !== 'play') return;
  GAME.mode = 'pause';
  try { if (document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
  if (AU.ctx) try { AU.ctx.suspend(); } catch (e) {}
  if (AU.cur && AU.tracks[AU.cur]) AU.tracks[AU.cur].el.pause();
  stopVoice();
  var s = showScreen('pause', '<div style="position:absolute;inset:0;background:rgba(0,0,0,.78)"></div><div class="hp-panel"><div style="font:30px Bungee;color:#fff">PAUSED</div><div style="font:700 13px Zen Kaku Gothic New;color:#bbb;margin-bottom:16px">一時停止中</div>' +
    '<button class="hp-menu-btn pe" id="hp-resume">' + bi('RESUME', '再開') + '</button><button class="hp-menu-btn alt pe" id="hp-psettings">' + bi('SETTINGS', '設定') + '</button><button class="hp-menu-btn alt2 pe" id="hp-pquit">' + bi('QUIT TO TITLE', 'タイトルへ戻る') + '</button>' +
    '<div class="tw" style="color:#999;font-size:13px;margin-top:10px">NIGHT ' + GAME.night + ' · ' + (GAME.schedule[GAME.period] ? GAME.schedule[GAME.period].label[0] : '') + '</div></div>');
  onTap(document.getElementById('hp-resume'), resumeGame);
  onTap(document.getElementById('hp-psettings'), function () { openSettings(function () { }); });
  onTap(document.getElementById('hp-pquit'), function () { hideScreen('pause'); if (AU.ctx) AU.ctx.resume(); goTitle(); });
}
function resumeGame() {
  hideScreen('pause'); GAME.mode = 'play'; sfx('ui');
  if (AU.ctx) try { AU.ctx.resume(); } catch (e) {}
  if (AU.cur && AU.tracks[AU.cur]) AU.tracks[AU.cur].el.play().catch(function () {});
  if (typeof pauseLesson === 'function' && GAME.phase === 'lesson') { }
}

// a face pressed against a window (or in a restroom mirror) for a moment
var WFACE = null;
function windowFace() {
  var cands = MAP.windows.filter(function (w) { return w.li === PL.li && !w.high && dist2(w.x, w.z, PL.x, PL.z) < 100 && dist2(w.x, w.z, PL.x, PL.z) > 9; });
  MAP.slots.forEach(function (r) { if (r.mirror && r.li === PL.li && dist2(r.mirror.x, r.mirror.z, PL.x, PL.z) < 64) cands.push({ x: r.mirror.x, z: r.mirror.z, nx: 0, nz: r.side === 'S' ? -1 : 1, mirror: true, y: r.mirror.y }); });
  var f = camForward();
  cands = cands.filter(function (w) { var dx = w.x - PL.x, dz = w.z - PL.z, d = Math.sqrt(dx * dx + dz * dz); return (dx * f.x + dz * f.z) / d > 0.75; });
  if (!cands.length) return false;
  var w = R.pick(cands);
  if (!WFACE) {
    var alpha = toTex(texGlow('rgba(255,255,255,1)', 128), { clamp: true });
    WFACE = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ transparent: true, alphaMap: alpha, depthWrite: false, fog: false, color: 0x9aa0a8 }));
    WFACE.renderOrder = 6; RENDER.scene.add(WFACE);
  }
  WFACE.material.map = FACE_TEX[R.pick(FLASH_FACES)]; WFACE.material.needsUpdate = true;
  var out = w.mirror ? -0.03 : 0.32; // outside the glass
  WFACE.position.set(w.x - (w.nx || 0) * out, w.y || (LV_Y[PL.li] + 1.55), w.z - (w.nz || 0) * out);
  WFACE.rotation.set(0, Math.atan2(w.nx || 0, w.nz || 0), 0);
  WFACE.visible = true;
  sfx('whisper', { li: PL.li, x: w.x, z: w.z });
  setTimeoutG(function () { if (WFACE) WFACE.visible = false; sfx('staticBurst', null, { len: 0.1 }); }, 350 + R() * 300);
  return true;
}


// ===== 99_main.js =====
// ---- boot & main loop --------------------------------------------------------------
var LOOP = { last: 0, t: 0 };
var _camShake = { x: 0, y: 0 };
function preloadFaces(onProgress) {
  return new Promise(function (resolve) {
    var loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    var left = 40, failed = [];
    for (var i = 1; i <= 40; i++) (function (i) {
      var url = assetURL('images/face_' + (i < 10 ? '0' : '') + i + '.jpg');
      loader.load(url, function (t) { t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; FACE_TEX[i] = t; done(); },
        undefined, function () { failed.push(i); var c = mkCanvas(64, 64); c.getContext('2d').fillStyle = '#222'; c.getContext('2d').fillRect(0, 0, 64, 64); FACE_TEX[i] = toTex(c, { clamp: true }); done(); });
    })(i);
    function done() { left--; if (onProgress) onProgress(40 - left); if (left === 0) { if (failed.length) showFatal('画像の読み込みに失敗 (images failed to load: ' + failed.length + ')', 'CORS設定 (_headers) とURLを確認してください:\n' + assetURL('images/face_01.jpg')); resolve(); } }
  });
}
function boot() {
  setupPage(); loadSave();
  initUI();
  showScreen('loading', '<div style="position:absolute;inset:0;background:#000"></div><div class="hp-panel"><div style="font:24px VT323;color:#ddd;letter-spacing:.2em" class="hp-blink">LOADING TAPE...</div><div id="hp-load-p" style="font:16px VT323;color:#777;margin-top:8px">0%</div></div>');
  loadThree(async function () {
    try {
      initRenderer(); initInput();
      var pEl = document.getElementById('hp-load-p');
      await preloadFaces(function (n) { if (pEl) pEl.textContent = Math.round(n / 40 * 80) + '%'; });
      initGeoTemplates(); makeWorldMaterials();
      if (pEl) pEl.textContent = '90%';
      // upload face textures to GPU now so a jumpscare never waits
      for (var i = 1; i <= 40; i++) try { RENDER.renderer.initTexture(FACE_TEX[i]); } catch (e) {}
      POSTU.tFace.value = FACE_TEX[8];
      buildTitleScene();
      PLAYER_LIGHT.spot = new THREE.SpotLight(0xfff1dc, 0, 20, 0.48, 0.55, 2.0);
      PLAYER_LIGHT.spot.castShadow = RENDER.renderer.shadowMap.enabled;
      PLAYER_LIGHT.spot.shadow.mapSize.set(512, 512); PLAYER_LIGHT.spot.shadow.camera.near = 0.2; PLAYER_LIGHT.spot.shadow.bias = -0.0015;
      RENDER.camera.add(PLAYER_LIGHT.spot); PLAYER_LIGHT.spot.position.set(0.18, -0.12, 0.05);
      PLAYER_LIGHT.target = new THREE.Object3D(); RENDER.camera.add(PLAYER_LIGHT.target); PLAYER_LIGHT.target.position.set(0, -0.15, -5); PLAYER_LIGHT.spot.target = PLAYER_LIGHT.target;
      hideScreen('loading');
      showWarning();
      LOOP.last = performance.now();
      requestAnimationFrame(frame);
      window.__hpReady = true;
    } catch (e) { showFatal('起動エラー (boot error)', (e && e.stack) || String(e)); }
  });
}
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, Math.max(0.001, (ts - LOOP.last) / 1000)); LOOP.last = ts; dt *= (LOOP.scale || 1); LOOP.t += dt;
  try { tick(dt); } catch (e) { if (!LOOP.err) { LOOP.err = true; console.error(e); showFatal('Runtime error', (e && e.stack) || String(e)); } }
}
function tick(dt) {
  LIGHTU.uTime.value = LOOP.t; POSTU.uTime.value = LOOP.t;
  updateUITimers(dt);
  adaptQuality(dt);
  var mode = GAME.mode;
  if (mode === 'freeze') return;
  if (mode === 'title' || mode === 'warning') { updateTitle(dt); return; }
  if (!PL || !WORLD) { RENDER.renderer.setRenderTarget(null); RENDER.renderer.clear(); return; }
  if (mode === 'play') {
    updateTimers(dt);
    updateLights(dt);
    updatePlay(dt);
    updateLesson(dt);
    if (GAME.mode === 'play') updateNPCsVisibility();
  } else if (mode === 'dead') {
    updateLights(dt);
    updateJumpscare(dt);
  } else if (mode === 'read' || mode === 'cut') {
    updateLights(dt);
  }
  updateCamera(dt);
  updatePost(dt);
  updateLevelVisibility();
  if (AU.ready) updateAudio(dt, RENDER.camera);
  if (mode !== 'pause' || LOOP._pauseFrames++ < 2) renderFrame();
  if (mode !== 'pause') LOOP._pauseFrames = 0;
}
function updateNPCsVisibility() { }
function updateCamera(dt) {
  var cam = RENDER.camera, P = PL;
  var x = P.x, z = P.z, y = P.y + P.eye;
  if (P.seated) { y = LV_Y[P.seated.li] + (P.seated.kind === 'stool' ? 1.32 : 1.15); var c = P.seated; x = c.x - Math.sin(c.rot) * 0.05; z = c.z - Math.cos(c.rot) * 0.05; }
  if (P.hidden) { var h = P.hidden; y = h.y; x = h.x; z = h.z; if (h.type === 'locker') { x += Math.sin(h.rot) * 0.12; z += Math.cos(h.rot) * 0.12; } }
  // head bob
  var bobA = P.moving && !P.hidden && !P.seated ? (P.running ? 0.055 : 0.03) : 0;
  var by = Math.abs(Math.sin(P.bob * 3.1)) * bobA, bx = Math.sin(P.bob * 3.1) * bobA * 0.6;
  if (P.breath) { y -= 0.01; }
  P.shake = Math.max(0, P.shake - dt * 2);
  var sh = P.shake * (SAVE.settings.scare === 'MILD' ? 0.3 : 1) + PL.fear * 0.004;
  _camShake.x = damp(_camShake.x, (R() - 0.5) * sh * 0.08, 30, dt); _camShake.y = damp(_camShake.y, (R() - 0.5) * sh * 0.08, 30, dt);
  cam.position.set(x + Math.cos(P.yaw) * bx, y + by + _camShake.y, z - Math.sin(P.yaw) * bx);
  cam.rotation.set(P.pitch + _camShake.x, P.yaw, (P.running ? Math.sin(P.bob * 3.1) * 0.006 : 0), 'YXZ');
  // flashlight (lags a little behind the view)
  var sp = PLAYER_LIGHT.spot;
  var on = P.flash && P.flashDead <= 0 && GAME.mode !== 'title';
  var flick = 1;
  if (P.battery < 15) flick = Math.sin(LOOP.t * 23) > 0.2 ? 1 : 0.3;
  var near = monsterFear(); if (near.m && near.m.type === 'static' && near.f > 0.3) flick *= R() < 0.4 ? 0.1 : 1;
  sp.intensity = on ? 1.0 * flick : 0;
  PLAYER_LIGHT.target.position.x = damp(PLAYER_LIGHT.target.position.x, -INPUT.mx * 0.4, 4, dt);
  // fog / exposure by lights
  var dark = 1 - LIGHTU.uMix.value;
  var fog = RENDER.scene.fog || (RENDER.scene.fog = new THREE.FogExp2(0x000000, 0.03));
  fog.color.setRGB(lerp(0.08, 0.004, dark), lerp(0.085, 0.006, dark), lerp(0.075, 0.012, dark));
  fog.density = lerp(0.018, 0.07, dark) * (P.li === 0 ? 1.3 : 1);
}
function updatePost(dt) {
  var dark = 1 - LIGHTU.uMix.value;
  if (GAME.mode === 'dead') return;
  var near = PL ? monsterFear() : { f: 0, m: null };
  var stat = near.m && near.m.type === 'static' ? near.f : 0;
  POSTU.uVHS.value = lerp(0.14, 1, dark);
  POSTU.uTint.value = dark;
  POSTU.uDesat.value = dark * 0.22;
  POSTU.uExposure.value = lerp(1.0, 1.6, dark) * (PL && PL.li === 0 ? 1.1 : 1);
  POSTU.uFear.value = PL ? PL.fear : 0;
  POSTU.uAberr.value = 0.5 + (PL ? PL.fear : 0) * 1.5;
  POSTU.uGrain.value = 0.035 + dark * 0.02;
  POSTU.uTrack.value = damp(POSTU.uTrack.value, stat * 0.8 + (FLICK.amt > 0.3 ? 0.4 : 0), 6, dt);
  POSTU.uGlitch.value = damp(POSTU.uGlitch.value, stat > 0.4 ? stat : 0, 8, dt);
  POSTU.uRed.value = Math.max(0, POSTU.uRed.value - dt * 0.8);
  POSTU.uWarm.value = 0;
  POSTU.uLowHP.value = PL && PL.breath ? clamp(PL.breathT / 7, 0, 1) : 0;
  if (POSTU.uFlash.value > 0 && GAME.mode === 'play') POSTU.uFlash.value = Math.max(0, POSTU.uFlash.value - dt * 3);
  if (AU.ready && PL) { setLoop('room', dark * 0.06, 0.5); }
}
// show only the floors that can be seen
function updateLevelVisibility() {
  if (!WORLD) return;
  var li = PL.li;
  var inStairs = MAP.lv[li].type[cidx(m2c(PL.x), m2r(PL.z))] === T_STAIR;
  var rm = roomAt(li, PL.x, PL.z);
  var stairRoom = rm && rm.role === 'STAIRS';
  var vis = [false, false, false];
  vis[li] = true;
  if (inStairs || stairRoom) { vis[0] = vis[0] || (PL.x > 41 && li <= 1); vis[1] = true; vis[2] = vis[2] || li >= 1; }
  for (var i = 0; i < WORLD.chunks.length; i++) { var c = WORLD.chunks[i]; c.mesh.visible = vis[c.li] || (c.li === 1 && c.cz === 0 && li === 2); }
  WORLD.glass.forEach(function (g) { g.visible = vis[g.userData.li]; });
}
boot();


})();
