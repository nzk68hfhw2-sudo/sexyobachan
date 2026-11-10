// ---------------------------------------------------------------------------
// キケンなラムネシミュレーター — 架空のラムネ＆チューハイ・シミュレーター
// これはフィクションのゲームです。登場する「ラムネ」はすべて架空のもので、
// 実在の薬物・製品とは一切関係ありません。
// ---------------------------------------------------------------------------
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '1.8.0';

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
    d.textContent = '[キケンなラムネシミュレーター] ' + title + '\n' + (detail || '') + '\nUA: ' + navigator.userAgent;
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
  ROOT.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.rm-scroll,.rm-card2')) e.preventDefault(); }, { passive: false });
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
