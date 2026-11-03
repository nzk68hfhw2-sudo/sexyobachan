// ---- lore: clippings, flyers, polaroids, receipts, diary scraps -----------------------
var LORE = [
  { id: 'l01', y: 1958, t: 'Opening day photo', ja: '開店の日の写真', kind: 'polaroid', make: function () { return docPolaroid(photoCanvas('diner', 320, 240, 1), 'Opening day! June \'58', '「開店の日！ 1958年6月」 ハル、ジューン、そして小さなデイジー'); } },
  { id: 'l02', y: 1961, t: 'KXDR commercial', ja: 'テレビCMの記事', kind: 'news', make: function () { return docNews({ date: 'Thursday, March 9, 1961 — Five Cents', head: 'Diner Jingle Is Talk Of The Valley', img: photoCanvas('diner', 320, 180, 2), body: ['The cheerful KXDR spot for the Sunny Side Diner on Highway 9 — featuring a smiling egg in a chef\'s hat — has become the most requested commercial of the season.', '"Our daughter drew him," said owner June Mercer. "Rise and shine, that\'s his catchphrase."'], ja: '1961年3月9日。ハイウェイ9号線のサニーサイド・ダイナーのCMが大人気。コック帽の笑う卵は、店主ジューン・マーサーの娘が描いたもの。「口ぐせは Rise and shine」。' }); } },
  { id: 'l03', y: 1958, t: 'Daisy\'s drawing', ja: 'デイジーの絵', kind: 'drawing', make: function () { var c = mkCanvas(340, 300), g = c.getContext('2d'); g.fillStyle = '#f7f1e3'; g.fillRect(0, 0, 340, 300); drawSunny(g, 170, 140, 70, { line: true, ink: '#d23', scribble: 3 }); g.font = '26px ' + F.hand; g.fillStyle = '#2244aa'; g.fillText('SUNNY by Daisy age 6', 40, 280); return docPolaroid(c.toDataURL(), 'SUNNY — by Daisy, age 6', 'デイジー（6歳）が描いた Sunny。ここから全部はじまった。'); } },
  { id: 'l04', y: 1964, t: 'Girl missing after sandstorm', ja: '砂嵐の夜の行方不明', kind: 'news', make: function () { return docNews({ date: 'Saturday, August 22, 1964', head: 'Girl, 12, Missing After Desert Sandstorm', img: photoCanvas('girl', 260, 220, 4), body: ['Daisy Mercer, 12, daughter of the Sunny Side Diner owners, disappeared from the diner\'s parking lot during Friday night\'s storm.', 'A trucker told deputies he saw the girl "waving at a man in the egg costume" moments before the dust rolled in. The diner owns no such costume.'], ja: '1964年8月22日。店主の娘デイジー（12歳）が砂嵐の夜、駐車場から消えた。トラック運転手は「卵の着ぐるみの男に手を振っていた」と証言。だが店にそんな着ぐるみはない。' }); } },
  { id: 'l05', y: 1964, t: 'MISSING: Daisy Mercer', ja: '行方不明のチラシ（デイジー）', kind: 'flyer', make: function () { return docFlyer({ img: photoCanvas('girl', 260, 260, 5), body: ['DAISY MERCER', 'Age 12 · Brown hair · Yellow dress', 'Last seen Aug 21, 1964 — Sunny Side Diner, Hwy 9', 'If found, leave the light on.'], ja: 'デイジー・マーサー 12歳。黄色いワンピース。1964年8月21日、サニーサイド・ダイナーで最後に目撃。「見つけたら、明かりをつけておいて」。' }); } },
  { id: 'l06', y: 1965, t: 'Hal\'s note', ja: 'ハルのメモ', kind: 'diary', make: function () { return docDiary('Jan 1965.<br>From tonight we don\'t close. Not for holidays, not for storms. The sign stays lit so she can find her way home. June says I\'m crazy. June leaves the porch light on too.', '1965年1月。今夜から店は閉めない。祝日も嵐でも。娘が帰り道を見つけられるよう、看板は消さない。ジューンはおれをおかしいと言う。でも彼女も玄関の明かりを消さない。'); } },
  { id: 'l07', y: 1972, t: 'MISSING: Tom Reyes', ja: '行方不明のチラシ（トム）', kind: 'flyer', make: function () { return docFlyer({ img: photoCanvas('man', 260, 260, 7), body: ['TOM REYES', 'Age 34 · Long-haul trucker', 'Truck found running at the Sunny Side Diner lot, Oct 1972.', 'Coffee on the counter was still warm.'], ja: 'トム・レイエス 34歳、長距離運転手。1972年10月、トラックはエンジンがかかったまま駐車場で見つかった。カウンターのコーヒーはまだ温かかった。' }); } },
  { id: 'l08', y: 1977, t: 'MISSING: Linda Faye', ja: '行方不明のチラシ（リンダ）', kind: 'flyer', make: function () { return docFlyer({ img: photoCanvas('woman', 260, 260, 8), body: ['LINDA FAYE', 'Singer · 26 · Red coat', 'Stopped for pie on her way to Vegas. Never arrived.', 'The jukebox was playing her song.'], ja: 'リンダ・フェイ 歌手 26歳。ラスベガスへ行く途中にパイを食べに寄り、それきり。ジュークボックスでは彼女の曲がかかっていた。' }); } },
  { id: 'l09', y: 1979, t: 'Owner vanishes', ja: '店主が消えた', kind: 'news', make: function () { return docNews({ date: 'Saturday, November 24, 1979', head: 'Diner Owner Vanishes Mid-Shift; "Griddle Still On"', img: photoCanvas('night', 320, 180, 9), body: ['Hal Mercer, 51, was not found when deputies answered a call from his wife at dawn. The griddle was hot. Eleven plates were set at the counter, each with a fried egg, sunny side up.', 'Mrs. Mercer has refused to close the diner.'], ja: '1979年11月24日。店主ハル・マーサーが夜勤中に消えた。鉄板は熱いまま、カウンターには目玉焼きをのせた皿が11枚並んでいた。妻は店を閉めることを拒んでいる。' }); } },
  { id: 'l10', y: 1979, t: 'Receipt, Nov 23 1979', ja: '1979年11月23日のレシート', kind: 'receipt', make: function () { return docReceipt('<div class="c big">SUNNY SIDE DINER</div><div class="c">HWY 9 · OPEN 24 HRS</div><hr><div class="r"><span>11/23/79</span><span>03:00 AM</span></div><div class="r"><span>TABLE</span><span>BOOTH 4</span></div><hr>' + ['TOM', 'LINDA', 'DAISY', '????', '????', '????', '????', '????', '????', '????', 'HAL'].map(function (n) { return '<div class="r"><span>EGG S/S (' + n + ')</span><span>0.00</span></div>'; }).join('') + '<hr><div class="r big"><span>TOTAL</span><span>0.00</span></div><div class="c">RISE AND SHINE!</div><div class="jp" style="margin-top:10px;font:500 11px/1.5 \'Zen Kaku Gothic New\'">1979年11月23日 午前3時、4番席。目玉焼き11皿。名前の中には、消えた人たちがいる。</div>', false); } },
  { id: 'l11', y: 1983, t: 'Help wanted ad', ja: '求人広告', kind: 'news', make: function () { return docNews({ date: 'Classifieds — Monday, June 6, 1983', head: 'NIGHT SHIFT WANTED', body: ['Sunny Side Diner, Hwy 9. No experience needed! Room & board. Must follow simple rules. Ask for June. We\'ll keep the light on for you.'], ja: '1983年6月6日の求人欄。「深夜スタッフ募集・未経験OK。住み込み可。かんたんなルールを守れる方。ジューンまで。明かりをつけて、待っています」' }); } },
  { id: 'l12', y: 1983, t: 'Dale\'s diary — night 5', ja: 'デールの日記（5日目）', kind: 'diary', make: function () { return docDiary('Night 5. June came at dawn and said "Rise and shine." The other one said my name first. I hid like the rules said. June gave me a key and said: <u>you\'re one of us now, Dale.</u>', '5日目。夜明けにジューンが来て「Rise and shine」と言った。その前に来たやつは、おれの名前を呼んだ。ルールどおり隠れた。ジューンは鍵をくれて言った。「これであんたも、うちの人間だよ」'); } },
  { id: 'l13', y: 1987, t: 'Polaroid: the costume', ja: 'ポラロイド：着ぐるみ', kind: 'polaroid', make: function () { return docPolaroid(photoCanvas('costume', 320, 240, 13), 'who is in the suit??', '「着ぐるみの中は、だれ？」 駐車場で撮られた一枚'); } },
  { id: 'l14', y: 1991, t: 'June\'s letter', ja: 'ジューンの手紙', kind: 'diary', make: function () { return docDiary('To whoever works the night: the light isn\'t to bring customers in. It\'s for them — the ones who never left. They come back every night and sit where they sat. Be kind. Serve them only what they ordered when they were alive.', '夜勤のあなたへ。明かりは客を呼ぶためじゃない。帰れなかった人たちのためのもの。あの人たちは毎晩戻ってきて、同じ席に座る。やさしくしてあげて。生きていたころ頼んだものだけを出してあげて。'); } },
  { id: 'l15', y: 2001, t: 'Dale\'s last page', ja: 'デールの最後のページ', kind: 'diary', make: function () { return docDiary('I don\'t sleep anymore. I\'m the voice on the phone now, the one who tells the new kid the rules. Sunny isn\'t a mascot. Sunny is the diner\'s face — the smile it puts on so you\'ll come in. Five nights, and it keeps you. Someone has to keep the light on.', 'もう眠らない。今のおれは電話の声だ。新人にルールを教える係。Sunny はマスコットじゃない。店そのものの顔——中に入ってもらうための笑顔だ。5夜を越えると、店はその人を手放さない。だれかが明かりをつけていなきゃならないんだ。'); } }
];
var LORE_SPOTS = [
  { p: [2.55, 0.785, 4.55], st: ['BOOTHS', 'COUNTER'] }, { p: [-2.55, 1.06, -1.42], st: ['COUNTER'] }, { p: [-7.45, 1.565, 2.8], st: ['JUKEBOX'] },
  { p: [6.95, 1.045, 1.62], st: ['REGISTER'] }, { p: [-4.7, 1.115, -4.88], st: ['KITCHEN', 'BACKDOOR'] }, { p: [7.55, 1.42, -3.55], st: ['FREEZER'] },
  { p: [4.25, 1.06, -1.38], st: ['COUNTER'] }, { p: [-1.6, 0.955, 4.86], st: ['BOOTHS'] }, { p: [5.85, 0.012, 4.35], st: ['DOOR', 'REGISTER'] },
  { p: [-9.4, 0.012, 0.25], st: ['JUKEBOX'] }, { p: [-3.6, 0.785, 4.6], st: ['BOOTHS'] }
];
var LORE_OBJS = [];
var SPARK_TEX = null;
function sparkTex() { if (SPARK_TEX) return SPARK_TEX; var c = mkCanvas(64, 64), g = c.getContext('2d'); var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,240,200,0.5)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 4); g.lineTo(32, 60); g.moveTo(4, 32); g.lineTo(60, 32); g.stroke(); SPARK_TEX = toTex(c, { clamp: true }); return SPARK_TEX; }
function spawnLoreForNight(day) {
  clearLore();
  var have = SAVE.lore || {}, want = LORE.filter(function (l, i) { return !have[l.id] && Math.floor(i / 3) < day; });
  want.sort(function (a, b) { return LORE.indexOf(a) - LORE.indexOf(b); });
  want = want.slice(0, 4);
  var spots = LORE_SPOTS.slice().sort(function () { return Math.random() - 0.5; });
  want.forEach(function (L, i) {
    var s = spots[i], g = new THREE.Group(); g.position.set(s.p[0], s.p[1], s.p[2]);
    var c = mkCanvas(64, 64), cg = c.getContext('2d'); cg.fillStyle = L.kind === 'news' ? '#d9cfb4' : L.kind === 'polaroid' ? '#f5f2ea' : L.kind === 'receipt' ? '#f2f0ea' : '#efe4c8'; cg.fillRect(0, 0, 64, 64); cg.fillStyle = 'rgba(40,40,40,0.5)'; for (var k = 0; k < 7; k++) cg.fillRect(8, 10 + k * 7, 30 + Math.random() * 18, 2); if (L.kind === 'polaroid') { cg.fillStyle = '#555'; cg.fillRect(6, 6, 52, 40); }
    var pm = mesh(new THREE.PlaneGeometry(0.14, 0.11), new THREE.MeshStandardMaterial({ map: toTex(c, { clamp: true }), roughness: 0.8, side: THREE.DoubleSide }), 0, 0.004, 0, g, false); pm.rotation.x = -PI / 2; pm.rotation.z = Math.random() * 3;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex(), color: new THREE.Color(2, 1.9, 1.6), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(0.12, 0.12, 1); sp.position.y = 0.04; g.add(sp); g.userData.spark = sp;
    var hit = mesh(new THREE.BoxGeometry(0.4, 0.25, 0.4), new THREE.MeshBasicMaterial({ visible: false }), 0, 0.08, 0, g, false);
    RENDER.scene.add(g); LORE_OBJS.push(g);
    addPick(hit, function () { pickLore(L, g); }, { stations: s.st.concat(s.p[2] < -2.8 && s.p[0] > 5 ? ['FREEZER'] : []) });
  });
}
function clearLore() { LORE_OBJS.forEach(function (g) { g.traverse(function (o) { removePick(o); }); RENDER.scene.remove(g); }); LORE_OBJS = []; }
function updateLore(dt, t) { LORE_OBJS.forEach(function (g, i) { var s = g.userData.spark; if (s) { var k = Math.max(0, Math.sin(t * 2.2 + i * 1.7)); s.material.opacity = 0.15 + Math.pow(k, 6) * 0.85; s.scale.setScalar(0.06 + Math.pow(k, 6) * 0.1); } }); }
function pickLore(L, g) {
  if (MINI.active || TALK.busy) return;
  var i = LORE_OBJS.indexOf(g); if (i >= 0) LORE_OBJS.splice(i, 1); g.traverse(function (o) { removePick(o); }); RENDER.scene.remove(g);
  giveLore(L.id);
}
function giveLore(id) {
  var L = LORE.filter(function (l) { return l.id === id; })[0];
  if (!L) { L = LORE.filter(function (l) { return !SAVE.lore[l.id]; })[0]; if (!L) return; }
  var isNew = !SAVE.lore[L.id]; SAVE.lore[L.id] = 1; writeSave();
  GAME.paused = true;
  openDocs(L.make() + '<div class="doccap">' + L.y + ' · ' + L.t.toUpperCase() + ' — ' + L.ja + (isNew ? '<br>NEW RECORD ADDED TO THE ARCHIVE / 記録に追加' : '') + ' (' + loreCount() + '/15)</div>', { onClose: function () { GAME.paused = false; } });
}
function loreCount() { var n = 0; LORE.forEach(function (l) { if (SAVE.lore[l.id]) n++; }); return n; }
