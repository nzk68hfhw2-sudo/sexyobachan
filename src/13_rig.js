// ---- rig builder: rigid parts skinned to bones -> one SkinnedMesh ---------------
function Rig() { this.bones = []; this.byName = {}; this.parts = []; }
Rig.prototype.bone = function (name, parent, x, y, z) {
  var b = new THREE.Bone(); b.name = name; b.position.set(x, y, z);
  if (parent) this.byName[parent].add(b);
  b.userData.idx = this.bones.length; this.bones.push(b); this.byName[name] = b;
  return b;
};
// add a template part to a bone, local transform relative to bone
Rig.prototype.part = function (bone, tpl, lx, ly, lz, sx, sy, sz, col, rx, ry, rz) {
  this.parts.push({ bone: bone, tpl: tpl, m: [lx, ly, lz, sx, sy, sz, rx || 0, ry || 0, rz || 0], col: col });
};
// tapered limb from bone origin downward (length l, radii r0 at top, r1 at bottom)
Rig.prototype.limb = function (bone, l, r0, r1, col, dir) {
  var g = new THREE.CylinderGeometry(r0, r1, l, 8, 2);
  g.translate(0, (dir || -1) * l / 2, 0);
  this.parts.push({ bone: bone, geo: g, col: col });
};
Rig.prototype.build = function (mat) {
  var root = this.bones[0];
  root.updateMatrixWorld(true);
  var pos = [], nor = [], uv = [], col = [], si = [], sw = [], idx = [];
  var m4 = new THREE.Matrix4(), m3 = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3();
  var self = this;
  this.parts.forEach(function (p) {
    var b = self.byName[p.bone];
    var g = p.geo;
    var local = new THREE.Matrix4();
    if (!g) {
      g = p.tpl.clone ? p.tpl : null;
      var mm = p.m;
      local.compose(new THREE.Vector3(mm[0], mm[1], mm[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(mm[6], mm[7], mm[8])), new THREE.Vector3(mm[3], mm[4], mm[5]));
      g = p.tpl;
    }
    m4.multiplyMatrices(b.matrixWorld, local);
    m3.getNormalMatrix(m4);
    var P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    var base = pos.length / 3;
    for (var i = 0; i < P.count; i++) {
      v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(m4);
      n.set(N.getX(i), N.getY(i), N.getZ(i)).applyMatrix3(m3).normalize();
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); uv.push(U ? U.getX(i) : 0, U ? U.getY(i) : 0);
      col.push(p.col[0], p.col[1], p.col[2]);
      si.push(b.userData.idx, 0, 0, 0); sw.push(1, 0, 0, 0);
    }
    if (g.index) { var I = g.index.array; for (var k = 0; k < I.length; k++) idx.push(base + I[k]); }
    else for (var k2 = 0; k2 < P.count; k2++) idx.push(base + k2);
  });
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  geo.setIndex(idx);
  var mesh = new THREE.SkinnedMesh(geo, mat);
  mesh.add(root);
  mesh.bind(new THREE.Skeleton(this.bones));
  mesh.frustumCulled = false; mesh.castShadow = true;
  this.mesh = mesh;
  this.rest = this.bones.map(function (b) { return b.rotation.clone(); });
  return mesh;
};
var GT = null; // shared template geometries for rigs
function rigTemplates() {
  if (GT) return GT;
  GT = { box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 12, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), cone: new THREE.ConeGeometry(1, 1, 8) };
  return GT;
}
// standard humanoid skeleton. p: proportions
function humanoidRig(p) {
  var R = new Rig(); var T = rigTemplates();
  var H = p.height || 1.7, s = H / 1.7;
  var hipY = 0.92 * s * (p.legLen || 1);
  R.bone('hips', null, 0, hipY, 0);
  R.bone('spine', 'hips', 0, 0.12 * s, 0);
  R.bone('chest', 'spine', 0, 0.24 * s, 0);
  R.bone('neck', 'chest', 0, 0.22 * s, 0);
  R.bone('head', 'neck', 0, 0.09 * s * (p.neckLen || 1), 0);
  var sw = 0.19 * s * (p.shoulder || 1);
  ['L', 'R'].forEach(function (sd, k) {
    var x = k === 0 ? sw : -sw;
    R.bone('sh' + sd, 'chest', x, 0.16 * s, 0);
    R.bone('ua' + sd, 'sh' + sd, 0, 0, 0);
    R.bone('fa' + sd, 'ua' + sd, 0, -0.28 * s * (p.armLen || 1), 0);
    R.bone('hand' + sd, 'fa' + sd, 0, -0.25 * s * (p.armLen || 1), 0);
    R.bone('th' + sd, 'hips', k === 0 ? 0.1 * s : -0.1 * s, -0.04 * s, 0);
    R.bone('sn' + sd, 'th' + sd, 0, -0.43 * s * (p.legLen || 1), 0);
    R.bone('ft' + sd, 'sn' + sd, 0, -0.43 * s * (p.legLen || 1), 0);
  });
  R.s = s; R.p = p;
  return R;
}
// dress a humanoid with simple clothing. c: colors {skin, shirt, pants, shoes, hair}
function dressHumanoid(R, c, o) {
  var T = rigTemplates(), s = R.s, p = R.p; o = o || {};
  var thin = p.thin || 1, al = p.armLen || 1, ll = p.legLen || 1;
  // torso
  R.part('hips', T.sph, 0, 0.0, 0, 0.17 * s * thin, 0.13 * s, 0.11 * s, c.pants);
  R.part('spine', T.sph, 0, 0.12 * s, 0, 0.15 * s * thin, 0.17 * s, 0.1 * s, c.shirt);
  R.part('chest', T.sph, 0, 0.07 * s, 0, 0.2 * s * thin * (p.shoulder || 1), 0.17 * s, 0.115 * s * (p.chestD || 1), c.shirt);
  ['L', 'R'].forEach(function (sd) { R.part('sh' + sd, T.sph, 0, 0, 0, 0.065 * s * thin, 0.06 * s, 0.06 * s, o.bareArms ? c.skin : c.shirt); });
  if (p.belly) R.part('spine', T.sph, 0, 0.1 * s, 0.06 * s, 0.17 * s, 0.16 * s, 0.14 * s, c.shirt);
  R.part('neck', T.cyl, 0, 0.06 * s, 0, 0.045 * s * thin, 0.16 * s * (p.neckLen || 1), 0.045 * s * thin, c.skin);
  if (o.skirt) R.part('hips', T.cone, 0, -0.12 * s, 0, 0.24 * s, 0.38 * s, 0.2 * s, c.pants, PI);
  if (o.gown) R.part('hips', T.cone, 0, -0.35 * s, 0, 0.28 * s * thin, 1.0 * s, 0.22 * s, c.shirt, PI);
  ['L', 'R'].forEach(function (sd) {
    R.limb('ua' + sd, 0.28 * s * al, 0.055 * s * thin, 0.045 * s * thin, o.shortSleeve ? c.skin : c.shirt);
    if (o.shortSleeve) R.part('ua' + sd, T.cyl, 0, -0.06 * s, 0, 0.06 * s * thin, 0.12 * s, 0.06 * s * thin, c.shirt);
    R.limb('fa' + sd, 0.25 * s * al, 0.045 * s * thin, 0.035 * s * thin, o.longSleeve === false ? c.skin : (o.bareArms ? c.skin : c.shirt));
    if (o.claws) { for (var f = 0; f < 4; f++) R.part('hand' + sd, T.box, (f - 1.5) * 0.018 * s, -0.09 * s, 0, 0.008 * s, 0.16 * s, 0.01 * s, c.skin, 0, 0, (f - 1.5) * 0.06); R.part('hand' + sd, T.box, 0, -0.03 * s, 0, 0.07 * s, 0.07 * s, 0.03 * s, c.skin); }
    else R.part('hand' + sd, T.box, 0, -0.05 * s, 0, 0.07 * s, 0.1 * s, 0.03 * s, o.gloves ? c.gloves : c.skin);
    var legCol = o.bareLegs ? c.skin : c.pants;
    R.limb('th' + sd, 0.43 * s * ll, 0.075 * s * thin, 0.055 * s * thin, o.skirt ? c.skin : legCol);
    R.limb('sn' + sd, 0.43 * s * ll, 0.055 * s * thin, 0.04 * s * thin, o.skirt || o.bareLegs ? c.skin : legCol);
    if (o.barefoot) R.part('ft' + sd, T.box, 0, -0.02 * s, 0.05 * s, 0.07 * s, 0.04 * s, 0.2 * s, c.skin);
    else R.part('ft' + sd, T.box, 0, -0.03 * s, 0.05 * s, 0.09 * s, 0.07 * s, 0.25 * s, c.shoes);
  });
}

// ---- simple procedural humans (NPC students) ------------------------------------
var NPC_NAMES = [
  ['Dale', 'm', 62], ['Rosa', 'f', 58], ['Tyrell', 'm', 19], ['Mrs. Kowalski', 'f', 74], ['Jun', 'm', 33], ['Amara', 'f', 27], ['Earl', 'm', 68], ['Lupe', 'f', 45],
  ['Vince', 'm', 22], ['Priya', 'f', 31], ['Otis', 'm', 51], ['Hannah', 'f', 24], ['Mateo', 'm', 38], ['Gloria', 'f', 66], ['Kenji', 'm', 47], ['Shay', 'f', 20],
  ['Walt', 'm', 79], ['Nadia', 'f', 36], ['Bo', 'm', 29], ['Ruthie', 'f', 55], ['Marcus', 'm', 41], ['Ingrid', 'f', 60], ['Ray', 'm', 18], ['Fatima', 'f', 34]
];
var SKIN_TONES = [[0.96, 0.8, 0.68], [0.88, 0.68, 0.52], [0.72, 0.52, 0.36], [0.52, 0.36, 0.24], [0.36, 0.24, 0.16], [0.92, 0.76, 0.6]];
var HAIR_COLS = [[0.08, 0.06, 0.05], [0.3, 0.18, 0.1], [0.55, 0.4, 0.22], [0.8, 0.65, 0.4], [0.12, 0.1, 0.1], [0.6, 0.15, 0.08]];
function makeLook(rnd, nameEntry) {
  var age = nameEntry[2], female = nameEntry[1] === 'f';
  var look = {
    skin: rnd.pick(SKIN_TONES), hair: age > 58 ? [0.78, 0.78, 0.76] : rnd.pick(HAIR_COLS),
    shirt: [rnd.range(0.15, 0.85), rnd.range(0.15, 0.7), rnd.range(0.15, 0.7)], pants: rnd.pick([[0.18, 0.22, 0.35], [0.25, 0.22, 0.2], [0.4, 0.38, 0.34], [0.12, 0.12, 0.14]]),
    hairStyle: age > 58 && !female ? 3 : (female ? rnd.pick([1, 1, 0, 2]) : rnd.pick([0, 0, 2, 3])), glasses: rnd() < (age > 45 ? 0.5 : 0.2),
    height: (female ? 1.6 : 1.74) + rnd.range(-0.08, 0.08) - (age > 70 ? 0.06 : 0), belly: !female && rnd() < 0.35 && age > 30, female: female, age: age, hat: !female && rnd() < 0.2
  };
  return look;
}
function faceCanvas(look, mood) {
  var c = mkCanvas(128, 128), g = c.getContext('2d');
  g.fillStyle = rgbs(look.skin); g.fillRect(0, 0, 128, 128);
  var dk = [look.skin[0] * 0.7, look.skin[1] * 0.62, look.skin[2] * 0.6];
  // brows / eyes / mouth (front is u=0.5)
  g.fillStyle = rgbs(look.hair); g.fillRect(44, 48, 14, 3); g.fillRect(70, 48, 14, 3);
  g.fillStyle = '#f4f2ea'; g.fillRect(46, 55, 11, 7); g.fillRect(71, 55, 11, 7);
  g.fillStyle = '#2a1a10'; g.fillRect(50, 55, 5, 7); g.fillRect(74, 55, 5, 7);
  g.fillStyle = rgbs(dk); g.fillRect(61, 62, 6, 14);
  g.fillStyle = mood === 'scared' ? '#3a1010' : 'rgb(140,70,60)'; if (mood === 'scared') g.fillRect(56, 84, 16, 9); else g.fillRect(55, 86, 18, 3);
  if (look.age > 50) { g.strokeStyle = rgbs(dk); g.lineWidth = 1; g.beginPath(); g.moveTo(42, 66); g.lineTo(46, 70); g.moveTo(86, 66); g.lineTo(82, 70); g.moveTo(52, 84); g.lineTo(50, 90); g.moveTo(76, 84); g.lineTo(78, 90); g.stroke(); }
  if (look.glasses) { g.strokeStyle = '#222'; g.lineWidth = 2; g.strokeRect(43, 52, 17, 13); g.strokeRect(68, 52, 17, 13); g.beginPath(); g.moveTo(60, 57); g.lineTo(68, 57); g.stroke(); }
  // hair region on top/back
  g.fillStyle = rgbs(look.hair);
  if (look.hairStyle !== 3) g.fillRect(0, 0, 128, look.hairStyle === 2 ? 30 : 40);
  else g.fillRect(0, 0, 128, 18);
  g.fillRect(0, 0, 30, 128); g.fillRect(98, 0, 30, 128);
  return c;
}
function buildHumanNPC(look, seed) {
  var R = humanoidRig({ height: look.height, thin: look.female ? 0.9 : 1.0, shoulder: look.female ? 0.88 : 1.0, belly: look.belly });
  var c = { skin: look.skin, shirt: look.shirt, pants: look.pants, shoes: [0.12, 0.1, 0.09] };
  dressHumanoid(R, c, { skirt: look.female && seed % 3 === 0 });
  var T = rigTemplates(), s = R.s;
  // hair volume
  if (look.hairStyle === 1) { R.part('head', T.sph, 0, 0.06 * s, -0.035 * s, 0.112 * s, 0.17 * s, 0.1 * s, look.hair); }
  if (look.hairStyle === 0 || look.hairStyle === 2) R.part('head', T.sph, 0, 0.16 * s, -0.01 * s, 0.103 * s, 0.07 * s, 0.11 * s, look.hair);
  if (look.hat) R.part('head', T.cyl, 0, 0.21 * s, 0, 0.13 * s, 0.06 * s, 0.13 * s, [0.2, 0.25, 0.5]);
  var mat = bakeMat({ vertexColors: true, shininess: 12, specular: new THREE.Color(0.08, 0.08, 0.08), skinning: true }, 'probe');
  var body = R.build(mat);
  // head with painted face
  var ft = toTex(faceCanvas(look, 'calm'), { clamp: false });
  var hm = bakeMat({ map: ft, shininess: 20, specular: new THREE.Color(0.1, 0.1, 0.1) }, 'probe');
  var hg = new THREE.SphereGeometry(0.115 * s, 16, 12); hg.scale(0.85, 1.05, 0.95); hg.rotateY(-PI / 2);
  var head = new THREE.Mesh(hg, hm); head.position.y = 0.12 * s; head.castShadow = true;
  R.byName.head.add(head);
  var root = new THREE.Group(); root.add(body);
  return { root: root, rig: R, mats: [mat, hm], faceTex: ft, look: look, head: head };
}

// ---- face head for monsters (projected face image + relief + jaw) ------------
var FACE_TEX = []; // preloaded face textures, index 1..40
function makeFaceHead(def, radius) {
  var R0 = radius || 0.13;
  var g = new THREE.SphereGeometry(1, 48, 36);
  var P = g.attributes.position, n = P.count;
  var uvA = new Float32Array(n * 2), jaw = new Float32Array(n);
  var cx = def.cx, cy = def.cy, rx = def.rx, ry = def.ry;
  function toHead(u, vImg) { return [(u - cx) * 0.74 / rx, (cy - vImg) * 0.86 / ry]; }
  var lm = { eyes: def.eyes.map(function (e) { return toHead(e[0], e[1]); }), nose: toHead(def.nose[0], def.nose[1]), mouth: toHead(def.mouth[0], def.mouth[1]) };
  function gs(x, y, px, py, sx, sy) { var dx = (x - px) / sx, dy = (y - py) / (sy || sx); return Math.exp(-(dx * dx + dy * dy)); }
  var v = new THREE.Vector3();
  for (var i = 0; i < n; i++) {
    v.set(P.getX(i), P.getY(i), P.getZ(i));
    var X = v.x, Y = v.y, Z = v.z;
    var u = cx + X * rx / 0.74, vi = cy - Y * ry / 0.86;
    uvA[i * 2] = u; uvA[i * 2 + 1] = 1 - vi;
    var front = smooth((Z - 0.05) / 0.5);
    var d = 0;
    d += gs(X, Y, lm.nose[0], lm.nose[1] - 0.05, 0.13, 0.2) * 0.2 * (def.noseAmt != null ? def.noseAmt : 1);
    lm.eyes.forEach(function (e) { d -= gs(X, Y, e[0], e[1], 0.16, 0.12) * 0.1; d += gs(X, Y, e[0], e[1] + 0.17, 0.2, 0.07) * 0.05; d += gs(X, Y, e[0] * 1.25, e[1] - 0.2, 0.14, 0.1) * 0.04; });
    var mw = def.mouthW || 0.25, mh = def.mouthH || 0.12;
    d -= gs(X, Y, lm.mouth[0], lm.mouth[1], mw, mh) * (def.mouthDepth || 0.12);
    d += gs(X, Y, lm.mouth[0], lm.mouth[1] - 0.28, 0.2, 0.1) * 0.04;
    var k = 1 + d * front;
    // head shape: flattened face, longer back, narrow jaw
    var sx = 0.86 - (Y < -0.3 ? (-Y - 0.3) * 0.25 : 0), sy = 1.12, sz = Z > 0 ? 0.92 : 1.02;
    P.setXYZ(i, X * k * sx * R0, Y * k * sy * R0, Z * (Z > 0 ? (1 + d * front * 0.6) : 1) * sz * R0);
    var jw = smooth((lm.mouth[1] + 0.05 - Y) / 0.25) * smooth((Z + 0.2) / 0.5) * (1 - smooth((Math.abs(X) - 0.45) / 0.3));
    jaw[i] = jw;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uvA, 2));
  g.setAttribute('aJaw', new THREE.BufferAttribute(jaw, 1));
  g.computeVertexNormals();
  var U = { uJaw: { value: 0 }, uFC: { value: new THREE.Vector2(cx, cy) }, uFR: { value: new THREE.Vector2(rx * 1.05, ry * 1.0) }, uEdge: { value: new THREE.Color(def.edge[0], def.edge[1], def.edge[2]) }, uGlow: { value: def.glow || 0.35 }, uR: { value: R0 }, uTwitch: { value: 0 } };
  var mat = bakeMat({ map: FACE_TEX[def.img], shininess: 40, specular: new THREE.Color(0.25, 0.22, 0.22) }, 'probe', {
    key: 'face',
    uniforms: U,
    vdecl: 'attribute float aJaw; uniform float uJaw; uniform float uR; uniform float uTwitch; varying float vFront;\n',
    vbody: 'transformed.y -= uJaw * aJaw * uR * 0.95; transformed.z -= uJaw * aJaw * uR * 0.18; transformed.x *= 1.0 + uJaw * aJaw * 0.12;\n transformed.x += uTwitch * sin(position.y * 80.0 + uTime * 60.0) * uR * 0.03;\n vFront = smoothstep(-0.1, 0.55, normalize(position).z);\n',
    fdecl: 'uniform vec2 uFC; uniform vec2 uFR; uniform vec3 uEdge; uniform float uGlow; uniform float uJaw; varying float vFront;\n',
    fmap: 'vec4 fcol = mapTexelToLinear(texture2D(map, vUv));\n vec2 dd = (vec2(vUv.x, 1.0 - vUv.y) - uFC) / uFR; float fd = length(dd);\n float fm = (1.0 - smoothstep(0.6, 1.0, fd)) * vFront;\n vec3 edgeC = uEdge * (0.75 + 0.5 * fract(sin(dot(floor(vUv * 60.0), vec2(12.9898, 78.233))) * 43758.5453) * 0.4);\n diffuseColor.rgb *= mix(edgeC, fcol.rgb, fm);\n float flum = dot(fcol.rgb, vec3(0.3, 0.59, 0.11));\n',
    fbody: 'reflectedLight.indirectDiffuse += diffuseColor.rgb * uGlow * smoothstep(0.35, 0.9, flum) * fm;\n'
  });
  var mesh = new THREE.Mesh(g, mat); mesh.castShadow = true;
  mesh.userData.U = U;
  return mesh;
}
// hanging hair strips
var HAIR_TEX = null;
function makeHair(R0, opt) {
  if (!HAIR_TEX) { HAIR_TEX = toTex(texHair(59, [10, 9, 9]), { clamp: true }); }
  opt = opt || {};
  var rnd = makeRNG(opt.seed || 5), N = opt.count || 140, seg = 7;
  var pos = [], uv = [], sway = [], idx = [];
  for (var s = 0; s < N; s++) {
    // root on scalp
    var th, ph, front = s < (opt.fringe || 0);
    if (front) { th = rnd.range(-0.9, 0.9); ph = rnd.range(0.2, 0.55); }
    else { th = rnd.range(0, TAU); ph = rnd.range(0.05, 1.25); if (Math.cos(th) > 0.55 && ph > 0.55) ph = rnd.range(0.05, 0.4); }
    // direction: th around Y (0 = front +z), ph from top
    var dx = Math.sin(ph) * Math.sin(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.cos(th);
    var rx = dx * R0 * 1.03, ry = dy * R0 * 1.08, rz = dz * R0 * 0.98;
    var L = (opt.len || 0.6) * rnd.range(0.6, 1.1) * (front ? (opt.fringeLen || 0.7) : 1);
    var w = rnd.range(0.025, 0.055);
    var tx = Math.cos(th), tz = -Math.sin(th); // tangent around head
    var base = pos.length / 3, phase = rnd() * TAU;
    for (var k = 0; k <= seg; k++) {
      var t = k / seg;
      var out = R0 * (0.15 + t * 0.15) * (front ? 0.6 : 1);
      var px = rx + dx * out * t * 2, pz = rz + dz * out * t * 2 + (front ? 0.02 * t : 0), py = ry - L * t * t * 0.4 - L * t * 0.6 + (dy > 0.6 ? R0 * 0.2 * t * (1 - t) : 0);
      if (front) { pz = rz + 0.015 + t * 0.03; px = rx + (rnd() - 0.5) * 0.01; }
      var ww = w * (1 - t * 0.5);
      pos.push(px - tx * ww, py, pz - tz * ww, px + tx * ww, py, pz + tz * ww);
      uv.push(0, 1 - t, 1, 1 - t);
      sway.push(phase, t, phase, t);
      if (k < seg) { var a = base + k * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    }
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 2)); g.setIndex(idx); g.computeVertexNormals();
  var U = { uWind: { value: 0.3 } };
  var mat = bakeMat({ map: HAIR_TEX, color: new THREE.Color(opt.col || 0x0b0a0a), alphaTest: 0.35, side: THREE.DoubleSide, shininess: 50, specular: new THREE.Color(0.15, 0.15, 0.17), transparent: false }, 'probe', {
    key: 'hair', uniforms: U,
    vdecl: 'attribute vec2 aSway; uniform float uWind;\n',
    vbody: 'float sw = aSway.y * aSway.y; transformed.x += sin(uTime * 1.7 + aSway.x) * sw * 0.03 * (1.0 + uWind * 3.0); transformed.z += cos(uTime * 1.3 + aSway.x * 1.7) * sw * 0.02 * (1.0 + uWind * 3.0);\n'
  });
  var m = new THREE.Mesh(g, mat); m.userData.U = U; m.castShadow = true;
  return m;
}
