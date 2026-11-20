module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.tap('.os-big >> text=あそぶ', { force: true });
  await page.waitForTimeout(1500);
  logs.push('audio ' + JSON.stringify(await page.evaluate(() => ({ st: __os.AUD.ctx && __os.AUD.ctx.state, song: !!__os.AUD.song, step: __os.AUD.step }))));
  await page.tap('#os-tr .os-sq:nth-child(2)', { force: true }); await page.waitForTimeout(300);
  await page.locator('.os-row', { hasText: '軽量モード' }).locator('.os-tg').tap({ force: true });
  await page.locator('.os-row', { hasText: '刺激ひかえめ' }).locator('.os-tg').tap({ force: true });
  await page.waitForTimeout(300); await shot('m_menu');
  await page.locator('#os-ui .os-panel.show .os-big', { hasText: 'とじる' }).tap({ force: true });
  await page.evaluate(() => { __os.G.pol = 120; __os.teleport(0, 0.05, -18, Math.PI); });
  await page.waitForTimeout(6000); await shot('m_lite120');
  logs.push(JSON.stringify(await page.evaluate(() => ({ q: __os.R.quality, pr: __os.R.pr, shadow: __os.R.sun.castShadow, red: __os.REDUCED.on, tris: __os.R.renderer.info.render.triangles, calls: __os.R.renderer.info.render.calls, step: __os.AUD.step }))));
} };
