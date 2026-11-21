// ---- input: touch (left = move, right = look, fire button) + mouse/keyboard --
var input = { mx: 0, mz: 0, lookX: 0, lookY: 0, fire: false, reload: false, sprint: false, aim: false, grenade: false, switchTo: null, locked: false, usedTouch: IS_MOBILE || (IS_TOUCH && window.matchMedia && matchMedia('(pointer:coarse)').matches) };
var SENS = store.get('sens', 1);
var keys = {};
var touchUI = {};
function inputActive() { return G.state === 'playing'; }

function setupInput() {
  // ---- keyboard / mouse
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    keys[e.code] = true;
    if (e.code === 'KeyR') input.reload = true;
    if (e.code === 'KeyG') input.grenade = true;
    if (e.code === 'KeyQ') input.switchTo = 'next';
    if (/^Digit[1-4]$/.test(e.code)) input.switchTo = +e.code.slice(5) - 1;
    if (e.code === 'Escape' || e.code === 'KeyP') { if (G.state === 'playing') pauseGame(); }
    if (inputActive() && /Arrow|Space/.test(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; input.fire = false; });
  var cv = renderer.domElement;
  cv.addEventListener('mousedown', function (e) {
    if (!inputActive() || input.usedTouch) return;
    audioInit();
    if (!input.locked && cv.requestPointerLock) { try { cv.requestPointerLock(); } catch (er) {} }
    if (e.button === 0) { input.fire = true; input.dragging = true; }
    if (e.button === 2) input.aim = true;
  });
  window.addEventListener('mouseup', function (e) { if (e.button === 0) { input.fire = false; input.dragging = false; } if (e.button === 2) input.aim = false; });
  cv.addEventListener('wheel', function (e) { if (inputActive()) { input.switchTo = e.deltaY > 0 ? 'next' : 'prev'; e.preventDefault(); } }, { passive: false });
  window.addEventListener('mousemove', function (e) {
    if (!inputActive() || input.usedTouch) return;
    if (input.locked || input.dragging) { input.lookX += (e.movementX || 0) * 0.0022 * SENS; input.lookY += (e.movementY || 0) * 0.0022 * SENS; }
  });
  document.addEventListener('pointerlockchange', function () {
    var was = input.locked; input.locked = document.pointerLockElement === cv;
    if (was && !input.locked && G.state === 'playing') pauseGame();
  });

  // ---- touch
  var layer = touchUI.layer = el('div', 'fr-touch', UI);
  touchUI.stickBase = el('div', 'fr-stick', layer); touchUI.stickKnob = el('div', 'fr-knob', touchUI.stickBase);
  touchUI.fire = el('div', 'fr-btn fr-fire', layer); touchUI.fire.innerHTML = '<i></i>';
  touchUI.reload = el('div', 'fr-btn fr-reload', layer, 'リロード');
  touchUI.aim = el('div', 'fr-btn fr-aim', layer, 'エイム'); touchUI.wsw = el('div', 'fr-btn fr-wsw', layer, '武器'); touchUI.nade = el('div', 'fr-btn fr-nade', layer, 'グレネード');
  var stick = null, look = null, fireT = null;
  if (input.usedTouch) ROOT.classList.add('fr-istouch');
  function place(x, y) { touchUI.stickBase.style.transform = 'translate(' + (x - 60) + 'px,' + (y - 60) + 'px)'; touchUI.stickBase.style.opacity = 1; }
  layer.addEventListener('touchstart', function (e) {
    e.preventDefault(); audioInit(); input.usedTouch = true; ROOT.classList.add('fr-istouch');
    if (!inputActive()) return;
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i], tg = t.target;
      if (tg.closest && tg.closest('.fr-reload')) { input.reload = true; continue; }
      if (tg.closest && tg.closest('.fr-aim')) { input.aim = !input.aim; touchUI.aim.classList.toggle('on', input.aim); continue; }
      if (tg.closest && tg.closest('.fr-wsw')) { input.switchTo = 'next'; continue; }
      if (tg.closest && tg.closest('.fr-nade')) { input.grenade = true; continue; }
      if (tg.closest && tg.closest('.fr-fire')) { if (!fireT) { fireT = { id: t.identifier, x: t.clientX, y: t.clientY }; input.fire = true; touchUI.fire.classList.add('on'); } continue; }
      if (t.clientX < window.innerWidth * 0.42 && !stick) { stick = { id: t.identifier, ox: t.clientX, oy: t.clientY }; place(t.clientX, t.clientY); touchUI.stickKnob.style.transform = 'translate(0,0)'; }
      else if (!look) look = { id: t.identifier, x: t.clientX, y: t.clientY };
    }
  }, { passive: false });
  layer.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (stick && t.identifier === stick.id) {
        var dx = t.clientX - stick.ox, dy = t.clientY - stick.oy, l = Math.hypot(dx, dy), R = 52;
        if (l > R) { dx *= R / l; dy *= R / l; l = R; }
        input.mx = dx / R; input.mz = dy / R; input.sprint = l > R * 0.93 && dy < 0;
        touchUI.stickKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      } else {
        var s = (look && t.identifier === look.id) ? look : (fireT && t.identifier === fireT.id) ? fireT : null;
        if (s) { input.lookX += (t.clientX - s.x) * 0.0052 * SENS; input.lookY += (t.clientY - s.y) * 0.0052 * SENS; s.x = t.clientX; s.y = t.clientY; }
      }
    }
  }, { passive: false });
  function end(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      var id = e.changedTouches[i].identifier;
      if (stick && id === stick.id) { stick = null; input.mx = input.mz = 0; input.sprint = false; touchUI.stickBase.style.opacity = 0; }
      if (look && id === look.id) look = null;
      if (fireT && id === fireT.id) { fireT = null; input.fire = false; touchUI.fire.classList.remove('on'); }
    }
  }
  layer.addEventListener('touchend', end, { passive: false }); layer.addEventListener('touchcancel', end, { passive: false });
  input.resetTouch = function () { stick = look = fireT = null; input.mx = input.mz = 0; input.fire = false; input.sprint = false; touchUI.stickBase.style.opacity = 0; touchUI.fire.classList.remove('on'); touchUI.aim.classList.remove('on'); };
}
function pollKeys() {
  if (input.usedTouch && !(keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD)) return;
  var x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), z = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  var l = Math.hypot(x, z) || 1; input.mx = x / l; input.mz = z / l; input.sprint = !!(keys.ShiftLeft || keys.ShiftRight);
  if (keys.Space) input.fire = true; else if (input.spaceFire) input.fire = false; input.spaceFire = !!keys.Space;
}
