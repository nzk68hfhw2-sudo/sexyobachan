// ---- prop models (merged into baked chunks) ------------------------------
var LOCKER_TINT = [[0.32, 0.42, 0.62], [0.7, 0.55, 0.22]];
function buildProp(M, B, p, SP) {
  var li = p.li, Y = LV_Y[li], y = p.y != null ? p.y : Y;
  var f = new PF(B, li, p.x, y, p.z, p.rot);
  var P = MATS.paint, MT = MATS.metalP, WD = MATS.wood, E = MATS.emit;
  switch (p.kind) {
    case 'locker': {
      var tint = LOCKER_TINT[li === 2 ? 1 : 0];
      if ((p.x * 7 | 0) % 11 === 0) tint = [0.55, 0.2, 0.18];
      var v = p.v || 0;
      f.box(MT, 0, 0, -0.02, 0.47, 1.85, 0.43, tint);
      f.part(GEO.plane, MATS.lockers, 0, 0.98, 0.195, 0.46, 1.72, 1, tint, { uv: [v * 0.25, 0, 0.25, 1] });
      f.box(P, 0, 0, 0.17, 0.48, 0.09, 0.03, COL.black);
      if (p.hide) f.box(E, 0.17, 1.62, 0.2, 0.02, 0.02, 0.005, [1, 1, 1], { ov: { on: [0.4, 0.4, 0.38], off: [0.05, 0.05, 0.05] } });
      break;
    }
    case 'desk':
      f.box(WD, 0, 0.7, 0, 0.62, 0.035, 0.47, COL.wood);
      f.box(MT, 0, 0.5, 0.05, 0.56, 0.16, 0.36, [0.35, 0.38, 0.4]);
      [[-0.27, -0.2], [0.27, -0.2], [-0.27, 0.2], [0.27, 0.2]].forEach(function (q) { f.cyl(MT, q[0], 0, q[1], 0.012, 0.7, COL.metal, { six: 1 }); });
      break;
    case 'tdesk':
      f.box(WD, 0, 0.73, 0, 1.55, 0.04, 0.78, COL.woodD);
      f.box(WD, -0.55, 0, 0, 0.42, 0.73, 0.74, [0.55, 0.38, 0.24]); f.box(WD, 0.55, 0, 0, 0.42, 0.73, 0.74, [0.55, 0.38, 0.24]);
      f.box(WD, 0, 0.2, -0.33, 0.7, 0.5, 0.03, [0.5, 0.34, 0.22]);
      f.box(P, 0.35, 0.77, 0.1, 0.25, 0.04, 0.32, [0.8, 0.75, 0.6]); f.cyl(P, -0.4, 0.77, 0.12, 0.05, 0.12, [0.6, 0.15, 0.12]);
      f.sph(P, -0.1, 0.81, 0.15, 0.045, [0.75, 0.12, 0.1]); // apple
      break;
    case 'board': {
      var bt = toTex(mkCanvas(4, 4));
      var bm = bakeMat({ map: bt, shininess: 6, specular: new THREE.Color(0.05, 0.05, 0.05) }, 'probe');
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, 1.6), bm);
      mesh.position.set(p.x + Math.sin(p.rot) * 0.03, y, p.z + Math.cos(p.rot) * 0.03); mesh.rotation.y = p.rot; mesh.updateMatrix(); mesh.matrixAutoUpdate = false;
      SP.boards.push({ li: li, x: p.x, y: y, z: p.z, mesh: mesh, room: p.room, rot: p.rot, w: p.w, lines: p.lines });
      f.box(WD, 0, -0.85, 0.02, p.w + 0.1, 0.06, 0.04, COL.woodD); f.box(WD, 0, 0.8, 0.02, p.w + 0.1, 0.06, 0.04, COL.woodD);
      f.box(WD, 0, -0.86, 0.07, p.w, 0.03, 0.12, COL.woodD); // tray
      f.box(P, -0.8, -0.82, 0.09, 0.14, 0.04, 0.05, [0.9, 0.9, 0.88]); f.box(P, 1.1, -0.83, 0.08, 0.08, 0.015, 0.015, [0.95, 0.95, 0.95]);
      f.box(E, 0, 0.92, 0.12, p.w, 0.05, 0.08, [1, 1, 1], { ov: { on: [1.6, 1.6, 1.5], off: [0.03, 0.03, 0.03] } }); // board light
      break;
    }
    case 'bboard':
      f.box(WD, 0, -0.6, 0, 1.9, 1.25, 0.03, [0.62, 0.45, 0.28]);
      for (var k = 0; k < 7; k++) { var hx = -0.75 + (k % 4) * 0.48 + (k * 0.13 % 0.1), hy = -0.45 + Math.floor(k / 4) * 0.55; f.box(P, hx, hy, 0.02, 0.32, 0.4, 0.005, [[0.95, 0.95, 0.9], [0.95, 0.85, 0.4], [0.6, 0.8, 0.95], [0.95, 0.6, 0.6]][k % 4], { rz: (k % 3 - 1) * 0.08 }); }
      break;
    case 'clock':
      f.part(GEO.cyl, P, 0, 0, 0.02, 0.17, 0.04, 0.17, [0.15, 0.15, 0.15], { rx: PI / 2 });
      f.part(GEO.cyl, E, 0, 0, 0.042, 0.15, 0.005, 0.15, [1, 1, 1], { rx: PI / 2, ov: { on: [1.3, 1.3, 1.25], off: [0.05, 0.05, 0.06] } });
      f.box(P, 0, 0, 0.05, 0.012, 0.1, 0.004, COL.black, { rz: -0.4 }); f.box(P, 0.03, -0.02, 0.05, 0.012, 0.07, 0.004, COL.black, { rz: 1.9 });
      break;
    case 'speaker':
      f.box(P, 0, -0.15, 0.03, 0.32, 0.3, 0.06, [0.78, 0.75, 0.68]);
      for (var s = 0; s < 5; s++) f.box(P, 0, -0.1 + s * 0.045 - 0.04, 0.061, 0.24, 0.012, 0.004, COL.dark);
      break;
    case 'extinguisher':
      f.cyl(P, 0, -0.35, 0.1, 0.07, 0.5, COL.red); f.box(P, 0, 0.15, 0.1, 0.04, 0.06, 0.04, COL.black);
      f.box(E, 0, 0.45, 0.01, 0.25, 0.25, 0.01, [1, 1, 1], { ov: { on: [1.4, 0.2, 0.15], off: [0.05, 0.01, 0.01] } });
      break;
    case 'flag': {
      f.cyl(MT, 0, 0, 0, 0.02, 2.4, [0.8, 0.7, 0.3]); f.sph(MT, 0, 2.42, 0, 0.04, [0.9, 0.8, 0.3]);
      f.box(P, 0, 1.6, 0.4, 0.01, 0.6, 0.8, [0.18, 0.2, 0.42]); f.box(P, 0.006, 1.6, 0.4, 0.01, 0.1, 0.8, [0.85, 0.85, 0.82]);
      f.box(E, 0.008, 1.8, 0.25, 0.01, 0.12, 0.12, [1, 1, 1], { ov: { on: [1.6, 1.4, 0.4], off: [0.06, 0.05, 0.02] } });
      break;
    }
    case 'trophy':
      f.box(WD, 0, 0, 0, 2.0, 0.8, 0.45, COL.woodD); f.box(WD, 0, 2.1, 0, 2.0, 0.12, 0.45, COL.woodD);
      f.box(P, 0, 0.8, -0.2, 2.0, 1.3, 0.03, [0.15, 0.1, 0.08]);
      [1.0, 1.45].forEach(function (sh) { f.box(MT, 0, 0.8 + sh - 0.75, 0, 1.95, 0.02, 0.4, [0.7, 0.72, 0.72]); });
      for (var t = 0; t < 9; t++) { var tx = -0.8 + t * 0.2, ty = t < 5 ? 0.82 : 1.27; f.cyl(MT, tx, ty, 0, 0.035, 0.12 + (t % 3) * 0.08, [0.85, 0.65, 0.2]); f.sph(MT, tx, ty + 0.2 + (t % 3) * 0.08, 0, 0.05, [0.9, 0.7, 0.25]); }
      f.box(E, 0.6, 1.72, -0.15, 0.4, 0.3, 0.01, [1, 1, 1], { ov: { on: [0.9, 0.8, 0.6], off: [0.04, 0.04, 0.04] } }); // team photo
      WORLD_GLASS.push({ li: li, x: p.x + Math.sin(p.rot) * 0.23, y: y + 1.45, z: p.z + Math.cos(p.rot) * 0.23, rot: p.rot, w: 2.0, h: 1.3 });
      break;
    case 'fountain':
      f.box(MT, 0, 0.6, 0, 0.5, 0.35, 0.4, COL.steel); f.box(MT, 0, 0.94, 0.02, 0.4, 0.02, 0.3, [0.6, 0.62, 0.65]);
      f.box(MT, 0, 0.0, -0.1, 0.12, 0.6, 0.12, COL.steel);
      break;
    case 'cctv':
      f.box(P, 0, -0.08, 0.1, 0.12, 0.1, 0.25, [0.85, 0.85, 0.82], { rx: 0.4 }); f.box(P, 0, 0, 0, 0.05, 0.05, 0.12, COL.dark);
      f.sph(E, 0.04, -0.05, 0.24, 0.012, [1, 1, 1], { ov: { on: [2, 0.1, 0.1], off: [2, 0.1, 0.1] } });
      break;
    case 'paper':
      f.part(GEO.plane, P, 0, 0.006, 0, 0.22, 0.28, 1, [0.82, 0.8, 0.74], { rx: -PI / 2 });
      break;
    case 'emerg':
      f.box(P, 0, -0.12, 0.05, 0.36, 0.14, 0.1, [0.85, 0.84, 0.8]);
      [-0.12, 0.12].forEach(function (ex) { f.sph(E, ex, -0.15, 0.14, 0.05, [1, 1, 1], { ov: { on: [0.3, 0.3, 0.3], off: [2, 2, 2], em: 1 } }); });
      break;
    case 'tree': {
      var sc = p.s || 1;
      f.cyl(P, 0, 0, 0, 0.18 * sc, 2.2 * sc, [0.2, 0.14, 0.1]);
      for (var tl = 0; tl < 5; tl++) f.part(GEO.cone, P, 0, (1.8 + tl * 1.4) * sc, 0, (2.3 - tl * 0.4) * sc, 2.4 * sc, (2.3 - tl * 0.4) * sc, [0.06, 0.11, 0.08]);
      break;
    }
    case 'flagpole':
      f.cyl(MT, 0, 0, 0, 0.06, 9, [0.7, 0.72, 0.74]); f.sph(MT, 0, 9.05, 0, 0.12, [0.8, 0.7, 0.3]);
      f.box(P, 0.75, 7.6, 0, 1.4, 0.9, 0.02, [0.18, 0.2, 0.42], { rz: 0.04 });
      f.box(E, 0.5, 7.75, 0.012, 0.45, 0.45, 0.004, [1, 1, 1], { ov: { on: [0.6, 0.55, 0.2], off: [0.25, 0.22, 0.1] } });
      break;
    case 'schoolsign':
      f.box(MATS.brick, 0, 0, 0, 3.2, 0.8, 0.5, null);
      f.box(E, 0, 0.8, 0, 3.0, 1.1, 0.12, [1, 1, 1], { ov: { on: [0.9, 0.85, 0.7], off: [0.7, 0.66, 0.55] } });
      SP.plates.push({ kind: 'marquee', li: 1, x: p.x, y: 1.35, z: p.z + 0.07, rot: 0 });
      SP.plates.push({ kind: 'marquee', li: 1, x: p.x, y: 1.35, z: p.z - 0.07, rot: PI });
      break;
    case 'lamppost':
      f.cyl(MT, 0, 0, 0, 0.08, 5.6, [0.35, 0.36, 0.38]); f.box(MT, 0.4, 5.6, 0, 0.9, 0.08, 0.1, [0.35, 0.36, 0.38]);
      f.box(E, 0.8, 5.45, 0, 0.45, 0.14, 0.3, [1, 1, 1], { ov: { on: [2, 1.2, 0.5], off: [2, 1.2, 0.5] } });
      break;
    case 'fence':
      for (var fx = -19; fx <= 83; fx += 3) { var fp = new PF(B, 1, fx, 0, -16.6, 0); fp.cyl(MT, 0, 0, 0, 0.04, 1.9, [0.45, 0.46, 0.47]); fp.box(MT, 1.5, 1.85, 0, 3, 0.04, 0.04, [0.45, 0.46, 0.47]); fp.box(MATS.paint, 1.5, 0, 0, 3, 1.85, 0.01, [0.22, 0.24, 0.25]); }
      break;
    case 'busbody': buildBus(B, p); break;
    case 'counter':
      f.box(WD, 0, 0, 0, p.len, 1.05, 0.6, [0.6, 0.45, 0.3]); f.box(P, 0, 1.05, 0, p.len + 0.05, 0.04, 0.66, [0.75, 0.72, 0.65]);
      f.box(P, 0.6, 1.09, 0.1, 0.4, 0.3, 0.35, [0.82, 0.8, 0.72]); f.box(E, 0.6, 1.17, 0.28, 0.3, 0.2, 0.005, [1, 1, 1], { ov: { on: [0.15, 0.35, 0.2], off: [0.02, 0.06, 0.03] } }); // old computer
      f.box(P, -1.4, 1.09, 0, 0.25, 0.08, 0.2, [0.25, 0.25, 0.25]); // bell
      break;
    case 'bench':
      f.box(WD, 0, 0.42, 0, 2.0, 0.05, 0.4, COL.wood); [-0.85, 0.85].forEach(function (bx) { f.box(MT, bx, 0, 0, 0.05, 0.42, 0.35, COL.dark); });
      break;
    case 'standee':
      SP.plates.push({ kind: 'standee', li: li, x: p.x, y: 0, z: p.z, rot: p.rot });
      break;
    case 'ctable':
      f.box(P, 0, 0.72, 0, 0.9, 0.04, p.len, [0.72, 0.7, 0.62]); f.box(MT, 0, 0.0, 0, 0.06, 0.72, p.len * 0.8, COL.dark);
      f.box(MT, 0, 0, 0, 0.8, 0.04, 0.06, COL.dark); f.box(MT, 0, 0, p.len * 0.4, 0.8, 0.04, 0.06, COL.dark); f.box(MT, 0, 0, -p.len * 0.4, 0.8, 0.04, 0.06, COL.dark);
      f.box(P, 0.1, 0.76, 0.6, 0.35, 0.02, 0.25, [0.85, 0.7, 0.3]); f.box(P, -0.15, 0.76, -1.1, 0.3, 0.02, 0.22, [0.6, 0.75, 0.85]); // trays
      break;
    case 'servecounter':
      f.box(MT, 0, 0, 0, p.len, 0.9, 0.7, COL.steel); f.box(MT, 0, 0.9, 0, p.len, 0.03, 0.75, [0.8, 0.82, 0.84]);
      for (var sp = 0; sp < 6; sp++) f.box(MT, -p.len / 2 + 1.2 + sp * 2.2, 0.86, 0, 0.8, 0.06, 0.5, [0.5, 0.52, 0.55]);
      f.box(MT, 0, 1.32, 0.15, p.len, 0.02, 0.4, [0.75, 0.78, 0.8]);
      break;
    case 'stove':
      f.box(MT, 0, 0, 0, 1.1, 0.9, 0.8, [0.7, 0.72, 0.74]); f.box(P, 0, 0.9, 0, 1.0, 0.04, 0.7, COL.dark);
      for (var bn = 0; bn < 4; bn++) f.cyl(P, -0.25 + (bn % 2) * 0.5, 0.94, -0.15 + Math.floor(bn / 2) * 0.3, 0.1, 0.01, COL.black);
      f.box(P, 0, 0.3, 0.41, 0.8, 0.4, 0.01, [0.2, 0.2, 0.2]);
      break;
    case 'vending':
      f.box(P, 0, 0, 0, 0.95, 1.85, 0.8, [0.6, 0.1, 0.1]);
      f.box(E, -0.12, 0.6, 0.405, 0.6, 1.1, 0.01, [1, 1, 1], { ov: { on: [1.2, 1.5, 1.6], off: [0.7, 1.0, 1.2] } });
      f.box(E, 0.34, 1.0, 0.405, 0.14, 0.3, 0.01, [1, 1, 1], { ov: { on: [0.3, 1.2, 0.4], off: [0.2, 0.9, 0.3] } });
      f.box(P, 0, 0.12, 0.41, 0.7, 0.18, 0.02, COL.black);
      break;
    case 'trash':
      f.cyl(P, 0, 0, 0, 0.28, 0.85, [0.35, 0.4, 0.5]); f.cyl(P, 0, 0.85, 0, 0.3, 0.05, [0.25, 0.3, 0.38]);
      break;
    case 'bleachers':
      for (var row = 0; row < 7; row++) {
        var by = 0.3 + row * 0.42, bz = -2.1 + row * 0.62;
        f.box(WD, 0, by, bz, p.len, 0.05, 0.3, [0.75, 0.55, 0.32]);
        f.box(WD, 0, by - 0.42, bz + 0.2, p.len, 0.04, 0.3, [0.6, 0.44, 0.26]);
        for (var bs = -p.len / 2; bs <= p.len / 2; bs += 2) f.box(MT, bs, 0, bz, 0.05, by, 0.05, COL.dark);
      }
      f.box(MT, 0, 0, 2.3, p.len, 3.2, 0.05, [0.35, 0.35, 0.37]);
      f.box(MT, -p.len / 2, 0, 0, 0.05, 3.2, 4.4, [0.35, 0.35, 0.37]); f.box(MT, p.len / 2, 0, 0, 0.05, 3.2, 4.4, [0.35, 0.35, 0.37]);
      break;
    case 'hoop':
      f.box(MT, 0, 3.4, -0.3, 0.12, 0.12, 0.7, COL.dark);
      f.box(P, 0, 2.95, 0.05, 1.8, 1.05, 0.04, [0.9, 0.9, 0.9]); f.box(P, 0, 3.05, 0.075, 0.6, 0.45, 0.01, [0.75, 0.2, 0.15]);
      f.part(GEO.cyl, MT, 0, 3.05, 0.3, 0.23, 0.02, 0.23, [0.9, 0.35, 0.1]);
      for (var ng = 0; ng < 8; ng++) { var a = ng / 8 * TAU; f.box(P, Math.cos(a) * 0.2, 2.75, 0.3 + Math.sin(a) * 0.2, 0.01, 0.3, 0.01, [0.9, 0.9, 0.9]); }
      break;
    case 'scoreboard':
      f.box(P, 0, -0.9, 0.05, 4, 1.8, 0.15, COL.black);
      SP.plates.push({ kind: 'score', li: 1, x: p.x, y: y, z: p.z + 0.14, rot: p.rot });
      break;
    case 'mats': for (var mt = 0; mt < 5; mt++) f.box(P, 0, mt * 0.12, 0, 1.9, 0.11, 1.9, mt % 2 ? [0.2, 0.3, 0.6] : [0.7, 0.2, 0.2]); break;
    case 'ballcart':
      f.box(MT, 0, 0.1, 0, 0.8, 0.5, 0.5, COL.dark);
      for (var bb = 0; bb < 6; bb++) f.sph(P, -0.25 + (bb % 3) * 0.25, 0.7 + Math.floor(bb / 3) * 0.2, -0.1 + Math.floor(bb / 3) * 0.2, 0.12, [0.8, 0.4, 0.15]);
      break;
    case 'labbench':
      f.box(WD, 0, 0, 0, 0.75, 0.88, p.len, [0.45, 0.32, 0.2]); f.box(P, 0, 0.88, 0, 0.8, 0.05, p.len + 0.05, [0.08, 0.08, 0.09]);
      f.box(MT, 0, 0.93, -p.len * 0.3, 0.3, 0.02, 0.4, [0.4, 0.42, 0.44]); f.cyl(MT, -0.25, 0.93, -p.len * 0.3, 0.015, 0.35, COL.steel);
      for (var gz = -1; gz <= 1; gz++) { f.cyl(MT, -0.3, 0.93, gz * 1.2, 0.012, 0.1, [0.7, 0.6, 0.2]); f.cyl(P, 0.1, 0.93, gz * 1.3 + 0.3, 0.04, 0.16, [0.6, 0.9, 0.8]); }
      break;
    case 'skeleton':
      f.cyl(MT, 0, 0, 0, 0.15, 0.03, COL.dark); f.cyl(MT, 0, 0, 0, 0.015, 1.1, COL.dark);
      f.sph(P, 0, 1.62, 0, 0.11, [0.92, 0.9, 0.82], { sy: 0.13 }); f.box(P, 0, 1.12, 0, 0.3, 0.38, 0.16, [0.88, 0.86, 0.78]);
      f.box(P, 0, 0.72, 0, 0.04, 0.4, 0.04, [0.88, 0.86, 0.78]); f.box(P, 0, 0.88, 0, 0.28, 0.1, 0.12, [0.88, 0.86, 0.78]);
      [-0.1, 0.1].forEach(function (lx) { f.box(P, lx, 0.05, 0, 0.04, 0.8, 0.04, [0.88, 0.86, 0.78]); f.box(P, lx * 2.1, 0.75, 0, 0.035, 0.6, 0.035, [0.88, 0.86, 0.78], { rz: lx * 0.6 }); });
      f.box(P, -0.04, 1.6, 0.1, 0.03, 0.03, 0.01, COL.black); f.box(P, 0.04, 1.6, 0.1, 0.03, 0.03, 0.01, COL.black);
      break;
    case 'cabinet': f.box(MT, 0, 0, 0, 0.9, 1.9, 0.5, [0.7, 0.72, 0.7]); f.box(P, 0, 0.0, 0.251, 0.01, 1.85, 0.005, COL.dark); f.box(MT, 0.08, 1.0, 0.26, 0.03, 0.15, 0.02, COL.dark); break;
    case 'piano':
      f.box(WD, 0, 0, 0, 1.5, 1.25, 0.6, [0.22, 0.12, 0.08]); f.box(P, 0, 0.72, 0.38, 1.4, 0.04, 0.2, [0.95, 0.94, 0.9]);
      for (var key = 0; key < 20; key++) if (key % 7 !== 2 && key % 7 !== 6) f.box(P, -0.66 + key * 0.07, 0.75, 0.33, 0.035, 0.03, 0.1, COL.black);
      f.box(WD, 0, 0.6, 0.35, 1.5, 0.12, 0.25, [0.22, 0.12, 0.08]);
      break;
    case 'stand': f.cyl(MT, 0, 0, 0, 0.012, 1.0, COL.dark); f.box(MT, 0, 1.0, 0, 0.45, 0.32, 0.01, COL.dark, { rx: -0.35 }); break;
    case 'drums':
      f.cyl(P, 0, 0, 0, 0.3, 0.45, [0.7, 0.12, 0.12]); f.cyl(P, 0.5, 0.5, 0.2, 0.18, 0.18, [0.9, 0.9, 0.88]); f.cyl(MT, -0.5, 0.95, 0.2, 0.22, 0.01, [0.8, 0.65, 0.2]); f.cyl(MT, -0.5, 0, 0.2, 0.01, 0.95, COL.dark);
      break;
    case 'arttable':
      f.box(WD, 0, 0.74, 0, 1.2, 0.05, 1.8, [0.8, 0.7, 0.55]);
      [[-0.55, -0.85], [0.55, -0.85], [-0.55, 0.85], [0.55, 0.85]].forEach(function (q) { f.box(WD, q[0], 0, q[1], 0.06, 0.74, 0.06, [0.6, 0.5, 0.35]); });
      for (var sp2 = 0; sp2 < 5; sp2++) f.box(P, (sp2 * 0.31 % 1) - 0.4, 0.795, (sp2 * 0.47 % 1.4) - 0.7, 0.18, 0.003, 0.12, [[0.8, 0.2, 0.2], [0.2, 0.4, 0.8], [0.9, 0.8, 0.2], [0.2, 0.6, 0.3], [0.1, 0.1, 0.1]][sp2]);
      break;
    case 'easel':
      f.box(WD, 0, 0, -0.15, 0.04, 1.7, 0.04, COL.wood, { rx: -0.15 }); f.box(WD, -0.3, 0, 0.1, 0.04, 1.6, 0.04, COL.wood, { rz: -0.1 }); f.box(WD, 0.3, 0, 0.1, 0.04, 1.6, 0.04, COL.wood, { rz: 0.1 });
      SP.plates.push({ kind: 'drawing', li: li, x: p.x + Math.sin(p.rot) * 0.16, y: Y + 1.25, z: p.z + Math.cos(p.rot) * 0.16, rot: p.rot });
      break;
    case 'paint': for (var pp = 0; pp < 6; pp++) f.part(GEO.cyl, P, (pp * 0.73 % 4) - 2, 0.004, (pp * 1.37 % 4) - 2, 0.1 + pp * 0.03, 0.002, 0.08 + pp * 0.02, [[0.7, 0.1, 0.1], [0.1, 0.3, 0.7], [0.8, 0.7, 0.1]][pp % 3]); break;
    case 'shelf': {
      var col = p.metal ? [0.5, 0.52, 0.5] : [0.45, 0.3, 0.18];
      var mat = p.metal ? MT : WD;
      f.box(mat, 0, 0, 0, 0.45, 2.1, p.len, col);
      if (!p.metal) {
        for (var sl = 0; sl < 5; sl++) for (var side = -1; side <= 1; side += 2) f.part(GEO.plane, MATS.books || (MATS.books = makeBooksMat()), side * 0.226, 0.25 + sl * 0.4, 0, p.len - 0.1, 0.33, 1, [1, 1, 1], { ry: side * PI / 2, uv: [sl * 0.2 * 0.5, 0, 1, 1] });
      } else {
        for (var bx2 = 0; bx2 < 6; bx2++) f.box(P, 0, 0.1 + (bx2 % 3) * 0.7, -p.len / 2 + 0.5 + bx2 * 0.9, 0.4, 0.3, 0.5, [0.62, 0.5, 0.36]);
      }
      break;
    }
    case 'ltable': f.box(WD, 0, 0.72, 0, 1.0, 0.04, 1.6, [0.7, 0.55, 0.35]); [[-0.45, -0.7], [0.45, -0.7], [-0.45, 0.7], [0.45, 0.7]].forEach(function (q) { f.box(WD, q[0], 0, q[1], 0.05, 0.72, 0.05, [0.5, 0.38, 0.25]); }); break;
    case 'cardcat': f.box(WD, 0, 0, 0, 0.9, 1.3, 0.5, [0.55, 0.38, 0.22]); for (var dr = 0; dr < 12; dr++) f.box(MT, -0.3 + (dr % 4) * 0.2, 0.2 + Math.floor(dr / 4) * 0.38, 0.252, 0.06, 0.02, 0.01, [0.8, 0.7, 0.3]); break;
    case 'cot':
      f.box(MT, 0, 0.4, 0, 1.9, 0.12, 0.75, [0.85, 0.85, 0.85]); f.box(P, 0, 0.52, 0, 1.85, 0.03, 0.72, [0.95, 0.95, 0.92]);
      f.box(P, -0.75, 0.55, 0, 0.35, 0.08, 0.5, [0.95, 0.95, 0.95]);
      [[-0.9, -0.33], [0.9, -0.33], [-0.9, 0.33], [0.9, 0.33]].forEach(function (q) { f.box(MT, q[0], 0, q[1], 0.03, 0.4, 0.03, COL.metal); });
      break;
    case 'curtain': f.box(MT, 0, 2.2, 0, 0.02, 0.02, 1.8, COL.metal); f.box(P, 0, 0.3, 0, 0.02, 1.9, 1.7, [0.55, 0.7, 0.68]); break;
    case 'filing': f.box(MT, 0, 0, 0, 0.5, 1.35, 0.6, [0.55, 0.56, 0.5]); for (var fd = 0; fd < 4; fd++) f.box(MT, 0, 0.15 + fd * 0.32, 0.301, 0.2, 0.03, 0.02, COL.dark); break;
    case 'pamic': f.cyl(MT, 0, 0, 0, 0.06, 0.02, COL.dark); f.cyl(MT, 0, 0, 0, 0.008, 0.3, COL.dark); f.sph(MT, 0, 0.32, 0.03, 0.035, [0.6, 0.6, 0.6]); break;
    case 'tvcart': {
      f.box(MT, 0, 0.15, 0, 0.7, 0.03, 0.5, COL.dark); f.box(MT, 0, 0.8, 0, 0.7, 0.03, 0.5, COL.dark);
      [[-0.32, -0.22], [0.32, -0.22], [-0.32, 0.22], [0.32, 0.22]].forEach(function (q) { f.box(MT, q[0], 0.05, q[1], 0.03, 0.78, 0.03, COL.dark); });
      f.box(P, 0, 0.83, -0.05, 0.62, 0.52, 0.5, [0.2, 0.2, 0.21]);
      f.box(P, 0, 0.2, 0, 0.45, 0.1, 0.35, [0.15, 0.15, 0.15]); // VCR
      var tvm = makeTVScreen(); tvm.position.set(p.x + Math.sin(p.rot) * 0.2, y + 1.09, p.z + Math.cos(p.rot) * 0.2); tvm.rotation.y = p.rot;
      SP.tvs.push({ mesh: tvm, li: li, x: p.x, z: p.z, rot: p.rot });
      break;
    }
    case 'vhsshelf':
      f.box(WD, 0, 0, 0, 0.4, 2.0, p.len, [0.35, 0.25, 0.18]);
      for (var vs = 0; vs < 4; vs++) for (var vb = 0; vb < 14; vb++) f.box(P, 0.2, 0.2 + vs * 0.45, -p.len / 2 + 0.2 + vb * 0.27, 0.02, 0.2, 0.025, vb % 3 ? COL.black : [0.9, 0.85, 0.7]);
      break;
    case 'vcr':
      f.box(WD, 0, 0, 0, 0.8, 0.75, 1.1, COL.woodD);
      f.box(P, 0, 0.75, 0, 0.62, 0.52, 0.5, [0.2, 0.2, 0.21]); f.box(P, 0.2, 0.75, 0, 0.1, 0.08, 0.35, COL.black);
      var tv2 = makeTVScreen(); tv2.position.set(p.x + Math.sin(p.rot) * 0.26, y + 1.01, p.z + Math.cos(p.rot) * 0.26); tv2.rotation.y = p.rot;
      SP.tvs.push({ mesh: tv2, li: li, x: p.x, z: p.z, rot: p.rot, vcr: true });
      break;
    case 'stall':
      f.box(P, -0.68, 0.15, 0, 0.04, 1.7, 1.5, [0.55, 0.62, 0.6]); f.box(P, 0.68, 0.15, 0, 0.04, 1.7, 1.5, [0.55, 0.62, 0.6]);
      f.box(P, 0, 0.15, 0.72, 1.3, 1.7, 0.04, [0.6, 0.67, 0.64], { ry: 0.0 });
      f.box(P, 0.4, 1.0, 0.75, 0.08, 0.05, 0.03, COL.metal);
      f.box(P, 0, 0, -0.45, 0.4, 0.42, 0.55, [0.95, 0.95, 0.92]); f.box(P, 0, 0.42, -0.65, 0.42, 0.35, 0.2, [0.95, 0.95, 0.92]);
      break;
    case 'sink': f.box(P, 0, 0.78, 0, 0.55, 0.15, 0.45, [0.95, 0.95, 0.93]); f.box(MT, 0, 0.0, -0.15, 0.06, 0.78, 0.06, COL.metal); f.cyl(MT, 0, 0.92, -0.12, 0.015, 0.15, COL.steel); break;
    case 'mirror':
      f.box(MT, 0, -0.45, 0, p.w + 0.06, 0.96, 0.02, COL.steel);
      f.box(P, 0, -0.42, 0.012, p.w, 0.9, 0.005, [0.08, 0.1, 0.11]);
      SP.mirrors.push({ li: li, x: p.x + Math.sin(p.rot) * 0.03, y: y, z: p.z + Math.cos(p.rot) * 0.03, rot: p.rot, w: p.w });
      break;
    case 'couch':
      f.box(P, 0, 0.2, 0, 2.2, 0.25, 0.85, [0.45, 0.32, 0.24]); f.box(P, 0, 0.2, -0.35, 2.2, 0.75, 0.2, [0.42, 0.3, 0.22]);
      f.box(P, -1.05, 0.2, 0, 0.18, 0.5, 0.85, [0.42, 0.3, 0.22]); f.box(P, 1.05, 0.2, 0, 0.18, 0.5, 0.85, [0.42, 0.3, 0.22]);
      break;
    case 'fridge': f.box(P, 0, 0, 0, 0.75, 1.75, 0.7, [0.85, 0.84, 0.78]); f.box(MT, 0.3, 0.8, 0.36, 0.03, 0.5, 0.03, COL.steel); break;
    case 'boxes': { var s2 = p.s || 1; f.box(P, 0, 0, 0, 0.7 * s2, 0.55 * s2, 0.6 * s2, [0.62, 0.48, 0.32]); if (s2 > 0.85) f.box(P, 0.05, 0.55 * s2, 0, 0.5 * s2, 0.4 * s2, 0.45 * s2, [0.66, 0.52, 0.36], { ry: 0.3 }); f.box(P, 0, 0.55 * s2 - 0.01, 0, 0.71 * s2, 0.012, 0.08, [0.7, 0.66, 0.5]); break; }
    case 'plant': f.cyl(P, 0, 0, 0, 0.18, 0.35, [0.6, 0.35, 0.2]); f.sph(P, 0, 0.6, 0, 0.3, [0.25, 0.18, 0.1], { sy: 0.4 }); break; // dead plant
    case 'globe': f.cyl(MT, 0, 0, 0, 0.08, 0.02, COL.dark); f.cyl(MT, 0, 0, 0, 0.01, 0.15, COL.dark); f.sph(P, 0, 0.3, 0, 0.15, [0.25, 0.45, 0.6]); break;
    case 'bulb': break; // handled by fixture
    case 'pipes':
      for (var pi = 0; pi < 3; pi++) f.part(GEO.cyl, MT, 0, 2.35 + pi * 0.12 - 4, -0.2 * pi, 0.06, 30, 0.06, [0.45, 0.35, 0.25], { rz: PI / 2 });
      break;
    case 'boilertank':
      f.part(GEO.cyl, MT, 0, 1.5, 0, 1.3, 3.2, 1.3, [0.42, 0.36, 0.3]);
      f.box(MT, 0, 0.3, 1.25, 0.5, 0.35, 0.1, COL.dark);
      f.box(E, 0, 0.35, 1.31, 0.4, 0.22, 0.01, [1, 1, 1], { ov: { on: [2, 0.8, 0.2], off: [2, 0.7, 0.15] } });
      f.cyl(MT, 0.7, 2.8, 0, 0.12, 0.6, COL.dark);
      for (var gg = 0; gg < 2; gg++) f.part(GEO.cyl, E, -0.5 + gg * 0.4, 1.6, 1.31, 0.08, 0.01, 0.08, [1, 1, 1], { rx: PI / 2, ov: { on: [1, 1, 0.9], off: [0.4, 0.4, 0.35] } });
      break;
    case 'costume': buildCostume(f, p.who); break;
    default: break;
  }
}
function makeBooksMat() {
  var c = mkCanvas(512, 128), g = c.getContext('2d'), rnd = makeRNG(77);
  g.fillStyle = '#2a1d14'; g.fillRect(0, 0, 512, 128);
  for (var x = 0; x < 512;) { var w = 6 + rnd() * 12, h = 80 + rnd() * 44; var hue = rnd(); g.fillStyle = 'hsl(' + (hue * 360 | 0) + ',' + (25 + rnd() * 35 | 0) + '%,' + (18 + rnd() * 30 | 0) + '%)'; if (rnd() < 0.08) { x += w; continue; } g.fillRect(x, 128 - h, w - 1, h); g.fillStyle = 'rgba(230,210,150,0.5)'; g.fillRect(x + 1, 128 - h + 10, w - 3, 2); x += w; }
  var t = toTex(c); t.repeat.set(4, 1);
  return bakeMat({ map: t, vertexColors: true, shininess: 4 });
}
function buildCostume(f, who) {
  var P = MATS.paint, MT = MATS.metalP;
  f.box(MT, 0, 2.2, 0, 1.0, 0.03, 0.03, COL.metal); f.box(MT, 0, 2.15, 0, 0.02, 0.1, 0.02, COL.dark);
  if (who === 'penny') { // pencil girl: yellow body, pink eraser head
    f.cyl(P, 0, 0.55, 0, 0.32, 1.25, [0.85, 0.7, 0.2], { six: 1 }); f.part(GEO.cone, P, 0, 0.35, 0, 0.32, 0.4, 0.32, [0.8, 0.65, 0.5], { rx: PI });
    f.cyl(MT, 0, 1.8, 0, 0.33, 0.12, [0.7, 0.7, 0.7]); f.cyl(P, 0, 1.92, 0, 0.32, 0.22, [0.9, 0.55, 0.62]);
    f.box(P, 0, 1.2, 0.3, 0.5, 0.5, 0.05, [0.4, 0.1, 0.1]); // stain
  } else if (who === 'bitsy') { // bookworm: green segments, glasses
    for (var s = 0; s < 4; s++) f.sph(P, 0, 0.5 + s * 0.38, 0, 0.3 - s * 0.02, [0.35, 0.62, 0.3]);
    f.box(P, -0.1, 1.72, 0.25, 0.14, 0.12, 0.02, COL.black); f.box(P, 0.1, 1.72, 0.25, 0.14, 0.12, 0.02, COL.black);
    f.box(P, 0, 1.0, 0.27, 0.35, 0.3, 0.02, [0.35, 0.08, 0.08]);
  } else { // hamster: brown round
    f.sph(P, 0, 1.1, 0, 0.5, [0.62, 0.42, 0.25], { sy: 0.62 }); f.sph(P, 0, 1.85, 0, 0.32, [0.65, 0.45, 0.28]);
    f.sph(P, -0.22, 2.1, 0, 0.09, [0.85, 0.6, 0.55]); f.sph(P, 0.22, 2.1, 0, 0.09, [0.85, 0.6, 0.55]);
    f.box(P, 0, 0.9, 0.48, 0.3, 0.6, 0.02, [0.3, 0.05, 0.05]);
  }
}
function buildBus(B, p) {
  var f = new PF(B, 1, p.x, 0, p.z, 0);
  var Y = [0.95, 0.68, 0.08], P = MATS.paint, MT = MATS.metalP, E = MATS.emit;
  var L = 11, Wd = 2.9;
  // floor & roof
  f.box(P, 0, 0.0, 0, L, 0.06, Wd, [0.3, 0.3, 0.3]);
  f.box(P, 0, 2.45, 0, L, 0.08, Wd, Y); f.box(P, 0, 2.43, 0, L - 0.2, 0.02, Wd - 0.2, [0.8, 0.78, 0.7]);
  // sides: lower panels, window posts, upper band
  [-1, 1].forEach(function (sd) {
    var z = sd * Wd / 2;
    var doorSide = sd === 1;
    for (var x = -L / 2; x < L / 2 - 0.01; x += 1.0) {
      var isDoor = doorSide && x > 3.4 && x < 4.6;
      if (!isDoor) f.box(P, x + 0.5, 0.06, z, 1.0, 1.1, 0.06, Y);
      f.box(P, x + 0.05, 1.16, z, 0.1, 0.9, 0.07, isDoor ? [0.2, 0.2, 0.2] : Y);
    }
    f.box(P, 0, 2.06, z, L, 0.4, 0.06, Y);
    f.box(P, 0, 0.66, z + sd * 0.035, L, 0.06, 0.01, COL.black); f.box(P, 0, 0.88, z + sd * 0.035, L, 0.06, 0.01, COL.black);
  });
  // front/back
  f.box(P, -L / 2, 0.06, 0, 0.06, 2.4, Wd, Y); f.box(P, L / 2, 0.06, 0, 0.06, 1.1, Wd, Y); f.box(P, L / 2, 2.0, 0, 0.06, 0.45, Wd, Y);
  f.box(P, L / 2 + 0.9, 0.3, 0, 1.8, 0.9, Wd - 0.1, Y); // hood
  f.box(E, L / 2 + 1.81, 0.7, 0.9, 0.02, 0.2, 0.3, [1, 1, 1], { ov: { on: [1, 0.95, 0.8], off: [0.4, 0.38, 0.3] } }); f.box(E, L / 2 + 1.81, 0.7, -0.9, 0.02, 0.2, 0.3, [1, 1, 1], { ov: { on: [1, 0.95, 0.8], off: [0.4, 0.38, 0.3] } });
  [[-3.5, 1], [-3.5, -1], [3.8, 1], [3.8, -1]].forEach(function (w) { f.part(GEO.cyl, P, w[0], 0.45, w[1] * (Wd / 2 + 0.05), 0.48, 0.32, 0.48, COL.black, { rx: PI / 2 }); });
  f.box(E, -L / 2 - 0.02, 1.9, 0.9, 0.02, 0.2, 0.2, [1, 1, 1], { ov: { on: [2, 0.2, 0.1], off: [1.6, 0.1, 0.05] } }); f.box(E, -L / 2 - 0.02, 1.9, -0.9, 0.02, 0.2, 0.2, [1, 1, 1], { ov: { on: [2, 0.2, 0.1], off: [1.6, 0.1, 0.05] } });
  // stop arm
  f.part(GEO.cyl, P, 3.0, 1.4, Wd / 2 + 0.25, 0.22, 0.02, 0.22, [0.8, 0.1, 0.1], { rx: PI / 2 });
  // driver seat + wheel
  f.box(P, 4.6, 0.4, -0.8, 0.5, 0.5, 0.5, [0.2, 0.3, 0.25]); f.part(GEO.cyl, P, 5.1, 1.1, -0.8, 0.22, 0.03, 0.22, COL.black, { rz: 1.1 });
  // windows glass
  [-1, 1].forEach(function (sd) { WORLD_GLASS.push({ li: 1, x: p.x, y: 1.6, z: p.z + sd * Wd / 2, rot: sd === 1 ? 0 : PI, w: L, h: 0.85, bus: true }); });
  B.busText = true;
}

// ---- TV screen (shader: static noise / content) ---------------------------
var TV_MATS = [];
function makeTVScreen() {
  var m = new THREE.ShaderMaterial({
    uniforms: { uTime: LIGHTU.uTime, uOn: { value: 0 }, uFace: { value: null }, uFaceAmt: { value: 0 }, uSeed: { value: Math.random() * 100 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uTime,uOn,uFaceAmt,uSeed; uniform sampler2D uFace; varying vec2 vUv;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}' +
      'void main(){ vec2 uv=vUv; vec2 c=uv-0.5; float vig=1.0-dot(c,c)*1.6;' +
      ' float n=h(floor(uv*vec2(160.0,120.0))+floor(uTime*30.0)+uSeed);' +
      ' float roll=smoothstep(0.0,0.08,abs(fract(uv.y-uTime*0.3)-0.5));' +
      ' vec3 col=vec3(n)*0.75*roll+0.05; col*=0.8+0.2*sin(uv.y*400.0);' +
      ' if(uFaceAmt>0.0){ vec2 fu=uv+vec2(h(vec2(floor(uv.y*40.0),floor(uTime*20.0)))*0.06-0.03,0.0); vec3 f=texture2D(uFace,fu).rgb; col=mix(col,f*1.3+n*0.15,uFaceAmt); }' +
      ' gl_FragColor=vec4(col*vig*uOn+vec3(0.01,0.012,0.012)*(1.0-uOn),1.0); }'
  });
  TV_MATS.push(m);
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), m);
  return mesh;
}

// ---- doors -----------------------------------------------------------------
function buildDoors(M, bk, group) {
  var out = [];
  var woodTex = toTex(texDoor(3, ''));
  M.doors.forEach(function (d) {
    if (d.kind === 'bus') return;
    var Y = LV_Y[d.li];
    var g = new THREE.Group();
    var leaves = d.width > 1.5 ? 2 : 1;
    var lw = d.width / leaves;
    var mat;
    if (d.kind === 'glass') mat = bakeMat({ color: 0x9aa0a4, shininess: 80, specular: new THREE.Color(0.5, 0.5, 0.5) }, 'probe');
    else if (d.kind === 'double') mat = bakeMat({ color: 0x8a3a30, shininess: 40, specular: new THREE.Color(0.25, 0.25, 0.25) }, 'probe');
    else mat = bakeMat({ map: woodTex, shininess: 30 }, 'probe');
    var pr = bk.probe(d.li, d.x, Y + 1.2, d.z);
    setProbe(mat, pr.on, pr.off);
    d.leaves = [];
    for (var k = 0; k < leaves; k++) {
      var pivot = new THREE.Group();
      var sign = k === 0 ? 1 : -1;
      var geo = new THREE.BoxGeometry(lw - 0.02, 2.08, 0.05);
      geo.translate(sign * (lw / 2), 1.04, 0);
      var leaf = new THREE.Mesh(geo, mat); leaf.castShadow = true;
      pivot.add(leaf);
      if (d.kind === 'double' || d.kind === 'glass') { // push bar + window
        var bar = new THREE.Mesh(new THREE.BoxGeometry(lw * 0.7, 0.06, 0.08), mat); bar.position.set(sign * lw / 2, 1.0, 0.05); pivot.add(bar);
        var win = new THREE.Mesh(new THREE.PlaneGeometry(lw * 0.5, d.kind === 'glass' ? 1.5 : 0.6), MATS.glass); win.position.set(sign * lw / 2, d.kind === 'glass' ? 1.2 : 1.55, 0.03); pivot.add(win);
      }
      pivot.position.set(k === 0 ? -d.width / 2 : d.width / 2, 0, 0);
      g.add(pivot); d.leaves.push({ pivot: pivot, sign: sign });
    }
    g.position.set(d.x, Y, d.z);
    g.rotation.y = d.axis === 'z' ? 0 : PI / 2;
    group.add(g);
    d.group = g; d.anim = d.open;
    applyDoorPose(d);
    out.push(d);
  });
  return out;
}
function applyDoorPose(d) {
  if (!d.leaves) return;
  var a = d.anim * 1.45;
  for (var k = 0; k < d.leaves.length; k++) d.leaves[k].pivot.rotation.y = d.leaves[k].sign * a * (d.openDir || 1);
}

// ---- chairs (instanced, per-instance baked probes) -------------------------
function chairGeometry(kind) {
  var b = new Builder(); var f = new PF(b, 0, 0, 0, 0, 0);
  var P = MATS.paint;
  if (kind === 'chair') {
    f.box(P, 0, 0.44, 0, 0.42, 0.03, 0.4, [1, 1, 1]); f.box(P, 0, 0.55, -0.2, 0.42, 0.38, 0.03, [1, 1, 1], { rx: -0.08 });
    [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(function (q) { f.cyl(P, q[0], 0, q[1], 0.012, 0.44, [0.35, 0.35, 0.37], { six: 1 }); });
    f.cyl(P, -0.19, 0.44, -0.19, 0.012, 0.4, [0.35, 0.35, 0.37], { six: 1 }); f.cyl(P, 0.19, 0.44, -0.19, 0.012, 0.4, [0.35, 0.35, 0.37], { six: 1 });
  } else if (kind === 'stool') {
    f.cyl(P, 0, 0.62, 0, 0.17, 0.04, [0.2, 0.2, 0.2]);
    [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(function (q) { f.box(P, q[0], 0, q[1], 0.025, 0.62, 0.025, [0.4, 0.4, 0.42]); });
    f.box(P, 0, 0.25, 0, 0.26, 0.02, 0.02, [0.4, 0.4, 0.42]);
  } else { // busseat bench
    f.box(P, 0, 0.42, 0, 0.92, 0.12, 0.6, [0.22, 0.38, 0.3]); f.box(P, 0, 0.5, -0.3, 0.92, 0.6, 0.1, [0.22, 0.38, 0.3]);
    f.box(P, 0, 0, 0, 0.06, 0.42, 0.06, [0.25, 0.25, 0.25]);
  }
  var a = b.accs[Object.keys(b.accs)[0]];
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(a.n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(a.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(a.c, 3));
  g.setIndex(a.idx);
  return g;
}
function buildChairs(M, bk, group) {
  var res = {};
  ['chair', 'stool', 'busseat'].forEach(function (kind) {
    var list = M.chairs.filter(function (c) { return c.kind === kind; });
    if (!list.length) return;
    var geo = chairGeometry(kind);
    var n = list.length;
    var bOn = new Float32Array(n * 3), bOff = new Float32Array(n * 3), col = new Float32Array(n * 3);
    geo.setAttribute('bOnI', new THREE.InstancedBufferAttribute(bOn, 3));
    geo.setAttribute('bOffI', new THREE.InstancedBufferAttribute(bOff, 3));
    var mat = bakeMat({ vertexColors: true, shininess: 40, specular: new THREE.Color(0.2, 0.2, 0.2) }, 'inst');
    var im = new THREE.InstancedMesh(geo, mat, n);
    im.instanceColor = new THREE.InstancedBufferAttribute(col, 3);
    var cols = [COL.chairBlue, COL.chairOr, [0.25, 0.45, 0.35], [0.6, 0.55, 0.3]];
    var tmp = new THREE.Color();
    list.forEach(function (c, i) {
      c.inst = i; c.im = im;
      var pr = bk.probe(c.li, c.x, LV_Y[c.li] + 0.6, c.z);
      bOn[i * 3] = pr.on[0] * 0.5; bOn[i * 3 + 1] = pr.on[1] * 0.5; bOn[i * 3 + 2] = pr.on[2] * 0.5;
      bOff[i * 3] = pr.off[0] * 0.5; bOff[i * 3 + 1] = pr.off[1] * 0.5; bOff[i * 3 + 2] = pr.off[2] * 0.5;
      var cc = kind === 'chair' ? cols[(c.room * 3 + i) % 2] : [1, 1, 1];
      col[i * 3] = cc[0]; col[i * 3 + 1] = cc[1]; col[i * 3 + 2] = cc[2];
    });
    im.castShadow = true; im.receiveShadow = true;
    im.frustumCulled = false;
    res[kind] = { im: im, list: list };
    group.add(im);
    list.forEach(function (c) { setChairPose(c, 'normal'); });
  });
  return res;
}
var _cm4 = null;
function setChairPose(c, pose) {
  if (!_cm4) _cm4 = new THREE.Matrix4();
  var Y = LV_Y[c.li];
  var q = new THREE.Quaternion(), p = new THREE.Vector3(c.x, Y, c.z), s = new THREE.Vector3(1, 1, 1);
  if (pose === 'normal') q.setFromEuler(new THREE.Euler(0, c.rot, 0));
  else if (pose === 'stacked') { // upside down on the table/desk in front
    var fx = Math.sin(c.rot), fz = Math.cos(c.rot);
    if (c.kind === 'chair') { p.set(c.x + fx * 0.6, Y + 0.74 + 0.47, c.z + fz * 0.6); q.setFromEuler(new THREE.Euler(PI, c.rot, 0)); }
    else if (c.kind === 'stool') { p.set(c.x + fx * 0.55, Y + 0.92 + 0.66, c.z + fz * 0.55); q.setFromEuler(new THREE.Euler(PI, c.rot, 0)); }
    else { p.set(c.x, Y + 0.48, c.z); q.setFromEuler(new THREE.Euler(0, c.rot, 0)); s.set(1, 0.25, 1); }
  } else if (pose === 'gone') { s.set(0.0001, 0.0001, 0.0001); }
  else if (pose === 'fallen') { q.setFromEuler(new THREE.Euler(PI / 2, c.rot, 0.3)); p.y += 0.2; }
  _cm4.compose(p, q, s);
  c.im.setMatrixAt(c.inst, _cm4);
  c.im.instanceMatrix.needsUpdate = true;
  c.pose = pose;
}
