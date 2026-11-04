// =============================================================
// types.ts : ゲーム全体で使う「箱の形」をまとめたファイル
// =============================================================
// このファイル自体が TypeScript の教材です。
// ステージを進めたあとで読み返すと「あ、これ習ったやつだ」と
// 思える書き方をわざと使っています。
//
//   - type / interface        … ステージ3
//   - ユニオン型 "a" | "b"     … ステージ4
//   - オプショナル  ?:         … ステージ6
// =============================================================

/** ステージの番号。いまは 1〜3 が遊べます。 */
export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 会話の1行。だれが・何を話すか。 */
export interface Line {
  /** "mofuji" は案内役のモフじい、"mofu" は若いモフ。 */
  speaker: "mofuji" | "mofu";
  text: string;
}

/**
 * ヒントは必ず3段階。
 * オブジェクトの形を interface で決めておくと、
 * 1つでも書き忘れたら見張り番（コンパイラ）が教えてくれます。
 */
export interface Hints {
  /** ヒント1：どっちの方向に考えればいいか */
  direction: string;
  /** ヒント2：似た例 */
  example: string;
  /** ヒント3：ほぼ答え */
  almost: string;
}

/** 答えの判定結果。ok が false のときは、やさしい一言を添えます。 */
export type CheckResult = { ok: true } | { ok: false; message: string };

/**
 * 型の情報を、判定しやすい形にまとめたもの。
 * element?: は「あるかもしれないし、ないかもしれない」プロパティ（ステージ6で習います）。
 */
export interface TypeInfo {
  /** 型を文字にしたもの。例: "string", "number[]", "Mofu" */
  text: string;
  /** オブジェクトの形なら、中のプロパティ名 → 型の文字 */
  props: Record<string, string>;
  /** 配列（T[]）なら、中身 T の情報 */
  element?: TypeInfo;
}

/**
 * 問題の判定関数に渡される「道具箱」。
 * 書かれたコードを、名前で調べられるようにしてあります。
 */
export interface CheckContext {
  /** 書かれたコードそのもの */
  code: string;
  /** 変数があるか */
  hasVar(name: string): boolean;
  /** 変数に型注釈（: の後ろ）が書かれていれば、その型の情報。なければ null */
  varAnnotation(name: string): TypeInfo | null;
  /** 変数の初期値の種類 */
  initKind(name: string): "string" | "number" | "boolean" | "array" | "object" | "other" | null;
  /** 初期値がオブジェクト { ... } のとき、そのキーの一覧 */
  initKeys(name: string): string[];
  /** type 名前 = ... が書かれていれば、その型の情報 */
  typeAlias(name: string): TypeInfo | null;
  /** interface 名前 { ... } が書かれていれば、その型の情報（受け継いだ分も含む） */
  interfaceInfo(name: string): TypeInfo | null;
  /** interface が extends で受け継いでいる名前の一覧 */
  interfaceExtends(name: string): string[];
}

/** コードを書く問題 */
export interface CodeProblem {
  kind: "code";
  id: string;
  /** 画面のいちばん上に出す「今やること」1文 */
  task: string;
  /** 補足（小さめに出す）。なくてもよい */
  note?: string;
  /** 最初からエディタに入っているコード */
  starter: string;
  hints: Hints;
  /** 型エラーがなかったときに呼ばれ、ねらい通りかを確かめる */
  check(ctx: CheckContext): CheckResult;
  /** 正解後の「なぜそうなるのか」 */
  explain: string;
}

/** 選んで答える問題（補助用） */
export interface ChoiceProblem {
  kind: "choice";
  id: string;
  task: string;
  options: string[];
  /** 正しい選択肢の番号（0から数える） */
  answer: number;
  /** 選択肢ごとの「それを選んだときの一言」 */
  feedback: string[];
  hints: Hints;
  explain: string;
}

/**
 * 問題は「コード問題」か「選択問題」のどちらか。
 * これがユニオン型（ステージ4）。kind を見れば、どちらか見分けられます。
 */
export type Problem = CodeProblem | ChoiceProblem;

export interface Stage {
  number: StageNumber;
  id: string;
  title: string;
  /** ステージの最初の会話 */
  intro: Line[];
  problems: Problem[];
  /** まとめは必ず3行。[string, string, string] は「3つ並びの箱」（タプル型） */
  summary: [string, string, string];
}

/** いまどこにいるか。step は "intro"（会話）、数字（何問目か）、"summary"（まとめ）のどれか */
export interface Position {
  stageId: string;
  step: "intro" | number | "summary";
}

export interface Settings {
  fontSize: "large" | "xlarge";
  theme: "auto" | "light" | "dark";
  sound: boolean;
}

/** 保存データ全体の形 */
export interface SaveData {
  version: 1;
  position: Position | null;
  /** クリアしたステージの id の一覧 */
  cleared: string[];
  /** 解いた問題の id の一覧 */
  solved: string[];
  /** 書きかけのコード（問題 id → コード） */
  drafts: Record<string, string>;
  settings: Settings;
  /** 「今日の1問」を最後に達成した日付（"2026-11-04" の形） */
  lastDailyDate: string | null;
}
