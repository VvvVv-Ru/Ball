import { level3Config } from "./level3";
import type { LevelConfig, LevelId } from "../types/game";

export const LEVELS: LevelConfig[] = [level3Config];

export function getLevelConfigById(levelId: LevelId | null) {
  return LEVELS.find((level) => level.id === levelId) ?? null;
}
