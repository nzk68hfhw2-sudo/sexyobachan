// ---- procedural textures (no borrowed images) -------------------------------
var TEX = {};
var TEX_SIZE = 512;

function makeNoise(seed, n) {            // tileable value-noise lattice
  var r = mulberry(seed), g = new Float32Array(n * n);
  for (var i = 0; i < g.length; i++) g[i] = r();
  return function (x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var x0 = ((xi % n) + n) % n, y0 = ((yi % n) + n) % n, x1 = (x0 + 1) % n, y1 = (y0 + 1) % n;
    var a = g[y0 * n + x0], b = g[y0 * n + x1], c = g[y1 * n + x0], d = g[y1 * n + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
function fbmField(seed, size, base, oct) { // Float32 size*size in 0..1, tileable
  var out = new Float32Array(size * size), amp = 1, tot = 0;
  for (var o = 0; o < oct; o++) {
    var n = base << o, f = makeNoise(seed + o * 17, n), s = n / size;
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) out[y * size + x] += f(x * s, y * s) * amp;
    tot += amp; amp *= 0.5;
  }
  for (var i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function canvasOf(size, h) { var c = document.createElement('canvas'); c.width = size; c.height = h || size; return c; }
function fieldToCanvas(size, fn) {         // fn(i,x,y) -> [r,g,b] 0..255
  var c = canvasOf(size), ctx = c.getContext('2d'), im = ctx.createImageData(size, size), d = im.data;
  for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
    var i = y * size + x, p = fn(i, x, y); d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255;
  }
  ctx.putImageData(im, 0, 0); return c;
}
function normalFromHeight(h, size, strength) {
  return fieldToCanvas(size, function (i, x, y) {
    var xl = h[y * size + ((x + size - 1) % size)], xr = h[y * size + ((x + 1) % size)];
    var yu = h[((y + size - 1) % size) * size + x], yd = h[((y + 1) % size) * size + x];
    var dx = (xl - xr) * strength, dy = (yu - yd) * strength, l = 1 / Math.sqrt(dx * dx + dy * dy + 1);
    return [(dx * l * 0.5 + 0.5) * 255, (-dy * l * 0.5 + 0.5) * 255, (l * 0.5 + 0.5) * 255];
  });
}
function texFrom(canvas, rep, srgb) {
  var t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = TEX.aniso || 1;
  return t;
}

function buildTextures(renderer, low) {
  var S = TEX_SIZE = low ? 256 : 512;
  TEX.aniso = Math.min(low ? 2 : 8, renderer.capabilities.getMaxAnisotropy());

  // asphalt ground
  var a1 = fbmField(11, S, 4, 6), a2 = fbmField(23, S, 64, 2), a3 = fbmField(31, S, 2, 4);
  var ah = new Float32Array(S * S);
  TEX.groundMap = texFrom(fieldToCanvas(S, function (i) {
    var grit = a2[i], big = a3[i], v = 0.2 + a1[i] * 0.14 + (grit - 0.5) * 0.09 - Math.max(0, big - 0.58) * 0.3;
    ah[i] = grit * 0.7 + a1[i] * 0.3;
    var c = clamp(v, 0, 1) * 255; return [c * 1.02, c, c * 0.96];
  }), [14, 14], true);
  TEX.groundNrm = texFrom(normalFromHeight(ah, S, 5), [14, 14]);
  TEX.groundRgh = texFrom(fieldToCanvas(S, function (i) { var r = clamp(0.95 - Math.max(0, a3[i] - 0.5) * 2.2, 0.25, 1) * 255; return [0, r, 0]; }), [14, 14]);

  // concrete (walls, barriers)
  var c1 = fbmField(41, S, 4, 6), c2 = fbmField(47, S, 48, 2), ch = new Float32Array(S * S);
  TEX.concMap = texFrom(fieldToCanvas(S, function (i, x, y) {
    var seam = (x % (S / 2) < 2 || y % (S / 2) < 2) ? 0.16 : 0;
    var hole = (Math.abs((x % (S / 2)) - S / 8) < 3 && Math.abs((y % (S / 2)) - S / 8) < 3) ? 0.2 : 0;
    var streak = Math.max(0, c1[(y >> 3) * S + x] - 0.55) * (y / S) * 0.9;
    var v = 0.56 + (c1[i] - 0.5) * 0.3 + (c2[i] - 0.5) * 0.12 - seam - hole - streak;
    ch[i] = c2[i] * 0.5 + c1[i] * 0.5 - seam * 3 - hole * 3;
    var c = clamp(v, 0, 1) * 255; return [c, c * 0.985, c * 0.95];
  }), null, true);
  TEX.concNrm = texFrom(normalFromHeight(ch, S, 4));

  // corrugated container steel (near-white, tinted by material color)
  var k1 = fbmField(53, S, 4, 5), k2 = fbmField(59, S, 32, 3), kh = new Float32Array(S * S);
  TEX.contMap = texFrom(fieldToCanvas(S, function (i, x, y) {
    var w = Math.sin(x / S * Math.PI * 2 * 12), rib = 0.5 + 0.5 * w;
    var rust = clamp((k1[i] - 0.66) * 4 + (k2[i] - 0.5) * 0.8, 0, 0.75);
    var dirt = (k2[i] - 0.5) * 0.14 + (k1[i] - 0.5) * 0.2;
    var v = 0.72 + rib * 0.14 + dirt;
    kh[i] = Math.max(-0.6, Math.min(0.6, w * 1.4)) + k2[i] * 0.15;
    var r = lerp(v, 0.4, rust), g = lerp(v, 0.27, rust), b = lerp(v, 0.18, rust);
    return [clamp(r, 0, 1) * 255, clamp(g, 0, 1) * 255, clamp(b, 0, 1) * 255];
  }), null, true);
  TEX.contNrm = texFrom(normalFromHeight(kh, S, 3.2));
  TEX.contRgh = texFrom(fieldToCanvas(S, function (i) { var rust = clamp((k1[i] - 0.66) * 4, 0, 0.75); return [0, lerp(0.45 + k2[i] * 0.2, 0.95, rust) * 255, 0]; }));

  // wooden crate
  var w1 = fbmField(67, S, 4, 5), w2 = fbmField(71, S, 64, 2), wh = new Float32Array(S * S);
  TEX.crateMap = texFrom(fieldToCanvas(S, function (i, x, y) {
    var e = S / 8, frame = (x < e || x > S - e || y < e || y > S - e);
    var px = frame ? 0 : Math.floor(x / (S / 5)), gx = frame ? (x < e || x > S - e ? y : x) : y;
    var grain = Math.sin((gx / S * 40) + w1[i] * 9 + px * 2.1) * 0.5 + 0.5;
    var gap = (!frame && (x % (S / 5)) < 2) || (Math.abs(x - e) < 1.5) || (Math.abs(x - (S - e)) < 1.5) || (Math.abs(y - e) < 1.5) || (Math.abs(y - (S - e)) < 1.5);
    var v = (frame ? 0.62 : 0.52) + grain * 0.12 + (w2[i] - 0.5) * 0.12 + (w1[i] - 0.5) * 0.2 - (gap ? 0.3 : 0);
    wh[i] = grain * 0.3 + (frame ? 0.8 : 0) - (gap ? 1 : 0);
    v = clamp(v, 0, 1); return [v * 205, v * 160, v * 105];
  }), null, true);
  TEX.crateNrm = texFrom(normalFromHeight(wh, S, 2.5));

  // brushed dark metal (gun, drones)
  var m1 = fbmField(79, 256, 64, 2), m2 = fbmField(83, 256, 4, 4);
  TEX.metalRgh = texFrom(fieldToCanvas(256, function (i, x, y) {
    var r = 0.38 + (m1[(y * 256) + ((x >> 3) << 3) % 256] - 0.5) * 0.25 + (m2[i] - 0.5) * 0.3; return [0, clamp(r, 0.1, 1) * 255, 0];
  }), [2, 2]);

  // soft round sprite, spark, muzzle flash, bullet hole
  function radial(size, stops) {
    var c = canvasOf(size), x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); x.fillStyle = g; x.fillRect(0, 0, size, size); return c;
  }
  TEX.soft = new THREE.CanvasTexture(radial(64, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]));
  TEX.glow = new THREE.CanvasTexture(radial(64, [[0, 'rgba(255,255,255,1)'], [0.15, 'rgba(255,240,200,.9)'], [0.45, 'rgba(255,160,60,.3)'], [1, 'rgba(255,120,0,0)']]));
  var sm = canvasOf(128), sx = sm.getContext('2d'), sr = mulberry(5);
  for (var i = 0; i < 26; i++) {
    var px = 64 + (sr() - 0.5) * 60, py = 64 + (sr() - 0.5) * 60, rr = 14 + sr() * 26, g = sx.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 128, 128);
  }
  var vg = sx.createRadialGradient(64, 64, 30, 64, 64, 64); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,1)');
  sx.globalCompositeOperation = 'destination-out'; sx.fillStyle = vg; sx.fillRect(0, 0, 128, 128);
  TEX.smoke = new THREE.CanvasTexture(sm);
  var fl = canvasOf(128), fx = fl.getContext('2d'); fx.translate(64, 64);
  for (var k = 0; k < 9; k++) {
    var an = k / 9 * Math.PI * 2 + sr() * 0.5, len = 30 + sr() * 32, wd = 5 + sr() * 9;
    var gg = fx.createLinearGradient(0, 0, Math.cos(an) * len, Math.sin(an) * len);
    gg.addColorStop(0, 'rgba(255,250,220,1)'); gg.addColorStop(0.4, 'rgba(255,190,80,.8)'); gg.addColorStop(1, 'rgba(255,120,20,0)');
    fx.fillStyle = gg; fx.beginPath(); fx.moveTo(Math.cos(an + 1.57) * wd, Math.sin(an + 1.57) * wd);
    fx.lineTo(Math.cos(an) * len, Math.sin(an) * len); fx.lineTo(Math.cos(an - 1.57) * wd, Math.sin(an - 1.57) * wd); fx.fill();
  }
  var cg = fx.createRadialGradient(0, 0, 0, 0, 0, 26); cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(1, 'rgba(255,200,100,0)');
  fx.fillStyle = cg; fx.fillRect(-64, -64, 128, 128);
  TEX.flash = new THREE.CanvasTexture(fl);
  var bh = canvasOf(64), bx = bh.getContext('2d'), bg = bx.createRadialGradient(32, 32, 0, 32, 32, 32);
  bg.addColorStop(0, 'rgba(0,0,0,1)'); bg.addColorStop(0.22, 'rgba(8,8,8,.95)'); bg.addColorStop(0.4, 'rgba(40,36,32,.5)'); bg.addColorStop(1, 'rgba(60,55,50,0)');
  bx.fillStyle = bg; bx.fillRect(0, 0, 64, 64);
  bx.strokeStyle = 'rgba(15,15,15,.5)'; bx.lineWidth = 1;
  for (var q = 0; q < 7; q++) { var aa = sr() * 6.28, l2 = 10 + sr() * 16; bx.beginPath(); bx.moveTo(32 + Math.cos(aa) * 6, 32 + Math.sin(aa) * 6); bx.lineTo(32 + Math.cos(aa) * l2, 32 + Math.sin(aa) * l2); bx.stroke(); }
  TEX.hole = new THREE.CanvasTexture(bh);

  // sky (equirect): dusk gradient + sun glow + clouds
  var SW = low ? 512 : 1024, SH = SW / 2, sc = canvasOf(SW, SH), sk = sc.getContext('2d');
  var grd = sk.createLinearGradient(0, 0, 0, SH);
  grd.addColorStop(0, '#1d3557'); grd.addColorStop(0.28, '#3f6a9a'); grd.addColorStop(0.42, '#8fa6b8'); grd.addColorStop(0.485, '#f3c491'); grd.addColorStop(0.5, '#f7b06a');
  grd.addColorStop(0.52, '#6b5a50'); grd.addColorStop(1, '#3a3836');
  sk.fillStyle = grd; sk.fillRect(0, 0, SW, SH);
  var sunU = SUN_AZ_U * SW, sunV = SH * 0.5 - SUN_ELEV / Math.PI * SH;
  [-SW, 0, SW].forEach(function (off) {
    var g2 = sk.createRadialGradient(sunU + off, sunV, 0, sunU + off, sunV, SW * 0.22);
    g2.addColorStop(0, 'rgba(255,250,235,1)'); g2.addColorStop(0.035, 'rgba(255,238,190,1)'); g2.addColorStop(0.07, 'rgba(255,200,120,.55)'); g2.addColorStop(0.4, 'rgba(255,170,90,.16)'); g2.addColorStop(1, 'rgba(255,160,80,0)');
    sk.fillStyle = g2; sk.fillRect(0, 0, SW, SH * 0.5);
  });
  var cl = fbmField(97, 256, 4, 5), im = sk.getImageData(0, 0, SW, SH >> 1), dd = im.data;
  for (var y = 0; y < (SH >> 1); y++) for (var x = 0; x < SW; x++) {
    var el2 = 1 - y / (SH / 2), u = x / SW * 256 * 2, v2 = Math.pow(el2, 0.6) * 256 * 0.8;
    var n = cl[((v2 | 0) % 256) * 256 + ((u | 0) % 256)], a = clamp((n - 0.52) * 4.5, 0, 1) * clamp((1 - el2) * 3, 0, 1) * clamp(el2 * 14, 0, 1) * 0.8;
    var j = (y * SW + x) * 4, du = Math.min(Math.abs(x - sunU), SW - Math.abs(x - sunU)) / SW, warm = clamp(1 - du * 4, 0, 1);
    dd[j] = lerp(dd[j], lerp(205, 255, warm), a); dd[j + 1] = lerp(dd[j + 1], lerp(190, 205, warm), a); dd[j + 2] = lerp(dd[j + 2], lerp(200, 150, warm), a);
  }
  sk.putImageData(im, 0, 0);
  TEX.sky = new THREE.CanvasTexture(sc); TEX.sky.encoding = THREE.sRGBEncoding; TEX.sky.mapping = THREE.EquirectangularReflectionMapping;
}
var SUN_ELEV = 0.42, SUN_AZ = 2.25;      // radians: elevation, azimuth
var SUN_AZ_U = 0.5 + SUN_AZ / (Math.PI * 2);
