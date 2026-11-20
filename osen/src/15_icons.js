// ---- 昔のオンラインゲーム風アイコン（32×32、すべてプログラムで描く） ----------------------
// UI用は手続きで描き、アイテム用は 3Dモデルを小さく撮影して「ドット絵化」する
var ICON_CACHE = {};
function _ipost(c) { // 1px の黒いフチ＋左上ハイライト（昔のアイコンらしさ）
  var x = c.getContext('2d'), W = c.width, H = c.height, d = x.getImageData(0, 0, W, H), p = d.data, o = new Uint8ClampedArray(p);
  function a(i, j) { return i < 0 || j < 0 || i >= W || j >= H ? 0 : o[(j * W + i) * 4 + 3]; }
  for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
    var k = (j * W + i) * 4;
    if (o[k + 3] < 100 && (a(i - 1, j) > 160 || a(i + 1, j) > 160 || a(i, j - 1) > 160 || a(i, j + 1) > 160)) { p[k] = 24; p[k + 1] = 14; p[k + 2] = 10; p[k + 3] = 255; }
    else if (o[k + 3] >= 100) {
      p[k + 3] = 255;
      // 4段階に減色
      for (var q = 0; q < 3; q++) p[k + q] = Math.min(255, Math.round(o[k + q] / 48) * 48 + 16);
      if (a(i - 1, j) < 100 || a(i, j - 1) < 100) for (q = 0; q < 3; q++) p[k + q] = Math.min(255, p[k + q] + 50);
    }
  }
  x.putImageData(d, 0, 0); return c;
}
// ---- UI アイコン（手描き） ---------------------------------------------------------------
var UI_ICONS = {
  bag: function (x) { _ig(x, 6, 10, 20, 18, '#8a5a2a', '#5a3410'); x.fillStyle = '#6a4018'; x.fillRect(10, 5, 12, 6); x.fillStyle = '#c08a40'; x.fillRect(6, 15, 20, 3); x.fillStyle = '#ffd040'; x.fillRect(14, 15, 4, 5); },
  book: function (x) { _ig(x, 6, 5, 20, 23, '#2a4aa0', '#14246a'); x.fillStyle = '#f0e8d0'; x.fillRect(22, 7, 3, 19); x.fillStyle = '#ffd040'; x.fillRect(10, 10, 10, 2); x.fillRect(10, 14, 8, 2); _ist(x, 16, 21, 3, '#ffd040'); },
  status: function (x) { _ic(x, 16, 11, 6, '#f0c8a0'); x.fillStyle = '#3060c0'; x.fillRect(8, 18, 16, 10); x.fillStyle = '#222'; x.fillRect(10, 5, 12, 4); },
  gear: function (x) { x.fillStyle = '#a0a8b0'; for (var i = 0; i < 8; i++) { x.save(); x.translate(16, 16); x.rotate(i * PI / 4); x.fillRect(-3, -14, 6, 6); x.restore(); } _ic(x, 16, 16, 10, '#b8c0c8'); _ic(x, 16, 16, 4, '#404850'); },
  chat: function (x) { x.fillStyle = '#f8f8f0'; _irr(x, 3, 5, 26, 17, 5); x.beginPath(); x.moveTo(8, 21); x.lineTo(6, 28); x.lineTo(14, 21); x.fill(); x.fillStyle = '#4060c0'; x.fillRect(8, 11, 3, 3); x.fillRect(15, 11, 3, 3); x.fillRect(22, 11, 3, 3); },
  stamp: function (x) { _ic(x, 16, 16, 12, '#ffd040'); x.fillStyle = '#000'; x.fillRect(11, 12, 3, 4); x.fillRect(19, 12, 3, 4); x.fillRect(11, 20, 10, 2); x.fillRect(10, 19, 2, 2); x.fillRect(20, 19, 2, 2); },
  gesture: function (x) { x.fillStyle = '#f0c8a0'; x.fillRect(10, 12, 12, 14); for (var i = 0; i < 4; i++) x.fillRect(10 + i * 3, 4 + (i % 2) * 2, 3, 10); x.fillRect(5, 15, 6, 4); x.fillStyle = '#c08060'; x.fillRect(10, 24, 12, 2); },
  skill: function (x) { _ist(x, 16, 16, 13, '#ff5a20'); _ist(x, 16, 16, 7, '#ffe040'); },
  map: function (x) { _ig(x, 4, 6, 24, 20, '#e8d8a0', '#a08850'); x.strokeStyle = '#a03020'; x.lineWidth = 2; x.beginPath(); x.moveTo(7, 22); x.lineTo(14, 13); x.lineTo(20, 18); x.lineTo(26, 9); x.stroke(); x.fillStyle = '#d02020'; x.fillRect(24, 7, 4, 4); },
  char: function (x) { _ic(x, 16, 10, 6, '#f0d0b0'); x.fillStyle = '#111'; x.fillRect(10, 3, 12, 5); x.fillRect(9, 6, 3, 10); x.fillRect(20, 6, 3, 10); x.fillStyle = '#fff'; x.fillRect(10, 17, 12, 12); },
  hand: function (x) { x.fillStyle = '#f0c8a0'; x.fillRect(9, 13, 15, 14); for (var i = 0; i < 4; i++) x.fillRect(9 + i * 4, 5 + Math.abs(i - 1.5) * 2, 3, 10); x.fillRect(4, 16, 6, 4); },
  grab: function (x) { x.fillStyle = '#f0c8a0'; x.fillRect(8, 10, 16, 14); x.fillStyle = '#c09070'; for (var i = 0; i < 4; i++) x.fillRect(9 + i * 4, 10, 1, 6); x.fillStyle = '#f0c8a0'; x.fillRect(4, 14, 6, 6); x.fillStyle = '#ffd040'; x.fillRect(12, 24, 8, 5); },
  throw: function (x) { _ic(x, 22, 10, 6, '#e04040'); x.fillStyle = '#ffd040'; x.fillRect(4, 18, 10, 2); x.fillRect(6, 23, 12, 2); x.fillRect(9, 13, 8, 2); },
  rotate: function (x) { x.strokeStyle = '#40c0ff'; x.lineWidth = 4; x.beginPath(); x.arc(16, 16, 10, 0.3, PI * 1.7); x.stroke(); x.fillStyle = '#40c0ff'; x.beginPath(); x.moveTo(22, 2); x.lineTo(30, 10); x.lineTo(20, 12); x.fill(); },
  bigger: function (x) { x.fillStyle = '#40e060'; x.fillRect(13, 4, 6, 24); x.fillRect(4, 13, 24, 6); },
  smaller: function (x) { x.fillStyle = '#e06040'; x.fillRect(4, 13, 24, 6); },
  store: function (x) { UI_ICONS.bag(x); x.fillStyle = '#40e060'; x.fillRect(22, 2, 4, 10); x.fillRect(19, 5, 10, 4); },
  combine: function (x) { _ic(x, 10, 12, 7, '#40a0ff'); _ic(x, 22, 12, 7, '#ff6040'); _ic(x, 16, 22, 7, '#c040ff'); _ist(x, 16, 15, 5, '#fff'); },
  special: function (x) { x.fillStyle = '#c040ff'; x.beginPath(); x.moveTo(16, 2); x.lineTo(28, 16); x.lineTo(16, 30); x.lineTo(4, 16); x.fill(); _ist(x, 16, 16, 6, '#fff'); },
  close: function (x) { x.strokeStyle = '#fff'; x.lineWidth = 5; x.beginPath(); x.moveTo(7, 7); x.lineTo(25, 25); x.moveTo(25, 7); x.lineTo(7, 25); x.stroke(); },
  sound: function (x) { x.fillStyle = '#d0d0d0'; x.fillRect(5, 12, 6, 8); x.beginPath(); x.moveTo(10, 12); x.lineTo(18, 5); x.lineTo(18, 27); x.lineTo(10, 20); x.fill(); x.strokeStyle = '#ffd040'; x.lineWidth = 2; x.beginPath(); x.arc(18, 16, 6, -0.8, 0.8); x.stroke(); x.beginPath(); x.arc(18, 16, 10, -0.8, 0.8); x.stroke(); },
  music: function (x) { x.fillStyle = '#ffd040'; x.fillRect(12, 5, 3, 18); x.fillRect(22, 3, 3, 18); x.fillRect(12, 3, 13, 4); _ic(x, 10, 23, 4, '#ffd040'); _ic(x, 20, 21, 4, '#ffd040'); },
  lite: function (x) { x.fillStyle = '#ffe040'; x.beginPath(); x.moveTo(18, 2); x.lineTo(7, 18); x.lineTo(15, 18); x.lineTo(12, 30); x.lineTo(25, 13); x.lineTo(17, 13); x.fill(); },
  eye: function (x) { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(16, 16, 13, 8, 0, 0, TAU); x.fill(); _ic(x, 16, 16, 6, '#3060c0'); _ic(x, 16, 16, 3, '#000'); },
  mute: function (x) { UI_ICONS.eye(x); x.strokeStyle = '#e02020'; x.lineWidth = 4; x.beginPath(); x.moveTo(4, 28); x.lineTo(28, 4); x.stroke(); },
  star: function (x) { _ist(x, 16, 16, 13, '#ffd040'); },
  heart: function (x) { x.fillStyle = '#ff4080'; x.beginPath(); x.moveTo(16, 28); x.bezierCurveTo(-2, 14, 8, 0, 16, 9); x.bezierCurveTo(24, 0, 34, 14, 16, 28); x.fill(); },
  coin: function (x) { _ic(x, 16, 16, 12, '#e0b030'); _ic(x, 16, 16, 8, '#ffd860'); x.fillStyle = '#b08010'; x.fillRect(14, 10, 4, 12); },
  clock: function (x) { _ic(x, 16, 16, 13, '#f0f0e0'); x.strokeStyle = '#222'; x.lineWidth = 2; x.beginPath(); x.moveTo(16, 16); x.lineTo(16, 7); x.moveTo(16, 16); x.lineTo(23, 18); x.stroke(); },
  sun: function (x) { x.fillStyle = '#ffb020'; for (var i = 0; i < 8; i++) { x.save(); x.translate(16, 16); x.rotate(i * PI / 4); x.fillRect(-2, -15, 4, 6); x.restore(); } _ic(x, 16, 16, 8, '#ffe040'); },
  moon: function (x) { _ic(x, 16, 16, 12, '#ffe890'); x.globalCompositeOperation = 'destination-out'; _ic(x, 22, 12, 11, '#000'); x.globalCompositeOperation = 'source-over'; },
  warn: function (x) { x.fillStyle = '#ffd020'; x.beginPath(); x.moveTo(16, 3); x.lineTo(30, 28); x.lineTo(2, 28); x.fill(); x.fillStyle = '#000'; x.fillRect(14, 11, 4, 10); x.fillRect(14, 23, 4, 3); },
  info: function (x) { _ic(x, 16, 16, 13, '#3080e0'); x.fillStyle = '#fff'; x.fillRect(14, 13, 4, 11); x.fillRect(14, 7, 4, 4); },
  people: function (x) { _ic(x, 11, 11, 5, '#f0c8a0'); _ic(x, 22, 13, 5, '#f0c8a0'); x.fillStyle = '#4080e0'; x.fillRect(5, 17, 12, 11); x.fillStyle = '#e04080'; x.fillRect(16, 19, 12, 9); },
  door: function (x) { _ig(x, 8, 3, 16, 26, '#8a5a2a', '#4a2a08'); _ic(x, 20, 17, 2, '#ffd040'); },
  home: function (x) { x.fillStyle = '#d04030'; x.beginPath(); x.moveTo(16, 3); x.lineTo(30, 15); x.lineTo(2, 15); x.fill(); x.fillStyle = '#f0e0c0'; x.fillRect(6, 15, 20, 13); x.fillStyle = '#6a4018'; x.fillRect(13, 19, 6, 9); },
  jump: function (x) { x.fillStyle = '#40e060'; x.beginPath(); x.moveTo(16, 3); x.lineTo(28, 17); x.lineTo(20, 17); x.lineTo(20, 28); x.lineTo(12, 28); x.lineTo(12, 17); x.lineTo(4, 17); x.fill(); },
  run: function (x) { x.fillStyle = '#40a0ff'; for (var i = 0; i < 3; i++) { x.beginPath(); x.moveTo(5 + i * 9, 6); x.lineTo(14 + i * 9, 16); x.lineTo(5 + i * 9, 26); x.lineTo(9 + i * 9, 16); x.fill(); } },
  touch: function (x) { UI_ICONS.hand(x); _ist(x, 25, 7, 5, '#ffd040'); },
  put: function (x) { _ig(x, 6, 20, 20, 8, '#a08060', '#604020'); x.fillStyle = '#40e060'; x.fillRect(13, 3, 6, 12); x.beginPath(); x.moveTo(8, 13); x.lineTo(24, 13); x.lineTo(16, 20); x.fill(); },
  exit: function (x) { UI_ICONS.door(x); x.fillStyle = '#40e060'; x.fillRect(20, 14, 10, 4); },
  q: function (x) { _ic(x, 16, 16, 13, '#40a0ff'); x.fillStyle = '#fff'; x.font = '900 22px ' + FONT_UI; x.textAlign = 'center'; x.fillText('?', 16, 24); },
  ex: function (x) { _ic(x, 16, 16, 13, '#ff4040'); x.fillStyle = '#fff'; x.fillRect(14, 6, 4, 13); x.fillRect(14, 22, 4, 4); },
  sweat: function (x) { x.fillStyle = '#60c0ff'; x.beginPath(); x.moveTo(16, 3); x.quadraticCurveTo(27, 18, 16, 28); x.quadraticCurveTo(5, 18, 16, 3); x.fill(); },
  zzz: function (x) { x.fillStyle = '#a0c0ff'; x.font = '900 14px ' + FONT_UI; x.fillText('Z', 3, 28); x.font = '900 18px ' + FONT_UI; x.fillText('Z', 11, 20); x.font = '900 12px ' + FONT_UI; x.fillText('Z', 21, 11); },
  note: function (x) { UI_ICONS.music(x); },
  tear: function (x) { _ic(x, 16, 15, 12, '#ffd040'); x.fillStyle = '#000'; x.fillRect(10, 12, 4, 2); x.fillRect(18, 12, 4, 2); x.fillStyle = '#40a0ff'; x.fillRect(10, 15, 3, 10); x.fillRect(19, 15, 3, 10); },
  anger: function (x) { x.strokeStyle = '#ff3030'; x.lineWidth = 4; [[8, 8], [24, 8], [8, 24], [24, 24]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 6, 0, PI / 1.5); x.stroke(); }); },
  ok: function (x) { _ic(x, 16, 16, 13, '#40d060'); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(8, 16); x.lineTo(14, 22); x.lineTo(24, 9); x.stroke(); },
  no: function (x) { _ic(x, 16, 16, 13, '#e03030'); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(9, 9); x.lineTo(23, 23); x.moveTo(23, 9); x.lineTo(9, 23); x.stroke(); },
  rice: function (x) { x.fillStyle = '#fafafa'; x.beginPath(); x.moveTo(16, 3); x.lineTo(29, 26); x.lineTo(3, 26); x.fill(); x.fillStyle = '#1a3a1a'; x.fillRect(9, 18, 14, 9); },
  cucumber: function (x) { x.save(); x.translate(16, 16); x.rotate(-0.7); x.fillStyle = '#2a8a2a'; _irr(x, -14, -5, 28, 10, 5); x.fillStyle = '#60c040'; for (var i = -10; i < 12; i += 5) x.fillRect(i, -3, 2, 2); x.restore(); },
  eight: function (x) { _ic(x, 16, 16, 13, '#ff60c0'); x.fillStyle = '#fff'; x.font = '900 22px ' + FONT_UI; x.textAlign = 'center'; x.fillText('8', 16, 24); },
  burst: function (x) { _ist(x, 16, 16, 14, '#ff3010', 10); _ist(x, 16, 16, 9, '#ffe040', 10); },
  smile: function (x) { UI_ICONS.stamp(x); },
  wave: function (x) { UI_ICONS.hand(x); x.strokeStyle = '#ffd040'; x.lineWidth = 2; x.beginPath(); x.arc(16, 16, 14, -2.4, -0.8); x.stroke(); },
  bow: function (x) { _ic(x, 10, 14, 5, '#f0c8a0'); x.fillStyle = '#4060c0'; x.save(); x.translate(18, 20); x.rotate(-0.9); x.fillRect(-4, -8, 8, 16); x.restore(); },
  spin: function (x) { UI_ICONS.rotate(x); },
  dance: function (x) { UI_ICONS.music(x); _ist(x, 6, 6, 4, '#ff60c0'); },
  nod: function (x) { UI_ICONS.ok(x); },
  shake: function (x) { UI_ICONS.no(x); },
  sit: function (x) { _ic(x, 16, 12, 5, '#f0c8a0'); x.fillStyle = '#4060c0'; x.fillRect(10, 18, 12, 6); x.fillRect(8, 24, 16, 4); },
  log: function (x) { _ig(x, 5, 4, 22, 24, '#f0e8d0', '#a09070'); x.fillStyle = '#504030'; for (var i = 0; i < 5; i++) x.fillRect(8, 8 + i * 4, 14 - (i % 2) * 4, 2); },
  pollution: function (x) { _ic(x, 16, 18, 11, '#8a20c0'); _ic(x, 12, 14, 4, '#c060ff'); x.fillStyle = '#40ff60'; x.fillRect(14, 2, 4, 8); },
  genki: function (x) { UI_ICONS.heart(x); },
  arrowL: function (x) { x.fillStyle = '#ffd040'; x.beginPath(); x.moveTo(6, 16); x.lineTo(22, 4); x.lineTo(22, 28); x.fill(); },
  arrowR: function (x) { x.fillStyle = '#ffd040'; x.beginPath(); x.moveTo(26, 16); x.lineTo(10, 4); x.lineTo(10, 28); x.fill(); },
  server: function (x) { for (var i = 0; i < 3; i++) { _ig(x, 5, 4 + i * 9, 22, 7, '#9098a8', '#505868'); x.fillStyle = i ? '#40ff60' : '#ff4040'; x.fillRect(22, 6 + i * 9, 3, 3); } },
  channel: function (x) { UI_ICONS.server(x); },
  scroll: function (x) { _ig(x, 7, 5, 18, 22, '#f0e0b0', '#a08050'); x.fillStyle = '#c0a070'; x.fillRect(5, 3, 22, 4); x.fillRect(5, 25, 22, 4); x.fillStyle = '#806040'; x.fillRect(10, 11, 12, 2); x.fillRect(10, 15, 10, 2); x.fillRect(10, 19, 12, 2); },
  key: function (x) { _ic(x, 10, 12, 7, '#e0b030'); _ic(x, 10, 12, 3, '#3a2a10'); x.fillStyle = '#e0b030'; x.fillRect(15, 11, 14, 4); x.fillRect(23, 15, 3, 5); x.fillRect(27, 15, 2, 4); },
  quit: function (x) { UI_ICONS.exit(x); },
  dressing: function (x) { _ig(x, 7, 3, 18, 26, '#d04080', '#801040'); x.fillStyle = '#ffe0f0'; x.fillRect(10, 6, 12, 14); UI_ICONS.char.call(null, x); },
  minimap: function (x) { UI_ICONS.map(x); }
};
function _ig(x, X, Y, W, H, c1, c2) { var gr = x.createLinearGradient(X, Y, X, Y + H); gr.addColorStop(0, c1); gr.addColorStop(1, c2); x.fillStyle = gr; x.fillRect(X, Y, W, H); }
function _ic(x, X, Y, r, col) { x.fillStyle = col; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); }
function _irr(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.fill(); }
function _ist(x, X, Y, r, col, n) { n = n || 5; x.fillStyle = col; x.beginPath(); for (var i = 0; i < n * 2; i++) { var rr2 = i % 2 ? r * 0.45 : r, a = -PI / 2 + i * PI / n; x.lineTo(X + Math.cos(a) * rr2, Y + Math.sin(a) * rr2); } x.fill(); }
function uiIcon(name) {
  if (ICON_CACHE['u_' + name]) return ICON_CACHE['u_' + name];
  var cv = cvs(32), x = cv.getContext('2d');
  try { (UI_ICONS[name] || UI_ICONS.q)(x); } catch (e) { UI_ICONS.q(x); }
  _ipost(cv); ICON_CACHE['u_' + name] = cv; return cv;
}
// アイテムのアイコン：3Dモデルを 64px で撮影 → 32px に縮小 → 減色＋フチ
var _iconRT = null, _iconScene = null, _iconCam = null;
function itemIcon(type) {
  var key = 'i_' + type; if (ICON_CACHE[key]) return ICON_CACHE[key];
  var cv = cvs(32);
  try {
    if (!_iconRT) {
      _iconRT = new THREE.WebGLRenderTarget(64, 64, { format: THREE.RGBAFormat });
      _iconScene = new THREE.Scene();
      _iconScene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.0));
      var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(2, 3, 4); _iconScene.add(dl);
      _iconCam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    }
    var obj = makeItemMesh(type);
    var box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    obj.position.sub(ctr); var pivot = new THREE.Group(); pivot.add(obj); pivot.rotation.y = -0.6; pivot.rotation.x = 0.25;
    _iconScene.add(pivot);
    var r = Math.max(size.x, size.y, size.z) * 0.62;
    _iconCam.position.set(0, 0, r / Math.tan(15 * PI / 180) * 1.05); _iconCam.lookAt(0, 0, 0);
    var ren = R.renderer, prevT = ren.getRenderTarget(), prevC = ren.getClearColor(new THREE.Color()), prevA = ren.getClearAlpha();
    ren.setRenderTarget(_iconRT); ren.setClearColor(0x000000, 0); ren.clear(); ren.render(_iconScene, _iconCam);
    var px = new Uint8Array(64 * 64 * 4); ren.readRenderTargetPixels(_iconRT, 0, 0, 64, 64, px);
    ren.setRenderTarget(prevT); ren.setClearColor(prevC, prevA);
    _iconScene.remove(pivot);
    var big = cvs(64), bx = big.getContext('2d'), id = bx.createImageData(64, 64);
    for (var y = 0; y < 64; y++) for (var x2 = 0; x2 < 64; x2++) { var s = ((63 - y) * 64 + x2) * 4, d = (y * 64 + x2) * 4; for (var k = 0; k < 4; k++) id.data[d + k] = px[s + k]; }
    bx.putImageData(id, 0, 0);
    var x = cv.getContext('2d'); x.imageSmoothingEnabled = true; x.drawImage(big, 2, 2, 28, 28);
    _ipost(cv);
  } catch (e) { var xx = cv.getContext('2d'); UI_ICONS.q(xx); }
  ICON_CACHE[key] = cv; return cv;
}
function iconEl(cvsrc, size, cls) {
  var e = document.createElement('canvas'); e.width = 32; e.height = 32; e.getContext('2d').drawImage(cvsrc, 0, 0);
  e.className = 'ico' + (cls ? ' ' + cls : ''); e.style.width = e.style.height = (size || 32) + 'px'; return e;
}
