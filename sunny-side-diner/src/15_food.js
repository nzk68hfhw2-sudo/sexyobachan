// ---- food: plates and dishes (glossy, browned, steaming) ---------------------------
var MENU = {
  pancakes: { en: 'Pancakes', ja: 'パンケーキ', price: 2.95, mini: 'pancake', icon: 'cook' },
  eggs: { en: 'Sunny Side Eggs', ja: '目玉焼き', price: 1.95, mini: 'egg', icon: 'cook' },
  burger: { en: 'Cheeseburger', ja: 'チーズバーガー', price: 3.45, mini: 'burger', icon: 'cook' },
  coffee: { en: 'Coffee', ja: 'コーヒー', price: 0.5, mini: 'coffee', icon: 'coffee' },
  pie: { en: 'Cherry Pie', ja: 'チェリーパイ', price: 1.75, mini: 'pie', icon: 'pie' },
  shake: { en: 'Milkshake', ja: 'ミルクシェイク', price: 1.95, mini: 'shake', icon: 'coffee' }
};
var ODD_ITEMS = [
  { en: 'Something warm', ja: '「なにか、あたたかいもの」', say: "Something warm. Still warm, please.", sayJa: 'なにか、あたたかいもの。まだあたたかいのを。' },
  { en: 'A glass of sand', ja: '「砂をグラスで」', say: "A glass of sand. From outside.", sayJa: '砂を、グラスで。外のやつを。' },
  { en: 'Your name, sunny side up', ja: '「あなたの名前を、目玉焼きで」', say: "Your name. Sunny side up.", sayJa: 'あなたの名前を。目玉焼きにして。' },
  { en: 'The last customer', ja: '「さっきのお客さん」', say: "I'll have... the last customer. Rare.", sayJa: 'さっきのお客さんを。レアで。' },
  { en: 'Teeth (a dozen)', ja: '「歯を、1ダース」', say: "A dozen teeth. Sunny side up.", sayJa: '歯を1ダース。目玉焼きで。' }
];
var FM = null;
function foodMats() {
  if (FM) return FM;
  var pc = mkCanvas(256, 256), g = pc.getContext('2d'), gr = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  gr.addColorStop(0, '#b8742e'); gr.addColorStop(0.7, '#9a5a20'); gr.addColorStop(0.92, '#d8a860'); gr.addColorStop(1, '#e8c48a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (var i = 0; i < 400; i++) { g.fillStyle = 'rgba(70,30,5,' + Math.random() * 0.25 + ')'; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, Math.random() * 3, 0, TAU); g.fill(); }
  var pat = mkCanvas(256, 256), pg = pat.getContext('2d'); pg.fillStyle = '#4a2a16'; pg.fillRect(0, 0, 256, 256); for (var k = 0; k < 900; k++) { pg.fillStyle = Math.random() < 0.5 ? 'rgba(20,8,2,0.5)' : 'rgba(140,80,40,0.35)'; pg.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
  var bun = mkCanvas(256, 256), bg = bun.getContext('2d'); var bgr = bg.createRadialGradient(128, 100, 10, 128, 128, 140); bgr.addColorStop(0, '#e0a050'); bgr.addColorStop(1, '#a05a1a'); bg.fillStyle = bgr; bg.fillRect(0, 0, 256, 256); for (var s = 0; s < 60; s++) { bg.fillStyle = '#f6ead0'; bg.beginPath(); bg.ellipse(Math.random() * 256, Math.random() * 200, 4, 2, Math.random() * 3, 0, TAU); bg.fill(); }
  FM = {
    plate: stdMat({ color: 0xf6f2ea, roughness: 0.12, envMapIntensity: 1.1 }), rim: stdMat({ color: 0xb02026, roughness: 0.2 }),
    cake: stdMat({ map: toTex(pc, { clamp: true }), roughness: 0.55 }), cakeSide: stdMat({ color: 0xe2b874, roughness: 0.7 }),
    butter: stdMat({ color: 0xffe9a0, roughness: 0.3 }), syrup: stdMat({ color: 0x6a2a06, roughness: 0.03, transparent: true, opacity: 0.85, envMapIntensity: 1.6 }),
    white: stdMat({ color: 0xfbf8f0, roughness: 0.25, envMapIntensity: 1.0 }), yolk: stdMat({ color: 0xff9a10, roughness: 0.08, envMapIntensity: 1.4, emissive: 0x401800, emissiveIntensity: 0.4 }),
    patty: stdMat({ map: toTex(pat), roughness: 0.6 }), bun: stdMat({ map: toTex(bun), roughness: 0.55 }), bunIn: stdMat({ color: 0xead9b0, roughness: 0.9 }),
    cheese: stdMat({ color: 0xffb21c, roughness: 0.3, emissive: 0x402000, emissiveIntensity: 0.2 }), lettuce: stdMat({ color: 0x5aa03a, roughness: 0.5, side: THREE.DoubleSide }), tomato: stdMat({ color: 0xc8202a, roughness: 0.25 }),
    shake: stdMat({ color: 0xf6b6c8, roughness: 0.6 }), cream: stdMat({ color: 0xfffaf2, roughness: 0.7 }), cherry: stdMat({ color: 0xb00016, roughness: 0.05, envMapIntensity: 1.5 }),
    straw: stdMat({ color: 0xd8282e, roughness: 0.3 }), glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.22, envMapIntensity: 1.5, depthWrite: false }),
    raw: stdMat({ color: 0x8a1018, roughness: 0.15, envMapIntensity: 1.2 }), sand: stdMat({ color: 0xc8a878, roughness: 1 })
  };
  return FM;
}
function plateMesh() {
  var f = foodMats(), g = new THREE.Group();
  mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.07, 0), new THREE.Vector2(0.09, 0.006), new THREE.Vector2(0.125, 0.016), new THREE.Vector2(0.128, 0.02), new THREE.Vector2(0.118, 0.018), new THREE.Vector2(0.08, 0.008), new THREE.Vector2(0, 0.008)], 32), f.plate, 0, 0, 0, g);
  var rim = mesh(new THREE.TorusGeometry(0.118, 0.0025, 4, 40), f.rim, 0, 0.018, 0, g); rim.rotation.x = PI / 2;
  return g;
}
function eggWhiteGeo(seed) {
  var rnd = makeRNG(seed || 3), s = new THREE.Shape(), n = 18;
  for (var i = 0; i <= n; i++) { var a = i / n * TAU, r = 0.07 * (0.85 + rnd() * 0.3); var x = Math.cos(a) * r * 1.1, y = Math.sin(a) * r; if (i === 0) s.moveTo(x, y); else s.lineTo(x, y); }
  var g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4 }); g.rotateX(-PI / 2); return g;
}
function dishMesh(id, opt) {
  var f = foodMats(), g = new THREE.Group(); opt = opt || {};
  if (id !== 'coffee' && id !== 'shake') { var pl = plateMesh(); g.add(pl); }
  if (id === 'pancakes') {
    for (var i = 0; i < 3; i++) { var c = mesh(new THREE.CylinderGeometry(0.075 - i * 0.002, 0.077, 0.016, 28), [f.cakeSide, f.cake, f.cake], 0, 0.026 + i * 0.017, 0, g); c.rotation.y = i; }
    mesh(new THREE.BoxGeometry(0.03, 0.012, 0.025), f.butter, 0, 0.083, 0, g).rotation.y = 0.4;
    var sy = mesh(new THREE.CylinderGeometry(0.06, 0.068, 0.004, 24), f.syrup, 0.005, 0.078, 0, g);
    for (var d = 0; d < 5; d++) { var a = d * 1.3; var dr = mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.03, 6), f.syrup, Math.cos(a) * 0.072, 0.06, Math.sin(a) * 0.072, g); }
  } else if (id === 'eggs') {
    [-0.045, 0.045].forEach(function (x, i) { mesh(eggWhiteGeo(i + 4), f.white, x, 0.02, 0, g); var y = mesh(new THREE.SphereGeometry(0.024, 16, 10, 0, TAU, 0, PI / 2), f.yolk, x + 0.005, 0.026, 0.004, g); y.scale.y = 0.75; });
    var toast = mesh(new THREE.BoxGeometry(0.08, 0.012, 0.08), f.cakeSide, 0, 0.026, 0.07, g); toast.rotation.y = 0.5;
  } else if (id === 'burger') {
    var b = new THREE.Group(); g.add(b); b.position.y = 0.02;
    mesh(new THREE.CylinderGeometry(0.058, 0.055, 0.022, 24), [f.bun, f.bunIn, f.bun], 0, 0.011, 0, b);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 24), f.patty, 0, 0.032, 0, b);
    var ch = mesh(new THREE.BoxGeometry(0.11, 0.004, 0.11, 6, 1, 6), f.cheese, 0, 0.044, 0, b); droop(ch.geometry, 0.04, 0.012); ch.rotation.y = 0.6;
    var le = mesh(new THREE.CircleGeometry(0.068, 18), f.lettuce, 0, 0.049, 0, b); le.rotation.x = -PI / 2; wavy(le.geometry);
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 18), f.tomato, 0.01, 0.055, 0, b);
    var top = mesh(new THREE.SphereGeometry(0.06, 24, 12, 0, TAU, 0, PI / 2), f.bun, 0, 0.06, 0, b); top.scale.y = 0.62;
    var fries = new THREE.Group(); g.add(fries); for (var k = 0; k < 9; k++) { var fr = mesh(new THREE.BoxGeometry(0.008, 0.008, 0.06), f.cheese, 0.07 + Math.random() * 0.03, 0.026 + k * 0.004, -0.03 + Math.random() * 0.06, fries); fr.rotation.y = Math.random() * 3; fr.material = f.cakeSide; }
  } else if (id === 'coffee') {
    var cup = makeCup(true); g.add(cup); g.userData.coffee = cup.userData.coffee;
  } else if (id === 'pie') {
    var sl = new THREE.Group(); g.add(sl); sl.position.y = 0.02;
    makePie(0); var sm = mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.045, 12, 1, false, 0, TAU / 8), [PIE_MAT.crust, PIE_MAT.top, PIE_MAT.crust], -0.05, 0.022, -0.05, sl);
    [0, TAU / 8].forEach(function (a) { var p = mesh(new THREE.PlaneGeometry(0.15, 0.045), PIE_MAT.fill, -0.05 + Math.sin(a) * 0.075, 0.022, -0.05 + Math.cos(a) * 0.075, sl, false); p.rotation.y = a + PI / 2; p.material.side = THREE.DoubleSide; });
  } else if (id === 'shake') {
    var gl = mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.03, 0), new THREE.Vector2(0.03, 0.01), new THREE.Vector2(0.008, 0.02), new THREE.Vector2(0.008, 0.06), new THREE.Vector2(0.03, 0.08), new THREE.Vector2(0.045, 0.19), new THREE.Vector2(0.044, 0.19), new THREE.Vector2(0.029, 0.08), new THREE.Vector2(0.006, 0.062)], 24), f.glass, 0, 0, 0, g, false); gl.renderOrder = 4;
    mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0.065), new THREE.Vector2(0.026, 0.08), new THREE.Vector2(0.04, 0.17), new THREE.Vector2(0, 0.17)], 20), f.shake, 0, 0, 0, g);
    for (var w = 0; w < 4; w++) mesh(new THREE.SphereGeometry(0.03 - w * 0.006, 12, 8), f.cream, 0, 0.18 + w * 0.016, 0, g);
    mesh(new THREE.SphereGeometry(0.011, 12, 8), f.cherry, 0, 0.245, 0, g);
    var st = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 8), f.straw, 0.015, 0.25, 0, g); st.rotation.z = -0.2;
  } else if (id === 'odd') {
    var r = mesh(new THREE.SphereGeometry(0.05, 14, 10), f.raw, 0, 0.05, 0, g); r.scale.set(1.3, 0.6, 1); wavy(r.geometry, 0.01);
  }
  if (opt.steam && (id === 'coffee' || id === 'pancakes' || id === 'eggs')) g.userData.steam = 1;
  return g;
}
function droop(geo, edge, amt) { var p = geo.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), z = p.getZ(i), r = Math.max(Math.abs(x), Math.abs(z)); if (r > edge) p.setY(i, p.getY(i) - (r - edge) * (r - edge) / 0.0004 * amt); } geo.computeVertexNormals(); }
function wavy(geo, a) { var p = geo.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y); p.setZ(i, p.getZ(i) + Math.sin(Math.atan2(y, x) * 9) * (a || 0.006) * (r / 0.068)); } geo.computeVertexNormals(); }
