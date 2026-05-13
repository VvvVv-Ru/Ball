const LEVEL3_VIEWPORT = {
  width: 1080,
  height: 1920,
};

const LEVEL3_PLAYFIELD_SIZE = 800;
const LEVEL3_BORDER_THICKNESS = 30;
const LEVEL3_PLAYFIELD_CENTER = {
  x: LEVEL3_VIEWPORT.width / 2,
  y: LEVEL3_VIEWPORT.height / 2 + 120,
};

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

const playfieldRect = createRectFromCenter(LEVEL3_PLAYFIELD_CENTER, LEVEL3_PLAYFIELD_SIZE);

export const level3PlayfieldConfig = {
  center: LEVEL3_PLAYFIELD_CENTER,
  size: LEVEL3_PLAYFIELD_SIZE,
  rect: playfieldRect,
  borderThickness: LEVEL3_BORDER_THICKNESS,
  fill: "rgba(8, 13, 28, 0.62)",
  borders: [
    createBorderDefinition("top", "#255e7d", LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("right", "#d23714", LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("bottom", "#d23714", LEVEL3_BORDER_THICKNESS, playfieldRect),
    createBorderDefinition("left", "#efb323", LEVEL3_BORDER_THICKNESS, playfieldRect),
  ],
};

export const level3SceneNotes = {
  placement: "玩法区以舞台中心为基准，Y 轴下移 120px，保持居中略偏下。",
};
