// =============================================================
// theme.ts : 見た目の設定（ダークモード・文字の大きさ）を反映する
// =============================================================
// <html> に data-theme="dark" のような印をつけると、
// CSS（styles/main.css）のほうで色が切りかわる仕組みです。

import type { Settings } from "../types";

/**
 * ゲームを開いた時点でついていた印。
 * Claude の上などで動かすと、外側（ページを表示している側）が
 * 最初から data-theme をつけてくれていることがあります。
 * 「自動」のときは、その印をそのまま使います。
 */
const hostTheme: string | undefined = document.documentElement.dataset.theme;

export function applySettings(s: Settings): void {
  const root = document.documentElement;
  if (s.theme === "auto") {
    // 「自動」は、外側の印か、パソコンやスマホの設定にまかせる
    if (hostTheme === undefined) delete root.dataset.theme;
    else root.dataset.theme = hostTheme;
  } else {
    root.dataset.theme = s.theme;
  }
  root.dataset.font = s.fontSize;
}
