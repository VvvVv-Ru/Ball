import { useEffect, useRef, useState } from "react";
import type { ResultConfettiConfig } from "../types/game";

interface NumberFieldProps {
  label: string;
  value: number;
  disabled: boolean;
  step?: number;
  min?: number;
  onCommit: (value: number) => void;
}

function formatFieldValue(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

function NumberField({ label, value, disabled, step = 1, min, onCommit }: NumberFieldProps) {
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
        value={draftValue}
        disabled={disabled}
        min={min}
        step={step}
        onChange={(event) => handleChange(event.currentTarget.value)}
        onBlur={handleBlur}
      />
    </label>
  );
}

interface ResultConfettiDebugPanelProps {
  defaultConfig: ResultConfettiConfig | null;
  panelConfig: ResultConfettiConfig | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onUpdateBooleanField: (field: "enabled", value: boolean) => void;
  onUpdateNumberField: (field: keyof Omit<ResultConfettiConfig, "enabled" | "palette">, value: number) => void;
  onUpdatePaletteColor: (index: number, value: string) => void;
  onReplayConfetti: () => void;
  onResetToDefault: () => void;
}

const NUMBER_FIELDS: Array<{ label: string; field: keyof Omit<ResultConfettiConfig, "enabled" | "palette">; step?: number; min?: number }> = [
  { label: "发射点数量 launcherCount", field: "launcherCount", min: 1 },
  { label: "每点碎屑数 burstCount", field: "burstCount", min: 0 },
  { label: "最小速度 speedMin", field: "speedMin", min: 0 },
  { label: "最大速度 speedMax", field: "speedMax", min: 0 },
  { label: "散射角 spreadAngleDeg", field: "spreadAngleDeg", min: 0 },
  { label: "生命周期 lifetimeMs", field: "lifetimeMs", min: 0 },
  { label: "重力 gravity", field: "gravity", min: 0 },
  { label: "最小旋转速度 spinSpeedMin", field: "spinSpeedMin", step: 10 },
  { label: "最大旋转速度 spinSpeedMax", field: "spinSpeedMax", step: 10 },
  { label: "UI 显示延迟 resultUiRevealDelayMs", field: "resultUiRevealDelayMs", min: 500 },
  { label: "最小尺寸 sizeMin", field: "sizeMin", min: 0 },
  { label: "最大尺寸 sizeMax", field: "sizeMax", min: 0 },
  { label: "结束尺寸倍率 endSizeScale", field: "endSizeScale", step: 0.01, min: 0.1 },
  { label: "发射器内缩 launcherInsetPx", field: "launcherInsetPx", min: 0 },
  { label: "底部偏移 bottomOffsetPx", field: "bottomOffsetPx", step: 1 },
];

export function ResultConfettiDebugPanel({
  defaultConfig,
  panelConfig,
  isOpen,
  onToggleOpen,
  onUpdateBooleanField,
  onUpdateNumberField,
  onUpdatePaletteColor,
  onReplayConfetti,
  onResetToDefault,
}: ResultConfettiDebugPanelProps) {
  if (!defaultConfig || !panelConfig) {
    return null;
  }

  return (
    <section className="dev-debug-shell result-confetti-debug-shell" aria-label="礼花调参面板">
      <div className="editor-toolbar">
        <div>
          <span className="eyebrow">Dev Result Confetti</span>
          <h2>结算礼花调参</h2>
        </div>

        <button type="button" className="ghost-button" onClick={onToggleOpen}>
          {isOpen ? "收起" : "展开"}
        </button>
      </div>

      <p className="editor-description">可直接改数字观察礼花效果；每次改动都会立即重播一次礼花。`resultUiRevealDelayMs` 会被限制在 500~1000ms。</p>

      {!isOpen ? (
        <div className="editor-summary-card">
          <span>当前参数来源</span>
          <strong>live debug config</strong>
        </div>
      ) : (
        <>
          <label className="shake-toggle-row">
            <span>开关 enabled</span>
            <input
              type="checkbox"
              checked={panelConfig.enabled}
              onChange={(event) => onUpdateBooleanField("enabled", event.currentTarget.checked)}
            />
          </label>

          <div className="editor-grid result-confetti-grid">
            {NUMBER_FIELDS.map((item) => (
              <NumberField
                key={item.field}
                label={item.label}
                value={panelConfig[item.field]}
                disabled={false}
                step={item.step}
                min={item.min}
                onCommit={(value) => onUpdateNumberField(item.field, value)}
              />
            ))}
          </div>

          <div className="shake-panel-section">
            <div>
              <span className="eyebrow">Palette</span>
              <h3>三色碎屑颜色</h3>
            </div>

            <div className="editor-grid result-confetti-grid">
              {panelConfig.palette.map((color, index) => (
                <label key={`${index}-${color}`} className="editor-field">
                  <span>颜色 {index + 1}</span>
                  <input
                    type="color"
                    value={color}
                    onChange={(event) => onUpdatePaletteColor(index, event.currentTarget.value)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="shake-panel-footer">
            <button type="button" className="ghost-button" disabled={!panelConfig.enabled} onClick={onReplayConfetti}>
              重播礼花
            </button>
            <button type="button" className="ghost-button" onClick={onResetToDefault}>
              恢复默认参数
            </button>
          </div>
        </>
      )}
    </section>
  );
}
