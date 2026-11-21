// 画面のテスト。iPhone の大きさの画面で、Gravity のローダーと同じ条件
// (別のサイトのページが script タグで game.js を読む)で操作します。
import { createRequire } from 'node:module';
import { startBackend, startSite } from './server.mjs';
import { startHost } from './host.mjs';
import { runner, ok, eq } from './run.mjs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const R = runner('画面のテスト');
const b = await startBackend({ limits: { bcrypt: 4, postGap: 0, editGap: 0, cmtGap: 0, regPerHour: 100 } });
const site = await startSite(b.app); const GAME = `http://127.0.0.1:${site.port}`;
const host = await startHost(GAME);
const cspHost = await startHost(GAME, { csp: `default-src 'none'; script-src 'unsafe-inline' ${GAME}; style-src 'unsafe-inline'; connect-src 'none'` });
const HOST = `http://localhost:${host.port}/`; // game.js とは別のサイト(オリジン)
const call = (a, p = {}) => b.app.handle({ a, ...p }, '10.1.1.1');
const br = await chromium.launch();
const PW = 'dummy-pass-123';
const XSS = ['<script>window.__xss=1</script>', '<img src=x onerror="window.__xss=1">', '<svg onload="window.__xss=1">', '<a href="javascript:window.__xss=1">おして</a>', '<iframe src="javascript:parent.__xss=1"></iframe>', '"><style>*{display:none}</style>', '**<b onmouseover="window.__xss=1">太字の中</b>**', '# <script>window.__xss=1</script>', '- <img src=x onerror=window.__xss=1>', '> <details open ontoggle=window.__xss=1>'].join('\n');

async function open(url, opt = {}) {
  const ctx = await br.newContext({ ...devices['iPhone 13'], ...opt });
  const pg = await ctx.newPage(); pg.errors = []; pg.dialogs = 0;
  pg.on('pageerror', (e) => pg.errors.push(e.message)); pg.on('dialog', (d) => { pg.dialogs++; d.dismiss(); });
  await pg.goto(url); await pg.waitForSelector('text=新着の記事');
  return pg;
}
const tabTo = (pg, name) => pg.locator('.tabs button', { hasText: name }).click();
async function register(pg, id) {
  await tabTo(pg, 'マイページ'); await pg.click('text=ログイン / 新規登録'); await pg.click('.seg >> text=新規登録');
  await pg.fill('[aria-label="ID"]', id); await pg.fill('[aria-label="パスワード"]', PW); await pg.fill('[aria-label="パスワード(もう一度)"]', PW);
  await pg.click('text=この内容で登録する'); await pg.waitForSelector('text=書いたもの');
}
async function login(pg, id, pw) {
  await tabTo(pg, 'マイページ'); await pg.click('text=ログイン / 新規登録');
  await pg.fill('[aria-label="ID"]', id); await pg.fill('[aria-label="パスワード"]', pw); await pg.click('text=ログインする');
}
// ユーザーが書いた内容から、危ないタグが1つも作られていないことを調べる
const dangerous = (pg) => pg.evaluate(() => {
  const r = document.getElementById('kojin-page-root').shadowRoot;
  return { xss: window.__xss || 0, bad: r.querySelectorAll('.main script, .main img:not(.gi), .main svg, .main iframe, .main a, .main style, .main details, .main b[onmouseover], .main [onerror], .main [onload]').length };
});

let pg = await open(HOST), postUrl;
console.log('■ 別サイトから読み込まれた状態(Gravity のローダーと同じ条件)');
await R.t('別サイトのページから script タグ1本で起動する', async () => {
  ok(new URL(pg.url()).origin !== GAME, '別オリジン'); ok(await pg.locator('#kojin-page-root').count() === 1, 'root');
  eq(await pg.locator('#kpl').isVisible(), false, 'ローダーの「よみこみ中」は消える');
});
await R.t('画面が iPhone の幅におさまり、横にはみ出さない', async () => {
  const w = await pg.evaluate(() => { const m = document.getElementById('kojin-page-root').shadowRoot.querySelector('.main'); return [m.scrollWidth, m.clientWidth, document.documentElement.scrollWidth, innerWidth]; });
  ok(w[0] <= w[1] && w[2] <= w[3], w.join(','));
});
await R.t('下のボタンは親指で押しやすい大きさ(高さ44px以上)', async () => {
  const hs = await pg.evaluate(() => [...document.getElementById('kojin-page-root').shadowRoot.querySelectorAll('.tabs button')].map((x) => x.getBoundingClientRect().height));
  ok(hs.length === 4 && hs.every((x) => x >= 44), hs.join(','));
});

await R.t('Gravity のボタンが重なる左上・右上に、こちらの表示を置かない', async () => {
  const r = await pg.evaluate(() => { const sr = document.getElementById('kojin-page-root').shadowRoot, b = (q) => sr.querySelector(q).getBoundingClientRect(); return { t: b('.top .ttl'), w: b('.top .who'), vw: innerWidth, logo: getComputedStyle(sr.querySelector('.top')).paddingLeft }; });
  ok(r.t.left >= 60 && r.w.left >= 60 && r.t.right <= r.vw - 170 && r.w.right <= r.vw - 170, JSON.stringify(r));
});
console.log('■ 登録とログイン(画面から)');
await R.t('新規登録ができ、マイページが開く', async () => { await register(pg, 'ui_alice'); ok(await pg.locator('.who').innerText().then((t) => t.includes('ui_alice')), 'who'); });
await R.t('書く画面に「本名、住所、学校名、連絡先は書かないでください」が出る', async () => {
  await pg.click('text=新しいブログ記事を書く'); await pg.waitForSelector('.warn'); ok((await pg.locator('.warn').innerText()).includes('本名、住所、学校名、連絡先は書かないでください'), 'warn');
});
await R.t('書きながらその場でプレビューが変わる(太字・見出し・箇条書き・引用・区切り線)', async () => {
  await pg.fill('[aria-label="題名"]', 'はじめての記事'); await pg.fill('[aria-label="タグ"]', 'にっき ねこ');
  await pg.fill('[aria-label="本文"]', '# おおみだし\n**ふとじ**です\n- ひとつ\n- ふたつ\n> いんよう\n---\nおわり');
  const c = await pg.evaluate(() => { const p = document.getElementById('kojin-page-root').shadowRoot.querySelector('.pad .pg'); return { h: p.querySelector('h3 .hd').textContent, s: p.querySelector('strong').textContent, li: p.querySelectorAll('li').length, q: p.querySelector('blockquote').textContent, hr: p.querySelectorAll('hr').length, t: p.querySelector('h1').textContent, tags: p.querySelectorAll('.tag').length }; });
  eq(c.h, 'おおみだし', 'h'); eq(c.s, 'ふとじ', 'strong'); eq(c.li, 2, 'li'); eq(c.q, 'いんよう', 'quote'); eq(c.hr, 1, 'hr'); eq(c.t, 'はじめての記事', 'title'); eq(c.tags, 2, 'tags');
});
await R.t('下書きで保存すると、ほかの人には見えない', async () => {
  await pg.click('text=💾 保存する'); await pg.waitForSelector('.badge.y >> text=下書き');
  ok(!(await call('feed')).posts.some((e) => e.title === 'はじめての記事'), 'feed');
});
await R.t('編集して「公開する」に切り替えると新着に出る', async () => {
  await pg.click('text=✏️ 編集する'); await pg.waitForSelector('[aria-label="題名"]'); await pg.fill('[aria-label="題名"]', 'なおした記事');
  await pg.click('.seg >> text=公開する'); await pg.click('text=💾 保存する'); await pg.waitForSelector('text=ひとことコメント'); await pg.waitForSelector('h1 >> text=なおした記事');
  ok((await call('feed')).posts.some((e) => e.title === 'なおした記事'), 'feed');
  postUrl = await pg.locator('input.code').inputValue(); ok(postUrl.startsWith(GAME + '/#p=ui_alice'), postUrl);
});
await R.t('Cookie を1つも使っていない', async () => { eq((await pg.context().cookies()).length, 0, 'cookies'); });
await R.t('読み込み直してもログインしたまま', async () => { await pg.reload(); await pg.waitForSelector('text=新着の記事'); ok((await pg.locator('.who').innerText()).includes('ui_alice'), 'who'); });
await R.t('ブラウザの保存が消えても、ログインし直せばデータは残っている', async () => {
  await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForSelector('text=新着の記事'); eq((await pg.locator('.who').innerText()).trim(), 'ゲスト', 'guest');
  await login(pg, 'ui_alice', PW); await pg.waitForSelector('text=書いたもの'); await pg.waitForSelector('.card >> text=なおした記事');
});
await R.t('まちがったパスワードではログインできず、エラーが出る', async () => {
  const p2 = await open(HOST); await login(p2, 'ui_alice', 'wrong-password'); await p2.waitForSelector('.err >> text=IDかパスワードがちがいます');
  eq((await p2.locator('.who').innerText()).trim(), 'ゲスト', 'guest'); await p2.context().close();
});
await R.t('日記: カレンダーの日付をタップして書ける', async () => {
  await pg.click('.seg >> text=日記カレンダー'); await pg.click('.cal button >> text="15"'); await pg.waitForSelector('[aria-label="日付"]');
  ok(/-15$/.test(await pg.inputValue('[aria-label="日付"]')), 'date'); await pg.fill('[aria-label="本文"]', 'きょうの日記'); await pg.click('.seg >> text=公開する'); await pg.click('text=💾 保存する');
  await pg.waitForSelector('text=きょうの日記'); await tabTo(pg, 'マイページ'); await pg.click('.seg >> text=日記カレンダー'); ok(await pg.locator('.cal button.has').count() === 1, 'マークがつく');
});
await R.t('デザイン: テーマ・色・フォント・飾り・アイコンを変えるとプレビューにすぐ反映され、保存できる', async () => {
  await pg.click('text=🎨 デザイン'); await pg.waitForSelector('text=テーマ (12種類)'); eq(await pg.locator('.grid:not(.em) button').count(), 12, 'themes');
  const look = () => pg.evaluate(() => { const p = document.getElementById('kojin-page-root').shadowRoot.querySelector('.pg'); return [p.style.backgroundColor, p.style.color, p.style.fontFamily, p.getAttribute('data-deco'), p.querySelector('.big').textContent].join('|'); });
  const before = await look();
  await pg.click('[aria-label="テーマ よる"]'); const a1 = await look(); ok(a1 !== before, 'theme');
  await pg.click('.sw >> [aria-label="#fff0f5"]'); await pg.click('.seg >> text=明朝'); await pg.click('.seg >> text=リボン'); await pg.click('.grid.em >> text=🐱');
  const a2 = await look(); ok(a2.includes('rgb(255, 240, 245)') && a2.includes('Mincho') && a2.includes('ribbon') && a2.includes('🐱'), a2);
  await pg.fill('[aria-label="名前"]', 'ありす'); eq(await pg.locator('.pg .nm').first().innerText(), 'ありす', 'name preview');
  await pg.click('text=💾 保存する'); await pg.waitForSelector('.toast >> text=保存しました');
  const saved = (await call('getPage', { u: 'ui_alice' })).page; eq(saved.theme + saved.bg + saved.font + saved.deco + saved.icon + saved.name, 'yoru#fff0f5minchoribbon🐱ありす', 'saved');
});

console.log('■ スクリプトを入れても動かない');
const alice = await call('login', { id: 'ui_alice', pw: PW });
await R.t('本文・題名・タグにスクリプトを入れて画面から投稿しても動かない', async () => {
  await tabTo(pg, 'マイページ'); await pg.click('text=新しいブログ記事を書く'); await pg.waitForSelector('[aria-label="題名"]');
  await pg.fill('[aria-label="題名"]', '<img src=x onerror="window.__xss=1">だいめい'); await pg.fill('[aria-label="タグ"]', '<b>x</b> <i/onclick=1>');
  await pg.fill('[aria-label="本文"]', XSS); await pg.waitForTimeout(300);
  let d = await dangerous(pg); eq(d.xss, 0, 'プレビューで実行されない'); eq(d.bad, 0, 'プレビューに危ないタグなし');
  await pg.click('.seg >> text=公開する'); await pg.click('text=💾 保存する'); await pg.waitForSelector('text=ひとことコメント'); await pg.waitForTimeout(500);
  d = await dangerous(pg); eq(d.xss, 0, '表示で実行されない'); eq(d.bad, 0, '表示に危ないタグなし'); eq(pg.dialogs, 0, 'ダイアログなし');
  ok((await pg.locator('.pg .body').innerText()).includes('<script>window.__xss=1</script>'), '文字としてそのまま見える');
});
await R.t('名前・自己紹介・コメントにスクリプトを入れても、ほかの人の画面で動かない', async () => {
  await call('savePage', { t: alice.token, page: { name: '<svg onload=__xss=1>', bio: XSS.slice(0, 290), icon: '🐱', theme: 'note', bg: '', fg: '', font: 'gothic', deco: 'line', vis: 'public' } });
  const bob = await call('register', { id: 'ui_bob', pw: PW }); await call('savePage', { t: bob.token, page: { name: '"><img src=x onerror=__xss=1>', bio: '', icon: '🐶', theme: 'sora', bg: '', fg: '', font: 'gothic', deco: 'line', vis: 'public' } });
  await call('comment', { t: bob.token, u: 'ui_alice', p: '@', text: '<img src=x onerror="window.__xss=1"><script>__xss=1</script>' });
  const v = await open(HOST);
  for (const step of [async () => {}, async () => { await v.click('.chip >> text=🐱'); await v.waitForSelector('text=ひとことコメント'); }, async () => { await v.locator('.pg .pl').first().click(); await v.waitForSelector('text=ひとことコメント'); },
    async () => { await tabTo(v, 'さがす'); await v.fill('[aria-label="さがす言葉"]', 'ui_'); await v.click('.b >> text=さがす'); await v.waitForSelector('text=ページ (2)'); }]) {
    await step(); await v.waitForTimeout(300); const d = await dangerous(v); eq(d.xss, 0, '実行されない'); eq(d.bad, 0, '危ないタグなし');
  }
  eq(v.dialogs, 0, 'dialog'); eq(v.errors.length, 0, v.errors.join()); await v.context().close();
});

console.log('■ 見る側・公開範囲・権限(画面から)');
let bobPg;
await R.t('ほかの人としてログインし、いいね・コメント・足あとが使える', async () => {
  bobPg = await open(HOST); await login(bobPg, 'ui_bob', PW); await bobPg.waitForSelector('text=書いたもの');
  await tabTo(bobPg, 'ホーム'); await bobPg.click('.card >> text=なおした記事'); await bobPg.waitForSelector('text=足あと 1');
  await bobPg.click('.like'); await bobPg.waitForSelector('.like.on >> text=いいね 1');
  await bobPg.fill('[aria-label="コメント"]', 'すてき!'); await bobPg.click('.b >> text=送る'); await bobPg.waitForSelector('.cm >> text=すてき!');
});
await R.t('ほかの人の記事には「編集する」ボタンが出ない', async () => { eq(await bobPg.locator('text=✏️ 編集する').count(), 0, 'no edit'); });
await R.t('通報ボタンから通報でき、管理者に届く', async () => {
  await bobPg.click('.soc >> text=通報'); await bobPg.click('.radio >> text=いやがらせ'); await bobPg.click('text=通報を送る'); await bobPg.waitForSelector('.toast >> text=通報を送りました');
  await bobPg.locator('.cm .lk', { hasText: '通報' }).first().click(); await bobPg.click('.radio >> text=宣伝'); await bobPg.click('text=通報を送る'); await bobPg.waitForSelector('.toast >> text=通報を送りました');
});
await R.t('公開範囲を「自分だけ」に切り替えると、ほかの人はURLでも開けない', async () => {
  const pid = decodeURIComponent(postUrl.split('#p=')[1]).split('/')[1];
  await tabTo(pg, 'マイページ'); await pg.click('.card >> text=なおした記事'); await pg.waitForSelector('[aria-label="題名"]'); await pg.click('.seg >> text=自分だけ'); await pg.click('text=💾 保存する'); await pg.waitForSelector('.badge >> text=自分だけ');
  await tabTo(bobPg, 'さがす'); await bobPg.fill('[aria-label="ページのコード"]', postUrl); await bobPg.click('.b >> text=ひらく'); await bobPg.waitForSelector('.err >> text=ページが見つかりません');
  await tabTo(bobPg, 'ホーム'); await bobPg.waitForSelector('text=新着の記事'); eq(await bobPg.locator('.card >> text=なおした記事').count(), 0, '新着から消える');
  // 「URLを知っている人だけ」に変えると、URLでは開けるが新着には出ない
  await pg.click('text=✏️ 編集する'); await pg.waitForSelector('[aria-label="題名"]'); await pg.click('.seg >> text=URLを知っている人だけ'); await pg.click('text=💾 保存する'); await pg.waitForSelector('.badge >> text=URLのみ');
  await tabTo(bobPg, 'さがす'); await bobPg.fill('[aria-label="ページのコード"]', postUrl); await bobPg.click('.b >> text=ひらく'); await bobPg.waitForSelector('h1 >> text=なおした記事');
  ok(!(await call('feed')).posts.some((e) => e.p === pid), 'feed');
});
await R.t('公開URL(#p=…)を直接開くと、その記事が開く', async () => { const ctx = await br.newContext({ ...devices['iPhone 13'] }); const v = await ctx.newPage(); await v.goto(postUrl); await v.waitForSelector('h1 >> text=なおした記事'); await ctx.close(); });
console.log('■ 管理画面');
await R.t('管理者は合言葉つきで登録でき、通報を見て非表示・削除できる', async () => {
  const a = await open(HOST); await tabTo(a, 'マイページ'); await a.click('text=ログイン / 新規登録'); await a.click('.seg >> text=新規登録');
  await a.fill('[aria-label="ID"]', 'punpun2005'); await a.fill('[aria-label="パスワード"]', PW); await a.fill('[aria-label="パスワード(もう一度)"]', PW);
  await a.click('text=この内容で登録する'); await a.waitForSelector('.err >> text=管理者の合言葉が必要です');
  await a.fill('[aria-label="管理者の合言葉"]', 'test-admin-code'); await a.click('text=この内容で登録する'); await a.waitForSelector('text=書いたもの');
  await tabTo(a, 'せってい'); await a.click('text=管理画面'); await a.waitForSelector('text=通報の一覧(未対応 2件)'); // 記事1件とコメント1件
  const card = a.locator('.card', { hasText: 'コメント' }).filter({ hasText: '未対応' }); ok((await card.innerText()).includes('すてき!'), '内容が見える');
  await card.locator('text=非表示にする').click(); await a.waitForSelector('.badge.y >> text=非表示中');
  await a.locator('.card', { hasText: '非表示中' }).locator('.b >> text=削除する').click(); await a.click('.sheet >> text=実行する'); await a.waitForSelector('text=通報の一覧(未対応 1件)');
  const d = await dangerous(a); eq(d.xss + d.bad, 0, '管理画面でもスクリプトは動かない'); await a.context().close();
});
await R.t('ふつうの人には管理画面のボタンが出ない', async () => { await tabTo(bobPg, 'せってい'); await bobPg.waitForSelector('text=ログアウト'); eq(await bobPg.locator('text=管理画面').count(), 0, 'no admin'); });

await R.t('記事を画面から削除できる', async () => {
  await pg.click('text=✏️ 編集する'); await pg.click('text=この記事を削除'); await pg.click('.sheet >> text=削除する'); await pg.waitForSelector('.toast >> text=削除しました');
  await pg.waitForSelector('text=書いたもの'); eq(await pg.locator('.card >> text=なおした記事').count(), 0, 'gone');
});

console.log('■ ログアウトとアカウント削除(画面から)');
await R.t('ログアウトできる', async () => { await bobPg.click('text=ログアウト'); await bobPg.waitForSelector('.toast >> text=ログアウトしました'); eq((await bobPg.locator('.who').innerText()).trim(), 'ゲスト', 'guest'); eq(await bobPg.evaluate(() => localStorage.getItem('kojin_page_token')), null, 'token removed'); });
await R.t('アカウントを完全に削除できる', async () => {
  await tabTo(pg, 'せってい'); await pg.click('text=アカウントを完全に削除'); await pg.fill('.sheet [aria-label="パスワード"]', PW); await pg.click('text=すべて削除する'); await pg.waitForSelector('.toast >> text=アカウントを削除しました');
  eq((await call('getPage', { u: 'ui_alice' })).err, 'notfound', 'page gone'); eq((await call('login', { id: 'ui_alice', pw: PW })).err, 'login_failed', 'login');
});
await R.t('ここまでの操作で画面のエラーは0件', async () => { eq(pg.errors.length + bobPg.errors.length, 0, [...pg.errors, ...bobPg.errors].join(' / ')); eq(pg.dialogs + bobPg.dialogs, 0, 'dialogs'); });
await pg.context().close(); await bobPg.context().close();

console.log('■ Gravity に投稿する・Gravity のアイコン');
await R.t('日記に「Gravityに投稿する」があり、URLなしの文章とカード画像が作られる', async () => {
  const c = await open(HOST); await register(c, 'ui_share'); await c.click('.seg >> text=日記カレンダー'); await c.click('.cal button >> text="10"');
  await c.fill('[aria-label="題名"]', 'はれの日'); await c.fill('[aria-label="本文"]', '# さんぽ\n**こうえん**にいった。\n- はな\n> きれい\n---\n<script>window.__xss=1</script>'); await c.click('.seg >> text=公開する'); await c.click('text=💾 保存する');
  await c.waitForSelector('text=ひとことコメント'); await c.click('text=📮 Gravityに投稿する'); await c.waitForSelector('.cardimg');
  const txt = await c.inputValue('[aria-label="投稿用の文章"]');
  ok(!/https?:\/\//.test(txt), 'URLをふくまない'); ok(txt.includes('の日記') && txt.includes('はれの日') && txt.includes('■ さんぽ') && txt.includes('こうえんにいった。') && txt.includes('・はな'), txt); ok(txt.includes('@ui_share をさがしてね'), '道しるべ');
  const im = await c.evaluate(() => { const i = document.getElementById('kojin-page-root').shadowRoot.querySelector('.cardimg'); return i.decode().then(() => [i.naturalWidth, i.naturalHeight, i.src.slice(0, 22)]); });
  eq(im.join(), '1080,1350,data:image/png;base64,', 'card'); eq((await dangerous(c)).xss, 0, 'xss'); eq(c.errors.length, 0, c.errors.join());
  await c.click('text=📋 文章をコピー'); await c.waitForSelector('.toast'); await c.context().close();
});
await R.t('ほかの人の日記には「Gravityに投稿する」が出ない', async () => { const v = await open(HOST); await v.click('.card >> text=はれの日'); await v.waitForSelector('text=ひとことコメント'); eq(await v.locator('text=Gravityに投稿する').count(), 0, 'none'); await v.context().close(); });
await R.t('Gravity がアイコンのURLをわたしていれば自動で読み取り、日記とカードに貼る', async () => {
  const gh = await startHost(GAME, { pre: `window.gravityUser={nickname:'x',profile:{avatarUrl:'${GAME}/test-icon.png?cors=1'}};` });
  const c = await open(`http://localhost:${gh.port}/`); await login(c, 'ui_share', PW); await c.waitForSelector('text=書いたもの');
  await c.click('.seg >> text=日記カレンダー'); await c.click('.cal button.has'); await c.waitForSelector('.pad .pg img.gi'); // 編集プレビューにデフォルトで貼られる
  await c.click('.tabs >> text=もどる'); await c.click('text=👀 ページを見る'); await c.click('.seg >> text=日記'); await c.click('.pg .pl >> text=はれの日'); await c.waitForSelector('.pl img.gi');
  await c.click('text=📮 Gravityに投稿する'); await c.waitForSelector('.cardimg'); await c.waitForSelector('.seg >> text=Gravityのアイコン'); eq(await c.locator('text=書き出せなかった').count(), 0, 'アイコン入りで書き出せた');
  const sent = JSON.stringify(await call('getPage', { u: 'ui_share' })) + JSON.stringify(await call('feed')); ok(!sent.includes('test-icon'), 'アイコンのURLはサーバーに送らない');
  await c.context().close(); await gh.stop();
});
await R.t('アイコン画像が書き出し禁止でも、絵文字に切りかえてカードを作れる。危ないURLは使わない', async () => {
  const gh = await startHost(GAME, { pre: `window.userInfo={avatar:'${GAME}/test-icon.png'};window.profileData={icon:'javascript:window.__xss=1'};` });
  const c = await open(`http://localhost:${gh.port}/`); await login(c, 'ui_share', PW); await c.waitForSelector('text=書いたもの');
  await c.click('.card >> text=はれの日').catch(() => {}); await c.click('.seg >> text=日記カレンダー'); await c.click('.cal button.has'); await c.click('.tabs >> text=もどる');
  await c.click('text=👀 ページを見る'); await c.click('.seg >> text=日記'); await c.click('.pg .pl >> text=はれの日'); await c.click('text=📮 Gravityに投稿する'); await c.waitForSelector('.cardimg'); await c.waitForSelector('text=書き出せなかった');
  eq((await dangerous(c)).xss, 0, 'xss'); await c.context().close(); await gh.stop();
});
await R.t('アイコンが読み取れない場所では絵文字を使い、読み取りのようすを確認できる', async () => {
  const c = await open(HOST); await tabTo(c, 'せってい'); await c.waitForSelector('text=いまの場所からは読み取れませんでした'); await c.click('text=読み取りのようすを見る');
  ok((await c.inputValue('[aria-label="読み取りのようす"]')).includes('Gravityアイコン: 見つかりません'), 'diag'); await c.context().close();
});

console.log('■ fetch が禁止された場所(きびしい条件)と、サイトを直接開いた場合');
await R.t('fetch が禁止されていても script タグ方式に自動で切りかわり、登録・長文の投稿・表示ができる', async () => {
  const c = await open(`http://localhost:${cspHost.port}/`); await register(c, 'ui_csp');
  await c.click('text=新しいブログ記事を書く'); await c.fill('[aria-label="題名"]', 'きびしい場所から'); const long = 'ながい文。'.repeat(700);
  await c.fill('[aria-label="本文"]', long); await c.click('.seg >> text=公開する'); await c.click('text=💾 保存する'); await c.waitForSelector('h1 >> text=きびしい場所から');
  eq((await c.locator('.pg .body').innerText()).trim(), long, 'body'); await tabTo(c, 'せってい'); await c.waitForSelector('text=通信: jsonp'); await c.context().close();
});
await R.t('Netlify のURLを直接開いても動く(index.html)', async () => { const d = await open(GAME + '/'); await d.waitForSelector('.card >> text=きびしい場所から'); await tabTo(d, 'せってい'); await d.waitForSelector('text=通信: fetch'); await d.context().close(); });
await R.t('パソコンなど広い画面でも表示がくずれない', async () => {
  const ctx = await br.newContext({ viewport: { width: 1280, height: 800 } }); const d = await ctx.newPage(); await d.goto(HOST); await d.waitForSelector('text=新着の記事');
  ok(await d.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow'); await ctx.close();
});

await br.close(); await host.stop(); await cspHost.stop(); await site.stop(); await b.stop();
process.exit(R.done() ? 1 : 0);
