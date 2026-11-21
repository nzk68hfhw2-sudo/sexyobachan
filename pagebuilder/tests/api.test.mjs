// サーバー (API) のテスト。ダミーのアカウントを作って確かめます。
import { startBackend, startSite } from './server.mjs';
import { runner, ok, eq } from './run.mjs';

const R = runner('サーバーのテスト');
const LIM = { bcrypt: 4, postGap: 1, editGap: 0, cmtGap: 1, regPerHour: 100, maxPosts: 6 };
const b = await startBackend({ limits: LIM });
const call = (a, p = {}, ip = '10.0.0.1') => b.app.handle({ a, ...p }, ip);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (o = {}) => ({ kind: 'blog', title: 'テスト記事', body: 'ほんぶん', date: '2026-11-21', tags: ['てすと'], status: 'public', vis: 'public', ...o });
const PW = 'dummy-pass-123';
let A, B, pid;

console.log('■ 登録とログイン');
await R.t('新規登録ができる', async () => { A = await call('register', { id: 'test_alice', pw: PW }); ok(A.ok && A.token, 'token'); eq(A.me.admin, false, 'admin'); });
await R.t('パスワードは bcrypt のハッシュで保存され、平文はどこにも無い', async () => {
  const u = await b.store.get('user/test_alice', { type: 'json' });
  ok(/^\$2[aby]\$\d\d\$.{53}$/.test(u.pw), 'bcrypt 形式');
  const { blobs } = await b.store.list();
  for (const k of blobs) ok(!(await b.store.get(k.key)).includes(PW), '平文が ' + k.key + ' にある');
});
await R.t('同じIDは登録できない(重複チェック)', async () => { eq((await call('register', { id: 'test_alice', pw: PW })).err, 'id_taken', 'err'); eq((await call('register', { id: 'TEST_ALICE', pw: PW })).err, 'id_taken', '大文字でも同じ'); });
await R.t('短いパスワード(7文字)は登録できない', async () => { eq((await call('register', { id: 'test_short', pw: '1234567' })).err, 'pw_short', 'err'); });
await R.t('変なID(記号・短すぎ)は登録できない', async () => { for (const id of ['ab', 'a<b>c', 'あいう', '../x', 'a/b']) eq((await call('register', { id, pw: PW })).err, 'bad_id', id); });
await R.t('ログインができる', async () => { const r = await call('login', { id: 'test_alice', pw: PW }); ok(r.ok && r.token && r.token !== A.token, 'token'); });
await R.t('まちがったパスワードではログインできない', async () => { const r = await call('login', { id: 'test_alice', pw: 'wrong-password' }, '10.0.0.50'); eq(r.err, 'login_failed', 'err'); ok(!r.token, 'token なし'); });
await R.t('存在しないIDも同じエラー文(IDの有無が分からない)', async () => {
  const x = await call('login', { id: 'no_such_user', pw: PW }, '10.0.0.51'), y = await call('login', { id: 'test_alice', pw: 'bad' }, '10.0.0.51');
  eq(x.msg, y.msg, 'msg');
});
await R.t('5回まちがえるとロックされ、正しいパスワードでも入れない', async () => {
  for (let i = 0; i < 5; i++) eq((await call('login', { id: 'test_alice', pw: 'bad' + i }, '10.0.0.60')).err, 'login_failed', 'fail ' + i);
  eq((await call('login', { id: 'test_alice', pw: PW }, '10.0.0.60')).err, 'locked', 'locked');
  ok((await call('login', { id: 'test_alice', pw: PW }, '10.0.0.61')).ok, '別の場所の本人は入れる');
});
await R.t('Cookie なしでもログイン状態が保てる(合い言葉を毎回送る方式)', async () => { const r = await call('me', { t: A.token }); eq(r.me.id, 'test_alice', 'me'); });
await R.t('にせの合い言葉・合い言葉なしは拒否される', async () => {
  for (const t of [undefined, '', 'test_alice.' + 'x'.repeat(43), 'abc', { $ne: 1 }]) eq((await call('me', { t })).err, 'auth', String(t));
});
await R.t('ログアウトすると、その合い言葉は使えなくなる', async () => {
  const r = await call('login', { id: 'test_alice', pw: PW }); ok((await call('me', { t: r.token })).ok, 'before');
  await call('logout', { t: r.token }); eq((await call('me', { t: r.token })).err, 'auth', 'after');
});

console.log('■ 記事の作成・編集・削除');
await R.t('記事を作成できる', async () => { const r = await call('savePost', { t: A.token, post: post() }); ok(r.ok, r.msg); pid = r.post.p; });
await R.t('記事を編集できる', async () => {
  const r = await call('savePost', { t: A.token, post: post({ p: pid, title: 'なおした題名', tags: ['a', 'b'] }) }); ok(r.ok, r.msg);
  const g = await call('getPost', { u: 'test_alice', p: pid }); eq(g.post.title, 'なおした題名', 'title'); eq(g.post.tags.length, 2, 'tags');
});
await R.t('投稿の間隔制限がきく(続けて投稿できない)', async () => {
  eq((await call('savePost', { t: A.token, post: post({ title: 'すぐ2本目' }) })).err, 'rate', 'err');
  await sleep(1100); ok((await call('savePost', { t: A.token, post: post({ title: '待ってから2本目' }) })).ok, '待てばOK');
});
await R.t('文字数の上限がきく(本文4001字・題名61字・タグ6個・タグ16字)', async () => {
  await sleep(1100);
  eq((await call('savePost', { t: A.token, post: post({ body: 'あ'.repeat(4001) }) })).err, 'too_long', 'body');
  eq((await call('savePost', { t: A.token, post: post({ title: 'あ'.repeat(61) }) })).err, 'too_long', 'title');
  eq((await call('savePost', { t: A.token, post: post({ tags: ['1', '2', '3', '4', '5', '6'] }) })).err, 'bad', 'tags');
  eq((await call('savePost', { t: A.token, post: post({ tags: ['あ'.repeat(16)] }) })).err, 'too_long', 'tag len');
  ok((await call('savePost', { t: A.token, post: post({ body: 'あ'.repeat(4000), title: '上限ちょうど' }) })).ok, '4000字はOK');
});
await R.t('日記は日付つきで書け、同じ日に2つは作れない。変な日付は拒否', async () => {
  await sleep(1100);
  const r = await call('savePost', { t: A.token, post: post({ kind: 'diary', title: '', date: '2026-11-03' }) }); ok(r.ok, r.msg);
  await sleep(1100);
  eq((await call('savePost', { t: A.token, post: post({ kind: 'diary', title: '', date: '2026-11-03' }) })).err, 'dup', 'dup');
  eq((await call('savePost', { t: A.token, post: post({ kind: 'diary', date: '2026-02-31' }) })).err, 'bad', 'date');
  eq((await call('savePost', { t: A.token, post: post({ kind: 'diary', date: '<script>' }) })).err, 'bad', 'date2');
});
await R.t('1人あたりの記事数の上限がきく', async () => {
  let last;
  for (let i = 0; i < 6; i++) { await sleep(1050); last = await call('savePost', { t: A.token, post: post({ title: 'うめる' + i }) }); if (!last.ok) break; }
  eq(last.err, 'limit', 'err'); eq((await call('myPosts', { t: A.token })).posts.length, 6, '6件で止まる');
});
await R.t('記事を削除できる(一覧・新着からも消える)', async () => {
  const mine = (await call('myPosts', { t: A.token })).posts; const victim = mine.find((e) => e.title === '待ってから2本目');
  ok((await call('deletePost', { t: A.token, p: victim.p })).ok, 'delete');
  eq((await call('getPost', { u: 'test_alice', p: victim.p })).err, 'notfound', 'gone');
  ok(!(await call('feed')).posts.some((e) => e.p === victim.p), 'feed');
});

console.log('■ ほかの人からの操作');
await R.t('2人目のダミーアカウントを作る', async () => { B = await call('register', { id: 'test_bob', pw: PW }, '10.0.0.2'); ok(B.ok, B.msg); });
await R.t('ほかの人の記事は書き換えられない', async () => {
  const r = await call('savePost', { t: B.token, post: post({ p: pid, title: 'のっとり', body: 'かきかえ' }) }, '10.0.0.2'); eq(r.err, 'notfound', 'err');
  const r2 = await call('savePost', { t: B.token, u: 'test_alice', post: { ...post({ p: pid, title: 'のっとり' }), u: 'test_alice' } }, '10.0.0.2'); eq(r2.err, 'notfound', 'u を偽っても');
  eq((await call('getPost', { u: 'test_alice', p: pid })).post.title, 'なおした題名', '変わっていない');
});
await R.t('ほかの人の記事は削除できない', async () => { eq((await call('deletePost', { t: B.token, p: pid }, '10.0.0.2')).err, 'notfound', 'err'); ok((await call('getPost', { u: 'test_alice', p: pid })).ok, '残っている'); });
await R.t('ほかの人のプロフィールは書き換えられない', async () => {
  await call('savePage', { t: B.token, page: { u: 'test_alice', name: 'ボブ', bio: '', icon: '🐶', theme: 'sora', bg: '', fg: '', font: 'gothic', deco: 'line', vis: 'public' } }, '10.0.0.2');
  eq((await call('getPage', { u: 'test_alice' })).page.name, 'test_alice', 'alice のまま'); eq((await call('getPage', { u: 'test_bob' })).page.name, 'ボブ', 'bob が変わる');
});
await R.t('ログインしていないと書きこみ・いいね・コメントはできない', async () => {
  for (const a of ['savePost', 'savePage', 'deletePost', 'like', 'comment', 'deleteAccount', 'myPosts']) eq((await call(a, { u: 'test_alice', p: pid, post: post(), text: 'x' })).err, 'auth', a);
});

console.log('■ 公開範囲');
const setPost = (o) => call('savePost', { t: A.token, post: post({ p: pid, title: 'なおした題名', ...o }) });
const inFeed = async () => (await call('feed')).posts.some((e) => e.p === pid);
const inPage = async () => (await call('getPage', { u: 'test_alice', t: B.token })).posts.some((e) => e.p === pid);
await R.t('全体に公開: 新着に出て、だれでも読める', async () => { await setPost({}); ok(await inFeed(), 'feed'); ok(await inPage(), 'page'); ok((await call('getPost', { u: 'test_alice', p: pid })).ok, 'guest'); });
await R.t('URLを知っている人だけ: 新着・検索・一覧に出ないが、URLでは読める', async () => {
  await setPost({ vis: 'unlisted' }); ok(!(await inFeed()), 'feed'); ok(!(await inPage()), 'page');
  ok(!(await call('search', { q: 'なおした' })).posts.length, 'search'); ok((await call('getPost', { u: 'test_alice', p: pid, t: B.token })).ok, 'direct');
});
await R.t('自分だけ: ほかの人は読めず、本人は読める', async () => {
  await setPost({ vis: 'private' }); ok(!(await inFeed()), 'feed');
  eq((await call('getPost', { u: 'test_alice', p: pid, t: B.token })).err, 'notfound', 'bob'); eq((await call('getPost', { u: 'test_alice', p: pid })).err, 'notfound', 'guest');
  ok((await call('getPost', { u: 'test_alice', p: pid, t: A.token })).ok, 'owner');
  eq((await call('like', { u: 'test_alice', p: pid, t: B.token })).err, 'notfound', 'いいねも不可'); eq((await call('comment', { u: 'test_alice', p: pid, t: B.token, text: 'x' })).err, 'notfound', 'コメントも不可');
});
await R.t('下書き: ほかの人は読めず、公開に切り替えると読める', async () => {
  await setPost({ status: 'draft' }); eq((await call('getPost', { u: 'test_alice', p: pid, t: B.token })).err, 'notfound', 'draft'); ok(!(await inFeed()), 'feed');
  await setPost({ status: 'public' }); ok((await call('getPost', { u: 'test_alice', p: pid, t: B.token })).ok, 'public'); ok(await inFeed(), 'feed back');
});
await R.t('プロフィールの公開範囲(URL限定はカギが必要・自分だけは不可)', async () => {
  const base = { name: 'ありす', bio: 'じこしょうかい', icon: '🌸', theme: 'sakura', bg: '#ffffff', fg: '#222222', font: 'maru', deco: 'star' };
  const r = await call('savePage', { t: A.token, page: { ...base, vis: 'unlisted' } }); ok(r.ok, r.msg);
  eq((await call('getPage', { u: 'test_alice', t: B.token })).err, 'forbidden', 'カギなし'); eq((await call('getPage', { u: 'test_alice', key: 'wrongwrong' })).err, 'forbidden', 'ちがうカギ');
  ok((await call('getPage', { u: 'test_alice', key: r.page.key })).ok, '正しいカギ'); ok(!(await call('getPage', { u: 'test_alice', key: r.page.key })).page.key, 'カギは他人に返さない');
  ok(!(await call('feed')).pages.some((e) => e.u === 'test_alice'), '新着に出ない'); ok(!(await call('search', { q: 'ありす' })).users.length, '検索に出ない');
  await call('savePage', { t: A.token, page: { ...base, vis: 'private' } }); eq((await call('getPage', { u: 'test_alice', key: r.page.key })).err, 'forbidden', 'private');
  await call('savePage', { t: A.token, page: { ...base, vis: 'public' } }); ok((await call('getPage', { u: 'test_alice' })).ok, 'public'); ok((await call('search', { q: 'ありす' })).users.length === 1, '名前で検索');
});

console.log('■ 見る側の機能');
await R.t('タグとユーザー名で検索できる', async () => {
  ok((await call('search', { q: 'てすと' })).posts.some((e) => e.p === pid), 'tag'); ok((await call('search', { q: '#てすと', tagOnly: true })).posts.length > 0, '#tag');
  ok((await call('search', { q: 'test_bo' })).users.some((e) => e.u === 'test_bob'), 'user id');
});
await R.t('いいね(押す・取り消す・二重に数えない)', async () => {
  const a = await call('like', { t: B.token, u: 'test_alice', p: pid }); eq(a.liked, true, 'on'); eq(a.likes, 1, '1');
  const g = await call('getPost', { t: B.token, u: 'test_alice', p: pid }); eq(g.liked, true, 'liked'); eq(g.stat.likes, 1, 'count');
  const c = await call('like', { t: B.token, u: 'test_alice', p: pid }); eq(c.liked, false, 'off'); eq(c.likes, 0, '0');
});
await R.t('足あと(見られた数)が増える。自分で見ても増えない', async () => {
  const v0 = (await call('getPost', { u: 'test_alice', p: pid })).stat.views;
  await call('getPost', { u: 'test_alice', p: pid, t: B.token, count: true }); await call('getPost', { u: 'test_alice', p: pid, t: A.token, count: true });
  eq((await call('getPost', { u: 'test_alice', p: pid })).stat.views, v0 + 1, 'views');
});
let cid;
await R.t('ひとことコメント(投稿・100字まで・連投制限)', async () => {
  const r = await call('comment', { t: B.token, u: 'test_alice', p: pid, text: 'いいね!' }); ok(r.ok, r.msg); eq(r.comments.length, 1, '1件'); cid = r.comments[0].c;
  eq((await call('comment', { t: B.token, u: 'test_alice', p: pid, text: 'れんとう' })).err, 'rate', '連投');
  await sleep(1100); eq((await call('comment', { t: B.token, u: 'test_alice', p: pid, text: 'あ'.repeat(101) })).err, 'too_long', '101字');
});
await R.t('コメントは書いた人とページの持ち主だけが消せる', async () => {
  const C = await call('register', { id: 'test_carol', pw: PW }, '10.0.0.3');
  eq((await call('delComment', { t: C.token, u: 'test_alice', p: pid, c: cid })).err, 'forbidden', '他人は不可');
  ok((await call('delComment', { t: A.token, u: 'test_alice', p: pid, c: cid })).ok, '持ち主はOK');
  await call('deleteAccount', { t: C.token, pw: PW });
});

console.log('■ 見た目の設定の安全');
await R.t('色・テーマ・フォント・アイコンに変な値は入れられない', async () => {
  const base = { name: 'ありす', bio: '', icon: '🌸', theme: 'sakura', bg: '', fg: '', font: 'maru', deco: 'star', vis: 'public' };
  for (const bad of [{ bg: 'red;background:url(http://evil)' }, { fg: 'javascript:alert(1)' }, { theme: '"><script>' }, { font: 'x' }, { deco: 'x' }, { icon: '<img src=x onerror=alert(1)>' }, { icon: 'abc' }, { vis: 'everyone' }, { name: 'あ'.repeat(21) }, { bio: 'あ'.repeat(301) }])
    ok(!(await call('savePage', { t: A.token, page: { ...base, ...bad } })).ok, JSON.stringify(bad));
});
await R.t('本文にスクリプトを入れても「ただの文字」として保存される', async () => {
  const body = '<script>window.__xss=1</script><img src=x onerror="window.__xss=1">';
  const r = await call('savePost', { t: A.token, post: post({ p: pid, title: '<b>題名</b>', body }) }); ok(r.ok, r.msg);
  eq((await call('getPost', { u: 'test_alice', p: pid })).post.body, body, 'そのまま文字として返る(表示側で文字として出す)');
});

console.log('■ 通報と管理者');
let ADM;
await R.t('管理者IDは合言葉がないと登録できない(なりすまし防止)', async () => {
  eq((await call('register', { id: 'punpun2005', pw: PW }, '10.0.0.9')).err, 'admin_code', 'なし'); eq((await call('register', { id: 'punpun2005', pw: PW, adminCode: 'guess' }, '10.0.0.9')).err, 'admin_code', 'ちがう');
  ADM = await call('register', { id: 'punpun2005', pw: PW, adminCode: 'test-admin-code' }, '10.0.0.9'); ok(ADM.ok && ADM.me.admin, 'admin');
});
await R.t('ページ・記事・コメントを通報できる(ゲストも可)', async () => {
  await sleep(1100); const c = await call('comment', { t: B.token, u: 'test_alice', p: pid, text: 'わるいコメント' }); cid = c.comments[0].c;
  ok((await call('report', { t: B.token, u: 'test_alice', p: pid, reason: 'abuse', note: 'てすと' })).ok, 'post');
  ok((await call('report', { u: 'test_alice', p: '@', reason: 'personal' }, '10.0.0.77')).ok, 'page by guest');
  ok((await call('report', { t: A.token, u: 'test_alice', p: pid, c: cid, reason: 'spam' })).ok, 'comment');
  eq((await call('report', { t: B.token, u: 'test_alice', p: pid, reason: 'nazo' })).err, 'bad', '変な理由');
});
await R.t('管理者でない人は管理画面の操作ができない', async () => {
  eq((await call('adminReports', { t: B.token })).err, 'forbidden', 'list'); eq((await call('adminReports', {})).err, 'auth', 'guest');
  eq((await call('adminAct', { t: B.token, op: 'delete', u: 'test_alice', p: pid })).err, 'forbidden', 'act');
});
await R.t('管理者は通報の一覧を見られる', async () => {
  const r = await call('adminReports', { t: ADM.token }); eq(r.reports.length, 3, '3件'); ok(r.reports.every((x) => x.open), 'open');
  ok(r.reports.find((x) => x.kind === 'comment').snippet === 'わるいコメント', 'snippet');
});
await R.t('管理者が非表示にすると他人から見えなくなり、戻すと見える', async () => {
  const rep = (await call('adminReports', { t: ADM.token })).reports.find((x) => x.kind === 'post');
  ok((await call('adminAct', { t: ADM.token, op: 'hide', u: rep.u, p: rep.p, rkey: rep.rkey })).ok, 'hide');
  eq((await call('getPost', { u: 'test_alice', p: pid, t: B.token })).err, 'notfound', '他人'); ok(!(await inFeed()), 'feed');
  ok((await call('getPost', { u: 'test_alice', p: pid, t: A.token })).post.hidden, '本人には非表示と分かる');
  await setPost({}); eq((await call('getPost', { u: 'test_alice', p: pid, t: B.token })).err, 'notfound', '本人が保存し直しても非表示のまま');
  await call('adminAct', { t: ADM.token, op: 'show', u: rep.u, p: rep.p }); ok((await call('getPost', { u: 'test_alice', p: pid, t: B.token })).ok, 'show');
});
await R.t('管理者がコメントを非表示・削除できる', async () => {
  await call('adminAct', { t: ADM.token, op: 'hide', u: 'test_alice', p: pid, c: cid }); eq((await call('getPost', { u: 'test_alice', p: pid })).comments.length, 0, 'hidden');
  const rep = (await call('adminReports', { t: ADM.token })).reports.find((x) => x.kind === 'comment');
  await call('adminAct', { t: ADM.token, op: 'delete', u: 'test_alice', p: pid, c: cid, rkey: rep.rkey });
  const r = await call('adminReports', { t: ADM.token }); const again = r.reports.find((x) => x.kind === 'comment'); ok(again.gone && !again.open, 'gone+closed');
});
await R.t('管理者がプロフィールを非表示にできる / 記事を削除できる', async () => {
  await call('adminAct', { t: ADM.token, op: 'hide', u: 'test_alice', p: '@' }); eq((await call('getPage', { u: 'test_alice' })).err, 'forbidden', 'hidden');
  await call('adminAct', { t: ADM.token, op: 'show', u: 'test_alice', p: '@' }); ok((await call('getPage', { u: 'test_alice' })).ok, 'shown');
  const victim = (await call('myPosts', { t: A.token })).posts.find((e) => e.p !== pid);
  await call('adminAct', { t: ADM.token, op: 'delete', u: 'test_alice', p: victim.p }); eq((await call('getPost', { u: 'test_alice', p: victim.p, t: A.token })).err, 'notfound', 'deleted');
});

console.log('■ 別サイトからの通信(CORS・script タグ方式)');
const site = await startSite(b.app); const base = `http://127.0.0.1:${site.port}`;
await R.t('POST に CORS ヘッダーがつき、別サイトから読める', async () => {
  const r = await fetch(base + '/api', { method: 'POST', headers: { 'content-type': 'text/plain;charset=UTF-8', origin: 'https://gravity.example' }, body: JSON.stringify({ a: 'feed' }) });
  eq(r.headers.get('access-control-allow-origin'), '*', 'ACAO'); ok((await r.json()).ok, 'ok'); ok(!r.headers.get('set-cookie'), 'Cookie を使わない');
  eq((await fetch(base + '/api', { method: 'OPTIONS' })).status, 204, 'OPTIONS');
});
await R.t('script タグ方式(JSONP)でも同じ操作ができ、変な関数名は拒否', async () => {
  const d = Buffer.from(JSON.stringify({ a: 'feed' })).toString('base64url');
  const txt = await (await fetch(`${base}/api?cb=__kp_cb1&d=${d}`)).text(); ok(/^__kp_cb1\(\{"ok":true/.test(txt), txt.slice(0, 40));
  ok(!(await (await fetch(`${base}/api?cb=alert(1)//&d=${d}`)).text()).startsWith('alert'), 'bad cb');
});
await R.t('script タグ方式で長い本文を分割して送れる', async () => {
  await sleep(1100);
  const body = 'ながい本文です。'.repeat(450); const d = Buffer.from(JSON.stringify({ a: 'savePost', t: B.token, post: post({ title: '分割', body }) })).toString('base64url');
  const n = Math.ceil(d.length / 3000); ok(n > 3, 'chunks ' + n); let last;
  for (let i = 0; i < n; i++) last = await (await fetch(`${base}/api?cb=__kp_cb2&cid=abcdefghij012345&i=${i}&n=${n}&d=${d.substr(i * 3000, 3000)}`)).text();
  const o = JSON.parse(last.replace(/^__kp_cb2\(/, '').replace(/\);$/, '')); ok(o.ok, o.msg); eq(o.post.body, body, 'body');
  eq((await b.store.list({ prefix: 'chunk/' })).blobs.length, 0, '一時データは消える');
});
await site.stop();

console.log('■ パスワード変更とアカウント削除');
await R.t('パスワードを変えると古い合い言葉は使えなくなる', async () => {
  eq((await call('changePw', { t: B.token, pw: 'wrong', newPw: 'new-pass-456' })).err, 'login_failed', 'wrong old');
  const r = await call('changePw', { t: B.token, pw: PW, newPw: 'new-pass-456' }); ok(r.ok, r.msg);
  eq((await call('me', { t: B.token })).err, 'auth', 'old token'); B.token = r.token; ok((await call('login', { id: 'test_bob', pw: 'new-pass-456' }, '10.0.0.2')).ok, 'new pw');
});
await R.t('アカウント削除はパスワードが必要', async () => { eq((await call('deleteAccount', { t: A.token, pw: 'wrong' })).err, 'login_failed', 'err'); ok((await call('me', { t: A.token })).ok, 'still'); });
await R.t('アカウントを削除すると、ページ・記事・コメント・ログイン情報がすべて消える', async () => {
  await call('like', { t: A.token, u: 'test_bob', p: '@' }); await call('comment', { t: A.token, u: 'test_bob', p: '@', text: 'ありすのコメント' });
  eq((await call('getPage', { u: 'test_bob' })).comments.length, 1, 'comment exists');
  ok((await call('deleteAccount', { t: A.token, pw: PW })).ok, 'delete');
  eq((await call('me', { t: A.token })).err, 'auth', 'token'); eq((await call('login', { id: 'test_alice', pw: PW }, '10.0.0.88')).err, 'login_failed', 'login');
  eq((await call('getPage', { u: 'test_alice' })).err, 'notfound', 'page'); eq((await call('getPost', { u: 'test_alice', p: pid })).err, 'notfound', 'post');
  const f = await call('feed'); ok(!f.posts.some((e) => e.u === 'test_alice') && !f.pages.some((e) => e.u === 'test_alice'), 'feed');
  eq((await call('getPage', { u: 'test_bob' })).comments.length, 0, 'よそに書いたコメントも消える');
  const { blobs } = await b.store.list(); const left = blobs.map((x) => x.key).filter((k) => k.includes('test_alice') && !k.startsWith('rl/') && !k.startsWith('report/'));
  eq(left.length, 0, '残りデータ: ' + left.join(','));
});

await b.stop();
process.exit(R.done() ? 1 : 0);
