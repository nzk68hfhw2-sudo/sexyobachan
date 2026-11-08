// ---- procedural textures & shape outlines ------------------------------------------
var TEX = {};

// outline polygons for ramune shapes, unit size (~ -1..1)
function shapePoints(shape) {
  var pts = [], i, a, N;
  function circ(n, r, ox, oy) { var out = []; for (var k = 0; k < n; k++) { var aa = k / n * TAU; out.push([Math.cos(aa) * r + (ox || 0), Math.sin(aa) * r + (oy || 0)]); } return out; }
  switch (shape) {
    case 'star': for (i = 0; i < 10; i++) { a = i / 10 * TAU + PI / 2; var r = i % 2 ? 0.45 : 1; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } break;
    case 'heart': for (i = 0; i < 40; i++) { var t = i / 40 * TAU; pts.push([16 * Math.pow(Math.sin(t), 3) / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.1]); } break;
    case 'gem': for (i = 0; i < 6; i++) { a = i / 6 * TAU + PI / 6; pts.push([Math.cos(a), Math.sin(a)]); } break;
    case 'mushroom': for (i = 0; i <= 16; i++) { a = i / 16 * PI; pts.push([Math.cos(a), Math.sin(a) * 0.8 + 0.05]); } pts.push([-0.35, 0.05], [-0.3, -0.95], [0.3, -0.95], [0.35, 0.05]); pts.reverse(); break;
    case 'bullet': for (i = 0; i <= 12; i++) { a = i / 12 * PI; pts.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5 + 0.45]); } for (i = 0; i <= 12; i++) { a = PI + i / 12 * PI; pts.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5 - 0.45]); } break;
    case 'cloud': for (i = 0; i < 48; i++) { a = i / 48 * TAU; var rr = 0.8 + 0.2 * Math.abs(Math.cos(a * 2.5)); pts.push([Math.cos(a) * rr * 1.1, Math.sin(a) * rr * 0.75]); } break;
    case 'moon':
      for (i = 0; i <= 24; i++) { a = 0.35 * PI + i / 24 * 1.3 * PI; pts.push([Math.cos(a), Math.sin(a)]); }
      for (i = 1; i < 24; i++) { a = (267 - i / 24 * 174) / 180 * PI; pts.push([0.5 + Math.cos(a) * 0.892, Math.sin(a) * 0.892]); }
      pts = pts.map(function (p) { return [p[0] + 0.25, p[1]]; }); break;
    case 'drop': for (i = 0; i < 32; i++) { var tt = i / 32 * TAU; pts.push([Math.sin(tt) * Math.sin(tt / 2) * 0.95, -Math.cos(tt) * 1.0]); } break;
    case 'bolt': pts = [[0.2, 1], [-0.6, -0.1], [-0.05, -0.1], [-0.3, -1], [0.6, 0.15], [0.05, 0.15]]; break;
    case 'cross': pts = [[-0.3, 1], [0.3, 1], [0.3, 0.3], [1, 0.3], [1, -0.3], [0.3, -0.3], [0.3, -1], [-0.3, -1], [-0.3, -0.3], [-1, -0.3], [-1, 0.3], [-0.3, 0.3]]; break;
    case 'tiny': pts = circ(24, 0.6); break;
    default: pts = circ(32, 1);
  }
  return pts;
}

function drawShape(g, shape, cx, cy, s) {
  var pts = shapePoints(shape);
  g.beginPath();
  pts.forEach(function (p, i) { var x = cx + p[0] * s, y = cy - p[1] * s; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
  g.closePath();
  if (shape === 'ring') { g.moveTo(cx + s * 0.45, cy); g.arc(cx, cy, s * 0.45, 0, TAU, true); }
}

// small icon (data URL) for HTML menus
var ICON_CACHE = {};
function ramuneIcon(s, size) {
  size = size || 96;
  var key = s.id + size; if (ICON_CACHE[key]) return ICON_CACHE[key];
  var c = mkCanvas(size, size), g = c.getContext('2d'), m = size / 2;
  var r = size * 0.36;
  g.save();
  g.shadowColor = s.col2; g.shadowBlur = size * 0.12;
  var gr = g.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r * 1.2);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, s.col); gr.addColorStop(1, s.col2);
  g.fillStyle = gr;
  drawShape(g, s.shape, m, m, r);
  g.fill('evenodd');
  g.restore();
  g.lineWidth = size * 0.025; g.strokeStyle = 'rgba(255,255,255,0.65)';
  drawShape(g, s.shape, m, m, r); g.stroke();
  // engraved line / sheen
  g.globalAlpha = 0.5; g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(m - r * 0.3, m - r * 0.38, r * 0.22, r * 0.11, -0.6, 0, TAU); g.fill();
  g.globalAlpha = 1;
  return (ICON_CACHE[key] = c.toDataURL());
}
function canIcon(d, size) {
  size = size || 96;
  var key = 'can' + d.id + size; if (ICON_CACHE[key]) return ICON_CACHE[key];
  var c = mkCanvas(size, size), g = c.getContext('2d');
  var w = size * 0.46, h = size * 0.8, x = (size - w) / 2, y = (size - h) / 2;
  var gr = g.createLinearGradient(x, 0, x + w, 0);
  gr.addColorStop(0, shade(d.col, -40)); gr.addColorStop(0.35, d.col); gr.addColorStop(0.55, '#ffffff'); gr.addColorStop(0.7, d.col); gr.addColorStop(1, shade(d.col, -60));
  g.fillStyle = gr; roundRect(g, x, y, w, h, w * 0.18); g.fill();
  g.fillStyle = '#c8ccd0'; g.fillRect(x + w * 0.1, y - size * 0.02, w * 0.8, size * 0.05);
  g.fillStyle = d.col2; g.fillRect(x, y + h * 0.35, w, h * 0.3);
  g.fillStyle = d.id === 'giga' ? '#111' : '#fff';
  g.font = '900 ' + Math.round(size * 0.13) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(d.id === 'giga' ? 'GIGA' : d.id === 'sour' ? 'ふわり' : 'ZER9', size / 2, y + h * 0.5);
  return (ICON_CACHE[key] = c.toDataURL());
}
function shade(hex, amt) {
  var n = parseInt(hex.slice(1), 16), r = (n >> 16) + amt, g = (n >> 8 & 255) + amt, b = (n & 255) + amt;
  return 'rgb(' + clamp(r, 0, 255) + ',' + clamp(g, 0, 255) + ',' + clamp(b, 0, 255) + ')';
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

function makeTextures() {
  var c, g, i, x, y;
  // wood floor
  c = mkCanvas(512, 512); g = c.getContext('2d');
  for (i = 0; i < 8; i++) {
    var base = 120 + Math.random() * 30;
    for (y = 0; y < 512; y += 2) for (x = 0; x < 64; x += 2) {
      var n = fbm(x * 0.02 + i * 10, y * 0.004, 3), gline = Math.sin((y * 0.05 + n * 8)) * 0.5 + 0.5;
      var v = base + n * 40 + gline * 16;
      g.fillStyle = 'rgb(' + (v * 1.05 | 0) + ',' + (v * 0.72 | 0) + ',' + (v * 0.45 | 0) + ')'; g.fillRect(i * 64 + x, y, 2, 2);
    }
    g.fillStyle = 'rgba(30,15,5,0.6)'; g.fillRect(i * 64, 0, 1.5, 512);
    var cut = Math.random() * 512; g.fillRect(i * 64, cut, 64, 1.5);
  }
  TEX.floor = toTex(c, { repeat: [3, 3] });
  // wallpaper
  c = mkCanvas(256, 256); g = c.getContext('2d');
  g.fillStyle = '#d8cdbb'; g.fillRect(0, 0, 256, 256);
  for (y = 0; y < 256; y += 2) for (x = 0; x < 256; x += 2) { var nn = fbm(x * 0.05, y * 0.05, 3); g.fillStyle = 'rgba(120,110,90,' + (nn * 0.12) + ')'; g.fillRect(x, y, 2, 2); }
  g.strokeStyle = 'rgba(160,150,130,0.18)'; g.lineWidth = 1;
  for (x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  TEX.wall = toTex(c, { repeat: [3, 1.5] });
  // ceiling
  c = mkCanvas(128, 128); g = c.getContext('2d'); g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 128, 128);
  for (i = 0; i < 600; i++) { g.fillStyle = 'rgba(0,0,0,' + Math.random() * 0.06 + ')'; g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); }
  TEX.ceil = toTex(c, { repeat: [4, 4] });
  // rug (retro circles)
  c = mkCanvas(512, 512); g = c.getContext('2d');
  g.fillStyle = '#2b2350'; g.fillRect(0, 0, 512, 512);
  var rc = ['#ff6fa8', '#ffd166', '#06d6a0', '#7b61ff', '#ff8c42'];
  for (i = 0; i < 9; i++) { g.strokeStyle = rc[i % 5]; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 30 + i * 26, 0, TAU); g.stroke(); }
  g.strokeStyle = '#f4f0e6'; g.lineWidth = 10; g.strokeRect(10, 10, 492, 492);
  for (y = 0; y < 512; y += 3) for (x = 0; x < 512; x += 3) if (Math.random() < 0.18) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y, 2, 2); }
  TEX.rug = toTex(c);
  // bedsheet
  c = mkCanvas(256, 256); g = c.getContext('2d'); g.fillStyle = '#9ec5e8'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,0.35)'; for (i = 0; i < 256; i += 32) { g.fillRect(i, 0, 14, 256); g.fillRect(0, i, 256, 14); }
  TEX.sheet = toTex(c, { repeat: [2, 2] });
  // blanket
  c = mkCanvas(256, 256); g = c.getContext('2d'); g.fillStyle = '#f2b6c6'; g.fillRect(0, 0, 256, 256);
  for (i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 8, 0, TAU); g.fill(); }
  TEX.blanket = toTex(c, { repeat: [1.5, 1.5] });
  // tiles
  c = mkCanvas(256, 256); g = c.getContext('2d'); g.fillStyle = '#b9c9cf'; g.fillRect(0, 0, 256, 256);
  for (y = 0; y < 256; y += 32) for (x = 0; x < 256; x += 32) { g.fillStyle = 'hsl(195,18%,' + (82 + Math.random() * 6) + '%)'; g.fillRect(x + 1, y + 1, 30, 30); }
  TEX.tile = toTex(c, { repeat: [4, 4] });
  // fabric (sofa)
  c = mkCanvas(128, 128); g = c.getContext('2d'); g.fillStyle = '#e07a3f'; g.fillRect(0, 0, 128, 128);
  for (i = 0; i < 2500; i++) { g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + Math.random() * 0.08 + ')'; g.fillRect(Math.random() * 128, Math.random() * 128, 1, 2); }
  TEX.fabric = toTex(c, { repeat: [2, 2] });
  // posters
  TEX.poster1 = toTex(posterCanvas(0)); TEX.poster2 = toTex(posterCanvas(1)); TEX.poster3 = toTex(posterCanvas(2));
  // building windows
  TEX.win = []; for (i = 0; i < 4; i++) TEX.win.push(windowTex(i));
  // concrete
  c = mkCanvas(128, 128); g = c.getContext('2d'); g.fillStyle = '#8f8f8a'; g.fillRect(0, 0, 128, 128);
  for (y = 0; y < 128; y += 2) for (x = 0; x < 128; x += 2) { g.fillStyle = 'rgba(0,0,0,' + fbm(x * 0.08, y * 0.08, 3) * 0.25 + ')'; g.fillRect(x, y, 2, 2); }
  TEX.concrete = toTex(c, { repeat: [3, 2] });
  // ramune case label
  c = mkCanvas(256, 128); g = c.getContext('2d');
  var lg = g.createLinearGradient(0, 0, 256, 128); lg.addColorStop(0, '#7df9ff'); lg.addColorStop(0.5, '#c77dff'); lg.addColorStop(1, '#ff5fa8');
  g.fillStyle = lg; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#fff'; g.font = '900 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ラムネ', 128, 52);
  g.font = '700 18px sans-serif'; g.fillText('RAMUNE  BOX', 128, 96);
  TEX.caseLabel = toTex(c);
  // neon signs
  TEX.neon1 = toTex(neonSign('ラムネ', '#7df9ff')); TEX.neon2 = toTex(neonSign('ZER9', '#ff5fa8')); TEX.neon3 = toTex(neonSign('カラオケ', '#ffe14d')); TEX.neon4 = toTex(neonSign('24H', '#7dff9a'));
  // tv
  TEX.tvCanvas = mkCanvas(256, 144); TEX.tv = toTex(TEX.tvCanvas); TEX.tv.minFilter = THREE.LinearFilter; TEX.tv.generateMipmaps = false;
  // phone screen
  TEX.phoneCanvas = mkCanvas(64, 128); TEX.phone = toTex(TEX.phoneCanvas); TEX.phone.minFilter = THREE.LinearFilter; TEX.phone.generateMipmaps = false;
  // moon
  c = mkCanvas(128, 128); g = c.getContext('2d');
  var mg = g.createRadialGradient(64, 64, 10, 64, 64, 64); mg.addColorStop(0, '#fffbe8'); mg.addColorStop(0.7, '#f4ecc8'); mg.addColorStop(0.72, 'rgba(244,236,200,0.25)'); mg.addColorStop(1, 'rgba(244,236,200,0)');
  g.fillStyle = mg; g.fillRect(0, 0, 128, 128);
  for (i = 0; i < 10; i++) { g.fillStyle = 'rgba(180,170,140,0.25)'; g.beginPath(); g.arc(40 + Math.random() * 48, 40 + Math.random() * 48, 3 + Math.random() * 7, 0, TAU); g.fill(); }
  TEX.moon = toTex(c);
  // glow sprite
  c = mkCanvas(64, 64); g = c.getContext('2d'); var gg = g.createRadialGradient(32, 32, 0, 32, 32, 32); gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gg; g.fillRect(0, 0, 64, 64);
  TEX.glow = toTex(c);
  // spider/bug sprite
  c = mkCanvas(64, 64); g = c.getContext('2d'); g.strokeStyle = '#000'; g.fillStyle = '#000'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(32, 34, 8, 11, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(32, 20, 6, 0, TAU); g.fill();
  for (i = 0; i < 4; i++) { var ly = 26 + i * 6; g.beginPath(); g.moveTo(26, ly); g.quadraticCurveTo(12, ly - 8, 6, ly + 6 + i * 2); g.stroke(); g.beginPath(); g.moveTo(38, ly); g.quadraticCurveTo(52, ly - 8, 58, ly + 6 + i * 2); g.stroke(); }
  TEX.bug = toTex(c);
}

function posterCanvas(k) {
  var c = mkCanvas(256, 360), g = c.getContext('2d'), i;
  if (k === 0) {
    var gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, '#1b0f3b'); gr.addColorStop(1, '#ff5fa8'); g.fillStyle = gr; g.fillRect(0, 0, 256, 360);
    g.fillStyle = '#ffd166'; g.beginPath(); g.arc(128, 200, 70, 0, TAU); g.fill();
    g.fillStyle = '#1b0f3b'; for (i = 0; i < 6; i++) g.fillRect(40, 190 + i * 14, 176, 5 + i);
    g.fillStyle = '#7df9ff'; g.font = '900 34px sans-serif'; g.textAlign = 'center'; g.fillText('RAMUNE', 128, 64); g.fillText('NIGHT', 128, 102);
    g.font = '700 14px sans-serif'; g.fillStyle = '#fff'; g.fillText('ALL NIGHT LONG', 128, 320);
  } else if (k === 1) {
    g.fillStyle = '#f4e9d0'; g.fillRect(0, 0, 256, 360);
    for (i = 0; i < 12; i++) { g.strokeStyle = 'hsl(' + (i * 30) + ',80%,55%)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 160, 20 + i * 11, PI, TAU); g.stroke(); }
    g.fillStyle = '#c0392b'; g.beginPath(); g.ellipse(128, 250, 60, 34, 0, PI, TAU); g.fill();
    g.fillStyle = '#fff'; for (i = 0; i < 5; i++) { g.beginPath(); g.arc(90 + i * 19, 236 - (i % 2) * 8, 5, 0, TAU); g.fill(); }
    g.fillStyle = '#e8d5b0'; g.fillRect(116, 250, 24, 50);
    g.fillStyle = '#333'; g.font = '900 22px sans-serif'; g.textAlign = 'center'; g.fillText('きのこ雲', 128, 336);
  } else {
    g.fillStyle = '#111'; g.fillRect(0, 0, 256, 360);
    g.fillStyle = '#f5e100'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.fillText('ZER9', 128, 120);
    g.fillStyle = '#fff'; g.font = '700 22px sans-serif'; g.fillText('LIVE TOUR', 128, 160);
    g.strokeStyle = '#f5e100'; g.lineWidth = 3; for (i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, 200 + i * 18); g.lineTo(256, 190 + i * 22); g.stroke(); }
    g.font = '700 14px sans-serif'; g.fillText('2:00 AM  ONLY', 128, 340);
  }
  return c;
}
function windowTex(k) {
  var c = mkCanvas(128, 256), g = c.getContext('2d');
  g.fillStyle = '#0c0f18'; g.fillRect(0, 0, 128, 256);
  var cols = 6 + k % 3, rows = 16 + k * 2, cw = 128 / cols, rh = 256 / rows;
  for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
    var r = Math.random();
    if (r < 0.38) { var warm = Math.random() < 0.75; g.fillStyle = warm ? 'hsl(' + (35 + Math.random() * 15) + ',70%,' + (55 + Math.random() * 25) + '%)' : 'hsl(200,40%,' + (60 + Math.random() * 25) + '%)'; }
    else g.fillStyle = 'rgba(30,38,55,' + (0.5 + Math.random() * 0.5) + ')';
    g.fillRect(x * cw + cw * 0.18, y * rh + rh * 0.2, cw * 0.64, rh * 0.6);
  }
  var t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function neonSign(text, col) {
  var c = mkCanvas(256, 96), g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 256, 96);
  g.font = '900 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = col; g.shadowBlur = 18; g.fillStyle = col; g.fillText(text, 128, 50); g.shadowBlur = 6; g.fillStyle = '#fff'; g.fillText(text, 128, 50);
  return c;
}
function canLabelTex(d) {
  var c = mkCanvas(256, 128), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, shade(d.col, 20)); gr.addColorStop(1, shade(d.col, -30));
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.fillStyle = d.col2; g.fillRect(0, 44, 256, 40);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = d.id === 'giga' ? '#111' : '#fff';
  g.font = '900 30px sans-serif'; g.fillText(d.id === 'giga' ? 'GIGA BOLT' : d.id === 'sour' ? 'ふわりサワー' : 'ZER9', 64, 64); g.fillText(d.id === 'giga' ? 'GIGA BOLT' : d.id === 'sour' ? 'ふわりサワー' : 'ZER9', 192, 64);
  g.fillStyle = d.id === 'giga' ? '#00ff66' : '#333'; g.font = '700 14px sans-serif';
  g.fillText(d.sub, 64, 104); g.fillText(d.sub, 192, 104);
  return toTex(c);
}
var _tvT = 0, _tvMode = 0;
function drawTV(t, on, psy) {
  var c = TEX.tvCanvas, g = c.getContext('2d'), i;
  if (!on) { g.fillStyle = '#050607'; g.fillRect(0, 0, 256, 144); TEX.tv.needsUpdate = true; return; }
  _tvT += 1; if (_tvT % 2) return;
  var mode = Math.floor(t / 14) % 3;
  if (mode === 0) { // late night shopping show
    var gr = g.createLinearGradient(0, 0, 256, 144); gr.addColorStop(0, '#ff7eb3'); gr.addColorStop(1, '#7afcff'); g.fillStyle = gr; g.fillRect(0, 0, 256, 144);
    g.fillStyle = '#fff'; g.font = '900 26px sans-serif'; g.textAlign = 'center'; g.fillText('深夜の通販', 128, 40);
    g.font = '900 34px sans-serif'; g.fillStyle = '#ffeb3b'; g.fillText('¥' + (1980 + Math.floor(t * 3) % 7 * 1000), 128, 92);
    g.fillStyle = '#ff1744'; g.fillRect(0, 118, 256, 26); g.fillStyle = '#fff'; g.font = '700 14px sans-serif'; g.fillText('いまなら２個セット！　お電話はいますぐ', 128 - (t * 40 % 300) + 150, 136);
  } else if (mode === 1) { // abstract visualizer
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 256, 144);
    for (i = 0; i < 24; i++) { var hgt = (Math.sin(t * 3 + i * 0.7) * 0.5 + 0.5) * 100 * (0.5 + Math.random() * 0.5); g.fillStyle = 'hsl(' + (i * 15 + t * 60) % 360 + ',90%,60%)'; g.fillRect(8 + i * 10, 140 - hgt, 8, hgt); }
  } else { // night news / weather
    g.fillStyle = '#0d2347'; g.fillRect(0, 0, 256, 144);
    g.fillStyle = '#fff'; g.font = '700 16px sans-serif'; g.textAlign = 'left'; g.fillText('あすの天気', 12, 26);
    g.font = '900 40px sans-serif'; g.fillText('☀', 20, 90); g.font = '700 22px sans-serif'; g.fillText('晴れ　最高 24℃', 80, 84);
    g.fillStyle = '#ffd400'; g.fillRect(0, 118, 256, 26); g.fillStyle = '#000'; g.font = '700 14px sans-serif'; g.fillText('このあと 2:00 から「深夜のラムネ工場見学」', 256 - (t * 40 % 520), 136);
  }
  if (psy > 0.3) { g.globalCompositeOperation = 'difference'; g.fillStyle = 'hsl(' + (t * 90 % 360) + ',100%,50%)'; g.globalAlpha = Math.min(0.7, psy * 0.4); g.fillRect(0, 0, 256, 144); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  for (i = 0; i < 144; i += 3) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, i, 256, 1); }
  TEX.tv.needsUpdate = true;
}
function drawPhoneScreen(clock, notif) {
  var c = TEX.phoneCanvas, g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#2b1055'); gr.addColorStop(1, '#d53369'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#fff'; g.font = '700 16px sans-serif'; g.textAlign = 'center'; g.fillText(clock, 32, 34);
  if (notif) { g.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(g, 5, 52, 54, 22, 5); g.fill(); g.fillStyle = '#d53369'; g.font = '700 9px sans-serif'; g.fillText('通知 1件', 32, 66); }
  TEX.phone.needsUpdate = true;
}
