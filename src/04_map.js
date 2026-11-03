// ---- school map: grid model, generation, validation, navigation -----------
var CELL = 0.5, OX = -20, OZ = -18, NX = 208, NZ = 88, NL = 3;
var LV_Y = [-4, 0, 4];          // level base heights: 0=Basement 1=Ground 2=Upper
var LV_NAME = ['B', '1F', '2F'];
var T_VOID = 0, T_FLOOR = 1, T_WALL = 2, T_STAIR = 3, T_DOOR = 4, T_BLOCK = 5;
// floor materials
var M_LINO = 0, M_GYM = 1, M_TILE = 2, M_TERRAZZO = 3, M_CARPET = 4, M_CONCRETE = 5, M_ASPHALT = 6, M_GRASS = 7, M_LINO2 = 8, M_BUS = 9;

var ROLE_INFO = {
  MATH: { en: 'MATH', ja: '数学', lesson: true, kind: 'class' },
  ENGLISH: { en: 'ENGLISH', ja: '英語', lesson: true, kind: 'class' },
  SCIENCE: { en: 'SCIENCE LAB', ja: '理科室', lesson: true, kind: 'science' },
  MUSIC: { en: 'MUSIC', ja: '音楽室', lesson: true, kind: 'music' },
  ART: { en: 'ART', ja: '美術室', lesson: true, kind: 'art' },
  HISTORY: { en: 'HISTORY', ja: '歴史', kind: 'class' },
  DETENTION: { en: 'DETENTION', ja: '居残り部屋', kind: 'class' },
  HOME_EC: { en: 'HOME EC', ja: '家庭科室', kind: 'homeec' },
  LIBRARY: { en: 'LIBRARY', ja: '図書室', kind: 'library' },
  NURSE: { en: "NURSE'S OFFICE", ja: '保健室', kind: 'nurse' },
  PRINCIPAL: { en: "PRINCIPAL'S OFFICE", ja: '校長室', kind: 'principal' },
  AV: { en: 'AV ROOM', ja: '視聴覚室', kind: 'av' },
  RESTROOM_B: { en: 'BOYS', ja: '男子トイレ', kind: 'restroom' },
  RESTROOM_G: { en: 'GIRLS', ja: '女子トイレ', kind: 'restroom' },
  LOUNGE: { en: "TEACHERS' LOUNGE", ja: '職員休憩室', kind: 'lounge' },
  STORAGE: { en: 'STORAGE', ja: '倉庫', kind: 'storage' },
  COUNSELOR: { en: 'COUNSELOR', ja: 'カウンセリング室', kind: 'office' },
  CAFETERIA: { en: 'CAFETERIA', ja: 'カフェテリア', kind: 'cafeteria' },
  GYM: { en: 'GYMNASIUM', ja: '体育館', kind: 'gym' },
  LOBBY: { en: 'MAIN OFFICE / LOBBY', ja: 'ロビー', kind: 'lobby' },
  CORRIDOR: { en: 'HALLWAY', ja: '廊下', kind: 'corridor' },
  STAIRS: { en: 'STAIRS', ja: '階段', kind: 'stairs' },
  BOILER: { en: 'BOILER ROOM', ja: 'ボイラー室', kind: 'boiler' },
  BSTORAGE: { en: 'PROP STORAGE', ja: '小道具倉庫', kind: 'bstorage' },
  BCORR: { en: 'MAINTENANCE', ja: '保守通路', kind: 'bcorr' },
  OUTSIDE: { en: 'BUS LOOP', ja: 'バス乗り場', kind: 'outside' },
  BUS: { en: 'SCHOOL BUS', ja: 'スクールバス', kind: 'bus' }
};
var SLOT_DEFS = [
  ['S1', 0.5, 12, 'S'], ['S2', 12.5, 24, 'S'], ['SC', 24.5, 35.5, 'S'], ['S3', 36, 47.5, 'S'], ['S4', 48, 59.5, 'S'],
  ['N1', 0.5, 12, 'N'], ['N2', 17.5, 29, 'N'], ['N3', 29.5, 41, 'N'], ['N4', 46.5, 59.5, 'N']
];
var RANDOM_ROLES = ['MATH', 'ENGLISH', 'SCIENCE', 'MUSIC', 'ART', 'HISTORY', 'DETENTION', 'HOME_EC', 'LIBRARY', 'NURSE', 'PRINCIPAL', 'AV', 'RESTROOM_B', 'RESTROOM_G', 'LOUNGE', 'STORAGE', 'COUNSELOR'];

var MAP = null;

function m2c(x) { return Math.floor((x - OX) / CELL + 1e-6); }
function m2r(z) { return Math.floor((z - OZ) / CELL + 1e-6); }
function c2x(cx) { return OX + (cx + 0.5) * CELL; }
function r2z(cz) { return OZ + (cz + 0.5) * CELL; }
function cidx(cx, cz) { return cz * NX + cx; }
function inGrid(cx, cz) { return cx >= 0 && cz >= 0 && cx < NX && cz < NZ; }

function newLevel() {
  var n = NX * NZ;
  return {
    type: new Uint8Array(n), room: new Int16Array(n).fill(-1), mat: new Uint8Array(n),
    opaque: new Uint8Array(n), door: new Int16Array(n).fill(-1), stair: new Int16Array(n).fill(-1),
    ceil: new Float32Array(n), blockTall: new Uint8Array(n), hide: new Int16Array(n).fill(-1)
  };
}

function generateMap(seed) {
  for (var attempt = 0; attempt < 40; attempt++) {
    var m = buildMapAttempt((seed + attempt * 7919) >>> 0);
    if (m.valid) { m.attempts = attempt + 1; return m; }
  }
  // last resort: no random obstacles
  var mm = buildMapAttempt(seed >>> 0, true); mm.attempts = 41; return mm;
}

function buildMapAttempt(seed, safe) {
  var rnd = makeRNG(seed);
  var M = { seed: seed, lv: [newLevel(), newLevel(), newLevel()], rooms: [], doors: [], stairs: [], hides: [], props: [], chairs: [], lights: [], dlights: [], tvs: [], posters: [], itemSpots: [], windows: [], signs: [], blockers: [], valid: false };
  MAP = M;
  function rectCells(x0, z0, x1, z1, fn) {
    var a = m2c(x0), b = m2c(x1 - 1e-4), c = m2r(z0), d = m2r(z1 - 1e-4);
    for (var cz = c; cz <= d; cz++) for (var cx = a; cx <= b; cx++) if (inGrid(cx, cz)) fn(cidx(cx, cz), cx, cz);
  }
  function fill(li, x0, z0, x1, z1, type, room, mat, ceil) {
    var L = M.lv[li];
    rectCells(x0, z0, x1, z1, function (i) { L.type[i] = type; if (room !== undefined) L.room[i] = room; if (mat !== undefined) L.mat[i] = mat; if (ceil !== undefined) L.ceil[i] = ceil; L.opaque[i] = (type === T_WALL || type === T_VOID) ? 1 : 0; });
  }
  function addRoom(li, role, x0, z0, x1, z1, mat, ceil, extra) {
    var r = { id: M.rooms.length, li: li, role: role, x0: x0, z0: z0, x1: x1, z1: z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, mat: mat, ceil: ceil, doors: [], chairs: [], hides: [], number: 0 };
    if (extra) for (var k in extra) r[k] = extra[k];
    M.rooms.push(r);
    fill(li, x0, z0, x1, z1, T_FLOOR, r.id, mat, ceil);
    return r;
  }
  function addDoor(li, x0, z0, x1, z1, axis, roomA, opt) {
    opt = opt || {};
    var d = { id: M.doors.length, li: li, x0: x0, z0: z0, x1: x1, z1: z1, x: (x0 + x1) / 2, z: (z0 + z1) / 2, axis: axis, room: roomA, open: opt.open != null ? opt.open : 0, locked: false, cells: [], kind: opt.kind || 'wood', width: axis === 'z' ? (x1 - x0) : (z1 - z0), label: opt.label || '', anim: 0, exit: !!opt.exit, noLock: !!opt.noLock };
    var L = M.lv[li];
    rectCells(x0, z0, x1, z1, function (i) { L.type[i] = T_DOOR; L.door[i] = d.id; L.opaque[i] = 0; d.cells.push(i); if (L.room[i] < 0) L.room[i] = roomA; L.mat[i] = M_LINO; L.ceil[i] = 3.2; });
    M.doors.push(d);
    if (roomA >= 0 && M.rooms[roomA]) M.rooms[roomA].doors.push(d.id);
    return d;
  }
  function addStair(x0, x1, z0, z1, yA, yB, liLow, liHigh) {
    var s = { id: M.stairs.length, x0: x0, x1: x1, z0: z0, z1: z1, yA: yA, yB: yB, lo: liLow, hi: liHigh };
    M.stairs.push(s);
    [liLow, liHigh].forEach(function (li) {
      var L = M.lv[li];
      rectCells(x0, z0, x1, z1, function (i) { L.type[i] = T_STAIR; L.stair[i] = s.id; L.opaque[i] = 0; L.mat[i] = M_CONCRETE; });
    });
    return s;
  }
  function block(li, x0, z0, x1, z1, tall, tag) {
    var L = M.lv[li];
    rectCells(x0, z0, x1, z1, function (i) { if (L.type[i] === T_FLOOR || L.type[i] === T_DOOR) { L.type[i] = T_BLOCK; if (tall) { L.blockTall[i] = 1; L.opaque[i] = tall > 1 ? 1 : 0; } } });
  }
  M.block = block; M.rectCells = rectCells;
  function prop(kind, li, x, z, rot, o) { var p = { kind: kind, li: li, x: x, z: z, rot: rot || 0 }; if (o) for (var k in o) p[k] = o[k]; M.props.push(p); return p; }
  function light(li, x, y, z, room, opt) { var l = { li: li, x: x, y: y, z: z, room: room, int: (opt && opt.int) || 1, r: (opt && opt.r) || 7, col: (opt && opt.col) || [1, 1, 0.92], kind: (opt && opt.kind) || 'tube', broken: false, g: M.lights.length % 8 }; M.lights.push(l); return l; }
  function dlight(li, x, y, z, col, r, opt) { var l = { li: li, x: x, y: y, z: z, col: col, r: r, dir: opt && opt.dir, int: (opt && opt.int) || 1 }; M.dlights.push(l); return l; }
  M.prop = prop;

  // ---- 1. solid shells ----
  fill(1, 0, 0, 60, 22, T_WALL); fill(2, 0, 0, 60, 22, T_WALL);
  fill(1, 60, -1.5, 80.5, 23.5, T_WALL); // gym shell
  fill(1, -18.5, 0, 0, 22, T_WALL);      // cafeteria shell
  fill(0, 29.5, 7.5, 60.5, 23.5, T_WALL); // basement shell

  // ---- 2. outside (front lawn / bus loop) ----
  var outside = addRoom(1, 'OUTSIDE', -19, -16.5, 83, 0, M_GRASS, 0);
  // gym footprint overlaps outside at z[-1.5,0]: restore gym wall there
  fill(1, 60, -1.5, 80.5, 0, T_WALL, -1);
  rectCells(-19, -16.5, 83, 0, function (i, cx, cz) {
    var L = M.lv[1]; if (L.room[i] !== outside.id) return;
    var x = c2x(cx), z = r2z(cz);
    if (z > -3) L.mat[i] = M_CONCRETE; else if (x > 8 && x < 52 && z > -15) L.mat[i] = M_ASPHALT; else L.mat[i] = M_GRASS;
  });

  // ---- 3. ground floor ----
  var corrG = addRoom(1, 'CORRIDOR', 0.5, 9.5, 59.5, 13, M_LINO, 3.2);
  var corrU = addRoom(2, 'CORRIDOR', 0.5, 9.5, 59.5, 13, M_LINO, 3.2);
  var gym = addRoom(1, 'GYM', 60.5, -1, 80, 23, M_GYM, 8);
  var cafe = addRoom(1, 'CAFETERIA', -18, 0.5, -0.5, 21.5, M_TERRAZZO, 4.2);
  var lobby = addRoom(1, 'LOBBY', 24.5, 0.5, 35.5, 9, M_TERRAZZO, 3.2);
  var stW_G = addRoom(1, 'STAIRS', 12.5, 13.5, 17, 21.5, M_CONCRETE, 3.2, { name: 'WEST STAIRS' });
  var stE_G = addRoom(1, 'STAIRS', 41.5, 13.5, 46, 21.5, M_CONCRETE, 3.2, { name: 'EAST STAIRS' });
  var stW_U = addRoom(2, 'STAIRS', 12.5, 13.5, 17, 21.5, M_CONCRETE, 3.2, { name: 'WEST STAIRS' });
  var stE_U = addRoom(2, 'STAIRS', 41.5, 13.5, 46, 21.5, M_CONCRETE, 3.2, { name: 'EAST STAIRS' });
  // stair internals
  fill(1, 14.5, 13.5, 15, 21.5, T_WALL, -1); fill(2, 14.5, 13.5, 15, 20, T_WALL, -1);   // west divider
  fill(1, 12.5, 20, 14.5, 21.5, T_WALL, -1); fill(2, 12.5, 13.5, 14.5, 14, T_VOID, -1);
  fill(1, 43.5, 13.5, 44, 21.5, T_WALL, -1); fill(2, 43.5, 13.5, 44, 20, T_WALL, -1);   // east divider
  fill(1, 41.5, 20, 46, 21.5, T_WALL, -1); fill(2, 41.5, 13.5, 43.5, 14, T_VOID, -1);
  var sW = addStair(12.5, 14.5, 14, 20, 0, 4, 1, 2);
  var sE = addStair(41.5, 43.5, 14, 20, 0, 4, 1, 2);
  // basement
  var bcorr = addRoom(0, 'BCORR', 30, 20, 60, 23, M_CONCRETE, 2.8);
  var bstore = addRoom(0, 'BSTORAGE', 30, 8, 40, 19.5, M_CONCRETE, 2.8);
  var boiler = addRoom(0, 'BOILER', 48, 8, 60, 19.5, M_CONCRETE, 2.8);
  var sB = addStair(44, 46, 14, 20, 0, -4, 0, 1);
  // keep G cells of the down ramp; ground floor cell above the b-corr remains wall
  addDoor(0, 34, 19.5, 35, 20, 'z', bstore.id, { open: 0.0, noLock: true });
  addDoor(0, 52, 19.5, 53, 20, 'z', boiler.id, { open: 1, noLock: true });

  // slot rooms
  var slots = [];
  [1, 2].forEach(function (li) {
    SLOT_DEFS.forEach(function (sd, k) {
      if (li === 1 && sd[0] === 'SC') return;
      var z0 = sd[3] === 'S' ? 0.5 : 13.5, z1 = sd[3] === 'S' ? 9 : 21.5;
      var r = addRoom(li, 'TBD', sd[1], z0, sd[2], z1, M_LINO2, 3.2, { side: sd[3], slot: sd[0] });
      slots.push(r);
    });
  });

  // ---- 4. doors ----
  // classroom doors on corridor wall
  slots.forEach(function (r) {
    var wz0 = r.side === 'S' ? 9 : 13, wz1 = wz0 + 0.5;
    var w = r.x1 - r.x0;
    addDoor(r.li, r.x0 + 1, wz0, r.x0 + 2, wz1, 'z', r.id, { open: rnd() < 0.7 ? 1 : 0 });
    if (w > 9) addDoor(r.li, r.x1 - 2, wz0, r.x1 - 1, wz1, 'z', r.id, { open: rnd() < 0.6 ? 1 : 0 });
  });
  // lobby: open archway + front doors
  fill(1, 27, 9, 33, 9.5, T_FLOOR, lobby.id, M_TERRAZZO, 3.2);
  var frontDoor = addDoor(1, 29, 0, 31, 0.5, 'z', lobby.id, { open: 0, kind: 'glass', exit: true, label: 'FRONT' });
  var gymDoor = addDoor(1, 59.5, 10.25, 60.5, 12.25, 'x', gym.id, { open: 1, kind: 'double', exit: true, noLock: true });
  var gymExit = addDoor(1, 63, -1.5, 65, -1, 'z', gym.id, { open: 0, kind: 'double', exit: true });
  var cafeDoor = addDoor(1, -0.5, 10.25, 0.5, 12.25, 'x', cafe.id, { open: 1, kind: 'double', noLock: true, exit: true });
  // stair doors
  var sdW1 = addDoor(1, 12.5, 13, 14.5, 13.5, 'z', stW_G.id, { open: 1, kind: 'double', exit: true, noLock: true });
  addDoor(1, 15, 13, 17, 13.5, 'z', stW_G.id, { open: 0, kind: 'double', noLock: true });
  var sdW2 = addDoor(2, 15, 13, 17, 13.5, 'z', stW_U.id, { open: 1, kind: 'double', exit: true, noLock: true });
  var sdE1 = addDoor(1, 41.5, 13, 43.5, 13.5, 'z', stE_G.id, { open: 1, kind: 'double', exit: true, noLock: true });
  var sdEB = addDoor(1, 44, 13, 46, 13.5, 'z', stE_G.id, { open: 0, kind: 'double', exit: true, noLock: true, label: 'BASEMENT' });
  var sdE2 = addDoor(2, 44, 13, 46, 13.5, 'z', stE_U.id, { open: 1, kind: 'double', exit: true, noLock: true });
  M.stairDoors = [sdW1, sdW2, sdE1, sdE2];
  M.frontDoor = frontDoor; M.gymExit = gymExit;

  // ---- 5. the bus ----
  var bus = { x0: 25, x1: 36, z0: -12.5, z1: -9.5 };
  fill(1, 25, -12.5, 36, -9.5, T_WALL, -1);
  var busRoom = addRoom(1, 'BUS', 25.5, -12, 35.5, -10, M_BUS, 2.3);
  addDoor(1, 34, -10, 35, -9.5, 'z', busRoom.id, { open: 1, kind: 'bus', noLock: true });
  M.bus = bus; M.busRoom = busRoom;

  // ---- 6. role assignment ----
  var roles = RANDOM_ROLES.slice(); rnd.shuffle(roles);
  slots.forEach(function (r, i) { r.role = roles[i]; });
  var num = { 1: { S: 101, N: 102 }, 2: { S: 201, N: 202 } };
  slots.slice().sort(function (a, b) { return a.x0 - b.x0; }).forEach(function (r) { r.number = num[r.li][r.side]; num[r.li][r.side] += 2; });
  lobby.number = 100; cafe.number = 110; gym.number = 120;
  M.slots = slots; M.cafe = cafe; M.gym = gym; M.lobby = lobby; M.corrG = corrG; M.corrU = corrU; M.boiler = boiler; M.bstore = bstore; M.bcorr = bcorr; M.outside = outside;

  // ---- 7. furniture / content ----
  furnishAll(M, rnd);

  // ---- 8. random obstacles ----
  if (!safe) {
    // locked classroom doors
    M.doors.forEach(function (d) {
      if (d.noLock || d.room < 0) return;
      var r = M.rooms[d.room];
      if (r.role === 'TBD' || r.role === 'BUS') return;
      if (d === frontDoor) { d.locked = rnd() < 0.35; }
      else if (d === gymExit) { d.locked = !frontDoor.locked && rnd() < 0.5; }
      else d.locked = rnd() < 0.22;
      if (d.locked) d.open = 0;
    });
    // corridor barricades (full or partial)
    [1, 2].forEach(function (li) {
      var n = rnd.int(0, 2);
      for (var k = 0; k < n; k++) {
        var full = rnd() < 0.55;
        for (var tries = 0; tries < 20; tries++) {
          var bx = Math.round(rnd.range(4, 55) * 2) / 2;
          var ok = M.doors.every(function (d) { return d.li !== li || Math.abs(d.x - bx) > 2.2 || d.axis !== 'z'; });
          if (!ok) continue;
          var side = rnd() < 0.5;
          var z0 = full ? 9.5 : (side ? 9.5 : 11.25), z1 = full ? 13 : (side ? 11.25 : 13);
          block(li, bx, z0, bx + 1.5, z1, 2);
          M.blockers.push({ li: li, x0: bx, x1: bx + 1.5, z0: z0, z1: z1, full: full });
          break;
        }
      }
    });
    // stairwell blocked ("CLOSED" pile of desks)
    if (rnd() < 0.4) {
      var sd = rnd.pick(M.stairDoors);
      var bz0 = sd.z0 < 13.2 ? 13.5 : 12.5;
      block(sd.li, sd.x0, 13.5, sd.x1, 14, 2);
      M.blockers.push({ li: sd.li, x0: sd.x0, x1: sd.x1, z0: 13.5, z1: 14, full: true, stair: true });
    }
  }
  validateMap(M);
  return M;
}

// --------------------------------------------------------------------------
// navigation helpers
function cellType(li, cx, cz) { if (li < 0 || li >= NL || !inGrid(cx, cz)) return T_VOID; return MAP.lv[li].type[cidx(cx, cz)]; }
function cellAt(li, x, z) { return cellType(li, m2c(x), m2r(z)); }
// passable for a given agent mode: 'p' player/npc, 'm' monster
function passable(li, cx, cz, mode) {
  if (li < 0 || li >= NL || !inGrid(cx, cz)) return false;
  var L = MAP.lv[li], i = cidx(cx, cz), t = L.type[i];
  if (t === T_FLOOR || t === T_STAIR) return true;
  if (t === T_DOOR) { var d = MAP.doors[L.door[i]]; if (!d.locked) return true; return mode === 'm'; }
  return false;
}
function stairHeight(s, z) { var t = clamp((z - s.z0) / (s.z1 - s.z0), 0, 1); return s.yA + (s.yB - s.yA) * t; }
function floorY(li, x, z) {
  var cx = m2c(x), cz = m2r(z);
  if (!inGrid(cx, cz)) return LV_Y[li];
  var L = MAP.lv[li], i = cidx(cx, cz);
  if (L.type[i] === T_STAIR) return stairHeight(MAP.stairs[L.stair[i]], z);
  return LV_Y[li];
}
// after moving: re-evaluate the level of an agent standing on stairs
function resolveLevel(li, x, z) {
  var L = MAP.lv[li], cx = m2c(x), cz = m2r(z);
  if (!inGrid(cx, cz)) return li;
  var i = cidx(cx, cz);
  if (L.type[i] !== T_STAIR) return li;
  var s = MAP.stairs[L.stair[i]], y = stairHeight(s, z);
  var mid = (LV_Y[s.lo] + LV_Y[s.hi]) / 2;
  return y > mid ? s.hi : s.lo;
}
function roomAt(li, x, z) { var cx = m2c(x), cz = m2r(z); if (!inGrid(cx, cz)) return null; var r = MAP.lv[li].room[cidx(cx, cz)]; return r >= 0 ? MAP.rooms[r] : null; }

// line of sight on one level (vision): true if clear
function losClear(li, x0, z0, x1, z1) {
  var L = MAP.lv[li];
  var dx = x1 - x0, dz = z1 - z0, d = Math.sqrt(dx * dx + dz * dz);
  var steps = Math.ceil(d / (CELL * 0.5));
  for (var s = 1; s < steps; s++) {
    var t = s / steps, cx = m2c(x0 + dx * t), cz = m2r(z0 + dz * t);
    if (!inGrid(cx, cz)) return false;
    var i = cidx(cx, cz);
    if (L.opaque[i]) return false;
    if (L.type[i] === T_DOOR) { var dr = MAP.doors[L.door[i]]; if (dr.open < 0.5) return false; }
  }
  return true;
}
// walkable straight line (for path smoothing)
function walkClear(li, x0, z0, x1, z1, mode) {
  var dx = x1 - x0, dz = z1 - z0, d = Math.sqrt(dx * dx + dz * dz);
  var steps = Math.ceil(d / (CELL * 0.35));
  var nx = -dz / (d || 1) * 0.22, nz = dx / (d || 1) * 0.22;
  for (var s = 0; s <= steps; s++) {
    var t = s / steps, x = x0 + dx * t, z = z0 + dz * t;
    if (!passable(li, m2c(x + nx), m2r(z + nz), mode) || !passable(li, m2c(x - nx), m2r(z - nz), mode)) return false;
    if (cellAt(li, x, z) === T_STAIR) return false; // never shortcut across stairs
  }
  return true;
}

// A* over (level, cell). Returns array of {li,x,z}
var _heap = null;
function findPath(li0, x0, z0, li1, x1, z1, mode, maxIter) {
  var N = NX * NZ, NN = N * NL;
  if (!findPath.g) { findPath.g = new Float32Array(NN); findPath.came = new Int32Array(NN); findPath.stamp = new Uint32Array(NN); findPath.closed = new Uint32Array(NN); findPath.cur = 0; }
  var g = findPath.g, came = findPath.came, stamp = findPath.stamp, closed = findPath.closed;
  var tag = ++findPath.cur;
  var sx = m2c(x0), sz = m2r(z0), tx = m2c(x1), tz = m2r(z1);
  var start = li0 * N + cidx(sx, sz), goal = li1 * N + cidx(tx, tz);
  if (!passable(li1, tx, tz, mode)) { // goal blocked: find nearest passable neighbor
    var best = -1, bd = 1e9;
    for (var oz = -2; oz <= 2; oz++) for (var ox = -2; ox <= 2; ox++) if (passable(li1, tx + ox, tz + oz, mode)) { var dd = ox * ox + oz * oz; if (dd < bd) { bd = dd; best = li1 * N + cidx(tx + ox, tz + oz); } }
    if (best < 0) return null; goal = best; tx = goal % N % NX; tz = Math.floor(goal % N / NX);
  }
  var heap = [], hk = [];
  function push(n, f) { heap.push(n); hk.push(f); var i = heap.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; var t = heap[p]; heap[p] = heap[i]; heap[i] = t; t = hk[p]; hk[p] = hk[i]; hk[i] = t; i = p; } }
  function pop() { var top = heap[0], lastN = heap.pop(), lastK = hk.pop(); if (heap.length) { heap[0] = lastN; hk[0] = lastK; var i = 0, n = heap.length; for (;;) { var l = i * 2 + 1, r = l + 1, m = i; if (l < n && hk[l] < hk[m]) m = l; if (r < n && hk[r] < hk[m]) m = r; if (m === i) break; var t = heap[m]; heap[m] = heap[i]; heap[i] = t; t = hk[m]; hk[m] = hk[i]; hk[i] = t; i = m; } } return top; }
  stamp[start] = tag; g[start] = 0; came[start] = -1; push(start, 0);
  var gx = tx, gzz = tz, gl = li1, it = 0, found = false;
  maxIter = maxIter || 40000;
  var dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  while (heap.length && it++ < maxIter) {
    var n = pop();
    if (closed[n] === tag) continue; closed[n] = tag;
    if (n === goal) { found = true; break; }
    var l = Math.floor(n / N), c = n - l * N, cx = c % NX, cz = (c - cx) / NX;
    var L = MAP.lv[l];
    var isStair = L.type[c] === T_STAIR;
    for (var k = 0; k < 8; k++) {
      var nx = cx + dirs[k][0], nz = cz + dirs[k][1];
      if (!passable(l, nx, nz, mode)) continue;
      if (k >= 4 && (!passable(l, cx + dirs[k][0], cz, mode) || !passable(l, cx, cz + dirs[k][1], mode))) continue;
      var nn = l * N + cidx(nx, nz);
      var cost = g[n] + dirs[k][2];
      if (L.type[cidx(nx, nz)] === T_BLOCK) continue;
      if (stamp[nn] !== tag || cost < g[nn]) { stamp[nn] = tag; g[nn] = cost; came[nn] = n; var h = Math.abs(nx - gx) + Math.abs(nz - gzz) + Math.abs(l - gl) * 16; push(nn, cost + h); }
    }
    if (isStair) { // link to the same stair cell on the other level
      var s = MAP.stairs[L.stair[c]], ol = l === s.lo ? s.hi : s.lo;
      var on = ol * N + c;
      var cst = g[n] + 0.5;
      if (stamp[on] !== tag || cst < g[on]) { stamp[on] = tag; g[on] = cst; came[on] = n; push(on, cst + Math.abs(cx - gx) + Math.abs(cz - gzz) + Math.abs(ol - gl) * 16); }
    }
  }
  if (!found) return null;
  var pts = [], cur = goal;
  while (cur >= 0) { var ll = Math.floor(cur / N), cc = cur - ll * N; pts.push({ li: ll, x: c2x(cc % NX), z: r2z(Math.floor(cc / NX)) }); if (cur === start) break; cur = came[cur]; }
  pts.reverse();
  // fix level of stair points (choose by height) and smooth
  for (var i = 0; i < pts.length; i++) pts[i].li = resolveLevel(pts[i].li, pts[i].x, pts[i].z);
  var out = [pts[0]], a = 0;
  for (var j = 2; j < pts.length; j++) {
    var A = pts[a], B = pts[j];
    if (A.li !== B.li || !walkClear(A.li, A.x, A.z, B.x, B.z, mode)) { out.push(pts[j - 1]); a = j - 1; }
  }
  if (pts.length > 1) out.push(pts[pts.length - 1]);
  out.len = g[goal] * CELL;
  return out;
}
function pathLength(p) { var s = 0; for (var i = 1; i < p.length; i++) s += Math.sqrt(dist2(p[i].x, p[i].z, p[i - 1].x, p[i - 1].z)); return s; }

// spot where agents stand to reach a room: inside, near first unlocked door
function roomEntryPoint(r, allowLocked) {
  for (var k = 0; k < r.doors.length; k++) {
    var d = MAP.doors[r.doors[k]];
    if (d.locked && !allowLocked) continue;
    var inside = (r.cz > d.z) ? 1 : -1;
    if (d.axis === 'z') return { li: r.li, x: d.x, z: d.z + inside * 1.2 };
    var insx = (r.cx > d.x) ? 1 : -1; return { li: r.li, x: d.x + insx * 1.5, z: d.z };
  }
  return null;
}

// validate: every room the night may use is reachable for players without hall pass
function validateMap(M) {
  var pts = [];
  var lessonRooms = M.slots.filter(function (r) { return ROLE_INFO[r.role].lesson; });
  var ok = true;
  var bus = { li: 1, x: 33, z: -11 };
  var start = roomEntryPoint(M.cafe);
  if (!start) { M.valid = false; return; }
  lessonRooms.concat([M.cafe]).forEach(function (r) {
    if (!ok) return;
    var e = roomEntryPoint(r);
    if (!e) { ok = false; return; }
    var p = findPath(start.li, start.x, start.z, e.li, e.x, e.z, 'p');
    if (!p) ok = false;
    // every chair spot inside must be reachable from the door
    if (ok && r.chairs.length) {
      var c = r.chairs[0];
      if (!findPath(e.li, e.x, e.z, r.li, c.x, c.z, 'p')) ok = false;
    }
  });
  if (ok) { var pb = findPath(start.li, start.x, start.z, 1, bus.x, bus.z, 'p'); if (!pb) ok = false; }
  M.valid = ok;
}
