import type { BallColorKey, BallQueue, LevelConfig, Playfield, Rect, Vector2 } from "../types/game";

const LEVEL4_VIEWPORT = {
  width: 1080,
  height: 1920,
} as const;

const LEVEL4_PLAYFIELD_SIZE = 960;
const LEVEL4_BORDER_THICKNESS = 54;
const LEVEL4_BALL_SURFACE_GAP = 14;
const LEVEL4_INITIAL_HP = 3;
const LEVEL4_POINTER_HOLD_STILL_MAX_MS = 300;
const LEVEL4_DIRECTION_DEBOUNCE_AXIS_DELTA = 6;
const LEVEL4_REDIRECT_COOLDOWN_MS = 80;
const LEVEL4_SWIPE_LAUNCH_TUNING = {
  minSpeed: 1800,
  maxSpeed: 4000,
  minSwipeDistance: 10,
  maxSwipeDistance: 240,
} as const;
const LEVEL4_PROJECTILE_TUNING = {
  enabled: true,
  gravity: {
    x: 0,
    y: 1200,
  },
  maxSubstepMs: 8,
  bounceRestitution: 0.8,
} as const;
const LEVEL4_BORDER_IMPACT_SHAKE = {
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
const LEVEL4_STAGE_FRAME_MISMATCH_GLOW = {
  enabled: true,
  color: "#d23714",
  peakOpacity: 1,
  edgeWidthPx: 18,
  blurPx: 84,
  spreadPx: 28,
  durationMs: 320,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
const LEVEL4_CAMERA_FOLLOW = {
  enabled: true,
  launchOnlyAfterStart: true,
  deadZonePx: 99,
  maxOffsetX: 4,
  maxOffsetY: 3,
  followLerp: 0.04,
  returnLerp: 0.04,
} as const;
const LEVEL4_BORDER_IMPACT_RING = {
  enabled: true,
  strokeWidth: 0.4,
  startScale: 0.92,
  endScale: 15,
  durationMs: 660,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  alphaFade: true,
} as const;
const LEVEL4_MATCH_IMPACT_PARTICLES = {
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
const LEVEL4_SOFT_BALL = {
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
const LEVEL4_PLAYFIELD_CENTER: Vector2 = {
  x: LEVEL4_VIEWPORT.width / 2,
  y: LEVEL4_VIEWPORT.height / 2 + 120,
};

const LEVEL4_COLOR_POOL: Record<BallColorKey, string> = {
  red: "#d23714",
  blue: "#255e7d",
  yellow: "#efb323",
};

const LEVEL4_RIGHT_BORDER_COLOR = "#2d2d39";
const LEVEL4_DARK_BALL_INDEX = 3;
const LEVEL4_FOURTH_BALL_COLOR = "#2d2d39";

export const LEVEL4_RESULT_CONFETTI = {
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
  palette: [LEVEL4_COLOR_POOL.red, LEVEL4_COLOR_POOL.blue, LEVEL4_COLOR_POOL.yellow],
  resultUiRevealDelayMs: 540,
  sizeMin: 12,
  sizeMax: 38,
  endSizeScale: 0.3,
  launcherInsetPx: 160,
  bottomOffsetPx: 10,
} as const;

const LEVEL4_HEAD_BALL_RADIUS = 34;
const LEVEL4_REFERENCE_RADII = [100, 86, 74, 64, 58] as const;
const LEVEL4_BALL_QUEUE_COLORS = ["red", "blue", "yellow", "red", "blue"] as const;
const LEVEL4_RADIUS_SCALE = LEVEL4_HEAD_BALL_RADIUS / LEVEL4_REFERENCE_RADII[0];

const LEVEL4_BALL_QUEUE_SPECS = LEVEL4_BALL_QUEUE_COLORS.map((colorKey, index) => ({
  colorKey,
  radius: Math.round(LEVEL4_REFERENCE_RADII[index] * LEVEL4_RADIUS_SCALE),
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
    id: `level4-border-${side}`,
    side,
    color,
    thickness,
    fullLength,
    active: true,
    bounds,
    segments: [{ start: 0, length: fullLength, active: true, color }],
  };
}

function createTopBorderSegments(fullLength: number) {
  const leftLength = Math.floor(fullLength / 2);
  const rightLength = fullLength - leftLength;

  return [
    {
      start: 0,
      length: leftLength,
      active: true,
      color: LEVEL4_COLOR_POOL.red,
    },
    {
      start: leftLength,
      length: rightLength,
      active: true,
      color: LEVEL4_COLOR_POOL.blue,
    },
  ];
}

function createLevel4BallQueueConfig(playfield: Playfield): BallQueue {
  const headAnchor = {
    x: playfield.center.x,
    y: playfield.rect.y + playfield.rect.height - playfield.borderThickness,
  };

  const balls = LEVEL4_BALL_QUEUE_SPECS.reduce<BallQueue["balls"]>((queue, spec, index) => {
    const previousBall = queue[index - 1] ?? null;
    const centerY = previousBall
      ? previousBall.position.y - previousBall.radius - spec.radius - LEVEL4_BALL_SURFACE_GAP
      : headAnchor.y - spec.radius;

    queue.push({
      id: `level4-ball-${index}`,
      order: index,
      colorKey: spec.colorKey,
      colorHex: index === LEVEL4_DARK_BALL_INDEX
        ? LEVEL4_FOURTH_BALL_COLOR
        : LEVEL4_COLOR_POOL[spec.colorKey],
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
    surfaceGap: LEVEL4_BALL_SURFACE_GAP,
    headAnchor,
    headIndex: 0,
    balls,
  };
}

const playfieldRect = createRectFromCenter(LEVEL4_PLAYFIELD_CENTER, LEVEL4_PLAYFIELD_SIZE);

const playfield: Playfield = {
  center: LEVEL4_PLAYFIELD_CENTER,
  size: LEVEL4_PLAYFIELD_SIZE,
  rect: playfieldRect,
  borderThickness: LEVEL4_BORDER_THICKNESS,
  fill: "transparent",
  borders: [
    {
      ...createBorderDefinition("top", LEVEL4_COLOR_POOL.red, LEVEL4_BORDER_THICKNESS, playfieldRect),
      segments: createTopBorderSegments(playfieldRect.width),
    },
    createBorderDefinition("right", LEVEL4_RIGHT_BORDER_COLOR, LEVEL4_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("bottom", LEVEL4_COLOR_POOL.blue, LEVEL4_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("left", LEVEL4_COLOR_POOL.yellow, LEVEL4_BORDER_THICKNESS, playfieldRect),
  ],
};

const playfieldBallQueue = createLevel4BallQueueConfig(playfield);

export const level4Config: LevelConfig = {
  id: "level4",
  name: "Level 4",
  nextStep: {
    label: "Level 5",
    targetLevelId: null,
    isAvailable: false,
  },
  selectionEntry: {
    label: "Level 4",
    isEnabled: true,
    isPlaceholder: false,
  },
  viewport: { ...LEVEL4_VIEWPORT },
  playfield,
  ballQueue: playfieldBallQueue,
  gameplay: {
    initialHp: LEVEL4_INITIAL_HP,
    input: {
      holdStillMaxMs: LEVEL4_POINTER_HOLD_STILL_MAX_MS,
      directionDebounceAxisDelta: LEVEL4_DIRECTION_DEBOUNCE_AXIS_DELTA,
      redirectCooldownMs: LEVEL4_REDIRECT_COOLDOWN_MS,
    },
    tuning: {
      swipeLaunch: {
        minSpeed: LEVEL4_SWIPE_LAUNCH_TUNING.minSpeed,
        maxSpeed: LEVEL4_SWIPE_LAUNCH_TUNING.maxSpeed,
        minSwipeDistance: LEVEL4_SWIPE_LAUNCH_TUNING.minSwipeDistance,
        maxSwipeDistance: LEVEL4_SWIPE_LAUNCH_TUNING.maxSwipeDistance,
      },
      projectile: {
        enabled: LEVEL4_PROJECTILE_TUNING.enabled,
        gravity: { ...LEVEL4_PROJECTILE_TUNING.gravity },
        maxSubstepMs: LEVEL4_PROJECTILE_TUNING.maxSubstepMs,
        bounceRestitution: LEVEL4_PROJECTILE_TUNING.bounceRestitution,
      },
      borderImpactShake: {
        enabled: LEVEL4_BORDER_IMPACT_SHAKE.enabled,
        light: { ...LEVEL4_BORDER_IMPACT_SHAKE.light },
        medium: { ...LEVEL4_BORDER_IMPACT_SHAKE.medium },
      },
      stageFrameMismatchGlow: {
        enabled: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.enabled,
        color: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.color,
        peakOpacity: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.peakOpacity,
        edgeWidthPx: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.edgeWidthPx,
        blurPx: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.blurPx,
        spreadPx: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.spreadPx,
        durationMs: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.durationMs,
        easing: LEVEL4_STAGE_FRAME_MISMATCH_GLOW.easing,
      },
      cameraFollow: {
        enabled: LEVEL4_CAMERA_FOLLOW.enabled,
        launchOnlyAfterStart: LEVEL4_CAMERA_FOLLOW.launchOnlyAfterStart,
        deadZonePx: LEVEL4_CAMERA_FOLLOW.deadZonePx,
        maxOffsetX: LEVEL4_CAMERA_FOLLOW.maxOffsetX,
        maxOffsetY: LEVEL4_CAMERA_FOLLOW.maxOffsetY,
        followLerp: LEVEL4_CAMERA_FOLLOW.followLerp,
        returnLerp: LEVEL4_CAMERA_FOLLOW.returnLerp,
      },
      borderImpactRing: {
        enabled: LEVEL4_BORDER_IMPACT_RING.enabled,
        strokeWidth: LEVEL4_BORDER_IMPACT_RING.strokeWidth,
        startScale: LEVEL4_BORDER_IMPACT_RING.startScale,
        endScale: LEVEL4_BORDER_IMPACT_RING.endScale,
        durationMs: LEVEL4_BORDER_IMPACT_RING.durationMs,
        easing: LEVEL4_BORDER_IMPACT_RING.easing,
        alphaFade: LEVEL4_BORDER_IMPACT_RING.alphaFade,
      },
      matchImpactParticles: {
        enabled: LEVEL4_MATCH_IMPACT_PARTICLES.enabled,
        particleCount: LEVEL4_MATCH_IMPACT_PARTICLES.particleCount,
        initialSpeedMin: LEVEL4_MATCH_IMPACT_PARTICLES.initialSpeedMin,
        initialSpeedMax: LEVEL4_MATCH_IMPACT_PARTICLES.initialSpeedMax,
        scatterAngleDeg: LEVEL4_MATCH_IMPACT_PARTICLES.scatterAngleDeg,
        lifetimeMs: LEVEL4_MATCH_IMPACT_PARTICLES.lifetimeMs,
        sizeMin: LEVEL4_MATCH_IMPACT_PARTICLES.sizeMin,
        sizeMax: LEVEL4_MATCH_IMPACT_PARTICLES.sizeMax,
        opacityCurve: LEVEL4_MATCH_IMPACT_PARTICLES.opacityCurve,
        useGravity: LEVEL4_MATCH_IMPACT_PARTICLES.useGravity,
        gravity: LEVEL4_MATCH_IMPACT_PARTICLES.gravity,
        useDamping: LEVEL4_MATCH_IMPACT_PARTICLES.useDamping,
        damping: LEVEL4_MATCH_IMPACT_PARTICLES.damping,
      },
      softBall: {
        enabled: LEVEL4_SOFT_BALL.enabled,
        headOnly: LEVEL4_SOFT_BALL.headOnly,
        maxSquash: LEVEL4_SOFT_BALL.maxSquash,
        maxStretch: LEVEL4_SOFT_BALL.maxStretch,
        reboundDurationMs: LEVEL4_SOFT_BALL.reboundDurationMs,
        overshoot: LEVEL4_SOFT_BALL.overshoot,
        jellyWobbleStrength: LEVEL4_SOFT_BALL.jellyWobbleStrength,
        secondaryBounceDurationMs: LEVEL4_SOFT_BALL.secondaryBounceDurationMs,
        minTriggerSpeed: LEVEL4_SOFT_BALL.minTriggerSpeed,
        launchIntensity: LEVEL4_SOFT_BALL.launchIntensity,
        redirectIntensity: LEVEL4_SOFT_BALL.redirectIntensity,
        impactIntensity: LEVEL4_SOFT_BALL.impactIntensity,
        specialBounceIntensity: LEVEL4_SOFT_BALL.specialBounceIntensity,
        followerScale: LEVEL4_SOFT_BALL.followerScale,
        wobbleCycles: LEVEL4_SOFT_BALL.wobbleCycles,
        wobbleRotationDeg: LEVEL4_SOFT_BALL.wobbleRotationDeg,
      },
      resultConfetti: {
        enabled: LEVEL4_RESULT_CONFETTI.enabled,
        launcherCount: LEVEL4_RESULT_CONFETTI.launcherCount,
        burstCount: LEVEL4_RESULT_CONFETTI.burstCount,
        speedMin: LEVEL4_RESULT_CONFETTI.speedMin,
        speedMax: LEVEL4_RESULT_CONFETTI.speedMax,
        spreadAngleDeg: LEVEL4_RESULT_CONFETTI.spreadAngleDeg,
        lifetimeMs: LEVEL4_RESULT_CONFETTI.lifetimeMs,
        gravity: LEVEL4_RESULT_CONFETTI.gravity,
        spinSpeedMin: LEVEL4_RESULT_CONFETTI.spinSpeedMin,
        spinSpeedMax: LEVEL4_RESULT_CONFETTI.spinSpeedMax,
        palette: [...LEVEL4_RESULT_CONFETTI.palette],
        resultUiRevealDelayMs: LEVEL4_RESULT_CONFETTI.resultUiRevealDelayMs,
        sizeMin: LEVEL4_RESULT_CONFETTI.sizeMin,
        sizeMax: LEVEL4_RESULT_CONFETTI.sizeMax,
        endSizeScale: LEVEL4_RESULT_CONFETTI.endSizeScale,
        launcherInsetPx: LEVEL4_RESULT_CONFETTI.launcherInsetPx,
        bottomOffsetPx: LEVEL4_RESULT_CONFETTI.bottomOffsetPx,
      },
    },
  },
  notes: {
    placement: "玩法区以舞台中心为基准，Y 轴下移 120px，保持居中略偏下。",
  },
};

export const LEVEL4_CONSTANTS = {
  viewport: LEVEL4_VIEWPORT,
  playfieldSize: LEVEL4_PLAYFIELD_SIZE,
  borderThickness: LEVEL4_BORDER_THICKNESS,
  ballSurfaceGap: LEVEL4_BALL_SURFACE_GAP,
  initialHp: LEVEL4_INITIAL_HP,
  pointerHoldStillMaxMs: LEVEL4_POINTER_HOLD_STILL_MAX_MS,
  directionDebounceAxisDelta: LEVEL4_DIRECTION_DEBOUNCE_AXIS_DELTA,
  redirectCooldownMs: LEVEL4_REDIRECT_COOLDOWN_MS,
  swipeLaunch: LEVEL4_SWIPE_LAUNCH_TUNING,
  projectile: LEVEL4_PROJECTILE_TUNING,
  borderImpactShake: LEVEL4_BORDER_IMPACT_SHAKE,
  cameraFollow: LEVEL4_CAMERA_FOLLOW,
  borderImpactRing: LEVEL4_BORDER_IMPACT_RING,
  matchImpactParticles: LEVEL4_MATCH_IMPACT_PARTICLES,
  softBall: LEVEL4_SOFT_BALL,
  resultConfetti: LEVEL4_RESULT_CONFETTI,
  colorPool: LEVEL4_COLOR_POOL,
} as const;
