// ---- phone: home screen, calls, DM, SNS ---------------------------------------------
// friends are fictional characters
var FRIENDS = [
  { id: 'misaki', name: 'ミサキ', icon: '🐰', col: '#ff8fb1', desc: '幼なじみ。しっかり者で心配性', sleep: 25 * 60 + 30 },
  { id: 'kenta', name: 'ケンタ', icon: '🦊', col: '#ffb347', desc: '大学の友達。夜型で朝までゲーム', sleep: 31 * 60 + 30 },
  { id: 'yuzu', name: 'ユズ', icon: '🍋', col: '#d8f060', desc: 'バイト先の後輩。絵文字が多い', sleep: 26 * 60 + 30 },
  { id: 'mom', name: 'お母さん', icon: '🌷', col: '#9ec5e8', desc: '実家の母。夜は早い', sleep: 22 * 60 + 30 }
];
var FRIEND = {}; FRIENDS.forEach(function (f) { FRIEND[f.id] = f; });

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

// what *you* end up saying, by mood
var ME_CALL = {
  sober: ['もしもし、いま暇？', 'なんとなく声聞きたくなって。'],
  tipsy: ['もしもし〜！いま家で飲んでる〜', 'ねえ聞いて、ZER9うまいんだけど'],
  drunk: ['もひもひ…？あれ、だれにかけたんだっけ', 'おれ…ぜんぜん酔ってないから…'],
  up: ['ねえねえ聞いて！いま最高にアイデアが降ってきてて！', '今から朝までしゃべろうよ！'],
  down: ['……ん……もしもし……', '……ねむい……'],
  psy: ['ねえ、電話の声が虹色に見える…', 'いま天井が星空なんだけど、そっちは？'],
  dis: ['…いま、自分がどこにいるかわかんない…', '自分の声が遠くから聞こえる…'],
  emp: ['ほんとにさ…出会ってくれてありがとう…', 'だいすき。なんか急に言いたくなった。'],
  del: ['さっきうちに来てたよね？…え、来てない？', 'ねえ、後ろでだれかしゃべってない？'],
  danger: ['……なんか…息が…くるしい……', '……たすけて……かも……']
};
var FR_CALL = {
  misaki: { sober: 'めずらしいね！ちゃんとご飯食べた？', tipsy: 'また飲んでるの？ほどほどにね〜', drunk: 'ちょっと、ろれつ回ってないよ…？水飲んで、もう寝な。', up: 'テンション高すぎない…？ちゃんと寝なよ？', down: 'え、声ねむそう…大丈夫？', psy: '…なに言ってるの？ほんとに大丈夫？', dis: 'ねえ、ほんとに大丈夫？いま家？', emp: 'え、どうしたの急に…でも、ありがと。笑', del: 'だれも来てないよ…？ちょっと心配なんだけど。', danger: 'ちょっと待って！それ本気で危ないって！救急車呼ぶよ！？' },
  kenta: { sober: 'おー、どした？いまランクマ中！', tipsy: 'いいねぇ、俺も飲みながらゲームしてる', drunk: 'お前ベロベロじゃん！笑　水飲めって', up: 'わかる！わかんないけどわかる！', down: 'おーい、寝落ちすんなよ〜', psy: '星空？いいなー、こっちはモニターしか見えない', dis: 'お前、声が宇宙人みたいになってる', emp: 'お、おう…俺も好きだぞ…？笑', del: 'だれもいねーって。こわいこと言うなよ', danger: 'え、マジでやばくない？救急車呼べ！俺から呼ぼうか！？' },
  yuzu: { sober: 'せんぱーい！どうしたんですか〜？☺️', tipsy: 'せんぱい飲んでる〜！いいな〜🍋', drunk: 'せんぱい、酔いすぎです😂 お水！', up: 'せんぱいめっちゃ元気〜！⚡', down: 'せんぱい、ねむそう…おやすみなさい？🌙', psy: 'え、天井が星空…？せんぱい大丈夫です…？', dis: 'せんぱい、どこにいるんですか…？', emp: 'えっ…せんぱい…どうしたんですか…🥺', del: 'え、こわいこわい！だれもいないですよ…？', danger: 'せんぱい！？それ救急車案件です！呼びますね！？' },
  mom: { sober: 'あら、めずらしい。ちゃんとご飯食べてる？', tipsy: 'お酒もほどほどにしなさいよ。', drunk: 'あんた酔っぱらってるでしょ。早く寝なさい。', up: 'こんな時間に元気ねえ…早く寝なさい。', down: 'もう寝なさい。おやすみ。', psy: '…なに言ってるの？熱でもあるの？', dis: 'ちょっと、大丈夫なの？', emp: 'あら…お母さんもよ。どうしたの急に。', del: 'だれも行ってないわよ。疲れてるんじゃない？', danger: '声がおかしいわよ！いますぐ救急車呼びなさい！' }
};
var SLEEP_LINE = { misaki: '（留守番電話サービスに接続します…ミサキはもう寝ているみたい）', kenta: '（呼び出し音だけが鳴りつづける…ヘッドホンで気づいてないのかも）', yuzu: '（留守番電話…ユズはもう寝ているみたい）', mom: '（留守番電話…お母さんはもう寝ている時間だ）' };

// DM: suggestions by mood (drunk ones get mangled)
var DM_SUGGEST = {
  sober: ['なにしてる？', '明日ひま？', 'おつかれー'],
  tipsy: ['いま家で飲んでる🍋', 'ZER9 なんぼんめだっけ', '会いたいな〜'],
  drunk: ['いまなにしてりゅ', 'あいたいいいいい', 'おれ　よってない'],
  up: ['ねえ聞いて！！！', '今から集まらない！？', 'すごいこと思いついた⚡⚡⚡'],
  down: ['ねむ', '……', 'おやすみ'],
  psy: ['空の色、何色に見える？', 'かべが呼吸してるんだけど', '🌈🌈🌈'],
  dis: ['いまどこにいるかわからない', 'ここにいる？', '自分がとおい'],
  emp: ['だいすき', 'いつもありがとう🫶', '出会ってくれてありがとう'],
  del: ['さっき来てたよね？', 'うちにだれかいる', '電話鳴った？'],
  danger: ['たすけて', 'くるしい', '息が']
};
var FR_DM = {
  misaki: { sober: 'ひまだよー。どした？', tipsy: '飲みすぎないでね！', drunk: '酔ってるでしょ。水飲んで寝な？', up: 'テンション高っ。ちゃんと寝てね', down: 'おやすみー', psy: '？？？ 大丈夫？', dis: 'え、家にいるんだよね？', emp: 'なに急に〜照れる', del: 'だれも来てないよ？大丈夫？', danger: '本気でやばいなら119して！！いま電話する！' },
  kenta: { sober: 'ゲーム中ー', tipsy: 'かんぱーい🍺', drunk: 'なにいってんのw', up: 'わかるwww', down: 'おやすみー', psy: 'いい夜すごしてんなw', dis: 'どこ行ったんだよw', emp: 'お、おう？ありがと？', del: 'こわいこと言うなし', danger: 'え、マジならすぐ119な！！' },
  yuzu: { sober: 'おつかれさまです〜☺️', tipsy: 'いいな〜🍋🍋', drunk: 'せんぱいwww 寝てください😂', up: 'どうしたんですか⚡笑', down: 'おやすみなさい🌙', psy: '🌈？？', dis: 'せんぱい大丈夫です…？', emp: '🥺🥺🥺', del: 'え、こわい…', danger: 'せんぱい！！119してください！！' },
  mom: { sober: 'げんき？', tipsy: '飲みすぎないように', drunk: '早く寝なさい', up: 'もう寝なさい', down: 'おやすみ', psy: '大丈夫？', dis: '大丈夫なの？', emp: 'お母さんもよ', del: '疲れてるのよ。早く寝なさい', danger: 'すぐ119番しなさい！' }
};
var FR_PING = {
  misaki: ['起きてる？', '明日のお昼、どうする？', 'ちゃんと寝なよー'],
  kenta: ['今からゲームやらん？', 'ねむれん', 'ガチャ爆死した'],
  yuzu: ['せんぱーい！起きてますか〜？🌙', 'シフト代わってほしいです🙏', '見て、夜の空きれい✨'],
  mom: ['ちゃんとご飯食べてる？', 'お米送ったからね']
};

// SNS (fictional app "ナイトライン")
var SNS_USERS = [
  { name: 'まよなかの猫', icon: '🐈' }, { name: 'コンビニ夜勤', icon: '🏪' }, { name: '終電のがした', icon: '🚃' }, { name: 'ねむれないOL', icon: '🌙' }, { name: '深夜ラジオ好き', icon: '📻' }, { name: '月見バーガー', icon: '🍔' }
];
var SNS_POOL = ['寝る前にカップ麺食べちゃった', 'まだ起きてる人〜？', '終電のがしたので歩いて帰ってます', '夜中のコンビニって落ちつく', '明日（もう今日）のことは考えない', '深夜ラジオおもしろすぎる', 'ねむれないから羊かぞえてる 1243匹', '雨のにおいがする', '月がきれい', 'あしたの自分、がんばれ'];
var SNS_SUGGEST = {
  sober: ['今夜はのんびり。', '夜景がきれい。', 'みかんうまい'],
  tipsy: ['ZER9うますぎ問題', '金曜の夜さいこう🍋', 'ほろよい'],
  drunk: ['おれは　よってない', 'みんなだいすきだあああああ', 'ゆかがななめ'],
  up: ['人生の真理に気づいたかもしれない', '今なら何でもできる！！！', '朝まで起きてる人集合！！'],
  down: ['ねむ', 'ソファと結婚した', '……'],
  psy: ['かべが呼吸してる', '天井の向こうに宇宙があった', '色に音がある🌈'],
  dis: ['自分の体を後ろから見てる', 'いまどこ', '重力どこいった'],
  emp: ['フォロワーのみんな愛してる🫶', 'この世界やさしすぎる', '今夜、全員と友達になりたい'],
  del: ['ソファにだれか座ってる', 'さっきから壁に虫が', 'スマホ鳴った？'],
  danger: ['たすけ', 'いき', '…']
};
var SNS_REPLIES = ['え、だいじょうぶ？', 'わかる', 'それな', '寝なよw', '今夜もおつかれ', '朝になったら消しなよ笑', 'なにがあった', '🌙'];

function mangle(t, k) {
  if (k <= 0) return t;
  var s = '', small = 'ぁぃぅぇぉゃゅょっ';
  for (var i = 0; i < t.length; i++) {
    var c = t[i];
    s += c;
    if (Math.random() < 0.12 * k) s += c;
    if (Math.random() < 0.06 * k) s += small[Math.floor(Math.random() * small.length)];
  }
  return s;
}

// per-night phone state
function resetPhone() {
  GAME.dm = {}; GAME.unread = {}; FRIENDS.forEach(function (f) { GAME.dm[f.id] = []; GAME.unread[f.id] = 0; });
  GAME.dm.misaki.push({ me: false, text: '今日はちゃんと休みなよー', at: START_CLOCK - 120 });
  GAME.sns = [];
  for (var i = 0; i < 5; i++) snsNpcPost(START_CLOCK - (5 - i) * 25);
  GAME.phoneQ = []; GAME.pingT = rnd(40, 70); GAME.snsT = 30; GAME.calls = 0;
  updatePhoneBadge();
}
function snsNpcPost(at) {
  var u = pick(SNS_USERS);
  GAME.sns.unshift({ user: u.name, icon: u.icon, text: pick(SNS_POOL), likes: Math.floor(rnd(0, 40)), at: at, replies: [] });
  if (GAME.sns.length > 40) GAME.sns.pop();
}
function totalUnread() { var n = 0; for (var k in GAME.unread) n += GAME.unread[k]; return n; }
function updatePhoneBadge() { if (HUD.bPhone) HUD.bPhone.classList.toggle('notif', totalUnread() > 0); }
function friendAwake(f) { return GAME.clock < f.sleep || (f.id === 'kenta' && Math.random() < 0.8); }

// runs every frame in play (real-time dt; game-time from GAME.clock)
function updatePhone(dt) {
  if (!GAME.phoneQ) return;
  for (var i = GAME.phoneQ.length - 1; i >= 0; i--) {
    var q = GAME.phoneQ[i]; q.t -= dt;
    if (q.t > 0) continue;
    GAME.phoneQ.splice(i, 1);
    if (q.type === 'dm') {
      GAME.dm[q.f].push({ me: false, text: q.text, at: GAME.clock });
      if (PHONE_APP.app === 'dmthread' && PHONE_APP.f === q.f && MODAL) { renderPhoneApp(); sfx('ui'); }
      else { GAME.unread[q.f]++; toast('💬 ' + FRIEND[q.f].name + '「' + q.text + '」'); sfx('buzz'); }
      updatePhoneBadge();
    } else if (q.type === 'like') {
      var p = q.ref; p.likes += q.n; if (q.reply) p.replies.push(q.reply);
      if (q.notify) toast('📣 あなたの投稿に いいね ' + p.likes + ' 件' + (q.reply ? '・返信「' + q.reply.text + '」' : ''));
    }
  }
  if (GAME.paused) return;
  // friends sometimes message you first; the timeline keeps moving
  GAME.pingT -= dt * (GAME.speed || 1);
  if (GAME.pingT <= 0) {
    GAME.pingT = rnd(45, 90);
    var aw = FRIENDS.filter(function (f) { return friendAwake(f); });
    if (aw.length) { var f = pick(aw); GAME.phoneQ.push({ type: 'dm', f: f.id, text: pick(FR_PING[f.id]), t: 0 }); }
  }
  GAME.snsT -= dt * (GAME.speed || 1);
  if (GAME.snsT <= 0) { GAME.snsT = rnd(20, 40); snsNpcPost(GAME.clock); }
}

// ---- phone UI -----------------------------------------------------------------------
var PHONE_APP = { app: 'home', f: null };
var APPS = [
  { id: 'body', icon: '🫀', name: 'からだ', play: true },
  { id: 'call', icon: '📞', name: '電話', play: true },
  { id: 'dm', icon: '💬', name: 'メッセージ', play: true },
  { id: 'sns', icon: '🌙', name: 'ナイトライン', play: true },
  { id: 'zukan', icon: '🍬', name: 'ラムネ図鑑' },
  { id: 'combo', icon: '🧪', name: '飲み合わせ' },
  { id: 'help', icon: '🚑', name: '119・たすけ', play: true },
  { id: 'set', icon: '⚙', name: '設定' }
];
function openPhone(app) {
  PHONE_APP.app = app || 'home'; PHONE_APP.f = null;
  if (PHONE_APP.app === 'home' && GAME.mode !== 'play') PHONE_APP.app = 'zukan';
  openModal('スマホ', function (body, M) { PHONE_APP.body = body; renderPhoneApp(); });
}
function phoneNav(app, f) { PHONE_APP.app = app; PHONE_APP.f = f || null; sfx('ui'); renderPhoneApp(); }
function renderPhoneApp() {
  var body = PHONE_APP.body; if (!body || !MODAL) return;
  body.innerHTML = '';
  var a = PHONE_APP.app, playing = GAME.mode === 'play';
  var titles = { home: 'スマホ', body: 'からだ', call: '電話', dm: 'メッセージ', dmthread: FRIEND[PHONE_APP.f] ? FRIEND[PHONE_APP.f].name : '', sns: 'ナイトライン', zukan: 'ラムネ図鑑', combo: '飲み合わせ図鑑', help: '119・たすけ', set: '設定', calling: '通話' };
  setModalTitle(titles[a] || 'スマホ');
  if (a !== 'home' && a !== 'calling') {
    var back = el('button', 'btn ghost rm-back', '← ' + (a === 'dmthread' ? 'メッセージ' : 'ホーム'), body);
    onTap(back, function () { phoneNav(a === 'dmthread' ? 'dm' : (playing ? 'home' : 'zukan')); });
  }
  if (a === 'home') return phoneHome(body);
  ({ body: phoneBody, zukan: phoneZukan, combo: phoneCombo, help: phoneHelp, set: phoneSettings, call: phoneCallList, dm: phoneDMList, dmthread: phoneDMThread, sns: phoneSNS })[a](body);
  if (a === 'dmthread') { var sc = body; setTimeout(function () { sc.scrollTop = sc.scrollHeight; }, 0); }
}
function phoneHome(body) {
  var B = GAME.B;
  el('div', 'rm-ph-status', fmtClock(GAME.clock) + '　<span>いまの状態：' + MOOD_NAME[moodKey(B)] + '</span>', body);
  var g = el('div', 'rm-apps', '', body);
  APPS.forEach(function (ap) {
    var n = ap.id === 'dm' ? totalUnread() : 0;
    var c = el('div', 'rm-app', '<div class="ic">' + ap.icon + (n ? '<i>' + n + '</i>' : '') + '</div><div>' + ap.name + '</div>', g);
    onTap(c, function () { phoneNav(ap.id); });
  });
}
// ---- calls ----
function phoneCallList(body) {
  var l = el('div', 'rm-list', '', body);
  FRIENDS.forEach(function (f) {
    var it = el('div', 'rm-item', '<div class="rm-av" style="background:' + f.col + '">' + f.icon + '</div><div class="tx"><b>' + f.name + '</b><small>' + f.desc + '</small></div>', l);
    var b = el('button', 'btn', '📞', it); onTap(b, function () { startCall(f); });
  });
  el('div', 'rm-note', '登場する友達はすべて架空の人物です。', body);
}
function startCall(f) {
  var B = GAME.B, body = PHONE_APP.body, mood = moodKey(B);
  PHONE_APP.app = 'calling'; setModalTitle('通話');
  body.innerHTML = '';
  var box = el('div', 'rm-call', '<div class="rm-av big" style="background:' + f.col + '">' + f.icon + '</div><div class="nm">' + f.name + '</div><div class="st">呼び出し中…</div><div class="lines"></div>', body);
  var st = box.querySelector('.st'), lines = box.querySelector('.lines');
  var hang = el('button', 'btn warn', '📵 切る', box);
  var done = false;
  onTap(hang, function () { done = true; phoneNav('call'); });
  sfx('buzz');
  function line(who, text, cls) { var d = el('div', 'ln ' + cls, '<b>' + esc(who) + '</b>' + esc(text), lines); }
  var awake = friendAwake(f);
  var steps = [];
  if (!awake) steps.push(function () { st.textContent = '応答なし'; line('', SLEEP_LINE[f.id], 'sys'); });
  else {
    steps.push(function () { st.textContent = '通話中 0:01'; sfx('click'); });
    var mine = ME_CALL[mood];
    steps.push(function () { line('あなた', mangle(mine[0], mood === 'drunk' ? 1.2 : mood === 'tipsy' ? 0.4 : 0), 'me'); });
    steps.push(function () { line(f.name, FR_CALL[f.id][mood], 'fr'); });
    if (mood !== 'danger') {
      steps.push(function () { line('あなた', mangle(mine[1], mood === 'drunk' ? 1.2 : 0), 'me'); });
      steps.push(function () { line(f.name, pick(['うん、またね。', 'ちゃんと水飲んでね。', 'じゃあね〜。', 'おやすみ。']), 'fr'); st.textContent = '通話終了'; });
    } else {
      steps.push(function () {
        st.textContent = '通話中';
        var row = el('div', 'rm-row', '', box); box.insertBefore(row, hang);
        var y = el('button', 'btn warn', '🚑 救急車を呼んでもらう', row); y.style.flex = '1';
        var n = el('button', 'btn ghost', '大丈夫って言う', row);
        onTap(y, function () { done = true; GAME.endBy = f.name; closeModal(true); endNight('ambulance'); });
        onTap(n, function () { line('あなた', '…だいじょうぶ…', 'me'); line(f.name, '絶対おかしいって…なにかあったらすぐ119してね！', 'fr'); row.remove(); });
      });
    }
  }
  var i = 0;
  (function next() {
    if (done || !MODAL || PHONE_APP.app !== 'calling') return;
    if (i >= steps.length) {
      if (awake) { GAME.calls++; B.socialT = Math.max(B.socialT || 0, 40); GAME.clock += 10; bodyStep(B, 10); }
      return;
    }
    steps[i++](); setTimeout(next, i === 1 ? 1500 : 1700);
  })();
}
// ---- DM ----
function phoneDMList(body) {
  var l = el('div', 'rm-list', '', body);
  FRIENDS.forEach(function (f) {
    var th = GAME.dm[f.id], last = th[th.length - 1], n = GAME.unread[f.id];
    var it = el('div', 'rm-item tap', '<div class="rm-av" style="background:' + f.col + '">' + f.icon + '</div><div class="tx"><b>' + f.name + (n ? ' <span class="rm-badge">' + n + '</span>' : '') + '</b><small>' + (last ? esc((last.me ? 'あなた：' : '') + last.text) : 'メッセージはまだありません') + '</small></div>', l);
    onTap(it, function () { phoneNav('dmthread', f.id); });
  });
}
function phoneDMThread(body) {
  var f = FRIEND[PHONE_APP.f], B = GAME.B, mood = moodKey(B);
  GAME.unread[f.id] = 0; updatePhoneBadge();
  var chat = el('div', 'rm-chat', '', body);
  GAME.dm[f.id].forEach(function (m) { el('div', 'bub ' + (m.me ? 'me' : 'fr'), esc(m.text) + '<small>' + fmtClock(m.at) + (m.me && m.read ? ' 既読' : '') + '</small>', chat); });
  el('div', 'rm-note', 'いまの状態（' + MOOD_NAME[mood] + '）で送れるメッセージ：', body).style.marginTop = '8px';
  var sug = el('div', 'rm-sug', '', body);
  var mk = mood === 'drunk' ? 1.3 : mood === 'tipsy' ? 0.5 : mood === 'down' ? 0.4 : 0;
  DM_SUGGEST[mood].forEach(function (t) {
    var text = mangle(t, mk);
    var b = el('button', 'btn', esc(text), sug);
    onTap(b, function () { sendDM(f, text, mood); });
  });
}
function sendDM(f, text, mood) {
  var msg = { me: true, text: text, at: GAME.clock, mood: mood };
  GAME.dm[f.id].push(msg); sfx('ui');
  if (friendAwake(f)) {
    msg.read = true;
    GAME.phoneQ.push({ type: 'dm', f: f.id, text: FR_DM[f.id][mood], t: rnd(2.5, 6) });
  }
  if (mood !== 'sober' && mood !== 'tipsy') (GAME.regret = GAME.regret || []).push('💬 ' + f.name + 'に「' + text + '」');
  renderPhoneApp();
}
// ---- SNS ----
function phoneSNS(body) {
  var B = GAME.B, mood = moodKey(B);
  var box = el('div', 'rm-post', '<div class="rm-note" style="margin:0 0 6px">投稿する（いまの状態：' + MOOD_NAME[mood] + '）</div>', body);
  var sug = el('div', 'rm-sug', '', box);
  var mk = mood === 'drunk' ? 1.3 : mood === 'tipsy' ? 0.4 : 0;
  SNS_SUGGEST[mood].forEach(function (t) { var text = mangle(t, mk); var b = el('button', 'btn', esc(text), sug); onTap(b, function () { snsPost(text, null, mood); }); });
  var cam = el('button', 'btn pri', '📷 いま見えている景色を撮って投稿', box); cam.style.width = '100%'; cam.style.marginTop = '6px';
  onTap(cam, function () { var img = snapPhoto(); snsPost(pick(['いまの景色', '今夜の部屋', 'みて', '📷']), img, mood); });
  var feed = el('div', 'rm-feed', '', body);
  GAME.sns.forEach(function (p) {
    var d = el('div', 'rm-tw' + (p.mine ? ' mine' : ''), '<div class="hd"><span class="ic">' + p.icon + '</span><b>' + esc(p.user) + '</b><small>' + fmtClock(p.at) + '</small></div><div class="tx">' + esc(p.text) + '</div>' + (p.img ? '<img src="' + p.img + '">' : '') + '<div class="ft">♡ ' + p.likes + (p.replies.length ? '　💬 ' + p.replies.length : '') + '</div>' + p.replies.map(function (r) { return '<div class="rp">' + r.icon + ' <b>' + esc(r.user) + '</b> ' + esc(r.text) + '</div>'; }).join(''), feed);
  });
}
function snapPhoto() {
  try {
    var wasModal = MODAL && MODAL.el; if (wasModal) wasModal.style.visibility = 'hidden';
    renderFrame();
    var src = RENDER.renderer.domElement, c = mkCanvas(320, Math.round(320 * src.height / src.width)), g = c.getContext('2d');
    g.drawImage(src, 0, 0, c.width, c.height);
    if (wasModal) wasModal.style.visibility = '';
    var url = c.toDataURL('image/jpeg', 0.7);
    sfx('click'); GAME.fx.flash = 0.6;
    return url;
  } catch (e) { return null; }
}
function snsPost(text, img, mood) {
  var p = { user: 'あなた', icon: '🙂', text: text, img: img, likes: 0, at: GAME.clock, replies: [], mine: true, mood: mood };
  GAME.sns.unshift(p);
  var n = Math.floor(rnd(2, 6)), late = GAME.clock > 26 * 60;
  for (var i = 0; i < n; i++) (function (k) {
    var fr = FRIENDS.filter(function (f) { return friendAwake(f) && f.id !== 'mom'; });
    var reply = k === 1 && fr.length ? { user: pick(fr).name, icon: '💬', text: mood === 'danger' ? '大丈夫！？だれか近くにいる！？119して！' : pick(SNS_REPLIES) } : null;
    GAME.phoneQ.push({ type: 'like', ref: p, n: Math.floor(rnd(1, late ? 3 : 8)), reply: reply, t: rnd(3, 12) + k * 4, notify: k === n - 1 });
  })(i);
  if (mood !== 'sober' && mood !== 'tipsy') (GAME.regret = GAME.regret || []).push('🌙 ナイトラインに「' + text + '」' + (img ? '（写真つき）' : ''));
  sfx('ui'); toast('ナイトラインに投稿した');
  renderPhoneApp();
}
