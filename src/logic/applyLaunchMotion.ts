import type { GameState, InputDirection, Vector2 } from "../types/game";

const DIRECTION_VECTORS: Record<InputDirection, Vector2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function getDirectionVector(direction: InputDirection) {
  return DIRECTION_VECTORS[direction];
}

export function applyLaunchMotion(gameState: GameState, direction: InputDirection): GameState {
  if (gameState.isInputLocked) {
    return gameState;
  }

  return {
    ...gameState,
    motion: {
      isLaunched: true,
      currentDirection: direction,
      currentSpeed: gameState.initialSpeed,
      lastTickAt: null,
    },
  };
}

export function advanceHeadMotion(gameState: GameState, now: number): GameState {
  if (!gameState.motion.isLaunched || !gameState.motion.currentDirection) {
    return gameState;
  }

  if (gameState.motion.lastTickAt === null) {
    return {
      ...gameState,
      motion: {
        ...gameState.motion,
        lastTickAt: now,
      },
    };
  }

  const deltaSeconds = Math.max(0, (now - gameState.motion.lastTickAt) / 1000);

  if (deltaSeconds === 0) {
    return gameState;
  }

  const headBall = gameState.ballQueue.balls[gameState.headIndex];

  if (!headBall) {
    return gameState;
  }

  const vector = getDirectionVector(gameState.motion.currentDirection);
  const moveDistance = gameState.motion.currentSpeed * deltaSeconds;
  const nextHeadPosition = {
    x: headBall.position.x + vector.x * moveDistance,
    y: headBall.position.y + vector.y * moveDistance,
  };

  return {
    ...gameState,
    ballQueue: {
      ...gameState.ballQueue,
      balls: gameState.ballQueue.balls.map((ball, index) => (
        index === gameState.headIndex
          ? {
              ...ball,
              position: nextHeadPosition,
            }
          : ball
      )),
    },
    motion: {
      ...gameState.motion,
      lastTickAt: now,
    },
  };
}
