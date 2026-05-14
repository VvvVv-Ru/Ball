import type {
  GameState,
  InputDirection,
  PointerGesturePayload,
  PointerGestureState,
  PointerInputSource,
  Vector2,
} from "../types/game";

function clonePoint(point: Vector2 | null) {
  return point ? { ...point } : null;
}

function getTriggerDistance(gameState: GameState, pointerType: PointerInputSource) {
  return gameState.inputConfig.triggerDistance[pointerType] ?? gameState.inputConfig.triggerDistance.unknown;
}

function createPointerState(gameState: GameState, partial: Partial<PointerGestureState>) {
  return {
    ...gameState.input.pointer,
    ...partial,
  };
}

function withPointerState(gameState: GameState, pointer: PointerGestureState): GameState {
  return {
    ...gameState,
    input: {
      ...gameState.input,
      pointer,
    },
  };
}

function getDistance(start: Vector2, current: Vector2) {
  return Math.hypot(current.x - start.x, current.y - start.y);
}

function getDirectionFromDelta(start: Vector2, current: Vector2): InputDirection {
  const deltaX = current.x - start.x;
  const deltaY = current.y - start.y;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? "right" : "left";
  }

  return deltaY >= 0 ? "down" : "up";
}

function getStableDirectionFromDelta(gameState: GameState, start: Vector2, current: Vector2): InputDirection {
  const deltaX = current.x - start.x;
  const deltaY = current.y - start.y;
  const axisDelta = Math.abs(Math.abs(deltaX) - Math.abs(deltaY));
  const fallbackDirection = gameState.motion.lastAcceptedDirection ?? gameState.motion.currentDirection ?? gameState.input.lastInputDirection;

  if (axisDelta < gameState.inputConfig.directionDebounceAxisDelta && fallbackDirection) {
    return fallbackDirection;
  }

  return getDirectionFromDelta(start, current);
}

export function startPointerGestureState(gameState: GameState, payload: PointerGesturePayload): GameState {
  const currentThreshold = getTriggerDistance(gameState, payload.pointerType);

  return withPointerState(
    gameState,
    createPointerState(gameState, {
      isPointerActive: true,
      pointerStart: clonePoint(payload.position),
      lastPointer: clonePoint(payload.position),
      pointerType: payload.pointerType,
      pointerStartedAt: payload.at,
      currentDistance: 0,
      currentThreshold,
      hasReachedThreshold: false,
      hasTriggeredInCurrentGesture: false,
    }),
  );
}

export function updatePointerGestureState(
  gameState: GameState,
  payload: PointerGesturePayload,
): { nextState: GameState; triggeredDirection: InputDirection | null } {
  const pointer = gameState.input.pointer;

  if (!pointer.isPointerActive || !pointer.pointerStart) {
    return { nextState: gameState, triggeredDirection: null };
  }

  const currentThreshold = pointer.currentThreshold ?? getTriggerDistance(gameState, payload.pointerType);
  const currentDistance = getDistance(pointer.pointerStart, payload.position);
  const hasReachedThreshold = currentDistance >= currentThreshold;
  const shouldTrigger = hasReachedThreshold && !pointer.hasTriggeredInCurrentGesture && !gameState.isInputLocked;
  const triggeredDirection = shouldTrigger
    ? getStableDirectionFromDelta(gameState, pointer.pointerStart, payload.position)
    : null;

  return {
    nextState: withPointerState(
      gameState,
      createPointerState(gameState, {
        lastPointer: clonePoint(payload.position),
        pointerType: payload.pointerType,
        currentDistance,
        currentThreshold,
        hasReachedThreshold,
        hasTriggeredInCurrentGesture: pointer.hasTriggeredInCurrentGesture || shouldTrigger,
      }),
    ),
    triggeredDirection,
  };
}

export function endPointerGestureState(gameState: GameState, payload: PointerGesturePayload): GameState {
  const pointer = gameState.input.pointer;

  if (!pointer.isPointerActive || !pointer.pointerStart) {
    return gameState;
  }

  const currentThreshold = pointer.currentThreshold ?? getTriggerDistance(gameState, payload.pointerType);
  const currentDistance = getDistance(pointer.pointerStart, payload.position);
  const elapsedMs = pointer.pointerStartedAt ? payload.at - pointer.pointerStartedAt : 0;
  const hasReachedThreshold = currentDistance >= currentThreshold;
  const isSmallLongPress = elapsedMs > gameState.inputConfig.holdStillMaxMs && currentDistance < currentThreshold;

  return withPointerState(
    gameState,
    createPointerState(gameState, {
      isPointerActive: false,
      lastPointer: clonePoint(payload.position),
      pointerType: payload.pointerType,
      currentDistance,
      currentThreshold,
      hasReachedThreshold,
      hasTriggeredInCurrentGesture: isSmallLongPress ? false : pointer.hasTriggeredInCurrentGesture,
    }),
  );
}

export function cancelPointerGestureState(gameState: GameState): GameState {
  return withPointerState(
    gameState,
    createPointerState(gameState, {
      isPointerActive: false,
      pointerStartedAt: null,
    }),
  );
}
