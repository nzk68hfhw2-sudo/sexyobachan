// =============================================================
// compiler.ts : ブラウザの中で TypeScript の「見張り番」を動かす
// =============================================================
// ふつう TypeScript はパソコンの中（Node.js）で動かしますが、
// 本体は JavaScript で書かれているので、ブラウザでも動きます。
//
// ここでは次のことをしています。
//   1. TypeScript 本体を「必要になったときに」読み込む（重いので）
//   2. 書かれたコードを、ファイルがあるふりをして見張り番に渡す
//   3. 見張り番が見つけたエラー（diagnostics）を受け取る
//   4. 判定用の道具箱（CheckContext）を作る
// =============================================================

// import type は「型だけ借りる」書き方。実行時には何も読み込みません。
import type * as TS from "typescript";
import type { CheckContext, TypeInfo } from "../types";

/** プレイヤーのコードを置く、架空のファイル名 */
const FILE = "/mofu/answer.ts";

/**
 * どの問題でも使える「おまけの宣言」。
 * DOM の辞書は重いので入れていない代わりに、console.log だけ使えるようにしています。
 */
const ENV_FILE = "/mofu/env.d.ts";
const ENV_SOURCE = `declare const console: { log(...values: unknown[]): void };\n`;

/** 見張り番への指示（コンパイラオプション） */
function makeOptions(ts: typeof TS): TS.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    strict: true, // いちばん厳しく見張ってもらう
    noEmit: true,
    lib: ["lib.es2020.d.ts"],
    // 1つ1つの答えを「独立したファイル」として扱う。
    // こうしないと、ほかのファイルの変数名とぶつかることがあります。
    moduleDetection: ts.ModuleDetectionKind.Force,
  };
}

/** 見つかったエラー1件。画面に出しやすい形にしたもの。 */
export interface FoundError {
  code: number;
  /** 何行目か（1から数える）。場所がないエラーは null */
  line: number | null;
  /** その行に書かれているコード */
  lineText: string;
  /** 英語の原文 */
  message: string;
}

export interface Analysis {
  errors: FoundError[];
  ctx: CheckContext;
}

// ---- 読み込み済みのものを覚えておく場所 ----
// 「まだ読み込んでいない」ことを null で表しています。
let ts: typeof TS | null = null;
let libSources: Map<string, TS.SourceFile> | null = null;
let loading: Promise<void> | null = null;

/**
 * 見張り番を呼ぶ（読み込む）。何回呼んでも、読み込みは1回だけ。
 * async 関数は「時間がかかる仕事」を表します（ステージ8で習います）。
 */
export function loadCompiler(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      // import(...) を関数のように使うと、そのとき初めて読み込まれます。
      const mod = await import("typescript");
      // ライブラリによって default に入っていたりいなかったりするので、両方に対応
      const loaded = ((mod as { default?: typeof TS }).default ?? mod) as typeof TS;
      const { libFiles } = await import("./libFiles");

      // 型の辞書は毎回読むと遅いので、最初に1回だけ解析しておく
      const map = new Map<string, TS.SourceFile>();
      for (const [name, text] of Object.entries(libFiles)) {
        const path = "/lib/" + name;
        map.set(path, loaded.createSourceFile(path, text, loaded.ScriptTarget.ES2020, true));
      }
      map.set(ENV_FILE, loaded.createSourceFile(ENV_FILE, ENV_SOURCE, loaded.ScriptTarget.ES2020, true));
      ts = loaded;
      libSources = map;
    })();
    // 失敗したら、次にもう一度試せるように戻しておく
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

export function isCompilerReady(): boolean {
  return ts !== null;
}

/**
 * コードを見張り番に見てもらう。
 * loadCompiler() が終わってから呼んでください。
 */
export function analyze(code: string): Analysis {
  if (!ts || !libSources) {
    throw new Error("見張り番がまだ来ていません（loadCompiler を先に呼んでね）");
  }
  // ここから下では ts は必ずある。const に入れ直すと、見張り番もそれを理解してくれます。
  const t = ts;
  const libs = libSources;
  const answer = t.createSourceFile(FILE, code, t.ScriptTarget.ES2020, true);

  // 「ファイルを読む係」（CompilerHost）を自分で用意する。
  // 本物のファイルの代わりに、メモリ上の文字列を渡しています。
  const host: TS.CompilerHost = {
    getSourceFile: (fileName) => (fileName === FILE ? answer : libs.get(fileName)),
    getDefaultLibFileName: () => "/lib/lib.es2020.d.ts",
    getDefaultLibLocation: () => "/lib",
    writeFile: () => {},
    getCurrentDirectory: () => "/mofu",
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (f) => f === FILE || libs.has(f),
    readFile: () => undefined,
    directoryExists: () => true,
    getDirectories: () => [],
  };

  const program = t.createProgram([FILE, ENV_FILE], makeOptions(t), host);
  const checker = program.getTypeChecker();

  // 文法のまちがい（syntactic）と型のまちがい（semantic）の両方を集める
  const diagnostics = [
    ...program.getSyntacticDiagnostics(answer),
    ...program.getSemanticDiagnostics(answer),
  ];

  const lines = code.split("\n");
  const errors: FoundError[] = diagnostics.map((d) => {
    let line: number | null = null;
    if (d.file && d.start !== undefined) {
      line = d.file.getLineAndCharacterOfPosition(d.start).line + 1;
    }
    return {
      code: d.code,
      line,
      lineText: line !== null ? (lines[line - 1] ?? "").trim() : "",
      // メッセージは入れ子になっていることがあるので、平らにする
      message: t.flattenDiagnosticMessageText(d.messageText, "\n"),
    };
  });

  return { errors, ctx: makeContext(t, checker, answer, code) };
}

// -------------------------------------------------------------
// ここから下は「判定用の道具箱」を作る部分
// -------------------------------------------------------------

function makeContext(
  t: typeof TS,
  checker: TS.TypeChecker,
  sf: TS.SourceFile,
  code: string,
): CheckContext {
  // ファイルのいちばん外側に書かれた宣言を集める
  const vars = new Map<string, TS.VariableDeclaration>();
  const aliases = new Map<string, TS.TypeAliasDeclaration>();
  const interfaces = new Map<string, TS.InterfaceDeclaration>();

  for (const st of sf.statements) {
    if (t.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (t.isIdentifier(d.name)) vars.set(d.name.text, d);
      }
    } else if (t.isTypeAliasDeclaration(st)) {
      aliases.set(st.name.text, st);
    } else if (t.isInterfaceDeclaration(st)) {
      interfaces.set(st.name.text, st);
    }
  }

  /** 型を「判定しやすい形」に変える */
  const describe = (type: TS.Type, at: TS.Node, node?: TS.TypeNode): TypeInfo => {
    const props: Record<string, string> = {};
    // string や number のような「そのままの値」の型は、プロパティを調べない
    const isPrimitive = (type.flags & (t.TypeFlags.StringLike | t.TypeFlags.NumberLike | t.TypeFlags.BooleanLike)) !== 0;
    const isArrayNode = node !== undefined && t.isArrayTypeNode(node);
    if (!isPrimitive && !isArrayNode) {
      for (const p of checker.getPropertiesOfType(type)) {
        props[p.name] = checker.typeToString(checker.getTypeOfSymbolAtLocation(p, at));
      }
    }
    const info: TypeInfo = { text: checker.typeToString(type), props };
    if (node && t.isArrayTypeNode(node)) {
      info.element = describe(checker.getTypeFromTypeNode(node.elementType), at, node.elementType);
    }
    return info;
  };

  /** 初期値の種類を調べる */
  const kindOf = (e: TS.Expression): ReturnType<CheckContext["initKind"]> => {
    if (t.isStringLiteral(e) || t.isNoSubstitutionTemplateLiteral(e) || t.isTemplateExpression(e)) return "string";
    if (t.isNumericLiteral(e)) return "number";
    if (t.isPrefixUnaryExpression(e) && t.isNumericLiteral(e.operand)) return "number"; // -3 など
    if (e.kind === t.SyntaxKind.TrueKeyword || e.kind === t.SyntaxKind.FalseKeyword) return "boolean";
    if (t.isArrayLiteralExpression(e)) return "array";
    if (t.isObjectLiteralExpression(e)) return "object";
    return "other";
  };

  return {
    code,
    hasVar: (name) => vars.has(name),
    varAnnotation: (name) => {
      const d = vars.get(name);
      if (!d || !d.type) return null;
      return describe(checker.getTypeFromTypeNode(d.type), d, d.type);
    },
    initKind: (name) => {
      const d = vars.get(name);
      if (!d || !d.initializer) return null;
      return kindOf(d.initializer);
    },
    initKeys: (name) => {
      const init = vars.get(name)?.initializer;
      if (!init || !t.isObjectLiteralExpression(init)) return [];
      const keys: string[] = [];
      for (const p of init.properties) {
        if (p.name && (t.isIdentifier(p.name) || t.isStringLiteral(p.name))) keys.push(p.name.text);
      }
      return keys;
    },
    typeAlias: (name) => {
      const a = aliases.get(name);
      if (!a) return null;
      return describe(checker.getTypeFromTypeNode(a.type), a, a.type);
    },
    interfaceInfo: (name) => {
      const i = interfaces.get(name);
      if (!i) return null;
      return describe(checker.getTypeAtLocation(i.name), i);
    },
    interfaceExtends: (name) => {
      const i = interfaces.get(name);
      if (!i || !i.heritageClauses) return [];
      return i.heritageClauses.flatMap((h) => h.types.map((x) => x.expression.getText(sf)));
    },
  };
}
