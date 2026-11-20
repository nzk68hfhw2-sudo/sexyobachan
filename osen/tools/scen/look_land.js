module.exports = { touch: 1 === 1, viewport: { width: 844, height: 390 }, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.PLAYER.helpSeen = false; __os.stepCharSel(false); });
  await page.waitForTimeout(800); await shot('look_cs_land');
  await page.evaluate(() => { __os.CS.idx = 5; __os.csDecide(); });
  await page.waitForTimeout(1500); await shot('look_help_land');
  await page.evaluate(() => { Object.keys(__os.WIN.list).forEach(k => { const w = __os.WIN.list[k]; if (w.open) { w.el.style.display = 'none'; w.open = false; } }); __os.G.paused = false;
    __os.teleport(50, 0.05, -16.5, 0); __os.CAM.pitch = 0.3; });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const t = __os.G.target; if (t && t.item) __os.grab(t.item); __os.say('こんにちは。こんばんは。おはようございました。'); __os.openBag(); __os.openStatus(); });
  await page.waitForTimeout(1500); await shot('look_play_land');
} };
