(function (CFG) {
  var T = THREE;
  GAME.mode = 'cut';
  if (window.__IC) { window.__IC.objs.forEach(function (o) { RENDER.scene.remove(o); }); }
  var objs = [];
  // food on the counter, close to the lens
  var top = 1.05;
  CFG.dishes.forEach(function (d) { var m = dishMesh(d[0]); m.position.set(d[1], top, d[2]); m.rotation.y = d[3]; RENDER.scene.add(m); objs.push(m); });
  // the guest in Booth 4. head turned all the way to you.
  var s = { pos: new T.Vector3(CFG.fig[0], CFG.fig[1], CFG.fig[2]) };
  var P = personFrom(ARCH[CFG.arch]); P.odd = 1; P.lookAtCam = true; P.eyeStare = true;
  P.root.position.copy(s.pos); P.root.rotation.y = 0; setPose(P, CFG.pose || 'stand'); RENDER.scene.add(P.root); objs.push(P.root);
  attachHorror(P, CFG.face); revealHorror(P, 1);
  if (!window.__ICP) { window.__ICP = 1; onFrame(function (dt) { if (window.__IC && window.__IC.P) updatePerson(window.__IC.P, dt, RENDER.camera.position); }); }
  // a cup knocked over, a dark trail across the counter
  var spill = new T.Mesh(new T.CircleGeometry(0.16, 24), new T.MeshPhysicalMaterial({ color: 0x3a0306, roughness: 0.05, clearcoat: 1 })); spill.rotation.x = -Math.PI / 2; spill.scale.set(1.6, 0.7, 1); spill.position.set(CFG.spill[0], top + 0.003, CFG.spill[1]); RENDER.scene.add(spill); objs.push(spill);
  // lights: only the booth-4 end stays lit, everything goes cold
  LSTATE.coldT = 1; LSTATE.powerT = CFG.power; LSTATE.kitchenOff = !!CFG.kdark; FX.rainT = 0.9;
  WORLD.pendants.forEach(function (b) { var wp = new T.Vector3(); b.getWorldPosition(wp); b.userData.off = true; });
  var spot = new T.SpotLight(0xc8d8ff, CFG.spot, 7, 0.5, 0.7, 2); spot.position.set(s.pos.x + 0.4, 2.7, s.pos.z + 0.3); spot.target.position.set(s.pos.x, 1.5, s.pos.z); RENDER.scene.add(spot); RENDER.scene.add(spot.target); objs.push(spot, spot.target);
  var red = new T.PointLight(0xff2030, CFG.red, 3.5, 2); red.position.set(CFG.redp[0], CFG.redp[1], CFG.redp[2]); RENDER.scene.add(red); objs.push(red);
  LSTATE.neonOn = false; GAME.neonOff = true;
  var cam = new T.Vector3(CFG.cam[0], CFG.cam[1], CFG.cam[2]), tgt = new T.Vector3(CFG.tgt[0], CFG.tgt[1], CFG.tgt[2]);
  CAM.override = { pos: cam, target: tgt, k: 1, dur: 0.01 };
  CAM.focusLock = cam.distanceTo(new T.Vector3(s.pos.x, 1.6, s.pos.z)); PU.uFocus.value = CAM.focusLock; PU.uDof.value = CFG.dof; PU.uFocusRange.value = 1.2; PU.uBloom.value = 0.8; PU.uExposure.value = CFG.expo;
  window.__IC = { objs: objs, P: P };
  return 1;
})
