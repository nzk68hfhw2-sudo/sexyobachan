module.exports = { touch: true, url: 'http://localhost:8092/nt.html', run: async (page, shot, logs) => {
  await page.waitForTimeout(14000); await shot('nettest');
  logs.push(await page.evaluate(() => document.getElementById('ntc') && document.getElementById('ntc').textContent));
} };
