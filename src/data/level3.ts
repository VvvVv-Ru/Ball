import type { BallColorKey, BallQueue, LevelConfig, Playfield, Rect, Vector2 } from "../types/game";

const LEVEL3_VIEWPORT = {
  width: 1080,
  height: 1920,
} as const;

const LEVEL3_PLAYFIELD_SIZE = 960;
const LEVEL3_BORDER_THICKNESS = 54;
const LEVEL3_BALL_SURFACE_GAP = 14;
const LEVEL3_INITIAL_HP = 3;
const LEVEL3_POINTER_HOLD_STILL_MAX_MS = 300;
const LEVEL3_DIRECTION_DEBOUNCE_AXIS_DELTA = 6;
const LEVEL3_REDIRECT_COOLDOWN_MS = 80;
const LEVEL3_SWIPE_LAUNCH_TUNING = {
  minSpeed: 1800,
  maxSpeed: 4000,
  minSwipeDistance: 10,
  maxSwipeDistance: 240,
} as const;
const LEVEL3_PROJECTILE_TUNING = {
  enabled: true,
  gravity: {
    x: 0,
    y: 1200,
  },
  maxSubstepMs: 8,
  bounceRestitution: 0.8,
} as const;
const LEVEL3_BORDER_IMPACT_SHAKE = {
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
const LEVEL3_CAMERA_FOLLOW = {
  enabled: true,
  launchOnlyAfterStart: true,
  deadZonePx: 99,
  maxOffsetX: 4,
  maxOffsetY: 3,
  followLerp: 0.04,
  returnLerp: 0.04,
} as const;
const LEVEL3_BORDER_IMPACT_RING = {
  enabled: true,
  strokeWidth: 0.4,
  startScale: 0.92,
  endScale: 15,
  durationMs: 660,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  alphaFade: true,
} as const;
const LEVEL3_MATCH_IMPACT_PARTICLES = {
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
const LEVEL3_SOFT_BALL = {
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
const LEVEL3_PLAYFIELD_CENTER: Vector2 = {
  x: LEVEL3_VIEWPORT.width / 2,
  y: LEVEL3_VIEWPORT.height / 2 + 120,
};

const LEVEL3_COLOR_POOL: Record<BallColorKey, string> = {
  red: "#d23714",
  blue: "#255e7d",
  yellow: "#efb323",
};

const LEVEL3_HEAD_BALL_RADIUS = 34;
const LEVEL3_REFERENCE_RADII = [100, 86, 74, 64] as const;
const LEVEL3_BALL_QUEUE_COLORS = ["red", "blue", "yellow", "red"] as const;
const LEVEL3_RADIUS_SCALE = LEVEL3_HEAD_BALL_RADIUS / LEVEL3_REFERENCE_RADII[0];

const LEVEL3_BALL_QUEUE_SPECS = LEVEL3_BALL_QUEUE_COLORS.map((colorKey, index) => ({
  colorKey,
  radius: Math.round(LEVEL3_REFERENCE_RADII[index] * LEVEL3_RADIUS_SCALE),
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
    id: `level3-border-${side}`,
    side,
    color,
    thickness,
    fullLength,
    active: true,
    bounds,
    segments: [{ start: 0, length: fullLength, active: true, color }],
  };
}

function createLevel3BallQueueConfig(playfield: Playfield): BallQueue {
  const headAnchor = {
    x: playfield.center.x,
    y: playfield.rect.y + playfield.rect.height - playfield.borderThickness,
  };

  const balls = LEVEL3_BALL_QUEUE_SPECS.reduce<BallQueue["balls"]>((queue, spec, index) => {
    const previousBall = queue[index - 1] ?? null;
    const centerY = previousBall
      ? previousBall.position.y - previousBall.radius - spec.radius - LEVEL3_BALL_SURFACE_GAP
      : headAnchor.y - spec.radius;

    queue.push({
      id: `level3-ball-${index}`,
      order: index,
      colorKey: spec.colorKey,
      colorHex: LEVEL3_COLOR_POOL[spec.colorKey],
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
    surfaceGap: LEVEL3_BALL_SURFACE_GAP,
    headAnchor,
    headIndex: 0,
    balls,
  };
}

const playfieldRect = createRectFromCenter(LEVEL3_PLAYFIELD_CENTER, LEVEL3_PLAYFIELD_SIZE);

const playfield: Playfield = {
  center: LEVEL3_PLAYFIELD_CENTER,
  size: LEVEL3_PLAYFIELD_SIZE,
  rect: playfieldRect,
  borderThickness: LEVEL3_BORDER_THICKNESS,
  fill: "transparent",
  borders: [
    createBorderDefinition("top", LEVEL3_COLOR_POOL.blue, LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("right", LEVEL3_COLOR_POOL.red, LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("bottom", LEVEL3_COLOR_POOL.red, LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("left", LEVEL3_COLOR_POOL.yellow, LEVEL3_BORDER_THICKNESS, playfieldRect),
  ],
};

const playfieldBallQueue = createLevel3BallQueueConfig(playfield);

export const level3Config: LevelConfig = {
  id: "level3",
  name: "Level 3 Demo",
  nextStep: {
    label: "Level 4",
    targetLevelId: null,
    isAvailable: false,
  },
  viewport: { ...LEVEL3_VIEWPORT },
  playfield,
  ballQueue: playfieldBallQueue,
  gameplay: {
    initialHp: LEVEL3_INITIAL_HP,
    input: {
      holdStillMaxMs: LEVEL3_POINTER_HOLD_STILL_MAX_MS,
      directionDebounceAxisDelta: LEVEL3_DIRECTION_DEBOUNCE_AXIS_DELTA,
      redirectCooldownMs: LEVEL3_REDIRECT_COOLDOWN_MS,
    },
    tuning: {
      swipeLaunch: {
        minSpeed: LEVEL3_SWIPE_LAUNCH_TUNING.minSpeed,
        maxSpeed: LEVEL3_SWIPE_LAUNCH_TUNING.maxSpeed,
        minSwipeDistance: LEVEL3_SWIPE_LAUNCH_TUNING.minSwipeDistance,
        maxSwipeDistance: LEVEL3_SWIPE_LAUNCH_TUNING.maxSwipeDistance,
      },
      projectile: {
        enabled: LEVEL3_PROJECTILE_TUNING.enabled,
        gravity: { ...LEVEL3_PROJECTILE_TUNING.gravity },
        maxSubstepMs: LEVEL3_PROJECTILE_TUNING.maxSubstepMs,
        bounceRestitution: LEVEL3_PROJECTILE_TUNING.bounceRestitution,
      },
      borderImpactShake: {
        enabled: LEVEL3_BORDER_IMPACT_SHAKE.enabled,
        light: { ...LEVEL3_BORDER_IMPACT_SHAKE.light },
        medium: { ...LEVEL3_BORDER_IMPACT_SHAKE.medium },
      },
      cameraFollow: {
        enabled: LEVEL3_CAMERA_FOLLOW.enabled,
        launchOnlyAfterStart: LEVEL3_CAMERA_FOLLOW.launchOnlyAfterStart,
        deadZonePx: LEVEL3_CAMERA_FOLLOW.deadZonePx,
        maxOffsetX: LEVEL3_CAMERA_FOLLOW.maxOffsetX,
        maxOffsetY: LEVEL3_CAMERA_FOLLOW.maxOffsetY,
        followLerp: LEVEL3_CAMERA_FOLLOW.followLerp,
        returnLerp: LEVEL3_CAMERA_FOLLOW.returnLerp,
      },
      borderImpactRing: {
        enabled: LEVEL3_BORDER_IMPACT_RING.enabled,
        strokeWidth: LEVEL3_BORDER_IMPACT_RING.strokeWidth,
        startScale: LEVEL3_BORDER_IMPACT_RING.startScale,
        endScale: LEVEL3_BORDER_IMPACT_RING.endScale,
        durationMs: LEVEL3_BORDER_IMPACT_RING.durationMs,
        easing: LEVEL3_BORDER_IMPACT_RING.easing,
        alphaFade: LEVEL3_BORDER_IMPACT_RING.alphaFade,
      },
      matchImpactParticles: {
        enabled: LEVEL3_MATCH_IMPACT_PARTICLES.enabled,
        particleCount: LEVEL3_MATCH_IMPACT_PARTICLES.particleCount,
        initialSpeedMin: LEVEL3_MATCH_IMPACT_PARTICLES.initialSpeedMin,
        initialSpeedMax: LEVEL3_MATCH_IMPACT_PARTICLES.initialSpeedMax,
        scatterAngleDeg: LEVEL3_MATCH_IMPACT_PARTICLES.scatterAngleDeg,
        lifetimeMs: LEVEL3_MATCH_IMPACT_PARTICLES.lifetimeMs,
        sizeMin: LEVEL3_MATCH_IMPACT_PARTICLES.sizeMin,
        sizeMax: LEVEL3_MATCH_IMPACT_PARTICLES.sizeMax,
        opacityCurve: LEVEL3_MATCH_IMPACT_PARTICLES.opacityCurve,
        useGravity: LEVEL3_MATCH_IMPACT_PARTICLES.useGravity,
        gravity: LEVEL3_MATCH_IMPACT_PARTICLES.gravity,
        useDamping: LEVEL3_MATCH_IMPACT_PARTICLES.useDamping,
        damping: LEVEL3_MATCH_IMPACT_PARTICLES.damping,
      },
      softBall: {
        enabled: LEVEL3_SOFT_BALL.enabled,
        headOnly: LEVEL3_SOFT_BALL.headOnly,
        maxSquash: LEVEL3_SOFT_BALL.maxSquash,
        maxStretch: LEVEL3_SOFT_BALL.maxStretch,
        reboundDurationMs: LEVEL3_SOFT_BALL.reboundDurationMs,
        overshoot: LEVEL3_SOFT_BALL.overshoot,
        jellyWobbleStrength: LEVEL3_SOFT_BALL.jellyWobbleStrength,
        secondaryBounceDurationMs: LEVEL3_SOFT_BALL.secondaryBounceDurationMs,
        minTriggerSpeed: LEVEL3_SOFT_BALL.minTriggerSpeed,
        launchIntensity: LEVEL3_SOFT_BALL.launchIntensity,
        redirectIntensity: LEVEL3_SOFT_BALL.redirectIntensity,
        impactIntensity: LEVEL3_SOFT_BALL.impactIntensity,
        specialBounceIntensity: LEVEL3_SOFT_BALL.specialBounceIntensity,
        followerScale: LEVEL3_SOFT_BALL.followerScale,
        wobbleCycles: LEVEL3_SOFT_BALL.wobbleCycles,
        wobbleRotationDeg: LEVEL3_SOFT_BALL.wobbleRotationDeg,
      },
    },
  },
  notes: {
    placement: "玩法区以舞台中心为基准，Y 轴下移 120px，保持居中略偏下。",
  },
};

export const LEVEL3_CONSTANTS = {
  viewport: LEVEL3_VIEWPORT,
  playfieldSize: LEVEL3_PLAYFIELD_SIZE,
  borderThickness: LEVEL3_BORDER_THICKNESS,
  ballSurfaceGap: LEVEL3_BALL_SURFACE_GAP,
  initialHp: LEVEL3_INITIAL_HP,
  pointerHoldStillMaxMs: LEVEL3_POINTER_HOLD_STILL_MAX_MS,
  directionDebounceAxisDelta: LEVEL3_DIRECTION_DEBOUNCE_AXIS_DELTA,
  redirectCooldownMs: LEVEL3_REDIRECT_COOLDOWN_MS,
  swipeLaunch: LEVEL3_SWIPE_LAUNCH_TUNING,
  projectile: LEVEL3_PROJECTILE_TUNING,
  borderImpactShake: LEVEL3_BORDER_IMPACT_SHAKE,
  cameraFollow: LEVEL3_CAMERA_FOLLOW,
  borderImpactRing: LEVEL3_BORDER_IMPACT_RING,
  matchImpactParticles: LEVEL3_MATCH_IMPACT_PARTICLES,
  softBall: LEVEL3_SOFT_BALL,
  colorPool: LEVEL3_COLOR_POOL,
} as const;
