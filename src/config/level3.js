const LEVEL3_VIEWPORT = {
  width: 1080,
  height: 1920,
};

const LEVEL3_PLAYFIELD_SIZE = 800;
const LEVEL3_BORDER_THICKNESS = 30;
const LEVEL3_BALL_SURFACE_GAP = 14;
const LEVEL3_PLAYFIELD_CENTER = {
  x: LEVEL3_VIEWPORT.width / 2,
  y: LEVEL3_VIEWPORT.height / 2 + 120,
};

const LEVEL3_COLOR_POOL = {
  red: "#d23714",
  blue: "#255e7d",
  yellow: "#efb323",
};

const LEVEL3_HEAD_BALL_RADIUS = 34;
const LEVEL3_REFERENCE_RADII = [100, 86, 74, 64];
const LEVEL3_BALL_QUEUE_COLORS = ["red", "blue", "yellow", "red"];
const LEVEL3_RADIUS_SCALE = LEVEL3_HEAD_BALL_RADIUS / LEVEL3_REFERENCE_RADII[0];

const LEVEL3_BALL_QUEUE_SPECS = LEVEL3_BALL_QUEUE_COLORS.map((colorKey, index) => ({
  colorKey,
  radius: Math.round(LEVEL3_REFERENCE_RADII[index] * LEVEL3_RADIUS_SCALE),
}));

function createRectFromCenter(center, size) {
  return {
    x: center.x - size / 2,
    y: center.y - size / 2,
    width: size,
    height: size,
  };
}

function createBorderDefinition(side, color, thickness, playfieldRect) {
  const isHorizontal = side === "top" || side === "bottom";
  const fullLength = isHorizontal ? playfieldRect.width : playfieldRect.height;

  let bounds;

  if (side === "top") {
    bounds = {
      x: playfieldRect.x,
      y: playfieldRect.y,
      width: playfieldRect.width,
      height: thickness,
    };
  }

  if (side === "right") {
    bounds = {
      x: playfieldRect.x + playfieldRect.width - thickness,
      y: playfieldRect.y,
      width: thickness,
      height: playfieldRect.height,
    };
  }

  if (side === "bottom") {
    bounds = {
      x: playfieldRect.x,
      y: playfieldRect.y + playfieldRect.height - thickness,
      width: playfieldRect.width,
      height: thickness,
    };
  }

  if (side === "left") {
    bounds = {
      x: playfieldRect.x,
      y: playfieldRect.y,
      width: thickness,
      height: playfieldRect.height,
    };
  }

  return {
    id: `level3-border-${side}`,
    side,
    color,
    thickness,
    fullLength,
    active: true,
    bounds,
    segments: [
      {
        start: 0,
        length: fullLength,
        active: true,
      },
    ],
  };
}

function createLevel3BallQueueConfig(playfieldConfig) {
  const headAnchor = {
    x: playfieldConfig.center.x,
    y: playfieldConfig.rect.y + playfieldConfig.rect.height - playfieldConfig.borderThickness,
  };

  const balls = [];

  LEVEL3_BALL_QUEUE_SPECS.forEach((spec, index) => {
    const previousBall = balls[index - 1] ?? null;
    const centerY = previousBall
      ? previousBall.position.y - previousBall.radius - spec.radius - LEVEL3_BALL_SURFACE_GAP
      : headAnchor.y - spec.radius;

    balls.push({
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
  });

  return {
    axis: "vertical-up",
    surfaceGap: LEVEL3_BALL_SURFACE_GAP,
    headAnchor,
    headIndex: 0,
    balls,
  };
}

const playfieldRect = createRectFromCenter(LEVEL3_PLAYFIELD_CENTER, LEVEL3_PLAYFIELD_SIZE);

export const level3PlayfieldConfig = {
  center: LEVEL3_PLAYFIELD_CENTER,
  size: LEVEL3_PLAYFIELD_SIZE,
  rect: playfieldRect,
  borderThickness: LEVEL3_BORDER_THICKNESS,
  fill: "transparent",
  borders: [
    createBorderDefinition("top", "#255e7d", LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("right", "#d23714", LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("bottom", "#d23714", LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("left", "#efb323", LEVEL3_BORDER_THICKNESS, playfieldRect),
  ],
};

export const level3BallQueueConfig = createLevel3BallQueueConfig(level3PlayfieldConfig);

export const level3SceneNotes = {
  placement: "玩法区以舞台中心为基准，Y 轴下移 120px，保持居中略偏下。",
};
