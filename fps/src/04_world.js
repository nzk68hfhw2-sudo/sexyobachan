// ---- scene, lighting, level geometry, colliders -----------------------------
var scene, camera, renderer, sun, hemi, envRT;
var COLS = [];      // axis aligned boxes {x0,x1,y0,y1,z0,z1}
var CIRCLES = [];   // {x,z,r} (cages) — block walking only
var ARENA = 31;
var SUN_DIR;
var MAT = {};
var CAGE_POS = [[-8, -3], [11, -7], [23, 8], [-24, -15], [26, -26], [-26, 21], [3, -28], [18, 25]];
var SPAWN_POS = [0, 26];

function stdMat(o) { return new THREE.MeshStandardMaterial(o); }
function addCol(x, y, z, w, h, d) { COLS.push({ x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2, z0: z - d / 2, z1: z + d / 2 }); }
function addBox(w, h, d, x, y, z, mat, noCol, noShadow) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = !noShadow; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m);
  if (!noCol) addCol(x, y, z, w, h, d);
  return m;
}
function repTex(t, rx, ry) { var c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; }

function buildWorld() {
  scene = new THREE.Scene();
  scene.background = TEX.sky;
  scene.fog = new THREE.FogExp2(0xa39a94, 0.0058);
  camera = new THREE.PerspectiveCamera(70, 1, 0.03, 400);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  SUN_DIR = new THREE.Vector3(Math.cos(SUN_ELEV) * Math.cos(SUN_AZ), Math.sin(SUN_ELEV), Math.cos(SUN_ELEV) * Math.sin(SUN_AZ));
  sun = new THREE.DirectionalLight(0xffd2a0, 2.6);
  sun.castShadow = true; sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
  var sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  scene.add(sun); scene.add(sun.target);
  hemi = new THREE.HemisphereLight(0x9db8dc, 0x50443a, 0.3);
  scene.add(hemi);
  try {
    var pm = new THREE.PMREMGenerator(renderer); envRT = pm.fromEquirectangular(TEX.sky); scene.environment = envRT.texture; pm.dispose();
  } catch (e) { hemi.intensity = 0.95; }

  // ground
  var gm = stdMat({ map: TEX.groundMap, normalMap: TEX.groundNrm, roughnessMap: TEX.groundRgh, roughness: 1, metalness: 0, envMapIntensity: 0.6 });
  var g = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), gm);
  gm.map = repTex(TEX.groundMap, 36, 36); gm.normalMap = repTex(TEX.groundNrm, 36, 36); gm.roughnessMap = repTex(TEX.groundRgh, 36, 36);
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; g.matrixAutoUpdate = false; g.updateMatrix(); scene.add(g);

  // painted lines + puddles (flat decals)
  var lineM = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.8, transparent: true, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  var whiteM = lineM.clone(); whiteM.color.set(0xd8d8d0);
  function flat(w, d, x, z, m, y) { var p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y || 0.012, z); p.receiveShadow = true; p.matrixAutoUpdate = false; p.updateMatrix(); scene.add(p); }
  flat(0.18, 50, -5, 0, lineM); flat(0.18, 50, 5, 0, lineM); flat(50, 0.18, 0, 18, whiteM); flat(50, 0.18, 0, -18, whiteM);
  for (var i = -4; i <= 4; i++) flat(0.14, 5, i * 3 + 0.01, 21, whiteM);
  var pudM = new THREE.MeshStandardMaterial({ color: 0x1b1a18, roughness: 0.04, metalness: 0, envMapIntensity: 0.55, transparent: true, opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  [[4, 9, 2.6], [-12, 2, 3.4], [15, -12, 2.2], [-6, -18, 3], [9, 22, 2], [-20, 14, 2.6]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.CircleGeometry(p[2], 20), pudM); m.rotation.x = -Math.PI / 2; m.scale.y = 0.6; m.rotation.z = p[0]; m.position.set(p[0], 0.016, p[1]); m.receiveShadow = true; scene.add(m);
  });

  // perimeter walls
  var W = ARENA + 1, wallM = stdMat({ map: repTex(TEX.concMap, 13, 1), normalMap: repTex(TEX.concNrm, 13, 1), roughness: 0.92, metalness: 0, envMapIntensity: 0.5 });
  addBox(W * 2 + 1, 5, 1, 0, 2.5, -W - 0.5, wallM); addBox(W * 2 + 1, 5, 1, 0, 2.5, W + 0.5, wallM);
  addBox(1, 5, W * 2 + 1, -W - 0.5, 2.5, 0, wallM); addBox(1, 5, W * 2 + 1, W + 0.5, 2.5, 0, wallM);
  var capM = stdMat({ color: 0x3a3d40, roughness: 0.5, metalness: 0.8, roughnessMap: TEX.metalRgh });
  addBox(W * 2 + 1.2, 0.12, 1.2, 0, 5.06, -W - 0.5, capM, true); addBox(W * 2 + 1.2, 0.12, 1.2, 0, 5.06, W + 0.5, capM, true);
  addBox(1.2, 0.12, W * 2 + 1.2, -W - 0.5, 5.06, 0, capM, true); addBox(1.2, 0.12, W * 2 + 1.2, W + 0.5, 5.06, 0, capM, true);

  // skyline silhouettes beyond the walls
  var farM = new THREE.MeshLambertMaterial({ color: 0x23272e }), r = mulberry(77);
  for (var k = 0; k < 22; k++) {
    var an = k / 22 * Math.PI * 2 + r() * 0.2, dist = 60 + r() * 45, hh = 8 + r() * 26, ww = 8 + r() * 14;
    var b = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, ww * (0.6 + r() * 0.6)), farM); b.position.set(Math.cos(an) * dist, hh / 2, Math.sin(an) * dist); b.rotation.y = r() * 3; b.matrixAutoUpdate = false; b.updateMatrix(); scene.add(b);
  }

  // shipping containers: [x, z, alongZ, colorIndex, stacked]
  var cc = [0x8f2f24, 0x244f78, 0x33663f, 0x9c6f1f, 0x666b72, 0x74401f];
  MAT.cont = cc.map(function (c) { return stdMat({ color: c, map: TEX.contMap, normalMap: TEX.contNrm, roughnessMap: TEX.contRgh, roughness: 1, metalness: 0.35, envMapIntensity: 0.6 }); });
  [[-14, -8, 0, 0, 0], [-14, -10.6, 0, 1, 1], [12, -15, 1, 2, 0], [17, 2, 0, 3, 0], [-18, 8, 1, 4, 0], [1, -21, 0, 5, 0], [-3, 10, 0, 1, 1], [21, -19, 1, 0, 0],
   [-23, -24, 0, 2, 0], [8, 15, 1, 3, 0], [-11, 23, 0, 0, 0], [25, 15, 0, 4, 1], [-27, 2, 1, 5, 0], [10, 2, 1, 1, 0]].forEach(function (c) {
    var w = c[2] ? 2.44 : 6.06, d = c[2] ? 6.06 : 2.44;
    addBox(w, 2.59, d, c[0], 1.295, c[1], MAT.cont[c[3]]);
    if (c[4]) addBox(w, 2.59, d, c[0] + (c[2] ? 0 : 0.5), 3.885, c[1] + (c[2] ? 0.5 : 0), MAT.cont[(c[3] + 2) % 6]);
  });

  // concrete barriers
  var barM = stdMat({ map: TEX.concMap, normalMap: TEX.concNrm, roughness: 0.9, metalness: 0, envMapIntensity: 0.5 });
  [[-6, 16, 0], [6, 16, 0], [0, 6, 0], [-9, -14, 1], [6, -9, 1], [18, -6, 0], [-20, -4, 0], [14, 9, 1], [-14, 15, 1], [0, -12, 0], [24, -8, 1], [-5, 27, 0]].forEach(function (b) {
    addBox(b[2] ? 0.55 : 2.6, 1.0, b[2] ? 2.6 : 0.55, b[0], 0.5, b[1], barM);
  });

  // crates & barrels (seeded scatter, rejecting overlaps)
  var crateM = stdMat({ map: TEX.crateMap, normalMap: TEX.crateNrm, roughness: 0.85, metalness: 0, envMapIntensity: 0.4 });
  var barrelMs = [0x8a2f25, 0x2a4d7a, 0x4b5a3a].map(function (c) { return stdMat({ color: c, roughness: 0.5, metalness: 0.7, roughnessMap: TEX.metalRgh, envMapIntensity: 0.8 }); });
  var barrelG = new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14);
  function free(x, z, rad) {
    if (Math.abs(x - SPAWN_POS[0]) < 4 && Math.abs(z - SPAWN_POS[1]) < 4) return false;
    for (var i = 0; i < CAGE_POS.length; i++) if (Math.hypot(x - CAGE_POS[i][0], z - CAGE_POS[i][1]) < rad + 2.6) return false;
    for (var j = 0; j < COLS.length; j++) { var c = COLS[j]; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) return false; }
    return true;
  }
  var placed = 0, tries = 0;
  while (placed < 30 && tries++ < 600) {
    var x = (r() * 2 - 1) * (ARENA - 2), z = (r() * 2 - 1) * (ARENA - 2);
    if (!free(x, z, 1.2)) continue;
    if (placed % 3 === 2) {
      var bm = new THREE.Mesh(barrelG, barrelMs[placed % 3 === 2 ? (placed / 3 | 0) % 3 : 0]); bm.position.set(x, 0.45, z); bm.castShadow = bm.receiveShadow = true; bm.matrixAutoUpdate = false; bm.updateMatrix(); scene.add(bm);
      addCol(x, 0.45, z, 0.56, 0.9, 0.56);
    } else {
      var s = 0.9 + r() * 0.5; addBox(s, s, s, x, s / 2, z, crateM);
      if (r() < 0.35) { var s2 = s * 0.75; addBox(s2, s2, s2, x + (r() - 0.5) * 0.2, s + s2 / 2, z + (r() - 0.5) * 0.2, crateM); }
    }
    placed++;
  }

  // lamp posts
  var poleM = stdMat({ color: 0x2c2f33, roughness: 0.5, metalness: 0.85, roughnessMap: TEX.metalRgh });
  var lampM = new THREE.MeshBasicMaterial({ color: 0xfff1cf });
  [[-16, -20], [16, -22], [-22, 12], [22, 20], [0, 0.5], [-2, 30]].forEach(function (p) {
    if (!free(p[0], p[1], 0.3)) return;
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 6.5, 8), poleM); pole.position.set(p[0], 3.25, p[1]); pole.castShadow = true; scene.add(pole);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.14), poleM); arm.position.set(p[0] + 0.5, 6.5, p[1]); scene.add(arm);
    var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.2), lampM); lamp.position.set(p[0] + 0.85, 6.44, p[1]); scene.add(lamp);
    addCol(p[0], 3.25, p[1], 0.22, 6.5, 0.22);
  });
  CAGE_POS.forEach(function (p) { CIRCLES.push({ x: p[0], z: p[1], r: 1.0 }); });
}

// ray vs world (boxes + ground). o,d = THREE.Vector3 (d normalized). returns {t, nx, ny, nz} or null
function rayWorld(ox, oy, oz, dx, dy, dz, maxT) {
  var best = maxT, bn = 0, hit = false;
  if (dy < -1e-5) { var tg = -oy / dy; if (tg > 0 && tg < best) { best = tg; bn = 2; hit = true; } }
  for (var i = 0; i < COLS.length; i++) {
    var c = COLS[i], t0 = 0, t1 = best, n = 0, a, b, s, inv;
    inv = 1 / dx; a = (c.x0 - ox) * inv; b = (c.x1 - ox) * inv; s = 1; if (a > b) { var q = a; a = b; b = q; s = -1; } if (a > t0) { t0 = a; n = -s * 1; } if (b < t1) t1 = b; if (t0 > t1) continue;
    inv = 1 / dy; a = (c.y0 - oy) * inv; b = (c.y1 - oy) * inv; s = 1; if (a > b) { q = a; a = b; b = q; s = -1; } if (a > t0) { t0 = a; n = -s * 2; } if (b < t1) t1 = b; if (t0 > t1) continue;
    inv = 1 / dz; a = (c.z0 - oz) * inv; b = (c.z1 - oz) * inv; s = 1; if (a > b) { q = a; a = b; b = q; s = -1; } if (a > t0) { t0 = a; n = -s * 3; } if (b < t1) t1 = b; if (t0 > t1) continue;
    if (t0 > 0 && t0 < best) { best = t0; bn = n; hit = true; }
  }
  if (!hit) return null;
  var an = Math.abs(bn), sg = bn < 0 ? -1 : 1;
  return { t: best, nx: an === 1 ? sg : 0, ny: an === 2 ? sg : 0, nz: an === 3 ? sg : 0 };
}
function losClear(ax, ay, az, bx, by, bz) {
  var dx = bx - ax, dy = by - ay, dz = bz - az, l = Math.sqrt(dx * dx + dy * dy + dz * dz); if (l < 0.01) return true;
  return !rayWorld(ax, ay, az, dx / l + 1e-9, dy / l + 1e-9, dz / l + 1e-9, l - 0.05);
}
// move a circle (player) with sliding
function collideMove(pos, nx, nz, rad, feetY) {
  var x = nx, z = pos.z, i, c;
  for (i = 0; i < COLS.length; i++) { c = COLS[i]; if (c.y1 < feetY + 0.35 || c.y0 > feetY + 1.7) continue; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) { x = pos.x < (c.x0 + c.x1) / 2 ? Math.min(x, c.x0 - rad) : Math.max(x, c.x1 + rad); } }
  z = nz;
  for (i = 0; i < COLS.length; i++) { c = COLS[i]; if (c.y1 < feetY + 0.35 || c.y0 > feetY + 1.7) continue; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) { z = pos.z < (c.z0 + c.z1) / 2 ? Math.min(z, c.z0 - rad) : Math.max(z, c.z1 + rad); } }
  for (i = 0; i < CIRCLES.length; i++) { var k = CIRCLES[i], ddx = x - k.x, ddz = z - k.z, dd = Math.hypot(ddx, ddz), mr = k.r + rad; if (dd < mr && dd > 1e-4) { x = k.x + ddx / dd * mr; z = k.z + ddz / dd * mr; } }
  pos.x = clamp(x, -ARENA, ARENA); pos.z = clamp(z, -ARENA, ARENA);
}
function obstacleTop(x, z, rad) {
  var top = 0;
  for (var i = 4; i < COLS.length; i++) { var c = COLS[i]; if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad && c.y1 > top && c.y1 < 6) top = c.y1; }
  return top;
}
