module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(800); await shot('a_login');
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await clickText('ログイン'); await page.locator('.li', { hasText: 'ぬるま川' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600);
  // name input
  await page.locator('.mb', { hasText: '入力' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await page.locator('input[maxlength="12"]').fill('ぶち壊し太郎'); await shot('a_name');
  await clickText('決定'); await page.waitForTimeout(200);
  await clickText('この人で始める'); await page.waitForTimeout(1500);
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(400);
  logs.push('name ' + await page.evaluate(() => __os.PLAYER.name + ' free ' + __os.PLAYER.nameFree));
  // aim at station and fire each gun
  for (let g = 0; g < 7; g++) {
    await page.evaluate((g) => { const O = __os; O.gunSelect(g); O.teleport(0, 0.05, -50, 0); O.CAM.yaw = 0; O.CAM.pitch = 0.05; }, g);
    await page.waitForTimeout(200);
    const fire = page.locator('.ab.fire'); const bx = await fire.boundingBox();
    await page.touchscreen.tap(bx.x + bx.width / 2, bx.y + bx.height / 2);
    await page.evaluate(() => { __os.IN.fire = true; }); await page.waitForTimeout(g === 5 ? 1200 : 600); await page.evaluate(() => { __os.IN.fire = false; });
    if (g === 1 || g === 3 || g === 5) await shot('a_gun' + g);
    await page.waitForTimeout(900);
    logs.push('gun ' + g + ' ' + await page.evaluate(() => __os.GUNS[__os.GUN.cur].n + ' pts ' + __os.SMASH.pts + ' broken ' + __os.BRK.list.filter(b => b.broken).length + ' stationHp ' + __os.BRK.list.find(b => b.n === '駅舎').hp.toFixed(1)));
  }
  // skills for all 8 chars
  for (let c = 0; c < 8; c++) {
    await page.evaluate((c) => { const O = __os; O.brkResetAll(); O.setPlayerChar(c); O.PLAYER.char = c; O.teleport(48, 0.05, 10, 0); O.CAM.yaw = 0; O.CAM.pitch = 0.1; O.P.skillCd = 0; }, c);
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => __os.SMASH.breaks + __os.SMASH.flights);
    await page.locator('.ab', { hasText: 'とくぎ' }).first().tap({ force: true });
    await page.waitForTimeout(3600);
    if (c === 0 || c === 1 || c === 5) await shot('a_skill' + c);
    logs.push('skill ' + c + ' ' + await page.evaluate((b) => __os.CHARS ? '' : '', before) + await page.evaluate(() => __os.PLAYER.char) + ' +' + (await page.evaluate(() => __os.SMASH.breaks + __os.SMASH.flights) - before) + ' pos ' + await page.evaluate(() => __os.P.pos.toArray().map(v => v.toFixed(1))));
  }
} };
