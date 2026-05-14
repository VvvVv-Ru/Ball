import type { GameState } from "../types/game";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function resolveSwipeLaunchSpeed(gameState: Pick<GameState, "tuningConfig">, swipeDistance: number) {
  const { minSpeed, maxSpeed, minSwipeDistance, maxSwipeDistance } = gameState.tuningConfig.swipeLaunch;

  if (!Number.isFinite(swipeDistance) || swipeDistance < minSwipeDistance) {
    return null;
  }

  if (maxSwipeDistance <= minSwipeDistance) {
    return clamp(maxSpeed, minSpeed, maxSpeed);
  }

  const clampedDistance = clamp(swipeDistance, minSwipeDistance, maxSwipeDistance);
  const progress = (clampedDistance - minSwipeDistance) / (maxSwipeDistance - minSwipeDistance);

  return minSpeed + (maxSpeed - minSpeed) * progress;
}
