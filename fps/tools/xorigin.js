// Cross-origin test: a page on port 8093 (like the Gravity loader) loads game.js from port 8092.
// usage: node tools/xorigin.js [blockxhr]
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three-r128.min.js'));
const loader = fs.readFileSync(path.join(__dirname, '..', '..', 'deliver', 'fps_loader.html'), 'utf8').replace(/var BASE='[^']*'/, "var BASE='http://localhost:8092/'");
(async () => {
  const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(loader); }).listen(8093);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage(); const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text())); page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  if (process.argv[2] === 'blockxhr') await page.route('**/*.glb', r => r.abort());
  await page.goto('http://127.0.0.1:8093/');
  await page.waitForFunction('window.__frReady', null, { timeout: 60000 });
  await page.waitForFunction('window.__fr.MODEL_STATUS.boys!=="loading"&&window.__fr.MODEL_STATUS.girls!=="loading"', null, { timeout: 60000 });
  // real touch flow: tap PLAY, drag left stick, drag look, hold fire
  await page.touchscreen.tap(195, await page.evaluate(() => { const r = document.querySelector('.fr-b.pri').getBoundingClientRect(); return r.top + r.height / 2; }));
  await page.waitForTimeout(800);
  const cdp = await page.context().newCDPSession(page);
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const before = await page.evaluate(() => ({ x: window.__fr.P.x, z: window.__fr.P.z, yaw: window.__fr.P.yaw, ammo: window.__fr.gun.ammo }));
  await T('touchStart', [{ x: 80, y: 650, id: 1 }]); await T('touchMove', [{ x: 80, y: 600, id: 1 }]);
  await T('touchMove', [{ x: 80, y: 600, id: 1 }, { x: 300, y: 400, id: 2 }]); await T('touchMove', [{ x: 80, y: 600, id: 1 }, { x: 240, y: 400, id: 2 }]);
  const fr = await page.evaluate(() => { const r = document.querySelector('.fr-fire').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await T('touchMove', [{ x: 80, y: 600, id: 1 }, { x: 240, y: 400, id: 2 }, { x: fr.x, y: fr.y, id: 3 }]);
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ x: window.__fr.P.x, z: window.__fr.P.z, yaw: window.__fr.P.yaw, ammo: window.__fr.gun.ammo, state: window.__fr.G.state, models: window.__fr.MODEL_STATUS, origin: location.origin, errs: window.__fr.errors }));
  await T('touchEnd', []);
  if (process.argv[3]) await page.screenshot({ path: process.argv[3] });
  console.log(JSON.stringify({ before, after }));
  console.log('moved:', Math.abs(after.z - before.z) > 0.5, 'looked:', Math.abs(after.yaw - before.yaw) > 0.05, 'fired:', after.ammo < before.ammo);
  console.log(logs.filter(l => !/GPU stall|GL Driver/.test(l)).slice(0, 10).join('\n'));
  await b.close(); srv.close();
})();
