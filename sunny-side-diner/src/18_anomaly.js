// ---- rules, fake rules, anomalies, jumpscare ------------------------------------------
var RULES = [
  { id: 'faceless', day: 1, en: "If a guest has no face you can see, do NOT take their order. Don't look at them. Say \"We're closed.\"", ja: '顔の見えないお客さんの注文は聞かないこと。目を合わせず「We\'re closed.（閉店です）」と言うこと。', ul: 'do NOT take their order', red: 'Eyes on the floor!', redJa: '目線は床！' },
  { id: 'offmenu', day: 1, en: 'If someone orders something that is not on the menu, do not serve it.', ja: 'メニューにない料理を頼まれたら、出さないこと。', red: 'Tear the ticket if you wrote it.', redJa: '書いてしまったら伝票を破る' },
  { id: 'phone', day: 1, en: 'The pink phone may ring. Do not answer the first or second time. The third time is fine.', ja: 'ピンクの電話が鳴っても、1回目と2回目は出ないこと。3回目なら出てよい。', ul: 'first or second time' },
  { id: 'sunny', day: 1, en: 'If Sunny calls your name, do not answer.', ja: 'Sunny があなたの名前を呼んでも、返事をしないこと。', red: 'Not even "yes?"', redJa: '「はい？」もダメ' },
  { id: 'booth4', day: 2, en: 'Around 3 AM an order may come in from Booth 4. Nobody is in Booth 4. Tear the ticket up and throw it away.', ja: '午前3時ごろ、4番席から注文が入っても、4番には誰もいない。注文票は破って捨てること。', ul: 'Nobody is in Booth 4' },
  { id: 'jukebox', day: 2, en: 'If the jukebox changes the song by itself, put the original song back on.', ja: 'ジュークボックスが勝手に曲を変えたら、元の曲に戻すこと。', red: 'Remember what was playing.', redJa: '何がかかっていたか覚えておく' },
  { id: 'reflection', day: 3, en: 'If a guest\'s reflection in the window does not match the guest, hide in the walk-in freezer and count to ten.', ja: '窓に映った姿と、店の中の姿がちがうお客さんがいたら、冷凍庫に隠れて10数えること。', red: 'Check the windows from the booths.', redJa: 'ボックス席から窓を見る' },
  { id: 'doppel', day: 3, en: 'If the same guest comes in twice, give the second one nothing. Nothing at all.', ja: '同じお客さんが2回来たら、2回目のほうには何も出さないこと。', red: 'Look close. They get things backwards.', redJa: 'よく見て。左右があべこべ' },
  { id: 'headlights', day: 4, en: 'If a car parks with its high beams on and nobody gets out, turn off the lights and the neon. Pretend we are closed until it leaves.', ja: 'ハイビームのまま誰も降りない車が停まったら、照明とネオンを消して、閉店のふりをすること。車が去るまで。', ul: 'until it leaves' },
  { id: 'backdoor', day: 5, en: 'I never use the back door. After midnight, do not open it for anyone.', ja: '店長は裏口を使わない。0時を過ぎたら、誰が来ても裏口を開けないこと。' },
  { id: 'dayshift', day: 5, en: 'The day shift comes to the FRONT door at dawn. Let them in only if they say "Rise and shine." If they say your name, hide in the freezer.', ja: '日勤は夜明けに正面のドアから来る。「Rise and shine」と言ったら開けること。あなたの名前を言ったら、冷凍庫に隠れること。', ul: '"Rise and shine."' }
];
var FAKES = [
  { against: 'phone', en: 'Answer the pink phone on the FIRST ring. It\'s me checking in.', ja: 'ピンクの電話は1回目で出ること。わたしからの確認の電話だ。' },
  { against: 'faceless', en: 'Guests without faces are regulars. Pour them coffee and smile.', ja: '顔のないお客さんは常連だ。コーヒーを出して、笑顔で。' },
  { against: 'sunny', en: 'If Sunny calls your name, answer politely. Sunny gets lonely.', ja: 'Sunny に名前を呼ばれたら、ていねいに返事をすること。Sunny はさびしがりだ。' },
  { against: 'booth4', en: 'Orders from Booth 4 at 3 AM are real. Serve them quickly.', ja: '午前3時の4番席の注文は本物だ。すぐに出すこと。' },
  { against: 'reflection', en: 'Never go into the walk-in freezer at night. Ever.', ja: '夜は絶対にウォークイン冷凍庫に入らないこと。' },
  { against: 'jukebox', en: 'Do not touch the jukebox after midnight. Let it play.', ja: '0時を過ぎたらジュークボックスにさわらないこと。好きにさせておけ。' },
  { against: 'backdoor', en: 'If I knock on the back door, let me in. I always forget my keys.', ja: 'わたしが裏口をノックしたら入れてくれ。いつも鍵を忘れるんだ。' },
  { against: 'headlights', en: 'If a car sits outside with its lights on, wave so they know we\'re open.', ja: 'ライトをつけた車が外にいたら、営業中だとわかるよう手を振ること。' }
];
var DAY_ANOM = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7 };
var DAY_FAKES = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 2 };
function rulesForDay(day) { return RULES.filter(function (r) { return r.day <= day; }); }
function rulesDocList(day, fakes) {
  var list = rulesForDay(day).map(function (r, i) { return { n: i + 1, en: r.en, ja: r.ja, red: r.red, redJa: r.redJa, ul: r.ul, id: r.id }; });
  (fakes || []).forEach(function (f, i) { list.push({ n: list.length + 1, en: f.en, ja: f.ja, fake: true, sig: i % 2 ? '' : '— D' }); });
  return list;
}
// ---- face allocation: new pictures each night, never repeated within a shift ----------
var FACE_POOLS = null;
function facePools() {
  if (FACE_POOLS) return FACE_POOLS; FACE_POOLS = {};
  for (var n = 1; n <= 60; n++) { var k = FACE_KIND[n] || 'human'; (FACE_POOLS[k] = FACE_POOLS[k] || []).push(n); }
  return FACE_POOLS;
}
function pickFace(kinds, tag) {
  var pools = facePools(), day = (typeof GAME !== 'undefined' && GAME.day) || 1, used = (typeof GAME !== 'undefined' && GAME.usedFaces) || {};
  var cand = [];
  kinds.forEach(function (k) { (pools[k] || []).forEach(function (n, i) { if (!used[n]) cand.push({ n: n, pref: (i % 5) === (day - 1) % 5 ? 0 : ((SAVE.faces && SAVE.faces[n]) ? 2 : 1) }); }); });
  if (!cand.length) kinds.forEach(function (k) { (pools[k] || []).forEach(function (n) { cand.push({ n: n, pref: 3 }); }); });
  if (!cand.length) return 1 + Math.floor(Math.random() * 60);
  cand.sort(function (a, b) { return a.pref - b.pref || Math.random() - 0.5; });
  var best = cand.filter(function (c) { return c.pref === cand[0].pref; }), pick = best[Math.floor(Math.random() * best.length)].n;
  if (typeof GAME !== 'undefined' && GAME.usedFaces) GAME.usedFaces[pick] = 1;
  try { SAVE.faces = SAVE.faces || {}; SAVE.faces[pick] = 1; } catch (e) {}
  return pick;
}
function preloadFaces(cb) {
  var left = 60, fin = function () { if (--left === 0 && cb) cb(); };
  for (var n = 1; n <= 60; n++) (function (n) {
    var im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
    im.onload = fin; im.onerror = function () { BOOT_ERRORS.push('face ' + n); FACE_IMG[n] = null; fin(); };
    im.src = assetURL('images/face_' + (n < 10 ? '0' : '') + n + '.jpg'); FACE_IMG[n] = im;
  })(n);
  setTimeout(function () { if (left > 0) { left = 1; fin(); } }, 15000);
}
var FACE_TEX = {};
function faceTexture(n) {
  if (FACE_TEX[n]) return FACE_TEX[n];
  var im = FACE_IMG[n], c = mkCanvas(512, 426), g = c.getContext('2d');
  if (im && im.naturalWidth) g.drawImage(im, 0, 0, 512, 426); else drawProcFace(g, 426, n);
  var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; FACE_TEX[n] = t; return t;
}
// ---- the anomaly framework ---------------------------------------------------------------
var ACTIVE = []; // running anomalies
function anomalyOnset(A, opt) {
  opt = opt || {};
  A.onsetAt = GAME.min; GAME.anomalyNow = A;
  if (!A.bg && !A.counted) { A.counted = true; GAME.inAnomaly = (GAME.inAnomaly || 0) + 1; }
  if (!opt.keepMusic) jukeStop(0.05, 0.6);
  if (!opt.noZap) { LSTATE.neonOn = false; sfx('zap', new THREE.Vector3(1.5, 2.5, -2.6)); setTimeout(function () { LSTATE.neonOn = !GAME.neonOff; }, 900); LSTATE.flick = 1.2; }
  LSTATE.coldT = Math.min(1, 0.75 + GAME.day * 0.05);
  playJingle();
  SAVE.anomalies[A.id] = Math.max(SAVE.anomalies[A.id] || 0, 1); writeSave();
}
function playJingle() { if (!AUDIO.ok) return; whenSong('jingle', function () { var c = AUDIO.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = AUDIO.buf.jingle; g.gain.value = 0.95; s.connect(g); g.connect(AUDIO.music); s.start(); GAME.jingleUntil = performance.now() + AUDIO.buf.jingle.duration * 1000; }); }
function anomalyResolve(A, msg) {
  if (A.done) return; A.done = true; A.ok = true;
  var i = ACTIVE.indexOf(A); if (i >= 0) ACTIVE.splice(i, 1);
  if (A.cleanup) A.cleanup();
  if (A.def && A.def.cleanup) try { A.def.cleanup(A); } catch (e) {}
  if (A.counted) { A.counted = false; GAME.inAnomaly = Math.max(0, (GAME.inAnomaly || 1) - 1); } GAME.resolved++;
  SAVE.anomalies[A.id] = 2; writeSave();
  if (!GAME.inAnomaly) {
    LSTATE.coldT = 0.25 + GAME.day * 0.04;
    setTimeout(function () { if (GAME.mode === 'play' && !GAME.inAnomaly && !JUKE.key && !GAME.blackout) jukePlay('warped', { label: 'B3 Last Call' }); }, 7000);
  }
  if (msg !== false) toast('...it\'s gone.', '……いなくなった。', 2.2);
  afterCalm(A);
  sfx('heart', null, { n: 2, gap: 0.9, vol: 0.5 });
}
function anomalyFail(A, faceN, opt) {
  if (A && A.done) return; if (A) { A.done = true; var i = ACTIVE.indexOf(A); if (i >= 0) ACTIVE.splice(i, 1); }
  GAME.failRule = A ? A.id : (opt && opt.rule) || '';
  jumpscare(faceN, opt || {});
}
function makeAnomaly(id, at) { var def = ANOM[id]; var A = { id: id, at: at, t: 0, def: def }; return A; }
function startAnomaly(A) { ACTIVE.push(A); A.def.start(A); }
function updateAnomalies(dt) { for (var i = ACTIVE.length - 1; i >= 0; i--) { var A = ACTIVE[i]; A.t += dt; if (A.def.update) A.def.update(A, dt); } }
function anomalyHint(id) { return (ANOM[id] && ANOM[id].hint) || ['Just follow the rules, kid.', 'ルールどおりにやるんだ。']; }
// anomaly customer helper
function oddCustomer(A, archIdx, opt) {
  opt = opt || {}; var arch = ARCH[archIdx != null ? archIdx : Math.floor(Math.random() * ARCH.length)];
  var C = spawnCustomer(arch, { anomaly: A, mirror: opt.mirror, seed: opt.seed, silentEntry: opt.silentEntry });
  C.P.odd = opt.oddness == null ? 0.6 : opt.oddness; C.oddVoice = true;
  A.cust = C; C.anomaly = A;
  return C;
}
function lungeFail(A, C) { anomalyFail(A, A.face, { person: C.P }); }
var ANOM = {
  // R1 — faceless guest at the door
  faceless: {
    hint: ['No face? Then you never saw \'em. Eyes down. "We\'re closed."', '顔がない？ なら見なかったことにしろ。目を伏せて「閉店です」だ。'],
    start: function (A) {
      var veil = Math.random() < 0.4;
      A.face = veil ? 7 : pickFace(['human'], 'faceless');
      var arch = ARCH[Math.floor(Math.random() * ARCH.length)], o = {}; for (var k in arch.o) o[k] = arch.o[k];
      o.faceless = !veil; o.veil = veil; if (veil) { o.sex = 'f'; o.topC = '#efeae0'; o.hair = 'long'; o.hairC = HAIRC[0]; o.hat = null; }
      var fake = { id: 'odd', name: veil ? 'THE BRIDE' : '???', voice: 'odd', o: o, likes: ['coffee'] };
      var C = spawnCustomer(fake, { anomaly: A }); C.P.odd = 0.6; A.cust = C; C.oddVoice = true; C.anomaly = A;
      attachHorror(C.P, A.face);
      anomalyOnset(A);
      A.mute = true; A.hideMarker = false;
      setTimeout(function () { if (!A.done) sfx('breath', new THREE.Vector3(5.6, 1.6, 3.9), { len: 3 }); }, 4000);
    },
    update: function (A, dt) { var C = A.cust; if (!C) return; C.P.lookAtCam = true; if (A.t > 150 && !A.done) lungeFail(A, C); if (Math.random() < dt * 0.15) sfx('breath', C.P.root.position, { len: 2.5, vol: 0.7 }); },
    onTap: null,
    cleanup: function (A) { }
  },
  // R2 — ordering something that is not on the menu
  offmenu: {
    hint: ['If it ain\'t on the menu, it don\'t leave the kitchen. Tear it up.', 'メニューにないものは出すな。伝票は破れ。'],
    start: function (A) {
      A.face = pickFace(['human'], 'offmenu');
      var C = oddCustomer(A, null, { oddness: 0.35 }); attachHorror(C.P, A.face);
      A.odd = ODD_ITEMS[Math.floor(Math.random() * ODD_ITEMS.length)];
      C.forcedItems = [{ id: 'coffee', done: false, q: 0 }, { odd: A.odd, done: false, q: 0 }];
      A.onsetDone = false;
    },
    update: function (A, dt) {
      var C = A.cust; if (!C) return;
      if (!A.onsetDone && (C.state === 'ready')) { A.onsetDone = true; anomalyOnset(A, { noZap: true }); }
      if (C.state === 'ordered' && C.ticket && !C.ticket.onTear) { C.ticket.onTear = function () { anomalyResolve(A); custSay(C, '...', '……', { silent: true }); customerLeave(C); }; }
      if (A.onsetDone && A.t > 260 && !A.done && C.state !== 'gone') { anomalyResolve(A, false); customerLeave(C); }
    }
  },
  // R3 — the pink phone (rings three times in a night)
  phone: {
    hint: ['That phone? Let it ring. Twice. Third time you can pick up.', 'あの電話か？ 2回は鳴らしとけ。3回目なら出ていい。'],
    start: function (A) { A.bg = true; A.ring = 0; A.next = 1; A.face = pickFace(['shadow', 'glitch'], 'phone'); ringSession(A); },
    update: function (A, dt) {
      if (A.ringing) { A.rt -= dt; A.rr -= dt; if (A.rr <= 0) { A.rr = 2.4; sfx('ring', WORLD.phonePos, { distort: (A.ring - 1) * 0.35, vol: 1.1 }); WORLD.handset.position.x = -0.17 + (Math.random() - 0.5) * 0.004; } if (A.rt <= 0) { A.ringing = false; hideCall(); if (A.ring >= 3) anomalyResolve(A, false); else A.wait = 70 + Math.random() * 90; } }
      else if (A.wait != null && !A.done) { A.wait -= dt; if (A.wait <= 0) { A.wait = null; ringSession(A); } }
    },
    answer: function (A) {
      if (!A.ringing) return; A.ringing = false; hideCall(); sfx('handset', WORLD.phonePos);
      if (A.ring < 3) { // wrong
        setTimeout(function () { sfx('whisper', null, { vol: 1 }); say('???', '...' + (SAVE.name || 'friend') + '... come outside...', '……' + (SAVE.name || 'ともだち') + '……そとに おいで……', { voice: 'odd', odd: true, cls: 'odd' }).then(function () { anomalyFail(A, A.face, { rule: 'phone' }); }); }, 500);
      } else { // third time: it's fine — lore + hint
        anomalyResolve(A, false); phoneLineStart();
        talk([['DALE', 'Good. You waited. Listen... the light in the window isn\'t for customers. It\'s so they can find their way back.', 'よし、待てたな。いいか……窓の明かりは客のためじゃない。帰り道がわかるようにだ。', { voice: 'manager' }],
          ['DALE', 'Do the rules. Every one. I\'ll see you at dawn. Maybe.', 'ルールを守れ。全部だ。夜明けに会おう。たぶんな。', { voice: 'manager' }], function () { phoneLineStop(); sfx('handset'); giveLore('phone_' + GAME.day); }]);
      }
    }
  },
  // R4 — Sunny calls your name (REPLY is a trap)
  sunny: {
    hint: ['If the egg calls you by name, you bite your tongue. Count to twenty.', 'あの卵に名前を呼ばれても、口を閉じてろ。20数えろ。'],
    start: function (A) {
      A.face = pickFace(['plush', 'costume', 'clown', 'doll'], 'sunny');
      anomalyOnset(A, { noZap: true });
      LSTATE.eyesExtra = 1.6; setNeonEyes(1, 'red');
      var nm = SAVE.name || 'friend';
      A.phase = 0;
      setTimeout(function () {
        if (A.done) return;
        say('SUNNY', 'Rise and shine, ' + nm + '! Hey! ' + nm + '! Over here!', 'おはよう、' + nm + '！ ねえ！ ' + nm + '！ こっちだよ！', { voice: 'sunny', picoDark: Math.min(1, GAME.day * 0.18), hold: 2 });
        A.trap = { icon: 'reply', en: 'REPLY "Yes?"', ja: '返事をする「はい？」', glow: true, fn: function () { A.replied = true; say('YOU', 'Yes...?', 'はい……？', { voice: 'you', cls: 'you' }).then(function () { setNeonEyes(0, 'red'); say('SUNNY', 'There you are.', 'みーつけた。', { voice: 'sunny', picoDark: 1, rate: 0.7, pitch: 0.6 }).then(function () { anomalyFail(A, A.face, { rule: 'sunny' }); }); }); } };
        A.phase = 1; A.t = 0; updateMainButton();
      }, 2500);
    },
    update: function (A, dt) {
      if (A.phase === 1 && A.t > 9 && !A.replied) { A.phase = 2; A.trap = null; updateMainButton(); say('SUNNY', '...' + (SAVE.name || 'friend') + '? ...Aw. Maybe later!', '……' + (SAVE.name || 'ともだち') + '？ ……ちぇっ。またあとでね！', { voice: 'sunny', picoDark: 0.4 }).then(function () { if (!A.done) { setNeonEyes(0, null); LSTATE.eyesExtra = 1; anomalyResolve(A); } }); }
    },
    cleanup: function (A) { A.trap = null; updateMainButton(); }
  },
  // R5 — 3 AM ticket from booth 4
  booth4: {
    hint: ['Booth four. Three A.M. Tear it up. Don\'t go look.', '4番席、午前3時。破り捨てろ。見に行くな。'],
    start: function (A) {
      A.face = pickFace(['shadow', 'human'], 'booth4');
      anomalyOnset(A, { noZap: true, keepMusic: false });
      sfx('print', new THREE.Vector3(1.4, 1.9, -2.85), { n: 20 }); sfx('pen', new THREE.Vector3(1.4, 1.9, -2.85), { delay: 1.2 });
      var odd = Math.random() < 0.5 ? [{ id: 'coffee', done: false }, { id: 'pie', done: false }] : [{ id: 'eggs', done: false }];
      var T = { no: 3000 + GAME.day, cust: null, items: odd, ready: false, done: false, table: 'BOOTH 4', booth4: true };
      T.onTear = function () { anomalyResolve(A); }; T.onReady = function () { A.cooked = true; };
      TICKETS.push(T); A.ticket = T; refreshTickets();
      toast('A ticket printed by itself: BOOTH 4', 'ひとりでに伝票が出てきた：4番席', 3);
      // the empty booth now accepts "serve" taps
      var bx = D.booths[3]; A.hit = mesh(new THREE.BoxGeometry(1.4, 1.2, 1.6), new THREE.MeshBasicMaterial({ visible: false }), bx, 0.8, 4.2, RENDER.scene, false);
      addPick(A.hit, function () { if (A.done) return; showChoices('Booth 4', [{ icon: 'serve', en: A.ticket.ready ? 'Serve Booth 4' : 'Nobody is here.', ja: A.ticket.ready ? '4番席に料理を出す' : '誰もいない', dim: !A.ticket.ready, fn: function () { removeTicket(A.ticket); A.ticket.done = true; sfx('cup', new THREE.Vector3(bx, 0.8, 4.3)); setTimeout(function () { boothGhost(A); }, 900); } }]); }, { stations: ['BOOTHS', 'COUNTER'] });
    },
    update: function (A, dt) { if (A.t > 150 && !A.done) { toast('BOOTH 4  BOOTH 4  BOOTH 4', '4番 4番 4番', 2); boothGhost(A); } },
    cleanup: function (A) { if (A.hit) { removePick(A.hit); RENDER.scene.remove(A.hit); } }
  },
  // R6 — jukebox changes the song
  jukebox: {
    hint: ['Jukebox acting up? Put on what was playing before. Exactly that.', 'ジュークボックスがおかしい？ 前にかかってた曲に戻せ。そのとおりに。'],
    start: function (A) {
      A.face = pickFace(['glitch', 'shadow'], 'jukebox'); A.orig = JUKE.label || 'A1 Diner Boogie';
      anomalyOnset(A, { noZap: true });
      setTimeout(function () { if (!A.done) { sfx('needle', WORLD.jukeboxPos); jukePlay('reverse', { label: 'B? ????', fade: 0 }); JUKE.label = 'B? ????'; jukeGlass(A.face, true); } }, 11500);
    },
    update: function (A, dt) { if (A.t > 85 && !A.done) { jukeStop(0.1); LSTATE.flick = 2; anomalyFail(A, A.face, { rule: 'jukebox' }); } },
    choose: function (A, label) {
      if (label === A.orig) { sfx('needle', WORLD.jukeboxPos); jukeGlass(0, false); anomalyResolve(A, false); jukePlay(label === 'A1 Diner Boogie' ? 'boogie' : 'warped', { label: label }); toast('The record is back.', '元の曲に戻った。', 2); }
      else { jukeStop(0.1); anomalyFail(A, A.face, { rule: 'jukebox' }); }
    },
    cleanup: function () { jukeGlass(0, false); }
  },
  // R7 — reflection does not match
  reflection: {
    hint: ['Window says different than your eyes? Walk-in. Ten count. Don\'t argue.', '窓に映るのと目で見るのがちがう？ 冷凍庫だ。10数えろ。'],
    start: function (A) {
      A.face = pickFace(['human', 'crawler'], 'reflection');
      var C = spawnCustomer(ARCH[Math.floor(Math.random() * ARCH.length)], { anomaly: A, silentEntry: true });
      A.cust = C; C.anomaly = A; C.P.odd = 0.15;
      var fb = freeSeats('booth').filter(function (x) { return x.booth === 2 || x.booth === 3; }); var seat = fb[Math.floor(Math.random() * fb.length)] || freeSeats('booth')[0] || SEATS.filter(function (s) { return s.kind === 'booth' && s.side < 0; })[0];
      if (seat.taken && seat.taken.anomaly == null) { /* fallback: share */ }
      C.path = []; sitDown(C, seat); C.state = 'reflect'; setPose(C.P, 'drink');
      var cup = makeCup(true); cup.position.copy(seat.eatPos); RENDER.scene.add(cup); A.cup = cup;
      // the reflection: same spot, only the window camera sees it — standing, staring, wrong face
      var R = personFrom(C.arch, C.P.o.seed); R.root.position.copy(C.P.root.position); R.root.position.y = 0; R.root.position.z += 0.35; R.root.rotation.y = PI * 0.75; setPose(R, 'standStare'); R.odd = 1; R.lookAtCam = true; R.eyeStare = true;
      attachHorror(R, A.face); revealHorror(R, 1); RENDER.scene.add(R.root); setLayer(R.root, LAYER_REFL_ONLY); setLayer(C.P.root, LAYER_REAL_ONLY);
      A.refl = R; C.refl = R;
      anomalyOnset(A);
      A.hideMarker = true; C.hideMarker = true;
    },
    update: function (A, dt) {
      if (A.refl) { A.refl.root.position.x = A.cust.P.root.position.x; updatePerson(A.refl, dt, RENDER.camera.position); }
      if (A.t > 110 && !A.done) lungeFail(A, A.cust);
    },
    onFreezerCount: function (A) { if (A.done) return; anomalyResolve(A, false); if (A.cust) { removeCustomer(A.cust); if (A.cust.seat) standUp(A.cust); } A.cust = null; toast('The booth is empty. Only a warm cup.', '席は空っぽ。あたたかいカップだけが残っている。', 3); },
    cleanup: function (A) { if (A.refl) { disposePerson(A.refl); A.refl = null; } if (A.cup) setTimeout(function () { RENDER.scene.remove(A.cup); }, 30000); }
  },
  // R8 — the same guest twice (mirrored)
  doppel: {
    hint: ['Seen \'em already tonight? Then the second one gets nothing. Not a glass of water.', '今夜もう見た顔か？ なら2回目のやつには何も出すな。水一杯もだ。'],
    start: function (A) {
      var orig = CUSTS.filter(function (c) { return !c.anomaly && c.state !== 'leaving' && c.state !== 'gone'; })[0] || GAME.lastCust;
      var arch = orig ? orig.arch : ARCH[Math.floor(Math.random() * ARCH.length)], seed = orig ? orig.P.o.seed : 42;
      A.face = pickFace(['human'], 'doppel');
      var C = spawnCustomer(arch, { anomaly: A, mirror: true, seed: seed }); C.P.odd = 0.2; A.cust = C; C.anomaly = A; C.oddVoice = true;
      attachHorror(C.P, A.face);
      anomalyOnset(A, { noZap: true });
      if (!orig) toast('You\'ve served this one before tonight...', 'このお客さん、今夜もう来たような……', 3);
    },
    update: function (A, dt) { var C = A.cust; if (!C || A.done) return; if (C.state === 'wait') C.P.lookAtCam = true; if (A.t > 75 && C.state === 'wait') { anomalyResolve(A); customerLeave(C); } }
  },
  // R9 — high beams in the lot
  headlights: {
    hint: ['High beams, nobody gets out? Lights off, neon off. We\'re closed till they leave.', 'ハイビームで誰も降りない？ 照明もネオンも消せ。いなくなるまで閉店だ。'],
    start: function (A) {
      A.face = pickFace(['shadow', 'crawler'], 'headlights');
      visitorArrive({ x: 1.0, z: 9, high: true, color: 0x1a1a1a, onPark: function () { A.parked = true; A.t = 0; anomalyOnset(A, { noZap: true }); toast('A car with high beams. Nobody gets out.', 'ハイビームの車。誰も降りてこない。', 3); } });
    },
    update: function (A, dt) {
      if (!A.parked || A.done) return;
      var dark = !LSTATE.lightsOn && !LSTATE.neonOn;
      if (dark) { A.dark = (A.dark || 0) + dt; if (A.dark > 14 && !A.leaving) { A.leaving = true; visitorLeave(); setTimeout(function () { anomalyResolve(A); }, 7000); } }
      else if (A.leaving) { visitorLeave(); anomalyFail(A, A.face, { rule: 'headlights' }); }
      else if (A.t > 40) anomalyFail(A, A.face, { rule: 'headlights' });
    },
    cleanup: function () { }
  },
  // R10 — knocking at the back door
  backdoor: {
    hint: ['I don\'t use the back door. Whoever\'s knocking, it ain\'t me.', 'おれは裏口なんか使わない。ノックしてるのが誰だろうと、おれじゃない。'],
    start: function (A) { A.face = pickFace(['animal'], 'backdoor'); anomalyOnset(A, { noZap: true }); A.k = 0; A.next = 1; },
    update: function (A, dt) {
      A.next -= dt; if (A.next <= 0 && A.t < 34) { A.next = 4 + Math.random() * 3; A.k++; sfx('knock', new THREE.Vector3(-2.6, 1.2, -5.25), { n: 3 + (A.k % 2), vol: 1.1 });
        if (A.k === 2) say('DALE?', 'Hey, kid. It\'s Dale. Forgot my keys. Open up.', 'おい、おれだ。デールだ。鍵を忘れた。開けてくれ。', { voice: 'manager', odd: true, cls: 'mgr' });
        if (A.k === 5) say('DALE?', 'Open the door. Open the door. Open the door.', 'あけろ。あけろ。あけろ。', { voice: 'odd', odd: true, cls: 'odd' }); }
      if (A.t > 36 && !A.done) anomalyResolve(A);
    },
    open: function (A) { sfx('door', new THREE.Vector3(-2.6, 1.2, -5.2)); WORLD.backDoor.rotation.y = -1.2; anomalyFail(A, A.face, { rule: 'backdoor' }); }
  },
  // R11 — the day shift at dawn (day 5 only)
  dayshift: {
    hint: ['At dawn, listen. Rise and shine means it\'s June. Your name means it isn\'t.', '夜明けは耳をすませ。Rise and shine ならジューンだ。名前を呼ぶなら、ちがう。'],
    start: function (A) {
      A.face = pickFace(['child'], 'dayshift'); A.stage = 0; anomalyOnset(A, { noZap: true });
      A.fakeFirst = true; knockFront(A, true);
    },
    update: function (A, dt) {
      if (A.stage === 1 && A.fakeT != null) { A.fakeT -= dt; if (A.fakeT <= 0 && !CAM.inFreezer) { A.fakeT = null; anomalyFail(A, A.face, { rule: 'dayshift' }); } }
      if (A.stage === 2 && A.t > 70 && !A.done) { say('JUNE', 'Hon? You in there? I\'ll... come back.', 'あんた？ いるのかい？ ……また来るよ。', { voice: 'june' }); A.stage = 3; GAME.missedJune = true; anomalyResolve(A, false); }
    },
    openFront: function (A) {
      if (A.stage === 1) { anomalyFail(A, A.face, { rule: 'dayshift' }); return; }
      if (A.stage === 2) { A.stage = 4; anomalyResolve(A, false); GAME.juneIn = true; }
    },
    onFreezerCount: function (A) { if (A.stage === 1) { A.stage = 1.5; A.fakeT = null; toast('The knocking stopped.', 'ノックがやんだ。', 2.5); setTimeout(function () { A.stage = 2; A.t = 0; knockFront(A, false); }, 9000); } }
  }
};
function knockFront(A, fake) {
  var nm = SAVE.name || 'friend';
  sfx('knock', new THREE.Vector3(6, 1.2, 5.3), { n: 3, vol: 1 });
  setTimeout(function () {
    if (fake) { A.stage = 1; A.fakeT = 30; say('???', nm + '? ' + nm + ', it\'s me. Let me in, ' + nm + '.', nm + '？ ' + nm + '、わたしだよ。いれて、' + nm + '。', { voice: 'june', odd: true, cls: 'odd' }); }
    else { A.stage = 2; A.t = 0; say('JUNE', 'Rise and shine! Day shift, hon. Unlock the door.', 'おはよう（Rise and shine）！ 日勤だよ。鍵をあけておくれ。', { voice: 'june' }); }
  }, 1200);
}
function ringSession(A) { A.ring++; A.ringing = true; A.rt = 14; A.rr = 0; setTimeout(function () { phonePrompt(A, A.ring); }, 1400); if (A.ring === 1) anomalyOnset(A, { noZap: true, keepMusic: true }); toast(A.ring === 1 ? 'The pink phone is ringing.' : (A.ring === 2 ? 'The pink phone again. (2nd time)' : 'The pink phone. (3rd time)'), A.ring === 1 ? 'ピンクの電話が鳴っている。' : (A.ring === 2 ? 'また鳴っている（2回目）' : 'また鳴っている（3回目）'), 2.6); }
// wherever you are, the ringing phone asks you: pick up, or let it ring
function phonePrompt(A, ring) {
  if (!A.ringing || A.ring !== ring || A.done || GAME.mode !== 'play') return;
  // (shown during cooking too — picking up means leaving the griddle)
  if (DOC.open || CAM.inFreezer || CAM.outside || JS.on || PAUSE.el) { setTimeout(function () { phonePrompt(A, ring); }, 1200); return; }
  var nth = ['', '1st ring', '2nd time', '3rd time'][Math.min(3, ring)], nthJa = ['', '1回目', '2回目', '3回目'][Math.min(3, ring)];
  showCall('The pink phone — ' + nth, 'ピンクの電話が鳴っている（' + nthJa + '）', function () {
    if (!A.ringing) { toast('It stopped ringing.', '電話は鳴りやんだ。', 1.6); return; }
    var answer = function () { if (A.ringing) ANOM.phone.answer(A); };
    if (MINI.active) abortMini('You left the griddle — the food is ruined.', '鉄板から離れたので料理がだめになった');
    if (CAM.station === 'JUKEBOX') answer(); else { CAM.afterArrive = function () { turnToward(WORLD.phonePos); setTimeout(answer, 350); }; goStation('JUKEBOX'); }
  }, function () { toast('You let it ring.', '電話は鳴らしておいた。', 1.4); });
}
function boothGhost(A) {
  if (A.done) return;
  var P = personFrom(ARCH[Math.floor(Math.random() * ARCH.length)]); P.odd = 1; P.lookAtCam = true;
  var s = SEATS.filter(function (x) { return x.booth === 4 && x.side < 0; })[0]; P.root.position.copy(s.pos); P.root.rotation.y = s.face; setPose(P, 'sit'); RENDER.scene.add(P.root);
  attachHorror(P, A.face); A.ghost = P; onFrame(function (dt) { if (A.ghost) updatePerson(A.ghost, dt, RENDER.camera.position); });
  anomalyFail(A, A.face, { person: P });
}
function setNeonEyes(look, mood) { var t = toTex(canvasNeonEyes(look, mood), { clamp: true }); var old = WORLD.neonEyesMat.map; WORLD.neonEyesMat.map = t; WORLD.neonEyesMat.needsUpdate = true; if (old) old.dispose(); }
function jukeGlass(n, on) { // a face shows in the jukebox glass
  if (!WORLD.jukeGlassM) { WORLD.jukeGlassM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); var p = mesh(new THREE.PlaneGeometry(0.5, 0.42), WORLD.jukeGlassM, 0, 1.12, 0.36, WORLD.jukebox, false); p.renderOrder = 7; }
  if (on && n) { WORLD.jukeGlassM.map = toTex(horrorCanvas(n), { clamp: true }); WORLD.jukeGlassM.needsUpdate = true; WORLD.jukeGlassM.opacity = 0.55; } else WORLD.jukeGlassM.opacity = 0;
}
// ---- jumpscare ----------------------------------------------------------------------------
var JS = { on: false };
function jumpscare(n, opt) {
  if (JS.on || GAME.mode === 'dead') return;
  opt = opt || {}; JS = { on: true, t: 0, n: n || 1, P: opt.person || null, mild: SAVE.settings.scare === 'MILD' };
  GAME.mode = 'dead'; GAME.deathAt = GAME.min;
  stopVoice(); talkCancel(); hideChoices(); hideCall(); closeDocs(true); if (MINI.active) { MINI.active = false; U.mini.classList.add('hide'); U.chips.innerHTML = ''; } setMain2(null); stackCooking();
  jukeStop(0.05); stopMusic(0.05);
  setMain(null); setGameHUD(false);
  LSTATE.flick = 3; LSTATE.coldT = 1;
  PU.tFace.value = faceTexture(JS.n);
  var im = FACE_IMG[JS.n]; PU.uFaceAsp.value.set(im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1.2, 1);
  if (JS.P) {
    if (!JS.P.horror) attachHorror(JS.P, JS.n); JS.P.lookAtCam = true; JS.P.odd = 1; setLayer(JS.P.root, 0); JS.P.root.traverse(function (m) { m.layers.enable(LAYER_REAL_ONLY); });
    // snap the view onto them so the 3D face and the picture are the same face
    var hp = new THREE.Vector3(); JS.P.parts.head.getWorldPosition(hp);
    var cp = RENDER.camera.position.clone(); CAM.override = { pos: cp, target: hp.clone(), k: 0, dur: 0.18 }; JS.track = hp;
  }
  sfx('stinger', null, { vol: JS.mild ? 0.5 : 1 });
  // skip button (after ~1s)
  JS.skip = el('button', 'mb pe skipbtn hidden', icon('skip', 30) + '<span class="tx"><span class="en">SKIP</span><span class="ja">スキップ</span></span>', UI);
  JS.skip.style.cssText = 'position:absolute;right:20px;bottom:calc(env(safe-area-inset-bottom,0px) + 24px);min-width:150px;';
  pressFX(JS.skip); onTap(JS.skip, function () { endJumpscare(); });
  setTimeout(function () { if (JS.skip) JS.skip.classList.remove('hidden'); }, 1000);
  SAVE.deaths = (SAVE.deaths || 0) + 1; writeSave();
}
function updateJumpscare(dt) {
  if (!JS.on) return; if (JS.freeze != null) { JS.t = JS.freeze; dt = 0.016; } else JS.t += dt; var t = JS.t, mild = JS.mild;
  if (JS.P) {
    revealHorror(JS.P, Math.min(1, t / 0.25));
    if (t < 0.6) { // lunge: the head stops ~0.55m from the lens, level with it (the body never crosses the camera)
      var cam = RENDER.camera.position, hp = new THREE.Vector3(); JS.P.parts.head.getWorldPosition(hp);
      var away = hp.clone().sub(cam); away.y = 0; if (away.lengthSq() < 1e-4) away.set(0, 0, 1); away.normalize();
      var goal = cam.clone().add(away.multiplyScalar(0.55)); goal.y = cam.y - 0.02;
      JS.P.root.position.add(goal.sub(hp).multiplyScalar(Math.min(1, dt * 9)));
      setPose(JS.P, 'lunge'); JS.P.parts.head.lookAt(cam);
    }
    if (CAM.override && JS.track) { JS.P.parts.head.getWorldPosition(JS.track); CAM.override.target.copy(JS.track); }
  }
  if (t > (JS.P ? 0.42 : 0.15) && !JS.hit) { JS.hit = true; sfx('scream', null, { vol: 1 }); CAM.shake = mild ? 0.6 : 1.6; PU.uFlash.value = mild ? 0.15 : 0.5; }
  if (JS.hit) {
    var k = t - (JS.P ? 0.42 : 0.15);
    PU.uFace.value = Math.min(1, k * 8); PU.uFaceZoom.value = mild ? 1.05 + k * 0.08 : 1.15 + k * 0.35 + Math.sin(k * 40) * 0.02;
    PU.uFaceShake.value.set((Math.random() - 0.5) * (mild ? 0.005 : 0.03), (Math.random() - 0.5) * (mild ? 0.005 : 0.03));
    PU.uGlitch.value = mild ? 0.2 : 0.5 + Math.random() * 0.5; PU.uInvert.value = !mild && Math.random() < 0.06 ? 1 : 0;
    PU.uFlash.value = damp(PU.uFlash.value, 0, 6, dt); PU.uRed.value = 0.3;
    if (k > (mild ? 1.6 : 2.4)) endJumpscare();
  }
}
function endJumpscare() {
  if (!JS.on || JS.ending) return; JS.ending = true;
  PU.uBlack.value = 1;
  setTimeout(function () {
    PU.uFace.value = 0; PU.uGlitch.value = 0; PU.uInvert.value = 0; PU.uRed.value = 0; PU.uFlash.value = 0; PU.uFaceShake.value.set(0, 0);
    if (JS.skip && JS.skip.parentNode) JS.skip.parentNode.removeChild(JS.skip);
    JS.on = false;
    gameOver();
  }, 250);
}
