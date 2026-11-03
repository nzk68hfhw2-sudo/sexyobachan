// ---- materials: Phong + baked dual lighting (lights ON / lights OFF) --------
var LIGHTU = { uMix: { value: 1 }, uFlick: { value: [1, 1, 1, 1, 1, 1, 1, 1] }, uTime: { value: 0 }, uEmerg: { value: 1 } };
// mode: 'attr' (merged static geometry), 'inst' (instanced), 'probe' (per-object uniforms)
function bakeMat(params, mode, extra) {
  var m = new THREE.MeshPhongMaterial(params);
  m.userData.mode = mode || 'attr';
  m.userData.probeOn = { value: new THREE.Color(0.6, 0.6, 0.6) };
  m.userData.probeOff = { value: new THREE.Color(0.03, 0.035, 0.05) };
  extra = extra || {};
  m.onBeforeCompile = function (sh) {
    sh.uniforms.uMix = LIGHTU.uMix; sh.uniforms.uFlick = LIGHTU.uFlick; sh.uniforms.uTime = LIGHTU.uTime; sh.uniforms.uEmerg = LIGHTU.uEmerg;
    sh.uniforms.uProbeOn = m.userData.probeOn; sh.uniforms.uProbeOff = m.userData.probeOff;
    var mode = m.userData.mode;
    var decl = '\nuniform float uMix; uniform float uFlick[8]; uniform float uTime; uniform float uEmerg; uniform vec3 uProbeOn; uniform vec3 uProbeOff; varying vec3 vBake;\n' +
      (mode === 'attr' ? 'attribute vec4 bOn; attribute vec4 bOff;\n' : '') +
      (mode === 'inst' ? 'attribute vec3 bOnI; attribute vec3 bOffI;\n' : '') + (extra.vdecl || '');
    var body;
    if (mode === 'attr') body = 'int gi = int(bOn.a * 7.0 + 0.5); float fl = 1.0;\n for (int k = 0; k < 8; k++) { if (k == gi) fl = uFlick[k]; }\n float em = mix(1.0, uEmerg, bOff.a);\n vBake = mix(bOff.rgb * 2.0 * em, bOn.rgb * 2.0 * fl, uMix);\n';
    else if (mode === 'inst') body = 'vBake = mix(bOffI * 2.0, bOnI * 2.0 * uFlick[0], uMix);\n';
    else body = 'vBake = mix(uProbeOff, uProbeOn, uMix);\n';
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>' + decl)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + body + (extra.vbody || ''));
    if (extra.fmap) sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', extra.fmap);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vBake; uniform float uTime;\n' + (extra.fdecl || ''))
      .replace('#include <aomap_fragment>', (extra.fbody || '') + 'reflectedLight.indirectDiffuse += vBake * diffuseColor.rgb;\n#include <aomap_fragment>');
    if (extra.uniforms) for (var k in extra.uniforms) sh.uniforms[k] = extra.uniforms[k];
    m.userData.shader = sh;
  };
  m.customProgramCacheKey = function () { return 'bake-' + m.userData.mode + (extra.key || ''); };
  return m;
}
function setProbe(mat, on, off) { mat.userData.probeOn.value.setRGB(on[0], on[1], on[2]); mat.userData.probeOff.value.setRGB(off[0], off[1], off[2]); }

var MATS = {};
function makeWorldMaterials() {
  var aniso = MAX_ANISO;
  function tx(c, rx, ry) { var t = toTex(c, { aniso: Math.min(8, aniso) }); if (rx) t.repeat.set(rx, ry || rx); return t; }
  TEX.lino = tx(texLino([206, 198, 176], [58, 64, 74], 7));
  TEX.lino2 = tx(texLino([210, 202, 180], [150, 138, 112], 8));
  TEX.gym = tx(texWoodFloor(3));
  TEX.tile = tx(texSmallTile(5));
  TEX.terrazzo = tx(texTerrazzo(9));
  TEX.carpet = tx(texCarpet(11));
  TEX.concrete = tx(texConcrete(13));
  TEX.ceiling = tx(texCeiling(17));
  TEX.ceiling2 = tx(texCeiling(18));
  TEX.cmu = tx(texCMU(19));
  TEX.glazed = tx(texGlazed(23, [112, 38, 36]));
  TEX.glazedG = tx(texGlazed(24, [52, 88, 74]));
  TEX.brick = tx(texBrick(29));
  TEX.lockers = tx(texLockers(37));
  TEX.wood = tx(texWood(41, [150, 102, 60]));
  TEX.woodDark = tx(texWood(42, [92, 60, 36]));
  TEX.metal = tx(texMetal(43, [160, 162, 160]));
  var asph = texConcrete(71); pixels(asph, function (x, y, p) { p[0] = p[0] * 0.45; p[1] = p[1] * 0.45; p[2] = p[2] * 0.47; });
  TEX.asphalt = tx(asph);
  var grass = mkCanvas(256, 256); pixels(grass, function (x, y, p) { var n = fbm(x * 0.05, y * 0.05, 4); var h = hash2(x, y); p[0] = 40 + n * 30 + h * 20; p[1] = 58 + n * 40 + h * 25; p[2] = 30 + n * 18; p[3] = 255; });
  TEX.grass = tx(grass);
  var bump = toTex(texNoiseGray(256, 0.08, 1.2)); TEX.bump = bump;

  MATS.floor = {};
  MATS.floor[M_LINO] = bakeMat({ map: TEX.lino, shininess: 70, specular: new THREE.Color(0.28, 0.28, 0.26) });
  MATS.floor[M_LINO2] = bakeMat({ map: TEX.lino2, shininess: 70, specular: new THREE.Color(0.28, 0.28, 0.26) });
  MATS.floor[M_GYM] = bakeMat({ map: TEX.gym, shininess: 90, specular: new THREE.Color(0.35, 0.3, 0.25) });
  MATS.floor[M_TILE] = bakeMat({ map: TEX.tile, shininess: 60, specular: new THREE.Color(0.25, 0.25, 0.25) });
  MATS.floor[M_TERRAZZO] = bakeMat({ map: TEX.terrazzo, shininess: 60, specular: new THREE.Color(0.25, 0.25, 0.24) });
  MATS.floor[M_CARPET] = bakeMat({ map: TEX.carpet, shininess: 2, specular: new THREE.Color(0, 0, 0) });
  MATS.floor[M_CONCRETE] = bakeMat({ map: TEX.concrete, shininess: 8, specular: new THREE.Color(0.05, 0.05, 0.05) });
  MATS.floor[M_ASPHALT] = bakeMat({ map: TEX.asphalt, shininess: 30, specular: new THREE.Color(0.12, 0.12, 0.13) });
  MATS.floor[M_GRASS] = bakeMat({ map: TEX.grass, shininess: 3, specular: new THREE.Color(0, 0, 0) });
  MATS.floor[M_BUS] = bakeMat({ map: TEX.concrete, color: 0x555048, shininess: 10 });
  MATS.ceiling = bakeMat({ map: TEX.ceiling, shininess: 4, specular: new THREE.Color(0.02, 0.02, 0.02) });
  MATS.ceiling2 = bakeMat({ map: TEX.ceiling2, shininess: 4, specular: new THREE.Color(0.02, 0.02, 0.02) });
  MATS.ceilingDark = bakeMat({ map: TEX.concrete, color: 0x6a6660, shininess: 4 });
  MATS.cmu = bakeMat({ map: TEX.cmu, vertexColors: true, shininess: 14, specular: new THREE.Color(0.06, 0.06, 0.06) });
  MATS.glazed = bakeMat({ map: TEX.glazed, vertexColors: true, shininess: 90, specular: new THREE.Color(0.4, 0.4, 0.4) });
  MATS.brick = bakeMat({ map: TEX.brick, shininess: 4, specular: new THREE.Color(0.03, 0.03, 0.03), bumpMap: TEX.bump, bumpScale: 0.02 });
  MATS.tilewall = bakeMat({ map: TEX.tile, vertexColors: true, shininess: 70, specular: new THREE.Color(0.3, 0.3, 0.3) });
  MATS.concreteWall = bakeMat({ map: TEX.concrete, vertexColors: true, shininess: 6 });
  MATS.paint = bakeMat({ vertexColors: true, shininess: 24, specular: new THREE.Color(0.12, 0.12, 0.12) }); // generic props
  MATS.metalP = bakeMat({ map: TEX.metal, vertexColors: true, shininess: 60, specular: new THREE.Color(0.45, 0.45, 0.45) });
  MATS.wood = bakeMat({ map: TEX.wood, vertexColors: true, shininess: 30, specular: new THREE.Color(0.15, 0.13, 0.1) });
  MATS.lockers = bakeMat({ map: TEX.lockers, vertexColors: true, shininess: 50, specular: new THREE.Color(0.35, 0.35, 0.35) });
  MATS.emit = bakeMat({ vertexColors: true, shininess: 0, specular: new THREE.Color(0, 0, 0) }); // light fixtures / signs (lit by bake)
  MATS.glass = new THREE.MeshPhongMaterial({ color: 0x0a1420, transparent: true, opacity: 0.42, shininess: 120, specular: new THREE.Color(0.6, 0.65, 0.7), depthWrite: false });
  MATS.outsideBlack = new THREE.MeshBasicMaterial({ color: 0x000000 });
}
