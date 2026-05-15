import { audioService } from "../audio/audioService";
import { useGameStore } from "../store/useGameStore";
import { uiStateSelectors } from "../store/uiSelectors";

function getStartLevelLabel(levelName: string) {
  return levelName.replace(/\s+demo$/i, "");
}

export function LevelStartView() {
  const currentLevelName = useGameStore(uiStateSelectors.currentLevelName);
  const enterLevelGameplay = useGameStore((state) => state.enterLevelGameplay);
  const startLevelLabel = getStartLevelLabel(currentLevelName);

  const handleEnterGameplay = () => {
    void audioService.unlock();
    void audioService.playSfx("startClick");
    enterLevelGameplay();
  };

  return (
    <main className="flow-scene flow-scene--start">
      <div className="stage-shell">
        <section className="stage-frame stage-frame--flow" aria-label="开始界面舞台">
          <div className="flow-stage-content flow-stage-content--start-only">
            <button type="button" className="flow-image-button flow-primary-button flow-start-button" onClick={handleEnterGameplay} aria-label={startLevelLabel}>
              <img className="flow-button-image" src="/ui/flow-button.png" alt="" aria-hidden="true" />
              <span className="flow-button-label flow-button-label--primary">{startLevelLabel}</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
