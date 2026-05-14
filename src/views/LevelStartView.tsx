import { useGameStore } from "../store/useGameStore";
import { uiStateSelectors } from "../store/uiSelectors";

export function LevelStartView() {
  const currentLevelName = useGameStore(uiStateSelectors.currentLevelName);
  const enterLevelGameplay = useGameStore((state) => state.enterLevelGameplay);

  return (
    <main className="flow-scene flow-scene--start">
      <div className="stage-shell">
        <section className="stage-frame stage-frame--flow" aria-label="开始界面舞台">
          <div className="flow-stage-content flow-stage-content--start-only">
            <button type="button" className="flow-image-button flow-start-button" onClick={enterLevelGameplay} aria-label={currentLevelName}>
              <img className="flow-button-image" src="/ui/flow-button.png" alt="" aria-hidden="true" />
              <span className="flow-button-label">{currentLevelName}</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
