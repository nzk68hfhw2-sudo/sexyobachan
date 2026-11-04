// ---- the kitchen at night: Sunny's radio show, cooking-only anomalies ---------------------
// New rules (inserted next to the other rules of the same night)
(function addKitchenRules() {
  var add = [
    { id: 'passwin', day: 1, en: 'While you cook, keep your eyes on the griddle. If something taps on the glass above you, do NOT look up.', ja: '料理中は鉄板から目を離さないこと。上のガラスを何かが叩いても、顔を上げないこと。', ul: 'do NOT look up', red: 'Finish the dish. Then it\'s gone.', redJa: '料理を仕上げれば、いなくなる' },
    { id: 'badfood', day: 2, en: 'If the food comes out wrong — an eye, a face, meat that moves — throw it in the trash. Never serve it.', ja: '料理がおかしくなったら（目玉・顔・動く肉）、ゴミ箱に捨てること。絶対にお客さんに出さないこと。', ul: 'Never serve it.' },
    { id: 'behind', day: 3, en: 'If the kitchen goes dark while you cook, keep cooking. Do not turn around, whatever you hear.', ja: '料理中に厨房が暗くなっても、料理を続けること。何が聞こえても、ふりむかないこと。', ul: 'Do not turn around', red: 'Not even for the face in the steel.', redJa: 'ステンレスに顔が映っても' },
    { id: 'youticket', day: 4, en: 'Every ticket has a table number. If a ticket says YOU, tear it up. Do not cook it.', ja: '伝票には必ず席番号がある。「YOU」と書かれた伝票は破ること。作らないこと。', ul: 'tear it up' },
    { id: 'costume', day: 4, en: 'We do not own a Sunny costume. If you see one in the parking lot, stop looking at it. Every time you look, it comes closer.', ja: 'うちに Sunny の着ぐるみはない。駐車場で見かけたら、見るのをやめること。見るたびに近づいてくる。', ul: 'stop looking at it' }
  ];
  add.forEach(function (r) {
    var at = RULES.length; for (var i = 0; i < RULES.length; i++) if (RULES[i].day > r.day) { at = i; break; }
    RULES.splice(at, 0, r);
  });
  FAKES.push({ against: 'passwin', en: 'If someone taps on the pass window while you cook, look up and smile. It\'s just June.', ja: '料理中にパス窓を誰かが叩いたら、顔を上げてにっこり。ジューンだよ。' });
  FAKES.push({ against: 'badfood', en: 'Never throw food away. Whatever comes off the griddle gets served.', ja: '食べ物は絶対に捨てるな。鉄板から出たものは全部出すこと。' });
})();
var COOK_ANOM = ['passwin', 'badfood', 'behind', 'youticket'];
function ruleDay(id) { var r = RULES.filter(function (x) { return x.id === id; })[0]; return r ? r.day : 9; }
// ---- Sunny on the kitchen radio, like a cooking-show host. Stranger as the night goes on ----
var RADIO = { next: 0, endNext: 0, pos: null };
var RADIO_LINES = {
  start0: [["Good morning, chef! Let's cook it like sunshine!", 'おはよう、シェフ！おひさまみたいに作ろうね！'], ["Rise and shine! What's on the griddle tonight?", 'Rise and shine！ 今夜の鉄板には何がのるのかな？'], ["You're on the air with Sunny! Nice and easy now!", 'サニーの料理番組へようこそ！ ゆっくりでいいよ！'], ['Hiya, {name}! Show the folks at home how it\'s done!', 'やあ、{name}！ おうちのみんなにお手本を見せて！']],
  ok0: [["You're so good at this!", 'じょうずだね！'], ['Ding ding! Order up!', 'チンチン！ できあがり！'], ['Look at that! Pretty as a sunrise!', '見て！ 朝日みたいにきれい！']],
  bad0: [['Oopsie! We all burn one sometimes!', 'あらら！ だれだってこがすよ！'], ["That's okay! Try again, chef!", 'だいじょうぶ！ もういっかい、シェフ！']],
  start1: [['Nice. Nice. Nice. Nice.', 'いいね。いいね。いいね。いいね。'], ['Keep your face down on the griddle. Just cook.', '鉄板から顔を上げないで。作るだけでいいの。'], ['I like watching you cook. I can see you from everywhere.', 'きみが料理するの、見てるの好き。どこからでも見えるんだ。'], ['{name}... is that how you hold a spatula, {name}?', '{name}……それがフライ返しの持ち方なの、{name}？']],
  ok1: [['Good. Good. Good.', 'いいね。いいね。いいね。'], ['Everyone will eat it. Everyone.', 'みんな食べるよ。みんな。'], ['Just like I taught the last one.', '前の子に教えたとおりだね。']],
  bad1: [['You burned it. I saw.', 'こがしたね。見てたよ。'], ['Again. Again. Do it again.', 'もういっかい。もういっかい。']],
  start2: [['Make one more plate. For table four.', 'もう一皿つくって。4番の席の分。'], ["Don't turn around. It's me. It's always me.", 'ふりむかないで。ぼくだよ。いつだって、ぼくだよ。'], ['When the sun comes up, will you still be here? Stay. Stay.', 'おひさまがのぼっても、ここにいてくれる？ いて。いて。'], ['{name}. {name}. I wrote your name on the menu.', '{name}。{name}。きみの名前、メニューに書いたよ。'], ['The griddle is warm. Warm like a hand. Put your hand on it.', '鉄板、あったかいね。手みたいにあったかい。手をのせてみて。'], ['Shh. Somebody is listening. Keep cooking.', 'しーっ。だれかが聞いてる。作りつづけて。'], ['Good morning. Good morning. Good morning. Is it morning yet?', 'おはよう。おはよう。おはよう。もう朝？']],
  ok2: [['Perfect. Just like the last cook.', 'かんぺき。前のコックさんみたい。'], ['Mmm. I can taste it from here.', 'んん。ここまで味がするよ。'], ['Ding. Ding. Ding. Ding.', 'チン。チン。チン。チン。']],
  bad2: [["It's fine. They'll eat anything now.", 'いいの。もう、なんでも食べるから。'], ['Burnt. Like the last one.', 'こげた。前の子みたいに。']]
};
function sunnyOdd() { return GAME.min / SHIFT_LEN + (GAME.day - 1) * 0.3; } // 0 = bright ... 1+ = wrong
function radioStage() { var s = sunnyOdd(); return s < 0.34 ? 0 : s < 0.67 ? 1 : 2; }
function radioSay(kind) {
  if (GAME.mode !== 'play' || TALK.busy || JS.on) return false;
  if (ACTIVE.some(function (A) { return A.mini || A.id === 'sunny'; })) return false;
  var st = radioStage(), pool = RADIO_LINES[kind + st]; if (!pool) return false;
  var used = RADIO.used || (RADIO.used = {}), cand = pool.filter(function (l) { return !used[l[0]]; }); if (!cand.length) { pool.forEach(function (l) { used[l[0]] = 0; }); cand = pool; }
  var L = pickL(cand); used[L[0]] = 1;
  var nm = SAVE.name || 'friend', nmJa = SAVE.name || 'きみ';
  var en = L[0].replace(/\{name\}/g, nm), ja = L[1].replace(/\{name\}/g, nmJa), s = Math.min(1.2, sunnyOdd());
  if (!RADIO.pos) RADIO.pos = new THREE.Vector3(1.9, 1.75, -3.0);
  sfx('static', RADIO.pos, { len: 0.35, vol: 0.35 + s * 0.2 });
  if (st >= 1) { LSTATE.kitchenFlick = true; setTimeout(function () { LSTATE.kitchenFlick = false; }, 500 + st * 500); }
  if (st >= 2) LSTATE.flick = Math.max(LSTATE.flick, 0.5);
  setTimeout(function () {
    if (GAME.mode !== 'play' || TALK.busy || ACTIVE.some(function (A) { return A.mini || A.id === 'sunny'; })) return;
    say('SUNNY', en, ja, { voice: 'sunny', cls: 'sunny', picoDark: Math.min(1, s), rate: 1 - Math.min(0.32, s * 0.28), pitch: 1 - Math.min(0.42, s * 0.36), odd: st >= 2, hold: 0.7, tapSkip: false });
    TALK.busy = false; // the radio never blocks the player
  }, 380);
  return true;
}
// ---- hooks called by the minigames --------------------------------------------------------------
function cookWantsBad(type) {
  if (GAME.mode !== 'play' || GAME.cookArmed !== 'badfood' || GAME.inAnomaly) return false;
  if (['pancake', 'egg', 'burger', 'coffee'].indexOf(type) < 0) return false;
  GAME.cookArmed = null;
  var A = makeAnomaly('badfood', GAME.min); bindAnomaly(A); A.mini = MINI; startAnomaly(A); MINI.badA = A;
  return true;
}
function cookHookStart(M) {
  var now = performance.now() / 1000;
  var id = GAME.cookArmed;
  if (id && id !== 'badfood' && !GAME.inAnomaly && GAME.mode === 'play') {
    GAME.cookArmed = null;
    setTimeout(function () {
      if (MINI !== M || !M.active || GAME.mode !== 'play' || GAME.inAnomaly) { if (!GAME.cookArmed) GAME.cookArmed = id; return; }
      var A = makeAnomaly(id, GAME.min); bindAnomaly(A); A.mini = M; startAnomaly(A);
    }, 900 + Math.random() * 900);
    return;
  }
  if (M.bad) return;
  if (now >= RADIO.next && Math.random() < (RADIO.first ? 0.7 : 1)) { RADIO.first = true; setTimeout(function () { if (MINI === M && M.active && radioSay('start')) RADIO.next = performance.now() / 1000 + 16 + Math.random() * 10; }, 700); }
}
function cookHookEnd(M, q) {
  ACTIVE.slice().forEach(function (A) { if (A.mini === M && A.def.onMiniEnd) A.def.onMiniEnd(A, q); });
  if (q < 0 || M.bad) return;
  var now = performance.now() / 1000;
  if (now >= RADIO.endNext && now >= RADIO.next - 12 && Math.random() < 0.6) { setTimeout(function () { if (radioSay(q > 0.35 ? 'ok' : 'bad')) { RADIO.endNext = performance.now() / 1000 + 14; RADIO.next = Math.max(RADIO.next, performance.now() / 1000 + 10); } }, 1500); }
}
// "plate it" or "throw it away" — the weird dish
function badFoodChoice(M, q) {
  var A = M.badA;
  sfx('heart', null, { n: 2, gap: 0.7, vol: 0.5 });
  showChoices('Something is wrong with this food.', [
    { icon: 'serve', en: 'Plate it anyway', ja: 'そのままお皿にのせる', warn: true, fn: function () { if (A) A.plated = true; M.done && M.done(q, A); } },
    { icon: 'tear', en: 'Throw it in the trash', ja: 'ゴミ箱に捨てる（作り直す）', fn: function () { sfx('bang', new THREE.Vector3(-0.2, 0.5, -4.4), { vol: 0.4 }); if (A) anomalyResolve(A, false); toast('Into the trash. It kept moving for a while.', 'ゴミ箱に捨てた。しばらく、中で動いていた。', 2.8); updateMainButton(); } }
  ], { noCancel: true, table: 'KITCHEN' });
}
function burntFaceCanvas() { // Sunny's face, browned into the pancake
  var c = mkCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(70,35,12,0.85)'; g.strokeStyle = 'rgba(70,35,12,0.85)'; g.lineCap = 'round';
  g.beginPath(); g.ellipse(92, 104, 16, 22, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(164, 104, 16, 22, 0, 0, TAU); g.fill();
  g.lineWidth = 12; g.beginPath(); g.arc(128, 128, 62, 0.15 * PI, 0.85 * PI); g.stroke();
  g.lineWidth = 5; for (var i = 0; i < 9; i++) { var a = 0.2 * PI + i * 0.075 * PI; g.beginPath(); g.moveTo(128 + Math.cos(a) * 54, 128 + Math.sin(a) * 54); g.lineTo(128 + Math.cos(a) * 72, 128 + Math.sin(a) * 72); g.stroke(); }
  return c;
}
// a face sprite that sits in camera space (top edge of the view, or in the steel ahead)
function camSprite(n, opac) {
  var tex = toTex(horrorCanvas(n), { clamp: true });
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x9a9aa2, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
  sp.renderOrder = 9; sp.userData.tex = tex; sp.userData.op = opac || 0.7; RENDER.scene.add(sp); return sp;
}
function camSpriteAt(sp, fwd, up, side) {
  var cam = RENDER.camera, e = cam.matrixWorld.elements;
  var x = new THREE.Vector3(e[0], e[1], e[2]), y = new THREE.Vector3(e[4], e[5], e[6]), z = new THREE.Vector3(-e[8], -e[9], -e[10]);
  sp.position.copy(cam.position).addScaledVector(z, fwd).addScaledVector(y, up).addScaledVector(x, side || 0);
}
// place it by screen position (nx, ny in -1..1) at distance d in front of the lens
function camSpriteNDC(sp, d, nx, ny) { var cam = RENDER.camera, th = Math.tan(cam.fov * PI / 360) * d; camSpriteAt(sp, d, ny * th, nx * th * cam.aspect); }
function camSpriteFree(sp) { if (!sp) return; RENDER.scene.remove(sp); sp.userData.tex.dispose(); sp.material.dispose(); }
// ---- cooking-only anomalies ---------------------------------------------------------------------
ANOM.passwin = {
  hint: ['Something at the glass while you cook? Eyes on the griddle. Finish the plate.', '料理中にガラスに何か？ 鉄板から目を離すな。皿を仕上げろ。'],
  start: function (A) {
    A.face = pickFace(['crawler', 'human', 'glitch'], 'passwin');
    anomalyOnset(A, { noZap: true, keepMusic: true });
    A.spr = camSprite(A.face, 0.85); A.spr.material.color.set(0xb4b4bc); A.slide = 0;
    A.glass = new THREE.Vector3(0.9, 1.75, -4.3);
    sfx('knock', A.glass, { n: 3, vol: 0.45 });
    A.trap = { icon: 'look', en: 'LOOK UP', ja: '顔を上げる', fn: function () { ANOM.passwin.look(A); } };
    updateMainButton();
    setTimeout(function () { if (!A.done && GAME.mode === 'play') { say('???', 'Psst. Up here.', 'ねえ。うえ、みて。', { voice: 'odd', odd: true, cls: 'odd', tapSkip: false, hold: 0.8 }); TALK.busy = false; } }, 1600);
    A.kt = 3.5;
  },
  update: function (A, dt) {
    if (A.done) return;
    if (!A.mini.active) { if (!A.looking) { anomalyResolve(A); } return; }
    A.slide = Math.min(1, A.slide + dt * 0.12);
    if (A.spr && !A.looking) { camSpriteNDC(A.spr, 0.9, -1.0 + A.slide * 0.42, -0.1); A.spr.scale.set(0.22, 0.27, 1); A.spr.material.opacity = damp(A.spr.material.opacity, A.spr.userData.op, 3, dt); }
    A.kt -= dt; if (A.kt <= 0) { A.kt = 2.6 + Math.random() * 2; sfx('knock', A.glass, { n: 2, vol: 0.35 + A.slide * 0.3 }); }
  },
  look: function (A) { // looking up: it is right there
    if (A.done || A.looking) return; A.looking = true; A.trap = null; updateMainButton();
    var cam = RENDER.camera; camSpriteAt(A.spr, 0.6, 0.18, 0); A.spr.scale.set(0.5, 0.6, 1); A.spr.material.opacity = 1;
    CAM.override = { pos: cam.position.clone(), target: A.spr.position.clone(), k: 0, dur: 0.3 };
    setTimeout(function () { anomalyFail(A, A.face, { rule: 'passwin' }); }, 380);
  },
  onMiniEnd: function (A, q) { if (!A.done && !A.looking) anomalyResolve(A, q >= 0 ? undefined : false); },
  cleanup: function (A) { A.trap = null; camSpriteFree(A.spr); A.spr = null; updateMainButton(); }
};
ANOM.badfood = {
  hint: ['Food come out wrong? Trash. Don\'t you dare put it on a plate.', '料理がおかしい？ 捨てろ。皿にのせるなんて考えるな。'],
  start: function (A) { A.face = pickFace(['flesh', 'mouth'], 'badfood'); anomalyOnset(A, { noZap: true, keepMusic: true }); },
  update: function (A, dt) {
    if (A.done) return;
    if (A.plated) { // waits on the pass. serving it is the mistake; if nobody gets it, it's over
      var T = A.ticket; if (!T) { T = TICKETS.filter(function (t) { return t.items.some(function (it) { return it.bad === A; }); })[0]; A.ticket = T; if (T) T.bad = A; }
      if (!T || (TICKETS.indexOf(T) < 0 && !T.served)) anomalyResolve(A, false);
    } else if (!A.mini.active && (A.mini.aborted || (!SLIP.open && A.t > 4 && !A.mini.endPending))) anomalyResolve(A, false);
  },
  onMiniEnd: function (A, q) { if (q < 0) anomalyResolve(A, false); }
};
ANOM.behind = {
  hint: ['Lights die while you cook? Keep cooking. Don\'t turn around. Ever.', '料理中に明かりが消えた？ 作り続けろ。ふりむくな。絶対に。'],
  start: function (A) {
    A.face = pickFace(['shadow', 'crawler', 'human'], 'behind');
    anomalyOnset(A, { noZap: true });
    sfx('zap', new THREE.Vector3(1.0, 2.9, -3.3), { vol: 0.7 });
    LSTATE.kitchenOff = true; LSTATE.powerT = 0.1; A.expoWas = A.mini.expo; A.mini.expo = 0.32; // only the griddle glows
    var F = WORLD.lights.fill; A.fillWas = [F.color.getHex(), F.intensity, F.distance]; F.color.set(0xff7a32); F.position.set(0.9, 1.05, -4.5); F.intensity = 1.8; F.distance = 3.0;
    A.trap = { icon: 'back', en: 'TURN AROUND', ja: 'ふりむく', fn: function () { ANOM.behind.turn(A); } }; updateMainButton();
    A.spr = camSprite(A.face, 0.22); A.step = 0; A.st = 2.2;
    A.from = new THREE.Vector3(-2.9, 0.2, -3.25);
  },
  update: function (A, dt) {
    if (A.done) return;
    if (!A.mini.active) { if (!A.turned) anomalyResolve(A); return; }
    // it walks in behind you, one step at a time
    A.st -= dt; if (A.st <= 0 && A.step < 6) { A.step++; A.st = 1.6; var cam = RENDER.camera.position, p = A.from.clone().lerp(new THREE.Vector3(cam.x, 0.2, cam.z + 0.6), A.step / 6); sfx('step', p, { vol: 0.5 + A.step * 0.08 }); if (A.step === 6) sfx('breath', new THREE.Vector3(cam.x, cam.y, cam.z + 0.4), { len: 3, vol: 0.8 }); }
    if (A.spr) { camSpriteNDC(A.spr, 1.1, 0.5, -0.12); A.spr.scale.set(0.24, 0.3, 1); var want = A.step >= 4 ? A.spr.userData.op : 0; A.spr.material.opacity = damp(A.spr.material.opacity, want * (0.7 + 0.3 * Math.sin(A.t * 9)), 2, dt); }
    if (A.t > 40) { A.turned = true; anomalyFail(A, A.face, { rule: 'behind' }); }
  },
  turn: function (A) {
    if (A.done || A.turned) return; A.turned = true; A.trap = null; updateMainButton();
    var cam = RENDER.camera, back = cam.position.clone(); var dir = new THREE.Vector3(); cam.getWorldDirection(dir); dir.y = 0; dir.normalize();
    CAM.override = { pos: cam.position.clone(), target: back.sub(dir.multiplyScalar(2)).setY(cam.position.y), k: 0, dur: 0.35 };
    setTimeout(function () { anomalyFail(A, A.face, { rule: 'behind' }); }, 360);
  },
  onMiniEnd: function (A, q) { if (!A.done && !A.turned) anomalyResolve(A, false); },
  cleanup: function (A) {
    A.trap = null; camSpriteFree(A.spr); A.spr = null;
    LSTATE.kitchenOff = false; LSTATE.powerT = 1; LSTATE.flick = 0.8; if (A.mini) A.mini.expo = A.expoWas;
    var F = WORLD.lights.fill; if (A.fillWas) { F.color.setHex(A.fillWas[0]); F.intensity = 0; F.distance = A.fillWas[2]; }
    if (!A.turned) setTimeout(function () { toast('The lights came back. Nobody is behind you.', '明かりがもどった。うしろには誰もいない。', 2.6); }, 900);
    updateMainButton();
  }
};
ANOM.youticket = {
  hint: ['A ticket for YOU? That ain\'t an order. Tear it up.', '「YOU」の伝票？ そんな注文はない。破れ。'],
  start: function (A) {
    A.face = pickFace(['mouth', 'glitch', 'human'], 'youticket');
    anomalyOnset(A, { noZap: true, keepMusic: true });
    var P = new THREE.Vector3(1.4, 1.9, -2.85); sfx('print', P, { n: 26 });
    var T = { no: 4444, cust: null, items: [{ odd: { en: 'YOU', ja: 'あなた', say: 'you', sayJa: 'あなた' }, done: false }], ready: false, done: false, table: 'TABLE 4: YOU', booth4: true, you: A };
    T.onTear = function () { anomalyResolve(A); };
    TICKETS.push(T); A.ticket = T; refreshTickets();
    setTimeout(function () { toast('The printer spat out a ticket: TABLE 4 — YOU', 'プリンターから伝票が出てきた：「4番テーブル：YOU」', 3); }, 1200);
  },
  update: function (A, dt) {
    if (A.done) return;
    if (A.t > 30 && !A.whis) { A.whis = 1; sfx('whisper', new THREE.Vector3(1.4, 1.9, -2.85), { vol: 0.5 }); }
    if (A.t > 120) { toast('Order up. Table four. You.', 'オーダーアップ。4番テーブル。あなた。', 2); anomalyFail(A, A.face, { rule: 'youticket' }); }
  },
  cook: function (A) { sfx('sizzle', new THREE.Vector3(0.9, 0.9, -4.7), { len: 2 }); say('SUNNY', 'Oh! You\'re the special tonight.', 'わあ！ 今夜のおすすめは、きみだ。', { voice: 'sunny', picoDark: 1, rate: 0.75, pitch: 0.6 }).then(function () { anomalyFail(A, A.face, { rule: 'youticket' }); }); },
  cleanup: function (A) { if (A.ticket && TICKETS.indexOf(A.ticket) >= 0) removeTicket(A.ticket); }
};
