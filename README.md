# HOME ATLAS · 灯语之屋

基于真实 HOME 平面图与 `Home.txt` 层级构建的浏览器记忆宫殿小游戏。玩家在 HOME 二维地图上移动，从房间入口选择学习或练习模式，再进入固定斜俯视的 2.5D 放射状知识地图。

## 已接入的真实素材

- HOME 原图：1280×1280；运行时使用保留完整房间内容的 1207×824 裁边版。
- 层级数据：12 个 Scene、85 个 Area、524 个词汇，全部来自 `Home.txt`。
- Area/词汇图：609/609 个路径已匹配；606 张为原始 XMind 图裁片，3 张为原素材提取阶段生成的明确占位图。
- 词典缓存：9 条可靠中文释义、14 条美音 IPA、13 条英音 IPA。
- 本地真人音频：0；学习模式使用明确标注的浏览器 TTS 降级，练习模式完全禁用发音。

完整清单见 `data/asset-report.json`，已知素材限制见 `KNOWN_ISSUES.md`。

## 环境与启动

需要 Node.js 20 或更高版本。可使用 npm 或 pnpm：

```bash
npm install
npm run dev
```

开发服务器默认显示本地 URL。正式构建：

```bash
npm run build
```

构建产物位于 `dist/`。本项目使用 Vite；在 Windows 受限环境中配置了 `resolve.preserveSymlinks` 与关闭依赖自动发现，避免 pnpm 软链接越出项目根目录。

## 操作

- `WASD` / 方向键：移动。
- HOME 房间入口：`Space` 打开模式选择；`R` 进入学习，`F` 进入练习。
- 学习模式：接近词汇自动点亮；`Q` / `E` 播放美式 / 英式浏览器 TTS。
- 练习模式：接近后按 `F` 聚焦输入，`Enter` 提交；答错后 `F` 重试，或 `R` 将整个 Scene 切换为学习模式。
- 场景核心：`Space` 返回 HOME。
- Master Bedroom 床边：`G` 睡觉；Kitchen / Diningroom 餐点：`G` 进食。
- `/`：帮助；`Esc`：退出输入或关闭当前遮罩。

## 数据重新导入

当前数据与素材已包含在项目中，可离线运行。如需从原始目录重新导入：

```powershell
$env:HOME_ATLAS_SOURCE='C:\path\to\悬赏'
npm run import:assets
npm run validate:assets
```

源目录必须包含 `Home.txt`、`Home地图.jpg`、`homeXmindPics/`，以及包含已提取素材的 `HomePalace/assets/`。脚本不会修改源目录。

## 测试

```bash
npm run validate:assets
npm test
npm run test:e2e
```

- Vitest 覆盖严格练习状态机、最新状态计分、三色进度、完成度边界、疲劳/饥饿、睡眠跳时和自动地图连通性。
- Playwright 使用 Microsoft Edge 覆盖 HOME→Kitchen 学习/练习流程、练习答案隐私、输入焦点隔离、答错后 R 切学习及 1024×768 响应式布局。
- `npm run capture` 在本地开发服务器 `http://127.0.0.1:4173/` 运行时生成视觉验收截图。

实际执行结果见 `TEST_REPORT.md`。

## 项目结构

```text
data/                    world.json、热点与素材报告
public/assets/           HOME 地图、609 张条目图、字体与反馈音
source_assets/           原始素材只读副本
scripts/                 导入、校验与截图脚本
src/app/                 输入、存档、游戏时钟和集中状态提交
src/logic/               练习状态机、计分和需求系统
src/render/              HOME Canvas、Three.js 2.5D、地图生成与角色
src/ui/                  HUD、词卡、帮助、引导与完成界面
tests/                   单元测试与 Edge 端到端测试
```

## 存档与故障排查

- 单一存档键：`homeAtlas.save.v1`；损坏数据备份到 `homeAtlas.corrupt.v1`。
- “新开世界”只移除本游戏存档，不调用 `localStorage.clear()`。
- 若 2.5D 场景显示 WebGL 错误，请启用浏览器硬件加速并使用最新版 Chrome / Edge。
- 若 TTS 无声，请确认系统安装了对应英语语音；游戏会继续运行，练习逻辑不受影响。
