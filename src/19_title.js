// ---- title scene (bright 90s kids show), warning, letter, settings -------------
var TITLE = null;
function buildTitleScene() {
  var sc = new THREE.Scene();
  var sky = toTex(texDaySky(), { clamp: true });
  sc.background = sky;
  sc.fog = new THREE.Fog(0xbfe6ff, 30, 90);
  var hemi = new THREE.HemisphereLight(0xcfefff, 0x6a8a40, 0.75); sc.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff2d0, 0.9); sun.position.set(-10, 20, 14); sc.add(sun);
  function mat(c, o) { var m = new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 20 }, o || {})); return m; }
  var g = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(0x6fbf4a)); g.rotation.x = -PI / 2; sc.add(g);
  var road = new THREE.Mesh(new THREE.PlaneGeometry(60, 9), mat(0x555a60)); road.rotation.x = -PI / 2; road.position.set(0, 0.01, 9); sc.add(road);
  var walk = new THREE.Mesh(new THREE.PlaneGeometry(4, 8), mat(0xd8d2c0)); walk.rotation.x = -PI / 2; walk.position.set(0, 0.02, 3); sc.add(walk);
  // school facade
  var brickT = toTex(texBrick(29)); brickT.repeat.set(10, 3);
  var school = new THREE.Mesh(new THREE.BoxGeometry(34, 8.4, 12), mat(0xffffff, { map: brickT })); school.position.set(0, 4.2, -6); sc.add(school);
  var trim = new THREE.Mesh(new THREE.BoxGeometry(34.6, 0.5, 12.6), mat(0xf2efe4)); trim.position.set(0, 8.5, -6); sc.add(trim);
  var winM = mat(0x8fd6ff, { emissive: 0x2a5a80, shininess: 90 }), frameM = mat(0xf2efe4);
  for (var fl = 0; fl < 2; fl++) for (var i = 0; i < 12; i++) {
    var x = -15 + i * 2.7; if (Math.abs(x) < 2.5) continue;
    var w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.6), winM); w.position.set(x, 2.2 + fl * 4, 0.02); sc.add(w);
    var f1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.2), frameM); f1.position.set(x, 1.36 + fl * 4, 0.05); sc.add(f1);
  }
  var door = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.6), mat(0x8a3a30)); door.position.set(0, 1.3, 0.03); sc.add(door);
  var awn = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 2), mat(0xc62828)); awn.position.set(0, 3, 0.9); sc.add(awn);
  // sign on facade
  var sc2 = mkCanvas(1024, 160), sg = sc2.getContext('2d'); sg.fillStyle = '#f2efe4'; sg.fillRect(0, 0, 1024, 160); fitText(sg, 'HOLLOW PINES MIDDLE SCHOOL', 512, 84, 960, 80, '"Bungee", Impact', '#7a1010');
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.9), new THREE.MeshBasicMaterial({ map: toTex(sc2, { clamp: true }) })); sign.position.set(0, 6.6, 0.05); sc.add(sign);
  // flagpole, trees, bus
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 10, 8), mat(0xcccccc)); pole.position.set(-8, 5, 4); sc.add(pole);
  var flagC = mkCanvas(128, 80), fg = flagC.getContext('2d'); fg.fillStyle = '#1f3c88'; fg.fillRect(0, 0, 128, 80); fg.fillStyle = '#fff'; fg.fillRect(0, 34, 128, 12); drawStar(fg, 40, 40, 22, '#f7c948');
  var flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4, 10, 1), new THREE.MeshPhongMaterial({ map: toTex(flagC, { clamp: true }), side: THREE.DoubleSide })); flag.position.set(-6.85, 9, 4); sc.add(flag);
  for (var t = 0; t < 26; t++) {
    var tx = (t % 2 ? -1 : 1) * (20 + R() * 25), tz = -20 + R() * 30;
    var tr = new THREE.Group(); var tk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2, 6), mat(0x6d4c2e)); tk.position.y = 1; tr.add(tk);
    for (var k = 0; k < 3; k++) { var c = new THREE.Mesh(new THREE.ConeGeometry(2.2 - k * 0.5, 2.6, 8), mat(0x2e7d32)); c.position.y = 2.6 + k * 1.5; tr.add(c); }
    tr.position.set(tx, 0, tz); tr.scale.setScalar(0.8 + R() * 0.6); sc.add(tr);
  }
  var bus = new THREE.Group();
  var bb = new THREE.Mesh(new THREE.BoxGeometry(10, 2.6, 2.8), mat(0xf5b400)); bb.position.y = 1.8; bus.add(bb);
  var hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 2.6), mat(0xf5b400)); hood.position.set(5.7, 1.15, 0); bus.add(hood);
  for (var b = 0; b < 7; b++) { var bw = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), winM); bw.position.set(-4 + b * 1.25, 2.4, 1.41); bus.add(bw); }
  var stripe = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.15), mat(0x111111)); stripe.position.set(0, 1.5, 1.41); bus.add(stripe);
  [-3, 3.5].forEach(function (wx) { [-1.4, 1.4].forEach(function (wz) { var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14), mat(0x111111)); wh.rotation.x = PI / 2; wh.position.set(wx, 0.5, wz); bus.add(wh); }); });
  bus.position.set(8, 0, 9); sc.add(bus);
  // Professor Hoots
  var h = buildMonsterModel('hoots');
  h.rig.bones[0].userData.y0 = h.rig.bones[0].position.y;
  h.mats.forEach(function (m) { if (m.userData.probeOn) setProbe(m, [0.75, 0.72, 0.68], [0.75, 0.72, 0.68]); });
  h.head.visible = false;
  h.root.position.set(-0.9, 0, 7.2); h.root.rotation.y = 0.2; sc.add(h.root);
  // confetti stars
  var stars = new THREE.Group();
  var starTex = mkCanvas(64, 64); drawStar(starTex.getContext('2d'), 32, 32, 30, '#ffffff');
  var stT = toTex(starTex, { clamp: true });
  var cols = [0xffd84a, 0xff6b9d, 0x7fd3ff, 0x9cff7a, 0xffffff];
  for (var s = 0; s < 40; s++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: stT, color: cols[s % 5], transparent: true })); sp.position.set(R.range(-12, 12), R.range(1, 10), R.range(-2, 8)); sp.scale.setScalar(R.range(0.2, 0.5)); sp.userData.v = R.range(0.3, 1); stars.add(sp); }
  sc.add(stars);
  var cam = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
  TITLE = { scene: sc, cam: cam, hoots: h, t: 0, glitchT: 6, glitch: 0, flag: flag, stars: stars };
}
function updateTitle(dt) {
  var T = TITLE; T.t += dt;
  var asp = RENDER.w / RENDER.h;
  T.cam.aspect = asp; T.cam.fov = asp < 0.7 ? 68 : 52; T.cam.updateProjectionMatrix();
  var a = Math.sin(T.t * 0.12) * 0.25;
  T.cam.position.set(Math.sin(a) * 13, 2.3 + Math.sin(T.t * 0.3) * 0.2, 13 + Math.cos(a) * 1);
  T.cam.lookAt(-1, asp < 0.7 ? 1.1 : 2.6, 2);
  var R2 = T.hoots.rig, B = R2.byName;
  poseReset(R2); animIdle(R2, T.t);
  B.uaR.rotation.z = -2.3 + Math.sin(T.t * 7) * 0.45; B.faR.rotation.z = -0.3;
  B.uaL.rotation.z = 0.4; B.hips.position.y = R2.bones[0].userData.y0 + Math.abs(Math.sin(T.t * 3.5)) * 0.06;
  B.neck.rotation.y = Math.sin(T.t * 0.7) * 0.25;
  var ch = T.hoots.extra.costumeHead; ch.rotation.z = Math.sin(T.t * 3.5) * 0.08; ch.rotation.x = 0;
  T.stars.children.forEach(function (s) { s.position.y -= s.userData.v * dt; s.material.rotation += dt; if (s.position.y < 0) s.position.y = 10; });
  var fp = T.flag.geometry.attributes.position; for (var i = 0; i < fp.count; i++) { var x = fp.getX(i); fp.setZ(i, Math.sin(x * 2 + T.t * 5) * 0.12 * (x + 1.1)); } fp.needsUpdate = true;
  // occasional glitch: something else is on the tape
  T.glitchT -= dt;
  if (T.glitchT < 0) { T.glitch = 0.35; T.glitchT = R.range(7, 14); sfx('staticBurst', null, { len: 0.35 }); }
  if (T.glitch > 0) {
    T.glitch -= dt;
    POSTU.uGlitch.value = 1; POSTU.uTrack.value = 1; POSTU.uTint.value = 1; POSTU.uExposure.value = 0.45;
    ch.rotation.x = -1.2; T.hoots.head.visible = true; T.hoots.head.userData.U.uJaw.value = 0.9;
    if (T.glitch < 0.2 && T.glitch > 0.12) { POSTU.tFace.value = FACE_TEX[40]; POSTU.uFace.value = 0.6; POSTU.uFaceZoom.value = 0.8; } else POSTU.uFace.value = 0;
  } else {
    POSTU.uGlitch.value = 0; POSTU.uTrack.value = 0.05; POSTU.uTint.value = 0; POSTU.uExposure.value = 1.05; POSTU.uFace.value = 0;
    T.hoots.head.visible = false;
  }
  POSTU.uVHS.value = 0.4; POSTU.uFear.value = 0; POSTU.uDesat.value = 0; POSTU.uWarm.value = 0.15; POSTU.uGrain.value = 0.04; POSTU.uBlack.value = 0; POSTU.uRed.value = 0;
  LIGHTU.uTime.value = T.t;
  renderFrame(T.scene, T.cam);
}

// ---- screens -----------------------------------------------------------------
function showWarning() {
  GAME.mode = 'warning';
  showScreen('warning', '<div style="position:absolute;inset:0;background:#000"></div><div class="hp-panel">' +
    '<div style="font:30px Bungee;color:#ff3b30;letter-spacing:.05em">WARNING</div>' +
    '<div class="tw" style="font-size:16px;line-height:1.45;color:#eee;margin:10px 0 4px;max-width:360px">This game contains jump scares, loud sounds, and blood.</div>' +
    '<div style="font:700 14px/1.6 Zen Kaku Gothic New;color:#bbb;max-width:360px">※ホラー演出・急な大きい音・流血表現があります</div>' +
    '<div style="margin:22px 0 6px;font:22px VT323;color:#ddd;letter-spacing:.1em">🎧 HEADPHONES RECOMMENDED</div><div style="font:700 13px Zen Kaku Gothic New;color:#999">イヤホン推奨</div>' +
    '<div id="hp-tap" class="pe" style="margin-top:40px;padding:18px 26px;border:2px solid #fff;border-radius:8px;font:26px Bungee;color:#fff" ><span class="hp-blink">TAP TO START</span><div style="font:700 13px Zen Kaku Gothic New;color:#ccc;margin-top:4px">タップしてスタート</div></div>' +
    '<div style="position:absolute;bottom:0;left:0;right:0;font:13px VT323;color:#555">HOLLOW PINES NIGHT SCHOOL v' + GAME_VERSION + '</div></div>');
  var go = function (e) { e.preventDefault(); unlockAudio(); initLoops(); sfx('ui'); hideScreen('warning'); goTitle(); };
  var tap = document.getElementById('hp-tap');
  UIX.screens.warning.addEventListener('pointerup', go, { once: true });
}
function goTitle() {
  TIMERS.length = 0;
  hideAllScreens();
  UIX.hud.style.display = 'none';
  abortLesson(); removeTeacher(); stopVoice();
  clearMonsters(); clearNPCs();
  INPUT.enabled = false;
  try { if (document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
  if (AU.ready) { setLoop('wind', 0); setLoop('room', 0); setLoop('hum', 0); setLoop('tapehiss', 0); }
  POSTU.uBlack.value = 0; POSTU.uFace.value = 0; POSTU.uInvert.value = 0; POSTU.uRed.value = 0;
  if (!TITLE) buildTitleScene();
  GAME.mode = 'title';
  playBGM('happy', { fade: 1.2 });
  fadeTo(0, 0.6);
  var cont = SAVE.continueNight > 1 ? '<button class="hp-menu-btn alt pe" id="hp-cont">' + bi('CONTINUE · NIGHT ' + SAVE.continueNight, SAVE.continueNight + '夜目から続ける') + '</button>' : '';
  showScreen('title', '<div class="hp-panel" style="justify-content:space-between;padding:4px 0">' +
    '<div id="hp-logo" style="transform:rotate(-4deg);margin-top:18px">' +
    '<div style="font:clamp(40px,12vw,62px)/0.9 \'Luckiest Guy\';color:#ffd84a;-webkit-text-stroke:3px #1b1b1b;text-shadow:0 6px 0 #1b1b1b,0 0 30px rgba(255,255,255,.5)">HOLLOW PINES</div>' +
    '<div style="display:inline-block;margin-top:6px;padding:4px 14px;background:#1f3c88;border:3px solid #1b1b1b;border-radius:10px;font:clamp(20px,6vw,30px) Bungee;color:#fff;box-shadow:0 5px 0 #1b1b1b">NIGHT SCHOOL</div>' +
    '<div style="margin-top:8px;font:700 13px Zen Kaku Gothic New;color:#1b1b1b;text-shadow:0 0 6px #fff">ホロウパインズ夜間学校</div></div>' +
    '<div style="width:100%;padding-bottom:4px">' + cont +
    '<button class="hp-menu-btn pe" id="hp-start">' + bi('START', '入学する') + '</button>' +
    '<div style="display:flex;gap:10px;justify-content:center"><button class="hp-menu-btn alt pe" id="hp-set" style="width:auto;flex:1;max-width:145px;font-size:18px">' + bi('SETTINGS', '設定') + '</button>' +
    '<button class="hp-menu-btn alt2 pe" id="hp-arc" style="width:auto;flex:1;max-width:145px;font-size:18px">' + bi('ARCHIVE', '記録') + '</button></div>' +
    '<div style="font:13px VT323;color:#1b1b1b;opacity:.7">© 1986 MOONLIGHT LEARNING CO. · BEST NIGHT ' + (SAVE.bestNight || 0) + '</div></div></div>');
  onTap(document.getElementById('hp-start'), function () { sfx('ui'); showLetter(); });
  if (cont) onTap(document.getElementById('hp-cont'), function () { sfx('ui'); hideScreen('title'); GAME.hootsRevealed = !!SAVE.hootsRevealed; startNight(SAVE.continueNight); });
  onTap(document.getElementById('hp-set'), function () { sfx('ui'); openSettings(); });
  onTap(document.getElementById('hp-arc'), function () { sfx('ui'); openArchive(); });
}
function showLetter() {
  var html = '<div style="position:absolute;inset:0;background:rgba(20,40,80,.55)"></div><div class="hp-panel"><div class="hp-scroll pe" style="width:min(400px,100%);max-height:100%;background:#fffdf3;border-radius:6px;padding:18px 18px 14px;color:#1b1b1b;text-align:left;box-shadow:0 12px 40px rgba(0,0,0,.5);transform:rotate(1deg);border:8px solid transparent;border-image:repeating-linear-gradient(45deg,#c62828 0 12px,#fff 12px 24px,#1f3c88 24px 36px,#fff 36px 48px) 8">' +
    '<div style="text-align:center"><div style="font:24px \'Luckiest Guy\';color:#1f3c88">★ ADMISSION LETTER ★</div><div style="font:700 12px Zen Kaku Gothic New;color:#555">入学許可証</div></div>' +
    '<canvas id="hp-let-cv" width="200" height="120" style="display:block;margin:6px auto;width:140px;height:84px"></canvas>' +
    '<div class="tw" style="font-size:15px;line-height:1.5">Dear Student,<br><br>Congratulations! You have been accepted to <b>Hollow Pines Night School</b>, a second chance for grown-ups who never got to finish school.<br><br>Classes begin tonight. The bus will pick you up.</div>' +
    '<div style="font:500 12.5px/1.65 Zen Kaku Gothic New;color:#444;margin-top:6px">親愛なる生徒さんへ<br>おめでとう！あなたは「ホロウパインズ夜間学校」への入学を許可されました。学校を卒業できなかった大人のための、もう一度のチャンスです。授業は今夜から。バスが迎えに行きます。</div>' +
    '<div style="margin-top:10px;padding:10px;background:#fff3c4;border-radius:6px"><div class="tw" style="font-size:14px;line-height:1.5"><b>SCHOOL RULES</b><br>1. Attendance is mandatory.<br>2. Be in your seat when the bell rings.<br>3. Never stay in the halls after the lights go out.<br>4. If Professor Hoots asks you to stay after class, <u>say no</u>.</div>' +
    '<div style="font:500 12px/1.6 Zen Kaku Gothic New;color:#444;margin-top:4px">校則　1.出席は義務です。2.ベルが鳴る時は席に着いていること。3.電気が消えた後、廊下に残らないこと。4.フーツ先生に「放課後残りなさい」と言われたら、<u>断ること</u>。</div></div>' +
    '<div class="tw" style="text-align:right;font-size:14px;margin-top:8px">Hoo-ray for learning!<br>— Prof. Hoots, Moonlight Learning Co.</div>' +
    '<button class="hp-menu-btn pe" id="hp-enroll" style="margin-top:12px">' + bi('ENROLL', '入学する') + '</button>' +
    '<button class="hp-x pe" id="hp-let-back" style="width:100%;margin-top:4px">BACK / もどる</button></div></div>';
  showScreen('letter', html);
  var g = document.getElementById('hp-let-cv').getContext('2d'); drawHoots(g, 100, 64, 0.42, { wave: 1 }); drawStar(g, 30, 30, 14, '#f7c948'); drawStar(g, 172, 34, 11, '#f7c948');
  say('Congratulations! You have been accepted to Hollow Pines Night School!', 'cute');
  onTap(document.getElementById('hp-enroll'), function () {
    sfx('win'); SAVE.lore.letter = 1; SAVE.runSeed = (Date.now() & 0xffff) + 1; GAME.missing = []; GAME.carry = []; GAME.hootsRevealed = false; SAVE.hootsRevealed = false; writeSave();
    hideScreen('letter'); hideScreen('title'); startNight(1);
  });
  onTap(document.getElementById('hp-let-back'), function () { sfx('uiBack'); stopVoice(); hideScreen('letter'); });
}
function openSettings(onClose) {
  var S = SAVE.settings;
  function seg(key, vals) { return '<div class="hp-seg">' + vals.map(function (v) { return '<button class="pe ' + (S[key] === v[0] ? 'sel' : '') + '" data-k="' + key + '" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>'; }
  function rng(key, min, max, step) { return '<input class="hp-range pe" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S[key] + '" data-k="' + key + '">'; }
  function rowH(en, ja, ctl) { return '<div class="hp-row"><div class="lbl">' + bi(en, ja) + '</div>' + ctl + '</div>'; }
  var h = '<div style="position:absolute;inset:0;background:rgba(0,0,0,.85)"></div><div class="hp-panel"><div class="hp-dlg hp-scroll pe"><h2>' + bi('SETTINGS', '設定') + '</h2>' +
    rowH('MUSIC', 'BGM音量', rng('bgm', 0, 1, 0.05)) + rowH('SOUND FX', '効果音・声', rng('sfx', 0, 1, 0.05)) + rowH('LOOK SPEED', '視点感度', rng('sens', 0.3, 2.5, 0.05)) +
    rowH('GRAPHICS', '画質', seg('quality', [['AUTO', 'AUTO'], ['LOW', 'LOW'], ['MEDIUM', 'MED'], ['HIGH', 'HIGH']])) +
    rowH('JUMP SCARES', 'ジャンプスケアの強さ', seg('scare', [['NORMAL', 'NORMAL'], ['MILD', 'MILD']])) +
    rowH('INVERT Y', '上下反転', seg('invertY', [[false, 'OFF'], [true, 'ON']])) +
    '<div style="font:500 11px/1.6 Zen Kaku Gothic New;color:#888;margin-top:8px">MILD：叫び声の音量と画面のブレ・点滅を抑えます。<br>AUTO：動作が重いと自動で解像度を下げます。</div>' +
    '<button class="hp-menu-btn pe" id="hp-set-x" style="margin-top:12px">' + bi('DONE', '完了') + '</button></div></div>';
  var s = showScreen('settings', h);
  Array.prototype.forEach.call(s.querySelectorAll('button[data-k]'), function (b) {
    onTap(b, function () {
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); if (v === 'true') v = true; if (v === 'false') v = false;
      S[k] = v; writeSave(); sfx('ui');
      Array.prototype.forEach.call(s.querySelectorAll('button[data-k="' + k + '"]'), function (x) { x.classList.toggle('sel', x === b); });
      if (k === 'quality') applyQuality(v);
    });
  });
  Array.prototype.forEach.call(s.querySelectorAll('input[data-k]'), function (inp) {
    inp.addEventListener('input', function () { S[inp.getAttribute('data-k')] = +inp.value; applyVolumes(); });
    inp.addEventListener('change', function () { writeSave(); sfx('tick'); });
    inp.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  });
  onTap(document.getElementById('hp-set-x'), function () { sfx('uiBack'); hideScreen('settings'); writeSave(); if (onClose) onClose(); });
}
