import { level3PlayfieldConfig, level3SceneNotes } from "./level3.js";

export const LEVEL_CONFIGS = {
  level3: {
    id: "level3",
    name: "Level 3 Static Arena",
    viewport: {
      width: 1080,
      height: 1920,
    },
    systems: {
      input: {
        enabled: false,
        adapter: null,
      },
      motion: {
        enabled: false,
      },
      collision: {
        enabled: false,
      },
      rules: {
        enabled: false,
      },
      hud: {
        enabled: false,
      },
    },
    layers: {
      game: "game-layer",
      ui: "ui-layer",
    },
    playfield: level3PlayfieldConfig,
    notes: level3SceneNotes,
  },
};

export function getLevelConfig(levelId) {
  return LEVEL_CONFIGS[levelId] ?? null;
}
