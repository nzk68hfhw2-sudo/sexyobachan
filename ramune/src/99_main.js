// ---- boot & main loop --------------------------------------------------------------
var LOOP = { last: 0, t: 0, err: false };
function boot() {
  setupPage(); loadSave();
  initUI();
  showScreen('<div class="rm-logo-pre">キケンな</div><div class="rm-logo" style="font-size:52px">ラムネ<br><span>シミュレーター</span></div><div id="rm-load" style="margin-top:14px;font-family:DotGothic16,monospace;opacity:.7">LOADING...</div>');
  loadThree(function () {
    try {
      initRenderer(); initInput();
      makeTextures();
      buildWorld();
      buildHallucinations();
      FAKE_BODY = newBody();
      // compile shaders up front so the first trip doesn't stutter
      try { RENDER.renderer.compile(RENDER.scene, RENDER.camera); } catch (e) {}
      if (SAVE.warned) toTitle(); else showWarning();
      LOOP.last = performance.now();
      requestAnimationFrame(frame);
      window.__rmReady = true;
    } catch (e) { showFatal('起動エラー', (e && e.stack) || String(e)); }
  });
}
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, Math.max(0.001, (ts - LOOP.last) / 1000)); LOOP.last = ts; LOOP.t += dt;
  try { tick(dt); } catch (e) { if (!LOOP.err) { LOOP.err = true; console.error(e); showFatal('Runtime error', (e && e.stack) || String(e)); } }
}
function tick(dt) {
  TRIPU.uT.value = LOOP.t; POSTU.uTime.value = LOOP.t; SKYU.uT.value = LOOP.t;
  updateUITimers(dt);
  adaptQuality(dt);
  var mode = GAME.mode, B;
  if (mode === 'title') {
    updateTitle(dt);
    B = FAKE_BODY;
  } else {
    B = GAME.B;
    if (mode === 'play') { updatePlay(dt); updatePhone(dt); }
    if (GAME.mode === 'end') updateEndFX(dt);
    updateHeld(dt);
    updateCamera(dt, B);
  }
  updateSmoke(dt);
  updateHallucinations(dt, B, RENDER.camera);
  updateTripVisuals(dt, B);
  updateWorldFX(dt);
  updateAudio(dt, B, { outdoor: mode === 'play' && isOutdoor() });
  renderFrame();
}
// debug hook for automated tests
window.__rmEval = function (code) { return eval(code); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
