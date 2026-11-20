module.exports = { touch: false, run: async (page, shot, logs) => {
  await page.click('.os-big >> text=あそぶ', { force: true });
  const res = await page.evaluate(() => {
    const O = __os, P = O.P, IN = O.IN; O.G.paused = false;
    const steps = [];
    function go(yaw, secs, jumpAt) { P.yaw = yaw; IN.mz = -1; for (let k = 0; k < secs * 30; k++) { if (jumpAt && k === jumpAt) IN.jump = true; O.updatePlayer(1 / 30); } IN.mz = 0; for (let k = 0; k < 20; k++) O.updatePlayer(1 / 30); steps.push([P.pos.x.toFixed(2), P.pos.y.toFixed(2), P.pos.z.toFixed(2)]); }
    O.teleport(52.6, 0.5, 93.6, 0);
    go(Math.PI / 2, 0.4); // west onto 1.0
    go(Math.PI / 2, 0.4);
    go(Math.PI / 2, 0.6);
    P.pos.z = 92.0; go(Math.PI / 2, 0.5, 2);
    go(Math.PI / 2, 0.5, 2);
    go(Math.PI / 2, 0.5, 2);
    O.teleport(-49.5, 0, 26.5, Math.PI / 2); IN.mz = -1; for (let k = 0; k < 30 * 14; k++) O.updatePlayer(1 / 30); IN.mz = 0;
    P.yaw = 0; IN.mz = -1; for (let k = 0; k < 30 * 3; k++) O.updatePlayer(1 / 30); IN.mz = 0;
    steps.push(['roof', P.pos.x.toFixed(1), P.pos.y.toFixed(1), P.pos.z.toFixed(1)]);
    return steps;
  });
  logs.push(JSON.stringify(res));
} };
