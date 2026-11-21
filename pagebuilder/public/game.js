/* こじんページ — 個人ページビルダー (game.js 1本で全体が起動します)
   ・画面はすべてこのファイルが作ります(画像・音の素材ファイルなし。絵文字とプログラムの描画だけ)。
   ・ほかの人が書いた文章は、必ず「文字」として表示します(innerHTML を使いません)。 */
(function () {
  'use strict';
  if (window.__KOJIN_PAGE__) return;
  window.__KOJIN_PAGE__ = true;

  // ---------------------------------------------------------------- 場所の検出
  var BASE = '';
  try {
    var cs = document.currentScript, src = cs && cs.src;
    if (!src) {
      var ss = document.getElementsByTagName('script');
      for (var i = ss.length - 1; i >= 0; i--) if (/\/game\.js(\?|#|$)/.test(ss[i].src || '')) { src = ss[i].src; break; }
    }
    if (src && /^https?:/.test(src)) BASE = src.replace(/game\.js([?#].*)?$/, '');
  } catch (e) {}
  if (!BASE) BASE = location.origin + '/';
  var API = BASE + 'api';

  // ---------------------------------------------------------------- 定数
  var LIM = { title: 60, body: 4000, bio: 300, name: 20, cmt: 100, tags: 5, tagLen: 15, pwMin: 8 };
  var THEMES = {
    note: { n: 'ノート', e: '📒', bg: '#fffdf5', fg: '#3b3a36', ac: '#e07a5f', pat: 'repeating-linear-gradient(transparent 0 27px, rgba(70,110,200,.16) 27px 28px)' },
    sakura: { n: 'さくら', e: '🌸', bg: '#fff0f5', fg: '#5a3d4a', ac: '#e8799b', pat: 'radial-gradient(rgba(232,121,155,.22) 3px, transparent 4px)', ps: '26px 26px' },
    sora: { n: 'そら', e: '☁️', bg: '#eaf6ff', fg: '#2b4a66', ac: '#3d9be0', pat: 'repeating-linear-gradient(135deg, rgba(255,255,255,.6) 0 10px, transparent 10px 20px)' },
    mori: { n: 'もり', e: '🌳', bg: '#eef5e6', fg: '#2f4a32', ac: '#5a9a4a', pat: 'radial-gradient(rgba(90,154,74,.25) 2px, transparent 3px)', ps: '16px 16px' },
    yoru: { n: 'よる', e: '🌙', bg: '#1c2033', fg: '#e8e6f5', ac: '#f2c14e', pat: 'radial-gradient(rgba(255,255,255,.7) 1px, transparent 1.5px), radial-gradient(rgba(242,193,78,.6) 1.2px, transparent 2px)', ps: '70px 70px, 110px 110px', pp: '0 0, 35px 50px' },
    lemon: { n: 'レモン', e: '🍋', bg: '#fffbd6', fg: '#4a4420', ac: '#d49a00', pat: 'linear-gradient(45deg, rgba(224,168,0,.12) 25%, transparent 25% 75%, rgba(224,168,0,.12) 75%), linear-gradient(45deg, rgba(224,168,0,.12) 25%, transparent 25% 75%, rgba(224,168,0,.12) 75%)', ps: '24px 24px', pp: '0 0, 12px 12px' },
    mint: { n: 'ミント', e: '🍃', bg: '#e3f8f1', fg: '#23514a', ac: '#2fa58c', pat: 'linear-gradient(rgba(47,181,154,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(47,181,154,.16) 1px, transparent 1px)', ps: '22px 22px' },
    candy: { n: 'キャンディ', e: '🍬', bg: '#fdeaff', fg: '#5b3a6b', ac: '#c561e0', pat: 'radial-gradient(rgba(197,97,224,.2) 5px, transparent 6px), radial-gradient(rgba(255,160,200,.3) 5px, transparent 6px)', ps: '40px 40px', pp: '0 0, 20px 20px' },
    retro: { n: 'レトロ', e: '📻', bg: '#f3e6cf', fg: '#4b3621', ac: '#b5562b', pat: 'repeating-linear-gradient(0deg, rgba(181,86,43,.09) 0 14px, transparent 14px 28px)' },
    sumi: { n: 'すみ', e: '🖋️', bg: '#f4f4f1', fg: '#222222', ac: '#555555', pat: 'linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)', ps: '12px 12px' },
    sunset: { n: 'ゆうやけ', e: '🌇', bg: '#ffe3cf', fg: '#5a2e2a', ac: '#e8603c', pat: 'linear-gradient(180deg, rgba(255,190,120,0), rgba(240,110,140,.28))' },
    galaxy: { n: 'ぎんが', e: '🌌', bg: '#17122b', fg: '#efe9ff', ac: '#b58cff', pat: 'radial-gradient(rgba(255,255,255,.8) 1px, transparent 1.5px), radial-gradient(rgba(181,140,255,.7) 1.5px, transparent 2px), linear-gradient(160deg, rgba(90,60,180,.35), transparent 60%)', ps: '60px 60px, 90px 90px, 100% 100%', pp: '0 0, 30px 45px, 0 0' }
  };
  var FONTS = {
    gothic: { n: 'ゴシック', f: '-apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif' },
    mincho: { n: '明朝', f: '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif' },
    maru: { n: '丸ゴシック', f: '"Hiragino Maru Gothic ProN", "Arial Rounded MT Bold", "Hiragino Sans", sans-serif' },
    kyokasho: { n: '教科書', f: '"YuKyokasho Yoko", "YuKyokasho", "Klee", "Hiragino Mincho ProN", serif' },
    pop: { n: 'ポップ', f: '"Chalkboard SE", "Marker Felt", "Hiragino Maru Gothic ProN", "Comic Sans MS", sans-serif' },
    mono: { n: 'タイプライター', f: '"Courier New", Menlo, "Osaka-Mono", monospace' }
  };
  var DECOS = { line: '下線', marker: 'マーカー', bar: 'たて線', kakko: '【かっこ】', flower: '✿ お花', dots: 'てんてん', ribbon: 'リボン', star: '★ ほし' };
  var ICONS = '🌱 🌸 🌻 🌙 ⭐ ☁️ 🌈 🍀 🍎 🍓 🍋 🍙 🍰 🍩 ☕ 🐱 🐶 🐰 🐻 🐼 🐧 🐥 🦊 🐸 🐳 🦋 🐝 🎈 🎀 🎵 🎨 📚 ✏️ 📷 🎮 ⚽ 🚲 🏠 🗝️ 💎 🔮 🧸 👻 🤖 👾 🌵 🍄 🪐'.split(' ');
  var BGS = ['#fffdf5', '#ffffff', '#fff0f5', '#eaf6ff', '#eef5e6', '#fffbd6', '#fdeaff', '#f3e6cf', '#e8e8e8', '#2b2b2b', '#1c2033', '#17122b'];
  var FGS = ['#222222', '#3b3a36', '#5a3d4a', '#2b4a66', '#2f4a32', '#4b3621', '#5b3a6b', '#ffffff', '#e8e6f5', '#ffe9a8'];
  var VIS = { public: '🌏 全体に公開', unlisted: '🔗 URLを知っている人だけ', private: '🔒 自分だけ' };
  var REASONS = { personal: '本名・住所・学校名・連絡先が書いてある', abuse: 'いやがらせ・悪口', adult: 'ふさわしくない内容', spam: '宣伝・いたずら', other: 'そのほか' };
  var WARN = '⚠️ 本名、住所、学校名、連絡先は書かないでください。';

  // ---------------------------------------------------------------- DOM の道具
  function h(tag, attrs) {
    var el = document.createElement(tag), k;
    if (attrs) for (k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { for (var i = 0; i < c.length; i++) add(el, c[i]); return; }
    el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  function btn(label, cls, fn, extra) { var a = { class: 'b ' + (cls || ''), type: 'button', onclick: fn }; if (extra) for (var k in extra) a[k] = extra[k]; return h('button', a, label); }
  function count(s) { return Array.from(s).length; }
  function fmtDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return '';
    var w = '日月火水木金土'[new Date(+m[1], +m[2] - 1, +m[3]).getDay()];
    return m[1] + '年' + (+m[2]) + '月' + (+m[3]) + '日(' + w + ')';
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function ago(t) {
    var s = (Date.now() - t) / 1000;
    if (s < 60) return 'いま'; if (s < 3600) return Math.floor(s / 60) + '分前'; if (s < 86400) return Math.floor(s / 3600) + '時間前';
    if (s < 86400 * 30) return Math.floor(s / 86400) + '日前';
    var d = new Date(t); return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  }
  function isHex(c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c); }
  function lum(hex) {
    var c = [1, 3, 5].map(function (i) { var v = parseInt(hex.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  // ---------------------------------------------------------------- Gravity のアイコン(自動読み取り)
  // Gravity がゲームにわたしている情報(URLのうしろ・ページ内の変数・保存データ・画像)の中から、
  // プロフィール画像らしい https のURLをさがします。見つからなければ絵文字のアイコンを使います。
  // 見つけたURLはこの端末の中だけで使い、サーバーには送りません。
  var gIcon = null, gFrom = '';
  var KEY_RE = /avatar|icon|head_?img|portrait|face_?url|(profile|user|member)_?(image|img|pic|photo)/i;
  var GLOBAL_RE = /gravity|user|profile|account|member|bridge|native|__INITIAL|__NUXT|__NEXT|app_?(data|info|config)/i;
  function okImgUrl(u) {
    try {
      if (typeof u !== 'string' || u.length > 600) return null;
      var x = new URL(u, location.href);
      if (x.protocol === 'https:' || (x.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(x.hostname))) return x.href;
    } catch (e) {}
    return null;
  }
  function scanObj(o, depth, path, out, budget) {
    if (!o || typeof o !== 'object' || depth > 3 || o === window || o.nodeType) return;
    var ks; try { ks = Object.keys(o); } catch (e) { return; }
    for (var i = 0; i < ks.length && i < 60 && budget.n-- > 0; i++) {
      var v; try { v = o[ks[i]]; } catch (e) { continue; }
      if (typeof v === 'string') { if (KEY_RE.test(ks[i]) && okImgUrl(v)) out.push([path + '.' + ks[i], okImgUrl(v)]); }
      else if (v && typeof v === 'object') scanObj(v, depth + 1, path + '.' + ks[i], out, budget);
    }
  }
  function envScan() {
    var found = [], names = { query: [], globals: [], storage: [], imgs: 0, handlers: [] }, budget = { n: 4000 };
    try {
      (location.search.slice(1) + '&' + (location.hash || '').replace(/^#\??/, '')).split('&').forEach(function (kv) {
        var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
        if (!k) return; names.query.push(k);
        try { v = decodeURIComponent(v); } catch (e) {}
        if (KEY_RE.test(k) && okImgUrl(v)) found.push(['URL ?' + k, okImgUrl(v)]);
      });
    } catch (e) {}
    try {
      Object.getOwnPropertyNames(window).forEach(function (k) {
        if (!GLOBAL_RE.test(k) || /^__kp_|^__KOJIN/.test(k)) return;
        var v; try { v = window[k]; } catch (e) { return; }
        if (!v || typeof v !== 'object') return;
        names.globals.push(k); scanObj(v, 0, 'window.' + k, found, budget);
      });
    } catch (e) {}
    try { if (window.webkit && window.webkit.messageHandlers) names.handlers = Object.keys(window.webkit.messageHandlers); } catch (e) {}
    ['localStorage', 'sessionStorage'].forEach(function (sn) {
      try {
        var st = window[sn];
        for (var i = 0; i < st.length && i < 60; i++) {
          var k = st.key(i); if (k === 'kojin_page_token') continue;
          names.storage.push(k);
          var v = st.getItem(k);
          if (v && v.length < 20000 && /^[\[{]/.test(v)) { try { scanObj(JSON.parse(v), 0, sn + '.' + k, found, budget); } catch (e) {} }
          else if (KEY_RE.test(k) && okImgUrl(v)) found.push([sn + '.' + k, okImgUrl(v)]);
        }
      } catch (e) {}
    });
    try {
      Array.prototype.forEach.call(document.querySelectorAll('img'), function (im) {
        names.imgs++;
        if (KEY_RE.test((im.className || '') + ' ' + (im.id || '') + ' ' + (im.alt || '')) && okImgUrl(im.currentSrc || im.src)) found.push(['img', okImgUrl(im.currentSrc || im.src)]);
      });
    } catch (e) {}
    return { found: found, names: names };
  }
  function detectGravityIcon() { var r = envScan(); if (r.found.length) { gIcon = r.found[0][1]; gFrom = r.found[0][0]; } return r; }
  function gImg(size) {
    var im = h('img', { class: 'gi', alt: '', referrerpolicy: 'no-referrer', style: 'width:' + size + 'px;height:' + size + 'px' });
    im.onerror = function () { im.style.display = 'none'; };
    im.src = gIcon;
    return im;
  }
  function diagText() {
    var r = envScan(), n = r.names, host = ''; try { host = location.host; } catch (e) {}
    return ['Gravityアイコン: ' + (gIcon ? '見つかりました(' + gFrom + ')' : '見つかりません'),
      '場所: ' + host, 'URLの項目名: ' + (n.query.join(', ') || 'なし'), 'ページ内の変数名: ' + (n.globals.join(', ') || 'なし'),
      'アプリ連絡口: ' + (n.handlers.join(', ') || 'なし'), '保存データの項目名: ' + (n.storage.join(', ') || 'なし'), 'ページ内の画像: ' + n.imgs + '個',
      '候補: ' + (r.found.map(function (f) { return f[0]; }).join(', ') || 'なし')].join('\n');
  }

  // ---------------------------------------------------------------- Gravity に投稿する(文章コピー + カード画像)
  function plainBody(text) {
    return String(text || '').split('\n').map(function (ln) {
      if (/^\s*[-ー―─]{3,}\s*$/.test(ln)) return '— — —';
      return ln.replace(/^\s*[#＃]{1,2}[ 　]+/, '■ ').replace(/^\s*- /, '・').replace(/^\s*[>＞][ 　]?/, '｜').replace(/\*\*([^*\n]+)\*\*/g, '$1');
    }).join('\n');
  }
  function shareText(po, au) {
    var head = (po.kind === 'diary' ? '📅 ' + fmtDate(po.date) + 'の日記' : '📝 ' + po.title), body = plainBody(po.body), arr = Array.from(body);
    if (arr.length > 400) body = arr.slice(0, 400).join('') + '…';
    var out = head + '\n' + (po.kind === 'diary' && po.title ? po.title + '\n' : '') + '\n' + body + '\n';
    if (po.tags.length) out += '\n' + po.tags.map(function (t) { return '#' + t; }).join(' ') + '\n';
    if (po.status === 'public' && po.vis === 'public') out += '\n✏️ つづきは「こじんページ」で @' + au.u + ' をさがしてね';
    return out;
  }
  function loadImg(url) {
    return new Promise(function (res) {
      if (!url) return res(null);
      var im = new Image(), t = setTimeout(function () { res(null); }, 6000);
      im.crossOrigin = 'anonymous'; im.referrerPolicy = 'no-referrer';
      im.onload = function () { clearTimeout(t); res(im); }; im.onerror = function () { clearTimeout(t); res(null); };
      im.src = url;
    });
  }
  function rrect(x, a, b, w, hh, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + hh, r); x.arcTo(a + w, b + hh, a, b + hh, r); x.arcTo(a, b + hh, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function wrapLines(x, text, maxW, maxLines) {
    var out = [], cut = false;
    String(text).split('\n').some(function (para) {
      var cur = '';
      Array.from(para).forEach(function (ch) { if (x.measureText(cur + ch).width > maxW && cur) { out.push(cur); cur = ch; } else cur += ch; });
      out.push(cur);
      return out.length > maxLines;
    });
    if (out.length > maxLines) { out = out.slice(0, maxLines); cut = true; }
    if (cut) out[maxLines - 1] = Array.from(out[maxLines - 1]).slice(0, -2).join('') + '…';
    return out;
  }
  function drawCard(po, au, useIcon) {
    return loadImg(useIcon ? gIcon : null).then(function (im) {
      function paint(icon) {
        var W = 1080, H = 1350, c = document.createElement('canvas'), x = c.getContext('2d'), e = effective(au), dark = lum(e.bg) < 0.25, ff = (FONTS[au.font] || FONTS.gothic).f;
        c.width = W; c.height = H;
        x.fillStyle = e.bg; x.fillRect(0, 0, W, H);
        x.globalAlpha = 0.2; x.fillStyle = e.th.ac; // 水玉もようをプログラムで描く
        for (var gy = 0; gy < 16; gy++) for (var gx = 0; gx < 13; gx++) { x.beginPath(); x.arc(gx * 90 + (gy % 2 ? 45 : 0), gy * 90, 13, 0, 7); x.fill(); }
        x.globalAlpha = 1;
        rrect(x, 60, 60, W - 120, H - 120, 48); x.fillStyle = dark ? 'rgba(20,18,36,.82)' : 'rgba(255,255,255,.9)'; x.fill();
        x.lineWidth = 5; x.strokeStyle = e.th.ac; x.setLineDash([18, 14]); x.stroke(); x.setLineDash([]);
        var cx = 170, cy = 190, R = 62;
        if (icon) {
          x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
          var sc = Math.max(2 * R / icon.width, 2 * R / icon.height); x.drawImage(icon, cx - icon.width * sc / 2, cy - icon.height * sc / 2, icon.width * sc, icon.height * sc); x.restore();
          x.beginPath(); x.arc(cx, cy, R, 0, 7); x.lineWidth = 5; x.strokeStyle = e.th.ac; x.stroke();
        } else { x.font = '100px ' + ff; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = e.fg; x.fillText(au.icon || '🌱', cx, cy + 6); }
        x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = e.fg;
        x.font = 'bold 46px ' + ff; x.fillText(wrapLines(x, au.name, W - 400, 1)[0], 260, 185);
        x.globalAlpha = 0.7; x.font = '34px ' + ff; x.fillText((po.kind === 'diary' ? '📅 日記  ' : '📝 ブログ  ') + fmtDate(po.date), 260, 240); x.globalAlpha = 1;
        var y = 350;
        x.font = 'bold 54px ' + ff;
        wrapLines(x, po.title || fmtDate(po.date) + ' の日記', W - 220, 2).forEach(function (ln) { x.fillText(ln, 110, y); y += 72; });
        x.fillStyle = e.th.ac; x.fillRect(110, y - 34, W - 220, 6); x.fillStyle = e.fg; y += 44;
        x.font = '40px ' + ff;
        var lines = wrapLines(x, plainBody(po.body), W - 220, 60), limit = H - 180; // 空行はせまく送って、入るところまで描く
        for (var li = 0; li < lines.length; li++) {
          if (!lines[li]) { y += 26; continue; }
          var rest = lines.slice(li + 1).some(function (t) { return t; });
          if (y + 62 > limit && rest) { x.fillText(Array.from(lines[li]).slice(0, -1).join('') + '…', 110, y); break; }
          x.fillText(lines[li], 110, y); y += 62;
        }
        x.globalAlpha = 0.75; x.font = '32px ' + ff; x.textAlign = 'center';
        x.fillText('✏️ こじんページ ・ @' + au.u, W / 2, H - 105); x.globalAlpha = 1;
        return c.toDataURL('image/png');
      }
      try { return { url: paint(im), icon: !!im }; } catch (e2) { return { url: paint(null), icon: false }; } // 画像が書き出せない設定なら絵文字で描きなおす
    });
  }
  function gravitySheet(po, au) {
    sheet('📮 Gravity に投稿する', function (sh, close) {
      var ta = h('textarea', { class: 'i', style: 'min-height:150px;font-size:14px', 'aria-label': '投稿用の文章' }); ta.value = shareText(po, au);
      var useIcon = !!gIcon, cardBox = h('div', { class: 'center' }), iconRow = h('div');
      function copy() {
        var ok = function () { toast('コピーしました。Gravity の投稿画面に貼りつけてください'); };
        try { ta.focus(); ta.select(); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, function () { document.execCommand('copy'); ok(); }); else { document.execCommand('copy'); ok(); } } catch (e) { toast('文章を長押しして「すべて選択 → コピー」してください'); }
      }
      function card() {
        cardBox.textContent = ''; cardBox.appendChild(h('div', { class: 'note', text: 'カードを作っています…' }));
        drawCard(po, au, useIcon).then(function (r) {
          cardBox.textContent = '';
          var im = h('img', { class: 'cardimg', alt: '日記カード', src: r.url });
          add(cardBox, [im, useIcon && !r.icon ? h('div', { class: 'note', text: 'アイコン画像は書き出せなかったので、絵文字で作りました。' }) : null,
            h('div', { class: 'col', style: 'margin-top:8px' }, act('🖼️ 画像を保存・共有する', 'full', function () {
              return fetch(r.url).then(function (x) { return x.blob(); }).then(function (bl) {
                var f = new File([bl], 'nikki.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f] }).catch(function () {});
                toast('画像を長押しして「写真に保存」してください');
              }, function () { toast('画像を長押しして「写真に保存」してください'); });
            }))]);
        });
      }
      if (gIcon) add(iconRow, [h('label', { class: 'f', text: 'カードのアイコン' }), seg({ g: 'Gravityのアイコン', e: '絵文字 ' + (au.icon || '') }, 'g', function (k) { useIcon = k === 'g'; card(); })]);
      add(sh, [
        h('p', { class: 'note', text: 'Gravity の投稿画面には URL が貼れないので、①文章をコピーして貼る ②カード画像を保存して付ける、のどちらか(両方でもOK)で投稿できます。' }),
        po.status !== 'public' || po.vis !== 'public' ? h('div', { class: 'warn', text: 'この' + (po.kind === 'diary' ? '日記' : '記事') + 'は「全体に公開」ではありません。投稿すると Gravity の人には内容が見えます。' }) : null,
        h('label', { class: 'f', text: '① 投稿用の文章(書きかえてOK)' }), ta, btn('📋 文章をコピー', 'full pri', copy),
        iconRow, h('label', { class: 'f', text: '② カード画像' }), cardBox,
        h('div', { style: 'margin-top:12px' }, btn('とじる', 'full sub', close))]);
      card();
    });
  }

  // ---------------------------------------------------------------- かんたん記法 → DOM (HTML は一切通さない)
  function inline(el, s) {
    var re = /\*\*([^*\n]+)\*\*/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) el.appendChild(document.createTextNode(s.slice(last, m.index)));
      el.appendChild(h('strong', { text: m[1] }));
      last = m.index + m[0].length;
    }
    if (last < s.length) el.appendChild(document.createTextNode(s.slice(last)));
    return el;
  }
  function renderBody(text) {
    var root = h('div', { class: 'body' }), lines = String(text || '').split('\n'), para = null, list = null, quote = null;
    function flush() { para = list = quote = null; }
    lines.forEach(function (ln) {
      var m;
      if (/^\s*$/.test(ln)) { flush(); return; }
      if (/^\s*[-ー―─]{3,}\s*$/.test(ln)) { flush(); root.appendChild(h('hr')); return; }
      if ((m = /^\s*[#＃]{2}[ 　]+(.+)$/.exec(ln))) { flush(); root.appendChild(inline(h('h4', { class: 'hd hd2' }), m[1])); return; }
      if ((m = /^\s*[#＃][ 　]+(.+)$/.exec(ln))) { flush(); root.appendChild(h('h3', { class: 'hdw' }, inline(h('span', { class: 'hd' }), m[1]))); return; }
      if ((m = /^\s*(?:[-・][ 　]*)(.+)$/.exec(ln)) && /^\s*(- |・)/.test(ln)) {
        if (!list) { flush(); list = h('ul'); root.appendChild(list); }
        list.appendChild(inline(h('li'), m[1])); return;
      }
      if ((m = /^\s*[>＞][ 　]?(.*)$/.exec(ln))) {
        if (!quote) { flush(); quote = h('blockquote'); root.appendChild(quote); } else quote.appendChild(h('br'));
        inline(quote, m[1]); return;
      }
      if (!para) { flush(); para = h('p'); root.appendChild(para); } else para.appendChild(h('br'));
      inline(para, ln);
    });
    return root;
  }

  // ---------------------------------------------------------------- 見た目(テーマ)
  function effective(d) {
    var th = THEMES[d.theme] || THEMES.note;
    return { th: th, bg: isHex(d.bg) ? d.bg : th.bg, fg: isHex(d.fg) ? d.fg : th.fg };
  }
  function applyDesign(el, d) {
    var e = effective(d), dark = lum(e.bg) < 0.25;
    el.classList.add('pg');
    el.style.setProperty('--bg', e.bg); el.style.setProperty('--fg', e.fg); el.style.setProperty('--ac', e.th.ac);
    el.style.setProperty('--card', dark ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.72)');
    el.style.setProperty('--ln', dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.16)');
    el.style.backgroundColor = e.bg;
    el.style.backgroundImage = e.th.pat || 'none';
    el.style.backgroundSize = e.th.ps || 'auto';
    el.style.backgroundPosition = e.th.pp || '0 0';
    el.style.color = e.fg;
    el.style.fontFamily = (FONTS[d.font] || FONTS.gothic).f;
    el.setAttribute('data-deco', DECOS[d.deco] ? d.deco : 'line');
    return el;
  }

  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
    '.app{position:absolute;inset:0;display:flex;flex-direction:column;background:#f6efe2;color:#3b352c;font:16px/1.6 -apple-system,"Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP",sans-serif;-webkit-text-size-adjust:100%;overflow:hidden}',
    '.top{flex:none;display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 8px) 14px 8px;background:#fffaf0;border-bottom:2px dashed #d9c7a3}',
    '.top canvas{width:34px;height:34px;flex:none}',
    '.top .ttl{font-weight:700;font-size:17px;letter-spacing:.06em;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.top .who{font-size:12px;background:#fff;border:1.5px solid #d9c7a3;border-radius:99px;padding:2px 10px;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    /* Gravity の中では、左上と右上に Gravity のボタンが重なるので、その場所をあける */
    '.top.emb{padding-left:66px;padding-right:176px;min-height:calc(env(safe-area-inset-top,0px) + 58px)}.top.emb canvas{display:none}',
    '.top.emb .tt{flex:1;min-width:0}.top.emb .ttl{font-size:16px;line-height:1.25}.top.emb .who{display:block;max-width:100%;border:0;background:none;padding:0;font-size:11.5px;color:#8a7c66;line-height:1.2}',
    '.bar{height:3px;background:repeating-linear-gradient(90deg,#e07a5f 0 12px,#f2c14e 12px 24px,#81b29a 24px 36px);opacity:0;flex:none}',
    '.bar.on{opacity:1;animation:mv .6s linear infinite}@keyframes mv{to{background-position:36px 0}}',
    '.main{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}',
    '.pad{padding:14px 14px 28px}',
    '.tabs{flex:none;display:flex;background:#fffaf0;border-top:2px dashed #d9c7a3;padding:4px 4px calc(env(safe-area-inset-bottom,0px) + 4px)}',
    '.tabs button{flex:1;min-height:56px;border:0;background:none;font:inherit;font-size:11px;color:#8a7c66;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border-radius:14px;padding:0}',
    '.tabs button i{font-style:normal;font-size:23px;line-height:1.1}',
    '.tabs button.on{color:#c2553a;background:#fde9d6;font-weight:700}',
    'button{cursor:pointer;color:inherit}',
    '.b{font:inherit;font-weight:700;min-height:48px;padding:10px 16px;border-radius:14px;border:2px solid #3b352c;background:#fff;color:#3b352c;box-shadow:2px 3px 0 #3b352c;margin:0}',
    '.b:active{transform:translate(2px,3px);box-shadow:none}.b:disabled{opacity:.5}',
    '.b.pri{background:#e07a5f;color:#fff}.b.sub{box-shadow:none;border:1.5px solid #bfae8c;font-weight:500;min-height:44px}',
    '.b.dan{background:#fff;color:#c0392b;border-color:#c0392b;box-shadow:2px 3px 0 #c0392b}.b.sm{min-height:38px;padding:6px 12px;font-size:14px;border-radius:11px}.b.full{width:100%}',
    '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.row>.grow{flex:1}.col{display:flex;flex-direction:column;gap:10px}',
    'h2.sec{font-size:16px;margin:22px 0 10px;display:flex;align-items:center;gap:6px}h2.sec:first-child{margin-top:4px}',
    'h2.sec:after{content:"";flex:1;border-top:2px dotted #cbb891}',
    '.card{background:#fffdf8;border:1.5px solid #d9c7a3;border-radius:16px;padding:12px 14px;box-shadow:2px 3px 0 rgba(120,95,50,.16)}',
    'button.card{display:block;width:100%;text-align:left;font:inherit;margin:0 0 10px}',
    '.card .hd1{display:flex;align-items:center;gap:8px;font-size:13px;color:#8a7c66}',
    '.ico{width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:19px;border:1.5px solid rgba(0,0,0,.15);flex:none;background:#fff}',
    '.card .t{font-weight:700;font-size:16px;margin:6px 0 2px;overflow-wrap:anywhere}.card .x{font-size:13.5px;color:#6d6252;overflow-wrap:anywhere}',
    '.tag{display:inline-block;font-size:12.5px;padding:2px 10px;border-radius:99px;background:rgba(224,122,95,.14);color:inherit;border:1px solid rgba(224,122,95,.4);margin:4px 6px 0 0}',
    'button.tag{font:inherit;font-size:14px;min-height:36px;padding:4px 14px;margin:0 8px 8px 0}',
    '.badge{font-size:11.5px;padding:1px 8px;border-radius:6px;background:#eee;color:#555;margin-right:5px;white-space:nowrap}.badge.g{background:#dff3e4;color:#256b3c}.badge.r{background:#fde0dc;color:#b03224}.badge.y{background:#fff3c9;color:#7a5b00}',
    '.chips{display:flex;gap:10px;overflow-x:auto;padding:2px 0 10px;-webkit-overflow-scrolling:touch}',
    '.chip{flex:none;width:86px;border:1.5px solid #d9c7a3;border-radius:16px;padding:10px 4px 8px;text-align:center;font:inherit;font-size:12px;box-shadow:2px 3px 0 rgba(120,95,50,.16)}',
    '.chip b{display:block;font-size:28px;line-height:1.2;font-weight:400}.chip span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    'label.f{display:block;font-size:13.5px;font-weight:700;margin:14px 0 5px}',
    'input.i,textarea.i,select.i{display:block;width:100%;font:inherit;font-size:16px;padding:11px 12px;border:2px solid #bfae8c;border-radius:12px;background:#fff;color:#3b352c;margin:0;-webkit-appearance:none;appearance:none}',
    'textarea.i{min-height:210px;line-height:1.7;resize:vertical}input.i:focus,textarea.i:focus{outline:none;border-color:#e07a5f}',
    '.note{font-size:13px;color:#7a6d58}.cnt{font-size:12px;color:#8a7c66;text-align:right}.cnt.over{color:#c0392b;font-weight:700}',
    '.warn{background:#fff3c9;border:2px solid #e3b000;border-radius:12px;padding:9px 12px;font-size:14px;font-weight:700;color:#5e4700}',
    '.err{background:#fde0dc;border:1.5px solid #d9534f;border-radius:12px;padding:9px 12px;font-size:14px;color:#8e2219}',
    '.seg{display:flex;gap:6px;flex-wrap:wrap}.seg button{flex:1 1 auto;min-height:44px;font:inherit;font-size:14px;border:1.5px solid #bfae8c;background:#fff;border-radius:11px;padding:6px 10px}',
    '.seg button.on{background:#3b352c;color:#fff;border-color:#3b352c;font-weight:700}',
    '.tools{display:flex;gap:6px;overflow-x:auto;padding:0 0 6px}.tools button{flex:none;min-height:40px;font:inherit;font-size:13.5px;border:1.5px solid #bfae8c;background:#fff;border-radius:10px;padding:4px 11px}',
    '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.grid button{min-height:58px;border:2px solid transparent;border-radius:12px;font:inherit;font-size:12px;padding:4px;overflow:hidden}',
    '.grid button.on{border-color:#3b352c;box-shadow:0 0 0 2px #fff inset}.grid.em{grid-template-columns:repeat(8,1fr);gap:4px}.grid.em button{min-height:40px;font-size:22px;background:#fff;border:1.5px solid #e4d8bf;padding:0}',
    '.grid.em button.on{border-color:#e07a5f;background:#fde9d6}',
    '.sw{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.sw button{width:38px;height:38px;border-radius:50%;border:2px solid #bfae8c;padding:0}.sw button.on{box-shadow:0 0 0 3px #e07a5f}',
    '.sw input{width:46px;height:40px;padding:0;border:2px solid #bfae8c;border-radius:10px;background:#fff}',
    /* 個人ページ(テーマがきく部分) */
    '.pg{border-radius:18px;padding:18px 16px 22px;line-height:1.85;overflow-wrap:anywhere;border:1.5px solid var(--ln);min-height:120px}',
    '.pg.fullpg{border-radius:0;border:0;min-height:100%;padding-bottom:36px}',
    '.pg .box{background:var(--card);border:1.5px solid var(--ln);border-radius:14px;padding:12px 14px;margin:12px 0}',
    '.pg .phead{text-align:center;padding:8px 0 4px}.pg .phead .big{font-size:54px;line-height:1.15}.pg .phead .nm{font-size:22px;font-weight:700;margin:2px 0 0}.pg .phead .id{font-size:13px;opacity:.7}',
    '.pg .meta{font-size:13px;opacity:.75}.pg h1.pt{font-size:22px;line-height:1.5;margin:6px 0 4px}',
    '.pg .body p{margin:.7em 0}.pg .body ul{margin:.7em 0;padding-left:1.4em}.pg .body hr{border:0;border-top:2px dashed var(--ln);margin:1.2em 0}',
    '.pg .body blockquote{margin:.8em 0;padding:.5em .9em;border-left:5px solid var(--ac);background:var(--card);border-radius:0 10px 10px 0}',
    '.pg .hdw{margin:1.1em 0 .5em;font-size:19px;line-height:1.5}.pg .hd2{font-size:16.5px;margin:1em 0 .4em;line-height:1.5}',
    '.pg h4.hd2:before{content:"● ";color:var(--ac);font-size:.7em;vertical-align:.15em}',
    '.pg[data-deco=line] .hd{border-bottom:3px solid var(--ac);padding-bottom:1px}.pg[data-deco=line] h4.hd{border-bottom-width:0}',
    '.pg[data-deco=marker] span.hd{background:linear-gradient(transparent 58%,var(--ac) 58%);background-size:100% 100%;padding:0 3px;-webkit-box-decoration-break:clone;box-decoration-break:clone}',
    '.pg[data-deco=marker] span.hd{background-image:linear-gradient(transparent 58%,color-mix(in srgb,var(--ac) 45%,transparent) 58%)}',
    '.pg[data-deco=bar] span.hd{border-left:7px solid var(--ac);padding-left:9px;display:block}',
    '.pg[data-deco=kakko] span.hd:before{content:"【";color:var(--ac)}.pg[data-deco=kakko] span.hd:after{content:"】";color:var(--ac)}',
    '.pg[data-deco=flower] span.hd:before{content:"✿ ";color:var(--ac)}.pg[data-deco=flower] span.hd:after{content:" ✿";color:var(--ac)}',
    '.pg[data-deco=dots] span.hd{border-bottom:4px dotted var(--ac);padding-bottom:2px}',
    '.pg[data-deco=ribbon] span.hd{background:var(--ac);color:#fff;padding:2px 14px;border-radius:4px 14px 4px 14px;display:inline-block}',
    '.pg[data-deco=star] span.hd:before{content:"★ ";color:var(--ac)}',
    '.pg .tag{background:var(--card);border-color:var(--ln)}',
    '.pg .pl{display:block;width:100%;text-align:left;font:inherit;color:inherit;background:var(--card);border:1.5px solid var(--ln);border-radius:14px;padding:10px 13px;margin:0 0 9px}',
    '.pg .pl .t{font-weight:700}.pg .pl .x{font-size:13.5px;opacity:.8}',
    '.pg .seg button{background:var(--card);color:inherit;border-color:var(--ln)}.pg .seg button.on{background:var(--ac);color:#fff;border-color:var(--ac)}',
    '.soc{display:flex;gap:10px;align-items:center;margin:16px 0 6px;flex-wrap:wrap}',
    '.like{font:inherit;font-weight:700;min-height:48px;min-width:104px;border-radius:99px;border:2px solid var(--ac);background:var(--card);color:inherit;padding:6px 18px;font-size:16px}',
    '.like.on{background:var(--ac);color:#fff}.foot{font-size:14px;opacity:.85}',
    '.cm{background:var(--card);border:1.5px solid var(--ln);border-radius:12px;padding:8px 11px;margin:0 0 8px;font-size:14.5px;line-height:1.6}',
    '.cm .w{font-size:12px;opacity:.75;display:flex;gap:6px;align-items:center}.cm .w span.grow{flex:1}',
    '.lk{font:inherit;font-size:12.5px;background:none;border:0;text-decoration:underline;color:inherit;opacity:.75;padding:8px 4px;min-height:36px}',
    '.pg input.i{border-color:var(--ln)}',
    /* カレンダー */
    '.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.cal div.w{font-size:12px;color:#8a7c66;padding:2px 0}',
    '.cal button{min-height:46px;border:1.5px solid #e4d8bf;border-radius:10px;background:#fff;font:inherit;font-size:14px;padding:0;position:relative;line-height:1.1}',
    '.cal button.has{background:#fde9d6;border-color:#e07a5f;font-weight:700}.cal button.has:after{content:"✏️";font-size:10px;display:block}.cal button.td{box-shadow:0 0 0 2px #3b352c}',
    /* シートとトースト */
    '.ov{position:absolute;inset:0;background:rgba(40,30,15,.45);display:flex;align-items:flex-end;z-index:20}',
    '.sheet{width:100%;max-height:88%;overflow-y:auto;background:#fffaf0;border-radius:22px 22px 0 0;border-top:2px solid #3b352c;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 18px)}',
    '.sheet h3{margin:0 0 10px;font-size:17px}.sheet p{margin:8px 0;font-size:15px}',
    '.radio{display:block;width:100%;text-align:left;font:inherit;font-size:15px;min-height:46px;border:1.5px solid #bfae8c;background:#fff;border-radius:11px;padding:8px 12px;margin:0 0 7px}.radio.on{background:#3b352c;color:#fff}',
    '.toast{position:absolute;left:14px;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 84px);background:#3b352c;color:#fff;border-radius:14px;padding:11px 14px;font-size:14.5px;z-index:30;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.3)}',
    '.empty{text-align:center;color:#8a7c66;font-size:14px;padding:22px 8px}.center{text-align:center}',
    '.gi{border-radius:50%;object-fit:cover;flex:none;vertical-align:middle}.cardimg{width:100%;max-width:340px;border-radius:14px;border:1.5px solid #d9c7a3;-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto}',
    '.code{font-family:Menlo,monospace;font-size:13px;background:#fff;border:1.5px dashed #bfae8c;border-radius:10px;padding:8px 10px;width:100%;color:#3b352c}'
  ].join('\n');

  // ---------------------------------------------------------------- 通信
  var token = null, me = null, myPage = null, transport = null, busyN = 0;
  function loadToken() { try { return window.localStorage.getItem('kojin_page_token'); } catch (e) { return null; } }
  function saveToken(t) { token = t; try { if (t) window.localStorage.setItem('kojin_page_token', t); else window.localStorage.removeItem('kojin_page_token'); } catch (e) {} }
  function ApiErr(code, msg) { this.code = code; this.msg = msg; }

  function viaFetch(body) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(body), credentials: 'omit', cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
  }
  var cbN = 0;
  function jsonpOne(qs) {
    return new Promise(function (res, rej) {
      var name = '__kp_cb' + (++cbN) + String(Date.now()).slice(-6), s = document.createElement('script'), done = false;
      var timer = setTimeout(function () { fin(); rej(new Error('timeout')); }, 25000);
      function fin() { done = true; clearTimeout(timer); try { delete window[name]; } catch (e) { window[name] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
      window[name] = function (d) { fin(); res(d); };
      s.onerror = function () { if (!done) { fin(); rej(new Error('script error')); } };
      s.src = API + '?cb=' + name + '&' + qs + '&_=' + Date.now();
      (document.head || document.documentElement).appendChild(s);
    });
  }
  function viaJsonp(body) {
    var d = btoa(unescape(encodeURIComponent(JSON.stringify(body)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    var SZ = 3000;
    if (d.length <= SZ) return jsonpOne('d=' + d);
    var n = Math.ceil(d.length / SZ), cid = '', p = Promise.resolve(null);
    for (var k = 0; k < 16; k++) cid += 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36));
    for (var i = 0; i < n; i++) (function (i) {
      p = p.then(function (r) { if (r && !r.ok) return r; return jsonpOne('cid=' + cid + '&i=' + i + '&n=' + n + '&d=' + d.substr(i * SZ, SZ)); });
    })(i);
    return p;
  }
  function raw(body) {
    if (transport === 'fetch') return viaFetch(body);
    if (transport === 'jsonp') return viaJsonp(body);
    // 最初の1回(読むだけの通信)で、fetch が使えるか調べる。だめなら script タグ方式に切りかえる。
    var f = typeof fetch === 'function' ? viaFetch(body) : Promise.reject(new Error('no fetch'));
    return f.then(function (r) { transport = 'fetch'; return r; }, function () {
      return viaJsonp(body).then(function (r) { transport = 'jsonp'; return r; });
    });
  }
  function api(a, params) {
    var body = { a: a }; if (token) body.t = token;
    if (params) for (var k in params) body[k] = params[k];
    setBusy(1);
    return raw(body).then(function (r) {
      setBusy(-1);
      if (!r || !r.ok) {
        if (r && r.err === 'auth') { saveToken(null); me = null; myPage = null; refreshChrome(); }
        throw new ApiErr(r ? r.err : 'net', r ? r.msg : '通信に失敗しました');
      }
      return r;
    }, function () { setBusy(-1); throw new ApiErr('net', '通信に失敗しました。電波のよいところでもう一度ためしてください'); });
  }

  // ---------------------------------------------------------------- 画面の土台
  var host, root, app, mainEl, barEl, tabsEl, whoEl, ttlEl, stack = [{ v: 'home' }], renderN = 0, seen = {};
  function setBusy(d) { busyN = Math.max(0, busyN + d); if (barEl) barEl.className = 'bar' + (busyN ? ' on' : ''); }
  function toast(msg) {
    var t = h('div', { class: 'toast', role: 'status', text: msg }); app.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
  }
  function fail(e) { toast(e && e.msg ? e.msg : 'うまくいきませんでした'); }
  function sheet(title, build) {
    var ov = h('div', { class: 'ov' }), sh = h('div', { class: 'sheet', role: 'dialog' }, h('h3', { text: title }));
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    build(sh, close); ov.appendChild(sh); app.appendChild(ov);
    return close;
  }
  function confirmSheet(title, msg, okLabel, danger) {
    return new Promise(function (res) {
      sheet(title, function (sh, close) {
        add(sh, [h('p', { text: msg }), h('div', { class: 'col', style: 'margin-top:14px' },
          btn(okLabel, 'full ' + (danger ? 'dan' : 'pri'), function () { close(); res(true); }),
          btn('やめる', 'full sub', function () { close(); res(false); }))]);
      });
    });
  }
  function guard(b, fn) { // 二度押しを防ぎながら実行
    return function () {
      if (b.disabled) return; b.disabled = true;
      Promise.resolve().then(fn).catch(fail).then(function () { b.disabled = false; });
    };
  }
  function act(label, cls, fn) { var b = btn(label, cls, null); b.addEventListener('click', guard(b, fn)); return b; }

  function go(v, p) { stack.push({ v: v, p: p || {} }); show(); }
  function back() { if (stack.length > 1) stack.pop(); show(); }
  function tab(v) { stack = [{ v: v, p: {} }]; show(); }
  function replace(v, p) { stack[stack.length - 1] = { v: v, p: p || {} }; show(); }
  var TABS = [['home', '🏠', 'ホーム'], ['search', '🔍', 'さがす'], ['mine', '✏️', 'マイページ'], ['settings', '⚙️', 'せってい']];
  function refreshChrome() {
    if (!tabsEl) return;
    var cur = stack[0].v;
    tabsEl.textContent = '';
    if (stack.length > 1) tabsEl.appendChild(h('button', { type: 'button', onclick: back, 'aria-label': 'もどる' }, h('i', { text: '⬅️' }), 'もどる'));
    TABS.forEach(function (t) {
      tabsEl.appendChild(h('button', { type: 'button', class: cur === t[0] && stack.length === 1 ? 'on' : '', onclick: function () { tab(t[0]); } }, h('i', { text: t[1] }), t[2]));
    });
    whoEl.textContent = me ? ((myPage && myPage.icon) || '🙂') + ' ' + me.id : 'ゲスト';
  }
  function show() {
    var cur = stack[stack.length - 1], n = ++renderN;
    refreshChrome();
    mainEl.textContent = '';
    mainEl.appendChild(h('div', { class: 'empty', text: 'よみこみ中…' }));
    Promise.resolve().then(function () { return VIEWS[cur.v](cur.p || {}); }).then(function (el) {
      if (n !== renderN) return;
      mainEl.textContent = ''; mainEl.appendChild(el); mainEl.scrollTop = 0; refreshChrome();
    }).catch(function (e) {
      if (n !== renderN) return;
      mainEl.textContent = '';
      mainEl.appendChild(h('div', { class: 'pad' }, h('div', { class: 'err', text: e && e.msg ? e.msg : 'ひょうじできませんでした' }),
        h('div', { class: 'row', style: 'margin-top:12px' }, btn('もう一度', 'sub', show), stack.length > 1 ? btn('もどる', 'sub', back) : null)));
    });
  }

  // プログラムで描くロゴ(ノートとえんぴつ)
  function drawLogo(c) {
    var x = c.getContext('2d'); if (!x) return;
    x.scale(2, 2); x.lineJoin = x.lineCap = 'round';
    x.fillStyle = '#fff'; x.strokeStyle = '#3b352c'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(6, 5); x.lineTo(25, 4); x.lineTo(26, 29); x.lineTo(5, 30); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = '#8fb3e8'; x.lineWidth = 1.2;
    [12, 17, 22].forEach(function (y) { x.beginPath(); x.moveTo(10, y); x.lineTo(22, y - 0.5); x.stroke(); });
    x.fillStyle = '#e07a5f'; x.beginPath(); x.arc(8, 10, 1.5, 0, 7); x.arc(8, 17, 1.5, 0, 7); x.arc(8, 24, 1.5, 0, 7); x.fill();
    x.save(); x.translate(27, 22); x.rotate(-0.75);
    x.fillStyle = '#f2c14e'; x.strokeStyle = '#3b352c'; x.lineWidth = 1.5;
    x.fillRect(-10, -3, 16, 6); x.strokeRect(-10, -3, 16, 6);
    x.beginPath(); x.moveTo(-10, -3); x.lineTo(-15, 0); x.lineTo(-10, 3); x.closePath(); x.fillStyle = '#f6efe2'; x.fill(); x.stroke();
    x.restore();
  }

  // ---------------------------------------------------------------- 部品
  function postCard(e) {
    var th = THEMES[e.th] || THEMES.note;
    return h('button', { class: 'card', type: 'button', onclick: function () { go('post', { u: e.u, p: e.p }); } },
      h('div', { class: 'hd1' }, h('span', { class: 'ico', style: 'background:' + th.bg, text: e.icon }), h('span', { text: e.name }), h('span', { text: '・' + (e.kind === 'diary' ? '日記' : 'ブログ') })),
      h('div', { class: 't', text: e.title || fmtDate(e.date) + ' の日記' }),
      h('div', { class: 'x', text: e.x }),
      h('div', null, e.tags.map(function (t) { return h('span', { class: 'tag', text: '#' + t }); })),
      h('div', { class: 'note', style: 'margin-top:4px', text: fmtDate(e.date) }));
  }
  function userChip(e) {
    var th = THEMES[e.th] || THEMES.note;
    return h('button', { class: 'chip', type: 'button', style: 'background:' + th.bg + ';color:' + th.fg, onclick: function () { go('page', { u: e.u }); } },
      h('b', { text: e.icon }), h('span', { text: e.name }));
  }
  function field(label, input, noteText) { return [h('label', { class: 'f', text: label }), input, noteText ? h('div', { class: 'note', text: noteText }) : null]; }
  function seg(options, value, onpick) {
    var el = h('div', { class: 'seg' });
    Object.keys(options).forEach(function (k) {
      el.appendChild(h('button', { type: 'button', class: k === value ? 'on' : '', 'data-k': k, onclick: function () {
        Array.prototype.forEach.call(el.children, function (c) { c.className = c.getAttribute('data-k') === k ? 'on' : ''; });
        onpick(k);
      } }, options[k]));
    });
    return el;
  }
  function shareCode(u, p, key) { return p ? u + '/' + p : '@' + u + (key ? ':' + key : ''); }
  function shareBox(code, note) {
    var url = BASE + '#p=' + encodeURIComponent(code);
    var inp = h('input', { class: 'code', readonly: true, value: url, onfocus: function () { inp.select(); } });
    return h('div', { class: 'box' }, h('div', { class: 'meta', text: note }), inp,
      h('div', { class: 'row', style: 'margin-top:6px' }, btn('URLをコピー', 'sm sub', function () {
        var ok = function () { toast('コピーしました'); };
        try { inp.focus(); inp.select(); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { document.execCommand('copy'); ok(); }); else { document.execCommand('copy'); ok(); } } catch (e) { toast('長押しでコピーしてください'); }
      }), h('span', { class: 'meta', text: 'コード: ' + code })));
  }
  function openCode(s) {
    s = String(s || '').trim();
    var m = /#p=([^&\s]+)/.exec(s); if (m) { try { s = decodeURIComponent(m[1]); } catch (e) { s = m[1]; } }
    if ((m = /^@?([a-z0-9_]{3,20})\/([A-Za-z0-9_-]{8,20})$/.exec(s))) { go('post', { u: m[1], p: m[2] }); return true; }
    if ((m = /^@([a-z0-9_]{3,20})(?::([A-Za-z0-9_-]{6,30}))?$/.exec(s))) { go('page', { u: m[1], key: m[2] }); return true; }
    return false;
  }
  function reportSheet(u, p, key, c) {
    sheet('🚩 通報する', function (sh, close) {
      var reason = null, note = h('input', { class: 'i', maxlength: 100, placeholder: 'メモ(なくてもOK)' });
      var list = h('div');
      Object.keys(REASONS).forEach(function (k) {
        list.appendChild(h('button', { type: 'button', class: 'radio', onclick: function (ev) {
          reason = k; Array.prototype.forEach.call(list.children, function (x) { x.className = 'radio'; }); ev.currentTarget.className = 'radio on';
        } }, REASONS[k]));
      });
      add(sh, [h('p', { class: 'note', text: '管理者が内容を確認します。だれが通報したかは相手に伝わりません。' }), list, note,
        h('div', { class: 'col', style: 'margin-top:12px' }, act('通報を送る', 'full pri', function () {
          if (!reason) { toast('理由をえらんでください'); return; }
          return api('report', { u: u, p: p, key: key, c: c || '', reason: reason, note: note.value }).then(function () { close(); toast('通報を送りました。ありがとう'); });
        }), btn('やめる', 'full sub', close))]);
    });
  }
  function social(u, p, key, data) {
    var wrap = h('div');
    function draw(d) {
      wrap.textContent = '';
      var likeB = h('button', { type: 'button', class: 'like' + (d.liked ? ' on' : ''), 'aria-pressed': d.liked ? 'true' : 'false' }, (d.liked ? '❤️ ' : '🤍 ') + 'いいね ' + d.stat.likes);
      likeB.addEventListener('click', guard(likeB, function () {
        if (!me) { toast('いいねにはログインがいります'); return; }
        return api('like', { u: u, p: p, key: key }).then(function (r) { d.liked = r.liked; if (typeof r.likes === 'number') d.stat.likes = r.likes; draw(d); });
      }));
      var inp = h('input', { class: 'i', maxlength: LIM.cmt, placeholder: me ? 'ひとことコメント(' + LIM.cmt + '文字まで)' : 'コメントにはログインがいります', disabled: !me, 'aria-label': 'コメント' });
      add(wrap, [
        h('div', { class: 'soc' }, likeB, h('span', { class: 'foot', text: '👣 足あと ' + d.stat.views }), h('span', { class: 'grow', style: 'flex:1' }),
          h('button', { class: 'lk', type: 'button', onclick: function () { reportSheet(u, p, key); } }, '🚩 通報')),
        h('h3', { class: 'hdw', style: 'font-size:16px' }, h('span', { class: 'hd', text: 'ひとことコメント (' + d.comments.length + ')' })),
        d.comments.length ? d.comments.map(function (c) {
          return h('div', { class: 'cm' },
            h('div', { class: 'w' }, h('span', { text: c.icon + ' ' + c.name }), h('span', { text: ago(c.at) }), c.hidden ? h('span', { class: 'badge r', text: '非表示中' }) : null, h('span', { class: 'grow' }),
              c.canDel ? h('button', { class: 'lk', type: 'button', onclick: function () {
                confirmSheet('コメントを消す', 'このコメントを消しますか?', '消す', true).then(function (ok) { if (ok) api('delComment', { u: u, p: p, key: key, c: c.c }).then(function (r) { r.liked = d.liked; draw(r); }).catch(fail); });
              } }, '消す') : null,
              h('button', { class: 'lk', type: 'button', onclick: function () { reportSheet(u, p, key, c.c); } }, '通報')),
            h('div', { text: c.text }));
        }) : h('div', { class: 'meta', text: 'まだコメントはありません。' }),
        h('div', { class: 'row', style: 'margin-top:8px' }, h('div', { class: 'grow' }, inp), me ? act('送る', 'pri', function () {
          if (!inp.value.trim()) return;
          return api('comment', { u: u, p: p, key: key, text: inp.value }).then(function (r) { r.liked = d.liked; draw(r); });
        }) : null),
        me ? h('div', { class: 'meta', style: 'margin-top:4px', text: WARN }) : null
      ]);
    }
    draw(data);
    return wrap;
  }
  function needLogin(msg) {
    return h('div', { class: 'pad' }, h('div', { class: 'card center' }, h('p', { text: msg }), btn('ログイン / 新規登録', 'pri full', function () { go('auth'); })));
  }

  // ---------------------------------------------------------------- 画面
  var VIEWS = {};

  VIEWS.home = function () {
    return api('feed').then(function (r) {
      return h('div', { class: 'pad' },
        !me ? h('div', { class: 'card', style: 'margin-bottom:6px' }, h('div', { style: 'font-weight:700', text: 'ようこそ!じぶんだけのページを作ろう' }),
          h('div', { class: 'note', style: 'margin:4px 0 10px', text: 'プロフィール・ブログ・日記が書けて、見た目もじゆうに変えられます。' }), btn('✏️ じぶんのページをつくる', 'pri full', function () { go('auth'); })) : null,
        h('h2', { class: 'sec', text: '🏡 新しいページ' }),
        r.pages.length ? h('div', { class: 'chips' }, r.pages.map(userChip)) : h('div', { class: 'empty', text: 'まだページがありません。' }),
        h('h2', { class: 'sec', text: '🆕 新着の記事・日記' }),
        r.posts.length ? r.posts.map(postCard) : h('div', { class: 'empty', text: 'まだ記事がありません。さいしょの1つを書いてみよう!' }));
    });
  };

  VIEWS.search = function (p) {
    var q = h('input', { class: 'i', maxlength: 30, placeholder: 'ユーザー名・タグ・題名', value: p.q || '', 'aria-label': 'さがす言葉', enterkeyhint: 'search' });
    var out = h('div'), codeI = h('input', { class: 'i', placeholder: '例: @namae または URL', 'aria-label': 'ページのコード' });
    function run(tagOnly) {
      var s = q.value.trim(); if (!s) return;
      stack[stack.length - 1].p = { q: s };
      out.textContent = ''; out.appendChild(h('div', { class: 'empty', text: 'さがしています…' }));
      api('search', { q: s, tagOnly: !!tagOnly }).then(function (r) {
        out.textContent = '';
        add(out, [h('h2', { class: 'sec', text: '👤 ページ (' + r.users.length + ')' }), r.users.length ? h('div', { class: 'chips' }, r.users.map(userChip)) : h('div', { class: 'empty', text: '見つかりませんでした。' }),
          h('h2', { class: 'sec', text: '📝 記事・日記 (' + r.posts.length + ')' }), r.posts.length ? r.posts.map(postCard) : h('div', { class: 'empty', text: '見つかりませんでした。' })]);
      }).catch(function (e) { out.textContent = ''; out.appendChild(h('div', { class: 'err', text: e.msg })); });
    }
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    var tagsBox = h('div');
    api('feed').then(function (r) { if (r.tags.length) add(tagsBox, [h('h2', { class: 'sec', text: '🏷️ よく使われているタグ' }), r.tags.map(function (t) { return h('button', { class: 'tag', type: 'button', onclick: function () { q.value = t; run(true); } }, '#' + t); })]); }).catch(function () {});
    if (p.q) setTimeout(function () { run(p.tag); }, 0);
    return h('div', { class: 'pad' },
      h('h2', { class: 'sec', text: '🔍 さがす' }),
      h('div', { class: 'row' }, h('div', { class: 'grow' }, q), btn('さがす', 'pri', function () { run(); })),
      out, tagsBox,
      h('h2', { class: 'sec', text: '🔗 URL・コードでひらく' }),
      h('div', { class: 'row' }, h('div', { class: 'grow' }, codeI), btn('ひらく', '', function () { if (!openCode(codeI.value)) toast('コードの形がちがうようです'); })));
  };

  VIEWS.auth = function (p) {
    var mode = p.mode || 'login', box = h('div');
    function draw() {
      var reg = mode === 'register';
      var id = h('input', { class: 'i', autocapitalize: 'none', autocorrect: 'off', autocomplete: 'username', maxlength: 20, placeholder: '例: sora_123', 'aria-label': 'ID' });
      var pw = h('input', { class: 'i', type: 'password', autocomplete: reg ? 'new-password' : 'current-password', maxlength: 72, 'aria-label': 'パスワード' });
      var pw2 = h('input', { class: 'i', type: 'password', autocomplete: 'new-password', maxlength: 72, 'aria-label': 'パスワード(もう一度)' });
      var adm = h('input', { class: 'i', type: 'password', 'aria-label': '管理者の合言葉' }), admBox = h('div', { style: 'display:none' }, field('管理者の合言葉', adm, 'このIDは管理者用です。Netlify に設定した合言葉を入れてください。'));
      var err = h('div');
      function showErr(m) { err.textContent = ''; err.appendChild(h('div', { class: 'err', style: 'margin-top:12px', role: 'alert', text: m })); }
      box.textContent = '';
      add(box, [
        seg({ login: 'ログイン', register: '新規登録' }, mode, function (k) { mode = k; draw(); }),
        field('ID', id, reg ? '半角の英小文字・数字・_ で3〜20文字。本名は使わないでね。' : null),
        field('パスワード', pw, reg ? LIM.pwMin + '文字以上。ほかのサービスと同じものは使わないでください。' : null),
        reg ? field('パスワード(もう一度)', pw2) : null, admBox, err,
        h('div', { style: 'margin-top:16px' }, act(reg ? 'この内容で登録する' : 'ログインする', 'pri full', function () {
          var a = id.value.trim().toLowerCase();
          if (reg && !/^[a-z0-9_]{3,20}$/.test(a)) { showErr('IDは半角の英小文字・数字・_ で3〜20文字にしてください'); return; }
          if (reg && pw.value.length < LIM.pwMin) { showErr('パスワードは' + LIM.pwMin + '文字以上にしてください'); return; }
          if (reg && pw.value !== pw2.value) { showErr('パスワードが2つでちがっています'); return; }
          return api(reg ? 'register' : 'login', { id: a, pw: pw.value, adminCode: adm.value || undefined }).then(function (r) {
            saveToken(r.token); me = r.me; myPage = r.page;
            toast(reg ? '登録できました!ようこそ' : 'ログインしました');
            tab('mine');
          }, function (e) { if (e.code === 'admin_code') admBox.style.display = ''; showErr(e.msg); });
        })),
        reg ? h('p', { class: 'note', text: '※ パスワードを忘れると元にもどせません(メールアドレスを集めていないため)。忘れないようにしてください。' }) : null
      ]);
    }
    draw();
    return h('div', { class: 'pad' }, h('h2', { class: 'sec', text: '🔑 ログイン' }), box);
  };

  function pageHead(pg) {
    return h('div', { class: 'phead' }, h('div', { class: 'big', text: pg.icon }), h('div', { class: 'nm' }, h('span', { class: 'hd', text: pg.name })), h('div', { class: 'id', text: '@' + pg.u }));
  }
  VIEWS.page = function (p) {
    var k = p.u + '/@', cnt = !seen[k];
    return api('getPage', { u: p.u, key: p.key, count: cnt }).then(function (r) {
      seen[k] = true;
      var pg = r.page, el = applyDesign(h('div', { class: 'fullpg' }), pg), kind = p.kind || 'blog', listEl = h('div');
      function drawList() {
        listEl.textContent = '';
        var items = r.posts.filter(function (e) { return e.kind === kind; });
        if (!items.length) { listEl.appendChild(h('div', { class: 'meta', style: 'padding:10px 2px', text: kind === 'blog' ? 'まだブログはありません。' : 'まだ日記はありません。' })); return; }
        items.forEach(function (e) {
          listEl.appendChild(h('button', { class: 'pl', type: 'button', onclick: function () { go('post', { u: pg.u, p: e.p }); } },
            h('div', { class: 'meta' }, fmtDate(e.date), ' ', r.owner ? stateBadges(e) : null),
            h('div', { class: 't', text: e.title || '日記' }), h('div', { class: 'x', text: e.x }),
            h('div', null, e.tags.map(function (t) { return h('span', { class: 'tag', text: '#' + t }); }))));
        });
      }
      drawList();
      add(el, [
        pg.hidden ? h('div', { class: 'err', text: 'このページは管理者により非表示になっています。' }) : null,
        pageHead(pg),
        pg.bio ? h('div', { class: 'box' }, renderBody(pg.bio)) : null,
        r.owner ? h('div', { class: 'row', style: 'justify-content:center' }, btn('🎨 デザイン・プロフィールを編集', 'sm', function () { go('design'); })) : null,
        r.owner ? shareBox(shareCode(pg.u, null, pg.vis === 'unlisted' ? pg.key : null), 'このページの公開範囲: ' + VIS[pg.vis]) : null,
        h('div', { style: 'margin-top:14px' }, seg({ blog: '📝 ブログ', diary: '📅 日記' }, kind, function (x) { kind = x; stack[stack.length - 1].p.kind = x; drawList(); })),
        h('div', { style: 'margin-top:10px' }, listEl),
        social(pg.u, '@', p.key, r)
      ]);
      return el;
    });
  };
  function stateBadges(e) {
    return [e.hidden ? h('span', { class: 'badge r', text: '管理者が非表示' }) : null,
      e.status === 'draft' ? h('span', { class: 'badge y', text: '下書き' }) : h('span', { class: 'badge g', text: '公開' }),
      e.status === 'public' ? h('span', { class: 'badge', text: e.vis === 'public' ? '🌏全体' : e.vis === 'unlisted' ? '🔗URLのみ' : '🔒自分だけ' }) : null];
  }

  VIEWS.post = function (p) {
    var k = p.u + '/' + p.p, cnt = !seen[k];
    return api('getPost', { u: p.u, p: p.p, count: cnt }).then(function (r) {
      seen[k] = true;
      var po = r.post, el = applyDesign(h('div', { class: 'fullpg' }), r.author);
      add(el, [
        h('button', { class: 'pl', type: 'button', style: 'display:flex;align-items:center;gap:8px', onclick: function () { go('page', { u: po.u }); } },
          r.owner && gIcon && po.kind === 'diary' ? gImg(34) : h('span', { style: 'font-size:24px', text: r.author.icon }), h('span', { class: 't', text: r.author.name }), h('span', { class: 'meta', text: 'のページへ ›' })),
        po.hidden ? h('div', { class: 'err', text: 'この記事は管理者により非表示になっています。' }) : null,
        h('div', { class: 'meta' }, (po.kind === 'diary' ? '📅 日記 ' : '📝 ブログ ') + fmtDate(po.date) + ' ', r.owner ? stateBadges(po) : null),
        h('h1', { class: 'pt' }, h('span', { class: 'hd', text: po.title || fmtDate(po.date) + ' の日記' })),
        h('div', null, po.tags.map(function (t) { return h('button', { class: 'tag', type: 'button', onclick: function () { go('search', { q: t, tag: true }); } }, '#' + t); })),
        renderBody(po.body),
        r.owner ? h('div', { class: 'row' }, btn('✏️ 編集する', 'sm', function () { go('edit', { p: po.p }); }), btn('📮 Gravityに投稿する', 'sm pri', function () { gravitySheet(po, r.author); })) : null,
        r.owner && po.status === 'public' && po.vis !== 'private' ? shareBox(shareCode(po.u, po.p), 'この記事の公開範囲: ' + VIS[po.vis]) : null,
        social(po.u, po.p, null, r)
      ]);
      return el;
    });
  };

  VIEWS.mine = function (p) {
    if (!me) return needLogin('じぶんのページを作るには、ログインか新規登録をしてください。');
    return api('myPosts').then(function (r) {
      var kind = p.kind || 'blog', body = h('div'), posts = r.posts, d = new Date(), ym = p.ym || [d.getFullYear(), d.getMonth()];
      function row(e) {
        return h('button', { class: 'card', type: 'button', onclick: function () { go('edit', { p: e.p }); } },
          h('div', null, stateBadges(e)), h('div', { class: 't', text: e.title || fmtDate(e.date) + ' の日記' }),
          h('div', { class: 'note', text: fmtDate(e.date) + ' ・ タップで編集' }));
      }
      function draw() {
        body.textContent = '';
        if (kind === 'blog') {
          var bl = posts.filter(function (e) { return e.kind === 'blog'; });
          add(body, [btn('📝 新しいブログ記事を書く', 'pri full', function () { go('edit', { kind: 'blog' }); }), h('div', { style: 'height:12px' }),
            bl.length ? bl.map(row) : h('div', { class: 'empty', text: 'まだ記事がありません。' })]);
          return;
        }
        var y = ym[0], m = ym[1], first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), cal = h('div', { class: 'cal' }), byDate = {};
        posts.forEach(function (e) { if (e.kind === 'diary') byDate[e.date] = e; });
        '日月火水木金土'.split('').forEach(function (w) { cal.appendChild(h('div', { class: 'w', text: w })); });
        for (var i = 0; i < first; i++) cal.appendChild(h('div'));
        for (var dd = 1; dd <= days; dd++) (function (dd) {
          var ds = y + '-' + ('0' + (m + 1)).slice(-2) + '-' + ('0' + dd).slice(-2), e = byDate[ds];
          cal.appendChild(h('button', { type: 'button', class: (e ? 'has ' : '') + (ds === today() ? 'td' : ''), 'aria-label': ds + (e ? ' 日記あり' : ''), onclick: function () { go('edit', e ? { p: e.p } : { kind: 'diary', date: ds }); } }, String(dd)));
        })(dd);
        function mv(n) { var t = new Date(y, m + n, 1); ym = [t.getFullYear(), t.getMonth()]; stack[stack.length - 1].p.ym = ym; draw(); }
        var inMonth = posts.filter(function (e) { return e.kind === 'diary' && e.date.slice(0, 7) === y + '-' + ('0' + (m + 1)).slice(-2); });
        add(body, [h('div', { class: 'row', style: 'justify-content:space-between;margin-bottom:8px' }, btn('‹ 前の月', 'sm sub', function () { mv(-1); }), h('b', { text: y + '年' + (m + 1) + '月' }), btn('次の月 ›', 'sm sub', function () { mv(1); })),
          cal, h('p', { class: 'note', text: '日にちをタップすると、その日の日記を書けます(1日1つ)。' }), btn('📅 今日の日記を書く', 'pri full', function () { var e = byDate[today()]; go('edit', e ? { p: e.p } : { kind: 'diary', date: today() }); }),
          h('div', { style: 'height:12px' }), inMonth.map(row)]);
      }
      draw();
      var th = effective(myPage || {});
      return h('div', { class: 'pad' },
        h('div', { class: 'card', style: 'display:flex;gap:12px;align-items:center' },
          h('span', { class: 'ico', style: 'width:52px;height:52px;font-size:30px;background:' + th.bg, text: (myPage && myPage.icon) || '🌱' }),
          h('div', { style: 'flex:1;min-width:0' }, h('div', { style: 'font-weight:700', text: (myPage && myPage.name) || me.id }), h('div', { class: 'note', text: '@' + me.id + ' ・ ' + (myPage ? VIS[myPage.vis] : '') }))),
        h('div', { class: 'row', style: 'margin:12px 0 4px' }, h('div', { class: 'grow' }, btn('👀 ページを見る', 'full', function () { go('page', { u: me.id }); })), h('div', { class: 'grow' }, btn('🎨 デザイン', 'full', function () { go('design'); }))),
        h('h2', { class: 'sec', text: '✏️ 書いたもの (' + posts.length + '/100)' }),
        seg({ blog: '📝 ブログ', diary: '📅 日記カレンダー' }, kind, function (x) { kind = x; stack[stack.length - 1].p.kind = x; draw(); }),
        h('div', { style: 'margin-top:12px' }, body));
    });
  };

  VIEWS.edit = function (p) {
    if (!me) return needLogin('書くにはログインがいります。');
    var load = p.p ? api('getPost', { u: me.id, p: p.p }).then(function (r) { return r.post; }) : Promise.resolve({ kind: p.kind || 'blog', title: '', body: '', date: p.date || today(), tags: [], status: 'draft', vis: 'public' });
    return load.then(function (po) {
      var st = { status: po.status, vis: po.vis };
      var title = h('input', { class: 'i', maxlength: 80, value: po.title, placeholder: po.kind === 'diary' ? '題名(なくてもOK)' : '題名', 'aria-label': '題名' });
      var date = h('input', { class: 'i', type: 'date', value: po.date, 'aria-label': '日付' });
      var tags = h('input', { class: 'i', value: po.tags.join(' '), placeholder: '例: おえかき ねこ', autocapitalize: 'none', 'aria-label': 'タグ' });
      var body = h('textarea', { class: 'i', 'aria-label': '本文', placeholder: 'ここに本文を書きます' }); body.value = po.body;
      var cnt = h('div', { class: 'cnt' }), pv = applyDesign(h('div'), myPage || {}), visBox = h('div');
      function tagList() { return tags.value.split(/[\s,、#＃]+/).filter(Boolean).slice(0, 12); }
      function preview() {
        var n = count(body.value); cnt.textContent = n + ' / ' + LIM.body + '文字'; cnt.className = 'cnt' + (n > LIM.body ? ' over' : '');
        pv.textContent = '';
        add(pv, [h('div', { class: 'meta' }, po.kind === 'diary' && gIcon ? [gImg(30), ' '] : null, (po.kind === 'diary' ? '📅 日記 ' : '📝 ブログ ') + fmtDate(date.value)),
          h('h1', { class: 'pt' }, h('span', { class: 'hd', text: title.value || (po.kind === 'diary' ? fmtDate(date.value) + ' の日記' : '(題名)') })),
          h('div', null, tagList().map(function (t) { return h('span', { class: 'tag', text: '#' + t }); })), renderBody(body.value)]);
      }
      [title, date, tags, body].forEach(function (x) { x.addEventListener('input', preview); });
      function ins(pre, suf, line) {
        var s = body.selectionStart || 0, e = body.selectionEnd || 0, v = body.value, sel = v.slice(s, e);
        if (line) { var ls = v.lastIndexOf('\n', s - 1) + 1; body.value = v.slice(0, ls) + pre + v.slice(ls); s = e = e + pre.length; }
        else { body.value = v.slice(0, s) + pre + (sel || (suf ? '文字' : '')) + (suf || '') + v.slice(e); e = s + pre.length + (sel || (suf ? '文字' : '')).length; s = s + pre.length; }
        body.focus(); try { body.setSelectionRange(s, e); } catch (x) {} preview();
      }
      function drawVis() {
        visBox.textContent = '';
        add(visBox, st.status === 'draft' ? h('div', { class: 'note', text: '下書きのあいだは、じぶんにしか見えません。' })
          : [h('label', { class: 'f', text: '公開範囲' }), seg(VIS, st.vis, function (k) { st.vis = k; })]);
      }
      drawVis(); preview();
      function save() {
        var t = tagList();
        if (t.length > LIM.tags) { toast('タグは' + LIM.tags + '個までです'); return; }
        if (count(body.value) > LIM.body) { toast('本文が長すぎます(' + LIM.body + '文字まで)'); return; }
        return api('savePost', { post: { p: p.p || undefined, kind: po.kind, title: title.value, body: body.value, date: date.value, tags: t, status: st.status, vis: st.vis } }).then(function (r) {
          toast(st.status === 'draft' ? '下書きを保存しました' : '保存して公開しました');
          stack.pop(); stack.push({ v: 'post', p: { u: me.id, p: r.post.p } }); show();
        });
      }
      return h('div', { class: 'pad' },
        h('h2', { class: 'sec', text: (p.p ? '✏️ 編集: ' : '🆕 新しく書く: ') + (po.kind === 'diary' ? '日記' : 'ブログ') }),
        h('div', { class: 'warn', role: 'note', text: WARN }),
        po.hidden ? h('div', { class: 'err', style: 'margin-top:8px', text: 'この記事は管理者により非表示になっています。' }) : null,
        field('題名', title), field('日付', date), field('タグ(スペースで区切る・' + LIM.tags + '個まで)', tags),
        h('label', { class: 'f', text: '本文' }),
        h('div', { class: 'tools' },
          h('button', { type: 'button', onclick: function () { ins('**', '**'); } }, h('b', { text: '太字' })),
          h('button', { type: 'button', onclick: function () { ins('# ', '', true); } }, '見出し'),
          h('button', { type: 'button', onclick: function () { ins('## ', '', true); } }, '小見出し'),
          h('button', { type: 'button', onclick: function () { ins('- ', '', true); } }, '・箇条書き'),
          h('button', { type: 'button', onclick: function () { ins('> ', '', true); } }, '引用'),
          h('button', { type: 'button', onclick: function () { ins('\n---\n', ''); } }, '区切り線')),
        body, cnt,
        h('div', { class: 'note', text: '書き方: **太字** / # 見出し / - 箇条書き / > 引用 / --- 区切り線。HTMLやリンクは使えません。' }),
        h('h2', { class: 'sec', text: '👀 プレビュー' }), pv,
        h('label', { class: 'f', text: '下書き / 公開' }),
        seg({ draft: '📦 下書き', public: '📣 公開する' }, st.status, function (k) { st.status = k; drawVis(); }),
        visBox,
        h('div', { class: 'col', style: 'margin-top:18px' }, act('💾 保存する', 'pri full', save),
          p.p ? btn('🗑️ この記事を削除', 'dan full', function () {
            confirmSheet('記事を削除', 'この記事を完全に消します。元にはもどせません。', '削除する', true).then(function (ok) {
              if (ok) api('deletePost', { p: p.p }).then(function () { toast('削除しました'); tab('mine'); }).catch(fail);
            });
          }) : null));
    });
  };

  VIEWS.design = function () {
    if (!me) return needLogin('ログインがいります。');
    return api('me').then(function (r) {
      myPage = r.page;
      var d = JSON.parse(JSON.stringify(r.page)), pv = h('div'), warnEl = h('div'), ctl = h('div');
      var name = h('input', { class: 'i', maxlength: LIM.name, value: d.name, 'aria-label': '名前' });
      var bio = h('textarea', { class: 'i', style: 'min-height:120px', 'aria-label': 'じこしょうかい' }); bio.value = d.bio;
      var bioCnt = h('div', { class: 'cnt' });
      function preview() {
        d.name = name.value || me.id; d.bio = bio.value;
        var n = count(bio.value); bioCnt.textContent = n + ' / ' + LIM.bio + '文字'; bioCnt.className = 'cnt' + (n > LIM.bio ? ' over' : '');
        var el = applyDesign(h('div'), d);
        add(el, [pageHead(d), d.bio ? h('div', { class: 'box' }, renderBody(d.bio)) : null,
          h('h3', { class: 'hdw' }, h('span', { class: 'hd', text: '見出しのみほん' })), h('div', { class: 'body' }, h('p', null, 'ふつうの文字と', h('strong', { text: '太字' }), 'はこう見えます。'))]);
        pv.textContent = ''; pv.appendChild(el);
        var e = effective(d); warnEl.textContent = '';
        if (contrast(e.bg, e.fg) < 3) warnEl.appendChild(h('div', { class: 'warn', style: 'margin-top:8px', text: '背景色と文字色が近くて、読みにくいかもしれません。' }));
      }
      function swatches(list, key) {
        var el = h('div', { class: 'sw' });
        function draw() {
          el.textContent = '';
          list.forEach(function (c) { el.appendChild(h('button', { type: 'button', style: 'background:' + c, class: d[key] === c ? 'on' : '', 'aria-label': c, onclick: function () { d[key] = c; draw(); preview(); } })); });
          var ci = h('input', { type: 'color', value: isHex(d[key]) ? d[key] : effective(d)[key], 'aria-label': 'じゆうに色をえらぶ' });
          ci.addEventListener('input', function () { if (isHex(ci.value)) { d[key] = ci.value.toLowerCase(); preview(); } });
          el.appendChild(ci);
          el.appendChild(btn('テーマの色', 'sm sub', function () { d[key] = ''; draw(); preview(); }));
        }
        draw(); return el;
      }
      function drawCtl() {
        ctl.textContent = '';
        var tg = h('div', { class: 'grid' });
        Object.keys(THEMES).forEach(function (k) {
          var t = THEMES[k];
          tg.appendChild(h('button', { type: 'button', class: d.theme === k ? 'on' : '', style: 'background-color:' + t.bg + ';color:' + t.fg, 'aria-label': 'テーマ ' + t.n, onclick: function () { d.theme = k; d.bg = ''; d.fg = ''; drawCtl(); preview(); } },
            h('div', { style: 'font-size:20px', text: t.e }), t.n));
        });
        var ig = h('div', { class: 'grid em' });
        ICONS.forEach(function (ic) { ig.appendChild(h('button', { type: 'button', class: d.icon === ic ? 'on' : '', onclick: function () { d.icon = ic; drawCtl(); preview(); } }, ic)); });
        var fo = {}, de = {}; Object.keys(FONTS).forEach(function (k) { fo[k] = FONTS[k].n; });
        add(ctl, [
          h('label', { class: 'f', text: 'テーマ (' + Object.keys(THEMES).length + '種類)' }), tg,
          h('label', { class: 'f', text: '背景色' }), swatches(BGS, 'bg'),
          h('label', { class: 'f', text: '文字色' }), swatches(FGS, 'fg'), warnEl,
          h('label', { class: 'f', text: 'フォント' }), seg(fo, d.font, function (k) { d.font = k; preview(); }),
          h('label', { class: 'f', text: '見出しの飾り' }), seg(DECOS, d.deco, function (k) { d.deco = k; preview(); }),
          h('label', { class: 'f', text: 'アイコンの絵文字' }), ig
        ]);
      }
      name.addEventListener('input', preview); bio.addEventListener('input', preview);
      drawCtl(); preview();
      return h('div', null,
        h('div', { style: 'position:sticky;top:0;z-index:5;background:#f6efe2;padding:10px 14px 8px;border-bottom:2px dashed #d9c7a3;max-height:38vh;overflow:auto' }, h('div', { class: 'note', text: '👀 プレビュー(下で変えるとすぐ反映)' }), pv),
        h('div', { class: 'pad' },
          h('div', { class: 'warn', role: 'note', text: WARN }),
          field('名前(ニックネーム)', name), field('じこしょうかい', bio), bioCnt, ctl,
          h('label', { class: 'f', text: 'プロフィールページの公開範囲' }), seg(VIS, d.vis, function (k) { d.vis = k; }),
          h('div', { style: 'margin-top:18px' }, act('💾 保存する', 'pri full', function () {
            return api('savePage', { page: { name: name.value, bio: bio.value, icon: d.icon, theme: d.theme, bg: d.bg || '', fg: d.fg || '', font: d.font, deco: d.deco, vis: d.vis } }).then(function (r2) {
              myPage = r2.page; toast('保存しました'); refreshChrome();
            });
          }))));
    });
  };

  VIEWS.settings = function () {
    var kids = [];
    if (me) {
      kids.push(h('div', { class: 'card' }, h('div', { text: 'ログイン中: @' + me.id + (me.admin ? '(管理者)' : '') }),
        h('div', { class: 'col', style: 'margin-top:10px' },
          me.admin ? btn('🛡️ 管理画面(通報の確認)', 'full pri', function () { go('admin'); }) : null,
          act('ログアウト', 'full', function () { return api('logout').catch(function () {}).then(function () { saveToken(null); me = null; myPage = null; toast('ログアウトしました'); tab('home'); }); }),
          btn('パスワードを変える', 'full sub', function () {
            sheet('パスワードを変える', function (sh, close) {
              var a = h('input', { class: 'i', type: 'password', placeholder: '今のパスワード', autocomplete: 'current-password' }), b = h('input', { class: 'i', type: 'password', placeholder: '新しいパスワード(' + LIM.pwMin + '文字以上)', autocomplete: 'new-password', style: 'margin-top:8px' });
              add(sh, [a, b, h('div', { class: 'col', style: 'margin-top:12px' }, act('変更する', 'full pri', function () {
                return api('changePw', { pw: a.value, newPw: b.value }).then(function (r) { saveToken(r.token); close(); toast('パスワードを変えました'); });
              }), btn('やめる', 'full sub', close))]);
            });
          }),
          btn('アカウントを完全に削除', 'full dan', function () {
            sheet('アカウントの削除', function (sh, close) {
              var a = h('input', { class: 'i', type: 'password', placeholder: 'パスワード', autocomplete: 'current-password', 'aria-label': 'パスワード' });
              add(sh, [h('p', { text: 'プロフィール・記事・日記・コメント・いいねをすべて消します。元にはもどせません。' }), a,
                h('div', { class: 'col', style: 'margin-top:12px' }, act('すべて削除する', 'full dan', function () {
                  return api('deleteAccount', { pw: a.value }).then(function () { saveToken(null); me = null; myPage = null; close(); toast('アカウントを削除しました'); tab('home'); });
                }), btn('やめる', 'full sub', close))]);
            });
          }))));
    } else kids.push(h('div', { class: 'card center' }, h('p', { text: 'ログインしていません。' }), btn('ログイン / 新規登録', 'pri full', function () { go('auth'); })));
    kids.push(h('h2', { class: 'sec', text: '📖 きまり' }), h('div', { class: 'card' }, h('ul', { style: 'margin:0;padding-left:1.2em;font-size:14.5px' },
      ['本名、住所、学校名、連絡先は書かないでください。', 'ほかの人をきずつけることは書かないでください。', 'こまった内容を見つけたら「🚩 通報」ボタンで知らせてください。', '画像はのせられません。文字と絵文字だけで楽しもう。', 'パスワードはだれにも教えないでください。'].map(function (t) { return h('li', { text: t }); }))));
    kids.push(h('h2', { class: 'sec', text: '🪪 Gravity のアイコン' }), h('div', { class: 'card' },
      h('div', { class: 'row' }, gIcon ? gImg(44) : h('span', { style: 'font-size:30px', text: '🔎' }), h('div', { class: 'grow', style: 'font-size:14.5px', text: gIcon ? '自動で読み取れました。日記と投稿用カードに使います(この端末の中だけで使い、サーバーには送りません)。' : 'いまの場所からは読み取れませんでした。かわりに絵文字のアイコンを使います。' })),
      h('div', { style: 'margin-top:10px' }, btn('読み取りのようすを見る', 'sm sub', function () {
        sheet('🔎 読み取りのようす', function (sh, close) {
          var ta = h('textarea', { class: 'i', readonly: true, style: 'min-height:210px;font-size:12.5px', 'aria-label': '読み取りのようす' }); ta.value = diagText();
          add(sh, [h('p', { class: 'note', text: '名前だけを表示しています(中身やパスワードは出しません)。うまく読み取れないときは、この画面のスクリーンショットを作った人に送ってください。' }), ta, h('div', { style: 'margin-top:12px' }, btn('とじる', 'full sub', close))]);
        });
      }))));
    kids.push(h('p', { class: 'note center', text: 'こじんページ v1.1 ・ 通信: ' + (transport || '-') }));
    return h('div', { class: 'pad' }, h('h2', { class: 'sec', text: '⚙️ せってい' }), kids);
  };

  VIEWS.admin = function () {
    if (!me || !me.admin) return h('div', { class: 'pad' }, h('div', { class: 'err', text: '管理者だけが使えます。' }));
    return api('adminReports').then(function (r) {
      function doAct(rep, op, label, danger) {
        return btn(label, 'sm ' + (danger ? 'dan' : 'sub'), function () {
          var run = function () { api('adminAct', { op: op, u: rep.u, p: rep.p, c: rep.c, rkey: rep.rkey }).then(function () { toast('実行しました'); show(); }).catch(fail); };
          if (danger) confirmSheet(label, '「' + label + '」を実行します。元にはもどせません。', '実行する', true).then(function (ok) { if (ok) run(); }); else run();
        });
      }
      var open = r.reports.filter(function (x) { return x.open; }).length;
      return h('div', { class: 'pad' },
        h('h2', { class: 'sec', text: '🛡️ 通報の一覧(未対応 ' + open + '件)' }),
        r.reports.length ? r.reports.map(function (rep) {
          var kindN = { page: 'プロフィール', post: '記事・日記', comment: 'コメント' }[rep.kind];
          return h('div', { class: 'card', style: 'margin-bottom:12px' + (rep.open ? '' : ';opacity:.6') },
            h('div', null, h('span', { class: 'badge ' + (rep.open ? 'r' : 'g'), text: rep.open ? '未対応' : '対応ずみ' }), h('span', { class: 'badge', text: kindN }),
              rep.hidden ? h('span', { class: 'badge y', text: '非表示中' }) : null, rep.gone ? h('span', { class: 'badge', text: '削除ずみ' }) : null),
            h('div', { class: 'note', text: '理由: ' + (REASONS[rep.reason] || rep.reason) + (rep.note ? ' / メモ: ' + rep.note : '') }),
            h('div', { class: 'note', text: '書いた人: @' + (rep.kind === 'comment' && rep.cby ? rep.cby + '(@' + rep.u + ' のページ上)' : rep.u) + ' ・ 通報: ' + (rep.by === 'guest' ? 'ゲスト' : '@' + rep.by) + ' ・ ' + ago(rep.at) }),
            rep.gone ? null : h('div', { style: 'background:#fff;border:1.5px dashed #bfae8c;border-radius:10px;padding:8px 10px;margin:8px 0;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto', text: rep.snippet || '' }),
            h('div', { class: 'row' },
              rep.gone ? null : btn('見る', 'sm sub', function () { if (rep.p === '@') go('page', { u: rep.u }); else go('post', { u: rep.u, p: rep.p }); }),
              rep.gone ? null : (rep.hidden ? doAct(rep, 'show', '表示にもどす') : doAct(rep, 'hide', '非表示にする')),
              rep.gone || rep.kind === 'page' ? null : doAct(rep, 'delete', '削除する', true),
              rep.gone ? null : doAct(rep, 'deleteUser', 'このページの持ち主を削除', true),
              rep.open ? doAct(rep, 'close', '対応ずみにする') : null));
        }) : h('div', { class: 'empty', text: '通報はありません。' }));
    });
  };

  // ---------------------------------------------------------------- 起動
  function boot() {
    try {
      if (!document.querySelector('meta[name=viewport]')) {
        var mv = document.createElement('meta'); mv.name = 'viewport'; mv.content = 'width=device-width,initial-scale=1,viewport-fit=cover';
        (document.head || document.documentElement).appendChild(mv);
      }
    } catch (e) {}
    host = document.createElement('div');
    host.id = 'kojin-page-root';
    host.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;z-index:2147483000;background:#f6efe2;margin:0;padding:0;';
    root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
    var logo = h('canvas', { width: 68, height: 68, 'aria-hidden': 'true' });
    ttlEl = h('div', { class: 'ttl', text: 'こじんページ' }); whoEl = h('div', { class: 'who' });
    barEl = h('div', { class: 'bar' }); mainEl = h('div', { class: 'main' }); tabsEl = h('div', { class: 'tabs', role: 'navigation' });
    var emb = false; try { emb = location.origin + '/' !== BASE; } catch (e) {}
    app = h('div', { class: 'app', lang: 'ja' }, emb ? h('div', { class: 'top emb' }, h('div', { class: 'tt' }, ttlEl, whoEl)) : h('div', { class: 'top' }, logo, ttlEl, whoEl), barEl, mainEl, tabsEl);
    root.appendChild(app);
    document.body.appendChild(host);
    try { drawLogo(logo); } catch (e) {}

    var deep = null;
    try { var m = /#p=([^&]+)/.exec(location.hash || ''); if (m) deep = decodeURIComponent(m[1]); } catch (e) {}
    detectGravityIcon();
    token = loadToken();
    var start = token ? api('me').then(function (r) { me = r.me; myPage = r.page; }, function () {}) : Promise.resolve();
    start.then(function () { show(); if (deep) openCode(deep); });
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
