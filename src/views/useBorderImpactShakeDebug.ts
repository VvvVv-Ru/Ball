import { useEffect, useMemo, useState } from "react";
import type { BorderImpactShakeConfig, ScreenShakeProfile, ShakeIntensity } from "../types/game";

function cloneShakeProfile(profile: ScreenShakeProfile): ScreenShakeProfile {
  return {
    amplitude: profile.amplitude,
    durationMs: profile.durationMs,
    cooldownMs: profile.cooldownMs,
  };
}

export function cloneBorderImpactShakeConfig(config: BorderImpactShakeConfig): BorderImpactShakeConfig {
  return {
    enabled: config.enabled,
    light: cloneShakeProfile(config.light),
    medium: cloneShakeProfile(config.medium),
  };
}

function sanitizeNonNegative(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
}

export function useBorderImpactShakeDebug(defaultConfig: BorderImpactShakeConfig | null) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);
  const [overrideConfig, setOverrideConfig] = useState<BorderImpactShakeConfig | null>(
    defaultConfig ? cloneBorderImpactShakeConfig(defaultConfig) : null,
  );

  useEffect(() => {
    if (!defaultConfig) {
      setOverrideConfig(null);
      setIsOverrideEnabled(false);
      return;
    }

    if (!isOverrideEnabled) {
      setOverrideConfig(cloneBorderImpactShakeConfig(defaultConfig));
    }
  }, [defaultConfig, isOverrideEnabled]);

  const panelConfig = useMemo(() => {
    if (overrideConfig) {
      return overrideConfig;
    }

    if (defaultConfig) {
      return cloneBorderImpactShakeConfig(defaultConfig);
    }

    return null;
  }, [defaultConfig, overrideConfig]);

  const effectiveConfig = useMemo(() => {
    if (isOverrideEnabled && overrideConfig) {
      return overrideConfig;
    }

    return defaultConfig;
  }, [defaultConfig, isOverrideEnabled, overrideConfig]);

  function togglePanelOpen() {
    setIsPanelOpen((current) => !current);
  }

  function setOverrideEnabled(nextEnabled: boolean) {
    if (!defaultConfig) {
      setIsOverrideEnabled(false);
      return;
    }

    if (nextEnabled && !overrideConfig) {
      setOverrideConfig(cloneBorderImpactShakeConfig(defaultConfig));
    }

    setIsOverrideEnabled(nextEnabled);
  }

  function updateShakeEnabled(nextEnabled: boolean) {
    setOverrideConfig((current) => {
      const baseConfig = current ?? (defaultConfig ? cloneBorderImpactShakeConfig(defaultConfig) : null);

      if (!baseConfig) {
        return current;
      }

      return {
        ...baseConfig,
        enabled: nextEnabled,
      };
    });
  }

  function updateShakeProfile(intensity: ShakeIntensity, field: keyof ScreenShakeProfile, value: number) {
    setOverrideConfig((current) => {
      const baseConfig = current ?? (defaultConfig ? cloneBorderImpactShakeConfig(defaultConfig) : null);

      if (!baseConfig) {
        return current;
      }

      const fallbackValue = baseConfig[intensity][field];

      return {
        ...baseConfig,
        [intensity]: {
          ...baseConfig[intensity],
          [field]: sanitizeNonNegative(value, fallbackValue),
        },
      };
    });
  }

  function resetToDefault() {
    if (!defaultConfig) {
      setOverrideConfig(null);
      setIsOverrideEnabled(false);
      return;
    }

    setOverrideConfig(cloneBorderImpactShakeConfig(defaultConfig));
    setIsOverrideEnabled(false);
  }

  return {
    defaultConfig,
    effectiveConfig,
    panelConfig,
    isPanelOpen,
    isOverrideEnabled,
    togglePanelOpen,
    setOverrideEnabled,
    updateShakeEnabled,
    updateShakeProfile,
    resetToDefault,
  };
}
