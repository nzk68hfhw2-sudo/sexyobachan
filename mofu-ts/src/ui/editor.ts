// =============================================================
// editor.ts : コードを書く欄
// =============================================================
// 重い専用エディタは使わず、ふつうの <textarea> に
// 「行番号」「Tab キーで字下げ」「改行したとき字下げを引きつぐ」
// の3つだけを足しています。
//
// 長い行は、横にはみ出さずに折り返して表示します（スマホでも全部見えるように）。
// 折り返すと「見た目の行」と「本当の行」がずれるので、
// 見えない写し（mirror）に同じ文字を並べて、本当の1行ごとの高さを測り、
// 行番号をその高さに合わせて並べています。

import { h } from "./dom";

export interface Editor {
  /** 画面に置く部品 */
  root: HTMLElement;
  getValue(): string;
  setValue(code: string): void;
  focus(): void;
}

/**
 * エディタを作る。
 * onChange は「書きかえられるたびに呼ばれる関数」。
 * (code: string) => void は「文字を受け取って、何も返さない関数」の型です。
 */
export function createEditor(initial: string, onChange: (code: string) => void): Editor {
  const gutter = h("div", { class: "editor-gutter", "aria-hidden": "true" });
  const area = h("textarea", {
    class: "editor-area",
    spellcheck: "false",
    autocapitalize: "off",
    autocomplete: "off",
    "aria-label": "コードを書く欄",
  });
  area.value = initial;
  // 高さを測るための、見えない写し
  const mirror = h("div", { class: "editor-area editor-mirror", "aria-hidden": "true" });
  const body = h("div", { class: "editor-body" }, area, mirror);

  /** 行番号を、いまの行（と折り返し）に合わせて書き直す */
  const updateGutter = (): void => {
    const lines = area.value.split("\n");

    // 写しに、本当の1行ずつを別々の箱として並べる
    mirror.style.width = area.clientWidth + "px";
    mirror.replaceChildren(
      ...lines.map((line) => h("div", {}, line === "" ? "​" : line)), // 空の行も高さを持つように
    );
    const heights = Array.from(mirror.children, (el) => (el as HTMLElement).offsetHeight);

    gutter.replaceChildren(
      ...lines.map((_, i) => {
        const num = h("div", {}, String(i + 1));
        const hgt = heights[i];
        if (hgt) num.style.height = hgt + "px";
        return num;
      }),
    );

    // 行数に合わせて高さを変える（中でスクロールさせない）
    area.style.height = "auto";
    area.style.height = area.scrollHeight + "px";
  };

  /** カーソルの位置に文字を入れる */
  const insert = (text: string): void => {
    const { selectionStart: s, selectionEnd: e } = area;
    area.value = area.value.slice(0, s) + text + area.value.slice(e);
    area.selectionStart = area.selectionEnd = s + text.length;
    area.dispatchEvent(new Event("input"));
  };

  area.addEventListener("input", () => {
    updateGutter();
    onChange(area.value);
  });

  area.addEventListener("keydown", (ev) => {
    // 日本語を変換している最中は、何もしない
    if (ev.isComposing) return;
    if (ev.key === "Tab" && !ev.shiftKey) {
      ev.preventDefault();
      insert("  ");
    } else if (ev.key === "Enter" && !ev.ctrlKey && !ev.metaKey) {
      // いまの行の先頭の空白を、次の行にも引きつぐ
      const before = area.value.slice(0, area.selectionStart);
      const lineStart = before.lastIndexOf("\n") + 1;
      const indent = /^[ \t]*/.exec(before.slice(lineStart))?.[0] ?? "";
      const extra = /[{[(]\s*$/.test(before) ? "  " : "";
      ev.preventDefault();
      insert("\n" + indent + extra);
    }
  });

  const root = h("div", { class: "editor" }, gutter, body);

  // 画面の幅が変わる（スマホを横にする など）と折り返しも変わるので、測り直す
  try {
    new ResizeObserver(() => updateGutter()).observe(body);
  } catch {
    window.addEventListener("resize", updateGutter);
  }
  // 画面に置かれてから高さを合わせる
  requestAnimationFrame(updateGutter);

  return {
    root,
    getValue: () => area.value,
    setValue: (code) => {
      area.value = code;
      updateGutter();
      onChange(code);
    },
    focus: () => area.focus(),
  };
}
