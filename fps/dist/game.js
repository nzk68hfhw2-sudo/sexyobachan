/*! FRIENDS RESCUE — game.js (single-file build). See source.txt */
(function(){
"use strict";

// ===== 00_boot.js =====
// ---------------------------------------------------------------------------
// FRIENDS RESCUE — browser FPS (three.js r128). Everything is created by this
// one file: DOM, CSS, canvas, textures, sounds. Loaded with <script src>.
// BASE_URL is only a fallback: the folder of game.js is detected automatically.
// ---------------------------------------------------------------------------
if (window.__frLoaded) { return; }
window.__frLoaded = true;

var BASE_URL = 'https://gentle-panda-8e3c08.netlify.app/';
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '1.0.0';
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
var SFX = {
  shot: function () { if (!AU.ok) return; var t = AU.ctx.currentTime;
    auNoise(t, 0.03, 9000, 3000, 0.9, 'highpass');
    auNoise(t, 0.16, 3800, 300, 0.95, 'lowpass');
    auTone(t, 0.11, 170, 48, 0.9, 'sine');
    auNoise(t + 0.05, 0.55, 1400, 180, 0.16, 'lowpass');
    auNoise(t + 0.19, 0.5, 700, 120, 0.07, 'lowpass'); },
  empty: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.03, 4000, 2000, 0.3, 'bandpass', 0, 4); auTone(t, 0.04, 1400, 900, 0.08, 'square'); },
  click: function (dt, f, v) { if (!AU.ok) return; var t = AU.ctx.currentTime + (dt || 0); auNoise(t, 0.045, f || 3000, 900, v || 0.35, 'bandpass', 0, 3); auTone(t, 0.06, (f || 3000) * 0.4, (f || 3000) * 0.3, 0.07, 'triangle'); },
  reload: function () { SFX.click(0.1, 2200, 0.3); SFX.click(0.75, 2800, 0.36); SFX.click(0.85, 1800, 0.25); SFX.click(1.35, 3600, 0.4); SFX.click(1.45, 2500, 0.4); },
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
var CAGE_POS = [[-8, -3], [11, -7], [23, 8], [-24, -15], [26, -26], [-26, 21], [3, -28], [18, 25]];
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
    for (var i = 0; i < CAGE_POS.length; i++) if (Math.hypot(x - CAGE_POS[i][0], z - CAGE_POS[i][1]) < rad + 2.6) return false;
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
  CAGE_POS.forEach(function (p) { CIRCLES.push({ x: p[0], z: p[1], r: 1.0 }); });
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


// ===== 05_friends.js =====
// ---- minimal GLB reader + the 8 friends (Meshy models) ----------------------
var FRIENDS = [];        // {group, model, cage, bars, beacon, x, z, state, t, name}
var FRIEND_NAMES = ['ハル', 'メガネ', 'ツン', 'ナギ', 'ロング', 'ミディ', 'ボブ', 'ウェーブ'];
var MODEL_STATUS = { boys: 'loading', girls: 'loading' };

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

var CAGE_G = {};
function buildFriends() {
  var barM = new THREE.MeshBasicMaterial({ color: 0x59d8ff, transparent: true, opacity: 0.85 });
  var baseM = stdMat({ color: 0x24272b, roughness: 0.45, metalness: 0.9, roughnessMap: TEX.metalRgh });
  CAGE_G.bar = new THREE.CylinderGeometry(0.026, 0.026, 1.95, 6); CAGE_G.base = new THREE.CylinderGeometry(0.95, 1.0, 0.1, 24); CAGE_G.ring = new THREE.TorusGeometry(0.85, 0.035, 6, 24);
  CAGE_G.beacon = new THREE.CylinderGeometry(0.5, 0.5, 60, 12, 1, true);
  var phG = new THREE.CylinderGeometry(0.2, 0.24, 0.75, 10), phH = new THREE.SphereGeometry(0.27, 14, 10), phM = stdMat({ color: 0xf2f2f2, roughness: 0.6 });
  CAGE_POS.forEach(function (p, i) {
    var f = { x: p[0], z: p[1], state: 'caged', t: Math.random() * 6, name: FRIEND_NAMES[i], open: 0 };
    f.group = new THREE.Group(); f.group.position.set(p[0], 0, p[1]); scene.add(f.group);
    f.model = new THREE.Group(); f.model.position.y = 0.1; f.group.add(f.model);
    var b = new THREE.Mesh(phG, phM); b.position.y = 0.4; var h = new THREE.Mesh(phH, phM); h.position.y = 0.98; f.placeholder = new THREE.Group(); f.placeholder.add(b); f.placeholder.add(h); f.model.add(f.placeholder);
    f.cage = new THREE.Group(); f.group.add(f.cage);
    var base = new THREE.Mesh(CAGE_G.base, baseM); base.position.y = 0.05; base.receiveShadow = true; f.group.add(base);
    f.bars = new THREE.Group(); f.cage.add(f.bars);
    f.barM = barM.clone();
    for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2, bar = new THREE.Mesh(CAGE_G.bar, f.barM); bar.position.set(Math.cos(a) * 0.85, 1.07, Math.sin(a) * 0.85); f.bars.add(bar); }
    var top = new THREE.Mesh(CAGE_G.ring, baseM); top.rotation.x = Math.PI / 2; top.position.y = 2.06; f.cage.add(top);
    f.beacon = new THREE.Mesh(CAGE_G.beacon, new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    f.beacon.position.y = 30; f.beacon.visible = false; f.group.add(f.beacon);
    FRIENDS.push(f);
  });
  ['boys', 'girls'].forEach(function (key, fi) {
    loadModelFile(key, function (err, list) {
      if (err || !list) return;
      list.slice(0, 4).forEach(function (m, i) {
        var f = FRIENDS[fi * 4 + i], mesh = new THREE.Mesh(m.geometry, m.material);
        mesh.scale.setScalar(1.3); mesh.castShadow = true; mesh.receiveShadow = true;
        f.model.remove(f.placeholder); f.model.add(mesh); f.mesh = mesh;
      });
    });
  });
}
function resetFriends() {
  FRIENDS.forEach(function (f) { f.state = 'caged'; f.open = 0; f.cage.visible = true; f.bars.scale.y = 1; f.bars.position.y = 0; f.barM.opacity = 0.85; f.barM.color.set(0x59d8ff); f.beacon.visible = false; f.model.position.y = 0.1; });
}
function updateFriends(dt, px, pz, activeIdx, phase) {
  for (var i = 0; i < FRIENDS.length; i++) {
    var f = FRIENDS[i]; f.t += dt;
    var want = Math.atan2(px - f.x, pz - f.z);
    f.model.rotation.y += angDiff(want, f.model.rotation.y) * Math.min(1, dt * 3);
    if (f.state === 'caged') {
      f.model.position.y = 0.1; f.model.rotation.z = Math.sin(f.t * 1.3) * 0.04;
      var act = i === activeIdx;
      f.barM.opacity = act ? 0.75 + Math.sin(f.t * 8) * 0.2 : 0.55;
      f.barM.color.set(act ? (phase === 'rescue' ? 0x7dffb0 : 0xff6a4a) : 0x59d8ff);
      f.beacon.visible = act && phase === 'rescue'; if (f.beacon.visible) f.beacon.material.opacity = 0.16 + Math.sin(f.t * 4) * 0.06;
    } else {
      if (f.open < 1) { f.open = Math.min(1, f.open + dt * 1.6); f.bars.scale.y = 1 - f.open; f.bars.position.y = -f.open * 0.2; if (f.open >= 1) f.cage.visible = false; }
      f.model.position.y = 0.1 + Math.abs(Math.sin(f.t * 5.2)) * 0.22; f.model.rotation.z = Math.sin(f.t * 5.2) * 0.07;
      f.beacon.visible = false;
    }
  }
}


// ===== 06_input.js =====
// ---- input: touch (left = move, right = look, fire button) + mouse/keyboard --
var input = { mx: 0, mz: 0, lookX: 0, lookY: 0, fire: false, reload: false, sprint: false, locked: false, usedTouch: IS_MOBILE || (IS_TOUCH && window.matchMedia && matchMedia('(pointer:coarse)').matches) };
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
    if (e.button === 0) input.fire = true;
    input.dragging = true;
  });
  window.addEventListener('mouseup', function (e) { if (e.button === 0) input.fire = false; input.dragging = false; });
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
  var stick = null, look = null, fireT = null;
  if (input.usedTouch) ROOT.classList.add('fr-istouch');
  function place(x, y) { touchUI.stickBase.style.transform = 'translate(' + (x - 60) + 'px,' + (y - 60) + 'px)'; touchUI.stickBase.style.opacity = 1; }
  layer.addEventListener('touchstart', function (e) {
    e.preventDefault(); audioInit(); input.usedTouch = true; ROOT.classList.add('fr-istouch');
    if (!inputActive()) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i], tg = t.target;
      if (tg.closest && tg.closest('.fr-reload')) { input.reload = true; continue; }
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
  input.resetTouch = function () { stick = look = fireT = null; input.mx = input.mz = 0; input.fire = false; input.sprint = false; touchUI.stickBase.style.opacity = 0; touchUI.fire.classList.remove('on'); };
}
function pollKeys() {
  if (input.usedTouch && !(keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD)) return;
  var x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), z = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  var l = Math.hypot(x, z) || 1; input.mx = x / l; input.mz = z / l; input.sprint = !!(keys.ShiftLeft || keys.ShiftRight);
  if (keys.Space) input.fire = true; else if (input.spaceFire) input.fire = false; input.spaceFire = !!keys.Space;
}


// ===== 07_weapon.js =====
// ---- rifle viewmodel, firing, recoil, particles, decals ---------------------
var gun = {}, FX = {};
var WEAPON = { mag: 30, rate: 0.098, dmg: 34, reloadTime: 1.7 };
var _v1, _v2, _v3, _q1;

function cylBetween(a, b, r, mat, parent) {
  var d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, d.length(), 10), mat);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(m); return m;
}
function buildWeapon() {
  _v1 = new THREE.Vector3(); _v2 = new THREE.Vector3(); _v3 = new THREE.Vector3(); _q1 = new THREE.Quaternion();
  var metal = stdMat({ color: 0x131416, roughness: 0.42, metalness: 0.92, roughnessMap: TEX.metalRgh, envMapIntensity: 1.1 });
  var poly = stdMat({ color: 0x15171a, roughness: 0.72, metalness: 0.05, envMapIntensity: 0.5 });
  var tan = stdMat({ color: 0x2f2a22, roughness: 0.75, metalness: 0.05, envMapIntensity: 0.5 });
  var glove = stdMat({ color: 0x121311, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 });
  var sleeve = stdMat({ color: 0x2a3024, roughness: 1, metalness: 0, envMapIntensity: 0.3 });
  var root = gun.root = new THREE.Group(), k = gun.kick = new THREE.Group(); root.add(k);
  function box(w, h, d, x, y, z, m, rx) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (rx) b.rotation.x = rx; k.add(b); return b; }
  function cyl(r, l, x, y, z, m, seg) { var c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg || 12), m); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); k.add(c); return c; }
  box(0.052, 0.085, 0.3, 0, 0, -0.04, metal);                    // receiver
  box(0.046, 0.03, 0.34, 0, 0.055, -0.1, metal);                 // top rail
  box(0.056, 0.062, 0.27, 0, 0.004, -0.325, tan);                // handguard
  cyl(0.011, 0.24, 0, 0.012, -0.56, metal);                      // barrel
  cyl(0.018, 0.07, 0, 0.012, -0.665, metal, 8);                  // muzzle brake
  box(0.044, 0.07, 0.24, 0, -0.012, 0.23, tan);                  // stock
  box(0.048, 0.1, 0.03, 0, -0.03, 0.355, poly);                  // butt pad
  box(0.04, 0.11, 0.05, 0, -0.09, 0.085, poly, 0.3);             // grip
  gun.magMesh = box(0.036, 0.17, 0.062, 0, -0.115, -0.07, metal, -0.16);
  box(0.012, 0.04, 0.012, 0, 0.085, -0.43, metal);               // front sight
  box(0.05, 0.05, 0.008, 0, 0.097, -0.03, metal); box(0.05, 0.008, 0.07, 0, 0.122, -0.03, metal);   // optic frame
  box(0.008, 0.05, 0.07, 0.025, 0.097, -0.03, metal); box(0.008, 0.05, 0.07, -0.025, 0.097, -0.03, metal);
  var dot = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 8), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); dot.position.set(0, 0.097, -0.034); k.add(dot);
  var lens = new THREE.Mesh(new THREE.PlaneGeometry(0.042, 0.042), new THREE.MeshStandardMaterial({ color: 0x224455, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.22 })); lens.position.set(0, 0.097, -0.035); k.add(lens);
  // hands + forearms
  var lh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glove); lh.scale.set(1.1, 0.8, 1.5); lh.position.set(-0.012, -0.045, -0.33); k.add(lh);
  cylBetween(new THREE.Vector3(-0.03, -0.06, -0.3), new THREE.Vector3(-0.3, -0.3, 0.1), 0.042, sleeve, k);
  var rh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glove); rh.scale.set(1.0, 1.3, 1.0); rh.position.set(0.006, -0.085, 0.09); k.add(rh);
  cylBetween(new THREE.Vector3(0.02, -0.12, 0.1), new THREE.Vector3(0.16, -0.32, 0.42), 0.045, sleeve, k);
  gun.muzzle = new THREE.Object3D(); gun.muzzle.position.set(0, 0.012, -0.72); k.add(gun.muzzle);
  gun.eject = new THREE.Object3D(); gun.eject.position.set(0.04, 0.03, -0.02); k.add(gun.eject);
  // muzzle flash
  var fm = new THREE.MeshBasicMaterial({ map: TEX.flash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  gun.flash = new THREE.Group(); gun.flash.position.copy(gun.muzzle.position);
  var f1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), fm); gun.flash.add(f1);
  var f2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), fm); f2.rotation.y = Math.PI / 2; f2.position.z = -0.1; gun.flash.add(f2);
  var f3 = f2.clone(); f3.rotation.set(Math.PI / 2, 0, Math.PI / 2); gun.flash.add(f3);
  gun.flash.visible = false; k.add(gun.flash);
  root.scale.setScalar(0.3); root.traverse(function (o) { if (o.isMesh) { o.frustumCulled = false; } });
  camera.add(root);
  gun.light = new THREE.PointLight(0xffb060, 0, 14, 2); gun.light.position.set(0.1, -0.05, -0.6); camera.add(gun.light);
  gun.base = new THREE.Vector3(0.068, -0.062, -0.155);
  gun.ammo = WEAPON.mag; gun.cool = 0; gun.reloadT = 0; gun.kz = 0; gun.kr = 0; gun.bloom = 0; gun.flashT = 0; gun.swayX = 0; gun.swayY = 0; gun.bob = 0;
  gun.recP = 0; gun.recPV = 0; gun.recY = 0; gun.recYV = 0;

  // ---- effect pools
  var N = FX.N = 260; FX.pos = new Float32Array(N * 3); FX.vel = new Float32Array(N * 3); FX.life = new Float32Array(N); FX.next = 0;
  for (var i = 0; i < N; i++) FX.pos[i * 3 + 1] = -999;
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(FX.pos, 3));
  FX.points = new THREE.Points(pg, new THREE.PointsMaterial({ map: TEX.glow, size: 0.16, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffc070, sizeAttenuation: true }));
  FX.points.frustumCulled = false; scene.add(FX.points);
  FX.smokes = []; for (i = 0; i < 26; i++) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, transparent: true, opacity: 0, depthWrite: false, color: 0x8a8078 })); s.visible = false; scene.add(s); FX.smokes.push({ s: s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grow: 1 }); }
  FX.smokeI = 0;
  FX.flashes = []; for (i = 0; i < 6; i++) { var fs = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fs.visible = false; scene.add(fs); FX.flashes.push({ s: fs, life: 0, max: 1, size: 1 }); }
  FX.flashI = 0;
  var dg = new THREE.PlaneGeometry(0.16, 0.16), dm = new THREE.MeshBasicMaterial({ map: TEX.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  FX.decals = []; for (i = 0; i < 40; i++) { var d = new THREE.Mesh(dg, dm); d.visible = false; scene.add(d); FX.decals.push(d); } FX.decalI = 0;
  var tg = new THREE.BoxGeometry(0.018, 0.018, 1); tg.translate(0, 0, 0.5);
  FX.tracers = []; for (i = 0; i < 8; i++) { var t = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); t.visible = false; t.frustumCulled = false; scene.add(t); FX.tracers.push({ m: t, life: 0 }); } FX.tracerI = 0;
  var brass = stdMat({ color: 0xc9a24a, roughness: 0.3, metalness: 1 }), sg = new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), debM = stdMat({ color: 0x25272b, roughness: 0.5, metalness: 0.8 }), debG = new THREE.BoxGeometry(0.16, 0.06, 0.12);
  FX.bodies = []; for (i = 0; i < 26; i++) { var isShell = i < 10, b = new THREE.Mesh(isShell ? sg : debG, isShell ? brass : debM); b.visible = false; b.castShadow = !isShell; scene.add(b); FX.bodies.push({ m: b, shell: isShell, life: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0 }); }
  FX.shellI = 0; FX.debI = 10;
  FX.boomLight = new THREE.PointLight(0xff9040, 0, 26, 2); scene.add(FX.boomLight); FX.boomT = 0;
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
function fxTracer(a, b) {
  var t = FX.tracers[FX.tracerI]; FX.tracerI = (FX.tracerI + 1) % FX.tracers.length;
  t.m.position.copy(a); t.m.lookAt(b); t.m.scale.z = a.distanceTo(b); t.m.visible = true; t.life = 0.06; t.m.material.opacity = 0.7;
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
  if (gun.reloadT > 0 || gun.ammo >= WEAPON.mag) return;
  gun.reloadT = WEAPON.reloadTime; SFX.reload();
}
function shoot() {
  gun.ammo--; gun.cool = WEAPON.rate; G.stats.shots++;
  var sp = 0.004 + gun.bloom + (P.speed > 5 ? 0.012 : P.speed > 1 ? 0.005 : 0);
  camera.getWorldDirection(_v1); camera.getWorldPosition(_v2);
  // random cone
  _v3.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(sp); _v1.add(_v3).normalize();
  if (Math.abs(_v1.x) < 1e-6) _v1.x = 1e-6; if (Math.abs(_v1.y) < 1e-6) _v1.y = 1e-6; if (Math.abs(_v1.z) < 1e-6) _v1.z = 1e-6;
  var w = rayWorld(_v2.x, _v2.y, _v2.z, _v1.x, _v1.y, _v1.z, 200), maxT = w ? w.t : 200;
  var eh = rayEnemies(_v2, _v1, maxT), endT = eh ? eh.t : maxT;
  var hx = _v2.x + _v1.x * endT, hy = _v2.y + _v1.y * endT, hz = _v2.z + _v1.z * endT;
  if (eh) {
    G.stats.hits++; damageEnemy(eh.e, WEAPON.dmg * (eh.crit ? 2.2 : 1), eh.crit, hx, hy, hz);
    fxSparks(hx, hy, hz, -_v1.x, 0.4, -_v1.z, eh.crit ? 12 : 7, 6);
  } else if (w) {
    fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, 6, 4.5); fxDecal(hx, hy, hz, w.nx, w.ny, w.nz);
    if (Q.tier > 0 || Math.random() < 0.4) fxSmoke(hx + w.nx * 0.1, hy + w.ny * 0.1, hz + w.nz * 0.1, 0.25, 0.5, 0x9a9085, 0.4);
    SFX.impact(0, clamp(1 - endT / 40, 0.1, 1));
  }
  gun.muzzle.getWorldPosition(_v3); _v1.set(hx, hy, hz);
  if (endT > 2.5) fxTracer(_v3, _v1);
  // recoil + flash + casing
  gun.recPV += 0.5 + Math.random() * 0.12; gun.recYV += rnd(-0.22, 0.22);
  gun.kz = Math.min(0.09, gun.kz + 0.05); gun.kr = Math.min(0.12, gun.kr + 0.045); gun.bloom = Math.min(0.028, gun.bloom + 0.0045);
  gun.flashT = 0.045; gun.flash.visible = true; gun.flash.rotation.z = Math.random() * 6; gun.flash.scale.setScalar(rnd(0.75, 1.25)); gun.light.intensity = 5;
  gun.eject.getWorldPosition(_v3); camera.getWorldQuaternion(_q1); _v1.set(rnd(1.6, 2.6), rnd(1.4, 2.4), rnd(-0.3, 0.6)).applyQuaternion(_q1);
  fxBody(true, _v3.x, _v3.y, _v3.z, _v1.x + P.vx, _v1.y, _v1.z + P.vz);
  SFX.shot(); SFX.shell(); G.shake = Math.min(1, G.shake + 0.22);
}
function updateWeapon(dt) {
  gun.cool -= dt;
  if (input.reload) { input.reload = false; if (G.state === 'playing') startReload(); }
  if (gun.reloadT > 0) {
    gun.reloadT -= dt;
    if (gun.reloadT <= 0) { gun.ammo = WEAPON.mag; gun.reloadT = 0; }
  } else if (input.fire && gun.cool <= 0 && G.state === 'playing' && P.hp > 0) {
    if (gun.ammo > 0) shoot(); else { SFX.empty(); gun.cool = 0.3; startReload(); }
  }
  if (gun.ammo === 0 && gun.reloadT <= 0 && !input.fire) startReload();
  // recoil springs
  gun.recP += gun.recPV * dt; gun.recY += gun.recYV * dt;
  gun.recPV = damp(gun.recPV, 0, 20, dt); gun.recYV = damp(gun.recYV, 0, 20, dt);
  gun.recP = damp(gun.recP, 0, input.fire ? 2.5 : 7, dt); gun.recY = damp(gun.recY, 0, 5, dt);
  gun.recP = Math.min(gun.recP, 0.16);
  gun.kz = damp(gun.kz, 0, 16, dt); gun.kr = damp(gun.kr, 0, 14, dt); gun.bloom = damp(gun.bloom, 0, 4.5, dt);
  if (gun.flashT > 0) { gun.flashT -= dt; if (gun.flashT <= 0) { gun.flash.visible = false; gun.light.intensity = 0; } }
  // sway / bob / reload pose
  gun.swayX = damp(gun.swayX, clamp(-P.lookDX * 1.6, -0.06, 0.06), 9, dt); gun.swayY = damp(gun.swayY, clamp(-P.lookDY * 1.6, -0.05, 0.05), 9, dt);
  var bobA = Math.min(1, P.speed / 4.6) * 0.012, r = gun.root, b = gun.base;
  var rl = 0, magD = 0;
  if (gun.reloadT > 0) { var k = 1 - gun.reloadT / WEAPON.reloadTime; rl = Math.sin(Math.min(1, k * 1.15) * Math.PI); magD = (k > 0.08 && k < 0.5) ? Math.min(1, (k - 0.08) * 8) : (k >= 0.5 && k < 0.62 ? 1 - (k - 0.5) / 0.12 : 0); }
  gun.magMesh.position.y = -0.115 - magD * 0.22; gun.magMesh.visible = !(magD > 0.98);
  r.position.set(b.x + gun.swayX * 0.06 + Math.cos(P.bob) * bobA * 0.6, b.y + gun.swayY * 0.06 - Math.abs(Math.sin(P.bob)) * bobA - rl * 0.03 - P.landDip * 0.02, b.z + gun.kz * 0.3);
  r.rotation.set(gun.kr * 0.5 - gun.swayY * 0.5 + rl * 0.45, gun.swayX * 0.6 + rl * 0.25, rl * -0.5 + gun.swayX * -0.4);
}


// ===== 08_enemies.js =====
// ---- security drones (all procedural) + their energy bolts -------------------
var ENEMIES = [], BOLTS = [], DR = {};
var ETYPE = {
  scout:  { hp: 70,  scale: 1.0, speed: 6.5, score: 100, dmg: 9,  burst: 1, cd: [1.7, 2.8], range: [9, 15] },
  gunner: { hp: 170, scale: 1.45, speed: 4.2, score: 250, dmg: 8,  burst: 3, cd: [2.4, 3.4], range: [11, 17] },
  kami:   { hp: 45,  scale: 0.8, speed: 9.5, score: 150, dmg: 30, burst: 0, cd: [9, 9], range: [4, 6] }
};
function buildEnemyAssets() {
  DR.body = new THREE.SphereGeometry(0.42, 16, 10); DR.arm = new THREE.BoxGeometry(1.25, 0.05, 0.09); DR.motor = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
  DR.rotor = new THREE.CircleGeometry(0.27, 14); DR.eye = new THREE.SphereGeometry(0.12, 12, 8); DR.barrel = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8); DR.fin = new THREE.BoxGeometry(0.5, 0.04, 0.5);
  DR.metal = stdMat({ color: 0x24262a, roughness: 0.4, metalness: 0.9, roughnessMap: TEX.metalRgh, envMapIntensity: 1 });
  DR.shell = { scout: stdMat({ color: 0x59616b, roughness: 0.45, metalness: 0.7 }), gunner: stdMat({ color: 0x6d2620, roughness: 0.4, metalness: 0.7 }), kami: stdMat({ color: 0xc79a1a, roughness: 0.5, metalness: 0.5 }) };
  DR.rotorM = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  var bg = new THREE.CylinderGeometry(0.045, 0.045, 0.9, 6); bg.rotateX(Math.PI / 2);
  var bm = new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (var i = 0; i < 22; i++) {
    var m = new THREE.Mesh(bg, bm); m.visible = false; m.frustumCulled = false; scene.add(m);
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff5030, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); gl.scale.setScalar(0.7); m.add(gl);
    BOLTS.push({ m: m, on: false, vx: 0, vy: 0, vz: 0, life: 0, dmg: 0 });
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
  var e = { type: type, T: T, g: d.g, eyeM: d.eyeM, rotors: d.rotors, hp: T.hp * (1 + wave * 0.05), x: Math.cos(a) * 46, y: rnd(9, 13), z: Math.sin(a) * 46, vx: 0, vy: 0, vz: 0,
    ang: a, dir: Math.random() < 0.5 ? 1 : -1, ring: rnd(T.range[0], T.range[1]), alt: rnd(2.3, 4.6), t: Math.random() * 9, cd: rnd(1.2, 2.6), charge: 0, burst: 0, burstT: 0, hitFlash: 0, dive: 0, beepT: 0, r: 0.5 * T.scale, wave: wave, dirT: rnd(2, 5) };
  e.g.position.set(e.x, e.y, e.z); scene.add(e.g); ENEMIES.push(e); return e;
}
function removeEnemy(e) { scene.remove(e.g); e.eyeM.dispose(); var i = ENEMIES.indexOf(e); if (i >= 0) ENEMIES.splice(i, 1); }
function clearEnemies() { while (ENEMIES.length) removeEnemy(ENEMIES[0]); BOLTS.forEach(function (b) { b.on = false; b.m.visible = false; }); }

function raySphere(o, d, cx, cy, cz, r) {
  var ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r, h = b * b - c;
  if (h < 0) return -1; h = Math.sqrt(h); var t = -b - h; return t > 0 ? t : -1;
}
function rayEnemies(o, d, maxT) {
  var best = null;
  for (var i = 0; i < ENEMIES.length; i++) {
    var e = ENEMIES[i], t = raySphere(o, d, e.x, e.y, e.z, e.r * 1.12);
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

function damageEnemy(e, dmg, crit, hx, hy, hz) {
  e.hp -= dmg; e.hitFlash = 0.1; hudHit(crit, e.hp <= 0);
  if (e.hp <= 0) killEnemy(e, true, crit); else SFX.hit();
}
function killEnemy(e, byPlayer, crit) {
  fxExplosion(e.x, e.y, e.z, e.type === 'gunner'); SFX.boom(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
  if (byPlayer) { G.stats.kills++; addScore(e.T.score + (crit ? 50 : 0), crit ? 'クリティカル撃破' : '撃破'); SFX.kill(); }
  var d = Math.hypot(e.x - P.x, e.y - (P.y + 1.2), e.z - P.z);
  if (d < 10) G.shake = Math.min(1.5, G.shake + (10 - d) * 0.09);
  removeEnemy(e);
}
function fireBolt(e, spreadMul) {
  var b = null; for (var i = 0; i < BOLTS.length; i++) if (!BOLTS[i].on) { b = BOLTS[i]; break; } if (!b) return;
  var s = e.T.scale, fx = Math.sin(e.g.rotation.y), fz = Math.cos(e.g.rotation.y), ox = e.x + fx * 0.5 * s, oy = e.y - 0.2 * s, oz = e.z + fz * 0.5 * s;
  var sp = 27 + e.wave * 0.8, dist = Math.hypot(P.x - ox, P.z - oz), lead = dist / sp * 0.55, err = Math.max(0.25, 1.15 - e.wave * 0.1) * (spreadMul || 1);
  var tx = P.x + P.vx * lead + rnd(-err, err), ty = P.y + 1.25 + rnd(-err, err) * 0.6, tz = P.z + P.vz * lead + rnd(-err, err);
  var dx = tx - ox, dy = ty - oy, dz = tz - oz, l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  b.on = true; b.vx = dx / l * sp; b.vy = dy / l * sp; b.vz = dz / l * sp; b.life = 3; b.dmg = e.T.dmg + Math.min(5, e.wave * 0.5);
  b.m.position.set(ox, oy, oz); _v1.set(ox + dx, oy + dy, oz + dz); b.m.lookAt(_v1); b.m.visible = true;
  fxFlash(ox, oy, oz, 1.2, 0.08, 0xff6040); SFX.bolt(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
}
function updateBolts(dt) {
  for (var i = 0; i < BOLTS.length; i++) {
    var b = BOLTS[i]; if (!b.on) continue;
    var p = b.m.position, sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz), step = sp * dt, dx = b.vx / sp, dy = b.vy / sp, dz = b.vz / sp;
    // closest approach to the player's body segment (approximated by 2 spheres)
    var hitP = false;
    if (P.hp > 0) for (var k = 0; k < 2 && !hitP; k++) {
      var cy = P.y + (k ? 1.45 : 0.75), ox = P.x - p.x, oy = cy - p.y, oz = P.z - p.z, t = clamp(ox * dx + oy * dy + oz * dz, 0, step);
      var qx = ox - dx * t, qy = oy - dy * t, qz = oz - dz * t; if (qx * qx + qy * qy + qz * qz < 0.42 * 0.42) hitP = true;
    }
    var w = rayWorld(p.x, p.y, p.z, dx + 1e-9, dy + 1e-9, dz + 1e-9, step);
    if (hitP) { b.on = false; b.m.visible = false; hurtPlayer(b.dmg, p.x - dx, p.z - dz); continue; }
    if (w) { var hx = p.x + dx * w.t, hy = p.y + dy * w.t, hz = p.z + dz * w.t; fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, 5, 4); fxFlash(hx, hy, hz, 0.9, 0.1, 0xff6040); b.on = false; b.m.visible = false; continue; }
    p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt; b.life -= dt; if (b.life <= 0) { b.on = false; b.m.visible = false; }
  }
}
function updateEnemies(dt) {
  var nearest = 99;
  for (var i = ENEMIES.length - 1; i >= 0; i--) {
    var e = ENEMIES[i], T = e.T; e.t += dt;
    var dxp = P.x - e.x, dzp = P.z - e.z, dist = Math.hypot(dxp, dzp), d3 = Math.hypot(dist, P.y + 1.4 - e.y); if (d3 < nearest) nearest = d3;
    var see = losClear(e.x, e.y, e.z, P.x, P.y + 1.4, P.z), alive = P.hp > 0;
    var tx, ty, tz, maxSp = T.speed;
    if (T.burst === 0) {       // kamikaze: orbit close, then dive
      if (e.dive <= 0 && dist < 13 && see && alive && e.t > 2.5) e.dive = 0.001;
      if (e.dive > 0) { e.dive += dt; tx = P.x; ty = P.y + 1.3; tz = P.z; maxSp = T.speed * 1.5; e.beepT -= dt; if (e.beepT <= 0) { e.beepT = Math.max(0.07, 0.3 - e.dive * 0.12); SFX.beep(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); e.hitFlash = 0.05; } }
      else { e.ang += e.dir * dt * 0.7; tx = P.x + Math.cos(e.ang) * 10; tz = P.z + Math.sin(e.ang) * 10; ty = e.alt + 1; }
      if (d3 < 1.25 && alive) { hurtPlayer(T.dmg, e.x, e.z); killEnemy(e, false); continue; }
    } else {
      e.dirT -= dt; if (e.dirT <= 0) { e.dirT = rnd(2, 5); e.dir = -e.dir; e.ring = rnd(T.range[0], T.range[1]); e.alt = rnd(2.3, 4.6); }
      e.ang += e.dir * dt * (see ? 0.22 : 0.6);
      tx = P.x + Math.cos(e.ang) * e.ring; tz = P.z + Math.sin(e.ang) * e.ring; ty = e.alt + Math.sin(e.t * 1.7) * 0.25 + (see ? 0 : 1.5);
      tx = clamp(tx, -ARENA - 3, ARENA + 3); tz = clamp(tz, -ARENA - 3, ARENA + 3);
    }
    if (e.dive <= 0) { var top = obstacleTop(e.x + e.vx * 0.4, e.z + e.vz * 0.4, 1.0); if (ty < top + 1.0) ty = top + 1.0; }
    var ax = tx - e.x, ay = ty - e.y, az = tz - e.z, al = Math.sqrt(ax * ax + ay * ay + az * az) || 1, want = Math.min(maxSp, al * 1.6);
    // separation
    for (var j = 0; j < ENEMIES.length; j++) { if (j === i) continue; var o = ENEMIES[j], sx = e.x - o.x, sy = e.y - o.y, sz = e.z - o.z, sl = sx * sx + sy * sy + sz * sz; if (sl < 6.5 && sl > 0.001) { var f = (6.5 - sl) * 0.35; e.vx += sx * f * dt; e.vy += sy * f * dt * 0.5; e.vz += sz * f * dt; } }
    var k = 1 - Math.exp(-(e.dive > 0 ? 3.2 : 2.2) * dt);
    e.vx += (ax / al * want - e.vx) * k; e.vy += (ay / al * want - e.vy) * k; e.vz += (az / al * want - e.vz) * k;
    e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt;
    if (e.y < 0.6) { e.y = 0.6; e.vy = Math.abs(e.vy) * 0.3; }
    if (e.dive > 0 && e.dive > 0.3) { var top2 = obstacleTop(e.x, e.z, 0.3); if (e.y < top2 + 0.2 && top2 > 0) { killEnemy(e, false); continue; } }
    e.g.position.set(e.x, e.y, e.z);
    var yaw = Math.atan2(dxp, dzp); e.g.rotation.y += angDiff(yaw, e.g.rotation.y) * Math.min(1, dt * 6);
    e.g.rotation.x = clamp(-(e.vx * Math.sin(e.g.rotation.y) + e.vz * Math.cos(e.g.rotation.y)) * 0.03, -0.4, 0.4) + (e.dive > 0 ? 0.5 : 0);
    e.g.rotation.z = clamp((e.vx * Math.cos(e.g.rotation.y) - e.vz * Math.sin(e.g.rotation.y)) * 0.04, -0.4, 0.4);
    for (var r = 0; r < 4; r++) e.rotors[r].rotation.z += dt * 40 * (r % 2 ? 1 : -1);
    // firing
    if (T.burst > 0 && alive) {
      if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { fireBolt(e, T.burst > 1 ? 1.5 : 1); e.burst--; e.burstT = 0.16; } }
      else if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) { e.burst = T.burst; e.burstT = 0; e.cd = rnd(T.cd[0], T.cd[1]) * Math.max(0.6, 1 - e.wave * 0.035); } }
      else { e.cd -= dt; if (e.cd <= 0 && see && d3 < 30 && Math.hypot(e.x, e.z) < ARENA + 8) { e.charge = 0.45; SFX.charge(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); } }
    }
    if (e.hitFlash > 0) e.hitFlash -= dt;
    var c = e.eyeM.color;
    if (e.hitFlash > 0) c.setRGB(1, 1, 1); else if (e.charge > 0) { var u = 1 - e.charge / 0.45; c.setRGB(1, 0.2 + u * 0.8, 0.1 + u * 0.7); } else if (T.burst === 0) c.setRGB(1, 0.7, 0.12); else c.setRGB(1, 0.16, 0.1);
  }
  if (AU.ok) AU.hum.gain.value = damp(AU.hum.gain.value, ENEMIES.length ? clamp(0.16 - nearest * 0.006, 0.015, 0.14) : 0, 3, dt);
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
'.fr-ammo{position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);bottom:calc(env(safe-area-inset-bottom,0px) + 18px);font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}.fr-ammo small{font-size:14px;opacity:.7}.fr-istouch .fr-ammo{bottom:calc(env(safe-area-inset-bottom,0px) + 172px);right:calc(env(safe-area-inset-right,0px) + 36px);font-size:24px}.fr-ammo.low{color:#ff6a4a}',
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
'.fr-load{position:absolute;left:0;right:0;top:46%;text-align:center;font-size:14px;letter-spacing:.2em;font-weight:700}'
].join('\n');

var H = {};
function buildUI() {
  var hud = H.hud = el('div', 'fr-hud', UI);
  H.vig = el('div', 'fr-vig', hud);
  H.dmg = el('div', 'fr-dmg', hud); el('i', null, H.dmg);
  var top = el('div', 'fr-top', hud);
  H.hpbox = el('div', 'fr-hpbox', top); var bar = el('div', 'fr-hpbar', H.hpbox); H.hpfill = el('div', 'fr-hpfill', bar); H.hptxt = el('div', 'fr-small', H.hpbox, 'HP 100');
  var mid = el('div', 'fr-mid', top); H.wave = el('div', null, mid, ''); H.dots = el('div', 'fr-dots', mid);
  for (var i = 0; i < 8; i++) el('i', null, H.dots);
  var right = el('div', 'fr-right', top); H.score = el('div', 'fr-score', right, '0'); H.pause = el('div', 'fr-pause', right, 'II');
  onTap(H.pause, function () { if (G.state === 'playing') pauseGame(); });
  H.ammo = el('div', 'fr-ammo', hud);
  H.cross = el('div', 'fr-cross', hud); H.cl = [el('b', null, H.cross), el('b', null, H.cross), el('b', null, H.cross), el('b', null, H.cross)]; el('b', 'd', H.cross);
  H.hitm = el('div', 'fr-hitm', hud);
  H.banner = el('div', 'fr-banner', hud); H.bh = el('h2', null, H.banner); H.bp = el('p', null, H.banner);
  H.feed = el('div', 'fr-feed', hud);
  H.mark = el('div', 'fr-mark', hud);

  // title
  var t = H.title = el('div', 'fr-screen fr-scroll', UI);
  el('h1', null, t).innerHTML = 'FRIENDS <span>RESCUE</span>'; el('h3', null, t, 'ともだち救出作戦');
  el('p', null, t, '警備ドローンに占拠されたコンテナヤード。ケージに閉じ込められた8人の仲間を、全員たすけ出せ。');
  H.account = el('div', 'fr-account', t);
  H.playBtn = el('button', 'fr-b pri', t, 'プレイ'); onTap(H.playBtn, function () { audioInit(); SFX.ui(); startGame(); });
  var hb = el('button', 'fr-b', t, 'あそびかた'); onTap(hb, function () { audioInit(); SFX.ui(); showScreen('help'); });
  var sb = el('button', 'fr-b', t, '設定'); onTap(sb, function () { audioInit(); SFX.ui(); H.setBack = 'title'; showScreen('settings'); });
  H.best = el('p', null, t, ''); H.modelNote = el('p', 'fr-note', t, '');
  el('p', 'fr-note', t, '※ 銃声などの大きな音と、画面が赤く光る・ゆれる演出があります　v' + GAME_VERSION);

  var hp = H.help = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, hp, 'あそびかた');
  el('p', null, hp, '【スマホ】画面の左側をドラッグで移動（大きく前に倒すとダッシュ）／右側をドラッグで視点／赤いボタンを押している間ずっと射撃（押したまま動かすと視点も動く）／「リロード」で弾を補充');
  el('p', null, hp, '【PC】クリックで開始・射撃／マウスで視点／WASD で移動／Shift でダッシュ／R でリロード／Esc で一時停止');
  el('p', null, hp, '【ルール】ドローンを全滅させると仲間のケージが緑に光る。近づくと救出でき、HPが回復する。8人全員を助けたらクリア。ドローンの赤く光る目は弱点（ダメージ2倍）。赤い弾はよけられる。黄色いドローンは体当たりして自爆する。');
  onTap(el('button', 'fr-b', hp, 'もどる'), function () { SFX.ui(); showScreen('title'); });

  var st = H.settings = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, st, '設定');
  function slider(label, min, max, val, fn) { var r = el('div', 'fr-row', st); el('span', null, r, label); var i = el('input', null, r); i.type = 'range'; i.min = min; i.max = max; i.step = 0.05; i.value = val; i.addEventListener('input', function () { fn(+i.value); }); i.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true }); i.addEventListener('touchmove', function (e) { e.stopPropagation(); }, { passive: true }); }
  slider('視点の速さ', 0.3, 2.5, SENS, function (v) { SENS = v; store.set('sens', v); });
  slider('音量', 0, 1, AU.vol, function (v) { setVolume(v); });
  var qr = el('div', 'fr-row', st); el('span', null, qr, '画質'); var seg = el('div', 'fr-seg', qr); H.qseg = [];
  [['auto', '自動'], [0, '低'], [1, '中'], [2, '高']].forEach(function (o) { var s = el('span', null, seg, o[1]); H.qseg.push([o[0], s]); onTap(s, function () { SFX.ui(); setQualityMode(o[0]); }); });
  H.qinfo = el('p', 'fr-note', st, '');
  onTap(el('button', 'fr-b', st, 'もどる'), function () { SFX.ui(); showScreen(H.setBack || 'title'); });

  var pz = H.paused = el('div', 'fr-screen', UI);
  el('h3', null, pz, '一時停止');
  onTap(el('button', 'fr-b pri', pz, 'つづける'), function () { SFX.ui(); resumeGame(); });
  onTap(el('button', 'fr-b', pz, '設定'), function () { SFX.ui(); H.setBack = 'paused'; showScreen('settings'); });
  onTap(el('button', 'fr-b', pz, 'タイトルへ'), function () { SFX.ui(); toTitle(); });

  var rs = H.result = el('div', 'fr-screen fr-scroll', UI);
  H.rTitle = el('h1', null, rs); H.rSub = el('h3', null, rs); H.rScore = el('div', 'fr-big', rs); H.rStat = el('div', 'fr-stat', rs); H.rNote = el('p', null, rs, '');
  onTap(el('button', 'fr-b pri', rs, 'もういちど'), function () { SFX.ui(); startGame(); });
  onTap(el('button', 'fr-b', rs, 'タイトルへ'), function () { SFX.ui(); toTitle(); });
}
function showScreen(name) {
  ['title', 'help', 'settings', 'paused', 'result'].forEach(function (n) { H[n].classList.toggle('on', n === name); });
  if (name === 'settings') refreshQualityUI();
  if (name === 'title') { H.best.textContent = store.get('best', 0) ? 'この端末のベストスコア： ' + store.get('best', 0) : ''; if (typeof refreshAccountUI === 'function') refreshAccountUI(); }
}
var hudCache = {};
function setTxt(k, e, v) { if (hudCache[k] !== v) { hudCache[k] = v; e.textContent = v; } }
function updateHUD(dt) {
  var hp = Math.max(0, Math.ceil(P.hp));
  if (hudCache.hp !== hp) { hudCache.hp = hp; H.hpfill.style.width = hp + '%'; H.hptxt.textContent = 'HP ' + hp; H.hpbox.classList.toggle('low', hp <= 30); }
  setTxt('score', H.score, String(G.score));
  var am = gun.reloadT > 0 ? 'リロード中…' : gun.ammo + ' / ' + WEAPON.mag; if (hudCache.am !== am) { hudCache.am = am; H.ammo.textContent = am; H.ammo.classList.toggle('low', gun.ammo <= 6 && gun.reloadT <= 0); H.ammo.style.fontSize = gun.reloadT > 0 ? '15px' : ''; }
  var left = G.queue.length + ENEMIES.length;
  setTxt('wave', H.wave, 'WAVE ' + G.wave + ' / 8　' + (G.phase === 'fight' ? '敵 のこり ' + left : G.phase === 'rescue' ? '仲間のケージへ！' : ''));
  var dk = G.rescued + '|' + G.wave + '|' + G.phase; if (hudCache.dk !== dk) { hudCache.dk = dk; for (var i = 0; i < 8; i++) H.dots.children[i].className = FRIENDS[i] && FRIENDS[i].state === 'free' ? 'on' : (i === G.wave - 1 ? 'cur' : ''); }
  // crosshair spread
  var sp = 7 + gun.bloom * 700 + Math.min(10, P.speed * 1.6), L = 9;
  var c = H.cl; c[0].style.cssText = 'left:' + (-sp - L) + 'px;top:-1px;width:' + L + 'px;height:2px'; c[1].style.cssText = 'left:' + sp + 'px;top:-1px;width:' + L + 'px;height:2px';
  c[2].style.cssText = 'top:' + (-sp - L) + 'px;left:-1px;height:' + L + 'px;width:2px'; c[3].style.cssText = 'top:' + sp + 'px;left:-1px;height:' + L + 'px;width:2px';
  if (H.hitT > 0) { H.hitT -= dt; H.hitm.style.opacity = Math.max(0, H.hitT / 0.18); }
  G.vig = damp(G.vig, 0, 2.5, dt); var low = P.hp <= 30 && P.hp > 0 ? 0.3 + Math.sin(G.time * 5) * 0.12 : 0;
  H.vig.style.opacity = Math.min(1, Math.max(G.vig, low)).toFixed(2);
  if (H.dmgT > 0) { H.dmgT -= dt; var rel = Math.atan2((H.dmgX - P.x) * Math.cos(P.yaw) - (H.dmgZ - P.z) * Math.sin(P.yaw), -(H.dmgX - P.x) * Math.sin(P.yaw) - (H.dmgZ - P.z) * Math.cos(P.yaw));
    H.dmg.style.opacity = Math.min(1, H.dmgT / 0.5); H.dmg.style.transform = 'rotate(' + rel.toFixed(3) + 'rad)'; } else if (hudCache.dmgOn) H.dmg.style.opacity = 0;
  hudCache.dmgOn = H.dmgT > 0;
  // objective marker
  var f = FRIENDS[G.wave - 1];
  if (G.phase === 'rescue' && f) {
    _v1.set(f.x, 2.4, f.z).project(camera); var behind = _v1.z > 1, w = window.innerWidth, h = window.innerHeight;
    var sx = (_v1.x * 0.5 + 0.5) * w, sy = (-_v1.y * 0.5 + 0.5) * h; if (behind) { sx = w - sx; sy = h - 60; }
    sx = clamp(sx, 44, w - 44); sy = clamp(sy, 90, h - 120);
    H.mark.style.display = 'block'; H.mark.style.transform = 'translate(' + sx.toFixed(0) + 'px,' + sy.toFixed(0) + 'px)'; setTxt('mk', H.mark, f.name + ' ' + Math.round(Math.hypot(f.x - P.x, f.z - P.z)) + 'm');
  } else if (hudCache.mkOn) H.mark.style.display = 'none';
  hudCache.mkOn = G.phase === 'rescue';
  if (H.banT > 0) { H.banT -= dt; if (H.banT <= 0) H.banner.style.opacity = 0; }
}
function hudHit(crit, kill) { H.hitT = 0.18; H.hitm.className = 'fr-hitm' + (kill ? ' k' : crit ? ' c' : ''); }
function banner(h, p, t) { H.bh.textContent = h; H.bp.textContent = p || ''; H.banner.style.opacity = 1; H.banT = t || 2.6; }
function feed(txt) { var d = el('div', null, H.feed, txt); while (H.feed.children.length > 3) H.feed.removeChild(H.feed.firstChild); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1300); }
function addScore(n, label) { G.score += n; if (label) feed(label + ' +' + n); }


// ===== 10_game.js =====
// ---- game state, player, waves, quality manager, main loop -------------------
var P = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, speed: 0, bob: 0, hp: 100, lookDX: 0, lookDY: 0, landDip: 0, hurtT: 99, deadT: 0 };
var G = { state: 'loading', phase: '', wave: 0, score: 0, rescued: 0, stats: { shots: 0, hits: 0, kills: 0 }, shake: 0, vig: 0, time: 0, timer: 0, queue: [], spawnT: 0, titleT: 0 };
var Q = { tier: 1, mode: store.get('qmode', 'auto'), prScale: 1, acc: 0, frames: 0, bad: 0, good: 0, fps: 60 };

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
  camera.aspect = a; camera.fov = a >= 1.2 ? 66 : clamp(2 * Math.atan(Math.tan(33 * Math.PI / 180) * 1.25 / a) * 180 / Math.PI, 66, 96);
  camera.updateProjectionMatrix(); applyQuality();
  if (gun.root) { var pt = a < 1; gun.root.scale.setScalar(pt ? 0.2 : 0.3); gun.base.set(pt ? 0.04 : 0.068, pt ? -0.058 : -0.062, pt ? -0.12 : -0.155); }
}

function buildWave(w) {
  var n = 3 + w, g = w >= 3 ? Math.floor((w - 1) / 2) : 0, k = w >= 2 ? Math.floor(w / 2) : 0, list = [], i;
  for (i = 0; i < g; i++) list.push('gunner'); for (i = 0; i < k; i++) list.push('kami'); while (list.length < n) list.push('scout');
  for (i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
  return list;
}
function startGame() {
  clearEnemies(); resetFriends();
  P.x = SPAWN_POS[0]; P.z = SPAWN_POS[1]; P.y = 0; P.yaw = 0; P.pitch = 0; P.vx = P.vz = 0; P.hp = 100; P.hurtT = 99; P.deadT = 0; P.bob = 0;
  G.score = 0; G.rescued = 0; G.wave = 0; G.stats = { shots: 0, hits: 0, kills: 0 }; G.shake = 0; G.vig = 0; G.time = 0; G.queue = [];
  gun.ammo = WEAPON.mag; gun.reloadT = 0; gun.cool = 0.3; gun.recP = gun.recY = gun.recPV = gun.recYV = 0; gun.root.visible = true;
  hudCache = {}; H.hitT = 0; H.dmgT = 0; input.fire = false; input.lookX = input.lookY = 0; if (input.resetTouch) input.resetTouch();
  G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null);
  if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} }
  nextWave();
}
function nextWave() {
  G.wave++; G.phase = 'intro'; G.timer = 3; G.queue = buildWave(G.wave);
  var f = FRIENDS[G.wave - 1]; banner('WAVE ' + G.wave, '「' + f.name + '」のケージを守るドローンを全滅させろ', 3); SFX.alarm();
}
function updateFlow(dt) {
  var f = FRIENDS[G.wave - 1];
  if (G.phase === 'intro') { G.timer -= dt; if (G.timer <= 0) { G.phase = 'fight'; G.spawnT = 0; } }
  else if (G.phase === 'fight') {
    var maxAlive = Math.min(3 + Math.floor(G.wave / 2), Q.tier === 0 ? 5 : 6);
    G.spawnT -= dt;
    if (G.queue.length && ENEMIES.length < maxAlive && G.spawnT <= 0) { spawnEnemy(G.queue.pop(), G.wave); G.spawnT = 1.1; }
    if (!G.queue.length && !ENEMIES.length) { G.phase = 'rescue'; banner('エリア確保', '緑に光るケージに近づいて「' + f.name + '」を助けよう', 3.5); SFX.ui(); }
  } else if (G.phase === 'rescue') {
    if (Math.hypot(P.x - f.x, P.z - f.z) < 2.5) {
      f.state = 'free'; G.rescued++; SFX.cage(); SFX.rescue(); P.hp = Math.min(100, P.hp + 45); addScore(500, f.name + ' を救出');
      fxSparks(f.x, 1.2, f.z, 0, 1, 0, 30, 6); fxFlash(f.x, 1.2, f.z, 4, 0.3, 0x9dffd0);
      G.phase = 'rest'; G.timer = G.wave >= 8 ? 2.8 : 2.4; banner('救出成功！', G.rescued + ' / 8 人', 2.2);
    }
  } else if (G.phase === 'rest') { G.timer -= dt; if (G.timer <= 0) { if (G.wave >= 8) endGame(true); else nextWave(); } }
}
function hurtPlayer(dmg, sx, sz) {
  if (P.hp <= 0 || G.state !== 'playing') return;
  P.hp -= dmg; P.hurtT = 0; G.vig = Math.min(1, 0.45 + dmg / 40); G.shake = Math.min(1.6, G.shake + 0.5 + dmg / 30);
  H.dmgT = 1.1; H.dmgX = sx; H.dmgZ = sz; SFX.hurt();
  if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) {} }
  if (P.hp <= 0) { P.hp = 0; P.deadT = 0.0001; input.fire = false; SFX.lose(); }
}
function endGame(win) {
  var acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0, bonus = 0;
  if (win) { bonus = Math.max(0, Math.round((720 - G.time) * 5)) + Math.round(P.hp) * 10; G.score += bonus; SFX.win(); }
  G.state = 'result'; ROOT.classList.remove('fr-play'); if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} }
  H.rTitle.innerHTML = win ? 'MISSION <span>COMPLETE</span>' : 'MISSION <span>FAILED</span>'; H.rSub.textContent = win ? '全員救出！' : 'WAVE ' + G.wave + ' で力尽きた';
  H.rScore.textContent = G.score;
  H.rStat.innerHTML = ''; [['救出した仲間', G.rescued + ' / 8'], ['撃破数', G.stats.kills], ['命中率', acc + '%'], ['タイム', Math.floor(G.time / 60) + ':' + ('0' + Math.floor(G.time % 60)).slice(-2)], ['クリアボーナス', bonus]].forEach(function (r) { el('span', null, H.rStat, r[0]); el('b', null, H.rStat, String(r[1])); });
  var best = store.get('best', 0), isBest = G.score > best; if (isBest) store.set('best', G.score);
  H.rNote.textContent = isBest ? 'この端末のベストスコア更新！' : 'この端末のベスト： ' + best;
  G.last = { score: G.score, rescued: G.rescued, kills: G.stats.kills, acc: acc, time: Math.round(G.time), win: !!win };
  if (typeof onGameResult === 'function') onGameResult(G.last);
  showScreen('result');
}
function pauseGame() { if (G.state !== 'playing') return; G.state = 'paused'; ROOT.classList.remove('fr-play'); input.fire = false; if (input.resetTouch) input.resetTouch(); if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} } showScreen('paused'); }
function resumeGame() { G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null); if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} } }
function toTitle() { clearEnemies(); resetFriends(); G.state = 'title'; G.phase = ''; G.wave = 0; ROOT.classList.remove('fr-play'); gun.root.visible = false; if (AU.ok) AU.hum.gain.value = 0; showScreen('title'); }

function updatePlayer(dt) {
  pollKeys();
  var lx = input.lookX, ly = input.lookY; input.lookX = input.lookY = 0;
  if (P.hp > 0) { P.yaw -= lx; P.pitch = clamp(P.pitch - ly, -1.35, 1.35); }
  P.lookDX = lx; P.lookDY = ly;
  var mx = P.hp > 0 ? input.mx : 0, mz = P.hp > 0 ? input.mz : 0, sp = (input.sprint && mz < -0.3) ? 6.9 : 4.5;
  var s = Math.sin(P.yaw), c = Math.cos(P.yaw), wx = (mx * c + mz * s) * sp, wz = (-mx * s + mz * c) * sp, k = 1 - Math.exp(-11 * dt);
  P.vx += (wx - P.vx) * k; P.vz += (wz - P.vz) * k;
  collideMove(P, P.x + P.vx * dt, P.z + P.vz * dt, 0.36, 0);
  P.speed = Math.hypot(P.vx, P.vz);
  var pb = P.bob; P.bob += P.speed * dt * 1.55;
  if (P.speed > 1 && Math.floor(pb / Math.PI) !== Math.floor(P.bob / Math.PI)) SFX.step(P.speed > 5.5);
  P.hurtT += dt; if (P.hp > 0 && P.hp < 60 && P.hurtT > 6) P.hp = Math.min(60, P.hp + 5 * dt);
  G.shake = damp(G.shake, 0, 7, dt);
  var eye = 1.66 + Math.sin(P.bob * 2) * 0.028 * Math.min(1, P.speed / 4.5), roll = 0;
  if (P.deadT > 0) { P.deadT += dt; var d = Math.min(1, P.deadT / 0.9); eye = lerp(eye, 0.35, d * d); roll = d * 1.1; if (P.deadT > 2.1 && G.state === 'playing') endGame(false); }
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
    G.time += dt; updatePlayer(dt); updateWeapon(dt); updateFlow(dt); updateEnemies(dt); updateBolts(dt); updateFX(dt);
    updateFriends(dt, P.x, P.z, G.wave - 1, G.phase); updateHUD(dt); autoQuality(dt);
  } else if (G.state === 'title' || G.state === 'result') {
    G.titleT += dt; var a = G.titleT * 0.07 + 1.2;
    if (G.state === 'title') { camera.position.set(Math.cos(a) * 20, 5.5, Math.sin(a) * 20 + 4); camera.rotation.set(0, 0, 0); camera.lookAt(0, 1.4, 0); }
    updateFX(dt); updateFriends(dt, camera.position.x, camera.position.z, -1, '');
  }
  updateSun();
  renderer.render(scene, camera);
}


// ===== 99_main.js =====
// ---- boot -------------------------------------------------------------------
function boot() {
  setupPage();
  var loading = el('div', 'fr-load', UI, 'LOADING…');
  loadScript(THREE_URL, function (err) {
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
      buildWorld(); buildWeapon(); buildEnemyAssets(); buildFriends(); buildUI(); setupInput();
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
      window.__fr = { G: G, P: P, Q: Q, ENEMIES: ENEMIES, FRIENDS: FRIENDS, MODEL_STATUS: MODEL_STATUS, input: input, gun: gun, errors: RUNTIME_ERRORS, start: startGame, hurt: hurtPlayer, end: endGame };
      requestAnimationFrame(frame);
    }, 30);
  });
}
if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);


})();
