import { useEffect } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Board } from "../engine/Board";
import { gameStoreSelectors, useGameStore } from "../store/useGameStore";
import type { InputDirection, PointerGesturePayload, PointerInputSource } from "../types/game";
import { BorderEditorPanel } from "./BorderEditorPanel";

const KEY_DIRECTION_MAP: Record<string, InputDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right",
};

function normalizePointerType(pointerType: string): PointerInputSource {
  if (pointerType === "mouse" || pointerType === "touch" || pointerType === "pen") {
    return pointerType;
  }

  return "unknown";
}

function createPointerPayload(event: ReactPointerEvent<HTMLElement>): PointerGesturePayload {
  return {
    position: {
      x: event.clientX,
      y: event.clientY,
    },
    pointerType: normalizePointerType(event.pointerType),
    at: event.timeStamp,
  };
}

function isBlockedPointerTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest(".ui-shell, .floating-actions, .border-editor-shell, button, input, select, textarea, label"))
    : false;
}

export function GamePlayView() {
  const currentLevelId = useGameStore(gameStoreSelectors.selectCurrentLevelId);
  const gameState = useGameStore(gameStoreSelectors.selectGameState);
  const inputState = useGameStore(gameStoreSelectors.selectInputState);
  const motionState = useGameStore(gameStoreSelectors.selectMotionState);
  const pointerGesture = useGameStore(gameStoreSelectors.selectPointerGesture);
  const applyInput = useGameStore((state) => state.applyInput);
  const tickMotion = useGameStore((state) => state.tickMotion);
  const startPointerGesture = useGameStore((state) => state.startPointerGesture);
  const updatePointerGesture = useGameStore((state) => state.updatePointerGesture);
  const endPointerGesture = useGameStore((state) => state.endPointerGesture);
  const cancelPointerGesture = useGameStore((state) => state.cancelPointerGesture);
  const backToSelect = useGameStore((state) => state.backToSelect);
  const backToMenu = useGameStore((state) => state.backToMenu);

  useEffect(() => {
    if (!currentLevelId) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTION_MAP[event.key];

      if (!direction) {
        return;
      }

      event.preventDefault();
      applyInput(direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [applyInput, gameState]);

  useEffect(() => {
    if (!gameState) {
      return undefined;
    }

    let frameId = 0;

    const loop = (now: number) => {
      tickMotion(now);
      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [currentLevelId, tickMotion]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!gameState || !event.isPrimary || isBlockedPointerTarget(event.target)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    startPointerGesture(createPointerPayload(event));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!gameState || !event.isPrimary || !gameState.input.pointer.isPointerActive) {
      return;
    }

    event.preventDefault();
    updatePointerGesture(createPointerPayload(event));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (!gameState || !event.isPrimary) {
      return;
    }

    if (gameState.input.pointer.isPointerActive) {
      event.preventDefault();
      endPointerGesture(createPointerPayload(event));
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.isPrimary) {
      return;
    }

    cancelPointerGesture();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

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
    <main
      className="play-scene"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <Board gameState={gameState} />

      <section className="ui-shell ui-shell--left" aria-label="HUD placeholder">
        <span className="eyebrow">UI Placeholder</span>
        <h2>第 3 关 HUD 占位</h2>
        <ul>
          <li>hp: {gameState.hp}</li>
          <li>initialSpeed: {gameState.initialSpeed}</li>
          <li>isInputLocked: {String(gameState.isInputLocked)}</li>
          <li>status: {gameState.status}</li>
          <li>isLaunched: {String(motionState?.isLaunched ?? false)}</li>
          <li>currentDirection: {motionState?.currentDirection ?? "-"}</li>
          <li>currentSpeed: {motionState?.currentSpeed ?? 0}</li>
          <li>
            headPosition: {gameState.ballQueue.balls[gameState.headIndex]?.position.x.toFixed(1) ?? "-"},
            {gameState.ballQueue.balls[gameState.headIndex]?.position.y.toFixed(1) ?? "-"}
          </li>
          <li>lastInputDirection: {inputState?.lastInputDirection ?? "-"}</li>
          <li>lastInputAt: {inputState?.lastInputAt ?? "-"}</li>
          <li>inputCount: {inputState?.inputCount ?? 0}</li>
          <li>pointerType: {pointerGesture?.pointerType ?? "-"}</li>
          <li>pointerDistance: {pointerGesture ? pointerGesture.currentDistance.toFixed(1) : "0.0"}</li>
          <li>thresholdReached: {String(pointerGesture?.hasReachedThreshold ?? false)}</li>
          <li>gestureTriggered: {String(pointerGesture?.hasTriggeredInCurrentGesture ?? false)}</li>
        </ul>
      </section>

      <BorderEditorPanel />

      <div className="floating-actions" aria-label="Overlay controls">
        <button type="button" className="ghost-button" onClick={backToSelect}>
          返回选关
        </button>
        <button type="button" className="ghost-button" onClick={backToMenu}>
          返回菜单
        </button>
      </div>
    </main>
  );
}
