import type { GameState, Vector2 } from "../types/game";

export function getVectorMagnitude(vector: Vector2) {
  return Math.hypot(vector.x, vector.y);
}

export function normalizeVector(vector: Vector2) {
  const magnitude = getVectorMagnitude(vector);

  if (magnitude <= 0) {
    return null;
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}

export function areVectorsEffectivelySame(left: Vector2 | null, right: Vector2 | null) {
  if (!left || !right) {
    return false;
  }

  return Math.abs(left.x - right.x) <= 0.0001 && Math.abs(left.y - right.y) <= 0.0001;
}

export function getVectorFromVelocity(velocity: Vector2) {
  return normalizeVector(velocity);
}

export function getSpeedFromVelocity(velocity: Vector2) {
  return getVectorMagnitude(velocity);
}

export function addVectors(left: Vector2, right: Vector2): Vector2 {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
  };
}

export function scaleVector(vector: Vector2, scalar: number): Vector2 {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
  };
}

function getLinkDistance(gameState: GameState, leaderIndex: number, followerIndex: number) {
  const leader = gameState.ballQueue.balls[leaderIndex];
  const follower = gameState.ballQueue.balls[followerIndex];

  if (!leader || !follower) {
    return 0;
  }

  return leader.radius + follower.radius + gameState.ballQueue.surfaceGap;
}

export function getQueueOffsets(gameState: GameState, ballCount = gameState.ballQueue.balls.length) {
  const offsets: number[] = [0];

  for (let index = 1; index < ballCount; index += 1) {
    offsets[index] = offsets[index - 1] + getLinkDistance(gameState, index - 1, index);
  }

  return offsets;
}

export function trimPath(path: Vector2[], requiredLength: number) {
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

export function samplePointOnPath(path: Vector2[], distance: number) {
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

export function getMaxQueueStretch(positions: Vector2[], offsets: number[]) {
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
