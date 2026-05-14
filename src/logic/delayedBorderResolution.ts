import type { Border, GameState } from "../types/game";

function deactivateBorder(border: Border): Border {
  return {
    ...border,
    active: false,
    segments: border.segments.map((segment) => ({
      ...segment,
      active: false,
    })),
  };
}

function deactivateBorderById(gameState: GameState, borderId: string) {
  return gameState.playfield.borders.map((border) => (
    border.id === borderId ? deactivateBorder(border) : border
  ));
}

export function resolveNoNextBallBorderClear(gameState: GameState): GameState {
  const pendingBorderId = gameState.rule.pendingBorderId;

  if (!pendingBorderId) {
    return gameState;
  }

  return {
    ...gameState,
    playfield: {
      ...gameState.playfield,
      borders: deactivateBorderById(gameState, pendingBorderId),
    },
    rule: {
      ...gameState.rule,
      delayedBorderState: "idle",
      pendingBorderId: null,
      pendingBorderSide: null,
      pendingBorderColor: null,
      specialBounceTriggered: false,
      lastSpecialBounceBorderId: pendingBorderId,
    },
  };
}

export function resolveDelayedBorderTrigger(gameState: GameState, borderId: string): GameState {
  return {
    ...gameState,
    playfield: {
      ...gameState.playfield,
      borders: deactivateBorderById(gameState, borderId),
    },
    isInputLocked: false,
    rule: {
      ...gameState.rule,
      delayedBorderState: "idle",
      pendingBorderId: null,
      pendingBorderSide: null,
      pendingBorderColor: null,
      specialBounceTriggered: true,
      lastSpecialBounceBorderId: borderId,
    },
  };
}
