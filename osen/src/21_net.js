// ---- 同時プレイ（Firebase Realtime Database / テスト用ローカル） ------------------------------
// 送るもの：自動で付けた名前の番号・キャラ番号・位置・身ぶり・定型文の番号・物の動き・町の汚染率だけ。
// 個人情報・端末の情報・自由な文字は送らない。
var NET = { blocked: {}, on: false, ok: false, T: null, room: '', pid: '', peers: {}, muted: false, joinT: 0, sendT: 0, last: null, polDelta: 0, polT: 0, polBase: null, applying: false,
  keyN: 0, myEvents: [], rate: {}, status: '1人用', notesShown: false, err: '', heartbeat: 0 };
var ROOM_MAX = 6;
// ---- 通信の「口」：Firebase ----
function fbTransport(url) {
  var fb = (typeof globalThis !== 'undefined' ? globalThis : window).__osenFirebase; if (!fb) throw new Error('Firebase の部品がありません');
  var app = fb.apps.filter(function (a) { return a.name === 'osen'; })[0] || fb.initializeApp({ databaseURL: url }, 'osen');
  var db = app.database(), base = 'osen/v1/';
  function R(p) { return db.ref(base + p); }
  return {
    kind: 'firebase',
    set: function (p, v) { return R(p).set(v); }, update: function (p, v) { return R(p).update(v); }, remove: function (p) { return R(p).remove(); },
    push: function (p, v) { var r = R(p).push(); r.set(v); return r.key; },
    once: function (p) { return R(p).once('value').then(function (s) { return s.val(); }); },
    on: function (p, ev, cb, last) { var q = last ? R(p).limitToLast(last) : R(p); var h = q.on(ev, function (s) { cb(s.key, s.val()); }); return function () { q.off(ev, h); }; },
    onDisconnectRemove: function (p) { R(p).onDisconnect().remove(); },
    txnAdd: function (p, d) { return R(p).transaction(function (v) { return Math.max(0, Math.min(99999, (v || 0) + d)); }); },
    onConnected: function (cb) { db.ref('.info/connected').on('value', function (s) { cb(!!s.val()); }); },
    now: function () { return Date.now() + (NET.skew || 0); },
    initSkew: function () { db.ref('.info/serverTimeOffset').on('value', function (s) { NET.skew = s.val() || 0; }); },
    goOffline: function () { try { db.goOffline(); } catch (e) {} }
  };
}
// ---- 通信の「口」：テスト用（同じブラウザの別の画面どうしをつなぐ） ----
function localTransport() {
  var tree = {}, subs = [], bc = new BroadcastChannel('osen-net'), discon = [];
  function seg(p) { return p.split('/').filter(Boolean); }
  function get(p) { var o = tree; seg(p).forEach(function (k) { o = o == null ? undefined : o[k]; }); return o === undefined ? null : JSON.parse(JSON.stringify(o)); }
  function rawSet(p, v) {
    var s = seg(p), o = tree, before = get(p.split('/').slice(0, -1).join('/')) || {};
    for (var i = 0; i < s.length - 1; i++) { if (o[s[i]] == null || typeof o[s[i]] !== 'object') o[s[i]] = {}; o = o[s[i]]; }
    var k = s[s.length - 1], had = o[k] !== undefined && o[k] !== null;
    if (v === null || v === undefined) delete o[k]; else o[k] = JSON.parse(JSON.stringify(v));
    var parent = s.slice(0, -1).join('/');
    subs.forEach(function (sb) {
      if (sb.p === parent) { if (v == null) { if (had && sb.ev === 'child_removed') sb.cb(k, null); } else if (!had && sb.ev === 'child_added') sb.cb(k, get(p)); else if (had && sb.ev === 'child_changed') sb.cb(k, get(p)); }
      if (sb.p === p && sb.ev === 'value') sb.cb(k, get(p));
      if (sb.ev === 'child_changed' && p.indexOf(sb.p + '/') === 0 && seg(p).length > seg(sb.p).length + 1) { var ck = seg(p)[seg(sb.p).length]; sb.cb(ck, get(sb.p + '/' + ck)); }
    });
  }
  function apply(op) { if (op.t === 'set') rawSet(op.p, op.v); }
  bc.onmessage = function (e) { var m = e.data; if (m.t === 'hello') bc.postMessage({ t: 'state', tree: tree }); else if (m.t === 'state' && !NET._gotState) { NET._gotState = true; var walk = function (o, p) { for (var k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && p.split('/').length < 3) walk(o[k], p + k + '/'); else rawSet(p + k, o[k]); } }; walk(m.tree, ''); } else apply(m); };
  bc.postMessage({ t: 'hello' });
  function set(p, v) { rawSet(p, v); bc.postMessage({ t: 'set', p: p, v: v === undefined ? null : v }); return Promise.resolve(); }
  window.addEventListener('pagehide', function () { discon.forEach(function (p) { set(p, null); }); });
  return {
    kind: 'local', set: set, update: function (p, v) { for (var k in v) set(p + '/' + k, v[k]); return Promise.resolve(); }, remove: function (p) { return set(p, null); },
    push: function (p, v) { var k = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); set(p + '/' + k, v); return k; },
    once: function (p) { return new Promise(function (res) { setTimeout(function () { res(get(p)); }, 120); }); },
    on: function (p, ev, cb, last) { var sb = { p: p, ev: ev, cb: cb }; subs.push(sb); if (ev === 'child_added') { var o = get(p) || {}; var ks = Object.keys(o); if (last) ks = ks.slice(-last); ks.forEach(function (k) { cb(k, o[k]); }); } if (ev === 'value') cb(null, get(p)); return function () { subs.splice(subs.indexOf(sb), 1); }; },
    onDisconnectRemove: function (p) { discon.push(p); },
    txnAdd: function (p, d) { return set(p, Math.max(0, (get(p) || 0) + d)); },
    onConnected: function (cb) { setTimeout(function () { cb(true); }, 50); },
    now: function () { return Date.now(); }, initSkew: function () {}, goOffline: function () {}
  };
}
// ---- 参加 ----
NET.statusText = function () { return NET.on ? ('同時プレイ中：' + NET.room + '（' + NET.count() + '人）') : (NET.err ? '1人用（' + NET.err + '）' : (NET_DB_URL ? '1人用（つなぐ準備中）' : '1人用')); };
NET.count = function () { var n = 1; for (var k in NET.peers) if (NET.peers[k].vis) n++; return n; };
NET.join = function () {
  if (NET.T || !NET_DB_URL) { if (NET_DB_URL) loadNotes(); return; }
  try { NET.T = NET_DB_URL === 'local' ? localTransport() : fbTransport(NET_DB_URL.replace(/\/+$/, '')); }
  catch (e) { NET.err = e.message; sysMsg('同時プレイにつなげませんでした。1人用で遊びます。'); return; }
  NET.pid = 'p' + Math.random().toString(36).slice(2, 9);
  NET.T.initSkew();
  var connected = false;
  NET.T.onConnected(function (c) {
    if (c && !connected) { connected = true; NET.ok = true; if (!NET.on) pickRoom(); }
    else if (!c && connected) { connected = false; NET.ok = false; sysMsg('通信が切れました。1人用で続けます（もどったら自動でつなぎます）。'); }
    else if (c && connected && NET.on) { writeMe(true); }
  });
  setTimeout(function () { if (!NET.on && !NET.ok) { NET.err = 'つながらない'; sysMsg('同時プレイのサーバーにつながりません。1人用で遊びます。'); } }, 12000);
  loadNotes();
};
function roomBase() { var s = Math.max(0, LOGIN.servers.map(function (x) { return x.n; }).indexOf(PLAYER.server)), c = Math.max(0, LOGIN.channels.indexOf(PLAYER.channel)); return 's' + s + 'c' + (c + 1); }
function pickRoom(k) {
  k = k || 1; var room = roomBase() + 'r' + k;
  NET.T.once('rooms/' + room + '/p').then(function (ps) {
    var n = 0, tn = NET.T.now(); for (var id in (ps || {})) if (ps[id] && tn - (ps[id].t || 0) < 40000) n++;
    if (n >= ROOM_MAX && k < 30) return pickRoom(k + 1);
    enterRoom(room);
  }, function (e) { NET.err = 'よみこみ失敗'; sysMsg('同時プレイの町に入れませんでした（' + (e && e.message || '') + '）。1人用で遊びます。'); });
}
function enterRoom(room) {
  NET.room = room; NET.on = true; NET.joinT = NET.T.now(); var base = 'rooms/' + room + '/';
  NET.T.onDisconnectRemove(base + 'p/' + NET.pid);
  writeMe(true);
  NET.T.on(base + 'p', 'child_added', peerUpsert); NET.T.on(base + 'p', 'child_changed', peerUpsert); NET.T.on(base + 'p', 'child_removed', function (k) { peerRemove(k); });
  NET.T.on(base + 'e', 'child_added', onEvent, 40);
  NET.T.on(base + 'pol', 'value', function (k, v) { if (typeof v === 'number') { NET.polBase = v; G.pol = v + NET.polDelta; } });
  NET.T.once(base + 'pol').then(function (v) { if (typeof v !== 'number') NET.T.set(base + 'pol', Math.round(G.pol)); });
  NET.T.once(base + 'i').then(function (all) {
    NET.applying = true; for (var k in (all || {})) applyItemState(k, all[k]); NET.applying = false;
    var upd = function (k, v) { if (!v || v.by === NET.pid) return; var it = findNetItem(k); if (it && (it === ITEMS.held || !it.body.sleep)) { if (it) it.pendState = v; return; } NET.applying = true; applyItemState(k, v); NET.applying = false; };
    NET.T.on(base + 'i', 'child_changed', upd); NET.T.on(base + 'i', 'child_added', upd);
  });
  sysMsg('同時プレイ：町「' + room + '」に入りました。ほかの人と同じ町です。');
  logMsg('sys', 'ほかの人とは　定型文・スタンプ・身ぶりで　話せます。⚙設定で　ミュートできます。');
}
// ---- 自分の状態を送る ----
function nameCode() { return PLAYER.nameFree && PLAYER.name ? 'F:' + PLAYER.name.slice(0, 12) : (PLAYER.nameCode || ''); }
function writeMe(force) {
  if (!NET.on) return;
  var p = P.pos, d = { n: nameCode(), c: PLAYER.char, x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, z: Math.round(p.z * 100) / 100, f: Math.round(P.face * 100) / 100, g: P.gesture ? P.gesture.id : '', h: ITEMS.held && ITEMS.held.netKey ? ITEMS.held.netKey : '', v: VOICE.on ? 1 : 0, t: NET.T.now() };
  var L = NET.last;
  if (!force && L && Math.abs(L.x - d.x) + Math.abs(L.y - d.y) + Math.abs(L.z - d.z) < 0.05 && Math.abs(L.f - d.f) < 0.08 && L.g === d.g && L.h === d.h && L.v === d.v && d.t - L.t < 9000) return;
  NET.last = d; NET.T.set('rooms/' + NET.room + '/p/' + NET.pid, d);
}
NET.sendMeta = function () { writeMe(true); };
NET.send = function (k, data, force) { // 定型文・スタンプ・身ぶり・とくぎ など
  if (!NET.on) return;
  var now2 = Date.now(); if (!force) { if (NET.rate[k] && now2 - NET.rate[k] < 1200) return; NET.rate[k] = now2; }
  var key = NET.T.push('rooms/' + NET.room + '/e', { k: k, by: NET.pid, t: NET.T.now(), d: data || {} });
  NET.myEvents.push({ key: key, t: now2 });
};
function evItem(k, data) { if (!NET.on || NET.applying) return; NET.T.push('rooms/' + NET.room + '/e', { k: k, by: NET.pid, t: NET.T.now(), d: data }); }
function itemState(it) { if (!NET.on || NET.applying || !it.netKey) return; var b = it.body; NET.T.set('rooms/' + NET.room + '/i/' + it.netKey, it.gone ? { ty: it.type, g: 1, t: NET.T.now() } : { ty: it.type, x: r2(b.pos.x), y: r2(b.pos.y), z: r2(b.pos.z), yw: r2(b.yaw), s: r2(b.scale), by: NET.pid, t: NET.T.now() }); }
function r2(v) { return Math.round(v * 100) / 100; }
function netKeyFor(it) { if (!it.netKey) it.netKey = it.def ? 'd_' + it.def.id : 'x_' + NET.pid + '_' + (++NET.keyN); return it.netKey; }
// 物の操作を知らせる（19_items から呼ばれる）
NET.sendGrab = function (it) { it.lastBy = 'me'; it.lastT = G.t; evItem('grab', { i: netKeyFor(it) }); writeMe(true); };
NET.sendRelease = function (it) { var b = it.body; it.lastBy = 'me'; it.lastT = G.t; it.ownSettle = true; evItem('rel', { i: netKeyFor(it), ty: it.type, x: r2(b.pos.x), y: r2(b.pos.y), z: r2(b.pos.z), vx: r2(b.vel.x), vy: r2(b.vel.y), vz: r2(b.vel.z), yw: r2(b.yaw), s: r2(b.scale) }); writeMe(true); };
NET.sendSpawn = function (it) { var b = it.body; evItem('spawn', { i: netKeyFor(it), ty: it.type, x: r2(b.pos.x), y: r2(b.pos.y), z: r2(b.pos.z), vx: r2(b.vel.x), vy: r2(b.vel.y), vz: r2(b.vel.z), s: r2(b.scale) }); it.ownSettle = true; };
NET.sendGone = function (it, why) { if (!it.netKey) return; evItem('gone', { i: it.netKey, w: why || '' }); itemState(it); };
NET.sendScale = function (it) { evItem('scale', { i: netKeyFor(it), s: r2(it.body.scale) }); it.ownSettle = true; };
NET.sendRot = function (it) { evItem('rot', { i: netKeyFor(it), yw: r2(it.body.yaw) }); it.ownSettle = true; };
NET.sendCombine = function (out, pos, a, b, n) { if (n) netKeyFor(n); evItem('comb', { a: a ? a.netKey || '' : '', b: b ? b.netKey || '' : '', o: out, i: n ? n.netKey : '', x: r2(pos.x), y: r2(pos.y), z: r2(pos.z) }); if (n) n.ownSettle = true; };
function findNetItem(key) { for (var i = 0; i < ITEMS.list.length; i++) if (ITEMS.list[i].netKey === key) return ITEMS.list[i]; if (key && key.indexOf('d_') === 0) { var id = key.slice(2); for (i = 0; i < ITEMS.list.length; i++) if (ITEMS.list[i].def && ITEMS.list[i].def.id === id) { ITEMS.list[i].netKey = key; return ITEMS.list[i]; } } return null; }
function validType(t) { return !!(EXTRA_TYPES[t] || (ITEM_INFO[t] && t !== 'door')); }
function applyItemState(key, s) {
  if (!s || !validType(s.ty)) return;
  var it = findNetItem(key);
  if (s.g) { if (it) removeItem(it); return; }
  if (!it) { if (key.indexOf('d_') === 0) return; it = spawnItem(s.ty, s.x, s.y - 0.3, s.z, s.yw || 0, { scale: s.s || 1 }); it.netKey = key; it.spawned = true; }
  if (it === ITEMS.held) return;
  var b = it.body; b.pos.set(s.x, s.y, s.z); b.yaw = s.yw || 0; b.scale = clamp(s.s || 1, 0.3, 4); b.vel.set(0, 0, 0); bodyExt(b); b.sleep = true; it.lastBy = s.by; it.lastT = G.t;
}
// ---- ほかの人の出来事 ----
function onEvent(key, e) {
  if (!e || e.by === NET.pid || (e.t || 0) < NET.joinT - 2000) return;
  if (/^v[oaih]$/.test(e.k) && Date.now() - (e.t || 0) > 30000 + Math.abs(NET.skew || 0)) return;
  var pr = NET.peers[e.by], d = e.d || {}, who = pr ? pr.name : 'だれか';
  var hidden = NET.muted || NET.blocked[e.by];
  NET.applying = true;
  try {
    switch (e.k) {
      case 'vo': case 'va': case 'vi': case 'vh': voiceOnEvent(e); break;
      case 'bks': if (d.l && d.l.length) d.l.slice(0, 40).forEach(function (q) { smashNetEvent(q[0], q[1]); }); break;
      case 'msg': { if (hidden || typeof d.m !== 'string') break; var fm = filterMsg(d.m); if (!fm.text) break; if (pr) pr.bubble = { text: fm.text, t: now() + 5000, free: true }; logMsg('talk', fm.text, who, true); sfx('chat'); break; }
      case 'say': { var tx = phraseText(d.p); if (tx && !hidden) { if (pr) pr.bubble = { text: tx, t: now() + 4500 }; logMsg('talk', tx, who); sfx('chat'); } break; }
      case 'stamp': if (pr && !hidden && STAMPS.some(function (s) { return s.id === d.s; })) { pr.bubble = { text: d.s, icon: d.s, t: now() + 3500 }; } break;
      case 'ges': if (pr && !hidden && GESTURES.some(function (g2) { return g2.id === d.g; })) pr.gesture = { id: d.g, t: 0 }; break;
      case 'skill': if (pr && !NET.muted) logMsg('sys', who + 'が　とくぎを使った。'); break;
      case 'grab': { var it = findNetItem(d.i); if (it) { if (it === ITEMS.held) { ITEMS.held = null; sysMsg('ほかの人と同時に持とうとしました。ゆずりました。'); } it.heldBy = e.by; it.body.sleep = true; } break; }
      case 'rel': { var it2 = findNetItem(d.i); if (!it2 && validType(d.ty)) { var df = d.i.indexOf('d_') === 0 ? PROP_DEFS.filter(function (q) { return q.id === d.i.slice(2); })[0] : null; it2 = spawnItem(d.ty, d.x, d.y, d.z, d.yw, { scale: d.s, def: df }); it2.netKey = d.i; if (!df) it2.spawned = true; }
        if (pr && pr.holding === d.i) pr.holding = '';
        if (it2) { it2.heldBy = null; var b = it2.body; b.pos.set(d.x, d.y, d.z); b.vel.set(d.vx || 0, d.vy || 0, d.vz || 0); b.yaw = d.yw || 0; b.scale = clamp(d.s || 1, 0.3, 4); bodyExt(b); b.thrownT = (d.vx || d.vz) ? 2 : 1; wake(it2); it2.lastBy = e.by; it2.lastT = G.t; it2.ownSettle = false; } break; }
      case 'spawn': { if (findNetItem(d.i) || !validType(d.ty)) break; var n = spawnItem(d.ty, d.x, d.y - 0.2, d.z, 0, { scale: d.s || 1, awake: true }); n.netKey = d.i; n.spawned = true; n.body.vel.set(d.vx || 0, d.vy || 0, d.vz || 0); n.lastBy = e.by; n.lastT = G.t; break; }
      case 'gone': { var g3 = findNetItem(d.i); if (g3) { if (g3 === ITEMS.held) ITEMS.held = null; removeItem(g3); } break; }
      case 'scale': { var s3 = findNetItem(d.i); if (s3) { s3.body.scale = clamp(d.s, 0.3, 4); bodyExt(s3.body); wake(s3); } break; }
      case 'rot': { var r3 = findNetItem(d.i); if (r3) { r3.body.yaw = d.yw; wake(r3); } break; }
      case 'comb': { var a = findNetItem(d.a), bb = findNetItem(d.b); if (a) removeItem(a); if (bb) removeItem(bb); if (validType(d.o) && !findNetItem(d.i)) { var c3 = spawnItem(d.o, d.x, d.y, d.z, 0, { awake: true }); c3.netKey = d.i; c3.spawned = true; } if (!NET.muted) logMsg('sys', who + 'が　「' + itemType(d.o).name + '」を合成した。'); break; }
    }
  } catch (er) {}
  NET.applying = false;
}
function phraseText(code) { if (typeof code !== 'number') return null; var c = Math.floor(code / 100), i = code % 100; return PHRASES[c] && PHRASES[c][1][i] || null; }
function phraseCode(text) { for (var c = 0; c < PHRASES.length; c++) { var i = PHRASES[c][1].indexOf(text); if (i >= 0) return c * 100 + i; } return -1; }
function decodeName(code) {
  if (typeof code === 'string' && code.indexOf('F:') === 0) { var fn = code.slice(2, 14), f = filterMsg(fn); return f.censored || !f.text.trim() ? '名無しの住人' : f.text; } var m = /^(\d+)\.(\d+)\.(\d+)$/.exec(code || ''); if (!m) return '名無しの住人'; return (NAME_A[+m[1]] || '？') + (NAME_C[+m[2]] || '？') + (NAME_B[+m[3]] || ''); }
// ---- ほかの人を表示する ----
function peerUpsert(id, v) {
  if (id === NET.pid || !v || typeof v.x !== 'number') return;
  var pr = NET.peers[id];
  if (!pr) {
    var ci = clamp(v.c | 0, 0, 7), g2 = FRIENDS.lo[ci] || FRIENDS.hi[ci];
    var root = new THREE.Group(), body = new THREE.Group(); root.add(body); R.scene.add(root);
    var m = animMesh(g2); var sc = 1.18 * CHARS[ci].scale; m.scale.set(sc, sc, sc); body.add(m);
    pr = NET.peers[id] = { id: id, char: ci, name: decodeName(v.n), pos: new THREE.Vector3(v.x, v.y, v.z), face: v.f || 0, snaps: [], root: root, body: body, mesh: m, st: {}, h: (g2.userData.h || 1.06) * sc, vis: true, gesture: null };
    if (!NET.muted) { logMsg('sys', pr.name + '（' + FRIEND_INFO[ci].name + '）が　町に来ました。'); sfx('uiOpen'); }
  }
  if ((v.c | 0) !== pr.char) { var ci2 = clamp(v.c | 0, 0, 7), g3 = FRIENDS.lo[ci2]; pr.char = ci2; pr.mesh.geometry = g3; pr.mesh.material = animMat(g3.userData.set || 0); pr.mesh.material.userData.u.uH.value = g3.userData.h || 1.06; var s2 = 1.18 * CHARS[ci2].scale; pr.mesh.scale.set(s2, s2, s2); pr.h = (g3.userData.h || 1.06) * s2; }
  pr.name = decodeName(v.n); pr.lastT = v.t || NET.T.now(); pr.recv = Date.now();
  pr.snaps.push({ t: Date.now(), x: v.x, y: v.y, z: v.z, f: v.f || 0 }); if (pr.snaps.length > 12) pr.snaps.shift();
  if (v.g && (!pr.gesture || pr.gesture.id !== v.g)) pr.gesture = { id: v.g, t: 0 };
  pr.holding = v.h || ''; pr.v = v.v === 1;
}
function peerRemove(id) { var pr = NET.peers[id]; if (!pr) return; voiceHang(id, true); R.scene.remove(pr.root); delete NET.peers[id]; if (!NET.muted) logMsg('sys', pr.name + 'が　町から出ました。'); ITEMS.list.forEach(function (it) { if (it.heldBy === id) { it.heldBy = null; wake(it); } }); }
var _pv = null;
function updatePeers(dt) {
  if (!_pv) _pv = new THREE.Vector3();
  var tRender = Date.now() - 160;
  for (var id in NET.peers) {
    var pr = NET.peers[id], S = pr.snaps;
    if (Date.now() - pr.recv > 45000) { peerRemove(id); continue; }
    pr.vis = !NET.muted && !NET.blocked[id]; pr.root.visible = pr.vis;
    // なめらかにつなぐ（160ms 遅らせて補間）
    var a = S[0], b = S[S.length - 1];
    for (var i = 0; i < S.length - 1; i++) if (S[i].t <= tRender && S[i + 1].t >= tRender) { a = S[i]; b = S[i + 1]; break; }
    var k = b.t > a.t ? clamp((tRender - a.t) / (b.t - a.t), 0, 1) : 1;
    if (tRender > b.t) { a = b; k = 1; }
    _pv.set(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k));
    var spd = _pv.distanceTo(pr.pos) / Math.max(dt, 0.001);
    pr.pos.lerp(_pv, 1 - Math.exp(-dt * 18));
    var tf = a.f + angDiff(a.f, b.f) * k; pr.face += angDiff(pr.face, tf) * Math.min(1, dt * 12);
    var ex = gestureAnim(pr.gesture, dt); if (ex === 'end') { pr.gesture = null; ex = null; }
    if (pr.holding) { ex = ex || {}; ex.lean = (ex.lean || 0) - 0.07; ex.L_armL = ex.L_armR = -0.75; }
    bodyAnim(pr.root, pr.body, pr.st, dt, Math.min(8, spd), spd > 5.5, true, 0, ex);
    pr.root.position.copy(pr.pos); pr.root.rotation.y = pr.face + PI;
    // ほかの人が持っている物
    if (pr.holding) { var it = findNetItem(pr.holding); if (it && it !== ITEMS.held) { var bb = it.body, f = pr.face, d = 0.3 + Math.max(bb.ex, bb.ez) + 0.2; bb.pos.set(pr.pos.x - Math.sin(f) * d, pr.pos.y + pr.h * 0.55, pr.pos.z - Math.cos(f) * d); bb.yaw = f; bb.vel.set(0, 0, 0); bb.sleep = true; it.heldBy = id; } }
  }
}
// ---- 毎フレーム ----
NET.update = function (dt) {
  if (!NET.on) { NET.heartbeat += dt; if (NET.heartbeat > 20 && NET_DB_URL) { NET.heartbeat = 0; } return; }
  NET.sendT -= dt; if (NET.sendT <= 0) { NET.sendT = 0.25; if (NET.ok) writeMe(false); }
  updatePeers(dt);
  updateVoice(dt);
  // 自分が動かした物が止まったら、最後の位置を記録（あとから来た人用）
  for (var i = 0; i < ITEMS.list.length; i++) { var it = ITEMS.list[i]; if (it.ownSettle && it.body.sleep && it !== ITEMS.held) { it.ownSettle = false; itemState(it); }
    if (it.pendState && (it.body.sleep || G.t - (it.lastT || 0) > 6) && it !== ITEMS.held) { var ps = it.pendState; it.pendState = null; NET.applying = true; applyItemState(it.netKey, ps); NET.applying = false; } }
  // 町の汚染率をみんなで足す
  NET.polT -= dt; if (NET.polT <= 0 && NET.ok) { NET.polT = 3; if (Math.abs(NET.polDelta) > 0.01) { var dd = NET.polDelta; NET.polDelta = 0; NET.T.txnAdd('rooms/' + NET.room + '/pol', dd); } }
  // 古い自分の出来事を消す（量を少なくする）
  if (NET.myEvents.length && Date.now() - NET.myEvents[0].t > 60000) { var o = NET.myEvents.shift(); NET.T.remove('rooms/' + NET.room + '/e/' + o.key); }
};
// 汚染率：つながっている時は差分を集めて送る
function netPollution(v) { if (NET.on && NET.polBase !== null) { NET.polDelta += v; } }
// じゃま防止：ほかの人が最近動かした物は、自分には当たらない（閉じこめられない）
function netPassThrough(it) { return NET.on && it.lastBy && it.lastBy !== 'me' && G.t - (it.lastT || 0) < 25; }
function netCanGrab(it) {
  if (!NET.on) return true;
  if (it.heldBy && NET.peers[it.heldBy]) { sysMsg('ほかの人が持っています。'); return false; }
  if (it.lastBy && it.lastBy !== 'me' && G.t - (it.lastT || 0) < 4) { sysMsg('ほかの人が置いたばかりです。少し待って下さい。'); return false; }
  return true;
}
// ---- 同時ではない共有（ひとこと・足あと）。REST で読み書きするので、リアルタイムが使えなくても動く ----
var NOTES = { list: [], group: null, lastPost: 0, posted: 0 };
function notesURL(q) { return NET_DB_URL.replace(/\/+$/, '') + '/osen/v1/notes.json' + (q || ''); }
function loadNotes() {
  if (!NET_DB_URL || NET_DB_URL === 'local' || NOTES.loaded) return; NOTES.loaded = true;
  try {
    fetch(notesURL('?orderBy=%22t%22&limitToLast=60')).then(function (r) { return r.json(); }).then(function (all) {
      if (!all || typeof all !== 'object') return;
      Object.keys(all).forEach(function (k) { showNote(all[k]); });
      if (NOTES.list.length) logMsg('sys', 'この町には　ほかの人の　ひとことが　' + NOTES.list.length + 'こ　残っています。');
    }).catch(function () {});
  } catch (e) {}
}
function postNote(kind, extra, silent) {
  if (!NET_DB_URL || NET_DB_URL === 'local') return false;
  if (Date.now() - NOTES.lastPost < 20000 || NOTES.posted > 30) { if (!silent) sysMsg('ひとことは　少し時間をあけて下さい。'); return false; }
  NOTES.lastPost = Date.now(); NOTES.posted++;
  var d = { x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), p: extra.p != null ? extra.p : -1, k: kind, n: nameCode(), c: PLAYER.char, ty: extra.ty || '', t: Date.now() };
  try { fetch(notesURL(), { method: 'POST', body: JSON.stringify(d) }).catch(function () {}); } catch (e) { return false; }
  showNote(d); return true;
}
function showNote(d) {
  if (!d || typeof d.x !== 'number' || NOTES.list.length > 80) return;
  if (!NOTES.group) { NOTES.group = new THREE.Group(); R.scene.add(NOTES.group); }
  var name = decodeName(d.n), text = d.k === 'item' ? '（' + (validType(d.ty) ? itemType(d.ty).name : '物') + 'を置いた）' : (phraseText(d.p) || '……');
  var c2 = cvs(512, 160), x = c2.getContext('2d');
  x.fillStyle = 'rgba(255,250,230,0.95)'; x.fillRect(4, 4, 504, 152); x.strokeStyle = '#5a3a10'; x.lineWidth = 6; x.strokeRect(4, 4, 504, 152);
  cnFillText(x, name + 'のひとこと', 20, 40, 26, 400, '#a04000', 'left');
  var t = text.length > 18 ? text.slice(0, 18) + '…' : text; cnFillText(x, t, 20, 100, 34, 400, '#222', 'left');
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(c2, false), depthWrite: false }));
  sp.scale.set(2.4, 0.75, 1); sp.position.set(d.x, (d.y || 0) + 2.2, d.z); NOTES.group.add(sp);
  // 足あと
  var fp = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), new THREE.MeshBasicMaterial({ color: 0x5a3a2a, transparent: true, opacity: 0.45, depthWrite: false }));
  fp.rotation.x = -PI / 2; fp.position.set(d.x, (d.y || 0) + 0.04, d.z); NOTES.group.add(fp);
  if (d.k === 'item' && validType(d.ty)) { var gh = makeItemMesh(d.ty); gh.position.set(d.x, d.y || 0, d.z); gh.traverse(function (m) { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.45; } }); NOTES.group.add(gh); }
  NOTES.list.push(d);
}
