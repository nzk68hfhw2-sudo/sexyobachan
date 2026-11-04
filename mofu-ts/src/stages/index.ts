// =============================================================
// stages/index.ts : ステージの一覧
// =============================================================
// 新しいステージを作ったら、ここに足していきます。
// 並び順が、そのまま解放される順番になります。

import type { Stage } from "../types";
import { stage1 } from "./stage1";
import { stage2 } from "./stage2";
import { stage3 } from "./stage3";

export const stages: Stage[] = [stage1, stage2, stage3];

/** まだ作っていないステージの名前（ステージ選択で「準備中」として見せる） */
export const upcoming: string[] = [
  "4. ユニオン型と型の絞り込み",
  "5. 関数の引数と戻り値の型",
  "6. オプショナルと null / undefined",
  "7. ジェネリクスの入門",
  "8. async / await と fetch",
  "9. 総仕上げ：小さなアプリを作る",
];

/** id からステージを探す。見つからなければ undefined */
export function findStage(id: string): Stage | undefined {
  return stages.find((s) => s.id === id);
}
