import { useEffect, useMemo, useState } from "react";
import type { ResultConfettiConfig } from "../types/game";

function cloneResultConfettiConfig(config: ResultConfettiConfig): ResultConfettiConfig {
  return {
    enabled: config.enabled,
    launcherCount: config.launcherCount,
    burstCount: config.burstCount,
    speedMin: config.speedMin,
    speedMax: config.speedMax,
    spreadAngleDeg: config.spreadAngleDeg,
    lifetimeMs: config.lifetimeMs,
    gravity: config.gravity,
    spinSpeedMin: config.spinSpeedMin,
    spinSpeedMax: config.spinSpeedMax,
    palette: [...config.palette],
    resultUiRevealDelayMs: config.resultUiRevealDelayMs,
    sizeMin: config.sizeMin,
    sizeMax: config.sizeMax,
    endSizeScale: config.endSizeScale,
    launcherInsetPx: config.launcherInsetPx,
    bottomOffsetPx: config.bottomOffsetPx,
  };
}

function sanitizeInteger(value: number, fallback: number, min = 0) {
  return Number.isFinite(value) ? Math.max(min, Math.round(value)) : fallback;
}

function sanitizeNumber(value: number, fallback: number, min = 0) {
  return Number.isFinite(value) ? Math.max(min, value) : fallback;
}

function sanitizeDelay(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(1000, Math.max(500, Math.round(value)));
}

export function useResultConfettiDebug(
  defaultConfig: ResultConfettiConfig | null,
  sourceDefaultConfig: ResultConfettiConfig | null,
  onCommitConfig: (config: ResultConfettiConfig) => void,
) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [playbackKey, setPlaybackKey] = useState(0);
  const [panelConfig, setPanelConfig] = useState<ResultConfettiConfig | null>(
    defaultConfig ? cloneResultConfettiConfig(defaultConfig) : null,
  );

  useEffect(() => {
    if (!defaultConfig) {
      setPanelConfig(null);
      return;
    }

    setPanelConfig(cloneResultConfettiConfig(defaultConfig));
  }, [defaultConfig]);

  const effectiveConfig = useMemo(() => panelConfig ?? defaultConfig, [defaultConfig, panelConfig]);

  function togglePanelOpen() {
    setIsPanelOpen((current) => !current);
  }

  function updateBooleanField(field: "enabled", value: boolean) {
    setPanelConfig((current) => {
      const baseConfig = current ?? (defaultConfig ? cloneResultConfettiConfig(defaultConfig) : null);

      if (!baseConfig) {
        return current;
      }

      const nextConfig = {
        ...baseConfig,
        [field]: value,
      };

      onCommitConfig(nextConfig);
      return nextConfig;
    });
    setPlaybackKey((current) => current + 1);
  }

  function updateNumberField(field: keyof Omit<ResultConfettiConfig, "enabled" | "palette">, value: number) {
    setPanelConfig((current) => {
      const baseConfig = current ?? (defaultConfig ? cloneResultConfettiConfig(defaultConfig) : null);

      if (!baseConfig) {
        return current;
      }

      const fallbackValue = baseConfig[field];
      let nextValue = value;

      if (field === "launcherCount") {
        nextValue = sanitizeInteger(value, fallbackValue, 1);
      } else if (field === "burstCount") {
        nextValue = sanitizeInteger(value, fallbackValue, 0);
      } else if (field === "resultUiRevealDelayMs") {
        nextValue = sanitizeDelay(value, fallbackValue);
      } else if (field === "spinSpeedMin" || field === "spinSpeedMax") {
        nextValue = Number.isFinite(value) ? value : fallbackValue;
      } else if (field === "endSizeScale") {
        nextValue = Number.isFinite(value) ? Math.max(0.1, value) : fallbackValue;
      } else if (field === "speedMin" || field === "speedMax" || field === "spreadAngleDeg" || field === "lifetimeMs" || field === "gravity" || field === "sizeMin" || field === "sizeMax" || field === "launcherInsetPx" || field === "bottomOffsetPx") {
        nextValue = sanitizeNumber(value, fallbackValue, 0);
      }

      const nextConfig = {
        ...baseConfig,
        [field]: nextValue,
      };

      onCommitConfig(nextConfig);
      return nextConfig;
    });
    setPlaybackKey((current) => current + 1);
  }

  function updatePaletteColor(index: number, value: string) {
    setPanelConfig((current) => {
      const baseConfig = current ?? (defaultConfig ? cloneResultConfettiConfig(defaultConfig) : null);

      if (!baseConfig) {
        return current;
      }

      const nextPalette = [...baseConfig.palette];
      nextPalette[index] = value;

      const nextConfig = {
        ...baseConfig,
        palette: nextPalette,
      };

      onCommitConfig(nextConfig);
      return nextConfig;
    });
    setPlaybackKey((current) => current + 1);
  }

  function replayConfetti() {
    setPlaybackKey((current) => current + 1);
  }

  function resetToDefault() {
    const resetSource = sourceDefaultConfig ?? defaultConfig;

    if (!resetSource) {
      setPanelConfig(null);
      return;
    }

    const nextConfig = cloneResultConfettiConfig(resetSource);
    setPanelConfig(nextConfig);
    onCommitConfig(nextConfig);
    setPlaybackKey((current) => current + 1);
  }

  return {
    defaultConfig,
    panelConfig,
    effectiveConfig,
    isPanelOpen,
    playbackKey,
    togglePanelOpen,
    updateBooleanField,
    updateNumberField,
    updatePaletteColor,
    replayConfetti,
    resetToDefault,
  };
}
