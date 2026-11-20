// テスト用：ゲームを開いてシナリオを実行し、スクリーンショットを撮る
// usage: node tools/run.js <scenario.js> [outdir]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
(async () => {
  const scen = require(path.resolve(process.argv[2]));
  const out = process.argv[3] || '/tmp/shots'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const vp = scen.viewport || { width: 390, height: 844 };
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: scen.dpr || 1, hasTouch: !!scen.touch, isMobile: !!scen.touch });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { const t = m.type() + ': ' + m.text(); if (!/GPU stall|GL Driver/.test(t)) logs.push(t); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  if (!scen.realCdn) await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' } }));
  const t0 = Date.now();
  await page.goto(scen.url || 'http://localhost:8091/index.html');
  try { await page.waitForFunction('window.__osReady || document.getElementById("os-fatal")', null, { timeout: 120000 }); } catch (e) { logs.push('TIMEOUT waiting ready'); }
  logs.push('ready in ' + (Date.now() - t0) + 'ms');
  const shot = async (name) => { await page.screenshot({ path: path.join(out, name + '.png') }); };
  try { await scen.run(page, shot, logs); } catch (e) { logs.push('SCENARIO ERROR ' + e.message); await shot('error'); }
  console.log(logs.join('\n'));
  await b.close();
})();
