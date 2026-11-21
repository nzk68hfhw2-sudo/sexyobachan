module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800); await shot('d_login');
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  // walk to car near spawn and look at it
  await page.evaluate(() => { const O = __os; const v = O.VEH.list.find(v => v.home.x === 14); O.teleport(14, 0.2, -38.5, 0); O.CAM.yaw = 0; O.CAM.pitch = 0.25; window._v = v; });
  await page.waitForTimeout(500);
  logs.push('main btn: ' + await page.evaluate(() => __os.H.bMain.textContent));
  await page.locator('.ab.main').tap({ force: true }); await page.waitForTimeout(500);
  logs.push('driving ' + await page.evaluate(() => !!__os.P.driving));
  // drive west along road (car yaw PI/2 -> forward = -x)
  await page.evaluate(() => { const O = __os; O.IN.stickId = 99; O.IN.mz = -1; O.IN.mx = 0; window._t0 = O.SMASH.pts; });
  await page.waitForTimeout(1500); await shot('d_drive1');
  await page.evaluate(() => { __os.IN.mx = -0.8; }); await page.waitForTimeout(1200); await page.evaluate(() => { __os.IN.mx = 0; });
  await page.waitForTimeout(2500); await shot('d_drive2');
  logs.push('car pos ' + await page.evaluate(() => window._v.pos.toArray().map(v => v.toFixed(1)) + ' spd ' + window._v.spd.toFixed(1) + ' hp ' + window._v.hp.toFixed(1) + ' pts+ ' + (__os.SMASH.pts - window._t0) + ' breaks ' + __os.SMASH.breaks + ' flights ' + __os.SMASH.flights));
  await page.locator('.ab.tk').tap({ force: true }); await page.waitForTimeout(1500); await shot('d_boost');
  await page.evaluate(() => { const O = __os; O.IN.mz = 0; O.IN.stickId = null; });
  await page.waitForTimeout(1500);
  await page.locator('.ab.main').tap({ force: true }); await page.waitForTimeout(500);
  logs.push('exited ' + await page.evaluate(() => !__os.P.driving + ' player ' + __os.P.pos.toArray().map(v => v.toFixed(1)) + ' visible ' + __os.P.root.visible));
  // rocket at a car
  await page.evaluate(() => { const O = __os; const v = O.VEH.list[0]; O.teleport(v.pos.x + 10, 0.2, v.pos.z, Math.PI / 2); O.CAM.yaw = -Math.PI / 2; O.CAM.pitch = 0.05; O.gunSelect(3); window._v0 = v; });
  await page.waitForTimeout(400);
  for (let i = 0; i < 3; i++) { await page.evaluate(() => { __os.IN.fire = true; }); await page.waitForTimeout(300); await page.evaluate(() => { __os.IN.fire = false; }); await page.waitForTimeout(900); }
  await shot('d_rocket');
  logs.push('car0 broken ' + await page.evaluate(() => window._v0.broken + ' hp ' + window._v0.hp.toFixed(1)));
  await page.locator('#os-pbtn').tap({ force: true }); await page.waitForTimeout(600); await shot('d_photo');
} };
