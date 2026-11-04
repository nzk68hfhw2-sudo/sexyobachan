// injected test bot: plays the night correctly at high speed (for catching runtime errors)
window.__bot = setInterval(function () {
  var E = window.__ssdEval; if (!E) return;
  E(`(function(){
  if (GAME.mode !== 'play') return;
  if (DOC.open) closeDocs();
  if (SLIP.open) hideChoices();
  TALK.busy = false;
  CUSTS.slice().forEach(function (C) {
    var A = C.anomaly;
    if (A && !A.done) {
      if (A.id === 'faceless' && C.state === 'wait') refuseCustomer(C);
      if (A.id === 'doppel' && C.state === 'wait') ignoreCustomer(C);
      if (A.id === 'offmenu') { if (C.state === 'wait') seatCustomer(C, freeSeats('stool')[0] || freeSeats('booth')[0]); else if (C.state === 'seated') giveMenu(C); else if (C.state === 'ready') { C.items = C.forcedItems; refuseOdd(C); C.state = 'x'; } }
      return;
    }
    if (C.state === 'wait') { var s = freeSeats(C.kid ? 'booth' : null)[0]; if (s) seatCustomer(C, s); }
    else if (C.state === 'seated') giveMenu(C);
    else if (C.state === 'ready') { C.items = makeOrder(C); writeTicket(C); }
    else if (C.state === 'ordered' && C.ticket && !C.ticket.ready) { C.ticket.items.forEach(function (i) { i.done = true; i.q = 0.8; }); afterCook(C.ticket); }
    else if (C.state === 'ordered' && C.ticket && C.ticket.ready) serveCustomer(C);
    else if (C.state === 'check') payCustomer(C);
  });
  TICKETS.slice().forEach(function (T) { if (T.booth4) tearTicket(T); });
  ACTIVE.slice().forEach(function (A) {
    if (A.id === 'jukebox' && A.t > 14) ANOM.jukebox.choose(A, A.orig);
    if (A.id === 'phone' && A.ringing && A.ring === 3) ANOM.phone.answer(A);
    if (A.id === 'reflection' && !CAM.inFreezer) enterFreezer();
    if (A.id === 'headlights' && A.parked && LSTATE.lightsOn) { toggleLights(); toggleNeon(); }
    if (A.id === 'dayshift') { if (A.stage === 1 && !CAM.inFreezer) enterFreezer(); if (A.stage === 2) ANOM.dayshift.openFront(A); }
  });
  if (!ACTIVE.some(function (a) { return a.id === 'headlights'; }) && !LSTATE.lightsOn) { toggleLights(); toggleNeon(); }
  if (CAM.inFreezer && (GAME.freezeCount >= 10 || GAME.cold > 0.8)) leaveFreezer();
  })(); 1`);
}, 400);
