import type { GameState } from "../types/game";

const HP_LOSS_ON_MISMATCH = 1;

export function applyMatchProgress(gameState: GameState): GameState {
  return {
    ...gameState,
    progress: {
      combo: gameState.progress.combo + 1,
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
    },
  };
}
