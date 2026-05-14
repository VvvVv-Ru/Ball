import type { GameState, InputDirection, Vector2 } from "../types/game";

const INPUT_VECTORS: Record<InputDirection, Vector2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function calculateNextStateFromInput(gameState: GameState, direction: InputDirection, occurredAt: number): GameState {
  if (gameState.isInputLocked) {
    return gameState;
  }

  return {
    ...gameState,
    input: {
      ...gameState.input,
      lastInputDirection: direction,
      lastInputVector: { ...INPUT_VECTORS[direction] },
      lastInputAt: occurredAt,
      inputCount: gameState.input.inputCount + 1,
    },
  };
}

export const applyInputIntent = calculateNextStateFromInput;
