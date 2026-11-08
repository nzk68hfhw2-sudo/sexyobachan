// touch input test: drag joystick + look + tap via CDP
const run = require('./shot.js');
(async () => {
  const { b, page, logs } = await run({ viewport: { width: 390, height: 844 }, touch: true });
  const S = process.env.S;
  await page.waitForFunction(() => window.__rmReady, null, { timeout: 120000 });
  const cdp = await page.context().newCDPSession(page);
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: p[2] || i })) });
  const ev = c => page.evaluate(c => JSON.stringify(window.__rmEval(c)), c);
  await page.waitForTimeout(2000);
  await page.tap('#rm-ok'); await page.waitForTimeout(600); await page.tap('#rm-start'); await page.waitForTimeout(2500);
  console.log('start', await ev('[PL.x.toFixed(2),PL.z.toFixed(2),PL.yaw.toFixed(2)]'));
  // joystick: press left side and push up for 2 seconds
  await T('touchStart', [[80, 650, 1]]);
  for (let i = 0; i < 20; i++) { await T('touchMove', [[80, 650 - Math.min(50, i * 5), 1]]); await page.waitForTimeout(100); }
  await T('touchEnd', []);
  console.log('after stick', await ev('[PL.x.toFixed(2),PL.z.toFixed(2)]'));
  // look: drag right side horizontally
  await T('touchStart', [[300, 400, 2]]);
  for (let i = 0; i < 10; i++) { await T('touchMove', [[300 - i * 10, 400, 2]]); await page.waitForTimeout(30); }
  await T('touchEnd', []);
  console.log('after look', await ev('PL.yaw.toFixed(2)'));
  // simultaneous stick + look
  await T('touchStart', [[80, 650, 3], [300, 400, 4]]);
  for (let i = 0; i < 10; i++) { await T('touchMove', [[80, 610, 3], [300 + i * 8, 400, 4]]); await page.waitForTimeout(60); }
  await T('touchEnd', []);
  console.log('multi', await ev('[PL.x.toFixed(2),PL.z.toFixed(2),PL.yaw.toFixed(2)]'));
  // tap on fridge: turn toward it first
  await ev('PL.x=-0.3;PL.z=1.0;PL.yaw=PI;PL.pitch=-0.1;1'); await page.waitForTimeout(800);
  const p = JSON.parse(await ev('(function(){var it=WORLD.inter.filter(function(o){return o.id==="fridge"})[0];var v=it.pos.clone().project(RENDER.camera);return [(v.x+1)/2*RENDER.w,(1-v.y)/2*RENDER.h];})()'));
  console.log('fridge at', p);
  await T('touchStart', [[p[0], p[1], 5]]); await page.waitForTimeout(80); await T('touchEnd', []);
  console.log('tapAt', await ev('JSON.stringify(INPUT.tapAt)+" pick:"+(function(){var it=pickAt(' + ((p[0]/390)*2-1) + ',' + (-(p[1]/844)*2+1) + ',3.2);return it?it.id:"none"})()+" enabled:"+INPUT.enabled'));
  await page.waitForTimeout(800);
  console.log('modal', await ev('MODAL ? MODAL.title.textContent : "none"'));
  await page.screenshot({ path: S + '/50_touch_fridge.png' });
  console.log(logs.slice(0, 20).join('\n'));
  await b.close();
})();
