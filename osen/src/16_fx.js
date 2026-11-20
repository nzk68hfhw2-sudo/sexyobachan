// ---- さわれる物の実体化と反応 -----------------------------------------------------------
var PROPS = [], SPAWNED = [], WA3D = [];
var PROP_BY_ID = {};
function placeProps(scene) {
  propGeos();
  PROP_DEFS.forEach(function (d) {
    var obj, center = new THREE.Vector3(), rad = d.rad || 0.9, p = d.p ? d.p.slice() : [0, 0, 0], rot = d.r || 0, fr = null;
    if (d.b === 'statue') {
      var i = d.fr, pa = i / 8 * TAU + PI / 8; p = [Math.cos(pa) * 10, 0.8, Math.sin(pa) * 10]; rot = Math.atan2(-p[0], -p[2]);
      fr = addFriend(d.fr, p[0], p[1], p[2], rot, 1.05, { tint: 0xf0e2c8, col: false, area: 'koen' }); obj = fr.mesh; fr.statue = true;
      center.set(p[0], p[1] + 0.7, p[2]); rad = 1.0;
    } else if (d.b === 'friend') {
      fr = addFriend(d.fr, p[0], p[1], p[2], rot, d.s || 1, { tint: d.tint, area: d.a }); obj = fr.mesh;
      center.set(p[0], p[1] + 0.7 * (d.s || 1), p[2]); rad = 1.0 * (d.s || 1);
    } else {
      obj = new THREE.Group(); if (BUILD[d.b]) BUILD[d.b](obj, d.o || {});
      obj.position.set(p[0], p[1], p[2]); obj.rotation.y = rot; scene.add(obj);
      center.set(p[0], p[1] + (d.col ? d.col[1] * 0.5 : (d.b === 'proxy' ? 0 : 0.35)), p[2]);
      if (d.col) { var sw = Math.abs(Math.sin(rot)) > 0.7, w = sw ? d.col[2] : d.col[0], dd = sw ? d.col[0] : d.col[2]; colAdd(p[0] - w / 2, p[1], p[2] - dd / 2, p[0] + w / 2, p[1] + d.col[1], p[2] + dd / 2, 'prop'); rad = d.rad || Math.max(d.col[0], d.col[2]) * 0.6 + 0.45; }
    }
    var pr = { def: d, obj: obj, center: center, rad: rad, count: 0, fr: fr, base: obj.position.clone(), baseRot: obj.rotation.y, scl: 1, sclT: 1, spin: 0, hop: 0, floatT: 0, clones: 0 };
    PROPS.push(pr); PROP_BY_ID[d.id] = pr;
  });
  // 存在しない部屋の８人
  for (var k = 0; k < 8; k++) addFriend(k, -7 + k * 2, 0.03, 404, 0, 1, { area: 'nai', look: true, col: false }).naiRow = true;
  // 大きいメガ根
  var gm = addFriend(5, 65, 0, 103, PI + 0.5, 11, { col: false, area: 'akichi' }); gm.giant = true;
  colAdd(63.4, 0, 101.6, 66.6, 6, 104.4);
}
var _ray = null, _tmp = null;
function findTarget() {
  if (!_ray) { _ray = new THREE.Vector3(); _tmp = new THREE.Vector3(); }
  var cam = R.camera; _ray.set(0, 0, -1).applyQuaternion(cam.quaternion);
  var best = null, bt = 1e9, o = cam.position;
  for (var i = 0; i < PROPS.length; i++) {
    var pr = PROPS[i], c = pr.center;
    if (pr.def.id === 'water') { c.set(clamp(P.pos.x, -160, 160), -0.3, 49.5); }
    var dx = c.x - o.x, dy = c.y - o.y, dz = c.z - o.z, d2 = dx * dx + dy * dy + dz * dz, rr = pr.rad * Math.max(1, pr.scl);
    if (d2 > (4.2 + rr) * (4.2 + rr)) continue;
    var t = dx * _ray.x + dy * _ray.y + dz * _ray.z; if (t < 0) continue;
    var perp2 = d2 - t * t;
    if (perp2 < rr * rr && t < bt) { bt = t; best = pr; }
  }
  return best;
}
// ---- さわる ---------------------------------------------------------------------------
var FX_POOL = ['wa', 'jump', 'spin', 'grow', 'multiply', 'confetti', 'tint', 'sky', 'tilt', 'float', 'friend', 'rain', 'fov', 'grav', 'speed', 'babble', 'bigwa', 'shrink', 'time', 'fog'];
var BIG_WORDS = ['ＧＲＥＡＴ!!', 'すごい!!', 'ナイス!!', '感動!!', '奇跡', 'ＮＩＣＥ', 'ありがとう', 'おめでとう', 'ＳＵＰＥＲ', '最高', '伝説', 'ＷＯＷ!!', '本日の主役', '愛', '虹色', '精神汚染', '汚染完了', 'ＨＡＰＰＹ', 'わーい', 'たのしい', '大成功', 'ふしぎ', 'ちょうど', 'ＮＥＷ!!'];
function touchProp(pr) {
  var d = pr.def, n = pr.count; pr.count++;
  G.touches++;
  var first = n === 0;
  if (first) { zukanFind(d.b === 'friend' || d.b === 'statue' ? 'f_' + d.fr : 'p_' + d.id, d.n); }
  if (d.b === 'friend' && !d.tint && d.a !== 'jinja') { G.metFriends[d.fr] = 1; }
  addPollution(first ? 3 : 1.2 + Math.random());
  var line = n < d.l.length ? d.l[n] : pick(TOUCH_MORE).replace(/\{n\}/g, d.n.replace(/（.*）/, ''));
  var fx = n < d.fx.length ? d.fx[n] : pick(FX_POOL);
  if (d.fx[0] === 'statue' || d.fx[0] === 'omikuji' || d.fx[0] === 'exit') fx = d.fx[0];
  var speak = d.b === 'friend' || fx === 'babble' || /「/.test(line);
  if (fx !== 'omikuji' && fx !== 'exit') caption(line, { speak: speak, preset: speak ? pick(['type', 'wave', 'fade']) : null });
  sfx('touch');
  doFx(fx, pr);
  if (n > 0 && (n + 1) % 5 === 0) setTimeout(function () { doFx('bigwa', pr); }, 600);
  if (n === 12) setTimeout(function () { popWA('１３回目の奇跡', { big: true, style: 10 }); doFx('multiply', pr); doFx('grow', pr); }, 900);
  if (d.id === 'clock' && pr.count === 13) { setTimeout(function () { G.naiTarget = 1; G.naiTimer = 60; secret('clock13'); }, 800); }
  if (d.id === 'riverVend') secret('river');
  if (d.id === 'crown') secret('crown');
  if (d.id === 'shedDoor') teleportNai();
  checkFriendsAll();
  saveGame();
}
function doFx(fx, pr) {
  var o = pr && pr.obj, d = pr && pr.def;
  switch (fx) {
    case 'wa': popWA(pick([d ? d.n.replace(/（.*）/, '') : '?', pick(BIG_WORDS)]), {}); break;
    case 'bigwa': popWA(pick(BIG_WORDS), { big: true }); break;
    case 'touch': break;
    case 'coin': case 'bell': case 'meow': case 'quack': case 'splash': case 'boing': case 'error': case 'pop': sfx(fx); break;
    case 'babble': break;
    case 'confetti': confetti(16); sfx('chime'); break;
    case 'rain': rainObjects(pr); sfx('whoosh'); break;
    case 'multiply': multiplyProp(pr, randi(3, 5)); sfx('pop'); break;
    case 'grow': pr.sclT = Math.min(pr.sclT * 1.5, 7); sfx('grow'); break;
    case 'shrink': pr.sclT = Math.max(pr.sclT * 0.6, 0.25); sfx('down'); break;
    case 'spin': pr.spin = 14; sfx('whoosh'); break;
    case 'jump': pr.hop = 1; sfx('boing'); break;
    case 'jump8': WORLD.friends.forEach(function (f) { if (f.naiRow) f.hopT = 1 + Math.random(); }); sfx('boing'); break;
    case 'float': pr.floatT = 6; sfx('up'); break;
    case 'grav': P.gravMul = 0.28; P.gravT = 15; caption('重力が　よわく　なった。（１５秒）', { preset: 'zoom' }); sfx('up'); break;
    case 'heavy': P.gravMul = 2.3; P.gravT = 10; caption('重力が　つよく　なった。からだが　おもい。', { preset: 'drop' }); sfx('down'); break;
    case 'shrinkMe': P.scaleTarget = 0.3; P.scaleT = 15; caption('自分が　小さくなった。', { preset: 'zoom' }); sfx('down'); break;
    case 'speed': P.speedMul = 2; P.speedT = 12; caption('足が　はやくなった（１２秒）', { preset: 'flyL' }); sfx('up'); break;
    case 'sky': G.skyHue = Math.random(); G.skyT = 25; sfx('sky'); break;
    case 'time': G.tod = (Math.floor(G.tod) + 1) % 4 + 0.02; sfx('chime'); break;
    case 'night': G.tod = 3.02; sfx('chime'); break;
    case 'tint': G.tintT = 10; G.tintC = new THREE.Color().setHSL(Math.random(), 0.9, 0.7); sfx('sky'); break;
    case 'fog': G.fogT = 12; G.fogC = new THREE.Color().setHSL(Math.random(), 0.7, 0.75); sfx('whoosh'); break;
    case 'fov': G.fovT = 6; sfx('warp'); break;
    case 'tilt': G.tiltT = 5; G.tiltA = (Math.random() < 0.5 ? -1 : 1) * (REDUCED.on ? 0.08 : 0.25); sfx('whoosh'); break;
    case 'flip': if (REDUCED.on) { doFx('tilt', pr); break; } G.flipT = 6; sfx('warp'); break;
    case 'friend': popFriendNear(pr); sfx('pop'); break;
    case 'music': var ks = Object.keys(SONGS); bgmPlay(pick(ks)); G.musicLock = 40; break;
    case 'clean': cleanPollution(rand(8, 14)); break;
    case 'warp': var w = pick(WARP_POINTS); teleport(w[0], groundAt(w[0], w[2], 30, 0.3), w[2], w[3]); sfx('warp'); caption('……気がついたら　別の場所にいた。', { preset: 'fade' }); break;
    case 'train': popWA('電车が　まいります', { style: 1, anim: 'waSlide', dur: 3.2, y: 0.3, size: 90, big: false, w: 0.95 }); sfx('train'); break;
    case 'statue': statueTouch(pr); break;
    case 'omikuji': var r = pick(OMIKUJI); popWA(r[0], { big: true, style: r[0] === 'ワードアート吉' ? 0 : 13 }); caption('おみくじ「' + r[0] + '」…' + r[1], { preset: 'type' }); sfx('bell'); if (r[0] === '大吉') cleanPollution(15); break;
    case 'exit': caption('ドアを開けた。……もとの場所に　もどってきた。', { preset: 'fade' }); teleport(88, 0.03, 101.5, PI); sfx('warp'); break;
  }
}
function statueTouch(pr) {
  var i = pr.def.fr;
  pr.hop = 1;
  if (i === G.statueNext) { G.statueNext++; sfx('chime'); if (G.statueNext === 4) { G.statueNext = 0; secret('order'); } }
  else { G.statueNext = (i === 0) ? 1 : 0; sfx('touch'); }
}
var WARP_POINTS = [[0, 0, -46, 0], [50, 0, -10, 0], [-70, 0, 0, PI / 2], [0, 0, 10, 0], [10, 0, 42, PI], [60, 0, 90, 0], [-80, 5, -86, 0]];
function multiplyProp(pr, n) {
  if (G.cloneCount > (LITE.on ? 60 : 140) || pr.clones > 14) return;
  for (var i = 0; i < n; i++) {
    var c;
    if (pr.fr) { var f = addFriend(pr.fr.idx, pr.base.x, pr.base.y, pr.base.z, rand(0, TAU), pr.fr.scale / 1.18 * rand(0.7, 1.2), { clone: true, lo: true, col: false }); c = f.mesh; f.wander = true; f.vel = new THREE.Vector3(rand(-3, 3), rand(3, 6), rand(-3, 3)); f.life = 60; }
    else { c = pr.obj.clone(); c.position.copy(pr.obj.position); R.scene.add(c); SPAWNED.push({ o: c, v: new THREE.Vector3(rand(-3, 3), rand(3, 6), rand(-3, 3)), life: 45, spin: rand(-4, 4), bounce: true }); }
    pr.clones++; G.cloneCount++;
  }
}
function rainObjects(pr) {
  var src = pr && pr.def.b !== 'proxy' && pr.def.b !== 'friend' && pr.def.b !== 'statue' ? pr.obj : null;
  var n = LITE.on ? 8 : 16;
  for (var i = 0; i < n; i++) {
    var c;
    if (src && Math.random() < 0.6) c = src.clone();
    else { c = new THREE.Group(); BUILD[pick(['duck', 'duck', 'cone', 'daruma', 'frog'])](c, {}); }
    c.position.set(P.pos.x + rand(-8, 8), P.pos.y + rand(10, 22), P.pos.z + rand(-8, 8));
    R.scene.add(c); SPAWNED.push({ o: c, v: new THREE.Vector3(0, -rand(0, 3), 0), life: 12, spin: rand(-6, 6), bounce: true, rain: true });
  }
}
function popFriendNear(pr) {
  var a = rand(0, TAU), x = (pr ? pr.base.x : P.pos.x) + Math.cos(a) * 2, z = (pr ? pr.base.z : P.pos.z) + Math.sin(a) * 2;
  var f = addFriend(randi(0, 7), x, groundAt(x, z, P.pos.y + 3, 0.3), z, 0, 1, { clone: true, lo: true, col: false, look: true });
  f.life = 20; f.popIn = 0; G.cloneCount++;
}
function updateProps(dt, t) {
  for (var i = 0; i < PROPS.length; i++) {
    var pr = PROPS[i], o = pr.obj;
    if (pr.scl !== pr.sclT) { pr.scl = lerp(pr.scl, pr.sclT, 1 - Math.exp(-dt * 4)); if (Math.abs(pr.scl - pr.sclT) < 0.001) pr.scl = pr.sclT; if (!pr.fr) o.scale.set(pr.scl, pr.scl, pr.scl); }
    if (pr.fr) { pr.fr.pscl = pr.scl; pr.fr.spinning = pr.spin > 0; }
    if (pr.spin > 0) { o.rotation.y += pr.spin * dt; pr.spin = Math.max(0, pr.spin - dt * 4); if (pr.spin === 0) o.rotation.y = pr.baseRot; }
    var y = pr.base.y;
    if (pr.hop > 0) { pr.hop = Math.max(0, pr.hop - dt * 1.8); y += Math.sin((1 - pr.hop) * PI) * 0.8; }
    if (pr.floatT > 0) { pr.floatT = Math.max(0, pr.floatT - dt); y += Math.sin(Math.min(1, (6 - pr.floatT) / 1.5, pr.floatT / 1.5) * PI / 2) * 3 + Math.sin(t * 3) * 0.2; }
    if (!pr.fr) o.position.y = y; else pr.fr.extraY = y - pr.base.y;
    o.traverse && pr.def.b === 'barber' && o.children.forEach(function (c) { if (c.name === 'spin') c.rotation.y += dt * 3; });
    if (pr.def.b === 'garapon' && pr.spin > 0) o.children.forEach(function (c) { if (c.name === 'spin2') c.rotation.y += dt * 10; });
    if (pr.def.b === 'tv' || pr.def.b === 'oldtv') o.children.forEach(function (c) { if (c.name === 'screen') c.material.color.setHSL((t * 0.2) % 1, 0.8, 0.6); });
    if (pr.def.b === 'cat') o.children.forEach(function (c) { if (c.name === 'tail') c.rotation.z = Math.sin(t * 3) * 0.4; });
  }
  for (i = SPAWNED.length - 1; i >= 0; i--) {
    var s2 = SPAWNED[i]; s2.life -= dt;
    if (s2.life <= 0) { R.scene.remove(s2.o); SPAWNED.splice(i, 1); if (!s2.rain) G.cloneCount = Math.max(0, G.cloneCount - 1); continue; }
    s2.v.y -= 12 * dt; s2.o.position.addScaledVector(s2.v, dt); s2.o.rotation.y += s2.spin * dt;
    var gy = terrainY(s2.o.position.x, s2.o.position.z);
    if (s2.o.position.y < gy) { s2.o.position.y = gy; s2.v.y = s2.bounce ? Math.abs(s2.v.y) * 0.35 : 0; s2.v.x *= 0.6; s2.v.z *= 0.6; s2.spin *= 0.6; }
    if (s2.life < 1) s2.o.scale.setScalar(Math.max(0.01, s2.life));
  }
}
// ---- 友達の動き ------------------------------------------------------------------------
function updateFriends(dt, t) {
  var stage = G.stage, big = stage >= 4 ? 1 + smooth((G.pol - 60) / 40) * 1.4 + (G.pol > 130 ? 1.5 : 0) : 1;
  var cam = R.camera.position;
  for (var i = WORLD.friends.length - 1; i >= 0; i--) {
    var f = WORLD.friends[i], m = f.mesh;
    if (f.life != null) { f.life -= dt; if (f.life <= 0) { R.scene.remove(m); WORLD.friends.splice(i, 1); G.cloneCount = Math.max(0, G.cloneCount - 1); continue; } }
    var dx = cam.x - m.position.x, dz = cam.z - m.position.z, dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 140 && !f.giant) { m.visible = false; continue; } m.visible = true;
    if (f.vel) { // 増えた友達（飛び出す）
      f.vel.y -= 12 * dt; m.position.addScaledVector(f.vel, dt);
      var gy = terrainY(m.position.x, m.position.z); if (m.position.y < gy) { m.position.y = gy; f.vel.set(0, 0, 0); f.vel = null; f.base.copy(m.position); }
      continue;
    }
    var bigK = f.statue || f.naiRow || f.giant ? 1 : lerp(1, big, clamp((dist - 5) / 12, 0, 1));
    var s = f.scale * bigK * (f.popIn != null ? Math.min(1, (f.popIn += dt * 3)) : 1);
    var breath = 1 + Math.sin(t * 2 + f.phase) * 0.012;
    var pscl = f.pscl || 1;
    m.scale.set(s * pscl, s * breath * pscl, s * pscl);
    var y = f.base.y + (f.extraY || 0);
    if (f.hopT > 0) { f.hopT = Math.max(0, f.hopT - dt * 1.5); y += Math.abs(Math.sin(f.hopT * PI * 2)) * 0.6; }
    if (f.skyWalk) { y = 38 + Math.sin(t * 0.5 + f.phase) * 2; m.position.x += Math.cos(f.phase) * dt * 2; m.position.z += Math.sin(f.phase) * dt * 2; }
    if (f.wander && stage >= 4 && dist < 60) { // 汚染が進むと近づいてくる
      var sp = 0.6 + stage * 0.12; if (dist > 4.5) { m.position.x += dx / dist * sp * dt; m.position.z += dz / dist * sp * dt; }
    }
    m.position.y = y;
    var wantLook = f.look || (stage >= 4 && !f.giant) || (f.statue && G.statueLook) || (dist < 6 && !f.statue);
    if (f.spinning) { }
    else if (wantLook && dist > 0.5) { var ty = Math.atan2(dx, dz); m.rotation.y += angDiff(m.rotation.y, ty) * Math.min(1, dt * (f.statue ? 1 : 2.5)); }
    else if (!f.vel) m.rotation.y += angDiff(m.rotation.y, f.rot) * Math.min(1, dt * 1.5);
    if (G.pol > 200 && f.clone) m.rotation.z = Math.sin(t + f.phase) * 0.3;
  }
}
// ---- 3D のワードアート（汚染が進むと町にうかぶ） --------------------------------------------
function spawnWA3D(text) {
  if (WA3D.length > (LITE.on ? 6 : 14)) return;
  var c = wordArt(text || pick(BIG_WORDS.concat(AREAS.map(function (a) { return a.wa; }))), { style: randi(0, WA_STYLES.length - 1), size: 64 });
  var tex = canvasTex(c, false), mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
  var sp = new THREE.Sprite(mat), k = rand(4, 9); sp.scale.set(k, k * c.height / c.width, 1);
  var a = rand(0, TAU), r = rand(8, 22); sp.position.set(P.pos.x + Math.cos(a) * r, P.pos.y + rand(3, 9), P.pos.z + Math.sin(a) * r);
  R.scene.add(sp); WA3D.push({ s: sp, life: rand(8, 14), max: 0, ph: rand(0, 10), tex: tex });
}
function updateWA3D(dt, t) {
  for (var i = WA3D.length - 1; i >= 0; i--) {
    var w = WA3D[i]; w.life -= dt; w.max += dt;
    w.s.position.y += Math.sin(t * 1.5 + w.ph) * dt * 0.6;
    w.s.material.rotation = Math.sin(t + w.ph) * 0.2;
    w.s.material.opacity = Math.min(1, w.max * 2, w.life);
    if (w.life <= 0) { R.scene.remove(w.s); w.s.material.dispose(); w.tex.dispose(); WA3D.splice(i, 1); }
  }
}
// ---- 汚染 -----------------------------------------------------------------------------
function addPollution(v) { G.pol = Math.max(0, G.pol + v * (G.pol >= 100 ? 1.4 : 1)); }
function cleanPollution(v) {
  var before = G.pol; G.pol = Math.max(0, G.pol - v);
  sfx('clean'); caption2(pick(CLEAN_LINES)); popWA('－' + Math.round(before - G.pol) + '％', { style: 4, x: 0.25, y: 0.18, size: 54, anim: 'waFloat' });
  G.cleaned += before - G.pol; if (G.cleaned > 60) secret('clean');
}
function stageOf(v) { var s = 0; for (var i = 0; i < STAGES.length; i++) if (v >= STAGES[i].at) s = i; return s; }
function onStageChange(prev, s) {
  var st = STAGES[s];
  zukanFind('s_' + s, '汚染：' + st.name);
  if (s > prev) { sfx('stage'); popWA(st.wa, { big: true, style: [12, 0, 5, 3, 7, 14, 10, 1, 15, 9, 6][s] }); caption(st.desc, { preset: 'type', color: 'y' }); }
  redrawSigns(signLevel(s));
  AUD.stage = s;
  // 100%より上：地面がワードアート
  var crazyGround = s >= 8;
  ['ground_grass', 'ground_asphalt', 'ground_tiles', 'ground_dirt', 'ground_side'].forEach(function (k) { var m = MATS[k]; if (!m) return; if (!m._orig) m._orig = m.map; var want = crazyGround ? TEX.checker : m._orig; if (m.map !== want) { m.map = want; m.needsUpdate = true; } });
  if (s >= 8 && !R.upperTown) buildUpperTown();
  if (R.upperTown) R.upperTown.visible = s >= 8;
  if (s >= 9 && !G.skyWalkers) { G.skyWalkers = true; for (var i = 0; i < 8; i++) { var f = addFriend(i, rand(-60, 60), 38, rand(-60, 60), rand(0, TAU), 3, { clone: true, lo: true, col: false }); f.skyWalk = true; } }
  if (s >= 9) { G.naiTarget = 1; G.naiTimer = 99999; }
  else if (G.naiTimer > 1000) { G.naiTimer = 0; G.naiTarget = 0; }
  if (s < 9 && G.skyWalkers) { G.skyWalkers = false; WORLD.friends.forEach(function (f) { if (f.skyWalk) f.life = 0.01; }); }
}
function buildUpperTown() {
  var g = new THREE.Group();
  WORLD.statics.forEach(function (m) { var c = new THREE.Mesh(m.geometry, m.material); c.matrixAutoUpdate = true; g.add(c); });
  g.scale.set(1, -1, 1); g.position.y = 75; g.rotation.y = 0.4;
  R.scene.add(g); R.upperTown = g;
}
// ---- 隠し要素 ---------------------------------------------------------------------------
var SECRETS = [
  { id: 'back', n: 'うしろ歩きの民', d: '後ろ向きに３０ｍ歩いた。音楽が少し　逆さまに　なる。汚染率が少し下がる。' },
  { id: 'still', n: '静止の美学', d: '２０秒じっとしていた。８人が　まわりに　集まってくる。' },
  { id: 'order', n: 'よにん揃った', d: '公園の像を「髪の長い女の子から順に」なでた。空が虹色になる。' },
  { id: 'roof', n: '屋根の上の人', d: '駅の工事中の足場をのぼって、屋根の上に立った。' },
  { id: 'danchiRoof', n: '団地の屋上', d: '３号棟の外階段を、いちばん上までのぼった。' },
  { id: 'nai', n: '存在しない部屋に入った', d: '空き地の物置から、存在しない部屋に入った。' },
  { id: 'wrap', n: '町は丸い', d: '町のはしまで歩くと、反対側から出てくる。３回ためした。' },
  { id: 'lookup', n: '空の顔', d: '真上を８秒見つめていると、空から誰かがのぞきこむ。' },
  { id: 'jump50', n: 'ジャンプ中毒', d: '５０回ジャンプした。しばらく体が軽くなる。' },
  { id: 'river', n: '川底の自販機', d: '川を東の方へ、ずっと歩いた所の水の中にある自販機。' },
  { id: 'clock13', n: '２５時６１分', d: '駅前の時計を１３回さわった。存在しない時間がおとずれる。' },
  { id: 'crown', n: '土管の王様', d: '空き地の土管のいちばん上の王冠にさわった。木箱をのぼる。' },
  { id: 'meter', n: 'メーター叩き', d: '画面の汚染率メーターを７回たたいた。たたくと汚染率が上がる（たたきすぎ注意）。' },
  { id: 'nightPark', n: 'よるの像', d: '夜に公園の噴水のそばに立つと、８人の像がこちらを向く。' },
  { id: 'allFriends', n: 'はちにん全員と知り合い', d: '町にいる８人（像ではない方）全員にさわった。' },
  { id: 'bath', n: 'ぬるま湯', d: '川の中に３０秒いた。こころが　ぬるくなり、汚染率が下がる。' },
  { id: 'clean', n: '浄化マニア', d: '汚染率を合計６０％以上下げた。それでも町はもどらない。' },
  { id: 'over100', n: '１００％の向こう', d: '汚染率が１００％を超えた。空に町がさかさまに浮かぶ。' }
];
function secret(id) {
  if (G.secrets[id]) return; G.secrets[id] = 1;
  var s = SECRETS.filter(function (x) { return x.id === id; })[0]; if (!s) return;
  zukanFind('x_' + id, s.n);
  popWA(s.n, { big: true, style: 0, shape: 'arcUp' }); confetti(20); sfx('wa');
  caption('ひみつ発見!!「' + s.n + '」', { preset: 'zoom', color: 'y', now: true });
  addPollution(4);
  switch (id) {
    case 'back': AUD.reverse = true; cleanPollution(5); break;
    case 'still': for (var i = 0; i < 8; i++) { var a = i / 8 * TAU, x = P.pos.x + Math.cos(a) * 4.5, z = P.pos.z + Math.sin(a) * 4.5; var f = addFriend(i, x, groundAt(x, z, P.pos.y + 1, 0.3), z, 0, 1, { clone: true, lo: true, col: false, look: true }); f.life = 25; f.popIn = 0; G.cloneCount++; } cleanPollution(5); break;
    case 'order': G.crazySkyT = 30; break;
    case 'lookup': skyFace(); break;
    case 'jump50': P.gravMul = 0.4; P.gravT = 30; break;
    case 'bath': cleanPollution(10); break;
    case 'nightPark': G.statueLook = true; break;
  }
  saveGame();
}
function skyFace() {
  var f = addFriend(randi(0, 7), P.pos.x, P.pos.y + 70, P.pos.z, 0, 40, { clone: true, col: false });
  f.mesh.rotation.x = PI; f.base.y = P.pos.y + 75; f.life = 10; f.popIn = 0;
  sfx('warp');
}
function teleportNai() { sfx('warp'); popWA('存在しない部屋', { big: true, style: 10 }); teleport(0, 0.03, 416, 0); secret('nai'); }
function checkFriendsAll() { var n = 0; for (var i = 0; i < 8; i++) if (G.metFriends[i]) n++; if (n >= 8) secret('allFriends'); }
function onWrap() { caption(pick(['町のはしまで来た。……反対側から　出てきた。', '町は　丸いらしい。', 'また　ここに　もどってきた。']), { preset: 'fade' }); sfx('warp'); if (P.wraps >= 3) secret('wrap'); }
