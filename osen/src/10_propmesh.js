// ---- さわれる物の形（すべてプログラムで作る） ----------------------------------------
var PMAT = {};
function pm(color, shiny, emissive) {
  var k = color + '|' + (shiny ? 1 : 0) + '|' + (emissive || 0);
  if (!PMAT[k]) PMAT[k] = shiny ? new THREE.MeshPhongMaterial({ color: color, shininess: 80, specular: 0x666666, emissive: emissive || 0 }) : new THREE.MeshLambertMaterial({ color: color, emissive: emissive || 0 });
  return PMAT[k];
}
function part(g, geo, mat, x, y, z, sx, sy, sz, rx, ry, rz) {
  var m = new THREE.Mesh(geo, typeof mat === 'number' ? pm(mat) : mat);
  m.position.set(x || 0, y || 0, z || 0); m.scale.set(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz);
  m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; g.add(m); return m;
}
var PG = null;
function propGeos() {
  PG = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), sph: new THREE.SphereGeometry(1, 14, 10), cone: new THREE.ConeGeometry(1, 1, 12), tor: new THREE.TorusGeometry(1, 0.25, 8, 18), plane: new THREE.PlaneGeometry(1, 1) };
}
function texPlane(canvas, w, h) { var t = canvasTex(canvas, false); var m = new THREE.Mesh(PG.plane, new THREE.MeshLambertMaterial({ map: t, transparent: true })); m.scale.set(w, h, 1); return m; }
function vendFront(label, cols, style) {
  var c = cvs(256, 512), x = c.getContext('2d');
  var g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, '#fff'); g.addColorStop(1, '#dfe8f0'); x.fillStyle = g; x.fillRect(0, 0, 256, 512);
  x.fillStyle = '#1a2a3a'; x.fillRect(16, 110, 224, 230);
  for (var r = 0; r < 3; r++) for (var i = 0; i < 6; i++) {
    var cx = 30 + i * 36, cy = 130 + r * 72; x.fillStyle = cols[(i + r) % cols.length]; x.fillRect(cx, cy, 24, 46);
    x.fillStyle = 'rgba(255,255,255,0.45)'; x.fillRect(cx + 3, cy + 2, 5, 42); x.fillStyle = '#ccc'; x.fillRect(cx, cy, 24, 5);
    x.fillStyle = '#f33'; x.fillRect(cx + 4, cy + 52, 16, 9);
  }
  var wa = wordArt(label, { style: style || 0, size: 64 }); var sc = Math.min(236 / wa.waW, 96 / wa.waH); x.drawImage(wa, 128 - wa.waW * sc / 2, 8, wa.waW * sc, wa.waH * sc);
  x.fillStyle = '#333'; x.fillRect(150, 380, 70, 40); x.fillStyle = '#111'; x.fillRect(40, 440, 176, 46);
  cnFillText(x, '冷たい　あったかい', 128, 370, 20, 900, '#d00', 'center');
  return c;
}
function labelCanvas(text, style, w, h) { var c = cvs(w || 256, h || 128), x = c.getContext('2d'); var wa = wordArt(text, { style: style || 0, size: 64 }); var sc = Math.min(c.width * 0.95 / wa.waW, c.height * 0.95 / wa.waH); x.drawImage(wa, (c.width - wa.waW * sc) / 2, (c.height - wa.waH * sc) / 2, wa.waW * sc, wa.waH * sc); return c; }

var BUILD = {
  vend: function (g, o) {
    part(g, PG.box, pm(o.color || 0xd02030, true), 0, 0.95, 0, 1.0, 1.9, 0.8);
    var f = texPlane(vendFront(o.label || 'のみもの', o.cols || ['#e33', '#39f', '#fc0', '#3c6', '#f6c', '#fff'], o.style), 0.9, 1.75); f.position.set(0, 0.95, 0.41); g.add(f);
    part(g, PG.box, 0x222222, 0, 1.92, 0, 1.02, 0.06, 0.82);
  },
  ticket: function (g) { part(g, PG.box, pm(0xe8ecf0, true), 0, 0.75, 0, 1.0, 1.5, 0.6); var f = texPlane(labelCanvas('きっぷ', 4), 0.8, 0.4); f.position.set(0, 1.2, 0.31); g.add(f); part(g, PG.box, 0x3366aa, 0, 0.85, 0.31, 0.7, 0.4, 0.02); },
  cone: function (g) { part(g, PG.cone, 0xff5a00, 0, 0.4, 0, 0.25, 0.8, 0.25); part(g, PG.cyl, 0xffffff, 0, 0.45, 0, 0.17, 0.1, 0.17); part(g, PG.box, 0xff5a00, 0, 0.02, 0, 0.6, 0.04, 0.6); },
  trash: function (g) { part(g, PG.cyl, pm(0x2a7a3a, true), 0, 0.45, 0, 0.32, 0.9, 0.32); part(g, PG.cyl, 0x1a4a2a, 0, 0.92, 0, 0.34, 0.06, 0.34); },
  phone: function (g) { part(g, PG.box, pm(0x2fb04a, true), 0, 0.6, 0, 0.55, 0.5, 0.4); part(g, PG.box, 0x333333, 0, 0.35, 0, 0.12, 0.7, 0.12); part(g, PG.box, 0x111111, 0, 0.92, 0.18, 0.4, 0.1, 0.1); part(g, PG.box, 0x777777, 0, 0.6, 0.21, 0.3, 0.25, 0.02); },
  timetable: function (g) { part(g, PG.cyl, 0x888888, 0, 1.0, 0, 0.05, 2.0, 0.05); var f = texPlane(labelCanvas('時刻表', 12, 256, 128), 0.7, 0.35); f.position.set(0, 2.05, 0.03); g.add(f); var d = cvs(128, 256), x = d.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 256); for (var i = 0; i < 9; i++) cnFillText(x, (i + 6) + '時　ー　ー', 10, 30 + i * 25, 18, 700, '#123', 'left'); var f2 = texPlane(d, 0.5, 1.0); f2.position.set(0, 1.35, 0.06); g.add(f2); },
  bird: function (g, o) { var c = o.color || 0x8a8f9a; part(g, PG.sph, c, 0, 0.18, 0, 0.16, 0.13, 0.22); part(g, PG.sph, c, 0, 0.32, 0.14, 0.09); part(g, PG.cone, 0xffaa00, 0, 0.32, 0.25, 0.03, 0.08, 0.03, PI / 2); part(g, PG.sph, 0x000000, 0.05, 0.35, 0.2, 0.015); part(g, PG.sph, 0x000000, -0.05, 0.35, 0.2, 0.015); part(g, PG.box, 0xff8a00, 0, 0.03, 0, 0.12, 0.06, 0.05); },
  umbrella: function (g) { part(g, PG.cyl, 0x222222, 0, 0.45, 0, 0.015, 0.9, 0.015, 0.25); part(g, PG.cone, 0x5a8aff, 0, 0.6, 0.12, 0.15, 0.7, 0.15, 0.25); part(g, PG.tor, 0x222222, 0, 0.92, -0.12, 0.05, 0.05, 0.05); },
  register: function (g) { part(g, PG.box, pm(0xdddddd, true), 0, 0.12, 0, 0.5, 0.24, 0.4); part(g, PG.box, 0x113322, 0, 0.36, -0.05, 0.3, 0.2, 0.04, -0.3); part(g, PG.box, 0x999999, 0, 0.25, 0.12, 0.4, 0.04, 0.15); },
  onigiri: function (g) { for (var i = 0; i < 3; i++) { var o = new THREE.Group(); part(o, PG.cone, 0xffffff, 0, 0.09, 0, 0.11, 0.18, 0.05, PI / 2, 0, 0); part(o, PG.box, 0x112211, 0, 0.03, 0.03, 0.12, 0.07, 0.02); o.rotation.x = -PI / 2; o.position.set(i * 0.26 - 0.26, 0.04, 0); o.children.forEach(function () {}); g.add(o); } },
  cup: function (g) { part(g, PG.cyl, 0xffffff, 0, 0.05, 0, 0.06, 0.1, 0.06); part(g, PG.cyl, 0x3a1a0a, 0, 0.1, 0, 0.055, 0.005, 0.055); part(g, PG.cyl, 0xffffff, 0, 0.005, 0, 0.12, 0.01, 0.12); part(g, PG.tor, 0xffffff, 0.07, 0.05, 0, 0.03, 0.03, 0.03); },
  radio: function (g) { part(g, PG.box, 0xb04020, 0, 0.12, 0, 0.4, 0.24, 0.15); part(g, PG.cyl, 0x222222, -0.08, 0.12, 0.08, 0.07, 0.02, 0.07, PI / 2); part(g, PG.box, 0xeeddaa, 0.1, 0.15, 0.08, 0.12, 0.08, 0.01); part(g, PG.cyl, 0xaaaaaa, 0.15, 0.35, 0, 0.005, 0.3, 0.005, 0, 0, -0.3); },
  gacha: function (g) { part(g, PG.box, 0xff3344, 0, 0.4, 0, 0.5, 0.8, 0.5); var gl = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, shininess: 100 }); part(g, PG.sph, gl, 0, 1.05, 0, 0.32); for (var i = 0; i < 9; i++) part(g, PG.sph, pick([0xff6699, 0x66ccff, 0xffee44, 0x77ee77]), rand(-0.17, 0.17), 0.88 + rand(0, 0.25), rand(-0.17, 0.17), 0.07); part(g, PG.cyl, 0xcccccc, 0, 0.5, 0.26, 0.08, 0.04, 0.08, PI / 2); },
  cabbage: function (g) { part(g, PG.box, 0xc08a50, 0, 0.35, 0, 0.9, 0.7, 0.6); for (var i = 0; i < 4; i++) part(g, PG.sph, 0x7ad04a, -0.3 + i * 0.2, 0.78, rand(-0.1, 0.1), 0.13); var f = texPlane(labelCanvas('１玉　100万円', 3, 256, 96), 0.6, 0.22); f.position.set(0, 0.45, 0.31); g.add(f); },
  fish: function (g) { part(g, PG.box, 0x3a7ab0, 0, 0.4, 0, 1.0, 0.8, 0.6); part(g, PG.box, 0xddeeff, 0, 0.81, 0, 0.95, 0.04, 0.55); for (var i = 0; i < 3; i++) { var f = new THREE.Group(); part(f, PG.sph, pm(0xb8c8d8, true), 0, 0, 0, 0.18, 0.06, 0.06); part(f, PG.cone, 0x8898a8, -0.2, 0, 0, 0.06, 0.1, 0.02, 0, 0, PI / 2); f.position.set(0, 0.88, -0.18 + i * 0.18); g.add(f); } },
  mic: function (g) { part(g, PG.cyl, 0x222222, 0, 0.75, 0, 0.015, 1.5, 0.015); part(g, PG.cyl, 0x222222, 0, 0.02, 0, 0.2, 0.04, 0.2); part(g, PG.sph, pm(0xcccccc, true), 0, 1.55, 0.05, 0.06); part(g, PG.cyl, 0x111111, 0, 1.47, 0.03, 0.025, 0.14, 0.025, 0.4); },
  barber: function (g) { part(g, PG.cyl, 0xffffff, 0, 0.9, 0, 0.12, 1.4, 0.12); var c = cvs(64, 128), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 64, 128); for (var i = -4; i < 8; i++) { x.fillStyle = i % 2 ? '#e22' : '#22e'; x.beginPath(); x.moveTo(0, i * 24); x.lineTo(64, i * 24 + 32); x.lineTo(64, i * 24 + 44); x.lineTo(0, i * 24 + 12); x.fill(); } var t = canvasTex(c); var m = part(g, PG.cyl, new THREE.MeshPhongMaterial({ map: t, shininess: 90 }), 0, 0.9, 0, 0.11, 1.3, 0.11); m.name = 'spin'; part(g, PG.sph, 0xdddddd, 0, 1.65, 0, 0.14); part(g, PG.box, 0x888888, 0, 0.1, 0, 0.3, 0.2, 0.3); },
  tanuki: function (g) { var b = 0x8a5a30; part(g, PG.sph, b, 0, 0.45, 0, 0.42, 0.45, 0.38); part(g, PG.sph, 0xe8d0a0, 0, 0.4, 0.22, 0.3, 0.32, 0.2); part(g, PG.sph, b, 0, 1.05, 0, 0.3); part(g, PG.sph, 0x111111, 0, 1.02, 0.28, 0.07); part(g, PG.sph, 0xffffff, -0.1, 1.12, 0.25, 0.07); part(g, PG.sph, 0xffffff, 0.1, 1.12, 0.25, 0.07); part(g, PG.cyl, 0xcdb380, 0, 1.4, 0, 0.32, 0.06, 0.32); part(g, PG.cone, 0xcdb380, 0, 1.52, 0, 0.18, 0.2, 0.18); part(g, PG.cyl, 0x8a6a30, 0.35, 0.55, 0.15, 0.1, 0.3, 0.1); },
  daruma: function (g) { part(g, PG.sph, pm(0xdd1111, true), 0, 0.4, 0, 0.4, 0.42, 0.38); part(g, PG.sph, 0xffeedd, 0, 0.5, 0.22, 0.24, 0.2, 0.18); part(g, PG.sph, 0xffffff, -0.08, 0.53, 0.37, 0.06); part(g, PG.sph, 0xffffff, 0.08, 0.53, 0.37, 0.06); part(g, PG.sph, 0x000000, 0.08, 0.53, 0.42, 0.025); },
  garapon: function (g) { part(g, PG.box, 0xc03030, 0, 0.45, 0, 1.2, 0.9, 0.7); var m = part(g, PG.cyl6, pm(0xb08040, true), 0, 1.2, 0, 0.35, 0.5, 0.35, 0, 0, PI / 2); m.name = 'spin2'; part(g, PG.box, 0x444444, 0.35, 1.2, 0.15, 0.04, 0.04, 0.35); var f = texPlane(labelCanvas('福引き', 0, 256, 96), 0.9, 0.34); f.position.set(0, 0.55, 0.36); g.add(f); },
  cart: function (g) { var c = 0xaaaaaa; part(g, PG.box, pm(c, true), 0, 0.75, 0, 0.55, 0.5, 0.8); for (var i = 0; i < 4; i++) part(g, PG.cyl, 0x222222, (i % 2 - 0.5) * 0.5, 0.08, ((i >> 1) - 0.5) * 0.7, 0.08, 0.05, 0.08, 0, 0, PI / 2); part(g, PG.cyl, 0xff3333, 0, 1.1, -0.42, 0.03, 0.55, 0.03, 0, 0, PI / 2); },
  bike: function (g) { var c = 0x2aa0ff; part(g, PG.tor, 0x222222, 0, 0.35, -0.5, 0.33, 0.33, 0.6, 0, PI / 2); part(g, PG.tor, 0x222222, 0, 0.35, 0.5, 0.33, 0.33, 0.6, 0, PI / 2); part(g, PG.box, c, 0, 0.55, 0, 0.05, 0.05, 1.0, -0.3); part(g, PG.box, 0x222222, 0, 0.85, -0.3, 0.18, 0.06, 0.25); part(g, PG.box, 0x888888, 0, 0.95, 0.45, 0.6, 0.04, 0.04); part(g, PG.box, pm(0xffffff, true), 0, 0.82, 0.55, 0.3, 0.2, 0.2); },
  tv: function (g, o) { part(g, PG.box, 0x5a3a20, 0, 0.25, 0, 0.8, 0.5, 0.5); part(g, PG.box, pm(0x222222, true), 0, 0.82, 0, 0.75, 0.62, 0.6); var sc = part(g, PG.box, new THREE.MeshBasicMaterial({ color: 0x66ffcc }), 0, 0.84, 0.301, 0.6, 0.48, 0.01); sc.name = 'screen'; part(g, PG.cyl, 0x999999, 0.15, 1.3, 0, 0.01, 0.4, 0.01, 0, 0, 0.5); part(g, PG.cyl, 0x999999, -0.15, 1.3, 0, 0.01, 0.4, 0.01, 0, 0, -0.5); },
  kotatsu: function (g) { part(g, PG.box, 0xff8a5a, 0, 0.22, 0, 1.3, 0.44, 1.3); part(g, PG.box, 0x9a6a3a, 0, 0.46, 0, 1.0, 0.04, 1.0); for (var i = 0; i < 3; i++) part(g, PG.sph, 0xff9a00, -0.2 + i * 0.15, 0.53, 0, 0.06); },
  fridge: function (g) { part(g, PG.box, pm(0xeeeeee, true), 0, 0.85, 0, 0.7, 1.7, 0.65); part(g, PG.box, 0xcccccc, 0, 1.15, 0.33, 0.66, 0.01, 0.01); part(g, PG.box, 0x888888, 0.28, 1.4, 0.34, 0.03, 0.3, 0.03); var f = texPlane(clipArt('smile', 64), 0.15, 0.15); f.position.set(-0.1, 1.45, 0.335); g.add(f); },
  washer: function (g) { part(g, PG.box, pm(0xf4f4f4, true), 0, 0.45, 0, 0.6, 0.9, 0.6); part(g, PG.cyl, 0x88aacc, 0, 0.5, 0.3, 0.2, 0.02, 0.2, PI / 2); part(g, PG.box, 0x5a8acc, 0, 0.85, 0.2, 0.5, 0.08, 0.15); },
  mailbox: function (g) { part(g, PG.box, pm(0xb0b8c0, true), 0, 1.0, 0, 1.6, 1.2, 0.35); for (var i = 0; i < 4; i++) for (var j = 0; j < 3; j++) part(g, PG.box, 0x777f88, -0.6 + i * 0.4, 0.7 + j * 0.35, 0.18, 0.34, 0.08, 0.01); part(g, PG.box, 0x777f88, 0, 0.2, 0, 0.1, 0.4, 0.1); },
  bags: function (g) { for (var i = 0; i < 5; i++) part(g, PG.sph, new THREE.MeshPhongMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0.85, shininess: 90 }), rand(-0.6, 0.6), 0.3, rand(-0.5, 0.5), 0.35, 0.32, 0.35); },
  cat: function (g, o) { var c = o.color || 0xf0a040; part(g, PG.sph, c, 0, 0.2, 0, 0.2, 0.18, 0.28); part(g, PG.sph, c, 0, 0.38, 0.22, 0.15); part(g, PG.cone, c, -0.08, 0.52, 0.22, 0.05, 0.1, 0.05); part(g, PG.cone, c, 0.08, 0.52, 0.22, 0.05, 0.1, 0.05); part(g, PG.sph, 0x000000, -0.05, 0.4, 0.35, 0.02); part(g, PG.sph, 0x000000, 0.05, 0.4, 0.35, 0.02); var t = part(g, PG.cyl, c, 0, 0.3, -0.3, 0.03, 0.35, 0.03, 0.7); t.name = 'tail'; },
  plant: function (g) { part(g, PG.cyl, 0xb05a30, 0, 0.2, 0, 0.22, 0.4, 0.18); for (var i = 0; i < 6; i++) part(g, PG.sph, 0x3aa040, rand(-0.15, 0.15), 0.55 + rand(0, 0.3), rand(-0.15, 0.15), 0.15); part(g, PG.sph, 0xff3366, 0, 0.95, 0, 0.08); },
  bucket: function (g) { part(g, PG.cyl, 0x33aaff, 0, 0.13, 0, 0.14, 0.26, 0.14); part(g, PG.tor, 0x2277cc, 0, 0.3, 0, 0.13, 0.13, 0.13, PI / 2.5); part(g, PG.box, 0xffdd00, 0.25, 0.02, 0, 0.08, 0.02, 0.25); },
  toilet: function (g) { part(g, PG.cyl, pm(0xffffff, true), 0, 0.2, 0.1, 0.2, 0.4, 0.26); part(g, PG.tor, pm(0xffffff, true), 0, 0.42, 0.12, 0.2, 0.24, 0.2, PI / 2); part(g, PG.box, pm(0xffffff, true), 0, 0.6, -0.2, 0.45, 0.45, 0.18); part(g, PG.box, 0xcccccc, 0.15, 0.85, -0.2, 0.08, 0.03, 0.03); },
  duck: function (g) { part(g, PG.sph, pm(0xffe000, true), 0, 0.1, 0, 0.14, 0.11, 0.17); part(g, PG.sph, pm(0xffe000, true), 0, 0.24, 0.08, 0.09); part(g, PG.cone, 0xff7700, 0, 0.23, 0.18, 0.03, 0.08, 0.03, PI / 2); part(g, PG.sph, 0x000000, 0.045, 0.27, 0.15, 0.012); part(g, PG.sph, 0x000000, -0.045, 0.27, 0.15, 0.012); },
  flower: function (g) { part(g, PG.cyl, 0x2a8a2a, 0, 0.3, 0, 0.02, 0.6, 0.02); for (var i = 0; i < 8; i++) part(g, PG.sph, 0xff66cc, Math.cos(i * PI / 4) * 0.12, 0.62, Math.sin(i * PI / 4) * 0.12, 0.07, 0.03, 0.07); part(g, PG.sph, 0xffee00, 0, 0.63, 0, 0.07); part(g, PG.sph, 0x000000, -0.025, 0.66, 0.06, 0.012); part(g, PG.sph, 0x000000, 0.025, 0.66, 0.06, 0.012); },
  boot: function (g) { part(g, PG.cyl, 0x2a5a2a, 0, 0.25, 0, 0.1, 0.5, 0.12); part(g, PG.box, 0x2a5a2a, 0, 0.05, 0.1, 0.2, 0.1, 0.3); },
  rod: function (g) { part(g, PG.cyl, 0x553311, 0, 0.6, 0.6, 0.015, 1.8, 0.015, 0.9); part(g, PG.box, 0x777777, 0, 0.15, 0, 0.3, 0.2, 0.3); },
  tire: function (g) { part(g, PG.tor, 0x1a1a1a, 0, 0.32, 0, 0.32, 0.32, 0.5, 0.3); },
  frog: function (g) { var c = 0x44cc44; part(g, PG.sph, c, 0, 0.1, 0, 0.14, 0.09, 0.14); part(g, PG.sph, c, -0.06, 0.18, 0.06, 0.05); part(g, PG.sph, c, 0.06, 0.18, 0.06, 0.05); part(g, PG.sph, 0x000000, -0.06, 0.2, 0.1, 0.02); part(g, PG.sph, 0x000000, 0.06, 0.2, 0.1, 0.02); },
  crown: function (g) { part(g, PG.cyl, pm(0xffd700, true, 0x332200), 0, 0.12, 0, 0.25, 0.25, 0.25); for (var i = 0; i < 6; i++) part(g, PG.cone, pm(0xffd700, true, 0x332200), Math.cos(i * PI / 3) * 0.22, 0.32, Math.sin(i * PI / 3) * 0.22, 0.06, 0.15, 0.06); part(g, PG.sph, 0xff0033, 0, 0.15, 0.25, 0.05); },
  oldtv: function (g) { for (var i = 0; i < 3; i++) { part(g, PG.box, pm(0x6a6a5a, true), rand(-0.2, 0.2), 0.3 + i * 0.6, rand(-0.2, 0.2), 0.75, 0.6, 0.6, 0, rand(-0.3, 0.3)); part(g, PG.box, new THREE.MeshBasicMaterial({ color: [0x222244, 0x113311, 0x331111][i] }), 0, 0.32 + i * 0.6, 0.31, 0.55, 0.42, 0.01); } },
  sofa: function (g) { var c = 0x8a2a6a; part(g, PG.box, c, 0, 0.25, 0, 2.0, 0.5, 0.9); part(g, PG.box, c, 0, 0.65, -0.35, 2.0, 0.8, 0.25); part(g, PG.box, c, -0.9, 0.5, 0, 0.25, 0.5, 0.9); part(g, PG.box, c, 0.9, 0.5, 0, 0.25, 0.5, 0.9); part(g, PG.box, 0xaa4a8a, 0, 0.53, 0.05, 1.5, 0.08, 0.7); },
  roadsign: function (g) { part(g, PG.cyl, 0x999999, 0, 1.2, 0, 0.04, 2.4, 0.04); var c = cvs(128), x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 60, 0, TAU); x.fill(); x.lineWidth = 12; x.strokeStyle = '#d00'; x.stroke(); cnFillText(x, '謎', 64, 86, 64, 900, '#003399', 'center'); var f = texPlane(c, 0.7, 0.7); f.position.set(0, 2.4, 0.05); g.add(f); },
  bell: function (g) { part(g, PG.sph, pm(0xd4a020, true, 0x221100), 0, 1.4, 0, 0.25); part(g, PG.cyl, 0xf0f0f0, 0, 0.6, 0, 0.04, 1.4, 0.04); part(g, PG.cyl, 0xe03030, 0.06, 0.6, 0, 0.02, 1.4, 0.02); part(g, PG.cyl, 0x2030e0, -0.06, 0.6, 0, 0.02, 1.4, 0.02); },
  omikuji: function (g) { part(g, PG.cyl6, 0xb02020, 0, 0.35, 0, 0.18, 0.7, 0.18); var f = texPlane(labelCanvas('おみくじ', 13, 128, 256), 0.25, 0.5); f.position.set(0, 0.4, 0.17); g.add(f); part(g, PG.box, 0x6a3a1a, 0, 0.02, 0, 0.5, 0.04, 0.5); },
  ema: function (g) { part(g, PG.box, 0x6a3a1a, 0, 1.0, 0, 2.0, 0.08, 0.08); part(g, PG.box, 0x6a3a1a, -0.95, 0.55, 0, 0.08, 1.1, 0.08); part(g, PG.box, 0x6a3a1a, 0.95, 0.55, 0, 0.08, 1.1, 0.08); for (var i = 0; i < 7; i++) part(g, PG.box, 0xd8b080, -0.75 + i * 0.25, 0.85, 0.06, 0.2, 0.14, 0.02, 0, 0, rand(-0.15, 0.15)); },
  mirror: function (g) { part(g, PG.box, 0xd4a020, 0, 1.0, 0, 0.9, 1.8, 0.06); part(g, PG.box, new THREE.MeshPhongMaterial({ color: 0xccddee, shininess: 150, specular: 0xffffff }), 0, 1.0, 0.035, 0.78, 1.66, 0.01); },
  proxy: function () {},
  door: function (g) { part(g, PG.box, 0x5a3a1a, 0, 1.2, 0, 1.0, 2.2, 0.08); part(g, PG.sph, 0xd4a020, 0.35, 1.1, 0.06, 0.05); },
  hydrant: function (g) { part(g, PG.cyl, pm(0xdd2222, true), 0, 0.35, 0, 0.14, 0.7, 0.14); part(g, PG.sph, pm(0xdd2222, true), 0, 0.72, 0, 0.15, 0.1, 0.15); part(g, PG.cyl, 0xdd2222, 0, 0.45, 0, 0.06, 0.45, 0.06, 0, 0, PI / 2); },
  postbox: function (g) { part(g, PG.cyl, pm(0xd01818, true), 0, 0.7, 0, 0.28, 1.2, 0.28); part(g, PG.sph, pm(0xd01818, true), 0, 1.3, 0, 0.28, 0.12, 0.28); part(g, PG.box, 0x220000, 0, 1.05, 0.27, 0.3, 0.05, 0.02); }
};
