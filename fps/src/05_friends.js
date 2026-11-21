// ---- minimal GLB reader + the 8 friends (Meshy models) ----------------------
var FRIEND_NAMES = ['ハル', 'メガネ', 'ツン', 'ナギ', 'ロング', 'ミディ', 'ボブ', 'ウェーブ'];
var MODEL_STATUS = { boys: 'loading', girls: 'loading', boys_lod: 'loading', girls_lod: 'loading' };

function parseGLB(buf) {
  var dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('not glb');
  var jl = dv.getUint32(12, true), jbytes = new Uint8Array(buf, 20, jl), js = '';
  if (window.TextDecoder) js = new TextDecoder('utf-8').decode(jbytes); else { for (var i = 0; i < jl; i++) js += String.fromCharCode(jbytes[i]); js = decodeURIComponent(escape(js)); }
  var json = JSON.parse(js), bo = 20 + jl, binOff = bo + 8;
  var CB = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  function acc(ix, asIndex) {
    var a = json.accessors[ix], bv = json.bufferViews[a.bufferView], n = NC[a.type], cb = CB[a.componentType];
    var stride = bv.byteStride || n * cb, base = binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
    var out = asIndex ? new Uint32Array(a.count * n) : new Float32Array(a.count * n), ct = a.componentType, nm = a.normalized;
    for (var i = 0; i < a.count; i++) for (var k = 0; k < n; k++) {
      var o = base + i * stride + k * cb, v;
      if (ct === 5126) v = dv.getFloat32(o, true); else if (ct === 5123) { v = dv.getUint16(o, true); if (nm) v /= 65535; }
      else if (ct === 5122) { v = dv.getInt16(o, true); if (nm) v = Math.max(v / 32767, -1); } else if (ct === 5125) v = dv.getUint32(o, true);
      else if (ct === 5121) { v = dv.getUint8(o); if (nm) v /= 255; } else { v = dv.getInt8(o); if (nm) v = Math.max(v / 127, -1); }
      out[i * n + k] = v;
    }
    return out;
  }
  var res = { meshes: [], image: null };
  (json.nodes || []).forEach(function (nd) {
    if (nd.mesh == null) return;
    var p = json.meshes[nd.mesh].primitives[0], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(acc(p.attributes.POSITION), 3));
    if (p.attributes.NORMAL != null) g.setAttribute('normal', new THREE.BufferAttribute(acc(p.attributes.NORMAL), 3));
    if (p.attributes.TEXCOORD_0 != null) g.setAttribute('uv', new THREE.BufferAttribute(acc(p.attributes.TEXCOORD_0), 2));
    if (p.indices != null) g.setIndex(new THREE.BufferAttribute(acc(p.indices, true), 1));
    var m = new THREE.Matrix4();
    if (nd.matrix) m.fromArray(nd.matrix); else {
      var t = nd.translation || [0, 0, 0], r = nd.rotation || [0, 0, 0, 1], s = nd.scale || [1, 1, 1];
      m.compose(new THREE.Vector3(t[0], t[1], t[2]), new THREE.Quaternion(r[0], r[1], r[2], r[3]), new THREE.Vector3(s[0], s[1], s[2]));
    }
    g.applyMatrix4(m);
    if (g.attributes.normal) g.normalizeNormals(); else g.computeVertexNormals();
    g.computeBoundingSphere();
    res.meshes.push({ name: nd.name || '', geometry: g });
  });
  if (json.images && json.images[0] && json.images[0].bufferView != null) {
    var iv = json.bufferViews[json.images[0].bufferView];
    res.image = { bytes: new Uint8Array(buf, binOff + (iv.byteOffset || 0), iv.byteLength), mime: json.images[0].mimeType || 'image/jpeg' };
  }
  return res;
}
function fetchBinary(path, key, cb) {
  var done = false;
  function fin(err, buf) { if (done) return; done = true; cb(err, buf); }
  function b64buf(b64) { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  if (window.__frInline && window.__frInline[key]) { try { return fin(null, b64buf(window.__frInline[key])); } catch (e) {} }   // single-file HTML build
  function viaScript() {       // fallback for hosts that forbid fetch/XHR: same bytes, wrapped in a .js file
    window.__frAsset = window.__frAsset || function (k, b64) { var f = window.__frAssetCb && window.__frAssetCb[k]; if (f) f(b64); };
    window.__frAssetCb = window.__frAssetCb || {};
    window.__frAssetCb[key] = function (b64) {
      try { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); fin(null, u.buffer); } catch (e) { fin(e); }
    };
    loadScript(assetURL(path + '.js'), function (err) { if (err) fin(err); else setTimeout(function () { fin(new Error('asset script did not register')); }, 3000); });
  }
  try {
    var x = new XMLHttpRequest(); x.open('GET', assetURL(path), true); x.responseType = 'arraybuffer';
    x.onload = function () { if (x.status >= 200 && x.status < 300 && x.response && x.response.byteLength > 1000) fin(null, x.response); else viaScript(); };
    x.onerror = viaScript; x.ontimeout = viaScript; x.timeout = 25000; x.send();
  } catch (e) { viaScript(); }
}
function loadModelFile(key, cb) {
  fetchBinary('models/' + key + '.glb', key, function (err, buf) {
    if (err) { MODEL_STATUS[key] = 'failed'; return cb(err); }
    var data; try { data = parseGLB(buf); } catch (e) { MODEL_STATUS[key] = 'failed'; return cb(e); }
    var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, envMapIntensity: 0.7 });
    if (data.image) {
      var url = URL.createObjectURL(new Blob([data.image.bytes], { type: data.image.mime })), img = new Image();
      img.onload = function () { var t = new THREE.Texture(img); t.flipY = false; t.encoding = THREE.sRGBEncoding; t.anisotropy = TEX.aniso; t.needsUpdate = true; mat.map = t; mat.needsUpdate = true; try { URL.revokeObjectURL(url); } catch (e) {} };
      img.src = url;
    }
    MODEL_STATUS[key] = 'ok';
    cb(null, data.meshes.map(function (m) { return { geometry: m.geometry, material: mat }; }));
  });
}


var MODELS = [];         // 8 entries {geometry, material} (null until loaded)
var LINEUP = [];         // title-screen display
var PH = {};
function buildFriends() {
  PH.body = new THREE.CylinderGeometry(0.16, 0.2, 0.62, 10); PH.body.translate(0, 0.31, 0);
  PH.head = new THREE.SphereGeometry(0.24, 14, 10); PH.head.translate(0, 0.78, 0);
  PH.mat = stdMat({ color: 0xf2f2f2, roughness: 0.6 });
  for (var i = 0; i < 8; i++) {
    MODELS.push(null);
    var g = new THREE.Group(); g.position.set((i - 3.5) * 0.95, 0, 21.5 + Math.abs(i - 3.5) * 0.3); g.add(makeFriendMesh(i, null)); scene.add(g); LINEUP.push(g);
  }
  ['boys', 'girls'].forEach(function (key, fi) {
    loadModelFile(key, function (err, list) {
      if (err || !list) return;
      list.slice(0, 4).forEach(function (m, k) {
        var idx = fi * 4 + k; MODELS[idx] = m;
        var g = LINEUP[idx]; while (g.children.length) g.remove(g.children[0]); g.add(makeFriendMesh(idx, null));
      });
      loadModelFile(key + '_lod', function (e2, lods) {      // low-poly copies for far-away bots
        if (e2 || !lods) return; lods.slice(0, 4).forEach(function (m, k) { if (MODELS[fi * 4 + k]) MODELS[fi * 4 + k].lod = m.geometry; });
      });
      if (typeof refreshAvatar === 'function') refreshAvatar();
    });
  });
}
// returns an Object3D of height 1 (feet at y=0, facing +z). mat: optional per-instance material
function makeFriendMesh(idx, mat, lod) {
  var m = MODELS[idx], o;
  if (m) { o = new THREE.Mesh(lod && m.lod ? m.lod : m.geometry, mat || m.material); o.castShadow = true; o.receiveShadow = true; }
  else { o = new THREE.Group(); var b = new THREE.Mesh(PH.body, mat || PH.mat), h = new THREE.Mesh(PH.head, mat || PH.mat); b.castShadow = h.castShadow = true; o.add(b); o.add(h); }
  o.scale.setScalar(FRIEND_H); return o;
}
var FRIEND_H = 1.68;
function updateLineup(dt, cx, cz, show) {
  for (var i = 0; i < LINEUP.length; i++) {
    var g = LINEUP[i]; g.visible = show; if (!show) continue;
    g.rotation.y += angDiff(Math.atan2(cx - g.position.x, cz - g.position.z), g.rotation.y) * Math.min(1, dt * 3);
    g.position.y = Math.abs(Math.sin(G.titleT * 3 + i * 0.8)) * 0.06;
  }
}
