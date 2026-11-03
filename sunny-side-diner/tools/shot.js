const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
module.exports = async function run(opts) {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 390, height: 844 }, deviceScaleFactor: opts.dsf || 1, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' } }));
  const FC = path.join(__dirname, 'fontcache');
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: fs.existsSync(FC + '/fonts.css') ? fs.readFileSync(FC + '/fonts.css') : '', contentType: 'text/css', headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.route('https://fonts.gstatic.com/**', r => { const f = FC + '/' + r.request().url().replace('https://fonts.gstatic.com/', '').replace(/\//g, '_'); if (fs.existsSync(f)) r.fulfill({ body: fs.readFileSync(f), contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' } }); else r.abort(); });
  await page.goto(opts.url || 'http://localhost:8080/index.html');
  return { b, page, logs };
};
