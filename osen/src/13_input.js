// ---- 操作（スマホ：スティック・なぞって視点・ピンチで距離・ボタン / PC：WASD・マウス・ホイール・キー） ----
var IN = { mx: 0, mz: 0, lookX: 0, lookY: 0, zoom: 0, run: false, jump: false, main: false, touch2: false, special: false, throwIt: false, rotate: false, bigger: false, smaller: false, store: false,
  keys: {}, locked: false, stickId: null, lookId: null, pinch: null, lastLook: 0, isTouch: false, anyInput: 0, dragMouse: false };
var STICK = { el: null, knob: null, cx: 0, cy: 0, r: 58 };
function initInput() {
  var cv = R.renderer.domElement;
  IN.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  function stickCenter() { var b = STICK.el.getBoundingClientRect(); STICK.cx = b.left + b.width / 2; STICK.cy = b.top + b.height / 2; STICK.r = b.width / 2; }
  var touches = {};
  function onStart(e) {
    audioInit();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i], W = window.innerWidth, Hh = window.innerHeight;
      if (e.currentTarget === STICK.el || (t.clientX < W * 0.42 && t.clientY > Hh * 0.5 && IN.stickId === null && !G.paused)) { if (IN.stickId === null) { IN.stickId = t.identifier; stickCenter(); moveStick(t); continue; } }
      touches[t.identifier] = { x: t.clientX, y: t.clientY };
    }
    var ids = Object.keys(touches);
    if (ids.length >= 2) { var a = touches[ids[0]], b = touches[ids[1]]; IN.pinch = Math.hypot(a.x - b.x, a.y - b.y); IN.lookId = null; }
    else if (ids.length === 1) IN.lookId = +ids[0];
    IN.anyInput = now(); e.preventDefault();
  }
  function moveStick(t) {
    var dx = t.clientX - STICK.cx, dy = t.clientY - STICK.cy, d = Math.sqrt(dx * dx + dy * dy), m = STICK.r * 0.85;
    if (d > m) { dx *= m / d; dy *= m / d; }
    IN.mx = dx / m; IN.mz = dy / m; STICK.knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  }
  function onMove(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === IN.stickId) { moveStick(t); continue; }
      var p = touches[t.identifier]; if (!p) continue;
      if (IN.pinch == null && t.identifier === IN.lookId) { IN.lookX += t.clientX - p.x; IN.lookY += t.clientY - p.y; IN.lastLook = now(); }
      p.x = t.clientX; p.y = t.clientY;
    }
    var ids = Object.keys(touches);
    if (IN.pinch != null && ids.length >= 2) { var a = touches[ids[0]], b = touches[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y); IN.zoom += (IN.pinch - d) * 0.02; IN.pinch = d; }
    IN.anyInput = now(); e.preventDefault();
  }
  function onEnd(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === IN.stickId) { IN.stickId = null; IN.mx = IN.mz = 0; STICK.knob.style.transform = ''; }
      delete touches[t.identifier]; if (t.identifier === IN.lookId) IN.lookId = null;
    }
    var ids = Object.keys(touches); if (ids.length < 2) IN.pinch = null; if (ids.length === 1) IN.lookId = +ids[0];
  }
  cv.addEventListener('touchstart', onStart, { passive: false }); cv.addEventListener('touchmove', onMove, { passive: false });
  cv.addEventListener('touchend', onEnd); cv.addEventListener('touchcancel', onEnd);
  STICK.el.addEventListener('touchstart', onStart, { passive: false }); STICK.el.addEventListener('touchmove', onMove, { passive: false });
  STICK.el.addEventListener('touchend', onEnd); STICK.el.addEventListener('touchcancel', onEnd);
  window.addEventListener('touchend', function () { audioInit(); }, { passive: true });
  window.addEventListener('click', function () { audioInit(); });
  // ---- キーボード ----
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    audioInit(); IN.keys[e.code] = true; IN.anyInput = now();
    if (G.inMenu) return;
    var c2 = e.code;
    if (c2 === 'Space') { IN.jump = true; e.preventDefault(); }
    if (c2 === 'KeyE' || c2 === 'Enter') IN.main = true;
    if (c2 === 'KeyF') IN.touch2 = true;
    if (c2 === 'KeyG') IN.special = true;
    if (c2 === 'KeyQ') IN.throwIt = true;
    if (c2 === 'KeyV' || c2 === 'KeyB') IN.tackle = true;
    if (c2 === 'KeyR') IN.rotate = true;
    if (c2 === 'KeyZ') IN.smaller = true;
    if (c2 === 'KeyX') IN.bigger = true;
    if (c2 === 'KeyC') IN.store = true;
    if (c2 === 'KeyT') { IN.run = !IN.run; updateRunBtn(); }
    if (c2 === 'KeyI') openBag();
    if (c2 === 'KeyM') openMapWin();
    if (c2 === 'Tab') { openSettings(); e.preventDefault(); }
    if (c2 === 'Escape') Object.keys(WIN.list).forEach(function (k) { closeWin(k, true); });
    var n = /^Digit([1-9])$/.exec(c2); if (n) SLOTS[+n[1] - 1].fn();
  });
  window.addEventListener('keyup', function (e) { IN.keys[e.code] = false; });
  // ---- マウス（クリックで視点をつかむ。ホイールで距離） ----
  cv.addEventListener('mousedown', function (e) {
    if (G.inMenu || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return;
    audioInit();
    if (IN.locked) { if (e.button === 2) { if (ITEMS.held || NPCHELD.n) IN.throwIt = true; else IN.tackle = true; } else IN.main = true; return; }
    IN.dragMouse = true; IN.lpx = e.clientX; IN.lpy = e.clientY; IN.mdownT = now(); IN.mmoved = 0;
  });
  window.addEventListener('mouseup', function (e) {
    if (IN.dragMouse && !IN.locked && now() - IN.mdownT < 260 && IN.mmoved < 6) { try { if (cv.requestPointerLock) cv.requestPointerLock(); } catch (er) {} }
    IN.dragMouse = false;
  });
  window.addEventListener('mousemove', function (e) {
    if (IN.locked) { IN.lookX += (e.movementX || 0) * 0.5; IN.lookY += (e.movementY || 0) * 0.5; IN.lastLook = now(); }
    else if (IN.dragMouse) { IN.lookX += e.clientX - IN.lpx; IN.lookY += e.clientY - IN.lpy; IN.mmoved += Math.abs(e.clientX - IN.lpx) + Math.abs(e.clientY - IN.lpy); IN.lpx = e.clientX; IN.lpy = e.clientY; IN.lastLook = now(); }
  });
  cv.addEventListener('wheel', function (e) { IN.zoom += e.deltaY * 0.004; e.preventDefault(); }, { passive: false });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('pointerlockchange', function () { IN.locked = document.pointerLockElement === cv; IN.dragMouse = false; });
  window.addEventListener('blur', function () { IN.keys = {}; IN.mx = IN.mz = 0; });
}
function readMove() {
  var k = IN.keys, x = IN.mx, z = IN.mz;
  if (k.KeyW || k.ArrowUp) z -= 1; if (k.KeyS || k.ArrowDown) z += 1;
  if (k.KeyA || k.ArrowLeft) x -= 1; if (k.KeyD || k.ArrowRight) x += 1;
  var l = Math.sqrt(x * x + z * z); if (l > 1) { x /= l; z /= l; }
  return { x: x, z: z, run: IN.run || k.ShiftLeft || k.ShiftRight };
}
