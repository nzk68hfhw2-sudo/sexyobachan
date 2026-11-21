// ---- DOM UI: HUD, title, pause, results, settings ---------------------------
var BASE_CSS = [
'html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden;overscroll-behavior:none}',
'#fr-root{position:fixed;inset:0;left:0;top:0;right:0;bottom:0;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif;color:#fff;z-index:2147483000}',
'#fr-canvas,#fr-ui{position:absolute;left:0;top:0;width:100%;height:100%}#fr-canvas canvas{display:block;width:100%;height:100%}',
'#fr-ui{pointer-events:none}#fr-ui>*{pointer-events:auto}',
'.fr-touch{position:absolute;left:0;top:0;width:100%;height:100%;display:none}.fr-play .fr-touch{display:block}',
'.fr-stick{position:absolute;left:0;top:0;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(255,255,255,.07);opacity:0;transition:opacity .15s;pointer-events:none}',
'.fr-knob{position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.45)}',
'.fr-btn{position:absolute;display:none;align-items:center;justify-content:center;border-radius:50%;border:2px solid rgba(255,255,255,.5);background:rgba(20,20,20,.35);color:#fff;font-weight:700}',
'.fr-istouch .fr-btn{display:flex}',
'.fr-fire{right:calc(env(safe-area-inset-right,0px) + 26px);bottom:calc(env(safe-area-inset-bottom,0px) + 70px);width:92px;height:92px}.fr-fire i{width:34px;height:34px;border-radius:50%;background:rgba(255,90,60,.85);display:block}.fr-fire.on{background:rgba(255,90,60,.4)}',
'.fr-reload{right:calc(env(safe-area-inset-right,0px) + 132px);bottom:calc(env(safe-area-inset-bottom,0px) + 40px);width:64px;height:64px;font-size:11px}',
'.fr-hud{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none!important;display:none;text-shadow:0 1px 3px rgba(0,0,0,.8)}.fr-play .fr-hud{display:block}',
'.fr-top{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 8px);display:flex;justify-content:space-between;align-items:flex-start;padding:0 calc(env(safe-area-inset-right,0px) + 12px) 0 calc(env(safe-area-inset-left,0px) + 12px)}',
'.fr-hpbox{width:34vw;max-width:220px}.fr-hpbar{height:10px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.5);border-radius:6px;overflow:hidden}.fr-hpfill{height:100%;width:100%;background:linear-gradient(90deg,#6fe07a,#c7f25a);transition:width .15s}.fr-hpbox.low .fr-hpfill{background:#ff4a3a}',
'.fr-small{font-size:12px;opacity:.9;margin-top:3px;font-weight:600}',
'.fr-mid{text-align:center;flex:1;font-weight:800;font-size:14px}.fr-dots{display:flex;gap:4px;justify-content:center;margin-top:4px}.fr-dots i{width:9px;height:9px;border-radius:50%;border:1px solid rgba(255,255,255,.7);display:block}.fr-dots i.on{background:#7dffb0;border-color:#7dffb0}.fr-dots i.cur{border-color:#ffb14a;box-shadow:0 0 6px #ffb14a}',
'.fr-right{text-align:right;min-width:90px}.fr-score{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}',
'.fr-pause{pointer-events:auto!important;display:inline-flex;margin-top:6px;width:38px;height:38px;border-radius:9px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.4);align-items:center;justify-content:center;font-size:14px;font-weight:900;letter-spacing:2px}',
'.fr-ammo{position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);bottom:calc(env(safe-area-inset-bottom,0px) + 18px);font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}.fr-ammo small{font-size:14px;opacity:.7}.fr-istouch .fr-ammo{bottom:calc(env(safe-area-inset-bottom,0px) + 224px);right:calc(env(safe-area-inset-right,0px) + 34px);font-size:22px}.fr-ammo.low{color:#ff6a4a}',
'.fr-cross{position:absolute;left:50%;top:50%;width:0;height:0}.fr-cross b{position:absolute;background:#fff;box-shadow:0 0 2px #000}.fr-cross .d{width:3px;height:3px;left:-1.5px;top:-1.5px;border-radius:50%}',
'.fr-hitm{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;opacity:0;transform:rotate(45deg)}.fr-hitm:before,.fr-hitm:after{content:"";position:absolute;background:#fff;box-shadow:0 0 3px #000}.fr-hitm:before{left:12px;top:0;width:2px;height:26px}.fr-hitm:after{top:12px;left:0;height:2px;width:26px}.fr-hitm.k:before,.fr-hitm.k:after{background:#ff4a3a}.fr-hitm.c:before,.fr-hitm.c:after{background:#ffd54a}',
'.fr-vig{position:absolute;left:0;top:0;width:100%;height:100%;opacity:0;background:radial-gradient(ellipse at center,rgba(255,0,0,0) 28%,rgba(190,0,0,.85) 100%)}',
'.fr-dmg{position:absolute;left:50%;top:50%;width:0;height:0;opacity:0}.fr-dmg i{position:absolute;left:-60px;top:-150px;width:120px;height:26px;border-radius:120px 120px 0 0/26px 26px 0 0;background:linear-gradient(180deg,rgba(255,40,30,.95),rgba(255,40,30,0))}',
'.fr-banner{position:absolute;left:0;right:0;top:24%;text-align:center;opacity:0;transition:opacity .3s}.fr-banner h2{margin:0;font-size:30px;letter-spacing:.12em;font-weight:900}.fr-banner p{margin:6px 16px 0;font-size:15px;font-weight:700}',
'.fr-feed{position:absolute;left:50%;top:60%;transform:translateX(-50%);text-align:center;font-size:13px;font-weight:700;color:#ffe9a8}.fr-feed div{animation:frfeed 1.3s forwards}@keyframes frfeed{0%{opacity:0;transform:translateY(8px)}15%{opacity:1;transform:none}75%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}',
'.fr-mark{position:absolute;left:0;top:0;display:none;font-size:11px;font-weight:800;color:#7dffb0;text-align:center;width:80px;margin-left:-40px}.fr-mark:before{content:"";display:block;margin:0 auto 2px;width:14px;height:14px;border:2px solid #7dffb0;transform:rotate(45deg);box-shadow:0 0 8px #7dffb0}',
'.fr-screen{position:absolute;left:0;top:0;width:100%;height:100%;display:none;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(8,10,14,.55),rgba(8,10,14,.82));text-align:center;padding:calc(env(safe-area-inset-top,0px) + 12px) 16px calc(env(safe-area-inset-bottom,0px) + 12px);box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch}',
'.fr-screen.on{display:flex}.fr-screen h1{margin:0;font-size:clamp(30px,9vw,64px);letter-spacing:.06em;font-weight:900;line-height:1.05}.fr-screen h1 span{color:#ffb14a}.fr-screen h3{margin:6px 0 14px;font-size:15px;font-weight:700;letter-spacing:.3em;opacity:.9}',
'.fr-screen p{margin:4px 0;font-size:13px;line-height:1.6;opacity:.92;max-width:520px}',
'.fr-b{display:block;width:min(300px,78vw);margin:7px auto;padding:13px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff;font-size:16px;font-weight:800;cursor:pointer;box-sizing:border-box}.fr-b.pri{background:#ff7a2a;border-color:#ff9a4a;color:#1a0d02}.fr-b:active{transform:scale(.97)}.fr-b.sm{padding:9px;font-size:13px;font-weight:700}',
'.fr-row{display:flex;align-items:center;justify-content:space-between;gap:10px;width:min(320px,82vw);margin:8px auto;font-size:14px;font-weight:700}.fr-row input[type=range]{flex:1;max-width:170px}.fr-seg{display:flex;gap:4px}.fr-seg span{padding:6px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.3);font-size:12px;cursor:pointer}.fr-seg span.on{background:#ff7a2a;color:#1a0d02;border-color:#ff7a2a}',
'.fr-stat{display:grid;grid-template-columns:auto auto;gap:4px 18px;margin:10px auto;font-size:14px;text-align:left}.fr-stat b{text-align:right;font-variant-numeric:tabular-nums}',
'.fr-big{font-size:44px;font-weight:900;color:#ffb14a;font-variant-numeric:tabular-nums}',
'.fr-note{font-size:11px!important;opacity:.65!important}',
'.fr-in{display:block;width:min(300px,78vw);margin:7px auto;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.45);color:#fff;font-size:16px;box-sizing:border-box;-webkit-user-select:text;user-select:text;outline:none}',
'.fr-aim{right:calc(env(safe-area-inset-right,0px) + 128px);bottom:calc(env(safe-area-inset-bottom,0px) + 112px);width:62px;height:62px;font-size:11px}.fr-aim.on{background:rgba(90,180,255,.5);border-color:#8cf}',
'.fr-wsw{right:calc(env(safe-area-inset-right,0px) + 30px);bottom:calc(env(safe-area-inset-bottom,0px) + 176px);width:84px;height:40px;border-radius:12px;font-size:11px}',
'.fr-nade{right:calc(env(safe-area-inset-right,0px) + 56px);bottom:calc(env(safe-area-inset-bottom,0px) + 8px);width:56px;height:52px;font-size:10px;flex-direction:column;line-height:1.1}',
'.fr-scope{position:absolute;left:0;top:0;width:100%;height:100%;display:none;background:radial-gradient(circle at center,rgba(0,0,0,0) 0,rgba(0,0,0,0) min(38vw,38vh),rgba(0,0,0,.97) calc(min(38vw,38vh) + 3px))}.fr-scope:before,.fr-scope:after{content:"";position:absolute;background:rgba(0,0,0,.85)}.fr-scope:before{left:50%;top:0;width:1px;height:100%}.fr-scope:after{top:50%;left:0;height:1px;width:100%}',
'.fr-streak{position:absolute;left:0;right:0;top:36%;text-align:center;font-size:26px;font-weight:900;color:#ffd54a;letter-spacing:.1em;opacity:0;text-shadow:0 0 12px rgba(255,140,0,.9),0 2px 3px #000}.fr-streak.on{animation:frstk 1.6s forwards}@keyframes frstk{0%{opacity:0;transform:scale(1.8)}12%{opacity:1;transform:scale(1)}75%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}',
'.fr-kfeed{position:absolute;right:calc(env(safe-area-inset-right,0px) + 60px);top:calc(env(safe-area-inset-top,0px) + 42px);text-align:right;font-size:11px;font-weight:700}.fr-kfeed div{background:rgba(0,0,0,.4);border-radius:6px;padding:2px 7px;margin-bottom:3px;display:inline-block;clear:both;float:right}.fr-kfeed div.me{border:1px solid rgba(255,255,255,.6)}.fr-kfeed i{font-style:normal;opacity:.8;font-weight:500}',
'.fr-radar{position:absolute;left:calc(env(safe-area-inset-left,0px) + 12px);top:calc(env(safe-area-inset-top,0px) + 50px);width:96px;height:96px}',
'.fr-death{position:absolute;left:0;right:0;top:30%;text-align:center;display:none}.fr-death b{display:block;font-size:19px;font-weight:900}.fr-death span{display:block;margin-top:8px;font-size:15px;font-weight:700}',
'.fr-wname{position:absolute;right:calc(env(safe-area-inset-right,0px) + 20px);bottom:calc(env(safe-area-inset-bottom,0px) + 56px);font-size:12px;font-weight:700;opacity:.9}.fr-istouch .fr-wname{display:none}',
'.fr-tdm .fr-dots{display:none}',
'.fr-brow{display:flex;gap:8px;align-items:center;width:min(330px,86vw);margin:2px auto;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.07);font-size:13px;font-weight:700;box-sizing:border-box}.fr-brow span{flex:1;text-align:left}.fr-brow b{width:38px;text-align:right;font-variant-numeric:tabular-nums}.fr-brow.hd{background:none;font-size:12px;color:#ffd54a}.fr-brow.me{border:1px solid rgba(255,255,255,.55)}',
'.fr-shop{justify-content:flex-end!important;background:linear-gradient(180deg,rgba(8,10,14,0) 0,rgba(8,10,14,0) 30%,rgba(8,10,14,.92) 44%)!important;overflow:hidden!important;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 8px)!important}',
'.fr-shophd{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;justify-content:space-between;padding:0 14px;font-weight:800;font-size:15px;text-shadow:0 1px 3px #000}.fr-pvname{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 38px);font-size:13px;font-weight:700;text-shadow:0 1px 3px #000}',
'.fr-tabs{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:0 0 6px}.fr-tabs span{padding:7px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.3);font-size:12px;font-weight:700;cursor:pointer}.fr-tabs span.on{background:#ff7a2a;color:#1a0d02;border-color:#ff7a2a}',
'.fr-list{width:min(430px,94vw);height:38vh;overflow-y:auto;-webkit-overflow-scrolling:touch;margin:0 auto}.fr-item{display:flex;align-items:center;gap:8px;padding:8px 10px;margin:4px 0;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid transparent;text-align:left;cursor:pointer}.fr-item.sel{border-color:#ffb14a}.fr-item div{flex:1;font-size:14px;font-weight:800}.fr-item small{display:block;font-size:11px;font-weight:500;opacity:.75}.fr-item button{flex:none;min-width:86px;padding:8px 6px;border-radius:9px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.12);color:#fff;font-size:12px;font-weight:800}.fr-item button.buy{background:#2f8f4a;border-color:#4fc46f}.fr-item button.eq{background:#ff7a2a;border-color:#ff9a4a;color:#1a0d02}.fr-item button.no{opacity:.45}',
'@media (orientation:landscape){.fr-shop{align-items:flex-end!important;justify-content:center!important;background:linear-gradient(90deg,rgba(8,10,14,0) 0,rgba(8,10,14,0) 36%,rgba(8,10,14,.93) 48%)!important}.fr-shop .fr-list{width:50vw;height:56vh;margin:0}.fr-shop .fr-tabs{width:50vw;margin-top:34px}.fr-shop .fr-note{width:50vw}.fr-pvname{right:54%!important}.fr-pvcross{left:22%!important;top:60%!important}.fr-res{align-items:flex-end!important;background:linear-gradient(90deg,rgba(8,10,14,.1) 0,rgba(8,10,14,.15) 36%,rgba(8,10,14,.9) 50%)!important}.fr-res>*{width:52vw!important;max-width:52vw!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box}.fr-res .fr-b{width:min(300px,50vw)!important;margin:6px auto!important;margin-right:calc(26vw - min(150px,25vw))!important}.fr-res .fr-brow,.fr-res .fr-stat{margin-right:calc(26vw - min(165px,24vw))!important;margin-left:auto!important;width:min(330px,48vw)!important}}',
'@media (orientation:portrait){.fr-res.stage{justify-content:flex-start!important;padding-top:34vh!important;background:linear-gradient(180deg,rgba(8,10,14,0) 0,rgba(8,10,14,.1) 26%,rgba(8,10,14,.9) 38%)!important}}',
'.fr-res{justify-content:flex-start!important}',
'.fr-pvcross{position:absolute;left:50%;top:20%;width:0;height:0;display:none}',
'.fr-prof{font-size:14px!important;font-weight:800;opacity:1!important}.fr-prof em{font-style:normal;color:#ffd54a}',
'.fr-load{position:absolute;left:0;right:0;top:46%;text-align:center;font-size:14px;letter-spacing:.2em;font-weight:700}'
].join('\n');

var H = {};
function buildUI() {
  var hud = H.hud = el('div', 'fr-hud', UI);
  H.vig = el('div', 'fr-vig', hud); H.scope = el('div', 'fr-scope', hud);
  H.dmg = el('div', 'fr-dmg', hud); el('i', null, H.dmg);
  var top = el('div', 'fr-top', hud);
  H.hpbox = el('div', 'fr-hpbox', top); var bar = el('div', 'fr-hpbar', H.hpbox); H.hpfill = el('div', 'fr-hpfill', bar); H.hptxt = el('div', 'fr-small', H.hpbox, 'HP 100');
  var mid = el('div', 'fr-mid', top); H.wave = el('div', null, mid, ''); H.dots = el('div', 'fr-dots', mid);
  for (var i = 0; i < 8; i++) el('i', null, H.dots);
  var right = el('div', 'fr-right', top); H.score = el('div', 'fr-score', right, '0'); H.pause = el('div', 'fr-pause', right, 'II');
  onTap(H.pause, function () { if (G.state === 'playing') pauseGame(); });
  H.radar = el('canvas', 'fr-radar', hud); H.radar.width = H.radar.height = 96; H.radarCtx = H.radar.getContext('2d');
  H.kfeed = el('div', 'fr-kfeed', hud);
  H.ammo = el('div', 'fr-ammo', hud); H.wname = el('div', 'fr-wname', hud);
  H.cross = el('div', 'fr-cross', hud); H.cl = [el('b', null, H.cross), el('b', null, H.cross), el('b', null, H.cross), el('b', null, H.cross)]; el('b', 'd', H.cross);
  H.hitm = el('div', 'fr-hitm', hud);
  H.banner = el('div', 'fr-banner', hud); H.bh = el('h2', null, H.banner); H.bp = el('p', null, H.banner);
  H.streak = el('div', 'fr-streak', hud);
  H.death = el('div', 'fr-death', hud); H.deathBy = el('b', null, H.death); H.deathT = el('span', null, H.death);
  H.feed = el('div', 'fr-feed', hud);

  // title
  var t = H.title = el('div', 'fr-screen fr-scroll', UI);
  el('h1', null, t).innerHTML = 'FRIENDS <span>WARFARE</span>'; el('h3', null, t, 'ともだちサバゲー');
  H.prof = el('p', 'fr-prof', t, ''); H.dailyBtn = el('button', 'fr-b sm', t, ''); H.dailyBtn.style.display = 'none'; onTap(H.dailyBtn, function () { audioInit(); ecoDaily(); });
  H.account = el('div', 'fr-account', t);
  H.playBtn = el('button', 'fr-b pri', t, 'チーム戦 4 vs 4'); onTap(H.playBtn, function () { audioInit(); SFX.ui(); showScreen('tdmset'); });
  H.survBtn = el('button', 'fr-b', t, 'サバイバル（8ウェーブ）'); onTap(H.survBtn, function () { audioInit(); SFX.ui(); startGame(); });
  H.shopBtn = el('button', 'fr-b', t, 'ショップ・装備'); onTap(H.shopBtn, function () { audioInit(); SFX.ui(); openShop(); });
  var hb = el('button', 'fr-b sm', t, 'あそびかた'); onTap(hb, function () { audioInit(); SFX.ui(); showScreen('help'); });
  var sb = el('button', 'fr-b sm', t, '設定'); onTap(sb, function () { audioInit(); SFX.ui(); H.setBack = 'title'; showScreen('settings'); });
  H.best = el('p', null, t, ''); H.modelNote = el('p', 'fr-note', t, '');
  el('p', 'fr-note', t, '※ 銃声などの大きな音と、画面が赤く光る・ゆれる演出があります　v' + GAME_VERSION);

  // team battle setup
  var ts = H.tdmset = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, ts, 'チーム戦 4 vs 4');
  el('p', null, ts, 'あなた＋味方ボット3人（ブルー）対 敵ボット4人（レッド）。先に決めたキル数に届いたチームの勝ち。制限時間は5分。倒されても数秒で復活します。');
  function seg(label, opts, get, set) { var r = el('div', 'fr-row', ts); el('span', null, r, label); var sg = el('div', 'fr-seg', r), list = []; opts.forEach(function (o) { var sp = el('span', null, sg, o[1]); list.push([o[0], sp]); onTap(sp, function () { SFX.ui(); set(o[0]); upd(); }); }); function upd() { list.forEach(function (x) { x[1].classList.toggle('on', x[0] === get()); }); } upd(); }
  seg('ボットの強さ', [[0, 'やさしい'], [1, 'ふつう'], [2, 'つよい']], function () { return TDM_OPT.diff; }, function (v) { TDM_OPT.diff = v; store.set('tdmDiff', v); });
  seg('勝利キル数', [[20, '20'], [30, '30'], [50, '50']], function () { return TDM_OPT.target; }, function (v) { TDM_OPT.target = v; store.set('tdmTarget', v); });
  onTap(el('button', 'fr-b pri', ts, 'スタート'), function () { SFX.ui(); startTeamBattle(); });
  onTap(el('button', 'fr-b sm', ts, 'もどる'), function () { SFX.ui(); showScreen('title'); });

  var hp = H.help = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, hp, 'あそびかた');
  el('p', null, hp, '【スマホ】左側ドラッグで移動（大きく前に倒すとダッシュ）／右側ドラッグで視点／赤いボタンを押している間ずっと射撃／「エイム」でのぞきこみ（もう一度押すと解除）／「武器」で持ちかえ／「グレネード」で投げる／「リロード」で弾を補充');
  el('p', null, hp, '【PC】クリックで開始・射撃／右クリックでエイム／マウスで視点／WASD で移動／Shift でダッシュ／R でリロード／1〜4 かホイールで武器切りかえ／G でグレネード／Esc で一時停止');
  el('p', null, hp, '【チーム戦】青が味方、赤が敵。頭の上の三角マークとレーダーの点の色で見分けられる。倒すとチームに1点。');
  el('p', null, hp, '【サバイバル】出てくる相手を全員倒すと次のウェーブへ。全8ウェーブでクリア。後半は空からドローンも来る。');
  el('p', null, hp, '【共通】頭に当てるとダメージ2倍。緑の箱は回復、黄色の箱は弾とグレネードの補充。赤い弾は見てからよけられる。試合を終えるとコインと経験値がもらえ、ショップで武器や着せ替えを買える。');
  onTap(el('button', 'fr-b', hp, 'もどる'), function () { SFX.ui(); showScreen('title'); });

  var st = H.settings = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, st, '設定');
  function slider(label, min, max, val, fn) { var r = el('div', 'fr-row', st); el('span', null, r, label); var i = el('input', null, r); i.type = 'range'; i.min = min; i.max = max; i.step = 0.05; i.value = val; i.addEventListener('input', function () { fn(+i.value); }); i.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true }); i.addEventListener('touchmove', function (e) { e.stopPropagation(); }, { passive: true }); }
  slider('視点の速さ', 0.3, 2.5, SENS, function (v) { SENS = v; store.set('sens', v); });
  slider('音量', 0, 1, AU.vol, function (v) { setVolume(v); });
  var ar = el('div', 'fr-row', st); el('span', null, ar, 'エイムアシスト'); var asg = el('div', 'fr-seg', ar), aOn = el('span', null, asg, 'オン'), aOff = el('span', null, asg, 'オフ');
  function aUpd() { aOn.classList.toggle('on', SET.assist); aOff.classList.toggle('on', !SET.assist); }
  onTap(aOn, function () { SET.assist = true; store.set('assist', true); aUpd(); }); onTap(aOff, function () { SET.assist = false; store.set('assist', false); aUpd(); }); aUpd();
  el('p', 'fr-note', st, 'エイムアシスト：スマホ操作のとき、照準が敵の近くにあると視点の動きがゆっくりになります');
  var qr = el('div', 'fr-row', st); el('span', null, qr, '画質'); var seg2 = el('div', 'fr-seg', qr); H.qseg = [];
  [['auto', '自動'], [0, '低'], [1, '中'], [2, '高']].forEach(function (o) { var s = el('span', null, seg2, o[1]); H.qseg.push([o[0], s]); onTap(s, function () { SFX.ui(); setQualityMode(o[0]); }); });
  H.qinfo = el('p', 'fr-note', st, '');
  onTap(el('button', 'fr-b', st, 'もどる'), function () { SFX.ui(); showScreen(H.setBack || 'title'); });

  var pz = H.paused = el('div', 'fr-screen', UI);
  el('h3', null, pz, '一時停止');
  onTap(el('button', 'fr-b pri', pz, 'つづける'), function () { SFX.ui(); resumeGame(); });
  onTap(el('button', 'fr-b', pz, '設定'), function () { SFX.ui(); H.setBack = 'paused'; showScreen('settings'); });
  onTap(el('button', 'fr-b', pz, 'タイトルへ（この試合は記録されません）'), function () { SFX.ui(); toTitle(); });

  var rs = H.result = el('div', 'fr-screen fr-scroll fr-res', UI);
  H.rTitle = el('h1', null, rs); H.rSub = el('h3', null, rs); H.rScore = el('div', 'fr-big', rs); H.rBoard = el('div', null, rs); H.rStat = el('div', 'fr-stat', rs); H.rCoins = el('p', 'fr-prof', rs, ''); H.rNote = el('p', null, rs, '');
  H.rAgain = el('button', 'fr-b pri', rs, 'もういちど'); onTap(H.rAgain, function () { SFX.ui(); stageShow(null); if (G.last && G.last.mode === 'tdm') startTeamBattle(); else startGame(); });
  onTap(el('button', 'fr-b', rs, 'タイトルへ'), function () { SFX.ui(); toTitle(); });
}
var SCREENS = ['title', 'tdmset', 'help', 'settings', 'paused', 'result'];
function showScreen(name) {
  SCREENS.forEach(function (n) { H[n].classList.toggle('on', n === name); });
  if (name === 'settings') refreshQualityUI();
  if (name === 'title') { H.best.textContent = store.get('best', 0) ? 'この端末のサバイバルベスト： ' + store.get('best', 0) : ''; refreshAccountUI(); refreshProfileUI(); }
}
var hudCache = {};
function setTxt(k, e, v) { if (hudCache[k] !== v) { hudCache[k] = v; e.textContent = v; } }
function updateHUD(dt) {
  var hp = Math.max(0, Math.ceil(P.hp)), id = curId();
  if (hudCache.hp !== hp) { hudCache.hp = hp; H.hpfill.style.width = hp + '%'; H.hptxt.textContent = 'HP ' + hp; H.hpbox.classList.toggle('low', hp <= 30); }
  setTxt('score', H.score, String(G.score));
  var am = gun.reloadT > 0 ? 'リロード中…' : gun.ammo[id] + ' / ' + WDEF[id].mag; if (hudCache.am !== am) { hudCache.am = am; H.ammo.textContent = am; H.ammo.classList.toggle('low', gun.ammo[id] <= Math.max(1, WDEF[id].mag * 0.2) && gun.reloadT <= 0); H.ammo.style.fontSize = gun.reloadT > 0 ? '15px' : ''; }
  var wn = WDEF[id].name + '　グレネード ' + P.nades; if (hudCache.wn !== wn) { hudCache.wn = wn; H.wname.textContent = wn; if (touchUI.wsw) { touchUI.wsw.textContent = WDEF[id].name.replace('ライフル', '').replace('ランチャー', ''); touchUI.nade.innerHTML = 'グレネード<br>× ' + P.nades; } }
  if (G.mode === 'tdm' && G.tdm) {
    var T = G.tdm, tl = Math.max(0, Math.ceil(T.timeLeft)), hs = T.score[0] + '|' + T.score[1] + '|' + tl;
    if (hudCache.tdm !== hs) { hudCache.tdm = hs; H.wave.innerHTML = '<span style="color:' + TEAM_CSS[0] + ';white-space:nowrap">ブルー ' + T.score[0] + '</span> － <span style="color:' + TEAM_CSS[1] + ';white-space:nowrap">' + T.score[1] + ' レッド</span><br><small>先取 ' + T.target + '　' + Math.floor(tl / 60) + ':' + ('0' + (tl % 60)).slice(-2) + '</small>'; }
  } else {
    var left = G.queue.length + aliveCount();
    setTxt('wave', H.wave, 'WAVE ' + G.wave + ' / 8　' + (G.phase === 'fight' ? 'のこり ' + left + ' 人' : ''));
    if (hudCache.dk !== G.wave) { hudCache.dk = G.wave; for (var i = 0; i < 8; i++) H.dots.children[i].className = i < G.wave - 1 ? 'on' : (i === G.wave - 1 ? 'cur' : ''); }
  }
  // crosshair spread
  var sp = (7 + (WDEF[id].spread + gun.bloom) * 700 + Math.min(10, P.speed * 1.6)) * lerp(1, Math.max(0.2, WDEF[id].ads), gun.ads), L = 9;
  var c = H.cl; c[0].style.cssText = 'left:' + (-sp - L) + 'px;top:-1px;width:' + L + 'px;height:2px'; c[1].style.cssText = 'left:' + sp + 'px;top:-1px;width:' + L + 'px;height:2px';
  c[2].style.cssText = 'top:' + (-sp - L) + 'px;left:-1px;height:' + L + 'px;width:2px'; c[3].style.cssText = 'top:' + sp + 'px;left:-1px;height:' + L + 'px;width:2px';
  if (H.hitT > 0) { H.hitT -= dt; H.hitm.style.opacity = Math.max(0, H.hitT / 0.18); }
  G.vig = damp(G.vig, 0, 2.5, dt); var low = P.hp <= 30 && P.hp > 0 ? 0.3 + Math.sin(G.time * 5) * 0.12 : 0;
  H.vig.style.opacity = Math.min(1, Math.max(G.vig, low)).toFixed(2);
  if (H.dmgT > 0) { H.dmgT -= dt; var rel = Math.atan2((H.dmgX - P.x) * Math.cos(P.yaw) - (H.dmgZ - P.z) * Math.sin(P.yaw), -(H.dmgX - P.x) * Math.sin(P.yaw) - (H.dmgZ - P.z) * Math.cos(P.yaw));
    H.dmg.style.opacity = Math.min(1, H.dmgT / 0.5); H.dmg.style.transform = 'rotate(' + rel.toFixed(3) + 'rad)'; } else if (hudCache.dmgOn) H.dmg.style.opacity = 0;
  hudCache.dmgOn = H.dmgT > 0;
  if (H.banT > 0) { H.banT -= dt; if (H.banT <= 0) H.banner.style.opacity = 0; }
  updateRadar(dt);
}
function hudHit(crit, kill) { H.hitT = 0.18; H.hitm.className = 'fr-hitm' + (kill ? ' k' : crit ? ' c' : ''); }
function banner(h, p, t) { H.bh.textContent = h; H.bp.textContent = p || ''; H.banner.style.opacity = 1; H.banT = t || 2.6; }
function feed(txt) { var d = el('div', null, H.feed, txt); while (H.feed.children.length > 3) H.feed.removeChild(H.feed.firstChild); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1300); }
function addScore(n, label) { G.score += n; if (label) feed(label + ' +' + n); }
