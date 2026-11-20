module.exports = { touch: false, viewport: { width: 1280, height: 720 }, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); });
  await page.waitForTimeout(500);
  logs.push(JSON.stringify(await page.evaluate(() => { const w = __os.CS.win; const r = w.getBoundingClientRect(); return { top: w.style.top, mh: w.style.maxHeight, r: [r.top, r.height], scroll: document.getElementById('os-root').scrollTop, ui: document.getElementById('os-ui').scrollTop, menu: document.getElementById('os-menu').scrollTop }; })));
} };
