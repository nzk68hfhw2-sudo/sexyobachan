// ---- 起動画面（読み込み・ログイン・サーバー選択・チャンネル選択・利用規約・キャラ選択） --------------
var SCR_CSS = [
  '#os-load{position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(ellipse at 50% 40%,#2a3048,#0a0c14 70%);color:#ece2c6;font-family:' + FONT_UI + ';}',
  '#os-load .logo{max-width:90vw;animation:osWob 2.4s infinite;}',
  '#os-load .bar{width:min(80vw,420px);height:18px;padding:2px;background:#0a0a0a;border:1px solid #000;box-shadow:0 0 0 2px #8a7050,0 0 0 3px #2a1a08;}',
  '#os-load .bar i{display:block;height:100%;width:0;background:linear-gradient(#ffe8a0,#d0902a 50%,#a06010 51%,#c08020);transition:width .3s;}',
  '#os-load .pct{font-size:13px;color:#ffe7a8;}',
  '#os-load .tip{width:min(86vw,460px);padding:8px 10px;font-size:13px;line-height:1.6;color:#d8d0b8;background:rgba(0,0,0,.45);border:1px solid #5a4a2a;}',
  '#os-load .tip b{color:#ffd56a;font-weight:normal;}',
  '#os-menu{position:absolute;inset:0;z-index:50;pointer-events:none;}',
  '#os-menu .ow{pointer-events:auto;}',
  '#os-menu .logo{position:absolute;left:50%;top:calc(var(--st) + 14px);transform:translateX(-50%);max-width:92vw;max-height:22vh;pointer-events:none;}',
  '.fld{display:flex;align-items:center;gap:8px;margin:6px 0;} .fld span{width:64px;color:#ffe7a8;font-size:13px;}',
  '.fld div{flex:1;padding:6px 8px;background:#f4f0e0;color:#222;border:2px solid;border-color:#333 #ddd #ddd #333;font-size:14px;}',
  '.srv{display:flex;align-items:center;gap:8px;} .srv .nm{flex:1;} .srv .gg{width:70px;}',
  '.terms{height:150px;overflow:auto;-webkit-overflow-scrolling:touch;padding:8px;background:#f4f0e0;color:#222;font-family:' + FONT_SUB + ';font-size:12px;line-height:1.7;border:2px solid;border-color:#333 #ddd #ddd #333;}',
  '.cs-name{text-align:center;font-size:20px;color:#ffe7a8;text-shadow:1px 1px 0 #000;}',
  '.cs-sub{text-align:center;font-size:12px;color:#9ad0ff;margin-bottom:4px;}',
  '.cs-nav{position:absolute;top:44%;pointer-events:auto;width:56px;height:56px;display:flex;align-items:center;justify-content:center;}'
].join('\n');
function showLoading() {
  var st = document.createElement('style'); st.textContent = SCR_CSS; (document.head || document.documentElement).appendChild(st);
  var d = H.loading = el('div', '', ROOT); d.id = 'os-load';
  H.lLogo = el('div', 'logo', d);
  H.lBar = el('div', 'bar', d); el('i', '', H.lBar);
  H.lPct = el('div', 'pct', d, 'Loading… 0％');
  H.lTip = el('div', 'tip', d);
  drawLoadingTitle(); nextTip();
  H.tipIv = setInterval(nextTip, 3800);
}
function nextTip() { if (H.lTip) H.lTip.innerHTML = '<b>【ゲームのヒント】</b><br>' + cnHTML(pick(TIPS)); }
function drawLoadingTitle() {
  if (!H.lLogo) return; H.lLogo.innerHTML = '';
  var c2 = wordArt(LOGIN.title, { style: 1, size: 64, shape: 'slant' }), e = document.createElement('canvas'); e.width = c2.width; e.height = c2.height; e.getContext('2d').drawImage(c2, 0, 0); e.style.maxWidth = '88vw'; H.lLogo.appendChild(e);
}
function setLoading(p, msg) { if (!H.lBar) return; H.lBar.firstChild.style.width = Math.round(p * 100) + '%'; H.lPct.innerHTML = cnHTML('Loading… ' + Math.round(p * 100) + '％　' + (msg || '')); }
function hideLoading() { clearInterval(H.tipIv); if (H.loading) { H.loading.style.transition = 'opacity .5s'; H.loading.style.opacity = 0; var l = H.loading; setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, 600); H.loading = null; } }
// ---- ログイン風の流れ ----
var MENU = { el: null, step: '' };
function menuWin(title, icon, w, build, theme) {
  if (MENU.win) MENU.win.remove();
  var e = el('div', 'ow ' + (theme || ''), MENU.el); ['a', 'b', 'c', 'd'].forEach(function (k) { el('span', 'oc ' + k, e); });
  var tb = el('div', 'otb', e); tb.style.cursor = 'default'; tb.appendChild(iconEl(uiIcon(icon), 20)); el('div', 't', tb).innerHTML = cnHTML(title);
  var bd = el('div', 'obd os-scroll', e); build(bd);
  var W = H.W || window.innerWidth, Hh = H.H || window.innerHeight, ww = Math.min(w, W - 24);
  e.style.width = ww + 'px'; e.style.left = ((W - ww) / 2) + 'px'; e.style.top = Math.max(Hh * 0.24, 70) + 'px';
  if (Hh < 500) e.style.top = '12px';
  e.style.maxHeight = (Hh - parseInt(e.style.top, 10) - 12) + 'px'; e.style.display = 'flex'; e.style.flexDirection = 'column';
  MENU.win = e; sfx('uiOpen'); return e;
}
function showMenu() {
  G.inMenu = true; updatePause();
  MENU.el = el('div', '', UI); MENU.el.id = 'os-menu';
  var c2 = wordArt(LOGIN.title, { style: 1, size: 70, shape: 'slant' }), lg = document.createElement('canvas'); lg.width = c2.width; lg.height = c2.height; lg.getContext('2d').drawImage(c2, 0, 0); lg.className = 'logo'; MENU.el.appendChild(lg); MENU.logo = lg;
  H.hud.style.display = 'none';
  bgmPlay('title');
  stepLogin();
}
function stepLogin() {
  menuWin('ログイン', 'key', 340, function (bd) {
    el('div', 'fld', bd, '<span>ＩＤ</span><div>' + cnHTML(LOGIN.id) + '</div>');
    el('div', 'fld', bd, '<span>パスワード</span><div>' + LOGIN.pw + '</div>');
    el('div', 'desc', bd, cnHTML('※ＩＤとパスワードは自動で入っています。本物ではありません。何も送信しません。'));
    var r = el('div', 'row2', bd); r.style.justifyContent = 'center';
    mbtn(r, 'ログイン', function () { audioInit(); sfx('uiLogin'); stepServer(); }, 'gold', 'key');
    mbtn(r, '会員登録', function () { sysMsg('会員登録は　すでに　完了しています（していない）。'); });
  });
}
function stepServer() {
  menuWin('サーバー選択', 'server', 360, function (bd) {
    var l = el('div', 'list', bd);
    LOGIN.servers.forEach(function (s, i) {
      var e = el('div', 'li srv', l); el('span', 'nm', e).innerHTML = cnHTML(s.n);
      var g2 = el('div', 'gg ' + (s.s === '混雑' ? 'pol' : 'hp'), e); var f = el('i', '', g2); f.style.width = [30, 85, 45, 0, 100][i] + '%'; el('b', '', g2).innerHTML = cnHTML(s.s);
      tapBtn(e, function () { if (s.s === '存在しない') { sysMsg('このサーバーは存在しません。'); return; } PLAYER.server = s.n; stepChannel(); }, 'uiClick');
    });
    var r = el('div', 'row2', bd); mbtn(r, 'もどる', stepLogin);
  }, 'stone');
}
function stepChannel() {
  menuWin('チャンネル選択', 'channel', 380, function (bd) {
    el('div', 'kv', bd, '<span>サーバー</span><b>' + cnHTML(PLAYER.server) + '</b>');
    var g2 = el('div', 'grid', bd); g2.style.gridTemplateColumns = 'repeat(auto-fill,minmax(104px,1fr))';
    LOGIN.channels.forEach(function (ch) { mbtn(g2, ch, function () { PLAYER.channel = ch; stepTerms(); }); });
    var r = el('div', 'row2', bd); mbtn(r, 'もどる', stepServer);
  }, 'stone');
}
function stepTerms() {
  if (PLAYER.agreed) return stepCharSel();
  var refuse = 0;
  menuWin('利用規約', 'scroll', 380, function (bd) {
    var t = el('div', 'terms os-scroll', bd); t.innerHTML = LOGIN.terms.map(cnHTML).join('<br>');
    var r = el('div', 'row2', bd); r.style.justifyContent = 'center';
    mbtn(r, '同意する', function () { PLAYER.agreed = true; saveGame(); stepCharSel(); }, 'gold');
    var nb = mbtn(r, '同意しない', function () { refuse++; nb.lastChild.textContent = refuse > 1 ? '同意しない（' + refuse + '回目）' : '同意しない'; sysMsg(refuse > 2 ? '同意しない事に同意したものとみなします（第１０条）。' : '同意しない事を確認しました。もう一度どうぞ。'); if (refuse > 2) { PLAYER.agreed = true; stepCharSel(); } });
  });
}
// ---- キャラ選択（台の上でゆっくり回る） ----
var CS = { scene: null, cam: null, mesh: null, idx: 0, on: false, change: false, t: 0 };
function buildCharScene() {
  var s = CS.scene = new THREE.Scene(); s.background = new THREE.Color(0x0e1220); s.fog = new THREE.Fog(0x0e1220, 6, 16);
  s.add(new THREE.HemisphereLight(0xc8d8ff, 0x302010, 0.7));
  var sp = new THREE.SpotLight(0xfff0d0, 1.4, 12, 0.5, 0.5); sp.position.set(0, 5, 2); sp.target.position.set(0, 0.6, 0); s.add(sp); s.add(sp.target);
  var rim = new THREE.DirectionalLight(0x8080ff, 0.6); rim.position.set(-3, 2, -3); s.add(rim);
  var ped = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.4, 32), new THREE.MeshPhongMaterial({ color: 0x8a7a5a, shininess: 40 })); ped.position.y = -0.2; s.add(ped);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd56a })); ring.rotation.x = PI / 2; ring.position.y = 0.01; s.add(ring);
  var flr = new THREE.Mesh(new THREE.CircleGeometry(12, 48), new THREE.MeshLambertMaterial({ color: 0x1a2030 })); flr.rotation.x = -PI / 2; flr.position.y = -0.4; s.add(flr);
  for (var i = 0; i < 40; i++) { var st = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), new THREE.MeshBasicMaterial({ color: pick([0xffe080, 0x80c0ff, 0xff80c0]) })); st.position.set(rand(-6, 6), rand(0.5, 4), rand(-6, -1)); s.add(st); }
  CS.cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50); CS.cam.position.set(0, 1.0, 4.2); CS.cam.lookAt(0, 0.75, 0);
}
function csShow(idx) {
  CS.idx = (idx + 8) % 8;
  if (CS.mesh) CS.scene.remove(CS.mesh);
  var g2 = FRIENDS.hi[CS.idx]; CS.mesh = new THREE.Mesh(g2, friendMat(g2.userData.set || 0)); var s = 1.18 * CHARS[CS.idx].scale; CS.mesh.scale.set(s, s, s); CS.scene.add(CS.mesh);
  if (CS.win) CS.fill();
  sfx('uiSlot');
}
function stepCharSel(change) {
  CS.change = !!change;
  if (!CS.scene) buildCharScene();
  CS.on = true; G.inMenu = true; updatePause();
  if (MENU.logo) MENU.logo.style.display = 'none';
  if (!MENU.el) { MENU.el = el('div', '', UI); MENU.el.id = 'os-menu'; }
  H.hud.style.display = 'none';
  var W = H.W, Hh = H.H, land = W > Hh;
  var win = menuWin(change ? 'キャラを変える（着がえ所）' : 'キャラクター選択', 'char', land ? 330 : Math.min(380, W - 20), function (bd) {
    CS.nameEl = el('div', 'cs-name', bd); CS.subEl = el('div', 'cs-sub', bd);
    CS.descEl = el('div', 'desc', bd); CS.stEl = el('div', '', bd);
    var r = el('div', 'row2', bd); r.style.justifyContent = 'center';
    mbtn(r, '◀', function () { csShow(CS.idx - 1); });
    mbtn(r, change ? 'この人になる' : 'この人で始める', function () { csDecide(); }, 'gold');
    mbtn(r, '▶', function () { csShow(CS.idx + 1); });
    if (!change) { var r2 = el('div', 'kv', bd); el('span', '', r2).innerHTML = cnHTML('名前：' + PLAYER.name); mbtn(r2, '選び直す', function () { PLAYER.name = makeName(); r2.firstChild.innerHTML = cnHTML('名前：' + PLAYER.name); }); }
    else { var r3 = el('div', 'row2', bd); mbtn(r3, 'やめる', function () { csClose(); }); }
  });
  // 横画面は右に、縦画面は下に
  if (land) { win.style.left = 'auto'; win.style.right = '12px'; win.style.top = '12px'; win.style.maxHeight = (Hh - 24) + 'px'; }
  else { win.style.top = 'auto'; win.style.bottom = 'calc(var(--sb) + 8px)'; win.style.maxHeight = '56%'; }
  CS.win = win;
  CS.fill = function () {
    var f = FRIEND_INFO[CS.idx], c2 = CHARS[CS.idx];
    CS.nameEl.innerHTML = cnHTML(f.full); CS.subEl.innerHTML = cnHTML((CS.idx < 4 ? '女の子' : '男の子') + '　／　とくぎ：' + c2.skill.name);
    CS.descEl.innerHTML = cnHTML(c2.intro + '\n【とくぎ】' + c2.skill.desc).replace(/\n/g, '<br>');
    function b(n, v) { return '<div class="kv"><span>' + cnHTML(n) + '</span><span class="gg hp" style="width:55%;display:inline-block"><i style="width:' + Math.round(v * 100 / 1.6) + '%"></i><b>' + v.toFixed(2) + '</b></span></div>'; }
    CS.stEl.innerHTML = b('速さ', c2.speed) + b('ジャンプ', c2.jump) + b('大きさ', c2.scale);
  };
  // 左右の大きな矢印（スマホで押しやすく）
  if (!CS.navL) {
    CS.navL = el('div', 'cs-nav mb', MENU.el); CS.navL.appendChild(iconEl(uiIcon('arrowL'), 32)); tapBtn(CS.navL, function () { csShow(CS.idx - 1); });
    CS.navR = el('div', 'cs-nav mb', MENU.el); CS.navR.appendChild(iconEl(uiIcon('arrowR'), 32)); tapBtn(CS.navR, function () { csShow(CS.idx + 1); });
  }
  CS.navL.style.display = CS.navR.style.display = '';
  CS.navL.style.left = '10px'; CS.navR.style.right = land ? 'calc(' + (parseInt(win.style.width, 10) + 24) + 'px)' : '10px';
  CS.navL.style.top = CS.navR.style.top = land ? '42%' : '22%';
  csShow(change ? PLAYER.char : (PLAYER.char || 0));
}
function csDecide() {
  var idx = CS.idx;
  var wasChange = CS.change;
  csClose();
  setPlayerChar(idx);
  if (!wasChange) enterWorld();
  else { sysMsg(FRIEND_INFO[idx].name + 'に　着がえました。'); popWA('着がえ完了', { style: 5, y: 0.3 }); }
  saveGame();
}
function csClose() {
  CS.on = false;
  if (MENU.win) { MENU.win.remove(); MENU.win = null; }
  if (CS.navL) CS.navL.style.display = CS.navR.style.display = 'none';
  if (MENU.el && !CS.change) { MENU.el.remove(); MENU.el = null; }
  G.inMenu = false; H.hud.style.display = ''; updatePause();
  CS.win = null;
}
function openCharChange() { Object.keys(WIN.list).forEach(function (k) { closeWin(k, true); }); stepCharSel(true); }
function renderCharSel(dt) {
  CS.t += dt; if (CS.mesh) { CS.mesh.rotation.y += dt * 0.6; CS.mesh.position.y = Math.abs(Math.sin(CS.t * 2)) * 0.03; }
  var W = H.W, Hh = H.H, land = W > Hh;
  CS.cam.aspect = W / Hh;
  if (land) { CS.cam.setViewOffset(W, Hh, W * 0.16, 0, W, Hh); CS.cam.position.set(0, 1.0, 4.0); }
  else { CS.cam.clearViewOffset(); CS.cam.position.set(0, 0.55, 5.4); }
  CS.cam.lookAt(0, land ? 0.75 : 0.3, 0); CS.cam.updateProjectionMatrix();
  R.renderer.render(CS.scene, CS.cam);
}
