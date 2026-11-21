module.exports = { touch: true, url: 'http://localhost:8091/index.html?osentop=64', run: async (page, shot, logs) => {
  await page.waitForTimeout(1000);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(800);
  await page.locator('.cs-face').nth(5).tap({ force: true }); await page.waitForTimeout(800); await shot('c_cs');
  logs.push('cs idx ' + await page.evaluate(() => __os.CS.idx));
  await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }).catch(() => {}); await page.waitForTimeout(400);
  await page.evaluate(() => { __os.G.pol = 160; }); await page.waitForTimeout(2500); await shot('c_pol');
  await page.locator('#os-qbtn').tap({ force: true }); await page.waitForTimeout(1500); await shot('c_poloff');
  logs.push('polfx ' + await page.evaluate(() => __os.G.pol.toFixed(0) + ' calls ' + __os.R.renderer.info.render.calls));
} };
