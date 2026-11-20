module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(1500); await shot('01_intro');
  await page.evaluate(() => { const b = [...document.querySelectorAll('.os-big')].find(e => /あそぶ/.test(e.textContent)); b.click(); });
  await page.waitForTimeout(2500); await shot('02_start');
  const pts = [['eki_plaza', 0, -46, 0, 0], ['station', 0, -60, 0, 0.15], ['shoten', 50, 20, 0, 0], ['danchi', -60, 0, 1.3, 0.2], ['koen', 0, 20, 0, 0.1], ['kawa', 0, 40, Math.PI, 0], ['akichi', 45, 75, Math.PI, 0.1], ['jinja', -80, -60, 0, 0.2]];
  for (const p of pts) {
    await page.evaluate((p) => { __os.teleport(p[1], 0.05, p[2], p[3]); __os.P.pitch = p[4]; }, p);
    await page.waitForTimeout(1800); await shot('03_' + p[0]);
  }
  logs.push(JSON.stringify(await page.evaluate(() => ({ q: __os.R.quality, fps: __os.R.lastFps, pol: __os.G.pol, calls: __os.R.renderer.info.render.calls, tris: __os.R.renderer.info.render.triangles }))));
} };
