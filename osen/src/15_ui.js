// ---- 2000年代前半の無料MMO風 UI -------------------------------------------------------------
// ウィンドウ（石・金属・木のわく、動かせる、重なる、×ボタン）、スロットバー、ログ、ミニマップ、
// ステータス、ツールチップ、頭の上の名前、黄色いシステムメッセージ。町の中身はワードアートのまま。
var H = {};
var UI_CSS = [
  '#os-root{font-family:' + FONT_UI + ';font-size:14px;color:#ece2c6;}',
  '#os-root canvas.ico{image-rendering:pixelated;image-rendering:crisp-edges;}',
  '#os-hud{position:absolute;inset:0;pointer-events:none;}',
  '.pe{pointer-events:auto;}',
  // ---- ウィンドウ ----
  '.ow{position:absolute;z-index:20;padding:7px;min-width:200px;pointer-events:auto;display:flex;flex-direction:column;',
  ' background:linear-gradient(135deg,#8c7656 0%,#5a4632 22%,#3c2e20 50%,#5e4a34 78%,#8a7252 100%);',
  ' border:1px solid #0c0804;box-shadow:inset 1px 1px 0 #f2d9a2,inset -1px -1px 0 #1a1006,inset 0 0 0 3px #3a2a18,inset 0 0 0 4px #b89458,0 6px 18px rgba(0,0,0,.65);}',
  '.ow.stone{background:repeating-linear-gradient(0deg,#6e7076 0 9px,#5a5c62 9px 10px),linear-gradient(#77797f,#4c4e54);box-shadow:inset 1px 1px 0 #c8cad0,inset -1px -1px 0 #202226,inset 0 0 0 3px #3c3e44,inset 0 0 0 4px #9ea2aa,0 6px 18px rgba(0,0,0,.65);}',
  '.ow.wood{background:repeating-linear-gradient(90deg,#7a4e26 0 13px,#6a421e 13px 15px,#83552b 15px 26px);box-shadow:inset 1px 1px 0 #e0b07a,inset -1px -1px 0 #2a1406,inset 0 0 0 3px #3e2410,inset 0 0 0 4px #c08a50,0 6px 18px rgba(0,0,0,.65);}',
  '.oc{position:absolute;width:13px;height:13px;transform:rotate(45deg);background:radial-gradient(circle at 35% 35%,#fff6c8,#e6b04a 40%,#7a4c10);border:1px solid #2a1806;z-index:2;}',
  '.oc.a{left:-6px;top:-6px}.oc.b{right:-6px;top:-6px}.oc.c{left:-6px;bottom:-6px}.oc.d{right:-6px;bottom:-6px}',
  '.otb{display:flex;align-items:center;gap:6px;height:28px;padding:0 4px 0 6px;margin-bottom:5px;cursor:move;touch-action:none;',
  ' background:linear-gradient(#6e2418,#3a0e08 55%,#24060a);border:1px solid #0a0402;box-shadow:inset 0 1px 0 #c86a50;color:#ffe7a8;text-shadow:1px 1px 0 #000;font-size:15px;letter-spacing:.05em;}',
  '.ow.stone .otb{background:linear-gradient(#34405a,#1a2236 55%,#0e1424);box-shadow:inset 0 1px 0 #7a8cb0;}',
  '.ow.wood .otb{background:linear-gradient(#3a5a26,#1e3612 55%,#10220a);box-shadow:inset 0 1px 0 #8ab070;}',
  '.otb .t{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
  '.ox{width:24px;height:22px;display:flex;align-items:center;justify-content:center;background:linear-gradient(#c84030,#7a160c);border:2px solid;border-color:#ff9a80 #3a0602 #3a0602 #ff9a80;}',
  '.ox:active,.ox.down{border-color:#3a0602 #ff9a80 #ff9a80 #3a0602;transform:translate(1px,1px);}',
  '.obd{flex:1 1 auto;min-height:0;background:rgba(10,12,22,.93);border:1px solid #000;box-shadow:inset 0 0 0 1px #2c3040,inset 0 2px 8px rgba(0,0,0,.8);padding:9px;overflow:auto;-webkit-overflow-scrolling:touch;}',
  '.ow.big{left:3vw!important;right:3vw;top:calc(var(--st) + 54px)!important;max-height:calc(100% - var(--st) - var(--sb) - 130px);display:flex;flex-direction:column;}',
  '.ow.big .obd{flex:1;max-height:none;}',
  // ---- ボタン ----
  '.mb{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:8px 12px;min-height:38px;color:#f4ead2;text-shadow:1px 1px 0 #000;font-size:14px;cursor:pointer;',
  ' background:linear-gradient(#636a7c,#3a3f4c 50%,#2a2e38 51%,#363a46);border:2px solid;border-color:#a8aec0 #121418 #121418 #a8aec0;white-space:nowrap;}',
  '.mb:hover,.mb.hot{filter:brightness(1.18);box-shadow:0 0 6px #ffd56a;}',
  '.mb:active,.mb.down{border-color:#121418 #a8aec0 #a8aec0 #121418;transform:translate(1px,1px);filter:brightness(.9);}',
  '.mb.gold{background:linear-gradient(#b08a3a,#7a5a1a 50%,#5e4410 51%,#6e5218);border-color:#ffe2a0 #2a1a04 #2a1a04 #ffe2a0;color:#fff4d0;}',
  '.mb.red{background:linear-gradient(#a04030,#6a1a10 50%,#4e1008 51%,#5e180e);border-color:#ffb0a0 #2a0602 #2a0602 #ffb0a0;}',
  '.mb.off{opacity:.45;pointer-events:none;}',
  '.mb.sel{background:linear-gradient(#3a6a9a,#1a3a60 50%,#102a4a 51%,#183456);border-color:#a0d0ff #061428 #061428 #a0d0ff;}',
  // ---- ゲージ ----
  '.gg{position:relative;height:12px;background:#0a0a0a;border:1px solid #000;box-shadow:inset 0 1px 3px #000,0 0 0 1px #6a5a40;overflow:hidden;}',
  '.gg i{position:absolute;left:0;top:0;bottom:0;width:0;transition:width .3s;}',
  '.gg i::after{content:"";position:absolute;left:0;right:0;top:0;height:45%;background:rgba(255,255,255,.35);}',
  '.gg b{position:absolute;inset:0;text-align:center;font-size:10px;line-height:12px;color:#fff;text-shadow:1px 1px 0 #000,-1px 0 0 #000;font-weight:normal;}',
  '.gg.pol i{background:linear-gradient(90deg,#4a106a,#a030e0,#ff40ff);}',
  '.gg.pol.over i{background:linear-gradient(90deg,#ff40ff,#40ffff,#ffff40,#ff40ff);background-size:200% 100%;animation:ggo 3s linear infinite;}',
  '@keyframes ggo{to{background-position:200% 0}}',
  '.gg.hp i{background:linear-gradient(90deg,#1a7a1a,#40e040);}',
  // ---- ステータス（左上） ----
  '#os-st{flex-direction:row!important;position:absolute;left:calc(var(--sl) + 6px);top:calc(var(--st) + 6px);width:208px;padding:5px;pointer-events:auto;display:flex;gap:6px;}',
  '#os-st .face{width:50px;height:50px;flex:none;background:#000;border:2px solid;border-color:#c8a050 #3a2a10 #3a2a10 #c8a050;}',
  '#os-st .face canvas{width:100%;height:100%;display:block;}',
  '#os-st .inf{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}',
  '#os-st .nm{font-size:13px;color:#ffe7a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1px 1px 0 #000;}',
  '#os-st .row{display:flex;align-items:center;gap:3px;font-size:10px;}',
  '#os-st .row .gg{flex:1;}',
  '#os-st .ar{font-size:11px;color:#bcd0ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1px 1px 0 #000;}',
  // ---- ミニマップ ----
  '#os-mm{position:absolute;right:calc(var(--sr) + 8px);top:calc(var(--st) + 8px);width:112px;height:112px;border-radius:50%;pointer-events:auto;',
  ' box-shadow:0 0 0 3px #2a1a08,0 0 0 6px #b89458,0 0 0 8px #3a2a10,0 3px 10px 8px rgba(0,0,0,.5);background:#0a1a10;overflow:hidden;}',
  '#os-mm canvas{width:100%;height:100%;display:block;}',
  '#os-mmn{position:absolute;right:calc(var(--sr) + 58px);top:calc(var(--st) + 0px);width:14px;height:16px;margin-right:-7px;text-align:center;font-size:11px;color:#ff5040;text-shadow:1px 1px 0 #000;pointer-events:none;}',
  '#os-time{position:absolute;right:calc(var(--sr) + 8px);top:calc(var(--st) + 128px);width:112px;text-align:center;font-size:11px;color:#ffe7a8;text-shadow:1px 1px 0 #000,-1px 0 0 #000;}',
  // ---- スロットバー ----
  '#os-sb{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--sb) + 4px);display:flex;gap:3px;padding:4px;pointer-events:auto;',
  ' background:linear-gradient(#4a3e30,#2a2018);border:1px solid #000;box-shadow:inset 1px 1px 0 #a08a60,inset -1px -1px 0 #120c06,0 3px 8px rgba(0,0,0,.6);}',
  '.slot{position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%,#2a3040,#0c0e14);',
  ' border:2px solid;border-color:#0a0a0a #6a6050 #6a6050 #0a0a0a;cursor:pointer;}',
  '.slot:active,.slot.down{transform:translate(1px,1px);filter:brightness(1.4);}',
  '.slot:hover{box-shadow:0 0 6px #ffd56a inset;}',
  '.slot .k{position:absolute;left:2px;top:0;font-size:9px;color:#ffe7a8;text-shadow:1px 1px 0 #000;}',
  '.slot .l{position:absolute;left:0;right:0;bottom:-1px;text-align:center;font-size:8px;color:#fff;text-shadow:1px 1px 0 #000,-1px 0 0 #000;white-space:nowrap;}',
  // ---- ログ ----
  '#os-log{position:absolute;left:calc(var(--sl) + 6px);pointer-events:auto;background:rgba(0,0,0,.42);border:1px solid rgba(200,160,80,.5);display:flex;flex-direction:column;}',
  '#os-log .tabs{display:flex;gap:1px;}',
  '#os-log .tab{padding:3px 8px;font-size:11px;background:rgba(40,30,20,.85);color:#bba;border:1px solid #000;cursor:pointer;}',
  '#os-log .tab.on{background:rgba(120,90,40,.95);color:#fff4c8;}',
  '#os-log .tab.min{margin-left:auto;}',
  '#os-log .ls{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:3px 5px;font-size:11px;line-height:1.45;text-shadow:1px 1px 0 #000;}',
  '#os-log .ls div{word-break:break-all;}',
  '#os-log.mini .ls{display:none;}',
  // ---- ツールチップ・名前・システムメッセージ ----
  '#os-tt{position:absolute;max-width:230px;padding:6px 8px;background:rgba(14,10,6,.93);border:1px solid #c8a050;box-shadow:0 0 0 1px #000,2px 2px 6px rgba(0,0,0,.7);font-size:12px;line-height:1.5;pointer-events:none;display:none;z-index:15;}',
  '#os-tt .n{color:#ffe23a;font-size:13px;} #os-tt .s{color:#9ad0ff;} #os-tt .h{color:#9a9;font-size:11px;}',
  '.nmtag{position:absolute;transform:translate(-50%,-100%);white-space:nowrap;font-size:12px;color:#fff;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;pointer-events:none;}',
  '.nmtag.me{color:#ffffff;} .nmtag.npc{color:#ffc0e8;} .nmtag.pc{color:#80f0ff;} .nmtag i{display:block;font-style:normal;font-size:10px;color:#ffe7a8;text-align:center;}',
  '.bub{position:absolute;transform:translate(-50%,-100%);max-width:200px;padding:4px 7px;background:#fffef0;color:#222;border:1px solid #333;border-radius:6px;font-family:' + FONT_SUB + ';font-size:12px;pointer-events:none;}',
  '.bub::after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-5px;border:5px solid transparent;border-top-color:#fffef0;border-bottom:0;}',
  '#os-sys{position:absolute;left:0;right:0;top:34%;display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none;}',
  '#os-sys div{font-size:15px;color:#ffe23a;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,0 0 6px #000;animation:sysm 3.6s forwards;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis;}',
  '@keyframes sysm{0%{opacity:0;transform:translateY(8px)}10%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}',
  // ---- 操作ボタン（スマホ） ----
  '.ab{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:50%;pointer-events:auto;touch-action:none;color:#fff4d0;text-shadow:1px 1px 0 #000;font-size:12px;',
  ' background:radial-gradient(circle at 40% 30%,#8a90a0,#4a505e 55%,#22262e);border:3px solid #b89458;box-shadow:0 0 0 2px #1a1008,0 4px 6px rgba(0,0,0,.6),inset 0 2px 3px rgba(255,255,255,.35);}',
  '.ab.down{transform:translateY(2px) scale(.95);filter:brightness(1.3);box-shadow:0 0 0 2px #1a1008,0 0 10px #ffd56a;}',
  '.ab.main{background:radial-gradient(circle at 40% 30%,#e0a050,#a05a10 55%,#5a2a04);}',
  '.ab.main.ready{box-shadow:0 0 0 2px #1a1008,0 0 14px 3px #ffe23a;}',
  '.ab .ico{width:26px;height:26px;}',
  '#os-hold{position:absolute;display:none;gap:4px;flex-wrap:wrap;justify-content:flex-end;pointer-events:none;}',
  '#os-hold .ab{position:relative;width:52px;height:52px;border-radius:8px;font-size:10px;}',
  '#os-stick{position:absolute;width:124px;height:124px;border-radius:50%;pointer-events:auto;touch-action:none;background:radial-gradient(circle,rgba(0,0,0,.15) 0 58%,rgba(200,160,80,.35) 59% 62%,rgba(0,0,0,.2) 63%);border:2px solid rgba(200,160,80,.7);}',
  '#os-stick i{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:radial-gradient(circle at 40% 30%,#f0d8a0,#b08040 55%,#5a3a10);border:2px solid #1a1008;box-shadow:0 3px 4px rgba(0,0,0,.5);}',
  '#os-cross{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;pointer-events:none;}',
  // ---- Movie Maker 風の字幕（町のイベント用） ----
  '#os-cap{position:absolute;left:50%;transform:translateX(-50%);text-align:center;white-space:pre-wrap;font:22px ' + FONT_SUB + ';line-height:1.35;max-width:92vw;pointer-events:none;',
  ' text-shadow:2px 0 0 #000,-2px 0 0 #000,0 2px 0 #000,0 -2px 0 #000,2px 2px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,3px 3px 2px rgba(0,0,0,.6);}',
  '#os-cap .ln{display:inline-block;} #os-cap.w{color:#fff;} #os-cap.y{color:#fff21a;}',
  '#os-cap2{position:absolute;left:50%;transform:translateX(-50%);text-align:center;white-space:pre-wrap;font:18px ' + FONT_SUB + ';color:#9ff;max-width:92vw;pointer-events:none;text-shadow:2px 0 0 #000,-2px 0 0 #000,0 2px 0 #000,0 -2px 0 #000,2px 2px 0 #000,-2px -2px 0 #000;}',
  '.os-wa{position:absolute;pointer-events:none;transform-origin:center;will-change:transform,opacity;}',
  '@keyframes waPop{0%{transform:translate(-50%,-50%) scale(.1) rotate(-25deg);opacity:0}15%{transform:translate(-50%,-50%) scale(1.15) rotate(4deg);opacity:1}25%{transform:translate(-50%,-50%) scale(1) rotate(0)}85%{opacity:1}100%{transform:translate(-50%,-80%) scale(1.05);opacity:0}}',
  '@keyframes waSpin{0%{transform:translate(-50%,-50%) scale(0) rotate(-540deg);opacity:0}25%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1}80%{transform:translate(-50%,-50%) scale(1.05) rotate(0);opacity:1}100%{transform:translate(-50%,-50%) scale(2.5) rotate(20deg);opacity:0}}',
  '@keyframes waSlide{0%{transform:translate(-160%,-50%);opacity:0}18%{transform:translate(-50%,-50%);opacity:1}82%{transform:translate(-50%,-50%);opacity:1}100%{transform:translate(60%,-50%);opacity:0}}',
  '@keyframes waFloat{0%{transform:translate(-50%,-50%) scale(.6);opacity:0}20%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{transform:translate(-50%,-160%) scale(1.1) rotate(8deg);opacity:0}}',
  '@keyframes waSoft{0%{opacity:0}20%{opacity:1}80%{opacity:1}100%{opacity:0}}',
  '@keyframes capFade{0%{opacity:0}12%{opacity:1}88%{opacity:1}100%{opacity:0}}',
  '@keyframes capFlyL{0%{transform:translateX(-80vw);opacity:0}15%{transform:translateX(0);opacity:1}88%{opacity:1}100%{opacity:0}}',
  '@keyframes capFlyR{0%{transform:translateX(80vw);opacity:0}15%{transform:translateX(0);opacity:1}88%{opacity:1}100%{opacity:0}}',
  '@keyframes capZoom{0%{transform:scale(.2);opacity:0}15%{transform:scale(1.08);opacity:1}22%{transform:scale(1)}88%{opacity:1}100%{opacity:0}}',
  '@keyframes capDrop{0%{transform:translateY(-40px);opacity:0}15%{transform:translateY(0);opacity:1}88%{opacity:1}100%{transform:translateY(10px);opacity:0}}',
  '@keyframes capWave{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
  '.os-flare{position:absolute;pointer-events:none;mix-blend-mode:screen;opacity:0;}',
  // ---- 中身の部品 ----
  '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:3px;}',
  '.cell{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%,#232838,#0a0c12);border:2px solid;border-color:#050505 #4a4434 #4a4434 #050505;cursor:pointer;}',
  '.cell.sel{border-color:#ffe23a;box-shadow:0 0 6px #ffe23a inset;} .cell .ico{width:80%;height:80%;}',
  '.cell .q{position:absolute;right:2px;bottom:0;font-size:10px;color:#fff;text-shadow:1px 1px 0 #000;}',
  '.row2{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}',
  '.kv{display:flex;justify-content:space-between;gap:8px;padding:4px 2px;border-bottom:1px dotted #4a4434;font-size:13px;}',
  '.kv b{color:#ffe7a8;font-weight:normal;}',
  '.desc{font-family:' + FONT_SUB + ';font-size:13px;line-height:1.7;color:#e8e0cc;padding:6px;background:rgba(0,0,0,.35);border:1px solid #2a2a2a;margin-top:6px;}',
  '.hd{color:#ffd56a;font-size:14px;margin:6px 0 4px;border-bottom:1px solid #5a4a2a;}',
  '.list{display:flex;flex-direction:column;gap:3px;}',
  '.li{padding:8px;background:linear-gradient(#262a36,#181b24);border:1px solid #000;box-shadow:inset 0 1px 0 #3a4050;cursor:pointer;font-size:13px;}',
  '.li:hover,.li.hot{background:linear-gradient(#3a3020,#241c10);box-shadow:inset 0 0 0 1px #c8a050;}',
  '.li.sel{background:linear-gradient(#4a3a14,#2a1e08);box-shadow:inset 0 0 0 1px #ffe23a;color:#fff4c8;}',
  '.tabs2{display:flex;gap:2px;flex-wrap:wrap;margin-bottom:6px;}',
  '.tabs2 .mb{min-height:30px;padding:4px 8px;font-size:12px;}'
].join('\n');

// ---- ボタンの押し方（さわると光る・押すとへこむ・音） -------------------------------------
function tapBtn(e, fn, snd) {
  var down = function (ev) { ev.preventDefault(); ev.stopPropagation(); audioInit(); e.classList.add('down'); };
  var up = function (ev) { if (!e.classList.contains('down')) return; e.classList.remove('down'); ev.preventDefault(); ev.stopPropagation(); sfx(snd || 'uiClick'); fn(ev); };
  e.addEventListener('touchstart', down, { passive: false }); e.addEventListener('touchend', up, { passive: false });
  e.addEventListener('touchcancel', function () { e.classList.remove('down'); });
  e.addEventListener('mousedown', down); e.addEventListener('mouseup', up); e.addEventListener('mouseleave', function () { e.classList.remove('down'); });
  return e;
}
function holdBtn(e, fn, rel) {
  e.addEventListener('touchstart', function (ev) { ev.preventDefault(); ev.stopPropagation(); audioInit(); e.classList.add('down'); fn(); }, { passive: false });
  e.addEventListener('touchend', function (ev) { ev.preventDefault(); e.classList.remove('down'); if (rel) rel(); }, { passive: false });
  e.addEventListener('mousedown', function (ev) { ev.stopPropagation(); audioInit(); e.classList.add('down'); fn(); });
  e.addEventListener('mouseup', function () { e.classList.remove('down'); if (rel) rel(); });
  return e;
}
function mbtn(parent, label, fn, cls, icon) {
  var b = el('div', 'mb pe' + (cls ? ' ' + cls : ''), parent);
  if (icon) b.appendChild(iconEl(uiIcon(icon), 20));
  var s = el('span', '', b); s.innerHTML = cnHTML(label);
  if (fn) tapBtn(b, fn); return b;
}
// ---- ウィンドウ ---------------------------------------------------------------------------
var WIN = { list: {}, z: 30 };
function isNarrow() { return (H.W || window.innerWidth) < 640 || (H.H || window.innerHeight) < 430; }
function openWin(id, title, icon, build, o) {
  o = o || {};
  var w = WIN.list[id];
  if (isNarrow()) Object.keys(WIN.list).forEach(function (k) { if (k !== id && WIN.list[k].open && !WIN.list[k].o.keep) closeWin(k, true); });
  if (!w) {
    var e = el('div', 'ow ' + (o.theme || ''), UI);
    ['a', 'b', 'c', 'd'].forEach(function (k) { el('span', 'oc ' + k, e); });
    var tb = el('div', 'otb', e); tb.appendChild(iconEl(uiIcon(icon || 'info'), 20));
    var t = el('div', 't', tb); t.innerHTML = cnHTML(title);
    var x = el('div', 'ox pe', tb); x.appendChild(iconEl(uiIcon('close'), 14));
    var bd = el('div', 'obd os-scroll', e);
    w = WIN.list[id] = { id: id, el: e, bd: bd, title: t, o: o, open: false, build: build };
    tapBtn(x, function () { closeWin(id); }, 'uiClose');
    e.addEventListener('mousedown', function () { focusWin(w); }); e.addEventListener('touchstart', function () { focusWin(w); }, { passive: true });
    dragWin(w, tb);
    e.style.width = (o.w || 320) + 'px';
    var W = H.W || window.innerWidth, Hh = H.H || window.innerHeight, n = Object.keys(WIN.list).length;
    e.style.left = Math.max(8, Math.min(W - (o.w || 320) - 8, (W - (o.w || 320)) / 2 + (n % 4) * 24 - 36)) + 'px';
    e.style.top = Math.max(60, Math.min(Hh * 0.5, Hh * 0.14 + (n % 4) * 22)) + 'px';
  }
  w.el.classList.toggle('big', isNarrow());
  if (!isNarrow() && o.h) w.bd.style.maxHeight = o.h + 'px';
  w.bd.innerHTML = ''; w.build = build || w.build; w.build(w.bd, w);
  w.el.style.display = ''; w.open = true; focusWin(w);
  sfx('uiOpen'); updatePause();
  return w;
}
function closeWin(id, silent) { var w = WIN.list[id]; if (!w || !w.open) return; w.el.style.display = 'none'; w.open = false; if (!silent) sfx('uiClose'); if (w.o.onClose) w.o.onClose(); updatePause(); }
function toggleWin(id, title, icon, build, o) { var w = WIN.list[id]; if (w && w.open) closeWin(id); else openWin(id, title, icon, build, o); }
function refreshWin(id) { var w = WIN.list[id]; if (w && w.open) { var st = w.bd.scrollTop; w.bd.innerHTML = ''; w.build(w.bd, w); w.bd.scrollTop = st; } }
function focusWin(w) { w.el.style.zIndex = ++WIN.z; }
function anyWinOpen() { for (var k in WIN.list) if (WIN.list[k].open && !WIN.list[k].o.nopause) return true; return false; }
function updatePause() { G.paused = G.inMenu || anyWinOpen() && isNarrow(); }
function dragWin(w, handle) {
  var sx, sy, ox, oy, on = false;
  function start(x, y) { if (w.el.classList.contains('big')) return; on = true; sx = x; sy = y; ox = w.el.offsetLeft; oy = w.el.offsetTop; focusWin(w); }
  function move(x, y) { if (!on) return; var W = H.W, Hh = H.H; w.el.style.left = clamp(ox + x - sx, -w.el.offsetWidth + 60, W - 60) + 'px'; w.el.style.top = clamp(oy + y - sy, 0, Hh - 40) + 'px'; }
  handle.addEventListener('touchstart', function (e) { if (e.target.closest('.ox')) return; e.preventDefault(); var t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: false });
  handle.addEventListener('touchmove', function (e) { e.preventDefault(); var t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: false });
  handle.addEventListener('touchend', function () { on = false; });
  handle.addEventListener('mousedown', function (e) { if (e.target.closest('.ox')) return; start(e.clientX, e.clientY); e.preventDefault(); });
  window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
  window.addEventListener('mouseup', function () { on = false; });
}

// ---- HUD ---------------------------------------------------------------------------------
var SLOTS = [
  { k: '1', icon: 'bag', l: 'カバン', fn: function () { openBag(); } },
  { k: '2', icon: 'book', l: '図鑑', fn: function () { openZukan(); } },
  { k: '3', icon: 'status', l: 'ステータス', fn: function () { openStatus(); } },
  { k: '4', icon: 'chat', l: '定型文', fn: function () { openPhrases(); } },
  { k: '5', icon: 'stamp', l: 'スタンプ', fn: function () { openStamps(); } },
  { k: '6', icon: 'gesture', l: '身ぶり', fn: function () { openGestures(); } },
  { k: '7', icon: 'skill', l: 'とくぎ', fn: function () { useSkill(); } },
  { k: '8', icon: 'gear', l: '設定', fn: function () { openSettings(); } }
];
function initUI() {
  IN.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var st = document.createElement('style'); st.textContent = UI_CSS; (document.head || document.documentElement).appendChild(st);
  var hud = H.hud = el('div', '', UI); hud.id = 'os-hud';
  H.flares = el('div', '', hud);
  H.tags = el('div', '', hud); H.tags.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  H.wa = el('div', '', hud); H.wa.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  H.cross = el('canvas', '', hud); H.cross.id = 'os-cross'; H.cross.width = H.cross.height = 80; drawCross(false);
  H.tt = el('div', '', hud); H.tt.id = 'os-tt';
  H.cap = el('div', 'w', hud); H.cap.id = 'os-cap';
  H.cap2 = el('div', '', hud); H.cap2.id = 'os-cap2';
  H.sys = el('div', '', hud); H.sys.id = 'os-sys';
  // ステータス
  var s = H.st = el('div', 'ow', hud); s.id = 'os-st'; s.style.minWidth = '0';
  var face = el('div', 'face', s); H.face = el('canvas', '', face); H.face.width = H.face.height = 96;
  var inf = el('div', 'inf', s);
  H.stName = el('div', 'nm', inf);
  var r1 = el('div', 'row', inf); r1.appendChild(iconEl(uiIcon('pollution'), 14)); H.gPol = el('div', 'gg pol', r1); el('i', '', H.gPol); el('b', '', H.gPol);
  var r2 = el('div', 'row', inf); r2.appendChild(iconEl(uiIcon('genki'), 14)); H.gHp = el('div', 'gg hp', r2); el('i', '', H.gHp); el('b', '', H.gHp);
  H.stArea = el('div', 'ar', inf);
  tapBtn(s, function () { openStatus(); });
  // ミニマップ
  var mm = el('div', '', hud); mm.id = 'os-mm'; H.mm = el('canvas', '', mm); H.mm.width = H.mm.height = 224;
  H.mmN = el('div', '', hud); H.mmN.id = 'os-mmn'; H.mmN.textContent = 'N';
  H.time = el('div', '', hud); H.time.id = 'os-time';
  tapBtn(mm, function () { openMapWin(); });
  // スロットバー
  var sb = H.sb = el('div', '', hud); sb.id = 'os-sb';
  SLOTS.forEach(function (sl) { var e = el('div', 'slot', sb); e.appendChild(iconEl(uiIcon(sl.icon), 28)); el('span', 'k', e, sl.k); el('span', 'l', e).innerHTML = cnHTML(sl.l); tapBtn(e, sl.fn, 'uiSlot'); sl.el = e; });
  // ログ
  var lg = H.log = el('div', '', hud); lg.id = 'os-log';
  var tabs = el('div', 'tabs', lg); H.logTab = 'all'; H.logLines = [];
  [['all', '全体'], ['sys', 'システム'], ['talk', '会話']].forEach(function (t) { var e = el('div', 'tab' + (t[0] === 'all' ? ' on' : ''), tabs, t[1]); tapBtn(e, function () { H.logTab = t[0]; [].forEach.call(tabs.children, function (c2) { c2.classList.remove('on'); }); e.classList.add('on'); renderLog(); }); });
  var mn = el('div', 'tab min', tabs, '－'); tapBtn(mn, function () { lg.classList.toggle('mini'); mn.textContent = lg.classList.contains('mini') ? '＋' : '－'; });
  H.logList = el('div', 'ls os-scroll', lg);
  // 操作ボタン（スマホ）
  STICK.el = el('div', 'pe', hud); STICK.el.id = 'os-stick'; STICK.knob = el('i', '', STICK.el);
  H.bMain = abtn('main', 'さわる', 'touch', function () { IN.main = true; });
  H.bJump = abtn('', 'ジャンプ', 'jump', function () { IN.jump = true; });
  H.bRun = abtn('', '走る', 'run', function () { IN.run = !IN.run; updateRunBtn(); });
  H.bSkill = abtn('', 'とくぎ', 'skill', function () { useSkill(); });
  H.bSub = abtn('', 'いじる', 'special', function () { IN.special = true; });
  H.bTouch2 = abtn('', 'さわる', 'touch', function () { IN.touch2 = true; });
  H.hold = el('div', '', hud); H.hold.id = 'os-hold';
  H.holdBtns = [['throw', '投げる', function () { IN.throwIt = true; }], ['rotate', '回す', function () { IN.rotate = true; }], ['bigger', '大きく', function () { IN.bigger = true; }],
    ['smaller', '小さく', function () { IN.smaller = true; }], ['store', 'しまう', function () { IN.store = true; }], ['special', 'いじる', function () { IN.special = true; }]].map(function (b) {
    var e = el('div', 'ab', H.hold); e.appendChild(iconEl(uiIcon(b[0]), 22)); el('span', '', e).innerHTML = cnHTML(b[1]); holdBtn(e, b[2]); return e;
  });
  initFlares();
  layoutUI();
  logMsg('sys', 'ようこそ　精神汚染オンラインへ。チャンネルに　接続しました（してない）。');
}
function abtn(cls, label, icon, fn) {
  var e = el('div', 'ab ' + cls, H.hud); e.appendChild(iconEl(uiIcon(icon), cls === 'main' ? 32 : 24)); var s = el('span', '', e); s.innerHTML = cnHTML(label); e._lab = s; holdBtn(e, fn); return e;
}
function setMainBtn(label, icon) { if (H.bMain._l === label) return; H.bMain._l = label; H.bMain.innerHTML = ''; H.bMain.appendChild(iconEl(uiIcon(icon), 32)); el('span', '', H.bMain).innerHTML = cnHTML(label); }
function updateRunBtn() { if (H.bRun) { H.bRun.classList.toggle('main', !!IN.run); } }
function layoutUI() {
  if (!H.hud) return;
  var W = ROOT.clientWidth || window.innerWidth, Hh = ROOT.clientHeight || window.innerHeight, land = W > Hh, touch = IN.isTouch;
  H.W = W; H.H = Hh; H.land = land;
  var sb = 'var(--sb)';
  function pos(e, r, b, sz) { e.style.right = 'calc(var(--sr) + ' + r + 'px)'; e.style.bottom = 'calc(' + sb + ' + ' + b + 'px)'; if (sz) { e.style.width = e.style.height = sz + 'px'; } }
  [STICK.el, H.bMain, H.bJump, H.bRun, H.bSkill].forEach(function (e) { e.style.display = touch ? '' : 'none'; });
  var slotH = 54, base = land ? 6 : slotH + 6;
  // スロットバー：縦画面はいちばん下、横画面は下の中央
  var slotW = Math.min(46, Math.floor((W - 24) / 8) - 3);
  H.sb.querySelectorAll('.slot').forEach(function (e) { e.style.width = e.style.height = slotW + 'px'; });
  STICK.el.style.left = 'calc(var(--sl) + 14px)'; STICK.el.style.bottom = 'calc(' + sb + ' + ' + (base + 4) + 'px)';
  pos(H.bMain, 14, base + 8, 84); pos(H.bJump, 106, base + 2, 62); pos(H.bRun, 18, base + 104, 54); pos(H.bSkill, 84, base + 92, 54); pos(H.bSub, 150, base + 74, 50); pos(H.bTouch2, 156, base + 130, 46);
  H.hold.style.right = 'calc(var(--sr) + 10px)'; H.hold.style.bottom = 'calc(' + sb + ' + ' + (base + (touch ? 168 : 60)) + 'px)'; H.hold.style.width = (touch ? 172 : 340) + 'px';
  if (!touch) { H.hold.style.right = '50%'; H.hold.style.marginRight = '-170px'; H.hold.style.justifyContent = 'center'; }
  // ログ
  var lw = land ? Math.min(330, W * 0.32) : Math.min(330, W * 0.5), lh = land ? Math.min(110, Hh * 0.26) : 96;
  H.log.style.width = lw + 'px'; H.log.style.height = lh + 'px';
  H.log.style.bottom = 'calc(' + sb + ' + ' + (touch ? (land ? 136 : base + 136) : 62) + 'px)';
  // 字幕
  var capB = touch ? (land ? 30 : base + 250) : 76;
  if (touch && !land) { H.cap.style.bottom = 'auto'; H.cap.style.top = 'calc(var(--st) + 160px)'; H.cap2.style.bottom = 'auto'; H.cap2.style.top = 'calc(var(--st) + 232px)'; }
  else { H.cap.style.top = H.cap2.style.top = 'auto'; H.cap.style.bottom = 'calc(' + sb + ' + ' + capB + 'px)'; H.cap2.style.bottom = 'calc(' + sb + ' + ' + (capB + 70) + 'px)'; }
  var cw = touch && land ? Math.max(200, W - 2 * 220) : W * 0.92;
  H.cap.style.maxWidth = H.cap2.style.maxWidth = cw + 'px';
  H.cap.style.fontSize = H.cap2.style.fontSize = (Math.min(W, Hh) < 420 ? 18 : 22) + 'px';
  H.capB = capB;
  var small = Math.min(W, Hh) < 420;
  H.st.style.transform = small ? 'scale(.86)' : ''; H.st.style.transformOrigin = 'left top';
  Object.keys(WIN.list).forEach(function (k) { var w = WIN.list[k]; if (w.open) w.el.classList.toggle('big', isNarrow()); });
}
// ---- ねらい・ツールチップ ------------------------------------------------------------------
function drawCross(hit) {
  var c2 = H.cross, x = c2.getContext('2d'); x.clearRect(0, 0, 80, 80); x.save(); x.translate(40, 40);
  x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.6)';
  var r = hit ? 15 : 10;
  for (var i = 0; i < 4; i++) { x.save(); x.rotate(i * PI / 2 + (hit ? PI / 4 : 0)); x.beginPath(); x.moveTo(r, 0); x.lineTo(r + 9, 0); x.stroke(); x.lineWidth = 3; x.strokeStyle = hit ? '#ffe23a' : '#fff'; x.stroke(); x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.6)'; x.restore(); }
  if (hit) { x.lineWidth = 2; x.strokeStyle = '#ffe23a'; x.beginPath(); x.arc(0, 0, 13, 0, TAU); x.stroke(); }
  x.fillStyle = hit ? '#ffe23a' : '#fff'; x.fillRect(-2, -2, 4, 4);
  x.restore();
}
var _crossState = null;
function setCross(target) {
  var hit = !!target; if (hit !== _crossState) { _crossState = hit; drawCross(hit); H.bMain.classList.toggle('ready', hit); }
  if (!target) { H.tt.style.display = 'none'; H.tt._t = null; return; }
  var key = target.key + '|' + (target.count || 0) + '|' + (ITEMS.held ? 1 : 0);
  if (H.tt._t !== key) {
    H.tt._t = key;
    var lines = '<div class="n">' + cnHTML(target.name) + (target.count ? '' : '　<span style="color:#ff70ff">NEW</span>') + '</div>';
    if (target.kind) lines += '<div class="s">' + cnHTML(target.kind) + '</div>';
    if (target.hint) lines += '<div class="h">' + cnHTML(target.hint) + '</div>';
    H.tt.innerHTML = lines;
  }
  H.tt.style.display = 'block';
  var W = H.W, Hh = H.H;
  H.tt.style.left = Math.min(W - 240, W / 2 + 28) + 'px'; H.tt.style.top = (Hh / 2 + 18) + 'px';
}
// ---- システムメッセージ・ログ -------------------------------------------------------------
function sysMsg(text, noLog) {
  var d = el('div', '', H.sys); d.innerHTML = cnHTML(text); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 3700);
  while (H.sys.children.length > 4) H.sys.removeChild(H.sys.firstChild);
  sfx('sysMsg');
  if (!noLog) logMsg('sys', text);
}
var LOG_COL = { sys: '#ffe23a', talk: '#ffffff', ev: '#9ad0ff', me: '#b0ffb0' };
function logMsg(tab, text, who) {
  H.logLines.push({ tab: tab, text: text, who: who });
  if (H.logLines.length > 80) H.logLines.shift();
  renderLog();
}
function renderLog() {
  if (!H.logList) return;
  var html = H.logLines.filter(function (l) { return H.logTab === 'all' || l.tab === H.logTab || (H.logTab === 'sys' && l.tab === 'ev'); }).slice(-40).map(function (l) {
    return '<div style="color:' + (LOG_COL[l.tab] || '#ddd') + '">' + (l.who ? '[' + cnHTML(l.who) + '] ' : (l.tab === 'sys' ? '[システム] ' : '')) + cnHTML(l.text) + '</div>';
  }).join('');
  H.logList.innerHTML = html; H.logList.scrollTop = 99999;
}
function toast(text) { sysMsg(text); }
// ---- ステータス・ミニマップ・名前タグ（毎フレーム） ---------------------------------------
var MM = { base: null, scale: 1.4, size: 224 };
function buildMinimapBase() {
  var S = 1024, c2 = cvs(S), x = c2.getContext('2d'), k = S / 320; // -160..160
  function wx(v) { return (v + 160) * k; }
  x.fillStyle = '#244a26'; x.fillRect(0, 0, S, S);
  function rect(x0, z0, x1, z1, col) { x.fillStyle = col; x.fillRect(wx(Math.min(x0, x1)), wx(Math.min(z0, z1)), Math.abs(x1 - x0) * k, Math.abs(z1 - z0) * k); }
  rect(-170, RIVER.z1, 170, RIVER.z2, '#2a7ab0'); rect(-170, RIVER.z0, 170, RIVER.z1, '#4a6a6a'); rect(-170, RIVER.z2, 170, RIVER.z3, '#4a6a6a');
  rect(-170, -37, 170, -27, '#6a6a70'); rect(-170, 27, 170, 37, '#6a6a70'); rect(-37, -150, -27, 46, '#6a6a70'); rect(25, -150, 33, 46, '#6a6a70');
  rect(-30, -70, 30, -37, '#b8a888'); rect(-24, -24, 24, 24, '#3a8a30'); rect(33, -32, 67, 27, '#a89878'); rect(30, 73, 105, 118, '#8a6a40'); rect(-105, -62, -40, 46, '#7a7a74'); rect(-100, -114, -60, -80, '#9a8a6a');
  rect(-55, -101, 170, -92, '#5a4a3a');
  x.fillStyle = 'rgba(230,220,200,.95)';
  COL.boxes.forEach(function (b) { if (b.y1 - b.y0 > 1.6 && (b.x1 - b.x0) * (b.z1 - b.z0) > 3) x.fillRect(wx(b.x0), wx(b.z0), Math.max(1, (b.x1 - b.x0) * k), Math.max(1, (b.z1 - b.z0) * k)); });
  MM.base = c2; MM.k = k;
}
var _hpShown = -1, _polShown = null;
function updateHUD(dt) {
  // ゲージ
  var p = G.pol, pv = Math.round(p);
  if (pv !== _polShown) { _polShown = pv; H.gPol.firstChild.style.width = Math.min(100, p) + '%'; H.gPol.lastChild.textContent = (p >= 333 ? '∞＋' + Math.floor(p - 333) : pv) + '％'; H.gPol.classList.toggle('over', p >= 100); }
  var hp = Math.round(G.genki);
  if (hp !== _hpShown) { _hpShown = hp; H.gHp.firstChild.style.width = clamp(G.genki, 0, 100) + '%'; H.gHp.lastChild.textContent = hp + '/100'; }
  // ミニマップ（２フレームに１回）
  if (!MM.base) buildMinimapBase();
  MM.f = (MM.f || 0) + 1; if (MM.f % 2) { updateTags(); return; }
  var x = H.mm.getContext('2d'), S = MM.size, k = MM.k, sc = 1.15, rot = CAM.yaw;
  x.save(); x.fillStyle = '#0a1a10'; x.fillRect(0, 0, S, S);
  x.translate(S / 2, S / 2); x.rotate(rot); x.scale(sc, sc);
  x.drawImage(MM.base, -(P.pos.x + 160) * k, -(P.pos.z + 160) * k);
  function dot(px, pz, col, r) { x.fillStyle = col; x.fillRect((px - P.pos.x) * k - r, (pz - P.pos.z) * k - r, r * 2, r * 2); }
  if (P.pos.z < 300) {
    if (G.xray > 0) ITEMS.list.forEach(function (it) { dot(it.body.pos.x, it.body.pos.z, '#ffd040', 2); });
    NPCS.forEach(function (n) { if (n.ent.visible) dot(n.ent.pos.x, n.ent.pos.z, '#ff70c0', 4); });
    if (NET && NET.peers) for (var id in NET.peers) { var pp = NET.peers[id]; if (pp.vis) dot(pp.pos.x, pp.pos.z, '#40f0ff', 4.5); }
    WORLD.friends.forEach(function (f) { if (f.wander && f.mesh.visible) dot(f.mesh.position.x, f.mesh.position.z, 'rgba(255,120,200,.6)', 2.5); });
  }
  x.restore();
  // 自分（矢印）
  x.save(); x.translate(S / 2, S / 2); x.rotate(CAM.yaw - P.face);
  x.fillStyle = '#ffe23a'; x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -14); x.lineTo(10, 10); x.lineTo(0, 5); x.lineTo(-10, 10); x.closePath(); x.stroke(); x.fill(); x.restore();
  // 北の位置
  var na = rot - PI / 2; H.mmN.style.transform = 'translate(' + (Math.cos(na) * 62) + 'px,' + (Math.sin(na) * 62 + 58) + 'px)';
  // 名前タグ
  updateTags();
}
var TAGS = [];
function updateTags() {
  var list = [], cam = R.camera, W = H.W, Hh = H.H, v = _tagV || (_tagV = new THREE.Vector3());
  list.push({ k: 'me', name: PLAYER.name, sub: FRIEND_INFO[PLAYER.char].name, p: P.pos, h: P.bodyH + 0.35, cls: 'me', bub: PLAYER.bubble });
  NPCS.forEach(function (n) { if (n.ent.visible) list.push({ k: 'n' + n.idx, name: FRIEND_INFO[n.idx].name, p: n.ent.pos, h: n.ent.h + 0.3, cls: 'npc', bub: n.bubble }); });
  if (NET && NET.peers && !NET.muted) for (var id in NET.peers) { var pp = NET.peers[id]; if (pp.vis) list.push({ k: 'p' + id, name: pp.name, sub: FRIEND_INFO[pp.char] ? FRIEND_INFO[pp.char].name : '', p: pp.pos, h: pp.h + 0.35, cls: 'pc', bub: pp.bubble }); }
  var used = 0;
  for (var i = 0; i < list.length && used < 12; i++) {
    var L = list[i], d = cam.position.distanceTo(L.p); if (d > 26 && L.cls !== 'me') continue;
    v.set(L.p.x, L.p.y + L.h, L.p.z).project(cam); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) continue;
    var t = TAGS[used] || (TAGS[used] = { e: el('div', 'nmtag', H.tags), b: el('div', 'bub', H.tags) });
    if (t.k !== L.k + L.name) { t.k = L.k + L.name; t.e.className = 'nmtag ' + L.cls; t.e.innerHTML = cnHTML(L.name) + (L.sub ? '<i>' + cnHTML(L.sub) + '</i>' : ''); }
    var sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * Hh;
    t.e.style.display = ''; t.e.style.left = sx + 'px'; t.e.style.top = sy + 'px';
    if (L.bub && L.bub.t > now()) { if (t.b._txt !== L.bub.text) { t.b._txt = L.bub.text; t.b.innerHTML = L.bub.icon ? '' : cnHTML(L.bub.text); if (L.bub.icon) t.b.appendChild(iconEl(uiIcon(L.bub.icon), 32)); } t.b.style.display = ''; t.b.style.left = sx + 'px'; t.b.style.top = (sy - 28) + 'px'; }
    else t.b.style.display = 'none';
    used++;
  }
  for (var j = used; j < TAGS.length; j++) { TAGS[j].e.style.display = 'none'; TAGS[j].b.style.display = 'none'; }
}
var _tagV = null;
// ---- 顔の絵（3Dモデルを撮影） --------------------------------------------------------------
var FACES = {};
function faceCanvas(idx) {
  if (FACES[idx]) return FACES[idx];
  var cv = cvs(96);
  try {
    var rt = new THREE.WebGLRenderTarget(96, 96), sc = new THREE.Scene(); sc.background = new THREE.Color(0x1a2438);
    sc.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1)); var dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(1, 2, 3); sc.add(dl);
    var m = new THREE.Mesh(FRIENDS.hi[idx], friendMat(FRIENDS.hi[idx].userData.set || 0)); sc.add(m);
    var hgt = FRIENDS.hi[idx].userData.h || 1.06;
    var cam = new THREE.PerspectiveCamera(30, 1, 0.01, 10); cam.position.set(0, hgt * 0.8, 1.15); cam.lookAt(0, hgt * 0.77, 0);
    var ren = R.renderer, prev = ren.getRenderTarget(); ren.setRenderTarget(rt); ren.render(sc, cam);
    var px = new Uint8Array(96 * 96 * 4); ren.readRenderTargetPixels(rt, 0, 0, 96, 96, px); ren.setRenderTarget(prev); rt.dispose();
    var x = cv.getContext('2d'), id = x.createImageData(96, 96);
    for (var y = 0; y < 96; y++) for (var i = 0; i < 96; i++) { var s = ((95 - y) * 96 + i) * 4, d = (y * 96 + i) * 4; for (var k = 0; k < 4; k++) id.data[d + k] = px[s + k]; }
    x.putImageData(id, 0, 0);
  } catch (e) {}
  FACES[idx] = cv; return cv;
}
function setFace(idx) { var x = H.face.getContext('2d'); x.clearRect(0, 0, 96, 96); x.drawImage(faceCanvas(idx), 0, 0); }
// ---- Movie Maker 風字幕（町のイベント用・前のまま） -------------------------------------------
var CAPQ = [], _capT = 0, _capBusy = false;
var CAP_PRESETS = ['fade', 'flyL', 'flyR', 'type', 'zoom', 'drop', 'wave'];
function caption(text, opt) {
  opt = opt || {};
  if (opt.now) { CAPQ = []; _capBusy = false; _capT = 0; }
  if (CAPQ.length > 3) CAPQ.shift();
  CAPQ.push({ text: text, opt: opt });
  logMsg('ev', text);
}
function caption2(text) {
  H.cap2.innerHTML = cnHTML(text); H.cap2.style.animation = 'none'; void H.cap2.offsetWidth; H.cap2.style.animation = 'capFade ' + (2.5 + text.length * 0.08) + 's forwards';
  logMsg('ev', text, '字幕');
}
function updateCaptions(dt) {
  if (_capBusy) { _capT -= dt; if (_capT <= 0) { _capBusy = false; H.cap.innerHTML = ''; } else return; }
  if (!CAPQ.length) return;
  var c2 = CAPQ.shift(), o = c2.opt, text = c2.text;
  var preset = o.preset || pick(CAP_PRESETS);
  if (REDUCED.on && (preset === 'flyL' || preset === 'flyR' || preset === 'zoom')) preset = 'fade';
  H.cap.className = (o.color || (Math.random() < 0.5 ? 'w' : 'y'));
  var dur = Math.min(7, 1.9 + text.length * 0.085);
  H.cap.style.animation = 'none'; void H.cap.offsetWidth;
  if (preset === 'type' || preset === 'wave') {
    var html = '', k = 0;
    cnSegments(text).forEach(function (s) { for (var i = 0; i < s.t.length; i++) { var ch = escHTML(s.t[i]); if (s.t[i] === '\n') { html += '<br>'; continue; } html += '<span class="ln' + (s.cn ? ' cn' : '') + '" style="opacity:0;animation:capFade ' + (dur - k * 0.045) + 's ' + (k * 0.045) + 's forwards' + (preset === 'wave' ? ',capWave .8s ' + (k * 0.06) + 's infinite' : '') + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>'; k++; } });
    H.cap.innerHTML = html;
  } else {
    H.cap.innerHTML = cnHTML(text);
    var an = { fade: 'capFade', flyL: 'capFlyL', flyR: 'capFlyR', zoom: 'capZoom', drop: 'capDrop' }[preset] || 'capFade';
    H.cap.style.animation = an + ' ' + dur + 's ease-out forwards';
  }
  if (o.speak) { var n = 0, iv = setInterval(function () { if (n++ >= Math.min(text.length, 36)) return clearInterval(iv); sfx('babble', hashStr(text) + n * 13); }, 50); }
  _capBusy = true; _capT = dur + 0.15;
}
// ---- ワードアート演出（前のまま） -------------------------------------------------------------
var WA_LIVE = 0;
function popWA(text, o) {
  o = o || {};
  if (WA_LIVE > (REDUCED.on ? 3 : 14)) return;
  var W = H.W || 400, Hh = H.H || 700, maxW = o.big ? W * 0.94 : W * (o.w || 0.7);
  var c2 = wordArtFit(text, o.style == null ? randi(0, WA_STYLES.length - 1) : o.style, maxW * 1.6, o.size || (o.big ? 110 : 72), o.shape);
  var e = document.createElement('canvas'); e.width = c2.width; e.height = c2.height; e.getContext('2d').drawImage(c2, 0, 0);
  var sc = Math.min(1, maxW / c2.width, (Hh * (o.big ? 0.4 : 0.22)) / c2.height) * (o.scale || 1);
  e.className = 'os-wa'; e.style.width = (c2.width * sc) + 'px'; e.style.height = (c2.height * sc) + 'px';
  e.style.left = (o.x != null ? o.x * W : W / 2) + 'px'; e.style.top = (o.y != null ? o.y * Hh : Hh * 0.32) + 'px';
  var dur = o.dur || (o.big ? 2.8 : 2.2), an = o.anim || (o.big ? 'waSpin' : pick(['waPop', 'waPop', 'waSlide', 'waFloat']));
  if (REDUCED.on) an = 'waSoft';
  e.style.transform = 'translate(-50%,-50%)'; e.style.animation = an + ' ' + dur + 's cubic-bezier(.2,.8,.3,1) forwards';
  H.wa.appendChild(e); WA_LIVE++;
  if (!o.silent) sfx('wa', randi(-5, 5));
  setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); WA_LIVE--; }, dur * 1000 + 50);
  return e;
}
function confetti(n) {
  n = REDUCED.on ? Math.min(n, 5) : n;
  var W = H.W, Hh = H.H;
  for (var i = 0; i < n; i++) (function () {
    var e = document.createElement('canvas'); e.width = e.height = 64; e.getContext('2d').drawImage(clipArt(pick(['star', 'sparkle', 'heart', 'flower', 'star', 'smile']), 64), 0, 0);
    var s = rand(26, 56); e.className = 'os-wa';
    e.style.cssText += 'width:' + s + 'px;height:' + s + 'px;left:' + rand(0, W) + 'px;top:-60px;transition:transform ' + rand(1.8, 3) + 's linear, opacity 3s;';
    H.wa.appendChild(e);
    requestAnimationFrame(function () { requestAnimationFrame(function () { e.style.transform = 'translate(' + rand(-80, 80) + 'px,' + (Hh + 120) + 'px) rotate(' + rand(-720, 720) + 'deg)'; }); });
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 3200);
  })();
}
// ---- レンズフレア（安っぽい） ------------------------------------------------------------------
function initFlares() {
  var kinds = ['flare', 'ring', 'flare', 'ring', 'sparkle', 'ring'];
  H.flareEls = kinds.map(function (k, i) { var c2 = document.createElement('canvas'); c2.width = c2.height = 128; c2.getContext('2d').drawImage(clipArt(k, 128), 0, 0); c2.className = 'os-flare'; var s = [180, 70, 40, 110, 50, 160][i]; c2.style.width = c2.style.height = s + 'px'; c2._s = s; H.flares.appendChild(c2); return c2; });
}
var _sv = null;
function updateFlare(sunDir, vis) {
  if (!_sv) _sv = new THREE.Vector3();
  var W = H.W, Hh = H.H;
  _sv.copy(R.camera.position).addScaledVector(sunDir, 300).project(R.camera);
  var on = vis > 0.05 && _sv.z < 1 && Math.abs(_sv.x) < 1.2 && Math.abs(_sv.y) < 1.2 && !LITE.on;
  var sx = (_sv.x * 0.5 + 0.5) * W, sy = (-_sv.y * 0.5 + 0.5) * Hh, cx = W / 2, cy = Hh / 2, ts = [0, 0.35, 0.6, 1.1, 1.4, 1.8];
  H.flareEls.forEach(function (e, i) {
    if (!on) { e.style.opacity = 0; return; }
    e.style.opacity = (vis * (i === 0 ? 0.9 : 0.55) * (REDUCED.on ? 0.5 : 1)).toFixed(2);
    e.style.transform = 'translate(' + (sx + (cx - sx) * ts[i] - e._s / 2) + 'px,' + (sy + (cy - sy) * ts[i] - e._s / 2) + 'px)';
  });
}
