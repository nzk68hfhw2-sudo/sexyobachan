/*! RAMUNE NIGHT — game.js (single-file build). Fictional game. See source.txt */
(function(){
"use strict";

// ===== 00_boot.js =====
// ---------------------------------------------------------------------------
// RAMUNE NIGHT（ラムネナイト）— 架空のラムネ＆チューハイ・シミュレーター
// これはフィクションのゲームです。登場する「ラムネ」はすべて架空のもので、
// 実在の薬物・製品とは一切関係ありません。
// ---------------------------------------------------------------------------
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '1.0.0';

var ROOT, UI, CANVAS_HOST;

// ---- diagnostics overlay --------------------------------------------------
function showFatal(title, detail) {
  try {
    var d = document.getElementById('rm-fatal');
    if (!d) {
      d = document.createElement('div'); d.id = 'rm-fatal';
      d.style.cssText = 'position:fixed;left:16px;right:16px;top:calc(env(safe-area-inset-top,0px) + 120px);z-index:2147483647;background:#1a0616;color:#ffe0f4;border:2px solid #e2a;padding:14px;font:13px/1.5 monospace;white-space:pre-wrap;border-radius:8px;max-height:60vh;overflow:auto;';
      (document.body || document.documentElement).appendChild(d);
    }
    d.textContent = '[RAMUNE NIGHT] ' + title + '\n' + (detail || '') + '\nUA: ' + navigator.userAgent;
  } catch (e) {}
}

// ---- page setup -----------------------------------------------------------
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
    lk.href = 'https://fonts.googleapis.com/css2?family=DotGothic16&family=Rampart+One&family=Zen+Maru+Gothic:wght@500;700;900&display=swap';
    head.appendChild(lk);
  } catch (e) {}
  var st = document.createElement('style'); st.id = 'rm-style'; st.textContent = BASE_CSS + '\n' + UI_CSS; head.appendChild(st);

  ROOT = document.createElement('div'); ROOT.id = 'rm-root';
  CANVAS_HOST = document.createElement('div'); CANVAS_HOST.id = 'rm-canvas';
  UI = document.createElement('div'); UI.id = 'rm-ui';
  ROOT.appendChild(CANVAS_HOST); ROOT.appendChild(UI);
  (document.body || document.documentElement).appendChild(ROOT);
  try { document.documentElement.classList.add('rm-lock'); document.body.classList.add('rm-lock'); } catch (e) {}

  var stop = function (e) { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (n) {
    ROOT.addEventListener(n, stop, { passive: false });
  });
  document.addEventListener('gesturestart', stop, { passive: false });
  ROOT.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.rm-scroll')) e.preventDefault(); }, { passive: false });
  var lastTouchEnd = 0;
  ROOT.addEventListener('touchend', function (e) {
    var t = Date.now();
    if (t - lastTouchEnd < 320 && !(e.target.closest && e.target.closest('input,select,button,.btn'))) e.preventDefault();
    lastTouchEnd = t;
  }, { passive: false });
}

var BASE_CSS = [
  'html.rm-lock,body.rm-lock{margin:0;padding:0;overflow:hidden;height:100%;background:#000;overscroll-behavior:none;}',
  '#rm-root{position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;background:#000;overflow:hidden;z-index:2147480000;',
  ' touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;',
  ' --top-safe:calc(env(safe-area-inset-top,0px) + 104px);--bot-safe:calc(env(safe-area-inset-bottom,0px) + 14px);',
  ' font-family:"Zen Maru Gothic",system-ui,-apple-system,"Hiragino Maru Gothic ProN",sans-serif;color:#fff;}',
  '#rm-root *{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
  '#rm-canvas{position:absolute;inset:0;}',
  '#rm-canvas canvas{display:block;width:100%;height:100%;touch-action:none;}',
  '#rm-ui{position:absolute;inset:0;pointer-events:none;}',
  '#rm-ui .pe{pointer-events:auto;}'
].join('\n');

// ---- load three.js (cdnjs r128) ---------------------------------------------
var THREE;
function loadThree(cb) {
  if (window.THREE && window.THREE.REVISION === '128') { THREE = window.THREE; return cb(); }
  var prev = window.THREE;
  var s = document.createElement('script');
  s.src = THREE_URL; s.async = true; s.crossOrigin = 'anonymous';
  var to = setTimeout(function () { showFatal('three.js の読み込みがタイムアウトしました', THREE_URL); }, 25000);
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


// ===== 02_data.js =====
// ---- game data: fictional "ramune", drinks, combinations ---------------------
// すべて架空。名前・効果・飲み合わせはゲーム用の創作です。
// time unit = in-game minutes. fx = feeling channels at peak per 1 piece.
//   eu 多幸  st 覚醒  se 鎮静  ps 幻覚  di 解離  de せん妄  em 共感  an 不安  na 吐き気  pa ぬくぬく(鎮痛)
// ph = physiology at peak: hr 心拍(bpm)  tp 体温(℃)  rr 呼吸(回/分)

var CLASSES = {
  psy: { name: '幻覚系', short: 'サイケ', col: '#b46bff', icon: '🌈' },
  up: { name: 'アッパー系', short: 'アッパー', col: '#30c8ff', icon: '⚡' },
  down: { name: 'ダウナー系', short: 'ダウナー', col: '#6a7dff', icon: '💤' },
  op: { name: 'ぬくぬく系（オピオイド系）', short: 'オピオイド', col: '#ffb347', icon: '☁️' },
  dis: { name: '解離系', short: '解離', col: '#7af0c8', icon: '🪐' },
  emp: { name: 'ハート系（エンパス系）', short: 'ハート', col: '#ff5fa8', icon: '💗' },
  del: { name: 'とばり系（せん妄系）', short: 'とばり', col: '#8a8a9a', icon: '🌑' },
  etc: { name: 'とくしゅ', short: 'とくしゅ', col: '#e8e8e8', icon: '✨' },
  alc: { name: 'お酒', short: 'お酒', col: '#d8f060', icon: '🍋' }
};

var SUBS = [
  // ---- 幻覚系 ----
  { id: 'yumeiro', name: 'ゆめいろラムネ', cls: 'psy', col: '#c77dff', col2: '#7df9ff', shape: 'star',
    on: 30, pk: 90, pl: 210, du: 420, fx: { ps: 1.0, eu: 0.45, an: 0.2, na: 0.15, st: 0.15 }, ph: { hr: 12, tp: 0.3, rr: 1 }, tail: { se: 0.1 }, stock: 3,
    desc: '七色に光る星形のラムネ。世界の輪郭がほどけて、色と模様があふれ出す。王道の幻覚系。' },
  { id: 'prism', name: 'プリズムラムネ', cls: 'psy', col: '#ffffff', col2: '#ff7df0', shape: 'gem',
    on: 1, pk: 4, pl: 7, du: 18, fx: { ps: 1.8, di: 0.6, eu: 0.4, an: 0.35 }, ph: { hr: 25, tp: 0.1 }, stock: 2,
    desc: '口に入れた瞬間に弾ける。ほんの数分間だけ、まったく別の次元へ飛ばされる。' },
  { id: 'kinoko', name: 'きのこぐもラムネ', cls: 'psy', col: '#e8c48a', col2: '#c0392b', shape: 'mushroom',
    on: 40, pk: 100, pl: 170, du: 330, fx: { ps: 0.8, eu: 0.6, na: 0.35, em: 0.2 }, ph: { hr: 8, tp: 0.2 }, stock: 3,
    desc: 'きのこの形。理由もなく笑いが止まらなくなり、床の木目がうねりはじめる。最初は少し気持ち悪い。' },
  // ---- アッパー系 ----
  { id: 'hyper', name: 'ハイパーソーダ', cls: 'up', col: '#29b6ff', col2: '#e0fbff', shape: 'round',
    on: 15, pk: 45, pl: 200, du: 360, fx: { st: 1.0, eu: 0.5, an: 0.25 }, ph: { hr: 32, tp: 0.5, rr: 3 }, tail: { eu: -0.35, an: 0.25, se: 0.35 }, dehyd: 0.8, stock: 3,
    desc: 'しゅわしゅわの青いラムネ。頭が冴えわたり、何でもできる気がしてくる。切れたあとはぐったり。' },
  { id: 'rocket', name: 'ロケットラムネ', cls: 'up', col: '#ff3b3b', col2: '#ffd23b', shape: 'bullet',
    on: 2, pk: 8, pl: 30, du: 75, fx: { st: 1.5, eu: 0.9, an: 0.3 }, ph: { hr: 40, tp: 0.6, rr: 4 }, tail: { eu: -0.6, an: 0.5, se: 0.3 }, stock: 2,
    desc: '一瞬で打ち上がり、すぐ落ちてくる。落ちたあとがかなりつらいので、もう一粒…となりがち。' },
  { id: 'mint', name: 'ミントシャキッとラムネ', cls: 'up', col: '#7dffcf', col2: '#ffffff', shape: 'round',
    on: 10, pk: 30, pl: 140, du: 240, fx: { st: 0.45, an: 0.05, eu: 0.1 }, ph: { hr: 12, tp: 0.1 }, stock: 4,
    desc: 'スースーするミント味。いちばんマイルドなアッパー。眠気ざましに。' },
  // ---- ダウナー系 ----
  { id: 'fuwa', name: 'ふわふわラムネ', cls: 'down', col: '#b9c6ff', col2: '#ffffff', shape: 'cloud',
    on: 20, pk: 60, pl: 170, du: 360, fx: { se: 0.7, eu: 0.25, an: -0.75 }, ph: { hr: -8, rr: -2.5 }, stock: 3,
    desc: '不安がすーっと溶けていく。体がソファに沈みこんでいく。お酒と混ぜると危ない。' },
  { id: 'nemu', name: 'ねむねむラムネ', cls: 'down', col: '#4b4ba8', col2: '#ffe066', shape: 'moon',
    on: 25, pk: 60, pl: 220, du: 420, fx: { se: 1.25, an: -0.4, eu: 0.1 }, ph: { hr: -10, rr: -3.5 }, stock: 2,
    desc: '強力なおやすみラムネ。まぶたが鉛のように重くなる。眠ったまま起きられなくなることも。' },
  { id: 'toro', name: 'とろけるゼリーラムネ', cls: 'down', col: '#9fffe0', col2: '#3fd4ff', shape: 'drop',
    on: 12, pk: 30, pl: 50, du: 120, fx: { eu: 0.7, se: 0.8, em: 0.3, na: 0.25 }, ph: { hr: -4, rr: -3.5 }, steep: 1.8, stock: 2,
    desc: 'ぷるぷるのゼリー状。気持ちいいけど、ちょっと増やすだけで効き目が跳ね上がる。お酒とは絶対に合わない。' },
  // ---- ぬくぬく系（オピオイド系） ----
  { id: 'nukunuku', name: 'ぬくぬくラムネ', cls: 'op', col: '#ffcf8a', col2: '#ff8a3d', shape: 'round',
    on: 20, pk: 50, pl: 140, du: 300, fx: { pa: 1.0, eu: 0.7, se: 0.55, na: 0.3 }, ph: { hr: -8, rr: -5, tp: -0.1 }, tail: { an: 0.2, na: 0.1 }, stock: 3,
    desc: '毛布にくるまれたような温かさ。痛みも悩みも遠くなる。呼吸がゆっくりになっていく。' },
  { id: 'masshiro', name: 'まっしろラムネ', cls: 'op', col: '#ffffff', col2: '#f0f0f0', shape: 'tiny',
    on: 8, pk: 25, pl: 70, du: 200, fx: { pa: 1.6, eu: 1.1, se: 0.95, na: 0.35 }, ph: { hr: -12, rr: -8.5 }, tail: { an: 0.35, na: 0.2 }, stock: 2,
    desc: '真っ白で小さな粒。とても強い。ほかの鎮静系やお酒と重なると、呼吸が止まりかける。' },
  { id: 'syrup', name: 'あまあまシロップラムネ', cls: 'op', col: '#c0392b', col2: '#ff9ff3', shape: 'drop',
    on: 30, pk: 80, pl: 160, du: 330, fx: { pa: 0.35, di: 0.55, eu: 0.35, na: 0.3, se: 0.25 }, ph: { hr: 6, rr: -2, tp: 0.2 }, stock: 3,
    desc: 'あまったるいシロップ味。体からふわっと抜け出すような、不思議なまどろみ。' },
  // ---- 解離系 ----
  { id: 'fuyuu', name: 'ふゆうラムネ', cls: 'dis', col: '#b8fff0', col2: '#5e7bff', shape: 'ring',
    on: 4, pk: 12, pl: 28, du: 70, fx: { di: 1.25, se: 0.3, eu: 0.25, na: 0.2 }, ph: { hr: 10, rr: -1 }, stock: 3,
    desc: '重力が消えて、体が自分のものじゃなくなる。たくさん飲むと「ラムネホール」に落ちる。' },
  { id: 'mirror', name: 'かがみのラムネ', cls: 'dis', col: '#d6dde6', col2: '#7af0c8', shape: 'gem',
    on: 30, pk: 80, pl: 170, du: 360, fx: { di: 0.8, ps: 0.3, eu: 0.3, an: 0.1 }, ph: { hr: 8, rr: -1 }, stock: 2,
    desc: '自分が自分を少し離れたところから見ている。部屋がゆっくり裏返っていく。' },
  // ---- ハート系 ----
  { id: 'heart', name: 'ハートラムネ', cls: 'emp', col: '#ff5fa8', col2: '#ffd1e8', shape: 'heart',
    on: 30, pk: 75, pl: 150, du: 270, fx: { em: 1.2, eu: 1.0, st: 0.45, ps: 0.15 }, ph: { hr: 28, tp: 1.0, rr: 2 }, tail: { eu: -0.5, an: 0.2, se: 0.2 }, dehyd: 1.5, stock: 3,
    desc: 'ピンクのハート形。世界中のすべてが大好きになる。そのかわり体がとても熱くなる。水を忘れずに。' },
  // ---- とばり系 ----
  { id: 'tobari', name: 'よるのとばりラムネ', cls: 'del', col: '#1b1b24', col2: '#6a00ff', shape: 'round',
    on: 60, pk: 180, pl: 330, du: 720, fx: { de: 1.2, se: 0.35, an: 0.4, na: 0.1, ps: 0.1 }, ph: { hr: 30, tp: 0.6 }, dehyd: 1.0, stock: 2,
    desc: '真っ黒なラムネ。見えないはずのものが見え、いないはずの誰かと会話する。とても長く、あまり楽しくない。' },
  // ---- とくしゅ ----
  { id: 'booster', name: 'ブースターラムネ', cls: 'etc', col: '#ffe14d', col2: '#ff8800', shape: 'bolt',
    on: 20, pk: 40, pl: 230, du: 360, fx: { na: 0.2 }, ph: { hr: 4 }, boost: true, stock: 2,
    desc: 'それ自体はほとんど何も起きない。でも、ほかのラムネの効き目と長さを何倍にもしてしまう。' },
  { id: 'reset', name: 'リセットラムネ', cls: 'etc', col: '#ff2d55', col2: '#ffffff', shape: 'cross',
    on: 1, pk: 2, pl: 40, du: 90, fx: {}, ph: {}, reset: true, stock: 2,
    desc: '救急用。ぬくぬく系（オピオイド系）の効果をすぐに打ち消す。打ち消された反動でかなり気分が悪くなる。' },
  { id: 'zero', name: 'ただのラムネ', cls: 'etc', col: '#d0f4ff', col2: '#8ad8ff', shape: 'round',
    on: 2, pk: 5, pl: 8, du: 15, fx: { eu: 0.04 }, ph: {}, placebo: true, stock: 5,
    desc: '駄菓子屋さんのふつうのラムネ。ぶどう味。…本当にただのラムネ。' }
];
var SUB = {}; SUBS.forEach(function (s) { SUB[s.id] = s; });

// drinks (from the fridge). alc = alcohol units (1 = ロング缶じゃない9%の1缶)
var DRINKS = [
  { id: 'z9lemon', name: 'ZER9 ドライレモン', sub: '9%・350ml', alc: 1.0, col: '#e6f2f5', col2: '#f5e100', stock: 6, desc: '甘くないキレのあるレモン。飲みやすすぎて危ない、いつもの一本。' },
  { id: 'z9grape', name: 'ZER9 グレフル', sub: '9%・350ml', alc: 1.0, col: '#ffe4ec', col2: '#ff6f91', stock: 4, desc: 'ほろ苦いグレープフルーツ。気づくと2本目。' },
  { id: 'z9ume', name: 'ZER9 ストロングうめ', sub: '12%・500ml', alc: 1.8, col: '#3a1030', col2: '#ff4fa0', stock: 3, desc: 'ロング缶。これ1本でふつうの缶の2本分近い。' },
  { id: 'sour', name: 'ふわりサワー もも', sub: '3%・350ml', alc: 0.33, col: '#ffd6e0', col2: '#ffffff', stock: 3, desc: 'ジュースみたいな弱いお酒。' },
  { id: 'giga', name: 'ギガボルト', sub: 'エナジードリンク', alc: 0, col: '#111111', col2: '#00ff66', stock: 3, energy: true, desc: 'カフェインたっぷり（架空）。お酒と混ぜると酔いに気づきにくくなる。' }
];
var DRINK = {}; DRINKS.forEach(function (d) { DRINK[d.id] = d; });
// energy drink behaves like a mild upper
SUBS.push({ id: 'gigafx', name: 'ギガボルト', cls: 'up', hidden: true, col: '#00ff66', col2: '#111', shape: 'round',
  on: 10, pk: 30, pl: 90, du: 200, fx: { st: 0.35, an: 0.08 }, ph: { hr: 10, tp: 0.1 }, tail: { se: 0.1 } });
// withdrawal after a reset
SUBS.push({ id: 'withdraw', name: '反動', cls: 'etc', hidden: true, col: '#888', col2: '#444', shape: 'round',
  on: 1, pk: 3, pl: 40, du: 120, fx: { na: 0.75, an: 0.6, eu: -0.45 }, ph: { hr: 18, tp: 0.2 } });
SUBS.forEach(function (s) { SUB[s.id] = s; });

// ---- combinations ------------------------------------------------------------
// need: list of {c: class} / {s: sub id} with min level, or {distinct: class, n: count}
// m: modifier accumulator (see body.js). s: strength 0..1.5
var COMBOS = [
  { id: 'neon', name: 'ネオンストーム', need: [{ c: 'psy' }, { c: 'up' }], danger: 1,
    hint: '幻覚系 × アッパー系', desc: 'アッパーが幻覚をブーストする。色が電撃のように走るが、心臓もばくばくする。',
    f: function (m, s) { m.mul.ps += 0.35 * s; m.add.an += 0.3 * s; m.add.st += 0.15 * s; m.ph.hr += 15 * s; } },
  { id: 'heartflip', name: 'ハートフリップ', need: [{ c: 'psy' }, { c: 'emp' }], danger: 1,
    hint: '幻覚系 × ハート系', desc: 'ハートのぬくもりと幻覚の色彩がまざりあう、最高にカラフルな夜。体温には注意。',
    f: function (m, s) { m.add.eu += 0.4 * s; m.add.em += 0.3 * s; m.mul.ps += 0.25 * s; m.ph.tp += 0.4 * s; } },
  { id: 'elevator', name: '宇宙エレベーター', need: [{ c: 'psy' }, { c: 'dis' }], danger: 1,
    hint: '幻覚系 × 解離系', desc: '体を置き去りにして、万華鏡の向こうへ上昇していく。戻ってこられるかは少し不安。',
    f: function (m, s) { m.mul.ps += 0.45 * s; m.add.di += 0.35 * s; m.vis.kal += 0.8 * s; } },
  { id: 'calm', name: 'おだやかトリップ', need: [{ c: 'psy' }, { c: 'down' }], danger: 0,
    hint: '幻覚系 × ダウナー系', desc: 'ダウナーが幻覚の角をまるくする。不安は消えるが、色もちょっと薄くなる。',
    f: function (m, s) { m.mul.ps -= 0.4 * s; m.add.an -= 0.5 * s; } },
  { id: 'fakesober', name: 'ニセモノのシラフ', need: [{ c: 'alc' }, { c: 'up' }], danger: 2,
    hint: 'お酒 × アッパー系', desc: 'アッパーのせいで酔いに気づけない。まだいける気がして飲みすぎ、心臓にも負担がかかる。',
    f: function (m, s) { m.mask.alc += 0.55 * s; m.ph.hr += 14 * s; m.add.eu += 0.15 * s; } },
  { id: 'coaster', name: 'ジェットコースター', need: [{ c: 'up' }, { c: 'down' }], danger: 2,
    hint: 'アッパー系 × ダウナー系', desc: 'アクセルとブレーキを同時に踏んでいる状態。打ち消しあうようで、心臓のリズムが乱れる。',
    f: function (m, s) { m.mul.st -= 0.3 * s; m.mul.se -= 0.3 * s; m.irregular += s; } },
  { id: 'blackout', name: 'ブラックアウト警報', need: [{ c: 'down' }, { c: 'alc' }], danger: 3,
    hint: 'ダウナー系 × お酒', desc: 'お酒とダウナーは掛け算で効く。記憶がとび、呼吸がどんどん浅くなる。現実でもとても危険な組み合わせ。',
    f: function (m, s) { m.add.se += 0.5 * s; m.rrMul += 0.6 * s; m.vis.gap += s; } },
  { id: 'sinking', name: 'しずむ夜', need: [{ c: 'op' }, { c: 'alc' }], danger: 3,
    hint: 'ぬくぬく系 × お酒', desc: 'あたたかい眠気の底に沈んでいく。呼吸を忘れそうになる。現実でもとても危険な組み合わせ。',
    f: function (m, s) { m.add.se += 0.4 * s; m.rrMul += 0.8 * s; } },
  { id: 'deepsea', name: '深海', need: [{ c: 'op' }, { c: 'down' }], danger: 3,
    hint: 'ぬくぬく系 × ダウナー系', desc: '鎮静が重なり、深い海の底のように静かになる。静かすぎて、呼吸も止まりかける。',
    f: function (m, s) { m.add.se += 0.5 * s; m.rrMul += 1.0 * s; } },
  { id: 'triple', name: 'トリプル・ディープ', need: [{ c: 'op' }, { c: 'down' }, { c: 'alc' }], danger: 3,
    hint: 'ぬくぬく系 × ダウナー系 × お酒', desc: '三つの鎮静が重なった最悪の組み合わせ。ほぼ確実に呼吸が止まる。',
    f: function (m, s) { m.rrMul += 0.9 * s; m.add.se += 0.4 * s; } },
  { id: 'jelly', name: 'とろける沼', need: [{ s: 'toro' }, { c: 'alc' }], danger: 3,
    hint: 'とろけるゼリーラムネ × お酒', desc: 'ゼリーラムネとお酒は最悪の相性。気持ちよさの直後、意識ごと沼に沈む。',
    f: function (m, s) { m.add.se += 0.8 * s; m.rrMul += 1.2 * s; } },
  { id: 'overheat', name: 'オーバーヒート', need: [{ c: 'up' }, { c: 'emp' }], danger: 2,
    hint: 'アッパー系 × ハート系', desc: 'テンションは最高潮。でも体温がぐんぐん上がっていく。水とベランダの風が大事。',
    f: function (m, s) { m.ph.tp += 0.9 * s; m.ph.hr += 8 * s; m.add.eu += 0.2 * s; } },
  { id: 'runaway', name: '暴走列車', need: [{ distinct: 'up', n: 2 }], danger: 2,
    hint: 'アッパー系 × 別のアッパー系', desc: 'アッパーの重ねがけ。止まらない、止められない。心臓が限界に近づく。',
    f: function (m, s) { m.ph.hr += 14 * s; m.add.an += 0.4 * s; m.add.st += 0.2 * s; } },
  { id: 'spin', name: 'ぐるぐる回転', need: [{ c: 'dis' }, { c: 'alc' }], danger: 1,
    hint: '解離系 × お酒', desc: '部屋が回る、天井が回る、自分も回る。だいたい吐く。',
    f: function (m, s) { m.add.na += 0.8 * s; m.add.di += 0.3 * s; m.vis.spin += s; } },
  { id: 'void', name: '無重力の底', need: [{ c: 'dis' }, { c: 'down' }], danger: 2,
    hint: '解離系 × ダウナー系', desc: '体の感覚が消えて、暗い底へゆっくり落ちていく。呼吸も少し弱まる。',
    f: function (m, s) { m.add.di += 0.4 * s; m.rrMul += 0.4 * s; } },
  { id: 'nightmare', name: '悪夢のうたげ', need: [{ c: 'del' }, { c: 'alc' }], danger: 1,
    hint: 'とばり系 × お酒', desc: '影の住人たちが宴会をはじめる。あなたの缶を勝手に飲んでいるのは誰？',
    f: function (m, s) { m.add.de += 0.5 * s; m.add.an += 0.3 * s; } },
  { id: 'otherworld', name: '異界のパーティー', need: [{ c: 'del' }, { c: 'psy' }], danger: 1,
    hint: 'とばり系 × 幻覚系', desc: '幻覚の色と、とばりの影がまざりあう。もう、どこまでが部屋なのかわからない。',
    f: function (m, s) { m.add.de += 0.4 * s; m.mul.ps += 0.3 * s; m.add.an += 0.4 * s; } },
  { id: 'amplify', name: '増幅トリップ', need: [{ s: 'booster' }, { c: 'psy' }], danger: 1,
    hint: 'ブースターラムネ × 幻覚系', desc: 'ブースターが幻覚を何倍にも引きのばす。終わりが見えない。',
    f: function (m, s) { m.mul.ps += 0.3 * s; m.vis.kal += 0.4 * s; } },
  { id: 'storm', name: 'セロトニン・ストーム（架空）', need: [{ s: 'booster' }, { c: 'emp' }], danger: 3,
    hint: 'ブースターラムネ × ハート系', desc: 'ブースターとハートの組み合わせは体の中で嵐を起こす。体温と心拍が暴走する。',
    f: function (m, s) { m.ph.tp += 1.6 * s; m.ph.hr += 22 * s; m.add.an += 0.5 * s; m.add.na += 0.3 * s; } },
  { id: 'crisis', name: 'ハイパー・クライシス', need: [{ s: 'booster' }, { c: 'up' }], danger: 3,
    hint: 'ブースターラムネ × アッパー系', desc: 'ブースターでアッパーが暴走。頭がガンガンして、心臓が破裂しそうになる。',
    f: function (m, s) { m.ph.hr += 35 * s; m.add.an += 0.5 * s; m.vis.flash += s; } },
  { id: 'speedball', name: 'ジェットボール', need: [{ c: 'op' }, { c: 'up' }], danger: 2,
    hint: 'ぬくぬく系 × アッパー系', desc: 'アッパーがぬくぬくの眠気を隠す。アッパーが先に切れると、隠れていた鎮静が一気に来る。',
    f: function (m, s) { m.mask.op += 0.5 * s; m.rrMul += 0.25 * s; m.add.eu += 0.3 * s; } },
  { id: 'murky', name: 'にごりトリップ', need: [{ c: 'psy' }, { c: 'alc' }], danger: 1,
    hint: '幻覚系 × お酒', desc: 'お酒が幻覚をにごらせる。色はくすみ、胃がむかむかしてくる。',
    f: function (m, s) { m.mul.ps -= 0.25 * s; m.add.na += 0.3 * s; } },
  { id: 'lovedrunk', name: 'ほろ酔いハート', need: [{ c: 'emp' }, { c: 'alc' }], danger: 1,
    hint: 'ハート系 × お酒', desc: 'ハートでお酒がすすむ。気分はいいけど、体の水分がどんどん抜けていく。',
    f: function (m, s) { m.add.eu += 0.2 * s; m.dehyd += 1.2 * s; m.add.na += 0.15 * s; } },
  { id: 'cradle', name: 'ゆりかごの夢', need: [{ c: 'op' }, { c: 'psy' }], danger: 1,
    hint: 'ぬくぬく系 × 幻覚系', desc: 'あたたかい眠気のなかで、夢のような幻がゆらゆら揺れる。',
    f: function (m, s) { m.mul.ps -= 0.15 * s; m.add.eu += 0.3 * s; m.add.se += 0.15 * s; } },
  { id: 'mirrorlove', name: '鏡の中の愛', need: [{ c: 'dis' }, { c: 'emp' }], danger: 1,
    hint: '解離系 × ハート系', desc: '離れたところから自分を見て、その自分のことも大好きになる。',
    f: function (m, s) { m.add.em += 0.3 * s; m.add.di += 0.15 * s; m.add.eu += 0.2 * s; } },
  { id: 'reset', name: '強制リセット', need: [], special: true, danger: 1,
    hint: 'リセットラムネ × ぬくぬく系', desc: 'ぬくぬく系を一瞬で打ち消した。命は助かるが、反動で最悪の気分になる。' },
  { id: 'placebo', name: 'プラセボ効果', need: [], special: true, danger: 0,
    hint: 'ただのラムネ ×（思い込み）', desc: 'ただのラムネなのに、なんだか効いてきた気がする。人間の脳っておもしろい。' },
  { id: 'chain', name: 'ラムネ・パーティー', need: [], special: true, danger: 2,
    hint: '4系統以上を同時に', desc: '4種類以上の系統が同時に効いている。もう自分が何を飲んだのかもわからない。' }
];
var COMBO = {}; COMBOS.forEach(function (c) { COMBO[c.id] = c; });

// ---- inner monologue (shown as subtitles) ------------------------------------
var VOICE = {
  idle: ['今夜はなにしよう。', '冷蔵庫にZER9が冷えてる。', 'テーブルの上にラムネのケースがある。', '静かな夜だな。'],
  ps: ['カーテンの模様が、フラクタルに増殖してる…', '壁が…呼吸してる？', '色に音がある。ピンクは「ぽーん」って鳴る。', '天井がとけて、星が見える…', '手のひらの線が、地図みたいに動いてる', '時計の数字が泳いでいった'],
  st: ['いま部屋の掃除をしたら一瞬で終わる気がする！', 'しゃべりたい。だれかにしゃべりたい。', '心臓の音がうるさい', '全然ねむくない。むしろ朝まで余裕。', '歯をかみしめてた…'],
  se: ['ソファと一体化してきた…', 'まぶたが…おもい…', 'なにもかも、どうでもいい…', 'あと5分だけ…目をとじる…'],
  pa: ['ぬくぬく…毛布の中みたい…', 'からだがあったかい…', 'いやなこと、ぜんぶ遠くにある…'],
  di: ['自分の手が、他人の手みたいだ', '自分の体を、後ろから見てる…？', '部屋がとても遠い。廊下が1キロある。', 'いま、どっちが上だっけ'],
  de: ['さっきから、だれかソファに座ってる…？', 'あ、タバコ吸おう。…タバコ持ってないのに。', 'スマホが鳴ってる。…鳴ってない。', '壁を小さい虫が歩いてる…', 'だれかと話してたんだけど、だれだっけ'],
  em: ['みんな大好き。冷蔵庫も大好き。', 'このクッション、さわり心地が天才', '今ならだれとでも仲よくなれる', '音楽が…体にしみる…'],
  an: ['なんか…やばい気がする', 'ドアの向こうにだれかいない？', '落ち着け…落ち着け…', '心臓の音、大きすぎない？'],
  na: ['うっ…気持ち悪い', '吐きそう…トイレどこだっけ', '胃がぐるぐるする'],
  drunk: ['まだ全然よってないし', 'ZER9、もう1本いっちゃう？', '床がななめになってる', 'へへへ…'],
  hot: ['あつい…ベランダで風にあたりたい', 'のどがカラカラ…水…'],
  danger: ['息が…うまく…できない…', 'これ、本当にやばいかも', '心臓が…いたい…', '体が…あつすぎる…']
};
var EFFECT_NAMES = { eu: '多幸感', st: '覚醒', se: '鎮静', ps: '幻覚', di: '解離', de: 'せん妄', em: '共感', an: '不安', na: '吐き気', pa: 'ぬくぬく', drunk: '酔い' };


// ===== 03_body.js =====
// ---- body simulation (pure logic, no DOM / no three.js) ------------------------
var CH = ['eu', 'st', 'se', 'ps', 'di', 'de', 'em', 'an', 'na', 'pa'];
var BOOSTABLE = { psy: 1, emp: 1, up: 1, del: 1 };
var DRUG_CLASSES = ['psy', 'up', 'down', 'op', 'dis', 'emp', 'del'];

function newBody() {
  var F = {}; CH.forEach(function (c) { F[c] = 0; });
  return {
    doses: [], stom: 0, bac: 0, tol: {}, hyd: 1, hr: 72, tp: 36.6, rr: 15, con: 100,
    danger: 0, dangerCause: '', dead: false, unconscious: false, uncTime: 0,
    F: F, L: {}, Ls: {}, motor: 0, envCool: 0, waterCool: 0, naRelief: 0, irrT: 0, irr: 0,
    comboS: {}, comboT: {}, found: [], events: [], warnCD: {}, onBed: false,
    vis: { psy: 0, dis: 0, del: 0, drunk: 0, stim: 0, sed: 0, emp: 0, anx: 0, nau: 0, kal: 0, gap: 0, spin: 0, flash: 0, irr: 0, pa: 0 },
    stats: { maxHR: 72, maxTp: 36.6, minRR: 15, maxBAC: 0, fun: 0, cans: 0, pills: 0, vomits: 0, waters: 0, taken: {}, dangerMin: 0, peakPsy: 0 },
    t: 0
  };
}

function subCurve(t, s) {
  if (t <= 0) return 0;
  if (t < s.on) { var a = t / s.on; return 0.06 * a * a; }
  if (t < s.pk) return 0.06 + 0.94 * smooth((t - s.on) / (s.pk - s.on));
  if (t < s.pl) return 1;
  if (t < s.du) return 1 - smooth((t - s.pl) / (s.du - s.pl));
  return 0;
}
function tailCurve(t, s) {
  if (!s.tail) return 0;
  var a = s.pl, b = s.du * 1.4;
  if (t < a || t > b) return 0;
  return Math.sin(PI * (t - a) / (b - a));
}

function bodyEvent(B, type, data) { B.events.push({ type: type, data: data || {} }); }

// ---- intake -------------------------------------------------------------------
function takeSub(B, id) {
  var s = SUB[id]; if (!s) return;
  B.doses.push({ s: id, t: 0, amt: 1, onsetSaid: false, peakSaid: false, fadeSaid: false });
  if (!s.hidden) { B.stats.pills++; B.stats.taken[id] = (B.stats.taken[id] || 0) + 1; }
  if (s.reset) {
    var had = 0;
    B.doses.forEach(function (d) { var ss = SUB[d.s]; if (ss.cls === 'op') { had += subCurve(d.t, ss) * d.amt; d.amt *= 0.04; } });
    if (had > 0.08) {
      B.doses.push({ s: 'withdraw', t: 0, amt: clamp(0.6 + had * 0.5, 0.6, 1.6), onsetSaid: true, peakSaid: true, fadeSaid: true });
      discover(B, 'reset');
    }
  }
  if (s.placebo) {
    var others = 0; for (var c in B.L) if (c !== 'etc') others += B.L[c];
    if (others < 0.1 && B.bac < 0.02) B.placeboAt = B.t + 8;
  }
}
function drinkCan(B, id) {
  var d = DRINK[id]; if (!d) return;
  if (d.alc > 0) { B.stom += d.alc; B.stats.cans++; }
  if (d.energy) takeSub(B, 'gigafx');
  B.hyd = Math.min(1, B.hyd + (d.alc > 0 ? 0.04 : 0.12));
  B.stats.taken[id] = (B.stats.taken[id] || 0) + 1;
}
function drinkWater(B) {
  B.hyd = Math.min(1, B.hyd + 0.3);
  B.waterCool = 1;
  B.naRelief = Math.max(B.naRelief, 0.15);
  B.stats.waters++;
}
function vomit(B) {
  B.stom *= 0.2;
  B.doses.forEach(function (d) {
    var s = SUB[d.s];
    if (d.t < s.pk * 1.2) d.amt *= lerp(0.3, 1, clamp(d.t / (s.pk * 1.2), 0, 1));
  });
  B.naRelief = 0.9;
  B.stats.vomits++;
  if (B.unconscious && B.bac > 0.18 && !B.onBed) { B.danger += 15; B.lastAspirate = true; }
  bodyEvent(B, 'vomit');
}

function discover(B, id) {
  if (B.found.indexOf(id) >= 0) return;
  B.found.push(id);
  bodyEvent(B, 'combo', { id: id });
}

// ---- main step ----------------------------------------------------------------
function bodyStep(B, dt) {
  if (B.dead) return;
  while (dt > 0) { var h = Math.min(dt, 1); bodyStep1(B, h); dt -= h; if (B.dead) return; }
}

function bodyStep1(B, dt) {
  B.t += dt;
  var F = {}, P = { hr: 0, tp: 0, rr: 0 }, rrDep = 0, L = {}, Ls = {}, distinct = {}, seBy = {}, dehyd = 0;
  CH.forEach(function (c) { F[c] = 0; });

  // booster level first (it changes others)
  var boost = 0;
  B.doses.forEach(function (d) { var s = SUB[d.s]; if (s.boost) boost += subCurve(d.t, s) * d.amt; });
  boost = Math.min(boost, 1.6);
  var boostMul = 1 + 0.7 * boost;

  for (var i = B.doses.length - 1; i >= 0; i--) {
    var d = B.doses[i], s = SUB[d.s];
    var slow = (boost > 0.05 && BOOSTABLE[s.cls]) ? (1 - 0.35 * Math.min(1, boost)) : 1;
    d.t += dt * slow;
    if (d.t > s.du * 1.45 + 5) { B.doses.splice(i, 1); continue; }
    var c = subCurve(d.t, s);
    var amt = s.steep ? Math.pow(d.amt, s.steep) : d.amt;
    var tolF = 1 / (1 + (B.tol[s.cls] || 0) * 1.0);
    var mul = BOOSTABLE[s.cls] ? boostMul : 1;
    var lvl = c * amt * tolF * mul;
    L[s.cls] = (L[s.cls] || 0) + lvl;
    Ls[s.id] = (Ls[s.id] || 0) + lvl;
    if (lvl > 0.25 && !s.hidden) { distinct[s.cls] = distinct[s.cls] || {}; distinct[s.cls][s.id] = 1; }
    if (s.id === 'gigafx' && lvl > 0.25) { distinct.up = distinct.up || {}; distinct.up.gigafx = 1; }
    for (var ch in s.fx) { F[ch] += s.fx[ch] * lvl; if (ch === 'se') seBy[s.cls] = (seBy[s.cls] || 0) + s.fx[ch] * lvl; }
    if (s.ph.hr) P.hr += s.ph.hr * lvl;
    if (s.ph.tp) P.tp += s.ph.tp * lvl;
    if (s.ph.rr) { if (s.ph.rr < 0) rrDep += s.ph.rr * lvl; else P.rr += s.ph.rr * lvl; }
    var tc = tailCurve(d.t, s) * amt * tolF;
    if (tc > 0) for (var tch in s.tail) F[tch] += s.tail[tch] * tc;
    if (s.dehyd) dehyd += s.dehyd * lvl;
    if (!s.hidden && s.cls !== 'etc') B.tol[s.cls] = (B.tol[s.cls] || 0) + lvl * dt * 0.0011;
    // UI events
    if (!s.hidden) {
      if (!d.onsetSaid && c > 0.25) { d.onsetSaid = true; bodyEvent(B, 'onset', { id: s.id }); }
      if (!d.peakSaid && d.t >= s.pk) { d.peakSaid = true; bodyEvent(B, 'peak', { id: s.id }); }
      if (!d.fadeSaid && d.t > s.pl && c < 0.3) { d.fadeSaid = true; bodyEvent(B, 'fade', { id: s.id }); }
    }
  }
  for (var tk in B.tol) B.tol[tk] *= (1 - 0.0006 * dt);

  // ---- alcohol ----
  var absorb = B.stom * Math.min(1, dt * 0.05);
  B.stom -= absorb; B.bac += absorb * 0.052;
  B.bac = Math.max(0, B.bac - dt * 0.02 / 60);
  var b = B.bac;
  L.alc = b / 0.06;

  // ---- combinations ----
  var m = { mul: {}, add: {}, ph: { hr: 0, tp: 0, rr: 0 }, rrMul: 1, mask: { alc: 0, op: 0 }, vis: { kal: 0, gap: 0, spin: 0, flash: 0 }, irregular: 0, dehyd: 0 };
  CH.forEach(function (c) { m.mul[c] = 1; m.add[c] = 0; });
  var activeClasses = 0;
  DRUG_CLASSES.concat(['alc']).forEach(function (c) { if ((L[c] || 0) > 0.3) activeClasses++; });
  if (activeClasses >= 4) discover(B, 'chain');
  for (var ci = 0; ci < COMBOS.length; ci++) {
    var cb = COMBOS[ci];
    if (cb.special || !cb.need.length) continue;
    var st = 9;
    for (var ni = 0; ni < cb.need.length; ni++) {
      var nd = cb.need[ni], v;
      if (nd.distinct) { var n = distinct[nd.distinct] ? Object.keys(distinct[nd.distinct]).length : 0; v = n >= nd.n ? clamp((L[nd.distinct] || 0) / 1.0, 0, 1.5) : 0; }
      else if (nd.s) v = clamp((Ls[nd.s] || 0) / 0.7, 0, 1.5);
      else v = clamp((L[nd.c] || 0) / 0.7, 0, 1.5);
      if (v < st) st = v;
    }
    B.comboS[cb.id] = st;
    if (st > 0.15) {
      cb.f(m, st);
      if (st > 0.6) { B.comboT[cb.id] = (B.comboT[cb.id] || 0) + dt; if (B.comboT[cb.id] > 3) discover(B, cb.id); }
    }
  }
  if (B.placeboAt && B.t >= B.placeboAt) { B.placeboAt = 0; discover(B, 'placebo'); F.eu += 0.1; }

  // ---- alcohol channels (masked by uppers) ----
  var maskA = 1 - Math.min(0.8, m.mask.alc);
  F.eu += Math.max(0, 3.2 * Math.min(b, 0.16) - Math.max(0, b - 0.2) * 3);
  F.se += b * 3.0 * maskA;
  var motor = b * 6.2 * maskA + F.di * 0.35 + F.se * 0.15;
  F.na += Math.max(0, b - 0.13) * 5.5;
  F.an -= Math.min(b * 1.6, 0.5);
  rrDep -= Math.max(0, b - 0.17) * 28;
  P.hr += b * 35;
  if (m.mask.op > 0 && seBy.op) F.se -= seBy.op * Math.min(0.7, m.mask.op);

  // ---- apply combination modifiers ----
  CH.forEach(function (c) { F[c] = F[c] * Math.max(0, m.mul[c]) + m.add[c]; });
  F.na = Math.max(0, F.na - B.naRelief * 1.2);
  CH.forEach(function (c) { if (F[c] < 0) F[c] = 0; });
  P.hr += m.ph.hr; P.tp += m.ph.tp;

  // irregular heart (coaster)
  B.irrT -= dt;
  if (m.irregular > 0.3 && B.irrT <= 0) { B.irrT = rnd(4, 14); B.irr = rnd(-25, 40) * m.irregular; }
  B.irr *= Math.exp(-dt * 0.25);

  // ---- vitals ----
  var hrT = 70 + P.hr + F.st * 8 + F.an * 14 - F.se * 6 + Math.max(0, B.tp - 37) * 6 + B.irr;
  var tpT = 36.6 + P.tp + (1 - B.hyd) * 1.4 - B.envCool * 0.9 - B.waterCool * 0.25 + F.st * 0.15;
  var rrT = 15 + P.rr + F.st * 2 + F.an * 3 + rrDep * m.rrMul - (B.unconscious ? 1.5 : 0);
  var conT = 100 - F.se * 28 - F.pa * 6 - F.di * 22 - b * 165 * maskA + F.st * 16 + F.an * 4 - Math.max(0, 9 - B.rr) * 7;
  B.hr = lerp(B.hr, clamp(hrT, 35, 260), 1 - Math.exp(-dt * 0.3));
  B.tp = lerp(B.tp, clamp(tpT, 34.5, 43), 1 - Math.exp(-dt * 0.06));
  B.rr = lerp(B.rr, clamp(rrT, 0, 40), 1 - Math.exp(-dt * 0.22));
  B.con = lerp(B.con, clamp(conT, 0, 100), 1 - Math.exp(-dt * 0.35));

  // ---- hydration & misc decay ----
  B.hyd = clamp(B.hyd - dt * (0.00035 + dehyd * 0.0016 + b * 0.004 + m.dehyd * 0.0012 + Math.max(0, B.tp - 37.6) * 0.0012), 0, 1);
  B.waterCool = Math.max(0, B.waterCool - dt * 0.03);
  B.naRelief = Math.max(0, B.naRelief - dt * 0.02);

  // ---- consciousness ----
  if (!B.unconscious && B.con < 5) { B.unconscious = true; B.uncTime = 0; bodyEvent(B, 'pass'); }
  else if (B.unconscious) { B.uncTime += dt; if (B.con > 24) { B.unconscious = false; bodyEvent(B, 'wake', { mins: B.uncTime }); } }

  // ---- nausea → vomiting ----
  if (F.na > 0.95 && B.naRelief < 0.3 && Math.random() < (F.na - 0.95) * 0.22 * dt) vomit(B);

  // ---- danger ----
  var gHR = B.hr > 190 ? (B.hr - 190) * 0.07 : 0;
  var gTP = B.tp > 39.8 ? (B.tp - 39.8) * 2.3 : 0;
  var gRR = B.rr < 7.5 ? (7.5 - B.rr) * 1.0 : 0;
  var gain = gHR + gTP + gRR;
  if (gain > 0) {
    B.danger += gain * dt; B.stats.dangerMin += dt;
    B.dangerCause = gRR >= gHR && gRR >= gTP ? 'rr' : gHR >= gTP ? 'hr' : 'tp';
  } else B.danger = Math.max(0, B.danger - dt * 1.3);
  if (B.lastAspirate) { B.lastAspirate = false; if (B.danger >= 100) B.dangerCause = 'vomit'; }
  if (B.danger >= 100) { B.danger = 100; B.dead = true; bodyEvent(B, 'dead', { cause: B.dangerCause || 'rr' }); }

  // ---- warnings ----
  for (var wk in B.warnCD) B.warnCD[wk] -= dt;
  function warn(k, cond, msg) { if (cond && !(B.warnCD[k] > 0)) { B.warnCD[k] = 25; bodyEvent(B, 'warn', { k: k, msg: msg }); } }
  warn('hr', B.hr > 165, '心拍がとても速い（' + Math.round(B.hr) + '）');
  warn('tp', B.tp > 39.2, '体温が高すぎる（' + B.tp.toFixed(1) + '℃）');
  warn('rr', B.rr < 9.5, '呼吸が弱くなっている（' + B.rr.toFixed(1) + '回/分）');
  warn('hyd', B.hyd < 0.35, 'のどがカラカラ。水を飲もう');
  warn('bac', b > 0.25, '飲みすぎ。もう限界');

  // ---- stats & fun ----
  var S = B.stats;
  S.maxHR = Math.max(S.maxHR, B.hr); S.maxTp = Math.max(S.maxTp, B.tp); S.minRR = Math.min(S.minRR, B.rr); S.maxBAC = Math.max(S.maxBAC, b);
  S.peakPsy = Math.max(S.peakPsy, F.ps);
  if (!B.unconscious) {
    var fun = F.eu * 1.0 + Math.min(F.ps, 2) * 0.8 + F.em * 0.9 + F.st * 0.3 + F.di * 0.45 + F.pa * 0.6 + Math.min(b, 0.12) * 4 - F.an * 1.0 - F.na * 0.9 - F.de * 0.3 - B.danger * 0.012;
    S.fun += clamp(fun, -1.5, 4) * dt * 6;
  }

  B.F = F; B.L = L; B.Ls = Ls; B.motor = motor; B.m = m;
  var V = B.vis;
  V.psy = F.ps; V.dis = F.di; V.del = F.de; V.drunk = motor; V.stim = F.st; V.sed = F.se + F.pa * 0.4; V.emp = F.em; V.anx = F.an; V.nau = F.na;
  V.kal = m.vis.kal; V.gap = m.vis.gap; V.spin = m.vis.spin; V.flash = m.vis.flash; V.irr = B.irr; V.pa = F.pa;
}

// dominant feeling for monologue / HUD
function dominantFeelings(B, n) {
  var arr = [];
  var F = B.F;
  ['ps', 'st', 'se', 'pa', 'di', 'de', 'em', 'an', 'na', 'eu'].forEach(function (k) { if (F[k] > 0.2) arr.push([k, F[k]]); });
  if (B.motor > 0.25) arr.push(['drunk', B.motor * 0.8]);
  arr.sort(function (a, b) { return b[1] - a[1]; });
  return arr.slice(0, n || 3);
}
function activeDoseSummary(B) {
  // group by substance: level & phase
  var map = {};
  B.doses.forEach(function (d) {
    var s = SUB[d.s]; if (s.hidden && s.id !== 'withdraw') return;
    var c = subCurve(d.t, s);
    var ph = d.t < s.on ? 'まだ' : d.t < s.pk ? '上昇中' : d.t < s.pl ? 'ピーク' : d.t < s.du ? '下降中' : '余韻';
    var o = map[s.id] || (map[s.id] = { s: s, lvl: 0, n: 0, ph: ph, t: d.t });
    o.lvl += c * d.amt; o.n++;
    if (d.t < o.t) { o.t = d.t; o.ph = ph; }
  });
  var arr = []; for (var k in map) arr.push(map[k]);
  if (B.bac > 0.005 || B.stom > 0.05) arr.push({ alc: true, lvl: B.bac / 0.06, ph: B.stom > 0.1 ? '吸収中' : '', bac: B.bac });
  return arr;
}


// ===== 04_audio.js =====
// ---- procedural audio (WebAudio, no files) -------------------------------------
var AU = { ready: false, ctx: null, master: null, bgm: null, sfx: null, music: true, beat: 0, nextT: 0, step: 0, chord: 0,
  p: { lp: 1, tempo: 1, detune: 0, rev: 0.25, psy: 0, drums: 1, emp: 0, wob: 0 }, hbT: 0, whT: 0 };

function initAudio() {
  if (AU.ctx) { try { if (AU.ctx.state === 'suspended') AU.ctx.resume(); } catch (e) {} return; }
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var c = AU.ctx = new AC();
    AU.master = c.createGain(); AU.master.gain.value = 0.9; AU.master.connect(c.destination);
    AU.comp = c.createDynamicsCompressor(); AU.comp.threshold.value = -14; AU.comp.ratio.value = 4; AU.comp.connect(AU.master);
    // reverb
    AU.verb = c.createConvolver(); AU.verb.buffer = makeImpulse(c, 3.2, 2.4);
    AU.verbGain = c.createGain(); AU.verbGain.gain.value = 0.25; AU.verb.connect(AU.verbGain); AU.verbGain.connect(AU.comp);
    // music bus: filter -> gain
    AU.bgmFilter = c.createBiquadFilter(); AU.bgmFilter.type = 'lowpass'; AU.bgmFilter.frequency.value = 8000; AU.bgmFilter.Q.value = 0.7;
    AU.bgm = c.createGain(); AU.bgm.gain.value = SAVE.settings.bgm * 0.55;
    AU.bgmFilter.connect(AU.bgm); AU.bgm.connect(AU.comp);
    AU.bgmSend = c.createGain(); AU.bgmSend.gain.value = 0.35; AU.bgmFilter.connect(AU.bgmSend); AU.bgmSend.connect(AU.verb);
    AU.sfx = c.createGain(); AU.sfx.gain.value = SAVE.settings.sfx; AU.sfx.connect(AU.comp);
    AU.sfxSend = c.createGain(); AU.sfxSend.gain.value = 0.2; AU.sfx.connect(AU.sfxSend); AU.sfxSend.connect(AU.verb);
    AU.noise = makeNoise(c, 2);
    // room tone
    AU.room = c.createBufferSource(); AU.room.buffer = makeNoise(c, 4, true); AU.room.loop = true;
    AU.roomF = c.createBiquadFilter(); AU.roomF.type = 'lowpass'; AU.roomF.frequency.value = 260;
    AU.roomG = c.createGain(); AU.roomG.gain.value = 0.05;
    AU.room.connect(AU.roomF); AU.roomF.connect(AU.roomG); AU.roomG.connect(AU.sfx); AU.room.start();
    // outdoor city
    AU.city = c.createBufferSource(); AU.city.buffer = AU.room.buffer; AU.city.loop = true; AU.city.playbackRate.value = 1.7;
    AU.cityF = c.createBiquadFilter(); AU.cityF.type = 'bandpass'; AU.cityF.frequency.value = 500; AU.cityF.Q.value = 0.4;
    AU.cityG = c.createGain(); AU.cityG.gain.value = 0;
    AU.city.connect(AU.cityF); AU.cityF.connect(AU.cityG); AU.cityG.connect(AU.sfx); AU.city.start();
    // tinnitus
    AU.tin = c.createOscillator(); AU.tin.frequency.value = 6800; AU.tinG = c.createGain(); AU.tinG.gain.value = 0;
    AU.tin.connect(AU.tinG); AU.tinG.connect(AU.sfx); AU.tin.start();
    AU.nextT = c.currentTime + 0.2;
    AU.ready = true;
  } catch (e) { console.warn('audio init failed', e); }
}
function makeNoise(c, sec, brown) {
  var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), last = 0;
  for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return b;
}
function makeImpulse(c, sec, decay) {
  var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}
function auVol() { if (!AU.ready) return; AU.bgm.gain.value = SAVE.settings.bgm * 0.55 * (AU.music ? 1 : 0); AU.sfx.gain.value = SAVE.settings.sfx; }

// ---- primitive voices -------------------------------------------------------------
function tone(freq, t, dur, o) {
  o = o || {}; var c = AU.ctx;
  var osc = c.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(freq, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
  if (o.detune) osc.detune.value = o.detune;
  var g = c.createGain(); var v = o.vol == null ? 0.2 : o.vol; var a = o.attack || 0.005;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  var node = osc;
  if (o.filter) { var f = c.createBiquadFilter(); f.type = o.filter.type || 'lowpass'; f.frequency.value = o.filter.f; f.Q.value = o.filter.q || 0.8; osc.connect(f); node = f; }
  node.connect(g);
  if (o.pan != null && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(o.bus || AU.sfx); } else g.connect(o.bus || AU.sfx);
  osc.start(t); osc.stop(t + dur + 0.05);
}
function noiseHit(t, dur, o) {
  o = o || {}; var c = AU.ctx;
  var s = c.createBufferSource(); s.buffer = AU.noise; s.playbackRate.value = o.rate || 1;
  var f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q || 1;
  if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
  var g = c.createGain(); var v = o.vol == null ? 0.2 : o.vol;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.attack || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g);
  if (o.pan != null && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(o.bus || AU.sfx); } else g.connect(o.bus || AU.sfx);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
}

// ---- sound effects -------------------------------------------------------------
function sfx(name, arg) {
  if (!AU.ready) return;
  var t = AU.ctx.currentTime + 0.01, i;
  switch (name) {
    case 'can': // プシュッ
      noiseHit(t, 0.05, { f: 3000, q: 0.6, vol: 0.4 }); noiseHit(t + 0.02, 0.5, { f: 6000, fTo: 2500, type: 'highpass', vol: 0.25 }); break;
    case 'gulp':
      for (i = 0; i < 4; i++) tone(180 - i * 8, t + i * 0.42, 0.18, { vol: 0.18, slide: 90, type: 'sine' }); break;
    case 'pill': // カリッ
      noiseHit(t, 0.04, { f: 4200, q: 3, vol: 0.35 }); noiseHit(t + 0.11, 0.05, { f: 3200, q: 3, vol: 0.3 }); noiseHit(t + 0.24, 0.05, { f: 3600, q: 3, vol: 0.2 });
      tone(1600, t + 0.4, 0.18, { vol: 0.05, type: 'triangle', slide: 1200 }); break;
    case 'water':
      noiseHit(t, 1.6, { f: 1800, q: 0.5, vol: 0.18, attack: 0.1 }); for (i = 0; i < 3; i++) tone(200, t + 0.5 + i * 0.4, 0.15, { vol: 0.12, slide: 100 }); break;
    case 'fridge':
      tone(70, t, 0.25, { vol: 0.3, type: 'triangle' }); noiseHit(t, 0.12, { f: 400, vol: 0.2 }); break;
    case 'click':
      noiseHit(t, 0.03, { f: 2500, q: 4, vol: 0.3 }); tone(900, t, 0.04, { vol: 0.08, type: 'square' }); break;
    case 'ui':
      tone(880, t, 0.08, { vol: 0.07, type: 'triangle' }); tone(1320, t + 0.05, 0.1, { vol: 0.05, type: 'triangle' }); break;
    case 'combo':
      [0, 4, 7, 12, 16].forEach(function (n, k) { tone(523.25 * Math.pow(2, n / 12), t + k * 0.08, 0.9, { vol: 0.12, type: 'triangle' }); tone(1046.5 * Math.pow(2, n / 12), t + k * 0.08, 0.6, { vol: 0.04 }); }); break;
    case 'warn':
      tone(740, t, 0.15, { vol: 0.15, type: 'square', filter: { f: 2000 } }); tone(740, t + 0.22, 0.15, { vol: 0.15, type: 'square', filter: { f: 2000 } }); break;
    case 'vomit':
      noiseHit(t, 1.4, { f: 300, fTo: 900, q: 2, vol: 0.5, attack: 0.15 }); tone(110, t, 1.2, { vol: 0.2, type: 'sawtooth', slide: 70, filter: { f: 500 } });
      noiseHit(t + 1.3, 0.8, { f: 700, q: 0.8, vol: 0.2 }); break;
    case 'flush':
      noiseHit(t, 2.5, { f: 900, fTo: 300, q: 0.4, vol: 0.35, attack: 0.2 }); break;
    case 'door':
      noiseHit(t, 0.7, { f: 600, fTo: 1400, q: 0.5, vol: 0.2, attack: 0.1 }); break;
    case 'buzz':
      for (i = 0; i < 3; i++) tone(170, t + i * 0.3, 0.2, { vol: 0.2, type: 'square', filter: { f: 400 } }); break;
    case 'flatline':
      tone(980, t, 4.5, { vol: 0.18, type: 'sine', attack: 0.02 }); break;
    case 'birds':
      for (i = 0; i < 9; i++) { var s0 = t + i * 0.35 + Math.random() * 0.2; tone(2600 + Math.random() * 1200, s0, 0.12, { vol: 0.05, slide: 3800 + Math.random() * 800, pan: Math.random() * 2 - 1 }); } break;
    case 'siren':
      for (i = 0; i < 6; i++) { tone(760, t + i * 0.9, 0.45, { vol: 0.08, type: 'triangle' }); tone(620, t + i * 0.9 + 0.45, 0.45, { vol: 0.08, type: 'triangle' }); } break;
    case 'whisper':
      noiseHit(t, 1.2, { f: 1200 + Math.random() * 1500, q: 6, vol: 0.12, attack: 0.3, pan: arg != null ? arg : Math.random() * 2 - 1 });
      noiseHit(t + 0.3, 0.9, { f: 2400 + Math.random() * 800, q: 8, vol: 0.08, attack: 0.2, pan: arg != null ? arg : Math.random() * 2 - 1 }); break;
    case 'step':
      noiseHit(t, 0.06, { f: 220, q: 1.2, vol: 0.06 * (arg || 1) }); break;
    case 'heart':
      tone(58, t, 0.16, { vol: 0.35 * (arg || 1), type: 'sine', slide: 40 }); tone(52, t + 0.17, 0.2, { vol: 0.25 * (arg || 1), type: 'sine', slide: 36 }); break;
    case 'sparkle':
      for (i = 0; i < 5; i++) tone(1800 + Math.random() * 2400, t + i * 0.06, 0.25, { vol: 0.03, type: 'sine', pan: Math.random() * 2 - 1 }); break;
    case 'tv':
      noiseHit(t, 0.3, { f: 4000, q: 0.3, vol: 0.1 }); break;
  }
}

// ---- music sequencer (lo-fi loop that reacts to the body) ---------------------------
// chords: Fmaj7, Em7, Dm7, Cmaj7 (+9)
var CHORDS = [[53, 57, 60, 64, 67], [52, 55, 59, 62, 66], [50, 53, 57, 60, 64], [48, 52, 55, 59, 62]];
function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
function updateMusic() {
  if (!AU.ready) return;
  var c = AU.ctx, p = AU.p;
  var bpm = 78 * p.tempo, sixteenth = 60 / bpm / 4;
  while (AU.nextT < c.currentTime + 0.25) {
    var t = AU.nextT, s = AU.step % 16, bar = Math.floor(AU.step / 16);
    var ch = CHORDS[bar % 4], bus = AU.bgmFilter;
    var det = p.detune + (p.wob > 0 ? Math.sin(t * 1.3) * 40 * p.wob : 0);
    if (AU.music) {
      if (s === 0) { // pad + bass
        ch.slice(0, 4).forEach(function (n) {
          tone(midi(n), t, sixteenth * 16, { vol: 0.045, type: 'triangle', attack: 0.4, detune: det - 6, bus: bus });
          tone(midi(n), t, sixteenth * 16, { vol: 0.03, type: 'sawtooth', attack: 0.5, detune: det + 7, bus: bus, filter: { f: 900 + p.emp * 1500 } });
        });
        tone(midi(ch[0] - 12), t, sixteenth * 7, { vol: 0.16, type: 'sine', attack: 0.02, detune: det, bus: bus });
      }
      if (s === 10) tone(midi(ch[0] - 12 + 7), t, sixteenth * 5, { vol: 0.12, type: 'sine', attack: 0.02, detune: det, bus: bus });
      if (p.drums > 0.05) {
        if (s === 0 || s === 7 || s === 10) tone(110, t, 0.25, { vol: 0.32 * p.drums, slide: 40, bus: bus });
        if (s === 4 || s === 12) noiseHit(t, 0.18, { f: 1800, q: 0.7, vol: 0.13 * p.drums, bus: bus });
        if (s % 2 === 0 || (p.tempo > 1.08 && s % 1 === 0)) noiseHit(t, 0.04, { f: 8000, type: 'highpass', vol: (s % 4 === 2 ? 0.05 : 0.03) * p.drums, bus: bus });
      }
      // melody (sparse, lo-fi keys)
      if ((s === 2 || s === 6 || s === 9 || s === 14) && Math.random() < 0.55) {
        var n = ch[1 + Math.floor(Math.random() * 4)] + 12;
        tone(midi(n), t, sixteenth * 6, { vol: 0.05, type: 'triangle', detune: det, bus: bus, filter: { f: 2400 } });
      }
      // psychedelic arpeggio shimmer
      if (p.psy > 0.15 && s % 2 === 1) {
        var an = ch[(AU.step >> 1) % ch.length] + 24;
        tone(midi(an), t, sixteenth * 3, { vol: 0.03 * Math.min(1.5, p.psy), type: 'sine', detune: det + Math.sin(t * 3) * 30 * p.psy, bus: bus, pan: Math.sin(t * 2) });
      }
    }
    AU.nextT += sixteenth; AU.step++;
  }
}

// called every frame with body visuals and location
function updateAudio(dt, B, ctx) {
  if (!AU.ready) return;
  var c = AU.ctx, V = B ? B.vis : null, p = AU.p;
  if (V) {
    var sed = V.sed, psy = V.psy;
    p.tempo = damp(p.tempo, clamp(1 + V.stim * 0.12 - sed * 0.12 - V.dis * 0.1, 0.7, 1.25), 0.5, dt);
    p.detune = damp(p.detune, -sed * 60 - V.dis * 120 + V.stim * 20, 0.5, dt);
    p.wob = damp(p.wob, V.drunk * 0.6 + psy * 0.4 + V.dis * 0.5, 0.5, dt);
    p.psy = psy; p.emp = V.emp;
    p.drums = damp(p.drums, clamp(1 - V.dis * 0.8 - sed * 0.4, 0, 1), 0.5, dt);
    var lp = 7000 + V.emp * 6000 - sed * 5000 - V.dis * 3000 - (B.unconscious ? 6000 : 0) - V.nau * 2000;
    AU.bgmFilter.frequency.value = damp(AU.bgmFilter.frequency.value, clamp(lp, 300, 16000), 2, dt);
    AU.verbGain.gain.value = damp(AU.verbGain.gain.value, 0.2 + V.dis * 0.8 + psy * 0.35 + V.pa * 0.2, 1, dt);
    AU.tinG.gain.value = damp(AU.tinG.gain.value, clamp(V.dis * 0.008 + (B.danger / 100) * 0.012 + Math.max(0, V.drunk - 1) * 0.006, 0, 0.02), 1, dt);
    // heartbeat
    var hbVol = clamp((B.hr - 100) / 60, 0, 1) * 0.7 + V.anx * 0.3 + (B.danger > 0 ? 0.4 : 0);
    AU.hbT -= dt;
    if (hbVol > 0.08 && AU.hbT <= 0) { AU.hbT = 60 / Math.max(40, B.hr); sfx('heart', clamp(hbVol, 0, 1.2)); }
    // whispers
    AU.whT -= dt;
    if (V.del > 0.4 && AU.whT <= 0) { AU.whT = rnd(3, 9) / Math.min(2, V.del); sfx('whisper'); }
  }
  AU.roomG.gain.value = damp(AU.roomG.gain.value, ctx && ctx.outdoor ? 0.01 : 0.05, 1, dt);
  AU.cityG.gain.value = damp(AU.cityG.gain.value, ctx && ctx.outdoor ? 0.12 : 0.012, 1, dt);
  updateMusic();
}


// ===== 05_render.js =====
// ---- renderer, trip shaders, post-processing ------------------------------------
var RENDER = { renderer: null, scene: null, camera: null, rt: null, fbA: null, fbB: null, scale: 0.75, dpr: 1, w: 1, h: 1, fpsAvg: 60, autoTimer: 0, quality: 'AUTO' };
var POSTU = null, COPYU = null;
// shared uniforms injected into every world material ("the room itself trips")
var TRIPU = { uT: { value: 0 }, uPat: { value: 0 }, uBreath: { value: 0 }, uMelt: { value: 0 }, uHueW: { value: 0 }, uGlow: { value: 0 }, uDark: { value: 0 } };

function tripify(mat, opts) {
  opts = opts || {};
  mat.onBeforeCompile = function (sh) {
    for (var k in TRIPU) sh.uniforms[k] = TRIPU[k];
    sh.vertexShader = 'uniform float uT; uniform float uBreath; uniform float uMelt; varying vec3 vRmW;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
      '#include <begin_vertex>',
      'vec4 rmW = modelMatrix * vec4(transformed, 1.0);',
      'float rmB = sin(rmW.x * 2.3 + uT * 1.7) * sin(rmW.z * 2.1 - uT * 1.3) * sin(rmW.y * 2.7 + uT * 1.1);',
      opts.rigid ? '' : 'transformed += normal * rmB * uBreath * 0.06;',
      opts.rigid ? '' : 'transformed.y -= uMelt * 0.05 * (0.5 + 0.5 * sin(rmW.x * 7.0 + rmW.z * 5.0 + uT * 0.6)) * max(0.0, rmW.y - 0.3);',
      'vRmW = rmW.xyz;'
    ].join('\n'));
    sh.fragmentShader = 'uniform float uT; uniform float uPat; uniform float uHueW; uniform float uGlow; uniform float uDark; varying vec3 vRmW;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>', [
      '{',
      '  vec3 w = vRmW; float t = uT;',
      '  if (uPat > 0.001) {',
      '    float p1 = sin(w.x * 5.0 + sin(w.z * 4.0 + t * 0.8) * 2.0 + t * 0.6);',
      '    float p2 = sin(w.y * 6.0 - t * 0.7 + cos(w.x * 3.0 + t * 0.5) * 2.5);',
      '    float p3 = sin((w.x + w.z) * 3.5 + w.y * 2.0 + t);',
      '    float p = p1 * p2 + p3 * 0.5;',
      '    vec3 pc = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + p * 0.35 + t * 0.04 + uHueW));',
      '    float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));',
      '    gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.55 + pc * (0.12 + lum * 1.3), clamp(uPat * (0.55 + 0.45 * p), 0.0, 1.0));',
      '  }',
      '  gl_FragColor.rgb += uGlow * vec3(1.0, 0.45, 0.7) * 0.06;',
      '  gl_FragColor.rgb *= 1.0 - uDark * 0.5;',
      '}',
      '#include <tonemapping_fragment>'
    ].join('\n'));
  };
  mat.customProgramCacheKey = function () { return 'rmtrip' + (opts.rigid ? 'r' : ''); };
  return mat;
}

function initRenderer() {
  var r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
  r.outputEncoding = THREE.sRGBEncoding;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.92;
  r.setClearColor(0x000000, 1);
  CANVAS_HOST.appendChild(r.domElement);
  RENDER.renderer = r;
  RENDER.scene = new THREE.Scene();
  RENDER.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400);
  RENDER.scene.add(RENDER.camera);
  POSTU = {
    tDiffuse: { value: null }, tPrev: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uAspect: { value: 1 },
    uPsy: { value: 0 }, uDis: { value: 0 }, uDel: { value: 0 }, uDrunk: { value: 0 }, uStim: { value: 0 }, uSed: { value: 0 }, uEmp: { value: 0 },
    uAnx: { value: 0 }, uNau: { value: 0 }, uLids: { value: 0 }, uBlack: { value: 0 }, uTrail: { value: 0 }, uKal: { value: 0 }, uRed: { value: 0 },
    uFlash: { value: 0 }, uHue: { value: 0 }, uSpin: { value: 0 }, uCalm: { value: 0 }, uWhite: { value: 0 }, uGap: { value: 0 }
  };
  var post = new THREE.ShaderMaterial({ uniforms: POSTU, vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false, depthWrite: false });
  RENDER.postScene = new THREE.Scene();
  RENDER.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false;
  RENDER.postScene.add(quad);
  COPYU = { tDiffuse: { value: null } };
  var copy = new THREE.ShaderMaterial({ uniforms: COPYU, vertexShader: POST_VS, fragmentShader: 'precision mediump float; uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tDiffuse, vUv); }', depthTest: false, depthWrite: false });
  RENDER.copyScene = new THREE.Scene();
  var q2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copy); q2.frustumCulled = false; RENDER.copyScene.add(q2);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', function () { setTimeout(onResize, 200); });
  applyQuality(SAVE.settings.quality);
}
function isMobile() { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); }
function applyQuality(q) {
  RENDER.quality = q;
  if (q === 'LOW') RENDER.scale = 0.5;
  else if (q === 'MEDIUM') RENDER.scale = 0.7;
  else if (q === 'HIGH') RENDER.scale = 1.0;
  else RENDER.scale = isMobile() ? 0.62 : 0.8;
  onResize();
}
function mkRT(w, h, depth) {
  var t = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: !!depth, stencilBuffer: false });
  t.texture.generateMipmaps = false;
  return t;
}
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
    RENDER.rt = mkRT(sw, sh, true); RENDER.rt.texture.encoding = THREE.sRGBEncoding;
    RENDER.fbA = mkRT(sw, sh, false); RENDER.fbB = mkRT(sw, sh, false);
  } else { RENDER.rt.setSize(sw, sh); RENDER.fbA.setSize(sw, sh); RENDER.fbB.setSize(sw, sh); }
  POSTU.uRes.value.set(sw, sh);
  POSTU.uAspect.value = w / h;
  RENDER.camera.aspect = w / h;
  RENDER.baseFov = w / h < 0.7 ? 76 : 66;
  RENDER.camera.fov = RENDER.baseFov;
  RENDER.camera.updateProjectionMatrix();
  if (typeof layoutUI === 'function') layoutUI();
}
function renderFrame() {
  var r = RENDER.renderer;
  r.setRenderTarget(RENDER.rt);
  r.render(RENDER.scene, RENDER.camera);
  POSTU.tDiffuse.value = RENDER.rt.texture;
  POSTU.tPrev.value = RENDER.fbB.texture;
  r.setRenderTarget(RENDER.fbA);
  r.render(RENDER.postScene, RENDER.postCam);
  COPYU.tDiffuse.value = RENDER.fbA.texture;
  r.setRenderTarget(null);
  r.render(RENDER.copyScene, RENDER.postCam);
  var tmp = RENDER.fbA; RENDER.fbA = RENDER.fbB; RENDER.fbB = tmp;
}
function adaptQuality(dt) {
  var fps = 1 / Math.max(dt, 0.001);
  RENDER.fpsAvg = lerp(RENDER.fpsAvg, fps, 0.05);
  if (RENDER.quality !== 'AUTO') return;
  RENDER.autoTimer += dt;
  if (RENDER.autoTimer < 2.5) return;
  RENDER.autoTimer = 0;
  var s = RENDER.scale;
  if (RENDER.fpsAvg < 34 && s > 0.42) s = Math.max(0.42, s - 0.08);
  else if (RENDER.fpsAvg > 57 && s < 0.9) s = Math.min(0.9, s + 0.04);
  if (Math.abs(s - RENDER.scale) > 0.001) { RENDER.scale = s; onResize(); }
}

var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var POST_FS = [
  'precision highp float;',
  'uniform sampler2D tDiffuse; uniform sampler2D tPrev; uniform vec2 uRes; uniform float uTime, uAspect;',
  'uniform float uPsy, uDis, uDel, uDrunk, uStim, uSed, uEmp, uAnx, uNau, uLids, uBlack, uTrail, uKal, uRed, uFlash, uHue, uSpin, uCalm, uWhite, uGap;',
  'varying vec2 vUv;',
  'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
  'vec3 hueRot(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a); return c*ca + cross(k, c)*sin(a) + k*dot(k, c)*(1.0-ca); }',
  'void main(){',
  '  float t = uTime;',
  '  vec2 c = vUv - 0.5; c.x *= uAspect;',
  '  // spinning room',
  '  float sa = uSpin * (0.25 * sin(t * 0.35) + 0.08 * sin(t * 1.1));',
  '  c = mat2(cos(sa), -sin(sa), sin(sa), cos(sa)) * c;',
  '  // kaleidoscope',
  '  if (uKal > 0.001) {',
  '    float r = length(c); float a = atan(c.y, c.x) + t * 0.04;',
  '    float seg = 6.2831853 / 8.0; float am = mod(a, seg); am = abs(am - seg * 0.5);',
  '    vec2 k = vec2(cos(am), sin(am)) * r;',
  '    c = mix(c, k, clamp(uKal, 0.0, 1.0));',
  '  }',
  '  // dissociation: fisheye bulge + tunnel stretch',
  '  float r2 = dot(c, c);',
  '  c *= 1.0 + uDis * 0.45 * r2 - uDis * 0.12;',
  '  // psychedelic breathing waves',
  '  c += uPsy * 0.010 * vec2(sin(c.y * 9.0 + t * 1.3) + 0.5 * sin(c.y * 23.0 - t * 2.1), cos(c.x * 8.0 - t * 1.1) + 0.5 * cos(c.x * 19.0 + t * 1.7));',
  '  // drunk sway',
  '  c += uDrunk * 0.012 * vec2(sin(t * 0.9), cos(t * 0.7));',
  '  // nausea ripple',
  '  c.y += uNau * 0.010 * sin(c.x * 4.0 + t * 2.0);',
  '  vec2 uv = vec2(c.x / uAspect, c.y) + 0.5;',
  '  uv = clamp(uv, 0.001, 0.999);',
  '  // chromatic aberration',
  '  float ab = 0.0012 + uPsy * 0.0055 + uStim * 0.0015 + uDis * 0.004 + uAnx * 0.001;',
  '  vec2 dir = (vUv - 0.5) * ab * 2.0;',
  '  vec3 col;',
  '  col.r = texture2D(tDiffuse, uv + dir).r; col.g = texture2D(tDiffuse, uv).g; col.b = texture2D(tDiffuse, uv - dir).b;',
  '  // double vision (alcohol)',
  '  if (uDrunk > 0.02) {',
  '    float dd = min(uDrunk, 1.6) * 0.016 * (0.6 + 0.4 * sin(t * 0.5));',
  '    vec3 d2 = texture2D(tDiffuse, clamp(uv + vec2(dd, dd * 0.3), 0.001, 0.999)).rgb;',
  '    col = mix(col, d2, min(0.45, uDrunk * 0.35));',
  '  }',
  '  // soft blur for sedation',
  '  if (uSed > 0.05) {',
  '    float bl = min(uSed, 1.5) * 0.004;',
  '    vec3 b = texture2D(tDiffuse, uv + vec2(bl, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(bl, 0.0)).rgb + texture2D(tDiffuse, uv + vec2(0.0, bl * uAspect)).rgb + texture2D(tDiffuse, uv - vec2(0.0, bl * uAspect)).rgb;',
  '    col = mix(col, b * 0.25, min(0.7, uSed * 0.5));',
  '  }',
  '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
  '  // saturation: psy & emp boost, sedation drains',
  '  col = mix(vec3(lum), col, clamp(1.0 + uPsy * 0.9 + uEmp * 0.35 - uSed * 0.35 - uDel * 0.4, 0.0, 3.0));',
  '  // hue cycling bands (psy)',
  '  float hb = uPsy * (0.35 + uCalm * -0.2) * sin(lum * 10.0 + t * 0.6 + length(c) * 5.0);',
  '  col = hueRot(col, uHue + hb);',
  '  // fractal-ish lattice overlay (strong psy)',
  '  if (uPsy > 0.35) {',
  '    vec2 q = c * 7.0; float ang = t * 0.05; q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;',
  '    float g = 0.0; vec2 z = q;',
  '    for (int i = 0; i < 4; i++) { z = abs(z) / dot(z, z + 0.001) - 0.9 - 0.08 * sin(t * 0.2); g += exp(-abs(z.x * z.y) * 6.0); }',
  '    vec3 lc = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + g * 0.2 + t * 0.05));',
  '    col += lc * g * 0.045 * smoothstep(0.35, 1.6, uPsy) * (1.0 - uCalm * 0.6);',
  '  }',
  '  // emp: warm pink glow and sparkles',
  '  col += uEmp * vec3(0.16, 0.04, 0.09) * (1.0 - lum);',
  '  if (uEmp > 0.1) { vec2 gc = vUv * uRes / 9.0; vec2 gp = floor(gc); vec2 gf = fract(gc) - 0.5; float sp = step(0.994, hash(gp + floor(t * 2.0))); float star = max(0.0, 1.0 - (abs(gf.x) * abs(gf.y) * 60.0 + length(gf) * 2.2)); col += sp * star * uEmp * vec3(1.0, 0.75, 0.9) * 0.9; }',
  '  // feedback trails',
  '  if (uTrail > 0.001) {',
  '    vec2 pu = vUv + (vUv - 0.5) * (-0.006 - 0.004 * uPsy) + vec2(sin(t + vUv.y * 6.0), cos(t * 0.8 + vUv.x * 6.0)) * 0.0015 * uPsy;',
  '    vec3 prev = texture2D(tPrev, pu).rgb;',
  '    prev = hueRot(prev, 0.06 * uPsy);',
  '    col = mix(col, mix(col, max(col, prev * 0.94), 0.75), uTrail);',
  '  }',
  '  // stimulants: contrast & crispness',
  '  col = (col - 0.5) * (1.0 + uStim * 0.22) + 0.5;',
  '  // sedation: warm & dim',
  '  col = mix(col, col * vec3(1.06, 0.97, 0.84), clamp(uSed * 0.5, 0.0, 0.6));',
  '  // delirium: grime, darkness, crawling grain',
  '  float gr = hash(vUv * uRes + fract(t * 7.0) * 100.0) - 0.5;',
  '  col += gr * (0.025 + uDel * 0.09 + uDis * 0.03);',
  '  col *= 1.0 - uDel * 0.25;',
  '  // vignette / tunnel vision',
  '  vec2 vc = vUv - 0.5; vc.x *= mix(1.0, uAspect, 0.5);',
  '  float v = length(vc);',
  '  float tun = smoothstep(0.85 - uDis * 0.25 - uSed * 0.12 - uDel * 0.15 - uRed * 0.12, 0.18, v);',
  '  col *= mix(1.0, tun, 0.45 + uDis * 0.4 + uDel * 0.3);',
  '  // anxiety pulse & danger red',
  '  float pulse = 0.5 + 0.5 * sin(t * 7.0);',
  '  col = mix(col, col * vec3(1.15, 0.35, 0.35), uRed * (0.5 + 0.5 * pulse) * (1.0 - tun * 0.5));',
  '  col *= 1.0 - uAnx * 0.12 * pulse * (1.0 - tun);',
  '  // eyelids',
  '  float ly = abs(vUv.y - 0.5) * 2.0;',
  '  float le = uLids * 1.1 - 0.1; float lid = smoothstep(le, le + 0.1, 1.0 - ly);',
  '  col *= lid;',
  '  // blackout gaps',
  '  col *= 1.0 - uGap;',
  '  col = mix(col, vec3(1.0), uFlash);',
  '  col = mix(col, vec3(1.0, 0.98, 0.95), uWhite);',
  '  col *= 1.0 - uBlack;',
  '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
  '}'
].join('\n');


// ===== 06_tex.js =====
// ---- procedural textures & shape outlines ------------------------------------------
var TEX = {};

// outline polygons for ramune shapes, unit size (~ -1..1)
function shapePoints(shape) {
  var pts = [], i, a, N;
  function circ(n, r, ox, oy) { var out = []; for (var k = 0; k < n; k++) { var aa = k / n * TAU; out.push([Math.cos(aa) * r + (ox || 0), Math.sin(aa) * r + (oy || 0)]); } return out; }
  switch (shape) {
    case 'star': for (i = 0; i < 10; i++) { a = i / 10 * TAU + PI / 2; var r = i % 2 ? 0.45 : 1; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } break;
    case 'heart': for (i = 0; i < 40; i++) { var t = i / 40 * TAU; pts.push([16 * Math.pow(Math.sin(t), 3) / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.1]); } break;
    case 'gem': for (i = 0; i < 6; i++) { a = i / 6 * TAU + PI / 6; pts.push([Math.cos(a), Math.sin(a)]); } break;
    case 'mushroom': for (i = 0; i <= 16; i++) { a = i / 16 * PI; pts.push([Math.cos(a), Math.sin(a) * 0.8 + 0.05]); } pts.push([-0.35, 0.05], [-0.3, -0.95], [0.3, -0.95], [0.35, 0.05]); pts.reverse(); break;
    case 'bullet': for (i = 0; i <= 12; i++) { a = i / 12 * PI; pts.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5 + 0.45]); } for (i = 0; i <= 12; i++) { a = PI + i / 12 * PI; pts.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5 - 0.45]); } break;
    case 'cloud': for (i = 0; i < 48; i++) { a = i / 48 * TAU; var rr = 0.8 + 0.2 * Math.abs(Math.cos(a * 2.5)); pts.push([Math.cos(a) * rr * 1.1, Math.sin(a) * rr * 0.75]); } break;
    case 'moon':
      for (i = 0; i <= 24; i++) { a = 0.35 * PI + i / 24 * 1.3 * PI; pts.push([Math.cos(a), Math.sin(a)]); }
      for (i = 1; i < 24; i++) { a = (267 - i / 24 * 174) / 180 * PI; pts.push([0.5 + Math.cos(a) * 0.892, Math.sin(a) * 0.892]); }
      pts = pts.map(function (p) { return [p[0] + 0.25, p[1]]; }); break;
    case 'drop': for (i = 0; i < 32; i++) { var tt = i / 32 * TAU; pts.push([Math.sin(tt) * Math.sin(tt / 2) * 0.95, -Math.cos(tt) * 1.0]); } break;
    case 'bolt': pts = [[0.2, 1], [-0.6, -0.1], [-0.05, -0.1], [-0.3, -1], [0.6, 0.15], [0.05, 0.15]]; break;
    case 'cross': pts = [[-0.3, 1], [0.3, 1], [0.3, 0.3], [1, 0.3], [1, -0.3], [0.3, -0.3], [0.3, -1], [-0.3, -1], [-0.3, -0.3], [-1, -0.3], [-1, 0.3], [-0.3, 0.3]]; break;
    case 'tiny': pts = circ(24, 0.6); break;
    default: pts = circ(32, 1);
  }
  return pts;
}

function drawShape(g, shape, cx, cy, s) {
  var pts = shapePoints(shape);
  g.beginPath();
  pts.forEach(function (p, i) { var x = cx + p[0] * s, y = cy - p[1] * s; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
  g.closePath();
  if (shape === 'ring') { g.moveTo(cx + s * 0.45, cy); g.arc(cx, cy, s * 0.45, 0, TAU, true); }
}

// small icon (data URL) for HTML menus
var ICON_CACHE = {};
function ramuneIcon(s, size) {
  size = size || 96;
  var key = s.id + size; if (ICON_CACHE[key]) return ICON_CACHE[key];
  var c = mkCanvas(size, size), g = c.getContext('2d'), m = size / 2;
  var r = size * 0.36;
  g.save();
  g.shadowColor = s.col2; g.shadowBlur = size * 0.12;
  var gr = g.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r * 1.2);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, s.col); gr.addColorStop(1, s.col2);
  g.fillStyle = gr;
  drawShape(g, s.shape, m, m, r);
  g.fill('evenodd');
  g.restore();
  g.lineWidth = size * 0.025; g.strokeStyle = 'rgba(255,255,255,0.65)';
  drawShape(g, s.shape, m, m, r); g.stroke();
  // engraved line / sheen
  g.globalAlpha = 0.5; g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(m - r * 0.3, m - r * 0.38, r * 0.22, r * 0.11, -0.6, 0, TAU); g.fill();
  g.globalAlpha = 1;
  return (ICON_CACHE[key] = c.toDataURL());
}
function canIcon(d, size) {
  size = size || 96;
  var key = 'can' + d.id + size; if (ICON_CACHE[key]) return ICON_CACHE[key];
  var c = mkCanvas(size, size), g = c.getContext('2d');
  var w = size * 0.46, h = size * 0.8, x = (size - w) / 2, y = (size - h) / 2;
  var gr = g.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, shade(d.col, -40)); gr.addColorStop(0.35, d.col); gr.addColorStop(0.55, '#ffffff'); gr.addColorStop(0.7, d.col); gr.addColorStop(1, shade(d.col, -60));
  g.fillStyle = gr; roundRect(g, x, y, w, h, w * 0.18); g.fill();
  g.fillStyle = '#c8ccd0'; g.fillRect(x + w * 0.1, y - size * 0.02, w * 0.8, size * 0.05);
  g.fillStyle = d.col2; g.fillRect(x, y + h * 0.35, w, h * 0.3);
  g.fillStyle = d.id === 'giga' ? '#111' : '#fff';
  g.font = '900 ' + Math.round(size * 0.13) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(d.id === 'giga' ? 'GIGA' : d.id === 'sour' ? 'ふわり' : 'ZER9', size / 2, y + h * 0.5);
  return (ICON_CACHE[key] = c.toDataURL());
}
function shade(hex, amt) {
  var n = parseInt(hex.slice(1), 16), r = (n >> 16) + amt, g = (n >> 8 & 255) + amt, b = (n & 255) + amt;
  return 'rgb(' + clamp(r, 0, 255) + ',' + clamp(g, 0, 255) + ',' + clamp(b, 0, 255) + ')';
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

function makeTextures() {
  var c, g, i, x, y;
  // wood floor
  c = mkCanvas(512, 512); g = c.getContext('2d');
  for (i = 0; i < 8; i++) {
    var base = 120 + Math.random() * 30;
    for (y = 0; y < 512; y += 2) for (x = 0; x < 64; x += 2) {
      var n = fbm(x * 0.02 + i * 10, y * 0.004, 3), gline = Math.sin((y * 0.05 + n * 8)) * 0.5 + 0.5;
      var v = base + n * 40 + gline * 16;
      g.fillStyle = 'rgb(' + (v * 1.05 | 0) + ',' + (v * 0.72 | 0) + ',' + (v * 0.45 | 0) + ')'; g.fillRect(i * 64 + x, y, 2, 2);
    }
    g.fillStyle = 'rgba(30,15,5,0.6)'; g.fillRect(i * 64, 0, 1.5, 512);
    var cut = Math.random() * 512; g.fillRect(i * 64, cut, 64, 1.5);
  }
  TEX.floor = toTex(c, { repeat: [3, 3] });
  // wallpaper
  c = mkCanvas(256, 256); g = c.getContext('2d');
  g.fillStyle = '#d8cdbb'; g.fillRect(0, 0, 256, 256);
  for (y = 0; y < 256; y += 2) for (x = 0; x < 256; x += 2) { var nn = fbm(x * 0.05, y * 0.05, 3); g.fillStyle = 'rgba(120,110,90,' + (nn * 0.12) + ')'; g.fillRect(x, y, 2, 2); }
  g.strokeStyle = 'rgba(160,150,130,0.18)'; g.lineWidth = 1;
  for (x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  TEX.wall = toTex(c, { repeat: [3, 1.5] });
  // ceiling
  c = mkCanvas(128, 128); g = c.getContext('2d'); g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 128, 128);
  for (i = 0; i < 600; i++) { g.fillStyle = 'rgba(0,0,0,' + Math.random() * 0.06 + ')'; g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); }
  TEX.ceil = toTex(c, { repeat: [4, 4] });
  // rug (retro circles)
  c = mkCanvas(512, 512); g = c.getContext('2d');
  g.fillStyle = '#2b2350'; g.fillRect(0, 0, 512, 512);
  var rc = ['#ff6fa8', '#ffd166', '#06d6a0', '#7b61ff', '#ff8c42'];
  for (i = 0; i < 9; i++) { g.strokeStyle = rc[i % 5]; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 30 + i * 26, 0, TAU); g.stroke(); }
  g.strokeStyle = '#f4f0e6'; g.lineWidth = 10; g.strokeRect(10, 10, 492, 492);
  for (y = 0; y < 512; y += 3) for (x = 0; x < 512; x += 3) if (Math.random() < 0.18) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, 2, 2); }
  TEX.rug = toTex(c);
  // bedsheet
  c = mkCanvas(256, 256); g = c.getContext('2d'); g.fillStyle = '#9ec5e8'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,0.35)'; for (i = 0; i < 256; i += 32) { g.fillRect(i, 0, 14, 256); g.fillRect(0, i, 256, 14); }
  TEX.sheet = toTex(c, { repeat: [2, 2] });
  // blanket
  c = mkCanvas(256, 256); g = c.getContext('2d'); g.fillStyle = '#f2b6c6'; g.fillRect(0, 0, 256, 256);
  for (i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 8, 0, TAU); g.fill(); }
  TEX.blanket = toTex(c, { repeat: [1.5, 1.5] });
  // tiles
  c = mkCanvas(256, 256); g = c.getContext('2d'); g.fillStyle = '#b9c9cf'; g.fillRect(0, 0, 256, 256);
  for (y = 0; y < 256; y += 32) for (x = 0; x < 256; x += 32) { g.fillStyle = 'hsl(195,18%,' + (82 + Math.random() * 6) + '%)'; g.fillRect(x + 1, y + 1, 30, 30); }
  TEX.tile = toTex(c, { repeat: [4, 4] });
  // fabric (sofa)
  c = mkCanvas(128, 128); g = c.getContext('2d'); g.fillStyle = '#e07a3f'; g.fillRect(0, 0, 128, 128);
  for (i = 0; i < 2500; i++) { g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + Math.random() * 0.08 + ')'; g.fillRect(Math.random() * 128, Math.random() * 128, 1, 2); }
  TEX.fabric = toTex(c, { repeat: [2, 2] });
  // posters
  TEX.poster1 = toTex(posterCanvas(0)); TEX.poster2 = toTex(posterCanvas(1)); TEX.poster3 = toTex(posterCanvas(2));
  // building windows
  TEX.win = []; for (i = 0; i < 4; i++) TEX.win.push(windowTex(i));
  // concrete
  c = mkCanvas(128, 128); g = c.getContext('2d'); g.fillStyle = '#8f8f8a'; g.fillRect(0, 0, 128, 128);
  for (y = 0; y < 128; y += 2) for (x = 0; x < 128; x += 2) { g.fillStyle = 'rgba(0,0,0,' + fbm(x * 0.08, y * 0.08, 3) * 0.25 + ')'; g.fillRect(x, y, 2, 2); }
  TEX.concrete = toTex(c, { repeat: [3, 2] });
  // ramune case label
  c = mkCanvas(256, 128); g = c.getContext('2d');
  var lg = g.createLinearGradient(0, 0, 256, 128); lg.addColorStop(0, '#7df9ff'); lg.addColorStop(0.5, '#c77dff'); lg.addColorStop(1, '#ff5fa8');
  g.fillStyle = lg; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#fff'; g.font = '900 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ラムネ', 128, 52);
  g.font = '700 18px sans-serif'; g.fillText('RAMUNE  BOX', 128, 96);
  TEX.caseLabel = toTex(c);
  // neon signs
  TEX.neon1 = toTex(neonSign('ラムネ', '#7df9ff')); TEX.neon2 = toTex(neonSign('ZER9', '#ff5fa8')); TEX.neon3 = toTex(neonSign('カラオケ', '#ffe14d')); TEX.neon4 = toTex(neonSign('24H', '#7dff9a'));
  // tv
  TEX.tvCanvas = mkCanvas(256, 144); TEX.tv = toTex(TEX.tvCanvas); TEX.tv.minFilter = THREE.LinearFilter; TEX.tv.generateMipmaps = false;
  // phone screen
  TEX.phoneCanvas = mkCanvas(64, 128); TEX.phone = toTex(TEX.phoneCanvas); TEX.phone.minFilter = THREE.LinearFilter; TEX.phone.generateMipmaps = false;
  // moon
  c = mkCanvas(128, 128); g = c.getContext('2d');
  var mg = g.createRadialGradient(64, 64, 10, 64, 64, 64); mg.addColorStop(0, '#fffbe8'); mg.addColorStop(0.7, '#f4ecc8'); mg.addColorStop(0.72, 'rgba(244,236,200,0.25)'); mg.addColorStop(1, 'rgba(244,236,200,0)');
  g.fillStyle = mg; g.fillRect(0, 0, 128, 128);
  for (i = 0; i < 10; i++) { g.fillStyle = 'rgba(180,170,140,0.25)'; g.beginPath(); g.arc(40 + Math.random() * 48, 40 + Math.random() * 48, 3 + Math.random() * 7, 0, TAU); g.fill(); }
  TEX.moon = toTex(c);
  // glow sprite
  c = mkCanvas(64, 64); g = c.getContext('2d'); var gg = g.createRadialGradient(32, 32, 0, 32, 32, 32); gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gg; g.fillRect(0, 0, 64, 64);
  TEX.glow = toTex(c);
  // spider/bug sprite
  c = mkCanvas(64, 64); g = c.getContext('2d'); g.strokeStyle = '#000'; g.fillStyle = '#000'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(32, 34, 8, 11, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(32, 20, 6, 0, TAU); g.fill();
  for (i = 0; i < 4; i++) { var ly = 26 + i * 6; g.beginPath(); g.moveTo(26, ly); g.quadraticCurveTo(12, ly - 8, 6, ly + 6 + i * 2); g.stroke(); g.beginPath(); g.moveTo(38, ly); g.quadraticCurveTo(52, ly - 8, 58, ly + 6 + i * 2); g.stroke(); }
  TEX.bug = toTex(c);
}

function posterCanvas(k) {
  var c = mkCanvas(256, 360), g = c.getContext('2d'), i;
  if (k === 0) {
    var gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, '#1b0f3b'); gr.addColorStop(1, '#ff5fa8'); g.fillStyle = gr; g.fillRect(0, 0, 256, 360);
    g.fillStyle = '#ffd166'; g.beginPath(); g.arc(128, 200, 70, 0, TAU); g.fill();
    g.fillStyle = '#1b0f3b'; for (i = 0; i < 6; i++) g.fillRect(40, 190 + i * 14, 176, 5 + i);
    g.fillStyle = '#7df9ff'; g.font = '900 34px sans-serif'; g.textAlign = 'center'; g.fillText('RAMUNE', 128, 64); g.fillText('NIGHT', 128, 102);
    g.font = '700 14px sans-serif'; g.fillStyle = '#fff'; g.fillText('ALL NIGHT LONG', 128, 320);
  } else if (k === 1) {
    g.fillStyle = '#f4e9d0'; g.fillRect(0, 0, 256, 360);
    for (i = 0; i < 12; i++) { g.strokeStyle = 'hsl(' + (i * 30) + ',80%,55%)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 160, 20 + i * 11, PI, TAU); g.stroke(); }
    g.fillStyle = '#c0392b'; g.beginPath(); g.ellipse(128, 250, 60, 34, 0, PI, TAU); g.fill();
    g.fillStyle = '#fff'; for (i = 0; i < 5; i++) { g.beginPath(); g.arc(90 + i * 19, 236 - (i % 2) * 8, 5, 0, TAU); g.fill(); }
    g.fillStyle = '#e8d5b0'; g.fillRect(116, 250, 24, 50);
    g.fillStyle = '#333'; g.font = '900 22px sans-serif'; g.textAlign = 'center'; g.fillText('きのこ雲', 128, 336);
  } else {
    g.fillStyle = '#111'; g.fillRect(0, 0, 256, 360);
    g.fillStyle = '#f5e100'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.fillText('ZER9', 128, 120);
    g.fillStyle = '#fff'; g.font = '700 22px sans-serif'; g.fillText('LIVE TOUR', 128, 160);
    g.strokeStyle = '#f5e100'; g.lineWidth = 3; for (i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, 200 + i * 18); g.lineTo(256, 190 + i * 22); g.stroke(); }
    g.font = '700 14px sans-serif'; g.fillText('2:00 AM  ONLY', 128, 340);
  }
  return c;
}
function windowTex(k) {
  var c = mkCanvas(128, 256), g = c.getContext('2d');
  g.fillStyle = '#0c0f18'; g.fillRect(0, 0, 128, 256);
  var cols = 6 + k % 3, rows = 16 + k * 2, cw = 128 / cols, rh = 256 / rows;
  for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
    var r = Math.random();
    if (r < 0.38) { var warm = Math.random() < 0.75; g.fillStyle = warm ? 'hsl(' + (35 + Math.random() * 15) + ',70%,' + (55 + Math.random() * 25) + '%)' : 'hsl(200,40%,' + (60 + Math.random() * 25) + '%)'; }
    else g.fillStyle = 'rgba(30,38,55,' + (0.5 + Math.random() * 0.5) + ')';
    g.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.2, cw * 0.64, rh * 0.6);
  }
  var t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function neonSign(text, col) {
  var c = mkCanvas(256, 96), g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 256, 96);
  g.font = '900 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = col; g.shadowBlur = 18; g.fillStyle = col; g.fillText(text, 128, 50); g.shadowBlur = 6; g.fillStyle = '#fff'; g.fillText(text, 128, 50);
  return c;
}
function canLabelTex(d) {
  var c = mkCanvas(256, 128), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, shade(d.col, 20)); gr.addColorStop(1, shade(d.col, -30));
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.fillStyle = d.col2; g.fillRect(0, 44, 256, 40);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = d.id === 'giga' ? '#111' : '#fff';
  g.font = '900 30px sans-serif'; g.fillText(d.id === 'giga' ? 'GIGA BOLT' : d.id === 'sour' ? 'ふわりサワー' : 'ZER9', 64, 64); g.fillText(d.id === 'giga' ? 'GIGA BOLT' : d.id === 'sour' ? 'ふわりサワー' : 'ZER9', 192, 64);
  g.fillStyle = d.id === 'giga' ? '#00ff66' : '#333'; g.font = '700 14px sans-serif';
  g.fillText(d.sub, 64, 104); g.fillText(d.sub, 192, 104);
  return toTex(c);
}
var _tvT = 0, _tvMode = 0;
function drawTV(t, on, psy) {
  var c = TEX.tvCanvas, g = c.getContext('2d'), i;
  if (!on) { g.fillStyle = '#050607'; g.fillRect(0, 0, 256, 144); TEX.tv.needsUpdate = true; return; }
  _tvT += 1; if (_tvT % 2) return;
  var mode = Math.floor(t / 14) % 3;
  if (mode === 0) { // late night shopping show
    var gr = g.createLinearGradient(0, 0, 256, 144); gr.addColorStop(0, '#ff7eb3'); gr.addColorStop(1, '#7afcff'); g.fillStyle = gr; g.fillRect(0, 0, 256, 144);
    g.fillStyle = '#fff'; g.font = '900 26px sans-serif'; g.textAlign = 'center'; g.fillText('深夜の通販', 128, 40);
    g.font = '900 34px sans-serif'; g.fillStyle = '#ffeb3b'; g.fillText('¥' + (1980 + Math.floor(t * 3) % 7 * 1000), 128, 92);
    g.fillStyle = '#ff1744'; g.fillRect(0, 118, 256, 26); g.fillStyle = '#fff'; g.font = '700 14px sans-serif'; g.fillText('いまなら２個セット！　お電話はいますぐ', 128 - (t * 40 % 300) + 150, 136);
  } else if (mode === 1) { // abstract visualizer
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 256, 144);
    for (i = 0; i < 24; i++) { var hgt = (Math.sin(t * 3 + i * 0.7) * 0.5 + 0.5) * 100 * (0.5 + Math.random() * 0.5); g.fillStyle = 'hsl(' + (i * 15 + t * 60) % 360 + ',90%,60%)'; g.fillRect(8 + i * 10, 140 - hgt, 8, hgt); }
  } else { // night news / weather
    g.fillStyle = '#0d2347'; g.fillRect(0, 0, 256, 144);
    g.fillStyle = '#fff'; g.font = '700 16px sans-serif'; g.textAlign = 'left'; g.fillText('あすの天気', 12, 26);
    g.font = '900 40px sans-serif'; g.fillText('☀', 20, 90); g.font = '700 22px sans-serif'; g.fillText('晴れ　最高 24℃', 80, 84);
    g.fillStyle = '#ffd400'; g.fillRect(0, 118, 256, 26); g.fillStyle = '#000'; g.font = '700 14px sans-serif'; g.fillText('このあと 2:00 から「深夜のラムネ工場見学」', 256 - (t * 40 % 520), 136);
  }
  if (psy > 0.3) { g.globalCompositeOperation = 'difference'; g.fillStyle = 'hsl(' + (t * 90 % 360) + ',100%,50%)'; g.globalAlpha = Math.min(0.7, psy * 0.4); g.fillRect(0, 0, 256, 144); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  for (i = 0; i < 144; i += 3) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, i, 256, 1); }
  TEX.tv.needsUpdate = true;
}
function drawPhoneScreen(clock, notif) {
  var c = TEX.phoneCanvas, g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#2b1055'); gr.addColorStop(1, '#d53369'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#fff'; g.font = '700 16px sans-serif'; g.textAlign = 'center'; g.fillText(clock, 32, 34);
  if (notif) { g.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(g, 5, 52, 54, 22, 5); g.fill(); g.fillStyle = '#d53369'; g.font = '700 9px sans-serif'; g.fillText('通知 1件', 32, 66); }
  TEX.phone.needsUpdate = true;
}


// ===== 07_world.js =====
// ---- the apartment (8F, one room + kitchen + bathroom + balcony) and the city ---------
var WORLD = null;
var ROOM = { x0: -3, x1: 3, z0: -2.5, z1: 2.5, h: 2.5 };

function stdMat(o, rigid) { return tripify(new THREE.MeshStandardMaterial(o), { rigid: rigid }); }
function basicMat(o) { return tripify(new THREE.MeshBasicMaterial(o), { rigid: true }); }

function addBox(parent, w, h, d, mat, x, y, z, o) {
  o = o || {};
  var g = new THREE.BoxGeometry(w, h, d, o.sx || 1, o.sy || 1, o.sz || 1);
  var m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z);
  if (o.ry) m.rotation.y = o.ry;
  parent.add(m);
  if (o.col) WORLD.colliders.push({ x0: x - w / 2 - (o.pad || 0), x1: x + w / 2 + (o.pad || 0), z0: z - d / 2 - (o.pad || 0), z1: z + d / 2 + (o.pad || 0) });
  return m;
}
function addCol(x0, x1, z0, z1) { WORLD.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); }
function addPlane(parent, w, h, mat, x, y, z, rx, ry, seg) {
  var g = new THREE.PlaneGeometry(w, h, seg ? Math.max(1, Math.ceil(w * seg)) : 1, seg ? Math.max(1, Math.ceil(h * seg)) : 1);
  var m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); parent.add(m); return m;
}
function addInter(id, label, verb, pos, meshes, fn, o) {
  o = o || {};
  var it = { id: id, label: label, verb: verb, pos: pos, meshes: [], fn: fn, reach: o.reach || 2.3, cond: o.cond };
  (meshes || []).forEach(function (m) { m.traverse(function (c) { if (c.isMesh) { c.userData.inter = it; it.meshes.push(c); } }); });
  WORLD.inter.push(it); WORLD.interMeshes = WORLD.interMeshes.concat(it.meshes);
  return it;
}

function buildWorld() {
  WORLD = { root: new THREE.Group(), colliders: [], inter: [], interMeshes: [], L: {}, anim: [], cans: [], lightMode: 0, tvOn: true, musicOn: true };
  var S = RENDER.scene, W = WORLD.root; S.add(W);
  S.fog = new THREE.FogExp2(0x0a0820, 0.004);

  var M = WORLD.mats = {
    floor: stdMat({ map: TEX.floor, roughness: 0.55, metalness: 0 }),
    wall: stdMat({ map: TEX.wall, roughness: 0.92 }),
    ceil: stdMat({ map: TEX.ceil, roughness: 1, transparent: true, opacity: 1 }),
    white: stdMat({ color: 0xf4f4f0, roughness: 0.6 }),
    wood: stdMat({ color: 0x9a6a42, roughness: 0.6 }),
    darkWood: stdMat({ color: 0x4a3426, roughness: 0.55 }),
    black: stdMat({ color: 0x111114, roughness: 0.4, metalness: 0.2 }),
    metal: stdMat({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.8 }),
    tile: stdMat({ map: TEX.tile, roughness: 0.3 }),
    fabric: stdMat({ map: TEX.fabric, roughness: 0.95 }),
    sheet: stdMat({ map: TEX.sheet, roughness: 0.9 }),
    blanket: stdMat({ map: TEX.blanket, roughness: 0.95 }),
    rug: stdMat({ map: TEX.rug, roughness: 1 }),
    concrete: stdMat({ map: TEX.concrete, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fc7ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false }),
    ceramic: stdMat({ color: 0xf8fbff, roughness: 0.15, metalness: 0.05 }),
    plant: stdMat({ color: 0x2f8f4e, roughness: 0.8 }),
    pot: stdMat({ color: 0xc8643c, roughness: 0.8 }),
    curtain: stdMat({ color: 0x5b4a9e, roughness: 1, side: THREE.DoubleSide })
  };

  // ---- floor / ceiling / walls ----
  var fl = addPlane(W, 6, 5, M.floor, 0, 0, 0, -PI / 2, 0, 2);
  var ce = addPlane(W, 6, 5, M.ceil, 0, ROOM.h, 0, PI / 2, 0, 1); WORLD.ceiling = ce;
  // north wall with big window opening x∈[-2.2,0.6], y<2.2
  addPlane(W, 0.8, 2.5, M.wall, -2.6, 1.25, -2.5, 0, 0, 4);
  addPlane(W, 2.4, 2.5, M.wall, 1.8, 1.25, -2.5, 0, 0, 4);
  addPlane(W, 2.8, 0.3, M.wall, -0.8, 2.35, -2.5, 0, 0, 4);
  addCol(-3, -2.2, -2.6, -2.45); addCol(0.6, 3, -2.6, -2.45);
  // south wall with bathroom door x∈[1.3,2.1], y<2.05
  addPlane(W, 4.3, 2.5, M.wall, -0.85, 1.25, 2.5, 0, PI, 4);
  addPlane(W, 0.9, 2.5, M.wall, 2.55, 1.25, 2.5, 0, PI, 4);
  addPlane(W, 0.8, 0.45, M.wall, 1.7, 2.275, 2.5, 0, PI, 4);
  addCol(-3, 1.3, 2.45, 2.6); addCol(2.1, 3, 2.45, 2.6);
  // west / east
  addPlane(W, 5, 2.5, M.wall, -3, 1.25, 0, 0, PI / 2, 4); addCol(-3.1, -2.95, -2.6, 2.6);
  addPlane(W, 5, 2.5, M.wall, 3, 1.25, 0, 0, -PI / 2, 4); addCol(2.95, 3.1, -2.6, 2.6);
  // baseboards
  [[0, 2.48, 6, 0.02, 0], [-2.98, 0, 0.02, 5, 0], [2.98, 0, 0.02, 5, 0]].forEach(function (b) { addBox(W, b[2] || 0.02, 0.08, b[3], M.white, b[0], 0, b[1]); });
  // ceiling light
  var lampMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 24), new THREE.MeshBasicMaterial({ color: 0xfff4dc }));
  lampMesh.position.set(0, ROOM.h - 0.05, 0); W.add(lampMesh); WORLD.lampMesh = lampMesh;

  // ---- window / sliding door to balcony ----
  addBox(W, 2.8, 0.06, 0.12, M.white, -0.8, 0, -2.5);
  addBox(W, 2.8, 0.06, 0.12, M.white, -0.8, 2.14, -2.5);
  addBox(W, 0.06, 2.2, 0.12, M.white, -2.2, 0, -2.5); addBox(W, 0.06, 2.2, 0.12, M.white, 0.6, 0, -2.5);
  var gl1 = addBox(W, 1.42, 2.1, 0.02, M.glass, -1.5, 0.04, -2.47); addBox(W, 0.05, 2.1, 0.05, M.white, -0.8, 0.04, -2.47);
  addCol(-2.2, -0.8, -2.56, -2.42);
  var gl2 = addBox(W, 1.42, 2.1, 0.02, M.glass, -1.42, 0.04, -2.53); gl2.renderOrder = 2; gl1.renderOrder = 2;
  addBox(W, 0.05, 2.1, 0.05, M.white, -0.71, 0.04, -2.53);
  // curtains
  for (var ci = 0; ci < 2; ci++) {
    var cg = new THREE.PlaneGeometry(0.7, 2.3, 10, 6), pos = cg.attributes.position;
    for (var vi = 0; vi < pos.count; vi++) pos.setZ(vi, Math.sin(pos.getX(vi) * 18) * 0.05);
    cg.computeVertexNormals();
    var cm = new THREE.Mesh(cg, M.curtain); cm.position.set(ci ? 0.95 : -2.55, 1.2, -2.38); W.add(cm);
  }
  addBox(W, 3.8, 0.04, 0.04, M.metal, -0.8, 2.36, -2.38);

  // ---- balcony ----
  var bal = new THREE.Group(); W.add(bal);
  addPlane(bal, 3.4, 1.8, M.concrete, -0.8, -0.02, -3.4, -PI / 2, 0, 1);
  addBox(bal, 3.4, 0.12, 1.8, M.concrete, -0.8, -0.16, -3.4);
  // exterior walls beside balcony
  addBox(bal, 0.2, 2.6, 1.8, M.concrete, -2.6, -0.1, -3.4); addBox(bal, 0.2, 2.6, 1.8, M.concrete, 1.0, -0.1, -3.4);
  addCol(-2.75, -2.45, -4.35, -2.5); addCol(0.85, 1.15, -4.35, -2.5);
  // balcony slab above
  addBox(bal, 3.4, 0.2, 1.9, M.concrete, -0.8, 2.5, -3.45);
  // railing
  addBox(bal, 3.2, 0.06, 0.06, M.metal, -0.8, 1.05, -4.25);
  addBox(bal, 3.2, 0.9, 0.03, new THREE.MeshStandardMaterial({ color: 0x7f9cb3, transparent: true, opacity: 0.35, roughness: 0.2, depthWrite: false }), -0.8, 0.1, -4.25);
  for (var ri = 0; ri < 9; ri++) addBox(bal, 0.03, 1.05, 0.03, M.metal, -2.35 + ri * 0.39, 0, -4.25);
  addCol(-2.5, 0.9, -4.4, -4.22);
  // AC outdoor unit & plant & laundry pole
  var ac = addBox(bal, 0.7, 0.55, 0.28, M.white, 0.45, 0, -3.9, { col: true });
  var fan = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), M.black); fan.position.set(0.35, 0.28, -3.755); bal.add(fan);
  var fanBlade = addBox(bal, 0.36, 0.04, 0.01, M.metal, 0.35, 0.26, -3.75); WORLD.fan = fanBlade;
  addBox(bal, 0.35, 0.35, 0.35, M.pot, -2.2, 0, -3.9, { col: true });
  var bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), M.plant); bush.position.set(-2.2, 0.62, -3.9); bal.add(bush);
  addBox(bal, 3.0, 0.03, 0.03, M.metal, -0.8, 1.95, -3.0);
  // little stool + ashtray-less table
  addBox(bal, 0.35, 0.4, 0.35, M.wood, -1.3, 0, -3.8, { col: true });

  // ---- bed ----
  var bed = new THREE.Group(); W.add(bed);
  addBox(bed, 1.2, 0.28, 2.1, M.darkWood, 2.35, 0, -1.4);
  addBox(bed, 1.12, 0.2, 2.0, M.sheet, 2.35, 0.28, -1.4, { sx: 4, sz: 6 });
  addBox(bed, 1.2, 0.75, 0.06, M.darkWood, 2.35, 0, -2.45);
  var pillow = addBox(bed, 0.6, 0.12, 0.38, M.white, 2.35, 0.48, -2.1, { sx: 3, sz: 3 });
  var blanket = addBox(bed, 1.16, 0.08, 1.3, M.blanket, 2.35, 0.48, -0.95, { sx: 4, sz: 5 });
  addCol(1.75, 2.95, -2.5, -0.35);
  WORLD.bedPos = new THREE.Vector3(2.35, 0.6, -1.4);
  // floor lamp next to bed
  addBox(W, 0.28, 0.03, 0.28, M.black, 2.7, 0, 0.05);
  addBox(W, 0.03, 1.35, 0.03, M.black, 2.7, 0, 0.05);
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb050, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
  shade.position.set(2.7, 1.45, 0.05); W.add(shade); addCol(2.55, 2.85, -0.1, 0.2);

  // ---- sofa (facing -x toward TV) ----
  var sofa = new THREE.Group(); W.add(sofa);
  addBox(sofa, 0.75, 0.38, 1.6, M.fabric, 1.15, 0, 0.8, { sx: 2, sz: 4 });
  addBox(sofa, 0.2, 0.75, 1.6, M.fabric, 1.45, 0, 0.8, { sz: 4, sy: 2 });
  addBox(sofa, 0.75, 0.55, 0.16, M.fabric, 1.15, 0, -0.02); addBox(sofa, 0.75, 0.55, 0.16, M.fabric, 1.15, 0, 1.62);
  addBox(sofa, 0.5, 0.12, 0.7, M.fabric, 1.1, 0.38, 0.4, { sx: 2, sz: 2 }); addBox(sofa, 0.5, 0.12, 0.7, M.fabric, 1.1, 0.38, 1.18, { sx: 2, sz: 2 });
  var cushion = addBox(sofa, 0.12, 0.38, 0.38, stdMat({ color: 0x7dd3fc, roughness: 1 }), 1.3, 0.48, 1.3, { sx: 2, sy: 2, sz: 2 }); cushion.rotation.z = 0.2;
  addCol(0.75, 1.55, -0.1, 1.7);
  WORLD.sofaSeat = new THREE.Vector3(1.05, 0, 0.8);

  // ---- rug & low table ----
  var rug = addPlane(W, 2.2, 1.6, M.rug, -0.55, 0.006, 0.6, -PI / 2, 0, 3);
  var table = new THREE.Group(); W.add(table);
  addBox(table, 1.1, 0.04, 0.65, M.wood, -0.55, 0.34, 0.6);
  [[-1.05, 0.33], [-0.05, 0.33], [-1.05, 0.87], [-0.05, 0.87]].forEach(function (p) { addBox(table, 0.05, 0.34, 0.05, M.wood, p[0], 0, p[1]); });
  addCol(-1.12, 0.02, 0.26, 0.94);
  WORLD.tableTop = 0.38;
  // ramune case on table (transparent box with candy inside)
  var rcase = new THREE.Group(); rcase.position.set(-0.75, WORLD.tableTop, 0.55); W.add(rcase);
  addBox(rcase, 0.3, 0.025, 0.2, stdMat({ map: TEX.caseLabel, roughness: 0.4 }, true), 0, 0, 0);
  var lid = addBox(rcase, 0.3, 0.07, 0.2, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false }), 0, 0.025, 0);
  var pillGeo = new THREE.SphereGeometry(0.018, 8, 6);
  for (var pi = 0; pi < 26; pi++) {
    var s = SUBS[pi % 19];
    var pm = new THREE.Mesh(pillGeo, new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.25, roughness: 0.3 }));
    pm.position.set(-0.12 + (pi % 7) * 0.04, 0.04 + Math.floor(pi / 21) * 0.025, -0.07 + Math.floor(pi / 7) % 3 * 0.065); pm.scale.y = 0.6; rcase.add(pm);
  }
  WORLD.caseGlow = new THREE.PointLight(0xc77dff, 0.25, 1.2); WORLD.caseGlow.position.set(0, 0.2, 0); rcase.add(WORLD.caseGlow);
  addInter('ramune', 'ラムネケース', 'ラムネを選ぶ', new THREE.Vector3(-0.75, 0.45, 0.55), [rcase], function () { openPillMenu(); }, { reach: 2.4 });
  // phone on table
  var phone = new THREE.Group(); phone.position.set(-0.3, WORLD.tableTop, 0.75); phone.rotation.y = 0.4; W.add(phone);
  addBox(phone, 0.075, 0.01, 0.15, M.black, 0, 0, 0);
  var scr = addPlane(phone, 0.066, 0.14, new THREE.MeshBasicMaterial({ map: TEX.phone }), 0, 0.0115, 0, -PI / 2, 0);
  addInter('phone', 'スマホ', 'スマホを見る', new THREE.Vector3(-0.3, 0.42, 0.75), [phone], function () { openPhone(); });
  // remote
  addBox(W, 0.05, 0.02, 0.17, M.black, -0.95, WORLD.tableTop, 0.8, { ry: -0.3 });
  WORLD.canSpots = [];
  for (var cs = 0; cs < 14; cs++) WORLD.canSpots.push(new THREE.Vector3(-0.98 + (cs % 7) * 0.14 + (cs >= 7 ? 0.07 : 0), WORLD.tableTop, 0.38 + (cs >= 7 ? 0.42 : 0)));

  // ---- TV & stand (west wall, facing +x) ----
  addBox(W, 0.42, 0.45, 1.6, M.darkWood, -2.76, 0, 0.5, { col: true });
  var tvGroup = new THREE.Group(); W.add(tvGroup);
  addBox(tvGroup, 0.06, 0.72, 1.22, M.black, -2.82, 0.55, 0.5);
  var tvScreen = addPlane(tvGroup, 1.14, 0.64, new THREE.MeshBasicMaterial({ map: TEX.tv }), -2.785, 0.91, 0.5, 0, PI / 2);
  addBox(tvGroup, 0.2, 0.08, 0.3, M.black, -2.8, 0.45, 0.5);
  WORLD.tvScreen = tvScreen;
  addInter('tv', 'テレビ', 'テレビをつける/消す', new THREE.Vector3(-2.78, 0.9, 0.5), [tvGroup], function () { WORLD.tvOn = !WORLD.tvOn; sfx('tv'); toast(WORLD.tvOn ? 'テレビをつけた' : 'テレビを消した'); });
  // speaker
  var spk = new THREE.Group(); W.add(spk);
  addBox(spk, 0.3, 0.9, 0.3, M.black, -2.78, 0, -0.55, { col: true });
  var cone1 = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), M.metal); cone1.position.set(-2.625, 0.62, -0.55); cone1.rotation.y = PI / 2; spk.add(cone1);
  var cone2 = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), M.metal); cone2.position.set(-2.625, 0.3, -0.55); cone2.rotation.y = PI / 2; spk.add(cone2);
  WORLD.cones = [cone1, cone2];
  var spkLed = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), new THREE.MeshBasicMaterial({ color: 0x00ffaa })); spkLed.position.set(-2.625, 0.82, -0.55); spkLed.rotation.y = PI / 2; spk.add(spkLed); WORLD.spkLed = spkLed;
  addInter('speaker', 'スピーカー', '音楽をつける/消す', new THREE.Vector3(-2.7, 0.6, -0.55), [spk], function () { AU.music = !AU.music; auVol(); sfx('click'); toast(AU.music ? '音楽をつけた' : '音楽を止めた'); });

  // ---- shelf ----
  var shelf = new THREE.Group(); W.add(shelf);
  addBox(shelf, 0.35, 1.6, 1.0, M.wood, -2.8, 0, -1.85, { col: true });
  for (var sh = 0; sh < 4; sh++) {
    addBox(shelf, 0.34, 0.02, 0.96, M.darkWood, -2.78, 0.05 + sh * 0.4, -1.85);
    for (var bk = 0; bk < 9; bk++) if (Math.random() < 0.8) {
      var bh = 0.2 + Math.random() * 0.14;
      addBox(shelf, 0.22, bh, 0.06 + Math.random() * 0.03, stdMat({ color: new THREE.Color().setHSL(Math.random(), 0.5, 0.45), roughness: 0.8 }), -2.75, 0.07 + sh * 0.4, -2.28 + bk * 0.1);
    }
  }
  // ---- plant in corner ----
  addBox(W, 0.32, 0.36, 0.32, M.pot, -2.7, 0, 1.55, { col: true });
  for (var lf = 0; lf < 7; lf++) {
    var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.plant);
    leaf.scale.set(0.5, 1.4, 0.2); leaf.position.set(-2.7 + Math.cos(lf) * 0.12, 0.6 + (lf % 3) * 0.18, 1.55 + Math.sin(lf) * 0.12);
    leaf.rotation.set(Math.sin(lf * 2) * 0.5, lf, Math.cos(lf) * 0.5); W.add(leaf);
  }

  // ---- kitchen ----
  var kit = new THREE.Group(); W.add(kit);
  addBox(kit, 2.0, 0.86, 0.6, M.white, -1.95, 0, 2.2);
  addBox(kit, 2.04, 0.04, 0.62, stdMat({ color: 0x9aa3ab, roughness: 0.25, metalness: 0.6 }), -1.95, 0.86, 2.2);
  addCol(-2.95, -0.95, 1.88, 2.5);
  var sinkHole = addBox(kit, 0.5, 0.02, 0.36, M.metal, -2.3, 0.885, 2.2);
  addBox(kit, 0.03, 0.28, 0.03, M.metal, -2.3, 0.9, 2.42); addBox(kit, 0.03, 0.03, 0.18, M.metal, -2.3, 1.16, 2.34);
  var waterStream = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.26, 6), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.6, emissive: 0x335577 }));
  waterStream.position.set(-2.3, 1.03, 2.26); waterStream.visible = false; kit.add(waterStream); WORLD.water = waterStream;
  addInter('sink', 'キッチンの蛇口', '水を飲む', new THREE.Vector3(-2.3, 1.0, 2.2), [sinkHole], function () { actWater(); });
  // stove
  addBox(kit, 0.6, 0.02, 0.4, M.black, -1.4, 0.885, 2.2);
  [[-1.55, 2.2], [-1.25, 2.2]].forEach(function (p) { var r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 16), M.metal); r.rotation.x = PI / 2; r.position.set(p[0], 0.91, p[1]); kit.add(r); });
  // kettle, cup noodles
  var kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 14), M.metal); kettle.position.set(-1.25, 0.99, 2.2); kit.add(kettle);
  var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 12), stdMat({ color: 0xffffff })); cup.position.set(-1.0, 0.95, 2.05); kit.add(cup);
  // upper cabinets
  addBox(kit, 2.0, 0.6, 0.35, M.white, -1.95, 1.65, 2.33);
  addBox(kit, 0.6, 0.02, 0.3, M.black, -1.4, 1.62, 2.3);
  // fridge
  var fr = new THREE.Group(); W.add(fr);
  addBox(fr, 0.62, 1.5, 0.62, stdMat({ color: 0xe8f0f2, roughness: 0.3, metalness: 0.2 }), -0.58, 0, 2.18);
  addBox(fr, 0.03, 0.5, 0.03, M.metal, -0.33, 0.85, 1.86); addBox(fr, 0.6, 0.01, 0.01, M.black, -0.58, 1.0, 1.869);
  var mag = addBox(fr, 0.12, 0.09, 0.01, stdMat({ map: TEX.poster3 }), -0.7, 1.2, 1.866);
  addCol(-0.9, -0.26, 1.86, 2.5);
  addInter('fridge', '冷蔵庫', 'ZER9を取る', new THREE.Vector3(-0.58, 1.0, 1.9), [fr], function () { openDrinkMenu(); });
  // trash bin (empties)
  var bin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.4, 14), stdMat({ color: 0x5f6b73 })); bin.position.set(-0.05, 0.2, 2.25); W.add(bin);

  // ---- light switch & wall clock & posters ----
  var sw = addBox(W, 0.08, 0.12, 0.02, M.white, 1.15, 1.15, 2.49);
  addInter('switch', '電気のスイッチ', '照明を切り替える', new THREE.Vector3(1.15, 1.2, 2.48), [sw], function () { WORLD.lightMode = (WORLD.lightMode + 1) % 3; sfx('click'); toast(['照明：ふつう', '照明：ネオンモード', '照明：暗め（ランプだけ）'][WORLD.lightMode]); });
  var clock = new THREE.Group(); clock.position.set(-1.95, 2.0, 2.48); clock.rotation.y = PI; W.add(clock);
  var face = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), stdMat({ color: 0xffffff, roughness: 0.4 })); clock.add(face);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 8, 32), M.black); clock.add(rim);
  for (var tk = 0; tk < 12; tk++) { var tm = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.03, 0.005), M.black); tm.position.set(Math.sin(tk / 12 * TAU) * 0.145, Math.cos(tk / 12 * TAU) * 0.145, 0.005); tm.rotation.z = -tk / 12 * TAU; clock.add(tm); }
  var hh = new THREE.Group(), mh = new THREE.Group(); clock.add(hh); clock.add(mh);
  var hhm = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.09, 0.006), M.black); hhm.position.y = 0.04; hhm.position.z = 0.008; hh.add(hhm);
  var mhm = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.13, 0.006), M.black); mhm.position.y = 0.06; mhm.position.z = 0.012; mh.add(mhm);
  WORLD.clockH = hh; WORLD.clockM = mh;
  addPlane(W, 0.5, 0.7, stdMat({ map: TEX.poster1, roughness: 0.6 }), 2.99, 1.55, -1.3, 0, -PI / 2);
  addPlane(W, 0.45, 0.63, stdMat({ map: TEX.poster2, roughness: 0.6 }), -2.99, 1.65, -0.55, 0, PI / 2);
  addPlane(W, 0.45, 0.63, stdMat({ map: TEX.poster3, roughness: 0.6 }), 0.45, 1.5, 2.49, 0, PI);

  // ---- bathroom ----
  var bath = new THREE.Group(); W.add(bath);
  addPlane(bath, 2.4, 1.8, M.tile, 1.8, 0.002, 3.4, -PI / 2, 0, 2);
  addPlane(bath, 2.4, 1.8, M.ceil, 1.8, ROOM.h, 3.4, PI / 2, 0, 1);
  addPlane(bath, 2.4, 2.5, M.tile, 1.8, 1.25, 4.3, 0, PI, 3); addCol(0.6, 3, 4.25, 4.4);
  addPlane(bath, 1.8, 2.5, M.tile, 0.6, 1.25, 3.4, 0, PI / 2, 3); addCol(0.5, 0.65, 2.5, 4.3);
  addPlane(bath, 1.8, 2.5, M.tile, 3.0, 1.25, 3.4, 0, -PI / 2, 3); addCol(2.95, 3.1, 2.5, 4.3);
  addPlane(bath, 0.7, 2.5, M.tile, 0.95, 1.25, 2.52, 0, 0, 3); addPlane(bath, 0.9, 2.5, M.tile, 2.55, 1.25, 2.52, 0, 0, 3); addPlane(bath, 0.8, 0.45, M.tile, 1.7, 2.275, 2.52, 0, 0, 3);
  // door frame
  addBox(W, 0.05, 2.05, 0.14, M.white, 1.3, 0, 2.5); addBox(W, 0.05, 2.05, 0.14, M.white, 2.1, 0, 2.5); addBox(W, 0.85, 0.05, 0.14, M.white, 1.7, 2.03, 2.5);
  // open door leaf
  var door = addBox(W, 0.78, 2.0, 0.04, M.white, 0, 0, 0); door.position.set(1.33, 1.0, 2.9); door.rotation.y = -PI / 2 + 0.25; door.geometry.translate(0.39, 0, 0);
  // toilet
  var toilet = new THREE.Group(); toilet.position.set(2.6, 0, 3.7); bath.add(toilet);
  var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 18), M.ceramic); bowl.position.set(-0.05, 0.2, 0); bowl.scale.set(1.25, 1, 1); toilet.add(bowl);
  var seat = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 20), M.ceramic); seat.rotation.x = PI / 2; seat.position.set(-0.07, 0.41, 0); seat.scale.set(1.25, 1, 1); toilet.add(seat);
  var tank = addBox(toilet, 0.2, 0.42, 0.42, M.ceramic, 0.22, 0.35, 0);
  addCol(2.2, 3.0, 3.4, 4.0);
  addInter('toilet', 'トイレ', '吐く / 流す', new THREE.Vector3(2.55, 0.45, 3.7), [toilet], function () { actToilet(); });
  // washbasin + mirror
  var basin = new THREE.Group(); basin.position.set(0.85, 0, 3.5); bath.add(basin);
  addBox(basin, 0.42, 0.8, 0.5, M.white, 0.06, 0, 0);
  var bowl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.12, 18), M.ceramic); bowl2.position.set(0.08, 0.84, 0); basin.add(bowl2);
  var mirror = addPlane(basin, 0.6, 0.75, new THREE.MeshStandardMaterial({ color: 0xa8b8c8, roughness: 0.05, metalness: 1.0 }), -0.22, 1.5, 0, 0, PI / 2);
  addCol(0.6, 1.15, 3.2, 3.8);
  addInter('mirror', '鏡', '鏡を見る', new THREE.Vector3(0.66, 1.5, 3.5), [mirror, basin], function () { actMirror(); });
  // towel
  addBox(bath, 0.04, 0.5, 0.35, stdMat({ color: 0xffb3c7 }), 2.95, 0.9, 3.0);

  // ---- bed interaction / balcony interaction ----
  addInter('bed', 'ベッド', '横になる', new THREE.Vector3(2.35, 0.6, -1.3), [bed], function () { openBedMenu(); });
  addInter('rail', 'ベランダの手すり', '夜風にあたる', new THREE.Vector3(-0.8, 1.05, -4.2), [], function () { toast('夜風がきもちいい…（ベランダにいると体温が下がり、吐き気が少しおさまる）'); });

  // ---- lights ----
  var Lt = WORLD.L;
  Lt.hemi = new THREE.HemisphereLight(0x8a90c0, 0x302018, 0.28); S.add(Lt.hemi);
  Lt.ceil = new THREE.PointLight(0xffdcb0, 0.8, 9, 1.7); Lt.ceil.position.set(0, 2.3, 0); S.add(Lt.ceil);
  Lt.lamp = new THREE.PointLight(0xffa65a, 0.7, 6, 1.8); Lt.lamp.position.set(2.7, 1.45, 0.05); S.add(Lt.lamp);
  Lt.tv = new THREE.PointLight(0x7ab8ff, 0.5, 5, 2); Lt.tv.position.set(-2.3, 0.95, 0.5); S.add(Lt.tv);
  Lt.neon = new THREE.PointLight(0xff3fb0, 0, 9, 1.4); Lt.neon.position.set(0, 2.2, -0.5); S.add(Lt.neon);
  Lt.bath = new THREE.PointLight(0xf0f6ff, 0.7, 4, 2); Lt.bath.position.set(1.8, 2.3, 3.4); S.add(Lt.bath);
  Lt.moon = new THREE.DirectionalLight(0x8aa6ff, 0.35); Lt.moon.position.set(-20, 30, -60); S.add(Lt.moon);
  // neon strip (visible in neon mode)
  var strip = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xff3fb0 }));
  strip.position.set(0, 2.42, 2.43); W.add(strip);
  var strip2 = strip.clone(); strip2.position.set(0, 2.42, -2.43); W.add(strip2);
  WORLD.strips = [strip, strip2];

  buildCity();
  buildSky();
  buildHeld();
  buildSelfBody();
}

// ---- city -------------------------------------------------------------------------
function mergeBoxes(list, mat) {
  // list: [{w,h,d,x,y,z,uvRepeat}]
  var pos = [], nor = [], uv = [];
  list.forEach(function (b) {
    var g = new THREE.BoxGeometry(b.w, b.h, b.d).toNonIndexed();
    g.translate(b.x, b.y + b.h / 2, b.z);
    var p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv.array;
    for (var i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
    for (var j = 0; j < u.length; j += 2) {
      var face = Math.floor(j / 12); // 6 verts per face (non-indexed), 2 comps
      var sx = (face < 2) ? b.d : b.w, top = face === 2 || face === 3;
      uv.push(top ? 0.02 : u[j] * Math.max(1, Math.round(sx / 6)), top ? 0.02 : u[j + 1] * Math.max(1, Math.round(b.h / 14)) * b.flip);
    }
  });
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return new THREE.Mesh(geo, mat);
}
function buildCity() {
  var S = RENDER.scene, city = new THREE.Group(); S.add(city); WORLD.city = city;
  var GY = -26; // street level relative to our floor (8F)
  var groups = [[], [], [], []], i;
  for (i = 0; i < 260; i++) {
    var a = rnd(-PI * 0.95, PI * 0.95) - PI / 2; // mostly in front (−z) and sides
    var d = rnd(22, 190);
    var x = Math.cos(a) * d, z = Math.sin(a) * d - 6;
    if (z > -8 && Math.abs(x) < 16) continue;
    if (z > 10) continue;
    var w = rnd(8, 20), dd = rnd(8, 20), h = rnd(10, 30) + (d > 80 ? rnd(10, 70) : rnd(0, 30));
    groups[i % 4].push({ w: w, h: h, d: dd, x: x, y: GY, z: z, flip: 1 });
  }
  groups.forEach(function (gl, k) {
    var m = mergeBoxes(gl, basicMat({ map: TEX.win[k], color: 0xffffff }));
    city.add(m);
  });
  // ground & streets
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), basicMat({ color: 0x07070c }));
  ground.rotation.x = -PI / 2; ground.position.y = GY; city.add(ground);
  var lightsGeo = new THREE.BufferGeometry(), lp = [], lc = [];
  for (i = 0; i < 1400; i++) {
    var sx, sz;
    if (i % 2) { sx = Math.round(rnd(-10, 10)) * 18 + rnd(-1, 1); sz = rnd(-220, 10); } else { sz = Math.round(rnd(-12, 0)) * 18 - 4; sx = rnd(-220, 220); }
    lp.push(sx, GY + 0.5, sz);
    var c = Math.random() < 0.7 ? [1, 0.75, 0.4] : Math.random() < 0.5 ? [1, 0.2, 0.15] : [0.7, 0.85, 1];
    lc.push(c[0], c[1], c[2]);
  }
  lightsGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  lightsGeo.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  var pts = new THREE.Points(lightsGeo, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, map: TEX.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  city.add(pts); WORLD.streetLights = pts;
  // neon signs on nearby rooftops
  [[TEX.neon1, -18, -2, -34, 0.2], [TEX.neon2, 16, 4, -40, -0.3], [TEX.neon3, -40, -6, -60, 0.4], [TEX.neon4, 34, -2, -70, -0.4]].forEach(function (n) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.75), new THREE.MeshBasicMaterial({ map: n[0], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.set(n[1], n[2], n[3]); m.rotation.y = n[4]; city.add(m);
    WORLD.anim.push(function (t) { m.material.opacity = 0.75 + 0.25 * Math.sin(t * (3 + n[1] * 0.1)) * (Math.random() < 0.02 ? 0 : 1); });
  });
  // radio tower with blinking light
  var tw = new THREE.Group(); tw.position.set(60, GY, -150); city.add(tw);
  for (i = 0; i < 6; i++) { var seg = new THREE.Mesh(new THREE.CylinderGeometry(1.2 - i * 0.18, 1.4 - i * 0.18, 18, 4, 1, true), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xd23030 : 0xeeeeee, wireframe: true })); seg.position.y = 9 + i * 18; tw.add(seg); }
  var beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff2020, blending: THREE.AdditiveBlending, depthWrite: false })); beacon.scale.set(8, 8, 1); beacon.position.y = 112; tw.add(beacon);
  WORLD.anim.push(function (t) { beacon.material.opacity = Math.sin(t * 3) > 0.3 ? 1 : 0.1; });
  // moving cars far below (head/tail light pairs)
  var cars = []; for (i = 0; i < 24; i++) {
    var car = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: i % 2 ? 0xfff0c0 : 0xff3030, blending: THREE.AdditiveBlending, depthWrite: false }));
    car.scale.set(2.2, 2.2, 1); city.add(car);
    cars.push({ s: car, lane: Math.round(rnd(-12, 0)) * 18 - 4, x: rnd(-200, 200), v: (i % 2 ? 1 : -1) * rnd(8, 16) });
  }
  WORLD.anim.push(function (t, dt) { cars.forEach(function (c) { c.x += c.v * dt; if (c.x > 220) c.x = -220; if (c.x < -220) c.x = 220; c.s.position.set(c.x, GY + 0.8, c.lane + (c.v > 0 ? 1.5 : -1.5)); }); });
}

// ---- sky ----------------------------------------------------------------------------
var SKYU = { uT: { value: 0 }, uPsy: { value: 0 }, uMorning: { value: 0 } };
function buildSky() {
  var mat = new THREE.ShaderMaterial({
    uniforms: SKYU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform float uT, uPsy, uMorning; varying vec3 vD;',
      'float h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
      'void main(){',
      '  float y = vD.y;',
      '  vec3 night = mix(vec3(0.10, 0.06, 0.20), vec3(0.01, 0.015, 0.05), smoothstep(-0.05, 0.6, y));',
      '  vec3 dawn = mix(vec3(1.0, 0.62, 0.42), vec3(0.35, 0.55, 0.9), smoothstep(-0.05, 0.5, y));',
      '  vec3 col = mix(night, dawn, uMorning);',
      '  vec3 sp = floor(vD * 260.0); float st = step(0.9975, h(sp));',
      '  col += st * (0.6 + 0.4 * sin(uT * 3.0 + h(sp + 1.0) * 40.0)) * smoothstep(0.02, 0.3, y) * (1.0 - uMorning);',
      '  if (uPsy > 0.01) {',
      '    vec2 q = vD.xz / (abs(vD.y) + 0.3) * 2.0; float a = atan(q.y, q.x), r = length(q);',
      '    float sw = sin(a * 5.0 + r * 3.0 - uT * 0.8) + sin(r * 6.0 - uT * 1.3);',
      '    vec3 neb = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + sw * 0.15 + uT * 0.03));',
      '    col = mix(col, neb * 0.8, clamp(uPsy * 0.55, 0.0, 0.8) * smoothstep(-0.1, 0.4, y));',
      '  }',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  });
  var sky = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 16), mat); sky.renderOrder = -10; RENDER.scene.add(sky); WORLD.sky = sky;
  var moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.moon, fog: false, depthWrite: false, transparent: true }));
  moon.scale.set(22, 22, 1); moon.position.set(-60, 90, -230); RENDER.scene.add(moon); WORLD.moon = moon;
}

// ---- held item (camera space) ---------------------------------------------------------
var HELD = { g: null, kind: null, t: 0, dur: 0, cb: null, mesh: null };
function buildHeld() {
  HELD.g = new THREE.Group(); RENDER.camera.add(HELD.g); HELD.g.visible = false;
  var hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.7 }));
  hand.scale.set(1.3, 0.7, 1.6); HELD.hand = hand; hand.visible = false; HELD.g.add(hand);
  var light = new THREE.PointLight(0xffffff, 0.6, 0.8); light.position.set(0, 0.1, 0.2); HELD.g.add(light);
}
function pillMesh(s) {
  var pts = shapePoints(s.shape);
  var shp = new THREE.Shape(); pts.forEach(function (p, i) { if (i) shp.lineTo(p[0], p[1]); else shp.moveTo(p[0], p[1]); });
  if (s.shape === 'ring') { var hole = new THREE.Path(); hole.absarc(0, 0, 0.45, 0, TAU, true); shp.holes.push(hole); }
  var geo = new THREE.ExtrudeGeometry(shp, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.12, bevelSegments: 3, curveSegments: 8 });
  geo.center();
  var mat = new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.18, roughness: 0.22, metalness: 0.05 });
  var m = new THREE.Mesh(geo, mat); m.scale.setScalar(0.022); return m;
}
function canMesh(d) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, d.alc > 1.5 ? 0.17 : 0.122, 20, 1, true), new THREE.MeshStandardMaterial({ map: canLabelTex(d), roughness: 0.3, metalness: 0.6 }));
  g.add(body);
  var top = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.033, 0.012, 20), new THREE.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.9, roughness: 0.25 }));
  top.position.y = (d.alc > 1.5 ? 0.17 : 0.122) / 2 + 0.006; g.add(top);
  var bot = top.clone(); bot.position.y = -top.position.y; bot.rotation.x = PI; g.add(bot);
  return g;
}
function holdItem(kind, obj, dur, cb) {
  if (HELD.mesh) HELD.g.remove(HELD.mesh);
  HELD.mesh = obj; HELD.g.add(obj); HELD.kind = kind; HELD.t = 0; HELD.dur = dur; HELD.cb = cb; HELD.g.visible = true;
}
function updateHeld(dt) {
  if (!HELD.kind) return;
  HELD.t += dt; var k = HELD.t / HELD.dur, g = HELD.g, m = HELD.mesh;
  var up = smooth(Math.min(1, k * 3)) * (1 - smooth((k - 0.85) / 0.15));
  if (HELD.kind === 'pill') {
    g.position.set(0.0, -0.2 + up * 0.12 - smooth((k - 0.6) / 0.3) * 0.1, -0.34 + smooth((k - 0.55) / 0.35) * 0.22);
    m.rotation.set(0.25, Math.sin(HELD.t * 2.2) * 0.6, HELD.t * 2.2);
    m.position.set(0, 0, 0);
    m.visible = k < 0.88;
  } else {
    var dk = smooth((k - 0.25) / 0.3);
    g.position.set(0.06 - up * 0.05, -0.34 + up * 0.2 + dk * 0.1 * up, -0.34 + up * 0.04 + dk * 0.1 * up);
    var tilt = dk * 2.05 * (1 - smooth((k - 0.8) / 0.15) * 0.6);
    m.rotation.set(tilt, 0, -tilt * 0.3);
    m.position.set(0, 0.03, 0);
    HELD.hand.position.set(0.02, -0.02, 0.01);
  }
  if (k >= 1) { HELD.g.visible = false; HELD.kind = null; var cb = HELD.cb; HELD.cb = null; if (cb) cb(); }
}

// ---- self body (seen when leaving the body) ---------------------------------------------
function buildSelfBody() {
  var b = new THREE.Group(), skin = new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.7 }), cloth = new THREE.MeshStandardMaterial({ color: 0x3b3f6b, roughness: 0.9 }), pants = new THREE.MeshStandardMaterial({ color: 0x22252e, roughness: 0.9 });
  var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.55, 12), cloth); torso.position.y = 1.05; b.add(torso);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), skin); head.position.y = 1.47; b.add(head);
  var hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12, 0, TAU, 0, PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x1b1412, roughness: 0.9 })); hair.position.y = 1.48; b.add(hair);
  [-1, 1].forEach(function (s) {
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.55, 8), cloth); arm.position.set(s * 0.22, 1.02, 0); arm.rotation.z = s * 0.12; b.add(arm);
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.8, 8), pants); leg.position.set(s * 0.08, 0.4, 0); b.add(leg);
  });
  b.visible = false; RENDER.scene.add(b); WORLD.self = b;
}
function placeCanOnTable(d) {
  var i = WORLD.cans.length; if (i >= WORLD.canSpots.length) return;
  var m = canMesh(d); var p = WORLD.canSpots[i];
  m.position.set(p.x + rnd(-0.02, 0.02), p.y + (d.alc > 1.5 ? 0.085 : 0.061), p.z + rnd(-0.02, 0.02));
  if (Math.random() < 0.25 && WORLD.cans.length > 3) { m.rotation.z = PI / 2; m.position.y = p.y + 0.033; m.rotation.y = rnd(0, TAU); }
  RENDER.scene.add(m); WORLD.cans.push(m);
}


// ===== 08_halluc.js =====
// ---- hallucinations living in the 3D room -----------------------------------------
var HAL = { floaters: [], shadows: [], bugs: [], hearts: null, friend: null, friendT: 0, friendLine: 0, t: 0 };

function buildHallucinations() {
  var S = RENDER.scene, i;
  // psychedelic floaters
  var geos = [new THREE.IcosahedronGeometry(0.16, 0), new THREE.TorusKnotGeometry(0.12, 0.035, 64, 8), new THREE.OctahedronGeometry(0.15, 0), new THREE.TorusGeometry(0.14, 0.04, 8, 24), new THREE.DodecahedronGeometry(0.14, 0)];
  for (i = 0; i < 16; i++) {
    var m = new THREE.Mesh(geos[i % geos.length], new THREE.MeshNormalMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    m.userData = { home: new THREE.Vector3(rnd(-2.6, 2.6), rnd(0.6, 2.2), rnd(-2.2, 2.2)), ph: rnd(0, TAU), sp: rnd(0.3, 0.9), rs: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) };
    m.visible = false; S.add(m); HAL.floaters.push(m);
  }
  // hearts (emp)
  var hc = mkCanvas(64, 64), g = hc.getContext('2d');
  g.fillStyle = '#ff7ab8'; g.shadowColor = '#ff7ab8'; g.shadowBlur = 10; drawShape(g, 'heart', 32, 32, 22); g.fill();
  var hg = new THREE.BufferGeometry(), hp = [];
  for (i = 0; i < 70; i++) hp.push(rnd(-2.8, 2.8), rnd(0, 2.4), rnd(-2.4, 2.4));
  hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
  HAL.hearts = new THREE.Points(hg, new THREE.PointsMaterial({ size: 0.12, map: toTex(hc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  HAL.hearts.visible = false; S.add(HAL.hearts);
  // shadow people
  var dark = new THREE.MeshBasicMaterial({ color: 0x020203, transparent: true, opacity: 0 });
  for (i = 0; i < 3; i++) {
    var f = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 10), dark.clone()); body.position.y = 0.75; f.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), body.material); head.position.y = 1.65; f.add(head);
    var hat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16), body.material); hat.position.y = 1.76; f.add(hat);
    var hat2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.16, 16), body.material); hat2.position.y = 1.85; f.add(hat2);
    var eyeM = new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff3b3b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    [-0.05, 0.05].forEach(function (x) { var e = new THREE.Sprite(eyeM); e.scale.set(0.06, 0.06, 1); e.position.set(x, 1.67, 0.13); f.add(e); });
    f.userData = { mat: body.material, eye: eyeM, a: 0, life: 0, cd: rnd(2, 8) };
    f.visible = false; S.add(f); HAL.shadows.push(f);
  }
  // bugs on walls
  for (i = 0; i < 14; i++) {
    var b = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ map: TEX.bug, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    b.userData = { wall: i % 4, u: rnd(-2.2, 2.2), v: rnd(0.3, 2.2), dir: rnd(0, TAU), sp: rnd(0.05, 0.25) };
    b.visible = false; S.add(b); HAL.bugs.push(b);
  }
  // imaginary friend on the sofa
  var fr = new THREE.Group(), fm = new THREE.MeshStandardMaterial({ color: 0x8890ff, emissive: 0x2a2f80, transparent: true, opacity: 0, depthWrite: false, roughness: 0.8 });
  var ft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.55, 12), fm); ft.position.y = 0.72; fr.add(ft);
  var fh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), fm); fh.position.y = 1.12; fr.add(fh);
  var fl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.32), fm); fl.position.set(-0.2, 0.47, 0); fr.add(fl);
  fr.position.set(1.12, 0, 0.35); fr.rotation.y = -PI / 2; fr.userData = { mat: fm, a: 0 }; fr.visible = false; S.add(fr); HAL.friend = fr;
}

var FRIEND_LINES = ['よっ。来ちゃった。', 'ねえ、ZER9もう1本もらっていい？', 'このテレビ、さっきから同じ人しか出てなくない？', 'タバコある？…ないか。', 'あれ、俺いつからここにいたっけ。', 'お前の部屋、天井ひくいな。', '…（なにか話しているが聞き取れない）', 'ラムネって、こんなに種類あったっけ'];

function updateHallucinations(dt, B, cam) {
  HAL.t += dt;
  var V = B.vis, t = HAL.t, i;
  var calm = SAVE.settings.calm ? 0.5 : 1;
  var fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  var cp = cam.getWorldPosition(new THREE.Vector3());
  // floaters
  var fa = clamp((V.psy - 0.35) * 0.9, 0, 0.85) * calm;
  HAL.floaters.forEach(function (m, k) {
    m.visible = fa > 0.01;
    if (!m.visible) return;
    var u = m.userData;
    m.material.opacity = fa;
    m.position.set(u.home.x + Math.sin(t * u.sp + u.ph) * 0.5, u.home.y + Math.sin(t * u.sp * 1.3 + u.ph) * 0.25, u.home.z + Math.cos(t * u.sp * 0.8 + u.ph) * 0.5);
    m.rotation.x += u.rs.x * dt; m.rotation.y += u.rs.y * dt; m.rotation.z += u.rs.z * dt;
    m.scale.setScalar(0.6 + Math.min(1.5, V.psy) * 0.6 + Math.sin(t * 2 + k) * 0.1);
    var dc = m.position.distanceTo(cp); if (dc < 1.3) m.material.opacity = fa * clamp((dc - 0.6) / 0.7, 0, 1);
  });
  // hearts
  var ha = clamp(V.emp - 0.3, 0, 1) * 0.9;
  HAL.hearts.visible = ha > 0.01;
  if (HAL.hearts.visible) {
    HAL.hearts.material.opacity = ha;
    var p = HAL.hearts.geometry.attributes.position;
    for (i = 0; i < p.count; i++) { var y = p.getY(i) + dt * (0.15 + (i % 5) * 0.04); if (y > 2.45) y = 0.05; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t + i) * dt * 0.05); }
    p.needsUpdate = true;
  }
  // shadow people
  var da = clamp(V.del - 0.3, 0, 1.2);
  HAL.shadows.forEach(function (f, k) {
    var u = f.userData;
    if (da <= 0.01) { f.visible = false; u.a = 0; return; }
    u.cd -= dt;
    if (!f.visible) {
      if (u.cd <= 0 && Math.random() < 0.5 * da) {
        // spawn in peripheral vision
        var side = Math.random() < 0.5 ? -1 : 1, ang = Math.atan2(fwd.x, fwd.z) + side * rnd(0.9, 1.6), d = rnd(2.0, 3.6);
        var x = clamp(cp.x + Math.sin(ang) * d, -2.6, 2.6), z = clamp(cp.z + Math.cos(ang) * d, -3.9, 4.0);
        f.position.set(x, 0, z); f.lookAt(cp.x, 0, cp.z);
        f.visible = true; u.a = 0; u.life = rnd(4, 10);
      }
      return;
    }
    u.life -= dt;
    var to = new THREE.Vector3(f.position.x - cp.x, 0, f.position.z - cp.z); var dist = to.length(); to.normalize();
    var dot = fwd.x * to.x + fwd.z * to.z;
    var target = (dot > 0.93 || dist < 1.1 || u.life <= 0) ? 0 : clamp(da, 0, 1) * 0.92;
    u.a = damp(u.a, target, target > u.a ? 0.8 : 6, dt);
    u.mat.opacity = u.a; u.eye.opacity = u.a * (0.6 + 0.4 * Math.sin(t * 9 + k));
    f.lookAt(cp.x, 0, cp.z);
    if (u.a < 0.02 && (dot > 0.93 || u.life <= 0 || dist < 1.1)) { f.visible = false; u.cd = rnd(3, 10); if (dot > 0.93 && Math.random() < 0.5) sfx('whisper', 0); }
  });
  // bugs
  var ba = clamp(V.del - 0.5, 0, 1) * calm;
  HAL.bugs.forEach(function (b) {
    b.visible = ba > 0.01; if (!b.visible) return;
    var u = b.userData;
    u.dir += rnd(-2, 2) * dt; u.u += Math.cos(u.dir) * u.sp * dt; u.v += Math.sin(u.dir) * u.sp * dt;
    if (u.v < 0.1 || u.v > 2.4) u.dir = -u.dir; u.v = clamp(u.v, 0.1, 2.4);
    var lim = u.wall < 2 ? 2.8 : 2.3; if (Math.abs(u.u) > lim) u.dir = PI - u.dir; u.u = clamp(u.u, -lim, lim);
    if (u.wall === 0) { b.position.set(-2.985, u.v, u.u); b.rotation.set(0, PI / 2, u.dir); }
    else if (u.wall === 1) { b.position.set(2.985, u.v, u.u); b.rotation.set(0, -PI / 2, u.dir); }
    else if (u.wall === 2) { b.position.set(u.u * 1.15, u.v, 2.485); b.rotation.set(0, PI, u.dir); }
    else { b.position.set(u.u * 0.5 + 1.8, 2.49, u.v * 0.8 - 1); b.rotation.set(PI / 2, 0, u.dir); }
    b.material.opacity = ba;
  });
  // imaginary friend
  var f = HAL.friend, fu = f.userData;
  var want = V.del > 0.75 && Math.hypot(cp.x - 1.12, cp.z - 0.35) > 1.2;
  fu.a = damp(fu.a, want ? 0.55 : 0, want ? 0.5 : 4, dt);
  f.visible = fu.a > 0.02; fu.mat.opacity = fu.a;
  if (f.visible) {
    f.children[1].rotation.y = Math.sin(t * 0.7) * 0.4;
    HAL.friendT -= dt;
    if (HAL.friendT <= 0 && fu.a > 0.3) { HAL.friendT = rnd(9, 16); say('？？？「' + FRIEND_LINES[HAL.friendLine++ % FRIEND_LINES.length] + '」', 4.5, 'friend'); }
  }
}


// ===== 09_player.js =====
// ---- input & player ---------------------------------------------------------------
var INPUT = { mx: 0, mz: 0, lookDX: 0, lookDY: 0, keys: {}, pressed: {}, stick: null, look: null, enabled: false, pointerLocked: false, lastTouch: 0, tap: null };
function press(a) { INPUT.pressed[a] = true; }
function consume(a) { var v = INPUT.pressed[a]; INPUT.pressed[a] = false; return !!v; }

function initInput() {
  var host = CANVAS_HOST;
  var stickEl = el('div', 'rm-stick', '<div class="knob"></div>', UI); stickEl.style.display = 'none'; INPUT.stickEl = stickEl;
  host.addEventListener('pointerdown', function (e) {
    initAudio();
    if (!INPUT.enabled) return;
    var mouse = e.pointerType === 'mouse';
    if (!mouse) INPUT.lastTouch = now();
    var w = RENDER.w;
    INPUT.tap = { x: e.clientX, y: e.clientY, t: now(), id: e.pointerId, moved: 0 };
    if (!mouse && e.clientX < w * 0.42 && !INPUT.stick) {
      INPUT.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
      stickEl.style.display = 'block'; stickEl.style.left = (e.clientX - 55) + 'px'; stickEl.style.top = (e.clientY - 55) + 'px';
      stickEl.firstChild.style.transform = 'translate(0px,0px)';
    } else if (!INPUT.look) INPUT.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { host.setPointerCapture(e.pointerId); } catch (er) {}
    e.preventDefault();
  }, { passive: false });
  host.addEventListener('pointermove', function (e) {
    if (INPUT.tap && INPUT.tap.id === e.pointerId) INPUT.tap.moved = Math.max(INPUT.tap.moved, Math.hypot(e.clientX - INPUT.tap.x, e.clientY - INPUT.tap.y));
    var s = INPUT.stick;
    if (s && s.id === e.pointerId) {
      var dx = e.clientX - s.ox, dy = e.clientY - s.oy, d = Math.sqrt(dx * dx + dy * dy), R = 55;
      if (d > R * 1.6) { s.ox += dx * (1 - R * 1.6 / d); s.oy += dy * (1 - R * 1.6 / d); stickEl.style.left = (s.ox - 55) + 'px'; stickEl.style.top = (s.oy - 55) + 'px'; dx = e.clientX - s.ox; dy = e.clientY - s.oy; d = Math.sqrt(dx * dx + dy * dy); }
      var k = Math.min(1, d / R);
      INPUT.mx = d > 4 ? dx / d * k : 0; INPUT.mz = d > 4 ? dy / d * k : 0;
      var kx = Math.min(d, R) * (d ? dx / d : 0), ky = Math.min(d, R) * (d ? dy / d : 0);
      stickEl.firstChild.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
    }
    var l = INPUT.look;
    if (l && l.id === e.pointerId) { INPUT.lookDX += (e.clientX - l.x) * 1.5; INPUT.lookDY += (e.clientY - l.y) * 1.5; l.x = e.clientX; l.y = e.clientY; }
  });
  var end = function (e) {
    var tp = INPUT.tap;
    if (tp && tp.id === e.pointerId && tp.moved < 12 && now() - tp.t < 0.4 && INPUT.enabled) INPUT.tapAt = { x: tp.x, y: tp.y };
    if (tp && tp.id === e.pointerId) INPUT.tap = null;
    if (INPUT.stick && INPUT.stick.id === e.pointerId) { INPUT.stick = null; INPUT.mx = INPUT.mz = 0; stickEl.style.display = 'none'; }
    if (INPUT.look && INPUT.look.id === e.pointerId) INPUT.look = null;
  };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end); host.addEventListener('lostpointercapture', end);
  window.addEventListener('keydown', function (e) {
    initAudio();
    var k = (e.key || '').toLowerCase();
    if (!INPUT.keys[k]) {
      if (k === 'e' || k === 'enter') press('interact');
      if (k === 'f') press('ff');
      if (k === 'tab' || k === 'm') press('phone');
      if (k === 'escape' || k === 'p') press('menu');
      if (k === 'r') press('pill');
      if (k === 'q') press('drink');
    }
    INPUT.keys[k] = true;
    if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { INPUT.keys[(e.key || '').toLowerCase()] = false; });
  window.addEventListener('blur', function () { INPUT.keys = {}; });
}
function isTouchDevice() { return INPUT.lastTouch > 0 || ('ontouchstart' in window && navigator.maxTouchPoints > 0); }
function readMove() {
  var K = INPUT.keys, x = INPUT.mx, z = INPUT.mz;
  var kx = (K['d'] || K['arrowright'] ? 1 : 0) - (K['a'] || K['arrowleft'] ? 1 : 0);
  var kz = (K['s'] || K['arrowdown'] ? 1 : 0) - (K['w'] || K['arrowup'] ? 1 : 0);
  if (kx || kz) { var l = Math.sqrt(kx * kx + kz * kz); x = kx / l; z = kz / l; if (!K['shift']) { x *= 0.8; z *= 0.8; } }
  return { x: x, z: z };
}

// ---- player ------------------------------------------------------------------------
var PL = { x: 0.2, z: 1.3, yaw: PI * 0.92, pitch: -0.12, vx: 0, vz: 0, bob: 0, eye: 1.55, roll: 0, camY: 1.55, oob: 0, fall: 0, stepT: 0, lie: 0, drift: 0 };

function resetPlayer() {
  PL.x = 0.35; PL.z = 1.35; PL.yaw = 0.62; PL.pitch = -0.32; PL.vx = PL.vz = 0; PL.roll = 0; PL.oob = 0; PL.fall = 0; PL.lie = 0; PL.camY = 1.55;
}
function collide(nx, nz, r) {
  for (var i = 0; i < WORLD.colliders.length; i++) {
    var c = WORLD.colliders[i];
    if (nx + r > c.x0 && nx - r < c.x1 && nz + r > c.z0 && nz - r < c.z1) {
      var px1 = c.x1 - (nx - r), px0 = (nx + r) - c.x0, pz1 = c.z1 - (nz - r), pz0 = (nz + r) - c.z0;
      var m = Math.min(px1, px0, pz1, pz0);
      if (m === px1) nx += px1; else if (m === px0) nx -= px0; else if (m === pz1) nz += pz1; else nz -= pz0;
    }
  }
  return [nx, nz];
}
function isOutdoor() { return PL.z < -2.55; }
function inBathroom() { return PL.z > 2.55; }

function updatePlayer(dt, B, canMove) {
  var V = B.vis, sens = SAVE.settings.sens;
  // look
  var lookMul = 0.0026 * sens * (1 - Math.min(0.5, V.sed * 0.3)) * (1 + V.stim * 0.15);
  PL.yaw -= INPUT.lookDX * lookMul;
  PL.pitch -= INPUT.lookDY * lookMul * (SAVE.settings.invertY ? -1 : 1);
  INPUT.lookDX = INPUT.lookDY = 0;
  PL.pitch = clamp(PL.pitch, -1.35, 1.35);
  // movement
  var mv = canMove ? readMove() : { x: 0, z: 0 };
  var speed = 1.75 * (1 + V.stim * 0.25) * (1 - Math.min(0.6, V.sed * 0.35 + V.dis * 0.3)) * (B.unconscious ? 0 : 1);
  // drunk drift: you don't quite walk where you want
  PL.drift += dt * (0.6 + V.drunk);
  var dr = Math.min(1.2, V.drunk) * 0.45;
  var mx = mv.x + Math.sin(PL.drift * 1.3) * dr * (Math.abs(mv.x) + Math.abs(mv.z)), mz = mv.z;
  var sy = Math.sin(PL.yaw), cy = Math.cos(PL.yaw);
  var wx = (mx * cy + mz * sy) * speed, wz = (-mx * sy + mz * cy) * speed;
  var resp = 10 / (1 + V.drunk * 2.5 + V.dis * 2);
  PL.vx = damp(PL.vx, wx, resp, dt); PL.vz = damp(PL.vz, wz, resp, dt);
  var p = collide(PL.x + PL.vx * dt, PL.z + PL.vz * dt, 0.22);
  PL.x = p[0]; PL.z = p[1];
  var spd = Math.hypot(PL.vx, PL.vz);
  PL.bob += spd * dt * 6.5;
  PL.stepT -= spd * dt;
  if (PL.stepT <= 0 && spd > 0.3) { PL.stepT = 0.62; sfx('step', isOutdoor() ? 1.3 : 1); }
}

function updateCamera(dt, B) {
  var cam = RENDER.camera, V = B.vis, t = LOOP.t;
  var calm = SAVE.settings.calm ? 0.45 : 1;
  // fall over when unconscious / lie on bed
  PL.fall = damp(PL.fall, B.unconscious && !B.onBed ? 1 : 0, 2.5, dt);
  PL.lie = damp(PL.lie, B.onBed ? 1 : 0, 3, dt);
  var eye = 1.55 - Math.min(0.15, V.sed * 0.08);
  var y = lerp(eye, 0.28, PL.fall);
  var x = PL.x, z = PL.z;
  if (PL.lie > 0.01) { x = lerp(x, WORLD.bedPos.x, PL.lie); z = lerp(z, WORLD.bedPos.z - 0.5, PL.lie); y = lerp(y, 0.85, PL.lie); }
  y += Math.sin(PL.bob) * 0.025 * (1 - PL.fall);
  // sway & jitter
  var roll = Math.sin(t * 0.7) * Math.min(1.5, V.drunk) * 0.07 * calm + Math.sin(t * 0.33) * V.dis * 0.08 * calm + PL.fall * 1.25 + V.spin * Math.sin(t * 0.4) * 0.12 * calm;
  PL.roll = damp(PL.roll, roll, 4, dt);
  var jit = V.stim > 0.6 ? (Math.random() - 0.5) * 0.004 * (V.stim - 0.5) : 0;
  var yaw = PL.yaw + Math.sin(t * 0.5) * Math.min(1.5, V.drunk) * 0.03 * calm;
  var pitch = PL.pitch + Math.sin(t * 0.9) * Math.min(1.5, V.drunk) * 0.02 * calm + jit;
  if (PL.lie > 0.01) pitch = lerp(pitch, 1.2, PL.lie * 0.8);
  // out of body (strong dissociation)
  var oobT = clamp((V.dis - 0.95) / 0.7, 0, 1);
  PL.oob = damp(PL.oob, B.unconscious ? 0 : oobT, 0.7, dt);
  var bx = x, bz = z, by = y;
  if (PL.oob > 0.01) {
    var back = PL.oob * 1.3, up = PL.oob * 0.85;
    x -= -Math.sin(PL.yaw) * back; z -= -Math.cos(PL.yaw) * back; y += up;
    var cc = collide(x, z, 0.1); x = cc[0]; z = cc[1]; y = Math.min(y, ROOM.h - 0.15);
    pitch = lerp(pitch, -0.45, PL.oob * 0.6);
  }
  WORLD.self.visible = PL.oob > 0.15;
  if (WORLD.self.visible) { WORLD.self.position.set(bx, 0, bz); WORLD.self.rotation.y = PL.yaw + PI; WORLD.self.traverse(function (o) { if (o.material) { o.material.transparent = true; o.material.opacity = clamp(PL.oob * 1.2, 0, 1); } }); }
  cam.position.set(x, y, z);
  cam.rotation.set(0, 0, 0, 'YXZ');
  cam.rotation.order = 'YXZ';
  cam.rotation.y = yaw; cam.rotation.x = pitch; cam.rotation.z = PL.roll;
  // fov breathing
  var fov = RENDER.baseFov + V.dis * 14 * calm + Math.sin(t * 1.1) * Math.min(1.5, V.psy) * 3 * calm - V.stim * 2 + (B.danger > 30 ? Math.sin(t * 6) * 1.5 : 0);
  if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
}

// ---- interaction focus -------------------------------------------------------------
var FOCUS = { it: null };
var _ray = null, _v2 = null;
function pickAt(nx, ny, maxD) {
  if (!_ray) { _ray = new THREE.Raycaster(); _v2 = new THREE.Vector2(); }
  _v2.set(nx, ny); _ray.setFromCamera(_v2, RENDER.camera); _ray.far = maxD;
  var hits = _ray.intersectObjects(WORLD.interMeshes, false);
  for (var i = 0; i < hits.length; i++) { var it = hits[i].object.userData.inter; if (it && (!it.cond || it.cond())) return it; }
  return null;
}
function updateFocus() {
  var it = PL.oob > 0.5 ? null : pickAt(0, 0, 2.4);
  if (!it) {
    // forgiving proximity pick: closest interactable roughly in view
    var cam = RENDER.camera, fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    var best = null, bs = 0;
    WORLD.inter.forEach(function (o) {
      if (o.cond && !o.cond()) return;
      var dx = o.pos.x - PL.x, dz = o.pos.z - PL.z, d = Math.hypot(dx, dz);
      if (d > (o.id === 'rail' ? 1.2 : 1.6)) return;
      var dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-4);
      var sc = dot - d * 0.2; if (dot > 0.55 && sc > bs) { bs = sc; best = o; }
    });
    it = best;
  }
  FOCUS.it = it;
  return it;
}
function handleTap() {
  var tp = INPUT.tapAt; INPUT.tapAt = null; if (!tp) return false;
  var nx = (tp.x / RENDER.w) * 2 - 1, ny = -(tp.y / RENDER.h) * 2 + 1;
  var it = pickAt(nx, ny, 3.2);
  if (it) { doInteract(it); return true; }
  return false;
}


// ===== 10_ui.js =====
// ---- UI: HUD, menus, phone, screens ----------------------------------------------
var UI_CSS = [
  '#rm-ui{--pink:#ff5fa8;--cyan:#7df9ff;--violet:#b46bff;--ink:#1b1030;--panel:rgba(22,12,44,0.88);--line:rgba(255,255,255,0.14);}',
  '.rm-hud{position:absolute;left:10px;right:10px;top:var(--top-safe);display:flex;gap:8px;align-items:flex-start;justify-content:space-between;}',
  '.rm-clock{font-family:"DotGothic16",monospace;font-size:26px;line-height:1;padding:6px 10px 7px;border-radius:12px;background:rgba(10,6,24,0.55);border:1px solid var(--line);text-shadow:0 0 10px var(--cyan);letter-spacing:.04em;}',
  '.rm-clock small{display:block;font-size:11px;opacity:.7;margin-top:3px;letter-spacing:.1em}',
  '.rm-vitals{display:grid;grid-template-columns:repeat(5,auto);gap:4px;padding:5px 7px;border-radius:12px;background:rgba(10,6,24,0.55);border:1px solid var(--line);font-size:11px;}',
  '.rm-vt{display:flex;flex-direction:column;align-items:center;min-width:42px;padding:2px 3px;border-radius:8px;transition:background .3s}',
  '.rm-vt b{font-family:"DotGothic16",monospace;font-size:15px;font-weight:400;line-height:1.1}',
  '.rm-vt span{opacity:.7;font-size:10px}',
  '.rm-vt.warn{background:rgba(255,190,40,0.25)} .rm-vt.bad{background:rgba(255,40,60,0.45);animation:rmBlink .6s infinite alternate}',
  '@keyframes rmBlink{from{opacity:1}to{opacity:.55}}',
  '.rm-danger{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--top-safe) + 58px);width:min(70vw,320px);padding:5px 10px 7px;border-radius:12px;background:rgba(60,0,10,0.75);border:1px solid #ff3355;text-align:center;font-size:12px;font-weight:900;display:none}',
  '.rm-danger .bar{height:7px;border-radius:5px;background:rgba(255,255,255,0.15);margin-top:4px;overflow:hidden}.rm-danger .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff9f1c,#ff1744);width:0}',
  '.rm-fx{position:absolute;right:10px;top:calc(var(--top-safe) + 62px);display:flex;flex-direction:column;gap:5px;align-items:flex-end;max-width:46vw}',
  '.rm-chip{display:flex;align-items:center;gap:6px;padding:4px 8px 4px 4px;border-radius:999px;background:rgba(10,6,24,0.6);border:1px solid var(--line);font-size:11px;font-weight:700;white-space:nowrap}',
  '.rm-chip img{width:22px;height:22px}.rm-chip .ph{opacity:.7;font-weight:500}.rm-chip .lv{width:34px;height:4px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden}.rm-chip .lv i{display:block;height:100%;background:var(--cyan)}',
  '.rm-feel{position:absolute;left:10px;top:calc(var(--top-safe) + 62px);display:flex;flex-direction:column;gap:3px;font-size:11px}',
  '.rm-feel div{display:flex;align-items:center;gap:5px}.rm-feel .b{width:54px;height:5px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}.rm-feel .b i{display:block;height:100%}',
  '.rm-cross{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:rgba(255,255,255,0.8);box-shadow:0 0 6px #fff;transition:transform .15s}',
  '.rm-cross.on{transform:scale(2.2);background:var(--cyan)}',
  '.rm-focus{position:absolute;left:50%;top:calc(50% + 18px);transform:translateX(-50%);padding:4px 10px;border-radius:999px;background:rgba(10,6,24,0.65);font-size:12px;font-weight:700;white-space:nowrap;display:none}',
  '.rm-btns{position:absolute;right:12px;bottom:var(--bot-safe);display:flex;flex-direction:column;gap:10px;align-items:flex-end}',
  '.rm-row{display:flex;gap:10px}',
  '.btn{pointer-events:auto;cursor:pointer;border:none;outline:none;color:#fff;font-family:inherit;font-weight:900;border-radius:16px;padding:10px 14px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.22);box-shadow:0 4px 18px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:14px;transition:transform .08s}',
  '.btn:active{transform:scale(.95)}',
  '.btn.round{width:58px;height:58px;border-radius:50%;padding:0;font-size:24px;display:flex;align-items:center;justify-content:center}',
  '.btn.act{min-width:96px;height:72px;border-radius:22px;font-size:14px;background:linear-gradient(160deg,#ff5fa8,#b46bff);border-color:rgba(255,255,255,.5);line-height:1.2}',
  '.btn.act.off{opacity:.45;filter:grayscale(.6)}',
  '.btn.on{background:linear-gradient(160deg,#30c8ff,#7df9ff);color:#08203a}',
  '.btn.pri{background:linear-gradient(160deg,#ff5fa8,#b46bff);border-color:rgba(255,255,255,.5);font-size:17px;padding:14px 22px}',
  '.btn.ghost{background:rgba(255,255,255,.06)}',
  '.btn.warn{background:linear-gradient(160deg,#ff3355,#ff9f1c)}',
  '.btn[disabled]{opacity:.35;pointer-events:none}',
  '.rm-sub{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--bot-safe) + 150px);width:min(86vw,520px);text-align:center;font-size:15px;font-weight:700;text-shadow:0 2px 6px #000,0 0 14px rgba(0,0,0,.8);transition:opacity .4s;opacity:0}',
  '.rm-sub.friend{color:#b9c0ff}',
  '.rm-toasts{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--bot-safe) + 186px);display:flex;flex-direction:column;gap:6px;align-items:center;width:min(90vw,460px)}',
  '.rm-toast{padding:7px 14px;border-radius:14px;background:rgba(14,8,30,.82);border:1px solid var(--line);font-size:13px;font-weight:700;text-align:center;animation:rmIn .3s ease-out}',
  '.rm-toast.warn{border-color:#ff3355;background:rgba(70,0,16,.85)} .rm-toast.good{border-color:var(--cyan)}',
  '@keyframes rmIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}',
  '.rm-banner{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;width:92vw}',
  '.rm-banner .k{font-size:12px;letter-spacing:.3em;color:var(--cyan);font-weight:900}',
  '.rm-banner .n{font-family:"Rampart One","Zen Maru Gothic",sans-serif;font-size:clamp(28px,8vw,52px);line-height:1.15;margin:6px 0;background:linear-gradient(90deg,#7df9ff,#ff5fa8,#ffe14d,#7df9ff);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:rmShine 2s linear infinite;filter:drop-shadow(0 0 12px rgba(255,95,168,.6))}',
  '.rm-banner .d{font-size:13px;opacity:.9;max-width:420px;margin:0 auto;text-shadow:0 2px 4px #000}',
  '@keyframes rmShine{to{background-position:300% 0}}',
  '.rm-modal{position:absolute;inset:0;background:rgba(4,2,12,.55);display:flex;align-items:flex-end;justify-content:center;pointer-events:auto;animation:rmFade .2s}',
  '@keyframes rmFade{from{opacity:0}to{opacity:1}}',
  '.rm-sheet{width:min(100%,640px);max-height:calc(100% - var(--top-safe) - 10px);display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-bottom:none;border-radius:24px 24px 0 0;padding:14px 14px calc(var(--bot-safe) + 4px);box-shadow:0 -10px 40px rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:rmUp .25s ease-out}',
  '@keyframes rmUp{from{transform:translateY(40px)}to{transform:none}}',
  '.rm-sheet h2{margin:2px 4px 10px;font-size:19px;display:flex;align-items:center;gap:8px;flex:0 0 auto}',
  '.rm-sheet h2 .x{margin-left:auto}',
  '.rm-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;flex:1;min-height:0;padding:2px}',
  '.rm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.rm-card{position:relative;padding:8px 6px 8px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid var(--line);text-align:center;cursor:pointer;pointer-events:auto}',
  '.rm-card:active{transform:scale(.96)}',
  '.rm-card img{width:52px;height:52px;display:block;margin:0 auto 2px}',
  '.rm-card .nm{font-size:11.5px;font-weight:900;line-height:1.25;min-height:2.5em;display:flex;align-items:center;justify-content:center}',
  '.rm-card .st{font-size:10px;opacity:.75}',
  '.rm-card .cl{position:absolute;left:6px;top:6px;font-size:9px;padding:1px 5px;border-radius:6px;font-weight:900;color:#111}',
  '.rm-card.empty{opacity:.35}',
  '.rm-detail{display:flex;flex-direction:column;gap:10px}',
  '.rm-detail .hd{display:flex;gap:12px;align-items:center}.rm-detail .hd img{width:84px;height:84px}',
  '.rm-detail .t{font-size:20px;font-weight:900}.rm-detail .c{font-size:12px;font-weight:900;padding:2px 8px;border-radius:8px;display:inline-block;color:#111;margin-top:4px}',
  '.rm-detail p{margin:0;font-size:14px;line-height:1.6;opacity:.95}',
  '.rm-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px;background:rgba(255,255,255,.05);border-radius:12px;padding:10px 12px}',
  '.rm-kv span{opacity:.65}',
  '.rm-alert{padding:10px 12px;border-radius:12px;background:rgba(255,40,70,.18);border:1px solid rgba(255,60,90,.6);font-size:13px;font-weight:700;line-height:1.5}',
  '.rm-tabs{display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;touch-action:pan-x;flex:0 0 auto;padding-bottom:2px}',
  '.rm-tab{flex:0 0 auto;padding:8px 12px;border-radius:12px;font-size:13px;font-weight:900;background:rgba(255,255,255,.07);border:1px solid var(--line);cursor:pointer;pointer-events:auto}',
  '.rm-tab.on{background:linear-gradient(160deg,#ff5fa8,#b46bff)}',
  '.rm-list{display:flex;flex-direction:column;gap:8px}',
  '.rm-item{display:flex;gap:10px;align-items:center;padding:10px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line)}',
  '.rm-item img{width:44px;height:44px;flex:0 0 auto}',
  '.rm-item .tx{flex:1;min-width:0}.rm-item .tx b{display:block;font-size:14px}.rm-item .tx small{display:block;font-size:12px;opacity:.75;line-height:1.45;margin-top:2px}',
  '.rm-item.lock{opacity:.55}',
  '.dg0{color:#7dffb0}.dg1{color:#ffe14d}.dg2{color:#ff9f1c}.dg3{color:#ff3355}',
  '.rm-big{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}',
  '.rm-big div{padding:10px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line)}',
  '.rm-big b{display:block;font-family:"DotGothic16",monospace;font-size:24px;font-weight:400}.rm-big span{font-size:12px;opacity:.7}',
  '.rm-screen{position:absolute;inset:0;pointer-events:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:calc(var(--top-safe) + 4px) 18px var(--bot-safe)}',
  '.rm-screen.rm-title{background:radial-gradient(ellipse at center,rgba(8,4,20,.72) 0%,rgba(8,4,20,.45) 60%,rgba(8,4,20,.2) 100%)}',
  '.rm-logo{font-family:"Rampart One","Zen Maru Gothic",sans-serif;font-size:clamp(40px,13vw,92px);line-height:.95;background:linear-gradient(90deg,#7df9ff,#ff5fa8,#ffe14d,#b46bff,#7df9ff);background-size:400% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:rmShine 6s linear infinite;filter:drop-shadow(0 0 18px rgba(255,95,168,.5))}',
  '.rm-logo-sub{font-size:15px;letter-spacing:.5em;margin:10px 0 4px;color:#ffd1e8;font-weight:900}',
  '.rm-menu{display:flex;flex-direction:column;gap:10px;margin-top:26px;width:min(80vw,300px)}',
  '.rm-note{font-size:11px;opacity:.6;margin-top:18px;line-height:1.6}',
  '.rm-card2{width:min(92vw,520px);max-height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:18px;text-align:left;font-size:14px;line-height:1.7}',
  '.rm-card2 h3{margin:0 0 8px;font-size:18px}',
  '.rm-card2 ul{padding-left:1.2em;margin:6px 0}',
  '.rm-set{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid var(--line);font-size:14px}',
  '.rm-set input[type=range]{width:46%;pointer-events:auto}',
  '.rm-tog{width:52px;height:30px;border-radius:15px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;pointer-events:auto;flex:0 0 auto}',
  '.rm-tog i{position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s}.rm-tog.on{background:#ff5fa8}.rm-tog.on i{left:25px}',
  '.rm-seg{display:flex;gap:4px}.rm-seg div{padding:6px 9px;border-radius:9px;background:rgba(255,255,255,.08);font-size:12px;font-weight:900;cursor:pointer;pointer-events:auto}.rm-seg div.on{background:#ff5fa8}',
  '.rm-stick{position:absolute;width:110px;height:110px;border-radius:50%;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06)}',
  '.rm-stick .knob{position:absolute;left:33px;top:33px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.4)}',
  '.rm-hint{position:absolute;left:14px;bottom:calc(var(--bot-safe) + 6px);font-size:11px;opacity:.55;line-height:1.5;max-width:46vw}',
  '.rm-end h1{font-family:"Rampart One","Zen Maru Gothic",sans-serif;font-size:clamp(30px,9vw,56px);margin:0 0 4px;line-height:1.1}',
  '.rm-rank{font-size:30px;font-weight:900;margin:6px 0 10px;color:#ffe14d;text-shadow:0 0 14px rgba(255,225,77,.6)}',
  '.rm-graph{width:100%;height:90px;display:block;border-radius:10px;background:rgba(0,0,0,.25)}'
].join('\n');

var HUD = {};
function initUI() {
  HUD.hud = el('div', 'rm-hud', '', UI);
  HUD.clock = el('div', 'rm-clock', '20:00<small>DAY 1</small>', HUD.hud);
  HUD.vitals = el('div', 'rm-vitals', '', HUD.hud);
  HUD.v = {};
  [['hr', '心拍', '♥'], ['tp', '体温', '🌡'], ['rr', '呼吸', '🫁'], ['con', '意識', '🧠'], ['hyd', '水分', '💧']].forEach(function (a) {
    var d = el('div', 'rm-vt', '<span>' + a[2] + ' ' + a[1] + '</span><b>--</b>', HUD.vitals); HUD.v[a[0]] = d;
  });
  HUD.danger = el('div', 'rm-danger', '⚠ からだが危ない <span></span><div class="bar"><i></i></div>', UI);
  HUD.fx = el('div', 'rm-fx', '', UI);
  HUD.feel = el('div', 'rm-feel', '', UI);
  HUD.cross = el('div', 'rm-cross', '', UI);
  HUD.focus = el('div', 'rm-focus', '', UI);
  HUD.sub = el('div', 'rm-sub', '', UI);
  HUD.toasts = el('div', 'rm-toasts', '', UI);
  HUD.banner = el('div', 'rm-banner', '', UI); HUD.banner.style.display = 'none';
  HUD.hint = el('div', 'rm-hint', '', UI);
  HUD.btns = el('div', 'rm-btns', '', UI);
  var row = el('div', 'rm-row', '', HUD.btns);
  HUD.bPhone = el('button', 'btn round', '📱', row); onTap(HUD.bPhone, function () { openPhone(); });
  HUD.bFF = el('button', 'btn round', '⏩', row); onTap(HUD.bFF, function () { toggleFF(); });
  HUD.bAct = el('button', 'btn act off', 'しらべる', HUD.btns); onTap(HUD.bAct, function () { if (FOCUS.it) doInteract(FOCUS.it); });
  showHUD(false);
}
function showHUD(on) {
  ['hud', 'fx', 'feel', 'cross', 'btns', 'hint'].forEach(function (k) { HUD[k].style.display = on ? '' : 'none'; });
  if (!on) { HUD.danger.style.display = 'none'; HUD.focus.style.display = 'none'; }
}
function layoutUI() {}

// ---- toasts / subtitles / banners ----------------------------------------------------
function toast(msg, cls, dur) {
  var t = el('div', 'rm-toast ' + (cls || ''), esc(msg), HUD.toasts);
  while (HUD.toasts.children.length > 3) HUD.toasts.removeChild(HUD.toasts.firstChild);
  setTimeout(function () { t.style.transition = 'opacity .5s'; t.style.opacity = 0; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 500); }, (dur || 3.2) * 1000);
}
var SUBT = { t: 0, prio: 0 };
function say(text, dur, cls) {
  HUD.sub.textContent = text; HUD.sub.className = 'rm-sub ' + (cls || ''); HUD.sub.style.opacity = 1;
  SUBT.t = dur || 3.5;
}
function banner(kicker, name, desc, cls) {
  HUD.banner.innerHTML = '<div class="k">' + esc(kicker) + '</div><div class="n">' + esc(name) + '</div><div class="d ' + (cls || '') + '">' + esc(desc) + '</div>';
  HUD.banner.style.display = ''; HUD.banner.style.opacity = 1; HUD.banner.style.transition = '';
  clearTimeout(HUD.bannerTO);
  HUD.bannerTO = setTimeout(function () { HUD.banner.style.transition = 'opacity .8s'; HUD.banner.style.opacity = 0; setTimeout(function () { HUD.banner.style.display = 'none'; }, 800); }, 4200);
}
function updateUITimers(dt) {
  if (SUBT.t > 0) { SUBT.t -= dt; if (SUBT.t <= 0) HUD.sub.style.opacity = 0; }
}

// ---- HUD update ----------------------------------------------------------------------
var _hudT = 0;
function updateHUD(dt, B) {
  _hudT -= dt; if (_hudT > 0) return; _hudT = 0.2;
  HUD.clock.innerHTML = fmtClock(GAME.clock) + '<small>' + (GAME.ff ? '⏩ 早送り中' : GAME.clock < 1440 ? 'よる' : GAME.clock < 1740 ? 'しんや' : 'あけがた') + '</small>';
  function setV(k, txt, lvl) { var d = HUD.v[k]; d.lastChild.textContent = txt; d.className = 'rm-vt' + (lvl === 2 ? ' bad' : lvl === 1 ? ' warn' : ''); }
  setV('hr', Math.round(B.hr), B.hr > 175 ? 2 : B.hr > 140 ? 1 : 0);
  setV('tp', B.tp.toFixed(1), B.tp > 39.5 ? 2 : B.tp > 38.3 ? 1 : 0);
  setV('rr', B.rr.toFixed(0), B.rr < 8 ? 2 : B.rr < 11 ? 1 : 0);
  setV('con', Math.round(B.con) + '%', B.con < 20 ? 2 : B.con < 45 ? 1 : 0);
  setV('hyd', Math.round(B.hyd * 100) + '%', B.hyd < 0.3 ? 2 : B.hyd < 0.55 ? 1 : 0);
  if (B.danger > 0.5) {
    HUD.danger.style.display = '';
    HUD.danger.firstChild.nodeValue = '⚠ ' + ({ rr: '呼吸が止まりかけている', hr: '心臓が限界', tp: '体温が上がりすぎ', vomit: '危険な状態' }[B.dangerCause] || 'からだが危ない') + ' ';
    HUD.danger.querySelector('i').style.width = B.danger.toFixed(0) + '%';
  } else HUD.danger.style.display = 'none';
  // active substances
  var arr = activeDoseSummary(B), html = '';
  arr.forEach(function (o) {
    if (o.alc) { html += '<div class="rm-chip"><img src="' + canIcon(DRINK.z9lemon, 44) + '"><div>お酒 <span class="ph">' + (o.bac < 0.005 ? '吸収中' : o.bac.toFixed(2) + '%') + '</span></div><div class="lv"><i style="width:' + clamp(o.lvl / 4 * 100, 3, 100) + '%;background:#d8f060"></i></div></div>'; return; }
    html += '<div class="rm-chip"><img src="' + ramuneIcon(o.s, 44) + '"><div>' + esc(o.s.name.replace('ラムネ', '')) + (o.n > 1 ? '×' + o.n : '') + ' <span class="ph">' + o.ph + '</span></div><div class="lv"><i style="width:' + clamp(o.lvl * 70, 3, 100) + '%;background:' + CLASSES[o.s.cls].col + '"></i></div></div>';
  });
  HUD.fx.innerHTML = html;
  // feelings bars
  var fl = dominantFeelings(B, 4), cols = { ps: '#b46bff', st: '#30c8ff', se: '#6a7dff', pa: '#ffb347', di: '#7af0c8', de: '#8a8a9a', em: '#ff5fa8', an: '#ff3355', na: '#9be15d', eu: '#ffe14d', drunk: '#d8f060' };
  HUD.feel.innerHTML = fl.map(function (f) { return '<div><div class="b"><i style="width:' + clamp(f[1] / 1.6 * 100, 4, 100) + '%;background:' + cols[f[0]] + '"></i></div>' + EFFECT_NAMES[f[0]] + '</div>'; }).join('');
  // phone screen texture on table
  drawPhoneScreen(fmtClock(GAME.clock), false);
}
function updateFocusUI(it) {
  HUD.cross.className = 'rm-cross' + (it ? ' on' : '');
  if (it) { HUD.focus.style.display = ''; HUD.focus.textContent = it.label; HUD.bAct.className = 'btn act'; HUD.bAct.innerHTML = it.verb.replace(' / ', '<br>'); }
  else { HUD.focus.style.display = 'none'; HUD.bAct.className = 'btn act off'; HUD.bAct.textContent = 'しらべる'; }
}

// ---- modal helpers ---------------------------------------------------------------
var MODAL = null;
function openModal(title, buildFn, opts) {
  closeModal(true);
  opts = opts || {};
  var m = el('div', 'rm-modal', '', UI);
  var sh = el('div', 'rm-sheet', '', m);
  var h = el('h2', '', esc(title) + '<button class="btn x" style="padding:6px 12px">✕</button>', sh);
  onTap(h.querySelector('.x'), function () { closeModal(); });
  onTap(m, function (e) { if (e.target === m) closeModal(); });
  var body = el('div', 'rm-scroll', '', sh);
  MODAL = { el: m, body: body, sheet: sh, title: h, onClose: opts.onClose };
  buildFn(body, MODAL);
  GAME.paused = true; INPUT.enabled = false; INPUT.mx = INPUT.mz = 0; INPUT.stick = null; INPUT.stickEl.style.display = 'none';
  if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
  sfx('ui');
  return MODAL;
}
function closeModal(silent) {
  if (!MODAL) return;
  var m = MODAL; MODAL = null;
  if (m.el.parentNode) m.el.parentNode.removeChild(m.el);
  if (m.onClose) m.onClose();
  if (GAME.mode === 'play') { GAME.paused = false; INPUT.enabled = true; }
  if (!silent) sfx('click');
}
function setModalTitle(t) { if (MODAL) MODAL.title.firstChild.nodeValue = t; }

// ---- pill menu ------------------------------------------------------------------
function stockOf(id) { return SAVE.settings.sandbox ? 99 : (GAME.stash[id] || 0); }
function openPillMenu() {
  openModal('ラムネケース', function (body) { renderPillGrid(body); });
}
function renderPillGrid(body) {
  setModalTitle('ラムネケース');
  body.innerHTML = '';
  var g = el('div', 'rm-grid', '', body);
  SUBS.forEach(function (s) {
    if (s.hidden) return;
    var n = stockOf(s.id), cl = CLASSES[s.cls];
    var c = el('div', 'rm-card' + (n <= 0 ? ' empty' : ''), '<span class="cl" style="background:' + cl.col + '">' + cl.short + '</span><img src="' + ramuneIcon(s, 104) + '"><div class="nm">' + esc(s.name) + '</div><div class="st">' + (SAVE.settings.sandbox ? '∞' : 'のこり ' + n) + '</div>', g);
    onTap(c, function () { sfx('ui'); renderPillDetail(body, s); });
  });
  el('div', 'rm-note', '※ すべて架空のラムネです。カードをタップすると説明が見られます。', body);
}
function timeText(m) { return m < 60 ? Math.round(m) + '分' : (m / 60).toFixed(m < 180 ? 1 : 0).replace('.0', '') + '時間'; }
function predictedCombos(s) {
  // which combos would likely trigger if taken now (only ones the player already knows)
  var B = GAME.B, out = [];
  COMBOS.forEach(function (cb) {
    if (cb.special || !SAVE.seenCombos[cb.id]) return;
    var ok = true, involves = false;
    cb.need.forEach(function (nd) {
      var lvlNow = nd.s ? (B.Ls[nd.s] || 0) : nd.distinct ? (B.L[nd.distinct] || 0) : (B.L[nd.c] || 0);
      var willAdd = nd.s ? nd.s === s.id : nd.distinct ? s.cls === nd.distinct : s.cls === nd.c;
      if (willAdd) involves = true;
      if (!willAdd && lvlNow < 0.25 && !(nd.c && pendingClass(nd.c))) ok = false;
    });
    if (ok && involves) out.push(cb);
  });
  return out;
}
function pendingClass(c) { // taken recently but not kicked in yet
  return GAME.B.doses.some(function (d) { var s = SUB[d.s]; return s.cls === c && d.t < s.pk; }) || (c === 'alc' && GAME.B.stom > 0.2);
}
function renderPillDetail(body, s) {
  setModalTitle(s.name);
  var cl = CLASSES[s.cls], n = stockOf(s.id), B = GAME.B;
  body.innerHTML = '';
  var d = el('div', 'rm-detail', '', body);
  el('div', 'hd', '<img src="' + ramuneIcon(s, 168) + '"><div><div class="t">' + esc(s.name) + '</div><span class="c" style="background:' + cl.col + '">' + cl.icon + ' ' + esc(cl.name) + '</span></div>', d);
  el('p', '', esc(s.desc), d);
  el('div', 'rm-kv', '<span>効きはじめ</span><b>約 ' + timeText(s.on) + '</b><span>ピーク</span><b>' + timeText(s.pk) + ' 〜 ' + timeText(s.pl) + '</b><span>効き目の長さ</span><b>約 ' + timeText(s.du) + '</b><span>手持ち</span><b>' + (SAVE.settings.sandbox ? '∞（サンドボックス）' : n + ' 個') + '</b>', d);
  var taken = B.doses.filter(function (x) { return x.s === s.id; }).length;
  var warn = [];
  if (taken > 0) warn.push('すでに ' + taken + ' 個飲んでいる。効く前に重ねると強く効きすぎることがある。');
  predictedCombos(s).forEach(function (cb) { if (cb.danger >= 2) warn.push('いま飲むと「' + cb.name + '」になりそう（' + ['安全', '注意', '危険', '命にかかわる'][cb.danger] + '）'); });
  if (warn.length) el('div', 'rm-alert', '⚠ ' + warn.map(esc).join('<br>⚠ '), d);
  var row = el('div', 'rm-row', '', d);
  var back = el('button', 'btn ghost', '← もどる', row); onTap(back, function () { sfx('ui'); renderPillGrid(body); });
  var take = el('button', 'btn pri', '飲む', row); take.style.flex = '1';
  if (n <= 0) { take.disabled = true; take.textContent = 'もうない'; }
  onTap(take, function () { if (stockOf(s.id) <= 0) return; closeModal(true); actTakePill(s.id); });
}

// ---- drink menu ------------------------------------------------------------------
function openDrinkMenu() {
  sfx('fridge');
  openModal('冷蔵庫', function (body) {
    var l = el('div', 'rm-list', '', body);
    DRINKS.forEach(function (d) {
      var n = SAVE.settings.sandbox ? 99 : (GAME.stash[d.id] || 0);
      var it = el('div', 'rm-item' + (n <= 0 ? ' lock' : ''), '<img src="' + canIcon(d, 88) + '"><div class="tx"><b>' + esc(d.name) + ' <span style="opacity:.6;font-size:12px">' + esc(d.sub) + '</span></b><small>' + esc(d.desc) + '</small></div>', l);
      var b = el('button', 'btn', n > 0 ? '飲む<br><small style="font-weight:500;opacity:.7">のこり' + (SAVE.settings.sandbox ? '∞' : n) + '</small>' : 'ない', it);
      if (n <= 0) b.disabled = true;
      onTap(b, function () { closeModal(true); actDrink(d.id); });
    });
    el('div', 'rm-note', '※ ZER9 は架空のお酒です。お酒は20歳になってから。水はキッチンの蛇口で飲めます。', body);
  });
}

// ---- bed ------------------------------------------------------------------------
function openBedMenu() {
  var B = GAME.B;
  openModal('ベッド', function (body) {
    var d = el('div', 'rm-detail', '', body);
    el('p', '', 'ふかふかのベッド。少し横になって休むか、このまま朝まで眠ってしまうか。', d);
    if (B.rr < 10.5 || B.bac > 0.2 || B.danger > 0 || (B.F.se > 1.2 && (B.L.op || 0) > 0.3)) el('div', 'rm-alert', '⚠ 呼吸が浅い・飲みすぎ・強い鎮静のときに眠ってしまうのはとても危険。', d);
    var b1 = el('button', 'btn', '30分だけ横になる', d); onTap(b1, function () { closeModal(true); startRest(30); });
    var b2 = el('button', 'btn pri', '朝まで眠る', d); onTap(b2, function () { closeModal(true); startRest(9999); });
    var b3 = el('button', 'btn ghost', 'やめる', d); onTap(b3, function () { closeModal(); });
  });
}

// ---- phone ----------------------------------------------------------------------
var PHONE_TAB = 'body';
function openPhone(tab) {
  if (tab) PHONE_TAB = tab;
  openModal('スマホ', function (body, M) {
    var tabs = el('div', 'rm-tabs', '', M.sheet); M.sheet.insertBefore(tabs, body);
    var defs = [['body', '🫀 からだ'], ['zukan', '🍬 ラムネ図鑑'], ['combo', '🧪 飲み合わせ'], ['help', '🚑 たすけ'], ['set', '⚙ 設定']];
    if (GAME.mode !== 'play') defs = defs.filter(function (d) { return d[0] !== 'body' && d[0] !== 'help'; });
    if (!defs.some(function (d) { return d[0] === PHONE_TAB; })) PHONE_TAB = defs[0][0];
    function render() {
      tabs.innerHTML = '';
      defs.forEach(function (d) { var t = el('div', 'rm-tab' + (PHONE_TAB === d[0] ? ' on' : ''), d[1], tabs); onTap(t, function () { PHONE_TAB = d[0]; sfx('ui'); render(); }); });
      body.innerHTML = '';
      ({ body: phoneBody, zukan: phoneZukan, combo: phoneCombo, help: phoneHelp, set: phoneSettings })[PHONE_TAB](body);
    }
    render();
  });
}
function phoneBody(body) {
  var B = GAME.B;
  el('div', 'rm-big', '<div><b>' + Math.round(B.hr) + '</b><span>心拍（回/分）</span></div><div><b>' + B.tp.toFixed(1) + '℃</b><span>体温</span></div><div><b>' + B.rr.toFixed(1) + '</b><span>呼吸（回/分）</span></div><div><b>' + Math.round(B.con) + '%</b><span>意識</span></div><div><b>' + Math.round(B.hyd * 100) + '%</b><span>水分</span></div><div><b>' + (B.bac * 100 / 100).toFixed(3) + '%</b><span>血中アルコール（架空）</span></div>', body);
  var cv = el('canvas', 'rm-graph', '', body); cv.width = 600; cv.height = 180; cv.style.marginTop = '10px';
  drawHistory(cv);
  el('div', 'rm-note', '— 心拍（ピンク）・体温（オレンジ）・呼吸（水色）・危険度（赤）の記録', body).style.marginTop = '4px';
  var l = el('div', 'rm-list', '', body); l.style.marginTop = '10px';
  var arr = activeDoseSummary(B);
  if (!arr.length) el('div', 'rm-item', '<div class="tx"><b>いまは何も効いていない</b><small>シラフ。ラムネケースや冷蔵庫をしらべてみよう。</small></div>', l);
  arr.forEach(function (o) {
    if (o.alc) { el('div', 'rm-item', '<img src="' + canIcon(DRINK.z9lemon, 88) + '"><div class="tx"><b>お酒 ' + (o.ph ? '（' + o.ph + '）' : '') + '</b><small>今夜 ' + B.stats.cans + ' 缶。' + (B.bac > 0.2 ? '完全に飲みすぎ。' : B.bac > 0.1 ? 'かなり酔っている。' : B.bac > 0.04 ? 'ほろ酔い。' : 'ほんのり。') + '</small></div>', l); return; }
    el('div', 'rm-item', '<img src="' + ramuneIcon(o.s, 88) + '"><div class="tx"><b>' + esc(o.s.name) + (o.n > 1 ? ' ×' + o.n : '') + '（' + o.ph + '）</b><small>' + esc(CLASSES[o.s.cls].name) + ' ・ 飲んでから ' + timeText(o.t) + '</small></div>', l);
  });
  var act = B.found.length ? B.found.map(function (id) { return COMBO[id].name; }).join('、') : 'まだなし';
  el('div', 'rm-note', '今夜見つけた飲み合わせ：' + esc(act), body);
}
function drawHistory(cv) {
  var g = cv.getContext('2d'), H = GAME.hist, w = cv.width, h = cv.height;
  g.clearRect(0, 0, w, h);
  if (H.length < 2) return;
  function line(key, lo, hi, col) {
    g.strokeStyle = col; g.lineWidth = 3; g.beginPath();
    H.forEach(function (p, i) { var x = i / (H.length - 1) * w, y = h - clamp((p[key] - lo) / (hi - lo), 0, 1) * (h - 8) - 4; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.stroke();
  }
  line('hr', 40, 220, '#ff5fa8'); line('tp', 35.5, 42, '#ff9f1c'); line('rr', 0, 30, '#7df9ff'); line('d', 0, 100, '#ff1744');
}
function phoneZukan(body) {
  var seen = Object.keys(SAVE.seenSubs).length, total = SUBS.filter(function (s) { return !s.hidden; }).length;
  el('div', 'rm-note', '見つけたラムネ ' + seen + ' / ' + total, body).style.margin = '0 0 8px';
  var l = el('div', 'rm-list', '', body);
  SUBS.forEach(function (s) {
    if (s.hidden) return;
    var ok = SAVE.seenSubs[s.id];
    el('div', 'rm-item' + (ok ? '' : ' lock'), '<img src="' + ramuneIcon(s, 88) + '" style="' + (ok ? '' : 'filter:brightness(0) opacity(.5)') + '"><div class="tx"><b>' + (ok ? esc(s.name) : '？？？') + ' <span style="font-size:11px;color:' + CLASSES[s.cls].col + '">' + CLASSES[s.cls].icon + esc(CLASSES[s.cls].short) + '</span></b><small>' + (ok ? esc(s.desc) + '<br>効きはじめ 約' + timeText(s.on) + ' ／ 長さ 約' + timeText(s.du) : 'まだ飲んだことがない') + '</small></div>', l);
  });
}
function phoneCombo(body) {
  var seen = Object.keys(SAVE.seenCombos).length;
  el('div', 'rm-note', '見つけた飲み合わせ ' + seen + ' / ' + COMBOS.length + '　（色：<span class="dg0">安全</span>・<span class="dg1">注意</span>・<span class="dg2">危険</span>・<span class="dg3">命にかかわる</span>）', body).style.margin = '0 0 8px';
  var l = el('div', 'rm-list', '', body);
  COMBOS.forEach(function (cb) {
    var ok = SAVE.seenCombos[cb.id];
    el('div', 'rm-item' + (ok ? '' : ' lock'), '<div class="tx"><b class="dg' + cb.danger + '">' + (ok ? '🧪 ' + esc(cb.name) : '？？？') + '</b><small>' + esc(cb.hint) + (ok ? '<br>' + esc(cb.desc) : '') + '</small></div>', l);
  });
}
function phoneHelp(body) {
  var d = el('div', 'rm-detail', '', body);
  el('p', '', '具合がおかしいとき、だれかが倒れているときは、ためらわずに助けを呼ぼう。<b>このゲームの中でも、現実でも。</b>', d);
  el('div', 'rm-kv', '<span>呼吸が弱い</span><b>リセットラムネ（ぬくぬく系だけに効く）／119</b><span>体温が高い</span><b>水を飲む・ベランダで風にあたる</b><span>吐き気</span><b>トイレで吐く（飲んだばかりなら体に入る量も減る）</b><span>心拍が速い</span><b>じっと休む・水を飲む</b>', d);
  var b = el('button', 'btn warn', '📞 119に電話する（今夜はここで終わり）', d);
  onTap(b, function () { closeModal(true); endNight('ambulance'); });
  el('div', 'rm-note', '現実で困ったとき：救急車 119／迷ったら 救急安心センター #7119（地域による）', body);
}
function phoneSettings(body) {
  var S = SAVE.settings;
  function slider(label, key, min, max, step, cb) {
    var r = el('div', 'rm-set', '<span>' + label + '</span>', body);
    var i = el('input', '', null, r); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = S[key];
    i.addEventListener('input', function () { S[key] = parseFloat(i.value); if (cb) cb(); writeSave(); });
    i.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }
  function toggle(label, key, cb) {
    var r = el('div', 'rm-set', '<span>' + label + '</span>', body);
    var t = el('div', 'rm-tog' + (S[key] ? ' on' : ''), '<i></i>', r);
    onTap(t, function () { S[key] = !S[key]; t.className = 'rm-tog' + (S[key] ? ' on' : ''); writeSave(); if (cb) cb(); sfx('click'); });
  }
  slider('音楽', 'bgm', 0, 1, 0.05, auVol); slider('効果音', 'sfx', 0, 1, 0.05, auVol); slider('視点の感度', 'sens', 0.3, 2.5, 0.05);
  toggle('光の点滅・ゆれをおさえる', 'calm');
  toggle('上下の視点を反転', 'invertY');
  toggle('サンドボックス（ラムネ・お酒が無限）', 'sandbox');
  var r = el('div', 'rm-set', '<span>画質</span>', body), seg = el('div', 'rm-seg', '', r);
  ['AUTO', 'LOW', 'MEDIUM', 'HIGH'].forEach(function (q) { var o = el('div', S.quality === q ? 'on' : '', q, seg); onTap(o, function () { S.quality = q; writeSave(); applyQuality(q); Array.prototype.forEach.call(seg.children, function (c) { c.className = c.textContent === q ? 'on' : ''; }); }); });
  if (GAME.mode === 'play') {
    var row = el('div', 'rm-row', '', body); row.style.marginTop = '14px';
    var t1 = el('button', 'btn ghost', 'タイトルへ', row); onTap(t1, function () { closeModal(true); toTitle(); });
  }
  el('div', 'rm-note', 'RAMUNE NIGHT v' + GAME_VERSION + ' ・ すべてフィクションです。', body);
}

// ---- full screens ------------------------------------------------------------------
var SCREEN = null;
function showScreen(html, cls) {
  hideScreen();
  SCREEN = el('div', 'rm-screen ' + (cls || ''), html, UI);
  return SCREEN;
}
function hideScreen() { if (SCREEN && SCREEN.parentNode) SCREEN.parentNode.removeChild(SCREEN); SCREEN = null; }


// ===== 11_game.js =====
// ---- game flow ---------------------------------------------------------------------
var START_CLOCK = 20 * 60, END_CLOCK = 32 * 60; // 20:00 → 08:00 next morning
var GAME = { mode: 'boot', clock: START_CLOCK, ff: false, paused: false, B: null, stash: {}, hist: [], histT: 0, monoT: 6, rest: null, lock: false, fx: { vomit: 0, gapT: 0, gap: 0, flashT: 0, flash: 0, fade: 0, white: 0, hue: 0 }, endT: 0 };
var FAKE_BODY = null;

function startNight() {
  hideScreen(); closeModal(true);
  GAME.B = newBody();
  GAME.clock = START_CLOCK; GAME.ff = false; GAME.paused = false; GAME.rest = null; GAME.lock = false; GAME.hist = []; GAME.histT = 0; GAME.monoT = 4;
  GAME.stash = {}; SUBS.forEach(function (s) { if (!s.hidden) GAME.stash[s.id] = s.stock || 2; }); DRINKS.forEach(function (d) { GAME.stash[d.id] = d.stock; });
  GAME.fx.fade = 1;
  WORLD.cans.forEach(function (m) { RENDER.scene.remove(m); }); WORLD.cans = [];
  WORLD.lightMode = 0; WORLD.tvOn = true; AU.music = true; auVol();
  resetPlayer();
  GAME.mode = 'play'; INPUT.enabled = true;
  showHUD(true); HUD.bFF.className = 'btn round';
  HUD.hint.innerHTML = isTouchDevice() || isMobile() ? '左側をドラッグで移動<br>右側をドラッグで見回す<br>モノをタップでしらべる' : 'WASD 移動 ・ ドラッグで見回す<br>クリック/E しらべる ・ F 早送り ・ Tab スマホ';
  setTimeout(function () { if (HUD.hint) HUD.hint.style.transition = 'opacity 2s'; HUD.hint.style.opacity = 0.0; }, 14000);
  HUD.hint.style.opacity = 0.55; HUD.hint.style.transition = '';
  SAVE.nights++; writeSave();
  var lines = ['金曜の夜。明日はなにもない。', 'テーブルにはラムネケース。冷蔵庫にはZER9。', '朝まで、好きにすごそう。'];
  lines.forEach(function (l, i) { setTimeout(function () { if (GAME.mode === 'play') say(l, 3.4); }, 900 + i * 3600); });
  sfx('ui');
}

function toggleFF() {
  if (GAME.mode !== 'play') return;
  GAME.ff = !GAME.ff; HUD.bFF.className = 'btn round' + (GAME.ff ? ' on' : '');
  toast(GAME.ff ? '⏩ 時間を早送り中' : '▶ ふつうの速さ'); sfx('click');
}

// ---- actions -----------------------------------------------------------------------
function doInteract(it) {
  if (GAME.mode !== 'play' || GAME.paused || GAME.lock || GAME.B.unconscious || GAME.rest) return;
  sfx('click');
  it.fn();
}
function actTakePill(id) {
  var s = SUB[id]; if (GAME.lock) return;
  GAME.lock = true;
  if (!SAVE.settings.sandbox) GAME.stash[id]--;
  holdItem('pill', pillMesh(s), 1.25, function () {
    takeSub(GAME.B, id); sfx('pill'); GAME.lock = false;
    var first = !SAVE.seenSubs[id];
    SAVE.seenSubs[id] = 1; writeSave();
    toast((first ? '🆕 ' : '') + s.name + ' を口に入れた。カリッ。', 'good');
    if (s.reset && !GAME.B.found.length) { }
  });
}
function actDrink(id) {
  var d = DRINK[id]; if (GAME.lock) return;
  GAME.lock = true;
  if (!SAVE.settings.sandbox) GAME.stash[id]--;
  sfx('can');
  setTimeout(function () { sfx('gulp'); }, 900);
  holdItem('can', canMesh(d), 2.7, function () {
    drinkCan(GAME.B, id); GAME.lock = false;
    placeCanOnTable(d);
    var n = GAME.B.stats.cans;
    toast(d.name + ' を飲みほした' + (d.alc > 0 ? '（今夜 ' + n + ' 缶目）' : ''), 'good');
    if (d.alc > 0 && n === 3) say('ZER9、飲みやすすぎない…？', 3);
    if (d.alc > 0 && n === 6) say('…あれ、何本目だっけ', 3);
  });
}
function actWater() {
  if (GAME.lock) return; GAME.lock = true;
  WORLD.water.visible = true; sfx('water');
  setTimeout(function () { WORLD.water.visible = false; drinkWater(GAME.B); GAME.lock = false; toast('水をコップ1杯。少しすっきりした。', 'good'); }, 1700);
}
function actToilet() {
  var B = GAME.B;
  var recent = B.doses.some(function (d) { var s = SUB[d.s]; return !s.hidden && d.t < s.pk; });
  if (B.F.na > 0.25 || B.stom > 0.3 || recent) {
    GAME.lock = true; GAME.fx.vomit = 1.6; sfx('vomit');
    setTimeout(function () { vomit(B); sfx('flush'); GAME.lock = false; toast('トイレで吐いた…。少し楽になった。' + (recent || B.stom > 0.3 ? '（まだ吸収されていない分が減った）' : ''), 'good', 4); }, 1500);
  } else { sfx('flush'); toast('トイレを流した。とくに吐き気はない。'); }
}
function actMirror() {
  var B = GAME.B, F = B.F, out = [];
  if (F.ps > 0.5) out.push(pick(['鏡の中の自分が、ワンテンポ遅れて動いた。', '顔の輪郭がゆらゆら波打っている。', '瞳の中に万華鏡が見える。']));
  if (F.di > 0.6) out.push('鏡の中の人がだれなのか、よくわからない。');
  if (F.de > 0.5) out.push('鏡の奥、自分のうしろに…だれか立っていない？');
  if ((B.L.op || 0) > 0.4) out.push('瞳孔が針の先みたいに小さい。');
  else if (F.st > 0.5 || F.ps > 0.4 || F.em > 0.5 || F.de > 0.5) out.push('瞳孔がまんまるに開いている。');
  if (B.tp > 38.3) out.push('顔が真っ赤で汗だく。');
  if (F.na > 0.5) out.push('顔色が青白い。');
  if (B.hyd < 0.45) out.push('くちびるがカサカサ。');
  if (B.bac > 0.1) out.push('目がとろんとしている。');
  if (F.em > 0.6) out.push('…今日の自分、けっこうかわいいじゃん。');
  if (!out.length) out.push('いつもの自分だ。');
  say('（鏡）' + out.slice(0, 3).join(' '), 5);
}
function startRest(min) {
  GAME.rest = { left: min, morning: min > 1000 };
  GAME.B.onBed = true; GAME.ff = false; HUD.bFF.className = 'btn round';
  say(min > 1000 ? 'おやすみなさい…' : 'ちょっとだけ…目をとじる…', 3);
}
function endRest(msg) {
  if (!GAME.rest) return;
  GAME.rest = null; GAME.B.onBed = false;
  PL.x = 1.5; PL.z = -0.1; PL.yaw = PI * 0.6;
  if (msg) toast(msg);
}

// ---- body events -> UI -------------------------------------------------------------
function processEvents() {
  var B = GAME.B;
  while (B.events.length) {
    var e = B.events.shift(), d = e.data, s;
    switch (e.type) {
      case 'onset': s = SUB[d.id]; toast(s.name + ' が効いてきた…'); monologue(true); break;
      case 'peak': break;
      case 'fade': s = SUB[d.id]; toast(s.name + ' の効き目が引いていく'); break;
      case 'combo':
        var cb = COMBO[d.id], isNew = !SAVE.seenCombos[d.id];
        SAVE.seenCombos[d.id] = 1; writeSave();
        sfx('combo');
        banner(isNew ? '🧪 NEW 飲み合わせ発見' : '🧪 飲み合わせ', cb.name, cb.desc, 'dg' + cb.danger);
        break;
      case 'vomit': if (GAME.fx.vomit <= 0) { GAME.fx.vomit = 1.4; sfx('vomit'); toast(B.unconscious ? '意識がないまま吐いてしまった！' : '耐えきれずに吐いてしまった…', 'warn'); } break;
      case 'pass': toast('意識が…遠のいていく…', 'warn', 4); GAME.ff = false; HUD.bFF.className = 'btn round'; break;
      case 'wake': toast('…はっ。' + Math.max(1, Math.round(d.mins)) + '分くらい記憶がない。', 'warn', 4); break;
      case 'warn': toast('⚠ ' + d.msg, 'warn'); sfx('warn'); break;
      case 'dead': endNight('dead', d.cause); return;
    }
  }
}
function monologue(force) {
  var B = GAME.B;
  if (B.unconscious) { say('……', 2); return; }
  var dom = dominantFeelings(B, 3), key = 'idle';
  if (B.danger > 25) key = 'danger';
  else if (B.tp > 38.6 || B.hyd < 0.4) key = Math.random() < 0.6 ? 'hot' : (dom[0] ? dom[0][0] : 'idle');
  else if (dom.length) { var r = Math.random(), tot = 0; dom.forEach(function (x) { tot += x[1]; }); var acc = 0; for (var i = 0; i < dom.length; i++) { acc += dom[i][1] / tot; if (r <= acc) { key = dom[i][0]; break; } } }
  if (key === 'eu') key = B.F.em > 0.3 ? 'em' : B.motor > 0.3 ? 'drunk' : B.F.ps > 0.2 ? 'ps' : 'idle';
  var arr = VOICE[key] || VOICE.idle;
  if (!force && key === 'idle' && Math.random() < 0.5) return;
  say(pick(arr), 3.8);
}

// ---- per-frame play update -------------------------------------------------------------
function updatePlay(dt) {
  var B = GAME.B;
  if (!GAME.paused) {
    var rate = 1;
    if (GAME.ff) rate = 8;
    if (B.unconscious) rate = Math.max(rate, 5);
    if (GAME.rest) rate = 18;
    var gdt = dt * rate;
    GAME.clock += gdt;
    bodyStep(B, gdt);
    if (GAME.mode !== 'play') return;
    processEvents();
    if (GAME.mode !== 'play') return;
    // outdoor cooling
    B.envCool = damp(B.envCool, isOutdoor() ? 1 : 0, 0.05 * rate, dt);
    if (isOutdoor() && B.F.na > 0.05) B.naRelief = Math.max(B.naRelief, 0.12);
    // history
    GAME.histT -= gdt;
    if (GAME.histT <= 0) { GAME.histT = 5; GAME.hist.push({ hr: B.hr, tp: B.tp, rr: B.rr, d: B.danger }); if (GAME.hist.length > 300) GAME.hist.shift(); }
    // rest
    if (GAME.rest) {
      GAME.rest.left -= gdt;
      if (B.danger > 55 && !GAME.rest.woke && Math.random() < 0.5) { GAME.rest.woke = true; endRest('苦しくて目が覚めた…！'); }
      else if (GAME.rest && GAME.rest.left <= 0) endRest('少し休んだ。');
    }
    // morning
    if (GAME.clock >= END_CLOCK) { endNight(B.unconscious ? 'blackmorning' : 'morning'); return; }
    // monologue
    GAME.monoT -= dt;
    if (GAME.monoT <= 0) { GAME.monoT = rnd(10, 17) / (GAME.ff ? 1.5 : 1); if (!GAME.rest) monologue(false); }
    // player
    updatePlayer(dt, B, !B.unconscious && !GAME.rest && !GAME.lock);
    var it = (B.unconscious || GAME.rest) ? null : updateFocus();
    updateFocusUI(it);
    if (consume('interact') && it) doInteract(it);
    handleTap();
    if (consume('ff')) toggleFF();
    if (consume('phone')) openPhone();
    if (consume('menu')) openPhone('set');
    if (consume('pill')) openPillMenu();
    if (consume('drink')) openDrinkMenu();
  }
  updateHUD(dt, B);
}

// ---- visuals from body state ---------------------------------------------------------
var VS = { psy: 0, dis: 0, del: 0, drunk: 0, stim: 0, sed: 0, emp: 0, anx: 0, nau: 0, kal: 0, spin: 0, red: 0, lids: 0, nod: 0 };
function updateTripVisuals(dt, B) {
  var V = B.vis, calm = SAVE.settings.calm ? 0.45 : 1, t = LOOP.t, k = 1.5;
  ['psy', 'dis', 'del', 'drunk', 'stim', 'sed', 'emp', 'anx', 'nau', 'kal', 'spin'].forEach(function (key) { VS[key] = damp(VS[key], V[key] || 0, k, dt); });
  VS.red = damp(VS.red, (B.danger || 0) / 100, 2, dt);
  var P = POSTU;
  P.uPsy.value = Math.min(2.2, VS.psy) * (0.6 + 0.4 * calm);
  P.uDis.value = Math.min(1.8, VS.dis) * (0.7 + 0.3 * calm);
  P.uDel.value = Math.min(1.5, VS.del);
  P.uDrunk.value = Math.min(1.6, VS.drunk) * calm;
  P.uStim.value = Math.min(1.5, VS.stim);
  P.uSed.value = Math.min(1.8, VS.sed);
  P.uEmp.value = Math.min(1.5, VS.emp);
  P.uAnx.value = Math.min(1.2, VS.anx) * calm;
  P.uNau.value = Math.min(1.5, VS.nau + GAME.fx.vomit * 0.8) * calm;
  P.uTrail.value = clamp(VS.psy * 0.42 + VS.dis * 0.15 + VS.drunk * 0.08, 0, 0.88) * calm;
  P.uKal.value = clamp(VS.kal + Math.max(0, VS.psy - 1.45) * 0.7, 0, 0.8) * calm;
  P.uSpin.value = Math.min(1.5, VS.spin + Math.max(0, VS.drunk - 1.1) * 0.6) * calm;
  P.uCalm.value = SAVE.settings.calm ? 1 : 0;
  GAME.fx.hue += dt * VS.psy * 0.08 * calm;
  P.uHue.value = GAME.fx.hue;
  P.uRed.value = clamp(VS.red * 1.4, 0, 1);
  // eyelids: nodding off when sedated, closing when unconscious/resting
  var nodTarget = 0;
  if (VS.sed > 0.75) { var cyc = Math.pow(0.5 + 0.5 * Math.sin(t * 0.45), 6); nodTarget = cyc * clamp(VS.sed - 0.75, 0, 0.9); }
  if (B.unconscious) nodTarget = 1;
  if (GAME.rest) nodTarget = GAME.rest.left > 20 || GAME.rest.morning ? 1 : 0.6;
  VS.lids = damp(VS.lids, nodTarget, nodTarget > VS.lids ? 1.5 : 4, dt);
  P.uLids.value = VS.lids;
  // blackout gaps
  if ((V.gap || 0) > 0.4) { GAME.fx.gapT -= dt; if (GAME.fx.gapT <= 0) { GAME.fx.gapT = rnd(5, 14); GAME.fx.gap = 1; } }
  GAME.fx.gap = Math.max(0, GAME.fx.gap - dt * 0.9);
  P.uGap.value = GAME.fx.gap > 0.6 ? 1 : GAME.fx.gap / 0.6;
  // crisis flashes
  if ((V.flash || 0) > 0.4 && !SAVE.settings.calm) { GAME.fx.flashT -= dt; if (GAME.fx.flashT <= 0) { GAME.fx.flashT = rnd(1.5, 5); GAME.fx.flash = 0.35; } }
  GAME.fx.flash = Math.max(0, GAME.fx.flash - dt * 1.5);
  P.uFlash.value = GAME.fx.flash;
  GAME.fx.vomit = Math.max(0, GAME.fx.vomit - dt);
  GAME.fx.fade = Math.max(0, GAME.fx.fade - dt * 0.7);
  P.uBlack.value = clamp(GAME.fx.fade + (GAME.fx.dead || 0), 0, 1);
  P.uWhite.value = GAME.fx.white;
  // the room itself
  TRIPU.uPat.value = clamp((VS.psy - 0.25) * 0.65, 0, 0.9) * calm;
  TRIPU.uBreath.value = Math.min(1.6, VS.psy + VS.dis * 0.5) * calm;
  TRIPU.uMelt.value = clamp(VS.psy - 0.85, 0, 1.2) * calm;
  TRIPU.uHueW.value += dt * 0.05 * VS.psy;
  TRIPU.uGlow.value = Math.min(1.2, VS.emp);
  TRIPU.uDark.value = clamp(VS.del * 0.55, 0, 0.7);
  var open = clamp((VS.psy - 1.15) * 1.3, 0, 0.94) * (SAVE.settings.calm ? 0.5 : 1);
  WORLD.mats.ceil.opacity = 1 - open; WORLD.mats.ceil.depthWrite = open < 0.05;
  SKYU.uPsy.value = VS.psy;
}

function updateWorldFX(dt) {
  var t = LOOP.t, W = WORLD, Lt = W.L, B = GAME.B || FAKE_BODY;
  var morning = clamp((GAME.clock - 29 * 60) / 180, 0, 1);
  if (GAME.mode === 'title') morning = 0;
  SKYU.uMorning.value = morning;
  RENDER.scene.fog.color.setRGB(lerp(0.04, 0.55, morning), lerp(0.03, 0.5, morning), lerp(0.12, 0.6, morning));
  Lt.hemi.intensity = 0.28 + morning * 0.6;
  Lt.moon.intensity = 0.35 + morning * 0.5; Lt.moon.color.setRGB(lerp(0.54, 1, morning), lerp(0.65, 0.85, morning), lerp(1, 0.7, morning));
  W.moon.material.opacity = 1 - morning;
  var mode = W.lightMode, psy = VS.psy;
  Lt.ceil.intensity = damp(Lt.ceil.intensity, mode === 0 ? 0.8 : 0, 6, dt);
  W.lampMesh.material.color.setHex(mode === 0 ? 0xfff4dc : 0x403c36);
  var neonOn = mode === 1;
  Lt.neon.intensity = damp(Lt.neon.intensity, neonOn ? 1.4 : 0, 4, dt);
  var hue = (t * 0.05 + psy * t * 0.05) % 1;
  Lt.neon.color.setHSL(hue, 0.9, 0.55);
  W.strips.forEach(function (s) { s.visible = neonOn; s.material.color.setHSL(hue, 0.9, 0.6); });
  Lt.lamp.intensity = damp(Lt.lamp.intensity, mode === 2 ? 0.55 : 0.7, 4, dt);
  if (psy > 0.3) { Lt.lamp.color.setHSL((0.08 + Math.sin(t * 0.3) * psy * 0.1 + 1) % 1, 0.9, 0.6); } else Lt.lamp.color.setHex(0xffa65a);
  Lt.tv.intensity = W.tvOn ? 0.35 + 0.25 * Math.sin(t * 7) * Math.sin(t * 2.3) : 0;
  drawTV(t, W.tvOn, psy);
  W.spkLed.visible = AU.music;
  W.cones.forEach(function (c, i) { var s = AU.music ? 1 + Math.max(0, Math.sin(t * 8.2 * AU.p.tempo + i)) * 0.06 : 1; c.scale.set(s, s, 1); });
  W.fan.rotation.z += dt * 12;
  W.caseGlow.intensity = 0.2 + Math.sin(t * 2) * 0.08;
  // clock hands (follow the in-game clock, melt along with everything else)
  var cm = GAME.clock;
  W.clockM.rotation.z = -(cm % 60) / 60 * TAU; W.clockH.rotation.z = -((cm / 60) % 12) / 12 * TAU;
  W.anim.forEach(function (f) { f(t, dt); });
}

// ---- endings -------------------------------------------------------------------------
function endNight(kind, cause) {
  if (GAME.mode !== 'play') return;
  var B = GAME.B;
  GAME.mode = 'end'; INPUT.enabled = false; closeModal(true); showHUD(false); GAME.ff = false;
  HUD.sub.style.opacity = 0;
  B.onBed = false;
  if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
  var found = B.found.slice(), score = Math.max(0, Math.round(B.stats.fun)) + found.length * 300 + (kind === 'morning' ? 1000 : kind === 'blackmorning' ? 300 : 0);
  SAVE.endings[kind] = (SAVE.endings[kind] || 0) + 1;
  if (kind === 'dead') SAVE.deaths++; else if (kind !== 'ambulance') SAVE.mornings++;
  if (kind !== 'dead') SAVE.best = Math.max(SAVE.best, score);
  writeSave();
  GAME.endInfo = { kind: kind, cause: cause, score: score, found: found };
  if (kind === 'dead') { sfx('flatline'); GAME.fx.deadFade = true; setTimeout(showEnding, 3200); }
  else if (kind === 'ambulance') { sfx('siren'); GAME.fx.deadFade = true; setTimeout(showEnding, 2600); }
  else { sfx('birds'); GAME.fx.whiteFade = true; setTimeout(showEnding, 2400); }
}
function updateEndFX(dt) {
  if (GAME.fx.deadFade) GAME.fx.dead = Math.min(1, (GAME.fx.dead || 0) + dt * 0.4);
  if (GAME.fx.whiteFade) GAME.fx.white = Math.min(0.85, GAME.fx.white + dt * 0.5);
}
function showEnding() {
  var I = GAME.endInfo, B = GAME.B, S = B.stats, title, sub, note = '', rank;
  if (I.kind === 'dead') {
    title = 'BAD END';
    sub = { rr: '呼吸が、止まってしまった。', hr: '心臓が、限界をこえてしまった。', tp: '体温が、上がりすぎてしまった。', vomit: '意識がないまま吐いて、息ができなくなった。' }[I.cause] || '朝は来なかった。';
    note = { rr: 'お酒・睡眠薬・オピオイドなど「鎮静系」どうしの組み合わせは、現実でも呼吸を止めてしまうことがあります。', hr: 'アッパー系の重ねがけや、ほかの薬との組み合わせは、現実でも心臓に大きな負担をかけます。', tp: '体温を上げる薬と脱水・興奮の組み合わせは、現実でも命にかかわります。', vomit: '泥酔して意識がない人は、吐いたもので窒息しないよう横向きに寝かせて、すぐに119番を。' }[I.cause] || '';
    rank = 'GAME OVER';
  } else if (I.kind === 'ambulance') {
    title = '救急搬送'; sub = '救急車で運ばれて、病院のベッドで朝をむかえた。'; note = '具合が悪いとき・だれかが倒れているときは、迷わず119番。それはかっこ悪いことじゃない。'; rank = '生きてるだけで100点';
  } else {
    title = I.kind === 'blackmorning' ? '気づいたら朝' : 'GOOD MORNING';
    sub = I.kind === 'blackmorning' ? '床の上で目が覚めた。昨日の夜のことは、ほとんど覚えていない。' : '窓の外が明るい。長い夜が終わった。';
    var sc = I.score;
    rank = sc < 600 ? 'しずかな夜' : sc < 1600 ? 'ゆるい夜' : sc < 3200 ? 'たのしい夜' : sc < 5200 ? '最高の夜' : '伝説の夜';
    if (S.cans >= 6 || S.pills >= 6) note = 'からだは正直。今日は一日、水を飲んでゆっくり休もう。';
  }
  var foundHtml = I.found.length ? I.found.map(function (id) { var c = COMBO[id]; return '<span class="dg' + c.danger + '">🧪' + esc(c.name) + '</span>'; }).join('　') : 'なし';
  var html = '<div class="rm-card2 rm-end" style="text-align:center">' +
    '<h1>' + esc(title) + '</h1><div style="opacity:.9">' + esc(sub) + '</div>' +
    '<div class="rm-rank">' + esc(rank) + '</div>' +
    (I.kind !== 'dead' ? '<div style="font-size:13px;opacity:.75">スコア</div><div style="font-family:DotGothic16,monospace;font-size:40px;line-height:1">' + I.score + '</div>' : '') +
    '<div class="rm-big" style="margin:12px 0;text-align:left"><div><b>' + S.pills + '</b><span>飲んだラムネ</span></div><div><b>' + S.cans + '</b><span>飲んだ缶</span></div><div><b>' + Math.round(S.maxHR) + '</b><span>最高心拍</span></div><div><b>' + S.maxTp.toFixed(1) + '℃</b><span>最高体温</span></div><div><b>' + S.minRR.toFixed(1) + '</b><span>最低呼吸</span></div><div><b>' + S.vomits + '</b><span>吐いた回数</span></div></div>' +
    '<div style="font-size:13px;text-align:left;line-height:1.8"><b>見つけた飲み合わせ：</b>' + foundHtml + '</div>' +
    (note ? '<div class="rm-alert" style="margin-top:12px;text-align:left">' + esc(note) + '</div>' : '') +
    '<div class="rm-menu" style="margin:16px auto 0"><button class="btn pri" id="rm-again">もう一晩</button><button class="btn ghost" id="rm-title">タイトルへ</button></div>' +
    '<div class="rm-note">これはフィクションのゲームです。登場するラムネ・お酒はすべて架空のものです。</div></div>';
  showScreen(html);
  onTap(document.getElementById('rm-again'), function () { GAME.fx.dead = 0; GAME.fx.white = 0; GAME.fx.deadFade = GAME.fx.whiteFade = false; startNight(); });
  onTap(document.getElementById('rm-title'), function () { toTitle(); });
}

// ---- title / warning / how-to ---------------------------------------------------------------
function toTitle() {
  closeModal(true); hideScreen(); showHUD(false);
  GAME.mode = 'title'; INPUT.enabled = false; GAME.paused = false;
  GAME.fx.dead = 0; GAME.fx.white = 0; GAME.fx.deadFade = GAME.fx.whiteFade = false; GAME.fx.fade = 0.8;
  GAME.clock = 23 * 60;
  WORLD.lightMode = 1; WORLD.tvOn = true;
  var html = '<div class="rm-logo">RAMUNE<br>NIGHT</div><div class="rm-logo-sub">ラムネナイト</div>' +
    '<div style="font-size:13px;opacity:.85">架空のラムネとチューハイで過ごす、ひと晩のシミュレーター</div>' +
    '<div class="rm-menu"><button class="btn pri" id="rm-start">はじめる</button><button class="btn" id="rm-zukan">図鑑</button><button class="btn" id="rm-howto">あそびかた</button><button class="btn ghost" id="rm-set">設定</button></div>' +
    '<div class="rm-note">図鑑：ラムネ ' + Object.keys(SAVE.seenSubs).length + '/19 ・ 飲み合わせ ' + Object.keys(SAVE.seenCombos).length + '/' + COMBOS.length + (SAVE.best ? ' ・ ベスト ' + SAVE.best : '') + '<br>※ フィクションです。実在の薬物・製品とは関係ありません。</div>';
  showScreen(html, 'rm-title');
  onTap(document.getElementById('rm-start'), function () { initAudio(); startNight(); });
  onTap(document.getElementById('rm-zukan'), function () { initAudio(); openPhone('zukan'); });
  onTap(document.getElementById('rm-howto'), function () { initAudio(); showHowTo(); });
  onTap(document.getElementById('rm-set'), function () { initAudio(); openPhone('set'); });
}
function showWarning() {
  GAME.mode = 'title';
  var html = '<div class="rm-card2"><h3>⚠ はじめに</h3>' +
    '<ul><li>これは<b>フィクションのゲーム</b>です。登場する「ラムネ」「ZER9」などはすべて架空のもので、実在の薬物・製品とは関係ありません。</li>' +
    '<li>ゲームの中の効果や飲み合わせは創作です。<b>現実の薬物や、お酒と薬の組み合わせを試すのは絶対にやめましょう。</b></li>' +
    '<li>お酒は20歳になってから。</li>' +
    '<li>画面が強くゆれたり、色が点滅したりする表現があります。光に敏感な方は下の設定をオンにしてください。</li></ul>' +
    '<div class="rm-set"><span>光の点滅・ゆれをおさえる</span><div class="rm-tog' + (SAVE.settings.calm ? ' on' : '') + '" id="rm-calm"><i></i></div></div>' +
    '<div class="rm-menu" style="margin:14px auto 0"><button class="btn pri" id="rm-ok">わかった</button></div></div>';
  showScreen(html);
  var tg = document.getElementById('rm-calm');
  onTap(tg, function () { SAVE.settings.calm = !SAVE.settings.calm; tg.className = 'rm-tog' + (SAVE.settings.calm ? ' on' : ''); writeSave(); });
  onTap(document.getElementById('rm-ok'), function () { initAudio(); SAVE.warned = true; writeSave(); toTitle(); });
}
function showHowTo() {
  var html = '<div class="rm-card2"><h3>あそびかた</h3>' +
    '<p>夜8時から朝8時まで、自分の部屋で好きにすごすゲームです。<br>テーブルの<b>ラムネケース</b>から架空のラムネを、<b>冷蔵庫</b>から ZER9（架空のチューハイ）を選んで、いろいろな効果と<b>飲み合わせ</b>を見つけよう。</p>' +
    '<ul><li><b>移動</b>：画面の左側をドラッグ（PC：WASD）</li><li><b>見回す</b>：右側をドラッグ（PC：マウスでドラッグ）</li><li><b>しらべる</b>：モノをタップ、または右下のボタン（PC：クリック / E）</li><li><b>⏩</b>：時間を早送り（効き目が出るまで待つときに）</li><li><b>📱</b>：からだの状態・図鑑・設定・119</li></ul>' +
    '<p><b>ラムネの系統</b>：🌈幻覚系　⚡アッパー系　💤ダウナー系　☁️ぬくぬく系（オピオイド系）　🪐解離系　💗ハート系　🌑とばり系　✨とくしゅ</p>' +
    '<p><b>からだに注意</b>：心拍・体温・呼吸が危険なところに入ると、画面が赤くなって「危険度」がたまります。100になると BAD END。<br>' +
    '水を飲む・ベランダで風にあたる・トイレで吐く・リセットラムネ・119番などで切り抜けよう。</p>' +
    '<p><b>スコア</b>：楽しい気分の量 ＋ 見つけた飲み合わせ ＋ 朝まで無事だったボーナス。</p>' +
    '<div class="rm-menu" style="margin:10px auto 0"><button class="btn pri" id="rm-back">もどる</button></div></div>';
  showScreen(html);
  onTap(document.getElementById('rm-back'), function () { toTitle(); });
}
function updateTitle(dt) {
  var t = LOOP.t, cam = RENDER.camera;
  var a = 0.35 + Math.sin(t * 0.05) * 0.55;
  cam.position.set(0.45 + Math.sin(t * 0.07) * 0.15, 1.35 + Math.sin(t * 0.3) * 0.05, 1.9);
  cam.rotation.order = 'YXZ'; cam.rotation.set(-0.1 + Math.sin(t * 0.11) * 0.05, a, Math.sin(t * 0.4) * 0.03);
  if (Math.abs(cam.fov - RENDER.baseFov) > 0.05) { cam.fov = RENDER.baseFov; cam.updateProjectionMatrix(); }
  var V = FAKE_BODY.vis;
  V.psy = 0.55 + 0.35 * Math.sin(t * 0.13); V.emp = 0.35 + 0.25 * Math.sin(t * 0.21 + 1); V.dis = 0.15; V.drunk = 0; V.stim = 0.1; V.sed = 0; V.del = 0; V.anx = 0; V.nau = 0;
}


// ===== 99_main.js =====
// ---- boot & main loop --------------------------------------------------------------
var LOOP = { last: 0, t: 0, err: false };
function boot() {
  setupPage(); loadSave();
  initUI();
  showScreen('<div class="rm-logo" style="font-size:44px">RAMUNE<br>NIGHT</div><div id="rm-load" style="margin-top:14px;font-family:DotGothic16,monospace;opacity:.7">LOADING...</div>');
  loadThree(function () {
    try {
      initRenderer(); initInput();
      makeTextures();
      buildWorld();
      buildHallucinations();
      FAKE_BODY = newBody();
      // compile shaders up front so the first trip doesn't stutter
      try { RENDER.renderer.compile(RENDER.scene, RENDER.camera); } catch (e) {}
      if (SAVE.warned) toTitle(); else showWarning();
      LOOP.last = performance.now();
      requestAnimationFrame(frame);
      window.__rmReady = true;
    } catch (e) { showFatal('起動エラー', (e && e.stack) || String(e)); }
  });
}
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, Math.max(0.001, (ts - LOOP.last) / 1000)); LOOP.last = ts; LOOP.t += dt;
  try { tick(dt); } catch (e) { if (!LOOP.err) { LOOP.err = true; console.error(e); showFatal('Runtime error', (e && e.stack) || String(e)); } }
}
function tick(dt) {
  TRIPU.uT.value = LOOP.t; POSTU.uTime.value = LOOP.t; SKYU.uT.value = LOOP.t;
  updateUITimers(dt);
  adaptQuality(dt);
  var mode = GAME.mode, B;
  if (mode === 'title') {
    updateTitle(dt);
    B = FAKE_BODY;
  } else {
    B = GAME.B;
    if (mode === 'play') updatePlay(dt);
    if (GAME.mode === 'end') updateEndFX(dt);
    updateHeld(dt);
    updateCamera(dt, B);
  }
  updateHallucinations(dt, B, RENDER.camera);
  updateTripVisuals(dt, B);
  updateWorldFX(dt);
  updateAudio(dt, B, { outdoor: mode === 'play' && isOutdoor() });
  renderFrame();
}
// debug hook for automated tests
window.__rmEval = function (code) { return eval(code); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();


})();
