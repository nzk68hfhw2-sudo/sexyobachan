const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true });
  await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  const logs = [];
  async function open(name, ch, x, z) {
    const p = await ctx.newPage(); p.on('pageerror', e => logs.push(name + ' PAGEERROR ' + e.message));
    await p.goto('http://localhost:8091/index.html?osennet=local'); await p.waitForFunction('window.__osReady', null, { timeout: 120000 });
    await p.evaluate(([ch, x, z]) => { const O = __os; O.PLAYER.agreed = true; O.PLAYER.helpSeen = true; O.PLAYER.srvId = 'main'; O.PLAYER.server = '公式サーバー'; O.PLAYER.ch = ch; O.stepCharSel(false); O.CS.idx = ch; O.csDecide(); O.teleport(x, 0.05, z, 0); document.querySelectorAll('.ow').forEach(e => e.style.display = 'none'); Object.values(O.WIN.list).forEach(w => w.open = false); O.G.paused = false; }, [ch, x, z]);
    return p;
  }
  const A = await open('A', 3, -60, 20); await A.waitForTimeout(2500);
  const B = await open('B', 1, 40, -50); await B.waitForTimeout(3000);
  logs.push('rooms A ' + await A.evaluate(() => __os.NET.room) + ' B ' + await B.evaluate(() => __os.NET.room));
  await B.locator('#os-wbtn').tap({ force: true }); await B.waitForTimeout(5000);
  logs.push('after warp B room ' + await B.evaluate(() => __os.NET.room + ' pos ' + __os.P.pos.toArray().map(v => v.toFixed(1)) + ' peers ' + Object.keys(__os.NET.peers).length));
  logs.push('A sees ' + await A.evaluate(() => Object.values(__os.NET.peers).map(p => p.name + '@' + p.pos.toArray().map(v => v.toFixed(0))).join(',')));
  await B.screenshot({ path: path.join(out, 'warpB.png') });
  // A walks away, B warps again within same room
  await A.evaluate(() => { __os.teleport(30, 0.05, 0, 0); }); await A.waitForTimeout(2500);
  await B.locator('#os-wbtn').tap({ force: true }); await B.waitForTimeout(800);
  logs.push('B pos2 ' + await B.evaluate(() => __os.P.pos.toArray().map(v => v.toFixed(1))));
  console.log(logs.join('\n')); await b.close();
})();
