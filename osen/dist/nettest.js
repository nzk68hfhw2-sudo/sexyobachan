/*! 精神汚染ゲーム 通信テスト nettest.js — どの通信方式が使えるかを調べて、画面に日本語で出す */
(function () {
  'use strict';
  var BASE = (function () {
    try { var s = document.currentScript && document.currentScript.src; if (s) return s.replace(/nettest\.js([?#].*)?$/, ''); } catch (e) {}
    return 'https://stupendous-moxie-15d900.netlify.app/';
  })();
  var T0 = Date.now(), CSP = [], rows = [], box, list, codeEl;
  document.addEventListener('securitypolicyviolation', function (e) { CSP.push((e.violatedDirective || e.effectiveDirective || '?') + ' ' + String(e.blockedURI || '').slice(0, 60)); });

  function ui() {
    var st = document.createElement('style');
    st.textContent = '#ntx{position:fixed;inset:0;z-index:2147483647;overflow:auto;-webkit-overflow-scrolling:touch;background:#101018;color:#eee;font:14px/1.5 sans-serif;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px calc(env(safe-area-inset-bottom,0px) + 30px)}' +
      '#ntx h1{font-size:18px;margin:0 0 6px;color:#ffd84a}#ntx .r{display:flex;gap:8px;padding:7px 4px;border-bottom:1px solid #333}#ntx .m{width:26px;font-weight:bold;font-size:18px;text-align:center}' +
      '#ntx .ok{color:#5f5}#ntx .ng{color:#f66}#ntx .wa{color:#fc4}#ntx .n{flex:1;min-width:0}#ntx .d{font-size:12px;color:#aaa;word-break:break-all}#ntx .code{margin:10px 0;padding:10px;background:#000;border:2px solid #ffd84a;font:bold 16px monospace;word-break:break-all;color:#ffd84a}';
    document.head.appendChild(st);
    box = document.createElement('div'); box.id = 'ntx';
    box.innerHTML = '<h1>通信テスト（精神汚染ゲーム）</h1><div>この画面のスクリーンショットを撮って送ってください。全部終わるまで約20秒です。</div><div class="code" id="ntc">結果コード：測定中…</div><div id="ntl"></div>';
    (document.body || document.documentElement).appendChild(box);
    list = box.querySelector('#ntl'); codeEl = box.querySelector('#ntc');
  }
  function row(key, name, host) {
    var r = document.createElement('div'); r.className = 'r';
    r.innerHTML = '<div class="m wa">…</div><div class="n"><b></b><div class="d">調べ中…</div></div>';
    r.querySelector('b').textContent = name; list.appendChild(r);
    var o = { key: key, el: r, res: null, host: host };
    o.set = function (res, detail) {
      if (o.res !== null || o.wait) return;
      if (res === 0 || res === 3) { o.wait = true; setTimeout(function () { o.wait = false; fin(res, detail); }, 400); return; }
      fin(res, detail);
    };
    function fin(res, detail) {
      if (o.res !== null) return;
      var blocked = o.host && CSP.some(function (c) { return c.indexOf(o.host) >= 0; });
      if (res === 3) { res = blocked ? 0 : 2; detail = blocked ? 'Gravity の安全設定（CSP）で禁止されている' : '安全設定での禁止の記録はない。相手まで届いたかは不明（テスト用の鍵が無いため。F の結果もあわせて判断します）'; }
      else if (res === 0 && blocked) detail = (detail || '') + ' ← Gravity の安全設定（CSP）で禁止';
      o.res = res;
      var m = r.querySelector('.m'); m.className = 'm ' + (res === 1 ? 'ok' : res === 0 ? 'ng' : 'wa'); m.textContent = res === 1 ? '○' : res === 0 ? '×' : '△';
      r.querySelector('.d').textContent = detail || ''; done();
    }
    rows.push(o); return o;
  }
  function done() {
    var c = rows.map(function (o) { return o.key + (o.res === 1 ? '1' : o.res === 0 ? '0' : o.res === 2 ? '2' : '_'); }).join('');
    codeEl.textContent = '結果コード：' + c + '  (' + Math.round((Date.now() - T0) / 1000) + '秒)' + (CSP.length ? '  CSP違反' + CSP.length + '件' : '');
    if (rows.every(function (o) { return o.res !== null; })) {
      var d = document.createElement('div'); d.className = 'd';
      d.textContent = '【追加情報】' + (window.top === window ? '一番上の画面' : 'iframeの中') + ' / 保存:' + store() + ' / CSP違反: ' + (CSP.length ? CSP.slice(0, 8).join(' | ') : 'なし');
      list.appendChild(d);
    }
  }
  function store() { try { localStorage.setItem('__nt', '1'); localStorage.removeItem('__nt'); return '使える'; } catch (e) { return '使えない'; } }
  function timeout(o, ms, msg) { setTimeout(function () { o.set(0, msg || 'タイムアウト（' + ms / 1000 + '秒以内に返事なし）'); }, ms); }

  // ---- 各テスト ----
  function tFetchNetlify() {
    var o = row('A', 'fetch で Netlify のファイルを読む', 'netlify');
    timeout(o, 9000);
    try { fetch(BASE + 'nettest.txt?' + Date.now()).then(function (r) { return r.text(); }).then(function (t) { o.set(/OSEN/.test(t) ? 1 : 2, '中身: ' + t.slice(0, 30)); }, function (e) { o.set(0, 'エラー: ' + e.message); }); } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tXhr() {
    var o = row('B', 'XMLHttpRequest で Netlify を読む', 'netlify');
    timeout(o, 9000);
    try { var x = new XMLHttpRequest(); x.open('GET', BASE + 'nettest.txt?x' + Date.now()); x.onload = function () { o.set(/OSEN/.test(x.responseText) ? 1 : 2, '状態 ' + x.status); }; x.onerror = function () { o.set(0, '通信エラー'); }; x.send(); } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  var FB = 'https://dinosaur-facts.firebaseio.com/dinosaurs/lambeosaurus.json';
  function tFirebaseRest() {
    var o = row('C', 'Firebase（Google）に fetch', 'firebaseio');
    timeout(o, 9000);
    try { fetch(FB).then(function (r) { return r.json(); }).then(function (j) { o.set(j && j.height ? 1 : 2, '見本データを受信'); }, function (e) { o.set(0, 'エラー: ' + e.message); }); } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tFirebaseWs() {
    var o = row('D', 'Firebase に WebSocket（リアルタイム通信）', 'firebaseio');
    timeout(o, 10000);
    try {
      var ws = new WebSocket('wss://dinosaur-facts.firebaseio.com/.ws?v=5&ns=dinosaur-facts');
      ws.onmessage = function (e) { o.set(1, '返事あり: ' + String(e.data).slice(0, 40)); try { ws.close(); } catch (x) {} };
      ws.onerror = function () { o.set(0, '接続できない'); };
    } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tSse() {
    var o = row('E', 'Firebase に EventSource（流しっぱなし受信）', 'firebaseio');
    timeout(o, 10000);
    try {
      if (!window.EventSource) return o.set(0, 'この環境に EventSource が無い');
      var es = new EventSource(FB);
      es.addEventListener('put', function () { o.set(1, 'データを受信'); es.close(); });
      es.onerror = function () { o.set(0, '接続できない'); es.close(); };
    } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tWsEcho() {
    var o = row('F', 'WebSocket（ふつうの中継サーバー）で送受信', 'postman');
    timeout(o, 10000);
    try {
      var ws = new WebSocket('wss://ws.postman-echo.com/raw');
      ws.onopen = function () { ws.send('osen-ping'); };
      ws.onmessage = function (e) { o.set(e.data === 'osen-ping' ? 1 : 2, '送った言葉がもどってきた'); ws.close(); };
      ws.onerror = function () { o.set(0, '接続できない'); };
    } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tWsOpen(key, name, url) {
    var o = row(key, name, url.split('/')[2]);
    timeout(o, 10000);
    try {
      var ws = new WebSocket(url), opened = false;
      ws.onopen = function () { opened = true; o.set(1, '接続できた（相手の場所まで届く）'); try { ws.close(); } catch (x) {} };
      ws.onmessage = function () { if (!opened) o.set(1, '返事あり'); };
      ws.onerror = function () { o.set(3); };
      ws.onclose = function () { if (!opened) o.set(3); };
    } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tRtc() {
    var o = row('I', 'WebRTC（人どうし直接つなぐ）');
    timeout(o, 9000, '相手を探す情報が取れない');
    try {
      var PC = window.RTCPeerConnection || window.webkitRTCPeerConnection; if (!PC) return o.set(0, 'この環境に WebRTC が無い');
      var pc = new PC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('t');
      pc.onicecandidate = function (e) { if (e.candidate && / srflx /.test(e.candidate.candidate)) { o.set(1, '外とつながる情報を取得'); pc.close(); } };
      pc.createOffer().then(function (d) { return pc.setLocalDescription(d); }).catch(function (e) { o.set(0, 'エラー: ' + e.message); });
    } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tFonts() {
    var o = row('J', 'Google Fonts（ゲームの文字）を読む', 'font');
    timeout(o, 10000);
    try {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=DotGothic16&display=block&text=' + encodeURIComponent('汚染率テスト');
      l.onerror = function () { o.set(0, 'フォントの設定ファイルが読めない'); };
      l.onload = function () {
        if (!document.fonts || !document.fonts.load) return o.set(2, '確認できない');
        document.fonts.load('16px "DotGothic16"', '汚染率テスト').then(function (f) { o.set(f && f.length ? 1 : 0, f && f.length ? '文字の形のファイルも読めた' : '文字の形のファイルが読めない'); }, function () { o.set(0, '文字の形のファイルが読めない'); });
      };
      document.head.appendChild(l);
    } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tImg() {
    var o = row('K', 'Netlify の画像を読む', 'netlify');
    timeout(o, 9000);
    var i = new Image(); i.onload = function () { o.set(1, '表示できた'); }; i.onerror = function () { o.set(0, '読めない'); }; i.src = BASE + 'nettest.png?' + Date.now();
  }
  function tBitmap() {
    var o = row('L', '埋め込み画像の解読（3Dモデルの色に使う）');
    timeout(o, 6000);
    try {
      var b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
      var bin = atob(b64), u = new Uint8Array(bin.length); for (var k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
      if (window.createImageBitmap) createImageBitmap(new Blob([u], { type: 'image/png' })).then(function () { o.set(1, 'createImageBitmap が使える'); }, function () { o.set(2, 'createImageBitmap は失敗（予備の方法あり）'); });
      else o.set(2, 'createImageBitmap が無い（予備の方法あり）');
    } catch (e) { o.set(0, 'エラー: ' + e.message); }
  }
  function tJsonp() {
    var o = row('M', 'Netlify の別の script を読む（今の方式）');
    timeout(o, 9000);
    window.__osenNt = function (v) { o.set(v === 'OK' ? 1 : 2, 'script で読めた'); };
    var s = document.createElement('script'); s.src = BASE + 'nettest2.js?' + Date.now(); s.onerror = function () { o.set(0, '読めない'); }; document.head.appendChild(s);
  }

  function start() {
    ui();
    tJsonp(); tFetchNetlify(); tXhr(); tFirebaseRest(); tFirebaseWs(); tSse(); tWsEcho();
    tWsOpen('G', 'Ably（リアルタイム通信サービス）に WebSocket', 'wss://realtime.ably.io/?v=2&format=json&key=test.test:test');
    tWsOpen('H', 'Supabase（リアルタイム通信サービス）に WebSocket', 'wss://realtime-demo.supabase.co/realtime/v1/websocket?vsn=1.0.0');
    tRtc(); tFonts(); tImg(); tBitmap();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
