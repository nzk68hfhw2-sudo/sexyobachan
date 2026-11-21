module.exports = { touch: true, url: 'http://localhost:8091/index.html?osentop=64', run: async (page, shot, logs) => {
  await page.waitForTimeout(1000); await shot('u_login');
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.waitForTimeout(500); await shot('u_srv');
  await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(800); await shot('u_cs');
  await page.locator('#os-namein').fill('しね'); await clickText('この人で始める'); await page.waitForTimeout(300);
  logs.push('bad name blocked ' + await page.evaluate(() => !!document.getElementById('os-namein')));
  await page.locator('#os-namein').fill('ぶち壊し花子'); await clickText('この人で始める'); await page.waitForTimeout(1500);
  logs.push('name ' + await page.evaluate(() => __os.PLAYER.name + ' free ' + __os.PLAYER.nameFree + ' pol ' + __os.G.pol.toFixed(1)));
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }).catch(() => {}); await page.waitForTimeout(500);
  await page.evaluate(() => { __os.CS && 0; }); await shot('u_game');
} };
