function cloneBallQueue(ballQueueConfig) {
  if (!ballQueueConfig) {
    return null;
  }

  const balls = ballQueueConfig.balls.map((ball) => ({
    ...ball,
    position: { ...ball.position },
  }));
  const headIndex = ballQueueConfig.headIndex ?? 0;
  const currentHead = balls[headIndex] ?? null;

  return {
    ...ballQueueConfig,
    headAnchor: { ...ballQueueConfig.headAnchor },
    headIndex,
    currentHeadColor: currentHead?.colorKey ?? null,
    balls,
  };
}

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
  const ballQueue = cloneBallQueue(levelConfig.ballQueue);

  return {
    levelId: levelConfig.id,
    viewport: { ...levelConfig.viewport },
    status: "idle",
    sceneMounted: false,
    world: {
      playfield,
      ballQueue,
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
