// ---- monsters: definitions, models, animation, AI -------------------------
var FACE_DEFS = {
  student0: { img: 8, cx: 0.54, cy: 0.58, rx: 0.27, ry: 0.44, eyes: [[0.37, 0.45], [0.70, 0.45]], nose: [0.55, 0.64], mouth: [0.53, 0.84], mouthW: 0.2, edge: [0.025, 0.025, 0.03], glow: 0.45 },
  crawler: { img: 27, cx: 0.52, cy: 0.5, rx: 0.3, ry: 0.42, eyes: [[0.39, 0.46], [0.64, 0.46]], nose: [0.53, 0.56], mouth: [0.52, 0.74], mouthW: 0.24, mouthDepth: 0.2, edge: [0.3, 0.29, 0.26], glow: 0.5 },
  gaper: { img: 2, cx: 0.53, cy: 0.52, rx: 0.38, ry: 0.48, eyes: [[0.31, 0.33], [0.75, 0.37]], nose: [0.52, 0.52], mouth: [0.52, 0.82], mouthW: 0.45, mouthH: 0.22, mouthDepth: 0.3, edge: [0.04, 0.04, 0.045], glow: 0.4 },
  smiles: { img: 29, cx: 0.52, cy: 0.56, rx: 0.45, ry: 0.5, eyes: [[0.32, 0.5], [0.73, 0.5]], nose: [0.53, 0.63], mouth: [0.53, 0.8], mouthW: 0.3, mouthDepth: 0.04, noseAmt: 0.6, edge: [0.08, 0.08, 0.075], glow: 0.55 },
  static: { img: 10, cx: 0.55, cy: 0.46, rx: 0.32, ry: 0.44, eyes: [[0.36, 0.38], [0.66, 0.36]], nose: [0.56, 0.6], mouth: [0.55, 0.72], mouthW: 0.2, edge: [0.01, 0.01, 0.02], glow: 0.9 },
  hoots: { img: 40, cx: 0.52, cy: 0.55, rx: 0.46, ry: 0.5, eyes: [[0.36, 0.26], [0.75, 0.44]], nose: [0.55, 0.5], mouth: [0.33, 0.85], mouthW: 0.3, mouthH: 0.2, mouthDepth: 0.28, edge: [0.07, 0.07, 0.07], glow: 0.5 }
};
var MONSTER_INFO = {
  student0: { name: 'STUDENT #0', ja: '生徒ゼロ番', file: 'SUBJECT #0 — STATUS: ENROLLED', fileJa: '被験者#0 ― 在籍中', desc: 'First test subject of PROJECT LULLABY (1990). Did not take a seat when the bell rang. Still waiting in the halls. DO NOT MAINTAIN EYE CONTACT.', descJa: 'PROJECT LULLABYの最初の被験者（1990年）。ベルが鳴っても席に着かなかった。今も廊下で待っている。目を合わせ続けてはいけない。', tip: 'Don\'t stare. Look away and break line of sight.', tipJa: '見つめない。目をそらして視界から外れること。' },
  crawler: { name: 'THE CRAWLER', ja: 'クローラー', file: 'SUBJECT #4 — STATUS: CRAWLING', fileJa: '被験者#4 ― 這行中', desc: 'Blind. Moves along ceilings. Hunts by sound alone. Former hall monitor (1991). Sensitive hearing reported by staff.', descJa: '目が見えない。天井を這う。音だけで獲物を探す。元・廊下当番（1991年）。', tip: 'Crouch-walk. Throw chalk to lure it away.', tipJa: 'しゃがんで歩く。チョークを投げて気をそらす。' },
  gaper: { name: 'THE GAPER', ja: 'ゲイパー', file: 'SUBJECT #9 — STATUS: SCREAMING', fileJa: '被験者#9 ― 絶叫中', desc: 'Black hollow eyes, split mouth. Its scream disrupts electrical equipment and calls the others.', descJa: '黒い穴の目と裂けた口。叫び声は電気機器を狂わせ、他の者を呼び寄せる。', tip: 'If it sees you, it screams: your flashlight dies. Hide fast.', tipJa: '見つかると叫ぶ。懐中電灯が消える。すぐ隠れろ。' },
  smiles: { name: 'MR. SMILES', ja: 'ミスター・スマイルズ', file: 'STAFF #12 — STATUS: ON DUTY', fileJa: '職員#12 ― 勤務中', desc: 'Night janitor. Always smiling. Staff note: "He only works when no one is watching."', descJa: '夜の用務員。いつも笑顔。職員メモ「誰も見ていない時だけ働く」。', tip: 'He moves only when you are not looking. Keep him in your light.', tipJa: '見ていない時だけ動く。ライトで照らし続けろ。' },
  static: { name: 'STATIC', ja: 'スタティック', file: 'TAPE #0 — STATUS: BROADCASTING', fileJa: 'テープ#0 ― 放送中', desc: 'Something recorded onto the master tape of Episode 0. Emerges from CRT screens. The picture gets worse when it is near.', descJa: '第0話のマスターテープに記録された何か。ブラウン管から出てくる。近いほど映像が乱れる。', tip: 'Stay away from switched-on TVs.', tipJa: '点いたテレビに近づかない。' },
  hoots: { name: 'PROFESSOR HOOTS', ja: 'プロフェッサー・フーツ', file: 'MASCOT #1 — STATUS: NEVER REMOVED', fileJa: 'マスコット#1 ― 一度も脱がれていない', desc: 'The suit must never be removed during broadcast. It has not been removed since 1993. Performer: unknown.', descJa: '放送中は着ぐるみを脱いではならない。1993年から一度も脱がれていない。中の人：不明。', tip: 'Hears well, sees well. Hide and hold your breath.', tipJa: '耳も目もいい。隠れて息を止めろ。' }
};
var MONSTERS = [];
var SKIN_CACHE = {};
function skinMat(key, base, opt) {
  var t = SKIN_CACHE[key] || (SKIN_CACHE[key] = toTex(texSkin(base, key.length * 13, opt)));
  return bakeMat({ map: t, vertexColors: true, shininess: 60, specular: new THREE.Color(0.25, 0.22, 0.2), skinning: true }, 'probe');
}

function buildMonsterModel(type) {
  var root = new THREE.Group(), R, mats = [], head = null, hair = null, extra = {};
  var T = rigTemplates();
  var def = FACE_DEFS[type];
  if (type === 'student0') {
    R = humanoidRig({ height: 1.62, thin: 0.72, shoulder: 0.85, armLen: 1.12, neckLen: 1.3 });
    var sk = [0.62, 0.64, 0.68];
    dressHumanoid(R, { skin: sk, shirt: [0.12, 0.13, 0.2], pants: [0.25, 0.25, 0.27], shoes: [0.1, 0.1, 0.1] }, { skirt: true, barefoot: true });
    R.part('chest', T.box, 0, 0.17 * R.s, 0.09 * R.s, 0.16 * R.s, 0.05 * R.s, 0.02, [0.85, 0.85, 0.8]); // collar
    var m = skinMat('s0skin', [170, 172, 182], { veins: 16, veinCol: '70,50,90', sores: 4, blood: 6 });
    mats.push(m); root.add(R.build(m));
    head = makeFaceHead(def, 0.145); head.position.set(0, 0.14 * R.s, 0.01);
    R.byName.head.add(head);
    hair = makeHair(0.145, { count: 220, len: 0.85, fringe: 26, fringeLen: 0.55, seed: 8 }); hair.position.copy(head.position); R.byName.head.add(hair);
  } else if (type === 'crawler') {
    R = humanoidRig({ height: 1.8, thin: 0.6, shoulder: 0.9, armLen: 1.5, legLen: 1.15, neckLen: 1.6 });
    var sk2 = [0.55, 0.57, 0.5];
    dressHumanoid(R, { skin: sk2, shirt: sk2, pants: [0.4, 0.38, 0.33], shoes: sk2 }, { barefoot: true, bareArms: true, claws: true });
    // ribs
    for (var rb = 0; rb < 5; rb++) R.part('chest', T.box, 0, 0.0 + rb * 0.04, 0.1 * R.s, 0.3 * R.s * 0.6, 0.012, 0.03, [0.7, 0.7, 0.62]);
    var m2 = skinMat('crawlskin', [150, 158, 140], { veins: 30, veinCol: '50,60,40', sores: 14, blood: 4 });
    mats.push(m2); root.add(R.build(m2));
    head = makeFaceHead(def, 0.155); head.position.set(0, 0.14 * R.s, 0.02); R.byName.head.add(head);
  } else if (type === 'gaper') {
    R = humanoidRig({ height: 2.15, thin: 0.62, shoulder: 0.9, armLen: 1.35, neckLen: 1.8 });
    var sk3 = [0.78, 0.78, 0.76];
    dressHumanoid(R, { skin: sk3, shirt: [0.6, 0.58, 0.52], pants: [0.6, 0.58, 0.52], shoes: sk3 }, { gown: true, barefoot: true, claws: true, longSleeve: false, bareArms: true });
    var m3 = skinMat('gapeskin', [200, 200, 196], { veins: 22, veinCol: '60,40,60', sores: 8, blood: 10 });
    mats.push(m3); root.add(R.build(m3));
    head = makeFaceHead(def, 0.18); head.position.set(0, 0.17 * R.s, 0.02); R.byName.head.add(head);
    hair = makeHair(0.18, { count: 70, len: 0.5, seed: 21 }); hair.position.copy(head.position); R.byName.head.add(hair);
  } else if (type === 'smiles') {
    R = humanoidRig({ height: 1.86, thin: 1.0, shoulder: 1.05, belly: true });
    var cov = [0.24, 0.3, 0.36];
    dressHumanoid(R, { skin: [0.85, 0.8, 0.72], shirt: cov, pants: cov, shoes: [0.08, 0.07, 0.06], gloves: [0.75, 0.6, 0.2] }, { gloves: true });
    R.part('chest', T.box, 0.09 * R.s, 0.12 * R.s, 0.11 * R.s, 0.07, 0.03, 0.005, [0.9, 0.9, 0.9]); // name tag
    R.part('hips', T.box, 0.2 * R.s, -0.02, 0, 0.04, 0.12, 0.12, [0.5, 0.5, 0.52]); // keys
    var m4 = skinMat('smileskin', [150, 160, 170], { veins: 4, sores: 2, blood: 3 });
    mats.push(m4); root.add(R.build(m4));
    head = makeFaceHead(def, 0.155); head.position.set(0, 0.14 * R.s, 0.01); R.byName.head.add(head);
    // mop bucket + mop (separate group so it can lag behind)
    var bucket = new THREE.Group();
    var bm = bakeMat({ color: 0xd6b02a, shininess: 30 }, 'probe'); mats.push(bm);
    var b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 12), bm); b1.position.y = 0.25; bucket.add(b1);
    var mopm = bakeMat({ color: 0x6d6a60, shininess: 5 }, 'probe'); mats.push(mopm);
    var mop = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6), mopm); mop.position.set(0.1, 0.8, 0); mop.rotation.z = 0.25; bucket.add(mop);
    var mh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.12), mopm); mh.position.set(0.25, 0.2, 0); bucket.add(mh);
    extra.bucket = bucket;
  } else if (type === 'static') {
    R = humanoidRig({ height: 1.75, thin: 0.8, armLen: 1.1 });
    var dk = [0.06, 0.06, 0.08];
    dressHumanoid(R, { skin: dk, shirt: dk, pants: dk, shoes: dk }, {});
    var m5 = bakeMat({ vertexColors: true, shininess: 80, specular: new THREE.Color(0.3, 0.35, 0.4), skinning: true, transparent: true, opacity: 0.92, emissive: new THREE.Color(0.02, 0.03, 0.05) }, 'probe', {
      key: 'static', vbody: 'transformed.x += (fract(sin(floor(position.y * 30.0) + floor(uTime * 24.0)) * 43758.5) - 0.5) * 0.06;\n'
    });
    mats.push(m5); root.add(R.build(m5));
    head = makeFaceHead(def, 0.155); head.position.set(0, 0.14 * R.s, 0.01); R.byName.head.add(head);
  } else if (type === 'hoots') {
    R = humanoidRig({ height: 1.9, thin: 1.25, shoulder: 1.1 });
    var fur = [0.55, 0.36, 0.2], belly = [0.95, 0.88, 0.7];
    var s = R.s;
    // costume body: big round torso
    R.part('spine', T.sph, 0, 0.18 * s, 0.02, 0.36 * s, 0.46 * s, 0.32 * s, fur);
    R.part('spine', T.sph, 0, 0.16 * s, 0.2 * s, 0.24 * s, 0.32 * s, 0.14 * s, belly);
    ['L', 'R'].forEach(function (sd) {
      R.part('ua' + sd, T.sph, 0, -0.18 * s, 0, 0.11 * s, 0.24 * s, 0.07 * s, fur);
      R.part('fa' + sd, T.sph, 0, -0.16 * s, 0, 0.1 * s, 0.2 * s, 0.06 * s, fur);
      R.part('hand' + sd, T.sph, 0, -0.05 * s, 0, 0.06 * s, 0.07 * s, 0.04 * s, [0.3, 0.2, 0.12]);
      R.limb('th' + sd, 0.43 * s, 0.11 * s, 0.09 * s, fur);
      R.limb('sn' + sd, 0.43 * s, 0.08 * s, 0.07 * s, [0.9, 0.55, 0.15]);
      R.part('ft' + sd, T.box, 0, -0.03 * s, 0.08 * s, 0.16 * s, 0.07 * s, 0.3 * s, [0.95, 0.55, 0.15]);
    });
    R.part('neck', T.cyl, 0, 0.04, 0, 0.06, 0.1, 0.06, [0.45, 0.42, 0.4]);
    var furT = SKIN_CACHE.fur || (SKIN_CACHE.fur = toTex(texFur([150, 100, 60], 5)));
    var m6 = bakeMat({ map: furT, vertexColors: true, shininess: 4, specular: new THREE.Color(0.02, 0.02, 0.02), skinning: true }, 'probe');
    mats.push(m6); root.add(R.build(m6));
    // true face underneath (inside the suit's neck)
    head = makeFaceHead(def, 0.16); head.position.set(0, 0.13, 0.05); R.byName.head.add(head);
    // costume head (separate group, pivots back to reveal)
    var ch = new THREE.Group(); ch.position.set(0, 0.02, -0.12);
    var cm = bakeMat({ map: furT, color: 0xffffff, shininess: 4 }, 'probe'); mats.push(cm);
    var big = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), cm); big.scale.set(1, 0.92, 0.9); big.position.set(0, 0.2, 0.12); ch.add(big);
    var wm = bakeMat({ color: 0xf6f2e6, shininess: 40 }, 'probe'), ym = bakeMat({ color: 0xf2c33c, shininess: 30 }, 'probe'), km = bakeMat({ color: 0x111111, shininess: 90, specular: new THREE.Color(0.6, 0.6, 0.6) }, 'probe'), om = bakeMat({ color: 0xee8822, shininess: 40 }, 'probe'), bl = bakeMat({ color: 0x1f3c88, shininess: 20 }, 'probe');
    mats.push(wm, ym, km, om, bl);
    [-1, 1].forEach(function (sd) {
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 20), ym); ring.rotation.x = PI / 2; ring.position.set(sd * 0.13, 0.27, 0.4); ch.add(ring);
      var eye = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.05, 20), wm); eye.rotation.x = PI / 2; eye.position.set(sd * 0.13, 0.27, 0.42); ch.add(eye);
      var pup = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), km); pup.scale.z = 0.4; pup.position.set(sd * 0.13, 0.26, 0.45); ch.add(pup); extra['pupil' + sd] = pup;
      var tuft = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 6), cm); tuft.position.set(sd * 0.22, 0.52, 0.12); tuft.rotation.z = -sd * 0.4; ch.add(tuft);
    });
    var beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), om); beak.rotation.x = PI / 2 + 0.6; beak.position.set(0, 0.14, 0.43); ch.add(beak);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.62), bl); cap.position.set(0, 0.52, 0.1); cap.rotation.y = PI / 4; ch.add(cap);
    var capb = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.1, 16), bl); capb.position.set(0, 0.47, 0.1); ch.add(capb);
    var tas = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.02), ym); tas.position.set(0.25, 0.43, 0.2); ch.add(tas);
    R.byName.neck.add(ch);
    extra.costumeHead = ch;
  }
  root.add(R.mesh);
  if (extra.bucket) root.add(extra.bucket);
  mats.push(head.material); if (hair) mats.push(hair.material);
  root.traverse(function (o) { o.castShadow = true; });
  return { root: root, rig: R, mats: mats, head: head, hair: hair, extra: extra };
}

// ---- animation helpers --------------------------------------------------------
function poseReset(R) { for (var i = 0; i < R.bones.length; i++) R.bones[i].rotation.copy(R.rest[i]); }
function animWalk(R, ph, amt, opt) {
  opt = opt || {};
  var B = R.byName, sw = Math.sin(ph), cw = Math.cos(ph);
  var a = amt * (opt.stride || 0.55);
  B.thL.rotation.x = -sw * a; B.thR.rotation.x = sw * a;
  B.snL.rotation.x = Math.max(0, cw) * a * 1.3; B.snR.rotation.x = Math.max(0, -cw) * a * 1.3;
  B.ftL.rotation.x = -0.1 * amt; B.ftR.rotation.x = -0.1 * amt;
  var arm = opt.armSwing != null ? opt.armSwing : 0.6;
  B.uaL.rotation.x = sw * a * arm; B.uaR.rotation.x = -sw * a * arm;
  B.faL.rotation.x = -0.25 - Math.max(0, sw) * 0.3 * amt; B.faR.rotation.x = -0.25 - Math.max(0, -sw) * 0.3 * amt;
  B.uaL.rotation.z = 0.08; B.uaR.rotation.z = -0.08;
  B.hips.position.y = R.bones[0].userData.y0 + Math.abs(cw) * 0.04 * amt;
  B.spine.rotation.x = (opt.lean || 0) * amt;
  B.chest.rotation.y = sw * 0.08 * amt;
}
function animIdle(R, t, opt) {
  var B = R.byName; opt = opt || {};
  B.chest.rotation.x = Math.sin(t * 1.3) * 0.02;
  B.uaL.rotation.z = 0.1 + Math.sin(t * 0.9) * 0.02; B.uaR.rotation.z = -0.1 - Math.sin(t * 0.9) * 0.02;
  B.hips.position.y = R.bones[0].userData.y0;
}
function animCrawl(R, ph, amt, onCeil) {
  var B = R.byName, sw = Math.sin(ph), cw = Math.cos(ph);
  B.hips.rotation.x = 1.25;
  B.hips.position.y = 0.55;
  B.spine.rotation.x = 0.15; B.chest.rotation.x = 0.1;
  B.neck.rotation.x = -1.1; B.head.rotation.x = -0.35;
  B.uaL.rotation.x = -1.5 + sw * 0.5 * amt; B.uaR.rotation.x = -1.5 - sw * 0.5 * amt;
  B.uaL.rotation.z = 0.35; B.uaR.rotation.z = -0.35;
  B.faL.rotation.x = -0.5 - Math.max(0, cw) * 0.6 * amt; B.faR.rotation.x = -0.5 - Math.max(0, -cw) * 0.6 * amt;
  B.thL.rotation.x = -1.0 - sw * 0.45 * amt; B.thR.rotation.x = -1.0 + sw * 0.45 * amt;
  B.thL.rotation.z = 0.3; B.thR.rotation.z = -0.3;
  B.snL.rotation.x = 1.6 + Math.max(0, -cw) * 0.5 * amt; B.snR.rotation.x = 1.6 + Math.max(0, cw) * 0.5 * amt;
}

// ---- monster entity --------------------------------------------------------------
function spawnMonster(type, li, x, z, opt) {
  var mdl = buildMonsterModel(type);
  mdl.rig.bones[0].userData.y0 = mdl.rig.bones[0].position.y;
  var m = {
    type: type, mdl: mdl, li: li, x: x, z: z, y: floorY(li, x, z), yaw: R.range(0, TAU), state: 'patrol', t: 0, stateT: 0,
    path: null, pathI: 0, repath: 0, target: null, speed: 0, ph: 0, seen: 0, lastSeen: null, probeT: 0, voiceT: R.range(2, 6),
    stare: 0, ceil: false, ceilAmt: 0, alpha: 1, visible: true, active: true, raid: false, frozen: false, screamT: 0, reveal: 0, jaw: 0,
    hearMul: 1, home: null, watcher: !!(opt && opt.watcher), checkHide: null, lungeT: 0, killNPC: null, tv: null, leaveT: 0, life: 0
  };
  m.mdl.root.position.set(x, m.y, z);
  RENDER.scene.add(m.mdl.root);
  MONSTERS.push(m);
  if (type === 'crawler') { m.ceil = true; m.ceilAmt = 1; m.hearMul = 1.6; }
  if (type === 'hoots') m.hearMul = 1.25;
  if (type === 'static') { m.state = 'dormant'; m.mdl.root.visible = false; m.visible = false; }
  if (m.watcher) m.state = 'watch';
  SAVE.monsters[type] = SAVE.monsters[type] || 1;
  return m;
}
function removeMonster(m) {
  RENDER.scene.remove(m.mdl.root);
  m.mdl.root.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
  m.mdl.mats.forEach(function (mt) { mt.dispose(); });
  var i = MONSTERS.indexOf(m); if (i >= 0) MONSTERS.splice(i, 1);
}
function clearMonsters() { while (MONSTERS.length) removeMonster(MONSTERS[0]); }

var MSPEED = { student0: [1.0, 4.7], crawler: [1.4, 4.1], gaper: [1.2, 3.7], smiles: [0, 3.1], static: [0, 3.9], hoots: [1.4, 3.95] };
function camForward() { return { x: -Math.sin(PL.yaw) * Math.cos(PL.pitch), y: Math.sin(PL.pitch), z: -Math.cos(PL.yaw) * Math.cos(PL.pitch) }; }
function playerHeadPos() { return { x: PL.x, y: PL.y + PL.eye, z: PL.z }; }
// how visible is the player to monster m (0..1)
function monsterSees(m, tx, tz, tli, targetIsPlayer) {
  if (tli !== m.li) return 0;
  var dx = tx - m.x, dz = tz - m.z, d = Math.sqrt(dx * dx + dz * dz);
  if (m.type === 'crawler') return 0; // blind
  var lit = LIGHTU.uMix.value > 0.5;
  var range = lit ? 22 : 8.5;
  if (targetIsPlayer) {
    if (PL.flash) range = 18;
    if (PL.crouch && !PL.flash) range *= 0.55;
    if (PL.hidden || PL.seated && !m.raid) return 0;
  }
  if (d > range) return 0;
  var fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
  var dot = (dx * fx + dz * fz) / (d || 1);
  if (d > 2.2 && dot < 0.25) return 0;
  if (!losClear(m.li, m.x, m.z, tx, tz)) return 0;
  return 1 - d / range * 0.5;
}
function playerLooksAt(m, maxAngle, maxDist) {
  if (m.li !== PL.li || !m.visible) return false;
  var hp = playerHeadPos(), dx = m.x - hp.x, dy = (m.y + 1.4) - hp.y, dz = m.z - hp.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (d > (maxDist || 20)) return false;
  var f = camForward(); var dot = (dx * f.x + dy * f.y + dz * f.z) / d;
  if (dot < Math.cos(maxAngle)) return false;
  if (!losClear(m.li, hp.x, hp.z, m.x, m.z)) return false;
  // in the dark you only "see" it when lit, close, or with the flashlight
  if (LIGHTU.uMix.value < 0.5 && !PL.flash && d > 6) return m.type === 'student0' ? d < 11 : false;
  return true;
}
function randomPatrolPoint(li, rnd) {
  rnd = rnd || R;
  var rooms = MAP.rooms.filter(function (r) { return r.li === li && r.role !== 'OUTSIDE' && r.role !== 'BUS'; });
  for (var k = 0; k < 20; k++) {
    var r = rnd.pick(rooms), x = rnd.range(r.x0 + 0.6, r.x1 - 0.6), z = rnd.range(r.z0 + 0.6, r.z1 - 0.6);
    if (passable(li, m2c(x), m2r(z), 'm') && cellType(li, m2c(x), m2r(z)) !== T_STAIR) return { li: li, x: x, z: z };
  }
  return { li: li, x: 30, z: 11.25 };
}
function monsterGoto(m, li, x, z) {
  var p = findPath(m.li, m.x, m.z, li, x, z, 'm', 30000);
  m.path = p; m.pathI = 1; m.target = { li: li, x: x, z: z };
  return !!p;
}
function followPath(m, spd, dt) {
  if (!m.path || m.pathI >= m.path.length) return true;
  var p = m.path[m.pathI];
  var dx = p.x - m.x, dz = p.z - m.z, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 0.25) { m.pathI++; if (m.pathI >= m.path.length) return true; return false; }
  var step = Math.min(d, spd * dt);
  m.x += dx / d * step; m.z += dz / d * step;
  var ty = Math.atan2(dx, dz);
  m.yaw += angDiff(m.yaw, ty) * Math.min(1, dt * 8);
  m.li = resolveLevel(m.li, m.x, m.z);
  if (p.li !== m.li && cellType(m.li, m2c(m.x), m2r(m.z)) !== T_STAIR) m.li = p.li;
  m.speed = spd;
  return false;
}
function hearNoises(m) {
  var best = null, bs = 0;
  for (var i = 0; i < NOISES.length; i++) {
    var n = NOISES[i]; if (n.src === 'monster') continue;
    var sameL = n.li === m.li, d = Math.sqrt(dist2(n.x, n.z, m.x, m.z));
    var r = n.r * m.hearMul * (sameL ? 1 : 0.35);
    if (d < r) { var s = (1 - d / r) * n.r; if (s > bs) { bs = s; best = n; } }
  }
  return best;
}

function updateMonsters(dt) {
  for (var i = MONSTERS.length - 1; i >= 0; i--) { var m = MONSTERS[i]; if (m.active) updateMonster(m, dt); }
  NOISES.length = 0;
}
function updateMonster(m, dt) {
  m.t += dt; m.stateT += dt; m.life += dt;
  var spd = MSPEED[m.type] || [1, 3.5];
  var dark = LIGHTU.uMix.value < 0.5 || m.raid;
  if (m.grace > 0) { m.grace -= dt; dark = false; }
  var dp = Math.sqrt(dist2(m.x, m.z, PL.x, PL.z)), samePL = m.li === PL.li;
  var sees = dark ? monsterSees(m, PL.x, PL.z, PL.li, true) : 0;
  if (sees > 0) { m.lastSeen = { li: PL.li, x: PL.x, z: PL.z, t: m.t }; }
  var heard = dark ? hearNoises(m) : null;
  var moved = false, wantSpeed = 0;
  if (m.watcher) { monsterWatcher(m, dt, dp); finishMonster(m, dt); return; }
  // type specific overrides
  switch (m.type) {
    case 'student0':
      if (m.state === 'patrol' || m.state === 'stand') {
        if (playerLooksAt(m, 0.22, 18)) { m.stare += dt; if (m.stare > 0.15 && !m._noticeSfx) { m._noticeSfx = true; sfx('whisper', mpos(m)); } }
        else m.stare = Math.max(0, m.stare - dt * 0.6);
        if (m.stare > 1.0 || (samePL && dp < 2.6 && !PL.hidden)) { setState(m, 'tilt'); sfx('giggle', mpos(m)); }
      }
      break;
    case 'smiles':
      m.frozen = dark && samePL && playerLooksAt(m, 0.62, 30) && (PL.flash || dp < 5 || LIGHTU.uMix.value > 0.5);
      break;
  }
  if (m.state === 'patrol') {
    if (sees > 0.0 && m.type !== 'student0' && m.type !== 'smiles') { onSpotPlayer(m); }
    else if (heard) { setState(m, 'investigate'); monsterGoto(m, heard.li, heard.x, heard.z); if (m.type === 'crawler') sfx('clicks', mpos(m), { n: 14 }); }
    else {
      if (!m.path || m.pathI >= m.path.length || m.stateT > 25) {
        if (m.type === 'student0' && R() < 0.5 && m.stateT > 2) { setState(m, 'stand'); }
        else { var pp = randomPatrolPoint(R() < 0.75 ? m.li : R.pick([0, 1, 2].filter(function (l) { return l !== 0 || m.type === 'crawler'; })), R); monsterGoto(m, pp.li, pp.x, pp.z); m.stateT = 0; }
      }
      wantSpeed = spd[0];
      if (m.type === 'smiles') wantSpeed = m.frozen ? 0 : 1.4;
      followPath(m, wantSpeed, dt); moved = wantSpeed > 0;
    }
    if (m.type === 'smiles' && !m.frozen && m.stateT > 3 && dp < 40) { setState(m, 'stalk'); }
  } else if (m.state === 'stand') {
    if (sees > 0 && dp < 7) { m.yaw += angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)) * dt * 1.5; }
    if (m.stateT > R.range(6, 14)) setState(m, 'patrol');
    if (heard && heard.r > 6) { setState(m, 'investigate'); monsterGoto(m, heard.li, heard.x, heard.z); }
  } else if (m.state === 'tilt') {
    m.yaw += angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)) * dt * 6;
    if (m.stateT > 0.9) { setState(m, 'chase'); sfx('scream', mpos(m), { len: 0.8, pitch: 1.5 }); }
  } else if (m.state === 'scream') {
    m.yaw += angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)) * dt * 6;
    m.jaw = Math.min(1, m.jaw + dt * 4);
    if (m.stateT > 1.8) setState(m, 'chase');
  } else if (m.state === 'chase' || m.state === 'stalk') {
    var tgt = m.lastSeen;
    if (m.state === 'stalk' || m.type === 'smiles') tgt = { li: PL.li, x: PL.x, z: PL.z, t: m.t };
    if (m.type === 'crawler') { tgt = heard ? { li: heard.li, x: heard.x, z: heard.z, t: m.t } : (m._lastHeard || tgt); if (heard) m._lastHeard = tgt; }
    if (tgt) {
      m.repath -= dt;
      if (m.repath <= 0 || !m.path) { monsterGoto(m, tgt.li, tgt.x, tgt.z); m.repath = 0.6; }
      wantSpeed = spd[1];
      if (m.type === 'smiles') wantSpeed = m.frozen ? 0 : (dp > 12 ? 4.2 : spd[1]);
      if (m.type === 'static') { wantSpeed = spd[1] * (0.6 + 0.6 * (Math.sin(m.t * 9) > 0 ? 1 : 0)); }
      var arrived = followPath(m, wantSpeed, dt); moved = wantSpeed > 0;
      if (arrived && (m.type !== 'smiles')) { setState(m, 'search'); }
    }
    if (m.type !== 'smiles' && m.type !== 'crawler' && m.lastSeen && m.t - m.lastSeen.t > (m.type === 'student0' ? 3 : 5)) setState(m, 'search');
    if (m.type === 'crawler' && m.stateT > 10 && !heard) setState(m, 'search');
    if (m.type === 'static' && m.stateT > 12) { staticVanish(m); }
    if (m.type === 'smiles' && dp > 45) { smilesTeleport(m); }
  } else if (m.state === 'investigate') {
    if (sees > 0 && m.type !== 'student0' && m.type !== 'smiles') onSpotPlayer(m);
    else {
      if (heard && m.repath <= 0) { monsterGoto(m, heard.li, heard.x, heard.z); m.repath = 1; }
      m.repath -= dt;
      var arr = followPath(m, m.type === 'crawler' ? 3.6 : spd[0] * 1.6, dt); moved = true;
      if (arr) setState(m, 'search');
    }
  } else if (m.state === 'search') {
    // look around, maybe check a nearby hiding spot
    m.yaw += Math.sin(m.stateT * 2.2) * dt * 1.6;
    if (sees > 0 && m.type !== 'smiles') onSpotPlayer(m);
    if (!m.checkHide && m.stateT > 1.0) {
      var hs = nearestHide(m, 5);
      if (hs && R() < (PL.hidden === hs ? 0.85 : 0.4)) { m.checkHide = hs; monsterGoto(m, hs.li, hs.ex, hs.ez); }
    }
    if (m.checkHide) {
      var a2 = followPath(m, spd[0] * 1.3, dt); moved = true;
      if (a2) { inspectHide(m, m.checkHide); m.checkHide = null; }
    }
    if (m.stateT > 7 && !m.checkHide) { setState(m, 'patrol'); m.path = null; }
  } else if (m.state === 'raid') {
    updateRaidMonster(m, dt); moved = m.speed > 0.1;
  } else if (m.state === 'leave') {
    var la = followPath(m, spd[0] * 1.5, dt); moved = true;
    if (la || m.stateT > 12) { m.active = false; m.mdl.root.visible = false; m.gone = true; }
  } else if (m.state === 'dormant') {
    if (m.type === 'static') staticDormant(m, dt, dp);
  } else if (m.state === 'flinch') {
    if (m.stateT > 2.2) { setState(m, 'leave'); var far = randomPatrolPoint(m.li); monsterGoto(m, far.li, far.x, far.z); }
  }
  if (!moved) m.speed = damp(m.speed, 0, 8, dt);
  // NPC hunting
  if (dark && m.state !== 'dormant' && m.state !== 'flinch' && m.state !== 'leave' && m.active) monsterHuntNPCs(m, dt);
  // catch player
  if (dark && m.active && m.visible && samePL && !PL.hidden && PL.alive && m.state !== 'dormant' && m.state !== 'flinch' && m.state !== 'leave' && m.state !== 'tilt' && m.state !== 'scream' && !(m.type === 'smiles' && m.frozen)) {
    var dy = Math.abs((m.y) - PL.y);
    var reach = m.type === 'crawler' ? 1.2 : 0.95;
    if (dp < reach && dy < 1.5 && !(PL.seated && !m.raid)) { onMonsterCatch(m); }
    else if (m.type === 'crawler' && dp < 2.2 && dy < 1.5 && !PL.breath && PL.moving && !(PL.seated && !m.raid)) { onMonsterCatch(m); }
  }
  finishMonster(m, dt);
}
function mpos(m) { return { li: m.li, x: m.x, z: m.z, y: m.y + 1.4 }; }
function setState(m, s) { m.state = s; m.stateT = 0; if (s !== 'stand') m._noticeSfx = false; if (s === 'chase') m.repath = 0; if (s !== 'scream') m.jaw = 0; }
function onSpotPlayer(m) {
  if (m.type === 'gaper' && m.screamT <= 0) {
    setState(m, 'scream'); m.screamT = 14;
    sfx('scream', mpos(m), { len: 2.0, pitch: 0.75 }); sfx('staticBurst', null, { len: 0.6 });
    PL.flashDead = 6; if (PL.flash) { PL.flash = false; showToast('YOUR FLASHLIGHT DIED', 'ライトが消えた！'); }
    MONSTERS.forEach(function (o) { if (o !== m && o.active && o.state !== 'dormant' && !o.watcher) { o.lastSeen = { li: PL.li, x: PL.x, z: PL.z, t: o.t }; setState(o, o.type === 'crawler' ? 'investigate' : 'chase'); if (o.type === 'crawler') monsterGoto(o, PL.li, PL.x, PL.z); } });
    return;
  }
  if (m.state !== 'chase') { setState(m, 'chase'); sfx(m.type === 'hoots' ? 'hootBad' : 'growl', mpos(m), { len: 1.0, pitch: m.type === 'hoots' ? 0.8 : 1 }); }
}
function nearestHide(m, r) {
  var best = null, bd = r * r;
  for (var i = 0; i < MAP.hides.length; i++) { var h = MAP.hides[i]; if (h.li !== m.li) continue; var d = dist2(h.x, h.z, m.x, m.z); if (d < bd) { bd = d; best = h; } }
  return best;
}
function inspectHide(m, h) {
  m.yaw = Math.atan2(h.x - m.x, h.z - m.z);
  if (h.type === 'locker') sfx('lockerOpen', { li: h.li, x: h.x, z: h.z });
  if (PL.hidden === h) {
    if (PL.breath && !PL.sawHide && R() < 0.75) { sfx('breathM', mpos(m), { v: 0.4 }); showToast('...', '（息を殺した…）'); return; }
    onMonsterCatch(m);
  }
}
function monsterHuntNPCs(m, dt) {
  if (typeof NPCS === 'undefined') return;
  for (var i = 0; i < NPCS.length; i++) {
    var n = NPCS[i]; if (!n.alive || n.seated || n.hidden || n.li !== m.li || n.state === 'raidHide' || m.raid) continue;
    var d = Math.sqrt(dist2(n.x, n.z, m.x, m.z));
    if (d < 0.9 && (GAME.monKills || 0) < (GAME.night >= 3 ? 2 : 1) && m.state !== 'patrol') { GAME.monKills = (GAME.monKills || 0) + 1; npcKilled(n, m); setState(m, 'search'); return; }
    if (m.state === 'patrol' && d < 7 && m.type !== 'smiles' && (m.type === 'crawler' ? n.running : losClear(m.li, m.x, m.z, n.x, n.z))) { monsterGoto(m, n.li, n.x, n.z); m.state = 'investigate'; m.stateT = 0; }
  }
}
function smilesTeleport(m) {
  // reappear somewhere behind the player, out of sight
  for (var k = 0; k < 30; k++) {
    var p = randomPatrolPoint(PL.li);
    var d = Math.sqrt(dist2(p.x, p.z, PL.x, PL.z));
    if (d > 14 && d < 28 && !playerLooksAtPoint(p)) { m.li = p.li; m.x = p.x; m.z = p.z; m.path = null; return; }
  }
}
function playerLooksAtPoint(p) { var f = camForward(); var dx = p.x - PL.x, dz = p.z - PL.z, d = Math.sqrt(dx * dx + dz * dz); return (dx * f.x + dz * f.z) / d > 0.3 && losClear(PL.li, PL.x, PL.z, p.x, p.z); }
// Static lives in TVs
function staticDormant(m, dt, dp) {
  m.tvT = (m.tvT || R.range(6, 12)) - dt;
  if (m.tv) {
    m.tv.mesh.material.uniforms.uOn.value = 1; m.tv.mesh.material.uniforms.uFaceAmt.value = (Math.sin(m.t * 13) > 0.85) ? 0.8 : 0;
    var d = Math.sqrt(dist2(m.tv.x, m.tv.z, PL.x, PL.z));
    if (m.tv.li === PL.li && d < 7 && LIGHTU.uMix.value < 0.5) { // emerge
      m.li = m.tv.li; var fx = Math.sin(m.tv.rot), fz = Math.cos(m.tv.rot);
      m.x = m.tv.x + fx * 0.9; m.z = m.tv.z + fz * 0.9; m.yaw = m.tv.rot; m.visible = true; m.mdl.root.visible = true;
      m.lastSeen = { li: PL.li, x: PL.x, z: PL.z, t: m.t }; setState(m, 'chase'); sfx('staticBurst', mpos(m), { len: 1.4 }); sfx('scream', mpos(m), { len: 1.0, pitch: 1.3 });
      return;
    }
    if (m.tvT < 0) { tvOff(m.tv); m.tv = null; m.tvT = R.range(5, 12); }
  } else if (m.tvT < 0) {
    var tvs = WORLD.specials.tvs.filter(function (t) { return t.li === PL.li; });
    if (tvs.length) { tvs.sort(function (a, b) { return dist2(a.x, a.z, PL.x, PL.z) - dist2(b.x, b.z, PL.x, PL.z); }); m.tv = tvs[Math.min(tvs.length - 1, R.int(0, 1))]; sfx('staticBurst', { li: m.tv.li, x: m.tv.x, z: m.tv.z }, { len: 2.5 }); }
    m.tvT = R.range(10, 16);
  }
}
function tvOff(tv) { tv.mesh.material.uniforms.uOn.value = 0; tv.mesh.material.uniforms.uFaceAmt.value = 0; }
function staticVanish(m) { sfx('staticBurst', mpos(m), { len: 0.5 }); m.visible = false; m.mdl.root.visible = false; setState(m, 'dormant'); if (m.tv) { tvOff(m.tv); m.tv = null; } m.tvT = R.range(8, 14); }
// harmless watcher (Hoots in the dark on early nights)
function monsterWatcher(m, dt, dp) {
  m.yaw = m.yaw; // body still
  var h = m.mdl.rig.byName.neck;
  var target = Math.atan2(PL.x - m.x, PL.z - m.z) - m.yaw;
  m._neck = damp(m._neck || 0, clamp(angDiff(0, target), -1.4, 1.4), 1.2, dt);
  if (m.li === PL.li && dp < 7) { if (!playerLooksAt(m, 0.7, 30)) { m.active = false; m.mdl.root.visible = false; sfx('whisper', mpos(m)); } }
}
function finishMonster(m, dt) {
  var mdl = m.mdl, R2 = mdl.rig;
  if (m.screamT > 0) m.screamT -= dt;
  var fy = floorY(m.li, m.x, m.z);
  m.y = damp(m.y, fy, 12, dt);
  // crawler ceiling
  var ceilY = LV_Y[m.li] + 3.15;
  var cell = cidx(m2c(m.x), m2r(m.z)), L = MAP.lv[m.li];
  if (L.ceil[cell] > 0) ceilY = LV_Y[m.li] + L.ceil[cell] - 0.05;
  if (m.type === 'crawler') {
    var wantCeil = (m.state === 'patrol') && L.type[cell] !== T_STAIR && L.type[cell] !== T_DOOR;
    m.ceilAmt = damp(m.ceilAmt, wantCeil ? 1 : 0, 3, dt);
  }
  var root = mdl.root;
  root.position.set(m.x, lerp(m.y, ceilY, m.ceilAmt), m.z);
  root.rotation.set(0, m.yaw, 0);
  if (m.ceilAmt > 0.01) root.rotation.z = m.ceilAmt * PI;
  // animation
  poseReset(R2);
  var spd = m.speed;
  m.ph += dt * (2.2 + spd * 2.4);
  var T = m.t;
  if (m.type === 'crawler') animCrawl(R2, m.ph, Math.min(1, spd / 2 + 0.15));
  else if (spd > 0.15) animWalk(R2, m.ph, Math.min(1.25, spd / 2.6), { lean: m.type === 'student0' ? 0.3 : 0.15, armSwing: m.type === 'student0' && m.state === 'chase' ? 1.6 : 0.6, stride: m.type === 'gaper' ? 0.4 : 0.55 });
  else animIdle(R2, T);
  var B = R2.byName;
  // head behaviours
  if (m.type === 'student0') {
    if (m.state === 'stand' || m.state === 'patrol') { B.head.rotation.z = Math.sin(T * 0.4) * 0.06; B.neck.rotation.x = 0.3; }
    if (m.state === 'tilt') { B.head.rotation.z = smooth(m.stateT / 0.8) * 1.25; B.neck.rotation.z = smooth(m.stateT / 0.8) * 0.4; }
    if (m.state === 'chase') { B.head.rotation.z = 1.0 + Math.sin(T * 17) * 0.15; B.uaL.rotation.x = -1.5 + Math.sin(m.ph * 2) * 0.6; B.uaR.rotation.x = -1.3 - Math.sin(m.ph * 2) * 0.6; }
  } else if (m.type === 'gaper') {
    B.neck.rotation.x = 0.45; B.head.rotation.x = -0.2 + Math.sin(T * 0.7) * 0.05;
    if (Math.sin(T * 1.3) > 0.97) B.head.rotation.z = (R() - 0.5) * 0.8;
  } else if (m.type === 'smiles') {
    if (m.frozen) { /* keep last pose */ if (m._frozenPose) { for (var i = 0; i < R2.bones.length; i++) R2.bones[i].rotation.copy(m._frozenPose[i]); } }
    else m._frozenPose = R2.bones.map(function (b) { return b.rotation.clone(); });
    B.head.rotation.z = 0.18; B.uaR.rotation.x = -0.9; B.faR.rotation.x = -0.6;
    if (mdl.extra.bucket) { var bk = mdl.extra.bucket; bk.position.set(m.x + Math.sin(m.yaw) * 0.9 + Math.cos(m.yaw) * 0.3, m.y, m.z + Math.cos(m.yaw) * 0.9 - Math.sin(m.yaw) * 0.3); bk.rotation.y = m.yaw; }
    if (!m.frozen && spd > 0.2) { m._sq = (m._sq || 0) - dt; if (m._sq < 0) { m._sq = R.range(1.2, 2.5); sfx('squeak', mpos(m)); } }
  } else if (m.type === 'hoots') {
    var ch = mdl.extra.costumeHead;
    var rev = m.watcher ? 0 : (m.state === 'chase' || m.state === 'raid' || m.state === 'scream' ? 1 : (m.reveal || 0) * 0.3);
    m._rev = damp(m._rev || 0, rev, 2.5, dt);
    if (ch) { ch.rotation.x = -m._rev * 1.25; ch.position.z = -0.12 - m._rev * 0.06; }
    mdl.head.visible = m._rev > 0.08;
    if (m.watcher) B.neck.rotation.y = m._neck || 0;
    if (mdl.extra['pupil1']) { var lk = clamp(angDiff(m.yaw, Math.atan2(PL.x - m.x, PL.z - m.z)), -1, 1) * 0.03; mdl.extra.pupil1.position.x = 0.13 + lk; mdl.extra['pupil-1'].position.x = -0.13 + lk; }
  } else if (m.type === 'crawler') {
    B.head.rotation.z = Math.sin(T * 3) * 0.15 + (Math.sin(T * 0.9) > 0.9 ? 0.6 : 0);
  }
  // twitch
  if (!m.watcher && m.type !== 'smiles' && Math.sin(T * 2.7 + m.x) > 0.985) { B.head.rotation.y += (R() - 0.5) * 0.9; B.neck.rotation.x += (R() - 0.5) * 0.4; }
  var U = mdl.head.userData.U;
  if (U) { U.uJaw.value = damp(U.uJaw.value, Math.max(m.jaw, (m.state === 'chase' ? 0.55 + Math.sin(T * 9) * 0.15 : 0.08 + Math.max(0, Math.sin(T * 0.8)) * 0.1)), 6, dt); U.uTwitch.value = m.type === 'static' ? 1 : (m.state === 'chase' ? 0.3 : 0); }
  if (mdl.hair) mdl.hair.userData.U.uWind.value = Math.min(1, spd / 3);
  // lighting probe
  m.probeT -= dt;
  if (m.probeT <= 0 && WORLD) {
    m.probeT = 0.25;
    var pr = WORLD.baker.probe(m.li, m.x, m.y + 1.2, m.z);
    var on = pr.on, off = [pr.off[0] * 1.8 + 0.02, pr.off[1] * 1.8 + 0.022, pr.off[2] * 1.8 + 0.03];
    mdl.mats.forEach(function (mt) { if (mt.userData.probeOn) setProbe(mt, on, off); });
  }
  // voices
  m.voiceT -= dt;
  if (m.voiceT <= 0 && m.visible && m.active && LIGHTU.uMix.value < 0.5) {
    m.voiceT = R.range(3, 7);
    var p = mpos(m);
    if (m.type === 'student0') sfx(R() < 0.5 ? 'breathM' : 'whisper', p, { v: 0.35 });
    else if (m.type === 'crawler') sfx('clicks', p, { n: R.int(6, 16) });
    else if (m.type === 'gaper') sfx('growl', p, { len: 1.6, pitch: 0.7 });
    else if (m.type === 'static') sfx('staticBurst', p, { len: 0.6 });
    else if (m.type === 'hoots') sfx(m.watcher ? 'hoot' : 'hootBad', p, { pitch: 0.6 });
    else if (m.type === 'smiles' && !m.frozen) sfx('growl', p, { len: 0.8, pitch: 1.4 });
  }
  // footsteps
  if (m.speed > 0.4 && m.type !== 'static') {
    m._stp = (m._stp || 0) + m.speed * dt;
    if (m._stp > (m.type === 'crawler' ? 0.5 : 0.9)) { m._stp = 0; if (m.ceilAmt < 0.5) sfxStep(MAP.lv[m.li].mat[cell], m.state === 'chase' ? 1 : 0.4, mpos(m), { gain: m.type === 'gaper' ? 1.4 : 1 }); else sfx('clicks', mpos(m), { n: 2 }); }
  }
  root.visible = m.visible && m.active;
}
// fear level from nearby monsters (for heartbeat / post)
function monsterFear() {
  var f = 0, near = null;
  for (var i = 0; i < MONSTERS.length; i++) {
    var m = MONSTERS[i]; if (!m.active || !m.visible || m.state === 'dormant') continue;
    var d = Math.sqrt(dist2(m.x, m.z, PL.x, PL.z)) + (m.li !== PL.li ? 10 : 0);
    var v = clamp(1 - d / 14, 0, 1);
    if (m.state === 'chase') v = Math.min(1, v * 1.5 + 0.2);
    if (m.watcher) v *= 0.4;
    if (v > f) { f = v; near = m; }
  }
  return { f: f, m: near };
}
