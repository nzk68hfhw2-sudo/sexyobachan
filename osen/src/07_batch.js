// ---- まとめ描画（ドローコール削減）と当たり判定 -------------------------------------
var U = { uDef: { value: 0 }, uTime: { value: 0 }, uWob: { value: 0 } };
var _col = null;
function linColor(hex) { if (!_col) _col = new THREE.Color(); _col.set(hex); _col.convertSRGBToLinear(); return _col; }

function Batch() { this.g = {}; }
Batch.prototype.get = function (key) { return this.g[key] || (this.g[key] = { p: [], n: [], u: [], c: [], i: [] }); };
// box: center (cx,cy,cz) size (sx,sy,sz). opts: tile=[tu,tv] meters per texture repeat, rot=Y rotation, faces skip string e.g. 'ny'
Batch.prototype.box = function (key, cx, cy, cz, sx, sy, sz, color, opts) {
  opts = opts || {};
  var G = this.get(key), tu = opts.tile ? opts.tile[0] : 2, tv = opts.tile ? opts.tile[1] : 2, rot = opts.rot || 0;
  var cs = Math.cos(rot), sn = Math.sin(rot), col = linColor(color == null ? 0xffffff : color), hx = sx / 2, hy = sy / 2, hz = sz / 2;
  var skip = opts.skip || '';
  var F = [ // normal, u axis, v axis, size u, size v, offset
    ['px', [1, 0, 0], [0, 0, -1], [0, 1, 0], sz, sy, hx], ['nx', [-1, 0, 0], [0, 0, 1], [0, 1, 0], sz, sy, hx],
    ['py', [0, 1, 0], [1, 0, 0], [0, 0, -1], sx, sz, hy], ['ny', [0, -1, 0], [1, 0, 0], [0, 0, 1], sx, sz, hy],
    ['pz', [0, 0, 1], [1, 0, 0], [0, 1, 0], sx, sy, hz], ['nz', [0, 0, -1], [-1, 0, 0], [0, 1, 0], sx, sy, hz]];
  for (var f = 0; f < 6; f++) {
    var fd = F[f]; if (skip.indexOf(fd[0]) >= 0) continue;
    var N = fd[1], A = fd[2], B = fd[3], su = fd[4], sv = fd[5], off = fd[6];
    var base = G.p.length / 3;
    for (var k = 0; k < 4; k++) {
      var a = (k === 1 || k === 2) ? 0.5 : -0.5, b = k >= 2 ? 0.5 : -0.5;
      var lx = N[0] * off + A[0] * a * su + B[0] * b * sv, ly = N[1] * off + A[1] * a * su + B[1] * b * sv, lz = N[2] * off + A[2] * a * su + B[2] * b * sv;
      G.p.push(cx + lx * cs + lz * sn, cy + ly, cz - lx * sn + lz * cs);
      G.n.push(N[0] * cs + N[2] * sn, N[1], -N[0] * sn + N[2] * cs);
      var uu = (a + 0.5) * su / tu, vv = (b + 0.5) * sv / tv;
      if (opts.uvOff) { uu += opts.uvOff[0]; vv += opts.uvOff[1]; }
      if (fd[0] === 'py' || fd[0] === 'ny') { uu = (cx + lx) / tu; vv = (cz + lz) / tv; if (opts.uvLocal) { uu = (a + 0.5) * su / tu; vv = (b + 0.5) * sv / tv; } }
      else if (opts.worldY) vv = (cy + ly) / tv;
      G.u.push(uu, vv); G.c.push(col.r, col.g, col.b);
    }
    G.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
};
// 任意の THREE.BufferGeometry を行列つきで追加
var _m4, _n3, _v3;
Batch.prototype.geo = function (key, geo, mat4, color, uvScale) {
  if (!_m4) { _m4 = new THREE.Matrix4(); _n3 = new THREE.Matrix3(); _v3 = new THREE.Vector3(); }
  var G = this.get(key), base = G.p.length / 3, col = linColor(color == null ? 0xffffff : color);
  var P = geo.attributes.position, Nn = geo.attributes.normal, UV = geo.attributes.uv;
  _n3.getNormalMatrix(mat4);
  for (var i = 0; i < P.count; i++) {
    _v3.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(mat4); G.p.push(_v3.x, _v3.y, _v3.z);
    _v3.set(Nn.getX(i), Nn.getY(i), Nn.getZ(i)).applyMatrix3(_n3).normalize(); G.n.push(_v3.x, _v3.y, _v3.z);
    G.u.push(UV ? UV.getX(i) * (uvScale || 1) : 0, UV ? UV.getY(i) * (uvScale || 1) : 0); G.c.push(col.r, col.g, col.b);
  }
  if (geo.index) { for (i = 0; i < geo.index.count; i++) G.i.push(base + geo.index.getX(i)); }
  else for (i = 0; i < P.count; i++) G.i.push(base + i);
};
Batch.prototype.build = function (scene, mats, opts) {
  var out = [];
  for (var key in this.g) {
    var G = this.g[key]; if (!G.i.length) continue;
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(G.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(G.c, 3));
    g.setIndex(G.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(G.i, 1) : new THREE.Uint16BufferAttribute(G.i, 1));
    g.computeBoundingSphere();
    var m = new THREE.Mesh(g, mats[key] || mats.plain);
    m.castShadow = !(opts && opts.noShadow) && key !== 'water' && key !== 'glass' && key.indexOf('ground') !== 0;
    m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
    m.name = 'batch_' + key;
    scene.add(m); out.push(m);
  }
  this.g = {};
  return out;
};

// ---- 当たり判定（軸平行の箱） -------------------------------------------------------
var COL = { boxes: [], grid: {}, cell: 8 };
function colAdd(x0, y0, z0, x1, y1, z1, tag) {
  var b = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), tag: tag || '' };
  COL.boxes.push(b);
  var c = COL.cell;
  for (var gx = Math.floor(b.x0 / c); gx <= Math.floor(b.x1 / c); gx++)
    for (var gz = Math.floor(b.z0 / c); gz <= Math.floor(b.z1 / c); gz++) {
      var k = gx + ',' + gz; (COL.grid[k] || (COL.grid[k] = [])).push(b);
    }
  return b;
}
function colQuery(x, z, r) {
  var c = COL.cell, out = [], seen = colQuery._seen || (colQuery._seen = []);
  colQuery._stamp = (colQuery._stamp || 0) + 1; var st = colQuery._stamp;
  for (var gx = Math.floor((x - r) / c); gx <= Math.floor((x + r) / c); gx++)
    for (var gz = Math.floor((z - r) / c); gz <= Math.floor((z + r) / c); gz++) {
      var L = COL.grid[gx + ',' + gz]; if (!L) continue;
      for (var i = 0; i < L.length; i++) { var b = L[i]; if (b._st !== st) { b._st = st; out.push(b); } }
    }
  return out;
}
// 見た目と当たり判定を同時に作る
var B; // world batch
function solid(key, cx, cy, cz, sx, sy, sz, color, opts) {
  B.box(key, cx, cy, cz, sx, sy, sz, color, opts);
  colAdd(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2, opts && opts.tag);
}
// x0..x1, y0..y1, z0..z1 で指定
function solidR(key, x0, y0, z0, x1, y1, z1, color, opts) { solid(key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color, opts); }
function deco(key, x0, y0, z0, x1, y1, z1, color, opts) { B.box(key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color, opts); }

// ---- 地形（川だけ低い） -------------------------------------------------------------
var RIVER = { z0: 47, z1: 51, z2: 63, z3: 67, bed: -1.5, water: -0.55 };
function terrainY(x, z) {
  if (z <= RIVER.z0 || z >= RIVER.z3 || z > 200) return 0;
  if (z < RIVER.z1) return RIVER.bed * (z - RIVER.z0) / (RIVER.z1 - RIVER.z0);
  if (z > RIVER.z2) return RIVER.bed * (RIVER.z3 - z) / (RIVER.z3 - RIVER.z2);
  return RIVER.bed;
}

// ---- マテリアル ----------------------------------------------------------------------
var MATS = {};
function deformable(mat) {
  mat.onBeforeCompile = function (sh) {
    sh.uniforms.uDef = U.uDef; sh.uniforms.uTime = U.uTime; sh.uniforms.uWob = U.uWob;
    sh.vertexShader = 'uniform float uDef;\nuniform float uTime;\nuniform float uWob;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
      'vec3 transformed = vec3( position );',
      'float hh = max(0.0, position.y - 1.2);',
      'float nn = sin(position.x*0.071 + position.z*0.053 + 1.3)*0.5+0.5;',
      'transformed.y = position.y + hh * uDef * (0.25 + 0.9*nn) * (0.85 + 0.15*sin(uTime*0.7 + position.x*0.13));',
      'transformed.x += uDef * hh*hh*0.010 * sin(position.z*0.05 + uTime*0.31 + nn*3.0);',
      'transformed.z += uDef * hh*hh*0.008 * cos(position.x*0.05 + uTime*0.27);',
      'transformed.x += uWob * sin(position.y*0.8 + uTime*2.0) * 0.25;'
    ].join('\n'));
  };
  mat.customProgramCacheKey = function () { return 'deform'; };
  return mat;
}
function buildMaterials(lite) {
  var L = function (o) { o.vertexColors = true; return new THREE.MeshLambertMaterial(o); };
  MATS.plain = deformable(L({}));
  MATS.plainS = L({}); // 変形しない
  MATS.asphalt = L({ map: TEX.asphalt });
  MATS.ground_grass = L({ map: TEX.grass });
  MATS.ground_asphalt = L({ map: TEX.asphalt });
  MATS.ground_tiles = L({ map: TEX.tiles });
  MATS.ground_side = L({ map: TEX.sidewalk });
  MATS.ground_dirt = L({ map: TEX.dirt });
  MATS.ground_sand = L({ map: TEX.sand });
  MATS.ground_conc = L({ map: TEX.concrete });
  MATS.ground_rails = L({ map: TEX.rails });
  MATS.concrete = deformable(L({ map: TEX.concrete }));
  MATS.concreteS = L({ map: TEX.concrete });
  MATS.brick = deformable(L({ map: TEX.brick }));
  MATS.wood = deformable(L({ map: TEX.wood }));
  MATS.woodS = L({ map: TEX.wood });
  MATS.roof = deformable(L({ map: TEX.roof }));
  MATS.metal = deformable(new THREE.MeshPhongMaterial({ map: TEX.metal, vertexColors: true, shininess: 60, specular: 0x888888 }));
  MATS.shutter = deformable(L({ map: TEX.shutter }));
  MATS.floor = L({ map: TEX.floor });
  MATS.tatami = L({ map: TEX.tatami });
  MATS.wallpaper = L({ map: TEX.wallpaper });
  MATS.danchi = deformable(L({ map: TEX.danchi.map, emissiveMap: TEX.danchi.emi, emissive: 0x000000 }));
  MATS.danchiS = L({ map: TEX.danchi.map, emissiveMap: TEX.danchi.emi, emissive: 0x000000 });
  MATS.shop = deformable(L({ map: TEX.shop.map, emissiveMap: TEX.shop.emi, emissive: 0x000000 }));
  MATS.station = deformable(L({ map: TEX.station.map, emissiveMap: TEX.station.emi, emissive: 0x000000 }));
  MATS.house = deformable(L({ map: TEX.house.map, emissiveMap: TEX.house.emi, emissive: 0x000000 }));
  MATS.glass = new THREE.MeshPhongMaterial({ color: 0xaaddff, transparent: true, opacity: 0.32, shininess: 100, specular: 0xffffff, vertexColors: true, depthWrite: false });
  MATS.glow = new THREE.MeshBasicMaterial({ vertexColors: true });
  MATS.leaf = deformable(L({}));
  MATS.water = new THREE.MeshPhongMaterial({ map: TEX.water, transparent: true, opacity: 0.82, shininess: 120, specular: 0xffffff, vertexColors: true, depthWrite: false });
  MATS.arcade = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
}
