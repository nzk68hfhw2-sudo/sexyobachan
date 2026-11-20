module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  logs.push('calls ' + await page.evaluate(() => __os.R.renderer.info.render.calls));
  // put a mob in front and tackle
  await page.evaluate(() => { const O = __os; const n = O.NPCS.find(n => n.mob); window._n = n; O.teleport(0, 0.03, -10, 0); O.CAM.yaw = 0; n.ent.pos.set(0, 0.03, -12.5); n.state = null; });
  await page.waitForTimeout(400);
  await page.locator('.ab.tk').tap({ force: true }); await page.waitForTimeout(350); await shot('s3_fly');
  logs.push('state ' + await page.evaluate(() => window._n.state + ' ' + window._n.ent.pos.toArray().map(v => v.toFixed(1))));
  await page.waitForTimeout(4500); await shot('s3_complain');
  logs.push('state2 ' + await page.evaluate(() => window._n.state + ' ' + (window._n.bubble && window._n.bubble.text) + ' react ' + (window._n.react && window._n.react.kind)));
  // grab and throw at a house: near shop booth
  await page.evaluate(() => { const O = __os; const n = window._n; n.state = null; n.ent.pos.set(0, 0.03, -11.5); O.npcGrab(n); });
  await page.waitForTimeout(500); await shot('s3_held');
  await page.evaluate(() => { const O = __os; O.teleport(-30, 0.2, -47, Math.PI / 2); O.CAM.yaw = Math.PI / 2; O.CAM.pitch = 0.1; });
  await page.waitForTimeout(500);
  await page.locator('.ab.main').tap({ force: true }); await page.waitForTimeout(500); await shot('s3_throw');
  await page.waitForTimeout(1500); await shot('s3_throw2');
  logs.push('after throw ' + await page.evaluate(() => { const O = __os; return 'pts ' + O.SMASH.pts + ' breaks ' + O.SMASH.breaks + ' house ' + O.BRK.list.filter(b => b.n === 'ビル' || b.n === '民家').filter(b => b.hp < b.maxhp).length + ' state ' + window._n.state; }));
  // crowd
  await page.evaluate(() => { const O = __os; O.CHAOS.x = 0; O.CHAOS.z = -55; O.CHAOS.heat = 8; O.teleport(0, 0.3, -46, 0); });
  await page.waitForTimeout(6000); await shot('s3_crowd');
  logs.push('crowd ' + await page.evaluate(() => __os.NPCS.filter(n => n.state === 'crowd').length));
  logs.push('calls ' + await page.evaluate(() => __os.R.renderer.info.render.calls));
} };
