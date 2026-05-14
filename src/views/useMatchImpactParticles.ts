import { useEffect, useMemo, useRef, useState } from "react";
import { gameUiEventBus } from "../store/gameUiEventBus";
import type {
  BorderSide,
  GameState,
  MatchImpactParticleConfig,
  MatchImpactParticleEffect,
  MatchImpactParticleSeed,
  MatchImpactParticleVisual,
  Vector2,
} from "../types/game";
import { UI_EVENT_NAMES } from "../types/uiContract";

const MAX_ACTIVE_MATCH_IMPACT_EFFECTS = 8;

const INWARD_NORMAL_BY_SIDE: Record<BorderSide, Vector2> = {
  top: { x: 0, y: 1 },
  right: { x: -1, y: 0 },
  bottom: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function rotateVector(vector: Vector2, angleDeg: number): Vector2 {
  const radians = angleDeg * (Math.PI / 180);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

function getImpactPoint(center: Vector2, side: BorderSide, radius: number): Vector2 {
  if (side === "top") {
    return { x: center.x, y: center.y - radius };
  }

  if (side === "bottom") {
    return { x: center.x, y: center.y + radius };
  }

  if (side === "left") {
    return { x: center.x - radius, y: center.y };
  }

  return { x: center.x + radius, y: center.y };
}

function getOpacity(progress: number, curve: MatchImpactParticleConfig["opacityCurve"]) {
  const clampedProgress = clamp(progress, 0, 1);

  if (curve === "linear") {
    return 1 - clampedProgress;
  }

  return 1 - clampedProgress * clampedProgress;
}

function getTravelDistance(initialVelocity: number, elapsedSeconds: number, config: MatchImpactParticleConfig) {
  if (!config.useDamping || config.damping <= 0) {
    return initialVelocity * elapsedSeconds;
  }

  return initialVelocity * ((1 - Math.exp(-config.damping * elapsedSeconds)) / config.damping);
}

function pruneEffects(effects: MatchImpactParticleEffect[], now: number) {
  return effects.filter((effect) => effect.startedAt + effect.lifetimeMs > now);
}

function createParticleSeed(effectId: string, index: number, config: MatchImpactParticleConfig, normal: Vector2): MatchImpactParticleSeed {
  const scatterHalf = config.scatterAngleDeg / 2;
  const direction = rotateVector(normal, randomBetween(-scatterHalf, scatterHalf));
  const speed = randomBetween(config.initialSpeedMin, config.initialSpeedMax);

  return {
    id: `${effectId}-particle-${index}`,
    initialVelocity: {
      x: direction.x * speed,
      y: direction.y * speed,
    },
    size: randomBetween(config.sizeMin, config.sizeMax),
    rotationDeg: randomBetween(-8, 8),
    spinDegPerSecond: randomBetween(-280, 280),
  };
}

export function useMatchImpactParticles(gameState: GameState | null) {
  const config = gameState?.tuningConfig.matchImpactParticles ?? null;
  const [effects, setEffects] = useState<MatchImpactParticleEffect[]>([]);
  const [clock, setClock] = useState(() => performance.now());
  const frameRef = useRef<number | null>(null);
  const gameStateRef = useRef(gameState);
  const configRef = useRef(config);

  useEffect(() => {
    gameStateRef.current = gameState;
    configRef.current = config;
  }, [config, gameState]);

  useEffect(() => {
    if (!config?.enabled) {
      setEffects([]);
    }
  }, [config?.enabled]);

  useEffect(() => {
    if (!config) {
      setEffects([]);
      return;
    }

    const now = performance.now();
    setEffects((current) => pruneEffects(current, now));
  }, [config]);

  useEffect(() => {
    const unsubscribe = gameUiEventBus.subscribe(UI_EVENT_NAMES.ON_BORDER_IMPACT, (payload) => {
      const activeConfig = configRef.current;
      const activeGameState = gameStateRef.current;

      if (!activeConfig?.enabled || !activeGameState || payload.impactKind !== "match") {
        return;
      }

      const border = activeGameState.playfield.borders.find((item) => item.id === payload.borderId);

      if (!border) {
        return;
      }

      const startedAt = performance.now();
      const origin = getImpactPoint(payload.center, payload.side, payload.ballRadius);
      const normal = INWARD_NORMAL_BY_SIDE[payload.side];
      const nextEffect: MatchImpactParticleEffect = {
        id: `${payload.borderId}-${payload.occurredAt}-${startedAt}`,
        origin,
        color: border.color,
        startedAt,
        lifetimeMs: activeConfig.lifetimeMs,
        particles: Array.from({ length: activeConfig.particleCount }, (_, index) => (
          createParticleSeed(`${payload.borderId}-${payload.occurredAt}-${startedAt}`, index, activeConfig, normal)
        )),
      };

      setEffects((current) => [...pruneEffects(current, startedAt), nextEffect].slice(-MAX_ACTIVE_MATCH_IMPACT_EFFECTS));
      setClock(startedAt);
    });

    return unsubscribe;
  }, []);

  const effectKey = useMemo(() => effects.map((effect) => effect.id).join("|"), [effects]);

  useEffect(() => {
    if (!config?.enabled || effects.length === 0) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      return undefined;
    }

    const tick = (now: number) => {
      setClock(now);
      setEffects((current) => pruneEffects(current, now));
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [config, effectKey, effects.length]);

  return useMemo(() => {
    if (!config?.enabled) {
      return [] as MatchImpactParticleVisual[];
    }

    return effects.flatMap((effect) => {
      const elapsedMs = clock - effect.startedAt;

      if (elapsedMs < 0 || elapsedMs >= effect.lifetimeMs) {
        return [];
      }

      const progress = clamp(elapsedMs / Math.max(1, effect.lifetimeMs), 0, 1);
      const elapsedSeconds = elapsedMs / 1000;
      const opacity = getOpacity(progress, config.opacityCurve);

      return effect.particles.map((particle) => {
        const travelX = getTravelDistance(particle.initialVelocity.x, elapsedSeconds, config);
        const travelY = getTravelDistance(particle.initialVelocity.y, elapsedSeconds, config);
        const gravityOffset = config.useGravity ? 0.5 * config.gravity * elapsedSeconds * elapsedSeconds : 0;

        return {
          id: particle.id,
          position: {
            x: effect.origin.x + travelX,
            y: effect.origin.y + travelY + gravityOffset,
          },
          size: particle.size,
          rotationDeg: particle.rotationDeg + particle.spinDegPerSecond * elapsedSeconds,
          opacity,
          color: effect.color,
        } satisfies MatchImpactParticleVisual;
      });
    });
  }, [clock, config, effects]);
}
