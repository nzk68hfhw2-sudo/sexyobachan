// ---- 描画まわり ------------------------------------------------------------------------
var R = { renderer: null, scene: null, camera: null, sun: null, hemi: null, amb: null, sky: null, skyU: null, rt: null, post: null, postU: null, postScene: null, postCam: null,
  pr: 1, quality: 3, fpsAcc: 0, fpsN: 0, fpsT: 0, lowCount: 0, gl2: false, upperTown: null };
var LITE = { on: false };
var REDUCED = { on: false };

function initRenderer() {
  var r;
  try {
    r = new THREE.WebGLRenderer({ antialias: !LITE.on, powerPreference: 'high-performance', alpha: false, stencil: false });
  } catch (e) { showFatal('3D表示（WebGL）を開始できませんでした', String(e && e.message || e) + '\nブラウザの設定で WebGL が無効になっていないか確認してください。'); return false; }
  R.renderer = r; R.gl2 = r.capabilities.isWebGL2;
  r.outputEncoding = THREE.sRGBEncoding;
  r.shadowMap.enabled = !LITE.on; r.shadowMap.type = THREE.PCFShadowMap;
  R.pr = Math.min(window.devicePixelRatio || 1, LITE.on ? 1 : 2); R.quality = LITE.on ? 1 : 3;
  r.setPixelRatio(R.pr);
  CANVAS_HOST.appendChild(r.domElement);
  r.domElement.addEventListener('webglcontextlost', function (e) { e.preventDefault(); showFatal('3D表示が止まりました（WebGL context lost）', 'ページを再読み込みしてください。軽量モードにすると起きにくくなります。'); }, false);
  var sc = R.scene = new THREE.Scene();
  sc.fog = new THREE.Fog(0xbfe6ff, 45, 230);
  R.camera = new THREE.PerspectiveCamera(70, 1, 0.08, 520);
  R.camera.rotation.order = 'YXZ';
  R.hemi = new THREE.HemisphereLight(0xcfeaff, 0x6a5a3a, 0.75); sc.add(R.hemi);
  R.amb = new THREE.AmbientLight(0xffffff, 0.12); sc.add(R.amb);
  var s = R.sun = new THREE.DirectionalLight(0xffffff, 0.9);
  s.castShadow = !LITE.on; s.shadow.mapSize.set(1024, 1024);
  var sc2 = s.shadow.camera; sc2.left = -34; sc2.right = 34; sc2.top = 34; sc2.bottom = -34; sc2.near = 1; sc2.far = 160;
  s.shadow.bias = -0.0008; s.shadow.normalBias = 0.03;
  sc.add(s); sc.add(s.target);
  // 空
  R.skyU = { top: { value: new THREE.Color(0x2a7fff) }, mid: { value: new THREE.Color(0x9fd8ff) }, bot: { value: new THREE.Color(0xfff0d0) },
    sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color(0xffffcc) }, stars: { value: 0 }, t: { value: 0 }, crazy: { value: 0 }, sunSize: { value: 1 } };
  var skyMat = new THREE.ShaderMaterial({
    uniforms: R.skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float stars; uniform float t; uniform float crazy; uniform float sunSize;',
      'varying vec3 vP;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }',
      'vec3 hue(float x){ return clamp(abs(mod(x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); }',
      'void main(){',
      ' float y = vP.y;',
      ' vec3 c = y > 0.0 ? mix(mid, top, pow(clamp(y,0.0,1.0),0.6)) : mix(mid, bot, clamp(-y*3.0,0.0,1.0));',
      ' float sd = max(dot(vP, normalize(sunDir)), 0.0);',
      ' c += sunCol * (pow(sd, 900.0/sunSize)*2.5 + pow(sd, 12.0)*0.35);',
      ' if (stars > 0.0 && y > 0.0) { vec2 g = floor(vec2(atan(vP.z, vP.x)*120.0, y*160.0)); float s = step(0.992, h(g)); c += vec3(s) * stars * (0.6+0.4*sin(t*3.0+h(g)*30.0)); }',
      ' if (crazy > 0.0) { float a = atan(vP.z, vP.x); vec3 rb = hue(a/6.2831 + y*0.5 + t*0.05); float ch = step(0.5, fract(a*4.0+t*0.1)) == step(0.5, fract(y*6.0)) ? 1.0 : 0.75; c = mix(c, rb*ch, crazy); }',
      ' gl_FragColor = vec4(c, 1.0);',
      '}'].join('\n')
  });
  R.sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), skyMat); R.sky.renderOrder = -10; R.sky.frustumCulled = false;
  sc.add(R.sky);
  initPost();
  onResize(); window.addEventListener('resize', onResize); window.addEventListener('orientationchange', function () { setTimeout(onResize, 300); });
  return true;
}
function initPost() {
  R.postU = { tD: { value: null }, ab: { value: 0 }, hue: { value: 0 }, wave: { value: 0 }, t: { value: 0 }, sat: { value: 1 }, vig: { value: 0.25 }, tint: { value: new THREE.Color(1, 1, 1) }, split: { value: 0 }, poster: { value: 0 } };
  R.post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: R.postU, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tD; uniform float ab; uniform float hue; uniform float wave; uniform float t; uniform float sat; uniform float vig; uniform vec3 tint; uniform float split; uniform float poster;',
      'varying vec2 vUv;',
      'vec3 hrot(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a); return c*ca + cross(k,c)*sin(a) + k*dot(k,c)*(1.0-ca); }',
      'void main(){',
      ' vec2 uv = vUv;',
      ' uv.x += sin(uv.y*18.0 + t*2.3) * 0.006 * wave; uv.y += sin(uv.x*14.0 + t*1.7) * 0.004 * wave;',
      ' if (split > 0.0) { uv.x = uv.x < 0.5 ? uv.x : uv.x; float b = floor(uv.y*14.0); uv.x += (fract(sin(b*91.7+floor(t*2.0))*437.0)-0.5)*0.02*split; }',
      ' vec2 d = (uv-0.5) * ab * 0.012;',
      ' vec3 c = vec3(texture2D(tD, uv + d).r, texture2D(tD, uv).g, texture2D(tD, uv - d).b);',
      ' c = hrot(c, hue);',
      ' float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, sat);',
      ' if (poster > 0.0) c = mix(c, floor(c*5.0)/5.0, poster);',
      ' c *= tint;',
      ' float v = smoothstep(0.85, 0.2, length(vUv-0.5)); c *= mix(1.0, v, vig);',
      ' gl_FragColor = vec4(c, 1.0);',
      '}'].join('\n')
  }));
  R.post.frustumCulled = false;
  R.postScene = new THREE.Scene(); R.postScene.add(R.post);
  R.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
}
function ensureRT() {
  var w = Math.floor(R.renderer.domElement.width), h = Math.floor(R.renderer.domElement.height);
  if (!R.rt || R.rt.width !== w || R.rt.height !== h) {
    if (R.rt) R.rt.dispose();
    var Cls = (R.gl2 && THREE.WebGLMultisampleRenderTarget && R.quality >= 3) ? THREE.WebGLMultisampleRenderTarget : THREE.WebGLRenderTarget;
    R.rt = new Cls(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, encoding: THREE.sRGBEncoding });
    R.postU.tD.value = R.rt.texture;
  }
}
function onResize() {
  if (!R.renderer) return;
  var w = ROOT.clientWidth || window.innerWidth, h = ROOT.clientHeight || window.innerHeight;
  R.renderer.setPixelRatio(R.pr); R.renderer.setSize(w, h, false);
  R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  if (typeof layoutUI === 'function') layoutUI();
}
function setQuality(q) {
  q = clamp(q, 0, 3); R.quality = q;
  var dpr = window.devicePixelRatio || 1;
  R.pr = q >= 3 ? Math.min(dpr, 2) : q === 2 ? Math.min(dpr, 1.5) : q === 1 ? Math.min(dpr, 1.0) : Math.min(dpr, 0.75);
  var sh = q >= 2 && !LITE.on;
  if (R.sun.castShadow !== sh) { R.sun.castShadow = sh; R.renderer.shadowMap.enabled = sh; R.scene.traverse(function (o) { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; }); }
  onResize();
}
// 自動画質（重いときは下げる）
function autoQuality(dt) {
  R.fpsAcc += dt; R.fpsN++;
  if (R.fpsAcc > 2.0) {
    var fps = R.fpsN / R.fpsAcc; R.fpsAcc = 0; R.fpsN = 0; R.lastFps = fps;
    if (fps < 42 && R.quality > 0) { R.lowCount++; if (R.lowCount >= 2) { setQuality(R.quality - 1); R.lowCount = 0; } }
    else R.lowCount = 0;
  }
}
// ---- 時間帯 ----------------------------------------------------------------------------
var TOD_PAL = [ // top, mid, bot, fog, sunCol, sunInt, hemiSky, hemiGnd, hemiInt, elev, azim, stars, lamps
  [0x5aa8ff, 0xffd6e8, 0xfff2c8, 0xf3dbe0, 0xffe0b0, 0.75, 0xffe8f0, 0x6a5a4a, 0.65, 0.35, 1.2, 0, 0],
  [0x1f6fff, 0x9fd8ff, 0xe8f6ff, 0xbfe2ff, 0xfffbe8, 1.0, 0xd8f0ff, 0x6a6040, 0.75, 1.15, 0.4, 0, 0],
  [0x3a2a8a, 0xff8a4a, 0xffd060, 0xf0a070, 0xffa050, 0.8, 0xffb080, 0x5a3a3a, 0.6, 0.22, -1.3, 0.1, 0.6],
  [0x02031a, 0x101a4a, 0x1a2050, 0x101a3a, 0x8aa0ff, 0.28, 0x3a4a8a, 0x1a1a2a, 0.4, 0.9, -0.4, 1, 1],
  [0x00ff66, 0xff00cc, 0x220044, 0x9a00ff, 0x66ff00, 0.9, 0xff66ff, 0x00ff99, 0.7, 0.05, 2.5, 0.6, 1]
];
var _c1, _c2;
function lerpHex(a, b, t, out) { _c1.set(a); _c2.set(b); out.copy(_c1).lerp(_c2, t); return out; }
function applyTimeOfDay(tod, nai, crazy, t) {
  if (!_c1) { _c1 = new THREE.Color(); _c2 = new THREE.Color(); }
  var i0 = Math.floor(tod) % 4, i1 = (i0 + 1) % 4, f = smooth(tod - Math.floor(tod));
  // 各時間帯の中ほどは安定させる
  f = smooth(clamp((tod - Math.floor(tod) - 0.65) / 0.35, 0, 1));
  var A = TOD_PAL[i0], Bp = TOD_PAL[i1];
  function mix(k) { var v = lerp(A[k], Bp[k], f); return nai > 0 ? lerp(v, TOD_PAL[4][k], nai) : v; }
  function mixC(k, out) { lerpHex(A[k], Bp[k], f, out); if (nai > 0) { _c2.set(TOD_PAL[4][k]); out.lerp(_c2, nai); } return out; }
  mixC(0, R.skyU.top.value); mixC(1, R.skyU.mid.value); mixC(2, R.skyU.bot.value);
  mixC(3, R.scene.fog.color); mixC(4, R.sun.color); R.sun.intensity = mix(5);
  mixC(4, R.skyU.sunCol.value);
  mixC(6, R.hemi.color); mixC(7, R.hemi.groundColor); R.hemi.intensity = mix(8);
  var el = mix(9), az = mix(10) + (nai > 0 ? t * 0.3 * nai : 0);
  R.skyU.sunDir.value.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
  R.skyU.stars.value = mix(11); R.skyU.t.value = t; R.skyU.crazy.value = crazy;
  R.skyU.sunSize.value = nai > 0 ? 1 + nai * 6 : 1;
  return mix(12); // lamps
}
