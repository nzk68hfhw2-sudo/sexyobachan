// =============================================================
// 「今日は1問だけ」達成画面
// =============================================================

import type { Game } from "../../game";
import { h } from "../dom";
import { mofuSvg } from "../mofu";

/** "done" は1問解けたとき、"allClear" は遊べるステージをぜんぶ終えていたとき */
export function renderDailyDone(game: Game, reason: "done" | "allClear"): HTMLElement {
  const mascot = h("div", { class: "mascot jump" });
  mascot.innerHTML = mofuSvg("mofuji");

  if (reason === "allClear") {
    return h(
      "section",
      { class: "screen" },
      mascot,
      h("h2", {}, "いまのステージは、ぜんぶクリアしているよ"),
      h("p", { class: "lead" }, "好きなステージを、もう一度遊ぶこともできるよ。"),
      h(
        "div",
        { class: "menu" },
        h("button", { class: "btn primary big", onclick: () => game.openStageSelect() }, "ステージをえらぶ"),
        h("button", { class: "btn", onclick: () => game.goTitle() }, "タイトルへもどる"),
      ),
    );
  }

  return h(
    "section",
    { class: "screen" },
    mascot,
    h("h2", {}, "今日の1問、達成！"),
    h("p", { class: "lead" }, "今日の分は、これでおしまい。よくがんばったのう。"),
    h("p", {}, "次に開いたときは、つづきの問題から始まるよ。"),
    h(
      "div",
      { class: "menu" },
      h("button", { class: "btn primary big", onclick: () => game.goTitle() }, "今日はおしまい"),
      h("button", { class: "btn", onclick: () => game.startDaily() }, "もう1問だけやる"),
    ),
  );
}
