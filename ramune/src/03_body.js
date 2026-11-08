// ---- body simulation (pure logic, no DOM / no three.js) ------------------------
var CH = ['eu', 'st', 'se', 'ps', 'di', 'de', 'em', 'an', 'na', 'pa'];
var BOOSTABLE = { psy: 1, emp: 1, up: 1, del: 1 };
var DRUG_CLASSES = ['psy', 'up', 'down', 'op', 'dis', 'emp', 'del'];

function newBody() {
  var F = {}; CH.forEach(function (c) { F[c] = 0; });
  return {
    doses: [], stom: 0, bac: 0, tol: {}, hyd: 1, hr: 72, tp: 36.6, rr: 15, con: 100,
    danger: 0, dangerCause: '', dead: false, unconscious: false, uncTime: 0,
    F: F, L: {}, Ls: {}, motor: 0, envCool: 0, waterCool: 0, naRelief: 0, irrT: 0, irr: 0,
    comboS: {}, comboT: {}, found: [], events: [], warnCD: {}, onBed: false,
    vis: { psy: 0, dis: 0, del: 0, drunk: 0, stim: 0, sed: 0, emp: 0, anx: 0, nau: 0, kal: 0, gap: 0, spin: 0, flash: 0, irr: 0, pa: 0 },
    stats: { maxHR: 72, maxTp: 36.6, minRR: 15, maxBAC: 0, fun: 0, cans: 0, pills: 0, vomits: 0, waters: 0, taken: {}, dangerMin: 0, peakPsy: 0 },
    t: 0
  };
}

function subCurve(t, s) {
  if (t <= 0) return 0;
  if (t < s.on) { var a = t / s.on; return 0.06 * a * a; }
  if (t < s.pk) return 0.06 + 0.94 * smooth((t - s.on) / (s.pk - s.on));
  if (t < s.pl) return 1;
  if (t < s.du) return 1 - smooth((t - s.pl) / (s.du - s.pl));
  return 0;
}
function tailCurve(t, s) {
  if (!s.tail) return 0;
  var a = s.pl, b = s.du * 1.4;
  if (t < a || t > b) return 0;
  return Math.sin(PI * (t - a) / (b - a));
}

function bodyEvent(B, type, data) { B.events.push({ type: type, data: data || {} }); }

// ---- intake -------------------------------------------------------------------
function takeSub(B, id) {
  var s = SUB[id]; if (!s) return;
  B.doses.push({ s: id, t: 0, amt: 1, onsetSaid: false, peakSaid: false, fadeSaid: false });
  if (!s.hidden) { B.stats.pills++; B.stats.taken[id] = (B.stats.taken[id] || 0) + 1; }
  if (s.reset) {
    var had = 0;
    B.doses.forEach(function (d) { var ss = SUB[d.s]; if (ss.cls === 'op') { had += subCurve(d.t, ss) * d.amt; d.amt *= 0.04; } });
    if (had > 0.08) {
      B.doses.push({ s: 'withdraw', t: 0, amt: clamp(0.6 + had * 0.5, 0.6, 1.6), onsetSaid: true, peakSaid: true, fadeSaid: true });
      discover(B, 'reset');
    }
  }
  if (s.placebo) {
    var others = 0; for (var c in B.L) if (c !== 'etc') others += B.L[c];
    if (others < 0.1 && B.bac < 0.02) B.placeboAt = B.t + 8;
  }
}
function drinkCan(B, id) {
  var d = DRINK[id]; if (!d) return;
  if (d.alc > 0) { B.stom += d.alc; B.stats.cans++; }
  if (d.energy) takeSub(B, 'gigafx');
  B.hyd = Math.min(1, B.hyd + (d.alc > 0 ? 0.04 : 0.12));
  B.stats.taken[id] = (B.stats.taken[id] || 0) + 1;
}
function drinkWater(B) {
  B.hyd = Math.min(1, B.hyd + 0.3);
  B.waterCool = 1;
  B.naRelief = Math.max(B.naRelief, 0.15);
  B.stats.waters++;
}
function vomit(B) {
  B.stom *= 0.2;
  B.doses.forEach(function (d) {
    var s = SUB[d.s];
    if (d.t < s.pk * 1.2) d.amt *= lerp(0.3, 1, clamp(d.t / (s.pk * 1.2), 0, 1));
  });
  B.naRelief = 0.9;
  B.stats.vomits++;
  if (B.unconscious && B.bac > 0.18 && !B.onBed) { B.danger += 15; B.lastAspirate = true; }
  bodyEvent(B, 'vomit');
}

function discover(B, id) {
  if (B.found.indexOf(id) >= 0) return;
  B.found.push(id);
  bodyEvent(B, 'combo', { id: id });
}

// ---- main step ----------------------------------------------------------------
function bodyStep(B, dt) {
  if (B.dead) return;
  while (dt > 0) { var h = Math.min(dt, 1); bodyStep1(B, h); dt -= h; if (B.dead) return; }
}

function bodyStep1(B, dt) {
  B.t += dt;
  var F = {}, P = { hr: 0, tp: 0, rr: 0 }, rrDep = 0, L = {}, Ls = {}, distinct = {}, seBy = {}, dehyd = 0;
  CH.forEach(function (c) { F[c] = 0; });

  // booster level first (it changes others)
  var boost = 0;
  B.doses.forEach(function (d) { var s = SUB[d.s]; if (s.boost) boost += subCurve(d.t, s) * d.amt; });
  boost = Math.min(boost, 1.6);
  var boostMul = 1 + 0.7 * boost;

  for (var i = B.doses.length - 1; i >= 0; i--) {
    var d = B.doses[i], s = SUB[d.s];
    var slow = (boost > 0.05 && BOOSTABLE[s.cls]) ? (1 - 0.35 * Math.min(1, boost)) : 1;
    d.t += dt * slow;
    if (d.t > s.du * 1.45 + 5) { B.doses.splice(i, 1); continue; }
    var c = subCurve(d.t, s);
    var amt = s.steep ? Math.pow(d.amt, s.steep) : d.amt;
    var tolF = 1 / (1 + (B.tol[s.cls] || 0) * 1.0);
    var mul = BOOSTABLE[s.cls] ? boostMul : 1;
    var lvl = c * amt * tolF * mul;
    L[s.cls] = (L[s.cls] || 0) + lvl;
    Ls[s.id] = (Ls[s.id] || 0) + lvl;
    if (lvl > 0.25 && !s.hidden) { distinct[s.cls] = distinct[s.cls] || {}; distinct[s.cls][s.id] = 1; }
    if (s.id === 'gigafx' && lvl > 0.25) { distinct.up = distinct.up || {}; distinct.up.gigafx = 1; }
    for (var ch in s.fx) { F[ch] += s.fx[ch] * lvl; if (ch === 'se') seBy[s.cls] = (seBy[s.cls] || 0) + s.fx[ch] * lvl; }
    if (s.ph.hr) P.hr += s.ph.hr * lvl;
    if (s.ph.tp) P.tp += s.ph.tp * lvl;
    if (s.ph.rr) { if (s.ph.rr < 0) rrDep += s.ph.rr * lvl; else P.rr += s.ph.rr * lvl; }
    var tc = tailCurve(d.t, s) * amt * tolF;
    if (tc > 0) for (var tch in s.tail) F[tch] += s.tail[tch] * tc;
    if (s.dehyd) dehyd += s.dehyd * lvl;
    if (!s.hidden && s.cls !== 'etc') B.tol[s.cls] = (B.tol[s.cls] || 0) + lvl * dt * 0.0011;
    // UI events
    if (!s.hidden) {
      if (!d.onsetSaid && c > 0.25) { d.onsetSaid = true; bodyEvent(B, 'onset', { id: s.id }); }
      if (!d.peakSaid && d.t >= s.pk) { d.peakSaid = true; bodyEvent(B, 'peak', { id: s.id }); }
      if (!d.fadeSaid && d.t > s.pl && c < 0.3) { d.fadeSaid = true; bodyEvent(B, 'fade', { id: s.id }); }
    }
  }
  for (var tk in B.tol) B.tol[tk] *= (1 - 0.0006 * dt);

  // ---- alcohol ----
  var absorb = B.stom * Math.min(1, dt * 0.05);
  B.stom -= absorb; B.bac += absorb * 0.052;
  B.bac = Math.max(0, B.bac - dt * 0.02 / 60);
  var b = B.bac;
  L.alc = b / 0.06;

  // ---- combinations ----
  var m = { mul: {}, add: {}, ph: { hr: 0, tp: 0, rr: 0 }, rrMul: 1, mask: { alc: 0, op: 0 }, vis: { kal: 0, gap: 0, spin: 0, flash: 0 }, irregular: 0, dehyd: 0 };
  CH.forEach(function (c) { m.mul[c] = 1; m.add[c] = 0; });
  var activeClasses = 0;
  DRUG_CLASSES.concat(['alc']).forEach(function (c) { if ((L[c] || 0) > 0.3) activeClasses++; });
  if (activeClasses >= 4) discover(B, 'chain');
  for (var ci = 0; ci < COMBOS.length; ci++) {
    var cb = COMBOS[ci];
    if (cb.special || !cb.need.length) continue;
    var st = 9;
    for (var ni = 0; ni < cb.need.length; ni++) {
      var nd = cb.need[ni], v;
      if (nd.distinct) { var n = distinct[nd.distinct] ? Object.keys(distinct[nd.distinct]).length : 0; v = n >= nd.n ? clamp((L[nd.distinct] || 0) / 1.0, 0, 1.5) : 0; }
      else if (nd.s) v = clamp((Ls[nd.s] || 0) / 0.7, 0, 1.5);
      else v = clamp((L[nd.c] || 0) / 0.7, 0, 1.5);
      if (v < st) st = v;
    }
    B.comboS[cb.id] = st;
    if (st > 0.15) {
      cb.f(m, st);
      if (st > 0.6) { B.comboT[cb.id] = (B.comboT[cb.id] || 0) + dt; if (B.comboT[cb.id] > 3) discover(B, cb.id); }
    }
  }
  if (B.placeboAt && B.t >= B.placeboAt) { B.placeboAt = 0; discover(B, 'placebo'); F.eu += 0.1; }

  // ---- alcohol channels (masked by uppers) ----
  var maskA = 1 - Math.min(0.8, m.mask.alc);
  F.eu += Math.max(0, 3.2 * Math.min(b, 0.16) - Math.max(0, b - 0.2) * 3);
  F.se += b * 3.0 * maskA;
  var motor = b * 6.2 * maskA + F.di * 0.35 + F.se * 0.15;
  F.na += Math.max(0, b - 0.13) * 5.5;
  F.an -= Math.min(b * 1.6, 0.5);
  rrDep -= Math.max(0, b - 0.17) * 28;
  P.hr += b * 35;
  if (m.mask.op > 0 && seBy.op) F.se -= seBy.op * Math.min(0.7, m.mask.op);

  // ---- apply combination modifiers ----
  CH.forEach(function (c) { F[c] = F[c] * Math.max(0, m.mul[c]) + m.add[c]; });
  F.na = Math.max(0, F.na - B.naRelief * 1.2);
  CH.forEach(function (c) { if (F[c] < 0) F[c] = 0; });
  P.hr += m.ph.hr; P.tp += m.ph.tp;

  // irregular heart (coaster)
  B.irrT -= dt;
  if (m.irregular > 0.3 && B.irrT <= 0) { B.irrT = rnd(4, 14); B.irr = rnd(-25, 40) * m.irregular; }
  B.irr *= Math.exp(-dt * 0.25);

  // ---- vitals ----
  var hrT = 70 + P.hr + F.st * 8 + F.an * 14 - F.se * 6 + Math.max(0, B.tp - 37) * 6 + B.irr;
  var tpT = 36.6 + P.tp + (1 - B.hyd) * 1.4 - B.envCool * 0.9 - B.waterCool * 0.25 + F.st * 0.15;
  var rrT = 15 + P.rr + F.st * 2 + F.an * 3 + rrDep * m.rrMul - (B.unconscious ? 1.5 : 0);
  var conT = 100 - F.se * 28 - F.pa * 6 - F.di * 22 - b * 165 * maskA + F.st * 16 + F.an * 4 - Math.max(0, 9 - B.rr) * 7;
  B.hr = lerp(B.hr, clamp(hrT, 35, 260), 1 - Math.exp(-dt * 0.3));
  B.tp = lerp(B.tp, clamp(tpT, 34.5, 43), 1 - Math.exp(-dt * 0.06));
  B.rr = lerp(B.rr, clamp(rrT, 0, 40), 1 - Math.exp(-dt * 0.22));
  B.con = lerp(B.con, clamp(conT, 0, 100), 1 - Math.exp(-dt * 0.35));

  // ---- hydration & misc decay ----
  B.hyd = clamp(B.hyd - dt * (0.00035 + dehyd * 0.0016 + b * 0.004 + m.dehyd * 0.0012 + Math.max(0, B.tp - 37.6) * 0.0012), 0, 1);
  B.waterCool = Math.max(0, B.waterCool - dt * 0.03);
  B.naRelief = Math.max(0, B.naRelief - dt * 0.02);

  // ---- consciousness ----
  if (!B.unconscious && B.con < 5) { B.unconscious = true; B.uncTime = 0; bodyEvent(B, 'pass'); }
  else if (B.unconscious) { B.uncTime += dt; if (B.con > 24) { B.unconscious = false; bodyEvent(B, 'wake', { mins: B.uncTime }); } }

  // ---- nausea → vomiting ----
  if (F.na > 0.95 && B.naRelief < 0.3 && Math.random() < (F.na - 0.95) * 0.22 * dt) vomit(B);

  // ---- danger ----
  var gHR = B.hr > 190 ? (B.hr - 190) * 0.07 : 0;
  var gTP = B.tp > 39.8 ? (B.tp - 39.8) * 2.3 : 0;
  var gRR = B.rr < 7.5 ? (7.5 - B.rr) * 1.0 : 0;
  var gain = gHR + gTP + gRR;
  if (gain > 0) {
    B.danger += gain * dt; B.stats.dangerMin += dt;
    B.dangerCause = gRR >= gHR && gRR >= gTP ? 'rr' : gHR >= gTP ? 'hr' : 'tp';
  } else B.danger = Math.max(0, B.danger - dt * 1.3);
  if (B.lastAspirate) { B.lastAspirate = false; if (B.danger >= 100) B.dangerCause = 'vomit'; }
  if (B.danger >= 100) { B.danger = 100; B.dead = true; bodyEvent(B, 'dead', { cause: B.dangerCause || 'rr' }); }

  // ---- warnings ----
  for (var wk in B.warnCD) B.warnCD[wk] -= dt;
  function warn(k, cond, msg) { if (cond && !(B.warnCD[k] > 0)) { B.warnCD[k] = 25; bodyEvent(B, 'warn', { k: k, msg: msg }); } }
  warn('hr', B.hr > 165, '心拍がとても速い（' + Math.round(B.hr) + '）');
  warn('tp', B.tp > 39.2, '体温が高すぎる（' + B.tp.toFixed(1) + '℃）');
  warn('rr', B.rr < 9.5, '呼吸が弱くなっている（' + B.rr.toFixed(1) + '回/分）');
  warn('hyd', B.hyd < 0.35, 'のどがカラカラ。水を飲もう');
  warn('bac', b > 0.25, '飲みすぎ。もう限界');

  // ---- stats & fun ----
  var S = B.stats;
  S.maxHR = Math.max(S.maxHR, B.hr); S.maxTp = Math.max(S.maxTp, B.tp); S.minRR = Math.min(S.minRR, B.rr); S.maxBAC = Math.max(S.maxBAC, b);
  S.peakPsy = Math.max(S.peakPsy, F.ps);
  if (!B.unconscious) {
    var fun = F.eu * 1.0 + Math.min(F.ps, 2) * 0.8 + F.em * 0.9 + F.st * 0.3 + F.di * 0.45 + F.pa * 0.6 + Math.min(b, 0.12) * 4 - F.an * 1.0 - F.na * 0.9 - F.de * 0.3 - B.danger * 0.012;
    S.fun += clamp(fun, -1.5, 4) * dt * 6;
  }

  B.F = F; B.L = L; B.Ls = Ls; B.motor = motor; B.m = m;
  var V = B.vis;
  V.psy = F.ps; V.dis = F.di; V.del = F.de; V.drunk = motor; V.stim = F.st; V.sed = F.se + F.pa * 0.4; V.emp = F.em; V.anx = F.an; V.nau = F.na;
  V.kal = m.vis.kal; V.gap = m.vis.gap; V.spin = m.vis.spin; V.flash = m.vis.flash; V.irr = B.irr; V.pa = F.pa;
}

// dominant feeling for monologue / HUD
function dominantFeelings(B, n) {
  var arr = [];
  var F = B.F;
  ['ps', 'st', 'se', 'pa', 'di', 'de', 'em', 'an', 'na', 'eu'].forEach(function (k) { if (F[k] > 0.2) arr.push([k, F[k]]); });
  if (B.motor > 0.25) arr.push(['drunk', B.motor * 0.8]);
  arr.sort(function (a, b) { return b[1] - a[1]; });
  return arr.slice(0, n || 3);
}
function activeDoseSummary(B) {
  // group by substance: level & phase
  var map = {};
  B.doses.forEach(function (d) {
    var s = SUB[d.s]; if (s.hidden && s.id !== 'withdraw') return;
    var c = subCurve(d.t, s);
    var ph = d.t < s.on ? 'まだ' : d.t < s.pk ? '上昇中' : d.t < s.pl ? 'ピーク' : d.t < s.du ? '下降中' : '余韻';
    var o = map[s.id] || (map[s.id] = { s: s, lvl: 0, n: 0, ph: ph, t: d.t });
    o.lvl += c * d.amt; o.n++;
    if (d.t < o.t) { o.t = d.t; o.ph = ph; }
  });
  var arr = []; for (var k in map) arr.push(map[k]);
  if (B.bac > 0.005 || B.stom > 0.05) arr.push({ alc: true, lvl: B.bac / 0.06, ph: B.stom > 0.1 ? '吸収中' : '', bac: B.bac });
  return arr;
}
