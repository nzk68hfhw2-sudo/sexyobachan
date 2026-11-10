// ---- input & player ---------------------------------------------------------------
var INPUT = { mx: 0, mz: 0, lookDX: 0, lookDY: 0, keys: {}, pressed: {}, stick: null, look: null, enabled: false, pointerLocked: false, lastTouch: 0, tap: null };
function press(a) { INPUT.pressed[a] = true; }
function consume(a) { var v = INPUT.pressed[a]; INPUT.pressed[a] = false; return !!v; }

function initInput() {
  var host = CANVAS_HOST;
  var stickEl = el('div', 'rm-stick', '<div class="knob"></div>', UI); stickEl.style.display = 'none'; INPUT.stickEl = stickEl;
  host.addEventListener('pointerdown', function (e) {
    initAudio();
    if (!INPUT.enabled) return;
    var mouse = e.pointerType === 'mouse';
    if (!mouse) INPUT.lastTouch = now();
    var w = RENDER.w;
    INPUT.tap = { x: e.clientX, y: e.clientY, t: now(), id: e.pointerId, moved: 0 };
    if (!mouse && e.clientX < w * 0.42 && !INPUT.stick) {
      INPUT.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
      stickEl.style.display = 'block'; stickEl.style.left = (e.clientX - 55) + 'px'; stickEl.style.top = (e.clientY - 55) + 'px';
      stickEl.firstChild.style.transform = 'translate(0px,0px)';
    } else if (!INPUT.look) INPUT.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    try { host.setPointerCapture(e.pointerId); } catch (er) {}
    e.preventDefault();
  }, { passive: false });
  host.addEventListener('pointermove', function (e) {
    if (INPUT.tap && INPUT.tap.id === e.pointerId) INPUT.tap.moved = Math.max(INPUT.tap.moved, Math.hypot(e.clientX - INPUT.tap.x, e.clientY - INPUT.tap.y));
    var s = INPUT.stick;
    if (s && s.id === e.pointerId) {
      var dx = e.clientX - s.ox, dy = e.clientY - s.oy, d = Math.sqrt(dx * dx + dy * dy), R = 55;
      if (d > R * 1.6) { s.ox += dx * (1 - R * 1.6 / d); s.oy += dy * (1 - R * 1.6 / d); stickEl.style.left = (s.ox - 55) + 'px'; stickEl.style.top = (s.oy - 55) + 'px'; dx = e.clientX - s.ox; dy = e.clientY - s.oy; d = Math.sqrt(dx * dx + dy * dy); }
      var k = Math.min(1, d / R);
      INPUT.mx = d > 4 ? dx / d * k : 0; INPUT.mz = d > 4 ? dy / d * k : 0;
      var kx = Math.min(d, R) * (d ? dx / d : 0), ky = Math.min(d, R) * (d ? dy / d : 0);
      stickEl.firstChild.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
    }
    var l = INPUT.look;
    if (l && l.id === e.pointerId) { INPUT.lookDX += (e.clientX - l.x) * 1.5; INPUT.lookDY += (e.clientY - l.y) * 1.5; l.x = e.clientX; l.y = e.clientY; }
  });
  var end = function (e) {
    var tp = INPUT.tap;
    if (tp && tp.id === e.pointerId && tp.moved < 12 && now() - tp.t < 0.4 && INPUT.enabled) INPUT.tapAt = { x: tp.x, y: tp.y };
    if (tp && tp.id === e.pointerId) INPUT.tap = null;
    if (INPUT.stick && INPUT.stick.id === e.pointerId) { INPUT.stick = null; INPUT.mx = INPUT.mz = 0; stickEl.style.display = 'none'; }
    if (INPUT.look && INPUT.look.id === e.pointerId) INPUT.look = null;
  };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end); host.addEventListener('lostpointercapture', end);
  window.addEventListener('keydown', function (e) {
    initAudio();
    var k = (e.key || '').toLowerCase();
    if (!INPUT.keys[k]) {
      if (k === 'e' || k === 'enter') press('interact');
      if (k === 'f') press('ff');
      if (k === 'tab' || k === 'm') press('phone');
      if (k === 'escape' || k === 'p') press('menu');
      if (k === 'r') press('pill');
      if (k === 'q') press('drink');
    }
    INPUT.keys[k] = true;
    if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { INPUT.keys[(e.key || '').toLowerCase()] = false; });
  window.addEventListener('blur', function () { INPUT.keys = {}; });
}
function isTouchDevice() { return INPUT.lastTouch > 0 || ('ontouchstart' in window && navigator.maxTouchPoints > 0); }
function readMove() {
  var K = INPUT.keys, x = INPUT.mx, z = INPUT.mz;
  var kx = (K['d'] || K['arrowright'] ? 1 : 0) - (K['a'] || K['arrowleft'] ? 1 : 0);
  var kz = (K['s'] || K['arrowdown'] ? 1 : 0) - (K['w'] || K['arrowup'] ? 1 : 0);
  if (kx || kz) { var l = Math.sqrt(kx * kx + kz * kz); x = kx / l; z = kz / l; if (!K['shift']) { x *= 0.8; z *= 0.8; } }
  return { x: x, z: z };
}

// ---- player ------------------------------------------------------------------------
var PL = { x: 0.2, z: 1.3, yaw: PI * 0.92, pitch: -0.12, vx: 0, vz: 0, bob: 0, eye: 1.55, roll: 0, camY: 1.55, oob: 0, fall: 0, stepT: 0, lie: 0, drift: 0 };

function resetPlayer() {
  PL.x = 0.35; PL.z = 1.35; PL.yaw = 0.62; PL.pitch = -0.32; PL.vx = PL.vz = 0; PL.roll = 0; PL.oob = 0; PL.fall = 0; PL.lie = 0; PL.camY = 1.55;
}
function collide(nx, nz, r) {
  for (var i = 0; i < WORLD.colliders.length; i++) {
    var c = WORLD.colliders[i];
    if (nx + r > c.x0 && nx - r < c.x1 && nz + r > c.z0 && nz - r < c.z1) {
      var px1 = c.x1 - (nx - r), px0 = (nx + r) - c.x0, pz1 = c.z1 - (nz - r), pz0 = (nz + r) - c.z0;
      var m = Math.min(px1, px0, pz1, pz0);
      if (m === px1) nx += px1; else if (m === px0) nx -= px0; else if (m === pz1) nz += pz1; else nz -= pz0;
    }
  }
  return [nx, nz];
}
function isOutdoor() { return areaAt(PL.x, PL.z).id === 'balcony'; }
function inBathroom() { return PL.z > 2.55; }

function updatePlayer(dt, B, canMove) {
  var V = B.vis, sens = SAVE.settings.sens;
  // look
  var lookMul = 0.0026 * sens * (1 - Math.min(0.5, V.sed * 0.3)) * (1 + V.stim * 0.15);
  PL.yaw -= INPUT.lookDX * lookMul;
  PL.pitch -= INPUT.lookDY * lookMul * (SAVE.settings.invertY ? -1 : 1);
  INPUT.lookDX = INPUT.lookDY = 0;
  PL.pitch = clamp(PL.pitch, -1.35, 1.35);
  // movement
  var mv = canMove ? readMove() : { x: 0, z: 0 };
  var speed = 1.75 * (1 + V.stim * 0.25) * (1 - Math.min(0.6, V.sed * 0.35 + V.dis * 0.3)) * (B.unconscious ? 0 : 1);
  // drunk drift: you don't quite walk where you want
  PL.drift += dt * (0.6 + V.drunk);
  var dr = Math.min(1.2, V.drunk) * 0.45;
  var mx = mv.x + Math.sin(PL.drift * 1.3) * dr * (Math.abs(mv.x) + Math.abs(mv.z)), mz = mv.z;
  var sy = Math.sin(PL.yaw), cy = Math.cos(PL.yaw);
  var wx = (mx * cy + mz * sy) * speed, wz = (-mx * sy + mz * cy) * speed;
  var resp = 10 / (1 + V.drunk * 2.5 + V.dis * 2);
  PL.vx = damp(PL.vx, wx, resp, dt); PL.vz = damp(PL.vz, wz, resp, dt);
  var p = collide(PL.x + PL.vx * dt, PL.z + PL.vz * dt, 0.22);
  PL.x = p[0]; PL.z = p[1];
  var spd = Math.hypot(PL.vx, PL.vz);
  PL.bob += spd * dt * 6.5;
  PL.stepT -= spd * dt;
  if (PL.stepT <= 0 && spd > 0.3) { PL.stepT = 0.62; sfx('step', isOutdoor() ? 1.3 : 1); }
}

function updateCamera(dt, B) {
  var cam = RENDER.camera, V = B.vis, t = LOOP.t;
  var calm = SAVE.settings.calm ? 0.45 : 1;
  // fall over when unconscious / lie on bed
  PL.fall = damp(PL.fall, B.unconscious && !B.onBed ? 1 : 0, 2.5, dt);
  PL.lie = damp(PL.lie, B.onBed ? 1 : 0, 3, dt);
  var eye = 1.55 - Math.min(0.15, V.sed * 0.08);
  var y = lerp(eye, 0.28, PL.fall);
  var x = PL.x, z = PL.z;
  if (PL.lie > 0.01) { var bd = WORLD.bed || WORLD.bedMain; x = lerp(x, bd.pos.x, PL.lie); z = lerp(z, bd.pos.z - 0.5, PL.lie); y = lerp(y, bd.y, PL.lie); }
  y += Math.sin(PL.bob) * 0.025 * (1 - PL.fall);
  // sway & jitter
  var roll = Math.sin(t * 0.7) * Math.min(1.5, V.drunk) * 0.07 * calm + Math.sin(t * 0.33) * V.dis * 0.08 * calm + PL.fall * 1.25 + V.spin * Math.sin(t * 0.4) * 0.12 * calm;
  PL.roll = damp(PL.roll, roll, 4, dt);
  var jit = V.stim > 0.6 ? (Math.random() - 0.5) * 0.004 * (V.stim - 0.5) : 0;
  var yaw = PL.yaw + Math.sin(t * 0.5) * Math.min(1.5, V.drunk) * 0.03 * calm;
  var pitch = PL.pitch + Math.sin(t * 0.9) * Math.min(1.5, V.drunk) * 0.02 * calm + jit;
  if (PL.lie > 0.01) pitch = lerp(pitch, 1.2, PL.lie * 0.8);
  // out of body (strong dissociation)
  var oobT = clamp((V.dis - 0.95) / 0.7, 0, 1);
  PL.oob = damp(PL.oob, B.unconscious ? 0 : oobT, 0.7, dt);
  var bx = x, bz = z, by = y;
  if (PL.oob > 0.01) {
    var back = PL.oob * 1.3, up = PL.oob * 0.85;
    x -= -Math.sin(PL.yaw) * back; z -= -Math.cos(PL.yaw) * back; y += up;
    var cc = collide(x, z, 0.1); x = cc[0]; z = cc[1]; y = Math.min(y, ROOM.h - 0.15);
    pitch = lerp(pitch, -0.45, PL.oob * 0.6);
  }
  WORLD.self.visible = PL.oob > 0.15;
  if (WORLD.self.visible) { WORLD.self.position.set(bx, 0, bz); WORLD.self.rotation.y = PL.yaw + PI; WORLD.self.traverse(function (o) { if (o.material) { o.material.transparent = true; o.material.opacity = clamp(PL.oob * 1.2, 0, 1); } }); }
  cam.position.set(x, y, z);
  cam.rotation.set(0, 0, 0, 'YXZ');
  cam.rotation.order = 'YXZ';
  cam.rotation.y = yaw; cam.rotation.x = pitch; cam.rotation.z = PL.roll;
  // fov breathing
  var fov = RENDER.baseFov + V.dis * 14 * calm + Math.sin(t * 1.1) * Math.min(1.5, V.psy) * 3 * calm - V.stim * 2 + (B.danger > 30 ? Math.sin(t * 6) * 1.5 : 0);
  if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
}

// ---- interaction focus -------------------------------------------------------------
var FOCUS = { it: null };
var _ray = null, _v2 = null;
function pickAt(nx, ny, maxD) {
  if (!_ray) { _ray = new THREE.Raycaster(); _v2 = new THREE.Vector2(); }
  _v2.set(nx, ny); _ray.setFromCamera(_v2, RENDER.camera); _ray.far = maxD;
  var hits = _ray.intersectObjects(WORLD.interMeshes, false);
  for (var i = 0; i < hits.length; i++) { var it = hits[i].object.userData.inter; if (it && (!it.cond || it.cond())) return it; }
  return null;
}
function updateFocus() {
  var it = PL.oob > 0.5 ? null : pickAt(0, 0, 2.4);
  if (!it) {
    // forgiving proximity pick: closest interactable roughly in view
    var cam = RENDER.camera, fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    var best = null, bs = 0;
    WORLD.inter.forEach(function (o) {
      if (o.cond && !o.cond()) return;
      var dx = o.pos.x - PL.x, dz = o.pos.z - PL.z, d = Math.hypot(dx, dz);
      if (d > (o.id === 'rail' ? 1.2 : 1.6)) return;
      var dot = (dx * fwd.x + dz * fwd.z) / (d + 1e-4);
      var sc = dot - d * 0.2; if (dot > 0.55 && sc > bs) { bs = sc; best = o; }
    });
    it = best;
  }
  FOCUS.it = it;
  return it;
}
function handleTap() {
  var tp = INPUT.tapAt; INPUT.tapAt = null; if (!tp) return false;
  var nx = (tp.x / RENDER.w) * 2 - 1, ny = -(tp.y / RENDER.h) * 2 + 1;
  var it = pickAt(nx, ny, 3.2);
  if (it) { doInteract(it); return true; }
  return false;
}
