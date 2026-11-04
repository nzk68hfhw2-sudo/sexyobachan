// =============================================================
// 正解画面：すぐに短い演出とセリフ、そして「なぜ？」の解説
// =============================================================

import type { Game } from "../../game";
import type { Problem, Stage } from "../../types";
import { h, richText } from "../dom";
import { mofuSvg } from "../mofu";
import { playCorrect } from "../sound";

/** ほめことば。毎回同じだと飽きるので、いくつかから選ぶ */
const PRAISES = [
  "できたのう！ モフたちが、ぴったりの箱に入ったぞ。",
  "おみごと！ 見張り番も、にっこりしておる。",
  "よし！ 箱と中身が、きれいにそろったのう。",
  "すばらしい。いまの1問で、ひとつ強くなったぞ。",
  "モフモフ！ みんなが喜んで跳ねておる。",
];

export function renderCorrect(_game: Game, stage: Stage, problem: Problem, onNext: () => void): HTMLElement {
  playCorrect();

  const mascot = h("div", { class: "mascot jump" });
  mascot.innerHTML = mofuSvg("mofu");
  const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)] ?? PRAISES[0]!;
  const isLast = stage.problems[stage.problems.length - 1] === problem;

  return h(
    "section",
    { class: "screen correct-screen" },
    h("div", { class: "celebrate" }, mascot, h("h2", { class: "praise" }, "せいかい！")),
    h("p", { class: "bubble" }, praise),
    h(
      "div",
      { class: "panel explain" },
      h("p", { class: "panel-title" }, "なぜそうなるの？"),
      h("p", {}, richText(problem.explain)),
    ),
    h(
      "div",
      { class: "actions" },
      h("button", { class: "btn primary big", onclick: onNext }, isLast ? "まとめを見る" : "つぎへ"),
    ),
  );
}
