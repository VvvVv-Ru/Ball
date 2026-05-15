import { audioService } from "../audio/audioService";
import { useGameStore } from "../store/useGameStore";

export function LevelStartView() {
  const enterLevelSelect = useGameStore((state) => state.enterLevelSelect);

  const handleEnterLevelSelect = () => {
    void audioService.unlock();
    void audioService.playSfx("startClick");
    enterLevelSelect();
  };

  return (
    <main className="flow-scene flow-scene--start">
      <div className="stage-shell">
        <section className="stage-frame stage-frame--flow" aria-label="开始界面舞台">
          <div className="flow-stage-content flow-stage-content--start-only">
            <button type="button" className="flow-image-button flow-primary-button flow-start-button" onClick={handleEnterLevelSelect} aria-label="关卡选择">
              <img className="flow-button-image" src="/ui/flow-button.png" alt="" aria-hidden="true" />
              <span className="flow-button-label flow-button-label--primary">关卡选择</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
