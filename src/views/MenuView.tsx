import { useGameStore } from "../store/useGameStore";

export function MenuView() {
  const setScene = useGameStore((state) => state.setScene);
  const levels = useGameStore((state) => state.levels);

  return (
    <main className="shell">
      <section className="entry-card">
        <span className="eyebrow">React + TypeScript + Zustand + Vite</span>
        <h1>Ball Game Web Demo</h1>
        <p>第 3 关最小工程骨架已落位，当前保留 menu / select / playing 三态场景壳。</p>
        <ul>
          <li>Levels Loaded: {levels.length}</li>
          <li>Store: Zustand 全局状态已接入</li>
          <li>Render: DOM / CSS 玩法层与 UI 层分离</li>
        </ul>

        <button type="button" className="primary-button" onClick={() => setScene("select")}>
          进入关卡选择
        </button>
      </section>
    </main>
  );
}
