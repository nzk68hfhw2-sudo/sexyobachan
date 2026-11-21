// ---- 住人（選ばれなかった７人が町を歩き回る）・着がえ所 ------------------------------------------
var NPCS = [];
var DRESSING = [{ x: 10, z: -60, name: '駅前の着がえ所' }, { x: -18, z: 8, name: '公園の着がえ所' }];
function initNPCs() {
  PROPS.forEach(function (pr) {
    var d = pr.def; if (d.b !== 'friend' || d.tint || d.s) return;
    var f = pr.fr; f.npc = true;
    var ent = { pos: f.mesh.position.clone(), vel: new THREE.Vector3(), r: 0.28, h: 1.25, onGround: true, visible: true };
    var root = new THREE.Group(), body = new THREE.Group(); R.scene.add(root); root.add(body);
    R.scene.remove(f.mesh); f.mesh.position.set(0, 0, 0); f.mesh.rotation.set(0, 0, 0); f.mesh.geometry = armGeo(f.mesh.geometry); f.mesh.material = animMat(f.mesh.geometry.userData.set || 0); f.mesh.material.userData.u.uH.value = f.mesh.geometry.userData.h || 1.06; body.add(f.mesh);
    var n = { idx: d.fr, pr: pr, f: f, ent: ent, root: root, body: body, home: ent.pos.clone(), face: d.r || 0, homeFace: d.r || 0, target: null, wait: rand(0.3, 2.5), st: {}, bubble: null, talkT: rand(10, 30) };
    ent.h = (f.mesh.geometry.userData.h || 1.06) * f.scale;
    NPCS.push(n);
  });
  // 着がえ所（電話ボックスのような小屋）
  DRESSING.forEach(function (dr) {
    var g2 = new THREE.Group(); g2.position.set(dr.x, 0, dr.z);
    part(g2, PG.box, pm(0xd04080, true), 0, 1.25, 0, 1.6, 0.1, 1.6); part(g2, PG.box, pm(0xd04080, true), 0, 2.5, 0, 1.7, 0.15, 1.7);
    [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].forEach(function (p) { part(g2, PG.box, pm(0xffd040, true), p[0], 1.25, p[1], 0.1, 2.5, 0.1); });
    var cur = new THREE.MeshLambertMaterial({ color: 0xff88cc, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    part(g2, PG.box, cur, 0, 1.3, -0.72, 1.4, 1.9, 0.02); part(g2, PG.box, cur, -0.72, 1.3, 0, 0.02, 1.9, 1.4); part(g2, PG.box, cur, 0.72, 1.3, 0, 0.02, 1.9, 1.4);
    var t = texPlane(labelCanvas('着がえ所', 0, 256, 96), 1.5, 0.55); t.position.set(0, 2.95, 0.86); g2.add(t);
    var t2 = t.clone(); t2.rotation.y = PI; t2.position.z = -0.86; g2.add(t2);
    R.scene.add(g2);
    PROPS.push({ def: { id: 'dress_' + dr.x, n: dr.name, a: '', l: ['カーテンの中に入った。'], fx: ['none'], z: '' }, obj: g2, center: new THREE.Vector3(dr.x, 1.2, dr.z), rad: 1.3, count: 0, base: g2.position.clone(), baseRot: 0, scl: 1, sclT: 1, spin: 0, hop: 0, floatT: 0, clones: 0, dressing: true });
  });
}
function nearDressing() { for (var i = 0; i < DRESSING.length; i++) if (Math.hypot(P.pos.x - DRESSING[i].x, P.pos.z - DRESSING[i].z) < 3.5) return true; return false; }
function npcSetHidden(idx, prev) {
  NPCS.forEach(function (n) {
    if (n.mob) return;
    if (n.idx === idx) { n.ent.visible = false; n.root.visible = false; n.pr.gone = true; }
    else if (n.idx === prev || !n.ent.visible) { n.ent.visible = true; n.root.visible = true; n.pr.gone = false; }
  });
}
function updateNPCs(dt) {
  var slow = G.slowT > 0 ? 0.25 : 1;
  NPCS.forEach(function (n) {
    if (!n.ent.visible) return;
    if (npcSmash(n, dt)) return;
    var e = n.ent, dxp = P.pos.x - e.pos.x, dzp = P.pos.z - e.pos.z, dP = Math.hypot(dxp, dzp);
    var far = dP > 70;
    if (far) { n.root.visible = false; return; } n.root.visible = true;
    var want = 0, wx = 0, wz = 0;
    if (n.pr.hop > 0 || n.pr.spin > 0) { n.target = null; n.wait = 2; }
    if (dP < 3 && !G.inMenu) { n.target = null; n.wait = Math.max(n.wait, 2); n.face += angDiff(n.face, Math.atan2(-(-dxp), -(-dzp))) * Math.min(1, dt * 4); }
    else if (n.target) {
      var dx = n.target.x - e.pos.x, dz = n.target.z - e.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.6 || n.stuck > 2) { n.target = null; n.wait = rand(2, 7); n.stuck = 0; }
      else { want = (G.stage >= 4 ? 1.9 : 1.3) * slow; wx = dx / d; wz = dz / d; n.face += angDiff(n.face, Math.atan2(wx, wz)) * Math.min(1, dt * 6); }
    } else {
      n.wait -= dt;
      if (n.wait <= 0) { var a = rand(0, TAU), r = rand(2, 9); n.target = new THREE.Vector3(n.home.x + Math.cos(a) * r, 0, n.home.z + Math.sin(a) * r); }
      else n.face += angDiff(n.face, n.homeFace) * Math.min(1, dt);
    }
    e.vel.x += (wx * want - e.vel.x) * Math.min(1, dt * 8); e.vel.z += (wz * want - e.vel.z) * Math.min(1, dt * 8);
    var ox = e.pos.x, oz = e.pos.z;
    moveEntity(e, dt * slow, 1);
    if (want > 0 && Math.hypot(e.pos.x - ox, e.pos.z - oz) < want * dt * 0.3) n.stuck = (n.stuck || 0) + dt;
    if (e.pos.y < -10) { e.pos.copy(n.home); e.vel.set(0, 0, 0); }
    // ときどき独り言（定型文）
    n.talkT -= dt; if (n.talkT <= 0) { n.talkT = rand(18, 45); if (dP < 18) { var cat = PHRASES[randi(0, PHRASES.length - 1)][1]; n.bubble = { text: pick(cat), t: now() + 4000 }; } }
    if (dP < 3 && !n.gs && Math.random() < dt * 0.15) n.gs = { id: pick(['wave', 'bow', 'nod', 'dance']), t: 0 };
    var ex = gestureAnim(n.gs, dt); if (ex === 'end') { n.gs = null; ex = null; }
    if (n.pr.hop > 0) { ex = ex || {}; ex.bounce = Math.sin((1 - n.pr.hop) * PI) * 0.6; ex.L_raiseL = ex.L_raiseR = 0.6; }
    bodyAnim(n.root, n.body, n.st, dt, Math.hypot(e.vel.x, e.vel.z), false, e.onGround, e.vel.y, ex);
    n.root.position.copy(e.pos); n.root.rotation.y = n.face + (n.pr.spin > 0 ? G.t * 12 : 0);
    var big = visStage() >= 4 ? 1 + smooth((G.pol - 60) / 40) * 0.6 : 1;
    n.root.scale.setScalar((n.pr.scl || 1) * big);
    n.pr.center.set(e.pos.x, e.pos.y + 0.7, e.pos.z);
  });
}
