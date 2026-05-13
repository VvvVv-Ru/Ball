import { createGameState } from "../../game/createGameState.js";
import { renderLevel3Playfield } from "./renderPlayfield.js";

export function createLevel3Scene(levelConfig, onExit) {
  const gameState = createGameState(levelConfig);
  gameState.status = "ready";
  gameState.sceneMounted = true;

  const stageShell = document.createElement("main");
  stageShell.className = "stage-shell";

  const stageFrame = document.createElement("section");
  stageFrame.className = "stage-frame";
  stageFrame.dataset.levelId = levelConfig.id;
  stageFrame.dataset.viewport = `${levelConfig.viewport.width}x${levelConfig.viewport.height}`;

  const stageViewport = document.createElement("div");
  stageViewport.className = "stage-viewport";
  stageViewport.style.width = `${levelConfig.viewport.width}px`;
  stageViewport.style.height = `${levelConfig.viewport.height}px`;

  const gameLayer = document.createElement("div");
  gameLayer.className = `layer ${levelConfig.layers.game}`;
  gameLayer.dataset.layerRole = "game";

  const playfield = renderLevel3Playfield(levelConfig.playfield, gameState.world.ballQueue);
  gameLayer.appendChild(playfield.element);

  const uiLayer = document.createElement("div");
  uiLayer.className = `layer ${levelConfig.layers.ui}`;
  uiLayer.dataset.layerRole = "ui";

  const headBall = gameState.world.ballQueue?.balls[gameState.world.ballQueue.headIndex] ?? null;

  const sceneLabel = document.createElement("div");
  sceneLabel.className = "scene-label";
  sceneLabel.innerHTML = `
    <h2>Level 3 静态球列</h2>
    <p>当前已接入 4 球初始站位与统一状态层队首标记，仍不接入移动、碰撞与结算。</p>
  `;

  const hudChip = document.createElement("div");
  hudChip.className = "hud-chip";
  hudChip.textContent = `UI Layer / ${levelConfig.viewport.width} x ${levelConfig.viewport.height}`;

  const overlayCard = document.createElement("div");
  overlayCard.className = "overlay-card";
  overlayCard.innerHTML = `
    <h3>状态 / 数据复用入口</h3>
    <p>${levelConfig.notes.placement}</p>
    <ul>
      <li>Border Config -> levelConfig.playfield.borders</li>
      <li>Ball Queue Config -> levelConfig.ballQueue.balls</li>
      <li>Queue State -> gameState.world.ballQueue</li>
      <li>headIndex -> gameState.world.ballQueue.headIndex</li>
      <li>currentHeadColor -> gameState.world.ballQueue.currentHeadColor</li>
      <li>CollisionSystem -> gameState.world.playfield.borders</li>
      <li>RuleSystem -> border.segments / border.active</li>
      <li>InputSystem -> gameState.systems.input</li>
      <li>MotionSystem -> gameState.systems.motion</li>
      <li>HUD Presenter -> gameState.systems.hud</li>
    </ul>
  `;

  const queueStatus = document.createElement("div");
  queueStatus.className = "queue-status";
  queueStatus.innerHTML = `
    <h3>当前队首</h3>
    <ul>
      <li>headIndex: ${gameState.world.ballQueue?.headIndex ?? "-"}</li>
      <li>currentHeadColor: ${gameState.world.ballQueue?.currentHeadColor ?? "-"}</li>
      <li>headBallId: ${headBall?.id ?? "-"}</li>
      <li>surfaceGap: ${gameState.world.ballQueue?.surfaceGap ?? "-"}px</li>
    </ul>
  `;

  const actions = document.createElement("div");
  actions.className = "overlay-actions";

  const exitButton = document.createElement("button");
  exitButton.type = "button";
  exitButton.className = "ghost-button";
  exitButton.textContent = "返回入口";
  exitButton.addEventListener("click", onExit);
  actions.appendChild(exitButton);

  gameLayer.appendChild(sceneLabel);
  uiLayer.append(hudChip, overlayCard, queueStatus, actions);
  stageViewport.append(gameLayer, uiLayer);
  stageFrame.append(stageViewport);
  stageShell.appendChild(stageFrame);

  const syncViewportScale = () => {
    const frameRect = stageFrame.getBoundingClientRect();
    const scale = Math.min(
      frameRect.width / levelConfig.viewport.width,
      frameRect.height / levelConfig.viewport.height,
    );
    const offsetX = (frameRect.width - levelConfig.viewport.width * scale) / 2;
    const offsetY = (frameRect.height - levelConfig.viewport.height * scale) / 2;

    stageViewport.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  };

  const resizeObserver = new ResizeObserver(() => {
    syncViewportScale();
  });

  resizeObserver.observe(stageFrame);
  window.addEventListener("resize", syncViewportScale);
  requestAnimationFrame(syncViewportScale);

  return {
    element: stageShell,
    gameState,
    layers: {
      game: gameLayer,
      ui: uiLayer,
    },
    playfield,
    destroy() {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncViewportScale);
    },
  };
}
