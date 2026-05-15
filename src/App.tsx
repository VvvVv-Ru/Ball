import { useEffect } from "react";
import { audioService } from "./audio/audioService";
import { useGameStore } from "./store/useGameStore";
import { LevelFailView } from "./views/LevelFailView";
import { GamePlayView } from "./views/GamePlayView";
import { LevelResultView } from "./views/LevelResultView";
import { LevelSelectView } from "./views/LevelSelectView";
import { LevelStartView } from "./views/LevelStartView";

export default function App() {
  const scene = useGameStore((state) => state.scene);
  const levelFlowScreen = useGameStore((state) => state.levelFlowScreen);
  const gameState = useGameStore((state) => state.gameState);

  useEffect(() => {
    const ensureGlobalBgm = () => {
      void audioService.playBgm("gameplay");
    };

    ensureGlobalBgm();

    const retryAutoplay = () => {
      ensureGlobalBgm();
    };

    window.addEventListener("pointerdown", retryAutoplay);
    window.addEventListener("keydown", retryAutoplay);

    return () => {
      window.removeEventListener("pointerdown", retryAutoplay);
      window.removeEventListener("keydown", retryAutoplay);
    };
  }, []);

  useEffect(() => {
    return () => {
      audioService.stopAll();
    };
  }, []);

  if (gameState?.status === "failed") {
    return <LevelFailView />;
  }

  if (gameState?.status === "clear") {
    return <LevelResultView />;
  }

  if (scene === "playing" && levelFlowScreen === "start") {
    return <LevelStartView />;
  }

  if (scene === "playing" && levelFlowScreen === "level-select") {
    return <LevelSelectView />;
  }

  if (scene === "playing") {
    return <GamePlayView />;
  }

  return <LevelStartView />;
}
