// ---- 主人公（三人称）・カメラ・体の動き・とくぎ ------------------------------------------------
var PLAYER = { char: 0, name: '', server: '', channel: '', agreed: false, bubble: null };
var P = { pos: null, vel: null, face: 0, r: 0.3, h: 1.4, bodyH: 1.3, step: 0.52, onGround: true, gravMul: 1, gravT: 0, speedMul: 1, speedT: 0, scale: 1, scaleT: 0, scaleTarget: 1,
  dist: 0, backDist: 0, stillT: 0, lookUpT: 0, jumps: 0, stepAcc: 0, inWater: false, wraps: 0, floatT: 0, lastSafe: null, airJumps: 0, skillCd: 0, slideT: 0, gesture: null, throwT: 0, squash: 0, walkPh: 0, roll: 0, root: null, body: null, mesh: null };
var CAM = { yaw: 0, pitch: 0.32, dist: 5.2, distT: 5.2, pos: null, look: null, inside: false };
var SPAWN = { x: 7, y: 0.03, z: -40.5, yaw: 0 };
function initPlayer() {
  P.pos = new THREE.Vector3(SPAWN.x, SPAWN.y, SPAWN.z); P.vel = new THREE.Vector3(); P.lastSafe = P.pos.clone();
  CAM.pos = new THREE.Vector3(); CAM.look = new THREE.Vector3(); CAM.yaw = SPAWN.yaw; P.face = SPAWN.yaw;
  P.root = new THREE.Group(); P.body = new THREE.Group(); P.root.add(P.body); R.scene.add(P.root);
  // 足元の影（丸い）
  var sh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  sh.rotation.x = -PI / 2; sh.position.y = 0.03; sh.renderOrder = 1; P.shadow = sh; R.scene.add(sh);
}
function setPlayerChar(idx) {
  var prev = PLAYER.char;
  PLAYER.char = idx;
  var c2 = CHARS[idx], g2 = LITE.on ? FRIENDS.lo[idx] : FRIENDS.hi[idx];
  if (P.mesh) P.body.remove(P.mesh);
  P.mesh = new THREE.Mesh(g2, friendMat(g2.userData.set || 0)); P.mesh.castShadow = true;
  var s = 1.18 * c2.scale; P.mesh.scale.set(s, s, s); P.body.add(P.mesh);
  P.bodyH = (g2.userData.h || 1.06) * s; P.h = P.bodyH + 0.08; P.r = 0.28 * c2.scale;
  if (typeof npcSetHidden === 'function') npcSetHidden(idx, prev);
  if (H.face) setFace(idx);
  if (H.stName) H.stName.innerHTML = cnHTML(PLAYER.name);
  if (window.NET && NET.sendMeta) NET.sendMeta();
}
function playerHeight() { return P.h * P.scale; }
// ---- 当たり判定（町の箱＋重い物） --------------------------------------------------------------
function solidsNear(x, z, r) {
  var L = colQuery(x, z, r);
  if (typeof itemSolidsNear === 'function') L = L.concat(itemSolidsNear(x, z, r));
  return L;
}
function groundAt(x, z, feet, r, step) {
  var g2 = terrainY(x, z), L = solidsNear(x, z, r + 0.1), lim = feet + (step == null ? P.step : step), rr = r * 0.7;
  for (var i = 0; i < L.length; i++) {
    var b = L[i]; if (x + rr < b.x0 || x - rr > b.x1 || z + rr < b.z0 || z - rr > b.z1) continue;
    if (b.y1 <= lim && b.y1 > g2) g2 = b.y1;
  }
  return g2;
}
function pushOutE(x, z, feet, r, h, onGround) {
  var top = feet + h, L = solidsNear(x, z, r + 0.2), out = { x: x, z: z, hit: false };
  for (var it = 0; it < 2; it++) for (var i = 0; i < L.length; i++) {
    var b = L[i];
    if (b.y1 <= feet + P.step * (onGround ? 1 : 0.35) || b.y0 >= top) continue;
    var cx = clamp(out.x, b.x0, b.x1), cz = clamp(out.z, b.z0, b.z1), dx = out.x - cx, dz = out.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue; out.hit = true;
    if (d2 > 1e-8) { var d = Math.sqrt(d2), k = (r - d) / d; out.x += dx * k; out.z += dz * k; }
    else { var l = out.x - b.x0, rr = b.x1 - out.x, n = out.z - b.z0, s = b.z1 - out.z, m = Math.min(l, rr, n, s); if (m === l) out.x = b.x0 - r; else if (m === rr) out.x = b.x1 + r; else if (m === n) out.z = b.z0 - r; else out.z = b.z1 + r; }
  }
  return out;
}
function pushOut(x, z, feet) { return pushOutE(x, z, feet, P.r * Math.max(0.5, P.scale), playerHeight(), P.onGround); }
function ceilingAt(x, z, feet, newTop, h, r) {
  var L = solidsNear(x, z, r), rr = r * 0.8;
  for (var i = 0; i < L.length; i++) { var b = L[i]; if (x + rr < b.x0 || x - rr > b.x1 || z + rr < b.z0 || z - rr > b.z1) continue; if (b.y0 >= feet + h - 0.05 && b.y0 < newTop) return b.y0; }
  return null;
}
// 体（プレイヤーも住人も使う）を動かす。ent: {pos, vel, r, h, onGround}
function moveEntity(ent, dt, gmul) {
  var dx = ent.vel.x * dt, dz = ent.vel.z * dt, steps = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dz * dz) / 0.2));
  for (var s = 0; s < steps; s++) {
    var po = pushOutE(ent.pos.x + dx / steps, ent.pos.z + dz / steps, ent.pos.y, ent.r, ent.h, ent.onGround);
    ent.pos.x = po.x; ent.pos.z = po.z; ent.hitWall = po.hit;
    if (ent.onGround) { var gy = groundAt(ent.pos.x, ent.pos.z, ent.pos.y, ent.r); if (gy > ent.pos.y && gy <= ent.pos.y + P.step) ent.pos.y = gy; }
  }
  ent.vel.y -= 15 * (gmul || 1) * dt;
  if (ent.inWater) ent.vel.y = Math.max(ent.vel.y, -3);
  var ny = ent.pos.y + ent.vel.y * dt;
  if (ent.vel.y > 0) { var ce = ceilingAt(ent.pos.x, ent.pos.z, ent.pos.y, ny + ent.h, ent.h, ent.r); if (ce !== null) { ny = ce - ent.h - 0.01; ent.vel.y = 0; } }
  var gnd = groundAt(ent.pos.x, ent.pos.z, Math.max(ent.pos.y, ny) - (ent.onGround ? 0 : P.step * 0.9), ent.r);
  var wasAir = !ent.onGround; ent.landV = 0;
  if (ny <= gnd) { ny = gnd; if (wasAir) ent.landV = -ent.vel.y; ent.vel.y = 0; ent.onGround = true; }
  else if (ny > gnd + 0.05 && !(ent.onGround && ent.vel.y <= 0 && ny - gnd < 0.35)) ent.onGround = false;
  else { ny = gnd; ent.onGround = true; ent.vel.y = Math.min(0, ent.vel.y); }
  ent.pos.y = ny;
  ent.inWater = ent.pos.y < RIVER.water - 0.1 && ent.pos.z > RIVER.z0 && ent.pos.z < RIVER.z3;
}
// ---- 毎フレーム ----------------------------------------------------------------------------------
function updatePlayer(dt) {
  var mv = (G.paused || G.inMenu) ? { x: 0, z: 0, run: false } : readMove();
  var c2 = CHARS[PLAYER.char];
  // 視点（カメラ）
  var sens = IN.locked ? 0.0042 : 0.0062;
  CAM.yaw -= IN.lookX * sens; CAM.pitch += IN.lookY * sens * 0.8; IN.lookX = 0; IN.lookY = 0;
  CAM.pitch = clamp(CAM.pitch, -0.75, 1.25);
  CAM.distT = clamp(CAM.distT + IN.zoom, 1.6, 11); IN.zoom = 0;
  // タイマー
  if (P.gravT > 0) { P.gravT -= dt; if (P.gravT <= 0) P.gravMul = 1; }
  if (P.speedT > 0) { P.speedT -= dt; if (P.speedT <= 0) P.speedMul = 1; }
  if (P.scaleT > 0) { P.scaleT -= dt; if (P.scaleT <= 0) P.scaleTarget = 1; }
  if (P.skillCd > 0) P.skillCd -= dt;
  P.scale = lerp(P.scale, P.scaleTarget || 1, 1 - Math.exp(-dt * 3));
  // 移動（カメラの向き基準）
  var base = (mv.run ? 7.2 : 4.0) * c2.speed * P.speedMul * (P.inWater ? 0.6 : 1) * (0.55 + 0.45 * P.scale) * (ITEMS.held ? 0.85 : 1);
  var fy = CAM.yaw, wx = mv.x * Math.cos(fy) + mv.z * Math.sin(fy), wz = -mv.x * Math.sin(fy) + mv.z * Math.cos(fy);
  if (P.gesture && (Math.abs(mv.x) + Math.abs(mv.z) > 0.1)) P.gesture = null;
  var tvx = wx * base, tvz = wz * base, acc = P.onGround ? 12 : 3.5;
  if (P.slideT > 0) { P.slideT -= dt; tvx = -Math.sin(P.face) * 14; tvz = -Math.cos(P.face) * 14; acc = 30; }
  P.vel.x += (tvx - P.vel.x) * Math.min(1, acc * dt); P.vel.z += (tvz - P.vel.z) * Math.min(1, acc * dt);
  var spd = Math.hypot(P.vel.x, P.vel.z);
  if (spd > 0.3) P.face += angDiff(P.face, Math.atan2(-P.vel.x, -P.vel.z)) * Math.min(1, dt * 10);
  // ジャンプ
  if (IN.jump) {
    IN.jump = false;
    if (P.onGround || (P.inWater && P.pos.y < RIVER.water - 0.2)) { P.vel.y = 5.6 * c2.jump * Math.sqrt(1 / Math.max(0.3, P.gravMul)) * (0.7 + 0.3 * P.scale); P.onGround = false; P.jumps++; P.airJumps = 0; sfx('jump', c2.step); P.squash = -0.18; }
    else if (PLAYER.char === 2 && P.airJumps < 1) { P.airJumps++; P.vel.y = 5.2 * c2.jump; sfx('jump', c2.step + 5); P.squash = -0.2; }
  }
  if (P.floatT > 0) { P.floatT -= dt; P.vel.y = Math.max(P.vel.y, 1.2); }
  var ox = P.pos.x, oz = P.pos.z;
  var ent = P; ent.h = playerHeight(); ent.r = P.r * Math.max(0.5, P.scale);
  moveEntity(ent, dt, P.gravMul);
  if (P.landV > 6) { sfx('land'); P.squash = Math.min(0.28, P.landV * 0.025); if (PLAYER.char === 3 && typeof itemsHop === 'function') itemsHop(P.pos, 4); }
  // 安全確認
  if (P.pos.y < -30 || !isFinite(P.pos.x + P.pos.y + P.pos.z)) { P.pos.copy(P.lastSafe); P.vel.set(0, 0, 0); caption('（地面の下から　もどってきた）', { preset: 'fade' }); }
  if (P.onGround && Math.random() < 0.05) P.lastSafe.copy(P.pos);
  // 町のはしっこ → 反対側へ
  var W = 135, wrapped = false;
  if (P.pos.x > W) { P.pos.x = -W + 1; wrapped = true; } else if (P.pos.x < -W) { P.pos.x = W - 1; wrapped = true; }
  if (P.pos.z < 300) { if (P.pos.z > 145) { P.pos.z = -W + 1; wrapped = true; } else if (P.pos.z < -W) { P.pos.z = 144; wrapped = true; } }
  if (wrapped) { P.pos.y = groundAt(P.pos.x, P.pos.z, 50, P.r); P.wraps++; onWrap(); snapCamera(); }
  // 歩いた距離
  var moved = Math.hypot(P.pos.x - ox, P.pos.z - oz);
  if (moved < 2) {
    P.dist += moved;
    if (mv.z > 0.5 && moved > 0.001) P.backDist += moved; else if (mv.z < -0.3) P.backDist = Math.max(0, P.backDist - moved * 0.5);
    G.onWalk(moved, mv.z > 0.5);
  }
  if (P.onGround && moved > 0.01) { P.stepAcc += moved; if (P.stepAcc > (mv.run ? 1.3 : 0.8) * c2.scale) { P.stepAcc = 0; sfx(P.inWater ? 'stepWater' : 'step', c2.step); } }
  if (Math.abs(mv.x) + Math.abs(mv.z) < 0.05 && now() - IN.lastLook > 400) P.stillT += dt; else P.stillT = 0;
  if (CAM.pitch < -0.55) P.lookUpT += dt; else P.lookUpT = 0;
  animatePlayer(dt, spd, mv.run);
  updateCamera(dt);
}
// ---- 体の動き（モデルにアニメーションが無いので、プログラムでゆらす） ---------------------------------
function bodyAnim(rootObj, bodyObj, st, dt, spd, run, onGround, vy, extra) {
  st.walkPh = (st.walkPh || 0) + dt * (onGround ? spd * 2.6 : 0);
  var w = Math.min(1, spd / 4);
  var bounce = onGround ? Math.abs(Math.sin(st.walkPh)) * 0.07 * w * (run ? 1.4 : 1) : 0;
  var lean = (run ? 0.2 : 0.09) * w, roll = Math.sin(st.walkPh) * 0.09 * w;
  st.squash = lerp(st.squash || 0, 0, 1 - Math.exp(-dt * 8));
  var sy = 1 - (st.squash || 0) + (onGround ? 0 : clamp(vy * 0.02, -0.06, 0.08)), sxz = 1 + (st.squash || 0) * 0.5;
  var yaw = 0, ex = extra || {};
  if (ex.lean) lean += ex.lean; if (ex.roll) roll += ex.roll; if (ex.yaw) yaw += ex.yaw; if (ex.bounce) bounce += ex.bounce; if (ex.sy) sy *= ex.sy;
  bodyObj.position.y = bounce; bodyObj.rotation.set(-lean, yaw, roll); bodyObj.scale.set(sxz, sy, sxz);
}
function gestureAnim(gs, dt) {
  if (!gs) return null; gs.t += dt; var t = gs.t, e = {};
  switch (gs.id) {
    case 'wave': e.roll = Math.sin(t * 10) * 0.25; if (t > 1.6) return 'end'; break;
    case 'bow': e.lean = Math.sin(Math.min(1, t / 1.6) * PI) * 0.7; if (t > 1.6) return 'end'; break;
    case 'jump': e.bounce = Math.abs(Math.sin(t * 6)) * 0.5; if (t > 1.05) return 'end'; break;
    case 'spin': e.yaw = t * TAU * 1.5; if (t > 1.33) return 'end'; break;
    case 'dance': e.bounce = Math.abs(Math.sin(t * 8)) * 0.15; e.roll = Math.sin(t * 4) * 0.25; e.yaw = Math.sin(t * 2) * 0.8; if (t > 3) return 'end'; break;
    case 'nod': e.lean = Math.max(0, Math.sin(t * 9)) * 0.25; if (t > 1.1) return 'end'; break;
    case 'shake': e.yaw = Math.sin(t * 14) * 0.4; if (t > 1.1) return 'end'; break;
    case 'sit': e.sy = 1 - 0.4 * Math.sin(Math.min(1, t / 2.5) * PI); if (t > 2.5) return 'end'; break;
  }
  return e;
}
function animatePlayer(dt, spd, run) {
  var ex = gestureAnim(P.gesture, dt); if (ex === 'end') { P.gesture = null; ex = null; }
  ex = ex || {};
  if (ITEMS.held) ex.lean = (ex.lean || 0) - 0.07;
  if (P.throwT > 0) { P.throwT -= dt; ex.lean = (ex.lean || 0) + Math.sin(P.throwT / 0.35 * PI) * 0.45; }
  if (P.slideT > 0) { ex.lean = (ex.lean || 0) + 0.35; }
  bodyAnim(P.root, P.body, P, dt, spd, run, P.onGround, P.vel.y, ex);
  P.root.position.copy(P.pos); P.root.rotation.y = P.face + PI; P.root.scale.setScalar(P.scale);
  P.shadow.position.set(P.pos.x, groundAt(P.pos.x, P.pos.z, P.pos.y + 0.1, 0.1, 0.1) + 0.03, P.pos.z); P.shadow.scale.setScalar(P.scale * CHARS[PLAYER.char].scale * (1 - clamp((P.pos.y - P.shadow.position.y) * 0.1, 0, 0.6)));
}
// ---- カメラ（後ろから追いかける。壁に入らない・屋内で近づく） ---------------------------------------
var _cv1 = null, _cv2 = null;
function camBlocked(ax, ay, az, bx, by, bz) {
  var d = Math.hypot(bx - ax, by - ay, bz - az), n = Math.ceil(d / 0.2), best = 1;
  var L = colQuery((ax + bx) / 2, (az + bz) / 2, d / 2 + 0.5);
  for (var i = 1; i <= n; i++) {
    var t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, z = az + (bz - az) * t;
    if (y < terrainY(x, z) + 0.2) return Math.max(0, t - 1 / n);
    for (var j = 0; j < L.length; j++) { var b = L[j]; if (x > b.x0 - 0.15 && x < b.x1 + 0.15 && z > b.z0 - 0.15 && z < b.z1 + 0.15 && y > b.y0 - 0.15 && y < b.y1 + 0.15) return Math.max(0, t - 1 / n); }
  }
  return best;
}
function insideZone(x, y, z) { for (var i = 0; i < WORLD.zones.length; i++) { var q = WORLD.zones[i]; if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1 && y >= q.y0 - 0.5 && y < q.y1) return q; } return null; }
function snapCamera() { CAM.snap = true; }
function updateCamera(dt) {
  var inZ = insideZone(P.pos.x, P.pos.y, P.pos.z); CAM.inside = !!inZ;
  var want = inZ ? Math.min(CAM.distT, 2.6) : CAM.distT;
  CAM.dist = lerp(CAM.dist, want, 1 - Math.exp(-dt * 6));
  var tx = P.pos.x, ty = P.pos.y + P.bodyH * P.scale * 0.9 + 0.15, tz = P.pos.z;
  var cp = Math.cos(CAM.pitch), dx = Math.sin(CAM.yaw) * cp, dy = Math.sin(CAM.pitch), dz = Math.cos(CAM.yaw) * cp;
  var bx = tx + dx * CAM.dist, by = ty + dy * CAM.dist + 0.2, bz = tz + dz * CAM.dist;
  var f = camBlocked(tx, ty, tz, bx, by, bz), d = Math.max(0.35, CAM.dist * f);
  var px = tx + dx * d, py = ty + dy * d + 0.2 * f, pz = tz + dz * d;
  if (CAM.snap || !isFinite(CAM.pos.x)) { CAM.pos.set(px, py, pz); CAM.snap = false; }
  else { var k = 1 - Math.exp(-dt * (d < CAM.lastD ? 30 : 10)); CAM.pos.x = lerp(CAM.pos.x, px, k); CAM.pos.y = lerp(CAM.pos.y, py, k); CAM.pos.z = lerp(CAM.pos.z, pz, k); }
  CAM.lastD = d;
  var cam = R.camera; cam.position.copy(CAM.pos);
  CAM.look.set(tx, ty, tz); cam.lookAt(CAM.look);
  cam.rotateZ(P.roll || 0);
  // 近すぎる時は自分を半透明に
  var near = cam.position.distanceTo(CAM.look) < 0.9;
  if (P.mesh) { P.mesh.material = near ? (P._ghostMat || (P._ghostMat = new THREE.MeshLambertMaterial({ map: P.mesh.material.map, transparent: true, opacity: 0.25 }))) : friendMat(P.mesh.geometry.userData.set || 0); }
}
function teleport(x, y, z, yaw) { P.pos.set(x, y, z); P.vel.set(0, 0, 0); if (yaw != null) { P.face = yaw; CAM.yaw = yaw; } P.lastSafe.set(x, y, z); snapCamera(); }
// ---- とくぎ ---------------------------------------------------------------------------------
function useSkill() {
  if (G.inMenu) return;
  if (P.skillCd > 0) { sysMsg('とくぎは　あと' + Math.ceil(P.skillCd) + '秒で　使えます。'); sfx('error'); return; }
  var sk = CHARS[PLAYER.char].skill; P.skillCd = 8;
  popWA(sk.name, { style: PLAYER.char * 2 % WA_STYLES.length, y: 0.22, size: 64 }); sysMsg('とくぎ「' + sk.name + '」!!');
  addPollution(1.5);
  switch (sk.id) {
    case 'matsu': G.slowT = 6; sfx('warp'); break;
    case 'surari': P.slideT = 0.7; sfx('whoosh'); break;
    case 'beranda': if (P.onGround) { P.vel.y = 10; P.onGround = false; } else { P.vel.y = 7; } sfx('up'); break;
    case 'haneru': P.vel.y = 13; P.onGround = false; sfx('boing'); break;
    case 'mamoru': if (typeof itemsBlast === 'function') itemsBlast(P.pos, 7, 9); sfx('grow'); break;
    case 'tooshi': G.xray = 10; sfx('chime'); break;
    case 'chikuri': G.magnetT = 5; sfx('up'); break;
    case 'shichisan': if (typeof itemsLineUp === 'function') itemsLineUp(P.pos, P.face); sfx('chime'); break;
  }
  if (window.NET && NET.send) NET.send('skill', { s: sk.id });
}
