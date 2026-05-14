import { useEffect } from "react";
import { useGameStore } from "./store/useGameStore";
import { GamePlayView } from "./views/GamePlayView";
import { LevelSelectView } from "./views/LevelSelectView";
import { MenuView } from "./views/MenuView";

function syncSceneFromHash(hash: string) {
  const store = useGameStore.getState();

  if (hash === "#level3") {
    if (store.selectedLevelId !== "level3") {
      store.selectLevel("level3");
    }

    if (store.scene !== "playing" || store.currentLevelId !== "level3") {
      store.startSelectedLevel();
    }

    return;
  }

  if (hash === "#select") {
    if (store.scene !== "select") {
      store.setScene("select");
    }

    return;
  }

  if (store.scene !== "menu") {
    store.backToMenu();
  }
}

export default function App() {
  const scene = useGameStore((state) => state.scene);
  const currentLevelId = useGameStore((state) => state.currentLevelId);

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
    const nextHash = scene === "playing" && currentLevelId ? `#${currentLevelId}` : scene === "select" ? "#select" : "";

    if (window.location.hash === nextHash) {
      return;
    }

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
  }, [currentLevelId, scene]);

  if (scene === "playing") {
    return <GamePlayView />;
  }

  if (scene === "select") {
    return <LevelSelectView />;
  }

  return <MenuView />;
}
