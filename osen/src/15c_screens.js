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
  '#os-menu .logo{position:absolute;left:50%;top:calc(var(--st) + 14px);transform:translateX(-50%);max-width:92vw;max-height:19vh;pointer-events:none;}',
  '.fld{display:flex;align-items:center;gap:8px;margin:6px 0;} .fld span{width:64px;color:#ffe7a8;font-size:13px;}',
  '.fld div{flex:1;padding:6px 8px;background:#f4f0e0;color:#222;border:2px solid;border-color:#333 #ddd #ddd #333;font-size:14px;}',
  '.cs-faces{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin:0 0 6px;}', '.cs-face{width:100%;aspect-ratio:1;border:2px solid #5a4a2a;border-radius:4px;background:#1a1a2a;pointer-events:auto;cursor:pointer;opacity:.75;}', '.cs-face.sel{border-color:#ffe23a;box-shadow:0 0 6px #ffd040;opacity:1;}',
  '.srv{display:flex;align-items:center;gap:8px;} .srv .nm{flex:1;} .srv .gg{width:104px;}',
  '.li.srv.off{border:1px solid #e8c060!important;background:linear-gradient(#4a3a14,#1e1606)!important;box-shadow:0 0 8px rgba(232,192,96,.5);}', '.li.srv.pv{background:linear-gradient(#3a1a50,#1a0a28)!important;border:1px solid #b070e0!important;}',
  '.bdg{font-style:normal;font-size:10px;padding:1px 5px;margin-right:6px;border-radius:3px;background:#e8c060;color:#1a1008;vertical-align:middle;}', '.bdg.pv{background:#b070e0;color:#fff;}', '.bdg.us{background:#4a90c0;color:#fff;}',
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
  H.lLogo.appendChild(logoImg('min(88vw,520px)'));
}
// タイトルロゴ（制作者がくれた画像。白い所は透明にしてある）
function logoImg(w) {
  var im = document.createElement('img'); im.alt = '精神汚染オンライン'; im.draggable = false;
  im.src = 'data:image/png;base64,' + LOGO_B64;
  im.style.cssText = 'display:block;margin:0 auto;height:auto;filter:drop-shadow(0 0 3px #fff) drop-shadow(0 0 8px rgba(255,255,255,.85));' + (w ? 'width:' + w + ';' : '');
  im.onerror = function () { var c2 = wordArt(LOGIN.title, { style: 1, size: 64, shape: 'slant' }); im.replaceWith(c2); };
  return im;
}
// 名前を自分で入れる（12文字まで。ひどい言葉・個人情報っぽい物は使えない）
function openNameInput(done) {
  var bg = el('div', '', UI); bg.style.cssText = 'position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;pointer-events:auto;';
  var w = el('div', 'ow', bg); w.style.cssText = 'position:relative;width:min(320px,88vw);padding:12px;display:block;';
  el('div', 'hd', w, '名前を入力');
  var inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 12; inp.value = PLAYER.nameFree ? PLAYER.name : ''; inp.placeholder = '12文字まで';
  inp.style.cssText = 'width:100%;box-sizing:border-box;font:16px ' + FONT_SUB + ';padding:8px;margin:8px 0;border:2px solid #c8a050;background:#fffef0;color:#222;';
  w.appendChild(inp);
  var msg = el('div', 'desc', w); msg.innerHTML = cnHTML('ほかの人にも見えます。本名・住所・電話番号などは入れないでください。');
  var row = el('div', 'row2', w);
  function close() { if (bg.parentNode) bg.parentNode.removeChild(bg); }
  mbtn(row, '決定', function () {
    var t = (inp.value || '').replace(/[\s　]+/g, ' ').trim().slice(0, 12);
    if (!t) { msg.innerHTML = cnHTML('名前を入れてください。'); sfx('error'); return; }
    var f = filterMsg(t);
    if (f.censored || f.text !== t) { msg.innerHTML = '<span style="color:#ff8080">' + cnHTML('その名前は使えません（ひどい言葉・個人情報っぽい文字）。') + '</span>'; sfx('error'); return; }
    PLAYER.name = t; PLAYER.nameFree = true; saveGame(); close(); sfx('uiOpen'); if (NET && NET.sendMeta) NET.sendMeta(); if (done) done();
  }, 'gold');
  mbtn(row, 'やめる', function () { close(); });
  setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
}
function setLoading(p, msg) { if (!H.lBar) return; H.lBar.firstChild.style.width = Math.round(p * 100) + '%'; H.lPct.innerHTML = cnHTML('Loading… ' + Math.round(p * 100) + '％　' + (msg || '') + '　（版 ' + GAME_VERSION + '）'); }
function hideLoading() { clearInterval(H.tipIv); if (H.loading) { H.loading.style.transition = 'opacity .5s'; H.loading.style.opacity = 0; var l = H.loading; setTimeout(function () { if (l.parentNode) l.parentNode.removeChild(l); }, 600); H.loading = null; } }
// ---- ログイン風の流れ ----
var MENU = { el: null, step: '' };
function menuWin(title, icon, w, build, theme) {
  if (MENU.win) MENU.win.remove();
  var e = el('div', 'ow ' + (theme || ''), MENU.el); ['a', 'b', 'c', 'd'].forEach(function (k) { el('span', 'oc ' + k, e); });
  var tb = el('div', 'otb', e); tb.style.cursor = 'default'; tb.appendChild(iconEl(uiIcon(icon), 20)); el('div', 't', tb).innerHTML = cnHTML(title);
  var bd = el('div', 'obd os-scroll', e); build(bd);
  var W = H.W || window.innerWidth, Hh = H.H || window.innerHeight, ww = Math.min(w, W - 24);
  var lb = 0; if (MENU.logo && MENU.logo.style.display !== 'none') { try { lb = MENU.logo.getBoundingClientRect().bottom + 6; } catch (er) {} }
  e.style.width = ww + 'px'; e.style.left = ((W - ww) / 2) + 'px'; e.style.top = Math.max(Hh * 0.24, 70, lb) + 'px';
  if (Hh < 500) e.style.top = '12px';
  e.style.maxHeight = (Hh - parseInt(e.style.top, 10) - 12) + 'px'; e.style.display = 'flex'; e.style.flexDirection = 'column';
  MENU.win = e; sfx('uiOpen'); return e;
}
function showMenu() {
  G.inMenu = true; updatePause();
  MENU.el = el('div', '', UI); MENU.el.id = 'os-menu';
  var lg = logoImg(); lg.className = 'logo'; var W0 = H.W || window.innerWidth, H0 = H.H || window.innerHeight; lg.style.height = Math.round(Math.min(H0 * 0.18, W0 * 0.92 * 314 / 760)) + 'px'; lg.style.width = 'auto'; MENU.el.appendChild(lg); MENU.logo = lg;
  H.hud.style.display = 'none';
  bgmPlay('title');
  if (NET_DB_URL) srvRefresh();
  stepLogin();
}
function stepLogin() {
  menuWin('ログイン', 'key', 340, function (bd) {
    el('div', 'fld', bd, '<span>ＩＤ</span><div>' + cnHTML(LOGIN.id) + '</div>');
    el('div', 'fld', bd, '<span>パスワード</span><div>' + LOGIN.pw + '</div>');
    el('div', 'desc', bd, cnHTML('※ＩＤとパスワードは自動で入っています。本物ではありません。何も送信しません。'));
    var sn = el('div', 'desc', bd, cnHTML('♪音が聞こえない場合は消音モードを解除したり、右下のボイスを何回か押してみるか、アプリを落としてみてね')); sn.style.color = '#ffe7a8';
    var r = el('div', 'row2', bd); r.style.justifyContent = 'center';
    mbtn(r, 'ログイン', function () { audioInit(); sfx('uiLogin'); stepServer(); }, 'gold', 'key');
    mbtn(r, '会員登録', function () { sysMsg('会員登録は　すでに　完了しています（していない）。'); });
  });
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
  var g2 = FRIENDS.hi[CS.idx]; CS.mesh = animMesh(g2); CS.body = new THREE.Group(); CS.st = {}; CS.gs = { id: 'wave', t: 0 }; var s = 1.18 * CHARS[CS.idx].scale; CS.mesh.scale.set(s, s, s); CS.scene.add(CS.mesh);
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
    // 8人の顔（タップですぐ選べる）
    var fr = el('div', 'cs-faces', bd); CS.faces = [];
    for (var fi = 0; fi < 8; fi++) (function (i) {
      var c = document.createElement('canvas'); c.width = c.height = 96; try { c.getContext('2d').drawImage(faceCanvas(i), 0, 0, 96, 96); } catch (e) {}
      c.className = 'cs-face'; fr.appendChild(c); tapBtn(c, function () { csShow(i); }); CS.faces.push(c);
    })(fi);
    CS.nameEl = el('div', 'cs-name', bd); CS.subEl = el('div', 'cs-sub', bd);
    CS.descEl = el('div', 'desc', bd); CS.stEl = el('div', '', bd);
    if (!change) {
      // 名前は自分で入れるのが基本（空のままなら、おまかせの名前）
      var nb = el('div', '', bd); nb.style.cssText = 'margin:6px 0 4px;';
      el('div', '', nb).innerHTML = '<span style="color:#ffe7a8;font-size:14px">' + cnHTML('名前（好きな名前を入れてね・12文字まで）') + '</span>';
      var nr = el('div', '', nb); nr.style.cssText = 'display:flex;gap:6px;align-items:stretch;margin-top:4px;';
      var ni = document.createElement('input'); ni.type = 'text'; ni.maxLength = 12; ni.id = 'os-namein'; ni.autocomplete = 'off'; ni.value = PLAYER.nameFree ? PLAYER.name : ''; ni.placeholder = PLAYER.name || '名前';
      ni.style.cssText = 'flex:1;min-width:0;box-sizing:border-box;font:20px ' + FONT_SUB + ';padding:10px 10px;border:3px solid #e8c060;border-radius:4px;background:#fffef0;color:#222;';
      nr.appendChild(ni);
      mbtn(nr, 'おまかせ', function () { PLAYER.name = makeName(); ni.value = PLAYER.name; sfx('uiSlot'); });
      CS.nameErr = el('div', 'desc', nb); CS.nameErr.innerHTML = cnHTML('ほかの人にも見えます。本名・住所・電話番号などは入れないでください。');
      CS.nameIn = ni;
    }
    var r = el('div', 'row2', bd); r.style.justifyContent = 'center';
    mbtn(r, '◀', function () { csShow(CS.idx - 1); });
    mbtn(r, change ? 'この人になる' : 'この人で始める', function () { if (!change && !csNameOk()) return; csDecide(); }, 'gold');
    mbtn(r, '▶', function () { csShow(CS.idx + 1); });
    if (change) { var r3 = el('div', 'row2', bd); mbtn(r3, 'やめる', function () { csClose(); }); }
  });
  // 横画面は右に、縦画面は下に
  if (land) { win.style.left = 'auto'; win.style.right = '12px'; win.style.top = '12px'; win.style.maxHeight = (Hh - 24) + 'px'; }
  else { win.style.top = 'auto'; win.style.bottom = 'calc(var(--sb) + 8px)'; win.style.maxHeight = '62%'; }
  CS.win = win;
  CS.fill = function () {
    var f = FRIEND_INFO[CS.idx], c2 = CHARS[CS.idx];
    if (CS.faces) CS.faces.forEach(function (c, i) { c.classList.toggle('sel', i === CS.idx); });
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
function csNameOk() {
  var ni = CS.nameIn; if (!ni) return true;
  var t = (ni.value || '').replace(/[\s　]+/g, ' ').trim().slice(0, 12);
  if (!t) { if (!PLAYER.name) PLAYER.name = makeName(); PLAYER.nameFree = false; return true; }
  var f = filterMsg(t);
  if (f.censored || f.text !== t) { CS.nameErr.innerHTML = '<span style="color:#ff8a8a">' + cnHTML('その名前は使えません（ひどい言葉・個人情報っぽい文字）。') + '</span>'; sfx('error'); return false; }
  PLAYER.name = t; PLAYER.nameFree = true; return true;
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
  CS.t += dt; if (CS.mesh && CS.forcePose) { var fu = CS.mesh.material.userData.u; for (var fk in CS.forcePose) fu[fk].value = CS.forcePose[fk]; CS.mesh.rotation.y = CS.forceRot || 0; } else if (CS.mesh) { CS.mesh.rotation.y += dt * 0.6; var e2 = gestureAnim(CS.gs, dt); if (e2 === 'end') { CS.gs = Math.random() < 0.5 ? { id: pick(['wave', 'dance', 'jump', 'bow', 'nod']), t: -2 } : null; e2 = null; } if (!CS.gs && Math.random() < dt * 0.4) CS.gs = { id: pick(['wave', 'dance', 'jump', 'bow']), t: 0 }; var u = CS.mesh.material.userData.u, ee = e2 || {}; var br = Math.sin(CS.t * 1.6) * 0.05; u.uRaiseL.value = lerp(u.uRaiseL.value, ee.L_raiseL != null ? ee.L_raiseL : 0.12, 0.2); u.uRaiseR.value = lerp(u.uRaiseR.value, ee.L_raiseR != null ? ee.L_raiseR : 0.12, 0.2); u.uArmL.value = lerp(u.uArmL.value, ee.L_armL != null ? ee.L_armL : br, 0.2); u.uArmR.value = lerp(u.uArmR.value, ee.L_armR != null ? ee.L_armR : -br, 0.2); u.uHeadP.value = lerp(u.uHeadP.value, ee.L_headP || 0, 0.2); u.uHeadY.value = lerp(u.uHeadY.value, ee.L_headY || 0, 0.2); u.uLegL.value = lerp(u.uLegL.value, ee.L_legL || 0, 0.2); u.uLegR.value = lerp(u.uLegR.value, ee.L_legR || 0, 0.2); CS.mesh.position.y = (ee.bounce || 0) * 0.5; }
  var W = H.W, Hh = H.H, land = W > Hh;
  CS.cam.aspect = W / Hh;
  if (land) { CS.cam.setViewOffset(W, Hh, W * 0.16, 0, W, Hh); CS.cam.position.set(0, 1.0, 4.0); }
  else { CS.cam.setViewOffset(W, Hh, 0, Hh * 0.25, W, Hh); CS.cam.position.set(0, 0.7, 5.6); } // 縦画面：ウィンドウの上に全身が見えるように
  CS.cam.lookAt(0, land ? 0.75 : 0.62, 0); CS.cam.updateProjectionMatrix();
  R.renderer.render(CS.scene, CS.cam);
}
