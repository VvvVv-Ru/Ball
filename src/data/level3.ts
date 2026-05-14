import type { BallColorKey, BallQueue, LevelConfig, Playfield, Rect, Vector2 } from "../types/game";

const LEVEL3_VIEWPORT = {
  width: 1080,
  height: 1920,
} as const;

const LEVEL3_PLAYFIELD_SIZE = 960;
const LEVEL3_BORDER_THICKNESS = 54;
const LEVEL3_BALL_SURFACE_GAP = 14;
const LEVEL3_INITIAL_SPEED = 700;
const LEVEL3_INITIAL_HP = 3;
const LEVEL3_POINTER_TRIGGER_DISTANCE = {
  mouse: 8,
  touch: 10,
  pen: 10,
  unknown: 10,
} as const;
const LEVEL3_POINTER_HOLD_STILL_MAX_MS = 300;
const LEVEL3_DIRECTION_DEBOUNCE_AXIS_DELTA = 6;
const LEVEL3_REDIRECT_COOLDOWN_MS = 80;
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
  viewport: { ...LEVEL3_VIEWPORT },
  playfield,
  ballQueue: playfieldBallQueue,
  gameplay: {
    initialSpeed: LEVEL3_INITIAL_SPEED,
    initialHp: LEVEL3_INITIAL_HP,
    input: {
      triggerDistance: { ...LEVEL3_POINTER_TRIGGER_DISTANCE },
      holdStillMaxMs: LEVEL3_POINTER_HOLD_STILL_MAX_MS,
      directionDebounceAxisDelta: LEVEL3_DIRECTION_DEBOUNCE_AXIS_DELTA,
      redirectCooldownMs: LEVEL3_REDIRECT_COOLDOWN_MS,
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
  initialSpeed: LEVEL3_INITIAL_SPEED,
  initialHp: LEVEL3_INITIAL_HP,
  pointerTriggerDistance: LEVEL3_POINTER_TRIGGER_DISTANCE,
  pointerHoldStillMaxMs: LEVEL3_POINTER_HOLD_STILL_MAX_MS,
  directionDebounceAxisDelta: LEVEL3_DIRECTION_DEBOUNCE_AXIS_DELTA,
  redirectCooldownMs: LEVEL3_REDIRECT_COOLDOWN_MS,
  colorPool: LEVEL3_COLOR_POOL,
} as const;
