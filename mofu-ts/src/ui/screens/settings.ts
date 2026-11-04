// =============================================================
// 設定画面：文字の大きさ・色・音・進捗のコピーと復元
// =============================================================

import type { Game } from "../../game";
import type { Settings } from "../../types";
import { canStore, clearStorage, emptySave, exportText, importText } from "../../state/save";
import { h } from "../dom";

/**
 * 「どれか1つを選ぶ」ボタンの列を作る。
 * <K extends keyof Settings> は「Settings のキーのどれか」という意味（ジェネリクス）。
 * K を "theme" にすると、values には theme に入れられる値しか書けなくなります。
 */
function choiceRow<K extends keyof Settings>(
  game: Game,
  label: string,
  key: K,
  values: { value: Settings[K]; text: string }[],
): HTMLElement {
  const row = h("div", { class: "choice-row", role: "group", "aria-label": label });
  const draw = (): void => {
    row.replaceChildren(
      ...values.map((v) =>
        h(
          "button",
          {
            class: "btn small",
            "aria-pressed": String(game.data.settings[key] === v.value),
            onclick: () => {
              game.data.settings[key] = v.value;
              game.settingsChanged();
              draw();
            },
          },
          v.text,
        ),
      ),
    );
  };
  draw();
  return h("div", { class: "setting" }, h("p", { class: "setting-label" }, label), row);
}

export function renderSettings(game: Game): HTMLElement {
  // ---- 進捗のコピー ----
  const exportBox = h("textarea", { class: "code-box", readonly: true, rows: 3, "aria-label": "進捗の文字列" });
  const exportMsg = h("p", { class: "note", "aria-live": "polite" });
  const exportBtn = h("button", { class: "btn" }, "進捗を文字にしてコピー");
  exportBtn.addEventListener("click", async () => {
    exportBox.value = exportText(game.data);
    exportBox.select();
    try {
      await navigator.clipboard.writeText(exportBox.value);
      exportMsg.textContent = "コピーしたよ。メモ帳などに貼って、とっておいてね。";
    } catch {
      exportMsg.textContent = "自動でコピーできなかったので、上の文字を選んでコピーしてね。";
    }
  });

  // ---- 進捗の復元 ----
  const importBox = h("textarea", { class: "code-box", rows: 3, "aria-label": "復元する文字列", placeholder: "MOFU1. から始まる文字を貼りつける" });
  const importMsg = h("p", { class: "note", "aria-live": "polite" });
  const importBtn = h("button", { class: "btn" }, "この文字から復元する");
  importBtn.addEventListener("click", () => {
    const data = importText(importBox.value);
    if (!data) {
      importMsg.textContent = "読みとれなかったみたい。MOFU1. から最後まで、ぜんぶ貼りつけられているか見てみてね。";
      return;
    }
    game.replaceData(data);
    importMsg.textContent = "復元できたよ。タイトルにもどると、つづきから遊べるよ。";
  });

  // ---- 最初からやり直す（2回押しで確定） ----
  const resetBtn = h("button", { class: "btn ghost" }, "進捗をぜんぶ消して、最初から");
  let armed = false;
  resetBtn.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      resetBtn.textContent = "本当に消す？（もう一度押すと消えるよ）";
      return;
    }
    const keep = game.data.settings;
    clearStorage();
    const fresh = emptySave();
    fresh.settings = keep; // 見た目の設定は残す
    game.replaceData(fresh);
    armed = false;
    resetBtn.textContent = "消したよ";
  });

  return h(
    "section",
    { class: "screen settings-screen" },
    h("h2", {}, "設定"),
    choiceRow(game, "文字の大きさ", "fontSize", [
      { value: "large", text: "大きめ" },
      { value: "xlarge", text: "とても大きい" },
    ]),
    choiceRow(game, "画面の色", "theme", [
      { value: "auto", text: "自動" },
      { value: "light", text: "明るい" },
      { value: "dark", text: "暗い" },
    ]),
    choiceRow(game, "効果音", "sound", [
      { value: true, text: "オン" },
      { value: false, text: "オフ" },
    ]),

    h("h3", {}, "進捗の控え"),
    h(
      "p",
      { class: "note" },
      canStore()
        ? "進捗はこのブラウザに自動で保存されているよ。別のブラウザに移したいときや、念のための控えに使えるよ。"
        : "この環境では自動保存ができないみたい。やめる前に、ここで控えをとっておくと安心だよ。",
    ),
    h("div", { class: "actions" }, exportBtn),
    exportBox,
    exportMsg,
    importBox,
    h("div", { class: "actions" }, importBtn),
    importMsg,

    h("h3", {}, "やり直し"),
    h("div", { class: "actions" }, resetBtn),

    h("div", { class: "actions" }, h("button", { class: "btn primary", onclick: () => game.back() }, "もどる")),
  );
}
