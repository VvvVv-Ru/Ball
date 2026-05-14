import type { GameState, InputDirection, Vector2 } from "../types/game";
import { resolveHeadBorderCollision } from "./headBorderCollision";
import { resolveHeadMatch } from "./headMatchResolution";

const DIRECTION_VECTORS: Record<InputDirection, Vector2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function getDirectionVector(direction: InputDirection) {
  return DIRECTION_VECTORS[direction];
}

function getLinkDistance(gameState: GameState, leaderIndex: number, followerIndex: number) {
  const leader = gameState.ballQueue.balls[leaderIndex];
  const follower = gameState.ballQueue.balls[followerIndex];

  if (!leader || !follower) {
    return 0;
  }

  return leader.radius + follower.radius + gameState.ballQueue.surfaceGap;
}

function getQueueOffsets(gameState: GameState) {
  const offsets: number[] = [0];

  for (let index = 1; index < gameState.ballQueue.balls.length; index += 1) {
    offsets[index] = offsets[index - 1] + getLinkDistance(gameState, index - 1, index);
  }

  return offsets;
}

function trimPath(path: Vector2[], requiredLength: number) {
  if (path.length <= 1) {
    return path;
  }

  const trimmedPath: Vector2[] = [{ ...path[0] }];
  let accumulated = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    const current = path[index];
    const next = path[index + 1];
    const segmentLength = Math.hypot(next.x - current.x, next.y - current.y);

    if (segmentLength === 0) {
      continue;
    }

    if (accumulated + segmentLength <= requiredLength) {
      trimmedPath.push({ ...next });
      accumulated += segmentLength;
      continue;
    }

    const remaining = Math.max(0, requiredLength - accumulated);
    const ratio = remaining / segmentLength;

    trimmedPath.push({
      x: current.x + (next.x - current.x) * ratio,
      y: current.y + (next.y - current.y) * ratio,
    });
    return trimmedPath;
  }

  return trimmedPath;
}

function samplePointOnPath(path: Vector2[], distance: number) {
  if (path.length === 0) {
    return { x: 0, y: 0 };
  }

  if (distance <= 0 || path.length === 1) {
    return { ...path[0] };
  }

  let traveled = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);

    if (segmentLength === 0) {
      continue;
    }

    if (traveled + segmentLength >= distance) {
      const ratio = (distance - traveled) / segmentLength;

      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }

    traveled += segmentLength;
  }

  return { ...path[path.length - 1] };
}

function getMaxQueueStretch(positions: Vector2[], offsets: number[]) {
  let maxStretch = 0;

  for (let index = 1; index < positions.length; index += 1) {
    const expectedDistance = offsets[index] - offsets[index - 1];
    const actualDistance = Math.hypot(
      positions[index].x - positions[index - 1].x,
      positions[index].y - positions[index - 1].y,
    );

    maxStretch = Math.max(maxStretch, Math.abs(actualDistance - expectedDistance));
  }

  return maxStretch;
}

function getRedirectCoolingState(gameState: GameState, now: number) {
  const lastRedirectAt = gameState.motion.lastRedirectAt;

  if (lastRedirectAt === null) {
    return false;
  }

  return now - lastRedirectAt < gameState.motion.redirectCooldownMs;
}

export function applyLaunchMotion(gameState: GameState, direction: InputDirection, occurredAt: number): GameState {
  if (gameState.isInputLocked) {
    return gameState;
  }

  const isAlreadyLaunched = gameState.motion.isLaunched;
  const isSameDirection = gameState.motion.currentDirection === direction;
  const isRedirectCooling = isAlreadyLaunched && !isSameDirection && getRedirectCoolingState(gameState, occurredAt);

  if (isRedirectCooling) {
    return {
      ...gameState,
      motion: {
        ...gameState.motion,
        isRedirectCooling: true,
      },
    };
  }

  return {
    ...gameState,
    motion: {
      ...gameState.motion,
      isLaunched: true,
      currentDirection: direction,
      currentSpeed: gameState.initialSpeed,
      lastTickAt: occurredAt,
      lastRedirectAt: isAlreadyLaunched ? occurredAt : gameState.motion.lastRedirectAt,
      isRedirectCooling: isAlreadyLaunched && !isSameDirection,
      lastAcceptedDirection: direction,
    },
  };
}

export function advanceHeadMotion(gameState: GameState, now: number) {
  if (!gameState.motion.isLaunched || !gameState.motion.currentDirection) {
    return { nextGameState: gameState, collision: null };
  }

  const isRedirectCooling = getRedirectCoolingState(gameState, now);

  if (gameState.motion.lastTickAt === null) {
    return {
      nextGameState: {
        ...gameState,
        motion: {
          ...gameState.motion,
          lastTickAt: now,
          isRedirectCooling,
        },
      },
      collision: null,
    };
  }

  const deltaSeconds = Math.max(0, (now - gameState.motion.lastTickAt) / 1000);

  if (deltaSeconds === 0) {
    return { nextGameState: gameState, collision: null };
  }

  const headBall = gameState.ballQueue.balls[gameState.headIndex];

  if (!headBall) {
    return { nextGameState: gameState, collision: null };
  }

  const vector = getDirectionVector(gameState.motion.currentDirection);
  const moveDistance = gameState.motion.currentSpeed * deltaSeconds;
  const nextHeadPosition = {
    x: headBall.position.x + vector.x * moveDistance,
    y: headBall.position.y + vector.y * moveDistance,
  };
  const collisionResult = resolveHeadBorderCollision(gameState, nextHeadPosition);
  const resolvedHeadPosition = collisionResult?.resolvedPosition ?? nextHeadPosition;
  const nextDirection = collisionResult?.collision.type === "mismatch"
    ? collisionResult.nextDirection
    : gameState.motion.currentDirection;
  const nextPath = trimPath(
    [{ ...resolvedHeadPosition }, ...gameState.motion.headPath],
    getQueueOffsets(gameState)[gameState.ballQueue.balls.length - 1] + gameState.motion.currentSpeed,
  );
  const queueOffsets = getQueueOffsets(gameState);
  const nextPositions = queueOffsets.map((offset) => samplePointOnPath(nextPath, offset));
  const maxQueueStretch = getMaxQueueStretch(nextPositions, queueOffsets);

  const collisionState = collisionResult
    ? {
        lastCollisionBorderId: collisionResult.collision.borderId,
        lastCollisionSide: collisionResult.collision.side,
        lastCollisionType: collisionResult.collision.type,
        lastCollisionBorderColor: collisionResult.collision.borderColor,
        lastCollisionHeadColor: collisionResult.collision.headColor,
        lastReflectionBefore: collisionResult.collision.beforeVector,
        lastReflectionAfter: collisionResult.collision.afterVector,
      }
    : gameState.collision;

  const baseNextGameState = {
    ...gameState,
    ballQueue: {
      ...gameState.ballQueue,
      balls: gameState.ballQueue.balls.map((ball, index) => ({
        ...ball,
        position: nextPositions[index] ?? ball.position,
      })),
    },
    motion: {
      ...gameState.motion,
      currentDirection: nextDirection,
      lastTickAt: now,
      isRedirectCooling,
      headPath: nextPath,
      maxQueueStretch,
    },
    collision: collisionState,
  };

  if (collisionResult?.collision.type === "match") {
    return {
      nextGameState: resolveHeadMatch(baseNextGameState, resolvedHeadPosition, collisionResult.collision.borderId),
      collision: collisionResult.collision,
    };
  }

  return {
    nextGameState: {
      ...gameState,
      ...baseNextGameState,
    },
    collision: collisionResult?.collision ?? null,
  };
}
