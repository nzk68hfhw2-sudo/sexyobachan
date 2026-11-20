// ---- 操作（スマホ：スティック＋右半分スライド＋ボタン / PC：WASD＋マウス） -----------------
var IN = { mx: 0, mz: 0, lookX: 0, lookY: 0, run: false, runHold: false, jump: false, touch: false, keys: {}, locked: false, stickId: null, lookId: null, lastLook: 0, isTouch: false, anyInput: 0, dragMouse: false };
var STICK = { el: null, knob: null, cx: 0, cy: 0, r: 58 };
function initInput() {
  var cv = R.renderer.domElement;
  IN.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  // ---- touch ----
  function stickCenter() { var b = STICK.el.getBoundingClientRect(); STICK.cx = b.left + b.width / 2; STICK.cy = b.top + b.height / 2; STICK.r = b.width / 2; }
  function onStart(e) {
    if (G.paused) return;
    audioInit();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i], W = window.innerWidth, H = window.innerHeight;
      if (t.clientX < W * 0.5 && IN.stickId === null && t.clientY > H * 0.35) { IN.stickId = t.identifier; stickCenter(); moveStick(t); }
      else if (IN.lookId === null) { IN.lookId = t.identifier; IN.lpx = t.clientX; IN.lpy = t.clientY; }
    }
    IN.anyInput = now();
    e.preventDefault();
  }
  function moveStick(t) {
    var dx = t.clientX - STICK.cx, dy = t.clientY - STICK.cy, d = Math.sqrt(dx * dx + dy * dy), m = STICK.r * 0.9;
    if (d > m) { dx *= m / d; dy *= m / d; }
    IN.mx = dx / m; IN.mz = dy / m;
    STICK.knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    STICK.el.classList.add('on');
  }
  function onMove(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === IN.stickId) moveStick(t);
      else if (t.identifier === IN.lookId) { IN.lookX += (t.clientX - IN.lpx); IN.lookY += (t.clientY - IN.lpy); IN.lpx = t.clientX; IN.lpy = t.clientY; IN.lastLook = now(); }
    }
    IN.anyInput = now();
    e.preventDefault();
  }
  function onEnd(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === IN.stickId) { IN.stickId = null; IN.mx = IN.mz = 0; STICK.knob.style.transform = ''; STICK.el.classList.remove('on'); }
      if (t.identifier === IN.lookId) IN.lookId = null;
    }
  }
  cv.addEventListener('touchstart', onStart, { passive: false });
  cv.addEventListener('touchmove', onMove, { passive: false });
  cv.addEventListener('touchend', onEnd); cv.addEventListener('touchcancel', onEnd);
  STICK.el.addEventListener('touchstart', function (e) { onStart(e); }, { passive: false });
  STICK.el.addEventListener('touchmove', onMove, { passive: false });
  STICK.el.addEventListener('touchend', onEnd); STICK.el.addEventListener('touchcancel', onEnd);
  window.addEventListener('touchend', function () { audioInit(); }, { passive: true });
  window.addEventListener('click', function () { audioInit(); });
  // ---- keyboard ----
  window.addEventListener('keydown', function (e) {
    if (G.paused && e.code !== 'Escape' && e.code !== 'KeyZ' && e.code !== 'Tab') return;
    audioInit();
    IN.keys[e.code] = true; IN.anyInput = now();
    if (e.code === 'Space') { IN.jump = true; e.preventDefault(); }
    if (e.code === 'KeyE' || e.code === 'Enter') IN.touch = true;
    if (e.code === 'KeyZ') toggleZukan();
    if (e.code === 'Tab') { toggleMenu(); e.preventDefault(); }
    if (e.code === 'KeyR') { IN.run = !IN.run; updateRunBtn(); }
  });
  window.addEventListener('keyup', function (e) { IN.keys[e.code] = false; });
  // ---- mouse ----
  cv.addEventListener('mousedown', function (e) {
    if (G.paused || IN.isTouch && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    audioInit();
    if (IN.locked) { IN.touch = true; return; }
    try { if (cv.requestPointerLock) cv.requestPointerLock(); } catch (er) {}
    IN.dragMouse = true; IN.lpx = e.clientX; IN.lpy = e.clientY; IN.mdownT = now();
  });
  window.addEventListener('mouseup', function (e) { if (IN.dragMouse && !IN.locked && now() - IN.mdownT < 250 && G.target) IN.touch = true; IN.dragMouse = false; });
  window.addEventListener('mousemove', function (e) {
    if (IN.locked) { IN.lookX += e.movementX || 0; IN.lookY += e.movementY || 0; IN.lastLook = now(); }
    else if (IN.dragMouse) { IN.lookX += e.clientX - IN.lpx; IN.lookY += e.clientY - IN.lpy; IN.lpx = e.clientX; IN.lpy = e.clientY; IN.lastLook = now(); }
  });
  document.addEventListener('pointerlockchange', function () { IN.locked = document.pointerLockElement === cv; IN.dragMouse = false; });
  window.addEventListener('blur', function () { IN.keys = {}; IN.mx = IN.mz = 0; });
}
function readMove() {
  var k = IN.keys, x = IN.mx, z = IN.mz;
  if (k.KeyW || k.ArrowUp) z -= 1; if (k.KeyS || k.ArrowDown) z += 1;
  if (k.KeyA || k.ArrowLeft) x -= 1; if (k.KeyD || k.ArrowRight) x += 1;
  var l = Math.sqrt(x * x + z * z); if (l > 1) { x /= l; z /= l; }
  return { x: x, z: z, run: IN.run || k.ShiftLeft || k.ShiftRight || IN.runHold };
}
