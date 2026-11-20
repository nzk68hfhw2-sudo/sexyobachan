// 2つの画面を同時に開いて、同時プレイの同期を確認する
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, 'three-r128.min.js'));
(async () => {
  const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 700 }, hasTouch: true, isMobile: true });
  await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  const logs = [];
  async function open(name, ch, x) {
    const p = await ctx.newPage(); p.on('pageerror', e => logs.push(name + ' PAGEERROR ' + e.message));
    await p.goto('http://localhost:8091/index.html?osennet=local'); await p.waitForFunction('window.__osReady', null, { timeout: 120000 });
    await p.evaluate(([ch, x]) => { const O = __os; O.PLAYER.agreed = true; O.PLAYER.helpSeen = true; O.PLAYER.server = 'ぬるま川サーバー'; O.PLAYER.channel = 'ch.1 すいてる'; O.stepCharSel(false); O.CS.idx = ch; O.csDecide(); O.teleport(x, 0.05, -44, 0); document.querySelectorAll('.ow').forEach(e => e.style.display = 'none'); Object.values(O.WIN.list).forEach(w => w.open = false); O.G.paused = false; }, [ch, x]);
    return p;
  }
  const A = await open('A', 0, 0); await A.waitForTimeout(1500);
  const B = await open('B', 4, 3); await B.waitForTimeout(3000);
  const st = async (p) => p.evaluate(() => ({ room: __os.G && window.__os ? undefined : 0 }));
  const peersOf = (p) => p.evaluate(() => { const n = window.__osNET; return null; });
  // expose NET via evaluate of a global? use DOM: count name tags with class pc
  const tagCount = (p) => p.evaluate(() => [...document.querySelectorAll('.nmtag.pc')].filter(e => e.style.display !== 'none').map(e => e.textContent));
  logs.push('A sees: ' + JSON.stringify(await tagCount(A)) + ' / B sees: ' + JSON.stringify(await tagCount(B)));
  // A walks forward (north) 2s
  await A.evaluate(() => { __os.IN.mz = -1; }); await A.waitForTimeout(2500); await A.evaluate(() => { __os.IN.mz = 0; });
  await B.waitForTimeout(1500);
  logs.push('A pos ' + JSON.stringify(await A.evaluate(() => __os.P.pos.toArray().map(v => +v.toFixed(1)))));
  logs.push('B tags ' + JSON.stringify(await B.evaluate(() => [...document.querySelectorAll('.nmtag')].map(e => [e.className, e.textContent, e.style.display, e.style.left, e.style.top]))));
  logs.push('B proj ' + JSON.stringify(await B.evaluate(() => { const cam = __os.R.camera; return Object.values(__os.NET.peers).map(pp => { const v = pp.pos.clone(); v.y += pp.h + 0.35; v.project(cam); return [v.x.toFixed(2), v.y.toFixed(2), v.z.toFixed(3), cam.position.distanceTo(pp.pos).toFixed(1), pp.h]; }); })));
  logs.push('B peers ' + JSON.stringify(await B.evaluate(() => Object.values(__os.NET.peers).map(p => [p.name, p.vis, p.pos.toArray().map(v => +v.toFixed(1)), p.snaps.length]))) + ' A peers ' + JSON.stringify(await A.evaluate(() => Object.values(__os.NET.peers).map(p => [p.name, p.vis, p.pos.toArray().map(v => +v.toFixed(1))]))) + ' rooms ' + await A.evaluate(() => __os.NET.room) + '/' + await B.evaluate(() => __os.NET.room));
  // A grabs cone spawned and throws it; B checks item position
  await A.evaluate(() => { const O = __os, P = O.P; const it = O.spawnItem('daruma', P.pos.x, P.pos.y, P.pos.z - 1.2, 0, {}); window.__ait = it; O.grab(it); });
  await A.waitForTimeout(800);
  await A.evaluate(() => { __os.release(true); });
  await A.waitForTimeout(9000);
  logs.push('B i-node ' + JSON.stringify(await B.evaluate(() => __os.NET.T.once('rooms/' + __os.NET.room + '/i'))));
  logs.push('B daruma ' + JSON.stringify(await B.evaluate(() => __os.ITEMS.list.filter(i => i.type === 'daruma').map(i => [i.netKey, i.body.pos.toArray().map(v => +v.toFixed(1)), i.def ? i.def.id : '']))));
  const aItem = await A.evaluate(() => { const it = window.__ait; return [it.netKey, it.body.pos.toArray().map(v => +v.toFixed(1)), it.body.sleep, it.ownSettle]; });
  const bItem = await B.evaluate((k) => { const it = __os.ITEMS.list.find(i => i.netKey === k); return it ? [it.body.pos.toArray().map(v => +v.toFixed(1)), it.body.sleep, it.heldBy] : null; }, aItem[0]);
  logs.push('item A ' + JSON.stringify(aItem) + ' B ' + JSON.stringify(bItem));
  // A says phrase & stamp; B log
  await A.evaluate(() => { __os.say('はい。'); });
  await A.waitForTimeout(1500);
  logs.push('B log talk: ' + JSON.stringify(await B.evaluate(() => [...document.querySelectorAll('#os-log .ls div')].map(e => e.textContent).filter(t => /はい。|来ました/.test(t)))));
  await A.evaluate(() => { __os.NET.send('msg', { m: 'やあ　しね　090-1111-2222' }); }); await A.waitForTimeout(1500);
  logs.push('B got msg: ' + JSON.stringify(await B.evaluate(() => [...document.querySelectorAll('#os-log .ls div')].map(e => e.textContent).filter(t => /やあ/.test(t)))));
  // pollution share
  await A.evaluate(() => { __os.addPollution(20); }); await A.waitForTimeout(4500);
  logs.push('pol A ' + (await A.evaluate(() => __os.G.pol.toFixed(1))) + ' B ' + (await B.evaluate(() => __os.G.pol.toFixed(1))));
  // B combines item: spawn cup + onigiri throw
  await B.evaluate(() => { const O = __os, P = O.P; const a = O.spawnItem('cup', P.pos.x, P.pos.y, P.pos.z - 2, 0, { awake: true }); const b2 = O.spawnItem('onigiri', P.pos.x, P.pos.y + 0.6, P.pos.z - 2, 0, { awake: true }); b2.body.thrownT = 2; b2.body.vel.y = -3; });
  await B.waitForTimeout(3000);
  logs.push('A has chazuke: ' + await A.evaluate(() => __os.ITEMS.list.filter(i => i.type === 'chazuke').length) + ' B: ' + await B.evaluate(() => __os.ITEMS.list.filter(i => i.type === 'chazuke').length));
  await B.evaluate(() => { __os.teleport(0.5, 0.05, -40, 0); }); await A.evaluate(() => { __os.teleport(0, 0.05, -44, Math.PI); }); await B.waitForTimeout(2500);
  logs.push('B tags ' + JSON.stringify(await tagCount(B)) + ' A tags ' + JSON.stringify(await tagCount(A)));
  await A.screenshot({ path: out + '/netA.png' }); await B.screenshot({ path: out + '/netB.png' });
  // B leaves
  await B.close(); await A.waitForTimeout(2500);
  logs.push('after B left, A sees: ' + JSON.stringify(await tagCount(A)));
  console.log(logs.join('\n')); await b.close();
})();
