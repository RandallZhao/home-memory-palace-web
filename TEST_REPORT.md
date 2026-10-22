# 运行与测试报告

执行日期：2026-10-22（Asia/Shanghai）

## 素材校验

- `npm run validate:assets`：通过。
- 12 个 Scene、85 个 Area、524 个词汇、524 个唯一词汇 ID。
- 609/609 个 Area/词汇图片路径存在；3 个已确认占位图在报告中显式列出。

## 单元测试

- `npm test`：3 个测试文件、19 个测试全部通过。
- 覆盖：UNSEEN/LIT/WRONG/CORRECT_FIRST/CORRECT_RETRY、重复失败、错误后正确、新轮覆盖旧成绩、三色叠加、99% 边界、524 词总分、疲劳、饥饿、睡眠跳时、全部地图道路连通与词汇锚点可达。

## 浏览器测试

- `npm run test:e2e`：Microsoft Edge，3 个测试全部通过。
- 已验证：首次引导、HOME 原图、Kitchen 热点、Space→R/F、2.5D 场景、练习答案隐藏、输入 `f/r/e/w/q/a` 不触发移动或模式、答错后 R 切换整个场景、1024×768 响应式布局。
- 截图捕获后页面错误：0。

## 正式构建

- `npm run build`：通过。
- Vite 7.3.7；27 个模块完成转换；构建产物输出到 `dist/`。
- 初始主脚本约 187 kB（gzip约 32 kB）；Three.js 2.5D 渲染按进入房间时动态加载，拆分为约 332 kB（gzip约 81 kB）的独立块，避免拖慢 HOME 首屏。

## 视觉验收截图

- `screenshots/home-atlas-home.png`
- `screenshots/home-atlas-kitchen.png`

视觉检查后已缩小词汇牌、按距离显示学习标签，并让角色在前景遮挡时保持可见。

## V7.1 视觉回归补充

- 分支：`feat/visual-v7.1`；回滚标签：`v7.0-baseline`（`4e48999`）。
- 素材校验：12 Scene、85 Area、524 Word、524 个唯一 ID，全部路径通过。
- 单元回归：3 个文件、19 项测试全部通过。
- Edge 交互回归：3 项测试全部通过，覆盖学习、练习隐私、答错切换学习及 1024px 响应式布局。
- 生产构建：Vite 7.3.7，27 个模块转换成功。
- 自动截图：Home 三种视口、低密度 Area、高密度 Area、学习卡、练习输入和系统帮助；浏览器错误 0。
- 保持不变：地图数据、道路几何、移动与按键、学习/练习流程、积分、时间、存档和语音机制。

V7.1 截图位于 `screenshots/comparisons/after/`；基线截图位于 `screenshots/comparisons/before/`。

## 有道在线词典增量验证

- 单元测试：4 个测试文件、23 项通过；覆盖 `individual.trs` 优先级、`ec.word.trs` 真实回退、英音 `type=1`、美音 `type=2` 及浏览器请求去重。
- 实际在线查询 `water`：英音 `/ˈwɔːtə(r)/`、美音 `/ˈwɔːtər/`、释义 `n. 水，雨水`。
- 实际原声音频：英音 10,989 字节、美音 10,797 字节；SHA-256 前缀分别为 `784480FCD32B9B53`、`CB7CEF43A73D4D77`，确认两份响应不同。
- Edge 端到端回归：原有 3 项流程通过；新增在线有道词卡与 Q→美音/E→英音请求测试。
- 浏览器端已移除 `speechSynthesis` 与 TTS 文案；在线失败显示明确错误。
