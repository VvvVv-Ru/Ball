import { create } from "zustand";
import { LEVELS, getLevelConfigById } from "../data/levels";
import { createLevel3InitialGameState } from "../logic/createLevelSession";
import type { Border, BorderSegment, BorderUpdatePatch, GameStoreSelectors, GameStoreState, HeadBallIndex, Scene } from "../types/game";

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

    set({
      selectedLevelId: levelConfig.id,
      currentLevelId: levelConfig.id,
      gameState: createLevel3InitialGameState(levelConfig),
      borderEditor: initialBorderEditorState,
    });
  },
  resetLevel3State: () => {
    const levelConfig = getLevelConfigById("level3");

    if (!levelConfig) {
      return;
    }

    set({
      selectedLevelId: levelConfig.id,
      currentLevelId: levelConfig.id,
      gameState: createLevel3InitialGameState(levelConfig),
      borderEditor: initialBorderEditorState,
    });
  },
  setHeadIndex: (headIndex: HeadBallIndex) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      const nextHeadBall = state.gameState.ballQueue.balls[headIndex] ?? null;

      return {
        gameState: {
          ...state.gameState,
          headIndex,
          currentHeadColor: nextHeadBall?.colorKey ?? null,
          ballQueue: {
            ...state.gameState.ballQueue,
            headIndex,
          },
        },
      };
    });
  },
  setInputLocked: (isLocked: boolean) => {
    set((state) => {
      if (!state.gameState) {
        return state;
      }

      return {
        gameState: {
          ...state.gameState,
          isInputLocked: isLocked,
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

    set({
      scene: "playing",
      currentLevelId: levelConfig.id,
      gameState: createLevel3InitialGameState(levelConfig),
      borderEditor: initialBorderEditorState,
    });
  },
  backToMenu: () => {
    set({
      scene: "menu",
      currentLevelId: null,
      gameState: null,
      borderEditor: initialBorderEditorState,
    });
  },
  backToSelect: () => {
    set({
      scene: "select",
      currentLevelId: null,
      gameState: null,
      borderEditor: initialBorderEditorState,
    });
  },
}));

export const gameStoreSelectors: GameStoreSelectors = {
  selectScene: (state) => state.scene,
  selectCurrentLevelId: (state) => state.currentLevelId,
  selectGameState: (state) => state.gameState,
  selectBallQueue: (state) => state.gameState?.ballQueue ?? null,
  selectBorders: (state) => state.gameState?.playfield.borders ?? [],
  selectBorderEditor: (state) => state.borderEditor,
  selectHeadIndex: (state) => state.gameState?.headIndex ?? null,
  selectCurrentHeadColor: (state) => state.gameState?.currentHeadColor ?? null,
  selectIsInputLocked: (state) => state.gameState?.isInputLocked ?? false,
};
