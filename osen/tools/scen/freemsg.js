module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.PLAYER.helpSeen = true; __os.stepCharSel(false); __os.CS.idx = 2; __os.csDecide(); });
  await page.waitForTimeout(800);
  await page.tap('.slot >> nth=3', { force: true }); await page.waitForTimeout(400);
  await page.locator('.mb', { hasText: '自由に書く' }).first().tap({ force: true }); await page.waitForTimeout(400);
  await page.fill('input.fm', '団地の屋上で待ってます　しね 080-1234-5678');
  await page.waitForTimeout(300); await shot('fm_input');
  await page.locator('#os-ui .ow .mb', { hasText: '送る' }).first().tap({ force: true }); await page.waitForTimeout(1200); await shot('fm_sent');
} };
