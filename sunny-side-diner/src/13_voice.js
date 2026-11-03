// ---- voices: TTS selection, character profiles, subtitles sync, pico voice ----------
var VOICE = { ok: false, list: [], en: { f: null, m: null, any: null }, ja: { f: null, m: null, any: null }, speaking: false, token: 0, ready: false };
var VPROF = {
  default: { g: 'f', pitch: 1.0, rate: 1.0 },
  trucker: { g: 'm', pitch: 0.62, rate: 0.82 }, oldman: { g: 'm', pitch: 0.8, rate: 0.86 }, salesman: { g: 'm', pitch: 1.0, rate: 1.08 },
  mechanic: { g: 'm', pitch: 0.9, rate: 0.96 }, teen: { g: 'm', pitch: 1.15, rate: 1.1 }, cowboy: { g: 'm', pitch: 0.7, rate: 0.85 },
  girl: { g: 'f', pitch: 1.38, rate: 1.1 }, nurse: { g: 'f', pitch: 1.05, rate: 1.0 }, mom: { g: 'f', pitch: 1.1, rate: 1.02 }, lady: { g: 'f', pitch: 0.92, rate: 0.9 },
  waitress: { g: 'f', pitch: 1.15, rate: 1.0 }, kid: { g: 'f', pitch: 1.75, rate: 1.12 },
  manager: { g: 'm', pitch: 0.82, rate: 0.94, phone: 1 }, sunny: { g: 'f', pitch: 1.85, rate: 1.12, pico: 1 }, june: { g: 'f', pitch: 0.95, rate: 0.9 },
  odd: { g: 'm', pitch: 0.55, rate: 0.7 }, you: { g: 'm', pitch: 1.0, rate: 1.0 }
};
function initVoices() {
  var ss = window.speechSynthesis; if (!ss || typeof SpeechSynthesisUtterance === 'undefined') { VOICE.ok = false; VOICE.ready = true; return; }
  VOICE.ok = true;
  var pick = function () {
    var vs = []; try { vs = ss.getVoices() || []; } catch (e) {}
    if (!vs.length) return false;
    VOICE.list = vs; rankVoices(vs); VOICE.ready = true; return true;
  };
  if (!pick()) { try { ss.addEventListener ? ss.addEventListener('voiceschanged', pick) : (ss.onvoiceschanged = pick); } catch (e) {} setTimeout(function () { pick(); VOICE.ready = true; }, 2500); }
}
var FEMALE = /samantha|karen|moira|tessa|victoria|allison|ava|susan|zoe|kate|serena|fiona|nicky|female|joanna|salli|kimberly|jenny|aria|emma|libby|sonia|natasha|kyoko|o-ren|hattori|nanami|mizuki|sara|siri.*(voice 2|voice 4)/i;
var MALE = /alex|daniel|fred|tom|aaron|arthur|gordon|oliver|rishi|male|evan|nathan|guy|ryan|matthew|joey|otoya|ichiro|keita|siri.*(voice 1|voice 3)/i;
function vscore(v, lang) {
  var s = 0, n = v.name || '';
  if (!v.lang || v.lang.toLowerCase().indexOf(lang) !== 0) return -1;
  if (/enhanced|premium|neural|natural/i.test(n)) s += 120;
  if (/siri/i.test(n)) s += 90;
  if (/google/i.test(n)) s += 45;
  if (/microsoft.*online/i.test(n)) s += 70;
  if (lang === 'en' && /en[-_]us/i.test(v.lang)) s += 12;
  if (/compact|eloquence|novelty|bad news|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|organ|superstar|jester|albert|wobble|hysterical|deranged|bahh|good news|pipe/i.test(n)) s -= 200;
  if (v.localService) s += 5;
  return s;
}
function rankVoices(vs) {
  ['en', 'ja'].forEach(function (lang) {
    var best = { f: null, m: null, any: null }, bs = { f: -1e9, m: -1e9, any: -1e9 };
    vs.forEach(function (v) {
      var s = vscore(v, lang); if (s < 0 && s > -100) return; if (s <= -100) return;
      var g = FEMALE.test(v.name) ? 'f' : (MALE.test(v.name) ? 'm' : '');
      if (s > bs.any) { bs.any = s; best.any = v; }
      if (g && s > bs[g]) { bs[g] = s; best[g] = v; }
    });
    VOICE[lang] = best;
  });
}
function voiceFor(prof, lang) { var V = VOICE[lang]; return (V && (V[prof.g] || V.any)) || null; }
function stopVoice() { VOICE.token++; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} VOICE.speaking = false; picoStop(); if (VOICE.phoneLoop) { phoneLineStop(); } duckMusic(false); }
// speak a line; returns Promise resolved when finished (or estimated time if TTS unavailable)
function speak(line) {
  var mode = SAVE.settings.voiceMode, tok = ++VOICE.token;
  var prof = VPROF[line.voice || 'default'] || VPROF.default;
  var text = mode === 'JA' ? (line.jaSay || line.ja) : (line.sayEn || line.en);
  var rateMul = { SLOW: 0.86, NORMAL: 1, FAST: 1.16 }[SAVE.settings.voiceRate] || 1;
  var est = Math.max(1.2, (text || '').length / (mode === 'JA' ? 7.5 : 14) / rateMul);
  return new Promise(function (res) {
    var finished = false, done = function () { if (finished) return; finished = true; if (tok === VOICE.token) { VOICE.speaking = false; duckMusic(false); picoStop(); } res(); };
    if (prof.pico) picoStart(line.picoDark || 0, est);
    if (prof.phone) phoneLineStart();
    if (mode === 'OFF' || !VOICE.ok || !text) { setTimeout(done, est * 1000 * (mode === 'OFF' ? 0.9 : 1)); return; }
    try {
      var ss = window.speechSynthesis; ss.cancel();
      var parts = [text];
      if (line.odd && mode !== 'JA') { var w = text.split(' '); if (w.length > 3) { var cut = 1 + Math.floor(Math.random() * (w.length - 2)); parts = [w.slice(0, cut).join(' '), w.slice(cut).join(' ')]; } }
      var lang = mode === 'JA' ? 'ja' : 'en', v = voiceFor(prof, lang), offset = 0;
      VOICE.speaking = true; duckMusic(true);
      var speakPart = function (i) {
        if (tok !== VOICE.token) return done();
        if (i >= parts.length) return done();
        var u = new SpeechSynthesisUtterance(parts[i]); if (v) u.voice = v; u.lang = v ? v.lang : (lang === 'ja' ? 'ja-JP' : 'en-US');
        var pitch = prof.pitch * (line.pitch || 1), rate = prof.rate * rateMul * (line.rate || 1);
        if (line.odd) { rate *= i ? 0.78 : 1.06; pitch *= i ? 0.96 : 1; }
        u.pitch = clamp(pitch, 0.1, 2); u.rate = clamp(rate, 0.5, 1.6); u.volume = clamp(SAVE.settings.voice, 0, 1);
        var base = offset;
        u.onboundary = function (e) { if (lang === 'en' && e.charIndex != null) line.boundary = base + e.charIndex + (e.charLength || 4); };
        u.onend = function () { offset += parts[i].length + 1; if (i + 1 < parts.length) setTimeout(function () { speakPart(i + 1); }, line.odd ? 650 + Math.random() * 500 : 50); else done(); };
        u.onerror = function () { done(); };
        ss.speak(u);
      };
      speakPart(0);
      setTimeout(done, (est * 2.6 + 4) * 1000); // never hang
    } catch (e) { setTimeout(done, est * 1000); }
  });
}
// ---- Sunny's pico voice: little chirps, gets lower & distorted near the truth ----------
var PICO = { on: false, timer: 0, dark: 0 };
function picoStart(dark, dur) {
  if (!AUDIO.ok) return; picoStop(); PICO.on = true; PICO.dark = dark || 0; PICO.end = AUDIO.ctx.currentTime + Math.min(dur, 6);
  var step = function () {
    if (!PICO.on || AUDIO.ctx.currentTime > PICO.end) return;
    var c = AUDIO.ctx, t = c.currentTime, d = PICO.dark, f = (900 + Math.random() * 500) * (1 - d * 0.65);
    var o = c.createOscillator(); o.type = d > 0.5 ? 'sawtooth' : 'square';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.3 : 0.75), t + 0.07);
    var bp = filt('bandpass', 1800 * (1 - d * 0.5), 2.5), g = envG(t, 0.004, 0.05, 0.05, 0, 0.03);
    var out = g;
    if (d > 0.3) { var ws = c.createWaveShaper(); ws.curve = satCurve(1 + d * 10); g.connect(ws); out = ws; }
    o.connect(bp); bp.connect(g); out.connect(AUDIO.voice); o.start(t); o.stop(t + 0.14);
    PICO.timer = setTimeout(step, 70 + Math.random() * 70 + d * 60);
  };
  step();
}
function picoStop() { PICO.on = false; clearTimeout(PICO.timer); }
// ---- phone line: handset click + hiss/crackle around a phone voice ---------------------
function phoneLineStart() {
  if (!AUDIO.ok || VOICE.phoneLoop) return;
  var c = AUDIO.ctx, s = nz('white'), bp = filt('bandpass', 2400, 0.9), g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.025, c.currentTime, 0.1);
  s.connect(bp); bp.connect(g); g.connect(AUDIO.voice); s.start();
  VOICE.phoneLoop = { s: s, g: g, crackle: setInterval(function () { if (Math.random() < 0.5) sfx('pop', null, { vol: 0.25 }); }, 300) };
}
function phoneLineStop() { var p = VOICE.phoneLoop; if (!p) return; VOICE.phoneLoop = null; clearInterval(p.crackle); try { p.g.gain.setTargetAtTime(0.0001, AUDIO.ctx.currentTime, 0.1); p.s.stop(AUDIO.ctx.currentTime + 0.5); } catch (e) {} }
// ---- dialogue: subtitle + voice; resolves on tap (or auto after voice) ----------------
var TALK = { busy: false, token: 0 };
function say(who, en, ja, opt) {
  opt = opt || {};
  var tok = ++TALK.token; TALK.busy = true;
  var line = { who: who, en: en, ja: ja, voice: opt.voice, odd: opt.odd, pitch: opt.pitch, rate: opt.rate, cls: opt.cls, cps: opt.cps || (opt.odd ? 18 : 26), picoDark: opt.picoDark, jaSay: opt.jaSay, sayEn: opt.sayEn };
  return new Promise(function (res) {
    var spoken = false, closed = false;
    var finish = function () { if (closed) return; closed = true; if (tok === TALK.token) { TALK.busy = false; if (!opt.keep) subHide(); } res(); };
    line.onTap = function () { if (spoken || opt.tapSkip !== false) { stopVoice(); finish(); } };
    subShow(line);
    var p = opt.silent ? wait(Math.max(1.4, en.length / 16)) : speak(line);
    p.then(function () {
      spoken = true;
      if (tok !== TALK.token) return finish();
      SUBQ.shown = line.en.length; U.sub.querySelector('.l1').textContent = line.en;
      if (opt.auto !== false) setTimeout(finish, (opt.hold == null ? 0.9 : opt.hold) * 1000);
    });
  });
}
function talkCancel() { TALK.token++; TALK.busy = false; stopVoice(); subHide(); }
async function talk(lines) { for (var i = 0; i < lines.length; i++) { var L = lines[i]; if (typeof L === 'function') { L(); continue; } await say(L[0], L[1], L[2], L[3]); } }
