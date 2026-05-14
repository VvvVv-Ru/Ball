import { useEffect, useState } from "react";
import type { CameraFollowConfig, CameraFollowVisualState, GameState } from "../types/game";

const ZERO_CAMERA_STATE: CameraFollowVisualState = {
  offsetX: 0,
  offsetY: 0,
  targetX: 0,
  targetY: 0,
  isActive: false,
};

const SETTLE_EPSILON = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(current: number, target: number, factor: number) {
  return current + (target - current) * clamp(factor, 0, 1);
}

function resolveAxisTarget(delta: number, deadZonePx: number) {
  const absDelta = Math.abs(delta);

  if (absDelta <= deadZonePx) {
    return 0;
  }

  return -Math.sign(delta) * (absDelta - deadZonePx);
}

function resolveCameraTarget(gameState: GameState | null, config: CameraFollowConfig | null) {
  if (!gameState || !config?.enabled) {
    return ZERO_CAMERA_STATE;
  }

  const headBall = gameState.ballQueue.balls[gameState.headIndex] ?? null;
  const shouldFollow = Boolean(
    headBall
    && gameState.status === "ready"
    && (!config.launchOnlyAfterStart || gameState.motion.isLaunched),
  );

  if (!headBall || !shouldFollow) {
    return {
      ...ZERO_CAMERA_STATE,
      isActive: false,
    };
  }

  const deltaX = headBall.position.x - gameState.playfield.center.x;
  const deltaY = headBall.position.y - gameState.playfield.center.y;
  const rawTargetX = resolveAxisTarget(deltaX, config.deadZonePx);
  const rawTargetY = resolveAxisTarget(deltaY, config.deadZonePx);
  const minOffsetX = -Math.min(config.maxOffsetX, gameState.playfield.rect.x);
  const maxOffsetX = Math.min(
    config.maxOffsetX,
    gameState.viewport.width - (gameState.playfield.rect.x + gameState.playfield.rect.width),
  );
  const minOffsetY = -Math.min(config.maxOffsetY, gameState.playfield.rect.y);
  const maxOffsetY = Math.min(
    config.maxOffsetY,
    gameState.viewport.height - (gameState.playfield.rect.y + gameState.playfield.rect.height),
  );

  return {
    offsetX: 0,
    offsetY: 0,
    targetX: clamp(rawTargetX, minOffsetX, maxOffsetX),
    targetY: clamp(rawTargetY, minOffsetY, maxOffsetY),
    isActive: true,
  } satisfies CameraFollowVisualState;
}

export function useCameraFollow(gameState: GameState | null) {
  const config = gameState?.tuningConfig.cameraFollow ?? null;
  const [cameraState, setCameraState] = useState<CameraFollowVisualState>(ZERO_CAMERA_STATE);

  useEffect(() => {
    const target = resolveCameraTarget(gameState, config);
    const lerpFactor = target.isActive
      ? (config?.followLerp ?? 0)
      : (config?.returnLerp ?? 0);

    setCameraState((current) => {
      const nextOffsetX = lerp(current.offsetX, target.targetX, lerpFactor);
      const nextOffsetY = lerp(current.offsetY, target.targetY, lerpFactor);

      return {
        offsetX: Math.abs(nextOffsetX - target.targetX) <= SETTLE_EPSILON ? target.targetX : nextOffsetX,
        offsetY: Math.abs(nextOffsetY - target.targetY) <= SETTLE_EPSILON ? target.targetY : nextOffsetY,
        targetX: target.targetX,
        targetY: target.targetY,
        isActive: target.isActive,
      };
    });
  }, [config, gameState]);

  return cameraState;
}
