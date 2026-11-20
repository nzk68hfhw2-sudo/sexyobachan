module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  const pts = [[0, -55], [50, -10], [-70, -15], [0, 0], [60, 90], [-80, -95], [-40, 40], [100, -50]];
  for (const p of pts) { await page.evaluate((p) => { const O = __os; O.teleport(p[0] + 8, 0.3, p[1] + 8, 0); O.smashBlast(new O.P.pos.constructor(p[0], 1, p[1]), 16, 30, { kind: 'skill', key: 'st' + p }); }, p); await page.waitForTimeout(1200); }
  logs.push('broken ' + await page.evaluate(() => __os.BRK.list.filter(b => b.broken).length + ' items broken ' + __os.ITEMS.list.filter(i => i.broken).length + ' debris live ' + Object.values(__os.DEB.pools).map(p => p.live).join('/') + ' pts ' + __os.SMASH.pts));
  await shot('stress');
  // walk around with stick for 8s in different directions
  await page.evaluate(() => { __os.teleport(0, 0.3, -45, 0); });
  for (const d of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { await page.evaluate((d) => { __os.IN.mx = d[0]; __os.IN.mz = d[1]; }, d); await page.waitForTimeout(2000); }
  await page.evaluate(() => { __os.IN.mx = 0; __os.IN.mz = 0; });
  logs.push('player ' + await page.evaluate(() => __os.P.pos.toArray().map(v => v.toFixed(1)) + ' onGround ' + __os.P.onGround));
  logs.push('bad items ' + await page.evaluate(() => { const O = __os; return O.ITEMS.list.filter(i => !i.broken && !i.gone && (!isFinite(i.body.pos.y) || i.body.pos.y - i.body.ey < O.colTop(i.body.pos.x, i.body.pos.z, i.body.pos.y - i.body.ey + 0.1) - 0.15)).map(i => i.type + '@' + i.body.pos.toArray().map(v => v.toFixed(1))).slice(0, 8).join(' ') || 'none'; }));
  logs.push('npc bad ' + await page.evaluate(() => __os.NPCS.filter(n => !isFinite(n.ent.pos.y) || n.ent.pos.y < -5).length + ' states ' + JSON.stringify(__os.NPCS.reduce((a, n) => { a[n.state || 'walk'] = (a[n.state || 'walk'] || 0) + 1; return a; }, {}))));
  // fast respawn
  await page.evaluate(() => { __os.TUNE.respawn = 2; __os.TUNE.respawnBig = 0; }); await page.waitForTimeout(5000);
  logs.push('after respawn broken ' + await page.evaluate(() => __os.BRK.list.filter(b => b.broken).length + ' itemsBroken ' + __os.ITEMS.list.filter(i => i.broken).length));
  // re-break works
  await page.evaluate(() => { const O = __os; O.smashBlast(new O.P.pos.constructor(0, 1, -55), 16, 30, { kind: 'skill', key: 'again' }); }); await page.waitForTimeout(800);
  logs.push('rebreak ' + await page.evaluate(() => __os.BRK.list.filter(b => b.broken).length));
  await shot('stress2');
} };
