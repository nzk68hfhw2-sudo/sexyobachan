// ---- coins, shop, cosmetics, levels. Logged in: everything is computed and stored on the server.
//      Guest: the same rules run locally and are kept in this device's storage only.
var HATS = { h_none: { name: 'なし', price: 0 }, h_cap: { name: 'キャップ', price: 200 }, h_party: { name: 'パーティーぼうし', price: 300 }, h_helmet: { name: 'ヘルメット', price: 400 }, h_tophat: { name: 'シルクハット', price: 600 }, h_crown: { name: '王冠', price: 1500 } };
var TITLES = [[1, 'ルーキー'], [3, 'ソルジャー'], [6, 'ベテラン'], [10, 'エース'], [15, 'エリート'], [20, 'マスター'], [30, 'レジェンド']];
var ECO = { coins: 0, xp: 0, owned: {}, eq: { skin: 's_default', hat: 'h_none', tracer: 't_default', cross: 'c_default', avatar: 0 }, loadout: ['ar', 'pistol', 'shotgun', 'sniper'], wins: 0, losses: 0, daily: false, match: null, loaded: false };
var FREE_WEAPONS = ['ar', 'pistol', 'shotgun', 'sniper'];
function levelOf(xp) { return Math.floor(Math.sqrt(Math.max(0, xp) / 150)) + 1; }
function titleOf(lv) { var t = TITLES[0][1]; TITLES.forEach(function (x) { if (lv >= x[0]) t = x[1]; }); return t; }
function itemInfo(id) {
  if (id.indexOf('w_') === 0) { var w = WDEF[id.slice(2)]; return w ? { kind: 'weapon', name: w.name, price: w.price, info: w.info } : null; }
  var m = id.charAt(0) === 's' ? SKINS : id.charAt(0) === 'h' ? HATS : id.charAt(0) === 't' ? TRACERS : id.charAt(0) === 'c' ? CROSSES : null;
  return m && m[id] ? { kind: { s: 'skin', h: 'hat', t: 'tracer', c: 'cross' }[id.charAt(0)], name: m[id].name, price: m[id].price } : null;
}
function owns(id) { var it = itemInfo(id); return !!it && (it.price === 0 || !!ECO.owned[id]); }
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// ---- local (guest) backend: mirrors the server rules --------------------------------
function rewardFor(r) {
  var kills = Math.min(60, Math.max(0, r.kills | 0)) * 10, st = r.streak >= 10 ? 150 : r.streak >= 7 ? 80 : r.streak >= 5 ? 50 : r.streak >= 3 ? 25 : r.streak >= 2 ? 10 : 0;
  var fin = r.mode === 'tdm' ? (r.win ? 150 : r.draw ? 90 : 60) : Math.max(0, (r.win ? 8 : r.wave - 1)) * 25 + (r.win ? 200 : 0);
  return { kills: kills, streak: st, finish: fin, coins: Math.min(1200, kills + st + fin), xp: Math.min(60, r.kills | 0) * 10 + (r.win ? 100 : 40) };
}
function today() { var d = new Date(Date.now() + 9 * 3600000); return d.toISOString().slice(0, 10); }      // Japan date
function guestLoad() { return store.get('eco', { coins: 0, xp: 0, owned: [], eq: {}, loadout: null, wins: 0, losses: 0, lastDaily: '' }); }
function guestProfile(g) { return { ok: true, coins: g.coins, xp: g.xp, owned: g.owned, equipped: g.eq, loadout: g.loadout, wins: g.wins, losses: g.losses, daily: g.lastDaily !== today() }; }
function guestCall(name, a) {
  var g = guestLoad(), it, r;
  if (name === 'fr_profile') return guestProfile(g);
  if (name === 'fr_claim_daily') { if (g.lastDaily === today()) return { ok: false, error: 'ALREADY' }; g.lastDaily = today(); g.coins += 100; store.set('eco', g); r = guestProfile(g); r.gained = 100; return r; }
  if (name === 'fr_buy') { it = itemInfo(a.p_item); if (!it || it.price <= 0) return { ok: false, error: 'BAD_ITEM' }; if (g.owned.indexOf(a.p_item) >= 0) return { ok: false, error: 'OWNED' }; if (g.coins < it.price) return { ok: false, error: 'NO_COINS' }; g.coins -= it.price; g.owned.push(a.p_item); store.set('eco', g); return guestProfile(g); }
  if (name === 'fr_equip') { if (a.p_slot === 'avatar') { g.eq.avatar = clamp(a.p_item | 0, 0, 7); } else { it = itemInfo(a.p_item); if (!it || it.kind !== a.p_slot || (it.price > 0 && g.owned.indexOf(a.p_item) < 0)) return { ok: false, error: 'NOT_OWNED' }; g.eq[a.p_slot] = a.p_item; } store.set('eco', g); return guestProfile(g); }
  if (name === 'fr_set_loadout') { var l = a.p_weapons; if (!l.length || l.length > 4 || l.some(function (w, i) { return !WDEF[w] || l.indexOf(w) !== i || (WDEF[w].price > 0 && g.owned.indexOf('w_' + w) < 0); })) return { ok: false, error: 'BAD_LOADOUT' }; g.loadout = l; store.set('eco', g); return guestProfile(g); }
  if (name === 'fr_match_start') return { ok: true, match: 'local' };
  if (name === 'fr_match_end') { var rw = rewardFor({ mode: a.p_mode, kills: a.p_kills, streak: a.p_streak, win: a.p_win, draw: a.p_draw, wave: a.p_wave }); g.coins += rw.coins; g.xp += rw.xp; if (a.p_mode === 'tdm' && !a.p_draw) { if (a.p_win) g.wins++; else g.losses++; } store.set('eco', g); r = guestProfile(g); r.reward = rw; return r; }
  return { ok: false, error: 'UNKNOWN' };
}
function ecoCall(name, args, cb) {
  if (ACC.token && apiReady()) { args = args || {}; args.p_token = ACC.token; return rpc(name, args, cb); }
  var r = guestCall(name, args || {}); setTimeout(function () { cb(r); }, 0);
}
function ecoApply(r) {
  if (!r || !r.ok) return;
  ECO.coins = r.coins | 0; ECO.xp = r.xp | 0; ECO.wins = r.wins | 0; ECO.losses = r.losses | 0; ECO.daily = !!r.daily; ECO.owned = {}; (r.owned || []).forEach(function (id) { ECO.owned[id] = true; });
  var e = r.equipped || {}; ECO.eq.skin = owns(e.skin || '') && SKINS[e.skin] ? e.skin : 's_default'; ECO.eq.hat = owns(e.hat || '') && HATS[e.hat] ? e.hat : 'h_none'; ECO.eq.tracer = owns(e.tracer || '') && TRACERS[e.tracer] ? e.tracer : 't_default'; ECO.eq.cross = owns(e.cross || '') && CROSSES[e.cross] ? e.cross : 'c_default'; ECO.eq.avatar = clamp(e.avatar | 0, 0, 7);
  var l = (r.loadout || []).filter(function (w) { return WDEF[w] && owns('w_' + w); }); ECO.loadout = l.length ? l.slice(0, 4) : FREE_WEAPONS.slice();
  ECO.loaded = true; applyCosmetics(); refreshProfileUI(); if (H.shop && H.shop.classList.contains('on')) renderShop();
}
function applyCosmetics() {
  if (gun.skinMat) setSkinMat(gun.skinMat, ECO.eq.skin);
  gun.tracerColor = TRACERS[ECO.eq.tracer].color; ROOT.style.setProperty('--frx', CROSSES[ECO.eq.cross].css);
  refreshAvatar();
}
function ecoRefresh() { ecoCall('fr_profile', {}, function (r) { if (r.ok) ecoApply(r); else if (r.error === 'NOT_LOGGED_IN') { clearSession(); ecoRefresh(); } }); }
function ecoDaily() { ecoCall('fr_claim_daily', {}, function (r) { if (r.ok) { ecoApply(r); SFX.coin(); H.accMsg.textContent = 'ログインボーナス +' + (r.gained || 100) + ' コイン！'; } else { ECO.daily = false; refreshProfileUI(); } }); }
function ecoMatchStart(mode) { ECO.match = null; ecoCall('fr_match_start', { p_mode: mode }, function (r) { if (r.ok) ECO.match = r.match; }); }
function ecoMatchEnd(last) {
  H.rCoins.textContent = '報酬を計算中…'; H.rSave.textContent = '';
  var args = { p_match: ECO.match || 'local', p_mode: last.mode, p_kills: last.kills, p_heads: last.heads, p_streak: last.streak, p_win: !!last.win, p_draw: !!last.draw, p_wave: last.wave, p_score: last.score, p_acc: last.acc, p_time: last.time };
  if (ACC.token && !ECO.match) { H.rCoins.textContent = '報酬を受け取れませんでした（試合開始時にサーバーへ接続できませんでした）'; return; }
  ecoCall('fr_match_end', args, function (r) {
    if (!r.ok) { H.rCoins.textContent = '報酬を受け取れませんでした： ' + ecoErr(r); if (r.error === 'NOT_LOGGED_IN') clearSession(); return; }
    var before = levelOf(ECO.xp), rw = r.reward || {}; ecoApply(r); var lv = levelOf(ECO.xp);
    H.rCoins.innerHTML = 'コイン <em>+' + fmt(rw.coins | 0) + '</em>（キル ' + (rw.kills | 0) + '・連続キル ' + (rw.streak | 0) + '・試合 ' + (rw.finish | 0) + '）　所持 ' + fmt(ECO.coins) + (lv > before ? '<br><em>レベルアップ！ Lv ' + lv + ' ' + titleOf(lv) + '</em>' : '');
    if (rw.coins) SFX.coin();
    if (ACC.token) H.rSave.textContent = 'サーバーに保存しました（' + ACC.id + '）' + (last.mode === 'survival' && r.best != null ? '　自己ベスト ' + r.best + '　／　ランキング ' + r.rank + ' 位' : last.mode === 'tdm' ? '　チーム戦 ' + ECO.wins + ' 勝 ' + ECO.losses + ' 敗' : '');
    else H.rSave.textContent = 'ゲストの記録とコインはこの端末だけに保存されます';
  });
}
function ecoErr(r) { return { NO_COINS: 'コインが足りません', OWNED: 'すでに持っています', NOT_OWNED: 'まだ持っていません', BAD_LOADOUT: '持っていく武器は1〜4個にしてください', TOO_FAST: '試合が短すぎます', BAD_MATCH: 'この試合はすでに記録ずみです', BAD_RESULT: '結果を確認できませんでした', ALREADY: '今日はもう受け取りました' }[r.error] || errText(r); }
function refreshProfileUI() {
  if (!H.prof) return;
  var lv = levelOf(ECO.xp);
  H.prof.innerHTML = 'Lv ' + lv + ' ' + titleOf(lv) + '　｜　コイン <em>' + fmt(ECO.coins) + '</em>' + (ECO.wins + ECO.losses ? '　｜　チーム戦 ' + ECO.wins + ' 勝 ' + ECO.losses + ' 敗' : '');
  H.dailyBtn.style.display = ECO.daily ? 'block' : 'none'; H.dailyBtn.textContent = '今日のログインボーナスを受け取る（+100 コイン）';
  if (H.shopCoins) H.shopCoins.textContent = 'コイン ' + fmt(ECO.coins);
}

// ---- hats (procedural). Built for a character of height 1 with the head centre at y = 0.79
function makeHat(id) {
  var g = new THREE.Group(), m; g.position.y = 0.79;
  function add(geo, mat, x, y, z) { var o = new THREE.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; g.add(o); return o; }
  if (id === 'h_cap') { m = stdMat({ color: 0xc8322a, roughness: 0.8 }); add(new THREE.SphereGeometry(0.225, 16, 8, 0, 6.3, 0, 1.5), m, 0, 0.03, 0); add(new THREE.BoxGeometry(0.26, 0.02, 0.17), m, 0, 0.06, 0.25); }
  else if (id === 'h_helmet') { m = stdMat({ color: 0x4b5a35, roughness: 0.55, metalness: 0.4 }); add(new THREE.SphereGeometry(0.245, 16, 8, 0, 6.3, 0, 1.62), m, 0, 0.02, 0); add(new THREE.TorusGeometry(0.245, 0.016, 6, 20), m, 0, 0.02, 0).rotation.x = Math.PI / 2; }
  else if (id === 'h_party') { m = stdMat({ color: 0xff5fa8, roughness: 0.6 }); add(new THREE.ConeGeometry(0.11, 0.3, 14), m, 0, 0.33, 0); add(new THREE.SphereGeometry(0.035, 8, 6), stdMat({ color: 0xffe14a, roughness: 0.6 }), 0, 0.49, 0); }
  else if (id === 'h_tophat') { m = stdMat({ color: 0x101012, roughness: 0.45 }); add(new THREE.CylinderGeometry(0.24, 0.24, 0.016, 20), m, 0, 0.19, 0); add(new THREE.CylinderGeometry(0.15, 0.14, 0.24, 20), m, 0, 0.31, 0); add(new THREE.CylinderGeometry(0.145, 0.145, 0.04, 20), stdMat({ color: 0xa01c1c, roughness: 0.6 }), 0, 0.22, 0); }
  else if (id === 'h_crown') { m = stdMat({ color: 0xe6b422, roughness: 0.25, metalness: 1 }); add(new THREE.CylinderGeometry(0.16, 0.15, 0.09, 18, 1, true), m, 0, 0.24, 0).material.side = THREE.DoubleSide; for (var i = 0; i < 6; i++) { var a = i / 6 * 6.283; add(new THREE.ConeGeometry(0.035, 0.09, 6), m, Math.cos(a) * 0.15, 0.33, Math.sin(a) * 0.15); } add(new THREE.SphereGeometry(0.03, 8, 6), stdMat({ color: 0xd0202a, roughness: 0.2 }), 0, 0.25, 0.155); }
  return g;
}
function avatarFigure(idx, hat, team) {       // character of real size with an optional hat
  var g = new THREE.Group(), mat = null;
  if (team != null && MODELS[idx]) { mat = MODELS[idx].material.clone(); mat.color.set(team === 0 ? 0xa8ccff : 0xffaaa0); }
  g.add(makeFriendMesh(idx, mat)); if (hat && hat !== 'h_none') { var h = makeHat(hat); h.scale.setScalar(FRIEND_H); h.position.y *= FRIEND_H; g.add(h); }
  return g;
}
function refreshAvatar() {       // the player's character stands in the middle of the title line-up wearing the equipped hat
  if (!LINEUP.length) return;
  LINEUP.forEach(function (g, i) { for (var k = g.children.length - 1; k >= 0; k--) if (g.children[k].userData.hat) g.remove(g.children[k]); g.scale.setScalar(i === ECO.eq.avatar ? 1.12 : 1); });
  if (ECO.eq.hat !== 'h_none') { var h = makeHat(ECO.eq.hat); h.scale.setScalar(FRIEND_H); h.position.y *= FRIEND_H; h.userData.hat = true; LINEUP[ECO.eq.avatar].add(h); }
}

// ---- preview stage (shop preview and MVP display): a small turntable far from the arena
var STAGE = { on: false, root: null, kind: '', t: 0 };
function buildStage() {
  STAGE.root = new THREE.Group(); STAGE.root.position.set(0, 0, 210); scene.add(STAGE.root);
  var floor = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.12, 32), stdMat({ color: 0x1c1f24, roughness: 0.35, metalness: 0.6 })); floor.position.set(0, -0.06, 210); scene.add(floor); STAGE.floor = floor; floor.visible = false;
  STAGE.light = new THREE.PointLight(0xfff4e0, 0, 16, 1.5); STAGE.light.position.set(1.2, 2.4, 213.2); scene.add(STAGE.light);
}
function stageShow(o) {
  while (STAGE.root.children.length) STAGE.root.remove(STAGE.root.children[0]);
  STAGE.on = !!o; STAGE.floor.visible = STAGE.on; STAGE.light.intensity = STAGE.on ? 2.6 : 0; if (H.pvCross) H.pvCross.style.display = 'none';
  if (!o) return;
  STAGE.root.rotation.y = 0.5; STAGE.kind = o.gun ? 'gun' : 'avatar';
  if (o.gun) {
    var sm = makeSkinMat(o.skin || ECO.eq.skin), gm = buildGunModel(o.gun, sm, false); gm.g.scale.setScalar(1.9); gm.g.position.set(0, 1.15, 0.25); gm.g.rotation.y = Math.PI / 2; STAGE.root.add(gm.g);
    if (o.tracer) { var tb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 1.7), new THREE.MeshBasicMaterial({ color: TRACERS[o.tracer].color, blending: THREE.AdditiveBlending, transparent: true })); tb.rotation.y = Math.PI / 2; tb.position.set(0.2, 0.75, 0); STAGE.root.add(tb); }
  } else STAGE.root.add(avatarFigure(o.avatar, o.hat, o.team));
  if (o.cross && H.pvCross) { H.pvCross.style.display = 'block'; H.pvCross.style.setProperty('--frx', CROSSES[o.cross].css); }
}
function stageCamera(dt) {
  if (!STAGE.on) return false;
  STAGE.root.rotation.y += dt * 0.7;
  var res = G.state === 'result', gunK = STAGE.kind === 'gun', land = camera.aspect >= 1, d = land ? (gunK ? 3.1 : 3.5) : (gunK ? 3.6 : 3.3), cx = land ? (gunK ? 1.5 : 1.7) * (camera.aspect > 1.7 ? 1 : 0.7) : 0;
  camera.position.set(cx, 1.4, 210 + d); camera.rotation.set(0, 0, 0);
  camera.lookAt(cx, land ? (gunK ? 1.1 : 0.9) : (gunK ? -0.7 : res ? -1.7 : -1.3), 210);
  return true;
}

// ---- shop & loadout screen ---------------------------------------------------------------
var SHOP = { tab: 'weapon', sel: null, confirm: null };
var SHOP_TABS = [['weapon', '武器'], ['skin', 'スキン'], ['hat', 'ぼうし'], ['tracer', '弾の色'], ['cross', '照準'], ['avatar', 'キャラ']];
function buildShopUI() {
  var s = H.shop = el('div', 'fr-screen fr-shop', UI);
  var hd = el('div', 'fr-shophd', s); H.shopCoins = el('span', null, hd, ''); var back = el('span', null, hd, '✕ とじる'); back.style.cursor = 'pointer'; onTap(back, function () { SFX.ui(); stageShow(null); showScreen('title'); });
  H.pvName = el('div', 'fr-pvname', s, '');
  H.pvCross = el('div', 'fr-cross fr-pvcross', s); [[-16, -1, 9, 2], [7, -1, 9, 2], [-1, -16, 2, 9], [-1, 7, 2, 9], [-1.5, -1.5, 3, 3]].forEach(function (r) { var b = el('b', null, H.pvCross); b.style.cssText = 'left:' + r[0] + 'px;top:' + r[1] + 'px;width:' + r[2] + 'px;height:' + r[3] + 'px'; });
  H.shopTabs = el('div', 'fr-tabs', s); H.shopTabEls = {};
  SHOP_TABS.forEach(function (t) { var sp = el('span', null, H.shopTabs, t[1]); H.shopTabEls[t[0]] = sp; onTap(sp, function () { SFX.ui(); SHOP.tab = t[0]; SHOP.sel = null; SHOP.confirm = null; renderShop(); }); });
  H.shopList = el('div', 'fr-list fr-scroll', s);
  H.shopMsg = el('p', 'fr-note', s, '');
  SCREENS.push('shop');
}
function openShop() { SHOP.sel = null; SHOP.confirm = null; showScreen('shop'); renderShop(); ecoRefresh(); }
function shopItems(tab) {
  if (tab === 'weapon') return WORDER.map(function (w) { return 'w_' + w; });
  if (tab === 'avatar') return [0, 1, 2, 3, 4, 5, 6, 7];
  return Object.keys({ skin: SKINS, hat: HATS, tracer: TRACERS, cross: CROSSES }[tab]);
}
function shopPreview(id) {
  var t = SHOP.tab, it = t === 'avatar' ? { name: FRIEND_NAMES[id] } : itemInfo(id);
  H.pvName.textContent = it.name + (it.info ? '　' + it.info : '');
  if (t === 'weapon') stageShow({ gun: id.slice(2) }); else if (t === 'skin') stageShow({ gun: curPreviewGun(), skin: id }); else if (t === 'tracer') stageShow({ gun: curPreviewGun(), tracer: id });
  else if (t === 'hat') stageShow({ avatar: ECO.eq.avatar, hat: id }); else if (t === 'cross') stageShow({ gun: curPreviewGun(), cross: id }); else stageShow({ avatar: id, hat: ECO.eq.hat });
}
function curPreviewGun() { return ECO.loadout[0] || 'ar'; }
function renderShop() {
  var t = SHOP.tab, list = shopItems(t); refreshProfileUI();
  SHOP_TABS.forEach(function (x) { H.shopTabEls[x[0]].classList.toggle('on', x[0] === t); });
  if (SHOP.sel == null) SHOP.sel = t === 'weapon' ? 'w_' + curPreviewGun() : t === 'avatar' ? ECO.eq.avatar : ECO.eq[t];
  var keep = H.shopList.scrollTop; H.shopList.innerHTML = '';
  H.shopMsg.textContent = (t === 'weapon' ? '持っていける武器は4つまで（' + ECO.loadout.length + ' / 4）。' : t === 'hat' || t === 'avatar' ? 'キャラとぼうしは、タイトル画面・結果画面の MVP 表示で見られます。' : '') + (ACC.token ? '' : '　ゲストのコインと持ち物はこの端末だけに保存されます。端末を変えたりデータを消したりすると無くなります。');
  list.forEach(function (id) {
    var it = t === 'avatar' ? { name: FRIEND_NAMES[id], price: 0 } : itemInfo(id), has = t === 'avatar' || owns(id), row = el('div', 'fr-item' + (SHOP.sel === id ? ' sel' : ''), H.shopList), d = el('div', null, row, it.name);
    var sub = t === 'weapon' ? it.info + '　弾 ' + WDEF[id.slice(2)].mag : (it.price > 0 ? fmt(it.price) + ' コイン' : '無料'); el('small', null, d, sub + (t === 'weapon' && it.price > 0 && !has ? '　／　' + fmt(it.price) + ' コイン' : ''));
    var b = el('button', null, row), on;
    if (!has) { b.className = 'buy' + (ECO.coins < it.price ? ' no' : ''); b.textContent = SHOP.confirm === id ? 'もう一度押す' : '購入 ' + fmt(it.price); }
    else if (t === 'weapon') { on = ECO.loadout.indexOf(id.slice(2)) >= 0; b.className = on ? 'eq' : ''; b.textContent = on ? '持っていく ✓' : '持っていく'; }
    else { on = t === 'avatar' ? ECO.eq.avatar === id : ECO.eq[t] === id; b.className = on ? 'eq' : ''; b.textContent = on ? '装備中' : '装備する'; }
    onTap(row, function () { SHOP.sel = id; if (SHOP.confirm !== id) SHOP.confirm = null; shopPreview(id); renderShop(); });
    onTap(b, function (ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); SHOP.sel = id; shopPreview(id); shopAction(id, has); });
  });
  H.shopList.scrollTop = keep;
  if (!STAGE.on || SHOP.fresh !== t) { SHOP.fresh = t; shopPreview(SHOP.sel); }
}
function shopAction(id, has) {
  var t = SHOP.tab;
  function done(r) { if (r.ok) { ecoApply(r); SFX.coin(); } else { H.shopMsg.textContent = ecoErr(r); SFX.empty(); } SHOP.confirm = null; renderShop(); if (!r.ok) H.shopMsg.textContent = ecoErr(r); }
  if (!has) {
    if (ECO.coins < itemInfo(id).price) { renderShop(); H.shopMsg.textContent = 'コインが足りません（あと ' + fmt(itemInfo(id).price - ECO.coins) + '）'; SFX.empty(); return; }
    if (SHOP.confirm !== id) { SHOP.confirm = id; renderShop(); return; }
    return ecoCall('fr_buy', { p_item: id }, done);
  }
  if (t === 'weapon') {
    var w = id.slice(2), l = ECO.loadout.slice(), i = l.indexOf(w);
    if (i >= 0) { if (l.length <= 1) { renderShop(); H.shopMsg.textContent = '武器は最低1つ必要です'; return; } l.splice(i, 1); } else { if (l.length >= 4) { renderShop(); H.shopMsg.textContent = '持っていけるのは4つまでです。先にどれかを外してください'; SFX.empty(); return; } l.push(w); }
    return ecoCall('fr_set_loadout', { p_weapons: l }, done);
  }
  ecoCall('fr_equip', { p_slot: t, p_item: String(id) }, done);
}
