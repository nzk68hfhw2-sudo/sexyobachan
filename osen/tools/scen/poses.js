module.exports = { touch: false, viewport: { width: 1100, height: 700 }, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); document.querySelectorAll('.ow,.cs-nav,.logo').forEach(e => e.style.display = 'none'); });
  const poses = { stand: {}, walkA: { uLegL: 0.55, uLegR: -0.55, uArmL: -0.4, uArmR: 0.4 }, walkB: { uLegL: -0.55, uLegR: 0.55, uArmL: 0.4, uArmR: -0.4 }, wave: { uRaiseR: 1.35, uHeadY: 0.15 }, hold: { uArmL: -0.75, uArmR: -0.75 }, sit: { uLegL: -1.45, uLegR: -1.45, uArmL: -0.4, uArmR: -0.4 }, nod: { uHeadP: 0.45 }, jump: { uRaiseL: 1.1, uRaiseR: 1.1 } };
  for (const c of [0, 4]) {
    for (const [n, p] of Object.entries(poses)) {
      for (const rot of [0, 1.57]) {
        await page.evaluate(([c, p, rot]) => { const CS = __os.CS; if (CS.idx !== c) { __os.csShow(c); } const base = { uLegL: 0, uLegR: 0, uArmL: 0, uArmR: 0, uRaiseL: 0.12, uRaiseR: 0.12, uHeadP: 0, uHeadY: 0 }; CS.forcePose = Object.assign(base, p); CS.forceRot = rot; }, [c, p, rot]);
        if (n === 'stand' && rot === 0) { await page.evaluate((c) => { const CS = __os.CS; CS.mesh && 0; }, c); }
        await page.waitForTimeout(250); await page.screenshot({ path: process.argv[3] + '/p' + c + '_' + n + '_' + (rot ? 's' : 'f') + '.png', clip: { x: 230, y: 120, width: 330, height: 520 } });
      }
    }
    await page.evaluate(() => { __os.CS.forcePose = null; });
    await page.evaluate(() => { const CS = __os.CS; CS.idx = 4; });
    await page.evaluate(() => { document.querySelectorAll('.cs-nav'); });
    await page.evaluate(() => { __os.CS.forcePose = null; });
    // switch model to char 4
    await page.evaluate(() => { const O = __os; O.CS.idx = 3; });
    await page.evaluate(() => { const nav = document.querySelectorAll('.cs-nav')[1]; });
    await page.evaluate(() => { __os.CS.forcePose = {}; });
    await page.evaluate(() => { /* use exposed csShow via decide? */ });
  }
} };
