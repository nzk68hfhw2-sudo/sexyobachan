// =============================================================
// ステージ選択画面
// =============================================================
// ステージは順番に開きます。前のステージをクリアすると、次が開きます。

import type { Game } from "../../game";
import { stages, upcoming } from "../../stages";
import { h } from "../dom";

export function renderStageSelect(game: Game): HTMLElement {
  const items = stages.map((stage) => {
    const solvedCount = stage.problems.filter((p) => game.data.solved.includes(p.id)).length;
    const unlocked = game.isUnlocked(stage);
    const status = game.isCleared(stage)
      ? "クリア"
      : unlocked
        ? `${solvedCount} / ${stage.problems.length}問 解いた`
        : "前のステージをクリアすると開くよ";
    return h(
      "button",
      { class: "btn stage-item", disabled: !unlocked, onclick: () => game.startStage(stage.id) },
      `${stage.number}. ${stage.title}`,
      h("span", { class: "sub" }, status),
    );
  });

  return h(
    "section",
    { class: "screen" },
    h("h2", {}, "ステージをえらぶ"),
    h("div", { class: "menu" }, ...items),
    h("p", { class: "note" }, "準備中のステージ"),
    h("ul", { class: "upcoming" }, ...upcoming.map((u) => h("li", {}, u))),
    h("div", { class: "actions" }, h("button", { class: "btn", onclick: () => game.goTitle() }, "タイトルへもどる")),
  );
}
