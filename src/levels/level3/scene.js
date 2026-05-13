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

  const playfield = renderLevel3Playfield(levelConfig.playfield);
  gameLayer.appendChild(playfield.element);

  const uiLayer = document.createElement("div");
  uiLayer.className = `layer ${levelConfig.layers.ui}`;
  uiLayer.dataset.layerRole = "ui";

  const sceneLabel = document.createElement("div");
  sceneLabel.className = "scene-label";
  sceneLabel.innerHTML = `
    <h2>Level 3 静态玩法区</h2>
    <p>800 x 800 玩法区与四边已渲染，当前仍不接入球、输入、碰撞与规则。</p>
  `;

  const hudChip = document.createElement("div");
  hudChip.className = "hud-chip";
  hudChip.textContent = `UI Layer / ${levelConfig.viewport.width} x ${levelConfig.viewport.height}`;

  const overlayCard = document.createElement("div");
  overlayCard.className = "overlay-card";
  overlayCard.innerHTML = `
    <h3>边数据复用入口</h3>
    <p>${levelConfig.notes.placement}</p>
    <ul>
      <li>Border Config -> levelConfig.playfield.borders</li>
      <li>CollisionSystem -> gameState.world.playfield.borders</li>
      <li>RuleSystem -> border.segments / border.active</li>
      <li>InputSystem -> gameState.systems.input</li>
      <li>MotionSystem -> gameState.systems.motion</li>
      <li>HUD Presenter -> gameState.systems.hud</li>
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
  uiLayer.append(hudChip, overlayCard, actions);
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
