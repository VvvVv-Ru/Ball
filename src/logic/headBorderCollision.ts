import type { BallColorKey, Border, CollisionType, GameState, Vector2 } from "../types/game";

const BORDER_COLOR_KEY_MAP: Record<string, BallColorKey> = {
  "#d23714": "red",
  "#255e7d": "blue",
  "#efb323": "yellow",
};

const COLLISION_TIME_TOLERANCE = 0.0001;

function reflectVector(vector: Vector2, side: Border["side"]): Vector2 {
  if (side === "top" || side === "bottom") {
    return { x: vector.x, y: -vector.y };
  }

  return { x: -vector.x, y: vector.y };
}

function reflectVectorBySides(vector: Vector2, sides: Border["side"][]) {
  return sides.reduce((current, side) => reflectVector(current, side), vector);
}

function getInnerBounds(gameState: GameState, radius: number) {
  const { rect, borderThickness } = gameState.playfield;

  return {
    minX: rect.x + borderThickness + radius,
    maxX: rect.x + rect.width - borderThickness - radius,
    minY: rect.y + borderThickness + radius,
    maxY: rect.y + rect.height - borderThickness - radius,
  };
}

function getBorderBySide(gameState: GameState, side: Border["side"]) {
  return gameState.playfield.borders.find((border) => border.side === side && border.active) ?? null;
}

function getCollisionCandidates(current: Vector2, next: Vector2, bounds: ReturnType<typeof getInnerBounds>) {
  const deltaX = next.x - current.x;
  const deltaY = next.y - current.y;
  const candidates: Array<{ side: Border["side"]; time: number }> = [];

  if (deltaX > 0 && next.x >= bounds.maxX) {
    candidates.push({ side: "right", time: (bounds.maxX - current.x) / deltaX });
  }

  if (deltaX < 0 && next.x <= bounds.minX) {
    candidates.push({ side: "left", time: (bounds.minX - current.x) / deltaX });
  }

  if (deltaY > 0 && next.y >= bounds.maxY) {
    candidates.push({ side: "bottom", time: (bounds.maxY - current.y) / deltaY });
  }

  if (deltaY < 0 && next.y <= bounds.minY) {
    candidates.push({ side: "top", time: (bounds.minY - current.y) / deltaY });
  }

  return candidates.filter((candidate) => candidate.time >= -COLLISION_TIME_TOLERANCE && candidate.time <= 1 + COLLISION_TIME_TOLERANCE);
}

export function resolveHeadBorderCollision(gameState: GameState, nextHeadPosition: Vector2) {
  const headBall = gameState.ballQueue.balls[gameState.headIndex];
  const currentVector = gameState.motion.currentVector;

  if (!headBall || !currentVector) {
    return null;
  }

  const bounds = getInnerBounds(gameState, headBall.radius);
  const currentPosition = headBall.position;
  const candidates = getCollisionCandidates(currentPosition, nextHeadPosition, bounds);

  if (candidates.length === 0) {
    return null;
  }

  const earliestTime = Math.max(0, Math.min(...candidates.map((candidate) => candidate.time)));
  const hitSides = candidates
    .filter((candidate) => Math.abs(candidate.time - earliestTime) <= COLLISION_TIME_TOLERANCE)
    .map((candidate) => candidate.side);
  const primarySide = hitSides[0];
  const border = primarySide ? getBorderBySide(gameState, primarySide) : null;

  if (!primarySide || !border) {
    return null;
  }

  const deltaX = nextHeadPosition.x - currentPosition.x;
  const deltaY = nextHeadPosition.y - currentPosition.y;
  const resolvedPosition = {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, currentPosition.x + deltaX * earliestTime)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, currentPosition.y + deltaY * earliestTime)),
  };
  const afterVector = reflectVectorBySides(currentVector, hitSides);
  const borderColorKey = BORDER_COLOR_KEY_MAP[border.color.toLowerCase()] ?? null;
  const collisionType: CollisionType = borderColorKey === gameState.currentHeadColor ? "match" : "mismatch";

  return {
    resolvedPosition,
    nextVector: afterVector,
    collision: {
      borderId: border.id,
      side: border.side,
      type: collisionType,
      borderColor: borderColorKey,
      headColor: gameState.currentHeadColor,
      beforeVector: currentVector,
      afterVector,
    },
  };
}
