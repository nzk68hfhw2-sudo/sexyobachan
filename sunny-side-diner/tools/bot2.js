// injected test bot #2: plays a night by the rules, cooks through the real minigame flow, and logs a timeline
// window.__log = [[gameSeconds, clock, what], ...]
(function () {
  var E = window.__ssdEval; if (!E) return;
  E(`(function(){
    GAME.realT = 0; window.__log = [];
    var L = function (w) { window.__log.push([Math.round(GAME.realT * 10) / 10, clockStr(GAME.min), w]); };
    window.__L = L;
    var wrap = function (name, tag) { var f = eval(name); eval(name + ' = function(){ L(tag || name); return f.apply(this, arguments); }'); };
    ['ghostBell', 'hallwayLights', 'fakeOut', 'windowFace', 'behindYou', 'distantFigure', 'tvGlitch', 'costumeEnters', 'afterCalm'].forEach(function (n) { wrap(n); });
    var _say = say; say = function (who, en) { L('say ' + who + ': ' + en + (MINI.active ? ' [cooking]' : '')); return _say.apply(this, arguments); };
    var _on = anomalyOnset; anomalyOnset = function (A) { L('ANOMALY ' + A.id + (MINI.active ? ' [cooking]' : '')); return _on.apply(this, arguments); };
    var _res = anomalyResolve; anomalyResolve = function (A) { if (!A.done) L('resolved ' + A.id); return _res.apply(this, arguments); };
    var _sm = startMini; startMini = function (t) { L('cook ' + t); GAME.cookStart = GAME.realT; return _sm.apply(this, arguments); };
    var _em = endMini; endMini = function (q) { if (MINI.active) L('done ' + MINI.type + ' ' + (GAME.realT - GAME.cookStart).toFixed(1) + 's'); return _em.apply(this, arguments); };
    var _sc = spawnCustomer; spawnCustomer = function (a, o) { var C = _sc.apply(this, arguments); L('guest ' + (C.name || '') + (o && o.anomaly ? ' (odd)' : '')); return C; };
    var _js = jumpscare; jumpscare = function () { L('JUMPSCARE rule=' + GAME.failRule); return _js.apply(this, arguments); };
    var _sfx = sfx; sfx = function (n) { if (n === 'doorbell' || n === 'freezerBang' || n === 'steps' || n === 'knock' || n === 'whisper' || n === 'breath') L('sfx ' + n); return _sfx.apply(this, arguments); };
  })(); 1`);
  window.__bot = setInterval(function () {
    E(`(function(){
    if (GAME.mode !== 'play') return;
    if (DOC.open) closeDocs();
    // a guest check is open: the bot picks like a careful player
    if (SLIP.open) { var t = U.slip.querySelector('.t'); t = t ? t.textContent : '';
      if (/wrong with this food/.test(t)) { var o = U.slip.querySelectorAll('.opt')[1]; o.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return; }
      hideChoices(); }
    CUSTS.slice().forEach(function (C) {
      var A = C.anomaly;
      if (A && !A.done) {
        if (A.id === 'faceless' && C.state === 'wait') refuseCustomer(C);
        if (A.id === 'doppel' && C.state === 'wait') ignoreCustomer(C);
        if (A.id === 'offmenu') { if (C.state === 'wait') seatCustomer(C, freeSeats('stool')[0] || freeSeats('booth')[0]); else if (C.state === 'ready') { C.items = C.forcedItems; refuseOdd(C); C.state = 'x'; } }
        return;
      }
      if (C.state === 'wait' && !TALK.busy) { var s = freeSeats(C.kid ? 'booth' : null)[0]; if (s) seatCustomer(C, s); }
      else if (C.state === 'ready' && !TALK.busy) takeOrder(C);
      else if (C.state === 'ordered' && C.ticket && C.ticket.ready && !MINI.active) serveCustomer(C);
      else if (C.state === 'check') payCustomer(C);
    });
    TICKETS.slice().forEach(function (T) { if (T.booth4 || T.you) tearTicket(T); });
    // cooking: start the next ticket, finish the dish after a believable time
    if (!MINI.active && !MINI.endPending) { var T = TICKETS.filter(function (T) { return !T.ready && !T.booth4 && T.items.some(function (i) { return !i.done && !i.odd; }); })[0]; if (T && GAME.realT - (GAME.lastCookEnd || 0) > 1.5) quickCook(T); }
    if (MINI.active) { var need = { pancake: 7.5, egg: 5.2, burger: 3.8, coffee: 1.8, pie: 2.0, shake: 2.8 }[MINI.type] || 4; if (MINI.t > need) { endMini(0.8); GAME.lastCookEnd = GAME.realT; } }
    ACTIVE.slice().forEach(function (A) {
      if (A.id === 'jukebox' && A.t > 14) ANOM.jukebox.choose(A, A.orig);
      if (A.id === 'phone' && A.ringing && A.ring === 3 && !MINI.active) ANOM.phone.answer(A);
      if (A.id === 'reflection' && !CAM.inFreezer) enterFreezer();
      if (A.id === 'headlights' && A.parked && LSTATE.lightsOn) { toggleLights(); toggleNeon(); }
      if (A.id === 'dayshift') { if (A.stage === 1 && !CAM.inFreezer) enterFreezer(); if (A.stage === 2) ANOM.dayshift.openFront(A); }
    });
    if (!ACTIVE.some(function (a) { return a.id === 'headlights'; }) && !LSTATE.lightsOn) { toggleLights(); toggleNeon(); }
    if (CAM.inFreezer && (GAME.freezeCount >= 10 || GAME.cold > 0.8)) leaveFreezer();
    })(); 1`);
  }, 300);
})();
