module.exports = { touch: true, viewport: { width: 844, height: 390 }, run: async (page, shot, logs) => {
  await page.waitForTimeout(800); await shot('u_intro_land');
  await page.tap('.os-big >> text=あそぶ', { force: true });
  await page.waitForTimeout(1500);
  // walk with stick via touch events
  await page.evaluate(() => { __os.teleport(-8.4, 0.05, -66.5, 0); __os.P.pitch = 0.0; });
  await page.waitForTimeout(800); await shot('u_aim');
  logs.push('target=' + await page.evaluate(() => __os.G.target && __os.G.target.def.id));
  await page.tap('#os-touch', { force: true }); await page.waitForTimeout(1200); await shot('u_touched');
  await page.tap('#os-touch', { force: true }); await page.waitForTimeout(300); await page.tap('#os-touch', { force: true }); await page.waitForTimeout(1500); await shot('u_touched3');
  await page.tap('#os-tr .os-sq:nth-child(1)', { force: true }); await page.waitForTimeout(600); await shot('u_zukan');
  await page.tap('.os-ze:not(.no)', { force: true }); await page.waitForTimeout(300); await shot('u_zukan2');
  await page.locator('#os-ui .os-panel.show .os-big', { hasText: 'とじる' }).tap({ force: true }); await page.waitForTimeout(300);
  await page.tap('#os-tr .os-sq:nth-child(2)', { force: true }); await page.waitForTimeout(600); await shot('u_menu');
  await page.locator('#os-ui .os-panel.show .os-big', { hasText: 'とじる' }).tap({ force: true }); await page.waitForTimeout(300);
  // stick drag
  const box = await page.locator('#os-stick').boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
  for (let i = 0; i < 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy + 50, id: 1 }] }); await page.waitForTimeout(150); }
  const p1 = await page.evaluate(() => [__os.P.pos.x, __os.P.pos.z]);
  await page.waitForTimeout(1000);
  await shot('u_walking');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const p2 = await page.evaluate(() => [__os.P.pos.x, __os.P.pos.z]);
  logs.push('walk ' + JSON.stringify(p1) + ' -> ' + JSON.stringify(p2));
  // look drag on right half
  const y0 = await page.evaluate(() => __os.P.yaw);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 600, y: 200, id: 2 }] });
  for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 600 + i * 15, y: 200, id: 2 }] }); await page.waitForTimeout(40); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  logs.push('yaw ' + y0 + ' -> ' + await page.evaluate(() => __os.P.yaw));
} };
