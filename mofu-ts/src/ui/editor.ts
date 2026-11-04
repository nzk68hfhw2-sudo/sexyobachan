// =============================================================
// editor.ts : コードを書く欄
// =============================================================
// 重い専用エディタは使わず、ふつうの <textarea> に
// 「行番号」「Tab キーで字下げ」「改行したとき字下げを引きつぐ」
// の3つだけを足しています。

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
    wrap: "off",
    "aria-label": "コードを書く欄",
  });
  area.value = initial;

  /** 行番号を、いまの行数に合わせて書き直す */
  const updateGutter = (): void => {
    const count = area.value.split("\n").length;
    let text = "";
    for (let i = 1; i <= count; i++) text += i + "\n";
    gutter.textContent = text;
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

  const root = h("div", { class: "editor" }, gutter, area);
  // 画面に置かれてから高さを合わせる
  requestAnimationFrame(updateGutter);
  updateGutter();

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
