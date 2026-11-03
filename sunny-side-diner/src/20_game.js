// ---- the shift: clock, schedule, stations, freezer, switches, calls, map, end states ----
var GAME = { mode: 'boot', day: 1, min: 0, rate: 60 / 135, tips: 0, sales: 0, served: 0, angry: 0, refusedNormal: 0, resolved: 0, callsLeft: 2, sched: [], usedFaces: {}, paused: false };
var SHIFT_LEN = 480; // 22:00 -> 06:00
function newGameState(day) {
  GAME = { mode: 'play', day: day, min: 0, rate: 60 / 135, tips: 0, sales: 0, served: 0, angry: 0, refusedNormal: 0, resolved: 0, callsLeft: 2, sched: [], usedFaces: {}, paused: false, inAnomaly: 0, lightsSwitched: 0, cold: 0 };
  GAME.oddFail = function (C) { anomalyFail(C.anomaly, C.anomaly ? C.anomaly.face : pickFace(['human']), { person: C.P, rule: 'offmenu' }); };
}
function clearWorld() {
  CUSTS.slice().forEach(function (C) { removeCustomer(C); }); CUSTS.length = 0;
  TICKETS.slice().forEach(function (T) { removeTicket(T); }); TICKETS.length = 0;
  ACTIVE.slice().forEach(function (A) { if (A.cleanup) try { A.cleanup(A); } catch (e) {} if (A.def && A.def.cleanup) try { A.def.cleanup(A); } catch (e) {} }); ACTIVE.length = 0;
  SEATS.forEach(function (s) { s.taken = null; });
  if (FX.visitor) { FX.visitor.state = 'idle'; FX.visitor.obj.visible = false; }
  LSTATE.lightsOn = true; LSTATE.neonOn = true; LSTATE.coldT = 0; LSTATE.cold = 0; LSTATE.flick = 0; LSTATE.eyesExtra = 1; LSTATE.kitchenFlick = false;
  setNeonEyes(0, null); jukeGlass(0, false);
  WORLD.backDoor.rotation.y = 0; CAM.inFreezer = false; CAM.outside = false; WORLD.freezerDoor.rotation.y = 0;
  FX.rainT = 0; FX.rain = 0;
  PU.uFace.value = 0; PU.uBlack.value = 0; PU.uCold = PU.uCold; PU.uFear.value = 0;
  JS.on = false;
}
// ---- schedule ----------------------------------------------------------------------------
function buildSchedule(day) {
  var S = [], rnd = R, t = 4;
  // regular customers: busy early, sparse late
  while (t < SHIFT_LEN - 25) {
    S.push({ at: t, type: 'cust' });
    t += t < 150 ? rnd.range(9, 16) - Math.min(4, day) : rnd.range(30, 48);
  }
  // anomalies
  var pool = rulesForDay(day).map(function (r) { return r.id; }).filter(function (id) { return id !== 'dayshift'; });
  var n = Math.min(DAY_ANOM[day], pool.length), pick = [];
  if (day >= 2 && pool.indexOf('booth4') >= 0 && rnd() < 0.85) pick.push('booth4');
  if (pool.indexOf('phone') >= 0 && (day === 1 || rnd() < 0.6)) pick.push('phone');
  var rest = pool.filter(function (id) { return pick.indexOf(id) < 0; }); R.shuffle(rest);
  if (day === 1) rest = rest.filter(function (id) { return id !== 'faceless' || true; });
  while (pick.length < n && rest.length) pick.push(rest.shift());
  var slots = [], s0 = 62 + rnd.range(0, 15);
  var others = pick.filter(function (id) { return id !== 'booth4' && id !== 'phone'; });
  var gap = (430 - s0) / Math.max(1, others.length);
  others.forEach(function (id, i) { slots.push({ at: s0 + gap * i + rnd.range(0, gap * 0.5), type: 'anom', id: id }); });
  if (pick.indexOf('booth4') >= 0) slots.push({ at: 300 + rnd.range(-12, 8), type: 'anom', id: 'booth4' });
  if (pick.indexOf('phone') >= 0) slots.push({ at: rnd.range(70, 140), type: 'anom', id: 'phone' });
  if (day === 5) slots.push({ at: 452, type: 'anom', id: 'dayshift' });
  // keep anomalies apart from each other
  slots.sort(function (a, b) { return a.at - b.at; });
  for (var i = 1; i < slots.length; i++) if (slots[i].id !== 'phone' && slots[i - 1].id !== 'phone' && slots[i].at - slots[i - 1].at < 30) slots[i].at = slots[i - 1].at + 30;
  S = S.concat(slots);
  // atmosphere beats
  S.push({ at: 180, type: 'midnight1' }); // 1:00 the jukebox skips to the late record
  S.push({ at: 200 + rnd.range(0, 40), type: 'rain' });
  for (var k = 0; k < 2 + day; k++) S.push({ at: rnd.range(150, 460), type: 'scare' });
  S.push({ at: rnd.range(240, 420), type: 'thunder' });
  S.sort(function (a, b) { return a.at - b.at; });
  return S;
}
function runSchedule() {
  while (GAME.sched.length && GAME.sched[0].at <= GAME.min) {
    var e = GAME.sched.shift();
    if (e.type === 'cust') {
      var live = CUSTS.filter(function (c) { return c.state !== 'gone' && c.state !== 'leaving'; }).length;
      if (live >= (GAME.min < 150 ? 4 : 3) || GAME.inAnomaly > 1) { e.at += 6; GAME.sched.push(e); GAME.sched.sort(function (a, b) { return a.at - b.at; }); continue; }
      var arch = pickArch();
      if (FX.visitor.state === 'idle' && Math.random() < 0.6) visitorArrive({ onPark: function () { setTimeout(visitorLeaveLater, 3000); } });
      var C = spawnCustomer(arch, { kid: arch.kid });
      GAME.lastCust = C;
    } else if (e.type === 'anom') { if (GAME.inAnomaly && e.id !== 'phone') { e.at += 12; GAME.sched.push(e); GAME.sched.sort(function (a, b) { return a.at - b.at; }); continue; } var A = makeAnomaly(e.id, e.at); bindAnomaly(A); startAnomaly(A); }
    else if (e.type === 'midnight1') { if (!GAME.inAnomaly && JUKE.key === 'boogie') jukeSkipTo('warped', 'B3 Last Call'); JUKE.label = 'B3 Last Call'; LSTATE.coldT = Math.max(LSTATE.coldT, 0.2); toast('1:00 AM — the jukebox skips to another record: B3 "Last Call"', '午前1時。ジュークボックスがB3「Last Call」に変わった', 3.4); }
    else if (e.type === 'rain') { FX.rainT = 0.55 + GAME.day * 0.09; sfx('thunder', null, { vol: 0.5 }); }
    else if (e.type === 'thunder') { sfx('thunder'); PU.uFlash.value = 0.25; setTimeout(function () { PU.uFlash.value = 0; }, 90); }
    else if (e.type === 'scare') ambientScare();
  }
}
function visitorLeaveLater() { setTimeout(function () { if (FX.visitor.state === 'parked' && !FX.visitor.high) visitorLeave(); }, 25000 + Math.random() * 30000); }
var ARCH_BAG = [];
function pickArch() { if (!ARCH_BAG.length) ARCH_BAG = R.shuffle(ARCH.slice()); var a = ARCH_BAG.shift(); if (CUSTS.some(function (c) { return c.arch === a; })) a = ARCH_BAG.shift() || ARCH[0]; return a; }
function bindAnomaly(A) {
  var d = A.def;
  A.hint = d.hint;
  if (A.id === 'faceless') {
    A.onServe = function (C, what) { lungeFail(A, C); return true; };
    A.onRefuse = function (C, how) { anomalyResolve(A); return false; };
    A.onIgnore = function (C) { toast('It keeps breathing at you.', 'それはこちらに向かって息をしている。', 2); return true; };
  } else if (A.id === 'offmenu') {
    A.onRefuse = function (C, how) { if (how === 'odd') { custSay(C, '...Not on the menu.', '……メニューに、ない。', { odd: true }); setTimeout(function () { anomalyResolve(A); customerLeave(C); }, 1800); return true; } anomalyResolve(A); return false; };
  } else if (A.id === 'doppel') {
    A.onServe = function (C) { lungeFail(A, C); return true; };
    A.onRefuse = function () { anomalyResolve(A); return false; };
    A.onIgnore = function (C) { anomalyResolve(A); C.P.lookAtCam = true; setTimeout(function () { customerLeave(C); }, 1500); return true; };
  } else if (A.id === 'reflection') {
    A.onTap = function (C) { lungeFail(A, C); return true; };
  }
}
// ---- ambient scares (no rule; tension) ------------------------------------------------------
function ambientScare() {
  if (GAME.mode !== 'play' || JS.on) return;
  var r = Math.random(), st = CAM.station;
  if (r < 0.3) { sfx('steps', new THREE.Vector3(-9.6, 0.2, 0.2), { n: 4, vol: 0.9 }); }
  else if (r < 0.5) { distantFigure(['shadow', 'crawler'], st === 'DOOR' || st === 'BOOTHS' ? new THREE.Vector3(-6 + Math.random() * 10, 1.1, 22 + Math.random() * 6) : new THREE.Vector3(-9.9, 1.2, 0.2), 1.6); }
  else if (r < 0.65) { sfx('freezerBang', new THREE.Vector3(6.5, 1.2, -4)); }
  else if (r < 0.72) { tvGlitch(1.2); }
  else if (r < 0.86 && (st === 'COUNTER' || st === 'BOOTHS') && GAME.day >= 2) { behindYou(); }
  else { sfx('coyote'); }
}
function behindYou() { // only the window sees it: someone standing right behind you
  var P = personFrom(ARCH[Math.floor(Math.random() * ARCH.length)]); P.odd = 1; P.lookAtCam = true; setPose(P, 'standStare');
  var n = pickFace(['human', 'glitch'], 'behind'); attachHorror(P, n); revealHorror(P, 1);
  var cam = RENDER.camera.position, dir = new THREE.Vector3(); RENDER.camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
  P.root.position.set(cam.x - dir.x * 0.9, 0, cam.z - dir.z * 0.9); P.root.rotation.y = Math.atan2(dir.x, dir.z);
  RENDER.scene.add(P.root); setLayer(P.root, LAYER_REFL_ONLY);
  sfx('breath', P.root.position, { len: 1.6, vol: 0.6 });
  setTimeout(function () { disposePerson(P); }, 1400);
}
function distantFigure(kinds, pos, dur) {
  var n = pickFace(kinds, 'far'), tex = toTex(horrorCanvas(n), { clamp: true });
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x6a6a72, transparent: true, opacity: 0, depthWrite: false }));
  sp.scale.set(1.3, 1.6, 1); sp.position.copy(pos); RENDER.scene.add(sp);
  var t0 = performance.now(), D2 = (dur || 1.5) * 1000;
  var step = function () { var k = (performance.now() - t0) / D2; sp.material.opacity = Math.sin(clamp(k, 0, 1) * PI) * 0.75; if (k < 1) requestAnimationFrame(step); else { RENDER.scene.remove(sp); tex.dispose(); } };
  requestAnimationFrame(step);
}
// ---- the TV over the back bar -----------------------------------------------------------------
var TV = { t: 0, glitch: 0, mode: 'show', ad: 0 };
function tvGlitch(sec) { TV.glitch = sec; TV.face = pickFace(['glitch'], 'tv'); sfx('static', new THREE.Vector3(-3.5, 2.05, -2.45), { len: sec }); }
function drawTV(dt) {
  if (!WORLD.tvCanvas || TV.mode === 'cm' || TV.mode === 'live') return;
  TV.t += dt; if (RENDER.frame % 3) return;
  var c = WORLD.tvCanvas, g = c.getContext('2d'), w = c.width, h = c.height, t = TV.t;
  if (TV.glitch > 0) {
    TV.glitch -= dt * 3; var id = g.createImageData(w, h), d = id.data; for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } g.putImageData(id, 0, 0);
    var im = FACE_IMG[TV.face]; if (im && im.naturalWidth && Math.random() < 0.6) { g.globalAlpha = 0.7; g.drawImage(im, 20, 10, w - 40, h - 20); g.globalAlpha = 1; }
  } else if (GAME.min > 180 && GAME.mode === 'play') { // late: late-night test pattern & weather
    g.fillStyle = '#101418'; g.fillRect(0, 0, w, h);
    var bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0']; bars.forEach(function (b, i) { g.fillStyle = b; g.globalAlpha = 0.65; g.fillRect(i * w / 7, 0, w / 7 + 1, h * 0.62); });
    g.globalAlpha = 1; g.fillStyle = '#111'; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#e8e8e8'; g.font = '18px ' + F.ui; g.textAlign = 'center'; g.fillText('KXDR — FLASH FLOOD WATCH', w / 2, h * 0.75); g.font = '14px ' + F.ui; g.fillText('STAY INDOORS · KEEP YOUR LIGHTS ON', w / 2, h * 0.88);
  } else { // early: old Sunny cartoon
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f4a04a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.55); g.rotate(t * 0.3); for (var r = 0; r < 12; r++) { g.fillStyle = r % 2 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 220, r / 12 * TAU, (r + 0.5) / 12 * TAU); g.fill(); } g.restore();
    drawSunny(g, w / 2, h * 0.5 + Math.sin(t * 5) * 6, 46, { wave: 0.4 + Math.sin(t * 6) * 0.5, look: Math.sin(t) * 0.5 });
    g.fillStyle = '#c8282e'; g.font = '22px ' + F.logo; g.textAlign = 'center'; g.fillText('Rise and shine!', w / 2, 30);
  }
  // CRT: scanlines + vignette
  g.fillStyle = 'rgba(0,0,0,0.18)'; for (var y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  var vg = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  WORLD.tvTex.needsUpdate = true;
}
// ---- Sunny gets stranger each night (props) -----------------------------------------------------
function sunnyProgress(day) {
  // exterior sign face, coloring page on a booth table, costume in the lot
  WORLD.exSunnyMat.map = toTex(sunnyCanvas(512, { wave: 0.6, mood: day >= 5 ? 'grin' : day >= 4 ? 'stare' : 'happy', look: day >= 3 ? -0.6 : 0 }), { clamp: true }); WORLD.exSunnyMat.needsUpdate = true;
  if (WORLD.coloring) { RENDER.scene.remove(WORLD.coloring); WORLD.coloring = null; }
  var c = mkCanvas(256, 340), g = c.getContext('2d'); g.fillStyle = '#fbf6ea'; g.fillRect(0, 0, 256, 340); g.fillStyle = '#c8282e'; g.font = '22px ' + F.slab; g.textAlign = 'center'; g.fillText('KIDS MENU', 128, 34); g.font = '15px ' + F.ui; g.fillStyle = '#333'; g.fillText('Color me in!', 128, 56);
  drawSunny(g, 128, 180, 80, { line: true, mood: day >= 4 ? 'hollow' : 'happy', scribble: day >= 3 ? 7 + day : 0 });
  if (day >= 4) { g.fillStyle = '#a01018'; g.font = '20px ' + F.hand; g.fillText((SAVE.name || 'YOU') + ' STAY', 128, 320); }
  var m = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.28), new THREE.MeshStandardMaterial({ map: toTex(c, { clamp: true }), roughness: 0.85 })); m.rotation.x = -PI / 2; m.rotation.z = 0.3; m.position.set(D.booths[1] - 0.05, 0.783, 4.45); RENDER.scene.add(m); WORLD.coloring = m;
  menuTex(day >= 5 ? 'grin' : day >= 4 ? 'stare' : 'happy');
  if (WORLD.costume) { RENDER.scene.remove(WORLD.costume); WORLD.costume = null; }
  if (day >= 3) {
    var n = pickFace(['costume', 'plush'], 'lot'), tex = toTex(sunnyCostumeCanvas(day, n), { clamp: true });
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x8a8a90, transparent: true, depthWrite: false })); sp.scale.set(1.2, 2.0, 1); sp.position.set(-5.5 + Math.random() * 3, 1.0, 17 + Math.random() * 4); RENDER.scene.add(sp); WORLD.costume = sp;
  }
}
function sunnyCostumeCanvas(day, n) { // a person-sized Sunny suit standing in the dark
  var c = mkCanvas(256, 420), g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 256, 420);
  g.fillStyle = '#2a2a2a'; g.fillRect(96, 250, 26, 150); g.fillRect(134, 250, 26, 150);
  drawSunny(g, 128, 170, 92, { mood: day >= 5 ? 'grin' : 'stare', wave: -0.6 });
  var gr = g.createLinearGradient(0, 0, 0, 420); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0.75)'); g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(0, 0, 256, 420);
  return c;
}
// ---- stations: arrival hooks, main button ----------------------------------------------------------
function onArrive(st) {
  setSpace(st === 'KITCHEN' || st === 'BACKDOOR' ? 'kitchen' : st === 'FREEZER' ? 'kitchen' : st === 'JUKEBOX' ? 'diner' : 'diner');
  WORLD.lights.fill.intensity = st === 'BACKDOOR' ? 6 : 0;
  if (st === 'BACKDOOR') WORLD.lights.fill.position.set(-2.0, 2.4, -4.3);
  updateMainButton(); refreshTickets();
}
function updateMainButton() {
  if (!U.main) return;
  if (GAME.mode !== 'play') { setMain(null); return; }
  if (MINI.active) { setMain(MINI.main || null); return; }
  var trap = ACTIVE.filter(function (A) { return A.trap; })[0]; if (trap) { setMain(trap.trap); return; }
  var st = CAM.station, a = null;
  if (CAM.inFreezer) a = { icon: 'door', en: 'COME OUT', ja: '冷凍庫から出る', fn: leaveFreezer };
  else if (CAM.outside) a = { icon: 'back', en: 'GO BACK INSIDE', ja: '店にもどる', fn: comeInside };
  else if (st === 'KITCHEN') { var t = TICKETS.filter(function (T) { return !T.ready; })[0]; if (t) a = { icon: 'ticket', en: 'NEXT TICKET', ja: '次の伝票を作る', fn: function () { tapTicket(t); } }; }
  else if (st === 'FREEZER') a = { icon: 'snow', en: 'HIDE INSIDE', ja: '冷凍庫に隠れる', fn: enterFreezer };
  else if (st === 'REGISTER') a = { icon: 'bulb', en: 'SWITCHES', ja: '照明・ネオン・店長に電話', fn: registerMenu };
  else if (st === 'JUKEBOX') { var ph = ACTIVE.filter(function (A) { return A.id === 'phone' && A.ringing; })[0]; a = ph ? { icon: 'phone', en: 'ANSWER THE PHONE', ja: 'ピンクの電話に出る', glow: true, fn: function () { ANOM.phone.answer(ph); } } : { icon: 'record', en: 'CHOOSE A RECORD', ja: 'レコードを選ぶ', fn: jukeMenu }; }
  else if (st === 'BACKDOOR') a = { icon: 'exit', en: 'OPEN THE BACK DOOR', ja: '裏口を開ける', fn: backDoorMenu };
  else if (st === 'DOOR') { var ds = ACTIVE.filter(function (A) { return A.id === 'dayshift' && (A.stage === 1 || A.stage === 2); })[0]; if (ds) a = { icon: 'door', en: 'UNLOCK THE DOOR', ja: '入口の鍵を開ける', glow: true, fn: function () { ANOM.dayshift.openFront(ds); } }; }
  setMain(a);
}
function registerMenu() {
  var o = [
    { icon: 'bulb', en: LSTATE.lightsOn ? 'Lights OFF' : 'Lights ON', ja: LSTATE.lightsOn ? '照明を消す' : '照明をつける', fn: function () { toggleLights(); } },
    { icon: 'sign', en: LSTATE.neonOn ? 'Neon OFF' : 'Neon ON', ja: LSTATE.neonOn ? 'ネオンを消す' : 'ネオンをつける', fn: function () { toggleNeon(); } },
    { icon: 'manager', en: 'Call Dale (manager) — ' + GAME.callsLeft + ' left', ja: '店長に電話（あと' + GAME.callsLeft + '回）', dim: GAME.callsLeft <= 0, fn: callManager }
  ];
  showChoices('Register', o, { table: 'REGISTER' });
}
function toggleLights() { LSTATE.lightsOn = !LSTATE.lightsOn; sfx('switch', new THREE.Vector3(7.9, 1.4, 0.9)); WORLD.switches[0].rotation.x = LSTATE.lightsOn ? 0 : 0.6; GAME.blackout = !LSTATE.lightsOn; if (!LSTATE.lightsOn) { jukeStop(0.3); LSTATE.jukeOff = true; } else { LSTATE.jukeOff = false; if (!GAME.inAnomaly) setTimeout(function () { if (!JUKE.key && LSTATE.lightsOn) jukePlay(GAME.min > 180 ? 'warped' : 'boogie', { label: GAME.min > 180 ? 'B3 Last Call' : 'A1 Diner Boogie' }); }, 1500); } updateMainButton(); }
function toggleNeon() { LSTATE.neonOn = !LSTATE.neonOn; GAME.neonOff = !LSTATE.neonOn; sfx('switch', new THREE.Vector3(7.9, 1.4, 0.9)); WORLD.switches[1].rotation.x = LSTATE.neonOn ? 0 : 0.6; if (!LSTATE.neonOn) sfx('zap', new THREE.Vector3(1.5, 2.5, -2.6), { vol: 0.5 }); }
function callManager() {
  if (GAME.callsLeft <= 0) return; GAME.callsLeft--;
  var A = ACTIVE[0], hint = A ? anomalyHint(A.id) : ['Quiet night? Good. Keep the coffee hot and the rules close.', '静かな夜？ いいことだ。コーヒーは熱く、ルールはそばに。'];
  sfx('handset', new THREE.Vector3(7.0, 1.1, 1.65)); sfx('dialtone', null, { len: 0.8, delay: 0.2 });
  var odd = GAME.day >= 3, weird = GAME.day >= 4;
  GAME.paused = true;
  setTimeout(function () {
    talk([['DALE', weird ? 'Yeah. ...Yeah. I know who this is.' : 'Sunny Side, this is Dale.', weird ? 'ああ。……ああ。だれだか知ってるよ。' : 'サニーサイド、デールだ。', { voice: 'manager', odd: odd, rate: weird ? 0.85 : 1 }],
      ['DALE', hint[0], hint[1], { voice: 'manager', odd: weird, pitch: weird ? 0.85 : 1 }],
      weird ? ['DALE', 'Don\'t let the light go out. I\'m still in here.', '明かりを消すなよ。おれはまだ、ここにいる。', { voice: 'odd', odd: true, cls: 'odd' }] : function () { },
      function () { phoneLineStop(); sfx('handset'); GAME.paused = false; }]);
  }, 1300);
}
var RECORDS = [['A1 Diner Boogie', 'boogie'], ['A2 Highway Moon', null], ['A3 Rise & Shine', null], ['B1 Desert Rain', null], ['B2 Neon Heart', null], ['B3 Last Call', 'warped']];
function jukeMenu() {
  var A = ACTIVE.filter(function (x) { return x.id === 'jukebox'; })[0];
  var now = JUKE.label || '—';
  showChoices('Now playing: ' + now, RECORDS.map(function (r) {
    return { icon: 'record', en: r[0], ja: r[1] ? (r[1] === 'boogie' ? 'ダイナー・ブギ' : 'ラスト・コール') : '（このレコードは傷だらけ）', fn: function () {
      if (A) { ANOM.jukebox.choose(A, r[0]); return; }
      if (!r[1]) { sfx('needle', WORLD.jukeboxPos); toast('That record is too scratched to play.', 'このレコードは傷だらけでかからない。', 2); return; }
      sfx('needle', WORLD.jukeboxPos); jukePlay(r[1], { label: r[0] }); JUKE.label = r[0];
    } };
  }), { table: 'JUKEBOX' });
}
function backDoorMenu() {
  var A = ACTIVE.filter(function (x) { return x.id === 'backdoor'; })[0];
  showChoices('The back door', [
    { icon: 'exit', en: 'Open it', ja: '開ける', warn: !!A, fn: function () { if (A) ANOM.backdoor.open(A); else stepOutside(); } }
  ], { table: 'BACK DOOR' });
}
function stepOutside() {
  sfx('door', new THREE.Vector3(-2.6, 1.2, -5.2)); WORLD.backDoor.rotation.y = -1.1; CAM.outside = true; setSpace('outside');
  closeShot(new THREE.Vector3(-2.6, 1.62, -6.4), new THREE.Vector3(-1.0, 1.0, -7.5), 1.0);
  updateMainButton();
  if (GAME.min > 120 && Math.random() < 0.25 + GAME.day * 0.05) { setTimeout(function () { if (CAM.outside && GAME.mode === 'play') { GAME.failRule = 'outside'; jumpscare(pickFace(['animal']), {}); } }, 3500 + Math.random() * 3000); }
  else if (!SAVE.lore.l13 && GAME.day >= 3) setTimeout(function () { if (CAM.outside) giveLore('l13'); }, 1500);
}
function comeInside() { CAM.outside = false; releaseShot(0.8); setTimeout(function () { WORLD.backDoor.rotation.y = 0; sfx('door', new THREE.Vector3(-2.6, 1.2, -5.2)); setSpace('kitchen'); }, 800); updateMainButton(); }
// ---- freezer ---------------------------------------------------------------------------------
function enterFreezer() {
  CAM.inFreezer = true; GAME.freezeT = 0; GAME.freezeCount = 0;
  sfx('door', new THREE.Vector3(5, 1.2, -3.8)); WORLD.freezerDoor.rotation.y = 1.2;
  closeShot(new THREE.Vector3(5.55, 1.62, -3.45), new THREE.Vector3(7.6, 1.25, -4.7), 0.9);
  setTimeout(function () { if (CAM.inFreezer) { WORLD.freezerDoor.rotation.y = 0; sfx('bang', new THREE.Vector3(5, 1.2, -3.8), { vol: 0.5 }); setSpace('freezer'); jukeWobble(0); } }, 1000);
  WORLD.lights.fill.position.set(6.6, 2.7, -4.0); WORLD.lights.fill.color.set(0x9fc8ff); WORLD.lights.fill.intensity = 7; GAME.breath = steamEmit(5.6, 1.5, -3.6, 0.8, 0.05);
  LSTATE.coldT = Math.max(LSTATE.coldT, 0.9);
  sfx('freeze'); setCold(0, true); updateMainButton();
  GAME.jukeWas = JUKE.key ? [JUKE.key, JUKE.label] : null; jukeStop(0.6);
  U.count = el('div', 'count', '', UI);
}
function leaveFreezer() {
  CAM.inFreezer = false; sfx('door', new THREE.Vector3(5, 1.2, -3.8)); WORLD.freezerDoor.rotation.y = 1.2; releaseShot(0.8);
  setTimeout(function () { WORLD.freezerDoor.rotation.y = 0; setSpace('kitchen'); }, 900);
  WORLD.lights.fill.intensity = 0; setCold(0, false); if (GAME.breath) { steamStop(GAME.breath); GAME.breath = null; } if (U.count && U.count.parentNode) U.count.parentNode.removeChild(U.count); U.count = null;
  if (!GAME.inAnomaly) LSTATE.coldT = 0.25 + GAME.day * 0.04;
  var jw = GAME.jukeWas; GAME.jukeWas = null; if (jw && !GAME.inAnomaly && LSTATE.lightsOn) setTimeout(function () { if (!JUKE.key && GAME.mode === 'play' && !CAM.inFreezer) jukePlay(jw[0], { label: jw[1] }); }, 1200);
  updateMainButton();
}
function updateFreezer(dt) {
  if (!CAM.inFreezer || GAME.mode !== 'play') { if (GAME.cold > 0) GAME.cold = Math.max(0, GAME.cold - dt * 0.05); PU.uFear.value = damp(PU.uFear.value, nearOdd(), 2, dt); return; }
  GAME.freezeT += dt; GAME.cold = Math.min(1, GAME.cold + dt / 45);
  setCold(GAME.cold, true); PU.uFear.value = GAME.cold * 0.4;
  var c = Math.floor(GAME.freezeT - 0.8);
  if (c > GAME.freezeCount && c <= 10) { GAME.freezeCount = c; if (U.count) { U.count.textContent = c; U.count.classList.remove('pop'); void U.count.offsetWidth; U.count.classList.add('pop'); } sfx('heart', null, { n: 1, vol: 0.4 });
    if (c === 10) ACTIVE.slice().forEach(function (A) { if (A.def.onFreezerCount) A.def.onFreezerCount(A); });
    if (c === 6 && GAME.day >= 4 && Math.random() < 0.5) sfx('freezerBang', new THREE.Vector3(4.9, 1.2, -3.9));
  }
  if (GAME.cold >= 1) { GAME.failRule = 'freezer'; frozenDeath(); }
}
function nearOdd() { var f = 0, cp = RENDER.camera.position; CUSTS.forEach(function (C) { if (C.anomaly && C.P) { var d = C.P.root.position.distanceTo(cp); f = Math.max(f, clamp(1 - (d - 1.2) / 5, 0, 1) * (C.anomaly.done ? 0 : 0.6)); } }); return f; }
function frozenDeath() { GAME.mode = 'dead'; setMain(null); PU.uDesat = PU.uDesat; var t0 = performance.now(); var st = function () { var k = (performance.now() - t0) / 2500; PU.uBlack.value = clamp(k, 0, 1); PU.uSat.value = 1.05 - k; if (k < 1) requestAnimationFrame(st); else { PU.uSat.value = 1.05; gameOver(); } }; requestAnimationFrame(st); sfx('freeze', null, { vol: 1.5 }); }
// ---- map (pinned floor plan) & 3D markers ---------------------------------------------------------
var MAP_CSS = [
  '.mapcard{position:absolute;left:0;right:0;margin:0 auto;bottom:calc(env(safe-area-inset-bottom,0px) + 104px);width:min(360px,calc(100% - 32px));padding:14px 14px 12px;background-size:100% 100%;border-radius:3px;filter:drop-shadow(0 12px 20px rgba(0,0,0,.55));pointer-events:auto;animation:docin .35s cubic-bezier(.2,.9,.25,1.1) both;--r:-.8deg;--r1:3deg}',
  '.mapcard .pin{position:absolute;left:50%;top:-6px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#7ad,#1d4a8a);box-shadow:0 3px 4px rgba(0,0,0,.4)}',
  '.mapcard h4{margin:0 0 6px;font:400 17px/1 "Special Elite",monospace;color:#22201c;text-align:center;letter-spacing:.08em}',
  '.mapcard svg{display:block;width:100%;height:auto}',
  '.mapcard .st{cursor:pointer}.mapcard .st circle{transition:r .15s}',
  '.count{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font:700 120px/1 Caveat,cursive;color:rgba(230,248,255,.85);text-shadow:0 0 30px rgba(91,232,255,.6);pointer-events:none}',
  '.count.pop{animation:cpop .9s ease-out both}@keyframes cpop{0%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}25%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:.25}}',
  '.pausecard{position:absolute;left:50%;top:calc(var(--top-safe) + 40px);transform:translateX(-50%);width:min(320px,calc(100% - 40px));display:flex;flex-direction:column;gap:14px;align-items:stretch}',
  '.pausecard .mb{position:relative;left:auto;transform:none;max-width:none;width:100%}.pausecard h3{margin:0 0 4px;text-align:center;font:400 34px/1 Pacifico,cursive;color:#ff8fb8;text-shadow:0 0 18px rgba(255,79,163,.6)}'
].join('\n');
function mapSVG() {
  var sx = function (x) { return 20 + (x + 10.5) * 15; }, sz = function (z) { return 8 + (z + 5.4) * 15; };
  var s = '<svg viewBox="0 0 330 180" xmlns="http://www.w3.org/2000/svg">';
  s += '<rect x="' + sx(-8) + '" y="' + sz(-5.2) + '" width="' + 16 * 15 + '" height="' + 10.2 * 15 + '" fill="none" stroke="#22201c" stroke-width="2.2"/>';
  s += '<rect x="' + sx(-10.4) + '" y="' + sz(-0.45) + '" width="' + 2.4 * 15 + '" height="' + 1.3 * 15 + '" fill="none" stroke="#22201c" stroke-width="1.6"/>';
  s += '<line x1="' + sx(-8) + '" y1="' + sz(-2.8) + '" x2="' + sx(5) + '" y2="' + sz(-2.8) + '" stroke="#22201c" stroke-width="1.6"/><line x1="' + sx(5) + '" y1="' + sz(-5.2) + '" x2="' + sx(5) + '" y2="' + sz(-2.8) + '" stroke="#22201c" stroke-width="1.6"/>';
  s += '<rect x="' + sx(-3.6) + '" y="' + sz(-1.95) + '" width="' + 8 * 15 + '" height="' + 0.75 * 15 + '" fill="#c8282e" opacity=".25" stroke="#22201c" stroke-width="1"/>';
  D.booths.forEach(function (b, i) { s += '<rect x="' + sx(b - 0.95) + '" y="' + sz(3.45) + '" width="' + 1.9 * 15 + '" height="' + 1.5 * 15 + '" fill="#c8282e" opacity=".18" stroke="#22201c" stroke-width=".8"/><text x="' + sx(b) + '" y="' + sz(4.45) + '" font-family="Special Elite" font-size="10" text-anchor="middle" fill="#7e1418">' + (i + 1) + '</text>'; });
  s += '<line x1="' + sx(-7.8) + '" y1="' + sz(5) + '" x2="' + sx(4.9) + '" y2="' + sz(5) + '" stroke="#5be8ff" stroke-width="3" opacity=".7"/>';
  STATION_ORDER.forEach(function (k) {
    var st = STATIONS[k], x = sx(st.map[0]), y = sz(st.map[1]), cur = CAM.station === k && !CAM.inFreezer;
    var alert = stationAlert(k);
    s += '<g class="st" data-st="' + k + '"><circle cx="' + x + '" cy="' + y + '" r="' + (cur ? 13 : 11) + '" fill="' + (cur ? '#c8282e' : '#fbf3e0') + '" stroke="#22201c" stroke-width="2"/>' +
      (alert ? '<circle cx="' + (x + 9) + '" cy="' + (y - 9) + '" r="5" fill="#ff4fa3" stroke="#fff" stroke-width="1.2"/>' : '') +
      '<text x="' + x + '" y="' + (y + 4) + '" font-family="Alfa Slab One" font-size="12" text-anchor="middle" fill="' + (cur ? '#fff' : '#22201c') + '">' + st.n + '</text>' +
      '<text x="' + x + '" y="' + (y + (st.map[1] > 2 || k === 'REGISTER' ? -16 : 23)) + '" font-family="Oswald" font-size="9" letter-spacing=".6" text-anchor="middle" fill="#22201c">' + st.en.toUpperCase() + '</text></g>';
  });
  return s + '</svg>';
}
function stationAlert(k) {
  if (k === 'KITCHEN') return TICKETS.some(function (T) { return !T.ready; });
  if (k === 'JUKEBOX') return ACTIVE.some(function (A) { return A.id === 'phone' && A.ringing; });
  if (k === 'COUNTER') return CUSTS.some(function (C) { return C.seat && C.seat.kind === 'stool' && (C.state === 'seated' || C.state === 'ready' || C.state === 'check' || (C.state === 'ordered' && C.ticket && C.ticket.ready)); });
  if (k === 'BOOTHS') return CUSTS.some(function (C) { return C.seat && C.seat.kind === 'booth' && (C.state === 'seated' || C.state === 'ready' || C.state === 'check' || (C.state === 'ordered' && C.ticket && C.ticket.ready)); });
  if (k === 'REGISTER' || k === 'DOOR') return CUSTS.some(function (C) { return C.state === 'wait'; });
  return false;
}
var MAPV = { el: null };
function toggleMap(force) {
  if (MAPV.el) { MAPV.el.parentNode.removeChild(MAPV.el); MAPV.el = null; if (force !== true) return; }
  if (force === false) return;
  hideChoices();
  var c = el('div', 'mapcard', '<div class="pin"></div><h4>FLOOR PLAN · 見取り図</h4>' + mapSVG(), UI); c.style.backgroundImage = 'url(' + PAPER.rules + ')'; MAPV.el = c;
  sfx('paper');
  c.querySelectorAll('.st').forEach(function (g) { onTap(g, function () { var k = g.getAttribute('data-st'); toggleMap(); goStation(k); }); });
}
function goStation(k) {
  if (GAME.mode !== 'play' || MINI.active) return;
  if (CAM.inFreezer) leaveFreezer();
  if (CAM.outside) comeInside();
  if (k === CAM.station) return;
  hideChoices(); camSetStation(k); setMain(null);
}
// 3D station markers (glowing rings you can tap)
var HOT = [];
function buildHotspots() {
  var c = mkCanvas(128, 128), g = c.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 40, 0, TAU); g.stroke(); var gr = g.createRadialGradient(64, 64, 30, 64, 64, 62); gr.addColorStop(0, 'rgba(91,232,255,0.0)'); gr.addColorStop(0.6, 'rgba(91,232,255,0.35)'); gr.addColorStop(1, 'rgba(91,232,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  var tex = toTex(c, { clamp: true });
  var pts = { COUNTER: [0.6, 1.25, -1.6], BOOTHS: [3.6, 1.1, 3.0], REGISTER: [6.4, 1.35, 1.7], KITCHEN: [1.4, 1.65, -2.8], JUKEBOX: [-7.2, 1.7, 2.95], FREEZER: [4.9, 1.6, -3.85], DOOR: [6.0, 1.7, 4.8], BACKDOOR: [-2.6, 1.6, -5.1] };
  for (var k in pts) (function (k) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(1.6, 2.6, 3.0), transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending }));
    sp.position.set(pts[k][0], pts[k][1], pts[k][2]); sp.scale.set(0.34, 0.34, 1); sp.renderOrder = 8; RENDER.scene.add(sp);
    var lab = el('div', 'hint', STATIONS[k].en.toUpperCase(), U.layer);
    addPick(sp, function () { goStation(k); });
    HOT.push({ k: k, sp: sp, lab: lab });
  })(k);
}
var _hv = null;
function updateHotspots(t) {
  if (!_hv) _hv = new THREE.Vector3();
  var on = GAME.mode === 'play' && !MINI.active && !CAM.inFreezer && !CAM.outside && !CAM.override && !DOC.open;
  HOT.forEach(function (h, i) {
    var vis = on && h.k !== CAM.station; h.sp.visible = vis;
    var d = vis ? h.sp.position.distanceTo(RENDER.camera.position) : 0;
    h.sp.material.opacity = 0.55 + 0.35 * Math.sin(t * 2.5 + i);
    _hv.copy(h.sp.position).project(RENDER.camera);
    var sc = vis && _hv.z < 1 && Math.abs(_hv.x) < 0.95 && Math.abs(_hv.y) < 0.92 && d < 14;
    if (sc) { var x = (_hv.x * 0.5 + 0.5) * RENDER.w, y = (-_hv.y * 0.5 + 0.5) * RENDER.h - 18; if (y < 118 + 60) sc = false; else { h.lab.style.left = x + 'px'; h.lab.style.top = y + 'px'; } }
    h.lab.style.opacity = sc ? 0.9 : 0;
  });
}
// ---- pause -----------------------------------------------------------------------------------------
var PAUSE = { el: null };
function pauseGame() {
  if (GAME.mode !== 'play' || PAUSE.el) return;
  GAME.paused = true; hideChoices(); toggleMap(false); try { speechSynthesis.pause(); } catch (e) {}
  if (AUDIO.ctx && AUDIO.ctx.suspend) try { AUDIO.ctx.suspend(); } catch (e) {}
  var ov = el('div', 'ov dim pe', '<div class="pausecard"><h3>Paused</h3></div>', UI); PAUSE.el = ov;
  var card = ov.querySelector('.pausecard');
  [['play', 'RESUME', 'つづける', resumeGame], ['rules', 'RULES', 'ルールを読む', function () { resumeGame(true); showRules(); }], ['gear', 'SETTINGS', '設定', function () { openSettings(); }], ['back', 'QUIT TO TITLE', 'タイトルへもどる', function () { resumeGame(true); quitToTitle(); }]].forEach(function (b) {
    var bt = el('button', 'mb pe', icon(b[0], 30) + '<span class="tx"><span class="en">' + b[1] + '</span><span class="ja">' + b[2] + '</span></span>', card); pressFX(bt); onTap(bt, function () { sfx('click'); b[3](); });
  });
}
function resumeGame(keepPaused) {
  if (PAUSE.el) { PAUSE.el.parentNode.removeChild(PAUSE.el); PAUSE.el = null; }
  if (AUDIO.ctx && AUDIO.ctx.resume) try { AUDIO.ctx.resume(); } catch (e) {}
  try { speechSynthesis.resume(); } catch (e) {}
  if (!keepPaused) GAME.paused = false;
}
function showRules() {
  GAME.paused = true;
  openDocs(docRules(rulesDocList(GAME.day, GAME.fakes), GAME.day) + '<div class="doccap">NIGHT ' + GAME.day + ' — ' + rulesForDay(GAME.day).length + ' RULES' + (GAME.fakes && GAME.fakes.length ? ' · SOME PAGES LOOK DIFFERENT…' : '') + '</div>', { onClose: function () { GAME.paused = false; } });
}
// ---- per-frame game update ------------------------------------------------------------------------
var HUD_T = 0;
function updateGame(dt, t) {
  updateDoor(dt); updateLore(dt, t); drawTV(dt); updateJumpscare(dt); updateMini(dt, t); updateHotspots(t); updateAudio(dt);
  if (GAME.mode !== 'play') { if (GAME.mode === 'title' || GAME.mode === 'cut') { updateCustomers(dt); } if (SUBQ.cur) subUpdate(dt); return; }
  if (SUBQ.cur) subUpdate(dt);
  if (GAME.paused || PAUSE.el) return;
  GAME.min += dt * GAME.rate * (GAME.fast || 1);
  runSchedule(); updateCustomers(dt); updateAnomalies(dt); updateFreezer(dt);
  // pre-anomaly tape wobble on the jukebox
  var nextA = GAME.sched.filter(function (e) { return e.type === 'anom'; })[0], wob = 0;
  if (nextA) wob = clamp(1 - (nextA.at - GAME.min) / 25, 0, 1); JUKE.wobble = wob; JUKE.drift = wob * 0.6;
  HUD_T -= dt; if (HUD_T <= 0) { HUD_T = 0.5; setClock(GAME.min, GAME.day); updateMainButton(); }
  UI.classList.toggle('flick', GAME.day >= 3 && GAME.min > 200);
  UI.style.setProperty('--wear', clamp((GAME.day - 1) * 0.12 + (GAME.min / SHIFT_LEN) * 0.12, 0, 0.6).toFixed(2));
  PU.uCold.value = LSTATE.cold * 0.85; PU.uGrain.value = 0.035 + LSTATE.cold * 0.025; PU.uVig.value = 0.55 + LSTATE.cold * 0.15;
  PU.uSat.value = 1.05 - LSTATE.cold * 0.22;
  if (GAME.day >= 2 && !ACTIVE.some(function (a) { return a.id === 'sunny'; })) { GAME.eyeT = (GAME.eyeT || 0) - dt; if (GAME.eyeT <= 0) { var cx = RENDER.camera.position.x - 0.1, look = clamp(cx / 4, -1, 1); GAME.eyeT = GAME.day >= 4 ? 2 : 6; if (Math.abs(look - (GAME.eyeLook || 0)) > 0.15 || GAME.day < 4 && Math.random() < 0.5) { GAME.eyeLook = GAME.day >= 3 || Math.random() < 0.5 ? look : 0; setNeonEyes(GAME.eyeLook, null); } } }
  if (GAME.min >= SHIFT_LEN && !GAME.inAnomaly && !JS.on) shiftComplete();
  if (GAME.min >= SHIFT_LEN + 30 && !JS.on) shiftComplete();
}
// ---- end states ------------------------------------------------------------------------------------
function gameOver() {
  GAME.mode = 'over'; setGameHUD(false); setMain(null); hideChoices(); toggleMap(false);
  clearWorld();
  PU.uBlack.value = 0;
  var rule = RULES.filter(function (r) { return r.id === GAME.failRule; })[0];
  var ruleTxt = rule ? rule.en : GAME.failRule === 'freezer' ? 'You stayed in the freezer too long.' : GAME.failRule === 'outside' ? 'It is more dangerous outside.' : 'Something came in.';
  var ruleJa = rule ? rule.ja : GAME.failRule === 'freezer' ? '冷凍庫に長くいすぎた。' : GAME.failRule === 'outside' ? '外はもっと危ない。' : '何かが入ってきた。';
  showSunnyCard('Come back soon, partner!', 'またきてね！', function () {
    var h = clockStr(GAME.deathAt || GAME.min);
    var lines = '<div class="c big">SUNNY SIDE DINER</div><div class="c">NIGHT SHIFT REPORT</div><hr><div class="r"><span>NIGHT</span><span>' + GAME.day + ' / 5</span></div><div class="r"><span>CLOCKED OUT</span><span>' + h + '</span></div><div class="r"><span>SERVED</span><span>' + GAME.served + '</span></div><div class="r"><span>TIPS</span><span>' + fmtMoney(GAME.tips) + '</span></div><hr><div class="bad">RULE BROKEN:</div><div class="bad">' + ruleTxt + '</div><div style="font:500 11px/1.5 \'Zen Kaku Gothic New\';margin-top:6px">' + ruleJa + '</div><hr><div class="c">*** WE\'LL KEEP THE LIGHT ON ***</div>';
    resultScreen(lines, [['restart', 'TRY NIGHT ' + GAME.day + ' AGAIN', GAME.day + '日目をやり直す', function () { startNight(GAME.day); }], ['back', 'TITLE', 'タイトルへ', quitToTitle]]);
  });
}
function clockStr(min) { var tot = (22 * 60 + Math.floor(min)) % 1440, h = Math.floor(tot / 60), m = tot % 60; return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + (h >= 12 ? ' PM' : ' AM'); }
function shiftComplete() {
  if (GAME.mode !== 'play') return; GAME.mode = 'cut'; setMain(null); hideChoices(); toggleMap(false); setGameHUD(false);
  jukeStop(1.2);
  dawn(function () {
    var day = GAME.day;
    SAVE.clears = Math.max(SAVE.clears || 0, day); SAVE.bestTips = Math.max(SAVE.bestTips || 0, GAME.tips); SAVE.totalTips = (SAVE.totalTips || 0) + GAME.tips; SAVE.bestDay = Math.max(SAVE.bestDay || 0, day);
    if (day >= 5) { SAVE.day = 1; writeSave(); finale(); return; }
    SAVE.day = day + 1; writeSave();
    playMusic('title', { vol: 0.8 });
    var lines = '<div class="c big">SUNNY SIDE DINER</div><div class="c">SHIFT COMPLETE</div><hr><div class="r"><span>NIGHT</span><span>' + day + ' / 5</span></div><div class="r"><span>CLOCKED OUT</span><span>6:00 AM</span></div><div class="r"><span>SERVED</span><span>' + GAME.served + '</span></div><div class="r"><span>SALES</span><span>' + fmtMoney(GAME.sales) + '</span></div><div class="r big"><span>TIPS</span><span>' + fmtMoney(GAME.tips) + '</span></div><div class="r"><span>ODD THINGS SURVIVED</span><span>' + GAME.resolved + '</span></div><hr><div class="c">RISE AND SHINE!</div><div class="c">SEE YOU TONIGHT</div>';
    resultScreen(lines, [['next', 'NIGHT ' + (day + 1), (day + 1) + '日目へ', function () { stopMusic(0.6); startNight(day + 1); }], ['back', 'TITLE', 'タイトルへ', function () { quitToTitle(); }]]);
  });
}
function dawn(cb) {
  var t0 = performance.now();
  WORLD.skyMat.color.setRGB(0.9, 0.9, 0.9);
  say('JUNE', 'Rise and shine, hon! Day shift\'s here. You did good.', 'おはよう（Rise and shine）！ 日勤が来たよ。よくがんばったね。', { voice: 'june' });
  sfx('doorbell', new THREE.Vector3(6, 2.3, 4.9)); openDoorAnim();
  var step = function () {
    var k = clamp((performance.now() - t0) / 6000, 0, 1);
    WORLD.skyMat.color.setRGB(0.9 + k * 2.2, 0.9 + k * 1.4, 0.9 + k * 0.9);
    WORLD.lights.lot.intensity = 70 * (1 - k); LSTATE.coldT = 0; FX.rainT = 0;
    PU.uExposure.value = 1 + k * 0.25;
    if (k < 1) requestAnimationFrame(step); else { PU.uExposure.value = 1; WORLD.skyMat.color.setRGB(0.9, 0.9, 0.9); WORLD.lights.lot.intensity = 70; clearWorld(); cb(); }
  };
  requestAnimationFrame(step);
}
function quitToTitle() { resumeGame(true); clearWorld(); setGameHUD(false); closeDocs(true); hideChoices(); stopVoice(); jukeStop(0.3); showTitle(); }
// ---- key bindings ---------------------------------------------------------------------------------------
function onKey(e) {
  if (e.key === 'Escape') { if (DOC.open) closeDocs(); else if (PAUSE.el) resumeGame(); else if (SLIP.open) hideChoices(); else if (MAPV.el) toggleMap(); else pauseGame(); return; }
  if (GAME.mode !== 'play' || PAUSE.el) return;
  var n = parseInt(e.key, 10); if (n >= 1 && n <= 8) { goStation(STATION_ORDER[n - 1]); return; }
  if (e.key === ' ' || e.key === 'Enter') { if (SUBQ.cur) subAdvance(); else if (U.mainAct && U.mainAct.fn) U.mainAct.fn(); e.preventDefault(); }
  if (e.key === 'm' || e.key === 'M') toggleMap();
  if (e.key === 'r' || e.key === 'R') showRules();
  if (MINI.active && (e.key === 'h' || e.key === 'H') && MINI.onDown && !MINI.keyHold) { MINI.keyHold = 1; MINI.onDown(RENDER.w / 2, RENDER.h / 2); }
}
function onKeyUp(e) { if (MINI.active && (e.key === 'h' || e.key === 'H') && MINI.onUp) { MINI.keyHold = 0; MINI.onUp(RENDER.w / 2, RENDER.h / 2, 0, 100); } }
function onTapNothing() { if (MAPV.el) toggleMap(); }
