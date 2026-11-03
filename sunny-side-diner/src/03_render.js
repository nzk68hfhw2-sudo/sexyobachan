// ---- renderer + custom HDR post pipeline (bloom / DOF / ACES / grade / film) ---
var RENDER = { renderer: null, scene: null, camera: null, w: 1, h: 1, dpr: 1, scale: 0.8, quality: 'MEDIUM', fpsAvg: 60, autoTimer: 0, hdr: true, frame: 0, shadowEvery: 0 };
var PU = null; // composite uniforms (public: effects write into these)
var QUAL = { LOW: { scale: 0.55, tex: 512, bloom: 3, dof: false, shadow: 0, shadowSize: 512, env: 64, rain: 0.4, maxDpr: 1.5 },
  MEDIUM: { scale: 0.72, tex: 1024, bloom: 4, dof: true, shadow: 1, shadowSize: 1024, env: 128, rain: 0.7, maxDpr: 2 },
  HIGH: { scale: 0.95, tex: 1024, bloom: 5, dof: true, shadow: 2, shadowSize: 2048, env: 256, rain: 1, maxDpr: 2 } };
var Q = QUAL.MEDIUM;
function isMobile() { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); }
function pickQuality(q) {
  if (q === 'AUTO') { q = isMobile() ? 'MEDIUM' : 'HIGH'; try { var m = navigator.deviceMemory; if (m && m <= 2) q = 'LOW'; } catch (e) {} }
  return q;
}

var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var DOWN_FS = [
  'precision highp float; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh, uKnee, uFirst; varying vec2 vUv;',
  'vec3 sm(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }',
  'void main(){',
  '  vec3 c = sm(vec2(0.0)) * 4.0 + sm(vec2(-1.0,-1.0)) + sm(vec2(1.0,-1.0)) + sm(vec2(-1.0,1.0)) + sm(vec2(1.0,1.0));',
  '  c /= 8.0;',
  '  if (uFirst > 0.5) { float br = max(c.r, max(c.g, c.b)); float rq = clamp(br - uThresh + uKnee, 0.0, 2.0 * uKnee); rq = rq * rq / (4.0 * uKnee + 1e-4);',
  '    c *= max(rq, br - uThresh) / max(br, 1e-4); c = min(c, vec3(40.0)); }',
  '  gl_FragColor = vec4(c, 1.0); }'].join('\n');
var UP_FS = [
  'precision highp float; uniform sampler2D tSrc; uniform sampler2D tAdd; uniform vec2 uTexel; varying vec2 vUv;',
  'vec3 sm(vec2 o){ return texture2D(tSrc, vUv + o * uTexel).rgb; }',
  'void main(){',
  '  vec3 c = sm(vec2(-2.0,0.0)) + sm(vec2(2.0,0.0)) + sm(vec2(0.0,-2.0)) + sm(vec2(0.0,2.0));',
  '  c += (sm(vec2(-1.0,-1.0)) + sm(vec2(1.0,-1.0)) + sm(vec2(-1.0,1.0)) + sm(vec2(1.0,1.0))) * 2.0;',
  '  c /= 12.0; gl_FragColor = vec4(c + texture2D(tAdd, vUv).rgb, 1.0); }'].join('\n');
var COMP_FS = [
  'precision highp float;',
  'uniform sampler2D tScene, tBloom, tDof, tDepth, tFace; uniform vec2 uRes; uniform float uTime, uAspect;',
  'uniform float uAA, uBloom, uExposure, uDof, uFocus, uFocusRange, uNear, uFar, uHasDepth;',
  'uniform float uGrain, uAberr, uVig, uCold, uSat, uContrast, uFear, uGlitch, uVHS, uFlash, uBlack, uRed, uFace, uFaceZoom, uInvert, uWarp, uCRT;',
  'uniform vec2 uFaceShake, uFaceAsp; uniform vec3 uLift, uGain;',
  'varying vec2 vUv;',
  'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
  'vec3 aces(vec3 v){ const mat3 m1 = mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777);',
  '  const mat3 m2 = mat3(1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602);',
  '  v = m1 * v; vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return clamp(m2 * (a / b), 0.0, 1.0); }',
  'vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }',
  'float linZ(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }',
  'void main(){',
  '  vec2 uv = vUv; float t = uTime; vec2 cc = uv - 0.5; float r2 = dot(cc, cc);',
  '  // fear / warp distortion',
  '  uv += (uFear * 0.004 + uWarp * 0.01) * vec2(sin(uv.y * 23.0 + t * 2.1), cos(uv.x * 19.0 + t * 1.7));',
  '  uv = 0.5 + cc * (1.0 + uFear * 0.06 * r2 + uCRT * 0.12 * r2);',
  '  float ly = floor(uv.y * uRes.y * 0.5);',
  '  uv.x += (hash(vec2(ly, floor(t * 30.0))) - 0.5) * 0.002 * uVHS;',
  '  float gl = uGlitch * step(0.72, hash(vec2(floor(uv.y * 26.0), floor(t * 17.0))));',
  '  uv.x += gl * (hash(vec2(floor(uv.y * 26.0), t)) - 0.5) * 0.1;',
  '  float ab = uAberr * (0.0006 + r2 * 0.006) + gl * 0.012 + uFear * 0.003 + uVHS * 0.002;',
  '  vec3 col; col.r = texture2D(tScene, uv + vec2(ab, 0.0)).r; col.g = texture2D(tScene, uv).g; col.b = texture2D(tScene, uv - vec2(ab, 0.0)).b;',
  '  // FXAA-lite: blend along strong luma edges (kills stair-steps on long edges)',
  '  if (uAA > 0.5) {',
  '    vec2 px = 1.0 / uRes;',
  '    vec3 n = texture2D(tScene, uv + vec2(0.0, px.y)).rgb, s = texture2D(tScene, uv - vec2(0.0, px.y)).rgb, e = texture2D(tScene, uv + vec2(px.x, 0.0)).rgb, w = texture2D(tScene, uv - vec2(px.x, 0.0)).rgb;',
  '    vec3 lw = vec3(0.299, 0.587, 0.114);',
  '    float lN = dot(min(n, 4.0), lw), lS = dot(min(s, 4.0), lw), lE = dot(min(e, 4.0), lw), lW = dot(min(w, 4.0), lw), lM = dot(min(col, 4.0), lw);',
  '    float mx = max(max(lN, lS), max(lE, lW)), mn = min(min(lN, lS), min(lE, lW)), rng = max(mx, lM) - min(mn, lM);',
  '    if (rng > max(0.04, max(mx, lM) * 0.12)) {',
  '      vec2 dir = normalize(vec2(lS - lN, lE - lW) + 1e-5) * px;',
  '      vec3 a1 = texture2D(tScene, uv + dir * 0.5).rgb, a2 = texture2D(tScene, uv - dir * 0.5).rgb, b1 = texture2D(tScene, uv + dir * 1.5).rgb, b2 = texture2D(tScene, uv - dir * 1.5).rgb;',
  '      vec3 aa = (a1 + a2) * 0.35 + (b1 + b2) * 0.15;',
  '      col = mix(col, aa, 0.85);',
  '    }',
  '  }',
  '  // depth of field',
  '  if (uDof > 0.001 && uHasDepth > 0.5) {',
  '    float z = linZ(texture2D(tDepth, uv).x); float coc = clamp(abs(z - uFocus) / (uFocusRange * max(uFocus, 0.3)), 0.0, 1.0) * uDof;',
  '    vec2 px = 1.5 / uRes; vec3 b = texture2D(tDof, uv).rgb * 0.4 + texture2D(tDof, uv + vec2(px.x * 2.0, px.y)).rgb * 0.15 + texture2D(tDof, uv - vec2(px.x * 2.0, px.y)).rgb * 0.15',
  '      + texture2D(tDof, uv + vec2(-px.x, px.y * 2.0)).rgb * 0.15 + texture2D(tDof, uv + vec2(px.x, -px.y * 2.0)).rgb * 0.15;',
  '    col = mix(col, b, smoothstep(0.0, 1.0, coc)); }',
  '  col += texture2D(tBloom, uv).rgb * uBloom;',
  '  col *= uExposure;',
  '  col = aces(col);',
  '  // grade (display-ish space)',
  '  col = pow(col, vec3(1.0 / 1.0));',
  '  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));',
  '  col = mix(vec3(l), col, uSat);',
  '  col = (col - 0.5) * uContrast + 0.5;',
  '  vec3 warmTint = vec3(1.04, 1.0, 0.92), coldTint = vec3(0.86, 0.98, 1.12);',
  '  col *= mix(warmTint, coldTint, uCold);',
  '  col = col * uGain + uLift * (1.0 - col);',
  '  col = clamp(col, 0.0, 1.0);',
  '  // scanlines / crt',
  '  col *= 1.0 - (uVHS * 0.12 + uCRT * 0.25) * (0.5 + 0.5 * sin(vUv.y * uRes.y * 1.7));',
  '  // vignette',
  '  float v = length(cc * vec2(min(uAspect, 1.0) * 1.15, 1.0 / max(uAspect, 1.0)));',
  '  float vig = smoothstep(0.9 - uFear * 0.2, 0.22, v);',
  '  col *= mix(1.0, vig, uVig + uFear * 0.35);',
  '  col = mix(col, col * vec3(1.0, 0.25, 0.22), uRed * (1.0 - vig * 0.5));',
  '  // film grain (luma weighted)',
  '  float gr = hash(vUv * uRes + fract(t * 7.13) * 91.0) - 0.5;',
  '  col += gr * (uGrain + uFear * 0.05 + uVHS * 0.04) * (1.0 - l * 0.5);',
  '  // jumpscare face',
  '  if (uFace > 0.001) {',
  '    vec2 fu = (vUv - 0.5) * vec2(min(uAspect, 1.0) / uFaceAsp.x, 1.0 / max(uAspect, 1.0) / uFaceAsp.y) * 1.0 / uFaceZoom + 0.5 + uFaceShake;',
  '    float fl = floor(fu.y * 40.0); float tear = step(0.82, hash(vec2(fl, floor(t * 24.0))));',
  '    fu.x += tear * (hash(vec2(fl, t)) - 0.5) * 0.06 * uFace;',
  '    float fab = 0.002 + 0.01 * step(0.7, hash(vec2(floor(t * 30.0), 1.0)));',
  '    vec3 f; f.r = texture2D(tFace, fu + vec2(fab, 0.0)).r; f.g = texture2D(tFace, fu).g; f.b = texture2D(tFace, fu - vec2(fab, 0.0)).b;',
  '    float edge = smoothstep(0.0, 0.16, fu.y) * smoothstep(1.0, 0.84, fu.y) * smoothstep(0.0, 0.14, fu.x) * smoothstep(1.0, 0.86, fu.x);',
  '    f = pow(f, vec3(0.92)) * 1.2 * edge; f *= 0.88 + 0.25 * hash(vec2(floor(t * 40.0), 3.0));',
  '    f += (hash(vUv * uRes + t * 91.0) - 0.5) * 0.14; f *= 1.0 - 0.1 * sin(vUv.y * uRes.y * 1.6);',
  '    f = mix(f, vec3(1.0) - f, uInvert); f = mix(f, f * vec3(1.15, 0.78, 0.74), 0.35);',
  '    col = mix(col, f, clamp(uFace, 0.0, 1.0)); }',
  '  col = mix(col, vec3(1.0), uFlash); col *= 1.0 - uBlack;',
  '  gl_FragColor = vec4(toSRGB(clamp(col, 0.0, 1.0)), 1.0);',
  '}'].join('\n');

function mkRT(w, h, type, depth) {
  var rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: type, depthBuffer: !!depth, stencilBuffer: false });
  rt.texture.generateMipmaps = false;
  return rt;
}
function initRenderer() {
  var r;
  try { r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true }); }
  catch (e) { showFatal('WebGL を起動できませんでした', String(e)); throw e; }
  r.outputEncoding = THREE.LinearEncoding;
  r.toneMapping = THREE.NoToneMapping;
  r.physicallyCorrectLights = true;
  r.setClearColor(0x000000, 1);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
  r.domElement.style.touchAction = 'none';
  CANVAS_HOST.appendChild(r.domElement);
  RENDER.renderer = r;
  MAX_ANISO = r.capabilities.getMaxAnisotropy ? r.capabilities.getMaxAnisotropy() : 1;
  var gl = r.getContext();
  RENDER.hdr = !!(r.capabilities.isWebGL2 && (r.extensions.get('EXT_color_buffer_float') || r.extensions.get('EXT_color_buffer_half_float')));
  RENDER.ftype = RENDER.hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
  RENDER.scene = new THREE.Scene();
  RENDER.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 260);
  RENDER.scene.add(RENDER.camera);
  PU = {
    tScene: { value: null }, tBloom: { value: null }, tDof: { value: null }, tDepth: { value: null }, tFace: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uAspect: { value: 1 },
    uAA: { value: 1 }, uBloom: { value: 0.9 }, uExposure: { value: 1.0 }, uDof: { value: 0 }, uFocus: { value: 2 }, uFocusRange: { value: 0.7 }, uNear: { value: 0.05 }, uFar: { value: 260 }, uHasDepth: { value: 0 },
    uGrain: { value: 0.035 }, uAberr: { value: 0.5 }, uVig: { value: 0.55 }, uCold: { value: 0 }, uSat: { value: 1.05 }, uContrast: { value: 1.04 },
    uFear: { value: 0 }, uGlitch: { value: 0 }, uVHS: { value: 0 }, uFlash: { value: 0 }, uBlack: { value: 0 }, uRed: { value: 0 },
    uFace: { value: 0 }, uFaceZoom: { value: 1 }, uInvert: { value: 0 }, uWarp: { value: 0 }, uCRT: { value: 0 },
    uFaceShake: { value: new THREE.Vector2() }, uFaceAsp: { value: new THREE.Vector2(1.2, 1) },
    uLift: { value: new THREE.Vector3(0.012, 0.01, 0.018) }, uGain: { value: new THREE.Vector3(1, 1, 1) }
  };
  RENDER.comp = new THREE.ShaderMaterial({ uniforms: PU, vertexShader: POST_VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false });
  RENDER.downMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 1.0 }, uKnee: { value: 0.5 }, uFirst: { value: 0 } }, vertexShader: POST_VS, fragmentShader: DOWN_FS, depthTest: false, depthWrite: false });
  RENDER.upMat = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } }, vertexShader: POST_VS, fragmentShader: UP_FS, depthTest: false, depthWrite: false });
  RENDER.pScene = new THREE.Scene(); RENDER.pCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  RENDER.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), RENDER.comp); RENDER.quad.frustumCulled = false; RENDER.pScene.add(RENDER.quad);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', function () { setTimeout(onResize, 250); });
  setQuality(SAVE.settings.quality, true);
}
function setQuality(name, first) {
  RENDER.qname = name; RENDER.quality = pickQuality(name); Q = QUAL[RENDER.quality];
  RENDER.scale = Q.scale; TEXQ = Q.tex;
  RENDER.renderer.shadowMap.enabled = Q.shadow > 0;
  if (!first) { RENDER.scene.traverse(function (o) { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.needsUpdate = true; }); } }); if (typeof applyLightQuality === 'function') applyLightQuality(); }
  RENDER.renderer.shadowMap.needsUpdate = true;
  onResize();
}
function onResize() {
  var r = RENDER.renderer; if (!r) return;
  var w = ROOT.clientWidth || window.innerWidth, h = ROOT.clientHeight || window.innerHeight;
  RENDER.w = w; RENDER.h = h;
  RENDER.dpr = Math.min(window.devicePixelRatio || 1, Q.maxDpr);
  r.setPixelRatio(1);
  var pw = Math.max(1, Math.round(w * RENDER.dpr)), ph = Math.max(1, Math.round(h * RENDER.dpr));
  r.setSize(pw, ph, false); r.domElement.style.width = w + 'px'; r.domElement.style.height = h + 'px';
  var sw = Math.max(2, Math.round(pw * RENDER.scale)), sh = Math.max(2, Math.round(ph * RENDER.scale));
  RENDER.sw = sw; RENDER.sh = sh;
  if (!RENDER.rt) {
    RENDER.rt = mkRT(sw, sh, RENDER.ftype, true);
    try { RENDER.rt.depthTexture = new THREE.DepthTexture(sw, sh); RENDER.rt.depthTexture.type = THREE.UnsignedIntType; PU.uHasDepth.value = 1; } catch (e) { PU.uHasDepth.value = 0; }
    RENDER.chain = [];
  } else RENDER.rt.setSize(sw, sh);
  // post chain: d0 (1/2), d1 (1/4, dof), b1..bn (bloom 1/4..), u1..un
  var mk = function (i, s) { var W = Math.max(2, Math.round(sw / s)), H = Math.max(2, Math.round(sh / s)); if (!RENDER.chain[i]) RENDER.chain[i] = mkRT(W, H, RENDER.ftype, false); else RENDER.chain[i].setSize(W, H); return RENDER.chain[i]; };
  RENDER.d0 = mk(0, 2); RENDER.d1 = mk(1, 4);
  RENDER.b = []; RENDER.u = [];
  for (var i = 0; i < 5; i++) { RENDER.b[i] = mk(2 + i, 4 * Math.pow(2, i)); RENDER.u[i] = mk(8 + i, 4 * Math.pow(2, i)); }
  PU.uRes.value.set(sw, sh); PU.uAspect.value = w / h;
  var cam = RENDER.camera; cam.aspect = w / h;
  cam.fov = w / h < 0.62 ? 74 : (w / h < 1 ? 66 : 56);
  if (RENDER.fovOverride) cam.fov = RENDER.fovOverride;
  cam.updateProjectionMatrix();
  if (typeof layoutUI === 'function') layoutUI();
}
function pass(mat, target) { RENDER.quad.material = mat; RENDER.renderer.setRenderTarget(target); RENDER.renderer.render(RENDER.pScene, RENDER.pCam); }
function renderFrame(scene, camera) {
  var r = RENDER.renderer, cam = camera || RENDER.camera;
  RENDER.frame++;
  if (Q.shadow > 1 && RENDER.frame % 3 === 0) r.shadowMap.needsUpdate = true;
  if (RENDER.shadowDirty) { r.shadowMap.needsUpdate = true; RENDER.shadowDirty = false; }
  r.setRenderTarget(RENDER.rt); r.render(scene || RENDER.scene, cam);
  var dm = RENDER.downMat.uniforms, um = RENDER.upMat.uniforms;
  // half-res plain
  dm.tSrc.value = RENDER.rt.texture; dm.uTexel.value.set(1 / RENDER.rt.width, 1 / RENDER.rt.height); dm.uFirst.value = 0; pass(RENDER.downMat, RENDER.d0);
  if (Q.dof && PU.uDof.value > 0.001) { dm.tSrc.value = RENDER.d0.texture; dm.uTexel.value.set(1 / RENDER.d0.width, 1 / RENDER.d0.height); pass(RENDER.downMat, RENDER.d1); }
  // bloom
  var n = Q.bloom;
  dm.tSrc.value = RENDER.d0.texture; dm.uTexel.value.set(1 / RENDER.d0.width, 1 / RENDER.d0.height); dm.uFirst.value = 1; dm.uThresh.value = RENDER.hdr ? 1.0 : 0.72; pass(RENDER.downMat, RENDER.b[0]);
  dm.uFirst.value = 0;
  for (var i = 1; i < n; i++) { dm.tSrc.value = RENDER.b[i - 1].texture; dm.uTexel.value.set(1 / RENDER.b[i - 1].width, 1 / RENDER.b[i - 1].height); pass(RENDER.downMat, RENDER.b[i]); }
  var src = RENDER.b[n - 1];
  for (var k = n - 2; k >= 0; k--) { um.tSrc.value = src.texture; um.tAdd.value = RENDER.b[k].texture; um.uTexel.value.set(0.5 / src.width, 0.5 / src.height); pass(RENDER.upMat, RENDER.u[k]); src = RENDER.u[k]; }
  PU.tScene.value = RENDER.rt.texture; PU.tBloom.value = src.texture; PU.tDof.value = RENDER.d1.texture; PU.tDepth.value = RENDER.rt.depthTexture || null;
  PU.uNear.value = cam.near; PU.uFar.value = cam.far;
  var dofSave = PU.uDof.value; if (!Q.dof) PU.uDof.value = 0;
  pass(RENDER.comp, null);
  PU.uDof.value = dofSave;
}
function adaptQuality(dt) {
  var fps = 1 / Math.max(dt, 0.001);
  RENDER.fpsAvg = lerp(RENDER.fpsAvg, fps, 0.05);
  if (RENDER.qname !== 'AUTO') return;
  RENDER.autoTimer += dt; if (RENDER.autoTimer < 3) return; RENDER.autoTimer = 0;
  var s = RENDER.scale;
  if (RENDER.fpsAvg < 34 && s > 0.45) s = Math.max(0.45, s - 0.08);
  else if (RENDER.fpsAvg > 57 && s < Q.scale) s = Math.min(Q.scale, s + 0.04);
  if (Math.abs(s - RENDER.scale) > 0.001) { RENDER.scale = s; onResize(); }
}
// environment map: render the diner from a point, prefilter with PMREM
function bakeEnv(pos, exclude) {
  var r = RENDER.renderer, size = Q.env;
  var crt = new THREE.WebGLCubeRenderTarget(size, { type: RENDER.ftype, format: THREE.RGBAFormat, generateMipmaps: false, minFilter: THREE.LinearFilter });
  var cc = new THREE.CubeCamera(0.1, 120, crt); cc.position.copy(pos); RENDER.scene.add(cc);
  var hidden = []; (exclude || []).forEach(function (o) { if (o.visible) { o.visible = false; hidden.push(o); } });
  var envSave = RENDER.scene.environment; RENDER.scene.environment = null;
  cc.update(r, RENDER.scene);
  hidden.forEach(function (o) { o.visible = true; });
  RENDER.scene.remove(cc);
  var pm = new THREE.PMREMGenerator(r); var envRT = pm.fromCubemap(crt.texture); pm.dispose(); crt.dispose();
  RENDER.scene.environment = envSave;
  return envRT.texture;
}
