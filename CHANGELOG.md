# Changelog

## v5.7.0 - 2026-11-13

### Models

- **Gemini Web 渠道模型目录对齐实时选择器**：以 `otAQ7b` 模式清单与线上模型选择器双向校验后重排四个模型 —— `56fdd199312815e2`（**4 Hydrogen**，默认，`mode: 1`）、`8c46e95b1a07cecc`（**3.5 Flash-Lite**，`mode: 6`）、`e6fa609c3fa255c0`（**3.1 Pro**，`mode: 3`）、`argon`（**4 Argon**，`mode: 8`）。`4 Hydrogen` 取代 `3.8 Flash` 成为默认模型，`3.1 Pro` 重新回到可选列表。
- **Web 模型标识跟进线上契约**：Flash-Lite 采用选择器实际下发的 `8c46e95b1a07cecc`，Argon 采用符号化模式 ID `argon`；`cf41b0e0dd7d53e5`、`95a4c0abcba24364`、`gemini-3.8-flash`、`gemini-3.1-pro` 等历史标识保留为别名。侧边栏与快速提问工具栏在恢复设置时都会先归一化旧标识，已保存的模型选择不会被静默重置为默认值。
- **原生思考等级补入 `MEDIUM (4)`**：线上脚本的 thinking 枚举新增 `THINKING_LEVEL_MEDIUM = 4`，选择器「中」档实际下发 `4`；此前 `medium` 被错误映射为 `EXTENDED (2)`，现按模型最低档位分别映射（`minimal`/`low` → `1`、`medium` → `4`、`high` → `2`）。
- **官方 API 默认模型升级至 Gemini 4**：默认模型改为 `gemini-4-hydrogen`，默认列表更新为 `gemini-4-hydrogen, gemini-4-argon, gemini-4-carbon, gemini-3.5-flash-lite`；`gemini-3.1-pro` 作为别名解析到当前仍在服务的 `gemini-3.1-pro-preview`。

### Chore

- 逆向协议文档、README 与设置页模型占位文案同步至新模型；drift 检查新增 `THINKING_LEVEL_MEDIUM` 标记。
- 版本号升级至 `5.7.0`。

## v5.6.0 - 2026-10-15

### Features

- **快捷键体系全面扩充与原生命令注册**：
    - `manifest.json` 注册系统级浏览器控制命令 `browser-control`（默认 `Alt+Shift+B`），支持在浏览器快捷键管理中自定义。
    - 新增高效工作流全局快捷键：`Alt+N`（新对话，兼容 `Ctrl+Shift+O`）、`Alt+T`（切换思考深度）、`Alt+H`（展开/收起历史记录侧边栏）、`Alt+S`（区域截图输入/截屏提问）。
    - 在主要操作按钮 Tooltip 与侧边栏中明确标示快捷键引导，并在设置面板快捷键列表中集中展示。

### Fixed & UI Polish

- **可访问性与输入框焦点导航**：移除提示框对 `Tab` 键的拦截，解决 WCAG 2.1.2 键盘焦点陷阱，模型切换改由 `Ctrl+M`（或 `Cmd+M`）接管，同时确保在表单输入框中不发生快捷键误触。
- **国际键盘输入防劫持**：在可编辑元素中输入字符时防止 Plain Alt 组合键拦截 macOS 或欧洲键盘的特殊符号字符（如 `œ`, `ø`, `ß` 等）。
- **暗色主题语义色彩全面对齐 (WCAG AAA)**：在 `[data-theme='dark']` 补齐 Material 3 语义色彩（`--danger: #f2b8b5`, `--success: #81c995`, `--warning: #fdd663`），将错误信息与状态胶囊对比度提升至 10.7:1 以上，彻底解决暗色底下的低辨识度问题。
- **划词大图预览关闭按钮视觉修复**：修复工具栏全屏大图预览在暗色模式下关闭按钮“白底加白字”近乎隐形的缺陷，接入自适应设计 Token 并加入平滑微交互动效。
- **快捷键迁移泛化**：升级 content script 中的快捷键迁移算法，全键位自动动态扫描校验，避免手动硬编码键名维护。
- **扩展重载上下文失效防护**：扩展重载或更新后，防止未刷新的历史标签页在用户交互时抛出 `Extension context invalidated` 异常；自动检测并清理孤立监听器，安全隔离静态资源与运行时通信。
- **Keep-Alive 瞬态网络错误降级**：Cookie 轮换遭遇网络瞬断时日志降级为 `console.warn`，配合退避重试，避免 Chrome MV3 误报红色错误卡片。
- **Native 消息日志断开异常捕获**：在未安装本地日志主机时，显式消费 `port.onDisconnect` 中的 `runtime.lastError`，消除 `Unchecked runtime.lastError` 报错。

### Chore

- 版本号升级至 `5.6.0`。

## v5.5.0 - 2026-10-14

### Models

- **Gemini 4 Argon 适配**：全面上线 Google 官方最新首选模型 **Gemini 4 Argon**（`95a4c0abcba24364`，RPC 模式 `mode: 8`），用于处理复杂任务与深度推理，支持快速（低点）与深度（高点）思考等级切换。
- **Web 逆向渠道别名补齐**：新增 `gemini-4-argon`、`gemini-4`、`4-argon` 等别名映射；将最新 Flash-Lite 探测 hash `8c46e95b1a07cecc` 纳入别名解析保证平滑兼容。

### Fixed

- **图片工具黑名单与水印开关不再丢失**：`view.getFormData()` 漏传这两个字段，导致黑名单输入重载即失效，且每次点击保存都会把「移除生成图水印」静默重置为开启。
- **独立设置页恢复加载 GitHub 元数据**：原先调用重命名后已不存在的 `fetchGithubData`，被可选链静默吞掉，star 数与更新状态从不刷新。
- **TTS 失败提示本地化**：错误文案原为硬编码中文，英文界面用户会收到中文报错；现统一走工具栏词典（中/英双语）。
- **页面快照能力标记重复**：快照格式化器对 `editable/modal/required/readonly/multiselectable` 会输出两遍同一能力 token。
- **Provider 错误信息统一抽取**：官方 API 渠道此前直接抛出原始响应体，现与 Anthropic、OpenAI 兼容渠道一致解析 `{error:{message}}`。

### Security

- `downloadText` 对来自 sandbox 消息的文件名执行与 `downloadFile` 同级的净化（此前仅后者处理该不可信输入）。

### Removed

- 清理可读性审计遗留死代码：未使用的工具栏图标、孤儿 i18n key、仅供本模块使用的导出、签名相同的纯转发包装（含 `shared/media/youtube.js` 空壳，其测试改为直接覆盖全局实现，覆盖率保留）。
- 删除与代码不符的注释：payload 索引写错、把 CDP 控制管理器标注为 MCP、承诺但未绑定的 `pointerup` 监听、声称「为测试保留」却无任何测试读取的门面。
- 移除恒真分支、被包含的正则分支、无调用方传入的参数，以及不可达的兜底抛出。
- 移除样式表与 CSS-in-JS 中的装饰性分节横幅；原有 hygiene 规则只覆盖 `//` 形式，现已扩展到 `/* */` 并补上测试。

### Chore

- 版本号升级至 `5.5.0`。

## v5.4.0 - 2026-09-04

### Models

- **多渠道默认模型与思考适配全面更新**：
    - OpenAI 官方渠道：默认模型升级为 `gpt-5.6-terra`，默认列表更新为 `gpt-5.6-terra, gpt-5.6-sol, gpt-5.6-luna, gpt-6-astra`。
    - Anthropic 渠道：默认模型升级为 `claude-sonnet-5`，全系更新至 Generation 5（`claude-opus-5`, `claude-fable-5-1`），并适配 Claude 5 Adaptive Thinking 自适应思考协议。
    - OpenRouter 渠道：默认模型升级为 `openai/gpt-5.6-terra`，模型列表更新为 `openai/gpt-5.6-terra, anthropic/claude-sonnet-5, google/gemini-3.1-pro, deepseek/deepseek-v4-flash`。
    - 智谱 AI 渠道：全面升级至 GLM-5 系列（`glm-5.3, glm-5.2, glm-5.1, glm-5`），默认模型 `glm-5.3`。
    - 通义千问渠道：纳入 Qwen 3.8 系列（`qwen3.8-max, qwen3.8-flash-next`），默认模型 `qwen3.8-max`。
    - 官方 API 渠道：Pro 模型去除 `-preview` 预览后缀，统一映射规范 ID `gemini-3.1-pro`。

### Reliability

- 请求超时收口：上传（60s）、TTS（30s）加整体超时；SSE 流加 120s 空闲超时，stall 不再永久挂起。
- 四家 provider 统一 finish/stop reason：截断与内容拦截转显式错误，不再把空回复当成功写入历史。
- 附件上限：单次最多 10 个、单文件 20MB，超限发送前即失败并提示。
- 启动队列：flush 失败重试一次后留痕；移除重复 Markdown 初始化。

### Performance

- 流式渲染加守卫跳过：无公式/无代码块的消息每 token 省掉 KaTeX 扫描与 artifact 全树扫描（同步语义不变）。
- Graphviz 预览缓存 LRU（30 项）；消息删除/清空时释放 Live Artifact 监听器与 iframe。
- Web 流读取器全路径释放；取消窗口按会话隔离。

### Security

- `sidePanelTabId` 交叉校验：带 tab 的发送方只能作用于自身 tab，声称其他 tab 的请求被纠正。

### Chore

- 版本号升级至 `5.4.0`。

## v5.3.0 - 2026-09-03

### Models

- **Gemini 3.8 Flash 适配**：全面上线 Google 官方最新首选模型 **Gemini 3.8 Flash**。
    - Web 逆向免 Key 渠道：默认 Flash 模型标签升级为 `3.8 Flash`（哈希 `56fdd199312815e2`），新增 `gemini-3.8-flash` 别名映射，向后兼容 `gemini-3.7-flash`。
    - 官方 API 渠道：默认模型更新为 `gemini-3.8-flash`，默认模型列表更新为 `gemini-3.8-flash, gemini-3.5-flash-lite, gemini-3.1-pro-preview`。

### UI & Style

- **复刻 AMC-WebUI 发送按钮**：
    - 采用紧凑尺寸 `36px × 36px`、全圆角 `border-radius: 9999px` 与 `translateY(-2px)` 微调居中。
    - 浅色模式背景 `#3964fe`（悬停 `#3358e0`），深色模式背景 `#679efe`（悬停 `#5a8de0`）。
    - 空输入状态保持底色并启用 `40%` 透明度（`opacity: 0.4`）。
    - 生成/停止状态采用实心危险红（浅色 `#dc2626` / 深色 `#7f1d1d`），移除多余外圈旋转动画。
    - 图标全面替换为 AMC 16×16 向上箭头（发送）与实心圆角方块（停止）。
- **界面设计语言统一与重构**：
    - 顶栏模型选择器改为药丸型（Pill）设计，优化下拉选择器宽度计算与响应式适配。
    - 历史会话恢复时抑制重复淡入动效，解决批量还原时的界面闪烁。
    - 修复动作卡片、Markdown 表格样式与 Token 变量层。

### Chore

- 版本号升级至 `5.3.0`。

## v5.2.4 - 2026-08-24

### Style

- **内容脚本暗色自适应**：新增 `--gnx-*` token 层（`styles/core.js`），`.toolbar` / `.ask-window` / `.image-btn` 全部接通 `prefers-color-scheme: dark` —— 悬浮面板、AI 菜单、markdown 正文/代码块/hljs 高亮在暗色系统下不再是刺眼纯白；浅色下工具条由永久黑改为白底描边，与页面融合。
- **统一三代蓝**：侧栏拖拽高亮 `var(--accent-color,#1a73e8)` → `var(--primary)`，面板芯片 `#e8f0fe/#d2e3fc` 与各处 `#0b57d0/#0842a0` 收敛为 `--gnx-primary/-hover/-chip` 单一来源。
- **一致性清理**：合并 `widget.js` 重复 `.btn` 块、删除 `footer.js` 重复 border 行、`transition: all` 改具体属性并补 easing、菜单项补 `:focus-visible` 焦点环、拖拽把手灰阶入 token、`.ai-tool-menu` 字体栈对齐 toolbar、hljs 增加暗色配色。
- **token 化**：`--radius-bubble`（用户气泡 16px 入册）、`--accent-gold`（星标金）、空态标题 `font-weight 650→600`（CJK 稳定）、提示字号 `12.5→13px`、消息容器 transition 对齐 `--ease-standard`。

### Chore

- 版本号 `5.2.3` → `5.2.4`。

## v5.2.3 - 2026-08-24

### Fixed

- **朗读用粤语**：`speech_reader` 之前 `utterance.lang = navigator.language` 且 Gemini `locale` 透传，导致 `zh-HK/yue/zh-MO` 系统直接读粤语。现含中文一律 `zh-CN`（普通话）、`hasHan` 文本检测、`pickMandarinVoice` 显式选 `zh-CN` 非粤语 voice（排除 粤语/Cantonese/Sin-ji/HK），Gemini 端同样 `resolveTtsLocale(text)`。

### Chore

- 版本号 `5.2.2` → `5.2.3`。

## v5.2.2 - 2026-08-24

### Fixed

- **朗读（TTS）总是报错**：`speech_reader` 此前 Gemini TTS 失败直接抛错（未登录/限流/自动播放被拦均显示“错误”）。现改为：失败自动回退到系统 `speechSynthesis`、预创建 `Audio` 保留用户手势、`NotAllowedError` 中文提示、`supported` 兼容 `globalThis/window`、 voices 就绪与 `onerror` 日志；`gemini_tts` 兼容 `)]}'` 前缀、`tts_handler` 追加 429/Session expired 可重试判断。

### Chore

- 版本号 `5.2.1` → `5.2.2`。

## v5.2.1 - 2026-08-24

### Fixed

- **并发/取消**：`session_manager` 改为按 `Map<key,AbortController>` 管理请求（`prompt` / `quickAsk:${tabId}`），`prompt_handler` / `quick_ask_handler` 透传 `abortKey` + `cancellableDelay`，避免切标签页/并发 QuickAsk 误取消及 `payload already prepared` 后的泄漏。
- **SSE 解析**：`services/providers/sse.js` 支持 `\r\n|\n|\r` 分割、`data:` 多行拼接、`event/id/retry/:comment`、`[DONE]`、`MAX_BUFFER 5MB`、尾部 flush、`AbortSignal` 透传并 `releaseLock`，Web/Official 流不再丢事件/泄漏 reader。
- **XSS/渲染**：`pipeline.js` 移除 `data:image/svg+xml` 放行、大小写不敏感属性校验、`data-*` 严格正则、SVG `viewBox` 白名单；`crop_global.js` 校验 `NaN/负数/0`、`scale∈[0.5,3]`、`MAX_PIXELS 16M`、base64 20MB 限长、10s 加载超时。
- **设置持久化**：`settings_store` 指针轮转加 `pointerRotationQueue` 串行化；`auth.js` 加 8s 超时、`ok` 校验、`Map` 去重并发、`data-index` 单引号兼容。
- **MCP 连接**：`sse_connection` / `websocket_connection` 加超时/正确清理 `endpointPromise` 与 `fetch` 定时器；`handshake` 指数退避 `150*2^i+jitter`、首错保留、4xx 快速失败。
- **工具链**：`tool_loop` 修复 `batchId` 碰撞（`counter+random`）、多工具 `appendRawMessages` 全量落盘、`browserControl` 快照失败显式提示；`tool_executor` `statusKey` 加随机避免 SW 重启重复；`content` 侧 `page_guard`/`selection`/`blacklist`/`shortcuts`/`messages` 修复静态/缓存/最小化负载等问题。
- **UI**：对齐 Cherry Studio/AMC 图标与聊天气泡样式，修复工具栏 tooltip 与侧栏生成态卡死清理。

### Chore

- 版本号 `5.2.0` → `5.2.1`（`package.json` / `manifest.json` / `package-lock.json`）。

## v5.2.0 - 2026-08-22

### Models

- Removed **Gemini 3.6 Flash** (`fbb127bbb056c959`) from Web model catalog; default now **3.7 Flash** (`56fdd199312815e2`) with `legacyMode: 2` and extended capabilities, `DEFAULT_STORED_GEMINI_MODEL` updated and `DEFAULT_OFFICIAL_MODELS` now `gemini-3.7-flash, gemini-3.5-flash-lite, gemini-3.1-pro-preview`; removed `gemini-3-flash-thinking` alias and its thinking check.

### UI

- Aligned toolbar **Generate Image** icon to Cherry Studio `lucide Image` (`m21 15-3.086-3.086...`).
- Aligned **Live Artifacts** icon to AMC-WebUI `Wand2/WandSparkles` (`m21.64 3.64...`).
- Aligned **Explain** icon to AMC `FileQuestion` (`M12 17h.01 / M15 2H6... / M9.1 9a3...`).
- Aligned **New Chat** icon to AMC/Cherry Studio `IconNewChat` (bubble + plus `M13 4H6a2...` with `scale(1.1)`).
- Added **quick hover tooltip** for toolbar buttons: custom `data-tooltip` appears in 0.12s centered above button, suppressing native delayed `title` via `WidgetView.initTooltips`.

## v5.1.0 - 2026-07-22

### Models

- Updated reverse Gemini Web model catalog for the 2026-07-21 GA lineup: default **3.6 Flash** (`fbb127bbb056c959`), **3.5 Flash-Lite** (`cf41b0e0dd7d53e5`), and **3.1 Pro** (`e6fa609c3fa255c0`). Removed **3.5 Flash** and legacy **3.1 Flash-Lite**.
- Updated Official API defaults to `gemini-3.6-flash`, `gemini-3.5-flash-lite`, and `gemini-3.1-pro-preview`. Dropped `gemini-3-flash` / `gemini-3-flash-preview` aliases.

### Removed

- Removed the experimental **Browser MCP server** surface (`mcp-server/`, `npm run mcp:http`, extension `browser_mcp` RPC bridge). Side-panel browser control remains internal (`ControlManager`); external MCP **client** settings for third-party tools are unchanged.

## v5.0.24 - 2026-07-17

### 侧栏可用性

- 修复 sandbox 启动失败 `Cannot read properties of undefined (reading 'local')`：`updateImageTools` 不再调用 `chrome.storage`（sandbox 无 chrome API）；补齐 `RESTORE_IMAGE_TOOLS_BLACKLIST`；恢复消息 dispatch 失败不中断启动。
- 修复侧栏大量按钮无响应：Vite `base: './'` + 打包把 HTML `/assets/` 改为相对路径，避免 sandbox 动态模块加载失败导致事件未绑定；骨架层默认 `pointer-events: none`。
- 修复发送卡住：`forceClearGenerating` / 卡住后带正文再发；普通对话 watchdog 90s；SW 启动广播 `SERVICE_WORKER_STARTED` 清除僵尸生成态。
- 生成态与 watchdog 改为 idle-only 清理（超时取消）；中间 agent 消息可展示；工具披露图标与控制按钮对齐。

### 浏览器控制与 Web

- **新标签页跟随**：`target=_blank` / 下载页等 opener 关联标签自动切换控制权；attach 失败回滚；`run_steps` 切换后刷新快照，避免 SERP 点击后仍停在搜索页空转。
- **下载观测**：新增 `list_downloads` / `wait_for_download`（lookback 感知 `ignoreExisting`），manifest 声明 `downloads` 权限。
- 中文「将/会/就」等叙述意图收紧；模型只口述不发工具 JSON 时 nudge 一次。
- a11y 快照隐藏扩展自有 UI（光标、overlay、工具栏、YouTube 摘要等）。
- 缩短浏览器控制 system preamble：硬规则前置（必须发工具 JSON、禁止纯计划回复），压缩策略与工具目录。
- UID 过期：导航 `reset` 递增版本号；`getObjectIdFromUid` 自动 re-snapshot 并重试；`run_steps` / tool loop 失败附带恢复快照。
- Web 空响应：分类提示 + buffer 样本；stream 错误优先暴露；终端错误写入历史，避免只剩用户消息。
- Keep-Alive：连续网络失败降噪日志；429 加大退避。

### 本地调试桥

- 可读完整使用记录：`GET /sessions`、`/sessions/:id`、`/records`、`/groups`、`/storage/keys` 与对应 RPC；附件 data URL 默认脱敏。说明见 `docs/local-debug-bridge.md`。

## v5.0.19 - 2026-07-15

- 修复侧边栏「点发送没反应」：生成态卡住时不再静默吞掉点击；`BACKGROUND_REQUEST_ERROR` 会清 loading；空内容发送给出状态提示；发送按钮空态改为可点反馈（`is-empty`）而不是 `disabled` 完全无事件。
- 增加 3 分钟生成 watchdog、sandbox 启动失败可见错误，以及 SEND_PROMPT 全链路 console 日志（可经本地 debug bridge 实时观察）。

## v5.0.18 - 2026-07-15

- 新增**本地调试桥**（Local Debug Bridge）：Native Messaging Host 在扩展连接时于 `http://127.0.0.1:17321` 暴露 HTTP/SSE，本地工具可实时拉取日志与状态（Chrome MV3 扩展本身无法监听 TCP）。
- Host API：`GET /health`、`GET /logs`、`GET /logs/stream`（SSE）、`GET /status`、`POST /rpc`；可选 `GEMINI_NEXUS_BRIDGE_TOKEN`；非 loopback 绑定强制要求 token。
- `NativeLoggerSink` 支持双向 RPC（`ping` / `get_logs` / `get_status`），启用时立即 `connectNative` 以保持 bridge 存活；说明见 `docs/local-debug-bridge.md`。

## v5.0.17 - 2026-07-15

- 修复侧边栏 sandbox 回传目标源错误：manifest sandbox 页为 opaque origin。此前安全加固误用 `chrome.runtime.getURL('')` 作为 `postMessage` targetOrigin，消息被静默丢弃，侧边栏一直转圈/无 AI 正文（浏览器控制任务仍可在后台执行）；`postMessage(..., 'null')` 在 Chrome 会抛 `Invalid target origin 'null'`。现改回对 sandbox `contentWindow` 使用 `'*'`（只投递到该 iframe，不是广播），并补充 frame 回归测试。

## v5.0.16 - 2026-07-13

- 修复悬浮弹窗（划词 / 快速提问）Markdown 不渲染：语言偏好异步恢复后会重建工具栏 UI，却未重建 sandbox 渲染 bridge，导致结果以原始 Markdown 文本显示；现在每次重建都会重新创建 bridge。
- 悬浮窗 renderer 模式改为等待 `marked` 真正加载完成（不再吃 sidepanel 的 5 秒软超时），bridge 不可用时安全转义为纯文本，并补充 bridge / loader 回归测试。
- 修复侧边栏发送路径上的鉴权与上下文误重置：避免每次发送都 `RESET_CONTEXT` 与多账号轮换，keep-alive 过期时清理内存中的 auth，并收紧晚到回复的 stream 清理、MCP 工具匹配与 debugger 挂起时的 detach。
- 恢复页面上下文按钮相关 CSS；修正 native logger 安装脚本的扩展 ID 推导（32 位 a-p）与绝对 Node shebang，unpacked 开发环境默认开启 native 日志。

## v5.0.15 - 2026-07-11

- 新增浏览器控制复合工具 `run_steps`：把确定的、无分支的多步操作序列（如 导航→等待→点击、填表→提交）压成一次工具调用，减少 agent 循环往返与 2–4 秒/轮的限流延迟。顺序复用已有 22 个原子动作（遮挡检测、JS 回退、导航等待全继承），≤8 步，任一步失败即停并报出失败步骤，末尾默认返回一次快照。
- 安全约束：标签页切换工具（`new_page`/`close_page`/`select_page`）仅允许作为 `run_steps` 的最后一步（中间切标签页会让后续步骤静默打在旧标签页上）；`run_steps` 不可嵌套自身。
- 抽取 `ToolDispatcher.TOOL_METHOD_MAP` 共享常量，`dispatch` 与 `run_steps` 复用同一张 tool→method 映射，避免两处路由漂移。
- 修复 `chrome.runtime.onSuspend` 注册错误：原写法 `onSuspend?.(cb)` 把 Event 对象当函数调用，抛 `TypeError`，导致 SW 挂起前的 debugger 清理从未生效（受控标签页会卡在"正在调试"infobar 上，重启后无恢复路径）。改为 `onSuspend?.addListener?.(cb)`。

## v5.0.14 - 2026-06-23

- 修复高刷新率（120Hz/144Hz）屏幕上 AI 光标动画偏快的问题：将帧步进对齐到 Browser Control Bridge 的真实 `elapsed` 逻辑（仅首帧补一个名义帧，其余按真实 delta 推进），使光标运动与墙钟时间同步，不再随刷新率成倍加快。
- 经逐参数核对，光标的视觉外观与运动参数（尺寸、旋转、辉光、弹簧 response/damping、贝塞尔弧线、思考摆动等）已与 Browser Control Bridge 完全等价，本次仅修复移植时丢失的这一处帧步进分支。

## v5.0.13 - 2026-06-17

- 为浏览器控制的点击、悬停、填表、上传等交互操作新增 AI 光标可视化，移植自 Browser Control Bridge 的弹簧物理与贝塞尔弧线运动引擎，含蓝色辉光指针与到达后的“思考”摆动。
- 光标覆盖层按需经 `chrome.scripting` 注入受控标签页，动画到达后回传并 fail-open 等待，detach、切换标签或页面导航时自动隐藏与清理，绝不阻塞实际操作。
- 同步扩展打包流程与 manifest `web_accessible_resources` 以纳入光标脚本与图片资源，并为按需注入脚本补充 manifest 回归测试例外。

## v5.0.12 - 2026-06-07

- 替换 Gemini 去水印实现，接入 `gemini-watermark-remover-extension` 的 GWR 主世界脚本与处理 runtime。
- 移除旧的 Nexus 采样遮盖去水印链路，改用 GWR bridge 代理状态读取和跨域图片请求。
- 同步 Gemini 与 business Gemini 页面注入、扩展打包和生成图片去水印处理，并补充对应回归测试。

## v5.0.11 - 2026-06-02

- 新增页面级快捷键桥接与后台转发，支持顶部页面和 iframe 内触发快速提问、区域 OCR 等页面快捷命令。
- 将快速提问（悬浮）默认快捷键调整为 `Alt+Q` / macOS `Option+Q`，并迁移旧默认 `Ctrl+Q` 配置。
- 修复 macOS Option 组合键录入时显示特殊字符的问题，设置页现在按物理键位显示 `Alt+Q`。
- 改进侧边栏作用域、保活、菜单和内容脚本注入相关流程，并补充页面快捷键、设置恢复和扩展打包回归测试。

## v5.0.10 - 2026-05-28

- 新增划词朗读 Gemini Web TTS，逆向接入 Gemini 网页“听回复”的 `XqA3Ic` GetTts RPC，返回 Ogg 音频并在内容脚本中播放。
- 为 TTS 请求增加 Gemini Web auth 上下文复用、未登录识别和一次刷新重试，保留浏览器原生 speech synthesis 兜底。
- 重新打包扩展，并将本次浏览器控制、专门 API 渠道和 TTS 集成整理为补丁版发布。

## v5.0.9 - 2026-05-27

- 优化浏览器控制链路，增强快照 UID 稳定性、导航后的缓存清理、弹窗检测提示和动作后的等待逻辑。
- 改进表单自动化，`fill` / `fill_form` 现在能更可靠处理 checkbox、radio 和 switch 类型控件。
- 优化工具调用过程显示，工具状态使用唯一调用键并记录耗时，避免连续同名工具调用互相覆盖。
- 为工具调用过程卡片增加动作图标并修正卡片对齐位置，覆盖浏览器控制动作、常见 MCP 工具关键词和未知工具兜底显示。
- 新增 OpenAI 官方、DeepSeek、Anthropic、智谱专门 API 渠道，保留 OpenAI Compatible 通用渠道，同时为 Claude Messages、DeepSeek reasoning、GLM thinking 和 OpenAI Responses 提供专门适配。
- 新增 OpenRouter 与通义 / DashScope 专门 API 渠道，OpenRouter 可从 `/models` 刷新模型列表，并支持 provider routing JSON、OpenRouter `reasoning` 参数和 DashScope `enable_thinking` / VL 模型请求。
- 补充浏览器控制、工具调用状态和工具卡片渲染相关回归测试。

## v5.0.8 - 2026-05-26

- 新增页面与选中文本朗读能力，扩展内容工具栏的语音阅读入口与回归测试覆盖。
- 增强 Gemini Web 工作流，支持临时对话开关、更新 Web 模型目录，并加入 Gemini Web 逆向契约文档与漂移检查脚本。
- 优化侧边栏、设置页和数据管理体验，保存设置时会给出明确反馈，并补充 YouTube 总结、页面上下文、截图/浏览器控制等工作流支撑。
- 拆分后台 UI、会话和控制相关模块，补强工具栏图标、图片识别、侧边栏状态和扩展打包的结构化测试。

## v5.0.7 - 2026-05-24

- 修复 Gemini Web 上传图片后直接要求修改图片时，生成/编辑结果被误判为上传图回显并被隐藏的问题。
- 优化 Web 图片结果过滤逻辑，保留 `/gg-dl/`、图片生成占位符和明确修图意图返回的生成图片，同时继续过滤普通图片分析里的上传图回显。
- 让侧边栏左上角品牌区域点击时等同于收起侧边栏，并补充对应模板与交互回归测试。

## v5.0.6 - 2026-05-24

- 优化侧边栏交互，补齐 AMC 风格键盘焦点、按时间分组的历史记录、折叠态最近聊天弹层和侧边栏图标一致性。
- 改进聊天输入与模型选择体验，新增 Web Thinking 控制并完善相关状态恢复。
- 新增会话导出、数据管理和 artifact 预览/渲染链路，扩展生成内容与附件的导出覆盖。
- 强化 Web 渠道、设置桥接、窗口动作和侧边栏状态同步的回归测试。

## v5.0.5 - 2026-05-23

- 优化设置页和工具栏结构，补充独立设置入口、帮助按钮和图标相关测试。
- 改进 MCP 连接与工具配置管理，增强连接状态、工具列表和设置保存的回归覆盖。
- 完善项目发布、代码卫生和结构检查脚本，补充 GitHub 模板、Dependabot 与发布工作流维护配置。

## v5.0.4 - 2026-05-16

- 修复 Ask 窗口尺寸保存依赖 `chrome.storage.local` 时缺少存储 API 会中断窗口显示的问题。
- Ask 窗口显示时会安全恢复已保存尺寸，并在当前视口范围内限制最大宽高。
- 补充 Ask 窗口尺寸保存、恢复和存储不可用场景的回归测试。

## v5.0.3 - 2026-05-11

- 修复工具调用协议 JSON 在流式输出中被短暂渲染成普通代码块的问题，已确认的工具调用内容会交给工具信息框展示。
- 修复相邻或异常 fenced JSON 工具调用残片残留在最终正文中的问题，避免出现多余代码块和复制按钮。
- 修复空 fenced code block 仍渲染代码块外壳和复制按钮的问题。
- 修复 OpenAI 兼容渠道模型切换不会独立记住的问题，现在 OpenAI 当前模型选择会与 Gemini/Web 模型选择分开保存。
- 同步侧边栏和内容工具栏的 OpenAI 模型恢复逻辑，切换渠道或重新打开后会优先恢复 OpenAI 专属选择。
- 补充工具调用文本解析、流式显示、空代码块、OpenAI 模型持久化和侧边栏 iframe URL 相关回归测试。

## v5.0.2 - 2026-05-09

- 修复多标签页侧边栏归属问题，标签页级侧边栏会保持自己的 owner tab，不再跟随浏览器当前激活标签页变化。
- 修复非当前标签页侧边栏发送消息和接收回复时的 tab 过滤问题，避免多个侧边栏之间串会话或收不到最终回复。
- 优化侧边栏打开和关闭性能，减少开合过程中的同步焦点、重绘和 resize 抖动。
- 优化生成过程中的滚动体验，正文流式输出会在用户停留底部时持续跟随最新内容，用户主动上滑后不再强制拉回底部。
- 修复生成完成后存储刷新重建当前会话导致滚动位置跳回回复开头的问题。
- 补充侧边栏归属、存储刷新滚动恢复、流式 sticky-to-bottom 和侧边栏渲染性能相关回归测试。

## v5.0.1 - 2026-05-08

- 修复 MCP 和 Gemini 原生工具调用的展示与恢复问题，工具调用现在会以折叠卡片展示，并保留工具名、状态、调用参数、输出和多工具调用顺序。
- 修复上下文压缩和最近历史裁剪会把工具输出当作用户轮次计数的问题，现在只统计真实用户请求，并统一默认最近轮次保留配置。
- 修复侧边栏空白会话被持久化的问题，未发送第一条消息前保持为草稿状态，发送后再创建真实历史会话。
- 补充核心聊天链路回归测试，覆盖侧边栏会话状态、Gemini 解析、工具调用、官方接口响应和上下文管理。
- 修复工具调用卡片和思考状态行相邻显示时上下间距不一致的问题，统一普通消息、工具调用和思考状态之间的垂直节奏。

## v5.0.0 - 2026-05-07

- OpenAI 兼容 API 新增 Responses API 开关，默认继续使用 Chat Completions，也可以按需切换到 Responses API。
- OpenAI 兼容 API 新增联网搜索开关，会根据当前接口自动使用对应的联网能力：Chat Completions 使用 `web_search_options`，Responses API 使用 `web_search`。
- OpenAI 官方推理模型现在支持显示 reasoning summary，并优化了思考过程的实时耗时、最终耗时和历史恢复显示。
- 生成中的会话可以在后台继续运行；切换到其他历史会话不会中断生成，切回后可继续看到实时输出。
- 历史会话列表会标记正在生成的会话，方便在多个会话之间切换时识别后台任务。
- 优化联网搜索来源展示，减少正文里的重复裸链接，让来源以更轻量的形式显示。
- 设置页操作按钮移动到顶部栏，保存和恢复默认不再需要滚动到底部。

## v4.2.20 - 2026-05-02

- 修复思考完成耗时包含完整回复生成时间的问题，现在只统计思考阶段。
- 修复正式回复开始后思考区域未立即自动折叠的问题。
- 修复回复继续生成时手动展开思考区域会被后续流式更新反复折叠的问题。

## v4.2.19 - 2026-04-29

- 优化思考过程展示效果，生成过程中自动展开并实时更新，生成完成后自动折叠。
- 思考完成态新增耗时显示，并补充中英文状态文案与展开/收起可访问性标签。
- 将思考内容改为轻量折叠区域样式，弱化边框卡片感并保留手动展开查看。

## v4.2.18 - 2026-04-28

- 为 OpenAI 兼容 API 渠道新增独立 Thinking Level 设置，可选择 minimal、low、medium、high。
- OpenAI 兼容 API 请求会将所选思考强度作为 `reasoning_effort` 发送，并与 Gemini API 的 Thinking Level 设置分开保存。
- 上下文摘要压缩请求同步使用 OpenAI 渠道的 Thinking Level 设置，保持普通聊天和压缩链路一致。

## v4.2.17 - 2026-04-28

- 修复 API 渠道上下文自动压缩后仍携带完整历史导致下一轮重复触发压缩的问题。
- 将压缩后的上下文作为隐藏的 API 历史消息持续复用，并在达到阈值后重新压缩为新的隐藏上下文。
- 修复重新打开会话后上下文压缩提示未恢复的问题。
- 避免当前用户消息同时作为历史消息和当前提示重复发送给 API。

## v4.2.16 - 2026-04-27

- 新增上下文管理功能，API 渠道默认使用摘要压缩长会话，并可切换为最近 N 轮裁剪。
- 新增上下文压缩状态提示，压缩完成或失败时在聊天记录中给出明确反馈。
- 优化设置页布局，将通用、外观、快捷键和上下文管理区域统一为一致的设置面板样式。
- 更新 README 中当前版本的功能说明，并移除赞助相关内容。

## v4.2.15 - 2026-04-27

- 新增历史用户消息编辑功能，支持从编辑位置截断后续消息并重新继续对话。
- 历史消息编辑仅在 Gemini API 和 OpenAI 兼容 API 渠道启用，Gemini Web 渠道保持禁用以避免不可靠的分支回放。
- 优化侧边栏编辑交互，编辑按钮与复制按钮纵向排列，编辑框样式对齐底部输入区域。
- 修复扩展运行或更新后右键菜单重复注册导致的 duplicate id 报错。
- 内联早期主题和语言初始化逻辑，移除 Vite 关于非 module 脚本的构建提示。
