// ===========================================================================
//  精神汚染ゲーム  game.js
// ---------------------------------------------------------------------------
//  BASE_URL : Netlify の URL。書きかえる場所はここ1か所だけ（最後は "/"）。
//  ※このゲームは 3Dモデル・テクスチャを game.js の中に埋め込んであるので、
//    いまのところ BASE_URL から読むファイルはありません（将来の追加用）。
//    game.js を <script src=".../game.js"> で読んだ場合は、そのフォルダを
//    自動で見つけて使います。
// ===========================================================================
var BASE_URL = 'https://seishin-osen.netlify.app/';
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '1.0.0';

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

var ROOT, UI, CANVAS_HOST;
var BOOT_ERRORS = [];

// ---- 診断メッセージ（真っ黒のままにしない） -------------------------------
function showFatal(title, detail) {
  try {
    var d = document.getElementById('os-fatal');
    if (!d) {
      d = document.createElement('div'); d.id = 'os-fatal';
      d.style.cssText = 'position:fixed;left:16px;right:16px;top:calc(env(safe-area-inset-top,0px) + 70px);z-index:2147483647;background:#fffbe0;color:#300;border:4px solid #f0f;outline:4px solid #0ff;padding:14px;font:14px/1.6 sans-serif;white-space:pre-wrap;word-break:break-all;border-radius:4px;max-height:70vh;overflow:auto;box-shadow:6px 6px 0 #00f;';
      (document.body || document.documentElement).appendChild(d);
    }
    d.textContent = '【精神汚染ゲーム 診断メッセージ】\n' + title + '\n' + (detail || '') +
      '\n\n読み込み元: ' + ASSET_BASE + '\nthree.js: ' + THREE_URL + '\nオンライン: ' + (navigator.onLine ? 'はい' : 'いいえ') + '\nUA: ' + navigator.userAgent;
    var l = document.getElementById('os-loading'); if (l) l.style.display = 'none';
  } catch (e) {}
}
window.addEventListener('error', function (e) {
  var msg = (e && e.message) || 'error';
  BOOT_ERRORS.push(msg + ' @' + (e.filename || '') + ':' + (e.lineno || ''));
  if (!window.__osReady) showFatal('起動中にエラーが起きました', msg + '\n' + (e.filename || '') + ':' + (e.lineno || ''));
});

// ---- fonts (Google Fonts only / OFL) ------------------------------------------
var FONT_JP = '"Zen Kaku Gothic New","Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';
var FONT_SUB = '"M PLUS 1p","Zen Kaku Gothic New","Hiragino Sans",sans-serif';
var FONT_CN = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
var WA_FONTS = ['Dela Gothic One', 'Rampart One', 'Reggae One', 'RocknRoll One', 'Mochiy Pop One', 'Potta One', 'Yusei Magic', 'Hachi Maru Pop', 'DotGothic16', 'Kaisei Decol', 'Train One', 'Zen Kaku Gothic New'];

function setupPage() {
  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  try {
    var vp = document.querySelector('meta[name=viewport]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; head.appendChild(vp); }
    vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  } catch (e) {}
  try {
    var pre = document.createElement('link'); pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = 'anonymous'; head.appendChild(pre);
    var fam = ['Zen+Kaku+Gothic+New:wght@500;700;900', 'M+PLUS+1p:wght@700;800', 'Bungee', 'Shrikhand'];
    var lk = document.createElement('link'); lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=' + fam.join('&family=') + '&display=swap';
    head.appendChild(lk);
    // ワードアート用フォントは「使う字だけ」を1フォント1ファイルで取り寄せる（軽い・速い）
    var chars = encodeURIComponent(waCharset());
    WA_FONTS.forEach(function (f) {
      if (f === 'Zen Kaku Gothic New') return;
      var l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + (f === 'Kaisei Decol' ? ':wght@700' : '') + '&display=swap&text=' + chars;
      head.appendChild(l);
    });
    // 中国語フォントは「混ぜる字」だけを取り寄せる（軽い）
    var lk2 = document.createElement('link'); lk2.rel = 'stylesheet';
    lk2.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500;700;900&display=swap&text=' + encodeURIComponent(CN_CHARS_ALL);
    head.appendChild(lk2);
  } catch (e) {}

  var st = document.createElement('style'); st.id = 'os-style'; st.textContent = BASE_CSS; head.appendChild(st);
  ROOT = document.createElement('div'); ROOT.id = 'os-root';
  CANVAS_HOST = document.createElement('div'); CANVAS_HOST.id = 'os-canvas';
  UI = document.createElement('div'); UI.id = 'os-ui';
  ROOT.appendChild(CANVAS_HOST); ROOT.appendChild(UI);
  (document.body || document.documentElement).appendChild(ROOT);
  try { document.documentElement.classList.add('os-lock'); document.body.classList.add('os-lock'); } catch (e) {}

  var stop = function (e) { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (n) {
    ROOT.addEventListener(n, stop, { passive: false });
  });
  document.addEventListener('gesturestart', stop, { passive: false });
  ROOT.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.os-scroll')) e.preventDefault(); }, { passive: false });
  var lastTouchEnd = 0;
  ROOT.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouchEnd < 320 && !(e.target.closest && e.target.closest('.os-scroll'))) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}

// ---- three.js (cdnjs r128) ----------------------------------------------------
var THREE;
function loadThree(cb) {
  if (window.THREE && window.THREE.REVISION === '128') { THREE = window.THREE; return cb(); }
  var prev = window.THREE;
  var s = document.createElement('script');
  s.src = THREE_URL; s.async = true; s.crossOrigin = 'anonymous';
  var to = setTimeout(function () { showFatal('three.js（3D表示の部品）の読み込みがタイムアウトしました', THREE_URL + '\n通信が遅いか、cdnjs への接続が止められている可能性があります。'); }, 25000);
  s.onload = function () {
    clearTimeout(to);
    THREE = window.THREE;
    if (prev && prev !== THREE) window.THREE = prev;
    if (!THREE) return showFatal('three.js は読み込めましたが中身がありません', THREE_URL);
    cb();
  };
  s.onerror = function () { clearTimeout(to); showFatal('three.js（3D表示の部品）を読み込めませんでした', THREE_URL + '\ncdnjs.cloudflare.com への接続が止められている可能性があります。'); };
  (document.head || document.documentElement).appendChild(s);
}
