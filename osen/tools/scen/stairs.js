module.exports = { touch: false, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); __os.CS.idx = 0; __os.csDecide(); });
  const res = await page.evaluate(() => {
    const O = __os, P = O.P, IN = O.IN; O.G.paused = false; const out = {};
    function walk(name, x, z, yaw, secs, run) {
      O.teleport(x, O.groundAt(x, z, 40, 0.3), z, yaw); IN.mz = -1; IN.mx = 0; IN.run = !!run;
      let maxY = 0; for (let k = 0; k < secs * 30; k++) { O.updatePlayer(1 / 30); maxY = Math.max(maxY, P.pos.y); }
      IN.mz = 0; IN.run = false; out[name] = { end: [P.pos.x.toFixed(1), P.pos.y.toFixed(2), P.pos.z.toFixed(1)], maxY: maxY.toFixed(2) };
    }
    walk('danchiStairs', -49.5, 26.5, Math.PI / 2, 14);
    walk('scaffold', 19.3, -66.8, 0, 8);
    walk('shrine', -80, -60, 0, 8);
    walk('platform', 0, -78, 0, 4);
    walk('konbini', 54, -2.5, -Math.PI / 2, 4);
    walk('toilet', 10, 15, -Math.PI / 2, 3);
    walk('hall', -80, -88, 0, 4);
    walk('room101', -69, -6, 0, 4);
    walk('cafe', 47, 11.2, Math.PI / 2, 4);
    walk('riverOut', 10, 56, 0, 4);
    walk('dokan', 53.5, 95, Math.PI / 2 - 0.3, 4);
    return out;
  });
  logs.push(JSON.stringify(res, null, 0));
} };
