// ---- screens: warning, title CM, hiring, night card, results, settings, archive, endings ----
var SCR_CSS = [
  '.scr{position:absolute;inset:0;pointer-events:auto;transition:opacity .45s;}',
  '.scr.hide{opacity:0;pointer-events:none}',
  '.warn{background:#050506;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(var(--top-safe) + 10px) 26px calc(env(safe-area-inset-bottom,0px) + 30px);text-align:center;}',
  '.warn .w1{font:400 26px/1.1 "Alfa Slab One",serif;color:#ff4f4f;letter-spacing:.12em;text-shadow:0 0 16px rgba(255,60,60,.5)}',
  '.warn .w2{margin-top:14px;font:600 16px/1.5 Oswald,sans-serif;color:#e8e0d0;letter-spacing:.04em;max-width:330px}',
  '.warn .w3{margin-top:8px;font:500 13px/1.6 "Zen Kaku Gothic New",sans-serif;color:#b8ab95;max-width:330px}',
  '.warn .hp{margin-top:30px;display:flex;align-items:center;gap:12px;color:#8fd3c1;font:600 13px/1.3 Oswald,sans-serif;letter-spacing:.12em;text-align:left}.warn .hp .ic{width:34px;height:34px}',
  '.warn .tap{margin-top:46px;font:400 22px/1 "Alfa Slab One",serif;color:#fff3d6;letter-spacing:.18em;animation:blink 1.4s ease-in-out infinite}.warn .tap small{display:block;font:600 12px/1.6 "Zen Kaku Gothic New";letter-spacing:.1em;color:#b8ab95;margin-top:8px}',
  '@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}',
  // title CM
  '.cm{position:absolute;inset:0;overflow:hidden;background:#f4c870;transition:opacity .08s}',
  '.cm canvas{position:absolute;inset:0;width:100%;height:100%}',
  '.cm .tvframe{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 120px rgba(40,20,0,.75),inset 0 0 30px rgba(0,0,0,.5);background:repeating-linear-gradient(0deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px)}',
  '.logo{position:absolute;left:0;right:0;top:calc(var(--top-safe) + 18px);text-align:center;pointer-events:none}',
  '.logo .l1{font:400 min(46px,11.5vw)/1.05 Pacifico,cursive;color:#c8282e;text-shadow:0 3px 0 #fff4d8,0 6px 0 #7e1418,0 12px 18px rgba(0,0,0,.35);transform:rotate(-4deg);display:inline-block;padding:0 8px}',
  '.logo .l2{margin-top:22px;font:400 17px/1 "Alfa Slab One",serif;color:#7e1418;letter-spacing:.2em}',
  '.logo .l3{display:inline-block;margin-top:10px;padding:6px 14px;border-radius:999px;background:#c8282e;color:#fff4d8;font:600 13px/1 Oswald,sans-serif;letter-spacing:.24em;box-shadow:0 3px 0 #7e1418}',
  '.titlemenu{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);transform:translateX(-50%);width:min(320px,calc(100% - 40px));display:flex;flex-direction:column;gap:14px}',
  '.titlemenu .mb{position:relative;left:auto;transform:none;max-width:none;width:100%}',
  '.titlemenu .mb:active,.titlemenu .mb.down{transform:translateY(4px)}',
  '.ver{position:absolute;right:18px;bottom:calc(env(safe-area-inset-bottom,0px) + 4px);font:600 9px/1 Oswald;letter-spacing:.2em;color:rgba(0,0,0,.35)}',
  // night card
  '.nightcard{position:absolute;inset:0;background:#030304;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}',
  '.nightcard .n1{font:400 64px/1 Pacifico,cursive;color:#ff4fa3;text-shadow:0 0 12px #ff4fa3,0 0 40px rgba(255,79,163,.7);animation:neonon 1.6s steps(1) both}',
  '.nightcard .n2{margin-top:16px;font:400 20px/1 "Alfa Slab One",serif;letter-spacing:.3em;color:#5be8ff;text-shadow:0 0 10px #5be8ff;animation:neonon 1.6s .3s steps(1) both}',
  '.nightcard .n3{margin-top:12px;font:500 13px/1.6 "Zen Kaku Gothic New";color:#b8ab95;letter-spacing:.2em}',
  '@keyframes neonon{0%{opacity:0}10%{opacity:1}14%{opacity:.1}18%{opacity:1}40%{opacity:.3}44%,100%{opacity:1}}',
  // sunny card (game over)
  '.sunnycard{position:absolute;inset:0;background:#f4c870;overflow:hidden}',
  '.sunnycard canvas{position:absolute;inset:0;width:100%;height:100%}',
  '.bubble{position:absolute;left:50%;top:calc(var(--top-safe) + 30px);transform:translateX(-50%) rotate(-2deg);padding:16px 22px;background:#fffaf0;border:3px solid #2a1608;border-radius:24px;text-align:center;box-shadow:0 6px 0 rgba(0,0,0,.2);max-width:calc(100% - 40px)}',
  '.bubble .e{font:400 30px/1.1 Pacifico,cursive;color:#c8282e}.bubble .j{font:700 14px/1.4 "Zen Kaku Gothic New";color:#5a3a1a;margin-top:6px}',
  '.bubble::after{content:"";position:absolute;left:50%;bottom:-18px;border:12px solid transparent;border-top:16px solid #2a1608;margin-left:-12px}',
  // hire form
  '.form input{width:100%;height:44px;margin-top:6px;border:0;border-bottom:2px solid #22201c;background:transparent;font:400 24px/44px "Special Elite",monospace;color:#1d2f6f;outline:none;-webkit-user-select:text;user-select:text;border-radius:0}',
  '.form label{display:block;font:400 13px/1.3 "Special Elite",monospace;color:#555;margin-top:12px}',
  '.form .stampbox{margin-top:16px;display:inline-block;padding:4px 10px;border:3px solid #c8282e;color:#c8282e;font:400 18px/1 "Alfa Slab One";transform:rotate(-8deg)}',
  // settings / archive
  '.panel{position:absolute;left:0;right:0;margin:0 auto;top:calc(var(--top-safe) + 8px);bottom:calc(env(safe-area-inset-bottom,0px) + 96px);width:min(370px,calc(100% - 32px));padding:22px 20px;background-size:100% 100%;border-radius:4px;filter:drop-shadow(0 14px 24px rgba(0,0,0,.6));overflow-y:auto;-webkit-overflow-scrolling:touch;color:#22201c;animation:docin .4s cubic-bezier(.2,.9,.25,1.1) both;--r:0deg;--r1:2deg}',
  '.panel h2{margin:0 0 12px;font:400 30px/1 Pacifico,cursive;color:#c8282e;text-align:center}',
  '.row{margin:14px 0}.row .lb{display:flex;justify-content:space-between;font:600 14px/1.2 Oswald,sans-serif;letter-spacing:.1em}.row .lb .ja{font:500 11px/1.4 "Zen Kaku Gothic New";letter-spacing:0;color:#6b5a44}',
  '.seg{display:flex;gap:6px;margin-top:8px}.seg button{flex:1;height:38px;border-radius:999px;border:2px solid #22201c;background:#fbf3e0;font:600 12px/1 Oswald,sans-serif;letter-spacing:.08em;color:#22201c;pointer-events:auto}.seg button.on{background:#c8282e;color:#fff4d8;border-color:#7e1418;box-shadow:inset 0 2px 3px rgba(0,0,0,.3)}',
  '.rng{width:100%;margin-top:10px;-webkit-appearance:none;appearance:none;height:8px;border-radius:4px;background:linear-gradient(90deg,#c8282e var(--v,50%),#d8ccb0 var(--v,50%));outline:none;pointer-events:auto}',
  '.rng::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#9aa3ab);border:2px solid #555;box-shadow:0 2px 4px rgba(0,0,0,.4)}',
  '.tabs{display:flex;gap:6px;margin-bottom:12px}.tabs button{flex:1;height:34px;border-radius:8px 8px 0 0;border:2px solid #22201c;border-bottom:0;background:#e9dcbc;font:600 11px/1 Oswald;letter-spacing:.1em;pointer-events:auto}.tabs button.on{background:#fbf3e0}',
  '.arow{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed rgba(0,0,0,.25)}.arow .ic{width:22px;height:22px;flex:0 0 auto;color:#c8282e}.arow .t{font:600 14px/1.25 Oswald;letter-spacing:.04em}.arow .d{font:500 11.5px/1.5 "Zen Kaku Gothic New";color:#5a5244}.arow.lock{opacity:.4}',
  '.arow.btn{cursor:pointer;pointer-events:auto}',
  // ending lyrics
  '.lyr{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 40px);text-align:center;pointer-events:none}',
  '.lyr .e{position:relative;display:inline-block;font:700 21px/1.3 "Zen Kaku Gothic New",sans-serif;color:rgba(255,248,234,.45);text-shadow:0 2px 4px #000}',
  '.lyr .e b{position:absolute;left:0;top:0;white-space:nowrap;overflow:hidden;color:#ffe27a;text-shadow:0 0 12px rgba(255,190,60,.7),0 2px 4px #000;width:var(--w,0%)}',
  '.lyr .j{margin-top:6px;font:500 14px/1.4 "Zen Kaku Gothic New";color:rgba(243,230,200,.85);text-shadow:0 1px 3px #000}',
  '.endtxt{position:absolute;left:24px;right:24px;top:40%;transform:translateY(-50%);text-align:center;color:#f3e6c8;pointer-events:none}',
  '.endtxt .e{font:400 22px/1.4 "Special Elite",monospace}.endtxt .j{font:500 13px/1.7 "Zen Kaku Gothic New";color:#b8ab95;margin-top:10px}'
].join('\n');
var SCR = {};
function scr(cls, html) { var d = el('div', 'scr ' + cls, html || '', UI); return d; }
function killScr(d, fade) { if (!d) return; if (fade) { d.classList.add('hide'); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 480); } else if (d.parentNode) d.parentNode.removeChild(d); }
// ---- warning ---------------------------------------------------------------------------
function showWarning() {
  GAME.mode = 'warn';
  var w = scr('warn', '<div class="w1">WARNING</div><div class="w2">This game contains jump scares, loud sounds, and blood.</div><div class="w3">※ホラー演出・急な大きい音・流血表現があります</div>' +
    '<div class="hp">' + icon('headphones', 34) + '<div>HEADPHONES RECOMMENDED<br><span style="font:500 12px \'Zen Kaku Gothic New\';letter-spacing:0;color:#b8ab95">イヤホン推奨</span></div></div><div class="tap">TAP TO START<small>タップしてはじめる</small></div>');
  SCR.warn = w;
  onTap(w, function () {
    audioUnlock(); try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
    killScr(w, true); SCR.warn = null; showTitle(true);
  });
}
// ---- title (50s TV commercial; glitches to the rainy night) --------------------------------------
var CM = { on: false, t: 0 };
function showTitle(first) {
  GAME.mode = 'title'; setGameHUD(false);
  RENDER.scene.environment = RENDER.scene.environment;
  FX.rainT = 1; LSTATE.coldT = 0.3; LSTATE.lightsOn = true; LSTATE.neonOn = true;
  CAM.override = { pos: new THREE.Vector3(-4.6, 1.35, 16.5), target: new THREE.Vector3(-1.2, 2.3, 4), k: 1, dur: 1 }; CAM.titleDrift = 0;
  playMusic('title', { vol: 0.85 });
  var s = scr('', '<div class="cm"><canvas></canvas><div class="tvframe"></div></div><div class="logo"><div class="l1">Sunny Side Diner</div><div class="l2">— OPEN 24 HOURS! —</div><div class="l3">RISE AND SHINE!</div></div><div class="titlemenu"></div><div class="ver">v' + GAME_VERSION + '</div>');
  SCR.title = s; CM.on = true; CM.t = 0; CM.el = s.querySelector('.cm'); CM.cv = s.querySelector('.cm canvas'); CM.next = 4 + Math.random() * 3;
  var menu = s.querySelector('.titlemenu');
  var items = [['play', SAVE.day > 1 ? 'START · NIGHT ' + SAVE.day : 'START', 'シフトに入る', startPressed], ['gear', 'SETTINGS', '設定', openSettings], ['archive', 'ARCHIVE', '記録（' + loreCount() + '/15）', openArchive]];
  items.forEach(function (b) { var bt = el('button', 'mb pe', icon(b[0], 30) + '<span class="tx"><span class="en">' + b[1] + '</span><span class="ja">' + b[2] + '</span></span>', menu); pressFX(bt); onTap(bt, function () { sfx('click'); b[3](); }); });
}
function hideTitle() { CM.on = false; killScr(SCR.title, true); SCR.title = null; }
function drawCMFrame(dt) {
  if (!CM.on || !CM.cv) return;
  CM.t += dt; var t = CM.t;
  // glitch to the night
  CM.next -= dt;
  if (CM.next <= 0 && !CM.gl) { CM.gl = 0.25 + Math.random() * 0.45; sfx('static', null, { len: CM.gl, vol: 0.5 }); }
  if (CM.gl > 0) { CM.gl -= dt; CM.el.style.opacity = Math.random() < 0.8 ? 0 : 0.5; PU.uGlitch.value = 0.6; PU.uVHS.value = 1; if (CM.gl <= 0) { CM.gl = 0; CM.next = 5 + Math.random() * 5; CM.el.style.opacity = 1; PU.uGlitch.value = 0; PU.uVHS.value = 0; } }
  var cv = CM.cv, w = Math.round((cv.clientWidth || RENDER.w) * 0.75), h = Math.round((cv.clientHeight || RENDER.h) * 0.75); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  if (RENDER.frame % 2) return;
  var g = cv.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f2a24e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.save(); g.translate(w / 2, h * 0.5); g.rotate(t * 0.12); for (var i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.22)' : 'rgba(255,240,200,0.05)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, Math.max(w, h), i / 16 * TAU, (i + 0.5) / 16 * TAU); g.fill(); } g.restore();
  // ground stripe + little diner cartoon
  g.fillStyle = '#8fd3c1'; g.fillRect(0, h * 0.76, w, h * 0.24); g.fillStyle = '#2f7e6e'; g.fillRect(0, h * 0.76, w, 4);
  var dx = w * 0.5, dy = h * 0.74; g.fillStyle = '#d8dde2'; g.fillRect(dx - w * 0.32, dy - h * 0.09, w * 0.64, h * 0.09); g.fillStyle = '#c8282e'; g.fillRect(dx - w * 0.32, dy - h * 0.065, w * 0.64, h * 0.012);
  g.fillStyle = '#5be8ff'; for (var k = 0; k < 6; k++) g.fillRect(dx - w * 0.29 + k * w * 0.1, dy - h * 0.05, w * 0.07, h * 0.035);
  var bob = Math.sin(t * 4) * h * 0.012;
  drawSunny(g, w * 0.5, h * 0.5 + bob, Math.min(w, h) * 0.17, { wave: 0.3 + Math.sin(t * 7) * 0.6, look: Math.sin(t * 0.7) * 0.4 });
  for (var sp = 0; sp < 6; sp++) { var a = t * 1.5 + sp; var sx = w * 0.5 + Math.cos(a) * w * 0.36, sy = h * 0.48 + Math.sin(a * 1.3) * h * 0.12; g.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 6 + sp)) + ')'; g.beginPath(); g.arc(sx, sy, 3 + sp % 3, 0, TAU); g.fill(); }
  // film jitter / color bleed
  if (Math.random() < 0.04) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, Math.random() * h, w, 2); }
}
function startPressed() {
  if (SAVE.day > 1) {
    showChoices('Which night?', [{ icon: 'play', en: 'Continue: Night ' + SAVE.day, ja: SAVE.day + '日目からつづける', fn: function () { beginFromTitle(SAVE.day); } }, { icon: 'restart', en: 'New game: Night 1', ja: '1日目からはじめる', fn: function () { SAVE.day = 1; writeSave(); beginFromTitle(1); } }], { table: 'START' });
  } else beginFromTitle(1);
}
function beginFromTitle(day) {
  hideChoices();
  CM.el.style.opacity = 0; PU.uGlitch.value = 0.8; sfx('static', null, { len: 0.6 });
  setTimeout(function () {
    PU.uGlitch.value = 0; hideTitle();
    if (day === 1 && !SAVE.seenIntro) hireSequence(); else { stopMusic(1); startNight(day); }
  }, 500);
}
// ---- hiring: newspaper ad -> application (name) -> letter ------------------------------------------
function hireSequence() {
  GAME.mode = 'cut';
  openDocs(docNews({ paper: 'The Desert Ledger', date: 'Classifieds — Monday', head: 'NIGHT SHIFT WANTED', img: sunnyAdImg(), body: ['<b>No Experience Needed!</b> Sunny Side Diner, Highway 9. Nights, 10 PM – 6 AM. Free coffee. Must follow simple rules.', 'Apply in person or by mail. We\'ll keep the light on for you!'], ja: '求人：深夜スタッフ募集・未経験OK！ サニーサイド・ダイナー（ハイウェイ9号線）。夜10時〜朝6時。コーヒー飲み放題。かんたんなルールを守れる方。' }), { closeEn: 'APPLY', closeJa: '応募する', closeIcon: 'pencil', onClose: applicationForm });
}
function sunnyAdImg() { var c = mkCanvas(320, 200), g = c.getContext('2d'); g.fillStyle = '#e8dfc6'; g.fillRect(0, 0, 320, 200); drawSunny(g, 160, 92, 54, { wave: 0.7 }); return c.toDataURL('image/png'); }
function applicationForm() {
  var h = '<div class="doc rules form" style="background-image:url(' + PAPER.rules + ');--r:.6deg"><div class="rlogo">Sunny Side Diner</div><h2 style="font:400 19px/1.2 \'Special Elite\';text-align:center;margin:6px 0 4px">EMPLOYMENT APPLICATION</h2><div style="font:500 12px \'Zen Kaku Gothic New\';text-align:center;color:#666">採用申込書 ── 名前を書いてください（英字）</div>' +
    '<label>NAME / 名前</label><input id="ssd-name" maxlength="12" autocomplete="off" autocapitalize="words" spellcheck="false" value="' + (SAVE.name || '') + '" placeholder="Sam">' +
    '<label>POSITION / 職種</label><div style="font:400 20px \'Special Elite\';color:#1d2f6f;border-bottom:2px solid #22201c;padding:6px 0">Night Shift</div>' +
    '<label>CAN YOU FOLLOW RULES? / ルールを守れますか</label><div style="font:700 26px Caveat;color:#1d2f6f">Yes.</div></div>';
  openDocs(h, { closeEn: 'SIGN & SEND', closeJa: 'サインして送る', closeIcon: 'pencil', onClose: function () {
    var v = ''; try { v = (document.getElementById('ssd-name') || {}).value || ''; } catch (e) {}
    v = v.replace(/[^A-Za-z .'-]/g, '').trim().slice(0, 12); if (!v) v = 'Sam';
    SAVE.name = v.charAt(0).toUpperCase() + v.slice(1); SAVE.seenIntro = 1; writeSave();
    acceptanceLetter();
  } });
  setTimeout(function () { var i = document.getElementById('ssd-name'); if (i) { i.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); i.addEventListener('keydown', function (e) { e.stopPropagation(); }); } }, 50);
}
function acceptanceLetter() {
  openDocs(docDiary('Dear ' + SAVE.name + ',<br>You\'re hired! Start tonight at 10 o\'clock. The manager, Dale, will leave you a note and the rules.<br>Rise and shine!<br>— June Mercer, owner', SAVE.name + ' さんへ。採用です！ 今夜10時から来てください。店長のデールがメモとルールを置いておきます。Rise and shine！ ── 店主 ジューン・マーサー'), { closeEn: 'GO TO WORK', closeJa: '出勤する', closeIcon: 'walk', onClose: function () { stopMusic(1.2); startNight(1); } });
}
// ---- starting a night ---------------------------------------------------------------------------------
var MEMOS = {
  1: ['Welcome aboard, kid. I can\'t be there tonight.<br>Coffee\'s in the pot. Rules are on the board — the laminated page.<br>Follow them and you\'ll see the sunrise.<br>— Dale', 'ようこそ。今夜は店に行けない。コーヒーはポットに。ルールはボードに貼ったラミネートの紙だ。守れば朝日が見られる。── デール'],
  2: ['Two new rules tonight. Don\'t ask why.<br>Booth 4 is nobody\'s booth.<br>— Dale', '今夜はルールが2つ増えた。理由は聞くな。4番席はだれの席でもない。── デール'],
  3: ['Somebody\'s been pinning papers on my board.<br>Only trust the laminated page with my signature.<br>— Dale', 'だれかがおれのボードに紙を貼っていく。信じていいのは、おれのサインがあるラミネートの紙だけだ。── デール'],
  4: ['If my voice sounds wrong on the phone, it\'s the line.<br>...Probably.<br>— Dale', '電話でおれの声がおかしく聞こえても、回線のせいだ。……たぶんな。── デール'],
  5: ['Last night, kid. At dawn, listen carefully.<br>Whatever you hear — do the rules.<br>— D.', '最後の夜だ。夜明けはよく聞け。何が聞こえても、ルールを守れ。── D'] };
function startNight(day) {
  closeDocs(true); hideChoices(); toggleMap(false); stopVoice(); stopMusic(0.5);
  newGameState(day); clearWorld();
  GAME.mode = 'cut';
  var fakes = []; var pool = FAKES.filter(function (f) { return rulesForDay(day).some(function (r) { return r.id === f.against; }) || f.against === 'reflection'; });
  R.shuffle(pool); fakes = pool.slice(0, DAY_FAKES[day]); GAME.fakes = fakes;
  GAME.sched = buildSchedule(day);
  spawnLoreForNight(day); sunnyProgress(day);
  CAM.override = null; camSetStation('COUNTER', true);
  ARCH_BAG = [];
  var nc = scr('nightcard', '<div class="n1">Night ' + day + '</div><div class="n2">10:00 PM</div><div class="n3">' + ['', '1日目', '2日目', '3日目', '4日目', '5日目（最終日）'][day] + '</div>');
  sfx('zap', null, { vol: 0.4 }); setTimeout(function () { sfx('zap', null, { vol: 0.3 }); }, 220);
  setTimeout(function () {
    killScr(nc, true);
    jukePlay('boogie', { label: 'A1 Diner Boogie' }); JUKE.label = 'A1 Diner Boogie';
    var memo = MEMOS[day];
    openDocs(docSticky(memo[0], memo[1]) + docRules(rulesDocList(day, fakes), day) + '<div class="doccap">' + (day === 1 ? 'TAP GUESTS TO SERVE THEM · お客さんをタップして接客' : 'NEW RULES TONIGHT · 新しいルール') + '</div>', { closeEn: 'START SHIFT', closeJa: 'シフト開始', closeIcon: 'play', onClose: function () {
      GAME.mode = 'play'; setGameHUD(true); setClock(0, day); setTips(0, false); updateMainButton();
      if (day === 1) tutorialHints();
    } });
  }, 2400);
}
function tutorialHints() {
  setTimeout(function () { if (GAME.mode === 'play') toast('Guests wait at the door. Tap them to seat them.', 'お客さんは入口で待っている。タップして席へ案内', 4); }, 5000);
  setTimeout(function () { if (GAME.mode === 'play') toast(isMobile() ? 'Drag the LEFT side to walk, the right side to look.' : 'WASD / arrow keys to walk. Drag to look.', isMobile() ? '画面の左側をドラッグで歩く・右側で見回す（MAPや光る輪でも移動）' : 'WASD・矢印キーで歩く。ドラッグで見回す', 5); }, 15000);
  setTimeout(function () { if (GAME.mode === 'play') toast('Orders go to the KITCHEN. Cook, then serve.', '注文は厨房へ。作ってから運ぶ', 4); }, 40000);
}
// ---- results / sunny card ---------------------------------------------------------------------------
function resultScreen(lines, buttons) {
  var h = docReceipt(lines, true);
  openDocs(h, { noClose: true });
  setTimeout(function () { sfx('print', null, { n: 28 }); }, 100);
  var wrap = DOC.wrap, box = el('div', null, null, wrap); box.style.cssText = 'width:min(300px,calc(100% - 40px));display:flex;flex-direction:column;gap:14px;margin-top:16px;';
  buttons.forEach(function (b) { var bt = el('button', 'mb pe', icon(b[0], 30) + '<span class="tx"><span class="en">' + b[1] + '</span><span class="ja">' + b[2] + '</span></span>', box); bt.style.cssText = 'position:relative;left:auto;transform:none;max-width:none;width:100%;'; pressFX(bt); onTap(bt, function () { sfx('click'); closeDocs(true); b[3](); }); });
}
function showSunnyCard(en, ja, cb) {
  var s = scr('sunnycard', '<canvas></canvas><div class="bubble"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>');
  var cv = s.querySelector('canvas'), t0 = performance.now();
  var draw = function () {
    if (!s.parentNode) return; var t = (performance.now() - t0) / 1000, w = cv.width = Math.round((cv.clientWidth || RENDER.w) * 0.8), h = cv.height = Math.round((cv.clientHeight || RENDER.h) * 0.8), g = cv.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f2a24e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.6); g.rotate(t * 0.2); for (var i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, h, i / 16 * TAU, (i + 0.5) / 16 * TAU); g.fill(); } g.restore();
    drawSunny(g, w / 2, h * 0.6 + Math.sin(t * 5) * 6, Math.min(w, h) * 0.2, { wave: 0.4 + Math.sin(t * 8) * 0.7 });
    if (t > 2.6 && t < 2.75) { g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(0, 0, w, h); drawSunny(g, w / 2, h * 0.6, Math.min(w, h) * 0.22, { mood: 'hollow' }); }
    requestAnimationFrame(draw);
  };
  draw();
  setTimeout(function () { say('SUNNY', en, ja, { voice: 'sunny', picoDark: 0.15 }); }, 300);
  setTimeout(function () { killScr(s, true); cb && cb(); }, 4200);
}
// ---- settings ----------------------------------------------------------------------------------------
function openSettings() {
  var S = SAVE.settings;
  var ov = el('div', 'ov dim pe', '', UI);
  var p = el('div', 'panel ssd-scroll', '<h2>Settings</h2>', ov); p.style.backgroundImage = 'url(' + PAPER.rules + ')';
  function slider(key, en, ja, min, max, step) {
    var r = el('div', 'row', '<div class="lb"><span>' + en + '</span><span class="ja">' + ja + '</span></div><input class="rng" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S[key] + '">', p);
    var inp = r.querySelector('input'); var upd = function () { inp.style.setProperty('--v', ((inp.value - min) / (max - min) * 100) + '%'); }; upd();
    inp.addEventListener('input', function () { S[key] = parseFloat(inp.value); upd(); applyVolumes(); writeSave(); });
    inp.addEventListener('change', function () { if (key === 'sfx') sfx('cup'); if (key === 'voice') say('SUNNY', 'Rise and shine!', 'おはよう！', { voice: 'sunny' }); });
  }
  function seg(key, en, ja, vals, labels, fn) {
    var r = el('div', 'row', '<div class="lb"><span>' + en + '</span><span class="ja">' + ja + '</span></div><div class="seg"></div>', p), sg = r.querySelector('.seg');
    vals.forEach(function (v, i) { var b = el('button', S[key] === v ? 'on' : '', labels[i], sg); onTap(b, function () { S[key] = v; writeSave(); sg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); sfx('click'); if (fn) fn(v); }); });
  }
  slider('bgm', 'MUSIC', '音楽（BGM）', 0, 1, 0.05); slider('sfx', 'SOUND FX', '効果音', 0, 1, 0.05); slider('voice', 'VOICE', '声', 0, 1, 0.05);
  seg('voiceMode', 'VOICE / 読み上げ', 'セリフの読み上げ', ['OFF', 'EN', 'JA'], ['OFF', 'ENGLISH', '日本語']);
  seg('voiceRate', 'VOICE SPEED', '読み上げの速さ', ['SLOW', 'NORMAL', 'FAST'], ['ゆっくり', 'ふつう', 'はやい']);
  slider('sens', 'LOOK SENSITIVITY', '視点の感度', 0.4, 2, 0.1);
  seg('quality', 'QUALITY', '画質', ['AUTO', 'LOW', 'MEDIUM', 'HIGH'], ['AUTO', 'LOW', 'MED', 'HIGH'], function (v) { setQuality(v); });
  seg('scare', 'JUMP SCARES', 'ジャンプスケアの強さ', ['NORMAL', 'MILD'], ['NORMAL', 'MILD']);
  var cb = el('button', 'mb pe docclose', icon('ok', 30) + '<span class="tx"><span class="en">DONE</span><span class="ja">とじる</span></span>', ov); pressFX(cb);
  onTap(cb, function () { sfx('paper'); ov.parentNode.removeChild(ov); });
}
// ---- archive -----------------------------------------------------------------------------------------------
var ANOM_INFO = {
  faceless: ['The guest with no face', '顔のない客'], offmenu: ['Not on the menu', 'メニューにない注文'], phone: ['The pink phone', 'ピンクの電話'], sunny: ['Sunny calls your name', '名前を呼ぶ Sunny'],
  booth4: ['3 AM, Booth 4', '午前3時の4番席'], jukebox: ['The jukebox changes the song', '勝手に変わる曲'], reflection: ['The wrong reflection', 'ちがう映り込み'], doppel: ['The same guest twice', '2回来た客'],
  headlights: ['High beams in the lot', '消えないヘッドライト'], backdoor: ['Knocking at the back door', '裏口のノック'], dayshift: ['The day shift', '日勤']
};
function openArchive() {
  var ov = el('div', 'ov dim pe', '', UI), p = el('div', 'panel ssd-scroll', '<h2>Archive</h2><div class="tabs"></div><div class="body"></div>', ov); p.style.backgroundImage = 'url(' + PAPER.rules + ')';
  var tabs = p.querySelector('.tabs'), body = p.querySelector('.body');
  var T = [['RECORD', function () {
    body.innerHTML = '<div class="arow">' + icon('ticket', 22) + '<div><div class="t">NIGHTS CLEARED: ' + (SAVE.clears || 0) + ' / 5</div><div class="d">クリアした日数</div></div></div><div class="arow">' + icon('coin', 22) + '<div><div class="t">BEST TIPS: ' + fmtMoney(SAVE.bestTips || 0) + '</div><div class="d">一晩のチップ最高記録 · 合計 ' + fmtMoney(SAVE.totalTips || 0) + '</div></div></div><div class="arow">' + icon('stop', 22) + '<div><div class="t">TIMES CAUGHT: ' + (SAVE.deaths || 0) + '</div><div class="d">つかまった回数</div></div></div><div class="arow">' + icon('ok', 22) + '<div><div class="t">ENDINGS: ' + (SAVE.normalEnd ? 'NORMAL ' : '') + (SAVE.trueEnd ? '· TRUE' : '') + '</div><div class="d">見たエンディング</div></div></div>';
  }], ['ANOMALIES', function () {
    body.innerHTML = ''; RULES.forEach(function (r) { var s = SAVE.anomalies[r.id] || 0, inf = ANOM_INFO[r.id]; el('div', 'arow' + (s ? '' : ' lock'), icon(s === 2 ? 'ok' : s ? 'eye' : 'eyeoff', 22) + '<div><div class="t">' + (s ? inf[0] : '? ? ?') + '</div><div class="d">' + (s ? inf[1] + (s === 2 ? '（対応できた）' : '（遭遇した）') : 'まだ見ていない') + '</div></div>', body); });
  }], ['LORE', function () {
    body.innerHTML = ''; LORE.forEach(function (L) { var got = SAVE.lore[L.id]; var r = el('div', 'arow' + (got ? ' btn' : ' lock'), icon(got ? 'archive' : 'eyeoff', 22) + '<div><div class="t">' + (got ? L.y + ' · ' + L.t : '? ? ?') + '</div><div class="d">' + (got ? L.ja : '店のどこかにある') + '</div></div>', body); if (got) onTap(r, function () { openDocs(L.make(), {}); }); });
  }], ['TV', function () {
    body.innerHTML = ''; var r = el('div', 'arow' + (SAVE.trueEnd ? ' btn' : ' lock'), icon('play', 22) + '<div><div class="t">' + (SAVE.trueEnd ? 'SUNNY SIDE DINER — TV COMMERCIAL' : '? ? ?') + '</div><div class="d">' + (SAVE.trueEnd ? 'テレビの中のCMをもう一度見る' : 'トゥルーエンドを見ると解放') + '</div></div>', body);
    if (SAVE.trueEnd) onTap(r, function () { ov.parentNode.removeChild(ov); hideTitle(); stopMusic(0.5); playTVCommercial(function () { showTitle(); }); });
  }]];
  T.forEach(function (t, i) { var b = el('button', i ? '' : 'on', t[0], tabs); onTap(b, function () { tabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); sfx('paper'); t[1](); }); });
  T[0][1]();
  var cb = el('button', 'mb pe docclose', icon('ok', 30) + '<span class="tx"><span class="en">DONE</span><span class="ja">とじる</span></span>', ov); pressFX(cb);
  onTap(cb, function () { sfx('paper'); ov.parentNode.removeChild(ov); });
}
// ---- endings --------------------------------------------------------------------------------------------
function finale() {
  var all = loreCount() >= 15, clean = !GAME.missedJune;
  if (all && clean) { SAVE.trueEnd = 1; writeSave(); trueEnding(); }
  else { SAVE.normalEnd = 1; writeSave(); normalEnding(all); }
}
function endText(en, ja, sec) { return new Promise(function (res) { var d = scr('', '<div class="endtxt"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>'); d.style.background = 'rgba(0,0,0,0.0)'; setTimeout(function () { killScr(d, true); setTimeout(res, 500); }, sec * 1000); }); }
async function normalEnding(all) {
  GAME.mode = 'cut'; PU.uBlack.value = 0.6;
  playMusic('title', { vol: 0.7 });
  await endText('You drive away as the sun comes up.<br>In the mirror, the sign is still on.', '朝日の中、車を走らせる。ミラーの中で、看板はまだ光っている。', 5);
  await endText('A week later, the paper runs the same ad:<br><b>NIGHT SHIFT WANTED</b>', '1週間後、新聞にまた同じ広告が載った。「深夜スタッフ募集」', 5);
  await endText(all ? 'Some things still don\'t add up...' : 'There is more to this diner.<br>(Find every record to learn the truth.)', all ? 'まだ何かが、引っかかる……' : 'この店には、まだ秘密がある。（記録をすべて集めると……）', 4.5);
  PU.uBlack.value = 0; showTitle();
}
async function trueEnding() {
  GAME.mode = 'cut';
  await say('JUNE', 'Rise and shine, partner. You read everything, didn\'t you? Then you know.', 'Rise and shine。ぜんぶ読んだんだね。なら、わかってるだろう。', { voice: 'june' });
  await say('JUNE', 'Somebody has to keep the light on.', 'だれかが、明かりをつけていなきゃならない。', { voice: 'june', rate: 0.85 });
  playTVCommercial(function () { showTitle(); });
}
// the old CM on the CRT above the counter; lyrics karaoke; last line cuts to tonight
function playTVCommercial(done) {
  GAME.mode = 'cut'; setGameHUD(false); clearWorld(); camSetStation('COUNTER', true);
  LSTATE.coldT = 0.2; FX.rainT = 0.6; LSTATE.lightsOn = true; LSTATE.neonOn = true;
  // name tag on the counter
  var tc = mkCanvas(256, 128), tg = tc.getContext('2d'); tg.fillStyle = '#c8282e'; tg.fillRect(0, 0, 256, 128); tg.fillStyle = '#fff'; tg.fillRect(8, 40, 240, 80); tg.font = '24px ' + F.slab; tg.textAlign = 'center'; tg.fillText('HELLO my name is', 128, 30); tg.fillStyle = '#1d2f6f'; tg.font = '50px ' + F.hand; tg.fillText(SAVE.name || 'Sam', 128, 98);
  var tag = mesh(new THREE.PlaneGeometry(0.12, 0.06), new THREE.MeshStandardMaterial({ map: toTex(tc, { clamp: true }), roughness: 0.4 }), 0.55, D.counterY + 0.003, -1.55, RENDER.scene, false); tag.rotation.x = -PI / 2; tag.rotation.z = 0.25;
  var tv = WORLD.tv, sc = new THREE.Vector3(-0.06, 0.02, 0.176); tv.localToWorld(sc);
  var nrm = new THREE.Vector3(Math.sin(tv.rotation.y), 0, Math.cos(tv.rotation.y));
  var p0 = sc.clone().add(nrm.clone().multiplyScalar(2.4)).add(new THREE.Vector3(0.3, -0.45, 0)), p1 = sc.clone().add(nrm.clone().multiplyScalar(0.5));
  CAM.override = { pos: p0.clone(), target: sc.clone(), k: 1, dur: 1 };
  var cmC = mkCanvas(512, 384), cmT = toTex(cmC, { clamp: true, nomip: true }); var oldMap = WORLD.tvMat.map; WORLD.tvMat.map = cmT; WORLD.tvMat.needsUpdate = true; TV.mode = 'cm';
  // live view of tonight's counter (for the last line)
  var liveRT = new THREE.WebGLRenderTarget(512, 384), liveCam = new THREE.PerspectiveCamera(50, 4 / 3, 0.05, 50); liveCam.position.set(0.9, 1.5, -2.4); liveCam.lookAt(0.55, 1.06, -1.5);
  var faces = ARCH.slice(0, 8).map(function (a) { var o = {}; for (var k in a.o) o[k] = a.o[k]; o.seed = 7; o.smile = 1; var c = faceCanvas(o), g = c.getContext('2d');
    // paint the hair / hat back on so they read as people in the old film
    g.fillStyle = o.hat ? (o.hatC || '#6b4a2a') : (o.hairC || '#3a2618');
    g.beginPath(); g.ellipse(128, 70, 62, o.hair === 'bald' ? 10 : 34, 0, PI, 0); g.fill(); g.fillRect(66, 66, 124, o.hat ? 8 : 14);
    if (o.hair === 'long' || o.hair === 'pony' || o.hair === 'bob' || o.hair === 'beehive') { g.fillRect(66, 66, 14, 90); g.fillRect(176, 66, 14, 90); }
    if (o.hair === 'beehive') { g.beginPath(); g.ellipse(128, 50, 50, 40, 0, 0, TAU); g.fill(); }
    return c; });
  var lyr = scr('', '<div class="lyr"><div class="e"><span class="t"></span><b></b></div><div class="j"></div></div>'); lyr.style.pointerEvents = 'none';
  var started = performance.now(), ended = false, cut = false, off = false;
  var skip = el('button', 'mb pe hidden', icon('skip', 30) + '<span class="tx"><span class="en">SKIP</span><span class="ja">スキップ</span></span>', UI); skip.style.cssText = 'position:absolute;right:20px;top:calc(var(--top-safe) + 8px);min-width:140px;';
  setTimeout(function () { skip.classList.remove('hidden'); }, 2000); pressFX(skip); onTap(skip, function () { finish(); });
  playMusic('title', { vol: 0.95, loop: false, tv: true, restart: true, onEnd: function () { tvOff(); } });
  function finish() { if (ended) return; ended = true; stopMusic(0.3); killScr(lyr); if (skip.parentNode) skip.parentNode.removeChild(skip); RENDER.scene.remove(tag); WORLD.tvMat.map = WORLD.tvTex; WORLD.tvMat.needsUpdate = true; TV.mode = 'show'; liveRT.dispose(); cmT.dispose(); PU.uBlack.value = 1; setTimeout(function () { PU.uBlack.value = 0; CAM.override = null; done && done(); }, 900); }
  function tvOff() { if (off) return; off = true; var t0 = performance.now(); var st = function () { var k = (performance.now() - t0) / 700; var g = cmC.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 384); var hh = Math.max(2, 384 * (1 - k * 1.4)), ww = k > 0.7 ? 512 * (1 - (k - 0.7) * 3) : 512; g.fillStyle = '#fff'; g.fillRect(256 - ww / 2, 192 - hh / 2, ww, hh); cmT.needsUpdate = true; if (k < 1.05) requestAnimationFrame(st); else { sfx('zap', null, { vol: 0.4 }); setTimeout(finish, 600); } }; sfx('static', null, { len: 0.3 }); requestAnimationFrame(st); }
  var step = function () {
    if (ended) return; requestAnimationFrame(step);
    var mt = musicTime(); if (mt < 0) mt = (performance.now() - started) / 1000 - 0.5;
    var k = clamp((performance.now() - started) / 7000, 0, 1), e = k * k * (3 - 2 * k);
    CAM.override.pos.copy(p0).lerp(p1, e); CAM.override.target.copy(sc);
    // lyrics
    var cur = -1; for (var i = 0; i < LYRICS.length; i++) if (mt >= LYRICS[i][0]) cur = i;
    if (cur >= 0) { var L = LYRICS[cur], nx = LYRICS[cur + 1] ? LYRICS[cur + 1][0] : (MUSIC.dur || L[0] + 5); var f = clamp((mt - L[0]) / Math.max(0.5, nx - L[0] - 0.3), 0, 1);
      var te = lyr.querySelector('.t'); if (te.textContent !== L[1]) { te.textContent = L[1]; lyr.querySelector('b').textContent = L[1]; lyr.querySelector('.j').textContent = L[2]; }
      lyr.querySelector('.e').style.setProperty('--w', (f * 100).toFixed(1) + '%'); }
    if (off) return;
    // the TV picture
    if (mt >= LYRIC_LAST_CUT && mt < LYRIC_LAST_CUT + 1.8) {
      if (!cut) { cut = true; sfx('static', null, { len: 0.2 }); }
      var rr = RENDER.renderer; var envS = RENDER.scene.environment; WORLD.tvScreen.visible = false; rr.setRenderTarget(liveRT); rr.render(RENDER.scene, liveCam); rr.setRenderTarget(null); WORLD.tvScreen.visible = true;
      WORLD.tvMat.map = liveRT.texture; WORLD.tvMat.needsUpdate = true; return;
    }
    if (cut && mt >= LYRIC_LAST_CUT + 1.8) { tvOff(); return; }
    WORLD.tvMat.map = cmT;
    drawCM(cmC.getContext('2d'), 512, 384, mt, faces); cmT.needsUpdate = true;
  };
  step();
}
function drawCM(g, w, h, t, faces) {
  var scene = Math.floor(t / 4.2) % 5;
  var gr = g.createLinearGradient(0, 0, 0, h);
  if (scene === 0) { // exterior, daytime
    gr.addColorStop(0, '#9ad8f0'); gr.addColorStop(1, '#f6e0a8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8c890'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = '#d8dde2'; g.fillRect(w * 0.15, h * 0.45, w * 0.7, h * 0.25); g.fillStyle = '#c8282e'; g.fillRect(w * 0.15, h * 0.52, w * 0.7, h * 0.03);
    g.fillStyle = '#5be8ff'; for (var i = 0; i < 6; i++) g.fillRect(w * 0.18 + i * w * 0.11, h * 0.57, w * 0.08, h * 0.08);
    g.fillStyle = '#c8282e'; g.font = '44px ' + F.logo; g.textAlign = 'center'; g.fillText('Sunny Side', w / 2, h * 0.38);
    drawSunny(g, w * 0.86, h * 0.34, 40, { wave: Math.sin(t * 6) });
  } else if (scene === 1 || scene === 3) { // bright interior, smiling customers (the ones you met)
    gr.addColorStop(0, '#fff2cf'); gr.addColorStop(1, '#f0c890'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (var y = 0; y < 2; y++) for (var x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#222' : '#eee'; g.fillRect(x * w / 8, h * 0.85 + y * h * 0.075, w / 8, h * 0.075); }
    g.fillStyle = '#c8282e'; g.fillRect(0, h * 0.6, w, h * 0.25); g.fillStyle = '#d8dde2'; g.fillRect(0, h * 0.58, w, h * 0.03);
    var off = scene === 1 ? 0 : 4;
    for (var k = 0; k < 4; k++) { var fc = faces[(k + off) % faces.length], cx = w * (0.14 + k * 0.24), cy = h * 0.42 + Math.sin(t * 3 + k) * 3; g.save(); g.beginPath(); g.ellipse(cx, cy, 42, 52, 0, 0, TAU); g.clip(); g.drawImage(fc, 128 - 52, 128 - 70, 104, 140, cx - 46, cy - 58, 92, 124); g.restore(); g.fillStyle = ['#8c1f1f', '#e98aa9', '#4a4e5a', '#8fd3c1'][k]; g.fillRect(cx - 40, cy + 50, 80, 60); }
    drawSunny(g, w * 0.5, h * 0.2, 26, { wave: Math.sin(t * 7) });
  } else if (scene === 2) { // Sunny big
    gr.addColorStop(0, '#ffe7a0'); gr.addColorStop(1, '#f2a24e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2); g.rotate(t * 0.4); for (var r = 0; r < 14; r++) { g.fillStyle = r % 2 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 400, r / 14 * TAU, (r + 0.5) / 14 * TAU); g.fill(); } g.restore();
    drawSunny(g, w / 2, h * 0.5 + Math.sin(t * 5) * 6, 80, { wave: Math.sin(t * 8) });
    g.fillStyle = '#c8282e'; g.font = '40px ' + F.logo; g.textAlign = 'center'; g.fillText('Rise and shine!', w / 2, h * 0.14);
  } else { // pancakes & coffee + logo card
    g.fillStyle = '#8fd3c1'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fbf3e0'; g.beginPath(); g.ellipse(w * 0.36, h * 0.66, 120, 34, 0, 0, TAU); g.fill();
    for (var p = 0; p < 4; p++) { g.fillStyle = '#c98a3c'; g.beginPath(); g.ellipse(w * 0.36, h * 0.6 - p * 18, 90, 22, 0, 0, TAU); g.fill(); g.fillStyle = '#e8b870'; g.fillRect(w * 0.36 - 90, h * 0.6 - p * 18, 180, 8); }
    g.fillStyle = '#ffe9a0'; g.fillRect(w * 0.33, h * 0.44, 24, 12);
    g.fillStyle = '#fff'; g.fillRect(w * 0.68, h * 0.5, 70, 70); g.fillStyle = '#3a1a08'; g.fillRect(w * 0.68 + 6, h * 0.5 + 6, 58, 12);
    g.fillStyle = '#c8282e'; g.font = '46px ' + F.logo; g.textAlign = 'center'; g.fillText('Sunny Side Diner', w / 2, h * 0.2); g.font = '20px ' + F.slab; g.fillStyle = '#7e1418'; g.fillText('OPEN 24 HOURS', w / 2, h * 0.3);
  }
  // old film / CRT treatment
  g.fillStyle = 'rgba(0,0,0,0.16)'; for (var s = 0; s < h; s += 3) g.fillRect(0, s, w, 1);
  if (Math.random() < 0.08) { var yy = Math.random() * h; g.drawImage(g.canvas, 0, yy, w, 20, 8, yy, w, 20); }
  var vg = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,10,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
// ---- init ------------------------------------------------------------------------------------------------
function initGame() {
  buildUI(); buildPapers(); buildRail(); buildMiniUI();
  var st = document.createElement('style'); st.textContent = MAP_CSS + '\n' + SCR_CSS; (document.head || document.documentElement).appendChild(st);
  buildHotspots(); initMove(); initVoices(); preloadFaces();
  onTap(U.pause, function () { sfx('click'); pauseGame(); });
  onTap(U.rulesBtn, function () { sfx('click'); if (GAME.mode === 'play') showRules(); });
  onTap(U.mapBtn, function () { sfx('click'); if (GAME.mode === 'play') toggleMap(); });
  onFrame(updateGame);
  onFrame(function (dt) { drawCMFrame(dt); if (GAME.mode === 'title' && CAM.override && !SCR.warn) { CAM.titleDrift = (CAM.titleDrift || 0) + dt; CAM.override.pos.set(-4.6 + Math.sin(CAM.titleDrift * 0.07) * 1.2, 1.35, 16.5 - Math.sin(CAM.titleDrift * 0.05) * 1.5); } });
  CAM.override = { pos: new THREE.Vector3(-4.6, 1.35, 16.5), target: new THREE.Vector3(-1.2, 2.3, 4), k: 1, dur: 1 };
  FX.rainT = 1;
  if (DEV && /[?&]skipwarn/.test(location.search)) { audioUnlock(); showTitle(); } else showWarning();
}
