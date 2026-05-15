import type { GameState, Vector2 } from "../types/game";
import { deactivateBorderTargetById, resolveNoNextBallBorderClear } from "./delayedBorderResolution";
import { getQueueOffsets, samplePointOnPath, trimPath } from "./motionMath";

function getTailBufferDistance(speed: number) {
  return Math.max(speed, 1);
}

function rebuildRemainingBallsWithInheritedFrontSizes(gameState: GameState) {
  return gameState.ballQueue.balls.slice(gameState.headIndex + 1).map((ball, index) => {
    const inheritedSizeSource = gameState.ballQueue.balls[gameState.headIndex + index] ?? ball;

    return {
      ...ball,
      order: index,
      radius: inheritedSizeSource.radius,
      diameter: inheritedSizeSource.diameter,
    };
  });
}

function deactivateBordersByColor(gameState: GameState, color: string | null) {
  if (!color) {
    return gameState.playfield.borders;
  }

  const normalizedColor = color.toLowerCase();

  return gameState.playfield.borders.map((border) => {
    if (border.color.toLowerCase() !== normalizedColor) {
      return border;
    }

    return {
      ...border,
      active: false,
      segments: border.segments.map((segment) => ({
        ...segment,
        active: false,
      })),
    };
  });
}

function getMatchedSegmentIndex(gameState: GameState, borderId: string) {
  if (gameState.levelId !== "level4") {
    return null;
  }

  const matchedBorder = gameState.playfield.borders.find((border) => border.id === borderId) ?? null;

  if (!matchedBorder || matchedBorder.segments.length <= 1) {
    return null;
  }

  return gameState.collision.lastCollisionSegmentIndex;
}

export function resolveHeadMatch(gameState: GameState, resolvedHeadPosition: Vector2, borderId: string): GameState {
  const removedBall = gameState.ballQueue.balls[gameState.headIndex] ?? null;
  const matchedBorder = gameState.playfield.borders.find((border) => border.id === borderId) ?? null;
  const matchedSegmentIndex = getMatchedSegmentIndex(gameState, borderId);
  const shouldClearSameColorBordersImmediately = gameState.levelId === "level1";
  const remainingBalls = rebuildRemainingBallsWithInheritedFrontSizes(gameState);
  const queueOffsets = getQueueOffsets(
    {
      ...gameState,
      ballQueue: {
        ...gameState.ballQueue,
        balls: remainingBalls,
      },
    },
    remainingBalls.length,
  );
  const nextPath = trimPath(
    [{ ...resolvedHeadPosition }, ...gameState.motion.headPath],
    (queueOffsets[queueOffsets.length - 1] ?? 0) + getTailBufferDistance(gameState.motion.currentSpeed),
  );

  const positionedBalls = remainingBalls.map((ball, index) => ({
    ...ball,
    position: samplePointOnPath(nextPath, queueOffsets[index] ?? 0),
  }));
  const nextHead = positionedBalls[0] ?? null;
  const hasNextHead = Boolean(nextHead);
  const nextBorders = shouldClearSameColorBordersImmediately
    ? deactivateBordersByColor(gameState, matchedBorder?.color ?? null)
    : gameState.playfield.borders;

  const nextGameState: GameState = {
    ...gameState,
    playfield: {
      ...gameState.playfield,
      borders: nextBorders,
    },
    ballQueue: {
      ...gameState.ballQueue,
      headIndex: 0,
      balls: positionedBalls,
    },
    headIndex: 0,
    currentHeadColor: nextHead?.colorKey ?? null,
    isInputLocked: shouldClearSameColorBordersImmediately ? false : hasNextHead,
    motion: {
      ...gameState.motion,
      isLaunched: hasNextHead ? gameState.motion.isLaunched : false,
      velocity: hasNextHead ? gameState.motion.velocity : { x: 0, y: 0 },
      currentSpeed: hasNextHead ? gameState.motion.currentSpeed : 0,
      currentVector: hasNextHead ? gameState.motion.currentVector : null,
      headPath: nextPath,
    },
    rule: {
      ...gameState.rule,
      delayedBorderState: shouldClearSameColorBordersImmediately ? "idle" : hasNextHead ? "pending" : "idle",
      pendingBorderId: shouldClearSameColorBordersImmediately ? null : borderId,
      pendingBorderSide: shouldClearSameColorBordersImmediately ? null : gameState.collision.lastCollisionSide,
      pendingBorderSegmentIndex: shouldClearSameColorBordersImmediately ? null : matchedSegmentIndex,
      pendingBorderColor: shouldClearSameColorBordersImmediately ? null : gameState.collision.lastCollisionBorderColor,
      specialBounceTriggered: false,
      lastSpecialBounceBorderId: null,
      lastRemovedBallId: removedBall?.id ?? null,
      lastRemovedBallOrder: removedBall?.order ?? null,
    },
  };

  if (shouldClearSameColorBordersImmediately) {
    return nextGameState;
  }

  if (hasNextHead) {
    return nextGameState;
  }

  if (matchedSegmentIndex !== null) {
    return resolveNoNextBallBorderClear({
      ...nextGameState,
      playfield: {
        ...nextGameState.playfield,
        borders: deactivateBorderTargetById(nextGameState, borderId, matchedSegmentIndex),
      },
      rule: {
        ...nextGameState.rule,
        delayedBorderState: "idle",
        pendingBorderId: null,
        pendingBorderSide: null,
        pendingBorderSegmentIndex: null,
        pendingBorderColor: null,
      },
    });
  }

  return resolveNoNextBallBorderClear(nextGameState);
}
