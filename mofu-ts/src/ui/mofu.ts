// =============================================================
// mofu.ts : モフたちの絵（SVG）
// =============================================================
// 絵はファイルではなく、SVG という「図形の文字列」で書いています。
// 白いモフモフした丸に、目とほっぺがあるだけのシンプルな姿です。

/** "mofuji" はモフじい（まゆげとおひげつき）、"mofu" は若いモフ */
export type MofuKind = "mofuji" | "mofu";

export function mofuSvg(kind: MofuKind): string {
  // ふちのモコモコは、小さな丸をぐるりと並べて表現
  const puffs: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 * i) / 12;
    const x = 50 + Math.cos(a) * 34;
    const y = 54 + Math.sin(a) * 30;
    puffs.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" />`);
  }
  const elder =
    kind === "mofuji"
      ? `<path d="M32 44 q6 -5 12 0 M56 44 q6 -5 12 0" class="mofu-line" fill="none"/>
         <path d="M38 66 q12 16 24 0 q-12 8 -24 0z" class="mofu-beard"/>`
      : "";
  return `<svg viewBox="0 0 100 100" class="mofu-svg" aria-hidden="true">
    <g class="mofu-body">${puffs.join("")}<ellipse cx="50" cy="54" rx="34" ry="30"/></g>
    <circle cx="40" cy="52" r="3.5" class="mofu-eye"/>
    <circle cx="60" cy="52" r="3.5" class="mofu-eye"/>
    <ellipse cx="33" cy="61" rx="5" ry="3" class="mofu-cheek"/>
    <ellipse cx="67" cy="61" rx="5" ry="3" class="mofu-cheek"/>
    ${elder}
  </svg>`;
}

/** 名前の表示 */
export const speakerName: Record<MofuKind, string> = {
  mofuji: "モフじい",
  mofu: "モフ",
};
