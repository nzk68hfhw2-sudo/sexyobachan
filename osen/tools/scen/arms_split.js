module.exports = { touch: false, viewport: { width: 1100, height: 700 }, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); document.querySelectorAll('.ow,.cs-nav,.logo').forEach(e => e.style.display = 'none'); });
  for (let c = 0; c < 8; c++) {
    for (const [n, p] of [['wave', { uRaiseR: 0.9, uRaiseL: 0.9, uArmL: -0.3, uArmR: -0.3 }], ['fwd', { uArmL: -1.4, uArmR: -1.4 }]]) {
      await page.evaluate(([c, p]) => { const CS = __os.CS; if (CS.idx !== c) __os.csShow(c); const base = { uLegL: 0, uLegR: 0, uArmL: 0, uArmR: 0, uRaiseL: 0, uRaiseR: 0, uHeadP: 0, uHeadY: 0 }; CS.forcePose = Object.assign(base, p); CS.forceRot = 0.5; }, [c, p]);
      await page.waitForTimeout(400); await shot('as_' + c + '_' + n);
    }
  }
  logs.push('aArm ' + await page.evaluate(() => { const g = __os.CS.mesh.geometry; return !!g.attributes.aArm + ' ' + g.attributes.aArm.array.filter(v => v > 0).length + '/' + g.attributes.aArm.count; }));
} };
