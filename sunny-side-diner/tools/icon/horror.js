const run = require('/home/user/sexyobachan/sunny-side-diner/tools/shot.js'); const fs = require('fs');
const D = '/tmp/claude-0/-home-user-sexyobachan/3e557370-2a49-54b8-ba77-e910b93bd553/scratchpad/icon3d/';
(async () => {
  const { b, page } = await run({ viewport: { width: 400, height: 400 }, url: 'http://localhost:8080/index.html?ssdtest' });
  await page.waitForFunction(() => window.__ssdReady, null, { timeout: 240000 });
  await page.evaluate(() => document.fonts.ready);
  const faces = (process.env.FACES || '13,27').split(',').map(Number);
  for (const v of ['cute', 'creepy']) {
    const src = 'data:image/png;base64,' + fs.readFileSync(D + 'raw_' + v + '.png').toString('base64');
    const url = await page.evaluate(([src, v, faces]) => new Promise(res => { const im = new Image(); im.onload = () => {
      const E = window.__ssdEval, F = E('F'), FI = E('FACE_IMG');
      const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 1024, 1024);
      const rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(9);
      // someone in the diner window, behind Sunny
      const put = (n, x, y, w, h, a) => { const f = FI[n]; if (!f || !f.naturalWidth) return; const t = document.createElement('canvas'); t.width = w; t.height = h; const q = t.getContext('2d'); q.filter = 'grayscale(1) contrast(1.5) brightness(0.8)'; q.drawImage(f, 0, 0, w, h); q.filter = 'none'; q.globalCompositeOperation = 'destination-in'; const m = q.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.5); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.65, 'rgba(0,0,0,0.75)'); m.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = m; q.fillRect(0, 0, w, h); g.save(); g.globalAlpha = a; g.drawImage(t, x, y); g.restore(); };
      put(faces[0], 168, 344, 124, 128, 0.85);
      if (v === 'creepy') put(faces[1], 852, 340, 136, 134, 0.8);
      // the title: one letter dead, the rest flickering; blood running off DINER
      g.textAlign = 'left'; g.lineJoin = 'round'; g.font = '150px ' + F.logo;
      const t = 'Sunny Side', tw = g.measureText(t).width; let x = 512 - tw / 2;
      for (let i = 0; i < t.length; i++) { const ch = t[i], w = g.measureText(ch).width, dead = false, dim = i === 3 || i === 7;
        g.shadowColor = dead ? 'transparent' : '#ff2f8f'; g.shadowBlur = dead ? 0 : (dim ? 18 : 50); g.lineWidth = 12; g.strokeStyle = dead ? '#3a1020' : (dim ? '#a8185a' : '#ff2f8f'); g.strokeText(ch, x, 190);
        g.shadowBlur = dead ? 0 : 18; g.fillStyle = dead ? '#24101a' : (dim ? '#c8789a' : '#ffe0ef'); g.fillText(ch, x, 190); x += w; }
      g.textAlign = 'center'; g.font = '72px ' + F.slab; g.shadowColor = 'rgba(91,232,255,0.9)'; g.shadowBlur = 30; g.fillStyle = '#e8fbff'; g.fillText('D I N E R', 512, 280); g.shadowBlur = 0;
      // drips
      g.fillStyle = '#8a0810';
      [[372, 284, 46], [455, 286, 84], [548, 284, 30], [604, 286, 64], [668, 284, 38]].forEach(([dx, dy, len]) => { const w0 = 9; g.beginPath(); g.moveTo(dx - w0, dy); g.bezierCurveTo(dx - w0 * 0.4, dy + len * 0.3, dx - 3, dy + len * 0.7, dx - 5, dy + len); g.arc(dx, dy + len, 6, Math.PI, 0, true); g.bezierCurveTo(dx + 3, dy + len * 0.7, dx + w0 * 0.4, dy + len * 0.3, dx + w0, dy); g.closePath(); g.fill(); });
      // bloody handprints on the glass, low left
      const hand = (hx, hy, s, r) => { g.save(); g.translate(hx, hy); g.rotate(r); g.scale(s, s); g.fillStyle = 'rgba(130,8,16,0.55)'; g.beginPath(); g.ellipse(0, 0, 26, 30, 0, 0, 7); g.fill(); [[-20, -42, 7, 22], [-7, -52, 7, 26], [7, -50, 7, 25], [20, -40, 6, 20], [30, -6, 6, 16]].forEach(([fx, fy, rx, ry]) => { g.beginPath(); g.ellipse(fx, fy, rx, ry, fx > 25 ? -0.9 : 0, 0, 7); g.fill(); }); g.fillRect(-8, 20, 16, 40 * rnd() + 20); g.restore(); };
      hand(90, 640, 1.1, -0.25); if (v === 'creepy') hand(930, 600, 0.95, 0.3);
      // scrawl
      g.save(); g.translate(512, 975); g.rotate(-0.03); g.font = '74px ' + F.fake; g.fillStyle = 'rgba(200,20,28,0.92)'; g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 6; g.fillText(v === 'creepy' ? "DON'T ANSWER HIM" : "DON'T TURN AROUND", 0, 0); g.restore();
      // red vignette + grain + scratches
      const vg = g.createRadialGradient(512, 560, 260, 512, 560, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, v === 'creepy' ? 'rgba(70,0,6,0.75)' : 'rgba(40,0,10,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, 1024, 1024);
      const id = g.getImageData(0, 0, 1024, 1024), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0);
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1.5; for (let k = 0; k < 7; k++) { const sx = rnd() * 1024; g.beginPath(); g.moveTo(sx, 0); g.lineTo(sx + (rnd() - 0.5) * 60, 1024); g.stroke(); }
      res(c.toDataURL('image/png')); }; im.src = src; }), [src, v, faces]);
    fs.writeFileSync(D + 'icon3d_horror_' + v + '.png', Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close();
})();
