// ---- game data: fictional "ramune", drinks, combinations ---------------------
// すべて架空。名前・効果・飲み合わせはゲーム用の創作です。
// time unit = in-game minutes. fx = feeling channels at peak per 1 piece.
//   eu 多幸  st 覚醒  se 鎮静  ps 幻覚  di 解離  de せん妄  em 共感  an 不安  na 吐き気  pa ぬくぬく(鎮痛)
// ph = physiology at peak: hr 心拍(bpm)  tp 体温(℃)  rr 呼吸(回/分)

var CLASSES = {
  psy: { name: '幻覚系', short: 'サイケ', col: '#b46bff', icon: '🌈' },
  up: { name: 'アッパー系', short: 'アッパー', col: '#30c8ff', icon: '⚡' },
  down: { name: 'ダウナー系', short: 'ダウナー', col: '#6a7dff', icon: '💤' },
  op: { name: 'ぬくぬく系（オピオイド系）', short: 'オピオイド', col: '#ffb347', icon: '☁️' },
  dis: { name: '解離系', short: '解離', col: '#7af0c8', icon: '🪐' },
  emp: { name: 'ハート系（エンパス系）', short: 'ハート', col: '#ff5fa8', icon: '💗' },
  del: { name: 'とばり系（せん妄系）', short: 'とばり', col: '#8a8a9a', icon: '🌑' },
  etc: { name: 'とくしゅ', short: 'とくしゅ', col: '#e8e8e8', icon: '✨' },
  alc: { name: 'お酒', short: 'お酒', col: '#d8f060', icon: '🍋' }
};

var SUBS = [
  // ---- 幻覚系 ----
  { id: 'yumeiro', name: 'ゆめいろラムネ', cls: 'psy', col: '#c77dff', col2: '#7df9ff', shape: 'star',
    on: 30, pk: 90, pl: 210, du: 420, fx: { ps: 1.0, eu: 0.45, an: 0.2, na: 0.15, st: 0.15 }, ph: { hr: 12, tp: 0.3, rr: 1 }, tail: { se: 0.1 }, stock: 3,
    desc: '七色に光る星形のラムネ。世界の輪郭がほどけて、色と模様があふれ出す。王道の幻覚系。' },
  { id: 'prism', name: 'プリズムラムネ', cls: 'psy', col: '#ffffff', col2: '#ff7df0', shape: 'gem',
    on: 1, pk: 4, pl: 7, du: 18, fx: { ps: 1.8, di: 0.6, eu: 0.4, an: 0.35 }, ph: { hr: 25, tp: 0.1 }, stock: 2,
    desc: '口に入れた瞬間に弾ける。ほんの数分間だけ、まったく別の次元へ飛ばされる。' },
  { id: 'kinoko', name: 'きのこぐもラムネ', cls: 'psy', col: '#e8c48a', col2: '#c0392b', shape: 'mushroom',
    on: 40, pk: 100, pl: 170, du: 330, fx: { ps: 0.8, eu: 0.6, na: 0.35, em: 0.2 }, ph: { hr: 8, tp: 0.2 }, stock: 3,
    desc: 'きのこの形。理由もなく笑いが止まらなくなり、床の木目がうねりはじめる。最初は少し気持ち悪い。' },
  // ---- アッパー系 ----
  { id: 'hyper', name: 'ハイパーソーダ', cls: 'up', col: '#29b6ff', col2: '#e0fbff', shape: 'round',
    on: 15, pk: 45, pl: 200, du: 360, fx: { st: 1.0, eu: 0.5, an: 0.25 }, ph: { hr: 32, tp: 0.5, rr: 3 }, tail: { eu: -0.35, an: 0.25, se: 0.35 }, dehyd: 0.8, stock: 3,
    desc: 'しゅわしゅわの青いラムネ。頭が冴えわたり、何でもできる気がしてくる。切れたあとはぐったり。' },
  { id: 'rocket', name: 'ロケットラムネ', cls: 'up', col: '#ff3b3b', col2: '#ffd23b', shape: 'bullet',
    on: 2, pk: 8, pl: 30, du: 75, fx: { st: 1.5, eu: 0.9, an: 0.3 }, ph: { hr: 40, tp: 0.6, rr: 4 }, tail: { eu: -0.6, an: 0.5, se: 0.3 }, stock: 2,
    desc: '一瞬で打ち上がり、すぐ落ちてくる。落ちたあとがかなりつらいので、もう一粒…となりがち。' },
  { id: 'mint', name: 'ミントシャキッとラムネ', cls: 'up', col: '#7dffcf', col2: '#ffffff', shape: 'round',
    on: 10, pk: 30, pl: 140, du: 240, fx: { st: 0.45, an: 0.05, eu: 0.1 }, ph: { hr: 12, tp: 0.1 }, stock: 4,
    desc: 'スースーするミント味。いちばんマイルドなアッパー。眠気ざましに。' },
  // ---- ダウナー系 ----
  { id: 'fuwa', name: 'ふわふわラムネ', cls: 'down', col: '#b9c6ff', col2: '#ffffff', shape: 'cloud',
    on: 20, pk: 60, pl: 170, du: 360, fx: { se: 0.7, eu: 0.25, an: -0.75 }, ph: { hr: -8, rr: -2.5 }, stock: 3,
    desc: '不安がすーっと溶けていく。体がソファに沈みこんでいく。お酒と混ぜると危ない。' },
  { id: 'nemu', name: 'ねむねむラムネ', cls: 'down', col: '#4b4ba8', col2: '#ffe066', shape: 'moon',
    on: 25, pk: 60, pl: 220, du: 420, fx: { se: 1.25, an: -0.4, eu: 0.1 }, ph: { hr: -10, rr: -3.5 }, stock: 2,
    desc: '強力なおやすみラムネ。まぶたが鉛のように重くなる。眠ったまま起きられなくなることも。' },
  { id: 'toro', name: 'とろけるゼリーラムネ', cls: 'down', col: '#9fffe0', col2: '#3fd4ff', shape: 'drop',
    on: 12, pk: 30, pl: 50, du: 120, fx: { eu: 0.7, se: 0.8, em: 0.3, na: 0.25 }, ph: { hr: -4, rr: -3.5 }, steep: 1.8, stock: 2,
    desc: 'ぷるぷるのゼリー状。気持ちいいけど、ちょっと増やすだけで効き目が跳ね上がる。お酒とは絶対に合わない。' },
  // ---- ぬくぬく系（オピオイド系） ----
  { id: 'nukunuku', name: 'ぬくぬくラムネ', cls: 'op', col: '#ffcf8a', col2: '#ff8a3d', shape: 'round',
    on: 20, pk: 50, pl: 140, du: 300, fx: { pa: 1.0, eu: 0.7, se: 0.55, na: 0.3 }, ph: { hr: -8, rr: -5, tp: -0.1 }, tail: { an: 0.2, na: 0.1 }, stock: 3,
    desc: '毛布にくるまれたような温かさ。痛みも悩みも遠くなる。呼吸がゆっくりになっていく。' },
  { id: 'masshiro', name: 'まっしろラムネ', cls: 'op', col: '#ffffff', col2: '#f0f0f0', shape: 'tiny',
    on: 8, pk: 25, pl: 70, du: 200, fx: { pa: 1.6, eu: 1.1, se: 0.95, na: 0.35 }, ph: { hr: -12, rr: -8.5 }, tail: { an: 0.35, na: 0.2 }, stock: 2,
    desc: '真っ白で小さな粒。とても強い。ほかの鎮静系やお酒と重なると、呼吸が止まりかける。' },
  { id: 'syrup', name: 'あまあまシロップラムネ', cls: 'op', col: '#c0392b', col2: '#ff9ff3', shape: 'drop',
    on: 30, pk: 80, pl: 160, du: 330, fx: { pa: 0.35, di: 0.55, eu: 0.35, na: 0.3, se: 0.25 }, ph: { hr: 6, rr: -2, tp: 0.2 }, stock: 3,
    desc: 'あまったるいシロップ味。体からふわっと抜け出すような、不思議なまどろみ。' },
  // ---- 解離系 ----
  { id: 'fuyuu', name: 'ふゆうラムネ', cls: 'dis', col: '#b8fff0', col2: '#5e7bff', shape: 'ring',
    on: 4, pk: 12, pl: 28, du: 70, fx: { di: 1.25, se: 0.3, eu: 0.25, na: 0.2 }, ph: { hr: 10, rr: -1 }, stock: 3,
    desc: '重力が消えて、体が自分のものじゃなくなる。たくさん飲むと「ラムネホール」に落ちる。' },
  { id: 'mirror', name: 'かがみのラムネ', cls: 'dis', col: '#d6dde6', col2: '#7af0c8', shape: 'gem',
    on: 30, pk: 80, pl: 170, du: 360, fx: { di: 0.8, ps: 0.3, eu: 0.3, an: 0.1 }, ph: { hr: 8, rr: -1 }, stock: 2,
    desc: '自分が自分を少し離れたところから見ている。部屋がゆっくり裏返っていく。' },
  // ---- ハート系 ----
  { id: 'heart', name: 'ハートラムネ', cls: 'emp', col: '#ff5fa8', col2: '#ffd1e8', shape: 'heart',
    on: 30, pk: 75, pl: 150, du: 270, fx: { em: 1.2, eu: 1.0, st: 0.45, ps: 0.15 }, ph: { hr: 28, tp: 1.0, rr: 2 }, tail: { eu: -0.5, an: 0.2, se: 0.2 }, dehyd: 1.5, stock: 3,
    desc: 'ピンクのハート形。世界中のすべてが大好きになる。そのかわり体がとても熱くなる。水を忘れずに。' },
  // ---- とばり系 ----
  { id: 'tobari', name: 'よるのとばりラムネ', cls: 'del', col: '#1b1b24', col2: '#6a00ff', shape: 'round',
    on: 60, pk: 180, pl: 330, du: 720, fx: { de: 1.2, se: 0.35, an: 0.4, na: 0.1, ps: 0.1 }, ph: { hr: 30, tp: 0.6 }, dehyd: 1.0, stock: 2,
    desc: '真っ黒なラムネ。見えないはずのものが見え、いないはずの誰かと会話する。とても長く、あまり楽しくない。' },
  // ---- とくしゅ ----
  { id: 'booster', name: 'ブースターラムネ', cls: 'etc', col: '#ffe14d', col2: '#ff8800', shape: 'bolt',
    on: 20, pk: 40, pl: 230, du: 360, fx: { na: 0.2 }, ph: { hr: 4 }, boost: true, stock: 2,
    desc: 'それ自体はほとんど何も起きない。でも、ほかのラムネの効き目と長さを何倍にもしてしまう。' },
  { id: 'reset', name: 'リセットラムネ', cls: 'etc', col: '#ff2d55', col2: '#ffffff', shape: 'cross',
    on: 1, pk: 2, pl: 40, du: 90, fx: {}, ph: {}, reset: true, stock: 2,
    desc: '救急用。ぬくぬく系（オピオイド系）の効果をすぐに打ち消す。打ち消された反動でかなり気分が悪くなる。' },
  { id: 'zero', name: 'ただのラムネ', cls: 'etc', col: '#d0f4ff', col2: '#8ad8ff', shape: 'round',
    on: 2, pk: 5, pl: 8, du: 15, fx: { eu: 0.04 }, ph: {}, placebo: true, stock: 5,
    desc: '駄菓子屋さんのふつうのラムネ。ぶどう味。…本当にただのラムネ。' }
];
var SUB = {}; SUBS.forEach(function (s) { SUB[s.id] = s; });

// drinks (from the fridge). alc = alcohol units (1 = ロング缶じゃない9%の1缶)
var DRINKS = [
  { id: 'z9lemon', name: 'ZER9 ドライレモン', sub: '9%・350ml', alc: 1.0, col: '#e6f2f5', col2: '#f5e100', stock: 6, desc: '甘くないキレのあるレモン。飲みやすすぎて危ない、いつもの一本。' },
  { id: 'z9grape', name: 'ZER9 グレフル', sub: '9%・350ml', alc: 1.0, col: '#ffe4ec', col2: '#ff6f91', stock: 4, desc: 'ほろ苦いグレープフルーツ。気づくと2本目。' },
  { id: 'z9ume', name: 'ZER9 ストロングうめ', sub: '12%・500ml', alc: 1.8, col: '#3a1030', col2: '#ff4fa0', stock: 3, desc: 'ロング缶。これ1本でふつうの缶の2本分近い。' },
  { id: 'sour', name: 'ふわりサワー もも', sub: '3%・350ml', alc: 0.33, col: '#ffd6e0', col2: '#ffffff', stock: 3, desc: 'ジュースみたいな弱いお酒。' },
  { id: 'giga', name: 'ギガボルト', sub: 'エナジードリンク', alc: 0, col: '#111111', col2: '#00ff66', stock: 3, energy: true, desc: 'カフェインたっぷり（架空）。お酒と混ぜると酔いに気づきにくくなる。' }
];
var DRINK = {}; DRINKS.forEach(function (d) { DRINK[d.id] = d; });
// energy drink behaves like a mild upper
SUBS.push({ id: 'gigafx', name: 'ギガボルト', cls: 'up', hidden: true, col: '#00ff66', col2: '#111', shape: 'round',
  on: 10, pk: 30, pl: 90, du: 200, fx: { st: 0.35, an: 0.08 }, ph: { hr: 10, tp: 0.1 }, tail: { se: 0.1 } });
// withdrawal after a reset
SUBS.push({ id: 'withdraw', name: '反動', cls: 'etc', hidden: true, col: '#888', col2: '#444', shape: 'round',
  on: 1, pk: 3, pl: 40, du: 120, fx: { na: 0.75, an: 0.6, eu: -0.45 }, ph: { hr: 18, tp: 0.2 } });
SUBS.forEach(function (s) { SUB[s.id] = s; });

// ---- combinations ------------------------------------------------------------
// need: list of {c: class} / {s: sub id} with min level, or {distinct: class, n: count}
// m: modifier accumulator (see body.js). s: strength 0..1.5
var COMBOS = [
  { id: 'neon', name: 'ネオンストーム', need: [{ c: 'psy' }, { c: 'up' }], danger: 1,
    hint: '幻覚系 × アッパー系', desc: 'アッパーが幻覚をブーストする。色が電撃のように走るが、心臓もばくばくする。',
    f: function (m, s) { m.mul.ps += 0.35 * s; m.add.an += 0.3 * s; m.add.st += 0.15 * s; m.ph.hr += 15 * s; } },
  { id: 'heartflip', name: 'ハートフリップ', need: [{ c: 'psy' }, { c: 'emp' }], danger: 1,
    hint: '幻覚系 × ハート系', desc: 'ハートのぬくもりと幻覚の色彩がまざりあう、最高にカラフルな夜。体温には注意。',
    f: function (m, s) { m.add.eu += 0.4 * s; m.add.em += 0.3 * s; m.mul.ps += 0.25 * s; m.ph.tp += 0.4 * s; } },
  { id: 'elevator', name: '宇宙エレベーター', need: [{ c: 'psy' }, { c: 'dis' }], danger: 1,
    hint: '幻覚系 × 解離系', desc: '体を置き去りにして、万華鏡の向こうへ上昇していく。戻ってこられるかは少し不安。',
    f: function (m, s) { m.mul.ps += 0.45 * s; m.add.di += 0.35 * s; m.vis.kal += 0.8 * s; } },
  { id: 'calm', name: 'おだやかトリップ', need: [{ c: 'psy' }, { c: 'down' }], danger: 0,
    hint: '幻覚系 × ダウナー系', desc: 'ダウナーが幻覚の角をまるくする。不安は消えるが、色もちょっと薄くなる。',
    f: function (m, s) { m.mul.ps -= 0.4 * s; m.add.an -= 0.5 * s; } },
  { id: 'fakesober', name: 'ニセモノのシラフ', need: [{ c: 'alc' }, { c: 'up' }], danger: 2,
    hint: 'お酒 × アッパー系', desc: 'アッパーのせいで酔いに気づけない。まだいける気がして飲みすぎ、心臓にも負担がかかる。',
    f: function (m, s) { m.mask.alc += 0.55 * s; m.ph.hr += 14 * s; m.add.eu += 0.15 * s; } },
  { id: 'coaster', name: 'ジェットコースター', need: [{ c: 'up' }, { c: 'down' }], danger: 2,
    hint: 'アッパー系 × ダウナー系', desc: 'アクセルとブレーキを同時に踏んでいる状態。打ち消しあうようで、心臓のリズムが乱れる。',
    f: function (m, s) { m.mul.st -= 0.3 * s; m.mul.se -= 0.3 * s; m.irregular += s; } },
  { id: 'blackout', name: 'ブラックアウト警報', need: [{ c: 'down' }, { c: 'alc' }], danger: 3,
    hint: 'ダウナー系 × お酒', desc: 'お酒とダウナーは掛け算で効く。記憶がとび、呼吸がどんどん浅くなる。現実でもとても危険な組み合わせ。',
    f: function (m, s) { m.add.se += 0.5 * s; m.rrMul += 0.6 * s; m.vis.gap += s; } },
  { id: 'sinking', name: 'しずむ夜', need: [{ c: 'op' }, { c: 'alc' }], danger: 3,
    hint: 'ぬくぬく系 × お酒', desc: 'あたたかい眠気の底に沈んでいく。呼吸を忘れそうになる。現実でもとても危険な組み合わせ。',
    f: function (m, s) { m.add.se += 0.4 * s; m.rrMul += 0.8 * s; } },
  { id: 'deepsea', name: '深海', need: [{ c: 'op' }, { c: 'down' }], danger: 3,
    hint: 'ぬくぬく系 × ダウナー系', desc: '鎮静が重なり、深い海の底のように静かになる。静かすぎて、呼吸も止まりかける。',
    f: function (m, s) { m.add.se += 0.5 * s; m.rrMul += 1.0 * s; } },
  { id: 'triple', name: 'トリプル・ディープ', need: [{ c: 'op' }, { c: 'down' }, { c: 'alc' }], danger: 3,
    hint: 'ぬくぬく系 × ダウナー系 × お酒', desc: '三つの鎮静が重なった最悪の組み合わせ。ほぼ確実に呼吸が止まる。',
    f: function (m, s) { m.rrMul += 0.9 * s; m.add.se += 0.4 * s; } },
  { id: 'jelly', name: 'とろける沼', need: [{ s: 'toro' }, { c: 'alc' }], danger: 3,
    hint: 'とろけるゼリーラムネ × お酒', desc: 'ゼリーラムネとお酒は最悪の相性。気持ちよさの直後、意識ごと沼に沈む。',
    f: function (m, s) { m.add.se += 0.8 * s; m.rrMul += 1.2 * s; } },
  { id: 'overheat', name: 'オーバーヒート', need: [{ c: 'up' }, { c: 'emp' }], danger: 2,
    hint: 'アッパー系 × ハート系', desc: 'テンションは最高潮。でも体温がぐんぐん上がっていく。水とベランダの風が大事。',
    f: function (m, s) { m.ph.tp += 0.9 * s; m.ph.hr += 8 * s; m.add.eu += 0.2 * s; } },
  { id: 'runaway', name: '暴走列車', need: [{ distinct: 'up', n: 2 }], danger: 2,
    hint: 'アッパー系 × 別のアッパー系', desc: 'アッパーの重ねがけ。止まらない、止められない。心臓が限界に近づく。',
    f: function (m, s) { m.ph.hr += 14 * s; m.add.an += 0.4 * s; m.add.st += 0.2 * s; } },
  { id: 'spin', name: 'ぐるぐる回転', need: [{ c: 'dis' }, { c: 'alc' }], danger: 1,
    hint: '解離系 × お酒', desc: '部屋が回る、天井が回る、自分も回る。だいたい吐く。',
    f: function (m, s) { m.add.na += 0.8 * s; m.add.di += 0.3 * s; m.vis.spin += s; } },
  { id: 'void', name: '無重力の底', need: [{ c: 'dis' }, { c: 'down' }], danger: 2,
    hint: '解離系 × ダウナー系', desc: '体の感覚が消えて、暗い底へゆっくり落ちていく。呼吸も少し弱まる。',
    f: function (m, s) { m.add.di += 0.4 * s; m.rrMul += 0.4 * s; } },
  { id: 'nightmare', name: '悪夢のうたげ', need: [{ c: 'del' }, { c: 'alc' }], danger: 1,
    hint: 'とばり系 × お酒', desc: '影の住人たちが宴会をはじめる。あなたの缶を勝手に飲んでいるのは誰？',
    f: function (m, s) { m.add.de += 0.5 * s; m.add.an += 0.3 * s; } },
  { id: 'otherworld', name: '異界のパーティー', need: [{ c: 'del' }, { c: 'psy' }], danger: 1,
    hint: 'とばり系 × 幻覚系', desc: '幻覚の色と、とばりの影がまざりあう。もう、どこまでが部屋なのかわからない。',
    f: function (m, s) { m.add.de += 0.4 * s; m.mul.ps += 0.3 * s; m.add.an += 0.4 * s; } },
  { id: 'amplify', name: '増幅トリップ', need: [{ s: 'booster' }, { c: 'psy' }], danger: 1,
    hint: 'ブースターラムネ × 幻覚系', desc: 'ブースターが幻覚を何倍にも引きのばす。終わりが見えない。',
    f: function (m, s) { m.mul.ps += 0.3 * s; m.vis.kal += 0.4 * s; } },
  { id: 'storm', name: 'セロトニン・ストーム（架空）', need: [{ s: 'booster' }, { c: 'emp' }], danger: 3,
    hint: 'ブースターラムネ × ハート系', desc: 'ブースターとハートの組み合わせは体の中で嵐を起こす。体温と心拍が暴走する。',
    f: function (m, s) { m.ph.tp += 1.6 * s; m.ph.hr += 22 * s; m.add.an += 0.5 * s; m.add.na += 0.3 * s; } },
  { id: 'crisis', name: 'ハイパー・クライシス', need: [{ s: 'booster' }, { c: 'up' }], danger: 3,
    hint: 'ブースターラムネ × アッパー系', desc: 'ブースターでアッパーが暴走。頭がガンガンして、心臓が破裂しそうになる。',
    f: function (m, s) { m.ph.hr += 35 * s; m.add.an += 0.5 * s; m.vis.flash += s; } },
  { id: 'speedball', name: 'ジェットボール', need: [{ c: 'op' }, { c: 'up' }], danger: 2,
    hint: 'ぬくぬく系 × アッパー系', desc: 'アッパーがぬくぬくの眠気を隠す。アッパーが先に切れると、隠れていた鎮静が一気に来る。',
    f: function (m, s) { m.mask.op += 0.5 * s; m.rrMul += 0.25 * s; m.add.eu += 0.3 * s; } },
  { id: 'murky', name: 'にごりトリップ', need: [{ c: 'psy' }, { c: 'alc' }], danger: 1,
    hint: '幻覚系 × お酒', desc: 'お酒が幻覚をにごらせる。色はくすみ、胃がむかむかしてくる。',
    f: function (m, s) { m.mul.ps -= 0.25 * s; m.add.na += 0.3 * s; } },
  { id: 'lovedrunk', name: 'ほろ酔いハート', need: [{ c: 'emp' }, { c: 'alc' }], danger: 1,
    hint: 'ハート系 × お酒', desc: 'ハートでお酒がすすむ。気分はいいけど、体の水分がどんどん抜けていく。',
    f: function (m, s) { m.add.eu += 0.2 * s; m.dehyd += 1.2 * s; m.add.na += 0.15 * s; } },
  { id: 'cradle', name: 'ゆりかごの夢', need: [{ c: 'op' }, { c: 'psy' }], danger: 1,
    hint: 'ぬくぬく系 × 幻覚系', desc: 'あたたかい眠気のなかで、夢のような幻がゆらゆら揺れる。',
    f: function (m, s) { m.mul.ps -= 0.15 * s; m.add.eu += 0.3 * s; m.add.se += 0.15 * s; } },
  { id: 'mirrorlove', name: '鏡の中の愛', need: [{ c: 'dis' }, { c: 'emp' }], danger: 1,
    hint: '解離系 × ハート系', desc: '離れたところから自分を見て、その自分のことも大好きになる。',
    f: function (m, s) { m.add.em += 0.3 * s; m.add.di += 0.15 * s; m.add.eu += 0.2 * s; } },
  { id: 'reset', name: '強制リセット', need: [], special: true, danger: 1,
    hint: 'リセットラムネ × ぬくぬく系', desc: 'ぬくぬく系を一瞬で打ち消した。命は助かるが、反動で最悪の気分になる。' },
  { id: 'placebo', name: 'プラセボ効果', need: [], special: true, danger: 0,
    hint: 'ただのラムネ ×（思い込み）', desc: 'ただのラムネなのに、なんだか効いてきた気がする。人間の脳っておもしろい。' },
  { id: 'chain', name: 'ラムネ・パーティー', need: [], special: true, danger: 2,
    hint: '4系統以上を同時に', desc: '4種類以上の系統が同時に効いている。もう自分が何を飲んだのかもわからない。' }
];
var COMBO = {}; COMBOS.forEach(function (c) { COMBO[c.id] = c; });

// ---- inner monologue (shown as subtitles) ------------------------------------
var VOICE = {
  idle: ['今夜はなにしよう。', '冷蔵庫にZER9が冷えてる。', 'テーブルの上にラムネのケースがある。', '静かな夜だな。'],
  ps: ['カーテンの模様が、フラクタルに増殖してる…', '壁が…呼吸してる？', '色に音がある。ピンクは「ぽーん」って鳴る。', '天井がとけて、星が見える…', '手のひらの線が、地図みたいに動いてる', '時計の数字が泳いでいった'],
  st: ['いま部屋の掃除をしたら一瞬で終わる気がする！', 'しゃべりたい。だれかにしゃべりたい。', '心臓の音がうるさい', '全然ねむくない。むしろ朝まで余裕。', '歯をかみしめてた…'],
  se: ['ソファと一体化してきた…', 'まぶたが…おもい…', 'なにもかも、どうでもいい…', 'あと5分だけ…目をとじる…'],
  pa: ['ぬくぬく…毛布の中みたい…', 'からだがあったかい…', 'いやなこと、ぜんぶ遠くにある…'],
  di: ['自分の手が、他人の手みたいだ', '自分の体を、後ろから見てる…？', '部屋がとても遠い。廊下が1キロある。', 'いま、どっちが上だっけ'],
  de: ['さっきから、だれかソファに座ってる…？', 'あ、タバコ吸おう。…タバコ持ってないのに。', 'スマホが鳴ってる。…鳴ってない。', '壁を小さい虫が歩いてる…', 'だれかと話してたんだけど、だれだっけ'],
  em: ['みんな大好き。冷蔵庫も大好き。', 'このクッション、さわり心地が天才', '今ならだれとでも仲よくなれる', '音楽が…体にしみる…'],
  an: ['なんか…やばい気がする', 'ドアの向こうにだれかいない？', '落ち着け…落ち着け…', '心臓の音、大きすぎない？'],
  na: ['うっ…気持ち悪い', '吐きそう…トイレどこだっけ', '胃がぐるぐるする'],
  drunk: ['まだ全然よってないし', 'ZER9、もう1本いっちゃう？', '床がななめになってる', 'へへへ…'],
  hot: ['あつい…ベランダで風にあたりたい', 'のどがカラカラ…水…'],
  danger: ['息が…うまく…できない…', 'これ、本当にやばいかも', '心臓が…いたい…', '体が…あつすぎる…']
};
var EFFECT_NAMES = { eu: '多幸感', st: '覚醒', se: '鎮静', ps: '幻覚', di: '解離', de: 'せん妄', em: '共感', an: '不安', na: '吐き気', pa: 'ぬくぬく', drunk: '酔い' };
