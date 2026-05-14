import { create } from "zustand";
import { LEVELS, getLevelConfigById } from "../data/levels";
import { applyInputIntent } from "../logic/applyInputIntent";
import { advanceHeadMotion, applyLaunchMotion } from "../logic/applyLaunchMotion";
import { createLevel3InitialGameState } from "../logic/createLevelSession";
import {
  cancelPointerGestureState,
  endPointerGestureState,
  startPointerGestureState,
  updatePointerGestureState,
} from "../logic/pointerGesture";
import { UI_EVENT_NAMES } from "../types/uiContract";
import { gameUiEventBus } from "./gameUiEventBus";
import { selectUiStateContract } from "./uiSelectors";
import type {
  Border,
  BorderSegment,
  BorderUpdatePatch,
  GameStoreSelectors,
  GameStoreState,
  HeadBallIndex,
  InputDirection,
  PointerGesturePayload,
  Scene,
} from "../types/game";

function emitGameStateChanged(scene: Scene, levelId: string | null, gameState: GameStoreState["gameState"]) {
  const contractState = selectUiStateContract({
    scene,
    levels: [],
    selectedLevelId: null,
    currentLevelId: levelId as GameStoreState["currentLevelId"],
    gameState,
    borderEditor: { isOpen: false, selectedBorderId: null },
    setScene: () => undefined,
    selectLevel: () => undefined,
    loadLevel3Config: () => undefined,
    resetLevel3State: () => undefined,
    applyInput: () => undefined,
    tickMotion: () => undefined,
    startPointerGesture: () => undefined,
    updatePointerGesture: () => undefined,
    endPointerGesture: () => undefined,
    cancelPointerGesture: () => undefined,
    setHeadIndex: () => undefined,
    setInputLocked: () => undefined,
    toggleBorderEditor: () => undefined,
    selectEditorBorder: () => undefined,
    updateEditorBorder: () => undefined,
    setEditorBorderSegmentCount: () => undefined,
    updateEditorBorderSegmentColor: () => undefined,
    startSelectedLevel: () => undefined,
    backToMenu: () => undefined,
    backToSelect: () => undefined,
  });

  gameUiEventBus.emit(UI_EVENT_NAMES.GAME_STATE_CHANGED, {
    scene,
    levelId,
    levelState: contractState.levelState,
    currentHeadColor: contractState.currentHeadColor,
    remainingBalls: contractState.remainingBalls,
    remainingTargets: contractState.remainingTargets,
  });
}

const initialSelectedLevelId = LEVELS[0]?.id ?? null;
const initialBorderEditorState = {
  isOpen: false,
  selectedBorderId: null,
} as const;

function roundIfFinite(value: number) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function clampPositiveInt(value: number, minimum = 1) {
  const rounded = roundIfFinite(value);

  if (rounded === null) {
    return null;
  }

  return Math.max(minimum, rounded);
}

function getBorderFullLength(border: Pick<Border, "side" | "bounds">) {
  return border.side === "top" || border.side === "bottom" ? border.bounds.width : border.bounds.height;
}

function getSafeSegmentCount(segmentCount: number, fullLength: number) {
  const nextSegmentCount = clampPositiveInt(segmentCount);
  const maxSegmentCount = Math.max(1, Math.round(fullLength));

  if (nextSegmentCount === null) {
    return null;
  }

  return Math.min(nextSegmentCount, maxSegmentCount);
}

function createEvenSegments(fullLength: number, segmentCount: number, existingSegments: BorderSegment[], fallbackColor: string) {
  const safeSegmentCount = getSafeSegmentCount(segmentCount, fullLength);

  if (safeSegmentCount === null) {
    return existingSegments;
  }

  const baseLength = Math.floor(fullLength / safeSegmentCount);
  const remainder = fullLength % safeSegmentCount;
  const nextSegments: BorderSegment[] = [];
  let start = 0;

  for (let index = 0; index < safeSegmentCount; index += 1) {
    const length = baseLength + (index < remainder ? 1 : 0);

    nextSegments.push({
      start,
      length,
      active: true,
      color: existingSegments[index]?.color ?? fallbackColor,
    });

    start += length;
  }

  return nextSegments;
}

function updateBorderCollection(borders: Border[], borderId: string, updater: (border: Border) => Border) {
  let changed = false;

  const nextBorders = borders.map((border) => {
    if (border.id !== borderId) {
      return border;
    }

    changed = true;
    return updater(border);
  });

  return changed ? nextBorders : null;
}

function getNextSelectedBorderId(selectedBorderId: string | null, borders: Border[]) {
  if (selectedBorderId && borders.some((border) => border.id === selectedBorderId)) {
    return selectedBorderId;
  }

  return borders[0]?.id ?? null;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  scene: "menu",
  levels: LEVELS,
  selectedLevelId: initialSelectedLevelId,
  currentLevelId: null,
  gameState: null,
  borderEditor: initialBorderEditorState,
  setScene: (scene: Scene) => {
    set({ scene });
  },
  selectLevel: (levelId) => {
    set({ selectedLevelId: levelId });
  },
  loadLevel3Config: () => {
    const levelConfig = getLevelConfigById("level3");

    if (!levelConfig) {
      return;
    }

    const nextGameState = createLevel3InitialGameState(levelConfig);

    set({
      selectedLevelId: levelConfig.id,
      currentLevelId: levelConfig.id,
      gameState: nextGameState,
      borderEditor: initialBorderEditorState,
    });

    emitGameStateChanged(get().scene, levelConfig.id, nextGameState);
  },
  resetLevel3State: () => {
    const levelConfig = getLevelConfigById("level3");

    if (!levelConfig) {
      return;
    }

    const nextGameState = createLevel3InitialGameState(levelConfig);

    set({
      selectedLevelId: levelConfig.id,
      currentLevelId: levelConfig.id,
      gameState: nextGameState,
      borderEditor: initialBorderEditorState,
    });

    emitGameStateChanged(get().scene, levelConfig.id, nextGameState);
  },
  applyInput: (direction: InputDirection) => {
    const occurredAt = performance.now();

    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextGameState = applyLaunchMotion(applyInputIntent(state.gameState, direction, occurredAt), direction, occurredAt);

      gameUiEventBus.emit(UI_EVENT_NAMES.INPUT_AIM_UPDATE, {
        direction,
        vector: nextGameState.input.lastInputVector,
        source: "keyboard",
        occurredAt,
      });
      emitGameStateChanged(state.scene, state.currentLevelId, nextGameState);

      return {
        gameState: nextGameState,
      };
    });
  },
  tickMotion: (now: number) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const { nextGameState, collision } = advanceHeadMotion(state.gameState, now);

      if (nextGameState === state.gameState) {
        return state;
      }

      if (collision?.type === "mismatch" && collision.borderColor && collision.headColor) {
        gameUiEventBus.emit(UI_EVENT_NAMES.ON_COLLISION_MISMATCH, {
          borderId: collision.borderId,
          expectedColor: collision.borderColor,
          actualColor: collision.headColor,
          headIndex: state.gameState.headIndex,
        });
      }

      emitGameStateChanged(state.scene, state.currentLevelId, nextGameState);

      return {
        gameState: nextGameState,
      };
    });
  },
  startPointerGesture: (payload: PointerGesturePayload) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextGameState = startPointerGestureState(state.gameState, payload);

      return {
        gameState: nextGameState,
      };
    });
  },
  updatePointerGesture: (payload: PointerGesturePayload) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const { nextState, triggeredDirection } = updatePointerGestureState(state.gameState, payload);

      const nextGameState = triggeredDirection
        ? applyLaunchMotion(applyInputIntent(nextState, triggeredDirection, payload.at), triggeredDirection, payload.at)
        : nextState;

      if (triggeredDirection) {
        gameUiEventBus.emit(UI_EVENT_NAMES.INPUT_AIM_UPDATE, {
          direction: triggeredDirection,
          vector: nextGameState.input.lastInputVector,
          source: payload.pointerType,
          occurredAt: payload.at,
        });
      }

      emitGameStateChanged(state.scene, state.currentLevelId, nextGameState);

      return {
        gameState: nextGameState,
      };
    });
  },
  endPointerGesture: (payload: PointerGesturePayload) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextGameState = endPointerGestureState(state.gameState, payload);

      return {
        gameState: nextGameState,
      };
    });
  },
  cancelPointerGesture: () => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextGameState = cancelPointerGestureState(state.gameState);

      return {
        gameState: nextGameState,
      };
    });
  },
  setHeadIndex: (headIndex: HeadBallIndex) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextHeadBall = state.gameState.ballQueue.balls[headIndex] ?? null;

      const nextGameState = {
        ...state.gameState,
        headIndex,
        currentHeadColor: nextHeadBall?.colorKey ?? null,
        ballQueue: {
          ...state.gameState.ballQueue,
          headIndex,
        },
      };

      emitGameStateChanged(state.scene, state.currentLevelId, nextGameState);

      return {
        gameState: {
          ...nextGameState,
        },
      };
    });
  },
  setInputLocked: (isLocked: boolean) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextGameState = {
        ...state.gameState,
        isInputLocked: isLocked,
      };

      emitGameStateChanged(state.scene, state.currentLevelId, nextGameState);

      return {
        gameState: {
          ...nextGameState,
        },
      };
    });
  },
  toggleBorderEditor: () => {
    set((state) => {
      const shouldOpen = !state.borderEditor.isOpen;
      const borders = state.gameState?.playfield.borders ?? [];

      return {
        borderEditor: {
          isOpen: shouldOpen,
          selectedBorderId: shouldOpen ? getNextSelectedBorderId(state.borderEditor.selectedBorderId, borders) : state.borderEditor.selectedBorderId,
        },
      };
    });
  },
  selectEditorBorder: (borderId: string) => {
    set((state) => {
      const borders = state.gameState?.playfield.borders ?? [];

      if (!borders.some((border) => border.id === borderId)) {
        return state;
      }

      return {
        borderEditor: {
          ...state.borderEditor,
          selectedBorderId: borderId,
        },
      };
    });
  },
  updateEditorBorder: (borderId: string, patch: BorderUpdatePatch) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextBorders = updateBorderCollection(state.gameState.playfield.borders, borderId, (border) => {
        const nextBounds = { ...border.bounds };
        const nextX = patch.bounds?.x !== undefined ? roundIfFinite(patch.bounds.x) : null;
        const nextY = patch.bounds?.y !== undefined ? roundIfFinite(patch.bounds.y) : null;
        const nextWidth = patch.bounds?.width !== undefined ? clampPositiveInt(patch.bounds.width) : null;
        const nextHeight = patch.bounds?.height !== undefined ? clampPositiveInt(patch.bounds.height) : null;

        if (nextX !== null) {
          nextBounds.x = nextX;
        }

        if (nextY !== null) {
          nextBounds.y = nextY;
        }

        if (nextWidth !== null) {
          nextBounds.width = nextWidth;
        }

        if (nextHeight !== null) {
          nextBounds.height = nextHeight;
        }

        const nextThickness = patch.thickness !== undefined ? clampPositiveInt(patch.thickness) ?? border.thickness : border.thickness;
        const nextColor = patch.color ?? border.color;
        const nextFullLength = getBorderFullLength({ side: border.side, bounds: nextBounds });
        const nextSegments = nextFullLength === border.fullLength
          ? border.segments
          : createEvenSegments(nextFullLength, border.segments.length, border.segments, nextColor);

        return {
          ...border,
          bounds: nextBounds,
          color: nextColor,
          thickness: nextThickness,
          fullLength: nextFullLength,
          segments: nextSegments,
        };
      });

      if (!nextBorders) {
        return state;
      }

      return {
        gameState: {
          ...state.gameState,
          playfield: {
            ...state.gameState.playfield,
            borders: nextBorders,
          },
        },
      };
    });
  },
  setEditorBorderSegmentCount: (borderId: string, segmentCount: number) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextBorders = updateBorderCollection(state.gameState.playfield.borders, borderId, (border) => ({
        ...border,
        segments: createEvenSegments(border.fullLength, segmentCount, border.segments, border.color),
      }));

      if (!nextBorders) {
        return state;
      }

      return {
        gameState: {
          ...state.gameState,
          playfield: {
            ...state.gameState.playfield,
            borders: nextBorders,
          },
        },
      };
    });
  },
  updateEditorBorderSegmentColor: (borderId: string, segmentIndex: number, color: string) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextBorders = updateBorderCollection(state.gameState.playfield.borders, borderId, (border) => {
        if (!border.segments[segmentIndex]) {
          return border;
        }

        return {
          ...border,
          segments: border.segments.map((segment, index) => (
            index === segmentIndex
              ? {
                  ...segment,
                  color,
                }
              : segment
          )),
        };
      });

      if (!nextBorders) {
        return state;
      }

      return {
        gameState: {
          ...state.gameState,
          playfield: {
            ...state.gameState.playfield,
            borders: nextBorders,
          },
        },
      };
    });
  },
  startSelectedLevel: () => {
    const levelConfig = getLevelConfigById(get().selectedLevelId);

    if (!levelConfig) {
      return;
    }

    const nextGameState = createLevel3InitialGameState(levelConfig);

    set({
      scene: "playing",
      currentLevelId: levelConfig.id,
      gameState: nextGameState,
      borderEditor: initialBorderEditorState,
    });

    emitGameStateChanged("playing", levelConfig.id, nextGameState);
  },
  backToMenu: () => {
    set({
      scene: "menu",
      currentLevelId: null,
      gameState: null,
      borderEditor: initialBorderEditorState,
    });

    emitGameStateChanged("menu", null, null);
  },
  backToSelect: () => {
    set({
      scene: "select",
      currentLevelId: null,
      gameState: null,
      borderEditor: initialBorderEditorState,
    });

    emitGameStateChanged("select", null, null);
  },
}));

export const gameStoreSelectors: GameStoreSelectors = {
  selectScene: (state) => state.scene,
  selectCurrentLevelId: (state) => state.currentLevelId,
  selectGameState: (state) => state.gameState,
  selectBallQueue: (state) => state.gameState?.ballQueue ?? null,
  selectBorders: (state) => state.gameState?.playfield.borders ?? [],
  selectBorderEditor: (state) => state.borderEditor,
  selectInputState: (state) => state.gameState?.input ?? null,
  selectMotionState: (state) => state.gameState?.motion ?? null,
  selectPointerGesture: (state) => state.gameState?.input.pointer ?? null,
  selectHeadIndex: (state) => state.gameState?.headIndex ?? null,
  selectCurrentHeadColor: (state) => state.gameState?.currentHeadColor ?? null,
  selectIsInputLocked: (state) => state.gameState?.isInputLocked ?? false,
};
