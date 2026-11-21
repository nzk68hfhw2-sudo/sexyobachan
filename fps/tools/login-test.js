// Login tests against the SQL in supabase/setup.sql (through tools/api-shim.js). Prints a result table.
// usage: NODE_PATH=<dir with pg> node tools/login-test.js
const { Pool } = require('pg');
const admin = new Pool({ host: '127.0.0.1', port: 54329, user: 'postgres', database: 'postgres' });
const API = 'http://127.0.0.1:8094', ORIGIN = 'https://some-other-site.example';
const rows = []; let ipN = 1;
function check(name, pass, detail) { rows.push([pass ? 'OK ' : 'NG ', name, detail || '']); }
async function rpc(fn, args, ip) {
  const r = await fetch(API + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: 'test-publishable-key', Authorization: 'Bearer test-publishable-key', Origin: ORIGIN, 'x-forwarded-for': ip || '10.0.0.' + ipN }, body: JSON.stringify(args) });
  const j = await r.json(); j._acao = r.headers.get('access-control-allow-origin'); return j;
}
(async () => {
  await admin.query('truncate fr_private.users cascade; truncate fr_private.attempts');
  const ID = 'dummy_tester01', PW = 'Dummy-Pass-2468', PW2 = 'wrong-password-1';
  let r = await rpc('fr_register', { p_id: ID, p_password: PW }); const tok1 = r.token;
  check('新規登録', r.ok && /^[0-9a-f]{64}$/.test(r.token || ''), 'ok=' + r.ok);
  r = await rpc('fr_login', { p_id: ID, p_password: PW }); const tok = r.token;
  check('正しいログイン', r.ok && r.id === ID, 'ok=' + r.ok);
  r = await rpc('fr_login', { p_id: ID.toUpperCase(), p_password: PW });
  check('ID の大文字小文字を区別しないログイン', r.ok, 'ok=' + r.ok);
  r = await rpc('fr_login', { p_id: ID, p_password: PW2 });
  check('まちがったパスワードは拒否', !r.ok && r.error === 'BAD_CREDENTIALS' && !r.token, r.error + ' 残り' + r.remaining);
  r = await rpc('fr_login', { p_id: 'no_such_user', p_password: PW2 });
  check('存在しない ID も同じエラー（ID の有無がもれない）', !r.ok && r.error === 'BAD_CREDENTIALS', r.error);
  r = await rpc('fr_register', { p_id: ID, p_password: 'Another-Pass-999' });
  check('同じ ID の二重登録は拒否', !r.ok && r.error === 'ID_TAKEN', r.error);
  r = await rpc('fr_register', { p_id: 'Dummy_Tester01', p_password: 'Another-Pass-999' });
  check('大文字小文字ちがいの同じ ID も拒否', !r.ok && r.error === 'ID_TAKEN', r.error);
  r = await rpc('fr_register', { p_id: 'short_pw_user', p_password: '1234567' });
  check('パスワード7文字は拒否（最低8文字）', !r.ok && r.error === 'SHORT_PASSWORD', r.error);
  r = await rpc('fr_register', { p_id: 'a b', p_password: PW });
  check('使えない文字の ID は拒否', !r.ok && r.error === 'BAD_ID', r.error);
  r = await rpc('fr_register', { p_id: "x';drop--", p_password: PW });
  check('SQL を混ぜた ID は拒否', !r.ok && r.error === 'BAD_ID', r.error);
  let db = await admin.query('select pw_hash from fr_private.users where id_key=$1', [ID]);
  check('パスワードは bcrypt ハッシュで保存（平文なし）', /^\$2[aby]\$10\$.{53}$/.test(db.rows[0].pw_hash) && !db.rows[0].pw_hash.includes(PW), db.rows[0].pw_hash.slice(0, 7) + '…');
  db = await admin.query("select count(*)::int n from fr_private.sessions where encode(token_hash,'hex') = $1", [tok]);
  check('ログインの合言葉はハッシュ化して保存', db.rows[0].n === 0, '生の値の保存 ' + db.rows[0].n + ' 件');
  r = await rpc('fr_me', { p_token: tok }); check('合言葉でログイン状態を確認（Cookie なし）', r.ok && r.id === ID, 'ok=' + r.ok);
  r = await rpc('fr_me', { p_token: 'f'.repeat(64) }); check('でたらめな合言葉は拒否', !r.ok && r.error === 'NOT_LOGGED_IN', r.error);
  // scores
  r = await rpc('fr_submit_score', { p_token: tok, p_score: 4321, p_wave: 5, p_kills: 30, p_acc: 42, p_time: 200, p_win: false });
  check('スコアをアカウントに保存', r.ok && r.best === 4321 && r.rank === 1, 'best=' + r.best + ' rank=' + r.rank);
  r = await rpc('fr_submit_score', { p_token: 'f'.repeat(64), p_score: 99, p_wave: 1, p_kills: 1, p_acc: 1, p_time: 1, p_win: false });
  check('ログインなしのスコア保存は拒否', !r.ok && r.error === 'NOT_LOGGED_IN', r.error);
  await admin.query("update fr_private.scores set created_at = now() - interval '1 minute'");
  r = await rpc('fr_submit_score', { p_token: tok, p_score: 99999999, p_wave: 5, p_kills: 30, p_acc: 42, p_time: 200, p_win: false });
  check('ありえないスコアは拒否', !r.ok && r.error === 'BAD_SCORE', r.error);
  r = await rpc('fr_leaderboard', {}); check('ランキングに反映', r.ok && r.rows[0].id === ID && r.rows[0].best === 4321, JSON.stringify(r.rows));
  r = await rpc('fr_my_scores', { p_token: tok }); check('自分の記録を取得', r.ok && r.rows.length === 1 && r.rows[0].score === 4321, r.rows.length + ' 件');
  // logout
  r = await rpc('fr_logout', { p_token: tok }); const after = await rpc('fr_me', { p_token: tok }), other = await rpc('fr_me', { p_token: tok1 });
  check('ログアウトすると合言葉が無効になる', r.ok && !after.ok && other.ok, 'あと=' + after.error);
  // lockout
  ipN = 2; let last;
  for (let i = 0; i < 5; i++) last = await rpc('fr_login', { p_id: ID, p_password: PW2 + i });
  check('5回連続でまちがえるとロック', last.error === 'LOCKED' && last.retry_after === 900, last.error + ' ' + last.retry_after + '秒');
  r = await rpc('fr_login', { p_id: ID, p_password: PW });
  check('ロック中は正しいパスワードでも入れない', !r.ok && r.error === 'LOCKED' && r.retry_after > 0, r.error);
  r = await rpc('fr_login', { p_id: ID, p_password: PW }, '10.9.9.9');
  check('別の接続元からでもロックは有効', !r.ok && r.error === 'LOCKED', r.error);
  await admin.query("update fr_private.attempts set locked_until = now() - interval '1 second' where key = $1", ['id:' + ID]);
  r = await rpc('fr_login', { p_id: ID, p_password: PW }); const tok2 = r.token;
  check('ロック時間（15分）が過ぎると再びログインできる', r.ok, 'ok=' + r.ok + '（時間は DB で進めて確認）');
  for (let i = 0; i < 4; i++) await rpc('fr_login', { p_id: ID, p_password: PW2 });
  r = await rpc('fr_login', { p_id: ID, p_password: PW }); const r5 = await rpc('fr_login', { p_id: ID, p_password: PW2 });
  check('成功すると失敗回数がリセットされる', r.ok && r5.remaining === 4, '残り ' + r5.remaining);
  // registration flood from one address
  ipN = 3; let reg; for (let i = 0; i < 7; i++) reg = await rpc('fr_register', { p_id: 'flood_user_' + i, p_password: PW });
  check('同じ接続元からの大量登録を制限', !reg.ok && reg.error === 'TOO_MANY', reg.error);
  // direct table access as the public role
  ipN = 4; const c = await admin.connect(); let denied = false;
  try { await c.query('set role anon'); await c.query('select * from fr_private.users'); } catch (e) { denied = /permission denied/.test(e.message); } finally { await c.query('reset role'); c.release(); }
  check('外部用の権限では表を直接読めない', denied, denied ? 'permission denied' : '読めてしまった');
  check('別サイトからの呼び出しを許可（CORS ヘッダー）', r._acao === '*', 'Access-Control-Allow-Origin: ' + r._acao);
  // delete account
  r = await rpc('fr_delete_account', { p_token: tok2, p_password: PW2 });
  check('アカウント削除：まちがったパスワードでは消せない', !r.ok && r.error === 'BAD_CREDENTIALS', r.error);
  r = await rpc('fr_delete_account', { p_token: tok2, p_password: PW });
  db = await admin.query('select (select count(*) from fr_private.users where id_key=$1)::int u, (select count(*) from fr_private.scores)::int s, (select count(*) from fr_private.sessions s join fr_private.users u on u.id=s.user_id where u.id_key=$1)::int t', [ID]);
  check('アカウント削除：アカウント・記録・合言葉が消える', r.ok && db.rows[0].u === 0 && db.rows[0].s === 0 && db.rows[0].t === 0, JSON.stringify(db.rows[0]));
  r = await rpc('fr_login', { p_id: ID, p_password: PW }); check('削除後はログインできない', !r.ok && r.error === 'BAD_CREDENTIALS', r.error);
  r = await rpc('fr_register', { p_id: ID, p_password: PW }, '10.0.0.77'); check('削除した ID はまた登録できる', r.ok, 'ok=' + r.ok);
  await admin.query('truncate fr_private.users cascade; truncate fr_private.attempts'); await admin.end();
  for (const x of rows) console.log(x[0] + '| ' + x[1] + ' | ' + x[2]);
  const ng = rows.filter(x => x[0] !== 'OK ').length; console.log('\n合計 ' + rows.length + ' 件 / 失敗 ' + ng + ' 件'); process.exit(ng ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
