import { useEffect, useMemo, useRef, useState } from "react";
import type { CameraFollowVisualState, GameState, Vector2, ViewportConfig } from "../types/game";
import { gameUiEventBus } from "../store/gameUiEventBus";
import { UI_EVENT_NAMES } from "../types/uiContract";

const MAX_ACTIVE_COMBO_POPUPS = 5;
const COMBO_POPUP_DURATION_MS = 760;
const COMBO_POPUP_WIDTH_PX = 220;
const COMBO_POPUP_HEIGHT_PX = 52;
const COMBO_POPUP_EDGE_PADDING_PX = 20;
const COMBO_POPUP_BASE_OFFSET_Y = 52;
const COMBO_POPUP_STACK_GAP_Y = 34;
const COMBO_POPUP_STACK_GAP_X = 28;
const COMBO_POPUP_NEARBY_RADIUS_X = 160;
const COMBO_POPUP_NEARBY_RADIUS_Y = 120;

interface ComboPopupEffect {
  id: string;
  label: string;
  position: Vector2;
  anchorBase: Vector2;
  lane: number;
  startedAt: number;
  durationMs: number;
}

export interface ComboPopupVisual {
  id: string;
  label: string;
  position: Vector2;
  lane: number;
  durationMs: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pruneEffects(effects: ComboPopupEffect[], now: number) {
  return effects.filter((effect) => effect.startedAt + effect.durationMs > now);
}

function countNearbyEffects(effects: ComboPopupEffect[], anchorBase: Vector2) {
  return effects.filter((effect) => (
    Math.abs(effect.anchorBase.x - anchorBase.x) <= COMBO_POPUP_NEARBY_RADIUS_X
    && Math.abs(effect.anchorBase.y - anchorBase.y) <= COMBO_POPUP_NEARBY_RADIUS_Y
  )).length;
}

function resolvePopupPosition(
  headPosition: Vector2,
  viewport: ViewportConfig,
  cameraFollow: CameraFollowVisualState | null,
  activeEffects: ComboPopupEffect[],
) {
  const anchorBase = {
    x: headPosition.x + (cameraFollow?.offsetX ?? 0),
    y: headPosition.y + (cameraFollow?.offsetY ?? 0),
  } satisfies Vector2;
  const nearbyCount = countNearbyEffects(activeEffects, anchorBase);
  const lane = nearbyCount % 3;
  const laneDirection = lane === 1 ? -1 : lane === 2 ? 1 : 0;
  const unclampedPosition = {
    x: anchorBase.x + laneDirection * COMBO_POPUP_STACK_GAP_X,
    y: anchorBase.y - COMBO_POPUP_BASE_OFFSET_Y - nearbyCount * COMBO_POPUP_STACK_GAP_Y,
  } satisfies Vector2;

  return {
    lane,
    anchorBase,
    position: {
      x: clamp(
        unclampedPosition.x,
        COMBO_POPUP_EDGE_PADDING_PX + COMBO_POPUP_WIDTH_PX / 2,
        viewport.width - COMBO_POPUP_EDGE_PADDING_PX - COMBO_POPUP_WIDTH_PX / 2,
      ),
      y: clamp(
        unclampedPosition.y,
        COMBO_POPUP_EDGE_PADDING_PX + COMBO_POPUP_HEIGHT_PX / 2,
        viewport.height - COMBO_POPUP_EDGE_PADDING_PX - COMBO_POPUP_HEIGHT_PX / 2,
      ),
    } satisfies Vector2,
  };
}

export function useComboPopups(gameState: GameState | null, cameraFollow: CameraFollowVisualState | null) {
  const [effects, setEffects] = useState<ComboPopupEffect[]>([]);
  const cleanupTimeoutRef = useRef<number | null>(null);
  const gameStateRef = useRef(gameState);
  const cameraFollowRef = useRef(cameraFollow);

  useEffect(() => {
    gameStateRef.current = gameState;
    cameraFollowRef.current = cameraFollow;
  }, [cameraFollow, gameState]);

  useEffect(() => {
    if (gameState) {
      return;
    }

    setEffects([]);
  }, [gameState]);

  useEffect(() => {
    const unsubscribe = gameUiEventBus.subscribe(UI_EVENT_NAMES.COMBO_CHANGED, (payload) => {
      const headPosition = payload.headPosition;

      if (payload.reason !== "match" || payload.combo < 2 || !headPosition) {
        return;
      }

      const activeGameState = gameStateRef.current;

      if (!activeGameState) {
        return;
      }

      const now = performance.now();

      setEffects((current) => {
        const activeEffects = pruneEffects(current, now);
        const { lane, anchorBase, position } = resolvePopupPosition(
          headPosition,
          activeGameState.viewport,
          cameraFollowRef.current,
          activeEffects,
        );

        const nextEffect: ComboPopupEffect = {
          id: `combo-popup-${payload.combo}-${payload.previousCombo}-${now}`,
          label: `Combo x${payload.combo}`,
          position,
          anchorBase,
          lane,
          startedAt: now,
          durationMs: COMBO_POPUP_DURATION_MS,
        };

        return [...activeEffects, nextEffect].slice(-MAX_ACTIVE_COMBO_POPUPS);
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (cleanupTimeoutRef.current !== null) {
      window.clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    if (effects.length === 0) {
      return undefined;
    }

    const nextExpiryAt = Math.min(...effects.map((effect) => effect.startedAt + effect.durationMs));
    const delay = Math.max(0, nextExpiryAt - performance.now());

    cleanupTimeoutRef.current = window.setTimeout(() => {
      const now = performance.now();
      setEffects((current) => pruneEffects(current, now));
      cleanupTimeoutRef.current = null;
    }, delay + 16);

    return () => {
      if (cleanupTimeoutRef.current !== null) {
        window.clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }
    };
  }, [effects]);

  return useMemo(() => effects.map((effect) => ({
    id: effect.id,
    label: effect.label,
    position: effect.position,
    lane: effect.lane,
    durationMs: effect.durationMs,
  }) satisfies ComboPopupVisual), [effects]);
}
