module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true });
  const t0 = Date.now();
  for (let i = 0; i < 3; i++) { await page.locator('.ab.tk').tap({ force: true }); await page.waitForTimeout(700); if (i === 0) await shot('t10_a'); }
  await shot('t10_b');
  logs.push('after ' + ((Date.now() - t0) / 1000).toFixed(1) + 's breaks ' + await page.evaluate(() => __os.SMASH.breaks + ' pts ' + __os.SMASH.pts + ' fly ' + __os.SMASH.flights));
} };
