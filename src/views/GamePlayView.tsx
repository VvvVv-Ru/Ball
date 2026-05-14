import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Board } from "../engine/Board";
import { gameUiEventBus } from "../store/gameUiEventBus";
import { gameStoreSelectors, useGameStore } from "../store/useGameStore";
import { uiStateSelectors } from "../store/uiSelectors";
import type { BorderImpactRingConfig, BorderImpactRingEffect, BorderImpactShakeConfig, InputDirection, PointerGesturePayload, PointerInputSource, ShakeIntensity } from "../types/game";
import { UI_EVENT_NAMES } from "../types/uiContract";
import type { BorderImpactPayload } from "../types/uiContract";
import { BorderEditorPanel } from "./BorderEditorPanel";
import { useComboPopups } from "./useComboPopups";
import { useCameraFollow } from "./useCameraFollow";
import { useMatchImpactParticles } from "./useMatchImpactParticles";
import { useSoftBallVisuals } from "./useSoftBallVisuals";

const MAX_ACTIVE_BORDER_RINGS = 6;
const HUD_HEART_COUNT = 3;
const HUD_HEART_ASSETS = {
  filled: "/hud/heart-filled.png",
  empty: "/hud/heart-empty.png",
} as const;

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
    ? Boolean(target.closest(".ui-shell, .floating-actions, .border-editor-shell, .dev-debug-shell, button, input, select, textarea, label"))
    : false;
}

function getShakeRank(intensity: ShakeIntensity | null) {
  if (intensity === "medium") {
    return 2;
  }

  if (intensity === "light") {
    return 1;
  }

  return 0;
}

function formatVector(vector: { x: number; y: number } | null | undefined) {
  if (!vector) {
    return "-";
  }

  return `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}`;
}

function formatHudSeconds(seconds: number | null) {
  if (seconds === null) {
    return "0.0s";
  }

  return `${seconds.toFixed(1)}s`;
}

function createComboPopupStyle(position: { x: number; y: number }, viewport: { width: number; height: number }, durationMs: number): CSSProperties {
  return {
    left: `${(position.x / viewport.width) * 100}%`,
    top: `${(position.y / viewport.height) * 100}%`,
    "--combo-feedback-duration": `${durationMs}ms`,
  } as CSSProperties;
}

export function GamePlayView() {
  const isHudPlaceholderVisible = false;
  const isBorderEditorVisible = false;
  const currentLevelId = useGameStore(gameStoreSelectors.selectCurrentLevelId);
  const gameState = useGameStore(gameStoreSelectors.selectGameState);
  const elapsedTimeMs = useGameStore(uiStateSelectors.elapsedTimeMs);
  const elapsedTimeSeconds = useGameStore(uiStateSelectors.elapsedTimeSeconds);
  const timerStartedAt = useGameStore(uiStateSelectors.timerStartedAt);
  const isTimerRunning = useGameStore(uiStateSelectors.isTimerRunning);
  const finalElapsedTimeMs = useGameStore(uiStateSelectors.finalElapsedTimeMs);
  const finalElapsedTimeSeconds = useGameStore(uiStateSelectors.finalElapsedTimeSeconds);
  const hp = useGameStore(uiStateSelectors.hp);
  const combo = useGameStore(uiStateSelectors.combo);
  const levelState = useGameStore(uiStateSelectors.levelState);
  const isInputLocked = useGameStore(uiStateSelectors.isInputLocked);
  const currentHeadColor = useGameStore(uiStateSelectors.currentHeadColor);
  const remainingBalls = useGameStore(uiStateSelectors.remainingBalls);
  const remainingTargets = useGameStore(uiStateSelectors.remainingTargets);
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
  const [latestUiEvent, setLatestUiEvent] = useState<string>("-");
  const [stageShake, setStageShake] = useState<{ active: boolean; offsetX: number; offsetY: number; durationMs: number } | null>(null);
  const [borderImpactRings, setBorderImpactRings] = useState<BorderImpactRingEffect[]>([]);
  const shakeTimeoutRef = useRef<number | null>(null);
  const shakeRafRef = useRef<number | null>(null);
  const ringCleanupTimeoutRef = useRef<number | null>(null);
  const lastShakeStartedAtRef = useRef<number>(-Infinity);
  const activeShakeIntensityRef = useRef<ShakeIntensity | null>(null);
  const cameraFollow = useCameraFollow(gameState);
  const comboPopups = useComboPopups(gameState, cameraFollow);
  const matchImpactParticles = useMatchImpactParticles(gameState);
  const softBallVisuals = useSoftBallVisuals(gameState);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current !== null) {
        window.clearTimeout(shakeTimeoutRef.current);
      }

      if (shakeRafRef.current !== null) {
        window.cancelAnimationFrame(shakeRafRef.current);
      }

      if (ringCleanupTimeoutRef.current !== null) {
        window.clearTimeout(ringCleanupTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (ringCleanupTimeoutRef.current !== null) {
      window.clearTimeout(ringCleanupTimeoutRef.current);
      ringCleanupTimeoutRef.current = null;
    }

    if (borderImpactRings.length === 0) {
      return undefined;
    }

    const nextExpiryAt = Math.min(...borderImpactRings.map((effect) => effect.startedAt + effect.durationMs));
    const delay = Math.max(0, nextExpiryAt - performance.now());

    ringCleanupTimeoutRef.current = window.setTimeout(() => {
      const now = performance.now();
      setBorderImpactRings((current) => current.filter((effect) => effect.startedAt + effect.durationMs > now));
      ringCleanupTimeoutRef.current = null;
    }, delay + 16);

    return () => {
      if (ringCleanupTimeoutRef.current !== null) {
        window.clearTimeout(ringCleanupTimeoutRef.current);
        ringCleanupTimeoutRef.current = null;
      }
    };
  }, [borderImpactRings]);

  function triggerStageShake(config: BorderImpactShakeConfig, intensity: ShakeIntensity, occurredAt: number) {
    if (!config.enabled) {
      return;
    }

    const profile = config[intensity];
    const activeIntensity = activeShakeIntensityRef.current;
    const isCoolingDown = occurredAt - lastShakeStartedAtRef.current < profile.cooldownMs;
    const canOverrideActiveShake = getShakeRank(intensity) > getShakeRank(activeIntensity);

    if (isCoolingDown && !canOverrideActiveShake) {
      return;
    }

    if (shakeTimeoutRef.current !== null) {
      window.clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = null;
    }

    if (shakeRafRef.current !== null) {
      window.cancelAnimationFrame(shakeRafRef.current);
      shakeRafRef.current = null;
    }

    const angle = Math.random() * Math.PI * 2;
    const offsetX = Math.cos(angle) * profile.amplitude;
    const offsetY = Math.sin(angle) * profile.amplitude;

    setStageShake(null);

    shakeRafRef.current = window.requestAnimationFrame(() => {
      setStageShake({
        active: true,
        offsetX,
        offsetY,
        durationMs: profile.durationMs,
      });
      lastShakeStartedAtRef.current = occurredAt;
      activeShakeIntensityRef.current = intensity;
      shakeTimeoutRef.current = window.setTimeout(() => {
        setStageShake(null);
        activeShakeIntensityRef.current = null;
        shakeTimeoutRef.current = null;
      }, profile.durationMs);
    });
  }

  function triggerBorderImpactRing(config: BorderImpactRingConfig, payload: BorderImpactPayload) {
    if (!config.enabled) {
      return;
    }

    const now = performance.now();

    setBorderImpactRings((current) => {
      const activeEffects = current.filter((effect) => effect.startedAt + effect.durationMs > now);
      const nextEffect: BorderImpactRingEffect = {
        id: `${payload.borderId}-${payload.occurredAt}`,
        center: { ...payload.center },
        ballRadius: payload.ballRadius,
        startedAt: now,
        durationMs: config.durationMs,
        strokeWidth: config.strokeWidth,
        startScale: config.startScale,
        endScale: config.endScale,
        easing: config.easing,
        alphaFade: config.alphaFade,
      };

      return [...activeEffects, nextEffect].slice(-MAX_ACTIVE_BORDER_RINGS);
    });
  }

  useEffect(() => {
    const borderImpactShakeConfig = gameState?.tuningConfig.borderImpactShake;
    const borderImpactRingConfig = gameState?.tuningConfig.borderImpactRing;
    const unsubscribeStateChanged = gameUiEventBus.subscribe(UI_EVENT_NAMES.GAME_STATE_CHANGED, (payload) => {
      setLatestUiEvent(`GAME_STATE_CHANGED:${payload.levelState}`);
    });
    const unsubscribeAimUpdate = gameUiEventBus.subscribe(UI_EVENT_NAMES.INPUT_AIM_UPDATE, (payload) => {
      const aimLabel = payload.direction ?? `${payload.vector.x.toFixed(2)},${payload.vector.y.toFixed(2)}`;
      setLatestUiEvent(`INPUT_AIM_UPDATE:${aimLabel}/${payload.source}`);
    });
    const unsubscribeMismatch = gameUiEventBus.subscribe(UI_EVENT_NAMES.ON_COLLISION_MISMATCH, (payload) => {
      setLatestUiEvent(`ON_COLLISION_MISMATCH:${payload.borderId}/${payload.expectedColor}`);
    });
    const unsubscribeMatch = gameUiEventBus.subscribe(UI_EVENT_NAMES.ON_COLLISION_MATCH, (payload) => {
      setLatestUiEvent(`ON_COLLISION_MATCH:${payload.borderId}/${payload.color}`);
    });
    const unsubscribeDelayedBorder = gameUiEventBus.subscribe(UI_EVENT_NAMES.DELAYED_BORDER_ENTERED, (payload) => {
      setLatestUiEvent(`DELAYED_BORDER_ENTERED:${payload.borderId}/${payload.side}`);
    });
    const unsubscribeDelayedTriggered = gameUiEventBus.subscribe(UI_EVENT_NAMES.DELAYED_BORDER_TRIGGERED, (payload) => {
      setLatestUiEvent(`DELAYED_BORDER_TRIGGERED:${payload.borderId}/${payload.side}`);
    });
    const unsubscribeSpecialBounce = gameUiEventBus.subscribe(UI_EVENT_NAMES.SPECIAL_BOUNCE_RESOLVED, (payload) => {
      setLatestUiEvent(`SPECIAL_BOUNCE_RESOLVED:${payload.borderId}/${payload.remainingTargets}`);
    });
    const unsubscribeBorderImpact = gameUiEventBus.subscribe(UI_EVENT_NAMES.ON_BORDER_IMPACT, (payload) => {
      setLatestUiEvent(`ON_BORDER_IMPACT:${payload.impactKind}/${payload.shakeIntensity}`);

      if (borderImpactShakeConfig) {
        triggerStageShake(borderImpactShakeConfig, payload.shakeIntensity, payload.occurredAt);
      }

      if (borderImpactRingConfig) {
        triggerBorderImpactRing(borderImpactRingConfig, payload);
      }
    });
    const unsubscribeSoftBall = gameUiEventBus.subscribe(UI_EVENT_NAMES.SOFT_BALL_TRIGGER, (payload) => {
      setLatestUiEvent(`SOFT_BALL_TRIGGER:${payload.triggerKind}/${payload.ballId}`);
    });
    const unsubscribeInputLock = gameUiEventBus.subscribe(UI_EVENT_NAMES.INPUT_LOCK_CHANGED, (payload) => {
      setLatestUiEvent(`INPUT_LOCK_CHANGED:${String(payload.isInputLocked)}`);
    });
    const unsubscribeTimerStarted = gameUiEventBus.subscribe(UI_EVENT_NAMES.TIMER_STARTED, (payload) => {
      setLatestUiEvent(`TIMER_STARTED:${payload.elapsedTimeSeconds}`);
    });
    const unsubscribeTimerUpdated = gameUiEventBus.subscribe(UI_EVENT_NAMES.TIMER_UPDATED, (payload) => {
      setLatestUiEvent(`TIMER_UPDATED:${payload.elapsedTimeSeconds}/${String(payload.isTimerRunning)}`);
    });
    const unsubscribeCombo = gameUiEventBus.subscribe(UI_EVENT_NAMES.COMBO_CHANGED, (payload) => {
      setLatestUiEvent(`COMBO_CHANGED:${payload.previousCombo}->${payload.combo}`);
    });
    const unsubscribeHp = gameUiEventBus.subscribe(UI_EVENT_NAMES.HP_CHANGED, (payload) => {
      setLatestUiEvent(`HP_CHANGED:${payload.hp}/${payload.delta}`);
    });
    const unsubscribeLevelClear = gameUiEventBus.subscribe(UI_EVENT_NAMES.LEVEL_CLEAR, (payload) => {
      setLatestUiEvent(`LEVEL_CLEAR:${payload.reason}`);
    });
    const unsubscribeLevelFail = gameUiEventBus.subscribe(UI_EVENT_NAMES.LEVEL_FAIL, (payload) => {
      setLatestUiEvent(`LEVEL_FAIL:${payload.reason}`);
    });

    return () => {
      unsubscribeStateChanged();
      unsubscribeAimUpdate();
      unsubscribeMismatch();
      unsubscribeMatch();
      unsubscribeDelayedBorder();
      unsubscribeDelayedTriggered();
      unsubscribeSpecialBounce();
      unsubscribeBorderImpact();
      unsubscribeSoftBall();
      unsubscribeInputLock();
      unsubscribeTimerStarted();
      unsubscribeTimerUpdated();
      unsubscribeCombo();
      unsubscribeHp();
      unsubscribeLevelClear();
      unsubscribeLevelFail();
    };
  }, [gameState?.tuningConfig.borderImpactRing, gameState?.tuningConfig.borderImpactShake]);

  useEffect(() => {
    if (!currentLevelId) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTION_MAP[event.key];

      if (!direction) {
        return;
      }

      if (gameState?.isInputLocked) {
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
    if (!gameState || gameState.isInputLocked || !event.isPrimary || isBlockedPointerTarget(event.target)) {
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

  const headBall = gameState.ballQueue.balls[gameState.headIndex] ?? null;
  const displayedElapsedTimeSeconds = (finalElapsedTimeMs ?? elapsedTimeMs) / 1000;
  const heartSlots = Array.from({ length: HUD_HEART_COUNT }, (_, index) => ({
    id: `hud-heart-${index}`,
    isFilled: index < hp,
  }));
  const isHeadOutOfBounds = headBall
    ? headBall.position.x - headBall.radius < 0 ||
      headBall.position.x + headBall.radius > gameState.viewport.width ||
      headBall.position.y - headBall.radius < 0 ||
      headBall.position.y + headBall.radius > gameState.viewport.height
    : false;

  return (
    <main
      className="play-scene"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <Board
        gameState={gameState}
        stageShake={stageShake}
        cameraFollow={cameraFollow}
        borderImpactRings={borderImpactRings}
        matchImpactParticles={matchImpactParticles}
        softBallVisuals={softBallVisuals}
        overlay={(
          <Fragment>
            <section
              className="gameplay-hud"
              aria-label="Level HUD"
              data-ui-mount="hud-primary"
              data-ui-consumer="selectors-events"
            >
              <div className="gameplay-hud__timer-display">
                <strong className="gameplay-hud__timer-value">{formatHudSeconds(displayedElapsedTimeSeconds)}</strong>
              </div>

              <div className="gameplay-hud__hearts-display" aria-label={`体力 ${hp}/${HUD_HEART_COUNT}`}>
                <div className="gameplay-hud__hearts-row">
                  {heartSlots.map((heart) => (
                    <img
                      key={heart.id}
                      className={`gameplay-hud__heart${heart.isFilled ? " is-filled" : " is-empty"}`}
                      src={heart.isFilled ? HUD_HEART_ASSETS.filled : HUD_HEART_ASSETS.empty}
                      alt=""
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </section>

            <div className="combo-feedback-layer" aria-hidden="true">
              {comboPopups.map((popup) => (
                <div
                  key={popup.id}
                  className={`combo-feedback-popup is-lane-${popup.lane}`}
                  style={createComboPopupStyle(popup.position, gameState.viewport, popup.durationMs)}
                >
                  <span className="combo-feedback-popup__label">{popup.label}</span>
                </div>
              ))}
            </div>
          </Fragment>
        )}
      />

      <section
        className="ui-shell ui-shell--left"
        aria-label="HUD placeholder"
        aria-hidden={!isHudPlaceholderVisible}
        data-ui-mount="hud"
        data-ui-consumer="selectors-events"
        hidden={!isHudPlaceholderVisible}
      >
        <span className="eyebrow">UI Placeholder</span>
        <h2>第 3 关 HUD 占位</h2>
        <ul>
          <li>elapsedTimeSeconds: {elapsedTimeSeconds}</li>
          <li>timerStartedAt: {timerStartedAt ?? "-"}</li>
          <li>isTimerRunning: {String(isTimerRunning)}</li>
          <li>finalElapsedTimeSeconds: {finalElapsedTimeSeconds ?? "-"}</li>
          <li>hp: {hp}</li>
          <li>combo: {combo}</li>
          <li>levelState: {levelState}</li>
          <li>clearReason: {gameState.clearReason ?? "-"}</li>
          <li>failReason: {gameState.failReason ?? "-"}</li>
          <li>outOfBounds: {String(isHeadOutOfBounds)}</li>
          <li>isInputLocked: {String(isInputLocked)}</li>
          <li>currentHeadColor: {currentHeadColor ?? "-"}</li>
          <li>remainingBalls: {remainingBalls}</li>
          <li>remainingTargets: {remainingTargets}</li>
          <li>latestUiEvent: {latestUiEvent}</li>
          <li>shakeEnabled: {String(gameState.tuningConfig.borderImpactShake.enabled)}</li>
          <li>shakeLightAmplitude: {gameState.tuningConfig.borderImpactShake.light.amplitude}</li>
          <li>shakeMediumAmplitude: {gameState.tuningConfig.borderImpactShake.medium.amplitude}</li>
          <li>cameraFollowEnabled: {String(gameState.tuningConfig.cameraFollow.enabled)}</li>
          <li>cameraDeadZonePx: {gameState.tuningConfig.cameraFollow.deadZonePx}</li>
          <li>cameraMaxOffsetX: {gameState.tuningConfig.cameraFollow.maxOffsetX}</li>
          <li>cameraMaxOffsetY: {gameState.tuningConfig.cameraFollow.maxOffsetY}</li>
          <li>cameraFollowLerp: {gameState.tuningConfig.cameraFollow.followLerp}</li>
          <li>cameraReturnLerp: {gameState.tuningConfig.cameraFollow.returnLerp}</li>
          <li>cameraActive: {String(cameraFollow.isActive)}</li>
          <li>cameraOffset: {cameraFollow.offsetX.toFixed(1)}, {cameraFollow.offsetY.toFixed(1)}</li>
          <li>cameraTarget: {cameraFollow.targetX.toFixed(1)}, {cameraFollow.targetY.toFixed(1)}</li>
          <li>ringEnabled: {String(gameState.tuningConfig.borderImpactRing.enabled)}</li>
          <li>ringStrokeWidth: {gameState.tuningConfig.borderImpactRing.strokeWidth}</li>
          <li>ringDurationMs: {gameState.tuningConfig.borderImpactRing.durationMs}</li>
          <li>activeImpactRings: {borderImpactRings.length}</li>
          <li>matchParticlesEnabled: {String(gameState.tuningConfig.matchImpactParticles.enabled)}</li>
          <li>matchParticleCount: {gameState.tuningConfig.matchImpactParticles.particleCount}</li>
          <li>matchParticleLifetimeMs: {gameState.tuningConfig.matchImpactParticles.lifetimeMs}</li>
          <li>activeMatchParticles: {matchImpactParticles.length}</li>
          <li>softBallEnabled: {String(gameState.tuningConfig.softBall.enabled)}</li>
          <li>softBallHeadOnly: {String(gameState.tuningConfig.softBall.headOnly)}</li>
          <li>softBallMaxSquash: {gameState.tuningConfig.softBall.maxSquash}</li>
          <li>softBallMaxStretch: {gameState.tuningConfig.softBall.maxStretch}</li>
          <li>softBallReboundMs: {gameState.tuningConfig.softBall.reboundDurationMs}</li>
          <li>softBallSecondaryMs: {gameState.tuningConfig.softBall.secondaryBounceDurationMs}</li>
          <li>delayedBorderState: {gameState.rule.delayedBorderState}</li>
          <li>pendingBorderId: {gameState.rule.pendingBorderId ?? "-"}</li>
          <li>specialBounceTriggered: {String(gameState.rule.specialBounceTriggered)}</li>
          <li>remainingBorders: {remainingTargets}</li>
          <li>removedBallId: {gameState.rule.lastRemovedBallId ?? "-"}</li>
          <li>removedBallOrder: {gameState.rule.lastRemovedBallOrder ?? "-"}</li>
          <li>lastCollisionSide: {gameState.collision.lastCollisionSide ?? "-"}</li>
          <li>lastCollisionType: {gameState.collision.lastCollisionType ?? "-"}</li>
          <li>lastCollisionBorderId: {gameState.collision.lastCollisionBorderId ?? "-"}</li>
          <li>collisionBorderColor: {gameState.collision.lastCollisionBorderColor ?? "-"}</li>
          <li>collisionHeadColor: {gameState.collision.lastCollisionHeadColor ?? "-"}</li>
          <li>
            reflection: {gameState.collision.lastReflectionBefore?.x ?? "-"},{gameState.collision.lastReflectionBefore?.y ?? "-"}
            {" -> "}
            {gameState.collision.lastReflectionAfter?.x ?? "-"},{gameState.collision.lastReflectionAfter?.y ?? "-"}
          </li>
          <li>minSpeed: {gameState.tuningConfig.swipeLaunch.minSpeed}</li>
          <li>maxSpeed: {gameState.tuningConfig.swipeLaunch.maxSpeed}</li>
          <li>minSwipeDistance: {gameState.tuningConfig.swipeLaunch.minSwipeDistance}</li>
          <li>maxSwipeDistance: {gameState.tuningConfig.swipeLaunch.maxSwipeDistance}</li>
          <li>isLaunched: {String(motionState?.isLaunched ?? false)}</li>
          <li>velocity: {formatVector(motionState?.velocity)}</li>
          <li>gravity: {formatVector(motionState?.gravity)}</li>
          <li>maxSubstepMs: {motionState?.maxSubstepMs ?? 0}</li>
          <li>bounceRestitution: {motionState?.bounceRestitution ?? 0}</li>
          <li>currentVector: {formatVector(motionState?.currentVector)}</li>
          <li>currentSpeed: {motionState?.currentSpeed ?? 0}</li>
          <li>queueLength: {gameState.ballQueue.balls.length}</li>
          <li>queueGap: {gameState.ballQueue.surfaceGap}</li>
          <li>maxQueueStretch: {motionState?.maxQueueStretch.toFixed(2) ?? "0.00"}</li>
          <li>lastRedirectAt: {motionState?.lastRedirectAt ?? "-"}</li>
          <li>redirectCooldownMs: {motionState?.redirectCooldownMs ?? 0}</li>
          <li>isRedirectCooling: {String(motionState?.isRedirectCooling ?? false)}</li>
          <li>lastAcceptedVector: {formatVector(motionState?.lastAcceptedVector)}</li>
          <li>
            headPosition: {gameState.ballQueue.balls[gameState.headIndex]?.position.x.toFixed(1) ?? "-"},
            {gameState.ballQueue.balls[gameState.headIndex]?.position.y.toFixed(1) ?? "-"}
          </li>
          <li>lastInputDirection: {inputState?.lastInputDirection ?? "free-aim"}</li>
          <li>lastInputVector: {formatVector(inputState?.lastInputVector)}</li>
          <li>lastInputAt: {inputState?.lastInputAt ?? "-"}</li>
          <li>inputCount: {inputState?.inputCount ?? 0}</li>
          <li>pointerType: {pointerGesture?.pointerType ?? "-"}</li>
          <li>pointerDistance: {pointerGesture ? pointerGesture.currentDistance.toFixed(1) : "0.0"}</li>
          <li>thresholdReached: {String(pointerGesture?.hasReachedThreshold ?? false)}</li>
          <li>gestureTriggered: {String(pointerGesture?.hasTriggeredInCurrentGesture ?? false)}</li>
        </ul>
      </section>

      {isBorderEditorVisible ? <BorderEditorPanel /> : null}

      <div
        className="floating-actions"
        aria-label="Overlay controls"
        data-ui-mount="overlay"
        data-ui-consumer="selectors-events"
      >
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
