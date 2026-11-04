// =============================================================
// helpers.ts : 問題の判定でよく使う小さな関数
// =============================================================

import type { CheckResult, TypeInfo } from "../types";

/** 正解のときに返す値。毎回 { ok: true } と書かなくてすむように */
export const OK: CheckResult = { ok: true };

/** まだねらい通りではないときに返す値 */
export function notYet(message: string): CheckResult {
  return { ok: false, message };
}

/**
 * オブジェクトの形が、期待した形とぴったり同じかを確かめる。
 * 足りない・多すぎる・型がちがう、のどれかなら、その説明を返す。
 * ぴったりなら null を返す。
 */
export function diffProps(info: TypeInfo | null, expected: Record<string, string>): string | null {
  if (!info) return "まだ型が書かれていないみたい。";
  const names = Object.keys(expected);
  for (const n of names) {
    const got = info.props[n];
    if (got === undefined) return `形の中に「${n}」がまだないみたい。`;
    if (got !== expected[n]) return `「${n}」の型が ${got} になっているよ。${expected[n]} にしてみよう。`;
  }
  for (const n of Object.keys(info.props)) {
    if (!names.includes(n)) return `形の中に、今回は使わない「${n}」が入っているよ。`;
  }
  return null;
}
