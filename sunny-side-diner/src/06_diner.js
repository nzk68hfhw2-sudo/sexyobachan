// ---- the diner: architecture, furniture, exterior -------------------------------
// coordinates (m): x right, y up, z toward the front windows. dining room x -8..8, z -2.8..5
var D = { // layout constants
  W0: -8, W1: 8, Z0: -2.8, Z1: 5, H: 3.1, KZ0: -5.2,
  counterX0: -3.6, counterX1: 4.4, counterZf: -1.2, counterZb: -1.95, counterY: 1.05,
  stoolZ: -0.62, stools: [-3, -2, -1, 0, 1, 2, 3, 4],
  booths: [2.8, 0.7, -1.4, -3.5], boothZ0: 3.45, boothZ1: 4.95,
  door: [5.4, 6.6], register: { x: 6.4, y: 1.05, z: 1.7 }
};
var WORLD = { root: null, interior: null, exterior: null, dyn: {}, pick: [], seats: [], signs: {}, lights: {} };
var SEATS = []; // {id, label, pos, face(yaw), kind, booth}

function buildDiner() {
  var scene = RENDER.scene;
  var root = WORLD.root = group(scene);
  var I = WORLD.interior = group(root), X = WORLD.exterior = group(root);
  buildShell(I);
  buildCounter(I);
  buildStools(I);
  buildBooths(I);
  buildBackBar(I);
  buildKitchen(I);
  buildFreezer(I);
  buildLeftWall(I);
  buildRegister(I);
  buildDecor(I);
  flushBatches(I);
  buildExterior(X);
  flushBatches(X);
}

function buildShell(P) {
  var H = D.H;
  // floor: checker in dining room, quarry in kitchen
  var fg = new THREE.PlaneGeometry(16, 7.8); scaleUV(fg, 16 / 1.2, 7.8 / 1.2); fg.rotateX(-PI / 2);
  var floor = mesh(fg, M.floor, 0, 0, (D.Z0 + D.Z1) / 2, P, false); floor.receiveShadow = true; WORLD.floor = floor;
  var kg = new THREE.PlaneGeometry(13.6, 2.4); scaleUV(kg, 13.6 / 0.9, 2.4 / 0.9); kg.rotateX(-PI / 2);
  mesh(kg, M.quarry, 1.2, 0, (D.KZ0 + D.Z0) / 2, P, false);
  // hallway floor
  var hgf = new THREE.PlaneGeometry(3, 3.2); scaleUV(hgf, 3 / 1.2, 3.2 / 1.2); hgf.rotateX(-PI / 2); mesh(hgf, M.floor, -9.5, 0, -1.4, P, false);
  // ceiling
  var cg = new THREE.PlaneGeometry(16, 10.4); scaleUV(cg, 16 / 0.6, 10.4 / 0.6); cg.rotateX(PI / 2);
  mesh(cg, M.ceiling, 0, H, -0.1, P, false).receiveShadow = false;
  var stc = mkCanvas(256, 256), stg = stc.getContext('2d'); ring(stg, 128, 128, 100, 'rgb(120,80,30)', 0.5, 6); smudge(stg, 128, 128, 110, 'rgba(140,100,40,A)', 0.35);
  var stm = new THREE.MeshBasicMaterial({ map: toTex(stc, { clamp: true }), transparent: true, depthWrite: false, color: 0x9a8a70, opacity: 0.6 });
  [[-5.5, 3.2, 1.2], [3.2, 0.2, 0.8], [-1.0, -2.0, 0.6], [6.4, 3.8, 1.0]].forEach(function (d) { var sm2 = mesh(new THREE.PlaneGeometry(d[2], d[2]), stm, d[0], H - 0.004, d[1], P, false); sm2.rotation.x = PI / 2; });
  // --- walls (wainscot tiles below 1.1, chrome strip, plaster above)
  function wallSeg(x0, x1, z, face, y0, y1) { // along x, at z, facing +z (face=1) or -z
    var w = x1 - x0, cx = (x0 + x1) / 2;
    if (y0 < 1.1) B(w, Math.min(1.1, y1) - y0, 0.08, M.tiles, cx, (y0 + Math.min(1.1, y1)) / 2, z - face * 0.04);
    if (y1 > 1.16) B(w, y1 - Math.max(1.16, y0), 0.08, M.plaster, cx, (Math.max(1.16, y0) + y1) / 2, z - face * 0.04);
    if (y0 < 1.13 && y1 > 1.13) B(w, 0.06, 0.1, M.chrome, cx, 1.13, z - face * 0.035);
  }
  function wallSegZ(z0, z1, x, face, y0, y1) {
    var d = z1 - z0, cz = (z0 + z1) / 2;
    if (y0 < 1.1) B(0.08, Math.min(1.1, y1) - y0, d, M.tiles, x - face * 0.04, (y0 + Math.min(1.1, y1)) / 2, cz);
    if (y1 > 1.16) B(0.08, y1 - Math.max(1.16, y0), d, M.plaster, x - face * 0.04, (Math.max(1.16, y0) + y1) / 2, cz);
    if (y0 < 1.13 && y1 > 1.13) B(0.1, 0.06, d, M.chrome, x - face * 0.035, 1.13, cz);
  }
  // front wall z=5 : windows x -7.8..4.9 (y 0.95..2.55), door 5.4..6.6
  wallSeg(-8, 5.4, 5, -1, 0, 0.95); wallSeg(-8, 5.4, 5, -1, 2.55, H);
  wallSeg(-8, -7.8, 5, -1, 0.95, 2.55); wallSeg(4.9, 5.4, 5, -1, 0.95, 2.55);
  wallSeg(6.6, 8, 5, -1, 0, H); wallSeg(5.4, 6.6, 5, -1, 2.35, H);
  // window mullions (chrome)
  for (var mx = -7.8; mx <= 4.95; mx += 2.14) B(0.07, 1.6, 0.12, M.chrome, mx, 1.75, 4.97);
  B(12.8, 0.06, 0.14, M.chrome, -1.45, 0.95, 4.97); B(12.8, 0.06, 0.14, M.chrome, -1.45, 2.55, 4.97);
  // window sill
  B(12.8, 0.04, 0.22, M.formica, -1.45, 0.93, 4.86);
  // side walls
  wallSegZ(-2.8, 5, 8, 1, 0, H);
  wallSegZ(0.8, 5, -8, -1, 0, H); wallSegZ(-2.8, -0.4, -8, -1, 0, H); wallSegZ(-0.4, 0.8, -8, -1, 2.25, H); // hallway opening z -0.4..0.8
  // hallway
  B(2.4, H, 0.1, M.tilesWhite, -9.2, H / 2, -0.45); B(2.4, H, 0.1, M.tilesWhite, -9.2, H / 2, 0.85);
  B(0.1, H, 1.3, M.plaster, -10.4, H / 2, 0.2);
  var hc = new THREE.PlaneGeometry(2.6, 1.4); hc.rotateX(PI / 2); mesh(hc, M.ceiling, -9.2, H, 0.2, P, false).receiveShadow = false;
  WORLD.hallEnd = new THREE.Vector3(-10.3, 1.4, 0.2);
  // restroom doors in the hallway
  B(0.75, 2.05, 0.05, M.wood, -9.4, 1.03, -0.38); B(0.75, 2.05, 0.05, M.wood, -9.4, 1.03, 0.78);
  // back wall z=-2.8 (between dining and kitchen) with pass window x 0.2..2.6 (y 1.25..2.05) and kitchen door x -3.4..-2.5
  wallSeg(-8, -3.4, -2.8, 1, 0, H); wallSeg(-2.5, 0.2, -2.8, 1, 0, H); wallSeg(2.6, 8, -2.8, 1, 0, H);
  wallSeg(0.2, 2.6, -2.8, 1, 0, 1.25); wallSeg(0.2, 2.6, -2.8, 1, 2.05, H); wallSeg(-3.4, -2.5, -2.8, 1, 2.15, H);
  B(2.5, 0.05, 0.4, M.steel, 1.4, 1.25, -2.8); // pass shelf
  // swing door to kitchen (half open)
  var sd = mesh(boxGeo(0.86, 1.5, 0.05, 1), M.steel, -2.95, 1.05, -2.8, P); sd.rotation.y = 0.5; sd.position.x -= 0.1;
  // kitchen walls (white tiles)
  function kwall(w, h, d, x, y, z) { B(w, h, d, M.tilesWhite, x, y, z); }
  kwall(13.6, H, 0.1, 1.2, H / 2, D.KZ0); // back wall (door cut below)
  kwall(0.1, H, 2.4, -5.6, H / 2, -4.0);
  kwall(0.1, H, 2.4, 5.0, H / 2, -4.0); // between kitchen and freezer (door cut handled by door mesh over it)
  // exterior skin of the building (stainless diner siding + red band), visible from outside
  var sk = M.steel;
  B(16.4, 0.95, 0.06, sk, 0, 0.475, 5.12); B(16.4, 0.55, 0.06, sk, 0, H - 0.27 + 0.27, 5.12);
  B(1.4, 2.35, 0.06, sk, 7.3, 1.17, 5.12); B(0.2, 1.6, 0.06, sk, -7.95, 1.75, 5.12); B(0.5, 1.6, 0.06, sk, 5.15, 1.75, 5.12);
  B(16.4, 0.16, 0.08, M.paintRed, 0, 0.8, 5.16); B(16.4, 0.16, 0.08, M.paintRed, 0, 2.72, 5.16);
  B(0.06, H + 0.4, 10.6, sk, 8.12, (H + 0.4) / 2, -0.1); B(0.06, H + 0.4, 10.6, sk, -8.12, (H + 0.4) / 2, -0.1);
  B(16.6, 0.4, 10.8, M.black, 0, H + 0.2, -0.1); // roof slab
  B(16.8, 0.22, 0.3, M.chrome, 0, H + 0.28, 5.2); // roof edge trim
  // front door (glass with chrome frame) — hinged group for opening
  var door = group(P, D.door[0] + 0.02, 0, 5.0);
  mesh(boxGeo(1.16, 0.08, 0.06, 1), M.chrome, 0.58, 0.04, 0, door); mesh(boxGeo(1.16, 0.08, 0.06, 1), M.chrome, 0.58, 2.31, 0, door);
  mesh(boxGeo(0.07, 2.35, 0.06, 1), M.chrome, 0.035, 1.17, 0, door); mesh(boxGeo(0.07, 2.35, 0.06, 1), M.chrome, 1.13, 1.17, 0, door);
  mesh(boxGeo(0.9, 0.05, 0.08, 1), M.chrome, 0.58, 1.05, 0.02, door);
  var dg = mesh(new THREE.PlaneGeometry(1.02, 2.2), M.glass, 0.58, 1.17, 0, door, false);
  var openSign = mkCanvas(256, 128), osg = openSign.getContext('2d'); osg.fillStyle = '#c8282e'; osg.fillRect(0, 0, 256, 128); osg.fillStyle = '#fff'; osg.font = '64px ' + F.slab; osg.textAlign = 'center'; osg.textBaseline = 'middle'; osg.fillText('OPEN', 128, 66);
  var osm = new THREE.MeshStandardMaterial({ map: toTex(openSign, { clamp: true }), roughness: 0.5 });
  var osMesh = mesh(new THREE.PlaneGeometry(0.2, 0.1), osm, 0.9, 2.08, 0.035, door, false);
  var cs = canvasSign([['SORRY', 40], ["WE'RE CLOSED", 34]], '#f3e6c8', '#7e1418', 256, 128);
  var csMesh = mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshStandardMaterial({ map: toTex(cs, { clamp: true }), roughness: 0.5 }), 1.0, 2.17, -0.036, door, false); csMesh.rotation.y = PI; csMesh.scale.setScalar(0.42);
  mesh(boxGeo(0.22, 0.12, 0.06, 1), M.chrome, 0.9, 2.08, 0, door);
  WORLD.door = door; WORLD.doorSign = osMesh;
  // window glass (planar reflection + rain shader assigned later in fx)
  var wg = new THREE.PlaneGeometry(12.7, 1.6);
  var win = new THREE.Mesh(wg, M.glass); win.position.set(-1.45, 1.75, 4.99); win.rotation.y = PI; win.renderOrder = 5; P.add(win);
  WORLD.window = win;
  // skirting AO strips
  [[0, -2.75, 16, 0], [0, 4.95, 16, 0]].forEach(function (s) { blob(P, s[0], s[1], s[2] + 1, 0.5, 0, 0.5); });
  blob(P, 7.9, 1.1, 0.5, 8, 0, 0.5); blob(P, -7.9, 1.1, 0.5, 8, 0, 0.5);
}

function buildCounter(P) {
  var x0 = D.counterX0, x1 = D.counterX1, w = x1 - x0, cx = (x0 + x1) / 2, zf = D.counterZf, zb = D.counterZb, d = zf - zb, cz = (zf + zb) / 2, y = D.counterY;
  // top (formica) with chrome edge band
  var top = mesh(roundSlab(w + 0.06, d + 0.08, 0.05, 0.05), M.formica, cx, y - 0.025, cz + 0.02, P); scaleUV(top.geometry, 1, 1);
  fixSlabUV(top.geometry, 1.0);
  B(w + 0.1, 0.07, 0.03, M.chrome, cx, y - 0.04, zf + 0.075);
  B(0.03, 0.07, d + 0.1, M.chrome, x0 - 0.05, y - 0.04, cz + 0.02); B(0.03, 0.07, d + 0.1, M.chrome, x1 + 0.05, y - 0.04, cz + 0.02);
  // front panel: red enamel with chrome ribs, kick plate
  B(w, 0.88, 0.06, M.paintRed, cx, 0.58, zf - 0.05);
  for (var i = 0; i < 3; i++) B(w + 0.01, 0.035, 0.075, M.chrome, cx, 0.32 + i * 0.22, zf - 0.03);
  B(w, 0.14, 0.12, M.chromeDull, cx, 0.07, zf - 0.1);
  B(w - 0.1, 0.95, 0.6, M.steel, cx, 0.5, cz - 0.05); // body
  // foot rail (chrome tube)
  var rail = new THREE.CylinderGeometry(0.022, 0.022, w, 10); rail.rotateZ(PI / 2);
  batchAdd(rail, M.chrome, cx, 0.24, zf + 0.12);
  for (var k = 0; k < 6; k++) { var bx = x0 + 0.3 + k * (w - 0.6) / 5; batchAdd(new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8).rotateX(PI / 2), M.chrome, bx, 0.24, zf + 0.06); }
  blob(P, cx, zf + 0.2, w + 0.5, 0.7, 0, 0.6);
  WORLD.counterTop = top;
  // napkin dispensers / sugar / ketchup along the counter
  for (var s = 0; s < D.stools.length; s += 2) addCondiments(P, D.stools[s] + 0.5, y, zf - 0.22);
}
function fixSlabUV(g, tm) { // planar xz uv for extruded slabs
  var p = g.attributes.position, uv = g.attributes.uv;
  for (var i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / tm, p.getZ(i) / tm);
  uv.needsUpdate = true;
}
function addCondiments(P, x, y, z) {
  // chrome napkin dispenser
  batchAdd(boxGeo(0.12, 0.14, 0.09, 0.5), M.chrome, x, y + 0.07, z);
  batchAdd(boxGeo(0.1, 0.02, 0.1, 1), M.enamelWhite, x, y + 0.15, z);
  // sugar pourer (glass + chrome cap)
  var sg = new THREE.CylinderGeometry(0.032, 0.036, 0.1, 14); batchAdd(sg, M.glassDark, x + 0.13, y + 0.05, z);
  batchAdd(new THREE.CylinderGeometry(0.02, 0.034, 0.04, 14), M.chrome, x + 0.13, y + 0.12, z);
  // ketchup & mustard
  batchAdd(new THREE.CylinderGeometry(0.028, 0.03, 0.17, 12), M.paintRed, x - 0.13, y + 0.085, z);
  batchAdd(new THREE.ConeGeometry(0.02, 0.05, 10), M.paintRed, x - 0.13, y + 0.195, z);
  var mus = stdMat({ color: 0xe6b81c, roughness: 0.35 }); mus.userData.tm = 1;
  batchAdd(new THREE.CylinderGeometry(0.028, 0.03, 0.17, 12), mus, x - 0.2, y + 0.085, z + 0.02);
  batchAdd(new THREE.ConeGeometry(0.02, 0.05, 10), mus, x - 0.2, y + 0.195, z + 0.02);
}
var STOOL_GEO = null;
function buildStools(P) {
  // lathe chrome pedestal + red vinyl seat cushion (tufted). seats swivel (separate meshes)
  var base = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.2, 0), new THREE.Vector2(0.2, 0.02), new THREE.Vector2(0.12, 0.05), new THREE.Vector2(0.04, 0.09), new THREE.Vector2(0.035, 0.62), new THREE.Vector2(0.09, 0.66), new THREE.Vector2(0.17, 0.68), new THREE.Vector2(0.18, 0.7)], 28);
  var cushion = new THREE.LatheGeometry([new THREE.Vector2(0, 0.7), new THREE.Vector2(0.185, 0.7), new THREE.Vector2(0.2, 0.72), new THREE.Vector2(0.205, 0.76), new THREE.Vector2(0.195, 0.79), new THREE.Vector2(0.15, 0.805), new THREE.Vector2(0, 0.81)], 28);
  scaleUV(cushion, 2, 0.6);
  var band = new THREE.CylinderGeometry(0.207, 0.207, 0.035, 28, 1, true);
  STOOL_GEO = { cushion: cushion };
  D.stools.forEach(function (x, i) {
    batchAdd(base, M.chrome, x, 0, D.stoolZ);
    var seat = mesh(cushion, i === 5 ? M.vinylP : M.vinyl, x, 0, D.stoolZ, P);
    seat.rotation.y = i * 0.7;
    batchAdd(band, M.chrome, x, 0.725, D.stoolZ);
    blob(P, x, D.stoolZ, 0.6, 0.6, 0, 0.7);
    SEATS.push({ id: 'S' + (i + 1), label: 'Counter ' + (i + 1), kind: 'stool', pos: new THREE.Vector3(x, 0.81, D.stoolZ), face: PI, seatMesh: seat, eatPos: new THREE.Vector3(x, D.counterY + 0.005, D.counterZf - 0.3), station: 'COUNTER' });
  });
}
function buildBooths(P) {
  var z0 = D.boothZ0, z1 = D.boothZ1, len = z1 - z0, cz = (z0 + z1) / 2;
  D.booths.forEach(function (bx, bi) {
    [-1, 1].forEach(function (sd) {
      var x = bx + sd * 0.7; // bench center
      var mat = (bi === 3 && sd === 1) ? M.vinylP : M.vinyl;
      // seat cushion
      var seat = roundSlab(0.52, len, 0.14, 0.05); fixSlabUV(seat, 0.6); batchAdd(seat, mat, x, 0.47, cz);
      // back cushion (slanted)
      var back = roundSlab(0.16, len, 0.7, 0.05); fixSlabUV(back, 0.6);
      var bb = new THREE.BoxGeometry(0.16, 0.7, len); batchAdd(boxGeo(0.14, 0.7, len, 0.6), mat, x + sd * 0.22, 0.88, cz, 0, 0, -sd * 0.08);
      // frame base & back shell (wood + chrome cap)
      batchAdd(boxGeo(0.56, 0.4, len, 1), M.wood, x, 0.2, cz);
      batchAdd(boxGeo(0.08, 1.25, len + 0.04, 1), M.wood, x + sd * 0.31, 0.63, cz);
      var cap = new THREE.CylinderGeometry(0.045, 0.045, len + 0.06, 12); cap.rotateX(PI / 2); batchAdd(cap, M.chrome, x + sd * 0.31, 1.27, cz);
      // front kick (chrome)
      batchAdd(boxGeo(0.56, 0.06, 0.02, 1), M.chrome, x, 0.42, z0 - 0.01);
      blob(P, x, cz, 0.9, len + 0.4, 0, 0.6);
      var seatX = bx + sd * 0.62, faceYaw = sd > 0 ? -PI / 2 : PI / 2;
      SEATS.push({ id: 'B' + (bi + 1) + (sd > 0 ? 'R' : 'L'), booth: bi + 1, side: sd, label: 'Booth ' + (bi + 1), kind: 'booth', pos: new THREE.Vector3(seatX, 0.6, cz - 0.15), face: faceYaw, eatPos: new THREE.Vector3(bx + sd * 0.22, 0.78, cz - 0.1), station: 'BOOTHS' });
    });
    // table: formica top with chrome edge, single pedestal + wall bracket
    var t = roundSlab(0.82, 1.15, 0.04, 0.04); fixSlabUV(t, 1); batchAdd(t, M.formicaCream, bx, 0.76, z1 - 0.62);
    var edge = new THREE.TorusGeometry(1, 0.012, 6, 32); // not used: chrome band via boxes
    batchAdd(boxGeo(0.84, 0.04, 0.02, 1), M.chrome, bx, 0.755, z1 - 1.2); batchAdd(boxGeo(0.02, 0.04, 1.17, 1), M.chrome, bx - 0.42, 0.755, z1 - 0.62); batchAdd(boxGeo(0.02, 0.04, 1.17, 1), M.chrome, bx + 0.42, 0.755, z1 - 0.62);
    batchAdd(new THREE.CylinderGeometry(0.04, 0.04, 0.74, 12), M.chrome, bx, 0.37, z1 - 0.7);
    batchAdd(new THREE.CylinderGeometry(0.25, 0.27, 0.025, 20), M.chrome, bx, 0.012, z1 - 0.7);
    blob(P, bx, z1 - 0.6, 1.0, 1.3, 0, 0.55);
    addCondiments(P, bx, 0.78, z1 - 0.18);
    // booth number plate on the bench end
    var nc = mkCanvas(128, 128), ng = nc.getContext('2d'); ng.fillStyle = '#d8dde2'; ng.beginPath(); ng.arc(64, 64, 60, 0, TAU); ng.fill(); ng.fillStyle = '#7e1418'; ng.font = '78px ' + F.slab; ng.textAlign = 'center'; ng.textBaseline = 'middle'; ng.fillText(String(bi + 1), 64, 70);
    var nm = new THREE.MeshStandardMaterial({ map: toTex(nc, { clamp: true }), metalness: 0.6, roughness: 0.3, transparent: true });
    var plate = mesh(new THREE.CircleGeometry(0.07, 24), nm, bx + 0.66, 1.05, z0 - 0.025, P, false); plate.rotation.y = PI;
    WORLD['boothPlate' + (bi + 1)] = plate;
    // jukebox wall-box (remote selector) on each table — little chrome box
    batchAdd(boxGeo(0.22, 0.2, 0.1, 0.5), M.chrome, bx, 0.88, z1 - 0.1);
  });
}
function buildBackBar(P) {
  // back counter along z=-2.55, coffee machine, shake mixer, cups, menu board above pass
  B(4.9, 0.92, 0.5, M.steel, 0.25, 0.46, -2.52); // under-counter
  var bt = roundSlab(5.0, 0.55, 0.04, 0.02); fixSlabUV(bt, 1); batchAdd(bt, M.formica, 0.25, 0.94, -2.52);
  B(2.2, 0.92, 0.5, M.steel, 3.5, 0.46, -2.52); var bt2 = roundSlab(2.3, 0.55, 0.04, 0.02); fixSlabUV(bt2, 1); batchAdd(bt2, M.formica, 3.5, 0.94, -2.52);
  // coffee machine (twin burner) at x=-2.4
  var cm = group(P, -1.85, 0.96, -2.55); WORLD.coffeeMachine = cm;
  mesh(boxGeo(0.62, 0.62, 0.36, 0.5), M.steel, 0, 0.31, -0.02, cm);
  mesh(boxGeo(0.64, 0.05, 0.42, 0.5), M.chrome, 0, 0.64, 0, cm);
  [-0.17, 0.17].forEach(function (ox, i) {
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), M.black, ox, 0.0, 0.08, cm);
    var pot = makeCoffeePot(); pot.position.set(ox, 0.012, 0.08); cm.add(pot); if (i === 0) WORLD.coffeePot = pot;
  });
  // stacked cups & saucers
  for (var c = 0; c < 4; c++) { var cup = makeCup(); cup.position.set(-1.3 + (c % 2) * 0.13, 0.96 + Math.floor(c / 2) * 0.09, -2.5); P.add(cup); }
  // shake mixer (mint enamel, chrome cup) at x=-1.0
  var sm = group(P, -0.8, 0.96, -2.55); WORLD.shakeMixer = sm;
  mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.05, 20), M.paintMint, 0, 0.025, 0, sm);
  mesh(boxGeo(0.08, 0.42, 0.08, 0.5), M.paintMint, 0, 0.26, -0.1, sm);
  var head = mesh(new THREE.SphereGeometry(0.1, 20, 12), M.paintMint, 0, 0.48, -0.03, sm); head.scale.set(1, 0.6, 1.4);
  var scup = mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.2, 18, 1, true), M.chrome, 0, 0.16, 0.06, sm); scup.material = M.chrome; WORLD.shakeCup = scup;
  // menu letter board above back bar (left of pass)
  var mb = new THREE.MeshStandardMaterial({ map: toTex(canvasMenuBoard(), { clamp: true }), roughness: 0.55, envMapIntensity: 0.6 });
  var board = mesh(new THREE.PlaneGeometry(2.4, 1.2), mb, -1.6, 2.35, -2.74, P, false); WORLD.menuBoard = board;
  // pie case on the front counter (glass dome over cake stand)
  var pc = group(P, 3.85, D.counterY, D.counterZb + 0.33); WORLD.pieCase = pc;
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 32), M.chrome, 0, 0.01, 0, pc);
  mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.1, 12), M.chrome, 0, 0.07, 0, pc);
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.01, 32), M.ceramic, 0, 0.125, 0, pc);
  var pie = makePie(1); pie.position.y = 0.13; pc.add(pie); WORLD.pie = pie;
  var dome = mesh(new THREE.SphereGeometry(0.22, 28, 14, 0, TAU, 0, PI / 2), M.glass, 0, 0.12, 0, pc, false); dome.scale.y = 0.95; dome.renderOrder = 4;
  mesh(new THREE.SphereGeometry(0.025, 10, 8), M.chrome, 0, 0.335, 0, pc);
  // shelf with glasses above back counter (right side)
  B(2.2, 0.03, 0.25, M.chrome, 3.5, 1.75, -2.67);
  for (var g2 = 0; g2 < 8; g2++) batchAdd(new THREE.CylinderGeometry(0.035, 0.03, 0.12, 12), M.glassDark, 2.6 + g2 * 0.25, 1.83, -2.67);
}
function makeCup(coffee) {
  var g = new THREE.Group();
  var pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.03, 0), new THREE.Vector2(0.036, 0.006), new THREE.Vector2(0.042, 0.03), new THREE.Vector2(0.047, 0.07), new THREE.Vector2(0.044, 0.072), new THREE.Vector2(0.04, 0.035), new THREE.Vector2(0.0, 0.03)];
  mesh(new THREE.LatheGeometry(pts, 20), M.ceramic, 0, 0.012, 0, g);
  var sauc = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.05, 0), new THREE.Vector2(0.075, 0.01), new THREE.Vector2(0.078, 0.014), new THREE.Vector2(0.07, 0.012), new THREE.Vector2(0, 0.005)], 22);
  mesh(sauc, M.ceramic, 0, 0, 0, g);
  var h = mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12, PI * 1.2), M.ceramic, 0.048, 0.05, 0, g); h.rotation.z = -PI * 0.6;
  var rim = mesh(new THREE.TorusGeometry(0.046, 0.003, 4, 20), M.ceramicRim, 0, 0.081, 0, g); rim.rotation.x = PI / 2;
  if (coffee) { var cf = mesh(new THREE.CircleGeometry(0.042, 20), M.coffee, 0, 0.074, 0, g); cf.rotation.x = -PI / 2; g.userData.coffee = cf; }
  return g;
}
function makeCoffeePot() {
  var g = new THREE.Group();
  var pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.06, 0), new THREE.Vector2(0.085, 0.04), new THREE.Vector2(0.09, 0.08), new THREE.Vector2(0.07, 0.15), new THREE.Vector2(0.045, 0.2), new THREE.Vector2(0.05, 0.22)];
  var gl = mesh(new THREE.LatheGeometry(pts, 22), M.glassDark, 0, 0, 0, g, false); gl.renderOrder = 3;
  var liq = mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.005), new THREE.Vector2(0.058, 0.005), new THREE.Vector2(0.082, 0.04), new THREE.Vector2(0.086, 0.08), new THREE.Vector2(0, 0.08)], 20), M.coffee, 0, 0, 0, g, false);
  g.userData.liquid = liq;
  mesh(new THREE.CylinderGeometry(0.052, 0.05, 0.04, 20), M.black, 0, 0.22, 0, g);
  var hd = mesh(boxGeo(0.02, 0.1, 0.02, 1), M.black, 0.11, 0.13, 0, g); hd.rotation.z = 0.2;
  mesh(boxGeo(0.06, 0.02, 0.02, 1), M.black, 0.08, 0.2, 0, g);
  return g;
}
var PIE_MAT = null;
function makePie(slicesMissing) {
  if (!PIE_MAT) {
    var c = mkCanvas(256, 256), g = c.getContext('2d'); g.fillStyle = '#d79a52'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#8e0f1c'; for (var i = 0; i < 9; i++) for (var j = 0; j < 9; j++) if ((i + j) % 2) g.fillRect(i * 28 + 4, j * 28 + 4, 22, 22);
    g.strokeStyle = '#efc184'; g.lineWidth = 10; for (var k = 0; k < 10; k++) { g.beginPath(); g.moveTo(k * 28, 0); g.lineTo(k * 28, 256); g.stroke(); g.beginPath(); g.moveTo(0, k * 28); g.lineTo(256, k * 28); g.stroke(); }
    var t = toTex(c, { clamp: true });
    PIE_MAT = { top: stdMat({ map: t, roughness: 0.55 }), crust: stdMat({ color: 0xd9a05a, roughness: 0.7 }), fill: stdMat({ color: 0x7a0a16, roughness: 0.25 }) };
  }
  var g2 = new THREE.Group(); var miss = slicesMissing || 0, seg = TAU / 8;
  var start = miss * seg, len = TAU - start;
  mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.05, 32, 1, false, start, len), PIE_MAT.top, 0, 0.025, 0, g2).material = [PIE_MAT.crust, PIE_MAT.top, PIE_MAT.crust];
  if (miss) {
    [start, TAU].forEach(function (a) { var p = mesh(new THREE.PlaneGeometry(0.15, 0.05), PIE_MAT.fill, Math.sin(a) * 0.075, 0.025, Math.cos(a) * 0.075, g2, false); p.rotation.y = a + PI / 2; p.material.side = THREE.DoubleSide; });
  }
  return g2;
}
function buildKitchen(P) {
  var z = D.KZ0;
  // griddle station against back wall x 0..1.8
  B(2.2, 0.85, 0.75, M.steelG, 0.9, 0.425, z + 0.42);
  var gp = mesh(boxGeo(1.9, 0.04, 0.6, 1), M.griddle, 0.9, 0.87, z + 0.42, P); WORLD.griddle = gp;
  B(1.95, 0.12, 0.03, M.steelG, 0.9, 0.93, z + 0.12); B(0.03, 0.12, 0.6, M.steelG, -0.05, 0.93, z + 0.42); B(0.03, 0.12, 0.6, M.steelG, 1.85, 0.93, z + 0.42);
  B(1.9, 0.04, 0.08, M.steelG, 0.9, 0.86, z + 0.76); // grease trough
  for (var k = 0; k < 4; k++) batchAdd(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12).rotateX(PI / 2), M.black, 0.3 + k * 0.4, 0.6, z + 0.8);
  // hood: sloped canopy with baffle filters, a warm heat lamp strip and a duct to the ceiling
  B(2.7, 0.08, 1.05, M.steelG, 0.9, 2.3, z + 0.53); B(2.7, 0.42, 0.04, M.steelG, 0.9, 2.5, z + 1.05);
  B(0.04, 0.42, 1.05, M.steelG, -0.45, 2.5, z + 0.53); B(0.04, 0.42, 1.05, M.steelG, 2.25, 2.5, z + 0.53);
  B(2.7, 0.04, 1.05, M.steelG, 0.9, 2.71, z + 0.53); B(0.9, 0.42, 0.6, M.steel, 0.9, 2.92, z + 0.35);
  for (var f2 = 0; f2 < 5; f2++) { var flt = boxGeo(0.48, 0.32, 0.02, 0.5); batchAdd(flt, M.chromeDull, -0.15 + f2 * 0.52, 2.5, z + 0.15, 0, 0.45); }
  var lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 1.6, 0.7) }); var lamp = mesh(new THREE.BoxGeometry(2.4, 0.02, 0.04), lampM, 0.9, 2.255, z + 0.9, P, false); WORLD.hoodLamp = lampM;
  // squeeze bottles, spatulas, egg carton, bread, batter bowl, plate stack
  var sqR = stdMat({ color: 0xc8202a, roughness: 0.35 }), sqY = stdMat({ color: 0xe6b81c, roughness: 0.35 }), sqW = stdMat({ color: 0xece6d8, roughness: 0.4 }); [sqR, sqY, sqW].forEach(function (m) { m.userData.tm = 1; });
  [[sqR, 1.95], [sqY, 2.03], [sqW, 2.11]].forEach(function (q) { batchAdd(new THREE.CylinderGeometry(0.03, 0.032, 0.17, 12), q[0], q[1], 0.93 + 0.085, z + 0.2); batchAdd(new THREE.ConeGeometry(0.022, 0.06, 10), q[0], q[1], 0.93 + 0.2, z + 0.2); });
  batchAdd(boxGeo(0.3, 0.07, 0.1, 0.5), stdMat({ color: 0xbfae8e, roughness: 0.95 }), -0.15, 0.965, z + 0.6, 0.2);
  for (var e2 = 0; e2 < 6; e2++) batchAdd(new THREE.SphereGeometry(0.022, 10, 8), stdMat({ color: 0xf1e8d6, roughness: 0.6 }), -0.27 + (e2 % 3) * 0.08, 1.01, z + 0.57 + Math.floor(e2 / 3) * 0.05, 0.2);
  var bowl = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.06, 0), new THREE.Vector2(0.13, 0.09), new THREE.Vector2(0.125, 0.095), new THREE.Vector2(0.055, 0.008), new THREE.Vector2(0, 0.008)], 20); batchAdd(bowl, M.steel, -1.8, 0.95, -3.45);
  batchAdd(new THREE.CylinderGeometry(0.115, 0.115, 0.01, 20), stdMat({ color: 0xf3e0b0, roughness: 0.5 }), -1.8, 1.02, -3.45);
  for (var p2 = 0; p2 < 9; p2++) batchAdd(new THREE.CylinderGeometry(0.125, 0.11, 0.012, 24), M.ceramic, 2.55, 1.29 + p2 * 0.014, -2.82);
  // pot rack over the prep table
  B(1.8, 0.03, 0.03, M.chrome, -1.3, 2.35, -3.55); batchAdd(new THREE.CylinderGeometry(0.005, 0.005, 0.75, 4), M.chrome, -2.1, 2.72, -3.55); batchAdd(new THREE.CylinderGeometry(0.005, 0.005, 0.75, 4), M.chrome, -0.5, 2.72, -3.55);
  [[-2.0, 0.16], [-1.6, 0.13], [-1.15, 0.18], [-0.7, 0.11]].forEach(function (pp) { batchAdd(new THREE.CylinderGeometry(pp[1], pp[1] * 0.9, pp[1] * 0.8, 20, 1, true), M.steel, pp[0], 2.1, -3.55); batchAdd(new THREE.CircleGeometry(pp[1] * 0.9, 20).rotateX(-PI / 2), M.steel, pp[0], 2.1 - pp[1] * 0.4, -3.55); });
  // wall shelf with cans & jars, calendar, fire extinguisher
  B(1.6, 0.03, 0.26, M.steel, 3.2, 1.6, z + 0.15);
  var canCols = [0xb8282e, 0x2f6e9a, 0xd9a520, 0x3a7a3a, 0xe8e0c8];
  for (var cn = 0; cn < 10; cn++) { var cm2 = stdMat({ color: canCols[cn % 5], roughness: 0.35, metalness: 0.3 }); cm2.userData.tm = 1; batchAdd(new THREE.CylinderGeometry(0.045, 0.045, 0.12 + (cn % 3) * 0.03, 14), cm2, 2.5 + cn * 0.15, 1.68 + (cn % 3) * 0.015, z + 0.15); }
  var calC = mkCanvas(256, 340), cg2 = calC.getContext('2d'); cg2.fillStyle = '#f6efdc'; cg2.fillRect(0, 0, 256, 340); drawSunny(cg2, 128, 100, 50, { wave: 0.5 }); cg2.fillStyle = '#c8282e'; cg2.font = '26px ' + F.slab; cg2.textAlign = 'center'; cg2.fillText('NOVEMBER', 128, 196);
  cg2.fillStyle = '#333'; cg2.font = '16px ' + F.ui; for (var d2 = 0; d2 < 30; d2++) cg2.fillText(String(d2 + 1), 30 + (d2 % 7) * 32, 226 + Math.floor(d2 / 7) * 24); cg2.strokeStyle = '#c8282e'; cg2.lineWidth = 3; cg2.beginPath(); cg2.arc(30 + (22 % 7) * 32, 226 + Math.floor(22 / 7) * 24 - 6, 13, 0, TAU); cg2.stroke();
  var cal = mesh(new THREE.PlaneGeometry(0.34, 0.45), new THREE.MeshStandardMaterial({ map: toTex(calC, { clamp: true }), roughness: 0.8 }), -0.9, 1.75, z + 0.07, P, false);
  var fe = stdMat({ color: 0xc0141c, roughness: 0.3, metalness: 0.2 }); fe.userData.tm = 1; batchAdd(new THREE.CylinderGeometry(0.075, 0.075, 0.45, 16), fe, -4.2, 0.6, z + 0.12); batchAdd(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 10), M.black, -4.2, 0.86, z + 0.12);
  // mop bucket + boxes
  batchAdd(new THREE.CylinderGeometry(0.2, 0.17, 0.32, 16), stdMat({ color: 0xd6a51c, roughness: 0.5 }), -3.9, 0.16, -4.85);
  batchAdd(new THREE.CylinderGeometry(0.012, 0.012, 1.3, 6), M.wood, -3.85, 0.75, -4.8, 0, 0.15);
  // fryer x 2.3
  B(0.6, 0.9, 0.7, M.steel, 2.35, 0.45, z + 0.42); mesh(boxGeo(0.46, 0.02, 0.5, 1), stdMat({ color: 0x6b4a14, roughness: 0.08 }), 2.35, 0.86, z + 0.42, P);
  // prep table (stainless) with burger fixings, center
  B(2.0, 0.06, 0.8, M.steel, -1.3, 0.92, -3.55); B(2.0, 0.04, 0.7, M.steel, -1.3, 0.25, -3.55);
  [[-2.25, -3.2], [-0.35, -3.2], [-2.25, -3.9], [-0.35, -3.9]].forEach(function (p) { batchAdd(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), M.steel, p[0], 0.45, p[1]); });
  // shelving + boxes on left
  for (var s = 0; s < 3; s++) B(1.2, 0.03, 0.45, M.steel, -4.8, 0.5 + s * 0.6, z + 0.3);
  for (var b = 0; b < 5; b++) B(0.35, 0.3, 0.35, M.card, -5.2 + (b % 3) * 0.4, 0.68 + Math.floor(b / 3) * 0.6, z + 0.3);
  // sink
  B(1.0, 0.9, 0.6, M.steel, -4.6, 0.45, -3.2); mesh(boxGeo(0.7, 0.02, 0.4, 1), M.black, -4.6, 0.91, -3.2, P);
  // back door (steel, push bar) at x -2.6 — hinged group
  var bd = group(P, -3.05, 0, z + 0.06); WORLD.backDoor = bd;
  mesh(boxGeo(0.95, 2.1, 0.06, 1), stdMat({ color: 0x6f7a74, roughness: 0.5, metalness: 0.6 }), 0.475, 1.05, 0, bd);
  mesh(boxGeo(0.7, 0.05, 0.06, 1), M.chrome, 0.475, 1.0, 0.06, bd);
  var exitC = mkCanvas(256, 96), eg = exitC.getContext('2d'); eg.fillStyle = '#1a0000'; eg.fillRect(0, 0, 256, 96); eg.fillStyle = '#ff2a2a'; eg.font = '64px ' + F.slab; eg.textAlign = 'center'; eg.textBaseline = 'middle'; eg.fillText('EXIT', 128, 52);
  var em = new THREE.MeshBasicMaterial({ map: toTex(exitC, { clamp: true }), color: new THREE.Color(2.2, 2.2, 2.2) });
  mesh(new THREE.PlaneGeometry(0.4, 0.15), em, -2.58, 2.35, z + 0.07, P, false);
  // order wheel (ticket rail) at pass window, kitchen side
  B(2.3, 0.04, 0.04, M.chrome, 1.4, 1.98, -2.86);
  // fluorescent tubes (2)
  [[-1.5, -4.0], [1.2, -3.6], [3.6, -4.0]].forEach(function (p) {
    B(1.3, 0.05, 0.22, M.steel, p[0], D.H - 0.03, p[1]);
    var tube = new THREE.CylinderGeometry(0.018, 0.018, 1.2, 8); tube.rotateZ(PI / 2);
    batchAdd(tube, M.fluor, p[0], D.H - 0.07, p[1] - 0.05); batchAdd(tube, M.fluor, p[0], D.H - 0.07, p[1] + 0.05);
  });
  // utensils on the wall rail
  B(1.6, 0.03, 0.03, M.chrome, -1.2, 1.6, z + 0.05);
  for (var u = 0; u < 6; u++) { batchAdd(boxGeo(0.06, 0.32, 0.01, 1), M.steel, -1.85 + u * 0.26, 1.42, z + 0.07); }
}
function buildFreezer(P) {
  var x0 = 5.05, x1 = 8, z0 = D.KZ0, z1 = -2.8;
  // interior frost box
  B(0.06, D.H, z1 - z0, M.frost, x1 - 0.03, D.H / 2, (z0 + z1) / 2);
  B(x1 - x0, D.H, 0.06, M.frost, (x0 + x1) / 2, D.H / 2, z0 + 0.03);
  B(x1 - x0, D.H, 0.06, M.frost, (x0 + x1) / 2, D.H / 2, z1 - 0.03);
  B(x1 - x0, 0.06, z1 - z0, M.frost, (x0 + x1) / 2, D.H - 0.03, (z0 + z1) / 2);
  var ff = new THREE.PlaneGeometry(x1 - x0, z1 - z0); ff.rotateX(-PI / 2); mesh(ff, M.steel, (x0 + x1) / 2, 0.005, (z0 + z1) / 2, P, false);
  // shelves with boxes, hanging meat-ish shapes (wrapped), ice
  for (var s = 0; s < 4; s++) B(0.5, 0.03, 2.2, M.steel, 7.6, 0.4 + s * 0.5, -4.0);
  for (var b = 0; b < 8; b++) B(0.35, 0.25, 0.4, M.card, 7.6, 0.55 + Math.floor(b / 2) * 0.5, -4.8 + (b % 2) * 0.9 + (b % 3) * 0.2);
  var wrap = stdMat({ color: 0xd9d2c8, roughness: 0.6 }); wrap.userData.tm = 1;
  for (var h = 0; h < 3; h++) { var sp = new THREE.SphereGeometry(0.16, 12, 10); sp.scale(1, 2.1, 1); batchAdd(sp, wrap, 6.0 + h * 0.5, 1.9, -4.7); batchAdd(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 4), M.chrome, 6.0 + h * 0.5, 2.6, -4.7); }
  // inner wall of the walk-in (frosted) with the inside face of the door
  B(0.06, D.H, 0.75, M.frost, 5.1, D.H / 2, -4.83); B(0.06, D.H, 0.5, M.frost, 5.1, D.H / 2, -3.05); B(0.06, 0.95, 1.08, M.frost, 5.1, 2.62, -3.87);
  B(0.05, 2.08, 1.04, M.steel, 5.11, 1.04, -3.87);
  B(0.06, 0.06, 0.22, M.chrome, 5.16, 1.1, -4.25); B(0.06, 0.18, 0.04, stdMat({ color: 0xb01018, roughness: 0.4 }), 5.16, 1.0, -4.3);
  var frostLight = mesh(new THREE.BoxGeometry(0.4, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 2.6, 3.2) }), 6.6, D.H - 0.05, -4.0, P, false);
  // freezer door (heavy, with latch) on the wall x=5, z -4.4..-3.4
  var fd = group(P, 4.89, 0, -3.35); WORLD.freezerDoor = fd;
  mesh(boxGeo(0.12, 2.1, 1.05, 1), M.steel, 0, 1.05, -0.525, fd);
  mesh(boxGeo(0.06, 0.08, 0.3, 1), M.chrome, -0.09, 1.1, -0.85, fd);
  mesh(boxGeo(0.04, 2.0, 0.04, 1), M.rubber, -0.06, 1.05, -1.0, fd);
  var tc = mkCanvas(256, 128), tg = tc.getContext('2d'); tg.fillStyle = '#e9e4d8'; tg.fillRect(0, 0, 256, 128); tg.fillStyle = '#1e5a7a'; tg.font = '40px ' + F.slab; tg.textAlign = 'center'; tg.fillText('WALK-IN', 128, 52); tg.font = '30px ' + F.ui; tg.fillText('KEEP CLOSED', 128, 100);
  var tm = mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshStandardMaterial({ map: toTex(tc, { clamp: true }), roughness: 0.6 }), -0.065, 1.6, -0.52, fd, false); tm.rotation.y = -PI / 2;
  // thermometer dial
  var dial = mesh(new THREE.CircleGeometry(0.06, 20), M.enamelWhite, -0.065, 1.35, -0.25, fd, false); dial.rotation.y = -PI / 2;
  // inner side walls between kitchen and freezer at x=5 above door etc handled by kitchen wall
  WORLD.freezerInside = new THREE.Vector3(6.6, 1.6, -4.0);
}
function buildLeftWall(P) {
  // jukebox (arched, wood cabinet, chrome grille, glowing face) at x=-7.55, z=3.0, facing +x
  var jb = group(P, -7.55, 0, 2.95); jb.rotation.y = PI / 2; WORLD.jukebox = jb;
  mesh(boxGeo(1.0, 1.05, 0.62, 1), M.wood, 0, 0.525, 0, jb);
  var arch = new THREE.CylinderGeometry(0.5, 0.5, 0.62, 28, 1, false, -PI / 2, PI); arch.rotateX(PI / 2); arch.rotateZ(PI / 2);
  var am = mesh(arch, M.wood, 0, 1.05, 0, jb); am.rotation.set(0, 0, 0);
  var jfTex = toTex(canvasJukeboxFace(), { clamp: true });
  var jfMat = new THREE.MeshBasicMaterial({ map: jfTex, color: new THREE.Color(1.9, 1.6, 1.4) }); WORLD.jukeFaceMat = jfMat;
  var face = mesh(new THREE.PlaneGeometry(0.86, 1.29), jfMat, 0, 0.82, 0.315, jb, false);
  // glass dome over the record window
  var jg = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24, 1, true, -PI / 2, PI), M.glass, 0, 1.12, 0.34, jb, false); jg.rotation.x = PI / 2; jg.rotation.z = PI / 2; jg.renderOrder = 4;
  for (var g = 0; g < 7; g++) mesh(boxGeo(0.72, 0.015, 0.03, 1), M.chrome, 0, 0.12 + g * 0.045, 0.33, jb);
  // light pillars on sides
  var pill = neonMat(3.0, 1.2, 0.5);
  [-0.47, 0.47].forEach(function (x) { mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 10), pill, x, 0.6, 0.3, jb, false); });
  WORLD.jukePillar = pill;
  WORLD.jukeboxPos = new THREE.Vector3(-7.2, 1.0, 2.95);
  blob(P, -7.5, 2.95, 1.0, 1.4, 0, 0.7);
  // pink payphone on wall at z=0.25? (between jukebox & hallway) -> z=1.6
  var ph = group(P, -7.93, 1.35, 1.75); ph.rotation.y = PI / 2; WORLD.phone = ph;
  mesh(boxGeo(0.28, 0.5, 0.14, 0.5), M.pinkPhone, 0, 0, 0.07, ph);
  mesh(boxGeo(0.22, 0.14, 0.02, 0.5), M.chrome, 0, 0.08, 0.145, ph);
  var keys = mkCanvas(128, 128), kg = keys.getContext('2d'); kg.fillStyle = '#ddd'; kg.fillRect(0, 0, 128, 128); kg.fillStyle = '#222'; kg.font = '26px ' + F.ui; kg.textAlign = 'center';
  for (var i = 0; i < 12; i++) kg.fillText('123456789*0#'[i], 24 + (i % 3) * 40, 30 + Math.floor(i / 3) * 30);
  var kp = mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshStandardMaterial({ map: toTex(keys, { clamp: true }), roughness: 0.4 }), 0, -0.06, 0.142, ph, false);
  var handset = group(ph, -0.17, 0.0, 0.13); WORLD.handset = handset;
  mesh(boxGeo(0.05, 0.3, 0.05, 1), M.pinkPhone, 0, 0, 0, handset);
  mesh(new THREE.SphereGeometry(0.045, 12, 8), M.pinkPhone, 0, 0.15, 0.01, handset); mesh(new THREE.SphereGeometry(0.045, 12, 8), M.pinkPhone, 0, -0.15, 0.01, handset);
  var cord = new THREE.TorusGeometry(0.03, 0.006, 4, 12); for (var c = 0; c < 6; c++) mesh(cord, M.pinkPhone, -0.04, -0.2 - c * 0.025, 0.02, handset).rotation.y = PI / 2;
  WORLD.phonePos = new THREE.Vector3(-7.8, 1.4, 1.75);
  // restroom sign above the hallway opening
  var rs = new THREE.MeshStandardMaterial({ map: toTex(canvasSign([['RESTROOMS', 44]], '#2f7e6e', '#f3e6c8', 512, 128), { clamp: true }), roughness: 0.5 });
  var rsm = mesh(new THREE.PlaneGeometry(0.9, 0.22), rs, -7.94, 2.5, 0.2, P, false); rsm.rotation.y = PI / 2;
  // coat rack/plant? a framed photo + clock
}
function buildRegister(P) {
  var x = D.register.x, z = D.register.z;
  // cashier stand
  B(2.0, 1.0, 0.55, M.paintRed, x, 0.5, z); for (var i = 0; i < 2; i++) B(2.01, 0.035, 0.57, M.chrome, x, 0.35 + i * 0.3, z);
  var st = roundSlab(2.1, 0.62, 0.04, 0.03); fixSlabUV(st, 1); batchAdd(st, M.formica, x, 1.02, z);
  blob(P, x, z, 2.4, 1, 0, 0.6);
  // brass/chrome cash register
  var reg = group(P, x - 0.2, 1.04, z); WORLD.register = reg;
  var brass = stdMat({ color: 0xd2ad66, roughness: 0.42, metalness: 0.85, envMapIntensity: 1.4 });
  mesh(boxGeo(0.42, 0.18, 0.4, 0.5), brass, 0, 0.09, 0, reg);
  var body = mesh(boxGeo(0.4, 0.22, 0.24, 0.5), brass, 0, 0.27, 0.06, reg); body.rotation.x = -0.25;
  mesh(boxGeo(0.3, 0.09, 0.03, 0.5), M.black, 0, 0.44, 0.08, reg);
  for (var k = 0; k < 15; k++) mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 10), M.enamelWhite, -0.12 + (k % 5) * 0.06, 0.22 + Math.floor(k / 5) * 0.03, -0.1 - Math.floor(k / 5) * 0.04, reg);
  // receipt printer + desk phone (to call the manager) + light switch panel on the wall behind (x=8)
  var tel = group(P, x + 0.6, 1.04, z - 0.05); WORLD.deskPhone = tel;
  mesh(boxGeo(0.2, 0.08, 0.22, 0.5), M.black, 0, 0.04, 0, tel); var hs = mesh(boxGeo(0.22, 0.05, 0.06, 0.5), M.black, 0, 0.1, 0.03, tel);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16), M.enamelWhite, 0, 0.085, -0.04, tel).rotation.x = 0.3;
  var sw = group(P, 7.94, 1.4, 0.9); sw.rotation.y = -PI / 2; WORLD.switchPanel = sw;
  mesh(boxGeo(0.4, 0.26, 0.03, 0.5), M.chrome, 0, 0, 0, sw);
  WORLD.switches = [];
  for (var s2 = 0; s2 < 2; s2++) { var sb = mesh(boxGeo(0.04, 0.09, 0.03, 1), M.enamelWhite, -0.08 + s2 * 0.16, 0, 0.03, sw); WORLD.switches.push(sb); }
  var lc = mkCanvas(256, 64), lg = lc.getContext('2d'); lg.fillStyle = '#ddd'; lg.fillRect(0, 0, 256, 64); lg.fillStyle = '#222'; lg.font = '26px ' + F.ui; lg.textAlign = 'center'; lg.fillText('LIGHTS     NEON', 128, 42);
  mesh(new THREE.PlaneGeometry(0.36, 0.08), new THREE.MeshStandardMaterial({ map: toTex(lc, { clamp: true }) }), 0, 0.17, 0.02, sw, false);
  // "please wait to be seated" stand
  var ws = group(P, 5.2, 0, 3.7); ws.rotation.y = PI * 0.85;
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), M.chrome, 0, 0.6, 0, ws); mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.02, 20), M.chrome, 0, 0.01, 0, ws);
  var wsm = new THREE.MeshStandardMaterial({ map: toTex(canvasSign([['PLEASE WAIT', 46], ['TO BE SEATED', 46]], '#f3e6c8', '#c8282e', 512, 256), { clamp: true }), roughness: 0.5 });
  mesh(new THREE.PlaneGeometry(0.5, 0.25), wsm, 0, 1.25, 0.01, ws, false);
  var back = mesh(new THREE.PlaneGeometry(0.5, 0.25), M.paintRed, 0, 1.25, -0.005, ws, false); back.rotation.y = PI;
  WORLD.waitSpot = new THREE.Vector3(5.6, 0, 3.9);
}
function buildDecor(P) {
  // pendant lamps: counter (5) and booths (4)
  var shadeG = new THREE.LatheGeometry([new THREE.Vector2(0.02, 0.0), new THREE.Vector2(0.05, -0.02), new THREE.Vector2(0.17, -0.2), new THREE.Vector2(0.18, -0.22), new THREE.Vector2(0.16, -0.21), new THREE.Vector2(0.04, -0.03)], 24);
  var cord = new THREE.CylinderGeometry(0.006, 0.006, 1, 5);
  WORLD.pendants = [];
  function pendant(x, z, len, mat) {
    batchAdd(cord.clone().scale(1, len, 1), M.black, x, D.H - len / 2, z);
    var y = D.H - len; batchAdd(shadeG, mat, x, y, z);
    var bulb = mesh(new THREE.SphereGeometry(0.055, 14, 10), M.bulb, x, y - 0.12, z, P, false); WORLD.pendants.push(bulb);
  }
  var shadeRed = stdMat({ color: 0xa8141c, roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide }); shadeRed.userData.tm = 1;
  [-2.5, -0.5, 1.5, 3.5].forEach(function (x) { pendant(x, -1.55, 0.75, M.chrome); });
  D.booths.forEach(function (x) { pendant(x, 4.35, 0.95, shadeRed); });
  // interior neon over pass window
  var nt = toTex(canvasNeonInterior(), { clamp: true });
  var nmat = new THREE.MeshBasicMaterial({ map: nt, transparent: true, color: new THREE.Color(2.6, 2.6, 2.6), depthWrite: false, blending: THREE.AdditiveBlending });
  var backing = mesh(boxGeo(2.9, 1.0, 0.03, 1), M.black, 1.5, 2.55, -2.74, P, false);
  var neon = mesh(new THREE.PlaneGeometry(2.8, 1.05), nmat, 1.5, 2.55, -2.72, P, false); WORLD.neonIn = neon; WORLD.neonInMat = nmat;
  var et = toTex(canvasNeonEyes(0), { clamp: true });
  var emat = new THREE.MeshBasicMaterial({ map: et, transparent: true, color: new THREE.Color(2.6, 2.6, 2.6), depthWrite: false, blending: THREE.AdditiveBlending });
  var eyes = mesh(new THREE.PlaneGeometry(0.7, 0.35), emat, 1.5 - 1.4 + 170 / 1024 * 2.8, 2.55 + 0.525 - 0.2 * 1.05 - 0.17 + 0.04, -2.715, P, false);
  eyes.position.set(1.5 - 1.4 + (170 / 1024) * 2.8, 2.55 + 1.05 / 2 - (178 / 384) * 1.05, -2.715);
  WORLD.neonEyes = eyes; WORLD.neonEyesMat = emat;
  // wall clock above the hallway side, posters on plaster
  var clk = group(P, -4.8, 2.25, -2.74); WORLD.clock = clk;
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 40).rotateX(PI / 2), M.chrome, 0, 0, -0.01, clk);
  mesh(new THREE.CircleGeometry(0.27, 40), new THREE.MeshStandardMaterial({ map: toTex(canvasClock(), { clamp: true }), roughness: 0.4 }), 0, 0, 0.02, clk, false);
  var hand = function (len, w) { var h = mesh(boxGeo(w, len, 0.005, 1), M.black, 0, 0, 0.03, clk, false); h.geometry.translate(0, len / 2 - 0.02, 0); return h; };
  WORLD.clockH = hand(0.15, 0.018); WORLD.clockM = hand(0.22, 0.012);
  mesh(new THREE.CircleGeometry(0.3, 40), M.glass, 0, 0, 0.035, clk, false);
  posterAt(P, 'rise', -6.0, 2.05, -2.74, 0, 0.62);
  posterAt(P, 'pie', 7.93, 2.0, 3.3, -PI / 2, 0.5);
  posterAt(P, 'photo', -7.93, 2.05, 4.0, PI / 2, 0.42);
  posterAt(P, 'employee', 7.93, 2.05, -1.6, -PI / 2, 0.42);
  // old CRT TV on a bracket shelf above back bar (left)
  var tv = group(P, -3.5, 2.05, -2.45); tv.rotation.y = 0.25; WORLD.tv = tv;
  B(0.7, 0.03, 0.5, M.chromeDull, -3.5, 1.78, -2.5);
  var cab = stdMat({ color: 0x3a2a1c, roughness: 0.45 }); cab.userData.tm = 1;
  mesh(boxGeo(0.62, 0.48, 0.45, 1), M.woodLight, 0, 0, -0.05, tv);
  var scr = new THREE.SphereGeometry(0.6, 24, 16, -0.37, 0.74, PI / 2 - 0.28, 0.56); scr.rotateY(PI / 2 * 0); // curved glass
  var tvc = mkCanvas(256, 192); WORLD.tvCanvas = tvc;
  var tvTex = toTex(tvc, { clamp: true, nomip: true }); WORLD.tvTex = tvTex;
  var tvMat = new THREE.MeshBasicMaterial({ map: tvTex, color: new THREE.Color(1.6, 1.6, 1.6) }); WORLD.tvMat = tvMat;
  var screen = mesh(new THREE.PlaneGeometry(0.46, 0.34, 8, 6), tvMat, -0.06, 0.02, 0.176, tv, false);
  bulgeGeo(screen.geometry, 0.02); WORLD.tvScreen = screen;
  mesh(boxGeo(0.07, 0.3, 0.01, 1), M.black, 0.24, 0, 0.176, tv);
  var ant = new THREE.CylinderGeometry(0.004, 0.004, 0.4, 4); var a1 = mesh(ant, M.chrome, -0.05, 0.42, -0.1, tv); a1.rotation.z = 0.5; var a2 = mesh(ant, M.chrome, 0.05, 0.42, -0.1, tv); a2.rotation.z = -0.5;
  // ceiling fan-less HVAC vents
  for (var v = 0; v < 3; v++) B(0.5, 0.02, 0.5, M.chromeDull, -5 + v * 5, D.H - 0.01, 1.8);
}
function bulgeGeo(g, amt) { var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i) / 0.23, y = p.getY(i) / 0.17; p.setZ(i, amt * (1 - x * x * 0.6 - y * y * 0.6)); } g.computeVertexNormals(); }
function posterAt(P, kind, x, y, z, ry, w) {
  var tex = toTex(canvasPoster(kind), { clamp: true });
  var m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 });
  var pm = mesh(new THREE.PlaneGeometry(w, w * 1.375), m, x, y, z, P, false); pm.rotation.y = ry; pm.translateZ(0.012);
  var fr = mesh(boxGeo(w + 0.05, w * 1.375 + 0.05, 0.02, 1), M.chromeDull, x, y, z, P, false); fr.rotation.y = ry; fr.translateZ(0.004);
  WORLD.signs[kind] = pm; return pm;
}
function buildExterior(X) {
  // parking lot (wet asphalt), sidewalk, highway, desert, mountains, sky
  var lot = new THREE.PlaneGeometry(70, 28); scaleUV(lot, 70 / 6, 28 / 6); lot.rotateX(-PI / 2); mesh(lot, M.asphalt, 0, -0.01, 19, X, false);
  var sw = boxGeo(17.5, 0.12, 1.6, 1.2); batchAdd(sw, M.plaster, 0, 0.0, 5.9);
  var road = new THREE.PlaneGeometry(400, 9); var roadMat = stdMat({ color: 0x1d1d20, roughness: 0.35, envMapIntensity: 1.4, map: TEX.asphalt.map, roughnessMap: TEX.asphalt.roughnessMap }); scaleUV(road, 400 / 6, 9 / 6); road.rotateX(-PI / 2);
  mesh(road, roadMat, 0, -0.005, 37.5, X, false);
  // road dashes
  for (var i = -40; i < 40; i++) batchAdd(boxGeo(2.2, 0.01, 0.14, 1), M.paintCream, i * 5, 0.0, 37.5);
  var des = new THREE.PlaneGeometry(600, 300); scaleUV(des, 600 / 8, 300 / 8); des.rotateX(-PI / 2); mesh(des, M.sand, 0, -0.03, 190, X, false);
  var des2 = new THREE.PlaneGeometry(600, 200); scaleUV(des2, 75, 25); des2.rotateX(-PI / 2); mesh(des2, M.sand, 0, -0.03, -105, X, false);
  // lot stripes
  for (var s = -6; s <= 6; s++) batchAdd(boxGeo(0.1, 0.01, 4.5, 1), M.paintCream, s * 2.8, 0.0, 10);
  // mountains silhouette ring
  var mg = new THREE.BufferGeometry(), mp = [], rnd = makeRNG(9);
  for (var k = 0; k < 64; k++) {
    var a0 = k / 64 * TAU, a1 = (k + 1) / 64 * TAU, r = 230, h0 = 8 + fbm(k * 0.3, 1, 3) * 34, h1 = 8 + fbm((k + 1) * 0.3, 1, 3) * 34;
    mp.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r, Math.cos(a1) * r, h1, Math.sin(a1) * r);
    mp.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, h1, Math.sin(a1) * r, Math.cos(a0) * r, h0, Math.sin(a0) * r);
  }
  mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
  var mtn = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: 0x07080c, side: THREE.DoubleSide, fog: false })); X.add(mtn);
  // sky dome with stars, moon, distant clouds (canvas)
  var sc = mkCanvas(1024, 512), sg = sc.getContext('2d');
  var sgrad = sg.createLinearGradient(0, 0, 0, 512); sgrad.addColorStop(0, '#020308'); sgrad.addColorStop(0.62, '#0a0e1a'); sgrad.addColorStop(0.75, '#1b1a24'); sgrad.addColorStop(1, '#2a2026');
  sg.fillStyle = sgrad; sg.fillRect(0, 0, 1024, 512);
  for (var st = 0; st < 900; st++) { var sy = Math.pow(rnd(), 1.6) * 330; sg.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.8 * (1 - sy / 380)) + ')'; sg.fillRect(rnd() * 1024, sy, rnd() < 0.05 ? 2 : 1, rnd() < 0.05 ? 2 : 1); }
  for (var cl = 0; cl < 40; cl++) { var cx2 = rnd() * 1024, cy2 = 200 + rnd() * 140; var cg2 = sg.createRadialGradient(cx2, cy2, 0, cx2, cy2, 60 + rnd() * 90); cg2.addColorStop(0, 'rgba(40,40,58,0.35)'); cg2.addColorStop(1, 'rgba(40,40,58,0)'); sg.fillStyle = cg2; sg.fillRect(cx2 - 160, cy2 - 160, 320, 320); }
  sg.fillStyle = '#e8e4d4'; sg.beginPath(); sg.arc(300, 120, 16, 0, TAU); sg.fill(); var mgl = sg.createRadialGradient(300, 120, 10, 300, 120, 80); mgl.addColorStop(0, 'rgba(220,220,200,0.35)'); mgl.addColorStop(1, 'rgba(220,220,200,0)'); sg.fillStyle = mgl; sg.fillRect(200, 20, 200, 200);
  var skyT = toTex(sc, {}); skyT.wrapT = THREE.ClampToEdgeWrapping;
  var skyMat = new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false, color: new THREE.Color(0.9, 0.9, 0.9) }); WORLD.skyMat = skyMat;
  var sky = new THREE.Mesh(new THREE.SphereGeometry(280, 32, 16, 0, TAU, 0, PI / 2 + 0.1), skyMat); X.add(sky); WORLD.sky = sky;
  // big roadside sign on a pole (left of lot)
  var sp = group(X, -9.5, 0, 11);
  mesh(new THREE.CylinderGeometry(0.14, 0.18, 7.5, 12), M.steel, 0, 3.75, 0, sp);
  var signTex = toTex(canvasExteriorSign(true), { clamp: true });
  var signMat = new THREE.MeshBasicMaterial({ map: signTex, color: new THREE.Color(2.3, 2.3, 2.3) }); WORLD.exSignMat = signMat;
  var sb = mesh(boxGeo(4.4, 3.3, 0.3, 1), M.black, 0, 8.6, 0, sp);
  var sf = mesh(new THREE.PlaneGeometry(4.2, 3.15), signMat, 0, 8.6, 0.16, sp, false);
  var sf2 = mesh(new THREE.PlaneGeometry(4.2, 3.15), signMat, 0, 8.6, -0.16, sp, false); sf2.rotation.y = PI;
  // Sunny cut-out on the sign top
  var sunTex = toTex(sunnyCanvas(512, { wave: 0.6 }), { clamp: true });
  var sunMat = new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, color: new THREE.Color(1.6, 1.6, 1.6), alphaTest: 0.05 }); WORLD.exSunnyMat = sunMat;
  var su = mesh(new THREE.PlaneGeometry(2.4, 2.4), sunMat, 0.6, 11.2, 0.2, sp, false); WORLD.exSunny = su;
  WORLD.exSign = sp;
  // gas pumps & canopy & price sign
  var gs = group(X, 13, 0, 16);
  mesh(boxGeo(7, 0.4, 4, 1), M.enamelWhite, 0, 4.4, 0, gs); B(7.02, 0.18, 4.02, M.paintRed, 13, 4.25, 16);
  [-2.5, 2.5].forEach(function (x) { mesh(boxGeo(0.25, 4.3, 0.25, 1), M.enamelWhite, x, 2.15, 0, gs); });
  [-1.2, 1.2].forEach(function (x) {
    mesh(boxGeo(0.6, 1.5, 0.45, 1), M.paintRed, x, 0.75, 0, gs); mesh(new THREE.SphereGeometry(0.22, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.0, 1.6) }), x, 1.75, 0, gs, false);
    mesh(boxGeo(0.4, 0.3, 0.02, 1), M.enamelWhite, x, 1.1, 0.24, gs);
  });
  var canopyLight = mesh(new THREE.PlaneGeometry(6, 3.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.7, 1.8) }), 0, 4.19, 0, gs, false); canopyLight.rotation.x = PI / 2;
  var ps = group(X, 18, 0, 24);
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), M.steel, 0, 2, 0, ps);
  var gsm = new THREE.MeshBasicMaterial({ map: toTex(canvasGasSign(), { clamp: true }), color: new THREE.Color(1.4, 1.4, 1.35) });
  mesh(new THREE.PlaneGeometry(1.6, 2.4), gsm, 0, 5.1, 0.05, ps, false);
  mesh(boxGeo(1.7, 2.5, 0.08, 1), M.enamelWhite, 0, 5.1, 0, ps);
  // lot light pole
  var lp = group(X, 4, 0, 14);
  mesh(new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8), M.steel, 0, 3.25, 0, lp); mesh(boxGeo(0.9, 0.12, 0.35, 1), M.steel, -0.4, 6.5, 0, lp);
  mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5.2, 5.5) }), -0.4, 6.43, 0, lp, false).rotation.x = PI / 2;
  // parked old pickup (box-ish) by the gas station
  WORLD.parked = makeCar(0x5b6b5e); WORLD.parked.position.set(9.5, 0, 9); WORLD.parked.rotation.y = -0.3; X.add(WORLD.parked);
  // dumpster behind kitchen
  B(1.8, 1.2, 1.1, stdMat({ color: 0x2f4a3a, roughness: 0.6 }), -1.0, 0.6, -6.6);
  var back = new THREE.PlaneGeometry(40, 12); scaleUV(back, 40 / 6, 2); back.rotateX(-PI / 2); mesh(back, M.asphalt, 0, -0.01, -11.2, X, false);
  // desert scrub (instanced cross planes)
  scrub(X);
  wetStreaks(X);
}
function makeCar(col) {
  var g = new THREE.Group(), paint = stdMat({ color: col, roughness: 0.25, metalness: 0.3, envMapIntensity: 1.2 });
  mesh(roundSlab(1.9, 4.6, 0.7, 0.25), paint, 0, 0.75, 0, g);
  var cabin = mesh(roundSlab(1.7, 2.0, 0.65, 0.2), paint, 0, 1.4, -0.3, g);
  var glassC = mesh(roundSlab(1.72, 1.8, 0.45, 0.18), M.glassDark, 0, 1.45, -0.3, g, false);
  [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.5], [0.85, -1.5]].forEach(function (w) { var wh = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16).rotateZ(PI / 2), M.rubber, w[0], 0.36, w[1], g); });
  mesh(boxGeo(1.9, 0.12, 0.15, 1), M.chrome, 0, 0.55, 2.32, g); mesh(boxGeo(1.9, 0.12, 0.15, 1), M.chrome, 0, 0.55, -2.32, g);
  var hl = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.2, 0.2) }); g.userData.headMat = hl;
  [-0.65, 0.65].forEach(function (x) { mesh(new THREE.CircleGeometry(0.12, 14), hl, x, 0.85, 2.31, g, false); });
  var tl = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.02, 0.02) }); g.userData.tailMat = tl;
  [-0.7, 0.7].forEach(function (x) { var t = mesh(new THREE.PlaneGeometry(0.22, 0.12), tl, x, 0.85, -2.31, g, false); t.rotation.y = PI; });
  return g;
}
function scrub(X) {
  var c = mkCanvas(128, 128), g = c.getContext('2d'), rnd = makeRNG(4);
  g.strokeStyle = '#2b2a1f'; g.lineWidth = 2;
  for (var i = 0; i < 40; i++) { g.beginPath(); g.moveTo(64, 128); g.quadraticCurveTo(64 + (rnd() - 0.5) * 60, 80, 64 + (rnd() - 0.5) * 120, 20 + rnd() * 60); g.stroke(); }
  var mat = new THREE.MeshStandardMaterial({ map: toTex(c, { clamp: true }), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1, color: 0x8a8070 });
  var geo = new THREE.PlaneGeometry(1.2, 1.0); geo.translate(0, 0.5, 0);
  var n = 140, im = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (var k = 0; k < n; k++) {
    var x = (rnd() - 0.5) * 160, z = rnd() < 0.5 ? 44 + rnd() * 80 : -14 - rnd() * 60, s = 0.6 + rnd() * 1.2;
    if (Math.abs(x) < 30 && z > 0 && z < 45) continue;
    q.setFromEuler(new THREE.Euler(0, rnd() * PI, 0)); m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s)); im.setMatrixAt(k, m4);
  }
  X.add(im);
}

// fake wet-asphalt reflections: long soft light streaks under bright lights (additive, ripple-animated)
function wetStreaks(X) {
  var c = mkCanvas(64, 256), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = 'destination-in'; var gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gx; g.fillRect(0, 0, 64, 256);
  var tex = toTex(c, { clamp: true });
  WORLD.streaks = [];
  [[-9.5, 11.6, [2.6, 0.5, 1.4], 2.2, 12], [-9.5, 11.6, [0.4, 1.8, 2.4], 1.3, 9], [4, 14, [1.6, 1.8, 2.0], 1.6, 9], [13, 16, [1.4, 1.5, 1.6], 3.0, 8], [-1.5, 6.2, [2.2, 1.4, 0.8], 9, 4.5], [18, 24, [1.2, 1.2, 1.1], 1.2, 5]].forEach(function (s) {
    var m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(s[2][0], s[2][1], s[2][2]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8, fog: false });
    var p = new THREE.Mesh(new THREE.PlaneGeometry(s[3], s[4]), m); p.rotation.x = -PI / 2; p.position.set(s[0], 0.012, s[1] + s[4] * 0.45); p.renderOrder = 2; X.add(p);
    WORLD.streaks.push({ m: p, base: 0.85, x: s[0], z: s[1] });
  });
}
function updateStreaks(t) {
  if (!WORLD.streaks) return; var cam = RENDER.camera.position, wet = 0.25 + FX.rain * 0.75;
  WORLD.streaks.forEach(function (s, i) { var ang = Math.atan2(cam.x - s.x, cam.z - s.z), H = s.m.geometry.parameters.height, dist = Math.hypot(cam.x - s.x, cam.z - s.z), L = Math.min(H, dist * 0.5), k = L / H;
    s.m.rotation.z = -ang; s.m.scale.y = k; s.m.position.x = s.x + Math.sin(ang) * L * 0.5; s.m.position.z = s.z + Math.cos(ang) * L * 0.5;
    s.m.material.opacity = s.base * wet * (0.85 + 0.15 * Math.sin(t * 7 + i * 2.1)) * (i < 2 ? LSTATE.neon : 1); });
}
