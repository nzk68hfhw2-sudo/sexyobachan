module.exports = { touch: true, viewport: { width: 375, height: 667 }, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.PLAYER.helpSeen = true; __os.stepCharSel(false); __os.CS.idx = 1; __os.csDecide(); });
  await page.waitForTimeout(800);
  await page.tap('.slot >> nth=3', { force: true }); await page.waitForTimeout(500);
  await shot('slot9');
  logs.push(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.slot')].map(e => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.left), Math.round(r.right)]; }))));
} };
