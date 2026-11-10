// node render.js -> renders icon variants into ramune/dist/icons
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
(async () => {
  const out = path.join(__dirname, '..', 'dist', 'icons'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(__dirname, 'icon.html'));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  console.log('font ok:', await p.evaluate(() => document.fonts.check('900 100px "Zen Maru Gothic"', 'ラムネ')));
  const shot = async (cls, file, size) => {
    await p.evaluate(c => { document.getElementById('icon').className = c; }, cls);
    const el = await p.$('#icon');
    const f = path.join(out, file); await el.screenshot({ path: f, omitBackground: true });
    if (size && size !== 1024) {
      const s = await b.newPage({ viewport: { width: size, height: size } });
      const data = fs.readFileSync(f).toString('base64');
      await s.setContent('<html><body style="margin:0;background:transparent"><img id="i" src="data:image/png;base64,' + data + '" style="width:' + size + 'px;height:' + size + 'px;display:block"></body></html>');
      await s.waitForTimeout(100); await (await s.$('#i')).screenshot({ path: f, omitBackground: true }); await s.close();
    }
  };
  await shot('round', 'icon-1024.png');
  await shot('', 'icon-1024-square.png');
  await shot('round', 'icon-512.png', 512);
  await shot('', 'apple-touch-icon-180.png', 180);
  await shot('round', 'icon-192.png', 192);
  await shot('round notext', 'icon-notext-1024.png');
  await shot('round notext', 'favicon-64.png', 64);
  await b.close();
  console.log(fs.readdirSync(out).map(f => f + ' ' + fs.statSync(path.join(out, f)).size).join('\n'));
})();
