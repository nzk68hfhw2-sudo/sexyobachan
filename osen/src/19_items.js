// ---- アイテム（持つ・置く・投げる・回す・積む・大小・いじる・合成・カバン） --------------------------
// 形ごとの基本情報：n=名前 d=説明 m=重さ roll=転がる sp=いじり方 [名前, 処理]
var ITEM_INFO = {
  vend: { n: '自動販売機', m: 60, sp: ['ボタンを押す', function (it) { spawnFrom(it, 'can'); sfx('coin'); }] },
  ticket: { n: '券売機', m: 25, sp: ['きっぷを買う', function (it) { spawnFrom(it, 'kippu'); sfx('coin'); }] },
  cone: { n: 'カラーコーン', m: 0.8, sp: ['かぶる', function (it) { wearOnHead(it); }] },
  trash: { n: 'ゴミ箱', m: 3, sp: ['ふたを開けてひっくり返す', function (it) { spawnFrom(it, pick(['can', 'flyer', 'star'])); spawnFrom(it, 'can'); sfx('pop'); }] },
  phone: { n: '公衆電話', m: 6, sp: ['受話器を取る', function (it) { caption(pick(['「もしもし、わたしです」', '「さっきの　わたしです」', '「この電話は　あなたです」']), { preset: 'type', speak: true }); sfx('babble', 5); }] },
  timetable: { n: '時刻表', m: 4, sp: ['時刻を見る', function () { G.tod = (Math.floor(G.tod) + 1) % 4 + 0.02; sysMsg('時刻表を見たら、時間が進んだ。'); sfx('chime'); }] },
  bird: { n: 'ハト', m: 0.4, sp: ['飛ばす', function (it) { it.body.vel.set(rand(-2, 2), 9, rand(-2, 2)); it.body.thrownT = 1; wake(it); sfx('crow'); }] },
  umbrella: { n: '傘', m: 0.6, sp: ['開く／とじる', function (it) { it.open = !it.open; it.inner.scale.set(it.open ? 2.2 : 1, 1, it.open ? 2.2 : 1); if (it === ITEMS.held && it.open) { P.floatT = 1.2; sysMsg('傘で　ふわっと浮いた。'); } sfx('whoosh'); }] },
  register: { n: 'レジ', m: 4, sp: ['チーンと鳴らす', function (it) { spawnFrom(it, 'coinitem'); sfx('coin'); }] },
  onigiri: { n: 'おにぎり', m: 0.2, sp: ['食べる', function (it) { eat(it, 25, 'おにぎりを食べた。具はおにぎりだった。'); }] },
  cup: { n: 'コーヒーカップ', m: 0.3, sp: ['飲む', function (it) { G.genki = Math.min(100, G.genki + 10); P.speedMul = 1.6; P.speedT = 8; sysMsg('コーヒーを飲んだ。カレーの味。足が速くなった。'); sfx('splash'); }] },
  radio: { n: 'ラジオ', m: 1.5, sp: ['スイッチを入れる', function () { var ks = Object.keys(SONGS); bgmPlay(pick(ks)); G.musicLock = 40; sysMsg('ラジオから　よにん放送が　流れ出した。'); }] },
  gacha: { n: 'ガチャ', m: 12, sp: ['ハンドルを回す', function (it) { spawnFrom(it, 'capsule'); sfx('pop'); }] },
  cabbage: { n: 'キャベツ', m: 3, roll: 0, sp: ['葉をむく', function (it) { if (it.body.scale > 0.4) { setScale(it, it.body.scale * 0.8); spawnFrom(it, 'leaf'); } sfx('pop'); }] },
  fish: { n: '魚', m: 4, sp: ['ピチピチさせる', function (it) { it.body.vel.y = 5; it.body.av.set(rand(-8, 8), rand(-8, 8), rand(-8, 8)); wake(it); sfx('splash'); }] },
  mic: { n: 'マイク', m: 2, sp: ['歌う', function () { caption('♪　ぬるい　ぬるい　ぬるま川〜　♪', { preset: 'wave', speak: true }); confetti(10); }] },
  barber: { n: '回るやつ', m: 5, sp: ['速く回す', function (it) { it.spinFast = 8; sfx('whoosh'); }] },
  tanuki: { n: 'たぬきの置物', m: 9, sp: ['お腹をたたく', function (it) { sfx('boing'); it.inner.scale.set(1.15, 0.9, 1.15); setTimeout(function () { it.inner.scale.set(1, 1, 1); }, 200); }] },
  daruma: { n: 'だるま', m: 2, sp: ['目を描く', function (it) { it.eyes = (it.eyes || 1) + 1; sysMsg('だるまに目を描いた。目が' + it.eyes + 'つになった。'); sfx('chime'); if (it.eyes >= 2) setScale(it, Math.min(3, it.body.scale * 1.2)); }] },
  garapon: { n: '福引き', m: 10, sp: ['ガラガラ回す', function (it) { it.spinFast = 3; spawnFrom(it, 'tama'); sfx('pop'); }] },
  cart: { n: 'カート', m: 6, sp: ['思いきり押す', function (it) { var f = P.face; it.body.vel.set(-Math.sin(f) * 9, 1, -Math.cos(f) * 9); it.body.thrownT = 1.5; wake(it); sfx('whoosh'); }] },
  hydrant: { n: '消火栓', m: 20, sp: ['水を出す', function (it) { itemsBlast(it.body.pos, 4, 5); sfx('splash'); sysMsg('水が出た。やる気だった。'); }] },
  bike: { n: '自転車', m: 12, sp: ['ベルを鳴らす', function () { sfx('click'); setTimeout(function () { sfx('click'); }, 120); P.speedMul = 1.8; P.speedT = 6; sysMsg('チリンチリン。足が速くなった気がする。'); }] },
  tv: { n: 'テレビ', m: 10, sp: ['チャンネルを変える', function (it) { G.tintT = 6; G.tintC = new THREE.Color().setHSL(Math.random(), 0.8, 0.7); sysMsg('チャンネル' + randi(1, 12) + '：この部屋が映っている。'); sfx('click'); }] },
  kotatsu: { n: 'こたつ', m: 15, sp: ['みかんを出す', function (it) { spawnFrom(it, 'mikan'); sfx('pop'); }] },
  fridge: { n: '冷蔵庫', m: 40, sp: ['開ける', function (it) { G.fogT = 8; G.fogC = new THREE.Color(0xd8f0ff); spawnFrom(it, pick(['fish', 'mikan', 'onigiri'])); sfx('whoosh'); }] },
  washer: { n: '洗濯機', m: 30, sp: ['回す', function (it) { it.spinFast = 6; cleanPollution(3); }] },
  mailbox: { n: '集合ポスト', m: 20, sp: ['開ける', function (it) { spawnFrom(it, 'flyer'); spawnFrom(it, 'flyer'); sfx('pop'); }] },
  bags: { n: 'ゴミ袋', m: 2, sp: ['やぶる', function (it) { spawnFrom(it, 'monday'); sysMsg('月曜日が出てきた。'); sfx('pop'); }] },
  cat: { n: 'ねこ', m: 3, sp: ['なでる', function (it) { it.follow = 30; sfx('meow'); sysMsg('ねこが　ついてくるようになった（３０秒）。'); }] },
  plant: { n: '植木鉢', m: 4, sp: ['水をあげる', function (it) { setScale(it, Math.min(3, it.body.scale * 1.25)); sfx('grow'); }] },
  bucket: { n: 'バケツ', m: 0.6, sp: ['ふる', function (it) { spawnFrom(it, 'star'); sfx('chime'); }] },
  toilet: { n: '便器', m: 25, sp: ['流す', function () { sfx('splash'); cleanPollution(3); G.skyHue = Math.random(); G.skyT = 12; }] },
  duck: { n: 'アヒル', m: 0.3, roll: 0, sp: ['鳴かせる', function (it) { sfx('quack'); it.body.vel.y = 3; wake(it); }] },
  flower: { n: '謎の花', m: 0.5, sp: ['話しかける', function () { caption('花「' + pick(['こんにちは', 'さっきも言いました', 'わたしは花です', 'ぬるいですね']) + '」', { preset: 'type', speak: true }); }] },
  boot: { n: '長ぐつ', m: 1, sp: ['ふる', function (it) { spawnFrom(it, pick(['smallfish', 'smallfish', 'boot'])); sfx('splash'); }] },
  rod: { n: 'つりざお', m: 1, sp: ['つる', function (it) { spawnFrom(it, pick(['smallfish', 'boot', 'can', 'star', 'duck'])); sfx('whoosh'); }] },
  tire: { n: 'タイヤ', m: 8, roll: 1, sp: ['転がす', function (it) { var f = P.face; it.body.vel.set(-Math.sin(f) * 8, 0.5, -Math.cos(f) * 8); wake(it); }] },
  frog: { n: 'カエル', m: 0.3, sp: ['はねさせる', function (it) { it.body.vel.set(rand(-3, 3), 7, rand(-3, 3)); wake(it); sfx('boing'); }] },
  crown: { n: '王冠', m: 0.5, sp: ['かぶる', function (it) { wearOnHead(it); popWA('王様', { style: 2, y: 0.25 }); }] },
  oldtv: { n: '古いテレビ', m: 20, sp: ['たたく', function () { G.tintT = 4; G.tintC = new THREE.Color(0x88ff88); sfx('error'); }] },
  sofa: { n: 'ソファ', m: 25, sp: ['すわる', function () { P.gesture = { id: 'sit', t: 0 }; G.genki = Math.min(100, G.genki + 15); cleanPollution(2); }] },
  roadsign: { n: '謎の標識', m: 6, sp: ['回す', function (it) { it.body.av.y = 12; wake(it); }] },
  bell: { n: '鈴', m: 3, fixed: 1, sp: ['鳴らす', function () { sfx('bell'); }] },
  omikuji: { n: 'おみくじ箱', m: 2, sp: ['ふる', function (it) { spawnFrom(it, 'kuji'); sfx('pop'); }] },
  ema: { n: '絵馬', m: 6, sp: ['願いを書く', function () { say(pick(['ワードアートが上手になりますように', '８人と友達になれますように', '汚染率が下がりますように'])); }] },
  mirror: { n: '鏡', m: 10, sp: ['のぞく', function () { popWA(PLAYER.name, { style: 0, y: 0.3 }); }] },
  postbox: { n: 'ポスト', m: 15, sp: ['手紙を出す', function (it) { spawnFrom(it, 'letter'); sfx('pop'); }] },
  door: { n: 'ドア', m: 10 }
};
// 町の中で生まれる物・合成で生まれる物
var EXTRA_TYPES = {};
function X(id, name, desc, mass, build, o) { o = o || {}; EXTRA_TYPES[id] = { name: name, desc: desc, mass: mass, build: build, roll: o.roll, sp: o.sp, temp: o.temp }; }
function P2(g2, geo, col, x, y, z, sx, sy, sz, rx, ry, rz) { return part(g2, geo, typeof col === 'number' ? pm(col, true) : col, x, y, z, sx, sy, sz, rx, ry, rz); }
function sub(g2, type, x, y, z, s, ry, tint) { var o = new THREE.Group(); (BUILD[type] || EXTRA_TYPES[type].build)(o, {}); o.position.set(x || 0, y || 0, z || 0); o.scale.setScalar(s || 1); o.rotation.y = ry || 0; if (tint) o.traverse(function (m) { if (m.material) { m.material = m.material.clone(); m.material.color && m.material.color.multiply(new THREE.Color(tint)); } }); g2.add(o); return o; }
// ---- 町で手に入る物 ----
X('can', '缶ジュース', '自販機から出た缶。味は「ある」。飲むと げんき が少しもどる。', 0.35, function (g2) { P2(g2, PG.cyl, pick([0xe03030, 0x3070e0, 0xf0c020, 0x30b050]), 0, 0.12, 0, 0.06, 0.24, 0.06); P2(g2, PG.cyl, 0xcccccc, 0, 0.245, 0, 0.055, 0.01, 0.055); }, { roll: 1, sp: ['飲む', function (it) { eat(it, 12, 'ゴクゴク。味：ある。'); }] });
X('kippu', 'きっぷ', '「ここ」行きのきっぷ。もう着いている。', 0.05, function (g2) { P2(g2, PG.box, 0xf0e8b0, 0, 0.01, 0, 0.3, 0.02, 0.16); P2(g2, PG.box, 0x3060c0, -0.08, 0.021, 0, 0.08, 0.005, 0.12); }, { sp: ['使う', function (it) { var w = pick(WARP_POINTS); removeItem(it); teleport(w[0], groundAt(w[0], w[2], 30, 0.3), w[2], w[3]); sfx('warp'); sysMsg('きっぷを使った。「ここ」に着いた。'); }] });
X('capsule', 'ガチャのカプセル', '中身は小さいワードアート……のはず。', 0.2, function (g2) { P2(g2, PG.sph, pick([0xff6699, 0x66ccff, 0xffee44, 0x77ee77]), 0, 0.1, 0, 0.1, 0.05, 0.1); var t = P2(g2, PG.sph, new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }), 0, 0.1, 0, 0.1); t.scale.y = 0.1; t.position.y = 0.12; }, { roll: 1, sp: ['開ける', function (it) { popWA(pick(BIG_WORDS), {}); removeItem(it); }] });
X('tama', '福引きの玉', '赤い玉。２等。何の２等かは不明。', 0.1, function (g2) { P2(g2, PG.sph, pick([0xff2020, 0xffffff, 0xffd020]), 0, 0.07, 0, 0.07); }, { roll: 1 });
X('flyer', 'チラシ', '「ピザ始めました（ピザ屋ではない）」', 0.02, function (g2) { P2(g2, PG.box, 0xfff0f0, 0, 0.005, 0, 0.3, 0.01, 0.42); P2(g2, PG.box, 0xff3030, 0, 0.011, -0.12, 0.24, 0.002, 0.08); }, { sp: ['読む', function () { caption('チラシ「ピザ　始めました（ピザ屋ではない）」', { preset: 'type' }); }] });
X('letter', '手紙', '３年前の自分から返事が来た手紙。「元気です」。', 0.03, function (g2) { P2(g2, PG.box, 0xffffff, 0, 0.01, 0, 0.3, 0.02, 0.2); P2(g2, PG.box, 0xff4040, 0.1, 0.022, -0.05, 0.05, 0.004, 0.06); }, { sp: ['読む', function () { caption('手紙「元気です。あなたも元気でしたか。」', { preset: 'type' }); }] });
X('mikan', 'みかん', 'こたつから出てきたみかん。食べるとげんきになる。', 0.15, function (g2) { P2(g2, PG.sph, 0xff9a00, 0, 0.07, 0, 0.075, 0.065, 0.075); P2(g2, PG.box, 0x2a8a2a, 0, 0.14, 0, 0.03, 0.01, 0.02); }, { roll: 1, sp: ['食べる', function (it) { eat(it, 15, 'みかんを食べた。すっぱくない。ぬるい。'); }] });
X('star', 'お星さま', 'バケツやゴミ箱から出てくる星。手にのるサイズ。', 0.1, function (g2) { var s = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), pm(0xffe040, true, 0x554400)); s.position.y = 0.12; s.scale.set(1, 1, 0.5); g2.add(s); }, { sp: ['光らせる', function (it) { confetti(8); sfx('chime'); }] });
X('coinitem', 'コイン', 'レジから出た「ちょうど」と書いてあるコイン。', 0.05, function (g2) { P2(g2, PG.cyl, 0xe0b030, 0, 0.01, 0, 0.08, 0.02, 0.08); }, { roll: 1 });
X('leaf', 'キャベツの葉', 'むいた葉。いい匂い。', 0.05, function (g2) { P2(g2, PG.sph, 0x8ae05a, 0, 0.03, 0, 0.14, 0.03, 0.12); }, { temp: 1 });
X('monday', '月曜日', 'ゴミ袋から出てきた月曜日。四角い。', 1, function (g2) { P2(g2, PG.box, 0x3050a0, 0, 0.2, 0, 0.4, 0.4, 0.4); var t = texPlane(labelCanvas('月', 12, 128, 128), 0.32, 0.32); t.position.set(0, 0.2, 0.205); g2.add(t); }, { sp: ['捨てる', function (it) { removeItem(it); sysMsg('月曜日を捨てた。火曜日になった気がする。'); cleanPollution(2); }] });
X('smallfish', '小さい魚', 'つれた魚。ピチピチしている。', 0.2, function (g2) { P2(g2, PG.sph, 0xa0b8d0, 0, 0.05, 0, 0.12, 0.04, 0.04); P2(g2, PG.cone, 0x8098b0, -0.14, 0.05, 0, 0.04, 0.06, 0.015, 0, 0, PI / 2); }, { sp: ['逃がす', function (it) { removeItem(it); sysMsg('魚を逃がした。空へ泳いで行った。'); }] });
X('kuji', 'おみくじ', '開けると運勢がわかる。', 0.02, function (g2) { P2(g2, PG.box, 0xfff8e0, 0, 0.01, 0, 0.06, 0.02, 0.25); }, { sp: ['開く', function (it) { doFx('omikuji'); removeItem(it); }] });
// ---- 合成でできる物（30種以上） ----
X('chazuke', 'おちゃづけ', 'コーヒーとおにぎりの合成。カレーの味のおちゃづけ。', 0.5, function (g2) { P2(g2, PG.cyl, 0x2a2a6a, 0, 0.08, 0, 0.16, 0.16, 0.16); P2(g2, PG.cyl, 0xf0f0e0, 0, 0.16, 0, 0.14, 0.01, 0.14); P2(g2, PG.box, 0x1a3a1a, 0.04, 0.17, 0, 0.06, 0.01, 0.04); }, { sp: ['食べる', function (it) { eat(it, 40, 'サラサラ。カレーの味。げんき大回復。'); }] });
X('fishroll', '魚キャベツ巻き', 'キャベツで魚を巻いた。魚はまだピチピチ。', 3, function (g2) { sub(g2, 'cabbage', 0, 0, 0, 1); sub(g2, 'smallfish', 0, 0.75, 0, 2); });
X('duckbath', 'アヒル風呂', 'バケツにアヒルが入った。ぬるま湯。', 0.9, function (g2) { sub(g2, 'bucket', 0, 0, 0, 1.4); sub(g2, 'duck', 0, 0.22, 0, 0.9); }, { sp: ['お湯をかける', function () { cleanPollution(4); sfx('splash'); }] });
X('coneumbrella', '三角の雨', '傘とコーンの合成。開くと三角の雨が降る。', 1, function (g2) { sub(g2, 'cone', 0, 0, 0, 1.2); P2(g2, PG.cone, 0x5a8aff, 0, 1.1, 0, 0.5, 0.3, 0.5); }, { sp: ['開く', function () { G.fogT = 6; G.fogC = new THREE.Color(0x8ab0ff); sfx('whoosh'); }] });
X('unicycle', '一輪車', 'タイヤと自転車の合成。タイヤが１つ減った。', 6, function (g2) { P2(g2, PG.tor, 0x222222, 0, 0.35, 0, 0.33, 0.33, 0.6, 0, PI / 2); P2(g2, PG.cyl, 0x2aa0ff, 0, 0.75, 0, 0.03, 0.8, 0.03); P2(g2, PG.box, 0x222222, 0, 1.15, 0, 0.14, 0.06, 0.24); }, { roll: 1, sp: ['乗る', function () { P.speedMul = 2.2; P.speedT = 10; sysMsg('一輪車に乗った気持ちで速くなった（１０秒）。'); }] });
X('tvradio', 'テレビラジオ', '見えるラジオ。聞こえるテレビ。', 8, function (g2) { sub(g2, 'tv', 0, 0, 0, 0.8); sub(g2, 'radio', 0, 1.2, 0, 1); });
X('nekotatsu', 'ねこたつ', 'こたつの上で、ねこがまるくなった。最強の暖かさ。', 15, function (g2) { sub(g2, 'kotatsu', 0, 0, 0, 1); sub(g2, 'cat', 0, 0.47, 0, 1.2, 0, 0xffffff); }, { sp: ['あたる', function () { cleanPollution(8); G.genki = 100; sysMsg('ぬくぬく。げんき満タン。'); }] });
X('darumanuki', 'だるまぬき', 'だるまとたぬきが合体した置物。ころばない。', 8, function (g2) { sub(g2, 'tanuki', 0, 0, 0, 1, 0, 0xff8080); P2(g2, PG.sph, 0xdd1111, 0, 1.1, 0, 0.32); }, { sp: ['お腹をたたく', function () { sfx('boing'); popWA('ポン!!', { style: 3, y: 0.3 }); }] });
X('kingdaruma', '王様だるま', '王冠をかぶっただるま。目が３つある。', 2.5, function (g2) { sub(g2, 'daruma', 0, 0, 0, 1.2); sub(g2, 'crown', 0, 0.95, 0, 0.9); });
X('bootfish', '長ぐつ魚', '長ぐつに魚が住みついた。', 2, function (g2) { sub(g2, 'boot', 0, 0, 0, 1.3); sub(g2, 'smallfish', 0, 0.6, 0, 1.4, 0.5); });
X('bigflower', '巨大な花', '花が植木鉢に入って、ぐんぐんのびた。', 6, function (g2) { sub(g2, 'plant', 0, 0, 0, 1.3); sub(g2, 'flower', 0, 0.5, 0, 3); }, { sp: ['話しかける', function () { caption('巨大な花「わたしは、大きくなりました」', { preset: 'zoom', speak: true }); }] });
X('karaokebox', 'カラオケ機', 'マイクとラジオの合成。いつでも１２０点。', 4, function (g2) { sub(g2, 'radio', 0, 0, 0, 1.6); sub(g2, 'mic', 0.4, 0, 0, 0.6); }, { sp: ['歌う', function () { popWA('１２０点', { big: true, style: 0 }); confetti(16); }] });
X('bellphone', '鈴電話', '鳴ると神様っぽい人につながる。', 6, function (g2) { sub(g2, 'phone', 0, 0, 0, 1); P2(g2, PG.sph, 0xd4a020, 0, 1.05, 0, 0.16); }, { sp: ['かける', function () { sfx('bell'); caption('「……こちら神様っぽい人です。いまは二度寝中です」', { preset: 'type', speak: true }); }] });
X('hourglass', '砂時計', 'コーン２つでできた砂時計。時間がゆっくりになる。', 1.6, function (g2) { P2(g2, PG.cone, 0xff5a00, 0, 0.6, 0, 0.25, 0.6, 0.25, PI); P2(g2, PG.cone, 0xff5a00, 0, 0.0 + 0.3, 0, 0.25, 0.6, 0.25); }, { sp: ['ひっくり返す', function () { G.slowT = 6; sysMsg('時間がゆっくりになった。'); }] });
X('piggybank', '貯金箱', 'ゴミ箱とレジの合成。コインが出てくる。', 5, function (g2) { sub(g2, 'trash', 0, 0, 0, 1, 0, 0xff99cc); sub(g2, 'register', 0, 0.95, 0, 0.8); }, { sp: ['ふる', function (it) { spawnFrom(it, 'coinitem'); spawnFrom(it, 'coinitem'); sfx('coin'); }] });
X('frogking', 'カエルの王様', '王冠をかぶったカエル。ケロ（威厳）。', 0.8, function (g2) { sub(g2, 'frog', 0, 0, 0, 2); sub(g2, 'crown', 0, 0.38, 0, 0.6); }, { sp: ['命令をきく', function () { caption('カエルの王様「ケロ。汚染率を　上げなさい。ケロ。」', { preset: 'zoom', speak: true }); addPollution(3); }] });
X('cleanbag', 'きれいな袋', '洗濯された月曜日の袋。もう月曜日ではない。', 1, function (g2) { sub(g2, 'bags', 0, 0, 0, 0.6, 0, 0xc0ffff); }, { sp: ['開ける', function () { cleanPollution(6); }] });
X('daikichi', '大吉の絵馬', '大吉と書いた絵馬。願いが全部かなう（かもしれない）。', 4, function (g2) { sub(g2, 'ema', 0, 0, 0, 0.8); var t = texPlane(labelCanvas('大吉', 13, 256, 128), 0.8, 0.4); t.position.set(0, 0.6, 0.1); g2.add(t); }, { sp: ['お願いする', function () { cleanPollution(15); popWA('大吉', { big: true, style: 13 }); }] });
X('megaonigiri', '巨大おにぎり', 'おにぎりとおにぎりの合成。具は巨大なおにぎり。', 2, function (g2) { sub(g2, 'onigiri', 0, 0, 0, 3.5); }, { sp: ['食べる', function (it) { eat(it, 100, '巨大おにぎりを食べた。げんき満タン。'); }] });
X('teahydrant', 'お茶の消火栓', '出てくるのは水ではなくお茶。', 20, function (g2) { sub(g2, 'hydrant', 0, 0, 0, 1, 0, 0x80ff80); sub(g2, 'cup', 0, 0.8, 0, 1.4); }, { sp: ['お茶を出す', function () { G.genki = Math.min(100, G.genki + 20); sysMsg('お茶が出た。ほっとした。'); }] });
X('stripecone', 'しましまコーン', '床屋の回るやつとコーンの合成。回る。', 1.5, function (g2) { sub(g2, 'cone', 0, 0, 0, 1.4, 0, 0x8080ff); }, { sp: ['回す', function (it) { it.body.av.y = 20; wake(it); }] });
X('duckking', 'アヒル王', '王冠をかぶったアヒル。ガー（威厳）。', 0.8, function (g2) { sub(g2, 'duck', 0, 0, 0, 2); sub(g2, 'crown', 0, 0.48, 0.1, 0.5); }, { sp: ['鳴かせる', function () { sfx('quack'); popWA('ガー', { style: 2, y: 0.3 }); }] });
X('living', 'リビング', 'ソファとテレビが合体。ここに住める。', 30, function (g2) { sub(g2, 'sofa', 0, 0, 0, 1); sub(g2, 'tv', 0, 0.5, 0.2, 0.7, PI); }, { sp: ['くつろぐ', function () { G.genki = 100; cleanPollution(5); P.gesture = { id: 'sit', t: 0 }; }] });
X('dango', 'タイヤだんご', 'タイヤ２つをくしにさした。食べられない。', 16, function (g2) { P2(g2, PG.tor, 0x1a1a1a, 0, 0.35, 0, 0.32, 0.32, 0.5, PI / 2); P2(g2, PG.tor, 0x1a1a1a, 0, 0.95, 0, 0.32, 0.32, 0.5, PI / 2); P2(g2, PG.cyl, 0xc89a60, 0, 0.9, 0, 0.03, 1.8, 0.03); });
X('frozenfish', '冷凍マグロ', '冷蔵庫と魚の合成。カチコチ。投げると強い。', 6, function (g2) { P2(g2, PG.sph, new THREE.MeshPhongMaterial({ color: 0xc8e8ff, shininess: 120, transparent: true, opacity: 0.9 }), 0, 0.2, 0, 0.7, 0.2, 0.22); P2(g2, PG.cone, 0x9ac0e0, -0.8, 0.2, 0, 0.15, 0.25, 0.05, 0, 0, PI / 2); }, { sp: ['かじる', function () { sysMsg('かたい。'); sfx('error'); }] });
X('darumagacha', 'だるまガチャ', '回すとだるまが出る。', 12, function (g2) { sub(g2, 'gacha', 0, 0, 0, 1, 0, 0xffaaaa); sub(g2, 'daruma', 0, 1.0, 0, 0.6); }, { sp: ['回す', function (it) { spawnFrom(it, 'daruma'); }] });
X('sofacar', '走るソファ', 'カートの車輪がついたソファ。勝手に走る。', 20, function (g2) { sub(g2, 'sofa', 0, 0.2, 0, 1); for (var i = 0; i < 4; i++) P2(g2, PG.cyl, 0x222222, (i % 2 - 0.5) * 1.8, 0.12, ((i >> 1) - 0.5) * 0.8, 0.12, 0.08, 0.12, 0, 0, PI / 2); }, { sp: ['走らせる', function (it) { var f = P.face; it.body.vel.set(-Math.sin(f) * 10, 0.5, -Math.cos(f) * 10); wake(it); sfx('whoosh'); }] });
X('rainduck', '雨の日のアヒル', '傘をさしたアヒル。ぬれない。', 0.9, function (g2) { sub(g2, 'duck', 0, 0, 0, 1.5); P2(g2, PG.cone, 0xff5a8a, 0, 0.62, 0, 0.3, 0.2, 0.3); P2(g2, PG.cyl, 0x222222, 0, 0.45, 0, 0.01, 0.3, 0.01); });
X('cabbagepot', 'キャベツ鍋', 'バケツで煮たキャベツ。ぬるい。', 3, function (g2) { sub(g2, 'bucket', 0, 0, 0, 2); P2(g2, PG.sph, 0x8ae05a, 0, 0.5, 0, 0.22); }, { sp: ['食べる', function (it) { eat(it, 35, 'キャベツ鍋。ぬるい。でもおいしい。'); }] });
X('pigeonpost', '伝書バト', 'ポストにハトが住みついた。手紙を運ぶ。', 15, function (g2) { sub(g2, 'postbox', 0, 0, 0, 1); sub(g2, 'bird', 0, 1.42, 0, 1.4); }, { sp: ['手紙を運ばせる', function (it) { spawnFrom(it, 'letter'); sfx('crow'); }] });
X('jihou', '時報', '時刻表と鈴の合成。ちょうどの時刻に鳴る（いつでも鳴る）。', 6, function (g2) { sub(g2, 'timetable', 0, 0, 0, 1); P2(g2, PG.sph, 0xd4a020, 0, 2.55, 0, 0.18); }, { sp: ['鳴らす', function () { sfx('bell'); G.tod = (Math.floor(G.tod) + 1) % 4 + 0.02; }] });
X('flowersign', '花の標識', '「この先　花」。', 6, function (g2) { sub(g2, 'roadsign', 0, 0, 0, 1); sub(g2, 'flower', 0, 2.4, 0.1, 1.2); });
X('recycle', 'リサイクル星', '缶をゴミ箱に入れたら星になった。えらい。', 0.3, function (g2) { var s = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), pm(0x40ff80, true, 0x114422)); s.position.y = 0.25; g2.add(s); }, { sp: ['ほめる', function () { cleanPollution(5); popWA('えらい', { style: 7, y: 0.3 }); }] });
X('teikiken', '自転車の定期券', '自転車に乗り放題（自転車は持っていない）。', 0.1, function (g2) { P2(g2, PG.box, 0x40c0ff, 0, 0.01, 0, 0.32, 0.02, 0.2); P2(g2, PG.tor, 0x222222, 0, 0.03, 0, 0.05, 0.05, 0.05, PI / 2); }, { sp: ['使う', function () { P.speedMul = 2; P.speedT = 20; sysMsg('２０秒間、自転車の速さ。'); }] });
X('mikantower', 'みかんタワー', 'みかんを積んだ。崩れそうで崩れない。', 0.6, function (g2) { for (var i = 0; i < 3; i++) P2(g2, PG.sph, 0xff9a00, 0, 0.07 + i * 0.13, 0, 0.075, 0.065, 0.075); }, { sp: ['食べる', function (it) { eat(it, 45, 'みかんタワーを全部食べた。'); }] });
X('bigcapsule', '巨大カプセル', 'カプセル２つが合体。中に何かいる。', 1, function (g2) { P2(g2, PG.sph, 0xff66cc, 0, 0.3, 0, 0.3, 0.15, 0.3); var t = P2(g2, PG.sph, new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }), 0, 0.36, 0, 0.3); t.scale.y = 0.3; }, { roll: 1, sp: ['開ける', function (it) { var f = popFriendNear(null); sysMsg('中から友達が出てきた。'); removeItem(it); }] });
X('superstar', 'すごいお星さま', 'お星さまが２つ合わさった。まぶしい。', 0.3, function (g2) { var s = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), pm(0xfff080, true, 0x887700)); s.position.y = 0.3; g2.add(s); }, { sp: ['光らせる', function () { confetti(30); G.crazySkyT = 8; }] });
X('canpyramid', '缶ピラミッド', '缶を積んだら何かの儀式みたいになった。', 1, function (g2) { for (var i = 0; i < 3; i++) P2(g2, PG.cyl, 0xe03030, (i - 1) * 0.13, 0.12, 0, 0.06, 0.24, 0.06); for (i = 0; i < 2; i++) P2(g2, PG.cyl, 0x3070e0, (i - 0.5) * 0.13, 0.36, 0, 0.06, 0.24, 0.06); P2(g2, PG.cyl, 0xf0c020, 0, 0.6, 0, 0.06, 0.24, 0.06); }, { sp: ['おがむ', function () { addPollution(3); popWA('缶の神', { style: 1, y: 0.3 }); }] });
var RECIPES = [];
function RC(a, b, out) { RECIPES.push({ a: a, b: b, out: out }); }
RC('cup', 'onigiri', 'chazuke'); RC('cabbage', 'fish', 'fishroll'); RC('duck', 'bucket', 'duckbath'); RC('umbrella', 'cone', 'coneumbrella'); RC('tire', 'bike', 'unicycle');
RC('tv', 'radio', 'tvradio'); RC('cat', 'kotatsu', 'nekotatsu'); RC('daruma', 'tanuki', 'darumanuki'); RC('crown', 'daruma', 'kingdaruma'); RC('boot', 'fish', 'bootfish');
RC('boot', 'smallfish', 'bootfish'); RC('flower', 'plant', 'bigflower'); RC('mic', 'radio', 'karaokebox'); RC('bell', 'phone', 'bellphone'); RC('cone', 'cone', 'hourglass');
RC('trash', 'register', 'piggybank'); RC('frog', 'crown', 'frogking'); RC('bags', 'washer', 'cleanbag'); RC('monday', 'washer', 'cleanbag'); RC('kuji', 'ema', 'daikichi');
RC('omikuji', 'ema', 'daikichi'); RC('onigiri', 'onigiri', 'megaonigiri'); RC('cup', 'hydrant', 'teahydrant'); RC('barber', 'cone', 'stripecone'); RC('duck', 'crown', 'duckking');
RC('sofa', 'tv', 'living'); RC('tire', 'tire', 'dango'); RC('fridge', 'fish', 'frozenfish'); RC('fridge', 'smallfish', 'frozenfish'); RC('gacha', 'daruma', 'darumagacha');
RC('cart', 'sofa', 'sofacar'); RC('umbrella', 'duck', 'rainduck'); RC('cabbage', 'bucket', 'cabbagepot'); RC('postbox', 'bird', 'pigeonpost'); RC('timetable', 'bell', 'jihou');
RC('roadsign', 'flower', 'flowersign'); RC('can', 'trash', 'recycle'); RC('kippu', 'bike', 'teikiken'); RC('mikan', 'mikan', 'mikantower'); RC('capsule', 'capsule', 'bigcapsule');
RC('star', 'star', 'superstar'); RC('can', 'can', 'canpyramid'); RC('leaf', 'fish', 'fishroll'); RC('mikan', 'kotatsu', 'nekotatsu');
function findRecipe(a, b) { for (var i = 0; i < RECIPES.length; i++) { var r = RECIPES[i]; if ((r.a === a && r.b === b) || (r.a === b && r.b === a)) return r; } return null; }
// 形の情報（名前・説明・重さなど）
function itemType(t) {
  if (EXTRA_TYPES[t]) { var e = EXTRA_TYPES[t]; return { name: e.name, desc: e.desc, mass: e.mass, roll: e.roll, special: e.sp ? { name: e.sp[0], fn: e.sp[1] } : null, temp: e.temp }; }
  var i = ITEM_INFO[t] || { n: t, m: 2 }, def = PROP_DEFS.filter(function (d) { return d.b === t && d.z; })[0];
  return { name: i.n, desc: def ? def.z : '町にある物。', mass: i.m, roll: i.roll, special: i.sp ? { name: i.sp[0], fn: i.sp[1] } : null, fixed: i.fixed };
}
function makeItemMesh(type, opt) { var g2 = new THREE.Group(); if (!PG) propGeos(); if (EXTRA_TYPES[type]) EXTRA_TYPES[type].build(g2, opt || {}); else if (BUILD[type]) BUILD[type](g2, opt || {}); return g2; }
// ---- 物を町に出す ----
var _bb = null;
function spawnItem(type, x, y, z, yaw, o) {
  o = o || {};
  if (!_bb) _bb = new THREE.Box3();
  var inner = makeItemMesh(type, o.opt), t = itemType(type);
  _bb.setFromObject(inner); var sz = _bb.getSize(new THREE.Vector3()), ctr = _bb.getCenter(new THREE.Vector3());
  if (!isFinite(sz.x) || sz.x === 0) { sz.set(0.3, 0.3, 0.3); ctr.set(0, 0.15, 0); }
  inner.position.set(-ctr.x, -ctr.y, -ctr.z);
  var obj = new THREE.Group(), pivot = new THREE.Group(); pivot.add(inner); obj.add(pivot);
  obj.traverse(function (m) { if (m.isMesh) { m.castShadow = true; } });
  R.scene.add(obj);
  var b = { pos: new THREE.Vector3(x, y + sz.y / 2, z), vel: new THREE.Vector3(), av: new THREE.Vector3(), hx: Math.max(0.05, sz.x / 2), hy: Math.max(0.05, sz.y / 2), hz: Math.max(0.05, sz.z / 2), scale: o.scale || 1,
    mass: t.mass || 1, yaw: yaw || 0, rx: 0, rz: 0, roll: !!t.roll, rollA: 0, sleep: !o.awake, sleepT: 0, onGround: true, thrownT: 0, stuckT: 0, fixed: !!t.fixed, bouncy: null };
  var it = { id: ITEMS.nextId++, type: type, def: o.def || null, obj: obj, pivot: pivot, inner: inner, body: b, home: new THREE.Vector3(x, y, z), temp: !!(o.temp || t.temp), born: G.t, opt: o.opt };
  b.it = it; bodyExt(b);
  ITEMS.list.push(it);
  syncItem(it);
  return it;
}
function removeItem(it) {
  if (!it || it.gone) return; it.gone = true; R.scene.remove(it.obj);
  if (ITEMS.held === it) ITEMS.held = null;
  if (it.prop) it.prop.gone = true;
  var i = ITEMS.list.indexOf(it); if (i >= 0) ITEMS.list.splice(i, 1);
}
function itemName(it) { return it.def ? it.def.n.replace(/（.*）/, '') : itemType(it.type).name; }
function setScale(it, s) { it.body.scale = clamp(s, 0.3, 4); bodyExt(it.body); wake(it); }
function syncItem(it) {
  var b = it.body, o = it.obj;
  o.position.copy(b.pos); o.rotation.set(0, b.yaw, 0);
  if (b.roll) { it.pivot.rotation.set(b.rollA, 0, 0); }
  else it.pivot.rotation.set(b.rx, 0, b.rz);
  var sp = it.spinFast > 0 ? it.spinFast : 0; if (sp) { it.inner.rotation.y += sp * 0.1; }
  o.scale.setScalar(b.scale);
}
// 生まれる物を近くに出す
function spawnFrom(it, type) {
  var cnt = ITEMS.list.filter(function (x) { return x.spawned; }).length;
  if (cnt > (LITE.on ? 50 : 110)) { var old = ITEMS.list.filter(function (x) { return x.spawned && x !== ITEMS.held; })[0]; if (old) removeItem(old); }
  var p = it ? it.body.pos : P.pos, top = it ? it.body.ey : 0;
  var n = spawnItem(type, p.x + rand(-0.3, 0.3), p.y + top + 0.3, p.z + rand(-0.3, 0.3), rand(0, TAU), { awake: true });
  n.spawned = true; n.body.vel.set(rand(-2.5, 2.5), rand(3, 5), rand(-2.5, 2.5)); n.body.thrownT = 0.2;
  zukanFind('i_' + type, itemType(type).name);
  return n;
}
function eat(it, v, msg) { G.genki = Math.min(100, G.genki + v); sysMsg(msg); sfx('eat'); if (it.def && it.prop) it.prop.gone = true; removeItem(it); }
function wearOnHead(it) {
  if (ITEMS.held === it) ITEMS.held = null;
  it.onHead = true; it.body.fixed = true; it.body.sleep = true;
  sysMsg(itemName(it) + 'を　頭にかぶった。');
}
// ---- 衝突の音・合成 ----
var _impT = 0;
function itemImpact(it, v) { if (G.t - _impT < 0.06) return; _impT = G.t; if (P.pos.distanceTo(it.body.pos) < 20) sfx('thud', Math.min(10, v)); }
function tryCombine(ia, ib, rel) {
  if (ia.gone || ib.gone || ia === ITEMS.held || ib === ITEMS.held) return false;
  var r = findRecipe(ia.type, ib.type); if (!r) return false;
  combineAt(ia, ib, r, ia.body.pos.clone().add(ib.body.pos).multiplyScalar(0.5));
  return true;
}
function combineAt(ia, ib, r, pos) {
  var s = Math.max(ia.body.scale, ib.body.scale);
  removeItem(ia); removeItem(ib);
  var n = spawnItem(r.out, pos.x, pos.y, pos.z, rand(0, TAU), { awake: true, scale: s }); n.spawned = true; n.body.vel.y = 3;
  var name = itemType(r.out).name;
  sysMsg('合成成功!!　「' + name + '」ができました。'); sfx('combine'); popWA(name, { style: randi(0, WA_STYLES.length - 1), y: 0.24 }); confetti(10);
  G.combines = (G.combines || 0) + 1; addPollution(3);
  zukanFind('r_' + r.out, name); zukanFind('i_' + r.out, name);
  if (window.NET && NET.sendCombine) NET.sendCombine(r.out, pos);
  return n;
}
// ---- 持つ・置く・投げる・回す・大小・しまう・いじる ----
function holdPoint(it, out) {
  var f = P.face, b = it.body, d = P.r * P.scale + Math.max(b.ex, b.ez) + 0.22;
  out.set(P.pos.x - Math.sin(f) * d, P.pos.y + P.bodyH * P.scale * 0.55 + b.ey * 0.3, P.pos.z - Math.cos(f) * d);
  if (b.ey * 2 > P.bodyH * 1.2) out.y = P.pos.y + b.ey + 0.05; // 大きい物は床すれすれ
  return out;
}
var _hp = null;
function grab(it) {
  if (!it || it.gone) return;
  if (it.body.fixed && !it.onHead) { sysMsg(itemName(it) + 'は　動かせません。'); sfx('error'); return; }
  if (it.lockUntil && it.lockUntil > G.t && it.lockBy !== 'me') { sysMsg('ほかの人が　持ったばかりです。少し待って下さい。'); sfx('error'); return; }
  if (it.onHead) { it.onHead = false; it.body.fixed = false; }
  ITEMS.held = it; it.holdYaw = it.body.yaw - P.face; it.body.sleep = false;
  sfx('pickup'); sysMsg(itemName(it) + 'を　持った。', true); fiddle(it, 'grab');
  if (window.NET && NET.sendGrab) NET.sendGrab(it);
}
function release(throwIt) {
  var it = ITEMS.held; if (!it) return; ITEMS.held = null;
  var b = it.body; b.sleep = false; b.sleepT = 0;
  if (throwIt) {
    var f = P.face, pw = 11 / Math.sqrt(Math.max(0.6, effMass(b))) + 3;
    b.vel.set(-Math.sin(f) * pw + P.vel.x, 4 + pw * 0.15, -Math.cos(f) * pw + P.vel.z);
    if (!b.roll) b.av.set(rand(-6, 6), rand(-4, 4), rand(-6, 6)); else b.av.set(0, rand(-3, 3), 0);
    b.thrownT = 2; P.throwT = 0.35; sfx('throw'); fiddle(it, 'throw');
    if (G.stage >= 5) b.bouncy = 0.9;
  } else { b.vel.set(0, -0.5, 0); b.thrownT = 1; sfx('put'); fiddle(it, 'put'); }
  if (window.NET && NET.sendRelease) NET.sendRelease(it);
}
function fiddle(it, kind) {
  G.fiddles = (G.fiddles || 0) + 1; addPollution(0.4 + (kind === 'special' ? 0.6 : 0));
  if (it.prop && it.prop.def && !ZUKAN.found['p_' + it.prop.def.id]) zukanFind('p_' + it.prop.def.id, it.prop.def.n);
  else if (!it.def) zukanFind('i_' + it.type, itemType(it.type).name);
}
function updateHeld(dt) {
  var it = ITEMS.held; if (!it) return;
  if (!_hp) _hp = new THREE.Vector3();
  holdPoint(it, _hp);
  var b = it.body; b.pos.lerp(_hp, 1 - Math.exp(-dt * 20)); b.vel.set(0, 0, 0);
  b.yaw = P.face + (it.holdYaw || 0); b.rx = lerp(b.rx, 0, dt * 8); b.rz = lerp(b.rz, 0, dt * 8); bodyExt(b);
}
function itemActions(target) {
  if (IN.rotate) { IN.rotate = false; var r = ITEMS.held || (target && target.item); if (r) { if (r === ITEMS.held) r.holdYaw = (r.holdYaw || 0) + PI / 4; else { r.body.yaw += PI / 4; if (!r.body.roll) r.body.rx = (Math.abs(r.body.rx) > 0.5 ? 0 : PI / 2) * (IN.keys.ShiftLeft ? 1 : 0) + (IN.keys.ShiftLeft ? 0 : r.body.rx); wake(r); r.body.vel.y = 1.5; bodyExt(r.body); } sfx('rotate'); fiddle(r, 'rotate'); } }
  if (IN.bigger || IN.smaller) { var s = ITEMS.held || (target && target.item); if (s) { var k = IN.bigger ? 1.25 : 0.8; setScale(s, s.body.scale * k); sfx(IN.bigger ? 'grow' : 'down'); sysMsg(itemName(s) + 'の大きさ：×' + s.body.scale.toFixed(2), true); fiddle(s, 'scale'); } IN.bigger = IN.smaller = false; }
  if (IN.throwIt) { IN.throwIt = false; if (ITEMS.held) release(true); }
  if (IN.store) { IN.store = false; var st = ITEMS.held || (target && target.item); if (st) storeItem(st); }
  if (IN.special) { IN.special = false; var sp = ITEMS.held || (target && target.item); if (sp) doSpecial(sp); else if (target && target.prop) touchProp(target.prop); }
}
function doSpecial(it) {
  var t = itemType(it.type); if (!t.special) { sysMsg('この物には　とくべつな　いじり方が　ありません。'); return; }
  sysMsg(itemName(it) + '：' + t.special.name, true); fiddle(it, 'special');
  try { t.special.fn(it); } catch (e) {}
  if (window.NET && NET.send) NET.send('sp', { id: it.netId, t: it.type });
}
function storeItem(it) {
  if (BAG.items.length >= BAG.size) { sysMsg('カバンがいっぱいです。'); sfx('error'); return; }
  if (it.body.fixed && !it.onHead) { sysMsg('これは　カバンに入りません。'); sfx('error'); return; }
  if (effMass(it.body) > 30) { sysMsg('重すぎて　カバンに入りません（' + effMass(it.body).toFixed(0) + '）。小さくすると入るかも。'); sfx('error'); return; }
  BAG.items.push({ type: it.type, scale: it.body.scale, def: it.def ? it.def.id : null, opt: it.opt });
  removeItem(it); sfx('bagIn'); sysMsg(itemName(it) + 'を　カバンにしまった。'); refreshWin('bag'); saveGame();
}
function takeOutBag(i) {
  var e = BAG.items[i]; if (!e || ITEMS.held) return;
  BAG.items.splice(i, 1); BAG.sel = -1;
  var def = e.def ? PROP_DEFS.filter(function (d) { return d.id === e.def; })[0] : null;
  var it = spawnItem(e.type, P.pos.x, P.pos.y + 1, P.pos.z, P.face, { scale: e.scale, def: def, opt: e.opt, awake: true });
  if (def) { var pr = PROPS.filter(function (p) { return p.def === def; })[0]; if (pr) { pr.gone = false; pr.item = it; it.prop = pr; pr.obj = it.obj; } }
  else it.spawned = true;
  grab(it); refreshWin('bag'); saveGame();
}
function bagCombine(i, j) {
  var a = BAG.items[i], b = BAG.items[j], r = findRecipe(a.type, b.type);
  if (!r) { sysMsg('この２つは　合成できないようです。'); sfx('error'); return; }
  BAG.items = BAG.items.filter(function (_, k) { return k !== i && k !== j; });
  BAG.items.push({ type: r.out, scale: Math.max(a.scale || 1, b.scale || 1) });
  var name = itemType(r.out).name;
  sysMsg('合成成功!!　「' + name + '」ができました。'); sfx('combine'); confetti(10); G.combines = (G.combines || 0) + 1; addPollution(3);
  zukanFind('r_' + r.out, name); zukanFind('i_' + r.out, name);
  BAG.sel = BAG.items.length - 1; BAG.sel2 = -1; BAG.combineMode = false; refreshWin('bag'); saveGame();
}
// ---- とくぎ用 ----
function itemsBlast(p, r, pw) { ITEMS.list.forEach(function (it) { if (it === ITEMS.held || it.body.fixed) return; var b = it.body, dx = b.pos.x - p.x, dz = b.pos.z - p.z, d = Math.hypot(dx, dz); if (d < r && d > 0.01) { var k = (1 - d / r) * pw / Math.sqrt(Math.max(1, effMass(b))); b.vel.x += dx / d * k; b.vel.z += dz / d * k; b.vel.y += k * 0.6; b.av.set(rand(-6, 6), rand(-6, 6), rand(-6, 6)); b.thrownT = 1; wake(it); } }); }
function itemsHop(p, r) { ITEMS.list.forEach(function (it) { var b = it.body; if (it === ITEMS.held || b.fixed) return; if (b.pos.distanceTo(p) < r) { b.vel.y += 3; wake(it); } }); }
function itemsLineUp(p, face) {
  var L = ITEMS.list.filter(function (it) { return it !== ITEMS.held && !it.body.fixed && it.body.pos.distanceTo(p) < 9 && effMass(it.body) < 40; }).sort(function (a, b) { return a.body.ey - b.body.ey; }).slice(0, 12);
  var rx = Math.cos(face), rz = -Math.sin(face), fx = -Math.sin(face), fz = -Math.cos(face), x = -L.length * 0.5 * 0.9;
  L.forEach(function (it) { var b = it.body; x += b.ex + 0.1; b.pos.set(p.x + fx * 2.2 + rx * x, P.pos.y + b.ey + 0.6, p.z + fz * 2.2 + rz * x); b.yaw = face; b.rx = b.rz = 0; b.vel.set(0, 0, 0); b.av.set(0, 0, 0); x += b.ex + 0.1; wake(it); });
  sysMsg(L.length + '個の物を　きっちり並べた。');
}
// ---- 毎フレーム ----
function updateItems(dt) {
  if (G.slowT > 0) G.slowT -= dt; if (G.magnetT > 0) G.magnetT -= dt; if (G.xray > 0) G.xray -= dt;
  PHYS.acc += Math.min(dt, 0.1);
  physRebuildGrid();
  var n = 0; while (PHYS.acc >= PHYS.step && n < 4) { physStep(PHYS.step); PHYS.acc -= PHYS.step; n++; }
  if (n === 4) PHYS.acc = 0;
  updateHeld(dt);
  physRescue(dt);
  for (var i = 0; i < ITEMS.list.length; i++) {
    var it = ITEMS.list[i];
    if (it.onHead) { it.body.pos.set(P.pos.x, P.pos.y + P.bodyH * P.scale + it.body.ey * 0.6, P.pos.z); it.body.yaw = P.face; }
    if (it.follow > 0) { it.follow -= dt; var b = it.body, dx = P.pos.x - b.pos.x, dz = P.pos.z - b.pos.z, d = Math.hypot(dx, dz); if (d > 1.6) { b.vel.x = dx / d * 3.5; b.vel.z = dz / d * 3.5; b.yaw = Math.atan2(dx, dz); wake(it); } }
    if (it.spinFast > 0) it.spinFast = Math.max(0, it.spinFast - dt);
    if (it.temp && G.t - it.born > 40) { removeItem(it); i--; continue; }
    syncItem(it);
    if (it.prop) it.prop.center.set(it.body.pos.x, it.body.pos.y, it.body.pos.z);
  }
}
