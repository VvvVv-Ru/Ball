import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useGameStore } from "../store/useGameStore";
import { uiStateSelectors } from "../store/uiSelectors";
import type { ResultConfettiParticleVisual, ViewportConfig } from "../types/game";
import { useResultConfetti } from "./useResultConfetti";

const RESULT_VIEWPORT_FALLBACK: ViewportConfig = {
  width: 1080,
  height: 1920,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatSeconds(seconds: number | null) {
  if (seconds === null) {
    return "0.0s";
  }

  return `${seconds.toFixed(1)}s`;
}

function createResultConfettiStyle(particle: ResultConfettiParticleVisual, viewport: ViewportConfig): CSSProperties {
  return {
    left: `${(particle.position.x / viewport.width) * 100}%`,
    top: `${(particle.position.y / viewport.height) * 100}%`,
    width: `${(particle.width / viewport.width) * 100}%`,
    height: `${(particle.height / viewport.height) * 100}%`,
    opacity: particle.opacity,
    background: particle.color,
    transform: `translate(-50%, -50%) rotate(${particle.rotationDeg}deg)`,
  } satisfies CSSProperties;
}

type LevelOutcome = "clear" | "failed";

export function LevelOutcomeView({ outcome }: { outcome: LevelOutcome }) {
  const currentLevelId = useGameStore((state) => state.currentLevelId);
  const levels = useGameStore((state) => state.levels);
  const gameState = useGameStore((state) => state.gameState);
  const nextLevelName = useGameStore(uiStateSelectors.nextLevelName);
  const isNextLevelAvailable = useGameStore(uiStateSelectors.isNextLevelAvailable);
  const finalElapsedTimeSeconds = useGameStore(uiStateSelectors.finalElapsedTimeSeconds);
  const elapsedTimeSeconds = useGameStore(uiStateSelectors.elapsedTimeSeconds);
  const selectLevel = useGameStore((state) => state.selectLevel);
  const startSelectedLevel = useGameStore((state) => state.startSelectedLevel);
  const viewport = gameState?.viewport ?? RESULT_VIEWPORT_FALLBACK;
  const isClear = outcome === "clear";
  const resultConfettiConfig = gameState?.tuningConfig.resultConfetti ?? null;
  const resultUiRevealDelayMs = clamp(resultConfettiConfig?.resultUiRevealDelayMs ?? 720, 500, 1000);
  const resultConfetti = useResultConfetti(isClear, viewport, resultConfettiConfig);
  const [isResultUiVisible, setIsResultUiVisible] = useState(!isClear);

  const currentLevelConfig = levels.find((level) => level.id === currentLevelId) ?? null;
  const timeLabel = formatSeconds(finalElapsedTimeSeconds ?? elapsedTimeSeconds);
  const nextStepTargetLevelId = currentLevelConfig?.nextStep.targetLevelId ?? null;
  const resultLabel = isClear ? timeLabel : "Lose";
  const primaryButtonLabel = isClear ? nextLevelName : "again";

  useEffect(() => {
    if (!isClear) {
      setIsResultUiVisible(true);
      return undefined;
    }

    setIsResultUiVisible(false);
    const timeoutId = window.setTimeout(() => {
      setIsResultUiVisible(true);
    }, resultUiRevealDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isClear, resultUiRevealDelayMs, currentLevelId]);

  const handlePrimaryAction = () => {
    if (isClear && isNextLevelAvailable && nextStepTargetLevelId) {
      selectLevel(nextStepTargetLevelId);
      startSelectedLevel();
      return;
    }

    if (currentLevelId) {
      selectLevel(currentLevelId);
    }

    startSelectedLevel();
  };

  return (
    <main className="flow-scene flow-scene--result">
      <div className="stage-shell">
        <section className="stage-frame stage-frame--flow" aria-label={isClear ? "结算界面舞台" : "失败界面舞台"}>
          {isClear && resultConfetti.length > 0 ? (
            <div className="result-celebration-layer" aria-hidden="true">
              {resultConfetti.map((particle) => (
                <div
                  key={particle.id}
                  className="result-confetti-piece"
                  style={createResultConfettiStyle(particle, viewport)}
                />
              ))}
            </div>
          ) : null}

          <div className="flow-stage-content flow-stage-content--result-only">
            {isResultUiVisible ? (
              <div className="flow-result-ui">
                <strong className="flow-result-time" aria-label={isClear ? "本关总用时" : "失败结果"}>{resultLabel}</strong>
                <button type="button" className="flow-image-button flow-primary-button flow-result-button" onClick={handlePrimaryAction} aria-label={primaryButtonLabel}>
                  <img className="flow-button-image" src="/ui/flow-button.png" alt="" aria-hidden="true" />
                  <span className="flow-button-label flow-button-label--primary">{primaryButtonLabel}</span>
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
