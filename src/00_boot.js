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
