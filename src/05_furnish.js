// ---- room furnishing: props, chairs, hide spots, lights, windows, posters ---
function furnishAll(M, rnd) {
  M.win = [new Uint8Array(NX * NZ), new Uint8Array(NX * NZ), new Uint8Array(NX * NZ)];
  var prop = M.prop, block = M.block;
  function addChair(r, x, z, rot, kind, lesson) {
    var c = { id: M.chairs.length, li: r.li, x: x, z: z, rot: rot, room: r.id, kind: kind || 'chair', occ: -1, avail: true, lesson: lesson !== false };
    M.chairs.push(c); r.chairs.push(c); return c;
  }
  function addHide(r, type, x, z, rot, ex, ez, y, li) {
    var h = { id: M.hides.length, type: type, li: li != null ? li : r.li, x: x, z: z, rot: rot, ex: ex, ez: ez, y: y, room: r ? r.id : -1 };
    M.hides.push(h); if (r) r.hides.push(h);
    var L = M.lv[h.li], cx = m2c(x), cz = m2r(z); if (inGrid(cx, cz)) L.hide[cidx(cx, cz)] = h.id;
    return h;
  }
  function light(li, x, y, z, room, opt) { opt = opt || {}; var l = { li: li, x: x, y: y, z: z, room: room, int: opt.int || 1, r: opt.r || 7.5, col: opt.col || [1, 1, 0.93], kind: opt.kind || 'tube', broken: false, g: M.lights.length % 8, rot: opt.rot || 0 }; M.lights.push(l); return l; }
  function dlight(li, x, y, z, col, r, opt) { opt = opt || {}; var l = { li: li, x: x, y: y, z: z, col: col, r: r, nx: opt.nx || 0, nz: opt.nz || 0, int: opt.int || 1, kind: opt.kind || '' }; M.dlights.push(l); return l; }
  function poster(li, x, y, z, rot, kind, w, h, o) { var p = { li: li, x: x, y: y, z: z, rot: rot, kind: kind, w: w || 0.6, h: h || 0.85 }; if (o) for (var k in o) p[k] = o[k]; M.posters.push(p); return p; }
  function item(li, x, z, room) { M.itemSpots.push({ li: li, x: x, z: z, room: room }); }
  function windowsAlong(li, x0, x1, zWall, inward, room, strength) {
    var L = M.win[li];
    for (var x = x0 + 0.5; x + 1.5 <= x1 - 0.25; x += 2) {
      for (var k = 0; k < 3; k++) { var cx = m2c(x + k * 0.5 + 0.25), cz = m2r(zWall + 0.25); if (inGrid(cx, cz) && M.lv[li].type[cidx(cx, cz)] === T_WALL) L[cidx(cx, cz)] = 1; }
      M.windows.push({ li: li, x: x + 0.75, z: zWall + 0.25, nx: 0, nz: inward, room: room });
      dlight(li, x + 0.75, LV_Y[li] + 1.7, zWall + 0.25 + inward * 0.6, [0.36, 0.48, 0.78], 7.5, { nz: inward, int: strength * 0.55, kind: 'moon' });
    }
  }
  function windowsAlongZ(li, z0, z1, xWall, inward, room, strength) {
    var L = M.win[li];
    for (var z = z0 + 0.5; z + 1.5 <= z1 - 0.25; z += 2) {
      for (var k = 0; k < 3; k++) { var cx = m2c(xWall + 0.25), cz = m2r(z + k * 0.5 + 0.25); if (inGrid(cx, cz) && M.lv[li].type[cidx(cx, cz)] === T_WALL) L[cidx(cx, cz)] = 1; }
      M.windows.push({ li: li, x: xWall + 0.25, z: z + 0.75, nx: inward, nz: 0, room: room });
      dlight(li, xWall + 0.25 + inward * 0.6, LV_Y[li] + 1.7, z + 0.75, [0.36, 0.48, 0.78], 7.5, { nx: inward, int: strength * 0.55, kind: 'moon' });
    }
  }
  function ceilingGrid(r, nx, nz, opt) {
    var y = LV_Y[r.li] + r.ceil - 0.02;
    for (var i = 0; i < nx; i++) for (var j = 0; j < nz; j++) {
      var x = r.x0 + (r.x1 - r.x0) * (i + 0.5) / nx, z = r.z0 + (r.z1 - r.z0) * (j + 0.5) / nz;
      light(r.li, x, y, z, r.id, opt);
    }
  }
  function exitSign(li, x, z, rot) {
    M.signs.push({ kind: 'exit', li: li, x: x, y: LV_Y[li] + 2.75, z: z, rot: rot });
    dlight(li, x + Math.sin(rot) * 0.4, LV_Y[li] + 2.5, z + Math.cos(rot) * 0.4, [1.0, 0.12, 0.08], 4.2, { int: 1.1, kind: 'exit' });
  }

  // --- outside ---
  var out = M.outside;
  for (var i = 0; i < 70; i++) {
    var tx = rnd.range(-19, 83), tz = rnd.range(-16.5, -2);
    if (tx > 6 && tx < 54 && tz > -15.5) continue;
    if (tx > 58 && tz > -4) continue;
    prop('tree', 1, tx, tz, rnd() * TAU, { s: rnd.range(0.8, 1.4) });
    block(1, tx - 0.3, tz - 0.3, tx + 0.3, tz + 0.3, 1);
  }
  prop('flagpole', 1, 22, -2.5, 0); block(1, 21.8, -2.7, 22.2, -2.3, 1);
  prop('schoolsign', 1, 40, -3.2, 0); block(1, 38.5, -3.5, 41.5, -3, 1);
  [[14, -8], [46, -8], [30, -15], [5, -5], [55, -5]].forEach(function (p) {
    prop('lamppost', 1, p[0], p[1], 0); block(1, p[0] - 0.2, p[1] - 0.2, p[0] + 0.2, p[1] + 0.2, 1);
    dlight(1, p[0], 5.5, p[1], [1.0, 0.55, 0.22], 11, { int: 1.2, kind: 'sodium' });
    light(1, p[0], 5.5, p[1], out.id, { col: [1.0, 0.6, 0.3], r: 11, int: 1.0, kind: 'none' });
  });
  prop('fence', 1, 0, 0, 0);
  prop('busbody', 1, 30.5, -11, 0);
  // bus seats: 10 rows x 2, facing +x? the bus faces west: driver at x=35 front -> seats face +x (toward front)
  var bus = M.busRoom;
  for (var row = 0; row < 9; row++) {
    var sx = 26.0 + row * 1.0;
    addChair(bus, sx, -11.75, PI / 2, 'busseat');
    addChair(bus, sx, -10.25, PI / 2, 'busseat');
  }
  light(1, 30.5, 2.2, -11, bus.id, { col: [1, 0.95, 0.8], r: 6, int: 0.8, kind: 'none' });
  dlight(1, 30.5, 2.0, -11, [0.9, 0.8, 0.55], 5, { int: 0.45, kind: 'bus' });

  // --- corridors ---
  [M.corrG, M.corrU].forEach(function (r) {
    var li = r.li;
    for (var x = 2; x < 59; x += 3) light(li, x, LV_Y[li] + 3.18, 11.25, r.id, { r: 7.5, int: 1.05 });
    // lockers along both walls (skip near doors/openings)
    [[9.5, 0], [12.5, PI]].forEach(function (side) {
      var zc = side[0], rot = side[1];
      var wallz = rot === 0 ? 9.25 : 13.25;
      for (var cx = m2c(1); cx <= m2c(59); cx++) {
        var x = c2x(cx);
        var wc = cidx(cx, m2r(wallz)), cc = cidx(cx, m2r(zc + 0.25));
        var L = M.lv[li];
        if (L.type[wc] !== T_WALL || L.type[cc] !== T_FLOOR) continue;
        if (L.type[cidx(cx - 1, m2r(wallz))] !== T_WALL || L.type[cidx(cx + 1, m2r(wallz))] !== T_WALL) continue;
        if ((x > 22 && x < 24 && li === 1 && rot === 0) || (Math.abs(x - 36.5) < 1.2 && li === 1 && rot === PI)) continue; // trophy case / fountain gaps
        var hideable = rnd() < 0.22;
        var pz = zc + 0.25;
        prop('locker', li, x, pz, rot, { v: hideable ? 2 : rnd.pick([0, 1, 3, 0, 1]), hide: hideable });
        L.type[cc] = T_BLOCK;
        if (hideable) addHide(r, 'locker', x, pz, rot, x, pz + (rot === 0 ? 0.6 : -0.6), LV_Y[li] + 1.55);
      }
    });
    // posters above lockers and banners
    for (var px = 3; px < 58; px += rnd.range(2.5, 4.5)) {
      var onS = rnd() < 0.5;
      poster(li, px, LV_Y[li] + 2.35 + rnd.range(-0.08, 0.1), onS ? 9.52 : 12.98, onS ? 0 : PI, 'hall');
    }
    M.signs.push({ kind: 'banner', li: li, x: li === 1 ? 30 : 20, y: LV_Y[li] + 2.75, z: 11.25, rot: 0, text: li === 1 ? 'WELCOME BACK, STUDENTS!' : 'HOO-RAY FOR LEARNING!' });
    M.signs.push({ kind: 'banner', li: li, x: li === 1 ? 50 : 45, y: LV_Y[li] + 2.75, z: 11.25, rot: PI, text: li === 1 ? 'NO RUNNING IN THE HALLS' : 'SMILE! YOU\'RE ON CAMERA' });
    // PA speakers, clocks, extinguishers, fountains
    for (var sx2 = 8; sx2 < 58; sx2 += 16) prop('speaker', li, sx2, 12.95, PI, { y: LV_Y[li] + 2.95 });
    prop('clock', li, 30, 12.98, PI, { y: LV_Y[li] + 2.6 });
    prop('extinguisher', li, 18.0, 9.55, 0, { y: LV_Y[li] + 1.1 });
    prop('extinguisher', li, 48.0, 12.95, PI, { y: LV_Y[li] + 1.1 });
    if (li === 1) {
      prop('trophy', 1, 23.0, 9.75, 0); block(1, 22, 9.5, 24, 10, 1);
      prop('fountain', 1, 36.5, 12.75, PI); block(1, 36, 12.5, 37, 13, 0);
    } else {
      prop('fountain', 2, 23.0, 9.75, 0); block(2, 22.5, 9.5, 23.5, 10, 0);
    }
    // camera (SMILE! YOU'RE ON CAMERA)
    prop('cctv', li, 1.0, 12.9, PI * 0.75, { y: LV_Y[li] + 3.0 });
    prop('cctv', li, 58.8, 9.6, -PI * 0.25, { y: LV_Y[li] + 3.0 });
    // scattered paper
    for (var k = 0; k < 18; k++) prop('paper', li, rnd.range(1, 59), rnd.range(10.3, 12.2), rnd() * TAU);
    // TV cart in hallway
    var tvx = rnd.range(6, 54);
    if (cellType(li, m2c(tvx), m2r(10.25)) === T_BLOCK) {
      // replace a locker? no; place on the floor strip near north wall instead
    }
    // emergency lights in corridor (lights-out)
    for (var ex = 6 + rnd() * 4; ex < 58; ex += 12 + rnd() * 6) {
      if (rnd() < 0.25) continue;
      prop('emerg', li, ex, 12.95, PI, { y: LV_Y[li] + 2.9 });
      dlight(li, ex, LV_Y[li] + 2.6, 12.4, [0.85, 0.9, 1.0], 5.5, { int: 0.55, kind: 'emerg' });
    }
    item(li, rnd.range(3, 57), rnd.range(10.5, 12), r.id); item(li, rnd.range(3, 57), rnd.range(10.5, 12), r.id);
  });
  // exits
  exitSign(1, 13.5, 13.0, PI); exitSign(1, 42.5, 13.0, PI); exitSign(2, 16, 13.0, PI); exitSign(2, 45, 13.0, PI);
  exitSign(1, 59.4, 11.25, -PI / 2); exitSign(1, 0.6, 11.25, PI / 2); exitSign(1, 30, 0.6, 0); exitSign(1, 64, -0.9, 0);
  exitSign(1, 45, 13.0, PI);

  // --- stairs ---
  [M.stairs[0], M.stairs[1]].forEach(function (s, k) {
    light(2, (s.x0 + s.x1) / 2, LV_Y[2] + 3.15, 20.7, -1, { r: 8, int: 1.0 });
    light(1, s.x0 + 3.3, LV_Y[1] + 3.15, 17.5, -1, { r: 6, int: 0.8 });
    dlight(2, (s.x0 + s.x1) / 2, LV_Y[2] + 2.8, 20.8, [0.8, 0.85, 1.0], 6, { int: 0.5, kind: 'emerg' });
    windowsAlong(2, s.x0, s.x1 + 2.5, 21.5, -1, -1, 0.6);
  });

  // --- basement ---
  [[35, 21.5], [42, 21.5], [50, 21.5], [57, 21.5]].forEach(function (p, k) {
    prop('bulb', 0, p[0], p[1], 0, { y: -4 + 2.55 });
    light(0, p[0], -4 + 2.5, p[1], M.bcorr.id, { col: [1, 0.8, 0.55], r: 6, int: 0.9, kind: 'bulb' });
    if (k === 1 || k === 3) dlight(0, p[0], -4 + 2.4, p[1], [1.0, 0.45, 0.2], 4.5, { int: 0.6, kind: 'bulb' });
  });
  prop('pipes', 0, 45, 22.6, 0);
  [M.boiler, M.bstore].forEach(function (r) { ceilingGrid(r, 2, 2, { col: [1, 0.82, 0.6], r: 7, int: 0.8, kind: 'bulb' }); });
  prop('boilertank', 0, 52, 13, 0); block(0, 50.5, 11, 53.5, 15, 2);
  prop('boilertank', 0, 57, 13, 0); block(0, 55.5, 11, 58.5, 15, 2);
  dlight(0, 52, -4 + 0.6, 15.6, [1.0, 0.35, 0.1], 5, { int: 1.0, kind: 'fire' });
  dlight(0, 57, -4 + 0.6, 15.6, [1.0, 0.35, 0.1], 5, { int: 1.0, kind: 'fire' });
  addHide(M.boiler, 'behind', 54.25, 9.0, PI, 54.25, 10.0, -4 + 1.2);
  item(0, 55, 17.5, M.boiler.id); item(0, 50, 9, M.boiler.id);
  // prop storage: empty mascot costumes on racks (the friends from the show)
  prop('costume', 0, 32.5, 9.4, 0, { who: 'penny' });
  prop('costume', 0, 35, 9.4, 0, { who: 'bitsy' });
  prop('costume', 0, 37.5, 9.4, 0, { who: 'marbles' });
  block(0, 31.5, 8, 38.5, 10, 1);
  for (var b = 0; b < 10; b++) { var bx = rnd.range(31, 39), bz = rnd.range(12, 18.5); prop('boxes', 0, bx, bz, rnd() * PI, { s: rnd.range(0.7, 1.2) }); block(0, bx - 0.45, bz - 0.45, bx + 0.45, bz + 0.45, 1); }
  addHide(M.bstore, 'behind', 39.4, 18.9, -PI * 0.75, 38.5, 18.5, -4 + 1.1);
  item(0, 35, 14, M.bstore.id);
  poster(0, 34, -4 + 1.6, 8.05, 0, 'hoots', 0.8, 1.1);

  // --- lobby ---
  var lb = M.lobby;
  ceilingGrid(lb, 3, 2, {});
  prop('counter', 1, 26.5, 5, PI / 2, { len: 5 }); block(1, 26, 2.5, 27, 7.5, 1);
  prop('bench', 1, 33.5, 4.5, -PI / 2); block(1, 33, 3.5, 34, 5.5, 0);
  prop('standee', 1, 32.5, 7.5, PI * 0.85);
  poster(1, 30, 1.9, 8.95, PI, 'hoots', 1.2, 1.5);
  M.signs.push({ kind: 'banner', li: 1, x: 30, y: 2.85, z: 8.6, rot: PI, text: 'HOLLOW PINES NIGHT SCHOOL' });
  windowsAlong(1, 24.5, 28.5, 0, 1, lb.id, 1.0); windowsAlong(1, 31.5, 35.5, 0, 1, lb.id, 1.0);
  dlight(1, 30, 1.6, 1.3, [0.42, 0.55, 0.85], 7, { nz: 1, int: 1.1, kind: 'moon' });
  item(1, 33, 7, lb.id);

  // --- cafeteria ---
  var cf = M.cafe;
  ceilingGrid(cf, 4, 5, { r: 8 });
  [[-9.5, 5.5], [-4.5, 5.5], [-9.5, 16.5], [-4.5, 16.5]].forEach(function (t) {
    prop('ctable', 1, t[0], t[1], 0, { len: 4.2 });
    block(1, t[0] - 0.45, t[1] - 2.1, t[0] + 0.45, t[1] + 2.1, 0);
    for (var s = 0; s < 4; s++) {
      var z = t[1] - 1.55 + s * 1.03;
      addChair(cf, t[0] - 0.85, z, PI / 2, 'chair');
      addChair(cf, t[0] + 0.85, z, -PI / 2, 'chair');
    }
    addHide(cf, 'table', t[0], t[1] - 1.0, PI / 2, t[0] - 0.95, t[1] - 1.0, 0.35);
  });
  prop('servecounter', 1, -13.25, 11, PI / 2, { len: 14 }); block(1, -13.5, 4, -13, 18, 1);
  for (var k2 = 0; k2 < 4; k2++) { prop('stove', 1, -17.4, 4 + k2 * 4, PI / 2); block(1, -18, 3.4 + k2 * 4, -17, 4.6 + k2 * 4, 1); }
  prop('vending', 1, -1.0, 3.0, -PI / 2); block(1, -1.5, 2.5, -0.5, 3.5, 2);
  prop('vending', 1, -1.0, 19.5, -PI / 2); block(1, -1.5, 19, -0.5, 20, 2);
  dlight(1, -1.9, 1.5, 3.0, [0.5, 0.85, 1.0], 4.2, { int: 0.9, kind: 'vend' });
  dlight(1, -1.9, 1.5, 19.5, [0.5, 0.85, 1.0], 4.2, { int: 0.9, kind: 'vend' });
  prop('trash', 1, -2.0, 8.5, 0); prop('trash', 1, -2.0, 14.5, 0);
  poster(1, -8, 2.1, 21.45, PI, 'lunch', 1.0, 0.7); poster(1, -4, 2.1, 0.55, 0, 'milk', 0.7, 0.9);
  windowsAlongZ(1, 0.5, 21.5, -18.5, 1, cf.id, 1.0);
  windowsAlong(1, -12, -0.5, 0, 1, cf.id, 1.0);
  addHide(cf, 'behind', -15.5, 20.8, PI, -14.5, 20.6, 1.1);
  item(1, -15.5, 8, cf.id); item(1, -7, 11, cf.id);

  // --- gym ---
  var gy = M.gym;
  ceilingGrid(gy, 4, 3, { r: 17, int: 3.2, kind: 'highbay' });
  prop('bleachers', 1, 70.25, 20.75, 0, { len: 16 }); block(1, 62.25, 18.5, 78.25, 23, 1);
  for (var hx = 63; hx <= 77; hx += 2.8) addHide(gy, 'bleacher', hx, 19.0, PI, hx, 18.0, 0.7);
  prop('hoop', 1, 61.0, 11, PI / 2); prop('hoop', 1, 79.5, 11, -PI / 2);
  prop('scoreboard', 1, 70.25, -0.9, 0, { y: 5.6 });
  prop('mats', 1, 79, 1.5, 0); block(1, 78, 0.5, 80, 2.5, 1);
  prop('ballcart', 1, 62, 2, 0); block(1, 61.5, 1.5, 62.5, 2.5, 0);
  poster(1, 66, 2.2, -0.95, 0, 'gym', 1.0, 0.7);
  M.signs.push({ kind: 'banner', li: 1, x: 70.25, y: 6.5, z: 22.9, rot: PI, text: 'GO NIGHT OWLS!', big: true });
  for (var gw = 62; gw < 79; gw += 3) { dlight(1, gw + 0.75, 5.8, -0.5, [0.42, 0.55, 0.85], 9, { nz: 1, int: 0.7, kind: 'moon' }); M.windows.push({ li: 1, x: gw + 0.75, z: -1.25, nx: 0, nz: 1, high: true, room: gy.id }); }
  item(1, 75, 5, gy.id); item(1, 65, 15, gy.id);

  // --- slot rooms by role ---
  M.slots.forEach(function (r) { furnishRoom(M, r, rnd, addChair, addHide, light, dlight, poster, item, windowsAlong, ceilingGrid); });
}

function furnishRoom(M, r, rnd, addChair, addHide, light, dlight, poster, item, windowsAlong, ceilingGrid) {
  var prop = M.prop, block = M.block, li = r.li, Y = LV_Y[li];
  var info = ROLE_INFO[r.role];
  var winZ = r.side === 'S' ? 0 : 21.5, inward = r.side === 'S' ? 1 : -1;
  var moonStrength = r.side === 'S' ? 1.0 : 0.55;
  windowsAlong(li, r.x0, r.x1, winZ, inward, r.id, moonStrength);
  var corrWallZ = r.side === 'S' ? r.z1 - 0.03 : r.z0 + 0.03, corrRot = r.side === 'S' ? PI : 0;
  var x0 = r.x0, x1 = r.x1, cz = r.cz;
  ceilingGrid(r, 3, 2, {});
  // room sign by the door (corridor side) + clock + flag
  var d0 = M.doors[r.doors[0]];
  M.signs.push({ kind: 'roomplate', li: li, x: d0.x + 0.95, y: Y + 1.75, z: r.side === 'S' ? 9.53 : 12.97, rot: r.side === 'S' ? 0 : PI, text: String(r.number), sub: info.en });
  prop('clock', li, (x0 + x1) / 2, corrWallZ, corrRot, { y: Y + 2.55 });
  prop('speaker', li, x0 + 0.05, cz + 2.8, PI / 2, { y: Y + 2.9 });
  item(li, rnd.range(x0 + 1, x1 - 1), rnd.range(r.z0 + 1, r.z1 - 1), r.id);
  var kind = info.kind;
  var board = function (lines) { prop('board', li, x0 + 0.04, cz, PI / 2, { y: Y + 1.55, w: 5.2, lines: lines, room: r.id }); };

  if (kind === 'class' || kind === 'science' || kind === 'music' || kind === 'art' || kind === 'homeec') {
    board(null);
    prop('tdesk', li, x0 + 1.7, cz - 1.8, PI / 2); block(li, x0 + 1.2, cz - 2.6, x0 + 2.2, cz - 1.0, 0);
    prop('flag', li, x0 + 0.35, r.z1 - 0.6, PI / 2, { y: Y });
    poster(li, x1 - 0.03, Y + 1.7, cz, -PI / 2, 'class', 0.9, 1.2);
    prop('bboard', li, (x0 + x1) / 2 + 1.5, corrWallZ, corrRot, { y: Y + 1.55 });
  }
  var lesson = !!info.lesson;
  if (kind === 'class') {
    for (var row = 0; row < 4; row++) for (var col = 0; col < 3; col++) {
      var dx = x0 + 3.5 + row * 2.0, dz = cz + (col - 1) * 2.4;
      if (dx > x1 - 1.2) continue;
      prop('desk', li, dx, dz, -PI / 2); block(li, dx - 0.25, dz - 0.25, dx + 0.25, dz + 0.25, 0);
      var ch = addChair(r, dx + 0.6, dz, -PI / 2, 'chair', lesson);
      if (r.role === 'DETENTION' && rnd() < 0.4) ch.rot = PI / 2; // facing the wall...
      addHide(r, 'desk', dx, dz, -PI / 2, dx + 0.7, dz, Y + 0.32);
    }
    if (r.role === 'DETENTION') board([{ t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT.', size: 34 }, { t: 'I WILL NOT LEAVE MY SEAT', size: 34 }]);
    if (r.role === 'HISTORY') prop('globe', li, x0 + 1.7, cz - 1.8, 0, { y: Y + 0.78 });
  } else if (kind === 'science') {
    for (var b = 0; b < 3; b++) {
      var bx = x0 + 3.8 + b * 2.6;
      prop('labbench', li, bx, cz, 0, { len: 4.4 }); block(li, bx - 0.4, cz - 2.2, bx + 0.4, cz + 2.2, 0);
      for (var s = 0; s < 4; s++) { var sz = cz - 1.65 + s * 1.1; addChair(r, bx + 0.75, sz, -PI / 2, 'stool', lesson); }
      addHide(r, 'desk', bx, cz + 0.5, -PI / 2, bx + 0.9, cz + 0.5, Y + 0.32);
    }
    prop('skeleton', li, x1 - 0.7, r.z0 + 0.8, -PI * 0.75); block(li, x1 - 1, r.z0 + 0.5, x1 - 0.5, r.z0 + 1, 1);
    prop('cabinet', li, x1 - 0.35, cz + 2, -PI / 2); block(li, x1 - 0.5, cz + 1.5, x1, cz + 2.5, 2);
    poster(li, x1 - 0.03, Y + 1.7, cz - 1.2, -PI / 2, 'periodic', 1.2, 0.8);
  } else if (kind === 'music') {
    prop('piano', li, x0 + 1.4, cz + 2.2, PI / 2); block(li, x0 + 0.5, cz + 1.4, x0 + 2.0, cz + 3.0, 1);
    for (var mr = 0; mr < 3; mr++) for (var mc = 0; mc < 4; mc++) {
      var mx = x0 + 3.6 + mr * 2.2, mz = cz - 2.7 + mc * 1.8;
      addChair(r, mx, mz, -PI / 2, 'chair', lesson);
      prop('stand', li, mx - 0.55, mz, -PI / 2);
    }
    prop('drums', li, x1 - 1.2, r.z0 + 1.2, -PI * 0.75); block(li, x1 - 2, r.z0 + 0.5, x1 - 0.5, r.z0 + 2, 1);
    poster(li, x1 - 0.03, Y + 1.7, cz - 1.5, -PI / 2, 'music', 0.9, 0.7);
  } else if (kind === 'art') {
    for (var t = 0; t < 3; t++) {
      var ax = x0 + 3.8 + t * 2.7;
      prop('arttable', li, ax, cz, 0); block(li, ax - 0.6, cz - 0.9, ax + 0.6, cz + 0.9, 0);
      addChair(r, ax - 0.95, cz - 0.45, PI / 2, 'stool', lesson); addChair(r, ax - 0.95, cz + 0.45, PI / 2, 'stool', lesson);
      addChair(r, ax + 0.95, cz - 0.45, -PI / 2, 'stool', lesson); addChair(r, ax + 0.95, cz + 0.45, -PI / 2, 'stool', lesson);
      addHide(r, 'desk', ax, cz, PI / 2, ax - 1.1, cz, Y + 0.32);
    }
    for (var e = 0; e < 3; e++) prop('easel', li, x1 - 0.9, r.z0 + 1.5 + e * 2.2, -PI / 2);
    block(li, x1 - 1.2, r.z0 + 1, x1 - 0.6, r.z0 + 6, 0);
    prop('paint', li, (x0 + x1) / 2, cz, 0);
  } else if (kind === 'homeec') {
    for (var st = 0; st < 3; st++) { prop('stove', li, x1 - 0.45, r.z0 + 1.5 + st * 2.5, -PI / 2); block(li, x1 - 1, r.z0 + 0.9 + st * 2.5, x1, r.z0 + 2.1 + st * 2.5, 1); }
    for (var ht = 0; ht < 2; ht++) {
      var hx = x0 + 4 + ht * 3.5;
      prop('arttable', li, hx, cz, 0); block(li, hx - 0.6, cz - 0.9, hx + 0.6, cz + 0.9, 0);
      addChair(r, hx - 0.95, cz, PI / 2, 'chair', false); addChair(r, hx + 0.95, cz, -PI / 2, 'chair', false);
      addHide(r, 'desk', hx, cz, PI / 2, hx - 1.1, cz, Y + 0.32);
    }
  } else if (kind === 'library') {
    for (var sh = 0; sh < 4; sh++) {
      var shx = x0 + 4.5 + sh * 1.8;
      prop('shelf', li, shx, cz - 0.6, 0, { len: 5 }); block(li, shx - 0.25, cz - 3.1, shx + 0.25, cz + 1.9, 2);
    }
    prop('ltable', li, x0 + 2, cz, 0); block(li, x0 + 1.5, cz - 1, x0 + 2.5, cz + 1, 0);
    addChair(r, x0 + 1.2, cz - 0.5, PI / 2, 'chair', false); addChair(r, x0 + 1.2, cz + 0.5, PI / 2, 'chair', false);
    addHide(r, 'table', x0 + 2, cz, PI / 2, x0 + 1.1, cz, Y + 0.32);
    prop('cardcat', li, x1 - 0.5, r.z0 + 1, -PI / 2); block(li, x1 - 1, r.z0 + 0.5, x1, r.z0 + 1.5, 1);
    poster(li, x1 - 0.03, Y + 1.7, cz + 2.5, -PI / 2, 'read', 0.7, 1.0);
    board([{ t: 'QUIET PLEASE.', size: 48 }, { t: 'Overdue books must be returned', size: 30 }, { t: 'before the bell.', size: 30 }]);
  } else if (kind === 'nurse') {
    for (var cb = 0; cb < 2; cb++) {
      var cx2 = x0 + 3 + cb * 3.2;
      prop('cot', li, cx2, r.side === 'S' ? r.z0 + 1.2 : r.z1 - 1.2, r.side === 'S' ? 0 : PI);
      var zz = r.side === 'S' ? r.z0 + 1.2 : r.z1 - 1.2;
      block(li, cx2 - 1, zz - 0.4, cx2 + 1, zz + 0.4, 0);
      addHide(r, 'cot', cx2, zz, r.side === 'S' ? PI : 0, cx2, zz + inward * 0.9, Y + 0.25);
      prop('curtain', li, cx2 + 1.4, zz, PI / 2);
    }
    prop('cabinet', li, x1 - 0.35, cz, -PI / 2); block(li, x1 - 0.5, cz - 0.5, x1, cz + 0.5, 2);
    prop('tdesk', li, x0 + 1.5, cz + 2, PI / 2); block(li, x0 + 1, cz + 1.2, x0 + 2, cz + 2.8, 0);
    poster(li, x0 + 0.03, Y + 1.6, cz - 1.5, PI / 2, 'eyechart', 0.55, 0.85);
    poster(li, x1 - 0.03, Y + 1.7, cz + 2, -PI / 2, 'germs', 0.7, 0.9);
  } else if (kind === 'principal') {
    prop('tdesk', li, x1 - 3, cz, -PI / 2); block(li, x1 - 3.5, cz - 0.8, x1 - 2.5, cz + 0.8, 0);
    addHide(r, 'desk', x1 - 3, cz, -PI / 2, x1 - 3.9, cz, Y + 0.32);
    prop('pamic', li, x1 - 3, cz + 0.4, -PI / 2, { y: Y + 0.78 });
    for (var f = 0; f < 4; f++) { prop('filing', li, x1 - 0.4, r.z0 + 0.8 + f * 0.9, -PI / 2); block(li, x1 - 0.7, r.z0 + 0.4 + f * 0.9, x1, r.z0 + 1.2 + f * 0.9, 1); }
    for (var wc = 0; wc < 4; wc++) addChair(r, x0 + 1.5 + wc * 1.1, r.side === 'S' ? r.z0 + 0.7 : r.z1 - 0.7, r.side === 'S' ? 0 : PI, 'chair', false);
    prop('flag', li, x1 - 1.2, r.z1 - 0.6, -PI / 2, { y: Y });
    poster(li, x0 + 0.03, Y + 1.7, cz, PI / 2, 'portrait', 0.7, 0.9);
    poster(li, x0 + 0.03, Y + 1.7, cz + 2, PI / 2, 'certificate', 0.7, 0.5);
  } else if (kind === 'av') {
    for (var tv = 0; tv < 3; tv++) {
      var tvx = x0 + 2 + tv * 3.2, tvz = r.side === 'S' ? r.z0 + 1.0 : r.z1 - 1.0;
      prop('tvcart', li, tvx, tvz, r.side === 'S' ? 0 : PI);
      block(li, tvx - 0.4, tvz - 0.4, tvx + 0.4, tvz + 0.4, 1);
      M.tvs.push({ li: li, x: tvx, z: tvz, rot: r.side === 'S' ? 0 : PI, room: r.id, y: Y + 1.15 });
    }
    prop('vhsshelf', li, x1 - 0.35, cz, PI, { len: 4 }); block(li, x1 - 0.5, cz - 2, x1, cz + 2, 2);
    prop('vcr', li, x0 + 1.2, cz, PI / 2); block(li, x0 + 0.8, cz - 0.6, x0 + 1.6, cz + 0.6, 0);
    r.vcr = { li: li, x: x0 + 1.9, z: cz };
    for (var ar = 0; ar < 2; ar++) for (var ac = 0; ac < 4; ac++) addChair(r, x0 + 4 + ar * 2, cz - 2.4 + ac * 1.6, -PI / 2, 'chair', false);
    poster(li, x0 + 0.03, Y + 1.7, cz + 2.5, PI / 2, 'vhs', 0.7, 0.9);
  } else if (kind === 'restroom') {
    // stalls along the window-opposite side
    var stz = r.side === 'S' ? r.z0 : r.z1, dirz = r.side === 'S' ? 1 : -1;
    for (var sI = 0; sI < 4; sI++) {
      var sx = x0 + 1.5 + sI * 1.4;
      prop('stall', li, sx, stz + dirz * 0.75, r.side === 'S' ? 0 : PI);
      block(li, sx - 0.75, Math.min(stz, stz + dirz * 1.5), sx - 0.6, Math.max(stz, stz + dirz * 1.5), 2);
      addHide(r, 'stall', sx, stz + dirz * 0.7, r.side === 'S' ? 0 : PI, sx, stz + dirz * 2.0, Y + 1.1);
    }
    block(li, x0 + 6.75, Math.min(stz, stz + dirz * 1.5), x0 + 6.9, Math.max(stz, stz + dirz * 1.5), 2);
    for (var sk = 0; sk < 3; sk++) { var skx = x0 + 8 + sk * 1.0; prop('sink', li, skx, r.side === 'S' ? r.z1 - 0.35 : r.z0 + 0.35, r.side === 'S' ? PI : 0); }
    block(li, x0 + 7.5, r.side === 'S' ? r.z1 - 0.5 : r.z0, x0 + 10.5, r.side === 'S' ? r.z1 : r.z0 + 0.5, 0);
    prop('mirror', li, x0 + 9, r.side === 'S' ? r.z1 - 0.03 : r.z0 + 0.03, r.side === 'S' ? PI : 0, { y: Y + 1.6, w: 3 });
    r.mirror = { x: x0 + 9, z: r.side === 'S' ? r.z1 - 0.05 : r.z0 + 0.05, y: Y + 1.6 };
    r.tiled = true;
  } else if (kind === 'lounge') {
    prop('couch', li, x0 + 2.5, cz, PI / 2); block(li, x0 + 2, cz - 1.2, x0 + 3, cz + 1.2, 1);
    prop('ltable', li, x0 + 4.2, cz, 0); block(li, x0 + 3.7, cz - 0.6, x0 + 4.7, cz + 0.6, 0);
    prop('vending', li, x1 - 0.5, r.z0 + 1, -PI / 2); block(li, x1 - 1, r.z0 + 0.5, x1, r.z0 + 1.5, 2);
    dlight(li, x1 - 1.4, Y + 1.5, r.z0 + 1, [0.5, 0.85, 1.0], 4, { int: 0.8, kind: 'vend' });
    prop('fridge', li, x1 - 0.45, r.z1 - 1, -PI / 2); block(li, x1 - 1, r.z1 - 1.5, x1, r.z1 - 0.5, 2);
    for (var lc = 0; lc < 4; lc++) addChair(r, x0 + 7 + (lc % 2) * 1.4, cz - 0.8 + Math.floor(lc / 2) * 1.6, lc % 2 ? -PI / 2 : PI / 2, 'chair', false);
    prop('ltable', li, x0 + 7.7, cz, 0); block(li, x0 + 7.2, cz - 0.6, x0 + 8.2, cz + 0.6, 0);
    addHide(r, 'table', x0 + 7.7, cz, PI / 2, x0 + 6.6, cz, Y + 0.32);
    poster(li, x0 + 0.03, Y + 1.7, cz, PI / 2, 'memo', 0.6, 0.8);
  } else if (kind === 'storage') {
    for (var bI = 0; bI < 12; bI++) { var bx2 = rnd.range(x0 + 1.5, x1 - 1), bz2 = rnd.range(r.z0 + 1, r.z1 - 1); prop('boxes', li, bx2, bz2, rnd() * PI, { s: rnd.range(0.6, 1.1) }); block(li, bx2 - 0.4, bz2 - 0.4, bx2 + 0.4, bz2 + 0.4, 1); }
    prop('shelf', li, x1 - 0.4, cz, 0, { len: 6, metal: true }); block(li, x1 - 0.6, cz - 3, x1, cz + 3, 2);
    addHide(r, 'behind', x1 - 1.0, r.side === 'S' ? r.z0 + 0.5 : r.z1 - 0.5, PI / 2, x1 - 1.8, r.side === 'S' ? r.z0 + 0.8 : r.z1 - 0.8, Y + 1.1);
  } else if (kind === 'office') {
    prop('tdesk', li, x0 + 3, cz, PI / 2); block(li, x0 + 2.5, cz - 0.8, x0 + 3.5, cz + 0.8, 0);
    addHide(r, 'desk', x0 + 3, cz, PI / 2, x0 + 3.9, cz, Y + 0.32);
    prop('couch', li, x1 - 1, cz, -PI / 2); block(li, x1 - 1.5, cz - 1.2, x1 - 0.5, cz + 1.2, 1);
    poster(li, x1 - 0.03, Y + 1.8, cz, -PI / 2, 'help', 0.8, 0.9);
    prop('plant', li, x0 + 0.6, r.z0 + 0.6, 0);
    addChair(r, x0 + 4.5, cz, -PI / 2, 'chair', false);
  }
  // decoration chairs & desks list for raids: classroom-like rooms keep their chairs
  r.lesson = lesson;
  if (lesson) r.subject = r.role;
}
