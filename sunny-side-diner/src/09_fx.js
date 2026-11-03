// ---- effects: planar window reflection + rain on glass, rain, steam, cars --------
var FX = { rain: 0, rainT: 0, refl: null, steam: null, cars: [], visitor: null, t: 0, thunder: 0 };
var LAYER_REFL_ONLY = 2, LAYER_REAL_ONLY = 3;
var WIN_VS = [
  'uniform mat4 uTexMat; varying vec4 vRefl; varying vec2 vUv; varying vec3 vWorld;',
  'void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz; vRefl = uTexMat * wp; gl_Position = projectionMatrix * viewMatrix * wp; }'].join('\n');
var WIN_FS = [
  'precision highp float; uniform sampler2D tRefl; uniform float uTime, uRain, uStr, uHas; uniform vec2 uSize; uniform vec3 uTint;',
  'varying vec4 vRefl; varying vec2 vUv; varying vec3 vWorld;',
  'float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'vec2 h2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }',
  // static drops: returns xy = normal-ish offset, z = mask
  'vec3 drops(vec2 uv, float sc, float t){ vec2 g = uv * sc; vec2 id = floor(g); vec2 f = fract(g) - 0.5; vec2 r = h2(id);',
  '  float life = fract(t * 0.05 + r.x); vec2 c = (r - 0.5) * 0.7; float rad = 0.08 + 0.22 * r.y * (1.0 - life * 0.6);',
  '  vec2 d = f - c; float m = smoothstep(rad, rad * 0.6, length(d * vec2(1.0, 0.85))); m *= step(0.35, h1(id + 7.0)); return vec3(d / rad, m); }',
  // running drips
  'vec3 drips(vec2 uv, float t){ float cols = 26.0; float x = uv.x * cols; float id = floor(x); float fx = fract(x) - 0.5; float r = h1(vec2(id, 3.0));',
  '  float speed = 0.25 + r * 0.5; float y = fract(uv.y * 0.6 + t * speed * 0.3 + r * 10.0); float wob = sin(uv.y * 30.0 + r * 6.0) * 0.12;',
  '  float head = smoothstep(0.06, 0.0, abs(y - 0.5)) * smoothstep(0.22, 0.05, abs(fx - wob));',
  '  float trail = smoothstep(0.5, 0.95, y) * smoothstep(0.08, 0.0, abs(fx - wob)) * 0.6;',
  '  float on = step(0.55, r); return vec3((fx - wob) * 3.0, 0.0, max(head, trail) * on); }',
  'void main(){',
  '  vec2 wuv = vUv * uSize; float t = uTime;',
  '  vec3 d1 = drops(wuv, 9.0, t), d2 = drops(wuv + 3.1, 17.0, t * 1.3), dr = drips(vec2(wuv.x * 0.25, wuv.y * 0.5), t);',
  '  float mask = clamp(d1.z + d2.z * 0.8 + dr.z, 0.0, 1.0) * uRain;',
  '  vec2 off = (d1.xy * d1.z + d2.xy * d2.z * 0.6 + dr.xy * dr.z) * 0.02 * uRain;',
  '  vec2 ruv = vRefl.xy / vRefl.w;',
  '  vec3 refl = uHas > 0.5 ? texture2D(tRefl, ruv - off * 2.5).rgb : vec3(0.0);',
  '  // drop lens shows blurred city lights (neon pink / cyan from outside)',
  '  vec3 lens = mix(vec3(0.9, 0.25, 0.55), vec3(0.25, 0.75, 0.9), step(0.5, h1(floor(wuv * 9.0)))) * 0.35;',
  '  float spec = pow(clamp(1.0 - length(d1.xy - vec2(-0.35, 0.4)), 0.0, 1.0), 6.0) * d1.z + dr.z * 0.3;',
  '  vec3 col = refl * uStr * (1.0 - mask * 0.5) + lens * mask * 0.6 + vec3(spec) * 1.4 * uRain + uTint;',
  '  float a = clamp(0.06 + uStr * 0.0 + mask * 0.5 + spec, 0.0, 1.0);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'].join('\n');
function buildFX() {
  var scene = RENDER.scene;
  // ---- planar reflection on the big window
  var r = FX.refl = { rt: mkRT(256, 256, RENDER.ftype, true), cam: new THREE.PerspectiveCamera(), tm: new THREE.Matrix4(), skip: 0,
    plane: new THREE.Plane(new THREE.Vector3(0, 0, -1), 4.985) };
  r.cam.layers.enable(LAYER_REFL_ONLY); r.cam.layers.disable(LAYER_REAL_ONLY);
  RENDER.camera.layers.enable(LAYER_REAL_ONLY); RENDER.camera.layers.disable(LAYER_REFL_ONLY);
  r.uni = { tRefl: { value: r.rt.texture }, uTexMat: { value: r.tm }, uTime: { value: 0 }, uRain: { value: 0 }, uStr: { value: 0.5 }, uHas: { value: 1 }, uSize: { value: new THREE.Vector2(12.7, 1.6) }, uTint: { value: new THREE.Vector3(0.004, 0.005, 0.008) } };
  var wm = new THREE.ShaderMaterial({ uniforms: r.uni, vertexShader: WIN_VS, fragmentShader: WIN_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  WORLD.window.material = wm; WORLD.windowMat = wm;
  // ---- rain streaks outside (GPU animated line segments)
  var N = Math.round(2200 * Q.rain), pos = new Float32Array(N * 6), seed = new Float32Array(N * 2), rnd = makeRNG(77);
  for (var i = 0; i < N; i++) {
    var x = (rnd() - 0.5) * 44, y = rnd() * 14, z = 5.6 + rnd() * 26; if (rnd() < 0.25) z = -5.6 - rnd() * 8;
    pos.set([x, y, z, x, y, z], i * 6); seed[i * 2] = rnd(); seed[i * 2 + 1] = 0; seed[i * 2 + 1] = 0;
  }
  var ends = new Float32Array(N * 2); for (var j = 0; j < N; j++) { ends[j * 2] = 0; ends[j * 2 + 1] = 1; }
  var rs = new Float32Array(N * 2); for (var k = 0; k < N; k++) { rs[k * 2] = rs[k * 2 + 1] = rnd(); }
  var rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1)); rg.setAttribute('aSeed', new THREE.BufferAttribute(rs, 1));
  FX.rainU = { uTime: { value: 0 }, uRain: { value: 0 }, uWind: { value: 0.18 } };
  var rmat = new THREE.ShaderMaterial({ uniforms: FX.rainU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aEnd; attribute float aSeed; uniform float uTime, uWind; varying float vA; varying float vS; void main(){ vec3 p = position; float sp = 9.0 + aSeed * 4.0; p.y = mod(p.y - uTime * sp, 14.0); p.x += uWind * p.y; p.y += aEnd * 0.38; p.x -= aEnd * uWind * 0.38; vA = aEnd; vS = aSeed; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }',
    fragmentShader: 'uniform float uRain; varying float vA; varying float vS; void main(){ if (vS > uRain) discard; gl_FragColor = vec4(vec3(0.55, 0.6, 0.7) * (0.15 + 0.25 * vA) * 1.4, 1.0); }' });
  var rain = new THREE.LineSegments(rg, rmat); rain.frustumCulled = false; scene.add(rain); FX.rainMesh = rain;
  // ---- steam particles
  var SN = 90, sp = new Float32Array(SN * 3), sa = new Float32Array(SN), ss = new Float32Array(SN);
  var sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sgeo.setAttribute('aAlpha', new THREE.BufferAttribute(sa, 1)); sgeo.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  var stc = mkCanvas(64, 64), stg = stc.getContext('2d'), sgr = stg.createRadialGradient(32, 32, 0, 32, 32, 32); sgr.addColorStop(0, 'rgba(255,255,255,0.6)'); sgr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); sgr.addColorStop(1, 'rgba(255,255,255,0)'); stg.fillStyle = sgr; stg.fillRect(0, 0, 64, 64);
  FX.steamU = { tTex: { value: toTex(stc, { clamp: true, linear: true }) }, uScale: { value: 600 } };
  var smat = new THREE.ShaderMaterial({ uniforms: FX.steamU, transparent: true, depthWrite: false,
    vertexShader: 'attribute float aAlpha; attribute float aSize; uniform float uScale; varying float vA; void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D tTex; varying float vA; void main(){ vec4 c = texture2D(tTex, gl_PointCoord); gl_FragColor = vec4(vec3(0.85, 0.83, 0.8), c.a * vA); }' });
  var steam = new THREE.Points(sgeo, smat); steam.frustumCulled = false; scene.add(steam);
  FX.steam = { mesh: steam, n: SN, p: [], emit: [] };
  for (var q = 0; q < SN; q++) FX.steam.p.push({ x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0.1 });
  // ---- highway traffic (light pairs on dim bodies) + visitor car with real headlights
  for (var c = 0; c < 3; c++) {
    var car = makeCar([0x334455, 0x6a2a22, 0x777060][c]); car.scale.setScalar(1); scene.add(car);
    FX.cars.push({ obj: car, x: -120 + c * 90, dir: c % 2 ? -1 : 1, speed: 22 + c * 5, wait: c * 6 });
  }
  var flareC = mkCanvas(128, 128), fg = flareC.getContext('2d'), fgr = fg.createRadialGradient(64, 64, 0, 64, 64, 64); fgr.addColorStop(0, 'rgba(255,255,255,1)'); fgr.addColorStop(0.15, 'rgba(255,240,210,0.6)'); fgr.addColorStop(1, 'rgba(255,220,180,0)'); fg.fillStyle = fgr; fg.fillRect(0, 0, 128, 128);
  FX.flareTex = toTex(flareC, { clamp: true });
  var vis = makeCar(0x8a1c1c); scene.add(vis); vis.visible = false;
  var flareMat = new THREE.SpriteMaterial({ map: FX.flareTex, color: new THREE.Color(6, 5.5, 4.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  [-0.65, 0.65].forEach(function (x) { var s = new THREE.Sprite(flareMat); s.scale.set(1.4, 1.4, 1); s.position.set(x, 0.85, 2.45); vis.add(s); });
  FX.visitor = { obj: vis, state: 'idle', t: 0, flareMat: flareMat, path: null, onPark: null, high: false };
  FX.cars.forEach(function (cc) {
    var fm = new THREE.SpriteMaterial({ map: FX.flareTex, color: new THREE.Color(3, 2.8, 2.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    var tm = new THREE.SpriteMaterial({ map: FX.flareTex, color: new THREE.Color(2.5, 0.15, 0.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    [-0.65, 0.65].forEach(function (x) { var s = new THREE.Sprite(fm); s.scale.set(1.1, 1.1, 1); s.position.set(x, 0.85, 2.45); cc.obj.add(s); var s2 = new THREE.Sprite(tm); s2.scale.set(0.6, 0.6, 1); s2.position.set(x, 0.85, -2.4); cc.obj.add(s2); });
  });
  onFrame(updateFX);
}
function steamEmit(x, y, z, rate, spread) { FX.steam.emit.push({ x: x, y: y, z: z, rate: rate, sp: spread || 0.03, acc: 0 }); return FX.steam.emit[FX.steam.emit.length - 1]; }
function steamStop(e) { var i = FX.steam.emit.indexOf(e); if (i >= 0) FX.steam.emit.splice(i, 1); }
var _v3 = null;
function updateReflection() {
  var r = FX.refl, cam = RENDER.camera, rend = RENDER.renderer;
  r.skip++; var every = Q === QUAL.HIGH ? 1 : (Q === QUAL.MEDIUM ? 2 : 3);
  // window visible? (camera in front of it and facing it)
  if (!_v3) _v3 = new THREE.Vector3();
  cam.getWorldDirection(_v3);
  var visible = Q !== QUAL.LOW && cam.position.z < 4.98 && cam.position.z > -2.9 && cam.position.x < 8 && _v3.z > -0.25 && !CAM.inFreezer;
  r.uni.uHas.value = visible ? 1 : 0;
  if (!visible || r.skip % every) return;
  var sw = Math.max(64, Math.round(RENDER.sw * (Q === QUAL.HIGH ? 0.5 : 0.36))), sh = Math.max(64, Math.round(RENDER.sh * (Q === QUAL.HIGH ? 0.5 : 0.36)));
  if (r.rt.width !== sw || r.rt.height !== sh) r.rt.setSize(sw, sh);
  var zP = 4.985, cp = cam.position, dir = _v3;
  r.cam.position.set(cp.x, cp.y, 2 * zP - cp.z);
  var tgt = new THREE.Vector3(cp.x + dir.x, cp.y + dir.y, 2 * zP - (cp.z + dir.z));
  r.cam.up.set(0, 1, 0); r.cam.lookAt(tgt);
  r.cam.fov = cam.fov; r.cam.aspect = cam.aspect; r.cam.near = cam.near; r.cam.far = 40; r.cam.updateProjectionMatrix(); r.cam.updateMatrixWorld();
  r.tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  r.tm.multiply(r.cam.projectionMatrix); r.tm.multiply(r.cam.matrixWorldInverse);
  var wv = WORLD.window.visible, exv = WORLD.exterior.visible, rv = FX.rainMesh.visible;
  WORLD.window.visible = false; WORLD.exterior.visible = false; FX.rainMesh.visible = false;
  rend.clippingPlanes = [r.plane];
  var envSave = RENDER.scene.environment;
  rend.setRenderTarget(r.rt); rend.clear(); rend.render(RENDER.scene, r.cam);
  rend.clippingPlanes = [];
  WORLD.window.visible = wv; WORLD.exterior.visible = exv; FX.rainMesh.visible = rv;
}
function updateFX(dt, t) {
  FX.t = t;
  FX.rain = damp(FX.rain, FX.rainT, 0.4, dt);
  FX.rainU.uTime.value = t; FX.rainU.uRain.value = FX.rain;
  FX.rainMesh.visible = FX.rain > 0.02;
  var r = FX.refl; r.uni.uTime.value = t; r.uni.uRain.value = FX.rain; r.uni.uStr.value = 0.36 * (0.4 + 0.6 * LSTATE.power);
  updateReflection();
  // steam
  var S = FX.steam, pa = S.mesh.geometry.attributes.position.array, aa = S.mesh.geometry.attributes.aAlpha.array, za = S.mesh.geometry.attributes.aSize.array;
  S.emit.forEach(function (e) {
    e.acc += e.rate * dt;
    while (e.acc >= 1) { e.acc -= 1; for (var i = 0; i < S.n; i++) { var p = S.p[i]; if (p.life <= 0) { p.x = e.x + (Math.random() - 0.5) * e.sp; p.y = e.y; p.z = e.z + (Math.random() - 0.5) * e.sp; p.vx = (Math.random() - 0.5) * 0.03; p.vz = (Math.random() - 0.5) * 0.03; p.vy = 0.12 + Math.random() * 0.1; p.max = p.life = 1.6 + Math.random() * 1.4; p.size = 0.05 + Math.random() * 0.04; break; } } }
  });
  for (var i = 0; i < S.n; i++) {
    var p = S.p[i];
    if (p.life > 0) { p.life -= dt; var k = 1 - p.life / p.max; p.x += (p.vx + Math.sin(t * 1.7 + i) * 0.03) * dt; p.y += p.vy * dt * (1 - k * 0.5); p.z += (p.vz + Math.cos(t * 1.3 + i) * 0.03) * dt; aa[i] = Math.sin(k * PI) * 0.22; za[i] = p.size * (1 + k * 2.5); }
    else { aa[i] = 0; }
    pa[i * 3] = p.x; pa[i * 3 + 1] = p.life > 0 ? p.y : -50; pa[i * 3 + 2] = p.z;
  }
  S.mesh.geometry.attributes.position.needsUpdate = true; S.mesh.geometry.attributes.aAlpha.needsUpdate = true; S.mesh.geometry.attributes.aSize.needsUpdate = true;
  FX.steamU.uScale.value = RENDER.sh / (2 * Math.tan(RENDER.camera.fov * PI / 360));
  // highway traffic
  FX.cars.forEach(function (c) {
    if (c.wait > 0) { c.wait -= dt; c.obj.visible = false; return; }
    c.obj.visible = true; c.x += c.dir * c.speed * dt;
    c.obj.position.set(c.x, 0, c.dir > 0 ? 39.5 : 35.5); c.obj.rotation.y = c.dir > 0 ? PI / 2 : -PI / 2;
    if (Math.abs(c.x) > 140) { c.x = -c.dir * 140; c.wait = 6 + Math.random() * 22; if (Math.random() < 0.5) { c.dir *= -1; c.x = -c.dir * 140; } if (typeof sfxCarPass === 'function') c.snd = 0; }
    if (!c.snd && Math.abs(c.x) < 60 && typeof sfxCarPass === 'function') { c.snd = 1; sfxCarPass(c); }
  });
  updateVisitor(dt);
  if (typeof updateStreaks === 'function') updateStreaks(t);
}
// visitor car: drives in from the highway, sweeps the windows with its headlights, parks.
function visitorArrive(opt) {
  var v = FX.visitor; opt = opt || {};
  var dir = Math.random() < 0.5 ? 1 : -1;
  var pts = [new THREE.Vector3(-dir * 90, 0, dir > 0 ? 39.5 : 35.5), new THREE.Vector3(-dir * 20, 0, dir > 0 ? 39.5 : 35.5), new THREE.Vector3(-dir * 4, 0, 30), new THREE.Vector3((opt.x != null ? opt.x : -2.5 + Math.random() * 6) + dir * 1.5, 0, 18), new THREE.Vector3(opt.x != null ? opt.x : -2 + Math.random() * 5, 0, opt.z || 9.5)];
  v.path = new THREE.CatmullRomCurve3(pts); v.t = 0; v.state = 'drive'; v.obj.visible = true; v.dur = opt.dur || 9; v.onPark = opt.onPark || null; v.stay = opt.stay || 0; v.high = !!opt.high; v.leaveAfter = opt.leaveAfter;
  v.obj.children.forEach(function (c) { if (c.material && c.material.color && c.material.color.r > 0 && c.isMesh && c.material === v.obj.userData.paint) c.material.color.set(opt.color || 0x8a1c1c); });
  if (typeof sfxCarArrive === 'function') sfxCarArrive();
}
function visitorLeave() { var v = FX.visitor; if (v.state === 'idle') return; var p = v.obj.position.clone(); v.path = new THREE.CatmullRomCurve3([p, p.clone().add(new THREE.Vector3(0, 0, 4)), new THREE.Vector3(p.x + 6, 0, 26), new THREE.Vector3(30, 0, 39.5), new THREE.Vector3(120, 0, 39.5)]); v.t = 0; v.state = 'leave'; v.dur = 8; v.reverse = true; if (typeof sfxCarArrive === 'function') sfxCarArrive(true); }
function updateVisitor(dt) {
  var v = FX.visitor, L = WORLD.lights.head;
  if (v.state === 'idle') { L.intensity = damp(L.intensity, 0, 4, dt); return; }
  if (v.state === 'drive' || v.state === 'leave') {
    v.t += dt / v.dur; var k = v.state === 'drive' ? 1 - Math.pow(1 - Math.min(1, v.t), 2.2) : Math.pow(Math.min(1, v.t), 1.6);
    var p = v.path.getPoint(k), ahead = v.path.getPoint(Math.min(1, k + 0.01));
    v.obj.position.copy(p);
    if (ahead.distanceTo(p) > 0.001) { var yaw = Math.atan2(ahead.x - p.x, ahead.z - p.z); if (v.state === 'leave' && v.t < 0.25) yaw += PI; v.obj.rotation.y = yaw; }
    if (v.t >= 1) { if (v.state === 'drive') { v.state = 'parked'; v.park = 0; if (v.onPark) v.onPark(); } else { v.state = 'idle'; v.obj.visible = false; } }
  }
  if (v.state === 'parked') { v.park += dt; if (!v.high && v.park > 2.5) { /* engine off */ } }
  var on = v.state !== 'parked' || v.high || v.park < 2.5;
  var fwd = new THREE.Vector3(Math.sin(v.obj.rotation.y), 0, Math.cos(v.obj.rotation.y));
  L.position.copy(v.obj.position).add(fwd.clone().multiplyScalar(2.3)); L.position.y = 0.85;
  L.target.position.copy(L.position).add(fwd.multiplyScalar(10)); L.target.position.y = v.high ? 1.4 : 0.6;
  L.angle = v.high ? 0.5 : 0.42;
  L.intensity = damp(L.intensity, on ? (v.high ? 260 : 140) : 0, 5, dt);
  v.flareMat.opacity = clamp(L.intensity / 140, 0, 1);
}
