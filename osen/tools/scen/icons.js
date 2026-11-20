module.exports = { touch: false, viewport: { width: 1100, height: 760 }, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); __os.CS.idx = 7; __os.csDecide(); });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const O = __os; const types = Object.keys(O.ITEM_INFO).filter(t => t !== 'door').concat(Object.keys(O.EXTRA_TYPES));
    O.BAG.size = 120; O.BAG.items = types.map(t => ({ type: t, scale: 1 }));
    O.openBag();
  });
  await page.waitForTimeout(1500); await shot('icons_bag');
  await page.evaluate(() => { Object.keys(__os.WIN.list).forEach(k => {}); document.querySelectorAll('.ow').forEach(e => e.style.display = 'none'); __os.WIN.list.bag.open = false; });
  // line up items in a grid in the plaza
  await page.evaluate(() => {
    const O = __os; const types = Object.keys(O.EXTRA_TYPES).filter(t => !['kippu','flyer','letter','coinitem','leaf','kuji','tama'].includes(t));
    types.forEach((t, i) => { O.spawnItem(t, -14 + (i % 8) * 2.6, 0.05, -48 - Math.floor(i / 8) * 2.6, 0, {}); });
    O.teleport(-5, 0.05, -40, 0); O.CAM.pitch = 0.55; O.CAM.distT = 9; O.CAM.dist = 9;
  });
  await page.waitForTimeout(2500); await shot('items_world');
} };
