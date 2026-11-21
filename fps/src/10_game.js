// ---- game state, player, waves, quality manager, main loop -------------------
var P = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, speed: 0, bob: 0, hp: 100, lookDX: 0, lookDY: 0, landDip: 0, hurtT: 99, deadT: 0 };
var G = { state: 'loading', phase: '', wave: 0, score: 0, rescued: 0, stats: { shots: 0, hits: 0, kills: 0 }, shake: 0, vig: 0, time: 0, timer: 0, queue: [], spawnT: 0, titleT: 0 };
var Q = { tier: 1, mode: store.get('qmode', 'auto'), prScale: 1, acc: 0, frames: 0, bad: 0, good: 0, fps: 60 };

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
  camera.aspect = a; camera.fov = a >= 1.2 ? 66 : clamp(2 * Math.atan(Math.tan(33 * Math.PI / 180) * 1.25 / a) * 180 / Math.PI, 66, 96);
  camera.updateProjectionMatrix(); applyQuality();
  if (gun.root) { var pt = a < 1; gun.root.scale.setScalar(pt ? 0.2 : 0.3); gun.base.set(pt ? 0.04 : 0.068, pt ? -0.058 : -0.062, pt ? -0.12 : -0.155); }
}

function buildWave(w) {
  var n = 3 + w, g = w >= 3 ? Math.floor((w - 1) / 2) : 0, k = w >= 2 ? Math.floor(w / 2) : 0, list = [], i;
  for (i = 0; i < g; i++) list.push('gunner'); for (i = 0; i < k; i++) list.push('kami'); while (list.length < n) list.push('scout');
  for (i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t; }
  return list;
}
function startGame() {
  clearEnemies(); resetFriends();
  P.x = SPAWN_POS[0]; P.z = SPAWN_POS[1]; P.y = 0; P.yaw = 0; P.pitch = 0; P.vx = P.vz = 0; P.hp = 100; P.hurtT = 99; P.deadT = 0; P.bob = 0;
  G.score = 0; G.rescued = 0; G.wave = 0; G.stats = { shots: 0, hits: 0, kills: 0 }; G.shake = 0; G.vig = 0; G.time = 0; G.queue = [];
  gun.ammo = WEAPON.mag; gun.reloadT = 0; gun.cool = 0.3; gun.recP = gun.recY = gun.recPV = gun.recYV = 0; gun.root.visible = true;
  hudCache = {}; H.hitT = 0; H.dmgT = 0; input.fire = false; input.lookX = input.lookY = 0; if (input.resetTouch) input.resetTouch();
  G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null);
  if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} }
  nextWave();
}
function nextWave() {
  G.wave++; G.phase = 'intro'; G.timer = 3; G.queue = buildWave(G.wave);
  var f = FRIENDS[G.wave - 1]; banner('WAVE ' + G.wave, '「' + f.name + '」のケージを守るドローンを全滅させろ', 3); SFX.alarm();
}
function updateFlow(dt) {
  var f = FRIENDS[G.wave - 1];
  if (G.phase === 'intro') { G.timer -= dt; if (G.timer <= 0) { G.phase = 'fight'; G.spawnT = 0; } }
  else if (G.phase === 'fight') {
    var maxAlive = Math.min(3 + Math.floor(G.wave / 2), Q.tier === 0 ? 5 : 6);
    G.spawnT -= dt;
    if (G.queue.length && ENEMIES.length < maxAlive && G.spawnT <= 0) { spawnEnemy(G.queue.pop(), G.wave); G.spawnT = 1.1; }
    if (!G.queue.length && !ENEMIES.length) { G.phase = 'rescue'; banner('エリア確保', '緑に光るケージに近づいて「' + f.name + '」を助けよう', 3.5); SFX.ui(); }
  } else if (G.phase === 'rescue') {
    if (Math.hypot(P.x - f.x, P.z - f.z) < 2.5) {
      f.state = 'free'; G.rescued++; SFX.cage(); SFX.rescue(); P.hp = Math.min(100, P.hp + 45); addScore(500, f.name + ' を救出');
      fxSparks(f.x, 1.2, f.z, 0, 1, 0, 30, 6); fxFlash(f.x, 1.2, f.z, 4, 0.3, 0x9dffd0);
      G.phase = 'rest'; G.timer = G.wave >= 8 ? 2.8 : 2.4; banner('救出成功！', G.rescued + ' / 8 人', 2.2);
    }
  } else if (G.phase === 'rest') { G.timer -= dt; if (G.timer <= 0) { if (G.wave >= 8) endGame(true); else nextWave(); } }
}
function hurtPlayer(dmg, sx, sz) {
  if (P.hp <= 0 || G.state !== 'playing') return;
  P.hp -= dmg; P.hurtT = 0; G.vig = Math.min(1, 0.45 + dmg / 40); G.shake = Math.min(1.6, G.shake + 0.5 + dmg / 30);
  H.dmgT = 1.1; H.dmgX = sx; H.dmgZ = sz; SFX.hurt();
  if (navigator.vibrate) { try { navigator.vibrate(40); } catch (e) {} }
  if (P.hp <= 0) { P.hp = 0; P.deadT = 0.0001; input.fire = false; SFX.lose(); }
}
function endGame(win) {
  var acc = G.stats.shots ? Math.round(G.stats.hits / G.stats.shots * 100) : 0, bonus = 0;
  if (win) { bonus = Math.max(0, Math.round((720 - G.time) * 5)) + Math.round(P.hp) * 10; G.score += bonus; SFX.win(); }
  G.state = 'result'; ROOT.classList.remove('fr-play'); if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} }
  H.rTitle.innerHTML = win ? 'MISSION <span>COMPLETE</span>' : 'MISSION <span>FAILED</span>'; H.rSub.textContent = win ? '全員救出！' : 'WAVE ' + G.wave + ' で力尽きた';
  H.rScore.textContent = G.score;
  H.rStat.innerHTML = ''; [['救出した仲間', G.rescued + ' / 8'], ['撃破数', G.stats.kills], ['命中率', acc + '%'], ['タイム', Math.floor(G.time / 60) + ':' + ('0' + Math.floor(G.time % 60)).slice(-2)], ['クリアボーナス', bonus]].forEach(function (r) { el('span', null, H.rStat, r[0]); el('b', null, H.rStat, String(r[1])); });
  var best = store.get('best', 0), isBest = G.score > best; if (isBest) store.set('best', G.score);
  H.rNote.textContent = isBest ? 'この端末のベストスコア更新！' : 'この端末のベスト： ' + best;
  G.last = { score: G.score, rescued: G.rescued, kills: G.stats.kills, acc: acc, time: Math.round(G.time), win: !!win };
  if (typeof onGameResult === 'function') onGameResult(G.last);
  showScreen('result');
}
function pauseGame() { if (G.state !== 'playing') return; G.state = 'paused'; ROOT.classList.remove('fr-play'); input.fire = false; if (input.resetTouch) input.resetTouch(); if (document.exitPointerLock) { try { document.exitPointerLock(); } catch (e) {} } showScreen('paused'); }
function resumeGame() { G.state = 'playing'; ROOT.classList.add('fr-play'); showScreen(null); if (!input.usedTouch && renderer.domElement.requestPointerLock) { try { renderer.domElement.requestPointerLock(); } catch (e) {} } }
function toTitle() { clearEnemies(); resetFriends(); G.state = 'title'; G.phase = ''; G.wave = 0; ROOT.classList.remove('fr-play'); gun.root.visible = false; if (AU.ok) AU.hum.gain.value = 0; showScreen('title'); }

function updatePlayer(dt) {
  pollKeys();
  var lx = input.lookX, ly = input.lookY; input.lookX = input.lookY = 0;
  if (P.hp > 0) { P.yaw -= lx; P.pitch = clamp(P.pitch - ly, -1.35, 1.35); }
  P.lookDX = lx; P.lookDY = ly;
  var mx = P.hp > 0 ? input.mx : 0, mz = P.hp > 0 ? input.mz : 0, sp = (input.sprint && mz < -0.3) ? 6.9 : 4.5;
  var s = Math.sin(P.yaw), c = Math.cos(P.yaw), wx = (mx * c + mz * s) * sp, wz = (-mx * s + mz * c) * sp, k = 1 - Math.exp(-11 * dt);
  P.vx += (wx - P.vx) * k; P.vz += (wz - P.vz) * k;
  collideMove(P, P.x + P.vx * dt, P.z + P.vz * dt, 0.36, 0);
  P.speed = Math.hypot(P.vx, P.vz);
  var pb = P.bob; P.bob += P.speed * dt * 1.55;
  if (P.speed > 1 && Math.floor(pb / Math.PI) !== Math.floor(P.bob / Math.PI)) SFX.step(P.speed > 5.5);
  P.hurtT += dt; if (P.hp > 0 && P.hp < 60 && P.hurtT > 6) P.hp = Math.min(60, P.hp + 5 * dt);
  G.shake = damp(G.shake, 0, 7, dt);
  var eye = 1.66 + Math.sin(P.bob * 2) * 0.028 * Math.min(1, P.speed / 4.5), roll = 0;
  if (P.deadT > 0) { P.deadT += dt; var d = Math.min(1, P.deadT / 0.9); eye = lerp(eye, 0.35, d * d); roll = d * 1.1; if (P.deadT > 2.1 && G.state === 'playing') endGame(false); }
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
    G.time += dt; updatePlayer(dt); updateWeapon(dt); updateFlow(dt); updateEnemies(dt); updateBolts(dt); updateFX(dt);
    updateFriends(dt, P.x, P.z, G.wave - 1, G.phase); updateHUD(dt); autoQuality(dt);
  } else if (G.state === 'title' || G.state === 'result') {
    G.titleT += dt; var a = G.titleT * 0.07 + 1.2;
    if (G.state === 'title') { camera.position.set(Math.cos(a) * 20, 5.5, Math.sin(a) * 20 + 4); camera.rotation.set(0, 0, 0); camera.lookAt(0, 1.4, 0); }
    updateFX(dt); updateFriends(dt, camera.position.x, camera.position.z, -1, '');
  }
  updateSun();
  renderer.render(scene, camera);
}
