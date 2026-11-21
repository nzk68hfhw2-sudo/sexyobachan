// End-to-end test of v2 in the Gravity-loader condition (page origin A loads game.js from origin B, API on origin C).
// register -> login bonus -> team battle (shoot, switch, aim, grenade, die, respawn, finish) -> reward -> shop buy/equip/loadout
// -> reload (still there) -> survival -> guest flow.   usage: node tools/e2e-test.js [screenshotDir]
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'); const { Pool } = require('pg');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three-r128.min.js'));
const loader = fs.readFileSync(path.join(__dirname, '..', '..', 'deliver', 'fps_loader.html'), 'utf8').replace(/var BASE='[^']*'/, "var BASE='http://localhost:8092/'");
const withApi = loader.replace('<script>', "<script>window.__FR_API={url:'http://127.0.0.1:8094',key:'test-publishable-key',test:true};</script><script>");
const admin = new Pool({ host: '127.0.0.1', port: 54329, user: 'postgres', database: 'postgres' });
const rows = []; const check = (n, p, d) => { rows.push((p ? 'OK ' : 'NG ') + '| ' + n + ' | ' + (d == null ? '' : d)); };
const shots = process.argv[2];
(async () => {
  await admin.query('truncate fr_private.users cascade; truncate fr_private.attempts');
  let page; const errs = [];
  const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(q.url.startsWith('/guest') ? loader : withApi); }).listen(8093);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  async function open(ctx, url) {
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
    await p.goto(url); await p.waitForFunction('window.__frReady && window.__fr.ACC.checked && window.__fr.ECO.loaded', null, { timeout: 60000 });
    await p.waitForFunction('["boys","girls","boys_lod","girls_lod"].every(k=>window.__fr.MODEL_STATUS[k]!=="loading")', null, { timeout: 60000 }); return p;
  }
  const tap = async (text, sel) => { const h = page.locator((sel || '.fr-screen.on button'), { hasText: text }).first(); await h.scrollIntoViewIfNeeded(); await h.tap(); };
  const ev = (f, a) => page.evaluate(f, a); const sleep = ms => page.waitForTimeout(ms);
  const shot = async n => { if (shots) await page.screenshot({ path: path.join(shots, n + '.png') }); };
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); page = await open(ctx, 'http://localhost:8093/');
  const ID = 'dummy_e2e_user', PW = 'Dummy-E2E-Pass-13579';

  // ---- account
  await tap('ログイン / 新規登録'); await page.fill('.fr-screen.on input[type=text]', ID); await page.fill('.fr-screen.on input[type=password]', PW); await tap('新規登録');
  await page.waitForFunction(() => window.__fr.ACC.token && window.__fr.ECO.loaded, null, { timeout: 15000 });
  check('新規登録（別サイト読み込み）', (await ev(() => document.querySelector('.fr-account p').textContent)).includes(ID), await ev(() => document.querySelector('.fr-account p').textContent));
  await tap('ログアウト'); await sleep(500); await tap('ログイン / 新規登録'); await page.fill('.fr-screen.on input[type=text]', ID); await page.fill('.fr-screen.on input[type=password]', PW); await page.locator('.fr-screen.on button.pri').tap();
  await page.waitForFunction(() => window.__fr.ACC.token, null, { timeout: 15000 }); await page.waitForFunction(() => window.__fr.ECO.daily === true, null, { timeout: 15000 });
  check('ログアウト → ログイン', true, 'ok');
  await tap('ログインボーナス'); await page.waitForFunction(() => window.__fr.ECO.coins === 100, null, { timeout: 15000 });
  check('毎日のログインボーナスでコイン +100', true, await ev(() => document.querySelector('.fr-prof').textContent)); await shot('e2e_title');

  // ---- team battle
  await tap('チーム戦 4 vs 4'); await tap('やさしい', '.fr-screen.on .fr-seg span'); await tap('20', '.fr-screen.on .fr-seg span'); await tap('スタート');
  await page.waitForFunction(() => window.__fr.G.state === 'playing' && window.__fr.G.mode === 'tdm' && window.__fr.ECO.match, null, { timeout: 15000 }); const t0 = Date.now();
  let s = await ev(() => { const f = window.__fr, T = f.G.tdm; return { bots: f.ENEMIES.length, allies: f.ENEMIES.filter(e => e.team === 0).length, foes: f.ENEMIES.filter(e => e.team === 1).length, target: T.target, diff: T.diff, roster: T.roster.length, header: document.querySelector('.fr-mid').textContent, radar: !!document.querySelector('.fr-radar'), marks: f.ENEMIES.every(e => e.mark) }; });
  await ev(() => { const f = window.__fr; f.P.x = 0; f.P.z = 30; f.P.yaw = 0; f.P.pitch = 0; f.ENEMIES.forEach((e, i) => { if (e.team === 1) { e.x = -9 + i * 3; e.z = 4; } }); }); await sleep(600); const info = await ev(() => window.__fr.info());
  check('チーム戦開始：自分＋味方ボット3 対 敵ボット4', s.bots === 7 && s.allies === 3 && s.foes === 4 && s.roster === 8, '味方 ' + s.allies + ' / 敵 ' + s.foes);
  check('選んだ設定（やさしい・20キル）が反映', s.target === 20 && s.diff === 0, '先取 ' + s.target + '・強さ ' + s.diff);
  check('スコア・残り時間・レーダー・色マークの表示', /ブルー 0/.test(s.header) && /レッド/.test(s.header) && /\d:\d\d/.test(s.header) && s.radar && s.marks, s.header.replace(/\s+/g, ' '));
  // shoot an enemy placed in front (real hit-scan through the fire input)
  await ev(() => { const f = window.__fr, P = f.P; P.inv = 99; P.yaw = 0; P.pitch = -0.02; f.ENEMIES.forEach((e, i) => { e.x = P.x + (i - 3) * 3; e.z = P.z + 12; e.inv = 0; }); const en = f.ENEMIES.find(e => e.team === 1); en.x = P.x; en.z = P.z - 6; en.vx = en.vz = 0; en.T = Object.assign({}, en.T, { speed: 0 }); window.__tgt = en; f.input.fire = true; });
  await page.waitForFunction(() => window.__tgt.dead > 0, null, { timeout: 20000 }); await ev(() => { window.__fr.input.fire = false; });
  s = await ev(() => { const f = window.__fr; return { sc: f.G.tdm.score[0], k: f.G.tdm.me.kills, feed: document.querySelector('.fr-kfeed').textContent, shots: f.G.stats.shots }; });
  check('敵を撃って倒すとチームに1点・キルログ表示', s.sc >= 1 && s.k === 1 && s.feed.includes('アサルトライフル'), 'ブルー ' + s.sc + ' 点　' + s.feed.replace(/\s+/g, ' ').slice(0, 40));
  const f1 = await ev(() => { const f = window.__fr, P = f.P, a = f.ENEMIES.find(e => e.team === 0 && !e.dead); a.x = P.x; a.z = P.z - 5; a.hp = 100; f.input.fire = true; window.__ally = a; return a.hp; }); await sleep(900);
  check('味方は撃ってもダメージを受けない', await ev(() => { window.__fr.input.fire = false; const a = window.__ally; a.z = window.__fr.P.z + 12; return a.hp === 100 && !a.dead; }), 'HP 100 のまま');
  // touch buttons: weapon switch, aim, grenade
  const cdp = await ctx.newCDPSession(page); const center = sel => ev(q => { const r = document.querySelector(q).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }, sel);
  const touchTap = async sel => { const c = await center(sel); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y, id: 9 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const sizes = []; for (const q of ['.fr-fire', '.fr-aim', '.fr-wsw', '.fr-nade', '.fr-reload']) sizes.push((await center(q)).w);
  check('スマホ用ボタン（射撃・エイム・武器・グレネード・リロード）が表示され押せる大きさ', sizes.every(w => w >= 40), sizes.map(w => Math.round(w)).join(' / ') + ' px');
  const w0 = await ev(() => window.__fr.gun.slots[window.__fr.gun.cur]); await touchTap('.fr-wsw'); await sleep(700); const w1 = await ev(() => window.__fr.gun.slots[window.__fr.gun.cur]);
  check('武器切りかえボタン', w0 === 'ar' && w1 === 'pistol', w0 + ' → ' + w1);
  await ev(() => { window.__fr.input.switchTo = 3; }); await sleep(700); const fov0 = await ev(() => window.__fr.G.baseFov); await touchTap('.fr-aim'); await sleep(700);
  s = await ev(() => ({ fov: document.querySelector('.fr-scope').style.display, ads: window.__fr.gun.ads, w: window.__fr.gun.slots[window.__fr.gun.cur] })); const fov1 = await ev(() => 0 + window.__fr.G.baseFov * window.__fr.WDEF.sniper.zoom / 66);
  check('エイムボタン：スナイパーはスコープ画面になりズーム', s.w === 'sniper' && s.ads > 0.9 && s.fov === 'block', 'ズーム ' + Math.round(fov0) + '° → ' + Math.round(fov1) + '°'); await shot('e2e_scope');
  await touchTap('.fr-aim'); await sleep(400); const n0 = await ev(() => window.__fr.P.nades); await touchTap('.fr-nade'); await sleep(300);
  check('グレネードボタンで投げる', await ev(() => window.__fr.P.nades) === n0 - 1, n0 + ' → ' + (n0 - 1) + ' 個');
  // die and respawn
  await ev(() => { const f = window.__fr; f.P.inv = 0; f.hurt(500, f.P.x, f.P.z - 3, f.ENEMIES.find(e => e.team === 1 && !e.dead), 'ブラスター'); }); await sleep(400);
  s = await ev(() => ({ d: document.querySelector('.fr-death').style.display, t: document.querySelector('.fr-death').textContent, deaths: window.__fr.G.tdm.me.deaths, red: window.__fr.G.tdm.score[1] }));
  check('倒されると相手と武器を表示・相手チームに1点', s.d === 'block' && /ブラスター/.test(s.t) && s.deaths === 1 && s.red >= 1, s.t);
  await page.waitForFunction(() => window.__fr.P.hp === 100 && !window.__fr.P.respawnT, null, { timeout: 20000 });
  check('数秒で復活', true, 'HP ' + await ev(() => window.__fr.P.hp)); await shot('e2e_tdm');
  // let the bots fight on their own for a while
  await ev(() => { const f = window.__fr; f.P.inv = 999; f.P.x = 30; f.P.z = 30; }); const botK0 = await ev(() => window.__fr.G.tdm.roster.filter(r => !r.isPlayer).reduce((a, r) => a + r.kills, 0));
  await page.waitForFunction(k => window.__fr.G.tdm.roster.filter(r => !r.isPlayer).reduce((a, r) => a + r.kills, 0) > k, botK0, { timeout: 150000 }).catch(() => {});
  s = await ev(() => { const f = window.__fr; return { k: f.G.tdm.roster.filter(r => !r.isPlayer).reduce((a, r) => a + r.kills, 0), info: f.info(), n: f.ENEMIES.length }; });
  check('ボット同士も戦い、倒されたボットは復活する', s.k > botK0 && s.n >= 6, 'ボットのキル合計 ' + s.k + '　場のボット ' + s.n + ' 人');
  check('描画の軽さ（全員が画面に入る位置で計測・影の分も含む）', info.tris < 400000, info.tris + ' ポリゴン / 描画 ' + info.calls + ' 回');
  await sleep(Math.max(0, 22000 - (Date.now() - t0)));
  await ev(() => { const T = window.__fr.G.tdm; T.score[0] = T.target; }); await page.waitForFunction(() => window.__fr.G.state === 'result', null, { timeout: 60000 });
  await page.waitForFunction(() => /保存しました|受け取れません/.test(document.querySelector('.fr-res').textContent), null, { timeout: 20000 });
  s = await ev(() => ({ title: document.querySelector('.fr-res h1').textContent, rowsN: document.querySelectorAll('.fr-res .fr-brow').length, coins: document.querySelector('.fr-res .fr-prof').textContent, save: [...document.querySelectorAll('.fr-res p')].map(p => p.textContent).join(' '), mvp: document.querySelector('.fr-brow.hd').textContent, eco: window.__fr.ECO.coins, stage: window.__fr.STAGE.on }));
  check('決めたキル数に届くと結果画面（勝敗・8人の成績・MVP）', s.title === 'VICTORY' && s.rowsN === 9 && /MVP/.test(s.mvp) && s.stage, s.title + '　' + s.mvp.replace(/キルデス$/, ''));
  check('報酬はサーバーが計算してアカウントに保存', /保存しました/.test(s.save) && s.eco === 100 + 10 + 150, s.coins.replace(/\s+/g, ' ')); await shot('e2e_result');
  let db = await admin.query('select coins, xp, tdm_wins from fr_private.users where id_key = $1', [ID]);
  check('データベースのコインと勝利数が画面と一致', db.rows[0].coins === s.eco && db.rows[0].tdm_wins === 1, JSON.stringify(db.rows[0]));

  // ---- shop
  await tap('タイトルへ'); await tap('ショップ'); await sleep(600);
  const cat = await ev(() => window.__fr.catalog()); db = await admin.query('select id, kind, price from fr_private.items'); const mism = db.rows.filter(r => !cat[r.id] || cat[r.id][0] !== r.kind || cat[r.id][1] !== r.price);
  check('ゲーム内の値段表とサーバーの値段表が一致', mism.length === 0 && db.rows.length === Object.keys(cat).length, db.rows.length + ' 品');
  await tap('ぼうし', '.fr-tabs span'); await sleep(300); const capRow = page.locator('.fr-item', { hasText: 'キャップ' });
  await capRow.tap(); await sleep(500); check('買う前のプレビュー表示', await ev(() => window.__fr.STAGE.on && document.querySelector('.fr-pvname').textContent.includes('キャップ')), 'キャップ'); await shot('e2e_shop_preview');
  await capRow.locator('button').tap(); await sleep(300); const confirmTxt = await capRow.locator('button').textContent(); await capRow.locator('button').tap();
  await page.waitForFunction(() => window.__fr.ECO.owned.h_cap, null, { timeout: 15000 });
  check('購入（確認の2回押し）でコインが減る', confirmTxt === 'もう一度押す' && await ev(() => window.__fr.ECO.coins) === 60, '260 → ' + await ev(() => window.__fr.ECO.coins));
  await page.locator('.fr-item', { hasText: '王冠' }).locator('button').tap(); await sleep(400);
  check('コインが足りない物は買えない', await ev(() => !window.__fr.ECO.owned.h_crown && /足りません/.test(document.querySelector('.fr-shop .fr-note').textContent)), await ev(() => document.querySelector('.fr-shop .fr-note').textContent));
  await capRow.locator('button').tap(); await page.waitForFunction(() => window.__fr.ECO.eq.hat === 'h_cap', null, { timeout: 15000 });
  check('買った物を装備', await capRow.locator('button').textContent() === '装備中', '装備中');
  await tap('武器', '.fr-tabs span'); await sleep(300); await page.locator('.fr-item', { hasText: 'ショットガン' }).locator('button').tap(); await page.waitForFunction(() => window.__fr.ECO.loadout.length === 3, null, { timeout: 15000 });
  check('持っていく武器の入れかえ', await ev(() => window.__fr.ECO.loadout.join()) === 'ar,pistol,sniper', await ev(() => window.__fr.ECO.loadout.join()));
  await tap('照準', '.fr-tabs span'); await sleep(200); await tap('弾の色', '.fr-tabs span'); await sleep(200); await tap('スキン', '.fr-tabs span'); await sleep(200); await tap('キャラ', '.fr-tabs span'); await sleep(200);
  await page.locator('.fr-item', { hasText: 'ボブ' }).locator('button').tap(); await page.waitForFunction(() => window.__fr.ECO.eq.avatar === 6, null, { timeout: 15000 });
  await page.reload(); await page.waitForFunction('window.__frReady && window.__fr.ACC.checked && window.__fr.ECO.loaded && window.__fr.ACC.token', null, { timeout: 60000 });
  s = await ev(() => { const E = window.__fr.ECO; return { coins: E.coins, hat: E.eq.hat, av: E.eq.avatar, lo: E.loadout.join(), own: Object.keys(E.owned).join() }; });
  check('開き直してもコイン・持ち物・装備がアカウントに残る', s.coins === 60 && s.hat === 'h_cap' && s.av === 6 && s.lo === 'ar,pistol,sniper' && s.own === 'h_cap', JSON.stringify(s));

  // ---- survival still works
  await page.waitForFunction('["boys","girls"].every(k=>window.__fr.MODEL_STATUS[k]!=="loading")', null, { timeout: 60000 });
  await tap('サバイバル'); await page.waitForFunction(() => window.__fr.G.state === 'playing' && window.__fr.G.mode === 'survival' && window.__fr.ECO.match, null, { timeout: 15000 }); const t1 = Date.now();
  check('サバイバル：装備した武器3つで開始', await ev(() => window.__fr.gun.slots.join()) === 'ar,pistol,sniper', await ev(() => window.__fr.gun.slots.join()));
  await page.waitForFunction(() => window.__fr.G.phase === 'fight' && window.__fr.ENEMIES.some(e => !e.dead), null, { timeout: 60000 });
  await ev(() => { const f = window.__fr, P = f.P, e = f.ENEMIES.find(e => !e.dead); P.yaw = 0; P.pitch = -0.02; e.x = P.x; e.z = P.z - 6; e.T = Object.assign({}, e.T, { speed: 0 }); window.__tgt = e; f.input.fire = true; });
  await page.waitForFunction(() => window.__tgt.dead > 0, null, { timeout: 30000 }); await ev(() => { window.__fr.input.fire = false; });
  check('サバイバル：敵を撃って倒すとスコア加算', await ev(() => window.__fr.G.score) >= 100 && await ev(() => window.__fr.G.stats.kills) === 1, 'スコア ' + await ev(() => window.__fr.G.score));
  await page.waitForFunction(() => window.__fr.G.queue.length === 0 || window.__fr.ENEMIES.length > 0, null, { timeout: 30000 });
  await ev(() => { window.__fr.killAll(); }); await page.waitForFunction(() => window.__fr.G.wave === 2, null, { timeout: 90000 });
  check('サバイバル：全滅させると次のウェーブへ', true, 'WAVE ' + await ev(() => window.__fr.G.wave));
  await sleep(Math.max(0, 22000 - (Date.now() - t1)));
  await ev(() => { const f = window.__fr; f.hurt(500, 0, 0, null, 'テスト'); }); await page.waitForFunction(() => window.__fr.G.state === 'result', null, { timeout: 60000 });
  await page.waitForFunction(() => /保存しました|受け取れません/.test(document.querySelector('.fr-res').textContent), null, { timeout: 20000 });
  s = await ev(() => ({ title: document.querySelector('.fr-res h1').textContent, txt: [...document.querySelectorAll('.fr-res p')].map(p => p.textContent).join(' ') }));
  db = await admin.query('select s.score, u.best_score from fr_private.scores s join fr_private.users u on u.id = s.user_id');
  check('サバイバル：やられると結果画面、スコアをサーバーに保存', s.title === 'MISSION FAILED' && /保存しました/.test(s.txt) && db.rows.length === 1 && db.rows[0].best_score === db.rows[0].score, 'score=' + (db.rows[0] && db.rows[0].score));
  await tap('タイトルへ'); await tap('ランキング'); await page.waitForFunction(() => document.querySelectorAll('.fr-screen.on .fr-stat b').length >= 2, null, { timeout: 15000 });
  check('ランキング（チーム戦の勝敗・サバイバル）', /1 勝 0 敗/.test(await ev(() => document.querySelector('.fr-screen.on').textContent)), await ev(() => [...document.querySelectorAll('.fr-screen.on .fr-stat')].map(x => x.textContent).join(' ｜ ')));
  check('Cookie を使っていない', (await ctx.cookies()).length === 0, 'Cookie 0 個'); await ctx.close();

  // ---- guest
  const g = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); page = await open(g, 'http://localhost:8093/guest');
  check('ゲスト：端末保存の注意書きを表示', /端末を変えると消えます/.test(await ev(() => document.querySelector('.fr-account').textContent)), await ev(() => document.querySelector('.fr-account').textContent.slice(0, 40)));
  await tap('チーム戦 4 vs 4'); await tap('スタート'); await page.waitForFunction(() => window.__fr.G.state === 'playing', null, { timeout: 15000 }); await sleep(1500);
  await ev(() => { const T = window.__fr.G.tdm; T.score[1] = T.target; }); await page.waitForFunction(() => window.__fr.G.state === 'result', null, { timeout: 60000 }); await sleep(500);
  s = await ev(() => ({ title: document.querySelector('.fr-res h1').textContent, coins: window.__fr.ECO.coins, local: JSON.parse(localStorage.getItem('fr_eco')).coins, note: document.querySelector('.fr-res').textContent }));
  check('ゲスト：敗北でも結果画面と報酬、端末に保存', s.title === 'DEFEAT' && s.coins === 60 && s.local === 60 && /この端末だけ/.test(s.note), 'コイン ' + s.coins); await shot('e2e_guest_result');
  await g.close(); await b.close(); srv.close(); await admin.query('truncate fr_private.users cascade; truncate fr_private.attempts'); await admin.end();
  check('実行中の JavaScript エラーなし', errs.length === 0, errs.length + ' 件 ' + errs.slice(0, 2).join(' / '));
  console.log(rows.join('\n')); const ng = rows.filter(r => r.startsWith('NG')).length; console.log('\n合計 ' + rows.length + ' 件 / 失敗 ' + ng + ' 件'); process.exit(ng ? 1 : 0);
})().catch(e => { console.log(rows.join('\n')); console.error(String(e && e.stack || e).split('\n').slice(0, 8).join('\n')); process.exit(2); });
