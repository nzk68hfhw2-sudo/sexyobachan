// usage: node shot.js <script.js>  — runs a scenario (module exporting async fn(page, util))
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three-r128.min.js'));
module.exports = async function run(opts) {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.goto(opts.url || 'http://localhost:8080/index.html');
  return { b, page, logs };
};
