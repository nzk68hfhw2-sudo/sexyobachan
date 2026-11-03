// ---- world mesh builder ---------------------------------------------------
var WORLD = null; // { group, chunks:[{li, mesh...}], doors:[], chairs:InstancedMeshes, boards:[], tvs:[], ... }
var CHUNK = 26;

function Acc(li, mat) { this.li = li; this.mat = mat; this.p = []; this.n = []; this.uv = []; this.c = []; this.ov = []; this.idx = []; this.vc = 0; }
Acc.prototype.vert = function (x, y, z, nx, ny, nz, u, v, col, ov) {
  this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v);
  this.c.push(col ? col[0] : 1, col ? col[1] : 1, col ? col[2] : 1); this.ov.push(ov || null);
  return this.vc++;
};
Acc.prototype.quad = function (a, b, c, d) { this.idx.push(a, b, c, a, c, d); };

var _m4 = null, _m3 = null, _v3 = null;
var GEO = {};
function initGeoTemplates() {
  _m4 = new THREE.Matrix4(); _m3 = new THREE.Matrix3(); _v3 = new THREE.Vector3();
  function prep(g) { g = g.index ? g : g; return { p: g.attributes.position.array, n: g.attributes.normal.array, uv: g.attributes.uv.array, idx: g.index ? g.index.array : null, count: g.attributes.position.count }; }
  GEO.box = prep(new THREE.BoxGeometry(1, 1, 1));
  GEO.cyl = prep(new THREE.CylinderGeometry(1, 1, 1, 12, 1));
  GEO.cyl6 = prep(new THREE.CylinderGeometry(1, 1, 1, 6, 1));
  GEO.cone = prep(new THREE.ConeGeometry(1, 1, 8, 1));
  GEO.sph = prep(new THREE.SphereGeometry(1, 12, 8));
  GEO.plane = prep(new THREE.PlaneGeometry(1, 1));
}
// append template geometry transformed by (pos, rotY around prop) + local part transform
function appendGeo(acc, tpl, mtx, col, uvs, ov) {
  _m3.getNormalMatrix(mtx);
  var base = acc.vc, e = mtx.elements, ne = _m3.elements;
  for (var i = 0; i < tpl.count; i++) {
    var x = tpl.p[i * 3], y = tpl.p[i * 3 + 1], z = tpl.p[i * 3 + 2];
    var px = e[0] * x + e[4] * y + e[8] * z + e[12], py = e[1] * x + e[5] * y + e[9] * z + e[13], pz = e[2] * x + e[6] * y + e[10] * z + e[14];
    var nx = tpl.n[i * 3], ny = tpl.n[i * 3 + 1], nz = tpl.n[i * 3 + 2];
    var qx = ne[0] * nx + ne[3] * ny + ne[6] * nz, qy = ne[1] * nx + ne[4] * ny + ne[7] * nz, qz = ne[2] * nx + ne[5] * ny + ne[8] * nz;
    var l = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
    var u = tpl.uv[i * 2], v = tpl.uv[i * 2 + 1];
    if (uvs) { u = uvs[0] + u * uvs[2]; v = uvs[1] + v * uvs[3]; }
    acc.vert(px, py, pz, qx / l, qy / l, qz / l, u, v, col, ov);
  }
  if (tpl.idx) for (var k = 0; k < tpl.idx.length; k++) acc.idx.push(base + tpl.idx[k]);
  else for (var k2 = 0; k2 < tpl.count; k2++) acc.idx.push(base + k2);
}

// world builder context
function Builder() { this.accs = {}; }
Builder.prototype.acc = function (li, mat, x, z) {
  var ch = Math.floor((x - OX) / CHUNK), cz = Math.floor((z - OZ) / 22);
  var key = li + '|' + ch + '|' + cz + '|' + mat.uuid;
  var a = this.accs[key];
  if (!a) { a = this.accs[key] = new Acc(li, mat); a.ch = ch; a.cz = cz; }
  return a;
};
// part placement relative to a prop frame
function PF(b, li, x, y, z, rot) { this.b = b; this.li = li; this.x = x; this.y = y; this.z = z; this.rot = rot; this.c = Math.cos(rot); this.s = Math.sin(rot); }
var _pfQ = null, _pfE = null, _pfP = null, _pfS = null;
PF.prototype.m = function (lx, ly, lz, sx, sy, sz, rx, ry, rz) {
  if (!_pfQ) { _pfQ = new THREE.Quaternion(); _pfE = new THREE.Euler(); _pfP = new THREE.Vector3(); _pfS = new THREE.Vector3(); }
  _pfE.set(rx || 0, (ry || 0) + this.rot, rz || 0, 'YXZ'); _pfQ.setFromEuler(_pfE);
  var wx = this.x + this.c * lx + this.s * lz, wz = this.z - this.s * lx + this.c * lz;
  _pfP.set(wx, this.y + ly, wz); _pfS.set(sx, sy, sz);
  _m4.compose(_pfP, _pfQ, _pfS);
  return _m4;
};
PF.prototype.part = function (tpl, mat, lx, ly, lz, sx, sy, sz, col, o) {
  o = o || {};
  var m = this.m(lx, ly, lz, sx, sy, sz, o.rx, o.ry, o.rz);
  var acc = this.b.acc(this.li, mat, this.x, this.z);
  appendGeo(acc, tpl, m, col, o.uv, o.ov);
};
PF.prototype.box = function (mat, lx, ly, lz, sx, sy, sz, col, o) { this.part(GEO.box, mat, lx, ly + sy / 2, lz, sx, sy, sz, col, o); };
PF.prototype.cyl = function (mat, lx, ly, lz, r, h, col, o) { this.part(o && o.six ? GEO.cyl6 : GEO.cyl, mat, lx, ly + h / 2, lz, r, h, r, col, o); };
PF.prototype.sph = function (mat, lx, ly, lz, r, col, o) { this.part(GEO.sph, mat, lx, ly, lz, r, (o && o.sy) || r, r, col, o); };
PF.prototype.plane = function (mat, lx, ly, lz, w, h, col, o) { this.part(GEO.plane, mat, lx, ly, lz, w, h, 1, col, o); };

// ---------------------------------------------------------------------------
function C(hex) { return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]; }
var COL = {
  metal: C(0x8d9094), dark: C(0x2a2a2c), black: C(0x111112), wood: C(0xc49a6c), woodD: C(0x6e4a2e), white: C(0xe8e6df), red: C(0xb02020),
  chairBlue: C(0x2f5b8f), chairOr: C(0xc8662a), green: C(0x2f5a3a), cream: C(0xd8cfb4), steel: C(0xb7bcc0), yellow: C(0xe0a81c), rubber: C(0x1c1c1c)
};

function buildWorld(M) {
  initGeoTemplates();
  if (!MATS.floor) makeWorldMaterials();
  var B = new Builder();
  var specials = { boards: [], tvs: [], doors: [], banners: [], plates: [], hootsEyes: [], mirrors: [], screens: [] };
  buildShell(M, B);
  buildStairs(M, B);
  buildFixtures(M, B);
  M.props.forEach(function (p) { buildProp(M, B, p, specials); });
  buildBarricades(M, B);
  var posterMesh = buildPosters(M, B, specials);
  buildSigns(M, B, specials);
  // finalize: bake + meshes
  var group = new THREE.Group();
  var chunks = [];
  var bk = new Baker(M);
  for (var key in B.accs) {
    var a = B.accs[key];
    if (!a.idx.length) continue;
    var mesh = finalizeAcc(a, bk);
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    group.add(mesh); chunks.push({ li: a.li, ch: a.ch, cz: a.cz, mesh: mesh, outside: a.outside });
  }
  // dynamic: doors, chairs, boards, tvs
  var doors = buildDoors(M, bk, group);
  var chairs = buildChairs(M, bk, group);
  specials.boards.forEach(function (bd) { setProbeAt(bk, bd.mesh.material, bd.li, bd.x, bd.y, bd.z, 0, 0, 1); group.add(bd.mesh); });
  specials.tvs.forEach(function (t) { group.add(t.mesh); });
  specials.banners.forEach(function (bn) { setProbeAt(bk, bn.mesh.material, bn.li, bn.x, bn.y - 0.4, bn.z, 0, -1, 0); group.add(bn.mesh); });
  // sky & outside ground
  var sky = new THREE.Mesh(new THREE.SphereGeometry(160, 24, 12), new THREE.MeshBasicMaterial({ map: toTex(texNightSky(), { clamp: false }), side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.material.map.wrapT = THREE.ClampToEdgeWrapping; sky.position.y = -20; sky.renderOrder = -10; group.add(sky);
  var gplane = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), bakeMat({ map: TEX.grass, color: 0x6a7a60 }, 'probe'));
  gplane.material.map = TEX.grass.clone(); gplane.material.map.needsUpdate = true; gplane.material.map.repeat.set(160, 160);
  setProbe(gplane.material, [0.12, 0.14, 0.16], [0.05, 0.065, 0.1]);
  gplane.rotation.x = -PI / 2; gplane.position.y = -0.4; group.add(gplane);
  // glass panes (one transparent merged mesh per level)
  var gl = [[], [], []];
  WORLD_GLASS.forEach(function (gp) { gl[gp.li].push(gp); });
  var glassMeshes = [];
  gl.forEach(function (list, li) {
    if (!list.length) return;
    var pos = [], idx = [], nrm = [];
    list.forEach(function (gp) {
      var c = Math.cos(gp.rot), s = Math.sin(gp.rot), hw = gp.w / 2, hh = gp.h / 2, b = pos.length / 3;
      [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].forEach(function (q) { pos.push(gp.x + c * q[0], gp.y + q[1], gp.z - s * q[0]); nrm.push(s, 0, c); });
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    });
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
    var m = new THREE.Mesh(g, MATS.glass); m.renderOrder = 5; MATS.glass.side = THREE.DoubleSide;
    m.userData.li = li; group.add(m); glassMeshes.push(m);
  });
  WORLD = { group: group, chunks: chunks, glass: glassMeshes, doors: doors, chairs: chairs, specials: specials, baker: bk, sky: sky, ground: gplane, posterMesh: posterMesh };
  return WORLD;
}

function finalizeAcc(a, bk) {
  var n = a.vc;
  var pos = new Float32Array(a.p), nor = new Float32Array(a.n), uv = new Float32Array(a.uv);
  var col = new Uint8Array(n * 3), bon = new Uint8Array(n * 4), boff = new Uint8Array(n * 4);
  var res = [0, 0, 0, 0], res2 = [0, 0, 0, 0];
  for (var i = 0; i < n; i++) {
    col[i * 3] = clamp(a.c[i * 3] * 255, 0, 255); col[i * 3 + 1] = clamp(a.c[i * 3 + 1] * 255, 0, 255); col[i * 3 + 2] = clamp(a.c[i * 3 + 2] * 255, 0, 255);
    var ov = a.ov[i];
    if (ov) {
      bon[i * 4] = clamp(ov.on[0] * 127.5, 0, 255); bon[i * 4 + 1] = clamp(ov.on[1] * 127.5, 0, 255); bon[i * 4 + 2] = clamp(ov.on[2] * 127.5, 0, 255); bon[i * 4 + 3] = clamp((ov.g || 0) / 7 * 255, 0, 255);
      boff[i * 4] = clamp(ov.off[0] * 127.5, 0, 255); boff[i * 4 + 1] = clamp(ov.off[1] * 127.5, 0, 255); boff[i * 4 + 2] = clamp(ov.off[2] * 127.5, 0, 255); boff[i * 4 + 3] = ov.em ? 255 : 0;
      continue;
    }
    bk.on(a.li, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2], res);
    bk.off(a.li, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2], res2);
    bon[i * 4] = clamp(res[0] * 127.5, 0, 255); bon[i * 4 + 1] = clamp(res[1] * 127.5, 0, 255); bon[i * 4 + 2] = clamp(res[2] * 127.5, 0, 255); bon[i * 4 + 3] = clamp(res[3] / 7 * 255, 0, 255);
    boff[i * 4] = clamp(res2[0] * 127.5, 0, 255); boff[i * 4 + 1] = clamp(res2[1] * 127.5, 0, 255); boff[i * 4 + 2] = clamp(res2[2] * 127.5, 0, 255); boff[i * 4 + 3] = clamp(res2[3] * 255, 0, 255);
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
  g.setAttribute('bOn', new THREE.BufferAttribute(bon, 4, true));
  g.setAttribute('bOff', new THREE.BufferAttribute(boff, 4, true));
  g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(a.idx), 1) : new THREE.BufferAttribute(new Uint16Array(a.idx), 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  var mesh = new THREE.Mesh(g, a.mat);
  mesh.receiveShadow = true;
  return mesh;
}

// ---- light baking --------------------------------------------------------
function Baker(M) {
  this.M = M; this.bins = [{}, {}, {}]; this.dbins = [{}, {}, {}]; this.cache = new Map();
  var self = this;
  M.lights.forEach(function (l, i) { l.i = i; self.addBin(self.bins, l); });
  M.dlights.forEach(function (l, i) { l.i = 100000 + i; self.addBin(self.dbins, l); });
}
Baker.prototype.addBin = function (bins, l) {
  var r = Math.ceil(l.r / 4);
  var bx = Math.floor(l.x / 4), bz = Math.floor(l.z / 4);
  for (var i = -r; i <= r; i++) for (var j = -r; j <= r; j++) { var k = (bx + i) + ',' + (bz + j); (bins[l.li][k] || (bins[l.li][k] = [])).push(l); }
};
Baker.prototype.vis = function (l, li, x, z) {
  var cx = m2c(x), cz = m2r(z);
  var k2 = ((l.i * 3 + li) * NZ + cz) * NX + cx;
  var v = this.cache.get(k2);
  if (v === undefined) { v = losClearBake(li, l.x, l.z, x, z) ? 1 : 0; this.cache.set(k2, v); }
  return v;
};
function losClearBake(li, x0, z0, x1, z1) {
  var L = MAP.lv[li];
  var dx = x1 - x0, dz = z1 - z0, d = Math.sqrt(dx * dx + dz * dz);
  var steps = Math.ceil(d / (CELL * 0.4));
  var c0 = cidx(m2c(x0), m2r(z0));
  for (var s = 1; s < steps; s++) {
    var t = s / steps, cx = m2c(x0 + dx * t), cz = m2r(z0 + dz * t);
    if (!inGrid(cx, cz)) return false;
    var i = cidx(cx, cz);
    if (i === c0) continue;
    if (L.opaque[i] || L.blockTall[i] > 1 && L.type[i] === T_BLOCK) return false;
    if (L.type[i] === T_DOOR) { var dr = MAP.doors[L.door[i]]; if (dr.open < 0.5 && dr.kind !== 'glass') return false; }
  }
  return true;
}
Baker.prototype.on = function (li, px, py, pz, nx, ny, nz, out) {
  var sx = px + nx * 0.2, sy = py + ny * 0.2, sz = pz + nz * 0.2;
  var list = this.bins[li][Math.floor(sx / 4) + ',' + Math.floor(sz / 4)];
  var r = 0, g = 0, b = 0, best = 0, bg = 0;
  if (list) for (var k = 0; k < list.length; k++) {
    var l = list[k]; if (l.broken) continue;
    var dx = l.x - sx, dy = l.y - sy, dz = l.z - sz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > l.r) continue;
    if (!this.vis(l, li, sx, sz)) continue;
    var ix = dx / d, iy = dy / d, iz = dz / d;
    var ndl = nx * ix + ny * iy + nz * iz;
    var wrap = Math.max(0, (ndl + 0.3) / 1.3);
    var down = 0.45 + 0.55 * Math.max(0, iy); // fixtures face downward
    var q = 1 - (d / l.r) * (d / l.r);
    var att = q * q / (1 + d * d * 0.06) * l.int;
    var w = att * (wrap * down * 0.9 + 0.12);
    if (ny < -0.5) w = att * (0.42 + 0.3 * Math.max(0, ndl));
    r += l.col[0] * w; g += l.col[1] * w; b += l.col[2] * w;
    if (w > best) { best = w; bg = l.g; }
  }
  // indirect fill (only where some light reaches)
  var lum = (r + g + b) / 3;
  var amb = Math.min(0.12, lum * 0.25) + 0.012;
  out[0] = r * 0.95 + amb * 0.95; out[1] = g * 0.98 + amb; out[2] = b * 0.92 + amb * 0.9; out[3] = bg;
  if (li === 1) { var rm = roomAt(1, sx, sz); if (rm && rm.role === 'OUTSIDE') { out[0] += 0.05; out[1] += 0.065; out[2] += 0.1; } }
  return out;
};
Baker.prototype.off = function (li, px, py, pz, nx, ny, nz, out) {
  var sx = px + nx * 0.2, sy = py + ny * 0.2, sz = pz + nz * 0.2;
  var list = this.dbins[li][Math.floor(sx / 4) + ',' + Math.floor(sz / 4)];
  var r = 0, g = 0, b = 0, em = 0, tot = 0;
  if (list) for (var k = 0; k < list.length; k++) {
    var l = list[k];
    var dx = l.x - sx, dy = l.y - sy, dz = l.z - sz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > l.r) continue;
    if (!this.vis(l, li, sx, sz)) continue;
    var ix = dx / d, iy = dy / d, iz = dz / d;
    var ndl = nx * ix + ny * iy + nz * iz;
    var wrap = Math.max(0, (ndl + 0.25) / 1.25);
    var dirw = 1;
    if (l.nx || l.nz) { dirw = Math.max(0, -(ix * l.nx + iz * l.nz)); dirw = 0.08 + dirw * dirw * 1.3; if (iy > 0.2) dirw *= 0.9; }
    var q = 1 - (d / l.r) * (d / l.r);
    var att = q * q / (1 + d * d * 0.09) * l.int;
    var w = att * (wrap * 0.85 + 0.12) * dirw;
    r += l.col[0] * w; g += l.col[1] * w; b += l.col[2] * w; tot += w;
    if (l.kind === 'emerg') em += w;
  }
  var amb = [0.014, 0.017, 0.028];
  if (li === 1) { var rm = roomAt(1, sx, sz); if (rm && rm.role === 'OUTSIDE') { amb = [0.06, 0.075, 0.115]; } }
  if (li === 0) amb = [0.012, 0.01, 0.01];
  out[0] = r + amb[0]; out[1] = g + amb[1]; out[2] = b + amb[2]; out[3] = tot > 0 ? clamp(em / tot, 0, 1) : 0;
  return out;
};
Baker.prototype.probe = function (li, x, y, z) {
  var a = [0, 0, 0, 0], b = [0, 0, 0, 0], c = [0, 0, 0, 0], d = [0, 0, 0, 0];
  this.on(li, x, y, z, 0, 1, 0, a); this.on(li, x, y, z, 0, 0, 0, c);
  this.off(li, x, y, z, 0, 1, 0, b); this.off(li, x, y, z, 0, 0, 0, d);
  return { on: [(a[0] + c[0]) * 0.5, (a[1] + c[1]) * 0.5, (a[2] + c[2]) * 0.5], off: [(b[0] + d[0]) * 0.5, (b[1] + d[1]) * 0.5, (b[2] + d[2]) * 0.5] };
};
function setProbeAt(bk, mat, li, x, y, z, nx, ny, nz) {
  var a = [0, 0, 0, 0], b = [0, 0, 0, 0];
  bk.on(li, x, y, z, nx, ny, nz, a); bk.off(li, x, y, z, nx, ny, nz, b);
  setProbe(mat, a, b);
}

// ---- shell: floors, ceilings, walls, windows --------------------------------
function wallStyle(M, li, room, cx, cz) {
  var r = room >= 0 ? M.rooms[room] : null;
  var role = r ? r.role : 'CORRIDOR';
  var kind = ROLE_INFO[role] ? ROLE_INFO[role].kind : 'class';
  if (kind === 'corridor') return { low: li === 2 ? 'glazedU' : 'glazed', up: MATS.cmu, upCol: [0.86, 0.82, 0.7], lowH: 1.25 };
  if (kind === 'gym') return { low: null, up: MATS.brick, upCol: null, lowH: 0 };
  if (kind === 'lobby') return { low: null, up: MATS.brick, upCol: null, lowH: 0 };
  if (kind === 'restroom') return { low: null, up: MATS.tilewall, upCol: [0.86, 0.9, 0.86], lowH: 0 };
  if (kind === 'cafeteria') return { low: null, up: MATS.cmu, upCol: [0.92, 0.83, 0.55], lowH: 0 };
  if (kind === 'stairs') return { low: null, up: MATS.cmu, upCol: [0.7, 0.72, 0.72], lowH: 0 };
  if (kind === 'boiler' || kind === 'bstorage' || kind === 'bcorr') return { low: null, up: MATS.concreteWall, upCol: [0.75, 0.72, 0.66], lowH: 0 };
  if (kind === 'bus' || kind === 'outside') return { low: null, up: MATS.brick, upCol: null, lowH: 0 };
  var tints = [[0.74, 0.82, 0.72], [0.88, 0.84, 0.7], [0.72, 0.8, 0.88], [0.9, 0.78, 0.7]];
  return { low: null, up: MATS.cmu, upCol: tints[(r ? r.id : 0) % 4], lowH: 0 };
}
function buildShell(M, B) {
  if (!MATS.glazedU) { MATS.glazedU = bakeMat({ map: TEX.glazedG, vertexColors: true, shininess: 90, specular: new THREE.Color(0.4, 0.4, 0.4) }); }
  for (var li = 0; li < NL; li++) {
    var L = M.lv[li], Y = LV_Y[li], W = M.win[li];
    for (var cz = 0; cz < NZ; cz++) for (var cx = 0; cx < NX; cx++) {
      var i = cidx(cx, cz), t = L.type[i];
      var x0 = OX + cx * CELL, z0 = OZ + cz * CELL, x1 = x0 + CELL, z1 = z0 + CELL;
      var rid = L.room[i], room = rid >= 0 ? M.rooms[rid] : null;
      var isOut = room && room.role === 'OUTSIDE';
      if (t === T_FLOOR || t === T_DOOR || t === T_BLOCK) {
        // floor
        var fm = MATS.floor[L.mat[i]] || MATS.floor[M_LINO];
        var a = B.acc(li, fm, x0, z0); if (isOut) a.outside = true;
        var sc = (L.mat[i] === M_LINO || L.mat[i] === M_LINO2) ? 1.2 : (L.mat[i] === M_GYM ? 3.2 : (L.mat[i] === M_TILE ? 2 : 2.4));
        var v0 = a.vert(x0, Y, z0, 0, 1, 0, x0 / sc, -z0 / sc), v1 = a.vert(x0, Y, z1, 0, 1, 0, x0 / sc, -z1 / sc), v2 = a.vert(x1, Y, z1, 0, 1, 0, x1 / sc, -z1 / sc), v3 = a.vert(x1, Y, z0, 0, 1, 0, x1 / sc, -z0 / sc);
        a.quad(v0, v1, v2, v3);
        // ceiling
        var ch = t === T_DOOR ? 2.1 : L.ceil[i];
        if (!isOut && ch > 0 && !(room && room.role === 'BUS')) {
          var cm = (room && (room.role === 'GYM' || li === 0)) ? MATS.ceilingDark : ((room && (room.id * 7) % 5 === 0) ? MATS.ceiling2 : MATS.ceiling);
          var ac = B.acc(li, cm, x0, z0), yc = Y + ch;
          var c0 = ac.vert(x0, yc, z0, 0, -1, 0, x0 / 2.4, z0 / 2.4), c1 = ac.vert(x1, yc, z0, 0, -1, 0, x1 / 2.4, z0 / 2.4), c2 = ac.vert(x1, yc, z1, 0, -1, 0, x1 / 2.4, z1 / 2.4), c3 = ac.vert(x0, yc, z1, 0, -1, 0, x0 / 2.4, z1 / 2.4);
          ac.quad(c0, c1, c2, c3);
        }
        if (t === T_DOOR) buildDoorLintel(M, B, li, cx, cz);
      } else if (t === T_STAIR) {
        var s = M.stairs[L.stair[i]];
        if (li === s.hi) {
          var acs = B.acc(li, MATS.ceiling, x0, z0), yc2 = Y + 3.2;
          var d0 = acs.vert(x0, yc2, z0, 0, -1, 0, x0 / 1.2, z0 / 1.2), d1 = acs.vert(x1, yc2, z0, 0, -1, 0, x1 / 1.2, z0 / 1.2), d2 = acs.vert(x1, yc2, z1, 0, -1, 0, x1 / 1.2, z1 / 1.2), d3 = acs.vert(x0, yc2, z1, 0, -1, 0, x0 / 1.2, z1 / 1.2);
          acs.quad(d0, d1, d2, d3);
        }
      } else if (t === T_WALL) {
        buildWallCell(M, B, li, cx, cz, x0, z0, x1, z1);
      }
    }
  }
}
// returns [y0,y1] of the open neighbor for a wall face, or null
function faceSpan(M, li, ncx, ncz, fromCx, fromCz) {
  if (!inGrid(ncx, ncz)) return null;
  var L = M.lv[li], i = cidx(ncx, ncz), t = L.type[i], Y = LV_Y[li];
  if (t === T_FLOOR || t === T_BLOCK) {
    var r = L.room[i] >= 0 ? M.rooms[L.room[i]] : null;
    if (r && r.role === 'OUTSIDE') return 'out';
    if (r && r.role === 'BUS') return null;
    return [Y, Y + L.ceil[i]];
  }
  if (t === T_DOOR) return [Y, Y + 2.1];
  if (t === T_STAIR) { var s = M.stairs[L.stair[i]]; if (li === s.lo) return [Y, LV_Y[s.hi]]; return [Y, Y + 3.2]; }
  if (t === T_VOID && li === 2) { // exterior above ground-floor outside
    var g = M.lv[1], gi = cidx(ncx, ncz);
    if (g.type[gi] === T_FLOOR && g.room[gi] >= 0 && M.rooms[g.room[gi]].role === 'OUTSIDE') return 'out2';
  }
  return null;
}
function buildWallCell(M, B, li, cx, cz, x0, z0, x1, z1) {
  var L = M.lv[li], W = M.win[li];
  var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var isWin = W[cidx(cx, cz)];
  var wx = (x0 + x1) / 2;
  for (var k = 0; k < 4; k++) {
    var ncx = cx + nb[k][0], ncz = cz + nb[k][1];
    var sp = faceSpan(M, li, ncx, ncz, cx, cz);
    if (!sp) continue;
    var room = inGrid(ncx, ncz) ? L.room[cidx(ncx, ncz)] : -1;
    var st, y0, y1;
    if (sp === 'out' || sp === 'out2') {
      st = { up: MATS.brick, upCol: null, lowH: 0 };
      if (sp === 'out') { y0 = 0; y1 = 4.0; if (wx < 0) y1 = 4.8; if (wx > 60) y1 = 9.2; }
      else { y0 = 4.0; y1 = 8.4; }
      if (cx >= m2c(25) && cx <= m2c(36) && cz >= m2r(-12.5) && cz <= m2r(-9.5)) continue; // bus
    } else { st = wallStyle(M, li, room, ncx, ncz); y0 = sp[0]; y1 = sp[1]; }
    // face geometry: normal = neighbor direction
    var nx = nb[k][0], nz = nb[k][1];
    var fx0, fz0, fx1, fz1; // edge endpoints (counter-clockwise seen from neighbor)
    if (nx === 1) { fx0 = x1; fz0 = z1; fx1 = x1; fz1 = z0; }
    else if (nx === -1) { fx0 = x0; fz0 = z0; fx1 = x0; fz1 = z1; }
    else if (nz === 1) { fx0 = x0; fz0 = z1; fx1 = x1; fz1 = z1; }
    else { fx0 = x1; fz0 = z0; fx1 = x0; fz1 = z0; }
    var Y = LV_Y[li];
    var bands = [];
    var winBand = isWin && (sp !== 'out' || true);
    if (winBand && y1 - y0 > 2.6) {
      var wb = (sp === 'out2') ? 4 : Y;
      if (sp === 'out') wb = 0;
      bands.push([y0, wb + 0.9]); bands.push(['win', wb + 0.9, wb + 2.5]); bands.push([wb + 2.5, y1]);
    } else bands.push([y0, y1]);
    for (var bI = 0; bI < bands.length; bI++) {
      var bd = bands[bI];
      if (bd[0] === 'win') { buildWindow(M, B, li, fx0, fz0, fx1, fz1, nx, nz, bd[1], bd[2], sp); continue; }
      var ya = bd[0], yb = bd[1];
      // baseboard + wainscot split (interior only)
      var cuts = [ya];
      var fl = Y;
      if (st.lowH && ya < fl + st.lowH && yb > fl + st.lowH) cuts.push(fl + st.lowH);
      if (yb - ya > 1.6) { var mid = Math.max(cuts[cuts.length - 1], fl + 2.2); if (mid < yb - 0.3) cuts.push(mid); }
      cuts.push(yb);
      for (var ci = 0; ci < cuts.length - 1; ci++) {
        var ca = cuts[ci], cb = cuts[ci + 1];
        var useLow = st.lowH && cb <= fl + st.lowH + 1e-3;
        var mat = useLow ? MATS[st.low] : st.up;
        var col = useLow ? [1, 1, 1] : st.upCol;
        var sc = mat === MATS.brick ? 1.6 : (mat === MATS.cmu ? 1.6 : (useLow ? 1.2 : 2));
        var a = B.acc(li, mat, wx, (z0 + z1) / 2);
        var along0 = (nx !== 0) ? fz0 : fx0, along1 = (nx !== 0) ? fz1 : fx1;
        var p0 = a.vert(fx0, ca, fz0, nx, 0, nz, along0 / sc, ca / sc, col), p1 = a.vert(fx1, ca, fz1, nx, 0, nz, along1 / sc, ca / sc, col);
        var p2 = a.vert(fx1, cb, fz1, nx, 0, nz, along1 / sc, cb / sc, col), p3 = a.vert(fx0, cb, fz0, nx, 0, nz, along0 / sc, cb / sc, col);
        a.quad(p0, p1, p2, p3);
      }
      // baseboard strip (interior)
      if (sp !== 'out' && sp !== 'out2' && ya === Y && st.up !== MATS.brick) {
        var ab = B.acc(li, MATS.paint, wx, (z0 + z1) / 2);
        var off = 0.012;
        var q0 = ab.vert(fx0 + nx * off, Y, fz0 + nz * off, nx, 0, nz, 0, 0, COL.rubber), q1 = ab.vert(fx1 + nx * off, Y, fz1 + nz * off, nx, 0, nz, 1, 0, COL.rubber);
        var q2 = ab.vert(fx1 + nx * off, Y + 0.11, fz1 + nz * off, nx, 0, nz, 1, 1, COL.rubber), q3 = ab.vert(fx0 + nx * off, Y + 0.11, fz0 + nz * off, nx, 0, nz, 0, 1, COL.rubber);
        ab.quad(q0, q1, q2, q3);
      }
    }
  }
  if (isWin) buildJambs(M, B, li, cx, cz, x0, z0, x1, z1);
}
function buildJambs(M, B, li, cx, cz, x0, z0, x1, z1) {
  var L = M.lv[li], W = M.win[li], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var base = LV_Y[li];
  if (li === 1) { // check outside to know facade base
    var outs = false; for (var q = 0; q < 4; q++) { var s0 = faceSpan(M, li, cx + nb[q][0], cz + nb[q][1]); if (s0 && s0 !== 'out' && s0 !== 'out2') { base = s0[0]; outs = true; } }
  }
  for (var k = 0; k < 4; k++) {
    var ncx = cx + nb[k][0], ncz = cz + nb[k][1];
    if (!inGrid(ncx, ncz)) continue;
    var ni = cidx(ncx, ncz);
    if (L.type[ni] !== T_WALL || W[ni]) continue;
    var nx = -nb[k][0], nz = -nb[k][1]; // face points back into this (window) cell
    var fx0, fz0, fx1, fz1;
    if (nb[k][0] === 1) { fx0 = x1; fz0 = z0; fx1 = x1; fz1 = z1; } else if (nb[k][0] === -1) { fx0 = x0; fz0 = z1; fx1 = x0; fz1 = z0; } else if (nb[k][1] === 1) { fx0 = x1; fz0 = z1; fx1 = x0; fz1 = z1; } else { fx0 = x0; fz0 = z0; fx1 = x1; fz1 = z0; }
    var a = B.acc(li, MATS.cmu, x0, z0), ya = base + 0.9, yb = base + 2.5, col = [0.8, 0.78, 0.72];
    var p0 = a.vert(fx0, ya, fz0, nx, 0, nz, 0, 0, col), p1 = a.vert(fx1, ya, fz1, nx, 0, nz, 0.3, 0, col), p2 = a.vert(fx1, yb, fz1, nx, 0, nz, 0.3, 1, col), p3 = a.vert(fx0, yb, fz0, nx, 0, nz, 0, 1, col);
    a.quad(p0, p1, p2, p3);
  }
}
function buildWindow(M, B, li, fx0, fz0, fx1, fz1, nx, nz, ya, yb, sp) {
  // recessed opening: glass at wall center, frame + sill
  var cxm = (fx0 + fx1) / 2, czm = (fz0 + fz1) / 2;
  var depth = CELL / 2;
  var gx = cxm - nx * depth, gz = czm - nz * depth;
  var rot = Math.atan2(nx, nz);
  var pf = new PF(B, li, gx, 0, gz, rot);
  var wl = Math.abs(fx1 - fx0) + Math.abs(fz1 - fz0);
  // glass (separate transparent mesh list)
  var gk = li + ':' + Math.round(gx * 4) + ':' + Math.round(gz * 4);
  if (!WORLD_GLASS_KEYS[gk]) { WORLD_GLASS_KEYS[gk] = 1; WORLD_GLASS.push({ li: li, x: gx, y: (ya + yb) / 2, z: gz, rot: rot, w: wl, h: yb - ya }); }
  // sill & frame (aluminium)
  pf.box(MATS.metalP, 0, ya - 0.04, depth * 0.5, wl, 0.05, depth, [0.75, 0.75, 0.72]);
  pf.box(MATS.metalP, 0, yb - 0.02, depth * 0.5, wl, 0.04, depth, [0.6, 0.6, 0.6]);
  pf.box(MATS.metalP, 0, ya, 0.02, 0.05, yb - ya, 0.06, [0.55, 0.56, 0.55]);
  pf.box(MATS.metalP, 0, ya + (yb - ya) * 0.62, 0.02, wl, 0.04, 0.06, [0.55, 0.56, 0.55]);
  // reveal sides (jamb faces) are covered by neighbor wall cells
  // sill inside face & reveal top
  var st = sp === 'out' || sp === 'out2' ? MATS.brick : MATS.cmu;
  pf.box(st, 0, ya - 0.9 + 0.86, depth * 0.5, wl, 0.02, depth * 0.98, [0.8, 0.78, 0.7]);
}
var WORLD_GLASS = [], WORLD_GLASS_KEYS = {};
function buildDoorLintel(M, B, li, cx, cz) {
  var L = M.lv[li], d = M.doors[L.door[cidx(cx, cz)]];
  var x0 = OX + cx * CELL, z0 = OZ + cz * CELL, x1 = x0 + CELL, z1 = z0 + CELL, Y = LV_Y[li];
  var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (var k = 0; k < 4; k++) {
    var ncx = cx + nb[k][0], ncz = cz + nb[k][1];
    if (!inGrid(ncx, ncz)) continue;
    var t = L.type[cidx(ncx, ncz)];
    if (t === T_WALL || t === T_DOOR || t === T_VOID) continue;
    var sp = faceSpan(M, li, ncx, ncz, cx, cz);
    var y1 = (sp && sp !== 'out' && sp !== 'out2') ? sp[1] : Y + 3.2;
    if (sp === 'out') y1 = 4.0;
    if (y1 <= Y + 2.1) continue;
    var nx = nb[k][0], nz = nb[k][1], fx0, fz0, fx1, fz1;
    if (nx === 1) { fx0 = x1; fz0 = z1; fx1 = x1; fz1 = z0; } else if (nx === -1) { fx0 = x0; fz0 = z0; fx1 = x0; fz1 = z1; } else if (nz === 1) { fx0 = x0; fz0 = z1; fx1 = x1; fz1 = z1; } else { fx0 = x1; fz0 = z0; fx1 = x0; fz1 = z0; }
    var room = L.room[cidx(ncx, ncz)];
    var st = (sp === 'out' || sp === 'out2') ? { up: MATS.brick, upCol: null } : wallStyle(M, li, room, ncx, ncz);
    var a = B.acc(li, st.up, x0, z0);
    var al0 = nx !== 0 ? fz0 : fx0, al1 = nx !== 0 ? fz1 : fx1, ya = Y + 2.1;
    var p0 = a.vert(fx0, ya, fz0, nx, 0, nz, al0 / 1.6, ya / 1.6, st.upCol), p1 = a.vert(fx1, ya, fz1, nx, 0, nz, al1 / 1.6, ya / 1.6, st.upCol);
    var p2 = a.vert(fx1, y1, fz1, nx, 0, nz, al1 / 1.6, y1 / 1.6, st.upCol), p3 = a.vert(fx0, y1, fz0, nx, 0, nz, al0 / 1.6, y1 / 1.6, st.upCol);
    a.quad(p0, p1, p2, p3);
  }
}

function buildStairs(M, B) {
  M.stairs.forEach(function (s) {
    var li = s.lo;
    var n = 20, run = (s.z1 - s.z0) / n, rise = (s.yB - s.yA) / n;
    var w = s.x1 - s.x0, cx = (s.x0 + s.x1) / 2;
    var pf = new PF(B, li, cx, 0, 0, 0);
    for (var k = 0; k < n; k++) {
      var zA = s.z0 + k * run;
      var yTop = Math.max(s.yA + rise * k, s.yA + rise * (k + 1));
      var yBot = Math.min(s.yA, s.yB) - 0.02;
      pf.box(MATS.floor[M_CONCRETE], 0, yBot, zA + run / 2, w, yTop - yBot, run, [0.72, 0.7, 0.66]);
      pf.box(MATS.paint, 0, yTop - 0.005, zA + (rise > 0 ? run - 0.04 : 0.04), w, 0.012, 0.06, [0.85, 0.7, 0.15]); // nosing
    }
    // handrail
    var dz = s.z1 - s.z0, dy = s.yB - s.yA, len = Math.sqrt(dz * dz + dy * dy), ang = Math.atan2(dy, dz);
    var hr = new PF(B, li, s.x1 - 0.06, 0, (s.z0 + s.z1) / 2, 0);
    hr.part(GEO.box, MATS.metalP, 0, (s.yA + s.yB) / 2 + 0.95, 0, 0.05, 0.05, len, [0.5, 0.52, 0.55], { rx: -ang });
    for (var p = 0; p <= 4; p++) { var zz = s.z0 + dz * p / 4, yy = s.yA + dy * p / 4; hr.box(MATS.metalP, 0, yy, zz - (s.z0 + s.z1) / 2, 0.03, 0.95, 0.03, [0.5, 0.52, 0.55]); }
  });
}

// ---- light fixtures ---------------------------------------------------------
function buildFixtures(M, B) {
  M.lights.forEach(function (l) {
    if (l.kind === 'none') return;
    var pf = new PF(B, l.li, l.x, l.y, l.z, l.rot || 0);
    var lens = { on: [l.col[0] * 1.9, l.col[1] * 1.9, l.col[2] * 1.85], off: [0.05, 0.055, 0.06], g: l.g };
    if (l.broken) lens.on = [0.08, 0.08, 0.08];
    if (l.kind === 'tube') {
      pf.box(MATS.metalP, 0, -0.06, 0, 0.62, 0.06, 1.22, [0.85, 0.85, 0.82]);
      pf.box(MATS.emit, 0, -0.075, 0, 0.54, 0.02, 1.14, [1, 1, 1], { ov: lens });
    } else if (l.kind === 'highbay') {
      pf.cyl(MATS.metalP, 0, -0.5, 0, 0.35, 0.3, [0.4, 0.42, 0.44]);
      pf.cyl(MATS.emit, 0, -0.52, 0, 0.3, 0.03, [1, 1, 1], { ov: lens });
      pf.box(MATS.metalP, 0, -0.2, 0, 0.02, 0.3, 0.02, COL.dark);
    } else if (l.kind === 'bulb') {
      pf.sph(MATS.emit, 0, -0.18, 0, 0.06, [1, 1, 1], { ov: { on: [2, 1.6, 1.1], off: [0.03, 0.03, 0.03], g: l.g } });
      pf.box(MATS.paint, 0, -0.12, 0, 0.01, 0.12, 0.01, COL.black);
    }
  });
}

// ---- barricades -------------------------------------------------------------
function buildBarricades(M, B) {
  var rnd = makeRNG(M.seed ^ 0xbeef);
  M.blockers.forEach(function (b) {
    var li = b.li, Y = LV_Y[li];
    var w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    var n = Math.round(w * d * 3) + 3;
    for (var k = 0; k < n; k++) {
      var px = cx + rnd.range(-w / 2, w / 2) * 0.8, pz = cz + rnd.range(-d / 2, d / 2) * 0.85;
      var pf = new PF(B, li, px, Y, pz, rnd() * TAU);
      var t = rnd();
      if (t < 0.35) { pf.part(GEO.box, MATS.lockers, 0, 0.3 + rnd() * 0.6, 0, 0.48, 1.8, 0.45, [0.3, 0.38, 0.55], { rx: PI / 2 * (0.6 + rnd() * 0.4), rz: rnd() * 0.6, uv: [0.25, 0, 0.25, 1] }); }
      else if (t < 0.7) { pf.part(GEO.box, MATS.wood, 0, 0.5 + rnd() * 1.0, 0, 0.6, 0.04, 0.45, COL.wood, { rx: rnd() * 2, rz: rnd() * 2 }); pf.part(GEO.box, MATS.metalP, 0.2, 0.4 + rnd(), 0, 0.03, 0.7, 0.03, COL.metal, { rz: rnd() * 3 }); }
      else { pf.part(GEO.box, MATS.paint, 0, 0.3 + rnd() * 1.2, 0, 0.42, 0.04, 0.42, rnd() < 0.5 ? COL.chairBlue : COL.chairOr, { rx: rnd() * 3, rz: rnd() * 3 }); }
    }
    // caution tape
    var tp = new PF(B, li, cx, Y, cz, 0);
    if (b.full) {
      tp.box(MATS.emit, -w / 2 - 0.08, 1.05, 0, 0.01, 0.05, d, [1, 1, 1], { ov: { on: [1.1, 0.9, 0.1], off: [0.05, 0.045, 0.005] } });
      tp.box(MATS.emit, w / 2 + 0.08, 1.05, 0, 0.01, 0.05, d, [1, 1, 1], { ov: { on: [1.1, 0.9, 0.1], off: [0.05, 0.045, 0.005] } });
    }
  });
}
