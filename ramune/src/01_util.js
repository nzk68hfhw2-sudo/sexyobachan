// ---- math / rng / storage helpers -------------------------------------------
var PI = Math.PI, TAU = Math.PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function damp(a, b, k, dt) { return lerp(a, b, 1 - Math.exp(-k * dt)); }
function now() { return performance.now() / 1000; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function hash2(x, y) { var h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) {
  var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, oct) { var s = 0, a = 0.5, f = 1; for (var i = 0; i < (oct || 4); i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; } return s; }

// ---- persistent save ---------------------------------------------------------
var SAVE_KEY = 'ramune_night_v1';
var SAVE = {
  seenSubs: {}, seenCombos: {}, nights: 0, mornings: 0, deaths: 0, best: 0, endings: {},
  settings: { bgm: 0.6, sfx: 0.9, sens: 1.0, quality: 'AUTO', calm: false, invertY: false, sandbox: false }
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

// ---- DOM helpers ---------------------------------------------------------------
function el(tag, cls, html, parent) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
function onTap(e, fn) {
  // fast, reliable tap for both touch and mouse (no 300ms delay, no double-fire)
  var down = null;
  e.addEventListener('pointerdown', function (ev) { down = { x: ev.clientX, y: ev.clientY, t: Date.now() }; ev.stopPropagation(); });
  e.addEventListener('pointerup', function (ev) {
    ev.stopPropagation();
    if (!down) return;
    var dx = ev.clientX - down.x, dy = ev.clientY - down.y;
    if (dx * dx + dy * dy < 400 && Date.now() - down.t < 900) { try { fn(ev); } catch (er) { console.error(er); } }
    down = null;
  });
  e.addEventListener('click', function (ev) { ev.stopPropagation(); });
}

// ---- canvas texture helpers -------------------------------------------------
function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function toTex(c, o) {
  o = o || {};
  var t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  t.anisotropy = 4;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}
function fmtClock(min) {
  // min = minutes since 00:00 of the start day (may exceed 24h)
  var m = Math.floor(min) % 1440; var h = Math.floor(m / 60), mm = m % 60;
  return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
}
