module.exports = { touch: true, url: 'http://localhost:8093/seishin-osen-full.html', run: async (page, shot, logs) => {
  await page.waitForTimeout(1000);
  logs.push('fatal=' + await page.evaluate(() => !!document.getElementById('os-fatal')));
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.PLAYER.helpSeen = true; __os.stepCharSel(false); __os.CS.idx = 6; __os.csDecide(); __os.gesture('wave'); });
  await page.waitForTimeout(800); await shot('full');
} };
