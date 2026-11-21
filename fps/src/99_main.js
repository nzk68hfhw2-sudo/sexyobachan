// ---- boot -------------------------------------------------------------------
function boot() {
  setupPage();
  var loading = el('div', 'fr-load', UI, 'LOADING…');
  (window.THREE && window.THREE.WebGLRenderer ? function (u, cb) { cb(null); } : loadScript)(THREE_URL, function (err) {
    if (err || !window.THREE) { showFatal('three.js を読み込めませんでした', '3D ライブラリ（cdnjs）への接続が止められている可能性があります。\n' + THREE_URL); return; }
    THREE = window.THREE;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, powerPreference: 'high-performance', alpha: false });
    } catch (e) { showFatal('WebGL を開始できませんでした', 'この端末またはアプリでは 3D 表示が使えません。\n' + e.message); return; }
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = IS_MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    CANVAS_HOST.appendChild(renderer.domElement);
    Q.tier = Q.mode === 'auto' ? initialTier() : Q.mode;
    setTimeout(function () {            // let the "LOADING" text paint first
      buildTextures(renderer, Q.tier === 0);
      buildWorld(); buildWeapon(); buildEnemyAssets(); buildFriends(); buildPickups(); buildStage(); buildUI(); buildShopUI(); buildAccountUI(); setupInput();
      gun.root.visible = false;
      window.addEventListener('resize', onResize); window.addEventListener('orientationchange', function () { setTimeout(onResize, 300); });
      document.addEventListener('visibilitychange', function () { if (document.hidden && G.state === 'playing') pauseGame(); });
      onResize();
      ['touchend', 'mousedown', 'keydown'].forEach(function (n) { window.addEventListener(n, audioInit, { passive: true }); });
      if (loading.parentNode) loading.parentNode.removeChild(loading);
      G.state = 'title'; showScreen('title');
      var mi = setInterval(function () {
        var s = MODEL_STATUS; if (s.boys === 'loading' || s.girls === 'loading') { H.modelNote.textContent = '仲間のモデルを読み込み中…'; return; }
        H.modelNote.textContent = (s.boys === 'ok' && s.girls === 'ok') ? '' : '※ 仲間の3Dモデルを読み込めなかったため、かんたんな人形で表示しています'; clearInterval(mi);
      }, 400);
      window.__frReady = true;
      window.__fr = { G: G, P: P, Q: Q, ENEMIES: ENEMIES, MODELS: MODELS, ACC: ACC, MODEL_STATUS: MODEL_STATUS, input: input, gun: gun, errors: RUNTIME_ERRORS, start: startGame, info: function () { return { tris: renderer.info.render.triangles, calls: renderer.info.render.calls }; }, catalog: function () { var o = {}; WORDER.forEach(function (w) { o['w_' + w] = ['weapon', WDEF[w].price]; }); [[SKINS, 'skin'], [HATS, 'hat'], [TRACERS, 'tracer'], [CROSSES, 'cross']].forEach(function (m) { Object.keys(m[0]).forEach(function (k) { o[k] = [m[1], m[0][k].price]; }); }); return o; }, startTdm: startTeamBattle, ECO: ECO, TDM_OPT: TDM_OPT, STAGE: STAGE, shop: SHOP, WDEF: WDEF, PICKS: PICKS, killAll: function () { G.queue.length = 0; ENEMIES.slice().forEach(function (e) { if (!e.dead && e.team !== P.team) damageActor(e, 9999, P, 'テスト', false, e.x, 1, e.z); }); }, spawnFriend: spawnFriend, hurt: hurtPlayer, end: endGame };
      requestAnimationFrame(frame);
    }, 30);
  });
}
if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
