// ---- scares that happen even when you follow every rule -------------------------------------
var SCARE = {};
function scaresReset() { SCARE = {}; }
var _sv = null;
// the door chimes. nobody is there.
function ghostBell() {
  if (GAME.mode !== 'play') return;
  var door = new THREE.Vector3(6, 2.3, 4.9);
  sfx('doorbell', door); openDoorAnim();
  LSTATE.coldT = Math.max(LSTATE.coldT, 0.3); setTimeout(function () { if (!GAME.inAnomaly) LSTATE.coldT = Math.min(LSTATE.coldT, 0.1 + GAME.day * 0.04); }, 4000);
  setNeonEyes(1, null); setTimeout(function () { if (!ACTIVE.some(function (a) { return a.id === 'sunny'; })) setNeonEyes(0, null); }, 2600);
  setTimeout(function () { if (GAME.mode === 'play' && !TALK.busy) { say('YOU', 'Welcome to Sunny Side! ...Hello?', 'いらっしゃいませ！ ……あれ？', { voice: 'you', cls: 'you', hold: 0.5 }); } }, 900);
  setTimeout(function () { if (GAME.mode === 'play') { toast('Nobody came in.', '……誰も入ってこなかった。', 2.4); sfx('breath', door, { len: 1.4, vol: 0.35 }); } }, 4200);
}
// the lights go out one by one, coming toward you — then all come back
function hallwayLights() {
  if (GAME.mode !== 'play' || !WORLD.pendants) return;
  var cam = RENDER.camera.position, wp = new THREE.Vector3();
  var list = WORLD.pendants.map(function (b) { b.getWorldPosition(wp); return { b: b, p: wp.clone(), d: wp.distanceTo(cam) }; }).sort(function (a, b) { return b.d - a.d; });
  var i = 0;
  if (JUKE.key) { SCARE.hallJuke = [JUKE.key, JUKE.label]; jukeStop(0.4, 0.8); }
  var step = function () {
    if (GAME.mode !== 'play') return reset();
    if (i < list.length) {
      var it = list[i++]; it.b.userData.off = true; sfx('switch', it.p, { vol: 0.55 });
      if (!LSTATE.kitchenOff) LSTATE.powerT = 1 - (i / list.length) * 0.75;
      setTimeout(step, 380 - Math.min(160, i * 18));
    } else {
      sfx('breath', new THREE.Vector3(cam.x + 0.3, cam.y, cam.z + 0.3), { len: 1.6, vol: 0.6 });
      setTimeout(function () { sfx('zap', new THREE.Vector3(1.5, 2.5, -2.6), { vol: 0.6 }); LSTATE.flick = 0.5; reset(); }, 1500);
    }
  };
  var reset = function () {
    WORLD.pendants.forEach(function (b) { b.userData.off = false; }); if (!LSTATE.kitchenOff) LSTATE.powerT = 1;
    var j = SCARE.hallJuke; SCARE.hallJuke = null; if (j && GAME.mode === 'play' && !GAME.inAnomaly && !JUKE.key && LSTATE.lightsOn && !CAM.inFreezer) setTimeout(function () { if (!JUKE.key && !GAME.inAnomaly) jukePlay(j[0], { label: j[1] }); }, 1800);
  };
  step();
}
// fake-outs: something starts... and nothing happens (this time)
function fakeOut() {
  if (GAME.mode !== 'play') return;
  var r = Math.random(), phoneBusy = ACTIVE.some(function (a) { return a.id === 'phone'; });
  if (r < 0.4) { // the music dies, the room holds its breath... a bang from the freezer, and the song comes back
    SCARE.hushT = 7; if (JUKE.key) { SCARE.fakeJuke = [JUKE.key, JUKE.label]; sfx('needle', WORLD.jukeboxPos); jukeStop(0.3, 0.7); }
    setTimeout(function () { if (GAME.mode === 'play') sfx('freezerBang', new THREE.Vector3(6.5, 1.2, -4), { vol: 1 }); }, 6200);
    setTimeout(function () { var j = SCARE.fakeJuke; SCARE.fakeJuke = null; if (j && GAME.mode === 'play' && !GAME.inAnomaly && !JUKE.key && LSTATE.lightsOn && !CAM.inFreezer) jukePlay(j[0], { label: j[1] }); }, 8600);
  } else if (r < 0.7 && !phoneBusy && WORLD.phonePos) { // one ring. just one.
    sfx('ring', WORLD.phonePos, { vol: 1 }); setTimeout(function () { if (GAME.mode === 'play') sfx('handset', WORLD.phonePos, { vol: 0.25 }); }, 2600);
  } else { // the egg on the wall turns to you, and says one thing
    setNeonEyes(1, 'red'); LSTATE.eyesExtra = 1.5; sfx('whisper', new THREE.Vector3(1.5, 2.5, -2.6), { vol: 0.5 });
    setTimeout(function () { if (GAME.mode === 'play' && !TALK.busy && !MINI.active) { say('SUNNY', '...Not yet.', '……まだだよ。', { voice: 'sunny', picoDark: 0.8, rate: 0.7, pitch: 0.6, hold: 0.4 }); TALK.busy = false; } }, 700);
    setTimeout(function () { if (!ACTIVE.some(function (a) { return a.id === 'sunny'; })) { setNeonEyes(0, null); LSTATE.eyesExtra = 1; } }, 3200);
  }
}
// a face pressed on the glass of the front windows (only where you are looking)
function windowFace(kinds) {
  if (GAME.mode !== 'play' || CAM.inFreezer || CAM.outside || MINI.active) return false;
  var cam = RENDER.camera, dir = new THREE.Vector3(); cam.getWorldDirection(dir);
  if (cam.position.z < -2 || dir.z < 0.35) { sfx('knock', new THREE.Vector3(cam.position.x, 1.4, 5.1), { n: 2, vol: 0.6 }); return false; }
  var t = (5.08 - cam.position.z) / dir.z, p = cam.position.clone().addScaledVector(dir, t);
  p.x = clamp(p.x, -7.3, 4.6); p.y = clamp(p.y, 1.2, 1.7); p.z = 5.12;
  var n = pickFace(kinds || ['human', 'flesh', 'mouth'], 'window'), tex = toTex(horrorCanvas(n), { clamp: true });
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x8c8c94, transparent: true, opacity: 0, depthWrite: false }));
  sp.scale.set(0.5, 0.6, 1); sp.position.copy(p); RENDER.scene.add(sp);
  sfx('thump', p, { vol: 0.8 }); sfx('breath', p, { len: 1.2, vol: 0.5, delay: 0.1 });
  var t0 = performance.now(); var st = function () { var k = (performance.now() - t0) / 1100; sp.material.opacity = k < 0.12 ? k / 0.12 * 0.8 : 0.8 * (1 - clamp((k - 0.7) / 0.3, 0, 1)); if (k < 1) requestAnimationFrame(st); else { RENDER.scene.remove(sp); tex.dispose(); sp.material.dispose(); } };
  requestAnimationFrame(st);
  return true;
}
(function wrapAmbient() { // ambient scares get the window face too
  var base = ambientScare;
  ambientScare = function () { if (GAME.mode !== 'play' || JS.on) return; if (Math.random() < 0.22 && windowFace()) return; base(); };
})();
// after things go quiet again: a small aftershock
function afterCalm(A) {
  if (Math.random() > 0.55) return;
  setTimeout(function () {
    if (GAME.mode !== 'play' || GAME.inAnomaly || JS.on) return;
    var r = Math.random();
    if (r < 0.45) windowFace(A && A.face ? null : null);
    else if (r < 0.75) sfx('whisper', new THREE.Vector3(RENDER.camera.position.x - 0.6, 1.6, RENDER.camera.position.z - 0.4), { vol: 0.45 });
    else sfx('steps', new THREE.Vector3(-9.6, 0.2, 0.2), { n: 4, vol: 0.8 });
  }, 14000 + Math.random() * 14000);
}
// the odd guest leaves... and has something to say on the way out
var LEAVE_ODD = [['See you tomorrow night, {name}.', 'また明日の夜にね、{name}。'], ['I\'ll remember your face.', '顔、おぼえたよ。'], ['You followed the rules. This time.', 'ルール、守ったね。今回は。'], ['Leave the light on for me.', '明かり、つけといてね。']];
var LEAVE_LATE = [['Don\'t stay till sunrise, kid.', '朝までいちゃだめだよ、きみ。'], ['That egg\'s been watching you all night.', 'あの卵、ひと晩じゅうきみを見てたよ。'], ['Same time tomorrow? ...If you\'re still here.', 'また明日？ ……まだいたらね。'], ['The last night kid said the same thing.', '前の夜勤の子も、同じこと言ってた。']];
function leaveWhisper(C) {
  if (GAME.mode !== 'play' || !C.P) return;
  var nm = SAVE.name || 'friend', nmJa = SAVE.name || 'きみ';
  if (C.anomaly && C.anomaly.done && C.anomaly.ok) {
    setTimeout(function () {
      if (GAME.mode !== 'play' || !C.P || TALK.busy) return;
      var L = pickL(LEAVE_ODD); sfx('whisper', C.P.root.position, { vol: 0.6 });
      say('???', L[0].replace('{name}', nm), L[1].replace('{name}', nmJa), { voice: 'odd', odd: true, cls: 'odd', hold: 0.5 }); TALK.busy = false;
      if (Math.random() < 0.5) setTimeout(function () { if (!GAME.inAnomaly) windowFace(['human', 'mouth']); }, 5500);
    }, 1300);
  } else if (!C.anomaly && GAME.min > 200 && Math.random() < 0.18 + GAME.day * 0.04) {
    setTimeout(function () { if (GAME.mode !== 'play' || TALK.busy || !C.P) return; var L = pickL(LEAVE_LATE); custSay(C, L[0], L[1]); TALK.busy = false; }, 1600);
  }
}
// the hush before something happens: the jukebox and the room fall silent; only the griddle and footsteps
function updateHush(nextA, dt) {
  if (SCARE.hushT > 0) SCARE.hushT -= dt;
  var soon = nextA && COOK_ANOM.indexOf(nextA.id) < 0 && nextA.id !== 'phone' && nextA.at - GAME.min < 9 && !GAME.inAnomaly;
  var hush = !!soon || SCARE.hushT > 0;
  if (hush && !GAME.hush) {
    GAME.hush = true;
    if (soon && JUKE.key) { GAME.hushJuke = [JUKE.key, JUKE.label]; jukeStop(2.5, 0.4); }
    if (soon) setTimeout(function () { if (GAME.hush) sfx('steps', new THREE.Vector3(-6 + Math.random() * 10, 0.2, -6.5), { n: 3, vol: 0.45 }); }, 2500);
  } else if (!hush && GAME.hush) {
    GAME.hush = false; var j = GAME.hushJuke; GAME.hushJuke = null;
    if (j && GAME.mode === 'play' && !GAME.inAnomaly && !JUKE.key && LSTATE.lightsOn && !CAM.inFreezer) setTimeout(function () { if (!JUKE.key && !GAME.inAnomaly && GAME.mode === 'play') jukePlay(j[0], { label: j[1] }); }, 1500);
  }
}
// the Sunny suit in the parking lot: every time you look at it, it is closer (night 4+, after 1 AM)
function updateNightScares(dt) {
  var sp = WORLD.costume; if (!sp || GAME.day < 4 || GAME.min < 170 || GAME.mode !== 'play') return;
  if (!_sv) _sv = new THREE.Vector3();
  var c = SCARE.cos || (SCARE.cos = { step: 0, seen: 0, unseen: 9, home: sp.position.clone(), counted: false, pend: false });
  var cam = RENDER.camera, fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  _sv.copy(sp.position).project(cam);
  var toS = sp.position.clone().sub(cam.position);
  var inView = !CAM.inFreezer && !CAM.outside && !MINI.active && !DOC.open && cam.position.z > -2.85 && fwd.dot(toS) > 0 && Math.abs(_sv.x) < 0.6 && Math.abs(_sv.y) < 0.75 && toS.length() < 26;
  if (inView) {
    c.seen += dt; c.unseen = 0;
    if (c.seen > 0.8 && !c.counted) {
      c.counted = true; c.step++; c.pend = true;
      if (c.step === 1) sfx('whisper', sp.position, { vol: 0.3 });
      if (c.step >= 5) { c.step = 99; costumeEnters(); }
    }
  } else {
    c.seen = 0; c.unseen += dt;
    if (c.unseen > 1.2) c.counted = false;
    if (c.pend && c.unseen > 0.4) { c.pend = false; placeCostume(c); sfx('steps', sp.position, { n: 2, vol: 0.5 }); }
    if (c.unseen > 45 && c.step > 0 && c.step < 99) { c.step--; c.unseen = 1.3; placeCostume(c); }
  }
}
function placeCostume(c) { var sp = WORLD.costume, door = new THREE.Vector3(6.0, 1.0, 6.3); sp.position.copy(c.home).lerp(door, Math.min(1, c.step / 4.5)); var s = 1 + Math.min(1, c.step / 4.5) * 0.08; sp.scale.set(1.2 * s, 2.0 * s, 1); }
function costumeEnters() {
  var door = new THREE.Vector3(6, 2.3, 4.9);
  sfx('doorbell', door); openDoorAnim(); jukeStop(0.05);
  setTimeout(function () { if (GAME.mode !== 'play') return; if (WORLD.costume) WORLD.costume.visible = false; anomalyFail(null, pickFace(['costume', 'plush'], 'costume'), { rule: 'costume' }); }, 900);
}
