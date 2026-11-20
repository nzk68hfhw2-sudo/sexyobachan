module.exports = { touch: true, url: 'http://localhost:8092/index.html', run: async (page, shot, logs) => {
  await page.waitForTimeout(800);
  const st = () => page.evaluate(() => { const M = __os.MUS, f = (k) => M.songs[k].els.map(a => ({ p: a.paused, t: +a.currentTime.toFixed(1), g: a.g ? +a.g.gain.value.toFixed(2) : null, tgt: a.tgt })); return { want: M.want, st: __os.musStatus(), long: f('long'), short: f('short'), synth: !!__os.AUD.song, bus: __os.AUD.bgmBus && +__os.AUD.bgmBus.gain.value.toFixed(2), out: M.out && +M.out.gain.value.toFixed(2) }; });
  const clickText = async (t) => { await page.locator('.mb', { hasText: t }).first().tap({ force: true }); await page.waitForTimeout(400); };
  await page.waitForTimeout(2500);
  await clickText('ログイン'); await page.waitForTimeout(3000);
  logs.push('menu ' + JSON.stringify(await st()));
  await page.locator('.li', { hasText: '公式' }).first().tap({ force: true }); await page.waitForTimeout(300);
  await clickText('ch.1'); await clickText('同意する'); await page.waitForTimeout(600); await clickText('この人で始める'); await page.waitForTimeout(1200);
  logs.push('enter+1s ' + JSON.stringify(await st()));
  await page.locator('#os-ui .ow .mb', { hasText: 'わかりました' }).first().tap({ force: true }); await page.waitForTimeout(3000);
  logs.push('enter+4s ' + JSON.stringify(await st()));
  // loop: jump near end
  await page.evaluate(() => { const s = __os.MUS.songs.long, a = s.els[s.cur]; a.currentTime = a.duration - 4; });
  await page.waitForTimeout(2500);
  logs.push('loop ' + JSON.stringify(await st()));
  // 3 touches in a row
  await page.evaluate(() => { const O = __os; const ps = O.PROPS.filter(p => p.def && p.def.l).slice(0, 3); ps.forEach(p => O.touchProp(p)); });
  await page.waitForTimeout(300);
  logs.push('notes ' + await page.evaluate(() => document.querySelectorAll('.tnote').length + ' visible:' + [...document.querySelectorAll('.tnote')].filter(e => e.style.display !== 'none').length + ' top:' + document.querySelectorAll('#os-top .tl').length + ' cap:' + (document.getElementById('os-cap') || {}).style?.display));
  await shot('music_touch');
  await page.evaluate(() => { __os.G.pol = 80; }); await page.waitForTimeout(2500);
  logs.push('pol80 ' + await page.evaluate(() => { const M = __os.MUS; return M.songs.long.els.map(a => a.playbackRate.toFixed(3)).join(',') + ' lp ' + Math.round(M.filt.frequency.value); }));
  // radio special
  await page.evaluate(() => { bgmSpecial = null; }).catch(() => {});
  await shot('music_pol');
} };
