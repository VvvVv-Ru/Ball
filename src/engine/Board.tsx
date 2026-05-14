import type { CSSProperties } from "react";
import type { BallDefinition, BorderDefinition, BorderSegment, GameState, PlayfieldConfig, Rect, ViewportConfig } from "../types/game";

function toViewportWidth(value: number, viewport: ViewportConfig) {
  return `${(value / viewport.width) * 100}%`;
}

function toViewportHeight(value: number, viewport: ViewportConfig) {
  return `${(value / viewport.height) * 100}%`;
}

function toLocalWidth(value: number, rect: Rect) {
  return `${(value / rect.width) * 100}%`;
}

function toLocalHeight(value: number, rect: Rect) {
  return `${(value / rect.height) * 100}%`;
}

function createPlayfieldStyle(playfield: PlayfieldConfig, viewport: ViewportConfig): CSSProperties {
  return {
    left: toViewportWidth(playfield.rect.x, viewport),
    top: toViewportHeight(playfield.rect.y, viewport),
    width: toViewportWidth(playfield.rect.width, viewport),
    height: toViewportHeight(playfield.rect.height, viewport),
  };
}

function createBorderStyle(border: BorderDefinition, playfield: PlayfieldConfig): CSSProperties {
  return {
    left: toLocalWidth(border.bounds.x - playfield.rect.x, playfield.rect),
    top: toLocalHeight(border.bounds.y - playfield.rect.y, playfield.rect),
    width: toLocalWidth(border.bounds.width, playfield.rect),
    height: toLocalHeight(border.bounds.height, playfield.rect),
  };
}

function createSegmentStyle(border: BorderDefinition, segment: BorderSegment): CSSProperties {
  const isHorizontal = border.side === "top" || border.side === "bottom";
  const fullLength = Math.max(1, border.fullLength);

  return {
    left: isHorizontal ? `${(segment.start / fullLength) * 100}%` : "0%",
    top: isHorizontal ? "0%" : `${(segment.start / fullLength) * 100}%`,
    width: isHorizontal ? `${(segment.length / fullLength) * 100}%` : "100%",
    height: isHorizontal ? "100%" : `${(segment.length / fullLength) * 100}%`,
    background: segment.color,
  };
}

function createBallStyle(ball: BallDefinition, playfield: PlayfieldConfig): CSSProperties {
  return {
    left: toLocalWidth(ball.position.x - playfield.rect.x - ball.radius, playfield.rect),
    top: toLocalHeight(ball.position.y - playfield.rect.y - ball.radius, playfield.rect),
    width: toLocalWidth(ball.diameter, playfield.rect),
    height: toLocalHeight(ball.diameter, playfield.rect),
    background: ball.colorHex,
  };
}

export function Board({ gameState }: { gameState: GameState }) {
  return (
    <div className="stage-shell">
      <section className="stage-frame" aria-label="第3关玩法区骨架">
        <div className="stage-viewport">
          <div className="playfield-root" style={createPlayfieldStyle(gameState.playfield, gameState.viewport)}>
            <div className="playfield-surface" style={{ background: gameState.playfield.fill }} />

            <div
              className="ball-queue-layer"
              data-head-index={gameState.headIndex}
              data-current-head-color={gameState.currentHeadColor ?? ""}
            >
              {gameState.ballQueue.balls.map((ball) => (
                <div
                  key={ball.id}
                  className="ball-queue-item"
                  data-ball-id={ball.id}
                  data-is-head={ball.order === gameState.headIndex}
                  style={createBallStyle(ball, gameState.playfield)}
                />
              ))}
            </div>

            <div className="playfield-borders">
              {gameState.playfield.borders.map((border) => (
                <div
                  key={border.id}
                  className="playfield-border"
                  data-border-side={border.side}
                  style={createBorderStyle(border, gameState.playfield)}
                >
                  {border.segments.filter((segment) => segment.active).map((segment) => (
                    <div
                      key={`${border.id}-${segment.start}-${segment.length}`}
                      className="playfield-border-segment"
                      style={createSegmentStyle(border, segment)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="board-debug-panel" aria-label="Board debug info">
            <span>isLaunched: {String(gameState.motion.isLaunched)}</span>
            <span>currentDirection: {gameState.motion.currentDirection ?? "-"}</span>
            <span>currentSpeed: {gameState.motion.currentSpeed}</span>
            <span>
              headPosition: {gameState.ballQueue.balls[gameState.headIndex]?.position.x.toFixed(1) ?? "-"},
              {gameState.ballQueue.balls[gameState.headIndex]?.position.y.toFixed(1) ?? "-"}
            </span>
            <span>headIndex: {gameState.headIndex}</span>
            <span>headColor: {gameState.currentHeadColor ?? "-"}</span>
            <span>lastInputDirection: {gameState.input.lastInputDirection ?? "-"}</span>
            <span>lastInputAt: {gameState.input.lastInputAt ?? "-"}</span>
            <span>inputCount: {gameState.input.inputCount}</span>
            <span>isInputLocked: {String(gameState.isInputLocked)}</span>
            <span>pointerType: {gameState.input.pointer.pointerType ?? "-"}</span>
            <span>pointerDistance: {gameState.input.pointer.currentDistance.toFixed(1)}</span>
            <span>thresholdReached: {String(gameState.input.pointer.hasReachedThreshold)}</span>
            <span>gestureTriggered: {String(gameState.input.pointer.hasTriggeredInCurrentGesture)}</span>
          </div>

        </div>
      </section>
    </div>
  );
}
