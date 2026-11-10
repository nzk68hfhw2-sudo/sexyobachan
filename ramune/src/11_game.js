// ---- game flow ---------------------------------------------------------------------
var START_CLOCK = 20 * 60, END_CLOCK = 32 * 60; // 20:00 → 08:00 next morning
var GAME = { mode: 'boot', clock: START_CLOCK, ff: false, speed: 1, paused: false, B: null, stash: {}, hist: [], histT: 0, monoT: 6, rest: null, lock: false, fx: { vomit: 0, gapT: 0, gap: 0, flashT: 0, flash: 0, fade: 0, white: 0, hue: 0 }, endT: 0 };
var FAKE_BODY = null;

function startNight() {
  hideScreen(); closeModal(true);
  GAME.B = newBody();
  GAME.clock = START_CLOCK; setSpeed(1); GAME.paused = false; GAME.rest = null; GAME.lock = false; GAME.hist = []; GAME.histT = 0; GAME.monoT = 4;
  GAME.stash = {}; SUBS.forEach(function (s) { if (!s.hidden) GAME.stash[s.id] = s.stock || 2; }); DRINKS.forEach(function (d) { GAME.stash[d.id] = d.stock; });
  GAME.fx.fade = 1;
  WORLD.cans.forEach(function (m) { RENDER.scene.remove(m); }); WORLD.cans = [];
  WORLD.lightMode = 0; WORLD.tvOn = true; AU.music = true; auVol();
  resetPlayer(); GAME.regret = []; GAME.endBy = null; resetPhone(); clearPuddles(); showPackage(false); AU.style = AU.style || 'lofi';
  GAME.mode = 'play'; INPUT.enabled = true;
  showHUD(true); setSpeed(1); WORLD.bed = WORLD.bedMain;
  HUD.hint.innerHTML = isTouchDevice() || isMobile() ? '左側をドラッグで移動<br>右側をドラッグで見回す<br>モノをタップでしらべる' : 'WASD 移動 ・ ドラッグで見回す<br>クリック/E しらべる ・ F 速さ ・ Tab スマホ';
  setTimeout(function () { if (HUD.hint) HUD.hint.style.transition = 'opacity 2s'; HUD.hint.style.opacity = 0.0; }, 14000);
  HUD.hint.style.opacity = 0.55; HUD.hint.style.transition = '';
  SAVE.nights++; writeSave();
  var lines = ['金曜の夜。明日はなにもない。', 'テーブルにはラムネケース。冷蔵庫にはZER9。', '朝まで、好きにすごそう。'];
  lines.forEach(function (l, i) { setTimeout(function () { if (GAME.mode === 'play') say(l, 3.4); }, 900 + i * 3600); });
  sfx('ui');
}

var SPEEDS = [1, 2, 4, 8];
function setSpeed(v) {
  GAME.speed = v; GAME.ff = v > 1;
  if (HUD.bFF) { HUD.bFF.innerHTML = (v > 1 ? '⏩' : '▶') + '<b>' + v + 'x</b>'; HUD.bFF.className = 'btn round speed' + (v > 1 ? ' on' : ''); }
}
function toggleFF() {
  if (GAME.mode !== 'play') return;
  var i = SPEEDS.indexOf(GAME.speed || 1);
  setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  toast(GAME.speed > 1 ? '⏩ 時間の速さ ' + GAME.speed + '倍' : '▶ ふつうの速さ'); sfx('click');
}

// ---- actions -----------------------------------------------------------------------
function doInteract(it) {
  if (GAME.mode !== 'play' || GAME.paused || GAME.lock || GAME.B.unconscious || GAME.rest) return;
  sfx('click');
  it.fn();
}
function actTakePill(id) {
  var s = SUB[id]; if (GAME.lock) return;
  GAME.lock = true;
  if (!SAVE.settings.sandbox) GAME.stash[id]--;
  holdItem('pill', pillMesh(s), 1.25, function () {
    takeSub(GAME.B, id); sfx('pill'); GAME.lock = false; logEvent('🍬 ' + s.name + '（' + s.nick + '）を飲んだ');
    var first = !SAVE.seenSubs[id];
    SAVE.seenSubs[id] = 1; writeSave();
    toast((first ? '🆕 ' : '') + s.name + '（' + s.nick + '）を口に入れた。カリッ。', 'good');
    if (s.reset && !GAME.B.found.length) { }
  });
}
function actDrink(id) {
  var d = DRINK[id]; if (GAME.lock) return;
  GAME.lock = true;
  if (!SAVE.settings.sandbox) GAME.stash[id]--;
  sfx('can');
  setTimeout(function () { sfx('gulp'); }, 900);
  holdItem('can', canMesh(d), 2.7, function () {
    drinkCan(GAME.B, id); GAME.lock = false; logEvent('🍋 ' + d.name + ' を飲んだ');
    placeCanOnTable(d);
    var n = GAME.B.stats.cans;
    toast(d.name + ' を飲みほした' + (d.alc > 0 ? '（今夜 ' + n + ' 缶目）' : ''), 'good');
    if (d.alc > 0 && n === 3) say('ZER9、飲みやすすぎない…？', 3);
    if (d.alc > 0 && n === 6) say('…あれ、何本目だっけ', 3);
  });
}
function actWater() {
  if (GAME.lock) return; GAME.lock = true;
  WORLD.water.visible = true; sfx('water');
  setTimeout(function () { WORLD.water.visible = false; drinkWater(GAME.B); GAME.lock = false; toast('水をコップ1杯。少しすっきりした。', 'good'); }, 1700);
}
function actToilet() {
  var B = GAME.B;
  openModal('トイレ', function (body) {
    var d = el('div', 'rm-detail', '', body);
    var full = B.stom > 0.3 || B.doses.some(function (x) { var s = SUB[x.s]; return !s.hidden && x.t < s.pk * 1.2; });
    el('p', '', B.F.na > 0.5 ? 'うっ…胃がひっくりかえりそう。' : B.F.na > 0.2 ? 'ちょっと気持ち悪い。' : 'とくに気持ち悪くはない。', d);
    el('div', 'rm-kv', '<span>吐き気</span><b>' + (B.F.na > 0.9 ? 'かなり強い' : B.F.na > 0.4 ? 'ある' : B.F.na > 0.1 ? '少し' : 'なし') + '</b><span>胃の中</span><b>' + (full ? 'まだ吸収されていないものがある' : 'ほとんど空っぽ') + '</b>', d);
    var b1 = el('button', 'btn pri', '🤮 便器に吐く', d); onTap(b1, function () { closeModal(true); toiletVomit(); });
    var b2 = el('button', 'btn', '🚽 流す', d); onTap(b2, function () { closeModal(true); sfx('flush'); toast('トイレを流した。'); });
    var b3 = el('button', 'btn', '🪑 座ってひと休み（10分）', d); onTap(b3, function () { closeModal(true); B.naRelief = Math.max(B.naRelief, 0.2); bodyStep(B, 10); GAME.clock += 10; toast('便座に座って少し休んだ。'); });
    el('div', 'rm-note', '※ 吐いても、すでに体に入った分は減りません。具合が悪いときは迷わず119番。', body);
  });
}
function toiletVomit() {
  var B = GAME.B;
  var full = B.stom > 0.3 || B.F.na > 0.2 || B.doses.some(function (x) { var s = SUB[x.s]; return !s.hidden && x.t < s.pk * 1.2; });
  GAME.lock = true; GAME.kneelOn = true;
  setTimeout(function () {
    if (full) { GAME.fx.vomit = 1.6; sfx('vomit'); } else { sfx('gulp'); }
  }, 900);
  setTimeout(function () {
    if (full) { GAME.inToilet = true; vomit(B); GAME.inToilet = false; B.events = B.events.filter(function (e) { return e.type !== 'vomit'; }); sfx('flush'); toast('便器に吐いた…。少し楽になった。', 'good', 4); }
    else { B.naRelief = Math.max(B.naRelief, 0.15); toast('えずいただけで、なにも出なかった。'); }
    GAME.kneelOn = false; GAME.lock = false;
  }, 2600);
}
// vomit puddles (when it happens away from the toilet)
var PUDDLES = [];
function clearPuddles() { PUDDLES.forEach(function (p) { RENDER.scene.remove(p.m); WORLD.interMeshes = WORLD.interMeshes.filter(function (x) { return x !== p.m; }); WORLD.inter = WORLD.inter.filter(function (x) { return x !== p.it; }); }); PUDDLES = []; }
function addPuddle(x, z) {
  if (!TEX.puddle) {
    var c = mkCanvas(128, 128), g = c.getContext('2d');
    for (var i = 0; i < 14; i++) { g.fillStyle = 'rgba(' + (180 + Math.random() * 40 | 0) + ',' + (170 + Math.random() * 40 | 0) + ',' + (90 + Math.random() * 40 | 0) + ',0.85)'; g.beginPath(); g.ellipse(64 + rnd(-30, 30), 64 + rnd(-30, 30), rnd(10, 26), rnd(8, 20), rnd(0, 3), 0, TAU); g.fill(); }
    TEX.puddle = toTex(c);
  }
  var m = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), new THREE.MeshStandardMaterial({ map: TEX.puddle, transparent: true, roughness: 0.2, depthWrite: false }));
  m.rotation.x = -PI / 2; m.position.set(x, 0.012, z); RENDER.scene.add(m);
  var p = { m: m };
  p.it = addInter('puddle', '床の汚れ', '床をふく', new THREE.Vector3(x, 0.05, z), [m], function () {
    sfx('water'); RENDER.scene.remove(m); WORLD.interMeshes = WORLD.interMeshes.filter(function (q) { return q !== m; }); WORLD.inter = WORLD.inter.filter(function (q) { return q !== p.it; }); PUDDLES = PUDDLES.filter(function (q) { return q !== p; });
    toast('床をきれいにふいた。');
  }, { reach: 2.0 });
  PUDDLES.push(p);
}
function actMirror() {
  var B = GAME.B, F = B.F, out = [];
  if (F.ps > 0.5) out.push(pick(['鏡の中の自分が、ワンテンポ遅れて動いた。', '顔の輪郭がゆらゆら波打っている。', '瞳の中に万華鏡が見える。']));
  if (F.di > 0.6) out.push('鏡の中の人がだれなのか、よくわからない。');
  if (F.de > 0.5) out.push('鏡の奥、自分のうしろに…だれか立っていない？');
  if ((B.L.op || 0) > 0.4) out.push('瞳孔が針の先みたいに小さい。');
  else if (F.st > 0.5 || F.ps > 0.4 || F.em > 0.5 || F.de > 0.5) out.push('瞳孔がまんまるに開いている。');
  if (B.tp > 38.3) out.push('顔が真っ赤で汗だく。');
  if (F.na > 0.5) out.push('顔色が青白い。');
  if (B.hyd < 0.45) out.push('くちびるがカサカサ。');
  if (B.bac > 0.1) out.push('目がとろんとしている。');
  if (F.em > 0.6) out.push('…今日の自分、けっこうかわいいじゃん。');
  if (!out.length) out.push('いつもの自分だ。');
  say('（鏡）' + out.slice(0, 3).join(' '), 5);
}
function openMedMenu() {
  openModal('薬箱（ドラッグストアの薬）', function (body) {
    el('div', 'rm-alert', '⚠ ここにある薬はすべて架空です。現実の市販薬でも、決められた量をこえて飲む（オーバードーズ）と命にかかわります。つらいときは、ひとりで抱えずに相談を。', body);
    var l = el('div', 'rm-list', '', body); l.style.marginTop = '10px';
    SUBS.filter(function (s) { return s.otc; }).forEach(function (s) {
      var n = stockOf(s.id), taken = GAME.B.doses.filter(function (d) { return d.s === s.id; }).length;
      var it = el('div', 'rm-item' + (n <= 0 ? ' lock' : ''), '<img src="' + ramuneIcon(s, 88) + '"><div class="tx"><b>' + esc(s.name) + ' <span style="font-size:11px;opacity:.7">（' + esc(s.nick) + '）</span></b><small>' + esc(s.desc) + (taken ? '<br><span class="dg2">今夜すでに ' + taken + ' 回飲んでいる</span>' : '') + '</small></div>', l);
      var b = el('button', 'btn', n > 0 ? '飲む<br><small style="font-weight:500;opacity:.7">のこり' + (SAVE.settings.sandbox ? '∞' : n) + '</small>' : 'ない', it);
      if (n <= 0) b.disabled = true;
      onTap(b, function () { closeModal(true); actTakePill(s.id); });
    });
    el('div', 'rm-note', '現実で困ったとき：こころの健康相談統一ダイヤル 0570-064-556／救急車 119／迷ったら #7119（地域による）', body);
  });
}
function openSmokeMenu() {
  var B = GAME.B;
  openModal('葉巻ケース', function (body) {
    var l = el('div', 'rm-list', '', body);
    SUBS.filter(function (s) { return s.smoke; }).forEach(function (s) {
      var n = stockOf(s.id), cl = CLASSES[s.cls];
      var it = el('div', 'rm-item' + (n <= 0 ? ' lock' : ''), '<img src="' + ramuneIcon(s, 88) + '"><div class="tx"><b>' + esc(s.name) + ' <span style="font-size:11px;color:' + cl.col + '">' + cl.icon + esc(cl.short) + '</span></b><small>' + esc(s.desc) + '<br><span style="opacity:.8">現実では… ' + esc(cl.real) + '</span></small></div>', l);
      var b = el('button', 'btn', n > 0 ? '吸う<br><small style="font-weight:500;opacity:.7">のこり' + (SAVE.settings.sandbox ? '∞' : n) + '</small>' : 'ない', it);
      if (n <= 0) b.disabled = true;
      onTap(b, function () { closeModal(true); actSmoke(s.id); });
    });
    el('div', 'rm-note', '※ すべて架空のはまきです。20歳未満の喫煙は法律で禁止されています。', body);
  });
}
function actSmoke(id) {
  var s = SUB[id]; if (GAME.lock) return;
  GAME.lock = true;
  if (!SAVE.settings.sandbox) GAME.stash[id]--;
  sfx('click');
  HELD.tint = id === 'chillmaki' ? 0xcfe8c0 : id === 'shakimaki' ? 0xd0ecff : 0xd8d0c8;
  holdItem('smoke', cigarMesh(s), 3.2, function () {
    takeSub(GAME.B, id); GAME.lock = false; logEvent('🚬 ' + s.name + ' を吸った');
    var first = !SAVE.seenSubs[id]; SAVE.seenSubs[id] = 1; writeSave();
    if (GAME.B.F.na > 0.2 || Math.random() < 0.35) sfx('cough');
    toast((first ? '🆕 ' : '') + s.name + ' をふかした。ふぅ…', 'good');
  });
}
function actFrontDoor() {
  var B = GAME.B, high = B.bac > 0.05 || B.F.ps > 0.3 || B.F.di > 0.3 || B.F.de > 0.3 || B.F.se > 0.5 || B.F.st > 0.6;
  sfx('door');
  if (high) say('…いまの状態で外に出るのはやめておこう。今夜は家にいる。', 4);
  else say('コンビニに行きたい気もするけど…今夜は家でのんびりしよう。', 4);
}
function actKotatsu() {
  var B = GAME.B;
  if (B.tp > 38.2) { say('あつい…こたつに入ったら余計に体温が上がりそう。', 3.5); return; }
  say(pick(['こたつ…ぬくい…もう一生出られない…', 'こたつの中に、もうひとつの宇宙がある。', 'こたつ最高。']), 3.5);
  if (B.F.ps > 0.5) toast('こたつ布団の模様がゆっくり回っている…');
}
function actMikan() {
  var B = GAME.B;
  B.hyd = Math.min(1, B.hyd + 0.06); B.naRelief = Math.max(B.naRelief, 0.12);
  sfx('pill');
  var munch = (B.Ls.chillmaki || 0) > 0.3;
  if (munch) { B.socialT = Math.max(B.socialT || 0, 15); toast('みかん…うますぎる…！！（おなかがすいていたので、最高においしい）', 'good'); }
  else toast('みかんを食べた。甘ずっぱい。（水分が少しもどった）', 'good');
  if (B.F.ps > 0.6) say('みかんの皮の中に、小さな太陽が入ってた…', 3.5);
}
function actWasher() {
  var B = GAME.B;
  if (B.F.ps > 0.5) say('ドラムの中で、銀河がぐるぐる回っている…', 3.5);
  else if (B.F.de > 0.5) say('洗濯機の中から、だれかがこっちを見ている…？', 3.5);
  else say('洗濯物がたまってる…明日やろう。', 3);
}
function riskyBath(B) { return B.bac > 0.06 || B.F.se > 0.45 || B.F.di > 0.45 || B.F.pa > 0.45 || B.F.de > 0.5 || B.con < 70; }
function actBath() {
  var B = GAME.B;
  if (riskyBath(B)) { toast('⚠ 酔っている・ぼーっとしている時のお風呂は、眠って溺れる危険がある。シャワーにしておこう。', 'warn', 5); return; }
  if (B.tp > 38.3 || (B.L.up || 0) > 0.4 || (B.L.emp || 0) > 0.4) { toast('⚠ 体温や心拍が上がっている時に湯船は危ない。ぬるめのシャワーにしておこう。', 'warn', 5); return; }
  GAME.lock = true; sfx('water'); GAME.fx.fade = 0.9;
  setTimeout(function () { bodyStep(B, 20); GAME.clock += 20; GAME.lock = false; toast('ゆっくりお風呂に入った。さっぱり。（20分経過）', 'good'); }, 1400);
}
function actShower() {
  var B = GAME.B;
  GAME.lock = true; WORLD.spray.visible = true; sfx('water'); sfx('flush');
  setTimeout(function () {
    WORLD.spray.visible = false; GAME.lock = false;
    B.tp = Math.max(36.6, B.tp - 0.45); B.naRelief = Math.max(B.naRelief, 0.25); B.waterCool = Math.max(B.waterCool, 0.6);
    bodyStep(B, 8); GAME.clock += 8;
    toast('ぬるめのシャワーを浴びた。体の熱が少し引いた。', 'good');
  }, 2000);
}
function startRest(min) {
  GAME.rest = { left: min, morning: min > 1000 };
  GAME.B.onBed = true; setSpeed(1);
  say(min > 1000 ? 'おやすみなさい…' : 'ちょっとだけ…目をとじる…', 3);
}
function endRest(msg) {
  if (!GAME.rest) return;
  GAME.rest = null; GAME.B.onBed = false;
  var ex = (WORLD.bed || WORLD.bedMain).exit; PL.x = ex[0]; PL.z = ex[1]; PL.yaw = ex[2];
  if (msg) toast(msg);
}

// ---- body events -> UI -------------------------------------------------------------
function processEvents() {
  var B = GAME.B;
  while (B.events.length) {
    var e = B.events.shift(), d = e.data, s;
    switch (e.type) {
      case 'onset': s = SUB[d.id]; toast(s.name + ' が効いてきた…'); monologue(true); logEvent('✨ ' + s.name + ' が効いてきた'); break;
      case 'peak': break;
      case 'fade': s = SUB[d.id]; toast(s.name + ' の効き目が引いていく'); break;
      case 'combo':
        var cb = COMBO[d.id], isNew = !SAVE.seenCombos[d.id];
        SAVE.seenCombos[d.id] = 1; writeSave(); logEvent('🧪 飲み合わせ「' + cb.name + '」');
        sfx('combo');
        banner(isNew ? '🧪 NEW 飲み合わせ発見' : '🧪 飲み合わせ', cb.name, cb.desc, 'dg' + cb.danger);
        break;
      case 'vomit': if (GAME.fx.vomit <= 0) { GAME.fx.vomit = 1.4; sfx('vomit'); toast(B.unconscious ? '意識がないまま吐いてしまった！' : '耐えきれずに吐いてしまった…' + (areaAt(PL.x, PL.z).id === 'toilet' ? '（ぎりぎりトイレに間に合った）' : '（床が汚れた）'), 'warn'); if (areaAt(PL.x, PL.z).id !== 'toilet') addPuddle(PL.x - Math.sin(PL.yaw) * 0.5, PL.z - Math.cos(PL.yaw) * 0.5); } break;
      case 'pass': logEvent('💫 気を失った'); toast('意識が…遠のいていく…', 'warn', 4); setSpeed(1); break;
      case 'wake': toast('…はっ。' + Math.max(1, Math.round(d.mins)) + '分くらい記憶がない。', 'warn', 4); break;
      case 'warn': toast('⚠ ' + d.msg, 'warn'); sfx('warn'); logEvent('⚠ ' + d.msg); break;
      case 'dead': endNight('dead', d.cause); return;
    }
  }
}
function monologue(force) {
  var B = GAME.B;
  if (B.unconscious) { say('……', 2); return; }
  var dom = dominantFeelings(B, 3), key = 'idle';
  if (B.danger > 25) key = 'danger';
  else if (B.tp > 38.6 || B.hyd < 0.4) key = Math.random() < 0.6 ? 'hot' : (dom[0] ? dom[0][0] : 'idle');
  else if (dom.length) { var r = Math.random(), tot = 0; dom.forEach(function (x) { tot += x[1]; }); var acc = 0; for (var i = 0; i < dom.length; i++) { acc += dom[i][1] / tot; if (r <= acc) { key = dom[i][0]; break; } } }
  if ((B.Ls.chillmaki || 0) > 0.35 && Math.random() < 0.4) key = 'munch';
  if (key === 'eu') key = B.F.em > 0.3 ? 'em' : B.motor > 0.3 ? 'drunk' : B.F.ps > 0.2 ? 'ps' : 'idle';
  var arr = VOICE[key] || VOICE.idle;
  if (!force && key === 'idle' && Math.random() < 0.5) return;
  say(pick(arr), 3.8);
}

// ---- per-frame play update -------------------------------------------------------------
function updatePlay(dt) {
  var B = GAME.B;
  if (!GAME.paused) {
    var rate = 1;
    if (GAME.speed > 1) rate = GAME.speed;
    if (B.unconscious) rate = Math.max(rate, 5);
    if (GAME.rest) rate = 18;
    var gdt = dt * rate;
    GAME.clock += gdt;
    bodyStep(B, gdt);
    if (GAME.mode !== 'play') return;
    processEvents();
    if (GAME.mode !== 'play') return;
    // outdoor cooling
    B.envCool = damp(B.envCool, isOutdoor() ? 1 : 0, 0.05 * rate, dt);
    if (isOutdoor() && B.F.na > 0.05) B.naRelief = Math.max(B.naRelief, 0.12);
    // history
    GAME.histT -= gdt;
    if (GAME.histT <= 0) { GAME.histT = 5; GAME.hist.push({ hr: B.hr, tp: B.tp, rr: B.rr, d: B.danger }); if (GAME.hist.length > 300) GAME.hist.shift(); }
    // rest
    if (GAME.rest) {
      GAME.rest.left -= gdt;
      if (B.danger > 55 && !GAME.rest.woke && Math.random() < 0.5) { GAME.rest.woke = true; endRest('苦しくて目が覚めた…！'); }
      else if (GAME.rest && GAME.rest.left <= 0) endRest('少し休んだ。');
    }
    // morning
    if (GAME.clock >= END_CLOCK) { endNight(B.unconscious ? 'blackmorning' : 'morning'); return; }
    // monologue
    GAME.monoT -= dt;
    if (GAME.monoT <= 0) { GAME.monoT = rnd(10, 17) / (GAME.ff ? 1.5 : 1); if (!GAME.rest) monologue(false); }
    // player
    updatePlayer(dt, B, !B.unconscious && !GAME.rest && !GAME.lock);
    var it = (B.unconscious || GAME.rest) ? null : updateFocus();
    updateFocusUI(it);
    if (consume('interact') && it) doInteract(it);
    handleTap();
    if (consume('ff')) toggleFF();
    if (consume('phone')) openPhone();
    if (consume('menu')) openPhone('set');
    if (consume('pill')) openPillMenu();
    if (consume('drink')) openDrinkMenu();
  }
  updateHUD(dt, B);
}

// ---- visuals from body state ---------------------------------------------------------
var VS = { psy: 0, dis: 0, del: 0, drunk: 0, stim: 0, sed: 0, emp: 0, anx: 0, nau: 0, kal: 0, spin: 0, red: 0, lids: 0, nod: 0 };
function updateTripVisuals(dt, B) {
  var V = B.vis, calm = SAVE.settings.calm ? 0.45 : 1, t = LOOP.t, k = 1.5;
  ['psy', 'dis', 'del', 'drunk', 'stim', 'sed', 'emp', 'anx', 'nau', 'kal', 'spin'].forEach(function (key) { VS[key] = damp(VS[key], V[key] || 0, k, dt); });
  VS.red = damp(VS.red, (B.danger || 0) / 100, 2, dt);
  var P = POSTU;
  P.uPsy.value = Math.min(2.2, VS.psy) * (0.6 + 0.4 * calm);
  P.uDis.value = Math.min(1.8, VS.dis) * (0.7 + 0.3 * calm);
  P.uDel.value = Math.min(1.5, VS.del);
  P.uDrunk.value = Math.min(1.6, VS.drunk) * calm;
  P.uStim.value = Math.min(1.5, VS.stim);
  P.uSed.value = Math.min(1.8, VS.sed);
  P.uEmp.value = Math.min(1.5, VS.emp);
  P.uAnx.value = Math.min(1.2, VS.anx) * calm;
  P.uNau.value = Math.min(1.5, VS.nau + GAME.fx.vomit * 0.8) * calm;
  P.uTrail.value = clamp(VS.psy * 0.42 + VS.dis * 0.15 + VS.drunk * 0.08, 0, 0.88) * calm;
  P.uKal.value = clamp(VS.kal + Math.max(0, VS.psy - 1.45) * 0.7, 0, 0.8) * calm;
  P.uSpin.value = Math.min(1.5, VS.spin + Math.max(0, VS.drunk - 1.1) * 0.6) * calm;
  P.uCalm.value = SAVE.settings.calm ? 1 : 0;
  GAME.fx.hue += dt * VS.psy * 0.08 * calm;
  P.uHue.value = GAME.fx.hue;
  P.uRed.value = clamp(VS.red * 1.4, 0, 1);
  // eyelids: nodding off when sedated, closing when unconscious/resting
  var nodTarget = 0;
  if (VS.sed > 0.75) { var cyc = Math.pow(0.5 + 0.5 * Math.sin(t * 0.45), 6); nodTarget = cyc * clamp(VS.sed - 0.75, 0, 0.9); }
  if (B.unconscious) nodTarget = 1;
  if (GAME.rest) nodTarget = GAME.rest.left > 20 || GAME.rest.morning ? 1 : 0.6;
  VS.lids = damp(VS.lids, nodTarget, nodTarget > VS.lids ? 1.5 : 4, dt);
  P.uLids.value = VS.lids;
  // blackout gaps
  if ((V.gap || 0) > 0.4) { GAME.fx.gapT -= dt; if (GAME.fx.gapT <= 0) { GAME.fx.gapT = rnd(5, 14); GAME.fx.gap = 1; } }
  GAME.fx.gap = Math.max(0, GAME.fx.gap - dt * 0.9);
  P.uGap.value = GAME.fx.gap > 0.6 ? 1 : GAME.fx.gap / 0.6;
  // crisis flashes
  if ((V.flash || 0) > 0.4 && !SAVE.settings.calm) { GAME.fx.flashT -= dt; if (GAME.fx.flashT <= 0) { GAME.fx.flashT = rnd(1.5, 5); GAME.fx.flash = 0.35; } }
  GAME.fx.flash = Math.max(0, GAME.fx.flash - dt * 1.5);
  P.uFlash.value = GAME.fx.flash;
  GAME.fx.vomit = Math.max(0, GAME.fx.vomit - dt);
  GAME.fx.fade = Math.max(0, GAME.fx.fade - dt * 0.7);
  P.uBlack.value = clamp(GAME.fx.fade + (GAME.fx.dead || 0), 0, 1);
  P.uWhite.value = GAME.fx.white;
  // the room itself
  TRIPU.uPat.value = clamp((VS.psy - 0.25) * 0.65, 0, 0.9) * calm;
  TRIPU.uBreath.value = Math.min(1.6, VS.psy + VS.dis * 0.5) * calm;
  TRIPU.uMelt.value = clamp(VS.psy - 0.85, 0, 1.2) * calm;
  TRIPU.uHueW.value += dt * 0.05 * VS.psy;
  TRIPU.uGlow.value = Math.min(1.2, VS.emp);
  TRIPU.uDark.value = clamp(VS.del * 0.55, 0, 0.7);
  var open = clamp((VS.psy - 1.15) * 1.3, 0, 0.94) * (SAVE.settings.calm ? 0.5 : 1);
  WORLD.mats.ceil.opacity = 1 - open; WORLD.mats.ceil.depthWrite = open < 0.05;
  SKYU.uPsy.value = VS.psy;
}

function updateWorldFX(dt) {
  var t = LOOP.t, W = WORLD, Lt = W.L, B = GAME.B || FAKE_BODY;
  var morning = clamp((GAME.clock - 29 * 60) / 180, 0, 1);
  if (GAME.mode === 'title') morning = 0;
  SKYU.uMorning.value = morning;
  RENDER.scene.fog.color.setRGB(lerp(0.04, 0.55, morning), lerp(0.03, 0.5, morning), lerp(0.12, 0.6, morning));
  Lt.hemi.intensity = 0.28 + morning * 0.6;
  Lt.moon.intensity = 0.35 + morning * 0.5; Lt.moon.color.setRGB(lerp(0.54, 1, morning), lerp(0.65, 0.85, morning), lerp(1, 0.7, morning));
  W.moon.material.opacity = 1 - morning;
  var mode = W.lightMode, psy = VS.psy;
  Lt.ceil.intensity = damp(Lt.ceil.intensity, mode === 0 ? 0.8 : 0, 6, dt);
  W.lampMesh.material.color.setHex(mode === 0 ? 0xfff4dc : 0x403c36);
  var neonOn = mode === 1;
  Lt.neon.intensity = damp(Lt.neon.intensity, neonOn ? 1.4 : 0, 4, dt);
  var hue = (t * 0.05 + psy * t * 0.05) % 1;
  Lt.neon.color.setHSL(hue, 0.9, 0.55);
  W.strips.forEach(function (s) { s.visible = neonOn; s.material.color.setHSL(hue, 0.9, 0.6); });
  Lt.lamp.intensity = damp(Lt.lamp.intensity, mode === 2 ? 0.55 : 0.7, 4, dt);
  if (psy > 0.3) { Lt.lamp.color.setHSL((0.08 + Math.sin(t * 0.3) * psy * 0.1 + 1) % 1, 0.9, 0.6); } else Lt.lamp.color.setHex(0xffa65a);
  Lt.tv.intensity = W.tvOn ? 0.35 + 0.25 * Math.sin(t * 7) * Math.sin(t * 2.3) : 0;
  drawTV(t, W.tvOn, psy);
  W.spkLed.visible = AU.music;
  W.cones.forEach(function (c, i) { var s = AU.music ? 1 + Math.max(0, Math.sin(t * 8.2 * AU.p.tempo + i)) * 0.06 : 1; c.scale.set(s, s, 1); });
  W.fan.rotation.z += dt * 12;
  if (W.flash) W.flash.intensity = damp(W.flash.intensity, GAME.mode === 'play' && GAME.flash ? 1.8 : 0, 10, dt);
  var ar = GAME.mode === 'play' ? areaAt(PL.x, PL.z) : AREAS[2];
  var rl = ar.light || AREAS[2].light;
  if (W.roomLight !== rl) { W.roomLight = rl; Lt.bath.position.set(rl[0], rl[1], rl[2]); Lt.bath.color.setHex(rl[3]); Lt.bath.distance = ar.id === 'hall' ? 7 : 5.5; Lt.bath.intensity = ar.id === 'tatami' ? 0.9 : 0.75; }
  W.caseGlow.intensity = 0.2 + Math.sin(t * 2) * 0.08;
  // clock hands (follow the in-game clock, melt along with everything else)
  var cm = GAME.clock;
  W.clockM.rotation.z = -(cm % 60) / 60 * TAU; W.clockH.rotation.z = -((cm / 60) % 12) / 12 * TAU;
  W.anim.forEach(function (f) { f(t, dt); });
}

// ---- endings -------------------------------------------------------------------------
function endNight(kind, cause) {
  if (GAME.mode !== 'play') return;
  var B = GAME.B;
  GAME.mode = 'end'; INPUT.enabled = false; closeModal(true); showHUD(false); setSpeed(1);
  HUD.sub.style.opacity = 0;
  B.onBed = false;
  if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {}
  var found = B.found.slice(), score = Math.max(0, Math.round(B.stats.fun)) + found.length * 300 + (kind === 'morning' ? 1000 : kind === 'blackmorning' ? 300 : 0);
  SAVE.endings[kind] = (SAVE.endings[kind] || 0) + 1;
  if (kind === 'dead') SAVE.deaths++; else if (kind !== 'ambulance') SAVE.mornings++;
  if (kind !== 'dead') SAVE.best = Math.max(SAVE.best, score);
  writeSave();
  GAME.endInfo = { kind: kind, cause: cause, score: score, found: found };
  if (kind === 'dead') { sfx('flatline'); GAME.fx.deadFade = true; setTimeout(showEnding, 3200); }
  else if (kind === 'ambulance') { sfx('siren'); GAME.fx.deadFade = true; setTimeout(showEnding, 2600); }
  else { sfx('birds'); GAME.fx.whiteFade = true; setTimeout(showEnding, 2400); }
}
function updateEndFX(dt) {
  if (GAME.fx.deadFade) GAME.fx.dead = Math.min(1, (GAME.fx.dead || 0) + dt * 0.4);
  if (GAME.fx.whiteFade) GAME.fx.white = Math.min(0.85, GAME.fx.white + dt * 0.5);
}
function showEnding() {
  var I = GAME.endInfo, B = GAME.B, S = B.stats, title, sub, note = '', rank;
  if (I.kind === 'dead') {
    title = 'BAD END';
    sub = { rr: '呼吸が、止まってしまった。', hr: '心臓が、限界をこえてしまった。', tp: '体温が、上がりすぎてしまった。', vomit: '意識がないまま吐いて、息ができなくなった。' }[I.cause] || '朝は来なかった。';
    note = { rr: 'お酒・睡眠薬・オピオイドなど「鎮静系」どうしの組み合わせは、現実でも呼吸を止めてしまうことがあります。', hr: 'アッパー系の重ねがけや、ほかの薬との組み合わせは、現実でも心臓に大きな負担をかけます。', tp: '体温を上げる薬と脱水・興奮の組み合わせは、現実でも命にかかわります。', vomit: '泥酔して意識がない人は、吐いたもので窒息しないよう横向きに寝かせて、すぐに119番を。' }[I.cause] || '';
    rank = 'GAME OVER';
  } else if (I.kind === 'ambulance') {
    title = '救急搬送'; sub = (GAME.endBy ? GAME.endBy + 'が救急車を呼んでくれた。' : '') + '救急車で運ばれて、病院のベッドで朝をむかえた。'; note = '具合が悪いとき・だれかが倒れているときは、迷わず119番。それはかっこ悪いことじゃない。'; rank = '生きてるだけで100点';
  } else {
    title = I.kind === 'blackmorning' ? '気づいたら朝' : 'GOOD MORNING';
    sub = I.kind === 'blackmorning' ? '床の上で目が覚めた。昨日の夜のことは、ほとんど覚えていない。' : '窓の外が明るい。長い夜が終わった。';
    var sc = I.score;
    rank = sc < 600 ? 'しずかな夜' : sc < 1600 ? 'ゆるい夜' : sc < 3200 ? 'たのしい夜' : sc < 5200 ? '最高の夜' : '伝説の夜';
    if (S.cans >= 6 || S.pills >= 6) note = 'からだは正直。今日は一日、水を飲んでゆっくり休もう。';
    if ((B.liver || 0) >= 3) { title = '朝は来たけど…'; sub = '数日後、体がだるくて病院へ行くと、肝臓の数値がひどく悪くなっていた。'; rank = '沈黙の臓器'; note = '解熱鎮痛薬などの飲みすぎは、その場では何も感じなくても肝臓を壊すことがあります。お酒と重なるとさらに危険です。'; }
  }
  var foundHtml = I.found.length ? I.found.map(function (id) { var c = COMBO[id]; return '<span class="dg' + c.danger + '">🧪' + esc(c.name) + '</span>'; }).join('　') : 'なし';
  var html = '<div class="rm-card2 rm-end" style="text-align:center">' +
    '<h1>' + esc(title) + '</h1><div style="opacity:.9">' + esc(sub) + '</div>' +
    '<div class="rm-rank">' + esc(rank) + '</div>' +
    (I.kind !== 'dead' ? '<div style="font-size:13px;opacity:.75">スコア</div><div style="font-family:DotGothic16,monospace;font-size:40px;line-height:1">' + I.score + '</div>' : '') +
    '<div class="rm-big" style="margin:12px 0;text-align:left"><div><b>' + S.pills + '</b><span>飲んだラムネ</span></div><div><b>' + S.cans + '</b><span>飲んだ缶</span></div><div><b>' + Math.round(S.maxHR) + '</b><span>最高心拍</span></div><div><b>' + S.maxTp.toFixed(1) + '℃</b><span>最高体温</span></div><div><b>' + S.minRR.toFixed(1) + '</b><span>最低呼吸</span></div><div><b>' + S.vomits + '</b><span>吐いた回数</span></div></div>' +
    '<div style="font-size:13px;text-align:left;line-height:1.8"><b>見つけた飲み合わせ：</b>' + foundHtml + '</div>' +
    (GAME.regret && GAME.regret.length ? '<div style="font-size:13px;text-align:left;line-height:1.7;margin-top:8px"><b>📱 朝になって見返したスマホ：</b><br>' + GAME.regret.slice(-5).map(esc).join('<br>') + '<br><span style="opacity:.7">…そっとアプリを閉じた。</span></div>' : '') +
    (note ? '<div class="rm-alert" style="margin-top:12px;text-align:left">' + esc(note) + '</div>' : '') +
    '<div class="rm-menu" style="margin:16px auto 0"><button class="btn pri" id="rm-again">もう一晩</button><button class="btn ghost" id="rm-title">タイトルへ</button></div>' +
    '<div class="rm-note">これはフィクションのゲームです。登場するラムネ・お酒はすべて架空のものです。</div></div>';
  showScreen(html);
  onTap(document.getElementById('rm-again'), function () { GAME.fx.dead = 0; GAME.fx.white = 0; GAME.fx.deadFade = GAME.fx.whiteFade = false; startNight(); });
  onTap(document.getElementById('rm-title'), function () { toTitle(); });
}

// ---- title / warning / how-to ---------------------------------------------------------------
function toTitle() {
  closeModal(true); hideScreen(); showHUD(false);
  GAME.mode = 'title'; INPUT.enabled = false; GAME.paused = false;
  GAME.fx.dead = 0; GAME.fx.white = 0; GAME.fx.deadFade = GAME.fx.whiteFade = false; GAME.fx.fade = 0.8;
  GAME.clock = 23 * 60;
  WORLD.lightMode = 1; WORLD.tvOn = true;
  var html = '<div class="rm-logo-pre">キケンな</div><div class="rm-logo">ラムネ<br><span>シミュレーター</span></div><div class="rm-logo-sub">DANGEROUS RAMUNE SIMULATOR</div>' +
    '<div style="font-size:13px;opacity:.85">架空のラムネとチューハイで過ごす、ひと晩のシミュレーター</div>' +
    '<div class="rm-menu"><button class="btn pri" id="rm-start">はじめる</button><button class="btn" id="rm-zukan">図鑑</button><button class="btn" id="rm-howto">あそびかた</button><button class="btn ghost" id="rm-set">設定</button></div>' +
    '<div class="rm-note">図鑑：ラムネ ' + Object.keys(SAVE.seenSubs).length + '/' + SUBS.filter(function (s) { return !s.hidden; }).length + ' ・ 飲み合わせ ' + Object.keys(SAVE.seenCombos).length + '/' + COMBOS.length + (SAVE.best ? ' ・ ベスト ' + SAVE.best : '') + '<br>※ フィクションです。実在の薬物・製品とは関係ありません。</div>';
  showScreen(html, 'rm-title');
  onTap(document.getElementById('rm-start'), function () { initAudio(); startNight(); });
  onTap(document.getElementById('rm-zukan'), function () { initAudio(); openPhone('zukan'); });
  onTap(document.getElementById('rm-howto'), function () { initAudio(); showHowTo(); });
  onTap(document.getElementById('rm-set'), function () { initAudio(); openPhone('set'); });
}
function showWarning() {
  GAME.mode = 'title';
  var html = '<div class="rm-card2"><h3>⚠ はじめに</h3>' +
    '<ul><li>これは<b>フィクションのゲーム</b>です。登場する「ラムネ」「ZER9」などはすべて架空のもので、実在の薬物・製品とは関係ありません。</li>' +
    '<li>ゲームの中の効果や飲み合わせは創作です。<b>現実の薬物や、お酒と薬の組み合わせを試すのは絶対にやめましょう。</b></li>' +
    '<li>お酒は20歳になってから。</li>' +
    '<li>画面が強くゆれたり、色が点滅したりする表現があります。光に敏感な方は下の設定をオンにしてください。</li></ul>' +
    '<div class="rm-set"><span>光の点滅・ゆれをおさえる</span><div class="rm-tog' + (SAVE.settings.calm ? ' on' : '') + '" id="rm-calm"><i></i></div></div>' +
    '<div class="rm-menu" style="margin:14px auto 0"><button class="btn pri" id="rm-ok">わかった</button></div></div>';
  showScreen(html);
  var tg = document.getElementById('rm-calm');
  onTap(tg, function () { SAVE.settings.calm = !SAVE.settings.calm; tg.className = 'rm-tog' + (SAVE.settings.calm ? ' on' : ''); writeSave(); });
  onTap(document.getElementById('rm-ok'), function () { initAudio(); SAVE.warned = true; writeSave(); toTitle(); });
}
function showHowTo() {
  var html = '<div class="rm-card2"><h3>あそびかた</h3>' +
    '<p>夜8時から朝8時まで、自分の家で好きにすごすゲームです。リビング・ベランダ・トイレのほか、廊下の先に玄関・和室・お風呂もあります。<br>テーブルの<b>ラムネケース</b>から架空のラムネを、<b>冷蔵庫</b>から ZER9（架空のチューハイ）を選んで、いろいろな効果と<b>飲み合わせ</b>を見つけよう。</p>' +
    '<ul><li><b>移動</b>：画面の左側をドラッグ（PC：WASD）</li><li><b>見回す</b>：右側をドラッグ（PC：マウスでドラッグ）</li><li><b>しらべる</b>：モノをタップ、または右下のボタン（PC：クリック / E）</li><li><b>▶1x</b>：タップするたびに時間の速さが 1倍→2倍→4倍→8倍 と切り替わる（PC：F）</li><li><b>📱</b>：からだの状態・図鑑・設定・119</li></ul>' +
    '<p><b>ラムネの名前</b>：どれも医薬品っぽい名前と「通称」がついていますが、<b>すべて架空</b>です。</p><p><b>ラムネの系統</b>：🌈幻覚系　⚡アッパー系　💤ダウナー系　☁️ぬくぬく系（オピオイド系）　🪐解離系　💗ハート系　🌑とばり系　✨とくしゅ</p>' +
    '<p><b>からだに注意</b>：心拍・体温・呼吸が危険なところに入ると、画面が赤くなって「危険度」がたまります。100になると BAD END。<br>' +
    '水を飲む・ベランダで風にあたる・トイレで吐く・ネガトキソン（リセットラムネ）・119番などで切り抜けよう。</p>' +
    '<p><b>スコア</b>：楽しい気分の量 ＋ 見つけた飲み合わせ ＋ 朝まで無事だったボーナス。</p>' +
    '<div class="rm-menu" style="margin:10px auto 0"><button class="btn pri" id="rm-back">もどる</button></div></div>';
  showScreen(html);
  onTap(document.getElementById('rm-back'), function () { toTitle(); });
}
function updateTitle(dt) {
  var t = LOOP.t, cam = RENDER.camera;
  var a = 0.35 + Math.sin(t * 0.05) * 0.55;
  cam.position.set(0.45 + Math.sin(t * 0.07) * 0.15, 1.35 + Math.sin(t * 0.3) * 0.05, 1.9);
  cam.rotation.order = 'YXZ'; cam.rotation.set(-0.1 + Math.sin(t * 0.11) * 0.05, a, Math.sin(t * 0.4) * 0.03);
  if (Math.abs(cam.fov - RENDER.baseFov) > 0.05) { cam.fov = RENDER.baseFov; cam.updateProjectionMatrix(); }
  var V = FAKE_BODY.vis;
  V.psy = 0.55 + 0.35 * Math.sin(t * 0.13); V.emp = 0.35 + 0.25 * Math.sin(t * 0.21 + 1); V.dis = 0.15; V.drunk = 0; V.stim = 0.1; V.sed = 0; V.del = 0; V.anx = 0; V.nau = 0;
}
