module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.CS.change = false; __os.stepCharSel(false); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { __os.CS.idx = 4; __os.csDecide(); });
  await page.waitForTimeout(1500);
  // go to konbini area items
  await page.evaluate(() => { __os.teleport(50, 0.05, -14, 0); __os.CAM.pitch = 0.35; });
  await page.waitForTimeout(1200); await shot('p1_garapon');
  logs.push('target ' + JSON.stringify(await page.evaluate(() => __os.G.target && { n: __os.G.target.name, item: !!__os.G.target.item })));
  await page.tap('.ab.main', { force: true }); await page.waitForTimeout(800); await shot('p2_hold');
  logs.push('held ' + await page.evaluate(() => __os.ITEMS.held && __os.ITEMS.held.type));
  await page.evaluate(() => { __os.IN.bigger = true; }); await page.waitForTimeout(400);
  await page.evaluate(() => { __os.IN.throwIt = true; }); await page.waitForTimeout(1600); await shot('p3_thrown');
  // spawn cup + onigiri and combine by throwing
  const r = await page.evaluate(() => { const P = __os.P; const a = __os.spawnItem('cup', P.pos.x, P.pos.y, P.pos.z - 3, 0, { awake: true }); const b = __os.spawnItem('onigiri', P.pos.x, P.pos.y + 0.6, P.pos.z - 3, 0, { awake: true }); b.body.thrownT = 2; b.body.vel.y = -3; return [a.id, b.id]; });
  await page.waitForTimeout(1500); await shot('p4_combine');
  logs.push('items with chazuke: ' + await page.evaluate(() => __os.ITEMS.list.filter(i => i.type === 'chazuke').length));
  // stack: spawn 3 cones above each other
  await page.evaluate(() => { const P = __os.P; for (let i = 0; i < 4; i++) __os.spawnItem(['kotatsu','tv','daruma','duck'][i], P.pos.x + 2, P.pos.y + 1 + i * 1.5, P.pos.z - 2, 0, { awake: true }); });
  await page.waitForTimeout(3000); await shot('p5_stack');
  await page.tap('.slot >> nth=0', { force: true }); await page.waitForTimeout(600); await shot('p6_bag');
  await page.evaluate(() => { __os.openZukan(); }); await page.waitForTimeout(600); await shot('p7_zukan');
  await page.evaluate(() => { __os.openStatus(); }); await page.waitForTimeout(600); await shot('p8_status');
  await page.evaluate(() => { Object.keys(__os.WIN.list).forEach(k => {}); });
  logs.push(JSON.stringify(await page.evaluate(() => ({ fps: __os.R.lastFps, calls: __os.R.renderer.info.render.calls, tris: __os.R.renderer.info.render.triangles, items: __os.ITEMS.list.length }))));
} };
