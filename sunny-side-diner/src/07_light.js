// ---- lighting rig. fixed light count (no shader recompiles); intensities animate ---
var LIGHT = { mood: 0, power: 1, neon: 1, flicker: 0 };
function spot(col, inten, dist, ang, pen, x, y, z, tx, ty, tz, shadow) {
  var s = new THREE.SpotLight(col, inten, dist, ang, pen, 2);
  s.position.set(x, y, z); s.target.position.set(tx, ty, tz);
  RENDER.scene.add(s); RENDER.scene.add(s.target);
  if (shadow) { s.castShadow = true; s.shadow.mapSize.set(Q.shadowSize, Q.shadowSize); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.02; s.shadow.radius = 4; s.shadow.camera.near = 0.3; s.shadow.camera.far = dist; }
  s.userData.base = inten; return s;
}
function point(col, inten, dist, x, y, z) { var p = new THREE.PointLight(col, inten, dist, 2); p.position.set(x, y, z); RENDER.scene.add(p); p.userData.base = inten; return p; }
function buildLights() {
  var L = WORLD.lights;
  L.hemi = new THREE.HemisphereLight(0xffe2c0, 0x6a3a28, 1.15); RENDER.scene.add(L.hemi); L.hemi.userData.base = 1.15;
  // ceiling bounce from the pendants (soft upward fill)
  L.bounce = point(0xffd2a0, 7, 14, 0.5, 1.5, 0.8);
  // warm pendant key lights (shadowed)
  L.counterA = spot(0xffc58a, 20, 9, 1.15, 0.9, -1.6, 3.05, -1.0, -1.6, 0, 0.2, true);
  L.counterB = spot(0xffc58a, 20, 9, 1.15, 0.9, 2.6, 3.05, -1.0, 2.6, 0, 0.2, true);
  L.booths = spot(0xffb27a, 30, 10, 1.25, 0.95, -0.4, 3.05, 3.6, -0.4, 0, 4.2, true);
  // kitchen fluorescent (cool)
  L.kitchen = spot(0xe8f2ff, 22, 8, 1.4, 0.85, 1.0, 3.0, -3.3, 0.6, 0, -4.0, false);
  // neon pink glow over the pass + reflected on the floor/counter
  L.neon = point(0xff3f9a, 5.5, 6.5, 1.5, 2.45, -2.3);
  // exterior: sign glow + lot light (cool)
  L.sign = point(0xff6fb0, 26, 26, -9.5, 8.2, 12.0);
  L.lot = spot(0xcfe0ff, 120, 30, 1.05, 0.75, 3.6, 6.4, 14, 1, 0, 11, false);
  // headlights (one moving spot, shadowed on HIGH)
  L.head = spot(0xfff1d6, 0, 45, 0.42, 0.5, 0, 0.8, 20, 0, 0.8, 0, Q.shadow > 1);
  // movable fill (follows stations that need it: freezer, back door, hallway)
  L.fill = point(0x9fc4ff, 0, 5, 6.6, 2.4, -4.0);
  // jukebox warm glow
  L.juke = point(0xff9a4a, 2.4, 3.5, -7.0, 1.2, 2.95);
  applyLightQuality();
}
function applyLightQuality() {
  var L = WORLD.lights; if (!L.counterA) return;
  var sh = Q.shadow > 0, low = Q === QUAL.LOW;
  [L.juke, L.bounce, L.sign, L.fill].forEach(function (l) { l.visible = !low; });
  [L.counterA, L.counterB, L.booths].forEach(function (s) { s.castShadow = sh; s.shadow.mapSize.set(Q.shadowSize, Q.shadowSize); if (s.shadow.map) { s.shadow.map.dispose(); s.shadow.map = null; } });
  RENDER.shadowDirty = true;
}
// mood: 0 = warm normal, 1 = anomaly (cold). power: 0 = blackout. neon: 0..1
var LSTATE = { cold: 0, coldT: 0, flick: 0, power: 1, powerT: 1, neonT: 1, neon: 1, lightsOn: true, neonOn: true, head: null };
function updateLights(dt, t) {
  var L = WORLD.lights; if (!L.hemi) return;
  LSTATE.cold = damp(LSTATE.cold, LSTATE.coldT, 1.6, dt);
  LSTATE.power = damp(LSTATE.power, LSTATE.lightsOn ? LSTATE.powerT : 0, 9, dt);
  LSTATE.neon = damp(LSTATE.neon, LSTATE.neonOn ? LSTATE.neonT : 0, 12, dt);
  var fl = 1;
  if (LSTATE.flick > 0) { LSTATE.flick = Math.max(0, LSTATE.flick - dt); fl = (Math.sin(t * 53) * Math.sin(t * 17.3) > -0.2 ? 1 : 0.15) * (0.7 + 0.3 * Math.random()); }
  var p = LSTATE.power * fl, c = LSTATE.cold;
  var warm = new THREE.Color(0xffc58a), cold = new THREE.Color(0xa9c8ff);
  [L.counterA, L.counterB, L.booths].forEach(function (s) { s.intensity = s.userData.base * p * (1 - c * 0.35); s.color.copy(warm).lerp(cold, c); });
  L.kitchen.intensity = L.kitchen.userData.base * (LSTATE.lightsOn ? LSTATE.powerT : 0) * (0.94 + 0.06 * Math.sin(t * 120)) * (LSTATE.kitchenFlick ? (Math.random() < 0.2 ? 0.1 : 1) : 1) * (LSTATE.kitchenOff ? 0 : 1);
  L.hemi.intensity = L.hemi.userData.base * (0.45 + 0.55 * p) * (1 + c * 0.3) * (LSTATE.kitchenOff ? 0.12 : 1);
  L.hemi.color.set(0xffe2c0).lerp(new THREE.Color(0x6080c0), c);
  L.bounce.intensity = L.bounce.userData.base * p * (1 - c * 0.5) * (LSTATE.kitchenOff ? 0.1 : 1);
  var nf = LSTATE.neon * (LSTATE.neonBuzz ? (Math.random() < 0.08 ? 0.2 : 1) : 1);
  L.neon.intensity = L.neon.userData.base * nf;
  if (WORLD.neonInMat) WORLD.neonInMat.color.setScalar(2.6 * nf + 0.02);
  if (WORLD.neonEyesMat) WORLD.neonEyesMat.color.setScalar(2.6 * nf * (LSTATE.eyesExtra || 1) + 0.02);
  L.sign.intensity = L.sign.userData.base * nf;
  if (WORLD.exSignMat) WORLD.exSignMat.color.setScalar(2.3 * nf + 0.05);
  if (WORLD.exSunnyMat) WORLD.exSunnyMat.color.setScalar(1.6 * nf + 0.08);
  L.juke.intensity = L.juke.userData.base * (0.8 + 0.2 * Math.sin(t * 2.0)) * (LSTATE.jukeOff ? 0.1 : 1) * (0.4 + 0.6 * p);
  if (WORLD.jukeFaceMat) WORLD.jukeFaceMat.color.setRGB(1.9, 1.6, 1.4).multiplyScalar((LSTATE.jukeOff ? 0.15 : 1) * (0.55 + 0.45 * p));
  if (WORLD.jukePillar) WORLD.jukePillar.color.setRGB(3.0, 1.2, 0.5).multiplyScalar((LSTATE.jukeOff ? 0.05 : 1) * (0.9 + 0.1 * Math.sin(t * 3)));
  WORLD.pendants.forEach(function (b, i) { b.material = p > 0.2 && !b.userData.off ? M.bulb : M.bulbOff; });
  M.bulb.color.setRGB(6 * p, 4.2 * p, 2.4 * p).lerp(new THREE.Color(3 * p, 3.6 * p, 4.4 * p), c);
  M.fluor.color.setRGB(4.2, 4.6, 4.8).multiplyScalar(LSTATE.lightsOn && !LSTATE.kitchenOff ? LSTATE.powerT : 0.02);
  if (WORLD.doorSign) WORLD.doorSign.material.color.setScalar(LSTATE.neonOn ? 1 : 0.25);
}
