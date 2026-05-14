export type Scene = "menu" | "select" | "playing";

export type LevelId = "level3";

export type BallColorKey = "red" | "blue" | "yellow";

export type BorderSide = "top" | "right" | "bottom" | "left";

export type InputDirection = "up" | "down" | "left" | "right";

export type PointerInputSource = "mouse" | "touch" | "pen" | "unknown";

export type HeadBallIndex = number;

export type CollisionType = "match" | "mismatch";

export type BorderImpactKind = "match" | "mismatch" | "special-bounce";

export type ShakeIntensity = "light" | "medium";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BorderSegment {
  start: number;
  length: number;
  active: boolean;
  color: string;
}

export interface Border {
  id: string;
  side: BorderSide;
  color: string;
  thickness: number;
  fullLength: number;
  active: boolean;
  bounds: Rect;
  segments: BorderSegment[];
}

export interface Playfield {
  center: Vector2;
  size: number;
  rect: Rect;
  borderThickness: number;
  fill: string;
  borders: Border[];
}

export interface Ball {
  id: string;
  order: number;
  colorKey: BallColorKey;
  colorHex: string;
  radius: number;
  diameter: number;
  position: Vector2;
}

export interface BallQueue {
  axis: "vertical-up";
  surfaceGap: number;
  headAnchor: Vector2;
  headIndex: HeadBallIndex;
  balls: Ball[];
}

export interface LevelGameplayConfig {
  initialSpeed: number;
  initialHp: number;
  input: LevelInputConfig;
  tuning: LevelTuningConfig;
}

export interface LevelInputConfig {
  triggerDistance: Record<PointerInputSource, number>;
  holdStillMaxMs: number;
  directionDebounceAxisDelta: number;
  redirectCooldownMs: number;
}

export interface ScreenShakeProfile {
  amplitude: number;
  durationMs: number;
  cooldownMs: number;
}

export interface BorderImpactShakeConfig {
  enabled: boolean;
  light: ScreenShakeProfile;
  medium: ScreenShakeProfile;
}

export interface BorderImpactRingConfig {
  enabled: boolean;
  strokeWidth: number;
  startScale: number;
  endScale: number;
  durationMs: number;
  easing: string;
  alphaFade: boolean;
}

export interface LevelTuningConfig {
  borderImpactShake: BorderImpactShakeConfig;
  borderImpactRing: BorderImpactRingConfig;
}

export interface BorderImpactRingEffect {
  id: string;
  center: Vector2;
  ballRadius: number;
  startedAt: number;
  durationMs: number;
  strokeWidth: number;
  startScale: number;
  endScale: number;
  easing: string;
  alphaFade: boolean;
}

export interface LevelNotes {
  placement: string;
}

export interface ViewportConfig {
  width: number;
  height: number;
}

export interface LevelConfig {
  id: LevelId;
  name: string;
  viewport: ViewportConfig;
  playfield: Playfield;
  ballQueue: BallQueue;
  gameplay: LevelGameplayConfig;
  notes: LevelNotes;
}

export interface InputState {
  lastInputDirection: InputDirection | null;
  lastInputVector: Vector2;
  lastInputAt: number | null;
  inputCount: number;
  pointer: PointerGestureState;
}

export interface PointerGestureState {
  isPointerActive: boolean;
  pointerStart: Vector2 | null;
  lastPointer: Vector2 | null;
  pointerType: PointerInputSource | null;
  pointerStartedAt: number | null;
  currentDistance: number;
  currentThreshold: number | null;
  hasReachedThreshold: boolean;
  hasTriggeredInCurrentGesture: boolean;
}

export interface PointerGesturePayload {
  position: Vector2;
  pointerType: PointerInputSource;
  at: number;
}

export interface MotionState {
  isLaunched: boolean;
  currentVector: Vector2 | null;
  currentSpeed: number;
  lastTickAt: number | null;
  lastRedirectAt: number | null;
  redirectCooldownMs: number;
  isRedirectCooling: boolean;
  lastAcceptedVector: Vector2 | null;
  headPath: Vector2[];
  maxQueueStretch: number;
}

export interface CollisionState {
  lastCollisionBorderId: string | null;
  lastCollisionSide: BorderSide | null;
  lastCollisionType: CollisionType | null;
  lastCollisionBorderColor: BallColorKey | null;
  lastCollisionHeadColor: BallColorKey | null;
  lastReflectionBefore: Vector2 | null;
  lastReflectionAfter: Vector2 | null;
}

export interface ProgressState {
  score: number;
  combo: number;
  lastScoreDelta: number;
}

export interface RuleState {
  delayedBorderState: "idle" | "pending";
  pendingBorderId: string | null;
  pendingBorderSide: BorderSide | null;
  pendingBorderColor: BallColorKey | null;
  specialBounceTriggered: boolean;
  lastSpecialBounceBorderId: string | null;
  lastRemovedBallId: string | null;
  lastRemovedBallOrder: number | null;
}

export interface GameState {
  levelId: LevelId;
  status: "ready" | "failed" | "clear";
  viewport: ViewportConfig;
  playfield: Playfield;
  ballQueue: BallQueue;
  headIndex: HeadBallIndex;
  currentHeadColor: BallColorKey | null;
  isInputLocked: boolean;
  initialSpeed: number;
  hp: number;
  inputConfig: LevelInputConfig;
  tuningConfig: LevelTuningConfig;
  input: InputState;
  motion: MotionState;
  collision: CollisionState;
  progress: ProgressState;
  rule: RuleState;
  failReason: "out_of_bounds" | null;
  clearReason: "all_targets_cleared_and_no_balls" | null;
}

export interface BorderEditorState {
  isOpen: boolean;
  selectedBorderId: string | null;
}

export interface BorderUpdatePatch {
  bounds?: Partial<Rect>;
  color?: string;
  thickness?: number;
}

export interface GameStoreState {
  scene: Scene;
  levels: LevelConfig[];
  selectedLevelId: LevelId | null;
  currentLevelId: LevelId | null;
  gameState: GameState | null;
  borderEditor: BorderEditorState;
  setScene: (scene: Scene) => void;
  selectLevel: (levelId: LevelId) => void;
  loadLevel3Config: () => void;
  resetLevel3State: () => void;
  applyInput: (direction: InputDirection) => void;
  tickMotion: (now: number) => void;
  startPointerGesture: (payload: PointerGesturePayload) => void;
  updatePointerGesture: (payload: PointerGesturePayload) => void;
  endPointerGesture: (payload: PointerGesturePayload) => void;
  cancelPointerGesture: () => void;
  setHeadIndex: (headIndex: HeadBallIndex) => void;
  setInputLocked: (isLocked: boolean) => void;
  toggleBorderEditor: () => void;
  selectEditorBorder: (borderId: string) => void;
  updateEditorBorder: (borderId: string, patch: BorderUpdatePatch) => void;
  setEditorBorderSegmentCount: (borderId: string, segmentCount: number) => void;
  updateEditorBorderSegmentColor: (borderId: string, segmentIndex: number, color: string) => void;
  startSelectedLevel: () => void;
  backToMenu: () => void;
  backToSelect: () => void;
}

export interface GameStoreSelectors {
  selectScene: (state: GameStoreState) => Scene;
  selectCurrentLevelId: (state: GameStoreState) => LevelId | null;
  selectGameState: (state: GameStoreState) => GameState | null;
  selectBallQueue: (state: GameStoreState) => BallQueue | null;
  selectBorders: (state: GameStoreState) => Border[];
  selectBorderEditor: (state: GameStoreState) => BorderEditorState;
  selectInputState: (state: GameStoreState) => InputState | null;
  selectMotionState: (state: GameStoreState) => MotionState | null;
  selectPointerGesture: (state: GameStoreState) => PointerGestureState | null;
  selectHeadIndex: (state: GameStoreState) => HeadBallIndex | null;
  selectCurrentHeadColor: (state: GameStoreState) => BallColorKey | null;
  selectIsInputLocked: (state: GameStoreState) => boolean;
}

export type BorderDefinition = Border;
export type PlayfieldConfig = Playfield;
export type BallDefinition = Ball;
export type BallQueueConfig = BallQueue;
