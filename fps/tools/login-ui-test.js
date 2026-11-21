// UI login test in the same condition as the Gravity loader: the page (origin A, port 8093) loads game.js from origin B (8092),
// which talks to the API on origin C (8094). Drives the real on-screen forms with touch taps.
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three-r128.min.js'));
const loader = fs.readFileSync(path.join(__dirname, '..', '..', 'deliver', 'fps_loader.html'), 'utf8').replace(/var BASE='[^']*'/, "var BASE='http://localhost:8092/'")
  .replace('<script>', "<script>window.__FR_API={url:'http://127.0.0.1:8094',key:'test-publishable-key',test:true};</script><script>");
const rows = []; const check = (n, p, d) => rows.push((p ? 'OK ' : 'NG ') + '| ' + n + ' | ' + (d || ''));
(async () => {
  const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(loader); }).listen(8093);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  async function open(ctx, init) {
    const page = await ctx.newPage(); if (init) await page.addInitScript(init);
    await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
    await page.goto('http://localhost:8093/'); await page.waitForFunction('window.__frReady && window.__fr.ACC.checked', null, { timeout: 60000 }); return page;
  }
  const tap = async (page, text) => { const h = page.locator('.fr-screen.on button', { hasText: text }).first(); await h.scrollIntoViewIfNeeded(); await h.tap(); };
  const info = page => page.evaluate(() => document.querySelector('.fr-account p').textContent);
  const msg = (page, sel) => page.evaluate(s => document.querySelector(s).textContent, sel || '.fr-screen.on p[style*="color"]');
  const ID = 'dummy_ui_user', PW = 'Dummy-Ui-Pass-13579';
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), page = await open(ctx);
  check('別サイト読み込み：ゲーム起動とサーバー接続', await page.evaluate(() => window.__fr.ACC.online !== false && location.port === '8093'), await info(page));
  await tap(page, 'ログイン / 新規登録'); await page.fill('.fr-screen.on input[type=text]', ID); await page.fill('.fr-screen.on input[type=password]', 'short');
  await tap(page, '新規登録'); check('画面：短いパスワードの登録を止める', /8 文字以上/.test(await msg(page)), await msg(page));
  await page.fill('.fr-screen.on input[type=password]', PW); await tap(page, '新規登録');
  await page.waitForFunction(() => window.__fr.ACC.token, null, { timeout: 15000 });
  check('別サイト読み込み：新規登録してログイン状態になる', (await info(page)).includes(ID), await info(page));
  check('Cookie を使っていない', (await ctx.cookies()).length === 0, 'Cookie ' + (await ctx.cookies()).length + ' 個');
  await page.reload(); await page.waitForFunction('window.__frReady && window.__fr.ACC.checked', null, { timeout: 60000 });
  check('開き直してもログイン状態が保たれる', (await info(page)).includes(ID), await info(page));
  await tap(page, 'ログアウト'); await page.waitForTimeout(600);
  check('ログアウト', (await info(page)).includes('ゲスト') && await page.evaluate(() => !localStorage.getItem('fr_token')), await info(page));
  await tap(page, 'ログイン / 新規登録'); await page.fill('.fr-screen.on input[type=text]', ID); await page.fill('.fr-screen.on input[type=password]', 'wrong-password');
  await tap(page, 'ログイン'); await page.waitForFunction(() => /違います/.test(document.querySelector('.fr-screen.on p[style*="color"]').textContent), null, { timeout: 15000 });
  check('別サイト読み込み：まちがったパスワードは入れない', await page.evaluate(() => !window.__fr.ACC.token), await msg(page));
  await page.fill('.fr-screen.on input[type=password]', PW); await page.locator('.fr-screen.on button.pri').tap();
  await page.waitForFunction(() => window.__fr.ACC.token, null, { timeout: 15000 });
  check('別サイト読み込み：正しいパスワードでログイン', (await info(page)).includes(ID), await info(page));
  await page.evaluate(() => { const f = window.__fr; f.start(); f.G.score = 2345; f.G.wave = 3; f.G.time = 99; f.end(false); });
  await page.waitForFunction(() => /保存しました/.test(document.querySelector('.fr-screen.on').textContent), null, { timeout: 15000 });
  check('プレイ結果がアカウントの記録としてサーバーに保存される', true, (await page.evaluate(() => [...document.querySelectorAll('.fr-screen.on p')].map(p => p.textContent).find(t => /保存しました/.test(t)))));
  await tap(page, 'タイトルへ'); await tap(page, 'ランキング'); await page.waitForFunction(() => document.querySelector('.fr-screen.on .fr-stat').children.length > 0, null, { timeout: 15000 });
  check('ランキング表示', /dummy_ui_user/.test(await page.evaluate(() => document.querySelector('.fr-screen.on .fr-stat').textContent)), await page.evaluate(() => document.querySelector('.fr-screen.on .fr-stat').textContent));
  if (process.argv[2]) { await tap(page, 'もどる'); await page.waitForTimeout(300); await page.screenshot({ path: process.argv[2] }); }
  await ctx.close();
  // storage blocked (like a locked-down in-app browser): login must still work for the session
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  page = await open(ctx, () => { Storage.prototype.setItem = function () { throw new Error('blocked'); }; Storage.prototype.getItem = function () { return null; }; });
  await tap(page, 'ログイン / 新規登録'); await page.fill('.fr-screen.on input[type=text]', ID); await page.fill('.fr-screen.on input[type=password]', PW); await page.locator('.fr-screen.on button.pri').tap();
  await page.waitForFunction(() => window.__fr.ACC.token, null, { timeout: 15000 });
  check('Cookie も端末への保存も使えない状態でもログインできる（開いている間）', await page.evaluate(() => window.__fr.ACC.memOnly === true), await page.evaluate(() => document.querySelector('.fr-account .fr-note').textContent));
  await tap(page, 'アカウント削除'); await page.fill('.fr-screen.on input[type=password]', PW); await tap(page, '削除する');
  await page.waitForFunction(() => !window.__fr.ACC.token, null, { timeout: 15000 });
  check('画面からアカウント削除', /削除しました/.test(await page.evaluate(() => document.querySelector('.fr-account .fr-note').textContent)), await info(page));
  await ctx.close(); await b.close(); srv.close();
  console.log(rows.join('\n')); const ng = rows.filter(r => r.startsWith('NG')).length; console.log('\n合計 ' + rows.length + ' 件 / 失敗 ' + ng + ' 件'); process.exit(ng ? 1 : 0);
})().catch(e => { console.log(rows.join('\n')); console.error(String(e).split('\n').slice(0, 6).join('\n')); process.exit(2); });
