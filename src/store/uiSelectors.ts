import type { GameStoreState } from "../types/game";
import type { UiStateContract } from "../types/uiContract";

function getLevelState(state: GameStoreState): UiStateContract["levelState"] {
  if (!state.gameState) {
    return state.scene === "playing" ? "idle" : "idle";
  }

  if (state.gameState.status === "failed" || state.gameState.status === "clear") {
    return state.gameState.status;
  }

  return state.scene === "playing" ? "playing" : state.gameState.status;
}

export const uiStateSelectors = {
  elapsedTimeMs: (state: GameStoreState) => state.gameState?.elapsedTimeMs ?? 0,
  elapsedTimeSeconds: (state: GameStoreState) => state.gameState?.elapsedTimeSeconds ?? 0,
  timerStartedAt: (state: GameStoreState) => state.gameState?.timerStartedAt ?? null,
  isTimerRunning: (state: GameStoreState) => state.gameState?.isTimerRunning ?? false,
  finalElapsedTimeMs: (state: GameStoreState) => state.gameState?.finalElapsedTimeMs ?? null,
  finalElapsedTimeSeconds: (state: GameStoreState) => state.gameState?.finalElapsedTimeSeconds ?? null,
  hp: (state: GameStoreState) => state.gameState?.hp ?? 0,
  combo: (state: GameStoreState) => state.gameState?.progress.combo ?? 0,
  levelState: (state: GameStoreState) => getLevelState(state),
  isInputLocked: (state: GameStoreState) => state.gameState?.isInputLocked ?? false,
  currentHeadColor: (state: GameStoreState) => state.gameState?.currentHeadColor ?? null,
  remainingBalls: (state: GameStoreState) => state.gameState?.ballQueue.balls.length ?? 0,
  remainingTargets: (state: GameStoreState) => state.gameState?.playfield.borders.filter((border) => border.active).length ?? 0,
};

export function selectUiStateContract(state: GameStoreState): UiStateContract {
  return {
    elapsedTimeMs: uiStateSelectors.elapsedTimeMs(state),
    elapsedTimeSeconds: uiStateSelectors.elapsedTimeSeconds(state),
    timerStartedAt: uiStateSelectors.timerStartedAt(state),
    isTimerRunning: uiStateSelectors.isTimerRunning(state),
    finalElapsedTimeMs: uiStateSelectors.finalElapsedTimeMs(state),
    finalElapsedTimeSeconds: uiStateSelectors.finalElapsedTimeSeconds(state),
    hp: uiStateSelectors.hp(state),
    combo: uiStateSelectors.combo(state),
    levelState: uiStateSelectors.levelState(state),
    isInputLocked: uiStateSelectors.isInputLocked(state),
    currentHeadColor: uiStateSelectors.currentHeadColor(state),
    remainingBalls: uiStateSelectors.remainingBalls(state),
    remainingTargets: uiStateSelectors.remainingTargets(state),
  };
}
