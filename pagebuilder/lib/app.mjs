// こじんページビルダー サーバー本体
// すべての保存は「store」(Netlify Blobs) を通ります。パスワードは bcrypt のハッシュだけを保存します。
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';

export const THEMES = ['note', 'sakura', 'sora', 'mori', 'yoru', 'lemon', 'mint', 'candy', 'retro', 'sumi', 'sunset', 'galaxy'];
export const FONTS = ['gothic', 'mincho', 'maru', 'kyokasho', 'pop', 'mono'];
export const DECOS = ['line', 'marker', 'bar', 'kakko', 'flower', 'dots', 'ribbon', 'star'];
const REASONS = ['personal', 'abuse', 'adult', 'spam', 'other'];

export const DEFAULT_LIMITS = {
  pwMin: 8, pwMax: 72, titleMax: 60, bodyMax: 4000, bioMax: 300, nameMax: 20, cmtMax: 100,
  tagMax: 5, tagLen: 15, maxPosts: 100,
  postGap: 20, editGap: 2, cmtGap: 10, // 秒
  loginFails: 5, loginWin: 900, regPerHour: 5, bcrypt: 10, sessionDays: 30,
};

// Netlify Blobs の store を、このアプリが使う小さな形にそろえる
export function blobsAdapter(s) {
  return {
    get: (k) => s.get(k, { type: 'json' }),
    async getE(k) { const r = await s.getWithMetadata(k, { type: 'json' }); return r ? { v: r.data, etag: r.etag } : null; },
    async set(k, v, o) { const r = await s.setJSON(k, v, o); return !r || r.modified !== false; },
    del: (k) => s.delete(k),
    async list(prefix) { const r = await s.list({ prefix }); return r.blobs.map((b) => b.key); },
  };
}

class E extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const now = () => Date.now();
const sha = (s) => createHash('sha256').update(String(s)).digest('hex');
const rid = (n) => randomBytes(n).toString('base64url');
const ID_RE = /^[a-z0-9_]{3,20}$/;
const PID_RE = /^[A-Za-z0-9_-]{8,20}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const len = (s) => [...s].length;

function text(v, max, label, multi) {
  let s = typeof v === 'string' ? v : '';
  s = s.replace(/\r\n?/g, '\n').replace(/[‪-‮⁦-⁩]/g, '');
  s = multi ? s.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '') : s.replace(/[\u0000-\u001f\u007f]/g, ' ');
  s = s.trim();
  if (len(s) > max) throw new E('too_long', `${label}は${max}文字までです`);
  return s;
}
function oneOf(v, list, label) { if (!list.includes(v)) throw new E('bad', `${label}がただしくありません`); return v; }
function validDate(d) {
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(d + 'T00:00:00Z');
  return !isNaN(t) && t.toISOString().slice(0, 10) === d && d >= '1970-01-01' && d <= '2099-12-31';
}

export function createApp(S, opts = {}) {
  const L = { ...DEFAULT_LIMITS, ...(opts.limits || {}) };
  const ADMIN_ID = (opts.adminId || 'punpun2005').toLowerCase();
  const ADMIN_CODE = opts.adminSetupCode || '';
  const isAdmin = (u) => !!u && u === ADMIN_ID;
  const pk = (p) => (p === '@' ? 'profile' : p);

  async function mutate(key, def, fn) {
    for (let i = 0; i < 8; i++) {
      const cur = await S.getE(key);
      const v = fn(cur ? cur.v : structuredClone(def));
      if (v === undefined) return cur ? cur.v : def;
      if (await S.set(key, v, cur ? { onlyIfMatch: cur.etag } : { onlyIfNew: true })) return v;
    }
    throw new E('busy', 'こみあっています。少し待ってもう一度ためしてください');
  }
  async function rate(key, max, winSec) {
    let ok = true;
    await mutate('rl/' + key, { n: 0, r: 0 }, (v) => {
      const t = now();
      if (t > v.r) { v.n = 0; v.r = t + winSec * 1000; }
      if (v.n >= max) { ok = false; return undefined; }
      v.n++; return v;
    });
    return ok;
  }
  async function delPrefix(prefix) { const ks = await S.list(prefix); await Promise.all(ks.map((k) => S.del(k))); }

  async function auth(t) {
    if (typeof t !== 'string') return null;
    const m = /^([a-z0-9_]{3,20})\.([A-Za-z0-9_-]{20,64})$/.exec(t);
    if (!m) return null;
    const s = await S.get(`sess/${m[1]}/${sha(m[2])}`);
    if (!s || s.exp < now()) return null;
    return m[1];
  }
  async function need(b) { const u = await auth(b.t); if (!u) throw new E('auth', 'ログインしてください'); return u; }
  async function newSession(uid) {
    const r = rid(32);
    await S.set(`sess/${uid}/${sha(r)}`, { exp: now() + L.sessionDays * 86400000 });
    return `${uid}.${r}`;
  }
  const meOf = (u) => ({ id: u, admin: isAdmin(u) });

  function pwCheck(pw) {
    if (typeof pw !== 'string' || pw.length < L.pwMin) throw new E('pw_short', `パスワードは${L.pwMin}文字以上にしてください`);
    if (pw.length > L.pwMax) throw new E('pw_long', `パスワードは${L.pwMax}文字までです`);
  }
  async function verifyPw(uid, pw) {
    const user = await S.get('user/' + uid);
    const ok = await bcrypt.compare(typeof pw === 'string' ? pw.slice(0, 200) : '', user ? user.pw : '$2b$10$CwTycUXWue0Thq9StjUM0uJ8rYyYfQ3lqfQyZ5c1o9nN1wq5F0pXe');
    return user && ok ? user : null;
  }

  // ---- 見える・見えないの判定 ----
  function pageVisible(page, viewer, key) {
    if (viewer === page.u || isAdmin(viewer)) return true;
    if (page.hidden) return false;
    if (page.vis === 'public') return true;
    return page.vis === 'unlisted' && typeof key === 'string' && key === page.key;
  }
  function postVisible(post, viewer) {
    if (viewer === post.u || isAdmin(viewer)) return true;
    return !post.hidden && post.status === 'public' && post.vis !== 'private';
  }
  const listable = (m) => !m.hidden && m.status === 'public' && m.vis === 'public';

  async function target(viewer, b) {
    const u = b.u, p = b.p;
    if (typeof u !== 'string' || !ID_RE.test(u) || (p !== '@' && !(typeof p === 'string' && PID_RE.test(p)))) throw new E('bad', 'ページの指定がただしくありません');
    const page = await S.get('page/' + u);
    if (!page) throw new E('notfound', 'ページが見つかりません');
    let post = null;
    if (p === '@') {
      if (!pageVisible(page, viewer, b.key)) throw new E('forbidden', 'このページは公開されていません');
    } else {
      post = await S.get(`post/${u}/${p}`);
      if (!post || !postVisible(post, viewer)) throw new E('notfound', 'ページが見つかりません');
    }
    return { page, post, owner: viewer === u, admin: isAdmin(viewer) };
  }

  const metaOf = (post) => ({
    p: post.p, kind: post.kind, title: post.title, date: post.date, tags: post.tags, status: post.status,
    vis: post.vis, hidden: !!post.hidden, at: post.at, up: post.up, x: [...post.body.replace(/\*\*/g, '').replace(/^\s*(#{1,2}|[-・>])\s*/gm, '').replace(/\n+/g, ' ').trim()].slice(0, 70).join(''),
  });
  async function syncPost(post) {
    const m = metaOf(post);
    await mutate('pidx/' + post.u, [], (a) => { a = a.filter((e) => e.p !== post.p); a.push(m); return a; });
    await mutate('idx/posts', [], (a) => {
      const had = a.some((e) => e.u === post.u && e.p === post.p);
      if (!had && !listable(m)) return undefined;
      a = a.filter((e) => !(e.u === post.u && e.p === post.p));
      if (listable(m)) a.unshift({ u: post.u, p: m.p, kind: m.kind, title: m.title, date: m.date, tags: m.tags, up: m.up, x: m.x });
      a.sort((x, y) => y.up - x.up);
      return a.slice(0, 3000);
    });
  }
  async function syncUser(page) {
    await mutate('idx/users', {}, (o) => { o[page.u] = { n: page.name, i: page.icon, th: page.theme, v: page.vis, h: !!page.hidden, up: page.up }; return o; });
  }
  async function removePost(u, p) {
    await S.del(`post/${u}/${p}`);
    await mutate('pidx/' + u, [], (a) => a.filter((e) => e.p !== p));
    await mutate('idx/posts', [], (a) => (a.some((e) => e.u === u && e.p === p) ? a.filter((e) => !(e.u === u && e.p === p)) : undefined));
    await Promise.all([S.del(`stat/${u}/${p}`), S.del(`cmt/${u}/${p}`)]);
  }
  async function removeComment(u, p, c) {
    let by = null;
    await mutate(`cmt/${u}/${pk(p)}`, [], (a) => { const f = a.find((e) => e.c === c); if (!f) return undefined; by = f.by; return a.filter((e) => e.c !== c); });
    if (by) {
      await S.del(`mycmt/${by}/${c}`);
      await mutate(`stat/${u}/${pk(p)}`, { likes: 0, views: 0, cmts: 0 }, (s) => { s.cmts = Math.max(0, (s.cmts || 0) - 1); return s; });
    }
    return by;
  }
  async function wipeUser(u) {
    for (const k of await S.list(`mycmt/${u}/`)) {
      const ptr = await S.get(k);
      if (ptr && ptr.u !== u) await removeComment(ptr.u, ptr.p, k.split('/').pop()).catch(() => {});
    }
    await Promise.all([`post/${u}/`, `stat/${u}/`, `cmt/${u}/`, `sess/${u}/`, `like/${u}/`, `mycmt/${u}/`].map(delPrefix));
    await mutate('idx/posts', [], (a) => a.filter((e) => e.u !== u));
    await mutate('idx/users', {}, (o) => { delete o[u]; return o; });
    await Promise.all([S.del('pidx/' + u), S.del('page/' + u), S.del('user/' + u)]);
  }
  async function social(viewer, u, p, tg) {
    const [stat, cm, liked, users] = await Promise.all([
      S.get(`stat/${u}/${pk(p)}`), S.get(`cmt/${u}/${pk(p)}`),
      viewer ? S.get(`like/${viewer}/${u}/${pk(p)}`) : null, S.get('idx/users'),
    ]);
    const us = users || {};
    const comments = (cm || []).filter((c) => !c.hidden || tg.admin).slice(-60).map((c) => ({
      c: c.c, by: c.by, name: us[c.by] ? us[c.by].n : c.by, icon: us[c.by] ? us[c.by].i : '🙂', text: c.text, at: c.at,
      hidden: !!c.hidden, canDel: !!viewer && (c.by === viewer || tg.owner || tg.admin),
    }));
    return { stat: { likes: 0, views: 0, cmts: 0, ...(stat || {}) }, liked: !!liked, comments };
  }
  const pubPage = (page, full) => {
    const o = { u: page.u, name: page.name, bio: page.bio, icon: page.icon, theme: page.theme, bg: page.bg, fg: page.fg, font: page.font, deco: page.deco, vis: page.vis, hidden: !!page.hidden, up: page.up };
    if (full) o.key = page.key;
    return o;
  };
  // ほかの人に見せる「作者の見た目」(プロフィール本文はふくめない)
  const design = (page) => ({ u: page.u, name: page.name, icon: page.icon, theme: page.theme, bg: page.bg, fg: page.fg, font: page.font, deco: page.deco });

  const A = Object.create(null);

  A.register = async (b, ctx) => {
    const id = typeof b.id === 'string' ? b.id.trim().toLowerCase() : '';
    if (!ID_RE.test(id)) throw new E('bad_id', 'IDは半角の英小文字・数字・_ で3〜20文字にしてください');
    pwCheck(b.pw);
    if (b.pw.toLowerCase() === id) throw new E('pw_weak', 'IDと同じパスワードは使えません');
    if (id === ADMIN_ID) {
      if (!ADMIN_CODE || typeof b.adminCode !== 'string' || sha(b.adminCode) !== sha(ADMIN_CODE)) throw new E('admin_code', 'このIDの登録には管理者の合言葉が必要です');
    }
    if (await S.get('user/' + id)) throw new E('id_taken', 'このIDはもう使われています');
    if (!(await rate(`reg/${ctx.iph}`, L.regPerHour, 3600))) throw new E('rate', '登録の回数が多すぎます。時間をおいてください');
    const pw = await bcrypt.hash(b.pw, L.bcrypt);
    const t = now();
    if (!(await S.set('user/' + id, { id, pw, at: t, lastPost: 0, lastCmt: 0 }, { onlyIfNew: true }))) throw new E('id_taken', 'このIDはもう使われています');
    const page = { u: id, name: id, bio: '', icon: '🌱', theme: 'note', bg: '', fg: '', font: 'gothic', deco: 'line', vis: 'public', key: rid(9), hidden: false, at: t, up: t };
    await S.set('page/' + id, page);
    await syncUser(page);
    return { token: await newSession(id), me: meOf(id), page: pubPage(page, true) };
  };

  A.login = async (b, ctx) => {
    const id = typeof b.id === 'string' ? b.id.trim().toLowerCase() : '';
    const bad = new E('login_failed', 'IDかパスワードがちがいます');
    if (!ID_RE.test(id)) throw bad;
    const fk = `rl/lf/${id}/${ctx.iph}`;
    const f = await S.get(fk);
    if (f && now() < f.r && f.n >= L.loginFails) throw new E('locked', `まちがいが続いたので、しばらくログインできません(あと約${Math.ceil((f.r - now()) / 60000)}分)`);
    const idLock = await S.get(`rl/lfid/${id}`);
    if (idLock && now() < idLock.r && idLock.n >= L.loginFails * 6) throw new E('locked', 'このIDはしばらくログインできません。時間をおいてください');
    const user = await verifyPw(id, b.pw);
    if (!user) {
      await rate(`lf/${id}/${ctx.iph}`, L.loginFails, L.loginWin);
      await rate(`lfid/${id}`, L.loginFails * 6, L.loginWin);
      throw bad;
    }
    if (f) await S.del(fk);
    const page = await S.get('page/' + id);
    return { token: await newSession(id), me: meOf(id), page: page && pubPage(page, true) };
  };

  A.logout = async (b) => {
    const m = /^([a-z0-9_]{3,20})\.([A-Za-z0-9_-]{20,64})$/.exec(typeof b.t === 'string' ? b.t : '');
    if (m) await S.del(`sess/${m[1]}/${sha(m[2])}`);
    return {};
  };

  A.me = async (b) => {
    const u = await need(b);
    const page = await S.get('page/' + u);
    return { me: meOf(u), page: page && pubPage(page, true) };
  };

  A.changePw = async (b) => {
    const u = await need(b);
    if (!(await rate(`pw/${u}`, 5, 900))) throw new E('rate', '回数が多すぎます。時間をおいてください');
    if (!(await verifyPw(u, b.pw))) throw new E('login_failed', '今のパスワードがちがいます');
    pwCheck(b.newPw);
    const pw = await bcrypt.hash(b.newPw, L.bcrypt);
    await mutate('user/' + u, null, (v) => { v.pw = pw; return v; });
    await delPrefix(`sess/${u}/`);
    return { token: await newSession(u) };
  };

  A.deleteAccount = async (b) => {
    const u = await need(b);
    if (!(await rate(`pw/${u}`, 5, 900))) throw new E('rate', '回数が多すぎます。時間をおいてください');
    if (!(await verifyPw(u, b.pw))) throw new E('login_failed', 'パスワードがちがいます');
    await wipeUser(u);
    return {};
  };

  A.savePage = async (b) => {
    const u = await need(b);
    const d = b.page || {};
    const name = text(d.name, L.nameMax, '名前') || u;
    const bio = text(d.bio, L.bioMax, 'じこしょうかい', true);
    const icon = typeof d.icon === 'string' ? d.icon.trim() : '';
    if (!icon || icon.length > 16 || /[\u0000-\u007f]/.test(icon)) throw new E('bad', 'アイコンは絵文字を1つえらんでください');
    for (const k of ['bg', 'fg']) if (d[k] !== '' && !(typeof d[k] === 'string' && COLOR_RE.test(d[k]))) throw new E('bad', '色の指定がただしくありません');
    const page = await mutate('page/' + u, null, (v) => {
      if (!v) throw new E('notfound', 'ページが見つかりません');
      Object.assign(v, {
        name, bio, icon, theme: oneOf(d.theme, THEMES, 'テーマ'), bg: d.bg.toLowerCase(), fg: d.fg.toLowerCase(),
        font: oneOf(d.font, FONTS, 'フォント'), deco: oneOf(d.deco, DECOS, '見出しの飾り'),
        vis: oneOf(d.vis, ['public', 'unlisted', 'private'], '公開範囲'), up: now(),
      });
      return v;
    });
    await syncUser(page);
    return { page: pubPage(page, true) };
  };

  A.savePost = async (b) => {
    const u = await need(b);
    const d = b.post || {};
    const kind = oneOf(d.kind, ['blog', 'diary'], '種類');
    const title = text(d.title, L.titleMax, '題名');
    const body = text(d.body, L.bodyMax, '本文', true);
    if (!body) throw new E('empty', '本文を書いてください');
    if (kind === 'blog' && !title) throw new E('empty', '題名を書いてください');
    if (!validDate(d.date)) throw new E('bad', '日付がただしくありません');
    const status = oneOf(d.status, ['draft', 'public'], '下書き/公開');
    const vis = oneOf(d.vis, ['public', 'unlisted', 'private'], '公開範囲');
    if (!Array.isArray(d.tags) || d.tags.length > L.tagMax) throw new E('bad', `タグは${L.tagMax}個までです`);
    const tags = [...new Set(d.tags.map((t) => text(String(t).replace(/[#＃\s,、]/g, ''), L.tagLen, 'タグ')).filter(Boolean))];
    const user = await S.get('user/' + u);
    const idx = (await S.get('pidx/' + u)) || [];
    const t = now();
    let post;
    if (d.p !== undefined && d.p !== null && d.p !== '') {
      if (typeof d.p !== 'string' || !PID_RE.test(d.p)) throw new E('bad', '記事の指定がただしくありません');
      // 自分のIDの下にある記事しか読み書きしないので、ほかの人の記事は書き換えられない
      post = await S.get(`post/${u}/${d.p}`);
      if (!post) throw new E('notfound', '記事が見つかりません');
      if (t - (post.up || 0) < L.editGap * 1000) throw new E('rate', '保存の間隔が短すぎます。少し待ってください');
      if (post.kind !== kind) throw new E('bad', '種類は変えられません');
    } else {
      if (idx.length >= L.maxPosts) throw new E('limit', `記事と日記は合わせて${L.maxPosts}件までです`);
      const wait = L.postGap * 1000 - (t - (user.lastPost || 0));
      if (wait > 0) throw new E('rate', `続けて投稿できません。あと${Math.ceil(wait / 1000)}秒待ってください`);
      post = { p: rid(9), u, kind, at: t, hidden: false };
    }
    if (kind === 'diary' && idx.some((e) => e.kind === 'diary' && e.date === d.date && e.p !== post.p)) throw new E('dup', 'その日の日記はもうあります');
    Object.assign(post, { title, body, date: d.date, tags, status, vis, up: t });
    await S.set(`post/${u}/${post.p}`, post);
    await syncPost(post);
    if (!d.p) await mutate('user/' + u, null, (v) => { v.lastPost = t; return v; });
    return { post };
  };

  A.deletePost = async (b) => {
    const u = await need(b);
    if (typeof b.p !== 'string' || !PID_RE.test(b.p)) throw new E('bad', '記事の指定がただしくありません');
    if (!(await S.get(`post/${u}/${b.p}`))) throw new E('notfound', '記事が見つかりません');
    await removePost(u, b.p);
    return {};
  };

  A.myPosts = async (b) => {
    const u = await need(b);
    return { posts: ((await S.get('pidx/' + u)) || []).sort((x, y) => (y.date + y.up).localeCompare(x.date + x.up)) };
  };

  async function countView(b, ctx, viewer, tg) {
    if (!b.count || tg.owner) return;
    if (!(await rate(`view/${ctx.iph}`, 90, 60))) return;
    await mutate(`stat/${b.u}/${pk(b.p)}`, { likes: 0, views: 0, cmts: 0 }, (s) => { s.views = (s.views || 0) + 1; return s; });
  }

  A.getPage = async (b, ctx) => {
    const viewer = await auth(b.t);
    b.p = '@';
    const tg = await target(viewer, b);
    await countView(b, ctx, viewer, tg);
    const all = (await S.get('pidx/' + b.u)) || [];
    const posts = (tg.owner || tg.admin ? all : all.filter(listable)).sort((x, y) => (y.date + y.up).localeCompare(x.date + x.up));
    return { page: pubPage(tg.page, tg.owner), owner: tg.owner, posts, ...(await social(viewer, b.u, '@', tg)) };
  };

  A.getPost = async (b, ctx) => {
    const viewer = await auth(b.t);
    const tg = await target(viewer, b);
    await countView(b, ctx, viewer, tg);
    return { post: tg.post, author: design(tg.page), owner: tg.owner, ...(await social(viewer, b.u, b.p, tg)) };
  };

  A.feed = async () => {
    const [posts, users] = await Promise.all([S.get('idx/posts'), S.get('idx/users')]);
    const us = users || {}, ps = posts || [];
    const who = (u) => (us[u] ? { name: us[u].n, icon: us[u].i, th: us[u].th } : { name: u, icon: '🙂', th: 'note' });
    const cnt = {};
    for (const e of ps) for (const t of e.tags) cnt[t] = (cnt[t] || 0) + 1;
    return {
      posts: ps.slice(0, 40).map((e) => ({ ...e, ...who(e.u) })),
      pages: Object.entries(us).filter(([, v]) => v.v === 'public' && !v.h).sort((a, b) => b[1].up - a[1].up).slice(0, 20).map(([u, v]) => ({ u, name: v.n, icon: v.i, th: v.th })),
      tags: Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 14).map((e) => e[0]),
    };
  };

  A.search = async (b) => {
    const q = text(b.q, 30, 'さがす言葉').toLowerCase().replace(/^[#＃@]/, '');
    if (!q) return { users: [], posts: [] };
    const [posts, users] = await Promise.all([S.get('idx/posts'), S.get('idx/users')]);
    const us = users || {};
    const who = (u) => (us[u] ? { name: us[u].n, icon: us[u].i, th: us[u].th } : { name: u, icon: '🙂', th: 'note' });
    return {
      users: Object.entries(us).filter(([u, v]) => v.v === 'public' && !v.h && (u.includes(q) || v.n.toLowerCase().includes(q))).slice(0, 30).map(([u, v]) => ({ u, name: v.n, icon: v.i, th: v.th })),
      posts: (posts || []).filter((e) => (b.tagOnly ? e.tags.some((t) => t.toLowerCase() === q) : e.tags.some((t) => t.toLowerCase().includes(q)) || e.title.toLowerCase().includes(q))).slice(0, 40).map((e) => ({ ...e, ...who(e.u) })),
    };
  };

  A.like = async (b) => {
    const viewer = await need(b);
    await target(viewer, b);
    if (!(await rate(`like/${viewer}`, 60, 60))) throw new E('rate', '少し待ってください');
    const k = `like/${viewer}/${b.u}/${pk(b.p)}`;
    let liked;
    if (await S.get(k)) { await S.del(k); liked = false; } else { liked = await S.set(k, { at: now() }, { onlyIfNew: true }); if (!liked) return { liked: true }; }
    const s = await mutate(`stat/${b.u}/${pk(b.p)}`, { likes: 0, views: 0, cmts: 0 }, (v) => { v.likes = Math.max(0, (v.likes || 0) + (liked ? 1 : -1)); return v; });
    return { liked, likes: s.likes };
  };

  A.comment = async (b) => {
    const viewer = await need(b);
    const tg = await target(viewer, b);
    const txt = text(b.text, L.cmtMax, 'コメント');
    if (!txt) throw new E('empty', 'コメントを書いてください');
    const user = await S.get('user/' + viewer);
    const t = now();
    const wait = L.cmtGap * 1000 - (t - (user.lastCmt || 0));
    if (wait > 0) throw new E('rate', `続けてコメントできません。あと${Math.ceil(wait / 1000)}秒待ってください`);
    const c = t.toString(36) + rid(4);
    await mutate(`cmt/${b.u}/${pk(b.p)}`, [], (a) => { a.push({ c, by: viewer, text: txt, at: t, hidden: false }); return a.slice(-300); });
    await S.set(`mycmt/${viewer}/${c}`, { u: b.u, p: b.p });
    await mutate('user/' + viewer, null, (v) => { v.lastCmt = t; return v; });
    await mutate(`stat/${b.u}/${pk(b.p)}`, { likes: 0, views: 0, cmts: 0 }, (s) => { s.cmts = (s.cmts || 0) + 1; return s; });
    return social(viewer, b.u, b.p, tg);
  };

  A.delComment = async (b) => {
    const viewer = await need(b);
    const tg = await target(viewer, b);
    const list = (await S.get(`cmt/${b.u}/${pk(b.p)}`)) || [];
    const c = list.find((e) => e.c === b.c);
    if (!c) throw new E('notfound', 'コメントが見つかりません');
    if (!(c.by === viewer || tg.owner || tg.admin)) throw new E('forbidden', 'このコメントは消せません');
    await removeComment(b.u, b.p, c.c);
    return social(viewer, b.u, b.p, tg);
  };

  A.report = async (b, ctx) => {
    const viewer = await auth(b.t);
    await target(viewer, b);
    const reason = oneOf(b.reason, REASONS, '理由');
    const note = text(b.note, 100, 'メモ');
    const c = b.c === undefined || b.c === null || b.c === '' ? '' : String(b.c);
    if (c && !/^[A-Za-z0-9_-]{6,24}$/.test(c)) throw new E('bad', 'コメントの指定がただしくありません');
    if (!(await rate(`report/${ctx.iph}`, 10, 3600))) throw new E('rate', '通報の回数が多すぎます。時間をおいてください');
    const by = viewer || 'guest';
    const key = `report/${b.u}~${pk(b.p)}~${c || '-'}~${sha(viewer || ctx.iph).slice(0, 12)}`;
    await S.set(key, { kind: c ? 'comment' : b.p === '@' ? 'page' : 'post', u: b.u, p: b.p, c, reason, note, by, at: now(), open: true }, { onlyIfNew: true });
    return {};
  };

  async function needAdmin(b) { const u = await need(b); if (!isAdmin(u)) throw new E('forbidden', '管理者だけが使えます'); return u; }

  A.adminReports = async (b) => {
    await needAdmin(b);
    const keys = (await S.list('report/')).slice(0, 300);
    const reps = (await Promise.all(keys.map(async (k) => { const r = await S.get(k); return r && { rkey: k, ...r }; }))).filter(Boolean);
    for (const r of reps) {
      const page = await S.get('page/' + r.u);
      if (!page) { r.gone = true; continue; }
      r.owner = page.name;
      if (r.kind === 'page') { r.snippet = `【${page.name}】${page.bio}`; r.hidden = !!page.hidden; continue; }
      if (r.kind === 'post') {
        const post = await S.get(`post/${r.u}/${r.p}`);
        if (!post) r.gone = true; else { r.snippet = `【${post.title}】${post.body.slice(0, 400)}`; r.hidden = !!post.hidden; }
        continue;
      }
      const cm = ((await S.get(`cmt/${r.u}/${pk(r.p)}`)) || []).find((e) => e.c === r.c);
      if (!cm) r.gone = true; else { r.snippet = cm.text; r.hidden = !!cm.hidden; r.cby = cm.by; }
    }
    for (const r of reps) if (r.gone) r.open = false; // 対象がもう無い通報は対応ずみとして扱う
    reps.sort((x, y) => (y.open - x.open) || (y.at - x.at));
    return { reports: reps };
  };

  A.adminAct = async (b) => {
    await needAdmin(b);
    const op = oneOf(b.op, ['hide', 'show', 'delete', 'deleteUser', 'close'], '操作');
    const rkey = typeof b.rkey === 'string' && b.rkey.startsWith('report/') ? b.rkey : null;
    const closeIt = async () => { if (rkey && (await S.get(rkey))) await mutate(rkey, null, (v) => { v.open = false; return v; }); };
    if (op === 'close') { await closeIt(); return {}; }
    const u = b.u, p = b.p, c = b.c || '';
    if (typeof u !== 'string' || !ID_RE.test(u) || (p !== '@' && !(typeof p === 'string' && PID_RE.test(p)))) throw new E('bad', '対象がただしくありません');
    if (op === 'deleteUser') {
      if (isAdmin(u)) throw new E('bad', '管理者は削除できません');
      await wipeUser(u); await closeIt(); return {};
    }
    const hide = op === 'hide';
    if (c) {
      if (op === 'delete') await removeComment(u, p, c);
      else await mutate(`cmt/${u}/${pk(p)}`, [], (a) => { const f = a.find((e) => e.c === c); if (!f) return undefined; f.hidden = hide; return a; });
    } else if (p === '@') {
      if (op === 'delete') throw new E('bad', 'プロフィールは「アカウント削除」で消してください');
      const page = await mutate('page/' + u, null, (v) => { if (!v) throw new E('notfound', '見つかりません'); v.hidden = hide; return v; });
      await syncUser(page);
    } else if (op === 'delete') {
      await removePost(u, p);
    } else {
      const post = await S.get(`post/${u}/${p}`);
      if (!post) throw new E('notfound', '見つかりません');
      post.hidden = hide;
      await S.set(`post/${u}/${p}`, post);
      await syncPost(post);
    }
    if (op === 'delete') await closeIt();
    return {};
  };

  async function handle(body, ip) {
    try {
      if (!body || typeof body !== 'object' || typeof body.a !== 'string' || !A[body.a]) throw new E('bad', '不明な操作です');
      const ctx = { iph: sha('ip:' + (ip || 'unknown')).slice(0, 16) };
      return { ok: true, ...(await A[body.a](body, ctx)) };
    } catch (e) {
      if (e instanceof E) return { ok: false, err: e.code, msg: e.message };
      console.error('api error', e);
      return { ok: false, err: 'server', msg: 'サーバーでエラーが起きました。少し待ってためしてください' };
    }
  }

  const CORS = {
    'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type', 'access-control-max-age': '86400',
    'cross-origin-resource-policy': 'cross-origin', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
  };
  const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { ...CORS, 'content-type': 'application/json; charset=utf-8' } });

  // 通常は POST。fetch が使えない環境のために script タグ (JSONP) でも同じ操作ができる。
  async function handleRequest(req, ip) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method === 'POST') {
      const raw = await req.text();
      if (raw.length > 60000) return json({ ok: false, err: 'too_long', msg: '送る内容が大きすぎます' });
      let body = null;
      try { body = JSON.parse(raw); } catch (e) {}
      return json(await handle(body, ip));
    }
    const q = new URL(req.url).searchParams;
    const cb = q.get('cb');
    if (req.method !== 'GET' || !cb) return json({ ok: true, name: 'kojin-page api' });
    if (!/^__kp_cb\d{1,12}$/.test(cb)) return json({ ok: false, err: 'bad', msg: 'bad callback' });
    const js = (o) => new Response(`${cb}(${JSON.stringify(o)});`, { status: 200, headers: { ...CORS, 'content-type': 'application/javascript; charset=utf-8' } });
    let d = q.get('d') || '';
    const n = Number(q.get('n') || 1), i = Number(q.get('i') || 0), cid = q.get('cid') || '';
    if (d.length > 4000 || !Number.isInteger(n) || !Number.isInteger(i) || n < 1 || n > 30 || i < 0 || i >= n) return js({ ok: false, err: 'bad', msg: '送り方がただしくありません' });
    if (n > 1) {
      if (!/^[a-z0-9]{10,32}$/.test(cid)) return js({ ok: false, err: 'bad', msg: '送り方がただしくありません' });
      const iph = sha('ip:' + (ip || 'unknown')).slice(0, 16);
      if (!(await rate(`chunk/${iph}`, 400, 300))) return js({ ok: false, err: 'rate', msg: '少し待ってください' });
      await S.set(`chunk/${cid}/${i}`, { d, at: now() });
      if (i < n - 1) return js({ ok: true, more: true });
      const parts = await Promise.all(Array.from({ length: n }, (_, j) => S.get(`chunk/${cid}/${j}`)));
      await delPrefix(`chunk/${cid}/`);
      if (parts.some((x) => !x)) return js({ ok: false, err: 'bad', msg: '送信に失敗しました。もう一度ためしてください' });
      d = parts.map((x) => x.d).join('');
    }
    let body = null;
    try { body = JSON.parse(Buffer.from(d, 'base64url').toString('utf8')); } catch (e) {}
    return js(await handle(body, ip));
  }

  return { handle, handleRequest, limits: L };
}
