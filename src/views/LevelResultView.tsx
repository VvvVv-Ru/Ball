import { useGameStore } from "../store/useGameStore";
import { uiStateSelectors } from "../store/uiSelectors";

function formatSeconds(seconds: number | null) {
  if (seconds === null) {
    return "0.0s";
  }

  return `${seconds.toFixed(1)}s`;
}

export function LevelResultView() {
  const currentLevelId = useGameStore((state) => state.currentLevelId);
  const levels = useGameStore((state) => state.levels);
  const nextLevelName = useGameStore(uiStateSelectors.nextLevelName);
  const isNextLevelAvailable = useGameStore(uiStateSelectors.isNextLevelAvailable);
  const finalElapsedTimeSeconds = useGameStore(uiStateSelectors.finalElapsedTimeSeconds);
  const elapsedTimeSeconds = useGameStore(uiStateSelectors.elapsedTimeSeconds);
  const selectLevel = useGameStore((state) => state.selectLevel);
  const startSelectedLevel = useGameStore((state) => state.startSelectedLevel);

  const currentLevelConfig = levels.find((level) => level.id === currentLevelId) ?? null;
  const timeLabel = formatSeconds(finalElapsedTimeSeconds ?? elapsedTimeSeconds);
  const nextStepTargetLevelId = currentLevelConfig?.nextStep.targetLevelId ?? null;

  const handlePrimaryAction = () => {
    if (isNextLevelAvailable && nextStepTargetLevelId) {
      selectLevel(nextStepTargetLevelId);
      startSelectedLevel();
      return;
    }

    startSelectedLevel();
  };

  return (
    <main className="flow-scene flow-scene--result">
      <div className="stage-shell">
        <section className="stage-frame stage-frame--flow" aria-label="结算界面舞台">
          <div className="flow-stage-content flow-stage-content--result-only">
            <strong className="flow-result-time" aria-label="本关总用时">{timeLabel}</strong>
            <button type="button" className="flow-image-button flow-result-button" onClick={handlePrimaryAction} aria-label={nextLevelName}>
              <img className="flow-button-image" src="/ui/flow-button.png" alt="" aria-hidden="true" />
              <span className="flow-button-label">{nextLevelName}</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
