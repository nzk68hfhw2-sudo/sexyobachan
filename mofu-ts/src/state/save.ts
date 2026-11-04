// =============================================================
// save.ts : 進捗の保存・読み込み・書き出し・復元
// =============================================================
// ブラウザの localStorage に保存します。
// ただし、プライベートモードなどでは保存が「できない」ことがあります。
// そのため、保存に関わる処理はすべて try/catch で囲み、
// 失敗してもゲームが止まらないようにしています。
//
// さらに「進捗を文字列にしてコピー」「文字列から復元」もできます。
// =============================================================

import type { Position, SaveData, Settings } from "../types";

const KEY = "mofu-ts-save-v1";
/** 書き出した文字列の先頭につける目印 */
const PREFIX = "MOFU1.";

export const defaultSettings: Settings = { fontSize: "large", theme: "auto", sound: true };

export function emptySave(): SaveData {
  return {
    version: 1,
    position: null,
    cleared: [],
    solved: [],
    drafts: {},
    settings: { ...defaultSettings },
    lastDailyDate: null,
  };
}

// -------------------------------------------------------------
// 中身の確認（unknown → SaveData）
// -------------------------------------------------------------
// 保存データは外から来る「何が入っているかわからない箱」です。
// TypeScript では、そういうものを unknown 型で受け取り、
// 1つずつ確かめながら正しい形に整えます（型の絞り込み：ステージ4）。

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function toPosition(v: unknown): Position | null {
  if (!isRecord(v) || typeof v.stageId !== "string") return null;
  const step = v.step;
  if (step === "intro" || step === "summary") return { stageId: v.stageId, step };
  if (typeof step === "number" && Number.isInteger(step) && step >= 0) return { stageId: v.stageId, step };
  return null;
}

function toSettings(v: unknown): Settings {
  const s: Settings = { ...defaultSettings };
  if (!isRecord(v)) return s;
  if (v.fontSize === "large" || v.fontSize === "xlarge") s.fontSize = v.fontSize;
  if (v.theme === "auto" || v.theme === "light" || v.theme === "dark") s.theme = v.theme;
  if (typeof v.sound === "boolean") s.sound = v.sound;
  return s;
}

/** どんな値が来ても、正しい形の SaveData にして返す */
export function normalize(raw: unknown): SaveData {
  const base = emptySave();
  if (!isRecord(raw)) return base;
  const drafts: Record<string, string> = {};
  if (isRecord(raw.drafts)) {
    for (const [k, v] of Object.entries(raw.drafts)) {
      if (typeof v === "string") drafts[k] = v;
    }
  }
  return {
    version: 1,
    position: toPosition(raw.position),
    cleared: stringList(raw.cleared),
    solved: stringList(raw.solved),
    drafts,
    settings: toSettings(raw.settings),
    lastDailyDate: typeof raw.lastDailyDate === "string" ? raw.lastDailyDate : null,
  };
}

// -------------------------------------------------------------
// localStorage への読み書き
// -------------------------------------------------------------

/** 保存できる環境かどうか（最後に試したときの結果） */
let storageWorks = true;

export function canStore(): boolean {
  return storageWorks;
}

export function load(): SaveData {
  try {
    const text = localStorage.getItem(KEY);
    if (text === null) return emptySave();
    return normalize(JSON.parse(text));
  } catch {
    storageWorks = false;
    return emptySave();
  }
}

/** 保存する。うまくいったら true */
export function store(data: SaveData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    storageWorks = true;
    return true;
  } catch {
    storageWorks = false;
    return false;
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 消せなくても困らないので、何もしない
  }
}

// -------------------------------------------------------------
// 文字列での書き出し・復元
// -------------------------------------------------------------
// 日本語を含む JSON をそのまま btoa（Base64 変換）に渡すとエラーになるので、
// いったん UTF-8 のバイト列にしてから変換します。

export function exportText(data: SaveData): string {
  // 書きかけのコードは長くなりやすいので、書き出しには含めない
  const slim: SaveData = { ...data, drafts: {} };
  const bytes = new TextEncoder().encode(JSON.stringify(slim));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return PREFIX + btoa(bin);
}

/** 文字列から復元する。読めなかったら null */
export function importText(text: string): SaveData | null {
  const t = text.trim();
  if (!t.startsWith(PREFIX)) return null;
  try {
    const bin = atob(t.slice(PREFIX.length));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return normalize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/** 今日の日付を "2026-11-04" の形で返す（「今日の1問」用） */
export function today(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
