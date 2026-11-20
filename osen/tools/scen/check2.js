module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(500);
  await page.tap('.os-big >> text=あそぶ', { force: true });
  const pts = [['c1_statues', 0, -18, 0, -0.1], ['c2_konbini', 54.5, -2, -2.0, -0.12], ['c3_kawa', 30, 42, Math.PI, -0.25], ['c4_dokan', 55, 96, 1.2, 0.05], ['c5_danchi_stairs', -45, 32, 1.6, 0.25], ['c6_night', 0, -18, 0, 0.1]];
  for (const p of pts) {
    await page.evaluate((p) => { __os.teleport(p[1], 0.05, p[2], p[3]); __os.P.pitch = p[4]; __os.G.tod = p[0]==='c6_night' ? 3.3 : 1.3; }, p);
    await page.waitForTimeout(1800); await shot(p[0]);
    logs.push(p[0] + ' ' + JSON.stringify(await page.evaluate(() => [__os.P.pos.x.toFixed(1), __os.P.pos.y.toFixed(1), __os.P.pos.z.toFixed(1)])));
  }
  logs.push('statues: ' + await page.evaluate(() => __os.PROPS.filter(p => p.def.b === 'statue').map(p => p.obj.position.toArray().map(v => v.toFixed(1)).join(',') + ' vis=' + p.obj.visible).join(' | ')));
} };
