import type { GameState, InputDirection, Vector2 } from "../types/game";

const INPUT_VECTORS: Record<InputDirection, Vector2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function normalizeVector(vector: Vector2) {
  const magnitude = Math.hypot(vector.x, vector.y);

  if (magnitude <= 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}

export function getInputVectorFromDirection(direction: InputDirection) {
  return { ...INPUT_VECTORS[direction] };
}

export function calculateNextStateFromInput(
  gameState: GameState,
  vector: Vector2,
  occurredAt: number,
  direction: InputDirection | null = null,
): GameState {
  if (gameState.isInputLocked) {
    return gameState;
  }

  return {
    ...gameState,
    input: {
      ...gameState.input,
      lastInputDirection: direction,
      lastInputVector: normalizeVector(vector),
      lastInputAt: occurredAt,
      inputCount: gameState.input.inputCount + 1,
    },
  };
}

export const applyInputIntent = calculateNextStateFromInput;
