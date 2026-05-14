import type { GameState, Vector2 } from "../types/game";
import { resolveNoNextBallBorderClear } from "./delayedBorderResolution";

function getLinkDistance(gameState: GameState, leaderIndex: number, followerIndex: number) {
  const leader = gameState.ballQueue.balls[leaderIndex];
  const follower = gameState.ballQueue.balls[followerIndex];

  if (!leader || !follower) {
    return 0;
  }

  return leader.radius + follower.radius + gameState.ballQueue.surfaceGap;
}

function getQueueOffsets(gameState: GameState, nextLength: number) {
  const offsets: number[] = [0];

  for (let index = 1; index < nextLength; index += 1) {
    offsets[index] = offsets[index - 1] + getLinkDistance(gameState, index, index + 1);
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

export function resolveHeadMatch(gameState: GameState, resolvedHeadPosition: Vector2, borderId: string): GameState {
  const removedBall = gameState.ballQueue.balls[gameState.headIndex] ?? null;
  const remainingBalls = gameState.ballQueue.balls.slice(gameState.headIndex + 1).map((ball, index) => ({
    ...ball,
    order: index,
  }));
  const queueOffsets = getQueueOffsets(gameState, remainingBalls.length);
  const nextPath = trimPath(
    [{ ...resolvedHeadPosition }, ...gameState.motion.headPath],
    (queueOffsets[queueOffsets.length - 1] ?? 0) + gameState.motion.currentSpeed,
  );

  const positionedBalls = remainingBalls.map((ball, index) => ({
    ...ball,
    position: samplePointOnPath(nextPath, queueOffsets[index] ?? 0),
  }));
  const nextHead = positionedBalls[0] ?? null;
  const hasNextHead = Boolean(nextHead);

  const nextGameState: GameState = {
    ...gameState,
    ballQueue: {
      ...gameState.ballQueue,
      headIndex: 0,
      balls: positionedBalls,
    },
    headIndex: 0,
    currentHeadColor: nextHead?.colorKey ?? null,
    isInputLocked: hasNextHead,
    motion: {
      ...gameState.motion,
      isLaunched: hasNextHead ? gameState.motion.isLaunched : false,
      currentSpeed: hasNextHead ? gameState.motion.currentSpeed : 0,
      headPath: nextPath,
    },
    rule: {
      ...gameState.rule,
      delayedBorderState: hasNextHead ? "pending" : "idle",
      pendingBorderId: borderId,
      pendingBorderSide: gameState.collision.lastCollisionSide,
      pendingBorderColor: gameState.collision.lastCollisionBorderColor,
      specialBounceTriggered: false,
      lastSpecialBounceBorderId: null,
      lastRemovedBallId: removedBall?.id ?? null,
      lastRemovedBallOrder: removedBall?.order ?? null,
    },
  };

  return hasNextHead ? nextGameState : resolveNoNextBallBorderClear(nextGameState);
}
