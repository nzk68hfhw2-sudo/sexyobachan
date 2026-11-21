// ---- security drones (all procedural) + their energy bolts -------------------
var ENEMIES = [], BOLTS = [], DR = {};
var ETYPE = {
  scout:  { hp: 70,  scale: 1.0, speed: 6.5, score: 100, dmg: 9,  burst: 1, cd: [1.7, 2.8], range: [9, 15] },
  gunner: { hp: 170, scale: 1.45, speed: 4.2, score: 250, dmg: 8,  burst: 3, cd: [2.4, 3.4], range: [11, 17] },
  kami:   { hp: 45,  scale: 0.8, speed: 9.5, score: 150, dmg: 30, burst: 0, cd: [9, 9], range: [4, 6] }
};
function buildEnemyAssets() {
  DR.body = new THREE.SphereGeometry(0.42, 16, 10); DR.arm = new THREE.BoxGeometry(1.25, 0.05, 0.09); DR.motor = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
  DR.rotor = new THREE.CircleGeometry(0.27, 14); DR.eye = new THREE.SphereGeometry(0.12, 12, 8); DR.barrel = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 8); DR.fin = new THREE.BoxGeometry(0.5, 0.04, 0.5);
  DR.metal = stdMat({ color: 0x24262a, roughness: 0.4, metalness: 0.9, roughnessMap: TEX.metalRgh, envMapIntensity: 1 });
  DR.shell = { scout: stdMat({ color: 0x59616b, roughness: 0.45, metalness: 0.7 }), gunner: stdMat({ color: 0x6d2620, roughness: 0.4, metalness: 0.7 }), kami: stdMat({ color: 0xc79a1a, roughness: 0.5, metalness: 0.5 }) };
  DR.rotorM = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  var bg = new THREE.CylinderGeometry(0.045, 0.045, 0.9, 6); bg.rotateX(Math.PI / 2);
  var bm = new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (var i = 0; i < 22; i++) {
    var m = new THREE.Mesh(bg, bm); m.visible = false; m.frustumCulled = false; scene.add(m);
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff5030, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); gl.scale.setScalar(0.7); m.add(gl);
    BOLTS.push({ m: m, on: false, vx: 0, vy: 0, vz: 0, life: 0, dmg: 0 });
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
  var e = { type: type, T: T, g: d.g, eyeM: d.eyeM, rotors: d.rotors, hp: T.hp * (1 + wave * 0.05), x: Math.cos(a) * 46, y: rnd(9, 13), z: Math.sin(a) * 46, vx: 0, vy: 0, vz: 0,
    ang: a, dir: Math.random() < 0.5 ? 1 : -1, ring: rnd(T.range[0], T.range[1]), alt: rnd(2.3, 4.6), t: Math.random() * 9, cd: rnd(1.2, 2.6), charge: 0, burst: 0, burstT: 0, hitFlash: 0, dive: 0, beepT: 0, r: 0.5 * T.scale, wave: wave, dirT: rnd(2, 5) };
  e.g.position.set(e.x, e.y, e.z); scene.add(e.g); ENEMIES.push(e); return e;
}
function removeEnemy(e) { scene.remove(e.g); e.eyeM.dispose(); var i = ENEMIES.indexOf(e); if (i >= 0) ENEMIES.splice(i, 1); }
function clearEnemies() { while (ENEMIES.length) removeEnemy(ENEMIES[0]); BOLTS.forEach(function (b) { b.on = false; b.m.visible = false; }); }

function raySphere(o, d, cx, cy, cz, r) {
  var ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r, h = b * b - c;
  if (h < 0) return -1; h = Math.sqrt(h); var t = -b - h; return t > 0 ? t : -1;
}
function rayEnemies(o, d, maxT) {
  var best = null;
  for (var i = 0; i < ENEMIES.length; i++) {
    var e = ENEMIES[i], t = raySphere(o, d, e.x, e.y, e.z, e.r * 1.12);
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

function damageEnemy(e, dmg, crit, hx, hy, hz) {
  e.hp -= dmg; e.hitFlash = 0.1; hudHit(crit, e.hp <= 0);
  if (e.hp <= 0) killEnemy(e, true, crit); else SFX.hit();
}
function killEnemy(e, byPlayer, crit) {
  fxExplosion(e.x, e.y, e.z, e.type === 'gunner'); SFX.boom(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
  if (byPlayer) { G.stats.kills++; addScore(e.T.score + (crit ? 50 : 0), crit ? 'クリティカル撃破' : '撃破'); SFX.kill(); }
  var d = Math.hypot(e.x - P.x, e.y - (P.y + 1.2), e.z - P.z);
  if (d < 10) G.shake = Math.min(1.5, G.shake + (10 - d) * 0.09);
  removeEnemy(e);
}
function fireBolt(e, spreadMul) {
  var b = null; for (var i = 0; i < BOLTS.length; i++) if (!BOLTS[i].on) { b = BOLTS[i]; break; } if (!b) return;
  var s = e.T.scale, fx = Math.sin(e.g.rotation.y), fz = Math.cos(e.g.rotation.y), ox = e.x + fx * 0.5 * s, oy = e.y - 0.2 * s, oz = e.z + fz * 0.5 * s;
  var sp = 27 + e.wave * 0.8, dist = Math.hypot(P.x - ox, P.z - oz), lead = dist / sp * 0.55, err = Math.max(0.25, 1.15 - e.wave * 0.1) * (spreadMul || 1);
  var tx = P.x + P.vx * lead + rnd(-err, err), ty = P.y + 1.25 + rnd(-err, err) * 0.6, tz = P.z + P.vz * lead + rnd(-err, err);
  var dx = tx - ox, dy = ty - oy, dz = tz - oz, l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  b.on = true; b.vx = dx / l * sp; b.vy = dy / l * sp; b.vz = dz / l * sp; b.life = 3; b.dmg = e.T.dmg + Math.min(5, e.wave * 0.5);
  b.m.position.set(ox, oy, oz); _v1.set(ox + dx, oy + dy, oz + dz); b.m.lookAt(_v1); b.m.visible = true;
  fxFlash(ox, oy, oz, 1.2, 0.08, 0xff6040); SFX.bolt(panTo(e.x, e.z), volAt(e.x, e.y, e.z));
}
function updateBolts(dt) {
  for (var i = 0; i < BOLTS.length; i++) {
    var b = BOLTS[i]; if (!b.on) continue;
    var p = b.m.position, sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz), step = sp * dt, dx = b.vx / sp, dy = b.vy / sp, dz = b.vz / sp;
    // closest approach to the player's body segment (approximated by 2 spheres)
    var hitP = false;
    if (P.hp > 0) for (var k = 0; k < 2 && !hitP; k++) {
      var cy = P.y + (k ? 1.45 : 0.75), ox = P.x - p.x, oy = cy - p.y, oz = P.z - p.z, t = clamp(ox * dx + oy * dy + oz * dz, 0, step);
      var qx = ox - dx * t, qy = oy - dy * t, qz = oz - dz * t; if (qx * qx + qy * qy + qz * qz < 0.42 * 0.42) hitP = true;
    }
    var w = rayWorld(p.x, p.y, p.z, dx + 1e-9, dy + 1e-9, dz + 1e-9, step);
    if (hitP) { b.on = false; b.m.visible = false; hurtPlayer(b.dmg, p.x - dx, p.z - dz); continue; }
    if (w) { var hx = p.x + dx * w.t, hy = p.y + dy * w.t, hz = p.z + dz * w.t; fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, 5, 4); fxFlash(hx, hy, hz, 0.9, 0.1, 0xff6040); b.on = false; b.m.visible = false; continue; }
    p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt; b.life -= dt; if (b.life <= 0) { b.on = false; b.m.visible = false; }
  }
}
function updateEnemies(dt) {
  var nearest = 99;
  for (var i = ENEMIES.length - 1; i >= 0; i--) {
    var e = ENEMIES[i], T = e.T; e.t += dt;
    var dxp = P.x - e.x, dzp = P.z - e.z, dist = Math.hypot(dxp, dzp), d3 = Math.hypot(dist, P.y + 1.4 - e.y); if (d3 < nearest) nearest = d3;
    var see = losClear(e.x, e.y, e.z, P.x, P.y + 1.4, P.z), alive = P.hp > 0;
    var tx, ty, tz, maxSp = T.speed;
    if (T.burst === 0) {       // kamikaze: orbit close, then dive
      if (e.dive <= 0 && dist < 13 && see && alive && e.t > 2.5) e.dive = 0.001;
      if (e.dive > 0) { e.dive += dt; tx = P.x; ty = P.y + 1.3; tz = P.z; maxSp = T.speed * 1.5; e.beepT -= dt; if (e.beepT <= 0) { e.beepT = Math.max(0.07, 0.3 - e.dive * 0.12); SFX.beep(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); e.hitFlash = 0.05; } }
      else { e.ang += e.dir * dt * 0.7; tx = P.x + Math.cos(e.ang) * 10; tz = P.z + Math.sin(e.ang) * 10; ty = e.alt + 1; }
      if (d3 < 1.25 && alive) { hurtPlayer(T.dmg, e.x, e.z); killEnemy(e, false); continue; }
    } else {
      e.dirT -= dt; if (e.dirT <= 0) { e.dirT = rnd(2, 5); e.dir = -e.dir; e.ring = rnd(T.range[0], T.range[1]); e.alt = rnd(2.3, 4.6); }
      e.ang += e.dir * dt * (see ? 0.22 : 0.6);
      tx = P.x + Math.cos(e.ang) * e.ring; tz = P.z + Math.sin(e.ang) * e.ring; ty = e.alt + Math.sin(e.t * 1.7) * 0.25 + (see ? 0 : 1.5);
      tx = clamp(tx, -ARENA - 3, ARENA + 3); tz = clamp(tz, -ARENA - 3, ARENA + 3);
    }
    if (e.dive <= 0) { var top = obstacleTop(e.x + e.vx * 0.4, e.z + e.vz * 0.4, 1.0); if (ty < top + 1.0) ty = top + 1.0; }
    var ax = tx - e.x, ay = ty - e.y, az = tz - e.z, al = Math.sqrt(ax * ax + ay * ay + az * az) || 1, want = Math.min(maxSp, al * 1.6);
    // separation
    for (var j = 0; j < ENEMIES.length; j++) { if (j === i) continue; var o = ENEMIES[j], sx = e.x - o.x, sy = e.y - o.y, sz = e.z - o.z, sl = sx * sx + sy * sy + sz * sz; if (sl < 6.5 && sl > 0.001) { var f = (6.5 - sl) * 0.35; e.vx += sx * f * dt; e.vy += sy * f * dt * 0.5; e.vz += sz * f * dt; } }
    var k = 1 - Math.exp(-(e.dive > 0 ? 3.2 : 2.2) * dt);
    e.vx += (ax / al * want - e.vx) * k; e.vy += (ay / al * want - e.vy) * k; e.vz += (az / al * want - e.vz) * k;
    e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt;
    if (e.y < 0.6) { e.y = 0.6; e.vy = Math.abs(e.vy) * 0.3; }
    if (e.dive > 0 && e.dive > 0.3) { var top2 = obstacleTop(e.x, e.z, 0.3); if (e.y < top2 + 0.2 && top2 > 0) { killEnemy(e, false); continue; } }
    e.g.position.set(e.x, e.y, e.z);
    var yaw = Math.atan2(dxp, dzp); e.g.rotation.y += angDiff(yaw, e.g.rotation.y) * Math.min(1, dt * 6);
    e.g.rotation.x = clamp(-(e.vx * Math.sin(e.g.rotation.y) + e.vz * Math.cos(e.g.rotation.y)) * 0.03, -0.4, 0.4) + (e.dive > 0 ? 0.5 : 0);
    e.g.rotation.z = clamp((e.vx * Math.cos(e.g.rotation.y) - e.vz * Math.sin(e.g.rotation.y)) * 0.04, -0.4, 0.4);
    for (var r = 0; r < 4; r++) e.rotors[r].rotation.z += dt * 40 * (r % 2 ? 1 : -1);
    // firing
    if (T.burst > 0 && alive) {
      if (e.burst > 0) { e.burstT -= dt; if (e.burstT <= 0) { fireBolt(e, T.burst > 1 ? 1.5 : 1); e.burst--; e.burstT = 0.16; } }
      else if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) { e.burst = T.burst; e.burstT = 0; e.cd = rnd(T.cd[0], T.cd[1]) * Math.max(0.6, 1 - e.wave * 0.035); } }
      else { e.cd -= dt; if (e.cd <= 0 && see && d3 < 30 && Math.hypot(e.x, e.z) < ARENA + 8) { e.charge = 0.45; SFX.charge(panTo(e.x, e.z), volAt(e.x, e.y, e.z)); } }
    }
    if (e.hitFlash > 0) e.hitFlash -= dt;
    var c = e.eyeM.color;
    if (e.hitFlash > 0) c.setRGB(1, 1, 1); else if (e.charge > 0) { var u = 1 - e.charge / 0.45; c.setRGB(1, 0.2 + u * 0.8, 0.1 + u * 0.7); } else if (T.burst === 0) c.setRGB(1, 0.7, 0.12); else c.setRGB(1, 0.16, 0.1);
  }
  if (AU.ok) AU.hum.gain.value = damp(AU.hum.gain.value, ENEMIES.length ? clamp(0.16 - nearest * 0.006, 0.015, 0.14) : 0, 3, dt);
}
