import type { CSSProperties } from "react";
import type {
  BallDefinition,
  BallSoftBallVisualMap,
  BallSoftBallVisualState,
  CameraFollowVisualState,
  BorderDefinition,
  BorderImpactRingEffect,
  BorderSegment,
  GameState,
  MatchImpactParticleVisual,
  PlayfieldConfig,
  Rect,
  ViewportConfig,
} from "../types/game";

interface StageShakeState {
  active: boolean;
  offsetX: number;
  offsetY: number;
  durationMs: number;
}

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

function createBallStyle(ball: BallDefinition, playfield: PlayfieldConfig, softBallVisual?: BallSoftBallVisualState): CSSProperties {
  return {
    left: toLocalWidth(ball.position.x - playfield.rect.x - ball.radius, playfield.rect),
    top: toLocalHeight(ball.position.y - playfield.rect.y - ball.radius, playfield.rect),
    width: toLocalWidth(ball.diameter, playfield.rect),
    height: toLocalHeight(ball.diameter, playfield.rect),
    background: ball.colorHex,
    "--soft-ball-scale-x": `${softBallVisual?.scaleX ?? 1}`,
    "--soft-ball-scale-y": `${softBallVisual?.scaleY ?? 1}`,
    "--soft-ball-rotation": `${softBallVisual?.rotationDeg ?? 0}deg`,
  } as CSSProperties;
}

function createBorderImpactRingStyle(effect: BorderImpactRingEffect, playfield: PlayfieldConfig): CSSProperties {
  const diameter = effect.ballRadius * 2;

  return {
    left: toLocalWidth(effect.center.x - playfield.rect.x, playfield.rect),
    top: toLocalHeight(effect.center.y - playfield.rect.y, playfield.rect),
    width: toLocalWidth(diameter, playfield.rect),
    height: toLocalHeight(diameter, playfield.rect),
    "--impact-ring-stroke-width": `${effect.strokeWidth}px`,
    "--impact-ring-duration": `${effect.durationMs}ms`,
    "--impact-ring-start-scale": `${effect.startScale}`,
    "--impact-ring-end-scale": `${effect.endScale}`,
    "--impact-ring-easing": effect.easing,
    "--impact-ring-final-opacity": effect.alphaFade ? "0" : "1",
  } as CSSProperties;
}

function createMatchImpactParticleStyle(particle: MatchImpactParticleVisual, playfield: PlayfieldConfig): CSSProperties {
  return {
    left: toLocalWidth(particle.position.x - playfield.rect.x, playfield.rect),
    top: toLocalHeight(particle.position.y - playfield.rect.y, playfield.rect),
    width: toLocalWidth(particle.size, playfield.rect),
    height: toLocalHeight(particle.size, playfield.rect),
    background: particle.color,
    opacity: particle.opacity,
    transform: `translate(-50%, -50%) rotate(${particle.rotationDeg}deg)`,
  } satisfies CSSProperties;
}

function createStageShakeStyle(stageShake: StageShakeState | null): CSSProperties | undefined {
  if (!stageShake?.active) {
    return undefined;
  }

  return {
    "--stage-shake-x": `${stageShake.offsetX}px`,
    "--stage-shake-y": `${stageShake.offsetY}px`,
    "--stage-shake-duration": `${stageShake.durationMs}ms`,
  } as CSSProperties;
}

function createCameraFollowStyle(cameraFollow: CameraFollowVisualState | null): CSSProperties | undefined {
  if (!cameraFollow) {
    return undefined;
  }

  return {
    transform: `translate3d(${cameraFollow.offsetX}px, ${cameraFollow.offsetY}px, 0)`,
  };
}

function formatVector(vector: { x: number; y: number } | null | undefined) {
  if (!vector) {
    return "-";
  }

  return `${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}`;
}

export function Board(
  {
    gameState,
    stageShake = null,
    cameraFollow = null,
    borderImpactRings = [],
    matchImpactParticles = [],
    softBallVisuals = {},
  }: {
    gameState: GameState;
    stageShake?: StageShakeState | null;
    cameraFollow?: CameraFollowVisualState | null;
    borderImpactRings?: BorderImpactRingEffect[];
    matchImpactParticles?: MatchImpactParticleVisual[];
    softBallVisuals?: BallSoftBallVisualMap;
  },
) {
  return (
    <div className="stage-shell">
      <section
        className={`stage-frame${stageShake?.active ? " is-stage-shaking" : ""}`}
        style={createStageShakeStyle(stageShake)}
        aria-label="第3关玩法区骨架"
      >
        <div className="stage-viewport">
          <div className="playfield-camera-layer" style={createCameraFollowStyle(cameraFollow)}>
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
                    className={`ball-queue-item${softBallVisuals[ball.id] ? " is-soft-ball" : ""}`}
                    data-ball-id={ball.id}
                    data-is-head={ball.order === gameState.headIndex}
                    style={createBallStyle(ball, gameState.playfield, softBallVisuals[ball.id])}
                  />
                ))}
              </div>

              <div className="border-impact-ring-layer" aria-hidden="true">
                {borderImpactRings.map((effect) => (
                  <div
                    key={effect.id}
                    className="border-impact-ring"
                    style={createBorderImpactRingStyle(effect, gameState.playfield)}
                  />
                ))}
              </div>

              <div className="match-impact-particle-layer" aria-hidden="true">
                {matchImpactParticles.map((particle) => (
                  <div
                    key={particle.id}
                    className="match-impact-particle"
                    style={createMatchImpactParticleStyle(particle, gameState.playfield)}
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
          </div>

          <div className="board-debug-panel" aria-label="Board debug info">
            <span>score: {gameState.progress.score}</span>
            <span>combo: {gameState.progress.combo}</span>
            <span>hp: {gameState.hp}</span>
            <span>lastScoreDelta: {gameState.progress.lastScoreDelta}</span>
            <span>levelState: {gameState.status === "ready" ? "playing" : gameState.status}</span>
            <span>clearReason: {gameState.clearReason ?? "-"}</span>
            <span>failReason: {gameState.failReason ?? "-"}</span>
            <span>isLaunched: {String(gameState.motion.isLaunched)}</span>
            <span>velocity: {formatVector(gameState.motion.velocity)}</span>
            <span>gravity: {formatVector(gameState.motion.gravity)}</span>
            <span>maxSubstepMs: {gameState.motion.maxSubstepMs}</span>
            <span>bounceRestitution: {gameState.motion.bounceRestitution}</span>
            <span>currentVector: {formatVector(gameState.motion.currentVector)}</span>
            <span>currentSpeed: {gameState.motion.currentSpeed}</span>
            <span>queueLength: {gameState.ballQueue.balls.length}</span>
            <span>queueGap: {gameState.ballQueue.surfaceGap}</span>
            <span>maxQueueStretch: {gameState.motion.maxQueueStretch.toFixed(2)}</span>
            <span>lastRedirectAt: {gameState.motion.lastRedirectAt ?? "-"}</span>
            <span>redirectCooldownMs: {gameState.motion.redirectCooldownMs}</span>
            <span>isRedirectCooling: {String(gameState.motion.isRedirectCooling)}</span>
            <span>lastAcceptedVector: {formatVector(gameState.motion.lastAcceptedVector)}</span>
            <span>
              headPosition: {gameState.ballQueue.balls[gameState.headIndex]?.position.x.toFixed(1) ?? "-"},
              {gameState.ballQueue.balls[gameState.headIndex]?.position.y.toFixed(1) ?? "-"}
            </span>
            <span>headIndex: {gameState.headIndex}</span>
            <span>headColor: {gameState.currentHeadColor ?? "-"}</span>
            <span>delayedBorderState: {gameState.rule.delayedBorderState}</span>
            <span>pendingBorderId: {gameState.rule.pendingBorderId ?? "-"}</span>
            <span>specialBounceTriggered: {String(gameState.rule.specialBounceTriggered)}</span>
            <span>remainingBorders: {gameState.playfield.borders.filter((border) => border.active).length}</span>
            <span>removedBallId: {gameState.rule.lastRemovedBallId ?? "-"}</span>
            <span>removedBallOrder: {gameState.rule.lastRemovedBallOrder ?? "-"}</span>
            <span>lastCollisionSide: {gameState.collision.lastCollisionSide ?? "-"}</span>
            <span>lastCollisionType: {gameState.collision.lastCollisionType ?? "-"}</span>
            <span>lastCollisionBorderId: {gameState.collision.lastCollisionBorderId ?? "-"}</span>
            <span>collisionBorderColor: {gameState.collision.lastCollisionBorderColor ?? "-"}</span>
            <span>collisionHeadColor: {gameState.collision.lastCollisionHeadColor ?? "-"}</span>
            <span>
              reflection: {gameState.collision.lastReflectionBefore?.x ?? "-"},{gameState.collision.lastReflectionBefore?.y ?? "-"}
              {" -> "}
              {gameState.collision.lastReflectionAfter?.x ?? "-"},{gameState.collision.lastReflectionAfter?.y ?? "-"}
            </span>
            <span>lastInputDirection: {gameState.input.lastInputDirection ?? "free-aim"}</span>
            <span>lastInputVector: {formatVector(gameState.input.lastInputVector)}</span>
            <span>lastInputAt: {gameState.input.lastInputAt ?? "-"}</span>
            <span>inputCount: {gameState.input.inputCount}</span>
            <span>isInputLocked: {String(gameState.isInputLocked)}</span>
            <span>pointerType: {gameState.input.pointer.pointerType ?? "-"}</span>
            <span>pointerDistance: {gameState.input.pointer.currentDistance.toFixed(1)}</span>
            <span>thresholdReached: {String(gameState.input.pointer.hasReachedThreshold)}</span>
            <span>gestureTriggered: {String(gameState.input.pointer.hasTriggeredInCurrentGesture)}</span>
            <span>cameraActive: {String(cameraFollow?.isActive ?? false)}</span>
            <span>cameraOffset: {cameraFollow ? `${cameraFollow.offsetX.toFixed(1)}, ${cameraFollow.offsetY.toFixed(1)}` : "0.0, 0.0"}</span>
            <span>cameraTarget: {cameraFollow ? `${cameraFollow.targetX.toFixed(1)}, ${cameraFollow.targetY.toFixed(1)}` : "0.0, 0.0"}</span>
          </div>

        </div>
      </section>
    </div>
  );
}
