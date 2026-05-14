export type Scene = "menu" | "select" | "playing";

export type LevelId = "level3";

export type BallColorKey = "red" | "blue" | "yellow";

export type BorderSide = "top" | "right" | "bottom" | "left";

export type HeadBallIndex = number;

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

export interface GameState {
  levelId: LevelId;
  status: "ready";
  viewport: ViewportConfig;
  playfield: Playfield;
  ballQueue: BallQueue;
  headIndex: HeadBallIndex;
  currentHeadColor: BallColorKey | null;
  isInputLocked: boolean;
  initialSpeed: number;
  hp: number;
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
  selectHeadIndex: (state: GameStoreState) => HeadBallIndex | null;
  selectCurrentHeadColor: (state: GameStoreState) => BallColorKey | null;
  selectIsInputLocked: (state: GameStoreState) => boolean;
}

export type BorderDefinition = Border;
export type PlayfieldConfig = Playfield;
export type BallDefinition = Ball;
export type BallQueueConfig = BallQueue;
