import type { GameState } from "../types/game";

function getElapsedMs(timerStartedAt: number, now: number) {
  return Math.max(0, now - timerStartedAt);
}

function getElapsedSeconds(timerStartedAt: number, now: number) {
  return Math.floor(getElapsedMs(timerStartedAt, now) / 1000);
}

export function startLevelTimer(gameState: GameState, startedAt: number): GameState {
  if (gameState.isTimerRunning || gameState.timerStartedAt !== null || gameState.status !== "ready") {
    return gameState;
  }

  return {
    ...gameState,
    elapsedTimeMs: 0,
    elapsedTimeSeconds: 0,
    timerStartedAt: startedAt,
    isTimerRunning: true,
    finalElapsedTimeMs: null,
    finalElapsedTimeSeconds: null,
  };
}

export function syncLevelTimer(gameState: GameState, now: number): GameState {
  if (!gameState.isTimerRunning || gameState.timerStartedAt === null) {
    return gameState;
  }

  const elapsedTimeMs = getElapsedMs(gameState.timerStartedAt, now);
  const elapsedTimeSeconds = getElapsedSeconds(gameState.timerStartedAt, now);

  if (elapsedTimeMs === gameState.elapsedTimeMs && elapsedTimeSeconds === gameState.elapsedTimeSeconds) {
    return gameState;
  }

  return {
    ...gameState,
    elapsedTimeMs,
    elapsedTimeSeconds,
  };
}

export function stopLevelTimer(gameState: GameState, stoppedAt: number): GameState {
  const elapsedTimeMs = gameState.timerStartedAt === null
    ? gameState.elapsedTimeMs
    : getElapsedMs(gameState.timerStartedAt, stoppedAt);
  const elapsedTimeSeconds = gameState.timerStartedAt === null
    ? gameState.elapsedTimeSeconds
    : getElapsedSeconds(gameState.timerStartedAt, stoppedAt);

  if (
    !gameState.isTimerRunning
    && gameState.elapsedTimeMs === elapsedTimeMs
    && gameState.elapsedTimeSeconds === elapsedTimeSeconds
    && gameState.finalElapsedTimeMs === elapsedTimeMs
    && gameState.finalElapsedTimeSeconds === elapsedTimeSeconds
  ) {
    return gameState;
  }

  return {
    ...gameState,
    elapsedTimeMs,
    elapsedTimeSeconds,
    isTimerRunning: false,
    finalElapsedTimeMs: elapsedTimeMs,
    finalElapsedTimeSeconds: elapsedTimeSeconds,
  };
}
