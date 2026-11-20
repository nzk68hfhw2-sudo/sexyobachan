// ---- サーバー：公式サーバー１つ＋だれでも作れるサーバー（実際の人数を表示） ---------------------------
// Firebase の場所：osen/v1/who（いま遊んでいる人の場所だけ）、osen/v1/srv（作られたサーバー）
var OFFICIAL_SRV = { id: 'main', n: '公式サーバー　よにん町', official: true };
var CHANNELS = ['ch.1 駅前', 'ch.2 ぬるい', 'ch.3 祭り', 'ch.4 静か', 'ch.5 ８人', 'ch.6 夜', 'ch.7 謎', 'ch.8 ４', 'ch.9 ワードアート', 'ch.10 来世'];
var SRV_LIMIT = { mine: 2, all: 30, coolMin: 10, oldDays: 3 };
var SRV = { list: [], counts: {}, ch: {}, ok: false, err: '', loading: false, t: 0 };
// 通信の口だけ先に作る（メニューで人数を見るため）
function netEnsureT() {
  if (NET.T) return NET.T;
  NET.T = NET_DB_URL === 'local' ? localTransport() : fbTransport(NET_DB_URL.replace(/\/+$/, ''));
  NET.pid = 'p' + Math.random().toString(36).slice(2, 9);
  NET.T.initSkew();
  return NET.T;
}
function srvRefresh(cb) {
  if (!NET_DB_URL) { SRV.err = '1人用'; if (cb) cb(); return; }
  try { netEnsureT(); } catch (e) { SRV.err = 'つながらない'; if (cb) cb(); return; }
  SRV.loading = true; var done = false;
  var to = setTimeout(function () { if (done) return; done = true; SRV.loading = false; SRV.err = 'つながらない'; if (cb) cb(); }, 8000);
  Promise.all([NET.T.once('who').catch(function () { return null; }), NET.T.once('srv').catch(function () { return null; })]).then(function (r) {
    if (done) return; done = true; clearTimeout(to); SRV.loading = false; SRV.ok = true; SRV.err = '';
    var who = r[0] || {}, srv = r[1] || {}, tn = NET.T.now(); SRV.counts = {}; SRV.ch = {};
    for (var k in who) { var w = who[k]; if (!w || typeof w.r !== 'string' || tn - (w.t || 0) > 70000) continue; var m = /^([a-z0-9]+)_c(\d+)_r\d+$/.exec(w.r); if (!m) continue; SRV.counts[m[1]] = (SRV.counts[m[1]] || 0) + 1; var ck = m[1] + '_' + m[2]; SRV.ch[ck] = (SRV.ch[ck] || 0) + 1; }
    SRV.list = [];
    for (var id in srv) {
      var s = srv[id]; if (!s || typeof s.n !== 'string' || !/^u[a-z0-9]{6,12}$/.test(id)) continue;
      if (tn - (s.s || s.t || 0) > SRV_LIMIT.oldDays * 864e5) { NET.T.remove('srv/' + id).catch(function () {}); continue; } // 長く使われていないサーバーは片づける
      var f = filterMsg(s.n.slice(0, 16)); if (f.censored) continue;
      SRV.list.push({ id: id, n: f.text, pv: !!s.pv, h: typeof s.h === 'string' ? s.h : '', t: s.t || 0 });
    }
    SRV.list.sort(function (a, b) { return (SRV.counts[b.id] || 0) - (SRV.counts[a.id] || 0) || b.t - a.t; });
    if (r[0] === null && r[1] === null) SRV.err = 'ルール';
    if (cb) cb();
  });
}
function srvBusy(n) { return n == null ? ['？', 0, 'hp'] : n === 0 ? ['がらがら', 4, 'hp'] : n <= 5 ? ['快適', 30, 'hp'] : n <= 15 ? ['ふつう', 55, 'hp'] : n <= 30 ? ['混雑', 80, 'pol'] : ['大混雑', 100, 'pol']; }
// ---- サーバー選択の画面 ----
function stepServer() {
  menuWin('サーバー選択', 'server', 370, function (bd) {
    var info = el('div', 'desc', bd); info.innerHTML = cnHTML(SRV.loading ? '人数を調べています…' : !NET_DB_URL ? 'この版は1人用です。' : SRV.err === 'つながらない' ? '通信できません。1人用で遊べます。' : SRV.ok ? '数字は、いま遊んでいる人の数です（自分はふくまない）。' : '人数を調べています…');
    var l = el('div', 'list', bd);
    function row(s) {
      var n = SRV.ok ? (SRV.counts[s.id] || 0) : null, b = srvBusy(n);
      var e = el('div', 'li srv' + (s.official ? ' off' : s.pv ? ' pv' : ''), l);
      var nm = el('span', 'nm', e); nm.innerHTML = (s.official ? '<i class="bdg">公式</i>' : s.pv ? '<i class="bdg pv">🔒個人</i>' : '<i class="bdg us">みんな</i>') + cnHTML(s.n);
      var g2 = el('div', 'gg ' + b[2], e); var f = el('i', '', g2); f.style.width = b[1] + '%'; el('b', '', g2).innerHTML = cnHTML(b[0] + (n != null ? '　' + n + '人' : ''));
      tapBtn(e, function () { srvChoose(s); }, 'uiClick');
    }
    row(OFFICIAL_SRV);
    if (SRV.list.length) { el('div', 'hd', bd).innerHTML = cnHTML('みんなが作ったサーバー（' + SRV.list.length + '）'); l = el('div', 'list os-scroll', bd); l.style.maxHeight = '30vh'; l.style.overflow = 'auto'; SRV.list.forEach(row); }
    var r = el('div', 'row2', bd);
    mbtn(r, 'もどる', stepLogin);
    if (NET_DB_URL) { mbtn(r, '更新', function () { srvRefresh(stepServer); stepServer(); }); mbtn(r, 'サーバーを作る', srvCreateWin, 'gold'); }
  }, 'stone');
  if (NET_DB_URL && !SRV.ok && !SRV.loading && SRV.err !== 'つながらない') srvRefresh(function () { if (MENU.step === 'server') stepServer(); });
  MENU.step = 'server';
}
function srvChoose(s) {
  function go() { PLAYER.server = s.n; PLAYER.srvId = s.id; if (!s.official && NET.T) NET.T.set('srv/' + s.id + '/s', NET.T.now()).catch(function () {}); MENU.step = ''; stepChannel(); }
  if (!s.h) return go();
  askText('パスワードを入れてください', '', 16, true, function (pw) { srvHash(s.id, pw, function (h) { if (h === s.h) go(); else { sysMsg('パスワードがちがいます。'); sfx('error'); } }); });
}
function stepChannel() {
  menuWin('チャンネル選択', 'channel', 380, function (bd) {
    el('div', 'kv', bd, '<span>サーバー</span><b>' + cnHTML(PLAYER.server) + '</b>');
    var g2 = el('div', 'grid', bd); g2.style.gridTemplateColumns = 'repeat(auto-fill,minmax(104px,1fr))';
    CHANNELS.forEach(function (ch, i) {
      var n = SRV.ok ? (SRV.ch[(PLAYER.srvId || 'main') + '_' + (i + 1)] || 0) : null;
      var b = mbtn(g2, ch + (n != null ? '　' + n + '人' : ''), function () { PLAYER.channel = ch; PLAYER.ch = i + 1; stepTerms(); }, n ? 'gold' : '');
    });
    var r = el('div', 'row2', bd); mbtn(r, 'もどる', stepServer);
  }, 'stone');
}
// ---- サーバーを作る ----
function srvMine() { var a = []; try { a = JSON.parse(localStorage.getItem('osen_mysrv') || '[]'); } catch (e) {} return Array.isArray(a) ? a : []; }
function srvCreateWin() {
  var pv = false;
  menuWin('サーバーを作る', 'server', 360, function (bd) {
    el('div', 'desc', bd).innerHTML = cnHTML('名前は16文字まで。ひどい言葉は使えません。3日間だれも入らないと、自動で消えます。1人2つまで。');
    var inp = textInput(bd, 'サーバーの名前', 16, false);
    var tr = el('div', 'kv', bd); el('span', '', tr).innerHTML = cnHTML('種類'); var tg = el('div', '', tr); tg.style.display = 'flex'; tg.style.gap = '3px';
    var bPub = mbtn(tg, 'みんな', function () { pv = false; upd(); }), bPv = mbtn(tg, '🔒個人', function () { pv = true; upd(); });
    var pw = textInput(bd, 'パスワード（個人サーバーだけ。4〜16文字）', 16, true);
    var note = el('div', 'desc', bd); note.innerHTML = cnHTML('※パスワードは「かんたんな鍵」です。大事なことには使わないでください。');
    function upd() { bPub.classList.toggle('gold', !pv); bPv.classList.toggle('gold', pv); pw.parentNode.style.display = pv ? '' : 'none'; }
    upd();
    var r = el('div', 'row2', bd);
    mbtn(r, 'もどる', stepServer);
    mbtn(r, '作る', function () {
      var name = (inp.value || '').replace(/[\s　]+/g, ' ').trim().slice(0, 16), f = filterMsg(name);
      if (!name) return say2('名前を入れてください。'); if (f.censored || f.text !== name) return say2('その名前は使えません。');
      if (pv && (pw.value.length < 4 || pw.value.length > 16)) return say2('パスワードは4〜16文字にしてください。');
      var mine = srvMine(), last = 0; try { last = +localStorage.getItem('osen_mysrv_t') || 0; } catch (e) {}
      if (mine.length >= SRV_LIMIT.mine) return say2('作れるのは1人' + SRV_LIMIT.mine + 'つまでです（古いのは3日で消えます）。');
      if (Date.now() - last < SRV_LIMIT.coolMin * 60000) return say2('作りすぎ防止：あと' + Math.ceil((SRV_LIMIT.coolMin * 60000 - (Date.now() - last)) / 60000) + '分待ってください。');
      if (SRV.list.length >= SRV_LIMIT.all) return say2('サーバーがいっぱいです（' + SRV_LIMIT.all + 'こまで）。空いているサーバーで遊んでください。');
      var id = 'u' + Math.random().toString(36).slice(2, 10).replace(/[^a-z0-9]/g, 'x');
      srvHash(id, pv ? pw.value : '', function (h) {
        var d = { n: name, t: NET.T.now(), s: NET.T.now(), pv: pv ? 1 : 0 }; if (pv) d.h = h;
        NET.T.set('srv/' + id, d).then(function () {
          mine.push(id); try { localStorage.setItem('osen_mysrv', JSON.stringify(mine.slice(-5))); localStorage.setItem('osen_mysrv_t', String(Date.now())); } catch (e) {}
          sysMsg('サーバー「' + name + '」を作りました。'); sfx('combine');
          SRV.list.unshift({ id: id, n: name, pv: pv, h: pv ? h : '', t: Date.now() }); srvChoose({ id: id, n: name, pv: pv, h: '' });
        }, function () { say2('作れませんでした（通信できないか、Firebase のルールの更新が必要です）。'); });
      });
    }, 'gold');
    function say2(t) { note.innerHTML = '<span style="color:#ff8a8a">' + cnHTML(t) + '</span>'; sfx('error'); }
  }, 'stone');
}
function textInput(parent, label, max, secret) {
  var w = el('div', '', parent); el('div', 'desc', w).innerHTML = cnHTML(label);
  var i = document.createElement('input'); i.type = secret ? 'password' : 'text'; i.maxLength = max; i.autocomplete = 'off';
  i.style.cssText = 'width:100%;box-sizing:border-box;font:16px ' + FONT_SUB + ';padding:7px;margin:4px 0 8px;border:2px solid #c8a050;background:#fffef0;color:#222;';
  w.appendChild(i); return i;
}
function askText(title, val, max, secret, done) {
  var bg = el('div', '', UI); bg.style.cssText = 'position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;pointer-events:auto;';
  var w = el('div', 'ow', bg); w.style.cssText = 'position:relative;width:min(320px,88vw);padding:12px;display:block;';
  el('div', 'hd', w, cnHTML(title)); var inp = textInput(w, '', max, secret); inp.value = val || '';
  var row = el('div', 'row2', w); function close() { if (bg.parentNode) bg.parentNode.removeChild(bg); }
  mbtn(row, '決定', function () { var v = inp.value; close(); done(v); }, 'gold'); mbtn(row, 'やめる', close);
  setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
}
// パスワードは、そのまま送らずに「ハッシュ」にして比べる
function srvHash(id, pw, cb) {
  var s = 'osen:' + id + ':' + pw;
  try {
    if (window.crypto && crypto.subtle && window.TextEncoder) { crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { cb(Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('')); }, function () { cb(fnv64(s)); }); return; }
  } catch (e) {}
  cb(fnv64(s));
}
function fnv64(s) { var out = ''; for (var k = 0; k < 8; k++) { var h = hashStr(k + s); out += ('0000000' + h.toString(16)).slice(-8); } return out; }
// いまいる場所を知らせる（人数を数えるため。場所は町の名前だけ）
function srvWho() { if (!NET.on || !NET.T) return; NET.T.set('who/' + NET.pid, { r: NET.room, t: NET.T.now() }).catch(function () {}); }
setInterval(srvWho, 25000);
