const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 700 }, permissions: ['microphone'] });
  await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  const logs = [];
  async function open(name, ch, x) {
    const p = await ctx.newPage(); p.on('pageerror', e => logs.push(name + ' PAGEERROR ' + e.message));
    await p.goto('http://localhost:8091/index.html?osennet=local'); await p.waitForFunction('window.__osReady', null, { timeout: 120000 });
    await p.evaluate(([ch, x]) => { const O = __os; O.PLAYER.agreed = true; O.PLAYER.helpSeen = true; O.PLAYER.voiceOk = true; O.PLAYER.server = 'ぬるま川サーバー'; O.PLAYER.channel = 'ch.1 すいてる'; O.stepCharSel(false); O.CS.idx = ch; O.csDecide(); O.teleport(x, 0.05, -44, 0); O.AUD.ctx || 0; }, [ch, x]);
    await p.mouse.click(200, 300);
    return p;
  }
  const A = await open('A', 0, 0); await A.waitForTimeout(1500);
  const B = await open('B', 4, 3); await B.waitForTimeout(3000);
  await A.evaluate(() => __os.voiceStart()); await B.evaluate(() => __os.voiceStart());
  await A.waitForTimeout(8000);
  const st = (p) => p.evaluate(() => ({ on: __os.VOICE.on, pcs: Object.keys(__os.VOICE.pcs).map(k => [__os.VOICE.pcs[k].pc.connectionState, !!__os.VOICE.pcs[k].gain, +(__os.VOICE.pcs[k].level || 0).toFixed(3)]), peerV: Object.values(__os.NET.peers).map(p => p.v) }));
  logs.push('A ' + JSON.stringify(await st(A)) + ' B ' + JSON.stringify(await st(B)));
  // move B far away -> hang up
  await B.evaluate(() => __os.teleport(60, 0.05, -44, 0)); await A.waitForTimeout(5000);
  logs.push('far: A ' + JSON.stringify(await st(A)) + ' B ' + JSON.stringify(await st(B)));
  await B.evaluate(() => __os.teleport(3, 0.05, -44, 0)); await A.waitForTimeout(7000);
  logs.push('back: A ' + JSON.stringify(await st(A)));
  await A.screenshot({ path: process.argv[2] + '/voiceA.png' });
  console.log(logs.join('\n')); await b.close();
})();
