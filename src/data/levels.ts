import { level1Config } from "./level1";
import { level2Config } from "./level2";
import { level3Config } from "./level3";
import { level4Config } from "./level4";
import type { LevelConfig, LevelId } from "../types/game";

const LEVEL_IDS: LevelId[] = [
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
  "level6",
  "level7",
  "level8",
  "level9",
  "level10",
  "level11",
  "level12",
];

const INTEGRATED_LEVEL_IDS = new Set<LevelId>(["level1", "level2", "level3", "level4"]);

const LEVEL_BASE_CONFIGS: Partial<Record<LevelId, LevelConfig>> = {
  level1: level1Config,
  level2: level2Config,
  level3: level3Config,
  level4: level4Config,
};

function cloneLevelConfig(baseConfig: LevelConfig): LevelConfig {
  return {
    ...baseConfig,
    nextStep: { ...baseConfig.nextStep },
    selectionEntry: { ...baseConfig.selectionEntry },
    viewport: { ...baseConfig.viewport },
    playfield: {
      ...baseConfig.playfield,
      center: { ...baseConfig.playfield.center },
      rect: { ...baseConfig.playfield.rect },
      borders: baseConfig.playfield.borders.map((border) => ({
        ...border,
        bounds: { ...border.bounds },
        segments: border.segments.map((segment) => ({ ...segment })),
      })),
    },
    ballQueue: {
      ...baseConfig.ballQueue,
      headAnchor: { ...baseConfig.ballQueue.headAnchor },
      balls: baseConfig.ballQueue.balls.map((ball) => ({
        ...ball,
        position: { ...ball.position },
      })),
    },
    gameplay: {
      ...baseConfig.gameplay,
      input: { ...baseConfig.gameplay.input },
      tuning: {
        swipeLaunch: { ...baseConfig.gameplay.tuning.swipeLaunch },
        projectile: {
          ...baseConfig.gameplay.tuning.projectile,
          gravity: { ...baseConfig.gameplay.tuning.projectile.gravity },
        },
        borderImpactShake: {
          ...baseConfig.gameplay.tuning.borderImpactShake,
          light: { ...baseConfig.gameplay.tuning.borderImpactShake.light },
          medium: { ...baseConfig.gameplay.tuning.borderImpactShake.medium },
        },
        stageFrameMismatchGlow: { ...baseConfig.gameplay.tuning.stageFrameMismatchGlow },
        cameraFollow: { ...baseConfig.gameplay.tuning.cameraFollow },
        borderImpactRing: { ...baseConfig.gameplay.tuning.borderImpactRing },
        matchImpactParticles: { ...baseConfig.gameplay.tuning.matchImpactParticles },
        softBall: { ...baseConfig.gameplay.tuning.softBall },
        resultConfetti: {
          ...baseConfig.gameplay.tuning.resultConfetti,
          palette: [...baseConfig.gameplay.tuning.resultConfetti.palette],
        },
      },
    },
    notes: { ...baseConfig.notes },
  };
}

function createLevelConfig(levelId: LevelId, index: number): LevelConfig {
  const clonedConfig = cloneLevelConfig(LEVEL_BASE_CONFIGS[levelId] ?? level3Config);
  const nextLevelId = LEVEL_IDS[index + 1] ?? null;
  const levelNumber = index + 1;
  const isIntegrated = INTEGRATED_LEVEL_IDS.has(levelId);
  const isNextLevelIntegrated = nextLevelId ? INTEGRATED_LEVEL_IDS.has(nextLevelId) : false;

  return {
    ...clonedConfig,
    id: levelId,
    name: `Level ${levelNumber}`,
    nextStep: nextLevelId && isNextLevelIntegrated
      ? {
          label: `Level ${index + 2}`,
          targetLevelId: nextLevelId,
          isAvailable: true,
        }
      : {
          label: "再玩一次",
          targetLevelId: null,
          isAvailable: false,
        },
    selectionEntry: {
      label: String(levelNumber),
      isEnabled: isIntegrated,
      isPlaceholder: !isIntegrated,
    },
    playfield: {
      ...clonedConfig.playfield,
      borders: clonedConfig.playfield.borders.map((border) => ({
        ...border,
        id: `${levelId}-border-${border.side}`,
      })),
    },
    ballQueue: {
      ...clonedConfig.ballQueue,
      balls: clonedConfig.ballQueue.balls.map((ball, ballIndex) => ({
        ...ball,
        id: `${levelId}-ball-${ballIndex}`,
      })),
    },
    notes: {
      ...clonedConfig.notes,
      placement: isIntegrated
        ? clonedConfig.notes.placement
        : `${clonedConfig.notes.placement} 当前为占位关卡，暂复用基线玩法结构。`,
    },
  };
}

export const LEVELS: LevelConfig[] = LEVEL_IDS.map((levelId, index) => createLevelConfig(levelId, index));

export function getLevelConfigById(levelId: LevelId | null) {
  return LEVELS.find((level) => level.id === levelId) ?? null;
}
