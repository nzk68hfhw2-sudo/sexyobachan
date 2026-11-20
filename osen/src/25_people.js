// ---- 住人：ふえる・ふっとぶ・起き上がって文句・持って投げる・反応・やじ馬 -----------------------------
var NPCHELD = { n: null };
var CHAOS = { x: 0, z: 0, heat: 0 };
var NPC_UID = 0;
var MOB_SPOTS = [[-26, -64, -6, -42], [6, -64, 26, -42], [-18, -20, 18, 20], [46, -28, 54, 24], [-92, -40, -54, -24], [-92, -6, -54, 12], [-60, 40, 60, 45], [36, 78, 100, 114], [-24, -36, 24, -28], [-80, -78, -78, -70]];
var MOB_TINTS = [0xffd0d0, 0xd0e8ff, 0xd8ffd0, 0xfff0b0, 0xf0d0ff, 0xffe0c0, 0xc8fff4, 0xffffff, 0xffb8d8, 0xb8c8ff];
function initMobs() {
  NPCS.forEach(function (n) { n.uid = ++NPC_UID; n.temper = pick(['angry', 'flee', 'photo', 'clap', 'grumble']); });
  var cnt = LITE.on ? TUNE.mobsLite : TUNE.mobs;
  for (var i = 0; i < cnt; i++) {
    var sp = MOB_SPOTS[i % MOB_SPOTS.length], x = 0, z = 0, ok = false;
    for (var tr = 0; tr < 12 && !ok; tr++) { x = rand(sp[0], sp[2]); z = rand(sp[1], sp[3]); ok = !colQuery(x, z, 0.5).some(function (b) { return x > b.x0 - 0.4 && x < b.x1 + 0.4 && z > b.z0 - 0.4 && z < b.z1 + 0.4 && b.y0 < 1.5 && b.y1 > 0.2; }); }
    if (!ok) continue;
    addMob(randi(0, 7), x, z, rand(0.82, 1.22), pick(MOB_TINTS));
  }
}
function addMob(idx, x, z, sc, tint) {
  var geo = FRIENDS.lo[idx] || FRIENDS.hi[idx]; if (!geo) return null;
  var mesh = new THREE.Mesh(geo, animMat(geo.userData.set || 0)); mesh.material.userData.u.uH.value = geo.userData.h || 1.06; mesh.material.color.setHex(tint); mesh.castShadow = !LITE.on;
  mesh.scale.setScalar(1.18 * sc);
  var root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.add(mesh); R.scene.add(root);
  var y = groundAt(x, z, 5, 0.3);
  var ent = { pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(), r: 0.28 * sc, h: (geo.userData.h || 1.06) * 1.18 * sc, onGround: true, visible: true };
  var nm = pick(MOB_NAMES);
  var n = { idx: idx, uid: ++NPC_UID, mob: true, name: nm, pr: { hop: 0, spin: 0, scl: 1, center: new THREE.Vector3(x, y + 0.7, z), gone: false }, f: { mesh: mesh, scale: 1.18 * sc }, ent: ent, root: root, body: body, home: ent.pos.clone(), face: rand(0, TAU), homeFace: rand(0, TAU), target: null, wait: rand(0.5, 4), st: {}, bubble: null, talkT: rand(15, 50), temper: pick(['angry', 'flee', 'photo', 'clap', 'grumble', 'photo', 'clap']) };
  NPCS.push(n); return n;
}
function npcName(n) { return n.name || FRIEND_INFO[n.idx].name; }
function npcCenter(n, out) { return out.set(n.ent.pos.x, n.ent.pos.y + (n.state === 'fly' || n.state === 'down' || n.state === 'held' ? 0.3 : n.ent.h * 0.5), n.ent.pos.z); }
// 重心を体の真ん中にする（回転して飛ぶ時）
function npcPivot(n, on) { var m = n.body.children[0]; if (!m) return; if (on && !n.piv) { n.piv = true; m.position.y = -n.ent.h * 0.5; } else if (!on && n.piv) { n.piv = false; m.position.y = 0; n.root.rotation.set(0, n.face, 0); } }
var FLY_SCREAMS = ['わー!!', 'ぎゃー', 'ひゃっ', 'うわあああ', 'あ〜れ〜', 'とんでる!!', 'きゃー', 'のわー', 'ちょっ', 'え？'];
function npcLaunch(n, vx, vy, vz, src) {
  if (!n.ent.visible || n.state === 'held') return false;
  src = src || {};
  if (n.state === 'fly' && n.fly.t < 0.2) return false;
  var first = n.state !== 'fly';
  n.state = 'fly'; n.target = null; n.gs = null;
  var prev = n.fly;
  n.fly = { vx: vx, vy: vy, vz: vz, ax: rand(-9, 9), ay: rand(-5, 5), az: rand(-9, 9), rx: prev ? prev.rx : 0, ry: n.face, rz: prev ? prev.rz : 0, t: 0, src: src, b: 0, wet: false };
  npcPivot(n, true);
  n.ent.pos.y += 0.1;
  if (first) {
    n.bubble = { text: pick(FLY_SCREAMS), t: now() + 1400 };
    if (n.ent.pos.distanceTo(P.pos) < 40) { sfx('npcFly', rand(-3, 3)); feel(1, 0.6); }
    if (!src.net && !src.quiet) smashEvent('fly', 15, 3000, src, npcName(n) + 'の迷惑料');
    CHAOS.heat += 0.6;
  }
  return true;
}
// 当たった物（物・破片・人）で住人がふっとぶ
var _nc = null;
function npcHitAt(p, r, vel, power, src) {
  if (!_nc) _nc = new THREE.Vector3();
  var any = false;
  for (var i = 0; i < NPCS.length; i++) {
    var n = NPCS[i]; if (!n.ent.visible || n.state === 'held' || n === (src && src.self)) continue;
    npcCenter(n, _nc); var d = _nc.distanceTo(p); if (d > r + 0.4) continue;
    if (src && src.key) { if (n._hk === src.key && G.t - n._ht < 0.5) continue; n._hk = src.key; n._ht = G.t; }
    var hl = Math.hypot(vel.x, vel.z), dx = hl > 0.5 ? vel.x / hl : (_nc.x - p.x) / (d || 1), dz = hl > 0.5 ? vel.z / hl : (_nc.z - p.z) / (d || 1);
    var sp = clamp(power * 0.55, 5, 17) * TUNE.flyPow * (1 + smashUp('fly') * 0.2);
    if (npcLaunch(n, dx * sp + rand(-1, 1), 4 + sp * 0.4, dz * sp + rand(-1, 1), src)) any = true;
  }
  return any;
}
// 爆発・崩れる建物のまわり
function npcBlast(p, r, pw, src, collateral) {
  if (!_nc) _nc = new THREE.Vector3();
  for (var i = 0; i < NPCS.length; i++) {
    var n = NPCS[i]; if (!n.ent.visible || n.state === 'held') continue;
    var d = Math.hypot(n.ent.pos.x - p.x, n.ent.pos.z - p.z); if (d > r || Math.abs(n.ent.pos.y - p.y) > r + 2) continue;
    var dx = (n.ent.pos.x - p.x) / (d || 1), dz = (n.ent.pos.z - p.z) / (d || 1), k = (1 - d / r * 0.6) * pw * TUNE.flyPow * (1 + smashUp('fly') * 0.2);
    if (collateral && k < 4) { if (!n.state) npcStumble(n); continue; }
    npcLaunch(n, dx * k * 1.4, 3.5 + k * 0.6, dz * k * 1.4, src);
  }
}
function npcStumble(n) { n.state = 'down'; n.downT = 0.9; n.stumble = true; npcPivot(n, true); n.fly = { rx: 0, rz: 0, ry: n.face }; n.bubble = { text: pick(['おっとっと', 'わっ', 'こけた', 'あぶなっ']), t: now() + 1500 }; }
// ---- 持つ・投げる ----
function npcGrab(n) {
  if (ITEMS.held || NPCHELD.n || !n || !n.ent.visible) return;
  if (n.state === 'fly' && n.fly.t < 0.4) return;
  NPCHELD.n = n; n.state = 'held'; n.target = null; npcPivot(n, true); n.fly = { rx: 0, ry: 0, rz: 0, t: 0 };
  n.bubble = { text: pick(['おろして!!', 'え、え、え', '高い!!', 'どこへ!?', 'わたし　物では　ありません']), t: now() + 2500 };
  sfx('pickup'); logMsg('ev', npcName(n) + 'を　持ち上げた。');
}
function npcRelease(throwIt) {
  var n = NPCHELD.n; if (!n) return; NPCHELD.n = null;
  var f = P.face;
  if (throwIt) {
    var sp = 14 * TUNE.throwPow * (1 + smashUp('throw') * 0.15) * TUNE.flyPow;
    n.state = 'idle'; n.thrown = true;
    npcLaunch(n, -Math.sin(f) * sp + P.vel.x, 4 + Math.max(0, -CAM.pitch + 0.3) * 6, -Math.cos(f) * sp + P.vel.z, { kind: 'npc', key: 'nt' + n.uid, self: n, quiet: true });
    n.fly.src = { kind: 'npc', key: 'nm' + n.uid + '_' + G.t.toFixed(1), self: n };
    P.throwT = 0.35; sfx('throw');
  } else {
    n.ent.pos.set(P.pos.x - Math.sin(f) * 1.1, P.pos.y, P.pos.z - Math.cos(f) * 1.1);
    n.state = 'down'; n.downT = 0.3; n.fly.rx = -PI / 2; sfx('put');
  }
}
// ---- 毎フレーム：特別な状態の住人（true を返したら、ふつうの歩きはしない） ----
function npcSmash(n, dt) {
  var e = n.ent, st = n.state;
  if (!st || st === 'idle') {
    // やじ馬になる
    if (CHAOS.heat > 2.5 && !(n.crowdCd > 0)) {
      var dc = Math.hypot(e.pos.x - CHAOS.x, e.pos.z - CHAOS.z);
      if (dc < TUNE.crowdRange && dc > 9 && Math.random() < dt * 0.6) { var a = rand(0, TAU), rr = rand(7.5, 11); n.state = 'crowd'; n.crowd = { x: CHAOS.x + Math.cos(a) * rr, z: CHAOS.z + Math.sin(a) * rr, t: 0 }; n.target = null; return true; }
    }
    if (n.crowdCd > 0) n.crowdCd -= dt;
    return false;
  }
  var ex = {};
  if (st === 'fly') { npcFly(n, dt); ex = flail(n, 1); }
  else if (st === 'held') {
    var hy = P.pos.y + P.bodyH * P.scale + 0.35, f = P.face;
    e.pos.set(P.pos.x - Math.sin(f) * 0.15, hy, P.pos.z - Math.cos(f) * 0.15); e.vel.set(0, 0, 0);
    n.fly.rx = -PI / 2; n.fly.ry = f + PI / 2; n.fly.rz = Math.sin(G.t * 6) * 0.15;
    ex = flail(n, 0.7);
  } else if (st === 'down') {
    n.downT -= dt; var fr = n.fly;
    fr.rx += angDiff(fr.rx, n.stumble ? -0.9 : -PI / 2) * Math.min(1, dt * 8); fr.rz += angDiff(fr.rz, 0) * Math.min(1, dt * 8);
    e.pos.y = colTop(e.pos.x, e.pos.z, e.pos.y + 0.5) + (n.stumble ? 0.25 : 0);
    ex = { L_raiseL: 0.9, L_raiseR: 0.9, L_legL: 0.3, L_legR: -0.3, L_headY: Math.sin(G.t * 3) * 0.3 };
    if (n.downT <= 0) { n.state = 'getup'; n.upT = 0; }
  } else if (st === 'getup') {
    n.upT += dt; var k = Math.min(1, n.upT / 0.6), fr2 = n.fly;
    fr2.rx = lerp(n.stumble ? -0.9 : -PI / 2, 0, k * k); fr2.rz *= 0.8;
    e.pos.y = colTop(e.pos.x, e.pos.z, e.pos.y + 0.5);
    ex = { L_armL: -0.5 * (1 - k), L_armR: -0.5 * (1 - k) };
    if (k >= 1) npcGotUp(n);
  } else if (st === 'react') { ex = npcReact(n, dt); }
  else if (st === 'crowd') { ex = npcCrowd(n, dt); }
  // 表示
  if (n.state === 'fly' || n.state === 'down' || n.state === 'getup' || n.state === 'held') {
    var lift = n.state === 'held' ? 0 : n.state === 'down' ? 0.17 : n.state === 'getup' ? lerp(0.17, e.h * 0.5, Math.min(1, n.upT / 0.6)) : e.h * 0.5;
    n.root.position.set(e.pos.x, e.pos.y + lift, e.pos.z); n.root.rotation.set(n.fly.rx, n.fly.ry, n.fly.rz, 'YXZ');
    bodyAnim(n.root, n.body, n.st, dt, 0, false, true, 0, ex); n.body.position.y = 0; n.body.rotation.set(0, 0, 0);
  } else {
    bodyAnim(n.root, n.body, n.st, dt, Math.hypot(e.vel.x, e.vel.z), n.state === 'react' && n.react && (n.react.kind === 'flee' || n.react.kind === 'angry'), e.onGround, e.vel.y, ex);
    n.root.position.copy(e.pos); n.root.rotation.set(0, n.face, 0);
  }
  n.root.visible = e.pos.distanceTo(P.pos) < 80;
  n.pr.center.set(e.pos.x, e.pos.y + 0.7, e.pos.z);
  return true;
}
function flail(n, k) { var t = G.t * 14 + n.uid; return { L_raiseL: 0.8 + Math.sin(t) * 0.35 * k, L_raiseR: 0.8 + Math.sin(t + 2) * 0.35 * k, L_armL: Math.sin(t * 0.9) * 1.2 * k, L_armR: Math.sin(t * 0.9 + 1) * 1.2 * k, L_legL: Math.sin(t * 1.1) * 0.8 * k, L_legR: Math.sin(t * 1.1 + 2) * 0.8 * k, L_headY: Math.sin(t * 0.7) * 0.5 * k }; }
var _nv2 = null;
function npcFly(n, dt) {
  if (!_nv2) _nv2 = new THREE.Vector3();
  var f = n.fly, e = n.ent; f.t += dt;
  f.vy -= 15 * dt;
  e.pos.x += f.vx * dt; e.pos.y += f.vy * dt; e.pos.z += f.vz * dt;
  f.rx += f.ax * dt; f.ry += f.ay * dt; f.rz += f.az * dt;
  // 町の箱
  var L = colQuery(e.pos.x, e.pos.z, 0.7), hw = 0.28, hh = 0.55;
  for (var i = 0; i < L.length; i++) {
    var b = L[i], ox = Math.min(e.pos.x + hw - b.x0, b.x1 - (e.pos.x - hw)), oy = Math.min(e.pos.y + hh - b.y0, b.y1 - e.pos.y), oz = Math.min(e.pos.z + hw - b.z0, b.z1 - (e.pos.z - hw));
    if (ox <= 0 || oy <= 0 || oz <= 0) continue;
    if (oy <= ox && oy <= oz) { if (e.pos.y > (b.y0 + b.y1) / 2) { e.pos.y += oy; if (f.vy < 0) f.vy = f.vy < -3 ? -f.vy * 0.4 : 0; } else { e.pos.y -= oy; if (f.vy > 0) f.vy = -f.vy * 0.3; } }
    else if (ox <= oz) { var sx = e.pos.x > (b.x0 + b.x1) / 2 ? 1 : -1; e.pos.x += ox * sx; if (f.vx * sx < 0) { f.vx = -f.vx * 0.4; npcBonk(n, b); } }
    else { var sz = e.pos.z > (b.z0 + b.z1) / 2 ? 1 : -1; e.pos.z += oz * sz; if (f.vz * sz < 0) { f.vz = -f.vz * 0.4; npcBonk(n, b); } }
  }
  // 地面
  var top = colTop(e.pos.x, e.pos.z, e.pos.y + 0.3);
  if (e.pos.y < top) {
    e.pos.y = top;
    if (f.vy < -3.5) { f.vy = -f.vy * 0.42; f.vx *= 0.72; f.vz *= 0.72; f.ax *= 0.6; f.az *= 0.6; f.b++; if (e.pos.distanceTo(P.pos) < 30) sfx('npcLand', rand(-3, 3)); debPuff(e.pos.x, e.pos.y + 0.1, e.pos.z, 2, 0.3); }
    else { f.vy = 0; var fr = Math.exp(-dt * 3.5); f.vx *= fr; f.vz *= fr; f.ax *= fr; f.ay *= fr; f.az *= fr; if (Math.hypot(f.vx, f.vz) < 0.8) { n.state = 'down'; n.downT = rand(1.4, 2.4); n.stumble = false; n.thrown = false; } }
  }
  // 川
  if (e.pos.z > RIVER.z1 && e.pos.z < RIVER.z2 && e.pos.y < RIVER.water && e.pos.z < 300) {
    f.vy += 24 * dt; f.vx *= 0.96; f.vz *= 0.96;
    if (!f.wet) { f.wet = true; sfx('splash'); debBurst(e.pos.x, RIVER.water, e.pos.z, 0x9fdcff, 10, 'ball', 3); if (n.thrown || (f.src && f.src.kind !== 'chain')) smashEvent('river', 25, 0, f.src, null); }
    if (f.t > 2) { n.state = 'down'; n.downT = 1.2; e.pos.z = e.pos.z < (RIVER.z1 + RIVER.z2) / 2 ? RIVER.z0 - 0.5 : RIVER.z3 + 0.5; e.pos.y = 0.1; }
  }
  // 飛んでいる住人も、物をこわす・人をはね飛ばす
  var spd = Math.hypot(f.vx, f.vy, f.vz);
  if (spd > 6) {
    var src = { kind: n.thrown ? 'npc' : 'chain', key: 'nf' + n.uid + '_' + (f.src && f.src.key || ''), self: n, p: e.pos, air: n.thrown && !P.onGround };
    var dmg = 0.16 * spd * (n.thrown ? 1.6 : 1) * (0.7 + n.ent.h * 0.3);
    _nv2.set(e.pos.x, e.pos.y + 0.3, e.pos.z);
    var B2 = brkQuery(_nv2.x - 0.35, _nv2.y - 0.4, _nv2.z - 0.35, _nv2.x + 0.35, _nv2.y + 0.5, _nv2.z + 0.35).slice();
    for (i = 0; i < B2.length; i++) if (brkHit(B2[i], dmg, f.vx, f.vz, src)) { f.vx *= 0.8; f.vz *= 0.8; }
    var N = itemsNear(_nv2.x, _nv2.z, 0.8);
    for (i = 0; i < N.length; i++) { var it = N[i], bb = it.body; if (it === ITEMS.held || it.broken || bb.fixed) continue; if (Math.abs(bb.pos.y - _nv2.y) > bb.ey + 0.6) continue; if (it._nf === n.uid && G.t - (it._nft || 0) < 0.5) continue; it._nf = n.uid; it._nft = G.t; var km = 0.6 * spd / Math.sqrt(Math.max(0.5, effMass(bb))); bb.vel.set(f.vx * km * 0.15 + rand(-1, 1), 3 + km * 0.3, f.vz * km * 0.15 + rand(-1, 1)); bb.thrownT = 1; wake(it); itemHit(it, dmg, f.vx, f.vz, src); }
    npcHitAt(_nv2, 0.5, { x: f.vx, z: f.vz }, spd * 0.8, src);
  }
  if (f.t > 9 || e.pos.y < -20) { n.state = 'down'; n.downT = 1; if (e.pos.y < -20) e.pos.copy(n.home); }
}
function npcBonk(n, b) { if (b.brk) return; if (n.ent.pos.distanceTo(P.pos) < 30) sfx('npcLand', -4); }
function npcGotUp(n) {
  npcPivot(n, false); n.stumble = false;
  var text = pick(COMPLAINTS);
  n.bubble = { text: text, t: now() + 3800 };
  if (n.ent.pos.distanceTo(P.pos) < 25) { logMsg('talk', text, npcName(n)); if (TEXTLV.v >= 1) sfx('babble', hashStr(text)); }
  var kind = Math.random() < 0.25 ? 'grumble' : n.temper;
  n.state = 'react'; n.react = { kind: kind, t: 0, dur: { angry: 6, flee: 4, photo: 3.5, clap: 3, grumble: 2 }[kind] || 2, snapT: 0.6, pushT: 0 };
  n.crowdCd = 6;
}
// 起き上がったあとの反応
function npcReact(n, dt) {
  var r = n.react, e = n.ent, ex = {}; r.t += dt;
  var dx = P.pos.x - e.pos.x, dz = P.pos.z - e.pos.z, d = Math.hypot(dx, dz) || 1, want = 0, wx = 0, wz = 0;
  if (r.kind === 'angry') {
    want = d > 1.1 ? 3.6 : 0; wx = dx / d; wz = dz / d; ex.L_raiseR = 0.6 + Math.sin(G.t * 12) * 0.2; ex.L_armR = -0.6;
    r.pushT -= dt;
    if (d < 1.2 && r.pushT <= 0 && !NPCHELD.n) { r.pushT = 1.6; P.vel.x += dx / d * 4; P.vel.z += dz / d * 4; P.vel.y = Math.max(P.vel.y, 2.5); P.onGround = false; sfx('boing'); n.bubble = { text: pick(['こらー!!', 'めっ!!', '反省して下さい!!', 'ちょっと　そこに　すわりなさい', '町内会です!!']), t: now() + 2000 }; }
  } else if (r.kind === 'flee') { want = 4.6; wx = -dx / d; wz = -dz / d; ex.L_raiseL = ex.L_raiseR = 0.7; }
  else if (r.kind === 'photo') { n.face += angDiff(n.face, Math.atan2(dx, dz)) * Math.min(1, dt * 6); ex.L_raiseR = 0.25; ex.L_armR = -1.5; ex.L_headP = 0.1; r.snapT -= dt; if (r.snapT <= 0) { r.snapT = 1.2; if (d < 25) sfx('snap'); debStars(e.pos.x - Math.sin(n.face) * -0.4, e.pos.y + e.h * 0.75, e.pos.z - Math.cos(n.face) * -0.4, 1); } }
  else if (r.kind === 'clap') { n.face += angDiff(n.face, Math.atan2(dx, dz)) * Math.min(1, dt * 6); var c = Math.abs(Math.sin(r.t * 9)); ex.L_armL = ex.L_armR = -1.1; ex.L_raiseL = ex.L_raiseR = 0.05 + c * 0.25; if ((r.t % 1) < dt && d < 25) sfx('clap'); }
  else { ex.L_headY = Math.sin(r.t * 12) * 0.5; ex.L_raiseL = ex.L_raiseR = 0.3; }
  if (want > 0) n.face += angDiff(n.face, Math.atan2(wx, wz)) * Math.min(1, dt * 8);
  e.vel.x += (wx * want - e.vel.x) * Math.min(1, dt * 8); e.vel.z += (wz * want - e.vel.z) * Math.min(1, dt * 8);
  moveEntity(e, dt, 1);
  if (r.t > r.dur) { n.state = null; n.target = n.home.clone(); n.wait = 0; }
  return ex;
}
// やじ馬：暴れている場所のまわりに集まって、見る・撮る・拍手
function npcCrowd(n, dt) {
  var c = n.crowd, e = n.ent, ex = {}; c.t += dt;
  var dx = c.x - e.pos.x, dz = c.z - e.pos.z, d = Math.hypot(dx, dz), want = 0;
  if (d > 0.8 && c.t < 20) { want = 3.2; n.face += angDiff(n.face, Math.atan2(dx, dz)) * Math.min(1, dt * 8); }
  else {
    n.face += angDiff(n.face, Math.atan2(CHAOS.x - e.pos.x, CHAOS.z - e.pos.z)) * Math.min(1, dt * 4);
    var ph = (c.t + n.uid) % 6;
    if (ph < 2) { ex.L_armR = -1.5; ex.L_raiseR = 0.25; } else if (ph < 4) { var k = Math.abs(Math.sin(c.t * 9)); ex.L_armL = ex.L_armR = -1.1; ex.L_raiseL = ex.L_raiseR = 0.05 + k * 0.25; } else { ex.bounce = Math.abs(Math.sin(c.t * 7)) * 0.2; ex.L_raiseL = ex.L_raiseR = 0.8; }
    if (Math.random() < dt * 0.12 && e.pos.distanceTo(P.pos) < 22) n.bubble = { text: pick(CROWD_LINES), t: now() + 2500 };
  }
  e.vel.x += ((d > 0.01 ? dx / d : 0) * want - e.vel.x) * Math.min(1, dt * 8); e.vel.z += ((d > 0.01 ? dz / d : 0) * want - e.vel.z) * Math.min(1, dt * 8);
  moveEntity(e, dt, 1);
  if (CHAOS.heat < 0.8 || c.t > 40) { n.state = null; n.target = n.home.clone(); n.wait = 0; n.crowdCd = 15; }
  return ex;
}
// 暴れている場所（やじ馬が集まる）
function onSmashBreak(b, src) {
  var c = b.c || P.pos, w = 1 + (b.cls || 0) * 1.5;
  if (CHAOS.heat < 0.5) { CHAOS.x = c.x; CHAOS.z = c.z; } else { CHAOS.x = lerp(CHAOS.x, c.x, 0.3); CHAOS.z = lerp(CHAOS.z, c.z, 0.3); }
  CHAOS.heat = Math.min(12, CHAOS.heat + w);
}
function chaosUpdate(dt) { CHAOS.heat = Math.max(0, CHAOS.heat - dt * 0.18); }
// ねらい：住人
function npcTarget(test) { for (var i = 0; i < NPCS.length; i++) { var n = NPCS[i]; if (!n.mob || !n.ent.visible || n.state === 'held') continue; test(n.pr.center, 0.55, n); } }
