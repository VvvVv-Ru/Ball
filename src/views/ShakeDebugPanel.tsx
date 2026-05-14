import { useEffect, useRef, useState } from "react";
import type { BorderImpactShakeConfig, ScreenShakeProfile, ShakeIntensity } from "../types/game";

type ShakeProfileField = keyof ScreenShakeProfile;

interface ShakeNumberFieldProps {
  label: string;
  value: number;
  min?: number;
  step?: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}

function formatFieldValue(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

function ShakeNumberField({ label, value, min = 0, step = 1, disabled, onCommit }: ShakeNumberFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draftValue, setDraftValue] = useState(() => formatFieldValue(value));

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraftValue(formatFieldValue(value));
    }
  }, [value]);

  function handleChange(nextRawValue: string) {
    setDraftValue(nextRawValue);

    if (nextRawValue.trim() === "") {
      return;
    }

    const nextNumericValue = Number(nextRawValue);

    if (Number.isFinite(nextNumericValue)) {
      onCommit(nextNumericValue);
    }
  }

  function handleBlur() {
    const nextRawValue = draftValue.trim();

    if (nextRawValue === "") {
      setDraftValue(formatFieldValue(value));
      return;
    }

    const nextNumericValue = Number(nextRawValue);

    if (!Number.isFinite(nextNumericValue)) {
      setDraftValue(formatFieldValue(value));
      return;
    }

    onCommit(nextNumericValue);
  }

  return (
    <label className="editor-field">
      <span>{label}</span>
      <input
        ref={inputRef}
        type="number"
        min={min}
        step={step}
        disabled={disabled}
        value={draftValue}
        onChange={(event) => handleChange(event.currentTarget.value)}
        onBlur={handleBlur}
      />
    </label>
  );
}

interface ShakeDebugPanelProps {
  defaultConfig: BorderImpactShakeConfig | null;
  panelConfig: BorderImpactShakeConfig | null;
  isOpen: boolean;
  isOverrideEnabled: boolean;
  onToggleOpen: () => void;
  onSetOverrideEnabled: (nextEnabled: boolean) => void;
  onUpdateShakeEnabled: (nextEnabled: boolean) => void;
  onUpdateShakeProfile: (intensity: ShakeIntensity, field: keyof ScreenShakeProfile, value: number) => void;
  onResetToDefault: () => void;
}

function renderProfileFields(
  intensity: ShakeIntensity,
  title: string,
  profile: ScreenShakeProfile,
  disabled: boolean,
  onUpdateShakeProfile: ShakeDebugPanelProps["onUpdateShakeProfile"],
) {
  function commitField(field: ShakeProfileField, value: number) {
    onUpdateShakeProfile(intensity, field, value);
  }

  return (
    <div className="shake-panel-section">
      <div>
        <span className="eyebrow">{intensity.toUpperCase()}</span>
        <h3>{title}</h3>
      </div>

      <div className="shake-panel-grid">
        <ShakeNumberField label="幅度" value={profile.amplitude} disabled={disabled} onCommit={(value) => commitField("amplitude", value)} />

        <ShakeNumberField label="时长 ms" value={profile.durationMs} disabled={disabled} onCommit={(value) => commitField("durationMs", value)} />

        <ShakeNumberField label="冷却 ms" value={profile.cooldownMs} disabled={disabled} onCommit={(value) => commitField("cooldownMs", value)} />
      </div>
    </div>
  );
}

export function ShakeDebugPanel({
  defaultConfig,
  panelConfig,
  isOpen,
  isOverrideEnabled,
  onToggleOpen,
  onSetOverrideEnabled,
  onUpdateShakeEnabled,
  onUpdateShakeProfile,
  onResetToDefault,
}: ShakeDebugPanelProps) {
  if (!defaultConfig || !panelConfig) {
    return null;
  }

  return (
    <section
      className="dev-debug-shell shake-debug-shell"
      aria-label="Shake 调参面板"
      data-ui-mount="debug-shake"
      data-ui-consumer="dev-shake-panel"
    >
      <div className="editor-toolbar">
        <div>
          <span className="eyebrow">Dev Shake Panel</span>
          <h2>屏幕抖动调参</h2>
        </div>

        <button type="button" className="ghost-button" onClick={onToggleOpen}>
          {isOpen ? "收起" : "展开"}
        </button>
      </div>

      <p className="editor-description">该面板只服务于 shake 调参，挂在独立 debug container；后续移除后系统仍回退默认参数。</p>

      {!isOpen ? (
        <div className="editor-summary-card">
          <span>当前参数来源</span>
          <strong>{isOverrideEnabled ? "debug override" : "default config"}</strong>
        </div>
      ) : (
        <>
          <label className="shake-toggle-row">
            <span>启用调试覆盖</span>
            <input
              type="checkbox"
              checked={isOverrideEnabled}
              onChange={(event) => onSetOverrideEnabled(event.currentTarget.checked)}
            />
          </label>

          <label className="shake-toggle-row">
            <span>shake enable</span>
            <input
              type="checkbox"
              disabled={!isOverrideEnabled}
              checked={panelConfig.enabled}
              onChange={(event) => onUpdateShakeEnabled(event.currentTarget.checked)}
            />
          </label>

          {renderProfileFields("light", "轻抖参数", panelConfig.light, !isOverrideEnabled, onUpdateShakeProfile)}
          {renderProfileFields("medium", "中抖参数", panelConfig.medium, !isOverrideEnabled, onUpdateShakeProfile)}

          <div className="shake-panel-footer">
            <button type="button" className="ghost-button" onClick={onResetToDefault}>
              恢复默认参数
            </button>
            <span className="shake-panel-source">默认来源：level3 gameplay.tuning.borderImpactShake</span>
          </div>
        </>
      )}
    </section>
  );
}
