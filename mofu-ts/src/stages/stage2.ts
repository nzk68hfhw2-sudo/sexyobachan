// =============================================================
// ステージ2：配列とオブジェクトの型
// =============================================================

import type { Stage } from "../types";
import { OK, diffProps, notYet } from "./helpers";

export const stage2: Stage = {
  number: 2,
  id: "s2",
  title: "箱の棚と、仕切りのある箱",
  intro: [
    { speaker: "mofuji", text: "よく来たの。今日は、箱を「まとめる」方法を見ていこう。" },
    { speaker: "mofuji", text: "ひとつめは「棚」。同じ種類の箱を、ずらっと横に並べたものじゃ。これを配列と呼ぶ。" },
    { speaker: "mofuji", text: "string[] と書くと「文字の箱が並んだ棚」。[ ] が棚の印じゃな。" },
    { speaker: "mofuji", text: "ふたつめは「仕切りのある箱」。1つの箱の中に、名前のついた小部屋がいくつもある。これがオブジェクトじゃ。" },
    { speaker: "mofu", text: "小部屋ごとに、入れていいものが決まっているの？" },
    { speaker: "mofuji", text: "そのとおり。「name の部屋は文字、age の部屋は数字」というふうに、形を決められるのじゃ。" },
  ],
  problems: [
    {
      kind: "code",
      id: "s2-p1",
      task: "names に「文字の箱が並んだ棚（string[]）」の名札をつけよう。",
      starter: `// 山に住むモフたちの名前
let names = ["シロ", "モチ", "ユキ"];
`,
      hints: {
        direction: "中身は文字が3つ並んでいるね。「文字」の型名に、棚の印をつけるよ。",
        example: "数字が並んだ棚なら number[] と書くよ。",
        almost: 'let names: string[] = ["シロ", "モチ", "ユキ"]; と書いてみよう。',
      },
      check(ctx) {
        const a = ctx.varAnnotation("names");
        if (!a) return notYet("names に、まだ名札がついていないみたい。");
        if (a.text === "string") return notYet("string だと「文字の箱1つ」になってしまうよ。棚の印 [ ] もつけよう。");
        if (a.text !== "string[]") return notYet(`名札が ${a.text} になっているよ。文字が並んだ棚は string[] だよ。`);
        return OK;
      },
      explain:
        "string[] は「string の箱が、いくつでも並べられる棚」じゃ。棚の長さ（いくつ並ぶか）は決めておらん。決めているのは「並ぶのは文字の箱だけ」ということ。だから、あとで names.push(\"ハル\") はできても、names.push(5) は見張り番に止められるのじゃ。",
    },
    {
      kind: "code",
      id: "s2-p2",
      task: "数字の棚に、文字がまざっているよ。エラーを直そう。",
      note: "名札（number[]）はそのままで、中身を直してね。",
      starter: `// モフたちの体重（キロ）
let weights: number[] = [3, 5, "重い", 4];
`,
      hints: {
        direction: "「たしかめる」を押すと、どの中身が合っていないか教えてもらえるよ。",
        example: "数字の棚には [1, 2, 3] のように数字だけを並べるよ。",
        almost: '"重い" を 6 のような数字に変えてみよう。',
      },
      check(ctx) {
        const a = ctx.varAnnotation("weights");
        if (!a || a.text !== "number[]") return notYet("名札は number[] のままにしておいてね。直すのは中身のほうだよ。");
        return OK;
      },
      explain:
        "棚のどれか1つでも種類がちがうと、見張り番は気づく。棚の中を1つずつ見回ってくれるからじゃ。もし数字と文字をまぜたい棚がほしければ、(number | string)[] という書き方もある。これはステージ4で習う「どちらか」の箱じゃよ。",
    },
    {
      kind: "code",
      id: "s2-p3",
      task: "mofu に、仕切りのある箱の名札 { name: string; age: number } をつけよう。",
      starter: `// 1ぴきのモフ
let mofu = { name: "シロ", age: 3 };
`,
      hints: {
        direction: "オブジェクトの名札は { } の中に「部屋の名前: 型」を並べて書くよ。",
        example: "たとえば { color: string; size: number } は「color は文字、size は数字の部屋がある箱」だよ。",
        almost: 'let mofu: { name: string; age: number } = { name: "シロ", age: 3 }; と書いてみよう。',
      },
      check(ctx) {
        const a = ctx.varAnnotation("mofu");
        if (!a) return notYet("mofu に、まだ名札がついていないみたい。");
        const d = diffProps(a, { name: "string", age: "number" });
        if (d) return notYet(d);
        return OK;
      },
      explain:
        "名札の { name: string; age: number } は「設計図」、= のあとの { name: \"シロ\", age: 3 } は「実物」じゃ。設計図では : のあとに型を、実物では : のあとに値を書く。形はよく似ているが、役わりがちがうのじゃな。設計図の部屋の区切りは ; でも , でもよいぞ。",
    },
    {
      kind: "code",
      id: "s2-p4",
      task: "箱の形に、足りない部屋があるよ。fluffy を足してエラーを直そう。",
      note: "fluffy は「モフモフしているか」。boolean の部屋だよ。",
      starter: `let mochi: { name: string; age: number; fluffy: boolean } = {
  name: "モチ",
  age: 2,
};
`,
      hints: {
        direction: "名札（設計図）には fluffy があるのに、実物にはないね。実物のほうに足そう。",
        example: "部屋を足すときは  age: 2,  の次の行に、同じ形で「名前: 値,」と書くよ。",
        almost: "age: 2, の下に  fluffy: true,  と書いてみよう。",
      },
      check(ctx) {
        const a = ctx.varAnnotation("mochi");
        const d = diffProps(a, { name: "string", age: "number", fluffy: "boolean" });
        if (d) return notYet("名札（設計図）はそのままにしておいてね。" + d);
        if (!ctx.initKeys("mochi").includes("fluffy")) return notYet("実物のほうに fluffy を足してみよう。");
        return OK;
      },
      explain:
        "設計図で決めた部屋は、ぜんぶうめないといけない決まりじゃ。「あとで使おうとしたら空っぽだった」という事故を防ぐためじゃな。もし「なくてもいい部屋」を作りたいときは fluffy?: boolean と ? をつける。これはステージ6でくわしく話そう。",
    },
    {
      kind: "code",
      id: "s2-p5",
      task: "team に「仕切りのある箱が並んだ棚」の名札をつけよう。",
      note: "形は { name: string; age: number } で、それが並んだ棚だよ。",
      starter: `// モフのチーム
let team = [
  { name: "シロ", age: 3 },
  { name: "モチ", age: 2 },
];
`,
      hints: {
        direction: "ステージで習った2つを組み合わせるよ。「箱の形」のうしろに、棚の印 [ ] をつけよう。",
        example: "文字の棚が string[] なら、形 { ... } の棚は { ... }[] と書けるよ。",
        almost: "let team: { name: string; age: number }[] = [ ... ]; と書いてみよう。",
      },
      check(ctx) {
        const a = ctx.varAnnotation("team");
        if (!a) return notYet("team に、まだ名札がついていないみたい。");
        if (!a.element) return notYet("棚の印 [ ] が見つからないよ。形 { ... } のすぐあとに [ ] をつけてみよう。");
        const d = diffProps(a.element, { name: "string", age: "number" });
        if (d) return notYet(d);
        return OK;
      },
      explain:
        "{ name: string; age: number }[] は「その形の箱が並んだ棚」じゃ。型は組み合わせられる、というのが大事なところ。小さな箱の形を作って、それを棚に並べ、さらに別の箱の部屋に入れる……と、ブロックを積むように大きな形を作っていけるのじゃ。ただ、毎回この長い形を書くのは大変じゃろう？ 次のステージで、形に名前をつける方法を教えよう。",
    },
  ],
  summary: [
    "配列は「同じ種類の箱が並んだ棚」。string[] のように [ ] をつけて表す。",
    "オブジェクトは「仕切りのある箱」。{ name: string; age: number } で部屋ごとの型を決める。",
    "型は組み合わせられる。{ ... }[] は「その形の箱が並んだ棚」。",
  ],
};
