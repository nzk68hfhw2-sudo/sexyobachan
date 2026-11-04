// =============================================================
// dom.ts : 画面の部品（HTML の要素）を作る小さな道具
// =============================================================
// document.createElement を毎回書くと長くなるので、
// h("button", { class: "btn" }, "おす") のように短く書けるようにしています。

/** 部品につけられる設定。on〜 で始まるものはイベント（クリックなど）として扱う */
type Props = Record<string, string | number | boolean | EventListener | undefined>;

/** 子どもに置けるもの：部品・文字・何もなし */
type Child = Node | string | null | undefined | false;

/**
 * 部品を作る。
 * <K extends keyof HTMLElementTagNameMap> はジェネリクス（ステージ7）。
 * "button" と書けば HTMLButtonElement が返ってくる、というように
 * 渡したタグ名に合わせて、返ってくる型が変わります。
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) {
      el.setAttribute(key, "");
    } else {
      el.setAttribute(key, String(value));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c);
  }
  return el;
}

/**
 * `コード` のように ` でかこまれた部分を <code> にして、文章を部品にする。
 * 解説の中のコードを読みやすくするためのもの。
 */
export function richText(text: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  const parts = text.split("`");
  parts.forEach((part, i) => {
    if (part === "") return;
    frag.append(i % 2 === 1 ? h("code", {}, part) : document.createTextNode(part));
  });
  return frag;
}
