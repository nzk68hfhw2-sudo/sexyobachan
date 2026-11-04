// =============================================================
// verify-answers.mjs : 問題の判定が正しく動くかを確かめる開発用スクリプト
// =============================================================
// 使い方:  npm run verify
// - 最初のコード（starter）のままでは正解にならないこと
// - 模範解答なら正解になること
// を、すべての問題で確かめます。
// （ネタバレになるので、模範解答はゲーム本体ではなくこのファイルに置いています）

import { createServer } from "vite";

const answers = {
  "s1-p2": `let mofuName: string = "シロ";`,
  "s1-p3": `let age: number = 3;`,
  "s1-p4": `let snowCount: number = 20;`,
  "s1-p5": `let isHungry: boolean = true;`,
  "s2-p1": `let names: string[] = ["シロ", "モチ", "ユキ"];`,
  "s2-p2": `let weights: number[] = [3, 5, 6, 4];`,
  "s2-p3": `let mofu: { name: string; age: number } = { name: "シロ", age: 3 };`,
  "s2-p4": `let mochi: { name: string; age: number; fluffy: boolean } = {\n  name: "モチ",\n  age: 2,\n  fluffy: true,\n};`,
  "s2-p5": `let team: { name: string; age: number }[] = [\n  { name: "シロ", age: 3 },\n  { name: "モチ", age: 2 },\n];`,
  "s3-p1": `type Mofu = { name: string; age: number };\nlet shiro: Mofu = { name: "シロ", age: 3 };`,
  "s3-p2": `interface Mountain { name: string; height: number }\nlet mofuYama: Mountain = { name: "モフ山", height: 1200 };`,
  "s3-p3": `interface Mofu {\n  name: string;\n  age: number;\n}\ninterface BigMofu extends Mofu { size: number }\nlet daifuku: BigMofu = { name: "ダイフク", age: 5, size: 80 };`,
  "s3-p4": `type MofuName = string;\nlet leader: MofuName = "シロ";\nlet helper: MofuName = "モチ";`,
};

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
let failed = 0;
try {
  const { loadCompiler, analyze } = await server.ssrLoadModule("/src/engine/compiler.ts");
  const { explainError } = await server.ssrLoadModule("/src/engine/errorDict.ts");
  const { stages } = await server.ssrLoadModule("/src/stages/index.ts");
  const t0 = Date.now();
  await loadCompiler();
  console.log(`見張り番の読み込み: ${Date.now() - t0}ms`);

  const judge = (problem, code) => {
    const { errors, ctx } = analyze(code);
    if (errors.length) return { ok: false, why: errors.map((e) => `TS${e.code} ${explainError(e.code, e.message)}`).join(" / ") };
    const r = problem.check(ctx);
    return r.ok ? { ok: true } : { ok: false, why: r.message };
  };

  for (const stage of stages) {
    for (const p of stage.problems) {
      if (p.kind !== "code") continue;
      const start = judge(p, p.starter);
      const ans = answers[p.id];
      const t = Date.now();
      const good = ans ? judge(p, ans) : { ok: false, why: "模範解答がありません" };
      const ms = Date.now() - t;
      const ok = !start.ok && good.ok;
      if (!ok) failed++;
      console.log(`${ok ? "OK " : "NG "} ${p.id}  (${ms}ms)\n     最初: ${start.why ?? "正解になってしまう"}\n     解答: ${good.ok ? "正解" : good.why}`);
    }
  }
} finally {
  await server.close();
}
if (failed) {
  console.error(`\n${failed} 件の問題があります`);
  process.exit(1);
}
console.log("\nすべての問題が、ねらい通りに判定されました");
