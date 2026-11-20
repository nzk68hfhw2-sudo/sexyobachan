// ---- utilities ---------------------------------------------------------------
var PI = Math.PI, TAU = Math.PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function el(tag, cls, parent, html) {
  var e = document.createElement(tag); if (cls) e.className = cls;
  if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e;
}
function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
function angDiff(a, b) { var d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; }
function hsl(h, s, l) { return 'hsl(' + Math.round(((h % 360) + 360) % 360) + ',' + s + '%,' + l + '%)'; }

// ---- 保存（使えない環境でも止まらない） ------------------------------------
var STORE = (function () {
  var mem = {}, ok = false, KEY = 'seishinOsen_v1';
  try { var t = '__os_t'; window.localStorage.setItem(t, '1'); window.localStorage.removeItem(t); ok = true; } catch (e) { ok = false; }
  function load() {
    if (!ok) return mem[KEY] || null;
    try { var s = window.localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function save(obj) {
    try { var s = JSON.stringify(obj); mem[KEY] = obj; if (ok) window.localStorage.setItem(KEY, s); } catch (e) {}
  }
  function clear() { mem = {}; try { if (ok) window.localStorage.removeItem(KEY); } catch (e) {} }
  return { load: load, save: save, clear: clear, available: function () { return ok; } };
})();

var BASE_CSS = [
  'html.os-lock,body.os-lock{margin:0;padding:0;overflow:hidden;height:100%;background:#000;overscroll-behavior:none;}',
  '#os-root{position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;background:#000;overflow:hidden;z-index:2147480000;',
  ' touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;',
  ' --st:env(safe-area-inset-top,0px);--sb:env(safe-area-inset-bottom,0px);--sl:env(safe-area-inset-left,0px);--sr:env(safe-area-inset-right,0px);',
  ' font-family:' + FONT_JP + ';color:#fff;line-height:1.4;}',
  '#os-root *{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
  '#os-canvas{position:absolute;inset:0;}',
  '#os-canvas canvas{display:block;width:100%;height:100%;touch-action:none;}',
  '#os-ui{position:absolute;inset:0;pointer-events:none;overflow:hidden;}',
  '#os-ui .pe{pointer-events:auto;}',
  '.cn{font-family:' + FONT_CN + ' !important;}',
  // loading
  '#os-loading{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;',
  ' background:repeating-linear-gradient(45deg,#1a0a5e 0 22px,#240f7a 22px 44px);}',
  '#os-loading .bar{width:min(70vw,360px);height:22px;border:3px solid #fff;background:#000;box-shadow:4px 4px 0 #f0f;position:relative;overflow:hidden;}',
  '#os-loading .bar i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f);transition:width .3s;}',
  '#os-loading .msg{font:700 14px ' + FONT_JP + ';color:#ff0;text-shadow:2px 2px 0 #000;text-align:center;padding:0 16px;}',
  '@keyframes osSpin{to{transform:rotate(360deg)}}',
  '@keyframes osBlink{0%,100%{opacity:1}50%{opacity:.25}}',
  '@keyframes osBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
  '@keyframes osWob{0%,100%{transform:rotate(-3deg) scale(1)}50%{transform:rotate(3deg) scale(1.06)}}'
].join('\n');
