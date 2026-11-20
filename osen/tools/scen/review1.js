module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); __os.CS.idx = 3; __os.csDecide(); });
  await page.waitForTimeout(600);
  // NPC walking near station (toge in station, naga on platform) -> go to danchi bikes (maruo)
  await page.evaluate(() => { __os.teleport(-86, 0.05, -33, 0); __os.CAM.pitch = 0.3; });
  await page.waitForTimeout(4000); await shot('r1_npc');
  logs.push('npc moved: ' + JSON.stringify(await page.evaluate(() => __os.NPCS.map(n => [n.idx, n.ent.visible, Math.round(n.ent.pos.distanceTo(n.home) * 10) / 10]))));
  // dressing room
  await page.evaluate(() => { __os.teleport(10, 0.05, -56.5, 0); __os.CAM.pitch = 0.2; });
  await page.waitForTimeout(800);
  logs.push('dress target: ' + await page.evaluate(() => __os.G.target && __os.G.target.name));
  await page.tap('.ab.main', { force: true }); await page.waitForTimeout(800); await shot('r2_dress');
  logs.push('cs on: ' + await page.evaluate(() => __os.CS.on));
  await page.evaluate(() => { __os.CS.idx = 6; __os.csDecide(); }); await page.waitForTimeout(800);
  logs.push('char now ' + await page.evaluate(() => __os.PLAYER.char));
  // pollution stages in third person
  for (const lv of [30, 66, 95, 150, 260]) { await page.evaluate((lv) => { __os.G.pol = lv; __os.teleport(-14, 0.05, -20, -0.5); __os.CAM.pitch = 0.25; }, lv); await page.waitForTimeout(4500); await shot('r3_pol' + lv); }
  await page.evaluate(() => { __os.G.pol = 5; });
  // secrets via props
  await page.evaluate(() => { const T = (id) => __os.touchProp(__os.PROPS.find(p => p.def.id === id)); ['statue0','statue1','statue2','statue3'].forEach(T); for (let i = 0; i < 13; i++) T('clock'); });
  await page.waitForTimeout(2000);
  logs.push('secrets: ' + await page.evaluate(() => Object.keys(__os.G.secrets).join(',')));
  // night & nai room
  await page.evaluate(() => { __os.teleport(0, 0.03, 416, 0); }); await page.waitForTimeout(2500); await shot('r4_nai');
} };
