// ---- 物の物理（軽い自作）：重さ・当たり判定・転がる・倒れる・はね返る・積める ------------------------
var ITEMS = { list: [], held: null, grid: {}, cell: 2.5, nextId: 1 };
var PHYS = { g: 15, acc: 0, step: 1 / 60 };
// 箱の向き（倒れ方）に合わせた当たり判定の大きさ
function bodyExt(b) {
  var hx = b.hx, hy = b.hy, hz = b.hz, t;
  var lx = Math.abs(Math.round(b.rx / (PI / 2))) % 2, lz = Math.abs(Math.round(b.rz / (PI / 2))) % 2;
  if (lx) { t = hy; hy = hz; hz = t; }
  if (lz) { t = hy; hy = hx; hx = t; }
  var c2 = Math.abs(Math.cos(b.yaw)), s = Math.abs(Math.sin(b.yaw));
  var ex = c2 * hx + s * hz, ez = s * hx + c2 * hz;
  var k = b.scale; b.ex = ex * k; b.ey = hy * k; b.ez = ez * k;
}
function effMass(b) { return b.mass * b.scale * b.scale * b.scale; }
function physGridKey(x, z) { return Math.floor(x / ITEMS.cell) + ',' + Math.floor(z / ITEMS.cell); }
function physRebuildGrid() {
  var g2 = ITEMS.grid = {};
  for (var i = 0; i < ITEMS.list.length; i++) {
    var it = ITEMS.list[i], b = it.body; if (it.gone || it === ITEMS.held) continue;
    var c2 = ITEMS.cell, x0 = Math.floor((b.pos.x - b.ex) / c2), x1 = Math.floor((b.pos.x + b.ex) / c2), z0 = Math.floor((b.pos.z - b.ez) / c2), z1 = Math.floor((b.pos.z + b.ez) / c2);
    for (var gx = x0; gx <= x1; gx++) for (var gz = z0; gz <= z1; gz++) { var k = gx + ',' + gz; (g2[k] || (g2[k] = [])).push(it); }
  }
}
function itemsNear(x, z, r) {
  var out = [], c2 = ITEMS.cell, st = (itemsNear._s = (itemsNear._s || 0) + 1);
  for (var gx = Math.floor((x - r) / c2); gx <= Math.floor((x + r) / c2); gx++) for (var gz = Math.floor((z - r) / c2); gz <= Math.floor((z + r) / c2); gz++) {
    var L = ITEMS.grid[gx + ',' + gz]; if (!L) continue;
    for (var i = 0; i < L.length; i++) if (L[i]._s !== st) { L[i]._s = st; out.push(L[i]); }
  }
  return out;
}
// 人がぶつかる・乗れる物（重い物だけ）
function itemSolidsNear(x, z, r) {
  var L = itemsNear(x, z, r + 1), out = [];
  for (var i = 0; i < L.length; i++) { var b = L[i].body; if ((effMass(b) < 2.5 && !b.fixed) || netPassThrough(L[i])) continue; out.push({ x0: b.pos.x - b.ex, x1: b.pos.x + b.ex, y0: b.pos.y - b.ey, y1: b.pos.y + b.ey, z0: b.pos.z - b.ez, z1: b.pos.z + b.ez, item: L[i] }); }
  return out;
}
function wake(it) { if (it && it.body) { it.body.sleep = false; it.body.sleepT = 0; } }
function physStep(dt) {
  var weird = G.stage, gmul = (G.slowT > 0 ? 0.25 : 1) * (weird >= 8 ? 0.7 + 0.3 * Math.sin(G.t * 0.7) : 1);
  var rest0 = weird >= 5 ? 0.55 : 0.3;
  for (var i = 0; i < ITEMS.list.length; i++) {
    var it = ITEMS.list[i], b = it.body; if (it.gone || it === ITEMS.held || b.fixed || (it.heldBy && NET.peers[it.heldBy])) continue;
    if (b.thrownT > 0) b.thrownT -= dt;
    if (b.sleep) continue;
    var tdt = G.slowT > 0 ? dt * 0.3 : dt;
    // 重力・汚染による変な動き
    var gy = -PHYS.g * gmul;
    if (weird >= 6 && (it.id % 7 === 0)) gy *= -0.15; // ふわふわ浮く物
    b.vel.y += gy * tdt;
    if (weird >= 4 && Math.random() < 0.002 * weird) { b.vel.x += rand(-2, 2); b.vel.y += rand(1, 3); b.av.y += rand(-5, 5); }
    if (G.magnetT > 0) { var dx = P.pos.x - b.pos.x, dz = P.pos.z - b.pos.z, d = Math.hypot(dx, dz); if (d < 10 && d > 1.2 && effMass(b) < 6) { b.vel.x += dx / d * 18 * tdt; b.vel.z += dz / d * 18 * tdt; } }
    // 水に浮く
    if (b.pos.z > RIVER.z0 && b.pos.z < RIVER.z3 && b.pos.y < RIVER.water && b.pos.z < 300) { var dens = effMass(b) / Math.max(0.01, 8 * b.ex * b.ey * b.ez); b.vel.y += (dens < 0.6 ? 22 : 6) * tdt; b.vel.x *= 0.98; b.vel.z *= 0.98; b.vel.z += (G.stage >= 5 ? -0.4 : 0.4) * tdt * 0; b.vel.x += 0.6 * tdt; }
    b.pos.x += b.vel.x * tdt; b.pos.y += b.vel.y * tdt; b.pos.z += b.vel.z * tdt;
    b.yaw += b.av.y * tdt; b.rx += b.av.x * tdt; b.rz += b.av.z * tdt;
    bodyExt(b);
    b.onGround = false;
    // 町（動かない箱）との当たり
    var L = colQuery(b.pos.x, b.pos.z, Math.max(b.ex, b.ez) + 0.3);
    for (var j = 0; j < L.length; j++) resolveStatic(b, L[j]);
    var ty = terrainY(b.pos.x, b.pos.z);
    if (b.pos.y - b.ey < ty) { b.pos.y = ty + b.ey; landBody(b, rest0); }
    // ほかの物
    var N = itemsNear(b.pos.x, b.pos.z, Math.max(b.ex, b.ez) + 0.5);
    for (j = 0; j < N.length; j++) { var o = N[j]; if (o === it || o.gone || o === ITEMS.held) continue; resolvePair(it, o); }
    // 人に蹴られる（軽い物）
    if (effMass(b) < 2.5) kickBy(b, P.pos, P.vel, P.r + 0.05, P.bodyH);
    // 転がる・倒れる
    var spd = Math.hypot(b.vel.x, b.vel.z);
    if (b.onGround) {
      var fr = Math.exp(-tdt * (b.roll ? 1.2 : 6)); b.vel.x *= fr; b.vel.z *= fr;
      b.av.x *= Math.exp(-tdt * 6); b.av.z *= Math.exp(-tdt * 6); b.av.y *= Math.exp(-tdt * 4);
      if (!b.roll && Math.abs(b.av.x) + Math.abs(b.av.z) < 1.5) { // いちばん近い「立つ・寝る」向きに落ち着く
        var tx = Math.round(b.rx / (PI / 2)) * (PI / 2), tz = Math.round(b.rz / (PI / 2)) * (PI / 2);
        b.rx += (tx - b.rx) * Math.min(1, tdt * 8); b.rz += (tz - b.rz) * Math.min(1, tdt * 8);
      }
      if (b.roll) b.rollA += spd / Math.max(0.1, b.ey) * tdt;
      if (spd < 0.06 && Math.abs(b.vel.y) < 0.2 && Math.abs(b.av.y) < 0.2) { b.sleepT += tdt; if (b.sleepT > 0.6) { b.sleep = true; b.vel.set(0, 0, 0); b.av.set(0, 0, 0); } }
      else b.sleepT = 0;
    } else { b.vel.x *= Math.exp(-tdt * 0.1); b.vel.z *= Math.exp(-tdt * 0.1); }
  }
}
function landBody(b, rest) {
  if (b.vel.y < 0) {
    var v = -b.vel.y;
    b.vel.y = v > 2.5 ? v * (b.bouncy || rest) : 0;
    if (v > 4) { b.av.x += rand(-1, 1) * v * (b.roll ? 0 : 0.6); b.av.z += rand(-1, 1) * v * (b.roll ? 0 : 0.6); if (b.it) itemImpact(b.it, v); }
  }
  b.onGround = true;
}
function resolveStatic(b, s) {
  var ox = Math.min(b.pos.x + b.ex - s.x0, s.x1 - (b.pos.x - b.ex)), oy = Math.min(b.pos.y + b.ey - s.y0, s.y1 - (b.pos.y - b.ey)), oz = Math.min(b.pos.z + b.ez - s.z0, s.z1 - (b.pos.z - b.ez));
  if (ox <= 0 || oy <= 0 || oz <= 0) return;
  var cy = (s.y0 + s.y1) / 2;
  if (oy <= ox && oy <= oz) {
    if (b.pos.y > cy) { b.pos.y += oy; landBody(b, 0.3); } else { b.pos.y -= oy; if (b.vel.y > 0) b.vel.y = 0; }
  } else if (ox <= oz) { var sx = b.pos.x > (s.x0 + s.x1) / 2 ? 1 : -1; b.pos.x += ox * sx; if (b.vel.x * sx < 0) { b.vel.x = -b.vel.x * 0.35; if (b.it && Math.abs(b.vel.x) > 3) itemImpact(b.it, Math.abs(b.vel.x)); } }
  else { var sz = b.pos.z > (s.z0 + s.z1) / 2 ? 1 : -1; b.pos.z += oz * sz; if (b.vel.z * sz < 0) { b.vel.z = -b.vel.z * 0.35; if (b.it && Math.abs(b.vel.z) > 3) itemImpact(b.it, Math.abs(b.vel.z)); } }
}
function resolvePair(ia, ib) {
  var a = ia.body, b = ib.body;
  var ox = Math.min(a.pos.x + a.ex - (b.pos.x - b.ex), b.pos.x + b.ex - (a.pos.x - a.ex));
  var oy = Math.min(a.pos.y + a.ey - (b.pos.y - b.ey), b.pos.y + b.ey - (a.pos.y - a.ey));
  var oz = Math.min(a.pos.z + a.ez - (b.pos.z - b.ez), b.pos.z + b.ez - (a.pos.z - a.ez));
  if (ox <= 0 || oy <= 0 || oz <= 0) return;
  // 合成チェック（投げた・置いた直後にぶつかった時）
  var rel = Math.hypot(a.vel.x - b.vel.x, a.vel.y - b.vel.y, a.vel.z - b.vel.z);
  if ((a.thrownT > 0 || b.thrownT > 0) && tryCombine(ia, ib, rel)) return;
  var ma = b.fixed ? 0 : 1 / effMass(a), mb = (b.sleep && effMass(b) > effMass(a) * 3) || b.fixed ? 0 : 1 / effMass(b), sum = ma + mb; if (sum <= 0) return;
  if (oy <= ox && oy <= oz) {
    var up = a.pos.y > b.pos.y ? 1 : -1;
    a.pos.y += oy * up * (ma / sum); b.pos.y -= oy * up * (mb / sum);
    var top = up > 0 ? a : b, bot = up > 0 ? b : a;
    if (top.vel.y < bot.vel.y) { var v = bot.vel.y - top.vel.y; top.vel.y = bot.vel.y + (v > 3 ? v * 0.25 : 0); if (v > 4 && top.it) itemImpact(top.it, v); }
    top.onGround = true;
    // 上の物は下の物と一緒に動く（摩擦）
    top.vel.x += (bot.vel.x - top.vel.x) * 0.3; top.vel.z += (bot.vel.z - top.vel.z) * 0.3;
    if (mb > 0 && up > 0 && v > 1) wake(ib);
  } else if (ox <= oz) {
    var sx = a.pos.x > b.pos.x ? 1 : -1; a.pos.x += ox * sx * (ma / sum); b.pos.x -= ox * sx * (mb / sum);
    var rv = a.vel.x - b.vel.x; if (rv * sx < 0) { var j = -(1.35) * rv / sum; a.vel.x += j * ma; b.vel.x -= j * mb; if (Math.abs(rv) > 1) wake(ib); }
  } else {
    var sz = a.pos.z > b.pos.z ? 1 : -1; a.pos.z += oz * sz * (ma / sum); b.pos.z -= oz * sz * (mb / sum);
    var rz = a.vel.z - b.vel.z; if (rz * sz < 0) { var j2 = -(1.35) * rz / sum; a.vel.z += j2 * ma; b.vel.z -= j2 * mb; if (Math.abs(rz) > 1) wake(ib); }
  }
}
function kickBy(b, pos, vel, r, h) {
  if (b.pos.y - b.ey > pos.y + h || b.pos.y + b.ey < pos.y) return;
  var dx = b.pos.x - pos.x, dz = b.pos.z - pos.z, d = Math.hypot(dx, dz), rr = r + Math.max(b.ex, b.ez);
  if (d >= rr || d < 1e-4) return;
  var push = (rr - d); b.pos.x += dx / d * push; b.pos.z += dz / d * push;
  var sp = Math.hypot(vel.x, vel.z);
  b.vel.x += dx / d * (1 + sp * 0.9); b.vel.z += dz / d * (1 + sp * 0.9); b.vel.y += sp * 0.25;
  if (b.roll) b.av.y += rand(-2, 2); else { b.av.x += rand(-3, 3); b.av.z += rand(-3, 3); }
  b.sleep = false; b.sleepT = 0;
}
// 町の外に落ちた・埋まった物を元の場所に戻す
function physRescue(dt) {
  for (var i = 0; i < ITEMS.list.length; i++) {
    var it = ITEMS.list[i], b = it.body; if (it.gone || it === ITEMS.held || b.fixed) continue;
    var out = b.pos.y < -12 || Math.abs(b.pos.x) > 150 || (b.pos.z > 160 && b.pos.z < 300) || b.pos.z < -150 || !isFinite(b.pos.x + b.pos.y + b.pos.z) || b.pos.y > 120;
    if (!out && b.sleep) {
      // 町の箱にめり込んで動けない
      var L = colQuery(b.pos.x, b.pos.z, 0.1), stuck = false;
      for (var j = 0; j < L.length; j++) { var s = L[j]; if (b.pos.x > s.x0 && b.pos.x < s.x1 && b.pos.z > s.z0 && b.pos.z < s.z1 && b.pos.y > s.y0 && b.pos.y < s.y1) { stuck = true; break; } }
      b.stuckT = stuck ? b.stuckT + dt : 0;
    }
    if (out || b.stuckT > 2) { returnHome(it); }
  }
}
function returnHome(it) {
  var b = it.body; b.pos.copy(it.home); b.pos.x += rand(-0.5, 0.5); b.pos.z += rand(-0.5, 0.5); b.pos.y += 1.2; b.vel.set(0, 0, 0); b.av.set(0, 0, 0); b.rx = b.rz = 0; b.stuckT = 0; wake(it);
  if (it.temp) { removeItem(it); return; }
  if (P.pos.distanceTo(b.pos) < 30) sysMsg(itemName(it) + 'が　元の場所に　もどってきました。');
}
