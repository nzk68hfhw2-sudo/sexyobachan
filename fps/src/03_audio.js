// ---- synthesized audio (WebAudio, starts after the first tap) ---------------
var AU = { ctx: null, ok: false, vol: store.get('vol', 0.8) };
function audioInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try {
    var c = AU.ctx = new AC();
    AU.master = c.createGain(); AU.master.gain.value = AU.vol;
    AU.lp = c.createBiquadFilter(); AU.lp.type = 'lowpass'; AU.lp.frequency.value = 20000;
    AU.comp = c.createDynamicsCompressor(); AU.comp.threshold.value = -14; AU.comp.ratio.value = 6;
    AU.lp.connect(AU.comp); AU.comp.connect(AU.master); AU.master.connect(c.destination);
    var n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = b;
    // ambience: wind + distant rotor hum
    var w = c.createBufferSource(); w.buffer = b; w.loop = true;
    var wf = c.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 320;
    var wg = c.createGain(); wg.gain.value = 0.11;
    var lfo = c.createOscillator(); lfo.frequency.value = 0.13; var lg = c.createGain(); lg.gain.value = 0.05; lfo.connect(lg); lg.connect(wg.gain); lfo.start();
    w.connect(wf); wf.connect(wg); wg.connect(AU.lp); w.start();
    var h = c.createOscillator(); h.type = 'sawtooth'; h.frequency.value = 92;
    var h2 = c.createOscillator(); h2.type = 'sawtooth'; h2.frequency.value = 139;
    var hf = c.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 520;
    AU.hum = c.createGain(); AU.hum.gain.value = 0; h.connect(hf); h2.connect(hf); hf.connect(AU.hum); AU.hum.connect(AU.lp); h.start(); h2.start();
    AU.ok = true;
    if (c.state === 'suspended') c.resume();
  } catch (e) { AU.ok = false; }
}
function auOut(pan) {
  if (pan && AU.ctx.createStereoPanner) { var p = AU.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); p.connect(AU.lp); return p; }
  return AU.lp;
}
function auNoise(t, dur, f0, f1, vol, type, pan, q) {
  var c = AU.ctx, s = c.createBufferSource(); s.buffer = AU.noise; s.loop = true;
  var f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.Q.value = q || 0.7;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(auOut(pan)); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
}
function auTone(t, dur, f0, f1, vol, type, pan, attack) {
  var c = AU.ctx, o = c.createOscillator(); o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + dur);
  var g = c.createGain();
  if (attack) { g.gain.setValueAtTime(0.0008, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); } else g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(auOut(pan)); o.start(t); o.stop(t + dur + 0.02);
}
// per weapon: [crack, body length, body start freq, thump freq, tail, volume]
var SHOT_SND = { ar: [1, 0.16, 3800, 170, 1, 1], pistol: [0.8, 0.1, 4200, 240, 0.5, 0.8], shotgun: [0.9, 0.3, 2400, 120, 1.5, 1.15], sniper: [1.3, 0.34, 3000, 110, 2.2, 1.2], smg: [0.7, 0.1, 4600, 220, 0.6, 0.75], lmg: [1, 0.2, 3200, 140, 1.2, 1.05], magnum: [1.2, 0.26, 2800, 130, 1.8, 1.15], rocket: [0.3, 0.4, 1500, 90, 1.5, 1] };
var SFX = {
  shot: function (id) { if (!AU.ok) return; var t = AU.ctx.currentTime, k = SHOT_SND[id] || SHOT_SND.ar;
    auNoise(t, 0.03, 9000, 3000, 0.9 * k[0], 'highpass');
    auNoise(t, k[1], k[2], 300, 0.95 * k[5], 'lowpass');
    auTone(t, 0.11 + k[1] * 0.3, k[3], k[3] * 0.28, 0.9 * k[5], 'sine');
    auNoise(t + 0.05, 0.55 * k[4], 1400, 180, 0.16 * k[4], 'lowpass');
    auNoise(t + 0.19, 0.5 * k[4], 700, 120, 0.07 * k[4], 'lowpass');
    if (id === 'rocket') { auNoise(t, 0.7, 500, 3500, 0.5, 'bandpass', 0, 1.5); } },
  empty: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.03, 4000, 2000, 0.3, 'bandpass', 0, 4); auTone(t, 0.04, 1400, 900, 0.08, 'square'); },
  click: function (dt, f, v) { if (!AU.ok) return; var t = AU.ctx.currentTime + (dt || 0); auNoise(t, 0.045, f || 3000, 900, v || 0.35, 'bandpass', 0, 3); auTone(t, 0.06, (f || 3000) * 0.4, (f || 3000) * 0.3, 0.07, 'triangle'); },
  reload: function (d) { var k = (d || 1.7) / 1.7; SFX.click(0.1 * k, 2200, 0.3); SFX.click(0.75 * k, 2800, 0.36); SFX.click(0.85 * k, 1800, 0.25); SFX.click(1.35 * k, 3600, 0.4); SFX.click(1.45 * k, 2500, 0.4); },
  throwS: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.18, 600, 2400, 0.25, 'bandpass', 0, 1.2); },
  pickup: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.1, 660, 660, 0.12, 'triangle'); auTone(t + 0.08, 0.16, 990, 990, 0.12, 'triangle'); },
  coin: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.07, 1568, 1568, 0.1, 'square'); auTone(t + 0.07, 0.25, 2093, 2093, 0.1, 'square'); },
  streak: function (n) { if (!AU.ok) return; var t = AU.ctx.currentTime, base = 440 * Math.pow(1.122, Math.min(n, 10)); [1, 1.26, 1.5, 2].forEach(function (m, i) { auTone(t + i * 0.07, 0.3, base * m, base * m, 0.11, 'sawtooth', 0, 0.01); }); },
  step: function (run) { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.07, rnd(500, 800), 150, run ? 0.2 : 0.13, 'lowpass'); auNoise(t, 0.03, 3000, 1500, 0.03, 'bandpass'); },
  shell: function () { if (!AU.ok) return; var t = AU.ctx.currentTime + 0.35; var f = rnd(3000, 4400); auTone(t, 0.09, f, f * 0.98, 0.035, 'sine'); auTone(t + 0.11, 0.06, f * 1.2, f * 1.19, 0.02, 'sine'); },
  impact: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auNoise(t, 0.05, 5000, 1200, 0.16 * vol, 'bandpass', pan, 2); },
  hit: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.035, 2100, 1700, 0.12, 'square'); auNoise(t, 0.04, 6000, 2500, 0.14, 'bandpass', 0, 3); },
  kill: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.07, 1200, 1200, 0.13, 'square'); auTone(t + 0.07, 0.12, 1800, 1800, 0.13, 'square'); },
  charge: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.42, 500, 1900, 0.06 * vol, 'sawtooth', pan, 0.3); },
  bolt: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.2, 1300, 180, 0.2 * vol, 'sawtooth', pan); auNoise(t, 0.1, 5000, 800, 0.12 * vol, 'bandpass', pan, 2); },
  beep: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.06, 2400, 2400, 0.1 * vol, 'square', pan); },
  boom: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime;
    auNoise(t, 0.9, 1800, 50, 1.0 * vol, 'lowpass', pan); auTone(t, 0.5, 95, 28, 0.9 * vol, 'sine', pan); auNoise(t, 0.08, 8000, 2000, 0.4 * vol, 'highpass', pan); auNoise(t + 0.2, 1.1, 500, 80, 0.2 * vol, 'lowpass', pan); },
  hurt: function () { if (!AU.ok) return; var c = AU.ctx, t = c.currentTime; auTone(t, 0.2, 130, 45, 0.8, 'sine'); auNoise(t, 0.14, 1500, 200, 0.5, 'lowpass');
    AU.lp.frequency.cancelScheduledValues(t); AU.lp.frequency.setValueAtTime(700, t); AU.lp.frequency.exponentialRampToValueAtTime(20000, t + 0.9); },
  alarm: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; for (var i = 0; i < 3; i++) { auTone(t + i * 0.36, 0.16, 660, 660, 0.09, 'square'); auTone(t + i * 0.36 + 0.17, 0.16, 495, 495, 0.09, 'square'); } },
  rescue: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; [523, 659, 784, 1047, 1319].forEach(function (f, i) { auTone(t + i * 0.09, 0.4, f, f, 0.13, 'triangle', 0, 0.01); auTone(t + i * 0.09, 0.3, f * 2, f * 2, 0.04, 'sine'); }); },
  down: function (pan, vol) { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.28, 520, 170, 0.12 * vol, 'triangle', pan, 0.02); auNoise(t + 0.3, 0.12, 700, 120, 0.4 * vol, 'lowpass', pan); auTone(t + 0.3, 0.14, 110, 50, 0.4 * vol, 'sine', pan); },
  cage: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.6, 900, 80, 0.14, 'sawtooth'); auNoise(t, 0.5, 6000, 400, 0.14, 'bandpass', 0, 2); },
  ui: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; auTone(t, 0.05, 880, 880, 0.08, 'triangle'); },
  win: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { auTone(t + i * 0.13, 0.5, f, f, 0.12, 'triangle', 0, 0.01); }); },
  lose: function () { if (!AU.ok) return; var t = AU.ctx.currentTime; [392, 330, 262, 196].forEach(function (f, i) { auTone(t + i * 0.25, 0.6, f, f * 0.97, 0.12, 'triangle', 0, 0.02); }); }
};
function setVolume(v) { AU.vol = v; store.set('vol', v); if (AU.master) AU.master.gain.value = v; }
