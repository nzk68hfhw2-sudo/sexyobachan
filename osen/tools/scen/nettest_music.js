module.exports = { touch: true, url: 'http://localhost:8092/nt.html', run: async (page, shot, logs) => {
  await page.waitForTimeout(16000);
  logs.push(await page.evaluate(() => [...document.querySelectorAll('#ntx .r')].filter(r => /曲/.test(r.textContent)).map(r => r.textContent).join('|')));
  await page.locator('#ntx button').tap(); await page.waitForTimeout(2000);
  logs.push(await page.evaluate(() => document.querySelector('#ntx button').nextSibling.textContent));
  await shot('nettest_music');
} };
