module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: 'ぬるま川' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  logs.push('brk ' + await page.evaluate(() => { const B = __os.BRK; const c = {}; B.list.forEach(b => c[b.n] = (c[b.n] || 0) + 1); return B.list.length + ' ' + JSON.stringify(c) + ' npcs ' + __os.NPCS.length; }));
  // tackle towards tree near spawn
  const t0 = Date.now();
  await page.evaluate(() => { const O = __os; const tr = O.BRK.list.filter(b => b.n === '木').sort((a, b) => a.c.distanceTo(O.P.pos) - b.c.distanceTo(O.P.pos))[0]; const dx = tr.c.x - O.P.pos.x, dz = tr.c.z - O.P.pos.z, d = Math.hypot(dx, dz); O.teleport(tr.c.x - dx / d * 2.5, 0.2, tr.c.z - dz / d * 2.5, Math.atan2(-dx, -dz)); O.CAM.yaw = Math.atan2(dx, dz) + Math.PI; window._tr = tr; });
  await page.waitForTimeout(300);
  await page.locator('.ab.tk').tap({ force: true }); await page.waitForTimeout(150); await shot('s1_hit');
  await page.waitForTimeout(900); await shot('s1_after');
  logs.push('tree broken ' + await page.evaluate(() => window._tr.broken + ' combo ' + __os.SMASH.combo + ' pts ' + __os.SMASH.pts));
  // break many things by blast near station
  await page.evaluate(() => { const O = __os; O.teleport(0, 0.2, -60, 0); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const O = __os; O.smashBlast(new O.P.pos.constructor(5, 1, -64), 12, 6, { kind: 'skill', key: 'test' }); });
  await page.waitForTimeout(200); await shot('s1_blast');
  await page.waitForTimeout(1500); await shot('s1_blast2');
  logs.push('after blast ' + await page.evaluate(() => { const O = __os; return 'broken ' + O.BRK.list.filter(b => b.broken).length + ' combo ' + O.SMASH.combo + ' pts ' + O.SMASH.pts + ' fly ' + O.NPCS.filter(n => n.state === 'fly').length; }));
  // station
  await page.evaluate(() => { const O = __os; const st = O.BRK.list.find(b => b.n === '駅舎'); for (let i = 0; i < 5; i++) O.brkHit(st, 9, 0, -1, { kind: 'test' }); });
  await page.waitForTimeout(2500); await shot('s1_station');
  logs.push('station ' + await page.evaluate(() => __os.BRK.list.find(b => b.n === '駅舎').broken));
  // respawn quick
  await page.evaluate(() => __os.brkResetAll()); await page.waitForTimeout(800); await shot('s1_reset');
  logs.push('after reset broken ' + await page.evaluate(() => __os.BRK.list.filter(b => b.broken).length));
} };
