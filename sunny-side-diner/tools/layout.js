// node layout.js W H name — screenshots key screens and reports elements in the top 110px / off-screen / too close to sides
const run = require('./shot.js');
(async () => {
  const [w, h, name] = [+process.argv[2], +process.argv[3], process.argv[4]];
  const { b, page, logs } = await run({ viewport: { width: w, height: h }, touch: true, url: 'http://localhost:8080/index.html?ssdtest' });
  await page.waitForFunction(() => window.__ssdReady, null, { timeout: 240000 });
  const ev = c => page.evaluate(c => { try { return window.__ssdEval(c); } catch (e) { return 'ERR ' + e.message; } }, c);
  const report = [];
  const check = async (label) => {
    const bad = await page.evaluate(() => {
      const out = [], W = innerWidth;
      document.querySelectorAll('#ssd-ui *').forEach(e => {
        const r = e.getBoundingClientRect(), st = getComputedStyle(e);
        if (r.width < 2 || r.height < 2 || st.visibility === 'hidden' || st.display === 'none') return;
        let p = e, op = 1; while (p && p.id !== 'ssd-ui') { const s2 = getComputedStyle(p); op *= +s2.opacity; if (s2.display === 'none') op = 0; p = p.parentElement; } if (op < 0.05) return;
        const leaf = !e.children.length || e.tagName === 'BUTTON' || e.tagName === 'svg';
        if (!leaf || e.closest('svg') && e.tagName !== 'svg') return;
        const txt = (e.textContent || '').trim().slice(0, 18), btn = e.tagName === 'BUTTON' || e.closest('button');
        if (r.top < 110 && r.bottom > 0 && (txt || btn)) out.push('TOP ' + (e.className.baseVal != null ? 'svg' : e.className) + ' "' + txt + '" @' + Math.round(r.top));
        if (r.left < -1 || r.right > W + 1) out.push('OFFX ' + e.className + ' "' + txt + '" ' + Math.round(r.left) + '..' + Math.round(r.right));
        if (e.tagName === 'BUTTON' && (r.left < 15.5 || r.right > W - 15.5) && !e.closest('.seg') && !e.closest('.tabs')) out.push('EDGE ' + e.className + ' "' + txt + '" ' + Math.round(r.left) + '..' + Math.round(r.right));
      });
      return out.slice(0, 12);
    });
    report.push(label + ': ' + (bad.length ? bad.join(' | ') : 'ok'));
    await page.screenshot({ path: process.env.S + '/L_' + name + '_' + label + '.png', timeout: 180000 });
  };
  await page.waitForTimeout(800); await check('warn');
  await page.touchscreen.tap(w / 2, h * 0.6); await page.waitForTimeout(1800); await check('title');
  await ev("openSettings(); 1"); await page.waitForTimeout(700); await check('settings');
  await ev("document.querySelectorAll('.ov').forEach(function(o){o.remove()}); openArchive(); 1"); await page.waitForTimeout(700); await check('archive');
  await ev("document.querySelectorAll('.ov').forEach(function(o){o.remove()}); hideTitle(); SAVE.seenIntro=1; SAVE.name='Alex'; startNight(3); 1");
  await page.waitForFunction(() => window.__ssdEval('DOC.open'), null, { timeout: 60000 }); await page.waitForTimeout(900); await check('rules');
  await ev("closeDocs(); GAME.sched=[]; var C=spawnCustomer(ARCH[0],{silentEntry:true}); C.path=[]; sitDown(C, SEATS[3]); C.state='ready'; 1"); await page.waitForFunction(() => window.__ssdEval("GAME.mode==='play'"), null, { timeout: 30000 }); await page.waitForTimeout(800);
  await ev("say('EARL','Evenin\\'. Coffee, black. And whatever pie you got, sweetheart.','よう。コーヒー、ブラックで。それとパイがあればなんでも。',{voice:'trucker'}); setMain({icon:'snow',en:'HIDE INSIDE',ja:'冷凍庫に隠れる',fn:function(){}}); 1"); await page.waitForTimeout(2500); await check('play_sub');
  await ev("talkCancel(); tapCustomer(CUSTS[0]); 1"); await page.waitForTimeout(800); await check('slip');
  await ev("hideChoices(); toggleMap(); 1"); await page.waitForTimeout(700); await check('map');
  await ev("toggleMap(); camSetStation('KITCHEN',true); startMini('burger', function(){}); 1"); await page.waitForTimeout(1500); await check('mini');
  await ev("MINI.active=false; U.mini.classList.add('hide'); U.chips.innerHTML=''; pauseGame(); 1"); await page.waitForTimeout(600); await check('pause');
  await ev("resumeGame(); GAME.failRule='faceless'; GAME.deathAt=200; gameOver(); 1"); await page.waitForTimeout(1200); await check('sunnycard');
  await page.waitForTimeout(5200); await check('result');
  console.log(name + ' ' + w + 'x' + h + '\n  ' + report.join('\n  '));
  console.log(logs.filter(l => /error|PAGEERROR/i.test(l)).slice(0, 6).join('\n'));
  await b.close();
})();
