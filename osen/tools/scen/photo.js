module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  // dash speed: full stick
  await page.evaluate(() => { const O = __os; O.teleport(0, 0.05, 0, 0); O.IN.stickId = 99; O.IN.mx = 0; O.IN.mz = -1; window._p0 = O.P.pos.clone(); });
  await page.waitForTimeout(1000);
  logs.push('dash 1s dist ' + await page.evaluate(() => { const O = __os; O.IN.mz = 0; O.IN.stickId = null; return O.P.pos.distanceTo(window._p0).toFixed(1); }));
  await page.locator('#os-pbtn').tap({ force: true }); await page.waitForTimeout(500); await shot('photo1');
  await page.waitForTimeout(3000); await shot('photo2');
  await page.locator('#os-photo').tap({ force: true }); await page.waitForTimeout(300); await page.locator('#os-photo').tap({ force: true }); await page.waitForTimeout(500);
  logs.push('photo off ' + await page.evaluate(() => !document.getElementById('os-root').classList.contains('photo')));
} };
