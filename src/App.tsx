import { useEffect } from "react";
import { useGameStore } from "./store/useGameStore";
import { GamePlayView } from "./views/GamePlayView";
import { LevelResultView } from "./views/LevelResultView";
import { LevelStartView } from "./views/LevelStartView";

function syncSceneFromHash(hash: string) {
  const store = useGameStore.getState();

  if (store.selectedLevelId !== "level3") {
    store.selectLevel("level3");
  }

  if (hash !== "#level3" || store.currentLevelId !== "level3" || !store.gameState) {
    store.startSelectedLevel();
  }
}

export default function App() {
  const scene = useGameStore((state) => state.scene);
  const levelFlowScreen = useGameStore((state) => state.levelFlowScreen);
  const currentLevelId = useGameStore((state) => state.currentLevelId);
  const gameState = useGameStore((state) => state.gameState);

  useEffect(() => {
    const handleHashChange = () => {
      syncSceneFromHash(window.location.hash);
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    const nextHash = currentLevelId ? `#${currentLevelId}` : "#level3";

    if (window.location.hash === nextHash) {
      return;
    }

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }, [currentLevelId, scene]);

  if (gameState?.status === "failed") {
    return <LevelResultView />;
  }

  if (gameState?.status === "clear") {
    return <LevelResultView />;
  }

  if (scene === "playing" && levelFlowScreen !== "gameplay") {
    return <LevelStartView />;
  }

  if (scene === "playing") {
    return <GamePlayView />;
  }

  return null;
}
