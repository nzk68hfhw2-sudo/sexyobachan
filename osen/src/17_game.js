// ---- ゲーム本体 ------------------------------------------------------------------------
var G = { pol: 0, stage: 0, tod: 1.3, naiT: 0, naiTarget: 0, naiTimer: 0, paused: true, introOpen: false, area: null, target: null, touches: 0, secrets: {}, metFriends: {},
  statueNext: 0, cloneCount: 0, cleaned: 0, skyHue: 0, skyT: 0, tintT: 0, tintC: null, fogT: 0, fogC: null, fovT: 0, tiltT: 0, tiltA: 0, flipT: 0, crazySkyT: 0,
  t: 0, genki: 80, fiddles: 0, combines: 0, slowT: 0, magnetT: 0, xray: 0, inMenu: false, autoTalkT: 12, waT: 4, wa3dT: 5, gravBreakT: 40, saveT: 10, gazeT: 0, meterTaps: 0, inWaterT: 0, started: false, musicLock: 0, visitedTimes: {}, monoT: 30 };

function areaAt(x, z, y) {
  if (z > 300) return 'nai';
  if (x < -55 && z < -62) return 'jinja';
  if (z < -37 && x > -55) return 'eki';
  if (x < -37 && z > -62 && z < 40) return 'danchi';
  if (x > 25 && x < 75 && z > -37 && z < 27) return 'shoten';
  if (Math.abs(x) < 27 && Math.abs(z) < 27) return 'koen';
  if (z >= 37 && z < 73) return 'kawa';
  if (z >= 73 && x > 25) return 'akichi';
  return null;
}
G.onWalk = function (m, back) {
  if (back) { addPollution(-m * 0.02); if (P.backDist > 30) secret('back'); }
  else addPollution(m * 0.05);
};
function enterWorld() {
  G.started = true; G.inMenu = false; H.hud.style.display = ''; updatePause();
  if (MENU.el) { MENU.el.remove(); MENU.el = null; }
  bgmPlay(G.area ? G.area.id : 'eki'); snapCamera();
  sysMsg(PLAYER.channel ? PLAYER.server + '　' + PLAYER.channel + 'に入りました。' : '町に入りました。');
  if (NET && NET.join) NET.join();
  G.onStart();
  if (!PLAYER.helpSeen) { PLAYER.helpSeen = true; setTimeout(openHelp, 600); saveGame(); }
}
G.onStart = function () {
  G.started = true;
  if (!G.loadedPos) { caption('……ここは　どこだろう。とりあえず　歩いてみよう。', { preset: 'type' }); }
  else caption('おかえりなさい。汚染率は　そのままです。', { preset: 'fade' });
  G.area = null;
};
function saveGame() {
  try {
    var counts = {}; PROPS.forEach(function (p) { if (p.count) counts[p.def.id] = p.count; });
    STORE.save({ v: 2, pl: { c: PLAYER.char, n: PLAYER.name, nc: PLAYER.nameCode, s: PLAYER.server, ch: PLAYER.channel, a: PLAYER.agreed, h: PLAYER.helpSeen }, bag: BAG.items, gk: G.genki, fi: G.fiddles, cb: G.combines, cam: CAM.distT, pol: G.pol, tod: G.tod, z: ZUKAN.found, c: counts, s: G.secrets, m: G.metFriends, bgm: AUD.bgmOn, sfx: AUD.sfxOn, lite: LITE.on, red: REDUCED.on, cl: G.cleaned,
      pos: P.pos && P.pos.z < 300 ? [P.pos.x, P.pos.y, P.pos.z, P.face] : null });
  } catch (e) {}
}
function loadGame() {
  var d = STORE.load(); if (!d || (d.v !== 1 && d.v !== 2)) return null;
  if (d.pl) { PLAYER.char = d.pl.c || 0; PLAYER.name = d.pl.n || ''; PLAYER.server = d.pl.s || ''; PLAYER.channel = d.pl.ch || ''; PLAYER.agreed = !!d.pl.a; PLAYER.helpSeen = !!d.pl.h; PLAYER.nameCode = d.pl.nc || ''; if (!PLAYER.nameCode) PLAYER.name = ''; }
  if (d.bag) BAG.items = d.bag.filter(function (e) { return e && (EXTRA_TYPES[e.type] || ITEM_INFO[e.type]); });
  if (d.gk != null) G.genki = d.gk; G.fiddles = d.fi || 0; G.combines = d.cb || 0; if (d.cam) CAM.distT = d.cam;
  G.pol = +d.pol || 0; G.tod = +d.tod || 1.3; ZUKAN.found = d.z || {}; G.secrets = d.s || {}; G.metFriends = d.m || {}; G.cleaned = d.cl || 0;
  AUD.bgmOn = d.bgm !== false; AUD.sfxOn = d.sfx !== false; LITE.on = !!d.lite; REDUCED.on = !!d.red;
  return d;
}
function applyLoaded(d) {
  if (!d) return;
  if (d.c) PROPS.forEach(function (p) { if (d.c[p.def.id]) p.count = d.c[p.def.id]; });
  if (d.pos) { teleport(d.pos[0], d.pos[1], d.pos[2], d.pos[3]); G.loadedPos = true; }
  G.stage = stageOf(G.pol); onStageChange(-1, G.stage); _polShown = null; _hpShown = -1;
}
var _fogBase = { near: 45, far: 230 }, _tmpC = null;
function updateGame(dt) {
  var t = G.t += dt;
  U.uTime.value = t;
  // --- 時間 ---
  if (!G.paused) G.tod = (G.tod + dt / 110) % 4;
  if (G.naiTimer > 0) { G.naiTimer -= dt; if (G.naiTimer <= 0) G.naiTarget = 0; }
  if (G.stage >= 9) G.naiTarget = 1;
  if (G.stage >= 6 && G.stage < 9 && Math.random() < dt / 90 && G.naiTimer <= 0) { G.naiTarget = 1; G.naiTimer = 20; }
  G.naiT = lerp(G.naiT, G.naiTarget, 1 - Math.exp(-dt * 0.8));
  var tIdx = G.naiT > 0.5 ? 4 : Math.floor(G.tod + 0.35) % 4;
  if (G.started && !G.visitedTimes[tIdx]) { G.visitedTimes[tIdx] = 1; zukanFind('t_' + TIMES[tIdx].id, '時間帯：' + TIMES[tIdx].name); if (t > 5) { popWA(TIMES[tIdx].wa, { style: [4, 2, 6, 12, 10][tIdx], y: 0.2, size: 60 }); } }
  var tl = TIMES[tIdx].name + (G.area ? '　' + G.area.name : '　道'); if (H.time._t !== tl) { H.time._t = tl; H.time.innerHTML = cnHTML(tl); H.stArea.innerHTML = cnHTML('◆' + (G.area ? G.area.wa : '道') + ' ' + (NET && NET.on ? '（' + NET.count() + '人）' : '')); }
  var crazy = (G.crazySkyT > 0 ? 1 : 0) * 0.85 + (G.pol >= 130 ? Math.min(0.7, (G.pol - 130) / 100) : 0);
  if (G.crazySkyT > 0) G.crazySkyT -= dt;
  var lamps = applyTimeOfDay(G.tod, G.naiT, Math.min(1, crazy), t);
  if (G.skyT > 0) { G.skyT -= dt; if (!_tmpC) _tmpC = new THREE.Color(); _tmpC.setHSL(G.skyHue, 0.9, 0.55); var k = Math.min(1, G.skyT / 3, (25 - G.skyT) / 2); R.skyU.top.value.lerp(_tmpC, k); _tmpC.setHSL((G.skyHue + 0.3) % 1, 0.9, 0.7); R.skyU.mid.value.lerp(_tmpC, k); R.scene.fog.color.lerp(_tmpC, k * 0.6); }
  // 夜の明かり
  var night = clamp(lamps, 0, 1);
  WORLD.glowMat.opacity = night * 0.8;
  WORLD.bulbs.material.color.setRGB(0.6 + 0.4 * night, 0.6 + 0.35 * night, 0.5 + 0.2 * night);
  ['danchi', 'danchiS', 'shop', 'station', 'house'].forEach(function (k) { MATS[k].emissive.setRGB(night * 0.9, night * 0.8, night * 0.55); });
  // フォグ
  var fn = _fogBase.near, ff = _fogBase.far;
  if (G.fogT > 0) { G.fogT -= dt; var fk = Math.min(1, G.fogT / 2, (12 - G.fogT) / 1.5); fn = lerp(fn, 2, fk); ff = lerp(ff, 28, fk); R.scene.fog.color.lerp(G.fogC, fk); }
  if (P.pos.z > 300) { fn = 30; ff = 80; }
  R.scene.fog.near = fn; R.scene.fog.far = ff;
  // 太陽・影の追従
  var sd = R.skyU.sunDir.value; var lightDir = sd.y > 0.05 ? sd : _tmp2.set(-sd.x, 0.8, -sd.z).normalize();
  R.sun.position.set(P.pos.x + lightDir.x * 60, P.pos.y + lightDir.y * 60, P.pos.z + lightDir.z * 60);
  R.sun.target.position.set(P.pos.x, P.pos.y, P.pos.z);
  R.sky.position.copy(R.camera.position);
  // --- プレイヤー ---
  if (G.inMenu && !CS.on) { // ログイン画面：町の上をゆっくり回るカメラ
    var ang = t * 0.05; R.camera.position.set(Math.sin(ang) * 60, 38, Math.cos(ang) * 60); R.camera.lookAt(0, 0, 0);
  } else updatePlayer(dt);
  // カメラ演出
  var fov = 70 + (G.fovT > 0 ? Math.sin((6 - G.fovT) / 6 * PI) * (REDUCED.on ? 10 : 35) : 0) + (G.stage >= 7 && !REDUCED.on ? Math.sin(t * 0.4) * 4 : 0);
  if (G.fovT > 0) G.fovT -= dt;
  if (Math.abs(R.camera.fov - fov) > 0.01) { R.camera.fov = fov; R.camera.updateProjectionMatrix(); }
  var roll = 0; if (G.tiltT > 0) { G.tiltT -= dt; roll = G.tiltA * Math.sin(Math.min(1, (5 - G.tiltT) / 0.8, G.tiltT / 0.8) * PI / 2); }
  if (G.stage >= 3 && !REDUCED.on) roll += Math.sin(t * 0.3) * 0.015 * Math.min(4, G.stage - 2);
  P.roll = lerp(P.roll || 0, roll, 1 - Math.exp(-dt * 5));
  if (G.flipT > 0) { G.flipT -= dt; CANVAS_HOST.style.transform = G.flipT > 0 ? 'scaleX(-1)' : ''; }
  // --- エリア ---
  var aid = areaAt(P.pos.x, P.pos.z, P.pos.y);
  if (aid && (!G.area || G.area.id !== aid)) {
    var a = AREAS.filter(function (x) { return x.id === aid; })[0]; G.area = a;
    if (G.started) {
      popWA(a.wa, { style: a.style, y: 0.2, size: 80, anim: 'waPop', dur: 2.8 }); caption(a.sub + '　　' + pick(MONOLOGUE), { preset: pick(['flyL', 'fade', 'type']), now: true });
      zukanFind('a_' + aid, a.name);
      if (G.musicLock <= 0) bgmPlay(aid);
    }
  }
  if (G.musicLock > 0) { G.musicLock -= dt; if (G.musicLock <= 0 && G.area) bgmPlay(G.area.id); }
  // --- ねらい ---
  var tg = (G.paused || G.inMenu) ? null : findTarget(); G.target = tg; setCross(tg);
  if (tg) { G.gazeT += dt; addPollution(dt * 0.15); } else G.gazeT = 0;
  // ボタンの表示を、いまできる事に合わせる
  var held = ITEMS.held;
  if (held) setMainBtn('置く', 'put'); else if (tg && tg.item) setMainBtn('持つ', 'grab'); else setMainBtn('さわる', 'touch');
  var showSub = !!(held || (tg && tg.item));
  H.bSub.style.display = IN.isTouch && showSub ? '' : 'none'; H.bTouch2.style.display = IN.isTouch && tg && tg.prop && tg.item && !held ? '' : 'none';
  H.hold.style.display = showSub ? 'flex' : 'none'; H.holdBtns[0].classList.toggle('off', !held);
  if (!G.paused && !G.inMenu) {
    if (IN.main) { IN.main = false; if (held) release(false); else if (tg && tg.item) grab(tg.item); else if (tg && tg.prop) touchProp(tg.prop); }
    if (IN.touch2) { IN.touch2 = false; if (tg && tg.prop) touchProp(tg.prop); }
    itemActions(tg);
  }
  IN.main = IN.touch2 = false;
  G.genki = clamp(G.genki - dt * (0.05 + G.stage * 0.02), 0, 100);
  if (G.genki <= 0 && !G._tired) { G._tired = true; sysMsg('げんきが　なくなった。何か食べて下さい（おにぎり・みかん・缶など）。'); }
  if (G.genki > 5) G._tired = false;
  P.speedMul = G.genki <= 0 && P.speedT <= 0 ? 0.6 : (P.speedT > 0 ? P.speedMul : 1);
  // --- 汚染の時間経過 ---
  if (G.started && !G.paused) addPollution(dt * 0.012);
  var st = stageOf(G.pol); if (st !== G.stage) { var pv = G.stage; G.stage = st; onStageChange(pv, st); }
  if (G.pol >= 100) secret('over100');
  applyPollutionFX(dt, t);
  // テレポート（物置）
  WORLD.teleports.forEach(function (tp) { if (P.pos.x > tp.x0 && P.pos.x < tp.x1 && P.pos.z > tp.z0 && P.pos.z < tp.z1 && P.pos.y < 2) teleportNai(); });
  // 隠し要素のチェック
  if (P.stillT > 20 && G.started) { secret('still'); }
  if (P.lookUpT > 8) { secret('lookup'); P.lookUpT = -30; }
  if (P.jumps >= 50) secret('jump50');
  if (P.pos.y > 8.5 && P.pos.x > -19 && P.pos.x < 19 && P.pos.z < -69 && P.pos.z > -86) secret('roof');
  if (P.pos.y > 14.5 && P.pos.x < -50 && P.pos.z > 14 && P.pos.z < 28) secret('danchiRoof');
  if (P.inWater) { G.inWaterT += dt; if (G.inWaterT > 30) secret('bath'); } else G.inWaterT = 0;
  if (tIdx === 3 && Math.hypot(P.pos.x, P.pos.z) < 6) secret('nightPark');
  // ひとりごと（たまに）
  G.monoT -= dt; if (G.monoT <= 0 && G.started && !G.paused) { G.monoT = rand(35, 70); if (G.stage < 5) caption(pick(MONOLOGUE), { preset: 'fade' }); }
  // 保存
  G.saveT -= dt; if (G.saveT <= 0) { G.saveT = 10; saveGame(); }
  updateItems(dt); updateNPCs(dt);
  updateProps(dt, t); updateFriends(dt, t); updateWA3D(dt, t); updateCaptions(dt);
  if (!G.inMenu) updateHUD(dt);
  if (NET && NET.update) NET.update(dt);
  if (WORLD.clockHands) WORLD.clockHands.forEach(function (h, i) { h.rotation.z = -(i % 2 ? G.tod / 4 * TAU : G.tod * 13 * TAU) * (i >= 2 ? -1 : 1); });
  // 水
  if (TEX.water) { TEX.water.offset.x = (t * 0.03 * (G.stage >= 5 ? -1 : 1)) % 1; TEX.water.offset.y = Math.sin(t * 0.3) * 0.05; }
  // レンズフレア
  var sunVis = clamp(R.skyU.sunDir.value.y * 4, 0, 1) * (1 - night) * (P.pos.z > 300 ? 0 : 1);
  updateFlare(R.skyU.sunDir.value, sunVis);
}
var _tmp2 = null;
function applyPollutionFX(dt, t) {
  var p = G.pol, s = G.stage, red = REDUCED.on ? 0.4 : 1;
  U.uDef.value = smooth((p - 42) / 45) * (1 + (p > 130 ? Math.min(1.5, (p - 130) / 100) : 0)) * (REDUCED.on ? 0.6 : 1);
  U.uWob.value = p > 200 && !REDUCED.on ? 0.4 : 0;
  var pu = R.postU;
  pu.t.value = t;
  pu.ab.value = (s >= 2 ? Math.min(3.5, 0.5 + (p - 25) / 14) : 0) * red * (1 + 0.4 * Math.sin(t * 1.3));
  pu.hue.value = s >= 2 ? Math.sin(t * 0.15) * Math.min(0.6, (p - 25) / 120) * red + (p > 130 ? t * 0.05 * red : 0) : 0;
  pu.wave.value = s >= 3 && !REDUCED.on ? Math.min(1.6, (p - 42) / 30) : 0;
  pu.sat.value = 1 + (s >= 1 ? Math.min(0.6, p / 150) : 0);
  pu.poster.value = s >= 8 ? Math.min(0.8, (p - 130) / 80) * red : 0;
  pu.split.value = s >= 9 && !REDUCED.on ? 1 : 0;
  pu.vig.value = 0.25 + (s >= 3 ? 0.15 : 0);
  if (G.tintT > 0) { G.tintT -= dt; var tk = Math.min(1, G.tintT / 1.5, (10 - G.tintT) / 1) * red; pu.tint.value.setRGB(1, 1, 1).lerp(G.tintC, tk); } else pu.tint.value.setRGB(1, 1, 1);
  if (!G.started || G.paused) return;
  // 第四段階：友達がふえる
  if (s >= 4) {
    G.spawnFT = (G.spawnFT || 0) - dt;
    var cap = (LITE.on || R.quality < 2) ? 14 : 30 + (s >= 8 ? 20 : 0);
    if (G.spawnFT <= 0 && G.cloneCount < cap) {
      G.spawnFT = rand(3, 7) / (1 + (s - 4) * 0.5);
      var a = rand(0, TAU), r = rand(10, 25), x = P.pos.x + Math.cos(a) * r, z = P.pos.z + Math.sin(a) * r;
      if (P.pos.z < 300) { var f = addFriend(randi(0, 7), x, groundAt(x, z, P.pos.y + 4, 0.3), z, rand(0, TAU), rand(0.8, 1.6) * (s >= 8 ? 2 : 1), { clone: true, lo: true, col: false }); f.wander = true; f.life = 90; f.popIn = 0; G.cloneCount++; }
    }
  }
  // 第五段階：字幕が勝手にしゃべる
  if (s >= 5) { G.autoTalkT -= dt; if (G.autoTalkT <= 0) { G.autoTalkT = rand(8, 15) / (s >= 9 ? 1.8 : 1); var line = pick(AUTO_TALK); caption2(line); var n = 0, iv = setInterval(function () { if (n++ > Math.min(24, line.length)) return clearInterval(iv); sfx('babble', n * 31 + line.length); }, 60); if (s >= 9) setTimeout(function () { caption(pick(AUTO_TALK), { preset: 'wave', speak: true }); }, 900); } }
  // 第六段階：ワードアートあふれ
  if (s >= 6) {
    G.waT -= dt; if (G.waT <= 0) { G.waT = rand(1.4, 3.2) * (REDUCED.on ? 3 : 1) / (s >= 8 ? 1.6 : 1); popWA(pick(BIG_WORDS.concat(AUTO_TALK.map(function (l) { return l.slice(0, 8); }))), { x: rand(0.15, 0.85), y: rand(0.15, 0.6), scale: rand(0.4, 0.8), silent: Math.random() < 0.6 }); }
    G.wa3dT -= dt; if (G.wa3dT <= 0) { G.wa3dT = rand(1.5, 4); spawnWA3D(); }
  }
  // 100%より上：重力がたまに休憩
  if (s >= 8) { G.gravBreakT -= dt; if (G.gravBreakT <= 0) { G.gravBreakT = rand(30, 60); P.gravMul = 0.25; P.gravT = 6; caption2('重力が　休憩に入りました（６秒）'); } }
}
// ---- メーターをたたく（隠し） -------------------------------------------------------------
function initMeterTap() {
  H.gPol.classList.add('pe');
  tapBtn(H.gPol, function () { G.meterTaps++; if (G.meterTaps >= 7) { secret('meter'); addPollution(15); popWA('＋１５％', { style: 3, x: 0.3, y: 0.2, size: 50, anim: 'waFloat' }); } else { sfx('boing'); } });
}
// ---- メインループ --------------------------------------------------------------------------
var _last = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  var tnow = ts || now(); var raw = Math.max(0.001, (tnow - _last) / 1000), dt = Math.min(0.05, raw); _last = tnow;
  try {
    updateGame(dt);
    autoQuality(Math.min(raw, 0.5));
    if (CS.on) { renderCharSel(dt); return; }
    var usePost = !LITE.on && R.quality >= 1 && (G.stage >= 1 || G.tintT > 0);
    if (usePost) { ensureRT(); R.renderer.setRenderTarget(R.rt); R.renderer.render(R.scene, R.camera); R.renderer.setRenderTarget(null); R.renderer.render(R.postScene, R.postCam); }
    else R.renderer.render(R.scene, R.camera);
  } catch (e) {
    if (!G._errShown) { G._errShown = true; showFatal('ゲーム中にエラーが起きました', (e && e.message) + '\n' + (e && e.stack || '').split('\n').slice(0, 4).join('\n')); }
  }
}
