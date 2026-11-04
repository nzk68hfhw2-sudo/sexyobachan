// =============================================================
// theme.ts : 見た目の設定（ダークモード・文字の大きさ）を反映する
// =============================================================
// <html> に data-theme="dark" のような印をつけると、
// CSS（styles/main.css）のほうで色が切りかわる仕組みです。

import type { Settings } from "../types";

export function applySettings(s: Settings): void {
  const root = document.documentElement;
  // "auto" のときは印をつけず、パソコンやスマホの設定にまかせる
  if (s.theme === "auto") delete root.dataset.theme;
  else root.dataset.theme = s.theme;
  root.dataset.font = s.fontSize;
}
