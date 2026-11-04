// ---- boot sequence & main loop -------------------------------------------------
var CLOCK = { t: 0, last: 0, dt: 0, paused: false };
var HOOKS = []; // per-frame updaters fn(dt,t)
function onFrame(fn) { HOOKS.push(fn); }
function bakeEnvironment() {
  var ex = [WORLD.window];
  try { RENDER.scene.environment = bakeEnv(new THREE.Vector3(0.4, 1.7, 0.6), ex); } catch (e) { BOOT_ERRORS.push('env ' + e.message); }
}
function mainLoop() {
  requestAnimationFrame(mainLoop);
  var n = performance.now() / 1000, dt = Math.min(DEV ? 0.25 : 0.05, n - (CLOCK.last || n)); CLOCK.last = n;
  CLOCK.dt = dt; CLOCK.t += dt;
  var t = CLOCK.t;
  // follow the real size of the page (embedded frames can grow after start without a resize event)
  var cw = ROOT.clientWidth || window.innerWidth, ch = ROOT.clientHeight || window.innerHeight;
  if (cw !== RENDER.w || ch !== RENDER.h) onResize();
  try {
    for (var i = 0; i < HOOKS.length; i++) HOOKS[i](dt, t);
    updateLights(dt, t);
    updateCamera(dt, t);
    PU.uTime.value = t;
    renderFrame();
    adaptQuality(dt);
  } catch (e) { if (!mainLoop.err) { mainLoop.err = 1; BOOT_ERRORS.push('loop ' + e.message); console.error(e); } }
}
function boot() {
  setupPage();
  loadSave();
  loadThree(function () {
    waitFonts(function () {
      try {
        initRenderer();
        buildTextures();
        buildMaterials();
        buildDiner();
        buildLights();
        if (typeof buildFX === 'function') buildFX();
        camSetStation('COUNTER', true);
        WORLD.focusables = [WORLD.interior];
        initInput();
        RENDER.renderer.shadowMap.needsUpdate = true;
        RENDER.renderer.render(RENDER.scene, RENDER.camera);
        bakeEnvironment();
        RENDER.shadowDirty = true;
        if (typeof initGame === 'function') initGame();
        window.__ssdReady = true;
        try { if (window.ResizeObserver) new ResizeObserver(function () { onResize(); }).observe(ROOT); } catch (e) {}
        mainLoop();
      } catch (e) { console.error(e); showFatal('起動中にエラーが起きました', (e && e.stack) || String(e)); }
    });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
