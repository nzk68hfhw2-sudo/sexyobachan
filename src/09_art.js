// ---- 2D art: mascots, posters, signs ---------------------------------------
// Professor Hoots: round brown owl, cream belly, huge round eyes, orange beak, blue mortarboard with yellow tassel.
function drawHoots(g, x, y, s, o) {
  o = o || {};
  var wave = o.wave || 0, creepy = o.creepy || 0, blink = o.blink || 0, look = o.look || 0;
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.tilt || 0);
  g.lineJoin = 'round'; g.lineCap = 'round';
  var ink = '#2b1a10';
  // wings
  g.fillStyle = '#7a4a26'; g.strokeStyle = ink; g.lineWidth = 5;
  g.save(); g.translate(-78, 10); g.rotate(-0.3 - wave * 0.9); g.beginPath(); g.ellipse(-10, 30, 26, 52, 0.25, 0, TAU); g.fill(); g.stroke(); g.restore();
  g.save(); g.translate(78, 10); g.rotate(0.3); g.beginPath(); g.ellipse(10, 30, 26, 52, -0.25, 0, TAU); g.fill(); g.stroke(); g.restore();
  // body
  g.fillStyle = '#8b5a2e'; g.beginPath(); g.ellipse(0, 20, 88, 96, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#f2dfb5'; g.beginPath(); g.ellipse(0, 45, 56, 62, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(140,90,50,0.55)'; g.lineWidth = 3;
  for (var r = 0; r < 3; r++) for (var c = -1; c <= 1; c++) { g.beginPath(); g.arc(c * 22 + (r % 2) * 11, 20 + r * 22, 9, 0.2, PI - 0.2); g.stroke(); }
  // ear tufts
  g.fillStyle = '#7a4a26'; g.strokeStyle = ink; g.lineWidth = 5;
  g.beginPath(); g.moveTo(-70, -55); g.lineTo(-58, -105); g.lineTo(-30, -70); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(70, -55); g.lineTo(58, -105); g.lineTo(30, -70); g.closePath(); g.fill(); g.stroke();
  // eyes
  [-34, 34].forEach(function (ex) {
    g.fillStyle = '#f7c948'; g.beginPath(); g.arc(ex, -30, 34, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = creepy ? '#000' : '#fff'; g.beginPath(); g.arc(ex, -30, 27, 0, TAU); g.fill();
    if (!creepy) {
      g.fillStyle = '#111'; g.beginPath(); g.arc(ex + look * 8, -28, 14, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + look * 8 - 5, -34, 5, 0, TAU); g.fill();
    } else { g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ex, -30, 2.2, 0, TAU); g.fill(); }
    if (blink > 0) { g.fillStyle = '#8b5a2e'; g.fillRect(ex - 35, -65, 70, 35 * blink * 2); }
  });
  // beak
  g.fillStyle = '#f08a24'; g.beginPath(); g.moveTo(-14, -8); g.lineTo(14, -8); g.lineTo(0, 18 + creepy * 6); g.closePath(); g.fill(); g.stroke();
  if (o.mouth) { g.fillStyle = '#5a1010'; g.beginPath(); g.moveTo(-9, -2); g.lineTo(9, -2); g.lineTo(0, 10 + o.mouth * 10); g.closePath(); g.fill(); }
  // feet
  g.fillStyle = '#f08a24'; [-30, 30].forEach(function (fx) { g.beginPath(); g.ellipse(fx, 112, 20, 9, 0, 0, TAU); g.fill(); g.stroke(); });
  // mortarboard
  g.fillStyle = '#1f3c88'; g.beginPath(); g.moveTo(-70, -78); g.lineTo(0, -102); g.lineTo(70, -78); g.lineTo(0, -56); g.closePath(); g.fill(); g.stroke();
  g.fillRect(-34, -78, 68, 20); g.strokeRect(-34, -78, 68, 20);
  g.strokeStyle = '#f7c948'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -80); g.quadraticCurveTo(40, -80, 52, -48); g.stroke();
  g.fillStyle = '#f7c948'; g.beginPath(); g.arc(52, -44, 6, 0, TAU); g.fill();
  if (creepy > 0.5) { g.fillStyle = 'rgba(90,0,0,0.85)'; g.fillRect(-36, -4, 3, 30 + creepy * 30); g.fillRect(32, -4, 3, 20 + creepy * 40); }
  g.restore();
}
function drawPenny(g, x, y, s, o) { // pencil girl
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.strokeStyle = '#2b1a10'; g.lineJoin = 'round';
  g.fillStyle = '#f5c22e'; g.beginPath(); g.moveTo(-34, -60); g.lineTo(34, -60); g.lineTo(34, 70); g.lineTo(0, 120); g.lineTo(-34, 70); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#f0d3a8'; g.beginPath(); g.moveTo(-34, 70); g.lineTo(34, 70); g.lineTo(0, 120); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#333'; g.beginPath(); g.moveTo(-9, 106); g.lineTo(9, 106); g.lineTo(0, 120); g.closePath(); g.fill();
  g.fillStyle = '#c0c0c0'; g.fillRect(-36, -78, 72, 18); g.strokeRect(-36, -78, 72, 18);
  g.fillStyle = '#ef8aa6'; g.beginPath(); g.ellipse(0, -96, 36, 26, 0, PI, 0); g.lineTo(36, -78); g.lineTo(-36, -78); g.closePath(); g.fill(); g.stroke();
  [-13, 13].forEach(function (ex) { g.fillStyle = o.creepy ? '#000' : '#fff'; g.beginPath(); g.arc(ex, -25, 11, 0, TAU); g.fill(); g.stroke(); if (!o.creepy) { g.fillStyle = '#111'; g.beginPath(); g.arc(ex, -23, 5, 0, TAU); g.fill(); } });
  g.beginPath(); g.arc(0, 0, 14, 0.2, PI - 0.2); g.stroke();
  g.restore();
}
function drawBitsy(g, x, y, s, o) { // bookworm
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.strokeStyle = '#1f2a10';
  for (var i = 3; i >= 0; i--) { g.fillStyle = i % 2 ? '#7cc356' : '#68ad46'; g.beginPath(); g.arc(-60 + i * 30, 40 - Math.sin(i + (o.t || 0) * 3) * 6, 30, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = '#7cc356'; g.beginPath(); g.arc(40, -10, 44, 0, TAU); g.fill(); g.stroke();
  [22, 58].forEach(function (ex) { g.fillStyle = o.creepy ? '#000' : '#fff'; g.beginPath(); g.arc(ex, -20, 12, 0, TAU); g.fill(); if (!o.creepy) { g.fillStyle = '#111'; g.beginPath(); g.arc(ex + 2, -18, 5, 0, TAU); g.fill(); } g.strokeStyle = '#111'; g.lineWidth = 4; g.beginPath(); g.arc(ex, -20, 17, 0, TAU); g.stroke(); });
  g.beginPath(); g.moveTo(34, -20); g.lineTo(46, -20); g.stroke();
  g.strokeStyle = '#1f2a10'; g.beginPath(); g.arc(40, 2, 16, 0.3, PI - 0.3); g.stroke();
  g.restore();
}
function drawMarbles(g, x, y, s, o) { // hamster
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineWidth = 5; g.strokeStyle = '#2b1a10';
  g.fillStyle = '#c98c4f'; g.beginPath(); g.ellipse(0, 20, 70, 62, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#f6e3c5'; g.beginPath(); g.ellipse(0, 38, 42, 36, 0, 0, TAU); g.fill();
  g.fillStyle = '#c98c4f'; [-48, 48].forEach(function (ex) { g.beginPath(); g.arc(ex, -32, 18, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#f1a7a0'; g.beginPath(); g.arc(ex, -32, 9, 0, TAU); g.fill(); g.fillStyle = '#c98c4f'; });
  [-20, 20].forEach(function (ex) { g.fillStyle = o.creepy ? '#000' : '#111'; g.beginPath(); g.arc(ex, -2, o.creepy ? 12 : 8, 0, TAU); g.fill(); g.fillStyle = '#fff'; if (!o.creepy) { g.beginPath(); g.arc(ex - 3, -5, 3, 0, TAU); g.fill(); } });
  g.fillStyle = '#e57373'; g.beginPath(); g.arc(0, 12, 6, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.fillRect(-7, 20, 6, 9); g.fillRect(1, 20, 6, 9);
  g.restore();
}
function drawStar(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); for (var i = 0; i < 10; i++) { var a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }

// NPC portrait used on MISSING posters & yearbook
function drawPortrait(G, X, Y, w, h, look, seed) {
  w = Math.round(w); h = Math.round(h);
  var tc = document.createElement('canvas'); tc.width = w; tc.height = h;
  var g = tc.getContext('2d', { willReadFrequently: true }), x = 0, y = 0;
  var rnd = makeRNG(seed || 1);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#7d8a96'; g.fillRect(x, y, w, h);
  var sk = look.skin, hr = look.hair;
  var cx = x + w / 2, cy = y + h * 0.48;
  g.fillStyle = rgbs(look.shirt); g.beginPath(); g.ellipse(cx, y + h * 1.05, w * 0.45, h * 0.35, 0, 0, TAU); g.fill();
  g.fillStyle = rgbs(sk); g.fillRect(cx - w * 0.08, cy + h * 0.15, w * 0.16, h * 0.2);
  g.beginPath(); g.ellipse(cx, cy, w * 0.22, h * 0.27, 0, 0, TAU); g.fill();
  g.fillStyle = rgbs(hr);
  if (look.hairStyle === 0) { g.beginPath(); g.ellipse(cx, cy - h * 0.12, w * 0.24, h * 0.17, 0, PI, 0); g.fill(); }
  else if (look.hairStyle === 1) { g.beginPath(); g.ellipse(cx, cy - h * 0.05, w * 0.27, h * 0.3, 0, PI * 0.95, PI * 2.05); g.fill(); g.fillRect(cx - w * 0.27, cy - h * 0.05, w * 0.08, h * 0.32); g.fillRect(cx + w * 0.19, cy - h * 0.05, w * 0.08, h * 0.32); }
  else if (look.hairStyle === 2) { g.beginPath(); g.ellipse(cx, cy - h * 0.18, w * 0.2, h * 0.08, 0, PI, 0); g.fill(); }
  else if (look.hairStyle === 3) { g.fillStyle = 'rgb(200,200,200)'; g.beginPath(); g.ellipse(cx, cy - h * 0.14, w * 0.23, h * 0.12, 0, PI, 0); g.fill(); }
  g.fillStyle = '#111'; g.fillRect(cx - w * 0.1, cy - h * 0.02, w * 0.05, h * 0.03); g.fillRect(cx + w * 0.05, cy - h * 0.02, w * 0.05, h * 0.03);
  g.fillStyle = 'rgba(80,30,30,0.8)'; g.fillRect(cx - w * 0.06, cy + h * 0.13, w * 0.12, h * 0.015);
  if (look.glasses) { g.strokeStyle = '#222'; g.lineWidth = 1.5; g.strokeRect(cx - w * 0.13, cy - h * 0.05, w * 0.1, h * 0.08); g.strokeRect(cx + w * 0.03, cy - h * 0.05, w * 0.1, h * 0.08); }
  // photocopy look
  var id = g.getImageData(x, y, w, h), d = id.data;
  for (var i = 0; i < d.length; i += 4) { var v = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11); v = v > 120 ? 230 : v * 0.6; v += (rnd() - 0.5) * 40; d[i] = d[i + 1] = d[i + 2] = v; }
  g.putImageData(id, x, y);
  g.restore();
  G.drawImage(tc, X, Y);
}
function rgbs(c) { return 'rgb(' + (c[0] * 255 | 0) + ',' + (c[1] * 255 | 0) + ',' + (c[2] * 255 | 0) + ')'; }

// ---------------------------------------------------------------------------
var HALL_POSTERS = ['welcome', 'norun', 'camera', 'lost', 'hallpass', 'read', 'newspaper', 'hoots', 'attend', 'seat', 'picture', 'dance', 'moonlight', 'bus'];
function paperBG(g, w, h, col, rnd) {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  pixelsRect(g, w, h, rnd);
  g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
}
function pixelsRect(g, w, h, rnd) { for (var i = 0; i < 300; i++) { g.fillStyle = 'rgba(90,70,40,' + rnd() * 0.08 + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 10, 2 + rnd() * 10); } }
function fitText(g, t, x, y, maxW, size, font, col, align) {
  g.font = size + 'px ' + font; var w = g.measureText(t).width; if (w > maxW) { size = size * maxW / w; g.font = size + 'px ' + font; }
  g.fillStyle = col; g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y);
}
function drawPoster(g, kind, w, h, night, rnd, extra) {
  var BG = '"Bungee", Impact, sans-serif', TW = '"Special Elite", "Courier New", monospace', LG = '"Luckiest Guy", Impact, sans-serif';
  var creepy = night >= 2 && rnd() < 0.25 + night * 0.08;
  switch (kind) {
    case 'welcome': paperBG(g, w, h, '#ffe36e', rnd); for (var s = 0; s < 6; s++) drawStar(g, rnd() * w, rnd() * h, 10 + rnd() * 10, '#ff6b3d');
      fitText(g, 'WELCOME', w / 2, h * 0.3, w * 0.9, 46, BG, '#1f3c88'); fitText(g, creepy ? 'BACK. AGAIN.' : 'BACK,', w / 2, h * 0.5, w * 0.9, 46, BG, '#c62828'); fitText(g, creepy ? 'YOU NEVER LEFT' : 'STUDENTS!', w / 2, h * 0.72, w * 0.9, 40, BG, '#1f3c88'); break;
    case 'norun': paperBG(g, w, h, '#fff', rnd); g.strokeStyle = '#c62828'; g.lineWidth = 10; g.beginPath(); g.arc(w / 2, h * 0.38, w * 0.3, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(w * 0.29, h * 0.17); g.lineTo(w * 0.71, h * 0.59); g.stroke();
      g.strokeStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h * 0.27, 8, 0, TAU); g.moveTo(w / 2, h * 0.3); g.lineTo(w / 2 - 6, h * 0.42); g.lineTo(w / 2 - 22, h * 0.52); g.moveTo(w / 2 - 6, h * 0.42); g.lineTo(w / 2 + 16, h * 0.5); g.moveTo(w / 2 - 2, h * 0.34); g.lineTo(w / 2 + 20, h * 0.32); g.moveTo(w / 2 - 2, h * 0.34); g.lineTo(w / 2 - 22, h * 0.38); g.stroke();
      fitText(g, 'NO RUNNING', w / 2, h * 0.78, w * 0.9, 34, BG, '#111'); fitText(g, creepy ? 'IT HEARS YOU.' : 'IN THE HALLS', w / 2, h * 0.9, w * 0.9, 24, BG, '#c62828'); break;
    case 'camera': paperBG(g, w, h, '#bfe3ff', rnd); g.fillStyle = '#222'; g.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.22); g.beginPath(); g.arc(w / 2, h * 0.31, w * 0.09, 0, TAU); g.fillStyle = '#69c'; g.fill();
      fitText(g, creepy ? 'SMILE.' : 'SMILE!', w / 2, h * 0.58, w * 0.9, 44, BG, '#1f3c88'); fitText(g, creepy ? "WE'RE WATCHING." : "YOU'RE ON CAMERA", w / 2, h * 0.76, w * 0.9, 26, BG, '#c62828'); break;
    case 'lost': paperBG(g, w, h, '#f4f0e0', rnd); fitText(g, 'LOST & FOUND', w / 2, h * 0.15, w * 0.9, 30, BG, '#2e7d32'); g.font = '16px ' + TW; g.fillStyle = '#222'; g.textAlign = 'left';
      ['- 1 lunch box (owl)', '- red mitten', '- retainer', '- glasses, cracked', creepy ? '- a left shoe, still warm' : '- yo-yo', '- hall pass #0'].forEach(function (t, i) { g.fillText(t, w * 0.1, h * 0.32 + i * h * 0.1); }); break;
    case 'hallpass': paperBG(g, w, h, '#ffffff', rnd); g.fillStyle = '#c62828'; g.fillRect(0, 0, w, h * 0.25); fitText(g, 'HALL PASS', w / 2, h * 0.13, w * 0.9, 34, BG, '#fff'); fitText(g, 'REQUIRED', w / 2, h * 0.42, w * 0.9, 38, BG, '#111');
      g.font = '15px ' + TW; g.fillStyle = '#333'; g.textAlign = 'center'; g.fillText('All students in the halls', w / 2, h * 0.62); g.fillText('after the bell must carry', w / 2, h * 0.7); g.fillText(creepy ? 'nothing. They will not need it.' : 'a valid hall pass.', w / 2, h * 0.78); break;
    case 'read': paperBG(g, w, h, '#7fd3c6', rnd); g.fillStyle = '#fff'; g.fillRect(w * 0.25, h * 0.25, w * 0.5, h * 0.3); g.fillStyle = '#c62828'; g.fillRect(w * 0.49, h * 0.25, w * 0.02, h * 0.3); drawBitsy(g, w * 0.5, h * 0.12, 0.35, { creepy: creepy }); fitText(g, 'READ!', w / 2, h * 0.7, w * 0.9, 56, BG, '#1f3c88'); fitText(g, 'with Bitsy Bookworm', w / 2, h * 0.86, w * 0.9, 18, TW, '#111'); break;
    case 'newspaper': paperBG(g, w, h, '#ece6d6', rnd); fitText(g, 'THE HOWL', w / 2, h * 0.1, w * 0.9, 34, '"Special Elite", serif', '#111'); g.fillStyle = '#111'; g.fillRect(w * 0.06, h * 0.18, w * 0.88, 2);
      fitText(g, creepy ? 'ENROLLMENT AT 100%' : 'NIGHT SCHOOL OPENS!', w / 2, h * 0.26, w * 0.9, 20, BG, '#111'); g.fillStyle = '#999'; g.fillRect(w * 0.08, h * 0.33, w * 0.4, h * 0.3); drawHoots(g, w * 0.28, h * 0.48, 0.28, { creepy: creepy });
      g.fillStyle = '#444'; for (var ln = 0; ln < 12; ln++) g.fillRect(w * 0.52 + (ln > 5 ? 0 : 0), h * 0.35 + (ln % 6) * h * 0.05 + (ln > 5 ? h * 0.32 : 0), w * 0.4, 3);
      for (var l2 = 0; l2 < 5; l2++) g.fillRect(w * 0.08, h * 0.68 + l2 * h * 0.05, w * 0.4, 3); break;
    case 'hoots': paperBG(g, w, h, '#ffd54f', rnd); var gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#fff7c2'); gr.addColorStop(1, 'rgba(255,170,60,0.6)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (var st = 0; st < 8; st++) drawStar(g, rnd() * w, rnd() * h * 0.4, 8 + rnd() * 8, '#fff');
      drawHoots(g, w / 2, h * 0.5, Math.min(w, h) / 300, { creepy: creepy ? 1 : 0, wave: 0.6 });
      fitText(g, creepy ? 'HOO-RAY FOR STAYING!' : 'HOO-RAY FOR LEARNING!', w / 2, h * 0.9, w * 0.95, 26, LG, '#c62828'); fitText(g, 'Professor Hoots', w / 2, h * 0.08, w * 0.9, 20, LG, '#1f3c88'); break;
    case 'attend': paperBG(g, w, h, '#ffffff', rnd); fitText(g, 'ATTENDANCE', w / 2, h * 0.25, w * 0.9, 34, BG, '#1f3c88'); fitText(g, 'IS', w / 2, h * 0.42, w * 0.9, 30, BG, '#1f3c88'); fitText(g, 'MANDATORY', w / 2, h * 0.58, w * 0.9, 34, BG, '#c62828'); drawStar(g, w / 2, h * 0.8, 24, '#f7c948'); break;
    case 'seat': paperBG(g, w, h, '#ffccbc', rnd); fitText(g, 'BE IN YOUR SEAT', w / 2, h * 0.3, w * 0.92, 30, BG, '#111'); fitText(g, 'WHEN THE', w / 2, h * 0.48, w * 0.9, 28, BG, '#111'); fitText(g, 'BELL RINGS', w / 2, h * 0.64, w * 0.92, 36, BG, '#c62828');
      g.fillStyle = '#795548'; g.fillRect(w * 0.4, h * 0.76, w * 0.2, h * 0.04); g.fillRect(w * 0.42, h * 0.8, w * 0.03, h * 0.1); g.fillRect(w * 0.55, h * 0.8, w * 0.03, h * 0.1); g.fillRect(w * 0.55, h * 0.66, w * 0.03, h * 0.1); break;
    case 'picture': paperBG(g, w, h, '#e1bee7', rnd); fitText(g, 'PICTURE DAY', w / 2, h * 0.15, w * 0.9, 32, BG, '#4a148c'); g.fillStyle = '#fff'; g.fillRect(w * 0.2, h * 0.27, w * 0.6, h * 0.45); drawHoots(g, w / 2, h * 0.5, 0.32, { creepy: creepy }); fitText(g, creepy ? 'SAY CHEESE. FOREVER.' : 'Say "Cheese!"', w / 2, h * 0.85, w * 0.9, 22, TW, '#111'); break;
    case 'dance': paperBG(g, w, h, '#b3e5fc', rnd); fitText(g, 'MOONLIGHT DANCE', w / 2, h * 0.2, w * 0.92, 28, BG, '#0d47a1'); fitText(g, 'Fri. Oct 29 · GYM', w / 2, h * 0.36, w * 0.9, 20, TW, '#111');
      g.fillStyle = 'rgba(200,0,0,0.85)'; g.save(); g.translate(w / 2, h * 0.6); g.rotate(-0.25); g.fillRect(-w * 0.45, -22, w * 0.9, 44); g.restore(); fitText(g, 'CANCELLED', w / 2, h * 0.6, w * 0.8, 34, BG, '#fff'); break;
    case 'moonlight': paperBG(g, w, h, '#1a237e', rnd); g.fillStyle = '#fff59d'; g.beginPath(); g.arc(w * 0.7, h * 0.25, w * 0.15, 0, TAU); g.fill(); g.fillStyle = '#1a237e'; g.beginPath(); g.arc(w * 0.64, h * 0.22, w * 0.14, 0, TAU); g.fill();
      for (var s2 = 0; s2 < 14; s2++) drawStar(g, rnd() * w, rnd() * h * 0.6, 3 + rnd() * 4, '#fff');
      fitText(g, 'MOONLIGHT', w / 2, h * 0.58, w * 0.9, 34, LG, '#fff59d'); fitText(g, 'LEARNING CO.', w / 2, h * 0.7, w * 0.9, 24, LG, '#fff59d'); fitText(g, creepy ? 'Learn All Night. Forever.' : '"Learn All Night!"', w / 2, h * 0.84, w * 0.9, 18, TW, '#fff'); break;
    case 'bus': paperBG(g, w, h, '#fff3c4', rnd); g.fillStyle = '#f5b400'; g.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.25); g.fillStyle = '#111'; g.beginPath(); g.arc(w * 0.3, h * 0.57, 12, 0, TAU); g.arc(w * 0.7, h * 0.57, 12, 0, TAU); g.fill();
      fitText(g, 'THE LAST BUS', w / 2, h * 0.14, w * 0.9, 30, BG, '#111'); fitText(g, creepy ? 'HAS NO DRIVER' : 'LEAVES AT DISMISSAL', w / 2, h * 0.75, w * 0.92, 20, BG, '#c62828'); fitText(g, 'Do not be late.', w / 2, h * 0.88, w * 0.9, 18, TW, '#111'); break;
    case 'missing': {
      var nm = extra || { name: 'DANA', look: null };
      paperBG(g, w, h, '#fafafa', rnd); fitText(g, 'MISSING', w / 2, h * 0.1, w * 0.92, 44, BG, '#111');
      if (nm.look) drawPortrait(g, w * 0.2, h * 0.19, w * 0.6, h * 0.42, nm.look, nm.seed); else { g.fillStyle = '#888'; g.fillRect(w * 0.2, h * 0.19, w * 0.6, h * 0.42); }
      fitText(g, nm.name.toUpperCase(), w / 2, h * 0.7, w * 0.9, 26, BG, '#111');
      g.font = '13px ' + TW; g.fillStyle = '#222'; g.textAlign = 'center';
      g.fillText(nm.when || 'Last seen: hallway, after the bell', w / 2, h * 0.79); g.fillText('If seen, do NOT approach.', w / 2, h * 0.86); g.fillText('Call the office. Ext. 0', w / 2, h * 0.92);
      break;
    }
    case 'lunch': paperBG(g, w, h, '#c8e6c9', rnd); fitText(g, "TODAY'S LUNCH", w / 2, h * 0.15, w * 0.9, 30, BG, '#1b5e20'); g.font = '18px ' + TW; g.fillStyle = '#222'; g.textAlign = 'center';
      ['Sloppy Joe', 'Tater Tots', 'Mystery Meat Surprise', 'Chocolate Milk', creepy ? 'You' : 'Jell-O'].forEach(function (t, i) { g.fillText(t, w / 2, h * 0.35 + i * h * 0.12); }); break;
    case 'milk': paperBG(g, w, h, '#e3f2fd', rnd); g.fillStyle = '#fff'; g.fillRect(w * 0.35, h * 0.2, w * 0.3, h * 0.4); g.fillStyle = '#1976d2'; g.fillRect(w * 0.35, h * 0.35, w * 0.3, h * 0.1); fitText(g, 'DRINK YOUR', w / 2, h * 0.72, w * 0.9, 26, BG, '#0d47a1'); fitText(g, 'MILK!', w / 2, h * 0.86, w * 0.9, 40, BG, '#c62828'); break;
    case 'gym': paperBG(g, w, h, '#ffcdd2', rnd); fitText(g, 'GO NIGHT OWLS!', w / 2, h * 0.3, w * 0.92, 34, BG, '#b71c1c'); drawHoots(g, w / 2, h * 0.65, 0.3, { wave: 1, creepy: creepy }); break;
    case 'class': paperBG(g, w, h, '#fff9c4', rnd); fitText(g, 'CLASS RULES', w / 2, h * 0.1, w * 0.9, 30, BG, '#1f3c88'); g.font = '15px ' + TW; g.fillStyle = '#222'; g.textAlign = 'left';
      ['1. Raise your hand.', '2. Be kind.', '3. Stay in your seat.', '4. Never be late.', creepy ? '5. Do not look at the window.' : '5. Have fun learning!', creepy ? '6. There is no 6.' : '6. Hoo-ray!'].forEach(function (t, i) { g.fillText(t, w * 0.08, h * 0.25 + i * h * 0.12); }); break;
    case 'periodic': paperBG(g, w, h, '#fff', rnd); fitText(g, 'PERIODIC TABLE', w / 2, h * 0.08, w * 0.9, 24, BG, '#111'); for (var e = 0; e < 90; e++) { var ex = e % 18, ey = Math.floor(e / 18); g.fillStyle = 'hsl(' + (ex * 20) + ',60%,70%)'; g.fillRect(w * 0.04 + ex * w * 0.051, h * 0.2 + ey * h * 0.14, w * 0.045, h * 0.12); } break;
    case 'music': paperBG(g, w, h, '#f8bbd0', rnd); g.strokeStyle = '#111'; g.lineWidth = 2; for (var ml = 0; ml < 5; ml++) { g.beginPath(); g.moveTo(w * 0.08, h * 0.3 + ml * 12); g.lineTo(w * 0.92, h * 0.3 + ml * 12); g.stroke(); }
      for (var nn = 0; nn < 6; nn++) { g.fillStyle = '#111'; g.beginPath(); g.ellipse(w * 0.2 + nn * w * 0.12, h * 0.32 + (nn * 7 % 40), 7, 5, -0.3, 0, TAU); g.fill(); g.fillRect(w * 0.2 + nn * w * 0.12 + 5, h * 0.32 + (nn * 7 % 40) - 34, 2, 34); }
      fitText(g, 'SING ALONG!', w / 2, h * 0.75, w * 0.9, 34, BG, '#880e4f'); break;
    case 'eyechart': paperBG(g, w, h, '#fff', rnd); ['E', 'F P', 'T O Z', 'L P E D', creepy ? 'S T A Y' : 'P E C F D', creepy ? 'I N Y O U R' : 'E D F C Z P', creepy ? 'S E A T' : 'F E L O P Z D'].forEach(function (t, i) { fitText(g, t, w / 2, h * 0.1 + i * h * 0.13, w * 0.9, 50 - i * 6.5, 'Arial, sans-serif', '#111'); }); break;
    case 'germs': paperBG(g, w, h, '#dcedc8', rnd); fitText(g, 'WASH YOUR', w / 2, h * 0.15, w * 0.9, 28, BG, '#33691e'); fitText(g, 'HANDS!', w / 2, h * 0.3, w * 0.9, 40, BG, '#33691e'); for (var gm = 0; gm < 5; gm++) { g.fillStyle = '#8bc34a'; g.beginPath(); g.arc(w * 0.2 + gm * w * 0.15, h * 0.6 + (gm % 2) * 30, 18, 0, TAU); g.fill(); g.fillStyle = '#111'; g.fillRect(w * 0.2 + gm * w * 0.15 - 6, h * 0.58 + (gm % 2) * 30, 3, 3); g.fillRect(w * 0.2 + gm * w * 0.15 + 3, h * 0.58 + (gm % 2) * 30, 3, 3); } break;
    case 'portrait': g.fillStyle = '#5d4037'; g.fillRect(0, 0, w, h); g.fillStyle = '#3e2723'; g.fillRect(10, 10, w - 20, h - 20); drawPortrait(g, 18, 18, w - 36, h - 50, { skin: [0.85, 0.7, 0.6], hair: [0.5, 0.5, 0.5], shirt: [0.15, 0.15, 0.25], hairStyle: 3, glasses: true }, 9); fitText(g, 'PRINCIPAL D. MERRIWEATHER', w / 2, h - 18, w * 0.85, 12, TW, '#d7ccc8'); break;
    case 'certificate': paperBG(g, w, h, '#fffde7', rnd); g.strokeStyle = '#c9a227'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); fitText(g, 'CERTIFICATE', w / 2, h * 0.3, w * 0.8, 24, '"Special Elite", serif', '#5d4037'); fitText(g, '100% ATTENDANCE · 1993', w / 2, h * 0.55, w * 0.8, 16, TW, '#333'); fitText(g, 'Moonlight Learning Co.', w / 2, h * 0.75, w * 0.8, 14, TW, '#333'); break;
    case 'vhs': paperBG(g, w, h, '#212121', rnd); g.fillStyle = '#ff5252'; g.fillRect(0, h * 0.4, w, h * 0.06); g.fillStyle = '#ffeb3b'; g.fillRect(0, h * 0.47, w, h * 0.06); g.fillStyle = '#40c4ff'; g.fillRect(0, h * 0.54, w, h * 0.06);
      fitText(g, 'AV CLUB', w / 2, h * 0.2, w * 0.9, 34, BG, '#fff'); fitText(g, 'Please rewind', w / 2, h * 0.75, w * 0.9, 20, TW, '#fff'); fitText(g, creepy ? 'Do not watch tape #0' : 'Be kind!', w / 2, h * 0.85, w * 0.9, 16, TW, '#aaa'); break;
    case 'memo': paperBG(g, w, h, '#fffde7', rnd); fitText(g, 'MEMO', w / 2, h * 0.1, w * 0.9, 28, TW, '#111'); g.font = '13px ' + TW; g.fillStyle = '#222'; g.textAlign = 'left';
      ['To: All Night Staff', 'Re: Seating Chart Protocol', '', 'Chairs are to be counted', 'before every period.', 'There must ALWAYS be', 'one fewer chair.', '', '- Moonlight Learning Co.'].forEach(function (t, i) { g.fillText(t, w * 0.08, h * 0.22 + i * h * 0.085); }); break;
    case 'help': paperBG(g, w, h, '#e1f5fe', rnd); fitText(g, "IT'S OK TO", w / 2, h * 0.3, w * 0.9, 28, BG, '#01579b'); fitText(g, 'ASK FOR HELP', w / 2, h * 0.48, w * 0.9, 30, BG, '#01579b'); g.font = '16px ' + TW; g.fillStyle = '#333'; g.textAlign = 'center'; g.fillText(creepy ? 'No one is coming.' : 'Talk to a grown-up you trust.', w / 2, h * 0.7); break;
    default: paperBG(g, w, h, '#eee', rnd);
  }
  // wear: torn corner, tape, grime
  if (kind !== 'portrait') {
    g.fillStyle = 'rgba(240,235,200,0.75)'; g.save(); g.translate(w / 2, 4); g.rotate(rnd() * 0.3 - 0.15); g.fillRect(-18, -6, 36, 14); g.restore();
    if (rnd() < 0.35) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(w, h); g.lineTo(w - 30 - rnd() * 30, h); g.lineTo(w, h - 30 - rnd() * 40); g.fill(); g.globalCompositeOperation = 'source-over'; }
    var gr2 = g.createLinearGradient(0, 0, 0, h); gr2.addColorStop(0, 'rgba(80,60,30,0)'); gr2.addColorStop(1, 'rgba(80,60,30,0.25)'); g.fillStyle = gr2; g.fillRect(0, 0, w, h);
  }
}

// poster atlas: 8 x 8 slots of 256
var POSTER = { canvas: null, tex: null, mat: null, slots: [] };
function buildPosters(M, B, SP) {
  if (!POSTER.canvas) {
    POSTER.canvas = mkCanvas(2048, 2048); POSTER.tex = toTex(POSTER.canvas, { clamp: true });
    POSTER.mat = bakeMat({ map: POSTER.tex, transparent: true, alphaTest: 0.5, shininess: 10, side: THREE.DoubleSide });
  }
  var rnd = makeRNG(M.seed ^ 0x51);
  M.posters.forEach(function (p, i) {
    if (p.kind === 'hall') p.kind = rnd.pick(HALL_POSTERS);
    p.slot = i % 64;
    var aspect = p.w / p.h;
    var sw = aspect >= 1 ? 256 : 256 * aspect, sh = aspect >= 1 ? 256 / aspect : 256;
    p.sw = sw; p.sh = sh;
    var sx = (p.slot % 8) * 256, sy = Math.floor(p.slot / 8) * 256;
    var uv = [sx / 2048, 1 - (sy + sh) / 2048, sw / 2048, sh / 2048];
    var f = new PF(B, p.li, p.x, p.y, p.z, p.rot);
    f.part(GEO.plane, POSTER.mat, 0, 0, 0.006, p.w, p.h, 1, [1, 1, 1], { uv: uv, rz: (rnd() - 0.5) * 0.06 });
  });
  return POSTER;
}
// redraw atlas contents for a night (missing posters for past victims, creepier text)
function paintPosters(M, night, missing) {
  var g = POSTER.canvas.getContext('2d');
  g.clearRect(0, 0, 2048, 2048);
  var rnd = makeRNG(M.seed + night * 101);
  var mi = 0;
  var hallIdx = [];
  M.posters.forEach(function (p, i) { if (HALL_POSTERS.indexOf(p.kind) >= 0 || p.kind === 'missing') hallIdx.push(i); });
  // swap some hall posters to MISSING posters
  var nMiss = Math.min(missing.length, hallIdx.length);
  var missSet = {};
  rnd.shuffle(hallIdx);
  for (var k = 0; k < nMiss; k++) missSet[hallIdx[k]] = missing[k];
  M.posters.forEach(function (p, i) {
    if (i >= 64) return;
    var sx = (p.slot % 8) * 256, sy = Math.floor(p.slot / 8) * 256;
    g.save(); g.translate(sx, sy); g.beginPath(); g.rect(0, 0, p.sw, p.sh); g.clip();
    drawPoster(g, missSet[i] ? 'missing' : p.kind, p.sw, p.sh, night, rnd, missSet[i]);
    g.restore();
  });
  POSTER.tex.needsUpdate = true;
}

// signs: exit, room plates, banners, marquee, standee, score, drawings
function buildSigns(M, B, SP) {
  var E = MATS.emit;
  M.signs.forEach(function (s) {
    var f = new PF(B, s.li, s.x, s.y, s.z, s.rot);
    if (s.kind === 'exit') {
      f.box(MATS.paint, 0, -0.12, 0.05, 0.42, 0.22, 0.1, [0.9, 0.9, 0.88]);
      SP.plates.push({ kind: 'exit', li: s.li, x: s.x + Math.sin(s.rot) * 0.105, y: s.y - 0.01, z: s.z + Math.cos(s.rot) * 0.105, rot: s.rot });
    } else if (s.kind === 'roomplate') {
      SP.plates.push({ kind: 'room', li: s.li, x: s.x, y: s.y, z: s.z, rot: s.rot, text: s.text, sub: s.sub });
    } else if (s.kind === 'banner') {
      var c = mkCanvas(1024, 160), g = c.getContext('2d');
      var big = s.big;
      g.fillStyle = big ? '#7a1010' : ['#1f3c88', '#c62828', '#2e7d32', '#f9a825'][(s.x | 0) % 4]; g.fillRect(0, 0, 1024, 160);
      g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeRect(10, 10, 1004, 140);
      fitText(g, s.text, 512, 86, 940, 92, '"Bungee", Impact, sans-serif', '#fff');
      for (var i = 0; i < 4; i++) drawStar(g, 40 + i * 315, 26, 12, '#ffe36e');
      var t = toTex(c, { clamp: true });
      var mat = bakeMat({ map: t, side: THREE.DoubleSide, shininess: 5 }, 'probe');
      var w = big ? 9 : 5.2, h = w * 160 / 1024;
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 8, 1), mat);
      var pos = mesh.geometry.attributes.position; for (var v = 0; v < pos.count; v++) { var xx = pos.getX(v); pos.setZ(v, Math.cos(xx / w * PI) * 0.04); pos.setY(v, pos.getY(v) - Math.cos(xx / w * PI) * 0.06); }
      mesh.position.set(s.x, s.y, s.z); mesh.rotation.y = s.rot + (s.z > 10 && s.z < 12.5 ? PI / 2 * 0 : 0);
      if (s.z > 10 && s.z < 12.5 && !big) { mesh.rotation.y = PI / 2 * (s.rot === 0 ? 1 : -1); }
      mesh.updateMatrix(); mesh.matrixAutoUpdate = false;
      SP.banners.push({ mesh: mesh, li: s.li, x: s.x, y: s.y, z: s.z });
    }
  });
  // plate atlas (canvas 1024x1024, 128x64 cells)
  var pc = mkCanvas(1024, 1024), pg = pc.getContext('2d');
  var slots = 0;
  var pmat = bakeMat({ map: toTex(pc, { clamp: true }), vertexColors: true, shininess: 20, transparent: true, alphaTest: 0.4 });
  SP.plates.forEach(function (pl) {
    var cw = 128, chh = 64, big = pl.kind === 'marquee' || pl.kind === 'standee' || pl.kind === 'score' || pl.kind === 'drawing';
    if (big) { cw = 256; chh = pl.kind === 'standee' ? 256 : 128; }
    var slot = slots; slots += big ? (pl.kind === 'standee' ? 8 : 4) : 1;
    var sx, sy;
    if (!big) { sx = (slot % 8) * 128; sy = Math.floor(slot / 8) * 64; }
    // big plates go to the lower half of atlas
    if (big) { var bi = SP.plates.filter(function (q) { return q.big; }).length; pl.big = true; sx = (bi % 4) * 256; sy = 512 + Math.floor(bi / 4) * 256; }
    pg.save(); pg.translate(sx, sy);
    var ov = null, w = 0.3, h = 0.15;
    if (pl.kind === 'exit') { pg.fillStyle = '#1a0000'; pg.fillRect(0, 0, 128, 64); fitText(pg, 'EXIT', 64, 34, 112, 46, '"Bungee", Impact, sans-serif', '#ff2a1a'); ov = { on: [2, 2, 2], off: [2, 2, 2] }; w = 0.38; h = 0.19; }
    else if (pl.kind === 'room') { pg.fillStyle = '#1f2a3a'; pg.fillRect(0, 0, 128, 64); pg.fillStyle = '#e8e2cf'; pg.fillRect(4, 4, 120, 56); fitText(pg, pl.text, 64, 24, 110, 30, '"Bungee", Impact, sans-serif', '#1f2a3a'); fitText(pg, pl.sub, 64, 50, 116, 14, '"Zen Kaku Gothic New", sans-serif', '#333'); w = 0.36; h = 0.18; }
    else if (pl.kind === 'marquee') { pg.fillStyle = '#f2efe4'; pg.fillRect(0, 0, 256, 128); fitText(pg, 'HOLLOW PINES', 128, 22, 240, 26, '"Bungee", Impact', '#7a1010'); fitText(pg, 'MIDDLE SCHOOL', 128, 48, 240, 18, '"Bungee", Impact', '#7a1010'); fitText(pg, 'NIGHT SCHOOL', 128, 78, 240, 22, '"Special Elite", monospace', '#111'); fitText(pg, 'ENROLLING NOW', 128, 104, 240, 18, '"Special Elite", monospace', '#111'); w = 2.9; h = 1.0; ov = { on: [1.2, 1.15, 1.0], off: [0.9, 0.86, 0.75] }; }
    else if (pl.kind === 'standee') { pg.clearRect(0, 0, 256, 256); drawHoots(pg, 128, 140, 0.95, { wave: 1 }); w = 1.1; h = 1.1; }
    else if (pl.kind === 'score') { pg.fillStyle = '#111'; pg.fillRect(0, 0, 256, 128); fitText(pg, 'HOME', 60, 24, 100, 22, '"Bungee"', '#fff'); fitText(pg, 'GUEST', 196, 24, 100, 22, '"Bungee"', '#fff'); fitText(pg, '00', 60, 78, 100, 60, 'VT323, monospace', '#ff2a1a'); fitText(pg, '00', 196, 78, 100, 60, 'VT323, monospace', '#ff2a1a'); fitText(pg, '0:00', 128, 112, 80, 22, 'VT323, monospace', '#ffb300'); w = 3.8; h = 1.7; ov = { on: [1.6, 1.6, 1.6], off: [0.5, 0.5, 0.5] }; }
    else if (pl.kind === 'drawing') { pg.fillStyle = '#fbfaf5'; pg.fillRect(0, 0, 256, 128); var rr = makeRNG(sx + sy); kidDrawing(pg, 256, 128, rr); w = 0.8; h = 0.4; }
    pg.restore();
    var u = sx / 1024, vv = 1 - (sy + (big ? chh : 64)) / 1024, uw = (big ? cw : 128) / 1024, vh = (big ? chh : 64) / 1024;
    var f = new PF(B, pl.li, pl.x, pl.y, pl.z, pl.rot);
    if (pl.kind === 'standee') {
      f.part(GEO.plane, pmat, 0, 1.0, 0, 1.4, 1.4, 1, [1, 1, 1], { uv: [u, vv, uw, vh] });
      f.part(GEO.plane, pmat, 0, 1.0, -0.005, 1.4, 1.4, 1, [0.6, 0.6, 0.6], { uv: [u, vv, uw, vh], ry: PI });
    } else f.part(GEO.plane, pmat, 0, 0, 0.004, w, h, 1, [1, 1, 1], { uv: [u, vv, uw, vh], ov: ov });
  });
  pmat.map.needsUpdate = true;
}
function kidDrawing(g, w, h, rnd) {
  g.lineWidth = 3; g.lineCap = 'round';
  var cols = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#111'];
  g.strokeStyle = '#43a047'; g.beginPath(); g.moveTo(0, h - 15); g.lineTo(w, h - 15); g.stroke();
  for (var i = 0; i < 4; i++) { var x = 30 + i * 50, hh = 40 + rnd() * 15; g.strokeStyle = cols[i % 4]; g.beginPath(); g.arc(x, h - 15 - hh, 9, 0, TAU); g.moveTo(x, h - 15 - hh + 9); g.lineTo(x, h - 35); g.lineTo(x - 8, h - 15); g.moveTo(x, h - 35); g.lineTo(x + 8, h - 15); g.moveTo(x - 10, h - 15 - hh + 22); g.lineTo(x + 10, h - 15 - hh + 22); g.stroke(); }
  // tall owl shape with black eyes
  g.fillStyle = '#5d4037'; g.beginPath(); g.ellipse(w - 40, h - 60, 24, 45, 0, 0, TAU); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.arc(w - 48, h - 82, 7, 0, TAU); g.arc(w - 32, h - 82, 7, 0, TAU); g.fill();
  g.font = '14px "Special Elite", monospace'; g.fillStyle = '#111'; g.textAlign = 'left'; g.fillText(rnd() < 0.5 ? 'MY CLASS' : 'ME AND MY FRENDS', 8, 16);
}
