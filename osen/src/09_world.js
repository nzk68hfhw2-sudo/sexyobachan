// ---- 町をつくる ------------------------------------------------------------------------
var WORLD = { scene: null, statics: [], friends: [], lamps: [], signsGroup: null, water: null, teleports: [], zones: [], bulbs: null, extra: null };
var FRIEND_MATS = [];
function friendMat(set, tint) {
  var key = set + '|' + (tint || 0);
  if (!FRIEND_MATS[key]) {
    FRIEND_MATS[key] = new THREE.MeshLambertMaterial({ map: FRIENDS.texs[set] || null, color: tint || 0xffffff, side: THREE.DoubleSide });
  }
  return FRIEND_MATS[key];
}
// 手足と頭を動かせるマテリアル（モデルに骨が無いので、形をシェーダーで関節ごとに曲げる）
function animMat(set) {
  var u = { uArmLo: { value: set === 0 ? 0.30 : 0.2 }, uH: { value: 1.06 }, uLegL: { value: 0 }, uLegR: { value: 0 }, uArmL: { value: 0 }, uArmR: { value: 0 }, uRaiseL: { value: 0 }, uRaiseR: { value: 0 }, uHeadP: { value: 0 }, uHeadY: { value: 0 } };
  var m = new THREE.MeshLambertMaterial({ map: FRIENDS.texs[set] || null, side: THREE.DoubleSide });
  m.userData.u = u;
  m.onBeforeCompile = function (sh) {
    for (var k in u) sh.uniforms[k] = u[k];
    sh.vertexShader = 'uniform float uArmLo, uH, uLegL, uLegR, uArmL, uArmR, uRaiseL, uRaiseR, uHeadP, uHeadY;\n' +
      'vec3 rx(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x, p.y*c - p.z*s, p.y*s + p.z*c); }\n' +
      'vec3 rz(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x*c - p.y*s, p.x*s + p.y*c, p.z); }\n' +
      'vec3 ry(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x*c + p.z*s, p.y, -p.x*s + p.z*c); }\n' +
      sh.vertexShader.replace('#include <begin_vertex>', [
        'vec3 transformed = vec3(position);',
        'float H = uH; float sd = position.x >= 0.0 ? 1.0 : -1.0;',
        // 足：腰を中心に前後にふる
        'float wl = 1.0 - smoothstep(H*0.20, H*0.33, position.y);',
        'vec3 hip = vec3(sd*H*0.045, H*0.32, 0.0);',
        'transformed = rx(transformed - hip, (sd > 0.0 ? uLegR : uLegL) * wl) + hip;',
        // 腕：肩を中心に前後にふる・横に上げる
        'float wa = smoothstep(H*0.118, H*0.135, abs(position.x)) * (1.0 - smoothstep(H*0.54, H*0.60, position.y)) * smoothstep(H*uArmLo, H*(uArmLo + 0.08), position.y) * (1.0 - smoothstep(0.07*H, 0.12*H, abs(position.z)));',
        'vec3 sho = vec3(sd*H*0.115, H*0.59, 0.0);',
        'vec3 q = transformed - sho; q = rx(q, (sd > 0.0 ? uArmR : uArmL) * wa); q = rz(q, sd * (sd > 0.0 ? uRaiseR : uRaiseL) * wa); transformed = q + sho;',
        // 頭：首を中心にうなずく・横にふる
        'float wh = smoothstep(H*0.64, H*0.72, position.y);',
        'vec3 nk = vec3(0.0, H*0.66, 0.0);',
        'transformed = ry(rx(transformed - nk, uHeadP * wh), uHeadY * wh) + nk;'
      ].join('\n'));
  };
  m.customProgramCacheKey = function () { return 'friendAnim'; };
  return m;
}
function animMesh(geo) { var m = new THREE.Mesh(geo, animMat(geo.userData.set || 0)); m.material.userData.u.uH.value = geo.userData.h || 1.06; m.castShadow = true; return m; }
// 8人のうち idx 番の友達を置く（scale 1 = 身長 約1.25m）
function addFriend(idx, x, y, z, rot, scale, opt) {
  opt = opt || {};
  var geo = (opt.lo || LITE.on) ? FRIENDS.lo[idx] : FRIENDS.hi[idx];
  if (!geo) { geo = new THREE.CylinderGeometry(0.2, 0.25, 1.06, 8); geo.translate(0, 0.53, 0); }
  var m = new THREE.Mesh(geo, friendMat(geo.userData.set || 0, opt.tint));
  var s = (scale || 1) * 1.18;
  m.scale.set(s, s, s); m.position.set(x, y, z); m.rotation.y = rot || 0;
  m.castShadow = true; m.receiveShadow = false;
  var f = { mesh: m, idx: idx, base: new THREE.Vector3(x, y, z), rot: rot || 0, scale: s, anim: opt.anim || 'idle', phase: Math.random() * 10, clone: !!opt.clone, look: !!opt.look, area: opt.area };
  WORLD.scene.add(m); WORLD.friends.push(f);
  if (opt.col !== false && !opt.clone) { var r = 0.28 * s; colAdd(x - r, y, z - r, x + r, y + 1.06 * s, z + r, 'friend'); }
  return f;
}
function gnd(key, x0, z0, x1, z1, y, tile, color) {
  B.box(key, (x0 + x1) / 2, y - 0.05, (z0 + z1) / 2, Math.abs(x1 - x0), 0.1, Math.abs(z1 - z0), color == null ? 0xffffff : color, { tile: [tile || 4, tile || 4], skip: 'ny' });
}
var _M = null;
function mtx(x, y, z, ry, sx, sy, sz, rx, rz) {
  var m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(rx || 0, ry || 0, rz || 0);
  q.setFromEuler(e); m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz)); return m;
}
var GEO = {};
function baseGeos() {
  GEO.cyl8 = new THREE.CylinderGeometry(1, 1, 1, 8); GEO.cyl12 = new THREE.CylinderGeometry(1, 1, 1, 14);
  GEO.cone = new THREE.ConeGeometry(1, 1, 8); GEO.sph = new THREE.IcosahedronGeometry(1, 1); GEO.sph2 = new THREE.SphereGeometry(1, 12, 8);
  GEO.torus = new THREE.TorusGeometry(1, 0.15, 6, 16);
}
function tree(x, z, s, kind) {
  s = s || 1; var y = terrainY(x, z);
  B.geo('plain', GEO.cyl8, mtx(x, y + 1.2 * s, z, 0, 0.18 * s, 2.4 * s, 0.18 * s), 0x7a4e2a);
  if (kind === 'pine') {
    for (var i = 0; i < 3; i++) B.geo('leaf', GEO.cone, mtx(x, y + (2.2 + i * 1.1) * s, z, i, (1.7 - i * 0.45) * s, 1.8 * s, (1.7 - i * 0.45) * s), [0x2f7a3a, 0x3a8a44, 0x46a050][i]);
  } else if (kind === 'sakura') {
    for (i = 0; i < 4; i++) B.geo('leaf', GEO.sph, mtx(x + rand(-0.8, 0.8) * s, y + rand(2.6, 3.6) * s, z + rand(-0.8, 0.8) * s, rand(0, 3), rand(1.1, 1.5) * s), pick([0xffb7d5, 0xffc8e0, 0xff9cc8]));
  } else {
    for (i = 0; i < 4; i++) B.geo('leaf', GEO.sph, mtx(x + rand(-0.7, 0.7) * s, y + rand(2.5, 3.5) * s, z + rand(-0.7, 0.7) * s, rand(0, 3), rand(1.0, 1.4) * s), pick([0x3f9a3a, 0x52b148, 0x2e8a35, 0x66c24f]));
  }
  colAdd(x - 0.25 * s, y, z - 0.25 * s, x + 0.25 * s, y + 3 * s, z + 0.25 * s);
}
function lamp(x, z, rot) {
  B.geo('metal', GEO.cyl8, mtx(x, 2.4, z, 0, 0.09, 4.8, 0.09), 0x556070);
  B.box('metal', x + Math.sin(rot || 0) * 0.5, 4.75, z + Math.cos(rot || 0) * 0.5, 0.25, 0.08, 1.1, 0x556070, { rot: rot || 0 });
  WORLD.lamps.push(new THREE.Vector3(x + Math.sin(rot || 0) * 0.95, 4.6, z + Math.cos(rot || 0) * 0.95));
  colAdd(x - 0.12, 0, z - 0.12, x + 0.12, 4.8, z + 0.12);
}
var POLES = [];
function pole(x, z) {
  B.geo('wood', GEO.cyl8, mtx(x, 4.5, z, 0, 0.16, 9, 0.16), 0x9a8a78);
  B.box('wood', x, 8.4, z, 1.8, 0.12, 0.12, 0x6a5a48);
  B.geo('plain', GEO.cyl8, mtx(x + 0.5, 7.6, z, 0, 0.22, 0.6, 0.22), 0x8a8a8a);
  POLES.push([x, z]); colAdd(x - 0.18, 0, z - 0.18, x + 0.18, 9, z + 0.18);
}
function fence(x0, z0, x1, z1, h, color, noCol) {
  var dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz), rot = Math.atan2(dx, dz);
  var n = Math.max(1, Math.round(L / 2));
  for (var i = 0; i <= n; i++) { var t = i / n; B.box('metal', x0 + dx * t, h / 2, z0 + dz * t, 0.08, h, 0.08, color || 0x5a7a5a); }
  B.box('metal', (x0 + x1) / 2, h * 0.95, (z0 + z1) / 2, 0.06, 0.06, L, color || 0x5a7a5a, { rot: rot });
  B.box('metal', (x0 + x1) / 2, h * 0.45, (z0 + z1) / 2, 0.04, 0.04, L, color || 0x5a7a5a, { rot: rot });
  if (!noCol) {
    if (Math.abs(dx) < 0.01) colAdd(x0 - 0.1, 0, Math.min(z0, z1), x0 + 0.1, h, Math.max(z0, z1));
    else if (Math.abs(dz) < 0.01) colAdd(Math.min(x0, x1), 0, z0 - 0.1, Math.max(x0, x1), h, z0 + 0.1);
  }
}
// 入れる建物。doors: [{s:'n'|'s'|'e'|'w', c:中心座標, w:幅, h:高さ}]
function hollow(o) {
  var x0 = o.x0, x1 = o.x1, z0 = o.z0, z1 = o.z1, y0 = o.y0 || 0, h = o.h, t = o.t || 0.3, key = o.mat || 'concrete', col = o.color == null ? 0xffffff : o.color;
  var tile = o.tile || [4, 3];
  function wall(side, a0, a1) { // a = coordinate along wall
    var doors = (o.doors || []).filter(function (d) { return d.s === side; }).sort(function (p, q) { return p.c - q.c; });
    var segs = [], cur = a0;
    doors.forEach(function (d) { segs.push([cur, d.c - d.w / 2, 0, h]); segs.push([d.c - d.w / 2, d.c + d.w / 2, d.h || 2.5, h]); cur = d.c + d.w / 2; });
    segs.push([cur, a1, 0, h]);
    segs.forEach(function (sg) {
      if (sg[1] - sg[0] < 0.01 || sg[3] - sg[2] < 0.01) return;
      var ya = y0 + sg[2], yb = y0 + sg[3];
      if (side === 's') solidR(key, sg[0], ya, z1 - t, sg[1], yb, z1, col, { tile: tile, worldY: true });
      if (side === 'n') solidR(key, sg[0], ya, z0, sg[1], yb, z0 + t, col, { tile: tile, worldY: true });
      if (side === 'w') solidR(key, x0, ya, sg[0], x0 + t, yb, sg[1], col, { tile: tile, worldY: true });
      if (side === 'e') solidR(key, x1 - t, ya, sg[0], x1, yb, sg[1], col, { tile: tile, worldY: true });
    });
  }
  wall('s', x0, x1); wall('n', x0, x1); wall('w', z0 + t, z1 - t); wall('e', z0 + t, z1 - t);
  if (o.floor) deco(o.floor, x0 + t, y0, z0 + t, x1 - t, y0 + 0.03, z1 - t, 0xffffff, { tile: [2, 2] });
  if (o.inner) { // 内壁
    var it = 0.02;
    deco(o.inner, x0 + t, y0, z0 + t, x1 - t, y0 + h - 0.3, z0 + t + it, 0xffffff, { tile: [2, 2], worldY: true });
    deco(o.inner, x0 + t, y0, z1 - t - it, x1 - t, y0 + h - 0.3, z1 - t, 0xffffff, { tile: [2, 2], worldY: true, skip: 'pz' });
  }
  solidR(o.roofMat || key, x0, y0 + h, z0, x1, y0 + h + 0.3, z1, o.roofColor || col, { tile: [4, 4] });
  deco('glow', (x0 + x1) / 2 - 0.8, y0 + h - 0.06, (z0 + z1) / 2 - 0.15, (x0 + x1) / 2 + 0.8, y0 + h, (z0 + z1) / 2 + 0.15, 0xffffff);
  WORLD.zones.push({ x0: x0, x1: x1, z0: z0, z1: z1, y0: y0, y1: y0 + h, indoor: true, name: o.name });
}
function house(x, z, w, d, h, rot, color, roofColor) {
  var r = rot || 0, sw = (Math.abs(Math.sin(r)) > 0.5) ? d : w, sd = (Math.abs(Math.sin(r)) > 0.5) ? w : d;
  solid('house', x, h / 2, z, sw, h, sd, color || 0xffffff, { tile: [4, 3], worldY: true });
  // 切妻屋根
  var rg = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1); // pyramid-ish
  B.geo('roof', rg, mtx(x, h + 1.1, z, PI / 4 + r, sw * 0.78, 2.2, sd * 0.78), roofColor || 0xffffff, 3);
}
function roadMarks(x0, z0, x1, z1, alongX) {
  if (alongX) { for (var x = x0 + 2; x < x1; x += 6) deco('plainS', x, 0.012, (z0 + z1) / 2 - 0.12, x + 3, 0.02, (z0 + z1) / 2 + 0.12, 0xf2f2f2); }
  else { for (var z = z0 + 2; z < z1; z += 6) deco('plainS', (x0 + x1) / 2 - 0.12, 0.012, z, (x0 + x1) / 2 + 0.12, 0.02, z + 3, 0xf2f2f2); }
}
function crosswalk(cx, cz, alongX, w) {
  for (var i = -4; i <= 4; i++) {
    if (alongX) deco('plainS', cx + i * 0.9 - 0.3, 0.014, cz - w / 2, cx + i * 0.9 + 0.3, 0.022, cz + w / 2, 0xf6f6f6);
    else deco('plainS', cx - w / 2, 0.014, cz + i * 0.9 - 0.3, cx + w / 2, 0.022, cz + i * 0.9 + 0.3, 0xf6f6f6);
  }
}
function bench(x, z, rot) {
  B.box('wood', x, 0.45, z, 1.8, 0.08, 0.5, 0xb07a40, { rot: rot }); B.box('wood', x - Math.cos(rot) * 0 + Math.sin(rot) * -0.22, 0.75, z + Math.cos(rot) * -0.22, 1.8, 0.4, 0.06, 0xb07a40, { rot: rot });
  B.box('metal', x, 0.22, z, 1.6, 0.44, 0.08, 0x333333, { rot: rot });
  var c = Math.abs(Math.cos(rot)) > 0.5; colAdd(x - (c ? 0.9 : 0.25), 0, z - (c ? 0.25 : 0.9), x + (c ? 0.9 : 0.25), 0.5, z + (c ? 0.25 : 0.9));
}

function buildWorld(scene) {
  WORLD.scene = scene; B = new Batch(); baseGeos();
  var i, j, x, z;
  // ===== 地面 =====
  gnd('ground_grass', -170, -170, 170, RIVER.z0, 0, 5);
  gnd('ground_grass', -170, RIVER.z3, 170, 180, 0, 5);
  // 川の断面（護岸 → 川底）
  (function riverBed() {
    var zs = [RIVER.z0, RIVER.z1, RIVER.z2, RIVER.z3], ys = [0, RIVER.bed, RIVER.bed, 0];
    for (var k = 0; k < 3; k++) {
      var g = new THREE.PlaneGeometry(340, Math.hypot(zs[k + 1] - zs[k], ys[k + 1] - ys[k]), 1, 1);
      var ang = Math.atan2(ys[k + 1] - ys[k], zs[k + 1] - zs[k]);
      var m = mtx(0, (ys[k] + ys[k + 1]) / 2, (zs[k] + zs[k + 1]) / 2, 0, 1, 1, 1, -PI / 2 + ang * -1);
      // rotation: plane faces +z -> rotate -90 around x to face up, then tilt
      var mm = new THREE.Matrix4().makeRotationX(-PI / 2 - ang);
      mm.setPosition(0, (ys[k] + ys[k + 1]) / 2, (zs[k] + zs[k + 1]) / 2);
      B.geo(k === 1 ? 'ground_sand' : 'ground_conc', g, mm, k === 1 ? 0x9a9070 : 0xbbbbbb, k === 1 ? 20 : 30);
    }
  })();
  // 道路
  gnd('ground_asphalt', -170, -37, 170, -27, 0.01, 6); roadMarks(-170, -37, 170, -27, true);
  gnd('ground_asphalt', -170, 27, 170, 37, 0.01, 6); roadMarks(-170, 27, 170, 37, true);
  gnd('ground_asphalt', -37, -150, -27, 46, 0.012, 6); roadMarks(-37, -150, -27, -37, false); roadMarks(-37, -27, -27, 27, false);
  gnd('ground_asphalt', 25, -150, 33, 46, 0.012, 6); roadMarks(25, -150, 33, -37, false); roadMarks(25, -27, 33, 27, false);
  crosswalk(-32, -40, true, 3); crosswalk(-32, 24, true, 3); crosswalk(29, -40, true, 3); crosswalk(29, 24, true, 3); crosswalk(0, -32, false, 3); crosswalk(0, 32, false, 3);
  // 歩道（少し高い）
  solidR('ground_side', -27, 0, -27, 25, 0.14, -25.5, 0xffffff, { tile: [2, 2] });
  solidR('ground_side', -27, 0, 25.5, 25, 0.14, 27, 0xffffff, { tile: [2, 2] });
  // 駅前広場
  gnd('ground_tiles', -30, -70, 30, -37, 0.03, 4);
  // 公園
  gnd('ground_sand', -3, -25, 3, 25, 0.025, 3); gnd('ground_sand', -25, -3, 25, 3, 0.024, 3);
  // 商店街アーケード床
  gnd('ground_tiles', 33, -32, 67, 27, 0.03, 3);
  // 河川敷の遊歩道
  gnd('ground_sand', -170, 40, 170, 46, 0.02, 3); gnd('ground_sand', -170, 68, 170, 72, 0.02, 3);
  // 空き地
  gnd('ground_dirt', 30, 73, 105, 118, 0.02, 5);
  // 団地の敷地
  gnd('ground_conc', -105, -62, -40, 46, 0.015, 4, 0x9c9c94);
  // 線路
  gnd('ground_rails', -55, -101, 170, -92, 0.02, 4);
  B.box('metal', 57, 0.12, -98.2, 226, 0.12, 0.1, 0xb0b8c0, { rot: PI / 2 }); B.box('metal', 57, 0.12, -94.8, 226, 0.12, 0.1, 0xb0b8c0, { rot: PI / 2 });
  solidR('metal', -57, 0, -101, -55, 1.0, -92, 0xffdd00); // 車止め

  // ===== 駅 =====
  hollow({ x0: -18, x1: 18, z0: -84, z1: -70, h: 5, mat: 'station', tile: [6, 5], floor: 'floor', doors: [{ s: 's', c: 0, w: 4, h: 3 }, { s: 'n', c: 0, w: 4, h: 3 }, { s: 's', c: -12, w: 2.5, h: 2.6 }], roofMat: 'concrete', name: '駅舎' });
  solidR('station', -18, 5.3, -84, 18, 9, -70, 0xffffff, { tile: [6, 5], worldY: true }); // 上の階（中には入れない）
  solidR('concrete', -19, 9, -85, 19, 9.4, -69, 0xdddddd);
  // 改札
  for (i = -3; i <= 3; i++) { if (i === 0) continue; solidR('metal', i * 1.6 - 0.25, 0, -78.5, i * 1.6 + 0.25, 1.0, -76.5, 0x9aa6b8); }
  solidR('wood', -17.5, 0, -83.5, -11, 1.1, -82.5, 0xffffff); // 窓口
  // ホーム
  solidR('concrete', -50, 0, -92, 60, 0.45, -84, 0xcfcac0, { tile: [4, 4] });
  deco('plainS', -50, 0.45, -92.2, 60, 0.47, -91.6, 0xffe14a); // 点字ブロック風の線
  for (x = -44; x <= 56; x += 10) { B.geo('metal', GEO.cyl8, mtx(x, 2.4, -86, 0, 0.1, 4, 0.1), 0x8090a0); colAdd(x - 0.12, 0, -86.12, x + 0.12, 4.5, -85.88); }
  deco('metal', -50, 4.4, -90, 60, 4.6, -84, 0x7a8a9a); // ホームの屋根
  bench(-30, -86.5, 0); bench(30, -86.5, 0); bench(44, -86.5, 0);
  // 工事中の足場（屋根へのかくし道）
  for (i = 0; i < 20; i++) {
    var sy = 0.45 * (i + 1), sz0 = -67.5 - i * 0.82;
    solidR('wood', 18.2, sy - 0.12, sz0 - 0.82, 20.4, sy, sz0, 0xc8a060);
    B.geo('metal', GEO.cyl8, mtx(20.45, sy / 2, sz0 - 0.4, 0, 0.04, sy, 0.04), 0xc0c0c0);
  }
  solidR('wood', 18.2, 9.0 - 0.12, -85.2, 20.4, 9.0, -83.9, 0xc8a060);
  fence(20.5, -67.5, 20.5, -85, 10.2, 0xd0d0d0, true);
  colAdd(20.4, 0, -85.5, 20.7, 12, -67.5);

  // 駅前ロータリー
  B.geo('plainS', GEO.cyl12, mtx(0, 0.15, -53, 0, 7, 0.3, 7), 0x8a8a80); colAdd(-5, 0, -58, 5, 0.3, -48);
  gnd('ground_grass', -4.5, -57.5, 4.5, -48.5, 0.31, 3);
  solidR('metal', -0.06, 0, -48.0, 0.06, 0.8, -47.8, 0x556070); // ロータリー看板の足
  // 時計塔
  solidR('metal', -0.3, 0.3, -53.3, 0.3, 6, -52.7, 0x8899aa);
  B.geo('plainS', GEO.cyl12, mtx(0, 6.3, -53, 0, 0.9, 0.25, 0.9, PI / 2), 0xffffff);
  lamp(-22, -44, 0); lamp(22, -44, 0); lamp(-22, -62, PI); lamp(22, -62, PI);
  bench(-12, -42, PI); bench(12, -42, PI);
  // バス停の屋根
  deco('metal', 14, 2.6, -66, 22, 2.7, -63.5, 0x3a6aa0); solidR('metal', 14, 0, -63.6, 14.2, 2.6, -63.4, 0x3a6aa0); solidR('metal', 21.8, 0, -63.6, 22, 2.6, -63.4, 0x3a6aa0);
  deco('glass', 14, 0.3, -66, 22, 2.5, -65.9, 0xffffff); colAdd(14, 0, -66.05, 22, 2.5, -65.85);
  // 駅前の植え込み・ビル
  for (x = -28; x <= 28; x += 8) { if (Math.abs(x) < 6) continue; tree(x, -38.6, 0.8, 'round'); }
  house(-44, -46, 12, 14, 12, 0, 0xd8e0ff, 0x4060a0); house(-44, -66, 12, 14, 9, 0, 0xffe0d0, 0xa04040);
  house(44, -48, 14, 12, 14, 0, 0xfff0c0, 0x406040); house(44, -66, 14, 12, 10, 0, 0xe0ffe8, 0x405080);

  // ===== 商店街 =====
  var slot = 55 / 8;
  for (var side = 0; side < 2; side++) {
    var sx0 = side ? 56 : 35, sx1 = side ? 65 : 44, front = side ? sx0 : sx1;
    for (i = 0; i < 8; i++) {
      var za = -30 + i * slot, zb = za + slot;
      var special = (side === 0 && (i === 5 || i === 6)) || (side === 1 && (i === 3 || i === 4)) || (side === 0 && i === 0);
      if (special) continue;
      // 閉まった店（シャッター）または中が見える店
      solidR('shop', sx0, 0, za, sx1, 7, zb, pick([0xffffff, 0xffeedd, 0xeeffee, 0xeeeeff]), { tile: [6.9, 7], worldY: true });
      deco('shutter', front + (side ? -0.05 : 0.05), 0.02, za + 0.4, front + (side ? -0.06 : 0.06), 3.2, zb - 0.4, 0xffffff, { tile: [2, 1] });
      // 日よけテント
      var tentC = [0xff3355, 0x33aaff, 0xffcc00, 0x33cc66, 0xff66cc, 0x9966ff][(i + side * 3) % 6];
      B.box('plain', front + (side ? -0.7 : 0.7), 3.5, (za + zb) / 2, 1.4, 0.08, slot - 0.3, tentC, { rot: 0 });
    }
  }
  // 分け目くんのショーウィンドウ（西側 0番）
  hollow({ x0: 35, x1: 44, z0: -30, z1: -30 + slot, h: 4, mat: 'shop', tile: [6.9, 7], doors: [{ s: 'e', c: -30 + slot / 2, w: slot - 1.2, h: 3.2 }], floor: 'wallpaper', name: 'ブティック' });
  solidR('shop', 35, 4.3, -30, 44, 7, -30 + slot, 0xffd0f0, { tile: [6.9, 7], worldY: true });
  B.box('glass', 43.85, 1.75, -30 + slot / 2, 0.06, 3.1, slot - 1.2, 0xffffff); colAdd(43.8, 0, -30 + 0.6, 43.95, 3.3, -30 + slot - 0.6, 'glass');
  solidR('plainS', 38, 0, -28, 41, 0.4, -25, 0xffffff); // 台
  // 喫茶（西側 5-6）
  var kz0 = -30 + 5 * slot, kz1 = -30 + 7 * slot;
  hollow({ x0: 35, x1: 44, z0: kz0, z1: kz1, h: 4, mat: 'brick', tile: [3, 3], floor: 'wood', inner: 'wallpaper', doors: [{ s: 'e', c: (kz0 + kz1) / 2, w: 2.2, h: 2.6 }], name: '喫茶ジャスミソ' });
  solidR('brick', 35, 4.3, kz0, 44, 7, kz1, 0xffffff, { tile: [3, 3], worldY: true });
  for (i = 0; i < 3; i++) { var tz = kz0 + 2.5 + i * 3.6; B.geo('woodS', GEO.cyl12, mtx(38.5, 0.75, tz, 0, 0.6, 0.06, 0.6), 0x6a3a1a); B.geo('metal', GEO.cyl8, mtx(38.5, 0.37, tz, 0, 0.06, 0.74, 0.06), 0x333333); colAdd(37.9, 0, tz - 0.6, 39.1, 0.78, tz + 0.6); }
  solidR('woodS', 35.4, 0, kz0 + 1, 36.4, 1.1, kz1 - 1, 0x5a2a10); // カウンター
  // コソビニ（東側 3-4）
  var cz0 = -30 + 3 * slot, cz1 = -30 + 5 * slot;
  hollow({ x0: 56, x1: 65, z0: cz0, z1: cz1, h: 4, mat: 'concrete', color: 0xffffff, tile: [4, 4], floor: 'floor', doors: [{ s: 'w', c: (cz0 + cz1) / 2, w: 3, h: 2.8 }], name: 'コソビニ' });
  solidR('shop', 56, 4.3, cz0, 65, 7, cz1, 0xffffff, { tile: [6.9, 7], worldY: true });
  deco('plain', 55.8, 3.0, cz0, 56, 3.6, cz1, 0x00a050); deco('plain', 55.8, 3.6, cz0, 56, 3.9, cz1, 0xff6a00);
  for (i = 0; i < 3; i++) { solidR('metal', 59 + i * 2, 0, cz0 + 2.5, 59.6 + i * 2, 1.6, cz1 - 2.5, 0xf0f0f0); for (j = 0; j < 4; j++) deco('plain', 58.95 + i * 2, 0.3 + j * 0.38, cz0 + 2.6, 59.65 + i * 2, 0.5 + j * 0.38, cz1 - 2.6, pick([0xff4040, 0x40a0ff, 0xffd040, 0x60e060, 0xff80c0])); }
  solidR('metal', 57, 0, cz0 + 0.8, 58.2, 1.05, cz0 + 4, 0xdddddd); // レジ
  deco('glow', 64.6, 0.2, cz0 + 0.5, 64.7, 2.2, cz1 - 0.5, 0xddf6ff);
  // アーケードの屋根
  for (z = -30; z < 25; z += 5) {
    B.box('arcade', 50, 7.6, z + 2.5, 12.4, 0.05, 4.8, [0xff99cc, 0x99ccff, 0xffff99, 0xccff99][Math.abs(Math.round(z / 5)) % 4]);
    B.box('metal', 50, 7.5, z, 12.6, 0.15, 0.15, 0x777777);
  }
  for (z = -30; z <= 25; z += 11) { B.geo('metal', GEO.cyl8, mtx(44.3, 3.8, z, 0, 0.1, 7.6, 0.1), 0x888888); B.geo('metal', GEO.cyl8, mtx(55.7, 3.8, z, 0, 0.1, 7.6, 0.1), 0x888888); }
  // 商店街の奥の家
  for (z = -110; z < -40; z += 16) { house(42, z, 12, 12, rand(8, 16), 0, pick([0xffffff, 0xffe8e0, 0xe0f0ff]), pick([0x404080, 0x804040, 0x406040])); }

  // ===== 団地 =====
  var DB = [[-95, -50, -55, -45], [-95, -50, -20, -10], [-95, -50, 15, 25]];
  // 1号棟
  solidR('danchi', DB[0][0], 0, DB[0][2], DB[0][1], 15, DB[0][3], 0xffffff, { tile: [4.5, 3.75], worldY: true });
  // 2号棟（1階に入れる部屋）
  solidR('danchi', -95, 0, -20, -74, 15, -10, 0xffffff, { tile: [4.5, 3.75], worldY: true });
  solidR('danchi', -64, 0, -20, -50, 15, -10, 0xffffff, { tile: [4.5, 3.75], worldY: true });
  hollow({ x0: -74, x1: -64, z0: -20, z1: -10, h: 3.2, mat: 'danchi', tile: [4.5, 3.75], floor: 'tatami', inner: 'wallpaper', doors: [{ s: 's', c: -69, w: 1.6, h: 2.3 }], name: '２号棟１０１号室' });
  solidR('danchi', -74, 3.5, -20, -64, 15, -10, 0xffffff, { tile: [4.5, 3.75], worldY: true });
  // 3号棟（外階段で屋上へ）
  solidR('danchiS', DB[2][0], 0, DB[2][2], DB[2][1], 15, DB[2][3], 0xffffff, { tile: [4.5, 3.75], worldY: true });
  for (i = 0; i < 40; i++) {
    var ty = 0.375 * (i + 1), tx = -51 - i;
    solidR('concreteS', tx - 1, ty - 0.2, 25.4, tx, ty, 27.6, 0xcfcfcf);
  }
  solidR('concreteS', -95, 14.8, 25, -91, 15, 27.6, 0xcfcfcf);
  B.box('plainS', -71, 8.5, 27.7, 42, 0.08, 0.06, 0x6a7a8a, { rot: 0 });
  for (i = 0; i < 40; i += 3) B.box('plainS', -51 - i, 0.375 * i + 0.9, 27.65, 0.06, 1.0, 0.06, 0x6a7a8a);
  colAdd(-95.4, 0, 27.6, -50, 16.5, 27.8); // 手すり
  // 屋上の手すりと給水塔
  fence(-95, 15, -50, 15, 1.1 + 15, 0x9aa8b0, true); colAdd(-95, 15, 14.8, -50, 16.2, 15);
  fence(-95, 15, -95, 25, 16.1, 0x9aa8b0, true); colAdd(-95.2, 15, 15, -95, 16.2, 25); colAdd(-50, 15, 15, -49.8, 16.2, 25);
  colAdd(-95.4, 15, 25, -95.2, 16.2, 27.8); // 階段上の西の手すり
  B.geo('metal', GEO.cyl12, mtx(-72, 17, 20, 0, 2, 3, 2), 0xd8e0e8); colAdd(-74, 15, 18, -70, 18.5, 22);
  for (i = 0; i < 4; i++) B.geo('metal', GEO.cyl8, mtx(-73.5 + (i % 2) * 3, 15.4, 18.5 + (i >> 1) * 3, 0, 0.08, 0.8, 0.08), 0x777777);
  // 団地の木とベンチ
  for (x = -92; x <= -54; x += 9) { tree(x, -36 + 2, 1, 'round'); tree(x, 3, 0.9, 'sakura'); tree(x, 37, 1, 'round'); }
  bench(-80, 4, 0); bench(-65, 4, 0);
  // 自転車置き場の屋根
  deco('metal', -94, 2.4, -42, -80, 2.5, -38, 0x3aa070); for (x = -94; x <= -80; x += 7) solidR('metal', x, 0, -38.2, x + 0.15, 2.4, -38, 0x3aa070);
  // 1号棟のごみ捨て場
  fence(-60, -42, -54, -42, 1.2, 0x2a8a3a); fence(-60, -42, -60, -38, 1.2, 0x2a8a3a); fence(-54, -42, -54, -38, 1.2, 0x2a8a3a);

  // ===== 公園 =====
  for (i = 0; i < 28; i++) { var a = i / 28 * TAU; var tx2 = Math.cos(a) * 21.5, tz2 = Math.sin(a) * 21.5; if (Math.abs(tx2) < 4 || Math.abs(tz2) < 4) continue; tree(tx2, tz2, rand(0.9, 1.25), i % 3 === 0 ? 'sakura' : 'round'); }
  // 噴水
  B.geo('concrete', GEO.cyl12, mtx(0, 0.3, 0, 0, 3.6, 0.6, 3.6), 0xe8e4dc); colAdd(-3.2, 0, -3.2, 3.2, 0.6, 3.2);
  B.geo('plainS', GEO.cyl12, mtx(0, 0.62, 0, 0, 3.2, 0.04, 3.2), 0x37b6e0);
  B.geo('concrete', GEO.cyl8, mtx(0, 1.4, 0, 0, 0.4, 1.6, 0.4), 0xe8e4dc); B.geo('concrete', GEO.cyl12, mtx(0, 2.2, 0, 0, 1.4, 0.2, 1.4), 0xe8e4dc);
  // 8人の像の台座
  for (i = 0; i < 8; i++) { var pa = i / 8 * TAU + PI / 8; solid('concrete', Math.cos(pa) * 10, 0.4, Math.sin(pa) * 10, 1.3, 0.8, 1.3, 0xd8d2c8); }
  // すべり台
  solidR('metal', 12, 0, -19, 13.6, 2.6, -17.4, 0xff4444); // 台
  for (i = 0; i < 6; i++) solidR('metal', 13.6 + i * 0.4, 0, -19, 14.0 + i * 0.4, 2.6 - (i + 1) * 0.42, -17.4, 0xffcc00);
  for (i = 0; i < 6; i++) solidR('metal', 12 - (i + 1) * 0.35, 0, -19, 12 - i * 0.35, 2.6 - (i + 1) * 0.42, -17.4, 0x44aaff);
  // ブランコ
  B.box('metal', -15, 2.6, -17, 4.4, 0.12, 0.12, 0xff6600); for (i = -1; i <= 1; i += 2) { B.box('metal', -15 + i * 2.1, 1.3, -17.6, 0.1, 2.6, 0.1, 0xff6600, { rot: 0 }); B.box('metal', -15 + i * 2.1, 1.3, -16.4, 0.1, 2.6, 0.1, 0xff6600); colAdd(-15 + i * 2.1 - 0.1, 0, -17.7, -15 + i * 2.1 + 0.1, 2.7, -16.3); }
  // 砂場
  gnd('ground_sand', -19, 12, -11, 19, 0.06, 2); solidR('wood', -19.3, 0, 11.7, -10.7, 0.22, 12, 0xc08040); solidR('wood', -19.3, 0, 19, -10.7, 0.22, 19.3, 0xc08040); solidR('wood', -19.3, 0, 12, -19, 0.22, 19, 0xc08040); solidR('wood', -11, 0, 12, -10.7, 0.22, 19, 0xc08040);
  // 公衆トイレ
  hollow({ x0: 12, x1: 19, z0: 12, z1: 18, h: 3, mat: 'brick', tile: [3, 3], floor: 'floor', inner: 'concreteS', doors: [{ s: 'w', c: 15, w: 1.4, h: 2.3 }], roofColor: 0x5a8a5a, name: '公衆トイレ' });
  for (i = 0; i < 2; i++) solidR('plainS', 16.5, 0, 12.4 + i * 2.6, 18.6, 2.2, 12.5 + i * 2.6, 0xd0e8ff);
  bench(-8, 22.5, PI); bench(8, 22.5, PI); bench(-22.5, 8, PI / 2); bench(22.5, -8, -PI / 2);
  lamp(-6, -6, PI / 4); lamp(6, 6, -PI * 3 / 4); lamp(-6, 6, PI * 3 / 4); lamp(6, -6, -PI / 4);
  // 生け垣
  fence(-25, -25, -4, -25, 0.9, 0x2d7a2d); fence(4, -25, 25, -25, 0.9, 0x2d7a2d); fence(-25, 25, -4, 25, 0.9, 0x2d7a2d); fence(4, 25, 25, 25, 0.9, 0x2d7a2d);
  fence(-25, -25, -25, -4, 0.9, 0x2d7a2d); fence(-25, 4, -25, 25, 0.9, 0x2d7a2d); fence(25, -25, 25, -4, 0.9, 0x2d7a2d); fence(25, 4, 25, 25, 0.9, 0x2d7a2d);

  // ===== 川 =====
  // 橋（中央・木）
  solidR('wood', -4, 0.1, 44, 4, 0.4, 70, 0xc89a60, { tile: [2, 2] });
  fence(-4, 44, -4, 70, 1.1, 0xb06a30); fence(4, 44, 4, 70, 1.1, 0xb06a30);
  B.box('wood', 0, -0.6, 52, 7, 1.4, 0.6, 0x9a7040); B.box('wood', 0, -0.6, 62, 7, 1.4, 0.6, 0x9a7040);
  // 鉄橋（東）
  solidR('metal', 58, 0.1, 44, 64, 0.4, 70, 0xcc3333, { tile: [2, 2] });
  for (z = 44; z <= 70; z += 3.25) { B.box('metal', 58, 1.5, z, 0.15, 3, 0.15, 0xcc3333); B.box('metal', 64, 1.5, z, 0.15, 3, 0.15, 0xcc3333); }
  B.box('metal', 58, 3, 57, 0.15, 0.15, 26, 0xcc3333); B.box('metal', 64, 3, 57, 0.15, 0.15, 26, 0xcc3333);
  colAdd(57.8, 0, 44, 58, 3, 70); colAdd(64, 0, 44, 64.2, 3, 70);
  // 河川敷の柵と桜
  for (x = -160; x <= 160; x += 11) { if (Math.abs(x) < 8 || Math.abs(x - 61) < 6) continue; tree(x, 38.5, 1, x % 2 ? 'sakura' : 'round'); }
  for (x = -150; x <= 150; x += 14) { if (Math.abs(x) < 8 || Math.abs(x - 61) < 6) continue; lamp(x, 46.4, PI); }
  // 水
  var wg = new THREE.PlaneGeometry(340, RIVER.z3 - RIVER.z0 - 1.2, 40, 4); wg.rotateX(-PI / 2);
  var wc = []; for (i = 0; i < wg.attributes.position.count; i++) wc.push(1, 1, 1);
  wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3));
  WORLD.water = new THREE.Mesh(wg, MATS.water); WORLD.water.position.set(0, RIVER.water, (RIVER.z0 + RIVER.z3) / 2);
  TEX.water.repeat.set(40, 3); WORLD.water.renderOrder = 2; scene.add(WORLD.water);

  // ===== 空き地 =====
  fence(30, 74, 105, 74, 1.2, 0x8a8a8a); fence(30, 118, 105, 118, 1.2, 0x8a8a8a); fence(105, 74, 105, 118, 1.2, 0x8a8a8a);
  // 土管
  var pg = new THREE.CylinderGeometry(1, 1, 4, 16, 1, true);
  [[48, 1, 92], [50.1, 1, 92], [49.05, 2.75, 92]].forEach(function (p) { B.geo('concrete', pg, mtx(p[0], p[1], p[2], 0, 1, 1, 1, PI / 2), 0xe8e8e0); B.geo('plainS', GEO.cyl12, mtx(p[0], p[1], p[2], 0, 0.85, 4.02, 0.85, PI / 2), 0x333333); });
  colAdd(47, 0, 90, 51.1, 2, 94); colAdd(48.05, 2, 90, 50.05, 3.75, 94);
  solidR('woodS', 52, 0, 93, 53.2, 0.5, 94.2, 0xa07040); solidR('woodS', 51.1, 0, 92.4, 52.2, 1.0, 93.6, 0xa07040); solidR('woodS', 51.1, 1.0, 92.4, 51.7, 1.5, 93.6, 0xa07040); solidR('woodS', 50.25, 2.0, 90.4, 50.95, 2.8, 93.6, 0xc09060);
  // モノリス
  solidR('plainS', 74, 0, 84.5, 76, 6, 85, 0x0a0a0a);
  // 物置（ワープ）
  hollow({ x0: 86, x1: 90, z0: 104, z1: 108, h: 2.8, mat: 'metal', color: 0xb8c0c8, tile: [2, 2], floor: 'floor', doors: [{ s: 'n', c: 88, w: 1.4, h: 2.2 }], roofColor: 0x6688aa, name: '物置' });
  WORLD.teleports.push({ x0: 86.6, x1: 89.4, z0: 105.6, z1: 107.6, to: [0, 0.1, 410], face: PI, id: 'shed' });
  // 雑草
  for (i = 0; i < 60; i++) { x = rand(32, 103); z = rand(76, 116); B.geo('leaf', GEO.cone, mtx(x, 0.3, z, rand(0, 3), rand(0.2, 0.5), rand(0.4, 0.9), rand(0.2, 0.5)), pick([0x5a8a2a, 0x7aa03a, 0x4a7a20])); }

  // ===== 神社っぽい所 =====
  solidR('concreteS', -100, 0, -114, -60, 5, -80, 0xb8b0a0, { tile: [4, 4] });
  gnd('ground_sand', -100, -114, -60, -80, 5.02, 3);
  for (i = 1; i <= 14; i++) solidR('concreteS', -84, 0, -66 - i, -76, i * 5 / 14, -65 - i, 0xc8c0b0);
  // 鳥居
  function torii(cx, cz, y, s) {
    B.geo('plain', GEO.cyl8, mtx(cx - 2.6 * s, y + 2.4 * s, cz, 0, 0.25 * s, 4.8 * s, 0.25 * s), 0xe0301e); B.geo('plain', GEO.cyl8, mtx(cx + 2.6 * s, y + 2.4 * s, cz, 0, 0.25 * s, 4.8 * s, 0.25 * s), 0xe0301e);
    B.box('plain', cx, y + 4.9 * s, cz, 7.4 * s, 0.4 * s, 0.5 * s, 0x222222); B.box('plain', cx, y + 4.5 * s, cz, 6.8 * s, 0.3 * s, 0.4 * s, 0xe0301e); B.box('plain', cx, y + 3.7 * s, cz, 6 * s, 0.25 * s, 0.3 * s, 0xe0301e);
    colAdd(cx - 2.6 * s - 0.25, y, cz - 0.25, cx - 2.6 * s + 0.25, y + 4.8 * s, cz + 0.25); colAdd(cx + 2.6 * s - 0.25, y, cz - 0.25, cx + 2.6 * s + 0.25, y + 4.8 * s, cz + 0.25);
  }
  torii(-80, -63.5, 0, 1); torii(-80, -83, 5, 0.9);
  hollow({ x0: -88, x1: -72, y0: 5, z0: -106, z1: -95, h: 4, mat: 'wood', tile: [3, 3], floor: 'tatami', doors: [{ s: 's', c: -80, w: 4, h: 3 }], roofMat: 'roof', roofColor: 0xffffff, name: '本殿っぽい所' });
  var rg = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1); B.geo('roof', rg, mtx(-80, 11.2, -100.5, PI / 4, 13, 3.2, 9.5), 0xffffff, 4);
  solidR('woodS', -81.2, 5, -93.4, -78.8, 5.9, -92.4, 0x6a3a1a); // さい銭箱
  for (x = -98; x <= -62; x += 6) { tree(x, -112, 1.1, 'pine'); }
  for (z = -110; z <= -86; z += 6) { tree(-98, z, 1.0, 'pine'); tree(-62, z, 1.0, 'pine'); }
  solidR('concreteS', -85.5, 5, -89, -83.5, 6.0, -87, 0xaaaaaa); solidR('concreteS', -76.5, 5, -89, -74.5, 6.0, -87, 0xaaaaaa);
  // 石灯籠
  [[-86, -70], [-74, -70]].forEach(function (p) { solidR('concreteS', p[0] - 0.4, 0, p[1] - 0.4, p[0] + 0.4, 1.8, p[1] + 0.4, 0xb0aaa0); deco('glow', p[0] - 0.3, 1.3, p[1] - 0.3, p[0] + 0.3, 1.6, p[1] + 0.3, 0xffe9a0); });

  // ===== 町のあちこちの家 =====
  var r = mulberry(77);
  for (x = 72; x <= 140; x += 15) for (z = -112; z <= 20; z += 15) { if (r() < 0.15) continue; house(x + r() * 3, z + r() * 3, 9 + r() * 4, 9 + r() * 4, 5 + r() * 9, 0, [0xffffff, 0xffeedd, 0xddeeff, 0xffffdd, 0xeeddff][Math.floor(r() * 5)], [0x4060a0, 0xa04040, 0x40a060, 0x806040][Math.floor(r() * 4)]); }
  for (x = -150; x <= -110; x += 14) for (z = -100; z <= 30; z += 14) { if (r() < 0.2) continue; house(x + r() * 3, z, 9, 9, 5 + r() * 6, 0, 0xffeedd, 0x805040); }
  for (x = -140; x <= 20; x += 15) for (z = 80; z <= 120; z += 15) { if (r() < 0.2) continue; house(x + r() * 3, z + r() * 3, 9 + r() * 3, 9, 5 + r() * 5, 0, [0xffffff, 0xffe0e0, 0xe0ffe0][Math.floor(r() * 3)], [0x405080, 0x904040][Math.floor(r() * 2)]); }
  for (x = 110; x <= 150; x += 14) for (z = 80; z <= 120; z += 14) house(x, z, 9, 9, 6 + r() * 4, 0, 0xfff0e0, 0x406080);
  for (x = -150; x <= 150; x += 13) { if (x > -60 && x < 30) continue; tree(x, -120, 1.2, 'pine'); }

  // ===== 電柱と電線 =====
  for (x = -150; x <= 150; x += 20) { pole(x, -38.2); pole(x + 10, 38.0); }
  for (z = -140; z <= 30; z += 20) { if (z > -40 && z < -24) continue; pole(-38.2, z); pole(34.2, z); }
  // ===== 存在しない部屋 =====
  hollow({ x0: -12, x1: 12, z0: 396, z1: 424, h: 6, mat: 'plainS', color: 0xffffff, tile: [2, 2], floor: 'floor', inner: 'wallpaper', doors: [], roofColor: 0xffccff, name: '存在しない部屋' });
  deco('wallpaper', -11.68, 0, 396.3, -11.66, 5.7, 423.7, 0xffffff, { tile: [2, 2] }); deco('wallpaper', 11.66, 0, 396.3, 11.68, 5.7, 423.7, 0xffffff, { tile: [2, 2] });
  solidR('plainS', -1.2, 0, 423.5, 1.2, 2.4, 423.7, 0x3a2a1a); // 出口のドア（さわると帰る）

  WORLD.statics = B.build(scene, MATS);
  // 電線
  var wires = [];
  function wireLine(a, b) { var n = 8; for (var k = 0; k < n; k++) { var t0 = k / n, t1 = (k + 1) / n; var s0 = Math.sin(t0 * PI) * 0.8, s1 = Math.sin(t1 * PI) * 0.8; for (var o = -1; o <= 1; o += 2) wires.push(lerp(a[0], b[0], t0) + o * 0.7 * (Math.abs(a[1] - b[1]) > 1 ? 0 : 0), 8.4 - s0, lerp(a[1], b[1], t0) + o * 0.7 * (Math.abs(a[1] - b[1]) > 1 ? 1 : 0) * 0, lerp(a[0], b[0], t1), 8.4 - s1, lerp(a[1], b[1], t1)); } }
  for (i = 0; i < POLES.length; i++) for (j = i + 1; j < POLES.length; j++) { var dd = Math.hypot(POLES[i][0] - POLES[j][0], POLES[i][1] - POLES[j][1]); if (dd > 9 && dd < 21) wireLine(POLES[i], POLES[j]); }
  var wgeo = new THREE.BufferGeometry(); wgeo.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3));
  scene.add(new THREE.LineSegments(wgeo, new THREE.LineBasicMaterial({ color: 0x222222 })));
  // 街灯の光（夜に光る）
  var bg = new THREE.SphereGeometry(0.22, 8, 6), bulbs = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), WORLD.lamps.length);
  var dm = new THREE.Matrix4(); WORLD.lamps.forEach(function (p, k) { dm.makeTranslation(p.x, p.y, p.z); bulbs.setMatrixAt(k, dm); });
  scene.add(bulbs); WORLD.bulbs = bulbs;
  var glowTex = canvasTex(clipArt('flare', 128), false);
  WORLD.glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffd890, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  WORLD.glows = [];
  WORLD.lamps.forEach(function (p) { var s = new THREE.Sprite(WORLD.glowMat); s.position.copy(p); s.scale.set(3, 3, 3); scene.add(s); WORLD.glows.push(s); });
}

// ---- 看板の配置（フォント読み込み後） -------------------------------------------------
function clockFace() {
  var c = cvs(256), x = c.getContext('2d'); x.fillStyle = '#fffef0'; x.beginPath(); x.arc(128, 128, 124, 0, TAU); x.fill(); x.lineWidth = 10; x.strokeStyle = '#c02060'; x.stroke();
  for (var i = 1; i <= 13; i++) { var a = -PI / 2 + i / 13 * TAU; cnFillText(x, String(i), 128 + Math.cos(a) * 96, 140 + Math.sin(a) * 96, 26, 900, i === 13 ? '#e00' : '#123', 'center'); }
  return c;
}
function placeSigns(scene) {
  var g = new THREE.Group(); scene.add(g); WORLD.signsGroup = g;
  var cf = canvasTex(clockFace(), false), cm = new THREE.MeshLambertMaterial({ map: cf });
  [-52.86, -53.14].forEach(function (z, i) { var m = new THREE.Mesh(new THREE.CircleGeometry(0.86, 24), cm); m.position.set(0, 6.3, z); m.rotation.y = i ? PI : 0; g.add(m);
    var hm = new THREE.MeshBasicMaterial({ color: 0x111111 }); var h1 = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.55), hm); h1.position.set(0, 6.3, z + (i ? -0.01 : 0.01)); h1.rotation.y = i ? PI : 0; h1.geometry.translate(0, 0.25, 0); g.add(h1); WORLD.clockHands = (WORLD.clockHands || []).concat([h1]);
    var h2 = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.38), hm); h2.position.copy(h1.position); h2.rotation.y = h1.rotation.y; h2.geometry.translate(0, 0.17, 0); g.add(h2); WORLD.clockHands.push(h2); });
  function S(o) { var s = makeSign(o); g.add(s.mesh); return s; }
  S({ texts: ['よにん駅', 'よにん駅?', 'はちにん駅'], sub: ['ＹＯＮＩＮ　ＳＴＡＴＩＯＮ', 'ＹＯＮＩＮ　ＳＴＡＴＩＯＮ　这里', 'ＨＡＣＨＩＮＩＮ'], style: 1, kind: 'board', w: 14, h: 3, pos: [0, 7.2, -69.85] });
  S({ texts: ['きっぷうりば', 'きっぷうりぱ', 'きっぶうりば'], style: 4, kind: 'none', w: 5, h: 1.1, pos: [-14, 3.8, -69.8], shape: 'flat' });
  S({ texts: ['駅前ロータリー', '駅前ロータソー', '駅前ローターリーリー'], style: 0, kind: 'yellow', w: 4, h: 0.9, pos: [0, 1.25, -47.9], rot: 0, twoSided: true });
  S({ texts: ['バス停', 'バスてい', 'ハス停'], sub: '次のバス：来世', style: 8, kind: 'board', w: 3, h: 1.2, pos: [18, 3.3, -66.05], rot: 0, twoSided: true });
  S({ texts: ['ようこそ!!', 'ようこそ!!!', 'ようこそ??'], sub: '１番線　電车は来ません', style: 14, kind: 'neon', w: 8, h: 2, pos: [5, 3.2, -84.2], rot: 0, twoSided: true });
  S({ texts: ['よにん通り商店街', 'よにん通り商店街', 'よにんとおりしょうてんがい'], sub: ['ＷＥＬＣＯＭＥ　欢迎光临', 'ＷＥＬＣＯＭＥ　欢迎光临　欢迎', 'ＷＥＬＣＯＭＥ　ＷＥＬＣＯＭＥ'], style: 0, kind: 'board', w: 11, h: 2.6, pos: [50, 9.3, -30.5], rot: PI, twoSided: true });
  S({ texts: ['よにん通り商店街', 'よにん通り商店会', 'よ　に　ん'], sub: '出口　ＥＸＩＴ　出来ない', style: 10, kind: 'board', w: 11, h: 2.6, pos: [50, 9.3, 25.5], rot: 0, twoSided: true });
  S({ texts: ['コソビニ', 'コンビニ', 'ンコビニ'], sub: ['２４時間　営業中（夜は休み）', '２４時間　営業中（夜は休み）', '２５時間　営業中'], style: 7, kind: 'board', w: 8.2, h: 2, pos: [55.85, 5.4, (-30 + 4 * 55 / 8)], rot: -PI / 2 });
  S({ texts: ['喫茶ジャスミソ', '喫茶ジャヌミソ', '喫茶ジ ャ ス ミ ン'], sub: 'こーひー　有ります', style: 2, kind: 'wood', w: 8, h: 2, pos: [44.15, 5.4, (-30 + 6 * 55 / 8)], rot: PI / 2 });
  S({ texts: ['ブティック分け目', 'ブティック分け目', 'フティック分け日'], sub: '流行の最先端（２００２年）', style: 5, kind: 'board', w: 6.4, h: 1.8, pos: [44.15, 5.2, -30 + 55 / 16], rot: PI / 2 });
  var shopNames = [['八百屋　やおや', '八百屋　はっぴゃくや'], ['くすり', 'くすぃ'], ['魚屋　ぎょや', '魚屋　うおうお'], ['本屋', '木屋'], ['電器の店', '電器の店?'], ['とけい', 'とけいい'], ['ふとん', 'ぶとん'], ['肉の店', '内の店'], ['写真館', '写真舘'], ['おもちゃ', 'おもちや'], ['花屋', '化屋'], ['カラオケ', 'カラオヶ']];
  var k = 0, slot = 55 / 8;
  for (var side = 0; side < 2; side++) for (var i = 0; i < 8; i++) {
    if ((side === 0 && (i === 5 || i === 6 || i === 0)) || (side === 1 && (i === 3 || i === 4))) continue;
    var nm = shopNames[k % shopNames.length]; k++;
    S({ texts: [nm[0], nm[1], nm[1] + '!!'], style: (k * 3) % WA_STYLES.length, kind: pick(['board', 'yellow', 'wood', 'neon']), w: 5.6, h: 1.4, pos: [side ? 55.85 : 44.15, 5.3, -30 + (i + 0.5) * slot], rot: side ? -PI / 2 : PI / 2 });
  }
  S({ texts: ['ニューハイツ団地', 'ニューハイシ団地', 'ニュー　ニュー　ハイツ'], sub: '１号棟', style: 4, kind: 'board', w: 10, h: 2.2, pos: [-72.5, 13, -44.85] });
  S({ texts: ['２号棟', '２号棟', '２号凍'], style: 12, kind: 'none', w: 5, h: 1.6, pos: [-56, 13, -9.85] });
  S({ texts: ['３号棟', '３号棟', '３号棟棟'], style: 1, kind: 'none', w: 5, h: 1.6, pos: [-56, 13, 25.15] });
  S({ texts: ['はちにん記念公園', 'はちにん記念公園', 'はちにん記念公园'], sub: ['ＨＡＣＨＩＮＩＮ　ＰＡＲＫ', 'ＰＡＲＫ　公园', '８８８８８８８８'], style: 0, kind: 'board', w: 8, h: 2, pos: [0, 3.0, -25.6], rot: PI, twoSided: true });
  S({ texts: ['ぬるま川', 'ぬるま川', 'ぬるい川'], sub: '一級河川（自称）', style: 6, kind: 'wood', w: 6, h: 1.6, pos: [-8, 1.8, 46.6], rot: PI, twoSided: true });
  S({ texts: ['謎の空き地', '謎の空き地', '空き地の謎'], sub: '関係者以外　立入禁止（関係者もいません）', style: 9, kind: 'yellow', w: 8, h: 2, pos: [40, 2.2, 73.8], rot: PI, twoSided: true });
  S({ texts: ['神社っぽい所', '神社っぽい所', '神社っぽくない所'], style: 13, kind: 'wood', w: 3.4, h: 1.2, pos: [-80, 4.0, -63.3], rot: PI, twoSided: true });
  S({ texts: ['存在しない部屋', 'ここは　ない', 'ここは　ある'], style: 10, kind: 'none', w: 10, h: 2.4, pos: [0, 4.3, 396.35], rot: 0 });
  S({ texts: ['ＥＸＩＴ', 'ＥＸＩＴ?', 'ＥＸＩＴ!!'], sub: 'さわると帰れる', style: 12, kind: 'neon', w: 2.6, h: 1, pos: [0, 3.0, 423.45], rot: PI });
  // 注意書き
  var NP = [[-12, 1.4, -69.85, 0], [13, 1.4, -69.85, 0], [-27.5, 1.3, -60, PI / 2], [43.9, 1.5, 2, PI / 2], [56.1, 1.5, -20, -PI / 2], [-49.8, 1.5, -50, PI / 2], [-58, 1.5, -9.85, 0], [-62, 1.5, 25.15, 0],
    [-24.8, 1.4, 12, PI / 2], [24.8, 1.4, -12, -PI / 2], [10, 1.3, 46.6, PI], [-20, 1.3, 46.6, PI], [36, 1.4, 73.8, PI], [-69, 6.4, -79.6, PI], [-90, 1.4, -63.4, PI], [-3, 1.5, 395.0 + 1.35, 0], [5, 1.5, 396.35, 0]];
  NOTICES.forEach(function (n, k) { var p = NP[k % NP.length]; S({ texts: [n[1], n[1].replace(/の/g, 'の　'), n[1].split('').reverse().join('').slice(0, 30)], title: n[0], kind: 'notice', w: 1.4, h: 1.7, pos: p.slice(0, 3), rot: p[3], wrap: 11, twoSided: true }); });
}
