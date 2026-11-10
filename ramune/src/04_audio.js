// ---- procedural audio (WebAudio, no files) -------------------------------------
var AU = { ready: false, ctx: null, master: null, bgm: null, sfx: null, music: true, beat: 0, nextT: 0, step: 0, chord: 0,
  p: { lp: 1, tempo: 1, detune: 0, rev: 0.25, psy: 0, drums: 1, emp: 0, wob: 0 }, hbT: 0, whT: 0 };

function initAudio() {
  if (AU.ctx) { try { if (AU.ctx.state === 'suspended') AU.ctx.resume(); } catch (e) {} return; }
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var c = AU.ctx = new AC();
    AU.master = c.createGain(); AU.master.gain.value = 0.9; AU.master.connect(c.destination);
    AU.comp = c.createDynamicsCompressor(); AU.comp.threshold.value = -14; AU.comp.ratio.value = 4; AU.comp.connect(AU.master);
    // reverb
    AU.verb = c.createConvolver(); AU.verb.buffer = makeImpulse(c, 3.2, 2.4);
    AU.verbGain = c.createGain(); AU.verbGain.gain.value = 0.25; AU.verb.connect(AU.verbGain); AU.verbGain.connect(AU.comp);
    // music bus: filter -> gain
    AU.bgmFilter = c.createBiquadFilter(); AU.bgmFilter.type = 'lowpass'; AU.bgmFilter.frequency.value = 8000; AU.bgmFilter.Q.value = 0.7;
    AU.bgm = c.createGain(); AU.bgm.gain.value = SAVE.settings.bgm * 0.55;
    AU.bgmFilter.connect(AU.bgm); AU.bgm.connect(AU.comp);
    AU.bgmSend = c.createGain(); AU.bgmSend.gain.value = 0.35; AU.bgmFilter.connect(AU.bgmSend); AU.bgmSend.connect(AU.verb);
    AU.sfx = c.createGain(); AU.sfx.gain.value = SAVE.settings.sfx; AU.sfx.connect(AU.comp);
    AU.sfxSend = c.createGain(); AU.sfxSend.gain.value = 0.2; AU.sfx.connect(AU.sfxSend); AU.sfxSend.connect(AU.verb);
    AU.noise = makeNoise(c, 2);
    // room tone
    AU.room = c.createBufferSource(); AU.room.buffer = makeNoise(c, 4, true); AU.room.loop = true;
    AU.roomF = c.createBiquadFilter(); AU.roomF.type = 'lowpass'; AU.roomF.frequency.value = 260;
    AU.roomG = c.createGain(); AU.roomG.gain.value = 0.05;
    AU.room.connect(AU.roomF); AU.roomF.connect(AU.roomG); AU.roomG.connect(AU.sfx); AU.room.start();
    // outdoor city
    AU.city = c.createBufferSource(); AU.city.buffer = AU.room.buffer; AU.city.loop = true; AU.city.playbackRate.value = 1.7;
    AU.cityF = c.createBiquadFilter(); AU.cityF.type = 'bandpass'; AU.cityF.frequency.value = 500; AU.cityF.Q.value = 0.4;
    AU.cityG = c.createGain(); AU.cityG.gain.value = 0;
    AU.city.connect(AU.cityF); AU.cityF.connect(AU.cityG); AU.cityG.connect(AU.sfx); AU.city.start();
    // tinnitus
    AU.tin = c.createOscillator(); AU.tin.frequency.value = 6800; AU.tinG = c.createGain(); AU.tinG.gain.value = 0;
    AU.tin.connect(AU.tinG); AU.tinG.connect(AU.sfx); AU.tin.start();
    AU.nextT = c.currentTime + 0.2;
    AU.ready = true;
  } catch (e) { console.warn('audio init failed', e); }
}
function makeNoise(c, sec, brown) {
  var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), last = 0;
  for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return b;
}
function makeImpulse(c, sec, decay) {
  var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
  for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}
function auVol() { if (!AU.ready) return; AU.bgm.gain.value = SAVE.settings.bgm * 0.55 * (AU.music ? 1 : 0); AU.sfx.gain.value = SAVE.settings.sfx; }

// ---- primitive voices -------------------------------------------------------------
function tone(freq, t, dur, o) {
  o = o || {}; var c = AU.ctx;
  var osc = c.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(freq, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
  if (o.detune) osc.detune.value = o.detune;
  var g = c.createGain(); var v = o.vol == null ? 0.2 : o.vol; var a = o.attack || 0.005;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  var node = osc;
  if (o.filter) { var f = c.createBiquadFilter(); f.type = o.filter.type || 'lowpass'; f.frequency.value = o.filter.f; f.Q.value = o.filter.q || 0.8; osc.connect(f); node = f; }
  node.connect(g);
  if (o.pan != null && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(o.bus || AU.sfx); } else g.connect(o.bus || AU.sfx);
  osc.start(t); osc.stop(t + dur + 0.05);
}
function noiseHit(t, dur, o) {
  o = o || {}; var c = AU.ctx;
  var s = c.createBufferSource(); s.buffer = AU.noise; s.playbackRate.value = o.rate || 1;
  var f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q || 1;
  if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur);
  var g = c.createGain(); var v = o.vol == null ? 0.2 : o.vol;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.attack || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g);
  if (o.pan != null && c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(o.bus || AU.sfx); } else g.connect(o.bus || AU.sfx);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
}

// ---- sound effects -------------------------------------------------------------
function sfx(name, arg) {
  if (!AU.ready) return;
  var t = AU.ctx.currentTime + 0.01, i;
  switch (name) {
    case 'can': // プシュッ
      noiseHit(t, 0.05, { f: 3000, q: 0.6, vol: 0.4 }); noiseHit(t + 0.02, 0.5, { f: 6000, fTo: 2500, type: 'highpass', vol: 0.25 }); break;
    case 'gulp':
      for (i = 0; i < 4; i++) tone(180 - i * 8, t + i * 0.42, 0.18, { vol: 0.18, slide: 90, type: 'sine' }); break;
    case 'pill': // カリッ
      noiseHit(t, 0.04, { f: 4200, q: 3, vol: 0.35 }); noiseHit(t + 0.11, 0.05, { f: 3200, q: 3, vol: 0.3 }); noiseHit(t + 0.24, 0.05, { f: 3600, q: 3, vol: 0.2 });
      tone(1600, t + 0.4, 0.18, { vol: 0.05, type: 'triangle', slide: 1200 }); break;
    case 'water':
      noiseHit(t, 1.6, { f: 1800, q: 0.5, vol: 0.18, attack: 0.1 }); for (i = 0; i < 3; i++) tone(200, t + 0.5 + i * 0.4, 0.15, { vol: 0.12, slide: 100 }); break;
    case 'fridge':
      tone(70, t, 0.25, { vol: 0.3, type: 'triangle' }); noiseHit(t, 0.12, { f: 400, vol: 0.2 }); break;
    case 'click':
      noiseHit(t, 0.03, { f: 2500, q: 4, vol: 0.3 }); tone(900, t, 0.04, { vol: 0.08, type: 'square' }); break;
    case 'ui':
      tone(880, t, 0.08, { vol: 0.07, type: 'triangle' }); tone(1320, t + 0.05, 0.1, { vol: 0.05, type: 'triangle' }); break;
    case 'combo':
      [0, 4, 7, 12, 16].forEach(function (n, k) { tone(523.25 * Math.pow(2, n / 12), t + k * 0.08, 0.9, { vol: 0.12, type: 'triangle' }); tone(1046.5 * Math.pow(2, n / 12), t + k * 0.08, 0.6, { vol: 0.04 }); }); break;
    case 'warn':
      tone(740, t, 0.15, { vol: 0.15, type: 'square', filter: { f: 2000 } }); tone(740, t + 0.22, 0.15, { vol: 0.15, type: 'square', filter: { f: 2000 } }); break;
    case 'vomit':
      noiseHit(t, 1.4, { f: 300, fTo: 900, q: 2, vol: 0.5, attack: 0.15 }); tone(110, t, 1.2, { vol: 0.2, type: 'sawtooth', slide: 70, filter: { f: 500 } });
      noiseHit(t + 1.3, 0.8, { f: 700, q: 0.8, vol: 0.2 }); break;
    case 'flush':
      noiseHit(t, 2.5, { f: 900, fTo: 300, q: 0.4, vol: 0.35, attack: 0.2 }); break;
    case 'door':
      noiseHit(t, 0.7, { f: 600, fTo: 1400, q: 0.5, vol: 0.2, attack: 0.1 }); break;
    case 'buzz':
      for (i = 0; i < 3; i++) tone(170, t + i * 0.3, 0.2, { vol: 0.2, type: 'square', filter: { f: 400 } }); break;
    case 'flatline':
      tone(980, t, 4.5, { vol: 0.18, type: 'sine', attack: 0.02 }); break;
    case 'birds':
      for (i = 0; i < 9; i++) { var s0 = t + i * 0.35 + Math.random() * 0.2; tone(2600 + Math.random() * 1200, s0, 0.12, { vol: 0.05, slide: 3800 + Math.random() * 800, pan: Math.random() * 2 - 1 }); } break;
    case 'siren':
      for (i = 0; i < 6; i++) { tone(760, t + i * 0.9, 0.45, { vol: 0.08, type: 'triangle' }); tone(620, t + i * 0.9 + 0.45, 0.45, { vol: 0.08, type: 'triangle' }); } break;
    case 'whisper':
      noiseHit(t, 1.2, { f: 1200 + Math.random() * 1500, q: 6, vol: 0.12, attack: 0.3, pan: arg != null ? arg : Math.random() * 2 - 1 });
      noiseHit(t + 0.3, 0.9, { f: 2400 + Math.random() * 800, q: 8, vol: 0.08, attack: 0.2, pan: arg != null ? arg : Math.random() * 2 - 1 }); break;
    case 'step':
      noiseHit(t, 0.06, { f: 220, q: 1.2, vol: 0.06 * (arg || 1) }); break;
    case 'heart':
      tone(58, t, 0.16, { vol: 0.35 * (arg || 1), type: 'sine', slide: 40 }); tone(52, t + 0.17, 0.2, { vol: 0.25 * (arg || 1), type: 'sine', slide: 36 }); break;
    case 'sparkle':
      for (i = 0; i < 5; i++) tone(1800 + Math.random() * 2400, t + i * 0.06, 0.25, { vol: 0.03, type: 'sine', pan: Math.random() * 2 - 1 }); break;
    case 'cough':
      for (i = 0; i < 3; i++) { noiseHit(t + i * 0.32, 0.18, { f: 900 + i * 80, q: 1.2, vol: 0.35, attack: 0.01 }); tone(160, t + i * 0.32, 0.12, { vol: 0.08, type: 'sawtooth', filter: { f: 600 } }); } break;
    case 'tv':
      noiseHit(t, 0.3, { f: 4000, q: 0.3, vol: 0.1 }); break;
  }
}

// ---- music sequencer (lo-fi loop that reacts to the body) ---------------------------
// chords: Fmaj7, Em7, Dm7, Cmaj7 (+9)
var CHORDS = [[53, 57, 60, 64, 67], [52, 55, 59, 62, 66], [50, 53, 57, 60, 64], [48, 52, 55, 59, 62]];
function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
function updateMusic() {
  if (!AU.ready) return;
  var c = AU.ctx, p = AU.p;
  var bpm = 78 * p.tempo, sixteenth = 60 / bpm / 4;
  while (AU.nextT < c.currentTime + 0.25) {
    var t = AU.nextT, s = AU.step % 16, bar = Math.floor(AU.step / 16);
    var ch = CHORDS[bar % 4], bus = AU.bgmFilter;
    var det = p.detune + (p.wob > 0 ? Math.sin(t * 1.3) * 40 * p.wob : 0);
    if (AU.music) {
      if (s === 0) { // pad + bass
        ch.slice(0, 4).forEach(function (n) {
          tone(midi(n), t, sixteenth * 16, { vol: 0.045, type: 'triangle', attack: 0.4, detune: det - 6, bus: bus });
          tone(midi(n), t, sixteenth * 16, { vol: 0.03, type: 'sawtooth', attack: 0.5, detune: det + 7, bus: bus, filter: { f: 900 + p.emp * 1500 } });
        });
        tone(midi(ch[0] - 12), t, sixteenth * 7, { vol: 0.16, type: 'sine', attack: 0.02, detune: det, bus: bus });
      }
      if (s === 10) tone(midi(ch[0] - 12 + 7), t, sixteenth * 5, { vol: 0.12, type: 'sine', attack: 0.02, detune: det, bus: bus });
      if (p.drums > 0.05) {
        if (s === 0 || s === 7 || s === 10) tone(110, t, 0.25, { vol: 0.32 * p.drums, slide: 40, bus: bus });
        if (s === 4 || s === 12) noiseHit(t, 0.18, { f: 1800, q: 0.7, vol: 0.13 * p.drums, bus: bus });
        if (s % 2 === 0 || (p.tempo > 1.08 && s % 1 === 0)) noiseHit(t, 0.04, { f: 8000, type: 'highpass', vol: (s % 4 === 2 ? 0.05 : 0.03) * p.drums, bus: bus });
      }
      // melody (sparse, lo-fi keys)
      if ((s === 2 || s === 6 || s === 9 || s === 14) && Math.random() < 0.55) {
        var n = ch[1 + Math.floor(Math.random() * 4)] + 12;
        tone(midi(n), t, sixteenth * 6, { vol: 0.05, type: 'triangle', detune: det, bus: bus, filter: { f: 2400 } });
      }
      // psychedelic arpeggio shimmer
      if (p.psy > 0.15 && s % 2 === 1) {
        var an = ch[(AU.step >> 1) % ch.length] + 24;
        tone(midi(an), t, sixteenth * 3, { vol: 0.03 * Math.min(1.5, p.psy), type: 'sine', detune: det + Math.sin(t * 3) * 30 * p.psy, bus: bus, pan: Math.sin(t * 2) });
      }
    }
    AU.nextT += sixteenth; AU.step++;
  }
}

// called every frame with body visuals and location
function updateAudio(dt, B, ctx) {
  if (!AU.ready) return;
  var c = AU.ctx, V = B ? B.vis : null, p = AU.p;
  if (V) {
    var sed = V.sed, psy = V.psy;
    p.tempo = damp(p.tempo, clamp(1 + V.stim * 0.12 - sed * 0.12 - V.dis * 0.1, 0.7, 1.25), 0.5, dt);
    p.detune = damp(p.detune, -sed * 60 - V.dis * 120 + V.stim * 20, 0.5, dt);
    p.wob = damp(p.wob, V.drunk * 0.6 + psy * 0.4 + V.dis * 0.5, 0.5, dt);
    p.psy = psy; p.emp = V.emp;
    p.drums = damp(p.drums, clamp(1 - V.dis * 0.8 - sed * 0.4, 0, 1), 0.5, dt);
    var lp = 7000 + V.emp * 6000 - sed * 5000 - V.dis * 3000 - (B.unconscious ? 6000 : 0) - V.nau * 2000;
    AU.bgmFilter.frequency.value = damp(AU.bgmFilter.frequency.value, clamp(lp, 300, 16000), 2, dt);
    AU.verbGain.gain.value = damp(AU.verbGain.gain.value, 0.2 + V.dis * 0.8 + psy * 0.35 + V.pa * 0.2, 1, dt);
    AU.tinG.gain.value = damp(AU.tinG.gain.value, clamp(V.dis * 0.008 + (B.danger / 100) * 0.012 + Math.max(0, V.drunk - 1) * 0.006, 0, 0.02), 1, dt);
    // heartbeat
    var hbVol = clamp((B.hr - 100) / 60, 0, 1) * 0.7 + V.anx * 0.3 + (B.danger > 0 ? 0.4 : 0);
    AU.hbT -= dt;
    if (hbVol > 0.08 && AU.hbT <= 0) { AU.hbT = 60 / Math.max(40, B.hr); sfx('heart', clamp(hbVol, 0, 1.2)); }
    // whispers
    AU.whT -= dt;
    if (V.del > 0.4 && AU.whT <= 0) { AU.whT = rnd(3, 9) / Math.min(2, V.del); sfx('whisper'); }
  }
  AU.roomG.gain.value = damp(AU.roomG.gain.value, ctx && ctx.outdoor ? 0.01 : 0.05, 1, dt);
  AU.cityG.gain.value = damp(AU.cityG.gain.value, ctx && ctx.outdoor ? 0.12 : 0.012, 1, dt);
  updateMusic();
}
