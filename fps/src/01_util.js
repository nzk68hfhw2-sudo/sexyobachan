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
