module.exports = { touch: 1 === 1, viewport: { width: 390, height: 844 }, run: async (page, shot, logs) => {
  await page.waitForTimeout(1200);
  await page.locator('.mb', { hasText: 'ログイン' }).first().click({ force: true }); await page.waitForTimeout(400);
  await page.locator('.li', { hasText: 'ぬるま川' }).first().click({ force: true }); await page.waitForTimeout(600);
  await shot('dev_iphone');
  logs.push(await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).join(',')));
} };
