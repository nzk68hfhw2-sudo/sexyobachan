module.exports = { touch: false, run: async (page, shot, logs) => {
  await page.click('.os-big >> text=あそぶ', { force: true });
  const res = await page.evaluate(() => {
    const O = __os, P = O.P, IN = O.IN; O.G.paused = false;
    function inside(x, y, z) { return O.colQuery(x, z, 0.4).some(b => x + 0.3 > b.x0 && x - 0.3 < b.x1 && z + 0.3 > b.z0 && z - 0.3 < b.z1 && b.y1 > y + 0.55 && b.y0 < y + 1.7); }
    const stuck = [], fell = []; let tested = 0;
    for (let n = 0; n < 500; n++) {
      const x = Math.random() * 250 - 125, z = Math.random() * 260 - 125;
      const y = O.groundAt(x, z, 40, 0.32);
      if (inside(x, y, z)) continue;
      tested++;
      let moved = 0;
      for (let dir = 0; dir < 4; dir++) {
        O.teleport(x, y, z, dir * Math.PI / 2); P.pitch = 0;
        IN.mx = 0; IN.mz = -1;
        for (let k = 0; k < 30; k++) O.updatePlayer(1 / 30);
        IN.mz = 0;
        const d = Math.hypot(P.pos.x - x, P.pos.z - z); if (d > 0.5) moved++;
        if (P.pos.y < -5) fell.push([x, z]);
      }
      if (moved === 0) stuck.push([x.toFixed(1), y.toFixed(1), z.toFixed(1)]);
    }
    return { tested, stuck, fell };
  });
  logs.push(JSON.stringify(res));
} };
