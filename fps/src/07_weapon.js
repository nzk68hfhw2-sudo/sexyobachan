// ---- rifle viewmodel, firing, recoil, particles, decals ---------------------
var gun = {}, FX = {};
var WEAPON = { mag: 30, rate: 0.098, dmg: 34, reloadTime: 1.7 };
var _v1, _v2, _v3, _q1;

function cylBetween(a, b, r, mat, parent) {
  var d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, d.length(), 10), mat);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(m); return m;
}
function buildWeapon() {
  _v1 = new THREE.Vector3(); _v2 = new THREE.Vector3(); _v3 = new THREE.Vector3(); _q1 = new THREE.Quaternion();
  var metal = stdMat({ color: 0x131416, roughness: 0.42, metalness: 0.92, roughnessMap: TEX.metalRgh, envMapIntensity: 1.1 });
  var poly = stdMat({ color: 0x15171a, roughness: 0.72, metalness: 0.05, envMapIntensity: 0.5 });
  var tan = stdMat({ color: 0x2f2a22, roughness: 0.75, metalness: 0.05, envMapIntensity: 0.5 });
  var glove = stdMat({ color: 0x121311, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 });
  var sleeve = stdMat({ color: 0x2a3024, roughness: 1, metalness: 0, envMapIntensity: 0.3 });
  var root = gun.root = new THREE.Group(), k = gun.kick = new THREE.Group(); root.add(k);
  function box(w, h, d, x, y, z, m, rx) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (rx) b.rotation.x = rx; k.add(b); return b; }
  function cyl(r, l, x, y, z, m, seg) { var c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg || 12), m); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); k.add(c); return c; }
  box(0.052, 0.085, 0.3, 0, 0, -0.04, metal);                    // receiver
  box(0.046, 0.03, 0.34, 0, 0.055, -0.1, metal);                 // top rail
  box(0.056, 0.062, 0.27, 0, 0.004, -0.325, tan);                // handguard
  cyl(0.011, 0.24, 0, 0.012, -0.56, metal);                      // barrel
  cyl(0.018, 0.07, 0, 0.012, -0.665, metal, 8);                  // muzzle brake
  box(0.044, 0.07, 0.24, 0, -0.012, 0.23, tan);                  // stock
  box(0.048, 0.1, 0.03, 0, -0.03, 0.355, poly);                  // butt pad
  box(0.04, 0.11, 0.05, 0, -0.09, 0.085, poly, 0.3);             // grip
  gun.magMesh = box(0.036, 0.17, 0.062, 0, -0.115, -0.07, metal, -0.16);
  box(0.012, 0.04, 0.012, 0, 0.085, -0.43, metal);               // front sight
  box(0.05, 0.05, 0.008, 0, 0.097, -0.03, metal); box(0.05, 0.008, 0.07, 0, 0.122, -0.03, metal);   // optic frame
  box(0.008, 0.05, 0.07, 0.025, 0.097, -0.03, metal); box(0.008, 0.05, 0.07, -0.025, 0.097, -0.03, metal);
  var dot = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 8), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); dot.position.set(0, 0.097, -0.034); k.add(dot);
  var lens = new THREE.Mesh(new THREE.PlaneGeometry(0.042, 0.042), new THREE.MeshStandardMaterial({ color: 0x224455, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.22 })); lens.position.set(0, 0.097, -0.035); k.add(lens);
  // hands + forearms
  var lh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glove); lh.scale.set(1.1, 0.8, 1.5); lh.position.set(-0.012, -0.045, -0.33); k.add(lh);
  cylBetween(new THREE.Vector3(-0.03, -0.06, -0.3), new THREE.Vector3(-0.3, -0.3, 0.1), 0.042, sleeve, k);
  var rh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), glove); rh.scale.set(1.0, 1.3, 1.0); rh.position.set(0.006, -0.085, 0.09); k.add(rh);
  cylBetween(new THREE.Vector3(0.02, -0.12, 0.1), new THREE.Vector3(0.16, -0.32, 0.42), 0.045, sleeve, k);
  gun.muzzle = new THREE.Object3D(); gun.muzzle.position.set(0, 0.012, -0.72); k.add(gun.muzzle);
  gun.eject = new THREE.Object3D(); gun.eject.position.set(0.04, 0.03, -0.02); k.add(gun.eject);
  // muzzle flash
  var fm = new THREE.MeshBasicMaterial({ map: TEX.flash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  gun.flash = new THREE.Group(); gun.flash.position.copy(gun.muzzle.position);
  var f1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), fm); gun.flash.add(f1);
  var f2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), fm); f2.rotation.y = Math.PI / 2; f2.position.z = -0.1; gun.flash.add(f2);
  var f3 = f2.clone(); f3.rotation.set(Math.PI / 2, 0, Math.PI / 2); gun.flash.add(f3);
  gun.flash.visible = false; k.add(gun.flash);
  root.scale.setScalar(0.3); root.traverse(function (o) { if (o.isMesh) { o.frustumCulled = false; } });
  camera.add(root);
  gun.light = new THREE.PointLight(0xffb060, 0, 14, 2); gun.light.position.set(0.1, -0.05, -0.6); camera.add(gun.light);
  gun.base = new THREE.Vector3(0.068, -0.062, -0.155);
  gun.ammo = WEAPON.mag; gun.cool = 0; gun.reloadT = 0; gun.kz = 0; gun.kr = 0; gun.bloom = 0; gun.flashT = 0; gun.swayX = 0; gun.swayY = 0; gun.bob = 0;
  gun.recP = 0; gun.recPV = 0; gun.recY = 0; gun.recYV = 0;

  // ---- effect pools
  var N = FX.N = 260; FX.pos = new Float32Array(N * 3); FX.vel = new Float32Array(N * 3); FX.life = new Float32Array(N); FX.next = 0;
  for (var i = 0; i < N; i++) FX.pos[i * 3 + 1] = -999;
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(FX.pos, 3));
  FX.points = new THREE.Points(pg, new THREE.PointsMaterial({ map: TEX.glow, size: 0.16, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffc070, sizeAttenuation: true }));
  FX.points.frustumCulled = false; scene.add(FX.points);
  FX.smokes = []; for (i = 0; i < 26; i++) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, transparent: true, opacity: 0, depthWrite: false, color: 0x8a8078 })); s.visible = false; scene.add(s); FX.smokes.push({ s: s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grow: 1 }); }
  FX.smokeI = 0;
  FX.flashes = []; for (i = 0; i < 6; i++) { var fs = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fs.visible = false; scene.add(fs); FX.flashes.push({ s: fs, life: 0, max: 1, size: 1 }); }
  FX.flashI = 0;
  var dg = new THREE.PlaneGeometry(0.16, 0.16), dm = new THREE.MeshBasicMaterial({ map: TEX.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  FX.decals = []; for (i = 0; i < 40; i++) { var d = new THREE.Mesh(dg, dm); d.visible = false; scene.add(d); FX.decals.push(d); } FX.decalI = 0;
  var tg = new THREE.BoxGeometry(0.018, 0.018, 1); tg.translate(0, 0, 0.5);
  FX.tracers = []; for (i = 0; i < 8; i++) { var t = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); t.visible = false; t.frustumCulled = false; scene.add(t); FX.tracers.push({ m: t, life: 0 }); } FX.tracerI = 0;
  var brass = stdMat({ color: 0xc9a24a, roughness: 0.3, metalness: 1 }), sg = new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), debM = stdMat({ color: 0x25272b, roughness: 0.5, metalness: 0.8 }), debG = new THREE.BoxGeometry(0.16, 0.06, 0.12);
  FX.bodies = []; for (i = 0; i < 26; i++) { var isShell = i < 10, b = new THREE.Mesh(isShell ? sg : debG, isShell ? brass : debM); b.visible = false; b.castShadow = !isShell; scene.add(b); FX.bodies.push({ m: b, shell: isShell, life: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0 }); }
  FX.shellI = 0; FX.debI = 10;
  FX.boomLight = new THREE.PointLight(0xff9040, 0, 26, 2); scene.add(FX.boomLight); FX.boomT = 0;
}
function fxSparks(x, y, z, nx, ny, nz, n, speed) {
  if (Q.tier === 0) n = Math.ceil(n * 0.5);
  for (var i = 0; i < n; i++) {
    var k = FX.next; FX.next = (FX.next + 1) % FX.N;
    FX.pos[k * 3] = x; FX.pos[k * 3 + 1] = y; FX.pos[k * 3 + 2] = z;
    FX.vel[k * 3] = (nx * 0.7 + (Math.random() - 0.5) * 1.3) * speed * Math.random(); FX.vel[k * 3 + 1] = (ny * 0.7 + (Math.random() - 0.3) * 1.3) * speed * Math.random(); FX.vel[k * 3 + 2] = (nz * 0.7 + (Math.random() - 0.5) * 1.3) * speed * Math.random();
    FX.life[k] = 0.15 + Math.random() * 0.45;
  }
}
function fxSmoke(x, y, z, size, life, color, vy) {
  var s = FX.smokes[FX.smokeI]; FX.smokeI = (FX.smokeI + 1) % FX.smokes.length;
  s.s.position.set(x, y, z); s.s.scale.setScalar(size); s.s.material.color.set(color || 0x8a8078); s.s.material.rotation = Math.random() * 6; s.s.visible = true;
  s.life = s.max = life; s.vx = (Math.random() - 0.5) * 0.5; s.vz = (Math.random() - 0.5) * 0.5; s.vy = vy == null ? 0.6 : vy; s.grow = size * 1.4;
}
function fxFlash(x, y, z, size, life, color) {
  var f = FX.flashes[FX.flashI]; FX.flashI = (FX.flashI + 1) % FX.flashes.length;
  f.s.position.set(x, y, z); f.s.material.color.set(color || 0xffffff); f.s.visible = true; f.life = f.max = life; f.size = size;
}
function fxDecal(x, y, z, nx, ny, nz) {
  var d = FX.decals[FX.decalI]; FX.decalI = (FX.decalI + 1) % FX.decals.length;
  d.position.set(x + nx * 0.006, y + ny * 0.006, z + nz * 0.006); _v1.set(x + nx, y + ny, z + nz); d.lookAt(_v1); d.rotateZ(Math.random() * 6); d.scale.setScalar(0.7 + Math.random() * 0.6); d.visible = true;
}
function fxTracer(a, b) {
  var t = FX.tracers[FX.tracerI]; FX.tracerI = (FX.tracerI + 1) % FX.tracers.length;
  t.m.position.copy(a); t.m.lookAt(b); t.m.scale.z = a.distanceTo(b); t.m.visible = true; t.life = 0.06; t.m.material.opacity = 0.7;
}
function fxBody(shell, x, y, z, vx, vy, vz) {
  var i = shell ? FX.shellI : FX.debI, b = FX.bodies[i];
  if (shell) FX.shellI = (i + 1) % 10; else FX.debI = 10 + ((i - 10 + 1) % 16);
  b.m.position.set(x, y, z); b.m.visible = true; b.life = shell ? 2.5 : 4; b.vx = vx; b.vy = vy; b.vz = vz; b.rx = rnd(-14, 14); b.rz = rnd(-14, 14);
  if (!shell) b.m.scale.set(rnd(0.5, 1.6), rnd(0.6, 1.4), rnd(0.5, 1.6));
}
function fxExplosion(x, y, z, big) {
  fxFlash(x, y, z, big ? 7 : 4.5, 0.22, 0xffd9a0); fxSparks(x, y, z, 0, 0.5, 0, big ? 46 : 30, 11);
  for (var i = 0; i < (Q.tier === 0 ? 2 : 5); i++) fxSmoke(x + rnd(-0.4, 0.4), y + rnd(-0.2, 0.4), z + rnd(-0.4, 0.4), rnd(1, 1.8), rnd(0.9, 1.6), i % 2 ? 0x3a3632 : 0x6a625a, 1.1);
  for (i = 0; i < 5; i++) fxBody(false, x, y, z, rnd(-4, 4), rnd(1, 6), rnd(-4, 4));
  FX.boomLight.position.set(x, y, z); FX.boomT = 0.25;
}
function updateFX(dt) {
  var i, p = FX.pos, v = FX.vel;
  for (i = 0; i < FX.N; i++) {
    if (FX.life[i] <= 0) continue;
    FX.life[i] -= dt; if (FX.life[i] <= 0) { p[i * 3 + 1] = -999; continue; }
    v[i * 3 + 1] -= 13 * dt; p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
    if (p[i * 3 + 1] < 0.02) { p[i * 3 + 1] = 0.02; v[i * 3 + 1] *= -0.35; v[i * 3] *= 0.6; v[i * 3 + 2] *= 0.6; }
  }
  FX.points.geometry.attributes.position.needsUpdate = true;
  for (i = 0; i < FX.smokes.length; i++) { var s = FX.smokes[i]; if (s.life <= 0) continue; s.life -= dt; if (s.life <= 0) { s.s.visible = false; continue; }
    var k = s.life / s.max; s.s.material.opacity = Math.min(1, k * 1.6) * 0.55; s.s.position.x += s.vx * dt; s.s.position.y += s.vy * dt; s.s.position.z += s.vz * dt; s.s.scale.addScalar(s.grow * dt / s.max); }
  for (i = 0; i < FX.flashes.length; i++) { var f = FX.flashes[i]; if (f.life <= 0) continue; f.life -= dt; if (f.life <= 0) { f.s.visible = false; continue; }
    var kk = f.life / f.max; f.s.material.opacity = kk; f.s.scale.setScalar(f.size * (1.3 - kk * 0.6)); }
  for (i = 0; i < FX.tracers.length; i++) { var t = FX.tracers[i]; if (t.life <= 0) continue; t.life -= dt; if (t.life <= 0) t.m.visible = false; else t.m.material.opacity = t.life / 0.06 * 0.7; }
  for (i = 0; i < FX.bodies.length; i++) { var b = FX.bodies[i]; if (b.life <= 0) continue; b.life -= dt; if (b.life <= 0) { b.m.visible = false; continue; }
    b.vy -= 12 * dt; var m = b.m; m.position.x += b.vx * dt; m.position.y += b.vy * dt; m.position.z += b.vz * dt; m.rotation.x += b.rx * dt; m.rotation.z += b.rz * dt;
    var fl = b.shell ? 0.012 : 0.04; if (m.position.y < fl) { m.position.y = fl; if (b.vy < -1.2) { b.vy *= -0.4; b.vx *= 0.6; b.vz *= 0.6; b.rx *= 0.5; b.rz *= 0.5; } else { b.vy = 0; b.vx *= 0.8; b.vz *= 0.8; b.rx = b.rz = 0; } } }
  if (FX.boomT > 0) { FX.boomT -= dt; FX.boomLight.intensity = Math.max(0, FX.boomT / 0.25) * 6; }
}

function startReload() {
  if (gun.reloadT > 0 || gun.ammo >= WEAPON.mag) return;
  gun.reloadT = WEAPON.reloadTime; SFX.reload();
}
function shoot() {
  gun.ammo--; gun.cool = WEAPON.rate; G.stats.shots++;
  var sp = 0.004 + gun.bloom + (P.speed > 5 ? 0.012 : P.speed > 1 ? 0.005 : 0);
  camera.getWorldDirection(_v1); camera.getWorldPosition(_v2);
  // random cone
  _v3.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(sp); _v1.add(_v3).normalize();
  if (Math.abs(_v1.x) < 1e-6) _v1.x = 1e-6; if (Math.abs(_v1.y) < 1e-6) _v1.y = 1e-6; if (Math.abs(_v1.z) < 1e-6) _v1.z = 1e-6;
  var w = rayWorld(_v2.x, _v2.y, _v2.z, _v1.x, _v1.y, _v1.z, 200), maxT = w ? w.t : 200;
  var eh = rayEnemies(_v2, _v1, maxT), endT = eh ? eh.t : maxT;
  var hx = _v2.x + _v1.x * endT, hy = _v2.y + _v1.y * endT, hz = _v2.z + _v1.z * endT;
  if (eh) {
    G.stats.hits++; damageEnemy(eh.e, WEAPON.dmg * (eh.crit ? 2.2 : 1), eh.crit, hx, hy, hz);
    fxSparks(hx, hy, hz, -_v1.x, 0.4, -_v1.z, eh.crit ? 12 : 7, 6);
  } else if (w) {
    fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, 6, 4.5); fxDecal(hx, hy, hz, w.nx, w.ny, w.nz);
    if (Q.tier > 0 || Math.random() < 0.4) fxSmoke(hx + w.nx * 0.1, hy + w.ny * 0.1, hz + w.nz * 0.1, 0.25, 0.5, 0x9a9085, 0.4);
    SFX.impact(0, clamp(1 - endT / 40, 0.1, 1));
  }
  gun.muzzle.getWorldPosition(_v3); _v1.set(hx, hy, hz);
  if (endT > 2.5) fxTracer(_v3, _v1);
  // recoil + flash + casing
  gun.recPV += 0.5 + Math.random() * 0.12; gun.recYV += rnd(-0.22, 0.22);
  gun.kz = Math.min(0.09, gun.kz + 0.05); gun.kr = Math.min(0.12, gun.kr + 0.045); gun.bloom = Math.min(0.028, gun.bloom + 0.0045);
  gun.flashT = 0.045; gun.flash.visible = true; gun.flash.rotation.z = Math.random() * 6; gun.flash.scale.setScalar(rnd(0.75, 1.25)); gun.light.intensity = 5;
  gun.eject.getWorldPosition(_v3); camera.getWorldQuaternion(_q1); _v1.set(rnd(1.6, 2.6), rnd(1.4, 2.4), rnd(-0.3, 0.6)).applyQuaternion(_q1);
  fxBody(true, _v3.x, _v3.y, _v3.z, _v1.x + P.vx, _v1.y, _v1.z + P.vz);
  SFX.shot(); SFX.shell(); G.shake = Math.min(1, G.shake + 0.22);
}
function updateWeapon(dt) {
  gun.cool -= dt;
  if (input.reload) { input.reload = false; if (G.state === 'playing') startReload(); }
  if (gun.reloadT > 0) {
    gun.reloadT -= dt;
    if (gun.reloadT <= 0) { gun.ammo = WEAPON.mag; gun.reloadT = 0; }
  } else if (input.fire && gun.cool <= 0 && G.state === 'playing' && P.hp > 0) {
    if (gun.ammo > 0) shoot(); else { SFX.empty(); gun.cool = 0.3; startReload(); }
  }
  if (gun.ammo === 0 && gun.reloadT <= 0 && !input.fire) startReload();
  // recoil springs
  gun.recP += gun.recPV * dt; gun.recY += gun.recYV * dt;
  gun.recPV = damp(gun.recPV, 0, 20, dt); gun.recYV = damp(gun.recYV, 0, 20, dt);
  gun.recP = damp(gun.recP, 0, input.fire ? 2.5 : 7, dt); gun.recY = damp(gun.recY, 0, 5, dt);
  gun.recP = Math.min(gun.recP, 0.16);
  gun.kz = damp(gun.kz, 0, 16, dt); gun.kr = damp(gun.kr, 0, 14, dt); gun.bloom = damp(gun.bloom, 0, 4.5, dt);
  if (gun.flashT > 0) { gun.flashT -= dt; if (gun.flashT <= 0) { gun.flash.visible = false; gun.light.intensity = 0; } }
  // sway / bob / reload pose
  gun.swayX = damp(gun.swayX, clamp(-P.lookDX * 1.6, -0.06, 0.06), 9, dt); gun.swayY = damp(gun.swayY, clamp(-P.lookDY * 1.6, -0.05, 0.05), 9, dt);
  var bobA = Math.min(1, P.speed / 4.6) * 0.012, r = gun.root, b = gun.base;
  var rl = 0, magD = 0;
  if (gun.reloadT > 0) { var k = 1 - gun.reloadT / WEAPON.reloadTime; rl = Math.sin(Math.min(1, k * 1.15) * Math.PI); magD = (k > 0.08 && k < 0.5) ? Math.min(1, (k - 0.08) * 8) : (k >= 0.5 && k < 0.62 ? 1 - (k - 0.5) / 0.12 : 0); }
  gun.magMesh.position.y = -0.115 - magD * 0.22; gun.magMesh.visible = !(magD > 0.98);
  r.position.set(b.x + gun.swayX * 0.06 + Math.cos(P.bob) * bobA * 0.6, b.y + gun.swayY * 0.06 - Math.abs(Math.sin(P.bob)) * bobA - rl * 0.03 - P.landDip * 0.02, b.z + gun.kz * 0.3);
  r.rotation.set(gun.kr * 0.5 - gun.swayY * 0.5 + rl * 0.45, gun.swayX * 0.6 + rl * 0.25, rl * -0.5 + gun.swayX * -0.4);
}
