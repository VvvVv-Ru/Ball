import type { BallColorKey, BallQueue, LevelConfig, Playfield, Rect, Vector2 } from "../types/game";

const LEVEL2_VIEWPORT = {
  width: 1080,
  height: 1920,
} as const;

const LEVEL2_PLAYFIELD_SIZE = 960;
const LEVEL2_BORDER_THICKNESS = 54;
const LEVEL2_BALL_SURFACE_GAP = 14;
const LEVEL2_INITIAL_HP = 3;
const LEVEL2_POINTER_HOLD_STILL_MAX_MS = 300;
const LEVEL2_DIRECTION_DEBOUNCE_AXIS_DELTA = 6;
const LEVEL2_REDIRECT_COOLDOWN_MS = 80;
const LEVEL2_SWIPE_LAUNCH_TUNING = {
  minSpeed: 1800,
  maxSpeed: 4000,
  minSwipeDistance: 10,
  maxSwipeDistance: 240,
} as const;
const LEVEL2_PROJECTILE_TUNING = {
  enabled: true,
  gravity: {
    x: 0,
    y: 1200,
  },
  maxSubstepMs: 8,
  bounceRestitution: 0.8,
} as const;
const LEVEL2_BORDER_IMPACT_SHAKE = {
  enabled: true,
  light: {
    amplitude: 10,
    durationMs: 120,
    cooldownMs: 80,
  },
  medium: {
    amplitude: 16,
    durationMs: 160,
    cooldownMs: 100,
  },
} as const;
const LEVEL2_STAGE_FRAME_MISMATCH_GLOW = {
  enabled: true,
  color: "#d23714",
  peakOpacity: 1,
  edgeWidthPx: 18,
  blurPx: 84,
  spreadPx: 28,
  durationMs: 320,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
const LEVEL2_CAMERA_FOLLOW = {
  enabled: true,
  launchOnlyAfterStart: true,
  deadZonePx: 99,
  maxOffsetX: 4,
  maxOffsetY: 3,
  followLerp: 0.04,
  returnLerp: 0.04,
} as const;
const LEVEL2_BORDER_IMPACT_RING = {
  enabled: true,
  strokeWidth: 0.4,
  startScale: 0.92,
  endScale: 15,
  durationMs: 660,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  alphaFade: true,
} as const;
const LEVEL2_MATCH_IMPACT_PARTICLES = {
  enabled: true,
  particleCount: 18,
  initialSpeedMin: 460,
  initialSpeedMax: 2500,
  scatterAngleDeg: 260,
  lifetimeMs: 420,
  sizeMin: 10,
  sizeMax: 24,
  opacityCurve: "ease-out",
  useGravity: false,
  gravity: 0,
  useDamping: true,
  damping: 8.6,
} as const;
const LEVEL2_SOFT_BALL = {
  enabled: true,
  headOnly: true,
  maxSquash: 0.12,
  maxStretch: 0.16,
  reboundDurationMs: 130,
  overshoot: 0.22,
  jellyWobbleStrength: 0.05,
  secondaryBounceDurationMs: 96,
  minTriggerSpeed: 900,
  launchIntensity: 0.82,
  redirectIntensity: 0.92,
  impactIntensity: 1,
  specialBounceIntensity: 0.94,
  followerScale: 0.35,
  wobbleCycles: 1.6,
  wobbleRotationDeg: 4,
} as const;
const LEVEL2_PLAYFIELD_CENTER: Vector2 = {
  x: LEVEL2_VIEWPORT.width / 2,
  y: LEVEL2_VIEWPORT.height / 2 + 120,
};

const LEVEL2_COLOR_POOL: Record<BallColorKey, string> = {
  red: "#d23714",
  blue: "#255e7d",
  yellow: "#efb323",
};

export const LEVEL2_RESULT_CONFETTI = {
  enabled: true,
  launcherCount: 1,
  burstCount: 64,
  speedMin: 0,
  speedMax: 3600,
  spreadAngleDeg: 32,
  lifetimeMs: 1800,
  gravity: 2400,
  spinSpeedMin: -740,
  spinSpeedMax: 720,
  palette: [LEVEL2_COLOR_POOL.red, LEVEL2_COLOR_POOL.blue, LEVEL2_COLOR_POOL.yellow],
  resultUiRevealDelayMs: 540,
  sizeMin: 12,
  sizeMax: 38,
  endSizeScale: 0.3,
  launcherInsetPx: 160,
  bottomOffsetPx: 10,
} as const;

const LEVEL2_HEAD_BALL_RADIUS = 34;
const LEVEL2_REFERENCE_RADII = [100, 86, 74, 64] as const;
const LEVEL2_BALL_QUEUE_COLORS = ["red", "blue", "yellow", "red"] as const;
const LEVEL2_RADIUS_SCALE = LEVEL2_HEAD_BALL_RADIUS / LEVEL2_REFERENCE_RADII[0];

const LEVEL2_BALL_QUEUE_SPECS = LEVEL2_BALL_QUEUE_COLORS.map((colorKey, index) => ({
  colorKey,
  radius: Math.round(LEVEL2_REFERENCE_RADII[index] * LEVEL2_RADIUS_SCALE),
})) as ReadonlyArray<{ colorKey: BallColorKey; radius: number }>;

function createRectFromCenter(center: Vector2, size: number): Rect {
  return {
    x: center.x - size / 2,
    y: center.y - size / 2,
    width: size,
    height: size,
  };
}

function createBorderDefinition(
  side: "top" | "right" | "bottom" | "left",
  color: string,
  thickness: number,
  playfieldRect: Rect,
) {
  const isHorizontal = side === "top" || side === "bottom";
  const fullLength = isHorizontal ? playfieldRect.width : playfieldRect.height;

  let bounds: Rect;

  if (side === "top") {
    bounds = { x: playfieldRect.x, y: playfieldRect.y, width: playfieldRect.width, height: thickness };
  } else if (side === "right") {
    bounds = {
      x: playfieldRect.x + playfieldRect.width - thickness,
      y: playfieldRect.y,
      width: thickness,
      height: playfieldRect.height,
    };
  } else if (side === "bottom") {
    bounds = {
      x: playfieldRect.x,
      y: playfieldRect.y + playfieldRect.height - thickness,
      width: playfieldRect.width,
      height: thickness,
    };
  } else {
    bounds = { x: playfieldRect.x, y: playfieldRect.y, width: thickness, height: playfieldRect.height };
  }

  return {
    id: `level2-border-${side}`,
    side,
    color,
    thickness,
    fullLength,
    active: true,
    bounds,
    segments: [{ start: 0, length: fullLength, active: true, color }],
  };
}

function createLevel2BallQueueConfig(playfield: Playfield): BallQueue {
  const headAnchor = {
    x: playfield.center.x,
    y: playfield.rect.y + playfield.rect.height - playfield.borderThickness,
  };

  const balls = LEVEL2_BALL_QUEUE_SPECS.reduce<BallQueue["balls"]>((queue, spec, index) => {
    const previousBall = queue[index - 1] ?? null;
    const centerY = previousBall
      ? previousBall.position.y - previousBall.radius - spec.radius - LEVEL2_BALL_SURFACE_GAP
      : headAnchor.y - spec.radius;

    queue.push({
      id: `level2-ball-${index}`,
      order: index,
      colorKey: spec.colorKey,
      colorHex: LEVEL2_COLOR_POOL[spec.colorKey],
      radius: spec.radius,
      diameter: spec.radius * 2,
      position: {
        x: headAnchor.x,
        y: centerY,
      },
    });

    return queue;
  }, []);

  return {
    axis: "vertical-up",
    surfaceGap: LEVEL2_BALL_SURFACE_GAP,
    headAnchor,
    headIndex: 0,
    balls,
  };
}

const playfieldRect = createRectFromCenter(LEVEL2_PLAYFIELD_CENTER, LEVEL2_PLAYFIELD_SIZE);

const playfield: Playfield = {
  center: LEVEL2_PLAYFIELD_CENTER,
  size: LEVEL2_PLAYFIELD_SIZE,
  rect: playfieldRect,
  borderThickness: LEVEL2_BORDER_THICKNESS,
  fill: "transparent",
  borders: [
    createBorderDefinition("top", LEVEL2_COLOR_POOL.blue, LEVEL2_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("right", LEVEL2_COLOR_POOL.red, LEVEL2_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("bottom", LEVEL2_COLOR_POOL.red, LEVEL2_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("left", LEVEL2_COLOR_POOL.yellow, LEVEL2_BORDER_THICKNESS, playfieldRect),
  ],
};

const playfieldBallQueue = createLevel2BallQueueConfig(playfield);

export const level2Config: LevelConfig = {
  id: "level2",
  name: "Level 2",
  nextStep: {
    label: "Level 3",
    targetLevelId: null,
    isAvailable: false,
  },
  selectionEntry: {
    label: "Level 2",
    isEnabled: true,
    isPlaceholder: false,
  },
  viewport: { ...LEVEL2_VIEWPORT },
  playfield,
  ballQueue: playfieldBallQueue,
  gameplay: {
    initialHp: LEVEL2_INITIAL_HP,
    input: {
      holdStillMaxMs: LEVEL2_POINTER_HOLD_STILL_MAX_MS,
      directionDebounceAxisDelta: LEVEL2_DIRECTION_DEBOUNCE_AXIS_DELTA,
      redirectCooldownMs: LEVEL2_REDIRECT_COOLDOWN_MS,
    },
    tuning: {
      swipeLaunch: {
        minSpeed: LEVEL2_SWIPE_LAUNCH_TUNING.minSpeed,
        maxSpeed: LEVEL2_SWIPE_LAUNCH_TUNING.maxSpeed,
        minSwipeDistance: LEVEL2_SWIPE_LAUNCH_TUNING.minSwipeDistance,
        maxSwipeDistance: LEVEL2_SWIPE_LAUNCH_TUNING.maxSwipeDistance,
      },
      projectile: {
        enabled: LEVEL2_PROJECTILE_TUNING.enabled,
        gravity: { ...LEVEL2_PROJECTILE_TUNING.gravity },
        maxSubstepMs: LEVEL2_PROJECTILE_TUNING.maxSubstepMs,
        bounceRestitution: LEVEL2_PROJECTILE_TUNING.bounceRestitution,
      },
      borderImpactShake: {
        enabled: LEVEL2_BORDER_IMPACT_SHAKE.enabled,
        light: { ...LEVEL2_BORDER_IMPACT_SHAKE.light },
        medium: { ...LEVEL2_BORDER_IMPACT_SHAKE.medium },
      },
      stageFrameMismatchGlow: {
        enabled: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.enabled,
        color: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.color,
        peakOpacity: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.peakOpacity,
        edgeWidthPx: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.edgeWidthPx,
        blurPx: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.blurPx,
        spreadPx: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.spreadPx,
        durationMs: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.durationMs,
        easing: LEVEL2_STAGE_FRAME_MISMATCH_GLOW.easing,
      },
      cameraFollow: {
        enabled: LEVEL2_CAMERA_FOLLOW.enabled,
        launchOnlyAfterStart: LEVEL2_CAMERA_FOLLOW.launchOnlyAfterStart,
        deadZonePx: LEVEL2_CAMERA_FOLLOW.deadZonePx,
        maxOffsetX: LEVEL2_CAMERA_FOLLOW.maxOffsetX,
        maxOffsetY: LEVEL2_CAMERA_FOLLOW.maxOffsetY,
        followLerp: LEVEL2_CAMERA_FOLLOW.followLerp,
        returnLerp: LEVEL2_CAMERA_FOLLOW.returnLerp,
      },
      borderImpactRing: {
        enabled: LEVEL2_BORDER_IMPACT_RING.enabled,
        strokeWidth: LEVEL2_BORDER_IMPACT_RING.strokeWidth,
        startScale: LEVEL2_BORDER_IMPACT_RING.startScale,
        endScale: LEVEL2_BORDER_IMPACT_RING.endScale,
        durationMs: LEVEL2_BORDER_IMPACT_RING.durationMs,
        easing: LEVEL2_BORDER_IMPACT_RING.easing,
        alphaFade: LEVEL2_BORDER_IMPACT_RING.alphaFade,
      },
      matchImpactParticles: {
        enabled: LEVEL2_MATCH_IMPACT_PARTICLES.enabled,
        particleCount: LEVEL2_MATCH_IMPACT_PARTICLES.particleCount,
        initialSpeedMin: LEVEL2_MATCH_IMPACT_PARTICLES.initialSpeedMin,
        initialSpeedMax: LEVEL2_MATCH_IMPACT_PARTICLES.initialSpeedMax,
        scatterAngleDeg: LEVEL2_MATCH_IMPACT_PARTICLES.scatterAngleDeg,
        lifetimeMs: LEVEL2_MATCH_IMPACT_PARTICLES.lifetimeMs,
        sizeMin: LEVEL2_MATCH_IMPACT_PARTICLES.sizeMin,
        sizeMax: LEVEL2_MATCH_IMPACT_PARTICLES.sizeMax,
        opacityCurve: LEVEL2_MATCH_IMPACT_PARTICLES.opacityCurve,
        useGravity: LEVEL2_MATCH_IMPACT_PARTICLES.useGravity,
        gravity: LEVEL2_MATCH_IMPACT_PARTICLES.gravity,
        useDamping: LEVEL2_MATCH_IMPACT_PARTICLES.useDamping,
        damping: LEVEL2_MATCH_IMPACT_PARTICLES.damping,
      },
      softBall: {
        enabled: LEVEL2_SOFT_BALL.enabled,
        headOnly: LEVEL2_SOFT_BALL.headOnly,
        maxSquash: LEVEL2_SOFT_BALL.maxSquash,
        maxStretch: LEVEL2_SOFT_BALL.maxStretch,
        reboundDurationMs: LEVEL2_SOFT_BALL.reboundDurationMs,
        overshoot: LEVEL2_SOFT_BALL.overshoot,
        jellyWobbleStrength: LEVEL2_SOFT_BALL.jellyWobbleStrength,
        secondaryBounceDurationMs: LEVEL2_SOFT_BALL.secondaryBounceDurationMs,
        minTriggerSpeed: LEVEL2_SOFT_BALL.minTriggerSpeed,
        launchIntensity: LEVEL2_SOFT_BALL.launchIntensity,
        redirectIntensity: LEVEL2_SOFT_BALL.redirectIntensity,
        impactIntensity: LEVEL2_SOFT_BALL.impactIntensity,
        specialBounceIntensity: LEVEL2_SOFT_BALL.specialBounceIntensity,
        followerScale: LEVEL2_SOFT_BALL.followerScale,
        wobbleCycles: LEVEL2_SOFT_BALL.wobbleCycles,
        wobbleRotationDeg: LEVEL2_SOFT_BALL.wobbleRotationDeg,
      },
      resultConfetti: {
        enabled: LEVEL2_RESULT_CONFETTI.enabled,
        launcherCount: LEVEL2_RESULT_CONFETTI.launcherCount,
        burstCount: LEVEL2_RESULT_CONFETTI.burstCount,
        speedMin: LEVEL2_RESULT_CONFETTI.speedMin,
        speedMax: LEVEL2_RESULT_CONFETTI.speedMax,
        spreadAngleDeg: LEVEL2_RESULT_CONFETTI.spreadAngleDeg,
        lifetimeMs: LEVEL2_RESULT_CONFETTI.lifetimeMs,
        gravity: LEVEL2_RESULT_CONFETTI.gravity,
        spinSpeedMin: LEVEL2_RESULT_CONFETTI.spinSpeedMin,
        spinSpeedMax: LEVEL2_RESULT_CONFETTI.spinSpeedMax,
        palette: [...LEVEL2_RESULT_CONFETTI.palette],
        resultUiRevealDelayMs: LEVEL2_RESULT_CONFETTI.resultUiRevealDelayMs,
        sizeMin: LEVEL2_RESULT_CONFETTI.sizeMin,
        sizeMax: LEVEL2_RESULT_CONFETTI.sizeMax,
        endSizeScale: LEVEL2_RESULT_CONFETTI.endSizeScale,
        launcherInsetPx: LEVEL2_RESULT_CONFETTI.launcherInsetPx,
        bottomOffsetPx: LEVEL2_RESULT_CONFETTI.bottomOffsetPx,
      },
    },
  },
  notes: {
    placement: "玩法区以舞台中心为基准，Y 轴下移 120px，保持居中略偏下。",
  },
};

export const LEVEL2_CONSTANTS = {
  viewport: LEVEL2_VIEWPORT,
  playfieldSize: LEVEL2_PLAYFIELD_SIZE,
  borderThickness: LEVEL2_BORDER_THICKNESS,
  ballSurfaceGap: LEVEL2_BALL_SURFACE_GAP,
  initialHp: LEVEL2_INITIAL_HP,
  pointerHoldStillMaxMs: LEVEL2_POINTER_HOLD_STILL_MAX_MS,
  directionDebounceAxisDelta: LEVEL2_DIRECTION_DEBOUNCE_AXIS_DELTA,
  redirectCooldownMs: LEVEL2_REDIRECT_COOLDOWN_MS,
  swipeLaunch: LEVEL2_SWIPE_LAUNCH_TUNING,
  projectile: LEVEL2_PROJECTILE_TUNING,
  borderImpactShake: LEVEL2_BORDER_IMPACT_SHAKE,
  cameraFollow: LEVEL2_CAMERA_FOLLOW,
  borderImpactRing: LEVEL2_BORDER_IMPACT_RING,
  matchImpactParticles: LEVEL2_MATCH_IMPACT_PARTICLES,
  softBall: LEVEL2_SOFT_BALL,
  resultConfetti: LEVEL2_RESULT_CONFETTI,
  colorPool: LEVEL2_COLOR_POOL,
} as const;
