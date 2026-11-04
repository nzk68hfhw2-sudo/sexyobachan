// ---- save codes: carry your progress to another device by writing down a short code ----
// Layout (bytes): version, night, flags(clears|true|normal|intro), lore x2, anomalies x3, best tips x2 (cents),
// total tips x3 (cents), times caught x2, name length + name (ASCII), checksum.
var B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
function crc8(bytes) { var c = 0; for (var i = 0; i < bytes.length; i++) { c ^= bytes[i]; for (var k = 0; k < 8; k++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff; } return c; }
function b32enc(bytes) { var out = '', bits = 0, val = 0; for (var i = 0; i < bytes.length; i++) { val = (val << 8) | bytes[i]; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += B32[(val << (5 - bits)) & 31]; return out; }
function b32dec(str) { var out = [], bits = 0, val = 0; for (var i = 0; i < str.length; i++) { var v = B32.indexOf(str[i]); if (v < 0) return null; val = ((val << 5) | v) & 0xffffff; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return out; }
function makeSaveCode() {
  var b = [1, clamp(SAVE.day || 1, 1, 5)];
  b.push((clamp(SAVE.clears || 0, 0, 5)) | (SAVE.trueEnd ? 16 : 0) | (SAVE.normalEnd ? 32 : 0) | (SAVE.seenIntro ? 64 : 0));
  var lore = 0; LORE.forEach(function (L, i) { if (SAVE.lore && SAVE.lore[L.id]) lore |= 1 << i; }); b.push(lore & 255, (lore >> 8) & 255);
  var an = 0; RULES.forEach(function (r, i) { an |= (clamp((SAVE.anomalies && SAVE.anomalies[r.id]) || 0, 0, 2)) << (i * 2); }); b.push(an & 255, (an >> 8) & 255, (an >> 16) & 255);
  var bt = clamp(Math.round((SAVE.bestTips || 0) * 100), 0, 65535), tt = clamp(Math.round((SAVE.totalTips || 0) * 100), 0, 16777215), dd = clamp(SAVE.deaths || 0, 0, 65535);
  b.push(bt & 255, bt >> 8, tt & 255, (tt >> 8) & 255, (tt >> 16) & 255, dd & 255, dd >> 8);
  var nm = String(SAVE.name || '').replace(/[^A-Za-z .'-]/g, '').slice(0, 12); b.push(nm.length); for (var i = 0; i < nm.length; i++) b.push(nm.charCodeAt(i));
  b.push(crc8(b));
  var s = b32enc(b), g = [];
  for (var k = 0; k < s.length; k += 4) g.push(s.slice(k, k + 4));
  return 'SSD-' + g.join('-');
}
function readSaveCode(code) {
  var s = String(code || '').toUpperCase().replace(/^SSD/, '').replace(/[\s\-_]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  var b = b32dec(s); if (!b || b.length < 17) return null;
  var n = b[15]; if (b.length < 17 + n) return null;
  var body = b.slice(0, 16 + n); if (crc8(body) !== b[16 + n] || body[0] !== 1) return null;
  var o = { day: clamp(body[1], 1, 5), clears: body[2] & 15, trueEnd: body[2] & 16 ? 1 : 0, normalEnd: body[2] & 32 ? 1 : 0, seenIntro: body[2] & 64 ? 1 : 0, lore: {}, anomalies: {} };
  var lore = body[3] | (body[4] << 8); LORE.forEach(function (L, i) { if (lore & (1 << i)) o.lore[L.id] = 1; });
  var an = body[5] | (body[6] << 8) | (body[7] << 16); RULES.forEach(function (r, i) { var v = (an >> (i * 2)) & 3; if (v) o.anomalies[r.id] = v; });
  o.bestTips = (body[8] | (body[9] << 8)) / 100; o.totalTips = (body[10] | (body[11] << 8) | (body[12] << 16)) / 100; o.deaths = body[13] | (body[14] << 8);
  o.name = ''; for (var i = 0; i < n; i++) o.name += String.fromCharCode(body[16 + i]);
  return o;
}
function applySaveCode(o) {
  ['day', 'clears', 'trueEnd', 'normalEnd', 'seenIntro', 'lore', 'anomalies', 'bestTips', 'totalTips', 'deaths', 'name'].forEach(function (k) { SAVE[k] = o[k]; });
  SAVE.bestDay = Math.max(SAVE.bestDay || 0, o.clears);
  writeSave();
}
function openSaveCode() {
  var ov = el('div', 'ov dim pe', '', UI);
  var p = el('div', 'panel ssd-scroll', '<h2>Save Code</h2>' +
    '<div class="row"><div class="lb"><span>YOUR CODE</span><span class="ja">いまの記録のコード（メモしておく）</span></div>' +
    '<div id="ssd-code" class="codebox">' + makeSaveCode() + '</div><div class="seg"><button id="ssd-copy">COPY / コピー</button></div></div>' +
    '<div class="row"><div class="lb"><span>LOAD A CODE</span><span class="ja">コードを入れて続きから</span></div>' +
    '<input id="ssd-codein" class="codein" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SSD-XXXX-XXXX-..."><div class="seg"><button id="ssd-load">LOAD / 読み込む</button></div><div id="ssd-codemsg" class="codemsg"></div></div>' +
    '<div class="row"><div class="lb"><span class="ja" style="font-size:12px">名前・何日目まで進んだか・記録（チップ、つかまった回数、異変の図鑑、集めたロア、見たエンディング）が入ります。設定は入りません。</span></div></div>', ov);
  p.style.backgroundImage = 'url(' + PAPER.rules + ')';
  var inp = p.querySelector('#ssd-codein');
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (n) { inp.addEventListener(n, function (e) { e.stopPropagation(); }); });
  onTap(p.querySelector('#ssd-copy'), function () {
    var t = p.querySelector('#ssd-code').textContent, done = function () { toast('Code copied.', 'コードをコピーしました', 1.6); };
    try { navigator.clipboard.writeText(t).then(done, selectCode); } catch (e) { selectCode(); }
    function selectCode() { try { var r = document.createRange(); r.selectNodeContents(p.querySelector('#ssd-code')); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e2) {} toast('Select the code and copy it.', 'コードを選んでコピーしてください', 2); }
  });
  onTap(p.querySelector('#ssd-load'), function () {
    var o = readSaveCode(inp.value), msg = p.querySelector('#ssd-codemsg');
    if (!o) { msg.textContent = 'That code doesn\'t work. Check each letter. / コードがちがいます。1文字ずつ確かめてください。'; msg.className = 'codemsg bad'; sfx('thump'); return; }
    applySaveCode(o); sfx('register');
    msg.textContent = 'Loaded: ' + (o.name || '—') + ', Night ' + o.day + '. / 読み込みました（' + (o.name || '名前なし') + '・' + o.day + '日目）'; msg.className = 'codemsg ok';
    p.querySelector('#ssd-code').textContent = makeSaveCode();
    if (SCR.title) { hideTitle(); showTitle(); }
  });
  var cb = el('button', 'mb pe docclose', icon('ok', 30) + '<span class="tx"><span class="en">DONE</span><span class="ja">とじる</span></span>', ov); pressFX(cb);
  onTap(cb, function () { sfx('paper'); ov.parentNode.removeChild(ov); });
}
var CODE_CSS = [
  '.codebox{margin-top:8px;padding:10px 12px;border:2px dashed #22201c;border-radius:8px;background:rgba(255,255,255,.45);font:400 17px/1.5 "Special Elite",monospace;letter-spacing:.06em;word-break:normal;overflow-wrap:break-word;-webkit-user-select:text;user-select:text;color:#1d2f6f}',
  '.codein{width:100%;height:46px;margin-top:8px;padding:0 10px;border:2px solid #22201c;border-radius:8px;background:#fffaf0;font:400 16px/46px "Special Elite",monospace;letter-spacing:.05em;color:#1d2f6f;outline:none;-webkit-user-select:text;user-select:text;text-transform:uppercase}',
  '.codemsg{margin-top:8px;font:600 12px/1.5 "Zen Kaku Gothic New",sans-serif}.codemsg.bad{color:#a01018}.codemsg.ok{color:#2f7e6e}'
].join('\n');
