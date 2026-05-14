import { Board } from "../engine/Board";
import { gameStoreSelectors, useGameStore } from "../store/useGameStore";
import { BorderEditorPanel } from "./BorderEditorPanel";

export function GamePlayView() {
  const gameState = useGameStore(gameStoreSelectors.selectGameState);
  const backToSelect = useGameStore((state) => state.backToSelect);
  const backToMenu = useGameStore((state) => state.backToMenu);

  if (!gameState) {
    return (
      <main className="shell">
        <section className="entry-card">
          <h1>场景未就绪</h1>
          <p>当前 store 尚未生成第 3 关 gameState，请先回到选关页重新进入。</p>
          <div className="action-row">
            <button type="button" className="ghost-button" onClick={backToSelect}>
              返回选关
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="play-scene">
      <Board gameState={gameState} />

      <section className="ui-shell ui-shell--left" aria-label="HUD placeholder">
        <span className="eyebrow">UI Placeholder</span>
        <h2>第 3 关 HUD 占位</h2>
        <ul>
          <li>hp: {gameState.hp}</li>
          <li>initialSpeed: {gameState.initialSpeed}</li>
          <li>isInputLocked: {String(gameState.isInputLocked)}</li>
          <li>status: {gameState.status}</li>
        </ul>
      </section>

      <BorderEditorPanel />

      <section className="ui-shell ui-shell--bottom" aria-label="Overlay controls">
        <span className="eyebrow">Overlay Placeholder</span>
        <div className="action-row action-row--overlay">
          <button type="button" className="ghost-button" onClick={backToSelect}>
            返回选关
          </button>
          <button type="button" className="ghost-button" onClick={backToMenu}>
            返回菜单
          </button>
        </div>
      </section>
    </main>
  );
}
