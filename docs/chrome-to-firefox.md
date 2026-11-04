# 从 Chrome 扩展移植到 Firefox

这份文档来自 Gemini Nexus 9.0.8 的实际移植。Chrome 包在 `artifacts/chrome-extension/`，Firefox 包在 `artifacts/firefox-extension/`。两边共用同一套源码，差异集中在打包时改写的 manifest，以及一个只在 Firefox 生效的兼容层。

下次移植另一个 Chrome MV3 扩展时，按下面的顺序做。不要先复制出一份 Firefox 专用源码树。当前 Firefox 产物只来自 `npm run package:firefox`。

项目里和这次移植对应的文件：

- 兼容层：`shared/compat/firefox_shim.js`
- Firefox 打包：`scripts/package-firefox.mjs`
- Chrome 打包：`scripts/package-extension.mjs`
- 侧栏开关：`background/managers/sidepanel_scope_manager.js`
- 本扩展的 Firefox 说明：`docs/firefox.md`

## 先定一条原则

一套源码，两个打包命令。

- Chrome：`npm run package:extension`，产物 `artifacts/chrome-extension/`
- Firefox：`npm run package:firefox`，产物 `artifacts/firefox-extension/` 和 `artifacts/gemini-nexus-firefox-<version>.zip`

运行时代码里用能力检测，不要用一堆 `if (isFirefox)` 散落在业务里。兼容层在 Chrome 上必须是空操作：Firefox 才有 `globalThis.browser`，Chrome 没有，所以 shim 一开始看到没有 `browser` 就直接返回。

兼容层要在任何其它扩展代码碰 `chrome.*` 之前执行。背景页、侧栏页、沙箱页、设置页用 ES module 的第一行 `import`。内容脚本不能靠 import，打包时把 shim 插到每条内容脚本的最前面。`world: "MAIN"` 的那条不要插，它跑在网页上下文里，不能改页面的 `browser` / `chrome`。

## 推荐顺序

1. 先在 `about:debugging` 里加载未签名目录，确认能打开、能关掉、能再打开。签名解决不了运行时打不开的问题。
2. 改 manifest，让 Firefox 愿意加载。
3. 补回调兼容，否则存储、标签、菜单会静默挂死。
4. 把 Chrome 专有 UI（side panel、sandbox、debugger）换成 Firefox 有的能力，没有的就明确降级。
5. 用正斜杠重新打 zip，再交给 AMO。
6. 有 Vite 或打包产物时，另外准备一份源码包。

## Manifest 对照

下面是 9.0.8 两个包的实际差别。

| 项目 | Chrome | Firefox |
| --- | --- | --- |
| 背景页 | `background.service_worker` | `background.scripts` + `type: "module"` |
| 侧栏 | `side_panel.default_path`，权限 `sidePanel` | `sidebar_action.default_panel`，没有 `sidePanel` 权限 |
| 沙箱页 | `sandbox.pages`，外加 `content_security_policy.sandbox` | 删掉。Firefox 没有扩展 sandbox 页 |
| 扩展 ID | `key`（Chrome 用来固定 ID） | 删掉 `key`。用 `browser_specific_settings.gecko.id` |
| 权限 | 含 `sidePanel`、`debugger`、`tabGroups` | 这三项删掉，Firefox 不认 |
| 内容脚本 | 可以有 `exclude_globs` | 删掉 `exclude_globs`，否则 manifest 无效 |
| CSP | `extension_pages` 和 `sandbox` 两条 | 只留 `extension_pages` |
| 最低版本 | 无 | `strict_min_version: 128.0`，因为用了 `world: "MAIN"` |
| 数据收集声明 | 无 | `data_collection_permissions.required: ["none"]`。Firefox 140+ 的新提交需要它 |

Firefox 背景页不要写 `service_worker`。Firefox 还没有 MV3 service worker（bug 1573659）。`scripts` 加上 `type: "module"` 从 Firefox 112 起可用，页面会按事件页加载。

`gecko.id` 一旦签过名就不能改。改了会被当成另一个附加组件。本扩展的 ID 是 `gemini-nexus-firefox@haso2007`。

## API 行为：最容易漏掉的一层

现代 Firefox 里 `chrome` 和 `browser` 是同一个只返回 Promise 的对象。Chrome 那种尾部回调会被静默丢掉，也不会设置 `runtime.lastError`。

表现不是抛错，而是功能像死掉：

- `chrome.storage.local.get(keys, callback)` 的 callback 永不执行
- `new Promise((resolve) => chrome.tabs.getCurrent(resolve))` 永远 pending
- `chrome.contextMenus.create`、`chrome.alarms.get` 同样收不到回调

shim 把 `browser.*` 包一层：异步方法仍然返回 Promise，如果最后一个参数是函数，就把它当成 Chrome 回调，失败时填 `runtime.lastError`。`addListener` 这类监听方法不要包成“最后参数是回调”的形式，否则会把监听器吃掉。`runtime.onMessage` 还要单独处理：Firefox 的 `sendMessage` 只认 Promise 返回值，内容脚本里 `return true` 再异步 `sendResponse` 的写法要由 shim 转成 Promise。

检查方法：在 Firefox 背景页控制台看存储读取是否返回。如果设置页能打开但导入导出没反应，先查是不是回调被丢了。

上面是 Gemini Nexus 这次移植的实测，shim 按它来写。不要把它写成所有 Firefox 版本的前提。BookmarkHub 0.0.8 用 WXT 打出 Firefox MV2、常驻背景页，没有复现：设置走 `webext-polyfill-kinda`，调用的是 `chrome.storage` 的尾部回调；角标修好之后下载能完成，说明这条回调还能回包。对照当前 mozilla-central，`chrome` 和 `browser` 仍是两个对象。`chrome` 带 `isChromeCompat`，异步方法会把最后一个函数参数交给 `callAsyncFunction`。`ExtensionChild` 的 `MessageEvent` 在监听器 `return true` 时继续等 `sendResponse`。先在目标版本的背景页打一条 `chrome.storage.local.get`。只有回调不回来时才上 shim。

## 侧栏：这次实际坏过的地方

Chrome 的 `chrome.sidePanel` 在 Firefox 不存在。工具栏按钮也不会因为写了 `sidebar_action` 就自动打开侧栏。必须在 `action.onClicked` 里自己调用 `browser.sidebarAction`。

Firefox 这组 API 和 Chrome 不一样，照搬参数会失败：

| 调用 | Chrome | Firefox |
| --- | --- | --- |
| 打开 | `sidePanel.open({ tabId, windowId })` | `sidebarAction.open()`，不能带参数 |
| 关闭 | `sidePanel.setOptions({ tabId, enabled: false })` | `sidebarAction.close()`，不能带参数 |
| 切换 | 自己记开关状态再 open/close | `sidebarAction.toggle()`，不能带参数 |
| 查是否打开 | 扩展自己记 | `sidebarAction.isOpen({ windowId })` |
| 换页面 | `sidePanel.setOptions({ path, tabId })` | `sidebarAction.setPanel({ panel, tabId })` |
| 用户手势 | 相对宽松，await 之后有时还能 open | `open` / `close` / `toggle` 带 `requireUserInput`。先 `await` 再调用，会报只能在用户操作里调用 |

三个已经验证过的坑：

1. 把 `{ windowId }` 传给 `sidebarAction.open()`。schema 规定零参数，多一个参数就类型错误。侧栏看起来完全没打开。
2. 用内存里的 `openTabs[tabId]` 判断开关。用户点侧栏自己的关闭按钮后，页面不一定来得及发 `SIDE_PANEL_CLOSED`，内存仍是“开着”。下一次点图标会去关闭一个已经关掉的侧栏，表现为图标没反应。
3. `setOptions({ enabled: false })` 不能一律映射成 `sidebarAction.close()`。Chrome 在给某个标签启用侧栏时，会先把默认面板设成 `enabled: false`。这条如果也去 close，刚打开的侧栏会立刻被关掉。只有“没有 path、明确要关掉”的调用才能 close。

正确做法：工具栏点击的同一次调用栈里，先同步 `setPanel`，再同步 `toggle()`。不要先 await `isOpen()`。toggle 返回之后再 `isOpen({ windowId })`，用真实状态回写内存。

`sidebarAction.open()` 只打开当前窗口，没有 `windowId` 参数。`isOpen` 才接受 `{ windowId }`。

账号或权限不足时，Firefox 不会报“没有这个 API”。侧栏只是不开，或者打开后马上被浏览器换掉。先用未签名包在 `about:debugging` 里确认点击链路，再查权限。

## 页面、CSP、内联脚本

Firefox 扩展页只认 `extension_pages` 这条 CSP。本扩展是 `script-src 'self'`。HTML 里的内联 `<script>` 不会执行。

Chrome 可以把聊天 UI 放进 `sandbox` 页，sandbox CSP 允许 `'unsafe-inline'`。Firefox 没有这个页面类型。处理办法：

- manifest 删掉 `sandbox` 和 `content_security_policy.sandbox`
- 内联启动脚本抽成外部文件。这里是 `sandbox/theme_boot.js`，由 `sandbox/index.html` 用 `<script src="./theme_boot.js">` 引用
- Vite 构建时如果提示某个 script 没有 `type="module"`，这是预期的，那个文件本来就是经典脚本

内容脚本的 `world: "MAIN"` 需要 Firefox 128+。低于这个版本，页面世界的脚本不会按你写的方式注入。`strict_min_version` 要跟着写。

## 有意降级，不要假装还能用

| Chrome 能力 | Firefox 里怎么做 |
| --- | --- |
| `chrome.debugger` 附着标签、走 CDP | 没有。浏览器控制改用 `chrome.scripting.executeScript` 做 DOM 快照和点击。文件选择框、原生 `alert` / `confirm` / `prompt` 做不到 |
| `chrome.tabGroups` | 没有。调用前用可选链跳过，不要让它抛错中断控制流程 |
| `sidePanel.setOptions({ enabled })` 按标签开关 | 没有等价物。打开和切换用 `sidebarAction`，按标签禁用是尽力而为 |
| `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` | 空操作。Firefox 不会因此自动打开侧栏 |
| `browser.action`（仅当产物仍是 MV2） | 没有。MV2 只有 `browser.browserAction`。用 `browser.action ?? browser.browserAction`，调用失败不能挡在 `sendResponse` 前面 |

这些降级要写进用户可见的说明，不要等审核或用户试完才发现。

### MV2 没有 `browser.action`

上面的 Firefox 包是 MV3，`browser.action` 存在。打包器若仍输出 MV2，不能沿用这个假设。WXT 0.19 的 `wxt build -b firefox` 默认就是 MV2：manifest 里是 `browser_action`，不是 `action`。Firefox 给 `action` 命名空间标了 `min_manifest_version: 3`，MV2 里只有 `browser.browserAction`。

BookmarkHub 0.0.8 在这里坏过。下载做完后，背景页先调用 `browser.action.setBadgeText`，再 `sendResponse`。`browser.action` 是 `undefined`，抛错发生在回复之前。弹窗的 `sendMessage` 一直不返回，确认框停在 “Processing...”。

角标写成 `browser.action ?? browser.browserAction`，失败自己吃掉。上传、下载、同步、清空、导入都在操作结束的 `finally` 里回复，成功和失败都要回。

## 打包

`package:firefox` 先跑 Vite，再跑 `scripts/package-firefox.mjs`。打包器复用 Chrome 的文件布局和内容脚本合并，然后只改 manifest。

Windows 上不要用 `Compress-Archive` 生成提交给 AMO 的 zip。它会把路径写成 `assets\arc-ekeAq8Wa.js`。AMO 的报错是：

```text
Invalid file name in archive: assets\arc-ekeAq8Wa.js
```

zip 条目必须是 `assets/arc-ekeAq8Wa.js`。本仓库的 `writeStoreZip()` 用 Node 自己写 zip，强制正斜杠。换电脑打包时也要走这个函数，不要手打 zip。

打完后用这个检查：

```text
python -c "import zipfile; z=zipfile.ZipFile(r'artifacts/gemini-nexus-firefox-9.0.8.zip'); print(any(chr(92) in n for n in z.namelist()))"
```

输出 `False` 才能上传。同时看 `manifest.json` 的 `version` 和 `browser_specific_settings.gecko.id`。

版本号要同时改 `package.json`、`package-lock.json`、`manifest.json`。Firefox 新版本必须高于已经签过名的版本。

## 提交 AMO 签名

两个文件职责不同：

| 文件 | 用途 |
| --- | --- |
| `artifacts/gemini-nexus-firefox-<version>.zip` | 附加组件文件，用来签名 |
| `artifacts/gemini-nexus-firefox-<version>-source.zip` | 只有网站要源码时才传 |

源码包不要包含 `node_modules`、`dist`、`artifacts`。里面要有 `package.json`、`package-lock.json`，以及一份审核员能照着执行的构建说明。本扩展的说明是源码包根目录的 `AMO-BUILD.txt`。审核员执行：

```text
npm ci
npm run package:firefox
```

提交步骤：

1. 打开 [附加组件开发者中心](https://addons.mozilla.org/developers/)。已有扩展就进那个扩展的 **Upload New Version**。第一次提交选 **Submit a New Add-on**，不要另建一个 ID。
2. 上传扩展 zip，不要把源码包传到这一格。
3. **On this site** 会公开上架并人工审核。**On your own** 只签名、不公开，通常更快。
4. 问到是否包含压缩、合并或工具生成的代码时选 Yes。Vite 产物算。
5. 再上传源码 zip，构建说明粘贴 `AMO-BUILD.txt`。
6. `<all_urls>` 要在说明里写清用途。这里是网页划词工具栏和页面工具。不收集数据时，`data_collection_permissions` 用 `none`。
7. 状态变成已签名后下载 `.xpi`。

签名前先用 `about:debugging` → Load Temporary Add-on 加载 `artifacts/firefox-extension/manifest.json`。临时加载看的是目录，不是 zip。zip 只影响上传。

## 下次移植的验收清单

加载未签名包之后，按这个表点一遍。每一项都是这次实际出过问题、或者 Firefox 和 Chrome 行为不同的地方。

- 扩展能安装，背景页控制台没有 manifest 解析错误。
- 点工具栏图标，侧栏打开。
- 点侧栏自己的关闭按钮，再点图标，侧栏重新打开。
- 再点一次图标，侧栏关闭。
- 设置能读出来，改完能写回去。这是回调兼容的冒烟测试。先确认目标 Firefox 上回调是否真的被丢，再决定要不要上 shim。
- 产物若是 MV2，做一次会改角标、也会 `sendResponse` 的操作。确认框要离开 “Processing...”，结果通知要出现。
- 内容脚本在普通网页里生效。MAIN world 那条仍只注入目标站。
- 依赖 debugger 或 tabGroups 的功能失败时，其余功能还在。
- 扩展页没有因内联脚本或 sandbox CSP 而白屏。
- zip 条目没有反斜杠，版本号和 gecko id 正确。
- 源码包按 `AMO-BUILD.txt` 能重新打出同一个扩展 zip。

## 不要做的事

- 不要维护两套业务源码。Firefox 差异放进 shim 和打包器。
- 不要在 MAIN world 内容脚本里加载 shim。
- 不要把 Chrome 的 `sidePanel.open({ windowId })` 原样打到 `sidebarAction.open`。
- 不要用“内存里记着侧栏开过”代替 `sidebarAction.isOpen()`。
- 不要在 `await` 之后再调用 `open` / `close` / `toggle`。
- 不要在 Firefox MV2 里直接调用 `browser.action`。它不存在，抛错会吃掉还没发出的 `sendResponse`。
- 不要用 PowerShell `Compress-Archive` 做商店包。
- 不要把源码 zip 当成要签名的附加组件上传。
- 不要在签过名之后修改 `gecko.id`。
