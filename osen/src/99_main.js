// ---- 起動 ------------------------------------------------------------------------------
function boot() {
  try { setupPage(); } catch (e) { showFatal('画面の準備に失敗しました', e.message); return; }
  // フォントがそろうまで何も出さない（端末のフォントで一瞬表示されるのを防ぐ）
  loadEmbeddedFonts(function (fail) {
    WA_FONTS_READY = true;
    if (fail.length) BOOT_ERRORS.push('font:' + fail.join(','));
    try { showLoading(); } catch (e) { showFatal('読み込み画面の準備に失敗しました', e.message); return; }
    if (fail.length) setTimeout(function () { showFontWarn(fail); }, 50);
    setLoading(0.08, '3D表示の部品（three.js）を読み込み中…');
    loadThree(function () {
      setLoading(0.35, '８人の友達（3Dモデル）を解凍中…');
      setTimeout(function () {
        loadFriends(function () {
          setLoading(0.6, '町を建設中…（すこし時間がかかります）');
          setTimeout(function () {
            try { startGame(); }
            catch (e) { showFatal('町の建設中にエラーが起きました', (e && e.message) + '\n' + (e && e.stack || '').split('\n').slice(0, 5).join('\n')); }
          }, 30);
        });
      }, 30);
    });
  });
}
function showFontWarn(fail) {
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:2147483646;background:#fffbe0;color:#300;border:3px solid #c22;padding:10px;font:13px/1.5 sans-serif;white-space:pre-wrap;';
  d.textContent = '【診断】次のフォントを読み込めませんでした（ゲームは続けられますが、文字の形が変わります）：\n' + fail.map(function (n) { return n + '（' + (FONT_NAMES[n] || '') + '）'; }).join('\n');
  d.onclick = function () { d.remove(); };
  document.body.appendChild(d); setTimeout(function () { if (d.parentNode) d.remove(); }, 15000);
}
function startGame() {
  _tmp2 = new THREE.Vector3();
  var saved = loadGame();
  if (!PLAYER.name) PLAYER.name = makeName();
  buildTextures(); buildMaterials(LITE.on);
  if (!initRenderer()) return;
  buildWorld(R.scene);
  placeSigns(R.scene);
  placeProps(R.scene);
  initDebris(R.scene);
  initPlayer();
  initUI(); initTextUI(); initSmashUI(); initInput(); initNPCs(); initMobs(); initShopBooth(); initMeterTap();
  applyLoaded(saved);
  setPlayerChar(PLAYER.char || 0);
  if (LITE.on) setLite(true);
  updateRunBtn();
  if (FRIENDS.err) sysMsg('モデルの一部を読めませんでした：' + FRIENDS.err.slice(0, 60));
  setLoading(1, 'できあがり!!');
  window.__osReady = true;
  window.__os = { G: G, P: P, R: R, CAM: CAM, PROPS: PROPS, ITEMS: ITEMS, NPCS: NPCS, BAG: BAG, PLAYER: PLAYER, teleport: teleport, addPollution: addPollution, secret: secret, touchProp: touchProp, COL: COL, WORLD: WORLD, setQuality: setQuality,
    IN: IN, updatePlayer: updatePlayer, groundAt: groundAt, colQuery: colQuery, cnHTML: cnHTML, FONT_SUB: FONT_SUB, AUD: AUD, setLite: setLite, REDUCED: REDUCED, grab: grab, release: release, spawnItem: spawnItem,
    findRecipe: findRecipe, RECIPES: RECIPES, setPlayerChar: setPlayerChar, enterWorld: enterWorld, stepCharSel: stepCharSel, csDecide: csDecide, CS: CS, csShow: csShow, openWin: openWin, WIN: WIN, openBag: openBag, openZukan: openZukan, openStatus: openStatus, openSettings: openSettings, openPhrases: openPhrases, storeItem: storeItem, doSpecial: doSpecial, useSkill: useSkill, gesture: gesture, say: say, itemType: itemType, NET: NET, VOICE: VOICE, voiceStart: voiceStart, EXTRA_TYPES: EXTRA_TYPES, ITEM_INFO: ITEM_INFO, effMass: effMass, MUS: MUS, TEXTLV: TEXTLV, musStatus: musStatus, H: H, BRK: BRK, SMASH: SMASH, TUNE: TUNE, FEEL: FEEL, DEB: DEB, brkHit: brkHit, brkResetAll: brkResetAll, smashTackle: smashTackle, npcGrab: npcGrab, npcRelease: npcRelease, NPCHELD: NPCHELD, CHAOS: CHAOS, openShop: openShop, itemHit: itemHit, smashBlast: smashBlast, colTop: colTop };
  R.renderer.render(R.scene, R.camera);
  hideLoading(); showMenu();
  setTimeout(musicLoad, 1500); // 曲は最初の表示が終わってから読む
  requestAnimationFrame(function (ts) { _last = ts; loop(ts); });
}
