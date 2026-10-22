# Changelog

## V7.1 - 视觉统一（2026-10-22）

- 基线代码提交：`4e48999`
- 新增补丁：`docs/patches/V7.1-visual-design.md`
- 修改范围：视觉令牌、地图材质、节点视觉、卡片视觉与视觉回归证据
- 保持不变：游戏规则、数据模型、地图层级、移动与按键、音频来源
- 对比截图：`screenshots/comparisons/before/` 与 `screenshots/comparisons/after/`
- 回滚目标：`v7.0-baseline`
- 子补丁提交：A `32c362c`；B `810bd85`；C `79689c7`；D 见 `feat/visual-v7.1` 分支 HEAD
- 验证结果：素材清单通过；19 项单元测试通过；3 项 Edge 交互测试通过；生产构建通过；截图控制台与资源错误 0
- 风险/待办：未提供 V7 规范原文件，仓库仅归档现有 V6 与本次 V7.1 补丁；当前可运行代码仍作为产品基线

## 有道在线词典（2026-10-22）

- 新增同源后端代理，运行时在线访问 `https://dict.youdao.com/jsonapi` 与 `dictvoice`。
- 词卡统一采用有道英美音标与中文释义；`individual.trs` 优先，同一响应的 `ec.word.trs` 作为真实回退。
- Q 严格请求美音 `type=2`，E 严格请求英音 `type=1`；彻底移除浏览器 TTS。
- 保持图片、词名、Scene/Area/Word 层级、学习规则、积分、移动、存档和练习隐私不变。

