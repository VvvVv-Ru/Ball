import { useEffect, useRef, useState } from "react";
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

function getClearResultDelayMs() {
  const gameState = useGameStore.getState().gameState;

  if (!gameState) {
    return 0;
  }

  const particleDuration = gameState.tuningConfig.matchImpactParticles.enabled
    ? gameState.tuningConfig.matchImpactParticles.lifetimeMs
    : 0;
  const ringDuration = gameState.tuningConfig.borderImpactRing.enabled
    ? gameState.tuningConfig.borderImpactRing.durationMs
    : 0;

  return Math.max(particleDuration, ringDuration);
}

export default function App() {
  const scene = useGameStore((state) => state.scene);
  const levelFlowScreen = useGameStore((state) => state.levelFlowScreen);
  const currentLevelId = useGameStore((state) => state.currentLevelId);
  const gameState = useGameStore((state) => state.gameState);
  const [isClearResultReady, setIsClearResultReady] = useState(false);
  const clearResultTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (clearResultTimeoutRef.current !== null) {
      window.clearTimeout(clearResultTimeoutRef.current);
      clearResultTimeoutRef.current = null;
    }

    if (gameState?.status !== "clear") {
      setIsClearResultReady(false);
      return undefined;
    }

    const delayMs = getClearResultDelayMs();

    if (delayMs <= 0) {
      setIsClearResultReady(true);
      return undefined;
    }

    setIsClearResultReady(false);
    clearResultTimeoutRef.current = window.setTimeout(() => {
      setIsClearResultReady(true);
      clearResultTimeoutRef.current = null;
    }, delayMs);

    return () => {
      if (clearResultTimeoutRef.current !== null) {
        window.clearTimeout(clearResultTimeoutRef.current);
        clearResultTimeoutRef.current = null;
      }
    };
  }, [gameState?.status, currentLevelId]);

  if (gameState?.status === "failed") {
    return <LevelResultView />;
  }

  if (gameState?.status === "clear" && isClearResultReady) {
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
