// ---- embedded model decoder (format OSN1, see tools/pack notes in source.txt) ----
var FRIENDS = { hi: [], lo: [], texs: [], ok: false, err: '' };
function b64ToBytes(s) {
  var bin = atob(s), n = bin.length, u = new Uint8Array(n);
  for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function decodeFriends(bytes) {
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  var magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== 'OSN1') throw new Error('model magic ' + magic);
  var count = dv.getUint32(4, true), o = 8, out = [];
  for (var p = 0; p < count; p++) {
    var v = dv.getUint32(o, true), ic = dv.getUint32(o + 4, true);
    var mn = [dv.getFloat32(o + 8, true), dv.getFloat32(o + 12, true), dv.getFloat32(o + 16, true)];
    var mx = [dv.getFloat32(o + 20, true), dv.getFloat32(o + 24, true), dv.getFloat32(o + 28, true)];
    o += 32;
    var pos = new Float32Array(v * 3), nrm = new Float32Array(v * 3), uv = new Float32Array(v * 2);
    // feet at y=0, centered on x/z
    var cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
    for (var i = 0; i < v * 3; i++) {
      var k = i % 3, q = dv.getUint16(o + i * 2, true) / 65535;
      var val = mn[k] + q * (mx[k] - mn[k]);
      pos[i] = k === 0 ? val - cx : k === 1 ? val - mn[1] : val - cz;
    }
    o += v * 6;
    for (i = 0; i < v * 3; i++) nrm[i] = dv.getInt8(o + i) / 127;
    o += Math.ceil(v * 3 / 4) * 4;
    for (i = 0; i < v * 2; i++) uv[i] = dv.getUint16(o + i * 2, true) / 65535;
    o += v * 4;
    var idx = new Uint16Array(ic);
    for (i = 0; i < ic; i++) idx[i] = dv.getUint16(o + i * 2, true);
    o += Math.ceil(ic * 2 / 4) * 4;
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    g.userData.h = mx[1] - mn[1]; g.userData.w = mx[0] - mn[0]; g.userData.d = mx[2] - mn[2];
    out.push(g);
  }
  return out;
}
// 8人: 0-3 = 女の子（モデル1）, 4-7 = 男の子（モデル2）
function loadFriends(cb) {
  var sets = [[FRIENDS1_BIN_B64, FRIENDS1_JPG_B64], [FRIENDS2_BIN_B64, FRIENDS2_JPG_B64]];
  var pending = sets.length, texs = [];
  FRIENDS.hi = []; FRIENDS.lo = [];
  sets.forEach(function (st, si) {
    try {
      if (typeof st[0] !== 'string' || st[0].length < 100) throw new Error('埋め込みモデルデータがありません');
      var geos = decodeFriends(b64ToBytes(st[0]));
      for (var i = 0; i < 4; i++) { geos[i].userData.set = si; geos[i + 4].userData.set = si; FRIENDS.hi[si * 4 + i] = geos[i]; FRIENDS.lo[si * 4 + i] = geos[i + 4]; }
    } catch (e) { FRIENDS.err += 'モデル' + (si + 1) + 'の解読失敗: ' + e.message + '\n'; }
    var done = false;
    var fin = function () { if (done) return; done = true; if (--pending === 0) { FRIENDS.ok = FRIENDS.hi.length === 8; cb(); } };
    var useTex = function (src) { var t = new THREE.Texture(src); t.encoding = THREE.sRGBEncoding; t.flipY = false; t.anisotropy = 2; t.needsUpdate = true; texs[si] = t; fin(); };
    var viaImg = function () { // 予備の方法：data URL の画像
      var img = new Image();
      img.onload = function () { useTex(img); };
      img.onerror = function () { FRIENDS.err += 'モデル' + (si + 1) + 'のテクスチャ画像を解読できませんでした\n'; fin(); };
      img.src = 'data:image/jpeg;base64,' + st[1];
    };
    setTimeout(function () { if (!done) { FRIENDS.err += 'テクスチャ解読タイムアウト\n'; fin(); } }, 12000);
    // まずは createImageBitmap（URL を使わないので、読み込み制限の影響を受けにくい）
    try {
      if (window.createImageBitmap && window.Blob) {
        createImageBitmap(new Blob([b64ToBytes(st[1])], { type: 'image/jpeg' }), { imageOrientation: 'none' }).then(useTex, viaImg);
      } else viaImg();
    } catch (e) { viaImg(); }
  });
  FRIENDS.texs = texs;
}
