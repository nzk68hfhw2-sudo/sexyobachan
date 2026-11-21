// ---------------------------------------------------------------------------
// FRIENDS WARFARE — browser FPS (three.js r128). Everything is created by this
// one file: DOM, CSS, canvas, textures, sounds. Loaded with <script src>.
// BASE_URL is only a fallback: the folder of game.js is detected automatically.
// ---------------------------------------------------------------------------
if (window.__frLoaded) { return; }
window.__frLoaded = true;

var BASE_URL = 'https://comforting-bublanina-fb9718.netlify.app/';
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
