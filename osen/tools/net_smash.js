// 2つの画面で、こわれた物が同じになるか確認
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 700 }, hasTouch: true, isMobile: true });
  await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  const logs = [];
  async function open(name, ch, x, net) {
    const p = await ctx.newPage(); p.on('pageerror', e => logs.push(name + ' PAGEERROR ' + e.message));
    await p.goto('http://localhost:8091/index.html?osennet=' + (net || 'local')); await p.waitForFunction('window.__osReady', null, { timeout: 120000 });
    await p.evaluate(([ch, x]) => { const O = __os; O.PLAYER.agreed = true; O.PLAYER.helpSeen = true; O.PLAYER.server = 'ぬるま川サーバー'; O.PLAYER.channel = 'ch.1 すいてる'; O.stepCharSel(false); O.CS.idx = ch; O.csDecide(); O.teleport(x, 0.05, -44, 0); document.querySelectorAll('.ow').forEach(e => e.style.display = 'none'); Object.values(O.WIN.list).forEach(w => w.open = false); O.G.paused = false; }, [ch, x]);
    return p;
  }
  const A = await open('A', 0, 0); await A.waitForTimeout(1500);
  const B = await open('B', 4, 3); await B.waitForTimeout(3000);
  await A.evaluate(() => { const O = __os; O.smashBlast(new O.P.pos.constructor(0, 1, -55), 14, 8, { kind: 'skill', key: 'x' }); });
  await A.waitForTimeout(2500);
  const ids = (p) => p.evaluate(() => __os.BRK.list.filter(b => b.broken).map(b => b.id).join(',') + ' | items ' + __os.ITEMS.list.filter(i => i.broken).map(i => i.netKey || (i.def && i.def.id)).join(','));
  logs.push('A broken: ' + await ids(A)); logs.push('B broken: ' + await ids(B));
  await A.screenshot({ path: path.join(out, 'nA.png') }); await B.screenshot({ path: path.join(out, 'nB.png') });
  // offline mode keeps working
  const C = await open('C', 2, 0, 'off'); await C.waitForTimeout(1500);
  await C.evaluate(() => { const O = __os; O.smashBlast(new O.P.pos.constructor(0, 1, -55), 14, 8, { kind: 'skill', key: 'x' }); }); await C.waitForTimeout(1500);
  logs.push('C offline broken count ' + await C.evaluate(() => __os.BRK.list.filter(b => b.broken).length + ' net ' + __os.NET.on));
  console.log(logs.join('\n')); await b.close();
})();
