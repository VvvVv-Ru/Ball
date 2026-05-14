import type { GameState } from "../types/game";
import { stopLevelTimer } from "./levelTimer";

export function resolveLevelClear(gameState: GameState, now: number): GameState {
  if (gameState.status === "failed" || gameState.status === "clear") {
    return gameState;
  }

  const remainingTargets = gameState.playfield.borders.filter((border) => border.active).length;

  if (remainingTargets > 0) {
    return gameState;
  }

  const timerStoppedState = stopLevelTimer(gameState, now);

  return {
    ...timerStoppedState,
    status: "clear",
    isInputLocked: true,
    clearReason: "all_targets_cleared",
    motion: {
      ...timerStoppedState.motion,
      isLaunched: false,
      velocity: { x: 0, y: 0 },
      currentVector: null,
      currentSpeed: 0,
    },
  };
}
