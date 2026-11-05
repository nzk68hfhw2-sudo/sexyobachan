// ---- cooking minigames on the real 3D props -------------------------------------------
var MINI = { active: false }, EXPO_USED = false;
var RUBBER_M = null; function M_rubber() { if (!RUBBER_M) RUBBER_M = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.9 }); return RUBBER_M; }
function glassMat() { return M.glass; }
var SHOTS = { // at = what we look at, d = distance, side = which side of it the cook stands (+z / -z)
  griddle: { at: [0.72, 0.9, -4.74], d: 0.52, side: 1 },
  prep: { at: [-1.3, 0.97, -3.6], d: 0.62, side: 1 },
  coffee: { at: [-1.92, 1.1, -1.62], d: 0.7, side: -1 },
  pie: { at: [3.85, 1.14, -1.62], d: 0.6, side: -1 },
  shake: { at: [-0.8, 1.13, -2.49], d: 0.75, side: 1, dir: [0.1, 0.42, 0.9] }
};
var MINI_CSS = [
  '.mini{position:absolute;left:50%;top:calc(var(--top-safe) + 62px);transform:translateX(-50%);width:min(330px,calc(100% - 40px));padding:9px 14px 11px;border-radius:14px;',
  ' background:linear-gradient(180deg,rgba(28,30,35,.94),rgba(14,15,18,.94)) padding-box,linear-gradient(160deg,#fff,#8e979f 35%,#eef1f3 55%,#5a6168) border-box;border:2px solid transparent;box-shadow:0 10px 24px rgba(0,0,0,.55);pointer-events:none;transition:opacity .25s,transform .25s;}',
  '.mini.hide{opacity:0;transform:translateX(-50%) translateY(-8px)}',
  '.mini .tt{display:flex;align-items:center;gap:8px}.mini .tt .ic{width:22px;height:22px;color:#ffd36a;flex:0 0 auto}.mini .tt .en{font-size:16px}.mini .tt .ja{font-size:11px}',
  '.mini .en{font:400 18px/1.1 "Alfa Slab One",serif;color:#fff3d6;letter-spacing:.03em}.mini .ja{font:500 12px/1.4 "Zen Kaku Gothic New",sans-serif;color:rgba(243,230,200,.8)}',
  '.mini .ins{margin-top:5px;font:600 15px/1.3 Oswald,sans-serif;letter-spacing:.06em;color:#8fd3c1}.mini .ins .ja{color:rgba(143,211,193,.8);letter-spacing:0}',
  '.gauge{position:relative;height:14px;margin-top:10px;border-radius:7px;background:linear-gradient(90deg,#f1dca8,#e7b25e 40%,#b86a24 70%,#3a2010);box-shadow:inset 0 2px 3px rgba(0,0,0,.5)}',
  '.gauge.fill{background:rgba(255,255,255,.1)}.gauge .zone{position:absolute;top:-3px;bottom:-3px;border:2px solid #5be8ff;border-radius:6px;box-shadow:0 0 8px #5be8ff}',
  '.gauge .bar{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:linear-gradient(90deg,#8fd3c1,#e8fbff);width:0}',
  '.gauge .nd{position:absolute;top:-6px;width:4px;height:26px;margin-left:-2px;background:#fff;border-radius:2px;box-shadow:0 0 6px #fff}',
  '.chips{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 14px);display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:6px;max-width:440px;margin:0 auto;pointer-events:none}',
  '.chip2{pointer-events:auto;min-width:0;height:46px;padding:0 3px;border-radius:10px;border:2px solid #d8dde2;background:linear-gradient(180deg,#fff8e6,#e7d4a8);color:#7e1418;font:400 13px/1 "Alfa Slab One",serif;white-space:nowrap;box-shadow:0 4px 0 #8a7448,0 6px 12px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;justify-content:center}',
  '.chip2 small{font:600 9.5px/1.2 "Zen Kaku Gothic New",sans-serif;color:#6b4a2a;white-space:nowrap}.chip2:active{transform:translateY(3px);box-shadow:0 1px 0 #8a7448}',
  '.seq{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}.seq span{font:600 11px/1 Oswald,sans-serif;letter-spacing:.08em;padding:4px 7px;border-radius:999px;background:rgba(255,255,255,.1);color:#cfd6dd}.seq span.now{background:#c8282e;color:#fff}.seq span.ok{background:#2f7e6e;color:#e8fff8}',
  '.stamp{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) rotate(-12deg) scale(1.6);font:400 40px/1 "Alfa Slab One",serif;color:#c8282e;border:5px solid #c8282e;padding:6px 14px;border-radius:8px;background:rgba(251,243,224,.85);opacity:0;pointer-events:none;animation:stamp 1.1s ease-out both;letter-spacing:.06em}',
  '.stamp small{display:block;font:700 13px/1.2 "Zen Kaku Gothic New",sans-serif;text-align:center;letter-spacing:0}',
  '@keyframes stamp{0%{opacity:0;transform:translate(-50%,-50%) rotate(-12deg) scale(2.2)}20%{opacity:1;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) rotate(-12deg) scale(1)}}'
].join('\n');
function buildMiniUI() {
  var st = document.createElement('style'); st.textContent = MINI_CSS; (document.head || document.documentElement).appendChild(st);
  U.mini = el('div', 'mini hide', '', UI); U.chips = el('div', 'chips', '', UI);
}
function miniPanel(iconN, en, ja, insEn, insJa, gauge) {
  U.mini.innerHTML = '<div class="tt">' + icon(iconN, 28) + '<div><span class="en">' + en + '</span><span class="ja">' + ja + '</span></div></div><div class="ins"><span class="en ie">' + insEn + '</span><span class="ja ij">' + insJa + '</span></div>' + (gauge && (gauge.fill || gauge.zone) ? '<div class="gauge' + (gauge.fill ? ' fill' : '') + '">' + (gauge.zone ? '<div class="zone" style="left:' + gauge.zone[0] * 100 + '%;width:' + (gauge.zone[1] - gauge.zone[0]) * 100 + '%"></div>' : '') + (gauge.fill ? '<div class="bar"></div>' : '<div class="nd"></div>') + '</div>' : '') + (gauge && gauge.seq ? '<div class="seq">' + gauge.seq + '</div>' : '');
  U.mini.classList.remove('hide');
}
function miniIns(en, ja) { var e = U.mini.querySelector('.ie'), j = U.mini.querySelector('.ij'); if (e) e.textContent = en; if (j) j.textContent = ja; }
function miniGauge(v) { var n = U.mini.querySelector('.nd'), b = U.mini.querySelector('.bar'); if (n) n.style.left = clamp(v, 0, 1) * 100 + '%'; if (b) b.style.width = clamp(v, 0, 1) * 100 + '%'; }
function stamp(q) {
  var t = q > 0.85 ? ['PERFECT!', '完ぺき！'] : q > 0.6 ? ['GOOD', 'いい感じ'] : q > 0.3 ? ['OKAY', 'まあまあ'] : ['OOPS', '失敗……'];
  var s = el('div', 'stamp', t[0] + '<small>' + t[1] + '</small>', UI); if (q <= 0.3) s.style.color = s.style.borderColor = '#555';
  setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1200);
}
function shotTo(name, instant, at) {
  var s = SHOTS[name], A = at || s.at, d = s.d || 0.6;
  var dir = s.dir ? new THREE.Vector3(s.dir[0], s.dir[1], s.dir[2]).normalize() : new THREE.Vector3(0.06, 0.78, 0.62 * (s.side || 1)).normalize();
  var tgt0 = new THREE.Vector3(A[0], A[1], A[2]);
  var pos = tgt0.clone().add(dir.multiplyScalar(d));
  // aim a little above the dish so it sits in the clear area under the instruction panel
  var tgt = tgt0.clone(); tgt.y += d * 0.2;
  CAM.focusLock = pos.distanceTo(tgt0);
  if (instant || name === 'coffee' || name === 'pie' || name === 'shake') { // cut through black
    fadeBlack(0.18, function () { CAM.override = { pos: pos, target: tgt, k: 1, dur: 0.1 }; });
  } else closeShot(pos, tgt, 0.7);
  PU.uDof.value = 0.18; PU.uFocusRange.value = 0.8; PU.uFocus.value = CAM.focusLock; PU.uBloom.value = 0.45;
}
function fadeBlack(sec, mid) { var t0 = performance.now(); MINI.fadeT = 0; var step = function () { var k = (performance.now() - t0) / 1000 / sec; if (k < 1) { PU.uBlack.value = k; requestAnimationFrame(step); } else { PU.uBlack.value = 1; if (mid) mid(); var t1 = performance.now(); var s2 = function () { var k2 = (performance.now() - t1) / 1000 / sec; PU.uBlack.value = 1 - Math.min(1, k2); if (k2 < 1) requestAnimationFrame(s2); }; requestAnimationFrame(s2); } }; requestAnimationFrame(step); }
function startMini(type, done) {
  if (MINI.active) return;
  hideChoices(); U.rail.style.display = 'none';
  MINI = { active: true, type: type, done: done, t: 0, objs: new THREE.Group(), score: [], phase: 0 };
  RENDER.scene.add(MINI.objs);
  MINI.bad = cookWantsBad(type);
  ({ pancake: miniPancake, egg: miniEgg, burger: miniBurger, coffee: miniCoffee, pie: miniPie, shake: miniShake })[type]();
  updateMainButton(); stackCooking();
  cookHookStart(MINI);
}
function endMini(q) {
  var M = MINI; if (!M.active) return;
  M.active = false; M.endPending = true; U.mini.classList.add('hide'); U.chips.innerHTML = ''; setMain2(null); stackCooking();
  cookHookEnd(M, q);
  stamp(q); if (q > 0.85) sfx('orderBell', null, { vol: 0.35 });
  // the dish counts as done right away (SERVE / next dish show at once); only the camera & props wait
  if (!M.bad && GAME.mode === 'play') { M.done && M.done(q); M.done = null; }
  updateMainButton(); refreshTickets();
  setTimeout(function () {
    if (M.emit) steamStop(M.emit);
    RENDER.scene.remove(M.objs); freeGeo(M.objs);
    if (M.cut) fadeBlack(0.18, function () { CAM.override = null; }); else releaseShot(0.6);
    PU.uDof.value = 0; CAM.focusLock = 0; PU.uBloom.value = 0.9;
    M.endPending = false;
    if (M.bad && GAME.mode === 'play') badFoodChoice(M, q);
    updateMainButton(); refreshTickets();
  }, 900);
}
// leave the griddle in the middle of cooking (e.g. to pick up the phone): the dish is ruined, the ticket stays
function abortMini(en, ja) {
  var M = MINI; if (!M.active) return false;
  M.active = false; M.aborted = true; U.mini.classList.add('hide'); U.chips.innerHTML = ''; setMain2(null);
  if (M.emit) steamStop(M.emit);
  RENDER.scene.remove(M.objs); freeGeo(M.objs);
  if (WORLD.coffeePot) WORLD.coffeePot.visible = true;
  if (M.type === 'pie' && WORLD.pieCase) WORLD.pieCase.children.forEach(function (c) { if (c.material === glassMat()) c.visible = true; });
  if (WORLD.shakeCup) WORLD.shakeCup.position.x = 0;
  CAM.override = null; PU.uDof.value = 0; CAM.focusLock = 0; PU.uBloom.value = 0.9;
  sfx('scrape', null, { vol: 0.5 }); GAME.ruined = (GAME.ruined || 0) + 1;
  cookHookEnd(M, -1);
  stackCooking();
  if (en) toast(en, ja, 2.8);
  updateMainButton(); refreshTickets();
  return true;
}
function miniMain(act) { MINI.main = act; updateMainButton(); }
function zoneScore(v, a, b, soft) { if (v >= a && v <= b) return 1; var d = v < a ? a - v : v - b; return clamp(1 - d / (soft || 0.25), 0, 1); }
// colour of a pancake face from cook amount 0..1
var CK = null;
function cookCol(k, out) { if (!CK) CK = [new THREE.Color(0xf3e0b0), new THREE.Color(0xd59a48), new THREE.Color(0x8a4a18), new THREE.Color(0x24140a)]; k = clamp(k, 0, 1) * 3; var i = Math.min(2, Math.floor(k)); return out.copy(CK[i]).lerp(CK[i + 1], k - i); }
// ---------------- PANCAKES -----------------------------------------------------------------
function miniPancake() {
  var M = MINI; shotTo('griddle', false, [0.72, 0.9, -4.74]); M.emit = steamEmit(0.75, 0.95, -4.75, 3, 0.15);
  var base = new THREE.Vector3(0.72, 0.9, -4.76);
  var ring = mesh(new THREE.RingGeometry(0.075, 0.085, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.4, 3.0), transparent: true, opacity: 0.8 }), base.x, base.y + 0.002, base.z, M.objs, false); ring.rotation.x = -PI / 2;
  var topM = stdMat({ color: 0xf3e0b0, roughness: 0.7 }), botM = stdMat({ color: 0xf3e0b0, roughness: 0.7 }), sideM = stdMat({ color: 0xead2a0, roughness: 0.8 });
  var pc = group(M.objs, base.x, base.y, base.z), cake = mesh(new THREE.CylinderGeometry(1, 1, 1, 32), [sideM, topM, botM], 0, 0.006, 0, pc); pc.scale.set(0.001, 0.012, 0.001);
  var bub = []; for (var i = 0; i < 14; i++) { var b = mesh(new THREE.CircleGeometry(0.004 + Math.random() * 0.004, 8), new THREE.MeshBasicMaterial({ color: 0x8a6a3a }), (Math.random() - 0.5) * 0.1, 0.0125, (Math.random() - 0.5) * 0.1, pc, false); b.rotation.x = -PI / 2; b.visible = false; b.scale.setScalar(1 / 0.08); bub.push(b); }
  var size = 0, cookA = 0, cookB = 0, holding = false, flipT = -1, side = 'A';
  if (M.bad) { botM.map = toTex(burntFaceCanvas(), { clamp: true }); botM.needsUpdate = true; }
  miniPanel('cook', 'PANCAKES', 'パンケーキ', 'HOLD to pour the batter — fill the ring', '長押しで生地を流す（輪の大きさまで）', { fill: 1, zone: [0.68, 0.82] });
  M.onDown = function () { if (M.phase === 0) { holding = true; sfx('pour', base, { len: 3 }); } };
  M.onUp = function () { if (M.phase === 0 && holding) { holding = false; M.score.push(zoneScore(size, 0.68, 0.82, 0.3)); M.phase = 1; ring.visible = false; sfx('sizzle', base, { len: 4 }); miniPanel('cook', 'PANCAKES', 'パンケーキ', 'Wait for bubbles, then FLIP when golden', '泡が出て、焼き色が金色になったら返す', { zone: [0.36, 0.5] }); miniMain({ icon: 'spatula', en: 'FLIP', ja: 'ひっくり返す', glow: true, fn: flip }); } };
  function flip() { if (M.phase !== 1) return; M.score.push(zoneScore(cookA, 0.36, 0.5, 0.25)); M.phase = 2; flipT = 0; sfx('flip', base); sfx('scrape', base); miniMain(null); }
  function plate() { if (M.phase !== 3) return; M.score.push(zoneScore(cookB, 0.36, 0.5, 0.25)); M.phase = 4; sfx('scrape', base); sfx('cup', base, { delay: 0.3 }); miniMain(null); var q = (M.score[0] + M.score[1] + M.score[2]) / 3; endMini(q); }
  M.update = function (dt) {
    if (M.phase === 0 && holding) { size = Math.min(1.2, size + dt * 0.55); }
    var r = 0.02 + size * 0.075; pc.scale.x = pc.scale.z = damp(pc.scale.x, r, 12, dt);
    if (M.phase === 0) miniGauge(size / 1.2 * 1.0);
    if (M.phase === 1) { cookA += dt * 0.15; miniGauge(cookA); cookCol(cookA * 0.6, topM.color.set(0xf3e0b0)); cookCol(0.05, topM.color); cookCol(cookA, botM.color); bub.forEach(function (b, i) { b.visible = cookA > 0.18 + i * 0.012; }); topM.color.set(0xf0dcaa); }
    if (M.phase === 2) { flipT += dt / 0.45; var k = Math.min(1, flipT); pc.position.y = base.y + Math.sin(k * PI) * 0.12; pc.rotation.x = k * PI; if (k >= 1) { M.phase = 3; pc.rotation.x = PI; pc.position.y = base.y + 0.012; bub.forEach(function (b) { b.visible = false; }); if (M.bad) { sfx('whisper', base, { vol: 0.35 }); } miniPanel('cook', 'PANCAKES', 'パンケーキ', 'Golden again? PLATE IT', 'もう片面も金色になったらお皿へ', { zone: [0.36, 0.5] }); miniMain({ icon: 'serve', en: 'PLATE IT', ja: 'お皿にのせる', glow: true, fn: plate }); } }
    if (M.phase === 3) { cookB += dt * 0.19; miniGauge(cookB); cookCol(cookB, topM.color); }
    if ((M.phase === 1 && cookA > 1.05) || (M.phase === 3 && cookB > 1.05)) { sfx('zap', base, { vol: 0.3 }); M.score.push(0, 0); M.phase = 5; miniMain(null); endMini(0.1); }
  };
}
// ---------------- SUNNY SIDE EGG -------------------------------------------------------------
function miniEgg() {
  var M = MINI; shotTo('griddle', false, [1.12, 0.9, -4.72]); M.emit = steamEmit(1.15, 0.95, -4.72, 2, 0.1);
  var base = new THREE.Vector3(1.12, 0.892, -4.74), f = foodMats();
  var wm = new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.2, transparent: true, opacity: 0.35 });
  var white = mesh(eggWhiteGeo(9), wm, base.x, base.y, base.z, M.objs); white.scale.setScalar(0.01); white.visible = false;
  var yolk = mesh(new THREE.SphereGeometry(0.024, 18, 12, 0, TAU, 0, PI / 2), f.yolk, base.x, base.y + 0.004, base.z, M.objs); yolk.scale.set(1, 0.8, 1); yolk.visible = false;
  var shell = mesh(new THREE.SphereGeometry(0.03, 14, 10), stdMat({ color: 0xf3ead8, roughness: 0.6 }), base.x, base.y + 0.25, base.z, M.objs); shell.scale.set(1, 1.3, 1);
  var setK = 0, dropT = -1, swiped = false, eye = null;
  if (M.bad) { // the yolk is an eye. it looks for you.
    eye = group(M.objs, base.x, base.y + 0.006, base.z); eye.visible = false;
    mesh(new THREE.SphereGeometry(0.023, 18, 14), stdMat({ color: 0xf0e2c4, roughness: 0.25 }), 0, 0, 0, eye);
    mesh(new THREE.CircleGeometry(0.011, 20), new THREE.MeshStandardMaterial({ color: 0x4a2e14, roughness: 0.3 }), 0, 0, 0.0232, eye, false);
    mesh(new THREE.CircleGeometry(0.005, 16), new THREE.MeshBasicMaterial({ color: 0x050505 }), 0, 0, 0.0234, eye, false);
    yolk.material = stdMat({ color: 0xb02a1a, roughness: 0.3 }); yolk.scale.set(1.15, 0.25, 1.15);
  }
  miniPanel('cook', 'SUNNY SIDE UP', '目玉焼き', 'TAP to crack the egg', 'タップで卵を割る', null);
  miniMain({ icon: 'cook', en: 'CRACK EGG', ja: '卵を割る', glow: true, fn: function () { if (M.phase) return; M.phase = 1; dropT = 0; sfx('crack', base); miniMain(null); } });
  M.onMove = function (x, y, dx, dy) { if (M.phase === 2 && !swiped && INPUT.y0 - y > 60) { swiped = true; slide(); } };
  function slide() { if (M.phase !== 2) return; M.phase = 3; sfx('scrape', base); var q = zoneScore(setK, 0.62, 0.8, 0.22); endMini(q); miniMain(null); }
  M.update = function (dt) {
    if (M.phase === 1) { dropT += dt / 0.35; shell.position.y = base.y + 0.25 - Math.min(1, dropT) * 0.2; if (dropT >= 1) { shell.visible = false; white.visible = yolk.visible = true; if (eye) { eye.visible = true; eye.lookAt(base.x, base.y - 1, base.z + 0.2); } M.phase = 2; sfx('sizzle', base, { len: 5 }); miniPanel('cook', 'SUNNY SIDE UP', '目玉焼き', 'Whites set? SWIPE UP to plate (don\'t flip!)', '白身が固まったら上にスワイプでお皿へ（返さない）', { zone: [0.62, 0.8] }); miniMain({ icon: 'serve', en: 'TO PLATE', ja: 'お皿にすべらせる', fn: slide }); } }
    if (M.phase >= 2) { white.scale.setScalar(damp(white.scale.x, 1, 6, dt)); }
    if (eye && M.phase === 2) { var q0 = eye.quaternion.clone(); eye.lookAt(RENDER.camera.position); var q1 = eye.quaternion.clone(); eye.quaternion.copy(q0).slerp(q1, Math.min(1, dt * (setK > 0.3 ? 1.5 : 0.2))); if (!M.eyeSnd && setK > 0.3) { M.eyeSnd = 1; sfx('whisper', base, { vol: 0.3 }); } }
    if (M.phase === 2) { setK += dt * 0.17; miniGauge(setK); wm.opacity = clamp(0.35 + setK * 0.9, 0, 1); cookCol(Math.max(0, setK - 0.8) * 1.5, wm.color.set(0xf6f0e2)); if (setK < 0.8) wm.color.set(0xf6f0e2); if (setK > 1.1) { M.phase = 4; sfx('zap', base, { vol: 0.3 }); miniMain(null); endMini(0.1); } }
  };
}
// ---------------- CHEESEBURGER ---------------------------------------------------------------
function miniBurger() {
  var M = MINI; shotTo('prep', false, [-1.3, 0.97, -3.6]); var f = foodMats();
  var base = new THREE.Vector3(-1.3, 0.955, -3.6);
  mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 28), f.plate, base.x, base.y - 0.005, base.z, M.objs);
  var mid = ['cheese', 'lettuce', 'tomato'].sort(function () { return Math.random() - 0.5; }).slice(0, 2);
  var seq = ['bun', 'patty'].concat(mid).concat(['top']);
  var LBL = { bun: ['BUN', 'パン（下）'], patty: ['PATTY', 'パティ'], cheese: ['CHEESE', 'チーズ'], lettuce: ['LETTUCE', 'レタス'], tomato: ['TOMATO', 'トマト'], top: ['TOP BUN', 'パン（上）'] };
  var idx = 0, miss = 0, h = 0;
  function seqHTML() { return seq.map(function (s, i) { return '<span class="' + (i < idx ? 'ok' : i === idx ? 'now' : '') + '">' + LBL[s][0] + '</span>'; }).join(''); }
  function panel() { miniPanel('cook', 'CHEESEBURGER', 'チーズバーガー', 'TAP the fixings in ticket order', '伝票の順番に具材をタップ', { seq: seqHTML() }); }
  panel();
  var opts = seq.slice().sort(function () { return Math.random() - 0.5; });
  U.chips.innerHTML = '';
  opts.forEach(function (k) {
    var c = el('button', 'chip2', LBL[k][0] + '<small>' + LBL[k][1] + '</small>', U.chips);
    onTap(c, function () {
      if (!MINI.active) return;
      if (k !== seq[idx]) { miss++; sfx('thump', base, { vol: 0.4 }); CAM.shake = 0.25; return; }
      var m, y = base.y + h;
      if (k === 'bun') { m = mesh(new THREE.CylinderGeometry(0.058, 0.055, 0.022, 24), [f.bun, f.bunIn, f.bun], base.x, y + 0.011, base.z, M.objs); h += 0.022; }
      if (k === 'patty') { m = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 24), M.bad ? stdMat({ color: 0x8a2a24, roughness: 0.35 }) : f.patty, base.x, y + 0.01, base.z, M.objs); h += 0.02; sfx('sizzle', base, { len: 0.8, vol: 0.6 }); if (M.bad) M.pulse = m; }
      if (k === 'cheese') { m = mesh(new THREE.BoxGeometry(0.11, 0.004, 0.11, 6, 1, 6), f.cheese, base.x, y + 0.002, base.z, M.objs); droop(m.geometry, 0.04, 0.012); m.rotation.y = 0.6; h += 0.004; }
      if (k === 'lettuce') { m = mesh(new THREE.CircleGeometry(0.068, 18), f.lettuce, base.x, y + 0.003, base.z, M.objs); m.rotation.x = -PI / 2; wavy(m.geometry); h += 0.006; }
      if (k === 'tomato') { m = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 18), f.tomato, base.x, y + 0.004, base.z, M.objs); h += 0.008; }
      if (k === 'top') { m = mesh(new THREE.SphereGeometry(0.06, 24, 12, 0, TAU, 0, PI / 2), f.bun, base.x, y, base.z, M.objs); m.scale.y = 0.62; }
      m.position.y += 0.08; var y0 = m.position.y; var t0 = performance.now(); var drop = function () { var k2 = Math.min(1, (performance.now() - t0) / 180); m.position.y = y0 - 0.08 * k2 * k2; if (k2 < 1) requestAnimationFrame(drop); }; drop();
      sfx('thump', base, { vol: 0.5 }); c.style.visibility = 'hidden'; idx++; panel();
      if (idx >= seq.length) { U.chips.innerHTML = ''; var q = clamp(1 - miss * 0.22 - Math.max(0, M.t - 8) * 0.03, 0.15, 1); endMini(q); }
    });
  });
  M.update = function (dt, t) { if (M.pulse) { var b = Math.pow(Math.max(0, Math.sin(t * 7.5)), 6); M.pulse.scale.set(1 + b * 0.08, 1 + b * 0.35, 1 + b * 0.08); M.beatT = (M.beatT || 0) - dt; if (M.beatT <= 0) { M.beatT = 0.84; sfx('heart', base, { n: 1, vol: 0.35 }); } } };
}
// ---------------- COFFEE ---------------------------------------------------------------
function miniCoffee() {
  var M = MINI; M.cut = true; shotTo('coffee');
  var mat = mesh(new THREE.BoxGeometry(0.34, 0.006, 0.26), M_rubber(), -1.92, 1.053, -1.62, M.objs, false); mat.receiveShadow = true;
  var cup = makeCup(true); cup.position.set(-1.88, 1.056, -1.62); cup.scale.setScalar(1.25); M.objs.add(cup); var cf = cup.userData.coffee; cf.position.y = 0.02;
  M.expo = 0.82;
  var pot = makeCoffeePot(); pot.position.set(-2.05, 1.25, -1.62); pot.rotation.z = 0; M.objs.add(pot); WORLD.coffeePot.visible = false;
  var lineM = mesh(new THREE.TorusGeometry(0.044 * 1.25, 0.0015, 4, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.4, 3) }), -1.88, 1.056 + 0.067 * 1.25, -1.62, M.objs, false); lineM.rotation.x = PI / 2;
  var level = 0, holding = false, pourSnd = 0, auto = false, target = 0.86 + Math.random() * 0.05;
  miniPanel('coffee', 'COFFEE', 'コーヒー', 'TAP to pour a cup', 'タップでコーヒーを注ぐ', { fill: 1, zone: [0.82, 0.93] });
  var pour = function () { if (M.phase || auto) return; auto = holding = true; sfx('pour', cup.position, { len: 1.8 }); miniMain(null); };
  miniMain({ icon: 'coffee', en: 'POUR', ja: 'コーヒーを注ぐ', glow: true, fn: pour });
  M.onDown = function () { pour(); };
  M.onUp = function () { };
  var finish = function () { holding = false; M.phase = 1; var q = 0.92; WORLD.coffeePot.visible = true; sfx('cup', cup.position); M.emit = steamEmit(cup.position.x, cup.position.y + 0.1, cup.position.z, 3, 0.03); if (M.bad) { } else if (GAME.day >= 2 && Math.random() < 0.25) coffeeFace(cf); endMini(q); };
  M.update = function (dt) {
    pot.rotation.z = damp(pot.rotation.z, holding ? -1.1 : 0, 8, dt);
    if (holding) { level += dt * 0.6; if (M.bad && !M.faced && level > 0.45) { M.faced = 1; coffeeFace(cf, 2600); } if (level >= target) finish(); }
    miniGauge(level / 1.05); cf.position.y = 0.012 + Math.min(level, 1.05) * 0.06; cf.visible = level > 0.02;
  };
}
function coffeeFace(cf, ms) { // a face looks up from the coffee for an instant
  var n = pickFace(['glitch', 'human'], 'coffee'); if (!n) return;
  var c = horrorCanvas(n), t = toTex(c, { clamp: true }), old = cf.material; cf.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.05, color: 0x9a7a6a });
  sfx('whisper', null, { vol: 0.3 }); setTimeout(function () { cf.material = old; t.dispose(); }, ms || 260);
}
// ---------------- CHERRY PIE ---------------------------------------------------------------
function miniPie() {
  var M = MINI; M.cut = true; shotTo('pie');
  var pc = WORLD.pieCase, ang = -0.6 + Math.random() * 1.2, guide = new THREE.Group(); M.objs.add(guide);
  var gm = mesh(new THREE.PlaneGeometry(0.004, 0.16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.4, 3), transparent: true, opacity: 0.9 }), 0, 0, 0.08, guide, false); gm.rotation.x = -PI / 2;
  guide.position.set(pc.position.x, pc.position.y + 0.185, pc.position.z); guide.rotation.y = ang + PI;
  var dome = pc.children.filter(function (c) { return c.geometry && c.geometry.type === 'SphereGeometry' && c.material === glassMat(); })[0];
  pc.children.forEach(function (c) { if (c.material === glassMat()) c.visible = false; });
  var sx = 0, sy = 0, swiping = false;
  miniPanel('pie', 'CHERRY PIE', 'チェリーパイ', 'SWIPE along the glowing line to cut', '光る線にそってスワイプして切る', null);
  M.onDown = function (x, y) { swiping = true; sx = x; sy = y; };
  M.onUp = function (x, y) {
    if (!swiping || M.phase) return; swiping = false;
    var dx = x - sx, dy = y - sy; if (Math.hypot(dx, dy) < 40) return;
    // compare with guide direction on screen
    var a = new THREE.Vector3(pc.position.x, pc.position.y + 0.18, pc.position.z), b = a.clone().add(new THREE.Vector3(Math.sin(ang + PI) * 0.15, 0, Math.cos(ang + PI) * 0.15));
    a.project(RENDER.camera); b.project(RENDER.camera);
    var gx = (b.x - a.x), gy = -(b.y - a.y), g1 = Math.atan2(gy, gx), s1 = Math.atan2(dy, dx), d = Math.abs(angDiff(g1, s1)); d = Math.min(d, Math.abs(PI - d));
    var q = clamp(1 - d / 0.6, 0.1, 1);
    M.phase = 1; sfx('knife', pc.position); gm.visible = false;
    setTimeout(function () { pc.children.forEach(function (c) { if (c.material === glassMat()) c.visible = true; }); }, 900);
    endMini(q);
  };
}
// ---------------- MILKSHAKE ---------------------------------------------------------------
function miniShake() {
  var M = MINI; M.cut = true; shotTo('shake');
  var v = 0, dir = 1, holding = false, whirT = 0; M.expo = 0.82;
  mesh(new THREE.BoxGeometry(0.3, 0.006, 0.26), M_rubber(), -0.8, 0.963, -2.49, M.objs, false);
  var sc = WORLD.shakeCup, wp = new THREE.Vector3(); sc.getWorldPosition(wp);
  var liq = mesh(new THREE.CylinderGeometry(0.055, 0.042, 1, 18), foodMats().shake, wp.x, wp.y - 0.09, wp.z, M.objs, false); liq.scale.y = 0.001;
  miniPanel('coffee', 'MILKSHAKE', 'ミルクシェイク', 'HOLD to blend — release in the blue zone', '長押しでミキサー（青いところで離す）', { fill: 1, zone: [0.7, 0.84] });
  M.onDown = function () { if (M.phase) return; holding = true; sfx('whir', WORLD.shakeMixer.position, { len: 3.5 }); };
  M.onUp = function () { if (M.phase || !holding) return; holding = false; M.phase = 1; var q = zoneScore(v, 0.7, 0.84, 0.25); sfx('pour', WORLD.shakeMixer.position, { len: 0.6 }); endMini(q); };
  M.update = function (dt, t) {
    if (holding) { v += dt * 0.3; if (v > 1) v = 1; WORLD.shakeCup.position.x = Math.sin(t * 60) * 0.002; }
    liq.scale.y = Math.max(0.001, v * 0.17); liq.position.y = wp.y - 0.095 + v * 0.085;
    miniGauge(v);
  };
}
function updateMini(dt, t) { if (MINI.active && MINI.expo) { EXPO_USED = true; PU.uExposure.value = damp(PU.uExposure.value, MINI.expo, 6, dt); } else if (EXPO_USED) { PU.uExposure.value = damp(PU.uExposure.value, 1, 6, dt); if (Math.abs(PU.uExposure.value - 1) < 0.005) { PU.uExposure.value = 1; EXPO_USED = false; } } if (!MINI.active) return; MINI.t += dt; if (MINI.update) MINI.update(dt, t); }
