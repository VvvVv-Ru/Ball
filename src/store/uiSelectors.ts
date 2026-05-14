import type { GameStoreState } from "../types/game";
import type { UiStateContract } from "../types/uiContract";

function getLevelState(state: GameStoreState): UiStateContract["levelState"] {
  if (!state.gameState) {
    return state.scene === "playing" ? "idle" : "idle";
  }

  return state.scene === "playing" ? "playing" : state.gameState.status;
}

export const uiStateSelectors = {
  score: (_state: GameStoreState) => 0,
  hp: (state: GameStoreState) => state.gameState?.hp ?? 0,
  combo: (_state: GameStoreState) => 0,
  levelState: (state: GameStoreState) => getLevelState(state),
  isInputLocked: (state: GameStoreState) => state.gameState?.isInputLocked ?? false,
  currentHeadColor: (state: GameStoreState) => state.gameState?.currentHeadColor ?? null,
  remainingBalls: (state: GameStoreState) => state.gameState?.ballQueue.balls.length ?? 0,
  remainingTargets: (state: GameStoreState) => state.gameState?.playfield.borders.filter((border) => border.active).length ?? 0,
};

export function selectUiStateContract(state: GameStoreState): UiStateContract {
  return {
    score: uiStateSelectors.score(state),
    hp: uiStateSelectors.hp(state),
    combo: uiStateSelectors.combo(state),
    levelState: uiStateSelectors.levelState(state),
    isInputLocked: uiStateSelectors.isInputLocked(state),
    currentHeadColor: uiStateSelectors.currentHeadColor(state),
    remainingBalls: uiStateSelectors.remainingBalls(state),
    remainingTargets: uiStateSelectors.remainingTargets(state),
  };
}
