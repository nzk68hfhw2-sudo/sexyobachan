// ---- UI: HUD, menus, phone, screens ----------------------------------------------
var UI_CSS = [
  '#rm-ui{--pink:#ff5fa8;--cyan:#7df9ff;--violet:#b46bff;--ink:#1b1030;--panel:rgba(22,12,44,0.88);--line:rgba(255,255,255,0.14);}',
  '.rm-hud{position:absolute;left:10px;right:10px;top:var(--top-safe);display:flex;gap:8px;align-items:flex-start;justify-content:space-between;}',
  '.rm-clock{font-family:"DotGothic16",monospace;font-size:26px;line-height:1;padding:6px 10px 7px;border-radius:12px;background:rgba(10,6,24,0.55);border:1px solid var(--line);text-shadow:0 0 10px var(--cyan);letter-spacing:.04em;}',
  '.rm-clock small{display:block;font-size:11px;opacity:.7;margin-top:3px;letter-spacing:.1em}',
  '.rm-vitals{display:grid;grid-template-columns:repeat(5,auto);gap:4px;padding:5px 7px;border-radius:12px;background:rgba(10,6,24,0.55);border:1px solid var(--line);font-size:11px;}',
  '.rm-vt{display:flex;flex-direction:column;align-items:center;min-width:42px;padding:2px 3px;border-radius:8px;transition:background .3s}',
  '.rm-vt b{font-family:"DotGothic16",monospace;font-size:15px;font-weight:400;line-height:1.1}',
  '.rm-vt span{opacity:.7;font-size:10px}',
  '.rm-vt.warn{background:rgba(255,190,40,0.25)} .rm-vt.bad{background:rgba(255,40,60,0.45);animation:rmBlink .6s infinite alternate}',
  '@keyframes rmBlink{from{opacity:1}to{opacity:.55}}',
  '.rm-danger{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--top-safe) + 58px);width:min(70vw,320px);padding:5px 10px 7px;border-radius:12px;background:rgba(60,0,10,0.75);border:1px solid #ff3355;text-align:center;font-size:12px;font-weight:900;display:none}',
  '.rm-danger .bar{height:7px;border-radius:5px;background:rgba(255,255,255,0.15);margin-top:4px;overflow:hidden}.rm-danger .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff9f1c,#ff1744);width:0}',
  '.rm-fx{position:absolute;right:10px;top:calc(var(--top-safe) + 62px);display:flex;flex-direction:column;gap:5px;align-items:flex-end;max-width:46vw}',
  '.rm-chip{display:flex;align-items:center;gap:6px;padding:4px 8px 4px 4px;border-radius:999px;background:rgba(10,6,24,0.6);border:1px solid var(--line);font-size:11px;font-weight:700;white-space:nowrap}',
  '.rm-chip img{width:22px;height:22px}.rm-chip .ph{opacity:.7;font-weight:500}.rm-chip .lv{width:34px;height:4px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden}.rm-chip .lv i{display:block;height:100%;background:var(--cyan)}',
  '.rm-feel{position:absolute;left:10px;top:calc(var(--top-safe) + 62px);display:flex;flex-direction:column;gap:3px;font-size:11px}',
  '.rm-feel div{display:flex;align-items:center;gap:5px}.rm-feel .b{width:54px;height:5px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}.rm-feel .b i{display:block;height:100%}',
  '.rm-cross{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:rgba(255,255,255,0.8);box-shadow:0 0 6px #fff;transition:transform .15s}',
  '.rm-cross.on{transform:scale(2.2);background:var(--cyan)}',
  '.rm-focus{position:absolute;left:50%;top:calc(50% + 18px);transform:translateX(-50%);padding:4px 10px;border-radius:999px;background:rgba(10,6,24,0.65);font-size:12px;font-weight:700;white-space:nowrap;display:none}',
  '.rm-btns{position:absolute;right:12px;bottom:var(--bot-safe);display:flex;flex-direction:column;gap:10px;align-items:flex-end}',
  '.rm-row{display:flex;gap:10px}',
  '.btn{pointer-events:auto;cursor:pointer;border:none;outline:none;color:#fff;font-family:inherit;font-weight:900;border-radius:16px;padding:10px 14px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.22);box-shadow:0 4px 18px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:14px;transition:transform .08s}',
  '.btn:active{transform:scale(.95)}',
  '.btn.round{width:58px;height:58px;border-radius:50%;padding:0;font-size:24px;display:flex;align-items:center;justify-content:center}',
  '.btn.act{min-width:96px;height:72px;border-radius:22px;font-size:14px;background:linear-gradient(160deg,#ff5fa8,#b46bff);border-color:rgba(255,255,255,.5);line-height:1.2}',
  '.btn.act.off{opacity:.45;filter:grayscale(.6)}',
  '.btn.on{background:linear-gradient(160deg,#30c8ff,#7df9ff);color:#08203a}',
  '.btn.pri{background:linear-gradient(160deg,#ff5fa8,#b46bff);border-color:rgba(255,255,255,.5);font-size:17px;padding:14px 22px}',
  '.btn.ghost{background:rgba(255,255,255,.06)}',
  '.btn.warn{background:linear-gradient(160deg,#ff3355,#ff9f1c)}',
  '.btn[disabled]{opacity:.35;pointer-events:none}',
  '.rm-sub{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--bot-safe) + 150px);width:min(86vw,520px);text-align:center;font-size:15px;font-weight:700;text-shadow:0 2px 6px #000,0 0 14px rgba(0,0,0,.8);transition:opacity .4s;opacity:0}',
  '.rm-sub.friend{color:#b9c0ff}',
  '.rm-toasts{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--bot-safe) + 186px);display:flex;flex-direction:column;gap:6px;align-items:center;width:min(90vw,460px)}',
  '.rm-toast{padding:7px 14px;border-radius:14px;background:rgba(14,8,30,.82);border:1px solid var(--line);font-size:13px;font-weight:700;text-align:center;animation:rmIn .3s ease-out}',
  '.rm-toast.warn{border-color:#ff3355;background:rgba(70,0,16,.85)} .rm-toast.good{border-color:var(--cyan)}',
  '@keyframes rmIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}',
  '.rm-banner{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;width:92vw}',
  '.rm-banner .k{font-size:12px;letter-spacing:.3em;color:var(--cyan);font-weight:900}',
  '.rm-banner .n{font-family:"Rampart One","Zen Maru Gothic",sans-serif;font-size:clamp(28px,8vw,52px);line-height:1.15;margin:6px 0;background:linear-gradient(90deg,#7df9ff,#ff5fa8,#ffe14d,#7df9ff);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:rmShine 2s linear infinite;filter:drop-shadow(0 0 12px rgba(255,95,168,.6))}',
  '.rm-banner .d{font-size:13px;opacity:.9;max-width:420px;margin:0 auto;text-shadow:0 2px 4px #000}',
  '@keyframes rmShine{to{background-position:300% 0}}',
  '.rm-modal{position:absolute;inset:0;background:rgba(4,2,12,.55);display:flex;align-items:flex-end;justify-content:center;pointer-events:auto;animation:rmFade .2s}',
  '@keyframes rmFade{from{opacity:0}to{opacity:1}}',
  '.rm-sheet{width:min(100%,640px);max-height:calc(100% - var(--top-safe) - 10px);display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-bottom:none;border-radius:24px 24px 0 0;padding:14px 14px calc(var(--bot-safe) + 4px);box-shadow:0 -10px 40px rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:rmUp .25s ease-out}',
  '@keyframes rmUp{from{transform:translateY(40px)}to{transform:none}}',
  '.rm-sheet h2{margin:2px 4px 10px;font-size:19px;display:flex;align-items:center;gap:8px;flex:0 0 auto}',
  '.rm-sheet h2 .x{margin-left:auto}',
  '.rm-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;flex:1;min-height:0;padding:2px}',
  '.rm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.rm-card{position:relative;padding:8px 6px 8px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid var(--line);text-align:center;cursor:pointer;pointer-events:auto}',
  '.rm-card:active{transform:scale(.96)}',
  '.rm-card img{width:52px;height:52px;display:block;margin:0 auto 2px}',
  '.rm-card .nm{font-size:11.5px;font-weight:900;line-height:1.25;min-height:2.5em;display:flex;align-items:center;justify-content:center}',
  '.rm-card .st{font-size:10px;opacity:.75}',
  '.rm-card .cl{position:absolute;left:6px;top:6px;font-size:9px;padding:1px 5px;border-radius:6px;font-weight:900;color:#111}',
  '.rm-card.empty{opacity:.35}',
  '.rm-detail{display:flex;flex-direction:column;gap:10px}',
  '.rm-detail .hd{display:flex;gap:12px;align-items:center}.rm-detail .hd img{width:84px;height:84px}',
  '.rm-detail .t{font-size:20px;font-weight:900}.rm-detail .c{font-size:12px;font-weight:900;padding:2px 8px;border-radius:8px;display:inline-block;color:#111;margin-top:4px}',
  '.rm-detail p{margin:0;font-size:14px;line-height:1.6;opacity:.95}',
  '.rm-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:13px;background:rgba(255,255,255,.05);border-radius:12px;padding:10px 12px}',
  '.rm-kv span{opacity:.65}',
  '.rm-alert{padding:10px 12px;border-radius:12px;background:rgba(255,40,70,.18);border:1px solid rgba(255,60,90,.6);font-size:13px;font-weight:700;line-height:1.5}',
  '.rm-tabs{display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;touch-action:pan-x;flex:0 0 auto;padding-bottom:2px}',
  '.rm-tab{flex:0 0 auto;padding:8px 12px;border-radius:12px;font-size:13px;font-weight:900;background:rgba(255,255,255,.07);border:1px solid var(--line);cursor:pointer;pointer-events:auto}',
  '.rm-tab.on{background:linear-gradient(160deg,#ff5fa8,#b46bff)}',
  '.rm-list{display:flex;flex-direction:column;gap:8px}',
  '.rm-item{display:flex;gap:10px;align-items:center;padding:10px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line)}',
  '.rm-item img{width:44px;height:44px;flex:0 0 auto}',
  '.rm-item .tx{flex:1;min-width:0}.rm-item .tx b{display:block;font-size:14px}.rm-item .tx small{display:block;font-size:12px;opacity:.75;line-height:1.45;margin-top:2px}',
  '.rm-item.lock{opacity:.55}',
  '.dg0{color:#7dffb0}.dg1{color:#ffe14d}.dg2{color:#ff9f1c}.dg3{color:#ff3355}',
  '.rm-big{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}',
  '.rm-big div{padding:10px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid var(--line)}',
  '.rm-big b{display:block;font-family:"DotGothic16",monospace;font-size:24px;font-weight:400}.rm-big span{font-size:12px;opacity:.7}',
  '.rm-screen{position:absolute;inset:0;pointer-events:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:calc(var(--top-safe) + 4px) 18px var(--bot-safe)}',
  '.rm-screen.rm-title{background:radial-gradient(ellipse at center,rgba(8,4,20,.72) 0%,rgba(8,4,20,.45) 60%,rgba(8,4,20,.2) 100%)}',
  '.rm-logo{font-family:"Rampart One","Zen Maru Gothic",sans-serif;font-size:clamp(40px,13vw,92px);line-height:.95;background:linear-gradient(90deg,#7df9ff,#ff5fa8,#ffe14d,#b46bff,#7df9ff);background-size:400% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:rmShine 6s linear infinite;filter:drop-shadow(0 0 18px rgba(255,95,168,.5))}',
  '.rm-logo-sub{font-size:15px;letter-spacing:.5em;margin:10px 0 4px;color:#ffd1e8;font-weight:900}',
  '.rm-menu{display:flex;flex-direction:column;gap:10px;margin-top:26px;width:min(80vw,300px)}',
  '.rm-note{font-size:11px;opacity:.6;margin-top:18px;line-height:1.6}',
  '.rm-card2{width:min(92vw,520px);max-height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:18px;text-align:left;font-size:14px;line-height:1.7}',
  '.rm-card2 h3{margin:0 0 8px;font-size:18px}',
  '.rm-card2 ul{padding-left:1.2em;margin:6px 0}',
  '.rm-set{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid var(--line);font-size:14px}',
  '.rm-set input[type=range]{width:46%;pointer-events:auto}',
  '.rm-tog{width:52px;height:30px;border-radius:15px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;pointer-events:auto;flex:0 0 auto}',
  '.rm-tog i{position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s}.rm-tog.on{background:#ff5fa8}.rm-tog.on i{left:25px}',
  '.rm-seg{display:flex;gap:4px}.rm-seg div{padding:6px 9px;border-radius:9px;background:rgba(255,255,255,.08);font-size:12px;font-weight:900;cursor:pointer;pointer-events:auto}.rm-seg div.on{background:#ff5fa8}',
  '.rm-stick{position:absolute;width:110px;height:110px;border-radius:50%;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06)}',
  '.rm-stick .knob{position:absolute;left:33px;top:33px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.4)}',
  '.rm-hint{position:absolute;left:14px;bottom:calc(var(--bot-safe) + 6px);font-size:11px;opacity:.55;line-height:1.5;max-width:46vw}',
  '.rm-end h1{font-family:"Rampart One","Zen Maru Gothic",sans-serif;font-size:clamp(30px,9vw,56px);margin:0 0 4px;line-height:1.1}',
  '.rm-rank{font-size:30px;font-weight:900;margin:6px 0 10px;color:#ffe14d;text-shadow:0 0 14px rgba(255,225,77,.6)}',
  '.rm-graph{width:100%;height:90px;display:block;border-radius:10px;background:rgba(0,0,0,.25)}'
].join('\n');

var HUD = {};
function initUI() {
  HUD.hud = el('div', 'rm-hud', '', UI);
  HUD.clock = el('div', 'rm-clock', '20:00<small>DAY 1</small>', HUD.hud);
  HUD.vitals = el('div', 'rm-vitals', '', HUD.hud);
  HUD.v = {};
  [['hr', '心拍', '♥'], ['tp', '体温', '🌡'], ['rr', '呼吸', '🫁'], ['con', '意識', '🧠'], ['hyd', '水分', '💧']].forEach(function (a) {
    var d = el('div', 'rm-vt', '<span>' + a[2] + ' ' + a[1] + '</span><b>--</b>', HUD.vitals); HUD.v[a[0]] = d;
  });
  HUD.danger = el('div', 'rm-danger', '⚠ からだが危ない <span></span><div class="bar"><i></i></div>', UI);
  HUD.fx = el('div', 'rm-fx', '', UI);
  HUD.feel = el('div', 'rm-feel', '', UI);
  HUD.cross = el('div', 'rm-cross', '', UI);
  HUD.focus = el('div', 'rm-focus', '', UI);
  HUD.sub = el('div', 'rm-sub', '', UI);
  HUD.toasts = el('div', 'rm-toasts', '', UI);
  HUD.banner = el('div', 'rm-banner', '', UI); HUD.banner.style.display = 'none';
  HUD.hint = el('div', 'rm-hint', '', UI);
  HUD.btns = el('div', 'rm-btns', '', UI);
  var row = el('div', 'rm-row', '', HUD.btns);
  HUD.bPhone = el('button', 'btn round', '📱', row); onTap(HUD.bPhone, function () { openPhone(); });
  HUD.bFF = el('button', 'btn round', '⏩', row); onTap(HUD.bFF, function () { toggleFF(); });
  HUD.bAct = el('button', 'btn act off', 'しらべる', HUD.btns); onTap(HUD.bAct, function () { if (FOCUS.it) doInteract(FOCUS.it); });
  showHUD(false);
}
function showHUD(on) {
  ['hud', 'fx', 'feel', 'cross', 'btns', 'hint'].forEach(function (k) { HUD[k].style.display = on ? '' : 'none'; });
  if (!on) { HUD.danger.style.display = 'none'; HUD.focus.style.display = 'none'; }
}
function layoutUI() {}

// ---- toasts / subtitles / banners ----------------------------------------------------
function toast(msg, cls, dur) {
  var t = el('div', 'rm-toast ' + (cls || ''), esc(msg), HUD.toasts);
  while (HUD.toasts.children.length > 3) HUD.toasts.removeChild(HUD.toasts.firstChild);
  setTimeout(function () { t.style.transition = 'opacity .5s'; t.style.opacity = 0; setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 500); }, (dur || 3.2) * 1000);
}
var SUBT = { t: 0, prio: 0 };
function say(text, dur, cls) {
  HUD.sub.textContent = text; HUD.sub.className = 'rm-sub ' + (cls || ''); HUD.sub.style.opacity = 1;
  SUBT.t = dur || 3.5;
}
function banner(kicker, name, desc, cls) {
  HUD.banner.innerHTML = '<div class="k">' + esc(kicker) + '</div><div class="n">' + esc(name) + '</div><div class="d ' + (cls || '') + '">' + esc(desc) + '</div>';
  HUD.banner.style.display = ''; HUD.banner.style.opacity = 1; HUD.banner.style.transition = '';
  clearTimeout(HUD.bannerTO);
  HUD.bannerTO = setTimeout(function () { HUD.banner.style.transition = 'opacity .8s'; HUD.banner.style.opacity = 0; setTimeout(function () { HUD.banner.style.display = 'none'; }, 800); }, 4200);
}
function updateUITimers(dt) {
  if (SUBT.t > 0) { SUBT.t -= dt; if (SUBT.t <= 0) HUD.sub.style.opacity = 0; }
}

// ---- HUD update ----------------------------------------------------------------------
var _hudT = 0;
function updateHUD(dt, B) {
  _hudT -= dt; if (_hudT > 0) return; _hudT = 0.2;
  HUD.clock.innerHTML = fmtClock(GAME.clock) + '<small>' + (GAME.ff ? '⏩ 早送り中' : GAME.clock < 1440 ? 'よる' : GAME.clock < 1740 ? 'しんや' : 'あけがた') + '</small>';
  function setV(k, txt, lvl) { var d = HUD.v[k]; d.lastChild.textContent = txt; d.className = 'rm-vt' + (lvl === 2 ? ' bad' : lvl === 1 ? ' warn' : ''); }
  setV('hr', Math.round(B.hr), B.hr > 175 ? 2 : B.hr > 140 ? 1 : 0);
  setV('tp', B.tp.toFixed(1), B.tp > 39.5 ? 2 : B.tp > 38.3 ? 1 : 0);
  setV('rr', B.rr.toFixed(0), B.rr < 8 ? 2 : B.rr < 11 ? 1 : 0);
  setV('con', Math.round(B.con) + '%', B.con < 20 ? 2 : B.con < 45 ? 1 : 0);
  setV('hyd', Math.round(B.hyd * 100) + '%', B.hyd < 0.3 ? 2 : B.hyd < 0.55 ? 1 : 0);
  if (B.danger > 0.5) {
    HUD.danger.style.display = '';
    HUD.danger.firstChild.nodeValue = '⚠ ' + ({ rr: '呼吸が止まりかけている', hr: '心臓が限界', tp: '体温が上がりすぎ', vomit: '危険な状態' }[B.dangerCause] || 'からだが危ない') + ' ';
    HUD.danger.querySelector('i').style.width = B.danger.toFixed(0) + '%';
  } else HUD.danger.style.display = 'none';
  // active substances
  var arr = activeDoseSummary(B), html = '';
  arr.forEach(function (o) {
    if (o.alc) { html += '<div class="rm-chip"><img src="' + canIcon(DRINK.z9lemon, 44) + '"><div>お酒 <span class="ph">' + (o.bac < 0.005 ? '吸収中' : o.bac.toFixed(2) + '%') + '</span></div><div class="lv"><i style="width:' + clamp(o.lvl / 4 * 100, 3, 100) + '%;background:#d8f060"></i></div></div>'; return; }
    html += '<div class="rm-chip"><img src="' + ramuneIcon(o.s, 44) + '"><div>' + esc(o.s.name.replace('ラムネ', '')) + (o.n > 1 ? '×' + o.n : '') + ' <span class="ph">' + o.ph + '</span></div><div class="lv"><i style="width:' + clamp(o.lvl * 70, 3, 100) + '%;background:' + CLASSES[o.s.cls].col + '"></i></div></div>';
  });
  HUD.fx.innerHTML = html;
  // feelings bars
  var fl = dominantFeelings(B, 4), cols = { ps: '#b46bff', st: '#30c8ff', se: '#6a7dff', pa: '#ffb347', di: '#7af0c8', de: '#8a8a9a', em: '#ff5fa8', an: '#ff3355', na: '#9be15d', eu: '#ffe14d', drunk: '#d8f060' };
  HUD.feel.innerHTML = fl.map(function (f) { return '<div><div class="b"><i style="width:' + clamp(f[1] / 1.6 * 100, 4, 100) + '%;background:' + cols[f[0]] + '"></i></div>' + EFFECT_NAMES[f[0]] + '</div>'; }).join('');
  // phone screen texture on table
  drawPhoneScreen(fmtClock(GAME.clock), false);
}
function updateFocusUI(it) {
  HUD.cross.className = 'rm-cross' + (it ? ' on' : '');
  if (it) { HUD.focus.style.display = ''; HUD.focus.textContent = it.label; HUD.bAct.className = 'btn act'; HUD.bAct.innerHTML = it.verb.replace(' / ', '<br>'); }
  else { HUD.focus.style.display = 'none'; HUD.bAct.className = 'btn act off'; HUD.bAct.textContent = 'しらべる'; }
}

// ---- modal helpers ---------------------------------------------------------------
var MODAL = null;
function openModal(title, buildFn, opts) {
  closeModal(true);
  opts = opts || {};
  var m = el('div', 'rm-modal', '', UI);
  var sh = el('div', 'rm-sheet', '', m);
  var h = el('h2', '', esc(title) + '<button class="btn x" style="padding:6px 12px">✕</button>', sh);
  onTap(h.querySelector('.x'), function () { closeModal(); });
  onTap(m, function (e) { if (e.target === m) closeModal(); });
  var body = el('div', 'rm-scroll', '', sh);
  MODAL = { el: m, body: body, sheet: sh, title: h, onClose: opts.onClose };
  buildFn(body, MODAL);
  GAME.paused = true; INPUT.enabled = false; INPUT.mx = INPUT.mz = 0; INPUT.stick = null; INPUT.stickEl.style.display = 'none';
  if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
  sfx('ui');
  return MODAL;
}
function closeModal(silent) {
  if (!MODAL) return;
  var m = MODAL; MODAL = null;
  if (m.el.parentNode) m.el.parentNode.removeChild(m.el);
  if (m.onClose) m.onClose();
  if (GAME.mode === 'play') { GAME.paused = false; INPUT.enabled = true; }
  if (!silent) sfx('click');
}
function setModalTitle(t) { if (MODAL) MODAL.title.firstChild.nodeValue = t; }

// ---- pill menu ------------------------------------------------------------------
function stockOf(id) { return SAVE.settings.sandbox ? 99 : (GAME.stash[id] || 0); }
function openPillMenu() {
  openModal('ラムネケース', function (body) { renderPillGrid(body); });
}
function renderPillGrid(body) {
  setModalTitle('ラムネケース');
  body.innerHTML = '';
  var g = el('div', 'rm-grid', '', body);
  SUBS.forEach(function (s) {
    if (s.hidden) return;
    var n = stockOf(s.id), cl = CLASSES[s.cls];
    var c = el('div', 'rm-card' + (n <= 0 ? ' empty' : ''), '<span class="cl" style="background:' + cl.col + '">' + cl.short + '</span><img src="' + ramuneIcon(s, 104) + '"><div class="nm">' + esc(s.name) + '</div><div class="st">' + (SAVE.settings.sandbox ? '∞' : 'のこり ' + n) + '</div>', g);
    onTap(c, function () { sfx('ui'); renderPillDetail(body, s); });
  });
  el('div', 'rm-note', '※ すべて架空のラムネです。カードをタップすると説明が見られます。', body);
}
function timeText(m) { return m < 60 ? Math.round(m) + '分' : (m / 60).toFixed(m < 180 ? 1 : 0).replace('.0', '') + '時間'; }
function predictedCombos(s) {
  // which combos would likely trigger if taken now (only ones the player already knows)
  var B = GAME.B, out = [];
  COMBOS.forEach(function (cb) {
    if (cb.special || !SAVE.seenCombos[cb.id]) return;
    var ok = true, involves = false;
    cb.need.forEach(function (nd) {
      var lvlNow = nd.s ? (B.Ls[nd.s] || 0) : nd.distinct ? (B.L[nd.distinct] || 0) : (B.L[nd.c] || 0);
      var willAdd = nd.s ? nd.s === s.id : nd.distinct ? s.cls === nd.distinct : s.cls === nd.c;
      if (willAdd) involves = true;
      if (!willAdd && lvlNow < 0.25 && !(nd.c && pendingClass(nd.c))) ok = false;
    });
    if (ok && involves) out.push(cb);
  });
  return out;
}
function pendingClass(c) { // taken recently but not kicked in yet
  return GAME.B.doses.some(function (d) { var s = SUB[d.s]; return s.cls === c && d.t < s.pk; }) || (c === 'alc' && GAME.B.stom > 0.2);
}
function renderPillDetail(body, s) {
  setModalTitle(s.name);
  var cl = CLASSES[s.cls], n = stockOf(s.id), B = GAME.B;
  body.innerHTML = '';
  var d = el('div', 'rm-detail', '', body);
  el('div', 'hd', '<img src="' + ramuneIcon(s, 168) + '"><div><div class="t">' + esc(s.name) + '</div><span class="c" style="background:' + cl.col + '">' + cl.icon + ' ' + esc(cl.name) + '</span></div>', d);
  el('p', '', esc(s.desc), d);
  el('div', 'rm-kv', '<span>効きはじめ</span><b>約 ' + timeText(s.on) + '</b><span>ピーク</span><b>' + timeText(s.pk) + ' 〜 ' + timeText(s.pl) + '</b><span>効き目の長さ</span><b>約 ' + timeText(s.du) + '</b><span>手持ち</span><b>' + (SAVE.settings.sandbox ? '∞（サンドボックス）' : n + ' 個') + '</b>', d);
  var taken = B.doses.filter(function (x) { return x.s === s.id; }).length;
  var warn = [];
  if (taken > 0) warn.push('すでに ' + taken + ' 個飲んでいる。効く前に重ねると強く効きすぎることがある。');
  predictedCombos(s).forEach(function (cb) { if (cb.danger >= 2) warn.push('いま飲むと「' + cb.name + '」になりそう（' + ['安全', '注意', '危険', '命にかかわる'][cb.danger] + '）'); });
  if (warn.length) el('div', 'rm-alert', '⚠ ' + warn.map(esc).join('<br>⚠ '), d);
  var row = el('div', 'rm-row', '', d);
  var back = el('button', 'btn ghost', '← もどる', row); onTap(back, function () { sfx('ui'); renderPillGrid(body); });
  var take = el('button', 'btn pri', '飲む', row); take.style.flex = '1';
  if (n <= 0) { take.disabled = true; take.textContent = 'もうない'; }
  onTap(take, function () { if (stockOf(s.id) <= 0) return; closeModal(true); actTakePill(s.id); });
}

// ---- drink menu ------------------------------------------------------------------
function openDrinkMenu() {
  sfx('fridge');
  openModal('冷蔵庫', function (body) {
    var l = el('div', 'rm-list', '', body);
    DRINKS.forEach(function (d) {
      var n = SAVE.settings.sandbox ? 99 : (GAME.stash[d.id] || 0);
      var it = el('div', 'rm-item' + (n <= 0 ? ' lock' : ''), '<img src="' + canIcon(d, 88) + '"><div class="tx"><b>' + esc(d.name) + ' <span style="opacity:.6;font-size:12px">' + esc(d.sub) + '</span></b><small>' + esc(d.desc) + '</small></div>', l);
      var b = el('button', 'btn', n > 0 ? '飲む<br><small style="font-weight:500;opacity:.7">のこり' + (SAVE.settings.sandbox ? '∞' : n) + '</small>' : 'ない', it);
      if (n <= 0) b.disabled = true;
      onTap(b, function () { closeModal(true); actDrink(d.id); });
    });
    el('div', 'rm-note', '※ ZER9 は架空のお酒です。お酒は20歳になってから。水はキッチンの蛇口で飲めます。', body);
  });
}

// ---- bed ------------------------------------------------------------------------
function openBedMenu() {
  var B = GAME.B;
  openModal('ベッド', function (body) {
    var d = el('div', 'rm-detail', '', body);
    el('p', '', 'ふかふかのベッド。少し横になって休むか、このまま朝まで眠ってしまうか。', d);
    if (B.rr < 10.5 || B.bac > 0.2 || B.danger > 0 || (B.F.se > 1.2 && (B.L.op || 0) > 0.3)) el('div', 'rm-alert', '⚠ 呼吸が浅い・飲みすぎ・強い鎮静のときに眠ってしまうのはとても危険。', d);
    var b1 = el('button', 'btn', '30分だけ横になる', d); onTap(b1, function () { closeModal(true); startRest(30); });
    var b2 = el('button', 'btn pri', '朝まで眠る', d); onTap(b2, function () { closeModal(true); startRest(9999); });
    var b3 = el('button', 'btn ghost', 'やめる', d); onTap(b3, function () { closeModal(); });
  });
}

// ---- phone ----------------------------------------------------------------------
var PHONE_TAB = 'body';
function openPhone(tab) {
  if (tab) PHONE_TAB = tab;
  openModal('スマホ', function (body, M) {
    var tabs = el('div', 'rm-tabs', '', M.sheet); M.sheet.insertBefore(tabs, body);
    var defs = [['body', '🫀 からだ'], ['zukan', '🍬 ラムネ図鑑'], ['combo', '🧪 飲み合わせ'], ['help', '🚑 たすけ'], ['set', '⚙ 設定']];
    if (GAME.mode !== 'play') defs = defs.filter(function (d) { return d[0] !== 'body' && d[0] !== 'help'; });
    if (!defs.some(function (d) { return d[0] === PHONE_TAB; })) PHONE_TAB = defs[0][0];
    function render() {
      tabs.innerHTML = '';
      defs.forEach(function (d) { var t = el('div', 'rm-tab' + (PHONE_TAB === d[0] ? ' on' : ''), d[1], tabs); onTap(t, function () { PHONE_TAB = d[0]; sfx('ui'); render(); }); });
      body.innerHTML = '';
      ({ body: phoneBody, zukan: phoneZukan, combo: phoneCombo, help: phoneHelp, set: phoneSettings })[PHONE_TAB](body);
    }
    render();
  });
}
function phoneBody(body) {
  var B = GAME.B;
  el('div', 'rm-big', '<div><b>' + Math.round(B.hr) + '</b><span>心拍（回/分）</span></div><div><b>' + B.tp.toFixed(1) + '℃</b><span>体温</span></div><div><b>' + B.rr.toFixed(1) + '</b><span>呼吸（回/分）</span></div><div><b>' + Math.round(B.con) + '%</b><span>意識</span></div><div><b>' + Math.round(B.hyd * 100) + '%</b><span>水分</span></div><div><b>' + (B.bac * 100 / 100).toFixed(3) + '%</b><span>血中アルコール（架空）</span></div>', body);
  var cv = el('canvas', 'rm-graph', '', body); cv.width = 600; cv.height = 180; cv.style.marginTop = '10px';
  drawHistory(cv);
  el('div', 'rm-note', '— 心拍（ピンク）・体温（オレンジ）・呼吸（水色）・危険度（赤）の記録', body).style.marginTop = '4px';
  var l = el('div', 'rm-list', '', body); l.style.marginTop = '10px';
  var arr = activeDoseSummary(B);
  if (!arr.length) el('div', 'rm-item', '<div class="tx"><b>いまは何も効いていない</b><small>シラフ。ラムネケースや冷蔵庫をしらべてみよう。</small></div>', l);
  arr.forEach(function (o) {
    if (o.alc) { el('div', 'rm-item', '<img src="' + canIcon(DRINK.z9lemon, 88) + '"><div class="tx"><b>お酒 ' + (o.ph ? '（' + o.ph + '）' : '') + '</b><small>今夜 ' + B.stats.cans + ' 缶。' + (B.bac > 0.2 ? '完全に飲みすぎ。' : B.bac > 0.1 ? 'かなり酔っている。' : B.bac > 0.04 ? 'ほろ酔い。' : 'ほんのり。') + '</small></div>', l); return; }
    el('div', 'rm-item', '<img src="' + ramuneIcon(o.s, 88) + '"><div class="tx"><b>' + esc(o.s.name) + (o.n > 1 ? ' ×' + o.n : '') + '（' + o.ph + '）</b><small>' + esc(CLASSES[o.s.cls].name) + ' ・ 飲んでから ' + timeText(o.t) + '</small></div>', l);
  });
  var act = B.found.length ? B.found.map(function (id) { return COMBO[id].name; }).join('、') : 'まだなし';
  el('div', 'rm-note', '今夜見つけた飲み合わせ：' + esc(act), body);
}
function drawHistory(cv) {
  var g = cv.getContext('2d'), H = GAME.hist, w = cv.width, h = cv.height;
  g.clearRect(0, 0, w, h);
  if (H.length < 2) return;
  function line(key, lo, hi, col) {
    g.strokeStyle = col; g.lineWidth = 3; g.beginPath();
    H.forEach(function (p, i) { var x = i / (H.length - 1) * w, y = h - clamp((p[key] - lo) / (hi - lo), 0, 1) * (h - 8) - 4; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.stroke();
  }
  line('hr', 40, 220, '#ff5fa8'); line('tp', 35.5, 42, '#ff9f1c'); line('rr', 0, 30, '#7df9ff'); line('d', 0, 100, '#ff1744');
}
function phoneZukan(body) {
  var seen = Object.keys(SAVE.seenSubs).length, total = SUBS.filter(function (s) { return !s.hidden; }).length;
  el('div', 'rm-note', '見つけたラムネ ' + seen + ' / ' + total, body).style.margin = '0 0 8px';
  var l = el('div', 'rm-list', '', body);
  SUBS.forEach(function (s) {
    if (s.hidden) return;
    var ok = SAVE.seenSubs[s.id];
    el('div', 'rm-item' + (ok ? '' : ' lock'), '<img src="' + ramuneIcon(s, 88) + '" style="' + (ok ? '' : 'filter:brightness(0) opacity(.5)') + '"><div class="tx"><b>' + (ok ? esc(s.name) : '？？？') + ' <span style="font-size:11px;color:' + CLASSES[s.cls].col + '">' + CLASSES[s.cls].icon + esc(CLASSES[s.cls].short) + '</span></b><small>' + (ok ? esc(s.desc) + '<br>効きはじめ 約' + timeText(s.on) + ' ／ 長さ 約' + timeText(s.du) : 'まだ飲んだことがない') + '</small></div>', l);
  });
}
function phoneCombo(body) {
  var seen = Object.keys(SAVE.seenCombos).length;
  el('div', 'rm-note', '見つけた飲み合わせ ' + seen + ' / ' + COMBOS.length + '　（色：<span class="dg0">安全</span>・<span class="dg1">注意</span>・<span class="dg2">危険</span>・<span class="dg3">命にかかわる</span>）', body).style.margin = '0 0 8px';
  var l = el('div', 'rm-list', '', body);
  COMBOS.forEach(function (cb) {
    var ok = SAVE.seenCombos[cb.id];
    el('div', 'rm-item' + (ok ? '' : ' lock'), '<div class="tx"><b class="dg' + cb.danger + '">' + (ok ? '🧪 ' + esc(cb.name) : '？？？') + '</b><small>' + esc(cb.hint) + (ok ? '<br>' + esc(cb.desc) : '') + '</small></div>', l);
  });
}
function phoneHelp(body) {
  var d = el('div', 'rm-detail', '', body);
  el('p', '', '具合がおかしいとき、だれかが倒れているときは、ためらわずに助けを呼ぼう。<b>このゲームの中でも、現実でも。</b>', d);
  el('div', 'rm-kv', '<span>呼吸が弱い</span><b>リセットラムネ（ぬくぬく系だけに効く）／119</b><span>体温が高い</span><b>水を飲む・ベランダで風にあたる</b><span>吐き気</span><b>トイレで吐く（飲んだばかりなら体に入る量も減る）</b><span>心拍が速い</span><b>じっと休む・水を飲む</b>', d);
  var b = el('button', 'btn warn', '📞 119に電話する（今夜はここで終わり）', d);
  onTap(b, function () { closeModal(true); endNight('ambulance'); });
  el('div', 'rm-note', '現実で困ったとき：救急車 119／迷ったら 救急安心センター #7119（地域による）', body);
}
function phoneSettings(body) {
  var S = SAVE.settings;
  function slider(label, key, min, max, step, cb) {
    var r = el('div', 'rm-set', '<span>' + label + '</span>', body);
    var i = el('input', '', null, r); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = S[key];
    i.addEventListener('input', function () { S[key] = parseFloat(i.value); if (cb) cb(); writeSave(); });
    i.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }
  function toggle(label, key, cb) {
    var r = el('div', 'rm-set', '<span>' + label + '</span>', body);
    var t = el('div', 'rm-tog' + (S[key] ? ' on' : ''), '<i></i>', r);
    onTap(t, function () { S[key] = !S[key]; t.className = 'rm-tog' + (S[key] ? ' on' : ''); writeSave(); if (cb) cb(); sfx('click'); });
  }
  slider('音楽', 'bgm', 0, 1, 0.05, auVol); slider('効果音', 'sfx', 0, 1, 0.05, auVol); slider('視点の感度', 'sens', 0.3, 2.5, 0.05);
  toggle('光の点滅・ゆれをおさえる', 'calm');
  toggle('上下の視点を反転', 'invertY');
  toggle('サンドボックス（ラムネ・お酒が無限）', 'sandbox');
  var r = el('div', 'rm-set', '<span>画質</span>', body), seg = el('div', 'rm-seg', '', r);
  ['AUTO', 'LOW', 'MEDIUM', 'HIGH'].forEach(function (q) { var o = el('div', S.quality === q ? 'on' : '', q, seg); onTap(o, function () { S.quality = q; writeSave(); applyQuality(q); Array.prototype.forEach.call(seg.children, function (c) { c.className = c.textContent === q ? 'on' : ''; }); }); });
  if (GAME.mode === 'play') {
    var row = el('div', 'rm-row', '', body); row.style.marginTop = '14px';
    var t1 = el('button', 'btn ghost', 'タイトルへ', row); onTap(t1, function () { closeModal(true); toTitle(); });
  }
  el('div', 'rm-note', 'RAMUNE NIGHT v' + GAME_VERSION + ' ・ すべてフィクションです。', body);
}

// ---- full screens ------------------------------------------------------------------
var SCREEN = null;
function showScreen(html, cls) {
  hideScreen();
  SCREEN = el('div', 'rm-screen ' + (cls || ''), html, UI);
  return SCREEN;
}
function hideScreen() { if (SCREEN && SCREEN.parentNode) SCREEN.parentNode.removeChild(SCREEN); SCREEN = null; }
