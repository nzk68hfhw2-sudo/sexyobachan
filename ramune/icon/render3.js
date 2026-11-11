// node render3.js [outDir] -> renders the pixel-art icon (icon3.html) in all sizes
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
(async () => {
  const out = process.argv[2] || path.join(__dirname, '..', 'dist', 'icons'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  async function render(mode) {
    const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
    await p.goto('file://' + path.join(__dirname, 'icon3.html') + '#' + mode);
    await p.waitForFunction(() => window.__done, null, { timeout: 30000 });
    const data = await p.evaluate(() => document.getElementById('out').toDataURL('image/png'));
    await p.close();
    return Buffer.from(data.split(',')[1], 'base64');
  }
  async function resize(buf, size, file) {
    const s = await b.newPage({ viewport: { width: size, height: size } });
    await s.setContent('<html><body style="margin:0;background:transparent"><img id="i" src="data:image/png;base64,' + buf.toString('base64') + '" style="width:' + size + 'px;height:' + size + 'px;display:block"></body></html>');
    await s.waitForTimeout(100); await (await s.$('#i')).screenshot({ path: path.join(out, file), omitBackground: true }); await s.close();
  }
  const round = await render('round'), square = await render('square'), notext = await render('notext');
  fs.writeFileSync(path.join(out, 'icon-1024.png'), round);
  fs.writeFileSync(path.join(out, 'icon-1024-square.png'), square);
  fs.writeFileSync(path.join(out, 'icon-notext-1024.png'), notext);
  await resize(round, 512, 'icon-512.png'); await resize(round, 192, 'icon-192.png');
  await resize(square, 180, 'apple-touch-icon-180.png'); await resize(notext, 64, 'favicon-64.png');
  await b.close();
  console.log(fs.readdirSync(out).join(' '));
})();
