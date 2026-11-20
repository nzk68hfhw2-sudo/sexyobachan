// ===========================================================================
//  精神汚染ゲーム  game.js
// ---------------------------------------------------------------------------
//  BASE_URL : Netlify の URL。書きかえる場所はここ1か所だけ（最後は "/"）。
//  ※このゲームは 3Dモデル・テクスチャを game.js の中に埋め込んであるので、
//    いまのところ BASE_URL から読むファイルはありません（将来の追加用）。
//    game.js を <script src=".../game.js"> で読んだ場合は、そのフォルダを
//    自動で見つけて使います。
// ===========================================================================
var BASE_URL = 'https://stupendous-moxie-15d900.netlify.app/';
// 同時プレイ用：Firebase Realtime Database の URL（見られても安全な種類の値）。空にすると1人用。
var NET_DB_URL = 'https://seishinosen-online-default-rtdb.firebaseio.com/';
try { var _q = /[?&]osennet=([a-z]+)/.exec(location.search); if (_q) NET_DB_URL = _q[1] === 'local' ? 'local' : (_q[1] === 'off' ? '' : NET_DB_URL); } catch (e) {}
// ボイスチャット用の中継サーバー（TURN）。スマホどうしで声がつながらない時だけ設定する。例：[{ urls: 'turn:…', username: '…', credential: '…' }]
var VOICE_TURN = [];
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
var GAME_VERSION = '2.3.0';

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
// ---- フォント：すべて game.js に埋め込み（端末のフォントは使わない） ----------------------
//   OsUI  = DotGothic16（UI・角ばったドット風）   OsSub = BIZ UDゴシック Bold（字幕・説明文）
//   OsCN  = Noto Sans SC（一部の漢字だけ中国語の字形）  OsWA1-5 = ワードアート用
var FONT_UI = '"OsUI",monospace';
var FONT_JP = FONT_UI;
var FONT_SUB = '"OsSub",monospace';
var FONT_CN = '"OsCN",monospace';
var WA_FONTS = ['OsWA1', 'OsWA2', 'OsWA3', 'OsWA4', 'OsWA5', 'OsUI', 'OsSub'];
var FONT_NAMES = { OsUI: 'DotGothic16', OsSub: 'BIZ UDゴシック', OsCN: 'Noto Sans SC', OsWA1: 'Dela Gothic One', OsWA2: 'Reggae One', OsWA3: 'RocknRoll One', OsWA4: 'Mochiy Pop One', OsWA5: 'Yusei Magic' };
function loadEmbeddedFonts(cb) {
  var fail = [], names = Object.keys(FONT_B64), left = names.length, t0 = Date.now();
  function one(n, ok) { if (!ok) fail.push(n); if (--left === 0) cb(fail); }
  if (!window.FontFace || !document.fonts) {
    // 予備：@font-face に data URL で入れる
    var css = names.map(function (n) { return '@font-face{font-family:"' + n + '";src:url(data:font/woff2;base64,' + FONT_B64[n] + ') format("woff2");font-display:block}'; }).join('\n');
    var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);
    return setTimeout(function () { cb([]); }, 300);
  }
  names.forEach(function (n) {
    try {
      var bytes = b64ToBytes(FONT_B64[n]);
      var ff = new FontFace(n, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      ff.load().then(function (f) { document.fonts.add(f); one(n, true); }, function () { one(n, false); });
    } catch (e) { one(n, false); }
  });
}

function setupPage() {
  var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
  try {
    var vp = document.querySelector('meta[name=viewport]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; head.appendChild(vp); }
    vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
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
