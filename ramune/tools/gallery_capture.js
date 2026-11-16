// node gallery_capture.js -> ramune/gallery/data.json + gallery/img/*.jpg (screenshots of each effect class)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const THREE_LOCAL = fs.readFileSync(path.join(__dirname, '..', '..', 'tools', 'three-r128.min.js'));
const OUT = path.join(__dirname, '..', 'gallery');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 640, height: 400 } });
  await page.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ body: THREE_LOCAL, contentType: 'application/javascript' }));
  await page.goto('http://localhost:8080/index.html');
  await page.waitForFunction(() => window.__rmReady, null, { timeout: 120000 });
  const ev = c => page.evaluate(c => window.__rmEval(c), c);
  await page.waitForTimeout(1500);
  await page.click('#rm-ok'); await page.waitForTimeout(500); await page.click('#rm-start'); await page.waitForTimeout(1500);
  // data
  const data = await ev(`(function(){
    var subs = SUBS.filter(function(s){return !s.hidden}).map(function(s){return {id:s.id,name:s.name,nick:s.nick,imp:s.imp||'',cls:s.cls,smoke:!!s.smoke,otc:!!s.otc,on:s.on,pk:s.pk,pl:s.pl,du:s.du,fx:s.fx,ph:s.ph,desc:s.desc,icon:ramuneIcon(s,128)}});
    var classes = {}; for (var k in CLASSES) classes[k] = {name:CLASSES[k].name, short:CLASSES[k].short, col:CLASSES[k].col, icon:CLASSES[k].icon, real:CLASSES[k].real||''};
    var drinks = DRINKS.map(function(d){return {id:d.id,name:d.name,sub:d.sub,desc:d.desc,alc:d.alc,icon:canIcon(d,128)}});
    var combos = COMBOS.map(function(c){return {id:c.id,name:c.name,hint:c.hint,desc:c.desc,danger:c.danger,classes:(c.need||[]).map(function(n){return n.c||n.distinct||(SUB[n.s]?SUB[n.s].cls:'')}),heavy:(c.need||[]).some(function(n){return n.lv}),special:!!c.special}});
    return {subs:subs, classes:classes, drinks:drinks, combos:combos, effects:EFFECT_NAMES, version:GAME_VERSION};
  })()`);
  fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(data));
  // screenshots
  const shots = [
    ['sober', 'しらふ', [], 0, [0.35, 1.35, 0.62, -0.2]],
    ['psy', '幻覚系', [['yumeiro', 1]], 110, [0.35, 1.35, 0.62, -0.05]],
    ['psy2', '幻覚系（大量）', [['yumeiro', 2], ['booster', 1]], 100, [0.35, 1.35, 0.3, 0.25]],
    ['up', 'アッパー系', [['hyper', 2]], 50, [0.35, 1.35, 0.62, -0.2]],
    ['down', 'ダウナー系', [['nemu', 1]], 70, [0.35, 1.35, 0.62, -0.25]],
    ['op', 'オピオイド系', [['nukunuku', 1]], 60, [1.05, 0.8, 1.6, -0.15]],
    ['dis', '解離系', [['fuyuu', 2]], 14, [0.35, 1.35, 0.62, -0.2]],
    ['emp', 'ハート系', [['velvet', 1]], 90, [0.35, 1.35, 0.62, -0.1]],
    ['del', 'せん妄系', [['tobari', 1]], 220, [0.9, 1.4, 1.35, -0.1]],
    ['gaba', 'ギャバ系', [['nebula', 1]], 100, [0.35, 1.35, 0.62, -0.2]],
    ['chill', 'チル系', [['chillmaki', 2]], 15, [0.35, 1.35, 0.62, -0.15]],
    ['otc', '市販薬系', [['koflez', 2]], 110, [0.35, 1.35, 0.62, -0.2]],
    ['alc', 'お酒', [], 0, [0.35, 1.35, 0.62, -0.2]],
    ['kal', '宇宙エレベーター（幻覚系×解離系）', [['prism', 2], ['fuyuu', 1]], 6, [0.35, 1.35, 0.62, 0.1]],
    ['danger', '危険な状態（オーバーヒート）', [['heart', 1], ['hyper', 1]], 100, [0.35, 1.35, 0.62, -0.2]]
  ];
  await ev(`(function(){ if (window.TUT) {} try{endTutorial(false)}catch(e){} showHUD(false); HUD.sub.style.display='none'; HUD.toasts.style.display='none'; HUD.banner.style.display='none'; HUD.danger.style.visibility='hidden'; GAME.paused=true; return 1; })()`);
  for (const s of shots) {
    await ev(`(function(){ GAME.B = newBody(); ${s[2].map(x => `takeSub(GAME.B,'${x[0]}',${x[1]});`).join('')} ${s[0] === 'alc' ? 'for(var i=0;i<6;i++)drinkCan(GAME.B,"z9lemon");bodyStep(GAME.B,90);' : ''} bodyStep(GAME.B, ${s[3]}); GAME.B.events=[]; GAME.B.danger=Math.min(GAME.B.danger, 60); GAME.B.unconscious=false; for (var k in VS) if (GAME.B.vis[k] != null) VS[k] = GAME.B.vis[k]; VS.red = GAME.B.danger/100; VS.lids = 0; GAME.fx.hue = 0; GAME.fx.gap = 0; PL.x=${s[4][0]};PL.z=${s[4][1]};PL.yaw=${s[4][2]};PL.pitch=${s[4][3]}; HUD.banner.style.display='none'; return 1; })()`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, 'img', s[0] + '.jpg'), type: 'jpeg', quality: 72 });
  }
  fs.writeFileSync(path.join(OUT, 'shots.json'), JSON.stringify(shots.map(s => ({ id: s[0], label: s[1] }))));
  await b.close();
  console.log('ok', data.subs.length, 'subs', data.combos.length, 'combos');
})();
