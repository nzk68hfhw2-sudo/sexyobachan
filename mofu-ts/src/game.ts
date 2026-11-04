// =============================================================
// game.ts : ゲームの流れを決める「司令塔」
// =============================================================
// どの画面を出すか、進んだら何を保存するか、をここでまとめて決めます。
// 画面（screens/）は「見た目」だけを担当し、
// 次にどうするかは、ここにある関数を呼んで任せます。
// =============================================================

import type { Position, SaveData, Stage } from "./types";
import * as save from "./state/save";
import { findStage, stages } from "./stages";
import { applySettings } from "./ui/theme";
import { setSoundEnabled } from "./ui/sound";
import { renderTitle } from "./ui/screens/title";
import { renderDialogue } from "./ui/screens/dialogue";
import { renderProblem } from "./ui/screens/problem";
import { renderCorrect } from "./ui/screens/correct";
import { renderSummary } from "./ui/screens/summary";
import { renderSettings } from "./ui/screens/settings";
import { renderStageSelect } from "./ui/screens/stageSelect";
import { renderDailyDone } from "./ui/screens/dailyDone";

/**
 * 画面から使える「司令塔の窓口」。
 * 画面のファイルは、この interface だけを知っていればよい、という作りです。
 */
export interface Game {
  readonly data: SaveData;
  /** 「今日は1問だけ」モード中なら true */
  readonly daily: boolean;
  /** いまの内容を保存する */
  persist(): void;
  goTitle(): void;
  continueGame(): void;
  startDaily(): void;
  startStage(stageId: string): void;
  goTo(pos: Position): void;
  openSettings(): void;
  openStageSelect(): void;
  isUnlocked(stage: Stage): boolean;
  isCleared(stage: Stage): boolean;
  /** 問題を解いたときに呼ぶ */
  solved(stage: Stage, index: number): void;
  /** 設定画面などから、元の画面に戻る */
  back(): void;
  /** 保存データを丸ごと入れかえる（復元・リセット用） */
  replaceData(next: SaveData): void;
  /** 設定を変えたあとに呼ぶ（見た目と音に反映） */
  settingsChanged(): void;
}

export function createGame(screen: HTMLElement): Game {
  let data = save.load();
  let daily = false;
  /** 「もどる」で戻る先の画面を描く関数 */
  let lastMain: () => void = () => game.goTitle();

  /** 画面を1つだけ出す（前の画面は消す） */
  const show = (el: HTMLElement): void => {
    screen.replaceChildren(el);
    window.scrollTo(0, 0);
    // 画面が変わったことを、読み上げソフトにも伝わるように見出しへ移動
    const heading = el.querySelector<HTMLElement>("h1, h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };

  /** メインの画面（設定画面以外）を出すときは、戻り先として覚えておく */
  const showMain = (draw: () => HTMLElement): void => {
    lastMain = () => show(draw());
    lastMain();
  };

  const nextStageOf = (stage: Stage): Stage | undefined => stages[stages.indexOf(stage) + 1];

  const game: Game = {
    get data() {
      return data;
    },
    get daily() {
      return daily;
    },

    persist() {
      save.store(data);
    },

    goTitle() {
      daily = false;
      showMain(() => renderTitle(game));
    },

    continueGame() {
      daily = false;
      const pos = data.position;
      if (pos && findStage(pos.stageId)) {
        game.goTo(pos);
      } else {
        game.startStage(stages[0]!.id);
      }
    },

    startDaily() {
      daily = true;
      const pos = data.position;
      const stage = pos ? findStage(pos.stageId) : undefined;
      if (!pos || !stage) {
        game.goTo({ stageId: stages[0]!.id, step: "intro" });
        return;
      }
      // まとめ画面で止まっていたら、次のステージの最初から
      if (pos.step === "summary") {
        const next = nextStageOf(stage);
        if (next) game.goTo({ stageId: next.id, step: "intro" });
        else showMain(() => renderDailyDone(game, "allClear"));
        return;
      }
      game.goTo(pos);
    },

    startStage(stageId) {
      game.goTo({ stageId, step: "intro" });
    },

    goTo(pos) {
      const stage = findStage(pos.stageId);
      if (!stage) return game.goTitle();
      data.position = pos;
      game.persist();

      // step の種類によって、出す画面を分ける（型の絞り込み：ステージ4）
      if (pos.step === "intro") {
        showMain(() =>
          renderDialogue(game, stage, () => game.goTo({ stageId: stage.id, step: 0 })),
        );
      } else if (pos.step === "summary") {
        if (!data.cleared.includes(stage.id)) {
          data.cleared.push(stage.id);
          game.persist();
        }
        showMain(() => renderSummary(game, stage, nextStageOf(stage)));
      } else {
        const index = Math.min(pos.step, stage.problems.length - 1);
        showMain(() => renderProblem(game, stage, index));
      }
    },

    solved(stage, index) {
      const problem = stage.problems[index];
      if (!problem) return;
      if (!data.solved.includes(problem.id)) data.solved.push(problem.id);
      // 解けたら書きかけは消す（もう一度遊ぶときは最初のコードから）
      delete data.drafts[problem.id];

      // 次に開いたとき、次の問題から始まるように、先に位置を進めておく
      const isLast = index >= stage.problems.length - 1;
      const next: Position = { stageId: stage.id, step: isLast ? "summary" : index + 1 };
      data.position = next;

      const wasDaily = daily;
      if (wasDaily) data.lastDailyDate = save.today();
      game.persist();

      showMain(() =>
        renderCorrect(game, stage, problem, () => {
          if (wasDaily) showMain(() => renderDailyDone(game, "done"));
          else game.goTo(next);
        }),
      );
    },

    openSettings() {
      show(renderSettings(game));
    },

    openStageSelect() {
      daily = false;
      showMain(() => renderStageSelect(game));
    },

    isCleared(stage) {
      return data.cleared.includes(stage.id);
    },

    isUnlocked(stage) {
      const i = stages.indexOf(stage);
      if (i <= 0) return true;
      const prev = stages[i - 1];
      return prev !== undefined && data.cleared.includes(prev.id);
    },

    back() {
      lastMain();
    },

    replaceData(next) {
      data = next;
      game.persist();
      game.settingsChanged();
    },

    settingsChanged() {
      applySettings(data.settings);
      setSoundEnabled(data.settings.sound);
      game.persist();
    },
  };

  applySettings(data.settings);
  setSoundEnabled(data.settings.sound);
  return game;
}
