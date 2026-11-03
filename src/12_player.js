// ---- player controller ------------------------------------------------------
var PL = null;
var NOISES = []; // {li,x,z,r,t,src}
function emitNoise(li, x, z, r, src) { NOISES.push({ li: li, x: x, z: z, r: r, t: 0, src: src || 'misc' }); }

function newPlayer(li, x, z, yaw) {
  PL = {
    li: li, x: x, z: z, y: floorY(li, x, z), yaw: yaw || 0, pitch: 0, vx: 0, vz: 0,
    eye: 1.6, crouch: false, stamina: 1, battery: 100, flash: false, flashDead: 0,
    hidden: null, seated: null, breath: false, breathT: 0, breathCD: 0, coughT: 0,
    bob: 0, stepDist: 0, speed: 0, noise: 0, alive: true, lookTarget: null, inv: [], sel: 0,
    bandaid: 0, invuln: 0, lastSafe: { li: li, x: x, z: z }, shake: 0, fear: 0, hearts: 0, moving: false, running: false, exhausted: false
  };
  return PL;
}
var PR = 0.27; // player radius
function blockedAt(li, x, z, mode) {
  // test the circle against grid cells
  var r = PR;
  for (var k = 0; k < 8; k++) {
    var a = k / 8 * TAU, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    if (!passable(li, m2c(px), m2r(pz), mode || 'p')) return { cx: m2c(px), cz: m2r(pz) };
  }
  if (!passable(li, m2c(x), m2r(z), mode || 'p')) return { cx: m2c(x), cz: m2r(z) };
  return null;
}
function doorAtCell(li, cx, cz) { if (!inGrid(cx, cz)) return null; var d = MAP.lv[li].door[cidx(cx, cz)]; return d >= 0 ? MAP.doors[d] : null; }

function updatePlayer(dt) {
  var P = PL;
  if (!P.alive) return;
  var sens = SAVE.settings.sens || 1;
  var lookScale = INPUT.pointerLocked ? 0.0022 : 0.0042;
  P.yaw -= INPUT.lookDX * lookScale * sens;
  P.pitch -= INPUT.lookDY * lookScale * sens * (SAVE.settings.invertY ? -1 : 1);
  INPUT.lookDX = 0; INPUT.lookDY = 0;
  var pmax = P.hidden ? 0.5 : 1.35;
  P.pitch = clamp(P.pitch, -pmax, pmax);
  if (P.hidden) {
    var h = P.hidden;
    var dy = angDiff(h.rot, P.yaw); var lim = h.type === 'locker' || h.type === 'stall' ? 0.55 : 0.9;
    if (Math.abs(dy) > lim) P.yaw = h.rot + clamp(dy, -lim, lim);
  }
  var mv = readMove();
  P.breath = mv.breath && (P.hidden || P.seated || true) && P.breathCD <= 0;
  updateBreath(dt, P);
  if (P.hidden || P.seated) { P.speed = 0; P.moving = false; P.running = false; updateFlashBattery(dt); return; }
  if (consume('crouch')) P.crouch = !P.crouch;
  var crouch = P.crouch || INPUT.keys['control'];
  var wantRun = mv.run && !crouch && P.stamina > 0.05 && !P.exhausted && mv.mag > 0.5;
  var spd = crouch ? 1.15 : (wantRun ? 4.4 : 2.2);
  if (P.limp) spd *= 0.75;
  var fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
  var tx = (rx * mv.x - fx * mv.z) * spd, tz = (rz * mv.x - fz * mv.z) * spd;
  var acc = 1 - Math.exp(-dt * (mv.mag > 0.05 ? 12 : 9));
  P.vx += (tx - P.vx) * acc; P.vz += (tz - P.vz) * acc;
  P.running = wantRun && mv.mag > 0.5;
  if (P.running) P.stamina = Math.max(0, P.stamina - dt * 0.14);
  else P.stamina = Math.min(1, P.stamina + dt * (crouch ? 0.13 : (mv.mag > 0.1 ? 0.08 : 0.16)));
  if (P.stamina <= 0.01) P.exhausted = true; if (P.exhausted && P.stamina > 0.35) P.exhausted = false;
  // move with collision (axis separated)
  var nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
  var hitX = blockedAt(P.li, nx, P.z), hitZ = null;
  if (!hitX) P.x = nx; else { touchCell(P.li, hitX.cx, hitX.cz); P.vx *= 0.2; }
  hitZ = blockedAt(P.li, P.x, nz);
  if (!hitZ) P.z = nz; else { touchCell(P.li, hitZ.cx, hitZ.cz); P.vz *= 0.2; }
  var li2 = resolveLevel(P.li, P.x, P.z);
  if (li2 !== P.li) P.li = li2;
  var fy = floorY(P.li, P.x, P.z);
  P.y = damp(P.y, fy, 18, dt);
  var sp = Math.sqrt(P.vx * P.vx + P.vz * P.vz);
  P.speed = sp; P.moving = sp > 0.3;
  P.eye = damp(P.eye, crouch ? 0.95 : 1.6, 10, dt);
  // footsteps + noise
  P.bob += sp * dt * (P.running ? 1.55 : 1.9);
  P.stepDist += sp * dt;
  var stride = P.running ? 0.85 : (crouch ? 0.6 : 0.72);
  if (P.stepDist > stride) {
    P.stepDist = 0;
    var mat = MAP.lv[P.li].mat[cidx(m2c(P.x), m2r(P.z))];
    if (cellAt(P.li, P.x, P.z) === T_STAIR) mat = M_CONCRETE;
    var loud = P.running ? 1 : (crouch ? 0.18 : 0.45);
    if (typeof sfxStep === 'function') sfxStep(mat, loud, null);
    emitNoise(P.li, P.x, P.z, P.running ? 12 : (crouch ? 1.5 : 5), 'player');
  }
  P.noise = P.running ? 1 : (P.moving ? (crouch ? 0.12 : 0.4) : 0);
  var cell = cellType(P.li, m2c(P.x), m2r(P.z));
  if (cell !== T_STAIR) P.lastSafe = { li: P.li, x: P.x, z: P.z };
  updateFlashBattery(dt);
}
function updateFlashBattery(dt) {
  var P = PL;
  if (P.flashDead > 0) P.flashDead -= dt;
  if (P.flash) { P.battery = Math.max(0, P.battery - dt * 1.05); if (P.battery <= 0) { P.flash = false; if (typeof sfx === 'function') sfx('click'); showToast('BATTERY DEAD', '電池切れ'); } }
}
function updateBreath(dt, P) {
  if (P.breathCD > 0) P.breathCD -= dt;
  if (P.breath) {
    P.breathT += dt;
    if (P.breathT > 7.5) { // cough!
      P.breath = false; P.breathT = 0; P.breathCD = 3; P.coughT = 1.2;
      if (typeof sfx === 'function') sfx('cough');
      emitNoise(P.li, P.x, P.z, 9, 'cough');
      showToast('*COUGH*', '息が続かない！');
    }
  } else P.breathT = Math.max(0, P.breathT - dt * 2);
}
function toggleFlash() {
  var P = PL;
  if (P.flashDead > 0) { sfx('click'); return; }
  if (P.battery <= 0) { sfx('click'); showToast('NO BATTERY', '電池がない'); return; }
  P.flash = !P.flash; sfx('click');
  emitNoise(P.li, P.x, P.z, 1.5, 'click');
}
// bump into a door: open if unlocked
function touchCell(li, cx, cz) {
  var d = doorAtCell(li, cx, cz);
  if (!d) return;
  if (d.locked) {
    if (!d._rattle || now() - d._rattle > 1.2) { d._rattle = now(); sfx('rattle', { li: d.li, x: d.x, z: d.z }); showToast('LOCKED', 'カギがかかっている' + (hasItem('hallpass') ? '（ホールパスで開けられる）' : '')); emitNoise(li, d.x, d.z, 4, 'door'); }
    return;
  }
}
// called every frame for agents: push doors open when walking through
function updateDoors(dt, agents) {
  for (var i = 0; i < MAP.doors.length; i++) {
    var d = MAP.doors[i];
    if (!d.group) continue;
    if (!d.locked) {
      for (var k = 0; k < agents.length; k++) {
        var a = agents[k]; if (!a || a.li !== d.li) continue;
        var dd = dist2(a.x, a.z, d.x, d.z);
        if (dd < 1.6 * 1.6 && d.open < 1) { d.open = 1; if (d.anim < 0.2) { d.openDir = (d.axis === 'z' ? (a.z > d.z ? 1 : -1) : (a.x > d.x ? -1 : 1)); sfx(d.kind === 'double' ? 'doorBang' : 'door', { li: d.li, x: d.x, z: d.z }); emitNoise(d.li, d.x, d.z, 6, 'door'); } }
      }
    }
    var target = d.open;
    if (Math.abs(d.anim - target) > 0.001) { d.anim = damp(d.anim, target, d.anim < target ? 7 : 2, dt); applyDoorPose(d); }
  }
}
// treat doors with anim>0.5 as open for LOS
