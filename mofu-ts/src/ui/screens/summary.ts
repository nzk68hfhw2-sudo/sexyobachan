// =============================================================
// まとめ画面：ステージで学んだことを3行で
// =============================================================

import type { Game } from "../../game";
import type { Stage } from "../../types";
import { h, richText } from "../dom";
import { mofuSvg } from "../mofu";
import { playClear } from "../sound";

export function renderSummary(game: Game, stage: Stage, next: Stage | undefined): HTMLElement {
  playClear();
  const mascot = h("div", { class: "mascot jump" });
  mascot.innerHTML = mofuSvg("mofuji");

  return h(
    "section",
    { class: "screen summary-screen" },
    mascot,
    h("h2", {}, `ステージ${stage.number} クリア！`),
    h("p", { class: "lead" }, "このステージで学んだこと"),
    h("ol", { class: "summary" }, ...stage.summary.map((line) => h("li", {}, richText(line)))),
    h(
      "div",
      { class: "menu" },
      next
        ? h(
            "button",
            { class: "btn primary big", onclick: () => game.startStage(next.id) },
            `ステージ${next.number}へ進む`,
          )
        : h("p", { class: "notice good" }, "いま遊べるステージは、ここまで。つづきは準備中だよ。"),
      h("button", { class: "btn", onclick: () => game.goTitle() }, "タイトルへもどる"),
    ),
  );
}
