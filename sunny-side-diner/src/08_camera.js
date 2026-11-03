// ---- fixed-point camera stations, smooth moves, drag-look, tap picking ----------
var STATIONS = {
  COUNTER: { n: 1, pos: [0.55, 1.66, -2.2], yaw: 0, pitch: -0.18, en: 'Counter', ja: 'カウンター', yawLim: 2.9, map: [0.55, -2.0] },
  BOOTHS: { n: 2, pos: [4.75, 1.68, 2.35], yaw: -PI / 2 + 0.3, pitch: -0.17, en: 'Booths', ja: 'ボックス席', yawLim: 1.4, map: [3.3, 2.5] },
  REGISTER: { n: 3, pos: [6.5, 1.66, 0.25], yaw: 0.12, pitch: -0.3, en: 'Register', ja: 'レジ', yawLim: 1.9, map: [6.5, 0.6] },
  KITCHEN: { n: 4, pos: [2.55, 1.78, -3.3], yaw: -2.3, pitch: -0.42, en: 'Kitchen', ja: '厨房', yawLim: 1.6, map: [0.9, -3.8] },
  JUKEBOX: { n: 5, pos: [-5.3, 1.62, 1.6], yaw: -PI / 2 + 0.45, pitch: -0.1, en: 'Jukebox', ja: 'ジュークボックス', yawLim: 1.5, map: [-6.4, 2.2] },
  FREEZER: { n: 6, pos: [3.55, 1.62, -3.95], yaw: PI / 2, pitch: -0.05, en: 'Freezer', ja: '冷凍庫', yawLim: 1.2, map: [4.2, -4.0] },
  DOOR: { n: 7, pos: [6.0, 1.62, 4.1], yaw: 0.05, pitch: -0.06, en: 'Front Door', ja: '入口', yawLim: 1.3, map: [6.6, 4.3] },
  BACKDOOR: { n: 8, pos: [-1.3, 1.62, -3.85], yaw: PI + 0.62, pitch: -0.08, en: 'Back Door', ja: '裏口', yawLim: 1.3, map: [-2.4, -4.6] }
};
var STATION_ORDER = ['COUNTER', 'BOOTHS', 'REGISTER', 'KITCHEN', 'JUKEBOX', 'FREEZER', 'DOOR', 'BACKDOOR'];
// yaw convention: camera looks toward (sin(yaw), ., cos(yaw)) ; yaw 0 = +z (toward windows)
var CAM = { station: 'COUNTER', pos: null, yaw: 0, pitch: 0, lookYaw: 0, lookPitch: 0, tYaw: 0, tPitch: 0,
  moving: false, mv: null, shake: 0, override: null, locked: false, fovKick: 0, bob: 0, lookAt: null };
function camSetStation(name, instant) {
  if (!CAM.pos) CAM.pos = new THREE.Vector3();
  var s = STATIONS[name]; if (!s) return;
  CAM.station = name;
  var to = new THREE.Vector3(s.pos[0], s.pos[1], s.pos[2]);
  if (instant) { CAM.pos.copy(to); CAM.yaw = s.yaw; CAM.pitch = s.pitch; CAM.lookYaw = CAM.lookPitch = CAM.tYaw = CAM.tPitch = 0; CAM.moving = false; return; }
  var from = CAM.pos.clone(), pts = [from].concat(camRoute(from, to)).concat([to]);
  var curve = pts.length > 2 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null;
  var dist = 0; for (var i = 1; i < pts.length; i++) dist += pts[i].distanceTo(pts[i - 1]);
  CAM.mv = { from: from, to: to, curve: curve, t: 0, dur: clamp(0.55 + dist * 0.11, 0.7, 2.0), yaw0: CAM.yaw + CAM.lookYaw, yaw1: s.yaw, p0: CAM.pitch + CAM.lookPitch, p1: s.pitch };
  CAM.lookYaw = CAM.lookPitch = CAM.tYaw = CAM.tPitch = 0;
  CAM.moving = true;
  if (typeof sfx === 'function') sfx('step');
}
function camZone(p) { if (p.z < -2.85) return 'K'; if (p.z < -1.25 && p.x > -3.7 && p.x < 4.6) return 'B'; return 'F'; }
function camRoute(a, b) {
  var V = function (x, z) { return new THREE.Vector3(x, 1.62, z); };
  var L1 = V(-4.15, -0.85), L2 = V(-3.05, -2.25), K = V(-2.95, -3.25), R1 = V(5.0, -0.7), R2 = V(4.25, -2.2);
  var za = camZone(a), zb = camZone(b);
  if (za === zb) return [];
  if (za === 'F' && zb === 'B') return b.x > 1 ? [R1, R2] : [L1, L2];
  if (za === 'B' && zb === 'F') return a.x > 1 ? [R2, R1] : [L2, L1];
  if (za === 'B' && zb === 'K') return [L2, K];
  if (za === 'K' && zb === 'B') return [K, L2];
  if (za === 'F' && zb === 'K') return [L1, L2, K];
  if (za === 'K' && zb === 'F') return [K, L2, L1];
  return [];
}
function bez(a, b, c, t) { var u = 1 - t; return new THREE.Vector3(u * u * a.x + 2 * u * t * b.x + t * t * c.x, u * u * a.y + 2 * u * t * b.y + t * t * c.y, u * u * a.z + 2 * u * t * b.z + t * t * c.z); }
function updateCamera(dt, t) {
  var cam = RENDER.camera;
  if (CAM.moving && CAM.mv) {
    var m = CAM.mv; m.t += dt / m.dur; var k = smooth(Math.min(1, m.t)); k = k * k * (3 - 2 * k) * 0.5 + k * 0.5;
    if (m.curve) CAM.pos.copy(m.curve.getPoint(k)); else CAM.pos.copy(m.from).lerp(m.to, k);
    CAM.pos.y += Math.sin(k * PI) * 0.03 + Math.sin(k * PI * 6) * 0.012 * Math.sin(k * PI);
    CAM.yaw = m.yaw0 + angDiff(m.yaw0, m.yaw1) * k; CAM.pitch = lerp(m.p0, m.p1, k);
    if (m.t >= 1) { CAM.moving = false; CAM.pos.copy(m.to); CAM.yaw = m.yaw1; CAM.pitch = m.p1; if (typeof onArrive === 'function') onArrive(CAM.station); }
  }
  CAM.lookYaw = damp(CAM.lookYaw, CAM.tYaw, 10, dt); CAM.lookPitch = damp(CAM.lookPitch, CAM.tPitch, 10, dt);
  var p = CAM.pos, yaw = CAM.yaw + CAM.lookYaw, pitch = CAM.pitch + CAM.lookPitch;
  var px = p.x, py = p.y, pz = p.z;
  // idle breathing
  py += Math.sin(t * 1.1) * 0.006; yaw += Math.sin(t * 0.37) * 0.004;
  if (CAM.override) { // scripted shot {pos, target, k}
    var o = CAM.override; o.k = Math.min(1, (o.k || 0) + dt / (o.dur || 0.8)); var kk = smooth(o.k);
    var base = new THREE.Vector3(px, py, pz), dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    var tgt0 = base.clone().add(dir);
    var posO = o.back ? base.clone().lerp(o.pos, 1 - kk) : base.clone().lerp(o.pos, kk);
    var tgtO = o.back ? tgt0.clone().lerp(o.target, 1 - kk) : tgt0.clone().lerp(o.target, kk);
    cam.position.copy(posO); cam.lookAt(tgtO);
    if (o.back && o.k >= 1) CAM.override = null;
  } else {
    cam.position.set(px, py, pz);
    cam.lookAt(px + Math.sin(yaw) * Math.cos(pitch), py + Math.sin(pitch), pz + Math.cos(yaw) * Math.cos(pitch));
  }
  if (CAM.shake > 0) { CAM.shake = Math.max(0, CAM.shake - dt * 1.8); var s = CAM.shake * CAM.shake * 0.05; cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s; cam.rotation.z += (Math.random() - 0.5) * s; }
  var baseFov = RENDER.w / RENDER.h < 0.62 ? 78 : (RENDER.w / RENDER.h < 1 ? 68 : 56);
  var fov = baseFov - CAM.fovKick; if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
  // focus distance for DOF: what's in the middle of the view
  if (CAM.focusLock) PU.uFocus.value = CAM.focusLock; else if (RENDER.frame % 6 === 0) { var hit = rayCenter(); PU.uFocus.value = damp(PU.uFocus.value, hit, 6, dt * 6); }
}
function closeShot(pos, target, dur) { CAM.override = { pos: pos.clone(), target: target.clone(), k: 0, dur: dur || 0.8 }; }
function releaseShot(dur) { if (CAM.override) { CAM.override.back = true; CAM.override.k = 0; CAM.override.dur = dur || 0.7; } }
var RAY = null, RAYV = null;
function rayCenter() {
  if (!RAY) { RAY = new THREE.Raycaster(); RAYV = new THREE.Vector2(); }
  RAYV.set(0, 0.1); RAY.setFromCamera(RAYV, RENDER.camera); RAY.far = 30;
  var hits = RAY.intersectObjects(WORLD.focusables || [], true);
  return hits.length ? clamp(hits[0].distance, 0.4, 20) : 6;
}
// ---- input ---------------------------------------------------------------------
var INPUT = { down: false, id: null, x0: 0, y0: 0, x: 0, y: 0, t0: 0, moved: 0, enabled: true, hold: null };
function initInput() {
  var cv = RENDER.renderer.domElement;
  cv.addEventListener('pointerdown', function (e) {
    if (typeof AUDIO !== 'undefined') audioUnlock();
    INPUT.down = true; INPUT.id = e.pointerId; INPUT.x0 = INPUT.x = e.clientX; INPUT.y0 = INPUT.y = e.clientY; INPUT.t0 = performance.now(); INPUT.moved = 0;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    if (MINI.active && MINI.onDown) MINI.onDown(e.clientX, e.clientY);
  });
  cv.addEventListener('pointermove', function (e) {
    if (!INPUT.down || e.pointerId !== INPUT.id) return;
    var dx = e.clientX - INPUT.x, dy = e.clientY - INPUT.y; INPUT.x = e.clientX; INPUT.y = e.clientY;
    INPUT.moved += Math.abs(dx) + Math.abs(dy);
    if (MINI.active && MINI.onMove) { MINI.onMove(e.clientX, e.clientY, dx, dy); return; }
    if (!INPUT.enabled || CAM.moving || CAM.override || CAM.locked) return;
    var sens = 0.0055 * (SAVE.settings.sens || 1);
    var st = STATIONS[CAM.station];
    CAM.tYaw = clamp(CAM.tYaw - dx * sens, -st.yawLim, st.yawLim);
    CAM.tPitch = clamp(CAM.tPitch - dy * sens * 0.8, -0.65, 0.55);
  });
  var up = function (e) {
    if (!INPUT.down) return; INPUT.down = false;
    if (MINI.active && MINI.onUp) { MINI.onUp(e.clientX, e.clientY, INPUT.moved, performance.now() - INPUT.t0); return; }
    if (INPUT.moved < 12 && performance.now() - INPUT.t0 < 600 && INPUT.enabled && !CAM.moving) pickAt(e.clientX, e.clientY);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', function () { INPUT.down = false; if (MINI.active && MINI.onUp) MINI.onUp(INPUT.x, INPUT.y, 99, 0); });
  window.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (typeof onKey === 'function') onKey(e);
  });
  window.addEventListener('keyup', function (e) { if (typeof onKeyUp === 'function') onKeyUp(e); });
}
// pickables: objects with userData.pick = {id, fn, station(optional), r}
var PICKS = [];
function addPick(obj, fn, opt) { opt = opt || {}; obj.userData.pick = { fn: fn, stations: opt.stations || null, id: opt.id || '' }; PICKS.push(obj); return obj; }
function removePick(obj) { var i = PICKS.indexOf(obj); if (i >= 0) PICKS.splice(i, 1); }
function pickAt(cx, cy) {
  if (!RAY) { RAY = new THREE.Raycaster(); RAYV = new THREE.Vector2(); }
  if (RAY.layers && RAY.layers.enable) { RAY.layers.enable(LAYER_REAL_ONLY); }
  RAYV.set(cx / RENDER.w * 2 - 1, -(cy / RENDER.h) * 2 + 1); RAY.setFromCamera(RAYV, RENDER.camera); RAY.far = 40;
  var list = PICKS.filter(function (o) { var p = o.userData.pick; var vis = true; o.traverseAncestors(function (a) { if (!a.visible) vis = false; }); return vis && o.visible && (!p.stations || p.stations.indexOf(CAM.station) >= 0); });
  var hits = RAY.intersectObjects(list, true);
  if (!hits.length) { if (typeof onTapNothing === 'function') onTapNothing(); return; }
  var o = hits[0].object; while (o && !o.userData.pick) o = o.parent;
  if (o && o.userData.pick) o.userData.pick.fn(o, hits[0]);
}
