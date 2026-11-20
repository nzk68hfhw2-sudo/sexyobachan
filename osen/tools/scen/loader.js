module.exports = { touch: true, url: 'http://localhost:8092/index.html', run: async (page, shot, logs) => {
  await page.waitForTimeout(1000); await shot('l_loader');
  logs.push('fatal=' + await page.evaluate(() => !!document.getElementById('os-fatal')) + ' origin=' + await page.evaluate(() => location.origin));
  await page.tap('.os-big >> text=あそぶ', { force: true }); await page.waitForTimeout(2500); await shot('l_game');
} };
