module.exports = { touch: true, dpr: 1, viewport: { width: 400, height: 500 }, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.PLAYER.helpSeen = true; __os.stepCharSel(false); __os.CS.idx = 0; __os.csDecide(); document.getElementById('os-hud').style.display = 'none'; });
  for (const c of [0, 3, 5]) {
    await page.evaluate((c) => { const O = __os; O.setPlayerChar(c); O.teleport(100, 0.05, -32, 0); O.CAM.distT = O.CAM.dist = 3.2; O.CAM.pitch = 0.1; O.IN.mx = 1; }, c);
    for (let i = 0; i < 3; i++) { await page.waitForTimeout(260 + i * 90); await shot('w' + c + '_' + i); }
    await page.evaluate(() => { __os.IN.mx = 0; });
    await page.waitForTimeout(600);
    for (const g of ['wave', 'bow', 'dance', 'sit']) {
      await page.evaluate((g) => { const O = __os; O.P.face = O.CAM.yaw + Math.PI; O.gesture(g); }, g);
      await page.waitForTimeout(g === 'sit' ? 1100 : 600); await shot('g' + c + '_' + g);
    }
  }
} };
