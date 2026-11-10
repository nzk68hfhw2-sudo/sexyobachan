// ---- phone: home screen + apps ---------------------------------------------------------
// friends are fictional characters
var FRIENDS = [
  { id: 'misaki', name: 'ミサキ', icon: '🐰', col: '#ff8fb1', desc: '幼なじみ。しっかり者で心配性', sleep: 25 * 60 + 30 },
  { id: 'kenta', name: 'ケンタ', icon: '🦊', col: '#ffb347', desc: '大学の友達。夜型で朝までゲーム', sleep: 31 * 60 + 30 },
  { id: 'yuzu', name: 'ユズ', icon: '🍋', col: '#d8f060', desc: 'バイト先の後輩。絵文字が多い', sleep: 26 * 60 + 30 },
  { id: 'haru', name: 'ハル', icon: '🌧', col: '#a3b1ff', desc: '元恋人。連絡するとたぶん後悔する', sleep: 27 * 60 },
  { id: 'mom', name: 'お母さん', icon: '🌷', col: '#9ec5e8', desc: '実家の母。夜は早い', sleep: 22 * 60 + 30 }
];
var FRIEND = {}; FRIENDS.forEach(function (f) { FRIEND[f.id] = f; });
var GROUP = { id: 'group', name: 'いつメン', icon: '👥', col: '#c77dff', members: ['misaki', 'kenta', 'yuzu'] };

function moodKey(B) {
  var F = B.F;
  if (B.danger > 15 || B.rr < 9 || B.hr > 170 || B.tp > 39.3) return 'danger';
  if (F.de > 0.6) return 'del';
  if (F.di > 0.8) return 'dis';
  if (F.ps > 0.7) return 'psy';
  if (F.em > 0.6) return 'emp';
  if (F.st > 0.7) return 'up';
  if (F.se > 0.9 || F.pa > 0.8) return 'down';
  if (B.motor > 0.6) return 'drunk';
  if (B.motor > 0.22) return 'tipsy';
  return 'sober';
}
var MOOD_NAME = { sober: 'シラフ', tipsy: 'ほろ酔い', drunk: '泥酔', up: 'ハイテンション', down: 'ねむねむ', psy: 'トリップ中', dis: 'ふわふわ', emp: 'ラブ', del: 'こんらん', danger: 'ぐったり' };
var MOOD_TYPO = { drunk: 1.3, tipsy: 0.45, down: 0.4, dis: 0.5, danger: 0.6 };

// ---- calls ----
var ME_CALL = {
  sober: 'もしもし、いま暇？', tipsy: 'もしもし〜！いま家で飲んでる〜', drunk: 'もひもひ…？あれ、だれにかけたんだっけ', up: 'ねえねえ聞いて！いま最高にアイデアが降ってきてて！',
  down: '……ん……もしもし……', psy: 'ねえ、電話の声が虹色に見える…', dis: '…いま、自分がどこにいるかわかんない…', emp: 'ほんとにさ…出会ってくれてありがとう…', del: 'さっきうちに来てたよね？', danger: '……なんか…息が…くるしい……'
};
var FR_CALL = {
  misaki: { sober: 'めずらしいね！ちゃんとご飯食べた？', tipsy: 'また飲んでるの？ほどほどにね〜', drunk: 'ちょっと、ろれつ回ってないよ…？水飲んで、もう寝な。', up: 'テンション高すぎない…？ちゃんと寝なよ？', down: 'え、声ねむそう…大丈夫？', psy: '…なに言ってるの？ほんとに大丈夫？', dis: 'ねえ、ほんとに大丈夫？いま家？', emp: 'え、どうしたの急に…でも、ありがと。笑', del: 'だれも来てないよ…？ちょっと心配なんだけど。', danger: 'ちょっと待って！それ本気で危ないって！救急車呼ぶよ！？' },
  kenta: { sober: 'おー、どした？いまランクマ中！', tipsy: 'いいねぇ、俺も飲みながらゲームしてる', drunk: 'お前ベロベロじゃん！笑　水飲めって', up: 'わかる！わかんないけどわかる！', down: 'おーい、寝落ちすんなよ〜', psy: '星空？いいなー、こっちはモニターしか見えない', dis: 'お前、声が宇宙人みたいになってる', emp: 'お、おう…俺も好きだぞ…？笑', del: 'だれもいねーって。こわいこと言うなよ', danger: 'え、マジでやばくない？救急車呼べ！俺から呼ぼうか！？' },
  yuzu: { sober: 'せんぱーい！どうしたんですか〜？☺️', tipsy: 'せんぱい飲んでる〜！いいな〜🍋', drunk: 'せんぱい、酔いすぎです😂 お水！', up: 'せんぱいめっちゃ元気〜！⚡', down: 'せんぱい、ねむそう…おやすみなさい？🌙', psy: 'え、天井が星空…？せんぱい大丈夫です…？', dis: 'せんぱい、どこにいるんですか…？', emp: 'えっ…せんぱい…どうしたんですか…🥺', del: 'え、こわいこわい！だれもいないですよ…？', danger: 'せんぱい！？それ救急車案件です！呼びますね！？' },
  haru: { sober: '…どうしたの、急に。', tipsy: '…飲んでるでしょ。', drunk: '…酔ってかけてくるの、やめてって言ったよね。', up: '…そのテンション、なつかしいけど。', down: '…眠いなら寝なよ。', psy: '…何の話？', dis: '…大丈夫なの？', emp: '…そういうの、今さら言われても。', del: '…行ってないよ。', danger: '…ちょっと、本気で声おかしいよ。救急車呼ぶ？' },
  mom: { sober: 'あら、めずらしい。ちゃんとご飯食べてる？', tipsy: 'お酒もほどほどにしなさいよ。', drunk: 'あんた酔っぱらってるでしょ。早く寝なさい。', up: 'こんな時間に元気ねえ…早く寝なさい。', down: 'もう寝なさい。おやすみ。', psy: '…なに言ってるの？熱でもあるの？', dis: 'ちょっと、大丈夫なの？', emp: 'あら…お母さんもよ。どうしたの急に。', del: 'だれも行ってないわよ。疲れてるんじゃない？', danger: '声がおかしいわよ！いますぐ救急車呼びなさい！' }
};
var SLEEP_LINE = { misaki: '（留守番電話…ミサキはもう寝ているみたい）', kenta: '（呼び出し音だけが鳴りつづける…ヘッドホンで気づいてないのかも）', yuzu: '（留守番電話…ユズはもう寝ているみたい）', haru: '（…出ない。たぶん、わざと）', mom: '（留守番電話…お母さんはもう寝ている時間だ）' };
var TOPICS = [
  { id: 'news', label: '最近どう？', me: '最近どう？' },
  { id: 'now', label: 'いま何してるか話す', me: 'いま家でさ、ラムネケースとZER9があって…' },
  { id: 'worry', label: '相談する', me: 'ちょっと聞いてほしいことがあって…' },
  { id: 'love', label: '好きって言う', me: 'あのさ…すき。' },
  { id: 'ramune', label: 'ラムネの話をする', me: '今夜いろんなラムネ飲んでてさ…' },
  { id: 'help', label: 'たすけてって言う', me: '…ちょっと、具合が悪いかも…' },
  { id: 'bye', label: 'おやすみって言う', me: 'じゃあ、おやすみ。' }
];
var FR_TOPIC = {
  misaki: { news: 'こっちは相変わらず。仕事いそがしい〜', now: 'ふーん…飲みすぎないでよ？', worry: 'うん、聞くよ。ゆっくりでいいから。', love: 'はいはい、知ってる知ってる。笑　…ありがと。', ramune: 'え、それ大丈夫なやつ？ほんとに無理しないで。', help: 'え、どこが？水飲んで、ひどいならすぐ119ね。電話つないだままにする？', bye: 'おやすみ。ちゃんと布団で寝なよ。' },
  kenta: { news: '新作ゲームにハマってる。寝てない。', now: 'いい夜すごしてんな〜', worry: 'お、どした。聞くぞ。', love: 'え、なに、こわい。笑', ramune: 'ほどほどにしとけよ？マジで。', help: 'マジ？やばかったらすぐ119な。俺も起きとくから。', bye: 'おう、おやすみー' },
  yuzu: { news: 'シフトばっかりです〜😭', now: 'いいな〜🍋 でも気をつけてくださいね！', worry: 'せんぱいの話ならなんでも聞きます！', love: 'えっ…えっ…🥺🥺', ramune: 'せんぱい…ちょっと心配です…', help: 'えっ！？無理しないで、すぐ119してください！！', bye: 'おやすみなさい🌙' },
  haru: { news: '…普通だよ。', now: '…そっか。', worry: '…それ、私に話すことかな。', love: '…酔ってるときに言わないで。', ramune: '…そういうとこ、変わってないね。', help: '…ほんとに？それならすぐ119して。', bye: '…おやすみ。' },
  mom: { news: 'こっちはみんな元気よ。', now: '早く寝なさいね。', worry: 'なに、どうしたの？話してごらん。', love: 'あら、お母さんもよ。', ramune: 'なにそれ？変なもの飲んでないでしょうね。', help: 'すぐ119番しなさい！お母さんも今からそっちに電話かけ直すから！', bye: 'おやすみ。戸締まりしてね。' }
};

// ---- DM ----
var DM_SUGGEST = {
  sober: ['なにしてる？', '明日ひま？', 'おつかれー', '今度ごはん行こ'],
  tipsy: ['いま家で飲んでる🍋', 'ZER9 なんぼんめだっけ', '会いたいな〜', 'ちょっと電話していい？'],
  drunk: ['いまなにしてりゅ', 'あいたいいいいい', 'おれ　よってない', 'すき'],
  up: ['ねえ聞いて！！！', '今から集まらない！？', 'すごいこと思いついた⚡⚡⚡', '朝まで起きてよ！'],
  down: ['ねむ', '……', 'おやすみ', 'ふとん'],
  psy: ['空の色、何色に見える？', 'かべが呼吸してるんだけど', '🌈🌈🌈', '時計が溶けた'],
  dis: ['いまどこにいるかわからない', 'ここにいる？', '自分がとおい', 'うちゅう'],
  emp: ['だいすき', 'いつもありがとう🫶', '出会ってくれてありがとう', 'みんなで住みたい'],
  del: ['さっき来てたよね？', 'うちにだれかいる', '電話鳴った？', 'たばこある？'],
  danger: ['たすけて', 'くるしい', '息が', '119']
};
var STICKERS = ['🍋', '🫶', '😴', '🌈', '🙏', '🤮', '👻', '🎉'];
var FR_DM = {
  misaki: { sober: ['ひまだよー。どした？', 'おつかれー！'], tipsy: ['飲みすぎないでね！'], drunk: ['酔ってるでしょ。水飲んで寝な？', 'なに言ってるかわかんないよ笑'], up: ['テンション高っ。ちゃんと寝てね'], down: ['おやすみー'], psy: ['？？？ 大丈夫？'], dis: ['え、家にいるんだよね？'], emp: ['なに急に〜照れる'], del: ['だれも来てないよ？大丈夫？'], danger: ['本気でやばいなら119して！！いま電話する！'], sticker: ['かわいいスタンプ笑'] },
  kenta: { sober: ['ゲーム中ー', 'どしたー'], tipsy: ['かんぱーい🍺'], drunk: ['なにいってんのw', '寝ろwww'], up: ['わかるwww'], down: ['おやすみー'], psy: ['いい夜すごしてんなw'], dis: ['どこ行ったんだよw'], emp: ['お、おう？ありがと？'], del: ['こわいこと言うなし'], danger: ['え、マジならすぐ119な！！'], sticker: ['👍'] },
  yuzu: { sober: ['おつかれさまです〜☺️'], tipsy: ['いいな〜🍋🍋'], drunk: ['せんぱいwww 寝てください😂'], up: ['どうしたんですか⚡笑'], down: ['おやすみなさい🌙'], psy: ['🌈？？'], dis: ['せんぱい大丈夫です…？'], emp: ['🥺🥺🥺'], del: ['え、こわい…'], danger: ['せんぱい！！119してください！！'], sticker: ['🎉🎉🎉'] },
  haru: { sober: ['…なに？'], tipsy: ['…飲んでるでしょ'], drunk: ['…寝なよ', '既読'], up: ['…元気だね'], down: ['…おやすみ'], psy: ['…？'], dis: ['…大丈夫？'], emp: ['…そういうのやめて'], del: ['…行ってないよ'], danger: ['…本気なら119して。'], sticker: ['…'] },
  mom: { sober: ['げんき？'], tipsy: ['飲みすぎないように'], drunk: ['早く寝なさい'], up: ['もう寝なさい'], down: ['おやすみ'], psy: ['大丈夫？'], dis: ['大丈夫なの？'], emp: ['お母さんもよ'], del: ['疲れてるのよ。早く寝なさい'], danger: ['すぐ119番しなさい！'], sticker: ['スタンプの使い方がわからない'] }
};
var FR_PING = {
  misaki: ['起きてる？', '明日のお昼、どうする？', 'ちゃんと寝なよー'],
  kenta: ['今からゲームやらん？', 'ねむれん', 'ガチャ爆死した'],
  yuzu: ['せんぱーい！起きてますか〜？🌙', 'シフト代わってほしいです🙏', '見て、夜の空きれい✨'],
  haru: ['…起きてる？', '…なんでもない'],
  mom: ['ちゃんとご飯食べてる？', 'お米送ったからね']
};
var GROUP_TALK = [['kenta', 'だれか起きてるー？'], ['yuzu', '起きてます〜🙋'], ['misaki', 'あんたたち早く寝なよ'], ['kenta', 'ミサキもな'], ['yuzu', '今度みんなでごはん行きたいです！'], ['misaki', 'いいね、来週あたり？']];

// ---- SNS (fictional app "ナイトライン") ----
var SNS_USERS = [
  { name: 'まよなかの猫', icon: '🐈' }, { name: 'コンビニ夜勤', icon: '🏪' }, { name: '終電のがした', icon: '🚃' }, { name: 'ねむれないOL', icon: '🌙' }, { name: '深夜ラジオ好き', icon: '📻' }, { name: '月見バーガー', icon: '🍔' }, { name: 'ねこ店長', icon: '😺' }, { name: '朝焼けハンター', icon: '🌅' }
];
var SNS_POOL = ['寝る前にカップ麺食べちゃった', 'まだ起きてる人〜？', '終電のがしたので歩いて帰ってます', '夜中のコンビニって落ちつく', '明日（もう今日）のことは考えない', '深夜ラジオおもしろすぎる', 'ねむれないから羊かぞえてる 1243匹', '雨のにおいがする', '月がきれい', 'あしたの自分、がんばれ', '夜食にみかん #みかん部', '星がきれいに見える夜 #夜空', 'ゲームやめどきがわからない', '朝焼けまであと何時間？'];
var SNS_TAGS = ['#夜ふかし', '#金曜の夜', '#ZER9', '#みかん部', '#夜空', '#ねむれない', '#ナイトライン'];
var SNS_SUGGEST = {
  sober: ['今夜はのんびり。', '夜景がきれい。', 'みかんうまい', '金曜の夜、なにしよう'],
  tipsy: ['ZER9うますぎ問題', '金曜の夜さいこう🍋', 'ほろよい', 'だれか飲もう'],
  drunk: ['おれは　よってない', 'みんなだいすきだあああああ', 'ゆかがななめ', '元恋人に電話しそう'],
  up: ['人生の真理に気づいたかもしれない', '今なら何でもできる！！！', '朝まで起きてる人集合！！', '部屋の模様がえ始めた'],
  down: ['ねむ', 'ソファと結婚した', '……', 'もう動けない'],
  psy: ['かべが呼吸してる', '天井の向こうに宇宙があった', '色に音がある🌈', '時計が溶けてる'],
  dis: ['自分の体を後ろから見てる', 'いまどこ', '重力どこいった', '廊下が1キロある'],
  emp: ['フォロワーのみんな愛してる🫶', 'この世界やさしすぎる', '今夜、全員と友達になりたい', 'クッションと結婚します'],
  del: ['ソファにだれか座ってる', 'さっきから壁に虫が', 'スマホ鳴った？', 'うちに知らない人がいる'],
  danger: ['たすけ', 'いき', '…', 'くるしい']
};
var SNS_REPLIES = ['え、だいじょうぶ？', 'わかる', 'それな', '寝なよw', '今夜もおつかれ', '朝になったら消しなよ笑', 'なにがあった', '🌙', 'いいね', '草'];

// ---- delivery (fictional app "ヨルイーツ") ----
var MENU = [
  { id: 'water', name: 'ミネラルウォーター 2L', icon: '💧', price: 280, desc: '水分がたっぷりもどる。', fn: function (B) { B.hyd = Math.min(1, B.hyd + 0.5); B.waterCool = 1; } },
  { id: 'sports', name: 'スポーツドリンク', icon: '🥤', price: 220, desc: '水分と、少しの吐き気どめ。', fn: function (B) { B.hyd = Math.min(1, B.hyd + 0.35); B.naRelief = Math.max(B.naRelief, 0.3); } },
  { id: 'ramen', name: '深夜ラーメン', icon: '🍜', price: 980, desc: 'おなかいっぱい。チルのあとは最高。', fn: function (B) { B.socialT = Math.max(B.socialT || 0, 20); B.stom *= 0.85; } },
  { id: 'pizza', name: 'ピザ Mサイズ', icon: '🍕', price: 1800, desc: 'みんなで食べたい…けどひとり。', fn: function (B) { B.socialT = Math.max(B.socialT || 0, 15); } },
  { id: 'ice', name: 'アイス 3個', icon: '🍦', price: 600, desc: '体がひんやり。', fn: function (B) { B.tp = Math.max(36.6, B.tp - 0.35); } },
  { id: 'zer9', name: 'ZER9 ドライレモン 3本', icon: '🍋', price: 690, desc: '冷蔵庫に3本追加。', fn: function () { GAME.stash.z9lemon = (GAME.stash.z9lemon || 0) + 3; } },
  { id: 'kit', name: 'うちの救急セット', icon: '🩹', price: 1200, desc: '冷えピタ・水・胃薬（架空）。体温と吐き気が少しおさまる。', fn: function (B) { B.tp = Math.max(36.6, B.tp - 0.4); B.naRelief = Math.max(B.naRelief, 0.4); B.hyd = Math.min(1, B.hyd + 0.2); } }
];

// ---- music ----
var TRACKS = [
  { id: 'lofi', name: 'ローファイ・ナイト', desc: 'いつもの夜のBGM' },
  { id: 'ambient', name: 'アンビエント・スペース', desc: 'ドラムなし。ゆっくり漂う' },
  { id: 'techno', name: 'ミッドナイト・テクノ', desc: '四つ打ち。アッパーに合う' },
  { id: 'citypop', name: 'シティ・ナイトドライブ', desc: '都会の夜のポップス' }
];

function mangle(t, k) {
  if (!k || k <= 0) return t;
  var s = '', small = 'ぁぃぅぇぉゃゅょっ';
  for (var i = 0; i < t.length; i++) {
    var c = t[i];
    s += c;
    if (Math.random() < 0.12 * k) s += c;
    if (Math.random() < 0.06 * k) s += small[Math.floor(Math.random() * small.length)];
  }
  return s;
}

// ---- per-night phone state ---------------------------------------------------------------
function resetPhone() {
  GAME.dm = {}; GAME.unread = {}; GAME.rel = {};
  FRIENDS.concat([GROUP]).forEach(function (f) { GAME.dm[f.id] = []; GAME.unread[f.id] = 0; GAME.rel[f.id] = 60; });
  GAME.rel.haru = 25;
  GAME.dm.misaki.push({ me: false, text: '今日はちゃんと休みなよー', at: START_CLOCK - 120 });
  GAME.dm.haru.push({ me: true, text: 'げんき？', at: START_CLOCK - 60 * 24 * 40, read: true });
  GAME.dm.group.push({ me: false, who: 'kenta', text: '金曜だー！', at: START_CLOCK - 90 });
  GAME.dm.group.push({ me: false, who: 'yuzu', text: 'おつかれさまです〜🎉', at: START_CLOCK - 85 });
  GAME.sns = []; GAME.snsFollowers = 128; GAME.snsNotif = [];
  for (var i = 0; i < 6; i++) snsNpcPost(START_CLOCK - (6 - i) * 25);
  GAME.phoneQ = []; GAME.pingT = rnd(40, 70); GAME.snsT = 30; GAME.calls = 0; GAME.groupT = rnd(50, 90); GAME.groupI = 0;
  GAME.album = []; GAME.wallet = 8000; GAME.orders = []; GAME.alarm = null; GAME.flash = false; GAME.logs = []; GAME.calllog = [];
  GAME.typing = {};
  updatePhoneBadge();
}
function logEvent(text) { if (GAME.logs) { GAME.logs.push({ at: GAME.clock, text: text }); if (GAME.logs.length > 200) GAME.logs.shift(); } }
function snsNpcPost(at) {
  var u = pick(SNS_USERS);
  GAME.sns.unshift({ user: u.name, icon: u.icon, text: pick(SNS_POOL), likes: Math.floor(rnd(0, 40)), at: at, replies: [] });
  if (GAME.sns.length > 50) GAME.sns.pop();
}
function totalUnread() { var n = 0; if (!GAME.unread) return 0; for (var k in GAME.unread) n += GAME.unread[k]; return n; }
function phoneBadgeCount() { return totalUnread() + (GAME.snsNotif ? GAME.snsNotif.filter(function (n) { return !n.seen; }).length : 0) + (GAME.orders ? GAME.orders.filter(function (o) { return o.arrived && !o.got; }).length : 0); }
function updatePhoneBadge() { if (HUD.bPhone) HUD.bPhone.classList.toggle('notif', phoneBadgeCount() > 0); }
function friendAwake(f) { if (f.id === 'group') return GROUP.members.some(function (m) { return friendAwake(FRIEND[m]); }); return GAME.clock < f.sleep || (f.id === 'kenta' && Math.random() < 0.8); }
function relChange(fid, d) { if (GAME.rel[fid] != null) GAME.rel[fid] = clamp(GAME.rel[fid] + d, 0, 100); }
function relHearts(fid) { var v = GAME.rel[fid] || 0; return '❤'.repeat(Math.round(v / 20)) + '<span style="opacity:.3">' + '❤'.repeat(5 - Math.round(v / 20)) + '</span>'; }

// runs every frame in play
function updatePhone(dt) {
  if (!GAME.phoneQ) return;
  for (var i = GAME.phoneQ.length - 1; i >= 0; i--) {
    var q = GAME.phoneQ[i]; q.t -= dt;
    if (q.t > 0) continue;
    GAME.phoneQ.splice(i, 1);
    if (q.type === 'dm') {
      GAME.typing[q.f] = false;
      GAME.dm[q.f].push({ me: false, text: q.text, at: GAME.clock, who: q.who });
      if (PHONE_APP.app === 'dmthread' && PHONE_APP.f === q.f && MODAL) { renderPhoneApp(); sfx('ui'); }
      else { GAME.unread[q.f]++; var nm = q.f === 'group' ? GROUP.name + '（' + FRIEND[q.who].name + '）' : FRIEND[q.f].name; toast('💬 ' + nm + '「' + q.text + '」'); sfx('buzz'); }
      updatePhoneBadge();
    } else if (q.type === 'typing') {
      GAME.typing[q.f] = true; if (PHONE_APP.app === 'dmthread' && PHONE_APP.f === q.f && MODAL) renderPhoneApp();
    } else if (q.type === 'like') {
      var p = q.ref; if (p.deleted) continue;
      p.likes += q.n; if (q.reply) p.replies.push(q.reply);
      GAME.snsFollowers += Math.random() < 0.3 ? 1 : 0;
      GAME.snsNotif.unshift({ text: (q.reply ? q.reply.user + 'さんが返信：「' + q.reply.text + '」' : 'あなたの投稿に いいね ' + q.n + ' 件'), at: GAME.clock });
      if (q.notify) toast('🌙 ナイトライン：いいね ' + p.likes + ' 件' + (q.reply ? '・返信あり' : ''));
      updatePhoneBadge();
    }
  }
  // delivery & alarm run on game time
  if (GAME.orders) GAME.orders.forEach(function (o) {
    if (!o.arrived && GAME.clock >= o.at) { o.arrived = true; sfx('chime'); toast('🔔 ピンポーン。ヨルイーツです、玄関に置いておきますね。', 'good', 4); showPackage(true); logEvent('📦 デリバリーが届いた'); updatePhoneBadge(); }
  });
  if (GAME.alarm != null && GAME.clock >= GAME.alarm) {
    GAME.alarm = null; sfx('alarm'); toast('⏰ アラーム！', 'good', 4); logEvent('⏰ アラームが鳴った');
    if (GAME.rest) endRest('アラームで目が覚めた。');
  }
  if (GAME.paused) return;
  var gdt = dt * (GAME.speed || 1);
  GAME.pingT -= gdt;
  if (GAME.pingT <= 0) {
    GAME.pingT = rnd(45, 90);
    var aw = FRIENDS.filter(function (f) { return friendAwake(f) && (f.id !== 'haru' || Math.random() < 0.3); });
    if (aw.length) { var f = pick(aw); queueDM(f.id, pick(FR_PING[f.id]), 0); }
  }
  GAME.groupT -= gdt;
  if (GAME.groupT <= 0) { GAME.groupT = rnd(60, 110); var gl = GROUP_TALK[GAME.groupI++ % GROUP_TALK.length]; if (friendAwake(FRIEND[gl[0]])) queueDM('group', gl[1], 0, gl[0]); }
  GAME.snsT -= gdt;
  if (GAME.snsT <= 0) { GAME.snsT = rnd(20, 40); snsNpcPost(GAME.clock); }
}
function queueDM(fid, text, delay, who) {
  if (delay > 1.2) GAME.phoneQ.push({ type: 'typing', f: fid, t: delay - 1.2 });
  GAME.phoneQ.push({ type: 'dm', f: fid, text: text, t: delay, who: who });
}

// ---- phone UI -----------------------------------------------------------------------------
var PHONE_APP = { app: 'home', f: null };
var APPS = [
  { id: 'body', icon: '🫀', name: 'からだ', play: true },
  { id: 'call', icon: '📞', name: '電話', play: true },
  { id: 'dm', icon: '💬', name: 'メッセージ', play: true },
  { id: 'sns', icon: '🌙', name: 'ナイトライン', play: true },
  { id: 'camera', icon: '📷', name: 'カメラ', play: true },
  { id: 'album', icon: '🖼', name: 'アルバム', play: true },
  { id: 'music', icon: '🎵', name: 'ミュージック', play: true },
  { id: 'eats', icon: '🛵', name: 'ヨルイーツ', play: true },
  { id: 'map', icon: '🗺', name: 'へやマップ', play: true },
  { id: 'alarm', icon: '⏰', name: 'アラーム', play: true },
  { id: 'light', icon: '🔦', name: 'ライト', play: true },
  { id: 'memo', icon: '📝', name: 'トリップログ', play: true },
  { id: 'zukan', icon: '🍬', name: 'ラムネ図鑑' },
  { id: 'combo', icon: '🧪', name: '飲み合わせ' },
  { id: 'check', icon: '⚖', name: 'チェッカー' },
  { id: 'term', icon: '⌨', name: 'コマンド' },
  { id: 'help', icon: '🚑', name: '119・たすけ', play: true },
  { id: 'set', icon: '⚙', name: '設定' }
];
var APP_TITLE = { home: 'スマホ', body: 'からだ', call: '電話', dm: 'メッセージ', sns: 'ナイトライン', camera: 'カメラ', album: 'アルバム', music: 'ミュージック', eats: 'ヨルイーツ', map: 'へやマップ', alarm: 'アラーム', light: 'ライト', memo: 'トリップログ', zukan: 'ラムネ図鑑', combo: '飲み合わせ図鑑', check: '飲み合わせチェッカー', term: 'コマンド', help: '119・たすけ', set: '設定', calling: '通話' };
function openPhone(app) {
  PHONE_APP.app = app || 'home'; PHONE_APP.f = null;
  openModal('スマホ', function (body, M) { PHONE_APP.body = body; renderPhoneApp(); });
  tutEvent('phone');
}
function phoneNav(app, f) { PHONE_APP.app = app; PHONE_APP.f = f || null; sfx('ui'); renderPhoneApp(); }
function renderPhoneApp() {
  var body = PHONE_APP.body; if (!body || !MODAL) return;
  body.innerHTML = '';
  var a = PHONE_APP.app;
  setModalTitle(a === 'dmthread' ? (PHONE_APP.f === 'group' ? GROUP.name : FRIEND[PHONE_APP.f].name) : (APP_TITLE[a] || 'スマホ'));
  if (a !== 'home' && a !== 'calling') {
    var back = el('button', 'btn ghost rm-back', '← ' + (a === 'dmthread' ? 'メッセージ' : 'ホーム'), body);
    onTap(back, function () { phoneNav(a === 'dmthread' ? 'dm' : 'home'); });
  }
  var fn = { home: phoneHome, body: phoneBody, zukan: phoneZukan, combo: phoneCombo, help: phoneHelp, set: phoneSettings, call: phoneCallList, dm: phoneDMList, dmthread: phoneDMThread, sns: phoneSNS, camera: phoneCamera, album: phoneAlbum, music: phoneMusic, eats: phoneEats, map: phoneMap, alarm: phoneAlarm, light: phoneLight, memo: phoneMemo, check: phoneChecker, term: phoneTerm }[a];
  if (fn) fn(body);
  if (a === 'dmthread' || a === 'term') { setTimeout(function () { body.scrollTop = body.scrollHeight; }, 0); }
}
function phoneHome(body) {
  var playing = GAME.mode === 'play';
  el('div', 'rm-ph-status', fmtClock(GAME.clock) + (playing ? '　<span>いまの状態：' + MOOD_NAME[moodKey(GAME.B)] + (GAME.wallet != null ? '　・　💴 ¥' + GAME.wallet.toLocaleString() : '') + '</span>' : '<span>タイトル画面では一部のアプリだけ使えます</span>'), body);
  var g = el('div', 'rm-apps', '', body);
  APPS.forEach(function (ap) {
    if (ap.play && !playing) return;
    var n = 0;
    if (playing) { if (ap.id === 'dm') n = totalUnread(); if (ap.id === 'sns') n = GAME.snsNotif.filter(function (x) { return !x.seen; }).length; if (ap.id === 'eats') n = GAME.orders.filter(function (o) { return o.arrived && !o.got; }).length; }
    var c = el('div', 'rm-app', '<div class="ic">' + ap.icon + (n ? '<i>' + n + '</i>' : '') + '</div><div>' + ap.name + '</div>', g);
    onTap(c, function () { phoneNav(ap.id); });
  });
}

// ---- 🫀 body (enhanced) ----
function phoneBody(body) {
  var B = GAME.B;
  el('div', 'rm-big', '<div><b>' + Math.round(B.hr) + '</b><span>心拍（回/分）</span></div><div><b>' + B.tp.toFixed(1) + '℃</b><span>体温</span></div><div><b>' + B.rr.toFixed(1) + '</b><span>呼吸（回/分）</span></div><div><b>' + Math.round(B.con) + '%</b><span>意識</span></div><div><b>' + Math.round(B.hyd * 100) + '%</b><span>水分</span></div><div><b>' + B.bac.toFixed(3) + '%</b><span>血中アルコール（架空）</span></div><div><b>' + Math.round(B.danger) + '</b><span>危険度（100で終わり）</span></div><div><b>' + MOOD_NAME[moodKey(B)] + '</b><span>いまの状態</span></div>' + ((B.liver || 0) > 0.3 ? '<div><b class="' + (B.liver >= 3 ? 'dg3' : B.liver >= 1.5 ? 'dg2' : 'dg1') + '">' + (B.liver >= 3 ? '危険' : B.liver >= 1.5 ? '注意' : '少し') + '</b><span>肝臓への負担（自覚なし）</span></div>' : ''), body);
  var cv = el('canvas', 'rm-graph', '', body); cv.width = 600; cv.height = 180; cv.style.marginTop = '10px';
  drawHistory(cv);
  el('div', 'rm-note', '— 心拍（ピンク）・体温（オレンジ）・呼吸（水色）・危険度（赤）', body).style.marginTop = '4px';
  // feelings
  var fl = el('div', 'rm-bars', '', body);
  ['eu', 'st', 'se', 'ps', 'di', 'de', 'em', 'pa', 'an', 'na'].forEach(function (k) {
    var v = B.F[k] || 0; if (v < 0.05) return;
    el('div', '', '<span>' + EFFECT_NAMES[k] + '</span><div class="b"><i style="width:' + clamp(v / 2 * 100, 3, 100) + '%"></i></div><b>' + v.toFixed(2) + '</b>', fl);
  });
  // active combos
  var act = COMBOS.filter(function (c) { return !c.special && (B.comboS[c.id] || 0) > 0.3; });
  if (act.length) {
    el('div', 'rm-note', '効いている飲み合わせ', body).style.marginTop = '10px';
    var al = el('div', 'rm-list', '', body);
    act.forEach(function (c) { var k = SAVE.seenCombos[c.id]; el('div', 'rm-item', '<div class="tx"><b class="dg' + c.danger + '">🧪 ' + (k ? esc(c.name) : '？？？') + '</b><small>' + esc(c.hint) + '・強さ ' + Math.round(Math.min(1.5, B.comboS[c.id]) / 1.5 * 100) + '%</small></div>', al); });
  }
  // timeline forecast
  var fc = [];
  B.doses.forEach(function (d) {
    var s = SUB[d.s]; if (s.hidden) return;
    if (d.t < s.on) fc.push([s.on - d.t, s.name + ' が効きはじめる']);
    else if (d.t < s.pk) fc.push([s.pk - d.t, s.name + ' がピークになる']);
    else if (d.t < s.pl) fc.push([s.pl - d.t, s.name + ' が切れはじめる']);
    else if (d.t < s.du) fc.push([s.du - d.t, s.name + ' がほぼ切れる']);
  });
  fc.sort(function (a, b) { return a[0] - b[0]; });
  el('div', 'rm-note', 'このあとの予定（だいたい）', body).style.marginTop = '10px';
  var l = el('div', 'rm-list', '', body);
  if (!fc.length) el('div', 'rm-item', '<div class="tx"><b>とくになし</b><small>いま体に入っているものは、もうほとんど切れている。</small></div>', l);
  fc.slice(0, 6).forEach(function (f) { el('div', 'rm-item', '<div class="tx"><b>' + fmtClock(GAME.clock + f[0]) + '（あと' + timeText(f[0]) + '）</b><small>' + esc(f[1]) + '</small></div>', l); });
  el('div', 'rm-note', '今夜：ラムネ ' + B.stats.pills + ' 個 ・ お酒 ' + B.stats.cans + ' 缶 ・ 水 ' + B.stats.waters + ' 杯 ・ 吐いた回数 ' + B.stats.vomits + ' ・ 見つけた飲み合わせ ' + B.found.length, body).style.marginTop = '8px';
}

// ---- 📞 calls ----
function phoneCallList(body) {
  var l = el('div', 'rm-list', '', body);
  FRIENDS.forEach(function (f) {
    var it = el('div', 'rm-item', '<div class="rm-av" style="background:' + f.col + '">' + f.icon + '</div><div class="tx"><b>' + f.name + ' <span class="rm-hearts">' + relHearts(f.id) + '</span></b><small>' + f.desc + (friendAwake(f) ? '' : '・たぶん寝ている') + '</small></div>', l);
    var b = el('button', 'btn', '📞', it); onTap(b, function () { startCall(f, false); });
    var v = el('button', 'btn', '🎥', it); onTap(v, function () { startCall(f, true); });
  });
  if (GAME.calllog.length) {
    el('div', 'rm-note', '通話履歴', body).style.marginTop = '10px';
    var h = el('div', 'rm-list', '', body);
    GAME.calllog.slice(-6).reverse().forEach(function (c) { el('div', 'rm-item', '<div class="tx"><b>' + (c.video ? '🎥 ' : '📞 ') + esc(c.name) + '</b><small>' + fmtClock(c.at) + '・' + (c.ok ? c.min + '分' : '応答なし') + '</small></div>', h); });
  }
  el('div', 'rm-note', '登場する友達はすべて架空の人物です。🎥はビデオ通話（いま見えている景色が相手に映ります）。', body);
}
function startCall(f, video) {
  var B = GAME.B, body = PHONE_APP.body, mood = moodKey(B), typo = MOOD_TYPO[mood] || 0;
  PHONE_APP.app = 'calling'; setModalTitle(video ? 'ビデオ通話' : '通話');
  body.innerHTML = '';
  var vid = video ? snapPhoto(true) : null;
  var box = el('div', 'rm-call', (vid ? '<div class="rm-vid"><img src="' + vid + '"><div class="rm-av" style="background:' + f.col + '">' + f.icon + '</div></div>' : '<div class="rm-av big" style="background:' + f.col + '">' + f.icon + '</div>') + '<div class="nm">' + f.name + '</div><div class="st">呼び出し中…</div><div class="lines"></div><div class="rm-sug topics"></div>', body);
  var st = box.querySelector('.st'), lines = box.querySelector('.lines'), tp = box.querySelector('.topics');
  var hang = el('button', 'btn warn', '📵 切る', box);
  var state = { done: false, min: 0, rounds: 0 };
  function finish(ok) {
    if (state.done) return; state.done = true;
    GAME.calllog.push({ name: f.name, at: GAME.clock, ok: ok, min: state.min, video: video });
    if (ok) { GAME.calls++; B.socialT = Math.max(B.socialT || 0, 20 + state.min * 2); GAME.clock += state.min; bodyStep(B, state.min); logEvent('📞 ' + f.name + 'と' + state.min + '分話した'); }
    if (ok && GAME.clock > 25 * 60 && f.id !== 'kenta') relChange(f.id, -6);
    if (ok && (mood === 'drunk' || mood === 'emp') && f.id === 'haru') (GAME.regret = GAME.regret || []).push('📞 元恋人のハルに' + (mood === 'emp' ? '「好き」と' : '酔って') + '電話した');
  }
  onTap(hang, function () { finish(st.textContent !== '応答なし' && state.min > 0); phoneNav('call'); });
  sfx('ring');
  function line(who, text, cls) { el('div', 'ln ' + cls, '<b>' + esc(who) + '</b>' + esc(text), lines); lines.scrollTop = 9999; }
  var awake = friendAwake(f) && !(f.id === 'haru' && (GAME.rel.haru < 15 || Math.random() < 0.3));
  setTimeout(function () {
    if (state.done || !MODAL) return;
    if (!awake) { st.textContent = '応答なし'; line('', SLEEP_LINE[f.id], 'sys'); return; }
    st.textContent = '通話中'; sfx('click'); state.min = 1;
    line('あなた', mangle(ME_CALL[mood], typo), 'me');
    setTimeout(function () {
      if (state.done) return;
      line(f.name, FR_CALL[f.id][mood], 'fr');
      if (video && mood !== 'sober' && mood !== 'tipsy') setTimeout(function () { if (!state.done) line(f.name, pick(['…なんか目が変じゃない？', '画面の向こう、部屋ぐちゃぐちゃじゃん', 'カメラ近い近い', '顔色わるくない？']), 'fr'); }, 900);
      if (mood === 'danger') {
        var row = el('div', 'rm-row', '', box); box.insertBefore(row, hang);
        var y = el('button', 'btn warn', '🚑 救急車を呼んでもらう', row); y.style.flex = '1';
        onTap(y, function () { finish(true); GAME.endBy = f.name; closeModal(true); endNight('ambulance'); });
      }
      showTopics();
    }, 1500);
  }, 1600);
  function showTopics() {
    tp.innerHTML = '';
    if (state.rounds >= 4) { line('', '（そろそろ切ろうかな）', 'sys'); }
    TOPICS.forEach(function (t) {
      if (t.id === 'help' && mood === 'sober') return;
      var b = el('button', 'btn', t.label, tp);
      onTap(b, function () {
        if (state.done) return;
        tp.innerHTML = ''; state.rounds++; state.min += 3;
        st.textContent = '通話中 ' + state.min + ':00';
        line('あなた', mangle(t.me, typo), 'me');
        if (t.id === 'love') { relChange(f.id, mood === 'sober' ? 4 : -2); if (mood !== 'sober') (GAME.regret = GAME.regret || []).push('📞 ' + f.name + 'に「好き」と言った'); }
        if (t.id === 'worry' || t.id === 'news') relChange(f.id, 3);
        if (t.id === 'help') B.socialT = Math.max(B.socialT || 0, 40);
        setTimeout(function () {
          if (state.done) return;
          line(f.name, FR_TOPIC[f.id][t.id], 'fr');
          if (t.id === 'help') {
            var row = el('div', 'rm-row', '', box); box.insertBefore(row, hang);
            var y = el('button', 'btn warn', '🚑 救急車を呼んでもらう', row); y.style.flex = '1';
            onTap(y, function () { finish(true); GAME.endBy = f.name; closeModal(true); endNight('ambulance'); });
          }
          if (t.id === 'bye') { st.textContent = '通話終了'; finish(true); return; }
          showTopics();
        }, 1300);
      });
    });
  }
}

// ---- 💬 messages ----
function phoneDMList(body) {
  var l = el('div', 'rm-list', '', body);
  [GROUP].concat(FRIENDS).forEach(function (f) {
    var th = GAME.dm[f.id], last = th[th.length - 1], n = GAME.unread[f.id];
    var it = el('div', 'rm-item tap', '<div class="rm-av" style="background:' + f.col + '">' + f.icon + '</div><div class="tx"><b>' + f.name + (n ? ' <span class="rm-badge">' + n + '</span>' : '') + (GAME.typing[f.id] ? ' <span style="font-size:11px;opacity:.7">入力中…</span>' : '') + '</b><small>' + (last ? esc((last.me ? 'あなた：' : last.who ? FRIEND[last.who].name + '：' : '') + last.text) : 'メッセージはまだありません') + '</small></div>', l);
    onTap(it, function () { phoneNav('dmthread', f.id); });
  });
}
function phoneDMThread(body) {
  var fid = PHONE_APP.f, f = fid === 'group' ? GROUP : FRIEND[fid], B = GAME.B, mood = moodKey(B), typo = MOOD_TYPO[mood] || 0;
  GAME.unread[fid] = 0; updatePhoneBadge();
  var chat = el('div', 'rm-chat', '', body);
  GAME.dm[fid].forEach(function (m, i) {
    var who = !m.me && m.who ? '<em>' + FRIEND[m.who].name + '</em>' : '';
    var b = el('div', 'bub ' + (m.me ? 'me' : 'fr') + (m.sticker ? ' stk' : ''), who + esc(m.text) + '<small>' + fmtClock(m.at) + (m.me && m.read ? ' 既読' : '') + (m.me && GAME.clock - m.at < 30 ? ' ・<u>取り消す</u>' : '') + '</small>', chat);
    if (m.me && GAME.clock - m.at < 30) { var u = b.querySelector('u'); onTap(u, function () { unsendDM(fid, m); }); }
  });
  if (GAME.typing[fid]) el('div', 'bub fr typing', '<span>●</span><span>●</span><span>●</span>', chat);
  el('div', 'rm-note', 'いまの状態（' + MOOD_NAME[mood] + '）で送れるメッセージ：', body).style.marginTop = '8px';
  var sug = el('div', 'rm-sug', '', body);
  DM_SUGGEST[mood].forEach(function (t) { var text = mangle(t, typo); var b = el('button', 'btn', esc(text), sug); onTap(b, function () { sendDM(fid, text, mood, false); }); });
  var stk = el('div', 'rm-sug stickers', '', body);
  STICKERS.forEach(function (s) { var b = el('button', 'btn', s, stk); onTap(b, function () { sendDM(fid, s, mood, true); }); });
  var ph = el('button', 'btn ghost', '📷 いまの景色を送る', body); ph.style.marginTop = '6px';
  onTap(ph, function () { var img = snapPhoto(); if (img) { GAME.album.push({ img: img, at: GAME.clock }); sendDM(fid, '[写真]', mood, false, img); } });
}
function sendDM(fid, text, mood, sticker, img) {
  var msg = { me: true, text: text, at: GAME.clock, mood: mood, sticker: sticker, img: img };
  GAME.dm[fid].push(msg); sfx('ui');
  if (fid === 'group') {
    var who = GROUP.members.filter(function (m) { return friendAwake(FRIEND[m]); });
    msg.read = who.length > 0;
    who.slice(0, 2).forEach(function (m, i) { queueDM('group', sticker ? pick(FR_DM[m].sticker) : pick(FR_DM[m][mood]), rnd(2.5, 5) + i * 3, m); });
  } else if (friendAwake(FRIEND[fid]) && !(fid === 'haru' && GAME.rel.haru < 15)) {
    msg.read = true;
    queueDM(fid, img ? pick(['写真ありがと笑', 'なにこれ？笑', '部屋ちらかってない？', '🌙']) : sticker ? pick(FR_DM[fid].sticker) : pick(FR_DM[fid][mood]), rnd(3, 7));
  }
  if (fid !== 'group') { if (mood === 'drunk' || mood === 'emp') relChange(fid, fid === 'haru' ? -8 : -2); else relChange(fid, 1); }
  if (mood !== 'sober' && mood !== 'tipsy') { msg.regret = '💬 ' + (fid === 'group' ? GROUP.name : FRIEND[fid].name) + 'に「' + text + '」'; (GAME.regret = GAME.regret || []).push(msg.regret); }
  logEvent('💬 ' + (fid === 'group' ? GROUP.name : FRIEND[fid].name) + 'に送信：' + text);
  renderPhoneApp();
}
function unsendDM(fid, m) {
  GAME.dm[fid] = GAME.dm[fid].filter(function (x) { return x !== m; });
  if (m.regret && GAME.regret) GAME.regret = GAME.regret.filter(function (r) { return r !== m.regret; });
  toast(m.read ? '送信を取り消した。…でも既読はついていた。' : '送信を取り消した。セーフ。');
  renderPhoneApp();
}

// ---- 🌙 SNS ----
function phoneSNS(body) {
  var B = GAME.B, mood = moodKey(B), typo = MOOD_TYPO[mood] || 0;
  var mine = GAME.sns.filter(function (p) { return p.mine && !p.deleted; });
  el('div', 'rm-snshead', '<div><b>' + GAME.snsFollowers + '</b><span>フォロワー</span></div><div><b>' + mine.length + '</b><span>今夜の投稿</span></div><div><b>' + mine.reduce(function (a, p) { return a + p.likes; }, 0) + '</b><span>もらったいいね</span></div>', body);
  var tabs = el('div', 'rm-tabs', '', body);
  PHONE_APP.snsTab = PHONE_APP.snsTab || 'tl';
  [['tl', 'タイムライン'], ['trend', 'トレンド'], ['notif', 'お知らせ' + (GAME.snsNotif.filter(function (n) { return !n.seen; }).length ? '●' : '')], ['me', '自分の投稿']].forEach(function (t) {
    var d = el('div', 'rm-tab' + (PHONE_APP.snsTab === t[0] ? ' on' : ''), t[1], tabs); onTap(d, function () { PHONE_APP.snsTab = t[0]; sfx('ui'); renderPhoneApp(); });
  });
  var tab = PHONE_APP.snsTab;
  if (tab === 'notif') {
    GAME.snsNotif.forEach(function (n) { n.seen = true; }); updatePhoneBadge();
    var nl = el('div', 'rm-list', '', body);
    if (!GAME.snsNotif.length) el('div', 'rm-note', 'お知らせはまだありません。', nl);
    GAME.snsNotif.slice(0, 20).forEach(function (n) { el('div', 'rm-item', '<div class="tx"><b>' + esc(n.text) + '</b><small>' + fmtClock(n.at) + '</small></div>', nl); });
    return;
  }
  if (tab === 'trend') {
    var tl = el('div', 'rm-list', '', body);
    var tags = SNS_TAGS.slice(); if (B.F.ps > 0.5) tags.unshift('#天井が宇宙'); if (B.bac > 0.1) tags.unshift('#ZER9しか勝たん'); if (GAME.clock > 27 * 60) tags.unshift('#朝まで起きてる');
    tags.slice(0, 8).forEach(function (t, i) { el('div', 'rm-item', '<div class="tx"><b>' + (i + 1) + '. ' + esc(t) + '</b><small>' + Math.floor(rnd(1, 30) * 100) + ' 件の投稿</small></div>', tl); });
    return;
  }
  if (tab === 'tl') {
    var box = el('div', 'rm-post', '<div class="rm-note" style="margin:0 0 6px">投稿する（いまの状態：' + MOOD_NAME[mood] + '）</div>', body);
    var sug = el('div', 'rm-sug', '', box);
    SNS_SUGGEST[mood].forEach(function (t) { var text = mangle(t, typo) + (Math.random() < 0.4 ? ' ' + pick(SNS_TAGS) : ''); var b = el('button', 'btn', esc(text), sug); onTap(b, function () { snsPost(text, null, mood); }); });
    var cam = el('button', 'btn pri', '📷 いま見えている景色を撮って投稿', box); cam.style.width = '100%'; cam.style.marginTop = '6px';
    onTap(cam, function () { var img = snapPhoto(); if (img) GAME.album.push({ img: img, at: GAME.clock }); snsPost(pick(['いまの景色', '今夜の部屋', 'みて', '📷']), img, mood); });
  }
  var feed = el('div', 'rm-feed', '', body);
  GAME.sns.forEach(function (p) {
    if (p.deleted) return;
    if (tab === 'me' && !p.mine) return;
    var d = el('div', 'rm-tw' + (p.mine ? ' mine' : ''), '<div class="hd"><span class="ic">' + p.icon + '</span><b>' + esc(p.user) + '</b><small>' + fmtClock(p.at) + '</small></div><div class="tx">' + esc(p.text) + '</div>' + (p.img ? '<img src="' + p.img + '">' : '') + '<div class="ft"><span class="lk">' + (p.liked ? '♥' : '♡') + ' ' + p.likes + '</span>' + (p.replies.length ? '　💬 ' + p.replies.length : '') + (p.mine ? '　<u>削除</u>' : '') + '</div>' + p.replies.map(function (r) { return '<div class="rp">' + r.icon + ' <b>' + esc(r.user) + '</b> ' + esc(r.text) + '</div>'; }).join(''), feed);
    if (!p.mine) onTap(d.querySelector('.lk'), function () { if (!p.liked) { p.liked = true; p.likes++; sfx('ui'); renderPhoneApp(); } });
    if (p.mine) onTap(d.querySelector('u'), function () { p.deleted = true; if (p.regret && GAME.regret) GAME.regret = GAME.regret.filter(function (r) { return r !== p.regret; }); toast(p.likes > 3 ? '投稿を削除した。…でもスクショされていたかも。' : '投稿を削除した。'); renderPhoneApp(); });
  });
}
function snapPhoto(quiet) {
  try {
    var wasModal = MODAL && MODAL.el; if (wasModal) wasModal.style.visibility = 'hidden';
    var hv = HUD.hud.style.visibility;
    renderFrame();
    var src = RENDER.renderer.domElement, c = mkCanvas(320, Math.round(320 * src.height / src.width)), g = c.getContext('2d');
    g.drawImage(src, 0, 0, c.width, c.height);
    if (wasModal) wasModal.style.visibility = '';
    var url = c.toDataURL('image/jpeg', 0.7);
    if (!quiet) { sfx('shutter'); GAME.fx.flash = 0.5; }
    return url;
  } catch (e) { return null; }
}
function snsPost(text, img, mood) {
  var p = { user: 'あなた', icon: '🙂', text: text, img: img, likes: 0, at: GAME.clock, replies: [], mine: true, mood: mood };
  GAME.sns.unshift(p);
  var n = Math.floor(rnd(2, 6)), late = GAME.clock > 26 * 60, wild = mood !== 'sober' && mood !== 'tipsy';
  for (var i = 0; i < n; i++) (function (k) {
    var fr = FRIENDS.filter(function (f) { return friendAwake(f) && f.id !== 'mom'; });
    var reply = k === 1 && fr.length ? { user: pick(fr).name, icon: '💬', text: mood === 'danger' ? '大丈夫！？だれか近くにいる！？119して！' : pick(SNS_REPLIES) } : null;
    GAME.phoneQ.push({ type: 'like', ref: p, n: Math.floor(rnd(1, late ? 3 : 8) * (wild ? 1.6 : 1)), reply: reply, t: rnd(3, 12) + k * 4, notify: k === n - 1 });
  })(i);
  if (wild) { p.regret = '🌙 ナイトラインに「' + text + '」' + (img ? '（写真つき）' : ''); (GAME.regret = GAME.regret || []).push(p.regret); }
  logEvent('🌙 投稿：' + text);
  sfx('ui'); toast('ナイトラインに投稿した');
  renderPhoneApp();
}

// ---- 📷 camera / 🖼 album ----
function phoneCamera(body) {
  el('p', '', 'シャッターを押すと、スマホを閉じた状態の景色が撮れます。トリップ中の部屋もそのまま写ります。', body);
  var b = el('button', 'btn pri', '📸 撮影する', body); b.style.width = '100%';
  onTap(b, function () { var img = snapPhoto(); if (img) { GAME.album.push({ img: img, at: GAME.clock, mood: moodKey(GAME.B) }); logEvent('📷 写真を撮った'); toast('📷 アルバムに保存した'); phoneNav('album'); } });
  var s = el('button', 'btn', '🤳 自撮りする（鏡の前だと効果的）', body); s.style.width = '100%'; s.style.marginTop = '8px';
  onTap(s, function () { var img = snapPhoto(); if (img) { GAME.album.push({ img: img, at: GAME.clock, selfie: true, mood: moodKey(GAME.B) }); toast('🤳 自撮りした。…' + pick(['盛れてる', 'ブレた', '目が半分しか開いてない', '背景がうねってる'])); phoneNav('album'); } });
}
function phoneAlbum(body) {
  if (!GAME.album.length) { el('div', 'rm-note', 'まだ写真がありません。カメラで撮ってみよう。', body); return; }
  var g = el('div', 'rm-album', '', body);
  GAME.album.slice().reverse().forEach(function (p) {
    var d = el('div', 'ph', '<img src="' + p.img + '"><small>' + fmtClock(p.at) + (p.mood ? '・' + MOOD_NAME[p.mood] : '') + '</small>', g);
    onTap(d, function () {
      var bd = PHONE_APP.body; bd.innerHTML = '';
      var back = el('button', 'btn ghost rm-back', '← アルバム', bd); onTap(back, function () { phoneNav('album'); });
      el('img', 'rm-photo', null, bd).src = p.img;
      var r = el('div', 'rm-row', '', bd); r.style.marginTop = '8px';
      var post = el('button', 'btn pri', '🌙 ナイトラインに投稿', r); post.style.flex = '1';
      onTap(post, function () { PHONE_APP.app = 'sns'; snsPost('今夜の一枚', p.img, moodKey(GAME.B)); });
      var del = el('button', 'btn ghost', '🗑 削除', r);
      onTap(del, function () { GAME.album = GAME.album.filter(function (x) { return x !== p; }); phoneNav('album'); });
    });
  });
}

// ---- 🎵 music ----
function phoneMusic(body) {
  var now = el('div', 'rm-np', '<div class="disc' + (AU.music ? ' spin' : '') + '">🎵</div><div><b>' + esc((TRACKS.filter(function (t) { return t.id === (AU.style || 'lofi'); })[0] || TRACKS[0]).name) + '</b><small>' + (AU.music ? '再生中' : '停止中') + '・スピーカー/ラジオでも切りかえ可</small></div>', body);
  var r = el('div', 'rm-row', '', body); r.style.margin = '8px 0';
  var pl = el('button', 'btn pri', AU.music ? '⏸ 止める' : '▶ 再生', r); pl.style.flex = '1';
  onTap(pl, function () { AU.music = !AU.music; auVol(); renderPhoneApp(); });
  var l = el('div', 'rm-list', '', body);
  TRACKS.forEach(function (t) {
    var it = el('div', 'rm-item tap' + ((AU.style || 'lofi') === t.id ? ' on' : ''), '<div class="tx"><b>' + ((AU.style || 'lofi') === t.id ? '▶ ' : '') + esc(t.name) + '</b><small>' + esc(t.desc) + '</small></div>', l);
    onTap(it, function () { AU.style = t.id; AU.music = true; auVol(); toast('🎵 ' + t.name); renderPhoneApp(); });
  });
  var v = el('div', 'rm-set', '<span>音量</span>', body);
  var i = el('input', '', null, v); i.type = 'range'; i.min = 0; i.max = 1; i.step = 0.05; i.value = SAVE.settings.bgm; i.id = 'rm-music-vol';
  i.addEventListener('input', function () { SAVE.settings.bgm = parseFloat(i.value); auVol(); writeSave(); });
  i.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  el('div', 'rm-note', '曲は体の状態でテンポや音色が変わります。', body);
}

// ---- 🛵 delivery ----
function phoneEats(body) {
  el('div', 'rm-ph-status', '💴 ¥' + GAME.wallet.toLocaleString() + '<span>深夜でもとどく（架空の）デリバリー。届くまで約30分。</span>', body);
  var pend = GAME.orders.filter(function (o) { return !o.got; });
  if (pend.length) {
    var ol = el('div', 'rm-list', '', body);
    pend.forEach(function (o) { el('div', 'rm-item', '<div class="tx"><b>' + (o.arrived ? '📦 玄関に届いています' : '🛵 配達中…（' + fmtClock(o.at) + ' ごろ）') + '</b><small>' + o.items.map(function (x) { return x.icon + x.name; }).join('、') + '</small></div>', ol); });
  }
  var l = el('div', 'rm-list', '', body); l.style.marginTop = '8px';
  MENU.forEach(function (m) {
    var it = el('div', 'rm-item', '<div class="rm-av" style="background:rgba(255,255,255,.1)">' + m.icon + '</div><div class="tx"><b>' + esc(m.name) + '　¥' + m.price + '</b><small>' + esc(m.desc) + '</small></div>', l);
    var b = el('button', 'btn', '注文', it);
    if (GAME.wallet < m.price) b.disabled = true;
    onTap(b, function () {
      if (GAME.wallet < m.price) return;
      GAME.wallet -= m.price;
      var o = GAME.orders.filter(function (x) { return !x.arrived; })[0];
      if (!o) { o = { items: [], at: GAME.clock + rnd(25, 40), arrived: false, got: false }; GAME.orders.push(o); }
      o.items.push(m);
      sfx('ui'); toast('🛵 ' + m.name + ' を注文した（' + fmtClock(o.at) + ' ごろ到着）'); logEvent('🛵 注文：' + m.name);
      renderPhoneApp();
    });
  });
  el('div', 'rm-note', '届いたら玄関の荷物をしらべて受け取ろう。', body);
}
function receivePackage() {
  var B = GAME.B, got = [];
  GAME.orders.forEach(function (o) { if (o.arrived && !o.got) { o.got = true; o.items.forEach(function (m) { m.fn(B); got.push(m.icon + m.name); }); } });
  showPackage(false); updatePhoneBadge();
  if (got.length) { sfx('pill'); toast('📦 受け取った：' + got.join('、'), 'good', 5); logEvent('📦 受け取り：' + got.join('、')); }
}

// ---- 🗺 map ----
function phoneMap(body) {
  var cv = el('canvas', 'rm-map', '', body); cv.width = 640; cv.height = 520;
  var g = cv.getContext('2d'), X0 = -3.2, X1 = 8.2, Z0 = -4.5, Z1 = 4.5, sx = cv.width / (X1 - X0), sz = cv.height / (Z1 - Z0);
  function px(x) { return (x - X0) * sx; } function pz(z) { return (z - Z0) * sz; }
  var cur = areaAt(PL.x, PL.z).id;
  AREAS.forEach(function (a) {
    g.fillStyle = a.id === cur ? 'rgba(255,95,168,.35)' : a.id === 'balcony' ? 'rgba(125,249,255,.12)' : 'rgba(255,255,255,.08)';
    g.fillRect(px(a.x0), pz(a.z0), (a.x1 - a.x0) * sx, (a.z1 - a.z0) * sz);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.strokeRect(px(a.x0), pz(a.z0), (a.x1 - a.x0) * sx, (a.z1 - a.z0) * sz);
    g.fillStyle = '#fff'; g.font = '700 22px sans-serif'; g.textAlign = 'center'; g.fillText(a.name, px((a.x0 + a.x1) / 2), pz((a.z0 + a.z1) / 2) + 8);
  });
  WORLD.inter.forEach(function (it) { if (it.id === 'puddle') { g.fillStyle = '#d8c060'; } else g.fillStyle = 'rgba(255,225,77,.85)'; g.beginPath(); g.arc(px(it.pos.x), pz(it.pos.z), 6, 0, TAU); g.fill(); });
  g.save(); g.translate(px(PL.x), pz(PL.z)); g.rotate(-PL.yaw + PI);
  g.fillStyle = '#ff5fa8'; g.beginPath(); g.moveTo(0, 16); g.lineTo(10, -10); g.lineTo(-10, -10); g.closePath(); g.fill(); g.restore();
  el('div', 'rm-note', 'ピンクの矢印＝自分。黄色の点＝しらべられるもの。いまいる場所：' + areaAt(PL.x, PL.z).name, body);
  var l = el('div', 'rm-list', '', body);
  var here = WORLD.inter.filter(function (it) { var a = areaAt(it.pos.x, it.pos.z); return a.id === cur; });
  here.forEach(function (it) { el('div', 'rm-item', '<div class="tx"><b>' + esc(it.label) + '</b><small>' + esc(it.verb) + '</small></div>', l); });
}

// ---- ⏰ alarm ----
function phoneAlarm(body) {
  el('div', 'rm-ph-status', fmtClock(GAME.clock) + '<span>' + (GAME.alarm != null ? '⏰ ' + fmtClock(GAME.alarm) + ' にセット中' : 'アラームはオフ') + '</span>', body);
  el('p', '', 'アラームが鳴ると、ベッドやふとんで休んでいても目を覚まします。', body);
  var g = el('div', 'rm-sug', '', body);
  [15, 30, 60, 120, 240].forEach(function (m) { var b = el('button', 'btn', m < 60 ? m + '分後' : m / 60 + '時間後', g); onTap(b, function () { GAME.alarm = GAME.clock + m; toast('⏰ ' + fmtClock(GAME.alarm) + ' にアラームをセット'); renderPhoneApp(); }); });
  var g2 = el('div', 'rm-sug', '', body); g2.style.marginTop = '6px';
  [24, 26, 28, 30].forEach(function (h) { if (h * 60 <= GAME.clock) return; var b = el('button', 'btn', fmtClock(h * 60), g2); onTap(b, function () { GAME.alarm = h * 60; toast('⏰ ' + fmtClock(GAME.alarm) + ' にアラームをセット'); renderPhoneApp(); }); });
  if (GAME.alarm != null) { var off = el('button', 'btn ghost', 'アラームを消す', body); off.style.marginTop = '8px'; onTap(off, function () { GAME.alarm = null; renderPhoneApp(); }); }
}

// ---- 🔦 light ----
function phoneLight(body) {
  var b = el('button', 'btn ' + (GAME.flash ? 'on' : 'pri'), GAME.flash ? '🔦 ライトを消す' : '🔦 ライトをつける', body); b.style.width = '100%'; b.style.height = '90px'; b.style.fontSize = '20px';
  onTap(b, function () { GAME.flash = !GAME.flash; sfx('click'); renderPhoneApp(); });
  el('p', '', '暗い部屋や、照明を「暗め」にしたときに便利。せん妄系の影の住人は、光を向けると…？', body);
  var r = el('div', 'rm-sug', '', body);
  [['ふつう', 0], ['ネオン', 1], ['暗め', 2]].forEach(function (m) { var x = el('button', 'btn' + (WORLD.lightMode === m[1] ? ' on' : ''), '部屋の照明：' + m[0], r); onTap(x, function () { WORLD.lightMode = m[1]; sfx('click'); renderPhoneApp(); }); });
  var tv = el('button', 'btn', WORLD.tvOn ? '📺 テレビを消す' : '📺 テレビをつける', r); onTap(tv, function () { WORLD.tvOn = !WORLD.tvOn; renderPhoneApp(); });
}

// ---- 📝 trip log ----
function phoneMemo(body) {
  var l = el('div', 'rm-list', '', body);
  if (!GAME.logs.length) el('div', 'rm-note', 'まだ記録はありません。', l);
  GAME.logs.slice().reverse().forEach(function (e) { el('div', 'rm-item', '<div class="tx"><b>' + esc(e.text) + '</b><small>' + fmtClock(e.at) + '</small></div>', l); });
}

// ---- ⚖ combination checker ----
function checkerItems() {
  var out = SUBS.filter(function (s) { return !s.hidden; }).map(function (s) { return { id: s.id, name: s.name + '（' + s.nick + '）', cls: s.cls, sub: s.id }; });
  out.push({ id: 'alc', name: 'お酒（ZER9 など）', cls: 'alc' });
  return out;
}
function comboMatches(a, b) {
  var res = [];
  COMBOS.forEach(function (c) {
    if (c.special || !c.need.length) return;
    var items = [a, b], used = [false, false], ok = true;
    c.need.forEach(function (nd) {
      var hit = -1;
      for (var i = 0; i < 2; i++) {
        if (used[i]) continue;
        var it = items[i];
        if (nd.s ? it.sub === nd.s : nd.c ? it.cls === nd.c : nd.distinct ? it.cls === nd.distinct : false) { hit = i; break; }
      }
      if (hit < 0) ok = false; else used[hit] = true;
      if (nd.distinct && a.id === b.id) ok = false;
    });
    if (c.need.length === 1 && c.need[0].lv) { var nd0 = c.need[0]; if (a.id === b.id && (nd0.s ? a.sub === nd0.s : a.cls === nd0.c)) res.push(c); return; }
    if (ok && c.need.length <= 2) res.push(c);
  });
  return res;
}
function phoneChecker(body) {
  var items = checkerItems();
  PHONE_APP.ca = PHONE_APP.ca || items[0].id; PHONE_APP.cb = PHONE_APP.cb || 'alc';
  el('p', '', '2つ選ぶと、この組み合わせで起きる飲み合わせを調べます。AとBに同じものを選ぶと「大量に飲んだとき」の結果がわかります。まだ見つけていないものは名前が隠れますが、危険度はわかります。', body);
  ['ca', 'cb'].forEach(function (k, i) {
    var r = el('div', 'rm-set', '<span>' + (i ? 'B' : 'A') + '</span>', body);
    var s = el('select', 'rm-select', null, r); s.id = 'rm-check-' + k;
    items.forEach(function (it) { var o = document.createElement('option'); o.value = it.id; o.textContent = it.name; if (PHONE_APP[k] === it.id) o.selected = true; s.appendChild(o); });
    s.addEventListener('change', function () { PHONE_APP[k] = s.value; renderPhoneApp(); });
    s.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  });
  var A = items.filter(function (x) { return x.id === PHONE_APP.ca; })[0], Bi = items.filter(function (x) { return x.id === PHONE_APP.cb; })[0];
  var res = comboMatches(A, Bi);
  var l = el('div', 'rm-list', '', body); l.style.marginTop = '10px';
  if (!res.length) el('div', 'rm-item', '<div class="tx"><b>とくに知られている飲み合わせはない</b><small>' + (A.id === Bi.id ? '同じものの重ねがけは、ただ強く・長く効く。' : 'ただし、両方の効果はふつうに重なる。') + '</small></div>', l);
  res.forEach(function (c) { var k = SAVE.seenCombos[c.id]; el('div', 'rm-item', '<div class="tx"><b class="dg' + c.danger + '">🧪 ' + (k ? esc(c.name) : '？？？（未発見）') + '　' + ['安全', '注意', '危険', '命にかかわる'][c.danger] + '</b><small>' + (k ? esc(c.desc) : esc(c.hint)) + '</small></div>', l); });
  var all = Object.keys(SAVE.seenCombos).length;
  el('div', 'rm-note', '図鑑の発見数：' + all + ' / ' + COMBOS.length + '（3つ以上の組み合わせは飲み合わせ図鑑で）', body);
}

// ---- ⌨ command terminal ----
var TERM_LOG = [];
function termPrint(t, cls) { TERM_LOG.push({ t: t, c: cls || '' }); if (TERM_LOG.length > 120) TERM_LOG.shift(); }
function phoneTerm(body) {
  if (!TERM_LOG.length) termPrint('RAMUNE-OS v' + GAME_VERSION + '　「help」でコマンド一覧', 'sys');
  var out = el('div', 'rm-term', TERM_LOG.map(function (l) { return '<div class="' + l.c + '">' + esc(l.t) + '</div>'; }).join(''), body);
  var row = el('div', 'rm-row rm-termin', '', body);
  var inp = el('input', '', null, row); inp.type = 'text'; inp.id = 'rm-term-input'; inp.placeholder = 'コマンドを入力（例：help）'; inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'off'); inp.style.flex = '1';
  inp.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  inp.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { run(); } });
  var go = el('button', 'btn pri', '実行', row);
  onTap(go, run);
  var q = el('div', 'rm-sug', '', body); q.style.marginTop = '6px';
  ['help', 'status', 'combos', 'speed 4', 'morning', 'unlock'].forEach(function (c) { var b = el('button', 'btn', c, q); onTap(b, function () { inp.value = c; run(); }); });
  function run() { var v = inp.value.trim(); if (!v) return; termPrint('> ' + v, 'cmd'); try { runCommand(v); } catch (er) { termPrint('エラー：' + er.message, 'err'); } renderPhoneApp(); setTimeout(function () { var i2 = document.getElementById('rm-term-input'); if (i2 && !isTouchDevice()) i2.focus(); }, 0); }
}
var CMD_HELP = [
  ['help', 'このリスト'], ['status', 'からだの状態を表示'], ['list', 'ラムネ・はまきのID一覧'], ['give <ID|all> [数]', '手持ちを増やす'], ['take <ID> [数]', 'すぐに飲む・吸う（数をまとめて）'],
  ['drink <ID|water>', 'すぐに飲む（ZER9 など）'], ['time <HH:MM>', 'その時刻まで時間を進める'], ['morning', '朝7:59まで進める'], ['speed <1|2|4|8>', '時間の速さ'],
  ['tp <room>', '部屋へワープ（main/balcony/toilet/hall/tatami/bath）'], ['light <0|1|2>', '照明（ふつう/ネオン/暗め）'], ['music <lofi|ambient|techno|citypop|off>', '曲を変える'],
  ['heal', 'からだをシラフに戻す（デバッグ）'], ['combos', 'いま効いている飲み合わせ'], ['unlock', '図鑑をすべて解放'], ['sandbox <on|off>', '無限モード'], ['calm <on|off>', '点滅・ゆれをおさえる'],
  ['money <額>', 'デリバリー用のお金を増やす'], ['say <文>', '心の声を表示'], ['fps', '描画のようす'], ['clear', '画面を消す']
];
function runCommand(line) {
  var a = line.split(/\s+/), c = a[0].toLowerCase(), B = GAME.B, playing = GAME.mode === 'play';
  function need() { if (!playing) throw new Error('プレイ中だけ使えるコマンドです'); }
  function findSub(id) { var s = SUB[id] || SUBS.filter(function (x) { return !x.hidden && (x.name === id || x.nick === id || x.nick.replace('ラムネ', '') === id); })[0]; if (!s || s.hidden) throw new Error('見つかりません：' + id + '（list で確認）'); return s; }
  switch (c) {
    case 'help': CMD_HELP.forEach(function (h) { termPrint(h[0] + ' … ' + h[1]); }); break;
    case 'clear': TERM_LOG = []; break;
    case 'status': need(); termPrint('心拍 ' + Math.round(B.hr) + ' / 体温 ' + B.tp.toFixed(1) + ' / 呼吸 ' + B.rr.toFixed(1) + ' / 意識 ' + Math.round(B.con) + '% / 水分 ' + Math.round(B.hyd * 100) + '% / BAC ' + B.bac.toFixed(3) + ' / 危険度 ' + Math.round(B.danger)); termPrint('状態：' + MOOD_NAME[moodKey(B)] + '　時刻 ' + fmtClock(GAME.clock)); break;
    case 'list': SUBS.filter(function (s) { return !s.hidden; }).forEach(function (s) { termPrint(s.id + '　' + s.name + '（' + s.nick + '）' + CLASSES[s.cls].short); }); DRINKS.forEach(function (d) { termPrint(d.id + '　' + d.name); }); break;
    case 'give': need(); var n = parseInt(a[2] || '3', 10) || 3;
      if (a[1] === 'all') { SUBS.concat(DRINKS).forEach(function (s) { if (!s.hidden) GAME.stash[s.id] = (GAME.stash[s.id] || 0) + n; }); termPrint('すべて +' + n); }
      else { var id = DRINK[a[1]] ? a[1] : findSub(a[1]).id; GAME.stash[id] = (GAME.stash[id] || 0) + n; termPrint(id + ' +' + n + '（手持ち ' + GAME.stash[id] + '）'); } break;
    case 'take': need(); var s = findSub(a[1]), q = clamp(parseInt(a[2] || '1', 10) || 1, 1, 20); takeSub(B, s.id, q); SAVE.seenSubs[s.id] = 1; writeSave(); logEvent('⌨ コマンドで ' + s.name + ' ×' + q); termPrint(s.name + ' を ' + q + ' 個摂取した'); break;
    case 'drink': need(); if (a[1] === 'water') { drinkWater(B); termPrint('水を飲んだ'); } else { if (!DRINK[a[1]]) throw new Error('ID：z9lemon z9grape z9ume sour giga water'); drinkCan(B, a[1]); placeCanOnTable(DRINK[a[1]]); termPrint(DRINK[a[1]].name + ' を飲んだ'); } break;
    case 'time': need(); var m = /^(\d{1,2}):(\d{2})$/.exec(a[1] || ''); if (!m) throw new Error('time 03:30 のように入力'); var tgt = (+m[1]) * 60 + (+m[2]); if (tgt < 20 * 60) tgt += 1440; if (tgt <= GAME.clock) throw new Error('時間は戻せません'); tgt = Math.min(tgt, END_CLOCK - 1); var dm = tgt - GAME.clock; bodyStep(B, dm); GAME.clock = tgt; termPrint(fmtClock(tgt) + ' まで進めた（' + timeText(dm) + '）'); processEvents(); break;
    case 'morning': need(); runCommand('time 07:59'); break;
    case 'speed': need(); var v = parseInt(a[1], 10); if (SPEEDS.indexOf(v) < 0) throw new Error('1 2 4 8 のどれか'); setSpeed(v); termPrint('速さ ' + v + '倍'); break;
    case 'tp': need(); var ar = AREAS.filter(function (x) { return x.id === a[1]; })[0]; if (!ar) throw new Error('main balcony toilet hall tatami bath'); PL.x = (ar.x0 + ar.x1) / 2; PL.z = (ar.z0 + ar.z1) / 2; var cc = collide(PL.x, PL.z, 0.22); PL.x = cc[0]; PL.z = cc[1]; termPrint(ar.name + ' へワープした'); break;
    case 'light': WORLD.lightMode = clamp(parseInt(a[1], 10) || 0, 0, 2); termPrint('照明 ' + ['ふつう', 'ネオン', '暗め'][WORLD.lightMode]); break;
    case 'music': if (a[1] === 'off') { AU.music = false; } else { if (!TRACKS.some(function (t) { return t.id === a[1]; })) throw new Error('lofi ambient techno citypop off'); AU.style = a[1]; AU.music = true; } auVol(); termPrint('ミュージック：' + (AU.music ? AU.style : 'off')); break;
    case 'heal': need(); var keep = B.stats, kf = B.found; GAME.B = newBody(); GAME.B.stats = keep; GAME.B.found = kf; termPrint('からだをリセットした（記録はそのまま）'); break;
    case 'combos': need(); var ac = COMBOS.filter(function (x) { return !x.special && (B.comboS[x.id] || 0) > 0.3; }); if (!ac.length) termPrint('いま効いている飲み合わせはない'); ac.forEach(function (x) { termPrint('🧪 ' + (SAVE.seenCombos[x.id] ? x.name : '？？？') + '　強さ ' + Math.round(B.comboS[x.id] * 66) + '%'); }); break;
    case 'unlock': SUBS.forEach(function (x) { if (!x.hidden) SAVE.seenSubs[x.id] = 1; }); COMBOS.forEach(function (x) { SAVE.seenCombos[x.id] = 1; }); writeSave(); termPrint('図鑑をすべて解放した'); break;
    case 'sandbox': SAVE.settings.sandbox = a[1] !== 'off'; writeSave(); termPrint('サンドボックス ' + (SAVE.settings.sandbox ? 'ON' : 'OFF')); break;
    case 'calm': SAVE.settings.calm = a[1] !== 'off'; writeSave(); termPrint('点滅・ゆれをおさえる ' + (SAVE.settings.calm ? 'ON' : 'OFF')); break;
    case 'money': need(); GAME.wallet += Math.max(0, parseInt(a[1], 10) || 10000); termPrint('💴 ¥' + GAME.wallet.toLocaleString()); break;
    case 'say': need(); say(a.slice(1).join(' ') || '…', 4); termPrint('（心の声）' + a.slice(1).join(' ')); break;
    case 'fps': termPrint('fps 約' + Math.round(RENDER.fpsAvg) + ' / 解像度 ' + Math.round(RENDER.scale * 100) + '% / 画質 ' + RENDER.quality); break;
    default: throw new Error('知らないコマンド：' + c + '（help で一覧）');
  }
}

// ---- 🚑 help (enhanced) ----
function phoneHelp(body) {
  var B = GAME.B, tips = [];
  if (B.rr < 10) tips.push('呼吸が弱い：オピオイド系が入っているならリセットラムネ（ネガトキソン）。それ以外はすぐ119番。眠らないこと。');
  if (B.tp > 38.5) tips.push('体温が高い：水を飲む・シャワー・ベランダの風・アイス。アッパー系やハート系を追加しない。');
  if (B.hr > 150) tips.push('心拍が速い：動かずに休む。水を飲む。アッパー系を追加しない。');
  if (B.F.na > 0.5) tips.push('吐き気：トイレで吐く。横になるなら横向きで。');
  if (B.bac > 0.15) tips.push('飲みすぎ：もうお酒は飲まない。ダウナー系・オピオイド系・ギャバ系と合わせない。');
  if (B.hyd < 0.45) tips.push('水分不足：水かスポーツドリンク。');
  if (B.F.an > 0.6) tips.push('不安が強い：明るい部屋で、だれかに電話する。ひとりで抱えない。');
  if ((B.liver || 0) >= 1.5) tips.push('痛み止めの飲みすぎ：いま症状がなくても肝臓に負担がかかっている。これ以上飲まない。現実なら早めに医療機関へ。');
  var otcN = B.doses.filter(function (d) { return SUB[d.s].otc; }).length; if (otcN >= 3) tips.push('市販薬を何回も飲んでいる：これ以上飲まない。現実なら中毒110番や医療機関に相談を。');
  var d = el('div', 'rm-detail', '', body);
  el('p', '', '具合がおかしいとき、だれかが倒れているときは、ためらわずに助けを呼ぼう。<b>このゲームの中でも、現実でも。</b>', d);
  el('div', 'rm-alert', '<b>いまのあなたへのアドバイス</b><br>' + (tips.length ? tips.map(esc).join('<br>') : 'いまは大きな問題はなさそう。水を飲んで、無理をしないで。'), d);
  var b = el('button', 'btn warn', '📞 119に電話する（今夜はここで終わり）', d);
  onTap(b, function () { closeModal(true); endNight('ambulance'); });
  var c = el('button', 'btn', '📞 友達に助けを求める', d);
  onTap(c, function () { phoneNav('call'); });
  el('div', 'rm-kv', '<span>呼吸が弱い</span><b>リセットラムネ（オピオイド系だけに効く）／119</b><span>体温が高い</span><b>水・シャワー・ベランダの風・アイス</b><span>吐き気</span><b>トイレで吐く</b><span>心拍が速い</span><b>じっと休む・水を飲む</b><span>不安</span><b>だれかと話す</b>', d);
  el('div', 'rm-note', '現実で困ったとき：救急車 119／迷ったら 救急安心センター #7119（地域による）／こころの健康相談統一ダイヤル 0570-064-556', body);
}
