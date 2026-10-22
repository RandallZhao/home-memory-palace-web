# 已知问题

以下问题来自现有素材或平台能力限制，不是被静默省略的功能。

1. `Garden > Tree Grove > wood`、`Storeroom > Cleaning Port > dust mop`、`Washroom > Cleaning Station > dustpan` 在原始 XMind OCR 提取时没有找到可靠裁图，因此当前显示明确的“图片待补充”占位。
2. 词典数据依赖有道在线服务和用户网络；上游没有返回词条、音标、释义或音频时，词卡会明确显示失败或缺失，不会编造内容。
3. 浏览器不能直接跨域读取有道 JSON，因此项目必须通过 `server.mjs` 启动。纯静态 GitHub Pages 无法提供该代理；部署时需要支持 Node.js 的主机或等价的服务端代理。
4. 词汇图片是从用户提供的整张 XMind 图自动裁取，少数主体在白底画框中偏小或仅显示局部，但图片与词条路径一一对应，未使用无关替代图。
