// ---- renderer, trip shaders, post-processing ------------------------------------
var RENDER = { renderer: null, scene: null, camera: null, rt: null, fbA: null, fbB: null, scale: 0.75, dpr: 1, w: 1, h: 1, fpsAvg: 60, autoTimer: 0, quality: 'AUTO' };
var POSTU = null, COPYU = null;
// shared uniforms injected into every world material ("the room itself trips")
var TRIPU = { uT: { value: 0 }, uPat: { value: 0 }, uBreath: { value: 0 }, uMelt: { value: 0 }, uHueW: { value: 0 }, uGlow: { value: 0 }, uDark: { value: 0 } };

function tripify(mat, opts) {
  opts = opts || {};
  mat.onBeforeCompile = function (sh) {
    for (var k in TRIPU) sh.uniforms[k] = TRIPU[k];
    sh.vertexShader = 'uniform float uT; uniform float uBreath; uniform float uMelt; varying vec3 vRmW;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
      '#include <begin_vertex>',
      'vec4 rmW = modelMatrix * vec4(transformed, 1.0);',
      'float rmB = sin(rmW.x * 2.3 + uT * 1.7) * sin(rmW.z * 2.1 - uT * 1.3) * sin(rmW.y * 2.7 + uT * 1.1);',
      opts.rigid ? '' : 'transformed += normal * rmB * uBreath * 0.06;',
      opts.rigid ? '' : 'transformed.y -= uMelt * 0.05 * (0.5 + 0.5 * sin(rmW.x * 7.0 + rmW.z * 5.0 + uT * 0.6)) * max(0.0, rmW.y - 0.3);',
      'vRmW = rmW.xyz;'
    ].join('\n'));
    sh.fragmentShader = 'uniform float uT; uniform float uPat; uniform float uHueW; uniform float uGlow; uniform float uDark; varying vec3 vRmW;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>', [
      '{',
      '  vec3 w = vRmW; float t = uT;',
      '  if (uPat > 0.001) {',
      '    float p1 = sin(w.x * 5.0 + sin(w.z * 4.0 + t * 0.8) * 2.0 + t * 0.6);',
      '    float p2 = sin(w.y * 6.0 - t * 0.7 + cos(w.x * 3.0 + t * 0.5) * 2.5);',
      '    float p3 = sin((w.x + w.z) * 3.5 + w.y * 2.0 + t);',
      '    float p = p1 * p2 + p3 * 0.5;',
      '    vec3 pc = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + p * 0.35 + t * 0.04 + uHueW));',
      '    float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));',
      '    gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.55 + pc * (0.12 + lum * 1.3), clamp(uPat * (0.55 + 0.45 * p), 0.0, 1.0));',
      '  }',
      '  gl_FragColor.rgb += uGlow * vec3(1.0, 0.45, 0.7) * 0.06;',
      '  gl_FragColor.rgb *= 1.0 - uDark * 0.5;',
      '}',
      '#include <tonemapping_fragment>'
    ].join('\n'));
  };
  mat.customProgramCacheKey = function () { return 'rmtrip' + (opts.rigid ? 'r' : ''); };
  return mat;
}

function initRenderer() {
  var r = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: true });
  r.outputEncoding = THREE.sRGBEncoding;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0.92;
  r.setClearColor(0x000000, 1);
  CANVAS_HOST.appendChild(r.domElement);
  RENDER.renderer = r;
  RENDER.scene = new THREE.Scene();
  RENDER.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400);
  RENDER.scene.add(RENDER.camera);
  POSTU = {
    tDiffuse: { value: null }, tPrev: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uAspect: { value: 1 },
    uPsy: { value: 0 }, uDis: { value: 0 }, uDel: { value: 0 }, uDrunk: { value: 0 }, uStim: { value: 0 }, uSed: { value: 0 }, uEmp: { value: 0 },
    uAnx: { value: 0 }, uNau: { value: 0 }, uLids: { value: 0 }, uBlack: { value: 0 }, uTrail: { value: 0 }, uKal: { value: 0 }, uRed: { value: 0 },
    uFlash: { value: 0 }, uHue: { value: 0 }, uSpin: { value: 0 }, uCalm: { value: 0 }, uWhite: { value: 0 }, uGap: { value: 0 }
  };
  var post = new THREE.ShaderMaterial({ uniforms: POSTU, vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false, depthWrite: false });
  RENDER.postScene = new THREE.Scene();
  RENDER.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false;
  RENDER.postScene.add(quad);
  COPYU = { tDiffuse: { value: null } };
  var copy = new THREE.ShaderMaterial({ uniforms: COPYU, vertexShader: POST_VS, fragmentShader: 'precision mediump float; uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tDiffuse, vUv); }', depthTest: false, depthWrite: false });
  RENDER.copyScene = new THREE.Scene();
  var q2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copy); q2.frustumCulled = false; RENDER.copyScene.add(q2);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', function () { setTimeout(onResize, 200); });
  applyQuality(SAVE.settings.quality);
}
function isMobile() { return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)); }
function applyQuality(q) {
  RENDER.quality = q;
  if (q === 'LOW') RENDER.scale = 0.5;
  else if (q === 'MEDIUM') RENDER.scale = 0.7;
  else if (q === 'HIGH') RENDER.scale = 1.0;
  else RENDER.scale = isMobile() ? 0.62 : 0.8;
  onResize();
}
function mkRT(w, h, depth) {
  var t = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: !!depth, stencilBuffer: false });
  t.texture.generateMipmaps = false;
  return t;
}
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
    RENDER.rt = mkRT(sw, sh, true); RENDER.rt.texture.encoding = THREE.sRGBEncoding;
    RENDER.fbA = mkRT(sw, sh, false); RENDER.fbB = mkRT(sw, sh, false);
  } else { RENDER.rt.setSize(sw, sh); RENDER.fbA.setSize(sw, sh); RENDER.fbB.setSize(sw, sh); }
  POSTU.uRes.value.set(sw, sh);
  POSTU.uAspect.value = w / h;
  RENDER.camera.aspect = w / h;
  RENDER.baseFov = w / h < 0.7 ? 76 : 66;
  RENDER.camera.fov = RENDER.baseFov;
  RENDER.camera.updateProjectionMatrix();
  if (typeof layoutUI === 'function') layoutUI();
}
function renderFrame() {
  var r = RENDER.renderer;
  r.setRenderTarget(RENDER.rt);
  r.render(RENDER.scene, RENDER.camera);
  POSTU.tDiffuse.value = RENDER.rt.texture;
  POSTU.tPrev.value = RENDER.fbB.texture;
  r.setRenderTarget(RENDER.fbA);
  r.render(RENDER.postScene, RENDER.postCam);
  COPYU.tDiffuse.value = RENDER.fbA.texture;
  r.setRenderTarget(null);
  r.render(RENDER.copyScene, RENDER.postCam);
  var tmp = RENDER.fbA; RENDER.fbA = RENDER.fbB; RENDER.fbB = tmp;
}
function adaptQuality(dt) {
  var fps = 1 / Math.max(dt, 0.001);
  RENDER.fpsAvg = lerp(RENDER.fpsAvg, fps, 0.05);
  if (RENDER.quality !== 'AUTO') return;
  RENDER.autoTimer += dt;
  if (RENDER.autoTimer < 2.5) return;
  RENDER.autoTimer = 0;
  var s = RENDER.scale;
  if (RENDER.fpsAvg < 34 && s > 0.42) s = Math.max(0.42, s - 0.08);
  else if (RENDER.fpsAvg > 57 && s < 0.9) s = Math.min(0.9, s + 0.04);
  if (Math.abs(s - RENDER.scale) > 0.001) { RENDER.scale = s; onResize(); }
}

var POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
var POST_FS = [
  'precision highp float;',
  'uniform sampler2D tDiffuse; uniform sampler2D tPrev; uniform vec2 uRes; uniform float uTime, uAspect;',
  'uniform float uPsy, uDis, uDel, uDrunk, uStim, uSed, uEmp, uAnx, uNau, uLids, uBlack, uTrail, uKal, uRed, uFlash, uHue, uSpin, uCalm, uWhite, uGap;',
  'varying vec2 vUv;',
  'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
  'vec3 hueRot(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a); return c*ca + cross(k, c)*sin(a) + k*dot(k, c)*(1.0-ca); }',
  'void main(){',
  '  float t = uTime;',
  '  vec2 c = vUv - 0.5; c.x *= uAspect;',
  '  // spinning room',
  '  float sa = uSpin * (0.25 * sin(t * 0.35) + 0.08 * sin(t * 1.1));',
  '  c = mat2(cos(sa), -sin(sa), sin(sa), cos(sa)) * c;',
  '  // kaleidoscope',
  '  if (uKal > 0.001) {',
  '    float r = length(c); float a = atan(c.y, c.x) + t * 0.04;',
  '    float seg = 6.2831853 / 8.0; float am = mod(a, seg); am = abs(am - seg * 0.5);',
  '    vec2 k = vec2(cos(am), sin(am)) * r;',
  '    c = mix(c, k, clamp(uKal, 0.0, 1.0));',
  '  }',
  '  // dissociation: fisheye bulge + tunnel stretch',
  '  float r2 = dot(c, c);',
  '  c *= 1.0 + uDis * 0.45 * r2 - uDis * 0.12;',
  '  // psychedelic breathing waves',
  '  c += uPsy * 0.010 * vec2(sin(c.y * 9.0 + t * 1.3) + 0.5 * sin(c.y * 23.0 - t * 2.1), cos(c.x * 8.0 - t * 1.1) + 0.5 * cos(c.x * 19.0 + t * 1.7));',
  '  // drunk sway',
  '  c += uDrunk * 0.012 * vec2(sin(t * 0.9), cos(t * 0.7));',
  '  // nausea ripple',
  '  c.y += uNau * 0.010 * sin(c.x * 4.0 + t * 2.0);',
  '  vec2 uv = vec2(c.x / uAspect, c.y) + 0.5;',
  '  uv = clamp(uv, 0.001, 0.999);',
  '  // chromatic aberration',
  '  float ab = 0.0012 + uPsy * 0.0055 + uStim * 0.0015 + uDis * 0.004 + uAnx * 0.001;',
  '  vec2 dir = (vUv - 0.5) * ab * 2.0;',
  '  vec3 col;',
  '  col.r = texture2D(tDiffuse, uv + dir).r; col.g = texture2D(tDiffuse, uv).g; col.b = texture2D(tDiffuse, uv - dir).b;',
  '  // double vision (alcohol)',
  '  if (uDrunk > 0.02) {',
  '    float dd = min(uDrunk, 1.6) * 0.016 * (0.6 + 0.4 * sin(t * 0.5));',
  '    vec3 d2 = texture2D(tDiffuse, clamp(uv + vec2(dd, dd * 0.3), 0.001, 0.999)).rgb;',
  '    col = mix(col, d2, min(0.45, uDrunk * 0.35));',
  '  }',
  '  // soft blur for sedation',
  '  if (uSed > 0.05) {',
  '    float bl = min(uSed, 1.5) * 0.004;',
  '    vec3 b = texture2D(tDiffuse, uv + vec2(bl, 0.0)).rgb + texture2D(tDiffuse, uv - vec2(bl, 0.0)).rgb + texture2D(tDiffuse, uv + vec2(0.0, bl * uAspect)).rgb + texture2D(tDiffuse, uv - vec2(0.0, bl * uAspect)).rgb;',
  '    col = mix(col, b * 0.25, min(0.7, uSed * 0.5));',
  '  }',
  '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
  '  // saturation: psy & emp boost, sedation drains',
  '  col = mix(vec3(lum), col, clamp(1.0 + uPsy * 0.9 + uEmp * 0.35 - uSed * 0.35 - uDel * 0.4, 0.0, 3.0));',
  '  // hue cycling bands (psy)',
  '  float hb = uPsy * (0.35 + uCalm * -0.2) * sin(lum * 10.0 + t * 0.6 + length(c) * 5.0);',
  '  col = hueRot(col, uHue + hb);',
  '  // fractal-ish lattice overlay (strong psy)',
  '  if (uPsy > 0.35) {',
  '    vec2 q = c * 7.0; float ang = t * 0.05; q = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * q;',
  '    float g = 0.0; vec2 z = q;',
  '    for (int i = 0; i < 4; i++) { z = abs(z) / dot(z, z + 0.001) - 0.9 - 0.08 * sin(t * 0.2); g += exp(-abs(z.x * z.y) * 6.0); }',
  '    vec3 lc = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + g * 0.2 + t * 0.05));',
  '    col += lc * g * 0.045 * smoothstep(0.35, 1.6, uPsy) * (1.0 - uCalm * 0.6);',
  '  }',
  '  // emp: warm pink glow and sparkles',
  '  col += uEmp * vec3(0.16, 0.04, 0.09) * (1.0 - lum);',
  '  if (uEmp > 0.1) { vec2 gc = vUv * uRes / 9.0; vec2 gp = floor(gc); vec2 gf = fract(gc) - 0.5; float sp = step(0.994, hash(gp + floor(t * 2.0))); float star = max(0.0, 1.0 - (abs(gf.x) * abs(gf.y) * 60.0 + length(gf) * 2.2)); col += sp * star * uEmp * vec3(1.0, 0.75, 0.9) * 0.9; }',
  '  // feedback trails',
  '  if (uTrail > 0.001) {',
  '    vec2 pu = vUv + (vUv - 0.5) * (-0.006 - 0.004 * uPsy) + vec2(sin(t + vUv.y * 6.0), cos(t * 0.8 + vUv.x * 6.0)) * 0.0015 * uPsy;',
  '    vec3 prev = texture2D(tPrev, pu).rgb;',
  '    prev = hueRot(prev, 0.06 * uPsy);',
  '    col = mix(col, mix(col, max(col, prev * 0.94), 0.75), uTrail);',
  '  }',
  '  // stimulants: contrast & crispness',
  '  col = (col - 0.5) * (1.0 + uStim * 0.22) + 0.5;',
  '  // sedation: warm & dim',
  '  col = mix(col, col * vec3(1.06, 0.97, 0.84), clamp(uSed * 0.5, 0.0, 0.6));',
  '  // delirium: grime, darkness, crawling grain',
  '  float gr = hash(vUv * uRes + fract(t * 7.0) * 100.0) - 0.5;',
  '  col += gr * (0.025 + uDel * 0.09 + uDis * 0.03);',
  '  col *= 1.0 - uDel * 0.25;',
  '  // vignette / tunnel vision',
  '  vec2 vc = vUv - 0.5; vc.x *= mix(1.0, uAspect, 0.5);',
  '  float v = length(vc);',
  '  float tun = smoothstep(0.85 - uDis * 0.25 - uSed * 0.12 - uDel * 0.15 - uRed * 0.12, 0.18, v);',
  '  col *= mix(1.0, tun, 0.45 + uDis * 0.4 + uDel * 0.3);',
  '  // anxiety pulse & danger red',
  '  float pulse = 0.5 + 0.5 * sin(t * 7.0);',
  '  col = mix(col, col * vec3(1.15, 0.35, 0.35), uRed * (0.5 + 0.5 * pulse) * (1.0 - tun * 0.5));',
  '  col *= 1.0 - uAnx * 0.12 * pulse * (1.0 - tun);',
  '  // eyelids',
  '  float ly = abs(vUv.y - 0.5) * 2.0;',
  '  float le = uLids * 1.1 - 0.1; float lid = smoothstep(le, le + 0.1, 1.0 - ly);',
  '  col *= lid;',
  '  // blackout gaps',
  '  col *= 1.0 - uGap;',
  '  col = mix(col, vec3(1.0), uFlash);',
  '  col = mix(col, vec3(1.0, 0.98, 0.95), uWhite);',
  '  col *= 1.0 - uBlack;',
  '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
  '}'
].join('\n');
