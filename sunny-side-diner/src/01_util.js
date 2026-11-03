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
