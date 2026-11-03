// ---- NPC students --------------------------------------------------------------
var NPCS = [];
var PERSONALITIES = {
  fast: { en: 'Fast', ja: '足が速い', speed: 3.5, delay: [1, 4] },
  timid: { en: 'Timid', ja: '臆病', speed: 1.9, delay: [8, 18] },
  kind: { en: 'Kind', ja: '親切', speed: 2.3, delay: [2, 5] },
  sneaky: { en: 'Sneaky', ja: 'ずるい', speed: 2.9, delay: [2, 6] },
  normal: { en: 'Normal', ja: '普通', speed: 2.2, delay: [5, 14] },
  slow: { en: 'Slow', ja: 'のんびり', speed: 1.7, delay: [10, 22] }
};
var NPC_LINES = {
  fast: [['Keep up or get left behind.', 'ついて来られないなら置いてくよ。'], ['I always get a seat. Always.', '俺はいつも座れる。いつもな。']],
  timid: [['D-did you hear that? In the vents?', 'い、今の聞こえた？通気口の中…'], ['I just wanted my diploma...', '卒業証書が欲しかっただけなのに…']],
  kind: [['Stick with me when the lights go out.', '電気が消えたら、私のそばにいて。'], ['If you get lost, look for the room numbers.', '迷ったら、部屋番号を見るのよ。']],
  sneaky: [['Musical chairs, huh? I was champion in third grade.', '椅子取りゲーム？小3の時チャンピオンだったぜ。'], ["Nothing personal. It's just math.", '悪く思うなよ。ただの算数さ。']],
  normal: [["My letter came with no stamp. Weird, right?", '僕の手紙、切手がなかったんだ。変だろ？'], ["Was there always one less chair?", '椅子って、ずっと1個足りなかった？']],
  slow: [['My knees aren\'t what they used to be.', '膝がもう昔みたいじゃなくてねえ。'], ['Back in my day the bell meant recess.', '昔はベルといえば休み時間だったのに。']]
};
function makeNPCs(night, count, rnd) {
  clearNPCs();
  var names = rnd.shuffle(NPC_NAMES.slice());
  var pers = ['kind', 'sneaky', 'fast', 'timid', 'normal', 'slow', 'normal', 'normal', 'fast', 'timid'];
  for (var i = 0; i < count; i++) {
    var ne = names[i], look = makeLook(rnd, ne);
    var model = buildHumanNPC(look, i + night * 7);
    model.rig.bones[0].userData.y0 = model.rig.bones[0].position.y;
    var n = { id: i, name: ne[0], look: look, pers: pers[i % pers.length], model: model, li: 1, x: 0, z: 0, y: 0, yaw: 0, state: 'seated', alive: true, seated: null, hidden: null,
      chair: null, path: null, pathI: 0, delay: 0, t: 0, ph: 0, speed: 0, running: false, friend: false, probeT: 0, talkT: 0, followP: false, lost: false, seed: rnd.int(1, 9999), sayT: 0, stuck: 0 };
    RENDER.scene.add(model.root);
    NPCS.push(n);
  }
  return NPCS;
}
function clearNPCs() { NPCS.forEach(function (n) { RENDER.scene.remove(n.model.root); n.model.mats.forEach(function (m) { m.dispose(); }); n.model.faceTex.dispose(); }); NPCS.length = 0; }
function npcSeat(n, c) {
  if (n.seated) n.seated.occ = -1;
  n.seated = c; c.occ = n.id; n.chair = c; n.state = 'seated'; n.li = c.li; n.x = c.x; n.z = c.z; n.yaw = c.rot; n.path = null; n.hidden = null;
}
function npcStand(n) { if (n.seated) { n.seated.occ = -1; n.seated = null; } n.state = 'idle'; }
// called at lights out: start moving to target room
function npcsBeginTransit(target, night, rnd) {
  var aliveN = NPCS.filter(function (n) { return n.alive; });
  var lostOne = rnd() < 0.45 ? rnd.pick(aliveN.filter(function (n) { return n.pers !== 'sneaky' && n.pers !== 'fast'; })) : null;
  aliveN.forEach(function (n) {
    npcStand(n);
    var P = PERSONALITIES[n.pers];
    n.delay = rnd.range(P.delay[0], P.delay[1]) * (night > 2 ? 0.85 : 1);
    n.target = target; n.state = 'wait'; n.path = null; n.lost = false; n.followP = false; n.waitP = 0;
    if (n === lostOne) {
      // teleport to a random nearby room: lost and crying, needs help
      var rooms = MAP.slots.filter(function (r) { return r !== target && r.li === PL.li; });
      var r = rnd.pick(rooms), e = roomEntryPoint(r, true);
      if (e) { n.li = e.li; n.x = r.cx + rnd.range(-2, 2); n.z = r.cz + rnd.range(-1.5, 1.5); if (!passable(n.li, m2c(n.x), m2r(n.z), 'p')) { n.x = e.x; n.z = e.z; } n.state = 'lost'; n.lost = true; }
    }
  });
}
function npcSay(n, en, ja, dur) { if (typeof showSubtitle === 'function') showSubtitle(n.name.toUpperCase() + ': ' + en, ja, dur || 2.6, 'npc'); say(en, 'npc', { pitch: n.look.female ? 1.25 : 0.85, rate: 1.05, interrupt: true }); }
function freeChairs(room) { return room.chairs.filter(function (c) { return c.avail && c.occ === -1; }); }
function updateNPCs(dt, phase) {
  for (var i = 0; i < NPCS.length; i++) {
    var n = NPCS[i];
    if (!n.alive) { n.model.root.visible = false; continue; }
    n.t += dt; n.sayT -= dt;
    var moving = false;
    if (n.state === 'seated') {
      // stay
    } else if (n.state === 'wait') {
      n.delay -= dt;
      if (n.delay <= 0) n.state = 'go';
      if (n.pers === 'kind' && Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) < 6 && !n._offered && PL.li === n.li) { n._offered = true; npcSay(n, 'This way! Follow me!', 'こっちよ！ついて来て！'); }
    } else if (n.state === 'lost') {
      n.yaw += dt * 0.3;
      if (n.sayT <= 0 && Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) < 7 && n.li === PL.li) { n.sayT = 6; npcSay(n, "Please... I can't find the room.", 'お願い…教室が見つからないの。'); }
    } else if (n.state === 'go' || n.state === 'follow' || n.state === 'toChair') {
      var tgt = null;
      if (n.state === 'follow') {
        tgt = { li: PL.li, x: PL.x, z: PL.z };
        var dP = Math.sqrt(dist2(n.x, n.z, PL.x, PL.z));
        if (n.target && roomAt(n.li, n.x, n.z) === n.target) { n.state = 'go'; n.friend = true; npcSay(n, "We made it. I owe you one.", '着いた…借りができたわ。'); }
        if (dP < 1.6 && n.li === PL.li) tgt = null;
      } else if (n.state === 'toChair') {
        tgt = { li: n.chair.li, x: n.chair.x, z: n.chair.z };
      } else tgt = roomEntryPoint(n.target) || { li: n.target.li, x: n.target.cx, z: n.target.cz };
      if (tgt) {
        n.repath = (n.repath || 0) - dt;
        if (!n.path || n.repath <= 0 || n.pathI >= n.path.length) { n.path = findPath(n.li, n.x, n.z, tgt.li, tgt.x, tgt.z, 'p', 25000); n.pathI = 1; n.repath = n.state === 'follow' ? 0.8 : 4; }
        var spd = PERSONALITIES[n.pers].speed * (n.scared ? 1.25 : 1);
        if (n.state === 'follow') spd = Math.min(4.2, Math.max(1.5, Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) * 1.2));
        if (n.pers === 'kind' && n.state === 'go' && n._offered && PL.li === n.li && Math.sqrt(dist2(n.x, n.z, PL.x, PL.z)) > 7 && (n.waitP += dt) < 12) spd = 0; // waits for you
        var arrived = npcFollow(n, spd, dt);
        moving = spd > 0.1 && n.path;
        n.running = spd > 3;
        if (n.state === 'go' && roomAt(n.li, n.x, n.z) === n.target) {
          var fc = freeChairs(n.target);
          if (fc.length) {
            fc.sort(function (a, b) { return dist2(a.x, a.z, n.x, n.z) - dist2(b.x, b.z, n.x, n.z); });
            // sneaky: grab the chair the player is heading to
            var pick = fc[0];
            if (n.pers === 'sneaky' && PL.li === n.li) { var pc = fc.slice().sort(function (a, b) { return dist2(a.x, a.z, PL.x, PL.z) - dist2(b.x, b.z, PL.x, PL.z); })[0]; if (Math.sqrt(dist2(pc.x, pc.z, PL.x, PL.z)) < 3.5) { pick = pc; if (n.sayT <= 0) { n.sayT = 8; npcSay(n, 'Too slow!', 'おっそいなあ！'); } } }
            n.chair = pick; pick.claim = n.id; n.state = 'toChair'; n.path = null;
          } else { n.state = 'panic'; npcSay(n, "No... no no no. There's no seat!", 'うそ…席がない！'); }
        }
        if (n.state === 'toChair') {
          if (n.chair.occ !== -1 && n.chair.occ !== n.id) { n.state = 'go'; n.path = null; }
          else if (Math.sqrt(dist2(n.x, n.z, n.chair.x, n.chair.z)) < 0.45) { npcSeat(n, n.chair); sfx('thump', { li: n.li, x: n.x, z: n.z }); }
        }
        if (n.path === null && n.state === 'go') { n.stuck += dt; if (n.stuck > 6) { n.stuck = 0; } }
      }
      // timid: hide when a monster is close
      if (n.pers === 'timid' || n.pers === 'slow') {
        var mf = nearestMonsterTo(n, 7);
        if (mf && !n.hidden && n.state !== 'toChair') { var h = nearestHideFor(n, 6); if (h) { n.hidden = h; n.state = 'hiding'; n.hideT = R.range(4, 9); n.x = h.x; n.z = h.z; } }
      }
    } else if (n.state === 'hiding') {
      n.hideT -= dt; if (n.hideT <= 0 && !nearestMonsterTo(n, 8)) { n.hidden = null; n.state = 'go'; n.path = null; n.scared = true; }
    } else if (n.state === 'panic') {
      n.yaw += Math.sin(n.t * 3) * dt * 2;
      var fc2 = freeChairs(n.target); if (fc2.length) { n.state = 'go'; }
    } else if (n.state === 'raidHide') {
      // under desk during raid
    }
    n.speed = damp(n.speed, moving ? PERSONALITIES[n.pers].speed : 0, 8, dt);
    finishNPC(n, dt);
  }
}
function npcFollow(n, spd, dt) {
  if (!n.path || n.pathI >= n.path.length) return true;
  var p = n.path[n.pathI], dx = p.x - n.x, dz = p.z - n.z, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 0.25) { n.pathI++; return n.pathI >= n.path.length; }
  var st = Math.min(d, spd * dt);
  var nx = n.x + dx / d * st, nz = n.z + dz / d * st;
  // light separation from other agents
  for (var k = 0; k < NPCS.length; k++) { var o = NPCS[k]; if (o === n || !o.alive || o.li !== n.li || o.seated) continue; var dd = dist2(nx, nz, o.x, o.z); if (dd < 0.36 && dd > 1e-4) { var q = Math.sqrt(dd); nx += (nx - o.x) / q * 0.02; nz += (nz - o.z) / q * 0.02; } }
  if (passable(n.li, m2c(nx), m2r(nz), 'p')) { n.x = nx; n.z = nz; } else { n.x += dx / d * st; n.z += dz / d * st; }
  n.yaw += angDiff(n.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
  n.li = resolveLevel(n.li, n.x, n.z);
  if (p.li !== n.li && cellType(n.li, m2c(n.x), m2r(n.z)) !== T_STAIR) n.li = p.li;
  return false;
}
function nearestMonsterTo(n, r) { for (var i = 0; i < MONSTERS.length; i++) { var m = MONSTERS[i]; if (m.active && m.visible && !m.watcher && m.li === n.li && m.state !== 'dormant' && dist2(m.x, m.z, n.x, n.z) < r * r) return m; } return null; }
function nearestHideFor(n, r) { var best = null, bd = r * r; MAP.hides.forEach(function (h) { if (h.li !== n.li || h.occ) return; var d = dist2(h.x, h.z, n.x, n.z); if (d < bd) { bd = d; best = h; } }); return best; }
function finishNPC(n, dt) {
  var mdl = n.model, R2 = mdl.rig, B = R2.byName;
  var fy = floorY(n.li, n.x, n.z);
  n.y = damp(n.y || fy, fy, 12, dt);
  poseReset(R2);
  var root = mdl.root;
  root.visible = !(n.hidden && n.hidden.type !== 'desk' && n.hidden.type !== 'table' && n.hidden.type !== 'bleacher');
  if (n.state === 'seated') {
    var c = n.seated;
    var seatH = c.kind === 'stool' ? 0.62 : (c.kind === 'busseat' ? 0.48 : 0.46);
    var back = c.kind === 'chair' ? -0.08 : 0;
    root.position.set(c.x + Math.sin(c.rot) * back, LV_Y[c.li] + seatH - R2.bones[0].userData.y0 + 0.05, c.z + Math.cos(c.rot) * back);
    root.rotation.y = c.rot;
    B.thL.rotation.x = -1.5; B.thR.rotation.x = -1.5; B.snL.rotation.x = 1.5; B.snR.rotation.x = 1.5;
    B.uaL.rotation.x = -0.5; B.uaR.rotation.x = -0.5; B.faL.rotation.x = -0.9; B.faR.rotation.x = -0.9;
    B.neck.rotation.x = 0.12 + Math.sin(n.t * 0.5 + n.id) * 0.05; B.head.rotation.y = Math.sin(n.t * 0.31 + n.id * 2) * 0.35;
    if (GAME.phase === 'lesson' && GAME.lessonLookAt) { B.head.rotation.y = 0; }
  } else if (n.state === 'hiding' || n.state === 'raidHide') {
    root.position.set(n.x, n.y - 0.55, n.z);
    B.hips.rotation.x = 0.9; B.thL.rotation.x = -2.2; B.thR.rotation.x = -2.2; B.snL.rotation.x = 2.4; B.snR.rotation.x = 2.4; B.neck.rotation.x = 0.4;
    B.uaL.rotation.x = -1.2; B.uaR.rotation.x = -1.2;
  } else {
    root.position.set(n.x, n.y, n.z); root.rotation.y = n.yaw;
    n.ph += dt * (2 + n.speed * 2.6);
    if (n.speed > 0.15) animWalk(R2, n.ph, Math.min(1.2, n.speed / 2.4), { lean: n.running ? 0.25 : 0.05 });
    else animIdle(R2, n.t);
    if (n.state === 'lost' || n.state === 'panic') { B.neck.rotation.x = 0.5; B.uaL.rotation.x = -1.8; B.uaR.rotation.x = -1.8; B.faL.rotation.x = -1.8; B.faR.rotation.x = -1.8; }
    if (n.speed > 0.15) { n._stp = (n._stp || 0) + n.speed * dt; if (n._stp > 0.8) { n._stp = 0; if (dist2(n.x, n.z, PL.x, PL.z) < 400) sfxStep(MAP.lv[n.li].mat[cidx(m2c(n.x), m2r(n.z))], n.running ? 0.8 : 0.35, { li: n.li, x: n.x, z: n.z, y: n.y + 0.1 }); if (n.running) emitNoise(n.li, n.x, n.z, 9, 'npc'); } }
  }
  n.probeT -= dt;
  if (n.probeT <= 0 && WORLD) { n.probeT = 0.3 + R() * 0.1; var pr = WORLD.baker.probe(n.li, n.x, LV_Y[n.li] + 1.2, n.z); mdl.mats.forEach(function (mt) { setProbe(mt, pr.on, [pr.off[0] * 1.5 + 0.01, pr.off[1] * 1.5 + 0.012, pr.off[2] * 1.5 + 0.02]); }); }
}
function npcKilled(n, m) {
  if (!n.alive) return;
  n.alive = false; n.killedBy = m ? m.type : 'bell';
  if (n.seated) { n.seated.occ = -1; n.seated = null; }
  if (n.chair && n.chair.claim === n.id) n.chair.claim = -1;
  n.model.root.visible = false;
  var p = { li: n.li, x: n.x, z: n.z, y: n.y + 1.5 };
  sfx('scream', p, { len: 1.2, pitch: n.look.female ? 1.25 : 0.85 });
  setTimeoutG(function () { sfx('drag', p, { len: 2 }); }, 700);
  GAME.lost.push(n);
  if (typeof showToast === 'function' && dist2(n.x, n.z, PL.x, PL.z) < 900) showToast('', n.name + 'の悲鳴が聞こえた…');
}
function nearestNPC(r) { var best = null, bd = r * r; NPCS.forEach(function (n) { if (!n.alive || n.li !== PL.li) return; var d = dist2(n.x, n.z, PL.x, PL.z); if (d < bd) { bd = d; best = n; } }); return best; }
