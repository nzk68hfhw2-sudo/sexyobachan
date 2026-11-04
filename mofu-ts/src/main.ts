// =============================================================
// main.ts : ゲームのスタート地点
// =============================================================
// index.html から最初に読み込まれるファイルです。
// 画面の「わく」（上の帯と、画面を入れる場所）を作り、司令塔（game.ts）を動かします。

import "./styles/main.css";
import { createGame } from "./game";
import { loadCompiler } from "./engine/compiler";
import { h } from "./ui/dom";

const app = document.querySelector<HTMLDivElement>("#app");
// querySelector は「見つからないかも」なので、null のときは止める（ステージ6で習う形）
if (!app) throw new Error("#app が見つかりません");

const screen = h("main", { class: "stage-area" });
const game = createGame(screen);

/** 上の帯にある「音」ボタン。いまの状態を文字で見せる */
const soundBtn = h("button", { class: "btn small" });
const drawSoundBtn = (): void => {
  soundBtn.textContent = game.data.settings.sound ? "音：オン" : "音：オフ";
  soundBtn.setAttribute("aria-pressed", String(game.data.settings.sound));
};
soundBtn.addEventListener("click", () => {
  game.data.settings.sound = !game.data.settings.sound;
  game.settingsChanged();
  drawSoundBtn();
});
drawSoundBtn();

const header = h(
  "header",
  { class: "topbar" },
  h("button", { class: "brand", onclick: () => game.goTitle() }, "モフ山"),
  h(
    "div",
    { class: "topbar-actions" },
    soundBtn,
    h(
      "button",
      {
        class: "btn small",
        onclick: () => {
          game.openSettings();
        },
      },
      "設定",
    ),
  ),
);

app.append(header, screen);
game.goTitle();

// 設定画面で音を切りかえたときも、上の帯の表示を合わせる
document.addEventListener("click", () => drawSoundBtn());

// 見張り番（TypeScript コンパイラ）は重いので、タイトルを出したあと、裏でこっそり呼んでおく
window.setTimeout(() => {
  void loadCompiler().catch(() => {});
}, 500);
