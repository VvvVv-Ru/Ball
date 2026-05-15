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

function deactivateBorderSegment(border: Border, segmentIndex: number): Border {
  if (!border.segments[segmentIndex]) {
    return border;
  }

  const nextSegments = border.segments.map((segment, index) => (
    index === segmentIndex
      ? {
          ...segment,
          active: false,
        }
      : segment
  ));
  const hasActiveSegment = nextSegments.some((segment) => segment.active);

  return {
    ...border,
    active: hasActiveSegment,
    segments: nextSegments,
  };
}

export function deactivateBorderTargetById(gameState: GameState, borderId: string, segmentIndex: number | null) {
  return gameState.playfield.borders.map((border) => (
    border.id === borderId
      ? segmentIndex === null
        ? deactivateBorder(border)
        : deactivateBorderSegment(border, segmentIndex)
      : border
  ));
}

export function resolveNoNextBallBorderClear(gameState: GameState): GameState {
  const pendingBorderId = gameState.rule.pendingBorderId;
  const pendingBorderSegmentIndex = gameState.rule.pendingBorderSegmentIndex;

  if (!pendingBorderId) {
    return gameState;
  }

  return {
    ...gameState,
    playfield: {
      ...gameState.playfield,
      borders: deactivateBorderTargetById(gameState, pendingBorderId, pendingBorderSegmentIndex),
    },
    rule: {
      ...gameState.rule,
      delayedBorderState: "idle",
      pendingBorderId: null,
      pendingBorderSide: null,
      pendingBorderSegmentIndex: null,
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
      borders: deactivateBorderTargetById(gameState, borderId, gameState.rule.pendingBorderSegmentIndex),
    },
    isInputLocked: false,
    rule: {
      ...gameState.rule,
      delayedBorderState: "idle",
      pendingBorderId: null,
      pendingBorderSide: null,
      pendingBorderSegmentIndex: null,
      pendingBorderColor: null,
      specialBounceTriggered: true,
      lastSpecialBounceBorderId: borderId,
    },
  };
}
