// ---- renderer, post-processing, quality -------------------------------------
var RENDER = { renderer: null, scene: null, camera: null, rt: null, post: null, postScene: null, postCam: null, scale: 0.75, dpr: 1, w: 1, h: 1, fpsAvg: 60, autoTimer: 0, quality: 'MEDIUM' };
var POSTU = null;

function initRenderer() {
  var r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
  r.outputEncoding = THREE.sRGBEncoding;
  r.setClearColor(0x000000, 1);
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; r.shadowMap.autoUpdate = true;
  CANVAS_HOST.appendChild(r.domElement);
  RENDER.renderer = r;
  MAX_ANISO = r.capabilities.getMaxAnisotropy ? r.capabilities.getMaxAnisotropy() : 1;
  RENDER.scene = new THREE.Scene();
  RENDER.camera = new THREE.PerspectiveCamera(70, 1, 0.07, 220);
  RENDER.scene.add(RENDER.camera);
  POSTU = {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uVHS: { value: 0 }, uFear: { value: 0 },
    uGrain: { value: 0.05 }, uAberr: { value: 0.6 }, uTrack: { value: 0 }, uFlash: { value: 0 }, uBlack: { value: 0 }, uTint: { value: 0 },
    uDesat: { value: 0 }, uExposure: { value: 1 }, tFace: { value: null }, uFace: { value: 0 }, uFaceZoom: { value: 1 }, uFaceShake: { value: new THREE.Vector2() },
    uInvert: { value: 0 }, uAspect: { value: 1 }, uGlitch: { value: 0 }, uRed: { value: 0 }, uWarm: { value: 0 }, uLowHP: { value: 0 }
  };
  var post = new THREE.ShaderMaterial({ uniforms: POSTU, vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false, depthWrite: false });
  RENDER.postScene = new THREE.Scene();
  RENDER.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false;
  RENDER.postScene.add(quad);
  RENDER.post = post;
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', function () { setTimeout(onResize, 200); });
  applyQuality(SAVE.settings.quality);
  onResize();
}
function applyQuality(q) {
  RENDER.quality = q;
  var r = RENDER.renderer;
  if (q === 'LOW') { RENDER.scale = 0.5; r.shadowMap.enabled = false; }
  else if (q === 'MEDIUM') { RENDER.scale = 0.72; r.shadowMap.enabled = false; }
  else if (q === 'HIGH') { RENDER.scale = 1.0; r.shadowMap.enabled = true; }
  else { RENDER.scale = 0.72; r.shadowMap.enabled = !isMobile(); } // AUTO
  if (PLAYER_LIGHT.spot) { PLAYER_LIGHT.spot.castShadow = r.shadowMap.enabled; }
  RENDER.scene.traverse(function (o) { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
  onResize();
}
function isMobile() { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); }
function onResize() {
  var r = RENDER.renderer; if (!r) return;
  var w = ROOT.clientWidth || window.innerWidth, h = ROOT.clientHeight || window.innerHeight;
  RENDER.w = w; RENDER.h = h;
  RENDER.dpr = Math.min(window.devicePixelRatio || 1, 2);
  r.setPixelRatio(1);
  var pw = Math.max(1, Math.round(w * RENDER.dpr)), ph = Math.max(1, Math.round(h * RENDER.dpr));
  r.setSize(pw, ph, false);
  r.domElement.style.width = w + 'px'; r.domElement.style.height = h + 'px';
  var sw = Math.max(1, Math.round(pw * RENDER.scale)), sh = Math.max(1, Math.round(ph * RENDER.scale));
  if (!RENDER.rt) {
    RENDER.rt = new THREE.WebGLRenderTarget(sw, sh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false });
    RENDER.rt.texture.encoding = THREE.sRGBEncoding;
    try { RENDER.rt.depthTexture = new THREE.DepthTexture(sw, sh); RENDER.rt.depthTexture.type = THREE.UnsignedIntType; } catch (e) {}
    RENDER.rt.texture.generateMipmaps = false;
  } else RENDER.rt.setSize(sw, sh);
  POSTU.uRes.value.set(sw, sh);
  POSTU.uAspect.value = w / h;
  RENDER.camera.aspect = w / h;
  RENDER.camera.fov = w / h < 0.7 ? 78 : 68; // portrait phones need a wider view
  RENDER.camera.updateProjectionMatrix();
  if (typeof layoutUI === 'function') layoutUI();
}
function renderFrame(scene, camera) {
  var r = RENDER.renderer;
  POSTU.tDiffuse.value = RENDER.rt.texture;
  r.setRenderTarget(RENDER.rt);
  r.render(scene || RENDER.scene, camera || RENDER.camera);
  r.setRenderTarget(null);
  r.render(RENDER.postScene, RENDER.postCam);
}
// adaptive resolution (AUTO)
function adaptQuality(dt) {
  var fps = 1 / Math.max(dt, 0.001);
  RENDER.fpsAvg = lerp(RENDER.fpsAvg, fps, 0.05);
  if (RENDER.quality !== 'AUTO') return;
  RENDER.autoTimer += dt;
  if (RENDER.autoTimer < 2.5) return;
  RENDER.autoTimer = 0;
  var s = RENDER.scale;
  if (RENDER.fpsAvg < 32 && s > 0.45) s = Math.max(0.45, s - 0.1);
  else if (RENDER.fpsAvg > 56 && s < 0.9) s = Math.min(0.9, s + 0.05);
  if (s !== RENDER.scale) { RENDER.scale = s; onResize(); }
}

var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var POST_FS = [
  'precision highp float;',
  'uniform sampler2D tDiffuse; uniform sampler2D tFace; uniform vec2 uRes; uniform float uTime;',
  'uniform float uVHS, uFear, uGrain, uAberr, uTrack, uFlash, uBlack, uTint, uDesat, uExposure, uFace, uFaceZoom, uInvert, uAspect, uGlitch, uRed, uWarm, uLowHP;',
  'uniform vec2 uFaceShake; varying vec2 vUv;',
  'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
  'float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }',
  'vec3 sampleScene(vec2 uv, float ab){ vec3 c; c.r = texture2D(tDiffuse, uv + vec2(ab, 0.0)).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - vec2(ab, 0.0)).b; return c; }',
  'void main(){',
  '  vec2 uv = vUv; float t = uTime;',
  '  vec2 cc = uv - 0.5; float r2 = dot(cc, cc);',
  '  // fear: slow wobble + pull toward center',
  '  uv += uFear * 0.0045 * vec2(sin(uv.y * 22.0 + t * 2.3), cos(uv.x * 18.0 + t * 1.9));',
  '  uv = 0.5 + cc * (1.0 + (0.035 * uVHS + uFear * 0.07) * r2 - uFear * 0.015);',
  '  // VHS line jitter + tracking band',
  '  float ly = floor(uv.y * uRes.y * 0.5);',
  '  float jit = (hash(vec2(ly, floor(t * 30.0))) - 0.5) * 0.0018 * uVHS;',
  '  float bandY = fract(t * 0.09 + 0.3); float bd = abs(uv.y - bandY);',
  '  float band = (1.0 - smoothstep(0.0, 0.035 + uTrack * 0.05, bd)) * (0.25 * uVHS + uTrack);',
  '  uv.x += jit + band * (hash(vec2(ly, t)) - 0.3) * 0.03;',
  '  float gl = uGlitch * step(0.7, hash(vec2(floor(uv.y * 24.0), floor(t * 18.0))));',
  '  uv.x += gl * (hash(vec2(floor(uv.y * 24.0), t)) - 0.5) * 0.12;',
  '  float ab = uAberr * (0.0012 + r2 * 0.008) + uVHS * 0.0016 + gl * 0.01 + uFear * 0.003;',
  '  vec3 col = sampleScene(uv, ab);',
  '  // chroma bleed (VHS): smear color horizontally, keep luma sharp',
  '  if (uVHS > 0.01) { vec3 s1 = texture2D(tDiffuse, uv - vec2(0.004, 0.0)).rgb; vec3 s2 = texture2D(tDiffuse, uv - vec2(0.008, 0.0)).rgb;',
  '    float l0 = dot(col, vec3(0.299, 0.587, 0.114)); vec3 chroma = (col + s1 + s2) / 3.0; float lc = dot(chroma, vec3(0.299, 0.587, 0.114));',
  '    col = mix(col, chroma - lc + l0, 0.55 * uVHS); }',
  '  col *= uExposure;',
  '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
  '  col = mix(col, vec3(lum), uDesat);',
  '  col *= mix(vec3(1.0, 1.03, 0.95), vec3(0.82, 0.96, 1.16), uTint);',
  '  col = mix(col, col * vec3(1.12, 1.0, 0.85), uWarm);',
  '  // scanlines',
  '  col *= 1.0 - uVHS * 0.13 * (0.5 + 0.5 * sin(vUv.y * uRes.y * 1.6));',
  '  // tracking noise streaks',
  '  float streak = step(0.985 - band * 0.2, hash(vec2(floor(vUv.y * uRes.y * 0.35), floor(t * 20.0) + floor(vUv.x * 6.0))));',
  '  col += streak * (0.12 * uVHS + band * 0.6) * vec3(0.9, 0.95, 1.0);',
  '  // grain',
  '  float gr = hash(vUv * uRes + fract(t * 7.0) * 100.0) - 0.5;',
  '  col += gr * (uGrain + uVHS * 0.035 + uFear * 0.05);',
  '  // vignette (fear makes edges close in)',
  '  float v = length(cc * vec2(uAspect < 1.0 ? 1.0 : uAspect, uAspect < 1.0 ? 1.0 / uAspect * 0.7 : 1.0));',
  '  float vig = smoothstep(0.95 - uFear * 0.25, 0.25 - uFear * 0.1, v);',
  '  col *= mix(1.0, vig, 0.55 + uFear * 0.4);',
  '  col = mix(col, col * vec3(1.0, 0.3, 0.3), uRed * (1.0 - vig * 0.6));',
  '  col *= 1.0 - uLowHP * 0.5 * (1.0 - vig) * (0.6 + 0.4 * sin(t * 6.0));',
  '  // jumpscare face',
  '  if (uFace > 0.001) {',
  '    vec2 fu = (vUv - 0.5) * vec2(uAspect < 1.0 ? uAspect : 1.0, uAspect < 1.0 ? 1.0 : 1.0 / uAspect) / uFaceZoom + 0.5 + uFaceShake;',
  '    float fl = floor(fu.y * 40.0); float tear = step(0.8, hash(vec2(fl, floor(t * 25.0))));',
  '    fu.x += tear * (hash(vec2(fl, t)) - 0.5) * 0.08 * uFace;',
  '    float fab = 0.0015 + 0.009 * step(0.75, hash(vec2(floor(t * 30.0), 1.0)));',
  '    vec3 f; f.r = texture2D(tFace, fu + vec2(fab, 0.0)).r; f.g = texture2D(tFace, fu).g; f.b = texture2D(tFace, fu - vec2(fab, 0.0)).b;',
  '    float inb = step(0.0, fu.x) * step(fu.x, 1.0) * step(0.0, fu.y) * step(fu.y, 1.0);',
  '    float edge = smoothstep(0.0, 0.12, fu.y) * smoothstep(1.0, 0.88, fu.y) * smoothstep(0.0, 0.08, fu.x) * smoothstep(1.0, 0.92, fu.x);',
  '    f *= inb * edge; f = pow(f, vec3(0.9)) * 1.25;',
  '    f *= 0.85 + 0.3 * hash(vec2(floor(t * 40.0), 3.0));',
  '    f += (hash(vUv * uRes + t * 91.0) - 0.5) * 0.16;',
  '    f *= 1.0 - 0.12 * sin(vUv.y * uRes.y * 1.6);',
  '    f = mix(f, vec3(1.0) - f, uInvert);',
  '    f = mix(f, f * vec3(1.2, 0.7, 0.7), 0.3);',
  '    col = mix(col, f, clamp(uFace, 0.0, 1.0));',
  '  }',
  '  col = mix(col, vec3(1.0), uFlash);',
  '  col *= 1.0 - uBlack;',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

var PLAYER_LIGHT = { spot: null, target: null };
