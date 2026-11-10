// ---- tutorial: look, walk, examine, phone, speed --------------------------------------------
var TUT = { on: false, step: 0, prog: 0, el: null, marker: null, lastYaw: 0, lastX: 0, lastZ: 0 };
var TUT_STEPS = [
  { id: 'look', title: 'まわりを見てみよう', touch: '画面の<b>右半分</b>を指でなぞると、まわりを見回せる。', pc: '<b>マウスでドラッグ</b>すると、まわりを見回せる。', need: 1.2 },
  { id: 'walk', title: '歩いてみよう', touch: '画面の<b>左半分</b>に指を置いて、そのまま動かすと歩ける（スティックが出る）。', pc: '<b>W A S D</b> キー（または矢印キー）で歩ける。', need: 2.0 },
  { id: 'touch', title: 'モノをしらべよう', touch: 'テーブルの<b>ラムネケース</b>（光る矢印の下）を<b>タップ</b>するか、近づいて右下の<b>ピンクのボタン</b>を押そう。', pc: 'テーブルの<b>ラムネケース</b>（光る矢印の下）を<b>クリック</b>するか、近づいて <b>E</b> キー。', need: 1 },
  { id: 'phone', title: 'スマホを開こう', touch: '右下の<b>📱ボタン</b>で、からだの状態・友達・図鑑などを見られる。', pc: '右下の<b>📱ボタン</b>（または <b>Tab</b> キー）で、からだの状態・友達・図鑑などを見られる。', need: 1 },
  { id: 'speed', title: '時間の速さを変えよう', touch: '右下の<b>▶1x ボタン</b>をタップするたびに 1倍→2倍→4倍→8倍 と速くなる。', pc: '右下の<b>▶1x ボタン</b>（または <b>F</b> キー）で 1倍→2倍→4倍→8倍。', need: 1 }
];
function startTutorial() {
  TUT.on = true; TUT.step = 0; TUT.prog = 0; TUT.lastYaw = PL.yaw; TUT.lastX = PL.x; TUT.lastZ = PL.z;
  if (!TUT.el) TUT.el = el('div', 'rm-tut', '', UI);
  if (!TUT.marker) {
    var c = mkCanvas(64, 96), g = c.getContext('2d');
    g.fillStyle = '#ffe14d'; g.shadowColor = '#ffe14d'; g.shadowBlur = 12;
    g.beginPath(); g.moveTo(32, 90); g.lineTo(8, 50); g.lineTo(22, 50); g.lineTo(22, 8); g.lineTo(42, 8); g.lineTo(42, 50); g.lineTo(56, 50); g.closePath(); g.fill();
    TUT.marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: toTex(c), depthTest: false, transparent: true }));
    TUT.marker.scale.set(0.14, 0.21, 1); TUT.marker.renderOrder = 20; RENDER.scene.add(TUT.marker);
  }
  TUT.el.style.display = '';
  renderTutorial();
}
function endTutorial(done) {
  TUT.on = false;
  if (TUT.el) TUT.el.style.display = 'none';
  if (TUT.marker) TUT.marker.visible = false;
  clearPulse();
  SAVE.tutorialDone = true; writeSave();
  if (done) { toast('🎉 チュートリアル完了！あとは朝まで自由にすごそう。', 'good', 4); sfx('combo'); }
}
function clearPulse() { [HUD.bPhone, HUD.bFF, HUD.bAct].forEach(function (b) { if (b) b.classList.remove('rm-pulse'); }); }
function renderTutorial() {
  if (!TUT.on) return;
  var st = TUT_STEPS[TUT.step], touch = isTouchDevice() || isMobile();
  var pct = Math.min(1, TUT.prog / st.need);
  TUT.el.innerHTML = '<div class="hd"><span>チュートリアル ' + (TUT.step + 1) + ' / ' + TUT_STEPS.length + '</span><u>スキップ</u></div>' +
    '<div class="tt">' + st.title + '</div><div class="tx">' + (touch ? st.touch : st.pc) + '</div>' +
    (st.need > 1 ? '<div class="bar"><i style="width:' + Math.round(pct * 100) + '%"></i></div>' : '') +
    (st.id === 'look' && touch ? '<div class="gest right">👆↔</div>' : '') + (st.id === 'walk' && touch ? '<div class="gest left">👆↕</div>' : '');
  onTap(TUT.el.querySelector('u'), function () { endTutorial(false); toast('チュートリアルをスキップした（設定からもう一度見られます）'); });
  clearPulse();
  if (st.id === 'touch') HUD.bAct.classList.add('rm-pulse');
  if (st.id === 'phone') HUD.bPhone.classList.add('rm-pulse');
  if (st.id === 'speed') HUD.bFF.classList.add('rm-pulse');
}
function tutNext() {
  sfx('ui'); TUT.step++; TUT.prog = 0;
  if (TUT.step >= TUT_STEPS.length) { endTutorial(true); return; }
  toast('✅ OK！', 'good', 1.5);
  renderTutorial();
}
function tutEvent(kind) {
  if (!TUT.on) return;
  var st = TUT_STEPS[TUT.step];
  if ((st.id === 'touch' && kind === 'interact') || (st.id === 'phone' && kind === 'phone') || (st.id === 'speed' && kind === 'speed')) setTimeout(tutNext, 300);
}
var _tutUiT = 0;
function updateTutorial(dt) {
  if (!TUT.on) return;
  var st = TUT_STEPS[TUT.step];
  if (st.id === 'look') { TUT.prog += Math.abs(angDiff(TUT.lastYaw, PL.yaw)) + 0; }
  if (st.id === 'walk') { TUT.prog += Math.hypot(PL.x - TUT.lastX, PL.z - TUT.lastZ); }
  TUT.lastYaw = PL.yaw; TUT.lastX = PL.x; TUT.lastZ = PL.z;
  if (st.need > 1 && TUT.prog >= st.need) { tutNext(); return; }
  _tutUiT -= dt; if (_tutUiT <= 0 && st.need > 1) { _tutUiT = 0.15; var b = TUT.el.querySelector('.bar i'); if (b) b.style.width = Math.round(Math.min(1, TUT.prog / st.need) * 100) + '%'; }
  // marker above the ramune case
  var show = st.id === 'touch';
  TUT.marker.visible = show;
  if (show) TUT.marker.position.set(-0.75, 0.75 + Math.sin(LOOP.t * 4) * 0.05, 0.55);
}
function angDiff(a, b) { var d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; }
