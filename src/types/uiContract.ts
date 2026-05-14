import type { BallColorKey, BorderImpactKind, GameState, InputDirection, PointerInputSource, Scene, ShakeIntensity, SoftBallTriggerKind, Vector2 } from "./game";

export type LevelState = "idle" | GameState["status"] | "playing" | "failed";

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
  COMBO_CHANGED: "COMBO_CHANGED",
  GAME_STATE_CHANGED: "GAME_STATE_CHANGED",
  INPUT_LOCK_CHANGED: "INPUT_LOCK_CHANGED",
  DELAYED_BORDER_ENTERED: "DELAYED_BORDER_ENTERED",
  DELAYED_BORDER_TRIGGERED: "DELAYED_BORDER_TRIGGERED",
  SPECIAL_BOUNCE_RESOLVED: "SPECIAL_BOUNCE_RESOLVED",
  ON_BORDER_IMPACT: "ON_BORDER_IMPACT",
  SOFT_BALL_TRIGGER: "SOFT_BALL_TRIGGER",
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

export interface ComboChangedPayload {
  combo: number;
  previousCombo: number;
  reason: "match" | "mismatch" | "placeholder";
}

export interface InputLockChangedPayload {
  isInputLocked: boolean;
  reason: "delayed-border" | "special-bounce" | "manual" | "placeholder";
}

export interface DelayedBorderEnteredPayload {
  borderId: string;
  side: "top" | "right" | "bottom" | "left";
  color: BallColorKey;
}

export interface DelayedBorderTriggeredPayload {
  borderId: string;
  side: "top" | "right" | "bottom" | "left";
}

export interface SpecialBounceResolvedPayload {
  borderId: string;
  remainingTargets: number;
  isInputLocked: boolean;
}

export interface BorderImpactPayload {
  borderId: string;
  side: "top" | "right" | "bottom" | "left";
  impactKind: BorderImpactKind;
  shakeIntensity: ShakeIntensity;
  center: Vector2;
  ballRadius: number;
  occurredAt: number;
}

export interface SoftBallTriggerPayload {
  ballId: string;
  triggerKind: SoftBallTriggerKind;
  direction: Vector2;
  normal: Vector2 | null;
  speed: number;
  occurredAt: number;
  isHead: boolean;
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
  direction: InputDirection | null;
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
  reason: "all_targets_cleared_and_no_balls";
}

export interface LevelFailPayload {
  levelId: string;
  reason: "out_of_bounds" | "out-of-bounds" | "hp-zero" | "placeholder";
}

export interface UiEventPayloadMap {
  UI_UPDATE_SCORE: UiUpdateScorePayload;
  COMBO_CHANGED: ComboChangedPayload;
  GAME_STATE_CHANGED: GameStateChangedPayload;
  INPUT_LOCK_CHANGED: InputLockChangedPayload;
  DELAYED_BORDER_ENTERED: DelayedBorderEnteredPayload;
  DELAYED_BORDER_TRIGGERED: DelayedBorderTriggeredPayload;
  SPECIAL_BOUNCE_RESOLVED: SpecialBounceResolvedPayload;
  ON_BORDER_IMPACT: BorderImpactPayload;
  SOFT_BALL_TRIGGER: SoftBallTriggerPayload;
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
