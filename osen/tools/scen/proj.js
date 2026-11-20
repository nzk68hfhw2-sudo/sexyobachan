module.exports = { touch: true, run: async (page, shot, logs) => {
  await page.evaluate(() => { __os.PLAYER.agreed = true; __os.stepCharSel(false); __os.CS.idx = 4; __os.csDecide(); });
  await page.evaluate(() => { __os.teleport(0, 0.05, -40, 0); });
  await page.waitForTimeout(1500);
  logs.push(JSON.stringify(await page.evaluate(() => {
    const T = window.THREE || null; const P = __os.P, cam = __os.R.camera;
    const v = P.pos.clone(); v.y += P.bodyH; v.project(cam); const f = P.pos.clone().project(cam);
    const box = new P.pos.constructor(); 
    return { head: [v.x.toFixed(2), v.y.toFixed(2)], feet: [f.x.toFixed(2), f.y.toFixed(2)], bodyH: P.bodyH, rootPos: P.root.position.toArray().map(n => n.toFixed(2)), pos: P.pos.toArray().map(n => n.toFixed(2)), meshScale: P.mesh.scale.x, bodyY: P.body.position.y, camPos: cam.position.toArray().map(n => n.toFixed(2)) };
  })));
  await shot('proj');
} };
