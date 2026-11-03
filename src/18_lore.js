// ---- lore: tapes, notes, archive -------------------------------------------------
var LORE = [
  { id: 'letter', kind: 'note', night: 1, kindEn: 'ENVELOPE', kindJa: '封筒', title: 'Your Admission Letter (no stamp)', titleJa: 'あなたの入学許可証（切手なし）',
    en: 'The envelope has no stamp and no return address. Only a gold star sticker and a smell of chalk dust. On the back, in pencil, a child has written: "THERE IS ALWAYS ONE LESS CHAIR."',
    ja: '封筒には切手も差出人もない。金星シールが1枚と、チョークの粉のにおい。裏には子どもの字で鉛筆書き：「椅子はいつも1つ足りない」' },
  { id: 'ep1', kind: 'vhs', night: 1, kindEn: 'VHS TAPE', kindJa: 'VHSテープ', title: "HOOTS' HOOT-HOOT HOMEROOM — EP.1 (1986)", titleJa: '「フーツのフーフー・ホームルーム」第1話（1986）',
    script: [
      { d: 2.5, s: 'bars', en: '', ja: '', tone: true },
      { d: 3, s: 'logo', en: 'Moonlight Learning Company presents...', ja: 'ムーンライト・ラーニング社がお届けします…', say: 'Moonlight Learning Company presents', st: 'pa' },
      { d: 4, s: 'title', en: "It's HOOTS' HOOT-HOOT HOMEROOM!", ja: '「フーツのフーフー・ホームルーム」はじまるよ！', say: "It's Hoots' Hoot Hoot Homeroom!", st: 'cute' },
      { d: 4, s: 'dance', en: "Hoo-ray for learning! I'm Professor Hoots!", ja: '学ぶって楽しい！フーツ先生だよ！', say: "Hoo-ray for learning! I'm Professor Hoots!", st: 'cute' },
      { d: 4.5, s: 'friends', en: 'And my friends: Penny Pencil, Bitsy Bookworm, and Mister Marbles!', ja: 'お友だちのペニー・ペンシル、ビッツィ・ブックワーム、ミスター・マーブルズ！', say: 'And my friends! Penny Pencil, Bitsy Bookworm, and Mister Marbles!', st: 'cute' },
      { d: 4, s: 'classroom', en: 'Remember, kids: a good student is always in their seat!', ja: 'いい子はいつも自分の席にいるんだよ！', say: 'Remember kids. A good student is always in their seat!', st: 'cute' },
      { d: 1.2, s: 'classroomExtra', en: '', ja: '（教室の後ろに、もう1人立っている…？）' },
      { d: 1.5, s: 'static', en: '', ja: '' }
    ] },
  { id: 'seating', kind: 'memo', night: 1, kindEn: 'MEMO', kindJa: 'メモ', title: 'MEMO: Seating Chart Protocol (1991)', titleJa: 'メモ：座席表規定（1991年）',
    en: 'TO: All Night School Staff\nRE: SEATING CHART PROTOCOL\n\nChairs are to be counted before every period. There must ALWAYS be one (1) fewer chair than enrolled students.\n\nStudents who remain standing when the bell rings are to be marked ABSENT.\n\nAbsent students do not go home.\n\n— Moonlight Learning Co., Dept. of Attendance',
    ja: '宛先：夜間学校の全職員\n件名：座席表規定\n\n椅子は毎時間の前に数えること。椅子は必ず在籍生徒数より1つ少なくすること。\n\nベルが鳴った時に立っている生徒は「欠席」とする。\n\n欠席の生徒は家に帰らない。\n\n― ムーンライト・ラーニング社 出席管理部' },
  { id: 'news88', kind: 'news', night: 1, kindEn: 'NEWSPAPER', kindJa: '新聞の切り抜き', title: 'Hollow Pines Gazette — Sept. 12, 1988', titleJa: 'ホロウパインズ・ガゼット 1988年9月12日',
    en: '"LEARN ALL NIGHT!" — TV OWL COMES TO HOLLOW PINES\n\nMoonlight Learning Co., makers of the hit children\'s show "Hoots\' Hoot-Hoot Homeroom," will open an experimental night school at Hollow Pines Middle School. "Children learn best when they are sleepy," said company founder Dr. Agnes Whitlow. "Our special lullaby helps the lessons stick." Enrollment is free.',
    ja: '「夜通し学ぼう！」テレビのフクロウがホロウパインズに\n\n人気子ども番組「フーツのフーフー・ホームルーム」を作るムーンライト・ラーニング社が、ホロウパインズ中学で実験的な夜間学校を開く。創業者アグネス・ウィットロー博士は「子どもは眠い時にこそよく学ぶ。特別な子守唄が勉強を定着させる」と語った。入学金は無料。' },
  { id: 'yearbook', kind: 'note', night: 2, kindEn: 'YEARBOOK PAGE', kindJa: '卒業アルバムの1ページ', title: 'Night Owls Yearbook 1990', titleJa: 'ナイトアウルズ卒業アルバム 1990',
    en: 'MOST LIKELY TO SUCCEED: Danny R.\nBEST SMILE: (photo removed)\nPERFECT ATTENDANCE: Student #0\n\nUnder Student #0 there is no photo, just long black scribbles. Someone has written "she never sat down" in the margin, then crossed it out, then written it again.',
    ja: '成功しそうな人：ダニー・R\nベストスマイル：（写真なし）\n皆勤賞：生徒ゼロ番\n\n生徒ゼロ番の欄に写真はなく、黒く長いなぐり書きだけ。余白に「あの子は一度も座らなかった」と書かれ、消され、また書かれている。' },
  { id: 'whitlow7', kind: 'cassette', night: 2, kindEn: 'CASSETTE', kindJa: 'カセットテープ', title: 'Dr. Whitlow — PROJECT LULLABY, log 7', titleJa: 'ウィットロー博士 ― PROJECT LULLABY 記録7',
    en: '"Log seven. The lullaby works. Subjects fall asleep in their chairs and wake up knowing the lesson. Remarkable. But the ones who do not get a chair... they do not wake up at all. They keep walking the halls. Subject zero has been standing in the east hallway for three weeks. She does not blink. She tilts her head when you look at her."',
    ja: '「記録7。子守唄は効いている。被験者は椅子で眠り、目覚めると授業内容を覚えている。驚異的だ。だが椅子に座れなかった者は…二度と目覚めない。廊下を歩き続ける。被験者ゼロは3週間、東廊下に立ったままだ。まばたきをしない。見つめると、首をかしげる。」' },
  { id: 'suit', kind: 'memo', night: 2, kindEn: 'MEMO', kindJa: 'メモ', title: 'Costume Dept. — Re: The Hoots Suit', titleJa: '衣装部 ― フーツの着ぐるみについて',
    en: 'The Hoots suit must NEVER be removed during broadcast hours. Broadcast hours are now 24 hours a day.\n\nIf the performer asks to remove the head, refuse politely. If the performer stops asking, that is normal.\n\nPlease stop leaving food inside the beak.',
    ja: 'フーツの着ぐるみは放送時間中、絶対に脱がないこと。放送時間は現在24時間である。\n\n演者が頭を外したいと言っても丁重に断ること。演者が頼まなくなったら、それは正常である。\n\nくちばしの中に食べ物を入れるのはやめてください。' },
  { id: 'ep0', kind: 'vhs', night: 3, kindEn: 'VHS TAPE', kindJa: 'VHSテープ', title: 'EPISODE 0 — MASTER — DO NOT AIR', titleJa: '第0話 ― マスター ― 放送禁止',
    script: [
      { d: 2, s: 'static', en: '', ja: '' },
      { d: 3.5, s: 'title', en: 'Hoots\' Hoot-Hoot Homeroom... episode... zero.', ja: '「フーツのフーフー・ホームルーム」…第…0話。', say: 'Hoots Hoot Hoot Homeroom. Episode zero.', st: 'creepy' },
      { d: 4, s: 'classroom', en: 'Today we learn musical chairs! Everyone stand up!', ja: '今日は椅子取りゲームを習います！みんな立って！', say: 'Today we learn musical chairs. Everyone stand up.', st: 'cute' },
      { d: 3.5, s: 'classroomExtra', en: 'Oh dear. Someone is left standing.', ja: 'あらあら。誰かが立ったままね。', say: 'Oh dear. Someone is left standing.', st: 'creepy' },
      { d: 3.5, s: 'hall', en: 'That is okay. She can wait in the hall. Forever.', ja: 'いいのよ。廊下で待ってもらいましょう。ずっと。', say: 'That is okay. She can wait in the hall. Forever.', st: 'creepy' },
      { d: 0.6, s: 'face', img: 10 },
      { d: 2, s: 'static', en: '', ja: '' }
    ] },
  { id: 'news93', kind: 'news', night: 3, kindEn: 'NEWSPAPER', kindJa: '新聞の切り抜き', title: 'Hollow Pines Gazette — Oct. 30, 1993', titleJa: 'ホロウパインズ・ガゼット 1993年10月30日',
    en: '"THE LONG BELL": 14 STUDENTS, 2 PERFORMERS MISSING AFTER SCHOOL BLACKOUT\n\nA power outage during a Moonlight Learning night session left 14 students and two costumed performers unaccounted for. Witnesses outside reported the school bell ringing for nearly an hour. Police found every classroom chair occupied — by no one. The company says the program will continue.',
    ja: '「長いベル」停電の夜間学校で生徒14人と着ぐるみ演者2人が行方不明\n\nムーンライト・ラーニングの夜間授業中に停電が起き、生徒14人と着ぐるみの演者2人の行方がわからなくなった。外にいた人々は、ベルが1時間近く鳴り続けていたと証言。警察が見つけたのは、全ての椅子が「誰にも」埋められていない教室だった。会社は授業を続けると発表した。' },
  { id: 'penny', kind: 'cassette', night: 3, kindEn: 'CASSETTE', kindJa: 'カセットテープ', title: 'Cassette labeled "PENNY — IF YOU FIND THIS"', titleJa: '「ペニー ― これを見つけたら」と書かれたカセット',
    en: '"If you find this, we are in the basement. Bitsy\'s suit is empty. Marbles\' suit is empty. Mine will be soon. Gerald wouldn\'t take off the owl head. He kept saying: it\'s not me wearing it anymore. It\'s wearing me. Don\'t... don\'t let it teach you anything."',
    ja: '「これを見つけたなら、私たちは地下にいる。ビッツィの着ぐるみは空っぽ。マーブルズのも空っぽ。私のもすぐそうなる。ジェラルドはフクロウの頭を外さなかった。ずっと言ってた。もう俺が着てるんじゃない、こいつが俺を着てるんだって。お願い…あいつに何も教わらないで。」' },
  { id: 'janitor', kind: 'memo', night: 4, kindEn: 'CUSTODIAN LOG', kindJa: '用務員の日誌', title: 'Custodian Log — Night Shift', titleJa: '用務員日誌 ― 夜勤',
    en: 'Mr. S — Halls mopped. Smile maintained.\nMr. S — Halls mopped. Smile maintained.\nMr. S — Halls mopped. Smile maintained.\n\nNote from Principal Merriweather: "He works best when nobody watches him. Do NOT watch him. If you see him standing still, he is waiting for you to look away."',
    ja: 'S氏 ― 廊下モップがけ済み。笑顔を維持。（×3）\n\nメリウェザー校長より：「彼は誰にも見られていない時に一番よく働く。見てはいけない。彼が止まっているのは、あなたが目をそらすのを待っているのだ。」' },
  { id: 'picture', kind: 'vhs', night: 4, kindEn: 'VHS TAPE', kindJa: 'VHSテープ', title: 'PICTURE DAY 1993 (Raw Footage)', titleJa: '写真撮影の日 1993（未編集映像）',
    script: [
      { d: 2, s: 'bars', en: '', ja: '', tone: true },
      { d: 4, s: 'photo', en: 'Okay class, squeeze in! Everybody say cheese!', ja: 'はい、みんな詰めて！チーズって言って！', say: 'Okay class, squeeze in! Everybody say cheese!', st: 'pa' },
      { d: 3.5, s: 'photoExtra', en: 'Wait. Who is that in the back row?', ja: '待って。後ろの列のあれは誰？', say: 'Wait. Who is that in the back row?', st: 'pa' },
      { d: 3, s: 'photoHoots', en: 'Hoo-ray! Say cheese forever!', ja: 'フーレイ！ずっとチーズって言っててね！', say: 'Hoo ray. Say cheese forever.', st: 'creepy' },
      { d: 0.5, s: 'face', img: 29 },
      { d: 1.5, s: 'static', en: '', ja: '' }
    ] },
  { id: 'closure', kind: 'news', night: 4, kindEn: 'NEWSPAPER', kindJa: '新聞の切り抜き', title: 'Hollow Pines Gazette — May 2, 1994', titleJa: 'ホロウパインズ・ガゼット 1994年5月2日',
    en: 'MOONLIGHT LEARNING CO. CLOSES ITS DOORS\n\nThe company behind "Hoots\' Hoot-Hoot Homeroom" has ceased operations. Dr. Agnes Whitlow could not be reached for comment; her office was found with every chair stacked upside down on the desks. Hollow Pines Middle School will close at the end of the term. "The school will be locked," said the mayor. "Nobody will be going there at night."',
    ja: 'ムーンライト・ラーニング社、閉鎖\n\n「フーツのフーフー・ホームルーム」の制作会社が事業を停止した。ウィットロー博士とは連絡が取れず、彼女の事務所では全ての椅子が机の上に逆さに積まれていた。ホロウパインズ中学は学期末で閉校する。市長は「校舎は施錠される。夜にあそこへ行く者はいない」と語った。' },
  { id: 'gerald', kind: 'cassette', night: 5, kindEn: 'CASSETTE', kindJa: 'カセットテープ', title: 'Cassette labeled "GERALD — DO NOT PLAY"', titleJa: '「ジェラルド ― 再生禁止」と書かれたカセット',
    en: '"I can\'t find the zipper. There isn\'t a zipper anymore. It\'s warm in here. The kids love me. They always loved me. Hoo... hoo. I just want them to finish school. Everyone should finish school. Nobody leaves early. Nobody. Leaves. Early. Hoo-ray... for learning."',
    ja: '「ファスナーが見つからない。もうファスナーなんてないんだ。中はあたたかい。子どもたちは僕が大好きだ。ずっと大好きだった。フー…フー。ただ卒業してほしいだけ。みんな学校を終えるべきなんだ。誰も早退しない。誰も。早退。しない。学ぶって…すばらしい。」' },
  { id: 'mailing', kind: 'memo', night: 5, kindEn: 'MEMO', kindJa: 'メモ', title: 'Admissions Office — Mailing List', titleJa: '入学事務局 ― 送付先リスト',
    en: 'Admission letters are to be sent to every adult who never finished school.\n\nEnrollment must reach 100%.\n\nThe bus will pick them up.\n\n(Your name is on the list. It has been circled in red crayon, with a little gold star next to it.)',
    ja: '入学許可証は、学校を卒業できなかった全ての大人に送ること。\n\n在籍率は100％に達しなければならない。\n\nバスが迎えに行く。\n\n（リストにあなたの名前がある。赤いクレヨンで丸がつけられ、横に小さな金星シールが貼ってある。）' }
];
LORE.forEach(function (l) { l.kindEn = l.kindEn || 'NOTE'; });
function unlockLore(l) {
  SAVE.lore[l.id] = 1; writeSave(); GAME.stats.lore = (GAME.stats.lore || 0) + 1;
  if (l.kind === 'vhs') { showToast('VHS TAPE: ' + l.title, l.titleJa + '（ARCHIVEか視聴覚室のビデオで再生）', 3.5); sfx('tape'); return; }
  if (l.kind === 'cassette') { showToast('CASSETTE', l.titleJa + '（ARCHIVEで再生できる）', 3); sfx('tape'); return; }
  openNote(l, true);
}
function openNote(l, inGame) {
  var prevMode = GAME.mode;
  if (inGame) { GAME.mode = 'read'; }
  var body = l.kind === 'cassette' ? '<div style="font:13px VT323;color:#777">▶ PLAY ──────── ' + (l.en.length / 14 | 0) + 's</div>' : '';
  var paper = l.kind === 'news' ? '#e9e2cf' : l.kind === 'memo' ? '#fffbe9' : '#f3ead6';
  var s = showScreen('note', '<div style="position:absolute;inset:0;background:rgba(0,0,0,.82)"></div><div class="hp-panel"><div class="hp-scroll pe" style="background:' + paper + ';color:#1b1b1b;border-radius:4px;padding:16px;max-height:100%;width:min(420px,100%);text-align:left;box-shadow:0 10px 40px #000;transform:rotate(-1deg)">' +
    '<div style="font:12px VT323;color:#666;letter-spacing:.15em">' + l.kindEn + ' · ' + l.kindJa + '</div><div style="font:20px/1.15 \'Special Elite\';margin:4px 0 2px">' + l.title + '</div><div style="font:700 12px Zen Kaku Gothic New;color:#555;margin-bottom:10px">' + l.titleJa + '</div>' + body +
    '<div class="tw" style="font-size:15px;line-height:1.5;white-space:pre-wrap">' + l.en + '</div><hr style="border:none;border-top:1px dashed #999;margin:12px 0"><div style="font:500 13px/1.7 Zen Kaku Gothic New;white-space:pre-wrap;color:#333">' + l.ja + '</div>' +
    '<button class="hp-menu-btn pe" id="hp-note-x" style="margin-top:14px">' + bi('CLOSE', '閉じる') + '</button></div></div>');
  if (l.kind === 'cassette') { sfx('tape'); setTimeout(function () { say(l.en.replace(/["\n]/g, ' '), l.id === 'gerald' ? 'creepy' : 'npc', { pitch: l.id === 'penny' ? 1.3 : 0.8, rate: 0.95 }); }, 500); if (AU.ready) setLoop('tapehiss', 0.05, 0.2); }
  onTap(document.getElementById('hp-note-x'), function () { hideScreen('note'); stopVoice(); if (AU.ready) setLoop('tapehiss', 0, 0.1); sfx('uiBack'); if (inGame && GAME.mode === 'read') GAME.mode = prevMode === 'read' ? 'play' : prevMode; });
}

// ---- VHS player -------------------------------------------------------------
var VHS = null;
function openVHSPicker(inGame) {
  var tapes = LORE.filter(function (l) { return l.kind === 'vhs' && SAVE.lore[l.id]; });
  if (!tapes.length) { showToast('NO TAPES', 'VHSテープを持っていない（校内で探そう）'); return; }
  if (inGame) GAME.mode = 'read';
  var h = '<div style="position:absolute;inset:0;background:rgba(0,0,0,.85)"></div><div class="hp-panel"><div class="hp-dlg"><h2>' + bi('VCR — CHOOSE A TAPE', 'テープを選ぶ') + '</h2>';
  tapes.forEach(function (t) { h += '<button class="hp-menu-btn dark pe" data-t="' + t.id + '" style="font-size:14px">' + bi(t.title, t.titleJa) + '</button>'; });
  h += '<button class="hp-x pe" id="hp-vhs-x" style="width:100%;margin-top:8px">CLOSE / 閉じる</button></div></div>';
  showScreen('vhs', h);
  Array.prototype.forEach.call(UIX.screens.vhs.querySelectorAll('[data-t]'), function (b) { onTap(b, function () { playVHS(LORE.filter(function (l) { return l.id === b.getAttribute('data-t'); })[0], inGame); }); });
  onTap(document.getElementById('hp-vhs-x'), function () { hideScreen('vhs'); if (inGame) GAME.mode = 'play'; });
}
function playVHS(tape, inGame) {
  sfx('tape');
  var bgmWas = AU.cur;
  playBGM(null, { fade: 0.3 });
  var s = showScreen('vhs', '<div style="position:absolute;inset:0;background:#000"></div><div class="hp-panel" style="justify-content:center"><div style="position:relative;width:min(420px,100%);aspect-ratio:4/3;background:#000;border-radius:18px;overflow:hidden;box-shadow:0 0 0 10px #222,0 0 0 12px #444">' +
    '<canvas id="hp-vhs-cv" width="320" height="240" style="width:100%;height:100%;display:block;image-rendering:pixelated;filter:contrast(1.15) saturate(1.2) blur(.4px)"></canvas>' +
    '<div style="position:absolute;inset:0;background:repeating-linear-gradient(rgba(0,0,0,.18) 0 1px,transparent 1px 3px);pointer-events:none"></div>' +
    '<div id="hp-vhs-osd" style="position:absolute;left:10px;top:8px;font:20px VT323;color:#fff;text-shadow:2px 2px #000">PLAY ▶</div></div>' +
    '<div id="hp-vhs-sub" style="min-height:64px;margin-top:12px;width:min(420px,100%)"></div>' +
    '<button class="hp-x pe" id="hp-vhs-stop" style="min-width:140px;margin-top:6px">■ STOP / 停止</button></div>');
  var cv = document.getElementById('hp-vhs-cv'), g = cv.getContext('2d');
  var i = -1, t = 0, segT = 0, last = performance.now();
  VHS = { tape: tape, stop: false };
  if (AU.ready) setLoop('tapehiss', 0.06, 0.2);
  function stop() { VHS.stop = true; stopVoice(); if (AU.ready) setLoop('tapehiss', 0, 0.1); hideScreen('vhs'); sfx('rewind'); if (inGame) { GAME.mode = 'play'; } else if (bgmWas) playBGM(bgmWas, { fade: 1 }); }
  onTap(document.getElementById('hp-vhs-stop'), stop);
  function nextSeg() {
    i++; segT = 0;
    if (i >= tape.script.length) { stop(); return; }
    var sg = tape.script[i];
    var sub = document.getElementById('hp-vhs-sub');
    if (sub) sub.innerHTML = sg.en || sg.ja ? '<div class="hp-sub" style="position:static"><span class="box">' + bi(sg.en || '', sg.ja || '') + '</span></div>' : '';
    if (sg.say) say(sg.say, sg.st || 'pa');
    if (sg.s === 'static' || sg.s === 'face') sfx('staticBurst', null, { len: sg.d });
    if (sg.tone) sfx('feedback');
  }
  nextSeg();
  (function frame() {
    if (VHS.stop) return;
    var n = performance.now(), dt = Math.min(0.05, (n - last) / 1000); last = n; t += dt; segT += dt;
    var sg = tape.script[i]; if (!sg) return;
    vhsDraw(g, sg, segT, t);
    if (segT > sg.d) nextSeg();
    requestAnimationFrame(frame);
  })();
}
function vhsDraw(g, sg, st, t) {
  var W = 320, H = 240;
  g.save();
  switch (sg.s) {
    case 'bars': ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'].forEach(function (c, i) { g.fillStyle = c; g.fillRect(i * W / 7, 0, W / 7 + 1, H * 0.7); }); g.fillStyle = '#111'; g.fillRect(0, H * 0.7, W, H * 0.3); fitText(g, 'MOONLIGHT LEARNING · MASTER', W / 2, H * 0.85, W * 0.9, 16, 'VT323', '#fff'); break;
    case 'logo': g.fillStyle = '#0d1a4a'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff59d'; g.beginPath(); g.arc(W / 2, H * 0.4, 40, 0, TAU); g.fill(); g.fillStyle = '#0d1a4a'; g.beginPath(); g.arc(W / 2 - 14, H * 0.37, 38, 0, TAU); g.fill(); for (var s = 0; s < 20; s++) drawStar(g, (s * 61) % W, (s * 37) % (H * 0.7), 3, 'rgba(255,255,255,' + (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + s))) + ')'); fitText(g, 'MOONLIGHT LEARNING CO.', W / 2, H * 0.75, W * 0.9, 24, '"Luckiest Guy"', '#fff59d'); break;
    case 'title': { var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ff8a65'); gr.addColorStop(1, '#ffd54f'); g.fillStyle = gr; g.fillRect(0, 0, W, H); for (var r = 0; r < 7; r++) { g.strokeStyle = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa'][r]; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, H * 1.05, 190 - r * 9, PI, 0); g.stroke(); } drawHoots(g, W / 2, H * 0.55, 0.6 + Math.sin(st * 6) * 0.02, { wave: (Math.sin(st * 6) + 1) / 2, creepy: sg.st === 'creepy' && Math.sin(st * 9) > 0.6 ? 1 : 0 }); fitText(g, "HOOTS' HOOT-HOOT HOMEROOM", W / 2, H * 0.12, W * 0.95, 22, '"Luckiest Guy"', '#1f3c88'); break; }
    case 'dance': case 'friends': { g.fillStyle = '#7fd3ff'; g.fillRect(0, 0, W, H); g.fillStyle = '#5d9b3a'; g.fillRect(0, H * 0.78, W, H * 0.22); var b = Math.abs(Math.sin(st * 5)) * 10; drawHoots(g, sg.s === 'dance' ? W / 2 : W * 0.2, H * 0.55 - b, 0.42, { wave: (Math.sin(st * 6) + 1) / 2 }); if (sg.s === 'friends') { drawPenny(g, W * 0.45, H * 0.5 - (st > 1 ? b : -80), 0.45); drawBitsy(g, W * 0.63, H * 0.62 - (st > 2 ? b * 0.5 : -80), 0.45, { t: st }); drawMarbles(g, W * 0.85, H * 0.6 - (st > 3 ? b : -80), 0.45); } for (var k = 0; k < 6; k++) drawStar(g, (k * 70 + st * 40) % W, 20 + (k * 23) % 60, 6, '#fff'); break; }
    case 'classroom': case 'classroomExtra': {
      g.fillStyle = '#d9d0b0'; g.fillRect(0, 0, W, H); g.fillStyle = '#23392d'; g.fillRect(40, 20, 240, 70); fitText(g, 'MUSICAL CHAIRS!', W / 2, 55, 220, 22, '"Special Elite"', '#eee');
      for (var row = 0; row < 3; row++) for (var c2 = 0; c2 < 5; c2++) { var x = 40 + c2 * 60, y = 120 + row * 38; g.fillStyle = '#8b5a2e'; g.fillRect(x, y + 14, 34, 6); g.fillStyle = ['#f28b82', '#a7ffeb', '#fff475', '#cbf0f8', '#d7aefb'][(row + c2) % 5]; g.beginPath(); g.arc(x + 17, y + 4, 9, 0, TAU); g.fill(); }
      drawHoots(g, 26, 150, 0.22, { wave: 0.5 });
      if (sg.s === 'classroomExtra') { g.fillStyle = 'rgba(10,10,12,0.92)'; g.fillRect(292, 96, 14, 60); g.beginPath(); g.arc(299, 92, 9, 0, TAU); g.fill(); g.fillRect(290, 92, 18, 40); }
      break; }
    case 'hall': { g.fillStyle = '#0b0f0d'; g.fillRect(0, 0, W, H); g.strokeStyle = '#2a3a30'; for (var l = 0; l < 10; l++) { g.beginPath(); g.moveTo(W / 2, H * 0.45); g.lineTo(l * W / 9, H); g.stroke(); } g.fillStyle = '#1c2a22'; g.fillRect(W / 2 - 30, H * 0.3, 60, 50); g.fillStyle = 'rgba(200,210,200,0.85)'; g.fillRect(W / 2 - 3, H * 0.36, 6, 26); g.beginPath(); g.arc(W / 2, H * 0.35, 4, 0, TAU); g.fill(); fitText(g, 'CAM 04  10-30-93  03:12 AM', W / 2, H - 14, W * 0.9, 16, 'VT323', '#fff'); break; }
    case 'photo': case 'photoExtra': case 'photoHoots': {
      g.fillStyle = '#4a6fa5'; g.fillRect(0, 0, W, H); for (var pr = 0; pr < 3; pr++) for (var pc = 0; pc < 7; pc++) { var px = 30 + pc * 40 + (pr % 2) * 18, py = 70 + pr * 45; g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(px, py, 11, 0, TAU); g.fill(); g.fillStyle = ['#c62828', '#2e7d32', '#1565c0', '#f9a825'][(pr + pc) % 4]; g.fillRect(px - 13, py + 11, 26, 24); }
      if (sg.s !== 'photo') { g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(W - 30, 48, 12, 0, TAU); g.fill(); g.fillRect(W - 42, 48, 24, 40); }
      if (sg.s === 'photoHoots') drawHoots(g, W / 2, 50, 0.28, { creepy: 1 });
      fitText(g, 'HOLLOW PINES NIGHT SCHOOL · 1993', W / 2, H - 16, W * 0.9, 16, '"Special Elite"', '#fff'); break; }
    case 'face': g.fillStyle = '#000'; g.fillRect(0, 0, W, H); var im = FACE_TEX[sg.img] && FACE_TEX[sg.img].image; if (im) { g.drawImage(im, 40 + (R() - 0.5) * 20, (R() - 0.5) * 20, 240, 240); } break;
    case 'static': default: { var id = g.createImageData(W, H), d = id.data; for (var p = 0; p < d.length; p += 4) { var v = Math.random() * 255; d[p] = d[p + 1] = d[p + 2] = v; d[p + 3] = 255; } g.putImageData(id, 0, 0); }
  }
  // tape noise overlay
  if (sg.s !== 'static') { var yb = (t * 60) % H; g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, yb, W, 6); if (R() < 0.08) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, R() * H, W, 1); } }
  g.restore();
}

// ---- archive -----------------------------------------------------------------
function openArchive(tab) {
  tab = tab || 'record';
  var tabs = [['record', 'RECORD', '記録'], ['files', 'FILES', '図鑑'], ['tapes', 'TAPES & NOTES', '資料']];
  var h = '<div style="position:absolute;inset:0;background:#0c0c0e"></div><div class="hp-panel" style="justify-content:flex-start"><div style="display:flex;gap:6px;width:100%;margin-bottom:10px">';
  tabs.forEach(function (t) { h += '<button class="hp-x pe" data-tab="' + t[0] + '" style="flex:1;' + (t[0] === tab ? 'background:#ffd84a;color:#111' : '') + '">' + t[1] + '<br><span style="font:700 10px Zen Kaku Gothic New">' + t[2] + '</span></button>'; });
  h += '</div><div class="hp-scroll pe" style="flex:1;width:100%;text-align:left">';
  if (tab === 'record') {
    h += '<div style="background:#f2ead2;color:#151515;padding:14px;border-radius:4px;font-family:\'Special Elite\'">' +
      '<div style="font-size:22px">STUDENT RECORD</div><div style="font:700 12px Zen Kaku Gothic New">生徒記録</div><hr>' +
      row('BEST NIGHT', '最高到達夜', SAVE.bestNight || 0) + row('NIGHTS SURVIVED', 'クリアした夜の数', SAVE.clears || 0) + row('TIMES LATE (DEATHS)', '遅刻（死亡）回数', SAVE.deaths || 0) +
      row('FILES', 'モンスター図鑑', Object.keys(SAVE.monsters).length + ' / 6') + row('TAPES & NOTES', '資料', Object.keys(SAVE.lore).length + ' / ' + LORE.length) + '</div>';
  } else if (tab === 'files') {
    Object.keys(MONSTER_INFO).forEach(function (k) {
      var info = MONSTER_INFO[k], known = SAVE.monsters[k];
      h += '<div style="display:flex;gap:10px;background:#1a1712;border:1px solid #3a3226;padding:10px;margin-bottom:10px;border-radius:4px">';
      h += '<div style="width:84px;height:84px;flex:none;background:#000;border:1px solid #444;position:relative;overflow:hidden">' + (known ? '<img src="' + assetURL('images/face_' + ('0' + FACE_DEFS[k].img).slice(-2) + '.jpg') + '" style="width:100%;height:100%;object-fit:cover;filter:grayscale(.5) contrast(1.2)">' : '<div style="color:#555;font:40px Bungee;text-align:center;line-height:84px">?</div>') + '<div style="position:absolute;left:0;right:0;bottom:0;background:#a00;color:#fff;font:10px VT323;text-align:center">' + (known ? 'CLASSIFIED' : 'UNKNOWN') + '</div></div>';
      h += '<div style="min-width:0"><div style="font:16px Bungee;color:#eee">' + (known ? info.name : '???') + '</div><div style="font:700 11px Zen Kaku Gothic New;color:#aaa">' + (known ? info.ja : '未遭遇') + '</div>';
      if (known) h += '<div style="font:13px VT323;color:#ff6b5a;margin:4px 0">' + info.file + '<br>' + info.fileJa + '</div><div class="tw" style="font-size:12px;color:#ccc;line-height:1.35">' + info.desc + '</div><div style="font:500 11px/1.5 Zen Kaku Gothic New;color:#999;margin-top:4px">' + info.descJa + '</div><div style="font:700 11px Zen Kaku Gothic New;color:#ffd84a;margin-top:4px">TIP: ' + info.tipJa + '</div>';
      h += '</div></div>';
    });
  } else {
    LORE.forEach(function (l) {
      var got = SAVE.lore[l.id];
      h += '<button class="hp-menu-btn dark pe" data-lore="' + l.id + '" style="font-size:13px;text-align:left;' + (got ? '' : 'opacity:.4') + '"><span class="en" style="font-size:11px;color:#ffd84a">' + l.kindEn + '</span>' + bi(got ? l.title : '— NOT FOUND —', got ? l.titleJa : '未発見') + '</button>';
    });
  }
  h += '</div><button class="hp-menu-btn alt pe" id="hp-arc-x" style="margin-top:10px">' + bi('BACK', 'もどる') + '</button></div>';
  showScreen('archive', h);
  function row(a, b, v) { return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #aaa"><span>' + a + '<br><span style="font:700 11px Zen Kaku Gothic New">' + b + '</span></span><span style="font-size:26px">' + v + '</span></div>'; }
  Array.prototype.forEach.call(UIX.screens.archive.querySelectorAll('[data-tab]'), function (b) { onTap(b, function () { sfx('ui'); openArchive(b.getAttribute('data-tab')); }); });
  Array.prototype.forEach.call(UIX.screens.archive.querySelectorAll('[data-lore]'), function (b) { onTap(b, function () { var l = LORE.filter(function (q) { return q.id === b.getAttribute('data-lore'); })[0]; if (!SAVE.lore[l.id]) return; sfx('ui'); if (l.kind === 'vhs') playVHS(l, false); else openNote(l, false); }); });
  onTap(document.getElementById('hp-arc-x'), function () { sfx('uiBack'); hideScreen('archive'); });
}
