// ---- ボイスチャット（近くの人とだけ。WebRTC で端末どうし直接つなぐ。つなぎ役は Firebase） ----------------
// 声は Firebase を通らない（端末どうし直接）。声の検閲はできないので、最初に注意を出す。
var VOICE = { on: false, stream: null, pcs: {}, t: 0, near: 25, level: 0, an: null };
function voiceIce() { return [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }].concat(VOICE_TURN || []); }
function voiceToggle() {
  if (VOICE.on) { voiceStop(); return; }
  if (!NET.on) { sysMsg('ボイスチャットは、同時プレイにつながっている時だけ使えます。'); sfx('error'); return; }
  if (!PLAYER.voiceOk) { openVoiceConfirm(); return; }
  voiceStart();
}
function openVoiceConfirm() {
  openWin('vconf', 'ボイスチャット', 'sound', function (bd) {
    el('div', 'desc', bd, cnHTML('マイクを使って、近く（だいたい２５ｍ以内）にいる人と声で話せます。\n◆【大事】話す相手も「ボイス」をONにして、マイクを「許可」している時だけ　声がつながります（おたがいの許可が必要）。\n◆声は　そのまま相手に届きます。検閲はできません。\n◆本名・住所・学校・電話番号など、個人情報は話さないで下さい。\n◆いやな人は　⚙設定→「まわりの人」で　見えなくする（声も消えます）。\n◆イヤホンを使うと、音がハウリングしにくくなります。\n◆iPhone では、ボイスチャット中はゲームの音が小さくなる事があります。').replace(/\n/g, '<br>'));
    var r = el('div', 'row2', bd);
    mbtn(r, 'はじめる（マイクを使う）', function () { PLAYER.voiceOk = true; saveGame(); closeWin('vconf'); voiceStart(); }, 'gold', 'sound');
    mbtn(r, 'やめる', function () { closeWin('vconf'); });
  }, { w: 360, theme: 'stone' });
}
function voiceStart() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { sysMsg('この環境ではマイクが使えません。'); return; }
  audioInit();
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (s) {
    VOICE.stream = s; VOICE.on = true; voiceMeter(s);
    sysMsg('ボイスチャット：ON。相手もボイスONの時だけ話せます。'); logMsg('sys', '声は、おたがいに「ボイス」をONにしてマイクを許可している人どうしだけ　つながります。名前の下に「◎ボイス」と出ている人と話せます。'); sfx('uiOpen'); writeMe(true); voiceSlot();
  }, function (e) { sysMsg('マイクを使えませんでした（' + (e && e.name || '') + '）。設定でマイクを許可して下さい。'); sfx('error'); });
}
function voiceStop() {
  Object.keys(VOICE.pcs).forEach(function (id) { voiceHang(id, true); });
  if (VOICE.stream) VOICE.stream.getTracks().forEach(function (t) { t.stop(); });
  VOICE.stream = null; VOICE.on = false; VOICE.level = 0;
  sysMsg('ボイスチャット：OFF'); sfx('uiClose'); writeMe(true); voiceSlot();
}
function voiceSlot() { var s = SLOTS.filter(function (x) { return x.icon === 'sound'; })[0]; if (s && s.el) { s.el.style.boxShadow = VOICE.on ? '0 0 8px #40ff60 inset' : ''; s.el.querySelector('.l').innerHTML = cnHTML(VOICE.on ? 'ボイスON' : 'ボイス'); } }
function voiceMeter(s) {
  try { var ac = AUD.ctx; if (!ac) return; var src = ac.createMediaStreamSource(s), an = ac.createAnalyser(); an.fftSize = 256; src.connect(an); VOICE.an = an; VOICE.buf = new Uint8Array(an.fftSize); } catch (e) {}
}
function levelOf(an, buf) { if (!an) return 0; an.getByteTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128)); return m / 128; }
// ---- つなぐ ----
function voiceSend(k, to, d) { d = d || {}; d.to = to; if (NET.on) NET.T.push('rooms/' + NET.room + '/e', { k: k, by: NET.pid, t: NET.T.now(), d: d }); }
function voicePC(id) {
  var pc = new RTCPeerConnection({ iceServers: voiceIce() });
  var o = VOICE.pcs[id] = { pc: pc, q: [], gain: null, an: null, buf: null, level: 0, el: null, born: Date.now() };
  if (VOICE.stream) VOICE.stream.getTracks().forEach(function (t) { pc.addTrack(t, VOICE.stream); });
  pc.onicecandidate = function (e) { if (e.candidate) voiceSend('vi', id, { c: JSON.stringify(e.candidate) }); };
  pc.ontrack = function (e) {
    var st = e.streams[0]; if (!st || o.gain) return;
    // Chrome は要素につないでおかないと音が流れないため、消音の audio にもつなぐ
    var a = document.createElement('audio'); a.muted = true; a.autoplay = true; a.setAttribute('playsinline', ''); a.srcObject = st; o.el = a; try { a.play().catch(function () {}); } catch (er) {}
    try {
      var ac = AUD.ctx, src = ac.createMediaStreamSource(st), g = ac.createGain(), an = ac.createAnalyser(); an.fftSize = 256;
      g.gain.value = 0; src.connect(an); src.connect(g); g.connect(AUD.master || ac.destination); o.gain = g; o.an = an; o.buf = new Uint8Array(256);
    } catch (er2) { a.muted = false; }
  };
  pc.onconnectionstatechange = function () { if (pc.connectionState === 'failed') { voiceHang(id); if (!VOICE.warned) { VOICE.warned = true; sysMsg('声がつながらない人がいます（回線の相性のため）。'); } } };
  return o;
}
function voiceCall(id) { var o = voicePC(id); o.pc.createOffer().then(function (of) { return o.pc.setLocalDescription(of); }).then(function () { voiceSend('vo', id, { s: JSON.stringify(o.pc.localDescription) }); }).catch(function () { voiceHang(id); }); }
function voiceHang(id, quiet) { var o = VOICE.pcs[id]; if (!o) return; try { o.pc.close(); } catch (e) {} if (o.el) o.el.srcObject = null; if (o.gain) try { o.gain.disconnect(); } catch (e) {} delete VOICE.pcs[id]; if (!quiet) voiceSend('vh', id, {}); }
function voiceOnEvent(e) {
  var d = e.d || {}; if (d.to !== NET.pid) return;
  var id = e.by, o = VOICE.pcs[id];
  try {
    if (e.k === 'vo') {
      if (!VOICE.on || NET.blocked[id] || NET.muted) { voiceSend('vh', id, {}); return; }
      if (o) voiceHang(id, true); o = voicePC(id);
      o.pc.setRemoteDescription(JSON.parse(d.s)).then(function () { o.q.forEach(function (c2) { o.pc.addIceCandidate(c2).catch(function () {}); }); o.q = []; return o.pc.createAnswer(); }).then(function (a) { return o.pc.setLocalDescription(a); }).then(function () { voiceSend('va', id, { s: JSON.stringify(o.pc.localDescription) }); }).catch(function () { voiceHang(id); });
    } else if (e.k === 'va' && o) { o.pc.setRemoteDescription(JSON.parse(d.s)).then(function () { o.q.forEach(function (c2) { o.pc.addIceCandidate(c2).catch(function () {}); }); o.q = []; }).catch(function () {}); }
    else if (e.k === 'vi' && o) { var c3 = JSON.parse(d.c); if (o.pc.remoteDescription) o.pc.addIceCandidate(c3).catch(function () {}); else o.q.push(c3); }
    else if (e.k === 'vh' && o) voiceHang(id, true);
  } catch (er) {}
}
// ---- 毎フレーム：近い人とつなぐ・遠い人は切る・距離で音量 ----
function updateVoice(dt) {
  if (VOICE.an) VOICE.level = levelOf(VOICE.an, VOICE.buf);
  VOICE.t -= dt;
  var check = VOICE.t <= 0; if (check) VOICE.t = 0.7;
  for (var id in NET.peers) {
    var pr = NET.peers[id], d = pr.pos.distanceTo(P.pos), o = VOICE.pcs[id];
    var want = VOICE.on && NET.on && pr.v && !NET.blocked[id] && !NET.muted && d < VOICE.near;
    if (check) {
      if (want && !o && NET.pid < id) voiceCall(id);
      if (o && (!VOICE.on || !pr.v || NET.blocked[id] || NET.muted || d > VOICE.near + 8)) voiceHang(id);
      if (o && !o.gain && Date.now() - o.born > 25000 && o.pc.connectionState !== 'connected') voiceHang(id);
    }
    if (o && o.gain) { var gv = NET.blocked[id] || NET.muted ? 0 : clamp(1 - (d - 4) / (VOICE.near - 4), 0, 1); o.gain.gain.setTargetAtTime(gv * 1.6, AUD.ctx.currentTime, 0.1); o.level = levelOf(o.an, o.buf); pr.talking = o.level > 0.06; }
    else pr.talking = false;
  }
  for (var k in VOICE.pcs) if (!NET.peers[k]) voiceHang(k, true);
}
