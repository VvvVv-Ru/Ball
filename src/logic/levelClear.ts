import type { GameState } from "../types/game";

export function resolveLevelClear(gameState: GameState): GameState {
  if (gameState.status === "failed" || gameState.status === "clear") {
    return gameState;
  }

  const remainingBalls = gameState.ballQueue.balls.length;
  const remainingTargets = gameState.playfield.borders.filter((border) => border.active).length;

  if (remainingBalls > 0 || remainingTargets > 0) {
    return gameState;
  }

  return {
    ...gameState,
    status: "clear",
    isInputLocked: true,
    clearReason: "all_targets_cleared_and_no_balls",
    motion: {
      ...gameState.motion,
      isLaunched: false,
      currentSpeed: 0,
    },
  };
}
