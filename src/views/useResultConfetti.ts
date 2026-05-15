import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ResultConfettiBurstEffect,
  ResultConfettiConfig,
  ResultConfettiParticleSeed,
  ResultConfettiParticleVisual,
  Vector2,
  ViewportConfig,
} from "../types/game";

const MAX_ACTIVE_RESULT_CONFETTI_BURSTS = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createLauncherOrigins(viewport: ViewportConfig, config: ResultConfettiConfig): Vector2[] {
  const launcherCount = Math.max(1, Math.floor(config.launcherCount));
  const inset = clamp(config.launcherInsetPx, 0, viewport.width / 2);
  const usableWidth = Math.max(0, viewport.width - inset * 2);

  return Array.from({ length: launcherCount }, (_, index) => {
    const progress = launcherCount === 1 ? 0.5 : index / (launcherCount - 1);

    return {
      x: inset + usableWidth * progress,
      y: viewport.height + config.bottomOffsetPx,
    } satisfies Vector2;
  });
}

function pickColor(palette: string[]) {
  return palette[Math.floor(Math.random() * palette.length)] ?? "#d23714";
}

function createParticleSeed(effectId: string, index: number, config: ResultConfettiConfig): ResultConfettiParticleSeed {
  const angleDeg = -90 + randomBetween(-config.spreadAngleDeg / 2, config.spreadAngleDeg / 2);
  const angleRad = angleDeg * (Math.PI / 180);
  const speed = randomBetween(config.speedMin, config.speedMax);

  return {
    id: `${effectId}-particle-${index}`,
    color: pickColor(config.palette),
    initialVelocity: {
      x: Math.cos(angleRad) * speed,
      y: Math.sin(angleRad) * speed,
    },
    size: randomBetween(config.sizeMin, config.sizeMax),
    rotationDeg: randomBetween(0, 360),
    spinDegPerSecond: randomBetween(config.spinSpeedMin, config.spinSpeedMax),
  };
}

function pruneBursts(effects: ResultConfettiBurstEffect[], now: number) {
  return effects.filter((effect) => effect.startedAt + effect.lifetimeMs > now);
}

export function useResultConfetti(active: boolean, viewport: ViewportConfig, config: ResultConfettiConfig | null, playbackKey = 0) {
  const [effects, setEffects] = useState<ResultConfettiBurstEffect[]>([]);
  const [clock, setClock] = useState(() => performance.now());
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !config?.enabled) {
      setEffects([]);
      return;
    }

    const startedAt = performance.now();
    const launcherOrigins = createLauncherOrigins(viewport, config);
    const bursts = launcherOrigins.map((origin, launcherIndex) => {
      const effectId = `result-confetti-${startedAt}-${launcherIndex}`;

      return {
        id: effectId,
        origin,
        startedAt: startedAt + launcherIndex * 36,
        lifetimeMs: config.lifetimeMs,
        particles: Array.from({ length: Math.max(0, config.burstCount) }, (_, index) => (
          createParticleSeed(effectId, index, config)
        )),
      } satisfies ResultConfettiBurstEffect;
    });

    setClock(startedAt);
    setEffects(bursts.slice(-MAX_ACTIVE_RESULT_CONFETTI_BURSTS));
  }, [
    active,
    config?.bottomOffsetPx,
    config?.burstCount,
    config?.enabled,
    config?.endSizeScale,
    config?.gravity,
    config?.launcherCount,
    config?.launcherInsetPx,
    config?.lifetimeMs,
    config?.palette,
    config?.sizeMax,
    config?.sizeMin,
    config?.speedMax,
    config?.speedMin,
    config?.spinSpeedMax,
    config?.spinSpeedMin,
    config?.spreadAngleDeg,
    playbackKey,
    viewport.height,
    viewport.width,
  ]);

  const effectKey = useMemo(() => effects.map((effect) => effect.id).join("|"), [effects]);

  useEffect(() => {
    if (!active || !config?.enabled || effects.length === 0) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      return undefined;
    }

    const tick = (now: number) => {
      setClock(now);
      setEffects((current) => pruneBursts(current, now));
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [active, config?.enabled, effectKey, effects.length]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  return useMemo(() => {
    if (!active || !config?.enabled) {
      return [] as ResultConfettiParticleVisual[];
    }

    return effects.flatMap((effect) => {
      const elapsedMs = clock - effect.startedAt;

      if (elapsedMs < 0 || elapsedMs >= effect.lifetimeMs) {
        return [];
      }

      const elapsedSeconds = elapsedMs / 1000;
      const progress = clamp(elapsedMs / Math.max(1, effect.lifetimeMs), 0, 1);
      const opacity = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
      const sizeScale = 1 - (1 - config.endSizeScale) * progress;

      return effect.particles.map((particle) => ({
        id: particle.id,
        position: {
          x: effect.origin.x + particle.initialVelocity.x * elapsedSeconds,
          y: effect.origin.y + particle.initialVelocity.y * elapsedSeconds + 0.5 * config.gravity * elapsedSeconds * elapsedSeconds,
        },
        width: particle.size * sizeScale,
        height: particle.size * 0.56 * sizeScale,
        rotationDeg: particle.rotationDeg + particle.spinDegPerSecond * elapsedSeconds,
        opacity: clamp(opacity, 0, 1),
        color: particle.color,
      } satisfies ResultConfettiParticleVisual));
    });
  }, [active, clock, config, effects]);
}
