// node scenario.js '<json steps>' [w h]
const run = require('./shot.js');
(async () => {
  const steps = JSON.parse(process.argv[2]);
  const w = +process.argv[3] || 390, h = +process.argv[4] || 844;
  const { b, page, logs } = await run({ viewport: { width: w, height: h }, url: 'http://localhost:8080/index.html?hptest' });
  const t0 = Date.now();
  try {
    await page.waitForFunction(() => window.__hpReady, null, { timeout: 120000 });
    for (const s of steps) {
      if (s.wait) await page.waitForTimeout(s.wait);
      if (s.until) await page.waitForFunction(c => window.__hpEval(c), s.until, { timeout: s.timeout || 60000 }).catch(e => console.log('until timeout', s.until));
      if (s.click) await page.mouse.click(s.click[0], s.click[1]);
      if (s.sel) await page.click(s.sel).catch(e => console.log('noclick', s.sel));
      if (s.eval) { const r = await page.evaluate(c => { try { return JSON.stringify(window.__hpEval(c)); } catch (e) { return 'ERR ' + e.message; } }, s.eval); if (s.log !== false) console.log('eval>', String(r).slice(0, 1500)); }
      if (s.key) await page.keyboard.press(s.key);
      if (s.down) await page.keyboard.down(s.down);
      if (s.up) await page.keyboard.up(s.up);
      if (s.shot) await page.screenshot({ path: process.env.S + '/' + s.shot + '.png' });
    }
  } catch (e) { console.log('ERR', e.message); }
  console.log('--- logs (' + ((Date.now() - t0) / 1000).toFixed(1) + 's)');
  console.log(logs.filter(l => !l.includes('willReadFrequently') && !l.includes('GPU stall')).slice(0, 40).join('\n'));
  await b.close();
})();
