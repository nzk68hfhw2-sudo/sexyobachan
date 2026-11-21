// ---- 車：乗って運転して、突っこんでこわす ---------------------------------------------------------
var VEH = { list: [], eng: null };
var VEH_TYPES = {
  car: { n: '車', L: 4.0, W: 1.8, H: 1.8, max: 24, acc: 13, turn: 2.2, mass: 1, hp: 10, yen: 2800000 },
  kei: { n: '軽トラ', L: 3.6, W: 1.6, H: 1.9, max: 20, acc: 11, turn: 2.5, mass: 1.3, hp: 13, yen: 1500000 }
};
function vehBuild(type, col) {
  var t = VEH_TYPES[type], g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  var box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 12);
  function B2(c, x, y, z, sx, sy, sz, mat) { var m = new THREE.Mesh(box, mat || new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; body.add(m); return m; }
  var paint = new THREE.MeshLambertMaterial({ color: col });
  if (type === 'kei') {
    B2(0, 0, 0.62, -0.1, t.W, 0.5, t.L - 0.2, paint);
    B2(0, 0, 1.25, -1.05, t.W - 0.05, 0.85, 1.3, paint); B2(0xbfe4ff, 0, 1.35, -1.72, t.W - 0.2, 0.5, 0.05);
    B2(0xdddddd, 0, 1.0, 0.55, t.W, 0.3, 0.06); B2(0xdddddd, -t.W / 2, 1.0, 0.55 - 0.9, 0.06, 0.3, 1.9); B2(0xdddddd, t.W / 2, 1.0, 0.55 - 0.9, 0.06, 0.3, 1.9);
  } else {
    B2(0, 0, 0.7, 0, t.W, 0.75, t.L, paint);
    B2(0xbfe4ff, 0, 1.38, 0.15, t.W - 0.2, 0.62, 2.1); B2(0, 0, 1.73, 0.15, t.W - 0.3, 0.07, 1.9, paint);
  }
  B2(0xfff6c0, -0.55, 0.75, -t.L / 2 - 0.01, 0.35, 0.18, 0.04); B2(0xfff6c0, 0.55, 0.75, -t.L / 2 - 0.01, 0.35, 0.18, 0.04);
  B2(0xff3030, -0.6, 0.75, t.L / 2 + 0.01, 0.3, 0.15, 0.04); B2(0xff3030, 0.6, 0.75, t.L / 2 + 0.01, 0.3, 0.15, 0.04);
  var wheels = [];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { var w = new THREE.Mesh(cyl, new THREE.MeshLambertMaterial({ color: 0x222222 })); w.rotation.z = PI / 2; w.scale.set(0.36, 0.26, 0.36); w.position.set(p[0] * (t.W / 2 - 0.05), 0.36, p[1] * (t.L / 2 - 0.75)); w.castShadow = true; body.add(w); wheels.push(w); });
  R.scene.add(g);
  return { g: g, body: body, wheels: wheels, paint: paint };
}
function addVehicle(type, x, z, yaw, col) {
  var t = VEH_TYPES[type], m = vehBuild(type, col);
  var v = { id: VEH.list.length, type: type, t: t, g: m.g, body: m.body, wheels: m.wheels, paint: m.paint, col: col, pos: new THREE.Vector3(x, 0, z), yaw: yaw, spd: 0, vy: 0, vx: 0, vz: 0, steer: 0, hp: t.hp, broken: false, home: { x: x, z: z, yaw: yaw }, brokeT: 0, rx: 0, rz: 0, av: 0, roll: 0, wheelA: 0 };
  v.pos.y = colTop(x, z, 2);
  VEH.list.push(v); vehSync(v); return v;
}
function initVehicles() {
  [[-62, -35.6, 1, 0xd03030, 'car'], [-48, -35.6, 1, 0x3060d0, 'car'], [70, -35.6, 1, 0xf0f0f0, 'car'], [88, -35.6, 1, 0x30a050, 'car'], [-56, 35.6, 1, 0xf0c020, 'car'], [76, 35.6, 1, 0x202428, 'car'],
    [31.6, -70, 0, 0xff80c0, 'car'], [-35.6, -80, 0, 0x8060e0, 'car'], [14, -35.4, 1, 0xff6a00, 'car'], [-14, -35.4, 1, 0xf4f4f4, 'kei'], [40, 85, 0, 0x60a0ff, 'kei']].forEach(function (c) {
    addVehicle(c[4], c[0], c[1], c[2] ? PI / 2 : 0, c[3]);
  });
}
function vehSync(v) {
  v.g.position.copy(v.pos); v.g.rotation.set(0, v.yaw, 0); v.body.rotation.set(v.rx, 0, v.rz);
  v.wheels.forEach(function (w, i) { w.rotation.x = v.wheelA; if (i < 2) w.rotation.y = v.steer * 0.5; });
}
// ---- 乗る・降りる ----
function vehEnter(v) {
  if (!v || v.broken || P.driving || ITEMS.held || NPCHELD.n) return;
  if (v.rx || v.rz) { v.rx = 0; v.rz = 0; }
  P.driving = v; P.root.visible = false; P.shadow.visible = false; P.tackleT = 0;
  CAM.distSave = CAM.distT; CAM.distT = Math.max(CAM.distT, 7.5); CAM.yaw = v.yaw;
  sfx('uiOpen'); logMsg('ev', v.t.n + 'に　乗った。スティックで運転、体当たりでブースト。');
  vehEngine(true);
}
function vehExit(fly) {
  var v = P.driving; if (!v) return; P.driving = null;
  P.root.visible = true; P.shadow.visible = true; CAM.distT = CAM.distSave || 5.2;
  var sx = Math.cos(v.yaw), sz = -Math.sin(v.yaw), side = v.t.W / 2 + 0.6;
  var ex = v.pos.x + sx * side, ez = v.pos.z + sz * side;
  if (colQuery(ex, ez, 0.3).some(function (b) { return ex > b.x0 && ex < b.x1 && ez > b.z0 && ez < b.z1 && b.y1 > v.pos.y + 0.3 && b.y0 < v.pos.y + 1.5; })) { ex = v.pos.x - sx * side; ez = v.pos.z - sz * side; }
  P.pos.set(ex, v.pos.y + (fly ? 1.5 : 0.1), ez); P.vel.set(fly ? sx * 4 : 0, fly ? 10 : 0, fly ? sz * 4 : 0); P.onGround = !fly; P.face = v.yaw;
  vehEngine(false); if (!fly) sfx('put');
}
// ---- エンジンの音（運転中だけ） ----
function vehEngine(on) {
  var c = AUD.ctx; if (!c) return;
  if (on && !VEH.eng) { var o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = 45; o2.frequency.value = 22.5; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g); g.connect(AUD.sfxBus); o.start(); o2.start(); VEH.eng = { o: o, o2: o2, f: f, g: g }; }
  if (!on && VEH.eng) { var e = VEH.eng; VEH.eng = null; e.g.gain.setTargetAtTime(0, c.currentTime, 0.1); setTimeout(function () { try { e.o.stop(); e.o2.stop(); } catch (er) {} }, 500); }
}
// ---- 運転（updatePlayer から呼ばれる） ----
function vehDrive(dt, mv) {
  var v = P.driving, t = v.t;
  var thr = -(mv.z || 0), st = mv.x || 0;
  if (IN.keys.Space) thr = 0;
  var boost = P.boostT > 0 ? 1.6 : 1; if (P.boostT > 0) P.boostT -= dt;
  if (thr > 0.05) v.spd += t.acc * thr * boost * dt * (v.spd < 0 ? 2 : 1);
  else if (thr < -0.05) v.spd += t.acc * thr * dt * (v.spd > 0 ? 1.8 : 0.6);
  else v.spd *= Math.exp(-dt * (IN.keys.Space ? 3 : 0.7));
  v.spd = clamp(v.spd, -7, t.max * boost);
  v.steer += (st - v.steer) * Math.min(1, dt * 8);
  var turnK = clamp(Math.abs(v.spd) / 6, 0, 1) * (v.spd < 0 ? -1 : 1);
  v.yaw -= v.steer * t.turn * turnK * dt;
  // カメラは車の後ろへ（さわっていない時）
  if (now() - IN.lastLook > 900) CAM.yaw += angDiff(CAM.yaw, v.yaw) * Math.min(1, dt * 2.5);
  P.pos.set(v.pos.x, v.pos.y + 0.2, v.pos.z); P.face = v.yaw; P.onGround = true;
  P.vel.set(-Math.sin(v.yaw) * v.spd, 0, -Math.cos(v.yaw) * v.spd);
  if (VEH.eng) { var c = AUD.ctx, f = 40 + Math.abs(v.spd) * 4.5 + (thr > 0.1 ? 12 : 0); VEH.eng.o.frequency.setTargetAtTime(f, c.currentTime, 0.08); VEH.eng.o2.frequency.setTargetAtTime(f / 2, c.currentTime, 0.08); VEH.eng.g.gain.setTargetAtTime(0.05 + Math.min(0.06, Math.abs(v.spd) * 0.003), c.currentTime, 0.1); VEH.eng.f.frequency.setTargetAtTime(300 + Math.abs(v.spd) * 40, c.currentTime, 0.1); }
}
// ---- すべての車の動き・ぶつかり ----
var _vf = null;
function vehUpdate(dt) {
  if (!_vf) _vf = new THREE.Vector3();
  for (var i = 0; i < VEH.list.length; i++) {
    var v = VEH.list[i], t = v.t;
    if (v.broken) { v.brokeT += dt; if (v.brokeT > TUNE.respawn && P.pos.distanceTo(v.home) > 6 && Math.hypot(P.pos.x - v.home.x, P.pos.z - v.home.z) > 4) vehRestore(v); else if (v.vy || v.pos.y > colTop(v.pos.x, v.pos.z, v.pos.y + 0.5) + 0.01) vehFall(v, dt); vehSync(v); continue; }
    var fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw);
    // 運転していない車は、ゆっくり止まる
    if (P.driving !== v) v.spd *= Math.exp(-dt * 1.5);
    v.vx *= Math.exp(-dt * 2); v.vz *= Math.exp(-dt * 2);
    var mx = fx * v.spd + v.vx, mz = fz * v.spd + v.vz;
    var moving = Math.abs(mx) + Math.abs(mz) > 0.05 || v.vy || v.pos.y > colTop(v.pos.x, v.pos.z, v.pos.y + 0.5) + 0.02;
    if (!moving) { if (v.rx || v.rz) { v.rx *= 0.9; v.rz *= 0.9; } continue; }
    v.pos.x += mx * dt; v.pos.z += mz * dt; v.wheelA += v.spd * dt / 0.36;
    vehFall(v, dt);
    v.rx += (-clamp(v.spd * 0.002, -0.04, 0.04) - v.rx) * Math.min(1, dt * 5); v.rz += (v.steer * clamp(v.spd / 30, -1, 1) * 0.08 - v.rz) * Math.min(1, dt * 5);
    // 町の箱（2つの円で判定）
    var sp = Math.hypot(mx, mz);
    for (var c = -1; c <= 1; c += 2) {
      var cx = v.pos.x + fx * c * (t.L / 2 - t.W / 2), cz = v.pos.z + fz * c * (t.L / 2 - t.W / 2), r = t.W / 2 + 0.05;
      var L = colQuery(cx, cz, r + 0.2);
      for (var j = 0; j < L.length; j++) {
        var b = L[j]; if (b.y1 < v.pos.y + 0.35 || b.y0 > v.pos.y + t.H) continue;
        var px = clamp(cx, b.x0, b.x1), pz = clamp(cz, b.z0, b.z1), dx = cx - px, dz = cz - pz, d = Math.hypot(dx, dz);
        if (d >= r) continue;
        var nx = d > 1e-4 ? dx / d : (Math.abs(cx - (b.x0 + b.x1) / 2) > Math.abs(cz - (b.z0 + b.z1) / 2) ? Math.sign(cx - (b.x0 + b.x1) / 2) : 0), nz = d > 1e-4 ? dz / d : (nx ? 0 : Math.sign(cz - (b.z0 + b.z1) / 2) || 1);
        var imp = -(mx * nx + mz * nz);
        if (b.brk && imp > 2.5 && P.driving === v) { var broke = brkHit(b.brk, imp * 0.3 * t.mass * (1 + smashUp('tackle') * 0.2), mx, mz, { kind: 'car', key: 'v' + v.id + '_' + Math.floor(G.t * 3) }); if (broke || b.off) { v.spd *= 0.86; continue; } }
        if (b.brk && b.off) continue;
        v.pos.x += nx * (r - d); v.pos.z += nz * (r - d);
        if (imp > 0) {
          if (imp > 7) vehCrash(v, imp);
          var dot = fx * nx + fz * nz; v.spd -= v.spd * Math.abs(dot) * 1.35; v.vx += nx * imp * 0.3; v.vz += nz * imp * 0.3;
        }
        mx = fx * v.spd + v.vx; mz = fz * v.spd + v.vz;
      }
    }
    if (sp > 3) vehHitStuff(v, fx, fz, mx, mz, sp);
    // 川
    if (v.pos.z > RIVER.z1 && v.pos.z < RIVER.z2 && v.pos.y < RIVER.water && v.pos.z < 300) { if (!v.wet) { v.wet = true; sfx('splash'); debBurst(v.pos.x, RIVER.water, v.pos.z, 0x9fdcff, 16, 'ball', 4); if (P.driving === v) { smashEvent('river', 60, 0, { kind: 'car' }, null); setTimeout(function () { if (P.driving) { vehExit(true); } }, 1500); } } v.spd *= 0.95; }
    else v.wet = false;
    vehSync(v);
  }
}
function vehFall(v, dt) {
  var top = colTop(v.pos.x, v.pos.z, v.pos.y + 0.55);
  if (v.pos.y > top + 0.01 || v.vy > 0) { v.vy -= 18 * dt; v.pos.y += v.vy * dt; if (v.pos.y <= top) { if (v.vy < -6) { sfx('thudBig'); debPuff(v.pos.x, top + 0.2, v.pos.z, 4, 1); if (P.driving === v) feel(1); } v.pos.y = top; v.vy = v.vy < -6 ? -v.vy * 0.25 : 0; } }
  else v.pos.y = top;
  if (v.pos.y < -15) { v.pos.set(v.home.x, 2, v.home.z); v.vy = 0; v.spd = 0; }
}
// 前にある物・住人・ほかの車を、はね飛ばす
function vehHitStuff(v, fx, fz, mx, mz, sp) {
  var t = v.t, cx = v.pos.x + fx * t.L * 0.45, cz = v.pos.z + fz * t.L * 0.45, cy = v.pos.y + 0.8, src = { kind: 'car', key: 'v' + v.id + '_' + Math.floor(G.t * 2), air: false };
  var B3 = brkQuery(cx - 1, cy - 0.8, cz - 1, cx + 1, cy + 1.2, cz + 1).slice();
  for (var i = 0; i < B3.length; i++) if (!B3[i].cols.length && P.driving === v) brkHit(B3[i], sp * 0.25, mx, mz, src);
  itemsNear(cx, cz, 1.6).forEach(function (it) { var b = it.body; if (it === ITEMS.held || it.broken || it.onHead || b.fixed) return; if (Math.hypot(b.pos.x - cx, b.pos.z - cz) > t.W * 0.6 + Math.max(b.ex, b.ez)) return; if (it._vh === src.key) return; it._vh = src.key; var k = 1.1 / Math.sqrt(Math.max(0.6, effMass(b) * 0.3)) * TUNE.flyPow; b.vel.set(mx * k + rand(-1, 1), 3 + sp * 0.35, mz * k + rand(-1, 1)); b.av.set(rand(-9, 9), rand(-9, 9), rand(-9, 9)); b.thrownT = 1.2; wake(it); if (P.driving === v) { itemHit(it, sp * 0.22, mx, mz, src); if (!ITEM_BRK[it.type]) smashEvent('hit', 2, 0, src, itemName(it)); } if (effMass(b) > 20) v.spd *= 0.7; });
  _vf.set(cx, cy, cz); npcHitAt(_vf, t.W * 0.6, { x: mx, z: mz }, sp * 1.4, src);
  // ほかの車
  for (var k = 0; k < VEH.list.length; k++) {
    var o = VEH.list[k]; if (o === v || o.broken) continue;
    var dx = o.pos.x - v.pos.x, dz = o.pos.z - v.pos.z, d = Math.hypot(dx, dz), rr = (t.L + o.t.L) * 0.38;
    if (d > rr || d < 0.01) continue;
    var nx = dx / d, nz = dz / d, imp = mx * nx + mz * nz; if (imp <= 0) continue;
    o.vx += nx * imp * 0.9; o.vz += nz * imp * 0.9; o.vy = Math.max(o.vy, imp * 0.15); o.yaw += rand(-0.6, 0.6) * Math.min(1, imp / 10);
    v.spd *= 0.55; v.pos.x -= nx * (rr - d) * 0.5; v.pos.z -= nz * (rr - d) * 0.5;
    if (imp > 5) { vehDamage(o, imp * 0.45, src); vehCrash(v, imp * 0.7); }
  }
}
function vehCrash(v, imp) {
  if (v._ct && G.t - v._ct < 0.3) return; v._ct = G.t;
  if (v.pos.distanceTo(P.pos) < 50) { sfx('crash', -Math.min(10, imp)); feel(P.driving === v ? Math.min(2, Math.floor(imp / 8)) : 0); }
  debBurst(v.pos.x, v.pos.y + 0.8, v.pos.z, v.paint.color, 6, 'box', 4); debBurst(v.pos.x, v.pos.y + 1.2, v.pos.z, GLASS_COL, 4, 'shard', 4);
  vehDamage(v, imp * 0.12, { kind: 'car', key: 'self' });
}
function vehDamage(v, dmg, src) {
  if (v.broken) return; v.hp -= dmg;
  if (v.hp > 0) { if (dmg > 0.3 && P.driving !== v && src && src.kind !== 'car') smashEvent('hit', 3, 30000, src, v.t.n); return; }
  v.broken = true; v.brokeT = 0;
  var c = new THREE.Vector3(v.pos.x, v.pos.y + 0.8, v.pos.z);
  explode(c, 4.5, 5, 'vx' + v.id + G.t, { kind: 'chain', key: 'vx' + v.id });
  v.paint.color.multiplyScalar(0.25); v.vy = 7; v.rz = rand(-0.5, 0.5); v.rx = rand(-0.3, 0.3); v.yaw += rand(-1, 1);
  if (!src || !src.net) smashEvent('break', 120, v.t.yen, src || { kind: 'chain' }, v.t.n, 2);
  if (P.driving === v) { vehExit(true); sysMsg(v.t.n + 'が　こわれた!!　外に　ふっとんだ!!'); }
}
function vehRestore(v) {
  v.broken = false; v.hp = v.t.hp; v.paint.color.setHex(v.col); v.pos.set(v.home.x, 0, v.home.z); v.pos.y = colTop(v.home.x, v.home.z, 3); v.yaw = v.home.yaw; v.spd = v.vx = v.vz = v.vy = 0; v.rx = v.rz = 0;
  if (P.pos.distanceTo(v.pos) < 40) { sfx('pon'); debStars(v.pos.x, v.pos.y + 1.8, v.pos.z, 6); }
  vehSync(v);
}
// 爆発で車も飛ぶ
function vehBlast(p, r, pw, src) {
  for (var i = 0; i < VEH.list.length; i++) {
    var v = VEH.list[i]; if (v.broken) continue; var dx = v.pos.x - p.x, dz = v.pos.z - p.z, d = Math.hypot(dx, dz); if (d > r + 1.5) continue;
    var k = (1 - d / (r + 1.5)) * pw; v.vx += dx / (d || 1) * k * 1.2; v.vz += dz / (d || 1) * k * 1.2; v.vy = Math.max(v.vy, k * 1.1); v.rz = rand(-0.3, 0.3);
    vehDamage(v, k * 0.8, src);
  }
}
// ねらい（乗る）
function vehTarget(test) { if (P.driving) return; for (var i = 0; i < VEH.list.length; i++) { var v = VEH.list[i]; if (v.broken) continue; _vf = _vf || new THREE.Vector3(); test({ x: v.pos.x, y: v.pos.y + 0.9, z: v.pos.z }, 1.7, v); } }
