// ---- フォトモード：UI を全部消して、町と自分だけを撮れるようにする ---------------------------------
var PHOTO = { on: false, btn: null, hideT: 0 };
var PHOTO_CSS = [
  '#os-root.photo #os-ui > *:not(#os-photo):not(#os-phint){display:none!important;}',
  '#os-photo{position:absolute;left:calc(var(--sl) + 10px);top:calc(var(--st) + 10px);z-index:80;display:none;align-items:center;gap:6px;padding:6px 10px;border-radius:18px;background:rgba(0,0,0,.45);color:#fff;font:13px ' + FONT_UI + ';pointer-events:auto;transition:opacity .4s;}',
  '#os-root.photo #os-photo{display:flex;}',
  '#os-photo.dim{opacity:.12;}',
  '#os-phint{position:absolute;left:50%;bottom:calc(var(--sb) + 40px);transform:translateX(-50%);width:min(340px,88vw);z-index:81;padding:10px 12px;border-radius:10px;background:rgba(10,6,30,.78);border:2px solid #e8c060;color:#fff;font:14px/1.5 ' + FONT_SUB + ';text-align:center;pointer-events:none;transition:opacity .8s;}',
  '#os-qbtn{position:absolute;right:calc(var(--sr) + 10px);top:calc(var(--st) + 192px);width:40px;height:40px;border-radius:50%;pointer-events:auto;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:8px;color:#fff4d0;text-shadow:1px 1px 0 #000;background:radial-gradient(circle at 40% 30%,#d080ff,#7030a0 60%,#2a0a40);box-shadow:0 0 0 2px #1a1008,0 0 0 3px #c8a050;}', '#os-qbtn.on{background:radial-gradient(circle at 40% 30%,#a0a0a0,#505050 60%,#202020);}',
  '#os-pbtn{position:absolute;right:calc(var(--sr) + 10px);top:calc(var(--st) + 146px);width:40px;height:40px;border-radius:50%;pointer-events:auto;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:9px;color:#fff4d0;text-shadow:1px 1px 0 #000;background:radial-gradient(circle at 40% 30%,#8a8aa8,#3a3a58 60%,#15152a);box-shadow:0 0 0 2px #1a1008,0 0 0 3px #c8a050;}'
].join('\n');
function initPhoto() {
  var st = document.createElement('style'); st.textContent = PHOTO_CSS; (document.head || document.documentElement).appendChild(st);
  PHOTO.btn = el('div', '', UI); PHOTO.btn.id = 'os-photo';
  PHOTO.btn.innerHTML = cnHTML('✕　フォトモードを終わる');
  tapBtn(PHOTO.btn, function () { if (PHOTO.btn.classList.contains('dim')) { photoShowBtn(); return; } photoMode(false); }, 'uiClose');
  var pb = el('div', '', H.hud); pb.id = 'os-pbtn'; pb.appendChild(iconEl(uiIcon('eye'), 18)); el('span', '', pb, 'フォト');
  tapBtn(pb, function () { photoMode(true); }, 'uiOpen');
  var qb = H.bPol = el('div', '', H.hud); qb.id = 'os-qbtn'; qb.appendChild(iconEl(uiIcon('pollution'), 18)); qb._lab = el('span', '', qb); qb._lab.innerHTML = cnHTML(POLFX.off ? '汚染ON' : '汚染OFF'); qb.classList.toggle('on', POLFX.off);
  tapBtn(qb, function () { polFxToggle(!POLFX.off); }, 'uiClick');
  // フォト中：画面をさわると、終わるボタンが少しだけ見える
  R.renderer.domElement.addEventListener('touchend', function () { if (PHOTO.on) photoShowBtn(); }, { passive: true });
  R.renderer.domElement.addEventListener('mousedown', function () { if (PHOTO.on) photoShowBtn(); });
}
function photoShowBtn() { PHOTO.btn.classList.remove('dim'); clearTimeout(PHOTO.hideT); PHOTO.hideT = setTimeout(function () { if (PHOTO.on) PHOTO.btn.classList.add('dim'); }, 2500); }
function photoMode(on) {
  if (on === PHOTO.on || G.inMenu) return;
  PHOTO.on = on;
  if (on) { Object.keys(WIN.list).forEach(function (k) { closeWin(k, true); }); IN.mx = IN.mz = 0; IN.fire = false; if (STICK.knob) STICK.knob.style.transform = ''; IN.stickId = null; }
  ROOT.classList.toggle('photo', on);
  if (on) { photoShowBtn(); sfx('snap'); if (!SMASH.photoHinted) { SMASH.photoHinted = true; saveGame(); var hn = el('div', '', UI); hn.id = 'os-phint'; hn.innerHTML = cnHTML('「#精神汚染オンライン」をつけて投稿してくれたら見に行きます！'); setTimeout(function () { hn.style.opacity = 0; }, 6000); setTimeout(function () { if (hn.parentNode) hn.parentNode.removeChild(hn); }, 7000); } }
  else { clearTimeout(PHOTO.hideT); sysMsg('フォトモードを終わりました。', true); }
}
