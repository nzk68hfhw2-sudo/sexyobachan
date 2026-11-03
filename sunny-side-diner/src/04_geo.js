// ---- materials + geometry helpers + static batching -------------------------
var M = {};
function stdMat(o) { var m = new THREE.MeshStandardMaterial(o); return m; }
function setT(m, set, tm) { if (set) { m.map = set.map; m.normalMap = set.normalMap; m.roughnessMap = set.roughnessMap; } m.userData.tm = tm || 1; return m; }
function buildMaterials() {
  var ns = function (v) { return new THREE.Vector2(v, v); };
  M.floor = setT(stdMat({ color: 0xffffff, roughness: 1, metalness: 0, normalScale: ns(0.6), envMapIntensity: 1.0 }), TEX.floor, 1.2);
  M.vinyl = setT(stdMat({ color: 0xffffff, roughness: 1, normalScale: ns(0.9), envMapIntensity: 0.9 }), TEX.vinylRed, 0.6);
  M.vinylP = setT(stdMat({ color: 0xffffff, roughness: 1, normalScale: ns(0.9), envMapIntensity: 0.9 }), TEX.vinylRedP, 0.6);
  M.vinylCream = setT(stdMat({ color: 0xffffff, roughness: 1, normalScale: ns(0.8), envMapIntensity: 0.8 }), TEX.vinylCream, 0.6);
  M.chrome = setT(stdMat({ color: 0xf2f4f6, roughness: 0.9, metalness: 1, normalScale: ns(0.3), envMapIntensity: 1.25 }), TEX.chrome, 0.5);
  M.chromeDull = setT(stdMat({ color: 0xc8ccd0, roughness: 1.6, metalness: 1, envMapIntensity: 1.0 }), TEX.chrome, 0.5);
  M.formica = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.8 }), TEX.formica, 1.0);
  M.formicaCream = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.8 }), TEX.formicaRed, 1.0);
  M.tiles = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.9, normalScale: ns(0.7) }), TEX.tiles, 0.6);
  M.tilesWhite = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.9, normalScale: ns(0.7) }), TEX.tilesWhite, 0.6);
  M.plaster = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.5, normalScale: new THREE.Vector2(0.5, 0.5) }), TEX.plaster, 2.0);
  M.plasterRed = setT(stdMat({ color: 0xc2282e, roughness: 1, envMapIntensity: 0.5 }), TEX.plaster, 2.0);
  M.steel = setT(stdMat({ color: 0xffffff, roughness: 1, metalness: 1, envMapIntensity: 1.0 }), TEX.steel, 1.0);
  M.steelG = setT(stdMat({ color: 0xb8b8b8, roughness: 1, metalness: 0.75, envMapIntensity: 0.7 }), TEX.steelG, 1.0);
  M.griddle = setT(stdMat({ color: 0xffffff, roughness: 0.9, metalness: 0.2, envMapIntensity: 0.7 }), TEX.griddle, 1.0);
  M.ceiling = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.4, normalScale: new THREE.Vector2(0.5, 0.5) }), TEX.ceiling, 0.6);
  M.asphalt = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 1.2 }), TEX.asphalt, 6);
  M.sand = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.2 }), TEX.sand, 8);
  M.quarry = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.8 }), TEX.quarry, 0.9);
  M.wood = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.7 }), TEX.wood, 1.0);
  M.woodLight = setT(stdMat({ color: 0xffffff, roughness: 1, envMapIntensity: 0.7 }), TEX.woodLight, 1.0);
  M.frost = setT(stdMat({ color: 0xffffff, roughness: 1, metalness: 0.3, envMapIntensity: 0.8 }), TEX.frost, 1.2);
  M.card = setT(stdMat({ color: 0xffffff, roughness: 1 }), TEX.card, 0.6);
  M.black = stdMat({ color: 0x0b0b0c, roughness: 0.5 });
  M.rubber = stdMat({ color: 0x141414, roughness: 0.85 });
  M.paintRed = stdMat({ color: 0xb3161d, roughness: 0.35, envMapIntensity: 1.0 });
  M.paintMint = stdMat({ color: 0x7cc7b3, roughness: 0.4, envMapIntensity: 1.0 });
  M.paintCream = stdMat({ color: 0xeadbb8, roughness: 0.5 });
  M.enamelWhite = stdMat({ color: 0xf1efe8, roughness: 0.25, envMapIntensity: 1.1 });
  M.ceramic = stdMat({ color: 0xf4f1ea, roughness: 0.18, envMapIntensity: 1.0 });
  M.ceramicRim = stdMat({ color: 0xb02026, roughness: 0.2 });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14, envMapIntensity: 1.6, depthWrite: false, reflectivity: 0.6 });
  M.glassDark = new THREE.MeshPhysicalMaterial({ color: 0x9fb0b8, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.3, envMapIntensity: 1.4, depthWrite: false });
  M.pinkPhone = stdMat({ color: 0xf08fb4, roughness: 0.3, envMapIntensity: 1.0 });
  M.bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.2, 2.4) });
  M.bulbOff = new THREE.MeshStandardMaterial({ color: 0x333028, roughness: 0.3 });
  M.fluor = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 4.6, 4.8) });
  M.coffee = stdMat({ color: 0x1a0d06, roughness: 0.05, envMapIntensity: 1.5 });
}
function neonMat(r, g, b) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: false }); }

// --- world-scaled UV box ------------------------------------------------------
function boxGeo(w, h, d, tm) {
  var g = new THREE.BoxGeometry(w, h, d); tm = tm || 1;
  var uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (var f = 0; f < 6; f++) for (var k = 0; k < 4; k++) { var i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tm, uv.getY(i) * dims[f][1] / tm); }
  return g;
}
function scaleUV(g, su, sv) { var uv = g.attributes.uv; for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * (sv == null ? su : sv)); return g; }
// rounded slab via extrude of rounded rect (x by z footprint, thickness h)
function roundSlab(w, d, h, rad, segs) {
  var s = new THREE.Shape(), x = -w / 2, y = -d / 2, r = Math.min(rad, w / 2, d / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  var g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: Math.min(0.012, h * 0.3), bevelSize: Math.min(0.012, r * 0.5), bevelSegments: 2, curveSegments: segs || 6 });
  g.rotateX(-PI / 2); g.translate(0, -h / 2, 0);
  return g;
}

// --- static batches: merge many meshes of one material into one draw ----------
var BATCH = {};
function batchAdd(geo, mat, x, y, z, ry, rx, rz, sx) {
  var key = mat.uuid; if (!BATCH[key]) BATCH[key] = { mat: mat, geos: [], cast: true, recv: true };
  var m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0, 'YXZ'));
  m.compose(new THREE.Vector3(x || 0, y || 0, z || 0), q, new THREE.Vector3(sx || 1, sx || 1, sx || 1));
  var g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m);
  BATCH[key].geos.push(g);
}
function B(w, h, d, mat, x, y, z, ry) { batchAdd(boxGeo(w, h, d, mat.userData.tm || 1), mat, x, y, z, ry); }
function mergeGeos(list) {
  var n = 0; list.forEach(function (g) { n += g.attributes.position.count; });
  var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), o = 0;
  list.forEach(function (g) {
    var c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, c * 2), o * 2);
    o += c;
  });
  var out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}
function flushBatches(parent) {
  for (var k in BATCH) {
    var b = BATCH[k]; if (!b.geos.length) continue;
    var mesh = new THREE.Mesh(mergeGeos(b.geos), b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv && [M.ceiling, M.plaster, M.plasterRed, M.tilesWhite].indexOf(b.mat) < 0; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    parent.add(mesh); b.geos.forEach(function (g) { g.dispose(); });
  }
  BATCH = {};
}
function mesh(geo, mat, x, y, z, parent, cast) {
  var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = cast !== false; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
function group(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
// soft blob shadow decal (contact shadow)
var BLOB_TEX = null;
function blobTex() {
  if (BLOB_TEX) return BLOB_TEX;
  var c = mkCanvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); BLOB_TEX = toTex(c, { clamp: true, linear: true }); return BLOB_TEX;
}
var BLOB_MAT = null;
function blob(parent, x, z, sx, sz, y, op) {
  if (!BLOB_MAT) BLOB_MAT = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 1, color: 0x000000, alphaMap: null });
  var m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), BLOB_MAT.clone()); m.material.opacity = op == null ? 0.85 : op;
  m.rotation.x = -PI / 2; m.position.set(x, (y || 0) + 0.004, z); m.renderOrder = 1; parent.add(m); return m;
}
