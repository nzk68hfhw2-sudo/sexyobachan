// ---- 各ウィンドウの中身（カバン・図鑑・ステータス・定型文・スタンプ・身ぶり・設定・地図） --------------
// ---- 図鑑 ----
var ZUKAN = { found: {}, tab: 0, sel: null };
var ZTABS = ['もの', 'ともだち', '場所・時間', '現象・ひみつ', '合成'];
var AREA_DESC = { eki: '電车はまだ一度も来た事がない。時計だけがまじめに働いている。', shoten: '全てのお店が「営業中」と「準備中」を同時にかかげている。', danchi: '同じ形の建物が３つ。外階段は屋上に続く。', koen: '８人の友達の像がある公園。像の順番には意味があるとか無いとか。', kawa: 'ぬるい川。流れは遅い。たまに逆に流れる。', akichi: '何も無い事になっている空き地。何かはある。', jinja: '神社なのかどうか、誰も確かめていない。', nai: 'この部屋は存在しません。図鑑に載っているのは何かのまちがいです。' };
var TIME_DESC = { asa: '朝。空がピンクになる。鳥が「しゃっきり」と鳴く。', hiru: '昼。いちばん普通の時間。普通すぎて少しこわい。', yu: '夕方。全部がオレンジ色。影が長くのびて、少し歩く。', yoru: '夜。団地の窓が光る。星がたくさんある（数えた人はいない）。', nai: '存在しない時間。２５時６１分。空が緑とピンクになり、太陽が大きくなる。' };
function zukanEntries(tab) {
  if (tab === 0) return PROP_DEFS.filter(function (d) { return d.z && d.b !== 'friend' && d.b !== 'statue'; }).map(function (d) { return { id: 'p_' + d.id, n: d.n, d: d.z, secret: d.secret, icon: d.b !== 'proxy' ? d.b : null }; })
    .concat(Object.keys(EXTRA_TYPES).map(function (k) { var t = EXTRA_TYPES[k]; return { id: 'i_' + k, n: t.name, d: t.desc, icon: k }; }));
  if (tab === 1) return FRIEND_INFO.map(function (f, i) { return { id: 'f_' + i, n: f.full, d: f.desc + '\n【とくぎ】' + CHARS[i].skill.name + '：' + CHARS[i].skill.desc + '\n（添付モデル「' + (i < 4 ? 'Four Little Friends' : 'Four Friends') + '」の' + (i % 4 + 1) + '人目）', face: i }; });
  if (tab === 2) return AREAS.map(function (a) { return { id: 'a_' + a.id, n: a.name, d: a.wa + '。' + a.sub + '。' + (AREA_DESC[a.id] || '') }; }).concat(TIMES.map(function (t) { return { id: 't_' + t.id, n: '時間帯：' + t.name, d: TIME_DESC[t.id] }; }));
  if (tab === 3) return STAGES.map(function (s, i) { return { id: 's_' + i, n: '汚染：' + s.name, d: s.desc }; }).concat(SECRETS.map(function (s) { return { id: 'x_' + s.id, n: s.n, d: s.d, secret: 1 }; }));
  return RECIPES.map(function (r) { var t = itemType(r.out); return { id: 'r_' + r.out, n: t.name, d: itemType(r.a).name + '　＋　' + itemType(r.b).name + '　＝　' + t.name + '\n' + t.desc, icon: r.out, secret: 1 }; });
}
function zukanTotal() { var n = 0, f = 0; for (var t = 0; t < ZTABS.length; t++) zukanEntries(t).forEach(function (e) { n++; if (ZUKAN.found[e.id]) f++; }); return [f, n]; }
function zukanFind(id, name) {
  if (ZUKAN.found[id]) return false;
  ZUKAN.found[id] = 1; sfx('zukan'); sysMsg('図鑑に登録しました：' + name); saveGame(); refreshWin('zukan'); return true;
}
function openZukan() {
  toggleWin('zukan', '図鑑', 'book', function (bd) {
    var tot = zukanTotal();
    el('div', 'kv', bd, '<span>発見</span><b>' + tot[0] + ' ／ ' + tot[1] + '（' + Math.floor(tot[0] / tot[1] * 100) + '％）</b>');
    var tabs = el('div', 'tabs2', bd);
    ZTABS.forEach(function (n, i) { mbtn(tabs, n, function () { ZUKAN.tab = i; ZUKAN.sel = null; refreshWin('zukan'); }, i === ZUKAN.tab ? 'sel' : ''); });
    var list = zukanEntries(ZUKAN.tab), g2 = el('div', 'list', bd);
    var desc = el('div', 'desc', bd);
    list.forEach(function (e) {
      var f = ZUKAN.found[e.id], d = el('div', 'li' + (ZUKAN.sel === e.id ? ' sel' : ''), g2);
      d.style.display = 'flex'; d.style.alignItems = 'center'; d.style.gap = '6px';
      if (f && e.icon) d.appendChild(iconEl(itemIcon(e.icon), 22)); else if (f && e.face != null) { var fc = faceCanvas(e.face), ce = document.createElement('canvas'); ce.width = ce.height = 96; ce.getContext('2d').drawImage(fc, 0, 0); ce.style.width = ce.style.height = '22px'; d.appendChild(ce); }
      el('span', '', d).innerHTML = f ? cnHTML(e.n) : (e.secret ? '？？？（ひみつ）' : '？？？');
      tapBtn(d, function () { ZUKAN.sel = e.id; refreshWin('zukan'); }, 'uiClick');
    });
    var s = list.filter(function (e) { return e.id === ZUKAN.sel; })[0];
    desc.innerHTML = s ? (ZUKAN.found[s.id] ? '<b style="color:#ffe7a8">' + cnHTML(s.n) + '</b><br>' + cnHTML(s.d).replace(/\n/g, '<br>') : 'まだ見つかっていません。' + (s.secret ? '<br>ひみつの物です。' : '')) : cnHTML('項目を押すと　説明が　出ます。説明は　すべて　正確です（当社調べ）。');
  }, { w: 380, h: 420, theme: 'stone' });
}
// ---- カバン ----
var BAG = { items: [], sel: -1, sel2: -1, size: 30 };
function openBag() {
  toggleWin('bag', 'カバン', 'bag', function (bd) {
    el('div', 'kv', bd, '<span>中身</span><b>' + BAG.items.length + ' ／ ' + BAG.size + '</b>');
    var g2 = el('div', 'grid', bd);
    for (var i = 0; i < BAG.size; i++) (function (i) {
      var it = BAG.items[i], c2 = el('div', 'cell' + (BAG.sel === i || BAG.sel2 === i ? ' sel' : ''), g2);
      if (it) { c2.appendChild(iconEl(itemIcon(it.type), 32)); if (it.scale && Math.abs(it.scale - 1) > 0.05) el('span', 'q', c2, '×' + it.scale.toFixed(1)); }
      tapBtn(c2, function () {
        if (!it) { BAG.sel = BAG.sel2 = -1; }
        else if (BAG.sel === i) BAG.sel = -1;
        else if (BAG.sel >= 0 && BAG.sel2 < 0 && BAG.combineMode) BAG.sel2 = i;
        else { BAG.sel = i; BAG.sel2 = -1; }
        refreshWin('bag');
      }, 'uiClick');
    })(i);
    var it = BAG.items[BAG.sel], d = el('div', 'desc', bd);
    if (it) { var t = itemType(it.type); d.innerHTML = '<b style="color:#ffe23a">' + cnHTML(t.name) + '</b>　<span style="color:#9ad0ff">重さ ' + (t.mass * Math.pow(it.scale || 1, 3)).toFixed(1) + '</span><br>' + cnHTML(t.desc) + (t.special ? '<br><span style="color:#c0a0ff">いじる：' + cnHTML(t.special.name) + '</span>' : ''); }
    else d.innerHTML = cnHTML(BAG.combineMode ? '合成する物を２つ選んで下さい。' : '物を選ぶと　説明が出ます。町で物を持って「しまう」と入ります。');
    var row = el('div', 'row2', bd);
    mbtn(row, '取り出す', function () { if (BAG.sel >= 0) { takeOutBag(BAG.sel); } }, BAG.sel >= 0 && !ITEMS.held ? 'gold' : 'off', 'grab');
    mbtn(row, BAG.combineMode ? '合成する!!' : '合成', function () {
      if (!BAG.combineMode) { BAG.combineMode = true; BAG.sel2 = -1; refreshWin('bag'); return; }
      if (BAG.sel >= 0 && BAG.sel2 >= 0) bagCombine(BAG.sel, BAG.sel2); else sysMsg('２つ選んで下さい。');
    }, BAG.combineMode ? 'gold' : '', 'combine');
    if (BAG.combineMode) mbtn(row, 'やめる', function () { BAG.combineMode = false; BAG.sel2 = -1; refreshWin('bag'); });
    mbtn(row, '捨てる', function () { if (BAG.sel >= 0) { BAG.items.splice(BAG.sel, 1); BAG.sel = -1; sfx('uiClose'); sysMsg('捨てました。どこかに行きました。'); refreshWin('bag'); saveGame(); } }, BAG.sel >= 0 ? 'red' : 'off');
  }, { w: 360, h: 430, theme: 'wood' });
}
// ---- ステータス ----
function openStatus() {
  toggleWin('status', 'ステータス', 'status', function (bd) {
    var c = CHARS[PLAYER.char], f = FRIEND_INFO[PLAYER.char];
    var top = el('div', '', bd); top.style.cssText = 'display:flex;gap:8px;align-items:center;';
    var fc = document.createElement('canvas'); fc.width = fc.height = 96; fc.getContext('2d').drawImage(faceCanvas(PLAYER.char), 0, 0); fc.style.cssText = 'width:72px;height:72px;border:2px solid #c8a050;'; top.appendChild(fc);
    el('div', '', top, '<div style="color:#ffe7a8;font-size:16px">' + cnHTML(PLAYER.name) + '</div><div style="color:#9ad0ff">' + cnHTML(f.full) + '</div><div style="font-size:11px;color:#aaa">サーバー：' + cnHTML(PLAYER.server || '?') + '　' + cnHTML(PLAYER.channel || '') + '</div>');
    function bar(n, v, mx) { var r = el('div', 'kv', bd); el('span', '', r).innerHTML = cnHTML(n); var g2 = el('div', 'gg hp', r); g2.style.width = '55%'; var i = el('i', '', g2); i.style.width = clamp(v / mx * 100, 0, 100) + '%'; el('b', '', g2, v.toFixed(2)); }
    el('div', 'hd', bd, '能力');
    bar('歩く速さ', c.speed, 1.5); bar('ジャンプ', c.jump, 1.6); bar('体の大きさ', c.scale, 1.5);
    el('div', 'kv', bd, '<span>とくぎ</span><b>' + cnHTML(c.skill.name) + '</b>');
    el('div', 'desc', bd, cnHTML(c.skill.desc));
    el('div', 'hd', bd, '記録');
    [['汚染率', Math.round(G.pol) + '％'], ['げんき', Math.round(G.genki)], ['歩いた距離', Math.round(P.dist) + 'ｍ'], ['さわった回数', G.touches], ['いじった回数', G.fiddles || 0], ['合成した回数', G.combines || 0], ['ひみつ', Object.keys(G.secrets).length + ' ／ ' + SECRETS.length]].forEach(function (kv) { el('div', 'kv', bd, '<span>' + cnHTML(kv[0]) + '</span><b>' + cnHTML(String(kv[1])) + '</b>'); });
    var row = el('div', 'row2', bd);
    mbtn(row, '名前を選び直す', function () { PLAYER.name = makeName(); saveGame(); refreshWin('status'); sysMsg('名前が「' + PLAYER.name + '」になりました。'); if (window.NET && NET.sendMeta) NET.sendMeta(); }, '', 'char');
  }, { w: 330, h: 440 });
}
// ---- 定型文・スタンプ・身ぶり ----
var PH_TAB = 0;
function openPhrases() {
  toggleWin('phr', '定型文', 'chat', function (bd) {
    var tabs = el('div', 'tabs2', bd);
    PHRASES.forEach(function (c2, i) { mbtn(tabs, c2[0], function () { PH_TAB = i; refreshWin('phr'); }, i === PH_TAB ? 'sel' : ''); });
    var l = el('div', 'list', bd);
    PHRASES[PH_TAB][1].forEach(function (p) { var e = el('div', 'li', l); e.innerHTML = cnHTML(p); tapBtn(e, function () { say(p); if (isNarrow()) closeWin('phr', true); }, 'uiClick'); });
  }, { w: 340, h: 380, nopause: true });
}
function openStamps() {
  toggleWin('stamp', 'スタンプ', 'stamp', function (bd) {
    var g2 = el('div', 'grid', bd);
    STAMPS.forEach(function (s) { var c2 = el('div', 'cell', g2); c2.appendChild(iconEl(uiIcon(s.id), 32)); c2.title = s.n; tapBtn(c2, function () { stamp(s.id); if (isNarrow()) closeWin('stamp', true); }, 'uiClick'); });
  }, { w: 300, nopause: true });
}
function openGestures() {
  toggleWin('ges', '身ぶり', 'gesture', function (bd) {
    var l = el('div', 'grid', bd); l.style.gridTemplateColumns = 'repeat(auto-fill,minmax(92px,1fr))';
    GESTURES.forEach(function (g3) { mbtn(l, g3.n, function () { gesture(g3.id); if (isNarrow()) closeWin('ges', true); }, '', g3.id); });
  }, { w: 320, nopause: true });
}
function say(text) {
  PLAYER.bubble = { text: text, t: now() + 4500 };
  logMsg('talk', text, PLAYER.name); sfx('chat');
  if (window.NET && NET.send) NET.send('say', { t: text });
  addPollution(0.2);
}
function stamp(id) { PLAYER.bubble = { text: id, icon: id, t: now() + 3500 }; sfx('pop'); logMsg('talk', '（スタンプ：' + (STAMPS.filter(function (s) { return s.id === id; })[0] || {}).n + '）', PLAYER.name); if (window.NET && NET.send) NET.send('stamp', { s: id }); }
function gesture(id) { P.gesture = { id: id, t: 0 }; logMsg('talk', '（' + (GESTURES.filter(function (g3) { return g3.id === id; })[0] || {}).n + '）', PLAYER.name); if (window.NET && NET.send) NET.send('ges', { g: id }); }
// ---- 設定 ----
function openSettings() {
  toggleWin('set', '設定', 'gear', function (bd) {
    function row(label, icon, get, set) { var r = el('div', 'kv', bd); var l = el('span', '', r); l.style.display = 'flex'; l.style.alignItems = 'center'; l.style.gap = '5px'; l.appendChild(iconEl(uiIcon(icon), 18)); el('span', '', l).innerHTML = cnHTML(label); mbtn(r, get() ? 'ON' : 'OFF', function () { set(!get()); saveGame(); refreshWin('set'); }, get() ? 'gold' : ''); }
    row('ＢＧＭ（音楽）', 'music', function () { return AUD.bgmOn; }, function (v) { audioSetBgm(v); });
    row('効果音', 'sound', function () { return AUD.sfxOn; }, function (v) { audioSetSfx(v); });
    row('軽量モード（古いスマホ用）', 'lite', function () { return LITE.on; }, function (v) { setLite(v); });
    row('刺激ひかえめモード', 'eye', function () { return REDUCED.on; }, function (v) { REDUCED.on = v; });
    row('ほかの人をミュート（見えなくする）', 'mute', function () { return !!(window.NET && NET.muted); }, function (v) { if (window.NET) NET.muted = v; });
    el('div', 'desc', bd, [cnHTML('記録の保存：' + (STORE.available() ? 'この端末のブラウザに保存されます' : '保存できない環境です（閉じると消えます）')), cnHTML('画質：' + ['最低', '低', '中', '高'][R.quality] + '　/　' + (R.lastFps ? Math.round(R.lastFps) + 'fps' : '計測中')), cnHTML('通信：' + (window.NET ? NET.statusText() : '1人用')), cnHTML('版：' + GAME_VERSION)].join('<br>'));
    var r2 = el('div', 'row2', bd);
    mbtn(r2, 'あそびかた', function () { openHelp(); }, '', 'info');
    mbtn(r2, 'キャラを変える', function () { if (nearDressing()) openCharChange(); else sysMsg('キャラは「着がえ所」で変えられます（駅前・公園）。'); }, '', 'char');
    var conf = 0; var rb = mbtn(r2, '記録を消す', function () { conf++; if (conf < 2) { rb.lastChild.textContent = 'もう一度押すと消えます'; return; } STORE.clear(); location.reload(); }, 'red');
  }, { w: 340, h: 430, theme: 'stone' });
}
function openMapWin() {
  toggleWin('map', '地図', 'map', function (bd) {
    if (!MM.base) buildMinimapBase();
    var c2 = document.createElement('canvas'); c2.width = 512; c2.height = 512; var x = c2.getContext('2d'); x.drawImage(MM.base, 0, 0, 512, 512);
    var k = 512 / 320; function wx(v) { return (v + 160) * k; }
    x.font = '14px ' + FONT_UI; x.textAlign = 'center'; x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 3;
    [['駅前', 0, -55], ['商店街', 50, -5], ['団地', -70, -10], ['公園', 0, 0], ['川ぞい', 0, 57], ['謎の空き地', 65, 95], ['神社っぽい所', -80, -97], ['着がえ所', 10, -60], ['着がえ所', -18, 8]].forEach(function (l) { x.strokeText(l[0], wx(l[1]), wx(l[2])); x.fillText(l[0], wx(l[1]), wx(l[2])); });
    x.fillStyle = '#ffe23a'; x.beginPath(); x.arc(wx(P.pos.x), wx(P.pos.z), 6, 0, TAU); x.fill(); x.stroke();
    c2.style.cssText = 'width:100%;height:auto;display:block;image-rendering:pixelated;border:2px solid #c8a050;'; bd.appendChild(c2);
  }, { w: 380, theme: 'wood' });
}
function setLite(v) {
  LITE.on = v; setQuality(v ? 1 : 3);
  WORLD.friends.forEach(function (f) { var g2 = v ? FRIENDS.lo[f.idx] : FRIENDS.hi[f.idx]; if (g2 && f.mesh.geometry !== g2) f.mesh.geometry = g2; });
  if (P.mesh) { var g3 = v ? FRIENDS.lo[PLAYER.char] : FRIENDS.hi[PLAYER.char]; if (g3) P.mesh.geometry = g3; }
}

function openHelp() {
  openWin('help', 'あそびかた', 'info', function (bd) {
    el('div', 'desc', bd, cnHTML('目的は　ありません。歩いて、物を　持って、投げて、積んで、合成して下さい。いじるほど　町が「汚染」されます。汚染率は１００％を超えても終わりません。'));
    (IN.isTouch ? HELP.touch : HELP.pc).forEach(function (r) { el('div', 'kv', bd, '<b>' + cnHTML(r[0]) + '</b><span style="text-align:right">' + cnHTML(r[1]) + '</span>'); });
    el('div', 'desc', bd, cnHTML('※画面の色が変わる・ゆれる演出があります。⚙設定の「刺激ひかえめモード」で弱くできます。'));
    var r2 = el('div', 'row2', bd); mbtn(r2, 'わかりました', function () { closeWin('help'); }, 'gold');
  }, { w: 380, h: 440, theme: 'wood' });
}
