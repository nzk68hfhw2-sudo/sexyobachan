module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.waitForTimeout(500);
  await page.tap('.os-big >> text=あそぶ', { force: true });
  const pts = [['f1_toge', 2.6, -73, 0, -0.05], ['f2_naga', -20, -91.5, Math.PI, 0.05], ['f3_sarari', 56.6, -7, -Math.PI/2, -0.05], ['f4_wakeme', 47, -26.5, Math.PI/2, -0.05],
    ['f5_okappa', -69, -11.2, 0.48, -0.15], ['f6_maruo', -86, -36.5, 0, -0.1], ['f7_haneko', 3.5, 57, Math.PI/2, -0.05], ['f8_megane', 20, 48.6, 0, 0.1],
    ['f9_statues', 14, -14, 2.356, -0.05], ['fa_giant', 66, 86, Math.PI, 0.45], ['fb_nai', 0, 416, 0, -0.05], ['fc_jinja', -80, -84, Math.PI*0, 0], ['fd_roof', 8, -73, 0, -0.1]];
  for (const p of pts) {
    await page.evaluate((p) => { const y = p[0]==='fd_roof' ? 9.5 : p[0]==='fc_jinja' ? 5.1 : 0.05; __os.teleport(p[1], y, p[2], p[3]); __os.P.pitch = p[4]; __os.G.tod = 1.3; }, p);
    await page.waitForTimeout(1600); await shot(p[0]);
  }
  logs.push('pos ' + JSON.stringify(await page.evaluate(() => [__os.P.pos.x, __os.P.pos.y, __os.P.pos.z])));
} };
