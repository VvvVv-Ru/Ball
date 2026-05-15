import { audioService } from "../audio/audioService";
import { useGameStore } from "../store/useGameStore";

function LockIcon() {
  return (
    <svg className="level-select-card__lock" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" opacity="0.18" />
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function LevelSelectView() {
  const levels = useGameStore((state) => state.levels);
  const selectedLevelId = useGameStore((state) => state.selectedLevelId);
  const currentLevelId = useGameStore((state) => state.currentLevelId);
  const selectLevel = useGameStore((state) => state.selectLevel);
  const startSelectedLevel = useGameStore((state) => state.startSelectedLevel);

  const handleSelectLevel = (levelId: (typeof levels)[number]["id"], isEnabled: boolean) => {
    if (!isEnabled) {
      return;
    }

    void audioService.unlock();
    void audioService.playSfx("startClick");
    selectLevel(levelId);
    startSelectedLevel();
  };

  return (
    <main className="flow-scene flow-scene--level-select">
      <div className="stage-shell">
        <section className="stage-frame stage-frame--flow" aria-label="选关界面舞台">
          <div className="flow-stage-content flow-stage-content--level-select">
            <div className="level-select-panel">
              <div className="level-select-grid" role="list" aria-label="12 个关卡入口">
                {levels.map((level) => {
                  const isActive = level.id === currentLevelId || level.id === selectedLevelId;

                  return (
                    <button
                      key={level.id}
                      type="button"
                      role="listitem"
                      className={`level-select-card${level.selectionEntry.isEnabled ? " is-enabled" : " is-disabled"}${isActive ? " is-active" : ""}`}
                      onClick={() => handleSelectLevel(level.id, level.selectionEntry.isEnabled)}
                      disabled={!level.selectionEntry.isEnabled}
                      aria-label={level.selectionEntry.isEnabled ? `进入第 ${level.selectionEntry.label} 关` : `第 ${level.selectionEntry.label} 关未接入`}
                    >
                      {level.selectionEntry.isEnabled ? (
                        <span className="level-select-card__label">{level.selectionEntry.label}</span>
                      ) : (
                        <LockIcon />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
