import { renderLevel3BallQueue } from "./renderBallQueue.js";

function createBorderSegment(border, segment) {
  const segmentElement = document.createElement("div");
  const isHorizontal = border.side === "top" || border.side === "bottom";

  segmentElement.className = "playfield-border-segment";
  segmentElement.dataset.borderSide = border.side;
  segmentElement.dataset.borderId = border.id;
  segmentElement.style.background = border.color;
  segmentElement.style.left = isHorizontal ? `${segment.start}px` : "0px";
  segmentElement.style.top = isHorizontal ? "0px" : `${segment.start}px`;
  segmentElement.style.width = isHorizontal ? `${segment.length}px` : `${border.thickness}px`;
  segmentElement.style.height = isHorizontal ? `${border.thickness}px` : `${segment.length}px`;

  return segmentElement;
}

function createBorderElement(border, playfieldRect) {
  const borderElement = document.createElement("div");
  borderElement.className = "playfield-border";
  borderElement.dataset.borderSide = border.side;
  borderElement.dataset.borderId = border.id;
  borderElement.style.left = `${border.bounds.x - playfieldRect.x}px`;
  borderElement.style.top = `${border.bounds.y - playfieldRect.y}px`;
  borderElement.style.width = `${border.bounds.width}px`;
  borderElement.style.height = `${border.bounds.height}px`;

  border.segments
    .filter((segment) => segment.active)
    .forEach((segment) => borderElement.appendChild(createBorderSegment(border, segment)));

  return borderElement;
}

export function renderLevel3Playfield(playfieldConfig, ballQueueState) {
  const playfieldRoot = document.createElement("div");
  playfieldRoot.className = "playfield-root";
  playfieldRoot.dataset.playfieldSize = `${playfieldConfig.size}`;
  playfieldRoot.style.left = `${playfieldConfig.rect.x}px`;
  playfieldRoot.style.top = `${playfieldConfig.rect.y}px`;
  playfieldRoot.style.width = `${playfieldConfig.rect.width}px`;
  playfieldRoot.style.height = `${playfieldConfig.rect.height}px`;

  const playfieldSurface = document.createElement("div");
  playfieldSurface.className = "playfield-surface";
  playfieldSurface.style.background = playfieldConfig.fill;

  const borderLayer = document.createElement("div");
  borderLayer.className = "playfield-borders";

  const ballQueue = renderLevel3BallQueue(ballQueueState, playfieldConfig.rect);

  playfieldConfig.borders.forEach((border) => {
    borderLayer.appendChild(createBorderElement(border, playfieldConfig.rect));
  });

  playfieldRoot.append(playfieldSurface, ballQueue.element, borderLayer);

  return {
    element: playfieldRoot,
    borderLayer,
    ballQueueLayer: ballQueue.element,
  };
}
