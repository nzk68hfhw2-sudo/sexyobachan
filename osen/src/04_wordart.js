// ---- 2000年代ワードアート（Canvasで描く） -----------------------------------------
// style: 0..15 / shape: flat arcUp arcDown wave slant bounce grow circle tilt inflate
var WA_STYLES = [
  { n: 'にじいろ', font: 'OsWA1', fill: ['#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'], dir: 'h', o1: '#ffffff', o2: '#000000', ext: 0, sh: '#555', shape: 'arcUp', hl: 0 },
  { n: 'クローム', font: 'OsWA1', fill: ['#ffffff', '#d8dde6', '#7a8597', '#2a3140', '#c8d0dc', '#ffffff'], dir: 'v', o1: '#ffffff', o2: '#0a1a5c', ext: 10, extC: ['#0a1a5c', '#3a4a8c'], sh: null, shape: 'slant', hl: 1 },
  { n: 'ゴールド', font: 'OsWA1', fill: ['#fff7b0', '#ffd700', '#b8860b', '#ffec80', '#8b6508'], dir: 'v', o1: '#5a3a00', o2: '#ffffff', ext: 8, extC: ['#4a2a00', '#8b5a10'], sh: '#000', shape: 'flat', hl: 1 },
  { n: 'ファイヤー', font: 'OsWA1', fill: ['#ffff66', '#ffcc00', '#ff6600', '#cc0000'], dir: 'v', o1: '#000', o2: '#ffff00', ext: 0, sh: '#600', shape: 'wave', hl: 0 },
  { n: 'こおり', font: 'OsWA1', fill: ['#ffffff', '#aaf6ff', '#33ccff', '#0044cc'], dir: 'v', o1: '#ffffff', o2: '#001a66', ext: 6, extC: ['#001a66', '#0055aa'], sh: null, shape: 'arcUp', hl: 1 },
  { n: 'ピンクむらさき', font: 'OsWA1', fill: ['#ff66ff', '#cc00cc', '#6600cc'], dir: 'h', o1: '#ffff00', o2: '#330033', ext: 0, sh: '#9900ff', shape: 'slant', hl: 0 },
  { n: 'サンセット', font: 'OsWA1', fill: ['#ffee00', '#ff7700', '#ff0066', '#660099'], dir: 'v', o1: '#000', o2: '#fff', ext: 0, sh: '#000', shape: 'arcDown', hl: 0, stripes: 1 },
  { n: 'どくどく', font: 'OsWA1', fill: ['#eaff00', '#66ff00', '#009900', '#003300'], dir: 'v', o1: '#000', o2: '#ff00ff', ext: 7, extC: ['#002200', '#116611'], sh: null, shape: 'wave', hl: 0 },
  { n: 'ポップ', font: 'OsWA1', fill: ['#ff2222', '#ff5555'], dir: 'v', o1: '#ffffff', o2: '#0000cc', ext: 0, sh: '#0033ff', shape: 'bounce', hl: 0, shOff: [7, 7] },
  { n: 'スターウォー风', font: 'OsWA1', fill: ['#ffff00', '#ffcc00'], dir: 'v', o1: '#000', o2: '#000', ext: 0, sh: null, shape: 'trap', hl: 0 },
  { n: 'むらさき押し出し', font: 'OsWA1', fill: ['#ffffff', '#e0c0ff', '#b070ff'], dir: 'v', o1: '#2a0055', o2: '#ffffff', ext: 14, extC: 'rainbow', sh: null, shape: 'tilt', hl: 1 },
  { n: 'あわあわ', font: 'OsWA1', fill: ['#ffd1f0', '#ffe9a8', '#c4f5ff'], dir: 'h', o1: '#ff3399', o2: '#ffffff', ext: 0, sh: '#ff99cc', shape: 'inflate', hl: 1 },
  { n: 'ドット', font: 'OsUI', fill: ['#00ff66', '#00aa44'], dir: 'v', o1: '#000', o2: '#00ff66', ext: 5, extC: ['#003311', '#006622'], sh: null, shape: 'flat', hl: 0 },
  { n: 'わし', font: 'OsSub', fill: ['#ff3300', '#990000'], dir: 'v', o1: '#ffffff', o2: '#000', ext: 0, sh: '#000', shape: 'grow', hl: 0 },
  { n: 'メタル赤', font: 'OsWA1', fill: ['#ffd6d6', '#ff3030', '#600000', '#ff8080', '#ffffff'], dir: 'v', o1: '#000', o2: '#ffff00', ext: 9, extC: ['#300', '#900'], sh: null, shape: 'arcUp', hl: 1 },
  { n: 'まわる', font: 'OsWA1', fill: ['#00ffff', '#ff00ff', '#ffff00'], dir: 'h', o1: '#000', o2: '#ffffff', ext: 0, sh: '#000', shape: 'circle', hl: 0 }
];
var WA_CACHE = {};
var WA_FONTS_READY = false;

function _waFont(st, size, ch) {
  if (isCN(ch)) return '900 ' + size + 'px ' + FONT_CN;
  return '400 ' + size + 'px "' + st.font + '",' + FONT_JP;
}
function _tint(src, color) {
  var c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  var x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c;
}
function _rainbowGrad(x, x0, y0, x1, y1, cols) {
  var g = x.createLinearGradient(x0, y0, x1, y1);
  for (var i = 0; i < cols.length; i++) g.addColorStop(i / (cols.length - 1), cols[i]);
  return g;
}

function wordArt(text, opts) {
  opts = opts || {};
  var si = (opts.style == null ? 0 : opts.style) % WA_STYLES.length;
  var st = WA_STYLES[si];
  var size = opts.size || 64;
  var shape = opts.shape || st.shape;
  var key = text + '|' + si + '|' + size + '|' + shape + '|' + (WA_FONTS_READY ? 1 : 0);
  if (WA_CACHE[key]) return WA_CACHE[key];
  var chars = Array.from ? Array.from(String(text)) : String(text).split('');
  var meas = document.createElement('canvas').getContext('2d');
  var n = chars.length, adv = [], sizes = [], total = 0;
  for (var i = 0; i < n; i++) {
    var s = size;
    if (shape === 'grow') s = size * (0.7 + 0.5 * (n > 1 ? i / (n - 1) : 1));
    if (shape === 'inflate') s = size * (0.85 + 0.35 * Math.abs(Math.sin(i * 1.7 + 0.5)));
    if (shape === 'trap') s = size;
    sizes.push(s);
    meas.font = _waFont(st, s, chars[i]);
    var w = chars[i] === ' ' || chars[i] === '　' ? s * 0.45 : meas.measureText(chars[i]).width;
    if (!w) w = s * 0.9;
    adv.push(w * (shape === 'bounce' ? 1.02 : 0.98)); total += adv[i];
  }
  var ow = size * 0.16 + 4, iw = size * 0.08 + 2, ext = st.ext ? st.ext * size / 64 : 0;
  var amp = shape === 'arcUp' || shape === 'arcDown' ? Math.min(total * 0.18, size * 1.1) : shape === 'wave' ? size * 0.28 : shape === 'bounce' ? size * 0.2 : 0;
  var pad = ow + ext + size * 0.25 + 6;
  var W, H, R = 0;
  if (shape === 'circle') { R = Math.max(size * 1.1, total / TAU * 1.1); W = H = Math.ceil(2 * (R + size) + pad * 2); }
  else { W = Math.ceil(total + pad * 2 + (shape === 'tilt' ? size * 0.6 : 0)); H = Math.ceil(size * 1.35 + amp * 2 + pad * 2 + (shape === 'tilt' ? total * 0.12 : 0)); }
  W = Math.min(W, 4096); H = Math.min(H, 2048);
  // place glyphs
  var gl = [], x = pad, cy = H / 2;
  for (i = 0; i < n; i++) {
    var u = n > 1 ? (x + adv[i] / 2 - pad) / total : 0.5, gx = x + adv[i] / 2, gy = cy + size * 0.36, rot = 0, sx = 1, sy = 1;
    if (shape === 'arcUp') { gy += amp * (Math.pow(2 * u - 1, 2)) - amp * 0.5; rot = (2 * u - 1) * Math.atan(4 * amp / total) * 0.9; }
    if (shape === 'arcDown') { gy -= amp * (Math.pow(2 * u - 1, 2)) - amp * 0.5; rot = -(2 * u - 1) * Math.atan(4 * amp / total) * 0.9; }
    if (shape === 'wave') { gy += Math.sin(u * TAU * 1.3) * amp; rot = Math.cos(u * TAU * 1.3) * 0.25; }
    if (shape === 'bounce') { gy += (i % 2 ? -1 : 1) * amp * 0.6; rot = (i % 2 ? 0.12 : -0.12); }
    if (shape === 'slant') { sy = 0.75 + 0.6 * u; gy += size * 0.3 * (1 - sy); }
    if (shape === 'trap') { sx = 1; sy = 1; }
    if (shape === 'tilt') { gy += (u - 0.5) * total * 0.12; rot = -0.08; }
    if (shape === 'circle') { var a = -PI / 2 + (u - 0.5) * TAU * Math.min(1, total / (TAU * R)) * 0.98; gx = W / 2 + Math.cos(a) * R; gy = H / 2 + Math.sin(a) * R + size * 0.36; rot = a + PI / 2; }
    gl.push({ ch: chars[i], x: gx, y: gy, r: rot, sx: sx, sy: sy, s: sizes[i] });
    x += adv[i];
  }
  function drawGlyphs(ctx, mode, lw, color) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    for (var k = 0; k < gl.length; k++) {
      var g = gl[k]; if (g.ch === ' ' || g.ch === '　') continue;
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.r); ctx.scale(g.sx, g.sy);
      ctx.font = _waFont(st, g.s, g.ch);
      if (mode === 'stroke') { ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.strokeText(g.ch, 0, -g.s * 0.36 + g.s * 0.36); ctx.fillStyle = color; ctx.fillText(g.ch, 0, 0); }
      else { ctx.fillStyle = color; ctx.fillText(g.ch, 0, 0); }
      ctx.restore();
    }
  }
  function layer() { var c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  var outer = layer(), inner = layer(), fill = layer();
  drawGlyphs(outer.getContext('2d'), 'stroke', ow * 2, '#000');
  drawGlyphs(inner.getContext('2d'), 'stroke', iw * 2, '#000');
  drawGlyphs(fill.getContext('2d'), 'fill', 0, '#000');
  // gradient fill
  var fx = fill.getContext('2d'); fx.globalCompositeOperation = 'source-in';
  fx.fillStyle = st.dir === 'h' ? _rainbowGrad(fx, pad, 0, W - pad, 0, st.fill) : _rainbowGrad(fx, 0, cy - size * 0.55 - amp * 0.3, 0, cy + size * 0.5 + amp * 0.3, st.fill);
  fx.fillRect(0, 0, W, H);
  if (st.stripes) { fx.globalCompositeOperation = 'source-atop'; fx.fillStyle = 'rgba(0,0,0,0.28)'; for (var yy = 0; yy < H; yy += Math.max(4, size / 9)) fx.fillRect(0, yy, W, Math.max(2, size / 22)); }
  if (st.hl) { fx.globalCompositeOperation = 'source-atop'; var hg = fx.createLinearGradient(0, cy - size * 0.6, 0, cy + size * 0.1); hg.addColorStop(0, 'rgba(255,255,255,0.85)'); hg.addColorStop(0.5, 'rgba(255,255,255,0.25)'); hg.addColorStop(0.51, 'rgba(255,255,255,0)'); fx.fillStyle = hg; fx.fillRect(0, 0, W, H); }
  var out = layer(), o = out.getContext('2d');
  // perspective trapezoid (star-wars-ish) : draw slices
  // shadow
  if (st.sh) {
    var shc = _tint(outer, st.sh), off = st.shOff || [size * 0.12, size * 0.14];
    o.save(); o.globalAlpha = 0.75;
    if (st.shOff) o.drawImage(shc, off[0], off[1]);
    else { o.setTransform(1, 0, -0.45, 0.55, H * 0.24 + off[0], H * 0.45 * 0.55 + off[1] * 0.3); o.drawImage(shc, 0, 0); }
    o.restore();
  }
  // extrusion
  if (ext > 0) {
    var steps = Math.ceil(ext), cols = st.extC;
    var t1 = cols === 'rainbow' ? null : _tint(outer, cols[0]), t2 = cols === 'rainbow' ? null : _tint(outer, cols[1]);
    for (var d = steps; d >= 1; d--) {
      var c = cols === 'rainbow' ? _tint(outer, hsl(d * 360 / steps, 100, 50)) : (d > steps * 0.5 ? t1 : t2);
      o.drawImage(c, d * 0.7, d * 0.9);
    }
  }
  o.drawImage(_tint(outer, st.o2), 0, 0);
  if (st.o1 === '#ffffff' && st.n === 'にじいろ') o.drawImage(_tint(inner, st.o1), 0, 0);
  else o.drawImage(_tint(inner, st.o1), 0, 0);
  o.drawImage(fill, 0, 0);
  if (shape === 'trap') {
    // squash top narrower
    var t = layer(), tx = t.getContext('2d');
    for (var row = 0; row < H; row += 2) { var k = 0.45 + 0.55 * row / H; var ww = W * k; tx.drawImage(out, 0, row, W, 2, (W - ww) / 2, row, ww, 2); }
    out = t;
  }
  out.waW = W; out.waH = H; out.waText = text;
  var keys = Object.keys(WA_CACHE); if (keys.length > 180) for (var q = 0; q < 60; q++) delete WA_CACHE[keys[q]];
  WA_CACHE[key] = out;
  return out;
}
// 文字が入りきらない時は size を下げる
function wordArtFit(text, style, maxW, size, shape) {
  var c = wordArt(text, { style: style, size: size, shape: shape });
  if (c.waW > maxW) { var s2 = Math.max(14, Math.floor(size * maxW / c.waW)); c = wordArt(text, { style: style, size: s2, shape: shape }); }
  return c;
}

// ---- クリップアート（星・キラキラ・NEW など） ------------------------------------
var CLIP_CACHE = {};
function clipArt(kind, size) {
  size = size || 128; var key = kind + size; if (CLIP_CACHE[key]) return CLIP_CACHE[key];
  var c = document.createElement('canvas'); c.width = c.height = size; var x = c.getContext('2d'), h = size / 2;
  x.translate(h, h); x.lineJoin = 'round';
  function star(r1, r2, n) { x.beginPath(); for (var i = 0; i < n * 2; i++) { var r = i % 2 ? r2 : r1, a = -PI / 2 + i * PI / n; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); }
  if (kind === 'star') {
    star(h * 0.92, h * 0.4, 5); var g = x.createRadialGradient(-h * 0.2, -h * 0.3, 2, 0, 0, h); g.addColorStop(0, '#fffde0'); g.addColorStop(0.4, '#ffe600'); g.addColorStop(1, '#ff8800');
    x.fillStyle = g; x.fill(); x.lineWidth = size * 0.05; x.strokeStyle = '#a04000'; x.stroke();
    x.beginPath(); x.ellipse(-h * 0.18, -h * 0.25, h * 0.16, h * 0.08, -0.6, 0, TAU); x.fillStyle = 'rgba(255,255,255,0.8)'; x.fill();
  } else if (kind === 'sparkle') {
    star(h * 0.95, h * 0.12, 4); var g2 = x.createRadialGradient(0, 0, 0, 0, 0, h); g2.addColorStop(0, '#fff'); g2.addColorStop(0.5, '#bff'); g2.addColorStop(1, 'rgba(120,200,255,0)'); x.fillStyle = g2; x.fill();
  } else if (kind === 'heart') {
    x.beginPath(); x.moveTo(0, h * 0.75); x.bezierCurveTo(-h * 1.1, -h * 0.1, -h * 0.5, -h * 0.95, 0, -h * 0.35); x.bezierCurveTo(h * 0.5, -h * 0.95, h * 1.1, -h * 0.1, 0, h * 0.75);
    var g3 = x.createLinearGradient(0, -h, 0, h); g3.addColorStop(0, '#ff9ad5'); g3.addColorStop(1, '#e0006e'); x.fillStyle = g3; x.fill(); x.lineWidth = size * 0.05; x.strokeStyle = '#fff'; x.stroke();
  } else if (kind === 'burst') {
    star(h * 0.95, h * 0.62, 14); x.fillStyle = '#ff2200'; x.fill(); x.lineWidth = size * 0.04; x.strokeStyle = '#ffee00'; x.stroke();
    star(h * 0.72, h * 0.48, 14); x.fillStyle = '#ffee00'; x.fill();
  } else if (kind === 'new') {
    star(h * 0.98, h * 0.7, 16); x.fillStyle = '#ff0033'; x.fill(); x.lineWidth = size * 0.035; x.strokeStyle = '#fff'; x.stroke();
    x.rotate(-0.25); x.font = '400 ' + Math.round(size * 0.34) + 'px OsWA1,OsUI'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = size * 0.06; x.strokeStyle = '#600'; x.strokeText('NEW', 0, 2); x.fillStyle = '#ffff00'; x.fillText('NEW', 0, 2);
  } else if (kind === 'flare') {
    var g4 = x.createRadialGradient(0, 0, 0, 0, 0, h); g4.addColorStop(0, 'rgba(255,255,255,1)'); g4.addColorStop(0.15, 'rgba(255,250,200,0.9)'); g4.addColorStop(0.35, 'rgba(255,160,60,0.35)'); g4.addColorStop(1, 'rgba(255,0,0,0)');
    x.fillStyle = g4; x.fillRect(-h, -h, size, size);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(-h, -size * 0.012, size, size * 0.024); x.fillRect(-size * 0.012, -h, size * 0.024, size);
  } else if (kind === 'ring') {
    var cols = ['#f00', '#f80', '#ff0', '#0f0', '#0ff', '#00f', '#f0f'];
    for (var i = 0; i < cols.length; i++) { x.beginPath(); x.arc(0, 0, h * (0.9 - i * 0.04), 0, TAU); x.strokeStyle = cols[i]; x.globalAlpha = 0.35; x.lineWidth = size * 0.04; x.stroke(); }
  } else if (kind === 'smile') {
    x.beginPath(); x.arc(0, 0, h * 0.9, 0, TAU); var g5 = x.createRadialGradient(-h * 0.3, -h * 0.3, 2, 0, 0, h); g5.addColorStop(0, '#fff8a0'); g5.addColorStop(1, '#ffc400'); x.fillStyle = g5; x.fill();
    x.lineWidth = size * 0.04; x.strokeStyle = '#7a4a00'; x.stroke(); x.fillStyle = '#000';
    x.beginPath(); x.ellipse(-h * 0.3, -h * 0.2, h * 0.08, h * 0.16, 0, 0, TAU); x.ellipse(h * 0.3, -h * 0.2, h * 0.08, h * 0.16, 0, 0, TAU); x.fill();
    x.beginPath(); x.arc(0, h * 0.05, h * 0.5, 0.2, PI - 0.2); x.lineWidth = size * 0.05; x.stroke();
  } else if (kind === 'arrow') {
    x.beginPath(); x.moveTo(-h * 0.9, -h * 0.25); x.lineTo(h * 0.2, -h * 0.25); x.lineTo(h * 0.2, -h * 0.6); x.lineTo(h * 0.95, 0); x.lineTo(h * 0.2, h * 0.6); x.lineTo(h * 0.2, h * 0.25); x.lineTo(-h * 0.9, h * 0.25); x.closePath();
    var g6 = x.createLinearGradient(0, -h, 0, h); g6.addColorStop(0, '#7dff6b'); g6.addColorStop(1, '#00a000'); x.fillStyle = g6; x.fill(); x.lineWidth = size * 0.04; x.strokeStyle = '#003300'; x.stroke();
  } else if (kind === 'flower') {
    for (var p = 0; p < 6; p++) { x.save(); x.rotate(p * TAU / 6); x.beginPath(); x.ellipse(0, -h * 0.5, h * 0.25, h * 0.42, 0, 0, TAU); x.fillStyle = p % 2 ? '#ff66cc' : '#ff99dd'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#a0006a'; x.stroke(); x.restore(); }
    x.beginPath(); x.arc(0, 0, h * 0.3, 0, TAU); x.fillStyle = '#ffee00'; x.fill(); x.stroke();
  }
  CLIP_CACHE[key] = c; return c;
}
