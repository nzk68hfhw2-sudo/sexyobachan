const run = require('/home/user/sexyobachan/sunny-side-diner/tools/shot.js'); const fs = require('fs');
const D = '/tmp/claude-0/-home-user-sexyobachan/3e557370-2a49-54b8-ba77-e910b93bd553/scratchpad/icon4/';
(async () => {
  const { b, page } = await run({ viewport: { width: 400, height: 400 }, url: 'http://localhost:8080/index.html?ssdtest' });
  await page.waitForFunction(() => window.__ssdReady, null, { timeout: 240000 });
  await page.evaluate(() => document.fonts.ready);
  const src = 'data:image/png;base64,' + fs.readFileSync(D + 'scene_pass.png').toString('base64');
  for (const variant of ['text', 'notext']) {
    const url = await page.evaluate(([src, variant]) => new Promise(res => { const im = new Image(); im.onload = () => {
      const F = window.__ssdEval('F'), c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
      g.filter = 'saturate(0.8) contrast(1.12) brightness(0.92)'; g.drawImage(im, 0, 0, 1024, 1024); g.filter = 'none';
      // cold blue cast over everything, red heat around the figure
      g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(190,205,235)'; g.fillRect(0, 0, 1024, 1024); g.globalCompositeOperation = 'source-over';
      const rg = g.createRadialGradient(530, 330, 20, 530, 330, 260); rg.addColorStop(0, 'rgba(255,40,50,0.26)'); rg.addColorStop(1, 'rgba(255,30,40,0)'); g.fillStyle = rg; g.fillRect(0, 0, 1024, 1024);
      g.globalCompositeOperation = 'screen'; const fl = g.createRadialGradient(528, 315, 5, 528, 315, 95); fl.addColorStop(0, 'rgba(150,150,175,0.55)'); fl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fl; g.fillRect(400, 200, 260, 240); g.globalCompositeOperation = 'source-over';
      let rs = 11; const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
      // blood dripping off the pass shelf onto the counter
      g.fillStyle = 'rgba(120,4,10,0.92)';
      [[470, 492, 70], [520, 494, 120], [590, 492, 52], [655, 493, 92]].forEach(([x, y, l]) => { g.beginPath(); g.moveTo(x - 8, y); g.bezierCurveTo(x - 4, y + l * 0.3, x - 3, y + l * 0.7, x - 5, y + l); g.arc(x, y + l, 6, Math.PI, 0, true); g.bezierCurveTo(x + 3, y + l * 0.7, x + 4, y + l * 0.3, x + 8, y); g.closePath(); g.fill(); });
      // a smeared handprint on the counter
      g.save(); g.translate(250, 655); g.rotate(-0.5); g.fillStyle = 'rgba(110,4,10,0.45)'; g.beginPath(); g.ellipse(0, 0, 30, 34, 0, 0, 7); g.fill(); [[-24, -46, 8, 24], [-8, -58, 8, 28], [8, -56, 8, 27], [23, -44, 7, 22], [34, -6, 7, 18]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, x > 30 ? -0.9 : 0, 0, 7); g.fill(); }); g.fillRect(-10, 26, 20, 26); g.restore();
      if (variant === 'text') {
        // dark band behind the words so they read even at icon size
        const tb = g.createLinearGradient(0, 330, 0, 900); tb.addColorStop(0, 'rgba(4,4,8,0)'); tb.addColorStop(0.18, 'rgba(4,4,8,0.82)'); tb.addColorStop(0.82, 'rgba(4,4,8,0.82)'); tb.addColorStop(1, 'rgba(4,4,8,0)'); g.fillStyle = tb; g.fillRect(0, 330, 1024, 570);
        const neon = (txt, size, y) => { g.textAlign = 'center'; g.font = size + 'px ' + F.logo; g.lineJoin = 'round';
          g.shadowColor = '#ff2f6a'; g.shadowBlur = 50; g.lineWidth = 14; g.strokeStyle = '#ff2f6a'; g.strokeText(txt, 512, y);
          g.shadowBlur = 18; g.fillStyle = '#fff0f4'; g.fillText(txt, 512, y); g.shadowBlur = 0; };
        neon('Sunny Side', 164, 512); neon('Diner', 136, 636);
        // genre, two lines, big
        const y0 = 672, h = 166, bw = 900, bx0 = 512 - bw / 2; g.fillStyle = 'rgba(10,6,8,0.9)'; g.fillRect(bx0, y0, bw, h);
        g.fillStyle = '#c8101c'; g.fillRect(bx0, y0, bw, 6); g.fillRect(bx0, y0 + h - 6, bw, 6);
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        const line = (txt, y, fill, glow) => { let fs = 72; do { g.font = '900 ' + fs + 'px "Zen Kaku Gothic New", sans-serif'; fs--; } while (g.measureText(txt).width > 840);
          g.lineWidth = 8; g.strokeStyle = '#000'; g.strokeText(txt, 512, y); if (glow) { g.shadowColor = glow; g.shadowBlur = 22; } g.fillStyle = fill; g.fillText(txt, 512, y); g.shadowBlur = 0; };
        line('海外風経営シミュレーション', y0 + 50, '#fff3d6');
        line('× インディーホラー', y0 + 124, '#ff4848', 'rgba(255,0,20,0.85)');
        g.textBaseline = 'alphabetic';
        // red scrawl on the counter
        g.save(); g.translate(512, 1000); g.rotate(-0.03); g.textAlign = 'center'; g.font = '64px ' + F.fake; g.fillStyle = 'rgba(190,12,22,0.92)'; g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 6; g.fillText("DON'T LOOK UP", 0, 0); g.restore();
      }
      // vignette, grain, scratches
      const vg = g.createRadialGradient(512, 560, 280, 512, 560, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,0,4,0.78)'); g.fillStyle = vg; g.fillRect(0, 0, 1024, 1024);
      const id = g.getImageData(0, 0, 1024, 1024), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 30; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0);
      g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const sx = rnd() * 1024; g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx + (rnd() - 0.5) * 50, 1024); g.stroke(); }
      res(c.toDataURL('image/png')); }; im.src = src; }), [src, variant]);
    fs.writeFileSync(D + 'icon_horror_' + variant + '.png', Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
