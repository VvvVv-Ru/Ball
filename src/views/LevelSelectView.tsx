import { useGameStore } from "../store/useGameStore";

export function LevelSelectView() {
  const levels = useGameStore((state) => state.levels);
  const selectedLevelId = useGameStore((state) => state.selectedLevelId);
  const selectLevel = useGameStore((state) => state.selectLevel);
  const startSelectedLevel = useGameStore((state) => state.startSelectedLevel);
  const backToMenu = useGameStore((state) => state.backToMenu);

  return (
    <main className="shell">
      <section className="entry-card">
        <span className="eyebrow">Scene / select</span>
        <h1>选择关卡</h1>
        <p>当前只接入第 3 关，后续可继续在 data/store 层扩展关卡列表。</p>

        <div className="level-list">
          {levels.map((level) => (
            <button
              key={level.id}
              type="button"
              className={`level-chip${selectedLevelId === level.id ? " is-active" : ""}`}
              onClick={() => selectLevel(level.id)}
            >
              {level.name}
            </button>
          ))}
        </div>

        <div className="action-row">
          <button type="button" className="ghost-button" onClick={backToMenu}>
            返回菜单
          </button>
          <button type="button" className="primary-button" onClick={startSelectedLevel}>
            进入第 3 关
          </button>
        </div>
      </section>
    </main>
  );
}
