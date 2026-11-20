module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: 'ぬるま川' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  for (const nm of ['木', '電柱']) {
    const r = await page.evaluate((nm) => { const O = __os; const tr = O.BRK.list.filter(b => b.n === nm && !b.broken).sort((a, b) => a.c.distanceTo(O.P.pos) - b.c.distanceTo(O.P.pos))[0]; O.brkHit(tr, 99, 1, 0, { kind: 'test' }); window._tr = tr; return [tr.piv.x.toFixed(1), tr.piv.z.toFixed(1)]; }, nm);
    await page.waitForTimeout(2500);
    logs.push(nm + ' piv ' + r + ' -> top at ' + await page.evaluate(() => { const b = window._tr; const box = new b.piv.constructor(); const B3 = new (Object.getPrototypeOf(b.g.children[0].geometry.boundingSphere.center).constructor)(); const bb = new __os.R.scene.constructor(); const bx = new (window.THREE ? THREE.Box3 : Object)(); return b.g ? JSON.stringify(b.g.children.map(m => { m.geometry.computeBoundingBox(); const c = m.geometry.boundingBox; return [c.min.x, c.max.x, c.min.y, c.max.y].map(v => v.toFixed(1)); })) + ' quat ' + b.g.quaternion.toArray().map(v => v.toFixed(2)) : 'nog'; }));
  }
} };
