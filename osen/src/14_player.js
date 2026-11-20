// ---- プレイヤー（一人称・当たり判定） ---------------------------------------------------
var P = { pos: null, vel: null, yaw: 0, pitch: 0, roll: 0, onGround: true, r: 0.32, h: 1.72, step: 0.52, eye: 1.6, eyeY: 0, gravMul: 1, gravT: 0, speedMul: 1, speedT: 0, scale: 1, scaleT: 0,
  dist: 0, backDist: 0, stillT: 0, lookUpT: 0, jumps: 0, stepAcc: 0, inWater: false, wraps: 0, fallT: 0, floatT: 0, lastSafe: null, area: null, indoor: null };
var SPAWN = { x: 7, y: 0.03, z: -40.5, yaw: -0.12 };
function initPlayer() {
  P.pos = new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z); P.vel = new THREE.Vector3(); P.yaw = SPAWN.yaw; P.lastSafe = P.pos.clone();
  P.eyeY = P.pos.y + P.eye;
}
function playerHeight() { return P.h * P.scale; }
function groundAt(x, z, feet, r) {
  var g = terrainY(x, z), L = colQuery(x, z, r + 0.1), lim = feet + P.step;
  for (var i = 0; i < L.length; i++) {
    var b = L[i];
    if (x + r * 0.7 < b.x0 || x - r * 0.7 > b.x1 || z + r * 0.7 < b.z0 || z - r * 0.7 > b.z1) continue;
    if (b.y1 <= lim && b.y1 > g) g = b.y1;
  }
  return g;
}
function pushOut(x, z, feet) {
  var r = P.r * Math.max(0.5, P.scale), top = feet + playerHeight(), L = colQuery(x, z, r + 0.2), out = { x: x, z: z, hit: false };
  for (var it = 0; it < 2; it++) {
    for (var i = 0; i < L.length; i++) {
      var b = L[i];
      if (b.y1 <= feet + P.step * (P.onGround ? 1 : 0.35) || b.y0 >= top) continue;
      var cx = clamp(out.x, b.x0, b.x1), cz = clamp(out.z, b.z0, b.z1), dx = out.x - cx, dz = out.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      out.hit = true;
      if (d2 > 1e-8) { var d = Math.sqrt(d2), k = (r - d) / d; out.x += dx * k; out.z += dz * k; }
      else { // 中心が箱の中：一番近い面へ
        var l = out.x - b.x0, rr = b.x1 - out.x, n = out.z - b.z0, s = b.z1 - out.z, m = Math.min(l, rr, n, s);
        if (m === l) out.x = b.x0 - r; else if (m === rr) out.x = b.x1 + r; else if (m === n) out.z = b.z0 - r; else out.z = b.z1 + r;
      }
    }
  }
  return out;
}
function ceilingAt(x, z, feet, newTop) {
  var L = colQuery(x, z, P.r), r = P.r * 0.8;
  for (var i = 0; i < L.length; i++) {
    var b = L[i]; if (x + r < b.x0 || x - r > b.x1 || z + r < b.z0 || z - r > b.z1) continue;
    if (b.y0 >= feet + playerHeight() - 0.05 && b.y0 < newTop) return b.y0;
  }
  return null;
}
function updatePlayer(dt) {
  var mv = G.paused ? { x: 0, z: 0, run: false } : readMove();
  // look
  var sens = IN.locked ? 0.0022 : 0.0058;
  P.yaw -= IN.lookX * sens; P.pitch -= IN.lookY * sens; IN.lookX = 0; IN.lookY = 0;
  P.pitch = clamp(P.pitch, -1.45, 1.45);
  // timers
  if (P.gravT > 0) { P.gravT -= dt; if (P.gravT <= 0) P.gravMul = 1; }
  if (P.speedT > 0) { P.speedT -= dt; if (P.speedT <= 0) P.speedMul = 1; }
  if (P.scaleT > 0) { P.scaleT -= dt; if (P.scaleT <= 0) P.scaleTarget = 1; }
  P.scale = lerp(P.scale, P.scaleTarget || 1, 1 - Math.exp(-dt * 3));
  var feetPrev = P.pos.y;
  var base = (mv.run ? 7.4 : 4.2) * P.speedMul * (P.inWater ? 0.6 : 1) * (0.55 + 0.45 * P.scale);
  var cs = Math.cos(P.yaw), sn = Math.sin(P.yaw);
  // forward = (-sin(yaw), -cos(yaw))
  var wx = mv.x * cs + mv.z * sn, wz = -mv.x * sn + mv.z * cs;
  var tvx = wx * base, tvz = wz * base, acc = P.onGround ? 14 : 4;
  P.vel.x += (tvx - P.vel.x) * Math.min(1, acc * dt); P.vel.z += (tvz - P.vel.z) * Math.min(1, acc * dt);
  // jump
  if (IN.jump) { IN.jump = false; if (P.onGround || P.inWater && P.pos.y < RIVER.water - 0.2) { P.vel.y = 5.6 * Math.sqrt(1 / Math.max(0.3, P.gravMul)) * (0.7 + 0.3 * P.scale); P.onGround = false; P.jumps++; sfx('jump'); } }
  // float effect
  if (P.floatT > 0) { P.floatT -= dt; P.vel.y = Math.max(P.vel.y, 1.2); }
  // horizontal move with substeps
  var dx = P.vel.x * dt, dz = P.vel.z * dt, steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dz * dz) / 0.2));
  var ox = P.pos.x, oz = P.pos.z;
  for (var s = 0; s < steps; s++) {
    var nx = P.pos.x + dx / steps, nz = P.pos.z + dz / steps;
    var po = pushOut(nx, nz, P.pos.y);
    P.pos.x = po.x; P.pos.z = po.z;
    // 段差を上る
    if (P.onGround) { var gy = groundAt(P.pos.x, P.pos.z, P.pos.y, P.r); if (gy > P.pos.y && gy <= P.pos.y + P.step) P.pos.y = gy; }
  }
  // vertical
  var g = 15 * P.gravMul;
  P.vel.y -= g * dt;
  if (P.inWater) P.vel.y = Math.max(P.vel.y, -3);
  var ny = P.pos.y + P.vel.y * dt;
  if (P.vel.y > 0) { var ce = ceilingAt(P.pos.x, P.pos.z, P.pos.y, ny + playerHeight()); if (ce !== null) { ny = ce - playerHeight() - 0.01; P.vel.y = 0; } }
  var gnd = groundAt(P.pos.x, P.pos.z, Math.max(P.pos.y, ny) - (P.onGround ? 0 : P.step * 0.9), P.r);
  var wasAir = !P.onGround;
  if (ny <= gnd) { ny = gnd; if (wasAir && P.vel.y < -6) sfx('land'); P.vel.y = 0; P.onGround = true; }
  else if (ny > gnd + 0.05 && !(P.onGround && P.vel.y <= 0 && ny - gnd < 0.35)) P.onGround = false;
  else { ny = gnd; P.onGround = true; P.vel.y = Math.min(0, P.vel.y); }
  P.pos.y = ny;
  P.inWater = P.pos.y < RIVER.water - 0.1 && P.pos.z > RIVER.z0 && P.pos.z < RIVER.z3;
  // 安全確認：落ちすぎ / 埋まり
  if (P.pos.y < -30 || !isFinite(P.pos.x + P.pos.y + P.pos.z)) { P.pos.copy(P.lastSafe); P.vel.set(0, 0, 0); caption('（地面の下から　もどってきた）', { preset: 'fade' }); }
  if (P.onGround && Math.random() < 0.05) P.lastSafe.copy(P.pos);
  // 町のはしっこ → 反対側へ
  var W = 135, wrapped = false;
  if (P.pos.x > W) { P.pos.x = -W + 1; wrapped = true; } else if (P.pos.x < -W) { P.pos.x = W - 1; wrapped = true; }
  if (P.pos.z < 300) { if (P.pos.z > 145) { P.pos.z = -W + 1; wrapped = true; } else if (P.pos.z < -W) { P.pos.z = 144; wrapped = true; } }
  if (wrapped) { P.pos.y = groundAt(P.pos.x, P.pos.z, 50, P.r); P.wraps++; onWrap(); }
  // 歩いた距離
  var moved = Math.sqrt((P.pos.x - ox) * (P.pos.x - ox) + (P.pos.z - oz) * (P.pos.z - oz));
  if (moved < 2) {
    P.dist += moved;
    if (mv.z > 0.5 && moved > 0.001) P.backDist += moved; else if (mv.z < -0.3) P.backDist = Math.max(0, P.backDist - moved * 0.5);
    G.onWalk(moved, mv.z > 0.5);
  }
  // 足音
  if (P.onGround && moved > 0.01) {
    P.stepAcc += moved; var stride = mv.run ? 1.35 : 0.85;
    if (P.stepAcc > stride) { P.stepAcc = 0; sfx(P.inWater ? 'stepWater' : 'step'); }
  }
  // 静止
  if (Math.abs(mv.x) + Math.abs(mv.z) < 0.05 && now() - IN.lastLook > 400) P.stillT += dt; else P.stillT = 0;
  if (P.pitch > 1.15) P.lookUpT += dt; else P.lookUpT = 0;
  // camera
  var bob = P.onGround ? Math.sin(P.dist * 3.4) * 0.035 * Math.min(1, Math.hypot(P.vel.x, P.vel.z) / 4) : 0;
  var eyeT = P.pos.y + P.eye * P.scale + bob;
  P.eyeY = Math.abs(eyeT - P.eyeY) > 1.5 ? eyeT : lerp(P.eyeY, eyeT, 1 - Math.exp(-dt * 18));
  var cam = R.camera;
  cam.position.set(P.pos.x, P.eyeY, P.pos.z);
  cam.rotation.set(P.pitch, P.yaw, P.roll);
}
function teleport(x, y, z, yaw) { P.pos.set(x, y, z); P.vel.set(0, 0, 0); if (yaw != null) P.yaw = yaw; P.eyeY = y + P.eye; P.lastSafe.set(x, y, z); }
