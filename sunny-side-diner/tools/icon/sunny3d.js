// runs inside the game (via __ssdEval). V = 'cute' | 'creepy'
(function (V) {
  if (window.__SUN) { RENDER.scene.remove(window.__SUN.g); }
  var T = THREE, P = Math.PI;
  function faceCanvas(creepy) {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 512; var g = c.getContext('2d');
    var gr = g.createRadialGradient(256, 200, 20, 256, 256, 420); gr.addColorStop(0, '#ffcf3a'); gr.addColorStop(0.6, '#ffa514'); gr.addColorStop(1, '#e87a0a'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
    // blush
    g.fillStyle = 'rgba(255,110,120,0.55)'; [146, 366].forEach(function (x) { g.beginPath(); g.ellipse(x, 300, 34, 18, 0, 0, 2 * P); g.fill(); });
    // eyes
    [196, 316].forEach(function (x) {
      g.fillStyle = creepy ? '#0a0406' : '#fffdf6'; g.beginPath(); g.ellipse(x, 222, 30, 40, 0, 0, 2 * P); g.fill();
      g.lineWidth = 6; g.strokeStyle = '#2a1608'; g.stroke();
      if (!creepy) { g.fillStyle = '#2a1608'; g.beginPath(); g.ellipse(x + 3, 230, 18, 24, 0, 0, 2 * P); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 9, 220, 7, 0, 2 * P); g.fill(); }
      else { g.fillStyle = '#ff2020'; g.beginPath(); g.arc(x, 232, 7, 0, 2 * P); g.fill(); }
    });
    // smile
    g.fillStyle = '#7a1a10'; g.strokeStyle = '#2a1608'; g.lineWidth = 6; g.beginPath(); g.moveTo(186, 292); g.quadraticCurveTo(256, 300, 326, 292); g.quadraticCurveTo(300, 362, 256, 364); g.quadraticCurveTo(212, 362, 186, 292); g.fill(); g.stroke();
    g.fillStyle = '#ff8fa0'; g.beginPath(); g.ellipse(256, 348, 26, 13, 0, 0, 2 * P); g.fill();
    if (creepy) { g.fillStyle = '#8a0810'; g.beginPath(); g.moveTo(262, 360); g.quadraticCurveTo(260, 420, 268, 470); g.quadraticCurveTo(278, 476, 276, 440); g.quadraticCurveTo(272, 400, 274, 360); g.fill(); }
    return c;
  }
  function emisCanvas() { var c = document.createElement('canvas'); c.width = 1024; c.height = 512; var g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#ff3030'; [196, 316].forEach(function (x) { g.beginPath(); g.arc(x, 232, 9, 0, 2 * P); g.fill(); }); return c; }
  var creepy = V === 'creepy';
  var S = new T.Group();
  var ink = new T.MeshStandardMaterial({ color: 0x2a1608, roughness: 0.55 });
  var glove = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.45, clearcoat: 0.3 });
  // egg white: a thick, wobbly, glossy blob
  var sh = new T.Shape(), rr = makeRNG(5), n = 14, pts = [];
  for (var i = 0; i < n; i++) { var a = i / n * 2 * P, r = 0.36 * (0.95 + rr() * 0.18) * (1 + 0.12 * Math.cos(a * 2)); pts.push([Math.cos(a) * r * 1.08, Math.sin(a) * r * 0.86]); }
  for (var k = 0; k <= n; k++) { var p0 = pts[k % n], p1 = pts[(k + 1) % n], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2; if (k === 0) sh.moveTo(mx, my); else sh.quadraticCurveTo(p0[0], p0[1], mx, my); }
  var wg = new T.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 8, curveSegments: 16 }); wg.center(); wg.computeVertexNormals();
  var white = new T.Mesh(wg, new T.MeshPhysicalMaterial({ color: 0xd8cfbf, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.2 }));
  white.position.y = 0.6; S.add(white);
  // yolk with the face
  var fm = new T.MeshPhysicalMaterial({ map: new T.CanvasTexture(faceCanvas(creepy)), roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 });
  fm.map.encoding = T.sRGBEncoding; fm.map.anisotropy = 8;
  if (creepy) { fm.emissiveMap = new T.CanvasTexture(emisCanvas()); fm.emissive = new T.Color(6, 1, 1); }
  var yolk = new T.Mesh(new T.SphereGeometry(0.175, 72, 48), fm); yolk.scale.z = 0.78; yolk.position.set(0, 0.6, 0.065); S.add(yolk);
  // chef toque
  var tq = new T.Group(), tm = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  var band = new T.Mesh(new T.CylinderGeometry(0.07, 0.075, 0.07, 40), tm); tq.add(band);
  [[0, 0.075, 0, 0.06], [-0.05, 0.065, 0.01, 0.045], [0.05, 0.065, 0.01, 0.045], [0, 0.07, -0.04, 0.045], [0, 0.07, 0.045, 0.045]].forEach(function (q) { var m = new T.Mesh(new T.SphereGeometry(q[3], 24, 16), tm); m.position.set(q[0], q[1], q[2]); tq.add(m); });
  tq.position.set(0.03, 0.765, 0.06); tq.rotation.z = -0.25; tq.rotation.x = 0.15; S.add(tq);
  // arms + gloves
  function limb(ptsA, rad) { var cu = new T.CatmullRomCurve3(ptsA.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })); return new T.Mesh(new T.TubeGeometry(cu, 40, rad, 10, false), ink); }
  S.add(limb([[-0.36, 0.56, 0.02], [-0.47, 0.5, 0.06], [-0.53, 0.38, 0.1]], 0.012));
  S.add(limb([[0.36, 0.6, 0.02], [0.47, 0.68, 0.06], [0.5, 0.84, 0.08]], 0.012));
  function hand(x, y, z, wave) { var h = new T.Group(); var m = new T.Mesh(new T.SphereGeometry(0.05, 28, 20), glove); m.scale.set(1, 1.05, 0.8); h.add(m); var th = new T.Mesh(new T.SphereGeometry(0.02, 16, 12), glove); th.position.set(wave ? -0.045 : 0.045, 0.01, 0.01); h.add(th); var cuff = new T.Mesh(new T.TorusGeometry(0.038, 0.012, 10, 24), glove); cuff.rotation.x = P / 2; cuff.position.y = wave ? -0.045 : 0.045; h.add(cuff); h.position.set(x, y, z); return h; }
  S.add(hand(-0.54, 0.34, 0.1, false)); S.add(hand(0.5, 0.88, 0.09, true));
  // legs + sneakers
  S.add(limb([[-0.09, 0.3, 0], [-0.11, 0.17, 0.01], [-0.12, 0.07, 0.02]], 0.014));
  S.add(limb([[0.09, 0.3, 0], [0.11, 0.17, 0.01], [0.12, 0.07, 0.02]], 0.014));
  var shoe = new T.MeshPhysicalMaterial({ color: 0xc8282e, roughness: 0.35, clearcoat: 0.6 }), sole = new T.MeshStandardMaterial({ color: 0xf4f0e6, roughness: 0.6 });
  [-0.13, 0.13].forEach(function (x) { var s1 = new T.Mesh(new T.SphereGeometry(0.06, 28, 18), shoe); s1.scale.set(0.95, 0.6, 1.35); s1.position.set(x, 0.05, 0.04); S.add(s1); var s2 = new T.Mesh(new T.CylinderGeometry(0.058, 0.06, 0.02, 28), sole); s2.scale.z = 1.4; s2.position.set(x, 0.012, 0.04); S.add(s2); });
  S.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // place in the parking lot, between the camera and the glowing diner
  GAME.mode = 'cut'; var cam = new T.Vector3(-1.6, 0.66, 17.2), diner = new T.Vector3(-3.2, 1.6, 5);
  var dir = diner.clone().sub(cam).setY(0).normalize();
  var at = cam.clone().addScaledVector(dir, 1.75); at.y = 0;
  S.position.copy(at); S.scale.setScalar(1.0); S.lookAt(cam.x, 0, cam.z); S.rotateY(0.18);
  RENDER.scene.add(S);
  // studio-ish lights so Sunny reads against the night
  var key = new T.SpotLight(0xffe2b8, 2.2, 8, 0.6, 0.6, 2); key.position.copy(at).add(new T.Vector3(1.2, 1.9, 1.0).applyAxisAngle(new T.Vector3(0, 1, 0), Math.atan2(dir.x, dir.z) + P)); key.target.position.set(at.x, 0.55, at.z); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  var rim = new T.PointLight(0x5be8ff, 1.2, 3, 2); rim.position.set(at.x - dir.x * 0.9 - 0.6, 1.1, at.z - dir.z * 0.9);
  var rim2 = new T.PointLight(0xff4fa3, 1.4, 3, 2); rim2.position.set(at.x - dir.x * 0.7 + 0.8, 0.9, at.z - dir.z * 0.7);
  var fill = new T.PointLight(0xffb070, 0.35, 3, 2); fill.position.copy(cam).add(new T.Vector3(0, 0.4, 0));
  [key, key.target, rim, rim2, fill].forEach(function (l) { RENDER.scene.add(l); });
  window.__SUN = { g: S };
  var tgt = new T.Vector3(at.x, 0.62, at.z);
  CAM.override = { pos: cam, target: tgt, k: 1, dur: 0.01 };
  CAM.focusLock = cam.distanceTo(tgt); PU.uFocus.value = CAM.focusLock; PU.uDof.value = 0.3; PU.uFocusRange.value = 0.6; PU.uBloom.value = 0.6; PU.uExposure.value = 0.9;
  FX.rainT = 0.25; LSTATE.coldT = creepy ? 0.6 : 0.15;
  if (creepy) { LSTATE.neonBuzz = true; setNeonEyes(1, 'red'); LSTATE.eyesExtra = 1.6; }
  return 1;
})
