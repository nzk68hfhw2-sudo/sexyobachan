// ---- free movement: walkable areas, collisions, joystick + WASD --------------------
// Walkable areas (x0, z0, x1, z1): the player's centre must be inside one of these...
var WALK = [
  [-7.75, -1.02, 7.75, 4.78],   // dining room (in front of the counter)
  [-7.75, -2.62, -3.85, -1.0],  // left of the counter
  [4.62, -2.62, 7.75, -1.0],    // right of the counter (to the register)
  [-3.85, -2.22, 4.62, -2.04],  // aisle behind the counter
  [-3.35, -3.0, -2.55, -2.0],   // swing door into the kitchen
  [-5.4, -4.35, 4.7, -2.98],    // kitchen
  [-10.2, -0.28, -7.7, 0.68]    // restroom hallway
];
// ...and outside every blocker grown by the body radius
var BLOCK = [];
var BODY_R = 0.22;
function buildBlockers() {
  BLOCK = [];
  D.booths.forEach(function (bx) { BLOCK.push([bx - 1.0, 3.38, bx + 1.0, 5.0]); });
  D.stools.forEach(function (x) { BLOCK.push([x - 0.2, D.stoolZ - 0.2, x + 0.2, D.stoolZ + 0.2]); });
  BLOCK.push([5.4, 1.42, 7.4, 1.98]);        // register stand
  BLOCK.push([-7.95, 2.6, -7.2, 3.3]);       // jukebox
  BLOCK.push([5.1, 3.6, 5.3, 3.8]);          // "please wait" sign
  BLOCK.push([-2.3, -3.95, -0.3, -3.15]);    // prep table
  BLOCK.push([-5.1, -3.5, -4.1, -2.9]);      // sink
  BLOCK.push([-4.15, -5.2, -3.65, -4.6]);    // mop bucket
  BLOCK.push([-0.1, -5.2, 2.7, -4.38]);      // griddle + fryer
}
function canStand(x, z) {
  var inside = false;
  for (var i = 0; i < WALK.length; i++) { var w = WALK[i]; if (x >= w[0] && x <= w[2] && z >= w[1] && z <= w[3]) { inside = true; break; } }
  if (!inside) return false;
  for (var j = 0; j < BLOCK.length; j++) { var b = BLOCK[j]; if (x > b[0] - BODY_R && x < b[2] + BODY_R && z > b[1] - BODY_R && z < b[3] + BODY_R) return false; }
  // seated / standing customers are solid too
  for (var k = 0; k < CUSTS.length; k++) { var C = CUSTS[k]; if (!C.P || C.state === 'gone') continue; var p = C.P.root.position; if (C.seat) continue; if ((x - p.x) * (x - p.x) + (z - p.z) * (z - p.z) < 0.16) return false; }
  return true;
}
// which "station" the player is standing at (drives the main button, sounds, tickets)
function regionStation(p) {
  if (p.z < -2.9) { if (p.x > 2.8) return 'FREEZER'; if (p.x < -0.6) return 'BACKDOOR'; return 'KITCHEN'; }
  if (p.x < -7.7) return 'JUKEBOX';
  if (p.x < -4.5 && p.z > -1.0) return 'JUKEBOX';
  if (p.x > 5.0 && p.z < 2.6) return 'REGISTER';
  if (p.x > 4.8 && p.z >= 2.6) return 'DOOR';
  if (p.z < -1.25 && p.x > -3.85 && p.x < 4.62) return 'COUNTER';
  if (p.z > 1.8) return 'BOOTHS';
  return 'COUNTER';
}
var MOVE = { jx: 0, jz: 0, keys: {}, joy: null, stepT: 0, bob: 0, el: null, knob: null };
function initMove() {
  buildBlockers();
  var st = document.createElement('style');
  st.textContent = '.joy{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid rgba(232,251,255,.45);background:radial-gradient(circle,rgba(91,232,255,.10),rgba(91,232,255,.02));box-shadow:0 0 18px rgba(91,232,255,.25);pointer-events:none;opacity:0}' +
    '.joy.on{opacity:1}.joy i{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f4f6f8,#9aa3ab 60%,#5a6168);box-shadow:0 4px 10px rgba(0,0,0,.5)}' +
    '.joyhint{position:absolute;left:24px;bottom:calc(env(safe-area-inset-bottom,0px) + 110px);font:600 11px/1.4 Oswald,sans-serif;letter-spacing:.14em;color:rgba(232,251,255,.7);text-shadow:0 1px 3px #000;pointer-events:none;transition:opacity .6s}';
  (document.head || document.documentElement).appendChild(st);
  MOVE.el = el('div', 'joy', '<i></i>', UI); MOVE.knob = MOVE.el.querySelector('i');
  onFrame(updateMove);
  window.addEventListener('keydown', function (e) { if (e.target && e.target.tagName === 'INPUT') return; MOVE.keys[e.key.toLowerCase()] = 1; });
  window.addEventListener('keyup', function (e) { MOVE.keys[e.key.toLowerCase()] = 0; });
  window.addEventListener('blur', function () { MOVE.keys = {}; });
}
function canWalkNow() { return GAME.mode === 'play' && !GAME.paused && !PAUSE.el && !MINI.active && !CAM.override && !CAM.moving && !CAM.inFreezer && !CAM.outside && !DOC.open && !CAM.locked && !JS.on; }
// touch joystick: a finger that lands on the left side of the 3D view
function joyStart(e) {
  if (!canWalkNow() || e.clientX > RENDER.w * 0.45 || e.clientY < 190 || e.clientY > RENDER.h - 120) return false;
  MOVE.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0 };
  MOVE.el.style.left = e.clientX + 'px'; MOVE.el.style.top = e.clientY + 'px'; MOVE.el.classList.add('on'); MOVE.knob.style.transform = '';
  return true;
}
function joyMove(e) {
  var J = MOVE.joy; if (!J || e.pointerId !== J.id) return false;
  J.x = e.clientX; J.y = e.clientY; var dx = J.x - J.x0, dy = J.y - J.y0, L = Math.hypot(dx, dy), R = 50;
  J.moved = Math.max(J.moved, L);
  if (L > R) { dx *= R / L; dy *= R / L; }
  MOVE.knob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
  var k = L < 8 ? 0 : 1; MOVE.jx = k * dx / R; MOVE.jz = k * -dy / R;
  return true;
}
function joyEnd(e) {
  var J = MOVE.joy; if (!J || e.pointerId !== J.id) return false;
  MOVE.joy = null; MOVE.jx = MOVE.jz = 0; MOVE.el.classList.remove('on');
  if (J.moved < 12 && performance.now() - J.t0 < 600) pickAt(e.clientX, e.clientY); // it was a tap
  return true;
}
function updateMove(dt) {
  if (!CAM.pos) return;
  var k = MOVE.keys, fx = MOVE.jz, sx = MOVE.jx;
  if (k.w || k.arrowup) fx += 1; if (k.s || k.arrowdown) fx -= 1;
  if (k.d || k.arrowright) sx += 1; if (k.a || k.arrowleft) sx -= 1;
  var mag = Math.hypot(fx, sx);
  if (!canWalkNow() || mag < 0.05) { MOVE.speed = damp(MOVE.speed || 0, 0, 10, dt); return; }
  if (mag > 1) { fx /= mag; sx /= mag; mag = 1; }
  // first step away from a fixed point: fold the look offset into the heading (free look from now on)
  if (Math.abs(CAM.lookYaw) > 0.0001 || Math.abs(CAM.tYaw) > 0.0001) { CAM.yaw += CAM.lookYaw; CAM.tYaw -= CAM.lookYaw; CAM.lookYaw = 0; CAM.yaw += CAM.tYaw; CAM.tYaw = 0; }
  var yaw = CAM.yaw, sp = 1.75 * (k.shift ? 1.5 : 1);
  MOVE.speed = damp(MOVE.speed || 0, sp * mag, 10, dt);
  var vx = Math.sin(yaw) * fx - Math.cos(yaw) * sx, vz = Math.cos(yaw) * fx + Math.sin(yaw) * sx, vl = Math.hypot(vx, vz) || 1;
  var step = MOVE.speed * dt, nx = CAM.pos.x + vx / vl * step, nz = CAM.pos.z + vz / vl * step;
  if (canStand(nx, nz)) { CAM.pos.x = nx; CAM.pos.z = nz; }
  else if (canStand(nx, CAM.pos.z)) CAM.pos.x = nx;
  else if (canStand(CAM.pos.x, nz)) CAM.pos.z = nz;
  CAM.pos.y = damp(CAM.pos.y, 1.64, 6, dt);
  MOVE.bob += step * 5.2; CAM.bob = Math.sin(MOVE.bob) * 0.018;
  MOVE.stepT -= step; if (MOVE.stepT <= 0) { MOVE.stepT = 0.62; sfx('step', null, { vol: 0.45 }); }
  var st = regionStation(CAM.pos);
  if (st !== CAM.station) { CAM.station = st; if (typeof onArrive === 'function') onArrive(st); }
}
