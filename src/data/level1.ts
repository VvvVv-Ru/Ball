import { level3Config } from "./level3";
import type { LevelConfig } from "../types/game";

const LEVEL1_RED = "#d23714";
const LEVEL1_BLUE = "#255e7d";

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

const clonedConfig = cloneLevelConfig(level3Config);
const [level1HeadBall, level1SecondBall] = clonedConfig.ballQueue.balls;

// Level 1 owns its own config copy so future edits here do not leak into Level 3.
export const level1Config: LevelConfig = {
  ...clonedConfig,
  id: "level1",
  name: "Level 1",
  nextStep: {
    label: "再玩一次",
    targetLevelId: null,
    isAvailable: false,
  },
  selectionEntry: {
    label: "Level 1",
    isEnabled: true,
    isPlaceholder: false,
  },
  playfield: {
    ...clonedConfig.playfield,
    borders: clonedConfig.playfield.borders.map((border) => {
      const color = border.side === "top" || border.side === "left" ? LEVEL1_BLUE : LEVEL1_RED;

      return {
        ...border,
        id: `level1-border-${border.side}`,
        color,
        segments: border.segments.map((segment) => ({
          ...segment,
          color,
        })),
      };
    }),
  },
  ballQueue: {
    ...clonedConfig.ballQueue,
    balls: [
      {
        ...level1HeadBall,
        id: "level1-ball-0",
        order: 0,
        colorKey: "blue",
        colorHex: LEVEL1_BLUE,
      },
      {
        ...level1SecondBall,
        id: "level1-ball-1",
        order: 1,
        colorKey: "red",
        colorHex: LEVEL1_RED,
      },
    ],
  },
  notes: {
    placement: `${clonedConfig.notes.placement} 第一关为双色教学关：蓝球先手、红球第二手；同色命中时对应的两条同色边会立即一起消失。`,
  },
};
