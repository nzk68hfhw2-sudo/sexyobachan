// node look.js name station [yaw pitch] [w h] -- screenshot a station
const run = require('./shot.js');
(async () => {
  const [name, st, yaw, pitch] = process.argv.slice(2);
  const w = +process.argv[6] || 390, h = +process.argv[7] || 844;
  const { b, page, logs } = await run({ viewport: { width: w, height: h }, dsf: +process.env.DSF || 1, url: 'http://localhost:8080/index.html?ssdtest' });
  try {
    await page.waitForFunction(() => window.__ssdReady || document.getElementById('ssd-fatal') || window.__ssdErr, null, { timeout: 240000 });
    for (const s of st.split(',')) {
      await page.evaluate(([s, y, p]) => window.__ssdEval(`camSetStation('${s}', true); CAM.tYaw=CAM.lookYaw=${y || 0}; CAM.tPitch=CAM.lookPitch=${p || 0}; if(window.__pre) __pre(); 1`), [s, yaw, pitch]);
      await page.evaluate(() => window.__ssdEval("if (SCR.warn) { killScr(SCR.warn); SCR.warn = null; } CAM.override = null; CM.on = false; if (!process_ui) { UI.style.display = 'none'; } 1".replace('process_ui', 'false')));
      if (process.env.PRE) await page.evaluate(c => window.__ssdEval(c), process.env.PRE);
      await page.waitForTimeout(+process.env.WAIT || 2500);
      await page.screenshot({ path: process.env.S + '/' + name + '_' + s + '.png', timeout: 180000 });
    }
  } catch (e) { console.log('ERR', e.message); }
  console.log(logs.filter(l => !l.includes('willReadFrequently') && !l.includes('GPU stall')).slice(0, 12).map(l => l.slice(0, 400)).join('\n'));
  await b.close();
})();
