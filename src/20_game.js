// game-time timers (pause-safe; only tick while playing)
var TIMERS = [], TIMER_ID = 0;
function setTimeoutG(fn, ms) { var id = ++TIMER_ID; TIMERS.push({ id: id, t: (ms || 0) / 1000, fn: fn }); return id; }
function clearTimeoutG(id) { for (var i = 0; i < TIMERS.length; i++) if (TIMERS[i].id === id) { TIMERS.splice(i, 1); return; } }
function updateTimers(dt) { for (var i = 0; i < TIMERS.length; i++) TIMERS[i].t -= dt; var due = TIMERS.filter(function (t) { return t.t <= 0; }); if (!due.length) return; TIMERS = TIMERS.filter(function (t) { return t.t > 0; }); due.forEach(function (t) { try { t.fn(); } catch (e) { console.error(e); } }); }
// ---- game flow ------------------------------------------------------------------
var GAME = { mode: 'boot', phase: '', night: 1, lost: [], clock: 0, schedule: [], period: 0, timer: 0, items: [], hint: 0, mapReveal: {}, stats: {}, raidDone: false, lightMix: 1, lightTarget: 1, lessonLookAt: false, cut: false };
var CHAPTERS = [
  null,
  ['ORIENTATION', 'オリエンテーション'], ['DETENTION', '居残り'], ['PARENT-TEACHER NIGHT', '保護者面談の夜'], ['PICTURE DAY', '写真撮影の日'], ['GRADUATION', '卒業式']
];
var PERIOD_LABEL = [['1ST PERIOD', '1時間目'], ['2ND PERIOD', '2時間目'], ['LUNCH', '昼休み'], ['3RD PERIOD', '3時間目'], ['4TH PERIOD', '4時間目'], ['DISMISSAL', '下校']];
var DEATH_LINES = {
  student0: ["YOU'RE LATE FOR CLASS.", '遅刻だよ。'], crawler: ['NO RUNNING IN THE HALLS.', '廊下は走っちゃだめ。'], gaper: ['INDOOR VOICES, PLEASE.', '静かにね。'],
  smiles: ["SMILE! YOU'RE ON CAMERA.", '笑って。撮ってるよ。'], static: ['PLEASE STAND BY.', 'しばらくお待ちください。'], hoots: ['SEE ME AFTER CLASS.', '放課後、残りなさい。'], bell: ['THERE WAS NO SEAT FOR YOU.', 'あなたの席は、なかった。']
};
function nightParams(n) {
  return {
    transit: Math.max(45, [0, 90, 80, 70, 62, 55][Math.min(n, 5)] - Math.max(0, n - 5) * 2),
    deficit: n <= 2 ? 1 : (n <= 5 ? 2 : 3),
    npcs: Math.min(9, 6 + Math.min(n, 3)),
    maxMon: Math.min(4, n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 3 : 4),
    raid: n <= 1 ? 0.0 : Math.min(0.85, 0.35 + n * 0.1)
  };
}
function monstersForNight(n) {
  var pool = ['student0'];
  if (n >= 2) pool.push('crawler');
  if (n >= 3) pool.push('gaper', 'hoots');
  if (n >= 4) pool.push('smiles');
  if (n >= 5) pool.push('static');
  if (n <= 5) { // story order: newest first, then fill
    var list = [];
    var newest = { 1: 'student0', 2: 'crawler', 3: 'gaper', 4: 'smiles', 5: 'static' }[n];
    list.push(newest);
    if (n >= 3 && list.indexOf('hoots') < 0 && GAME.hootsRevealed) list.push('hoots');
    var rest = R.shuffle(pool.filter(function (t) { return list.indexOf(t) < 0 && (t !== 'hoots' || GAME.hootsRevealed); }));
    while (list.length < nightParams(n).maxMon && rest.length) list.push(rest.pop());
    return list;
  }
  return R.shuffle(pool).slice(0, nightParams(n).maxMon);
}

// ---------------------------------------------------------------------------
function disposeWorld() {
  if (!WORLD) return;
  RENDER.scene.remove(WORLD.group);
  WORLD.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
  WORLD = null;
  WORLD_GLASS.length = 0; for (var k in WORLD_GLASS_KEYS) delete WORLD_GLASS_KEYS[k];
  TV_MATS.length = 0;
  GAME.items.forEach(function (it) { if (it.mesh) RENDER.scene.remove(it.mesh); }); GAME.items = [];
  if (WFACE) { RENDER.scene.remove(WFACE); WFACE = null; }
}
async function startNight(n, fromRetry) {
  TIMERS.length = 0;
  GAME.mode = 'loading'; GAME.night = n; GAME.cut = true;
  INPUT.enabled = false;
  hideAllScreens(); UIX.hud.style.display = 'none';
  stopVoice();
  playBGM(null, { fade: 0.8 });
  await fadeTo(1, 0.6);
  showChapterCard(n);
  await wait(0.05);
  // build
  var t0 = performance.now();
  clearMonsters(); clearNPCs(); disposeWorld();
  var seed = (n * 7919 + (SAVE.runSeed || 1) * 104729 + (fromRetry ? 0 : 0)) >>> 0;
  GAME.rnd = makeRNG(seed ^ 0xa5a5);
  var M = generateMap(seed);
  buildWorld(M);
  RENDER.scene.add(WORLD.group);
  paintPosters(M, n, GAME.missing || []);
  paintBoards();
  setupSchedule(M, GAME.rnd);
  var P = nightParams(n);
  makeNPCs(n, P.npcs, GAME.rnd);
  GAME.lost = []; GAME.stats = { lost: 0, lore: 0, start: now() };
  GAME.items = []; GAME.period = 0; GAME.raidDone = false; GAME.hint = 0; GAME.mapReveal = {};
  newPlayer(1, 0, 0, 0);
  PL.inv = ['flashlight']; PL.battery = 100; if (n >= 2) PL.inv.push('chalk');
  if (GAME.carry) { GAME.carry.forEach(function (i) { if (i !== 'flashlight') PL.inv.push(i); }); }
  renderInventory();
  // first period: everyone seated in homeroom
  var room = GAME.schedule[0].room;
  room.chairs.forEach(function (c) { c.avail = true; c.occ = -1; setChairPose(c, 'normal'); });
  var free = room.chairs.slice();
  var pc = free.splice(GAME.rnd.int(0, Math.min(5, free.length - 1)), 1)[0];
  seatPlayer(pc, true);
  NPCS.forEach(function (np, i) { if (free.length) npcSeat(np, free.shift()); });
  NPCS.forEach(function (np) { finishNPC(np, 0.016); });
  setLights(1, true);
  // warm up shaders (avoid first-frame stalls)
  try { RENDER.renderer.compile(RENDER.scene, RENDER.camera); } catch (e) {}
  var buildMs = performance.now() - t0;
  window.__lastBuildMs = buildMs;
  await wait(Math.max(0.2, 2.2 - buildMs / 1000));
  GAME.mode = 'play'; GAME.cut = false;
  hideScreen('chapter');
  UIX.hud.style.display = '';
  INPUT.enabled = true;
  await fadeTo(0, 0.8);
  playBGM('nursery', { fade: 1.5, restart: true });
  SAVE.continueNight = n; writeSave();
  beginLesson(0);
}
function setupSchedule(M, rnd) {
  var lessonRooms = M.slots.filter(function (r) { return ROLE_INFO[r.role].lesson; });
  rnd.shuffle(lessonRooms);
  var four = lessonRooms.slice(0, 4);
  GAME.schedule = [
    { kind: 'class', room: four[0] }, { kind: 'class', room: four[1] }, { kind: 'lunch', room: M.cafe },
    { kind: 'class', room: four[2] }, { kind: 'class', room: four[3] }, { kind: 'bus', room: M.busRoom }
  ];
  GAME.schedule.forEach(function (s, i) { s.label = PERIOD_LABEL[i]; });
  // raid period choice
  var P = nightParams(GAME.night);
  GAME.raidPeriods = {};
  if (GAME.night === 1) GAME.raidPeriods[1] = true;
  else { [0, 1, 3, 4].forEach(function (i) { if (i > 0 && rnd() < P.raid) GAME.raidPeriods[i] = true; }); if (!GAME.raidPeriods[1] && !GAME.raidPeriods[3] && !GAME.raidPeriods[4]) GAME.raidPeriods[rnd.pick([1, 3, 4])] = true; }
  if (GAME.night === 3 && !GAME.hootsRevealed) GAME.hootsRevealPeriod = 3;
}
function paintBoards() {
  WORLD.specials.boards.forEach(function (bd) {
    var r = MAP.rooms[bd.room];
    var info = ROLE_INFO[r.role];
    var lines = bd.lines || [{ t: info.en + ' — Rm ' + r.number, size: 46 }, { t: 'Teacher: Prof. Hoots', size: 30 }, { t: GAME.night >= 2 ? 'Attendance: ' + (GAME.night >= 4 ? 'FOREVER' : 'MANDATORY') : 'Welcome, Night Students!', size: 30 }];
    if (GAME.night >= 3 && R() < 0.3) lines = lines.concat([{ t: 'THERE IS ALWAYS ONE LESS CHAIR', size: 26, color: 'rgba(255,200,200,0.85)' }]);
    var c = texChalkboard(lines, bd.room * 3 + GAME.night);
    var old = bd.mesh.material.map; bd.mesh.material.map = toTex(c, { clamp: true }); bd.mesh.material.needsUpdate = true; if (old) old.dispose();
  });
}
function showChapterCard(n) {
  var ch = CHAPTERS[n] || ['SUMMER SCHOOL — NIGHT ' + n, '夏期講習 ' + n + '夜目'];
  showScreen('chapter', '<div class="hp-black" style="position:absolute;inset:0"></div><div class="hp-chapter"><div class="n">NIGHT ' + n + ' · CHAPTER ' + n + '</div><div class="t">' + ch[0] + '</div><span class="ja">' + ch[1] + '</span><div class="s">HOLLOW PINES NIGHT SCHOOL · TAPE ' + (100 + n) + ' · SP</div></div><div class="hp-loading hp-blink">▶ PLAY</div>');
}

// ---- lights -------------------------------------------------------------------
var FLICK = { t: 0, amt: 0, groups: [1, 1, 1, 1, 1, 1, 1, 1] };
function setLights(on, instant) {
  GAME.lightTarget = on ? 1 : 0;
  if (instant) { GAME.lightMix = GAME.lightTarget; LIGHTU.uMix.value = GAME.lightMix; }
}
function updateLights(dt) {
  if (GAME.lightTarget === 1 && GAME.lightMix < 1) {
    GAME._onT = (GAME._onT || 0) + dt;
    // fluorescent start: blink a few times
    var t = GAME._onT; var v = t < 0.15 ? 0 : t < 0.25 ? 1 : t < 0.4 ? 0 : t < 0.5 ? 0.8 : t < 0.65 ? 0.2 : Math.min(1, (t - 0.65) * 4 + 0.6);
    GAME.lightMix = v >= 1 ? 1 : v;
  } else if (GAME.lightTarget === 0) { GAME.lightMix = 0; GAME._onT = 0; }
  else GAME._onT = 0;
  LIGHTU.uMix.value = GAME.lightMix;
  // flicker per group
  FLICK.t += dt;
  var amt = FLICK.amt + (GAME.night >= 3 ? 0.04 : 0.015);
  for (var g = 0; g < 8; g++) {
    var f = 1;
    var n = Math.sin(FLICK.t * (13 + g * 3.1) + g * 7) * Math.sin(FLICK.t * (7.3 + g) + g);
    if (n > 1 - amt * 2) f = 0.25 + R() * 0.5;
    if (FLICK.amt > 0.5 && R() < FLICK.amt * 0.3) f = R() * 0.3;
    FLICK.groups[g] = damp(FLICK.groups[g], f, 30, dt);
    LIGHTU.uFlick.value[g] = FLICK.groups[g];
  }
  LIGHTU.uEmerg.value = 0.85 + Math.sin(FLICK.t * 31) * 0.05 + (Math.sin(FLICK.t * 2.3) > 0.97 ? -0.6 : 0);
  if (AU.ready) setLoop('hum', GAME.lightMix > 0.5 && GAME.mode === 'play' ? 0.03 * (0.6 + FLICK.amt) : 0, 0.1);
}
function lightsOut() {
  setLights(0, true);
  playBGM(null, { cut: true });
  sfx('lightsOut');
  POSTU.uFlash.value = 0;
  if (AU.ready) { setLoop('wind', 0.05, 1); setLoop('room', 0.08, 1); }
}
function lightsOn() {
  setLights(1);
  sfx('lightsOn');
  setTimeoutG(function () { if (GAME.mode === 'play') playBGM('nursery', { fade: 1.2 }); }, 700);
  if (AU.ready) { setLoop('wind', 0.0, 1); setLoop('room', 0.02, 1); }
  MONSTERS.forEach(function (m) { if (!m.raidKeep) { m.active = false; m.mdl.root.visible = false; } });
  WORLD.specials.tvs.forEach(tvOff);
}

// ---- player seat / hide --------------------------------------------------------
function seatPlayer(c, instant) {
  if (PL.seated) PL.seated.occ = -1;
  PL.seated = c; c.occ = -2; c.claim = -2;
  PL.li = c.li; PL.x = c.x; PL.z = c.z; PL.yaw = c.rot + PI; PL.pitch = -0.05; PL.vx = PL.vz = 0; PL.crouch = false;
  PL.y = LV_Y[c.li];
  if (!instant) sfx('thump');
}
function standPlayer() {
  var c = PL.seated; if (!c) return;
  c.occ = -1; c.claim = -1; PL.seated = null;
  // step out sideways or backward to a passable cell
  var cands = [[-Math.sin(c.rot) * 0.55, -Math.cos(c.rot) * 0.55], [Math.cos(c.rot) * 0.6, -Math.sin(c.rot) * 0.6], [-Math.cos(c.rot) * 0.6, Math.sin(c.rot) * 0.6], [0, 0]];
  for (var i = 0; i < cands.length; i++) { var x = c.x + cands[i][0], z = c.z + cands[i][1]; if (!blockedAt(c.li, x, z)) { PL.x = x; PL.z = z; break; } }
}
function enterHide(h) {
  PL.hidden = h; h.occ = 'P';
  PL.hideFrom = { x: PL.x, z: PL.z };
  PL.yaw = h.rot + PI; PL.pitch = 0; PL.vx = PL.vz = 0;
  // did a monster see me hide?
  PL.sawHide = MONSTERS.some(function (m) { return m.active && m.visible && m.state === 'chase' && m.li === PL.li && dist2(m.x, m.z, PL.x, PL.z) < 100 && losClear(m.li, m.x, m.z, PL.x, PL.z); });
  if (h.type === 'locker') { sfx('lockerClose', { li: h.li, x: h.x, z: h.z }); emitNoise(h.li, h.x, h.z, 4, 'locker'); }
  else if (h.type === 'stall') sfx('door', { li: h.li, x: h.x, z: h.z });
  else sfx('paper');
  showHideOverlay(h.type);
}
function exitHide() {
  var h = PL.hidden; if (!h) return;
  h.occ = null; PL.hidden = null; PL.sawHide = false;
  PL.x = h.ex; PL.z = h.ez;
  if (blockedAt(h.li, PL.x, PL.z) && PL.hideFrom) { PL.x = PL.hideFrom.x; PL.z = PL.hideFrom.z; }
  if (h.type === 'locker') sfx('lockerOpen', { li: h.li, x: h.x, z: h.z });
  showHideOverlay(null);
}
var HIDE_OV = null;
function showHideOverlay(type) {
  if (!HIDE_OV) {
    HIDE_OV = new THREE.Group(); RENDER.camera.add(HIDE_OV);
    // locker vents (slats)
    var slat = new THREE.MeshBasicMaterial({ color: 0x050505, fog: false });
    var lk = new THREE.Group(); lk.name = 'locker';
    for (var i = 0; i < 9; i++) { var b = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.032), slat); b.position.set(0, -0.15 + i * 0.045, -0.12); lk.add(b); }
    var fr1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), slat); fr1.position.set(0, 0.36, -0.12); lk.add(fr1);
    var fr2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), slat); fr2.position.set(0, -0.33, -0.12); lk.add(fr2);
    var fr3 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.4), slat); fr3.position.set(-0.2, 0.05, -0.119); lk.add(fr3);
    var fr4 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.4), slat); fr4.position.set(0.2, 0.05, -0.119); lk.add(fr4);
    HIDE_OV.add(lk);
    var st = new THREE.Group(); st.name = 'stall'; // stall door gap
    var sd = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshBasicMaterial({ color: 0x0d1210, fog: false })); sd.position.set(-0.035, 0, -0.12); sd.scale.x = 0.9; st.add(sd);
    var sd2 = sd.clone(); sd2.position.x = 0.27; st.add(sd2);
    HIDE_OV.add(st);
    var bl = new THREE.Group(); bl.name = 'bleacher';
    for (var j = 0; j < 4; j++) { var p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.05), new THREE.MeshBasicMaterial({ color: 0x1b120a, fog: false })); p.position.set(0, 0.08 + j * 0.09, -0.12); bl.add(p); }
    HIDE_OV.add(bl);
    var dk = new THREE.Group(); dk.name = 'desk';
    var top = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.25), new THREE.MeshBasicMaterial({ color: 0x1a120a, fog: false })); top.position.set(0, 0.16, -0.12); dk.add(top);
    var leg = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.4), new THREE.MeshBasicMaterial({ color: 0x222222, fog: false })); leg.position.set(-0.14, -0.05, -0.119); dk.add(leg); var leg2 = leg.clone(); leg2.position.x = 0.14; dk.add(leg2);
    HIDE_OV.add(dk);
    HIDE_OV.children.forEach(function (c) { c.traverse(function (o) { if (o.material) { o.material.depthTest = false; o.renderOrder = 999; } }); });
  }
  var map = { locker: 'locker', stall: 'stall', bleacher: 'bleacher', desk: 'desk', table: 'desk', cot: 'desk', behind: null };
  HIDE_OV.children.forEach(function (c) { c.visible = map[type] === c.name; });
}

// ---- schedule / lessons ----------------------------------------------------------
function currentStop() { return GAME.schedule[GAME.period]; }
function beginLesson(i) {
  GAME.period = i;
  var st = currentStop();
  GAME.phase = st.kind === 'lunch' ? 'lunch' : 'lesson';
  GAME.lessonLookAt = true;
  hideHUDForLesson(true);
  updateObjective();
  if (st.kind === 'class') {
    var info = ROLE_INFO[st.room.role];
    var label = st.label;
    showToast(label[0] + ': ' + info.en, label[1] + '：' + info.ja + '（' + st.room.number + '）', 3);
    spawnTeacher(st.room);
    var intro = i === 0 ? introLines() : [['Welcome to ' + info.en.toLowerCase() + ', students! Hoo-ray for learning!', info.ja + 'の時間ですよ！学ぶって楽しいね！']];
    runLines(intro, 'hoots', function () {
      if (GAME.mode !== 'play') return;
      var raid = GAME.raidPeriods[i] || (GAME.hootsRevealPeriod === i);
      runLesson(st.room.role, GAME.night, function (score) { lessonFinished(score); }, raid ? function () { startRaid(); } : null);
    });
  } else if (st.kind === 'lunch') {
    showToast('LUNCH', '昼休み（カフェテリア）', 3);
    runLunch();
  }
}
function introLines() {
  if (GAME.night === 1) return [
    ['Good evening, night students! I am Professor Hoots! Hoo-hoo!', 'こんばんは、夜間学校のみなさん！フーツ先生ですよ！'],
    ['Here at Hollow Pines, we learn all night long!', 'ホロウパインズでは、夜通しお勉強！'],
    ['When the bell rings, the lights go out. Find your next classroom...', 'ベルが鳴ると電気が消えます。次の教室を探してね…'],
    ['...and sit in a chair before the next bell! There are never enough chairs. Hoo-ray!', '…次のベルまでに椅子に座ること！椅子はいつも足りないの。フーレイ！']
  ];
  var L = [[["Welcome back! Did everyone sleep well? No? Hoo-hoo!", 'おかえりなさい！よく眠れた？眠れてない？フーフー！']], [["Some friends didn't come back today. Let's not talk about them.", '今日は来なかったお友達もいます。その話はやめましょうね。']], [["Parents are welcome tonight. They're waiting in the halls.", '今夜は保護者の方も来ています。廊下で待っていますよ。']], [["Picture day! Say cheese! Say it forever!", '写真撮影の日！チーズって言って！ずっと言っててね！']], [["Graduation night. Everyone graduates. Eventually.", '卒業の夜。みんな卒業するの。いつかはね。']]];
  return L[Math.min(GAME.night - 2, L.length - 1)] || L[0];
}
function runLines(lines, who, done) {
  var i = 0;
  GAME._linesSkip = false;
  function next() {
    if (GAME.mode !== 'play' && GAME.mode !== 'cut') return;
    if (i >= lines.length) { if (done) done(); return; }
    var l = lines[i++];
    var dur = Math.max(2.4, l[0].length * 0.065);
    showSubtitle((who === 'hoots' ? 'PROF. HOOTS: ' : who === 'pa' ? 'PA: ' : '') + l[0], l[1], dur, who);
    if (who === 'hoots') { say(l[0], GAME.night >= 4 && R() < 0.3 ? 'creepy' : 'cute'); if (TEACHER) TEACHER.talk = dur; }
    else if (who === 'pa') say(l[0], 'pa');
    else if (who === 'evil') say(l[0], 'creepy');
    GAME._lineTimer = setTimeoutG(next, dur * 1000);
  }
  next();
}
function lessonFinished(score) {
  if (GAME.mode !== 'play') return;
  GAME.hint = score; // 0..3
  var next = GAME.schedule[GAME.period + 1];
  var nr = next.room;
  var where = next.kind === 'bus' ? ['the SCHOOL BUS out front', '正面のスクールバス'] : next.kind === 'lunch' ? ['the CAFETERIA (west wing, 1F)', '1階 西ウィングのカフェテリア'] : [ROLE_INFO[nr.role].en + (score >= 1 ? ', Room ' + nr.number + ' (' + LV_NAME[nr.li] + ')' : ''), ROLE_INFO[nr.role].ja + (score >= 1 ? '（' + nr.number + '号室・' + (nr.li === 2 ? '2階' : '1階') + '）' : '')];
  var lines = [];
  var grade = ['F', 'C', 'B', 'A+'][score];
  lines.push(['Grade: ' + grade + '! ' + (score >= 2 ? 'Hoo-ray! Gold star for you!' : score === 1 ? 'Not bad, not bad.' : 'Oh dear. Pay attention next time...'), '成績：' + grade + '！' + (score >= 2 ? 'すばらしい！' : score === 1 ? 'まあまあね。' : 'あらあら。次はちゃんと聞いてね…')]);
  lines.push(['Your next class is ' + where[0] + '.', '次の授業は ' + where[1] + ' です。']);
  if (score >= 2) {
    var route = routeHint(nr);
    if (route) lines.push(route);
    revealMapAround(nr);
  }
  if (score >= 3) { var gift = R.pick(['battery', 'chalk', 'star', 'bandaid', 'horn']); addItem(gift); lines.push(['Extra credit! Take this: ' + ITEM_DEFS[gift].en + '.', 'ごほうび！' + ITEM_DEFS[gift].ja + 'をどうぞ。']); sfx('sparkle'); }
  lines.push(['Remember: be in your seat when the bell rings!', 'ベルが鳴るまでに席に着くこと！']);
  runLines(lines, 'hoots', function () { endOfPeriod(); });
}
function routeHint(room) {
  var from = PL.seated ? { li: PL.li, x: PL.x, z: PL.z } : { li: PL.li, x: PL.x, z: PL.z };
  var e = roomEntryPoint(room);
  if (!e) return null;
  var p = findPath(from.li, from.x, from.z, e.li, e.x, e.z, 'p');
  if (!p) return null;
  GAME.routePath = p;
  var stairs = null;
  for (var i = 1; i < p.length; i++) if (p[i].li !== p[i - 1].li) { stairs = p[i].x < 30 ? ['the WEST stairs', '西階段'] : ['the EAST stairs', '東階段']; break; }
  var blocked = MAP.blockers.length ? ['Some halls are blocked tonight.', '今夜はふさがった廊下があるの。'] : null;
  if (stairs) return ['Psst... take ' + stairs[0] + '. ' + (blocked ? blocked[0] : ''), 'ヒント：' + stairs[1] + 'を使ってね。' + (blocked ? blocked[1] : '')];
  return ['Psst... stay on this floor. ' + (blocked ? blocked[0] : ''), 'ヒント：同じ階にあるわ。' + (blocked ? blocked[1] : '')];
}
function revealMapAround(room) { GAME.mapReveal[room.li] = true; GAME.mapReveal['t' + room.id] = true; }
function endOfPeriod() {
  if (GAME.mode !== 'play') return;
  removeTeacher();
  GAME.lessonLookAt = false;
  sfx('bell', null, { len: 2.4 });
  showSubtitle('*RRRRRRING*', '（ベルの音）', 2);
  setTimeoutG(function () { if (GAME.mode === 'play') startTransit(); }, 2300);
}

// ---- transit ----------------------------------------------------------------
function startTransit() {
  var next = GAME.schedule[GAME.period + 1];
  var P = nightParams(GAME.night);
  GAME.target = next.room;
  var alive = NPCS.filter(function (n) { return n.alive; }).length + 1;
  var k = Math.max(1, alive - P.deficit);
  // chairs: only k available in target room
  var chairs = next.room.chairs.filter(function (c) { return c.lesson !== false; });
  chairs.forEach(function (c) { c.avail = false; c.occ = -1; c.claim = -1; setChairPose(c, next.kind === 'bus' ? 'stacked' : 'stacked'); });
  var pick = GAME.rnd.shuffle(chairs.slice()).slice(0, Math.min(k, chairs.length));
  pick.forEach(function (c) { c.avail = true; setChairPose(c, 'normal'); });
  GAME.seatsTotal = pick.length;
  // leave current seat
  if (PL.seated) standPlayer();
  hideHUDForLesson(false);
  lightsOut();
  GAME.phase = 'transit'; GAME.monKills = 0;
  GAME.timer = P.transit; GAME.transitDur = P.transit; GAME.clock = 3 * 60 * 0 + GAME.period * 600 + 120;
  npcsBeginTransit(next.room, GAME.night, GAME.rnd);
  spawnNightMonsters();
  spawnItems();
  updateObjective();
  var paL = next.kind === 'bus' ? [['Dismissal. The last bus leaves at the bell. Do not miss it.', '下校です。最後のバスはベルと同時に出発します。乗り遅れないで。']] : [['Please proceed to your next class.', '次の教室へ移動してください。']];
  setTimeoutG(function () { if (GAME.phase === 'transit') { sfx('paStatic', null, { len: 3 }); runLines(paL, GAME.night >= 2 ? 'evil' : 'pa'); } }, 900);
  if (GAME.night === 1 && GAME.period === 0 && !SAVE.tutDone) { SAVE.tutDone = 1; writeSave(); setTimeoutG(function () { if (GAME.phase === 'transit') tutorialTip(); }, 1200); }
}
function tutorialTip() {
  GAME.mode = 'read';
  showDialog('<h2>' + bi('LIGHTS OUT', '消灯') + '</h2><p class="tw" style="font-size:15px;line-height:1.45">Find <b>' + ROLE_INFO[GAME.target.role].en + '</b> and sit in an empty chair before the bell.<br><span style="font-family:Zen Kaku Gothic New;font-size:13px;color:#ccc">次の教室（' + ROLE_INFO[GAME.target.role].ja + '）を探して、ベルが鳴る前に空いている椅子に座ろう。椅子は人数より少ない！</span></p>' +
    '<p style="font-size:13px;line-height:1.6;color:#ccc">・左下をドラッグで移動（強く倒すと走る）<br>・画面右側をドラッグで見回す<br>・🔦ライト：見えるけど見つかりやすい<br>・✋：調べる／隠れる／座る<br>・🫁 長押し：息を止める（止めすぎると咳き込む）<br>・扉の上の<b>部屋番号</b>を見て教室を探そう</p>', 'GOT IT / わかった', function () { if (GAME.mode === 'read') GAME.mode = 'play'; });
}
function spawnNightMonsters() {
  var types = monstersForNight(GAME.night);
  // keep existing ones, reactivate
  MONSTERS.slice().forEach(function (m) { if (m.gone || m.watcher) removeMonster(m); });
  types.forEach(function (t) {
    var m = MONSTERS.filter(function (q) { return q.type === t && !q.watcher; })[0];
    var sp = farSpawn(t === 'crawler' ? 12 : 18);
    if (!m) m = spawnMonster(t, sp.li, sp.x, sp.z);
    else { m.li = sp.li; m.x = sp.x; m.z = sp.z; m.y = floorY(sp.li, sp.x, sp.z); }
    m.active = true; m.raid = false; m.visible = t !== 'static'; m.mdl.root.visible = m.visible; m.path = null;
    setState(m, t === 'static' ? 'dormant' : 'patrol');
    m.grace = 4 + R() * 3; // no hunting right at lights-out
  });
  // harmless watcher Hoots before the reveal
  if (!GAME.hootsRevealed && R() < 0.7) {
    var w = farSpawn(14, true);
    var mw = spawnMonster('hoots', w.li, w.x, w.z, { watcher: true });
    mw.yaw = Math.atan2(PL.x - w.x, PL.z - w.z);
  }
}
function farSpawn(minD, corridor) {
  for (var k = 0; k < 60; k++) {
    var li = R() < 0.6 ? PL.li : R.pick([1, 2]);
    var p = corridor ? { li: li, x: R.range(3, 57), z: 11.25 } : randomPatrolPoint(li);
    if (!passable(p.li, m2c(p.x), m2r(p.z), 'p')) continue;
    var d = Math.sqrt(dist2(p.x, p.z, PL.x, PL.z)) + (p.li !== PL.li ? 15 : 0);
    if (d < minD) continue;
    if (GAME.target && roomAt(p.li, p.x, p.z) === GAME.target) continue;
    if (!corridor && !findPath(p.li, p.x, p.z, PL.li, PL.x, PL.z, 'm', 20000)) continue;
    return p;
  }
  return { li: 1, x: 55, z: 11.25 };
}
var ITEM_WEIGHTS = [['battery', 4], ['chalk', 4], ['horn', 2], ['star', 1.5], ['bandaid', 1.5], ['lunch', 1.5], ['map', 2], ['hallpass', 1.5]];
function spawnItems() {
  GAME.items.forEach(function (it) { if (it.mesh) RENDER.scene.remove(it.mesh); }); GAME.items = [];
  var spots = GAME.rnd.shuffle(MAP.itemSpots.slice());
  var n = 4 + GAME.rnd.int(0, 2);
  for (var i = 0; i < n && i < spots.length; i++) {
    var s = spots[i]; if (!passable(s.li, m2c(s.x), m2r(s.z), 'p')) continue;
    var tot = 0; ITEM_WEIGHTS.forEach(function (w) { tot += w[1]; });
    var r = GAME.rnd() * tot, kind = 'battery';
    for (var k = 0; k < ITEM_WEIGHTS.length; k++) { r -= ITEM_WEIGHTS[k][1]; if (r <= 0) { kind = ITEM_WEIGHTS[k][0]; break; } }
    addWorldItem(kind, s.li, s.x, s.z);
  }
  // lore pickup (one per transit if any left)
  var left = LORE.filter(function (l) { return !SAVE.lore[l.id] && (l.night || 1) <= GAME.night; });
  if (left.length && spots.length > n + 1) { var ls = spots[n + 1]; if (passable(ls.li, m2c(ls.x), m2r(ls.z), 'p')) addWorldItem('lore', ls.li, ls.x, ls.z, left[0]); }
}
var ITEM_MESH_CACHE = {};
function itemMesh(kind) {
  var g = new THREE.Group();
  var mk = function (geo, col, emi) { var m = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: col, emissive: emi || 0x000000, shininess: 60 })); m.castShadow = true; g.add(m); return m; };
  if (kind === 'battery') { mk(new THREE.CylinderGeometry(0.02, 0.02, 0.07, 10), 0x222222).rotation.z = PI / 2; var t = mk(new THREE.CylinderGeometry(0.0205, 0.0205, 0.03, 10), 0xd4a020); t.rotation.z = PI / 2; t.position.x = 0.02; }
  else if (kind === 'chalk') { for (var i = 0; i < 3; i++) { var c = mk(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), [0xffffff, 0xffe0e0, 0xe0f0ff][i]); c.rotation.z = PI / 2; c.position.z = i * 0.02; } }
  else if (kind === 'horn') { mk(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 10), 0xc62828); var h = mk(new THREE.CylinderGeometry(0.05, 0.02, 0.08, 10), 0xeeeeee); h.position.y = 0.09; }
  else if (kind === 'star') { var s = new THREE.Shape(); for (var k = 0; k < 10; k++) { var a = k / 10 * TAU, r = k % 2 ? 0.025 : 0.06; if (k === 0) s.moveTo(Math.sin(a) * r, Math.cos(a) * r); else s.lineTo(Math.sin(a) * r, Math.cos(a) * r); } mk(new THREE.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }), 0xffd23f, 0x332200).rotation.x = -PI / 2; }
  else if (kind === 'lunch') { mk(new THREE.BoxGeometry(0.22, 0.14, 0.1), 0x2f6fd0); var hh = mk(new THREE.BoxGeometry(0.1, 0.03, 0.02), 0x222222); hh.position.y = 0.09; }
  else if (kind === 'bandaid') { mk(new THREE.BoxGeometry(0.09, 0.005, 0.03), 0xe8b48a); }
  else if (kind === 'map') { mk(new THREE.BoxGeometry(0.18, 0.004, 0.13), 0xe8e2c8).rotation.y = 0.4; }
  else if (kind === 'hallpass') { mk(new THREE.BoxGeometry(0.16, 0.006, 0.07), 0xd23b3b); }
  else if (kind === 'lore') { mk(new THREE.BoxGeometry(0.19, 0.025, 0.1), 0x111111); var lb = mk(new THREE.BoxGeometry(0.12, 0.027, 0.05), 0xf2ead2); }
  // glint
  var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: ITEM_MESH_CACHE.glint || (ITEM_MESH_CACHE.glint = toTex(texGlow('rgba(255,240,200,0.9)', 64), { clamp: true })), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 }));
  spr.scale.set(0.35, 0.35, 0.35); spr.position.y = 0.06; g.add(spr); g.userData.glint = spr;
  return g;
}
function addWorldItem(kind, li, x, z, lore) {
  var m = itemMesh(kind);
  m.position.set(x, floorY(li, x, z) + 0.03, z);
  RENDER.scene.add(m);
  GAME.items.push({ kind: kind, li: li, x: x, z: z, mesh: m, lore: lore });
}

// ---- interactions --------------------------------------------------------------
function findInteraction() {
  var P = PL;
  if (P.hidden) return { en: 'LEAVE', ja: '出る', fn: exitHide };
  if (P.seated) {
    if (GAME.phase === 'transit') return { en: 'STAND UP', ja: '立ち上がる', fn: standPlayer };
    if (GAME.phase === 'lunch' && GAME.lunchBox && !GAME.lunchBox.taken) return { en: 'TAKE LUNCH BOX', ja: 'ランチボックスを取る', fn: function () { GAME.lunchBox.taken = true; RENDER.scene.remove(GAME.lunchBox.mesh); addItem('lunch'); sfx('pickup'); showToast('LUNCH BOX', 'ランチボックスを手に入れた（生徒に渡すと味方に）'); } };
    return null;
  }
  if (GAME.phase !== 'transit' && GAME.phase !== 'raid') return null;
  var best = null, bd = 1e9;
  function cand(d, it) { if (d < bd) { bd = d; best = it; } }
  // items
  GAME.items.forEach(function (it) { if (it.li !== P.li) return; var d = Math.sqrt(dist2(it.x, it.z, P.x, P.z)); if (d < 1.3) cand(d - 0.3, { en: it.kind === 'lore' ? 'PICK UP ' + it.lore.kindEn : 'PICK UP ' + ITEM_DEFS[it.kind].en.toUpperCase(), ja: it.kind === 'lore' ? it.lore.kindJa + 'を拾う' : ITEM_DEFS[it.kind].ja + 'を拾う', fn: function () { pickupItem(it); } }); });
  // chairs in target room
  if (GAME.phase === 'transit' && GAME.target) GAME.target.chairs.forEach(function (c) { if (!c.avail || c.occ !== -1 || c.li !== P.li) return; var d = Math.sqrt(dist2(c.x, c.z, P.x, P.z)); if (d < 1.15) cand(d - 0.5, { en: 'SIT', ja: '座る', fn: function () { seatPlayer(c); checkAllSeated(); } }); });
  // hides
  MAP.hides.forEach(function (h) { if (h.li !== P.li || h.occ) return; var d = Math.sqrt(dist2(h.ex, h.ez, P.x, P.z)); if (d < 1.0) cand(d, { en: 'HIDE', ja: h.type === 'locker' ? 'ロッカーに隠れる' : h.type === 'desk' || h.type === 'table' ? '机の下に隠れる' : h.type === 'stall' ? '個室に隠れる' : h.type === 'bleacher' ? '観客席の下に隠れる' : h.type === 'cot' ? 'ベッドの下に隠れる' : '物陰に隠れる', fn: function () { enterHide(h); } }); });
  // npcs
  NPCS.forEach(function (n) {
    if (!n.alive || n.li !== P.li || n.seated) return;
    var d = Math.sqrt(dist2(n.x, n.z, P.x, P.z)); if (d > 1.8) return;
    if (n.state === 'lost') cand(d, { en: 'HELP ' + n.name.toUpperCase(), ja: n.name + 'を助ける（連れて行く）', fn: function () { n.state = 'follow'; n.lost = false; npcSay(n, "Thank you! I'll stay close.", 'ありがとう！ついて行くね。'); } });
    else if (hasItem('lunch') && !n.friend) cand(d + 0.2, { en: 'GIVE LUNCH BOX', ja: n.name + 'にランチを渡す', fn: function () { takeItem('lunch'); n.friend = true; npcSay(n, "For me? You're a real friend.", '私に？あなた、本当にいい人ね。'); } });
  });
  // locked doors
  MAP.doors.forEach(function (d) { if (!d.locked || d.li !== P.li) return; var dd = Math.sqrt(dist2(d.x, d.z, P.x, P.z)); if (dd < 1.6) cand(dd + 0.1, hasItem('hallpass') ? { en: 'USE HALL PASS', ja: 'ホールパスで開ける', fn: function () { takeItem('hallpass'); d.locked = false; d.open = 1; sfx('door', { li: d.li, x: d.x, z: d.z }); showToast('UNLOCKED', 'カギが開いた'); } } : { en: 'LOCKED', ja: 'カギがかかっている（ホールパスが必要）', fn: function () { sfx('rattle', { li: d.li, x: d.x, z: d.z }); } }); });
  // VCR
  MAP.slots.forEach(function (r) { if (!r.vcr || r.li !== P.li) return; var d = Math.sqrt(dist2(r.vcr.x, r.vcr.z, P.x, P.z)); if (d < 1.3) cand(d, { en: 'WATCH A TAPE', ja: 'ビデオを見る', fn: function () { openVHSPicker(true); } }); });
  return best;
}
function pickupItem(it) {
  RENDER.scene.remove(it.mesh);
  GAME.items.splice(GAME.items.indexOf(it), 1);
  sfx('pickup');
  if (it.kind === 'lore') { unlockLore(it.lore); return; }
  if (it.kind === 'battery') { PL.battery = Math.min(100, PL.battery + 55); showToast('BATTERIES', '電池を入れた（+55%）'); return; }
  if (it.kind === 'map') { var li = PL.li; GAME.mapReveal[li] = true; GAME.mapScrap = true; showToast('MAP SCRAP', '校内図の切れはし：' + (li === 2 ? '2階' : li === 0 ? '地下' : '1階') + 'の地図が見えるようになった'); return; }
  if (it.kind === 'bandaid') { PL.bandaid++; }
  addItem(it.kind);
  showToast(ITEM_DEFS[it.kind].en.toUpperCase(), ITEM_DEFS[it.kind].ja + '：' + ITEM_DEFS[it.kind].descJa, 3);
}
function useItem() {
  var it = PL.invOrder && PL.invOrder[PL.sel];
  if (!it) return;
  if (it === 'flashlight') { toggleFlash(); return; }
  if (it === 'battery') { takeItem('battery'); PL.battery = Math.min(100, PL.battery + 55); sfx('click'); return; }
  if (it === 'horn' || it === 'chalk') { throwItem(it); return; }
  if (it === 'star') {
    var m = MONSTERS.filter(function (q) { return q.active && q.visible && !q.watcher && q.li === PL.li && dist2(q.x, q.z, PL.x, PL.z) < 9; })[0];
    if (!m) { showToast('NO ONE IS CLOSE', '近くにモンスターがいない時は使えない'); return; }
    takeItem('star'); sfx('sparkle', mpos(m)); sfx('hoot', null, { pitch: 1.4 }); showSubtitle('"Gold star for you!"', '「金星シールをあげる！」', 2, 'hoots');
    setState(m, 'flinch'); m.path = null; POSTU.uFlash.value = 0.6;
    return;
  }
  if (it === 'bandaid') { showToast('BAND-AID', '絆創膏は持っているだけで1回攻撃に耐える'); return; }
  if (it === 'hallpass') { showToast('HALL PASS', 'カギのかかったドアの前で ✋'); return; }
  if (it === 'lunch') { showToast('LUNCH BOX', '生徒の近くで ✋ を押すと渡せる'); return; }
}
var THROWN = [];
function throwItem(kind) {
  takeItem(kind);
  sfx('throw');
  var f = camForward();
  var mesh = itemMesh(kind); mesh.position.set(PL.x + f.x * 0.4, PL.y + PL.eye - 0.2, PL.z + f.z * 0.4);
  RENDER.scene.add(mesh);
  var sp = kind === 'horn' ? 7 : 9;
  THROWN.push({ kind: kind, mesh: mesh, li: PL.li, vx: f.x * sp, vy: f.y * sp + 2.5, vz: f.z * sp, t: 0, landed: false, life: kind === 'horn' ? 8 : 1.5 });
}
function updateThrown(dt) {
  for (var i = THROWN.length - 1; i >= 0; i--) {
    var t = THROWN[i], m = t.mesh;
    if (!t.landed) {
      t.vy -= 9.8 * dt;
      var nx = m.position.x + t.vx * dt, nz = m.position.z + t.vz * dt, ny = m.position.y + t.vy * dt;
      if (!passable(t.li, m2c(nx), m2r(nz), 'm') || cellType(t.li, m2c(nx), m2r(nz)) === T_BLOCK && ny < LV_Y[t.li] + 1) { t.vx *= -0.3; t.vz *= -0.3; nx = m.position.x; nz = m.position.z; }
      var fy = floorY(t.li, nx, nz) + 0.03;
      if (ny <= fy) { ny = fy; t.landed = true; var p = { li: t.li, x: nx, z: nz };
        if (t.kind === 'chalk') { sfx('chalk', p); emitNoise(t.li, nx, nz, 14, 'chalk'); }
        else { sfx('horn', p, { len: t.life }); }
      }
      m.position.set(nx, ny, nz); m.rotation.x += dt * 8;
    } else {
      t.t += dt;
      if (t.kind === 'horn' && t.t < t.life) { t._n = (t._n || 0) - dt; if (t._n <= 0) { t._n = 0.5; emitNoise(t.li, m.position.x, m.position.z, 30, 'horn'); } }
      if (t.t > t.life + 6) { RENDER.scene.remove(m); THROWN.splice(i, 1); }
    }
  }
}
function checkAllSeated() {
  if (GAME.phase !== 'transit') return;
  var taken = GAME.target.chairs.filter(function (c) { return c.avail && c.occ !== -1; }).length;
  if (taken >= GAME.seatsTotal) endTransit('full');
}

// ---- end of transit: the bell ------------------------------------------------------
function endTransit(reason) {
  if (GAME.phase !== 'transit') return;
  GAME.phase = 'resolve';
  stopVoice();
  sfx('bellBad', null, { len: 3.2 });
  showSubtitle('*RRRRRRING*', reason === 'full' ? '（全部の席が埋まった！）' : '（時間切れ！）', 2.5, 'evil');
  if (PL.hidden) exitHide();
  var playerOK = !!PL.seated && roomAt(PL.li, PL.x, PL.z) === GAME.target;
  if (!playerOK) {
    // the player didn't get a seat
    setTimeoutG(function () { if (GAME.mode === 'play') caughtByBell(); }, 1500);
    return;
  }
  INPUT.enabled = true;
  // unseated NPCs are taken
  var victims = NPCS.filter(function (n) { return n.alive && !(n.seated && roomAt(n.li, n.x, n.z) === GAME.target); });
  victims.forEach(function (n, i) { setTimeoutG(function () { npcKilled(n, null); }, 1500 + i * 900); });
  // monsters vanish
  MONSTERS.forEach(function (m) { if (m.state === 'chase') setState(m, 'patrol'); });
  setTimeoutG(function () {
    if (GAME.mode !== 'play') return;
    lightsOn();
    GAME.items.forEach(function (it) { RENDER.scene.remove(it.mesh); }); GAME.items = [];
    if (victims.length) showToast(victims.length === 1 ? victims[0].name.toUpperCase() + ' IS GONE' : victims.length + ' STUDENTS ARE GONE', victims.map(function (v) { return v.name; }).join('、') + ' がいなくなった…', 3.5);
    GAME.stats.lost += victims.length;
    var next = GAME.period + 1;
    setTimeoutG(function () {
      if (GAME.mode !== 'play') return;
      if (GAME.schedule[next].kind === 'bus') nightCleared();
      else beginLesson(next);
    }, 2200);
  }, 1500 + victims.length * 900 + 1200);
}
function caughtByBell() {
  // pick a monster to take the player: nearest active (or student0)
  var m = MONSTERS.filter(function (q) { return q.active && !q.watcher; }).sort(function (a, b) { return dist2(a.x, a.z, PL.x, PL.z) - dist2(b.x, b.z, PL.x, PL.z); })[0];
  if (!m) m = spawnMonster('student0', PL.li, PL.x + 1, PL.z);
  startJumpscare(m, 'bell');
}
function onMonsterCatch(m) {
  if (GAME.mode !== 'play' || !PL.alive || PL.invuln > 0) return;
  if (PL.bandaid > 0 && GAME.phase !== 'resolve') {
    PL.bandaid--; takeItem('bandaid'); PL.invuln = 2.5;
    sfx('stab'); sfx('bandaid'); POSTU.uRed.value = 1; PL.shake = 1;
    showToast('THE BAND-AID HELD!', '絆創膏で耐えた！今のうちに逃げろ！', 2.5);
    setState(m, 'flinch'); m.path = null;
    return;
  }
  startJumpscare(m, m.type);
}

// ---- JUMPSCARE ------------------------------------------------------------------
var JS = null;
function startJumpscare(m, cause) {
  TIMERS.length = 0;
  GAME.mode = 'dead'; PL.alive = false; INPUT.enabled = false;
  stopVoice(); clearTimeoutG(GAME._lineTimer);
  if (typeof abortLesson === 'function') abortLesson();
  hideScreen('dialog');
  if (PL.hidden) { PL.hidden.occ = null; PL.hidden = null; showHideOverlay(null); }
  UIX.hud.style.display = 'none'; setPrompt(null);
  SAVE.deaths = (SAVE.deaths || 0) + 1; SAVE.monsters[m.type] = 2; writeSave();
  var mild = SAVE.settings.scare === 'MILD';
  JS = { m: m, t: 0, cause: cause, mild: mild, phase: 0, face: FACE_TEX[FACE_DEFS[m.type].img] };
  // place monster right in front of the player, lunging
  var f = camForward();
  m.active = true; m.visible = true; m.mdl.root.visible = true; m.ceilAmt = 0; m.watcher = false;
  m.li = PL.li;
  JS.start = { x: PL.x + f.x * 2.2, z: PL.z + f.z * 2.2 };
  m.x = JS.start.x; m.z = JS.start.z; m.yaw = Math.atan2(PL.x - m.x, PL.z - m.z);
  setState(m, 'chase'); m.jaw = 1;
  m.reveal = 1;
  POSTU.tFace.value = JS.face;
  sfx('jumpscare', null, { pitch: m.type === 'gaper' ? 0.8 : m.type === 'student0' ? 1.2 : 1 });
  playBGM(null, { cut: true });
  setTimeout(function () { showSkip(); }, 1000);
}
function showSkip() { if (!JS) return; showScreen('dialog', '<div style="position:absolute;right:16px;bottom:calc(var(--bot-safe) + 16px)"><button class="hp-x pe" id="hp-skip" style="min-width:110px">SKIP ▶▶<br><span style="font:11px Zen Kaku Gothic New">スキップ</span></button></div>'); onTap(document.getElementById('hp-skip'), function () { if (JS) JS.t = Math.max(JS.t, 2.4); }); }
function updateJumpscare(dt) {
  var J = JS; J.t += dt;
  var m = J.m, mild = J.mild;
  // phase A (0..0.35): 3D lunge, camera snaps to the face
  var t = J.t;
  var hp = playerHeadPos();
  var k = smooth(t / 0.32);
  var tx = lerp(J.start.x, PL.x + (J.start.x - PL.x) * 0.2, k), tz = lerp(J.start.z, PL.z + (J.start.z - PL.z) * 0.2, k);
  m.x = tx; m.z = tz;
  var headY = m.mdl.head.getWorldPosition(new THREE.Vector3()).y;
  var dx = m.x - PL.x, dz = m.z - PL.z;
  var wantYaw = Math.atan2(-dx, -dz);
  PL.yaw += angDiff(PL.yaw, wantYaw) * Math.min(1, dt * 18);
  var dy = headY - hp.y, dh = Math.sqrt(dx * dx + dz * dz);
  PL.pitch = damp(PL.pitch, Math.atan2(dy, dh), 18, dt);
  finishMonster(m, dt);
  m.mdl.rig.byName.neck.rotation.x = -0.2; m.mdl.rig.byName.head.rotation.z = Math.sin(t * 40) * 0.12;
  if (m.mdl.head.userData.U) m.mdl.head.userData.U.uJaw.value = 1;
  // phase B: full-screen face
  var f = 0;
  if (t > 0.3) f = 1;
  var zoom = 0.78 + Math.min(1, (t - 0.3) / 1.6) * (mild ? 0.15 : 0.55) + (t < 0.45 && !mild ? (0.45 - t) * 2 : 0);
  POSTU.uFace.value = f;
  POSTU.uFaceZoom.value = Math.min(3.5, zoom);
  var sh = mild ? 0.006 : 0.03;
  POSTU.uFaceShake.value.set((R() - 0.5) * sh * (1 + t), (R() - 0.5) * sh * (1 + t));
  POSTU.uInvert.value = !mild && (Math.floor(t * 14) % 7 === 0) && t > 0.35 && t < 1.6 ? 1 : 0;
  POSTU.uFlash.value = t > 0.3 && t < 0.36 && !mild ? 0.8 : 0;
  POSTU.uGlitch.value = t > 0.3 ? (mild ? 0.3 : 1) : 0.3;
  POSTU.uVHS.value = 1; POSTU.uRed.value = 0.3;
  PL.shake = mild ? 0.2 : 1.2;
  if (t > 2.4 && J.phase === 0) {
    J.phase = 1;
    POSTU.uFace.value = 0; POSTU.uInvert.value = 0; POSTU.uGlitch.value = 0; POSTU.uFlash.value = 0; POSTU.uBlack.value = 1;
    hideScreen('dialog');
    setTimeout(showGameOver, 500);
  }
}
function showGameOver() {
  var m = JS.m, line = DEATH_LINES[JS.cause] || DEATH_LINES[m.type] || DEATH_LINES.bell;
  JS = null;
  GAME.mode = 'gameover';
  POSTU.uBlack.value = 1;
  sfx('tape');
  var html = '<div style="position:absolute;inset:0;background:#000"></div>' +
    '<div class="hp-panel" style="justify-content:flex-start;padding-top:10px">' +
    '<div style="font:15px VT323;color:#888;letter-spacing:.2em;margin-bottom:8px">■ STOP  ·  NIGHT ' + GAME.night + '  ·  ' + GAME.schedule[Math.min(GAME.period + 1, 5)].label[0] + '</div>' +
    '<div style="font:34px/1.05 \'Special Elite\';color:#f2ede0;margin:10px 0 4px;text-shadow:0 0 12px rgba(255,0,0,.4)">' + line[0] + '</div>' +
    '<div style="font:700 15px Zen Kaku Gothic New;color:#b9b1a0;margin-bottom:14px">' + line[1] + '</div>' +
    '<div id="hp-go-card" style="width:min(330px,100%);border-radius:16px;background:linear-gradient(#7fd3ff,#ffe36e);border:3px solid #1b1b1b;padding:10px;opacity:0;transition:opacity .8s;box-shadow:0 6px 0 #1b1b1b">' +
    '<canvas id="hp-go-cv" width="300" height="190" style="width:100%;height:auto;display:block"></canvas>' +
    '<div style="font:24px \'Luckiest Guy\';color:#1f3c88;-webkit-text-stroke:1px #fff">"See you tomorrow, student!"</div><div style="font:700 13px Zen Kaku Gothic New;color:#333">「また明日ね、生徒さん！」</div></div>' +
    '<div style="margin-top:14px;width:100%">' +
    '<button class="hp-menu-btn pe" id="hp-retry">' + bi('TRY AGAIN', 'この夜をやり直す') + '</button>' +
    '<button class="hp-menu-btn alt pe" id="hp-totitle">' + bi('TITLE', 'タイトルへ') + '</button></div>' +
    '<div style="font:13px VT323;color:#777;margin-top:6px">BEST NIGHT: ' + (SAVE.bestNight || 0) + '  ·  DEATHS: ' + SAVE.deaths + '</div></div>';
  showScreen('gameover', html);
  setTimeout(function () {
    var cv = document.getElementById('hp-go-cv'); if (!cv) return;
    var g = cv.getContext('2d'); var tt = 0;
    var card = document.getElementById('hp-go-card'); card.style.opacity = 1;
    say('See you tomorrow, student!', 'cute');
    playBGM('happy', { fade: 2, restart: true });
    (function anim() { if (GAME.mode !== 'gameover') return; tt += 0.05; g.clearRect(0, 0, 300, 190); for (var i = 0; i < 12; i++) drawStar(g, (i * 53 + tt * 20) % 320 - 10, 20 + (i * 37) % 150, 6 + (i % 3) * 3, 'rgba(255,255,255,.8)'); drawHoots(g, 150, 105, 0.62, { wave: (Math.sin(tt * 4) + 1) / 2, blink: Math.sin(tt * 1.3) > 0.97 ? 0.5 : 0, glitch: 0 }); if (Math.sin(tt * 0.7) > 0.995) { g.fillStyle = '#000'; g.fillRect(0, 0, 300, 190); drawHoots(g, 150, 105, 0.62, { creepy: 1 }); } requestAnimationFrame(anim); })();
  }, 1200);
  onTap(document.getElementById('hp-retry'), function () { sfx('ui'); POSTU.uBlack.value = 0; startNight(GAME.night, true); });
  onTap(document.getElementById('hp-totitle'), function () { sfx('uiBack'); POSTU.uBlack.value = 0; goTitle(); });
}
// ---- night clear -------------------------------------------------------------
function nightCleared() {
  GAME.mode = 'cut'; INPUT.enabled = false;
  hideScreen('dialog');
  var n = GAME.night;
  SAVE.bestNight = Math.max(SAVE.bestNight || 0, n); SAVE.clears = (SAVE.clears || 0) + 1; SAVE.nightsSurvived = (SAVE.nightsSurvived || 0) + 1; SAVE.continueNight = n + 1;
  GAME.missing = (GAME.missing || []).concat(GAME.lost.map(function (v) { return { name: v.name, look: v.look, seed: v.seed, when: 'Last seen: night ' + n + ', after the bell' }; })).slice(-12);
  GAME.carry = PL.inv.filter(function (i) { return i !== 'flashlight'; }).slice(0, 4);
  if (n === 3) GAME.hootsRevealed = true;
  SAVE.hootsRevealed = GAME.hootsRevealed || SAVE.hootsRevealed;
  writeSave();
  sfx('engine', null, { len: 4 });
  UIX.hud.style.display = 'none';
  fadeTo(1, 1.5).then(function () {
    GAME.mode = 'clear';
    lightsOn(); playBGM('happy', { fade: 1.5, restart: true });
    var ending = n === 5 ? '<div class="tw" style="font-size:15px;line-height:1.5;color:#333;margin:8px 0">You graduated. The bus drives on through the pines.<br>On the seat next to you: a new envelope.<br><b>"ADMISSION LETTER — SUMMER SCHOOL"</b></div><div style="font:700 12px Zen Kaku Gothic New;color:#333">卒業した。バスは松林を走り続ける。隣の席には新しい封筒。「入学許可証 ― 夏期講習」</div>' : '';
    var html = '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#fff6b8,#ffb74d 60%,#ff7043)"></div><div class="hp-panel">' +
      '<div style="font:42px/1 \'Luckiest Guy\';color:#1f3c88;-webkit-text-stroke:2px #fff;transform:rotate(-3deg)">NIGHT ' + n + '</div><div style="font:34px \'Luckiest Guy\';color:#c62828;-webkit-text-stroke:2px #fff">SURVIVED!</div>' +
      '<div style="font:700 15px Zen Kaku Gothic New;color:#3b2a1a">' + n + '夜目 クリア！</div>' +
      '<canvas id="hp-cl-cv" width="300" height="170" style="width:min(300px,90%);height:auto"></canvas>' +
      '<div class="tw" style="font-size:16px;color:#1b1b1b">Students lost tonight: ' + GAME.stats.lost + '<br>いなくなった生徒：' + GAME.stats.lost + '人</div>' + ending +
      '<div style="width:100%;margin-top:10px"><button class="hp-menu-btn pe" id="hp-next">' + bi('NEXT NIGHT ▶', n + 1 + '夜目へ') + '</button><button class="hp-menu-btn alt pe" id="hp-cl-title">' + bi('TITLE', 'タイトルへ') + '</button></div></div>';
    showScreen('clear', html);
    fadeTo(0, 0.6);
    say(n === 5 ? 'Congratulations, graduate! See you at summer school!' : 'Great job tonight! See you tomorrow, student!', 'cute');
    var cv = document.getElementById('hp-cl-cv'), g = cv.getContext('2d'), tt = 0;
    (function anim() { if (GAME.mode !== 'clear') return; tt += 0.05; g.clearRect(0, 0, 300, 170); drawHoots(g, 150, 95, 0.55, { wave: (Math.sin(tt * 5) + 1) / 2 }); for (var i = 0; i < 8; i++) drawStar(g, 150 + Math.cos(tt + i) * 120, 85 + Math.sin(tt * 1.3 + i) * 60, 7, '#fff'); requestAnimationFrame(anim); })();
    onTap(document.getElementById('hp-next'), function () { sfx('ui'); startNight(n + 1); });
    onTap(document.getElementById('hp-cl-title'), function () { sfx('uiBack'); goTitle(); });
  });
}

// ---- raid during lesson ---------------------------------------------------------
function startRaid() {
  if (GAME.mode !== 'play' || GAME.phase !== 'lesson') return;
  GAME.phase = 'raidWarn';
  var room = currentStop().room;
  if (typeof pauseLesson === 'function') pauseLesson(true);
  FLICK.amt = 0.6; setBGMRate(0.82); sfx('paStatic', null, { len: 2.5 });
  if (TEACHER) TEACHER.lookWindow = true;
  var hootsReveal = GAME.hootsRevealPeriod === GAME.period && !GAME.hootsRevealed;
  showSubtitle(hootsReveal ? 'PROF. HOOTS: ...stay after class.' : '*the lights flicker*', hootsReveal ? '…放課後、残りなさい。' : '（蛍光灯がチカチカする…）', 2.5, hootsReveal ? 'evil' : '');
  if (hootsReveal) say('Stay. After. Class.', 'creepy');
  setTimeoutG(function () {
    if (GAME.mode !== 'play') return;
    FLICK.amt = 0; setBGMRate(1);
    lightsOut(); hideHUDForLesson(false); UIX.hud.style.display = '';
    GAME.phase = 'raid'; GAME.raidT = 0;
    if (typeof pauseLesson === 'function') pauseLesson('hide');
    // NPCs dive under desks (most of them)
    NPCS.forEach(function (n) { if (!n.alive || !n.seated) return; if (n.pers === 'timid' || R() < 0.82) { var c = n.seated; npcStand(n); n.state = 'raidHide'; n.x = c.x + Math.sin(c.rot) * 0.55; n.z = c.z + Math.cos(c.rot) * 0.55; n.raidChair = c; } });
    // stand the player up next to the chair; they must hide
    var c = PL.seated; standPlayer(); PL.raidChair = c;
    showToast('HIDE UNDER A DESK!', '机の下に隠れろ！（✋）', 3);
    // monster comes in through the door
    var type = hootsReveal ? 'hoots' : R.pick(monstersForNight(Math.max(GAME.night, 2)).filter(function (t) { return t !== 'static' && t !== 'smiles'; }).concat(['student0']));
    if (hootsReveal) { GAME.hootsRevealed = true; }
    var e = roomEntryPoint(room, true);
    var door = MAP.doors[room.doors[0]];
    setTimeoutG(function () {
      if (GAME.mode !== 'play' || GAME.phase !== 'raid') return;
      var m = spawnMonster(type, room.li, door.x, door.z + (room.cz > door.z ? -0.8 : 0.8));
      m.raid = true; m.raidKeep = true; m.active = true; m.visible = true; m.ceilAmt = 0; m.ceil = false; m.raidRoom = room; m.raidLeft = 16 + GAME.night;
      setState(m, 'raid'); GAME.raidMon = m;
      door.open = 1;
      sfx('doorBang', mpos(m));
    }, 2500 + R() * 1500);
  }, 2800);
}
function updateRaidMonster(m, dt) {
  m.raidLeft -= dt;
  var room = m.raidRoom;
  if (!m.path || m.pathI >= m.path.length) {
    if (m.raidLeft <= 0) { endRaid(m); return; }
    // wander to a random desk / chair
    var c = R.pick(room.chairs); monsterGoto(m, room.li, c.x + R.range(-0.5, 0.5), c.z + R.range(-0.5, 0.5));
    m._pause = R.range(0.8, 2);
  }
  if (m._pause > 0 && m.pathI >= (m.path ? m.path.length : 0)) { m._pause -= dt; m.speed = 0; return; }
  followPath(m, 1.25, dt);
  // check unhidden people
  if (!PL.hidden && PL.li === m.li && Math.sqrt(dist2(m.x, m.z, PL.x, PL.z)) < 9 && losClear(m.li, m.x, m.z, PL.x, PL.z)) { monsterGoto(m, PL.li, PL.x, PL.z); followPath(m, 3.5, dt); }
  NPCS.forEach(function (n) { if (n.alive && n.state !== 'raidHide' && !n.seated && n.li === m.li && dist2(n.x, n.z, m.x, m.z) < 1) npcKilled(n, m); });
  // close to the player's hiding desk: hold your breath
  if (PL.hidden && dist2(PL.hidden.x, PL.hidden.z, m.x, m.z) < 2.4 * 2.4) {
    m._sniff = (m._sniff || 0) + dt;
    if (m._sniff > 0.3 && !m._warned) { m._warned = true; showToast('HOLD YOUR BREATH!', '息を止めろ！（🫁 長押し / SPACE）', 2); sfx('breathM', mpos(m), { v: 0.5 }); }
    if (!PL.breath && m._sniff > 1.2) { m._sniff = 0; if (R() < 0.6) onMonsterCatch(m); }
  } else { m._sniff = 0; }
}
function endRaid(m) {
  // leave through the door, lights return
  setState(m, 'leave'); var door = MAP.doors[m.raidRoom.doors[0]]; monsterGoto(m, m.li, door.x, door.z + (m.raidRoom.cz > door.z ? -3 : 3));
  setTimeoutG(function () {
    if (GAME.mode !== 'play') return;
    removeMonster(m); GAME.raidMon = null;
    lightsOn(); GAME.phase = 'lesson';
    if (PL.hidden) exitHide();
    var c = PL.raidChair; if (c) seatPlayer(c);
    NPCS.forEach(function (n) { if (n.alive && n.state === 'raidHide' && n.raidChair) npcSeat(n, n.raidChair); });
    var gone = NPCS.filter(function (n) { return !n.alive && !n._reported; }); gone.forEach(function (n) { n._reported = true; });
    if (gone.length) showToast(gone.map(function (n) { return n.name.toUpperCase(); }).join(', ') + ' — EMPTY SEAT', gone.map(function (n) { return n.name; }).join('、') + 'の席が空いている…', 3);
    hideHUDForLesson(true);
    if (TEACHER) TEACHER.lookWindow = false;
    var hootsWas = GAME.hootsRevealPeriod === GAME.period;
    if (hootsWas) { removeTeacher(); GAME.hootsRevealPeriod = -1; runLines([['Hoo... hoo. Sorry about that, class. The suit... gets itchy.', 'フー…フー。ごめんなさいね。着ぐるみが…かゆくて。']], 'hoots', function () { if (typeof pauseLesson === 'function') pauseLesson(false); }); spawnTeacher(currentStop().room); }
    else if (typeof pauseLesson === 'function') pauseLesson(false);
  }, 3500);
}

// ---- lunch ----------------------------------------------------------------------
function runLunch() {
  var room = currentStop().room;
  // lunch box on the table in front of the player
  var c = PL.seated;
  var lm = itemMesh('lunch'); lm.position.set(c.x + Math.sin(c.rot) * 0.55, LV_Y[c.li] + 0.76, c.z + Math.cos(c.rot) * 0.55);
  RENDER.scene.add(lm); GAME.lunchBox = { mesh: lm, taken: false };
  var alive = NPCS.filter(function (n) { return n.alive; });
  var lines = [];
  alive.slice(0, 3).forEach(function (n) { var L = R.pick(NPC_LINES[n.pers]); lines.push({ n: n, l: L }); });
  lines.push({ n: null, l: ['Lunch is over in one minute. Please clean up your trays.', 'あと1分で昼休みは終わりです。トレイを片付けてください。'] });
  var i = 0;
  function next() {
    if (GAME.mode !== 'play' || GAME.phase !== 'lunch') return;
    if (i >= lines.length) { setTimeoutG(function () { if (GAME.phase === 'lunch' && GAME.lunchBox) { RENDER.scene.remove(GAME.lunchBox.mesh); } endOfLunch(); }, 4000); return; }
    var L = lines[i++];
    if (L.n) npcSay(L.n, L.l[0], L.l[1], 4); else { sfx('chime'); showSubtitle('PA: ' + L.l[0], L.l[1], 4, 'pa'); say(L.l[0], 'pa'); }
    GAME._lineTimer = setTimeoutG(next, 4800);
  }
  setTimeoutG(next, 1500);
  showToast('LUNCH', '昼休み。生徒の話にヒントがあるかも。🍱 を取っておこう', 3.5);
}
function endOfLunch() {
  if (GAME.mode !== 'play') return;
  GAME.hint = 1;
  var next = GAME.schedule[GAME.period + 1], nr = next.room;
  runLines([['Next: ' + ROLE_INFO[nr.role].en + ', Room ' + nr.number + '. Go, go, go!', '次は ' + ROLE_INFO[nr.role].ja + '（' + nr.number + '号室・' + (nr.li === 2 ? '2階' : '1階') + '）です。']], 'pa', endOfPeriod);
}

// ---- teacher (lights-on Hoots at the board) ----------------------------------------
var TEACHER = null;
function spawnTeacher(room) {
  removeTeacher();
  var m = buildMonsterModel('hoots');
  m.rig.bones[0].userData.y0 = m.rig.bones[0].position.y;
  var x = room.x0 + 1.2, z = room.cz + 0.8;
  m.root.position.set(x, LV_Y[room.li], z); m.root.rotation.y = PI / 2;
  RENDER.scene.add(m.root);
  m.head.visible = false;
  TEACHER = { mdl: m, room: room, t: 0, talk: 0, x: x, z: z, li: room.li, lookWindow: false };
  var pr = WORLD.baker.probe(room.li, x, LV_Y[room.li] + 1.2, z);
  m.mats.forEach(function (mt) { if (mt.userData.probeOn) setProbe(mt, pr.on, pr.off); });
}
function removeTeacher() { if (!TEACHER) return; RENDER.scene.remove(TEACHER.mdl.root); TEACHER.mdl.mats.forEach(function (m) { m.dispose(); }); TEACHER = null; }
function updateTeacher(dt) {
  if (!TEACHER) return;
  var T = TEACHER; T.t += dt; T.talk -= dt;
  var R2 = T.mdl.rig, B = R2.byName;
  poseReset(R2);
  animIdle(R2, T.t);
  // waving & gesturing at the board
  B.uaR.rotation.z = -0.4 - (T.talk > 0 ? 0.9 + Math.sin(T.t * 6) * 0.4 : 0.2);
  B.uaL.rotation.x = -0.4 + Math.sin(T.t * 1.5) * 0.2;
  B.chest.rotation.y = Math.sin(T.t * 0.8) * 0.15;
  var ch = T.mdl.extra.costumeHead;
  var lookAt = Math.atan2(PL.x - T.x, PL.z - T.z) - PI / 2;
  if (T.lookWindow) lookAt = (T.room.side === 'S' ? -1 : 1) * 1.2;
  B.neck.rotation.y = damp(B.neck.rotation.y || 0, clamp(angDiff(0, lookAt), -1.2, 1.2), 2, dt);
  if (ch) { ch.rotation.z = T.talk > 0 ? Math.sin(T.t * 9) * 0.06 : 0; ch.rotation.x = 0; }
  if (T.mdl.extra.pupil1) { T.mdl.extra.pupil1.position.y = 0.26 + Math.sin(T.t * 3) * 0.004; }
  T.mdl.root.position.y = LV_Y[T.li] + Math.abs(Math.sin(T.t * 3)) * (T.talk > 0 ? 0.02 : 0);
}
function hideHUDForLesson(lesson) {
  if (!UIX.hud) return;
  var vis = lesson ? 'hidden' : 'visible';
  [UIX.bCrouch, UIX.bFlash, UIX.bItem, UIX.bBreath, UIX.stickHint, UIX.inv].forEach(function (b) { b.style.visibility = vis; });
  UIX.bInteract.style.visibility = (!lesson || GAME.phase === 'lunch') ? 'visible' : 'hidden';
}
function updateObjective() {
  var st = GAME.schedule[GAME.period], next = GAME.schedule[GAME.period + 1];
  var h = '';
  if (GAME.phase === 'transit' || GAME.phase === 'resolve') {
    var r = GAME.target, info = ROLE_INFO[r.role];
    var num = next.kind === 'class' ? (GAME.hint >= 1 ? 'RM ' + r.number + ' · ' : '') : '';
    h = '<span class="en">NEXT: ' + num + (next.kind === 'bus' ? 'SCHOOL BUS' : info.en) + '</span><span class="ja">次：' + (next.kind === 'bus' ? 'スクールバス（正面玄関の外）' : info.ja + (GAME.hint >= 1 && next.kind === 'class' ? '・' + (r.li === 2 ? '2階' : '1階') : '')) + '</span>';
    var taken = r.chairs.filter(function (c) { return c.avail && c.occ !== -1; }).length;
    h += '<span class="seats">SEATS ' + (GAME.seatsTotal - taken) + '/' + GAME.seatsTotal + '</span>';
  } else if (st) {
    h = '<span class="en">' + st.label[0] + '</span><span class="ja">' + st.label[1] + (st.kind === 'class' ? '：' + ROLE_INFO[st.room.role].ja : '') + '</span>';
  }
  if (UIX._objH !== h) { UIX.obj.innerHTML = h; UIX._objH = h; }
}
function showDialog(inner, btn, cb) {
  var s = showScreen('dialog', '<div class="hp-panel"><div class="hp-dlg">' + inner + '<button class="hp-menu-btn pe" id="hp-dlg-ok" style="margin-top:14px">' + (btn || 'OK') + '</button></div></div>');
  onTap(document.getElementById('hp-dlg-ok'), function () { hideScreen('dialog'); sfx('ui'); if (cb) cb(); });
}

// ---- per-frame update in play -------------------------------------------------------
var _promptT = 0;
function updatePlay(dt) {
  if (consume('pause')) { openPause(); return; }
  if (PL.invuln > 0) PL.invuln -= dt;
  if (consume('flash')) { if (GAME.phase === 'transit' || GAME.phase === 'raid' || GAME.phase === 'resolve') toggleFlash(); }
  if (consume('item')) { if (GAME.phase === 'transit' || GAME.phase === 'raid') useItem(); }
  if (consume('next')) { if (PL.invOrder && PL.invOrder.length) { PL.sel = (PL.sel + 1) % PL.invOrder.length; renderInventory(); } }
  for (var s = 1; s <= 9; s++) if (consume('slot' + s)) { if (PL.invOrder && PL.invOrder[s - 1]) { PL.sel = s - 1; renderInventory(); } }
  updatePlayer(dt);
  updateDoors(dt, [PL].concat(NPCS.filter(function (n) { return n.alive && !n.seated; })).concat(MONSTERS.filter(function (m) { return m.active && m.visible && !m.watcher; })));
  if (GAME.phase === 'transit' || GAME.phase === 'resolve' || GAME.phase === 'raid' || GAME.phase === 'raidWarn') updateMonsters(dt);
  else NOISES.length = 0;
  updateNPCs(dt, GAME.phase);
  updateTeacher(dt);
  updateThrown(dt);
  // interaction prompt
  _promptT -= dt;
  var it = findInteraction();
  if (it) setPrompt(it.en, it.ja); else setPrompt(null);
  if (consume('interact') && it) { it.fn(); sfx('click'); }
  if (GAME.phase === 'transit') {
    GAME.timer -= dt; GAME.clock += dt;
    if (GAME.timer <= 0) endTransit('time');
    else checkAllSeated();
    // ambient scares
    ambientScares(dt);
  }
  // fear
  var mf = monsterFear();
  PL.fear = damp(PL.fear, Math.max(mf.f, GAME.phase === 'raid' ? 0.4 : 0), 3, dt);
  updateObjective();
  var tb = GAME.phase === 'transit' ? Math.max(0, GAME.timer) : -1;
  if (tb >= 0) { var mm = Math.floor(tb / 60), ss = Math.floor(tb % 60); var txt = 'BELL ' + mm + ':' + (ss < 10 ? '0' : '') + ss; if (UIX.bell._t !== txt) { UIX.bell.textContent = txt; UIX.bell._t = txt; } UIX.bell.classList.toggle('warn', tb < 15); }
  else if (UIX.bell._t !== '') { UIX.bell.textContent = ''; UIX.bell._t = ''; }
  updateMinimap();
  updateHUD(dt);
  // items glint
  GAME.items.forEach(function (it) { it.mesh.rotation.y += dt; it.mesh.userData.glint.material.opacity = 0.25 + Math.sin(now() * 4 + it.x) * 0.2; });
}
// spooky one-shots while walking in the dark
var SCARE = { t: 8 };
var FLASH_FACES = [1, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
function ambientScares(dt) {
  SCARE.t -= dt;
  if (SCARE.t > 0) return;
  SCARE.t = R.range(9, 18) - Math.min(5, GAME.night);
  var r = R();
  var p = { li: PL.li, x: PL.x + R.range(-10, 10), z: PL.z + R.range(-10, 10) };
  if (r < 0.25) sfx('creak', p);
  else if (r < 0.4) sfx('thump', p);
  else if (r < 0.5) sfx('drip', p);
  else if (r < 0.6) sfx('whisper', p);
  else if (r < 0.7) { sfx('giggle', p); }
  else if (r < 0.8) { sfx('paStatic', null, { len: 1.4 }); if (GAME.night >= 2) setTimeoutG(function () { say(R.pick(['Hoo... are you... in your seat?', 'Nobody leaves... early.', 'Hoo-ray... for... staying.']), 'creepy'); }, 300); }
  else if (r < 0.9 && windowFace()) { }
  else { // face flash: a frame of tape
    subliminalFlash(R.pick(FLASH_FACES));
  }
}
function subliminalFlash(img) {
  if (SAVE.settings.scare === 'MILD' && R() < 0.5) return;
  POSTU.tFace.value = FACE_TEX[img];
  var t0 = now(); POSTU.uFaceZoom.value = 0.5; POSTU.uFaceShake.value.set(R.range(-0.25, 0.25), R.range(-0.15, 0.15));
  (function f() { var t = now() - t0; POSTU.uFace.value = t < 0.06 ? 0.55 : t < 0.1 ? 0.15 : 0; if (t < 0.12 && GAME.mode === 'play') requestAnimationFrame(f); else POSTU.uFace.value = 0; })();
  sfx('staticBurst', null, { len: 0.12 });
}
// minimap
function updateMinimap() {
  var show = (GAME.mapScrap || GAME.hint >= 2) && (GAME.phase === 'transit' || GAME.phase === 'raid');
  UIX.minimap.style.display = show ? '' : 'none';
  if (!show) return;
  var cv = UIX.minimap.firstChild, g = cv.getContext('2d');
  var W = 248, px = 3.1; // pixels per cell
  g.fillStyle = 'rgba(6,10,12,0.9)'; g.fillRect(0, 0, W, W);
  var L = MAP.lv[PL.li];
  var reveal = GAME.mapReveal[PL.li] || GAME.mapScrap;
  var r0 = 40, pcx = m2c(PL.x), pcz = m2r(PL.z);
  for (var dz = -r0; dz < r0; dz++) for (var dx = -r0; dx < r0; dx++) {
    var cx = pcx + dx, cz = pcz + dz; if (!inGrid(cx, cz)) continue;
    var i = cidx(cx, cz), t = L.type[i];
    if (t === T_WALL || t === T_VOID) continue;
    if (!reveal && (Math.abs(dx) > 12 || Math.abs(dz) > 12)) continue;
    var rm = L.room[i];
    g.fillStyle = t === T_BLOCK ? '#3a3226' : t === T_STAIR ? '#6a8a9a' : t === T_DOOR ? (MAP.doors[L.door[i]].locked ? '#c33' : '#8a7') : (GAME.target && rm === GAME.target.id && GAME.hint >= 1 ? '#d4ad3a' : '#2b3943');
    g.fillRect(W / 2 + dx * px, W / 2 + dz * px, px + 0.4, px + 0.4);
  }
  g.fillStyle = '#fff'; g.save(); g.translate(W / 2, W / 2); g.rotate(-PL.yaw); g.beginPath(); g.moveTo(0, -8); g.lineTo(5, 6); g.lineTo(-5, 6); g.closePath(); g.fill(); g.restore();
}
function openPause() {
  if (GAME.mode !== 'play') return;
  GAME.mode = 'pause';
  try { if (document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
  if (AU.ctx) try { AU.ctx.suspend(); } catch (e) {}
  if (AU.cur && AU.tracks[AU.cur]) AU.tracks[AU.cur].el.pause();
  stopVoice();
  var s = showScreen('pause', '<div style="position:absolute;inset:0;background:rgba(0,0,0,.78)"></div><div class="hp-panel"><div style="font:30px Bungee;color:#fff">PAUSED</div><div style="font:700 13px Zen Kaku Gothic New;color:#bbb;margin-bottom:16px">一時停止中</div>' +
    '<button class="hp-menu-btn pe" id="hp-resume">' + bi('RESUME', '再開') + '</button><button class="hp-menu-btn alt pe" id="hp-psettings">' + bi('SETTINGS', '設定') + '</button><button class="hp-menu-btn alt2 pe" id="hp-pquit">' + bi('QUIT TO TITLE', 'タイトルへ戻る') + '</button>' +
    '<div class="tw" style="color:#999;font-size:13px;margin-top:10px">NIGHT ' + GAME.night + ' · ' + (GAME.schedule[GAME.period] ? GAME.schedule[GAME.period].label[0] : '') + '</div></div>');
  onTap(document.getElementById('hp-resume'), resumeGame);
  onTap(document.getElementById('hp-psettings'), function () { openSettings(function () { }); });
  onTap(document.getElementById('hp-pquit'), function () { hideScreen('pause'); if (AU.ctx) AU.ctx.resume(); goTitle(); });
}
function resumeGame() {
  hideScreen('pause'); GAME.mode = 'play'; sfx('ui');
  if (AU.ctx) try { AU.ctx.resume(); } catch (e) {}
  if (AU.cur && AU.tracks[AU.cur]) AU.tracks[AU.cur].el.play().catch(function () {});
  if (typeof pauseLesson === 'function' && GAME.phase === 'lesson') { }
}

// a face pressed against a window (or in a restroom mirror) for a moment
var WFACE = null;
function windowFace() {
  var cands = MAP.windows.filter(function (w) { return w.li === PL.li && !w.high && dist2(w.x, w.z, PL.x, PL.z) < 100 && dist2(w.x, w.z, PL.x, PL.z) > 9; });
  MAP.slots.forEach(function (r) { if (r.mirror && r.li === PL.li && dist2(r.mirror.x, r.mirror.z, PL.x, PL.z) < 64) cands.push({ x: r.mirror.x, z: r.mirror.z, nx: 0, nz: r.side === 'S' ? -1 : 1, mirror: true, y: r.mirror.y }); });
  var f = camForward();
  cands = cands.filter(function (w) { var dx = w.x - PL.x, dz = w.z - PL.z, d = Math.sqrt(dx * dx + dz * dz); return (dx * f.x + dz * f.z) / d > 0.75; });
  if (!cands.length) return false;
  var w = R.pick(cands);
  if (!WFACE) {
    var alpha = toTex(texGlow('rgba(255,255,255,1)', 128), { clamp: true });
    WFACE = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ transparent: true, alphaMap: alpha, depthWrite: false, fog: false, color: 0x9aa0a8 }));
    WFACE.renderOrder = 6; RENDER.scene.add(WFACE);
  }
  WFACE.material.map = FACE_TEX[R.pick(FLASH_FACES)]; WFACE.material.needsUpdate = true;
  var out = w.mirror ? -0.03 : 0.32; // outside the glass
  WFACE.position.set(w.x - (w.nx || 0) * out, w.y || (LV_Y[PL.li] + 1.55), w.z - (w.nz || 0) * out);
  WFACE.rotation.set(0, Math.atan2(w.nx || 0, w.nz || 0), 0);
  WFACE.visible = true;
  sfx('whisper', { li: PL.li, x: w.x, z: w.z });
  setTimeoutG(function () { if (WFACE) WFACE.visible = false; sfx('staticBurst', null, { len: 0.1 }); }, 350 + R() * 300);
  return true;
}
