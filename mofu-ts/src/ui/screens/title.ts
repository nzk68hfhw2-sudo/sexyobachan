// =============================================================
// タイトル画面
// =============================================================

import type { Game } from "../../game";
import { canStore, today } from "../../state/save";
import { findStage, stages } from "../../stages";
import { h } from "../dom";
import { mofuSvg } from "../mofu";

/** いまどこまで進んでいるかを、短い文にする */
function whereText(game: Game): string {
  const pos = game.data.position;
  const stage = pos ? findStage(pos.stageId) : undefined;
  if (!pos || !stage) return "はじめから";
  if (pos.step === "intro") return `ステージ${stage.number}のはじめから`;
  if (pos.step === "summary") return `ステージ${stage.number}のまとめから`;
  return `ステージ${stage.number}の ${pos.step + 1}問目から`;
}

export function renderTitle(game: Game): HTMLElement {
  const started = game.data.position !== null;
  const doneToday = game.data.lastDailyDate === today();
  const allClear = stages.every((s) => game.isCleared(s));

  const mascot = h("div", { class: "mascot" });
  mascot.innerHTML = mofuSvg("mofuji");

  return h(
    "section",
    { class: "screen title-screen" },
    mascot,
    h("h1", {}, "モフ山のTypeScript"),
    h("p", { class: "lead" }, "型は、モフたちの専用の箱。ゆっくり、ひとつずつ。"),

    doneToday
      ? h("p", { class: "notice good" }, "今日の1問は、もう達成しているよ。続けてもいいし、ここで休んでもいい。")
      : null,
    !canStore()
      ? h(
          "p",
          { class: "notice" },
          "この環境では自動保存ができないみたい。設定の「進捗をコピー」で控えをとっておくと安心だよ。",
        )
      : null,

    h(
      "div",
      { class: "menu" },
      h(
        "button",
        { class: "btn primary big", onclick: () => game.continueGame() },
        started ? "つづきから" : "はじめる",
        h("span", { class: "sub" }, whereText(game)),
      ),
      !allClear
        ? h(
            "button",
            { class: "btn big", onclick: () => game.startDaily() },
            "今日は1問だけ",
            h("span", { class: "sub" }, "1問解いたら、今日は達成"),
          )
        : null,
      h("button", { class: "btn", onclick: () => game.openStageSelect() }, "ステージをえらぶ"),
      h("button", { class: "btn", onclick: () => game.openSettings() }, "設定"),
    ),
  );
}
