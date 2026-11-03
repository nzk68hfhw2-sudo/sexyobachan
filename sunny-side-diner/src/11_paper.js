// ---- paper textures (canvas -> data URL) and document overlays ----------------------
function paperCanvas(w, h, o) {
  o = o || {};
  var c = mkCanvas(w, h), g = c.getContext('2d'), rnd = makeRNG(o.seed || 3);
  g.save();
  if (o.torn) { // jagged outline
    g.beginPath(); var j = o.torn;
    g.moveTo(0, j * rnd()); for (var x = 0; x <= w; x += 6) g.lineTo(x, (o.tornTop ? j * rnd() : 0));
    for (var y = 0; y <= h; y += 6) g.lineTo(w - (o.tornSide ? j * rnd() : 0), y);
    for (var x2 = w; x2 >= 0; x2 -= 6) g.lineTo(x2, h - j * rnd());
    for (var y2 = h; y2 >= 0; y2 -= 6) g.lineTo((o.tornSide ? j * rnd() : 0), y2);
    g.closePath(); g.clip();
  }
  g.fillStyle = o.base || '#f6ecd4'; g.fillRect(0, 0, w, h);
  // fibers
  var nf = o.fibers == null ? 1 : o.fibers;
  for (var i = 0; i < 2600 * nf; i++) { var fx = rnd() * w, fy = rnd() * h, a = rnd() * TAU, l = 2 + rnd() * 7; g.strokeStyle = rnd() < 0.5 ? 'rgba(120,95,60,' + rnd() * 0.08 + ')' : 'rgba(255,255,255,' + rnd() * 0.18 + ')'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * l, fy + Math.sin(a) * l); g.stroke(); }
  // mottling
  for (var m = 0; m < 40; m++) smudge(g, rnd() * w, rnd() * h, 20 + rnd() * 90, 'rgba(' + (o.mottle || '150,120,70') + ',A)', 0.05 * (o.age == null ? 1 : o.age));
  if (o.lines) { // ruled lines
    for (var ly = o.lines.top; ly < h - 10; ly += o.lines.gap) { g.fillStyle = o.lines.col || 'rgba(90,140,190,0.35)'; g.fillRect(0, ly, w, 1.3); }
    if (o.lines.margin) { g.fillStyle = 'rgba(210,60,70,0.45)'; g.fillRect(o.lines.margin, 0, 1.4, h); }
  }
  // yellowed edges
  var age = o.age == null ? 1 : o.age;
  var eg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  eg.addColorStop(0, 'rgba(160,120,50,0)'); eg.addColorStop(1, 'rgba(160,110,40,' + 0.38 * age + ')'); g.fillStyle = eg; g.fillRect(0, 0, w, h);
  // stains
  (o.rings || 0) && ring(g, w * (0.6 + rnd() * 0.3), h * (0.65 + rnd() * 0.25), w * 0.13, 'rgb(120,70,25)', 0.32, 5);
  if (o.grease) for (var q = 0; q < o.grease; q++) smudge(g, rnd() * w, rnd() * h, 18 + rnd() * 30, 'rgba(190,150,70,A)', 0.22);
  // folds
  if (o.fold) {
    [0.5].concat(o.fold === 2 ? [0.33, 0.66] : []).forEach(function (f) {
      var fy2 = h * f, gr = g.createLinearGradient(0, fy2 - 6, 0, fy2 + 6);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.45, 'rgba(90,70,40,0.18)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, fy2 - 6, w, 12);
    });
  }
  if (o.corner) { // dog-ear bottom-right
    g.fillStyle = 'rgba(0,0,0,0.0)'; var cs = w * 0.1;
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(w, h - cs); g.lineTo(w, h); g.lineTo(w - cs, h); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
    var cg = g.createLinearGradient(w - cs, h - cs, w - cs * 0.5, h - cs * 0.5); cg.addColorStop(0, '#d9ccb0'); cg.addColorStop(1, '#f4ead0');
    g.fillStyle = cg; g.beginPath(); g.moveTo(w, h - cs); g.lineTo(w - cs, h - cs); g.lineTo(w - cs, h); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(w, h - cs); g.lineTo(w - cs, h); g.lineTo(w - cs - 3, h); g.lineTo(w, h - cs - 3); g.fill();
  }
  if (o.halftone) for (var hy = 0; hy < h; hy += 3) for (var hx = 0; hx < w; hx += 3) if (rnd() < 0.05) { g.fillStyle = 'rgba(40,40,40,0.08)'; g.fillRect(hx, hy, 1, 1); }
  g.restore();
  return c;
}
function grimeCanvas() {
  var c = mkCanvas(128, 128), g = c.getContext('2d'), rnd = makeRNG(12);
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  for (var i = 0; i < 14; i++) smudge(g, rnd() * 128, rnd() * 128, 10 + rnd() * 30, 'rgba(90,60,30,A)', 0.5);
  g.strokeStyle = 'rgba(40,20,10,0.8)'; g.lineWidth = 1;
  for (var k = 0; k < 5; k++) { var x = rnd() * 128, y = rnd() * 128; g.beginPath(); g.moveTo(x, y); for (var s = 0; s < 6; s++) { x += (rnd() - 0.5) * 30; y += (rnd() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
  return c;
}
function buildPapers() {
  var u = function (c, q) { try { return q ? c.toDataURL('image/jpeg', q) : c.toDataURL('image/png'); } catch (e) { return ''; } };
  PAPER.slip = u(paperCanvas(360, 420, { base: '#eaf1df', age: 0.4, fibers: 0.5, lines: { top: 92, gap: 51, col: 'rgba(47,126,110,0.18)' }, seed: 5 }), 0.85);
  PAPER.rules = u(paperCanvas(560, 880, { base: '#f4e9cf', age: 0.9, rings: 1, grease: 3, fold: 1, seed: 7 }), 0.86);
  PAPER.fake = u(paperCanvas(560, 600, { base: '#fbfbf8', age: 0.08, fibers: 0.2, mottle: '200,200,210', seed: 9 }), 0.9);
  PAPER.sticky = u(paperCanvas(400, 400, { base: '#f7e27a', age: 0.35, fibers: 0.4, mottle: '200,160,40', seed: 11 }), 0.88);
  PAPER.receipt = u(paperCanvas(300, 900, { base: '#f7f5ee', age: 0.15, fibers: 0.25, mottle: '190,190,180', seed: 13, torn: 7 }));
  PAPER.news = u(paperCanvas(560, 760, { base: '#e6dcc2', age: 1.2, fibers: 1.4, mottle: '130,110,70', fold: 2, halftone: 1, seed: 15, torn: 9, tornSide: 1, tornTop: 1 }));
  PAPER.flyer = u(paperCanvas(560, 760, { base: '#efe6cf', age: 1.0, fibers: 1, fold: 2, corner: 1, rings: 1, seed: 17 }));
  PAPER.diary = u(paperCanvas(560, 700, { base: '#f2ead6', age: 0.8, lines: { top: 70, gap: 34, margin: 60 }, seed: 19, torn: 10, tornTop: 1 }));
  PAPER.ticket = u(paperCanvas(320, 520, { base: '#e7f0dd', age: 0.4, fibers: 0.5, lines: { top: 110, gap: 38, col: 'rgba(47,126,110,0.22)' }, seed: 21, grease: 1 }), 0.85);
  PAPER.polaroid = u(paperCanvas(420, 500, { base: '#f7f4ea', age: 0.4, fibers: 0.3, seed: 23 }), 0.88);
  PAPER.ad = u(paperCanvas(560, 820, { base: '#e8dfc6', age: 1.0, fibers: 1.3, halftone: 1, seed: 25, fold: 1 }), 0.86);
  PAPER.grime = u(grimeCanvas(), 0.8);
  UI.style.setProperty('--grime', 'url(' + PAPER.grime + ')');
  var st = document.createElement('style'); st.textContent = DOC_CSS; (document.head || document.documentElement).appendChild(st);
}
var DOC_CSS = [
  '.docwrap{position:absolute;left:0;right:0;top:calc(var(--top-safe) + 6px);bottom:calc(env(safe-area-inset-bottom,0px) + 96px);overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;align-items:center;padding:10px 0 30px;}',
  '.doc{position:relative;width:min(350px,calc(100% - 40px));flex:0 0 auto;margin:10px 0;color:#22201c;background-size:100% 100%;filter:drop-shadow(0 12px 18px rgba(0,0,0,.5)) drop-shadow(0 2px 2px rgba(0,0,0,.35));animation:docin .46s cubic-bezier(.2,.9,.25,1.1) both;}',
  '@keyframes docin{0%{opacity:0;transform:translateY(70px) rotate(var(--r1,6deg)) scale(.96)}100%{opacity:1;transform:translateY(0) rotate(var(--r,-1.5deg)) scale(1)}}',
  '.doc.out{animation:docout .3s ease-in both}@keyframes docout{to{opacity:0;transform:translateY(60px) rotate(4deg)}}',
  // laminated rules sheet
  '.rules{padding:30px 24px 26px;border-radius:6px;}',
  '.rules::after{content:"";position:absolute;inset:0;border-radius:6px;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.28) 42%,rgba(255,255,255,0) 52%),linear-gradient(0deg,rgba(255,255,255,.06),rgba(255,255,255,.12));box-shadow:inset 0 0 0 2px rgba(255,255,255,.35),inset 0 0 0 5px rgba(200,190,160,.25);}',
  '.tape{position:absolute;width:86px;height:26px;background:rgba(232,222,186,.72);box-shadow:0 1px 2px rgba(0,0,0,.18);clip-path:polygon(3% 0,97% 4%,100% 30%,96% 60%,100% 100%,4% 96%,0 70%,3% 40%);z-index:2;}',
  '.rules .rlogo{font:400 26px/1 Pacifico,cursive;color:#c8282e;text-align:center;}',
  '.rules h2{margin:6px 0 2px;font:400 21px/1.15 "Special Elite",monospace;text-align:center;letter-spacing:.06em;color:#22201c;}',
  '.rules .sub2{font:400 13px/1.3 "Special Elite",monospace;text-align:center;color:#555;margin-bottom:12px;}',
  '.rule{display:flex;gap:10px;margin:12px 0;}',
  '.rule .n{flex:0 0 26px;height:26px;border-radius:50%;border:1.6px solid #22201c;font:400 14px/23px "Special Elite",monospace;text-align:center;}',
  '.rule .e{font:400 14.5px/1.38 "Special Elite",monospace;color:#23211d;}',
  '.rule .j{font:500 12px/1.45 "Zen Kaku Gothic New",sans-serif;color:#5a5244;margin-top:3px;}',
  '.redpen{font:700 19px/1.1 Caveat,cursive;color:#c3161c;transform:rotate(-2deg);display:inline-block;margin-top:2px;}',
  '.redpen.ja{font:600 12px/1.2 "Klee One",serif;}',
  '.ul{background:linear-gradient(transparent 78%,rgba(195,22,28,.55) 78%,rgba(195,22,28,.55) 90%,transparent 90%);}',
  '.sig{font:700 26px/1 Caveat,cursive;color:#2a2a4a;text-align:right;margin-top:14px;transform:rotate(-3deg);}',
  // fake rule card
  '.fake{padding:26px 22px 22px;border-radius:1px;--r:2.4deg;}',
  '.fake .pin{position:absolute;left:50%;top:6px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff7a7a,#b01018);box-shadow:0 3px 4px rgba(0,0,0,.4);}',
  '.fake .e{font:400 25px/1.15 "Reenie Beanie",cursive;color:#1b2a4a;}',
  '.fake .j{font:600 12.5px/1.5 "Klee One",serif;color:#2b3a5a;margin-top:6px;}',
  '.fake .n{font:400 22px/1 "Reenie Beanie",cursive;color:#1b2a4a;}',
  '.fake .sig2{font:400 26px/1 "Reenie Beanie",cursive;color:#1b2a4a;text-align:right;margin-top:8px;}',
  // sticky memo
  '.sticky{padding:26px 22px 24px;--r:-2.5deg;}',
  '.sticky::before{content:"";position:absolute;left:0;right:0;top:0;height:22px;background:linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,0));}',
  '.sticky .e{font:700 23px/1.18 Caveat,cursive;color:#1f2a5a;}',
  '.sticky .j{font:600 12.5px/1.55 "Klee One",serif;color:#3b3a4a;margin-top:8px;}',
  // thermal receipt
  '.receipt{width:min(270px,calc(100% - 60px));padding:22px 20px 30px;font:400 14px/1.4 DotGothic16,monospace;color:#2e2e34;--r:.6deg;transform-origin:50% 0;}',
  '.receipt.print{animation:rprint 1.6s steps(24) both}@keyframes rprint{0%{clip-path:inset(0 0 100% 0)}100%{clip-path:inset(0 0 0 0)}}',
  '.receipt::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.10),rgba(0,0,0,0) 12%,rgba(0,0,0,0) 88%,rgba(0,0,0,.10));}',
  '.receipt .c{text-align:center}.receipt .r{display:flex;justify-content:space-between;gap:8px}.receipt hr{border:0;border-top:1.5px dashed #777;margin:8px 0}',
  '.receipt .big{font-size:20px;letter-spacing:.06em}.receipt .bad{color:#a01018}',
  // newspaper
  '.news{padding:26px 24px 30px;--r:-1deg;}',
  '.news .mast{font:900 26px/1 "Playfair Display",serif;text-align:center;border-bottom:3px double #333;padding-bottom:6px;letter-spacing:.02em;}',
  '.news .date{font:400 11px/1.4 "Old Standard TT",serif;text-align:center;border-bottom:1px solid #333;padding:3px 0;margin-bottom:10px;}',
  '.news h3{font:900 23px/1.08 "Playfair Display",serif;margin:6px 0 8px;}',
  '.news p{font:400 13px/1.42 "Old Standard TT",serif;margin:0 0 8px;text-align:justify;}',
  '.news .jp{font:500 11.5px/1.55 "Zen Kaku Gothic New",sans-serif;color:#4a4232;border-top:1px solid rgba(0,0,0,.2);padding-top:8px;margin-top:8px;}',
  '.news img,.flyer img,.polaroid img{display:block;width:100%;filter:grayscale(1) contrast(1.15) sepia(.25);mix-blend-mode:multiply;}',
  '.flyer{padding:24px 24px 26px;--r:1.6deg;text-align:center;}',
  '.flyer .big{font:900 52px/1 "Playfair Display",serif;letter-spacing:.08em;color:#1a1a1a;}',
  '.flyer p{font:400 14px/1.4 "Special Elite",monospace;margin:8px 0;}',
  '.polaroid{width:min(290px,calc(100% - 60px));padding:16px 16px 18px;--r:-3deg;}',
  '.polaroid .cap{font:700 22px/1.1 Caveat,cursive;color:#2b2b44;text-align:center;margin-top:12px;}',
  '.diary{padding:56px 26px 26px 72px;--r:1.2deg;}',
  '.diary .e{font:700 21px/34px Caveat,cursive;color:#23284a;}',
  '.diary .j{font:600 12px/1.6 "Klee One",serif;color:#3a3a4a;margin-top:10px;}',
  '.doccap{font:600 11px/1.4 Oswald,sans-serif;letter-spacing:.18em;color:rgba(243,230,200,.7);text-align:center;margin-top:4px;}',
  '.docclose{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 22px);transform:translateX(-50%);}',
  '.docclose:active,.docclose.down{transform:translateX(-50%) translateY(4px);}',
  '.ticketdoc{width:min(250px,calc(100% - 80px));padding:22px 18px 20px;--r:-2deg;font:400 20px/38px "Shadows Into Light",cursive;color:#1d2f6f;}',
  '.ticketdoc .hd{font:600 10px/1 Oswald,sans-serif;letter-spacing:.2em;color:#2f7e6e;display:flex;justify-content:space-between;margin-bottom:28px}',
  '.ticketdoc .carbon{text-shadow:1px 1px 0 rgba(30,40,110,.25),-.5px .5px 1px rgba(30,40,110,.25);}',
  '.ticketdoc .odd{color:#4a1a1a;filter:blur(.3px);text-shadow:0 0 2px rgba(120,0,0,.5);}'
].join('\n');
// ---- document overlay -----------------------------------------------------------------
var DOC = { open: false, ov: null, onClose: null };
function openDocs(nodesHTML, opt) {
  opt = opt || {};
  closeDocs(true);
  var ov = el('div', 'ov dim pe', null, UI); DOC.ov = ov; DOC.open = true; DOC.onClose = opt.onClose || null;
  var wrap = el('div', 'docwrap ssd-scroll scroll', nodesHTML, ov);
  var cb = el('button', 'mb pe docclose', icon(opt.closeIcon || 'ok', 30) + '<span class="tx"><span class="en">' + (opt.closeEn || 'Got it') + '</span><span class="ja">' + (opt.closeJa || 'わかった') + '</span></span>', ov);
  pressFX(cb);
  onTap(cb, function () { sfx('paper'); closeDocs(); });
  sfx('paper'); setTimeout(function () { sfx('paperSlide'); }, 120);
  if (opt.noClose) cb.style.display = 'none';
  DOC.closeBtn = cb; DOC.wrap = wrap;
  return ov;
}
function closeDocs(silent) {
  if (!DOC.ov) return; var ov = DOC.ov; DOC.ov = null; DOC.open = false;
  ov.querySelectorAll('.doc').forEach(function (d) { d.classList.add('out'); });
  ov.classList.add('hide'); setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 380);
  var f = DOC.onClose; DOC.onClose = null; if (f && !silent) f();
}
function tapeHTML(spots) { return (spots || [[-18, -10, -8], [null, -10, 7]]).map(function (s) { return '<div class="tape" style="' + (s[0] == null ? 'right:-18px' : 'left:' + s[0] + 'px') + ';top:' + s[1] + 'px;transform:rotate(' + s[2] + 'deg)"></div>'; }).join(''); }
function docRules(list, night) { // list: [{n,en,ja,fake,red,redJa,ul}]
  var real = list.filter(function (r) { return !r.fake; }), fakes = list.filter(function (r) { return r.fake; });
  var h = '<div class="doc rules" style="background-image:url(' + PAPER.rules + ');--r:-1.2deg">' + tapeHTML() +
    '<div class="rlogo">Sunny Side Diner</div><h2>NIGHT SHIFT RULES</h2><div class="sub2">Follow them. Every one. Every night.<br>深夜シフトのルール ── 必ず守ること</div>';
  real.forEach(function (r) {
    h += '<div class="rule"><div class="n">' + r.n + '</div><div><div class="e">' + (r.ul ? r.en.replace(r.ul, '<span class="ul">' + r.ul + '</span>') : r.en) + '</div><div class="j">' + r.ja + '</div>' +
      (r.red ? '<div class="redpen">' + r.red + '</div>' + (r.redJa ? '<div class="redpen ja">' + r.redJa + '</div>' : '') : '') + '</div></div>';
  });
  h += '<div class="sig">— Dale</div></div>';
  fakes.forEach(function (r, i) {
    h += '<div class="doc fake" style="background-image:url(' + PAPER.fake + ');--r:' + (i % 2 ? -2.2 : 2.6) + 'deg"><div class="pin"></div><div class="n">' + r.n + '.</div><div class="e">' + r.en + '</div><div class="j">' + r.ja + '</div><div class="sig2">' + (r.sig || '— D') + '</div></div>';
  });
  return h;
}
function docSticky(en, ja, rot) { return '<div class="doc sticky" style="background-image:url(' + PAPER.sticky + ');--r:' + (rot || -2.5) + 'deg"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>'; }
function docReceipt(lines, print) { return '<div class="doc receipt' + (print ? ' print' : '') + '" style="background-image:url(' + PAPER.receipt + ')">' + lines + '</div>'; }
function docNews(o) {
  return '<div class="doc news" style="background-image:url(' + PAPER.news + ')"><div class="mast">' + (o.paper || 'The Desert Ledger') + '</div><div class="date">' + o.date + '</div><h3>' + o.head + '</h3>' + (o.img ? '<img src="' + o.img + '">' : '') + o.body.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '<div class="jp">' + o.ja + '</div></div>';
}
function docFlyer(o) { return '<div class="doc flyer" style="background-image:url(' + PAPER.flyer + ')"><div class="big">MISSING</div>' + (o.img ? '<img src="' + o.img + '" style="margin:10px auto;width:70%">' : '') + o.body.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '<div class="news"><div class="jp" style="text-align:left">' + o.ja + '</div></div></div>'; }
function docPolaroid(img, cap, ja) { return '<div class="doc polaroid" style="background-image:url(' + PAPER.polaroid + ')"><img src="' + img + '" style="filter:sepia(.35) contrast(1.05) saturate(.8);mix-blend-mode:normal"><div class="cap">' + cap + '</div><div class="doccap" style="color:#666">' + (ja || '') + '</div></div>'; }
function docDiary(en, ja) { return '<div class="doc diary" style="background-image:url(' + PAPER.diary + ')"><div class="e">' + en + '</div><div class="j">' + ja + '</div></div>'; }
function docTicket(no, table, items) {
  return '<div class="doc ticketdoc" style="background-image:url(' + PAPER.ticket + ')"><div class="hd"><span>GUEST CHECK</span><span style="color:#c8282e">No.' + no + '</span><span>' + table + '</span></div>' +
    items.map(function (it) { return '<div class="carbon' + (it.odd ? ' odd' : '') + '">' + it.qty + ' × ' + it.en + '</div>'; }).join('') + '</div>';
}
// small halftone photo generator for clippings (canvas -> dataURL)
function photoCanvas(kind, w, h, seed) {
  var c = mkCanvas(w || 320, h || 220), g = c.getContext('2d'), rnd = makeRNG(seed || 1); w = c.width; h = c.height;
  var sk = g.createLinearGradient(0, 0, 0, h); sk.addColorStop(0, '#9a9a9a'); sk.addColorStop(0.6, '#cfcfcf'); sk.addColorStop(1, '#6a6a6a'); g.fillStyle = sk; g.fillRect(0, 0, w, h);
  if (kind === 'diner' || kind === 'night') {
    if (kind === 'night') { g.fillStyle = '#1b1b1b'; g.fillRect(0, 0, w, h); }
    g.fillStyle = kind === 'night' ? '#3a3a3a' : '#555'; g.fillRect(w * 0.12, h * 0.42, w * 0.76, h * 0.32);
    g.fillStyle = kind === 'night' ? '#d8d8d8' : '#9a9a9a'; for (var i = 0; i < 7; i++) g.fillRect(w * 0.15 + i * w * 0.1, h * 0.5, w * 0.07, h * 0.12);
    g.fillStyle = '#222'; g.fillRect(w * 0.7, h * 0.1, w * 0.025, h * 0.35); g.fillStyle = kind === 'night' ? '#eee' : '#444'; g.fillRect(w * 0.6, h * 0.08, w * 0.22, h * 0.12);
    g.fillStyle = '#444'; g.fillRect(0, h * 0.74, w, h * 0.26);
  } else if (kind === 'girl' || kind === 'man' || kind === 'woman') {
    g.fillStyle = '#bdbdbd'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#555'; g.beginPath(); g.ellipse(w / 2, h * 0.42, w * 0.17, h * 0.24, 0, 0, TAU); g.fill();
    g.fillStyle = kind === 'girl' ? '#2a2a2a' : (kind === 'woman' ? '#3a3a3a' : '#4a4a4a'); g.beginPath(); g.ellipse(w / 2, h * 0.32, w * 0.2, h * (kind === 'man' ? 0.14 : 0.2), 0, PI, 0); g.fill();
    if (kind !== 'man') { g.fillRect(w * 0.3, h * 0.3, w * 0.07, h * 0.35); g.fillRect(w * 0.63, h * 0.3, w * 0.07, h * 0.35); }
    g.fillStyle = '#7a7a7a'; g.beginPath(); g.ellipse(w / 2, h * 1.02, w * 0.36, h * 0.3, 0, PI, 0); g.fill();
    g.fillStyle = '#222'; g.fillRect(w * 0.44, h * 0.4, w * 0.03, h * 0.02); g.fillRect(w * 0.53, h * 0.4, w * 0.03, h * 0.02); g.fillRect(w * 0.46, h * 0.52, w * 0.08, h * 0.012);
  } else if (kind === 'costume') {
    g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#444'; g.fillRect(0, h * 0.8, w, h * 0.2);
    drawSunny(g, w * 0.62, h * 0.46, h * 0.26, { mood: 'stare' });
    var gr = g.createRadialGradient(w * 0.6, h * 0.4, 10, w * 0.6, h * 0.4, w * 0.5); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  // halftone + grain
  var id = g.getImageData(0, 0, w, h), d = id.data;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var k = (y * w + x) * 4, l = (d[k] + d[k + 1] + d[k + 2]) / 3 + (rnd() - 0.5) * 40; l = l > (((x + y) % 4) * 40 + 60) ? Math.min(255, l + 20) : l * 0.7; d[k] = d[k + 1] = d[k + 2] = l; }
  g.putImageData(id, 0, 0);
  return c.toDataURL('image/jpeg', 0.8);
}
