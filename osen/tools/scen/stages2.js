module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  await page.evaluate(() => { const b = [...document.querySelectorAll('.os-big')].find(e => /あそぶ/.test(e.textContent)); b.click(); });
  const levels = [0, 12, 30, 48, 66, 80, 93, 105, 140, 210, 350];
  for (const lv of levels) {
    await page.evaluate((lv) => { __os.G.pol = lv; __os.teleport(-14, 0.05, -24, -0.5); __os.P.pitch = 0.12; }, lv);
    await page.waitForTimeout(6000); await shot('q_' + String(lv).padStart(3, '0'));
  }
  await page.evaluate(() => { __os.P.pitch = 1.2; }); await page.waitForTimeout(1500); await shot('q_up');
  logs.push(JSON.stringify(await page.evaluate(() => ({ q: __os.R.quality, fps: __os.R.lastFps, st: __os.G.stage, clones: __os.G.cloneCount, calls: __os.R.renderer.info.render.calls, tris: __os.R.renderer.info.render.triangles }))));
} };
