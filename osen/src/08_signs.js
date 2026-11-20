// ---- 看板（ワードアート）と注意書き（謎日本語） --------------------------------------
var SIGNS = [];
// Canvas に中華フォント混じりの文字を書く
function cnFillText(x, str, px, py, size, weight, color, align, stroke) {
  var segs = cnSegments(str), w = 0, i;
  for (i = 0; i < segs.length; i++) { x.font = weight + ' ' + size + 'px ' + (segs[i].cn ? FONT_CN : FONT_JP); w += x.measureText(segs[i].t).width; }
  var sx = align === 'center' ? px - w / 2 : align === 'right' ? px - w : px;
  x.textAlign = 'left';
  for (i = 0; i < segs.length; i++) {
    x.font = weight + ' ' + size + 'px ' + (segs[i].cn ? FONT_CN : FONT_JP);
    if (stroke) { x.lineWidth = stroke[1]; x.strokeStyle = stroke[0]; x.lineJoin = 'round'; x.strokeText(segs[i].t, sx, py); }
    x.fillStyle = color; x.fillText(segs[i].t, sx, py); sx += x.measureText(segs[i].t).width;
  }
  return w;
}
function wrapLines(str, maxChars) {
  var out = []; String(str).split('\n').forEach(function (ln) { while (ln.length > maxChars) { out.push(ln.slice(0, maxChars)); ln = ln.slice(maxChars); } out.push(ln); });
  return out;
}
// 看板の背景パネル
function signPanel(x, W, H, kind, seed) {
  var r = mulberry(seed || 1);
  if (kind === 'board') {
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, hsl(r() * 360, 90, 60)); g.addColorStop(1, hsl(r() * 360, 90, 35)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.lineWidth = H * 0.06; x.strokeStyle = '#fff'; x.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);
    for (var i = 0; i < 6; i++) { var s = clipArt(pick(['star', 'sparkle', 'star', 'new', 'flower']), 64); var sz = H * (0.2 + r() * 0.25); x.drawImage(s, r() * (W - sz), r() * (H - sz), sz, sz); }
  } else if (kind === 'notice') {
    x.fillStyle = '#fbfbf2'; x.fillRect(0, 0, W, H); x.fillStyle = '#d4001a'; x.fillRect(0, 0, W, H * 0.2);
    x.strokeStyle = '#222'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6);
  } else if (kind === 'yellow') {
    x.fillStyle = '#ffe600'; x.fillRect(0, 0, W, H); x.fillStyle = '#111';
    for (var k = -H; k < W; k += 40) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 20, 0); x.lineTo(k + 20 - H * 0.12, H * 0.12); x.lineTo(k - H * 0.12, H * 0.12); x.fill(); x.beginPath(); x.moveTo(k, H); x.lineTo(k + 20, H); x.lineTo(k + 20 + H * 0.12, H - H * 0.12); x.lineTo(k + H * 0.12, H - H * 0.12); x.fill(); }
  } else if (kind === 'neon') {
    x.fillStyle = '#100020'; x.fillRect(0, 0, W, H); x.strokeStyle = '#ff00ff'; x.lineWidth = 8; x.shadowColor = '#ff00ff'; x.shadowBlur = 20; x.strokeRect(10, 10, W - 20, H - 20); x.shadowBlur = 0;
  } else if (kind === 'wood') {
    x.fillStyle = '#7a4a22'; x.fillRect(0, 0, W, H); for (var q = 0; q < 40; q++) { x.strokeStyle = 'rgba(40,20,0,0.25)'; x.beginPath(); var y = r() * H; x.moveTo(0, y); x.bezierCurveTo(W / 3, y + 5, W * 2 / 3, y - 5, W, y); x.stroke(); }
    x.lineWidth = 10; x.strokeStyle = '#3a2008'; x.strokeRect(5, 5, W - 10, H - 10);
  } else { x.clearRect(0, 0, W, H); }
}
// opts: {texts:[通常, 汚染1, 汚染2], style, kind:'board'|'notice'|..., w, h (meters), pos:[x,y,z], rot, sub, twoSided}
function makeSign(o) {
  var Wm = o.w || 4, Hm = o.h || 1.2, PX = 512, PY = Math.max(64, Math.round(PX * Hm / Wm));
  if (PY > 512) { PY = 512; PX = Math.round(512 * Wm / Hm); }
  var c = cvs(PX, PY), tex = canvasTex(c, false);
  tex.anisotropy = 4;
  var mat = new THREE.MeshLambertMaterial({ map: tex, transparent: o.kind === 'none', alphaTest: o.kind === 'none' ? 0.05 : 0 });
  var m = new THREE.Mesh(new THREE.PlaneGeometry(Wm, Hm), mat);
  if (o.twoSided) { var back = new THREE.Mesh(m.geometry, mat); back.rotation.y = PI; back.position.z = -0.01; m.add(back); }
  m.position.set(o.pos[0], o.pos[1], o.pos[2]); m.rotation.y = o.rot || 0;
  var s = { o: o, c: c, tex: tex, mesh: m, cur: -1, PX: PX, PY: PY, seed: hashStr(o.texts[0]) };
  SIGNS.push(s); drawSign(s, 0);
  return s;
}
function drawSign(s, lvl) {
  var o = s.o, txts = o.texts, t = txts[Math.min(lvl, txts.length - 1)];
  if (s.cur === t) return; s.cur = t;
  var x = s.c.getContext('2d'), W = s.PX, H = s.PY;
  x.clearRect(0, 0, W, H);
  if (o.kind === 'notice') {
    signPanel(x, W, H, 'notice', s.seed);
    var lines = wrapLines(t, o.wrap || 14), title = o.title || '注　意';
    cnFillText(x, title, W / 2, H * 0.16, Math.round(H * 0.13), 900, '#fff', 'center');
    var fs = Math.min(Math.round(H * 0.7 / Math.max(3, lines.length) * 0.82), Math.round(W / (o.wrap || 14) * 0.95));
    lines.forEach(function (ln, i) { cnFillText(x, ln, W * 0.06, H * 0.3 + fs * 0.9 + i * fs * 1.25, fs, 700, '#111', 'left'); });
  } else {
    signPanel(x, W, H, o.kind || 'board', s.seed + lvl);
    var maxW = W * 0.92, maxH = (o.sub ? H * 0.68 : H * 0.92);
    var wa = wordArt(t, { style: o.style == null ? 0 : o.style, size: 96, shape: o.shape });
    var sc = Math.min(maxW / wa.waW, maxH / wa.waH);
    x.drawImage(wa, (W - wa.waW * sc) / 2, (o.sub ? H * 0.04 : (H - wa.waH * sc) / 2), wa.waW * sc, wa.waH * sc);
    if (o.sub) { var subT = Array.isArray(o.sub) ? o.sub[Math.min(lvl, o.sub.length - 1)] : o.sub; cnFillText(x, subT, W / 2, H * 0.9, Math.round(H * 0.15), 900, '#fff', 'center', ['#000', Math.max(3, H * 0.03)]); }
  }
  s.tex.needsUpdate = true;
}
function redrawSigns(lvl) { SIGNS.forEach(function (s) { s.cur = -1; drawSign(s, lvl); }); }
function signLevel(stageIdx) { return stageIdx >= 6 ? 2 : stageIdx >= 1 ? 1 : 0; }

// ---- 町の看板・注意書きの文章（謎日本語） -------------------------------------------
var NOTICES = [
  ['注　意', 'この先　段差の為\nころばないで下さい\nころんだ場合は\n起きてください'],
  ['お知らせ', '駅前で　ハトに　えさを　あげないで　下さい。\nハトが　えさを　くれる事が　あります'],
  ['注意事項', '自転车を　とめる　事は　禁止\nとめない　事も　禁止です'],
  ['お願い', 'ゴミは　ゴミ箱へ\nゴミ箱は　ゴミ箱の　ゴミ箱へ'],
  ['危　険', 'ここで　泳ぐ　べからず\n川で　空を　飛ぶ　べからず\n川に　なる　べからず'],
  ['ご案内', '本日の　清掃は\n明日の　昨日に　行われまし た'],
  ['注　意', 'この　ベンチは　すわると\nすわった　事に　なります'],
  ['警　告', '夜道の　一人歩きは\n８人で　歩いて　下さい'],
  ['お知らせ', '団地の　階段は　上りのみ\n下り　は　となりの　階段を\nご利用ください（ありません）'],
  ['募　集', 'アルバイト　募集中\n時給　ほほえみ\n交通费　直接支給'],
  ['迷い猫', 'さがしています\n名前：ねこ\n特徴：ねこに　似ている'],
  ['のお知らせ', '神社っぽい所の　お祭り\n日時：存在しない時間\n雨天：ワードアート'],
  ['電车のご案内', '次の　電车は\nまいりません\nご了承の程　宜しく'],
  ['注意', '直角に　曲がる時は\n角に　骨を　ぶつけない様\nご注意ください'],
  ['ルール', '公园内では\n１．走らない\n２．歩かない\n３．とまらない'],
  ['重要', '汚染率が　１００％を\n超えた方は　係員まで\n（係員はいません）'],
  ['ご注意', '当店の　画像は　イメージです\n実物は　イメージより\nイメージです']
];
