import type { GameState } from "../types/game";

export function resolveOutOfBoundsFailure(gameState: GameState): GameState {
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

  return {
    ...gameState,
    status: "failed",
    isInputLocked: true,
    failReason: "out_of_bounds",
    motion: {
      ...gameState.motion,
      isLaunched: false,
      velocity: { x: 0, y: 0 },
      currentVector: null,
      currentSpeed: 0,
    },
  };
}
