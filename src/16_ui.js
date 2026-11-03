// ---- UI: HUD, buttons, screens ----------------------------------------------
var UIX = {};
var UI_CSS = [
  '#hp-ui .en{display:block;font-family:"Bungee",Impact,sans-serif;letter-spacing:.02em;}',
  '#hp-ui .ja{display:block;font-family:"Zen Kaku Gothic New",sans-serif;font-weight:700;font-size:.62em;opacity:.85;letter-spacing:.04em;margin-top:2px;}',
  '#hp-ui .tw{font-family:"Special Elite","Courier New",monospace;}',
  '#hp-ui .vt{font-family:"VT323",monospace;}',
  // HUD top strip (below the Gravity no-go zone)
  '.hp-hudtop{position:absolute;top:calc(var(--top-safe) + 4px);left:16px;right:16px;height:58px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;transition:opacity .4s;}',
  '.hp-bars{width:104px;padding-top:4px;}',
  '.hp-bar{height:7px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);margin-bottom:7px;position:relative;overflow:hidden;}',
  '.hp-bar i{position:absolute;left:0;top:0;bottom:0;background:#e9e4d6;transition:width .15s;}',
  '.hp-bar.bat i{background:#f2d26a;} .hp-bar.low i{background:#e04a3a;}',
  '.hp-bar b{position:absolute;right:-1px;top:-14px;font:11px "VT323",monospace;color:#cfc8b8;}',
  '.hp-barlbl{font:12px "VT323",monospace;color:rgba(235,230,215,.75);margin:-4px 0 3px;letter-spacing:.08em;}',
  '.hp-obj{flex:1;text-align:center;font-family:"Bungee",Impact;font-size:13px;line-height:1.1;color:#f2ede0;text-shadow:0 1px 3px #000;padding-top:2px;min-width:0;}',
  '.hp-obj .ja{font-size:11px;}',
  '.hp-obj .seats{display:inline-block;margin-top:3px;font:15px "VT323",monospace;color:#ffcf6a;letter-spacing:.06em;}',
  '.hp-bell{font:22px "VT323",monospace;color:#f2ede0;text-align:right;min-width:62px;padding-top:2px;text-shadow:0 0 6px rgba(0,0,0,.9);}',
  '.hp-bell.warn{color:#ff5544;animation:hpblink .5s infinite;}',
  '.hp-pausebtn{width:56px;height:56px;border-radius:12px;background:rgba(10,10,12,.45);border:1.5px solid rgba(255,255,255,.35);color:#fff;font:22px "Bungee";display:flex;align-items:center;justify-content:center;}',
  '.hp-rec{position:absolute;top:calc(var(--top-safe) + 66px);right:16px;font:18px "VT323",monospace;color:rgba(255,255,255,.75);letter-spacing:.08em;text-shadow:0 0 4px #000;}',
  '.hp-rec i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#ff2b2b;margin-right:6px;animation:hpblink 1s steps(1) infinite;}',
  '@keyframes hpblink{50%{opacity:0}}',
  // buttons
  '.hp-btn{position:absolute;border-radius:50%;background:rgba(12,12,14,.42);border:1.5px solid rgba(255,255,255,.4);color:#f3efe3;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;line-height:1;touch-action:none;transition:transform .08s,background .15s;}',
  '.hp-btn.on{background:rgba(242,210,106,.35);border-color:#f2d26a;}',
  '.hp-btn.dn{transform:scale(.92);background:rgba(255,255,255,.22);}',
  '.hp-btn .ic{font-size:22px;} .hp-btn .lb{font:10px "Bungee";margin-top:3px;letter-spacing:.02em;} .hp-btn .lj{font:700 9px "Zen Kaku Gothic New";opacity:.8;margin-top:1px;}',
  '.hp-btn.big{width:86px;height:86px;} .hp-btn.big .ic{font-size:30px;}',
  '.hp-btn.hide{display:none;}',
  '.hp-btn.pulse{animation:hppulse 1s infinite;} @keyframes hppulse{50%{box-shadow:0 0 0 8px rgba(255,255,255,.12)}}',
  '.hp-stick{position:absolute;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06);pointer-events:none;}',
  '.hp-stick .knob{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.35);}',
  '.hp-stick.run{border-color:#f2d26a;} .hp-stick.run .knob{background:rgba(242,210,106,.6);}',
  '.hp-stickhint{position:absolute;left:28px;width:110px;height:110px;border-radius:50%;border:1.5px dashed rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.35);font:11px "Bungee";text-align:center;}',
  '.hp-inv{position:absolute;display:flex;gap:6px;}',
  '.hp-inv div{width:44px;height:44px;border-radius:9px;border:1.5px solid rgba(255,255,255,.3);background:rgba(10,10,12,.5);display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;}',
  '.hp-inv div.sel{border-color:#f2d26a;background:rgba(242,210,106,.22);} .hp-inv div b{position:absolute;right:2px;bottom:0;font:12px "VT323";color:#fff;}',
  '.hp-prompt{position:absolute;left:50%;transform:translateX(-50%);text-align:center;font-size:17px;color:#fff;text-shadow:0 2px 6px #000;white-space:nowrap;opacity:0;transition:opacity .15s;}',
  '.hp-prompt.show{opacity:1;}',
  '.hp-prompt .k{display:inline-block;border:1.5px solid #fff;border-radius:50%;width:22px;height:22px;line-height:20px;font-size:12px;margin-right:6px;vertical-align:2px;}',
  '.hp-sub{position:absolute;left:16px;right:16px;text-align:center;pointer-events:none;}',
  '.hp-sub span.box{display:inline-block;background:rgba(0,0,0,.62);padding:6px 12px 7px;border-radius:4px;max-width:100%;}',
  '.hp-sub .en{font-family:"Special Elite",monospace!important;font-size:16px;color:#fff;letter-spacing:0!important;}',
  '.hp-sub .ja{font-size:13px!important;color:#e8e1c8;}',
  '.hp-sub.hoots .en{color:#ffe07a;} .hp-sub.pa .en{color:#bfe3ff;} .hp-sub.evil .en{color:#ff6b5a;}',
  '.hp-toast{position:absolute;left:16px;right:16px;top:38%;text-align:center;pointer-events:none;opacity:0;transition:opacity .3s;}',
  '.hp-toast.show{opacity:1;} .hp-toast .en{font-size:20px;color:#fff;text-shadow:0 0 8px #000,0 0 2px #000;} .hp-toast .ja{font-size:14px;text-shadow:0 0 6px #000;}',
  '.hp-hint{position:absolute;left:16px;right:16px;text-align:center;font:13px "VT323",monospace;color:rgba(255,255,255,.55);}',
  '.hp-minimap{position:absolute;left:16px;width:124px;height:124px;border:1.5px solid rgba(255,255,255,.35);background:rgba(10,12,14,.6);border-radius:6px;}',
  '.hp-minimap canvas{width:100%;height:100%;display:block;}',
  '.hp-minimap b{position:absolute;left:4px;top:2px;font:12px "VT323";color:#cfe;}',
  // screens
  '.hp-scr{position:absolute;inset:0;pointer-events:auto;display:none;overflow:hidden;}',
  '.hp-scr.show{display:block;}',
  '.hp-panel{position:absolute;left:16px;right:16px;top:calc(var(--top-safe) + 8px);bottom:calc(var(--bot-safe) + 8px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}',
  '.hp-menu-btn{display:block;width:min(300px,100%);min-height:62px;margin:10px auto;border-radius:14px;border:3px solid #1b1b1b;background:#ffd84a;color:#1b1b1b;font-size:22px;padding:8px 10px;box-shadow:0 6px 0 #1b1b1b;}',
  '.hp-menu-btn .ja{font-size:13px;}',
  '.hp-menu-btn.alt{background:#7fd3ff;} .hp-menu-btn.alt2{background:#ff8f8f;} .hp-menu-btn.dark{background:#2a2a2e;color:#eee;border-color:#555;box-shadow:0 6px 0 #000;}',
  '.hp-menu-btn:active{transform:translateY(4px);box-shadow:0 2px 0 #1b1b1b;}',
  '.hp-dlg{background:#141416;border:1px solid #444;border-radius:10px;padding:16px;width:min(420px,100%);max-height:100%;overflow:auto;text-align:left;color:#ddd;}',
  '.hp-dlg h2{margin:0 0 10px;font-family:"Bungee";font-size:22px;color:#fff;}',
  '.hp-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #2a2a2a;}',
  '.hp-row .lbl .en{font-size:14px;} .hp-row .lbl .ja{font-size:11px;}',
  '.hp-seg{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;} .hp-seg button{min-width:56px;min-height:44px;border-radius:8px;border:1px solid #555;background:#222;color:#ddd;font:13px "Bungee";} .hp-seg button.sel{background:#ffd84a;color:#111;border-color:#ffd84a;}',
  '.hp-range{width:140px;height:44px;}',
  '.hp-x{min-width:56px;min-height:56px;border-radius:10px;border:1px solid #555;background:#222;color:#fff;font:16px "Bungee";}',
  '.hp-blink{animation:hpblink 1.1s steps(1) infinite;}',
  '.hp-black{background:#000;}',
  '.hp-chapter{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-2deg);width:min(330px,86%);background:#f2ead2;color:#151515;border-radius:4px;padding:16px 14px 14px;box-shadow:0 0 40px rgba(0,0,0,.8);text-align:center;}',
  '.hp-chapter:before{content:"";position:absolute;left:10px;right:10px;top:7px;height:4px;background:repeating-linear-gradient(90deg,#c62828 0 18px,#1f3c88 18px 36px);}',
  '.hp-chapter .n{font:15px "Special Elite";letter-spacing:.2em;margin-top:6px;}',
  '.hp-chapter .t{font:28px/1.05 "Special Elite";margin:6px 0;}',
  '.hp-chapter .s{font:12px "Special Elite";opacity:.7;}',
  '.hp-chapter .ja{font-size:13px!important;color:#333;}',
  '.hp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;}',
  '.hp-loading{position:absolute;left:0;right:0;bottom:calc(var(--bot-safe) + 30px);text-align:center;font:18px "VT323";color:#bbb;}'
].join('\n');

function initUI() {
  var st = document.createElement('style'); st.textContent = UI_CSS; document.head.appendChild(st);
  // HUD
  var hud = UIX.hud = el('div', 'hp-hud', null, UI);
  hud.style.display = 'none';
  var top = el('div', 'hp-hudtop', null, hud);
  var bars = el('div', 'hp-bars', null, top);
  el('div', 'hp-barlbl', 'STAMINA', bars); UIX.stam = el('div', 'hp-bar', '<i></i>', bars).firstChild;
  el('div', 'hp-barlbl', 'BATTERY', bars); var bb = el('div', 'hp-bar bat', '<i></i>', bars); UIX.batBar = bb; UIX.bat = bb.firstChild;
  UIX.obj = el('div', 'hp-obj', '', top);
  UIX.bell = el('div', 'hp-bell', '', top);
  UIX.pauseBtn = el('div', 'hp-pausebtn pe', 'II', top);
  onTap(UIX.pauseBtn, function () { press('pause'); });
  UIX.rec = el('div', 'hp-rec', '<i></i>REC <span></span>', hud);
  UIX.prompt = el('div', 'hp-prompt', '', hud);
  UIX.sub = el('div', 'hp-sub', '', UI);
  UIX.toast = el('div', 'hp-toast', '', UI);
  UIX.minimap = el('div', 'hp-minimap', '<canvas width="248" height="248"></canvas><b>MAP</b>', hud); UIX.minimap.style.display = 'none';
  UIX.stickHint = el('div', 'hp-stickhint', 'MOVE<br>移動', hud);
  UIX.hint = el('div', 'hp-hint', 'WASD move · MOUSE look · SHIFT run · C crouch · E interact · F light · Q item · SPACE hold breath', hud);
  // buttons
  function mkBtn(cls, ic, en, ja, cb, hold) {
    var b = el('div', 'hp-btn pe ' + cls, '<span class="ic">' + ic + '</span><span class="lb">' + en + '</span><span class="lj">' + ja + '</span>', hud);
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); b.classList.add('dn'); if (hold) hold(true); else cb(); });
    var up = function (e) { b.classList.remove('dn'); if (hold) hold(false); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    return b;
  }
  UIX.bInteract = mkBtn('big', '✋', 'USE', '調べる', function () { press('interact'); });
  UIX.bCrouch = mkBtn('', '⤓', 'CROUCH', 'しゃがむ', function () { press('crouch'); });
  UIX.bFlash = mkBtn('', '🔦', 'LIGHT', 'ライト', function () { press('flash'); });
  UIX.bItem = mkBtn('', '✦', 'ITEM', 'アイテム', function () { press('item'); });
  UIX.bBreath = mkBtn('', '🫁', 'HOLD', '息を止める', null, function (v) { INPUT.breathBtn = v; });
  UIX.inv = el('div', 'hp-inv pe', '', hud);
  // screens container
  UIX.screens = {};
  ['loading', 'warning', 'title', 'letter', 'chapter', 'settings', 'archive', 'pause', 'gameover', 'clear', 'vhs', 'note', 'lesson', 'fade', 'dialog'].forEach(function (n) { UIX.screens[n] = el('div', 'hp-scr', '', UI); });
  UIX.screens.fade.style.background = '#000'; UIX.screens.fade.style.pointerEvents = 'none'; UIX.screens.fade.style.transition = 'opacity .5s'; UIX.screens.fade.style.opacity = 0; UIX.screens.fade.style.display = 'block';
  layoutUI();
}
function uiTopSafe() { var d = document.createElement('div'); d.style.cssText = 'position:absolute;top:0;height:var(--top-safe);'; ROOT.appendChild(d); var h = d.getBoundingClientRect().height; ROOT.removeChild(d); return h || 110; }
function uiBotSafe() { var d = document.createElement('div'); d.style.cssText = 'position:absolute;bottom:0;height:var(--bot-safe);'; ROOT.appendChild(d); var h = d.getBoundingClientRect().height; ROOT.removeChild(d); return h || 12; }
function layoutUI() {
  if (!UIX.hud) return;
  var W = RENDER.w || window.innerWidth, H = RENDER.h || window.innerHeight;
  var bs = uiBotSafe();
  var small = H < 700;
  var by = H - bs - 8; // bottom line
  function place(b, cx, cy, size) { b.style.width = size + 'px'; b.style.height = size + 'px'; b.style.left = (cx - size / 2) + 'px'; b.style.top = (cy - size / 2) + 'px'; }
  var big = small ? 80 : 88, sm = small ? 58 : 62;
  var ix = W - 16 - big / 2, iy = by - big / 2;
  place(UIX.bInteract, ix, iy, big);
  place(UIX.bCrouch, ix - big / 2 - sm / 2 - 12, iy + 6, sm);
  place(UIX.bFlash, ix - big / 2 - sm / 2 - 8, iy - big / 2 - sm / 2 - 6, sm);
  place(UIX.bItem, ix, iy - big / 2 - sm / 2 - 14, sm);
  place(UIX.bBreath, ix - big / 2 - sm * 1.5 - 22, iy - 20, sm);
  UIX.inv.style.right = '16px'; UIX.inv.style.top = (iy - big / 2 - sm - 14 - 54) + 'px';
  UIX.stickHint.style.top = (by - 118) + 'px';
  UIX.prompt.style.top = (iy - big / 2 - sm - 130) + 'px';
  UIX.sub.style.bottom = (H - (iy - big / 2 - sm - 76)) + 'px';
  UIX.minimap.style.top = (by - 118 - 136) + 'px';
  UIX.hint.style.bottom = (bs + 6) + 'px';
  var pc = !isTouchDevice();
  [UIX.bInteract, UIX.bCrouch, UIX.bFlash, UIX.bItem, UIX.bBreath, UIX.stickHint].forEach(function (b) { b.style.display = pc ? 'none' : ''; });
  UIX.hint.style.display = pc ? '' : 'none';
  if (pc) { UIX.inv.style.top = ''; UIX.inv.style.bottom = (bs + 30) + 'px'; UIX.prompt.style.top = (H * 0.62) + 'px'; UIX.sub.style.bottom = (bs + 90) + 'px'; UIX.minimap.style.top = (H - bs - 190) + 'px'; }
}
function showScreen(n, html) { var s = UIX.screens[n]; if (html != null) s.innerHTML = html; s.classList.add('show'); return s; }
function hideScreen(n) { UIX.screens[n].classList.remove('show'); }
function hideAllScreens() { for (var n in UIX.screens) if (n !== 'fade') hideScreen(n); }
function fadeTo(v, sec) { var f = UIX.screens.fade; f.style.transition = 'opacity ' + (sec || 0.5) + 's'; f.style.opacity = v; return wait(sec || 0.5); }
var SUB = { t: 0 };
function showSubtitle(en, ja, dur, kind) {
  if (!SAVE.settings.subtitles && kind !== 'force') { /* JA still needed for comprehension */ }
  UIX.sub.className = 'hp-sub ' + (kind || '');
  UIX.sub.innerHTML = '<span class="box">' + bi(en, ja) + '</span>';
  SUB.t = dur || 3;
}
var TOAST = { t: 0 };
function showToast(en, ja, dur) {
  if (!UIX.toast) return;
  UIX.toast.innerHTML = (en ? '<span class="en">' + en + '</span>' : '') + (ja ? '<span class="ja">' + ja + '</span>' : '');
  UIX.toast.classList.add('show'); TOAST.t = dur || 2.2;
}
function updateUITimers(dt) {
  if (SUB.t > 0) { SUB.t -= dt; if (SUB.t <= 0) UIX.sub.innerHTML = ''; }
  if (TOAST.t > 0) { TOAST.t -= dt; if (TOAST.t <= 0) UIX.toast.classList.remove('show'); }
}
function setPrompt(en, ja) {
  if (!en) { UIX.prompt.classList.remove('show'); UIX.bInteract.classList.remove('pulse'); UIX._prompt = null; return; }
  var key = en + ja;
  if (UIX._prompt !== key) { UIX._prompt = key; UIX.prompt.innerHTML = '<span class="en" style="font-size:17px"><span class="k">' + (isTouchDevice() ? '✋' : 'E') + '</span>' + en + '</span><span class="ja" style="font-size:12px">' + ja + '</span>'; }
  UIX.prompt.classList.add('show'); UIX.bInteract.classList.add('pulse');
}
var ITEM_DEFS = {
  flashlight: { ic: '🔦', en: 'Flashlight', ja: '懐中電灯' },
  battery: { ic: '🔋', en: 'Batteries', ja: '電池', desc: 'Refills the flashlight.', descJa: '懐中電灯の電池を補充する。' },
  hallpass: { ic: '🎫', en: 'Hall Pass', ja: 'ホールパス', desc: 'Opens one locked door.', descJa: 'カギのかかったドアを1回だけ開けられる。' },
  horn: { ic: '📢', en: 'Air Horn', ja: '防犯ブザー', desc: 'Throw it. It screams for a long time and lures monsters.', descJa: '投げると長く鳴り続け、モンスターを引き寄せる。' },
  chalk: { ic: '🖍', en: 'Chalk', ja: 'チョーク', desc: 'Throw it to make a small sound.', descJa: '投げると小さな音で短時間気をそらす。' },
  star: { ic: '⭐', en: 'Gold Star', ja: '金星シール', desc: 'Makes a monster flinch once. Hoo-ray!', descJa: 'モンスターを1回だけひるませる。' },
  lunch: { ic: '🍱', en: 'Lunch Box', ja: 'ランチボックス', desc: 'Give it to a student to make a friend.', descJa: '生徒に渡すと味方になってくれる。' },
  bandaid: { ic: '🩹', en: 'Band-Aid', ja: '絆創膏', desc: 'Survive one attack.', descJa: '1回だけ攻撃に耐える。' },
  map: { ic: '🗺', en: 'Map Scrap', ja: '校内図の切れはし', desc: 'Shows part of the school map.', descJa: 'ミニマップの一部が見える。' }
};
function renderInventory() {
  var h = '';
  var counts = {}, order = [];
  PL.inv.forEach(function (it) { if (!counts[it]) { counts[it] = 0; order.push(it); } counts[it]++; });
  PL.invOrder = order;
  if (PL.sel >= order.length) PL.sel = 0;
  order.forEach(function (it, i) { h += '<div data-i="' + i + '" class="' + (i === PL.sel ? 'sel' : '') + '">' + ITEM_DEFS[it].ic + (counts[it] > 1 ? '<b>' + counts[it] + '</b>' : '') + '</div>'; });
  UIX.inv.innerHTML = h;
  Array.prototype.forEach.call(UIX.inv.children, function (d) { onTap(d, function () { PL.sel = +d.getAttribute('data-i'); renderInventory(); var it = PL.invOrder[PL.sel]; showToast(ITEM_DEFS[it].en, ITEM_DEFS[it].ja + '：' + ITEM_DEFS[it].descJa, 2.5); }); });
  var cur = order[PL.sel];
  UIX.bItem.querySelector('.ic').textContent = cur ? ITEM_DEFS[cur].ic : '✦';
  UIX.bItem.style.opacity = cur ? 1 : 0.4;
}
function hasItem(it) { return PL && PL.inv.indexOf(it) >= 0; }
function addItem(it) { PL.inv.push(it); renderInventory(); }
function takeItem(it) { var i = PL.inv.indexOf(it); if (i >= 0) { PL.inv.splice(i, 1); renderInventory(); return true; } return false; }
function updateHUD(dt) {
  if (!PL) return;
  UIX.stam.style.width = (PL.stamina * 100) + '%';
  UIX.stam.parentNode.classList.toggle('low', PL.exhausted);
  UIX.bat.style.width = PL.battery + '%';
  UIX.batBar.classList.toggle('low', PL.battery < 20);
  UIX.bFlash.classList.toggle('on', PL.flash);
  UIX.bCrouch.classList.toggle('on', PL.crouch);
  UIX.bBreath.classList.toggle('on', PL.breath);
  var dark = LIGHTU.uMix.value < 0.5;
  UIX.rec.style.display = dark && GAME.phase === 'transit' ? '' : 'none';
  if (dark) { var tt = GAME.clock || 0; var hh = 3, mm = Math.floor(tt / 60) % 60, ss = Math.floor(tt) % 60; UIX.rec.lastChild.textContent = '0' + hh + ':' + (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss + ' AM'; }
}
