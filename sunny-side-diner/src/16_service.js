// ---- service: customers' lifecycle, ordering, tickets, serving, paying ------------
var CUSTS = [], TICKETS = [], TICKET_NO = 4100;
var PATIENCE = { wait: 45, seated: 40, ready: 45, ordered: 120, check: 40 };
var LINES = {
  greet: [
    ['Evening! Table for one?', 'こんばんは！ ひとりなんだけど。'], ['Hi there. Still open?', 'どうも。まだやってる？'], ['Phew, what a drive. You open?', 'ふう、長い運転だった。開いてる？'],
    ['Smells like coffee in here. Good.', 'コーヒーのいい匂い。いいね。']
  ],
  order: [['I\'ll have {items}.', '{items}をください。'], ['Lemme get {items}.', '{items}をもらえる？'], ['How about {items}?', '{items}にしようかな。'], ['{items}, please.', '{items}、お願い。']],
  served: [['Looks great. Thanks!', 'おいしそう。ありがとう！'], ['Mm. That hits the spot.', 'うん、これこれ。'], ['Now that\'s a plate.', 'いいね、これだよ。']],
  check: [['Could I get the check?', 'お会計いいかな？'], ['That was great. Check, please.', 'おいしかった。お会計を。']],
  pay: [['Keep the change, kid.', 'おつりはとっといて。'], ['Thanks. See you around.', 'ありがとう。またね。'], ['Best diner on the highway.', 'このハイウェイで一番の店だよ。']],
  angry: [['Forget it. I\'m outta here.', 'もういい。帰る。'], ['Slowest diner in the desert.', '砂漠で一番遅い店だな。']],
  chat: [
    ['This place never closes. Not once, not in thirty years.', 'この店は閉まったことがない。30年間、一度もな。'],
    ['They say the sign stays on so folks can find their way.', '道に迷った人のために、看板は消さないんだってさ。'],
    ['You\'re the new night kid? The last one lasted four nights.', '新しい夜勤の子？ 前の子は4日もったよ。'],
    ['Don\'t mind the jukebox. It does what it wants.', 'ジュークボックスは気にするな。あれは好きにやる。'],
    ['My mama ate here in \'58. Same pie, same smile on that egg.', 'おふくろも58年にここで食べた。同じパイ、同じ笑う卵。'],
    ['I never sit in booth four. Nobody does after midnight.', '4番席には座らない。夜中は誰もな。']
  ]
};
var ARCH_LINES = {
  earl: { greet: [['Evenin\'. Coffee, black. Then we\'ll see.', 'よう。コーヒー、ブラックで。あとは考える。'], ['Long haul tonight. Got pie?', '今夜は長距離だ。パイあるかい？']] },
  dot: { greet: [['Hi! Oh my gosh, this place is SO cute!', 'こんにちは！ やだ、このお店かわいすぎ！'], ['Hiya! Is the egg guy on the sign real? Kidding!', 'やっほー！ 看板の卵くん、本物？ うそうそ！']] },
  kessler: { greet: [['Evening. Kessler, Pioneer Vacuums. Quick bite.', 'どうも。パイオニア掃除機のケスラーです。軽く食事を。']] },
  rosa: { greet: [['Double shift. I need coffee like air.', 'ダブルシフトなの。空気みたいにコーヒーがほしい。']] },
  gus: { greet: [['Howdy, partner. Same as always.', 'よう、相棒。いつものやつだ。']] },
  tina: { greet: [['Two milkshakes! Kidding. One. For now.', 'シェイク2つ！ うそ。1つ。とりあえずね。']] },
  ricky: { greet: [['Hey daddy-o. What\'s cookin\'?', 'よう。何が焼けてる？']] },
  walt: { greet: [['Grease on my hands, hunger in my belly.', '手は油まみれ、腹はペコペコだ。']] },
  pruitt: { greet: [['Good evening, dear. A quiet table, please.', 'こんばんは。静かな席をお願いね。']] },
  doyle: { greet: [['Evening. Quiet night so far. Let\'s keep it that way.', 'やあ。今夜は静かだ。このままがいい。']] },
  henderson: { greet: [['A table for two, please. Millie, say hello.', 'ふたりです。ミリー、ごあいさつは？']] },
  lou: { greet: [['Gig ran late. Got anything sweet?', 'ライブが押してね。甘いものある？']] },
  marge: { greet: [['My night off and here I am. Ha!', '非番なのに、結局ここ。ははっ！']] }
};
function pickL(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function itemsText(items, lang) {
  var names = items.map(function (it) { var m = it.odd ? it.odd : MENU[it.id]; return lang === 'ja' ? (it.odd ? it.odd.ja : m.ja) : (it.odd ? it.odd.en.toLowerCase() : (/^[aeiou]/i.test(m.en) ? 'an ' : 'a ') + m.en.toLowerCase()); });
  if (lang === 'ja') return names.join('と');
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}
// ---- spawn / walking ------------------------------------------------------------------
function freeSeats(kind) { return SEATS.filter(function (s) { return (!kind || s.kind === kind) && !s.taken && !(s.kind === 'booth' && s.side > 0) && !(s.booth === 4 && GAME.min > 150) && !s.blocked; }); }
function spawnCustomer(arch, opt) {
  opt = opt || {};
  var P = personFrom(arch, opt.seed);
  var C = { id: Math.random().toString(36).slice(2, 7), arch: arch, P: P, state: 'arrive', path: [], pat: 1, patMax: 1, items: [], ticket: null, mood: 1, voice: arch.voice, name: arch.name, opt: opt, anomaly: opt.anomaly || null, t: 0, dishes: [] };
  RENDER.scene.add(P.root);
  P.root.position.set(6.0, 0, 7.5); P.root.rotation.y = PI; setPose(P, 'walk');
  if (opt.mirror) P.root.scale.x *= -1;
  if (opt.kid) { var K = personFrom(KID); C.kid = K; RENDER.scene.add(K.root); K.root.position.set(6.4, 0, 8.0); setPose(K, 'walk'); K.holdDoll = true; }
  C.path = [new THREE.Vector3(6.0, 0, 4.5), WORLD.waitSpot.clone()];
  addPick(P.root, function () { tapCustomer(C); }, { stations: ['COUNTER', 'REGISTER', 'DOOR', 'BOOTHS'] });
  CUSTS.push(C);
  if (!opt.silentEntry) { setTimeout(function () { openDoorAnim(); sfx('doorbell', new THREE.Vector3(6, 2.3, 4.9)); }, 900); }
  return C;
}
var DOORANIM = { t: 0 };
function openDoorAnim() { DOORANIM.t = 1.4; }
function updateDoor(dt) { if (DOORANIM.t > 0) DOORANIM.t -= dt; var k = DOORANIM.t > 0 ? Math.sin(clamp(DOORANIM.t / 1.4, 0, 1) * PI) : 0; WORLD.door.rotation.y = damp(WORLD.door.rotation.y, -k * 1.2, 8, dt); }
function walkTo(C, pts, then) { C.path = pts.slice(); C.onPath = then; setPose(C.P, 'walk'); }
function routeToSeat(seat) {
  var V = function (x, z) { return new THREE.Vector3(x, 0, z); };
  if (seat.kind === 'stool') return [V(4.6, 2.7), V(seat.pos.x, 0.25), V(seat.pos.x, -0.2)];
  // booths: walk to the end of the bench in the aisle, then slide in along the bench while seated
  return [V(4.6, 2.7), V(seat.pos.x, 2.95), V(seat.pos.x, 3.15), SLIDE(seat, 3.42), SLIDE(seat, seat.pos.z)];
}
function SLIDE(seat, z) { var v = new THREE.Vector3(seat.pos.x, 0, z); v.sitY = seat.pos.y; v.face = seat.face; return v; }
function routeOut(C) { var p = C.P.root.position, V = function (x, z) { return new THREE.Vector3(x, 0, z); }; var pts = []; if (C.seat && C.seat.kind === 'stool') pts.push(V(p.x, 0.3)); else if (C.seat) pts.push(SLIDE(C.seat, 3.42), V(p.x, 3.12), V(p.x, 2.95)); pts.push(V(4.6, 2.7), V(6.0, 4.4), V(6.0, 7.6)); return pts; }
function moveCustomer(C, dt) {
  var P = C.P, R = P.root;
  if (C.path && C.path.length) {
    var tgt = C.path[0], d = new THREE.Vector3(tgt.x - R.position.x, 0, tgt.z - R.position.z), L = d.length(), sp = (C.speed || 1.15) * dt;
    var sliding = tgt.sitY != null;
    if (sliding) { R.position.y = tgt.sitY; R.rotation.y = tgt.face; if (P.anim !== 'sit') setPose(P, 'sit'); sp *= 0.55; }
    else { R.position.y = 0; if (P.anim !== 'walk' && L >= 0.06) setPose(P, 'walk'); }
    if (L < 0.06) { C.path.shift(); if (R.position.z > 4.6 && tgt.z < 4.6 && !C.inDoor) { C.inDoor = 1; openDoorAnim(); } if (!C.path.length) { var f = C.onPath; C.onPath = null; setPose(P, 'stand'); if (f) f(); } }
    else { d.multiplyScalar(Math.min(1, sp / L)); R.position.add(d); if (!sliding) { var yaw = Math.atan2(d.x, d.z); R.rotation.y = R.rotation.y + angDiff(R.rotation.y, yaw) * Math.min(1, dt * 8); } }
    if (C.kid && !sliding) { var kr = C.kid.root, fwd = new THREE.Vector3(Math.sin(R.rotation.y), 0, Math.cos(R.rotation.y)), kd = new THREE.Vector3(R.position.x - fwd.x * 0.6 - kr.position.x, 0, R.position.z - fwd.z * 0.6 - kr.position.z); kr.position.y = 0; var kl = kd.length(); if (kl > 0.05) { kd.multiplyScalar(Math.min(1, 1.4 * dt / kl)); kr.position.add(kd); kr.rotation.y = Math.atan2(kd.x, kd.z); setPose(C.kid, 'walk'); } else setPose(C.kid, 'stand'); }
  }
}
function sitDown(C, seat) {
  var R = C.P.root; seat.taken = C; C.seat = seat;
  R.position.copy(seat.pos); R.rotation.y = seat.face; setPose(C.P, 'sit');
  if (seat.seatMesh) sfx('stool', seat.pos);
  removePick(R); addPick(R, function () { tapCustomer(C); }, { stations: seat.kind === 'stool' ? ['COUNTER'] : ['BOOTHS', 'COUNTER'] });
  if (C.kid) { var opp = SEATS.filter(function (s) { return s.booth === seat.booth && s.side > 0; })[0]; if (opp) { C.kid.root.position.copy(opp.pos); C.kid.root.position.y += 0.08; C.kid.root.rotation.y = opp.face; setPose(C.kid, 'sit'); opp.taken = C; C.kidSeat = opp; } }
  RENDER.shadowDirty = true;
}
function standUp(C) { var bs = C.seat; if (C.seat) { C.seat.taken = null; C.seat = null; } if (C.kidSeat) { C.kidSeat.taken = null; C.kidSeat = null; } if (bs && bs.kind === 'booth') { C.P.root.position.y = bs.pos.y; C.seat = bs; C.leavingSeat = true; } else C.P.root.position.y = 0;
  if (C.kid && bs) { C.kid.root.position.set(bs.pos.x + 0.5, 0, 3.05); setPose(C.kid, 'stand'); } }
function customerLeave(C, angry) {
  if (C.state === 'leaving' || C.state === 'gone') return;
  clearDishes(C); hideMenuProp(C);
  if (C.ticket && !C.ticket.done) { C.ticket.cancel = true; removeTicket(C.ticket); }
  standUp(C); C.state = 'leaving'; C.marker && (C.marker.style.display = 'none');
  if (!angry) leaveWhisper(C);
  walkTo(C, routeOut(C), function () { C.state = 'gone'; removeCustomer(C); });
  if (C.leavingSeat) { C.leavingSeat = false; C.seat = null; }
  if (angry) { GAME.angry++; }
}
function removeCustomer(C) { removePick(C.P.root); disposePerson(C.P); if (C.kid) disposePerson(C.kid); if (C.refl) { disposePerson(C.refl); C.refl = null; } if (C.marker && C.marker.parentNode) C.marker.parentNode.removeChild(C.marker); var i = CUSTS.indexOf(C); if (i >= 0) CUSTS.splice(i, 1); }
// ---- menu prop in hands ------------------------------------------------------------------
var MENU_TEX = null, MENU_MOOD = 'happy';
function menuTex(mood) {
  if (mood && mood !== MENU_MOOD) { MENU_MOOD = mood; if (MENU_TEX) MENU_TEX.dispose(); MENU_TEX = null; }
  if (MENU_TEX) return MENU_TEX;
  var c = mkCanvas(256, 360), g = c.getContext('2d'); g.fillStyle = '#c8282e'; g.fillRect(0, 0, 256, 360); g.fillStyle = '#f3e6c8'; g.fillRect(10, 10, 236, 340);
  drawSunny(g, 128, 150, 70, { wave: 0.6, mood: MENU_MOOD, look: MENU_MOOD === 'stare' ? 0.8 : 0 }); g.fillStyle = '#c8282e'; g.font = '40px ' + F.logo; g.textAlign = 'center'; g.fillText('Sunny Side', 128, 290); g.font = '18px ' + F.slab; g.fillText('MENU', 128, 322);
  MENU_TEX = toTex(c, { clamp: true }); return MENU_TEX;
}
function showMenuProp(C) { if (C.menuProp) return; var m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.31), new THREE.MeshStandardMaterial({ map: menuTex(), roughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 1.2 })); m.position.set(0, -0.06, 0.12); m.rotation.x = -0.3; C.P.parts.handR.add(m); C.menuProp = m; m.castShadow = true; }
function hideMenuProp(C) { if (C.menuProp) { C.menuProp.parent.remove(C.menuProp); C.menuProp.geometry.dispose(); C.menuProp.material.dispose(); C.menuProp = null; } }
// ---- dishes on the table ------------------------------------------------------------------
function placeDishes(C) {
  var base = C.seat.eatPos.clone(), n = C.items.length;
  C.items.forEach(function (it, i) {
    if (it.torn) return;
    var d = dishMesh(it.odd ? 'odd' : it.id, { steam: true });
    var off = C.seat.kind === 'stool' ? new THREE.Vector3((i - (n - 1) / 2) * 0.24, 0, 0) : new THREE.Vector3(0, 0, (i - (n - 1) / 2) * 0.26 - 0.1);
    d.position.copy(base).add(off); d.rotation.y = Math.random() * 0.6; RENDER.scene.add(d); C.dishes.push(d);
    if (d.userData.steam) d.userData.em = steamEmit(d.position.x, d.position.y + 0.08, d.position.z, 2.5, 0.05);
  });
}
function freeGeo(o) { o.traverse(function (m) { if (m.geometry) m.geometry.dispose(); }); } // geometry is never shared by dishes
function clearDishes(C) { C.dishes.forEach(function (d) { if (d.userData.em) steamStop(d.userData.em); RENDER.scene.remove(d); freeGeo(d); }); C.dishes = []; }
// ---- tapping a customer ---------------------------------------------------------------------
function custSay(C, en, ja, opt) { opt = opt || {}; opt.voice = C.voice; if (C.anomaly && C.oddVoice) opt.odd = true; return say(C.name, en, ja, opt); }
function tapCustomer(C) {
  if (GAME.mode !== 'play' || TALK.busy || MINI.active) return;
  if (C.anomaly && C.anomaly.onTap && C.anomaly.onTap(C) === true) return;
  var o = [], st = C.state;
  var closed = { icon: 'stop', en: "We're closed.", ja: '閉店です（目をそらす）', fn: function () { refuseCustomer(C); } };
  var ignore = { icon: 'silent', en: 'Say nothing.', ja: '何も言わない・何も出さない', fn: function () { ignoreCustomer(C); } };
  if (st === 'wait') {
    var stools = freeSeats('stool'), booths = freeSeats('booth');
    if (!C.kid && stools.length) o.push({ icon: 'seat', en: 'Counter seat', ja: 'カウンター席へ案内', fn: function () { seatCustomer(C, stools[Math.floor(Math.random() * stools.length)]); } });
    if (booths.length) o.push({ icon: 'seat', en: 'Booth ' + booths[0].booth, ja: booths[0].booth + '番のボックス席へ案内', fn: function () { seatCustomer(C, booths[0]); } });
    if (!stools.length && !booths.length) o.push({ icon: 'seat', en: 'No free seats...', ja: '空席がない', dim: true });
    o.push(closed, ignore);
  } else if (st === 'seated') {
    o.push({ icon: 'menu', en: 'Hand a menu', ja: 'メニューを渡す', fn: function () { giveMenu(C); } }, closed, ignore);
  } else if (st === 'ready') {
    o.push({ icon: 'pencil', en: 'Take the order', ja: '注文を取る', fn: function () { takeOrder(C); } }, closed, ignore);
  } else if (st === 'reading') {
    o.push({ icon: 'menu', en: '"Take your time."', ja: '「ごゆっくり」', fn: function () { custSay(C, 'Just a minute, hon.', 'ちょっと待ってね。'); } }, closed);
  } else if (st === 'ordered') {
    var ready = C.ticket && C.ticket.ready;
    o.push({ icon: 'serve', en: ready ? 'Serve the order' : 'Food is cooking...', ja: ready ? '料理を出す' : 'まだ調理中', dim: !ready, fn: function () { serveCustomer(C); } });
    if (C.ticket && !C.ticket.ready) o.push({ icon: 'cook', en: 'Go cook it', ja: '厨房で作る', fn: function () { camSetStation('KITCHEN'); } });
    o.push(ignore);
  } else if (st === 'eating') {
    o.push({ icon: 'reply', en: 'Chat', ja: '世間話をする', fn: function () { var L = pickL(LINES.chat); custSay(C, L[0], L[1]); } });
    o.push({ icon: 'coffee', en: 'Top off coffee', ja: 'コーヒーを注ぎ足す', fn: function () { sfx('pour', C.seat.eatPos, { len: 0.8 }); C.tipBonus = (C.tipBonus || 0) + 0.25; custSay(C, 'Oh, bless you.', 'あら、ありがとう。'); } });
  } else if (st === 'check') {
    o.push({ icon: 'check', en: 'Bring the check', ja: 'お会計をする', fn: function () { payCustomer(C); } });
  } else return;
  var tableLbl = C.seat ? (C.seat.kind === 'stool' ? 'CTR ' + C.seat.id.slice(1) : 'BOOTH ' + C.seat.booth) : 'WAITING';
  showChoices(C.name.toLowerCase().replace(/(^|[ .])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }), o, { table: tableLbl, no: C.ticket ? C.ticket.no : null });
  if (C.P) C.P.lookAtCam = true;
}
function seatCustomer(C, seat) {
  if (C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'seat') === true) return;
  C.state = 'toSeat'; sfx('click');
  walkTo(C, routeToSeat(seat), function () { sitDown(C, seat); C.state = 'seated'; C.pat = C.patMax = PATIENCE.seated; C.P.lookAtCam = false; if (!C.anomaly || !C.anomaly.manualMenu) giveMenu(C, true); });
  var g = C.arch.id && ARCH_LINES[C.arch.id] ? pickL(ARCH_LINES[C.arch.id].greet) : pickL(LINES.greet);
  if (!C.anomaly || !C.anomaly.mute) custSay(C, g[0], g[1]);
}
function giveMenu(C, auto) {
  if (!auto && C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'menu') === true) return;
  showMenuProp(C); setPose(C.P, 'menu'); C.state = 'reading'; sfx('paper', C.P.root.position); C.readT = 3.5 + Math.random() * 2.5; C.P.lookAtCam = false;
}
function makeOrder(C) {
  var n = 1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0), likes = C.arch.likes || ['coffee', 'pie'], items = [], used = {};
  for (var i = 0; i < n; i++) { var id = Math.random() < 0.75 ? pickL(likes) : pickL(Object.keys(MENU)); if (used[id]) continue; used[id] = 1; items.push({ id: id, done: false, q: 0 }); }
  if (GAME.day === 1 && GAME.min < 40 && items.length > 2) items.length = 2;
  return items;
}
function takeOrder(C) {
  if (C.state !== 'ready') return; // one order per guest, even if the button is tapped twice
  if (C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'order') === true) return;
  C.state = 'ordering';
  hideMenuProp(C); setPose(C.P, 'sit'); C.P.lookAtCam = true;
  C.items = C.forcedItems || makeOrder(C);
  var odd = C.items.filter(function (it) { return it.odd; })[0];
  var L = pickL(LINES.order), en = L[0].replace('{items}', itemsText(C.items, 'en')), ja = L[1].replace('{items}', itemsText(C.items, 'ja'));
  if (odd) { en = 'I\'ll have... ' + odd.odd.say; ja = odd.odd.sayJa; }
  custSay(C, en, ja, { odd: !!odd }).then(function () {
    if (odd) {
      showChoices('"' + odd.odd.en + '"', [
        { icon: 'pencil', en: 'Write it down', ja: '伝票に書く', fn: function () { writeTicket(C); } },
        { icon: 'stop', en: 'Sorry, that\'s not on the menu.', ja: '「メニューにありません」', fn: function () { refuseOdd(C); } }
      ], { noCancel: true, table: C.seat ? C.seat.id : '' });
    } else writeTicket(C);
  });
}
function writeTicket(C) {
  if ((C.ticket && !C.ticket.done) || C.state === 'leaving' || C.state === 'gone') return;
  var T = { no: ++TICKET_NO, cust: C, items: C.items, ready: false, done: false, table: C.seat ? (C.seat.kind === 'stool' ? 'CTR ' + C.seat.id.slice(1) : 'BOOTH ' + C.seat.booth) : '?', t: 0 };
  C.ticket = T; TICKETS.push(T); C.state = 'ordered'; C.pat = C.patMax = PATIENCE.ordered + C.items.length * 25; C.P.lookAtCam = false;
  sfx('pen'); sfx('paper', null, { delay: 0.3 });
  toast('Ticket No.' + T.no + ' → kitchen', '注文票が厨房に入った', 2);
  refreshTickets();
}
// drop tickets nobody is waiting for any more (guest left, or replaced) — Booth 4's ghost ticket stays
function pruneTickets() {
  for (var i = TICKETS.length - 1; i >= 0; i--) { var T = TICKETS[i]; if (T.booth4) continue; var C = T.cust; if (!C || C.ticket !== T || C.state === 'leaving' || C.state === 'gone' || CUSTS.indexOf(C) < 0) { TICKETS.splice(i, 1); if (T.plates) { T.plates.forEach(function (p) { RENDER.scene.remove(p); freeGeo(p); }); T.plates = null; } } }
}
function removeTicket(T) { var i = TICKETS.indexOf(T); if (i >= 0) TICKETS.splice(i, 1); if (T.plates) { T.plates.forEach(function (p) { RENDER.scene.remove(p); freeGeo(p); }); T.plates = null; } refreshTickets(); }
function refuseOdd(C) {
  C.items = C.items.filter(function (it) { return !it.odd; });
  if (C.anomaly && C.anomaly.onRefuse) C.anomaly.onRefuse(C, 'odd');
}
function refuseCustomer(C) {
  // eyes down: camera looks at the floor while saying it
  var keep = CAM.tPitch; CAM.tPitch = -0.55; CAM.locked = true;
  say('YOU', "Sorry. We're closed.", 'すみません。閉店です。', { voice: 'you', cls: 'you', hold: 0.5 }).then(function () {
    CAM.locked = false; CAM.tPitch = keep;
    if (C.anomaly && C.anomaly.onRefuse && C.anomaly.onRefuse(C, 'closed') === true) return;
    if (!C.anomaly) { GAME.refusedNormal++; custSay(C, 'Closed? The sign says open...', '閉店？ 看板は営業中って……'); }
    customerLeave(C, false);
  });
}
function ignoreCustomer(C) {
  if (C.anomaly && C.anomaly.onIgnore && C.anomaly.onIgnore(C) === true) return;
  C.ignored = (C.ignored || 0) + 1; toast('...', '（何も言わずに目をそらした）', 1.6);
}
function serveCustomer(C) {
  if (!C.ticket || !C.ticket.ready) return;
  if (C.ticket.bad && !C.ticket.bad.done) { var BA = C.ticket.bad; C.ticket.served = true; placeDishes(C); sfx('cup', C.seat.eatPos); setPose(C.P, 'eat'); custSay(C, '...It\'s looking at me.', '……これ、こっちを見てる。', { odd: true }).then(function () { anomalyFail(BA, BA.face, { person: C.P, rule: 'badfood' }); }); return; }
  if (C.anomaly && C.anomaly.onServe && C.anomaly.onServe(C, 'serve') === true) return;
  if (C.items.some(function (it) { return it.odd; }) && GAME.oddFail) { GAME.oddFail(C); return; }
  removeTicket(C.ticket); C.ticket.done = true;
  placeDishes(C); sfx('cup', C.seat.eatPos); sfx('cutlery', C.seat.eatPos, { delay: 0.2 });
  C.state = 'eating'; C.eatT = 11 + Math.random() * 7; setPose(C.P, 'eat');
  var L = pickL(LINES.served); custSay(C, L[0], L[1]);
  GAME.served++;
}
function payCustomer(C) {
  var total = 0, q = 0, nq = 0;
  C.items.forEach(function (it) { if (it.odd) return; total += MENU[it.id].price; q += it.q || 0.6; nq++; });
  q = nq ? q / nq : 0.5;
  var pat = C.patSum != null ? C.patSum : 0.7;
  var tip = total * (0.08 + 0.17 * q + 0.1 * pat) + (C.tipBonus || 0) + (C.arch.regular ? 0.5 : 0) + Math.random() * 0.3;
  tip = Math.round(tip * 20) / 20;
  GAME.tips += tip; GAME.sales += total; setTips(GAME.tips, true);
  sfx('print', new THREE.Vector3(6.4, 1.1, 1.7), { n: 14 }); setTimeout(function () { sfx('register', new THREE.Vector3(6.2, 1.1, 1.7)); sfx('coin', null, { delay: 0.4 }); }, 800);
  receiptPop(C, total, tip);
  var L = pickL(LINES.pay); custSay(C, L[0], L[1]);
  C.state = 'paid'; setTimeout(function () { customerLeave(C, false); }, 1800);
}
function receiptPop(C, total, tip) {
  var r = el('div', 'rpop', '<div class="rh">SUNNY SIDE DINER</div>' + C.items.filter(function (i) { return !i.odd; }).map(function (it) { return '<div class="rr"><span>' + MENU[it.id].en.toUpperCase() + '</span><span>' + MENU[it.id].price.toFixed(2) + '</span></div>'; }).join('') + '<div class="rr t"><span>TOTAL</span><span>' + total.toFixed(2) + '</span></div><div class="rr tip"><span>TIP</span><span>+' + tip.toFixed(2) + '</span></div>', UI);
  r.style.backgroundImage = 'url(' + PAPER.receipt + ')';
  setTimeout(function () { r.classList.add('go'); }, 2400); setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 3200);
}
// ---- per-frame customer logic -----------------------------------------------------------------
function updateCustomers(dt) {
  var cp = RENDER.camera.position;
  for (var i = CUSTS.length - 1; i >= 0; i--) {
    var C = CUSTS[i]; C.t += dt;
    moveCustomer(C, dt);
    updatePerson(C.P, dt, cp); if (C.kid) updatePerson(C.kid, dt, cp);
    if (C.anomaly && C.anomaly.update) C.anomaly.update(C, dt);
    if (C.kid && C.kid.doll && GAME.day >= 2 && C.seat && GAME.mode === 'play') dollBeat(C, dt);
    if (C.state === 'reading') { C.readT -= dt; if (C.readT <= 0) { C.state = 'ready'; hideMenuProp(C); setPose(C.P, 'hand'); C.pat = C.patMax = PATIENCE.ready; sfx('pop', C.P.root.position, { vol: 0.3 }); } }
    if (C.state === 'eating') { C.eatT -= dt; if (C.eatT <= 0) { clearDishesLater(C); if (GAME.mode === 'play') payCustomer(C); else { C.state = 'check'; } } }
    var waiting = C.state === 'wait' || C.state === 'seated' || C.state === 'ready' || C.state === 'ordered' || C.state === 'check';
    if (waiting && !C.anomaly && GAME.mode === 'play') {
      C.pat -= dt / (GAME.spd || 1) * (GAME.day > 3 ? 1.1 : 1); // patience runs in real time
      C.patSum = C.patSum == null ? 1 : lerp(C.patSum, C.pat / C.patMax, dt * 0.05);
      if (C.pat <= 0) { var L = pickL(LINES.angry); custSay(C, L[0], L[1]); customerLeave(C, true); }
    }
    if (C.state === 'arrive' && !C.path.length) { C.state = 'wait'; C.pat = C.patMax = PATIENCE.wait; setPose(C.P, 'stand'); C.P.root.rotation.y = -PI * 0.8; }
    updateMarker(C);
  }
}
function clearDishesLater(C) { C.dishes.forEach(function (d) { if (d.userData.em) { steamStop(d.userData.em); d.userData.em = null; } }); }
// ---- attention markers (DOM badges over heads) ------------------------------------------------
var MARK_CSS = [
  '.cmark{position:absolute;width:40px;height:40px;margin:-44px 0 0 -20px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:auto;cursor:pointer;color:#fff8e6;',
  ' background:radial-gradient(circle at 35% 30%,#e8444a,#9e1218);box-shadow:0 0 0 2px #e9edf0,0 4px 10px rgba(0,0,0,.5);transition:opacity .2s;}',
  '.cmark::before{content:"";position:absolute;inset:-6px;border-radius:50%;background:conic-gradient(var(--pc,#8fd3c1) var(--p,100%),rgba(0,0,0,.35) 0);-webkit-mask:radial-gradient(circle,transparent 22px,#000 23px);mask:radial-gradient(circle,transparent 22px,#000 23px);}',
  '.cmark.edge::after{content:"";position:absolute;right:-13px;top:50%;margin-top:-7px;border:7px solid transparent;border-left:9px solid #e9edf0}.cmark.edge.el::after{right:auto;left:-13px;border-left:7px solid transparent;border-right:9px solid #e9edf0}',
  '.cmark .ic{width:18px;height:18px}.cmark.mint{background:radial-gradient(circle at 35% 30%,#b9eedd,#2f7e6e);color:#0c2a24}',
  '.rpop{position:absolute;right:20px;top:calc(var(--top-safe) + 70px);width:170px;padding:14px 14px 18px;font:400 12px/1.5 DotGothic16,monospace;color:#2e2e34;background-size:100% 100%;filter:drop-shadow(0 8px 12px rgba(0,0,0,.5));animation:rpin .9s steps(10) both;transition:transform .6s ease-in,opacity .6s;}',
  '.rpop.go{transform:translateY(-30px) rotate(4deg);opacity:0}.rpop .rh{text-align:center;margin-bottom:6px;letter-spacing:.1em}.rpop .rr{display:flex;justify-content:space-between}.rpop .t{border-top:1px dashed #777;margin-top:4px;padding-top:4px}.rpop .tip{color:#2f7e6e;font-size:14px}',
  '@keyframes rpin{0%{clip-path:inset(0 0 100% 0)}100%{clip-path:inset(0 0 0 0)}}'
].join('\n');
var _mv = null;
function turnToward(p) {
  var st = STATIONS[CAM.station], cam = RENDER.camera.position, yaw = Math.atan2(p.x - cam.x, p.z - cam.z);
  CAM.tYaw = CAM.tYaw + angDiff(CAM.yaw + CAM.tYaw, yaw); CAM.tPitch = -0.1; sfx('click');
}
function updateMarker(C) {
  if (!C.marker) { C.marker = el('div', 'cmark', '', U.layer); }
  var need = { wait: 'seat', seated: 'menu', ready: 'pencil', check: 'check' }[C.state];
  if (C.state === 'ordered' && C.ticket && C.ticket.ready) need = 'serve';
  if (C.anomaly && C.anomaly.hideMarker) need = null;
  var vis = need && GAME.mode === 'play' && !MINI.active && !DOC.open && !CAM.inFreezer && !CAM.outside && CAM.station !== 'KITCHEN' && CAM.station !== 'FREEZER' && CAM.station !== 'BACKDOOR';
  var edge = 0;
  if (vis) {
    if (!_mv) _mv = new THREE.Vector3();
    C.P.parts.head.getWorldPosition(_mv); _mv.y += 0.32;
    var d = _mv.distanceTo(RENDER.camera.position);
    var loc = _mv.clone().applyMatrix4(RENDER.camera.matrixWorldInverse);
    _mv.project(RENDER.camera);
    if (d > 14) vis = false;
    else if (loc.z > 0 || _mv.x < -1 || _mv.x > 1) { edge = (loc.z > 0 ? -Math.sign(loc.x || 1) : Math.sign(_mv.x)) || 1; }
    var x = edge ? (edge < 0 ? 40 : RENDER.w - 40) : (_mv.x * 0.5 + 0.5) * RENDER.w, y = edge ? RENDER.h * 0.45 : (-_mv.y * 0.5 + 0.5) * RENDER.h; var top = 118 + 70; if (y < top) y = top; if (y > RENDER.h - 260) y = RENDER.h - 260; x = clamp(x, 40, RENDER.w - 40);
    C.marker.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + (edge ? 0.9 : clamp(3.2 / d, 0.65, 1.1)).toFixed(2) + ')'; C.marker.style.left = '0'; C.marker.style.top = '0';
  }
  if (C.marker._edge !== edge) { C.marker._edge = edge; C.marker.classList.toggle('edge', !!edge); C.marker.classList.toggle('el', edge < 0); C.marker._n = null;
    if (!C.marker._tap) { C.marker._tap = 1; onTap(C.marker, function () { if (C.marker._edge) turnToward(C.P.root.position); else tapCustomer(C); }); } }
  C.marker.style.display = vis ? 'flex' : 'none';
  if (vis) {
    if (C.marker._n !== need) { C.marker.innerHTML = icon(need, 18) + (edge ? '<i class="arw"></i>' : ''); C.marker._n = need; C.marker.classList.toggle('mint', need === 'serve'); }
    var pr = clamp(C.pat / (C.patMax || 1), 0, 1); C.marker.style.setProperty('--p', Math.round(pr * 100) + '%'); C.marker.style.setProperty('--pc', pr > 0.5 ? '#8fd3c1' : pr > 0.25 ? '#ffd36a' : '#ff4f4f');
  }
}
// ---- ticket rail (kitchen) ------------------------------------------------------------------
var RAIL_CSS = [
  '.rail{position:absolute;left:16px;right:16px;top:calc(var(--top-safe) + 66px);display:flex;gap:10px;justify-content:center;flex-wrap:wrap;pointer-events:none;transition:opacity .3s;}',
  '.tk{position:relative;width:86px;min-height:96px;padding:18px 8px 8px;background-size:100% 100%;color:#1d2f6f;font:400 14px/1.15 "Shadows Into Light",cursive;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));transform:rotate(var(--r));transition:transform .15s;}',
  '.tk:active{transform:rotate(var(--r)) translateY(3px)}',
  '.tk::before{content:"";position:absolute;left:50%;top:-6px;width:30px;height:12px;margin-left:-15px;background:linear-gradient(#e9edf0,#8a939b);border-radius:3px;box-shadow:0 2px 3px rgba(0,0,0,.4)}',
  '.tk .no{position:absolute;left:8px;right:8px;top:5px;display:flex;justify-content:space-between;gap:4px;font:600 8.5px/1 Oswald,sans-serif;letter-spacing:.12em;color:#2f7e6e}',
  '.tk .it{display:block}.tk .it.d{text-decoration:line-through;color:#6a7aa0}.tk .it.o{color:#5a1010;text-shadow:0 0 2px rgba(120,0,0,.5)}',
  '.tk.ready{box-shadow:none}.tk.ready::after{content:"READY";position:absolute;right:-6px;bottom:6px;transform:rotate(-12deg);font:400 13px/1 "Alfa Slab One",serif;color:#c8282e;border:2px solid #c8282e;padding:2px 4px;border-radius:3px;background:rgba(255,255,255,.4)}'
].join('\n');
function buildRail() {
  var st = document.createElement('style'); st.textContent = MARK_CSS + '\n' + RAIL_CSS; (document.head || document.documentElement).appendChild(st);
  U.rail = el('div', 'rail', '', UI); U.rail.style.display = 'none';
}
function refreshTickets() {
  pruneTickets();
  if (!U.rail) return;
  U.rail.innerHTML = '';
  TICKETS.forEach(function (T, i) {
    var h = '<div class="no"><span>No.' + T.no + '</span><span>' + T.table + '</span></div>';
    T.items.forEach(function (it) { h += '<span class="it' + (it.done ? ' d' : '') + (it.odd ? ' o' : '') + '">' + (it.odd ? it.odd.en : MENU[it.id].en) + '</span>'; });
    var d = el('div', 'tk' + (T.ready ? ' ready' : ''), h, U.rail); d.style.backgroundImage = 'url(' + PAPER.ticket + ')'; d.style.setProperty('--r', ((i % 3) - 1) * 2.2 + 'deg');
    onTap(d, function () { tapTicket(T); });
  });
  U.rail.style.display = CAM.station === 'KITCHEN' && TICKETS.length && GAME.mode === 'play' && !MINI.active ? '' : 'none';
}
function tapTicket(T) {
  if (MINI.active) return;
  var o = [];
  T.items.forEach(function (it) {
    if (it.done) return;
    if (it.odd) o.push({ icon: 'cook', en: 'Make "' + it.odd.en + '"', ja: '「' + it.odd.ja.replace(/[「」]/g, '') + '」を作る', warn: true, fn: function () { if (T.you) ANOM.youticket.cook(T.you); else cookOdd(T, it); } });
    else o.push({ icon: MENU[it.id].icon, en: 'Make ' + MENU[it.id].en, ja: MENU[it.id].ja + 'を作る', fn: function () { cookItem(T, it); } });
  });
  o.push({ icon: 'tear', en: 'Tear up ticket', ja: '伝票を破って捨てる', minor: true, fn: function () { tearTicket(T); } });
  showChoices('No.' + T.no + ' — ' + T.table, o, { no: T.no, table: T.table });
}
function cookItem(T, it) { startMini(MENU[it.id].mini, function (q, badA) { it.done = true; it.q = q; if (badA) { it.bad = badA; T.bad = badA; badA.ticket = T; } afterCook(T); }); }
// NEXT TICKET: start the next dish straight away (only odd tickets need a decision)
function quickCook(T) { if (MINI.active) return; var it = T.items.filter(function (x) { return !x.done; })[0]; if (!it) return; if (it.odd) { tapTicket(T); return; } cookItem(T, it); }
function cookOdd(T, it) { sfx('sizzle', new THREE.Vector3(0.9, 0.9, -4.7), { len: 2 }); it.done = true; it.q = 0; afterCook(T); toast('It smells... sweet.', '……甘いにおいがする。', 2.5); }
function tearTicket(T) {
  sfx('tearPaper'); removeTicket(T); T.torn = true;
  if (T.onTear) { T.onTear(); return; }
  if (T.cust && T.cust.state === 'ordered') { custSay(T.cust, 'Hey! Where\'s my food?', 'ちょっと！ 料理は？'); customerLeave(T.cust, true); }
}
function afterCook(T) {
  refreshTickets();
  if (T.items.every(function (it) { return it.done; })) {
    T.ready = true; sfx('orderBell', new THREE.Vector3(1.4, 1.4, -2.8));
    say('YOU', 'Order up!', 'できたよ！（オーダーアップ）', { voice: 'you', cls: 'you', silent: !SAVE.settings.voiceMode || true, hold: 0.4 }); TALK.busy = false;
    // plates on the pass shelf
    T.plates = []; T.items.forEach(function (it, i) { var d = dishMesh(it.odd ? 'odd' : it.id); d.position.set(0.6 + (TICKETS.indexOf(T) * 0.5 + i * 0.25) % 2.1, 1.28, -2.8); RENDER.scene.add(d); T.plates.push(d); });
    if (T.onReady) T.onReady();
    refreshTickets();
  }
}

// the kid's doll slowly turns its head to watch you (and, for a blink, isn't a doll)
function dollBeat(C, dt) {
  var d = C.kid.doll, h = d.userData.head; C.dollT = (C.dollT || (8 + Math.random() * 20)) - dt;
  if (C.dollT > 0) { h.rotation.y = damp(h.rotation.y, 0, 2, dt); return; }
  var cam = RENDER.camera.position, wp = new THREE.Vector3(); h.getWorldPosition(wp);
  var inv = new THREE.Matrix4().copy(d.matrixWorld).invert(), lp = cam.clone().applyMatrix4(inv);
  h.rotation.y = damp(h.rotation.y, Math.atan2(lp.x, lp.z), 1.2, dt);
  if (C.dollT < -3.5 && !C.dollFlash && wp.distanceTo(cam) < 7) {
    C.dollFlash = 1; var n = pickFace(['doll'], 'doll'), old = d.userData.headMat.map;
    d.userData.headMat.map = toTex(horrorCanvas(n), { clamp: true }); d.userData.headMat.needsUpdate = true; sfx('whisper', wp, { vol: 0.4 });
    setTimeout(function () { d.userData.headMat.map = old; d.userData.headMat.needsUpdate = true; }, 220);
  }
  if (C.dollT < -7) { C.dollT = 25 + Math.random() * 30; C.dollFlash = 0; }
}
