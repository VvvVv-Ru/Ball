import type { BallColorKey, GameState, HeadBallIndex, LevelConfig } from "../types/game";

function getHeadColor(levelConfig: LevelConfig, headIndex: HeadBallIndex): BallColorKey | null {
  return levelConfig.ballQueue.balls[headIndex]?.colorKey ?? null;
}

export function createLevel3InitialGameState(levelConfig: LevelConfig): GameState {
  const balls = levelConfig.ballQueue.balls.map((ball) => ({
    ...ball,
    position: { ...ball.position },
  }));
  const headIndex = levelConfig.ballQueue.headIndex;
  const currentHeadColor = getHeadColor(levelConfig, headIndex);

  return {
    levelId: levelConfig.id,
    status: "ready",
    viewport: { ...levelConfig.viewport },
    playfield: {
      ...levelConfig.playfield,
      center: { ...levelConfig.playfield.center },
      rect: { ...levelConfig.playfield.rect },
      borders: levelConfig.playfield.borders.map((border) => ({
        ...border,
        bounds: { ...border.bounds },
        segments: border.segments.map((segment) => ({ ...segment })),
      })),
    },
    ballQueue: {
      ...levelConfig.ballQueue,
      headAnchor: { ...levelConfig.ballQueue.headAnchor },
      headIndex,
      balls,
    },
    headIndex,
    currentHeadColor,
    isInputLocked: false,
    initialSpeed: levelConfig.gameplay.initialSpeed,
    hp: levelConfig.gameplay.initialHp,
    inputConfig: {
      triggerDistance: { ...levelConfig.gameplay.input.triggerDistance },
      holdStillMaxMs: levelConfig.gameplay.input.holdStillMaxMs,
      directionDebounceAxisDelta: levelConfig.gameplay.input.directionDebounceAxisDelta,
      redirectCooldownMs: levelConfig.gameplay.input.redirectCooldownMs,
    },
    tuningConfig: {
      borderImpactShake: {
        enabled: levelConfig.gameplay.tuning.borderImpactShake.enabled,
        light: { ...levelConfig.gameplay.tuning.borderImpactShake.light },
        medium: { ...levelConfig.gameplay.tuning.borderImpactShake.medium },
      },
      borderImpactRing: {
        enabled: levelConfig.gameplay.tuning.borderImpactRing.enabled,
        strokeWidth: levelConfig.gameplay.tuning.borderImpactRing.strokeWidth,
        startScale: levelConfig.gameplay.tuning.borderImpactRing.startScale,
        endScale: levelConfig.gameplay.tuning.borderImpactRing.endScale,
        durationMs: levelConfig.gameplay.tuning.borderImpactRing.durationMs,
        easing: levelConfig.gameplay.tuning.borderImpactRing.easing,
        alphaFade: levelConfig.gameplay.tuning.borderImpactRing.alphaFade,
      },
    },
    input: {
      lastInputDirection: null,
      lastInputVector: { x: 0, y: 0 },
      lastInputAt: null,
      inputCount: 0,
      pointer: {
        isPointerActive: false,
        pointerStart: null,
        lastPointer: null,
        pointerType: null,
        pointerStartedAt: null,
        currentDistance: 0,
        currentThreshold: null,
        hasReachedThreshold: false,
        hasTriggeredInCurrentGesture: false,
      },
    },
    motion: {
      isLaunched: false,
      currentDirection: null,
      currentSpeed: 0,
      lastTickAt: null,
      lastRedirectAt: null,
      redirectCooldownMs: levelConfig.gameplay.input.redirectCooldownMs,
      isRedirectCooling: false,
      lastAcceptedDirection: null,
      headPath: balls.map((ball) => ({ ...ball.position })),
      maxQueueStretch: 0,
    },
    collision: {
      lastCollisionBorderId: null,
      lastCollisionSide: null,
      lastCollisionType: null,
      lastCollisionBorderColor: null,
      lastCollisionHeadColor: null,
      lastReflectionBefore: null,
      lastReflectionAfter: null,
    },
    progress: {
      score: 0,
      combo: 0,
      lastScoreDelta: 0,
    },
    rule: {
      delayedBorderState: "idle",
      pendingBorderId: null,
      pendingBorderSide: null,
      pendingBorderColor: null,
      specialBounceTriggered: false,
      lastSpecialBounceBorderId: null,
      lastRemovedBallId: null,
      lastRemovedBallOrder: null,
    },
    failReason: null,
    clearReason: null,
  };
}
