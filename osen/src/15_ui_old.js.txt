// ---- 画面（HUD・字幕・ワードアート・設定・図鑑） ------------------------------------------
var H = {};
var UI_CSS = [
  '#os-hud{position:absolute;inset:0;pointer-events:none;}',
  '.os-btn{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;font:900 15px ' + FONT_JP + ';color:#fff;',
  ' text-shadow:1px 1px 0 #000,-1px 1px 0 #000,1px -1px 0 #000,-1px -1px 0 #000;border:3px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.45),inset 0 -6px 10px rgba(0,0,0,.25),inset 0 6px 10px rgba(255,255,255,.45);pointer-events:auto;touch-action:none;}',
  '.os-btn.on{transform:scale(.92);filter:brightness(1.25);}',
  '#os-touch{width:96px;height:96px;background:radial-gradient(circle at 35% 30%,#ffb3e6,#ff1493 60%,#a0005a);font-size:20px;}',
  '#os-touch.ready{animation:osWob .5s infinite;box-shadow:0 0 0 4px #ff0,0 4px 0 rgba(0,0,0,.45);}',
  '#os-jump{width:70px;height:70px;background:radial-gradient(circle at 35% 30%,#b3ffd9,#00c060 60%,#006030);}',
  '#os-run{width:62px;height:62px;background:radial-gradient(circle at 35% 30%,#bfe0ff,#1e7bff 60%,#003a90);font-size:13px;}',
  '#os-run.act{background:radial-gradient(circle at 35% 30%,#fff2b0,#ffa000 60%,#a05000);}',
  '#os-stick{position:absolute;width:132px;height:132px;border-radius:50%;pointer-events:auto;touch-action:none;',
  ' background:radial-gradient(circle,rgba(255,255,255,.12) 0 55%,rgba(255,255,255,.28) 56% 60%,rgba(255,255,255,.08) 61%);border:3px dashed rgba(255,255,255,.7);}',
  '#os-stick i{position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe066 45%,#ff9900);border:3px solid #fff;box-shadow:0 3px 0 rgba(0,0,0,.4);}',
  '#os-stick.on{border-style:solid;}',
  '#os-cross{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;transition:transform .15s;}',
  '#os-cross.hit{transform:scale(1.35) rotate(45deg);}',
  '#os-tname{position:absolute;left:50%;top:calc(50% + 30px);transform:translateX(-50%);white-space:nowrap;font:900 14px ' + FONT_JP + ';color:#ff0;text-shadow:2px 2px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000;opacity:0;transition:opacity .15s;}',
  '#os-pol{position:absolute;left:calc(var(--sl) + 6px);top:calc(var(--st) + 4px);transform-origin:left top;}',
  '#os-pol canvas{display:block;}',
  '#os-time{position:absolute;left:calc(var(--sl) + 12px);font:900 13px ' + FONT_JP + ';color:#fff;text-shadow:1px 1px 0 #000,-1px 1px 0 #000,1px -1px 0 #000,-1px -1px 0 #000;}',
  '#os-tr{position:absolute;right:calc(var(--sr) + 8px);top:calc(var(--st) + 8px);display:flex;gap:8px;pointer-events:auto;}',
  '.os-sq{width:46px;height:46px;border-radius:12px;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font:900 22px ' + FONT_JP + ';color:#fff;background:linear-gradient(#8a5cff,#4a1ab0);box-shadow:0 3px 0 rgba(0,0,0,.4);text-shadow:1px 1px 0 #000;}',
  '.os-sq small{font-size:10px;display:block;line-height:1;}',
  '#os-cap{position:absolute;left:50%;transform:translateX(-50%);text-align:center;white-space:pre-wrap;font:800 22px ' + FONT_SUB + ';line-height:1.35;letter-spacing:.02em;max-width:92vw;pointer-events:none;}',
  '#os-cap .ln{display:inline-block;}',
  '#os-cap.w{color:#fff;} #os-cap.y{color:#fff21a;}',
  '#os-cap{text-shadow:2px 0 0 #000,-2px 0 0 #000,0 2px 0 #000,0 -2px 0 #000,2px 2px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,3px 3px 2px rgba(0,0,0,.6);}',
  '#os-cap2{position:absolute;left:50%;transform:translateX(-50%);text-align:center;white-space:pre-wrap;font:800 18px ' + FONT_SUB + ';color:#9ff;max-width:92vw;pointer-events:none;text-shadow:2px 0 0 #000,-2px 0 0 #000,0 2px 0 #000,0 -2px 0 #000,2px 2px 0 #000,-2px -2px 0 #000;}',
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
  '.os-panel{position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;pointer-events:auto;background:rgba(10,0,40,.55);}',
  '.os-panel.show{display:flex;}',
  '.os-box{position:relative;width:min(94vw,560px);max-height:calc(100% - var(--st) - var(--sb) - 30px);overflow:auto;-webkit-overflow-scrolling:touch;background:linear-gradient(#fffef0,#ffe9fb);color:#222;border:5px solid #ff33aa;outline:4px solid #33ccff;border-radius:6px;box-shadow:8px 8px 0 #330066;padding:14px 14px 18px;}',
  '.os-box h2{margin:0 0 8px;text-align:center;}',
  '.os-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 6px;border-bottom:2px dotted #c9a;font:700 16px ' + FONT_JP + ';}',
  '.os-tg{min-width:84px;padding:9px 12px;border-radius:20px;border:3px solid #333;font:900 15px ' + FONT_JP + ';text-align:center;background:#ddd;color:#333;}',
  '.os-tg.on{background:linear-gradient(#7dff7a,#00b050);color:#fff;text-shadow:1px 1px 0 #000;}',
  '.os-big{display:block;width:100%;margin-top:12px;padding:13px;border-radius:30px;border:4px solid #fff;outline:3px solid #f0a;font:900 20px ' + FONT_JP + ';color:#fff;text-shadow:2px 2px 0 #a0006a;background:linear-gradient(#ff8ad8,#ff1493);box-shadow:0 5px 0 #80004a;}',
  '.os-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;}',
  '.os-tab{flex:1;min-width:70px;padding:8px 4px;text-align:center;border-radius:8px 8px 0 0;border:3px solid #a3c;background:#eee;font:900 13px ' + FONT_JP + ';color:#636;}',
  '.os-tab.on{background:linear-gradient(#ffe36b,#ffb300);color:#000;}',
  '.os-zl{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px;}',
  '.os-ze{padding:7px 6px;border:2px solid #b8a;border-radius:6px;background:#fff;font:700 13px ' + FONT_JP + ';color:#333;min-height:42px;}',
  '.os-ze.no{color:#aaa;background:#f4f0f4;}',
  '.os-ze.sel{border-color:#f0a;background:#fff0fa;}',
  '.os-zd{margin-top:10px;padding:10px;border:3px double #a3c;background:#fff;font:500 15px/1.6 ' + FONT_JP + ';color:#222;min-height:80px;}',
  '.os-zd b{font-weight:900;color:#c06;}',
  '#os-toast{position:absolute;right:calc(var(--sr) + 10px);top:calc(var(--st) + 64px);pointer-events:none;}',
  '.os-t1{margin-bottom:6px;padding:6px 12px 6px 46px;position:relative;background:linear-gradient(90deg,#ffffff,#fff6b0);border:3px solid #f0a;border-radius:20px;color:#333;font:900 13px ' + FONT_JP + ';box-shadow:3px 3px 0 #60a;animation:capFlyR 3.2s forwards;}',
  '.os-t1 canvas{position:absolute;left:-6px;top:50%;margin-top:-24px;width:48px;height:48px;animation:osSpin 3s linear infinite;}',
  '.os-deco{position:absolute;pointer-events:none;}',
  '.os-flare{position:absolute;pointer-events:none;mix-blend-mode:screen;opacity:0;}',
  '#os-intro{position:absolute;inset:0;z-index:40;overflow:auto;-webkit-overflow-scrolling:touch;pointer-events:auto;background:repeating-conic-gradient(from 0deg at 50% 30%,#ff5ec4 0 10deg,#ffe25e 10deg 20deg,#5effd0 20deg 30deg,#5ec4ff 30deg 40deg);}',
  '#os-intro .in{position:relative;margin:calc(var(--st) + 10px) auto calc(var(--sb) + 20px);width:min(94vw,560px);text-align:center;}',
  '#os-intro .tt canvas{max-width:100%;height:auto;}',
  '#os-intro table{width:100%;border-collapse:collapse;background:#fff;color:#222;border:4px solid #000;box-shadow:6px 6px 0 #000;font:700 14px/1.5 ' + FONT_JP + ';text-align:left;}',
  '#os-intro td{border:2px solid #000;padding:6px 8px;vertical-align:top;} #os-intro td:first-child{white-space:nowrap;background:#ffeb3b;font-weight:900;}',
  '#os-intro .warn{margin:10px 0;padding:8px;background:#000;color:#ff0;font:700 13px/1.5 ' + FONT_JP + ';border:3px dashed #f0f;}'
].join('\n');

function initUI() {
  IN.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var st = document.createElement('style'); st.textContent = UI_CSS; (document.head || document.documentElement).appendChild(st);
  var hud = H.hud = el('div', '', UI); hud.id = 'os-hud';
  H.decos = el('div', '', hud);
  H.flares = el('div', '', hud);
  H.wa = el('div', '', hud); H.wa.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  H.cross = el('canvas', '', hud); H.cross.id = 'os-cross'; H.cross.width = H.cross.height = 88; drawCross(false);
  H.tname = el('div', '', hud); H.tname.id = 'os-tname';
  H.pol = el('div', '', hud); H.pol.id = 'os-pol';
  H.time = el('div', '', hud); H.time.id = 'os-time';
  H.cap = el('div', 'w', hud); H.cap.id = 'os-cap';
  H.cap2 = el('div', '', hud); H.cap2.id = 'os-cap2';
  H.toast = el('div', '', hud); H.toast.id = 'os-toast';
  // 右上ボタン
  var tr = el('div', '', hud); tr.id = 'os-tr';
  H.bZukan = el('div', 'os-sq pe', tr, '図<small>図鑑</small>'); H.bZukan.style.background = 'linear-gradient(#ffb300,#ff6a00)';
  H.bMenu = el('div', 'os-sq pe', tr, '⚙<small>設定</small>');
  tapBtn(H.bZukan, function () { toggleZukan(); });
  tapBtn(H.bMenu, function () { toggleMenu(); });
  // 操作ボタン
  STICK.el = el('div', 'pe', hud); STICK.el.id = 'os-stick'; STICK.knob = el('i', '', STICK.el);
  H.bTouch = el('div', 'os-btn', hud, 'さわる'); H.bTouch.id = 'os-touch';
  H.bJump = el('div', 'os-btn', hud, 'ジャンプ'); H.bJump.id = 'os-jump';
  H.bRun = el('div', 'os-btn', hud, '走る'); H.bRun.id = 'os-run';
  holdBtn(H.bTouch, function () { IN.touch = true; });
  holdBtn(H.bJump, function () { IN.jump = true; });
  holdBtn(H.bRun, function () { IN.run = !IN.run; updateRunBtn(); });
  decorations();
  buildMenu(); buildZukan();
  layoutUI();
}
function tapBtn(e, fn) {
  e.addEventListener('touchstart', function (ev) { ev.preventDefault(); ev.stopPropagation(); audioInit(); sfx('click'); fn(); }, { passive: false });
  e.addEventListener('click', function (ev) { ev.stopPropagation(); audioInit(); sfx('click'); fn(); });
}
function holdBtn(e, fn) {
  e.addEventListener('touchstart', function (ev) { ev.preventDefault(); ev.stopPropagation(); audioInit(); e.classList.add('on'); fn(); }, { passive: false });
  e.addEventListener('touchend', function (ev) { ev.preventDefault(); e.classList.remove('on'); }, { passive: false });
  e.addEventListener('mousedown', function (ev) { ev.stopPropagation(); audioInit(); e.classList.add('on'); fn(); });
  e.addEventListener('mouseup', function () { e.classList.remove('on'); });
}
function updateRunBtn() { if (H.bRun) { H.bRun.classList.toggle('act', !!IN.run); H.bRun.innerHTML = IN.run ? '走り中' : '走る'; } }
function layoutUI() {
  if (!H.hud) return;
  var W = ROOT.clientWidth || window.innerWidth, Hh = ROOT.clientHeight || window.innerHeight, land = W > Hh;
  var showTouch = IN.isTouch;
  [STICK.el, H.bTouch, H.bJump, H.bRun].forEach(function (e) { e.style.display = showTouch ? '' : 'none'; });
  var sb = 'var(--sb)', sr = 'var(--sr)', sl = 'var(--sl)';
  STICK.el.style.left = 'calc(' + sl + ' + 20px)'; STICK.el.style.bottom = 'calc(' + sb + ' + 22px)';
  H.bTouch.style.right = 'calc(' + sr + ' + 18px)'; H.bTouch.style.bottom = 'calc(' + sb + ' + 26px)';
  H.bJump.style.right = 'calc(' + sr + ' + 126px)'; H.bJump.style.bottom = 'calc(' + sb + ' + 18px)';
  H.bRun.style.right = 'calc(' + sr + ' + 40px)'; H.bRun.style.bottom = 'calc(' + sb + ' + 136px)';
  var capB = showTouch ? (land ? 22 : 196) : 30;
  H.cap.style.bottom = 'calc(' + sb + ' + ' + capB + 'px)';
  H.cap2.style.bottom = 'calc(' + sb + ' + ' + (capB + 74) + 'px)';
  var cw = showTouch && land ? Math.max(200, W - 2 * 200) : W * 0.92;
  H.cap.style.maxWidth = H.cap2.style.maxWidth = cw + 'px';
  H.cap.style.fontSize = H.cap2.style.fontSize = (Math.min(W, Hh) < 420 ? 19 : 23) + 'px';
  H.capB = capB; H.land = land; H.W = W; H.H = Hh;
  H.pol.style.transform = 'scale(' + (Math.min(W, Hh) < 420 ? 0.62 : 0.8) + ')';
  H.time.style.top = 'calc(var(--st) + ' + (Math.min(W, Hh) < 420 ? 64 : 82) + 'px)';
}
function drawCross(hit) {
  var c = H.cross, x = c.getContext('2d'); x.clearRect(0, 0, 88, 88); x.save(); x.translate(44, 44);
  if (!hit) {
    x.lineWidth = 7; x.strokeStyle = 'rgba(0,0,0,.6)'; x.beginPath(); x.moveTo(-14, 0); x.lineTo(14, 0); x.moveTo(0, -14); x.lineTo(0, 14); x.stroke();
    x.lineWidth = 3; x.strokeStyle = '#fff'; x.stroke();
    x.beginPath(); x.arc(0, 0, 3, 0, TAU); x.fillStyle = '#ff2fa8'; x.fill();
  } else {
    x.drawImage(clipArt('star', 88), -40, -40, 80, 80);
    x.font = '900 22px ' + FONT_JP; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 4; x.strokeStyle = '#000'; x.strokeText('!', 0, 2); x.fillStyle = '#f0f'; x.fillText('!', 0, 2);
  }
  x.restore();
}
var _crossState = null;
function setCross(target) {
  var hit = !!target; if (hit !== _crossState) { _crossState = hit; drawCross(hit); H.cross.classList.toggle('hit', hit); H.bTouch.classList.toggle('ready', hit); }
  if (target) { if (H.tname._t !== target.def.n) { H.tname._t = target.def.n; H.tname.innerHTML = cnHTML(target.def.n) + (target.count ? '' : '　<span style="color:#f6f">NEW</span>'); } H.tname.style.opacity = 1; }
  else H.tname.style.opacity = 0;
}
// ---- 汚染率メーター（ワードアート） -------------------------------------------------------
var _polShown = null;
function drawPollution(v, stage) {
  var txt = v >= 1e4 ? '∞' : v >= 333 ? '∞＋' + Math.floor(v - 333) : Math.floor(v);
  var key = txt + '|' + stage; if (key === _polShown) return; _polShown = key;
  var label = '汚染率 ' + txt + '％';
  var styles = [12, 0, 5, 3, 2, 8, 0, 1, 6, 0, 10];
  var c = wordArt(label, { style: styles[Math.min(stage, styles.length - 1)], size: 46, shape: stage >= 8 ? 'wave' : 'flat' });
  H.pol.innerHTML = ''; var img = c.cloneNode ? document.createElement('canvas') : c; img.width = c.width; img.height = c.height; img.getContext('2d').drawImage(c, 0, 0); H.pol.appendChild(img);
  if (stage >= 7) { var n = document.createElement('canvas'); n.width = n.height = 64; n.getContext('2d').drawImage(clipArt('new', 64), 0, 0); n.style.cssText = 'position:absolute;right:-30px;top:-8px;animation:osBlink 1.1s infinite;'; H.pol.appendChild(n); }
}
// ---- 字幕（ムービーメーカー風） -------------------------------------------------------------
var CAPQ = [], _capT = 0, _capBusy = false, _cap2T = 0;
var CAP_PRESETS = ['fade', 'flyL', 'flyR', 'type', 'zoom', 'drop', 'wave'];
function caption(text, opt) {
  opt = opt || {};
  if (opt.now) { CAPQ = []; _capBusy = false; _capT = 0; }
  if (CAPQ.length > 3) CAPQ.shift();
  CAPQ.push({ text: text, opt: opt });
}
function caption2(text) { // 汚染が進むと出る「もう一つの字幕」
  H.cap2.innerHTML = cnHTML(text); H.cap2.style.animation = 'none'; void H.cap2.offsetWidth; H.cap2.style.animation = 'capFade ' + (2.5 + text.length * 0.08) + 's forwards';
}
function updateCaptions(dt) {
  if (_capBusy) { _capT -= dt; if (_capT <= 0) { _capBusy = false; H.cap.innerHTML = ''; } else return; }
  if (!CAPQ.length) return;
  var c = CAPQ.shift(), o = c.opt, text = c.text;
  var preset = o.preset || pick(CAP_PRESETS);
  if (REDUCED.on && (preset === 'flyL' || preset === 'flyR' || preset === 'zoom')) preset = 'fade';
  H.cap.className = (o.color || (Math.random() < 0.5 ? 'w' : 'y'));
  var dur = Math.min(7, 1.9 + text.length * 0.085);
  H.cap.style.animation = 'none'; void H.cap.offsetWidth;
  if (preset === 'type' || preset === 'wave') {
    var segs = cnSegments(text), html = '', k = 0;
    segs.forEach(function (s) { for (var i = 0; i < s.t.length; i++) { var ch = escHTML(s.t[i]); if (s.t[i] === '\n') { html += '<br>'; continue; } html += '<span class="ln' + (s.cn ? ' cn' : '') + '" style="opacity:0;animation:capFade ' + (dur - k * 0.045) + 's ' + (k * 0.045) + 's forwards' + (preset === 'wave' ? ',capWave .8s ' + (k * 0.06) + 's infinite' : '') + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>'; k++; } });
    H.cap.innerHTML = html;
    if (o.speak) { var n = 0; var iv = setInterval(function () { if (n++ >= Math.min(text.length, 40)) return clearInterval(iv); sfx('babble', hashStr(text) + n * 13); }, 45); }
  } else {
    H.cap.innerHTML = cnHTML(text);
    var an = { fade: 'capFade', flyL: 'capFlyL', flyR: 'capFlyR', zoom: 'capZoom', drop: 'capDrop' }[preset] || 'capFade';
    H.cap.style.animation = an + ' ' + dur + 's ease-out forwards';
    if (o.speak) { var m = 0; var iv2 = setInterval(function () { if (m++ >= Math.min(text.length, 30)) return clearInterval(iv2); sfx('babble', hashStr(text) + m * 7); }, 55); }
  }
  _capBusy = true; _capT = dur + 0.15;
}
// ---- ワードアートを画面に出す ------------------------------------------------------------
var WA_LIVE = 0;
function popWA(text, o) {
  o = o || {};
  if (WA_LIVE > (REDUCED.on ? 3 : 14)) return;
  var W = H.W || 400, Hh = H.H || 700;
  var maxW = o.big ? W * 0.94 : W * (o.w || 0.7);
  var c = wordArtFit(text, o.style == null ? randi(0, WA_STYLES.length - 1) : o.style, maxW * 1.6, o.size || (o.big ? 110 : 72), o.shape);
  var e = document.createElement('canvas'); e.width = c.width; e.height = c.height; e.getContext('2d').drawImage(c, 0, 0);
  var sc = Math.min(1, maxW / c.width, (Hh * (o.big ? 0.4 : 0.22)) / c.height) * (o.scale || 1);
  e.className = 'os-wa'; e.style.width = (c.width * sc) + 'px'; e.style.height = (c.height * sc) + 'px';
  e.style.left = (o.x != null ? o.x * W : W / 2) + 'px'; e.style.top = (o.y != null ? o.y * Hh : Hh * 0.32) + 'px';
  var dur = o.dur || (o.big ? 2.8 : 2.2), an = o.anim || (o.big ? 'waSpin' : pick(['waPop', 'waPop', 'waSlide', 'waFloat']));
  if (REDUCED.on) an = 'waSoft';
  e.style.transform = 'translate(-50%,-50%)';
  e.style.animation = an + ' ' + dur + 's cubic-bezier(.2,.8,.3,1) forwards';
  H.wa.appendChild(e); WA_LIVE++;
  if (!o.silent) sfx('wa', randi(-5, 5));
  setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); WA_LIVE--; }, dur * 1000 + 50);
  return e;
}
function confetti(n) {
  n = REDUCED.on ? Math.min(n, 5) : n;
  var W = H.W, Hh = H.H;
  for (var i = 0; i < n; i++) (function (i) {
    var k = pick(['star', 'sparkle', 'heart', 'flower', 'star', 'smile']);
    var e = document.createElement('canvas'); e.width = e.height = 64; e.getContext('2d').drawImage(clipArt(k, 64), 0, 0);
    var s = rand(26, 56); e.className = 'os-wa';
    e.style.cssText += 'width:' + s + 'px;height:' + s + 'px;left:' + rand(0, W) + 'px;top:-60px;transition:transform ' + rand(1.8, 3) + 's linear, opacity 3s;';
    H.wa.appendChild(e);
    requestAnimationFrame(function () { requestAnimationFrame(function () { e.style.transform = 'translate(' + rand(-80, 80) + 'px,' + (Hh + 120) + 'px) rotate(' + rand(-720, 720) + 'deg)'; }); });
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 3200);
  })(i);
}
function toast(text, kind) {
  var t = el('div', 'os-t1', H.toast); var c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(clipArt(kind || 'new', 64), 0, 0); t.appendChild(c);
  var s = document.createElement('span'); s.innerHTML = cnHTML(text); t.appendChild(s);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3300);
  while (H.toast.children.length > 4) H.toast.removeChild(H.toast.firstChild);
}
// ---- 飾り（回る星・点滅NEW・レンズフレア） ------------------------------------------------
function decorations() {
  function deco(kind, css, anim) { var c = document.createElement('canvas'); c.width = c.height = 96; c.getContext('2d').drawImage(clipArt(kind, 96), 0, 0); c.className = 'os-deco'; c.style.cssText += css + ';animation:' + anim; H.decos.appendChild(c); return c; }
  H.decoEls = [
    deco('star', 'left:calc(var(--sl) + 2px);top:calc(var(--st) + 52px);width:30px;height:30px', 'osSpin 4s linear infinite'),
    deco('sparkle', 'right:calc(var(--sr) + 116px);top:calc(var(--st) + 6px);width:34px;height:34px', 'osBlink 1.4s infinite'),
    deco('new', 'right:calc(var(--sr) + 64px);top:calc(var(--st) + 50px);width:40px;height:40px', 'osBlink 1.2s infinite')
  ];
  var kinds = ['flare', 'ring', 'flare', 'ring', 'sparkle', 'ring'];
  H.flareEls = kinds.map(function (k, i) { var c = document.createElement('canvas'); c.width = c.height = 128; c.getContext('2d').drawImage(clipArt(k, 128), 0, 0); c.className = 'os-flare'; var s = [180, 70, 40, 110, 50, 160][i]; c.style.width = c.style.height = s + 'px'; c._s = s; H.flares.appendChild(c); return c; });
}
var _sv = null;
function updateFlare(sunDir, vis) {
  if (!_sv) _sv = new THREE.Vector3();
  var W = H.W, Hh = H.H;
  _sv.copy(R.camera.position).addScaledVector(sunDir, 300).project(R.camera);
  var on = vis > 0.05 && _sv.z < 1 && Math.abs(_sv.x) < 1.2 && Math.abs(_sv.y) < 1.2 && !LITE.on;
  var sx = (_sv.x * 0.5 + 0.5) * W, sy = (-_sv.y * 0.5 + 0.5) * Hh, cx = W / 2, cy = Hh / 2;
  var ts = [0, 0.35, 0.6, 1.1, 1.4, 1.8];
  H.flareEls.forEach(function (e, i) {
    if (!on) { e.style.opacity = 0; return; }
    var x = sx + (cx - sx) * ts[i], y = sy + (cy - sy) * ts[i];
    e.style.opacity = (vis * (i === 0 ? 0.9 : 0.55) * (REDUCED.on ? 0.5 : 1)).toFixed(2);
    e.style.transform = 'translate(' + (x - e._s / 2) + 'px,' + (y - e._s / 2) + 'px)';
  });
}
// ---- 設定メニュー -----------------------------------------------------------------------
function buildMenu() {
  var p = H.menu = el('div', 'os-panel', UI); var b = el('div', 'os-box os-scroll', p);
  var t = el('div', '', b); t.style.textAlign = 'center'; var wa = wordArt('せってい', { style: 1, size: 54 }); var cv = document.createElement('canvas'); cv.width = wa.width; cv.height = wa.height; cv.getContext('2d').drawImage(wa, 0, 0); cv.style.maxWidth = '80%'; cv.style.maxHeight = '16vh'; t.appendChild(cv);
  function row(label, get, set) { var r = el('div', 'os-row', b); el('div', '', r).innerHTML = cnHTML(label); var tg = el('div', 'os-tg pe', r); function upd() { var v = get(); tg.classList.toggle('on', v); tg.textContent = v ? 'ON' : 'OFF'; } tapBtn(tg, function () { set(!get()); upd(); saveGame(); }); upd(); return upd; }
  H.mUpd = [
    row('ＢＧＭ（音楽）', function () { return AUD.bgmOn; }, function (v) { audioSetBgm(v); }),
    row('効果音', function () { return AUD.sfxOn; }, function (v) { audioSetSfx(v); }),
    row('軽量モード（古いスマホ用）', function () { return LITE.on; }, function (v) { setLite(v); }),
    row('刺激ひかえめモード', function () { return REDUCED.on; }, function (v) { REDUCED.on = v; })
  ];
  var info = el('div', '', b); info.style.cssText = 'font:500 12px/1.6 ' + FONT_JP + ';color:#555;margin-top:8px;';
  H.mInfo = info;
  var zb = el('div', 'os-big pe', b, '図鑑を見る'); tapBtn(zb, function () { toggleMenu(false); toggleZukan(true); });
  var hb = el('div', 'os-big pe', b, '最初の説明をもう一度'); hb.style.background = 'linear-gradient(#8ad8ff,#1e7bff)'; tapBtn(hb, function () { toggleMenu(false); showIntro(); });
  var rb = el('div', 'os-big pe', b, '記録を消す'); rb.style.background = 'linear-gradient(#ccc,#777)'; rb.style.fontSize = '15px';
  var conf = 0; tapBtn(rb, function () { conf++; if (conf < 2) { rb.textContent = 'もう一度押すと消えます'; return; } STORE.clear(); location.reload(); });
  var cb = el('div', 'os-big pe', b, 'とじる'); tapBtn(cb, function () { toggleMenu(false); });
}
function toggleMenu(show) {
  var s = show == null ? !H.menu.classList.contains('show') : show;
  if (s && H.zukan.classList.contains('show')) toggleZukan(false);
  H.menu.classList.toggle('show', s); G.paused = s || H.zukan.classList.contains('show') || G.introOpen;
  if (s) { H.mUpd.forEach(function (f) { f(); }); H.mInfo.innerHTML = [cnHTML('記録の保存：' + (STORE.available() ? 'この端末のブラウザに保存されます' : '保存できない環境です（閉じると消えます）')), cnHTML('画質：' + ['最低', '低', '中', '高'][R.quality] + '　/　' + (R.lastFps ? Math.round(R.lastFps) + 'fps' : '計測中')), cnHTML('版：' + GAME_VERSION + '　（重い時は自動で画質が下がります）')].join('<br>'); if (document.exitPointerLock && IN.locked) document.exitPointerLock(); }
}
function setLite(v) {
  LITE.on = v;
  setQuality(v ? 1 : 3);
  WORLD.friends.forEach(function (f) { var g = v ? FRIENDS.lo[f.idx] : FRIENDS.hi[f.idx]; if (g && f.mesh.geometry !== g && !f.mesh.userData.box) f.mesh.geometry = g; });
}
// ---- 図鑑 -----------------------------------------------------------------------------
var ZUKAN = { found: {}, tab: 0, sel: null };
var ZTABS = ['もの', 'ともだち', '場所・時間', '現象・ひみつ'];
function zukanEntries(tab) {
  if (tab === 0) return PROP_DEFS.filter(function (d) { return d.z && d.b !== 'friend' && d.b !== 'statue'; }).map(function (d) { return { id: 'p_' + d.id, n: d.n, d: d.z, secret: d.secret }; });
  if (tab === 1) return FRIEND_INFO.map(function (f, i) { return { id: 'f_' + i, n: f.full, d: f.desc + '<br><br><small>（添付モデル「' + (i < 4 ? 'Four Little Friends' : 'Four Friends') + '」の' + (i % 4 + 1) + '人目）</small>' }; });
  if (tab === 2) return AREAS.map(function (a) { return { id: 'a_' + a.id, n: a.name, d: a.wa + '。' + a.sub + '。' + (AREA_DESC[a.id] || '') }; }).concat(TIMES.map(function (t) { return { id: 't_' + t.id, n: '時間帯：' + t.name, d: TIME_DESC[t.id] }; }));
  return STAGES.map(function (s, i) { return { id: 's_' + i, n: '汚染：' + s.name, d: s.desc }; }).concat(SECRETS.map(function (s) { return { id: 'x_' + s.id, n: s.n, d: s.d, secret: 1 }; }));
}
var AREA_DESC = { eki: '電车はまだ一度も来た事がない。時計だけがまじめに働いている。', shoten: '全てのお店が「営業中」と「準備中」を同時にかかげている。', danchi: '同じ形の建物が３つ。住んでいる人はいるらしい。外階段は屋上に続く。', koen: '８人の友達の像がある公園。像の順番には意味があるとか無いとか。', kawa: 'ぬるい川。流れは遅い。たまに逆に流れる。', akichi: '何も無い事になっている空き地。何かはある。', jinja: '神社なのかどうか、誰も確かめていない。', nai: 'この部屋は存在しません。図鑑に載っているのは何かのまちがいです。' };
var TIME_DESC = { asa: '朝。空がピンクになる。鳥が「しゃっきり」と鳴く。', hiru: '昼。いちばん普通の時間。普通すぎて少しこわい。', yu: '夕方。全部がオレンジ色。影が長くのびて、少し歩く。', yoru: '夜。団地の窓が光る。星がたくさんある（数えた人はいない）。', nai: '存在しない時間。２５時６１分。空が緑とピンクになり、太陽が大きくなる。' };
function buildZukan() {
  var p = H.zukan = el('div', 'os-panel', UI); var b = el('div', 'os-box os-scroll', p);
  var t = el('div', '', b); t.style.textAlign = 'center'; var wa = wordArt('ずかん', { style: 2, size: 54, shape: 'arcUp' }); var cv = document.createElement('canvas'); cv.width = wa.width; cv.height = wa.height; cv.getContext('2d').drawImage(wa, 0, 0); cv.style.maxWidth = '70%'; cv.style.maxHeight = '16vh'; t.appendChild(cv);
  H.zCount = el('div', '', b); H.zCount.style.cssText = 'text-align:center;font:900 14px ' + FONT_JP + ';color:#a06;margin-bottom:6px;';
  var tabs = el('div', 'os-tabs', b); H.zTabs = ZTABS.map(function (n, i) { var e = el('div', 'os-tab pe', tabs, n); tapBtn(e, function () { ZUKAN.tab = i; ZUKAN.sel = null; renderZukan(); }); return e; });
  H.zList = el('div', 'os-zl', b); H.zDesc = el('div', 'os-zd', b);
  var cb = el('div', 'os-big pe', b, 'とじる'); tapBtn(cb, function () { toggleZukan(false); });
}
function zukanTotal() { var n = 0, f = 0; for (var t = 0; t < 4; t++) zukanEntries(t).forEach(function (e) { n++; if (ZUKAN.found[e.id]) f++; }); return [f, n]; }
function renderZukan() {
  H.zTabs.forEach(function (e, i) { e.classList.toggle('on', i === ZUKAN.tab); });
  var tot = zukanTotal(); H.zCount.innerHTML = cnHTML('発見：' + tot[0] + '　／　' + tot[1] + '　（' + Math.floor(tot[0] / tot[1] * 100) + '％）');
  H.zList.innerHTML = '';
  var list = zukanEntries(ZUKAN.tab);
  list.forEach(function (e) {
    var f = ZUKAN.found[e.id], d = el('div', 'os-ze pe' + (f ? '' : ' no') + (ZUKAN.sel === e.id ? ' sel' : ''), H.zList);
    d.innerHTML = f ? cnHTML(e.n) : (e.secret ? '？？？（ひみつ）' : '？？？');
    tapBtn(d, function () { ZUKAN.sel = e.id; renderZukan(); });
  });
  var s = list.filter(function (e) { return e.id === ZUKAN.sel; })[0];
  H.zDesc.innerHTML = s ? (ZUKAN.found[s.id] ? '<b>' + cnHTML(s.n) + '</b><br>' + cnHTML(s.d).replace(/&lt;br&gt;/g, '<br>').replace(/&lt;(\/?)small&gt;/g, '<$1small>') : 'まだ見つかっていません。' + (s.secret ? '<br>ひみつの物です。行きにくい所、特別な順番、じっとする、後ろ向き、などを試すとよいかもしれません。' : '<br>町のどこかに有ります。')) : cnHTML('項目を押すと　説明が　出ます。説明は　すべて　正確です（当社調べ）。');
}
function toggleZukan(show) {
  var s = show == null ? !H.zukan.classList.contains('show') : show;
  if (s && H.menu.classList.contains('show')) toggleMenu(false);
  H.zukan.classList.toggle('show', s); G.paused = s || H.menu.classList.contains('show') || G.introOpen;
  if (s) { renderZukan(); if (document.exitPointerLock && IN.locked) document.exitPointerLock(); }
}
function zukanFind(id, name) {
  if (ZUKAN.found[id]) return false;
  ZUKAN.found[id] = 1; sfx('zukan'); toast('図鑑に登録：' + name, 'new'); saveGame(); return true;
}
// ---- 読み込み画面・最初の説明 --------------------------------------------------------------
function showLoading() {
  var d = el('div', '', ROOT); d.id = 'os-loading'; H.loading = d;
  H.lTitle = el('div', '', d); H.lTitle.style.cssText = 'animation:osWob 1.6s infinite;max-width:92vw';
  H.lBar = el('div', 'bar', d); el('i', '', H.lBar);
  H.lMsg = el('div', 'msg', d, 'よみこみ中でございます…');
  drawLoadingTitle();
}
function drawLoadingTitle() {
  if (!H.lTitle) return; H.lTitle.innerHTML = '';
  var c = wordArt('よみこみ中', { style: 0, size: 64 }), e = document.createElement('canvas'); e.width = c.width; e.height = c.height; e.getContext('2d').drawImage(c, 0, 0); e.style.maxWidth = '88vw'; H.lTitle.appendChild(e);
}
function setLoading(p, msg) { if (!H.lBar) return; H.lBar.firstChild.style.width = Math.round(p * 100) + '%'; if (msg) H.lMsg.innerHTML = cnHTML(msg); }
function hideLoading() { if (H.loading) { H.loading.style.transition = 'opacity .5s'; H.loading.style.opacity = 0; setTimeout(function () { if (H.loading && H.loading.parentNode) H.loading.parentNode.removeChild(H.loading); }, 600); } }
function showIntro() {
  G.introOpen = true; G.paused = true;
  var d = H.intro = el('div', 'pe os-scroll', UI); d.id = 'os-intro';
  var inn = el('div', 'in', d);
  var tt = el('div', 'tt', inn);
  function wc(t, o) { var c = wordArt(t, o), e = document.createElement('canvas'); e.width = c.width; e.height = c.height; e.getContext('2d').drawImage(c, 0, 0); e.style.maxWidth = '100%'; return e; }
  tt.appendChild(wc('精神汚染ゲーム', { style: 10, size: 84, shape: 'tilt' }));
  var sub = wc('～はちにんの町～', { style: 0, size: 44, shape: 'arcUp' }); sub.style.maxWidth = '80%'; tt.appendChild(sub);
  var hw = wc('あそびかた説明書', { style: 8, size: 40 }); hw.style.maxWidth = '70%'; inn.appendChild(hw);
  var tb = el('table', '', inn), rows = IN.isTouch ? INTRO_LINES.touch : INTRO_LINES.pc;
  rows.forEach(function (r) { var tr = el('tr', '', tb); el('td', '', tr, cnHTML(r[0])); el('td', '', tr, cnHTML(r[1]).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')); });
  if (!IN.isTouch) { var tr2 = el('tr', '', tb); el('td', '', tr2, 'スマホ'); el('td', '', tr2, cnHTML('スマホでも遊べるのです。左下の○で歩く、右半分で見回す')); }
  var w = el('div', 'warn', inn); w.innerHTML = cnHTML('◆目的は　ありません。歩くほど　さわるほど　町が「汚染」されます。\n◆画面のすみの「汚染率」は100％を超えても終わりません。\n◆音は　画面に一度さわると鳴ります。⚙で音・軽量モード・刺激ひかえめモード。\n◆画面がゆれたり色が変わる演出があります。気分が悪くなったら休むのです。').replace(/\n/g, '<br>');
  var go = el('div', 'os-big pe', inn, 'あそぶ（はじめる）'); go.style.fontSize = '24px';
  tapBtn(go, function () { audioInit(); bgmPlay(G.area ? G.area.id : 'eki'); d.parentNode.removeChild(d); G.introOpen = false; G.paused = false; G.onStart(); });
}
