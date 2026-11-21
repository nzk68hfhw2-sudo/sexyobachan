// ---- minimal GLB reader + the 8 friends (Meshy models) ----------------------
var FRIENDS = [];        // {group, model, cage, bars, beacon, x, z, state, t, name}
var FRIEND_NAMES = ['ハル', 'メガネ', 'ツン', 'ナギ', 'ロング', 'ミディ', 'ボブ', 'ウェーブ'];
var MODEL_STATUS = { boys: 'loading', girls: 'loading' };

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

var CAGE_G = {};
function buildFriends() {
  var barM = new THREE.MeshBasicMaterial({ color: 0x59d8ff, transparent: true, opacity: 0.85 });
  var baseM = stdMat({ color: 0x24272b, roughness: 0.45, metalness: 0.9, roughnessMap: TEX.metalRgh });
  CAGE_G.bar = new THREE.CylinderGeometry(0.026, 0.026, 1.95, 6); CAGE_G.base = new THREE.CylinderGeometry(0.95, 1.0, 0.1, 24); CAGE_G.ring = new THREE.TorusGeometry(0.85, 0.035, 6, 24);
  CAGE_G.beacon = new THREE.CylinderGeometry(0.5, 0.5, 60, 12, 1, true);
  var phG = new THREE.CylinderGeometry(0.2, 0.24, 0.75, 10), phH = new THREE.SphereGeometry(0.27, 14, 10), phM = stdMat({ color: 0xf2f2f2, roughness: 0.6 });
  CAGE_POS.forEach(function (p, i) {
    var f = { x: p[0], z: p[1], state: 'caged', t: Math.random() * 6, name: FRIEND_NAMES[i], open: 0 };
    f.group = new THREE.Group(); f.group.position.set(p[0], 0, p[1]); scene.add(f.group);
    f.model = new THREE.Group(); f.model.position.y = 0.1; f.group.add(f.model);
    var b = new THREE.Mesh(phG, phM); b.position.y = 0.4; var h = new THREE.Mesh(phH, phM); h.position.y = 0.98; f.placeholder = new THREE.Group(); f.placeholder.add(b); f.placeholder.add(h); f.model.add(f.placeholder);
    f.cage = new THREE.Group(); f.group.add(f.cage);
    var base = new THREE.Mesh(CAGE_G.base, baseM); base.position.y = 0.05; base.receiveShadow = true; f.group.add(base);
    f.bars = new THREE.Group(); f.cage.add(f.bars);
    f.barM = barM.clone();
    for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2, bar = new THREE.Mesh(CAGE_G.bar, f.barM); bar.position.set(Math.cos(a) * 0.85, 1.07, Math.sin(a) * 0.85); f.bars.add(bar); }
    var top = new THREE.Mesh(CAGE_G.ring, baseM); top.rotation.x = Math.PI / 2; top.position.y = 2.06; f.cage.add(top);
    f.beacon = new THREE.Mesh(CAGE_G.beacon, new THREE.MeshBasicMaterial({ color: 0x66e0ff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    f.beacon.position.y = 30; f.beacon.visible = false; f.group.add(f.beacon);
    FRIENDS.push(f);
  });
  ['boys', 'girls'].forEach(function (key, fi) {
    loadModelFile(key, function (err, list) {
      if (err || !list) return;
      list.slice(0, 4).forEach(function (m, i) {
        var f = FRIENDS[fi * 4 + i], mesh = new THREE.Mesh(m.geometry, m.material);
        mesh.scale.setScalar(1.3); mesh.castShadow = true; mesh.receiveShadow = true;
        f.model.remove(f.placeholder); f.model.add(mesh); f.mesh = mesh;
      });
    });
  });
}
function resetFriends() {
  FRIENDS.forEach(function (f) { f.state = 'caged'; f.open = 0; f.cage.visible = true; f.bars.scale.y = 1; f.bars.position.y = 0; f.barM.opacity = 0.85; f.barM.color.set(0x59d8ff); f.beacon.visible = false; f.model.position.y = 0.1; });
}
function updateFriends(dt, px, pz, activeIdx, phase) {
  for (var i = 0; i < FRIENDS.length; i++) {
    var f = FRIENDS[i]; f.t += dt;
    var want = Math.atan2(px - f.x, pz - f.z);
    f.model.rotation.y += angDiff(want, f.model.rotation.y) * Math.min(1, dt * 3);
    if (f.state === 'caged') {
      f.model.position.y = 0.1; f.model.rotation.z = Math.sin(f.t * 1.3) * 0.04;
      var act = i === activeIdx;
      f.barM.opacity = act ? 0.75 + Math.sin(f.t * 8) * 0.2 : 0.55;
      f.barM.color.set(act ? (phase === 'rescue' ? 0x7dffb0 : 0xff6a4a) : 0x59d8ff);
      f.beacon.visible = act && phase === 'rescue'; if (f.beacon.visible) f.beacon.material.opacity = 0.16 + Math.sin(f.t * 4) * 0.06;
    } else {
      if (f.open < 1) { f.open = Math.min(1, f.open + dt * 1.6); f.bars.scale.y = 1 - f.open; f.bars.position.y = -f.open * 0.2; if (f.open >= 1) f.cage.visible = false; }
      f.model.position.y = 0.1 + Math.abs(Math.sin(f.t * 5.2)) * 0.22; f.model.rotation.z = Math.sin(f.t * 5.2) * 0.07;
      f.beacon.visible = false;
    }
  }
}
