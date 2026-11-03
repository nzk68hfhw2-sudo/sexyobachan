// ---- audio: mix bus, procedural reverbs, positional jukebox, layered SFX --------------
var AUDIO = { ctx: null, ok: false, buf: {}, noise: {}, music: null, juke: null, space: 'diner', loops: {}, duck: 1 };
var SONGS = { title: 'audio/sunny_side_diner.m4a', boogie: 'audio/diner_boogie.m4a', warped: 'audio/warped_diner.m4a', jingle: 'audio/jingle_in_reverse.m4a' };
function audioUnlock() {
  if (AUDIO.ctx) { if (AUDIO.ctx.state !== 'running') try { AUDIO.ctx.resume(); } catch (e) {} return; }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iOS: play even with the silent switch on
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { AUDIO.ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { AUDIO.ctx = new AC(); } catch (e2) { return; } }
  var c = AUDIO.ctx;
  try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
  try { c.resume(); } catch (e) {}
  buildMix(); AUDIO.ok = true;
  loadSongs();
  document.addEventListener('visibilitychange', function () { if (!AUDIO.ctx) return; if (document.hidden) AUDIO.ctx.suspend && AUDIO.ctx.suspend(); else AUDIO.ctx.resume && AUDIO.ctx.resume(); });
}
function buildMix() {
  var c = AUDIO.ctx;
  var comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 3.2; comp.attack.value = 0.006; comp.release.value = 0.22;
  var lim = c.createDynamicsCompressor(); lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
  var master = c.createGain(); master.gain.value = 0.9;
  master.connect(comp); comp.connect(lim); lim.connect(c.destination);
  AUDIO.master = master;
  AUDIO.music = c.createGain(); AUDIO.musicDuck = c.createGain(); AUDIO.music.connect(AUDIO.musicDuck); AUDIO.musicDuck.connect(master);
  AUDIO.sfx = c.createGain(); AUDIO.sfx.connect(master);
  AUDIO.voice = c.createGain(); AUDIO.voice.connect(master);
  AUDIO.amb = c.createGain(); AUDIO.amb.connect(AUDIO.sfx);
  // noise buffers
  ['white', 'pink', 'brown'].forEach(function (k) {
    var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), l = 0, b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; if (k === 'white') d[i] = w; else if (k === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.1848) * 1.6; } else { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } }
    AUDIO.noise[k] = b;
  });
  // reverbs (procedural impulse responses)
  AUDIO.rev = {};
  var spaces = { diner: [1.5, 2600, 0.32], kitchen: [1.05, 6200, 0.38], freezer: [0.35, 1600, 0.26], hall: [2.1, 3000, 0.4], outside: [0.7, 4200, 0.16], tv: [0.25, 3000, 0.1] };
  for (var k in spaces) {
    var sp = spaces[k], conv = c.createConvolver(); conv.buffer = makeIR(sp[0], sp[1], k === 'outside');
    var g = c.createGain(); g.gain.value = k === 'diner' ? sp[2] : 0; conv.connect(g); g.connect(master);
    AUDIO.rev[k] = { conv: conv, out: g, wet: sp[2] };
  }
  AUDIO.revSend = c.createGain(); AUDIO.revSend.gain.value = 1;
  for (var k2 in AUDIO.rev) AUDIO.revSend.connect(AUDIO.rev[k2].conv);
  AUDIO.sfx.connect(AUDIO.revSend);
  // space-specific damping for everything (freezer muffles)
  applyVolumes();
  startAmbience();
}
function makeIR(sec, lp, sparse) {
  var c = AUDIO.ctx, n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) {
    var d = b.getChannelData(ch), last = 0, a = Math.exp(-2 * PI * lp / c.sampleRate);
    for (var i = 0; i < n; i++) {
      var t = i / n, env = Math.pow(1 - t, 2.6) * (i < c.sampleRate * 0.004 ? i / (c.sampleRate * 0.004) : 1);
      var w = (Math.random() * 2 - 1) * (sparse ? (Math.random() < 0.08 ? 1 : 0.15) : 1);
      last = w * (1 - a) + last * a; d[i] = last * env;
      if (i < c.sampleRate * 0.06 && Math.random() < 0.002) d[i] += (Math.random() - 0.5) * 0.8 * (1 - t); // early reflections
    }
  }
  return b;
}
function applyVolumes() {
  if (!AUDIO.ok && !AUDIO.music) return;
  var s = SAVE.settings, c = AUDIO.ctx, t = c.currentTime;
  AUDIO.music.gain.setTargetAtTime(s.bgm * 0.9, t, 0.05);
  AUDIO.sfx.gain.setTargetAtTime(s.sfx, t, 0.05);
  AUDIO.voice.gain.setTargetAtTime(s.voice, t, 0.05);
}
function setSpace(k) {
  if (!AUDIO.ok || AUDIO.space === k) return; AUDIO.space = k; var t = AUDIO.ctx.currentTime;
  for (var r in AUDIO.rev) AUDIO.rev[r].out.gain.setTargetAtTime(r === k ? AUDIO.rev[r].wet : 0, t, 0.25);
  if (AUDIO.juke) AUDIO.juke.space = k;
}
function duckMusic(on) { if (!AUDIO.ok) return; AUDIO.musicDuck.gain.setTargetAtTime(on ? 0.42 : 1, AUDIO.ctx.currentTime, on ? 0.12 : 0.6); }
// ---- loading songs (XHR -> decodeAudioData; failure falls back to synthesized loops) -----
function loadSongs() {
  for (var k in SONGS) (function (k) {
    var x = new XMLHttpRequest(); x.open('GET', assetURL(SONGS[k]), true); x.responseType = 'arraybuffer';
    x.onload = function () {
      if (x.status >= 400) return fallbackSong(k, 'HTTP ' + x.status);
      try {
        var p = AUDIO.ctx.decodeAudioData(x.response, function (b) { AUDIO.buf[k] = b; if (k === 'boogie') AUDIO.buf.reverse = reverseBuf(b); onSongReady(k); }, function () { fallbackSong(k, 'decode'); });
        if (p && p.catch) p.catch(function () {});
      } catch (e) { fallbackSong(k, 'decode'); }
    };
    x.onerror = function () { fallbackSong(k, 'network'); };
    x.send();
  })(k);
}
function reverseBuf(b) {
  var c = AUDIO.ctx, r = c.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
  for (var ch = 0; ch < b.numberOfChannels; ch++) { var s = b.getChannelData(ch), d = r.getChannelData(ch), n = s.length; for (var i = 0; i < n; i++) d[i] = s[n - 1 - i]; }
  return r;
}
function fallbackSong(k, why) {
  BOOT_ERRORS.push('song ' + k + ' ' + why);
  // simple synthesized stand-in so the game never goes silent
  var c = AUDIO.ctx, sr = c.sampleRate, sec = k === 'jingle' ? 6 : 16, b = c.createBuffer(2, sr * sec, sr);
  var bpm = k === 'warped' ? 84 : 132, beat = 60 / bpm, roots = [0, 0, 5, 5, 0, 7, 5, 0];
  for (var ch = 0; ch < 2; ch++) {
    var d = b.getChannelData(ch);
    for (var i = 0; i < d.length; i++) {
      var t = i / sr, bar = Math.floor(t / (beat * 4)) % 8, bt = (t % beat) / beat, step = Math.floor(t / (beat / 2)) % 8;
      var f = 110 * Math.pow(2, (roots[bar] + [0, 4, 7, 9, 10, 9, 7, 4][step]) / 12) * (k === 'warped' ? 0.94 : 1);
      var v = Math.sin(TAU * f * t) * 0.18 * Math.exp(-bt * 3) + Math.sin(TAU * f * 2 * t) * 0.05 * Math.exp(-bt * 5);
      v += (Math.random() * 2 - 1) * 0.05 * Math.exp(-((t % beat) / beat) * 30) * ((Math.floor(t / beat) % 2) ? 1 : 0.4);
      d[i] = v;
    }
  }
  AUDIO.buf[k] = b; if (k === 'boogie') AUDIO.buf.reverse = reverseBuf(b); onSongReady(k);
}
var SONG_WAIT = {};
function onSongReady(k) { var f = SONG_WAIT[k]; SONG_WAIT[k] = null; if (f) f(); }
function whenSong(k, fn) { if (AUDIO.buf[k]) fn(); else SONG_WAIT[k] = fn; }
// ---- non-positional music (title / clear / CM) -------------------------------------
var MUSIC = { src: null, gain: null, key: null };
function playMusic(k, opt) {
  opt = opt || {};
  if (!AUDIO.ok) { MUSIC.pending = [k, opt]; return; }
  if (MUSIC.key === k && MUSIC.src && !opt.restart) return;
  stopMusic(0.6);
  MUSIC.key = k;
  whenSong(k, function () {
    if (MUSIC.key !== k) return;
    var c = AUDIO.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = AUDIO.buf[k]; s.loop = opt.loop !== false;
    g.gain.value = 0.0001; g.gain.setTargetAtTime(opt.vol || 0.85, c.currentTime, 0.25);
    var out = g;
    if (opt.tv) { var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180; var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4800; var pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1800; pk.gain.value = 5; g.connect(hp); hp.connect(pk); pk.connect(lp); out = lp; }
    s.connect(g); out.connect(AUDIO.music);
    s.start(0, opt.offset || 0); MUSIC.src = s; MUSIC.gain = g; MUSIC.t0 = c.currentTime - (opt.offset || 0); MUSIC.dur = AUDIO.buf[k].duration;
    if (opt.onEnd) s.onended = function () { if (MUSIC.src === s) opt.onEnd(); };
  });
}
function musicTime() { return MUSIC.src && AUDIO.ok ? AUDIO.ctx.currentTime - MUSIC.t0 : -1; }
function stopMusic(fade) {
  MUSIC.key = null; if (!MUSIC.src) return;
  var s = MUSIC.src, g = MUSIC.gain, c = AUDIO.ctx; MUSIC.src = null;
  try { g.gain.setTargetAtTime(0.0001, c.currentTime, (fade || 0.4) / 3); s.stop(c.currentTime + (fade || 0.4) + 0.1); } catch (e) {}
}
// ---- the jukebox: positional, radio-ish, tape wobble, needle skips ---------------------
var JUKE = { src: null, key: null, rate: 1, wobble: 0, drift: 0 };
function jukePlay(k, opt) {
  opt = opt || {};
  if (!AUDIO.ok) { JUKE.pending = k; return; }
  jukeStop(opt.fade == null ? 0.3 : opt.fade);
  JUKE.key = k; JUKE.label = opt.label || JUKE.label;
  whenSong(k === 'reverse' ? 'boogie' : k, function () {
    if (JUKE.key !== k) return;
    var c = AUDIO.ctx, s = c.createBufferSource(); s.buffer = AUDIO.buf[k]; s.loop = true;
    var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 95;
    var pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1500; pk.Q.value = 0.8; pk.gain.value = 3.5;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500; lp.Q.value = 0.4;
    var sat = c.createWaveShaper(); sat.curve = satCurve(1.6); sat.oversample = '2x';
    var g = c.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(opt.vol || 0.9, c.currentTime, 0.3);
    var pan = c.createPanner(); pan.panningModel = 'equalpower'; pan.distanceModel = 'inverse'; pan.refDistance = 2.2; pan.rolloffFactor = 1.2; pan.maxDistance = 40;
    var jp = WORLD.jukeboxPos; setPannerPos(pan, jp.x, jp.y, jp.z);
    var send = c.createGain(); send.gain.value = 0.5;
    // tape wobble LFO -> detune
    var lfo = c.createOscillator(); lfo.frequency.value = 0.55; var lg = c.createGain(); lg.gain.value = 0; lfo.connect(lg); lg.connect(s.detune); lfo.start();
    var lfo2 = c.createOscillator(); lfo2.frequency.value = 6.2; var lg2 = c.createGain(); lg2.gain.value = 0; lfo2.connect(lg2); lg2.connect(s.detune); lfo2.start();
    s.connect(hp); hp.connect(pk); pk.connect(sat); sat.connect(lp); lp.connect(g); g.connect(pan); pan.connect(AUDIO.music); g.connect(send); send.connect(AUDIO.revSend);
    if (k === 'reverse') s.playbackRate.value = 0.9;
    s.start(0, opt.offset || Math.random() * 8);
    JUKE.src = s; JUKE.g = g; JUKE.lp = lp; JUKE.pan = pan; JUKE.lfo = lfo; JUKE.lg = lg; JUKE.lg2 = lg2; JUKE.lfo2 = lfo2; JUKE.rate = s.playbackRate.value;
  });
}
function jukeStop(fade, slowdown) {
  JUKE.key = null; if (!JUKE.src) return;
  var c = AUDIO.ctx, s = JUKE.src, g = JUKE.g, t = c.currentTime; JUKE.src = null;
  try {
    if (slowdown) { s.playbackRate.cancelScheduledValues(t); s.playbackRate.setValueAtTime(s.playbackRate.value, t); s.playbackRate.exponentialRampToValueAtTime(0.18, t + slowdown); g.gain.setTargetAtTime(0.0001, t + slowdown * 0.6, slowdown * 0.25); s.stop(t + slowdown + 0.4); }
    else { g.gain.setTargetAtTime(0.0001, t, (fade || 0.2) / 3); s.stop(t + (fade || 0.2) + 0.1); }
    var l1 = JUKE.lfo, l2 = JUKE.lfo2; setTimeout(function () { try { l1.stop(); l2.stop(); } catch (e) {} }, ((slowdown || fade || 0.2) + 0.6) * 1000);
  } catch (e) {}
}
// transition normal -> late night: needle skip + slow down, then warped song
function jukeSkipTo(k, label) {
  sfxAt('needle', WORLD.jukeboxPos);
  jukeStop(0, 1.4);
  setTimeout(function () { jukePlay(k, { label: label, fade: 0 }); }, 1900);
}
function jukeWobble(amt) { JUKE.wobble = amt; }
function satCurve(k) { var n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k) / Math.tanh(k); } return c; }
function setPannerPos(p, x, y, z) { if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z); }
var _fw = null;
function updateAudio(dt) {
  if (!AUDIO.ok) return;
  var c = AUDIO.ctx, L = c.listener, cam = RENDER.camera, t = c.currentTime;
  if (!_fw) _fw = new THREE.Vector3(); cam.getWorldDirection(_fw);
  if (L.positionX) { L.positionX.value = cam.position.x; L.positionY.value = cam.position.y; L.positionZ.value = cam.position.z; L.forwardX.value = _fw.x; L.forwardY.value = _fw.y; L.forwardZ.value = _fw.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
  else { L.setPosition(cam.position.x, cam.position.y, cam.position.z); L.setOrientation(_fw.x, _fw.y, _fw.z, 0, 1, 0); }
  if (JUKE.src) {
    // far rooms hear it muffled through walls
    var sp = AUDIO.space, cut = sp === 'freezer' ? 420 : sp === 'kitchen' ? 2400 : sp === 'outside' ? 900 : sp === 'hall' ? 2600 : 6500;
    JUKE.lp.frequency.setTargetAtTime(cut, t, 0.3);
    JUKE.lg.gain.setTargetAtTime(6 + JUKE.wobble * 60, t, 0.5); JUKE.lg2.gain.setTargetAtTime(2 + JUKE.wobble * 10, t, 0.5);
    if (JUKE.drift !== JUKE._d) { JUKE._d = JUKE.drift; JUKE.src.detune.setTargetAtTime(-JUKE.drift * 700, t, 3); }
  }
  updateAmbience(dt);
}
// ---- SFX helpers ---------------------------------------------------------------------
function rv(a, b) { return a + Math.random() * (b - a); }
function nz(kind) { var s = AUDIO.ctx.createBufferSource(); s.buffer = AUDIO.noise[kind || 'white']; s.loop = true; return s; }
function envG(t, a, peak, d, sus, r, hold) { // attack/decay/sustain/release gain node
  var g = AUDIO.ctx.createGain(), p = g.gain; p.setValueAtTime(0.0001, t);
  p.linearRampToValueAtTime(peak, t + a); p.setTargetAtTime(Math.max(0.0001, peak * sus), t + a, d / 3);
  var end = t + a + (hold || d); p.setTargetAtTime(0.0001, end, r / 4);
  g._end = end + r + 0.05; return g;
}
function filt(type, f, q) { var b = AUDIO.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); return arguments[arguments.length - 1]; }
function outFor(pos) {
  if (!pos) return AUDIO.sfx;
  var p = AUDIO.ctx.createPanner(); p.panningModel = Q === QUAL.LOW ? 'equalpower' : 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1.5; p.rolloffFactor = 1.1; p.maxDistance = 60;
  setPannerPos(p, pos.x, pos.y, pos.z); p.connect(AUDIO.sfx); return p;
}
function tone(t, type, f, a, peak, d, r, out, f2, glide) {
  var o = AUDIO.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + (glide || d));
  var g = envG(t, a, peak, d, 0, r); o.connect(g); g.connect(out); o.start(t); o.stop(g._end); return o;
}
function noiseHit(t, kind, ftype, f, q, a, peak, d, r, out, f2) {
  var s = nz(kind), b = filt(ftype, f, q), g = envG(t, a, peak, d, 0, r); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t + d);
  s.connect(b); b.connect(g); g.connect(out); s.start(t, Math.random() * 1.5); s.stop(g._end); return g;
}
function bellPartials(t, f0, ratios, amps, dec, out, vol) {
  ratios.forEach(function (r, i) { tone(t, 'sine', f0 * r * rv(0.997, 1.003), 0.002, amps[i] * vol, dec * (1 - i * 0.12), dec * 0.5, out); });
}
// the SFX library (each call varies pitch/level/length a little)
function sfx(name, pos, opt) {
  if (!AUDIO.ok) return;
  opt = opt || {};
  var c = AUDIO.ctx, t = c.currentTime + (opt.delay || 0), out = outFor(pos), v = (opt.vol || 1) * rv(0.85, 1.05), p = rv(0.95, 1.06);
  switch (name) {
    case 'click': tone(t, 'triangle', 1800 * p, 0.001, 0.12 * v, 0.02, 0.02, out); noiseHit(t, 'white', 'bandpass', 3500, 2, 0.001, 0.08 * v, 0.015, 0.02, out); break;
    case 'paper': noiseHit(t, 'white', 'bandpass', 2600 * p, 0.8, 0.01, 0.16 * v, 0.06, 0.08, out, 5200); noiseHit(t + 0.05, 'pink', 'highpass', 1800, 0.7, 0.005, 0.1 * v, 0.1, 0.1, out); break;
    case 'paperSlide': noiseHit(t, 'pink', 'bandpass', 1400 * p, 0.6, 0.06, 0.12 * v, 0.25, 0.15, out, 2600); break;
    case 'pen': for (var i = 0; i < 4; i++) noiseHit(t + i * rv(0.04, 0.07), 'white', 'bandpass', rv(3000, 5000), 3, 0.004, 0.06 * v, 0.03, 0.03, out); break;
    case 'step': noiseHit(t, 'brown', 'lowpass', 380 * p, 0.7, 0.004, 0.25 * v, 0.06, 0.07, out); noiseHit(t + 0.01, 'white', 'bandpass', 2200, 1.4, 0.002, 0.05 * v, 0.02, 0.03, out); break;
    case 'doorbell': bellPartials(t, 1320 * p, [1, 2.76, 5.4, 8.9], [0.35, 0.2, 0.12, 0.05], 1.4, out, v); bellPartials(t + rv(0.12, 0.2), 1180 * p, [1, 2.76, 5.4], [0.25, 0.14, 0.07], 1.2, out, v); noiseHit(t, 'white', 'highpass', 6000, 0.7, 0.001, 0.05 * v, 0.04, 0.05, out); break;
    case 'orderBell': bellPartials(t, 1760 * p, [1, 2.4, 3.9, 6.8], [0.4, 0.22, 0.12, 0.06], 1.8, out, v); tone(t, 'square', 90, 0.001, 0.05 * v, 0.02, 0.02, out); break;
    case 'door': noiseHit(t, 'brown', 'lowpass', 300, 0.8, 0.02, 0.3 * v, 0.2, 0.2, out); tone(t + 0.05, 'triangle', 150 * p, 0.01, 0.06 * v, 0.2, 0.2, out, 110); break;
    case 'pour': (function () { var s = nz('pink'), b = filt('bandpass', 900 * p, 1.2), g = envG(t, 0.08, 0.22 * v, opt.len || 1.2, 0.9, 0.25, opt.len || 1.2), lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = rv(9, 14); lg.gain.value = 300; lfo.connect(lg); lg.connect(b.frequency); b.frequency.linearRampToValueAtTime(1500 * p, t + (opt.len || 1.2)); s.connect(b); b.connect(g); g.connect(out); s.start(t); lfo.start(t); s.stop(g._end); lfo.stop(g._end); })(); break;
    case 'cup': bellPartials(t, rv(2300, 2900), [1, 2.3, 3.7], [0.12, 0.07, 0.04], 0.18, out, v); tone(t, 'sine', rv(380, 460), 0.001, 0.08 * v, 0.05, 0.04, out); break;
    case 'cutlery': for (var k2 = 0; k2 < 3; k2++) bellPartials(t + k2 * rv(0.05, 0.11), rv(3200, 4800), [1, 2.7, 4.1], [0.07, 0.04, 0.02], 0.12, out, v); break;
    case 'register': noiseHit(t, 'brown', 'lowpass', 600, 0.9, 0.003, 0.35 * v, 0.05, 0.05, out); for (var r2 = 0; r2 < 3; r2++) noiseHit(t + 0.06 + r2 * 0.05, 'white', 'bandpass', 2800, 4, 0.002, 0.1 * v, 0.02, 0.02, out);
      bellPartials(t + 0.22, 2100 * p, [1, 2.76, 5.4], [0.34, 0.16, 0.08], 1.3, out, v); noiseHit(t + 0.3, 'pink', 'bandpass', 700, 1, 0.03, 0.2 * v, 0.25, 0.2, out, 400); break;
    case 'print': for (var q2 = 0; q2 < (opt.n || 26); q2++) { var tt = t + q2 * 0.055; tone(tt, 'square', rv(780, 860), 0.002, 0.03 * v, 0.03, 0.02, out); noiseHit(tt, 'white', 'bandpass', 4200, 3, 0.001, 0.04 * v, 0.025, 0.02, out); } noiseHit(t + (opt.n || 26) * 0.055, 'white', 'highpass', 3000, 0.7, 0.002, 0.14 * v, 0.06, 0.05, out); break;
    case 'stool': (function () { var o = c.createOscillator(), b = filt('bandpass', 1200 * p, 9), g = envG(t, 0.04, 0.05 * v, 0.3, 0.6, 0.15, 0.3); o.type = 'sawtooth'; o.frequency.setValueAtTime(rv(320, 380), t); o.frequency.linearRampToValueAtTime(rv(420, 520), t + 0.35); o.connect(b); b.connect(g); g.connect(out); o.start(t); o.stop(g._end); })(); break;
    case 'sizzle': (function () { var len = opt.len || 2; var s = nz('white'), hp = filt('highpass', 3500 * p, 0.6), pk = filt('peaking', 7000, 1), g = envG(t, 0.15, 0.16 * v, len, 0.85, 0.6, len); pk.gain.value = 6; chain(s, hp, pk, g, out); s.start(t); s.stop(g._end);
      for (var j = 0; j < len * 9; j++) noiseHit(t + Math.random() * len, 'white', 'bandpass', rv(2000, 6000), 2, 0.001, rv(0.05, 0.16) * v, 0.01, 0.02, out); })(); break;
    case 'scrape': noiseHit(t, 'white', 'bandpass', 2200 * p, 3, 0.02, 0.16 * v, 0.18, 0.08, out, 3200); bellPartials(t, rv(1600, 1900), [1, 2.3], [0.05, 0.03], 0.25, out, v); break;
    case 'flip': noiseHit(t, 'pink', 'bandpass', 600, 0.8, 0.04, 0.18 * v, 0.1, 0.06, out, 1600); noiseHit(t + 0.16, 'brown', 'lowpass', 300, 0.8, 0.003, 0.4 * v, 0.06, 0.08, out); sfx('sizzle', pos, { len: 0.6, vol: 0.7 }); break;
    case 'crack': noiseHit(t, 'white', 'bandpass', 3000 * p, 2, 0.001, 0.3 * v, 0.02, 0.03, out); noiseHit(t + 0.03, 'white', 'highpass', 2000, 1, 0.002, 0.12 * v, 0.06, 0.05, out); tone(t + 0.08, 'sine', 120, 0.01, 0.12 * v, 0.1, 0.08, out, 80); break;
    case 'thump': noiseHit(t, 'brown', 'lowpass', 220 * p, 0.8, 0.003, 0.35 * v, 0.07, 0.08, out); break;
    case 'whir': (function () { var len = opt.len || 1.5, o = c.createOscillator(), o2 = c.createOscillator(), g = envG(t, 0.2, 0.06 * v, len, 0.9, 0.3, len), b = filt('bandpass', 900, 2); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(240 * p, t + 0.4); o2.frequency.value = 241 * p; chain(o, b); o2.connect(b); b.connect(g); g.connect(out); o.start(t); o2.start(t); o.stop(g._end); o2.stop(g._end); sfx('pour', pos, { len: len, vol: 0.5 }); })(); break;
    case 'knife': noiseHit(t, 'white', 'bandpass', 3800 * p, 4, 0.01, 0.16 * v, 0.12, 0.05, out, 2400); noiseHit(t + 0.14, 'brown', 'lowpass', 500, 1, 0.002, 0.25 * v, 0.04, 0.04, out); break;
    case 'needle': noiseHit(t, 'white', 'bandpass', 1800, 1.5, 0.002, 0.5 * v, 0.08, 0.06, out, 600); noiseHit(t + 0.09, 'white', 'highpass', 3000, 1, 0.002, 0.3 * v, 0.05, 0.05, out); noiseHit(t + 0.2, 'pink', 'bandpass', 900, 2, 0.001, 0.2 * v, 0.1, 0.1, out, 300); break;
    case 'switch': noiseHit(t, 'white', 'bandpass', 2400, 2, 0.001, 0.3 * v, 0.015, 0.02, out); noiseHit(t + 0.012, 'brown', 'lowpass', 400, 1, 0.001, 0.3 * v, 0.03, 0.03, out); break;
    case 'zap': noiseHit(t, 'white', 'highpass', 1500, 0.7, 0.001, 0.4 * v, 0.06, 0.08, out); tone(t, 'sawtooth', 120, 0.001, 0.2 * v, 0.25, 0.2, out, 40); break;
    case 'handset': noiseHit(t, 'brown', 'lowpass', 500, 1, 0.002, 0.4 * v, 0.04, 0.05, out); noiseHit(t + 0.05, 'white', 'bandpass', 2500, 3, 0.001, 0.15 * v, 0.02, 0.02, out); break;
    case 'dialtone': tone(t, 'sine', 350, 0.01, 0.06 * v, opt.len || 1.2, 0.05, out); tone(t, 'sine', 440, 0.01, 0.06 * v, opt.len || 1.2, 0.05, out); break;
    case 'ring': ringPhone(t, out, v, opt.distort || 0); break;
    case 'knock': for (var kk = 0; kk < (opt.n || 3); kk++) { var tk = t + kk * rv(0.22, 0.3); noiseHit(tk, 'brown', 'lowpass', 260 * p, 1, 0.002, 0.7 * v, 0.07, 0.1, out); noiseHit(tk, 'white', 'bandpass', 900, 2, 0.001, 0.12 * v, 0.03, 0.04, out); } break;
    case 'bang': noiseHit(t, 'brown', 'lowpass', 180, 1, 0.002, 1.0 * v, 0.2, 0.25, out); noiseHit(t, 'white', 'bandpass', 600, 1, 0.001, 0.4 * v, 0.1, 0.1, out); tone(t, 'sine', 70, 0.002, 0.5 * v, 0.3, 0.2, out, 45); break;
    case 'breath': (function () { var len = opt.len || 2.4; for (var b2 = 0; b2 < 2; b2++) { var st = t + b2 * len / 2, s = nz('pink'), bp = filt('bandpass', b2 ? 900 : 1300, 1.4), g = envG(st, len * 0.18, 0.22 * v, len * 0.25, 0.6, len * 0.2, len * 0.22); chain(s, bp, g, out); s.start(st); s.stop(g._end); } })(); break;
    case 'whisper': for (var w2 = 0; w2 < 7; w2++) noiseHit(t + w2 * rv(0.1, 0.2), 'white', 'bandpass', rv(1800, 4200), 6, 0.02, rv(0.06, 0.12) * v, 0.08, 0.06, out); break;
    case 'steps': for (var s3 = 0; s3 < (opt.n || 4); s3++) { var ts = t + s3 * rv(0.42, 0.55); noiseHit(ts, 'brown', 'lowpass', 300 * p, 0.7, 0.003, 0.5 * v, 0.08, 0.1, out); noiseHit(ts + 0.02, 'white', 'bandpass', 1400, 1.4, 0.002, 0.06 * v, 0.03, 0.04, out); } break;
    case 'freezerBang': noiseHit(t, 'brown', 'lowpass', 140, 1, 0.002, 1.1 * v, 0.25, 0.4, out); tone(t, 'triangle', 90, 0.002, 0.3 * v, 0.6, 0.4, out, 70); bellPartials(t, 420, [1, 2.4, 3.8], [0.06, 0.04, 0.02], 0.8, out, v); break;
    case 'static': noiseHit(t, 'white', 'highpass', 800, 0.5, 0.01, 0.12 * v, opt.len || 0.8, 0.2, out); break;
    case 'stinger': [0, 1, 6, 11].forEach(function (s4, i) { tone(t, 'sawtooth', 110 * Math.pow(2, s4 / 12) * p, 0.01, 0.07 * v, 1.4, 0.8, out, 110 * Math.pow(2, s4 / 12) * 0.9, 1.4); }); noiseHit(t, 'white', 'bandpass', 4000, 1, 0.001, 0.3 * v, 0.3, 0.3, out); tone(t, 'sine', 55, 0.005, 0.5 * v, 1.0, 0.6, out, 35); break;
    case 'scream': scream(t, out, v); break;
    case 'heart': for (var h2 = 0; h2 < (opt.n || 4); h2++) { var th = t + h2 * (opt.gap || 0.8); tone(th, 'sine', 55, 0.005, 0.5 * v, 0.08, 0.08, out, 40); tone(th + 0.17, 'sine', 48, 0.005, 0.35 * v, 0.08, 0.08, out, 36); } break;
    case 'thunder': (function () { var s = nz('brown'), lp = filt('lowpass', 420, 0.5), g = envG(t, 0.04, 0.9 * v, 0.6, 0.5, 2.5, 1.2); lp.frequency.exponentialRampToValueAtTime(90, t + 3); chain(s, lp, g, AUDIO.amb); s.start(t); s.stop(g._end); noiseHit(t, 'white', 'highpass', 1200, 0.7, 0.002, 0.3 * v, 0.15, 0.3, AUDIO.amb); })(); break;
    case 'coyote': (function () { var o = c.createOscillator(), vb = c.createOscillator(), vg = c.createGain(), bp = filt('bandpass', 1100, 3), g = envG(t, 0.25, 0.05 * v, 1.6, 0.8, 0.8, 1.6); o.type = 'sawtooth'; o.frequency.setValueAtTime(500, t); o.frequency.linearRampToValueAtTime(900, t + 0.5); o.frequency.linearRampToValueAtTime(700, t + 1.9); vb.frequency.value = 6; vg.gain.value = 18; vb.connect(vg); vg.connect(o.frequency); chain(o, bp, g, outFor(opt.at || new THREE.Vector3(-60, 2, 80))); o.start(t); vb.start(t); o.stop(g._end); vb.stop(g._end); })(); break;
    case 'carPass': (function () { var s = nz('pink'), lp = filt('lowpass', 900, 0.6), g = envG(t, 1.6, 0.35 * v, 1.2, 0.3, 1.8, 0.8); chain(s, lp, g, out); s.start(t); s.stop(g._end); tone(t, 'sawtooth', 55, 1.4, 0.04 * v, 1.2, 1.5, out, 42, 3); })(); break;
    case 'engine': (function () { var len = opt.len || 6; var o = c.createOscillator(), lp = filt('lowpass', 260, 1), g = envG(t, 1.0, 0.12 * v, len, 0.8, 1.5, len); o.type = 'sawtooth'; o.frequency.setValueAtTime(42, t); o.frequency.linearRampToValueAtTime(opt.down ? 30 : 58, t + len); chain(o, lp, g, out); o.start(t); o.stop(g._end); noiseHit(t, 'brown', 'lowpass', 200, 0.7, 1, 0.2 * v, len, 1, out); })(); break;
    case 'tires': noiseHit(t, 'pink', 'bandpass', 500, 0.6, 0.6, 0.12 * v, 2.5, 1.0, out); break;
    case 'carDoor': noiseHit(t, 'brown', 'lowpass', 260, 1, 0.002, 0.5 * v, 0.12, 0.15, out); noiseHit(t, 'white', 'bandpass', 1500, 2, 0.001, 0.1 * v, 0.03, 0.04, out); break;
    case 'jingleHit': tone(t, 'sine', 880, 0.002, 0.1 * v, 0.3, 0.3, out, 440); break;
    case 'coin': bellPartials(t, rv(3800, 4400), [1, 1.5, 2.9], [0.14, 0.07, 0.04], 0.35, out, v); bellPartials(t + rv(0.06, 0.1), rv(3500, 4100), [1, 1.5, 2.9], [0.1, 0.05, 0.02], 0.3, out, v); break;
    case 'tearPaper': noiseHit(t, 'white', 'bandpass', 2000 * p, 0.7, 0.01, 0.35 * v, 0.28, 0.06, out, 4500); for (var tp = 0; tp < 6; tp++) noiseHit(t + tp * 0.04, 'white', 'highpass', 3000, 1, 0.001, 0.1 * v, 0.02, 0.02, out); break;
    case 'freeze': noiseHit(t, 'white', 'highpass', 5000, 0.7, 0.3, 0.06 * v, 1.5, 0.8, out); break;
    case 'pop': noiseHit(t, 'white', 'bandpass', rv(2500, 5000), 3, 0.001, 0.2 * v, 0.01, 0.02, out); break;
    case 'drip': tone(t, 'sine', rv(1400, 2200), 0.001, 0.05 * v, 0.04, 0.03, out, rv(500, 800), 0.05); break;
  }
}
function sfxAt(name, pos, opt) { sfx(name, pos, opt); }
function ringPhone(t, out, v, dist) {
  // classic two-burst bell ring (clapper ~22Hz on a bell), distortion grows each call
  var c = AUDIO.ctx, f0 = 1050 * (1 - dist * 0.12);
  for (var burst = 0; burst < 2; burst++) {
    var tb = t + burst * 0.55, len = 0.4;
    var mod = c.createOscillator(), mg = c.createGain(); mod.type = 'square'; mod.frequency.value = 22; mg.gain.value = 0.5;
    var am = c.createGain(); am.gain.value = 0.5; mod.connect(mg); mg.connect(am.gain);
    [1, 1.47, 2.6, 3.9].forEach(function (r, i) { var o = c.createOscillator(); o.type = dist > 0.4 ? 'sawtooth' : 'sine'; o.frequency.value = f0 * r; var g = c.createGain(); g.gain.value = [0.18, 0.12, 0.06, 0.03][i] * v; o.connect(g); g.connect(am); o.start(tb); o.stop(tb + len + 0.05); });
    var env = envG(tb, 0.005, 1, len, 1, 0.08, len);
    if (dist > 0) { var ws = c.createWaveShaper(); ws.curve = satCurve(1 + dist * 8); am.connect(ws); ws.connect(env); } else am.connect(env);
    env.connect(out); mod.start(tb); mod.stop(tb + len + 0.1);
  }
}
function scream(t, out, v) {
  var c = AUDIO.ctx, mild = SAVE.settings.scare === 'MILD', vol = (mild ? 0.45 : 1) * v;
  var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9 * vol, t + 0.02); g.gain.setTargetAtTime(0.5 * vol, t + 0.3, 0.3); g.gain.setTargetAtTime(0.0001, t + 1.5, 0.25);
  var ws = c.createWaveShaper(); ws.curve = satCurve(4); var bp = filt('bandpass', 1400, 0.7);
  [0, 7, 13, 18].forEach(function (s, i) { var o = c.createOscillator(); o.type = 'sawtooth'; var f = 260 * Math.pow(2, s / 12); o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.25); o.frequency.linearRampToValueAtTime(f * 0.82, t + 1.6); var vb = c.createOscillator(), vg = c.createGain(); vb.frequency.value = 7 + i * 2; vg.gain.value = f * 0.04; vb.connect(vg); vg.connect(o.frequency); o.connect(ws); o.start(t); vb.start(t); o.stop(t + 2); vb.stop(t + 2); });
  var s = nz('white'), nf = filt('bandpass', 3000, 0.6); s.connect(nf); nf.connect(ws); s.start(t); s.stop(t + 2);
  ws.connect(bp); bp.connect(g); g.connect(out);
  var sub = c.createOscillator(); sub.type = 'sine'; sub.frequency.setValueAtTime(90, t); sub.frequency.exponentialRampToValueAtTime(32, t + 1.2); var sg = envG(t, 0.005, 0.9 * vol, 0.9, 0, 0.3); sub.connect(sg); sg.connect(out); sub.start(t); sub.stop(sg._end);
}
// ---- ambience loops (fridge hum, neon buzz, rain, wind) -------------------------------
var AMB = {};
function loopNoise(kind, ftype, f, q, vol, pos) {
  var c = AUDIO.ctx, s = nz(kind), b = filt(ftype, f, q), g = c.createGain(); g.gain.value = 0; s.connect(b); b.connect(g); g.connect(pos ? outFor(pos) : AUDIO.amb); s.start(0, Math.random()); return { s: s, b: b, g: g, base: vol };
}
function startAmbience() {
  var c = AUDIO.ctx;
  // fridge/hvac hum (60Hz + harmonics) near kitchen
  var hum = c.createGain(); hum.gain.value = 0;
  [60, 120, 180, 240].forEach(function (f, i) { var o = c.createOscillator(); o.frequency.value = f; var g = c.createGain(); g.gain.value = [0.5, 0.25, 0.12, 0.06][i]; o.connect(g); g.connect(hum); o.start(); });
  var hp = filt('lowpass', 500, 0.7); hum.connect(hp); hp.connect(outFor(new THREE.Vector3(5.5, 1.2, -3.6)));
  AMB.hum = { g: hum, base: 0.035 };
  // neon buzz (120Hz sawtooth band-limited) near the neon
  var bz = c.createOscillator(); bz.type = 'sawtooth'; bz.frequency.value = 120; var bzf = filt('bandpass', 2400, 2.5); var bzg = c.createGain(); bzg.gain.value = 0; bz.connect(bzf); bzf.connect(bzg); bzg.connect(outFor(new THREE.Vector3(1.5, 2.5, -2.6))); bz.start();
  AMB.neon = { g: bzg, base: 0.012 };
  AMB.room = loopNoise('pink', 'lowpass', 400, 0.5, 0.02);
  AMB.rain = loopNoise('pink', 'bandpass', 1800, 0.35, 0.0);
  AMB.rainLow = loopNoise('brown', 'lowpass', 300, 0.5, 0.0);
  AMB.wind = loopNoise('brown', 'bandpass', 420, 0.9, 0.0);
  AMB.dripT = 0;
}
function updateAmbience(dt) {
  if (!AMB.hum) return; var t = AUDIO.ctx.currentTime, sp = AUDIO.space;
  var inside = sp !== 'outside', fz = sp === 'freezer';
  AMB.hum.g.gain.setTargetAtTime((fz ? 0.09 : AMB.hum.base) * (typeof GAME !== 'undefined' && GAME && GAME.blackout ? 0 : 1), t, 0.5);
  AMB.neon.g.gain.setTargetAtTime(AMB.neon.base * LSTATE.neon * (inside ? 1 : 0.3), t, 0.2);
  AMB.room.g.gain.setTargetAtTime(0.02, t, 0.5);
  var r = FX.rain || 0, muff = fz ? 0.15 : (inside ? 0.45 : 1);
  AMB.rain.g.gain.setTargetAtTime(r * 0.09 * muff, t, 0.6); AMB.rain.b.frequency.setTargetAtTime(inside ? 1100 : 2400, t, 0.5);
  AMB.rainLow.g.gain.setTargetAtTime(r * 0.12 * muff, t, 0.6);
  AMB.wind.g.gain.setTargetAtTime((0.02 + r * 0.04) * (inside ? 0.4 : 1) * (0.7 + 0.3 * Math.sin(t * 0.3)), t, 1);
  AMB.wind.b.frequency.setTargetAtTime(300 + 200 * Math.sin(t * 0.13), t, 1);
  if (r > 0.2 && inside) { AMB.dripT -= dt; if (AMB.dripT <= 0) { AMB.dripT = rv(0.3, 2.2) / r; sfx('drip', new THREE.Vector3(rv(-7, 4), 2.6, 5.1), { vol: 0.35 }); } }
}
function sfxCarPass(car) { sfx('carPass', new THREE.Vector3(car.obj.position.x * 0.3, 1, car.obj.position.z), { vol: 0.5 }); }
function sfxCarArrive(leave) { var p = FX.visitor.obj.position.clone(); sfx('engine', new THREE.Vector3(p.x, 1, Math.min(p.z, 20)), { len: 7, down: !leave, vol: 0.8 }); sfx('tires', new THREE.Vector3(p.x, 0.5, 15), { vol: 0.6, delay: 4 }); if (!leave) sfx('carDoor', new THREE.Vector3(0, 1, 10), { delay: 9.5, vol: 0.7 }); }
