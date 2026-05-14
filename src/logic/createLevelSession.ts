import type { BallColorKey, GameState, HeadBallIndex, LevelConfig } from "../types/game";

function getHeadColor(levelConfig: LevelConfig, headIndex: HeadBallIndex): BallColorKey | null {
  return levelConfig.ballQueue.balls[headIndex]?.colorKey ?? null;
}

export function createLevel3InitialGameState(levelConfig: LevelConfig): GameState {
  const balls = levelConfig.ballQueue.balls.map((ball) => ({
    ...ball,
    position: { ...ball.position },
  }));
  const headIndex = levelConfig.ballQueue.headIndex;
  const currentHeadColor = getHeadColor(levelConfig, headIndex);

  return {
    levelId: levelConfig.id,
    status: "ready",
    viewport: { ...levelConfig.viewport },
    playfield: {
      ...levelConfig.playfield,
      center: { ...levelConfig.playfield.center },
      rect: { ...levelConfig.playfield.rect },
      borders: levelConfig.playfield.borders.map((border) => ({
        ...border,
        bounds: { ...border.bounds },
        segments: border.segments.map((segment) => ({ ...segment })),
      })),
    },
    ballQueue: {
      ...levelConfig.ballQueue,
      headAnchor: { ...levelConfig.ballQueue.headAnchor },
      headIndex,
      balls,
    },
    headIndex,
    currentHeadColor,
    isInputLocked: false,
    initialSpeed: levelConfig.gameplay.initialSpeed,
    hp: levelConfig.gameplay.initialHp,
  };
}
