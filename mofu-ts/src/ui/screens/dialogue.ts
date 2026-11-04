// =============================================================
// 会話画面：モフじいのセリフを1つずつ出す
// =============================================================
// 自動では進みません。「つぎへ」を押したときだけ進みます。

import type { Game } from "../../game";
import type { Stage } from "../../types";
import { h, richText } from "../dom";
import { mofuSvg, speakerName } from "../mofu";

export function renderDialogue(_game: Game, stage: Stage, onDone: () => void): HTMLElement {
  let index = 0;

  const face = h("div", { class: "mascot small" });
  const name = h("p", { class: "speaker" });
  const bubble = h("p", { class: "bubble", "aria-live": "polite" });
  const counter = h("p", { class: "counter" });
  const nextBtn = h("button", { class: "btn primary big" });
  const skipBtn = h("button", { class: "btn ghost", onclick: onDone }, "会話をとばして問題へ");

  /** いまのセリフを画面に出す */
  const draw = (): void => {
    const line = stage.intro[index];
    if (!line) return onDone();
    face.innerHTML = mofuSvg(line.speaker);
    name.textContent = speakerName[line.speaker];
    bubble.replaceChildren(richText(line.text));
    counter.textContent = `${index + 1} / ${stage.intro.length}`;
    const last = index === stage.intro.length - 1;
    nextBtn.textContent = last ? "問題へ進む" : "つぎへ";
  };

  nextBtn.addEventListener("click", () => {
    index++;
    draw();
  });

  draw();

  return h(
    "section",
    { class: "screen dialogue-screen" },
    h("h2", { class: "stage-label" }, `ステージ${stage.number}「${stage.title}」`),
    h("div", { class: "talk" }, face, h("div", {}, name, bubble)),
    counter,
    h("div", { class: "actions" }, nextBtn),
    h("div", { class: "actions" }, skipBtn),
  );
}
