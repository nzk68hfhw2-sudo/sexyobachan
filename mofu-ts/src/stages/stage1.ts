// =============================================================
// ステージ1：型注釈の基本（string / number / boolean）
// =============================================================

import type { Stage } from "../types";
import { OK, notYet } from "./helpers";

export const stage1: Stage = {
  number: 1,
  id: "s1",
  title: "モフの箱、はじめまして",
  intro: [
    { speaker: "mofuji", text: "ようこそ、モフ山へ。わしはモフじい。この山の案内役じゃ。" },
    { speaker: "mofuji", text: "この山のモフたちは、それぞれ「専用の箱」に入って暮らしておる。" },
    { speaker: "mofuji", text: "文字のモフは文字の箱へ。数字のモフは数字の箱へ。まちがった箱には入れん決まりじゃ。" },
    { speaker: "mofuji", text: "TypeScript では、この「箱の種類」のことを「型」と呼ぶ。" },
    { speaker: "mofu", text: "まちがった箱に入れようとしたら、どうなるの？" },
    { speaker: "mofuji", text: "見張り番（コンパイラ）が、そっと止めてくれる。おこられるわけではないから、安心してまちがえてよいぞ。" },
    { speaker: "mofuji", text: "では、最初の箱を見にいこうかの。" },
  ],
  problems: [
    {
      kind: "choice",
      id: "s1-p1",
      task: "「シロ」という名前（文字）を入れる箱の型は、どれかな？",
      options: ["string", "number", "boolean"],
      answer: 0,
      feedback: [
        "",
        "number は数字の箱じゃ。「シロ」は数字ではないのう。",
        "boolean は「はい・いいえ」の箱じゃ。true か false しか入らんぞ。",
      ],
      hints: {
        direction: "「シロ」は、文字・数字・はい/いいえ のうち、どれの仲間かな？",
        example: "\"こんにちは\" や \"モフ\" のように、\" \" でかこまれたものは文字の仲間だよ。",
        almost: "文字のことを英語で string（ひもでつないだ文字の列）と言うよ。",
      },
      explain:
        "string は「文字の列」という意味。文字が1つずつ、ひもでつながって並んでいる様子から来た名前じゃ。\"シロ\" のように \" \" でかこまれたものは、ぜんぶ string の箱に入るぞ。",
    },
    {
      kind: "code",
      id: "s1-p2",
      task: "mofuName の箱に「string」の名札をつけよう。",
      note: "名札は、変数名のすぐあとに「: 型」と書くよ。",
      starter: `// モフの名前を入れる箱
let mofuName = "シロ";
`,
      hints: {
        direction: "変数名 mofuName と = のあいだに、名札を書く場所があるよ。",
        example: "たとえば数字の箱なら let count: number = 5; と書くよ。",
        almost: 'let mofuName: string = "シロ"; と書いてみよう。',
      },
      check(ctx) {
        const a = ctx.varAnnotation("mofuName");
        if (!a) return notYet("mofuName の箱に、まだ名札（: string）がついていないみたい。");
        if (a.text !== "string") return notYet(`名札が ${a.text} になっているよ。名前は文字なので string にしよう。`);
        return OK;
      },
      explain:
        "「: string」は、箱にはる名札じゃ。名札があると、あとでうっかり数字を入れようとしても、見張り番が気づいてくれる。実は TypeScript は \"シロ\" を見て string だと自分で推測もできるが、名札を書くと「この箱はこう使う」という約束が、読む人にもはっきり伝わるのじゃ。",
    },
    {
      kind: "code",
      id: "s1-p3",
      task: "age の箱に「number」の名札をつけよう。",
      starter: `// モフの年れい（さい）
let age = 3;
`,
      hints: {
        direction: "3 は文字ではなく数字だね。数字の型の名前を思い出そう。",
        example: "さっきは let mofuName: string = ... と書いたね。形は同じだよ。",
        almost: "let age: number = 3; と書いてみよう。",
      },
      check(ctx) {
        const a = ctx.varAnnotation("age");
        if (!a) return notYet("age の箱に、まだ名札がついていないみたい。");
        if (a.text !== "number") return notYet(`名札が ${a.text} になっているよ。3 は数字なので number にしよう。`);
        return OK;
      },
      explain:
        "number は数字の箱じゃ。TypeScript では 3 も 3.5 も -1 も、ぜんぶ同じ number の箱に入る。整数と小数で箱を分けないところは、JavaScript と同じじゃな。",
    },
    {
      kind: "code",
      id: "s1-p4",
      task: "見張り番のお知らせを読んで、エラーを直そう。箱（number）はそのままで、中身を変えてね。",
      starter: `// 今日ふった雪の量（センチ）
let snowCount: number = "たくさん";
`,
      hints: {
        direction: "まず「たしかめる」を押して、見張り番のお知らせを読んでみよう。箱は数字専用だよ。",
        example: "数字の箱には 10 や 25 のような数字を入れるよ。\" \" でかこむと文字になってしまうよ。",
        almost: "let snowCount: number = 20; のように、\" \" のない数字を入れよう。",
      },
      check(ctx) {
        const a = ctx.varAnnotation("snowCount");
        if (!a || a.text !== "number") return notYet("箱の名札は number のままにしておいてね。直すのは中身のほうだよ。");
        if (ctx.initKind("snowCount") !== "number") return notYet("中身を数字にしてみよう。");
        return OK;
      },
      explain:
        "\"たくさん\" は文字なので、数字の箱には入らん。見張り番が出したお知らせ「Type 'string' is not assignable to type 'number'」は、「文字を、数字の箱には入れられません」という意味じゃった。このお知らせのおかげで、計算するときに文字がまざって困ることを、前もって防げるのじゃ。",
    },
    {
      kind: "code",
      id: "s1-p5",
      task: "isHungry という名前で boolean の箱を作り、true を入れよう。",
      note: "boolean には true（はい）か false（いいえ）だけが入るよ。",
      starter: `// モフはおなかがすいている？
// この下に1行書いてね

`,
      hints: {
        direction: "let で箱を作り、名前のあとに名札をつけ、= のあとに中身を書くよ。",
        example: "let isSleeping: boolean = false; は「ねている？ → いいえ」という箱だよ。",
        almost: "let isHungry: boolean = true; と書いてみよう。",
      },
      check(ctx) {
        if (!ctx.hasVar("isHungry")) return notYet("isHungry という名前の箱が、まだ見つからないよ。つづりも確かめてみてね。");
        const a = ctx.varAnnotation("isHungry");
        if (!a) return notYet("isHungry に名札（: boolean）をつけてみよう。");
        if (a.text !== "boolean") return notYet(`名札が ${a.text} になっているよ。はい・いいえの箱は boolean だよ。`);
        if (!/=\s*true\b/.test(ctx.code)) return notYet("中身に true を入れてみよう。");
        return OK;
      },
      explain:
        "boolean は「はい・いいえ」の2つだけが入る、いちばん小さな箱じゃ。名前はジョージ・ブールという、はい・いいえの計算を考えた人から来ておる。「is〜」という名前にすると「〜かどうか」が読んですぐわかるので、boolean の箱によく使われるぞ。",
    },
  ],
  summary: [
    "型は「モフ専用の箱」。string は文字、number は数字、boolean ははい・いいえの箱。",
    "変数名のあとに「: 型」と書くと、箱に名札がつく（型注釈）。",
    "ちがうものを入れようとすると、見張り番が実行する前に教えてくれる。",
  ],
};
