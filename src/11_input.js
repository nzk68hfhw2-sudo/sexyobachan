// ---- input: touch (stick + look drag + buttons), keyboard, mouse -----------
var INPUT = {
  mx: 0, mz: 0, stickMag: 0, lookDX: 0, lookDY: 0,
  keys: {}, run: false, crouchToggle: false, breath: false,
  pressed: {}, // edge-triggered actions: interact, flash, item, crouch, pause, next
  stick: null, look: null, enabled: false, pointerLocked: false, lastTouchTime: 0
};
function press(a) { INPUT.pressed[a] = true; }
function consume(a) { var v = INPUT.pressed[a]; INPUT.pressed[a] = false; return !!v; }
function clearPressed() { INPUT.pressed = {}; INPUT.lookDX = 0; INPUT.lookDY = 0; }

function initInput() {
  var host = CANVAS_HOST;
  var stickEl = el('div', 'hp-stick', '<div class="knob"></div>', UI); stickEl.style.display = 'none';
  INPUT.stickEl = stickEl;
  host.addEventListener('pointerdown', function (e) {
    if (!INPUT.enabled) return;
    if (e.pointerType === 'mouse') {
      if (!INPUT.pointerLocked && host.requestPointerLock && !isTouchDevice()) { try { host.requestPointerLock(); } catch (er) {} }
      return;
    }
    INPUT.lastTouchTime = now();
    var w = RENDER.w, h = RENDER.h;
    var topSafe = uiTopSafe();
    if (e.clientX < w * 0.45 && e.clientY > topSafe && !INPUT.stick) {
      INPUT.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
      stickEl.style.display = 'block'; stickEl.style.left = (e.clientX - 60) + 'px'; stickEl.style.top = (e.clientY - 60) + 'px';
      stickEl.firstChild.style.transform = 'translate(0px,0px)';
    } else if (!INPUT.look) {
      INPUT.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
    try { host.setPointerCapture(e.pointerId); } catch (er) {}
    e.preventDefault();
  }, { passive: false });
  host.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') {
      if (INPUT.pointerLocked && INPUT.enabled) { INPUT.lookDX += e.movementX || 0; INPUT.lookDY += e.movementY || 0; }
      return;
    }
    var s = INPUT.stick;
    if (s && s.id === e.pointerId) {
      var dx = e.clientX - s.ox, dy = e.clientY - s.oy, d = Math.sqrt(dx * dx + dy * dy), R = 60;
      if (d > R * 1.6) { s.ox += dx * (1 - R * 1.6 / d); s.oy += dy * (1 - R * 1.6 / d); stickEl.style.left = (s.ox - 60) + 'px'; stickEl.style.top = (s.oy - 60) + 'px'; dx = e.clientX - s.ox; dy = e.clientY - s.oy; d = Math.sqrt(dx * dx + dy * dy); }
      var k = Math.min(1, d / R);
      INPUT.mx = d > 4 ? dx / d * k : 0; INPUT.mz = d > 4 ? dy / d * k : 0; INPUT.stickMag = k;
      var kx = Math.min(d, R) * (d ? dx / d : 0), ky = Math.min(d, R) * (d ? dy / d : 0);
      stickEl.firstChild.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
      stickEl.classList.toggle('run', k > 0.92);
    }
    var l = INPUT.look;
    if (l && l.id === e.pointerId) { INPUT.lookDX += (e.clientX - l.x) * 1.6; INPUT.lookDY += (e.clientY - l.y) * 1.6; l.x = e.clientX; l.y = e.clientY; }
  });
  var end = function (e) {
    if (INPUT.stick && INPUT.stick.id === e.pointerId) { INPUT.stick = null; INPUT.mx = INPUT.mz = 0; INPUT.stickMag = 0; stickEl.style.display = 'none'; }
    if (INPUT.look && INPUT.look.id === e.pointerId) INPUT.look = null;
  };
  host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end); host.addEventListener('lostpointercapture', end);
  document.addEventListener('pointerlockchange', function () { INPUT.pointerLocked = document.pointerLockElement === host; });
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (!INPUT.keys[k]) {
      if (k === 'e' || k === 'enter') press('interact');
      if (k === 'f') press('flash');
      if (k === 'q') press('item');
      if (k === 'tab' || k === 'r') press('next');
      if (k === 'control' || k === 'c') press('crouch');
      if (k === 'escape' || k === 'p') press('pause');
      if (k >= '1' && k <= '9') press('slot' + k);
    }
    INPUT.keys[k] = true;
    if (['tab', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { INPUT.keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function () { INPUT.keys = {}; INPUT.breathBtn = false; });
}
function isTouchDevice() { return INPUT.lastTouchTime > 0 || ('ontouchstart' in window && navigator.maxTouchPoints > 0); }
function readMove() {
  var K = INPUT.keys, x = INPUT.mx, z = INPUT.mz, run = INPUT.stickMag > 0.92;
  var kx = (K['d'] || K['arrowright'] ? 1 : 0) - (K['a'] || K['arrowleft'] ? 1 : 0);
  var kz = (K['s'] || K['arrowdown'] ? 1 : 0) - (K['w'] || K['arrowup'] ? 1 : 0);
  if (kx || kz) { var l = Math.sqrt(kx * kx + kz * kz); x = kx / l; z = kz / l; run = !!K['shift']; if (!run) { x *= 0.75; z *= 0.75; } }
  return { x: x, z: z, mag: Math.min(1, Math.sqrt(x * x + z * z)), run: run, breath: !!(K[' '] || INPUT.breathBtn) };
}
