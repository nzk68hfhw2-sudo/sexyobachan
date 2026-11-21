// full-run test: 8 waves -> rescue each friend -> victory screen; then death -> failed screen
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three-r128.min.js'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 640, height: 360 } }); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  await page.goto('http://localhost:8092/index.html?q=0'); await page.waitForFunction('window.__frReady', null, { timeout: 60000 });
  await page.evaluate(() => window.__fr.start());
  for (let w = 1; w <= 8; w++) {
    await page.waitForFunction(w => window.__fr.G.wave === w && window.__fr.G.phase === 'fight' && window.__fr.ENEMIES.length > 0, w, { timeout: 120000 }); console.log("wave", w, "started");
    await page.evaluate(() => window.__fr.killAll());
    await page.waitForFunction(() => window.__fr.G.phase === 'rescue', null, { timeout: 10000 });
    await page.evaluate(() => { const f = window.__fr, c = f.FRIENDS[f.G.wave - 1]; f.P.x = c.x + 1.8; f.P.z = c.z; });
    await page.waitForFunction(w => window.__fr.FRIENDS[w - 1].state === 'free', w, { timeout: 10000 });
  }
  await page.waitForFunction(() => window.__fr.G.state === 'result', null, { timeout: 90000 }).catch(async e => { console.log('STUCK', JSON.stringify(await page.evaluate(() => ({ s: window.__fr.G.state, p: window.__fr.G.phase, t: window.__fr.G.timer, w: window.__fr.G.wave, e: window.__fr.errors }))), errs.join('|')); throw e; });
  console.log('victory:', JSON.stringify(await page.evaluate(() => ({ last: window.__fr.G.last, title: document.querySelector('.fr-screen.on h1').textContent }))));
  if (process.argv[2]) await page.screenshot({ path: process.argv[2] });
  await page.evaluate(() => { window.__fr.start(); window.__fr.hurt(200, 0, 0); });
  await page.waitForFunction(() => window.__fr.G.state === 'result', null, { timeout: 90000 }).catch(async e => { console.log('STUCK', JSON.stringify(await page.evaluate(() => ({ s: window.__fr.G.state, p: window.__fr.G.phase, t: window.__fr.G.timer, w: window.__fr.G.wave, e: window.__fr.errors }))), errs.join('|')); throw e; });
  console.log('death:', JSON.stringify(await page.evaluate(() => ({ last: window.__fr.G.last, title: document.querySelector('.fr-screen.on h1').textContent }))), 'errors:', errs.length, errs.slice(0, 3).join(' | '));
  await b.close();
})();
