module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(1500); await shot('v_login');
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(500); };
  await clickText('ログイン'); await shot('v_server');
  await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(500); await shot('v_channel');
  await clickText('ch.1'); await shot('v_terms');
  await clickText('同意する'); await page.waitForTimeout(1200); await shot('v_charsel');
  await page.locator('.cs-nav').nth(1).tap({ force: true }); await page.waitForTimeout(800); await shot('v_charsel2');
  await clickText('この人で始める'); await page.waitForTimeout(2500); await shot('v_world');
  logs.push(JSON.stringify(await page.evaluate(() => ({ char: __os.PLAYER.char, items: __os.ITEMS.list.length, npcs: __os.NPCS.length, menu: __os.G.inMenu, paused: __os.G.paused }))));
} };
