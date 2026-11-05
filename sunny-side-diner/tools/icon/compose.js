const run = require('/home/user/sexyobachan/sunny-side-diner/tools/shot.js'); const fs = require('fs');
const D = '/tmp/claude-0/-home-user-sexyobachan/3e557370-2a49-54b8-ba77-e910b93bd553/scratchpad/icon3d/';
(async () => {
  const { b, page } = await run({ viewport: { width: 400, height: 400 }, url: 'http://localhost:8080/index.html?ssdtest' });
  await page.waitForFunction(() => window.__ssdReady, null, { timeout: 240000 });
  await page.evaluate(() => document.fonts.ready);
  for (const v of ['cute', 'creepy']) {
    const src = 'data:image/png;base64,' + fs.readFileSync(D + 'raw_' + v + '.png').toString('base64');
    for (const txt of [true, false]) {
      const url = await page.evaluate(([src, txt, v]) => new Promise(res => { const im = new Image(); im.onload = () => {
        const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 1024, 1024);
        if (txt) { const F = window.__ssdEval('F');
          g.textAlign = 'center'; g.lineJoin = 'round';
          g.font = '150px ' + F.logo; g.shadowColor = v === 'creepy' ? '#ff2020' : '#ff4fa3'; g.shadowBlur = 50; g.lineWidth = 12; g.strokeStyle = v === 'creepy' ? '#d0101a' : '#ff2f8f'; g.strokeText('Sunny Side', 512, 190); g.shadowBlur = 20; g.fillStyle = v === 'creepy' ? '#ffd0d0' : '#ffe0ef'; g.fillText('Sunny Side', 512, 190);
          g.font = '72px ' + F.slab; g.shadowColor = 'rgba(91,232,255,0.9)'; g.shadowBlur = 30; g.fillStyle = '#e8fbff'; g.fillText('D I N E R', 512, 280);
        }
        res(c.toDataURL('image/png')); }; im.src = src; }), [src, txt, v]);
      fs.writeFileSync(D + 'icon3d_' + v + (txt ? '' : '_notext') + '.png', Buffer.from(url.split(',')[1], 'base64'));
    }
  }
  await b.close();
})();
