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
// window.__SSD_EMBED (single-file HTML build) maps asset paths to data: URLs, so no server is needed
function assetURL(p) { var E = window.__SSD_EMBED; return E && E[p] ? E[p] : ASSET_BASE + p; }
function embeddedBuffer(p) { var E = window.__SSD_EMBED, u = E && E[p]; if (!u) return null; var b = atob(u.slice(u.indexOf(',') + 1)), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a.buffer; }

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
