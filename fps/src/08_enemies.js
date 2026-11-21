// ---- actors: the eight friends (ground bots, any team) + drones + energy bolts
var ENEMIES = [], BOLTS = [], DR = {};
var ETYPE = {
  scout:  { hp: 70,  scale: 1.0, speed: 6.5, score: 100, dmg: 9,  burst: 1, cd: [1.7, 2.8], range: [9, 15] },
  gunner: { hp: 170, scale: 1.45, speed: 4.2, score: 250, dmg: 8,  burst: 3, cd: [2.4, 3.4], range: [11, 17] },
  kami:   { hp: 45,  scale: 0.8, speed: 9.5, score: 150, dmg: 30, burst: 0, cd: [9, 9], range: [4, 6] },
  rifle:  { hp: 100, scale: 1.0, speed: 3.3, score: 100, dmg: 8,  burst: 2, cd: [1.6, 2.7], range: [8, 15], friend: true },
  rush:   { hp: 80,  scale: 1.0, speed: 5.0, score: 120, dmg: 6,  burst: 3, cd: [1.2, 2.0], range: [3.5, 6.5], friend: true }
};
var FRIEND_ROLE = ['rifle', 'rifle', 'rush', 'rifle', 'rifle', 'rush', 'rifle', 'rush'];
var BOT_DIFF = [{ name: 'やさしい', err: 2.0, cd: 1.5, dmg: 0.7, see: 0.9 }, { name: 'ふつう', err: 1.2, cd: 1.0, dmg: 1.0, see: 0.5 }, { name: 'つよい', err: 0.65, cd: 0.7, dmg: 1.25, see: 0.25 }];
var TEAM_COL = [0x4aa3ff, 0xff4a3a];
function aliveCount() { var n = 0; for (var i = 0; i < ENEMIES.length; i++) if (!ENEMIES[i].dead && ENEMIES[i].team !== P.team) n++; return n; }
function actorAlive(a) { return a === P ? (P.hp > 0 && !P.respawnT) : (!!a && !a.dead && !a.gone); }
function actorY(a) { return a === P ? P.y + 1.25 : a.friend ? a.y + 0.5 * a.h : a.y; }
function actorTeam(a) { return a === P ? P.team : a.team; }

function buildEnemyAssets() {
  DR.body = new THREE.SphereGeometry(0.42, 16, 10); DR.arm = new THREE.BoxGeometry(1.25, 0.05, 0.09); DR.motor = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
  DR.rotor = new THREE.CircleGeometry(0.27, 14); DR.eye = new THREE.SphereGeometry(0.12, 12, 8); DR.barrel = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8); DR.fin = new THREE.BoxGeometry(0.5, 0.04, 0.5);
  DR.metal = stdMat({ color: 0x24262a, roughness: 0.4, metalness: 0.9, roughnessMap: TEX.metalRgh, envMapIntensity: 1 });
  DR.shell = { scout: stdMat({ color: 0x59616b, roughness: 0.45, metalness: 0.7 }), gunner: stdMat({ color: 0x6d2620, roughness: 0.4, metalness: 0.7 }), kami: stdMat({ color: 0xc79a1a, roughness: 0.5, metalness: 0.5 }) };
  DR.blaster = new THREE.BoxGeometry(0.07, 0.11, 0.42); DR.blasterTip = new THREE.MeshBasicMaterial({ color: 0xff3a22 }); DR.tipG = new THREE.BoxGeometry(0.035, 0.035, 0.03);
  DR.rotorM = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  // team marker (a small downward triangle above the head)
  var mc = canvasOf(64), mx = mc.getContext('2d'); mx.fillStyle = '#fff'; mx.strokeStyle = 'rgba(0,0,0,.7)'; mx.lineWidth = 5; mx.beginPath(); mx.moveTo(8, 12); mx.lineTo(56, 12); mx.lineTo(32, 54); mx.closePath(); mx.stroke(); mx.fill();
  DR.markTex = new THREE.CanvasTexture(mc);
  DR.markM = TEAM_COL.map(function (c, i) { return new THREE.SpriteMaterial({ map: DR.markTex, color: c, transparent: true, depthWrite: false, depthTest: i !== 0, fog: false }); });
  var bg = new THREE.CylinderGeometry(0.045, 0.045, 0.9, 6); bg.rotateX(Math.PI / 2);
  DR.boltM = [0x5ab4ff, 0xff5a3a].map(function (c) { return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); });
  DR.glowM = [0x3a90ff, 0xff5030].map(function (c) { return new THREE.SpriteMaterial({ map: TEX.glow, color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); });
  for (var i = 0; i < 30; i++) {
    var m = new THREE.Mesh(bg, DR.boltM[1]); m.visible = false; m.frustumCulled = false; scene.add(m);
    var gl = new THREE.Sprite(DR.glowM[1]); gl.scale.setScalar(0.7); m.add(gl);
    BOLTS.push({ m: m, gl: gl, on: false, vx: 0, vy: 0, vz: 0, life: 0, dmg: 0, team: 1, owner: null });
  }
}
function makeDrone(type) {
  var g = new THREE.Group(), T = ETYPE[type];
  var body = new THREE.Mesh(DR.body, DR.metal); body.scale.set(1, 0.55, 1.15); body.castShadow = true; g.add(body);
  var sh = new THREE.Mesh(DR.body, DR.shell[type]); sh.scale.set(0.8, 0.42, 0.9); sh.position.y = 0.1; g.add(sh);
  var rotors = [];
  [Math.PI / 4, -Math.PI / 4].forEach(function (a) { var arm = new THREE.Mesh(DR.arm, DR.metal); arm.rotation.y = a; arm.castShadow = true; g.add(arm); });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (p) {
    var x = p[0] * 0.44, z = p[1] * 0.44, mo = new THREE.Mesh(DR.motor, DR.metal); mo.position.set(x, 0.06, z); g.add(mo);
    var ro = new THREE.Mesh(DR.rotor, DR.rotorM); ro.rotation.x = -Math.PI / 2; ro.position.set(x, 0.13, z); g.add(ro); rotors.push(ro);
  });
  var eyeM = new THREE.MeshBasicMaterial({ color: type === 'kami' ? 0xffb020 : 0xff2a18 });
  var eye = new THREE.Mesh(DR.eye, eyeM); eye.position.set(0, -0.02, 0.42); g.add(eye);
  if (type !== 'kami') { var b = new THREE.Mesh(DR.barrel, DR.metal); b.rotation.x = Math.PI / 2; b.position.set(0, -0.2, 0.3); g.add(b);
    if (type === 'gunner') { var b2 = b.clone(); b2.position.x = 0.12; g.add(b2); var b3 = b.clone(); b3.position.x = -0.12; g.add(b3); } }
  else { var f = new THREE.Mesh(DR.fin, DR.shell.kami); f.position.y = -0.18; f.rotation.y = Math.PI / 4; g.add(f); }
  g.scale.setScalar(T.scale);
  return { g: g, eyeM: eyeM, rotors: rotors };
}
function spawnEnemy(type, wave) {
  var T = ETYPE[type], d = makeDrone(type), a = Math.random() * Math.PI * 2;
  var e = { type: type, T: T, team: 1, name: 'ドローン', g: d.g, eyeM: d.eyeM, rotors: d.rotors, hp: T.hp * (1 + wave * 0.05), x: Math.cos(a) * 46, y: rnd(9, 13), z: Math.sin(a) * 46, vx: 0, vy: 0, vz: 0,
    ang: a, dir: Math.random() < 0.5 ? 1 : -1, ring: rnd(T.range[0], T.range[1]), alt: rnd(2.3, 4.6), t: Math.random() * 9, cd: rnd(1.2, 2.6), charge: 0, burst: 0, burstT: 0, hitFlash: 0, dive: 0, beepT: 0, r: 0.5 * T.scale, wave: wave, dirT: rnd(2, 5), aimErr: Math.max(0.25, 1.15 - wave * 0.1), dmgMul: 1 };
  e.g.position.set(e.x, e.y, e.z); scene.add(e.g); ENEMIES.push(e); return e;
}
function removeEnemy(e) { e.gone = true; scene.remove(e.g); if (e.eyeM) e.eyeM.dispose(); if (e.mat) e.mat.dispose(); var i = ENEMIES.indexOf(e); if (i >= 0) ENEMIES.splice(i, 1); }
function clearEnemies() { while (ENEMIES.length) removeEnemy(ENEMIES[0]); BOLTS.forEach(function (b) { b.on = false; b.m.visible = false; }); }

function raySphere(o, d, cx, cy, cz, r) {
  var ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r, h = b * b - c;
  if (h < 0) return -1; h = Math.sqrt(h); var t = -b - h; return t > 0 ? t : -1;
}
function rayEnemies(o, d, maxT) {       // the player's shots: only actors of the other team
  var best = null;
  for (var i = 0; i < ENEMIES.length; i++) {
    var e = ENEMIES[i], t;
    if (e.dead || e.team === P.team) continue;
    if (e.friend) {
      var h = e.h, th = raySphere(o, d, e.x, e.y + 0.79 * h, e.z, 0.215 * h), tb = raySphere(o, d, e.x, e.y + 0.45 * h, e.z, 0.18 * h), tl = raySphere(o, d, e.x, e.y + 0.17 * h, e.z, 0.15 * h);
      var tm = 1e9, cr = false; if (th > 0) { tm = th; cr = true; } if (tb > 0 && tb < tm) { tm = tb; cr = false; } if (tl > 0 && tl < tm) { tm = tl; cr = false; }
      if (tm < maxT && (!best || tm < best.t)) best = { e: e, t: tm, crit: cr };
      continue;
    }
    t = raySphere(o, d, e.x, e.y, e.z, e.r * 1.12);
    if (t > 0 && t < maxT && (!best || t < best.t)) {
      var s = e.T.scale, fx = Math.sin(e.g.rotation.y), fz = Math.cos(e.g.rotation.y);
      var te = raySphere(o, d, e.x + fx * 0.42 * s, e.y - 0.02 * s, e.z + fz * 0.42 * s, 0.17 * s);
      best = { e: e, t: t, crit: te > 0 && te < t + 0.25 };
    }
  }
  return best;
}
function panTo(x, z) { var dx = x - P.x, dz = z - P.z, l = Math.hypot(dx, dz) || 1; return clamp((dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw)) / l * 0.9, -1, 1); }
function volAt(x, y, z) { return clamp(1.3 - Math.hypot(x - P.x, z - P.z) / 34, 0.15, 1); }

// one entry point for all damage. attacker: P, a bot, or null
function damageActor(t, dmg, attacker, label, crit, hx, hy, hz) {
  if (t === P) { hurtPlayer(dmg, attacker ? attacker.x : P.x, attacker ? attacker.z : P.z, attacker, label); return; }
  if (t.dead || t.inv > 0) return;
  t.hp -= dmg; t.hitFlash = 0.1;
  if (attacker === P) hudHit(crit, t.hp <= 0);
  if (t.friend) { fxSmoke(hx, hy, hz, 0.35, 0.45, 0xf4f1ea, 0.5); t.stagger = 0.18; if (attacker && attacker !== P && !t.target) t.target = attacker; }
  if (t.hp <= 0) killEnemy(t, attacker, crit, label); else if (attacker === P) SFX.hit();
}
function killEnemy(e, attacker, crit, label) {
  if (e.friend) {
    if (e.dead) return;
    e.dead = 0.0001; e.charge = 0; e.burst = 0; if (e.mark) e.mark.visible = false; SFX.down(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
    onKill(attacker, e, label, crit);
    return;
  }
  fxExplosion(e.x, e.y, e.z, e.type === 'gunner'); SFX.boom(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
  var d = Math.hypot(e.x - P.x, e.y - (P.y + 1.2), e.z - P.z);
  if (d < 10) G.shake = Math.min(1.5, G.shake + (10 - d) * 0.09);
  onKill(attacker, e, label, crit);
  removeEnemy(e);
}
function fireBolt(e, spreadMul) {
  var b = null; for (var i = 0; i < BOLTS.length; i++) if (!BOLTS[i].on) { b = BOLTS[i]; break; } if (!b) return;
  var tg = e.target || P, s = e.T.scale, fx = Math.sin(e.g.rotation.y), fz = Math.cos(e.g.rotation.y), ox = e.x + fx * 0.5 * s, oy = e.y - 0.2 * s, oz = e.z + fz * 0.5 * s;
  if (e.friend) { ox = e.x + fx * 0.45 * e.h + fz * 0.2 * e.h; oy = e.y + 0.5 * e.h; oz = e.z + fz * 0.45 * e.h - fx * 0.2 * e.h; }
  var sp = 27 + e.wave * 0.8, dist = Math.hypot(tg.x - ox, tg.z - oz), lead = dist / sp * 0.55, err = e.aimErr * (spreadMul || 1);
  var tx = tg.x + tg.vx * lead + rnd(-err, err), ty = actorY(tg) + rnd(-err, err) * 0.6, tz = tg.z + tg.vz * lead + rnd(-err, err);
  var dx = tx - ox, dy = ty - oy, dz = tz - oz, l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  b.on = true; b.vx = dx / l * sp; b.vy = dy / l * sp; b.vz = dz / l * sp; b.life = 3; b.dmg = (e.T.dmg + Math.min(5, e.wave * 0.5)) * e.dmgMul; b.team = e.team; b.owner = e;
  b.m.material = DR.boltM[e.team]; b.gl.material = DR.glowM[e.team];
  b.m.position.set(ox, oy, oz); _v1.set(ox + dx, oy + dy, oz + dz); b.m.lookAt(_v1); b.m.visible = true;
  fxFlash(ox, oy, oz, 1.2, 0.08, e.team ? 0xff6040 : 0x60a0ff); SFX.bolt(panTo(e.x, e.z), volAt(e.x, e.y, e.z) * (e.team === P.team ? 0.5 : 1));
}
function segNear(px, py, pz, dx, dy, dz, step, cx, cy, cz, r) {
  var ox = cx - px, oy = cy - py, oz = cz - pz, t = clamp(ox * dx + oy * dy + oz * dz, 0, step), qx = ox - dx * t, qy = oy - dy * t, qz = oz - dz * t;
  return qx * qx + qy * qy + qz * qz < r * r;
}
function updateBolts(dt) {
  for (var i = 0; i < BOLTS.length; i++) {
    var b = BOLTS[i]; if (!b.on) continue;
    var p = b.m.position, sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz), step = sp * dt, dx = b.vx / sp, dy = b.vy / sp, dz = b.vz / sp, hit = null;
    if (b.team !== P.team && actorAlive(P) && !(P.inv > 0) && (segNear(p.x, p.y, p.z, dx, dy, dz, step, P.x, P.y + 0.75, P.z, 0.42) || segNear(p.x, p.y, p.z, dx, dy, dz, step, P.x, P.y + 1.45, P.z, 0.42))) hit = P;
    if (!hit) for (var j = 0; j < ENEMIES.length; j++) {
      var e = ENEMIES[j]; if (!e.friend || e.dead || e.team === b.team || e.inv > 0) continue;
      if (segNear(p.x, p.y, p.z, dx, dy, dz, step, e.x, e.y + 0.75 * e.h, e.z, 0.26 * e.h) || segNear(p.x, p.y, p.z, dx, dy, dz, step, e.x, e.y + 0.35 * e.h, e.z, 0.24 * e.h)) { hit = e; break; }
    }
    var w = rayWorld(p.x, p.y, p.z, dx + 1e-9, dy + 1e-9, dz + 1e-9, step);
    if (hit) { b.on = false; b.m.visible = false; damageActor(hit, b.dmg, b.owner && !b.owner.gone ? b.owner : null, 'ブラスター', false, p.x, p.y, p.z); continue; }
    if (w) { var hx = p.x + dx * w.t, hy = p.y + dy * w.t, hz = p.z + dz * w.t; fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, 4, 4); b.on = false; b.m.visible = false; continue; }
    p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt; b.life -= dt; if (b.life <= 0) { b.on = false; b.m.visible = false; }
  }
}
function updateEnemies(dt) {
  var nearest = 99;
  for (var i = ENEMIES.length - 1; i >= 0; i--) {
    var e = ENEMIES[i], T = e.T; e.t += dt;
    if (e.friend) { updateBot(e, dt, i); continue; }
    var dxp = P.x - e.x, dzp = P.z - e.z, dist = Math.hypot(dxp, dzp), d3 = Math.hypot(dist, P.y + 1.4 - e.y); if (d3 < nearest) nearest = d3;
    var see = losClear(e.x, e.y, e.z, P.x, P.y + 1.4, P.z), alive = actorAlive(P);
    var tx, ty, tz, maxSp = T.speed;
    if (T.burst === 0) {       // kamikaze: orbit close, then dive
      if (e.dive <= 0 && dist < 13 && see && alive && e.t > 2.5) e.dive = 0.001;
      if (e.dive > 0) { e.dive += dt; tx = P.x; ty = P.y + 1.3; tz = P.z; maxSp = T.speed * 1.5; e.beepT -= dt; if (e.beepT <= 0) { e.beepT = Math.max(0.07, 0.3 - e.dive * 0.12); SFX.beep(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); e.hitFlash = 0.05; } }
      else { e.ang += e.dir * dt * 0.7; tx = P.x + Math.cos(e.ang) * 10; tz = P.z + Math.sin(e.ang) * 10; ty = e.alt + 1; }
      if (d3 < 1.25 && alive) { hurtPlayer(T.dmg, e.x, e.z, e, '自爆ドローン'); killEnemy(e, null); continue; }
    } else {
      e.dirT -= dt; if (e.dirT <= 0) { e.dirT = rnd(2, 5); e.dir = -e.dir; e.ring = rnd(T.range[0], T.range[1]); e.alt = rnd(2.3, 4.6); }
      e.ang += e.dir * dt * (see ? 0.22 : 0.6);
      tx = P.x + Math.cos(e.ang) * e.ring; tz = P.z + Math.sin(e.ang) * e.ring; ty = e.alt + Math.sin(e.t * 1.7) * 0.25 + (see ? 0 : 1.5);
      tx = clamp(tx, -ARENA - 3, ARENA + 3); tz = clamp(tz, -ARENA - 3, ARENA + 3);
    }
    if (e.dive <= 0) { var top = obstacleTop(e.x + e.vx * 0.4, e.z + e.vz * 0.4, 1.0); if (ty < top + 1.0) ty = top + 1.0; }
    var ax = tx - e.x, ay = ty - e.y, az = tz - e.z, al = Math.sqrt(ax * ax + ay * ay + az * az) || 1, want = Math.min(maxSp, al * 1.6);
    for (var j = 0; j < ENEMIES.length; j++) { if (j === i) continue; var o = ENEMIES[j]; if (o.friend) continue; var sx = e.x - o.x, sy = e.y - o.y, sz = e.z - o.z, sl = sx * sx + sy * sy + sz * sz; if (sl < 6.5 && sl > 0.001) { var f = (6.5 - sl) * 0.35; e.vx += sx * f * dt; e.vy += sy * f * dt * 0.5; e.vz += sz * f * dt; } }
    var k = 1 - Math.exp(-(e.dive > 0 ? 3.2 : 2.2) * dt);
    e.vx += (ax / al * want - e.vx) * k; e.vy += (ay / al * want - e.vy) * k; e.vz += (az / al * want - e.vz) * k;
    e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt;
    if (e.y < 0.6) { e.y = 0.6; e.vy = Math.abs(e.vy) * 0.3; }
    if (e.dive > 0 && e.dive > 0.3) { var top2 = obstacleTop(e.x, e.z, 0.3); if (e.y < top2 + 0.2 && top2 > 0) { killEnemy(e, null); continue; } }
    e.g.position.set(e.x, e.y, e.z);
    var yaw = Math.atan2(dxp, dzp); e.g.rotation.y += angDiff(yaw, e.g.rotation.y) * Math.min(1, dt * 6);
    e.g.rotation.x = clamp(-(e.vx * Math.sin(e.g.rotation.y) + e.vz * Math.cos(e.g.rotation.y)) * 0.03, -0.4, 0.4) + (e.dive > 0 ? 0.5 : 0);
    e.g.rotation.z = clamp((e.vx * Math.cos(e.g.rotation.y) - e.vz * Math.sin(e.g.rotation.y)) * 0.04, -0.4, 0.4);
    for (var r = 0; r < 4; r++) e.rotors[r].rotation.z += dt * 40 * (r % 2 ? 1 : -1);
    if (T.burst > 0 && alive) {
      if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { fireBolt(e, T.burst > 1 ? 1.5 : 1); e.burst--; e.burstT = 0.16; } }
      else if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) { e.burst = T.burst; e.burstT = 0; e.cd = rnd(T.cd[0], T.cd[1]) * Math.max(0.6, 1 - e.wave * 0.035); } }
      else { e.cd -= dt; if (e.cd <= 0 && see && d3 < 30 && Math.hypot(e.x, e.z) < ARENA + 8) { e.charge = 0.45; SFX.charge(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); } }
    }
    if (e.hitFlash > 0) e.hitFlash -= dt;
    var c = e.eyeM.color;
    if (e.hitFlash > 0) c.setRGB(1, 1, 1); else if (e.charge > 0) { var u = 1 - e.charge / 0.45; c.setRGB(1, 0.2 + u * 0.8, 0.1 + u * 0.7); } else if (T.burst === 0) c.setRGB(1, 0.7, 0.12); else c.setRGB(1, 0.16, 0.1);
  }
  if (AU.ok) AU.hum.gain.value = damp(AU.hum.gain.value, nearest < 90 ? clamp(0.16 - nearest * 0.006, 0.015, 0.14) : 0, 3, dt);
}

// ---- ground bots (models have no skeleton: animated by code) ------------------
// o: { team, x, z, diff (0-2, team battle), leader, roster }
var _nd = [0, 0];
function spawnFriend(idx, wave, leader, o) {
  o = o || {};
  var role = FRIEND_ROLE[idx], T = ETYPE[role], x = o.x, z = o.z, ok = x != null, team = o.team == null ? 1 : o.team, tdm = o.diff != null;
  for (var tr = 0; tr < 60 && !ok; tr++) {
    x = rnd(-ARENA + 2, ARENA - 2); z = rnd(-ARENA + 2, ARENA - 2); var c = navCell(x, z), d = NAV.dist[c];
    ok = !NAV.blocked[c] && d > (tr < 40 ? 20 : 12) && (tr > 25 || !losClear(x, 1.3, z, P.x, 1.5, P.z));
  }
  var sc = leader ? 1.22 : 1, mat = (MODELS[idx] ? MODELS[idx].material : PH.mat).clone(), D = tdm ? BOT_DIFF[o.diff] : null;
  if (tdm) mat.color.set(team === 0 ? 0xa8ccff : 0xffaaa0);
  var e = { friend: true, idx: idx, name: o.name || FRIEND_NAMES[idx], type: role, T: T, team: team, leader: !!leader, hp: tdm ? 100 : T.hp * (leader ? 2.3 : 1) * (1 + wave * 0.04), x: x, y: 0, z: z, vx: 0, vz: 0, h: FRIEND_H * sc, r: 0.34,
    t: Math.random() * 9, cd: rnd(1.2, 2.6) * (D ? D.cd : 1), charge: 0, burst: 0, burstT: 0, hitFlash: 0, stagger: 0, dead: 0, wave: tdm ? 2 : wave, dir: Math.random() < 0.5 ? 1 : -1, dirT: rnd(1, 3), ring: rnd(T.range[0], T.range[1]), mat: mat, rise: 0.6,
    aimErr: D ? D.err : Math.max(0.25, 1.15 - wave * 0.1), dmgMul: D ? D.dmg * 1.7 : 1, cdMul: D ? D.cd : Math.max(0.6, 1 - wave * 0.035), tdm: tdm, roster: o.roster || null, inv: tdm ? 1.5 : 0,
    target: tdm ? null : P, tgtT: Math.random() * 0.4, navT: Math.random() * 0.4, nav: tdm ? new Int16Array(4096) : NAV.dist, seeT: 0 };
  if (tdm) e.nav.fill(-1);
  e.g = new THREE.Group(); e.body = new THREE.Group(); e.g.add(e.body);
  e.hi = makeFriendMesh(idx, mat, false); e.hi.scale.setScalar(e.h); e.body.add(e.hi);
  if (MODELS[idx] && MODELS[idx].lod) { e.lo = makeFriendMesh(idx, mat, true); e.lo.scale.setScalar(e.h); e.lo.visible = false; e.body.add(e.lo); }
  var bl = new THREE.Mesh(DR.blaster, DR.metal); bl.position.set(0.2 * e.h, 0.5 * e.h, 0.22 * e.h); bl.castShadow = true; e.body.add(bl);
  e.tip = new THREE.Mesh(DR.tipG, DR.blasterTip.clone()); e.tip.position.set(0.2 * e.h, 0.5 * e.h, 0.22 * e.h + 0.22); e.body.add(e.tip); e.eyeM = e.tip.material;
  if (tdm) { e.mark = new THREE.Sprite(DR.markM[team]); e.mark.scale.setScalar(0.34); e.mark.position.y = e.h + 0.3; e.g.add(e.mark); }
  e.g.position.set(x, 0, z); e.g.rotation.y = tdm ? (team === 0 ? Math.PI : 0) : Math.atan2(P.x - x, P.z - z); scene.add(e.g); ENEMIES.push(e);
  fxSmoke(x, 0.9, z, 1.3, 0.7, 0xdfe8ee, 0.8); if (!tdm || team !== P.team) fxFlash(x, 1, z, 2.2, 0.25, team ? 0xffb09f : 0x9fd8ff);
  return e;
}
function pickTarget(e) {
  var best = null, bs = 1e9, i, o, d;
  for (i = 0; i < ENEMIES.length; i++) { o = ENEMIES[i]; if (!o.friend || o.dead || o.team === e.team) continue; d = Math.hypot(o.x - e.x, o.z - e.z); if (o === e.target) d -= 4; if (d < bs) { bs = d; best = o; } }
  if (e.team !== P.team && actorAlive(P)) { d = Math.hypot(P.x - e.x, P.z - e.z) - (e.target === P ? 4 : 0); if (d < bs) { bs = d; best = P; } }
  return best;
}
function updateBot(e, dt, i) {
  var T = e.T, b = e.body;
  if (e.dead) {                           // fall over, then sink away in a puff
    e.dead += dt; var k = Math.min(1, e.dead / 0.42);
    b.rotation.x = -1.5 * k * k; b.position.y = 0.16 * e.h * k;
    if (e.dead > 1.7) { if (!e.puff) { e.puff = 1; fxSmoke(e.x, 0.3, e.z, 1.2, 0.8, 0xe8e4dc, 0.7); } e.g.position.y = -(e.dead - 1.7) * 1.4; }
    if (e.dead > 2.3) removeEnemy(e);
    return;
  }
  if (e.inv > 0) e.inv -= dt;
  if (e.tdm) {
    e.tgtT -= dt; if (e.tgtT <= 0 || !actorAlive(e.target)) { e.tgtT = 0.45; e.target = pickTarget(e); }
    e.navT -= dt; if (e.navT <= 0) { e.navT = 0.5; var np = e.target || tdmRally(e.team); updateNav(np.x, np.z, e.nav); }
  }
  var tg = e.target, has = !!tg && actorAlive(tg), gx = has ? tg.x : (e.tdm ? tdmRally(e.team).x : P.x), gz = has ? tg.z : (e.tdm ? tdmRally(e.team).z : P.z);
  var dxp = gx - e.x, dzp = gz - e.z, dist = Math.hypot(dxp, dzp) || 0.001;
  var seeNow = has && losClear(e.x, e.h * 0.8, e.z, gx, actorY(tg) + 0.15, gz), mx = 0, mz = 0, sp = T.speed * (1 + e.wave * 0.02);
  e.seeT = seeNow ? e.seeT + dt : 0; var see = seeNow;
  e.dirT -= dt; if (e.dirT <= 0) { e.dirT = rnd(1.2, 3.2); e.dir = -e.dir; e.ring = rnd(T.range[0], T.range[1]); }
  if (e.stagger > 0) { e.stagger -= dt; sp *= 0.25; }
  var firing = e.charge > 0 || e.burst > 0;
  if (!see || dist > e.ring + 2) { if (navDir(e.x, e.z, _nd, e.nav)) { mx = _nd[0]; mz = _nd[1]; } else if (dist > 1.5) { mx = dxp / dist; mz = dzp / dist; } }
  else if (dist < e.ring - 2) { mx = -dxp / dist * 0.7 + (-dzp / dist) * e.dir * 0.6; mz = -dzp / dist * 0.7 + (dxp / dist) * e.dir * 0.6; }
  else { mx = (-dzp / dist) * e.dir * 0.75; mz = (dxp / dist) * e.dir * 0.75; }
  if (firing) { mx *= 0.25; mz *= 0.25; }
  for (var j = 0; j < ENEMIES.length; j++) { var o = ENEMIES[j]; if (j === i || !o.friend || o.dead) continue; var sx = e.x - o.x, sz = e.z - o.z, sl = sx * sx + sz * sz; if (sl < 1.1 && sl > 0.0001) { var f = (1.1 - sl) * 1.4; mx += sx * f; mz += sz * f; } }
  var kk = 1 - Math.exp(-7 * dt); e.vx += (mx * sp - e.vx) * kk; e.vz += (mz * sp - e.vz) * kk;
  var px = e.x, pz = e.z; collideMove(e, e.x + e.vx * dt, e.z + e.vz * dt, 0.34, 0);
  var dpx = e.x - P.x, dpz = e.z - P.z, dp = Math.hypot(dpx, dpz); if (dp < 0.8 && dp > 0.001 && actorAlive(P)) { e.x = P.x + dpx / dp * 0.8; e.z = P.z + dpz / dp * 0.8; }
  var moved = Math.hypot(e.x - px, e.z - pz) / Math.max(dt, 0.001);
  if (moved < sp * 0.25 && (mx || mz) && !firing) { e.stuck = (e.stuck || 0) + dt; if (e.stuck > 0.5) { e.dir = -e.dir; e.stuck = 0; } } else e.stuck = 0;
  e.walk = (e.walk || 0) + moved * dt * 3.1;
  var amp = Math.min(1, moved / 2.5), hop = Math.abs(Math.sin(e.walk)) * 0.11 * amp;
  if (e.rise > 0) e.rise = Math.max(0, e.rise - dt);
  e.g.position.set(e.x, hop, e.z); b.scale.y = 1 - e.rise * 0.5 + Math.sin(e.walk * 2) * 0.03 * amp;
  var faceP = see && dist < 26, yaw = faceP ? Math.atan2(dxp, dzp) : Math.atan2(e.vx, e.vz);
  if (faceP || moved > 0.3) e.g.rotation.y += angDiff(yaw, e.g.rotation.y) * Math.min(1, dt * 7);
  var fwd = e.vx * Math.sin(e.g.rotation.y) + e.vz * Math.cos(e.g.rotation.y), side = e.vx * Math.cos(e.g.rotation.y) - e.vz * Math.sin(e.g.rotation.y);
  b.rotation.x = damp(b.rotation.x, clamp(fwd * 0.05, -0.2, 0.25) - (e.stagger > 0 ? 0.28 : 0), 10, dt);
  b.rotation.z = Math.sin(e.walk) * 0.09 * amp - clamp(side * 0.04, -0.15, 0.15);
  if (e.lo) { var cd = Math.hypot(e.x - camera.position.x, e.z - camera.position.z), far = cd > (Q.tier === 0 ? 9 : 17) && !(gun.ads > 0.5 && curDef().scope); if (e.lo.visible !== far) { e.lo.visible = far; e.hi.visible = !far; } }
  // shooting
  if (has) {
    if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { fireBolt(e, T.burst > 2 ? 1.7 : 1.15); e.burst--; e.burstT = T.burst > 2 ? 0.13 : 0.22; } }
    else if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) { e.burst = T.burst + (e.leader ? 1 : 0); e.burstT = 0; e.cd = rnd(T.cd[0], T.cd[1]) * e.cdMul; } }
    else { e.cd -= dt; if (e.cd <= 0 && see && dist < T.range[1] + 6 && !(e.inv > 0)) { e.charge = 0.5; if (e.team !== P.team) SFX.charge(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); } }
  }
  if (e.hitFlash > 0) { e.hitFlash -= dt; e.mat.emissive.setRGB(0.5, 0.12, 0.08); } else if (e.inv > 0) e.mat.emissive.setRGB(0.25, 0.25, 0.3); else e.mat.emissive.setRGB(0, 0, 0);
  var c = e.eyeM.color; if (e.charge > 0) { var u = 1 - e.charge / 0.5; if (e.team) c.setRGB(1, 0.3 + u * 0.7, 0.2 + u * 0.8); else c.setRGB(0.3 + u * 0.7, 0.6 + u * 0.4, 1); e.tip.scale.setScalar(1 + u * 2.2); } else { if (e.team) c.setRGB(0.8, 0.12, 0.08); else c.setRGB(0.1, 0.4, 0.9); e.tip.scale.setScalar(1); }
}
