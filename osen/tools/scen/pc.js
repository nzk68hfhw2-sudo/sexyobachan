module.exports = { touch: false, viewport: { width: 1280, height: 720 }, run: async (page, shot, logs) => {
  await page.waitForTimeout(800); await shot('pc_intro');
  await page.click('.os-big >> text=あそぶ', { force: true });
  await page.evaluate(() => { __os.teleport(0, 30, 0, 0); __os.P.pitch = -1.45; __os.P.gravMul = 0; });
  await page.waitForTimeout(400);
  await page.evaluate(() => { __os.P.pos.y = 30; __os.P.vel.y = 0; __os.P.gravMul = 0.0001; __os.P.gravT = 100; });
  await page.waitForTimeout(1200); await shot('pc_top');
  await page.evaluate(() => { __os.P.gravMul = 1; __os.P.gravT = 0; __os.teleport(7, 0.05, -40.5, -0.12); __os.P.pitch = 0; });
  await page.waitForTimeout(500);
  await page.keyboard.down('KeyW'); await page.waitForTimeout(2500); await page.keyboard.up('KeyW');
  await shot('pc_walk');
  logs.push('pos ' + JSON.stringify(await page.evaluate(() => [__os.P.pos.x, __os.P.pos.z])));
  await page.keyboard.press('KeyZ'); await page.waitForTimeout(500); await shot('pc_zukan');
} };
