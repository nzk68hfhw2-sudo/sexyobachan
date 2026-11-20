// ---- 起動 ------------------------------------------------------------------------------
// ワードアートで使う字の一覧（フォントはこの字だけ取り寄せる）
function waCharset() {
  var parts = ['よみこみ中精神汚染ゲーム～はちにんの町あそびかた説明書せっていずかん汚染率％０１２３４５６７８９0123456789∞＋－!?！？・。、「」（）ＮＥＷ電车がまいります１３回目の奇跡存在しない部屋',
    'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  AREAS.forEach(function (a) { parts.push(a.wa, a.name); });
  STAGES.forEach(function (s) { parts.push(s.wa); }); TIMES.forEach(function (t) { parts.push(t.wa); });
  parts.push(BIG_WORDS.join('')); PROP_DEFS.forEach(function (d) { parts.push(d.n, (d.o && d.o.label) || ''); });
  SECRETS.forEach(function (s) { parts.push(s.n); }); OMIKUJI.forEach(function (o) { parts.push(o[0]); });
  AUTO_TALK.forEach(function (l) { parts.push(l.slice(0, 8)); });
  parts.push(SIGN_WORDS);
  var s = parts.join(''), u = '';
  for (var i = 0; i < s.length; i++) { var c = s[i]; if (c > ' ' && u.indexOf(c) < 0 && !isCN(c)) u += c; }
  return u;
}
var SIGN_WORDS = 'よにん駅?はちにんきっぷうりばぱぶ駅前ロータソリーバス停てい停ハようこそ!!??よにん通り商店街会しょうてんがいコソビニコンビニンコ喫茶ジャスミソヌンブティック分け目フ日八百屋やおはっぴゃくくすりぃ魚屋ぎょうお本屋木電器の店とけいふとんぶ肉内写真館舘おもちゃや花化カラオケヶニューハイツ団地シ号棟凍記念公園园ぬるま川い謎の空き地関係神社っぽい所くないここはないあるＥＸＩＴ時刻表１玉100万円福引きおみくじ';
function waitFonts(cb) {
  var done = false, fin = function () { if (done) return; done = true; WA_FONTS_READY = true; for (var k in WA_CACHE) delete WA_CACHE[k]; cb(); };
  if (!document.fonts || !document.fonts.load) return fin();
  var sample = waCharset();
  var jobs = WA_FONTS.filter(function (f) { return f !== 'Zen Kaku Gothic New'; }).map(function (f) { return document.fonts.load((f === 'Kaisei Decol' ? '700' : '400') + ' 40px "' + f + '"', sample).catch(function () {}); });
  jobs.push(document.fonts.load('900 40px "Noto Sans SC"', CN_CHARS_ALL).catch(function () {}));
  jobs.push(document.fonts.load('900 40px "Zen Kaku Gothic New"', '汚染率図鑑設定注意').catch(function () {}));
  jobs.push(document.fonts.load('400 40px Bungee', 'NEW').catch(function () {}));
  var to = setTimeout(function () {
    fin();
    // 遅れて届いたフォントで看板を描き直す
    Promise.all(jobs).then(function () { for (var k in WA_CACHE) delete WA_CACHE[k]; if (SIGNS.length) redrawSigns(signLevel(G.stage)); _polShown = null; });
  }, 8000);
  Promise.all(jobs).then(function () { clearTimeout(to); fin(); });
}
function boot() {
  try { setupPage(); } catch (e) { showFatal('画面の準備に失敗しました', e.message); return; }
  showLoading(); setLoading(0.05, '3D表示の部品（three.js）を読み込み中…');
  loadThree(function () {
    setLoading(0.3, 'フォント（ワードアート用）を読み込み中…');
    waitFonts(function () {
      drawLoadingTitle();
      setLoading(0.55, '８人の友達（3Dモデル）を解凍中…');
      setTimeout(function () {
        loadFriends(function () {
          setLoading(0.75, '町を建設中…（すこし時間がかかります）');
          setTimeout(function () {
            try { startGame(); }
            catch (e) { showFatal('町の建設中にエラーが起きました', (e && e.message) + '\n' + (e && e.stack || '').split('\n').slice(0, 5).join('\n')); }
          }, 30);
        });
      }, 30);
    });
  });
}
function startGame() {
  _tmp2 = new THREE.Vector3();
  var saved = loadGame();
  buildTextures(); buildMaterials(LITE.on);
  if (!initRenderer()) return;
  buildWorld(R.scene);
  placeSigns(R.scene);
  placeProps(R.scene);
  initPlayer();
  initUI(); initInput(); initMeterTap();
  applyLoaded(saved);
  if (LITE.on) setLite(true);
  updateRunBtn();
  if (FRIENDS.err) toast('モデルの一部を読めませんでした：' + FRIENDS.err.slice(0, 60), 'burst');
  setLoading(1, 'できあがり!!');
  window.__osReady = true;
  window.__os = { G: G, P: P, R: R, PROPS: PROPS, teleport: teleport, addPollution: addPollution, secret: secret, touchProp: touchProp, COL: COL, WORLD: WORLD, setQuality: setQuality, IN: IN, updatePlayer: updatePlayer, groundAt: groundAt, colQuery: colQuery, cnHTML: cnHTML, FONT_SUB: FONT_SUB, AUD: AUD, setLite: setLite, REDUCED: REDUCED };
  R.renderer.render(R.scene, R.camera);
  hideLoading(); showIntro();
  bgmPlay('title');
  requestAnimationFrame(function (ts) { _last = ts; loop(ts); });
}
