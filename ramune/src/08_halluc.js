// ---- hallucinations living in the 3D room -----------------------------------------
var HAL = { floaters: [], shadows: [], bugs: [], hearts: null, friend: null, friendT: 0, friendLine: 0, t: 0 };

function buildHallucinations() {
  var S = RENDER.scene, i;
  // psychedelic floaters
  var geos = [new THREE.IcosahedronGeometry(0.16, 0), new THREE.TorusKnotGeometry(0.12, 0.035, 64, 8), new THREE.OctahedronGeometry(0.15, 0), new THREE.TorusGeometry(0.14, 0.04, 8, 24), new THREE.DodecahedronGeometry(0.14, 0)];
  for (i = 0; i < 16; i++) {
    var m = new THREE.Mesh(geos[i % geos.length], new THREE.MeshNormalMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    m.userData = { home: new THREE.Vector3(rnd(-2.6, 2.6), rnd(0.6, 2.2), rnd(-2.2, 2.2)), ph: rnd(0, TAU), sp: rnd(0.3, 0.9), rs: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) };
    m.visible = false; S.add(m); HAL.floaters.push(m);
  }
  // hearts (emp)
  var hc = mkCanvas(64, 64), g = hc.getContext('2d');
  g.fillStyle = '#ff7ab8'; g.shadowColor = '#ff7ab8'; g.shadowBlur = 10; drawShape(g, 'heart', 32, 32, 22); g.fill();
  var hg = new THREE.BufferGeometry(), hp = [];
  for (i = 0; i < 70; i++) hp.push(rnd(-2.8, 2.8), rnd(0, 2.4), rnd(-2.4, 2.4));
  hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
  HAL.hearts = new THREE.Points(hg, new THREE.PointsMaterial({ size: 0.12, map: toTex(hc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  HAL.hearts.visible = false; S.add(HAL.hearts);
  // shadow people
  var dark = new THREE.MeshBasicMaterial({ color: 0x020203, transparent: true, opacity: 0 });
  for (i = 0; i < 3; i++) {
    var f = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 10), dark.clone()); body.position.y = 0.75; f.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), body.material); head.position.y = 1.65; f.add(head);
    var hat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16), body.material); hat.position.y = 1.76; f.add(hat);
    var hat2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.16, 16), body.material); hat2.position.y = 1.85; f.add(hat2);
    var eyeM = new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff3b3b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    [-0.05, 0.05].forEach(function (x) { var e = new THREE.Sprite(eyeM); e.scale.set(0.06, 0.06, 1); e.position.set(x, 1.67, 0.13); f.add(e); });
    f.userData = { mat: body.material, eye: eyeM, a: 0, life: 0, cd: rnd(2, 8) };
    f.visible = false; S.add(f); HAL.shadows.push(f);
  }
  // bugs on walls
  for (i = 0; i < 14; i++) {
    var b = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ map: TEX.bug, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    b.userData = { wall: i % 4, u: rnd(-2.2, 2.2), v: rnd(0.3, 2.2), dir: rnd(0, TAU), sp: rnd(0.05, 0.25) };
    b.visible = false; S.add(b); HAL.bugs.push(b);
  }
  // imaginary friend on the sofa
  var fr = new THREE.Group(), fm = new THREE.MeshStandardMaterial({ color: 0x8890ff, emissive: 0x2a2f80, transparent: true, opacity: 0, depthWrite: false, roughness: 0.8 });
  var ft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.55, 12), fm); ft.position.y = 0.72; fr.add(ft);
  var fh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), fm); fh.position.y = 1.12; fr.add(fh);
  var fl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.32), fm); fl.position.set(-0.2, 0.47, 0); fr.add(fl);
  fr.position.set(1.12, 0, 0.35); fr.rotation.y = -PI / 2; fr.userData = { mat: fm, a: 0 }; fr.visible = false; S.add(fr); HAL.friend = fr;
}

var FRIEND_LINES = ['よっ。来ちゃった。', 'ねえ、ZER9もう1本もらっていい？', 'このテレビ、さっきから同じ人しか出てなくない？', 'タバコある？…ないか。', 'あれ、俺いつからここにいたっけ。', 'お前の部屋、天井ひくいな。', '…（なにか話しているが聞き取れない）', 'ラムネって、こんなに種類あったっけ'];

function updateHallucinations(dt, B, cam) {
  HAL.t += dt;
  var V = B.vis, t = HAL.t, i;
  var calm = SAVE.settings.calm ? 0.5 : 1;
  var fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  var cp = cam.getWorldPosition(new THREE.Vector3());
  // floaters
  var fa = clamp((V.psy - 0.35) * 0.9, 0, 0.85) * calm;
  HAL.floaters.forEach(function (m, k) {
    m.visible = fa > 0.01;
    if (!m.visible) return;
    var u = m.userData;
    if (u.home.distanceTo(cp) > 4.2) { var ar = areaAt(cp.x, cp.z); u.home.set(rnd(ar.x0 + 0.3, ar.x1 - 0.3), rnd(0.6, 2.2), rnd(ar.z0 + 0.3, ar.z1 - 0.3)); }
    m.material.opacity = fa;
    m.position.set(u.home.x + Math.sin(t * u.sp + u.ph) * 0.5, u.home.y + Math.sin(t * u.sp * 1.3 + u.ph) * 0.25, u.home.z + Math.cos(t * u.sp * 0.8 + u.ph) * 0.5);
    m.rotation.x += u.rs.x * dt; m.rotation.y += u.rs.y * dt; m.rotation.z += u.rs.z * dt;
    m.scale.setScalar(0.6 + Math.min(1.5, V.psy) * 0.6 + Math.sin(t * 2 + k) * 0.1);
    var dc = m.position.distanceTo(cp); if (dc < 1.3) m.material.opacity = fa * clamp((dc - 0.6) / 0.7, 0, 1);
  });
  // hearts
  var ha = clamp(V.emp - 0.3, 0, 1) * 0.9;
  HAL.hearts.visible = ha > 0.01;
  var har = areaAt(cp.x, cp.z); HAL.hearts.position.set((har.x0 + har.x1) / 2, 0, (har.z0 + har.z1) / 2);
  if (HAL.hearts.visible) {
    HAL.hearts.material.opacity = ha;
    var p = HAL.hearts.geometry.attributes.position;
    for (i = 0; i < p.count; i++) { var y = p.getY(i) + dt * (0.15 + (i % 5) * 0.04); if (y > 2.45) y = 0.05; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t + i) * dt * 0.05); }
    p.needsUpdate = true;
  }
  // shadow people
  var da = clamp(V.del - 0.3, 0, 1.2);
  HAL.shadows.forEach(function (f, k) {
    var u = f.userData;
    if (da <= 0.01) { f.visible = false; u.a = 0; return; }
    u.cd -= dt;
    if (!f.visible) {
      if (u.cd <= 0 && Math.random() < 0.5 * da) {
        // spawn in peripheral vision
        var side = Math.random() < 0.5 ? -1 : 1, ang = Math.atan2(fwd.x, fwd.z) + side * rnd(0.9, 1.6), d = rnd(2.0, 3.6);
        var sar = areaAt(cp.x, cp.z); var x = clamp(cp.x + Math.sin(ang) * d, sar.x0 + 0.3, sar.x1 - 0.3), z = clamp(cp.z + Math.cos(ang) * d, sar.z0 + 0.3, sar.z1 - 0.3);
        f.position.set(x, 0, z); f.lookAt(cp.x, 0, cp.z);
        f.visible = true; u.a = 0; u.life = rnd(4, 10);
      }
      return;
    }
    u.life -= dt;
    var to = new THREE.Vector3(f.position.x - cp.x, 0, f.position.z - cp.z); var dist = to.length(); to.normalize();
    var dot = fwd.x * to.x + fwd.z * to.z;
    var target = (dot > 0.93 || dist < 1.1 || u.life <= 0) ? 0 : clamp(da, 0, 1) * 0.92;
    u.a = damp(u.a, target, target > u.a ? 0.8 : 6, dt);
    u.mat.opacity = u.a; u.eye.opacity = u.a * (0.6 + 0.4 * Math.sin(t * 9 + k));
    f.lookAt(cp.x, 0, cp.z);
    if (u.a < 0.02 && (dot > 0.93 || u.life <= 0 || dist < 1.1)) { f.visible = false; u.cd = rnd(3, 10); if (dot > 0.93 && Math.random() < 0.5) sfx('whisper', 0); }
  });
  // bugs
  var ba = clamp(V.del - 0.5, 0, 1) * calm;
  HAL.bugs.forEach(function (b) {
    b.visible = ba > 0.01; if (!b.visible) return;
    var u = b.userData;
    u.dir += rnd(-2, 2) * dt; u.u += Math.cos(u.dir) * u.sp * dt; u.v += Math.sin(u.dir) * u.sp * dt;
    if (u.v < 0.1 || u.v > 2.4) u.dir = -u.dir; u.v = clamp(u.v, 0.1, 2.4);
    var lim = u.wall < 2 ? 2.8 : 2.3; if (Math.abs(u.u) > lim) u.dir = PI - u.dir; u.u = clamp(u.u, -lim, lim);
    if (u.wall === 0) { b.position.set(-2.985, u.v, u.u); b.rotation.set(0, PI / 2, u.dir); }
    else if (u.wall === 1) { b.position.set(2.985, u.v, u.u); b.rotation.set(0, -PI / 2, u.dir); }
    else if (u.wall === 2) { b.position.set(u.u * 1.15, u.v, 2.485); b.rotation.set(0, PI, u.dir); }
    else { b.position.set(u.u * 0.5 + 1.8, 2.49, u.v * 0.8 - 1); b.rotation.set(PI / 2, 0, u.dir); }
    b.material.opacity = ba;
  });
  // imaginary friend
  var f = HAL.friend, fu = f.userData;
  var want = V.del > 0.75 && Math.hypot(cp.x - 1.12, cp.z - 0.35) > 1.2;
  fu.a = damp(fu.a, want ? 0.55 : 0, want ? 0.5 : 4, dt);
  f.visible = fu.a > 0.02; fu.mat.opacity = fu.a;
  if (f.visible) {
    f.children[1].rotation.y = Math.sin(t * 0.7) * 0.4;
    HAL.friendT -= dt;
    if (HAL.friendT <= 0 && fu.a > 0.3) { HAL.friendT = rnd(9, 16); say('？？？「' + FRIEND_LINES[HAL.friendLine++ % FRIEND_LINES.length] + '」', 4.5, 'friend'); }
  }
}
