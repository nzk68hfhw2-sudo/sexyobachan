// =============================================================
// 問題画面：コードを書いて「たしかめる」
// =============================================================
// 画面の並び（いつも同じ順番）
//   1. いま何問目か（小さく）
//   2. 今やること（大きく、1文）
//   3. コードを書く欄 か 選択肢
//   4. 「たしかめる」と「ヒント」のボタン
//   5. ヒント・見張り番のお知らせ（押したときだけ出る）
// =============================================================

import type { Game } from "../../game";
import type { ChoiceProblem, CodeProblem, Hints, Stage } from "../../types";
import { analyze, isCompilerReady, loadCompiler } from "../../engine/compiler";
import { explainError } from "../../engine/errorDict";
import { h, richText } from "../dom";
import { createEditor } from "../editor";
import { playSoft } from "../sound";

/** ヒントの3段階の名前。as const をつけると、中身が変わらない並びとして扱われます */
const HINT_LEVELS = [
  { key: "direction", label: "ヒント1（考える方向）" },
  { key: "example", label: "ヒント2（似た例）" },
  { key: "almost", label: "ヒント3（ほぼ答え）" },
] as const;

export function renderProblem(game: Game, stage: Stage, index: number): HTMLElement {
  const problem = stage.problems[index];
  if (!problem) return h("section", { class: "screen" }, "問題が見つかりませんでした。");

  const feedback = h("div", { class: "feedback", "aria-live": "polite" });
  const hintArea = createHintArea(problem.hints);

  // problem.kind を見て、コード問題か選択問題かを分ける（ユニオン型の絞り込み）
  const body =
    problem.kind === "code"
      ? codeBody(game, stage, index, problem, feedback)
      : choiceBody(game, stage, index, problem, feedback);

  return h(
    "section",
    { class: "screen problem-screen" },
    h(
      "p",
      { class: "stage-label" },
      `ステージ${stage.number}　${index + 1}問目 / ${stage.problems.length}問`,
    ),
    h("h2", { class: "task" }, richText(problem.task)),
    problem.kind === "code" && problem.note ? h("p", { class: "note" }, richText(problem.note)) : null,
    body.main,
    h("div", { class: "actions" }, body.checkButton, hintArea.button),
    feedback,
    hintArea.list,
    h(
      "div",
      { class: "actions footer-actions" },
      body.resetButton,
      h("button", { class: "btn ghost", onclick: () => {
        body.beforeLeave?.();
        game.goTitle();
      } }, "きょうはここまで（保存してタイトルへ）"),
    ),
  );
}

// -------------------------------------------------------------
// ヒント：押すたびに1段ずつ開く
// -------------------------------------------------------------
function createHintArea(hints: Hints): { button: HTMLButtonElement; list: HTMLElement } {
  let opened = 0;
  const list = h("div", { class: "hints" });
  const button = h("button", { class: "btn" });

  const update = (): void => {
    const next = HINT_LEVELS[opened];
    if (next) {
      button.textContent = `${next.label}を開く`;
    } else {
      button.textContent = "ヒントはぜんぶ開いたよ";
      button.disabled = true;
    }
  };

  button.addEventListener("click", () => {
    const level = HINT_LEVELS[opened];
    if (!level) return;
    playSoft();
    list.append(
      h("div", { class: "hint" }, h("p", { class: "hint-label" }, level.label), h("p", {}, richText(hints[level.key]))),
    );
    opened++;
    update();
  });

  update();
  return { button, list };
}

/** 問題の種類ごとに作る部品 */
interface Body {
  main: HTMLElement;
  checkButton: HTMLButtonElement;
  resetButton: HTMLButtonElement | null;
  /** 画面を離れる前にしておくこと（なければ何もしない） */
  beforeLeave?: () => void;
}

// -------------------------------------------------------------
// コード問題
// -------------------------------------------------------------
function codeBody(
  game: Game,
  stage: Stage,
  index: number,
  problem: CodeProblem,
  feedback: HTMLElement,
): Body {
  const initial = game.data.drafts[problem.id] ?? problem.starter;

  // 書くたびに保存すると重いので、手が止まって少したってから保存する
  let timer: number | undefined;
  const editor = createEditor(initial, (code) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      game.data.drafts[problem.id] = code;
      game.persist();
    }, 400);
  });

  const checkButton = h("button", { class: "btn primary big" }, "たしかめる");
  const resetButton = h("button", { class: "btn ghost" }, "最初のコードにもどす");

  // 見張り番（コンパイラ）は重いので、画面を開いたらすぐ呼びに行っておく
  void loadCompiler().catch(() => {});

  const runCheck = async (): Promise<void> => {
    if (!isCompilerReady()) {
      checkButton.disabled = true;
      feedback.replaceChildren(h("p", { class: "info" }, "見張り番を呼んでいるよ。はじめてのときは少し時間がかかるよ……"));
      try {
        await loadCompiler();
      } catch {
        feedback.replaceChildren(
          h("p", { class: "info" }, "見張り番を呼べなかったみたい。ページを読みこみ直して、もう一度ためしてみてね。"),
        );
        checkButton.disabled = false;
        return;
      }
      checkButton.disabled = false;
    }

    const code = editor.getValue();
    const { errors, ctx } = analyze(code);

    if (errors.length > 0) {
      feedback.replaceChildren(errorView(errors, code));
      return;
    }
    const result = problem.check(ctx);
    if (result.ok) {
      window.clearTimeout(timer); // 書きかけの保存が、あとから割りこまないように
      game.solved(stage, index);
    } else {
      feedback.replaceChildren(
        h(
          "div",
          { class: "panel" },
          h("p", { class: "panel-title" }, "エラーはないよ。でも、もう一歩！"),
          h("p", {}, richText(result.message)),
        ),
      );
    }
  };

  checkButton.addEventListener("click", () => void runCheck());
  // Ctrl+Enter（Mac は ⌘+Enter）でもたしかめられる
  editor.root.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      void runCheck();
    }
  });

  // 「もどす」は2回押しで確定（うっかり消さないように）
  let armed = false;
  resetButton.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      resetButton.textContent = "本当にもどす？（もう一度押す）";
      return;
    }
    armed = false;
    resetButton.textContent = "最初のコードにもどす";
    editor.setValue(problem.starter);
    feedback.replaceChildren();
  });

  // 画面を離れる前に、書きかけをすぐ保存する
  const flush = (): void => {
    window.clearTimeout(timer);
    game.data.drafts[problem.id] = editor.getValue();
    game.persist();
  };

  return { main: editor.root, checkButton, resetButton, beforeLeave: flush };
}

/** 見張り番のお知らせを、やさしい日本語＋英語の原文で見せる */
function errorView(errors: ReturnType<typeof analyze>["errors"], code: string): HTMLElement {
  const SHOW = 2; // 一度に見せるのは2件まで。多すぎると読みにくいので
  const item = (e: (typeof errors)[number]): HTMLElement =>
    h(
      "div",
      { class: "error-item" },
      e.line !== null
        ? h("p", { class: "error-where" }, `${e.line}行目`, e.lineText ? h("code", {}, e.lineText) : null)
        : null,
      h("p", { class: "error-easy" }, explainError(e.code, e.message)),
      h("p", { class: "error-raw" }, `原文（TS${e.code}）: ${e.message.split("\n")[0] ?? ""}`),
    );

  const panel = h(
    "div",
    { class: "panel" },
    h("p", { class: "panel-title" }, `見張り番からのお知らせ（${errors.length}件）`),
    ...errors.slice(0, SHOW).map(item),
  );
  // 日本語入力のまま記号を打つと、見た目が似た「全角」の記号になってエラーになりやすい
  const wide = fullWidthSymbols(code);
  if (wide.length > 0) {
    panel.prepend(
      h(
        "p",
        { class: "notice" },
        `「${wide.join(" ")}」のような全角の記号がまざっているみたい。コードの記号は、日本語入力をオフにして半角で打ってね。（" " の中の文字は日本語のままでだいじょうぶ）`,
      ),
    );
  }
  if (errors.length > SHOW) {
    panel.append(
      h(
        "details",
        {},
        h("summary", {}, `ほかのお知らせも見る（あと${errors.length - SHOW}件）`),
        ...errors.slice(SHOW).map(item),
      ),
    );
  }
  return panel;
}

/** " " や // コメントの外にある全角記号を探す */
function fullWidthSymbols(code: string): string[] {
  const outside = code
    .replace(/\/\/.*$/gm, "") // 1行コメントを取りのぞく
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`/g, ""); // 文字の中身を取りのぞく
  const found = outside.match(/[：；，．＝（）｛｝［］＜＞｜？！”’　]/g) ?? [];
  return [...new Set(found)].map((c) => (c === "　" ? "（全角スペース）" : c));
}

// -------------------------------------------------------------
// 選択問題
// -------------------------------------------------------------
function choiceBody(
  game: Game,
  stage: Stage,
  index: number,
  problem: ChoiceProblem,
  feedback: HTMLElement,
): Body {
  let selected: number | null = null;
  const buttons = problem.options.map((opt, i) =>
    h("button", { class: "btn option", "aria-pressed": "false", onclick: () => select(i) }, h("code", {}, opt)),
  );
  const checkButton = h("button", { class: "btn primary big", disabled: true }, "これにする");

  const select = (i: number): void => {
    selected = i;
    buttons.forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    checkButton.disabled = false;
  };

  checkButton.addEventListener("click", () => {
    if (selected === null) return;
    if (selected === problem.answer) {
      game.solved(stage, index);
      return;
    }
    // まちがえても減点なし。理由をそえて、もう一度選べるようにする
    feedback.replaceChildren(
      h(
        "div",
        { class: "panel" },
        h("p", { class: "panel-title" }, "おしい、ちがうみたい。"),
        h("p", {}, richText(problem.feedback[selected] ?? "")),
        h("p", {}, "ほかのものも選んでみよう。"),
      ),
    );
  });

  return { main: h("div", { class: "options" }, ...buttons), checkButton, resetButton: null };
}
