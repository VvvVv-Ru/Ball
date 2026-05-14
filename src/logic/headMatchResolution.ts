import type { GameState, Vector2 } from "../types/game";
import { resolveNoNextBallBorderClear } from "./delayedBorderResolution";
import { getQueueOffsets, samplePointOnPath, trimPath } from "./motionMath";

function getTailBufferDistance(speed: number) {
  return Math.max(speed, 1);
}

export function resolveHeadMatch(gameState: GameState, resolvedHeadPosition: Vector2, borderId: string): GameState {
  const removedBall = gameState.ballQueue.balls[gameState.headIndex] ?? null;
  const remainingBalls = gameState.ballQueue.balls.slice(gameState.headIndex + 1).map((ball, index) => ({
    ...ball,
    order: index,
  }));
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
      velocity: hasNextHead ? gameState.motion.velocity : { x: 0, y: 0 },
      currentSpeed: hasNextHead ? gameState.motion.currentSpeed : 0,
      currentVector: hasNextHead ? gameState.motion.currentVector : null,
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
