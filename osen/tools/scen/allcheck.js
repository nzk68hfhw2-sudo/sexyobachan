module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); __os.CS.idx = 0; __os.csDecide(); });
  await page.waitForTimeout(500);
  const res = await page.evaluate(() => {
    const O = __os, P = O.P, IN = O.IN, out = { chars: [], items: [], errors: [] };
    function sim(sec) { for (let k = 0; k < sec * 30; k++) { O.updatePlayer(1 / 30); } }
    for (let c = 0; c < 8; c++) {
      try {
        O.setPlayerChar(c); O.teleport(100, 0.05, -32, Math.PI / 2); sim(0.2);
        const x0 = P.pos.x; IN.mz = -1; sim(1); const walk = x0 - P.pos.x; IN.run = true; const x1 = P.pos.x; sim(1); const run = x1 - P.pos.x; IN.run = false; IN.mz = 0; sim(0.5);
        IN.jump = true; let maxY = 0; for (let k = 0; k < 40; k++) { O.updatePlayer(1 / 30); maxY = Math.max(maxY, P.pos.y); }
        const it = O.spawnItem('cone', P.pos.x, P.pos.y, P.pos.z - 1.2, 0, {}); O.grab(it); const held = O.ITEMS.held === it; O.release(true); const thrownV = it.body.vel.length();
        out.chars.push([c, walk.toFixed(2), run.toFixed(2), maxY.toFixed(2), held, thrownV.toFixed(1)]);
      } catch (e) { out.errors.push('char' + c + ': ' + e.message); }
    }
    const types = Object.keys(O.ITEM_INFO).filter(t => t !== 'door').concat(Object.keys(O.EXTRA_TYPES));
    O.teleport(0, 0.05, -45, 0);
    types.forEach((t) => {
      try {
        const it = O.spawnItem(t, P.pos.x, P.pos.y, P.pos.z - 1.5, 0, {});
        const fixed = it.body.fixed;
        O.grab(it); const held = O.ITEMS.held === it;
        IN.rotate = true; O.ITEMS.held && (function () { })();
        const y0 = it.holdYaw || 0; IN.rotate = true; IN.bigger = true;
        // run item actions through the game hook
        O.G.paused = false;
        const s0 = it.body.scale;
        window.__osTick && window.__osTick();
        out.items.push([t, fixed ? 'fixed' : (held ? 'ok' : 'NOHOLD'), it.body.ex.toFixed(2), it.body.ey.toFixed(2), O.effMass(it.body).toFixed(1)]);
        if (O.ITEMS.held) O.release(false);
      } catch (e) { out.errors.push(t + ': ' + e.message); }
    });
    return out;
  });
  await page.waitForTimeout(2500);
  logs.push('CHARS [idx, walk1s, run1s, jumpMaxY, held, throwV]: ' + JSON.stringify(res.chars));
  logs.push('ITEMS: ' + res.items.length + ' ' + JSON.stringify(res.items.filter(i => i[1] !== 'ok')));
  logs.push('ERRORS: ' + JSON.stringify(res.errors));
  const st = await page.evaluate(() => { const O = __os; const it = O.ITEMS.list.filter(i => !i.gone && !i.body.fixed)[3]; return O.ITEMS.list.length; });
  logs.push('total items ' + st);
  await shot('allcheck');
} };
