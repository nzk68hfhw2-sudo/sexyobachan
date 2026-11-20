module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: 'ぬるま川' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  for (const g of [1, 3, 5]) {
    await page.evaluate((g) => { const O = __os; O.brkResetAll(); O.gunSelect(g); O.teleport(48, 0.05, 15, 0); O.CAM.yaw = 0; O.CAM.pitch = 0.08; O.IN.fire = true; }, g);
    await page.waitForTimeout(g === 3 ? 450 : 350); await shot('b_gun' + g); await page.evaluate(() => { __os.IN.fire = false; }); await page.waitForTimeout(1500);
  }
  await page.evaluate(() => { const O = __os; O.brkResetAll(); O.setPlayerChar(5); O.PLAYER.char = 5; O.teleport(48, 0.05, 15, 0); O.CAM.yaw = 0; O.P.skillCd = 0; O.skillGo('beam'); });
  await page.waitForTimeout(700); await shot('b_beam');
} };
