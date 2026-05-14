将你的体力爱心图片放到这个目录，并使用下面两个固定文件名：

- `heart-filled.png`：正常爱心
- `heart-empty.png`：丢失爱心

当前 HUD 会直接读取：

- `/hud/heart-filled.png`
- `/hud/heart-empty.png`

如果你想用别的格式，比如 `webp` 或 `svg`，同步修改 `src/views/GamePlayView.tsx` 里的 `HUD_HEART_ASSETS` 即可。
