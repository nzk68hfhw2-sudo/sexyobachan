// =============================================================
// ステージ3：type と interface
// =============================================================

import type { Stage } from "../types";
import { OK, diffProps, notYet } from "./helpers";

export const stage3: Stage = {
  number: 3,
  id: "s3",
  title: "箱の形に名前をつける",
  intro: [
    { speaker: "mofuji", text: "前のステージで、{ name: string; age: number } という長い名札を書いたのう。" },
    { speaker: "mofu", text: "モフが増えるたびに、あれを毎回書くのはたいへん……。" },
    { speaker: "mofuji", text: "そこで、箱の形そのものに名前をつけるのじゃ。「この形を Mofu と呼ぶ」と決めておけば、名札には Mofu と書くだけでよい。" },
    { speaker: "mofuji", text: "名前のつけ方は2つある。type と interface じゃ。" },
    { speaker: "mofuji", text: "type は「この形に、あだ名をつける」。interface は「この形の設計図を作る」。どちらもよく似た働きをするぞ。" },
    { speaker: "mofuji", text: "形の名前は、大文字で始めるならわしがある。Mofu、Mountain のようにの。" },
  ],
  problems: [
    {
      kind: "code",
      id: "s3-p1",
      task: "type を使って、Mofu という形を作ろう。形は { name: string; age: number } だよ。",
      note: "下の行は Mofu を使っているので、作るまではエラーになっているよ。",
      starter: `// ここに Mofu という type を作ろう


let shiro: Mofu = { name: "シロ", age: 3 };
`,
      hints: {
        direction: "type 名前 = 形; の順に書くよ。変数を作る let と、並びがよく似ているね。",
        example: "type Color = { red: number; green: number; blue: number }; のように書くよ。",
        almost: "type Mofu = { name: string; age: number }; と書いてみよう。",
      },
      check(ctx) {
        const t = ctx.typeAlias("Mofu");
        if (!t) {
          if (ctx.interfaceInfo("Mofu")) return notYet("interface でも作れるけど、今回は type を使ってみよう。");
          return notYet("type Mofu = ... がまだ見つからないよ。");
        }
        const d = diffProps(t, { name: "string", age: "number" });
        if (d) return notYet(d);
        return OK;
      },
      explain:
        "type Mofu = { ... }; は「この形を、これから Mofu と呼びます」という宣言じゃ。let が「値（中身）に名前をつける」のに対し、type は「型（箱の形）に名前をつける」。名前をつけておけば、形を変えたいときも1か所直すだけですむのじゃ。",
    },
    {
      kind: "code",
      id: "s3-p2",
      task: "interface を使って、Mountain という設計図を作ろう。部屋は name（文字）と height（数字）だよ。",
      starter: `// ここに Mountain という interface を作ろう


let mofuYama: Mountain = { name: "モフ山", height: 1200 };
`,
      hints: {
        direction: "interface 名前 { 部屋: 型; } と書くよ。type とちがって = はいらないよ。",
        example: "interface Hat { color: string; size: number } のように書くよ。",
        almost: "interface Mountain { name: string; height: number } と書いてみよう。",
      },
      check(ctx) {
        const i = ctx.interfaceInfo("Mountain");
        if (!i) {
          if (ctx.typeAlias("Mountain")) return notYet("type でも作れるけど、今回は interface を使ってみよう。");
          return notYet("interface Mountain { ... } がまだ見つからないよ。");
        }
        const d = diffProps(i, { name: "string", height: "number" });
        if (d) return notYet(d);
        return OK;
      },
      explain:
        "interface は「オブジェクトの設計図」を作るための専用の書き方じゃ。type はどんな型にもあだ名をつけられるが、interface はオブジェクトの形だけを表す。そのぶん「これは設計図ですよ」という気持ちが伝わりやすいのじゃな。",
    },
    {
      kind: "code",
      id: "s3-p3",
      task: "extends を使って、Mofu を受け継いだ BigMofu を作ろう。BigMofu には size（数字）の部屋を足すよ。",
      starter: `interface Mofu {
  name: string;
  age: number;
}

// ここに BigMofu を作ろう


let daifuku: BigMofu = { name: "ダイフク", age: 5, size: 80 };
`,
      hints: {
        direction: "interface 新しい名前 extends 元の名前 { 足す部屋 } と書くよ。",
        example: "interface Child extends Parent { toy: string } と書くと、Parent の部屋 ＋ toy の部屋になるよ。",
        almost: "interface BigMofu extends Mofu { size: number } と書いてみよう。",
      },
      check(ctx) {
        const i = ctx.interfaceInfo("BigMofu");
        if (!i) return notYet("interface BigMofu がまだ見つからないよ。");
        if (!ctx.interfaceExtends("BigMofu").includes("Mofu")) {
          return notYet("BigMofu は作れたね。次は extends Mofu で、Mofu の部屋を受け継いでみよう。");
        }
        const d = diffProps(i, { name: "string", age: "number", size: "number" });
        if (d) return notYet(d);
        const base = ctx.interfaceInfo("Mofu");
        if (diffProps(base, { name: "string", age: "number" })) return notYet("元の Mofu は、そのままにしておいてね。");
        return OK;
      },
      explain:
        "extends は「受け継ぐ」という意味じゃ。BigMofu は Mofu の部屋（name と age）をまるごと受け継いで、そこに size を足した形になる。同じ部屋を2回書かなくてよいし、Mofu に部屋が増えれば BigMofu にも自動で増える。親子のように形がつながるのじゃ。",
    },
    {
      kind: "code",
      id: "s3-p4",
      task: "type を使って、MofuName という「文字の型のあだ名」を作ろう。",
      note: "type はオブジェクト以外にもあだ名をつけられるよ。",
      starter: `// ここに MofuName を作ろう


let leader: MofuName = "シロ";
let helper: MofuName = "モチ";
`,
      hints: {
        direction: "type 名前 = 型; の「型」のところに、文字の型の名前を書くよ。",
        example: "type Height = number; と書くと、Height は number のあだ名になるよ。",
        almost: "type MofuName = string; と書いてみよう。",
      },
      check(ctx) {
        const t = ctx.typeAlias("MofuName");
        if (!t) return notYet("type MofuName = ... がまだ見つからないよ。");
        if (t.text !== "string") return notYet(`MofuName が ${t.text} のあだ名になっているよ。名前は文字なので string にしよう。`);
        return OK;
      },
      explain:
        "MofuName は中身としてはただの string じゃ。それでもあだ名をつけると「この文字は、モフの名前として使うものだ」という意味が、コードを読む人に伝わる。interface はオブジェクトの形しか作れんが、type はこういう「意味のあるあだ名」もつけられる。ここが2つのいちばんわかりやすいちがいじゃな。",
    },
  ],
  summary: [
    "type 名前 = 形; で、型にあだ名をつけられる。オブジェクト以外にも使える。",
    "interface 名前 { ... } で、オブジェクトの設計図を作れる。",
    "interface は extends で、ほかの設計図の部屋を受け継げる。",
  ],
};
