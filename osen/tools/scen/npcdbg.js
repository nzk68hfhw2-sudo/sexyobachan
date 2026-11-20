module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); __os.CS.idx = 3; __os.csDecide(); });
  await page.evaluate(() => { __os.teleport(-86, 0.05, -33, 0); });
  for (let i = 0; i < 4; i++) { await page.waitForTimeout(1500); logs.push(JSON.stringify(await page.evaluate(() => { const n = __os.NPCS.find(n => n.idx === 4); return { t: n.target && n.target.toArray().map(v => v.toFixed(1)), wait: n.wait.toFixed(2), pos: n.ent.pos.toArray().map(v => v.toFixed(2)), vel: n.ent.vel.toArray().map(v => v.toFixed(2)), stuck: n.stuck, paused: __os.G.paused, menu: __os.G.inMenu }; }))); }
} };
