// Tests against the REAL Supabase project in api-config.json, using a throw-away dummy account that is deleted at the end.
// Sends an Origin header of another site and checks the CORS answer (same condition as the Gravity loader).
const { execFileSync } = require('child_process'); const cfg = require('../api-config.json');
const ORIGIN = 'https://some-other-site.example'; const rows = [];
const check = (n, p, d) => rows.push((p ? 'OK ' : 'NG ') + '| ' + n + ' | ' + (d || ''));
function rpc(fn, args) {
  const out = execFileSync('curl', ['-sS', '-m', '30', '-i', '-X', 'POST', cfg.url + '/rest/v1/rpc/' + fn, '-H', 'apikey: ' + cfg.key, '-H', 'Authorization: Bearer ' + cfg.key,
    '-H', 'Content-Type: application/json', '-H', 'Origin: ' + ORIGIN, '-d', JSON.stringify(args)], { encoding: 'utf8' });
  const parts = out.split(/\r?\n\r?\n/); const body = parts[parts.length - 1]; let j; try { j = JSON.parse(body); } catch (e) { j = { ok: false, error: 'RAW:' + body.slice(0, 200) }; }
  j._acao = (/access-control-allow-origin:\s*(\S+)/i.exec(out) || [])[1]; j._status = (/HTTP\/[\d.]+ (\d+)(?![\s\S]*HTTP\/)/.exec(out) || [])[1]; return j;
}
const tag = Date.now().toString(36).slice(-6), ID = 'dummy_' + tag, PW = 'Dummy-Pass-' + tag + '-2468', LOCK = 'dummylock_' + tag;
let r = rpc('fr_leaderboard', {}); check('本番サーバーに HTTPS で接続', r.ok === true, 'HTTP ' + r._status);
check('別サイトからの呼び出しが許可される（CORS）', r._acao === '*' || r._acao === ORIGIN, 'Access-Control-Allow-Origin: ' + r._acao);
r = rpc('fr_register', { p_id: ID, p_password: PW }); check('新規登録（ダミー ID ' + ID + '）', r.ok === true, r.ok ? 'ok' : r.error);
r = rpc('fr_login', { p_id: ID, p_password: PW }); const tok = r.token; check('正しいログイン', r.ok === true && r.id === ID, r.ok ? 'ok' : r.error);
r = rpc('fr_login', { p_id: ID, p_password: 'wrong-password-1' }); check('まちがったパスワードは拒否', r.error === 'BAD_CREDENTIALS', r.error + ' 残り' + r.remaining);
r = rpc('fr_register', { p_id: ID.toUpperCase(), p_password: 'Other-Pass-13579' }); check('同じ ID の二重登録は拒否', r.error === 'ID_TAKEN', r.error);
r = rpc('fr_register', { p_id: 'dummy_s' + tag, p_password: '1234567' }); check('7文字のパスワードは拒否', r.error === 'SHORT_PASSWORD', r.error);
r = rpc('fr_me', { p_token: tok }); check('合言葉（トークン）でログイン状態を確認', r.ok === true && r.id === ID, r.ok ? 'ok' : r.error);
r = rpc('fr_submit_score', { p_token: tok, p_score: 1234, p_wave: 2, p_kills: 9, p_acc: 40, p_time: 120, p_win: false }); check('スコアをアカウントに保存', r.ok === true && r.best === 1234, r.ok ? 'best=' + r.best + ' rank=' + r.rank : r.error);
r = rpc('fr_leaderboard', {}); check('ランキングに反映', r.ok && r.rows.some(x => x.id === ID && x.best === 1234), r.ok ? r.rows.length + ' 人' : r.error);
let last; for (let i = 0; i < 5; i++) last = rpc('fr_login', { p_id: LOCK, p_password: 'wrong-' + i });
check('5回連続失敗でロック', last.error === 'LOCKED', last.error + ' ' + last.retry_after + '秒');
r = rpc('fr_login', { p_id: LOCK, p_password: 'anything-at-all' }); check('ロック中は入れない', r.error === 'LOCKED', r.error);
// the public key must not be able to read the tables directly
const direct = execFileSync('curl', ['-sS', '-m', '30', '-o', '/dev/null', '-w', '%{http_code}', cfg.url + '/rest/v1/users?select=*', '-H', 'apikey: ' + cfg.key, '-H', 'Authorization: Bearer ' + cfg.key, '-H', 'Accept-Profile: fr_private'], { encoding: 'utf8' });
check('公開用キーでは表を直接読めない', direct !== '200', 'HTTP ' + direct);
r = rpc('fr_logout', { p_token: tok }); const me = rpc('fr_me', { p_token: tok }); check('ログアウト', r.ok && me.error === 'NOT_LOGGED_IN', me.error);
r = rpc('fr_login', { p_id: ID, p_password: PW }); const tok2 = r.token;
r = rpc('fr_delete_account', { p_token: tok2, p_password: 'wrong-password-1' }); check('アカウント削除：まちがったパスワードでは消せない', r.error === 'BAD_CREDENTIALS', r.error);
r = rpc('fr_delete_account', { p_token: tok2, p_password: PW }); check('アカウント削除（ダミーを片づけ）', r.ok === true, r.ok ? 'ok' : r.error);
r = rpc('fr_login', { p_id: ID, p_password: PW }); const lb = rpc('fr_leaderboard', {}); check('削除後はログインできず、記録も消えている', r.error === 'BAD_CREDENTIALS' && lb.ok && !lb.rows.some(x => x.id === ID), r.error);
console.log(rows.join('\n')); const ng = rows.filter(x => x.startsWith('NG')).length; console.log('\n合計 ' + rows.length + ' 件 / 失敗 ' + ng + ' 件'); process.exit(ng ? 1 : 0);
