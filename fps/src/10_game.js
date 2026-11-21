// ---- game state, player, quality manager, survival flow, main loop ------------
var P = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, speed: 0, bob: 0, hp: 100, lookDX: 0, lookDY: 0, landDip: 0, hurtT: 99, deadT: 0, team: 0, nades: 2, respawnT: 0, inv: 0 };
var G = { state: 'loading', mode: 'survival', phase: '', wave: 0, score: 0, stats: { shots: 0, hits: 0, kills: 0, heads: 0, maxStreak: 0 }, shake: 0, vig: 0, time: 0, timer: 0, queue: [], spawnT: 0, titleT: 0, baseFov: 66, streak: 0, streakT: 0, tdm: null };
var Q = { tier: 1, mode: store.get('qmode', 'auto'), prScale: 1, acc: 0, frames: 0, bad: 0, good: 0, fps: 60 };
var SET = { assist: store.get('assist', true) };

function applyQuality() {
  var t = Q.tier, cap = t === 2 ? 2 : t === 1 ? 1.5 : 1;
  var pr = Math.max(0.5, Math.min(window.devicePixelRatio || 1, cap) * Q.prScale);
  renderer.setPixelRatio(pr); renderer.setSize(window.innerWidth, window.innerHeight, false);
  var wantShadow = t > 0, size = t === 2 ? 2048 : 1024;
  if (sun.castShadow !== wantShadow) sun.castShadow = wantShadow;
  if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  refreshQualityUI();
}
function setQualityMode(m) {
  Q.mode = m; store.set('qmode', m);
  if (m === 'auto') { Q.tier = initialTier(); Q.prScale = 1; } else { Q.tier = m; Q.prScale = 1; }
  Q.bad = Q.good = 0; applyQuality();
}
function initialTier() {
  if (QUERY.q != null) return clamp(+QUERY.q | 0, 0, 2);
  var mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
  if (mem <= 2 || cores <= 2) return 0;
  return IS_MOBILE ? 1 : 2;
}
function refreshQualityUI() {
  if (!H.qseg) return;
  H.qseg.forEach(function (o) { o[1].classList.toggle('on', o[0] === Q.mode); });
  H.qinfo.textContent = '現在: ' + ['低', '中', '高'][Q.tier] + '（解像度 ' + Math.round(Q.prScale * 100) + '%・影 ' + (Q.tier > 0 ? 'あり' : 'なし') + '）' + (Q.mode === 'auto' ? '　動きが重いと自動で下がります' : '');
}
function autoQuality(dt) {
  Q.acc += dt; Q.frames++;
  if (Q.acc < 1) return;
  Q.fps = Q.frames / Q.acc; Q.acc = 0; Q.frames = 0;
  if (Q.mode !== 'auto' || QUERY.q != null) return;
  if (Q.fps < 42) { Q.bad++; Q.good = 0; } else if (Q.fps >= 56) { Q.good++; Q.bad = 0; } else { Q.bad = 0; Q.good = 0; }
  if (Q.bad >= 2) {
    Q.bad = 0;
    if (Q.prScale > 0.72) Q.prScale -= 0.14; else if (Q.tier > 0) { Q.tier--; Q.prScale = 0.86; } else if (Q.prScale > 0.5) Q.prScale -= 0.1; else return;
    applyQuality();
  } else if (Q.good >= 8 && Q.prScale < 1) { Q.good = 0; Q.prScale = Math.min(1, Q.prScale + 0.07); applyQuality(); }
}
function onResize() {
  var w = window.innerWidth, h = window.innerHeight, a = w / h;
  camera.aspect = a; G.baseFov = camera.fov = a >= 1.2 ? 66 : clamp(2 * Math.atan(Math.tan(33 * Math.PI / 180) * 1.25 / a) * 180 / Math.PI, 66, 96);
  camera.updateProjectionMatrix(); applyQuality();
  if (gun.root) { var pt = a < 1; gun.root.scale.setScalar(pt ? 0.2 : 0.3); gun.base.set(pt ? 0.04 : 0.068, pt ? -0.058 : -0.062, pt ? -0.12 : -0.155); }
}

// ---- common start / end ---------------------------------------------------------
function resetRun(mode) {
  clearEnemies(); clearProjectiles(); resetPickups();
  G.mode = mode; G.score = 0; G.wave = 0; G.stats = { shots: 0, hits: 0, kills: 0, heads: 0, maxStreak: 0 }; G.shake = 0; G.vig = 0; G.time = 0; G.queue = []; G.navT = 0; G.streak = 0; G.streakT = 0; G.phase = '';
  P.x = SPAWN_POS[0]; P.z = SPAWN_POS[1]; P.y = 0; P.yaw = 0; P.pitch = 0; P.vx = P.vz = 0; P.hp = 100; P.hurtT = 99; P.deadT = 0; P.bob = 0; P.team = 0; P.nades = 2; P.respawnT = 0; P.inv = 0; P.lastKiller = null;
  setLoadout(ECO.loadout); gun.cool = 0.3; gun.recP = gun.recY = gun.recPV = gun.recYV = 0; gun.root.visible = true; gun.scoped = null; gun.nadeCool = 0;
  hudCache = {}; H.hitT = 0; H.dmgT = 0; H.kfeed.innerHTML = ''; H.death.style.display = 'none'; H.feed.innerHTML = '';
  input.fire = false; input.aim = false; input.lookX = input.lookY = 0; input.switchTo = null; input.grenade = false; if (input.resetTouch) input.resetTouch();
  updateNav(P.x, P.z);
  ROOT.classList.toggle('fr-tdm', mode === 'tdm');
  G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null);
  if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} }
  ecoMatchStart(mode);
}
function leavePlay() { ROOT.classList.remove('fr-play'); input.aim = false; if (H.scope) H.scope.style.display = 'none'; H.death.style.display = 'none'; if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} } }

// ---- survival (8 waves) ---------------------------------------------------------
function buildWave(w) {
  var n = 3 + Math.round(w * 1.3), list = [], i, dr = w >= 4 ? Math.floor((w - 2) / 2) : 0;
  for (i = 0; i < n; i++) list.push({ f: Math.floor(Math.random() * 8) });
  list[0] = { f: w - 1, leader: true };                  // each wave is led by one of the eight
  for (i = 0; i < dr; i++) list.push({ d: i === 0 && w >= 6 ? 'gunner' : (i % 2 ? 'kami' : 'scout') });
  for (i = list.length - 1; i > 1; i--) { var j = 1 + Math.floor(Math.random() * i), t = list[i]; list[i] = list[j]; list[j] = t; }
  return list.reverse();                                  // popped from the end: leader comes out last
}
function startGame() { resetRun('survival'); nextWave(); }
function nextWave() {
  G.wave++; G.phase = 'intro'; G.timer = 3; G.queue = buildWave(G.wave);
  banner('WAVE ' + G.wave, 'リーダーは「' + FRIEND_NAMES[G.wave - 1] + '」　全員倒せ', 3); SFX.alarm();
}
function updateFlow(dt) {
  G.navT -= dt; if (G.navT <= 0) { G.navT = 0.35; updateNav(P.x, P.z); }
  if (G.streakT > 0) { G.streakT -= dt; if (G.streakT <= 0) G.streak = 0; }
  if (G.phase === 'intro') { G.timer -= dt; if (G.timer <= 0) { G.phase = 'fight'; G.spawnT = 0; } }
  else if (G.phase === 'fight') {
    var maxAlive = Math.min(3 + Math.floor(G.wave / 2), Q.tier === 0 ? 5 : 6), alive = aliveCount();
    G.spawnT -= dt;
    if (G.queue.length && alive < maxAlive && G.spawnT <= 0) { var q = G.queue.pop(); if (q.d) spawnEnemy(q.d, G.wave); else spawnFriend(q.f, G.wave, q.leader); G.spawnT = 1.2; }
    if (!G.queue.length && !alive && P.hp > 0) {
      P.hp = Math.min(100, P.hp + 40); P.nades = Math.max(P.nades, 2); addScore(300 + G.wave * 50, 'WAVE ' + G.wave + ' クリア'); SFX.rescue();
      G.phase = 'rest'; G.timer = G.wave >= 8 ? 3 : 3.2; banner(G.wave >= 8 ? '全ウェーブ制圧！' : 'WAVE ' + G.wave + ' クリア', G.wave >= 8 ? '' : 'HP 回復　次にそなえろ', 2.6);
    }
  } else if (G.phase === 'rest') { G.timer -= dt; if (G.timer <= 0) { if (G.wave >= 8) endGame(true); else nextWave(); } }
}
function hurtPlayer(dmg, sx, sz, attacker, label) {
  if (P.hp <= 0 || G.state !== 'playing' || P.inv > 0 || P.respawnT > 0) return;
  P.hp -= dmg; P.hurtT = 0; G.vig = Math.min(1, 0.45 + dmg / 40); G.shake = Math.min(1.6, G.shake + 0.5 + dmg / 30);
  H.dmgT = 1.1; H.dmgX = sx; H.dmgZ = sz; SFX.hurt();
  if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) {} }
  if (P.hp <= 0) {
    P.hp = 0; P.deadT = 0.0001; input.fire = false; input.aim = false;
    P.lastKiller = { name: attacker === P ? '自分' : attacker ? attacker.name : '？', label: label || 'ブラスター', team: attacker && attacker !== P ? attacker.team : 1 };
    if (G.mode === 'tdm') { onKill(attacker === P ? null : attacker, P, label, false); tdmPlayerDied(); } else SFX.lose();
  }
}
function endGame(win) {
  var acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0, bonus = 0;
  if (win) { bonus = Math.max(0, Math.round((720 - G.time) * 5)) + Math.round(P.hp) * 10; G.score += bonus; SFX.win(); }
  G.state = 'result'; leavePlay();
  H.rTitle.innerHTML = win ? 'MISSION <span>COMPLETE</span>' : 'MISSION <span>FAILED</span>';
  H.rSub.textContent = win ? '全8ウェーブ制圧！' : 'WAVE ' + G.wave + ' で力尽きた' + (P.lastKiller ? '（' + P.lastKiller.name + ' の' + P.lastKiller.label + '）' : '');
  H.rScore.textContent = G.score; H.rBoard.innerHTML = '';
  H.rStat.innerHTML = ''; [['到達ウェーブ', (win ? 8 : G.wave) + ' / 8'], ['撃破数', G.stats.kills], ['ヘッドショット', G.stats.heads], ['最大連続キル', G.stats.maxStreak], ['命中率', acc + '%'], ['タイム', Math.floor(G.time / 60) + ':' + ('0' + Math.floor(G.time % 60)).slice(-2)], ['クリアボーナス', bonus]].forEach(function (r) { el('span', null, H.rStat, r[0]); el('b', null, H.rStat, String(r[1])); });
  var best = store.get('best', 0), isBest = G.score > best; if (isBest) store.set('best', G.score);
  H.rNote.textContent = isBest ? 'この端末のベストスコア更新！' : 'この端末のベスト： ' + best;
  G.last = { mode: 'survival', score: G.score, wave: win ? 8 : G.wave, kills: G.stats.kills, heads: G.stats.heads, streak: G.stats.maxStreak, acc: acc, time: Math.round(G.time), win: !!win };
  H.rAgain.textContent = 'もういちど';
  stageShow(null); H.result.classList.remove('stage'); ecoMatchEnd(G.last);
  showScreen('result');
}
function pauseGame() { if (G.state !== 'playing') return; G.state = 'paused'; ROOT.classList.remove('fr-play'); input.fire = false; input.aim = false; if (input.resetTouch) input.resetTouch(); if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} } showScreen('paused'); }
function resumeGame() { G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null); if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} } }
function toTitle() { clearEnemies(); clearProjectiles(); G.state = 'title'; G.phase = ''; G.wave = 0; leavePlay(); gun.root.visible = false; if (AU.ok) AU.hum.gain.value = 0; stageShow(null); showScreen('title'); }

// ---- aim assist: slows the look speed while the crosshair is close to an enemy (touch only)
var assist = { t: 0, f: 1 };
function aimAssist(dt) {
  if (!SET.assist || !input.usedTouch) return 1;
  assist.t -= dt; if (assist.t > 0) return assist.f;
  assist.t = 0.07; assist.f = 1;
  camera.getWorldDirection(_v1); var best = null, ba = 1;
  for (var i = 0; i < ENEMIES.length; i++) {
    var e = ENEMIES[i]; if (e.dead || e.team === P.team) continue;
    var dx = e.x - camera.position.x, dy = actorY(e) + 0.2 - camera.position.y, dz = e.z - camera.position.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d > 60 || d < 0.5) continue;
    var ang = Math.acos(clamp((dx * _v1.x + dy * _v1.y + dz * _v1.z) / d, -1, 1)), lim = Math.atan(1.0 / d) + 0.015;
    if (ang < lim && ang / lim < ba) { ba = ang / lim; best = e; }
  }
  if (best && losClear(camera.position.x, camera.position.y, camera.position.z, best.x, actorY(best) + 0.2, best.z)) assist.f = lerp(0.4, 0.75, ba);
  return assist.f;
}
function updatePlayer(dt) {
  pollKeys();
  var W = curDef(), af = aimAssist(dt) * (camera.fov / G.baseFov);
  var lx = input.lookX * af, ly = input.lookY * af; input.lookX = input.lookY = 0;
  if (P.hp > 0) { P.yaw -= lx; P.pitch = clamp(P.pitch - ly, -1.35, 1.35); }
  P.lookDX = lx; P.lookDY = ly;
  if (P.inv > 0) P.inv -= dt;
  var mx = P.hp > 0 ? input.mx : 0, mz = P.hp > 0 ? input.mz : 0, sp = ((input.sprint && mz < -0.3 && gun.ads < 0.3) ? 6.9 : 4.5) * W.move * lerp(1, 0.6, gun.ads);
  var s = Math.sin(P.yaw), c = Math.cos(P.yaw), wx = (mx * c + mz * s) * sp, wz = (-mx * s + mz * c) * sp, k = 1 - Math.exp(-11 * dt);
  P.vx += (wx - P.vx) * k; P.vz += (wz - P.vz) * k;
  collideMove(P, P.x + P.vx * dt, P.z + P.vz * dt, 0.36, 0);
  P.speed = Math.hypot(P.vx, P.vz);
  var pb = P.bob; P.bob += P.speed * dt * 1.55;
  if (P.speed > 1 && Math.floor(pb / Math.PI) !== Math.floor(P.bob / Math.PI)) SFX.step(P.speed > 5.5);
  P.hurtT += dt; if (P.hp > 0 && P.hp < 60 && P.hurtT > 6) P.hp = Math.min(60, P.hp + 5 * dt);
  G.shake = damp(G.shake, 0, 7, dt);
  var eye = 1.66 + Math.sin(P.bob * 2) * 0.028 * Math.min(1, P.speed / 4.5) * (1 - gun.ads * 0.7), roll = 0;
  if (P.deadT > 0) { P.deadT += dt; var d = Math.min(1, P.deadT / 0.9); eye = lerp(eye, 0.35, d * d); roll = d * 1.1; if (G.mode !== 'tdm' && P.deadT > 2.1 && G.state === 'playing') endGame(false); }
  var sh = G.shake * 0.012;
  camera.position.set(P.x + rnd(-sh, sh), P.y + eye + rnd(-sh, sh), P.z);
  camera.rotation.set(P.pitch + gun.recP + rnd(-sh, sh), P.yaw + gun.recY, roll + rnd(-sh, sh) * 2 + mx * -0.012);
}
function updateSun() {
  var cx = G.state === 'playing' ? P.x : 0, cz = G.state === 'playing' ? P.z : 0;
  cx = Math.round(cx / 2) * 2; cz = Math.round(cz / 2) * 2;
  sun.position.set(cx + SUN_DIR.x * 60, SUN_DIR.y * 60, cz + SUN_DIR.z * 60); sun.target.position.set(cx, 0, cz);
}
var lastT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
  if (G.state === 'playing') {
    G.time += dt; updatePlayer(dt); updateWeapon(dt);
    if (G.mode === 'tdm') tdmUpdate(dt); else updateFlow(dt);
    updateEnemies(dt); updateBolts(dt); updateProjectiles(dt); updatePickups(dt); updateFX(dt);
    updateLineup(dt, 0, 0, false); updateHUD(dt); autoQuality(dt);
  } else if (G.state !== 'paused' && G.state !== 'loading') {
    G.titleT += dt; var a = G.titleT * 0.07 + 1.2;
    if (camera.fov !== G.baseFov) { camera.fov = G.baseFov; camera.updateProjectionMatrix(); }
    if (!stageCamera(dt)) { camera.position.set(Math.sin(a * 3) * 2.5, 1.5, 28.5); camera.rotation.set(0, 0, 0); camera.lookAt(0, 1.75, 21.5); }
    updateFX(dt); updateEnemies(dt); updateLineup(dt, camera.position.x, camera.position.z, G.state === 'title' && !STAGE.on);
  }
  updateSun();
  renderer.render(scene, camera);
}
