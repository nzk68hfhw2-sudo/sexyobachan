module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  const res = await page.evaluate(() => {
    const O = __os, T = (id) => O.touchProp(O.PROPS.find(p => p.def.id === id));
    O.PROPS.forEach(p => { if (!p.gone) for (let k = 0; k < 2; k++) O.touchProp(p); });
    const types = Object.keys(O.ITEM_INFO).filter(t => t !== 'door').concat(Object.keys(O.EXTRA_TYPES)); let sp = 0;
    O.teleport(100, 0.05, -32, 0);
    types.forEach(t => { const it = O.spawnItem(t, 100, 0.5, -34, 0, { awake: true }); O.doSpecial(it); sp++; if (!it.gone) { O.grab(it); O.IN.rotate = true; O.IN.bigger = true; O.release(true); } });
    // combine every recipe in bag
    O.BAG.size = 200; O.RECIPES.forEach(r => { O.BAG.items.push({ type: r.a, scale: 1 }, { type: r.b, scale: 1 }); });
    return { props: O.PROPS.length, sp, recipes: O.RECIPES.length, bag: O.BAG.items.length };
  });
  logs.push(JSON.stringify(res));
  for (const lv of [0, 50, 120, 400]) { await page.evaluate((lv) => { __os.G.pol = lv; }, lv); await page.waitForTimeout(2500); }
  await shot('final2');
  logs.push(JSON.stringify(await page.evaluate(() => ({ items: __os.ITEMS.list.length, secrets: Object.keys(__os.G.secrets).length, stage: __os.G.stage }))));
} };
