// ---- BGM（制作者が Suno で作った曲：bgm_long.mp3 / bgm_short.mp3） --------------------------
// audio タグで直接鳴らす（fetch は使わない）。Web Audio につなげられた時だけ、音量・フェード・汚染の加工をする。
// 読めなかった曲は、プログラム製の BGM（SONGS）に自動で切りかえる。
var MUS = {
  songs: {
    long: { file: 'bgm_long.mp3', vol: 1.0, els: [], cur: 0, bad: false, ok: false, why: '' },
    short: { file: 'bgm_short.mp3', vol: 0.74, els: [], cur: 0, bad: false, ok: false, why: '' }
  },
  loaded: false, want: null, scene: null, special: null, out: null, filt: null, duck: 1, duckT: 0,
  rate: 1, hiddenPaused: [], tickT: null, reported: {}
};
AUD.bgmVol = 0.7; AUD.sfxVol = 1;
function musicLoad() {
  if (MUS.loaded) return; MUS.loaded = true;
  ['long', 'short'].forEach(function (k) {
    var s = MUS.songs[k];
    for (var i = 0; i < 2; i++) {
      var a; try { a = new Audio(); } catch (e) { s.bad = true; s.why = 'audio タグが使えない'; return; }
      a.crossOrigin = 'anonymous'; a.preload = i === 0 ? 'auto' : 'none'; a.loop = false;
      try { a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; } catch (e) {}
      (function (a, s, i) {
        a.addEventListener('error', function () { musFail(s, 'エラー ' + (a.error ? 'code ' + a.error.code : '?')); });
        a.addEventListener('playing', function () { s.ok = true; if (s.bad) { s.bad = false; } s.waitT = 0; });
        a.addEventListener('canplaythrough', function () { s.ok = true; if (i === 0 && s.els[1] && s.els[1].preload === 'none') { s.els[1].preload = 'auto'; } });
      })(a, s, i);
      a.src = assetURL(s.file);
      a.g = null; a.tgt = 0; a.lvl = 0; a.offT = 0;
      s.els.push(a);
    }
  });
  musConnect();
  if (!MUS.tickT) MUS.tickT = setInterval(musTick, 200);
}
function musFail(s, why) {
  if (s.bad) return; s.bad = true; s.why = why;
  s.els.forEach(function (a) { try { a.pause(); } catch (e) {} });
  if (!MUS.reported[s.file]) {
    MUS.reported[s.file] = 1; BOOT_ERRORS.push('bgm:' + s.file + ':' + why);
    try { sysMsg('【診断】曲が読めなかった（' + s.file + '）。プログラムで作った BGM で鳴らします。'); } catch (e) {}
  }
}
// Web Audio につなぐ（ボリューム・フェード・こもり加工用）。つなげない時は audio タグの音量でがんばる。
function musConnect() {
  var c = AUD.ctx; if (!c || !MUS.loaded || MUS.out) return;
  try {
    MUS.filt = c.createBiquadFilter(); MUS.filt.type = 'lowpass'; MUS.filt.frequency.value = 20000; MUS.filt.Q.value = 0.6;
    MUS.out = c.createGain(); MUS.out.gain.value = 0;
    MUS.filt.connect(MUS.out); MUS.out.connect(AUD.master);
    ['long', 'short'].forEach(function (k) {
      MUS.songs[k].els.forEach(function (a) { var src = c.createMediaElementSource(a), g = c.createGain(); g.gain.value = 0; src.connect(g); g.connect(MUS.filt); a.g = g; });
    });
  } catch (e) { MUS.out = null; MUS.webaudio = false; return; }
  MUS.webaudio = true;
}
// 最初のタップで audio タグのロックを外す（iPhone は、タップの中で一度 play しておく必要がある）
function musUnlock() {
  musConnect();
  ['long', 'short'].forEach(function (k) {
    var s = MUS.songs[k]; if (s.bad) return;
    s.els.forEach(function (a) {
      if (!a.paused || a.unlocked) return;
      var p; try { p = a.play(); } catch (e) { return; }
      a.unlocked = true;
      if (p && p.then) p.then(function () { if (a.tgt <= 0 && a.lvl <= 0.001) a.pause(); }, function (err) { a.unlocked = false; if (err && err.name === 'NotSupportedError') musFail(s, '再生できない形式'); });
      else if (a.tgt <= 0) a.pause();
    });
  });
  musTick();
}
['touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { if (MUS.loaded && AUD.ctx) musUnlock(); }, true); });
// 場面の曲を決める
function bgmPlay(name) {
  MUS.special = null; MUS.scene = name;
  MUS.want = (name === 'title' || name === 'menu') ? 'short' : 'long';
  musTick();
}
// 専用の場面（ラジオなど）：プログラム製の BGM を鳴らし、曲は止めておく。終わったら bgmPlay で戻る
function bgmSpecial(name) { MUS.special = name; synthPlay(name); musTick(); }
function musUsable(k) { var s = MUS.songs[k]; return k && MUS.loaded && !s.bad && s.els.length === 2; }
function musPlayEl(a, s) {
  if (!a.paused) return;
  try { var p = a.play(); if (p && p.catch) p.catch(function (err) { if (err && err.name === 'NotSupportedError') musFail(s, '再生できない形式'); }); } catch (e) {}
}
function musTick() {
  var c = AUD.ctx, t = now() / 1000;
  var musicMode = !MUS.special && musUsable(MUS.want);
  // プログラム製 BGM：曲が使えない時と、専用の場面の時だけ
  var synthOn = !musicMode && AUD.bgmOn;
  if (!musicMode) { var sn = MUS.special || (MUS.scene ? MUS.scene : null); if (sn) synthPlay(sn); }
  if (AUD.bgmBus && c) AUD.bgmBus.gain.setTargetAtTime(synthOn ? 0.3 * AUD.bgmVol : 0, c.currentTime, 0.8);
  if (!musicMode && AUD.song && !synthOn) { MUS.synthOffT = (MUS.synthOffT || 0) + 0.2; if (MUS.synthOffT > 4) { AUD.song = null; AUD.nextSong = null; } } else MUS.synthOffT = 0;
  if (!MUS.loaded) return;
  // ボイスチャットで話している間は小さく
  var talking = typeof VOICE !== 'undefined' && VOICE.on && (VOICE.level > 0.06 || Object.keys(NET.peers).some(function (id) { return NET.peers[id].talking; }));
  if (talking) MUS.duckT = 1.2; else MUS.duckT -= 0.2;
  MUS.duck = MUS.duckT > 0 ? 0.45 : 1;
  if (MUS.out && c) MUS.out.gain.setTargetAtTime(AUD.bgmOn ? 0.34 * AUD.bgmVol * MUS.duck : 0, c.currentTime, 0.4);
  // 汚染：少し遅く・音程がゆれる・こもる（ファイルはそのまま）
  var st = AUD.stage || 0, over = typeof G !== 'undefined' && G.pol > 100 ? Math.min(1, (G.pol - 100) / 100) : 0;
  var rate = 1 - Math.min(0.1, st * 0.01) - over * 0.04;
  rate = Math.round(rate * 50) / 50; // 音切れ防止：速さは細かく変えない（0.02きざみ）
  if (MUS.filt && c) MUS.filt.frequency.setTargetAtTime(st < 2 ? 20000 : Math.max(700, 20000 * Math.pow(0.7, st - 1) * (1 - over * 0.5)), c.currentTime, 1.5);
  ['long', 'short'].forEach(function (k) {
    var s = MUS.songs[k], active = musicMode && MUS.want === k && AUD.bgmOn && !document.hidden;
    if (s.bad) return;
    var a = s.els[s.cur], b = s.els[1 - s.cur];
    // くり返し：終わる３秒前から、もう１つの audio を頭から鳴らして、ふわっと入れかえる
    if (active && a && !a.paused && isFinite(a.duration) && a.duration > 10 && (a.duration - a.currentTime) / Math.max(0.5, a.playbackRate) < 3.2) {
      try { b.currentTime = 0; } catch (e) {}
      s.cur = 1 - s.cur; a.tgt = 0; a.offT = t; a = s.els[s.cur]; b = s.els[1 - s.cur];
    }
    if (active) {
      a.tgt = s.vol;
      if (a.paused) { musPlayEl(a, s); if (!s.ok) { s.waitT = (s.waitT || 0) + 0.2; if (s.waitT > 25 && AUD.ctx && AUD.ctx.state === 'running' && a.unlocked) musFail(s, '時間内に読み込めなかった'); } }
    } else { if (a.tgt > 0) a.offT = t; a.tgt = 0; }
    s.els.forEach(function (e) {
      if (Math.abs(e.playbackRate - rate) > 0.005 && (!e._rt || t - e._rt > 4)) { e._rt = t; try { e.playbackRate = rate; } catch (er) {} }
      if (e.g && c) e.g.gain.setTargetAtTime(e.tgt, c.currentTime, e.tgt > 0 ? 0.8 : 0.7);
      e.lvl += ((e.tgt) - e.lvl) * 0.12; // 目安
      if (!e.g) { try { e.volume = clamp(e.lvl * (AUD.bgmOn ? AUD.bgmVol * 0.5 * MUS.duck : 0), 0, 1); } catch (er) {} }
      if (e.tgt === 0 && !e.paused && t - e.offT > 3.5) { try { e.pause(); } catch (er) {} }
    });
  });
}
function musStatus() {
  if (!MUS.loaded) return '準備中';
  var s = MUS.songs, f = function (k) { return s[k].bad ? '読めなかった（' + s[k].why + '）' : s[k].ok ? 'OK' : '読み込み中'; };
  return 'bgm_long ' + f('long') + '　/　bgm_short ' + f('short') + (MUS.webaudio === false ? '　（加工なし）' : '');
}
document.addEventListener('visibilitychange', function () {
  if (!MUS.loaded) return;
  if (document.hidden) { ['long', 'short'].forEach(function (k) { MUS.songs[k].els.forEach(function (a) { if (!a.paused) { try { a.pause(); } catch (e) {} } }); }); }
  else setTimeout(musTick, 50);
});
