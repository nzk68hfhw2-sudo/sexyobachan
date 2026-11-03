// ---- boot & main loop --------------------------------------------------------------
var LOOP = { last: 0, t: 0 };
var _camShake = { x: 0, y: 0 };
function preloadFaces(onProgress) {
  return new Promise(function (resolve) {
    var loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    var left = 40, failed = [];
    for (var i = 1; i <= 40; i++) (function (i) {
      var url = assetURL('images/face_' + (i < 10 ? '0' : '') + i + '.jpg');
      loader.load(url, function (t) { t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; FACE_TEX[i] = t; done(); },
        undefined, function () { failed.push(i); var c = mkCanvas(64, 64); c.getContext('2d').fillStyle = '#222'; c.getContext('2d').fillRect(0, 0, 64, 64); FACE_TEX[i] = toTex(c, { clamp: true }); done(); });
    })(i);
    function done() { left--; if (onProgress) onProgress(40 - left); if (left === 0) { if (failed.length) showFatal('画像の読み込みに失敗 (images failed to load: ' + failed.length + ')', 'CORS設定 (_headers) とURLを確認してください:\n' + assetURL('images/face_01.jpg')); resolve(); } }
  });
}
function boot() {
  setupPage(); loadSave();
  initUI();
  showScreen('loading', '<div style="position:absolute;inset:0;background:#000"></div><div class="hp-panel"><div style="font:24px VT323;color:#ddd;letter-spacing:.2em" class="hp-blink">LOADING TAPE...</div><div id="hp-load-p" style="font:16px VT323;color:#777;margin-top:8px">0%</div></div>');
  loadThree(async function () {
    try {
      initRenderer(); initInput();
      var pEl = document.getElementById('hp-load-p');
      await preloadFaces(function (n) { if (pEl) pEl.textContent = Math.round(n / 40 * 80) + '%'; });
      initGeoTemplates(); makeWorldMaterials();
      if (pEl) pEl.textContent = '90%';
      // upload face textures to GPU now so a jumpscare never waits
      for (var i = 1; i <= 40; i++) try { RENDER.renderer.initTexture(FACE_TEX[i]); } catch (e) {}
      POSTU.tFace.value = FACE_TEX[8];
      buildTitleScene();
      PLAYER_LIGHT.spot = new THREE.SpotLight(0xfff1dc, 0, 20, 0.48, 0.55, 2.0);
      PLAYER_LIGHT.spot.castShadow = RENDER.renderer.shadowMap.enabled;
      PLAYER_LIGHT.spot.shadow.mapSize.set(512, 512); PLAYER_LIGHT.spot.shadow.camera.near = 0.2; PLAYER_LIGHT.spot.shadow.bias = -0.0015;
      RENDER.camera.add(PLAYER_LIGHT.spot); PLAYER_LIGHT.spot.position.set(0.18, -0.12, 0.05);
      PLAYER_LIGHT.target = new THREE.Object3D(); RENDER.camera.add(PLAYER_LIGHT.target); PLAYER_LIGHT.target.position.set(0, -0.15, -5); PLAYER_LIGHT.spot.target = PLAYER_LIGHT.target;
      hideScreen('loading');
      showWarning();
      LOOP.last = performance.now();
      requestAnimationFrame(frame);
      window.__hpReady = true;
    } catch (e) { showFatal('起動エラー (boot error)', (e && e.stack) || String(e)); }
  });
}
function frame(ts) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, Math.max(0.001, (ts - LOOP.last) / 1000)); LOOP.last = ts; dt *= (LOOP.scale || 1); LOOP.t += dt;
  try { tick(dt); } catch (e) { if (!LOOP.err) { LOOP.err = true; console.error(e); showFatal('Runtime error', (e && e.stack) || String(e)); } }
}
function tick(dt) {
  LIGHTU.uTime.value = LOOP.t; POSTU.uTime.value = LOOP.t;
  updateUITimers(dt);
  adaptQuality(dt);
  var mode = GAME.mode;
  if (mode === 'freeze') return;
  if (mode === 'title' || mode === 'warning') { updateTitle(dt); return; }
  if (!PL || !WORLD) { RENDER.renderer.setRenderTarget(null); RENDER.renderer.clear(); return; }
  if (mode === 'play') {
    updateTimers(dt);
    updateLights(dt);
    updatePlay(dt);
    updateLesson(dt);
    if (GAME.mode === 'play') updateNPCsVisibility();
  } else if (mode === 'dead') {
    updateLights(dt);
    updateJumpscare(dt);
  } else if (mode === 'read' || mode === 'cut') {
    updateLights(dt);
  }
  updateCamera(dt);
  updatePost(dt);
  updateLevelVisibility();
  if (AU.ready) updateAudio(dt, RENDER.camera);
  if (mode !== 'pause' || LOOP._pauseFrames++ < 2) renderFrame();
  if (mode !== 'pause') LOOP._pauseFrames = 0;
}
function updateNPCsVisibility() { }
function updateCamera(dt) {
  var cam = RENDER.camera, P = PL;
  var x = P.x, z = P.z, y = P.y + P.eye;
  if (P.seated) { y = LV_Y[P.seated.li] + (P.seated.kind === 'stool' ? 1.32 : 1.15); var c = P.seated; x = c.x - Math.sin(c.rot) * 0.05; z = c.z - Math.cos(c.rot) * 0.05; }
  if (P.hidden) { var h = P.hidden; y = h.y; x = h.x; z = h.z; if (h.type === 'locker') { x += Math.sin(h.rot) * 0.12; z += Math.cos(h.rot) * 0.12; } }
  // head bob
  var bobA = P.moving && !P.hidden && !P.seated ? (P.running ? 0.055 : 0.03) : 0;
  var by = Math.abs(Math.sin(P.bob * 3.1)) * bobA, bx = Math.sin(P.bob * 3.1) * bobA * 0.6;
  if (P.breath) { y -= 0.01; }
  P.shake = Math.max(0, P.shake - dt * 2);
  var sh = P.shake * (SAVE.settings.scare === 'MILD' ? 0.3 : 1) + PL.fear * 0.004;
  _camShake.x = damp(_camShake.x, (R() - 0.5) * sh * 0.08, 30, dt); _camShake.y = damp(_camShake.y, (R() - 0.5) * sh * 0.08, 30, dt);
  cam.position.set(x + Math.cos(P.yaw) * bx, y + by + _camShake.y, z - Math.sin(P.yaw) * bx);
  cam.rotation.set(P.pitch + _camShake.x, P.yaw, (P.running ? Math.sin(P.bob * 3.1) * 0.006 : 0), 'YXZ');
  // flashlight (lags a little behind the view)
  var sp = PLAYER_LIGHT.spot;
  var on = P.flash && P.flashDead <= 0 && GAME.mode !== 'title';
  var flick = 1;
  if (P.battery < 15) flick = Math.sin(LOOP.t * 23) > 0.2 ? 1 : 0.3;
  var near = monsterFear(); if (near.m && near.m.type === 'static' && near.f > 0.3) flick *= R() < 0.4 ? 0.1 : 1;
  sp.intensity = on ? 1.0 * flick : 0;
  PLAYER_LIGHT.target.position.x = damp(PLAYER_LIGHT.target.position.x, -INPUT.mx * 0.4, 4, dt);
  // fog / exposure by lights
  var dark = 1 - LIGHTU.uMix.value;
  var fog = RENDER.scene.fog || (RENDER.scene.fog = new THREE.FogExp2(0x000000, 0.03));
  fog.color.setRGB(lerp(0.08, 0.004, dark), lerp(0.085, 0.006, dark), lerp(0.075, 0.012, dark));
  fog.density = lerp(0.018, 0.07, dark) * (P.li === 0 ? 1.3 : 1);
}
function updatePost(dt) {
  var dark = 1 - LIGHTU.uMix.value;
  if (GAME.mode === 'dead') return;
  var near = PL ? monsterFear() : { f: 0, m: null };
  var stat = near.m && near.m.type === 'static' ? near.f : 0;
  POSTU.uVHS.value = lerp(0.14, 1, dark);
  POSTU.uTint.value = dark;
  POSTU.uDesat.value = dark * 0.22;
  POSTU.uExposure.value = lerp(1.0, 1.6, dark) * (PL && PL.li === 0 ? 1.1 : 1);
  POSTU.uFear.value = PL ? PL.fear : 0;
  POSTU.uAberr.value = 0.5 + (PL ? PL.fear : 0) * 1.5;
  POSTU.uGrain.value = 0.035 + dark * 0.02;
  POSTU.uTrack.value = damp(POSTU.uTrack.value, stat * 0.8 + (FLICK.amt > 0.3 ? 0.4 : 0), 6, dt);
  POSTU.uGlitch.value = damp(POSTU.uGlitch.value, stat > 0.4 ? stat : 0, 8, dt);
  POSTU.uRed.value = Math.max(0, POSTU.uRed.value - dt * 0.8);
  POSTU.uWarm.value = 0;
  POSTU.uLowHP.value = PL && PL.breath ? clamp(PL.breathT / 7, 0, 1) : 0;
  if (POSTU.uFlash.value > 0 && GAME.mode === 'play') POSTU.uFlash.value = Math.max(0, POSTU.uFlash.value - dt * 3);
  if (AU.ready && PL) { setLoop('room', dark * 0.06, 0.5); }
}
// show only the floors that can be seen
function updateLevelVisibility() {
  if (!WORLD) return;
  var li = PL.li;
  var inStairs = MAP.lv[li].type[cidx(m2c(PL.x), m2r(PL.z))] === T_STAIR;
  var rm = roomAt(li, PL.x, PL.z);
  var stairRoom = rm && rm.role === 'STAIRS';
  var vis = [false, false, false];
  vis[li] = true;
  if (inStairs || stairRoom) { vis[0] = vis[0] || (PL.x > 41 && li <= 1); vis[1] = true; vis[2] = vis[2] || li >= 1; }
  for (var i = 0; i < WORLD.chunks.length; i++) { var c = WORLD.chunks[i]; c.mesh.visible = vis[c.li] || (c.li === 1 && c.cz === 0 && li === 2); }
  WORLD.glass.forEach(function (g) { g.visible = vis[g.userData.li]; });
}
boot();
