import type { GameState } from "../types/game";
import { stopLevelTimer } from "./levelTimer";

export function resolveHpZeroFailure(gameState: GameState, now: number): GameState {
  if (gameState.status === "failed" || gameState.status === "clear" || gameState.hp > 0) {
    return gameState;
  }

  const timerStoppedState = stopLevelTimer(gameState, now);

  return {
    ...timerStoppedState,
    status: "failed",
    isInputLocked: true,
    failReason: "hp_zero",
    motion: {
      ...timerStoppedState.motion,
      isLaunched: false,
      velocity: { x: 0, y: 0 },
      currentVector: null,
      currentSpeed: 0,
    },
  };
}
