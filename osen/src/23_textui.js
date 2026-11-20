// ---- 文字の出し方（画面のまんなかには照準以外を出さない） -----------------------------------------
// 表示量：0=少ない（最初） 1=ふつう 2=多い。文章はすべて左下のログに流れる。
var TEXTLV = { v: 0 };
var TEXT_CSS = [
  '#os-top{position:absolute;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;z-index:6;}',
  '#os-top .tl{font:12px ' + FONT_SUB + ';line-height:1.35;padding:2px 8px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(0,0,0,.35);border-radius:3px;animation:tlf 2.8s forwards;',
  ' text-shadow:1px 0 0 #000,-1px 0 0 #000,0 1px 0 #000,0 -1px 0 #000;}',
  '#os-top .tl.sys{color:#ffe23a;font-family:' + FONT_UI + ';} #os-top .tl.ev{color:#fff;} #os-top .tl.c2{color:#9ff;}',
  '#os-top canvas{display:block;max-width:100%;animation:tlf 1.9s forwards;}',
  '@keyframes tlf{0%{opacity:0;transform:translateY(-4px)}10%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}',
  '.tnote{position:absolute;transform:translate(-50%,-100%);max-width:200px;padding:4px 8px;background:rgba(255,254,240,.95);color:#222;border:1px solid #333;border-radius:6px;font:11px/1.4 ' + FONT_SUB + ';pointer-events:none;',
  ' display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;z-index:5;}'
].join('\n');
function initTextUI() {
  var st = document.createElement('style'); st.textContent = TEXT_CSS; (document.head || document.documentElement).appendChild(st);
  H.top = el('div', '', H.hud); H.top.id = 'os-top';
  H.note = el('div', 'tnote', H.hud); H.note.style.display = 'none'; H.noteT = 0;
  if (H.sys) H.sys.style.display = 'none';
  if (H.cap) H.cap.style.display = 'none'; if (H.cap2) H.cap2.style.display = 'none';
  layoutTop();
}
function layoutTop() {
  if (!H.top) return;
  var W = H.W || window.innerWidth, portrait = (H.H || window.innerHeight) > W;
  if (portrait) { H.top.style.top = 'calc(var(--st) + 206px)'; H.top.style.width = Math.min(W - 24, 360) + 'px'; }
  else { H.top.style.top = 'calc(var(--st) + 8px)'; H.top.style.width = Math.max(160, W - 2 * 240) + 'px'; }
}
function showTop(text, kind) {
  if (!H.top) return;
  var max = [1, 2, 4][TEXTLV.v];
  var d = el('div', 'tl ' + kind, H.top); d.innerHTML = cnHTML(text);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2850);
  while (H.top.querySelectorAll('.tl').length > max) H.top.removeChild(H.top.querySelector('.tl'));
}
// ---- システムメッセージ（黄色）・できごと・字幕 ----
function sysMsg(text, minor) {
  if (!minor) logMsg('sys', text);
  if (minor && TEXTLV.v === 0) return;
  showTop(text, 'sys'); sfx('sysMsg');
}
function caption(text, opt) {
  opt = opt || {};
  logMsg('ev', text);
  if (opt.src) { touchNote(text, opt.src); if (opt.speak) { var n = 0, iv = setInterval(function () { if (n++ >= Math.min(text.length, 14)) return clearInterval(iv); sfx('babble', hashStr(text) + n * 13); }, 55); } return; }
  if (TEXTLV.v >= 1) showTop(text, 'ev');
}
function caption2(text) { logMsg('ev', text, '字幕'); if (TEXTLV.v >= 1) showTop(text, 'c2'); }
// ---- ワードアート：上のほうに小さく短く ----
function popWA(text, o) {
  o = o || {};
  if (!o.area && !o.imp && TEXTLV.v === 0) return;
  if (o.x != null && TEXTLV.v < 2) return; // あふれ演出は「多い」の時だけ
  var Hh = H.H || 700, r = H.top ? H.top.getBoundingClientRect() : { top: 150, bottom: 150 };
  var y = o.x != null ? rand(0.08, 0.26) : Math.max(r.bottom, r.top) / Hh + (o.area ? 0.035 : 0.06);
  return popWABig(text, { style: o.style, shape: o.shape, size: 60, x: o.x != null ? o.x : 0.5, y: y, maxH: o.area ? 40 : (TEXTLV.v ? 58 : 48), w: 0.8, anim: REDUCED.on ? 'waSoft' : 'waPop', dur: o.area ? 1.6 : 1.9, silent: o.silent, lim: TEXTLV.v === 2 ? 6 : 2 });
}
function confetti(n) { if (TEXTLV.v === 0) return; confettiBig(Math.min(n, TEXTLV.v === 1 ? 6 : n)); }
// ---- 物にさわった時のひとこと：物の上の小さいふきだし（同時に１つだけ） ----
function touchNote(text, src) {
  var npc = src && src.fr && src.fr.npc ? NPCS.filter(function (n) { return n.pr === src; })[0] : null;
  if (npc) { npc.bubble = { text: text, t: now() + 3000 }; H.noteT = 0; H.note.style.display = 'none'; return; }
  H.noteSrc = src; H.noteT = now() + 2800; H.note.innerHTML = cnHTML(text); H.note.style.display = 'none';
}
var _nv = null;
function updateNote(rects) {
  if (!H.note) return;
  if (!H.noteSrc || now() > H.noteT) { H.note.style.display = 'none'; return; }
  if (!_nv) _nv = new THREE.Vector3();
  var c2 = H.noteSrc.center || (H.noteSrc.body && H.noteSrc.body.pos); if (!c2) return;
  _nv.set(c2.x, c2.y + 0.7, c2.z).project(R.camera);
  if (_nv.z > 1 || Math.abs(_nv.x) > 1.05 || Math.abs(_nv.y) > 1.05) { H.note.style.display = 'none'; return; }
  var W = H.W, Hh = H.H, x = clamp((_nv.x * 0.5 + 0.5) * W, 110, W - 110), y = (-_nv.y * 0.5 + 0.5) * Hh;
  // 照準（まんなか）とキャラに重ならないように
  if (Math.abs(x - W / 2) < 110 && y > Hh * 0.38 && y < Hh * 0.75) y = Hh * 0.38;
  for (var t = 0; t < 4; t++) { var hit = false; for (var i = 0; i < rects.length; i++) { var r = rects[i]; if (Math.abs(r.x - x) < (r.w + 200) / 2 && Math.abs(r.y - (y - 18)) < (r.h + 36) / 2) { y = r.y - r.h / 2 - 2; hit = true; } } if (!hit) break; }
  H.note.style.display = ''; H.note.style.left = x + 'px'; H.note.style.top = Math.max(60, y) + 'px';
}
