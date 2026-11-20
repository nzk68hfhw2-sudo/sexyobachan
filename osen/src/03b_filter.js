// ---- 自由メッセージの検閲（過激な言葉は＊、個人情報らしい物は消す） ---------------------------
// 送る前と受け取ったあとの両方で通す。完ぺきではない（言い回しを変えるとすり抜けられる）。
var MSG_MAX = 40;
var NG_WORDS = [
  // 暴力・死
  'しね', 'しんで', 'しんどけ', 'ころす', 'ころして', 'ころしたる', 'ころされ', 'ぶっころ', 'じさつ', 'しにたい', 'くびつれ', 'ぶっこわ',
  '死ね', '氏ね', '市ね', '４ね', '4ね', '殺す', '殺して', '殺され', '殺害', '自殺', '首吊', '爆破', '爆殺', '刺す',
  // 差別
  'きちがい', 'きちがえ', '基地外', '気違い', 'がいじ', 'ガイジ', 'かたわ', 'めくら', 'つんぼ', 'しなじん', '支那人', 'ちゃんころ', 'ちょんこ',
  'にがー', 'にがあ', '部落民', '在日死', 'くろんぼ',
  // 性的
  'れいぷ', 'ごうかん', '強姦', '犯す', 'おかす', 'せっくす', 'えすいーえっくす', 'ちんこ', 'ちんぽ', 'まんこ', 'おめこ', 'ぱいずり', 'ふぇら', 'おなにー', 'しゃせい', '射精',
  'せいえき', '精液', 'ぼっき', '勃起', 'らんこう', '乱交', 'ぱぱかつ', 'ぱぱ活', 'えんこう', '援交', 'うりせん', 'はめどり', 'ろりこん', 'しょたこん', 'ぜんら', '全裸', 'ぬーど',
  // 英語
  'fuck', 'fuk', 'fxck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'porn', 'sex', 'rape', 'nigger', 'nigga', 'faggot', 'retard', 'kys', 'killyourself', 'nazi', 'hitler',
  'slut', 'whore', 'penis', 'vagina', 'nude', 'nsfw'
];
// 文字をそろえる（全角半角・カタカナひらがな・大文字小文字）。もとの文字の場所も覚えておく
function _normChar(ch) {
  var c2 = ch; try { c2 = ch.normalize('NFKC'); } catch (e) {}
  c2 = c2.toLowerCase();
  return c2.replace(/[ァ-ヶ]/g, function (k) { return String.fromCharCode(k.charCodeAt(0) - 0x60); });
}
function _isSkip(ch) { return /[\s　・。、,.!！?？~〜ー\-_＿*＊'"’”「」()（）\[\]【】/／\\|｜:：;；+＋=＝^`]/.test(ch); }
var NG_ALLOW = ['しねま', 'しねまち', 'ころすけ', 'させっくす', 'すぺしゃる', 'えせっくす'];
var _NG_N = null;
function filterMsg(text) {
  text = String(text || '').replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '').slice(0, MSG_MAX * 2);
  var chars = Array.from ? Array.from(text) : text.split('');
  if (chars.length > MSG_MAX) chars = chars.slice(0, MSG_MAX);
  // 1) 個人情報らしい物（URL・メール・@ID・電話番号・SNSの話）
  var flat = chars.map(_normChar).join('');
  var mask = new Array(chars.length).fill(false);
  var idx = [], acc = 0; chars.forEach(function (ch, i) { var n = _normChar(ch); for (var k = 0; k < n.length; k++) idx.push(i); });
  function maskRange(a, b) { for (var i = a; i < b && i < idx.length; i++) mask[idx[i]] = true; }
  var reList = [/https?:\/\/\S+/g, /www\.\S+/g, /[a-z0-9._-]+\.(com|net|jp|org|io|me|app|ly|co|gg|tv|link|xyz|info)\b\S*/g, /[a-z0-9._%+-]+@[a-z0-9.-]+/g, /@[a-z0-9_.]{2,}/g, /(\d[\s\-−()]*){7,}/g];
  reList.forEach(function (re) { var m; while ((m = re.exec(flat))) maskRange(m.index, m.index + m[0].length); });
  if (/line|らいん|いんすた|insta|twitter|ついったー|tiktok|ていっくとっく|discord|でぃすこ|かかお|kakao|じゅうしょ|住所|でんわ|電話|ばんごう|番号|本名|ほんみょう|がっこう|学校/.test(flat)) {
    var m2, re2 = /[a-z0-9_.]{3,}/g; while ((m2 = re2.exec(flat))) maskRange(m2.index, m2.index + m2[0].length);
  }
  // 2) 過激な言葉（記号やスペースをはさんでも見つける）
  if (!_NG_N) _NG_N = NG_WORDS.map(function (w) { return Array.from(w).map(_normChar).join('').replace(/[\s・。、,.!！?？~〜ー\-_＿*＊]/g, ''); });
  var compact = [], cmap = [];
  chars.forEach(function (ch, i) { if (_isSkip(ch)) return; var n = _normChar(ch); for (var k = 0; k < n.length; k++) { compact.push(n[k]); cmap.push(i); } });
  var cs = compact.join('');
  NG_ALLOW.forEach(function (w) { var p = cs.indexOf(w); while (p >= 0) { cs = cs.slice(0, p) + '\u0001'.repeat(w.length) + cs.slice(p + w.length); p = cs.indexOf(w, p + 1); } });
  _NG_N.forEach(function (w) { if (!w) return; var p = cs.indexOf(w); while (p >= 0) { for (var k = p; k < p + w.length; k++) mask[cmap[k]] = true; p = cs.indexOf(w, p + 1); } });
  var out = chars.map(function (ch, i) { return mask[i] ? '＊' : ch; }).join('').trim();
  return { text: out, censored: mask.some(function (v) { return v; }) };
}
