import type { BallColorKey, GameState, InputDirection, PointerInputSource, Scene, Vector2 } from "./game";

export type LevelState = "idle" | GameState["status"] | "playing" | "cleared" | "failed";

export interface UiStateContract {
  score: number;
  hp: number;
  combo: number;
  levelState: LevelState;
  isInputLocked: boolean;
  currentHeadColor: BallColorKey | null;
  remainingBalls: number;
  remainingTargets: number;
}

export const UI_EVENT_NAMES = {
  UI_UPDATE_SCORE: "UI_UPDATE_SCORE",
  GAME_STATE_CHANGED: "GAME_STATE_CHANGED",
  ON_COLLISION_MATCH: "ON_COLLISION_MATCH",
  ON_COLLISION_MISMATCH: "ON_COLLISION_MISMATCH",
  INPUT_AIM_UPDATE: "INPUT_AIM_UPDATE",
  HP_CHANGED: "HP_CHANGED",
  LEVEL_CLEAR: "LEVEL_CLEAR",
  LEVEL_FAIL: "LEVEL_FAIL",
} as const;

export type UiEventName = (typeof UI_EVENT_NAMES)[keyof typeof UI_EVENT_NAMES];

export interface UiUpdateScorePayload {
  score: number;
  combo: number;
  reason: "placeholder" | "rule-update";
}

export interface GameStateChangedPayload {
  scene: Scene;
  levelId: string | null;
  levelState: LevelState;
  currentHeadColor: BallColorKey | null;
  remainingBalls: number;
  remainingTargets: number;
}

export interface CollisionMatchPayload {
  borderId: string;
  color: BallColorKey;
  headIndex: number;
}

export interface CollisionMismatchPayload {
  borderId: string;
  expectedColor: BallColorKey;
  actualColor: BallColorKey;
  headIndex: number;
}

export interface InputAimUpdatePayload {
  direction: InputDirection;
  vector: Vector2;
  source: "keyboard" | PointerInputSource;
  occurredAt: number;
}

export interface HpChangedPayload {
  hp: number;
  delta: number;
  reason: "placeholder" | "rule-update";
}

export interface LevelClearPayload {
  levelId: string;
}

export interface LevelFailPayload {
  levelId: string;
  reason: "out-of-bounds" | "hp-zero" | "placeholder";
}

export interface UiEventPayloadMap {
  UI_UPDATE_SCORE: UiUpdateScorePayload;
  GAME_STATE_CHANGED: GameStateChangedPayload;
  ON_COLLISION_MATCH: CollisionMatchPayload;
  ON_COLLISION_MISMATCH: CollisionMismatchPayload;
  INPUT_AIM_UPDATE: InputAimUpdatePayload;
  HP_CHANGED: HpChangedPayload;
  LEVEL_CLEAR: LevelClearPayload;
  LEVEL_FAIL: LevelFailPayload;
}

export type UiEventHandler<TEventName extends keyof UiEventPayloadMap> = (payload: UiEventPayloadMap[TEventName]) => void;

export interface UiEventBus {
  emit<TEventName extends keyof UiEventPayloadMap>(eventName: TEventName, payload: UiEventPayloadMap[TEventName]): void;
  subscribe<TEventName extends keyof UiEventPayloadMap>(eventName: TEventName, handler: UiEventHandler<TEventName>): () => void;
}
