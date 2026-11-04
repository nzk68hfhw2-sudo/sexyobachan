// =============================================================
// sound.ts : 効果音
// =============================================================
// 音のファイルは使わず、Web Audio という仕組みで、その場で音を作ります。
// どれも小さく短い音です。設定でオフにできます。

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** 音を出す準備。ブラウザの決まりで、ユーザーが何か操作したあとでないと音は出せません */
function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null; // 音が使えない環境でも、ゲームは続ける
  }
}

/** 1つの音（高さ・始まる時間・長さ）を鳴らす */
function tone(ac: AudioContext, freq: number, start: number, length: number, volume: number): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine"; // やわらかい音
  osc.frequency.value = freq;
  const t = ac.currentTime + start;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

/** 正解の音：ドミソ と上がる */
export function playCorrect(): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, 523, 0, 0.25, 0.12);
  tone(ac, 659, 0.1, 0.25, 0.12);
  tone(ac, 784, 0.2, 0.4, 0.12);
}

/** ヒントを開いたときの音：ポン */
export function playSoft(): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, 440, 0, 0.18, 0.06);
}

/** ステージクリアの音 */
export function playClear(): void {
  const ac = audio();
  if (!ac) return;
  [523, 659, 784, 1047].forEach((f, i) => tone(ac, f, i * 0.12, 0.45, 0.1));
}
