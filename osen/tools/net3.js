const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const logs = [];
  // (1) 満員の町 → 別の町へ
  const ctx = await b.newContext({ viewport: { width: 390, height: 700 } });
  await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  const filler = await ctx.newPage(); await filler.goto('http://localhost:8091/nettest.txt');
  await filler.evaluate(() => { const bc = new BroadcastChannel('osen-net'); window.__tree = { rooms: { s0c1r1: { p: {} } } }; for (let i = 0; i < 6; i++) window.__tree.rooms.s0c1r1.p['fake' + i] = { c: 1, x: 0, y: 0, z: 0, t: Date.now() + 600000 }; bc.onmessage = (e) => { if (e.data.t === 'hello') bc.postMessage({ t: 'state', tree: window.__tree }); }; });
  const A = await ctx.newPage(); A.on('pageerror', e => logs.push('A PAGEERROR ' + e.message));
  await A.goto('http://localhost:8091/index.html?osennet=local'); await A.waitForFunction('window.__osReady', null, { timeout: 120000 });
  await A.evaluate(() => { const O = __os; O.PLAYER.agreed = true; O.PLAYER.helpSeen = true; O.PLAYER.server = 'ぬるま川サーバー'; O.PLAYER.channel = 'ch.1 すいてる'; O.stepCharSel(false); O.CS.idx = 1; O.csDecide(); });
  await A.waitForTimeout(3000);
  logs.push('full room test -> joined ' + await A.evaluate(() => __os.NET.room));
  await ctx.close();
  // (2) 通信できない（本物のURL、この環境からは届かない）
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 700 } });
  await ctx2.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  await ctx2.route('https://*.firebaseio.com/**', r => r.abort());
  const C = await ctx2.newPage(); C.on('pageerror', e => logs.push('C PAGEERROR ' + e.message));
  await C.goto('http://localhost:8091/index.html'); await C.waitForFunction('window.__osReady', null, { timeout: 120000 });
  await C.evaluate(() => { const O = __os; O.PLAYER.agreed = true; O.PLAYER.helpSeen = true; O.stepCharSel(false); O.CS.idx = 2; O.csDecide(); });
  await C.waitForTimeout(15000);
  const p0 = await C.evaluate(() => __os.P.pos.z); await C.evaluate(() => { __os.IN.mz = -1; }); await C.waitForTimeout(2000); await C.evaluate(() => { __os.IN.mz = 0; });
  logs.push('offline: status=' + await C.evaluate(() => __os.NET.statusText()) + ' moved=' + (p0 - await C.evaluate(() => __os.P.pos.z)).toFixed(1) + ' fbLoaded=' + await C.evaluate(() => !!globalThis.__osenFirebase) + ' err=' + await C.evaluate(() => globalThis.__osenFirebaseErr || ''));
  logs.push('C log: ' + JSON.stringify(await C.evaluate(() => [...document.querySelectorAll('#os-log .ls div')].map(e => e.textContent).filter(t => /同時|通信/.test(t)))));
  console.log(logs.join('\n')); await b.close();
})();
