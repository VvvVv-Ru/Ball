import type { BallColorKey, Border, CollisionType, GameState, InputDirection, Vector2 } from "../types/game";

const DIRECTION_VECTORS: Record<InputDirection, Vector2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const BORDER_COLOR_KEY_MAP: Record<string, BallColorKey> = {
  "#d23714": "red",
  "#255e7d": "blue",
  "#efb323": "yellow",
};

function toVector(direction: InputDirection) {
  return DIRECTION_VECTORS[direction];
}

function reflectDirection(direction: InputDirection, side: Border["side"]): InputDirection {
  if (side === "top" || side === "bottom") {
    return direction === "up" ? "down" : direction === "down" ? "up" : direction;
  }

  return direction === "left" ? "right" : direction === "right" ? "left" : direction;
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

export function resolveHeadBorderCollision(gameState: GameState, nextHeadPosition: Vector2) {
  const headBall = gameState.ballQueue.balls[gameState.headIndex];
  const currentDirection = gameState.motion.currentDirection;

  if (!headBall || !currentDirection) {
    return null;
  }

  const bounds = getInnerBounds(gameState, headBall.radius);
  let collisionSide: Border["side"] | null = null;
  let resolvedPosition = { ...nextHeadPosition };

  if (currentDirection === "up" && nextHeadPosition.y <= bounds.minY) {
    collisionSide = "top";
    resolvedPosition.y = bounds.minY;
  } else if (currentDirection === "down" && nextHeadPosition.y >= bounds.maxY) {
    collisionSide = "bottom";
    resolvedPosition.y = bounds.maxY;
  } else if (currentDirection === "left" && nextHeadPosition.x <= bounds.minX) {
    collisionSide = "left";
    resolvedPosition.x = bounds.minX;
  } else if (currentDirection === "right" && nextHeadPosition.x >= bounds.maxX) {
    collisionSide = "right";
    resolvedPosition.x = bounds.maxX;
  }

  if (!collisionSide) {
    return null;
  }

  const border = getBorderBySide(gameState, collisionSide);

  if (!border) {
    return null;
  }

  const nextDirection = reflectDirection(currentDirection, collisionSide);
  const beforeVector = toVector(currentDirection);
  const afterVector = toVector(nextDirection);
  const borderColorKey = BORDER_COLOR_KEY_MAP[border.color.toLowerCase()] ?? null;
  const collisionType: CollisionType = borderColorKey === gameState.currentHeadColor ? "match" : "mismatch";

  return {
    resolvedPosition,
    nextDirection,
    collision: {
      borderId: border.id,
      side: border.side,
      type: collisionType,
      borderColor: borderColorKey,
      headColor: gameState.currentHeadColor,
      beforeVector,
      afterVector,
    },
  };
}
