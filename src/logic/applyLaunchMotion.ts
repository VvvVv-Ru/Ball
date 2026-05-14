import type { BorderImpactKind, BorderSide, GameState, ShakeIntensity, Vector2 } from "../types/game";
import { resolveDelayedBorderTrigger } from "./delayedBorderResolution";
import { resolveHeadBorderCollision } from "./headBorderCollision";
import { resolveHeadMatch } from "./headMatchResolution";
import {
  addVectors,
  areVectorsEffectivelySame,
  getMaxQueueStretch,
  getQueueOffsets,
  getSpeedFromVelocity,
  getVectorFromVelocity,
  normalizeVector,
  samplePointOnPath,
  scaleVector,
  trimPath,
} from "./motionMath";
import { resolveSwipeLaunchSpeed } from "./swipeLaunchSpeed";

function getRedirectCoolingState(gameState: GameState, now: number) {
  const lastRedirectAt = gameState.motion.lastRedirectAt;

  if (lastRedirectAt === null) {
    return false;
  }

  return now - lastRedirectAt < gameState.motion.redirectCooldownMs;
}

function getRemainingActiveBorders(gameState: GameState) {
  return gameState.playfield.borders.filter((border) => border.active).length;
}

function isHeadAlreadyTouchingSide(gameState: GameState, side: BorderSide) {
  const headBall = gameState.ballQueue.balls[gameState.headIndex];

  if (!headBall) {
    return false;
  }

  const { rect, borderThickness } = gameState.playfield;
  const tolerance = 0.01;
  const minX = rect.x + borderThickness + headBall.radius;
  const maxX = rect.x + rect.width - borderThickness - headBall.radius;
  const minY = rect.y + borderThickness + headBall.radius;
  const maxY = rect.y + rect.height - borderThickness - headBall.radius;

  if (side === "top") {
    return Math.abs(headBall.position.y - minY) <= tolerance;
  }

  if (side === "bottom") {
    return Math.abs(headBall.position.y - maxY) <= tolerance;
  }

  if (side === "left") {
    return Math.abs(headBall.position.x - minX) <= tolerance;
  }

  return Math.abs(headBall.position.x - maxX) <= tolerance;
}

function getBorderImpact(collisionResult: NonNullable<ResolvedHeadCollisionResult>, gameState: GameState, now: number, isDelayedBorderTrigger: boolean) {
  if (isHeadAlreadyTouchingSide(gameState, collisionResult.collision.side)) {
    return null;
  }

  const headBall = gameState.ballQueue.balls[gameState.headIndex];

  if (!headBall) {
    return null;
  }

  const impactKind: BorderImpactKind = isDelayedBorderTrigger ? "special-bounce" : collisionResult.collision.type;
  const shakeIntensity: ShakeIntensity = impactKind === "mismatch" ? "medium" : "light";

  return {
    borderId: collisionResult.collision.borderId,
    side: collisionResult.collision.side,
    impactKind,
    shakeIntensity,
    center: { ...collisionResult.resolvedPosition },
    ballRadius: headBall.radius,
    occurredAt: now,
  };
}

type ResolvedHeadCollisionResult = ReturnType<typeof resolveHeadBorderCollision>;

type HeadCollisionResult = ResolvedHeadCollisionResult extends infer TResult
  ? TResult extends { collision: infer TCollision }
    ? TCollision | null
    : null
  : null;

interface AdvanceHeadMotionResult {
  nextGameState: GameState;
  collision: HeadCollisionResult;
  borderImpact: {
    borderId: string;
    side: BorderSide;
    impactKind: BorderImpactKind;
    shakeIntensity: ShakeIntensity;
    center: Vector2;
    ballRadius: number;
    occurredAt: number;
  } | null;
  specialBounce: {
    borderId: string;
    remainingTargets: number;
  } | null;
}

function getProjectileGravity(gameState: GameState) {
  return gameState.tuningConfig.projectile.enabled ? gameState.motion.gravity : { x: 0, y: 0 };
}

function getTailBufferDistance(speed: number) {
  return Math.max(speed, 1);
}

export function applyLaunchMotion(
  gameState: GameState,
  vector: Vector2,
  occurredAt: number,
  swipeDistance: number,
): GameState {
  if (gameState.isInputLocked) {
    return gameState;
  }

  const normalizedVector = normalizeVector(vector);

  if (!normalizedVector) {
    return gameState;
  }

  const resolvedSpeed = resolveSwipeLaunchSpeed(gameState, swipeDistance);

  if (resolvedSpeed === null) {
    return gameState;
  }

  const isAlreadyLaunched = gameState.motion.isLaunched;
  const isSameDirection = areVectorsEffectivelySame(gameState.motion.currentVector, normalizedVector);
  const isRedirectCooling = isAlreadyLaunched && !isSameDirection && getRedirectCoolingState(gameState, occurredAt);

  if (isRedirectCooling) {
    return {
      ...gameState,
      motion: {
        ...gameState.motion,
        isRedirectCooling: true,
      },
    };
  }

  const nextVelocity = {
    x: normalizedVector.x * resolvedSpeed,
    y: normalizedVector.y * resolvedSpeed,
  };

  return {
    ...gameState,
    motion: {
      ...gameState.motion,
      isLaunched: true,
      velocity: nextVelocity,
      currentVector: normalizedVector,
      currentSpeed: resolvedSpeed,
      lastTickAt: occurredAt,
      lastRedirectAt: isAlreadyLaunched ? occurredAt : gameState.motion.lastRedirectAt,
      isRedirectCooling: isAlreadyLaunched && !isSameDirection,
      lastAcceptedVector: normalizedVector,
    },
  };
}

export function advanceHeadMotion(
  gameState: GameState,
  now: number,
): AdvanceHeadMotionResult {
  if (!gameState.motion.isLaunched || !gameState.motion.currentVector) {
    return { nextGameState: gameState, collision: null, borderImpact: null, specialBounce: null };
  }

  const isRedirectCooling = getRedirectCoolingState(gameState, now);

  if (gameState.motion.lastTickAt === null) {
    return {
      nextGameState: {
        ...gameState,
        motion: {
          ...gameState.motion,
          lastTickAt: now,
          isRedirectCooling,
        },
      },
      collision: null,
      borderImpact: null,
      specialBounce: null,
    };
  }

  const deltaSeconds = Math.max(0, (now - gameState.motion.lastTickAt) / 1000);

  if (deltaSeconds === 0) {
    return { nextGameState: gameState, collision: null, borderImpact: null, specialBounce: null };
  }

  const headBall = gameState.ballQueue.balls[gameState.headIndex];

  if (!headBall) {
    return { nextGameState: gameState, collision: null, borderImpact: null, specialBounce: null };
  }

  const gravity = getProjectileGravity(gameState);
  const maxSubstepSeconds = Math.max(gameState.motion.maxSubstepMs, 1) / 1000;
  const substepCount = Math.max(1, Math.ceil(deltaSeconds / maxSubstepSeconds));
  const substepSeconds = deltaSeconds / substepCount;
  let currentPosition = { ...headBall.position };
  let currentVelocity = { ...gameState.motion.velocity };
  let collisionResult: ResolvedHeadCollisionResult = null;
  let isDelayedBorderTrigger = false;
  let borderImpact: AdvanceHeadMotionResult["borderImpact"] = null;
  const pathSamples: Vector2[] = [];

  for (let step = 0; step < substepCount; step += 1) {
    const integratedVelocity = addVectors(currentVelocity, scaleVector(gravity, substepSeconds));
    const nextHeadPosition = addVectors(currentPosition, scaleVector(integratedVelocity, substepSeconds));
    const stepCollision = resolveHeadBorderCollision(
      gameState,
      currentPosition,
      nextHeadPosition,
      integratedVelocity,
      gameState.motion.bounceRestitution,
    );

    if (stepCollision) {
      collisionResult = stepCollision;
      isDelayedBorderTrigger = Boolean(
        gameState.rule.delayedBorderState === "pending"
        && gameState.rule.pendingBorderId
        && stepCollision.collision.borderId === gameState.rule.pendingBorderId,
      );
      borderImpact = getBorderImpact(stepCollision, gameState, now, isDelayedBorderTrigger);
      currentPosition = { ...stepCollision.resolvedPosition };
      currentVelocity = stepCollision.collision.type === "mismatch" || isDelayedBorderTrigger
        ? { ...stepCollision.nextVelocity }
        : { ...integratedVelocity };
      pathSamples.unshift({ ...currentPosition });
      break;
    }

    currentPosition = { ...nextHeadPosition };
    currentVelocity = { ...integratedVelocity };
    pathSamples.unshift({ ...currentPosition });
  }

  const resolvedHeadPosition = collisionResult?.resolvedPosition ?? currentPosition;
  const nextVelocity = currentVelocity;
  const nextVector = getVectorFromVelocity(nextVelocity);
  const nextSpeed = getSpeedFromVelocity(nextVelocity);
  const queueOffsets = getQueueOffsets(gameState);
  const nextPath = trimPath(
    [...pathSamples, ...gameState.motion.headPath],
    (queueOffsets[queueOffsets.length - 1] ?? 0) + getTailBufferDistance(nextSpeed),
  );
  const nextPositions = queueOffsets.map((offset) => samplePointOnPath(nextPath, offset));
  const maxQueueStretch = getMaxQueueStretch(nextPositions, queueOffsets);

  const collisionState = collisionResult
    ? {
        lastCollisionBorderId: collisionResult.collision.borderId,
        lastCollisionSide: collisionResult.collision.side,
        lastCollisionType: collisionResult.collision.type,
        lastCollisionBorderColor: collisionResult.collision.borderColor,
        lastCollisionHeadColor: collisionResult.collision.headColor,
        lastReflectionBefore: collisionResult.collision.beforeVector,
        lastReflectionAfter: collisionResult.collision.afterVector,
      }
    : gameState.collision;

  const baseNextGameState = {
    ...gameState,
    ballQueue: {
      ...gameState.ballQueue,
      balls: gameState.ballQueue.balls.map((ball, index) => ({
        ...ball,
        position: nextPositions[index] ?? ball.position,
      })),
    },
    motion: {
      ...gameState.motion,
      velocity: nextVelocity,
      currentVector: nextVector,
      currentSpeed: nextSpeed,
      lastTickAt: now,
      isRedirectCooling,
      headPath: nextPath,
      maxQueueStretch,
    },
    collision: collisionState,
  };

  if (isDelayedBorderTrigger && collisionResult) {
    const specialBounceState = resolveDelayedBorderTrigger(baseNextGameState, collisionResult.collision.borderId);

    return {
        nextGameState: specialBounceState,
        collision: null,
        borderImpact,
        specialBounce: {
          borderId: collisionResult.collision.borderId,
          remainingTargets: getRemainingActiveBorders(specialBounceState),
      },
    };
  }

  if (collisionResult?.collision.type === "match") {
    return {
      nextGameState: resolveHeadMatch(baseNextGameState, resolvedHeadPosition, collisionResult.collision.borderId),
      collision: collisionResult.collision,
      borderImpact,
      specialBounce: null,
    };
  }

  return {
    nextGameState: {
      ...gameState,
      ...baseNextGameState,
    },
    collision: collisionResult?.collision ?? null,
    borderImpact,
    specialBounce: null,
  };
}
