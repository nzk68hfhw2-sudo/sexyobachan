// ---- lesson minigames -------------------------------------------------------------
var LESSON = null;
var LESSON_CSS = [
  '.hp-lesson{position:absolute;left:12px;right:12px;bottom:calc(var(--bot-safe) + 6px);max-height:56%;background:#f4efe0;color:#1b1b1b;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.6);padding:12px 12px 14px;overflow:hidden;',
  ' background-image:repeating-linear-gradient(#f4efe0 0 25px,#cfd8e8 25px 26px);}',
  '.hp-lesson:before{content:"";position:absolute;left:34px;top:0;bottom:0;width:2px;background:#e6a0a0;}',
  '.hp-lesson .hd{display:flex;justify-content:space-between;align-items:flex-start;padding-left:30px;}',
  '.hp-lesson .sub{font:20px Bungee;color:#1f3c88;} .hp-lesson .sub .ja{font-size:11px;color:#333;}',
  '.hp-lesson .qn{font:15px VT323;color:#555;}',
  '.hp-lesson .tbar{height:6px;background:#ddd;margin:6px 0 8px 30px;border-radius:3px;overflow:hidden;} .hp-lesson .tbar i{display:block;height:100%;background:#c62828;}',
  '.hp-lesson .q{font:22px/1.2 "Special Elite";padding-left:30px;min-height:34px;} .hp-lesson .q .ja{font-size:13px;color:#444;}',
  '.hp-lesson .opts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:10px;}',
  '.hp-lesson .opt{min-width:64px;min-height:56px;padding:6px 12px;border-radius:10px;border:2.5px solid #1b1b1b;background:#ffd84a;font:24px Bungee;color:#1b1b1b;box-shadow:0 4px 0 #1b1b1b;display:flex;align-items:center;justify-content:center;}',
  '.hp-lesson .opt:active{transform:translateY(3px);box-shadow:0 1px 0 #1b1b1b;}',
  '.hp-lesson .opt.ok{background:#8bdc6a;} .hp-lesson .opt.ng{background:#ff8f8f;} .hp-lesson .opt.used{opacity:.25;pointer-events:none;}',
  '.hp-lesson .slots{display:flex;gap:6px;justify-content:center;margin:8px 0;} .hp-lesson .slots span{width:34px;height:42px;border-bottom:3px solid #1b1b1b;font:28px Bungee;text-align:center;}',
  '.hp-lesson .beakers{display:flex;gap:10px;justify-content:center;margin-top:10px;}',
  '.hp-lesson .beaker{width:62px;height:80px;border-radius:0 0 18px 18px;border:3px solid #1b1b1b;border-top:none;position:relative;opacity:.55;transition:opacity .1s,transform .1s;}',
  '.hp-lesson .beaker.lit{opacity:1;transform:scale(1.12);box-shadow:0 0 22px currentColor;}',
  '.hp-lesson .lane{position:relative;height:120px;margin-top:6px;}',
  '.hp-lesson .ring{position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:4px solid #1f3c88;}',
  '.hp-lesson .note{position:absolute;left:50%;top:50%;border-radius:50%;border:4px solid #c62828;pointer-events:none;}',
  '.hp-lesson .tapz{position:absolute;inset:0;}',
  '.hp-lesson .art{display:grid;grid-template-columns:repeat(5,1fr);gap:3px;width:min(260px,70%);margin:6px auto 0;}',
  '.hp-lesson .art div{aspect-ratio:1;border:2px solid #1b1b1b;background:#fff;font:16px Bungee;display:flex;align-items:center;justify-content:center;}',
  '.hp-lesson .pal{display:flex;gap:10px;justify-content:center;margin-top:8px;} .hp-lesson .pal div{width:56px;height:56px;border-radius:50%;border:3px solid #1b1b1b;font:18px Bungee;display:flex;align-items:center;justify-content:center;color:#fff;text-shadow:0 1px 2px #000;} .hp-lesson .pal div.sel{box-shadow:0 0 0 4px #fff,0 0 0 7px #1b1b1b;}',
  '.hp-lesson .fb{position:absolute;right:14px;top:10px;font:36px Bungee;transform:rotate(-8deg);}'
].join('\n');
var _lessonCssDone = false;
function runLesson(role, night, done, raidFn) {
  if (!_lessonCssDone) { var st = document.createElement('style'); st.textContent = LESSON_CSS; document.head.appendChild(st); _lessonCssDone = true; }
  var kinds = { MATH: lessonMath, ENGLISH: lessonEnglish, SCIENCE: lessonScience, MUSIC: lessonMusic, ART: lessonArt };
  var info = ROLE_INFO[role];
  var scr = showScreen('lesson', '');
  scr.style.pointerEvents = 'none';
  var panel = el('div', 'hp-lesson pe', '', scr);
  LESSON = { role: role, night: night, done: done, raidFn: raidFn, panel: panel, score: 0, total: 3, q: 0, paused: false, t: 0, upd: null, raidAt: raidFn ? R.int(1, 2) : -1, info: info, finished: false };
  kinds[role](LESSON);
}
function lessonHeader(L, extra) {
  return '<div class="hd"><div class="sub">' + L.info.en + '<span class="ja">' + L.info.ja + '・' + (L.subtitle || '') + '</span></div><div class="qn">Q ' + Math.min(L.q + 1, L.total) + '/' + L.total + '</div></div><div class="tbar"><i style="width:100%"></i></div>' + (extra || '');
}
function lessonTimer(L, sec, onTimeout) {
  L.qT = sec; L.qMax = sec; L.onTimeout = onTimeout;
  L.upd = function (dt) { L.qT -= dt; var b = L.panel.querySelector('.tbar i'); if (b) b.style.width = Math.max(0, L.qT / L.qMax * 100) + '%'; if (L.qT <= 0 && L.onTimeout) { var f = L.onTimeout; L.onTimeout = null; f(); } };
}
function lessonAnswer(L, ok, then) {
  if (ok) { L.score++; sfx('right'); } else sfx('wrong');
  var fb = el('div', 'fb', ok ? '<span style="color:#2e7d32">✓</span>' : '<span style="color:#c62828">✗</span>', L.panel);
  L.onTimeout = null;
  setTimeoutG(function () {
    if (!LESSON || LESSON !== L) return;
    L.q++;
    if (L.q === L.raidAt && L.raidFn && !L.raided) { L.raided = true; L.resumeFn = then; L.raidFn(); return; }
    if (L.q >= L.total) finishLesson(L); else then();
  }, 700);
}
function finishLesson(L) {
  if (L.finished) return; L.finished = true;
  var sc = clamp(Math.round(L.score / L.total * 3), 0, 3);
  hideScreen('lesson'); LESSON = null;
  L.done(sc);
}
function pauseLesson(v) {
  var L = LESSON; if (!L) return;
  if (v === 'hide') { UIX.screens.lesson.style.display = 'none'; L.paused = true; return; }
  if (v) { L.paused = true; return; }
  UIX.screens.lesson.style.display = ''; L.paused = false;
  if (L.resumeFn) { var f = L.resumeFn; L.resumeFn = null; if (L.q >= L.total) finishLesson(L); else f(); }
}
function abortLesson() { if (LESSON) { hideScreen('lesson'); UIX.screens.lesson.style.display = ''; LESSON = null; } }
function updateLesson(dt) { if (LESSON && !LESSON.paused && LESSON.upd) LESSON.upd(dt); }

// MATH -----------------------------------------------------------------
function lessonMath(L) {
  L.subtitle = '計算';
  var creepy = L.night >= 2;
  function gen(i) {
    if (creepy && i === 2) { var s = 6 + L.night, c = s - (L.night >= 3 ? 2 : 1); return { en: s + ' students. ' + c + ' chairs. How many are left standing?', ja: '生徒' + s + '人、椅子' + c + '個。立ったままの子は何人？', a: s - c }; }
    var a = R.int(2, 9 + L.night * 2), b = R.int(2, 9 + L.night), op = R.pick(L.night >= 2 ? ['+', '-', '×'] : ['+', '-']);
    if (op === '-' && b > a) { var t = a; a = b; b = t; }
    var ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    return { en: a + ' ' + op + ' ' + b + ' = ?', ja: '計算しよう', a: ans };
  }
  function ask() {
    var q = gen(L.q);
    var opts = [q.a]; while (opts.length < 4) { var w = q.a + R.int(-5, 5); if (w >= 0 && opts.indexOf(w) < 0) opts.push(w); }
    R.shuffle(opts);
    L.panel.innerHTML = lessonHeader(L, '<div class="q">' + q.en + '<span class="ja">' + q.ja + '</span></div><div class="opts">' + opts.map(function (o) { return '<div class="opt" data-v="' + o + '">' + o + '</div>'; }).join('') + '</div>');
    var answered = false;
    Array.prototype.forEach.call(L.panel.querySelectorAll('.opt'), function (b) { onTap(b, function () { if (answered) return; answered = true; var ok = +b.getAttribute('data-v') === q.a; b.classList.add(ok ? 'ok' : 'ng'); lessonAnswer(L, ok, ask); }); });
    lessonTimer(L, 11, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); });
  }
  ask();
}
// ENGLISH --------------------------------------------------------------
var WORDS = [['APPLE', 'りんご', '🍎'], ['CHAIR', '椅子', '🪑'], ['PENCIL', '鉛筆', '✏️'], ['SCHOOL', '学校', '🏫'], ['LUNCH', '昼ごはん', '🍱'], ['BELL', 'ベル', '🔔'], ['FRIEND', '友だち', '🤝'], ['LOCKER', 'ロッカー', '🗄'], ['TEACHER', '先生', '👩‍🏫'], ['OWL', 'フクロウ', '🦉'], ['BOOK', '本', '📕'], ['NIGHT', '夜', '🌙']];
var WORDS_CREEPY = [['STAY', 'ここにいて', '🪑'], ['SEAT', '席', '🪑'], ['HUSH', '静かに', '🤫'], ['ALWAYS', 'ずっと', '♾'], ['MISSING', '行方不明', '❓']];
function lessonEnglish(L) {
  L.subtitle = 'スペル';
  var pool = R.shuffle(WORDS.slice()).filter(function (w) { return w[0].length <= 4 + L.night; });
  function ask() {
    var w = (L.night >= 2 && L.q === 2) ? R.pick(WORDS_CREEPY) : pool[L.q % pool.length];
    var letters = w[0].split('');
    var extra = 'AEIOUXZQRT'.split('').filter(function (c) { return letters.indexOf(c) < 0; }); R.shuffle(extra);
    var tiles = R.shuffle(letters.concat(extra.slice(0, 2)).map(function (c, i) { return { c: c, i: i }; }));
    var pos = 0;
    L.panel.innerHTML = lessonHeader(L, '<div class="q">' + w[2] + ' Spell: <b>' + w[1] + '</b><span class="ja">「' + w[1] + '」を英語でつづろう</span></div><div class="slots">' + letters.map(function () { return '<span></span>'; }).join('') + '</div><div class="opts">' + tiles.map(function (t, i) { return '<div class="opt" data-i="' + i + '">' + t.c + '</div>'; }).join('') + '</div>');
    var slots = L.panel.querySelectorAll('.slots span'), answered = false;
    Array.prototype.forEach.call(L.panel.querySelectorAll('.opt'), function (b) {
      onTap(b, function () {
        if (answered) return;
        var c = tiles[+b.getAttribute('data-i')].c;
        if (c === letters[pos]) { slots[pos].textContent = c; pos++; b.classList.add('used'); sfx('tick'); if (pos >= letters.length) { answered = true; lessonAnswer(L, true, ask); } }
        else { b.classList.add('ng'); answered = true; lessonAnswer(L, false, ask); }
      });
    });
    lessonTimer(L, 9 + letters.length * 1.6, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); });
  }
  ask();
}
// SCIENCE (sequence memory) ------------------------------------------------
function lessonScience(L) {
  L.subtitle = '実験（順番を覚えて）';
  var cols = ['#e53935', '#1e88e5', '#fdd835', '#43a047'], names = ['RED', 'BLUE', 'YELLOW', 'GREEN'], freqs = [392, 494, 587, 698];
  function ask() {
    var len = 3 + L.q + (L.night >= 3 ? 1 : 0);
    var seq = []; for (var i = 0; i < len; i++) seq.push(R.int(0, 3));
    L.panel.innerHTML = lessonHeader(L, '<div class="q">Watch the experiment!<span class="ja">光る順番を覚えて、同じ順番でタップ！</span></div><div class="beakers">' + cols.map(function (c, i) { return '<div class="beaker" data-i="' + i + '" style="background:linear-gradient(transparent 30%,' + c + ' 30%);color:' + c + '"></div>'; }).join('') + '</div>');
    var bk = L.panel.querySelectorAll('.beaker'), input = false, pos = 0, answered = false;
    var show = 0, st = 0.6;
    L.qT = 99; L.onTimeout = null;
    L.upd = function (dt) {
      if (!input) {
        st -= dt;
        if (st <= 0) {
          Array.prototype.forEach.call(bk, function (b) { b.classList.remove('lit'); });
          if (show < seq.length * 2) { if (show % 2 === 0) { var k = seq[show / 2]; bk[k].classList.add('lit'); sfx('note', null, { f: freqs[k] }); } show++; st = show % 2 ? 0.55 : 0.18; }
          else { input = true; lessonTimer(L, 3 + len * 1.4, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); }); var q = L.panel.querySelector('.q'); q.innerHTML = 'Your turn! Mix it!<span class="ja">あなたの番！</span>'; }
        }
      } else if (L.qT !== undefined) { L.qT -= dt; var b = L.panel.querySelector('.tbar i'); if (b) b.style.width = Math.max(0, L.qT / L.qMax * 100) + '%'; if (L.qT <= 0 && L.onTimeout) { var f = L.onTimeout; L.onTimeout = null; f(); } }
    };
    Array.prototype.forEach.call(bk, function (b) {
      onTap(b, function () {
        if (!input || answered) return;
        var k = +b.getAttribute('data-i');
        b.classList.add('lit'); setTimeoutG(function () { b.classList.remove('lit'); }, 160);
        sfx('note', null, { f: freqs[k] });
        if (k === seq[pos]) { pos++; if (pos >= seq.length) { answered = true; sfx('bubble'); lessonAnswer(L, true, ask); } }
        else { answered = true; lessonAnswer(L, false, ask); }
      });
    });
  }
  ask();
}
// MUSIC (rhythm) ---------------------------------------------------------
function lessonMusic(L) {
  L.subtitle = 'リズム';
  L.total = 3; // 3 phrases
  var scaleF = [262, 294, 330, 349, 392, 440, 494, 523];
  function ask() {
    var n = 6, hits = 0, judged = 0, notes = [], t = 0, bpm = 96 + L.night * 8 + L.q * 6, beat = 60 / bpm;
    for (var i = 0; i < n; i++) notes.push({ at: 1.2 + i * beat * (i % 3 === 2 ? 1.5 : 1) + (i > 2 ? beat * 0.5 : 0), el: null, done: false, f: scaleF[(i * 3 + L.q) % 8] });
    L.panel.innerHTML = lessonHeader(L, '<div class="q">Tap when the circle hits the ring!<span class="ja">赤い円がリングに重なった瞬間にタップ！</span></div><div class="lane"><div class="ring"></div><div class="tapz pe"></div></div>');
    var lane = L.panel.querySelector('.lane');
    notes.forEach(function (nt) { nt.el = el('div', 'note', '', lane); });
    var tapz = L.panel.querySelector('.tapz');
    tapz.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      var best = null, bd = 9;
      notes.forEach(function (nt) { if (nt.done) return; var d = Math.abs(nt.at - t); if (d < bd) { bd = d; best = nt; } });
      if (best && bd < 0.2) { best.done = true; hits++; judged++; best.el.style.borderColor = '#2e7d32'; sfx('note', null, { f: best.f }); }
      else sfx('tick');
    });
    L.upd = function (dt) {
      t += dt;
      notes.forEach(function (nt) {
        var dtn = nt.at - t, sz = 70 + Math.max(0, dtn) * 120;
        nt.el.style.width = sz + 'px'; nt.el.style.height = sz + 'px'; nt.el.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px';
        nt.el.style.opacity = dtn > 1.4 ? 0 : (nt.done ? 0.3 : 1);
        if (!nt.done && dtn < -0.2) { nt.done = true; judged++; nt.el.style.borderColor = '#999'; }
      });
      if (judged >= n && !L._ansd) { L._ansd = true; lessonAnswer(L, hits >= n - 2, function () { L._ansd = false; ask(); }); }
    };
  }
  ask();
}
// ART (color by number) ----------------------------------------------------
function lessonArt(L) {
  L.subtitle = 'ぬりえ（番号の色でぬろう）';
  var pal = [['#f7c948', 1], ['#8b5a2e', 2], ['#1f3c88', 3]];
  var pics = [
    [3, 3, 3, 3, 3, 0, 2, 2, 2, 0, 2, 1, 2, 1, 2, 2, 2, 1, 2, 2, 0, 2, 2, 2, 0], // owl face
    [0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1], // star
    [2, 2, 2, 2, 2, 2, 3, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2] // creepy face
  ];
  function ask() {
    var pic = pics[L.night >= 3 && L.q === 2 ? 2 : L.q % 2];
    var sel = 0, cells, answered = false;
    L.panel.innerHTML = lessonHeader(L, '<div class="q" style="font-size:17px">Color the numbers!<span class="ja">色を選んで、同じ番号のマスをぬろう（空白はそのまま）</span></div><div class="art">' + pic.map(function (v, i) { return '<div data-i="' + i + '">' + (v || '') + '</div>'; }).join('') + '</div><div class="pal">' + pal.map(function (p, i) { return '<div data-c="' + i + '" class="' + (i === 0 ? 'sel' : '') + '" style="background:' + p[0] + '">' + p[1] + '</div>'; }).join('') + '</div>');
    var filled = pic.map(function () { return 0; });
    cells = L.panel.querySelectorAll('.art div');
    Array.prototype.forEach.call(L.panel.querySelectorAll('.pal div'), function (d) { onTap(d, function () { sel = +d.getAttribute('data-c'); Array.prototype.forEach.call(L.panel.querySelectorAll('.pal div'), function (x) { x.classList.remove('sel'); }); d.classList.add('sel'); sfx('tick'); }); });
    Array.prototype.forEach.call(cells, function (c) {
      onTap(c, function () {
        if (answered) return; var i = +c.getAttribute('data-i'); if (!pic[i]) return;
        filled[i] = sel + 1; c.style.background = pal[sel][0]; c.textContent = ''; sfx('bubble');
        var need = pic.filter(function (v) { return v; }).length, ok = 0, all = 0;
        pic.forEach(function (v, k) { if (v && filled[k]) all++; if (v && filled[k] === v) ok++; });
        if (all >= need) { answered = true; lessonAnswer(L, ok >= need - 1, ask); }
      });
    });
    lessonTimer(L, 22, function () { if (answered) return; answered = true; lessonAnswer(L, false, ask); });
  }
  ask();
}
