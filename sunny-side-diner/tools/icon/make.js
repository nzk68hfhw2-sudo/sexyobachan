const run = require('/home/user/sexyobachan/sunny-side-diner/tools/shot.js'); const fs = require('fs');
const D = '/tmp/claude-0/-home-user-sexyobachan/3e557370-2a49-54b8-ba77-e910b93bd553/scratchpad/icon3d/';
(async () => {
  const { b, page, logs } = await run({ viewport: { width: 1024, height: 1024 }, url: 'http://localhost:8080/index.html?ssdtest' });
  await page.waitForFunction(() => window.__ssdReady, null, { timeout: 240000 });
  await page.waitForTimeout(800); await page.mouse.click(512, 600); await page.waitForTimeout(3000);
  await page.evaluate(() => window.__ssdEval("hideTitle(); stopMusic(0.1); setQuality('HIGH'); UI.style.display='none'; 1"));
  const code = fs.readFileSync(D + 'sunny3d.js', 'utf8');
  for (const v of (process.argv[2] || 'cute,creepy').split(',')) {
    const r = await page.evaluate(([c, v]) => { try { return window.__ssdEval(c + '("' + v + '")'); } catch (e) { return 'ERR ' + e.message + e.stack; } }, [code, v]);
    console.log(v, r);
    await page.waitForTimeout(9000);
    await page.screenshot({ path: D + 'raw_' + v + '.png', timeout: 180000 });
  }
  console.log(logs.filter(l => /error/i.test(l)).slice(0, 5).join('\n'));
  await b.close();
})();
