module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  await page.evaluate(() => { const O = __os; O.setPlayerChar(5); O.PLAYER.char = 5; O.teleport(48, 0.05, 10, 0); O.CAM.yaw = 0; O.CAM.pitch = 0.1; });
  await page.waitForTimeout(500);
  logs.push(await page.evaluate(() => { const O = __os; const c = O.R.camera; const d = new c.position.constructor(0, 0, -1).applyQuaternion(c.quaternion); const h = O.rayHits(c.position, d, 100, true, 1.8); return 'cam ' + c.position.toArray().map(v => v.toFixed(1)) + ' dir ' + d.toArray().map(v => v.toFixed(2)) + ' hits ' + h.length + ' end ' + h.end + ' ' + h.map(x => x.b ? x.b.n : x.n ? 'npc' : x.it ? x.it.type : '?').join(','); }));
  await page.evaluate(() => { __os.skillGo('beam'); }); await page.waitForTimeout(3300);
  logs.push('after ' + await page.evaluate(() => __os.SMASH.breaks + ' ' + __os.SMASH.pts));
} };
