module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  await page.evaluate(() => { const b = [...document.querySelectorAll('.os-big')].find(e => /あそぶ/.test(e.textContent)); b.click(); });
  await page.waitForTimeout(800);
  // touch a bunch of props
  const r = await page.evaluate(() => { let n = 0; for (const p of __os.PROPS) { for (let k = 0; k < 3; k++) { __os.touchProp(p); n++; } } return n; });
  logs.push('touched ' + r);
  await page.waitForTimeout(1500); await shot('t_after_touch');
  const levels = [5, 15, 30, 50, 65, 82, 95, 110, 150, 250, 400];
  for (const lv of levels) {
    await page.evaluate((lv) => { __os.G.pol = lv; __os.teleport(0, 0.05, -40.5, 0); __os.P.pitch = 0.05; }, lv);
    await page.waitForTimeout(3500); await shot('p_' + String(lv).padStart(3, '0'));
  }
  logs.push(JSON.stringify(await page.evaluate(() => ({ q: __os.R.quality, fps: __os.R.lastFps, pol: __os.G.pol, st: __os.G.stage, clones: __os.G.cloneCount, calls: __os.R.renderer.info.render.calls, tris: __os.R.renderer.info.render.triangles }))));
} };
