# Ball 公司网页打包与兼容记录

## 目的

这份文档记录 `Ball/` 工作区在接入公司网页游戏平台时，为了让网页包可正常打开、可交互、可保留图片/音频/震动效果而做过的关键修改。

用途：

- 方便后续 AI 直接检索问题背景；
- 方便删除当前修改时知道哪些文件被动过；
- 方便后续重新打包时直接复用成功命令。

## 背景问题

最初把 `Ball` 网页游戏上传到公司网页平台后，出现过以下问题：

1. 页面只显示背景格子，玩法区球、边框、按钮看不到。
2. 音乐和音效不播放。
3. 上传成功，但平台内运行时资源访问异常。

实际排查到的关键现象：

1. 早期打包结果中，`index.html` 和资源引用走的是根路径或运行时静态路径，嵌入到公司平台子目录后容易失效。
2. 公司平台控制台明确出现过 `gameplay_bgm.mp3 403 (Forbidden)`，说明平台对运行时访问的静态音频资源有限制。
3. 玩法区原本依赖大量运行时 `style` 定位和尺寸控制，平台环境下出现过“背景可见，但球和边框不显示”的情况。

## 最终采用的打包/兼容思路

### 1. Vite 使用相对基路径

文件：`vite.config.ts`

```ts
export default defineConfig({
  base: "./",
  plugins: [react()],
});
```

目的：

- 避免打包产物仍然引用站点根路径 `/assets/...`；
- 让公司平台在任意子目录下托管时也能正确加载 `assets`。

### 2. 补齐 Vite 类型声明

文件：`src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />
```

目的：

- 兼容 `import.meta.env` / `import.meta.url` 等 Vite 能力。

### 3. 图片和音频改为构建期导入

文件：`src/assetManifest.ts`

```ts
export const UI_ASSETS = {
  flowButton: new URL("../public/ui/flow-button.png", import.meta.url).href,
  heartFilled: new URL("../public/hud/heart-filled.png", import.meta.url).href,
  heartEmpty: new URL("../public/hud/heart-empty.png", import.meta.url).href,
} as const;

export const AUDIO_ASSETS = {
  startClick: new URL("../public/audio/sfx/start-click.wav", import.meta.url).href,
  match: new URL("../public/audio/sfx/match.wav", import.meta.url).href,
  mismatch: new URL("../public/audio/sfx/mismatch.wav", import.meta.url).href,
  gameplayBgm: new URL("../public/audio/bgm/gameplay-bgm.mp3", import.meta.url).href,
} as const;
```

目的：

- 不再在运行时手写 `/audio/...`、`/ui/...`、`/hud/...` 字符串；
- 让构建流程显式感知这些资源；
- 降低公司平台二次托管时资源丢失、403、404 的概率。

### 4. 音频清单改为引用 `AUDIO_ASSETS`

文件：`src/audio/audioManifest.ts`

当前方案：

- `startClick`、`match`、`mismatch`、`gameplayBgm` 全部来自 `AUDIO_ASSETS`。

目的：

- 保留原有音频逻辑；
- 只替换资源来源方式，不重写音频系统本身。

### 5. UI 图片改为引用 `UI_ASSETS`

文件：

- `src/views/LevelStartView.tsx`
- `src/views/LevelOutcomeView.tsx`
- `src/views/GamePlayView.tsx`

当前方案：

- 开始页按钮图使用 `UI_ASSETS.flowButton`
- 结果页按钮图使用 `UI_ASSETS.flowButton`
- HUD 爱心图使用 `UI_ASSETS.heartFilled / heartEmpty`

目的：

- 恢复原本的按钮和爱心图片表现；
- 不依赖平台运行时直接访问 `public/` 静态目录。

### 6. 玩法主渲染从 DOM 定位改为 SVG 属性渲染

文件：`src/engine/Board.tsx`

关键变化：

1. 球、边框、玩法区背景改为 `svg` 内的 `rect / ellipse / circle` 渲染。
2. 位置、大小、颜色尽量走 `x / y / width / height / fill / stroke` 这类属性，而不是把核心布局全押在运行时内联样式上。

目的：

- 避免公司平台环境下因为样式注入/运行时样式兼容性问题，出现“背景有，但玩法内容不显示”。

### 7. 震动效果改为类名档位驱动

文件：

- `src/views/GamePlayView.tsx`
- `src/engine/Board.tsx`
- `src/index.css`

当前方案：

- `GamePlayView` 只记录 `light / medium` 两档震动状态；
- `Board` 给舞台节点加 `is-stage-shaking-light` 或 `is-stage-shaking-medium`；
- `index.css` 中为两档写固定 CSS 变量和动画。

目的：

- 恢复震动效果；
- 同时减少依赖运行时注入的内联变量。

## 当前已改动文件

根据当前 `git status --short`，本次与打包兼容相关的文件如下：

已修改：

- `src/audio/audioManifest.ts`
- `src/engine/Board.tsx`
- `src/index.css`
- `src/views/GamePlayView.tsx`
- `src/views/LevelOutcomeView.tsx`
- `src/views/LevelStartView.tsx`
- `vite.config.ts`

新增：

- `src/assetManifest.ts`
- `src/assetUrl.ts`
- `src/vite-env.d.ts`
- `release/Ball-web-upload.zip`

补充说明：

- `src/assetUrl.ts` 是中间排查阶段留下的过渡工具文件，当前已经没有业务代码在使用它。
- 如果后续决定回退到纯 `assetManifest` 方案，可以把 `src/assetUrl.ts` 一并删除。

## 当前成功打包方式

### 构建命令

在 `Ball/` 目录执行：

```bash
npm run build
```

对应脚本来自 `package.json`：

```json
{
  "scripts": {
    "build": "tsc && vite build"
  }
}
```

### 生成可上传 ZIP

在 `Ball/dist/` 目录执行：

```bash
zip -r "../release/Ball-web-upload.zip" . -x "*.DS_Store"
```

目的：

- 让 zip 解压后的根目录直接就是 `index.html`；
- 避免外面再包一层 `dist/`，导致平台找不到入口。

### 当前上传包位置

```text
Ball/release/Ball-web-upload.zip
```

## 上传时必须满足的结构

zip 根目录应直接包含：

- `index.html`
- `assets/`
- `audio/`
- `hud/`
- `ui/`

不要上传成：

```text
Ball-web-upload/dist/index.html
```

正确结构应是：

```text
Ball-web-upload/index.html
Ball-web-upload/assets/...
```

## 对后续 AI 的提醒

如果后续再次遇到“公司平台可打开但内容缺失”，优先检查：

1. `vite.config.ts` 是否仍然保持 `base: "./"`。
2. 图片/音频是否仍然通过 `assetManifest.ts` 统一导入。
3. 是否又把资源引用改回了 `/audio/...`、`/ui/...`、`/hud/...` 这种运行时字符串路径。
4. 是否又把玩法主渲染改回依赖大量内联样式的 DOM 布局。
5. 上传的 zip 是否在根目录直接包含 `index.html`。

## 如果要删除这些修改

若后续决定回退本次适配，可优先关注以下文件：

1. `vite.config.ts`
2. `src/assetManifest.ts`
3. `src/audio/audioManifest.ts`
4. `src/views/LevelStartView.tsx`
5. `src/views/LevelOutcomeView.tsx`
6. `src/views/GamePlayView.tsx`
7. `src/engine/Board.tsx`
8. `src/index.css`
9. `src/vite-env.d.ts`
10. `src/assetUrl.ts`

其中：

- `src/assetUrl.ts` 当前未使用，删除风险最低；
- `release/Ball-web-upload.zip` 只是构建产物，可以随时重打；
- `Board.tsx` 和 `index.css` 是玩法区显示是否正常的核心改动点。

## 记录时间

- 记录日期：2026-05-17
- 工作区：`/Users/vvvvv/Desktop/个人项目/BallGame/ballGame/Ball`
