// ---- 手続き生成テクスチャ（画像ファイルなし） ---------------------------------------
var TEX = {};
function cvs(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function canvasTex(c, rep) {
  var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  if (rep !== false) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4; return t;
}
function speckle(x, w, h, n, cols, sz) { for (var i = 0; i < n; i++) { x.fillStyle = pick(cols); var s = Math.random() * (sz || 2) + 0.5; x.fillRect(Math.random() * w, Math.random() * h, s, s); } }
function buildTextures() {
  var c, x, i, j;
  // asphalt
  c = cvs(256); x = c.getContext('2d'); x.fillStyle = '#5a5d63'; x.fillRect(0, 0, 256, 256);
  speckle(x, 256, 256, 5000, ['#4b4e54', '#6a6d73', '#53565c', '#777a80', '#3f4247'], 2);
  for (i = 0; i < 6; i++) { x.strokeStyle = 'rgba(30,30,30,0.3)'; x.lineWidth = 1; x.beginPath(); var sx = Math.random() * 256, sy = Math.random() * 256; x.moveTo(sx, sy); for (j = 0; j < 6; j++) x.lineTo(sx += rand(-20, 20), sy += rand(-20, 20)); x.stroke(); }
  TEX.asphalt = canvasTex(c);
  // grass
  c = cvs(256); x = c.getContext('2d'); x.fillStyle = '#4fae3a'; x.fillRect(0, 0, 256, 256);
  for (i = 0; i < 4000; i++) { x.strokeStyle = pick(['#3d9a2c', '#62c24a', '#459f34', '#77d15a', '#2f8a22']); x.lineWidth = 1; var gx = Math.random() * 256, gy = Math.random() * 256; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + rand(-2, 2), gy - rand(3, 7)); x.stroke(); }
  for (i = 0; i < 18; i++) { x.fillStyle = pick(['#fff', '#ff0', '#f6f']); x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, 1.6, 0, TAU); x.fill(); }
  TEX.grass = canvasTex(c);
  // paving tiles (plaza)
  c = cvs(256); x = c.getContext('2d');
  for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) { x.fillStyle = (i + j) % 3 === 0 ? '#c9b48e' : (i * 7 + j) % 5 === 0 ? '#b46a5a' : '#d9cdb5'; x.fillRect(i * 32, j * 32, 32, 32); x.strokeStyle = '#8c7d66'; x.strokeRect(i * 32 + 0.5, j * 32 + 0.5, 31, 31); }
  speckle(x, 256, 256, 1500, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.1)'], 2);
  TEX.tiles = canvasTex(c);
  // sidewalk
  c = cvs(128); x = c.getContext('2d'); x.fillStyle = '#b8b8b0'; x.fillRect(0, 0, 128, 128);
  for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) { x.strokeStyle = '#8e8e86'; x.strokeRect(i * 32 + 0.5, j * 32 + 0.5, 31, 31); }
  x.fillStyle = '#e8d24a'; for (i = 0; i < 4; i++) for (j = 0; j < 8; j++) { x.beginPath(); x.arc(48 + 8 * (j % 2) + (j % 2 ? 0 : 0), 6 + j * 16, 2, 0, TAU); x.fill(); }
  speckle(x, 128, 128, 600, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.1)'], 2);
  TEX.sidewalk = canvasTex(c);
  // dirt
  c = cvs(256); x = c.getContext('2d'); x.fillStyle = '#9b7b55'; x.fillRect(0, 0, 256, 256);
  speckle(x, 256, 256, 6000, ['#8a6a47', '#a98b63', '#7a5b3c', '#b59a75', '#6a4d32'], 3);
  TEX.dirt = canvasTex(c);
  // sand
  c = cvs(128); x = c.getContext('2d'); x.fillStyle = '#e4d29c'; x.fillRect(0, 0, 128, 128); speckle(x, 128, 128, 2000, ['#d6c288', '#f0e2b4', '#c9b47a'], 2); TEX.sand = canvasTex(c);
  // concrete
  c = cvs(256); x = c.getContext('2d'); x.fillStyle = '#c4c2bc'; x.fillRect(0, 0, 256, 256);
  speckle(x, 256, 256, 3000, ['#b4b2ac', '#d0cec8', '#a8a6a0'], 2);
  for (i = 0; i < 12; i++) { x.fillStyle = 'rgba(80,70,60,0.08)'; x.fillRect(Math.random() * 256, 0, rand(2, 6), 256); }
  TEX.concrete = canvasTex(c);
  // brick
  c = cvs(256); x = c.getContext('2d'); x.fillStyle = '#d8d0c0'; x.fillRect(0, 0, 256, 256);
  for (j = 0; j < 16; j++) for (i = -1; i < 8; i++) { x.fillStyle = pick(['#a5492e', '#b5583a', '#9a4028', '#c0623f']); x.fillRect(i * 32 + (j % 2) * 16 + 1, j * 16 + 1, 30, 14); }
  TEX.brick = canvasTex(c);
  // wood
  c = cvs(256); x = c.getContext('2d'); x.fillStyle = '#9c6b3e'; x.fillRect(0, 0, 256, 256);
  for (i = 0; i < 256; i += 32) { x.fillStyle = pick(['#8e5f35', '#a8784a', '#946339']); x.fillRect(0, i, 256, 31); x.fillStyle = 'rgba(40,20,0,0.5)'; x.fillRect(0, i + 31, 256, 1); }
  for (i = 0; i < 300; i++) { x.strokeStyle = 'rgba(60,30,10,0.18)'; x.beginPath(); var wy = Math.random() * 256; x.moveTo(0, wy); x.bezierCurveTo(80, wy + rand(-3, 3), 160, wy + rand(-3, 3), 256, wy); x.stroke(); }
  TEX.wood = canvasTex(c);
  // roof tiles
  c = cvs(256); x = c.getContext('2d'); x.fillStyle = '#3a4a6a'; x.fillRect(0, 0, 256, 256);
  for (j = 0; j < 16; j++) for (i = 0; i < 9; i++) { var g = x.createLinearGradient(0, j * 16, 0, j * 16 + 16); g.addColorStop(0, '#5a6c92'); g.addColorStop(1, '#2a3550'); x.fillStyle = g; x.beginPath(); x.arc(i * 32 + (j % 2) * 16, j * 16 + 8, 16, 0, PI); x.fill(); }
  TEX.roof = canvasTex(c);
  // water
  c = cvs(256); x = c.getContext('2d'); var wg = x.createLinearGradient(0, 0, 256, 256); wg.addColorStop(0, '#2bb5d8'); wg.addColorStop(1, '#1a7fb5'); x.fillStyle = wg; x.fillRect(0, 0, 256, 256);
  for (i = 0; i < 160; i++) { x.strokeStyle = 'rgba(255,255,255,' + rand(0.1, 0.4) + ')'; x.lineWidth = rand(1, 2.5); x.beginPath(); var qx = Math.random() * 256, qy = Math.random() * 256; x.moveTo(qx, qy); x.quadraticCurveTo(qx + 8, qy - 4, qx + 18, qy); x.stroke(); }
  TEX.water = canvasTex(c);
  // metal
  c = cvs(128); x = c.getContext('2d'); var mg = x.createLinearGradient(0, 0, 128, 0); mg.addColorStop(0, '#9aa3ad'); mg.addColorStop(0.5, '#e2e7ec'); mg.addColorStop(1, '#8c949e'); x.fillStyle = mg; x.fillRect(0, 0, 128, 128);
  for (i = 0; i < 128; i += 2) { x.fillStyle = 'rgba(255,255,255,' + rand(0, 0.08) + ')'; x.fillRect(0, i, 128, 1); }
  TEX.metal = canvasTex(c);
  // shutter
  c = cvs(128); x = c.getContext('2d'); for (i = 0; i < 128; i += 8) { var sg = x.createLinearGradient(0, i, 0, i + 8); sg.addColorStop(0, '#d0d4d8'); sg.addColorStop(1, '#8a9096'); x.fillStyle = sg; x.fillRect(0, i, 128, 8); }
  TEX.shutter = canvasTex(c);
  // floor (linoleum check)
  c = cvs(128); x = c.getContext('2d'); for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#e8e2d0' : '#6c8fb0'; x.fillRect(i * 32, j * 32, 32, 32); } TEX.floor = canvasTex(c);
  // tatami
  c = cvs(128); x = c.getContext('2d'); x.fillStyle = '#c8c27a'; x.fillRect(0, 0, 128, 128); for (i = 0; i < 128; i += 3) { x.fillStyle = 'rgba(90,80,20,0.15)'; x.fillRect(0, i, 128, 1); } x.fillStyle = '#3a4a2a'; x.fillRect(0, 0, 128, 6); x.fillRect(0, 122, 128, 6); TEX.tatami = canvasTex(c);
  // wallpaper (polka)
  c = cvs(128); x = c.getContext('2d'); x.fillStyle = '#ffe9f4'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#ff9ccf'; for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) { x.beginPath(); x.arc(i * 32 + 16 + (j % 2) * 16, j * 32 + 16, 6, 0, TAU); x.fill(); } TEX.wallpaper = canvasTex(c);
  // checker wordart floor (100%+)
  c = cvs(256); x = c.getContext('2d'); for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) { x.fillStyle = hsl((i + j) * 45, 100, 55); x.fillRect(i * 32, j * 32, 32, 32); } TEX.checker = canvasTex(c);
  // rails
  c = cvs(128); x = c.getContext('2d'); x.fillStyle = '#7a6a5a'; x.fillRect(0, 0, 128, 128); speckle(x, 128, 128, 1500, ['#6a5a4a', '#8a7a6a', '#555'], 3);
  for (i = 0; i < 128; i += 32) { x.fillStyle = '#5a3a20'; x.fillRect(0, i + 4, 128, 14); } x.fillStyle = '#9aa'; x.fillRect(30, 0, 6, 128); x.fillRect(92, 0, 6, 128); TEX.rails = canvasTex(c);

  // facades (day / night-emissive pair)
  TEX.danchi = facade('#e9e4d6', 'danchi'); TEX.shop = facade('#f2efe6', 'shop'); TEX.station = facade('#d9dde2', 'station'); TEX.house = facade('#efe0c8', 'house');
}
// ビルの壁（窓つき）。夜は窓が光る（emissive 用の別テクスチャ）
function facade(base, kind) {
  var W = 256, H = 256, c = cvs(W, H), e = cvs(W, H), x = c.getContext('2d'), y = e.getContext('2d'), i, j;
  x.fillStyle = base; x.fillRect(0, 0, W, H); y.fillStyle = '#000'; y.fillRect(0, 0, W, H);
  speckle(x, W, H, 1500, ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.08)'], 2);
  var rows = kind === 'danchi' ? 4 : 2, cols = kind === 'danchi' ? 4 : kind === 'station' ? 3 : 2;
  var cw = W / cols, rh = H / rows;
  for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
    var wx = i * cw + cw * 0.15, wy = j * rh + rh * 0.2, ww = cw * 0.7, wh = rh * 0.5;
    if (kind === 'danchi') { // balcony + door window
      x.fillStyle = '#6b7c8e'; x.fillRect(wx, wy, ww, wh); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(wx, wy, ww * 0.4, wh);
      x.fillStyle = '#d8d2c0'; x.fillRect(i * cw + 2, j * rh + rh * 0.6, cw - 4, rh * 0.32); x.strokeStyle = '#a8a290'; x.lineWidth = 2; x.strokeRect(i * cw + 2, j * rh + rh * 0.6, cw - 4, rh * 0.32);
      if (Math.random() < 0.4) { x.fillStyle = pick(['#ff6b9e', '#6bc4ff', '#fff36b', '#ffffff']); x.fillRect(wx + 4, j * rh + rh * 0.55, rand(6, 14), 10); } // 洗濯物
      if (Math.random() < 0.45) { y.fillStyle = pick(['#ffd27a', '#fff3c0', '#ffb070', '#c0e0ff']); y.fillRect(wx, wy, ww, wh * 0.95); }
    } else {
      x.fillStyle = '#4a6278'; x.fillRect(wx, wy, ww, wh); x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx + ww * 0.5, wy); x.lineTo(wx + ww * 0.7, wy); x.lineTo(wx + ww * 0.2, wy + wh); x.fill();
      x.strokeStyle = '#eee'; x.lineWidth = 3; x.strokeRect(wx, wy, ww, wh); x.beginPath(); x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh); x.stroke();
      if (Math.random() < 0.55) { y.fillStyle = pick(['#ffd27a', '#fff3c0', '#ffe0a0']); y.fillRect(wx, wy, ww, wh); }
    }
  }
  var t = canvasTex(c), te = canvasTex(e);
  return { map: t, emi: te };
}
