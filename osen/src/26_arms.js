// ---- 銃（最初から全部持っている）と、ぶち暴れ系のとくぎ -------------------------------------------
// 銃の種類（あとから数字を変えられる）
var GUNS = [
  { id: 'pistol', n: 'ポンポン銃', rate: 0.26, dmg: 1.3, spread: 0.006, kb: 7, col: 0xffd030, snd: 'gunPistol' },
  { id: 'mg', n: 'ガトリング', rate: 0.075, dmg: 0.5, spread: 0.028, kb: 3.5, col: 0x30c0ff, snd: 'gunMg' },
  { id: 'shot', n: 'ショットガン', rate: 0.7, dmg: 0.55, pellets: 9, spread: 0.075, kb: 6, col: 0xff6030, snd: 'gunShot' },
  { id: 'rocket', n: 'バズーカ', rate: 0.95, proj: 'rocket', speed: 38, r: 5.5, pw: 6, col: 0x40b040, snd: 'gunRocket' },
  { id: 'grenade', n: 'ぽいぽい爆弾', rate: 0.55, proj: 'grenade', speed: 17, r: 4.5, pw: 5, col: 0xff70c0, snd: 'gunPoi' },
  { id: 'beam', n: 'ビーム銃', rate: 0.15, beam: true, dmg: 0.75, col: 0x80fff0, snd: 'gunBeam' },
  { id: 'air', n: 'ふっとばし砲', rate: 0.6, cone: true, range: 13, kb: 15, dmg: 0.5, col: 0xb080ff, snd: 'gunAir' }
];
var GUN = { cur: 0, cd: 0, shot: 0, mesh: null, models: [], tr: null, trP: [], beam: null, beamOn: false, beamT: 0, proj: [], muzzle: null };
// ---- 銃の形（プログラムで組み立てる。おもちゃっぽい色） ----
function buildGunModels() {
  var box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 10);
  function M(c) { return new THREE.MeshLambertMaterial({ color: c }); }
  function bx(g, c, x, y, z, sx, sy, sz) { var m = new THREE.Mesh(box, M(c)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; }
  function cy(g, c, x, y, z, r, l) { var m = new THREE.Mesh(cyl, M(c)); m.position.set(x, y, z); m.rotation.x = PI / 2; m.scale.set(r, l, r); g.add(m); return m; }
  var defs = {
    pistol: function (g) { bx(g, 0xffd030, 0, 0, 0.05, 0.07, 0.09, 0.3); bx(g, 0x333333, 0, -0.08, -0.04, 0.06, 0.14, 0.07); cy(g, 0xff5050, 0, 0.01, 0.24, 0.025, 0.12); return 0.3; },
    mg: function (g) { bx(g, 0x30c0ff, 0, 0, 0, 0.1, 0.11, 0.36); for (var i = 0; i < 6; i++) { var a = i / 6 * TAU; cy(g, 0x888888, Math.cos(a) * 0.035, 0.01 + Math.sin(a) * 0.035, 0.3, 0.012, 0.3); } bx(g, 0x333333, 0, -0.1, -0.05, 0.06, 0.12, 0.07); bx(g, 0xffd030, 0.07, -0.03, 0, 0.05, 0.08, 0.14); return 0.45; },
    shot: function (g) { bx(g, 0x8a4a20, 0, -0.02, -0.12, 0.07, 0.1, 0.24); bx(g, 0xff6030, 0, 0, 0.1, 0.08, 0.08, 0.22); cy(g, 0x444444, -0.022, 0.03, 0.32, 0.02, 0.3); cy(g, 0x444444, 0.022, 0.03, 0.32, 0.02, 0.3); return 0.48; },
    rocket: function (g) { cy(g, 0x40b040, 0, 0.04, 0.05, 0.07, 0.75); cy(g, 0xffd030, 0, 0.04, 0.43, 0.075, 0.04); bx(g, 0x333333, 0, -0.07, 0.0, 0.05, 0.13, 0.06); bx(g, 0x333333, 0, 0.12, 0.05, 0.03, 0.06, 0.12); return 0.45; },
    grenade: function (g) { bx(g, 0xff70c0, 0, 0, 0.02, 0.09, 0.1, 0.28); cy(g, 0xffffff, 0, 0.01, 0.22, 0.05, 0.12); bx(g, 0x333333, 0, -0.09, -0.06, 0.06, 0.12, 0.06); return 0.3; },
    beam: function (g) { bx(g, 0xf0f0ff, 0, 0, 0, 0.08, 0.1, 0.3); cy(g, 0x80fff0, 0, 0.01, 0.2, 0.04, 0.14); var r = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14), new THREE.MeshBasicMaterial({ color: 0x80fff0 })); r.position.z = 0.1; g.add(r); bx(g, 0x555577, 0, -0.09, -0.05, 0.06, 0.12, 0.06); return 0.3; },
    air: function (g) { cy(g, 0xb080ff, 0, 0.02, 0.1, 0.06, 0.32); var c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.12, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0xe0c0ff, side: THREE.DoubleSide })); c.rotation.x = PI / 2; c.position.z = 0.3; g.add(c); bx(g, 0x333333, 0, -0.08, -0.02, 0.06, 0.12, 0.06); return 0.36; }
  };
  GUN.mesh = new THREE.Group();
  GUNS.forEach(function (gd) { var g = new THREE.Group(); gd.len = defs[gd.id](g); g.visible = false; g.traverse(function (m) { if (m.isMesh) m.castShadow = true; }); GUN.mesh.add(g); GUN.models.push(g); });
  GUN.muzzle = new THREE.Object3D(); GUN.mesh.add(GUN.muzzle);
  P.root.add(GUN.mesh);
  // 弾のすじ
  var tg = new THREE.BoxGeometry(0.035, 0.035, 1); tg.translate(0, 0, 0.5);
  GUN.tr = new THREE.InstancedMesh(tg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }), 24); GUN.tr.frustumCulled = false;
  for (var i = 0; i < 24; i++) { GUN.tr.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); GUN.tr.setColorAt(i, new THREE.Color(0xffffff)); GUN.trP.push({ life: 0 }); }
  R.scene.add(GUN.tr);
  // ビーム
  var bg = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true); bg.rotateX(PI / 2); bg.translate(0, 0, 0.5);
  GUN.beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0x70fff0, transparent: true, opacity: 0.75, depthWrite: false })); GUN.beam.visible = false;
  var core = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0xffffff })); core.scale.set(0.45, 0.45, 1); GUN.beam.add(core); GUN.beam.frustumCulled = false; R.scene.add(GUN.beam);
  GUN.projGeo = { rocket: new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8).rotateX(PI / 2), grenade: new THREE.IcosahedronGeometry(0.14, 1), meteor: new THREE.IcosahedronGeometry(1.6, 1), missile: new THREE.CylinderGeometry(0.06, 0.06, 0.4, 6).rotateX(PI / 2) };
  GUN.projMat = { rocket: new THREE.MeshLambertMaterial({ color: 0x40b040, emissive: 0x103010 }), grenade: new THREE.MeshLambertMaterial({ color: 0xff70c0 }), meteor: new THREE.MeshLambertMaterial({ color: 0x8a5030, emissive: 0x802000 }), missile: new THREE.MeshLambertMaterial({ color: 0xff4040, emissive: 0x401010 }) };
  gunSelect(GUN.cur);
}
function gunSelect(i) {
  GUN.cur = (i + GUNS.length) % GUNS.length;
  GUN.models.forEach(function (m, k) { m.visible = k === GUN.cur; });
  var gd = GUNS[GUN.cur]; GUN.muzzle.position.set(0, 0.01, gd.len || 0.3);
  if (H.bGunSw) { H.bGunSw._lab.innerHTML = cnHTML(gd.n); }
  GUN.beamOn = false; if (GUN.beam) GUN.beam.visible = false;
}
function gunNext() { gunSelect(GUN.cur + 1); sfx('rotate'); sysMsg('武器：' + GUNS[GUN.cur].n, true); showTop('武器：' + GUNS[GUN.cur].n, 'sys'); }
// ---- ねらいの線（カメラの真ん中）をたどって、当たる物をさがす ----
var _ro = null, _rd = null, _rp = null, _rc = null;
function aimRay() {
  if (!_ro) { _ro = new THREE.Vector3(); _rd = new THREE.Vector3(); _rp = new THREE.Vector3(); _rc = new THREE.Vector3(); }
  _ro.copy(R.camera.position); _rd.set(0, 0, -1).applyQuaternion(R.camera.quaternion);
  return { o: _ro, d: _rd };
}
function staticHit(x, y, z) {
  var L = COL.grid[Math.floor(x / COL.cell) + ',' + Math.floor(z / COL.cell)]; if (!L) return false;
  for (var i = 0; i < L.length; i++) { var b = L[i]; if (b.off || b.brk) continue; if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && y > b.y0 && y < b.y1) return true; }
  return false;
}
// o から d 向きに進んで、当たった物を返す。pierce=true なら全部
function rayHits(o, d, maxD, pierce, rad) {
  if (!_rc) aimRay();
  var out = [], seen = {}, step = 0.35, r = rad || 0;
  var t0 = Math.max(0, (P.pos.x - o.x) * d.x + (P.pos.y + 1 - o.y) * d.y + (P.pos.z - o.z) * d.z);
  for (var t = t0; t < maxD; t += step) {
    var x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
    if (y < terrainY(x, z) - 0.05) { out.end = t; out.stop = 'ground'; return out; }
    if (y < -3) { out.end = t; return out; }
    if (!pierce && staticHit(x, y, z)) { out.end = t; out.stop = 'wall'; return out; }
    var L = brkQuery(x - r - 0.05, y - r - 0.05, z - r - 0.05, x + r + 0.05, y + r + 0.05, z + r + 0.05);
    for (var i = 0; i < L.length; i++) { var b = L[i], k = 'b' + b.id; if (seen[k]) continue; seen[k] = 1; out.push({ b: b, t: t, x: x, y: y, z: z }); if (!pierce) { out.end = t; return out; } }
    var N = itemsNear(x, z, 1.5 + r);
    for (i = 0; i < N.length; i++) { var it = N[i], bb = it.body, k2 = 'i' + it.id; if (seen[k2] || it === ITEMS.held || it.broken || it.onHead) continue; if (Math.abs(bb.pos.x - x) < bb.ex + 0.1 + r && Math.abs(bb.pos.y - y) < bb.ey + 0.1 + r && Math.abs(bb.pos.z - z) < bb.ez + 0.1 + r) { seen[k2] = 1; out.push({ it: it, t: t, x: x, y: y, z: z }); if (!pierce) { out.end = t; return out; } } }
    for (i = 0; i < NPCS.length; i++) { var n = NPCS[i], k3 = 'n' + n.uid; if (seen[k3] || !n.ent.visible || n.state === 'held') continue; npcCenter(n, _rc); if (Math.abs(_rc.x - x) < 0.4 + r && Math.abs(_rc.z - z) < 0.4 + r && Math.abs(_rc.y - y) < n.ent.h * 0.5 + 0.1 + r) { seen[k3] = 1; out.push({ n: n, t: t, x: x, y: y, z: z }); if (!pierce) { out.end = t; return out; } } }
  }
  out.end = maxD; return out;
}
// 当たった物に効果
function applyHit(h, dmg, d, kb, key) {
  var src = { kind: 'gun', key: key, air: !P.onGround, p: { x: h.x, y: h.y, z: h.z } };
  if (h.b) brkHit(h.b, dmg, d.x, d.z, src);
  else if (h.it) { var bb = h.it.body; if (!bb.fixed) { var k = kb / Math.sqrt(Math.max(0.6, effMass(bb))) * TUNE.flyPow; bb.vel.x += d.x * k; bb.vel.y += Math.max(1.5, d.y * k + k * 0.3); bb.vel.z += d.z * k; bb.av.set(rand(-8, 8), rand(-8, 8), rand(-8, 8)); bb.thrownT = 1; wake(h.it); } if (!itemHit(h.it, dmg, d.x, d.z, src) && !ITEM_BRK[h.it.type]) smashEvent('hit', 1, 0, src, itemName(h.it)); }
  else if (h.n) { var s = Math.max(6, kb) * TUNE.flyPow * (1 + smashUp('fly') * 0.2); npcLaunch(h.n, d.x * s + rand(-1, 1), 3.5 + s * 0.35, d.z * s + rand(-1, 1), src); }
  debBurst(h.x, h.y, h.z, SPARK_COL || 0xffe080, 3, 'box', 2.5);
}
var SPARK_COL = null;
// ---- 撃つ ----
var _mz = null, _tq = null, _tm = null, _ts = null, _tp = null;
function gunMuzzle() { if (!_mz) _mz = new THREE.Vector3(); GUN.muzzle.updateMatrixWorld(true); return GUN.muzzle.getWorldPosition(_mz); }
function tracer(a, b, col) {
  if (!_tq) { _tq = new THREE.Quaternion(); _tm = new THREE.Matrix4(); _ts = new THREE.Vector3(); _tp = new THREE.Vector3(); }
  var i = (GUN.trI = ((GUN.trI || 0) + 1) % GUN.trP.length), len = a.distanceTo(b); if (len < 0.1) return;
  _tp.subVectors(b, a).normalize(); _tq.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _tp); _ts.set(1, 1, len);
  _tm.compose(a, _tq, _ts); GUN.tr.setMatrixAt(i, _tm); GUN.tr.setColorAt(i, DEB.col.set(col || 0xffffff)); GUN.tr.instanceMatrix.needsUpdate = true; if (GUN.tr.instanceColor) GUN.tr.instanceColor.needsUpdate = true;
  GUN.trP[i].life = 0.07;
}
function gunFire() {
  var gd = GUNS[GUN.cur]; if (GUN.cd > 0) return;
  GUN.cd = gd.rate; GUN.shot++;
  P.aimT = 1.4; P.face = CAM.yaw;
  var ray = aimRay(), m = gunMuzzle().clone();
  if (gd.beam) { GUN.beamOn = true; GUN.beamT = 0.2; return; }
  sfx(gd.snd, rand(-1, 1)); FEEL.kick = Math.max(FEEL.kick, gd.id === 'rocket' ? 0.25 : 0.06); FEEL.shake = Math.max(FEEL.shake, (gd.id === 'shot' || gd.id === 'rocket') ? 0.05 : 0.015);
  debSpawn('star', m.x, m.y, m.z, 0, 0, 0, gd.id === 'mg' ? 0.25 : 0.35, 0xfff4a0, 0.06);
  if (gd.proj) {
    var hits = rayHits(ray.o, ray.d, 80, false), tp = ray.o.clone().addScaledVector(ray.d, hits.end), dir = tp.sub(m).normalize();
    if (gd.proj === 'grenade') { dir.y += 0.25; dir.normalize(); }
    projSpawn(gd.proj, m, dir.multiplyScalar(gd.speed), { r: gd.r * (1 + smashUp('skill') * 0.1), pw: gd.pw, fuse: gd.proj === 'grenade' ? 1.4 : 4 });
    return;
  }
  if (gd.cone) { gunCone(gd, ray); return; }
  var n = gd.pellets || 1, d = new THREE.Vector3();
  for (var k = 0; k < n; k++) {
    d.copy(ray.d); d.x += rand(-gd.spread, gd.spread); d.y += rand(-gd.spread, gd.spread); d.z += rand(-gd.spread, gd.spread); d.normalize();
    var hs = rayHits(ray.o, d, 90, false), end = ray.o.clone().addScaledVector(d, hs.end);
    tracer(m, end, gd.col);
    if (hs.length) applyHit(hs[0], gd.dmg, d, gd.kb, 'g' + GUN.shot + '_' + k);
    else if (hs.stop) { debBurst(end.x, end.y, end.z, 0xd0c8b0, 2, 'box', 2); }
  }
}
// ふっとばし砲：前の方を、まとめて飛ばす
function gunCone(gd, ray) {
  var fx = ray.d.x, fz = ray.d.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
  var c = P.pos, key = 'air' + GUN.shot, src = { kind: 'gun', key: key, air: !P.onGround };
  for (var s = 1; s < gd.range; s += 2.2) debPuff(c.x + fx * s, c.y + 1 + ray.d.y * s, c.z + fz * s, 1, 0.2 + s * 0.08);
  itemsNear(c.x, c.z, gd.range).forEach(function (it) { var b = it.body; if (it === ITEMS.held || it.broken || b.fixed) return; var dx = b.pos.x - c.x, dz = b.pos.z - c.z, d = Math.hypot(dx, dz); if (d > gd.range || (dx * fx + dz * fz) / (d || 1) < 0.6) return; var k = gd.kb * (1 - d / gd.range * 0.5) / Math.sqrt(Math.max(0.8, effMass(b))) * TUNE.flyPow; b.vel.set(fx * k, 4 + k * 0.4, fz * k); b.av.set(rand(-9, 9), rand(-9, 9), rand(-9, 9)); b.thrownT = 1.5; wake(it); itemHit(it, gd.dmg, fx, fz, src); });
  NPCS.forEach(function (n) { if (!n.ent.visible || n.state === 'held') return; var dx = n.ent.pos.x - c.x, dz = n.ent.pos.z - c.z, d = Math.hypot(dx, dz); if (d > gd.range || (dx * fx + dz * fz) / (d || 1) < 0.6) return; var k = gd.kb * (1 - d / gd.range * 0.4) * TUNE.flyPow * (1 + smashUp('fly') * 0.2); npcLaunch(n, fx * k, 5 + k * 0.45, fz * k, src); });
  var L = brkQuery(c.x - gd.range, c.y - 1, c.z - gd.range, c.x + gd.range, c.y + 6, c.z + gd.range).slice();
  L.forEach(function (b) { var dx = b.c.x - c.x, dz = b.c.z - c.z, d = Math.hypot(dx, dz); if (d > gd.range || (dx * fx + dz * fz) / (d || 1) < 0.6) return; brkHit(b, gd.dmg * 2, fx, fz, src); });
}
// ---- 弾（バズーカ・ぽいぽい爆弾・メテオ・ミサイル） ----
function projSpawn(kind, p, v, o) {
  var m = new THREE.Mesh(GUN.projGeo[kind], GUN.projMat[kind]); m.position.copy(p); m.castShadow = kind === 'meteor'; R.scene.add(m);
  var pr = { kind: kind, m: m, p: m.position, v: v.clone ? v.clone() : v, life: o.fuse || 4, r: o.r || 4, pw: o.pw || 5, target: o.target || null, t: 0, key: kind + (GUN.projN = (GUN.projN || 0) + 1), src: o.src };
  GUN.proj.push(pr); return pr;
}
var _pv = null;
function projUpdate(dt) {
  if (!_pv) _pv = new THREE.Vector3();
  for (var i = GUN.proj.length - 1; i >= 0; i--) {
    var pr = GUN.proj[i], boom = false; pr.t += dt; pr.life -= dt;
    if (pr.kind === 'grenade') pr.v.y -= 14 * dt;
    if (pr.kind === 'meteor') pr.v.y -= 30 * dt;
    if (pr.kind === 'missile') {
      if (pr.t < 0.35) pr.v.y += 20 * dt;
      else { var tg = pr.target && (pr.target.ent ? npcCenter(pr.target, _pv).clone() : pr.target.c || pr.target); if (tg && !(pr.target.broken)) { var dd = _pv.copy(tg).sub(pr.p); var L2 = dd.length(); dd.multiplyScalar(26 / (L2 || 1)); pr.v.lerp(dd, Math.min(1, dt * 5)); } else pr.v.y -= 10 * dt; }
    }
    var sp = pr.v.length(), steps = Math.max(1, Math.ceil(sp * dt / 0.35));
    for (var s = 0; s < steps && !boom; s++) {
      pr.p.addScaledVector(pr.v, dt / steps);
      var x = pr.p.x, y = pr.p.y, z = pr.p.z, gy = colTop(x, z, y + 0.2);
      if (y < gy + 0.1) { if (pr.kind === 'grenade' && pr.v.y < -2) { pr.p.y = gy + 0.12; pr.v.y = -pr.v.y * 0.45; pr.v.x *= 0.7; pr.v.z *= 0.7; sfx('hit_metal', 6); } else if (pr.kind === 'grenade') { pr.p.y = gy + 0.12; pr.v.y = 0; pr.v.x *= 0.9; pr.v.z *= 0.9; } else boom = true; }
      if (!boom && pr.kind !== 'grenade' && staticHit(x, y, z)) boom = true;
      if (!boom && pr.t > 0.05) { if (brkQuery(x - 0.15, y - 0.15, z - 0.15, x + 0.15, y + 0.15, z + 0.15).length) boom = true; }
      if (!boom && pr.t > 0.05) for (var k = 0; k < NPCS.length; k++) { var n = NPCS[k]; if (!n.ent.visible || n.state === 'held') continue; if (Math.abs(n.ent.pos.x - x) < 0.45 && Math.abs(n.ent.pos.z - z) < 0.45 && y > n.ent.pos.y - 0.2 && y < n.ent.pos.y + n.ent.h + 0.2) { boom = true; break; } }
    }
    if (pr.life <= 0) boom = true;
    pr.m.lookAt(_pv.copy(pr.p).add(pr.v));
    if (pr.kind === 'rocket' || pr.kind === 'missile' || pr.kind === 'meteor') { if (Math.random() < (pr.kind === 'meteor' ? 1 : 0.6)) debSpawn('puff', pr.p.x, pr.p.y, pr.p.z, 0, 0.3, 0, pr.kind === 'meteor' ? 1.2 : 0.25, pr.kind === 'meteor' ? 0xff9040 : 0xe8e8e8, 0.5); }
    if (pr.kind === 'meteor') pr.m.rotation.x += dt * 3;
    if (boom) { explode(pr.p, pr.r, pr.pw, pr.key, pr.src); R.scene.remove(pr.m); GUN.proj.splice(i, 1); }
  }
}
var FIRE_COLS = [0xffd040, 0xff8030, 0xff4020, 0xfff0a0];
function explode(p, r, pw, key, src) {
  var c = p.clone ? p.clone() : new THREE.Vector3(p.x, p.y, p.z); c.y = Math.max(c.y, terrainY(c.x, c.z) + 0.4);
  smashBlast(c, r, pw, src || { kind: 'skill', key: key });
  for (var i = 0; i < Math.round(10 + r * 2); i++) debSpawn('ball', c.x, c.y, c.z, rand(-1, 1) * r * 1.4, rand(1, 3) * r * 0.6, rand(-1, 1) * r * 1.4, rand(0.2, 0.45), pick(FIRE_COLS), rand(0.4, 0.9));
  debPuff(c.x, c.y, c.z, Math.round(6 + r), r * 0.45);
  var d = P.pos.distanceTo(c);
  if (d < 70) { sfx('boom', -r); feel(d < r * 2 ? (r > 6 ? 3 : 2) : 1, d < r * 3 ? 1 : 0.5); }
}
// ---- ビーム（押している間ずっと） ----
var _bm = null;
function beamUpdate(dt, firing) {
  var gd = GUNS[GUN.cur];
  if (!gd.beam || !firing) { if (GUN.beam.visible) GUN.beam.visible = false; GUN.beamOn = false; return; }
  if (!_bm) _bm = new THREE.Vector3();
  P.aimT = 1.4; P.face += angDiff(P.face, CAM.yaw) * Math.min(1, dt * 20);
  var ray = aimRay(), hs = rayHits(ray.o, ray.d, 70, true, 0.3), m = gunMuzzle(), wallT = rayHits(ray.o, ray.d, 70, false);
  var endT = Math.min(hs.end, wallT.stop === 'wall' || wallT.stop === 'ground' ? wallT.end : 70), end = _bm.copy(ray.o).addScaledVector(ray.d, endT);
  var len = m.distanceTo(end); GUN.beam.visible = true; GUN.beam.position.copy(m); GUN.beam.lookAt(end); GUN.beam.scale.set(0.08 + Math.sin(G.t * 30) * 0.01, 0.08, len);
  GUN.beamT -= dt;
  if (GUN.beamT <= 0) {
    GUN.beamT = gd.rate; GUN.shot++; sfx(gd.snd);
    hs.forEach(function (h) { if (h.t <= endT + 0.5) applyHit(h, gd.dmg, ray.d, 4, 'bm' + GUN.shot); });
    debBurst(end.x, end.y, end.z, 0x80fff0, 2, 'box', 2);
  }
}
// ---- 毎フレーム ----
function armsUpdate(dt) {
  if (!GUN.mesh) return;
  var busy = ITEMS.held || NPCHELD.n || G.inMenu || G.paused;
  GUN.mesh.visible = !busy;
  // 手の位置（キャラの大きさに合わせる）
  var h = P.bodyH; GUN.mesh.scale.setScalar(2); GUN.mesh.position.set(-0.27, h * (P.aimT > 0 ? 0.56 : 0.42), P.aimT > 0 ? 0.3 : 0.18); GUN.mesh.rotation.x = P.aimT > 0 ? -CAM.pitch * 0.6 : 0.5;
  if (GUN.cd > 0) GUN.cd -= dt;
  if (P.aimT > 0) P.aimT -= dt;
  var firing = IN.fire && !busy;
  if (firing && !GUNS[GUN.cur].beam) gunFire();
  beamUpdate(dt, firing);
  for (var i = 0; i < GUN.trP.length; i++) { var t = GUN.trP[i]; if (t.life > 0) { t.life -= dt; if (t.life <= 0) { GUN.tr.setMatrixAt(i, ZERO_M || (ZERO_M = new THREE.Matrix4().makeScale(0, 0, 0))); GUN.tr.instanceMatrix.needsUpdate = true; } } }
  projUpdate(dt);
  skillUpdate(dt);
}
var ZERO_M = null;
// ===== ぶち暴れ系とくぎ =====
var SK = { tornado: 0, beam: 0, hole: 0, holeP: null, quake: [], stomp: false, tw: null };
function skillRange() { return 1 + smashUp('skill') * 0.2; }
function camFwd() { var fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw); return { x: fx, z: fz }; }
function skillGo(id) {
  var f = camFwd(), R2 = skillRange(), p = P.pos;
  switch (id) {
    case 'meteor': {
      var ray = aimRay(), hs = rayHits(ray.o, ray.d, 45, false), d = Math.min(Math.max(hs.end - 3, 6), 30), tx = ray.o.x + ray.d.x * d, tz = ray.o.z + ray.d.z * d;
      if (Math.hypot(tx - p.x, tz - p.z) < 6) { tx = p.x + f.x * 9; tz = p.z + f.z * 9; }
      projSpawn('meteor', new THREE.Vector3(tx + 8, 45, tz + 8), new THREE.Vector3(-8, -30, -8), { r: 8 * R2, pw: 9, fuse: 6 }); sfx('up'); break;
    }
    case 'tornado': SK.tornado = 3; P.face = CAM.yaw; sfx('whoosh'); break;
    case 'stomp': P.vel.y = 13; P.onGround = false; SK.stomp = true; sfx('up'); break;
    case 'missile': {
      var tg = [], c = P.pos;
      BRK.list.forEach(function (b) { if (b.broken) return; var dx = b.c.x - c.x, dz = b.c.z - c.z, dd = Math.hypot(dx, dz); if (dd < 35 && dd > 3 && (dx * f.x + dz * f.z) > -dd * 0.3) tg.push({ o: b, d: dd }); });
      NPCS.forEach(function (n) { if (!n.ent.visible || n.state === 'held') return; var dd = n.ent.pos.distanceTo(c); if (dd < 30 && dd > 2) tg.push({ o: n, d: dd * 0.7 }); });
      tg.sort(function (a, b) { return a.d - b.d; });
      for (var i = 0; i < 8; i++) { var o = tg.length ? tg[i % tg.length].o : null; var st = new THREE.Vector3(c.x + rand(-0.4, 0.4), c.y + P.bodyH + 0.3, c.z + rand(-0.4, 0.4)); projSpawn('missile', st, new THREE.Vector3(rand(-4, 4) + f.x * 4, rand(6, 9), rand(-4, 4) + f.z * 4), { r: 3.2 * R2, pw: 4, fuse: 3.5, target: o }); }
      sfx('gunRocket'); break;
    }
    case 'bomb': setTimeout(function () { explode(P.pos.clone(), 10 * R2, 9, 'bomb' + G.t, { kind: 'skill', key: 'bomb' + G.t }); }, 120); sfx('grow'); break;
    case 'beam': SK.beam = 3; break;
    case 'hole': SK.hole = 2.4; SK.holeP = new THREE.Vector3(p.x + f.x * 5, p.y + 1.5, p.z + f.z * 5); sfx('warp'); break;
    case 'quake': SK.quake = []; for (var k = 1; k <= 12; k++) SK.quake.push({ t: k * 0.11, x: p.x + f.x * k * 2.6, z: p.z + f.z * k * 2.6 }); SK.quakeT = 0; sfx('rumble'); break;
  }
}
function skillUpdate(dt) {
  var R2 = skillRange();
  // 竜巻
  if (SK.tornado > 0) {
    SK.tornado -= dt;
    if (!SK.tw) { SK.tw = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xdde8f0, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); SK.tw.rotation.x = PI; R.scene.add(SK.tw); }
    SK.tw.visible = true; SK.tw.position.set(P.pos.x, P.pos.y + 1.6, P.pos.z); SK.tw.rotation.y += dt * 14;
    var f = camFwd(), mv = Math.hypot(IN.mx, IN.mz) > 0.2;
    if (mv) { var fy = CAM.yaw, wx = IN.mx * Math.cos(fy) + IN.mz * Math.sin(fy), wz = -IN.mx * Math.sin(fy) + IN.mz * Math.cos(fy); P.face = Math.atan2(-wx, -wz); }
    P.tackleT = Math.max(P.tackleT || 0, 0.05); P.tackleSp = 12; P.tackleId = 'tw' + Math.floor(SK.tornado * 4);
    if (Math.floor((SK.tornado + dt) * 5) !== Math.floor(SK.tornado * 5)) smashBlast(new THREE.Vector3(P.pos.x, P.pos.y + 1, P.pos.z), 4.5 * R2, 3.5, { kind: 'skill', key: 'tw' + Math.floor(SK.tornado * 5) });
    debPuff(P.pos.x + rand(-1, 1), P.pos.y + rand(0, 2), P.pos.z + rand(-1, 1), 1, 0.3);
    if (SK.tornado <= 0) SK.tw.visible = false;
  }
  // 着地で吹き飛ぶ
  if (SK.stomp && P.onGround && P.vel.y <= 0) { SK.stomp = false; explode(new THREE.Vector3(P.pos.x, P.pos.y + 0.3, P.pos.z), 8 * R2, 8, 'st' + G.t, { kind: 'skill', key: 'st' + G.t }); }
  // メガネビーム（銃のビームを太くした物）
  if (SK.beam > 0) {
    SK.beam -= dt; if (!_bm) _bm = new THREE.Vector3();
    P.aimT = 1; P.face += angDiff(P.face, CAM.yaw) * Math.min(1, dt * 20);
    var ray = aimRay(), head = new THREE.Vector3(P.pos.x, P.pos.y + P.bodyH * 0.85, P.pos.z), bd = ray.d.clone(); bd.y = clamp(bd.y + 0.14, -0.3, 0.6); bd.normalize();
    var hs = rayHits(head, bd, 100, true, 1.8), end = _bm.copy(head).addScaledVector(bd, Math.min(100, hs.end));
    ray = { o: head, d: bd };
    GUN.beam.visible = true; GUN.beam.position.copy(head); GUN.beam.lookAt(end); GUN.beam.scale.set(0.5, 0.5, head.distanceTo(end));
    SK.beamTick = (SK.beamTick || 0) - dt;
    if (SK.beamTick <= 0) { SK.beamTick = 0.15; sfx('gunBeam', -5); hs.forEach(function (h) { applyHit(h, 1.6 * R2, ray.d, 8, 'sb' + Math.floor(SK.beam * 7)); }); }
    if (SK.beam <= 0) GUN.beam.visible = false;
  }
  // 吸いこんで大爆発
  if (SK.hole > 0) {
    SK.hole -= dt; var hp = SK.holeP, rr = 14 * R2;
    debSpawn('puff', hp.x + rand(-3, 3), hp.y + rand(-2, 2), hp.z + rand(-3, 3), 0, 0, 0, 0.4, 0x6040a0, 0.3);
    itemsNear(hp.x, hp.z, rr).forEach(function (it) { var b = it.body; if (it === ITEMS.held || it.broken || b.fixed) return; var dx = hp.x - b.pos.x, dy = hp.y - b.pos.y, dz = hp.z - b.pos.z, d = Math.hypot(dx, dy, dz) || 1; b.vel.x += dx / d * 30 * dt; b.vel.y += dy / d * 30 * dt + 8 * dt; b.vel.z += dz / d * 30 * dt; b.thrownT = 1; wake(it); });
    NPCS.forEach(function (n) { if (!n.ent.visible || n.state === 'held') return; var d = n.ent.pos.distanceTo(hp); if (d > rr) return; if (n.state !== 'fly') npcLaunch(n, (hp.x - n.ent.pos.x) * 0.6, 4, (hp.z - n.ent.pos.z) * 0.6, { kind: 'skill', key: 'hole', quiet: false }); else { n.fly.vx += (hp.x - n.ent.pos.x) * 3 * dt; n.fly.vy += (hp.y - n.ent.pos.y) * 3 * dt + 12 * dt; n.fly.vz += (hp.z - n.ent.pos.z) * 3 * dt; } });
    if (SK.hole <= 0) explode(hp, 9 * R2, 9, 'hole' + G.t, { kind: 'skill', key: 'hole' + G.t });
  }
  // 地割れ
  if (SK.quake.length) { SK.quakeT += dt; while (SK.quake.length && SK.quake[0].t <= SK.quakeT) { var q = SK.quake.shift(); explode(new THREE.Vector3(q.x, terrainY(q.x, q.z) + 0.5, q.z), 3.6 * R2, 5, 'qk' + q.t, { kind: 'skill', key: 'qk' + G.t }); } }
}
// ---- ボタン（撃つ：押している間ずっと。なぞるとねらいも動く） ----
function initArmsUI() {
  var e = H.bFire = abtn('fire', '撃つ', 'burst', function () {});
  e.innerHTML = ''; e.appendChild(iconEl(uiIcon('star'), 28)); e._lab = el('span', '', e); e._lab.innerHTML = cnHTML('撃つ');
  // holdBtn をはずして、自分で触る
  var ne = e.cloneNode(true); e.parentNode.replaceChild(ne, e); H.bFire = ne; ne._lab = ne.querySelector('span');
  var tid = null, lx = 0, ly = 0;
  ne.addEventListener('touchstart', function (ev) { var t = ev.changedTouches[0]; tid = t.identifier; lx = t.clientX; ly = t.clientY; IN.fire = true; audioInit(); ne.classList.add('on'); ev.preventDefault(); ev.stopPropagation(); }, { passive: false });
  ne.addEventListener('touchmove', function (ev) { for (var i = 0; i < ev.changedTouches.length; i++) { var t = ev.changedTouches[i]; if (t.identifier !== tid) continue; IN.lookX += (t.clientX - lx) * 1.1; IN.lookY += (t.clientY - ly) * 1.1; lx = t.clientX; ly = t.clientY; IN.lastLook = now(); } ev.preventDefault(); ev.stopPropagation(); }, { passive: false });
  function up(ev) { for (var i = 0; i < ev.changedTouches.length; i++) if (ev.changedTouches[i].identifier === tid) { IN.fire = false; tid = null; ne.classList.remove('on'); } }
  ne.addEventListener('touchend', up); ne.addEventListener('touchcancel', up);
  ne.addEventListener('mousedown', function (ev) { IN.fire = true; ev.stopPropagation(); }); window.addEventListener('mouseup', function () { if (!IN.locked) IN.fire = false; });
  H.bGunSw = abtn('gsw', GUNS[GUN.cur].n, 'rotate', function () { gunNext(); });
  layoutArmsUI();
}
function layoutArmsUI() {
  if (!H.bFire) return;
  var touch = IN.isTouch, land = H.land, base = land ? 6 : 60;
  function pos(e, r, b, sz) { e.style.right = 'calc(var(--sr) + ' + r + 'px)'; e.style.bottom = 'calc(var(--sb) + ' + b + 'px)'; e.style.width = e.style.height = sz + 'px'; }
  H.bFire.style.display = touch ? '' : 'none';
  pos(H.bFire, 96, base + 150, 74);
  if (touch) pos(H.bGunSw, 176, base + 176, 48); else { H.bGunSw.style.right = 'calc(var(--sr) + 12px)'; H.bGunSw.style.bottom = 'calc(var(--sb) + 70px)'; H.bGunSw.style.width = H.bGunSw.style.height = '58px'; }
}
