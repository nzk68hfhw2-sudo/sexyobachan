// ---- team battle (4 vs 4 with bots), kills & streaks, pickups, radar, kill feed -
var STREAK_NAMES = { 2: 'ダブルキル', 3: 'トリプルキル', 4: 'クアッドキル', 5: 'ランペイジ', 7: 'アンストッパブル', 10: 'ゴッドライク' };
var TDM_OPT = { target: store.get('tdmTarget', 30), diff: store.get('tdmDiff', 1), time: 300 };
var TEAM_NAME = ['ブルー', 'レッド'], TEAM_CSS = ['#6ab6ff', '#ff6a5a'];

function onKill(att, vic, label, crit) {
  if (G.mode === 'tdm' && G.tdm) {
    var T = G.tdm, ar = att === P ? T.me : (att && att.roster), vr = vic === P ? T.me : vic.roster;
    if (vr) { vr.deaths++; vr.respT = 4.2; }
    if (ar && vr && ar.team !== vr.team && !T.over) { ar.kills++; T.score[ar.team]++; }
    killFeed(ar, vr, label, crit);
    if (att === P && vic !== P) { G.stats.kills++; addScore(100 + (crit ? 50 : 0), (vr ? vr.name : '') + (crit ? ' をヘッドショット' : ' を倒した')); SFX.kill(); streakUp(); }
    return;
  }
  if (att === P) {
    G.stats.kills++; addScore(Math.round(vic.T.score * (vic.leader ? 3 : 1)) + (crit ? 50 : 0), vic.name + (crit ? (vic.friend ? ' をヘッドショット' : ' をクリティカル撃破') : ' を倒した')); SFX.kill(); streakUp(); G.streakT = 6;
  }
}
function streakUp() {
  G.streak++; if (G.streak > G.stats.maxStreak) G.stats.maxStreak = G.streak;
  var n = STREAK_NAMES[G.streak]; if (!n) return;
  H.streak.textContent = n + '！'; H.streak.className = 'fr-streak'; void H.streak.offsetWidth; H.streak.className = 'fr-streak on'; SFX.streak(G.streak);
}
function killFeed(ar, vr, label, crit) {
  if (!vr) return;
  var d = el('div', null, H.kfeed);
  d.innerHTML = (ar ? '<b style="color:' + TEAM_CSS[ar.team] + '"></b> ' : '') + '<i></i> <b style="color:' + TEAM_CSS[vr.team] + '"></b>';
  var bs = d.querySelectorAll('b'); if (ar) bs[0].textContent = ar.name; bs[bs.length - 1].textContent = vr.name;
  d.querySelector('i').textContent = '▸ ' + (label || '') + (crit ? '（HS）' : '') + ' ▸';
  if ((ar && ar.isPlayer) || vr.isPlayer) d.className = 'me';
  while (H.kfeed.children.length > 4) H.kfeed.removeChild(H.kfeed.firstChild);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 6000);
}

// ---- team battle ------------------------------------------------------------------
function tdmSpawnPos(team) {
  var zc = team === 0 ? 25.5 : -25.5, best = null, bd = -1;
  for (var tr = 0; tr < 24; tr++) {
    var x = rnd(-14, 14), z = zc + rnd(-3.5, 3.5); if (NAV.blocked[navCell(x, z)]) continue;
    var md = 99; for (var i = 0; i < ENEMIES.length; i++) { var e = ENEMIES[i]; if (e.dead) continue; var d = Math.hypot(e.x - x, e.z - z); if (e.team !== team) d *= 0.5; if (d < md) md = d; }
    if (team !== P.team && actorAlive(P)) md = Math.min(md, Math.hypot(P.x - x, P.z - z) * 0.5);
    if (md > bd) { bd = md; best = [x, z]; }
  }
  return best || [0, zc];
}
var RALLY = [{ x: 0, z: -14 }, { x: 0, z: 14 }];
function tdmRally(team) { return RALLY[team]; }
function startTeamBattle() {
  resetRun('tdm');
  var ids = [0, 1, 2, 3, 4, 5, 6, 7].filter(function (i) { return i !== ECO.eq.avatar; }), i, j, t;
  for (i = ids.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
  var T = G.tdm = { target: TDM_OPT.target, diff: TDM_OPT.diff, score: [0, 0], timeLeft: TDM_OPT.time, roster: [], over: false, endT: 0 };
  T.me = { name: ACC.id || 'あなた', idx: ECO.eq.avatar, team: 0, isPlayer: true, kills: 0, deaths: 0, respT: 0, ent: null }; T.roster.push(T.me);
  for (i = 0; i < 7; i++) T.roster.push({ name: FRIEND_NAMES[ids[i]], idx: ids[i], team: i < 3 ? 0 : 1, isPlayer: false, kills: 0, deaths: 0, respT: 0, ent: null });
  tdmPlacePlayer();
  T.roster.forEach(function (r) { if (!r.isPlayer) tdmSpawnBot(r); });
  G.phase = 'fight'; banner('チーム戦 4 vs 4', '先に ' + T.target + ' キルしたチームの勝ち　あなたはブルーチーム', 3.2); SFX.alarm();
}
function tdmSpawnBot(r) { var p = tdmSpawnPos(r.team); r.ent = spawnFriend(r.idx, 2, false, { team: r.team, x: p[0], z: p[1], diff: G.tdm.diff, roster: r, name: r.name }); r.respT = 0; }
function tdmPlacePlayer() {
  var p = tdmSpawnPos(0); P.x = p[0]; P.z = p[1]; P.yaw = 0; P.pitch = 0; P.vx = P.vz = 0; P.hp = 100; P.deadT = 0; P.respawnT = 0; P.inv = 1.8; P.hurtT = 99; P.nades = 2;
  gun.slots.forEach(function (id) { gun.ammo[id] = WDEF[id].mag; }); gun.reloadT = 0; hudCache.am = null; H.death.style.display = 'none';
}
function tdmPlayerDied() { G.streak = 0; P.respawnT = 3.6; var k = P.lastKiller; H.deathBy.textContent = k ? k.name + ' の ' + k.label + ' に倒された' : '倒された'; H.deathBy.style.color = k ? TEAM_CSS[k.team] : '#fff'; H.death.style.display = 'block'; }
function tdmUpdate(dt) {
  var T = G.tdm; if (!T) return;
  if (T.over) { T.endT -= dt; if (T.endT <= 0) tdmFinish(); return; }
  T.timeLeft -= dt;
  for (var i = 0; i < T.roster.length; i++) { var r = T.roster[i]; if (r.isPlayer || r.respT <= 0) continue; r.respT -= dt; if (r.respT <= 0 && (!r.ent || r.ent.gone || r.ent.dead)) tdmSpawnBot(r); }
  if (P.respawnT > 0) { P.respawnT -= dt; setTxt('resp', H.deathT, '復活まで ' + Math.max(1, Math.ceil(P.respawnT))); if (P.respawnT <= 0) { tdmPlacePlayer(); SFX.ui(); } }
  if (T.score[0] >= T.target || T.score[1] >= T.target || T.timeLeft <= 0) {
    T.over = true; T.endT = 2.2; T.timeLeft = Math.max(0, T.timeLeft); T.win = T.score[0] === T.score[1] ? -1 : (T.score[0] > T.score[1] ? 0 : 1);
    banner(T.win === 0 ? '勝利！' : T.win === 1 ? '敗北…' : '引き分け', TEAM_NAME[0] + ' ' + T.score[0] + ' － ' + T.score[1] + ' ' + TEAM_NAME[1], 2.4); if (T.win === 0) SFX.win(); else SFX.lose();
  }
}
function tdmFinish() {
  var T = G.tdm, acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0, win = T.win === 0;
  G.state = 'result'; leavePlay();
  H.rTitle.innerHTML = win ? '<span>VICTORY</span>' : T.win === 1 ? 'DEFEAT' : 'DRAW';
  H.rSub.textContent = TEAM_NAME[0] + ' ' + T.score[0] + ' － ' + T.score[1] + ' ' + TEAM_NAME[1];
  H.rScore.textContent = ''; H.rStat.innerHTML = ''; H.rNote.textContent = '';
  var sorted = T.roster.slice().sort(function (a, b) { return a.team - b.team || b.kills - a.kills; }), mvp = T.roster.slice().sort(function (a, b) { return b.kills - a.kills || a.deaths - b.deaths; })[0];
  H.rBoard.innerHTML = '';
  var head = el('div', 'fr-brow hd', H.rBoard); el('span', null, head, 'MVP： ' + mvp.name + '（' + mvp.kills + ' キル）'); el('b', null, head, 'キル'); el('b', null, head, 'デス');
  sorted.forEach(function (r) { var row = el('div', 'fr-brow' + (r.isPlayer ? ' me' : ''), H.rBoard), n = el('span', null, row, (r === mvp ? '★ ' : '') + r.name + (r.isPlayer ? '（あなた）' : '')); n.style.color = TEAM_CSS[r.team]; el('b', null, row, String(r.kills)); el('b', null, row, String(r.deaths)); });
  G.last = { mode: 'tdm', score: G.score, wave: 0, kills: T.me.kills, heads: G.stats.heads, streak: G.stats.maxStreak, acc: acc, time: Math.round(G.time), win: win, draw: T.win === -1 };
  H.rAgain.textContent = 'もういちど';
  stageShow({ avatar: mvp.idx, hat: mvp.isPlayer ? ECO.eq.hat : null, team: mvp.team }); H.result.classList.add('stage');
  ecoMatchEnd(G.last);
  showScreen('result');
}

// ---- pickups (health / ammo) ---------------------------------------------------------
var PICKS = [];
function buildPickups() {
  var want = [['h', -10, 0], ['a', 0, -8], ['h', 13, -3], ['a', -20, -13], ['a', 20, 12], ['h', 0, 15]];
  var g = new THREE.BoxGeometry(0.42, 0.3, 0.3), hm = stdMat({ color: 0xf2f2f2, roughness: 0.5, emissive: 0x143a14 }), am = stdMat({ color: 0x4a5a32, roughness: 0.6, emissive: 0x2a2408 });
  var cg = new THREE.BoxGeometry(0.26, 0.08, 0.31), cm = new THREE.MeshBasicMaterial({ color: 0x2ecc55 }), bm = new THREE.MeshBasicMaterial({ color: 0xffc23a });
  want.forEach(function (w) {
    var x = w[1], z = w[2], ok = false;
    for (var r = 0; r < 6 && !ok; r++) for (var a = 0; a < 8 && !ok; a++) { var tx = w[1] + Math.cos(a * 0.785) * r, tz = w[2] + Math.sin(a * 0.785) * r; if (!NAV.blocked[navCell(tx, tz)]) { x = Math.floor(tx) + 0.5; z = Math.floor(tz) + 0.5; ok = true; } }
    var grp = new THREE.Group(), box = new THREE.Mesh(g, w[0] === 'h' ? hm : am); box.castShadow = true; grp.add(box);
    if (w[0] === 'h') { var c1 = new THREE.Mesh(cg, cm); grp.add(c1); var c2 = new THREE.Mesh(cg, cm); c2.rotation.z = Math.PI / 2; c2.scale.set(1, 1, 1.001); grp.add(c2); }
    else { var s1 = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.06, 0.31), bm); grp.add(s1); }
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.soft, color: w[0] === 'h' ? 0x4dff7a : 0xffc23a, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(1.3); grp.add(gl);
    grp.position.set(x, 0.6, z); scene.add(grp); PICKS.push({ g: grp, type: w[0], x: x, z: z, t: 0, ph: Math.random() * 6 });
  });
}
function resetPickups() { PICKS.forEach(function (p) { p.t = 0; p.g.visible = true; }); }
function updatePickups(dt) {
  for (var i = 0; i < PICKS.length; i++) {
    var p = PICKS[i];
    if (p.t > 0) { p.t -= dt; if (p.t <= 0) p.g.visible = true; continue; }
    p.ph += dt; p.g.rotation.y = p.ph * 1.6; p.g.position.y = 0.6 + Math.sin(p.ph * 2.2) * 0.08;
    if (P.hp > 0 && Math.abs(P.x - p.x) < 1.1 && Math.abs(P.z - p.z) < 1.1) {
      if (p.type === 'h') { if (P.hp >= 100) continue; P.hp = Math.min(100, P.hp + 50); feed('回復キット +50'); }
      else { var need = P.nades < 2; gun.slots.forEach(function (id) { if (gun.ammo[id] < WDEF[id].mag) need = true; gun.ammo[id] = WDEF[id].mag; }); if (!need) continue; P.nades = 2; gun.reloadT = 0; hudCache.am = null; feed('弾薬とグレネードを補充'); }
      p.t = 22; p.g.visible = false; SFX.pickup();
    }
  }
}

// ---- radar ------------------------------------------------------------------------------
var radarT = 0;
function updateRadar(dt) {
  radarT -= dt; if (radarT > 0) return; radarT = 0.1;
  var c = H.radarCtx, S = 96, h = S / 2, k = h / 34, sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  c.clearRect(0, 0, S, S); c.fillStyle = 'rgba(8,14,20,.55)'; c.beginPath(); c.arc(h, h, h - 1, 0, 6.3); c.fill(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(h, h, h * 0.5, 0, 6.3); c.stroke();
  function dot(x, z, col, r) { var dx = x - P.x, dz = z - P.z, rx = dx * cy - dz * sy, fw = -dx * sy - dz * cy, px = rx * k, py = -fw * k, l = Math.hypot(px, py), m = h - 5; if (l > m) { px *= m / l; py *= m / l; } c.fillStyle = col; c.beginPath(); c.arc(h + px, h + py, r, 0, 6.3); c.fill(); }
  for (var i = 0; i < PICKS.length; i++) if (PICKS[i].t <= 0) dot(PICKS[i].x, PICKS[i].z, PICKS[i].type === 'h' ? 'rgba(90,255,130,.7)' : 'rgba(255,200,70,.7)', 1.8);
  for (i = 0; i < ENEMIES.length; i++) { var e = ENEMIES[i]; if (e.dead) continue; dot(e.x, e.z, e.team === P.team ? '#6ab6ff' : '#ff5a4a', 3); }
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(h, h - 5); c.lineTo(h + 4, h + 4); c.lineTo(h - 4, h + 4); c.closePath(); c.fill();
}
