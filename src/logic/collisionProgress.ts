import type { GameState } from "../types/game";

const BASE_SCORE = 40;
const COMBO_BONUS_STEP = 10;
const HP_LOSS_ON_MISMATCH = 1;

export function applyMatchProgress(gameState: GameState): GameState {
  const nextCombo = gameState.progress.combo + 1;
  const scoreDelta = BASE_SCORE + (nextCombo - 1) * COMBO_BONUS_STEP;

  return {
    ...gameState,
    progress: {
      score: gameState.progress.score + scoreDelta,
      combo: nextCombo,
      lastScoreDelta: scoreDelta,
    },
  };
}

export function applyMismatchProgress(gameState: GameState): GameState {
  return {
    ...gameState,
    hp: Math.max(0, gameState.hp - HP_LOSS_ON_MISMATCH),
    progress: {
      ...gameState.progress,
      combo: 0,
      lastScoreDelta: 0,
    },
  };
}
