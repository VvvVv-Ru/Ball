import type { GameState } from "../types/game";
import { stopLevelTimer } from "./levelTimer";

export function resolveOutOfBoundsFailure(gameState: GameState, now: number): GameState {
  const headBall = gameState.ballQueue.balls[gameState.headIndex];

  if (!headBall) {
    return gameState;
  }

  const isOutOfBounds =
    headBall.position.x - headBall.radius < 0 ||
    headBall.position.x + headBall.radius > gameState.viewport.width ||
    headBall.position.y - headBall.radius < 0 ||
    headBall.position.y + headBall.radius > gameState.viewport.height;

  if (!isOutOfBounds) {
    return gameState;
  }

  const timerStoppedState = stopLevelTimer(gameState, now);

  return {
    ...timerStoppedState,
    status: "failed",
    isInputLocked: true,
    failReason: "out_of_bounds",
    motion: {
      ...timerStoppedState.motion,
      isLaunched: false,
      velocity: { x: 0, y: 0 },
      currentVector: null,
      currentSpeed: 0,
    },
  };
}
