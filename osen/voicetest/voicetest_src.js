/*! 精神汚染ゲーム 声のテスト voicetest.js — マイクと「人どうしの声の通信」が使えるか調べる */
(function () {
  'use strict';
  var DB = 'https://seishinosen-online-default-rtdb.firebaseio.com/';
  var fb = (typeof globalThis !== 'undefined' ? globalThis : window).__osenFirebase;
  var rows = {}, box, codeEl, stream = null, pc = null, me = 'v' + Math.random().toString(36).slice(2, 8), peer = null, ref = null, started = false, t0 = 0;
  function ui() {
    var st = document.createElement('style');
    st.textContent = '#vtx{position:fixed;inset:0;z-index:2147483647;overflow:auto;-webkit-overflow-scrolling:touch;background:#101018;color:#eee;font:14px/1.5 sans-serif;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px calc(env(safe-area-inset-bottom,0px) + 30px)}' +
      '#vtx h1{font-size:18px;margin:0 0 6px;color:#ffd84a}#vtx .r{display:flex;gap:8px;padding:7px 4px;border-bottom:1px solid #333}#vtx .m{width:26px;font-weight:bold;font-size:18px;text-align:center}' +
      '#vtx .ok{color:#5f5}#vtx .ng{color:#f66}#vtx .wa{color:#fc4}#vtx .n{flex:1;min-width:0}#vtx .d{font-size:12px;color:#aaa;word-break:break-all}#vtx .code{margin:10px 0;padding:10px;background:#000;border:2px solid #ffd84a;font:bold 16px monospace;word-break:break-all;color:#ffd84a}' +
      '#vtx button{font:bold 18px sans-serif;padding:14px;width:100%;margin:8px 0;border-radius:10px;border:0;background:#ffd84a;color:#000}#vtx .bar{height:14px;background:#222;border:1px solid #555;margin:4px 0}#vtx .bar i{display:block;height:100%;width:0;background:#5f5}';
    document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'vtx';
    box.innerHTML = '<h1>声のテスト（精神汚染ゲーム）</h1><div>①下のボタンを押す →「マイクの使用」を聞かれたら「許可」。<br>②できれば<b>もう1台のスマホでも同じ物を開いてボタンを押す</b>と、声がつながるかまで調べます（1台だけでも①の結果はわかります）。<br>終わったらこの画面のスクショを送ってください。</div>' +
      '<button id="vgo">テストを始める（マイクを使います）</button><div class="code" id="vcode">結果コード：まだ</div><div id="vl"></div>' +
      '<div>自分のマイクの音：</div><div class="bar"><i id="vme"></i></div><div>相手の声：</div><div class="bar"><i id="vpeer"></i></div><audio id="vaud" autoplay playsinline></audio>';
    (document.body || document.documentElement).appendChild(box);
    codeEl = box.querySelector('#vcode');
    box.querySelector('#vgo').onclick = function () { if (!started) { started = true; this.textContent = 'テスト中…（このまま待ってください）'; go(); } };
    row('A', 'iframe（Gravityの枠）の中か'); row('B', 'マイクを使う許可（設定上）'); row('C', 'マイクの音を取れるか'); row('D', '声の通信の部品（WebRTC）'); row('E', 'つなぎ役サーバー（Firebase）'); row('F', 'もう1台と声がつながるか'); row('G', 'つながり方（直接／中継）');
    set('A', 2, window.top === window ? '一番上の画面' : 'iframeの中');
    try { var pol = document.permissionsPolicy || document.featurePolicy; if (pol && pol.allowsFeature) set('B', pol.allowsFeature('microphone') ? 1 : 0, pol.allowsFeature('microphone') ? '許可されている' : 'Gravityの枠でマイクが禁止されている'); else set('B', 2, 'この端末では調べられない（③で判断）'); } catch (e) { set('B', 2, '調べられない'); }
  }
  function row(k, name) { var r = document.createElement('div'); r.className = 'r'; r.innerHTML = '<div class="m wa">…</div><div class="n"><b></b><div class="d">まだ</div></div>'; r.querySelector('b').textContent = name; box.querySelector('#vl').appendChild(r); rows[k] = { el: r, res: null }; }
  function set(k, res, d) { var o = rows[k]; if (!o) return; o.res = res; var m = o.el.querySelector('.m'); m.className = 'm ' + (res === 1 ? 'ok' : res === 0 ? 'ng' : 'wa'); m.textContent = res === 1 ? '○' : res === 0 ? '×' : '△'; o.el.querySelector('.d').textContent = d || ''; code(); }
  function code() { codeEl.textContent = '結果コード：' + Object.keys(rows).map(function (k) { var r = rows[k].res; return k + (r === 1 ? '1' : r === 0 ? '0' : r === 2 ? '2' : '_'); }).join('') + (t0 ? '（' + Math.round((Date.now() - t0) / 1000) + '秒）' : ''); }
  function meter(s, id) { try { var AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), src = ac.createMediaStreamSource(s), an = ac.createAnalyser(); an.fftSize = 512; src.connect(an); var buf = new Uint8Array(an.fftSize); (function loop() { an.getByteTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128)); document.getElementById(id).style.width = Math.min(100, m * 1.6) + '%'; requestAnimationFrame(loop); })(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} }
  function go() {
    t0 = Date.now(); setInterval(code, 1000);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { set('C', 0, 'この環境ではマイクの機能が無い'); }
    else navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (s) { stream = s; set('C', 1, 'マイクの音が取れた（上のバーが動けばOK）'); meter(s, 'vme'); signal(); }, function (e) { set('C', 0, 'だめ：' + (e && e.name) + '（' + (e && e.message || '') + '）'); signal(); });
    var PC = window.RTCPeerConnection; set('D', PC ? 1 : 0, PC ? '使える' : '無い');
  }
  function signal() {
    if (!fb) { set('E', 0, 'Firebase の部品が無い'); return; }
    try {
      var app = fb.apps.filter(function (a) { return a.name === 'vt'; })[0] || fb.initializeApp({ databaseURL: DB }, 'vt');
      var db = app.database(); ref = db.ref('osen/v1/rooms/vtest');
      var pRef = ref.child('p/' + me); pRef.set({ c: 0, x: 0, y: 0, z: 0, t: Date.now() }); pRef.onDisconnect().remove();
      db.ref('.info/connected').on('value', function (s) { if (s.val()) set('E', 1, 'つながった'); });
      setTimeout(function () { if (rows.E.res === null) set('E', 0, 'つながらない'); }, 10000);
      ref.child('p').on('value', function (s) {
        var ps = s.val() || {}, others = Object.keys(ps).filter(function (k) { return k !== me && Date.now() - (ps[k].t || 0) < 120000; });
        if (!others.length) { if (rows.F.res === null) rows.F.el.querySelector('.d').textContent = 'もう1台を待っています…（1台だけなら、ここは△のままでOK）'; return; }
        if (!peer) { peer = others[0]; if (me < peer) call(true); }
      });
      ref.child('e').limitToLast(50).on('child_added', function (s) { var e = s.val(); if (!e || e.by === me || (e.d && e.d.to !== me) || Date.now() - (e.t || 0) > 60000) return; onSig(e); });
      setTimeout(function () { if (rows.F.res === null) set('F', 2, peer ? 'つながらなかった（スマホの回線どうしでは「中継サーバー」が必要かもしれません）' : 'もう1台が来なかった'); }, 60000);
    } catch (e) { set('E', 0, 'エラー：' + e.message); }
  }
  function send(k, d) { d.to = peer; ref.child('e').push({ k: k, by: me, t: Date.now(), d: d }); }
  function mkpc() {
    pc = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] });
    if (stream) stream.getTracks().forEach(function (t) { pc.addTrack(t, stream); }); else pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.onicecandidate = function (e) { if (e.candidate) send('ice', { c: JSON.stringify(e.candidate) }); };
    pc.ontrack = function (e) { var a = document.getElementById('vaud'); a.srcObject = e.streams[0]; a.play && a.play().catch(function () {}); meter(e.streams[0], 'vpeer'); };
    pc.oniceconnectionstatechange = function () {
      var st = pc.iceConnectionState; rows.F.el.querySelector('.d').textContent = '状態：' + st;
      if (st === 'connected' || st === 'completed') { set('F', 1, 'つながった！相手の声のバーが動けば成功'); pc.getStats().then(function (r) { var pair = null, lc = {}; r.forEach(function (s) { if (s.type === 'candidate-pair' && (s.selected || s.nominated) && s.state === 'succeeded') pair = s; if (s.type === 'local-candidate' || s.type === 'remote-candidate') lc[s.id] = s; }); if (pair) { var a = lc[pair.localCandidateId], b = lc[pair.remoteCandidateId]; set('G', 1, (a ? a.candidateType : '?') + ' ↔ ' + (b ? b.candidateType : '?') + '（host/srflx=直接、relay=中継）'); } }); }
      if (st === 'failed') set('F', 0, 'つながらなかった（スマホの回線どうしでは「中継サーバー」が必要）');
    };
  }
  function call() { mkpc(); pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { send('offer', { s: JSON.stringify(pc.localDescription) }); }); }
  function onSig(e) {
    try {
      if (e.k === 'offer') { peer = e.by; mkpc(); pc.setRemoteDescription(JSON.parse(e.d.s)).then(function () { return pc.createAnswer(); }).then(function (a) { return pc.setLocalDescription(a); }).then(function () { send('answer', { s: JSON.stringify(pc.localDescription) }); }); }
      else if (e.k === 'answer' && pc) pc.setRemoteDescription(JSON.parse(e.d.s));
      else if (e.k === 'ice' && pc) pc.addIceCandidate(JSON.parse(e.d.c)).catch(function () {});
    } catch (er) {}
  }
  if (document.body) ui(); else document.addEventListener('DOMContentLoaded', ui);
})();
