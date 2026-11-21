// ---- accounts: ID + password login against Supabase (HTTPS only, no cookies) --
// The password is sent once over HTTPS and hashed with bcrypt on the server.
// The server returns a random session token; it is kept in localStorage (or in
// memory when storage is unavailable) and sent in the request body — no cookies.
var API = { url: 'SUPABASE_URL_HERE', key: 'SUPABASE_KEY_HERE' };
if (window.__FR_API) { API.url = window.__FR_API.url; API.key = window.__FR_API.key; }
var ACC = { token: null, id: null, best: 0, memOnly: false, checked: false, online: null };

function apiReady() {
  if (/^https:\/\/[a-z0-9.-]+$/i.test(API.url)) return true;                      // HTTPS only
  return !!(window.__FR_API && window.__FR_API.test && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(API.url));   // local automated tests
}
function rpc(name, args, cb) {
  if (!apiReady()) return cb({ ok: false, error: 'NOT_CONFIGURED' });
  var done = false, ctl = window.AbortController ? new AbortController() : null;
  function fin(r) { if (done) return; done = true; clearTimeout(tm); cb(r); }
  var tm = setTimeout(function () { if (ctl) { try { ctl.abort(); } catch (e) {} } fin({ ok: false, error: 'NETWORK' }); }, 15000);
  try {
    fetch(API.url + '/rest/v1/rpc/' + name, {
      method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', signal: ctl ? ctl.signal : undefined,
      headers: { 'Content-Type': 'application/json', 'apikey': API.key, 'Authorization': 'Bearer ' + API.key },
      body: JSON.stringify(args || {})
    }).then(function (r) { return r.json().then(function (j) { return (j && typeof j.ok === 'boolean') ? j : { ok: false, error: 'SERVER', status: r.status }; }); })
      .then(fin, function () { fin({ ok: false, error: 'NETWORK' }); });
  } catch (e) { fin({ ok: false, error: 'NETWORK' }); }
}
function errText(r) {
  var m = Math.max(1, Math.ceil((r.retry_after || 60) / 60));
  switch (r.error) {
    case 'BAD_CREDENTIALS': return 'ID またはパスワードが違います' + (r.remaining != null ? '（あと ' + r.remaining + ' 回まちがえるとロック）' : '');
    case 'LOCKED': return 'まちがいが続いたためロック中です。約 ' + m + ' 分後にもう一度ためしてください';
    case 'TOO_MANY': return '登録が多すぎます。約 ' + m + ' 分後にもう一度ためしてください';
    case 'ID_TAKEN': return 'その ID はすでに使われています';
    case 'BAD_ID': return 'ID は半角の英数字と _ で 3〜16 文字にしてください';
    case 'SHORT_PASSWORD': return 'パスワードは 8 文字以上にしてください';
    case 'LONG_PASSWORD': return 'パスワードが長すぎます（72 文字まで）';
    case 'NOT_LOGGED_IN': return 'ログインの期限が切れました。もう一度ログインしてください';
    case 'NOT_CONFIGURED': return 'ログイン機能はまだ準備中です';
    case 'NETWORK': return 'サーバーに接続できませんでした（通信状態、またはアプリの制限の可能性）';
    default: return 'うまくいきませんでした（' + (r.error || '不明') + '）';
  }
}
function setSession(r) {
  ACC.token = r.token; ACC.id = r.id; ACC.best = r.best || 0; ACC.memOnly = false;
  try { localStorage.setItem('fr_token', r.token); if (localStorage.getItem('fr_token') !== r.token) ACC.memOnly = true; } catch (e) { ACC.memOnly = true; }
  ecoRefresh();
}
function clearSession() { var had = !!ACC.token; ACC.token = null; ACC.id = null; ACC.best = 0; try { localStorage.removeItem('fr_token'); } catch (e) {} if (had) ecoRefresh(); }
function accountInit() {
  if (!apiReady()) { ACC.checked = true; ecoRefresh(); return refreshAccountUI(); }
  var t = null; try { t = localStorage.getItem('fr_token'); } catch (e) {}
  if (!t) { ACC.checked = true; ecoRefresh(); rpc('fr_leaderboard', {}, function (r) { ACC.online = !!r.ok; refreshAccountUI(); }); return refreshAccountUI(); }
  rpc('fr_me', { p_token: t }, function (r) {
    ACC.checked = true; ACC.online = r.error !== 'NETWORK';
    if (r.ok) { ACC.token = t; ACC.id = r.id; ACC.best = r.best || 0; } else if (r.error === 'NOT_LOGGED_IN') clearSession();
    ecoRefresh(); refreshAccountUI();
  });
}
function validateInputs(id, pw, isRegister) {
  if (!/^[A-Za-z0-9_]{3,16}$/.test(id)) return isRegister ? errText({ error: 'BAD_ID' }) : errText({ error: 'BAD_CREDENTIALS' });
  if (isRegister && pw.length < 8) return errText({ error: 'SHORT_PASSWORD' });
  if (!pw) return 'パスワードを入れてください';
  return null;
}
function doAuth(isRegister) {
  var id = H.aId.value.trim(), pw = H.aPw.value, v = validateInputs(id, pw, isRegister);
  if (v) { H.aMsg.textContent = v; return; }
  if (ACC.busy) return; ACC.busy = true; H.aMsg.textContent = '通信中…';
  rpc(isRegister ? 'fr_register' : 'fr_login', { p_id: id, p_password: pw }, function (r) {
    ACC.busy = false; H.aPw.value = '';
    if (!r.ok) { H.aMsg.textContent = errText(r); return; }
    setSession(r); H.aId.blur(); H.aPw.blur(); H.aMsg.textContent = '';
    showScreen('title');
  });
}
function doLogout() { var t = ACC.token; clearSession(); refreshAccountUI(); if (t) rpc('fr_logout', { p_token: t }, function () {}); }
function doDelete() {
  var pw = H.dPw.value; if (!pw) { H.dMsg.textContent = 'パスワードを入れてください'; return; }
  if (ACC.busy) return; ACC.busy = true; H.dMsg.textContent = '通信中…';
  rpc('fr_delete_account', { p_token: ACC.token, p_password: pw }, function (r) {
    ACC.busy = false; H.dPw.value = '';
    if (!r.ok) { H.dMsg.textContent = errText(r); if (r.error === 'NOT_LOGGED_IN') { clearSession(); showScreen('title'); } return; }
    clearSession(); H.dMsg.textContent = ''; showScreen('title'); H.accMsg.textContent = 'アカウントと記録を削除しました';
  });
}
function showRanking() {
  showScreen('rank'); H.rankList.innerHTML = ''; H.rankList2.innerHTML = ''; H.rankMsg.textContent = '読み込み中…';
  rpc('fr_leaderboard', {}, function (r) {
    if (!r.ok) { H.rankMsg.textContent = errText(r); return; }
    H.rankMsg.textContent = '';
    if (!r.rows.length) el('span', null, H.rankList, 'まだ記録がありません');
    r.rows.forEach(function (row, i) { el('span', null, H.rankList, (i + 1) + '. ' + row.id + (row.lv ? '（Lv ' + row.lv + ' ' + titleOf(row.lv) + '）' : '') + (row.id === ACC.id ? ' ←あなた' : '')); el('b', null, H.rankList, String(row.best)); });
  });
  rpc('fr_leaderboard_tdm', {}, function (r) {
    if (!r.ok) return;
    if (!r.rows.length) el('span', null, H.rankList2, 'まだ記録がありません');
    r.rows.forEach(function (row, i) { el('span', null, H.rankList2, (i + 1) + '. ' + row.id + '（Lv ' + row.lv + ' ' + titleOf(row.lv) + '）' + (row.id === ACC.id ? ' ←あなた' : '')); el('b', null, H.rankList2, row.wins + ' 勝 ' + row.losses + ' 敗'); });
  });
}
function buildAccountUI() {
  var a = H.account; a.style.cssText = 'margin:6px 0 4px';
  H.accInfo = el('p', null, a, ''); H.accBtns = el('div', null, a); H.accMsg = el('p', 'fr-note', a, '');
  H.rSave = el('p', 'fr-note', H.result, ''); H.result.insertBefore(H.rSave, H.rNote.nextSibling);
  function field(parent, ph, type, ac) { var i = el('input', 'fr-in', parent); i.type = type; i.placeholder = ph; i.autocomplete = ac; i.setAttribute('autocapitalize', 'off'); i.setAttribute('autocorrect', 'off'); i.spellcheck = false; i.maxLength = type === 'password' ? 72 : 16;
    ['touchstart', 'touchmove', 'touchend'].forEach(function (n) { i.addEventListener(n, function (e) { e.stopPropagation(); }, { passive: true }); }); return i; }
  var s = H.auth = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, s, 'ログイン / 新規登録');
  H.aId = field(s, 'ID（半角英数字と _ ・3〜16文字）', 'text', 'username'); H.aPw = field(s, 'パスワード（8文字以上）', 'password', 'current-password');
  H.aMsg = el('p', null, s, ''); H.aMsg.style.color = '#ffd27a'; H.aMsg.style.minHeight = '1.6em';
  onTap(el('button', 'fr-b pri', s, 'ログイン'), function () { doAuth(false); });
  onTap(el('button', 'fr-b', s, 'この ID とパスワードで新規登録'), function () { doAuth(true); });
  onTap(el('button', 'fr-b sm', s, 'もどる'), function () { H.aPw.value = ''; H.aMsg.textContent = ''; showScreen('title'); });
  el('p', 'fr-note', s, 'パスワードは暗号化（bcrypt）してサーバーに保存され、だれにも読めません。忘れると元に戻せないのでメモしておいてください。ほかのサービスと同じパスワードは使わないでください。');
  var d = H.del = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, d, 'アカウント削除'); el('p', null, d, 'アカウントと、保存されたすべての記録が消えます。元には戻せません。確認のためパスワードを入れてください。');
  H.dPw = field(d, 'パスワード', 'password', 'current-password'); H.dMsg = el('p', null, d, ''); H.dMsg.style.color = '#ffd27a'; H.dMsg.style.minHeight = '1.6em';
  var db = el('button', 'fr-b', d, '削除する'); db.style.background = '#b3261e'; onTap(db, doDelete);
  onTap(el('button', 'fr-b sm', d, 'やめる'), function () { H.dPw.value = ''; H.dMsg.textContent = ''; showScreen('title'); });
  var r = H.rank = el('div', 'fr-screen fr-scroll', UI);
  el('h3', null, r, 'チーム戦 勝利数ランキング'); H.rankList2 = el('div', 'fr-stat', r);
  el('h3', null, r, 'サバイバル スコアランキング'); H.rankList = el('div', 'fr-stat', r); H.rankMsg = el('p', null, r, '');
  onTap(el('button', 'fr-b sm', r, 'もどる'), function () { showScreen('title'); });
  SCREENS.push('auth', 'del', 'rank');
  accountInit();
}
function refreshAccountUI() {
  if (!H.accInfo) return;
  var b = H.accBtns; b.innerHTML = ''; H.accMsg.textContent = '';
  function btn(t, fn) { var x = el('button', 'fr-b sm', b, t); x.style.display = 'inline-block'; x.style.width = 'auto'; x.style.margin = '3px'; x.style.padding = '8px 14px'; onTap(x, function () { audioInit(); SFX.ui(); fn(); }); }
  if (!apiReady()) { H.accInfo.textContent = 'ゲストプレイ中（記録・コイン・持ち物はこの端末だけ。端末を変えると消えます）'; H.accMsg.textContent = 'ログイン機能は準備中です'; return; }
  if (!ACC.checked) { H.accInfo.textContent = 'ログイン状態を確認中…'; return; }
  if (ACC.token) {
    H.accInfo.textContent = 'ログイン中： ' + ACC.id + '　／　自己ベスト ' + ACC.best;
    btn('ランキング', showRanking); btn('ログアウト', doLogout); btn('アカウント削除', function () { showScreen('del'); });
    if (ACC.memOnly) H.accMsg.textContent = '※ このアプリでは保存ができないため、閉じるとログアウトされます';
  } else {
    H.accInfo.textContent = 'ゲストプレイ中（記録・コイン・持ち物はこの端末だけ。端末を変えると消えます）';
    btn('ログイン / 新規登録', function () { showScreen('auth'); }); btn('ランキング', showRanking);
    if (ACC.online === false) H.accMsg.textContent = '※ サーバーに接続できません。このアプリの中ではログインが使えない可能性があります';
  }
}
