// touch layout check at a size; prints offending elements in the top zone
const run = require('./shot.js');
(async () => {
  const [w, h, name] = [+process.argv[2], +process.argv[3], process.argv[4]];
  const { b, page, logs } = await run({ viewport: { width: w, height: h }, touch: true, url: 'http://localhost:8080/index.html?hptest' });
  await page.waitForFunction(() => window.__hpReady, null, { timeout: 120000 });
  const check = async (label) => {
    const bad = await page.evaluate(() => {
      const top = window.__hpEval('uiTopSafe()'); const out = [];
      document.querySelectorAll('#hp-ui *').forEach(e => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); if (r.width < 2 || r.height < 2 || st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) return; if (e.closest('.hp-scr') && !e.closest('.hp-scr.show')) return; if (!e.children.length || e.tagName === 'BUTTON') { if (r.top < top && r.bottom > 0) out.push(e.className + ':' + (e.textContent || '').slice(0, 20) + '@' + Math.round(r.top)); if (r.left < 0 || r.right > innerWidth) out.push('OFFX ' + e.className + (e.textContent || '').slice(0, 15)); } });
      return { top, out: out.slice(0, 10) };
    });
    console.log(label, JSON.stringify(bad));
    await page.screenshot({ path: process.env.S + '/L_' + name + '_' + label + '.png' });
  };
  await page.waitForTimeout(800); await check('warn');
  await page.touchscreen.tap(w / 2, h * 0.7); await page.waitForTimeout(2000); await check('title');
  await page.evaluate(() => window.__hpEval("SAVE.tutDone=1; hideAllScreens(); startNight(1); 1"));
  await page.waitForFunction(() => window.__hpEval("GAME.mode==='play' && !!LESSON"), null, { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(500); await check('lesson');
  await page.evaluate(() => window.__hpEval("abortLesson(); TIMERS.length=0; removeTeacher(); startTransit(); addItem('chalk'); addItem('horn'); 1"));
  await page.waitForTimeout(2500); await check('transit');
  console.log(logs.filter(l => /error|ERR/i.test(l)).slice(0, 10).join('\n'));
  await b.close();
})();
