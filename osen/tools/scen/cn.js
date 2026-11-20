module.exports = { touch: true, dpr: 3, run: async (page, shot, logs) => {
  await page.tap('.os-big >> text=あそぶ', { force: true });
  await page.evaluate(() => { __os.teleport(0, 0.05, -18, Math.PI); });
  await page.waitForTimeout(6000);
  await page.evaluate(() => { const c = document.getElementById('os-cap'); c.style.animation = 'none'; c.style.opacity = 1; c.innerHTML = __os.cnHTML('直骨角令画海　電车が来ない　请勿　这是好的商品です'); const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:10px;top:300px;font:800 30px ' + __os.FONT_SUB + ';color:#fff;background:#000'; d.textContent = '直骨角令画海（日本語）'; document.getElementById('os-hud').appendChild(d); });
  await page.waitForTimeout(300); await page.screenshot({ path: process.argv[3] + '/cn2.png', clip: { x: 60, y: 560, width: 280, height: 90 } }); await page.screenshot({ path: process.argv[3] + '/cn.png', clip: { x: 0, y: 280, width: 390, height: 60 } });
  logs.push('fonts: ' + await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i).join(',')));
} };
