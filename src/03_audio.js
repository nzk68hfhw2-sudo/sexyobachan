// ---- audio: BGM (media elements -> WebAudio), synthesized SFX, 3D panning ---
var AU = { ctx: null, master: null, bgmBus: null, sfxBus: null, comp: null, noise: null, pink: null, tracks: {}, cur: null, loops: {}, ready: false, unlocked: false, voices: [], listenerPos: null };

function initAudio() {
  if (AU.ctx) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try { AU.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { AU.ctx = new AC(); } catch (e2) { return; } }
  var c = AU.ctx;
  AU.comp = c.createDynamicsCompressor(); AU.comp.threshold.value = -10; AU.comp.knee.value = 8; AU.comp.ratio.value = 6; AU.comp.attack.value = 0.003; AU.comp.release.value = 0.2;
  AU.master = c.createGain(); AU.master.gain.value = 1;
  AU.bgmBus = c.createGain(); AU.sfxBus = c.createGain(); AU.scareBus = c.createGain();
  AU.bgmBus.connect(AU.master); AU.sfxBus.connect(AU.comp); AU.scareBus.connect(AU.master); AU.comp.connect(AU.master); AU.master.connect(c.destination);
  // reverb (procedural impulse) for hallway feel
  AU.verb = c.createConvolver(); AU.verb.buffer = makeImpulse(2.6, 2.2); AU.verbGain = c.createGain(); AU.verbGain.gain.value = 0.35;
  AU.verb.connect(AU.verbGain); AU.verbGain.connect(AU.comp);
  var len = c.sampleRate * 2, nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0);
  for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AU.noise = nb;
  var pb = c.createBuffer(1, len, c.sampleRate), pd = pb.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
  for (var j = 0; j < len; j++) { var w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526; pd[j] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
  AU.pink = pb;
  applyVolumes();
  ['happy', 'nursery'].forEach(function (n) { AU.tracks[n] = makeTrack(n); });
  AU.ready = true;
}
function makeImpulse(sec, decay) {
  var c = AU.ctx, len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 200 ? i / 200 : 1); }
  return b;
}
function makeTrack(name) {
  var a = new Audio();
  a.crossOrigin = 'anonymous'; a.loop = true; a.preload = 'auto';
  a.setAttribute('playsinline', ''); a.setAttribute('webkit-playsinline', '');
  try { a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; } catch (e) {}
  var t = { el: a, gain: AU.ctx.createGain(), routed: false, name: name, vol: 0, failed: false };
  t.gain.gain.value = 0; t.gain.connect(AU.bgmBus);
  var tried = false;
  a.addEventListener('error', function () {
    if (!tried) { tried = true; t.failed = true; var b = new Audio(); b.loop = true; b.preload = 'auto'; b.setAttribute('playsinline', ''); b.src = assetURL('audio/' + name + '.m4a'); t.el = b; t.routed = false; t.direct = true; console.warn('[HP] audio CORS fallback for', name); }
  });
  a.src = assetURL('audio/' + name + '.m4a');
  try { var src = AU.ctx.createMediaElementSource(a); src.connect(t.gain); t.routed = true; } catch (e) { t.routed = false; t.direct = true; }
  return t;
}
// must be called inside a user gesture (TAP TO START)
function unlockAudio() {
  initAudio();
  if (!AU.ctx) return;
  try { if (AU.ctx.state === 'suspended') AU.ctx.resume(); } catch (e) {}
  var o = AU.ctx.createOscillator(), g = AU.ctx.createGain(); g.gain.value = 0.0001; o.connect(g); g.connect(AU.ctx.destination); o.start(); o.stop(AU.ctx.currentTime + 0.05);
  for (var n in AU.tracks) { (function (t) { var el = t.el; var p = el.play(); if (p && p.then) p.then(function () { if (AU.cur !== t.name) el.pause(); }).catch(function () {}); })(AU.tracks[n]); }
  try { if (window.speechSynthesis) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); } } catch (e) {}
  AU.unlocked = true;
}
document.addEventListener('visibilitychange', function () {
  if (!AU.ctx) return;
  if (document.hidden) { try { AU.ctx.suspend(); } catch (e) {} for (var n in AU.tracks) AU.tracks[n].el.pause(); }
  else { try { AU.ctx.resume(); } catch (e) {} if (AU.cur && AU.tracks[AU.cur]) AU.tracks[AU.cur].el.play().catch(function () {}); }
});
function applyVolumes() {
  if (!AU.ctx) return;
  var s = SAVE.settings;
  AU.bgmBus.gain.value = s.bgm * 0.8;
  AU.sfxBus.gain.value = s.sfx;
  AU.scareBus.gain.value = s.sfx * (s.scare === 'MILD' ? 0.35 : 1);
  for (var n in AU.tracks) { var t = AU.tracks[n]; if (t.direct) t.el.volume = (AU.cur === n ? 1 : 0) * s.bgm * 0.8; }
}
// play BGM: name or null. cut=true -> instant stop (lights out)
function playBGM(name, opt) {
  opt = opt || {};
  if (!AU.ctx) return;
  var c = AU.ctx, t0 = c.currentTime;
  for (var n in AU.tracks) {
    var t = AU.tracks[n];
    if (n === name) continue;
    if (AU.cur === n || t.el && !t.el.paused) {
      t.gain.gain.cancelScheduledValues(t0);
      if (opt.cut) { t.gain.gain.setValueAtTime(0, t0); t.el.pause(); if (t.direct) t.el.volume = 0; }
      else { t.gain.gain.setValueAtTime(t.gain.gain.value, t0); t.gain.gain.linearRampToValueAtTime(0, t0 + (opt.fade || 1)); (function (el, tt) { setTimeout(function () { if (AU.cur !== tt.name) el.pause(); }, (opt.fade || 1) * 1000 + 50); })(t.el, t); if (t.direct) t.el.volume = 0; }
    }
  }
  AU.cur = name;
  if (!name) return;
  var tr = AU.tracks[name];
  if (!tr) return;
  tr.el.playbackRate = 1;
  if (opt.restart) { try { tr.el.currentTime = 0; } catch (e) {} }
  var p = tr.el.play(); if (p && p.catch) p.catch(function () {});
  tr.gain.gain.cancelScheduledValues(t0);
  tr.gain.gain.setValueAtTime(tr.gain.gain.value, t0);
  tr.gain.gain.linearRampToValueAtTime(1, t0 + (opt.fade != null ? opt.fade : 1.2));
  if (tr.direct) tr.el.volume = SAVE.settings.bgm * 0.8;
}
function setBGMRate(r) { var t = AU.tracks[AU.cur]; if (t) { try { t.el.playbackRate = r; } catch (e) {} } }

// ---- helpers ---------------------------------------------------------------
function AT() { return AU.ctx.currentTime; }
function outNode(pos, opt) {
  // returns a node to connect sources into. positional if pos provided.
  var c = AU.ctx; opt = opt || {};
  var g = c.createGain(); g.gain.value = opt.gain != null ? opt.gain : 1;
  if (pos) {
    var p = c.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = opt.ref || 1.5; p.maxDistance = 60; p.rolloffFactor = opt.roll || 1.1;
    var y = pos.y != null ? pos.y : LV_Y[pos.li || 1] + 1.2;
    // different floor -> muffle & attenuate
    var lp = null;
    if (PL && pos.li != null && pos.li !== PL.li) { lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; g.gain.value *= 0.45; }
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, y, pos.z);
    if (lp) { g.connect(lp); lp.connect(p); } else g.connect(p);
    p.connect(opt.bus || AU.sfxBus);
    if (opt.verb !== false) { var sv = c.createGain(); sv.gain.value = opt.verbAmt != null ? opt.verbAmt : 0.5; p.connect(sv); sv.connect(AU.verb); }
    g._panner = p;
  } else {
    g.connect(opt.bus || AU.sfxBus);
    if (opt.verb) { var sv2 = c.createGain(); sv2.gain.value = opt.verbAmt || 0.3; g.connect(sv2); sv2.connect(AU.verb); }
  }
  return g;
}
function env(g, t, a, peak, d, sustain, r, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain || 0.0001), t + a + d);
  if (dur) { g.gain.setValueAtTime(Math.max(0.0001, sustain || 0.0001), t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (r || 0.1)); }
}
function osc(type, f, t, dur, dest, gain, opt) {
  var c = AU.ctx; opt = opt || {};
  var o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (opt.f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f2), t + (opt.glide || dur));
  if (opt.detune) o.detune.value = opt.detune;
  var g = c.createGain(); o.connect(g);
  var last = g;
  if (opt.filter) { var f1 = c.createBiquadFilter(); f1.type = opt.filter; f1.frequency.value = opt.ff || 1000; f1.Q.value = opt.q || 1; g.connect(f1); last = f1; }
  last.connect(dest);
  env(g, t, opt.a || 0.005, gain, opt.d || dur, opt.s || 0.0001, opt.r, opt.hold);
  o.start(t); o.stop(t + dur + (opt.r || 0.1) + (opt.hold || 0) + 0.05);
  return { o: o, g: g };
}
function noise(t, dur, dest, gain, opt) {
  var c = AU.ctx; opt = opt || {};
  var s = c.createBufferSource(); s.buffer = opt.pink ? AU.pink : AU.noise; s.loop = true;
  s.playbackRate.value = opt.rate || 1;
  var f = c.createBiquadFilter(); f.type = opt.type || 'bandpass'; f.frequency.setValueAtTime(opt.f || 1000, t); f.Q.value = opt.q || 1;
  if (opt.f2) f.frequency.exponentialRampToValueAtTime(opt.f2, t + dur);
  var g = c.createGain(); s.connect(f); f.connect(g); g.connect(dest);
  env(g, t, opt.a || 0.002, gain, opt.d || dur, opt.s || 0.0001, opt.r, opt.hold);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + (opt.r || 0.1) + (opt.hold || 0) + 0.05);
  return { s: s, f: f, g: g };
}
function distCurve(k) { var n = 1024, cv = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; cv[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return cv; }

// ---- SFX library --------------------------------------------------------------
var STEP_TONE = {}; STEP_TONE[M_LINO] = [1800, 0.9]; STEP_TONE[M_LINO2] = [1800, 0.9]; STEP_TONE[M_GYM] = [600, 1.1]; STEP_TONE[M_TILE] = [2600, 1.0]; STEP_TONE[M_TERRAZZO] = [2200, 1.0];
STEP_TONE[M_CARPET] = [400, 0.4]; STEP_TONE[M_CONCRETE] = [1200, 1.0]; STEP_TONE[M_ASPHALT] = [900, 0.8]; STEP_TONE[M_GRASS] = [500, 0.5]; STEP_TONE[M_BUS] = [700, 1.1];
function sfxStep(mat, loud, pos, opt) {
  if (!AU.ready) return;
  opt = opt || {};
  var t = AT() + 0.005, st = STEP_TONE[mat] || [1500, 1];
  var out = outNode(pos, { gain: 1, verbAmt: 0.6 });
  var v = (0.12 + loud * 0.35) * st[1] * (opt.gain || 1);
  noise(t, 0.05, out, v, { type: 'bandpass', f: st[0] * (0.85 + Math.random() * 0.3), q: 1.2, d: 0.06 });
  noise(t, 0.09, out, v * 0.7, { type: 'lowpass', f: 300 + loud * 200, q: 0.7, d: 0.1 });
  if (mat === M_LINO || mat === M_LINO2 || mat === M_GYM) if (Math.random() < 0.25 && loud > 0.3) osc('sine', 2400 + Math.random() * 800, t + 0.02, 0.06, out, v * 0.25, { f2: 1800 }); // sneaker squeak
  if (mat === M_GRASS) noise(t, 0.12, out, v * 0.5, { type: 'highpass', f: 3000, d: 0.12 });
}
function sfx(name, pos, o) {
  if (!AU.ready || !AU.ctx) return;
  o = o || {};
  var c = AU.ctx, t = AT() + 0.01, out;
  switch (name) {
    case 'click': out = outNode(null); noise(t, 0.02, out, 0.3, { type: 'highpass', f: 3000, d: 0.02 }); osc('square', 1800, t, 0.015, out, 0.05); break;
    case 'ui': out = outNode(null); osc('triangle', 880, t, 0.06, out, 0.12, { f2: 1320 }); break;
    case 'uiBack': out = outNode(null); osc('triangle', 660, t, 0.07, out, 0.1, { f2: 440 }); break;
    case 'door': out = outNode(pos, { verbAmt: 0.7 });
      osc('sawtooth', 180 + Math.random() * 60, t, 0.7, out, 0.05, { f2: 320, filter: 'bandpass', ff: 900, q: 8, a: 0.05, d: 0.7 });
      noise(t + 0.6, 0.12, out, 0.35, { type: 'lowpass', f: 400, d: 0.15 }); break;
    case 'doorBang': out = outNode(pos, { verbAmt: 0.9 }); noise(t, 0.25, out, 0.7, { type: 'lowpass', f: 500, d: 0.3 }); osc('sine', 80, t, 0.25, out, 0.5, { f2: 50 }); noise(t, 0.05, out, 0.3, { type: 'bandpass', f: 2500, d: 0.06 }); break;
    case 'rattle': out = outNode(pos); for (var r = 0; r < 4; r++) noise(t + r * 0.07, 0.04, out, 0.4, { type: 'bandpass', f: 1600 + r * 200, q: 6, d: 0.05 }); break;
    case 'lockerOpen': out = outNode(pos, { verbAmt: 0.8 }); metal(t, out, 0.4, 420); noise(t, 0.3, out, 0.08, { type: 'bandpass', f: 3000, q: 4, d: 0.3 }); break;
    case 'lockerClose': out = outNode(pos, { verbAmt: 0.9 }); metal(t, out, 0.7, 300); noise(t, 0.08, out, 0.5, { type: 'lowpass', f: 900, d: 0.1 }); break;
    case 'cough': out = outNode(null, { verb: true }); for (var k = 0; k < 3; k++) { noise(t + k * 0.28, 0.2, out, 0.5, { type: 'bandpass', f: 500 + k * 80, q: 2, d: 0.22 }); osc('sawtooth', 140 - k * 10, t + k * 0.28, 0.15, out, 0.08, { filter: 'lowpass', ff: 800 }); } break;
    case 'gasp': out = outNode(null); noise(t, 0.5, out, 0.25, { type: 'bandpass', f: 1200, f2: 2200, q: 1.5, a: 0.05, d: 0.5 }); break;
    case 'exhale': out = outNode(null); noise(t, 0.9, out, 0.18, { type: 'bandpass', f: 900, f2: 500, q: 1, a: 0.1, d: 0.9 }); break;
    case 'bell': bell(t, pos, false, o.len || 3.2); break;
    case 'bellBad': bell(t, pos, true, o.len || 3.6); break;
    case 'lightsOut': out = outNode(null, { verb: true, verbAmt: 0.8 });
      noise(t, 0.04, out, 1.0, { type: 'lowpass', f: 3000, d: 0.05 }); osc('sine', 60, t, 0.5, out, 0.8, { f2: 30 }); osc('square', 120, t, 0.08, out, 0.15, { filter: 'lowpass', ff: 600 });
      noise(t + 0.05, 1.5, out, 0.06, { type: 'lowpass', f: 200, d: 1.5 }); break;
    case 'lightsOn': out = outNode(null, { verb: true });
      for (var q = 0; q < 5; q++) { noise(t + q * 0.09 + Math.random() * 0.05, 0.02, out, 0.25, { type: 'highpass', f: 2500, d: 0.02 }); osc('square', 120, t + q * 0.09, 0.03, out, 0.03); } break;
    case 'flicker': out = outNode(pos); noise(t, 0.04, out, 0.15, { type: 'highpass', f: 3000, d: 0.04 }); osc('sawtooth', 120, t, 0.08, out, 0.04, { filter: 'lowpass', ff: 900 }); break;
    case 'chime': out = outNode(null, { verb: true, verbAmt: 0.6 }); [784, 659, 523].forEach(function (f, i) { osc('sine', f, t + i * 0.45, 1.4, out, 0.18); osc('sine', f * 2.01, t + i * 0.45, 0.6, out, 0.04); }); break;
    case 'chimeBad': out = outNode(null, { verb: true, verbAmt: 0.9 }); [392, 330, 247].forEach(function (f, i) { osc('sine', f * (0.98 + Math.random() * 0.04), t + i * 0.55, 1.8, out, 0.2, { f2: f * 0.94 }); }); break;
    case 'paStatic': out = outNode(null, { verb: true }); noise(t, o.len || 1.2, out, 0.12, { type: 'bandpass', f: 1800, q: 0.8, a: 0.05, d: o.len || 1.2, s: 0.06 }); osc('sine', 60, t, o.len || 1.2, out, 0.03); break;
    case 'feedback': out = outNode(null, { verb: true }); osc('sine', 2900, t, 1.2, out, 0.06, { a: 0.6, d: 1.2, f2: 3100 }); break;
    case 'pickup': out = outNode(null); osc('triangle', 660, t, 0.08, out, 0.15); osc('triangle', 990, t + 0.07, 0.12, out, 0.15); break;
    case 'paper': out = outNode(null); noise(t, 0.25, out, 0.2, { type: 'highpass', f: 2500, d: 0.25 }); break;
    case 'sparkle': out = outNode(pos); for (var s2 = 0; s2 < 6; s2++) osc('sine', 1800 + s2 * 300, t + s2 * 0.05, 0.3, out, 0.08); break;
    case 'horn': out = outNode(pos, { ref: 4, roll: 0.6, verbAmt: 0.9 }); [370, 466, 554].forEach(function (f) { osc('sawtooth', f, t, o.len || 6, out, 0.09, { a: 0.02, d: 0.05, s: 0.09, hold: o.len || 6, r: 0.2, filter: 'lowpass', ff: 2500 }); }); break;
    case 'chalk': out = outNode(pos, { verbAmt: 0.8 }); noise(t, 0.03, out, 0.6, { type: 'bandpass', f: 2800, q: 3, d: 0.04 }); noise(t + 0.12, 0.02, out, 0.3, { type: 'bandpass', f: 2600, q: 3, d: 0.03 }); noise(t + 0.2, 0.02, out, 0.15, { type: 'bandpass', f: 2600, q: 3, d: 0.03 }); break;
    case 'throw': out = outNode(null); noise(t, 0.2, out, 0.15, { type: 'bandpass', f: 600, f2: 1500, d: 0.2 }); break;
    case 'heart': out = outNode(null, { bus: AU.scareBus }); var hv = o.v || 0.5; osc('sine', 55, t, 0.12, out, hv, { f2: 40 }); osc('sine', 50, t + 0.17, 0.14, out, hv * 0.75, { f2: 36 }); break;
    case 'scream': out = outNode(pos, { ref: 3, roll: 0.7, verbAmt: 1.0 }); scream(t, out, o.len || 1.4, o.pitch || 1); break;
    case 'drag': out = outNode(pos, { ref: 3, verbAmt: 1 }); noise(t, o.len || 2.5, out, 0.25, { type: 'lowpass', f: 300, q: 2, a: 0.2, d: o.len || 2.5, s: 0.2 }); for (var dr = 0; dr < 6; dr++) noise(t + dr * 0.4, 0.15, out, 0.25, { type: 'bandpass', f: 900, q: 2, d: 0.15 }); break;
    case 'thump': out = outNode(pos, { verbAmt: 1 }); osc('sine', 70, t, 0.4, out, 0.6, { f2: 35 }); noise(t, 0.2, out, 0.3, { type: 'lowpass', f: 300, d: 0.2 }); break;
    case 'creak': out = outNode(pos, { verbAmt: 1 }); osc('sawtooth', 90 + Math.random() * 60, t, 1.2, out, 0.04, { f2: 60 + Math.random() * 90, filter: 'bandpass', ff: 700, q: 12, a: 0.3, d: 1.2 }); break;
    case 'drip': out = outNode(pos, { verbAmt: 1 }); osc('sine', 1400 + Math.random() * 600, t, 0.08, out, 0.1, { f2: 700 }); break;
    case 'whisper': out = outNode(pos, { verbAmt: 1 }); for (var w = 0; w < 8; w++) noise(t + w * 0.12 + Math.random() * 0.05, 0.1, out, 0.08, { type: 'bandpass', f: 2500 + Math.random() * 2500, q: 5, d: 0.1 }); break;
    case 'giggle': out = outNode(pos, { verbAmt: 1 }); for (var gk = 0; gk < 5; gk++) { osc('triangle', 520 - gk * 20, t + gk * 0.14, 0.1, out, 0.1, { f2: 460, filter: 'bandpass', ff: 1200, q: 3 }); noise(t + gk * 0.14, 0.08, out, 0.05, { type: 'bandpass', f: 2000, q: 3, d: 0.08 }); } break;
    case 'breathM': out = outNode(pos, { verbAmt: 0.6 }); noise(t, 1.2, out, (o.v || 0.3), { type: 'bandpass', f: 500, q: 2.5, a: 0.4, d: 1.2, pink: true }); noise(t + 1.3, 1.0, out, (o.v || 0.3) * 0.7, { type: 'bandpass', f: 380, q: 2.5, a: 0.2, d: 1.0, pink: true }); break;
    case 'clicks': out = outNode(pos, { verbAmt: 0.8 }); for (var ck = 0; ck < (o.n || 10); ck++) noise(t + ck * (0.04 + Math.random() * 0.05), 0.012, out, 0.35, { type: 'bandpass', f: 3500 + Math.random() * 2000, q: 4, d: 0.015 }); break;
    case 'growl': out = outNode(pos, { verbAmt: 0.7 }); var gg = osc('sawtooth', 70 * (o.pitch || 1), t, o.len || 1.2, out, 0.22, { f2: 55 * (o.pitch || 1), filter: 'lowpass', ff: 500, a: 0.1, d: o.len || 1.2 }); noise(t, o.len || 1.2, out, 0.12, { type: 'bandpass', f: 300, q: 3, a: 0.1, d: o.len || 1.2 }); break;
    case 'squeak': out = outNode(pos, { verbAmt: 0.8 }); osc('sine', 1500 + Math.random() * 400, t, 0.25, out, 0.06, { f2: 1200, a: 0.03 }); osc('sine', 1600, t + 0.4, 0.2, out, 0.05, { f2: 1900 }); break;
    case 'staticBurst': out = outNode(pos, { verbAmt: 0.5 }); noise(t, o.len || 0.8, out, 0.35, { type: 'highpass', f: 1500, a: 0.01, d: o.len || 0.8, s: 0.2 }); osc('square', 15700, t, o.len || 0.8, out, 0.02); break;
    case 'hoot': out = outNode(pos, { verbAmt: 0.6 }); var hp = o.pitch || 1; osc('sine', 420 * hp, t, 0.35, out, 0.25, { f2: 380 * hp, a: 0.04 }); osc('sine', 420 * hp, t + 0.45, 0.6, out, 0.25, { f2: 330 * hp, a: 0.04 }); break;
    case 'hootBad': out = outNode(pos, { verbAmt: 1 }); var wsh = c.createWaveShaper(); wsh.curve = distCurve(30); wsh.connect(out); osc('sawtooth', 210, t, 1.6, wsh, 0.2, { f2: 90, a: 0.05, d: 1.6 }); osc('sine', 205, t, 1.6, wsh, 0.2, { f2: 70 }); break;
    case 'tape': out = outNode(null); noise(t, 0.08, out, 0.4, { type: 'lowpass', f: 1500, d: 0.08 }); osc('sine', 90, t + 0.1, 0.6, out, 0.08, { a: 0.1, d: 0.6 }); noise(t + 0.15, 0.6, out, 0.05, { type: 'bandpass', f: 4000, q: 1, d: 0.6 }); break;
    case 'rewind': out = outNode(null); osc('sawtooth', 300, t, 1.5, out, 0.05, { f2: 1800, filter: 'bandpass', ff: 1500, q: 2 }); noise(t, 1.5, out, 0.05, { type: 'highpass', f: 3000, d: 1.5 }); break;
    case 'jumpscare': jumpscareSound(t, o); break;
    case 'stinger': out = outNode(null, { bus: AU.scareBus, verb: true, verbAmt: 1 }); [110, 116.5, 155.6, 233].forEach(function (f) { osc('sawtooth', f, t, 2.4, out, 0.07, { a: 0.01, d: 2.4, filter: 'lowpass', ff: 1800 }); }); noise(t, 0.4, out, 0.3, { type: 'highpass', f: 2000, d: 0.4 }); break;
    case 'win': out = outNode(null, { verb: true }); [523, 659, 784, 1046].forEach(function (f, i) { osc('triangle', f, t + i * 0.12, 0.5, out, 0.14); }); break;
    case 'wrong': out = outNode(null); osc('square', 180, t, 0.25, out, 0.08, { f2: 120, filter: 'lowpass', ff: 900 }); break;
    case 'right': out = outNode(null); osc('triangle', 880, t, 0.1, out, 0.13); osc('triangle', 1320, t + 0.08, 0.15, out, 0.13); break;
    case 'note': out = outNode(null, { verb: true, verbAmt: 0.3 }); osc('triangle', o.f || 440, t, 0.4, out, 0.18); osc('sine', (o.f || 440) * 2, t, 0.2, out, 0.05); break;
    case 'tick': out = outNode(null); osc('square', 2000, t, 0.01, out, 0.05); break;
    case 'bubble': out = outNode(null); osc('sine', 300 + Math.random() * 500, t, 0.12, out, 0.12, { f2: 900 }); break;
    case 'bandaid': out = outNode(null); noise(t, 0.3, out, 0.15, { type: 'highpass', f: 4000, d: 0.3 }); osc('sine', 600, t, 0.4, out, 0.1, { f2: 900 }); break;
    case 'stab': out = outNode(null, { bus: AU.scareBus }); noise(t, 0.3, out, 0.8, { type: 'lowpass', f: 2000, d: 0.3 }); osc('sine', 60, t, 0.4, out, 0.9, { f2: 30 }); break;
    case 'engine': out = outNode(pos, { ref: 4 }); osc('sawtooth', 45, t, o.len || 3, out, 0.12, { a: 0.4, d: o.len || 3, s: 0.1, filter: 'lowpass', ff: 300 }); noise(t, o.len || 3, out, 0.08, { type: 'lowpass', f: 200, a: 0.4, d: o.len || 3, s: 0.06 }); break;
  }
}
function metal(t, out, v, base) { [1, 2.76, 5.4, 8.93].forEach(function (m, i) { osc('sine', base * m * (0.98 + Math.random() * 0.04), t, 0.5 - i * 0.08, out, v * 0.18 / (i + 1), { d: 0.5 - i * 0.08 }); }); }
function bell(t, pos, bad, len) {
  var out = outNode(pos || null, { verb: true, verbAmt: 0.8, ref: 6, roll: 0.4 });
  var c = AU.ctx;
  var ws = c.createWaveShaper(); ws.curve = distCurve(bad ? 25 : 4); ws.connect(out);
  var am = c.createGain(); am.gain.value = 0; am.connect(ws);
  var lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = bad ? 19 : 28;
  var lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
  var base = bad ? 980 : 1250;
  [1, 2.3, 3.4, 4.9].forEach(function (m, i) { var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = base * m; if (bad) o.frequency.linearRampToValueAtTime(base * m * 0.82, t + len); var g = c.createGain(); g.gain.value = 0.12 / (i + 1); o.connect(g); g.connect(am); o.start(t); o.stop(t + len + 0.2); });
  var mg = c.createGain(); am.disconnect(); am.connect(mg); mg.connect(ws);
  mg.gain.setValueAtTime(0.0001, t); mg.gain.linearRampToValueAtTime(1, t + 0.02); mg.gain.setValueAtTime(1, t + len); mg.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.25);
  lfo.start(t); lfo.stop(t + len + 0.3);
  noise(t, len, out, 0.05, { type: 'bandpass', f: 4000, q: 2, a: 0.01, d: len, s: 0.05 });
}
function scream(t, out, len, pitch) {
  var c = AU.ctx;
  var f0 = 520 * pitch;
  var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * 0.7, t); o.frequency.linearRampToValueAtTime(f0 * 1.25, t + 0.15); o.frequency.linearRampToValueAtTime(f0, t + len);
  var vib = c.createOscillator(); vib.frequency.value = 7; var vg = c.createGain(); vg.gain.value = f0 * 0.04; vib.connect(vg); vg.connect(o.frequency);
  var g = c.createGain();
  [800, 1300, 2800].forEach(function (ff, i) { var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff * pitch; bp.Q.value = 5; o.connect(bp); var bg = c.createGain(); bg.gain.value = [1, 0.7, 0.4][i]; bp.connect(bg); bg.connect(g); });
  g.connect(out); env(g, t, 0.03, 0.8, len, 0.3, 0.3, len);
  o.start(t); vib.start(t); o.stop(t + len + 0.5); vib.stop(t + len + 0.5);
  noise(t, len, out, 0.25, { type: 'bandpass', f: 1800 * pitch, q: 1, a: 0.02, d: len, s: 0.15 });
}
function jumpscareSound(t, o) {
  var c = AU.ctx, mild = SAVE.settings.scare === 'MILD';
  var out = c.createGain(); out.gain.value = mild ? 0.35 : 1; out.connect(AU.scareBus);
  var ws = c.createWaveShaper(); ws.curve = distCurve(mild ? 8 : 40); ws.connect(out);
  var sv = c.createGain(); sv.gain.value = 0.6; ws.connect(sv); sv.connect(AU.verb);
  var p = o.pitch || 1;
  scream(t, ws, 1.6, 1.15 * p); scream(t + 0.03, ws, 1.4, 0.72 * p);
  noise(t, 1.6, ws, 0.9, { type: 'bandpass', f: 2200, q: 0.6, a: 0.005, d: 1.6, s: 0.3 });
  osc('sine', 48, t, 1.2, out, 1.0, { f2: 28, d: 1.2 });
  osc('square', 3100 * p, t, 0.9, ws, 0.2, { f2: 1200 });
  for (var k = 0; k < 10; k++) noise(t + k * 0.06, 0.04, ws, 0.6, { type: 'highpass', f: 3000, d: 0.04 });
}
// ---- continuous loops (hum, wind, heartbeat) ----------------------------
function loopNoise(name, opt) {
  if (!AU.ready) return null;
  if (AU.loops[name]) return AU.loops[name];
  var c = AU.ctx, s = c.createBufferSource(); s.buffer = opt.pink ? AU.pink : AU.noise; s.loop = true;
  var f = c.createBiquadFilter(); f.type = opt.type || 'lowpass'; f.frequency.value = opt.f || 400; f.Q.value = opt.q || 0.7;
  var g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(opt.bus || AU.sfxBus); s.start();
  var L = { s: s, f: f, g: g, target: 0 };
  if (opt.hum) { var o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 120; var of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 600; var og = c.createGain(); og.gain.value = opt.hum; o.connect(of); of.connect(og); og.connect(g); o.start(); L.o = o; }
  AU.loops[name] = L; return L;
}
function setLoop(name, v, k) { var L = AU.loops[name]; if (!L) return; L.g.gain.setTargetAtTime(v, AT(), k || 0.3); }
function initLoops() {
  loopNoise('hum', { type: 'bandpass', f: 4000, q: 0.5, hum: 0.25 });
  loopNoise('wind', { type: 'bandpass', f: 350, q: 0.6, pink: true });
  loopNoise('room', { type: 'lowpass', f: 180, pink: true });
  loopNoise('tapehiss', { type: 'highpass', f: 3500 });
}
var HEART = { t: 0 };
function updateAudio(dt, cam) {
  if (!AU.ready) return;
  var L = AU.ctx.listener, p = cam.position;
  var fw = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  if (L.positionX) { L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z; L.forwardX.value = fw.x; L.forwardY.value = fw.y; L.forwardZ.value = fw.z; L.upX.value = up.x; L.upY.value = up.y; L.upZ.value = up.z; }
  else { L.setPosition(p.x, p.y, p.z); L.setOrientation(fw.x, fw.y, fw.z, up.x, up.y, up.z); }
  // heartbeat by fear
  if (PL && GAME.mode === 'play') {
    var fear = PL.fear;
    if (fear > 0.15) { HEART.t -= dt; if (HEART.t <= 0) { HEART.t = lerp(1.1, 0.38, fear); sfx('heart', null, { v: 0.15 + fear * 0.75 }); } }
  }
}

// ---- voice (TTS) ------------------------------------------------------------
var VOICE = { en: null };
function pickVoice() {
  try {
    var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    var best = null;
    for (var i = 0; i < vs.length; i++) { var v = vs[i]; if (/^en(-|_)US/i.test(v.lang)) { if (!best || /Samantha|Karen|Moira|Google US|Aaron|Fred/i.test(v.name)) best = v; } }
    if (!best) for (var j = 0; j < vs.length; j++) if (/^en/i.test(vs[j].lang)) { best = vs[j]; break; }
    VOICE.en = best;
  } catch (e) {}
}
try { if (window.speechSynthesis) { speechSynthesis.onvoiceschanged = pickVoice; pickVoice(); } } catch (e) {}
// style: 'cute' (high, fast), 'creepy' (very low, slow), 'pa' (normal), 'npc' with pitch
function say(text, style, opt) {
  opt = opt || {};
  try {
    if (!window.speechSynthesis || SAVE.settings.sfx <= 0.01) return;
    if (opt.interrupt !== false) speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    if (!VOICE.en) pickVoice();
    if (VOICE.en) u.voice = VOICE.en;
    u.lang = 'en-US';
    var s = style || 'pa';
    u.pitch = s === 'cute' ? 1.9 : s === 'creepy' ? 0.1 : s === 'npc' ? (opt.pitch || 1) : 1.0;
    u.rate = s === 'cute' ? 1.12 : s === 'creepy' ? 0.62 : (opt.rate || 1.0);
    u.volume = clamp(SAVE.settings.sfx * (opt.vol || 0.9), 0, 1);
    speechSynthesis.speak(u);
    if (s === 'cute' && opt.hoot !== false) sfx('hoot', null, { pitch: 1.2 });
    if (s === 'creepy') sfx('hootBad');
  } catch (e) {}
}
function stopVoice() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
