/*! FRIENDS WARFARE — game.js (single-file build). See source.txt */
(function(){
"use strict";

// ===== 00_boot.js =====
// ---------------------------------------------------------------------------
// FRIENDS WARFARE — browser FPS (three.js r128). Everything is created by this
// one file: DOM, CSS, canvas, textures, sounds. Loaded with <script src>.
// BASE_URL is only a fallback: the folder of game.js is detected automatically.
// ---------------------------------------------------------------------------
if (window.__frLoaded) { return; }
window.__frLoaded = true;

var BASE_URL = 'https://comforting-bublanina-fb9718.netlify.app/';
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '2.0.0';
var THREE;

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

var QUERY = {};
try { location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (m, k, v) { QUERY[k] = decodeURIComponent(v); }); } catch (e) {}

var IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
var IS_MOBILE = IS_TOUCH && /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || (IS_TOUCH && /Macintosh/.test(navigator.userAgent));

var ROOT, UI, CANVAS_HOST;

function showFatal(title, detail) {
  try {
    var d = document.getElementById('fr-fatal');
    if (!d) {
      d = document.createElement('div'); d.id = 'fr-fatal';
      d.style.cssText = 'position:fixed;left:16px;right:16px;top:calc(env(safe-area-inset-top,0px) + 90px);z-index:2147483647;background:#1a0606;color:#ffdede;border:2px solid #c22;padding:14px;font:13px/1.5 monospace;white-space:pre-wrap;border-radius:6px;max-height:60vh;overflow:auto;';
      (document.body || document.documentElement).appendChild(d);
    }
    d.textContent = '[エラー] ' + title + '\n' + (detail || '') + '\n\n読み込み元: ' + ASSET_BASE + '\nUA: ' + navigator.userAgent;
  } catch (e) {}
}
var RUNTIME_ERRORS = [];
window.addEventListener('error', function (e) {
  var msg = ((e && e.message) || 'error') + ' ' + ((e && e.filename) || '') + ':' + ((e && e.lineno) || '');
  RUNTIME_ERRORS.push(msg);
  if (!window.__frReady) showFatal('起動中にエラーが起きました', msg);
});

function loadScript(url, cb) {
  var s = document.createElement('script'); s.src = url; s.async = true; s.crossOrigin = 'anonymous';
  s.onload = function () { cb(null); };
  s.onerror = function () { cb(new Error('load failed: ' + url)); };
  (document.head || document.documentElement).appendChild(s);
}

function setupPage() {
  var head = document.head || document.documentElement;
  try {
    var vp = document.querySelector('meta[name=viewport]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; head.appendChild(vp); }
    vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  } catch (e) {}
  var st = document.createElement('style'); st.id = 'fr-style'; st.textContent = BASE_CSS; head.appendChild(st);
  ROOT = document.createElement('div'); ROOT.id = 'fr-root';
  CANVAS_HOST = document.createElement('div'); CANVAS_HOST.id = 'fr-canvas';
  UI = document.createElement('div'); UI.id = 'fr-ui';
  ROOT.appendChild(CANVAS_HOST); ROOT.appendChild(UI);
  (document.body || document.documentElement).appendChild(ROOT);
  var stop = function (e) { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (n) {
    ROOT.addEventListener(n, stop, { passive: false });
  });
  ROOT.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.fr-scroll')) e.preventDefault(); }, { passive: false });
}


// ===== 01_util.js =====
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function damp(a, b, k, dt) { return lerp(a, b, 1 - Math.exp(-k * dt)); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function angDiff(a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
function el(tag, cls, parent, text) {
  var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e;
}
// tap handler that works for touch and mouse without double firing
function onTap(e, fn) {
  var last = 0;
  e.addEventListener('touchend', function (ev) { ev.preventDefault(); ev.stopPropagation(); last = Date.now(); fn(ev); }, { passive: false });
  e.addEventListener('click', function (ev) { if (Date.now() - last < 600) return; fn(ev); });
  e.addEventListener('touchstart', function (ev) { ev.stopPropagation(); }, { passive: true });
}
var store = {
  get: function (k, d) { try { var v = localStorage.getItem('fr_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem('fr_' + k, JSON.stringify(v)); } catch (e) {} }
};


// ===== 02_tex.js =====
// ---- procedural textures (no borrowed images) -------------------------------
var TEX = {};
var TEX_SIZE = 512;

function makeNoise(seed, n) {            // tileable value-noise lattice
  var r = mulberry(seed), g = new Float32Array(n * n);
  for (var i = 0; i < g.length; i++) g[i] = r();
  return function (x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var x0 = ((xi % n) + n) % n, y0 = ((yi % n) + n) % n, x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
    var a = g[y0 * n + x0], b = g[y0 * n + x1], c = g[y1 * n + x0], d = g[y1 * n + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
function fbmField(seed, size, base, oct) { // Float32 size*size in 0..1, tileable
  var out = new Float32Array(size * size), amp = 1, tot = 0;
  for (var o = 0; o < oct; o++) {
    var n = base << o, f = makeNoise(seed + o * 17, n), s = n / size;
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) out[y * size + x] += f(x * s, y * s) * amp;
    tot += amp; amp *= 0.5;
  }
  for (var i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function canvasOf(size, h) { var c = document.createElement('canvas'); c.width = size; c.height = h || size; return c; }
function fieldToCanvas(size, fn) {         // fn(i,x,y) -> [r,g,b] 0..255
  var c = canvasOf(size), ctx = c.getContext('2d'), im = ctx.createImageData(size, size), d = im.data;
  for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
    var i = y * size + x, p = fn(i, x, y); d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255;
  }
  ctx.putImageData(im, 0, 0); return c;
}
function normalFromHeight(h, size, strength) {
  return fieldToCanvas(size, function (i, x, y) {
    var xl = h[y * size + ((x + size - 1) % size)], xr = h[y * size + ((x + 1) % size)];
    var yu = h[((y + size - 1) % size) * size + x], yd = h[((y + 1) % size) * size + x];
    var dx = (xl - xr) * strength, dy = (yu - yd) * strength, l = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    return [(dx * l * 0.5 + 0.5) * 255, (-dy * l * 0.5 + 0.5) * 255, (l * 0.5 + 0.5) * 255];
  });
}
function texFrom(canvas, rep, srgb) {
  var t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = TEX.aniso || 1;
  return t;
}

function buildTextures(renderer, low) {
  var S = TEX_SIZE = low ? 256 : 512;
  TEX.aniso = Math.min(low ? 2 : 8, renderer.capabilities.getMaxAnisotropy());

  // asphalt ground
  var a1 = fbmField(11, S, 4, 6), a2 = fbmField(23, S, 64, 2), a3 = fbmField(31, S, 2, 4);
  var ah = new Float32Array(S * S);
  TEX.groundMap = texFrom(fieldToCanvas(S, function (i) {
    var grit = a2[i], big = a3[i], v = 0.2 + a1[i] * 0.14 + (grit - 0.5) * 0.09 - Math.max(0, big - 0.58) * 0.3;
    ah[i] = grit * 0.7 + a1[i] * 0.3;
    var c = clamp(v, 0, 1) * 255; return [c * 1.02, c, c * 0.96];
  }), [14, 14], true);
  TEX.groundNrm = texFrom(normalFromHeight(ah, S, 5), [14, 14]);
  TEX.groundRgh = texFrom(fieldToCanvas(S, function (i) { var r = clamp(0.95 - Math.max(0, a3[i] - 0.5) * 2.2, 0.25, 1) * 255; return [0, r, 0]; }), [14, 14]);

  // concrete (walls, barriers)
  var c1 = fbmField(41, S, 4, 6), c2 = fbmField(47, S, 48, 2), ch = new Float32Array(S * S);
  TEX.concMap = texFrom(fieldToCanvas(S, function (i, x, y) {
    var seam = (x % (S / 2) < 2 || y % (S / 2) < 2) ? 0.16 : 0;
    var hole = (Math.abs((x % (S / 2)) - S / 8) < 3 && Math.abs((y % (S / 2)) - S / 8) < 3) ? 0.2 : 0;
    var streak = Math.max(0, c1[(y >> 3) * S + x] - 0.55) * (y / S) * 0.9;
    var v = 0.56 + (c1[i] - 0.5) * 0.3 + (c2[i] - 0.5) * 0.12 - seam - hole - streak;
    ch[i] = c2[i] * 0.5 + c1[i] * 0.5 - seam * 3 - hole * 3;
    var c = clamp(v, 0, 1) * 255; return [c, c * 0.985, c * 0.95];
  }), null, true);
  TEX.concNrm = texFrom(normalFromHeight(ch, S, 4));

  // corrugated container steel (near-white, tinted by material color)
  var k1 = fbmField(53, S, 4, 5), k2 = fbmField(59, S, 32, 3), kh = new Float32Array(S * S);
  TEX.contMap = texFrom(fieldToCanvas(S, function (i, x, y) {
    var w = Math.sin(x / S * Math.PI * 2 * 12), rib = 0.5 + 0.5 * w;
    var rust = clamp((k1[i] - 0.66) * 4 + (k2[i] - 0.5) * 0.8, 0, 0.75);
    var dirt = (k2[i] - 0.5) * 0.14 + (k1[i] - 0.5) * 0.2;
    var v = 0.72 + rib * 0.14 + dirt;
    kh[i] = Math.max(-0.6, Math.min(0.6, w * 1.4)) + k2[i] * 0.15;
    var r = lerp(v, 0.4, rust), g = lerp(v, 0.27, rust), b = lerp(v, 0.18, rust);
    return [clamp(r, 0, 1) * 255, clamp(g, 0, 1) * 255, clamp(b, 0, 1) * 255];
  }), null, true);
  TEX.contNrm = texFrom(normalFromHeight(kh, S, 3.2));
  TEX.contRgh = texFrom(fieldToCanvas(S, function (i) { var rust = clamp((k1[i] - 0.66) * 4, 0, 0.75); return [0, lerp(0.45 + k2[i] * 0.2, 0.95, rust) * 255, 0]; }));

  // wooden crate
  var w1 = fbmField(67, S, 4, 5), w2 = fbmField(71, S, 64, 2), wh = new Float32Array(S * S);
  TEX.crateMap = texFrom(fieldToCanvas(S, function (i, x, y) {
    var e = S / 8, frame = (x < e || x > S - e || y < e || y > S - e);
    var px = frame ? 0 : Math.floor(x / (S / 5)), gx = frame ? (x < e || x > S - e ? y : x) : y;
    var grain = Math.sin((gx / S * 40) + w1[i] * 9 + px * 2.1) * 0.5 + 0.5;
    var gap = (!frame && (x % (S / 5)) < 2) || (Math.abs(x - e) < 1.5) || (Math.abs(x - (S - e)) < 1.5) || (Math.abs(y - e) < 1.5) || (Math.abs(y - (S - e)) < 1.5);
    var v = (frame ? 0.62 : 0.52) + grain * 0.12 + (w2[i] - 0.5) * 0.12 + (w1[i] - 0.5) * 0.2 - (gap ? 0.3 : 0);
    wh[i] = grain * 0.3 + (frame ? 0.8 : 0) - (gap ? 1 : 0);
    v = clamp(v, 0, 1); return [v * 205, v * 160, v * 105];
  }), null, true);
  TEX.crateNrm = texFrom(normalFromHeight(wh, S, 2.5));

  // brushed dark metal (gun, drones)
  var m1 = fbmField(79, 256, 64, 2), m2 = fbmField(83, 256, 4, 4);
  TEX.metalRgh = texFrom(fieldToCanvas(256, function (i, x, y) {
    var r = 0.38 + (m1[(y * 256) + ((x >> 3) << 3) % 256] - 0.5) * 0.25 + (m2[i] - 0.5) * 0.3; return [0, clamp(r, 0.1, 1) * 255, 0];
  }), [2, 2]);

  // soft round sprite, spark, muzzle flash, bullet hole
  function radial(size, stops) {
    var c = canvasOf(size), x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
  }
  TEX.soft = new THREE.CanvasTexture(radial(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]));
  TEX.glow = new THREE.CanvasTexture(radial(64, [[0, 'rgba(255,255,255,1)'], [0.15, 'rgba(255,240,200,.9)'], [0.45, 'rgba(255,160,60,.3)'], [1, 'rgba(255,120,0,0)']]));
  var sm = canvasOf(128), sx = sm.getContext('2d'), sr = mulberry(5);
  for (var i = 0; i < 26; i++) {
    var px = 64 + (sr() - 0.5) * 60, py = 64 + (sr() - 0.5) * 60, rr = 14 + sr() * 26, g = sx.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 128, 128);
  }
  var vg = sx.createRadialGradient(64, 64, 30, 64, 64, 64); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,1)');
  sx.globalCompositeOperation = 'destination-out'; sx.fillStyle = vg; sx.fillRect(0, 0, 128, 128);
  TEX.smoke = new THREE.CanvasTexture(sm);
  var fl = canvasOf(128), fx = fl.getContext('2d'); fx.translate(64, 64);
  for (var k = 0; k < 9; k++) {
    var an = k / 9 * Math.PI * 2 + sr() * 0.5, len = 30 + sr() * 32, wd = 5 + sr() * 9;
    var gg = fx.createLinearGradient(0, 0, Math.cos(an) * len, Math.sin(an) * len);
    gg.addColorStop(0, 'rgba(255,250,220,1)'); gg.addColorStop(0.4, 'rgba(255,190,80,.8)'); gg.addColorStop(1, 'rgba(255,120,20,0)');
    fx.fillStyle = gg; fx.beginPath(); fx.moveTo(Math.cos(an + 1.57) * wd, Math.sin(an + 1.57) * wd);
    fx.lineTo(Math.cos(an) * len, Math.sin(an) * len); fx.lineTo(Math.cos(an - 1.57) * wd, Math.sin(an - 1.57) * wd); fx.fill();
  }
  var cg = fx.createRadialGradient(0, 0, 0, 0, 0, 26); cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(1, 'rgba(255,200,100,0)');
  fx.fillStyle = cg; fx.fillRect(-64, -64, 128, 128);
  TEX.flash = new THREE.CanvasTexture(fl);
  var bh = canvasOf(64), bx = bh.getContext('2d'), bg = bx.createRadialGradient(32, 32, 0, 32, 32, 32);
  bg.addColorStop(0, 'rgba(0,0,0,1)'); bg.addColorStop(0.22, 'rgba(8,8,8,.95)'); bg.addColorStop(0.4, 'rgba(40,36,32,.5)'); bg.addColorStop(1, 'rgba(60,55,50,0)');
  bx.fillStyle = bg; bx.fillRect(0, 0, 64, 64);
  bx.strokeStyle = 'rgba(15,15,15,.5)'; bx.lineWidth = 1;
  for (var q = 0; q < 7; q++) { var aa = sr() * 6.28, l2 = 10 + sr() * 16; bx.beginPath(); bx.moveTo(32 + Math.cos(aa) * 6, 32 + Math.sin(aa) * 6); bx.lineTo(32 + Math.cos(aa) * l2, 32 + Math.sin(aa) * l2); bx.stroke(); }
  TEX.hole = new THREE.CanvasTexture(bh);

  // sky (equirect): dusk gradient + sun glow + clouds
  var SW = low ? 512 : 1024, SH = SW / 2, sc = canvasOf(SW, SH), sk = sc.getContext('2d');
  var grd = sk.createLinearGradient(0, 0, 0, SH);
  grd.addColorStop(0, '#1d3557'); grd.addColorStop(0.28, '#3f6a9a'); grd.addColorStop(0.42, '#8fa6b8'); grd.addColorStop(0.485, '#f3c491'); grd.addColorStop(0.5, '#f7b06a');
  grd.addColorStop(0.52, '#6b5a50'); grd.addColorStop(1, '#3a3836');
  sk.fillStyle = grd; sk.fillRect(0, 0, SW, SH);
  var sunU = SUN_AZ_U * SW, sunV = SH * 0.5 - SUN_ELEV / Math.PI * SH;
  [-SW, 0, SW].forEach(function (off) {
    var g2 = sk.createRadialGradient(sunU + off, sunV, 0, sunU + off, sunV, SW * 0.22);
    g2.addColorStop(0, 'rgba(255,250,235,1)'); g2.addColorStop(0.035, 'rgba(255,238,190,1)'); g2.addColorStop(0.07, 'rgba(255,200,120,.55)'); g2.addColorStop(0.4, 'rgba(255,170,90,.16)'); g2.addColorStop(1, 'rgba(255,160,80,0)');
    sk.fillStyle = g2; sk.fillRect(0, 0, SW, SH * 0.5);
  });
  var cl = fbmField(97, 256, 4, 5), im = sk.getImageData(0, 0, SW, SH >> 1), dd = im.data;
  for (var y = 0; y < (SH >> 1); y++) for (var x = 0; x < SW; x++) {
    var el2 = 1 - y / (SH / 2), u = x / SW * 256 * 2, v2 = Math.pow(el2, 0.6) * 256 * 0.8;
    var n = cl[((v2 | 0) % 256) * 256 + ((u | 0) % 256)], a = clamp((n - 0.52) * 4.5, 0, 1) * clamp((1 - el2) * 3, 0, 1) * clamp(el2 * 14, 0, 1) * 0.8;
    var j = (y * SW + x) * 4, du = Math.min(Math.abs(x - sunU), SW - Math.abs(x - sunU)) / SW, warm = clamp(1 - du * 4, 0, 1);
    dd[j] = lerp(dd[j], lerp(205, 255, warm), a); dd[j + 1] = lerp(dd[j + 1], lerp(190, 205, warm), a); dd[j + 2] = lerp(dd[j + 2], lerp(200, 150, warm), a);
  }
  sk.putImageData(im, 0, 0);
  TEX.sky = new THREE.CanvasTexture(sc); TEX.sky.encoding = THREE.sRGBEncoding; TEX.sky.mapping = THREE.EquirectangularReflectionMapping;
}
var SUN_ELEV = 0.42, SUN_AZ = 2.25;      // radians: elevation, azimuth
var SUN_AZ_U = 0.5 + SUN_AZ / (Math.PI * 2);


// ===== 03_audio.js =====
// ---- synthesized audio (WebAudio, starts after the first tap) ---------------
var AU = { ctx: null, ok: false, vol: store.get('vol', 0.8) };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try {
    var c = AU.ctx = new AC();
    AU.master = c.createGain(); AU.master.gain.value = AU.vol;
    AU.lp = c.createBiquadFilter(); AU.lp.type = 'lowpass'; AU.lp.frequency.value = 20000;
    AU.comp = c.createDynamicsCompressor(); AU.comp.threshold.value = -14; AU.comp.ratio.value = 6;
    AU.lp.connect(AU.comp); AU.comp.connect(AU.master); AU.master.connect(c.destination);
    var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = b;
    // ambience: wind + distant rotor hum
    var w = c.createBufferSource(); w.buffer = b; w.loop = true;
    var wf = c.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 320;
    var wg = c.createGain(); wg.gain.value = 0.11;
    var lfo = c.createOscillator(); lfo.frequency.value = 0.13; var lg = c.createGain(); lg.gain.value = 0.05; lfo.connect(lg); lg.connect(wg.gain); lfo.start();
    w.connect(wf); wf.connect(wg); wg.connect(AU.lp); w.start();
    var h = c.createOscillator(); h.type = 'sawtooth'; h.frequency.value = 92;
    var h2 = c.createOscillator(); h2.type = 'sawtooth'; h2.frequency.value = 139;
    var hf = c.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 520;
    AU.hum = c.createGain(); AU.hum.gain.value = 0; h.connect(hf); h2.connect(hf); hf.connect(AU.hum); AU.hum.connect(AU.lp); h.start(); h2.start();
    AU.ok = true;
    if (c.state === 'suspended') c.resume();
  } catch (e) { AU.ok = false; }
}
function auOut(pan) {
  if (pan && AU.ctx.createStereoPanner) { var p = AU.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(AU.lp); return p; }
  return AU.lp;
}
function auNoise(t, dur, f0, f1, vol, type, pan, q) {
  var c = AU.ctx, s = c.createBufferSource(); s.buffer = AU.noise; s.loop = true;
  var f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.Q.value = q || 0.7;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(auOut(pan)); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
}
function auTone(t, dur, f0, f1, vol, type, pan, attack) {
  var c = AU.ctx, o = c.createOscillator(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + dur);
  var g = c.createGain();
  if (attack) { g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); } else g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(auOut(pan)); o.start(t); o.stop(t + dur + 0.02);
}
// per weapon: [crack, body length, body start freq, thump freq, tail, volume]
var SHOT_SND = { ar: [1, 0.16, 3800, 170, 1, 1], pistol: [0.8, 0.1, 4200, 240, 0.5, 0.8], shotgun: [0.9, 0.3, 2400, 120, 1.5, 1.15], sniper: [1.3, 0.34, 3000, 110, 2.2, 1.2], smg: [0.7, 0.1, 4600, 220, 0.6, 0.75], lmg: [1, 0.2, 3200, 140, 1.2, 1.05], magnum: [1.2, 0.26, 2800, 130, 1.8, 1.15], rocket: [0.3, 0.4, 1500, 90, 1.5, 1] };
var SFX = {
  shot: function (id) { if (!AU.ok) return; var t = AU.ctx.currentTime, k = SHOT_SND[id] || SHOT_SND.ar;
    auNoise(t, 0.03, 9000, 3000, 0.9 * k[0], 'highpass');
    auNoise(t, k[1], k[2], 300, 0.95 * k[5], 'lowpass');
    auTone(t, 0.11 + k[1] * 0.3, k[3], k[3] * 0.28, 0.9 * k[5], 'sine');
    auNoise(t + 0.05, 0.55 * k[4], 1400, 180, 0.16 * k[4], 'lowpass');
    auNoise(t + 0.19, 0.5 * k[4], 700, 120, 0.07 * k[4], 'lowpass');
    if (id === 'rocket') { auNoise(t, 0.7, 500, 3500, 0.5, 'bandpass', 0, 1.5); } },
  empty: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.03, 4000, 2000, 0.3, 'bandpass', 0, 4); auTone(t, 0.04, 1400, 900, 0.08, 'square'); },
  click: function (dt, f, v) { if (!AU.ok) return; var t = AU.ctx.currentTime + (dt || 0); auNoise(t, 0.045, f || 3000, 900, v || 0.35, 'bandpass', 0, 3); auTone(t, 0.06, (f || 3000) * 0.4, (f || 3000) * 0.3, 0.07, 'triangle'); },
  reload: function (d) { var k = (d || 1.7) / 1.7; SFX.click(0.1 * k, 2200, 0.3); SFX.click(0.75 * k, 2800, 0.36); SFX.click(0.85 * k, 1800, 0.25); SFX.click(1.35 * k, 3600, 0.4); SFX.click(1.45 * k, 2500, 0.4); },
  throwS: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.18, 600, 2400, 0.25, 'bandpass', 0, 1.2); },
  pickup: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.1, 660, 660, 0.12, 'triangle'); auTone(t + 0.08, 0.16, 990, 990, 0.12, 'triangle'); },
  coin: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.07, 1568, 1568, 0.1, 'square'); auTone(t + 0.07, 0.25, 2093, 2093, 0.1, 'square'); },
  streak: function (n) { if (!AU.ok) return; var t = AU.ctx.currentTime, base = 440 * Math.pow(1.122, Math.min(n, 10)); [1, 1.26, 1.5, 2].forEach(function (m, i) { auTone(t + i * 0.07, 0.3, base * m, base * m, 0.11, 'sawtooth', 0, 0.01); }); },
  step: function (run) { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.07, rnd(500, 800), 150, run ? 0.2 : 0.13, 'lowpass'); auNoise(t, 0.03, 3000, 1500, 0.03, 'bandpass'); },
  shell: function () { if (!AU.ok) return; var t = AU.ctx.currentTime + 0.35; var f = rnd(3000, 4400); auTone(t, 0.09, f, f * 0.98, 0.035, 'sine'); auTone(t + 0.11, 0.06, f * 1.2, f * 1.19, 0.02, 'sine'); },
  impact: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.05, 5000, 1200, 0.16 * vol, 'bandpass', pan, 2); },
  hit: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.035, 2100, 1700, 0.12, 'square'); auNoise(t, 0.04, 6000, 2500, 0.14, 'bandpass', 0, 3); },
  kill: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.07, 1200, 1200, 0.13, 'square'); auTone(t + 0.07, 0.12, 1800, 1800, 0.13, 'square'); },
  charge: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.42, 500, 1900, 0.06 * vol, 'sawtooth', pan, 0.3); },
  bolt: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.2, 1300, 180, 0.2 * vol, 'sawtooth', pan); auNoise(t, 0.1, 5000, 800, 0.12 * vol, 'bandpass', pan, 2); },
  beep: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.06, 2400, 2400, 0.1 * vol, 'square', pan); },
  boom: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime;
    auNoise(t, 0.9, 1800, 50, 1.0 * vol, 'lowpass', pan); auTone(t, 0.5, 95, 28, 0.9 * vol, 'sine', pan); auNoise(t, 0.08, 8000, 2000, 0.4 * vol, 'highpass', pan); auNoise(t + 0.2, 1.1, 500, 80, 0.2 * vol, 'lowpass', pan); },
  hurt: function () { if (!AU.ok) return; var c = AU.ctx, t = c.currentTime; auTone(t, 0.2, 130, 45, 0.8, 'sine'); auNoise(t, 0.14, 1500, 200, 0.5, 'lowpass');
    AU.lp.frequency.cancelScheduledValues(t); AU.lp.frequency.setValueAtTime(700, t); AU.lp.frequency.exponentialRampToValueAtTime(20000, t + 0.9); },
  alarm: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; for (var i = 0; i < 3; i++) { auTone(t + i * 0.36, 0.16, 660, 660, 0.09, 'square'); auTone(t + i * 0.36 + 0.17, 0.16, 495, 495, 0.09, 'square'); } },
  rescue: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; [523, 659, 784, 1047, 1319].forEach(function (f, i) { auTone(t + i * 0.09, 0.4, f, f, 0.13, 'triangle', 0, 0.01); auTone(t + i * 0.09, 0.3, f * 2, f * 2, 0.04, 'sine'); }); },
  down: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.28, 520, 170, 0.12 * vol, 'triangle', pan, 0.02); auNoise(t + 0.3, 0.12, 700, 120, 0.4 * vol, 'lowpass', pan); auTone(t + 0.3, 0.14, 110, 50, 0.4 * vol, 'sine', pan); },
  cage: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.6, 900, 80, 0.14, 'sawtooth'); auNoise(t, 0.5, 6000, 400, 0.14, 'bandpass', 0, 2); },
  ui: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.05, 880, 880, 0.08, 'triangle'); },
  win: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { auTone(t + i * 0.13, 0.5, f, f, 0.12, 'triangle', 0, 0.01); }); },
  lose: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; [392, 330, 262, 196].forEach(function (f, i) { auTone(t + i * 0.25, 0.6, f, f * 0.97, 0.12, 'triangle', 0, 0.02); }); }
};
function setVolume(v) { AU.vol = v; store.set('vol', v); if (AU.master) AU.master.gain.value = v; }


// ===== 04_world.js =====
// ---- scene, lighting, level geometry, colliders -----------------------------
var scene, camera, renderer, sun, hemi, envRT;
var COLS = [];      // axis aligned boxes {x0,x1,y0,y1,z0,z1}
var CIRCLES = [];   // {x,z,r} (cages) — block walking only
var ARENA = 31;
var SUN_DIR;
var MAT = {};
var SPAWN_POS = [0, 26];

function stdMat(o) { return new THREE.MeshStandardMaterial(o); }
function addCol(x, y, z, w, h, d) { COLS.push({ x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2, z0: z - d / 2, z1: z + d / 2 }); }
function addBox(w, h, d, x, y, z, mat, noCol, noShadow) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = !noShadow; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m);
  if (!noCol) addCol(x, y, z, w, h, d);
  return m;
}
function repTex(t, rx, ry) { var c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; }

function buildWorld() {
  scene = new THREE.Scene();
  scene.background = TEX.sky;
  scene.fog = new THREE.FogExp2(0xa39a94, 0.0058);
  camera = new THREE.PerspectiveCamera(70, 1, 0.03, 400);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  SUN_DIR = new THREE.Vector3(Math.cos(SUN_ELEV) * Math.cos(SUN_AZ), Math.sin(SUN_ELEV), Math.cos(SUN_ELEV) * Math.sin(SUN_AZ));
  sun = new THREE.DirectionalLight(0xffd2a0, 2.6);
  sun.castShadow = true; sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
  var sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  scene.add(sun); scene.add(sun.target);
  hemi = new THREE.HemisphereLight(0x9db8dc, 0x50443a, 0.3);
  scene.add(hemi);
  try {
    var pm = new THREE.PMREMGenerator(renderer); envRT = pm.fromEquirectangular(TEX.sky); scene.environment = envRT.texture; pm.dispose();
  } catch (e) { hemi.intensity = 0.95; }

  // ground
  var gm = stdMat({ map: TEX.groundMap, normalMap: TEX.groundNrm, roughnessMap: TEX.groundRgh, roughness: 1, metalness: 0, envMapIntensity: 0.6 });
  var g = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), gm);
  gm.map = repTex(TEX.groundMap, 36, 36); gm.normalMap = repTex(TEX.groundNrm, 36, 36); gm.roughnessMap = repTex(TEX.groundRgh, 36, 36);
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; g.matrixAutoUpdate = false; g.updateMatrix(); scene.add(g);

  // painted lines + puddles (flat decals)
  var lineM = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.8, transparent: true, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  var whiteM = lineM.clone(); whiteM.color.set(0xd8d8d0);
  function flat(w, d, x, z, m, y) { var p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y || 0.012, z); p.receiveShadow = true; p.matrixAutoUpdate = false; p.updateMatrix(); scene.add(p); }
  flat(0.18, 50, -5, 0, lineM); flat(0.18, 50, 5, 0, lineM); flat(50, 0.18, 0, 18, whiteM); flat(50, 0.18, 0, -18, whiteM);
  for (var i = -4; i <= 4; i++) flat(0.14, 5, i * 3 + 0.01, 21, whiteM);
  var pudM = new THREE.MeshStandardMaterial({ color: 0x1b1a18, roughness: 0.04, metalness: 0, envMapIntensity: 0.55, transparent: true, opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  [[4, 9, 2.6], [-12, 2, 3.4], [15, -12, 2.2], [-6, -18, 3], [9, 22, 2], [-20, 14, 2.6]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.CircleGeometry(p[2], 20), pudM); m.rotation.x = -Math.PI / 2; m.scale.y = 0.6; m.rotation.z = p[0]; m.position.set(p[0], 0.016, p[1]); m.receiveShadow = true; scene.add(m);
  });

  // perimeter walls
  var W = ARENA + 1, wallM = stdMat({ map: repTex(TEX.concMap, 13, 1), normalMap: repTex(TEX.concNrm, 13, 1), roughness: 0.92, metalness: 0, envMapIntensity: 0.5 });
  addBox(W * 2 + 1, 5, 1, 0, 2.5, -W - 0.5, wallM); addBox(W * 2 + 1, 5, 1, 0, 2.5, W + 0.5, wallM);
  addBox(1, 5, W * 2 + 1, -W - 0.5, 2.5, 0, wallM); addBox(1, 5, W * 2 + 1, W + 0.5, 2.5, 0, wallM);
  var capM = stdMat({ color: 0x3a3d40, roughness: 0.5, metalness: 0.8, roughnessMap: TEX.metalRgh });
  addBox(W * 2 + 1.2, 0.12, 1.2, 0, 5.06, -W - 0.5, capM, true); addBox(W * 2 + 1.2, 0.12, 1.2, 0, 5.06, W + 0.5, capM, true);
  addBox(1.2, 0.12, W * 2 + 1.2, -W - 0.5, 5.06, 0, capM, true); addBox(1.2, 0.12, W * 2 + 1.2, W + 0.5, 5.06, 0, capM, true);

  // skyline silhouettes beyond the walls
  var farM = new THREE.MeshLambertMaterial({ color: 0x23272e }), r = mulberry(77);
  for (var k = 0; k < 22; k++) {
    var an = k / 22 * Math.PI * 2 + r() * 0.2, dist = 60 + r() * 45, hh = 8 + r() * 26, ww = 8 + r() * 14;
    var b = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, ww * (0.6 + r() * 0.6)), farM); b.position.set(Math.cos(an) * dist, hh / 2, Math.sin(an) * dist); b.rotation.y = r() * 3; b.matrixAutoUpdate = false; b.updateMatrix(); scene.add(b);
  }

  // shipping containers: [x, z, alongZ, colorIndex, stacked]
  var cc = [0x8f2f24, 0x244f78, 0x33663f, 0x9c6f1f, 0x666b72, 0x74401f];
  MAT.cont = cc.map(function (c) { return stdMat({ color: c, map: TEX.contMap, normalMap: TEX.contNrm, roughnessMap: TEX.contRgh, roughness: 1, metalness: 0.35, envMapIntensity: 0.6 }); });
  [[-14, -8, 0, 0, 0], [-14, -10.6, 0, 1, 1], [12, -15, 1, 2, 0], [17, 2, 0, 3, 0], [-18, 8, 1, 4, 0], [1, -21, 0, 5, 0], [-3, 10, 0, 1, 1], [21, -19, 1, 0, 0],
   [-23, -24, 0, 2, 0], [8, 15, 1, 3, 0], [-11, 23, 0, 0, 0], [25, 15, 0, 4, 1], [-27, 2, 1, 5, 0], [10, 2, 1, 1, 0]].forEach(function (c) {
    var w = c[2] ? 2.44 : 6.06, d = c[2] ? 6.06 : 2.44;
    addBox(w, 2.59, d, c[0], 1.295, c[1], MAT.cont[c[3]]);
    if (c[4]) addBox(w, 2.59, d, c[0] + (c[2] ? 0 : 0.5), 3.885, c[1] + (c[2] ? 0.5 : 0), MAT.cont[(c[3] + 2) % 6]);
  });

  // concrete barriers
  var barM = stdMat({ map: TEX.concMap, normalMap: TEX.concNrm, roughness: 0.9, metalness: 0, envMapIntensity: 0.5 });
  [[-6, 16, 0], [6, 16, 0], [0, 6, 0], [-9, -14, 1], [6, -9, 1], [18, -6, 0], [-20, -4, 0], [14, 9, 1], [-14, 15, 1], [0, -12, 0], [24, -8, 1], [-5, 27, 0]].forEach(function (b) {
    addBox(b[2] ? 0.55 : 2.6, 1.0, b[2] ? 2.6 : 0.55, b[0], 0.5, b[1], barM);
  });

  // crates & barrels (seeded scatter, rejecting overlaps)
  var crateM = stdMat({ map: TEX.crateMap, normalMap: TEX.crateNrm, roughness: 0.85, metalness: 0, envMapIntensity: 0.4 });
  var barrelMs = [0x8a2f25, 0x2a4d7a, 0x4b5a3a].map(function (c) { return stdMat({ color: c, roughness: 0.5, metalness: 0.7, roughnessMap: TEX.metalRgh, envMapIntensity: 0.8 }); });
  var barrelG = new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14);
  function free(x, z, rad) {
    if (Math.abs(x - SPAWN_POS[0]) < 4 && Math.abs(z - SPAWN_POS[1]) < 4) return false;
    for (var j = 0; j < COLS.length; j++) { var c = COLS[j]; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) return false; }
    return true;
  }
  var placed = 0, tries = 0;
  while (placed < 30 && tries++ < 600) {
    var x = (r() * 2 - 1) * (ARENA - 2), z = (r() * 2 - 1) * (ARENA - 2);
    if (!free(x, z, 1.2)) continue;
    if (placed % 3 === 2) {
      var bm = new THREE.Mesh(barrelG, barrelMs[placed % 3 === 2 ? (placed / 3 | 0) % 3 : 0]); bm.position.set(x, 0.45, z); bm.castShadow = bm.receiveShadow = true; bm.matrixAutoUpdate = false; bm.updateMatrix(); scene.add(bm);
      addCol(x, 0.45, z, 0.56, 0.9, 0.56);
    } else {
      var s = 0.9 + r() * 0.5; addBox(s, s, s, x, s / 2, z, crateM);
      if (r() < 0.35) { var s2 = s * 0.75; addBox(s2, s2, s2, x + (r() - 0.5) * 0.2, s + s2 / 2, z + (r() - 0.5) * 0.2, crateM); }
    }
    placed++;
  }

  // lamp posts
  var poleM = stdMat({ color: 0x2c2f33, roughness: 0.5, metalness: 0.85, roughnessMap: TEX.metalRgh });
  var lampM = new THREE.MeshBasicMaterial({ color: 0xfff1cf });
  [[-16, -20], [16, -22], [-22, 12], [22, 20], [0, 0.5], [-2, 30]].forEach(function (p) {
    if (!free(p[0], p[1], 0.3)) return;
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 6.5, 8), poleM); pole.position.set(p[0], 3.25, p[1]); pole.castShadow = true; scene.add(pole);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.14), poleM); arm.position.set(p[0] + 0.5, 6.5, p[1]); scene.add(arm);
    var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.2), lampM); lamp.position.set(p[0] + 0.85, 6.44, p[1]); scene.add(lamp);
    addCol(p[0], 3.25, p[1], 0.22, 6.5, 0.22);
  });
  buildNav();
}

// ray vs world (boxes + ground). o,d = THREE.Vector3 (d normalized). returns {t, nx, ny, nz} or null
function rayWorld(ox, oy, oz, dx, dy, dz, maxT) {
  var best = maxT, bn = 0, hit = false;
  if (dy < -1e-5) { var tg = -oy / dy; if (tg > 0 && tg < best) { best = tg; bn = 2; hit = true; } }
  for (var i = 0; i < COLS.length; i++) {
    var c = COLS[i], t0 = 0, t1 = best, n = 0, a, b, s, inv;
    inv = 1 / dx; a = (c.x0 - ox) * inv; b = (c.x1 - ox) * inv; s = 1; if (a > b) { var q = a; a = b; b = q; s = -1; } if (a > t0) { t0 = a; n = -s * 1; } if (b < t1) t1 = b; if (t0 > t1) continue;
    inv = 1 / dy; a = (c.y0 - oy) * inv; b = (c.y1 - oy) * inv; s = 1; if (a > b) { q = a; a = b; b = q; s = -1; } if (a > t0) { t0 = a; n = -s * 2; } if (b < t1) t1 = b; if (t0 > t1) continue;
    inv = 1 / dz; a = (c.z0 - oz) * inv; b = (c.z1 - oz) * inv; s = 1; if (a > b) { q = a; a = b; b = q; s = -1; } if (a > t0) { t0 = a; n = -s * 3; } if (b < t1) t1 = b; if (t0 > t1) continue;
    if (t0 > 0 && t0 < best) { best = t0; bn = n; hit = true; }
  }
  if (!hit) return null;
  var an = Math.abs(bn), sg = bn < 0 ? -1 : 1;
  return { t: best, nx: an === 1 ? sg : 0, ny: an === 2 ? sg : 0, nz: an === 3 ? sg : 0 };
}
function losClear(ax, ay, az, bx, by, bz) {
  var dx = bx - ax, dy = by - ay, dz = bz - az, l = Math.sqrt(dx * dx + dy * dy + dz * dz); if (l < 0.01) return true;
  return !rayWorld(ax, ay, az, dx / l + 1e-9, dy / l + 1e-9, dz / l + 1e-9, l - 0.05);
}
// move a circle (player) with sliding
function collideMove(pos, nx, nz, rad, feetY) {
  var x = nx, z = pos.z, i, c;
  for (i = 0; i < COLS.length; i++) { c = COLS[i]; if (c.y1 < feetY + 0.35 || c.y0 > feetY + 1.7) continue; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) { x = pos.x < (c.x0 + c.x1) / 2 ? Math.min(x, c.x0 - rad) : Math.max(x, c.x1 + rad); } }
  z = nz;
  for (i = 0; i < COLS.length; i++) { c = COLS[i]; if (c.y1 < feetY + 0.35 || c.y0 > feetY + 1.7) continue; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) { z = pos.z < (c.z0 + c.z1) / 2 ? Math.min(z, c.z0 - rad) : Math.max(z, c.z1 + rad); } }
  for (i = 0; i < CIRCLES.length; i++) { var k = CIRCLES[i], ddx = x - k.x, ddz = z - k.z, dd = Math.hypot(ddx, ddz), mr = k.r + rad; if (dd < mr && dd > 1e-4) { x = k.x + ddx / dd * mr; z = k.z + ddz / dd * mr; } }
  pos.x = clamp(x, -ARENA, ARENA); pos.z = clamp(z, -ARENA, ARENA);
}
function obstacleTop(x, z, rad) {
  var top = 0;
  for (var i = 4; i < COLS.length; i++) { var c = COLS[i]; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad && c.y1 > top && c.y1 < 6) top = c.y1; }
  return top;
}

// ---- walking grid + flow field toward the player (for ground enemies) -------
var NAV = { n: 64, blocked: null, dist: null, q: null };
function buildNav() {
  var n = NAV.n; NAV.blocked = new Uint8Array(n * n); NAV.dist = new Int16Array(n * n); NAV.q = new Int32Array(n * n);
  for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) {
    var x = i - 32 + 0.5, z = j - 32 + 0.5, b = Math.abs(x) > ARENA - 0.3 || Math.abs(z) > ARENA - 0.3;
    for (var k = 0; k < COLS.length && !b; k++) { var c = COLS[k]; if (c.y0 < 1.3 && c.y1 > 0.35 && x > c.x0 - 0.5 && x < c.x1 + 0.5 && z > c.z0 - 0.5 && z < c.z1 + 0.5) b = true; }
    NAV.blocked[j * n + i] = b ? 1 : 0;
  }
}
function navCell(x, z) { return clamp(Math.floor(z + 32), 0, 63) * 64 + clamp(Math.floor(x + 32), 0, 63); }
function updateNav(px, pz, dist) {
  var n = NAV.n, d = dist || NAV.dist, q = NAV.q, bl = NAV.blocked, head = 0, tail = 0, s = navCell(px, pz);
  d.fill(-1); d[s] = 0; q[tail++] = s;
  while (head < tail) {
    var c = q[head++], ci = c % n, cj = (c / n) | 0, nd = d[c] + 1;
    if (ci > 0 && d[c - 1] < 0 && !bl[c - 1]) { d[c - 1] = nd; q[tail++] = c - 1; }
    if (ci < n - 1 && d[c + 1] < 0 && !bl[c + 1]) { d[c + 1] = nd; q[tail++] = c + 1; }
    if (cj > 0 && d[c - n] < 0 && !bl[c - n]) { d[c - n] = nd; q[tail++] = c - n; }
    if (cj < n - 1 && d[c + n] < 0 && !bl[c + n]) { d[c + n] = nd; q[tail++] = c + n; }
  }
}
// direction (unit, in out[0],out[1]) from x,z toward the player along the field; false if unknown
function navDir(x, z, out, dist) {
  var n = NAV.n, d = dist || NAV.dist, bl = NAV.blocked, c = navCell(x, z), ci = c % n, cj = (c / n) | 0, best = d[c] < 0 ? 32000 : d[c], bi = 0, bj = 0;
  for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
    if (!di && !dj) continue; var i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= n || j >= n) continue;
    var k = j * n + i; if (d[k] < 0) continue;
    if (di && dj && (bl[cj * n + i] || bl[j * n + ci])) continue;
    var v = d[k] + (di && dj ? 0.4 : 0); if (v < best) { best = v; bi = di; bj = dj; }
  }
  if (!bi && !bj) return false;
  var tx = ci + bi - 32 + 0.5 - x, tz = cj + bj - 32 + 0.5 - z, l = Math.hypot(tx, tz) || 1; out[0] = tx / l; out[1] = tz / l; return true;
}


// ===== 05_friends.js =====
// ---- minimal GLB reader + the 8 friends (Meshy models) ----------------------
var FRIEND_NAMES = ['ハル', 'メガネ', 'ツン', 'ナギ', 'ロング', 'ミディ', 'ボブ', 'ウェーブ'];
var MODEL_STATUS = { boys: 'loading', girls: 'loading', boys_lod: 'loading', girls_lod: 'loading' };

function parseGLB(buf) {
  var dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not glb');
  var jl = dv.getUint32(12, true), jbytes = new Uint8Array(buf, 20, jl), js = '';
  if (window.TextDecoder) js = new TextDecoder('utf-8').decode(jbytes); else { for (var i = 0; i < jl; i++) js += String.fromCharCode(jbytes[i]); js = decodeURIComponent(escape(js)); }
  var json = JSON.parse(js), bo = 20 + jl, binOff = bo + 8;
  var CB = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  function acc(ix, asIndex) {
    var a = json.accessors[ix], bv = json.bufferViews[a.bufferView], n = NC[a.type], cb = CB[a.componentType];
    var stride = bv.byteStride || n * cb, base = binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
    var out = asIndex ? new Uint32Array(a.count * n) : new Float32Array(a.count * n), ct = a.componentType, nm = a.normalized;
    for (var i = 0; i < a.count; i++) for (var k = 0; k < n; k++) {
      var o = base + i * stride + k * cb, v;
      if (ct === 5126) v = dv.getFloat32(o, true); else if (ct === 5123) { v = dv.getUint16(o, true); if (nm) v /= 65535; }
      else if (ct === 5122) { v = dv.getInt16(o, true); if (nm) v = Math.max(v / 32767, -1); } else if (ct === 5125) v = dv.getUint32(o, true);
      else if (ct === 5121) { v = dv.getUint8(o); if (nm) v /= 255; } else { v = dv.getInt8(o); if (nm) v = Math.max(v / 127, -1); }
      out[i * n + k] = v;
    }
    return out;
  }
  var res = { meshes: [], image: null };
  (json.nodes || []).forEach(function (nd) {
    if (nd.mesh == null) return;
    var p = json.meshes[nd.mesh].primitives[0], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(acc(p.attributes.POSITION), 3));
    if (p.attributes.NORMAL != null) g.setAttribute('normal', new THREE.BufferAttribute(acc(p.attributes.NORMAL), 3));
    if (p.attributes.TEXCOORD_0 != null) g.setAttribute('uv', new THREE.BufferAttribute(acc(p.attributes.TEXCOORD_0), 2));
    if (p.indices != null) g.setIndex(new THREE.BufferAttribute(acc(p.indices, true), 1));
    var m = new THREE.Matrix4();
    if (nd.matrix) m.fromArray(nd.matrix); else {
      var t = nd.translation || [0, 0, 0], r = nd.rotation || [0, 0, 0, 1], s = nd.scale || [1, 1, 1];
      m.compose(new THREE.Vector3(t[0], t[1], t[2]), new THREE.Quaternion(r[0], r[1], r[2], r[3]), new THREE.Vector3(s[0], s[1], s[2]));
    }
    g.applyMatrix4(m);
    if (g.attributes.normal) g.normalizeNormals(); else g.computeVertexNormals();
    g.computeBoundingSphere();
    res.meshes.push({ name: nd.name || '', geometry: g });
  });
  if (json.images && json.images[0] && json.images[0].bufferView != null) {
    var iv = json.bufferViews[json.images[0].bufferView];
    res.image = { bytes: new Uint8Array(buf, binOff + (iv.byteOffset || 0), iv.byteLength), mime: json.images[0].mimeType || 'image/jpeg' };
  }
  return res;
}
function fetchBinary(path, key, cb) {
  var done = false;
  function fin(err, buf) { if (done) return; done = true; cb(err, buf); }
  function b64buf(b64) { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  if (window.__frInline && window.__frInline[key]) { try { return fin(null, b64buf(window.__frInline[key])); } catch (e) {} }   // single-file HTML build
  function viaScript() {       // fallback for hosts that forbid fetch/XHR: same bytes, wrapped in a .js file
    window.__frAsset = window.__frAsset || function (k, b64) { var f = window.__frAssetCb && window.__frAssetCb[k]; if (f) f(b64); };
    window.__frAssetCb = window.__frAssetCb || {};
    window.__frAssetCb[key] = function (b64) {
      try { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); fin(null, u.buffer); } catch (e) { fin(e); }
    };
    loadScript(assetURL(path + '.js'), function (err) { if (err) fin(err); else setTimeout(function () { fin(new Error('asset script did not register')); }, 3000); });
  }
  try {
    var x = new XMLHttpRequest(); x.open('GET', assetURL(path), true); x.responseType = 'arraybuffer';
    x.onload = function () { if (x.status >= 200 && x.status < 300 && x.response && x.response.byteLength > 1000) fin(null, x.response); else viaScript(); };
    x.onerror = viaScript; x.ontimeout = viaScript; x.timeout = 25000; x.send();
  } catch (e) { viaScript(); }
}
function loadModelFile(key, cb) {
  fetchBinary('models/' + key + '.glb', key, function (err, buf) {
    if (err) { MODEL_STATUS[key] = 'failed'; return cb(err); }
    var data; try { data = parseGLB(buf); } catch (e) { MODEL_STATUS[key] = 'failed'; return cb(e); }
    var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, envMapIntensity: 0.7 });
    if (data.image) {
      var url = URL.createObjectURL(new Blob([data.image.bytes], { type: data.image.mime })), img = new Image();
      img.onload = function () { var t = new THREE.Texture(img); t.flipY = false; t.encoding = THREE.sRGBEncoding; t.anisotropy = TEX.aniso; t.needsUpdate = true; mat.map = t; mat.needsUpdate = true; try { URL.revokeObjectURL(url); } catch (e) {} };
      img.src = url;
    }
    MODEL_STATUS[key] = 'ok';
    cb(null, data.meshes.map(function (m) { return { geometry: m.geometry, material: mat }; }));
  });
}


var MODELS = [];         // 8 entries {geometry, material} (null until loaded)
var LINEUP = [];         // title-screen display
var PH = {};
function buildFriends() {
  PH.body = new THREE.CylinderGeometry(0.16, 0.2, 0.62, 10); PH.body.translate(0, 0.31, 0);
  PH.head = new THREE.SphereGeometry(0.24, 14, 10); PH.head.translate(0, 0.78, 0);
  PH.mat = stdMat({ color: 0xf2f2f2, roughness: 0.6 });
  for (var i = 0; i < 8; i++) {
    MODELS.push(null);
    var g = new THREE.Group(); g.position.set((i - 3.5) * 0.95, 0, 21.5 + Math.abs(i - 3.5) * 0.3); g.add(makeFriendMesh(i, null)); scene.add(g); LINEUP.push(g);
  }
  ['boys', 'girls'].forEach(function (key, fi) {
    loadModelFile(key, function (err, list) {
      if (err || !list) return;
      list.slice(0, 4).forEach(function (m, k) {
        var idx = fi * 4 + k; MODELS[idx] = m;
        var g = LINEUP[idx]; while (g.children.length) g.remove(g.children[0]); g.add(makeFriendMesh(idx, null));
      });
      loadModelFile(key + '_lod', function (e2, lods) {      // low-poly copies for far-away bots
        if (e2 || !lods) return; lods.slice(0, 4).forEach(function (m, k) { if (MODELS[fi * 4 + k]) MODELS[fi * 4 + k].lod = m.geometry; });
      });
      if (typeof refreshAvatar === 'function') refreshAvatar();
    });
  });
}
// returns an Object3D of height 1 (feet at y=0, facing +z). mat: optional per-instance material
function makeFriendMesh(idx, mat, lod) {
  var m = MODELS[idx], o;
  if (m) { o = new THREE.Mesh(lod && m.lod ? m.lod : m.geometry, mat || m.material); o.castShadow = true; o.receiveShadow = true; }
  else { o = new THREE.Group(); var b = new THREE.Mesh(PH.body, mat || PH.mat), h = new THREE.Mesh(PH.head, mat || PH.mat); b.castShadow = h.castShadow = true; o.add(b); o.add(h); }
  o.scale.setScalar(FRIEND_H); return o;
}
var FRIEND_H = 1.68;
function updateLineup(dt, cx, cz, show) {
  for (var i = 0; i < LINEUP.length; i++) {
    var g = LINEUP[i]; g.visible = show; if (!show) continue;
    g.rotation.y += angDiff(Math.atan2(cx - g.position.x, cz - g.position.z), g.rotation.y) * Math.min(1, dt * 3);
    g.position.y = Math.abs(Math.sin(G.titleT * 3 + i * 0.8)) * 0.06;
  }
}


// ===== 06_input.js =====
// ---- input: touch (left = move, right = look, fire button) + mouse/keyboard --
var input = { mx: 0, mz: 0, lookX: 0, lookY: 0, fire: false, reload: false, sprint: false, aim: false, grenade: false, switchTo: null, locked: false, usedTouch: IS_MOBILE || (IS_TOUCH && window.matchMedia && matchMedia('(pointer:coarse)').matches) };
var SENS = store.get('sens', 1);
var keys = {};
var touchUI = {};
function inputActive() { return G.state === 'playing'; }

function setupInput() {
  // ---- keyboard / mouse
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    keys[e.code] = true;
    if (e.code === 'KeyR') input.reload = true;
    if (e.code === 'KeyG') input.grenade = true;
    if (e.code === 'KeyQ') input.switchTo = 'next';
    if (/^Digit[1-4]$/.test(e.code)) input.switchTo = +e.code.slice(5) - 1;
    if (e.code === 'Escape' || e.code === 'KeyP') { if (G.state === 'playing') pauseGame(); }
    if (inputActive() && /Arrow|Space/.test(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; input.fire = false; });
  var cv = renderer.domElement;
  cv.addEventListener('mousedown', function (e) {
    if (!inputActive() || input.usedTouch) return;
    audioInit();
    if (!input.locked && cv.requestPointerLock) { try { cv.requestPointerLock(); } catch (er) {} }
    if (e.button === 0) { input.fire = true; input.dragging = true; }
    if (e.button === 2) input.aim = true;
  });
  window.addEventListener('mouseup', function (e) { if (e.button === 0) { input.fire = false; input.dragging = false; } if (e.button === 2) input.aim = false; });
  cv.addEventListener('wheel', function (e) { if (inputActive()) { input.switchTo = e.deltaY > 0 ? 'next' : 'prev'; e.preventDefault(); } }, { passive: false });
  window.addEventListener('mousemove', function (e) {
    if (!inputActive() || input.usedTouch) return;
    if (input.locked || input.dragging) { input.lookX += (e.movementX || 0) * 0.0022 * SENS; input.lookY += (e.movementY || 0) * 0.0022 * SENS; }
  });
  document.addEventListener('pointerlockchange', function () {
    var was = input.locked; input.locked = document.pointerLockElement === cv;
    if (was && !input.locked && G.state === 'playing') pauseGame();
  });

  // ---- touch
  var layer = touchUI.layer = el('div', 'fr-touch', UI);
  touchUI.stickBase = el('div', 'fr-stick', layer); touchUI.stickKnob = el('div', 'fr-knob', touchUI.stickBase);
  touchUI.fire = el('div', 'fr-btn fr-fire', layer); touchUI.fire.innerHTML = '<i></i>';
  touchUI.reload = el('div', 'fr-btn fr-reload', layer, 'リロード');
  touchUI.aim = el('div', 'fr-btn fr-aim', layer, 'エイム'); touchUI.wsw = el('div', 'fr-btn fr-wsw', layer, '武器'); touchUI.nade = el('div', 'fr-btn fr-nade', layer, 'グレネード');
  var stick = null, look = null, fireT = null;
  if (input.usedTouch) ROOT.classList.add('fr-istouch');
  function place(x, y) { touchUI.stickBase.style.transform = 'translate(' + (x - 60) + 'px,' + (y - 60) + 'px)'; touchUI.stickBase.style.opacity = 1; }
  layer.addEventListener('touchstart', function (e) {
    e.preventDefault(); audioInit(); input.usedTouch = true; ROOT.classList.add('fr-istouch');
    if (!inputActive()) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i], tg = t.target;
      if (tg.closest && tg.closest('.fr-reload')) { input.reload = true; continue; }
      if (tg.closest && tg.closest('.fr-aim')) { input.aim = !input.aim; touchUI.aim.classList.toggle('on', input.aim); continue; }
      if (tg.closest && tg.closest('.fr-wsw')) { input.switchTo = 'next'; continue; }
      if (tg.closest && tg.closest('.fr-nade')) { input.grenade = true; continue; }
      if (tg.closest && tg.closest('.fr-fire')) { if (!fireT) { fireT = { id: t.identifier, x: t.clientX, y: t.clientY }; input.fire = true; touchUI.fire.classList.add('on'); } continue; }
      if (t.clientX < window.innerWidth * 0.42 && !stick) { stick = { id: t.identifier, ox: t.clientX, oy: t.clientY }; place(t.clientX, t.clientY); touchUI.stickKnob.style.transform = 'translate(0,0)'; }
      else if (!look) look = { id: t.identifier, x: t.clientX, y: t.clientY };
    }
  }, { passive: false });
  layer.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (stick && t.identifier === stick.id) {
        var dx = t.clientX - stick.ox, dy = t.clientY - stick.oy, l = Math.hypot(dx, dy), R = 52;
        if (l > R) { dx *= R / l; dy *= R / l; l = R; }
        input.mx = dx / R; input.mz = dy / R; input.sprint = l > R * 0.93 && dy < 0;
        touchUI.stickKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      } else {
        var s = (look && t.identifier === look.id) ? look : (fireT && t.identifier === fireT.id) ? fireT : null;
        if (s) { input.lookX += (t.clientX - s.x) * 0.0052 * SENS; input.lookY += (t.clientY - s.y) * 0.0052 * SENS; s.x = t.clientX; s.y = t.clientY; }
      }
    }
  }, { passive: false });
  function end(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var id = e.changedTouches[i].identifier;
      if (stick && id === stick.id) { stick = null; input.mx = input.mz = 0; input.sprint = false; touchUI.stickBase.style.opacity = 0; }
      if (look && id === look.id) look = null;
      if (fireT && id === fireT.id) { fireT = null; input.fire = false; touchUI.fire.classList.remove('on'); }
    }
  }
  layer.addEventListener('touchend', end, { passive: false }); layer.addEventListener('touchcancel', end, { passive: false });
  input.resetTouch = function () { stick = look = fireT = null; input.mx = input.mz = 0; input.fire = false; input.sprint = false; touchUI.stickBase.style.opacity = 0; touchUI.fire.classList.remove('on'); touchUI.aim.classList.remove('on'); };
}
function pollKeys() {
  if (input.usedTouch && !(keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD)) return;
  var x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), z = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  var l = Math.hypot(x, z) || 1; input.mx = x / l; input.mz = z / l; input.sprint = !!(keys.ShiftLeft || keys.ShiftRight);
  if (keys.Space) input.fire = true; else if (input.spaceFire) input.fire = false; input.spaceFire = !!keys.Space;
}


// ===== 07_weapon.js =====
// ---- weapons (8 kinds), aiming, recoil, rockets, grenades, particles, decals --
var gun = {}, FX = {};
var _v1, _v2, _v3, _q1;
// fall: [full damage until, minimum from, minimum multiplier]   ads: spread multiplier while aiming   zoom: fov while aiming (landscape)
var WDEF = {
  ar:      { name: 'アサルトライフル', price: 0,    mag: 30, rate: 0.098, dmg: 34,  spread: 0.004, ads: 0.3,  bloomAdd: 0.0045, bloomMax: 0.028, recP: 0.5,  recY: 0.22, reload: 1.7, pellets: 1, fall: [25, 60, 0.6],  zoom: 46, move: 1,    info: '中距離が得意。バランス型' },
  pistol:  { name: 'ハンドガン',       price: 0,    mag: 12, rate: 0.17,  dmg: 30,  spread: 0.005, ads: 0.4,  bloomAdd: 0.006,  bloomMax: 0.03,  recP: 0.7,  recY: 0.25, reload: 1.2, pellets: 1, fall: [14, 35, 0.5],  zoom: 54, move: 1.06, info: '近〜中距離。動きが速く、リロードも速い' },
  shotgun: { name: 'ショットガン',     price: 0,    mag: 6,  rate: 0.8,   dmg: 15,  spread: 0.055, ads: 0.75, bloomAdd: 0,      bloomMax: 0.03,  recP: 1.7,  recY: 0.5,  reload: 2.3, pellets: 9, fall: [7, 22, 0.15],  zoom: 56, move: 0.98, info: '近距離で一撃。遠くにはほぼ届かない' },
  sniper:  { name: 'スナイパーライフル', price: 0,  mag: 5,  rate: 1.25,  dmg: 150, spread: 0.04,  ads: 0,    bloomAdd: 0,      bloomMax: 0.04,  recP: 2.3,  recY: 0.4,  reload: 2.6, pellets: 1, fall: [90, 220, 0.8], zoom: 15, move: 0.9,  scope: true, info: '遠距離専用。のぞくと一発必中' },
  smg:     { name: 'サブマシンガン',   price: 800,  mag: 32, rate: 0.066, dmg: 22,  spread: 0.007, ads: 0.45, bloomAdd: 0.003,  bloomMax: 0.03,  recP: 0.3,  recY: 0.28, reload: 1.5, pellets: 1, fall: [12, 32, 0.5],  zoom: 54, move: 1.08, info: '近距離の連射。動きながらでも当てやすい' },
  lmg:     { name: 'ライトマシンガン', price: 1500, mag: 80, rate: 0.085, dmg: 30,  spread: 0.008, ads: 0.35, bloomAdd: 0.003,  bloomMax: 0.04,  recP: 0.42, recY: 0.3,  reload: 3.8, pellets: 1, fall: [30, 70, 0.65], zoom: 46, move: 0.85, info: '80発の大容量。重くてリロードが長い' },
  magnum:  { name: 'マグナム',         price: 1000, mag: 6,  rate: 0.48,  dmg: 85,  spread: 0.004, ads: 0.25, bloomAdd: 0.012,  bloomMax: 0.04,  recP: 2.0,  recY: 0.5,  reload: 2.0, pellets: 1, fall: [20, 50, 0.6],  zoom: 50, move: 1.03, info: '1発が重い。頭に当てれば一撃' },
  rocket:  { name: 'ロケットランチャー', price: 2500, mag: 1, rate: 0.5,  dmg: 190, spread: 0.002, ads: 0.5,  bloomAdd: 0,      bloomMax: 0.02,  recP: 1.8,  recY: 0.3,  reload: 2.7, pellets: 1, fall: [999, 999, 1],  zoom: 50, move: 0.88, rocket: true, info: '爆発でまとめて倒す。自分も巻きこまれる' }
};
var WORDER = ['ar', 'pistol', 'shotgun', 'sniper', 'smg', 'lmg', 'magnum', 'rocket'];
var SKINS = {
  s_default: { name: 'スタンダード', price: 0,    color: 0x2f2a22, rough: 0.75, metal: 0.05 },
  s_desert:  { name: 'デザート',     price: 300,  color: 0xa5855a, rough: 0.8,  metal: 0.05 },
  s_arctic:  { name: 'アークティック', price: 300, color: 0xdfe4ea, rough: 0.45, metal: 0.1 },
  s_camo:    { name: 'カモフラージュ', price: 500, color: 0xffffff, rough: 0.85, metal: 0, camo: true },
  s_neon:    { name: 'ネオン',       price: 800,  color: 0x10d8c4, rough: 0.35, metal: 0.3, emissive: 0x0b6f66 },
  s_gold:    { name: 'ゴールド',     price: 2000, color: 0xe0aa1c, rough: 0.22, metal: 1 }
};
var TRACERS = { t_default: { name: 'イエロー', price: 0, color: 0xffe2a0 }, t_red: { name: 'レッド', price: 150, color: 0xff5a4a }, t_green: { name: 'グリーン', price: 150, color: 0x6dff7a }, t_blue: { name: 'ブルー', price: 150, color: 0x5ab4ff }, t_pink: { name: 'ピンク', price: 200, color: 0xff7ad8 } };
var CROSSES = { c_default: { name: 'ホワイト', price: 0, css: '#ffffff' }, c_green: { name: 'グリーン', price: 100, css: '#5dff7a' }, c_cyan: { name: 'シアン', price: 100, css: '#5de8ff' }, c_yellow: { name: 'イエロー', price: 100, css: '#ffe24a' }, c_pink: { name: 'ピンク', price: 100, css: '#ff7ad8' } };
// parts: ['b', w,h,d, x,y,z, mat, rotX] box / ['c', radius,length, x,y,z, mat] cylinder along z.  mat: m metal, p polymer, s skin
var GUNS = {
  ar: { muzzle: [0.012, -0.72], sight: 0.097, hands: [[-0.012, -0.045, -0.33], [0.006, -0.085, 0.09]], mag: 8, parts: [
    ['b', 0.052, 0.085, 0.3, 0, 0, -0.04, 'm'], ['b', 0.046, 0.03, 0.34, 0, 0.055, -0.1, 'm'], ['b', 0.056, 0.062, 0.27, 0, 0.004, -0.325, 's'], ['c', 0.011, 0.24, 0, 0.012, -0.56, 'm'], ['c', 0.018, 0.07, 0, 0.012, -0.665, 'm'],
    ['b', 0.044, 0.07, 0.24, 0, -0.012, 0.23, 's'], ['b', 0.048, 0.1, 0.03, 0, -0.03, 0.355, 'p'], ['b', 0.04, 0.11, 0.05, 0, -0.09, 0.085, 'p', 0.3], ['b', 0.036, 0.17, 0.062, 0, -0.115, -0.07, 'm', -0.16],
    ['b', 0.012, 0.04, 0.012, 0, 0.085, -0.43, 'm'], ['b', 0.05, 0.008, 0.07, 0, 0.122, -0.03, 'm'], ['b', 0.008, 0.05, 0.07, 0.025, 0.097, -0.03, 'm'], ['b', 0.008, 0.05, 0.07, -0.025, 0.097, -0.03, 'm']] },
  pistol: { muzzle: [0.022, -0.16], sight: 0.048, off: [0, -0.01, -0.02], hands: [[-0.012, -0.075, 0.03], [0.012, -0.07, 0.035]], mag: 2, parts: [
    ['b', 0.03, 0.036, 0.2, 0, 0.022, -0.05, 'm'], ['b', 0.028, 0.03, 0.13, 0, -0.008, -0.03, 's'], ['b', 0.03, 0.1, 0.046, 0, -0.06, 0.03, 'p', 0.2], ['b', 0.006, 0.01, 0.01, 0, 0.044, -0.14, 'm'], ['b', 0.014, 0.01, 0.008, 0, 0.044, 0.04, 'm']] },
  shotgun: { muzzle: [0.018, -0.7], sight: 0.05, hands: [[-0.01, -0.04, -0.36], [0.006, -0.08, 0.1]], mag: -1, parts: [
    ['b', 0.05, 0.072, 0.3, 0, 0, -0.02, 'm'], ['c', 0.015, 0.5, 0, 0.018, -0.43, 'm'], ['c', 0.013, 0.42, 0, -0.014, -0.38, 'm'], ['b', 0.052, 0.048, 0.17, 0, -0.016, -0.36, 's'],
    ['b', 0.044, 0.075, 0.28, 0, -0.02, 0.27, 's'], ['b', 0.04, 0.1, 0.05, 0, -0.085, 0.1, 's', 0.35], ['b', 0.008, 0.012, 0.008, 0, 0.04, -0.66, 'm']] },
  sniper: { muzzle: [0.012, -0.92], sight: 0.088, hands: [[-0.012, -0.045, -0.3], [0.006, -0.085, 0.1]], mag: 7, parts: [
    ['b', 0.05, 0.072, 0.36, 0, 0, -0.03, 'm'], ['c', 0.012, 0.6, 0, 0.012, -0.58, 'm'], ['c', 0.02, 0.09, 0, 0.012, -0.9, 'm'], ['b', 0.052, 0.052, 0.3, 0, -0.004, -0.3, 's'], ['b', 0.046, 0.095, 0.3, 0, -0.02, 0.3, 's'],
    ['b', 0.04, 0.11, 0.05, 0, -0.09, 0.1, 'p', 0.3], ['c', 0.03, 0.27, 0, 0.088, -0.04, 'm'], ['b', 0.034, 0.1, 0.06, 0, -0.085, -0.06, 'm'], ['c', 0.037, 0.05, 0, 0.088, -0.19, 'm'], ['c', 0.034, 0.04, 0, 0.088, 0.1, 'm'],
    ['b', 0.02, 0.03, 0.04, 0, 0.05, -0.1, 'm'], ['b', 0.02, 0.03, 0.04, 0, 0.05, 0.02, 'm']] },
  smg: { muzzle: [0.012, -0.34], sight: 0.07, off: [0, 0, -0.03], hands: [[-0.012, -0.06, -0.2], [0.006, -0.085, 0.07]], mag: 5, parts: [
    ['b', 0.048, 0.076, 0.26, 0, 0, -0.04, 'm'], ['b', 0.05, 0.05, 0.12, 0, -0.008, -0.2, 's'], ['c', 0.012, 0.1, 0, 0.012, -0.29, 'm'], ['b', 0.036, 0.1, 0.045, 0, -0.085, 0.07, 'p', 0.25], ['b', 0.03, 0.09, 0.04, 0, -0.07, -0.2, 'p'],
    ['b', 0.028, 0.2, 0.042, 0, -0.13, -0.05, 'm'], ['b', 0.014, 0.014, 0.22, 0.02, 0.02, 0.2, 'm'], ['b', 0.014, 0.014, 0.22, -0.02, 0.02, 0.2, 'm'], ['b', 0.05, 0.08, 0.02, 0, -0.01, 0.31, 'p'], ['b', 0.03, 0.022, 0.1, 0, 0.05, -0.02, 'm']] },
  lmg: { muzzle: [0.014, -0.8], sight: 0.092, hands: [[-0.014, -0.05, -0.36], [0.006, -0.09, 0.1]], mag: 6, parts: [
    ['b', 0.062, 0.1, 0.38, 0, 0, -0.02, 'm'], ['c', 0.015, 0.46, 0, 0.014, -0.54, 'm'], ['c', 0.02, 0.07, 0, 0.014, -0.79, 'm'], ['b', 0.06, 0.06, 0.26, 0, 0, -0.34, 's'], ['b', 0.05, 0.085, 0.26, 0, -0.012, 0.3, 's'],
    ['b', 0.04, 0.11, 0.05, 0, -0.1, 0.1, 'p', 0.3], ['b', 0.12, 0.11, 0.1, -0.02, -0.1, -0.08, 's'], ['b', 0.012, 0.03, 0.2, 0, 0.085, -0.3, 'm'], ['b', 0.05, 0.03, 0.12, 0, 0.065, -0.02, 'm'],
    ['b', 0.01, 0.18, 0.01, 0.03, -0.09, -0.52, 'm', 0.35], ['b', 0.01, 0.18, 0.01, -0.03, -0.09, -0.52, 'm', 0.35]] },
  magnum: { muzzle: [0.028, -0.22], sight: 0.055, off: [0, -0.01, -0.02], hands: [[-0.012, -0.08, 0.04], [0.012, -0.075, 0.045]], mag: -1, parts: [
    ['c', 0.014, 0.17, 0, 0.028, -0.13, 'm'], ['b', 0.012, 0.014, 0.16, 0, 0.008, -0.12, 'm'], ['c', 0.027, 0.055, 0, 0.016, -0.015, 'm'], ['b', 0.026, 0.044, 0.1, 0, 0.012, 0, 'm'], ['b', 0.03, 0.105, 0.046, 0, -0.06, 0.045, 's', 0.28],
    ['b', 0.006, 0.012, 0.01, 0, 0.05, -0.2, 'm'], ['b', 0.012, 0.016, 0.02, 0, 0.045, 0.045, 'm']] },
  rocket: { muzzle: [0.03, -0.62], sight: 0.115, off: [0.02, 0.0, 0.02], hands: [[-0.012, -0.05, -0.25], [0.006, -0.085, 0.05]], mag: -1, parts: [
    ['c', 0.052, 0.95, 0, 0.03, -0.1, 's'], ['c', 0.064, 0.07, 0, 0.03, -0.58, 'm'], ['c', 0.06, 0.1, 0, 0.03, 0.4, 'm'], ['b', 0.036, 0.1, 0.045, 0, -0.07, 0.05, 'p', 0.2], ['b', 0.034, 0.09, 0.04, 0, -0.065, -0.25, 'p'],
    ['b', 0.02, 0.05, 0.1, 0.045, 0.1, -0.1, 'm'], ['b', 0.05, 0.03, 0.2, 0, -0.03, -0.1, 'm']] }
};
var GMAT = {};
function gunMats() {
  if (GMAT.m) return;
  GMAT.m = stdMat({ color: 0x131416, roughness: 0.42, metalness: 0.92, roughnessMap: TEX.metalRgh, envMapIntensity: 1.1 });
  GMAT.p = stdMat({ color: 0x15171a, roughness: 0.72, metalness: 0.05, envMapIntensity: 0.5 });
  GMAT.glove = stdMat({ color: 0x121311, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 });
  GMAT.sleeve = stdMat({ color: 0x2a3024, roughness: 1, metalness: 0, envMapIntensity: 0.3 });
  GMAT.handG = new THREE.SphereGeometry(0.045, 10, 8);
}
function makeSkinMat(id) {
  var s = SKINS[id] || SKINS.s_default, m = stdMat({ color: s.color, roughness: s.rough, metalness: s.metal, envMapIntensity: s.metal > 0.5 ? 1.2 : 0.5 });
  if (s.camo) m.map = TEX.camo; if (s.emissive) m.emissive.set(s.emissive);
  return m;
}
function setSkinMat(m, id) {
  var s = SKINS[id] || SKINS.s_default; m.color.set(s.color); m.roughness = s.rough; m.metalness = s.metal; m.envMapIntensity = s.metal > 0.5 ? 1.2 : 0.5;
  m.map = s.camo ? TEX.camo : null; m.emissive.set(s.emissive || 0); m.needsUpdate = true;
}
function cylBetween(a, b, r, mat, parent) {
  var d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, d.length(), 10), mat);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(m); return m;
}
function buildGunModel(id, skinMat, withHands) {
  gunMats();
  var def = GUNS[id], g = new THREE.Group(), mats = { m: GMAT.m, p: GMAT.p, s: skinMat }, parts = [];
  def.parts.forEach(function (p) {
    var mesh;
    if (p[0] === 'b') { mesh = new THREE.Mesh(new THREE.BoxGeometry(p[1], p[2], p[3]), mats[p[7]]); mesh.position.set(p[4], p[5], p[6]); if (p[8]) mesh.rotation.x = p[8]; }
    else { mesh = new THREE.Mesh(new THREE.CylinderGeometry(p[1], p[1], p[2], 12), mats[p[6]]); mesh.rotation.x = Math.PI / 2; mesh.position.set(p[3], p[4], p[5]); }
    g.add(mesh); parts.push(mesh);
  });
  var out = { g: g, id: id, mag: def.mag >= 0 ? parts[def.mag] : null, magY: def.mag >= 0 ? parts[def.mag].position.y : 0 };
  out.muzzle = new THREE.Object3D(); out.muzzle.position.set(0, def.muzzle[0], def.muzzle[1]); g.add(out.muzzle);
  out.eject = new THREE.Object3D(); out.eject.position.set(0.04, 0.03, -0.02); g.add(out.eject);
  if (id === 'ar') { var dot = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 8), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); dot.position.set(0, 0.097, -0.034); g.add(dot); }
  if (withHands) {
    var h = def.hands, lh = new THREE.Mesh(GMAT.handG, GMAT.glove); lh.scale.set(1.1, 0.8, 1.5); lh.position.set(h[0][0], h[0][1], h[0][2]); g.add(lh);
    cylBetween(new THREE.Vector3(h[0][0] - 0.02, h[0][1] - 0.015, h[0][2] + 0.03), new THREE.Vector3(-0.3, -0.3, h[0][2] + 0.43), 0.042, GMAT.sleeve, g);
    var rh = new THREE.Mesh(GMAT.handG, GMAT.glove); rh.scale.set(1.0, 1.3, 1.0); rh.position.set(h[1][0], h[1][1], h[1][2]); g.add(rh);
    cylBetween(new THREE.Vector3(h[1][0] + 0.014, h[1][1] - 0.035, h[1][2] + 0.01), new THREE.Vector3(0.16, -0.32, h[1][2] + 0.33), 0.045, GMAT.sleeve, g);
  }
  g.traverse(function (o) { if (o.isMesh) o.frustumCulled = false; });
  return out;
}
function curId() { return gun.slots[gun.cur]; }
function curDef() { return WDEF[curId()]; }
function setLoadout(list) {
  var l = (list || []).filter(function (id, i, a) { return WDEF[id] && a.indexOf(id) === i; }).slice(0, 4); if (!l.length) l = ['ar', 'pistol', 'shotgun', 'sniper'];
  gun.slots = l; gun.cur = 0; gun.ammo = {}; l.forEach(function (id) { gun.ammo[id] = WDEF[id].mag; });
  WORDER.forEach(function (id) { gun.models[id].g.visible = id === l[0]; });
  gun.reloadT = 0; gun.swT = 0; gun.ads = 0;
}
function buildWeapon() {
  _v1 = new THREE.Vector3(); _v2 = new THREE.Vector3(); _v3 = new THREE.Vector3(); _q1 = new THREE.Quaternion();
  // camo texture for the skin
  var cn = fbmField(131, 128, 4, 3), cols = [[58, 66, 44], [92, 84, 56], [38, 40, 30], [120, 110, 78]];
  TEX.camo = texFrom(fieldToCanvas(128, function (i) { return cols[clamp(Math.floor(cn[i] * 5.2 - 0.6), 0, 3)]; }), [2, 2], true);
  var root = gun.root = new THREE.Group(), k = gun.kick = new THREE.Group(); root.add(k);
  gun.skinMat = makeSkinMat('s_default'); gun.models = {};
  WORDER.forEach(function (id) { var m = buildGunModel(id, gun.skinMat, true); m.g.visible = false; k.add(m.g); gun.models[id] = m; });
  var fm = new THREE.MeshBasicMaterial({ map: TEX.flash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  gun.flash = new THREE.Group();
  var f1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), fm); gun.flash.add(f1);
  var f2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), fm); f2.rotation.y = Math.PI / 2; f2.position.z = -0.1; gun.flash.add(f2);
  var f3 = f2.clone(); f3.rotation.set(Math.PI / 2, 0, Math.PI / 2); gun.flash.add(f3);
  gun.flash.visible = false; k.add(gun.flash);
  root.scale.setScalar(0.3); camera.add(root);
  gun.light = new THREE.PointLight(0xffb060, 0, 14, 2); gun.light.position.set(0.1, -0.05, -0.6); camera.add(gun.light);
  gun.base = new THREE.Vector3(0.068, -0.062, -0.155);
  gun.cool = 0; gun.reloadT = 0; gun.kz = 0; gun.kr = 0; gun.bloom = 0; gun.flashT = 0; gun.swayX = 0; gun.swayY = 0; gun.ads = 0; gun.swT = 0; gun.swTo = 0;
  gun.recP = 0; gun.recPV = 0; gun.recY = 0; gun.recYV = 0; gun.tracerColor = 0xffe2a0;
  setLoadout(['ar', 'pistol', 'shotgun', 'sniper']);

  // ---- effect pools
  var N = FX.N = 260; FX.pos = new Float32Array(N * 3); FX.vel = new Float32Array(N * 3); FX.life = new Float32Array(N); FX.next = 0;
  for (var i = 0; i < N; i++) FX.pos[i * 3 + 1] = -999;
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(FX.pos, 3));
  FX.points = new THREE.Points(pg, new THREE.PointsMaterial({ map: TEX.glow, size: 0.16, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffc070, sizeAttenuation: true }));
  FX.points.frustumCulled = false; scene.add(FX.points);
  FX.smokes = []; for (i = 0; i < 30; i++) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, transparent: true, opacity: 0, depthWrite: false, color: 0x8a8078 })); s.visible = false; scene.add(s); FX.smokes.push({ s: s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grow: 1 }); }
  FX.smokeI = 0;
  FX.flashes = []; for (i = 0; i < 6; i++) { var fs = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fs.visible = false; scene.add(fs); FX.flashes.push({ s: fs, life: 0, max: 1, size: 1 }); }
  FX.flashI = 0;
  var dg = new THREE.PlaneGeometry(0.16, 0.16), dm = new THREE.MeshBasicMaterial({ map: TEX.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  FX.decals = []; for (i = 0; i < 40; i++) { var d = new THREE.Mesh(dg, dm); d.visible = false; scene.add(d); FX.decals.push(d); } FX.decalI = 0;
  var tg = new THREE.BoxGeometry(0.018, 0.018, 1); tg.translate(0, 0, 0.5);
  FX.tracers = []; for (i = 0; i < 12; i++) { var t = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); t.visible = false; t.frustumCulled = false; scene.add(t); FX.tracers.push({ m: t, life: 0 }); } FX.tracerI = 0;
  var brass = stdMat({ color: 0xc9a24a, roughness: 0.3, metalness: 1 }), sg = new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), debM = stdMat({ color: 0x25272b, roughness: 0.5, metalness: 0.8 }), debG = new THREE.BoxGeometry(0.16, 0.06, 0.12);
  FX.bodies = []; for (i = 0; i < 26; i++) { var isShell = i < 10, b = new THREE.Mesh(isShell ? sg : debG, isShell ? brass : debM); b.visible = false; b.castShadow = !isShell; scene.add(b); FX.bodies.push({ m: b, shell: isShell, life: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0 }); }
  FX.shellI = 0; FX.debI = 10;
  FX.boomLight = new THREE.PointLight(0xff9040, 0, 26, 2); scene.add(FX.boomLight); FX.boomT = 0;
  // rockets + grenades
  var rg = new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8); rg.rotateX(Math.PI / 2);
  var rm = stdMat({ color: 0x3a4030, roughness: 0.6, metalness: 0.4 }), ng = new THREE.SphereGeometry(0.075, 10, 8), nm = stdMat({ color: 0x2f3a22, roughness: 0.7, metalness: 0.3 });
  FX.rockets = []; FX.nades = [];
  for (i = 0; i < 3; i++) {
    var r = new THREE.Mesh(rg, rm); r.visible = false; scene.add(r);
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffa040, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); gl.scale.setScalar(1.1); gl.position.z = 0.35; r.add(gl);
    FX.rockets.push({ m: r, on: false, vx: 0, vy: 0, vz: 0, life: 0, trail: 0 });
    var n = new THREE.Mesh(ng, nm); n.visible = false; n.castShadow = true; scene.add(n); FX.nades.push({ m: n, on: false, vx: 0, vy: 0, vz: 0, fuse: 0 });
  }
}
function fxSparks(x, y, z, nx, ny, nz, n, speed) {
  if (Q.tier === 0) n = Math.ceil(n * 0.5);
  for (var i = 0; i < n; i++) {
    var k = FX.next; FX.next = (FX.next + 1) % FX.N;
    FX.pos[k * 3] = x; FX.pos[k * 3 + 1] = y; FX.pos[k * 3 + 2] = z;
    FX.vel[k * 3] = (nx * 0.7 + (Math.random() - 0.5) * 1.3) * speed * Math.random(); FX.vel[k * 3 + 1] = (ny * 0.7 + (Math.random() - 0.3) * 1.3) * speed * Math.random(); FX.vel[k * 3 + 2] = (nz * 0.7 + (Math.random() - 0.5) * 1.3) * speed * Math.random();
    FX.life[k] = 0.15 + Math.random() * 0.45;
  }
}
function fxSmoke(x, y, z, size, life, color, vy) {
  var s = FX.smokes[FX.smokeI]; FX.smokeI = (FX.smokeI + 1) % FX.smokes.length;
  s.s.position.set(x, y, z); s.s.scale.setScalar(size); s.s.material.color.set(color || 0x8a8078); s.s.material.rotation = Math.random() * 6; s.s.visible = true;
  s.life = s.max = life; s.vx = (Math.random() - 0.5) * 0.5; s.vz = (Math.random() - 0.5) * 0.5; s.vy = vy == null ? 0.6 : vy; s.grow = size * 1.4;
}
function fxFlash(x, y, z, size, life, color) {
  var f = FX.flashes[FX.flashI]; FX.flashI = (FX.flashI + 1) % FX.flashes.length;
  f.s.position.set(x, y, z); f.s.material.color.set(color || 0xffffff); f.s.visible = true; f.life = f.max = life; f.size = size;
}
function fxDecal(x, y, z, nx, ny, nz) {
  var d = FX.decals[FX.decalI]; FX.decalI = (FX.decalI + 1) % FX.decals.length;
  d.position.set(x + nx * 0.006, y + ny * 0.006, z + nz * 0.006); _v1.set(x + nx, y + ny, z + nz); d.lookAt(_v1); d.rotateZ(Math.random() * 6); d.scale.setScalar(0.7 + Math.random() * 0.6); d.visible = true;
}
function fxTracer(a, b, color) {
  var t = FX.tracers[FX.tracerI]; FX.tracerI = (FX.tracerI + 1) % FX.tracers.length;
  t.m.position.copy(a); t.m.lookAt(b); t.m.scale.z = a.distanceTo(b); t.m.visible = true; t.life = 0.06; t.m.material.opacity = 0.7; t.m.material.color.set(color == null ? 0xffe2a0 : color);
}
function fxBody(shell, x, y, z, vx, vy, vz) {
  var i = shell ? FX.shellI : FX.debI, b = FX.bodies[i];
  if (shell) FX.shellI = (i + 1) % 10; else FX.debI = 10 + ((i - 10 + 1) % 16);
  b.m.position.set(x, y, z); b.m.visible = true; b.life = shell ? 2.5 : 4; b.vx = vx; b.vy = vy; b.vz = vz; b.rx = rnd(-14, 14); b.rz = rnd(-14, 14);
  if (!shell) b.m.scale.set(rnd(0.5, 1.6), rnd(0.6, 1.4), rnd(0.5, 1.6));
}
function fxExplosion(x, y, z, big) {
  fxFlash(x, y, z, big ? 7 : 4.5, 0.22, 0xffd9a0); fxSparks(x, y, z, 0, 0.5, 0, big ? 46 : 30, 11);
  for (var i = 0; i < (Q.tier === 0 ? 2 : 5); i++) fxSmoke(x + rnd(-0.4, 0.4), y + rnd(-0.2, 0.4), z + rnd(-0.4, 0.4), rnd(1, 1.8), rnd(0.9, 1.6), i % 2 ? 0x3a3632 : 0x6a625a, 1.1);
  for (i = 0; i < 5; i++) fxBody(false, x, y, z, rnd(-4, 4), rnd(1, 6), rnd(-4, 4));
  FX.boomLight.position.set(x, y, z); FX.boomT = 0.25;
}
// area damage. owner: P or a bot (its team is spared, except the owner itself)
function explodeAt(x, y, z, R, dmg, owner, label) {
  fxExplosion(x, Math.max(0.3, y), z, true); SFX.boom(panTo(x, z), volAt(x, y, z));
  var d = Math.hypot(x - P.x, y - (P.y + 1.1), z - P.z); if (d < 16) G.shake = Math.min(1.8, G.shake + (16 - d) * 0.09);
  var team = owner === P ? P.team : owner.team;
  if (d < R && P.hp > 0 && (owner === P || team !== P.team)) hurtPlayer(dmg * (1 - d / R) * (owner === P ? 0.45 : 1), x, z, owner, label);
  for (var i = ENEMIES.length - 1; i >= 0; i--) {
    var e = ENEMIES[i]; if (e.dead || e.team === team) continue;
    var de = Math.hypot(x - e.x, y - actorY(e), z - e.z); if (de < R) damageActor(e, dmg * (1 - de / R * 0.85), owner, label, false, e.x, actorY(e), e.z);
  }
}
function launchRocket(ox, oy, oz, dx, dy, dz) {
  for (var i = 0; i < FX.rockets.length; i++) { var r = FX.rockets[i]; if (r.on) continue;
    r.on = true; r.life = 4; r.vx = dx * 42; r.vy = dy * 42; r.vz = dz * 42; r.m.position.set(ox, oy, oz); _v1.set(ox - dx, oy - dy, oz - dz); r.m.lookAt(_v1); r.m.visible = true; return; }
}
function throwGrenade() {
  if (P.nades <= 0 || P.hp <= 0 || gun.nadeCool > 0) return;
  for (var i = 0; i < FX.nades.length; i++) { var n = FX.nades[i]; if (n.on) continue;
    camera.getWorldDirection(_v1); camera.getWorldPosition(_v2);
    n.on = true; n.fuse = 2.1; n.vx = _v1.x * 17 + P.vx; n.vy = _v1.y * 17 + 4.5; n.vz = _v1.z * 17 + P.vz; n.m.position.set(_v2.x + _v1.x * 0.4, _v2.y - 0.15, _v2.z + _v1.z * 0.4); n.m.visible = true;
    P.nades--; gun.nadeCool = 0.8; SFX.throwS(); gun.kr = 0.1; return; }
}
function updateProjectiles(dt) {
  var i, w;
  for (i = 0; i < FX.rockets.length; i++) {
    var r = FX.rockets[i]; if (!r.on) continue;
    var p = r.m.position, sp = 42, step = sp * dt, dx = r.vx / sp, dy = r.vy / sp, dz = r.vz / sp, hitT = step + 1;
    w = rayWorld(p.x, p.y, p.z, dx + 1e-9, dy + 1e-9, dz + 1e-9, step); if (w) hitT = w.t;
    for (var j = 0; j < ENEMIES.length; j++) { var e = ENEMIES[j]; if (e.dead || e.team === P.team) continue; _v1.set(dx, dy, dz); var te = raySphere(p, _v1, e.x, actorY(e), e.z, 0.6); if (te > 0 && te < hitT) hitT = te; }
    r.life -= dt; r.trail -= dt; if (r.trail <= 0) { r.trail = 0.035; fxSmoke(p.x, p.y, p.z, 0.4, 0.5, 0xb8b2aa, 0.2); }
    if (hitT <= step || r.life <= 0) { r.on = false; r.m.visible = false; explodeAt(p.x + dx * Math.min(hitT, step), p.y + dy * Math.min(hitT, step), p.z + dz * Math.min(hitT, step), 5.5, WDEF.rocket.dmg, P, 'ロケットランチャー'); continue; }
    p.x += r.vx * dt; p.y += r.vy * dt; p.z += r.vz * dt;
  }
  for (i = 0; i < FX.nades.length; i++) {
    var n = FX.nades[i]; if (!n.on) continue;
    var q = n.m.position; n.vy -= 15 * dt; var v = Math.sqrt(n.vx * n.vx + n.vy * n.vy + n.vz * n.vz) || 0.001, st = v * dt;
    w = v > 0.3 ? rayWorld(q.x, q.y, q.z, n.vx / v + 1e-9, n.vy / v + 1e-9, n.vz / v + 1e-9, st + 0.08) : null;
    if (w) { var dn = n.vx * w.nx + n.vy * w.ny + n.vz * w.nz; n.vx = (n.vx - 2 * dn * w.nx) * 0.42; n.vy = (n.vy - 2 * dn * w.ny) * 0.42; n.vz = (n.vz - 2 * dn * w.nz) * 0.42; if (Math.abs(dn) > 2) SFX.click(0, 1500, 0.2); }
    else { q.x += n.vx * dt; q.y += n.vy * dt; q.z += n.vz * dt; }
    if (q.y < 0.08) { q.y = 0.08; if (n.vy < 0) n.vy = 0; n.vx *= 0.9; n.vz *= 0.9; }
    n.m.rotation.x += dt * 9; n.fuse -= dt;
    if (n.fuse <= 0) { n.on = false; n.m.visible = false; explodeAt(q.x, q.y + 0.3, q.z, 6.5, 170, P, 'グレネード'); }
  }
}
function clearProjectiles() { FX.rockets.forEach(function (r) { r.on = false; r.m.visible = false; }); FX.nades.forEach(function (n) { n.on = false; n.m.visible = false; }); }
function updateFX(dt) {
  var i, p = FX.pos, v = FX.vel;
  for (i = 0; i < FX.N; i++) {
    if (FX.life[i] <= 0) continue;
    FX.life[i] -= dt; if (FX.life[i] <= 0) { p[i * 3 + 1] = -999; continue; }
    v[i * 3 + 1] -= 13 * dt; p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
    if (p[i * 3 + 1] < 0.02) { p[i * 3 + 1] = 0.02; v[i * 3 + 1] *= -0.35; v[i * 3] *= 0.6; v[i * 3 + 2] *= 0.6; }
  }
  FX.points.geometry.attributes.position.needsUpdate = true;
  for (i = 0; i < FX.smokes.length; i++) { var s = FX.smokes[i]; if (s.life <= 0) continue; s.life -= dt; if (s.life <= 0) { s.s.visible = false; continue; }
    var k = s.life / s.max; s.s.material.opacity = Math.min(1, k * 1.6) * 0.55; s.s.position.x += s.vx * dt; s.s.position.y += s.vy * dt; s.s.position.z += s.vz * dt; s.s.scale.addScalar(s.grow * dt / s.max); }
  for (i = 0; i < FX.flashes.length; i++) { var f = FX.flashes[i]; if (f.life <= 0) continue; f.life -= dt; if (f.life <= 0) { f.s.visible = false; continue; }
    var kk = f.life / f.max; f.s.material.opacity = kk; f.s.scale.setScalar(f.size * (1.3 - kk * 0.6)); }
  for (i = 0; i < FX.tracers.length; i++) { var t = FX.tracers[i]; if (t.life <= 0) continue; t.life -= dt; if (t.life <= 0) t.m.visible = false; else t.m.material.opacity = t.life / 0.06 * 0.7; }
  for (i = 0; i < FX.bodies.length; i++) { var b = FX.bodies[i]; if (b.life <= 0) continue; b.life -= dt; if (b.life <= 0) { b.m.visible = false; continue; }
    b.vy -= 12 * dt; var m = b.m; m.position.x += b.vx * dt; m.position.y += b.vy * dt; m.position.z += b.vz * dt; m.rotation.x += b.rx * dt; m.rotation.z += b.rz * dt;
    var fl = b.shell ? 0.012 : 0.04; if (m.position.y < fl) { m.position.y = fl; if (b.vy < -1.2) { b.vy *= -0.4; b.vx *= 0.6; b.vz *= 0.6; b.rx *= 0.5; b.rz *= 0.5; } else { b.vy = 0; b.vx *= 0.8; b.vz *= 0.8; b.rx = b.rz = 0; } } }
  if (FX.boomT > 0) { FX.boomT -= dt; FX.boomLight.intensity = Math.max(0, FX.boomT / 0.25) * 6; }
}

function startReload() {
  var id = curId(); if (gun.reloadT > 0 || gun.swT > 0 || gun.ammo[id] >= WDEF[id].mag) return;
  gun.reloadT = gun.reloadMax = WDEF[id].reload; SFX.reload(WDEF[id].reload);
}
function switchWeapon(i) {
  i = ((i % gun.slots.length) + gun.slots.length) % gun.slots.length;
  if (i === gun.cur || gun.swT > 0) return;
  gun.swT = 0.3; gun.swTo = i; gun.reloadT = 0; SFX.click(0, 1700, 0.25);
}
function shoot() {
  var id = curId(), W = WDEF[id], M = gun.models[id];
  gun.ammo[id]--; gun.cool = W.rate; G.stats.shots++;
  var sp = (W.spread + gun.bloom + (P.speed > 5 ? 0.012 : P.speed > 1 ? 0.005 : 0)) * lerp(1, W.ads, gun.ads);
  camera.getWorldPosition(_v2); M.muzzle.getWorldPosition(_v3);
  var anyHit = false, mx = _v3.x, my = _v3.y, mz = _v3.z;
  if (W.rocket) {
    camera.getWorldDirection(_v1); launchRocket(_v2.x + _v1.x * 0.6, _v2.y + _v1.y * 0.6 - 0.08, _v2.z + _v1.z * 0.6, _v1.x, _v1.y, _v1.z);
    fxSmoke(_v2.x - _v1.x * 0.8, _v2.y, _v2.z - _v1.z * 0.8, 0.9, 0.7, 0xc8c2ba, 0.5);
  } else for (var pl = 0; pl < W.pellets; pl++) {
    camera.getWorldDirection(_v1);
    _v3.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(sp); _v1.add(_v3).normalize();
    if (Math.abs(_v1.x) < 1e-6) _v1.x = 1e-6; if (Math.abs(_v1.y) < 1e-6) _v1.y = 1e-6; if (Math.abs(_v1.z) < 1e-6) _v1.z = 1e-6;
    var w = rayWorld(_v2.x, _v2.y, _v2.z, _v1.x, _v1.y, _v1.z, 250), maxT = w ? w.t : 250;
    var eh = rayEnemies(_v2, _v1, maxT), endT = eh ? eh.t : maxT;
    var hx = _v2.x + _v1.x * endT, hy = _v2.y + _v1.y * endT, hz = _v2.z + _v1.z * endT;
    if (eh) {
      var fm = endT <= W.fall[0] ? 1 : endT >= W.fall[1] ? W.fall[2] : lerp(1, W.fall[2], (endT - W.fall[0]) / (W.fall[1] - W.fall[0]));
      anyHit = true; if (eh.crit) G.stats.heads++;
      damageActor(eh.e, W.dmg * fm * (eh.crit ? 2 : 1), P, W.name, eh.crit, hx, hy, hz);
      if (!eh.e.friend) fxSparks(hx, hy, hz, -_v1.x, 0.4, -_v1.z, eh.crit ? 12 : 7, 6);
    } else if (w) {
      fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, W.pellets > 1 ? 3 : 6, 4.5); fxDecal(hx, hy, hz, w.nx, w.ny, w.nz);
      if (pl === 0 && (Q.tier > 0 || Math.random() < 0.4)) fxSmoke(hx + w.nx * 0.1, hy + w.ny * 0.1, hz + w.nz * 0.1, 0.25, 0.5, 0x9a9085, 0.4);
      if (pl === 0) SFX.impact(0, clamp(1 - endT / 40, 0.1, 1));
    }
    if (endT > 2.5 && pl < 4) { _v3.set(mx, my, mz); _v1.set(hx, hy, hz); fxTracer(_v3, _v1, gun.tracerColor); }
  }
  if (anyHit) G.stats.hits++;
  var aim = lerp(1, 0.7, gun.ads);
  gun.recPV += (W.recP + Math.random() * 0.12) * aim; gun.recYV += rnd(-W.recY, W.recY) * aim;
  gun.kz = Math.min(0.12, gun.kz + 0.04 + W.recP * 0.025); gun.kr = Math.min(0.2, gun.kr + 0.03 + W.recP * 0.035); gun.bloom = Math.min(W.bloomMax, gun.bloom + W.bloomAdd);
  gun.flashT = 0.045; gun.flash.visible = !(W.scope && gun.ads > 0.8); gun.flash.position.copy(M.muzzle.position); gun.flash.rotation.z = Math.random() * 6; gun.flash.scale.setScalar(rnd(0.75, 1.25) * (W.pellets > 1 || W.dmg > 80 ? 1.5 : 1)); gun.light.intensity = 5;
  if (!W.rocket && id !== 'magnum') { M.eject.getWorldPosition(_v3); camera.getWorldQuaternion(_q1); _v1.set(rnd(1.6, 2.6), rnd(1.4, 2.4), rnd(-0.3, 0.6)).applyQuaternion(_q1); fxBody(true, _v3.x, _v3.y, _v3.z, _v1.x + P.vx, _v1.y, _v1.z + P.vz); SFX.shell(); }
  SFX.shot(id); G.shake = Math.min(1.2, G.shake + 0.14 + W.recP * 0.16);
}
function updateWeapon(dt) {
  var id = curId(), W = WDEF[id], M = gun.models[id];
  gun.cool -= dt; if (gun.nadeCool > 0) gun.nadeCool -= dt;
  if (input.reload) { input.reload = false; if (G.state === 'playing') startReload(); }
  if (input.grenade) { input.grenade = false; if (G.state === 'playing') throwGrenade(); }
  if (input.switchTo != null) { var sw = input.switchTo; input.switchTo = null; if (P.hp > 0) switchWeapon(sw === 'next' ? gun.cur + 1 : sw === 'prev' ? gun.cur - 1 : sw); }
  var low = 0;
  if (gun.swT > 0) {
    var before = gun.swT; gun.swT -= dt;
    if (before > 0.15 && gun.swT <= 0.15) { M.g.visible = false; gun.cur = gun.swTo; id = curId(); W = WDEF[id]; M = gun.models[id]; M.g.visible = true; gun.bloom = 0; hudCache.am = null; }
    low = Math.sin(clamp(1 - Math.max(0, gun.swT) / 0.3, 0, 1) * Math.PI);
  } else if (gun.reloadT > 0) {
    gun.reloadT -= dt; if (gun.reloadT <= 0) { gun.ammo[id] = W.mag; gun.reloadT = 0; }
  } else if (input.fire && gun.cool <= 0 && G.state === 'playing' && P.hp > 0) {
    if (gun.ammo[id] > 0) shoot(); else { SFX.empty(); gun.cool = 0.3; startReload(); }
  }
  if (gun.ammo[id] === 0 && gun.reloadT <= 0 && gun.swT <= 0 && !input.fire) startReload();
  // aiming
  var wantAds = input.aim && gun.reloadT <= 0 && gun.swT <= 0 && P.hp > 0 && !(input.sprint && P.speed > 5.5) ? 1 : 0;
  gun.ads = damp(gun.ads, wantAds, 16, dt); if (Math.abs(gun.ads - wantAds) < 0.01) gun.ads = wantAds;
  var scoped = !!W.scope && gun.ads > 0.8;
  if (scoped !== gun.scoped) { gun.scoped = scoped; H.scope.style.display = scoped ? 'block' : 'none'; H.cross.style.display = scoped ? 'none' : ''; }
  var fov = lerp(G.baseFov, G.baseFov * W.zoom / 66, gun.ads); if (Math.abs(fov - camera.fov) > 0.02) { camera.fov = fov; camera.updateProjectionMatrix(); }
  // recoil springs
  gun.recP += gun.recPV * dt; gun.recY += gun.recYV * dt;
  gun.recPV = damp(gun.recPV, 0, 20, dt); gun.recYV = damp(gun.recYV, 0, 20, dt);
  gun.recP = damp(gun.recP, 0, input.fire && W.rate < 0.2 ? 2.5 : 7, dt); gun.recY = damp(gun.recY, 0, 5, dt);
  gun.recP = Math.min(gun.recP, 0.18);
  gun.kz = damp(gun.kz, 0, 16, dt); gun.kr = damp(gun.kr, 0, 14, dt); gun.bloom = damp(gun.bloom, 0, 4.5, dt);
  if (gun.flashT > 0) { gun.flashT -= dt; if (gun.flashT <= 0) { gun.flash.visible = false; gun.light.intensity = 0; } }
  // sway / bob / reload pose / aim pose
  gun.swayX = damp(gun.swayX, clamp(-P.lookDX * 1.6, -0.06, 0.06), 9, dt); gun.swayY = damp(gun.swayY, clamp(-P.lookDY * 1.6, -0.05, 0.05), 9, dt);
  var a = gun.ads, bobA = Math.min(1, P.speed / 4.6) * 0.012 * (1 - a * 0.8), r = gun.root, b = gun.base, sc = r.scale.x, off = GUNS[id].off || [0, 0, 0];
  var rl = 0, magD = 0;
  if (gun.reloadT > 0) { var k = 1 - gun.reloadT / gun.reloadMax; rl = Math.sin(Math.min(1, k * 1.15) * Math.PI); magD = (k > 0.08 && k < 0.5) ? Math.min(1, (k - 0.08) * 8) : (k >= 0.5 && k < 0.62 ? 1 - (k - 0.5) / 0.12 : 0); }
  if (M.mag) { M.mag.position.y = M.magY - magD * 0.22; M.mag.visible = !(magD > 0.98); }
  var bx = lerp(b.x + off[0] * sc, 0, a), by = lerp(b.y + off[1] * sc, -GUNS[id].sight * sc, a), bz = lerp(b.z + off[2] * sc, b.z + 0.03, a);
  r.position.set(bx + gun.swayX * 0.06 * (1 - a) + Math.cos(P.bob) * bobA * 0.6, by + gun.swayY * 0.06 * (1 - a) - Math.abs(Math.sin(P.bob)) * bobA - rl * 0.03 - low * 0.09 - P.landDip * 0.02, bz + gun.kz * 0.3);
  r.rotation.set(gun.kr * 0.5 * (1 - a * 0.5) - gun.swayY * 0.5 * (1 - a) + rl * 0.45 + low * 0.5, gun.swayX * 0.6 * (1 - a) + rl * 0.25, rl * -0.5 + gun.swayX * -0.4 * (1 - a));
  r.visible = !scoped;
}


// ===== 08_enemies.js =====
// ---- actors: the eight friends (ground bots, any team) + drones + energy bolts
var ENEMIES = [], BOLTS = [], DR = {};
var ETYPE = {
  scout:  { hp: 70,  scale: 1.0, speed: 6.5, score: 100, dmg: 9,  burst: 1, cd: [1.7, 2.8], range: [9, 15] },
  gunner: { hp: 170, scale: 1.45, speed: 4.2, score: 250, dmg: 8,  burst: 3, cd: [2.4, 3.4], range: [11, 17] },
  kami:   { hp: 45,  scale: 0.8, speed: 9.5, score: 150, dmg: 30, burst: 0, cd: [9, 9], range: [4, 6] },
  rifle:  { hp: 100, scale: 1.0, speed: 3.3, score: 100, dmg: 8,  burst: 2, cd: [1.6, 2.7], range: [8, 15], friend: true },
  rush:   { hp: 80,  scale: 1.0, speed: 5.0, score: 120, dmg: 6,  burst: 3, cd: [1.2, 2.0], range: [3.5, 6.5], friend: true }
};
var FRIEND_ROLE = ['rifle', 'rifle', 'rush', 'rifle', 'rifle', 'rush', 'rifle', 'rush'];
var BOT_DIFF = [{ name: 'やさしい', err: 2.0, cd: 1.5, dmg: 0.7, see: 0.9 }, { name: 'ふつう', err: 1.2, cd: 1.0, dmg: 1.0, see: 0.5 }, { name: 'つよい', err: 0.65, cd: 0.7, dmg: 1.25, see: 0.25 }];
var TEAM_COL = [0x4aa3ff, 0xff4a3a];
function aliveCount() { var n = 0; for (var i = 0; i < ENEMIES.length; i++) if (!ENEMIES[i].dead && ENEMIES[i].team !== P.team) n++; return n; }
function actorAlive(a) { return a === P ? (P.hp > 0 && !P.respawnT) : (!!a && !a.dead && !a.gone); }
function actorY(a) { return a === P ? P.y + 1.25 : a.friend ? a.y + 0.5 * a.h : a.y; }
function actorTeam(a) { return a === P ? P.team : a.team; }

function buildEnemyAssets() {
  DR.body = new THREE.SphereGeometry(0.42, 16, 10); DR.arm = new THREE.BoxGeometry(1.25, 0.05, 0.09); DR.motor = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
  DR.rotor = new THREE.CircleGeometry(0.27, 14); DR.eye = new THREE.SphereGeometry(0.12, 12, 8); DR.barrel = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8); DR.fin = new THREE.BoxGeometry(0.5, 0.04, 0.5);
  DR.metal = stdMat({ color: 0x24262a, roughness: 0.4, metalness: 0.9, roughnessMap: TEX.metalRgh, envMapIntensity: 1 });
  DR.shell = { scout: stdMat({ color: 0x59616b, roughness: 0.45, metalness: 0.7 }), gunner: stdMat({ color: 0x6d2620, roughness: 0.4, metalness: 0.7 }), kami: stdMat({ color: 0xc79a1a, roughness: 0.5, metalness: 0.5 }) };
  DR.blaster = new THREE.BoxGeometry(0.07, 0.11, 0.42); DR.blasterTip = new THREE.MeshBasicMaterial({ color: 0xff3a22 }); DR.tipG = new THREE.BoxGeometry(0.035, 0.035, 0.03);
  DR.rotorM = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  // team marker (a small downward triangle above the head)
  var mc = canvasOf(64), mx = mc.getContext('2d'); mx.fillStyle = '#fff'; mx.strokeStyle = 'rgba(0,0,0,.7)'; mx.lineWidth = 5; mx.beginPath(); mx.moveTo(8, 12); mx.lineTo(56, 12); mx.lineTo(32, 54); mx.closePath(); mx.stroke(); mx.fill();
  DR.markTex = new THREE.CanvasTexture(mc);
  DR.markM = TEAM_COL.map(function (c, i) { return new THREE.SpriteMaterial({ map: DR.markTex, color: c, transparent: true, depthWrite: false, depthTest: i !== 0, fog: false }); });
  var bg = new THREE.CylinderGeometry(0.045, 0.045, 0.9, 6); bg.rotateX(Math.PI / 2);
  DR.boltM = [0x5ab4ff, 0xff5a3a].map(function (c) { return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); });
  DR.glowM = [0x3a90ff, 0xff5030].map(function (c) { return new THREE.SpriteMaterial({ map: TEX.glow, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); });
  for (var i = 0; i < 30; i++) {
    var m = new THREE.Mesh(bg, DR.boltM[1]); m.visible = false; m.frustumCulled = false; scene.add(m);
    var gl = new THREE.Sprite(DR.glowM[1]); gl.scale.setScalar(0.7); m.add(gl);
    BOLTS.push({ m: m, gl: gl, on: false, vx: 0, vy: 0, vz: 0, life: 0, dmg: 0, team: 1, owner: null });
  }
}
function makeDrone(type) {
  var g = new THREE.Group(), T = ETYPE[type];
  var body = new THREE.Mesh(DR.body, DR.metal); body.scale.set(1, 0.55, 1.15); body.castShadow = true; g.add(body);
  var sh = new THREE.Mesh(DR.body, DR.shell[type]); sh.scale.set(0.8, 0.42, 0.9); sh.position.y = 0.1; g.add(sh);
  var rotors = [];
  [Math.PI / 4, -Math.PI / 4].forEach(function (a) { var arm = new THREE.Mesh(DR.arm, DR.metal); arm.rotation.y = a; arm.castShadow = true; g.add(arm); });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p) {
    var x = p[0] * 0.44, z = p[1] * 0.44, mo = new THREE.Mesh(DR.motor, DR.metal); mo.position.set(x, 0.06, z); g.add(mo);
    var ro = new THREE.Mesh(DR.rotor, DR.rotorM); ro.rotation.x = -Math.PI / 2; ro.position.set(x, 0.13, z); g.add(ro); rotors.push(ro);
  });
  var eyeM = new THREE.MeshBasicMaterial({ color: type === 'kami' ? 0xffb020 : 0xff2a18 });
  var eye = new THREE.Mesh(DR.eye, eyeM); eye.position.set(0, -0.02, 0.42); g.add(eye);
  if (type !== 'kami') { var b = new THREE.Mesh(DR.barrel, DR.metal); b.rotation.x = Math.PI / 2; b.position.set(0, -0.2, 0.3); g.add(b);
    if (type === 'gunner') { var b2 = b.clone(); b2.position.x = 0.12; g.add(b2); var b3 = b.clone(); b3.position.x = -0.12; g.add(b3); } }
  else { var f = new THREE.Mesh(DR.fin, DR.shell.kami); f.position.y = -0.18; f.rotation.y = Math.PI / 4; g.add(f); }
  g.scale.setScalar(T.scale);
  return { g: g, eyeM: eyeM, rotors: rotors };
}
function spawnEnemy(type, wave) {
  var T = ETYPE[type], d = makeDrone(type), a = Math.random() * Math.PI * 2;
  var e = { type: type, T: T, team: 1, name: 'ドローン', g: d.g, eyeM: d.eyeM, rotors: d.rotors, hp: T.hp * (1 + wave * 0.05), x: Math.cos(a) * 46, y: rnd(9, 13), z: Math.sin(a) * 46, vx: 0, vy: 0, vz: 0,
    ang: a, dir: Math.random() < 0.5 ? 1 : -1, ring: rnd(T.range[0], T.range[1]), alt: rnd(2.3, 4.6), t: Math.random() * 9, cd: rnd(1.2, 2.6), charge: 0, burst: 0, burstT: 0, hitFlash: 0, dive: 0, beepT: 0, r: 0.5 * T.scale, wave: wave, dirT: rnd(2, 5), aimErr: Math.max(0.25, 1.15 - wave * 0.1), dmgMul: 1 };
  e.g.position.set(e.x, e.y, e.z); scene.add(e.g); ENEMIES.push(e); return e;
}
function removeEnemy(e) { e.gone = true; scene.remove(e.g); if (e.eyeM) e.eyeM.dispose(); if (e.mat) e.mat.dispose(); var i = ENEMIES.indexOf(e); if (i >= 0) ENEMIES.splice(i, 1); }
function clearEnemies() { while (ENEMIES.length) removeEnemy(ENEMIES[0]); BOLTS.forEach(function (b) { b.on = false; b.m.visible = false; }); }

function raySphere(o, d, cx, cy, cz, r) {
  var ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r, h = b * b - c;
  if (h < 0) return -1; h = Math.sqrt(h); var t = -b - h; return t > 0 ? t : -1;
}
function rayEnemies(o, d, maxT) {       // the player's shots: only actors of the other team
  var best = null;
  for (var i = 0; i < ENEMIES.length; i++) {
    var e = ENEMIES[i], t;
    if (e.dead || e.team === P.team) continue;
    if (e.friend) {
      var h = e.h, th = raySphere(o, d, e.x, e.y + 0.79 * h, e.z, 0.215 * h), tb = raySphere(o, d, e.x, e.y + 0.45 * h, e.z, 0.18 * h), tl = raySphere(o, d, e.x, e.y + 0.17 * h, e.z, 0.15 * h);
      var tm = 1e9, cr = false; if (th > 0) { tm = th; cr = true; } if (tb > 0 && tb < tm) { tm = tb; cr = false; } if (tl > 0 && tl < tm) { tm = tl; cr = false; }
      if (tm < maxT && (!best || tm < best.t)) best = { e: e, t: tm, crit: cr };
      continue;
    }
    t = raySphere(o, d, e.x, e.y, e.z, e.r * 1.12);
    if (t > 0 && t < maxT && (!best || t < best.t)) {
      var s = e.T.scale, fx = Math.sin(e.g.rotation.y), fz = Math.cos(e.g.rotation.y);
      var te = raySphere(o, d, e.x + fx * 0.42 * s, e.y - 0.02 * s, e.z + fz * 0.42 * s, 0.17 * s);
      best = { e: e, t: t, crit: te > 0 && te < t + 0.25 };
    }
  }
  return best;
}
function panTo(x, z) { var dx = x - P.x, dz = z - P.z, l = Math.hypot(dx, dz) || 1; return clamp((dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw)) / l * 0.9, -1, 1); }
function volAt(x, y, z) { return clamp(1.3 - Math.hypot(x - P.x, z - P.z) / 34, 0.15, 1); }

// one entry point for all damage. attacker: P, a bot, or null
function damageActor(t, dmg, attacker, label, crit, hx, hy, hz) {
  if (t === P) { hurtPlayer(dmg, attacker ? attacker.x : P.x, attacker ? attacker.z : P.z, attacker, label); return; }
  if (t.dead || t.inv > 0) return;
  t.hp -= dmg; t.hitFlash = 0.1;
  if (attacker === P) hudHit(crit, t.hp <= 0);
  if (t.friend) { fxSmoke(hx, hy, hz, 0.35, 0.45, 0xf4f1ea, 0.5); t.stagger = 0.18; if (attacker && attacker !== P && !t.target) t.target = attacker; }
  if (t.hp <= 0) killEnemy(t, attacker, crit, label); else if (attacker === P) SFX.hit();
}
function killEnemy(e, attacker, crit, label) {
  if (e.friend) {
    if (e.dead) return;
    e.dead = 0.0001; e.charge = 0; e.burst = 0; if (e.mark) e.mark.visible = false; SFX.down(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
    onKill(attacker, e, label, crit);
    return;
  }
  fxExplosion(e.x, e.y, e.z, e.type === 'gunner'); SFX.boom(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
  var d = Math.hypot(e.x - P.x, e.y - (P.y + 1.2), e.z - P.z);
  if (d < 10) G.shake = Math.min(1.5, G.shake + (10 - d) * 0.09);
  onKill(attacker, e, label, crit);
  removeEnemy(e);
}
function fireBolt(e, spreadMul) {
  var b = null; for (var i = 0; i < BOLTS.length; i++) if (!BOLTS[i].on) { b = BOLTS[i]; break; } if (!b) return;
  var tg = e.target || P, s = e.T.scale, fx = Math.sin(e.g.rotation.y), fz = Math.cos(e.g.rotation.y), ox = e.x + fx * 0.5 * s, oy = e.y - 0.2 * s, oz = e.z + fz * 0.5 * s;
  if (e.friend) { ox = e.x + fx * 0.45 * e.h + fz * 0.2 * e.h; oy = e.y + 0.5 * e.h; oz = e.z + fz * 0.45 * e.h - fx * 0.2 * e.h; }
  var sp = 27 + e.wave * 0.8, dist = Math.hypot(tg.x - ox, tg.z - oz), lead = dist / sp * 0.55, err = e.aimErr * (spreadMul || 1);
  var tx = tg.x + tg.vx * lead + rnd(-err, err), ty = actorY(tg) + rnd(-err, err) * 0.6, tz = tg.z + tg.vz * lead + rnd(-err, err);
  var dx = tx - ox, dy = ty - oy, dz = tz - oz, l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  b.on = true; b.vx = dx / l * sp; b.vy = dy / l * sp; b.vz = dz / l * sp; b.life = 3; b.dmg = (e.T.dmg + Math.min(5, e.wave * 0.5)) * e.dmgMul; b.team = e.team; b.owner = e;
  b.m.material = DR.boltM[e.team]; b.gl.material = DR.glowM[e.team];
  b.m.position.set(ox, oy, oz); _v1.set(ox + dx, oy + dy, oz + dz); b.m.lookAt(_v1); b.m.visible = true;
  fxFlash(ox, oy, oz, 1.2, 0.08, e.team ? 0xff6040 : 0x60a0ff); SFX.bolt(panTo(e.x, e.z), volAt(e.x, e.y, e.z) * (e.team === P.team ? 0.5 : 1));
}
function segNear(px, py, pz, dx, dy, dz, step, cx, cy, cz, r) {
  var ox = cx - px, oy = cy - py, oz = cz - pz, t = clamp(ox * dx + oy * dy + oz * dz, 0, step), qx = ox - dx * t, qy = oy - dy * t, qz = oz - dz * t;
  return qx * qx + qy * qy + qz * qz < r * r;
}
function updateBolts(dt) {
  for (var i = 0; i < BOLTS.length; i++) {
    var b = BOLTS[i]; if (!b.on) continue;
    var p = b.m.position, sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz), step = sp * dt, dx = b.vx / sp, dy = b.vy / sp, dz = b.vz / sp, hit = null;
    if (b.team !== P.team && actorAlive(P) && !(P.inv > 0) && (segNear(p.x, p.y, p.z, dx, dy, dz, step, P.x, P.y + 0.75, P.z, 0.42) || segNear(p.x, p.y, p.z, dx, dy, dz, step, P.x, P.y + 1.45, P.z, 0.42))) hit = P;
    if (!hit) for (var j = 0; j < ENEMIES.length; j++) {
      var e = ENEMIES[j]; if (!e.friend || e.dead || e.team === b.team || e.inv > 0) continue;
      if (segNear(p.x, p.y, p.z, dx, dy, dz, step, e.x, e.y + 0.75 * e.h, e.z, 0.26 * e.h) || segNear(p.x, p.y, p.z, dx, dy, dz, step, e.x, e.y + 0.35 * e.h, e.z, 0.24 * e.h)) { hit = e; break; }
    }
    var w = rayWorld(p.x, p.y, p.z, dx + 1e-9, dy + 1e-9, dz + 1e-9, step);
    if (hit) { b.on = false; b.m.visible = false; damageActor(hit, b.dmg, b.owner && !b.owner.gone ? b.owner : null, 'ブラスター', false, p.x, p.y, p.z); continue; }
    if (w) { var hx = p.x + dx * w.t, hy = p.y + dy * w.t, hz = p.z + dz * w.t; fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, 4, 4); b.on = false; b.m.visible = false; continue; }
    p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt; b.life -= dt; if (b.life <= 0) { b.on = false; b.m.visible = false; }
  }
}
function updateEnemies(dt) {
  var nearest = 99;
  for (var i = ENEMIES.length - 1; i >= 0; i--) {
    var e = ENEMIES[i], T = e.T; e.t += dt;
    if (e.friend) { updateBot(e, dt, i); continue; }
    var dxp = P.x - e.x, dzp = P.z - e.z, dist = Math.hypot(dxp, dzp), d3 = Math.hypot(dist, P.y + 1.4 - e.y); if (d3 < nearest) nearest = d3;
    var see = losClear(e.x, e.y, e.z, P.x, P.y + 1.4, P.z), alive = actorAlive(P);
    var tx, ty, tz, maxSp = T.speed;
    if (T.burst === 0) {       // kamikaze: orbit close, then dive
      if (e.dive <= 0 && dist < 13 && see && alive && e.t > 2.5) e.dive = 0.001;
      if (e.dive > 0) { e.dive += dt; tx = P.x; ty = P.y + 1.3; tz = P.z; maxSp = T.speed * 1.5; e.beepT -= dt; if (e.beepT <= 0) { e.beepT = Math.max(0.07, 0.3 - e.dive * 0.12); SFX.beep(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); e.hitFlash = 0.05; } }
      else { e.ang += e.dir * dt * 0.7; tx = P.x + Math.cos(e.ang) * 10; tz = P.z + Math.sin(e.ang) * 10; ty = e.alt + 1; }
      if (d3 < 1.25 && alive) { hurtPlayer(T.dmg, e.x, e.z, e, '自爆ドローン'); killEnemy(e, null); continue; }
    } else {
      e.dirT -= dt; if (e.dirT <= 0) { e.dirT = rnd(2, 5); e.dir = -e.dir; e.ring = rnd(T.range[0], T.range[1]); e.alt = rnd(2.3, 4.6); }
      e.ang += e.dir * dt * (see ? 0.22 : 0.6);
      tx = P.x + Math.cos(e.ang) * e.ring; tz = P.z + Math.sin(e.ang) * e.ring; ty = e.alt + Math.sin(e.t * 1.7) * 0.25 + (see ? 0 : 1.5);
      tx = clamp(tx, -ARENA - 3, ARENA + 3); tz = clamp(tz, -ARENA - 3, ARENA + 3);
    }
    if (e.dive <= 0) { var top = obstacleTop(e.x + e.vx * 0.4, e.z + e.vz * 0.4, 1.0); if (ty < top + 1.0) ty = top + 1.0; }
    var ax = tx - e.x, ay = ty - e.y, az = tz - e.z, al = Math.sqrt(ax * ax + ay * ay + az * az) || 1, want = Math.min(maxSp, al * 1.6);
    for (var j = 0; j < ENEMIES.length; j++) { if (j === i) continue; var o = ENEMIES[j]; if (o.friend) continue; var sx = e.x - o.x, sy = e.y - o.y, sz = e.z - o.z, sl = sx * sx + sy * sy + sz * sz; if (sl < 6.5 && sl > 0.001) { var f = (6.5 - sl) * 0.35; e.vx += sx * f * dt; e.vy += sy * f * dt * 0.5; e.vz += sz * f * dt; } }
    var k = 1 - Math.exp(-(e.dive > 0 ? 3.2 : 2.2) * dt);
    e.vx += (ax / al * want - e.vx) * k; e.vy += (ay / al * want - e.vy) * k; e.vz += (az / al * want - e.vz) * k;
    e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt;
    if (e.y < 0.6) { e.y = 0.6; e.vy = Math.abs(e.vy) * 0.3; }
    if (e.dive > 0 && e.dive > 0.3) { var top2 = obstacleTop(e.x, e.z, 0.3); if (e.y < top2 + 0.2 && top2 > 0) { killEnemy(e, null); continue; } }
    e.g.position.set(e.x, e.y, e.z);
    var yaw = Math.atan2(dxp, dzp); e.g.rotation.y += angDiff(yaw, e.g.rotation.y) * Math.min(1, dt * 6);
    e.g.rotation.x = clamp(-(e.vx * Math.sin(e.g.rotation.y) + e.vz * Math.cos(e.g.rotation.y)) * 0.03, -0.4, 0.4) + (e.dive > 0 ? 0.5 : 0);
    e.g.rotation.z = clamp((e.vx * Math.cos(e.g.rotation.y) - e.vz * Math.sin(e.g.rotation.y)) * 0.04, -0.4, 0.4);
    for (var r = 0; r < 4; r++) e.rotors[r].rotation.z += dt * 40 * (r % 2 ? 1 : -1);
    if (T.burst > 0 && alive) {
      if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { fireBolt(e, T.burst > 1 ? 1.5 : 1); e.burst--; e.burstT = 0.16; } }
      else if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) { e.burst = T.burst; e.burstT = 0; e.cd = rnd(T.cd[0], T.cd[1]) * Math.max(0.6, 1 - e.wave * 0.035); } }
      else { e.cd -= dt; if (e.cd <= 0 && see && d3 < 30 && Math.hypot(e.x, e.z) < ARENA + 8) { e.charge = 0.45; SFX.charge(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); } }
    }
    if (e.hitFlash > 0) e.hitFlash -= dt;
    var c = e.eyeM.color;
    if (e.hitFlash > 0) c.setRGB(1, 1, 1); else if (e.charge > 0) { var u = 1 - e.charge / 0.45; c.setRGB(1, 0.2 + u * 0.8, 0.1 + u * 0.7); } else if (T.burst === 0) c.setRGB(1, 0.7, 0.12); else c.setRGB(1, 0.16, 0.1);
  }
  if (AU.ok) AU.hum.gain.value = damp(AU.hum.gain.value, nearest < 90 ? clamp(0.16 - nearest * 0.006, 0.015, 0.14) : 0, 3, dt);
}

// ---- ground bots (models have no skeleton: animated by code) ------------------
// o: { team, x, z, diff (0-2, team battle), leader, roster }
var _nd = [0, 0];
function spawnFriend(idx, wave, leader, o) {
  o = o || {};
  var role = FRIEND_ROLE[idx], T = ETYPE[role], x = o.x, z = o.z, ok = x != null, team = o.team == null ? 1 : o.team, tdm = o.diff != null;
  for (var tr = 0; tr < 60 && !ok; tr++) {
    x = rnd(-ARENA + 2, ARENA - 2); z = rnd(-ARENA + 2, ARENA - 2); var c = navCell(x, z), d = NAV.dist[c];
    ok = !NAV.blocked[c] && d > (tr < 40 ? 20 : 12) && (tr > 25 || !losClear(x, 1.3, z, P.x, 1.5, P.z));
  }
  var sc = leader ? 1.22 : 1, mat = (MODELS[idx] ? MODELS[idx].material : PH.mat).clone(), D = tdm ? BOT_DIFF[o.diff] : null;
  if (tdm) mat.color.set(team === 0 ? 0xa8ccff : 0xffaaa0);
  var e = { friend: true, idx: idx, name: o.name || FRIEND_NAMES[idx], type: role, T: T, team: team, leader: !!leader, hp: tdm ? 100 : T.hp * (leader ? 2.3 : 1) * (1 + wave * 0.04), x: x, y: 0, z: z, vx: 0, vz: 0, h: FRIEND_H * sc, r: 0.34,
    t: Math.random() * 9, cd: rnd(1.2, 2.6) * (D ? D.cd : 1), charge: 0, burst: 0, burstT: 0, hitFlash: 0, stagger: 0, dead: 0, wave: tdm ? 2 : wave, dir: Math.random() < 0.5 ? 1 : -1, dirT: rnd(1, 3), ring: rnd(T.range[0], T.range[1]), mat: mat, rise: 0.6,
    aimErr: D ? D.err : Math.max(0.25, 1.15 - wave * 0.1), dmgMul: D ? D.dmg * 1.7 : 1, cdMul: D ? D.cd : Math.max(0.6, 1 - wave * 0.035), tdm: tdm, roster: o.roster || null, inv: tdm ? 1.5 : 0,
    target: tdm ? null : P, tgtT: Math.random() * 0.4, navT: Math.random() * 0.4, nav: tdm ? new Int16Array(4096) : NAV.dist, seeT: 0 };
  if (tdm) e.nav.fill(-1);
  e.g = new THREE.Group(); e.body = new THREE.Group(); e.g.add(e.body);
  e.hi = makeFriendMesh(idx, mat, false); e.hi.scale.setScalar(e.h); e.body.add(e.hi);
  if (MODELS[idx] && MODELS[idx].lod) { e.lo = makeFriendMesh(idx, mat, true); e.lo.scale.setScalar(e.h); e.lo.visible = false; e.body.add(e.lo); }
  var bl = new THREE.Mesh(DR.blaster, DR.metal); bl.position.set(0.2 * e.h, 0.5 * e.h, 0.22 * e.h); bl.castShadow = true; e.body.add(bl);
  e.tip = new THREE.Mesh(DR.tipG, DR.blasterTip.clone()); e.tip.position.set(0.2 * e.h, 0.5 * e.h, 0.22 * e.h + 0.22); e.body.add(e.tip); e.eyeM = e.tip.material;
  if (tdm) { e.mark = new THREE.Sprite(DR.markM[team]); e.mark.scale.setScalar(0.34); e.mark.position.y = e.h + 0.3; e.g.add(e.mark); }
  e.g.position.set(x, 0, z); e.g.rotation.y = tdm ? (team === 0 ? Math.PI : 0) : Math.atan2(P.x - x, P.z - z); scene.add(e.g); ENEMIES.push(e);
  fxSmoke(x, 0.9, z, 1.3, 0.7, 0xdfe8ee, 0.8); if (!tdm || team !== P.team) fxFlash(x, 1, z, 2.2, 0.25, team ? 0xffb09f : 0x9fd8ff);
  return e;
}
function pickTarget(e) {
  var best = null, bs = 1e9, i, o, d;
  for (i = 0; i < ENEMIES.length; i++) { o = ENEMIES[i]; if (!o.friend || o.dead || o.team === e.team) continue; d = Math.hypot(o.x - e.x, o.z - e.z); if (o === e.target) d -= 4; if (d < bs) { bs = d; best = o; } }
  if (e.team !== P.team && actorAlive(P)) { d = Math.hypot(P.x - e.x, P.z - e.z) - (e.target === P ? 4 : 0); if (d < bs) { bs = d; best = P; } }
  return best;
}
function updateBot(e, dt, i) {
  var T = e.T, b = e.body;
  if (e.dead) {                           // fall over, then sink away in a puff
    e.dead += dt; var k = Math.min(1, e.dead / 0.42);
    b.rotation.x = -1.5 * k * k; b.position.y = 0.16 * e.h * k;
    if (e.dead > 1.7) { if (!e.puff) { e.puff = 1; fxSmoke(e.x, 0.3, e.z, 1.2, 0.8, 0xe8e4dc, 0.7); } e.g.position.y = -(e.dead - 1.7) * 1.4; }
    if (e.dead > 2.3) removeEnemy(e);
    return;
  }
  if (e.inv > 0) e.inv -= dt;
  if (e.tdm) {
    e.tgtT -= dt; if (e.tgtT <= 0 || !actorAlive(e.target)) { e.tgtT = 0.45; e.target = pickTarget(e); }
    e.navT -= dt; if (e.navT <= 0) { e.navT = 0.5; var np = e.target || tdmRally(e.team); updateNav(np.x, np.z, e.nav); }
  }
  var tg = e.target, has = !!tg && actorAlive(tg), gx = has ? tg.x : (e.tdm ? tdmRally(e.team).x : P.x), gz = has ? tg.z : (e.tdm ? tdmRally(e.team).z : P.z);
  var dxp = gx - e.x, dzp = gz - e.z, dist = Math.hypot(dxp, dzp) || 0.001;
  var seeNow = has && losClear(e.x, e.h * 0.8, e.z, gx, actorY(tg) + 0.15, gz), mx = 0, mz = 0, sp = T.speed * (1 + e.wave * 0.02);
  e.seeT = seeNow ? e.seeT + dt : 0; var see = seeNow;
  e.dirT -= dt; if (e.dirT <= 0) { e.dirT = rnd(1.2, 3.2); e.dir = -e.dir; e.ring = rnd(T.range[0], T.range[1]); }
  if (e.stagger > 0) { e.stagger -= dt; sp *= 0.25; }
  var firing = e.charge > 0 || e.burst > 0;
  if (!see || dist > e.ring + 2) { if (navDir(e.x, e.z, _nd, e.nav)) { mx = _nd[0]; mz = _nd[1]; } else if (dist > 1.5) { mx = dxp / dist; mz = dzp / dist; } }
  else if (dist < e.ring - 2) { mx = -dxp / dist * 0.7 + (-dzp / dist) * e.dir * 0.6; mz = -dzp / dist * 0.7 + (dxp / dist) * e.dir * 0.6; }
  else { mx = (-dzp / dist) * e.dir * 0.75; mz = (dxp / dist) * e.dir * 0.75; }
  if (firing) { mx *= 0.25; mz *= 0.25; }
  for (var j = 0; j < ENEMIES.length; j++) { var o = ENEMIES[j]; if (j === i || !o.friend || o.dead) continue; var sx = e.x - o.x, sz = e.z - o.z, sl = sx * sx + sz * sz; if (sl < 1.1 && sl > 0.0001) { var f = (1.1 - sl) * 1.4; mx += sx * f; mz += sz * f; } }
  var kk = 1 - Math.exp(-7 * dt); e.vx += (mx * sp - e.vx) * kk; e.vz += (mz * sp - e.vz) * kk;
  var px = e.x, pz = e.z; collideMove(e, e.x + e.vx * dt, e.z + e.vz * dt, 0.34, 0);
  var dpx = e.x - P.x, dpz = e.z - P.z, dp = Math.hypot(dpx, dpz); if (dp < 0.8 && dp > 0.001 && actorAlive(P)) { e.x = P.x + dpx / dp * 0.8; e.z = P.z + dpz / dp * 0.8; }
  var moved = Math.hypot(e.x - px, e.z - pz) / Math.max(dt, 0.001);
  if (moved < sp * 0.25 && (mx || mz) && !firing) { e.stuck = (e.stuck || 0) + dt; if (e.stuck > 0.5) { e.dir = -e.dir; e.stuck = 0; } } else e.stuck = 0;
  e.walk = (e.walk || 0) + moved * dt * 3.1;
  var amp = Math.min(1, moved / 2.5), hop = Math.abs(Math.sin(e.walk)) * 0.11 * amp;
  if (e.rise > 0) e.rise = Math.max(0, e.rise - dt);
  e.g.position.set(e.x, hop, e.z); b.scale.y = 1 - e.rise * 0.5 + Math.sin(e.walk * 2) * 0.03 * amp;
  var faceP = see && dist < 26, yaw = faceP ? Math.atan2(dxp, dzp) : Math.atan2(e.vx, e.vz);
  if (faceP || moved > 0.3) e.g.rotation.y += angDiff(yaw, e.g.rotation.y) * Math.min(1, dt * 7);
  var fwd = e.vx * Math.sin(e.g.rotation.y) + e.vz * Math.cos(e.g.rotation.y), side = e.vx * Math.cos(e.g.rotation.y) - e.vz * Math.sin(e.g.rotation.y);
  b.rotation.x = damp(b.rotation.x, clamp(fwd * 0.05, -0.2, 0.25) - (e.stagger > 0 ? 0.28 : 0), 10, dt);
  b.rotation.z = Math.sin(e.walk) * 0.09 * amp - clamp(side * 0.04, -0.15, 0.15);
  if (e.lo) { var cd = Math.hypot(e.x - camera.position.x, e.z - camera.position.z), far = cd > (Q.tier === 0 ? 9 : 17) && !(gun.ads > 0.5 && curDef().scope); if (e.lo.visible !== far) { e.lo.visible = far; e.hi.visible = !far; } }
  // shooting
  if (has) {
    if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { fireBolt(e, T.burst > 2 ? 1.7 : 1.15); e.burst--; e.burstT = T.burst > 2 ? 0.13 : 0.22; } }
    else if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) { e.burst = T.burst + (e.leader ? 1 : 0); e.burstT = 0; e.cd = rnd(T.cd[0], T.cd[1]) * e.cdMul; } }
    else { e.cd -= dt; if (e.cd <= 0 && see && dist < T.range[1] + 6 && !(e.inv > 0)) { e.charge = 0.5; if (e.team !== P.team) SFX.charge(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); } }
  }
  if (e.hitFlash > 0) { e.hitFlash -= dt; e.mat.emissive.setRGB(0.5, 0.12, 0.08); } else if (e.inv > 0) e.mat.emissive.setRGB(0.25, 0.25, 0.3); else e.mat.emissive.setRGB(0, 0, 0);
  var c = e.eyeM.color; if (e.charge > 0) { var u = 1 - e.charge / 0.5; if (e.team) c.setRGB(1, 0.3 + u * 0.7, 0.2 + u * 0.8); else c.setRGB(0.3 + u * 0.7, 0.6 + u * 0.4, 1); e.tip.scale.setScalar(1 + u * 2.2); } else { if (e.team) c.setRGB(0.8, 0.12, 0.08); else c.setRGB(0.1, 0.4, 0.9); e.tip.scale.setScalar(1); }
}


// ===== 09_ui.js =====
// ---- DOM UI: HUD, title, pause, results, settings ---------------------------
var BASE_CSS = [
'html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden;overscroll-behavior:none}',
'#fr-root{position:fixed;inset:0;left:0;top:0;right:0;bottom:0;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif;color:#fff;z-index:2147483000}',
'#fr-canvas,#fr-ui{position:absolute;left:0;top:0;width:100%;height:100%}#fr-canvas canvas{display:block;width:100%;height:100%}',
'#fr-ui{pointer-events:none}#fr-ui>*{pointer-events:auto}',
'.fr-touch{position:absolute;left:0;top:0;width:100%;height:100%;display:none}.fr-play .fr-touch{display:block}',
'.fr-stick{position:absolute;left:0;top:0;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.07);opacity:0;transition:opacity .15s;pointer-events:none}',
'.fr-knob{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.45)}',
'.fr-btn{position:absolute;display:none;align-items:center;justify-content:center;border-radius:50%;border:2px solid rgba(255,255,255,.5);background:rgba(20,20,20,.35);color:#fff;font-weight:700}',
'.fr-istouch .fr-btn{display:flex}',
'.fr-fire{right:calc(env(safe-area-inset-right,0px) + 26px);bottom:calc(env(safe-area-inset-bottom,0px) + 70px);width:92px;height:92px}.fr-fire i{width:34px;height:34px;border-radius:50%;background:rgba(255,90,60,.85);display:block}.fr-fire.on{background:rgba(255,90,60,.4)}',
'.fr-reload{right:calc(env(safe-area-inset-right,0px) + 132px);bottom:calc(env(safe-area-inset-bottom,0px) + 40px);width:64px;height:64px;font-size:11px}',
'.fr-hud{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none!important;display:none;text-shadow:0 1px 3px rgba(0,0,0,.8)}.fr-play .fr-hud{display:block}',
'.fr-top{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 8px);display:flex;justify-content:space-between;align-items:flex-start;padding:0 calc(env(safe-area-inset-right,0px) + 12px) 0 calc(env(safe-area-inset-left,0px) + 12px)}',
'.fr-hpbox{width:34vw;max-width:220px}.fr-hpbar{height:10px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.5);border-radius:6px;overflow:hidden}.fr-hpfill{height:100%;width:100%;background:linear-gradient(90deg,#6fe07a,#c7f25a);transition:width .15s}.fr-hpbox.low .fr-hpfill{background:#ff4a3a}',
'.fr-small{font-size:12px;opacity:.9;margin-top:3px;font-weight:600}',
'.fr-mid{text-align:center;flex:1;font-weight:800;font-size:14px}.fr-dots{display:flex;gap:4px;justify-content:center;margin-top:4px}.fr-dots i{width:9px;height:9px;border-radius:50%;border:1px solid rgba(255,255,255,.7);display:block}.fr-dots i.on{background:#7dffb0;border-color:#7dffb0}.fr-dots i.cur{border-color:#ffb14a;box-shadow:0 0 6px #ffb14a}',
'.fr-right{text-align:right;min-width:90px}.fr-score{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}',
'.fr-pause{pointer-events:auto!important;display:inline-flex;margin-top:6px;width:38px;height:38px;border-radius:9px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.4);align-items:center;justify-content:center;font-size:14px;font-weight:900;letter-spacing:2px}',
'.fr-ammo{position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);bottom:calc(env(safe-area-inset-bottom,0px) + 18px);font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}.fr-ammo small{font-size:14px;opacity:.7}.fr-istouch .fr-ammo{bottom:calc(env(safe-area-inset-bottom,0px) + 224px);right:calc(env(safe-area-inset-right,0px) + 34px);font-size:22px}.fr-ammo.low{color:#ff6a4a}',
'.fr-cross{position:absolute;left:50%;top:50%;width:0;height:0}.fr-cross b{position:absolute;background:#fff;box-shadow:0 0 2px #000}.fr-cross .d{width:3px;height:3px;left:-1.5px;top:-1.5px;border-radius:50%}',
'.fr-hitm{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;opacity:0;transform:rotate(45deg)}.fr-hitm:before,.fr-hitm:after{content:"";position:absolute;background:#fff;box-shadow:0 0 3px #000}.fr-hitm:before{left:12px;top:0;width:2px;height:26px}.fr-hitm:after{top:12px;left:0;height:2px;width:26px}.fr-hitm.k:before,.fr-hitm.k:after{background:#ff4a3a}.fr-hitm.c:before,.fr-hitm.c:after{background:#ffd54a}',
'.fr-vig{position:absolute;left:0;top:0;width:100%;height:100%;opacity:0;background:radial-gradient(ellipse at center,rgba(255,0,0,0) 28%,rgba(190,0,0,.85) 100%)}',
'.fr-dmg{position:absolute;left:50%;top:50%;width:0;height:0;opacity:0}.fr-dmg i{position:absolute;left:-60px;top:-150px;width:120px;height:26px;border-radius:120px 120px 0 0/26px 26px 0 0;background:linear-gradient(180deg,rgba(255,40,30,.95),rgba(255,40,30,0))}',
'.fr-banner{position:absolute;left:0;right:0;top:24%;text-align:center;opacity:0;transition:opacity .3s}.fr-banner h2{margin:0;font-size:30px;letter-spacing:.12em;font-weight:900}.fr-banner p{margin:6px 16px 0;font-size:15px;font-weight:700}',
'.fr-feed{position:absolute;left:50%;top:60%;transform:translateX(-50%);text-align:center;font-size:13px;font-weight:700;color:#ffe9a8}.fr-feed div{animation:frfeed 1.3s forwards}@keyframes frfeed{0%{opacity:0;transform:translateY(8px)}15%{opacity:1;transform:none}75%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}',
'.fr-mark{position:absolute;left:0;top:0;display:none;font-size:11px;font-weight:800;color:#7dffb0;text-align:center;width:80px;margin-left:-40px}.fr-mark:before{content:"";display:block;margin:0 auto 2px;width:14px;height:14px;border:2px solid #7dffb0;transform:rotate(45deg);box-shadow:0 0 8px #7dffb0}',
'.fr-screen{position:absolute;left:0;top:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(8,10,14,.55),rgba(8,10,14,.82));text-align:center;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px calc(env(safe-area-inset-bottom,0px) + 12px);box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch}',
'.fr-screen.on{display:flex}.fr-screen h1{margin:0;font-size:clamp(30px,9vw,64px);letter-spacing:.06em;font-weight:900;line-height:1.05}.fr-screen h1 span{color:#ffb14a}.fr-screen h3{margin:6px 0 14px;font-size:15px;font-weight:700;letter-spacing:.3em;opacity:.9}',
'.fr-screen p{margin:4px 0;font-size:13px;line-height:1.6;opacity:.92;max-width:520px}',
'.fr-b{display:block;width:min(300px,78vw);margin:7px auto;padding:13px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;font-size:16px;font-weight:800;cursor:pointer;box-sizing:border-box}.fr-b.pri{background:#ff7a2a;border-color:#ff9a4a;color:#1a0d02}.fr-b:active{transform:scale(.97)}.fr-b.sm{padding:9px;font-size:13px;font-weight:700}',
'.fr-row{display:flex;align-items:center;justify-content:space-between;gap:10px;width:min(320px,82vw);margin:8px auto;font-size:14px;font-weight:700}.fr-row input[type=range]{flex:1;max-width:170px}.fr-seg{display:flex;gap:4px}.fr-seg span{padding:6px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.3);font-size:12px;cursor:pointer}.fr-seg span.on{background:#ff7a2a;color:#1a0d02;border-color:#ff7a2a}',
'.fr-stat{display:grid;grid-template-columns:auto auto;gap:4px 18px;margin:10px auto;font-size:14px;text-align:left}.fr-stat b{text-align:right;font-variant-numeric:tabular-nums}',
'.fr-big{font-size:44px;font-weight:900;color:#ffb14a;font-variant-numeric:tabular-nums}',
'.fr-note{font-size:11px!important;opacity:.65!important}',
'.fr-in{display:block;width:min(300px,78vw);margin:7px auto;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.45);color:#fff;font-size:16px;box-sizing:border-box;-webkit-user-select:text;user-select:text;outline:none}',
'.fr-aim{right:calc(env(safe-area-inset-right,0px) + 128px);bottom:calc(env(safe-area-inset-bottom,0px) + 112px);width:62px;height:62px;font-size:11px}.fr-aim.on{background:rgba(90,180,255,.5);border-color:#8cf}',
'.fr-wsw{right:calc(env(safe-area-inset-right,0px) + 30px);bottom:calc(env(safe-area-inset-bottom,0px) + 176px);width:84px;height:40px;border-radius:12px;font-size:11px}',
'.fr-nade{right:calc(env(safe-area-inset-right,0px) + 56px);bottom:calc(env(safe-area-inset-bottom,0px) + 8px);width:56px;height:52px;font-size:10px;flex-direction:column;line-height:1.1}',
'.fr-scope{position:absolute;left:0;top:0;width:100%;height:100%;display:none;background:radial-gradient(circle at center,rgba(0,0,0,0) 0,rgba(0,0,0,0) min(38vw,38vh),rgba(0,0,0,.97) calc(min(38vw,38vh) + 3px))}.fr-scope:before,.fr-scope:after{content:"";position:absolute;background:rgba(0,0,0,.85)}.fr-scope:before{left:50%;top:0;width:1px;height:100%}.fr-scope:after{top:50%;left:0;height:1px;width:100%}',
'.fr-streak{position:absolute;left:0;right:0;top:36%;text-align:center;font-size:26px;font-weight:900;color:#ffd54a;letter-spacing:.1em;opacity:0;text-shadow:0 0 12px rgba(255,140,0,.9),0 2px 3px #000}.fr-streak.on{animation:frstk 1.6s forwards}@keyframes frstk{0%{opacity:0;transform:scale(1.8)}12%{opacity:1;transform:scale(1)}75%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}',
'.fr-kfeed{position:absolute;right:calc(env(safe-area-inset-right,0px) + 60px);top:calc(env(safe-area-inset-top,0px) + 42px);text-align:right;font-size:11px;font-weight:700}.fr-kfeed div{background:rgba(0,0,0,.4);border-radius:6px;padding:2px 7px;margin-bottom:3px;display:inline-block;clear:both;float:right}.fr-kfeed div.me{border:1px solid rgba(255,255,255,.6)}.fr-kfeed i{font-style:normal;opacity:.8;font-weight:500}',
'.fr-radar{position:absolute;left:calc(env(safe-area-inset-left,0px) + 12px);top:calc(env(safe-area-inset-top,0px) + 50px);width:96px;height:96px}',
'.fr-death{position:absolute;left:0;right:0;top:30%;text-align:center;display:none}.fr-death b{display:block;font-size:19px;font-weight:900}.fr-death span{display:block;margin-top:8px;font-size:15px;font-weight:700}',
'.fr-wname{position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);bottom:calc(env(safe-area-inset-bottom,0px) + 56px);font-size:12px;font-weight:700;opacity:.9}.fr-istouch .fr-wname{display:none}',
'.fr-tdm .fr-dots{display:none}',
'.fr-brow{display:flex;gap:8px;align-items:center;width:min(330px,86vw);margin:2px auto;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.07);font-size:13px;font-weight:700;box-sizing:border-box}.fr-brow span{flex:1;text-align:left}.fr-brow b{width:38px;text-align:right;font-variant-numeric:tabular-nums}.fr-brow.hd{background:none;font-size:12px;color:#ffd54a}.fr-brow.me{border:1px solid rgba(255,255,255,.55)}',
'.fr-shop{justify-content:flex-end!important;background:linear-gradient(180deg,rgba(8,10,14,0) 0,rgba(8,10,14,0) 30%,rgba(8,10,14,.92) 44%)!important;overflow:hidden!important;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 8px)!important}',
'.fr-shophd{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;justify-content:space-between;padding:0 14px;font-weight:800;font-size:15px;text-shadow:0 1px 3px #000}.fr-pvname{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 38px);font-size:13px;font-weight:700;text-shadow:0 1px 3px #000}',
'.fr-tabs{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:0 0 6px}.fr-tabs span{padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.3);font-size:12px;font-weight:700;cursor:pointer}.fr-tabs span.on{background:#ff7a2a;color:#1a0d02;border-color:#ff7a2a}',
'.fr-list{width:min(430px,94vw);height:38vh;overflow-y:auto;-webkit-overflow-scrolling:touch;margin:0 auto}.fr-item{display:flex;align-items:center;gap:8px;padding:8px 10px;margin:4px 0;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid transparent;text-align:left;cursor:pointer}.fr-item.sel{border-color:#ffb14a}.fr-item div{flex:1;font-size:14px;font-weight:800}.fr-item small{display:block;font-size:11px;font-weight:500;opacity:.75}.fr-item button{flex:none;min-width:86px;padding:8px 6px;border-radius:9px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:12px;font-weight:800}.fr-item button.buy{background:#2f8f4a;border-color:#4fc46f}.fr-item button.eq{background:#ff7a2a;border-color:#ff9a4a;color:#1a0d02}.fr-item button.no{opacity:.45}',
'@media (orientation:landscape){.fr-shop{align-items:flex-end!important;justify-content:center!important;background:linear-gradient(90deg,rgba(8,10,14,0) 0,rgba(8,10,14,0) 36%,rgba(8,10,14,.93) 48%)!important}.fr-shop .fr-list{width:50vw;height:56vh;margin:0}.fr-shop .fr-tabs{width:50vw;margin-top:34px}.fr-shop .fr-note{width:50vw}.fr-pvname{right:54%!important}.fr-pvcross{left:22%!important;top:60%!important}.fr-res{align-items:flex-end!important;background:linear-gradient(90deg,rgba(8,10,14,.1) 0,rgba(8,10,14,.15) 36%,rgba(8,10,14,.9) 50%)!important}.fr-res>*{width:52vw!important;max-width:52vw!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box}.fr-res .fr-b{width:min(300px,50vw)!important;margin:6px auto!important;margin-right:calc(26vw - min(150px,25vw))!important}.fr-res .fr-brow,.fr-res .fr-stat{margin-right:calc(26vw - min(165px,24vw))!important;margin-left:auto!important;width:min(330px,48vw)!important}}',
'@media (orientation:portrait){.fr-res.stage{justify-content:flex-start!important;padding-top:34vh!important;background:linear-gradient(180deg,rgba(8,10,14,0) 0,rgba(8,10,14,.1) 26%,rgba(8,10,14,.9) 38%)!important}}',
'.fr-res{justify-content:flex-start!important}',
'.fr-pvcross{position:absolute;left:50%;top:20%;width:0;height:0;display:none}',
'.fr-prof{font-size:14px!important;font-weight:800;opacity:1!important}.fr-prof em{font-style:normal;color:#ffd54a}',
'.fr-load{position:absolute;left:0;right:0;top:46%;text-align:center;font-size:14px;letter-spacing:.2em;font-weight:700}'
].join('\n');

var H = {};
function buildUI() {
  var hud = H.hud = el('div', 'fr-hud', UI);
  H.vig = el('div', 'fr-vig', hud); H.scope = el('div', 'fr-scope', hud);
  H.dmg = el('div', 'fr-dmg', hud); el('i', null, H.dmg);
  var top = el('div', 'fr-top', hud);
  H.hpbox = el('div', 'fr-hpbox', top); var bar = el('div', 'fr-hpbar', H.hpbox); H.hpfill = el('div', 'fr-hpfill', bar); H.hptxt = el('div', 'fr-small', H.hpbox, 'HP 100');
  var mid = el('div', 'fr-mid', top); H.wave = el('div', null, mid, ''); H.dots = el('div', 'fr-dots', mid);
  for (var i = 0; i < 8; i++) el('i', null, H.dots);
  var right = el('div', 'fr-right', top); H.score = el('div', 'fr-score', right, '0'); H.pause = el('div', 'fr-pause', right, 'II');
  onTap(H.pause, function () { if (G.state === 'playing') pauseGame(); });
  H.radar = el('canvas', 'fr-radar', hud); H.radar.width = H.radar.height = 96; H.radarCtx = H.radar.getContext('2d');
  H.kfeed = el('div', 'fr-kfeed', hud);
  H.ammo = el('div', 'fr-ammo', hud); H.wname = el('div', 'fr-wname', hud);
  H.cross = el('div', 'fr-cross', hud); H.cl = [el('b', null, H.cross), el('b', null, H.cross), el('b', null, H.cross), el('b', null, H.cross)]; el('b', 'd', H.cross);
  H.hitm = el('div', 'fr-hitm', hud);
  H.banner = el('div', 'fr-banner', hud); H.bh = el('h2', null, H.banner); H.bp = el('p', null, H.banner);
  H.streak = el('div', 'fr-streak', hud);
  H.death = el('div', 'fr-death', hud); H.deathBy = el('b', null, H.death); H.deathT = el('span', null, H.death);
  H.feed = el('div', 'fr-feed', hud);

  // title
  var t = H.title = el('div', 'fr-screen fr-scroll', UI);
  el('h1', null, t).innerHTML = 'FRIENDS <span>WARFARE</span>'; el('h3', null, t, 'ともだちサバゲー');
  H.prof = el('p', 'fr-prof', t, ''); H.dailyBtn = el('button', 'fr-b sm', t, ''); H.dailyBtn.style.display = 'none'; onTap(H.dailyBtn, function () { audioInit(); ecoDaily(); });
  H.account = el('div', 'fr-account', t);
  H.playBtn = el('button', 'fr-b pri', t, 'チーム戦 4 vs 4'); onTap(H.playBtn, function () { audioInit(); SFX.ui(); showScreen('tdmset'); });
  H.survBtn = el('button', 'fr-b', t, 'サバイバル（8ウェーブ）'); onTap(H.survBtn, function () { audioInit(); SFX.ui(); startGame(); });
  H.shopBtn = el('button', 'fr-b', t, 'ショップ・装備'); onTap(H.shopBtn, function () { audioInit(); SFX.ui(); openShop(); });
  var hb = el('button', 'fr-b sm', t, 'あそびかた'); onTap(hb, function () { audioInit(); SFX.ui(); showScreen('help'); });
  var sb = el('button', 'fr-b sm', t, '設定'); onTap(sb, function () { audioInit(); SFX.ui(); H.setBack = 'title'; showScreen('settings'); });
  H.best = el('p', null, t, ''); H.modelNote = el('p', 'fr-note', t, '');
  el('p', 'fr-note', t, '※ 銃声などの大きな音と、画面が赤く光る・ゆれる演出があります　v' + GAME_VERSION);

  // team battle setup
  var ts = H.tdmset = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, ts, 'チーム戦 4 vs 4');
  el('p', null, ts, 'あなた＋味方ボット3人（ブルー）対 敵ボット4人（レッド）。先に決めたキル数に届いたチームの勝ち。制限時間は5分。倒されても数秒で復活します。');
  function seg(label, opts, get, set) { var r = el('div', 'fr-row', ts); el('span', null, r, label); var sg = el('div', 'fr-seg', r), list = []; opts.forEach(function (o) { var sp = el('span', null, sg, o[1]); list.push([o[0], sp]); onTap(sp, function () { SFX.ui(); set(o[0]); upd(); }); }); function upd() { list.forEach(function (x) { x[1].classList.toggle('on', x[0] === get()); }); } upd(); }
  seg('ボットの強さ', [[0, 'やさしい'], [1, 'ふつう'], [2, 'つよい']], function () { return TDM_OPT.diff; }, function (v) { TDM_OPT.diff = v; store.set('tdmDiff', v); });
  seg('勝利キル数', [[20, '20'], [30, '30'], [50, '50']], function () { return TDM_OPT.target; }, function (v) { TDM_OPT.target = v; store.set('tdmTarget', v); });
  onTap(el('button', 'fr-b pri', ts, 'スタート'), function () { SFX.ui(); startTeamBattle(); });
  onTap(el('button', 'fr-b sm', ts, 'もどる'), function () { SFX.ui(); showScreen('title'); });

  var hp = H.help = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, hp, 'あそびかた');
  el('p', null, hp, '【スマホ】左側ドラッグで移動（大きく前に倒すとダッシュ）／右側ドラッグで視点／赤いボタンを押している間ずっと射撃／「エイム」でのぞきこみ（もう一度押すと解除）／「武器」で持ちかえ／「グレネード」で投げる／「リロード」で弾を補充');
  el('p', null, hp, '【PC】クリックで開始・射撃／右クリックでエイム／マウスで視点／WASD で移動／Shift でダッシュ／R でリロード／1〜4 かホイールで武器切りかえ／G でグレネード／Esc で一時停止');
  el('p', null, hp, '【チーム戦】青が味方、赤が敵。頭の上の三角マークとレーダーの点の色で見分けられる。倒すとチームに1点。');
  el('p', null, hp, '【サバイバル】出てくる相手を全員倒すと次のウェーブへ。全8ウェーブでクリア。後半は空からドローンも来る。');
  el('p', null, hp, '【共通】頭に当てるとダメージ2倍。緑の箱は回復、黄色の箱は弾とグレネードの補充。赤い弾は見てからよけられる。試合を終えるとコインと経験値がもらえ、ショップで武器や着せ替えを買える。');
  onTap(el('button', 'fr-b', hp, 'もどる'), function () { SFX.ui(); showScreen('title'); });

  var st = H.settings = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, st, '設定');
  function slider(label, min, max, val, fn) { var r = el('div', 'fr-row', st); el('span', null, r, label); var i = el('input', null, r); i.type = 'range'; i.min = min; i.max = max; i.step = 0.05; i.value = val; i.addEventListener('input', function () { fn(+i.value); }); i.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true }); i.addEventListener('touchmove', function (e) { e.stopPropagation(); }, { passive: true }); }
  slider('視点の速さ', 0.3, 2.5, SENS, function (v) { SENS = v; store.set('sens', v); });
  slider('音量', 0, 1, AU.vol, function (v) { setVolume(v); });
  var ar = el('div', 'fr-row', st); el('span', null, ar, 'エイムアシスト'); var asg = el('div', 'fr-seg', ar), aOn = el('span', null, asg, 'オン'), aOff = el('span', null, asg, 'オフ');
  function aUpd() { aOn.classList.toggle('on', SET.assist); aOff.classList.toggle('on', !SET.assist); }
  onTap(aOn, function () { SET.assist = true; store.set('assist', true); aUpd(); }); onTap(aOff, function () { SET.assist = false; store.set('assist', false); aUpd(); }); aUpd();
  el('p', 'fr-note', st, 'エイムアシスト：スマホ操作のとき、照準が敵の近くにあると視点の動きがゆっくりになります');
  var qr = el('div', 'fr-row', st); el('span', null, qr, '画質'); var seg2 = el('div', 'fr-seg', qr); H.qseg = [];
  [['auto', '自動'], [0, '低'], [1, '中'], [2, '高']].forEach(function (o) { var s = el('span', null, seg2, o[1]); H.qseg.push([o[0], s]); onTap(s, function () { SFX.ui(); setQualityMode(o[0]); }); });
  H.qinfo = el('p', 'fr-note', st, '');
  onTap(el('button', 'fr-b', st, 'もどる'), function () { SFX.ui(); showScreen(H.setBack || 'title'); });

  var pz = H.paused = el('div', 'fr-screen', UI);
  el('h3', null, pz, '一時停止');
  onTap(el('button', 'fr-b pri', pz, 'つづける'), function () { SFX.ui(); resumeGame(); });
  onTap(el('button', 'fr-b', pz, '設定'), function () { SFX.ui(); H.setBack = 'paused'; showScreen('settings'); });
  onTap(el('button', 'fr-b', pz, 'タイトルへ（この試合は記録されません）'), function () { SFX.ui(); toTitle(); });

  var rs = H.result = el('div', 'fr-screen fr-scroll fr-res', UI);
  H.rTitle = el('h1', null, rs); H.rSub = el('h3', null, rs); H.rScore = el('div', 'fr-big', rs); H.rBoard = el('div', null, rs); H.rStat = el('div', 'fr-stat', rs); H.rCoins = el('p', 'fr-prof', rs, ''); H.rNote = el('p', null, rs, '');
  H.rAgain = el('button', 'fr-b pri', rs, 'もういちど'); onTap(H.rAgain, function () { SFX.ui(); stageShow(null); if (G.last && G.last.mode === 'tdm') startTeamBattle(); else startGame(); });
  onTap(el('button', 'fr-b', rs, 'タイトルへ'), function () { SFX.ui(); toTitle(); });
}
var SCREENS = ['title', 'tdmset', 'help', 'settings', 'paused', 'result'];
function showScreen(name) {
  SCREENS.forEach(function (n) { H[n].classList.toggle('on', n === name); });
  if (name === 'settings') refreshQualityUI();
  if (name === 'title') { H.best.textContent = store.get('best', 0) ? 'この端末のサバイバルベスト： ' + store.get('best', 0) : ''; refreshAccountUI(); refreshProfileUI(); }
}
var hudCache = {};
function setTxt(k, e, v) { if (hudCache[k] !== v) { hudCache[k] = v; e.textContent = v; } }
function updateHUD(dt) {
  var hp = Math.max(0, Math.ceil(P.hp)), id = curId();
  if (hudCache.hp !== hp) { hudCache.hp = hp; H.hpfill.style.width = hp + '%'; H.hptxt.textContent = 'HP ' + hp; H.hpbox.classList.toggle('low', hp <= 30); }
  setTxt('score', H.score, String(G.score));
  var am = gun.reloadT > 0 ? 'リロード中…' : gun.ammo[id] + ' / ' + WDEF[id].mag; if (hudCache.am !== am) { hudCache.am = am; H.ammo.textContent = am; H.ammo.classList.toggle('low', gun.ammo[id] <= Math.max(1, WDEF[id].mag * 0.2) && gun.reloadT <= 0); H.ammo.style.fontSize = gun.reloadT > 0 ? '15px' : ''; }
  var wn = WDEF[id].name + '　グレネード ' + P.nades; if (hudCache.wn !== wn) { hudCache.wn = wn; H.wname.textContent = wn; if (touchUI.wsw) { touchUI.wsw.textContent = WDEF[id].name.replace('ライフル', '').replace('ランチャー', ''); touchUI.nade.innerHTML = 'グレネード<br>× ' + P.nades; } }
  if (G.mode === 'tdm' && G.tdm) {
    var T = G.tdm, tl = Math.max(0, Math.ceil(T.timeLeft)), hs = T.score[0] + '|' + T.score[1] + '|' + tl;
    if (hudCache.tdm !== hs) { hudCache.tdm = hs; H.wave.innerHTML = '<span style="color:' + TEAM_CSS[0] + ';white-space:nowrap">ブルー ' + T.score[0] + '</span> － <span style="color:' + TEAM_CSS[1] + ';white-space:nowrap">' + T.score[1] + ' レッド</span><br><small>先取 ' + T.target + '　' + Math.floor(tl / 60) + ':' + ('0' + (tl % 60)).slice(-2) + '</small>'; }
  } else {
    var left = G.queue.length + aliveCount();
    setTxt('wave', H.wave, 'WAVE ' + G.wave + ' / 8　' + (G.phase === 'fight' ? 'のこり ' + left + ' 人' : ''));
    if (hudCache.dk !== G.wave) { hudCache.dk = G.wave; for (var i = 0; i < 8; i++) H.dots.children[i].className = i < G.wave - 1 ? 'on' : (i === G.wave - 1 ? 'cur' : ''); }
  }
  // crosshair spread
  var sp = (7 + (WDEF[id].spread + gun.bloom) * 700 + Math.min(10, P.speed * 1.6)) * lerp(1, Math.max(0.2, WDEF[id].ads), gun.ads), L = 9;
  var c = H.cl; c[0].style.cssText = 'left:' + (-sp - L) + 'px;top:-1px;width:' + L + 'px;height:2px'; c[1].style.cssText = 'left:' + sp + 'px;top:-1px;width:' + L + 'px;height:2px';
  c[2].style.cssText = 'top:' + (-sp - L) + 'px;left:-1px;height:' + L + 'px;width:2px'; c[3].style.cssText = 'top:' + sp + 'px;left:-1px;height:' + L + 'px;width:2px';
  if (H.hitT > 0) { H.hitT -= dt; H.hitm.style.opacity = Math.max(0, H.hitT / 0.18); }
  G.vig = damp(G.vig, 0, 2.5, dt); var low = P.hp <= 30 && P.hp > 0 ? 0.3 + Math.sin(G.time * 5) * 0.12 : 0;
  H.vig.style.opacity = Math.min(1, Math.max(G.vig, low)).toFixed(2);
  if (H.dmgT > 0) { H.dmgT -= dt; var rel = Math.atan2((H.dmgX - P.x) * Math.cos(P.yaw) - (H.dmgZ - P.z) * Math.sin(P.yaw), -(H.dmgX - P.x) * Math.sin(P.yaw) - (H.dmgZ - P.z) * Math.cos(P.yaw));
    H.dmg.style.opacity = Math.min(1, H.dmgT / 0.5); H.dmg.style.transform = 'rotate(' + rel.toFixed(3) + 'rad)'; } else if (hudCache.dmgOn) H.dmg.style.opacity = 0;
  hudCache.dmgOn = H.dmgT > 0;
  if (H.banT > 0) { H.banT -= dt; if (H.banT <= 0) H.banner.style.opacity = 0; }
  updateRadar(dt);
}
function hudHit(crit, kill) { H.hitT = 0.18; H.hitm.className = 'fr-hitm' + (kill ? ' k' : crit ? ' c' : ''); }
function banner(h, p, t) { H.bh.textContent = h; H.bp.textContent = p || ''; H.banner.style.opacity = 1; H.banT = t || 2.6; }
function feed(txt) { var d = el('div', null, H.feed, txt); while (H.feed.children.length > 3) H.feed.removeChild(H.feed.firstChild); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1300); }
function addScore(n, label) { G.score += n; if (label) feed(label + ' +' + n); }


// ===== 10_game.js =====
// ---- game state, player, quality manager, survival flow, main loop ------------
var P = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, speed: 0, bob: 0, hp: 100, lookDX: 0, lookDY: 0, landDip: 0, hurtT: 99, deadT: 0, team: 0, nades: 2, respawnT: 0, inv: 0 };
var G = { state: 'loading', mode: 'survival', phase: '', wave: 0, score: 0, stats: { shots: 0, hits: 0, kills: 0, heads: 0, maxStreak: 0 }, shake: 0, vig: 0, time: 0, timer: 0, queue: [], spawnT: 0, titleT: 0, baseFov: 66, streak: 0, streakT: 0, tdm: null };
var Q = { tier: 1, mode: store.get('qmode', 'auto'), prScale: 1, acc: 0, frames: 0, bad: 0, good: 0, fps: 60 };
var SET = { assist: store.get('assist', true) };

function applyQuality() {
  var t = Q.tier, cap = t === 2 ? 2 : t === 1 ? 1.5 : 1;
  var pr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, cap) * Q.prScale);
  renderer.setPixelRatio(pr); renderer.setSize(window.innerWidth, window.innerHeight, false);
  var wantShadow = t > 0, size = t === 2 ? 2048 : 1024;
  if (sun.castShadow !== wantShadow) sun.castShadow = wantShadow;
  if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  refreshQualityUI();
}
function setQualityMode(m) {
  Q.mode = m; store.set('qmode', m);
  if (m === 'auto') { Q.tier = initialTier(); Q.prScale = 1; } else { Q.tier = m; Q.prScale = 1; }
  Q.bad = Q.good = 0; applyQuality();
}
function initialTier() {
  if (QUERY.q != null) return clamp(+QUERY.q | 0, 0, 2);
  var mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  if (mem <= 2 || cores <= 2) return 0;
  return IS_MOBILE ? 1 : 2;
}
function refreshQualityUI() {
  if (!H.qseg) return;
  H.qseg.forEach(function (o) { o[1].classList.toggle('on', o[0] === Q.mode); });
  H.qinfo.textContent = '現在: ' + ['低', '中', '高'][Q.tier] + '（解像度 ' + Math.round(Q.prScale * 100) + '%・影 ' + (Q.tier > 0 ? 'あり' : 'なし') + '）' + (Q.mode === 'auto' ? '　動きが重いと自動で下がります' : '');
}
function autoQuality(dt) {
  Q.acc += dt; Q.frames++;
  if (Q.acc < 1) return;
  Q.fps = Q.frames / Q.acc; Q.acc = 0; Q.frames = 0;
  if (Q.mode !== 'auto' || QUERY.q != null) return;
  if (Q.fps < 42) { Q.bad++; Q.good = 0; } else if (Q.fps >= 56) { Q.good++; Q.bad = 0; } else { Q.bad = 0; Q.good = 0; }
  if (Q.bad >= 2) {
    Q.bad = 0;
    if (Q.prScale > 0.72) Q.prScale -= 0.14; else if (Q.tier > 0) { Q.tier--; Q.prScale = 0.86; } else if (Q.prScale > 0.5) Q.prScale -= 0.1; else return;
    applyQuality();
  } else if (Q.good >= 8 && Q.prScale < 1) { Q.good = 0; Q.prScale = Math.min(1, Q.prScale + 0.07); applyQuality(); }
}
function onResize() {
  var w = window.innerWidth, h = window.innerHeight, a = w / h;
  camera.aspect = a; G.baseFov = camera.fov = a >= 1.2 ? 66 : clamp(2 * Math.atan(Math.tan(33 * Math.PI / 180) * 1.25 / a) * 180 / Math.PI, 66, 96);
  camera.updateProjectionMatrix(); applyQuality();
  if (gun.root) { var pt = a < 1; gun.root.scale.setScalar(pt ? 0.2 : 0.3); gun.base.set(pt ? 0.04 : 0.068, pt ? -0.058 : -0.062, pt ? -0.12 : -0.155); }
}

// ---- common start / end ---------------------------------------------------------
function resetRun(mode) {
  clearEnemies(); clearProjectiles(); resetPickups();
  G.mode = mode; G.score = 0; G.wave = 0; G.stats = { shots: 0, hits: 0, kills: 0, heads: 0, maxStreak: 0 }; G.shake = 0; G.vig = 0; G.time = 0; G.queue = []; G.navT = 0; G.streak = 0; G.streakT = 0; G.phase = '';
  P.x = SPAWN_POS[0]; P.z = SPAWN_POS[1]; P.y = 0; P.yaw = 0; P.pitch = 0; P.vx = P.vz = 0; P.hp = 100; P.hurtT = 99; P.deadT = 0; P.bob = 0; P.team = 0; P.nades = 2; P.respawnT = 0; P.inv = 0; P.lastKiller = null;
  setLoadout(ECO.loadout); gun.cool = 0.3; gun.recP = gun.recY = gun.recPV = gun.recYV = 0; gun.root.visible = true; gun.scoped = null; gun.nadeCool = 0;
  hudCache = {}; H.hitT = 0; H.dmgT = 0; H.kfeed.innerHTML = ''; H.death.style.display = 'none'; H.feed.innerHTML = '';
  input.fire = false; input.aim = false; input.lookX = input.lookY = 0; input.switchTo = null; input.grenade = false; if (input.resetTouch) input.resetTouch();
  updateNav(P.x, P.z);
  ROOT.classList.toggle('fr-tdm', mode === 'tdm');
  G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null);
  if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} }
  ecoMatchStart(mode);
}
function leavePlay() { ROOT.classList.remove('fr-play'); input.aim = false; if (H.scope) H.scope.style.display = 'none'; H.death.style.display = 'none'; if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} } }

// ---- survival (8 waves) ---------------------------------------------------------
function buildWave(w) {
  var n = 3 + Math.round(w * 1.3), list = [], i, dr = w >= 4 ? Math.floor((w - 2) / 2) : 0;
  for (i = 0; i < n; i++) list.push({ f: Math.floor(Math.random() * 8) });
  list[0] = { f: w - 1, leader: true };                  // each wave is led by one of the eight
  for (i = 0; i < dr; i++) list.push({ d: i === 0 && w >= 6 ? 'gunner' : (i % 2 ? 'kami' : 'scout') });
  for (i = list.length - 1; i > 1; i--) { var j = 1 + Math.floor(Math.random() * i), t = list[i]; list[i] = list[j]; list[j] = t; }
  return list.reverse();                                  // popped from the end: leader comes out last
}
function startGame() { resetRun('survival'); nextWave(); }
function nextWave() {
  G.wave++; G.phase = 'intro'; G.timer = 3; G.queue = buildWave(G.wave);
  banner('WAVE ' + G.wave, 'リーダーは「' + FRIEND_NAMES[G.wave - 1] + '」　全員倒せ', 3); SFX.alarm();
}
function updateFlow(dt) {
  G.navT -= dt; if (G.navT <= 0) { G.navT = 0.35; updateNav(P.x, P.z); }
  if (G.streakT > 0) { G.streakT -= dt; if (G.streakT <= 0) G.streak = 0; }
  if (G.phase === 'intro') { G.timer -= dt; if (G.timer <= 0) { G.phase = 'fight'; G.spawnT = 0; } }
  else if (G.phase === 'fight') {
    var maxAlive = Math.min(3 + Math.floor(G.wave / 2), Q.tier === 0 ? 5 : 6), alive = aliveCount();
    G.spawnT -= dt;
    if (G.queue.length && alive < maxAlive && G.spawnT <= 0) { var q = G.queue.pop(); if (q.d) spawnEnemy(q.d, G.wave); else spawnFriend(q.f, G.wave, q.leader); G.spawnT = 1.2; }
    if (!G.queue.length && !alive && P.hp > 0) {
      P.hp = Math.min(100, P.hp + 40); P.nades = Math.max(P.nades, 2); addScore(300 + G.wave * 50, 'WAVE ' + G.wave + ' クリア'); SFX.rescue();
      G.phase = 'rest'; G.timer = G.wave >= 8 ? 3 : 3.2; banner(G.wave >= 8 ? '全ウェーブ制圧！' : 'WAVE ' + G.wave + ' クリア', G.wave >= 8 ? '' : 'HP 回復　次にそなえろ', 2.6);
    }
  } else if (G.phase === 'rest') { G.timer -= dt; if (G.timer <= 0) { if (G.wave >= 8) endGame(true); else nextWave(); } }
}
function hurtPlayer(dmg, sx, sz, attacker, label) {
  if (P.hp <= 0 || G.state !== 'playing' || P.inv > 0 || P.respawnT > 0) return;
  P.hp -= dmg; P.hurtT = 0; G.vig = Math.min(1, 0.45 + dmg / 40); G.shake = Math.min(1.6, G.shake + 0.5 + dmg / 30);
  H.dmgT = 1.1; H.dmgX = sx; H.dmgZ = sz; SFX.hurt();
  if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) {} }
  if (P.hp <= 0) {
    P.hp = 0; P.deadT = 0.0001; input.fire = false; input.aim = false;
    P.lastKiller = { name: attacker === P ? '自分' : attacker ? attacker.name : '？', label: label || 'ブラスター', team: attacker && attacker !== P ? attacker.team : 1 };
    if (G.mode === 'tdm') { onKill(attacker === P ? null : attacker, P, label, false); tdmPlayerDied(); } else SFX.lose();
  }
}
function endGame(win) {
  var acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0, bonus = 0;
  if (win) { bonus = Math.max(0, Math.round((720 - G.time) * 5)) + Math.round(P.hp) * 10; G.score += bonus; SFX.win(); }
  G.state = 'result'; leavePlay();
  H.rTitle.innerHTML = win ? 'MISSION <span>COMPLETE</span>' : 'MISSION <span>FAILED</span>';
  H.rSub.textContent = win ? '全8ウェーブ制圧！' : 'WAVE ' + G.wave + ' で力尽きた' + (P.lastKiller ? '（' + P.lastKiller.name + ' の' + P.lastKiller.label + '）' : '');
  H.rScore.textContent = G.score; H.rBoard.innerHTML = '';
  H.rStat.innerHTML = ''; [['到達ウェーブ', (win ? 8 : G.wave) + ' / 8'], ['撃破数', G.stats.kills], ['ヘッドショット', G.stats.heads], ['最大連続キル', G.stats.maxStreak], ['命中率', acc + '%'], ['タイム', Math.floor(G.time / 60) + ':' + ('0' + Math.floor(G.time % 60)).slice(-2)], ['クリアボーナス', bonus]].forEach(function (r) { el('span', null, H.rStat, r[0]); el('b', null, H.rStat, String(r[1])); });
  var best = store.get('best', 0), isBest = G.score > best; if (isBest) store.set('best', G.score);
  H.rNote.textContent = isBest ? 'この端末のベストスコア更新！' : 'この端末のベスト： ' + best;
  G.last = { mode: 'survival', score: G.score, wave: win ? 8 : G.wave, kills: G.stats.kills, heads: G.stats.heads, streak: G.stats.maxStreak, acc: acc, time: Math.round(G.time), win: !!win };
  H.rAgain.textContent = 'もういちど';
  stageShow(null); H.result.classList.remove('stage'); ecoMatchEnd(G.last);
  showScreen('result');
}
function pauseGame() { if (G.state !== 'playing') return; G.state = 'paused'; ROOT.classList.remove('fr-play'); input.fire = false; input.aim = false; if (input.resetTouch) input.resetTouch(); if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} } showScreen('paused'); }
function resumeGame() { G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null); if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} } }
function toTitle() { clearEnemies(); clearProjectiles(); G.state = 'title'; G.phase = ''; G.wave = 0; leavePlay(); gun.root.visible = false; if (AU.ok) AU.hum.gain.value = 0; stageShow(null); showScreen('title'); }

// ---- aim assist: slows the look speed while the crosshair is close to an enemy (touch only)
var assist = { t: 0, f: 1 };
function aimAssist(dt) {
  if (!SET.assist || !input.usedTouch) return 1;
  assist.t -= dt; if (assist.t > 0) return assist.f;
  assist.t = 0.07; assist.f = 1;
  camera.getWorldDirection(_v1); var best = null, ba = 1;
  for (var i = 0; i < ENEMIES.length; i++) {
    var e = ENEMIES[i]; if (e.dead || e.team === P.team) continue;
    var dx = e.x - camera.position.x, dy = actorY(e) + 0.2 - camera.position.y, dz = e.z - camera.position.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d > 60 || d < 0.5) continue;
    var ang = Math.acos(clamp((dx * _v1.x + dy * _v1.y + dz * _v1.z) / d, -1, 1)), lim = Math.atan(1.0 / d) + 0.015;
    if (ang < lim && ang / lim < ba) { ba = ang / lim; best = e; }
  }
  if (best && losClear(camera.position.x, camera.position.y, camera.position.z, best.x, actorY(best) + 0.2, best.z)) assist.f = lerp(0.4, 0.75, ba);
  return assist.f;
}
function updatePlayer(dt) {
  pollKeys();
  var W = curDef(), af = aimAssist(dt) * (camera.fov / G.baseFov);
  var lx = input.lookX * af, ly = input.lookY * af; input.lookX = input.lookY = 0;
  if (P.hp > 0) { P.yaw -= lx; P.pitch = clamp(P.pitch - ly, -1.35, 1.35); }
  P.lookDX = lx; P.lookDY = ly;
  if (P.inv > 0) P.inv -= dt;
  var mx = P.hp > 0 ? input.mx : 0, mz = P.hp > 0 ? input.mz : 0, sp = ((input.sprint && mz < -0.3 && gun.ads < 0.3) ? 6.9 : 4.5) * W.move * lerp(1, 0.6, gun.ads);
  var s = Math.sin(P.yaw), c = Math.cos(P.yaw), wx = (mx * c + mz * s) * sp, wz = (-mx * s + mz * c) * sp, k = 1 - Math.exp(-11 * dt);
  P.vx += (wx - P.vx) * k; P.vz += (wz - P.vz) * k;
  collideMove(P, P.x + P.vx * dt, P.z + P.vz * dt, 0.36, 0);
  P.speed = Math.hypot(P.vx, P.vz);
  var pb = P.bob; P.bob += P.speed * dt * 1.55;
  if (P.speed > 1 && Math.floor(pb / Math.PI) !== Math.floor(P.bob / Math.PI)) SFX.step(P.speed > 5.5);
  P.hurtT += dt; if (P.hp > 0 && P.hp < 60 && P.hurtT > 6) P.hp = Math.min(60, P.hp + 5 * dt);
  G.shake = damp(G.shake, 0, 7, dt);
  var eye = 1.66 + Math.sin(P.bob * 2) * 0.028 * Math.min(1, P.speed / 4.5) * (1 - gun.ads * 0.7), roll = 0;
  if (P.deadT > 0) { P.deadT += dt; var d = Math.min(1, P.deadT / 0.9); eye = lerp(eye, 0.35, d * d); roll = d * 1.1; if (G.mode !== 'tdm' && P.deadT > 2.1 && G.state === 'playing') endGame(false); }
  var sh = G.shake * 0.012;
  camera.position.set(P.x + rnd(-sh, sh), P.y + eye + rnd(-sh, sh), P.z);
  camera.rotation.set(P.pitch + gun.recP + rnd(-sh, sh), P.yaw + gun.recY, roll + rnd(-sh, sh) * 2 + mx * -0.012);
}
function updateSun() {
  var cx = G.state === 'playing' ? P.x : 0, cz = G.state === 'playing' ? P.z : 0;
  cx = Math.round(cx / 2) * 2; cz = Math.round(cz / 2) * 2;
  sun.position.set(cx + SUN_DIR.x * 60, SUN_DIR.y * 60, cz + SUN_DIR.z * 60); sun.target.position.set(cx, 0, cz);
}
var lastT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  if (G.state === 'playing') {
    G.time += dt; updatePlayer(dt); updateWeapon(dt);
    if (G.mode === 'tdm') tdmUpdate(dt); else updateFlow(dt);
    updateEnemies(dt); updateBolts(dt); updateProjectiles(dt); updatePickups(dt); updateFX(dt);
    updateLineup(dt, 0, 0, false); updateHUD(dt); autoQuality(dt);
  } else if (G.state !== 'paused' && G.state !== 'loading') {
    G.titleT += dt; var a = G.titleT * 0.07 + 1.2;
    if (camera.fov !== G.baseFov) { camera.fov = G.baseFov; camera.updateProjectionMatrix(); }
    if (!stageCamera(dt)) { camera.position.set(Math.sin(a * 3) * 2.5, 1.5, 28.5); camera.rotation.set(0, 0, 0); camera.lookAt(0, 1.75, 21.5); }
    updateFX(dt); updateEnemies(dt); updateLineup(dt, camera.position.x, camera.position.z, G.state === 'title' && !STAGE.on);
  }
  updateSun();
  renderer.render(scene, camera);
}


// ===== 11_account.js =====
// ---- accounts: ID + password login against Supabase (HTTPS only, no cookies) --
// The password is sent once over HTTPS and hashed with bcrypt on the server.
// The server returns a random session token; it is kept in localStorage (or in
// memory when storage is unavailable) and sent in the request body — no cookies.
var API = { url: "https://tzccnrnwexewlwogrkuk.supabase.co", key: "sb_publishable_uEw-i-TZjLyUNEUjry2tZg_4FqgpO9Y" };
if (window.__FR_API) { API.url = window.__FR_API.url; API.key = window.__FR_API.key; }
var ACC = { token: null, id: null, best: 0, memOnly: false, checked: false, online: null };

function apiReady() {
  if (/^https:\/\/[a-z0-9.-]+$/i.test(API.url)) return true;                      // HTTPS only
  return !!(window.__FR_API && window.__FR_API.test && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(API.url));   // local automated tests
}
function rpc(name, args, cb) {
  if (!apiReady()) return cb({ ok: false, error: 'NOT_CONFIGURED' });
  var done = false, ctl = window.AbortController ? new AbortController() : null;
  function fin(r) { if (done) return; done = true; clearTimeout(tm); cb(r); }
  var tm = setTimeout(function () { if (ctl) { try { ctl.abort(); } catch (e) {} } fin({ ok: false, error: 'NETWORK' }); }, 15000);
  try {
    fetch(API.url + '/rest/v1/rpc/' + name, {
      method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', signal: ctl ? ctl.signal : undefined,
      headers: { 'Content-Type': 'application/json', 'apikey': API.key, 'Authorization': 'Bearer ' + API.key },
      body: JSON.stringify(args || {})
    }).then(function (r) { return r.json().then(function (j) { return (j && typeof j.ok === 'boolean') ? j : { ok: false, error: 'SERVER', status: r.status }; }); })
      .then(fin, function () { fin({ ok: false, error: 'NETWORK' }); });
  } catch (e) { fin({ ok: false, error: 'NETWORK' }); }
}
function errText(r) {
  var m = Math.max(1, Math.ceil((r.retry_after || 60) / 60));
  switch (r.error) {
    case 'BAD_CREDENTIALS': return 'ID またはパスワードが違います' + (r.remaining != null ? '（あと ' + r.remaining + ' 回まちがえるとロック）' : '');
    case 'LOCKED': return 'まちがいが続いたためロック中です。約 ' + m + ' 分後にもう一度ためしてください';
    case 'TOO_MANY': return '登録が多すぎます。約 ' + m + ' 分後にもう一度ためしてください';
    case 'ID_TAKEN': return 'その ID はすでに使われています';
    case 'BAD_ID': return 'ID は半角の英数字と _ で 3〜16 文字にしてください';
    case 'SHORT_PASSWORD': return 'パスワードは 8 文字以上にしてください';
    case 'LONG_PASSWORD': return 'パスワードが長すぎます（72 文字まで）';
    case 'NOT_LOGGED_IN': return 'ログインの期限が切れました。もう一度ログインしてください';
    case 'NOT_CONFIGURED': return 'ログイン機能はまだ準備中です';
    case 'NETWORK': return 'サーバーに接続できませんでした（通信状態、またはアプリの制限の可能性）';
    default: return 'うまくいきませんでした（' + (r.error || '不明') + '）';
  }
}
function setSession(r) {
  ACC.token = r.token; ACC.id = r.id; ACC.best = r.best || 0; ACC.memOnly = false;
  try { localStorage.setItem('fr_token', r.token); if (localStorage.getItem('fr_token') !== r.token) ACC.memOnly = true; } catch (e) { ACC.memOnly = true; }
  ecoRefresh();
}
function clearSession() { var had = !!ACC.token; ACC.token = null; ACC.id = null; ACC.best = 0; try { localStorage.removeItem('fr_token'); } catch (e) {} if (had) ecoRefresh(); }
function accountInit() {
  if (!apiReady()) { ACC.checked = true; ecoRefresh(); return refreshAccountUI(); }
  var t = null; try { t = localStorage.getItem('fr_token'); } catch (e) {}
  if (!t) { ACC.checked = true; ecoRefresh(); rpc('fr_leaderboard', {}, function (r) { ACC.online = !!r.ok; refreshAccountUI(); }); return refreshAccountUI(); }
  rpc('fr_me', { p_token: t }, function (r) {
    ACC.checked = true; ACC.online = r.error !== 'NETWORK';
    if (r.ok) { ACC.token = t; ACC.id = r.id; ACC.best = r.best || 0; } else if (r.error === 'NOT_LOGGED_IN') clearSession();
    ecoRefresh(); refreshAccountUI();
  });
}
function validateInputs(id, pw, isRegister) {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(id)) return isRegister ? errText({ error: 'BAD_ID' }) : errText({ error: 'BAD_CREDENTIALS' });
  if (isRegister && pw.length < 8) return errText({ error: 'SHORT_PASSWORD' });
  if (!pw) return 'パスワードを入れてください';
  return null;
}
function doAuth(isRegister) {
  var id = H.aId.value.trim(), pw = H.aPw.value, v = validateInputs(id, pw, isRegister);
  if (v) { H.aMsg.textContent = v; return; }
  if (ACC.busy) return; ACC.busy = true; H.aMsg.textContent = '通信中…';
  rpc(isRegister ? 'fr_register' : 'fr_login', { p_id: id, p_password: pw }, function (r) {
    ACC.busy = false; H.aPw.value = '';
    if (!r.ok) { H.aMsg.textContent = errText(r); return; }
    setSession(r); H.aId.blur(); H.aPw.blur(); H.aMsg.textContent = '';
    showScreen('title');
  });
}
function doLogout() { var t = ACC.token; clearSession(); refreshAccountUI(); if (t) rpc('fr_logout', { p_token: t }, function () {}); }
function doDelete() {
  var pw = H.dPw.value; if (!pw) { H.dMsg.textContent = 'パスワードを入れてください'; return; }
  if (ACC.busy) return; ACC.busy = true; H.dMsg.textContent = '通信中…';
  rpc('fr_delete_account', { p_token: ACC.token, p_password: pw }, function (r) {
    ACC.busy = false; H.dPw.value = '';
    if (!r.ok) { H.dMsg.textContent = errText(r); if (r.error === 'NOT_LOGGED_IN') { clearSession(); showScreen('title'); } return; }
    clearSession(); H.dMsg.textContent = ''; showScreen('title'); H.accMsg.textContent = 'アカウントと記録を削除しました';
  });
}
function showRanking() {
  showScreen('rank'); H.rankList.innerHTML = ''; H.rankList2.innerHTML = ''; H.rankMsg.textContent = '読み込み中…';
  rpc('fr_leaderboard', {}, function (r) {
    if (!r.ok) { H.rankMsg.textContent = errText(r); return; }
    H.rankMsg.textContent = '';
    if (!r.rows.length) el('span', null, H.rankList, 'まだ記録がありません');
    r.rows.forEach(function (row, i) { el('span', null, H.rankList, (i + 1) + '. ' + row.id + (row.lv ? '（Lv ' + row.lv + ' ' + titleOf(row.lv) + '）' : '') + (row.id === ACC.id ? ' ←あなた' : '')); el('b', null, H.rankList, String(row.best)); });
  });
  rpc('fr_leaderboard_tdm', {}, function (r) {
    if (!r.ok) return;
    if (!r.rows.length) el('span', null, H.rankList2, 'まだ記録がありません');
    r.rows.forEach(function (row, i) { el('span', null, H.rankList2, (i + 1) + '. ' + row.id + '（Lv ' + row.lv + ' ' + titleOf(row.lv) + '）' + (row.id === ACC.id ? ' ←あなた' : '')); el('b', null, H.rankList2, row.wins + ' 勝 ' + row.losses + ' 敗'); });
  });
}
function buildAccountUI() {
  var a = H.account; a.style.cssText = 'margin:6px 0 4px';
  H.accInfo = el('p', null, a, ''); H.accBtns = el('div', null, a); H.accMsg = el('p', 'fr-note', a, '');
  H.rSave = el('p', 'fr-note', H.result, ''); H.result.insertBefore(H.rSave, H.rNote.nextSibling);
  function field(parent, ph, type, ac) { var i = el('input', 'fr-in', parent); i.type = type; i.placeholder = ph; i.autocomplete = ac; i.setAttribute('autocapitalize', 'off'); i.setAttribute('autocorrect', 'off'); i.spellcheck = false; i.maxLength = type === 'password' ? 72 : 16;
    ['touchstart', 'touchmove', 'touchend'].forEach(function (n) { i.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); }); return i; }
  var s = H.auth = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, s, 'ログイン / 新規登録');
  H.aId = field(s, 'ID（半角英数字と _ ・3〜16文字）', 'text', 'username'); H.aPw = field(s, 'パスワード（8文字以上）', 'password', 'current-password');
  H.aMsg = el('p', null, s, ''); H.aMsg.style.color = '#ffd27a'; H.aMsg.style.minHeight = '1.6em';
  onTap(el('button', 'fr-b pri', s, 'ログイン'), function () { doAuth(false); });
  onTap(el('button', 'fr-b', s, 'この ID とパスワードで新規登録'), function () { doAuth(true); });
  onTap(el('button', 'fr-b sm', s, 'もどる'), function () { H.aPw.value = ''; H.aMsg.textContent = ''; showScreen('title'); });
  el('p', 'fr-note', s, 'パスワードは暗号化（bcrypt）してサーバーに保存され、だれにも読めません。忘れると元に戻せないのでメモしておいてください。ほかのサービスと同じパスワードは使わないでください。');
  var d = H.del = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, d, 'アカウント削除'); el('p', null, d, 'アカウントと、保存されたすべての記録が消えます。元には戻せません。確認のためパスワードを入れてください。');
  H.dPw = field(d, 'パスワード', 'password', 'current-password'); H.dMsg = el('p', null, d, ''); H.dMsg.style.color = '#ffd27a'; H.dMsg.style.minHeight = '1.6em';
  var db = el('button', 'fr-b', d, '削除する'); db.style.background = '#b3261e'; onTap(db, doDelete);
  onTap(el('button', 'fr-b sm', d, 'やめる'), function () { H.dPw.value = ''; H.dMsg.textContent = ''; showScreen('title'); });
  var r = H.rank = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, r, 'チーム戦 勝利数ランキング'); H.rankList2 = el('div', 'fr-stat', r);
  el('h3', null, r, 'サバイバル スコアランキング'); H.rankList = el('div', 'fr-stat', r); H.rankMsg = el('p', null, r, '');
  onTap(el('button', 'fr-b sm', r, 'もどる'), function () { showScreen('title'); });
  SCREENS.push('auth', 'del', 'rank');
  accountInit();
}
function refreshAccountUI() {
  if (!H.accInfo) return;
  var b = H.accBtns; b.innerHTML = ''; H.accMsg.textContent = '';
  function btn(t, fn) { var x = el('button', 'fr-b sm', b, t); x.style.display = 'inline-block'; x.style.width = 'auto'; x.style.margin = '3px'; x.style.padding = '8px 14px'; onTap(x, function () { audioInit(); SFX.ui(); fn(); }); }
  if (!apiReady()) { H.accInfo.textContent = 'ゲストプレイ中（記録・コイン・持ち物はこの端末だけ。端末を変えると消えます）'; H.accMsg.textContent = 'ログイン機能は準備中です'; return; }
  if (!ACC.checked) { H.accInfo.textContent = 'ログイン状態を確認中…'; return; }
  if (ACC.token) {
    H.accInfo.textContent = 'ログイン中： ' + ACC.id + '　／　自己ベスト ' + ACC.best;
    btn('ランキング', showRanking); btn('ログアウト', doLogout); btn('アカウント削除', function () { showScreen('del'); });
    if (ACC.memOnly) H.accMsg.textContent = '※ このアプリでは保存ができないため、閉じるとログアウトされます';
  } else {
    H.accInfo.textContent = 'ゲストプレイ中（記録・コイン・持ち物はこの端末だけ。端末を変えると消えます）';
    btn('ログイン / 新規登録', function () { showScreen('auth'); }); btn('ランキング', showRanking);
    if (ACC.online === false) H.accMsg.textContent = '※ サーバーに接続できません。このアプリの中ではログインが使えない可能性があります';
  }
}


// ===== 12_modes.js =====
// ---- team battle (4 vs 4 with bots), kills & streaks, pickups, radar, kill feed -
var STREAK_NAMES = { 2: 'ダブルキル', 3: 'トリプルキル', 4: 'クアッドキル', 5: 'ランペイジ', 7: 'アンストッパブル', 10: 'ゴッドライク' };
var TDM_OPT = { target: store.get('tdmTarget', 30), diff: store.get('tdmDiff', 1), time: 300 };
var TEAM_NAME = ['ブルー', 'レッド'], TEAM_CSS = ['#6ab6ff', '#ff6a5a'];

function onKill(att, vic, label, crit) {
  if (G.mode === 'tdm' && G.tdm) {
    var T = G.tdm, ar = att === P ? T.me : (att && att.roster), vr = vic === P ? T.me : vic.roster;
    if (vr) { vr.deaths++; vr.respT = 4.2; }
    if (ar && vr && ar.team !== vr.team && !T.over) { ar.kills++; T.score[ar.team]++; }
    killFeed(ar, vr, label, crit);
    if (att === P && vic !== P) { G.stats.kills++; addScore(100 + (crit ? 50 : 0), (vr ? vr.name : '') + (crit ? ' をヘッドショット' : ' を倒した')); SFX.kill(); streakUp(); }
    return;
  }
  if (att === P) {
    G.stats.kills++; addScore(Math.round(vic.T.score * (vic.leader ? 3 : 1)) + (crit ? 50 : 0), vic.name + (crit ? (vic.friend ? ' をヘッドショット' : ' をクリティカル撃破') : ' を倒した')); SFX.kill(); streakUp(); G.streakT = 6;
  }
}
function streakUp() {
  G.streak++; if (G.streak > G.stats.maxStreak) G.stats.maxStreak = G.streak;
  var n = STREAK_NAMES[G.streak]; if (!n) return;
  H.streak.textContent = n + '！'; H.streak.className = 'fr-streak'; void H.streak.offsetWidth; H.streak.className = 'fr-streak on'; SFX.streak(G.streak);
}
function killFeed(ar, vr, label, crit) {
  if (!vr) return;
  var d = el('div', null, H.kfeed);
  d.innerHTML = (ar ? '<b style="color:' + TEAM_CSS[ar.team] + '"></b> ' : '') + '<i></i> <b style="color:' + TEAM_CSS[vr.team] + '"></b>';
  var bs = d.querySelectorAll('b'); if (ar) bs[0].textContent = ar.name; bs[bs.length - 1].textContent = vr.name;
  d.querySelector('i').textContent = '▸ ' + (label || '') + (crit ? '（HS）' : '') + ' ▸';
  if ((ar && ar.isPlayer) || vr.isPlayer) d.className = 'me';
  while (H.kfeed.children.length > 4) H.kfeed.removeChild(H.kfeed.firstChild);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 6000);
}

// ---- team battle ------------------------------------------------------------------
function tdmSpawnPos(team) {
  var zc = team === 0 ? 25.5 : -25.5, best = null, bd = -1;
  for (var tr = 0; tr < 24; tr++) {
    var x = rnd(-14, 14), z = zc + rnd(-3.5, 3.5); if (NAV.blocked[navCell(x, z)]) continue;
    var md = 99; for (var i = 0; i < ENEMIES.length; i++) { var e = ENEMIES[i]; if (e.dead) continue; var d = Math.hypot(e.x - x, e.z - z); if (e.team !== team) d *= 0.5; if (d < md) md = d; }
    if (team !== P.team && actorAlive(P)) md = Math.min(md, Math.hypot(P.x - x, P.z - z) * 0.5);
    if (md > bd) { bd = md; best = [x, z]; }
  }
  return best || [0, zc];
}
var RALLY = [{ x: 0, z: -14 }, { x: 0, z: 14 }];
function tdmRally(team) { return RALLY[team]; }
function startTeamBattle() {
  resetRun('tdm');
  var ids = [0, 1, 2, 3, 4, 5, 6, 7].filter(function (i) { return i !== ECO.eq.avatar; }), i, j, t;
  for (i = ids.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
  var T = G.tdm = { target: TDM_OPT.target, diff: TDM_OPT.diff, score: [0, 0], timeLeft: TDM_OPT.time, roster: [], over: false, endT: 0 };
  T.me = { name: ACC.id || 'あなた', idx: ECO.eq.avatar, team: 0, isPlayer: true, kills: 0, deaths: 0, respT: 0, ent: null }; T.roster.push(T.me);
  for (i = 0; i < 7; i++) T.roster.push({ name: FRIEND_NAMES[ids[i]], idx: ids[i], team: i < 3 ? 0 : 1, isPlayer: false, kills: 0, deaths: 0, respT: 0, ent: null });
  tdmPlacePlayer();
  T.roster.forEach(function (r) { if (!r.isPlayer) tdmSpawnBot(r); });
  G.phase = 'fight'; banner('チーム戦 4 vs 4', '先に ' + T.target + ' キルしたチームの勝ち　あなたはブルーチーム', 3.2); SFX.alarm();
}
function tdmSpawnBot(r) { var p = tdmSpawnPos(r.team); r.ent = spawnFriend(r.idx, 2, false, { team: r.team, x: p[0], z: p[1], diff: G.tdm.diff, roster: r, name: r.name }); r.respT = 0; }
function tdmPlacePlayer() {
  var p = tdmSpawnPos(0); P.x = p[0]; P.z = p[1]; P.yaw = 0; P.pitch = 0; P.vx = P.vz = 0; P.hp = 100; P.deadT = 0; P.respawnT = 0; P.inv = 1.8; P.hurtT = 99; P.nades = 2;
  gun.slots.forEach(function (id) { gun.ammo[id] = WDEF[id].mag; }); gun.reloadT = 0; hudCache.am = null; H.death.style.display = 'none';
}
function tdmPlayerDied() { G.streak = 0; P.respawnT = 3.6; var k = P.lastKiller; H.deathBy.textContent = k ? k.name + ' の ' + k.label + ' に倒された' : '倒された'; H.deathBy.style.color = k ? TEAM_CSS[k.team] : '#fff'; H.death.style.display = 'block'; }
function tdmUpdate(dt) {
  var T = G.tdm; if (!T) return;
  if (T.over) { T.endT -= dt; if (T.endT <= 0) tdmFinish(); return; }
  T.timeLeft -= dt;
  for (var i = 0; i < T.roster.length; i++) { var r = T.roster[i]; if (r.isPlayer || r.respT <= 0) continue; r.respT -= dt; if (r.respT <= 0 && (!r.ent || r.ent.gone || r.ent.dead)) tdmSpawnBot(r); }
  if (P.respawnT > 0) { P.respawnT -= dt; setTxt('resp', H.deathT, '復活まで ' + Math.max(1, Math.ceil(P.respawnT))); if (P.respawnT <= 0) { tdmPlacePlayer(); SFX.ui(); } }
  if (T.score[0] >= T.target || T.score[1] >= T.target || T.timeLeft <= 0) {
    T.over = true; T.endT = 2.2; T.timeLeft = Math.max(0, T.timeLeft); T.win = T.score[0] === T.score[1] ? -1 : (T.score[0] > T.score[1] ? 0 : 1);
    banner(T.win === 0 ? '勝利！' : T.win === 1 ? '敗北…' : '引き分け', TEAM_NAME[0] + ' ' + T.score[0] + ' － ' + T.score[1] + ' ' + TEAM_NAME[1], 2.4); if (T.win === 0) SFX.win(); else SFX.lose();
  }
}
function tdmFinish() {
  var T = G.tdm, acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0, win = T.win === 0;
  G.state = 'result'; leavePlay();
  H.rTitle.innerHTML = win ? '<span>VICTORY</span>' : T.win === 1 ? 'DEFEAT' : 'DRAW';
  H.rSub.textContent = TEAM_NAME[0] + ' ' + T.score[0] + ' － ' + T.score[1] + ' ' + TEAM_NAME[1];
  H.rScore.textContent = ''; H.rStat.innerHTML = ''; H.rNote.textContent = '';
  var sorted = T.roster.slice().sort(function (a, b) { return a.team - b.team || b.kills - a.kills; }), mvp = T.roster.slice().sort(function (a, b) { return b.kills - a.kills || a.deaths - b.deaths; })[0];
  H.rBoard.innerHTML = '';
  var head = el('div', 'fr-brow hd', H.rBoard); el('span', null, head, 'MVP： ' + mvp.name + '（' + mvp.kills + ' キル）'); el('b', null, head, 'キル'); el('b', null, head, 'デス');
  sorted.forEach(function (r) { var row = el('div', 'fr-brow' + (r.isPlayer ? ' me' : ''), H.rBoard), n = el('span', null, row, (r === mvp ? '★ ' : '') + r.name + (r.isPlayer ? '（あなた）' : '')); n.style.color = TEAM_CSS[r.team]; el('b', null, row, String(r.kills)); el('b', null, row, String(r.deaths)); });
  G.last = { mode: 'tdm', score: G.score, wave: 0, kills: T.me.kills, heads: G.stats.heads, streak: G.stats.maxStreak, acc: acc, time: Math.round(G.time), win: win, draw: T.win === -1 };
  H.rAgain.textContent = 'もういちど';
  stageShow({ avatar: mvp.idx, hat: mvp.isPlayer ? ECO.eq.hat : null, team: mvp.team }); H.result.classList.add('stage');
  ecoMatchEnd(G.last);
  showScreen('result');
}

// ---- pickups (health / ammo) ---------------------------------------------------------
var PICKS = [];
function buildPickups() {
  var want = [['h', -10, 0], ['a', 0, -8], ['h', 13, -3], ['a', -20, -13], ['a', 20, 12], ['h', 0, 15]];
  var g = new THREE.BoxGeometry(0.42, 0.3, 0.3), hm = stdMat({ color: 0xf2f2f2, roughness: 0.5, emissive: 0x143a14 }), am = stdMat({ color: 0x4a5a32, roughness: 0.6, emissive: 0x2a2408 });
  var cg = new THREE.BoxGeometry(0.26, 0.08, 0.31), cm = new THREE.MeshBasicMaterial({ color: 0x2ecc55 }), bm = new THREE.MeshBasicMaterial({ color: 0xffc23a });
  want.forEach(function (w) {
    var x = w[1], z = w[2], ok = false;
    for (var r = 0; r < 6 && !ok; r++) for (var a = 0; a < 8 && !ok; a++) { var tx = w[1] + Math.cos(a * 0.785) * r, tz = w[2] + Math.sin(a * 0.785) * r; if (!NAV.blocked[navCell(tx, tz)]) { x = Math.floor(tx) + 0.5; z = Math.floor(tz) + 0.5; ok = true; } }
    var grp = new THREE.Group(), box = new THREE.Mesh(g, w[0] === 'h' ? hm : am); box.castShadow = true; grp.add(box);
    if (w[0] === 'h') { var c1 = new THREE.Mesh(cg, cm); grp.add(c1); var c2 = new THREE.Mesh(cg, cm); c2.rotation.z = Math.PI / 2; c2.scale.set(1, 1, 1.001); grp.add(c2); }
    else { var s1 = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.06, 0.31), bm); grp.add(s1); }
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.soft, color: w[0] === 'h' ? 0x4dff7a : 0xffc23a, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(1.3); grp.add(gl);
    grp.position.set(x, 0.6, z); scene.add(grp); PICKS.push({ g: grp, type: w[0], x: x, z: z, t: 0, ph: Math.random() * 6 });
  });
}
function resetPickups() { PICKS.forEach(function (p) { p.t = 0; p.g.visible = true; }); }
function updatePickups(dt) {
  for (var i = 0; i < PICKS.length; i++) {
    var p = PICKS[i];
    if (p.t > 0) { p.t -= dt; if (p.t <= 0) p.g.visible = true; continue; }
    p.ph += dt; p.g.rotation.y = p.ph * 1.6; p.g.position.y = 0.6 + Math.sin(p.ph * 2.2) * 0.08;
    if (P.hp > 0 && Math.abs(P.x - p.x) < 1.1 && Math.abs(P.z - p.z) < 1.1) {
      if (p.type === 'h') { if (P.hp >= 100) continue; P.hp = Math.min(100, P.hp + 50); feed('回復キット +50'); }
      else { var need = P.nades < 2; gun.slots.forEach(function (id) { if (gun.ammo[id] < WDEF[id].mag) need = true; gun.ammo[id] = WDEF[id].mag; }); if (!need) continue; P.nades = 2; gun.reloadT = 0; hudCache.am = null; feed('弾薬とグレネードを補充'); }
      p.t = 22; p.g.visible = false; SFX.pickup();
    }
  }
}

// ---- radar ------------------------------------------------------------------------------
var radarT = 0;
function updateRadar(dt) {
  radarT -= dt; if (radarT > 0) return; radarT = 0.1;
  var c = H.radarCtx, S = 96, h = S / 2, k = h / 34, sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  c.clearRect(0, 0, S, S); c.fillStyle = 'rgba(8,14,20,.55)'; c.beginPath(); c.arc(h, h, h - 1, 0, 6.3); c.fill(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(h, h, h * 0.5, 0, 6.3); c.stroke();
  function dot(x, z, col, r) { var dx = x - P.x, dz = z - P.z, rx = dx * cy - dz * sy, fw = -dx * sy - dz * cy, px = rx * k, py = -fw * k, l = Math.hypot(px, py), m = h - 5; if (l > m) { px *= m / l; py *= m / l; } c.fillStyle = col; c.beginPath(); c.arc(h + px, h + py, r, 0, 6.3); c.fill(); }
  for (var i = 0; i < PICKS.length; i++) if (PICKS[i].t <= 0) dot(PICKS[i].x, PICKS[i].z, PICKS[i].type === 'h' ? 'rgba(90,255,130,.7)' : 'rgba(255,200,70,.7)', 1.8);
  for (i = 0; i < ENEMIES.length; i++) { var e = ENEMIES[i]; if (e.dead) continue; dot(e.x, e.z, e.team === P.team ? '#6ab6ff' : '#ff5a4a', 3); }
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(h, h - 5); c.lineTo(h + 4, h + 4); c.lineTo(h - 4, h + 4); c.closePath(); c.fill();
}


// ===== 13_economy.js =====
// ---- coins, shop, cosmetics, levels. Logged in: everything is computed and stored on the server.
//      Guest: the same rules run locally and are kept in this device's storage only.
var HATS = { h_none: { name: 'なし', price: 0 }, h_cap: { name: 'キャップ', price: 200 }, h_party: { name: 'パーティーぼうし', price: 300 }, h_helmet: { name: 'ヘルメット', price: 400 }, h_tophat: { name: 'シルクハット', price: 600 }, h_crown: { name: '王冠', price: 1500 } };
var TITLES = [[1, 'ルーキー'], [3, 'ソルジャー'], [6, 'ベテラン'], [10, 'エース'], [15, 'エリート'], [20, 'マスター'], [30, 'レジェンド']];
var ECO = { coins: 0, xp: 0, owned: {}, eq: { skin: 's_default', hat: 'h_none', tracer: 't_default', cross: 'c_default', avatar: 0 }, loadout: ['ar', 'pistol', 'shotgun', 'sniper'], wins: 0, losses: 0, daily: false, match: null, loaded: false };
var FREE_WEAPONS = ['ar', 'pistol', 'shotgun', 'sniper'];
function levelOf(xp) { return Math.floor(Math.sqrt(Math.max(0, xp) / 150)) + 1; }
function titleOf(lv) { var t = TITLES[0][1]; TITLES.forEach(function (x) { if (lv >= x[0]) t = x[1]; }); return t; }
function itemInfo(id) {
  if (id.indexOf('w_') === 0) { var w = WDEF[id.slice(2)]; return w ? { kind: 'weapon', name: w.name, price: w.price, info: w.info } : null; }
  var m = id.charAt(0) === 's' ? SKINS : id.charAt(0) === 'h' ? HATS : id.charAt(0) === 't' ? TRACERS : id.charAt(0) === 'c' ? CROSSES : null;
  return m && m[id] ? { kind: { s: 'skin', h: 'hat', t: 'tracer', c: 'cross' }[id.charAt(0)], name: m[id].name, price: m[id].price } : null;
}
function owns(id) { var it = itemInfo(id); return !!it && (it.price === 0 || !!ECO.owned[id]); }
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// ---- local (guest) backend: mirrors the server rules --------------------------------
function rewardFor(r) {
  var kills = Math.min(60, Math.max(0, r.kills | 0)) * 10, st = r.streak >= 10 ? 150 : r.streak >= 7 ? 80 : r.streak >= 5 ? 50 : r.streak >= 3 ? 25 : r.streak >= 2 ? 10 : 0;
  var fin = r.mode === 'tdm' ? (r.win ? 150 : r.draw ? 90 : 60) : Math.max(0, (r.win ? 8 : r.wave - 1)) * 25 + (r.win ? 200 : 0);
  return { kills: kills, streak: st, finish: fin, coins: Math.min(1200, kills + st + fin), xp: Math.min(60, r.kills | 0) * 10 + (r.win ? 100 : 40) };
}
function today() { var d = new Date(Date.now() + 9 * 3600000); return d.toISOString().slice(0, 10); }      // Japan date
function guestLoad() { return store.get('eco', { coins: 0, xp: 0, owned: [], eq: {}, loadout: null, wins: 0, losses: 0, lastDaily: '' }); }
function guestProfile(g) { return { ok: true, coins: g.coins, xp: g.xp, owned: g.owned, equipped: g.eq, loadout: g.loadout, wins: g.wins, losses: g.losses, daily: g.lastDaily !== today() }; }
function guestCall(name, a) {
  var g = guestLoad(), it, r;
  if (name === 'fr_profile') return guestProfile(g);
  if (name === 'fr_claim_daily') { if (g.lastDaily === today()) return { ok: false, error: 'ALREADY' }; g.lastDaily = today(); g.coins += 100; store.set('eco', g); r = guestProfile(g); r.gained = 100; return r; }
  if (name === 'fr_buy') { it = itemInfo(a.p_item); if (!it || it.price <= 0) return { ok: false, error: 'BAD_ITEM' }; if (g.owned.indexOf(a.p_item) >= 0) return { ok: false, error: 'OWNED' }; if (g.coins < it.price) return { ok: false, error: 'NO_COINS' }; g.coins -= it.price; g.owned.push(a.p_item); store.set('eco', g); return guestProfile(g); }
  if (name === 'fr_equip') { if (a.p_slot === 'avatar') { g.eq.avatar = clamp(a.p_item | 0, 0, 7); } else { it = itemInfo(a.p_item); if (!it || it.kind !== a.p_slot || (it.price > 0 && g.owned.indexOf(a.p_item) < 0)) return { ok: false, error: 'NOT_OWNED' }; g.eq[a.p_slot] = a.p_item; } store.set('eco', g); return guestProfile(g); }
  if (name === 'fr_set_loadout') { var l = a.p_weapons; if (!l.length || l.length > 4 || l.some(function (w, i) { return !WDEF[w] || l.indexOf(w) !== i || (WDEF[w].price > 0 && g.owned.indexOf('w_' + w) < 0); })) return { ok: false, error: 'BAD_LOADOUT' }; g.loadout = l; store.set('eco', g); return guestProfile(g); }
  if (name === 'fr_match_start') return { ok: true, match: 'local' };
  if (name === 'fr_match_end') { var rw = rewardFor({ mode: a.p_mode, kills: a.p_kills, streak: a.p_streak, win: a.p_win, draw: a.p_draw, wave: a.p_wave }); g.coins += rw.coins; g.xp += rw.xp; if (a.p_mode === 'tdm' && !a.p_draw) { if (a.p_win) g.wins++; else g.losses++; } store.set('eco', g); r = guestProfile(g); r.reward = rw; return r; }
  return { ok: false, error: 'UNKNOWN' };
}
function ecoCall(name, args, cb) {
  if (ACC.token && apiReady()) { args = args || {}; args.p_token = ACC.token; return rpc(name, args, cb); }
  var r = guestCall(name, args || {}); setTimeout(function () { cb(r); }, 0);
}
function ecoApply(r) {
  if (!r || !r.ok) return;
  ECO.coins = r.coins | 0; ECO.xp = r.xp | 0; ECO.wins = r.wins | 0; ECO.losses = r.losses | 0; ECO.daily = !!r.daily; ECO.owned = {}; (r.owned || []).forEach(function (id) { ECO.owned[id] = true; });
  var e = r.equipped || {}; ECO.eq.skin = owns(e.skin || '') && SKINS[e.skin] ? e.skin : 's_default'; ECO.eq.hat = owns(e.hat || '') && HATS[e.hat] ? e.hat : 'h_none'; ECO.eq.tracer = owns(e.tracer || '') && TRACERS[e.tracer] ? e.tracer : 't_default'; ECO.eq.cross = owns(e.cross || '') && CROSSES[e.cross] ? e.cross : 'c_default'; ECO.eq.avatar = clamp(e.avatar | 0, 0, 7);
  var l = (r.loadout || []).filter(function (w) { return WDEF[w] && owns('w_' + w); }); ECO.loadout = l.length ? l.slice(0, 4) : FREE_WEAPONS.slice();
  ECO.loaded = true; applyCosmetics(); refreshProfileUI(); if (H.shop && H.shop.classList.contains('on')) renderShop();
}
function applyCosmetics() {
  if (gun.skinMat) setSkinMat(gun.skinMat, ECO.eq.skin);
  gun.tracerColor = TRACERS[ECO.eq.tracer].color; ROOT.style.setProperty('--frx', CROSSES[ECO.eq.cross].css);
  refreshAvatar();
}
function ecoRefresh() { ecoCall('fr_profile', {}, function (r) { if (r.ok) ecoApply(r); else if (r.error === 'NOT_LOGGED_IN') { clearSession(); ecoRefresh(); } }); }
function ecoDaily() { ecoCall('fr_claim_daily', {}, function (r) { if (r.ok) { ecoApply(r); SFX.coin(); H.accMsg.textContent = 'ログインボーナス +' + (r.gained || 100) + ' コイン！'; } else { ECO.daily = false; refreshProfileUI(); } }); }
function ecoMatchStart(mode) { ECO.match = null; ecoCall('fr_match_start', { p_mode: mode }, function (r) { if (r.ok) ECO.match = r.match; }); }
function ecoMatchEnd(last) {
  H.rCoins.textContent = '報酬を計算中…'; H.rSave.textContent = '';
  var args = { p_match: ECO.match || 'local', p_mode: last.mode, p_kills: last.kills, p_heads: last.heads, p_streak: last.streak, p_win: !!last.win, p_draw: !!last.draw, p_wave: last.wave, p_score: last.score, p_acc: last.acc, p_time: last.time };
  if (ACC.token && !ECO.match) { H.rCoins.textContent = '報酬を受け取れませんでした（試合開始時にサーバーへ接続できませんでした）'; return; }
  ecoCall('fr_match_end', args, function (r) {
    if (!r.ok) { H.rCoins.textContent = '報酬を受け取れませんでした： ' + ecoErr(r); if (r.error === 'NOT_LOGGED_IN') clearSession(); return; }
    var before = levelOf(ECO.xp), rw = r.reward || {}; ecoApply(r); var lv = levelOf(ECO.xp);
    H.rCoins.innerHTML = 'コイン <em>+' + fmt(rw.coins | 0) + '</em>（キル ' + (rw.kills | 0) + '・連続キル ' + (rw.streak | 0) + '・試合 ' + (rw.finish | 0) + '）　所持 ' + fmt(ECO.coins) + (lv > before ? '<br><em>レベルアップ！ Lv ' + lv + ' ' + titleOf(lv) + '</em>' : '');
    if (rw.coins) SFX.coin();
    if (ACC.token) H.rSave.textContent = 'サーバーに保存しました（' + ACC.id + '）' + (last.mode === 'survival' && r.best != null ? '　自己ベスト ' + r.best + '　／　ランキング ' + r.rank + ' 位' : last.mode === 'tdm' ? '　チーム戦 ' + ECO.wins + ' 勝 ' + ECO.losses + ' 敗' : '');
    else H.rSave.textContent = 'ゲストの記録とコインはこの端末だけに保存されます';
  });
}
function ecoErr(r) { return { NO_COINS: 'コインが足りません', OWNED: 'すでに持っています', NOT_OWNED: 'まだ持っていません', BAD_LOADOUT: '持っていく武器は1〜4個にしてください', TOO_FAST: '試合が短すぎます', BAD_MATCH: 'この試合はすでに記録ずみです', BAD_RESULT: '結果を確認できませんでした', ALREADY: '今日はもう受け取りました' }[r.error] || errText(r); }
function refreshProfileUI() {
  if (!H.prof) return;
  var lv = levelOf(ECO.xp);
  H.prof.innerHTML = 'Lv ' + lv + ' ' + titleOf(lv) + '　｜　コイン <em>' + fmt(ECO.coins) + '</em>' + (ECO.wins + ECO.losses ? '　｜　チーム戦 ' + ECO.wins + ' 勝 ' + ECO.losses + ' 敗' : '');
  H.dailyBtn.style.display = ECO.daily ? 'block' : 'none'; H.dailyBtn.textContent = '今日のログインボーナスを受け取る（+100 コイン）';
  if (H.shopCoins) H.shopCoins.textContent = 'コイン ' + fmt(ECO.coins);
}

// ---- hats (procedural). Built for a character of height 1 with the head centre at y = 0.79
function makeHat(id) {
  var g = new THREE.Group(), m; g.position.y = 0.79;
  function add(geo, mat, x, y, z) { var o = new THREE.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; g.add(o); return o; }
  if (id === 'h_cap') { m = stdMat({ color: 0xc8322a, roughness: 0.8 }); add(new THREE.SphereGeometry(0.225, 16, 8, 0, 6.3, 0, 1.5), m, 0, 0.03, 0); add(new THREE.BoxGeometry(0.26, 0.02, 0.17), m, 0, 0.06, 0.25); }
  else if (id === 'h_helmet') { m = stdMat({ color: 0x4b5a35, roughness: 0.55, metalness: 0.4 }); add(new THREE.SphereGeometry(0.245, 16, 8, 0, 6.3, 0, 1.62), m, 0, 0.02, 0); add(new THREE.TorusGeometry(0.245, 0.016, 6, 20), m, 0, 0.02, 0).rotation.x = Math.PI / 2; }
  else if (id === 'h_party') { m = stdMat({ color: 0xff5fa8, roughness: 0.6 }); add(new THREE.ConeGeometry(0.11, 0.3, 14), m, 0, 0.33, 0); add(new THREE.SphereGeometry(0.035, 8, 6), stdMat({ color: 0xffe14a, roughness: 0.6 }), 0, 0.49, 0); }
  else if (id === 'h_tophat') { m = stdMat({ color: 0x101012, roughness: 0.45 }); add(new THREE.CylinderGeometry(0.24, 0.24, 0.016, 20), m, 0, 0.19, 0); add(new THREE.CylinderGeometry(0.15, 0.14, 0.24, 20), m, 0, 0.31, 0); add(new THREE.CylinderGeometry(0.145, 0.145, 0.04, 20), stdMat({ color: 0xa01c1c, roughness: 0.6 }), 0, 0.22, 0); }
  else if (id === 'h_crown') { m = stdMat({ color: 0xe6b422, roughness: 0.25, metalness: 1 }); add(new THREE.CylinderGeometry(0.16, 0.15, 0.09, 18, 1, true), m, 0, 0.24, 0).material.side = THREE.DoubleSide; for (var i = 0; i < 6; i++) { var a = i / 6 * 6.283; add(new THREE.ConeGeometry(0.035, 0.09, 6), m, Math.cos(a) * 0.15, 0.33, Math.sin(a) * 0.15); } add(new THREE.SphereGeometry(0.03, 8, 6), stdMat({ color: 0xd0202a, roughness: 0.2 }), 0, 0.25, 0.155); }
  return g;
}
function avatarFigure(idx, hat, team) {       // character of real size with an optional hat
  var g = new THREE.Group(), mat = null;
  if (team != null && MODELS[idx]) { mat = MODELS[idx].material.clone(); mat.color.set(team === 0 ? 0xa8ccff : 0xffaaa0); }
  g.add(makeFriendMesh(idx, mat)); if (hat && hat !== 'h_none') { var h = makeHat(hat); h.scale.setScalar(FRIEND_H); h.position.y *= FRIEND_H; g.add(h); }
  return g;
}
function refreshAvatar() {       // the player's character stands in the middle of the title line-up wearing the equipped hat
  if (!LINEUP.length) return;
  LINEUP.forEach(function (g, i) { for (var k = g.children.length - 1; k >= 0; k--) if (g.children[k].userData.hat) g.remove(g.children[k]); g.scale.setScalar(i === ECO.eq.avatar ? 1.12 : 1); });
  if (ECO.eq.hat !== 'h_none') { var h = makeHat(ECO.eq.hat); h.scale.setScalar(FRIEND_H); h.position.y *= FRIEND_H; h.userData.hat = true; LINEUP[ECO.eq.avatar].add(h); }
}

// ---- preview stage (shop preview and MVP display): a small turntable far from the arena
var STAGE = { on: false, root: null, kind: '', t: 0 };
function buildStage() {
  STAGE.root = new THREE.Group(); STAGE.root.position.set(0, 0, 210); scene.add(STAGE.root);
  var floor = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.12, 32), stdMat({ color: 0x1c1f24, roughness: 0.35, metalness: 0.6 })); floor.position.set(0, -0.06, 210); scene.add(floor); STAGE.floor = floor; floor.visible = false;
  STAGE.light = new THREE.PointLight(0xfff4e0, 0, 16, 1.5); STAGE.light.position.set(1.2, 2.4, 213.2); scene.add(STAGE.light);
}
function stageShow(o) {
  while (STAGE.root.children.length) STAGE.root.remove(STAGE.root.children[0]);
  STAGE.on = !!o; STAGE.floor.visible = STAGE.on; STAGE.light.intensity = STAGE.on ? 2.6 : 0; if (H.pvCross) H.pvCross.style.display = 'none';
  if (!o) return;
  STAGE.root.rotation.y = 0.5; STAGE.kind = o.gun ? 'gun' : 'avatar';
  if (o.gun) {
    var sm = makeSkinMat(o.skin || ECO.eq.skin), gm = buildGunModel(o.gun, sm, false); gm.g.scale.setScalar(1.9); gm.g.position.set(0, 1.15, 0.25); gm.g.rotation.y = Math.PI / 2; STAGE.root.add(gm.g);
    if (o.tracer) { var tb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.7), new THREE.MeshBasicMaterial({ color: TRACERS[o.tracer].color, blending: THREE.AdditiveBlending, transparent: true })); tb.rotation.y = Math.PI / 2; tb.position.set(0.2, 0.75, 0); STAGE.root.add(tb); }
  } else STAGE.root.add(avatarFigure(o.avatar, o.hat, o.team));
  if (o.cross && H.pvCross) { H.pvCross.style.display = 'block'; H.pvCross.style.setProperty('--frx', CROSSES[o.cross].css); }
}
function stageCamera(dt) {
  if (!STAGE.on) return false;
  STAGE.root.rotation.y += dt * 0.7;
  var res = G.state === 'result', gunK = STAGE.kind === 'gun', land = camera.aspect >= 1, d = land ? (gunK ? 3.1 : 3.5) : (gunK ? 3.6 : 3.3), cx = land ? (gunK ? 1.5 : 1.7) * (camera.aspect > 1.7 ? 1 : 0.7) : 0;
  camera.position.set(cx, 1.4, 210 + d); camera.rotation.set(0, 0, 0);
  camera.lookAt(cx, land ? (gunK ? 1.1 : 0.9) : (gunK ? -0.7 : res ? -1.7 : -1.3), 210);
  return true;
}

// ---- shop & loadout screen ---------------------------------------------------------------
var SHOP = { tab: 'weapon', sel: null, confirm: null };
var SHOP_TABS = [['weapon', '武器'], ['skin', 'スキン'], ['hat', 'ぼうし'], ['tracer', '弾の色'], ['cross', '照準'], ['avatar', 'キャラ']];
function buildShopUI() {
  var s = H.shop = el('div', 'fr-screen fr-shop', UI);
  var hd = el('div', 'fr-shophd', s); H.shopCoins = el('span', null, hd, ''); var back = el('span', null, hd, '✕ とじる'); back.style.cursor = 'pointer'; onTap(back, function () { SFX.ui(); stageShow(null); showScreen('title'); });
  H.pvName = el('div', 'fr-pvname', s, '');
  H.pvCross = el('div', 'fr-cross fr-pvcross', s); [[-16, -1, 9, 2], [7, -1, 9, 2], [-1, -16, 2, 9], [-1, 7, 2, 9], [-1.5, -1.5, 3, 3]].forEach(function (r) { var b = el('b', null, H.pvCross); b.style.cssText = 'left:' + r[0] + 'px;top:' + r[1] + 'px;width:' + r[2] + 'px;height:' + r[3] + 'px'; });
  H.shopTabs = el('div', 'fr-tabs', s); H.shopTabEls = {};
  SHOP_TABS.forEach(function (t) { var sp = el('span', null, H.shopTabs, t[1]); H.shopTabEls[t[0]] = sp; onTap(sp, function () { SFX.ui(); SHOP.tab = t[0]; SHOP.sel = null; SHOP.confirm = null; renderShop(); }); });
  H.shopList = el('div', 'fr-list fr-scroll', s);
  H.shopMsg = el('p', 'fr-note', s, '');
  SCREENS.push('shop');
}
function openShop() { SHOP.sel = null; SHOP.confirm = null; showScreen('shop'); renderShop(); ecoRefresh(); }
function shopItems(tab) {
  if (tab === 'weapon') return WORDER.map(function (w) { return 'w_' + w; });
  if (tab === 'avatar') return [0, 1, 2, 3, 4, 5, 6, 7];
  return Object.keys({ skin: SKINS, hat: HATS, tracer: TRACERS, cross: CROSSES }[tab]);
}
function shopPreview(id) {
  var t = SHOP.tab, it = t === 'avatar' ? { name: FRIEND_NAMES[id] } : itemInfo(id);
  H.pvName.textContent = it.name + (it.info ? '　' + it.info : '');
  if (t === 'weapon') stageShow({ gun: id.slice(2) }); else if (t === 'skin') stageShow({ gun: curPreviewGun(), skin: id }); else if (t === 'tracer') stageShow({ gun: curPreviewGun(), tracer: id });
  else if (t === 'hat') stageShow({ avatar: ECO.eq.avatar, hat: id }); else if (t === 'cross') stageShow({ gun: curPreviewGun(), cross: id }); else stageShow({ avatar: id, hat: ECO.eq.hat });
}
function curPreviewGun() { return ECO.loadout[0] || 'ar'; }
function renderShop() {
  var t = SHOP.tab, list = shopItems(t); refreshProfileUI();
  SHOP_TABS.forEach(function (x) { H.shopTabEls[x[0]].classList.toggle('on', x[0] === t); });
  if (SHOP.sel == null) SHOP.sel = t === 'weapon' ? 'w_' + curPreviewGun() : t === 'avatar' ? ECO.eq.avatar : ECO.eq[t];
  var keep = H.shopList.scrollTop; H.shopList.innerHTML = '';
  H.shopMsg.textContent = (t === 'weapon' ? '持っていける武器は4つまで（' + ECO.loadout.length + ' / 4）。' : t === 'hat' || t === 'avatar' ? 'キャラとぼうしは、タイトル画面・結果画面の MVP 表示で見られます。' : '') + (ACC.token ? '' : '　ゲストのコインと持ち物はこの端末だけに保存されます。端末を変えたりデータを消したりすると無くなります。');
  list.forEach(function (id) {
    var it = t === 'avatar' ? { name: FRIEND_NAMES[id], price: 0 } : itemInfo(id), has = t === 'avatar' || owns(id), row = el('div', 'fr-item' + (SHOP.sel === id ? ' sel' : ''), H.shopList), d = el('div', null, row, it.name);
    var sub = t === 'weapon' ? it.info + '　弾 ' + WDEF[id.slice(2)].mag : (it.price > 0 ? fmt(it.price) + ' コイン' : '無料'); el('small', null, d, sub + (t === 'weapon' && it.price > 0 && !has ? '　／　' + fmt(it.price) + ' コイン' : ''));
    var b = el('button', null, row), on;
    if (!has) { b.className = 'buy' + (ECO.coins < it.price ? ' no' : ''); b.textContent = SHOP.confirm === id ? 'もう一度押す' : '購入 ' + fmt(it.price); }
    else if (t === 'weapon') { on = ECO.loadout.indexOf(id.slice(2)) >= 0; b.className = on ? 'eq' : ''; b.textContent = on ? '持っていく ✓' : '持っていく'; }
    else { on = t === 'avatar' ? ECO.eq.avatar === id : ECO.eq[t] === id; b.className = on ? 'eq' : ''; b.textContent = on ? '装備中' : '装備する'; }
    onTap(row, function () { SHOP.sel = id; if (SHOP.confirm !== id) SHOP.confirm = null; shopPreview(id); renderShop(); });
    onTap(b, function (ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); SHOP.sel = id; shopPreview(id); shopAction(id, has); });
  });
  H.shopList.scrollTop = keep;
  if (!STAGE.on || SHOP.fresh !== t) { SHOP.fresh = t; shopPreview(SHOP.sel); }
}
function shopAction(id, has) {
  var t = SHOP.tab;
  function done(r) { if (r.ok) { ecoApply(r); SFX.coin(); } else { H.shopMsg.textContent = ecoErr(r); SFX.empty(); } SHOP.confirm = null; renderShop(); if (!r.ok) H.shopMsg.textContent = ecoErr(r); }
  if (!has) {
    if (ECO.coins < itemInfo(id).price) { renderShop(); H.shopMsg.textContent = 'コインが足りません（あと ' + fmt(itemInfo(id).price - ECO.coins) + '）'; SFX.empty(); return; }
    if (SHOP.confirm !== id) { SHOP.confirm = id; renderShop(); return; }
    return ecoCall('fr_buy', { p_item: id }, done);
  }
  if (t === 'weapon') {
    var w = id.slice(2), l = ECO.loadout.slice(), i = l.indexOf(w);
    if (i >= 0) { if (l.length <= 1) { renderShop(); H.shopMsg.textContent = '武器は最低1つ必要です'; return; } l.splice(i, 1); } else { if (l.length >= 4) { renderShop(); H.shopMsg.textContent = '持っていけるのは4つまでです。先にどれかを外してください'; SFX.empty(); return; } l.push(w); }
    return ecoCall('fr_set_loadout', { p_weapons: l }, done);
  }
  ecoCall('fr_equip', { p_slot: t, p_item: String(id) }, done);
}


// ===== 99_main.js =====
// ---- boot -------------------------------------------------------------------
function boot() {
  setupPage();
  var loading = el('div', 'fr-load', UI, 'LOADING…');
  (window.THREE && window.THREE.WebGLRenderer ? function (u, cb) { cb(null); } : loadScript)(THREE_URL, function (err) {
    if (err || !window.THREE) { showFatal('three.js を読み込めませんでした', '3D ライブラリ（cdnjs）への接続が止められている可能性があります。\n' + THREE_URL); return; }
    THREE = window.THREE;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, powerPreference: 'high-performance', alpha: false });
    } catch (e) { showFatal('WebGL を開始できませんでした', 'この端末またはアプリでは 3D 表示が使えません。\n' + e.message); return; }
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = IS_MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    CANVAS_HOST.appendChild(renderer.domElement);
    Q.tier = Q.mode === 'auto' ? initialTier() : Q.mode;
    setTimeout(function () {            // let the "LOADING" text paint first
      buildTextures(renderer, Q.tier === 0);
      buildWorld(); buildWeapon(); buildEnemyAssets(); buildFriends(); buildPickups(); buildStage(); buildUI(); buildShopUI(); buildAccountUI(); setupInput();
      gun.root.visible = false;
      window.addEventListener('resize', onResize); window.addEventListener('orientationchange', function () { setTimeout(onResize, 300); });
      document.addEventListener('visibilitychange', function () { if (document.hidden && G.state === 'playing') pauseGame(); });
      onResize();
      ['touchend', 'mousedown', 'keydown'].forEach(function (n) { window.addEventListener(n, audioInit, { passive: true }); });
      if (loading.parentNode) loading.parentNode.removeChild(loading);
      G.state = 'title'; showScreen('title');
      var mi = setInterval(function () {
        var s = MODEL_STATUS; if (s.boys === 'loading' || s.girls === 'loading') { H.modelNote.textContent = '仲間のモデルを読み込み中…'; return; }
        H.modelNote.textContent = (s.boys === 'ok' && s.girls === 'ok') ? '' : '※ 仲間の3Dモデルを読み込めなかったため、かんたんな人形で表示しています'; clearInterval(mi);
      }, 400);
      window.__frReady = true;
      window.__fr = { G: G, P: P, Q: Q, ENEMIES: ENEMIES, MODELS: MODELS, ACC: ACC, MODEL_STATUS: MODEL_STATUS, input: input, gun: gun, errors: RUNTIME_ERRORS, start: startGame, info: function () { return { tris: renderer.info.render.triangles, calls: renderer.info.render.calls }; }, catalog: function () { var o = {}; WORDER.forEach(function (w) { o['w_' + w] = ['weapon', WDEF[w].price]; }); [[SKINS, 'skin'], [HATS, 'hat'], [TRACERS, 'tracer'], [CROSSES, 'cross']].forEach(function (m) { Object.keys(m[0]).forEach(function (k) { o[k] = [m[1], m[0][k].price]; }); }); return o; }, startTdm: startTeamBattle, ECO: ECO, TDM_OPT: TDM_OPT, STAGE: STAGE, shop: SHOP, WDEF: WDEF, PICKS: PICKS, killAll: function () { G.queue.length = 0; ENEMIES.slice().forEach(function (e) { if (!e.dead && e.team !== P.team) damageActor(e, 9999, P, 'テスト', false, e.x, 1, e.z); }); }, spawnFriend: spawnFriend, hurt: hurtPlayer, end: endGame };
      requestAnimationFrame(frame);
    }, 30);
  });
}
if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);


})();
