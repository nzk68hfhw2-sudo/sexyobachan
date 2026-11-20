// ---- 大暴れ：こわせる町・破片・手ごたえ・迷惑ポイント ---------------------------------------------
// ★あとから調整できる数字は、ここ（TUNE）にまとめてあります。
var TUNE = {
  walkSpeed: 5.2,     // 歩く速さ（スティックを少したおした時）
  runSpeed: 10.5,     // 走る速さ（大きくたおす／走るボタン／Shift）
  respawn: 40,        // こわれた物が「ポンッ」と元に戻るまでの秒
  respawnBig: 25,     // 建物は、さらにこの秒数だけ長くかかる
  comboTime: 3.0,     // コンボがつながる秒（強化で長くなる）
  comboStep: 5,       // この HIT 数ごとに、ポイントの倍率が上がる
  comboMulStep: 0.5,  // 倍率の上がる量
  comboMulMax: 8,     // 倍率の上限
  dmgMul: 1,          // こわれやすさ（大きいほど、少ない攻撃でこわれる）
  throwPow: 1.25,     // 投げる強さ（倍）
  tacklePow: 1,       // 体当たりの強さ（倍）
  tackleSpeed: 15,    // 体当たりの速さ
  tackleTime: 0.32,   // 体当たりの長さ（秒）
  tackleCd: 0.4,      // 体当たりの待ち時間（秒）
  flyPow: 1,          // 住人や物の飛ぶ強さ（倍）
  pointMul: 1,        // 迷惑ポイントの倍率
  yenMul: 1,          // 被害額の倍率
  polPerPoint: 0.005, // 迷惑ポイント１点あたりに上がる汚染率（％）
  hitstop: 1, shake: 1, slow: 1, // 手ごたえ（止め・ゆれ・スロー）の強さ（倍）
  debris: 1,          // 破片の数（倍）
  mobs: 24, mobsLite: 8, // 色ちがいの住人の数（ふつう／軽量モード）
  crowdRange: 45      // やじ馬が集まってくる距離
};
// ---- 手ごたえ（ヒットストップ・ゆれ・カメラの引き・スロー・振動） ----
var FEEL = { stop: 0, shake: 0, slow: 0, kick: 0, vib: true, t: 0 };
var FEEL_TAB = { stop: [0.035, 0.06, 0.09, 0.13], shake: [0.05, 0.12, 0.24, 0.42], slow: [0, 0, 0.35, 0.8], kick: [0, 0.25, 0.8, 1.6], vib: [12, 22, 40, 70] };
function feel(lv, mul) {
  lv = clamp(lv | 0, 0, 3); mul = mul || 1; var red = REDUCED.on;
  FEEL.stop = Math.max(FEEL.stop, FEEL_TAB.stop[lv] * TUNE.hitstop * (red ? 0.5 : 1) * mul);
  FEEL.shake = Math.max(FEEL.shake, FEEL_TAB.shake[lv] * TUNE.shake * (red ? 0.25 : 1) * mul);
  if (!red) FEEL.slow = Math.max(FEEL.slow, FEEL_TAB.slow[lv] * TUNE.slow);
  FEEL.kick = Math.max(FEEL.kick, FEEL_TAB.kick[lv] * (red ? 0.4 : 1));
  if (FEEL.vib && navigator.vibrate) { try { navigator.vibrate(FEEL_TAB.vib[lv]); } catch (e) {} }
}
// 時間の進み方（止め・スロー）
function feelTime(raw, dt) {
  FEEL.t += raw;
  if (FEEL.kick > 0) FEEL.kick = Math.max(0, FEEL.kick - raw * 1.6);
  if (FEEL.stop > 0) { FEEL.stop -= raw; return dt * 0.04; }
  if (FEEL.slow > 0) { FEEL.slow -= raw; return dt * 0.4; }
  return dt;
}
function feelCamera(raw) {
  if (FEEL.shake < 0.003 || G.inMenu) { FEEL.shake = 0; return; }
  var t = FEEL.t * 40, s = FEEL.shake, c = R.camera;
  c.position.x += Math.sin(t * 1.3) * s; c.position.y += Math.sin(t * 1.7 + 1) * s * 0.8; c.position.z += Math.sin(t * 1.1 + 2) * s;
  FEEL.shake *= Math.exp(-raw * 7);
}
// ---- 当たり判定の上面（破片・住人の着地用。配列を作らない） ----
function colTop(x, z, y) {
  var top = terrainY(x, z), L = COL.grid[Math.floor(x / COL.cell) + ',' + Math.floor(z / COL.cell)];
  if (L) for (var i = 0; i < L.length; i++) { var b = L[i]; if (b.off) continue; if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.y1 <= y + 0.35 && b.y1 > top) top = b.y1; }
  return top;
}
// ===== こわせる物の記録（町を作る時に、まとめ描画を別にして範囲を覚える） =====
var BRK = { list: [], grid: {}, cell: 8, rec: null, bb: null, meshes: {}, anim: [], broken: [], dirty: {}, q: [], qs: 0 };
function BK(o, fn) { if (BRK.rec || !o) { fn(); return; } brkBegin(o); try { fn(); } finally { brkEnd(); } }
function brkBegin(o) {
  if (!BRK.bb) BRK.bb = new Batch();
  var s = {}; for (var k in BRK.bb.g) { var g2 = BRK.bb.g[k]; s[k] = { v: g2.p.length / 3, i: g2.i.length }; }
  BRK.rec = { o: o, s: s, cols: [], B0: B }; B = BRK.bb;
}
function brkEnd() {
  var r = BRK.rec; BRK.rec = null; B = r.B0;
  var ranges = [];
  for (var k in BRK.bb.g) { var g2 = BRK.bb.g[k], a = r.s[k] || { v: 0, i: 0 }, v1 = g2.p.length / 3; if (v1 > a.v) ranges.push({ key: k, v0: a.v, v1: v1, i0: a.i, i1: g2.i.length }); }
  var o = r.o, b = { id: BRK.list.length, n: o.n, mat: o.mat || 'concrete', mode: o.mode || 'shatter', hp: o.hp || 1.5, maxhp: o.hp || 1.5, yen: o.yen || 10000, pts: o.pts, cls: o.cls, spill: o.spill, ranges: ranges, cols: r.cols, broken: false, t: 0, stage: 0 };
  r.cols.forEach(function (c) { c.brk = b; });
  BRK.list.push(b); return b;
}
// 看板など、ふつうの3Dの形をこわせる物にする
function brkAddObj(obj, o) {
  obj.updateMatrixWorld(true);
  var bx = new THREE.Box3().setFromObject(obj); if (!isFinite(bx.min.x)) return null;
  var b = { id: BRK.list.length, n: o.n, mat: o.mat || 'glass', mode: 'shatter', hp: o.hp || 0.6, maxhp: o.hp || 0.6, yen: o.yen || 150000, pts: o.pts, cls: o.cls, obj: obj, ranges: [], cols: [], broken: false, t: 0, stage: 0, col: new THREE.Color(o.color || 0xffffff) };
  b.box = { x0: bx.min.x - 0.1, y0: bx.min.y, z0: bx.min.z - 0.1, x1: bx.max.x + 0.1, y1: bx.max.y, z1: bx.max.z + 0.1 };
  brkFinishOne(b); BRK.list.push(b); brkGridAdd(b); return b;
}
function brkBuild(scene) {
  if (!BRK.bb) return;
  var ms = BRK.bb.build(scene, MATS);
  ms.forEach(function (m) { BRK.meshes[m.name.replace(/^batch_/, '')] = m; m.name = 'brk_' + m.name; });
  BRK.list.forEach(function (b) {
    if (b.obj) return;
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], cr = 0, cg = 0, cb = 0, cn = 0;
    b.ranges.forEach(function (r) {
      var m = BRK.meshes[r.key], pa = m.geometry.attributes.position.array, ca = m.geometry.attributes.color.array;
      r.op = pa.slice(r.v0 * 3, r.v1 * 3); r.oc = ca.slice(r.v0 * 3, r.v1 * 3);
      for (var i = 0; i < r.op.length; i += 3) { for (var a = 0; a < 3; a++) { var v = r.op[i + a]; if (v < mn[a]) mn[a] = v; if (v > mx[a]) mx[a] = v; } }
      for (i = 0; i < r.oc.length; i += 9) { cr += r.oc[i]; cg += r.oc[i + 1]; cb += r.oc[i + 2]; cn++; }
    });
    if (mn[0] > mx[0]) { mn = [0, 0, 0]; mx = [0.1, 0.1, 0.1]; }
    b.box = { x0: mn[0], y0: mn[1], z0: mn[2], x1: mx[0], y1: mx[1], z1: mx[2] };
    b.col = new THREE.Color(cn ? cr / cn : 0.7, cn ? cg / cn : 0.7, cn ? cb / cn : 0.7); b.col.convertLinearToSRGB();
    brkFinishOne(b); brkGridAdd(b);
  });
}
function brkFinishOne(b) {
  var x = b.box; b.piv = new THREE.Vector3((x.x0 + x.x1) / 2, x.y0, (x.z0 + x.z1) / 2); b.c = new THREE.Vector3((x.x0 + x.x1) / 2, (x.y0 + x.y1) / 2, (x.z0 + x.z1) / 2);
  b.w = x.x1 - x.x0; b.d = x.z1 - x.z0; b.h = x.y1 - x.y0; var sz = Math.max(b.w, b.d, b.h);
  if (b.cls == null) b.cls = sz < 2.6 ? 0 : sz < 7 ? 1 : sz < 20 ? 2 : 3;
  if (b.pts == null) b.pts = [10, 30, 250, 1200][b.cls];
}
function brkGridAdd(b) {
  var c = BRK.cell, x = b.box;
  for (var gx = Math.floor(x.x0 / c); gx <= Math.floor(x.x1 / c); gx++) for (var gz = Math.floor(x.z0 / c); gz <= Math.floor(x.z1 / c); gz++) { var k = gx + ',' + gz; (BRK.grid[k] || (BRK.grid[k] = [])).push(b); }
}
// この箱に重なる、こわせる物
function brkQuery(x0, y0, z0, x1, y1, z1) {
  var c = BRK.cell, out = BRK.q, st = ++BRK.qs; out.length = 0;
  for (var gx = Math.floor(x0 / c); gx <= Math.floor(x1 / c); gx++) for (var gz = Math.floor(z0 / c); gz <= Math.floor(z1 / c); gz++) {
    var L = BRK.grid[gx + ',' + gz]; if (!L) continue;
    for (var i = 0; i < L.length; i++) { var b = L[i]; if (b._qs === st || b.broken) continue; b._qs = st; var X = b.box; if (X.x1 < x0 || X.x0 > x1 || X.y1 < y0 || X.y0 > y1 || X.z1 < z0 || X.z0 > z1) continue; out.push(b); }
  }
  return out;
}
function boxDist(X, x, y, z) { var dx = Math.max(X.x0 - x, 0, x - X.x1), dy = Math.max(X.y0 - y, 0, y - X.y1), dz = Math.max(X.z0 - z, 0, z - X.z1); return Math.sqrt(dx * dx + dy * dy + dz * dz); }
// ---- まとめ描画の書きかえ（こわれた部分を消す・戻す・ひびを入れる） ----
function brkDirty(m, v0, v1, col) { var d = BRK.dirty[m.name] || (BRK.dirty[m.name] = { m: m, a: 1e9, b: -1, c: false }); d.a = Math.min(d.a, v0); d.b = Math.max(d.b, v1); if (col) d.c = true; }
function brkFlush() {
  for (var k in BRK.dirty) {
    var d = BRK.dirty[k], ga = d.m.geometry.attributes;
    ga.position.updateRange.offset = d.a * 3; ga.position.updateRange.count = (d.b - d.a) * 3; ga.position.needsUpdate = true;
    if (d.c) { ga.color.updateRange.offset = d.a * 3; ga.color.updateRange.count = (d.b - d.a) * 3; ga.color.needsUpdate = true; }
  }
  BRK.dirty = {};
}
function brkHideMesh(b) {
  if (b.obj) { b.obj.visible = false; return; }
  b.ranges.forEach(function (r) { var m = BRK.meshes[r.key], pa = m.geometry.attributes.position.array; for (var i = r.v0 * 3; i < r.v1 * 3; i += 3) { pa[i] = b.c.x; pa[i + 1] = b.c.y; pa[i + 2] = b.c.z; } brkDirty(m, r.v0, r.v1); });
}
function brkShowMesh(b) {
  if (b.obj) { b.obj.visible = true; b.obj.scale.setScalar(1); return; }
  b.ranges.forEach(function (r) { var m = BRK.meshes[r.key], ga = m.geometry.attributes; ga.position.array.set(r.op, r.v0 * 3); ga.color.array.set(r.oc, r.v0 * 3); brkDirty(m, r.v0, r.v1, true); });
}
function brkCrack(b) {
  b.ranges.forEach(function (r) { var m = BRK.meshes[r.key], ca = m.geometry.attributes.color.array; for (var i = 0; i < r.oc.length; i += 3) { var v = (i / 3 + r.v0) | 0, k = 0.62 + 0.3 * ((Math.sin(v * 12.9898) * 43758.5453) % 1 + 1) % 1; ca[r.v0 * 3 + i] = r.oc[i] * k; ca[r.v0 * 3 + i + 1] = r.oc[i + 1] * k; ca[r.v0 * 3 + i + 2] = r.oc[i + 2] * k; } brkDirty(m, r.v0, r.v1, true); });
}
// こわれる演出の間だけ使う、単独の形
function brkTemp(b) {
  var g = new THREE.Group(); g.position.copy(b.piv);
  if (b.obj) return null;
  b.ranges.forEach(function (r) {
    var m = BRK.meshes[r.key], ga = m.geometry.attributes, n = r.v1 - r.v0, geo = new THREE.BufferGeometry(), p = r.op.slice();
    for (var i = 0; i < p.length; i += 3) { p[i] -= b.piv.x; p[i + 1] -= b.piv.y; p[i + 2] -= b.piv.z; }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(ga.normal.array.slice(r.v0 * 3, r.v1 * 3), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(ga.uv.array.slice(r.v0 * 2, r.v1 * 2), 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(ga.color.array.slice(r.v0 * 3, r.v1 * 3), 3));
    var ia = m.geometry.index.array, idx = new (n > 65535 ? Uint32Array : Uint16Array)(r.i1 - r.i0);
    for (i = 0; i < idx.length; i++) idx[i] = ia[r.i0 + i] - r.v0;
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    var mm = new THREE.Mesh(geo, m.material); mm.castShadow = true; mm.receiveShadow = true; mm.userData.base = p; g.add(mm);
  });
  R.scene.add(g); return g;
}
function brkDropTemp(b) { if (b.g) { R.scene.remove(b.g); b.g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); b.g = null; } }
function colsOn(b, on) { b.cols.forEach(function (c) { c.off = !on; }); }
// ---- こわれる物に当てる ----
function brkHit(b, dmg, dx, dz, src) {
  if (b.broken || b.pop) return false;
  src = src || {};
  if (src.key) { if (b._hk === src.key && G.t - b._ht < 0.3) return false; b._hk = src.key; b._ht = G.t; }
  dmg *= TUNE.dmgMul * (src.weak ? 3 : 1);
  b.hp -= dmg;
  var p = src.p || b.c, dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  if (b.hp > 0) {
    sfx('hit_' + b.mat, smashPitch()); debBurst(p.x, p.y, p.z, b.col, 3 + b.cls * 2, b.mat === 'plant' ? 'ball' : 'box', 3); debPuff(p.x, p.y, p.z, 1, 0.4);
    feel(0, 0.6); if (!src.net && !src.quiet) smashEvent('hit', 1 + b.cls * 2, Math.round(b.yen * 0.04 * Math.min(1, dmg / b.maxhp)), src, b.n);
    if (b.mode === 'crumble') brkStage(b, dx, dz);
    return false;
  }
  brkBreak(b, dx, dz, src);
  return true;
}
function brkStage(b, dx, dz) {
  var f = b.hp / b.maxhp;
  if (f < 0.66 && b.stage < 1) { b.stage = 1; brkCrack(b); sfx('crack'); debPuff(b.c.x, b.box.y0 + 1, b.c.z, 4, b.w * 0.3); feel(1, 0.6); }
  if (f < 0.33 && b.stage < 2) {
    b.stage = 2; brkHideMesh(b); b.g = brkTemp(b);
    BRK.anim.push({ b: b, kind: 'wobble', t: 0, axis: new THREE.Vector3(dz, 0, -dx) });
    sfx('crack', -5); sfx('rumble'); feel(1);
  }
}
function brkBreak(b, dx, dz, src) {
  src = src || {};
  b.broken = true; b.t = 0; b.hp = 0; colsOn(b, false); BRK.broken.push(b);
  var dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  if (!src.net) smashNetQ('bk', { i: b.id, x: Math.round(dx * 100) / 100, z: Math.round(dz * 100) / 100 });
  var near = P.pos.distanceTo(b.c) < 60;
  // 上に乗っていた物は落ちる
  itemsNear(b.c.x, b.c.z, Math.max(b.w, b.d) * 0.5 + 1).forEach(function (it) { if (it.body.pos.y > b.box.y0 + 0.3) wake(it); });
  if (near) { feel(b.cls); sfx('brk_' + b.mat, smashPitch()); if (b.cls >= 2) sfx('rumble'); }
  var n = Math.round((6 + b.cls * 10) * TUNE.debris), cx = b.c.x, cy = b.c.y, cz = b.c.z;
  var axis = new THREE.Vector3(dz, 0, -dx);
  var mode = b.mode;
  if (mode === 'shatter' || b.obj) {
    brkHideMesh(b);
    debBurst(cx, cy, cz, b.mat === 'glass' ? GLASS_COL : b.col, n + 6, b.mat === 'glass' ? 'shard' : 'box', 6, dx, dz);
    if (b.mat !== 'glass') debBurst(cx, cy, cz, b.col, 6, 'shard', 5, dx, dz);
    debPuff(cx, cy, cz, 3 + b.cls * 2, Math.max(b.w, b.d) * 0.4);
  } else if (mode === 'crumble') {
    if (!b.g) { brkHideMesh(b); b.g = brkTemp(b); }
    BRK.anim = BRK.anim.filter(function (a) { return a.b !== b; });
    BRK.anim.push({ b: b, kind: 'crumble', t: 0, axis: axis, floors: clamp(Math.round(b.h / 3.2), 2, 5), k: 0, dx: dx, dz: dz });
    debBurst(cx, cy, cz, b.col, n, 'box', 5, dx, dz);
  } else {
    brkHideMesh(b); b.g = brkTemp(b);
    BRK.anim.push({ b: b, kind: mode === 'bend' ? 'bend' : 'fall', t: 0, axis: axis, ang: 0, av: mode === 'bend' ? 1.2 : 0.8, max: PI / 2 - (mode === 'bend' ? 0.25 : 0.05), dx: dx, dz: dz, landed: 0 });
    debBurst(cx, b.box.y0 + 0.6, cz, b.col, Math.ceil(n * 0.6), b.mat === 'plant' ? 'ball' : 'box', 4, dx, dz);
  }
  if (b.spill) spillOut(b.spill, cx, b.box.y0 + Math.min(b.h, 2) * 0.6, cz, 8 + b.cls * 8, dx, dz);
  if (b.cls >= 2) { debPuff(cx, b.box.y0 + 0.5, cz, 10, Math.max(b.w, b.d) * 0.55); confetti3D(cx, b.box.y1, cz, 10); }
  if (!src.net) smashEvent('break', b.pts, b.yen, src, b.n, b.cls);
  // 近くの住人は巻きこまれる
  if (typeof npcBlast === 'function') npcBlast(b.c, Math.max(2, Math.max(b.w, b.d) * 0.6), 3 + b.cls * 2, { kind: 'chain', key: 'b' + b.id }, true);
  if (b.wires) brkWires(b, false);
  if (b.cls >= 2 && near && !src.net) popWABig(b.n + pick(['　崩壊!!', '　ドーン!!', '　ぺしゃんこ', '　さようなら']), { style: pick([0, 3, 5, 10, 12]), size: 54, x: 0.5, y: (portrait() ? 0.33 : 0.22) - 0.07, maxH: 38, w: 0.75, anim: REDUCED.on ? 'waSoft' : 'waPop', dur: 1.4, lim: 2, silent: true });
  if (typeof onSmashBreak === 'function') onSmashBreak(b, src);
}
// 電柱がこわれたら電線も消す
function brkWires(b, on) {
  var g = WORLD.wireGeo; if (!g) return; var pa = g.attributes.position.array, o = WORLD.wireOrig;
  b.wires.forEach(function (w) { for (var i = w[0] * 3; i < w[1] * 3; i += 3) { if (on) { pa[i] = o[i]; pa[i + 1] = o[i + 1]; pa[i + 2] = o[i + 2]; } else { pa[i + 1] = -50; } } });
  g.attributes.position.needsUpdate = true;
}
var GLASS_COL = null, ITEM_COL = null, PUFF_COL = null;
function brkPop(b, quick) {
  BRK.anim = BRK.anim.filter(function (a) { return a.b !== b; });
  brkDropTemp(b);
  b.broken = false; b.hp = b.maxhp; b.stage = 0; b.t = 0;
  var i = BRK.broken.indexOf(b); if (i >= 0) BRK.broken.splice(i, 1);
  colsOn(b, true);
  if (b.wires) brkWires(b, true);
  if (quick || P.pos.distanceTo(b.c) > 70) { brkShowMesh(b); return; }
  if (b.obj) { brkShowMesh(b); b.obj.scale.setScalar(0.01); BRK.anim.push({ b: b, kind: 'popObj', t: 0 }); }
  else { brkShowMesh(b); brkHideMesh(b); b.g = brkTemp(b); b.g.scale.setScalar(0.01); b.pop = true; BRK.anim.push({ b: b, kind: 'pop', t: 0 }); }
  sfx('pon'); debStars(b.c.x, b.box.y1, b.c.z, 6);
}
function brkInside(b, x, y, z, m) { var X = b.box; return x > X.x0 - m && x < X.x1 + m && z > X.z0 - m && z < X.z1 + m && y > X.y0 - 2 && y < X.y1 + 1; }
function brkResetAll() {
  var n = 0;
  BRK.broken.slice().forEach(function (b) { if (brkInside(b, P.pos.x, P.pos.y, P.pos.z, 0.6)) return; brkPop(b, P.pos.distanceTo(b.c) > 25); n++; });
  ITEMS.list.forEach(function (it) { if (it.broken) { itemRestore(it); n++; } });
  return n;
}
// ---- こわれる動き ----
var _q1 = null, _v1 = null;
function brkAnimUpdate(dt) {
  if (!_q1) { _q1 = new THREE.Quaternion(); _v1 = new THREE.Vector3(); }
  for (var i = BRK.anim.length - 1; i >= 0; i--) {
    var a = BRK.anim[i], b = a.b, g = b.g, done = false; a.t += dt;
    if (a.kind === 'wobble') {
      if (!g) { done = true; } else { var w = 0.035 + Math.sin(a.t * 9) * 0.02 * Math.exp(-a.t * 2); g.quaternion.setFromAxisAngle(a.axis, w); }
      if (b.broken) done = true;
    } else if (a.kind === 'fall' || a.kind === 'bend') {
      if (!g) { done = true; } else if (a.landed < 2) {
        a.av += (3 + a.ang * 9) * dt; a.ang += a.av * dt;
        if (a.ang >= a.max) {
          a.ang = a.max; if (!a.landed) { brkLand(a); } a.landed++; a.av = -a.av * 0.22; if (a.landed >= 2) a.ang = a.max;
        }
        if (a.kind === 'fall') g.quaternion.setFromAxisAngle(a.axis, a.ang);
        else brkBendMesh(g, a.axis, a.ang, b.h * 0.3);
      } else done = true;
    } else if (a.kind === 'crumble') {
      if (!g) { done = true; } else {
        var step = 0.42, F = a.floors, k = Math.min(F, Math.floor(a.t / step) + 1);
        if (k > a.k) {
          a.k = k; var hy = b.box.y0 + b.h * (1 - k / F) + 0.5;
          debPuff(b.c.x, hy, b.c.z, 6, Math.max(b.w, b.d) * 0.55); debBurst(b.c.x, hy + 1, b.c.z, b.col, 10, 'box', 4, a.dx, a.dz);
          if (P.pos.distanceTo(b.c) < 70) { sfx('crumble', -k * 2); feel(Math.min(2, b.cls), 0.7); }
          if (typeof npcBlast === 'function') npcBlast(b.c, Math.max(b.w, b.d) * 0.6 + 2, 4, { kind: 'chain', key: 'b' + b.id }, true);
        }
        var ty = Math.max(0.06, 1 - k / F * 0.94); g.scale.y += (ty - g.scale.y) * Math.min(1, dt * 14);
        g.quaternion.setFromAxisAngle(a.axis, 0.04 + 0.05 * (k / F));
        if (a.t > step * F + 0.6) { g.scale.y = 0.06; done = true; }
      }
    } else if (a.kind === 'pop') {
      var s = easeBack(Math.min(1, a.t / 0.38)); if (g) g.scale.setScalar(Math.max(0.01, s));
      if (a.t >= 0.38) { brkDropTemp(b); brkShowMesh(b); b.pop = false; done = true; }
    } else if (a.kind === 'popObj') {
      b.obj.scale.setScalar(Math.max(0.01, easeBack(Math.min(1, a.t / 0.38)))); if (a.t >= 0.38) { b.obj.scale.setScalar(1); done = true; }
    }
    if (done) BRK.anim.splice(i, 1);
  }
}
function easeBack(t) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function brkBendMesh(g, axis, ang, yb) {
  g.children.forEach(function (m) {
    var base = m.userData.base, pa = m.geometry.attributes.position.array, ax = axis.x, az = axis.z;
    for (var i = 0; i < base.length; i += 3) {
      var x = base[i], y = base[i + 1], z = base[i + 2];
      if (y <= yb) { pa[i] = x; pa[i + 1] = y; pa[i + 2] = z; continue; }
      var k = Math.min(1, (y - yb) / 0.8), a = ang * k * k * (3 - 2 * k), c = Math.cos(a), s = Math.sin(a), ly = y - yb;
      // 軸 (ax,0,az) まわりの回転（Rodrigues）
      var dot = x * ax + ly * 0 + z * az, cx = 0 * z - az * ly, cy = az * x - ax * z, cz = ax * ly - 0 * x;
      pa[i] = x * c + cx * s + ax * dot * (1 - c); pa[i + 1] = ly * c + cy * s + yb; pa[i + 2] = z * c + cz * s + az * dot * (1 - c);
    }
    m.geometry.attributes.position.needsUpdate = true; m.geometry.computeBoundingSphere();
  });
}
// 倒れた先が地面に当たった：先っぽのまわりもこわれる（連鎖）
function brkLand(a) {
  var b = a.b, L = b.h * (a.kind === 'bend' ? 0.75 : 0.85), tx = b.piv.x + a.dx * L, tz = b.piv.z + a.dz * L, ty = b.piv.y + 0.4;
  debPuff(tx, ty, tz, 4, 0.8); if (P.pos.distanceTo(b.c) < 50) { sfx('thudBig'); feel(Math.min(2, b.cls), 0.6); }
  _v1.set(tx, ty, tz); smashBlast(_v1, 1.2 + b.h * 0.12, 1.4 + b.h * 0.15, { kind: 'chain', key: 'f' + b.id }, b);
  // 倒れた物の長さにそって
  for (var s = 0.3; s < 1; s += 0.35) { _v1.set(b.piv.x + a.dx * L * s, ty, b.piv.z + a.dz * L * s); smashBlast(_v1, 0.9, 1.0, { kind: 'chain', key: 'f' + b.id }, b, true); }
}
// まわりをまとめて吹き飛ばす（とくぎ・倒れた物・爆発）
function smashBlast(p, r, pw, src, self, noItems) {
  var L = brkQuery(p.x - r, p.y - r, p.z - r, p.x + r, p.y + r, p.z + r).slice();
  for (var i = 0; i < L.length; i++) { var b = L[i]; if (b === self) continue; var d = boxDist(b.box, p.x, p.y, p.z); if (d > r) continue; brkHit(b, pw * (1 - d / r * 0.5), b.c.x - p.x, b.c.z - p.z, src); }
  if (!noItems) {
    var N = itemsNear(p.x, p.z, r);
    for (i = 0; i < N.length; i++) { var it = N[i], bb = it.body; if (it === ITEMS.held || it.broken || bb.fixed) continue; var dx = bb.pos.x - p.x, dz = bb.pos.z - p.z, dd = Math.hypot(dx, dz); if (dd > r) continue; var k = (1 - dd / r) * (5 + pw * 2.5) * TUNE.flyPow / Math.sqrt(Math.max(1, effMass(bb))); bb.vel.x += dx / (dd || 1) * k; bb.vel.z += dz / (dd || 1) * k; bb.vel.y += k * 0.7 + 2; bb.av.set(rand(-6, 6), rand(-6, 6), rand(-6, 6)); bb.thrownT = 1; wake(it); itemHit(it, pw * (1 - dd / r), dx, dz, src); }
  }
  if (typeof npcBlast === 'function') npcBlast(p, r * 1.2, 4 + pw * 2, src);
}
// ===== 重い物（自販機・ポストなど）もこわれる =====
var ITEM_BRK = {
  vend: { hp: 2.4, mat: 'metal', spill: 'can', yen: 850000, cls: 1 }, ticket: { hp: 2, mat: 'metal', spill: 'kippu', yen: 1200000, cls: 1 },
  trash: { hp: 0.9, mat: 'metal', spill: 'trash', yen: 15000 }, phone: { hp: 1.2, mat: 'glass', spill: 'coin', yen: 300000 },
  timetable: { hp: 0.9, mat: 'metal', spill: 'paper', yen: 40000 }, register: { hp: 1, mat: 'metal', spill: 'coin', yen: 200000 },
  gacha: { hp: 1.3, mat: 'glass', spill: 'capsule', yen: 250000 }, tv: { hp: 0.9, mat: 'glass', spill: 'box', yen: 120000 },
  oldtv: { hp: 1.2, mat: 'glass', spill: 'box', yen: 60000 }, fridge: { hp: 2, mat: 'metal', spill: 'food', yen: 180000, cls: 1 },
  washer: { hp: 1.8, mat: 'metal', spill: 'water', yen: 90000, cls: 1 }, mailbox: { hp: 1.8, mat: 'metal', spill: 'letter', yen: 300000, cls: 1 },
  postbox: { hp: 1.6, mat: 'metal', spill: 'letter', yen: 450000 }, hydrant: { hp: 1.8, mat: 'metal', spill: 'water', yen: 500000 },
  toilet: { hp: 1.4, mat: 'glass', spill: 'water', yen: 150000 }, mirror: { hp: 0.7, mat: 'glass', yen: 30000 },
  garapon: { hp: 1.2, mat: 'wood', spill: 'ball', yen: 80000 }, kotatsu: { hp: 1.2, mat: 'wood', spill: 'food', yen: 70000 },
  sofa: { hp: 1.4, mat: 'wood', spill: 'box', yen: 90000 }, tanuki: { hp: 1.2, mat: 'concrete', spill: 'box', yen: 60000 },
  daruma: { hp: 0.7, mat: 'paper', spill: 'paper', yen: 8000 }, roadsign: { hp: 1, mat: 'metal', yen: 70000 },
  barber: { hp: 1, mat: 'glass', yen: 90000 }, ema: { hp: 0.8, mat: 'wood', spill: 'paper', yen: 5000 }, omikuji: { hp: 0.7, mat: 'wood', spill: 'paper', yen: 9000 },
  cart: { hp: 1.8, mat: 'metal', yen: 30000 }, bike: { hp: 1.4, mat: 'metal', yen: 40000 }
};
function itemHit(it, dmg, dx, dz, src) {
  var ib = ITEM_BRK[it.type]; if (!ib || it.broken || it.gone || it === ITEMS.held || it.onHead) return false;
  src = src || {};
  if (src.key) { if (it._hk === src.key && G.t - it._ht < 0.3) return false; it._hk = src.key; it._ht = G.t; }
  if (it.hp == null) it.hp = ib.hp;
  it.hp -= dmg * TUNE.dmgMul * (src.weak ? 3 : 1);
  var p = it.body.pos;
  if (it.hp > 0) { sfx('hit_' + ib.mat, smashPitch()); debBurst(p.x, p.y, p.z, ITEM_COL, 3, 'box', 3); if (!src.quiet) smashEvent('hit', 2, Math.round(ib.yen * 0.05), src, itemName(it)); return false; }
  itemBreak(it, dx, dz, src); return true;
}
function itemBreak(it, dx, dz, src) {
  var ib = ITEM_BRK[it.type] || { mat: 'metal', yen: 10000 }, p = it.body.pos, cls = ib.cls || 0;
  it.broken = true; it.brokeT = 0; it.obj.visible = false; it.body.sleep = true; it.body.vel.set(0, 0, 0);
  if (P.pos.distanceTo(p) < 60) { feel(cls + 1 > 2 ? 2 : cls + (ib.yen > 400000 ? 1 : 0)); sfx('brk_' + ib.mat, smashPitch()); }
  var col = new THREE.Color(0xcccccc); it.obj.traverse(function (m) { if (m.isMesh && m.material && m.material.color && !col._set) { col.copy(m.material.color); col._set = 1; } });
  debBurst(p.x, p.y, p.z, ib.mat === 'glass' ? GLASS_COL : col, Math.round(14 * TUNE.debris), ib.mat === 'glass' ? 'shard' : 'box', 5, dx, dz);
  debPuff(p.x, p.y, p.z, 3, 0.6);
  if (ib.spill) spillOut(ib.spill, p.x, p.y + 0.3, p.z, 12 + cls * 10, dx, dz);
  if (ib.spill === 'can' && ITEMS.list.length < 200) for (var k = 0; k < 2; k++) { var c = spawnItem('can', p.x + rand(-0.4, 0.4), p.y + 0.4, p.z + rand(-0.4, 0.4), rand(0, TAU), { awake: true, temp: true }); c.body.vel.set(dx * rand(2, 5) + rand(-2, 2), rand(3, 6), dz * rand(2, 5) + rand(-2, 2)); }
  smashEvent('break', [12, 40][cls] + Math.round(ib.yen / 40000), ib.yen, src, itemName(it), cls);
  if (typeof npcBlast === 'function') npcBlast(p, 1.6, 3, { kind: 'chain', key: 'i' + it.id }, true);
  if (!src.net && (it.netKey || it.def)) { netKeyFor(it); smashNetQ('ib', { k: it.netKey, x: Math.round(dx * 100) / 100, z: Math.round(dz * 100) / 100 }); }
  if (typeof onSmashBreak === 'function') onSmashBreak({ n: itemName(it), cls: cls, item: it, c: p }, src);
}
function itemRestore(it) {
  var b = it.body; it.broken = false; it.hp = null; b.pos.copy(it.home); b.pos.y += b.ey + 0.05; b.vel.set(0, 0, 0); b.av.set(0, 0, 0); b.rx = b.rz = 0; wake(it);
  it.obj.visible = true; it.popT = 0.38; it.obj.scale.setScalar(0.01);
  if (P.pos.distanceTo(b.pos) < 40) { sfx('pon'); debStars(b.pos.x, b.pos.y + b.ey, b.pos.z, 5); }
}
// 動いている物が当たった時（投げた物・はね飛ばされた物）
function smashMover(it, spd) {
  var b = it.body, m = effMass(b), dmg = 0.13 * spd * Math.sqrt(Math.max(0.2, m)) * (it.npcMissile ? 1.5 : 1), hit = false;
  var src = { kind: it.npcMissile ? 'npc' : 'item', key: 'i' + it.id, air: !P.onGround && b.thrownT > 0, p: b.pos };
  var dx = b.vel.x, dz = b.vel.z;
  var L = brkQuery(b.pos.x - b.ex - 0.1, b.pos.y - b.ey - 0.1, b.pos.z - b.ez - 0.1, b.pos.x + b.ex + 0.1, b.pos.y + b.ey + 0.1, b.pos.z + b.ez + 0.1).slice();
  for (var i = 0; i < L.length; i++) { hit = true; if (brkHit(L[i], dmg, dx, dz, src)) { b.vel.multiplyScalar(0.8); } }
  var N = itemsNear(b.pos.x, b.pos.z, Math.max(b.ex, b.ez) + 0.6);
  for (i = 0; i < N.length; i++) { var o = N[i], ob = o.body; if (o === it || o.broken || !ITEM_BRK[o.type]) continue; if (Math.abs(ob.pos.x - b.pos.x) < ob.ex + b.ex + 0.1 && Math.abs(ob.pos.z - b.pos.z) < ob.ez + b.ez + 0.1 && Math.abs(ob.pos.y - b.pos.y) < ob.ey + b.ey + 0.1) { hit = true; itemHit(o, dmg, dx, dz, src); } }
  if (typeof npcHitAt === 'function' && npcHitAt(b.pos, Math.max(b.ex, b.ez) + 0.3, b.vel, spd * Math.sqrt(Math.max(0.3, m)), src)) hit = true;
  if (hit && ITEM_BRK[it.type] && dmg > 1.2) itemHit(it, dmg * 0.4, -dx, -dz, { kind: 'self', key: 's' + it.id, quiet: true });
}
// ===== 体当たり =====
function smashTackle() {
  if (G.paused || G.inMenu) return;
  if (ITEMS.held || (typeof NPCHELD !== 'undefined' && NPCHELD.n)) { IN.throwIt = true; return; }
  if (P.tackleCd > 0) return;
  var pw = smashUp('tackle');
  P.tackleT = TUNE.tackleTime; P.tackleCd = TUNE.tackleCd; P.tackleId = (P.tackleId || 0) + 1; P.tackleSp = TUNE.tackleSpeed * (1 + pw * 0.06);
  if (IN.mx || IN.mz) { /* スティックの向きへ */ var fy = CAM.yaw, wx = IN.mx * Math.cos(fy) + IN.mz * Math.sin(fy), wz = -IN.mx * Math.sin(fy) + IN.mz * Math.cos(fy); if (Math.hypot(wx, wz) > 0.3) P.face = Math.atan2(-wx, -wz); }
  else if (!IN.isTouch || true) { P.face = CAM.yaw; }
  sfx('tackle'); P.squash = -0.12;
}
var _tc = null;
function tackleUpdate(dt) {
  if (P.tackleCd > 0) P.tackleCd -= dt;
  if (!(P.tackleT > 0)) return;
  if (!_tc) { _tc = new THREE.Vector3(); _v2 = new THREE.Vector3(); }
  var fx = -Math.sin(P.face), fz = -Math.cos(P.face), s = P.scale, r = 0.95 * s;
  _tc.set(P.pos.x + fx * 0.55 * s, P.pos.y + 0.7 * s, P.pos.z + fz * 0.55 * s);
  var dmg = 2.4 * TUNE.tacklePow * (1 + smashUp('tackle') * 0.25) * (0.6 + 0.4 * s * s), src = { kind: 'tackle', key: 'tk' + P.tackleId, air: !P.onGround, p: _tc };
  var L = brkQuery(_tc.x - r, _tc.y - r, _tc.z - r, _tc.x + r, _tc.y + r, _tc.z + r).slice();
  for (var i = 0; i < L.length; i++) {
    var b = L[i]; if (boxDist(b.box, _tc.x, _tc.y, _tc.z) > r) continue;
    var broke = brkHit(b, dmg, fx, fz, src);
    if (!broke && b.cols.length && !b.broken) { P.tackleT = 0; P.vel.x = -fx * 3; P.vel.z = -fz * 3; feel(1, 0.8); sfx('thudBig'); return; }
  }
  var N = itemsNear(_tc.x, _tc.z, r + 0.6);
  for (i = 0; i < N.length; i++) {
    var it = N[i], bb = it.body; if (it === ITEMS.held || it.broken || it.onHead) continue;
    if (Math.hypot(bb.pos.x - _tc.x, bb.pos.z - _tc.z) > r + Math.max(bb.ex, bb.ez) || bb.pos.y - bb.ey > _tc.y + r || bb.pos.y + bb.ey < P.pos.y) continue;
    if (it._tk === P.tackleId) continue; it._tk = P.tackleId;
    var m = effMass(bb), k = (9 + P.tackleSp * 0.5) * TUNE.flyPow * (1 + smashUp('fly') * 0.2) / Math.sqrt(Math.max(0.6, m * 0.5));
    if (!bb.fixed) { bb.vel.set(fx * k + rand(-1, 1), 3 + k * 0.35, fz * k + rand(-1, 1)); bb.av.set(rand(-8, 8), rand(-8, 8), rand(-8, 8)); bb.thrownT = 1.2; wake(it); }
    if (!itemHit(it, dmg, fx, fz, src)) { sfx('hitHeavy', smashPitch()); feel(0); if (!ITEM_BRK[it.type]) smashEvent('hit', 1, 0, src, itemName(it)); }
    if (m > 12 && !it.broken) { P.tackleT = 0; P.vel.x = -fx * 2; P.vel.z = -fz * 2; }
  }
  if (typeof npcHitAt === 'function') { _v2.set(fx * P.tackleSp, 4, fz * P.tackleSp); npcHitAt(_tc, r + 0.2, _v2, 18 * TUNE.tacklePow, src); }
}
var _v2 = null;
// ===== 迷惑ポイント・被害額・コンボ =====
var SMASH = { pts: 0, totalPts: 0, yen: 0, combo: 0, comboT: 0, cPts: 0, cYen: 0, lastTier: -1, multi: {}, best: { combo: 0, yen: 0 }, up: {}, breaks: 0, flights: 0, bill: {} };
function smashUp(id) { return SMASH.up[id] || 0; }
function smashComboTime() { return TUNE.comboTime * (1 + smashUp('combo') * 0.15); }
function smashMult() { return Math.min(TUNE.comboMulMax, 1 + Math.floor(Math.max(0, SMASH.combo - 1) / TUNE.comboStep) * TUNE.comboMulStep); }
function smashPitch() { return Math.min(14, SMASH.combo * 0.6); }
function yenStr(y) { y = Math.round(y); if (y >= 1e8) return (y / 1e8).toFixed(y >= 1e10 ? 0 : 1) + '億円'; if (y >= 1e4) return Math.round(y / 1e4).toLocaleString() + '万円'; return y.toLocaleString() + '円'; }
function smashEvent(kind, pts, yen, src, name, cls) {
  var S = SMASH, count = kind !== 'hit', labels = [];
  if (!G.started) return;
  if (count) S.combo++;
  if (S.combo > 0 || count) S.comboT = smashComboTime();
  var mult = smashMult(), bon = 0;
  src = src || {};
  if (count) {
    if (kind === 'break') S.breaks++;
    if (kind === 'fly') S.flights++;
    if (src.air) { bon += BONUS.air.p; labels.push(BONUS.air.n); }
    if (src.kind === 'npc') { bon += BONUS.npc.p; labels.push(BONUS.npc.n); }
    if (src.kind === 'chain' && kind === 'break') { bon += BONUS.chain.p; labels.push(BONUS.chain.n); }
    if (cls >= 2 && kind === 'break') { bon += BONUS.big.p * (cls - 1); labels.push(BONUS.big.n); }
    if (src.key) { var m = S.multi[src.key] || (S.multi[src.key] = { n: 0, t: G.t }); if (G.t - m.t > 1.5) m.n = 0; m.t = G.t; m.n++; if (m.n === 5) { bon += BONUS.multi.p; labels.push(BONUS.multi.n); } }
  }
  if (kind === 'river') { bon += BONUS.river.p; labels.push(BONUS.river.n); }
  var p = Math.max(0, Math.round((pts + bon) * mult * TUNE.pointMul)), y = Math.round(yen * TUNE.yenMul);
  S.pts += p; S.totalPts += p; S.yen += y; S.cPts += p; S.cYen += y;
  if (name && y > 0) S.bill[name] = (S.bill[name] || 0) + y;
  if (p) addPollution(p * TUNE.polPerPoint);
  if (count || labels.length) comboShow(labels, p);
  if (kind === 'break' && cls >= 1) logMsg('ev', name + 'を　こわした　（' + yenStr(y) + '／＋' + p + 'pt）');
  if (typeof onSmashEvent === 'function') onSmashEvent(kind, src, name, cls);
}
function comboEnd() {
  var S = SMASH; if (S.combo <= 0) return;
  if (S.combo >= 2) { var line = 'コンボ終了：' + S.combo + ' HIT　被害額 ' + yenStr(S.cYen) + '　＋' + S.cPts + 'pt'; logMsg('sys', line); showTop(line, 'sys'); }
  if (S.combo > S.best.combo) { if (S.best.combo >= 5) sysMsg('最高コンボ　更新!!　' + S.combo + ' HIT'); S.best.combo = S.combo; }
  if (S.cYen > S.best.yen) S.best.yen = S.cYen;
  S.combo = 0; S.cPts = 0; S.cYen = 0; S.lastTier = -1; S.multi = {};
  if (H.cmb) H.cmb.classList.remove('on');
  saveGame();
}
// ---- コンボの表示（まんなかの少し上に小さく・短く） ----
var CMB_CSS = [
  '#os-cmb{position:absolute;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none;z-index:6;opacity:0;transition:opacity .25s;}',
  '#os-cmb.on{opacity:1;}',
  '#os-cmb .n{font:30px/1 OsWA1,' + FONT_SUB + ';letter-spacing:1px;background:linear-gradient(#fff36a,#ff8a00 55%,#ff2d6a);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1px #3a0010;filter:drop-shadow(0 2px 0 rgba(0,0,0,.6));display:inline-block;}',
  '#os-cmb .n.bump{animation:cbump .18s ease-out;}', '@keyframes cbump{0%{transform:scale(1.35)}100%{transform:scale(1)}}',
  '#os-cmb .m{font:12px ' + FONT_UI + ';color:#ffe23a;text-shadow:1px 1px 0 #000,-1px 0 0 #000;}',
  '#os-cmb .b{font:12px ' + FONT_SUB + ';color:#9ff;text-shadow:1px 1px 0 #000,-1px 0 0 #000;white-space:nowrap;}',
  '#os-cg{position:absolute;left:50%;transform:translateX(-50%);width:150px;height:14px;pointer-events:none;z-index:6;display:none;}',
  '#os-cg i{display:block;height:5px;margin-top:2px;background:linear-gradient(90deg,#ff2d6a,#ffd23a);border:1px solid #000;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.4);}',
  '#os-cg b{display:block;font:10px/1 ' + FONT_UI + ';color:#fff;text-shadow:1px 1px 0 #000;text-align:center;}'
].join('\n');
function initSmashUI() {
  var st = document.createElement('style'); st.textContent = CMB_CSS; (document.head || document.documentElement).appendChild(st);
  H.cmb = el('div', '', H.hud); H.cmb.id = 'os-cmb'; H.cmbN = el('div', 'n', H.cmb); H.cmbM = el('div', 'm', H.cmb); H.cmbB = el('div', 'b', H.cmb);
  H.cg = el('div', '', H.hud); H.cg.id = 'os-cg'; H.cgB = el('b', '', H.cg); H.cgI = el('i', '', H.cg);
  layoutSmashUI();
}
function layoutSmashUI() {
  if (!H.cmb) return;
  var portrait = (H.H || 700) > (H.W || 400);
  H.cmb.style.top = Math.round((H.H || 700) * (portrait ? 0.33 : 0.22)) + 'px';
  H.cg.style.top = portrait ? 'calc(var(--st) + 188px)' : 'calc(var(--st) + 36px)';
}
function comboShow(labels, p) {
  if (!H.cmb) return;
  var S = SMASH;
  H.cmb.classList.add('on');
  if (S.combo >= 1) { H.cmbN.textContent = S.combo + ' HIT!!'; H.cmbN.classList.remove('bump'); void H.cmbN.offsetWidth; H.cmbN.classList.add('bump'); }
  var mult = smashMult();
  H.cmbM.textContent = (mult > 1 ? '×' + mult + '　' : '') + '＋' + p + 'pt';
  if (labels.length) { H.cmbB.innerHTML = cnHTML(labels.join('　')); H.cmbB._t = G.t; }
  // 段階の言葉
  var tier = -1; for (var i = 0; i < COMBO_STEPS.length; i++) if (S.combo >= COMBO_STEPS[i]) tier = i;
  if (tier > S.lastTier && tier >= 0) {
    S.lastTier = tier; var w = COMBO_WORDS[Math.min(COMBO_WORDS.length - 1, tier)];
    if (TEXTLV.v >= 1 || tier % 2 === 0 || tier >= 4) popWABig(w, { style: [0, 3, 5, 7, 10, 12, 14][tier % 7], size: 54, x: 0.5, y: (portrait() ? 0.33 : 0.22) + 0.075, maxH: 40, w: 0.7, anim: REDUCED.on ? 'waSoft' : 'waPop', dur: 1.2, lim: 2, silent: true });
    sfx('comboUp', Math.min(12, tier));
  }
}
function portrait() { return (H.H || 700) > (H.W || 400); }
function comboHUD(dt) {
  var S = SMASH;
  if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) comboEnd(); }
  if (!H.cg) return;
  var on = S.combo > 0 && S.comboT > 0;
  H.cg.style.display = on ? 'block' : 'none';
  if (on) { H.cgI.style.width = clamp(S.comboT / smashComboTime() * 100, 0, 100) + '%'; var tx = S.combo + ' HIT　' + yenStr(S.cYen); if (H.cgB._t !== tx) { H.cgB._t = tx; H.cgB.textContent = tx; } }
  if (H.cmb.classList.contains('on') && S.comboT < smashComboTime() - 1.3) H.cmb.classList.remove('on');
  if (H.cmbB._t && G.t - H.cmbB._t > 1.4) { H.cmbB.textContent = ''; H.cmbB._t = 0; }
}
// ===== 破片・けむり・星・中身（同じ形のくり返し描画で軽く） =====
var DEB = { pools: {}, dummy: null, col: null };
var DEB_DEF = {
  box: { n: 110, g: function () { return new THREE.BoxGeometry(1, 1, 1); } },
  shard: { n: 90, g: function () { return new THREE.BoxGeometry(1, 0.06, 0.7); } },
  can: { n: 60, g: function () { return new THREE.CylinderGeometry(0.5, 0.5, 1, 8); } },
  paper: { n: 60, g: function () { return new THREE.BoxGeometry(1, 0.03, 0.7); } },
  ball: { n: 60, g: function () { return new THREE.IcosahedronGeometry(0.6, 0); } },
  star: { n: 40, g: function () { var s = new THREE.Shape(); for (var i = 0; i < 10; i++) { var a = i / 10 * TAU - PI / 2, r = i % 2 ? 0.22 : 0.55; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return new THREE.ShapeGeometry(s); }, basic: true },
  puff: { n: 60, g: function () { return new THREE.IcosahedronGeometry(1, 1); }, puff: true }
};
function initDebris(scene) {
  DEB.dummy = new THREE.Object3D(); DEB.col = new THREE.Color(); GLASS_COL = new THREE.Color(0xcfeeff); ITEM_COL = new THREE.Color(0xdddddd); PUFF_COL = new THREE.Color(0xe0dcd4);
  for (var k in DEB_DEF) {
    var d = DEB_DEF[k], n = Math.max(12, Math.round(d.n * (LITE.on ? 0.4 : 1) * TUNE.debris));
    var mat = d.basic ? new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }) : d.puff ? new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.5, depthWrite: false }) : new THREE.MeshLambertMaterial();
    var m = new THREE.InstancedMesh(d.g(), mat, n); m.frustumCulled = false; m.castShadow = !d.puff && !d.basic && !LITE.on;
    var zero = new THREE.Matrix4().makeScale(0, 0, 0); for (var i = 0; i < n; i++) { m.setMatrixAt(i, zero); m.setColorAt(i, DEB.col.set(0xffffff)); }
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(m);
    var ps = []; for (i = 0; i < n; i++) ps.push({ a: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, ax: 0, ay: 0, az: 0, s: 1, sx: 1, sy: 1, sz: 1, life: 0, max: 1, hard: false, rest: false });
    DEB.pools[k] = { m: m, ps: ps, next: 0, live: 0, dirtyZero: false, kind: k };
  }
}
function debSpawn(kind, x, y, z, vx, vy, vz, s, col, life, o) {
  var pl = DEB.pools[kind]; if (!pl) return null;
  var i = pl.next; pl.next = (pl.next + 1) % pl.ps.length;
  var p = pl.ps[i]; if (!p.a) pl.live++;
  p.a = true; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.rx = rand(0, TAU); p.ry = rand(0, TAU); p.rz = rand(0, TAU);
  p.ax = rand(-9, 9); p.ay = rand(-9, 9); p.az = rand(-9, 9); p.s = s; p.sx = (o && o.sx) || 1; p.sy = (o && o.sy) || 1; p.sz = (o && o.sz) || 1; p.life = p.max = life; p.hard = !!(o && o.hard); p.rest = false; p.hit = null; p.m = (o && o.m) || 0.3;
  pl.m.setColorAt(i, col.isColor ? col : DEB.col.set(col)); if (pl.m.instanceColor) pl.m.instanceColor.needsUpdate = true;
  return p;
}
function debBurst(x, y, z, col, n, kind, pw, dx, dz) {
  kind = kind || 'box'; pw = pw || 4; dx = dx || 0; dz = dz || 0;
  var base = col && col.isColor ? col : DEB.col.set(col || 0xcccccc), c2 = new THREE.Color();
  for (var i = 0; i < n; i++) {
    c2.copy(base).offsetHSL(0, 0, rand(-0.12, 0.08));
    var s = kind === 'shard' ? rand(0.12, 0.35) : rand(0.08, 0.3);
    debSpawn(kind, x + rand(-0.3, 0.3), y + rand(-0.3, 0.3), z + rand(-0.3, 0.3), rand(-pw, pw) + dx * pw * 0.8, rand(pw * 0.4, pw * 1.3), rand(-pw, pw) + dz * pw * 0.8, s, c2, rand(2.5, 4.5), { hard: i < 3 && pw > 4, m: s * 2 });
  }
}
function debPuff(x, y, z, n, spread) {
  for (var i = 0; i < n; i++) { var a = rand(0, TAU), r = rand(0, spread || 0.5); debSpawn('puff', x + Math.cos(a) * r, y + rand(-0.2, 0.4), z + Math.sin(a) * r, Math.cos(a) * rand(0.3, 1.5), rand(0.4, 1.4), Math.sin(a) * rand(0.3, 1.5), rand(0.25, 0.5) * (1 + Math.min(3, spread || 0) * 0.12), PUFF_COL, rand(0.8, 1.4)); }
}
var STAR_COLS = [0xffe23a, 0xff8ad8, 0x8affe0, 0xffffff];
function debStars(x, y, z, n) { for (var i = 0; i < n; i++) debSpawn('star', x, y, z, rand(-2.5, 2.5), rand(2, 5), rand(-2.5, 2.5), rand(0.25, 0.45), pick(STAR_COLS), rand(0.8, 1.4)); }
function confetti3D(x, y, z, n) { for (var i = 0; i < Math.round(n * TUNE.debris); i++) debSpawn('paper', x, y, z, rand(-3, 3), rand(3, 7), rand(-3, 3), rand(0.12, 0.2), new THREE.Color().setHSL(Math.random(), 0.9, 0.6), rand(2.5, 4)); }
// 中身が大量に飛び出す
var SPILL = {
  can: { k: 'can', cols: [0xff3030, 0x30a0ff, 0xffd030, 0x40d060, 0xffffff, 0xff70c0], s: [0.13, 0.26], sx: 1, sy: 1, sz: 1 },
  kippu: { k: 'paper', cols: [0xffb060, 0xffd090], s: [0.18, 0.22] }, letter: { k: 'paper', cols: [0xffffff, 0xfff4e0, 0xffd8e8, 0xd8f0ff], s: [0.22, 0.3] },
  paper: { k: 'paper', cols: [0xffffff, 0xf0f0e0], s: [0.2, 0.3] }, coin: { k: 'can', cols: [0xffd040, 0xd0d0d0], s: [0.1, 0.1], sy: 0.15 },
  capsule: { k: 'ball', cols: [0xff4060, 0x40a0ff, 0xffe040, 0x60e060, 0xff80ff], s: [0.15, 0.2] }, ball: { k: 'ball', cols: [0xffffff, 0xff3030, 0xffd030], s: [0.08, 0.12] },
  food: { k: 'ball', cols: [0xff9030, 0x60c040, 0xfff0d0, 0xa05030, 0xff5050], s: [0.12, 0.22] }, goods: { k: 'box', cols: [0xff4040, 0x40a0ff, 0xffd040, 0x60e060, 0xff80c0, 0xffffff], s: [0.15, 0.3] },
  box: { k: 'box', cols: [0x888888, 0x444444, 0xcccccc], s: [0.1, 0.25] }, trash: { k: 'paper', cols: [0xdddddd, 0x88aa66, 0xaa8866], s: [0.15, 0.25] },
  water: { k: 'ball', cols: [0x7fd0ff, 0xbfe8ff, 0xffffff], s: [0.08, 0.16] }, book: { k: 'box', cols: [0xc04040, 0x4060c0, 0x40a060, 0xe0c060], s: [0.18, 0.26], sy: 0.4 },
  flower: { k: 'ball', cols: [0xff70a0, 0xffe040, 0xff4040, 0xb070ff], s: [0.1, 0.16] }, leaf: { k: 'ball', cols: [0x50a040, 0x70c050, 0xffb0d0], s: [0.12, 0.2] }
};
function spillOut(type, x, y, z, n, dx, dz) {
  var sp = SPILL[type] || SPILL.box; n = Math.round(n * TUNE.debris);
  for (var i = 0; i < n; i++) {
    var s = rand(sp.s[0], sp.s[1]), pw = rand(2, 6);
    debSpawn(sp.k, x + rand(-0.3, 0.3), y + rand(0, 0.4), z + rand(-0.3, 0.3), (dx || 0) * pw + rand(-3, 3), rand(3, 8), (dz || 0) * pw + rand(-3, 3), s, pick(sp.cols), rand(4, 7), { sx: sp.sx || (sp.k === 'can' ? 0.7 : 1), sy: sp.sy || 1, sz: sp.sz || 1, hard: sp.k === 'can' && i < 4, m: 0.4 });
  }
  if (Math.hypot(P.pos.x - x, P.pos.z - z) < 40) sfx('spill');
}
var _v3x = null;
function debUpdate(dt) {
  var d = DEB.dummy, hardN = 0;
  for (var k in DEB.pools) {
    var pl = DEB.pools[k], ps = pl.ps, m = pl.m; if (!pl.live && !pl.dirtyZero) continue;
    var puff = k === 'puff', star = k === 'star', paper = k === 'paper';
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i]; if (!p.a) continue;
      p.life -= dt;
      if (p.life <= 0) { p.a = false; pl.live--; d.scale.set(0, 0, 0); d.position.set(0, -50, 0); d.updateMatrix(); m.setMatrixAt(i, d.matrix); continue; }
      if (puff) { p.vy += 0.6 * dt; p.vx *= 1 - dt * 1.5; p.vz *= 1 - dt * 1.5; }
      else if (!p.rest) {
        p.vy -= (star ? 6 : paper ? 5 : 15) * dt;
        if (paper) { p.vx *= 1 - dt * 1.4; p.vz *= 1 - dt * 1.4; p.vy = Math.max(p.vy, -1.6); p.vx += Math.sin(p.life * 6 + i) * dt * 2; }
      }
      if (!p.rest) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.rx += p.ax * dt; p.ry += p.ay * dt; p.rz += p.az * dt;
        if (!puff && !star) {
          var top = colTop(p.x, p.z, p.y), hs = p.s * 0.3;
          if (p.y - hs < top) { p.y = top + hs; if (p.vy < -1.5) { p.vy = -p.vy * 0.35; p.vx *= 0.6; p.vz *= 0.6; p.ax *= 0.5; p.az *= 0.5; } else { p.vy = 0; p.vx *= 0.8; p.vz *= 0.8; if (Math.abs(p.vx) + Math.abs(p.vz) < 0.2) { p.rest = true; p.rx = Math.round(p.rx / (PI / 2)) * PI / 2; p.rz = Math.round(p.rz / (PI / 2)) * PI / 2; } } }
          // 硬い破片は、ほかの物もこわす
          if (p.hard && hardN < 30) { var sp = Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vz); if (sp > 9) { hardN++; var L = brkQuery(p.x - 0.1, p.y - 0.1, p.z - 0.1, p.x + 0.1, p.y + 0.1, p.z + 0.1); if (L.length) { var b = L[0]; if (p.hit !== b) { p.hit = b; brkHit(b, 0.12 * sp * p.m + 0.3, p.vx, p.vz, { kind: 'chain', key: 'd' + i + k }); p.vx *= -0.3; p.vz *= -0.3; } } } }
        }
      }
      var f = Math.min(1, p.life / Math.min(0.6, p.max * 0.4)), s = p.s * (puff ? (1.4 - f * 0.6) * f : f);
      d.position.set(p.x, p.y, p.z); d.rotation.set(p.rx, p.ry, p.rz); d.scale.set(s * p.sx, s * p.sy, s * p.sz);
      if (star) d.quaternion.copy(R.camera.quaternion);
      d.updateMatrix(); m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true; pl.dirtyZero = pl.live > 0;
  }
}
// ===== 毎フレーム =====
function smashUpdate(dt) {
  brkAnimUpdate(dt);
  tackleUpdate(dt);
  chaosUpdate(dt);
  // 元に戻る
  for (var i = BRK.broken.length - 1; i >= 0; i--) {
    var b = BRK.broken[i]; b.t += dt;
    if (b.t > TUNE.respawn + (b.mode === 'crumble' ? TUNE.respawnBig : 0) && !brkInside(b, P.pos.x, P.pos.y, P.pos.z, 0.8) && !(b.g && BRK.anim.some(function (a) { return a.b === b; }))) brkPop(b);
  }
  for (i = 0; i < ITEMS.list.length; i++) { var it = ITEMS.list[i]; if (it.broken) { it.brokeT += dt; if (it.brokeT > TUNE.respawn && it.home.distanceTo(P.pos) > 1.5) itemRestore(it); } if (it.popT > 0) { it.popT -= dt; it.obj.scale.setScalar(Math.max(0.01, easeBack(1 - it.popT / 0.38)) * it.body.scale); if (it.popT <= 0) it.obj.scale.setScalar(it.body.scale); } }
  debUpdate(dt);
  brkFlush();
  smashNetFlush(dt);
  comboHUD(dt);
}
// ===== 強化屋 =====
function upCost(u) { var lv = smashUp(u.id); return Math.round(u.base * Math.pow(lv + 1, 1.7)); }
function openShop() {
  toggleWin('shop', '大暴れ強化屋', 'burst', function (bd) {
    el('div', 'desc', bd).innerHTML = cnHTML(pick(SHOP_LINES));
    el('div', 'kv', bd, '<span>' + cnHTML('迷惑ポイント') + '</span><b style="color:#ffe23a">' + SMASH.pts.toLocaleString() + ' pt</b>');
    UPGRADES.forEach(function (u) {
      var lv = smashUp(u.id), cost = upCost(u), r = el('div', 'kv', bd);
      var l = el('span', '', r); l.style.display = 'flex'; l.style.alignItems = 'center'; l.style.gap = '5px'; l.appendChild(iconEl(uiIcon(u.icon), 18)); el('span', '', l).innerHTML = cnHTML(u.n + '　Lv' + lv);
      if (lv >= 5) el('b', '', r, 'MAX');
      else mbtn(r, cost + 'pt', function () { if (SMASH.pts < cost) { sysMsg('迷惑ポイントが　たりません。もっと　こわして下さい。'); sfx('error'); return; } SMASH.pts -= cost; SMASH.up[u.id] = lv + 1; sfx('combine'); sysMsg('「' + u.n + '」が　Lv' + (lv + 1) + 'に　なった!!'); saveGame(); refreshWin('shop'); }, SMASH.pts >= cost ? 'gold' : '');
      el('div', 'desc', bd).innerHTML = cnHTML(u.d);
    });
  }, { w: 320, h: 470 });
}
function smashSave() { return { tp: TOPPAD.mode, gc: GUN.cur, p: SMASH.pts, tp: SMASH.totalPts, y: SMASH.yen, bc: SMASH.best.combo, by: SMASH.best.yen, u: SMASH.up, b: SMASH.breaks, f: SMASH.flights, v: FEEL.vib }; }
function smashLoad(d) { if (!d) return; SMASH.pts = d.p | 0; SMASH.totalPts = d.tp | 0; SMASH.yen = +d.y || 0; SMASH.best.combo = d.bc | 0; SMASH.best.yen = +d.by || 0; SMASH.up = d.u || {}; SMASH.breaks = d.b | 0; SMASH.flights = d.f | 0; FEEL.vib = d.v !== false; GUN.cur = (d.gc | 0) % GUNS.length; if (d.tp) { TOPPAD.mode = d.tp; applyTopPad(); } }
// ---- 同時プレイ：ほかの人がこわした物（0.5秒ごとにまとめて送る。破片は各自の画面で計算） ----
var SNQ = { q: [], t: 0 };
function smashNetQ(k, d) { if (!NET.on || NET.applying) return; if (SNQ.q.length < 40) SNQ.q.push([k, d]); }
function smashNetFlush(dt) { SNQ.t += dt; if (SNQ.t < 0.5) return; SNQ.t = 0; if (SNQ.q.length && NET.on) { NET.send('bks', { l: SNQ.q }, true); } SNQ.q = []; }
function smashNetEvent(type, d) {
  if (type === 'bk') { var b = BRK.list[d.i]; if (b && !b.broken) brkBreak(b, d.x || 0, d.z || 1, { net: true }); }
  else if (type === 'bh') { var b2 = BRK.list[d.i]; if (b2 && !b2.broken) brkHit(b2, +d.d || 0.5, d.x || 0, d.z || 1, { net: true, quiet: true }); }
  else if (type === 'ib') { var it = findNetItem(d.k); if (it && !it.broken) itemBreak(it, d.x || 0, d.z || 1, { net: true }); }
}

// 強化屋の屋台（駅前）
function initShopBooth() {
  var x = -11, z = -61.5, g2 = new THREE.Group(); g2.position.set(x, 0, z);
  part(g2, PG.box, pm(0xffd040, true), 0, 0.5, 0.3, 2.4, 1.0, 0.7); part(g2, PG.box, pm(0xd02040, true), 0, 2.6, 0, 2.8, 0.15, 1.6);
  [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]].forEach(function (p) { part(g2, PG.box, pm(0x333333, true), p[0], 1.3, p[1], 0.08, 2.6, 0.08); });
  var t = texPlane(labelCanvas('大暴れ強化屋', 3, 384, 96), 2.6, 0.65); t.position.set(0, 3.05, 0.81); g2.add(t); var t2 = t.clone(); t2.rotation.y = PI; t2.position.z = -0.81; g2.add(t2);
  R.scene.add(g2); colAdd(x - 1.2, 0, z - 0.05, x + 1.2, 1.0, z + 0.65, 'prop');
  PROPS.push({ def: { id: 'shop', n: '大暴れ強化屋', a: '', l: [''], fx: ['none'], z: '' }, obj: g2, center: new THREE.Vector3(x, 1.2, z), rad: 1.6, count: 0, base: g2.position.clone(), baseRot: 0, scl: 1, sclT: 1, spin: 0, hop: 0, floatT: 0, clones: 0, shop: true });
}
