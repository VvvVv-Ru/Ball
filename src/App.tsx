import { useEffect, useState } from "react";
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
  const [isClearResultReady, setIsClearResultReady] = useState(false);

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

  useEffect(() => {
    if (gameState?.status !== "clear") {
      setIsClearResultReady(false);
      return undefined;
    }

    const ringDurationMs = gameState.tuningConfig.borderImpactRing.enabled
      ? gameState.tuningConfig.borderImpactRing.durationMs
      : 0;
    const matchParticleDurationMs = gameState.tuningConfig.matchImpactParticles.enabled
      ? gameState.tuningConfig.matchImpactParticles.lifetimeMs
      : 0;
    const clearResultDelayMs = Math.max(ringDurationMs, matchParticleDurationMs);

    if (clearResultDelayMs <= 0) {
      setIsClearResultReady(true);
      return undefined;
    }

    setIsClearResultReady(false);
    const timeoutId = window.setTimeout(() => {
      setIsClearResultReady(true);
    }, clearResultDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    gameState?.status,
    gameState?.tuningConfig.borderImpactRing.durationMs,
    gameState?.tuningConfig.borderImpactRing.enabled,
    gameState?.tuningConfig.matchImpactParticles.enabled,
    gameState?.tuningConfig.matchImpactParticles.lifetimeMs,
  ]);

  if (gameState?.status === "failed") {
    return <LevelFailView />;
  }

  if (gameState?.status === "clear") {
    if (!isClearResultReady) {
      return <GamePlayView />;
    }

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
