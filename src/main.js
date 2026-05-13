import { getLevelConfig } from "./config/levels.js";
import { createLevel3Scene } from "./levels/level3/scene.js";

const app = document.querySelector("#app");
const levelConfig = getLevelConfig("level3");
let currentScene = null;

if (!app) {
  throw new Error("App root not found.");
}

if (!levelConfig) {
  throw new Error("Level 3 config not found.");
}

function mountEntry() {
  currentScene?.destroy?.();
  currentScene = null;
  app.replaceChildren();

  const shell = document.createElement("main");
  shell.className = "shell";

  const card = document.createElement("section");
  card.className = "entry-card";
  card.innerHTML = `
    <h1>Ball Game Web Demo</h1>
    <p>第 3 关入口页，当前只提供空场景与系统接入骨架。</p>
    <ul>
      <li>Scene: level3</li>
      <li>Viewport: ${levelConfig.viewport.width} x ${levelConfig.viewport.height}</li>
      <li>Config Entry: src/config/levels.js</li>
    </ul>
  `;

  const enterButton = document.createElement("button");
  enterButton.type = "button";
  enterButton.className = "primary-button";
  enterButton.textContent = "进入第 3 关";
  enterButton.addEventListener("click", () => {
    window.location.hash = levelConfig.id;
    mountLevel3();
  });

  card.appendChild(enterButton);
  shell.appendChild(card);
  app.appendChild(shell);
}

function mountLevel3() {
  currentScene?.destroy?.();
  const scene = createLevel3Scene(levelConfig, () => {
    window.location.hash = "";
    mountEntry();
  });

  currentScene = scene;
  app.replaceChildren(scene.element);
}

if (window.location.hash === `#${levelConfig.id}`) {
  mountLevel3();
} else {
  mountEntry();
}
