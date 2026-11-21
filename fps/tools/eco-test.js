// Server-side economy tests (coins, shop, equip, loadout, match rewards, anti-cheat) through tools/api-shim.js.
// usage: NODE_PATH=<dir with pg> node tools/eco-test.js
const { Pool } = require('pg');
const admin = new Pool({ host: '127.0.0.1', port: 54329, user: 'postgres', database: 'postgres' });
const API = 'http://127.0.0.1:8094'; const rows = []; let ipN = 50;
const check = (n, p, d) => rows.push((p ? 'OK ' : 'NG ') + '| ' + n + ' | ' + (d == null ? '' : d));
async function rpc(fn, args) {
  const r = await fetch(API + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: 'test-publishable-key', 'x-forwarded-for': '10.1.0.' + ipN }, body: JSON.stringify(args) });
  return r.json();
}
const age = (id, secs) => admin.query("update fr_private.matches set started_at = now() - ($2 || ' seconds')::interval where id = $1", [id, String(secs)]);
const END = (tok, match, o) => rpc('fr_match_end', Object.assign({ p_token: tok, p_match: match, p_mode: 'tdm', p_kills: 0, p_heads: 0, p_streak: 0, p_win: false, p_draw: false, p_wave: 0, p_score: 0, p_acc: 0, p_time: 0 }, o));
(async () => {
  await admin.query('truncate fr_private.users cascade; truncate fr_private.attempts');
  const PW = 'Dummy-Eco-Pass-2468'; let r = await rpc('fr_register', { p_id: 'dummy_eco_01', p_password: PW }); const tok = r.token;
  r = await rpc('fr_profile', { p_token: tok });
  check('新規アカウントの初期状態（コイン0・無料武器4つ）', r.ok && r.coins === 0 && r.owned.length === 0 && r.loadout.join() === 'ar,pistol,shotgun,sniper' && r.daily === true, 'coins=' + r.coins);
  r = await rpc('fr_profile', { p_token: 'f'.repeat(64) }); check('ログインなしでは持ち物を読めない', r.error === 'NOT_LOGGED_IN', r.error);
  r = await rpc('fr_claim_daily', { p_token: tok }); check('毎日のログインボーナス +100', r.ok && r.coins === 100 && r.daily === false, 'coins=' + r.coins);
  r = await rpc('fr_claim_daily', { p_token: tok }); check('同じ日に2回目は受け取れない', r.error === 'ALREADY', r.error);
  await admin.query("update fr_private.users set last_daily = last_daily - 1"); r = await rpc('fr_claim_daily', { p_token: tok }); check('次の日にはまた受け取れる', r.ok && r.coins === 200, 'coins=' + r.coins + '（日付は DB で進めて確認）');
  // match rewards
  r = await rpc('fr_match_start', { p_token: tok, p_mode: 'tdm' }); let m = r.match; check('試合開始で試合券を発行', r.ok && /^[0-9a-f-]{36}$/.test(m), 'ok');
  r = await END(tok, m, { p_kills: 5, p_streak: 3, p_win: true }); check('開始から20秒未満の結果は報酬なし', r.error === 'TOO_FAST', r.error);
  r = await END(tok, m, { p_kills: 5, p_streak: 3, p_win: true }); check('同じ試合券は2回使えない', r.error === 'BAD_MATCH', r.error);
  m = (await rpc('fr_match_start', { p_token: tok, p_mode: 'tdm' })).match; await age(m, 240);
  r = await END(tok, m, { p_kills: 12, p_heads: 4, p_streak: 5, p_win: true });
  check('チーム戦勝利の報酬をサーバーが計算（キル120＋連続50＋勝利150）', r.ok && r.reward.coins === 320 && r.reward.kills === 120 && r.reward.streak === 50 && r.reward.finish === 150 && r.coins === 520 && r.xp === 220 && r.wins === 1, JSON.stringify(r.reward) + ' 所持=' + r.coins);
  m = (await rpc('fr_match_start', { p_token: tok, p_mode: 'tdm' })).match; await age(m, 60);
  r = await END(tok, m, { p_kills: 150, p_streak: 150, p_win: true }); check('時間に対してありえないキル数は拒否', r.error === 'BAD_RESULT', r.error);
  r = await rpc('fr_profile', { p_token: tok }); check('拒否された結果ではコインが増えない', r.coins === 520, 'coins=' + r.coins);
  r = await END(tok, 'local', { p_kills: 5 }); check('試合券なしの結果は拒否', r.error === 'BAD_MATCH', r.error);
  m = (await rpc('fr_match_start', { p_token: tok, p_mode: 'survival' })).match; await age(m, 300);
  r = await END(tok, m, { p_mode: 'tdm', p_kills: 3 }); check('モードをすりかえた結果は拒否', r.error === 'BAD_MATCH', r.error);
  m = (await rpc('fr_match_start', { p_token: tok, p_mode: 'survival' })).match; await age(m, 300);
  r = await END(tok, m, { p_mode: 'survival', p_kills: 20, p_streak: 2, p_wave: 4, p_score: 3456, p_acc: 40, p_time: 300 });
  check('サバイバルの報酬（キル200＋連続10＋3ウェーブ75）とベスト記録', r.ok && r.reward.coins === 285 && r.best === 3456 && r.rank === 1 && r.coins === 805, JSON.stringify(r.reward) + ' best=' + r.best);
  m = (await rpc('fr_match_start', { p_token: tok, p_mode: 'tdm' })).match; await age(m, 600);
  r = await END(tok, m, { p_kills: 200, p_streak: 60, p_win: true }); check('1試合の報酬には上限（キル60まで）', r.ok && r.reward.coins === 900 && r.reward.kills === 600, JSON.stringify(r.reward));
  await admin.query("update fr_private.users set earned_today = 7950"); m = (await rpc('fr_match_start', { p_token: tok, p_mode: 'tdm' })).match; await age(m, 200);
  const before = (await rpc('fr_profile', { p_token: tok })).coins; r = await END(tok, m, { p_kills: 10, p_win: true }); check('1日にもらえるコインの上限（8000）', r.ok && r.reward.coins === 50 && r.coins === before + 50, '+' + r.reward.coins);
  // shop
  await admin.query("update fr_private.users set coins = 1000");
  r = await rpc('fr_buy', { p_token: tok, p_item: 'w_rocket' }); check('コインが足りないと買えない', r.error === 'NO_COINS', r.error);
  r = await rpc('fr_buy', { p_token: tok, p_item: 'w_smg' }); check('武器を購入（800コイン引かれる）', r.ok && r.coins === 200 && r.owned.includes('w_smg'), 'coins=' + r.coins);
  r = await rpc('fr_buy', { p_token: tok, p_item: 'w_smg' }); check('同じ物は2回買えない', r.error === 'OWNED', r.error);
  r = await rpc('fr_buy', { p_token: tok, p_item: 'w_ar' }); const r2 = await rpc('fr_buy', { p_token: tok, p_item: 'x_nothing' }); check('無料の物・存在しない物は購入できない', r.error === 'BAD_ITEM' && r2.error === 'BAD_ITEM', r.error + '/' + r2.error);
  const both = await Promise.all([rpc('fr_buy', { p_token: tok, p_item: 'h_cap' }), rpc('fr_buy', { p_token: tok, p_item: 'h_cap' })]); r = await rpc('fr_profile', { p_token: tok });
  check('同時に2回押しても1回分しか引かれない', both.filter(x => x.ok).length === 1 && r.coins === 0, '成功 ' + both.filter(x => x.ok).length + ' 回　coins=' + r.coins);
  await admin.query("update fr_private.users set coins = 150"); const two = await Promise.all([rpc('fr_buy', { p_token: tok, p_item: 't_red' }), rpc('fr_buy', { p_token: tok, p_item: 't_green' })]); r = await rpc('fr_profile', { p_token: tok });
  check('同時に別の物を買ってもコインはマイナスにならない', two.filter(x => x.ok).length === 1 && r.coins === 0, '成功 ' + two.filter(x => x.ok).length + ' 回　coins=' + r.coins);
  r = await rpc('fr_equip', { p_token: tok, p_slot: 'hat', p_item: 'h_crown' }); check('持っていない物は装備できない', r.error === 'NOT_OWNED', r.error);
  r = await rpc('fr_equip', { p_token: tok, p_slot: 'skin', p_item: 'h_cap' }); check('種類のちがう枠には装備できない', r.error === 'BAD_ITEM', r.error);
  r = await rpc('fr_equip', { p_token: tok, p_slot: 'hat', p_item: 'h_cap' }); const av = await rpc('fr_equip', { p_token: tok, p_slot: 'avatar', p_item: '5' });
  check('買った物を装備（アカウントに保存）', r.ok && av.equipped.hat === 'h_cap' && av.equipped.avatar === 5, JSON.stringify(av.equipped));
  r = await rpc('fr_set_loadout', { p_token: tok, p_weapons: ['ar', 'smg', 'rocket'] }); check('持っていない武器は持っていけない', r.error === 'BAD_LOADOUT', r.error);
  r = await rpc('fr_set_loadout', { p_token: tok, p_weapons: ['ar', 'pistol', 'shotgun', 'sniper', 'smg'] }); const dup = await rpc('fr_set_loadout', { p_token: tok, p_weapons: ['ar', 'ar'] }); const none = await rpc('fr_set_loadout', { p_token: tok, p_weapons: [] });
  check('武器は1〜4個・重複なしだけ', r.error === 'BAD_LOADOUT' && dup.error === 'BAD_LOADOUT' && none.error === 'BAD_LOADOUT', r.error);
  r = await rpc('fr_set_loadout', { p_token: tok, p_weapons: ['smg', 'sniper', 'pistol'] }); check('持っていく武器を保存', r.ok && r.loadout.join() === 'smg,sniper,pistol', r.loadout && r.loadout.join());
  r = await rpc('fr_login', { p_id: 'dummy_eco_01', p_password: PW }); r = await rpc('fr_profile', { p_token: r.token });
  check('ログインし直してもコイン・持ち物・装備が残る', r.ok && r.owned.includes('w_smg') && r.owned.includes('h_cap') && r.equipped.hat === 'h_cap' && r.loadout[0] === 'smg', 'owned=' + r.owned.join(','));
  r = await rpc('fr_leaderboard_tdm', {}); const lb = await rpc('fr_leaderboard', {}); check('チーム戦の勝敗ランキング', r.ok && r.rows[0].id === 'dummy_eco_01' && r.rows[0].wins === 3 && lb.rows[0].lv >= 1, JSON.stringify(r.rows[0]));
  const c = await admin.connect(); let denied = 0;
  try { await c.query('set role anon'); for (const q of ["update fr_private.users set coins = 999999", "select * from fr_private.inventory", "insert into fr_private.inventory values (gen_random_uuid(), 'w_rocket')", "select fr_private.profile(gen_random_uuid())"]) { try { await c.query(q); } catch (e) { if (/permission denied/.test(e.message)) denied++; } } } finally { await c.query('reset role'); c.release(); }
  check('外部用の権限ではコインや持ち物の表を直接さわれない', denied === 4, denied + ' / 4 件拒否');
  r = await rpc('fr_delete_account', { p_token: tok, p_password: PW }); const left = await admin.query('select (select count(*) from fr_private.inventory)::int i, (select count(*) from fr_private.matches)::int m');
  check('アカウント削除でコイン・持ち物・試合記録も消える', r.ok && left.rows[0].i === 0 && left.rows[0].m === 0, JSON.stringify(left.rows[0]));
  await admin.query('truncate fr_private.users cascade; truncate fr_private.attempts'); await admin.end();
  console.log(rows.join('\n')); const ng = rows.filter(x => x.startsWith('NG')).length; console.log('\n合計 ' + rows.length + ' 件 / 失敗 ' + ng + ' 件'); process.exit(ng ? 1 : 0);
})().catch(e => { console.log(rows.join('\n')); console.error(e); process.exit(2); });
