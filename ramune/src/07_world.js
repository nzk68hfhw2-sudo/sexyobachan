// ---- the apartment (8F, one room + kitchen + bathroom + balcony) and the city ---------
var WORLD = null;
var ROOM = { x0: -3, x1: 3, z0: -2.5, z1: 2.5, h: 2.5 };

function stdMat(o, rigid) { return tripify(new THREE.MeshStandardMaterial(o), { rigid: rigid }); }
function basicMat(o) { return tripify(new THREE.MeshBasicMaterial(o), { rigid: true }); }

function addBox(parent, w, h, d, mat, x, y, z, o) {
  o = o || {};
  var g = new THREE.BoxGeometry(w, h, d, o.sx || 1, o.sy || 1, o.sz || 1);
  var m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z);
  if (o.ry) m.rotation.y = o.ry;
  parent.add(m);
  if (o.col) WORLD.colliders.push({ x0: x - w / 2 - (o.pad || 0), x1: x + w / 2 + (o.pad || 0), z0: z - d / 2 - (o.pad || 0), z1: z + d / 2 + (o.pad || 0) });
  return m;
}
function addCol(x0, x1, z0, z1) { WORLD.colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); }
function addPlane(parent, w, h, mat, x, y, z, rx, ry, seg) {
  var g = new THREE.PlaneGeometry(w, h, seg ? Math.max(1, Math.ceil(w * seg)) : 1, seg ? Math.max(1, Math.ceil(h * seg)) : 1);
  var m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); parent.add(m); return m;
}
function addInter(id, label, verb, pos, meshes, fn, o) {
  o = o || {};
  var it = { id: id, label: label, verb: verb, pos: pos, meshes: [], fn: fn, reach: o.reach || 2.3, cond: o.cond };
  (meshes || []).forEach(function (m) { m.traverse(function (c) { if (c.isMesh) { c.userData.inter = it; it.meshes.push(c); } }); });
  WORLD.inter.push(it); WORLD.interMeshes = WORLD.interMeshes.concat(it.meshes);
  return it;
}

function buildWorld() {
  WORLD = { root: new THREE.Group(), colliders: [], inter: [], interMeshes: [], L: {}, anim: [], cans: [], lightMode: 0, tvOn: true, musicOn: true };
  var S = RENDER.scene, W = WORLD.root; S.add(W);
  S.fog = new THREE.FogExp2(0x0a0820, 0.004);

  var M = WORLD.mats = {
    floor: stdMat({ map: TEX.floor, roughness: 0.55, metalness: 0 }),
    wall: stdMat({ map: TEX.wall, roughness: 0.92 }),
    ceil: stdMat({ map: TEX.ceil, roughness: 1, transparent: true, opacity: 1 }),
    white: stdMat({ color: 0xf4f4f0, roughness: 0.6 }),
    wood: stdMat({ color: 0x9a6a42, roughness: 0.6 }),
    darkWood: stdMat({ color: 0x4a3426, roughness: 0.55 }),
    black: stdMat({ color: 0x111114, roughness: 0.4, metalness: 0.2 }),
    metal: stdMat({ color: 0xb8bcc2, roughness: 0.3, metalness: 0.8 }),
    tile: stdMat({ map: TEX.tile, roughness: 0.3 }),
    fabric: stdMat({ map: TEX.fabric, roughness: 0.95 }),
    sheet: stdMat({ map: TEX.sheet, roughness: 0.9 }),
    blanket: stdMat({ map: TEX.blanket, roughness: 0.95 }),
    rug: stdMat({ map: TEX.rug, roughness: 1 }),
    concrete: stdMat({ map: TEX.concrete, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fc7ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false }),
    ceramic: stdMat({ color: 0xf8fbff, roughness: 0.15, metalness: 0.05 }),
    plant: stdMat({ color: 0x2f8f4e, roughness: 0.8 }),
    pot: stdMat({ color: 0xc8643c, roughness: 0.8 }),
    curtain: stdMat({ color: 0x5b4a9e, roughness: 1, side: THREE.DoubleSide })
  };

  // ---- floor / ceiling / walls ----
  var fl = addPlane(W, 6, 5, M.floor, 0, 0, 0, -PI / 2, 0, 2);
  var ce = addPlane(W, 6, 5, M.ceil, 0, ROOM.h, 0, PI / 2, 0, 1); WORLD.ceiling = ce;
  // north wall with big window opening x∈[-2.2,0.6], y<2.2
  addPlane(W, 0.8, 2.5, M.wall, -2.6, 1.25, -2.5, 0, 0, 4);
  addPlane(W, 2.4, 2.5, M.wall, 1.8, 1.25, -2.5, 0, 0, 4);
  addPlane(W, 2.8, 0.3, M.wall, -0.8, 2.35, -2.5, 0, 0, 4);
  addCol(-3, -2.2, -2.6, -2.45); addCol(0.6, 3, -2.6, -2.45);
  // south wall with bathroom door x∈[1.3,2.1], y<2.05
  addPlane(W, 4.3, 2.5, M.wall, -0.85, 1.25, 2.5, 0, PI, 4);
  addPlane(W, 0.9, 2.5, M.wall, 2.55, 1.25, 2.5, 0, PI, 4);
  addPlane(W, 0.8, 0.45, M.wall, 1.7, 2.275, 2.5, 0, PI, 4);
  addCol(-3, 1.3, 2.45, 2.6); addCol(2.1, 3, 2.45, 2.6);
  // west / east
  addPlane(W, 5, 2.5, M.wall, -3, 1.25, 0, 0, PI / 2, 4); addCol(-3.1, -2.95, -2.6, 2.6);
  M.wall2 = stdMat({ map: TEX.wall, roughness: 0.92, side: THREE.DoubleSide });
  wallSeg(W, 3, -2.5, 3, 2.5, M.wall2, [[3.1, 4.0]]);
  // baseboards
  [[0, 2.48, 6, 0.02, 0], [-2.98, 0, 0.02, 5, 0]].forEach(function (b) { addBox(W, b[2] || 0.02, 0.08, b[3], M.white, b[0], 0, b[1]); });
  // ceiling light
  var lampMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 24), new THREE.MeshBasicMaterial({ color: 0xfff4dc }));
  lampMesh.position.set(0, ROOM.h - 0.05, 0); W.add(lampMesh); WORLD.lampMesh = lampMesh;

  // ---- window / sliding door to balcony ----
  addBox(W, 2.8, 0.06, 0.12, M.white, -0.8, 0, -2.5);
  addBox(W, 2.8, 0.06, 0.12, M.white, -0.8, 2.14, -2.5);
  addBox(W, 0.06, 2.2, 0.12, M.white, -2.2, 0, -2.5); addBox(W, 0.06, 2.2, 0.12, M.white, 0.6, 0, -2.5);
  var gl1 = addBox(W, 1.42, 2.1, 0.02, M.glass, -1.5, 0.04, -2.47); addBox(W, 0.05, 2.1, 0.05, M.white, -0.8, 0.04, -2.47);
  addCol(-2.2, -0.8, -2.56, -2.42);
  var gl2 = addBox(W, 1.42, 2.1, 0.02, M.glass, -1.42, 0.04, -2.53); gl2.renderOrder = 2; gl1.renderOrder = 2;
  addBox(W, 0.05, 2.1, 0.05, M.white, -0.71, 0.04, -2.53);
  // curtains
  for (var ci = 0; ci < 2; ci++) {
    var cg = new THREE.PlaneGeometry(0.7, 2.3, 10, 6), pos = cg.attributes.position;
    for (var vi = 0; vi < pos.count; vi++) pos.setZ(vi, Math.sin(pos.getX(vi) * 18) * 0.05);
    cg.computeVertexNormals();
    var cm = new THREE.Mesh(cg, M.curtain); cm.position.set(ci ? 0.95 : -2.55, 1.2, -2.38); W.add(cm);
  }
  addBox(W, 3.8, 0.04, 0.04, M.metal, -0.8, 2.36, -2.38);

  // ---- balcony ----
  var bal = new THREE.Group(); W.add(bal);
  addPlane(bal, 3.4, 1.8, M.concrete, -0.8, -0.02, -3.4, -PI / 2, 0, 1);
  addBox(bal, 3.4, 0.12, 1.8, M.concrete, -0.8, -0.16, -3.4);
  // exterior walls beside balcony
  addBox(bal, 0.2, 2.6, 1.8, M.concrete, -2.6, -0.1, -3.4); addBox(bal, 0.2, 2.6, 1.8, M.concrete, 1.0, -0.1, -3.4);
  addCol(-2.75, -2.45, -4.35, -2.5); addCol(0.85, 1.15, -4.35, -2.5);
  // balcony slab above
  addBox(bal, 3.4, 0.2, 1.9, M.concrete, -0.8, 2.5, -3.45);
  // railing
  addBox(bal, 3.2, 0.06, 0.06, M.metal, -0.8, 1.05, -4.25);
  addBox(bal, 3.2, 0.9, 0.03, new THREE.MeshStandardMaterial({ color: 0x7f9cb3, transparent: true, opacity: 0.35, roughness: 0.2, depthWrite: false }), -0.8, 0.1, -4.25);
  for (var ri = 0; ri < 9; ri++) addBox(bal, 0.03, 1.05, 0.03, M.metal, -2.35 + ri * 0.39, 0, -4.25);
  addCol(-2.5, 0.9, -4.4, -4.22);
  // AC outdoor unit & plant & laundry pole
  var ac = addBox(bal, 0.7, 0.55, 0.28, M.white, 0.45, 0, -3.9, { col: true });
  var fan = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), M.black); fan.position.set(0.35, 0.28, -3.755); bal.add(fan);
  var fanBlade = addBox(bal, 0.36, 0.04, 0.01, M.metal, 0.35, 0.26, -3.75); WORLD.fan = fanBlade;
  addBox(bal, 0.35, 0.35, 0.35, M.pot, -2.2, 0, -3.9, { col: true });
  var bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), M.plant); bush.position.set(-2.2, 0.62, -3.9); bal.add(bush);
  addBox(bal, 3.0, 0.03, 0.03, M.metal, -0.8, 1.95, -3.0);
  // little stool + ashtray-less table
  addBox(bal, 0.35, 0.4, 0.35, M.wood, -1.3, 0, -3.8, { col: true });

  // ---- bed ----
  var bed = new THREE.Group(); W.add(bed);
  addBox(bed, 1.2, 0.28, 2.1, M.darkWood, 2.35, 0, -1.4);
  addBox(bed, 1.12, 0.2, 2.0, M.sheet, 2.35, 0.28, -1.4, { sx: 4, sz: 6 });
  addBox(bed, 1.2, 0.75, 0.06, M.darkWood, 2.35, 0, -2.45);
  var pillow = addBox(bed, 0.6, 0.12, 0.38, M.white, 2.35, 0.48, -2.1, { sx: 3, sz: 3 });
  var blanket = addBox(bed, 1.16, 0.08, 1.3, M.blanket, 2.35, 0.48, -0.95, { sx: 4, sz: 5 });
  addCol(1.75, 2.95, -2.5, -0.35);
  WORLD.bedPos = new THREE.Vector3(2.35, 0.6, -1.4); WORLD.bedMain = { pos: WORLD.bedPos.clone(), y: 0.85, exit: [1.5, -0.1, PI * 0.6] }; WORLD.bed = WORLD.bedMain;
  // floor lamp next to bed
  addBox(W, 0.28, 0.03, 0.28, M.black, 2.7, 0, 0.05);
  addBox(W, 0.03, 1.35, 0.03, M.black, 2.7, 0, 0.05);
  var shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb050, emissiveIntensity: 0.9, side: THREE.DoubleSide }));
  shade.position.set(2.7, 1.45, 0.05); W.add(shade); addCol(2.55, 2.85, -0.1, 0.2);

  // ---- sofa (facing -x toward TV) ----
  var sofa = new THREE.Group(); W.add(sofa);
  addBox(sofa, 0.75, 0.38, 1.6, M.fabric, 1.15, 0, 0.8, { sx: 2, sz: 4 });
  addBox(sofa, 0.2, 0.75, 1.6, M.fabric, 1.45, 0, 0.8, { sz: 4, sy: 2 });
  addBox(sofa, 0.75, 0.55, 0.16, M.fabric, 1.15, 0, -0.02); addBox(sofa, 0.75, 0.55, 0.16, M.fabric, 1.15, 0, 1.62);
  addBox(sofa, 0.5, 0.12, 0.7, M.fabric, 1.1, 0.38, 0.4, { sx: 2, sz: 2 }); addBox(sofa, 0.5, 0.12, 0.7, M.fabric, 1.1, 0.38, 1.18, { sx: 2, sz: 2 });
  var cushion = addBox(sofa, 0.12, 0.38, 0.38, stdMat({ color: 0x7dd3fc, roughness: 1 }), 1.3, 0.48, 1.3, { sx: 2, sy: 2, sz: 2 }); cushion.rotation.z = 0.2;
  addCol(0.75, 1.55, -0.1, 1.7);
  WORLD.sofaSeat = new THREE.Vector3(1.05, 0, 0.8);

  // ---- rug & low table ----
  var rug = addPlane(W, 2.2, 1.6, M.rug, -0.55, 0.006, 0.6, -PI / 2, 0, 3);
  var table = new THREE.Group(); W.add(table);
  addBox(table, 1.1, 0.04, 0.65, M.wood, -0.55, 0.34, 0.6);
  [[-1.05, 0.33], [-0.05, 0.33], [-1.05, 0.87], [-0.05, 0.87]].forEach(function (p) { addBox(table, 0.05, 0.34, 0.05, M.wood, p[0], 0, p[1]); });
  addCol(-1.12, 0.02, 0.26, 0.94);
  WORLD.tableTop = 0.38;
  // ramune case on table (transparent box with candy inside)
  var rcase = new THREE.Group(); rcase.position.set(-0.75, WORLD.tableTop, 0.55); W.add(rcase);
  addBox(rcase, 0.3, 0.025, 0.2, stdMat({ map: TEX.caseLabel, roughness: 0.4 }, true), 0, 0, 0);
  var lid = addBox(rcase, 0.3, 0.07, 0.2, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false }), 0, 0.025, 0);
  var pillGeo = new THREE.SphereGeometry(0.018, 8, 6);
  for (var pi = 0; pi < 26; pi++) {
    var s = SUBS[pi % 19];
    var pm = new THREE.Mesh(pillGeo, new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.25, roughness: 0.3 }));
    pm.position.set(-0.12 + (pi % 7) * 0.04, 0.04 + Math.floor(pi / 21) * 0.025, -0.07 + Math.floor(pi / 7) % 3 * 0.065); pm.scale.y = 0.6; rcase.add(pm);
  }
  WORLD.caseGlow = new THREE.PointLight(0xc77dff, 0.25, 1.2); WORLD.caseGlow.position.set(0, 0.2, 0); rcase.add(WORLD.caseGlow);
  addInter('ramune', 'ラムネケース', 'ラムネを選ぶ', new THREE.Vector3(-0.75, 0.45, 0.55), [rcase], function () { openPillMenu(); }, { reach: 2.4 });
  // phone on table
  var phone = new THREE.Group(); phone.position.set(-0.3, WORLD.tableTop, 0.75); phone.rotation.y = 0.4; W.add(phone);
  addBox(phone, 0.075, 0.01, 0.15, M.black, 0, 0, 0);
  var scr = addPlane(phone, 0.066, 0.14, new THREE.MeshBasicMaterial({ map: TEX.phone }), 0, 0.0115, 0, -PI / 2, 0);
  addInter('phone', 'スマホ', 'スマホを見る', new THREE.Vector3(-0.3, 0.42, 0.75), [phone], function () { openPhone(); });
  // remote
  addBox(W, 0.05, 0.02, 0.17, M.black, -0.95, WORLD.tableTop, 0.8, { ry: -0.3 });
  WORLD.canSpots = [];
  for (var cs = 0; cs < 14; cs++) WORLD.canSpots.push(new THREE.Vector3(-0.98 + (cs % 7) * 0.14 + (cs >= 7 ? 0.07 : 0), WORLD.tableTop, 0.38 + (cs >= 7 ? 0.42 : 0)));

  // ---- TV & stand (west wall, facing +x) ----
  addBox(W, 0.42, 0.45, 1.6, M.darkWood, -2.76, 0, 0.5, { col: true });
  var tvGroup = new THREE.Group(); W.add(tvGroup);
  addBox(tvGroup, 0.06, 0.72, 1.22, M.black, -2.82, 0.55, 0.5);
  var tvScreen = addPlane(tvGroup, 1.14, 0.64, new THREE.MeshBasicMaterial({ map: TEX.tv }), -2.785, 0.91, 0.5, 0, PI / 2);
  addBox(tvGroup, 0.2, 0.08, 0.3, M.black, -2.8, 0.45, 0.5);
  WORLD.tvScreen = tvScreen;
  addInter('tv', 'テレビ', 'テレビをつける/消す', new THREE.Vector3(-2.78, 0.9, 0.5), [tvGroup], function () { WORLD.tvOn = !WORLD.tvOn; sfx('tv'); toast(WORLD.tvOn ? 'テレビをつけた' : 'テレビを消した'); });
  // speaker
  var spk = new THREE.Group(); W.add(spk);
  addBox(spk, 0.3, 0.9, 0.3, M.black, -2.78, 0, -0.55, { col: true });
  var cone1 = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), M.metal); cone1.position.set(-2.625, 0.62, -0.55); cone1.rotation.y = PI / 2; spk.add(cone1);
  var cone2 = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), M.metal); cone2.position.set(-2.625, 0.3, -0.55); cone2.rotation.y = PI / 2; spk.add(cone2);
  WORLD.cones = [cone1, cone2];
  var spkLed = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), new THREE.MeshBasicMaterial({ color: 0x00ffaa })); spkLed.position.set(-2.625, 0.82, -0.55); spkLed.rotation.y = PI / 2; spk.add(spkLed); WORLD.spkLed = spkLed;
  addInter('speaker', 'スピーカー', '音楽をつける/消す', new THREE.Vector3(-2.7, 0.6, -0.55), [spk], function () { AU.music = !AU.music; auVol(); sfx('click'); toast(AU.music ? '音楽をつけた' : '音楽を止めた'); });

  // ---- shelf ----
  var shelf = new THREE.Group(); W.add(shelf);
  addBox(shelf, 0.35, 1.6, 1.0, M.wood, -2.8, 0, -1.85, { col: true });
  for (var sh = 0; sh < 4; sh++) {
    addBox(shelf, 0.34, 0.02, 0.96, M.darkWood, -2.78, 0.05 + sh * 0.4, -1.85);
    for (var bk = 0; bk < 9; bk++) if (Math.random() < 0.8) {
      var bh = 0.2 + Math.random() * 0.14;
      addBox(shelf, 0.22, bh, 0.06 + Math.random() * 0.03, stdMat({ color: new THREE.Color().setHSL(Math.random(), 0.5, 0.45), roughness: 0.8 }), -2.75, 0.07 + sh * 0.4, -2.28 + bk * 0.1);
    }
  }
  // ---- plant in corner ----
  addBox(W, 0.32, 0.36, 0.32, M.pot, -2.7, 0, 1.55, { col: true });
  for (var lf = 0; lf < 7; lf++) {
    var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), M.plant);
    leaf.scale.set(0.5, 1.4, 0.2); leaf.position.set(-2.7 + Math.cos(lf) * 0.12, 0.6 + (lf % 3) * 0.18, 1.55 + Math.sin(lf) * 0.12);
    leaf.rotation.set(Math.sin(lf * 2) * 0.5, lf, Math.cos(lf) * 0.5); W.add(leaf);
  }

  // ---- kitchen ----
  var kit = new THREE.Group(); W.add(kit);
  addBox(kit, 2.0, 0.86, 0.6, M.white, -1.95, 0, 2.2);
  addBox(kit, 2.04, 0.04, 0.62, stdMat({ color: 0x9aa3ab, roughness: 0.25, metalness: 0.6 }), -1.95, 0.86, 2.2);
  addCol(-2.95, -0.95, 1.88, 2.5);
  var sinkHole = addBox(kit, 0.5, 0.02, 0.36, M.metal, -2.3, 0.885, 2.2);
  addBox(kit, 0.03, 0.28, 0.03, M.metal, -2.3, 0.9, 2.42); addBox(kit, 0.03, 0.03, 0.18, M.metal, -2.3, 1.16, 2.34);
  var waterStream = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.26, 6), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.6, emissive: 0x335577 }));
  waterStream.position.set(-2.3, 1.03, 2.26); waterStream.visible = false; kit.add(waterStream); WORLD.water = waterStream;
  addInter('sink', 'キッチンの蛇口', '水を飲む', new THREE.Vector3(-2.3, 1.0, 2.2), [sinkHole], function () { actWater(); });
  // stove
  addBox(kit, 0.6, 0.02, 0.4, M.black, -1.4, 0.885, 2.2);
  [[-1.55, 2.2], [-1.25, 2.2]].forEach(function (p) { var r = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 16), M.metal); r.rotation.x = PI / 2; r.position.set(p[0], 0.91, p[1]); kit.add(r); });
  // kettle, cup noodles
  var kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 14), M.metal); kettle.position.set(-1.25, 0.99, 2.2); kit.add(kettle);
  var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 12), stdMat({ color: 0xffffff })); cup.position.set(-1.0, 0.95, 2.05); kit.add(cup);
  // upper cabinets
  addBox(kit, 2.0, 0.6, 0.35, M.white, -1.95, 1.65, 2.33);
  addBox(kit, 0.6, 0.02, 0.3, M.black, -1.4, 1.62, 2.3);
  // fridge
  var fr = new THREE.Group(); W.add(fr);
  addBox(fr, 0.62, 1.5, 0.62, stdMat({ color: 0xe8f0f2, roughness: 0.3, metalness: 0.2 }), -0.58, 0, 2.18);
  addBox(fr, 0.03, 0.5, 0.03, M.metal, -0.33, 0.85, 1.86); addBox(fr, 0.6, 0.01, 0.01, M.black, -0.58, 1.0, 1.869);
  var mag = addBox(fr, 0.12, 0.09, 0.01, stdMat({ map: TEX.poster3 }), -0.7, 1.2, 1.866);
  addCol(-0.9, -0.26, 1.86, 2.5);
  addInter('fridge', '冷蔵庫', 'ZER9を取る', new THREE.Vector3(-0.58, 1.0, 1.9), [fr], function () { openDrinkMenu(); });
  // trash bin (empties)
  var bin = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.4, 14), stdMat({ color: 0x5f6b73 })); bin.position.set(-0.05, 0.2, 2.25); W.add(bin);

  // ---- light switch & wall clock & posters ----
  var sw = addBox(W, 0.08, 0.12, 0.02, M.white, 1.15, 1.15, 2.49);
  addInter('switch', '電気のスイッチ', '照明を切り替える', new THREE.Vector3(1.15, 1.2, 2.48), [sw], function () { WORLD.lightMode = (WORLD.lightMode + 1) % 3; sfx('click'); toast(['照明：ふつう', '照明：ネオンモード', '照明：暗め（ランプだけ）'][WORLD.lightMode]); });
  var clock = new THREE.Group(); clock.position.set(-1.95, 2.0, 2.48); clock.rotation.y = PI; W.add(clock);
  var face = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), stdMat({ color: 0xffffff, roughness: 0.4 })); clock.add(face);
  var rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 8, 32), M.black); clock.add(rim);
  for (var tk = 0; tk < 12; tk++) { var tm = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.03, 0.005), M.black); tm.position.set(Math.sin(tk / 12 * TAU) * 0.145, Math.cos(tk / 12 * TAU) * 0.145, 0.005); tm.rotation.z = -tk / 12 * TAU; clock.add(tm); }
  var hh = new THREE.Group(), mh = new THREE.Group(); clock.add(hh); clock.add(mh);
  var hhm = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.09, 0.006), M.black); hhm.position.y = 0.04; hhm.position.z = 0.008; hh.add(hhm);
  var mhm = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.13, 0.006), M.black); mhm.position.y = 0.06; mhm.position.z = 0.012; mh.add(mhm);
  WORLD.clockH = hh; WORLD.clockM = mh;
  addPlane(W, 0.5, 0.7, stdMat({ map: TEX.poster1, roughness: 0.6 }), 2.99, 1.55, -1.3, 0, -PI / 2);
  addPlane(W, 0.45, 0.63, stdMat({ map: TEX.poster2, roughness: 0.6 }), -2.99, 1.65, -0.55, 0, PI / 2);
  addPlane(W, 0.45, 0.63, stdMat({ map: TEX.poster3, roughness: 0.6 }), 0.45, 1.5, 2.49, 0, PI);

  // ---- bathroom ----
  var bath = new THREE.Group(); W.add(bath);
  addPlane(bath, 2.4, 1.8, M.tile, 1.8, 0.002, 3.4, -PI / 2, 0, 2);
  addPlane(bath, 2.4, 1.8, M.ceil, 1.8, ROOM.h, 3.4, PI / 2, 0, 1);
  addPlane(bath, 2.4, 2.5, M.tile, 1.8, 1.25, 4.3, 0, PI, 3); addCol(0.6, 3, 4.25, 4.4);
  addPlane(bath, 1.8, 2.5, M.tile, 0.6, 1.25, 3.4, 0, PI / 2, 3); addCol(0.5, 0.65, 2.5, 4.3);
  addPlane(bath, 1.8, 2.5, M.tile, 2.99, 1.25, 3.4, 0, -PI / 2, 3); addCol(2.95, 3.1, 2.5, 4.3);
  addPlane(bath, 1.8, 2.5, M.wall, 3.01, 1.25, 3.4, 0, PI / 2, 4);
  addPlane(bath, 0.7, 2.5, M.tile, 0.95, 1.25, 2.52, 0, 0, 3); addPlane(bath, 0.9, 2.5, M.tile, 2.55, 1.25, 2.52, 0, 0, 3); addPlane(bath, 0.8, 0.45, M.tile, 1.7, 2.275, 2.52, 0, 0, 3);
  // door frame
  addBox(W, 0.05, 2.05, 0.14, M.white, 1.3, 0, 2.5); addBox(W, 0.05, 2.05, 0.14, M.white, 2.1, 0, 2.5); addBox(W, 0.85, 0.05, 0.14, M.white, 1.7, 2.03, 2.5);
  // open door leaf
  var door = addBox(W, 0.78, 2.0, 0.04, M.white, 0, 0, 0); door.position.set(1.33, 1.0, 2.9); door.rotation.y = -PI / 2 + 0.25; door.geometry.translate(0.39, 0, 0);
  // toilet
  var toilet = new THREE.Group(); toilet.position.set(2.6, 0, 3.7); bath.add(toilet);
  var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 18), M.ceramic); bowl.position.set(-0.05, 0.2, 0); bowl.scale.set(1.25, 1, 1); toilet.add(bowl);
  var seat = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 8, 20), M.ceramic); seat.rotation.x = PI / 2; seat.position.set(-0.07, 0.41, 0); seat.scale.set(1.25, 1, 1); toilet.add(seat);
  var tank = addBox(toilet, 0.2, 0.42, 0.42, M.ceramic, 0.22, 0.35, 0);
  addCol(2.2, 3.0, 3.4, 4.0);
  addInter('toilet', 'トイレ', 'トイレを使う', new THREE.Vector3(2.55, 0.45, 3.7), [toilet], function () { actToilet(); });
  // washbasin + mirror
  var basin = new THREE.Group(); basin.position.set(0.85, 0, 3.5); bath.add(basin);
  addBox(basin, 0.42, 0.8, 0.5, M.white, 0.06, 0, 0);
  var bowl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.12, 18), M.ceramic); bowl2.position.set(0.08, 0.84, 0); basin.add(bowl2);
  var mirror = addPlane(basin, 0.6, 0.75, new THREE.MeshStandardMaterial({ color: 0xa8b8c8, roughness: 0.05, metalness: 1.0 }), -0.22, 1.5, 0, 0, PI / 2);
  addCol(0.6, 1.15, 3.2, 3.8);
  addInter('mirror', '鏡', '鏡を見る', new THREE.Vector3(0.66, 1.5, 3.5), [mirror, basin], function () { actMirror(); });
  // towel
  addBox(bath, 0.04, 0.5, 0.35, stdMat({ color: 0xffb3c7 }), 2.95, 0.9, 3.0);

  // ---- bed interaction / balcony interaction ----
  addInter('bed', 'ベッド', '横になる', new THREE.Vector3(2.35, 0.6, -1.3), [bed], function () { WORLD.bed = WORLD.bedMain; openBedMenu(); });
  addInter('rail', 'ベランダの手すり', '夜風にあたる', new THREE.Vector3(-0.8, 1.05, -4.2), [], function () { toast('夜風がきもちいい…（ベランダにいると体温が下がり、吐き気が少しおさまる）'); });

  // ---- lights ----
  var Lt = WORLD.L;
  Lt.hemi = new THREE.HemisphereLight(0x8a90c0, 0x302018, 0.28); S.add(Lt.hemi);
  Lt.ceil = new THREE.PointLight(0xffdcb0, 0.8, 9, 1.7); Lt.ceil.position.set(0, 2.3, 0); S.add(Lt.ceil);
  Lt.lamp = new THREE.PointLight(0xffa65a, 0.7, 6, 1.8); Lt.lamp.position.set(2.7, 1.45, 0.05); S.add(Lt.lamp);
  Lt.tv = new THREE.PointLight(0x7ab8ff, 0.5, 5, 2); Lt.tv.position.set(-2.3, 0.95, 0.5); S.add(Lt.tv);
  Lt.neon = new THREE.PointLight(0xff3fb0, 0, 9, 1.4); Lt.neon.position.set(0, 2.2, -0.5); S.add(Lt.neon);
  Lt.bath = new THREE.PointLight(0xf0f6ff, 0.7, 4, 2); Lt.bath.position.set(1.8, 2.3, 3.4); S.add(Lt.bath);
  Lt.moon = new THREE.DirectionalLight(0x8aa6ff, 0.35); Lt.moon.position.set(-20, 30, -60); S.add(Lt.moon);
  // neon strip (visible in neon mode)
  var strip = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xff3fb0 }));
  strip.position.set(0, 2.42, 2.43); W.add(strip);
  var strip2 = strip.clone(); strip2.position.set(0, 2.42, -2.43); W.add(strip2);
  WORLD.strips = [strip, strip2];

  buildHouse();
  buildCity();
  buildSky();
  buildHeld();
  buildSelfBody();
}

// ---- city -------------------------------------------------------------------------
function mergeBoxes(list, mat) {
  // list: [{w,h,d,x,y,z,uvRepeat}]
  var pos = [], nor = [], uv = [];
  list.forEach(function (b) {
    var g = new THREE.BoxGeometry(b.w, b.h, b.d).toNonIndexed();
    g.translate(b.x, b.y + b.h / 2, b.z);
    var p = g.attributes.position.array, n = g.attributes.normal.array, u = g.attributes.uv.array;
    for (var i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
    for (var j = 0; j < u.length; j += 2) {
      var face = Math.floor(j / 12); // 6 verts per face (non-indexed), 2 comps
      var sx = (face < 2) ? b.d : b.w, top = face === 2 || face === 3;
      uv.push(top ? 0.02 : u[j] * Math.max(1, Math.round(sx / 6)), top ? 0.02 : u[j + 1] * Math.max(1, Math.round(b.h / 14)) * b.flip);
    }
  });
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return new THREE.Mesh(geo, mat);
}
function buildCity() {
  var S = RENDER.scene, city = new THREE.Group(); S.add(city); WORLD.city = city;
  var GY = -26; // street level relative to our floor (8F)
  var groups = [[], [], [], []], i;
  for (i = 0; i < 260; i++) {
    var a = rnd(-PI * 0.95, PI * 0.95) - PI / 2; // mostly in front (−z) and sides
    var d = rnd(22, 190);
    var x = Math.cos(a) * d, z = Math.sin(a) * d - 6;
    if (z > -8 && Math.abs(x) < 16) continue;
    if (z > 10) continue;
    var w = rnd(8, 20), dd = rnd(8, 20), h = rnd(10, 30) + (d > 80 ? rnd(10, 70) : rnd(0, 30));
    groups[i % 4].push({ w: w, h: h, d: dd, x: x, y: GY, z: z, flip: 1 });
  }
  groups.forEach(function (gl, k) {
    var m = mergeBoxes(gl, basicMat({ map: TEX.win[k], color: 0xffffff }));
    city.add(m);
  });
  // ground & streets
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), basicMat({ color: 0x07070c }));
  ground.rotation.x = -PI / 2; ground.position.y = GY; city.add(ground);
  var lightsGeo = new THREE.BufferGeometry(), lp = [], lc = [];
  for (i = 0; i < 1400; i++) {
    var sx, sz;
    if (i % 2) { sx = Math.round(rnd(-10, 10)) * 18 + rnd(-1, 1); sz = rnd(-220, 10); } else { sz = Math.round(rnd(-12, 0)) * 18 - 4; sx = rnd(-220, 220); }
    lp.push(sx, GY + 0.5, sz);
    var c = Math.random() < 0.7 ? [1, 0.75, 0.4] : Math.random() < 0.5 ? [1, 0.2, 0.15] : [0.7, 0.85, 1];
    lc.push(c[0], c[1], c[2]);
  }
  lightsGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  lightsGeo.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  var pts = new THREE.Points(lightsGeo, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, map: TEX.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  city.add(pts); WORLD.streetLights = pts;
  // neon signs on nearby rooftops
  [[TEX.neon1, -18, -2, -34, 0.2], [TEX.neon2, 16, 4, -40, -0.3], [TEX.neon3, -40, -6, -60, 0.4], [TEX.neon4, 34, -2, -70, -0.4]].forEach(function (n) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(10, 3.75), new THREE.MeshBasicMaterial({ map: n[0], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.set(n[1], n[2], n[3]); m.rotation.y = n[4]; city.add(m);
    WORLD.anim.push(function (t) { m.material.opacity = 0.75 + 0.25 * Math.sin(t * (3 + n[1] * 0.1)) * (Math.random() < 0.02 ? 0 : 1); });
  });
  // radio tower with blinking light
  var tw = new THREE.Group(); tw.position.set(60, GY, -150); city.add(tw);
  for (i = 0; i < 6; i++) { var seg = new THREE.Mesh(new THREE.CylinderGeometry(1.2 - i * 0.18, 1.4 - i * 0.18, 18, 4, 1, true), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xd23030 : 0xeeeeee, wireframe: true })); seg.position.y = 9 + i * 18; tw.add(seg); }
  var beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff2020, blending: THREE.AdditiveBlending, depthWrite: false })); beacon.scale.set(8, 8, 1); beacon.position.y = 112; tw.add(beacon);
  WORLD.anim.push(function (t) { beacon.material.opacity = Math.sin(t * 3) > 0.3 ? 1 : 0.1; });
  // moving cars far below (head/tail light pairs)
  var cars = []; for (i = 0; i < 24; i++) {
    var car = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: i % 2 ? 0xfff0c0 : 0xff3030, blending: THREE.AdditiveBlending, depthWrite: false }));
    car.scale.set(2.2, 2.2, 1); city.add(car);
    cars.push({ s: car, lane: Math.round(rnd(-12, 0)) * 18 - 4, x: rnd(-200, 200), v: (i % 2 ? 1 : -1) * rnd(8, 16) });
  }
  WORLD.anim.push(function (t, dt) { cars.forEach(function (c) { c.x += c.v * dt; if (c.x > 220) c.x = -220; if (c.x < -220) c.x = 220; c.s.position.set(c.x, GY + 0.8, c.lane + (c.v > 0 ? 1.5 : -1.5)); }); });
}

// ---- sky ----------------------------------------------------------------------------
var SKYU = { uT: { value: 0 }, uPsy: { value: 0 }, uMorning: { value: 0 } };
function buildSky() {
  var mat = new THREE.ShaderMaterial({
    uniforms: SKYU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform float uT, uPsy, uMorning; varying vec3 vD;',
      'float h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
      'void main(){',
      '  float y = vD.y;',
      '  vec3 night = mix(vec3(0.10, 0.06, 0.20), vec3(0.01, 0.015, 0.05), smoothstep(-0.05, 0.6, y));',
      '  vec3 dawn = mix(vec3(1.0, 0.62, 0.42), vec3(0.35, 0.55, 0.9), smoothstep(-0.05, 0.5, y));',
      '  vec3 col = mix(night, dawn, uMorning);',
      '  vec3 sp = floor(vD * 260.0); float st = step(0.9975, h(sp));',
      '  col += st * (0.6 + 0.4 * sin(uT * 3.0 + h(sp + 1.0) * 40.0)) * smoothstep(0.02, 0.3, y) * (1.0 - uMorning);',
      '  if (uPsy > 0.01) {',
      '    vec2 q = vD.xz / (abs(vD.y) + 0.3) * 2.0; float a = atan(q.y, q.x), r = length(q);',
      '    float sw = sin(a * 5.0 + r * 3.0 - uT * 0.8) + sin(r * 6.0 - uT * 1.3);',
      '    vec3 neb = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + sw * 0.15 + uT * 0.03));',
      '    col = mix(col, neb * 0.8, clamp(uPsy * 0.55, 0.0, 0.8) * smoothstep(-0.1, 0.4, y));',
      '  }',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n')
  });
  var sky = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 16), mat); sky.renderOrder = -10; RENDER.scene.add(sky); WORLD.sky = sky;
  var moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.moon, fog: false, depthWrite: false, transparent: true }));
  moon.scale.set(22, 22, 1); moon.position.set(-60, 90, -230); RENDER.scene.add(moon); WORLD.moon = moon;
}

// ---- held item (camera space) ---------------------------------------------------------
var HELD = { g: null, kind: null, t: 0, dur: 0, cb: null, mesh: null };
function buildHeld() {
  HELD.g = new THREE.Group(); RENDER.camera.add(HELD.g); HELD.g.visible = false;
  var hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.7 }));
  hand.scale.set(1.3, 0.7, 1.6); HELD.hand = hand; hand.visible = false; HELD.g.add(hand);
  var light = new THREE.PointLight(0xffffff, 0.6, 0.8); light.position.set(0, 0.1, 0.2); HELD.g.add(light);
}
function pillMesh(s) {
  var pts = shapePoints(s.shape);
  var shp = new THREE.Shape(); pts.forEach(function (p, i) { if (i) shp.lineTo(p[0], p[1]); else shp.moveTo(p[0], p[1]); });
  if (s.shape === 'ring') { var hole = new THREE.Path(); hole.absarc(0, 0, 0.45, 0, TAU, true); shp.holes.push(hole); }
  var geo = new THREE.ExtrudeGeometry(shp, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.12, bevelSegments: 3, curveSegments: 8 });
  geo.center();
  var mat = new THREE.MeshStandardMaterial({ color: s.col, emissive: s.col, emissiveIntensity: 0.18, roughness: 0.22, metalness: 0.05 });
  var m = new THREE.Mesh(geo, mat); m.scale.setScalar(0.022); return m;
}
function canMesh(d) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, d.alc > 1.5 ? 0.17 : 0.122, 20, 1, true), new THREE.MeshStandardMaterial({ map: canLabelTex(d), roughness: 0.3, metalness: 0.6 }));
  g.add(body);
  var top = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.033, 0.012, 20), new THREE.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.9, roughness: 0.25 }));
  top.position.y = (d.alc > 1.5 ? 0.17 : 0.122) / 2 + 0.006; g.add(top);
  var bot = top.clone(); bot.position.y = -top.position.y; bot.rotation.x = PI; g.add(bot);
  return g;
}
function holdItem(kind, obj, dur, cb) {
  if (HELD.mesh) HELD.g.remove(HELD.mesh);
  HELD.mesh = obj; HELD.g.add(obj); HELD.kind = kind; HELD.t = 0; HELD.dur = dur; HELD.cb = cb; HELD.g.visible = true;
}
function updateHeld(dt) {
  if (!HELD.kind) return;
  HELD.t += dt; var k = HELD.t / HELD.dur, g = HELD.g, m = HELD.mesh;
  var up = smooth(Math.min(1, k * 3)) * (1 - smooth((k - 0.85) / 0.15));
  if (HELD.kind === 'pill') {
    g.position.set(0.0, -0.2 + up * 0.12 - smooth((k - 0.6) / 0.3) * 0.1, -0.34 + smooth((k - 0.55) / 0.35) * 0.22);
    m.rotation.set(0.25, Math.sin(HELD.t * 2.2) * 0.6, HELD.t * 2.2);
    m.position.set(0, 0, 0);
    m.visible = k < 0.88;
  } else {
    var dk = smooth((k - 0.25) / 0.3);
    g.position.set(0.06 - up * 0.05, -0.34 + up * 0.2 + dk * 0.1 * up, -0.34 + up * 0.04 + dk * 0.1 * up);
    var tilt = dk * 2.05 * (1 - smooth((k - 0.8) / 0.15) * 0.6);
    m.rotation.set(tilt, 0, -tilt * 0.3);
    m.position.set(0, 0.03, 0);
    HELD.hand.position.set(0.02, -0.02, 0.01);
  }
  if (k >= 1) { HELD.g.visible = false; HELD.kind = null; var cb = HELD.cb; HELD.cb = null; if (cb) cb(); }
}

// ---- self body (seen when leaving the body) ---------------------------------------------
function buildSelfBody() {
  var b = new THREE.Group(), skin = new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.7 }), cloth = new THREE.MeshStandardMaterial({ color: 0x3b3f6b, roughness: 0.9 }), pants = new THREE.MeshStandardMaterial({ color: 0x22252e, roughness: 0.9 });
  var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.55, 12), cloth); torso.position.y = 1.05; b.add(torso);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), skin); head.position.y = 1.47; b.add(head);
  var hair = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12, 0, TAU, 0, PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x1b1412, roughness: 0.9 })); hair.position.y = 1.48; b.add(hair);
  [-1, 1].forEach(function (s) {
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.55, 8), cloth); arm.position.set(s * 0.22, 1.02, 0); arm.rotation.z = s * 0.12; b.add(arm);
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.8, 8), pants); leg.position.set(s * 0.08, 0.4, 0); b.add(leg);
  });
  b.visible = false; RENDER.scene.add(b); WORLD.self = b;
}
function placeCanOnTable(d) {
  var i = WORLD.cans.length; if (i >= WORLD.canSpots.length) return;
  var m = canMesh(d); var p = WORLD.canSpots[i];
  m.position.set(p.x + rnd(-0.02, 0.02), p.y + (d.alc > 1.5 ? 0.085 : 0.061), p.z + rnd(-0.02, 0.02));
  if (Math.random() < 0.25 && WORLD.cans.length > 3) { m.rotation.z = PI / 2; m.position.y = p.y + 0.033; m.rotation.y = rnd(0, TAU); }
  RENDER.scene.add(m); WORLD.cans.push(m);
}

// ---- wall helper: a straight wall from (x0,z0) to (x1,z1) with door gaps [[s0,s1],...] measured along it ----
function wallSeg(parent, x0, z0, x1, z1, mat, doors, o) {
  o = o || {};
  var len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len, ang = -Math.atan2(z1 - z0, x1 - x0);
  var H = ROOM.h, dh = o.doorH || 2.05, y0 = o.y0 || 0;
  var pieces = [], cur = 0;
  (doors || []).forEach(function (d) {
    if (d[0] > cur) pieces.push([cur, d[0], y0, H]);
    pieces.push([d[0], d[1], d[2] != null ? d[3] : dh, H]);
    if (d[2] != null) pieces.push([d[0], d[1], y0, d[2]]); // window: wall below sill
    cur = d[1];
  });
  if (cur < len) pieces.push([cur, len, y0, H]);
  pieces.forEach(function (p) {
    var w = p[1] - p[0], h = p[3] - p[2]; if (w <= 0.001 || h <= 0.001) return;
    var c = (p[0] + p[1]) / 2;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, Math.max(1, Math.ceil(w * 4)), Math.max(1, Math.ceil(h * 4))), mat);
    m.position.set(x0 + dx * c, (p[2] + p[3]) / 2, z0 + dz * c); m.rotation.y = ang; parent.add(m);
    if (p[2] < 1.0 && !o.noCol) {
      var ax = x0 + dx * p[0], az = z0 + dz * p[0], bx = x0 + dx * p[1], bz = z0 + dz * p[1];
      addCol(Math.min(ax, bx) - 0.06, Math.max(ax, bx) + 0.06, Math.min(az, bz) - 0.06, Math.max(az, bz) + 0.06);
    }
  });
  // door frames
  (doors || []).forEach(function (d) {
    if (d[2] != null) return;
    [d[0], d[1]].forEach(function (s) { var f = new THREE.Mesh(new THREE.BoxGeometry(0.05, dh, 0.14), WORLD.mats.white); f.position.set(x0 + dx * s, dh / 2, z0 + dz * s); f.rotation.y = ang; parent.add(f); });
    var tp = new THREE.Mesh(new THREE.BoxGeometry(d[1] - d[0] + 0.05, 0.05, 0.14), WORLD.mats.white); var c = (d[0] + d[1]) / 2; tp.position.set(x0 + dx * c, dh, z0 + dz * c); tp.rotation.y = ang; parent.add(tp);
  });
}
function floorRect(parent, x0, x1, z0, z1, mat, y) {
  var m = addPlane(parent, x1 - x0, z1 - z0, mat, (x0 + x1) / 2, y || 0, (z0 + z1) / 2, -PI / 2, 0, 2); return m;
}
function ceilRect(parent, x0, x1, z0, z1) { return addPlane(parent, x1 - x0, z1 - z0, WORLD.mats.ceil, (x0 + x1) / 2, ROOM.h, (z0 + z1) / 2, PI / 2, 0, 1); }

// areas of the house (for lights / hallucinations / outdoor check)
var AREAS = [
  { id: 'main', name: 'リビング', x0: -3, x1: 3, z0: -2.5, z1: 2.5 },
  { id: 'balcony', name: 'ベランダ', x0: -2.45, x1: 0.85, z0: -4.25, z1: -2.5 },
  { id: 'toilet', name: 'トイレ', x0: 0.6, x1: 3, z0: 2.5, z1: 4.3, light: [1.8, 2.3, 3.4, 0xf0f6ff] },
  { id: 'hall', name: '廊下', x0: 3, x1: 4.4, z0: -2.5, z1: 4.3, light: [3.7, 2.3, 0.9, 0xffe6c0] },
  { id: 'tatami', name: '和室', x0: 4.4, x1: 8, z0: -2.5, z1: 1.5, light: [6.2, 2.1, -0.5, 0xffc27a] },
  { id: 'bath', name: 'お風呂', x0: 4.4, x1: 8, z0: 1.5, z1: 4.3, light: [6.0, 2.3, 2.9, 0xe8f4ff] }
];
function areaAt(x, z) {
  for (var i = 0; i < AREAS.length; i++) { var a = AREAS[i]; if (x >= a.x0 - 0.05 && x <= a.x1 + 0.05 && z >= a.z0 - 0.05 && z <= a.z1 + 0.05) return a; }
  return AREAS[0];
}

function buildHouse() {
  var H = new THREE.Group(); WORLD.root.add(H); var M = WORLD.mats;
  M.tatami = stdMat({ map: TEX.tatami, roughness: 0.95 });
  M.fusuma = stdMat({ map: TEX.fusuma, roughness: 0.9 });
  M.door = stdMat({ color: 0x3c3f46, roughness: 0.5, metalness: 0.4 });
  M.bathTile = stdMat({ map: TEX.tile, roughness: 0.25, side: THREE.DoubleSide });
  M.genkan = stdMat({ color: 0x6d6a66, roughness: 0.9 });
  M.futon = stdMat({ color: 0xf3efe6, roughness: 0.95 });
  M.kotatsu = stdMat({ color: 0xb0472f, roughness: 0.95 });
  M.water = new THREE.MeshStandardMaterial({ color: 0x6fd3ff, emissive: 0x0a3550, roughness: 0.05, transparent: true, opacity: 0.75 });

  // ---------- hallway x3..4.4, z-2.5..4.3 ----------
  floorRect(H, 3, 4.4, -2.5, 3.6, M.floor);
  floorRect(H, 3, 4.4, 3.6, 4.3, M.genkan, -0.12);
  addBox(H, 1.4, 0.12, 0.05, M.darkWood, 3.7, -0.12, 3.6);
  ceilRect(H, 3, 4.4, -2.5, 4.3);
  wallSeg(H, 3, -2.5, 4.4, -2.5, M.wall2, []);                    // north end
  wallSeg(H, 4.4, -2.5, 4.4, 4.3, M.wall2, [[2.3, 3.2], [4.8, 5.6]]); // doors to tatami / bath
  wallSeg(H, 3, 4.3, 4.4, 4.3, M.wall2, [], { y0: -0.12 });
  // front door
  var fd = new THREE.Group(); H.add(fd);
  addBox(fd, 0.9, 2.05, 0.06, M.door, 3.7, -0.12, 4.26);
  addBox(fd, 0.04, 0.04, 0.16, M.metal, 4.0, 0.9, 4.2);
  var peep = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), M.black); peep.position.set(3.7, 1.5, 4.225); peep.rotation.y = PI; fd.add(peep);
  addInter('door', '玄関のドア', '外に出る', new THREE.Vector3(3.7, 1.0, 4.2), [fd], function () { actFrontDoor(); });
  // shoe box, shoes, umbrella
  addBox(H, 0.35, 0.9, 0.9, M.wood, 4.2, -0.12, 3.85, { col: true });
  [[3.45, 3.9, 0xffffff], [3.6, 3.95, 0x222222]].forEach(function (s) { addBox(H, 0.11, 0.08, 0.27, stdMat({ color: s[2] }), s[0], -0.12, s[1]); addBox(H, 0.11, 0.08, 0.27, stdMat({ color: s[2] }), s[0] + 0.13, -0.12, s[1] + 0.02); });
  var umb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.8, 8), stdMat({ color: 0x2b6cb0 })); umb.position.set(3.15, 0.28, 4.15); umb.rotation.z = 0.15; H.add(umb);
  // wall shelf with a photo frame, hallway lamp
  addBox(H, 0.25, 0.03, 0.7, M.wood, 4.27, 1.0, 1.2);
  var frame = addPlane(H, 0.2, 0.26, stdMat({ map: TEX.poster1 }), 4.38, 1.4, 1.2, 0, -PI / 2);
  var hl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), new THREE.MeshBasicMaterial({ color: 0xfff0d0 })); hl.position.set(3.7, 2.4, 0.9); H.add(hl);
  var hl2 = hl.clone(); hl2.position.z = 3.3; H.add(hl2);

  // ---------- tatami room x4.4..8, z-2.5..1.5 ----------
  floorRect(H, 4.4, 8, -2.5, 1.5, M.tatami, 0.002);
  ceilRect(H, 4.4, 8, -2.5, 1.5);
  wallSeg(H, 4.4, -2.5, 8, -2.5, M.wall2, []);
  wallSeg(H, 8, -2.5, 8, 1.5, M.wall2, [[0.7, 2.9, 0.85, 2.0]]); // window
  wallSeg(H, 8, 1.5, 4.4, 1.5, M.wall2, []);
  // window frame + glass + shoji
  addBox(H, 0.12, 0.05, 2.2, M.wood, 8, 0.83, -0.7); addBox(H, 0.12, 0.05, 2.2, M.wood, 8, 1.98, -0.7);
  var tg = addBox(H, 0.02, 1.15, 2.2, M.glass, 8.02, 0.85, -0.7); tg.renderOrder = 2;
  for (var sj = 0; sj < 2; sj++) {
    var sh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.15), new THREE.MeshStandardMaterial({ map: TEX.shoji, transparent: true, opacity: 0.92, side: THREE.DoubleSide, emissive: 0x332211 }));
    sh.position.set(7.95, 1.42, -1.65 + sj * 0.55); sh.rotation.y = -PI / 2; H.add(sh);
  }
  // oshiire (fusuma) on the north wall
  for (var fu = 0; fu < 2; fu++) addPlane(H, 0.9, 1.75, M.fusuma, 6.6 + fu * 0.9, 0.95, -2.48, 0, 0);
  addBox(H, 1.84, 0.04, 0.04, M.wood, 7.05, 1.82, -2.47); addCol(6.1, 7.95, -2.5, -2.35);
  // futon
  var fut = new THREE.Group(); H.add(fut);
  addBox(fut, 1.0, 0.1, 2.0, M.futon, 5.2, 0.002, -1.35, { sx: 3, sz: 5 });
  addBox(fut, 0.96, 0.08, 1.3, stdMat({ map: TEX.blanket, roughness: 0.95 }), 5.2, 0.1, -1.0, { sx: 3, sz: 4 });
  addBox(fut, 0.5, 0.1, 0.3, M.white, 5.2, 0.1, -2.1, { sx: 2, sz: 2 });
  WORLD.bedFuton = { pos: new THREE.Vector3(5.2, 0.2, -1.35), y: 0.42, exit: [5.9, 0.2, PI * 0.5] };
  addInter('futon', 'ふとん', '横になる', new THREE.Vector3(5.2, 0.2, -1.2), [fut], function () { WORLD.bed = WORLD.bedFuton; openBedMenu(); });
  // kotatsu with mikan
  var kt = new THREE.Group(); H.add(kt);
  addBox(kt, 1.35, 0.33, 1.35, M.kotatsu, 6.6, 0.002, 0.1, { sx: 3, sz: 3 });
  addBox(kt, 1.0, 0.04, 1.0, M.wood, 6.6, 0.38, 0.1);
  var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.07, 0.06, 16), stdMat({ color: 0x2f2f6a })); bowl.position.set(6.6, 0.45, 0.1); kt.add(bowl);
  var mikanMat = stdMat({ color: 0xff8a1c, roughness: 0.7 });
  [[0, 0], [0.06, 0.04], [-0.05, 0.05], [0.01, -0.06]].forEach(function (p, i) { var mk = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), mikanMat); mk.scale.y = 0.8; mk.position.set(6.6 + p[0], 0.5 + (i === 3 ? 0.04 : 0), 0.1 + p[1]); kt.add(mk); });
  addCol(5.92, 7.28, -0.58, 0.78);
  addInter('kotatsu', 'こたつ', 'こたつに入る', new THREE.Vector3(6.6, 0.4, 0.1), [kt], function () { actKotatsu(); });
  addInter('mikan', 'みかん', 'みかんを食べる', new THREE.Vector3(6.6, 0.5, 0.1), [bowl], function () { actMikan(); }, { reach: 2.0 });
  [[6.6, -0.75], [7.45, 0.1], [6.6, 0.95]].forEach(function (p) { addBox(H, 0.5, 0.06, 0.5, stdMat({ color: 0x5b3a8c, roughness: 1 }), p[0], 0.002, p[1]); });
  // paper lantern
  var lan = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc27a, emissiveIntensity: 1.0 })); lan.scale.y = 1.15; lan.position.set(6.2, 2.05, -0.5); H.add(lan);
  addBox(H, 0.01, 0.2, 0.01, M.black, 6.2, 2.28, -0.5);
  // small chest with a radio
  addBox(H, 0.45, 0.6, 0.8, M.darkWood, 7.7, 0, 1.0, { col: true });
  var radio = addBox(H, 0.3, 0.18, 0.15, stdMat({ color: 0xc9b38a }), 7.7, 0.6, 1.0);
  addInter('radio', 'ラジオ', '音楽をつける/消す', new THREE.Vector3(7.7, 0.7, 1.0), [radio], function () { AU.music = !AU.music; auVol(); sfx('click'); toast(AU.music ? '音楽をつけた' : '音楽を止めた'); });

  // ---------- bath area x4.4..8, z1.5..4.3 (脱衣所 x<5.8, 浴室 x>5.8) ----------
  floorRect(H, 4.4, 5.8, 1.5, 4.3, M.floor);
  floorRect(H, 5.8, 8, 1.5, 4.3, M.tile, 0.003);
  ceilRect(H, 4.4, 8, 1.5, 4.3);
  wallSeg(H, 4.4, 1.5, 8, 1.5, M.wall2, []);
  wallSeg(H, 8, 1.5, 8, 4.3, M.bathTile, []);
  wallSeg(H, 8, 4.3, 4.4, 4.3, M.wall2, []);
  // glass partition with a gap
  var gp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.05), new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.25, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }));
  gp.position.set(5.8, 1.02, 2.0); gp.rotation.y = PI / 2; H.add(gp); addCol(5.76, 5.84, 1.5, 2.5);
  var gp2 = gp.clone(); gp2.position.z = 3.8; H.add(gp2); addCol(5.76, 5.84, 3.3, 4.3);
  addBox(H, 0.05, 0.05, 2.8, M.metal, 5.8, 2.05, 2.9);
  // washing machine & basin
  var wm = new THREE.Group(); H.add(wm);
  addBox(wm, 0.6, 0.85, 0.6, M.white, 4.75, 0, 3.95, { col: true });
  var drum = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), stdMat({ color: 0x223344, roughness: 0.2, metalness: 0.5 })); drum.position.set(4.75, 0.5, 3.645); drum.rotation.y = PI; wm.add(drum);
  addInter('washer', '洗濯機', 'のぞく', new THREE.Vector3(4.75, 0.6, 3.7), [wm], function () { actWasher(); });
  addBox(H, 0.5, 0.82, 0.42, M.white, 5.05, 0, 1.75, { col: true });
  var bsn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.1, 16), M.ceramic); bsn.position.set(5.05, 0.87, 1.75); H.add(bsn);
  addPlane(H, 0.5, 0.6, new THREE.MeshStandardMaterial({ color: 0xa8b8c8, roughness: 0.05, metalness: 1.0 }), 5.05, 1.5, 1.52, 0, 0);
  // bathtub
  var tub = new THREE.Group(); H.add(tub);
  addBox(tub, 1.7, 0.55, 0.06, M.white, 7.05, 0, 2.55); addBox(tub, 0.06, 0.55, 1.0, M.white, 6.2, 0, 2.05); addBox(tub, 1.7, 0.08, 1.0, M.white, 7.05, 0, 2.05);
  var water = addPlane(tub, 1.6, 0.92, M.water, 7.05, 0.46, 2.03, -PI / 2, 0, 4); WORLD.bathWater = water;
  addCol(6.15, 7.95, 1.5, 2.6);
  addInter('tub', '湯船', 'お風呂に入る', new THREE.Vector3(7.05, 0.5, 2.1), [tub], function () { actBath(); });
  // shower
  var shw = new THREE.Group(); H.add(shw);
  addBox(shw, 0.03, 1.2, 0.03, M.metal, 7.95, 0.8, 3.6);
  var head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.04, 14), M.metal); head.rotation.z = PI / 2; head.position.set(7.9, 2.0, 3.6); shw.add(head);
  addBox(shw, 0.1, 0.06, 0.16, M.metal, 7.92, 1.0, 3.6);
  addBox(H, 0.3, 0.25, 0.3, stdMat({ color: 0x7fd1c7 }), 7.3, 0, 3.7);
  var spray = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.8, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.25, emissive: 0x335577, depthWrite: false, side: THREE.DoubleSide }));
  spray.position.set(7.75, 1.08, 3.6); spray.visible = false; H.add(spray); WORLD.spray = spray;
  addInter('shower', 'シャワー', 'シャワーを浴びる', new THREE.Vector3(7.85, 1.3, 3.6), [shw], function () { actShower(); });
  var bl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.5), new THREE.MeshBasicMaterial({ color: 0xf6fbff })); bl.position.set(6.0, 2.48, 2.9); H.add(bl);
}
