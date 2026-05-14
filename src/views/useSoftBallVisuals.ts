import { useEffect, useMemo, useRef, useState } from "react";
import { gameUiEventBus } from "../store/gameUiEventBus";
import type { BallSoftBallVisualMap, GameState, SoftBallConfig, SoftBallTriggerKind, Vector2 } from "../types/game";
import { UI_EVENT_NAMES } from "../types/uiContract";
import type { SoftBallTriggerPayload } from "../types/uiContract";

interface ActiveSoftBallTrigger extends SoftBallTriggerPayload {
  startedAt: number;
}

const MIN_SCALE = 0.78;
const MAX_SCALE = 1.28;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeVector(vector: Vector2 | null) {
  if (!vector) {
    return null;
  }

  const magnitude = Math.hypot(vector.x, vector.y);

  if (magnitude <= 0.0001) {
    return null;
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}

function getTriggerIntensity(config: SoftBallConfig, triggerKind: SoftBallTriggerKind, isHead: boolean) {
  const baseIntensity = triggerKind === "launch"
    ? config.launchIntensity
    : triggerKind === "redirect"
      ? config.redirectIntensity
      : triggerKind === "special-bounce"
        ? config.specialBounceIntensity
        : config.impactIntensity;

  return baseIntensity * (isHead ? 1 : config.followerScale);
}

function getTotalDuration(config: SoftBallConfig) {
  return config.reboundDurationMs + config.secondaryBounceDurationMs;
}

function isTriggerExpired(trigger: ActiveSoftBallTrigger, config: SoftBallConfig, now: number) {
  return now - trigger.startedAt >= getTotalDuration(config);
}

function pruneTriggers(
  triggers: Record<string, ActiveSoftBallTrigger>,
  config: SoftBallConfig,
  existingBallIds: Set<string>,
  now: number,
) {
  const nextEntries = Object.entries(triggers).filter(([ballId, trigger]) => (
    existingBallIds.has(ballId) && !isTriggerExpired(trigger, config, now)
  ));

  return nextEntries.length === Object.keys(triggers).length
    ? triggers
    : Object.fromEntries(nextEntries);
}

export function useSoftBallVisuals(gameState: GameState | null): BallSoftBallVisualMap {
  const config = gameState?.tuningConfig.softBall ?? null;
  const [activeTriggers, setActiveTriggers] = useState<Record<string, ActiveSoftBallTrigger>>({});
  const [clock, setClock] = useState(() => performance.now());
  const frameRef = useRef<number | null>(null);
  const gameStateRef = useRef(gameState);
  const configRef = useRef(config);
  const ballIds = gameState?.ballQueue.balls.map((ball) => ball.id) ?? [];
  const ballIdsKey = ballIds.join("|");
  const existingBallIds = useMemo(() => new Set(ballIds), [ballIdsKey]);

  useEffect(() => {
    gameStateRef.current = gameState;
    configRef.current = config;
  }, [config, gameState]);

  useEffect(() => {
    if (!config?.enabled) {
      setActiveTriggers({});
    }
  }, [config?.enabled]);

  useEffect(() => {
    if (!config) {
      setActiveTriggers({});
      return;
    }

    const now = performance.now();
    setActiveTriggers((current) => pruneTriggers(current, config, existingBallIds, now));
  }, [config, existingBallIds]);

  useEffect(() => {
    const unsubscribe = gameUiEventBus.subscribe(UI_EVENT_NAMES.SOFT_BALL_TRIGGER, (payload) => {
      const activeConfig = configRef.current;
      const activeGameState = gameStateRef.current;

      if (!activeConfig?.enabled) {
        return;
      }

      if (activeConfig.headOnly && !payload.isHead) {
        return;
      }

      if (payload.speed < activeConfig.minTriggerSpeed) {
        return;
      }

      const ballIdExists = activeGameState?.ballQueue.balls.some((ball) => ball.id === payload.ballId) ?? false;

      if (!ballIdExists) {
        return;
      }

      setActiveTriggers((current) => ({
        ...current,
        [payload.ballId]: {
          ...payload,
          startedAt: performance.now(),
        },
      }));
      setClock(performance.now());
    });

    return unsubscribe;
  }, []);

  const activeTriggerKeys = useMemo(() => Object.keys(activeTriggers).sort().join("|"), [activeTriggers]);

  useEffect(() => {
    if (!config?.enabled || activeTriggerKeys.length === 0) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      return undefined;
    }

    const tick = (now: number) => {
      setClock(now);
      setActiveTriggers((current) => pruneTriggers(current, config, existingBallIds, now));
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [activeTriggerKeys, ballIdsKey, config, existingBallIds]);

  return useMemo(() => {
    if (!gameState || !config?.enabled) {
      return {};
    }

    const visuals: BallSoftBallVisualMap = {};

    Object.values(activeTriggers).forEach((trigger) => {
      if (!existingBallIds.has(trigger.ballId)) {
        return;
      }

      const elapsed = clock - trigger.startedAt;
      const totalDuration = getTotalDuration(config);

      if (elapsed < 0 || elapsed >= totalDuration) {
        return;
      }

      const normalizedAxis = normalizeVector(trigger.normal ?? trigger.direction) ?? { x: 1, y: 0 };
      const baseAngleDeg = Math.atan2(normalizedAxis.y, normalizedAxis.x) * (180 / Math.PI);
      const intensity = getTriggerIntensity(config, trigger.triggerKind, trigger.isHead);
      const primaryProgress = clamp(elapsed / Math.max(1, config.reboundDurationMs), 0, 1);
      const primaryAmplitude = Math.cos(primaryProgress * Math.PI * (1.18 + config.overshoot * 1.6))
        * Math.exp(-(2.2 + config.overshoot * 2.8) * primaryProgress);
      const secondaryElapsed = Math.max(0, elapsed - config.reboundDurationMs);
      const secondaryProgress = clamp(secondaryElapsed / Math.max(1, config.secondaryBounceDurationMs), 0, 1);
      const secondaryAmplitude = secondaryProgress > 0
        ? Math.sin(secondaryProgress * Math.PI) * (1 - secondaryProgress) * 0.26
        : 0;
      const amplitude = (primaryAmplitude + secondaryAmplitude) * intensity;
      const wobbleDecay = 1 - clamp(elapsed / Math.max(1, totalDuration), 0, 1);
      const wobble = Math.sin(primaryProgress * Math.PI * config.wobbleCycles)
        * config.jellyWobbleStrength
        * intensity
        * wobbleDecay;
      const isImpactTrigger = trigger.normal !== null;
      const scaleAlong = isImpactTrigger
        ? 1 - config.maxSquash * amplitude + wobble * 0.18
        : 1 + config.maxStretch * amplitude + wobble * 0.22;
      const scaleAcross = isImpactTrigger
        ? 1 + config.maxStretch * amplitude - wobble * 0.22
        : 1 - config.maxSquash * amplitude - wobble * 0.18;
      const tiltDirection = normalizedAxis.x >= 0 ? 1 : -1;

      visuals[trigger.ballId] = {
        scaleX: clamp(scaleAlong, MIN_SCALE, MAX_SCALE),
        scaleY: clamp(scaleAcross, MIN_SCALE, MAX_SCALE),
        rotationDeg: baseAngleDeg + wobble * config.wobbleRotationDeg * tiltDirection,
      };
    });

    return visuals;
  }, [activeTriggers, ballIdsKey, clock, config, existingBallIds, gameState]);
}
