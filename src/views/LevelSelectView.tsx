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
  const playedLevelIds = useGameStore((state) => state.playedLevelIds);
  const selectedLevelId = useGameStore((state) => state.selectedLevelId);
  const currentLevelId = useGameStore((state) => state.currentLevelId);
  const selectLevel = useGameStore((state) => state.selectLevel);
  const startSelectedLevel = useGameStore((state) => state.startSelectedLevel);
  const playedLevelIdSet = new Set(playedLevelIds);

  const handleSelectLevel = (levelId: (typeof levels)[number]["id"], isPlayable: boolean) => {
    if (!isPlayable) {
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
                  const isPlayed = playedLevelIdSet.has(level.id);
                  const isPlayable = level.selectionEntry.isEnabled && isPlayed;
                  const isActive = level.id === currentLevelId || level.id === selectedLevelId;
                  const stateClassName = isPlayable
                    ? " is-played"
                    : level.selectionEntry.isEnabled
                      ? " is-unplayed"
                      : " is-disabled";
                  const ariaLabel = level.selectionEntry.isEnabled
                    ? isPlayable
                      ? `进入第 ${level.selectionEntry.label} 关`
                      : `第 ${level.selectionEntry.label} 关未游玩，暂不可进入`
                    : `第 ${level.selectionEntry.label} 关未接入`;

                  return (
                    <button
                      key={level.id}
                      type="button"
                      role="listitem"
                      className={`level-select-card${stateClassName}${isActive ? " is-active" : ""}`}
                      onClick={() => handleSelectLevel(level.id, isPlayable)}
                      disabled={!isPlayable}
                      aria-label={ariaLabel}
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
