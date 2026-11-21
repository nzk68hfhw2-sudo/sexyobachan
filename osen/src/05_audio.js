// ---- 音（効果音はすべて Web Audio で合成。BGM の曲ファイルは 05b_music.js） ---------------------------------
var AUD = {
  ctx: null, master: null, bgmBus: null, sfxBus: null, comp: null,
  bgmOn: true, sfxOn: true, song: null, nextSong: null, songT: 0, step: 0, timer: null,
  stage: 0, over: 0, mood: 0, pulse: null, noiseBuf: null, started: false, lastStep: 0, reverse: false
};
function audioInit() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') try { AUD.ctx.resume(); } catch (e) {} return; }
  try {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var c = AUD.ctx = new AC();
    AUD.comp = c.createDynamicsCompressor(); AUD.comp.threshold.value = -18; AUD.comp.ratio.value = 6; AUD.comp.attack.value = 0.005; AUD.comp.release.value = 0.2;
    AUD.master = c.createGain(); AUD.master.gain.value = 0.85;
    AUD.bgmBus = c.createGain(); AUD.bgmBus.gain.value = 0;
    AUD.sfxBus = c.createGain(); AUD.sfxBus.gain.value = AUD.sfxOn ? 0.5 * AUD.sfxVol : 0;
    // 爆発・衝撃用：少し歪ませて「ドカーン」と太くする
    AUD.boomBus = c.createGain(); AUD.boomBus.gain.value = 1; var ws = c.createWaveShaper(), cv = new Float32Array(1024); for (var q = 0; q < 1024; q++) { var xq = q / 511.5 - 1; cv[q] = Math.tanh(xq * 2.4) / Math.tanh(2.4); } ws.curve = cv; ws.oversample = '2x';
    AUD.boomBus.connect(ws); ws.connect(AUD.sfxBus);
    AUD.bgmBus.connect(AUD.comp); AUD.sfxBus.connect(AUD.comp); AUD.comp.connect(AUD.master); AUD.master.connect(c.destination);
    // 25% pulse wave
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) { im[i] = 2 / (i * PI) * Math.sin(i * PI * 0.25); }
    AUD.pulse = c.createPeriodicWave(re, im);
    var re2 = new Float32Array(n), im2 = new Float32Array(n); // organ
    im2[1] = 1; im2[2] = 0.6; im2[3] = 0.35; im2[4] = 0.2; im2[6] = 0.15; im2[8] = 0.1;
    AUD.organ = c.createPeriodicWave(re2, im2);
    var len = c.sampleRate * 1, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    AUD.noiseBuf = buf;
    if (c.state === 'suspended') c.resume();
    AUD.started = true;
    AUD.timer = setInterval(bgmTick, 40);
    if (typeof musConnect === 'function') { musConnect(); setTimeout(musUnlock, 0); }
    // iOS: 一度だけ無音を鳴らしてロック解除
    var o = c.createOscillator(), g = c.createGain(); g.gain.value = 0.0001; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.05);
  } catch (e) { AUD.ctx = null; }
}
function audioSetBgm(on, vol) { AUD.bgmOn = on; if (vol != null) AUD.bgmVol = vol; if (typeof musTick === 'function') musTick(); }
function audioSetSfx(on, vol) { AUD.sfxOn = on; if (vol != null) AUD.sfxVol = vol; if (AUD.sfxBus) AUD.sfxBus.gain.setTargetAtTime(on ? 0.5 * AUD.sfxVol : 0, AUD.ctx.currentTime, 0.05); }
document.addEventListener('visibilitychange', function () {
  if (!AUD.ctx) return; try { if (document.hidden) AUD.ctx.suspend(); else AUD.ctx.resume(); } catch (e) {}
});

function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
var NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parseNote(t) { // "C#5" -> midi
  var m = /^([A-G])(#|b)?(-?\d)$/.exec(t); if (!m) return null;
  return 12 * (+m[3] + 1) + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function parseChord(t) { // "Am" "F" "G7" "Bdim" -> [midi notes around C3]
  var m = /^([A-G])(#|b)?(m|7|m7|M7|dim|sus)?$/.exec(t); var r = 48 + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  var q = m[3] || '', iv = q === 'm' ? [0, 3, 7] : q === '7' ? [0, 4, 7, 10] : q === 'm7' ? [0, 3, 7, 10] : q === 'M7' ? [0, 4, 7, 11] : q === 'dim' ? [0, 3, 6] : q === 'sus' ? [0, 5, 7] : [0, 4, 7];
  return iv.map(function (x) { return r + x; });
}
// ---- 曲（エリアごと） 8分音符単位。"-"=のばす "."=休み -----------------------------------
var SONGS = {
  title: { bpm: 112, lead: 'pulse', prog: 'C Am F G C Am Dm G', drum: 'pop',
    mel: 'E5 G5 C6 - B5 G5 E5 - A5 - G5 E5 F5 - E5 D5 C5 E5 G5 A5 G5 - E5 . F5 E5 D5 C5 D5 - - . E5 G5 C6 - B5 G5 E5 - A5 - G5 E5 F5 - E5 D5 C5 D5 E5 C5 D5 - G4 . C5 - - - . . . .' },
  eki: { bpm: 126, lead: 'square', prog: 'F G Em Am F G C C', drum: 'pop',
    mel: 'C5 . C5 D5 E5 . G5 . F5 E5 D5 . E5 - - . C5 . C5 D5 E5 . G5 . A5 G5 E5 . D5 - - . F5 . F5 G5 A5 . F5 . G5 . E5 . C5 - . . D5 E5 F5 E5 D5 C5 B4 C5 C5 - - - . . . .' },
  shoten: { bpm: 138, lead: 'saw', prog: 'C C7 F Fm C G C G', drum: 'samba',
    mel: 'G4 C5 E5 G5 . E5 G5 . A5 G5 E5 C5 D5 - . . G4 C5 E5 G5 . E5 G5 . A5 Bb5 A5 F5 G5 - . . E5 . G5 . C6 - A5 . G5 E5 C5 E5 D5 - . . C5 D5 E5 F5 G5 A5 B5 C6 - . G5 . C6 - . .' },
  danchi: { bpm: 92, lead: 'organ', prog: 'Am F C G Am F E E', drum: 'slow',
    mel: 'A4 - C5 - E5 - D5 C5 C5 - - . A4 . . . F4 - A4 - C5 - B4 A4 G4 - - - . . . . A4 - C5 - E5 - A5 - G5 - E5 - D5 C5 B4 . A4 - - - G#4 - B4 - E5 - - - . . . .' },
  koen: { bpm: 118, lead: 'tri', prog: 'G Em C D G Em Am D', drum: 'pop',
    mel: 'D5 G5 G5 A5 B5 . G5 . E5 G5 E5 D5 B4 - . . C5 E5 E5 F#5 G5 . E5 . D5 . F#5 . A5 - . . B5 - A5 G5 A5 - G5 E5 D5 - B4 . D5 - . . C5 B4 A4 G4 A4 - D5 - G4 - - - . . . .' },
  kawa: { bpm: 84, lead: 'tri', prog: 'FM7 Em7 Dm7 CM7 FM7 Em7 Dm7 G', drum: 'slow',
    mel: 'A5 - G5 - E5 - C5 - D5 - - . E5 - . . G5 - F5 - D5 - B4 - C5 - - - . . . . A5 - G5 - E5 - G5 - C6 - B5 - A5 - G5 - F5 - E5 - D5 - E5 - D5 - - - . . . .' },
  akichi: { bpm: 100, lead: 'pulse', prog: 'Cm Ab Bb Cm Cm Ab G G', drum: 'odd',
    mel: 'C5 . Eb5 . G5 . F#5 G5 . . C6 . Bb5 Ab5 G5 . Eb5 . F5 . G5 . Ab5 . G5 F5 Eb5 D5 C5 - . . C5 C5 . C5 Eb5 . . G5 F#5 . F5 . Eb5 . D5 . C5 . . . G4 . Ab4 . B4 . C5 - - - . . . .' },
  jinja: { bpm: 76, lead: 'organ', prog: 'Dm Dm C C Bb Bb A A', drum: 'slow',
    mel: 'D5 - - F5 G5 - A5 - G5 - F5 - D5 - - - C5 - - D5 F5 - G5 - A5 - - - . . . . D6 - C6 - A5 - G5 - A5 - G5 - F5 - D5 - F5 - - E5 D5 - C5 - D5 - - - . . . .' },
  nai: { bpm: 70, lead: 'tri', prog: 'CM7 CM7 Bdim Bdim AM7 AM7 G G', drum: 'none',
    mel: 'E5 - - - B5 - - - . . . . G5 - - - D5 - - - . . . . F#5 - - - C#6 - - - . . . . B4 - - - - - - - . . . . . . . . . . . .' }
};
(function prep() {
  for (var k in SONGS) {
    var s = SONGS[k];
    s.notes = s.mel.split(/\s+/).map(function (t) { return t === '-' ? -1 : t === '.' ? -2 : parseNote(t); });
    s.chords = s.prog.split(' ').map(parseChord);
  }
})();
function synthPlay(name) { var s = SONGS[name] || SONGS.eki; if (s && AUD.song !== s && AUD.nextSong !== s) { AUD.nextSong = s; } }
function _osc(type, f, t, dur, vol, bus, opt) {
  var c = AUD.ctx; opt = opt || {};
  var o = c.createOscillator(), g = c.createGain();
  if (type === 'pulse') o.setPeriodicWave(AUD.pulse); else if (type === 'organ') o.setPeriodicWave(AUD.organ); else o.type = type === 'saw' ? 'sawtooth' : type === 'tri' ? 'triangle' : type;
  o.frequency.setValueAtTime(f, t);
  if (opt.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.slide), t + dur);
  if (opt.vib) { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = opt.vibF || 5.5; lg.gain.value = f * opt.vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
  if (opt.detune) o.detune.setValueAtTime(opt.detune, t);
  var a = opt.a || 0.008, r = opt.r || 0.06;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a, dur - r)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  var node = o;
  if (opt.lp) { var f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = opt.lp; f2.Q.value = opt.q || 1; o.connect(f2); node = f2; }
  node.connect(g); g.connect(bus || AUD.sfxBus);
  o.start(t); o.stop(t + dur + 0.02);
  return o;
}
// 爆発（size 0.5〜1.8）：低いドン＋バリバリ＋ゴロゴロの余韻
function _boom(t, size, pitch) {
  var c = AUD.ctx, B = AUD.boomBus || AUD.sfxBus, k = Math.pow(2, (pitch || 0) / 24);
  _osc('sine', 95 * k, t, 0.9 + size * 0.5, 0.42 * Math.min(1.3, size), B, { slide: 26, a: 0.003, r: 0.7 });
  _osc('sine', 190 * k, t, 0.14, 0.3, B, { slide: 45, a: 0.002, r: 0.1 });
  _osc('triangle', 60 * k, t + 0.02, 0.5 + size * 0.4, 0.22, B, { slide: 22, r: 0.4 });
  var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AUD.noiseBuf; s.loop = true; f.type = 'lowpass'; f.Q.value = 0.8;
  f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(160, t + 0.7 + size * 0.4);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.38 * Math.min(1.3, size), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0 + size * 0.6);
  s.connect(f); f.connect(g); g.connect(B); s.start(t); s.stop(t + 1.8 + size);
  _noise(t, 0.2, 0.14, 2800, B);
  _noise(t + 0.12, 1.4 + size, 0.12 * size, 0, B, 140);
  for (var i = 0; i < 5 + size * 4; i++) _noise(t + 0.08 + Math.random() * (0.5 + size * 0.4), 0.03, 0.05 + Math.random() * 0.05, 1800, B);
}
// 衝撃（当たった・ぶつかった）：パンチのある低い音
function _punch(t, size, pitch) {
  var B = AUD.boomBus || AUD.sfxBus, k = Math.pow(2, (pitch || 0) / 24);
  _osc('sine', 160 * k, t, 0.16 + size * 0.1, 0.32 * size, B, { slide: 42, a: 0.002, r: 0.12 });
  _noise(t, 0.07, 0.2 * size, 0, B, 2400); _noise(t, 0.25 + size * 0.15, 0.08 * size, 0, B, 380);
}
function _noise(t, dur, vol, hp, bus, lp) {
  var c = AUD.ctx, s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = AUD.noiseBuf; f.type = lp ? 'lowpass' : 'highpass'; f.frequency.value = lp || hp || 1000;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus || AUD.sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function bgmTick() {
  var c = AUD.ctx; if (!c || c.state !== 'running') return;
  if (!AUD.song) { AUD.song = AUD.nextSong; AUD.nextSong = null; AUD.step = 0; AUD.songT = c.currentTime + 0.1; }
  var s = AUD.song; if (!s) return;
  var st = AUD.stage, bpm = s.bpm * (st >= 3 ? 1 + 0.06 * Math.sin(c.currentTime * 0.7) : 1) * (st >= 8 ? 0.8 : 1);
  var spb = 60 / bpm / 2; // 8th note
  while (AUD.songT < c.currentTime + 0.25) {
    var t = AUD.songT, i = AUD.step, N = s.notes.length;
    if (i % N === 0 && AUD.nextSong && i > 0) { AUD.song = s = AUD.nextSong; AUD.nextSong = null; AUD.step = i = 0; N = s.notes.length; }
    var bus = AUD.bgmBus, ni = i % N;
    if (AUD.reverse && Math.floor(i / N) % 2 === 1) ni = N - 1 - ni;
    if (st >= 5 && Math.floor(i / 8) % 4 === 3) ni = (Math.floor(ni / 8) * 8) + (7 - ni % 8); // 逆再生っぽく
    var tr = (st >= 2 ? (Math.sin(c.currentTime * 0.13) > 0.7 ? -1 : 0) : 0) + (st >= 8 ? -5 : 0);
    var n = s.notes[ni];
    if (n > 0) {
      var len = 1; for (var j = ni + 1; j < N && s.notes[j] === -1; j++) len++;
      if (st >= 3 && Math.random() < 0.07 + st * 0.01) n += pick([-1, 1, 6, -5]);
      var lt = s.lead, vib = st >= 1 ? 0.006 + st * 0.004 : 0.004;
      _osc(lt, mtof(n + tr), t, spb * len * 0.95, lt === 'saw' ? 0.11 : lt === 'tri' ? 0.22 : 0.12, bus, { vib: vib, lp: lt === 'saw' ? 2400 : 5000, detune: st >= 2 ? Math.sin(t * 2) * 18 * st : 0 });
      if (st >= 4) _osc('square', mtof(n + tr + 6), t, spb * len * 0.9, 0.035, bus, { lp: 1800 });
      if (st >= 6) _osc('pulse', mtof(n + tr + 12), t + spb * 0.5, spb * 0.5, 0.04, bus);
    }
    var bar = Math.floor(ni / 8) % s.chords.length, ch = s.chords[bar], b8 = ni % 8;
    // bass
    if (b8 % 2 === 0) _osc('triangle', mtof(ch[0] - 12 + tr + (b8 === 4 ? 7 : 0)), t, spb * 1.6, 0.26, bus, { lp: 900 });
    // chord arpeggio / pad
    if (s.drum === 'slow' || s.drum === 'none') { if (b8 === 0) ch.forEach(function (m) { _osc('triangle', mtof(m + 12 + tr), t, spb * 7.5, 0.05, bus, { a: 0.3, r: 0.6 }); }); }
    else _osc('square', mtof(ch[b8 % ch.length] + 12 + tr), t, spb * 0.45, 0.035, bus, { lp: 2200 });
    // drums
    var d = s.drum;
    if (d === 'pop' || d === 'samba' || d === 'odd') {
      if (b8 === 0 || b8 === 4 || (d === 'samba' && b8 === 3) || (d === 'odd' && b8 === 5)) _osc('sine', 150, t, 0.16, 0.5, bus, { slide: 40, a: 0.002, r: 0.1 });
      if (b8 === 2 || b8 === 6) _noise(t, 0.12, 0.18, 1500, bus);
      _noise(t, 0.03, b8 % 2 ? 0.05 : 0.08, 7000, bus);
    } else if (d === 'slow') {
      if (b8 === 0) _osc('sine', 120, t, 0.25, 0.35, bus, { slide: 40, a: 0.002, r: 0.15 });
      if (b8 === 4) _noise(t, 0.2, 0.08, 2500, bus);
    }
    AUD.songT += spb; AUD.step++;
  }
}
// ---- 効果音 ---------------------------------------------------------------------
function sfx(name, p) {
  var c = AUD.ctx; if (!c || !AUD.sfxOn || c.state !== 'running') return;
  var t = c.currentTime + 0.01, i;
  p = p || 0;
  switch (name) {
    case 'step': _noise(t, 0.06, 0.09 + Math.random() * 0.03, 0, null, (500 + Math.random() * 400) * Math.pow(2, p / 12)); _osc('sine', (90 + Math.random() * 20) * Math.pow(2, p / 12), t, 0.05, 0.08); break;
    case 'stepWater': _noise(t, 0.15, 0.08, 0, null, 1600); break;
    case 'stepWood': _osc('triangle', 220 + Math.random() * 40, t, 0.05, 0.1, null, { slide: 120 }); break;
    case 'jump': _osc('square', 300 * Math.pow(2, p / 12), t, 0.15, 0.08, null, { slide: 700 * Math.pow(2, p / 12), lp: 3000 }); break;
    case 'land': _noise(t, 0.12, 0.12, 0, null, 400); break;
    case 'touch': _osc('square', 880, t, 0.06, 0.1, null, { lp: 4000 }); _osc('square', 1320, t + 0.06, 0.09, 0.1, null, { lp: 4000 }); break;
    case 'wa': [0, 4, 7, 12, 16, 19, 24].forEach(function (m, k) { _osc('triangle', mtof(72 + m + p), t + k * 0.045, 0.25, 0.09); }); _osc('sine', 2093, t + 0.32, 0.4, 0.05, null, { vib: 0.02, vibF: 12 }); break;
    case 'pop': _osc('sine', 400 + Math.random() * 300, t, 0.1, 0.18, null, { slide: 1400 }); break;
    case 'boing': _osc('sine', 180, t, 0.4, 0.2, null, { vib: 0.25, vibF: 14 }); break;
    case 'whoosh': _noise(t, 0.5, 0.12, 0, null, 900); break;
    case 'chime': [0, 7, 12].forEach(function (m, k) { _osc('sine', mtof(84 + m), t + k * 0.12, 0.8, 0.08, null, { r: 0.6 }); }); break;
    case 'down': _osc('square', 900, t, 0.6, 0.07, null, { slide: 80, lp: 2000 }); break;
    case 'up': _osc('square', 120, t, 0.6, 0.07, null, { slide: 1200, lp: 2000 }); break;
    case 'bell': [1, 2.76, 5.4].forEach(function (h, k) { _osc('sine', 330 * h, t, 2.2 - k * 0.5, 0.12 / (k + 1), null, { r: 1.5 }); }); break;
    case 'clean': for (i = 0; i < 6; i++) _osc('sine', mtof(96 - i * 3), t + i * 0.06, 0.3, 0.06); break;
    case 'coin': _osc('square', 988, t, 0.08, 0.08); _osc('square', 1319, t + 0.08, 0.3, 0.08, null, { r: 0.2 }); break;
    case 'babble': _osc('square', 300 + p * 7 % 240, t, 0.045, 0.035, null, { lp: 1600 }); break;
    case 'zukan': [0, 4, 7, 12, 7, 12, 16].forEach(function (m, k) { _osc('pulse', mtof(76 + m), t + k * 0.08, 0.12, 0.06); }); break;
    case 'stage': [0, 3, 6, 9, 12, 15].forEach(function (m, k) { _osc('saw', mtof(55 + m), t + k * 0.1, 0.35, 0.05, null, { lp: 1500 }); }); break;
    case 'warp': _osc('sine', 200, t, 1.0, 0.12, null, { slide: 2000, vib: 0.1, vibF: 20 }); break;
    case 'grow': _osc('triangle', 80, t, 0.8, 0.15, null, { slide: 400 }); break;
    case 'splash': _noise(t, 0.4, 0.15, 0, null, 2500); break;
    case 'sky': _osc('triangle', mtof(60), t, 1.2, 0.05, null, { a: 0.3, r: 0.8 }); _osc('triangle', mtof(67), t, 1.2, 0.05, null, { a: 0.3, r: 0.8 }); _osc('triangle', mtof(76), t, 1.2, 0.05, null, { a: 0.3, r: 0.8 }); break;
    case 'error': _osc('square', 220, t, 0.12, 0.06); _osc('square', 180, t + 0.13, 0.2, 0.06); break;
    case 'click': _osc('square', 1200, t, 0.03, 0.05); break;
    case 'meow': _osc('sawtooth', 700, t, 0.35, 0.05, null, { slide: 500, lp: 1800, vib: 0.03 }); break;
    case 'crow': _noise(t, 0.25, 0.08, 0, null, 1200); _osc('sawtooth', 500, t, 0.25, 0.05, null, { slide: 350, lp: 1200 }); break;
    case 'quack': _osc('sawtooth', 400, t, 0.15, 0.06, null, { slide: 300, lp: 900, q: 6 }); break;
    case 'uiClick': _osc('square', 1800, t, 0.025, 0.04, null, { lp: 5000 }); _osc('square', 900, t + 0.02, 0.03, 0.03, null, { lp: 3000 }); break;
    case 'uiSlot': _osc('triangle', 660, t, 0.05, 0.08); _osc('triangle', 990, t + 0.04, 0.06, 0.06); break;
    case 'uiOpen': _noise(t, 0.12, 0.05, 0, null, 2200); _osc('square', 392, t, 0.07, 0.05, null, { lp: 2000 }); _osc('square', 587, t + 0.06, 0.1, 0.05, null, { lp: 2000 }); break;
    case 'uiClose': _osc('square', 587, t, 0.06, 0.05, null, { lp: 2000 }); _osc('square', 392, t + 0.05, 0.08, 0.05, null, { lp: 2000 }); break;
    case 'uiLogin': [0, 4, 7, 12].forEach(function (m, k) { _osc('square', mtof(67 + m), t + k * 0.07, 0.12, 0.05, null, { lp: 3000 }); }); _osc('triangle', mtof(91), t + 0.3, 0.5, 0.05); break;
    case 'sysMsg': _osc('sine', 1320, t, 0.12, 0.05); _osc('sine', 1760, t + 0.07, 0.18, 0.04); break;
    case 'pickup': [0, 5, 9].forEach(function (m, k) { _osc('square', mtof(76 + m), t + k * 0.045, 0.06, 0.06, null, { lp: 4000 }); }); break;
    case 'put': _noise(t, 0.08, 0.1, 0, null, 700); _osc('sine', 160, t, 0.08, 0.12, null, { slide: 90 }); break;
    case 'throw': _noise(t, 0.25, 0.1, 0, null, 1800); _osc('triangle', 500, t, 0.2, 0.05, null, { slide: 200 }); break;
    case 'rotate': _osc('square', 700, t, 0.05, 0.04, null, { lp: 3000 }); _osc('square', 900, t + 0.05, 0.05, 0.04, null, { lp: 3000 }); break;
    case 'bagIn': _osc('square', 880, t, 0.05, 0.05, null, { lp: 3000 }); _osc('square', 660, t + 0.05, 0.05, 0.05, null, { lp: 3000 }); _noise(t + 0.08, 0.06, 0.05, 0, null, 1500); break;
    case 'combine': [0, 4, 7, 11, 14, 19].forEach(function (m, k) { _osc('triangle', mtof(72 + m), t + k * 0.06, 0.4, 0.07); }); _osc('square', mtof(96), t + 0.4, 0.3, 0.03, null, { vib: 0.02, vibF: 10 }); break;
    case 'thud': _osc('sine', 140 - p * 5, t, 0.12, Math.min(0.2, 0.05 + p * 0.015), null, { slide: 60 }); _noise(t, 0.06, Math.min(0.12, 0.03 + p * 0.01), 0, null, 900); break;
    case 'eat': for (i = 0; i < 3; i++) _noise(t + i * 0.12, 0.06, 0.08, 0, null, 2500); break;
    case 'chat': _osc('square', 1046, t, 0.04, 0.04, null, { lp: 3000 }); _osc('square', 1318, t + 0.05, 0.05, 0.04, null, { lp: 3000 }); break;
    case 'hit_glass': _osc('sine', 2200 * Math.pow(2, p / 12), t, 0.12, 0.06, null, { slide: 1500 }); _noise(t, 0.08, 0.09, 3000); break;
    case 'hit_wood': _punch(t, 0.7, p); _noise(t, 0.08, 0.12, 0, null, 1400); break;
    case 'hit_metal': _punch(t, 0.6, p); [1, 2.76].forEach(function (h, k) { _osc('sine', 420 * h * Math.pow(2, p / 12), t, 0.25 - k * 0.08, 0.05 / (k + 1), null, { r: 0.2 }); }); break;
    case 'hit_concrete': _punch(t, 0.8, p); _noise(t, 0.1, 0.1, 0, null, 900); break;
    case 'hit_plant': _noise(t, 0.15, 0.1, 0, null, 2200); _osc('triangle', 200, t, 0.08, 0.08, null, { slide: 120 }); break;
    case 'hit_paper': _noise(t, 0.06, 0.08, 2000); break;
    case 'hitHeavy': _punch(t, 0.9, p); break;
    case 'brk_glass': _punch(t, 0.7, p); _noise(t, 0.35, 0.14, 2500); for (i = 0; i < 6; i++) _osc('sine', (1800 + Math.random() * 3000) * Math.pow(2, p / 12), t + i * 0.035 + Math.random() * 0.03, 0.18, 0.04, null, { r: 0.15 }); break;
    case 'brk_wood': _punch(t, 1.0, p); _noise(t, 0.12, 0.18, 0, null, 1600); _noise(t + 0.06, 0.25, 0.1, 0, null, 700); break;
    case 'brk_metal': _punch(t, 1.1, p); [1, 2.76, 5.4, 8.9].forEach(function (h, k) { _osc('sine', 260 * h * Math.pow(2, p / 12), t, 0.7 - k * 0.12, 0.06 / (k + 1), null, { r: 0.5 }); }); _osc('saw', 180, t + 0.05, 0.6, 0.04, null, { slide: 70, lp: 900 }); break;
    case 'brk_concrete': _boom(t, 0.9, -6 + p * 0.5); _noise(t + 0.1, 0.4, 0.08, 2000); break;
    case 'brk_plant': _punch(t, 0.8, p); _noise(t, 0.4, 0.13, 0, null, 2600); break;
    case 'brk_paper': _noise(t, 0.2, 0.12, 1500); _osc('sine', 300, t, 0.1, 0.06, null, { slide: 600 }); break;
    case 'crack': _noise(t, 0.1, 0.14, 0, null, 2400); _osc('square', 220 * Math.pow(2, (p || 0) / 12), t, 0.06, 0.05, null, { lp: 1500, slide: 110 }); break;
    case 'crumble': _boom(t, 1.0, -10 + (p || 0)); break;
    case 'rumble': _noise(t, 1.8, 0.14, 0, AUD.boomBus, 180); _osc('sine', 42, t, 1.6, 0.2, AUD.boomBus, { a: 0.15, r: 1.1, vib: 0.1, vibF: 7 }); break;
    case 'thudBig': _punch(t, 1.2, -4); _noise(t + 0.05, 0.5, 0.08, 0, AUD.boomBus, 300); break;
    case 'tackle': _noise(t, 0.3, 0.12, 0, null, 1400); _osc('square', 180, t, 0.12, 0.05, null, { slide: 90, lp: 900 }); break;
    case 'spill': for (i = 0; i < 7; i++) _osc('sine', 900 + Math.random() * 1500, t + i * 0.05 + Math.random() * 0.04, 0.08, 0.03); break;
    case 'pon': _osc('sine', 380, t, 0.14, 0.14, null, { slide: 1100 }); _osc('triangle', 1760, t + 0.1, 0.25, 0.04, null, { r: 0.2 }); break;
    case 'comboUp': [0, 4, 7, 12].forEach(function (m, k) { _osc('square', mtof(72 + p + m), t + k * 0.04, 0.09, 0.035, null, { lp: 3500 }); }); break;
    case 'npcFly': _osc('sine', 300, t, 0.35, 0.1, null, { slide: 900, vib: 0.08, vibF: 12 }); _osc('sine', 110, t, 0.12, 0.16, null, { slide: 60 }); _noise(t, 0.08, 0.1, 0, null, 1500); break;
    case 'npcLand': _punch(t, 0.5, 6); _osc('sine', 160, t, 0.18, 0.08, null, { vib: 0.3, vibF: 18, slide: 90 }); break;
    case 'snap': _noise(t, 0.05, 0.12, 4000); _osc('sine', 2400, t, 0.06, 0.03); break;
    case 'clap': for (i = 0; i < 3; i++) _noise(t + i * 0.13, 0.04, 0.07, 1800); break;
    case 'gunPistol': _punch(t, 0.45, 14); _osc('square', 900 * Math.pow(2, p / 12), t, 0.06, 0.05, null, { slide: 220, lp: 2600 }); _noise(t, 0.05, 0.08, 0, null, 3000); break;
    case 'gunMg': _osc('square', 600 * Math.pow(2, p / 12), t, 0.04, 0.035, null, { slide: 200, lp: 2000 }); _noise(t, 0.03, 0.05, 0, null, 2200); break;
    case 'gunShot': _punch(t, 1.0, 4); _noise(t, 0.3, 0.18, 0, null, 1600); break;
    case 'gunRocket': _noise(t, 0.6, 0.12, 0, null, 900); _punch(t, 0.6, 8); _osc('saw', 120, t, 0.35, 0.04, null, { slide: 260, lp: 700 }); break;
    case 'gunPoi': _osc('sine', 300, t, 0.12, 0.12, null, { slide: 600 }); _osc('sine', 600, t + 0.05, 0.1, 0.05, null, { slide: 900 }); break;
    case 'gunBeam': _osc('sine', 1200 * Math.pow(2, p / 24), t, 0.14, 0.035, null, { vib: 0.05, vibF: 30 }); _osc('saw', 300, t, 0.14, 0.02, null, { lp: 1500 }); break;
    case 'gunAir': _noise(t, 0.4, 0.15, 0, null, 600); _osc('sine', 90, t, 0.3, 0.15, null, { slide: 40 }); break;
    case 'boom': _boom(t, clamp(-(p || -4) / 5, 0.6, 1.8), 0); break;
    case 'crash': _punch(t, 1.1, 0); _noise(t, 0.4, 0.14, 1500); for (i = 0; i < 5; i++) _osc('sine', 1500 + Math.random() * 3000, t + 0.02 + i * 0.03, 0.12, 0.03, null, { r: 0.1 }); _osc('saw', 220, t, 0.25, 0.05, null, { slide: 90, lp: 900 }); break;
    case 'train': _osc('square', 660, t, 0.6, 0.04, null, { lp: 1500 }); _osc('square', 784, t, 0.6, 0.04, null, { lp: 1500 }); break;
  }
}
