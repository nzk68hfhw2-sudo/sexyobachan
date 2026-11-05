const run = require('/home/user/sexyobachan/sunny-side-diner/tools/shot.js'); const fs = require('fs');
const D = '/tmp/claude-0/-home-user-sexyobachan/3e557370-2a49-54b8-ba77-e910b93bd553/scratchpad/icon4/';
(async () => {
  const cfg = JSON.parse(process.argv[2]);
  const { b, page } = await run({ viewport: { width: 1024, height: 1024 }, url: 'http://localhost:8080/index.html?ssdtest' });
  await page.waitForFunction(() => window.__ssdReady, null, { timeout: 240000 });
  await page.waitForTimeout(800); await page.mouse.click(512, 600); await page.waitForTimeout(3000);
  await page.evaluate(() => window.__ssdEval("hideTitle(); stopMusic(0.1); setQuality('HIGH'); UI.style.display='none'; 1"));
  const code = fs.readFileSync(D + 'scene.js', 'utf8');
  const r = await page.evaluate(([c, cfg]) => { try { return window.__ssdEval(c + '(' + JSON.stringify(cfg) + ')'); } catch (e) { return 'ERR ' + e.message + e.stack; } }, [code, cfg]);
  console.log(r);
  await page.waitForTimeout(10000);
  await page.screenshot({ path: D + (cfg.out || 'raw') + '.png', timeout: 180000 });
  await b.close();
})();
