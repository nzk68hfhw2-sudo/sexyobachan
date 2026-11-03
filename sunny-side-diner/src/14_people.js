// ---- people: procedural customers (seated/walking), face textures, horror shell -----
var SKIN = [[241, 205, 178], [228, 184, 150], [205, 152, 112], [176, 120, 84], [130, 86, 58], [96, 62, 42], [236, 196, 170]];
var HAIRC = ['#1b1410', '#3a2618', '#6b4426', '#a8763e', '#d9b46a', '#8c8c8c', '#d8d4cc', '#5a1e12', '#2a1a10'];
function rgbs(a, m) { m = m || 1; return 'rgb(' + Math.round(clamp(a[0] * m, 0, 255)) + ',' + Math.round(clamp(a[1] * m, 0, 255)) + ',' + Math.round(clamp(a[2] * m, 0, 255)) + ')'; }
// face texture: equirect 512x256, face centered at u=0.25 (front of a three.js sphere)
function faceCanvas(o) {
  var c = mkCanvas(512, 256), g = c.getContext('2d'), sk = o.skin, rnd = makeRNG(o.seed || 1);
  g.fillStyle = rgbs(sk); g.fillRect(0, 0, 512, 256);
  // subtle skin variation + pores
  for (var i = 0; i < 600; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '120,60,40' : '255,230,210') + ',' + rnd() * 0.05 + ')'; g.beginPath(); g.arc(rnd() * 512, rnd() * 256, 2 + rnd() * 8, 0, TAU); g.fill(); }
  var cx = 128, ey = 128;
  if (o.faceless) { // smooth, featureless — only faint hollows
    smudge(g, cx - 22, ey, 16, 'rgba(90,50,40,A)', 0.12); smudge(g, cx + 22, ey, 16, 'rgba(90,50,40,A)', 0.12); smudge(g, cx, ey + 46, 18, 'rgba(90,50,40,A)', 0.08);
    return c;
  }
  // cheeks / lips color
  smudge(g, cx - 34, ey + 30, 18, 'rgba(220,90,90,A)', 0.18 * (o.blush || 1)); smudge(g, cx + 34, ey + 30, 18, 'rgba(220,90,90,A)', 0.18 * (o.blush || 1));
  // eye sockets shading
  smudge(g, cx - 21, ey, 15, 'rgba(80,40,30,A)', 0.22); smudge(g, cx + 21, ey, 15, 'rgba(80,40,30,A)', 0.22);
  // nose shadow & highlight
  g.fillStyle = 'rgba(90,45,30,0.10)'; g.beginPath(); g.ellipse(cx + 3, ey + 16, 4, 10, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(80,35,25,0.35)'; g.beginPath(); g.ellipse(cx - 6, ey + 27, 3.2, 2, 0, 0, TAU); g.ellipse(cx + 6, ey + 27, 3.2, 2, 0, 0, TAU); g.fill();
  // brows
  g.strokeStyle = o.browC || '#3a2618'; g.lineWidth = o.thickBrow ? 5 : 3.4; g.lineCap = 'round';
  [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(cx + s * 9, ey - 14 + (o.browTilt || 0) * s); g.quadraticCurveTo(cx + s * 21, ey - 20, cx + s * 32, ey - 13); g.stroke(); });
  // eye area: darker socket + lid crease + lashes (eyeballs are real meshes)
  [-1, 1].forEach(function (s) {
    var ex = cx + s * 21;
    g.fillStyle = 'rgba(70,35,28,0.55)'; g.beginPath(); g.ellipse(ex, ey, 10.5, 6.5, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,20,15,0.8)'; g.lineWidth = o.lashes ? 2.6 : 1.6; g.beginPath(); g.ellipse(ex, ey, 10, 6, 0, PI * 1.05, PI * 1.95); g.stroke();
    g.strokeStyle = 'rgba(90,45,35,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(ex, ey - 2, 11, 8.5, 0, PI * 1.1, PI * 1.9); g.stroke();
    g.strokeStyle = 'rgba(90,45,35,0.22)'; g.beginPath(); g.ellipse(ex, ey + 3, 9, 5, 0, PI * 0.15, PI * 0.85); g.stroke();
    if (o.old) { g.strokeStyle = 'rgba(90,50,40,0.3)'; g.lineWidth = 1; for (var w = 0; w < 3; w++) { g.beginPath(); g.moveTo(ex + s * 11, ey + w * 3 - 2); g.lineTo(ex + s * 17, ey + w * 4 - 4); g.stroke(); } }
  });
  if (o.glasses) { g.strokeStyle = '#2a2a2a'; g.lineWidth = 2.4; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(cx + s * 21, ey + 1, 13, 10, 0, 0, TAU); g.stroke(); }); g.beginPath(); g.moveTo(cx - 8, ey); g.lineTo(cx + 8, ey); g.stroke(); }
  // mouth
  var my = ey + 47;
  g.fillStyle = o.lipC || 'rgba(160,70,70,0.75)';
  g.beginPath(); g.moveTo(cx - 14, my); g.quadraticCurveTo(cx - 5, my - 5, cx, my - 3); g.quadraticCurveTo(cx + 5, my - 5, cx + 14, my); g.quadraticCurveTo(cx, my + 7 + (o.smile || 0) * 3, cx - 14, my); g.fill();
  g.strokeStyle = 'rgba(70,25,20,0.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - 14, my); g.quadraticCurveTo(cx, my + 2 + (o.smile || 0) * 4, cx + 14, my); g.stroke();
  if (o.beard) { g.fillStyle = 'rgba(40,28,20,' + (o.beard * 0.45) + ')'; for (var b = 0; b < 900 * o.beard; b++) { var a = rnd() * PI, rr = 28 + rnd() * 30; var bx = cx + Math.cos(a) * rr * 1.2 * (rnd() < 0.5 ? 1 : -1) * 0.8, by = ey + 30 + Math.sin(a) * rr * 0.9; g.fillRect(bx, by, 1.4, 1.4); } }
  if (o.mustache) { g.fillStyle = o.browC || '#3a2618'; g.beginPath(); g.ellipse(cx - 8, my - 8, 10, 4, 0.2, 0, TAU); g.ellipse(cx + 8, my - 8, 10, 4, -0.2, 0, TAU); g.fill(); }
  if (o.old) { g.strokeStyle = 'rgba(90,50,40,0.28)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - 20, ey + 30); g.quadraticCurveTo(cx - 24, ey + 48, cx - 18, ey + 58); g.moveTo(cx + 20, ey + 30); g.quadraticCurveTo(cx + 24, ey + 48, cx + 18, ey + 58); g.stroke(); for (var f = 0; f < 3; f++) { g.beginPath(); g.moveTo(cx - 24, ey - 32 - f * 6); g.lineTo(cx + 24, ey - 32 - f * 6); g.stroke(); } }
  if (o.makeup) { smudge(g, cx - 21, ey - 6, 10, 'rgba(110,80,160,A)', 0.25); smudge(g, cx + 21, ey - 6, 10, 'rgba(110,80,160,A)', 0.25); }
  return c;
}
function faceRough(o) { var c = mkCanvas(256, 128), g = c.getContext('2d'); g.fillStyle = grey(165); g.fillRect(0, 0, 256, 128); if (!o.faceless) { g.fillStyle = grey(30); g.beginPath(); g.ellipse(64 - 10.5, 56, 5, 3, 0, 0, TAU); g.ellipse(64 + 10.5, 56, 5, 3, 0, 0, TAU); g.fill(); g.fillStyle = grey(110); g.beginPath(); g.ellipse(64, 82, 8, 3, 0, 0, TAU); g.fill(); } return c; }
// sculpted head: displaced sphere (brow, sockets, nose, lips, chin) aligned with the face texture
function gauss(dx, dy, sx, sy) { return Math.exp(-(dx * dx) / (2 * sx * sx) - (dy * dy) / (2 * sy * sy)); }
function sculptHead(o) {
  var g = new THREE.SphereGeometry(1, 48, 36), p = g.attributes.position, v = new THREE.Vector3();
  var jaw = o.kid ? 0.1 : (o.sex === 'f' ? 0.32 : 0.2) - (o.build || 0) * 0.12, flat = !!o.faceless;
  for (var i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    var x = v.x, y = v.y, z = v.z, front = Math.max(0, z);
    x *= 0.8; z *= 0.9; y *= 1.04;
    if (y < 0) { var k = Math.pow(-y, 1.4); x *= 1 - jaw * k; z *= 1 - 0.12 * k; }
    if (z < 0) z *= 1.06 + (y > 0 ? 0.05 : 0);
    if (front > 0.2) {
      var fx = v.x, fy = v.y, f = Math.pow(front, 2);
      if (!flat) {
        z -= 0.075 * f * (gauss(fx - 0.255, fy, 0.11, 0.075) + gauss(fx + 0.255, fy, 0.11, 0.075)); // sockets
        z += 0.05 * f * gauss(fx, fy - 0.15, 0.42, 0.07); // brow ridge
        z += (o.bigNose ? 0.26 : 0.2) * f * gauss(fx, fy + 0.17, 0.075, 0.15) + 0.07 * f * gauss(fx, fy + 0.3, 0.1, 0.06); // nose
        z += 0.05 * f * gauss(fx, fy + 0.55, 0.17, 0.05); z -= 0.02 * f * gauss(fx, fy + 0.58, 0.18, 0.012); // lips + mouth line
        z += 0.05 * f * gauss(fx, fy + 0.84, 0.16, 0.08); // chin
        x *= 1 + 0.05 * gauss(Math.abs(fx) - 0.5, fy + 0.05, 0.12, 0.12); // cheekbones
      } else { z -= 0.03 * f * gauss(fx, fy, 0.5, 0.5); }
    }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}
var EYE_TEX = {};
function eyeTex(col) {
  if (EYE_TEX[col]) return EYE_TEX[col];
  var c = mkCanvas(128, 64), g = c.getContext('2d'); g.fillStyle = '#efe9e2'; g.fillRect(0, 0, 128, 64);
  smudge(g, 32, 32, 30, 'rgba(200,120,110,A)', 0.25);
  var gr = g.createRadialGradient(32, 32, 2, 32, 32, 11); gr.addColorStop(0, '#000'); gr.addColorStop(0.3, '#0a0605'); gr.addColorStop(0.35, col); gr.addColorStop(0.9, col); gr.addColorStop(1, '#1a1410');
  g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 11, 0, TAU); g.fill();
  for (var i = 0; i < 20; i++) { var a = i / 20 * TAU; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(32 + Math.cos(a) * 4.5, 32 + Math.sin(a) * 4.5); g.lineTo(32 + Math.cos(a) * 10, 32 + Math.sin(a) * 10); g.stroke(); }
  EYE_TEX[col] = toTex(c); return EYE_TEX[col];
}
// clothing textures
function clothCanvas(o) {
  var c = mkCanvas(256, 256), g = c.getContext('2d'), rnd = makeRNG(o.seed || 3);
  g.fillStyle = o.color; g.fillRect(0, 0, 256, 256);
  if (o.pattern === 'plaid') { for (var i = 0; i < 256; i += 32) { g.fillStyle = o.color2 || 'rgba(0,0,0,0.45)'; g.fillRect(i, 0, 12, 256); g.fillRect(0, i, 256, 12); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i + 20, 0, 2, 256); g.fillRect(0, i + 20, 256, 2); } }
  if (o.pattern === 'stripe') for (var s = 0; s < 256; s += 16) { g.fillStyle = o.color2 || 'rgba(255,255,255,0.5)'; g.fillRect(0, s, 256, 6); }
  if (o.pattern === 'knit') for (var ky = 0; ky < 256; ky += 6) for (var kx = 0; kx < 256; kx += 8) { g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx + 4, ky + 5); g.lineTo(kx + 8, ky); g.stroke(); }
  if (o.pattern === 'dots') for (var d = 0; d < 80; d++) { g.fillStyle = o.color2 || '#fff'; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 4, 0, TAU); g.fill(); }
  // weave noise + wrinkles
  for (var n = 0; n < 3000; n++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '0,0,0' : '255,255,255') + ',' + rnd() * 0.06 + ')'; g.fillRect(rnd() * 256, rnd() * 256, 2, 1); }
  for (var w = 0; w < 14; w++) smudge(g, rnd() * 256, rnd() * 256, 10 + rnd() * 25, 'rgba(0,0,0,A)', 0.12);
  if (o.buttons) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(126, 0, 4, 256); for (var b = 20; b < 256; b += 48) { g.fillStyle = '#e8e0d0'; g.beginPath(); g.arc(128, b, 4, 0, TAU); g.fill(); } }
  if (o.tag) { g.fillStyle = '#f5f0e0'; g.fillRect(o.tagX || 150, 70, 46, 18); g.fillStyle = '#1d2f6f'; g.font = '13px ' + F.ticket; g.fillText(o.tag, (o.tagX || 150) + 4, 84); }
  return c;
}
var HAIR_T = null, HAIR_N = null;
function hairTex() { if (HAIR_T) return HAIR_T; var c = mkCanvas(128, 256), g = c.getContext('2d'), r = makeRNG(31); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 256); for (var i = 0; i < 700; i++) { var x = r() * 128; g.strokeStyle = 'rgba(' + (r() < 0.5 ? '0,0,0,' + r() * 0.35 : '255,255,255,' + r() * 0.3) + ')'; g.lineWidth = 0.6 + r(); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 10, 80, x + (r() - 0.5) * 10, 170, x + (r() - 0.5) * 6, 256); g.stroke(); } HAIR_T = toTex(c); return HAIR_T; }
function hairNorm() { if (HAIR_N) return HAIR_N; var T = new TexSet(128, 128, 33); for (var x = 0; x < 128; x++) { T.hg.fillStyle = grey(110 + T.rnd() * 60); T.hg.fillRect(x, 0, 1, 128); } HAIR_N = toTex(heightToNormal(T.H, 3, true), { linear: true }); return HAIR_N; }
var PEOPLE = []; // active person objects
var PMAT = { cache: {} };
function lathe(pts, segs) { return new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), segs || 18); }
// build a person. o: {skin, hair, hairC, top, topC, top2, pants, build(0..1 wide), h(height scale), sex, glasses, hat, kid, faceless, veil}
function makePerson(o) {
  var P = { o: o, root: new THREE.Group(), parts: {}, t: Math.random() * 10, blinkT: 1 + Math.random() * 3, look: new THREE.Vector2(), lookT: new THREE.Vector2(), anim: 'sit', pose: {} };
  var S = o.kid ? 0.62 : (o.h || 1), W = 0.9 + (o.build || 0.3) * 0.45, root = P.root;
  root.scale.setScalar(S);
  var skinM = stdMat({ color: rgbs(o.skin), roughness: 0.58, envMapIntensity: 0.6, emissive: rgbs(o.skin, 0.25), emissiveIntensity: 0.12 });
  var ft = toTex(faceCanvas(o), { clamp: false }), ftc = ft;
  var headM = stdMat({ map: ft, roughness: 0.58, envMapIntensity: 0.6, emissive: rgbs(o.skin, 0.25), emissiveIntensity: 0.12 });
  P.faceTex = ft; P.faceTexClosed = ftc; P.headM = headM; P.skinM = skinM;
  var topM = stdMat({ map: toTex(clothCanvas({ color: o.topC, color2: o.top2, pattern: o.pattern, buttons: o.buttons, tag: o.tag, seed: o.seed }), {}), roughness: 0.85 });
  var pantsM = stdMat({ color: o.pantsC || '#2b3448', roughness: 0.8 });
  var hairM = stdMat({ color: o.hairC || HAIRC[0], roughness: 0.5, envMapIntensity: 0.6, map: hairTex(), normalMap: hairNorm(), normalScale: new THREE.Vector2(0.6, 0.6) });
  var shoeM = stdMat({ color: o.shoeC || '#1c1712', roughness: 0.45 });
  P.mats = [skinM, headM, topM, pantsM, hairM, shoeM];
  // hips & legs (seated pose default)
  var hips = group(root, 0, 0, 0); P.parts.hips = hips;
  var pelvis = mesh(new THREE.SphereGeometry(0.17, 14, 10), pantsM, 0, 0.02, 0, hips); pelvis.scale.set(W, 0.6, 0.85);
  ['L', 'R'].forEach(function (sd, i) {
    var sx = (i ? 1 : -1) * 0.1 * W;
    var thigh = group(hips, sx, 0, 0); P.parts['thigh' + sd] = thigh;
    mesh(lathe([[0, 0], [0.052, 0.01], [0.062 * W, 0.2], [0.076 * W, 0.4], [0, 0.42]], 14), pantsM, 0, -0.42, 0, thigh);
    var shin = group(thigh, 0, -0.42, 0); P.parts['shin' + sd] = shin;
    mesh(lathe([[0, 0], [0.038, 0.02], [0.05, 0.28], [0.05, 0.42], [0, 0.44]], 14), pantsM, 0, -0.44, 0, shin);
    var foot = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoeM, 0, -0.45, 0.06, shin); P.parts['foot' + sd] = foot;
  });
  // torso
  var spine = group(hips, 0, 0.05, 0); P.parts.spine = spine;
  var torsoG = lathe(o.sex === 'f' ? [[0, 0], [0.17, 0.0], [0.18, 0.1], [0.16, 0.24], [0.185, 0.36], [0.19, 0.44], [0.16, 0.51], [0.1, 0.55], [0.055, 0.58], [0, 0.585]] : [[0, 0], [0.165, 0.0], [0.18, 0.12], [0.18, 0.28], [0.2, 0.42], [0.2, 0.48], [0.15, 0.54], [0.07, 0.575], [0.055, 0.59], [0, 0.595]], 24);
  var torso = mesh(torsoG, topM, 0, 0, 0, spine); torso.scale.set(W, 1, 0.68 + (o.build || 0.3) * 0.25); P.parts.torso = torso;
  // neck + head
  var neck = group(spine, 0, 0.55, 0); P.parts.neck = neck;
  mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 10), skinM, 0, 0.04, 0, neck);
  var head = group(neck, 0, 0.18, 0.01); P.parts.head = head;
  var hm = mesh(sculptHead(o), headM, 0, 0, 0, head); hm.scale.setScalar(0.118); P.parts.headMesh = hm;
  P.parts.nose = null; P.parts.jaw = null;
  // eyeballs + lids
  if (!o.faceless) {
    var eyeM = stdMat({ map: eyeTex(o.eyeC || '#5a3a20'), roughness: 0.08, envMapIntensity: 1.4 });
    var lidM = skinM; P.eyes = []; P.lids = [];
    [-1, 1].forEach(function (sd) {
      var ex = sd * 0.255 * 0.8 * 0.118, ey = 0.0, ez = 0.96 * 0.9 * 0.118 - 0.075 * 0.9 * 0.118 - 0.008;
      var eg = group(head, ex, ey, ez);
      var ball = mesh(new THREE.SphereGeometry(0.0125, 16, 12), eyeM, 0, 0, 0, eg, false); // iris (u=0.25 of tex) faces +z
      var lid = mesh(new THREE.SphereGeometry(0.0134, 14, 10, 0, TAU, 0, PI * 0.5), lidM, 0, 0, 0, eg, false); lid.rotation.x = -1.35; P.lids.push(lid);
      P.eyes.push(eg);
    });
  }
  [-1, 1].forEach(function (s) { var e = mesh(new THREE.SphereGeometry(0.026, 10, 8), skinM, s * 0.094, 0.005, -0.008, head); e.scale.set(0.42, 1.15, 0.75); });
  // hair styles
  buildHair(P, head, hairM, o);
  // glasses frame (3D)
  if (o.glasses && !o.faceless) { var gm = stdMat({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.5 }); var gb = mesh(new THREE.TorusGeometry(0.024, 0.003, 4, 16), gm, -0.035, 0.012, 0.106, head); var gb2 = mesh(new THREE.TorusGeometry(0.024, 0.003, 4, 16), gm, 0.035, 0.012, 0.106, head); }
  // arms
  ['L', 'R'].forEach(function (sd, i) {
    var s = i ? 1 : -1;
    var sh = group(spine, s * 0.175 * W, 0.47, 0); P.parts['sh' + sd] = sh;
    mesh(new THREE.SphereGeometry(0.058, 12, 10), topM, -0.01 * (i ? 1 : -1), -0.01, 0, sh).scale.set(1, 0.95, 0.95);
    mesh(lathe([[0, 0], [0.043, 0.02], [0.048, 0.15], [0.054, 0.27], [0, 0.29]], 12), topM, 0, -0.29, 0, sh);
    var el2 = group(sh, 0, -0.28, 0); P.parts['el' + sd] = el2;
    mesh(lathe([[0, 0], [0.033, 0.02], [0.04, 0.16], [0.043, 0.24], [0, 0.25]], 12), o.shortSleeve ? skinM : topM, 0, -0.25, 0, el2);
    if (!o.shortSleeve) mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 12), topM, 0, -0.235, 0, el2);
    var hand = group(el2, 0, -0.26, 0); P.parts['hand' + sd] = hand;
    var hmesh = mesh(new THREE.SphereGeometry(0.04, 12, 10), skinM, 0, -0.045, 0.005, hand); hmesh.scale.set(0.62, 1.25, 0.38);
    var th = mesh(new THREE.SphereGeometry(0.014, 8, 6), skinM, s * -0.022, -0.03, 0.018, hand); th.scale.set(1, 2.2, 1); th.rotation.z = s * 0.5;
  });
  if (o.watch) { var wm = stdMat({ color: 0xd9c078, metalness: 1, roughness: 0.3 }); mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.02, 12), wm, 0, -0.22, 0, P.parts.elL); }
  // held item (doll / newspaper / briefcase) attached to a hand
  if (o.holds === 'doll') { P.doll = makeDoll(); P.doll.position.set(0, -0.08, 0.06); P.parts.handL.add(P.doll); }
  // hats
  if (o.hat) buildHat(P, head, o);
  if (o.veil) { var vm = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.9, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false }); var veil = mesh(new THREE.CylinderGeometry(0.11, 0.24, 0.62, 20, 1, true), vm, 0, -0.18, 0.0, head); veil.renderOrder = 3; P.parts.veil = veil; var cap = mesh(new THREE.SphereGeometry(0.125, 16, 10, 0, TAU, 0, PI / 2), vm, 0, 0.02, 0, head); }
  // the horror face shell (hidden): a cap over the face that follows the head's shape
  P.horror = null;
  P.root.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  setPose(P, 'sit');
  return P;
}
function buildHair(P, head, hm, o) {
  var st = o.hair || 'short';
  if (st === 'bald') { var fr = mesh(new THREE.SphereGeometry(0.121, 20, 12, 0, TAU, PI * 0.42, PI * 0.25), hm, 0, 0, -0.005, head); fr.scale.set(0.93, 1.1, 1.0); return; }
  var capG = new THREE.SphereGeometry(0.123, 24, 14, 0, TAU, 0, PI * (st === 'long' || st === 'bob' ? 0.56 : 0.48));
  var cap = mesh(capG, hm, 0, 0.014, -0.012, head); cap.scale.set(0.84, 1.06, 0.98); cap.rotation.x = -0.32; P.parts.hair = cap;
  if (o.part) { cap.rotation.z = o.part * 0.08; }
  if (st === 'long' || st === 'pony' || st === 'bob') {
    var back = mesh(new THREE.CylinderGeometry(0.11, st === 'bob' ? 0.12 : 0.13, st === 'bob' ? 0.17 : 0.34, 18, 1, true, PI * 0.25, PI * 1.5), hm, 0, st === 'bob' ? -0.06 : -0.15, -0.012, head);
    var backC = mesh(new THREE.SphereGeometry(0.115, 16, 10), hm, 0, -0.02, -0.03, head); backC.scale.set(0.98, 1.05, 0.9);
  }
  if (st === 'pony') { var pt = mesh(new THREE.SphereGeometry(0.05, 10, 8), hm, 0, 0.02, -0.15, head); pt.scale.set(0.8, 2.2, 0.8); pt.rotation.x = 0.5; }
  if (st === 'bun') { mesh(new THREE.SphereGeometry(0.06, 12, 10), hm, 0, 0.09, -0.09, head); }
  if (st === 'beehive') { var bh = mesh(new THREE.SphereGeometry(0.12, 16, 12), hm, 0, 0.12, -0.02, head); bh.scale.set(0.9, 1.25, 0.95); }
  if (st === 'pomp') { var pp = mesh(new THREE.SphereGeometry(0.08, 12, 10), hm, 0, 0.1, 0.07, head); pp.scale.set(1.2, 0.7, 1.0); }
  if (st === 'curly') { for (var i = 0; i < 16; i++) { var a = i / 16 * TAU; mesh(new THREE.SphereGeometry(0.04, 8, 6), hm, Math.cos(a) * 0.1, 0.06 + Math.sin(i * 1.7) * 0.03, Math.sin(a) * 0.09 - 0.02, head); } }
}
function buildHat(P, head, o) {
  var c = o.hatC || '#6b4a2a', m = stdMat({ color: c, roughness: 0.75 });
  if (o.hat === 'cowboy') { mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.11, 18), m, 0, 0.13, -0.005, head); var br = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 24), m, 0, 0.08, 0, head); br.scale.set(1, 1, 0.85); }
  if (o.hat === 'trucker') { var cp = mesh(new THREE.SphereGeometry(0.128, 18, 10, 0, TAU, 0, PI / 2), m, 0, 0.03, -0.005, head); cp.scale.set(0.95, 0.8, 1.05); var bill = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 16, 1, false, -PI / 2, PI), m, 0, 0.035, 0.08, head); bill.rotation.x = 0.1; bill.scale.set(1, 1, 0.8);
    var lc = mkCanvas(128, 64), lg = lc.getContext('2d'); lg.fillStyle = '#f3e6c8'; lg.fillRect(0, 0, 128, 64); lg.fillStyle = '#7e1418'; lg.font = '24px ' + F.slab; lg.textAlign = 'center'; lg.fillText(o.capText || 'KW', 64, 42); var patch = mesh(new THREE.PlaneGeometry(0.07, 0.035), new THREE.MeshStandardMaterial({ map: toTex(lc, { clamp: true }) }), 0, 0.08, 0.118, head, false); patch.rotation.x = -0.35; }
  if (o.hat === 'sheriff') { mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.1, 18), m, 0, 0.13, 0, head); mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.01, 24), m, 0, 0.085, 0, head); }
  if (o.hat === 'scarf') { var sc = mesh(new THREE.SphereGeometry(0.13, 18, 12, 0, TAU, 0, PI * 0.62), m, 0, 0.0, -0.01, head); sc.scale.set(0.98, 1.12, 1.06); sc.rotation.x = -0.35; }
  if (o.hat === 'brim') { mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.08, 18), m, 0, 0.12, 0, head); mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.01, 24), m, 0, 0.085, 0.01, head); }
}
function makeDoll() { // porcelain doll the kid holds (its face can become a doll image)
  var g = new THREE.Group(), por = stdMat({ color: 0xf0e6dc, roughness: 0.25 }), dress = stdMat({ color: 0x9a2a3a, roughness: 0.8 });
  mesh(new THREE.ConeGeometry(0.05, 0.11, 12), dress, 0, -0.03, 0, g);
  var c = mkCanvas(256, 128), gg = c.getContext('2d'); gg.fillStyle = '#f0e6dc'; gg.fillRect(0, 0, 256, 128); gg.fillStyle = '#223'; gg.beginPath(); gg.arc(56, 58, 6, 0, TAU); gg.arc(72, 58, 6, 0, TAU); gg.fill(); gg.fillStyle = '#c55'; gg.beginPath(); gg.arc(64, 76, 4, 0, TAU); gg.fill(); smudge(gg, 48, 70, 8, 'rgba(230,120,120,A)', 0.5); smudge(gg, 80, 70, 8, 'rgba(230,120,120,A)', 0.5);
  var hm = new THREE.MeshStandardMaterial({ map: toTex(c), roughness: 0.25 }); g.userData.headMat = hm;
  var h = mesh(new THREE.SphereGeometry(0.035, 16, 12), hm, 0, 0.045, 0, g); g.userData.head = h;
  mesh(new THREE.SphereGeometry(0.038, 12, 8, 0, TAU, 0, PI * 0.5), stdMat({ color: 0x7a4a22, roughness: 0.6 }), 0, 0.05, -0.004, g);
  return g;
}
// --- the horror face: image fitted to the head (feathered edges, no square border) ----
var FACE_IMG = {}; // number -> Image (preloaded)
function horrorCanvas(n) {
  var img = FACE_IMG[n], c = mkCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  if (img && img.complete && img.naturalWidth) { var ar = img.naturalWidth / img.naturalHeight, w = 256 * Math.max(1, ar), h = w / ar; g.drawImage(img, 128 - w / 2, 128 - h / 2 + 6, w, h); }
  else { drawProcFace(g, 256, n); }
  // feather to transparent (oval)
  g.globalCompositeOperation = 'destination-in';
  var gr = g.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.72, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.scale(1, 1.12); g.fillStyle = gr; g.fillRect(0, 0, 256, 256 / 1.12 + 40); g.restore();
  g.globalCompositeOperation = 'source-over';
  return c;
}
function drawProcFace(g, s, n) { // stand-in if an image could not load
  g.fillStyle = '#1a1414'; g.fillRect(0, 0, s, s);
  var gr = g.createRadialGradient(s / 2, s * 0.45, 10, s / 2, s / 2, s * 0.5); gr.addColorStop(0, '#d8cfc6'); gr.addColorStop(1, '#2a2222'); g.fillStyle = gr; g.beginPath(); g.ellipse(s / 2, s / 2, s * 0.32, s * 0.42, 0, 0, TAU); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.ellipse(s * 0.38, s * 0.42, s * 0.07, s * 0.09, 0, 0, TAU); g.ellipse(s * 0.62, s * 0.42, s * 0.07, s * 0.09, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(s / 2, s * 0.7, s * 0.12, s * 0.15, 0, 0, TAU); g.fill();
}
function attachHorror(P, n) {
  removeHorror(P);
  var tex = toTex(horrorCanvas(n), { clamp: true });
  var mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0, roughness: 0.5, depthWrite: false, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.0 });
  // partial sphere over the front of the head: phi centred on +z
  var geo = new THREE.SphereGeometry(0.128, 28, 20, PI * 0.5 - PI * 0.42, PI * 0.84, PI * 0.12, PI * 0.74);
  // rotate so the patch faces +z (three sphere phi=0 is -x); recentre uvs to 0..1
  var shell = new THREE.Mesh(geo, mat); shell.scale.set(0.92, 1.12, 1.0); shell.position.set(0, -0.005, 0.004); shell.renderOrder = 6;
  shell.rotation.y = 0;
  var uv = geo.attributes.uv, pos = geo.attributes.position;
  for (var i = 0; i < uv.count; i++) { var x = pos.getX(i), y = pos.getY(i); uv.setXY(i, 0.5 - x / 0.26, 0.5 + y / 0.24); }
  P.parts.head.add(shell); P.horror = { mesh: shell, mat: mat, n: n, k: 0 };
  shell.visible = false;
  return P.horror;
}
function removeHorror(P) { if (P.horror) { P.parts.head.remove(P.horror.mesh); P.horror.mat.map.dispose(); P.horror.mat.dispose(); P.horror = null; } }
function revealHorror(P, k) { // k 0..1
  if (!P.horror) return; var h = P.horror; h.k = k; h.mesh.visible = k > 0.001; h.mat.opacity = k; h.mat.emissiveIntensity = 0.35 * k;
  P.headM.color.setScalar(1 - k * 0.75); P.skinM.color.set(rgbs(P.o.skin)).multiplyScalar(1 - k * 0.6);
  if (P.eyes) P.eyes.forEach(function (e) { e.visible = k < 0.5; });
  if (P.parts.veil) P.parts.veil.visible = k < 0.3;
}
function disposePerson(P) { if (P.root.parent) P.root.parent.remove(P.root); P.root.traverse(function (m) { if (m.isMesh) { m.geometry.dispose(); } }); P.mats.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); removeHorror(P); }
function setLayer(obj, layer) { obj.traverse(function (m) { m.layers.set(layer); }); }
// ---- poses & animation --------------------------------------------------------------
function setPose(P, name) { P.anim = name; P.animT = 0; }
function rot(o, x, y, z, k, dt) { o.rotation.x = damp(o.rotation.x, x, k, dt); o.rotation.y = damp(o.rotation.y, y || 0, k, dt); o.rotation.z = damp(o.rotation.z, z || 0, k, dt); }
function updatePerson(P, dt, camPos) {
  P.t += dt; P.animT += dt; var t = P.t, a = P.anim, pr = P.parts, k = 8;
  var sit = a !== 'walk' && a !== 'stand' && a !== 'lunge' && a !== 'standStare';
  var odd = P.odd || 0;
  // legs
  if (sit) {
    rot(pr.thighL, -PI / 2 + 0.05, 0.08, 0, k, dt); rot(pr.thighR, -PI / 2 + 0.05, -0.08, 0, k, dt);
    rot(pr.shinL, PI / 2 - 0.1 + (P.kick ? Math.sin(t * 2) * 0.15 : 0), 0, 0, k, dt); rot(pr.shinR, PI / 2 - 0.1, 0, 0, k, dt);
    pr.hips.position.y = damp(pr.hips.position.y, 0, k, dt);
  } else if (a === 'walk') {
    var sw = Math.sin(t * 7) * 0.5; rot(pr.thighL, sw, 0, 0, 14, dt); rot(pr.thighR, -sw, 0, 0, 14, dt);
    rot(pr.shinL, Math.max(0, -sw) * 0.9, 0, 0, 14, dt); rot(pr.shinR, Math.max(0, sw) * 0.9, 0, 0, 14, dt);
    pr.hips.position.y = 0.9 + Math.abs(Math.cos(t * 7)) * 0.03;
  } else { rot(pr.thighL, 0, 0, 0, k, dt); rot(pr.thighR, 0, 0, 0, k, dt); rot(pr.shinL, 0, 0, 0, k, dt); rot(pr.shinR, 0, 0, 0, k, dt); pr.hips.position.y = damp(pr.hips.position.y, 0.9, k, dt); }
  // breathing / spine
  var br = Math.sin(t * 1.6) * 0.012;
  rot(pr.spine, (a === 'lean' ? 0.2 : 0.04) + br + (a === 'eat' ? 0.18 : 0) + (a === 'lunge' ? 0.5 : 0), 0, 0, 4, dt);
  // arms by pose
  var L = { sx: 0.1, sz: -0.12, ex: -0.3 }, Rr = { sx: 0.1, sz: 0.12, ex: -0.3 };
  if (sit) { L = { sx: -0.55, sz: -0.12, ex: -0.9 }; Rr = { sx: -0.55, sz: 0.12, ex: -0.9 }; }
  if (a === 'walk') { var s2 = Math.sin(t * 7) * 0.4; L = { sx: -s2, sz: -0.1, ex: -0.25 }; Rr = { sx: s2, sz: 0.1, ex: -0.25 }; }
  if (a === 'menu') { L = { sx: -1.25, sz: -0.25, ex: -1.0 }; Rr = { sx: -1.25, sz: 0.25, ex: -1.0 }; }
  if (a === 'hand') { Rr = { sx: -2.7 + Math.sin(t * 6) * 0.08, sz: 0.3, ex: -0.35 }; }
  if (a === 'drink') { var ph = (P.animT % 6) < 2.2; Rr = ph ? { sx: -1.3, sz: 0.35, ex: -2.2 } : { sx: -0.6, sz: 0.15, ex: -1.0 }; }
  if (a === 'eat') { var ch = Math.sin(t * 3) > 0; Rr = ch ? { sx: -1.1, sz: 0.25, ex: -1.6 } : { sx: -0.8, sz: 0.15, ex: -0.9 }; L = { sx: -0.7, sz: -0.15, ex: -0.9 }; }
  if (a === 'lunge' || a === 'standStare') { L = { sx: -1.4, sz: -0.2, ex: -0.3 }; Rr = { sx: -1.4, sz: 0.2, ex: -0.3 }; }
  if (P.holdDoll) L = { sx: -0.9, sz: -0.05, ex: -1.3 };
  if (odd > 0.5 && sit && a !== 'hand') { Rr = { sx: -0.2, sz: 0.06, ex: 0 }; L = { sx: -0.2, sz: -0.06, ex: 0 }; } // arms hanging straight down: wrong
  rot(pr.shL, L.sx, 0, L.sz, 6, dt); rot(pr.shR, Rr.sx, 0, Rr.sz, 6, dt); rot(pr.elL, L.ex, 0, 0, 6, dt); rot(pr.elR, Rr.ex, 0, 0, 6, dt);
  // head look
  if (P.lookAtCam && camPos) {
    var hp = new THREE.Vector3(); pr.head.getWorldPosition(hp);
    var inv = new THREE.Matrix4().copy(P.root.matrixWorld).invert(), lp = camPos.clone().applyMatrix4(inv), hl = hp.clone().applyMatrix4(inv);
    P.lookT.set(clamp(Math.atan2(lp.x - hl.x, lp.z - hl.z), -1.2, 1.2), clamp(Math.atan2(lp.y - hl.y, Math.hypot(lp.x - hl.x, lp.z - hl.z)), -0.6, 0.5));
  } else if (P.idleLook !== false) {
    if ((P.lookTimer = (P.lookTimer || 0) - dt) <= 0) { P.lookTimer = 2 + Math.random() * 4; P.lookT.set((Math.random() - 0.5) * 1.1, (Math.random() - 0.6) * 0.3); if (a === 'menu' || a === 'eat') P.lookT.set(0, -0.45); }
  }
  var lk = odd > 0.5 ? 2.0 : 5;
  P.look.x = damp(P.look.x, P.lookT.x, lk, dt); P.look.y = damp(P.look.y, P.lookT.y, lk, dt);
  pr.neck.rotation.y = P.look.x * 0.45; pr.head.rotation.y = P.look.x * 0.55;
  pr.head.rotation.x = -P.look.y * 0.8 + (a === 'menu' ? 0.25 : 0);
  pr.head.rotation.z = damp(pr.head.rotation.z, (P.tilt || 0) + (odd > 0.3 ? 0.42 : 0), 3, dt);
  // blink (odd ones never blink)
  if (P.lids) {
    var closed = 0;
    if (!odd) { P.blinkT -= dt; if (P.blinkT <= 0) { closed = 1; if (P.blinkT < -0.13) P.blinkT = 2 + Math.random() * 4.5; } }
    var lidX = closed ? -0.05 : (a === 'menu' || a === 'eat' ? -0.85 : -1.32) + (P.lidOpen || 0);
    P.lids.forEach(function (l) { l.rotation.x = closed ? -0.05 : damp(l.rotation.x, lidX, 20, dt); });
    // eyes look (anomalies: always at the camera)
    var ey2 = P.look.x * 0.5, ep = P.look.y * 0.4;
    if ((P.eyeStare || odd > 0.4) && camPos) { var tmp = new THREE.Vector3(); P.eyes[0].getWorldPosition(tmp); var inv2 = new THREE.Matrix4().copy(P.parts.head.matrixWorld).invert(); var lc = camPos.clone().applyMatrix4(inv2), le = tmp.clone().applyMatrix4(inv2); ey2 = clamp(Math.atan2(lc.x - le.x, lc.z - le.z), -0.6, 0.6); ep = clamp(Math.atan2(lc.y - le.y, Math.hypot(lc.x - le.x, lc.z - le.z)), -0.4, 0.4); }
    P.eyes.forEach(function (e) { e.rotation.y = damp(e.rotation.y, ey2, 14, dt); e.rotation.x = damp(e.rotation.x, -ep, 14, dt); });
  }
  if (P.horror && P.horror.k > 0) { P.horror.mesh.rotation.z = Math.sin(t * 30) * 0.02 * P.horror.k; }
}
// --- archetypes: the regulars and passers-by ----------------------------------------
var ARCH = [
  { id: 'earl', name: 'EARL', role: 'Trucker', ja: 'トラック運転手のアール', voice: 'trucker', o: { sex: 'm', build: 0.95, h: 1.06, skin: SKIN[1], hair: 'short', hairC: HAIRC[2], hat: 'trucker', hatC: '#24467a', capText: 'KW', topC: '#8c1f1f', top2: 'rgba(0,0,0,0.55)', pattern: 'plaid', beard: 0.9, pantsC: '#2a3550', watch: 1 }, likes: ['coffee', 'pie', 'burger'], regular: 1 },
  { id: 'dot', name: 'DOT', role: 'Student', ja: '女子大生のドット', voice: 'girl', o: { sex: 'f', build: 0.1, h: 0.94, skin: SKIN[0], hair: 'pony', hairC: HAIRC[4], topC: '#e98aa9', pattern: 'knit', buttons: 1, lashes: 1, blush: 1.4, smile: 1, pantsC: '#3a5a8a', eyeC: '#3a6a9a' }, likes: ['shake', 'pancakes', 'pie'] },
  { id: 'kessler', name: 'MR. KESSLER', role: 'Salesman', ja: 'セールスマンのケスラー', voice: 'salesman', o: { sex: 'm', build: 0.45, skin: SKIN[6], hair: 'short', hairC: HAIRC[1], part: 1, topC: '#4a4e5a', glasses: 1, pantsC: '#3a3e4a', tag: 'KESSLER', tagX: 160 }, likes: ['coffee', 'eggs', 'burger'] },
  { id: 'rosa', name: 'ROSA', role: 'Night Nurse', ja: '夜勤看護師のローザ', voice: 'nurse', o: { sex: 'f', build: 0.3, skin: SKIN[2], hair: 'bun', hairC: HAIRC[0], topC: '#8fd3c1', pantsC: '#8fd3c1', shortSleeve: 1, eyeC: '#2a1a10' }, likes: ['coffee', 'eggs', 'pancakes'] },
  { id: 'gus', name: 'GUS', role: 'Old Cowboy', ja: '年寄りカウボーイのガス', voice: 'cowboy', o: { sex: 'm', build: 0.5, h: 0.98, skin: SKIN[2], hair: 'short', hairC: HAIRC[6], hat: 'cowboy', hatC: '#6b4a2a', topC: '#4a6a8e', mustache: 1, browC: '#cfcfcf', old: 1, pantsC: '#2a3a5a' }, likes: ['coffee', 'eggs', 'pie'], regular: 1 },
  { id: 'tina', name: 'TINA', role: 'Teenager', ja: '高校生のティナ', voice: 'girl', o: { sex: 'f', build: 0.05, h: 0.92, skin: SKIN[0], hair: 'beehive', hairC: HAIRC[7], topC: '#f3e6c8', pattern: 'stripe', top2: '#c8282e', lashes: 1, makeup: 1, blush: 1.2, pantsC: '#2a2a2a' }, likes: ['shake', 'burger'] },
  { id: 'ricky', name: 'RICKY', role: 'Greaser', ja: '不良少年のリッキー', voice: 'teen', o: { sex: 'm', build: 0.3, h: 0.97, skin: SKIN[1], hair: 'pomp', hairC: HAIRC[0], topC: '#151515', pantsC: '#2a3a5a' }, likes: ['burger', 'shake'] },
  { id: 'walt', name: 'WALT', role: 'Mechanic', ja: '整備士のウォルト', voice: 'mechanic', o: { sex: 'm', build: 0.7, skin: SKIN[4], hair: 'short', hairC: HAIRC[0], hat: 'trucker', hatC: '#7e1418', capText: 'OIL', topC: '#5a6a7a', tag: 'WALT', tagX: 60, beard: 0.4, pantsC: '#5a6a7a' }, likes: ['burger', 'coffee', 'eggs'] },
  { id: 'pruitt', name: 'MRS. PRUITT', role: 'Widow', ja: '未亡人のプルイット夫人', voice: 'lady', o: { sex: 'f', build: 0.35, h: 0.92, skin: SKIN[0], hair: 'bun', hairC: HAIRC[6], topC: '#6a4a7a', glasses: 1, old: 1, lipC: 'rgba(170,60,90,0.8)' }, likes: ['coffee', 'pie'] },
  { id: 'doyle', name: 'SHERIFF DOYLE', role: 'Sheriff', ja: '保安官のドイル', voice: 'oldman', o: { sex: 'm', build: 0.75, skin: SKIN[1], hair: 'short', hairC: HAIRC[5], hat: 'sheriff', hatC: '#8a7a5a', topC: '#b8a27a', mustache: 1, browC: '#6a6a6a', pantsC: '#6a5a3a', tag: 'SHERIFF', tagX: 150 }, likes: ['coffee', 'pie', 'eggs'], regular: 1 },
  { id: 'henderson', name: 'MRS. HENDERSON', role: 'Mother', ja: '子連れのヘンダーソン夫人', voice: 'mom', o: { sex: 'f', build: 0.35, skin: SKIN[3], hair: 'bob', hairC: HAIRC[0], hat: 'scarf', hatC: '#c8a04a', topC: '#2f7e6e', pantsC: '#3a3a3a' }, likes: ['pancakes', 'coffee'], kid: 1 },
  { id: 'lou', name: 'LOU', role: 'Musician', ja: 'ミュージシャンのルー', voice: 'salesman', o: { sex: 'm', build: 0.2, skin: SKIN[5], hair: 'curly', hairC: HAIRC[0], topC: '#7a3a2a', pantsC: '#1a1a1a', hat: 'brim', hatC: '#222' }, likes: ['coffee', 'pie', 'pancakes'] },
  { id: 'marge', name: 'MARGE', role: 'Waitress (off duty)', ja: '非番のウェイトレス・マージ', voice: 'waitress', o: { sex: 'f', build: 0.55, skin: SKIN[1], hair: 'curly', hairC: HAIRC[7], topC: '#c8282e', pantsC: '#2b2b2b', lashes: 1, lipC: 'rgba(190,30,40,0.85)' }, likes: ['coffee', 'eggs', 'pie'] }
];
var KID = { id: 'kid', name: 'MILLIE', role: 'Kid', ja: 'ミリー（子ども）', voice: 'kid', o: { sex: 'f', kid: 1, build: 0.1, skin: SKIN[3], hair: 'pony', hairC: HAIRC[0], topC: '#f3c84a', pantsC: '#3a5a8a', holds: 'doll', blush: 1.5 } };
function personFrom(arch, seed) { var o = {}; for (var k in arch.o) o[k] = arch.o[k]; o.seed = seed || Math.floor(Math.random() * 1e6); return makePerson(o); }
