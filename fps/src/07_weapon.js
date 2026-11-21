// ---- weapons (8 kinds), aiming, recoil, rockets, grenades, particles, decals --
var gun = {}, FX = {};
var _v1, _v2, _v3, _q1;
// fall: [full damage until, minimum from, minimum multiplier]   ads: spread multiplier while aiming   zoom: fov while aiming (landscape)
var WDEF = {
  ar:      { name: 'アサルトライフル', price: 0,    mag: 30, rate: 0.098, dmg: 34,  spread: 0.004, ads: 0.3,  bloomAdd: 0.0045, bloomMax: 0.028, recP: 0.5,  recY: 0.22, reload: 1.7, pellets: 1, fall: [25, 60, 0.6],  zoom: 46, move: 1,    info: '中距離が得意。バランス型' },
  pistol:  { name: 'ハンドガン',       price: 0,    mag: 12, rate: 0.17,  dmg: 30,  spread: 0.005, ads: 0.4,  bloomAdd: 0.006,  bloomMax: 0.03,  recP: 0.7,  recY: 0.25, reload: 1.2, pellets: 1, fall: [14, 35, 0.5],  zoom: 54, move: 1.06, info: '近〜中距離。動きが速く、リロードも速い' },
  shotgun: { name: 'ショットガン',     price: 0,    mag: 6,  rate: 0.8,   dmg: 15,  spread: 0.055, ads: 0.75, bloomAdd: 0,      bloomMax: 0.03,  recP: 1.7,  recY: 0.5,  reload: 2.3, pellets: 9, fall: [7, 22, 0.15],  zoom: 56, move: 0.98, info: '近距離で一撃。遠くにはほぼ届かない' },
  sniper:  { name: 'スナイパーライフル', price: 0,  mag: 5,  rate: 1.25,  dmg: 150, spread: 0.04,  ads: 0,    bloomAdd: 0,      bloomMax: 0.04,  recP: 2.3,  recY: 0.4,  reload: 2.6, pellets: 1, fall: [90, 220, 0.8], zoom: 15, move: 0.9,  scope: true, info: '遠距離専用。のぞくと一発必中' },
  smg:     { name: 'サブマシンガン',   price: 800,  mag: 32, rate: 0.066, dmg: 22,  spread: 0.007, ads: 0.45, bloomAdd: 0.003,  bloomMax: 0.03,  recP: 0.3,  recY: 0.28, reload: 1.5, pellets: 1, fall: [12, 32, 0.5],  zoom: 54, move: 1.08, info: '近距離の連射。動きながらでも当てやすい' },
  lmg:     { name: 'ライトマシンガン', price: 1500, mag: 80, rate: 0.085, dmg: 30,  spread: 0.008, ads: 0.35, bloomAdd: 0.003,  bloomMax: 0.04,  recP: 0.42, recY: 0.3,  reload: 3.8, pellets: 1, fall: [30, 70, 0.65], zoom: 46, move: 0.85, info: '80発の大容量。重くてリロードが長い' },
  magnum:  { name: 'マグナム',         price: 1000, mag: 6,  rate: 0.48,  dmg: 85,  spread: 0.004, ads: 0.25, bloomAdd: 0.012,  bloomMax: 0.04,  recP: 2.0,  recY: 0.5,  reload: 2.0, pellets: 1, fall: [20, 50, 0.6],  zoom: 50, move: 1.03, info: '1発が重い。頭に当てれば一撃' },
  rocket:  { name: 'ロケットランチャー', price: 2500, mag: 1, rate: 0.5,  dmg: 190, spread: 0.002, ads: 0.5,  bloomAdd: 0,      bloomMax: 0.02,  recP: 1.8,  recY: 0.3,  reload: 2.7, pellets: 1, fall: [999, 999, 1],  zoom: 50, move: 0.88, rocket: true, info: '爆発でまとめて倒す。自分も巻きこまれる' }
};
var WORDER = ['ar', 'pistol', 'shotgun', 'sniper', 'smg', 'lmg', 'magnum', 'rocket'];
var SKINS = {
  s_default: { name: 'スタンダード', price: 0,    color: 0x2f2a22, rough: 0.75, metal: 0.05 },
  s_desert:  { name: 'デザート',     price: 300,  color: 0xa5855a, rough: 0.8,  metal: 0.05 },
  s_arctic:  { name: 'アークティック', price: 300, color: 0xdfe4ea, rough: 0.45, metal: 0.1 },
  s_camo:    { name: 'カモフラージュ', price: 500, color: 0xffffff, rough: 0.85, metal: 0, camo: true },
  s_neon:    { name: 'ネオン',       price: 800,  color: 0x10d8c4, rough: 0.35, metal: 0.3, emissive: 0x0b6f66 },
  s_gold:    { name: 'ゴールド',     price: 2000, color: 0xe0aa1c, rough: 0.22, metal: 1 }
};
var TRACERS = { t_default: { name: 'イエロー', price: 0, color: 0xffe2a0 }, t_red: { name: 'レッド', price: 150, color: 0xff5a4a }, t_green: { name: 'グリーン', price: 150, color: 0x6dff7a }, t_blue: { name: 'ブルー', price: 150, color: 0x5ab4ff }, t_pink: { name: 'ピンク', price: 200, color: 0xff7ad8 } };
var CROSSES = { c_default: { name: 'ホワイト', price: 0, css: '#ffffff' }, c_green: { name: 'グリーン', price: 100, css: '#5dff7a' }, c_cyan: { name: 'シアン', price: 100, css: '#5de8ff' }, c_yellow: { name: 'イエロー', price: 100, css: '#ffe24a' }, c_pink: { name: 'ピンク', price: 100, css: '#ff7ad8' } };
// parts: ['b', w,h,d, x,y,z, mat, rotX] box / ['c', radius,length, x,y,z, mat] cylinder along z.  mat: m metal, p polymer, s skin
var GUNS = {
  ar: { muzzle: [0.012, -0.72], sight: 0.097, hands: [[-0.012, -0.045, -0.33], [0.006, -0.085, 0.09]], mag: 8, parts: [
    ['b', 0.052, 0.085, 0.3, 0, 0, -0.04, 'm'], ['b', 0.046, 0.03, 0.34, 0, 0.055, -0.1, 'm'], ['b', 0.056, 0.062, 0.27, 0, 0.004, -0.325, 's'], ['c', 0.011, 0.24, 0, 0.012, -0.56, 'm'], ['c', 0.018, 0.07, 0, 0.012, -0.665, 'm'],
    ['b', 0.044, 0.07, 0.24, 0, -0.012, 0.23, 's'], ['b', 0.048, 0.1, 0.03, 0, -0.03, 0.355, 'p'], ['b', 0.04, 0.11, 0.05, 0, -0.09, 0.085, 'p', 0.3], ['b', 0.036, 0.17, 0.062, 0, -0.115, -0.07, 'm', -0.16],
    ['b', 0.012, 0.04, 0.012, 0, 0.085, -0.43, 'm'], ['b', 0.05, 0.008, 0.07, 0, 0.122, -0.03, 'm'], ['b', 0.008, 0.05, 0.07, 0.025, 0.097, -0.03, 'm'], ['b', 0.008, 0.05, 0.07, -0.025, 0.097, -0.03, 'm']] },
  pistol: { muzzle: [0.022, -0.16], sight: 0.048, off: [0, -0.01, -0.02], hands: [[-0.012, -0.075, 0.03], [0.012, -0.07, 0.035]], mag: 2, parts: [
    ['b', 0.03, 0.036, 0.2, 0, 0.022, -0.05, 'm'], ['b', 0.028, 0.03, 0.13, 0, -0.008, -0.03, 's'], ['b', 0.03, 0.1, 0.046, 0, -0.06, 0.03, 'p', 0.2], ['b', 0.006, 0.01, 0.01, 0, 0.044, -0.14, 'm'], ['b', 0.014, 0.01, 0.008, 0, 0.044, 0.04, 'm']] },
  shotgun: { muzzle: [0.018, -0.7], sight: 0.05, hands: [[-0.01, -0.04, -0.36], [0.006, -0.08, 0.1]], mag: -1, parts: [
    ['b', 0.05, 0.072, 0.3, 0, 0, -0.02, 'm'], ['c', 0.015, 0.5, 0, 0.018, -0.43, 'm'], ['c', 0.013, 0.42, 0, -0.014, -0.38, 'm'], ['b', 0.052, 0.048, 0.17, 0, -0.016, -0.36, 's'],
    ['b', 0.044, 0.075, 0.28, 0, -0.02, 0.27, 's'], ['b', 0.04, 0.1, 0.05, 0, -0.085, 0.1, 's', 0.35], ['b', 0.008, 0.012, 0.008, 0, 0.04, -0.66, 'm']] },
  sniper: { muzzle: [0.012, -0.92], sight: 0.088, hands: [[-0.012, -0.045, -0.3], [0.006, -0.085, 0.1]], mag: 7, parts: [
    ['b', 0.05, 0.072, 0.36, 0, 0, -0.03, 'm'], ['c', 0.012, 0.6, 0, 0.012, -0.58, 'm'], ['c', 0.02, 0.09, 0, 0.012, -0.9, 'm'], ['b', 0.052, 0.052, 0.3, 0, -0.004, -0.3, 's'], ['b', 0.046, 0.095, 0.3, 0, -0.02, 0.3, 's'],
    ['b', 0.04, 0.11, 0.05, 0, -0.09, 0.1, 'p', 0.3], ['c', 0.03, 0.27, 0, 0.088, -0.04, 'm'], ['b', 0.034, 0.1, 0.06, 0, -0.085, -0.06, 'm'], ['c', 0.037, 0.05, 0, 0.088, -0.19, 'm'], ['c', 0.034, 0.04, 0, 0.088, 0.1, 'm'],
    ['b', 0.02, 0.03, 0.04, 0, 0.05, -0.1, 'm'], ['b', 0.02, 0.03, 0.04, 0, 0.05, 0.02, 'm']] },
  smg: { muzzle: [0.012, -0.34], sight: 0.07, off: [0, 0, -0.03], hands: [[-0.012, -0.06, -0.2], [0.006, -0.085, 0.07]], mag: 5, parts: [
    ['b', 0.048, 0.076, 0.26, 0, 0, -0.04, 'm'], ['b', 0.05, 0.05, 0.12, 0, -0.008, -0.2, 's'], ['c', 0.012, 0.1, 0, 0.012, -0.29, 'm'], ['b', 0.036, 0.1, 0.045, 0, -0.085, 0.07, 'p', 0.25], ['b', 0.03, 0.09, 0.04, 0, -0.07, -0.2, 'p'],
    ['b', 0.028, 0.2, 0.042, 0, -0.13, -0.05, 'm'], ['b', 0.014, 0.014, 0.22, 0.02, 0.02, 0.2, 'm'], ['b', 0.014, 0.014, 0.22, -0.02, 0.02, 0.2, 'm'], ['b', 0.05, 0.08, 0.02, 0, -0.01, 0.31, 'p'], ['b', 0.03, 0.022, 0.1, 0, 0.05, -0.02, 'm']] },
  lmg: { muzzle: [0.014, -0.8], sight: 0.092, hands: [[-0.014, -0.05, -0.36], [0.006, -0.09, 0.1]], mag: 6, parts: [
    ['b', 0.062, 0.1, 0.38, 0, 0, -0.02, 'm'], ['c', 0.015, 0.46, 0, 0.014, -0.54, 'm'], ['c', 0.02, 0.07, 0, 0.014, -0.79, 'm'], ['b', 0.06, 0.06, 0.26, 0, 0, -0.34, 's'], ['b', 0.05, 0.085, 0.26, 0, -0.012, 0.3, 's'],
    ['b', 0.04, 0.11, 0.05, 0, -0.1, 0.1, 'p', 0.3], ['b', 0.12, 0.11, 0.1, -0.02, -0.1, -0.08, 's'], ['b', 0.012, 0.03, 0.2, 0, 0.085, -0.3, 'm'], ['b', 0.05, 0.03, 0.12, 0, 0.065, -0.02, 'm'],
    ['b', 0.01, 0.18, 0.01, 0.03, -0.09, -0.52, 'm', 0.35], ['b', 0.01, 0.18, 0.01, -0.03, -0.09, -0.52, 'm', 0.35]] },
  magnum: { muzzle: [0.028, -0.22], sight: 0.055, off: [0, -0.01, -0.02], hands: [[-0.012, -0.08, 0.04], [0.012, -0.075, 0.045]], mag: -1, parts: [
    ['c', 0.014, 0.17, 0, 0.028, -0.13, 'm'], ['b', 0.012, 0.014, 0.16, 0, 0.008, -0.12, 'm'], ['c', 0.027, 0.055, 0, 0.016, -0.015, 'm'], ['b', 0.026, 0.044, 0.1, 0, 0.012, 0, 'm'], ['b', 0.03, 0.105, 0.046, 0, -0.06, 0.045, 's', 0.28],
    ['b', 0.006, 0.012, 0.01, 0, 0.05, -0.2, 'm'], ['b', 0.012, 0.016, 0.02, 0, 0.045, 0.045, 'm']] },
  rocket: { muzzle: [0.03, -0.62], sight: 0.115, off: [0.02, 0.0, 0.02], hands: [[-0.012, -0.05, -0.25], [0.006, -0.085, 0.05]], mag: -1, parts: [
    ['c', 0.052, 0.95, 0, 0.03, -0.1, 's'], ['c', 0.064, 0.07, 0, 0.03, -0.58, 'm'], ['c', 0.06, 0.1, 0, 0.03, 0.4, 'm'], ['b', 0.036, 0.1, 0.045, 0, -0.07, 0.05, 'p', 0.2], ['b', 0.034, 0.09, 0.04, 0, -0.065, -0.25, 'p'],
    ['b', 0.02, 0.05, 0.1, 0.045, 0.1, -0.1, 'm'], ['b', 0.05, 0.03, 0.2, 0, -0.03, -0.1, 'm']] }
};
var GMAT = {};
function gunMats() {
  if (GMAT.m) return;
  GMAT.m = stdMat({ color: 0x131416, roughness: 0.42, metalness: 0.92, roughnessMap: TEX.metalRgh, envMapIntensity: 1.1 });
  GMAT.p = stdMat({ color: 0x15171a, roughness: 0.72, metalness: 0.05, envMapIntensity: 0.5 });
  GMAT.glove = stdMat({ color: 0x121311, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 });
  GMAT.sleeve = stdMat({ color: 0x2a3024, roughness: 1, metalness: 0, envMapIntensity: 0.3 });
  GMAT.handG = new THREE.SphereGeometry(0.045, 10, 8);
}
function makeSkinMat(id) {
  var s = SKINS[id] || SKINS.s_default, m = stdMat({ color: s.color, roughness: s.rough, metalness: s.metal, envMapIntensity: s.metal > 0.5 ? 1.2 : 0.5 });
  if (s.camo) m.map = TEX.camo; if (s.emissive) m.emissive.set(s.emissive);
  return m;
}
function setSkinMat(m, id) {
  var s = SKINS[id] || SKINS.s_default; m.color.set(s.color); m.roughness = s.rough; m.metalness = s.metal; m.envMapIntensity = s.metal > 0.5 ? 1.2 : 0.5;
  m.map = s.camo ? TEX.camo : null; m.emissive.set(s.emissive || 0); m.needsUpdate = true;
}
function cylBetween(a, b, r, mat, parent) {
  var d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, d.length(), 10), mat);
  m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); parent.add(m); return m;
}
function buildGunModel(id, skinMat, withHands) {
  gunMats();
  var def = GUNS[id], g = new THREE.Group(), mats = { m: GMAT.m, p: GMAT.p, s: skinMat }, parts = [];
  def.parts.forEach(function (p) {
    var mesh;
    if (p[0] === 'b') { mesh = new THREE.Mesh(new THREE.BoxGeometry(p[1], p[2], p[3]), mats[p[7]]); mesh.position.set(p[4], p[5], p[6]); if (p[8]) mesh.rotation.x = p[8]; }
    else { mesh = new THREE.Mesh(new THREE.CylinderGeometry(p[1], p[1], p[2], 12), mats[p[6]]); mesh.rotation.x = Math.PI / 2; mesh.position.set(p[3], p[4], p[5]); }
    g.add(mesh); parts.push(mesh);
  });
  var out = { g: g, id: id, mag: def.mag >= 0 ? parts[def.mag] : null, magY: def.mag >= 0 ? parts[def.mag].position.y : 0 };
  out.muzzle = new THREE.Object3D(); out.muzzle.position.set(0, def.muzzle[0], def.muzzle[1]); g.add(out.muzzle);
  out.eject = new THREE.Object3D(); out.eject.position.set(0.04, 0.03, -0.02); g.add(out.eject);
  if (id === 'ar') { var dot = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 8), new THREE.MeshBasicMaterial({ color: 0xff2a1a })); dot.position.set(0, 0.097, -0.034); g.add(dot); }
  if (withHands) {
    var h = def.hands, lh = new THREE.Mesh(GMAT.handG, GMAT.glove); lh.scale.set(1.1, 0.8, 1.5); lh.position.set(h[0][0], h[0][1], h[0][2]); g.add(lh);
    cylBetween(new THREE.Vector3(h[0][0] - 0.02, h[0][1] - 0.015, h[0][2] + 0.03), new THREE.Vector3(-0.3, -0.3, h[0][2] + 0.43), 0.042, GMAT.sleeve, g);
    var rh = new THREE.Mesh(GMAT.handG, GMAT.glove); rh.scale.set(1.0, 1.3, 1.0); rh.position.set(h[1][0], h[1][1], h[1][2]); g.add(rh);
    cylBetween(new THREE.Vector3(h[1][0] + 0.014, h[1][1] - 0.035, h[1][2] + 0.01), new THREE.Vector3(0.16, -0.32, h[1][2] + 0.33), 0.045, GMAT.sleeve, g);
  }
  g.traverse(function (o) { if (o.isMesh) o.frustumCulled = false; });
  return out;
}
function curId() { return gun.slots[gun.cur]; }
function curDef() { return WDEF[curId()]; }
function setLoadout(list) {
  var l = (list || []).filter(function (id, i, a) { return WDEF[id] && a.indexOf(id) === i; }).slice(0, 4); if (!l.length) l = ['ar', 'pistol', 'shotgun', 'sniper'];
  gun.slots = l; gun.cur = 0; gun.ammo = {}; l.forEach(function (id) { gun.ammo[id] = WDEF[id].mag; });
  WORDER.forEach(function (id) { gun.models[id].g.visible = id === l[0]; });
  gun.reloadT = 0; gun.swT = 0; gun.ads = 0;
}
function buildWeapon() {
  _v1 = new THREE.Vector3(); _v2 = new THREE.Vector3(); _v3 = new THREE.Vector3(); _q1 = new THREE.Quaternion();
  // camo texture for the skin
  var cn = fbmField(131, 128, 4, 3), cols = [[58, 66, 44], [92, 84, 56], [38, 40, 30], [120, 110, 78]];
  TEX.camo = texFrom(fieldToCanvas(128, function (i) { return cols[clamp(Math.floor(cn[i] * 5.2 - 0.6), 0, 3)]; }), [2, 2], true);
  var root = gun.root = new THREE.Group(), k = gun.kick = new THREE.Group(); root.add(k);
  gun.skinMat = makeSkinMat('s_default'); gun.models = {};
  WORDER.forEach(function (id) { var m = buildGunModel(id, gun.skinMat, true); m.g.visible = false; k.add(m.g); gun.models[id] = m; });
  var fm = new THREE.MeshBasicMaterial({ map: TEX.flash, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  gun.flash = new THREE.Group();
  var f1 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), fm); gun.flash.add(f1);
  var f2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), fm); f2.rotation.y = Math.PI / 2; f2.position.z = -0.1; gun.flash.add(f2);
  var f3 = f2.clone(); f3.rotation.set(Math.PI / 2, 0, Math.PI / 2); gun.flash.add(f3);
  gun.flash.visible = false; k.add(gun.flash);
  root.scale.setScalar(0.3); camera.add(root);
  gun.light = new THREE.PointLight(0xffb060, 0, 14, 2); gun.light.position.set(0.1, -0.05, -0.6); camera.add(gun.light);
  gun.base = new THREE.Vector3(0.068, -0.062, -0.155);
  gun.cool = 0; gun.reloadT = 0; gun.kz = 0; gun.kr = 0; gun.bloom = 0; gun.flashT = 0; gun.swayX = 0; gun.swayY = 0; gun.ads = 0; gun.swT = 0; gun.swTo = 0;
  gun.recP = 0; gun.recPV = 0; gun.recY = 0; gun.recYV = 0; gun.tracerColor = 0xffe2a0;
  setLoadout(['ar', 'pistol', 'shotgun', 'sniper']);

  // ---- effect pools
  var N = FX.N = 260; FX.pos = new Float32Array(N * 3); FX.vel = new Float32Array(N * 3); FX.life = new Float32Array(N); FX.next = 0;
  for (var i = 0; i < N; i++) FX.pos[i * 3 + 1] = -999;
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(FX.pos, 3));
  FX.points = new THREE.Points(pg, new THREE.PointsMaterial({ map: TEX.glow, size: 0.16, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffc070, sizeAttenuation: true }));
  FX.points.frustumCulled = false; scene.add(FX.points);
  FX.smokes = []; for (i = 0; i < 30; i++) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, transparent: true, opacity: 0, depthWrite: false, color: 0x8a8078 })); s.visible = false; scene.add(s); FX.smokes.push({ s: s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grow: 1 }); }
  FX.smokeI = 0;
  FX.flashes = []; for (i = 0; i < 6; i++) { var fs = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fs.visible = false; scene.add(fs); FX.flashes.push({ s: fs, life: 0, max: 1, size: 1 }); }
  FX.flashI = 0;
  var dg = new THREE.PlaneGeometry(0.16, 0.16), dm = new THREE.MeshBasicMaterial({ map: TEX.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  FX.decals = []; for (i = 0; i < 40; i++) { var d = new THREE.Mesh(dg, dm); d.visible = false; scene.add(d); FX.decals.push(d); } FX.decalI = 0;
  var tg = new THREE.BoxGeometry(0.018, 0.018, 1); tg.translate(0, 0, 0.5);
  FX.tracers = []; for (i = 0; i < 12; i++) { var t = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); t.visible = false; t.frustumCulled = false; scene.add(t); FX.tracers.push({ m: t, life: 0 }); } FX.tracerI = 0;
  var brass = stdMat({ color: 0xc9a24a, roughness: 0.3, metalness: 1 }), sg = new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), debM = stdMat({ color: 0x25272b, roughness: 0.5, metalness: 0.8 }), debG = new THREE.BoxGeometry(0.16, 0.06, 0.12);
  FX.bodies = []; for (i = 0; i < 26; i++) { var isShell = i < 10, b = new THREE.Mesh(isShell ? sg : debG, isShell ? brass : debM); b.visible = false; b.castShadow = !isShell; scene.add(b); FX.bodies.push({ m: b, shell: isShell, life: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0 }); }
  FX.shellI = 0; FX.debI = 10;
  FX.boomLight = new THREE.PointLight(0xff9040, 0, 26, 2); scene.add(FX.boomLight); FX.boomT = 0;
  // rockets + grenades
  var rg = new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8); rg.rotateX(Math.PI / 2);
  var rm = stdMat({ color: 0x3a4030, roughness: 0.6, metalness: 0.4 }), ng = new THREE.SphereGeometry(0.075, 10, 8), nm = stdMat({ color: 0x2f3a22, roughness: 0.7, metalness: 0.3 });
  FX.rockets = []; FX.nades = [];
  for (i = 0; i < 3; i++) {
    var r = new THREE.Mesh(rg, rm); r.visible = false; scene.add(r);
    var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffa040, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); gl.scale.setScalar(1.1); gl.position.z = 0.35; r.add(gl);
    FX.rockets.push({ m: r, on: false, vx: 0, vy: 0, vz: 0, life: 0, trail: 0 });
    var n = new THREE.Mesh(ng, nm); n.visible = false; n.castShadow = true; scene.add(n); FX.nades.push({ m: n, on: false, vx: 0, vy: 0, vz: 0, fuse: 0 });
  }
}
function fxSparks(x, y, z, nx, ny, nz, n, speed) {
  if (Q.tier === 0) n = Math.ceil(n * 0.5);
  for (var i = 0; i < n; i++) {
    var k = FX.next; FX.next = (FX.next + 1) % FX.N;
    FX.pos[k * 3] = x; FX.pos[k * 3 + 1] = y; FX.pos[k * 3 + 2] = z;
    FX.vel[k * 3] = (nx * 0.7 + (Math.random() - 0.5) * 1.3) * speed * Math.random(); FX.vel[k * 3 + 1] = (ny * 0.7 + (Math.random() - 0.3) * 1.3) * speed * Math.random(); FX.vel[k * 3 + 2] = (nz * 0.7 + (Math.random() - 0.5) * 1.3) * speed * Math.random();
    FX.life[k] = 0.15 + Math.random() * 0.45;
  }
}
function fxSmoke(x, y, z, size, life, color, vy) {
  var s = FX.smokes[FX.smokeI]; FX.smokeI = (FX.smokeI + 1) % FX.smokes.length;
  s.s.position.set(x, y, z); s.s.scale.setScalar(size); s.s.material.color.set(color || 0x8a8078); s.s.material.rotation = Math.random() * 6; s.s.visible = true;
  s.life = s.max = life; s.vx = (Math.random() - 0.5) * 0.5; s.vz = (Math.random() - 0.5) * 0.5; s.vy = vy == null ? 0.6 : vy; s.grow = size * 1.4;
}
function fxFlash(x, y, z, size, life, color) {
  var f = FX.flashes[FX.flashI]; FX.flashI = (FX.flashI + 1) % FX.flashes.length;
  f.s.position.set(x, y, z); f.s.material.color.set(color || 0xffffff); f.s.visible = true; f.life = f.max = life; f.size = size;
}
function fxDecal(x, y, z, nx, ny, nz) {
  var d = FX.decals[FX.decalI]; FX.decalI = (FX.decalI + 1) % FX.decals.length;
  d.position.set(x + nx * 0.006, y + ny * 0.006, z + nz * 0.006); _v1.set(x + nx, y + ny, z + nz); d.lookAt(_v1); d.rotateZ(Math.random() * 6); d.scale.setScalar(0.7 + Math.random() * 0.6); d.visible = true;
}
function fxTracer(a, b, color) {
  var t = FX.tracers[FX.tracerI]; FX.tracerI = (FX.tracerI + 1) % FX.tracers.length;
  t.m.position.copy(a); t.m.lookAt(b); t.m.scale.z = a.distanceTo(b); t.m.visible = true; t.life = 0.06; t.m.material.opacity = 0.7; t.m.material.color.set(color == null ? 0xffe2a0 : color);
}
function fxBody(shell, x, y, z, vx, vy, vz) {
  var i = shell ? FX.shellI : FX.debI, b = FX.bodies[i];
  if (shell) FX.shellI = (i + 1) % 10; else FX.debI = 10 + ((i - 10 + 1) % 16);
  b.m.position.set(x, y, z); b.m.visible = true; b.life = shell ? 2.5 : 4; b.vx = vx; b.vy = vy; b.vz = vz; b.rx = rnd(-14, 14); b.rz = rnd(-14, 14);
  if (!shell) b.m.scale.set(rnd(0.5, 1.6), rnd(0.6, 1.4), rnd(0.5, 1.6));
}
function fxExplosion(x, y, z, big) {
  fxFlash(x, y, z, big ? 7 : 4.5, 0.22, 0xffd9a0); fxSparks(x, y, z, 0, 0.5, 0, big ? 46 : 30, 11);
  for (var i = 0; i < (Q.tier === 0 ? 2 : 5); i++) fxSmoke(x + rnd(-0.4, 0.4), y + rnd(-0.2, 0.4), z + rnd(-0.4, 0.4), rnd(1, 1.8), rnd(0.9, 1.6), i % 2 ? 0x3a3632 : 0x6a625a, 1.1);
  for (i = 0; i < 5; i++) fxBody(false, x, y, z, rnd(-4, 4), rnd(1, 6), rnd(-4, 4));
  FX.boomLight.position.set(x, y, z); FX.boomT = 0.25;
}
// area damage. owner: P or a bot (its team is spared, except the owner itself)
function explodeAt(x, y, z, R, dmg, owner, label) {
  fxExplosion(x, Math.max(0.3, y), z, true); SFX.boom(panTo(x, z), volAt(x, y, z));
  var d = Math.hypot(x - P.x, y - (P.y + 1.1), z - P.z); if (d < 16) G.shake = Math.min(1.8, G.shake + (16 - d) * 0.09);
  var team = owner === P ? P.team : owner.team;
  if (d < R && P.hp > 0 && (owner === P || team !== P.team)) hurtPlayer(dmg * (1 - d / R) * (owner === P ? 0.45 : 1), x, z, owner, label);
  for (var i = ENEMIES.length - 1; i >= 0; i--) {
    var e = ENEMIES[i]; if (e.dead || e.team === team) continue;
    var de = Math.hypot(x - e.x, y - actorY(e), z - e.z); if (de < R) damageActor(e, dmg * (1 - de / R * 0.85), owner, label, false, e.x, actorY(e), e.z);
  }
}
function launchRocket(ox, oy, oz, dx, dy, dz) {
  for (var i = 0; i < FX.rockets.length; i++) { var r = FX.rockets[i]; if (r.on) continue;
    r.on = true; r.life = 4; r.vx = dx * 42; r.vy = dy * 42; r.vz = dz * 42; r.m.position.set(ox, oy, oz); _v1.set(ox - dx, oy - dy, oz - dz); r.m.lookAt(_v1); r.m.visible = true; return; }
}
function throwGrenade() {
  if (P.nades <= 0 || P.hp <= 0 || gun.nadeCool > 0) return;
  for (var i = 0; i < FX.nades.length; i++) { var n = FX.nades[i]; if (n.on) continue;
    camera.getWorldDirection(_v1); camera.getWorldPosition(_v2);
    n.on = true; n.fuse = 2.1; n.vx = _v1.x * 17 + P.vx; n.vy = _v1.y * 17 + 4.5; n.vz = _v1.z * 17 + P.vz; n.m.position.set(_v2.x + _v1.x * 0.4, _v2.y - 0.15, _v2.z + _v1.z * 0.4); n.m.visible = true;
    P.nades--; gun.nadeCool = 0.8; SFX.throwS(); gun.kr = 0.1; return; }
}
function updateProjectiles(dt) {
  var i, w;
  for (i = 0; i < FX.rockets.length; i++) {
    var r = FX.rockets[i]; if (!r.on) continue;
    var p = r.m.position, sp = 42, step = sp * dt, dx = r.vx / sp, dy = r.vy / sp, dz = r.vz / sp, hitT = step + 1;
    w = rayWorld(p.x, p.y, p.z, dx + 1e-9, dy + 1e-9, dz + 1e-9, step); if (w) hitT = w.t;
    for (var j = 0; j < ENEMIES.length; j++) { var e = ENEMIES[j]; if (e.dead || e.team === P.team) continue; _v1.set(dx, dy, dz); var te = raySphere(p, _v1, e.x, actorY(e), e.z, 0.6); if (te > 0 && te < hitT) hitT = te; }
    r.life -= dt; r.trail -= dt; if (r.trail <= 0) { r.trail = 0.035; fxSmoke(p.x, p.y, p.z, 0.4, 0.5, 0xb8b2aa, 0.2); }
    if (hitT <= step || r.life <= 0) { r.on = false; r.m.visible = false; explodeAt(p.x + dx * Math.min(hitT, step), p.y + dy * Math.min(hitT, step), p.z + dz * Math.min(hitT, step), 5.5, WDEF.rocket.dmg, P, 'ロケットランチャー'); continue; }
    p.x += r.vx * dt; p.y += r.vy * dt; p.z += r.vz * dt;
  }
  for (i = 0; i < FX.nades.length; i++) {
    var n = FX.nades[i]; if (!n.on) continue;
    var q = n.m.position; n.vy -= 15 * dt; var v = Math.sqrt(n.vx * n.vx + n.vy * n.vy + n.vz * n.vz) || 0.001, st = v * dt;
    w = v > 0.3 ? rayWorld(q.x, q.y, q.z, n.vx / v + 1e-9, n.vy / v + 1e-9, n.vz / v + 1e-9, st + 0.08) : null;
    if (w) { var dn = n.vx * w.nx + n.vy * w.ny + n.vz * w.nz; n.vx = (n.vx - 2 * dn * w.nx) * 0.42; n.vy = (n.vy - 2 * dn * w.ny) * 0.42; n.vz = (n.vz - 2 * dn * w.nz) * 0.42; if (Math.abs(dn) > 2) SFX.click(0, 1500, 0.2); }
    else { q.x += n.vx * dt; q.y += n.vy * dt; q.z += n.vz * dt; }
    if (q.y < 0.08) { q.y = 0.08; if (n.vy < 0) n.vy = 0; n.vx *= 0.9; n.vz *= 0.9; }
    n.m.rotation.x += dt * 9; n.fuse -= dt;
    if (n.fuse <= 0) { n.on = false; n.m.visible = false; explodeAt(q.x, q.y + 0.3, q.z, 6.5, 170, P, 'グレネード'); }
  }
}
function clearProjectiles() { FX.rockets.forEach(function (r) { r.on = false; r.m.visible = false; }); FX.nades.forEach(function (n) { n.on = false; n.m.visible = false; }); }
function updateFX(dt) {
  var i, p = FX.pos, v = FX.vel;
  for (i = 0; i < FX.N; i++) {
    if (FX.life[i] <= 0) continue;
    FX.life[i] -= dt; if (FX.life[i] <= 0) { p[i * 3 + 1] = -999; continue; }
    v[i * 3 + 1] -= 13 * dt; p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
    if (p[i * 3 + 1] < 0.02) { p[i * 3 + 1] = 0.02; v[i * 3 + 1] *= -0.35; v[i * 3] *= 0.6; v[i * 3 + 2] *= 0.6; }
  }
  FX.points.geometry.attributes.position.needsUpdate = true;
  for (i = 0; i < FX.smokes.length; i++) { var s = FX.smokes[i]; if (s.life <= 0) continue; s.life -= dt; if (s.life <= 0) { s.s.visible = false; continue; }
    var k = s.life / s.max; s.s.material.opacity = Math.min(1, k * 1.6) * 0.55; s.s.position.x += s.vx * dt; s.s.position.y += s.vy * dt; s.s.position.z += s.vz * dt; s.s.scale.addScalar(s.grow * dt / s.max); }
  for (i = 0; i < FX.flashes.length; i++) { var f = FX.flashes[i]; if (f.life <= 0) continue; f.life -= dt; if (f.life <= 0) { f.s.visible = false; continue; }
    var kk = f.life / f.max; f.s.material.opacity = kk; f.s.scale.setScalar(f.size * (1.3 - kk * 0.6)); }
  for (i = 0; i < FX.tracers.length; i++) { var t = FX.tracers[i]; if (t.life <= 0) continue; t.life -= dt; if (t.life <= 0) t.m.visible = false; else t.m.material.opacity = t.life / 0.06 * 0.7; }
  for (i = 0; i < FX.bodies.length; i++) { var b = FX.bodies[i]; if (b.life <= 0) continue; b.life -= dt; if (b.life <= 0) { b.m.visible = false; continue; }
    b.vy -= 12 * dt; var m = b.m; m.position.x += b.vx * dt; m.position.y += b.vy * dt; m.position.z += b.vz * dt; m.rotation.x += b.rx * dt; m.rotation.z += b.rz * dt;
    var fl = b.shell ? 0.012 : 0.04; if (m.position.y < fl) { m.position.y = fl; if (b.vy < -1.2) { b.vy *= -0.4; b.vx *= 0.6; b.vz *= 0.6; b.rx *= 0.5; b.rz *= 0.5; } else { b.vy = 0; b.vx *= 0.8; b.vz *= 0.8; b.rx = b.rz = 0; } } }
  if (FX.boomT > 0) { FX.boomT -= dt; FX.boomLight.intensity = Math.max(0, FX.boomT / 0.25) * 6; }
}

function startReload() {
  var id = curId(); if (gun.reloadT > 0 || gun.swT > 0 || gun.ammo[id] >= WDEF[id].mag) return;
  gun.reloadT = gun.reloadMax = WDEF[id].reload; SFX.reload(WDEF[id].reload);
}
function switchWeapon(i) {
  i = ((i % gun.slots.length) + gun.slots.length) % gun.slots.length;
  if (i === gun.cur || gun.swT > 0) return;
  gun.swT = 0.3; gun.swTo = i; gun.reloadT = 0; SFX.click(0, 1700, 0.25);
}
function shoot() {
  var id = curId(), W = WDEF[id], M = gun.models[id];
  gun.ammo[id]--; gun.cool = W.rate; G.stats.shots++;
  var sp = (W.spread + gun.bloom + (P.speed > 5 ? 0.012 : P.speed > 1 ? 0.005 : 0)) * lerp(1, W.ads, gun.ads);
  camera.getWorldPosition(_v2); M.muzzle.getWorldPosition(_v3);
  var anyHit = false, mx = _v3.x, my = _v3.y, mz = _v3.z;
  if (W.rocket) {
    camera.getWorldDirection(_v1); launchRocket(_v2.x + _v1.x * 0.6, _v2.y + _v1.y * 0.6 - 0.08, _v2.z + _v1.z * 0.6, _v1.x, _v1.y, _v1.z);
    fxSmoke(_v2.x - _v1.x * 0.8, _v2.y, _v2.z - _v1.z * 0.8, 0.9, 0.7, 0xc8c2ba, 0.5);
  } else for (var pl = 0; pl < W.pellets; pl++) {
    camera.getWorldDirection(_v1);
    _v3.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(sp); _v1.add(_v3).normalize();
    if (Math.abs(_v1.x) < 1e-6) _v1.x = 1e-6; if (Math.abs(_v1.y) < 1e-6) _v1.y = 1e-6; if (Math.abs(_v1.z) < 1e-6) _v1.z = 1e-6;
    var w = rayWorld(_v2.x, _v2.y, _v2.z, _v1.x, _v1.y, _v1.z, 250), maxT = w ? w.t : 250;
    var eh = rayEnemies(_v2, _v1, maxT), endT = eh ? eh.t : maxT;
    var hx = _v2.x + _v1.x * endT, hy = _v2.y + _v1.y * endT, hz = _v2.z + _v1.z * endT;
    if (eh) {
      var fm = endT <= W.fall[0] ? 1 : endT >= W.fall[1] ? W.fall[2] : lerp(1, W.fall[2], (endT - W.fall[0]) / (W.fall[1] - W.fall[0]));
      anyHit = true; if (eh.crit) G.stats.heads++;
      damageActor(eh.e, W.dmg * fm * (eh.crit ? 2 : 1), P, W.name, eh.crit, hx, hy, hz);
      if (!eh.e.friend) fxSparks(hx, hy, hz, -_v1.x, 0.4, -_v1.z, eh.crit ? 12 : 7, 6);
    } else if (w) {
      fxSparks(hx, hy, hz, w.nx, w.ny, w.nz, W.pellets > 1 ? 3 : 6, 4.5); fxDecal(hx, hy, hz, w.nx, w.ny, w.nz);
      if (pl === 0 && (Q.tier > 0 || Math.random() < 0.4)) fxSmoke(hx + w.nx * 0.1, hy + w.ny * 0.1, hz + w.nz * 0.1, 0.25, 0.5, 0x9a9085, 0.4);
      if (pl === 0) SFX.impact(0, clamp(1 - endT / 40, 0.1, 1));
    }
    if (endT > 2.5 && pl < 4) { _v3.set(mx, my, mz); _v1.set(hx, hy, hz); fxTracer(_v3, _v1, gun.tracerColor); }
  }
  if (anyHit) G.stats.hits++;
  var aim = lerp(1, 0.7, gun.ads);
  gun.recPV += (W.recP + Math.random() * 0.12) * aim; gun.recYV += rnd(-W.recY, W.recY) * aim;
  gun.kz = Math.min(0.12, gun.kz + 0.04 + W.recP * 0.025); gun.kr = Math.min(0.2, gun.kr + 0.03 + W.recP * 0.035); gun.bloom = Math.min(W.bloomMax, gun.bloom + W.bloomAdd);
  gun.flashT = 0.045; gun.flash.visible = !(W.scope && gun.ads > 0.8); gun.flash.position.copy(M.muzzle.position); gun.flash.rotation.z = Math.random() * 6; gun.flash.scale.setScalar(rnd(0.75, 1.25) * (W.pellets > 1 || W.dmg > 80 ? 1.5 : 1)); gun.light.intensity = 5;
  if (!W.rocket && id !== 'magnum') { M.eject.getWorldPosition(_v3); camera.getWorldQuaternion(_q1); _v1.set(rnd(1.6, 2.6), rnd(1.4, 2.4), rnd(-0.3, 0.6)).applyQuaternion(_q1); fxBody(true, _v3.x, _v3.y, _v3.z, _v1.x + P.vx, _v1.y, _v1.z + P.vz); SFX.shell(); }
  SFX.shot(id); G.shake = Math.min(1.2, G.shake + 0.14 + W.recP * 0.16);
}
function updateWeapon(dt) {
  var id = curId(), W = WDEF[id], M = gun.models[id];
  gun.cool -= dt; if (gun.nadeCool > 0) gun.nadeCool -= dt;
  if (input.reload) { input.reload = false; if (G.state === 'playing') startReload(); }
  if (input.grenade) { input.grenade = false; if (G.state === 'playing') throwGrenade(); }
  if (input.switchTo != null) { var sw = input.switchTo; input.switchTo = null; if (P.hp > 0) switchWeapon(sw === 'next' ? gun.cur + 1 : sw === 'prev' ? gun.cur - 1 : sw); }
  var low = 0;
  if (gun.swT > 0) {
    var before = gun.swT; gun.swT -= dt;
    if (before > 0.15 && gun.swT <= 0.15) { M.g.visible = false; gun.cur = gun.swTo; id = curId(); W = WDEF[id]; M = gun.models[id]; M.g.visible = true; gun.bloom = 0; hudCache.am = null; }
    low = Math.sin(clamp(1 - Math.max(0, gun.swT) / 0.3, 0, 1) * Math.PI);
  } else if (gun.reloadT > 0) {
    gun.reloadT -= dt; if (gun.reloadT <= 0) { gun.ammo[id] = W.mag; gun.reloadT = 0; }
  } else if (input.fire && gun.cool <= 0 && G.state === 'playing' && P.hp > 0) {
    if (gun.ammo[id] > 0) shoot(); else { SFX.empty(); gun.cool = 0.3; startReload(); }
  }
  if (gun.ammo[id] === 0 && gun.reloadT <= 0 && gun.swT <= 0 && !input.fire) startReload();
  // aiming
  var wantAds = input.aim && gun.reloadT <= 0 && gun.swT <= 0 && P.hp > 0 && !(input.sprint && P.speed > 5.5) ? 1 : 0;
  gun.ads = damp(gun.ads, wantAds, 16, dt); if (Math.abs(gun.ads - wantAds) < 0.01) gun.ads = wantAds;
  var scoped = !!W.scope && gun.ads > 0.8;
  if (scoped !== gun.scoped) { gun.scoped = scoped; H.scope.style.display = scoped ? 'block' : 'none'; H.cross.style.display = scoped ? 'none' : ''; }
  var fov = lerp(G.baseFov, G.baseFov * W.zoom / 66, gun.ads); if (Math.abs(fov - camera.fov) > 0.02) { camera.fov = fov; camera.updateProjectionMatrix(); }
  // recoil springs
  gun.recP += gun.recPV * dt; gun.recY += gun.recYV * dt;
  gun.recPV = damp(gun.recPV, 0, 20, dt); gun.recYV = damp(gun.recYV, 0, 20, dt);
  gun.recP = damp(gun.recP, 0, input.fire && W.rate < 0.2 ? 2.5 : 7, dt); gun.recY = damp(gun.recY, 0, 5, dt);
  gun.recP = Math.min(gun.recP, 0.18);
  gun.kz = damp(gun.kz, 0, 16, dt); gun.kr = damp(gun.kr, 0, 14, dt); gun.bloom = damp(gun.bloom, 0, 4.5, dt);
  if (gun.flashT > 0) { gun.flashT -= dt; if (gun.flashT <= 0) { gun.flash.visible = false; gun.light.intensity = 0; } }
  // sway / bob / reload pose / aim pose
  gun.swayX = damp(gun.swayX, clamp(-P.lookDX * 1.6, -0.06, 0.06), 9, dt); gun.swayY = damp(gun.swayY, clamp(-P.lookDY * 1.6, -0.05, 0.05), 9, dt);
  var a = gun.ads, bobA = Math.min(1, P.speed / 4.6) * 0.012 * (1 - a * 0.8), r = gun.root, b = gun.base, sc = r.scale.x, off = GUNS[id].off || [0, 0, 0];
  var rl = 0, magD = 0;
  if (gun.reloadT > 0) { var k = 1 - gun.reloadT / gun.reloadMax; rl = Math.sin(Math.min(1, k * 1.15) * Math.PI); magD = (k > 0.08 && k < 0.5) ? Math.min(1, (k - 0.08) * 8) : (k >= 0.5 && k < 0.62 ? 1 - (k - 0.5) / 0.12 : 0); }
  if (M.mag) { M.mag.position.y = M.magY - magD * 0.22; M.mag.visible = !(magD > 0.98); }
  var bx = lerp(b.x + off[0] * sc, 0, a), by = lerp(b.y + off[1] * sc, -GUNS[id].sight * sc, a), bz = lerp(b.z + off[2] * sc, b.z + 0.03, a);
  r.position.set(bx + gun.swayX * 0.06 * (1 - a) + Math.cos(P.bob) * bobA * 0.6, by + gun.swayY * 0.06 * (1 - a) - Math.abs(Math.sin(P.bob)) * bobA - rl * 0.03 - low * 0.09 - P.landDip * 0.02, bz + gun.kz * 0.3);
  r.rotation.set(gun.kr * 0.5 * (1 - a * 0.5) - gun.swayY * 0.5 * (1 - a) + rl * 0.45 + low * 0.5, gun.swayX * 0.6 * (1 - a) + rl * 0.25, rl * -0.5 + gun.swayX * -0.4 * (1 - a));
  r.visible = !scoped;
}
