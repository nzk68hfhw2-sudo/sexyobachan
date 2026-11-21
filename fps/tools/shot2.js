// screenshots + smoke test of v2 features (guest mode). usage: node tools/shot2.js <outDir>
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three-r128.min.js'));
(async () => {
  const out = process.argv[2] || '.';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); const logs = [];
  page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); }); page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  await page.goto('http://localhost:8092/index.html?q=1');
  await page.waitForFunction('window.__frReady', null, { timeout: 60000 });
  await page.waitForFunction('["boys","girls","boys_lod","girls_lod"].every(k=>window.__fr.MODEL_STATUS[k]!=="loading")', null, { timeout: 60000 });
  await page.waitForTimeout(800); await page.screenshot({ path: path.join(out, 'v2_title.png') });
  const ev = f => page.evaluate(f);
  await ev(() => window.__fr.startTdm()); await page.waitForTimeout(5000);
  await ev(() => { const f = window.__fr, e = f.ENEMIES.find(e => e.team === 1 && !e.dead); if (e) { f.P.yaw = Math.atan2(-(e.x - f.P.x), -(e.z - f.P.z)); } });
  await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, 'v2_tdm.png') });
  // bring one enemy and one ally in front, aim with sniper
  await ev(() => { const f = window.__fr, P = f.P; P.yaw = 0; P.pitch = 0; const en = f.ENEMIES.filter(e => e.team === 1 && !e.dead)[0], al = f.ENEMIES.filter(e => e.team === 0 && !e.dead)[0]; en.x = P.x + 1.2; en.z = P.z - 7; al.x = P.x - 1.6; al.z = P.z - 5; });
  await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, 'v2_teams.png') });
  await ev(() => { window.__fr.input.switchTo = 3; }); await page.waitForTimeout(600); await ev(() => { window.__fr.input.aim = true; }); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'v2_scope.png') });
  await ev(() => { window.__fr.input.aim = false; window.__fr.input.switchTo = 2; }); await page.waitForTimeout(600); await ev(() => { window.__fr.input.fire = true; }); await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, 'v2_shotgun.png') }); await ev(() => { window.__fr.input.fire = false; window.__fr.input.grenade = true; });
  await page.waitForTimeout(3000);
  const st = await ev(() => { const f = window.__fr, T = f.G.tdm; return { state: f.G.state, score: T.score, time: Math.round(T.timeLeft), roster: T.roster.map(r => r.name + ':' + r.kills + '/' + r.deaths), nades: f.P.nades, alive: f.ENEMIES.filter(e => !e.dead).length, fps: f.Q.fps }; });
  console.log(JSON.stringify(st));
  await ev(() => { const f = window.__fr; f.G.tdm.score[0] = f.G.tdm.target; }); await page.waitForFunction(() => window.__fr.G.state === 'result', null, { timeout: 60000 });
  await page.waitForTimeout(700); await page.screenshot({ path: path.join(out, 'v2_result.png') });
  console.log('coins after match:', await ev(() => window.__fr.ECO.coins), await ev(() => document.querySelector('.fr-res .fr-prof').textContent));
  await ev(() => { document.querySelectorAll('.fr-screen.on button')[1].dispatchEvent(new Event('click')); }); await page.waitForTimeout(400);
  await ev(() => { const g = JSON.parse(localStorage.getItem('fr_eco')); g.coins = 5000; localStorage.setItem('fr_eco', JSON.stringify(g)); });
  await page.locator('.fr-screen.on button', { hasText: 'ショップ' }).tap(); await page.waitForTimeout(900); await page.screenshot({ path: path.join(out, 'v2_shop_weapon.png') });
  for (const [tab, file] of [['スキン', 'skin'], ['ぼうし', 'hat']]) { await page.locator('.fr-tabs span', { hasText: tab }).tap(); await page.waitForTimeout(300); await page.locator('.fr-item').last().tap(); await page.waitForTimeout(900); await page.screenshot({ path: path.join(out, 'v2_shop_' + file + '.png') }); }
  console.log('errors:', logs.length, logs.slice(0, 6).join('\n'));
  await b.close();
})();
