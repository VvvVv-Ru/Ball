export function createGameState(levelConfig) {
  const playfield = levelConfig.playfield
    ? {
        ...levelConfig.playfield,
        center: { ...levelConfig.playfield.center },
        rect: { ...levelConfig.playfield.rect },
        borders: levelConfig.playfield.borders.map((border) => ({
          ...border,
          bounds: { ...border.bounds },
          segments: border.segments.map((segment) => ({ ...segment })),
        })),
      }
    : null;

  return {
    levelId: levelConfig.id,
    viewport: { ...levelConfig.viewport },
    status: "idle",
    sceneMounted: false,
    world: {
      playfield,
    },
    systems: {
      input: {
        controller: null,
        queue: [],
      },
      motion: {
        entities: [],
      },
      collision: {
        colliders: [],
      },
      rules: {
        pipeline: [],
      },
      hud: {
        model: null,
      },
    },
  };
}
