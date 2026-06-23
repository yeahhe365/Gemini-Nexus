const u={en:{searchPlaceholder:"Search for chats",historyToday:"Today",historyYesterday:"Yesterday",historyPrevious7Days:"Previous 7 Days",historyPrevious30Days:"Previous 30 Days",noConversations:"No conversations found.",newGroup:"New Group",newGroupTitle:"Untitled",newGroupTooltip:"Create new group",renameGroup:"Rename",deleteGroup:"Delete group",deleteGroupConfirm:"Delete this group? Chats inside it will move back to Recent.",settings:"Settings",pageContext:"Page",browserControl:"Browser Control",liveArtifacts:"Artifacts",quote:"Quote",ocr:"OCR",snip:"Snip",screenshotTranslate:"Translate",screenCapture:"Screen",askPlaceholder:"Ask Gemini...",chatEmptyTitle:"Gemini Nexus",chatEmptyHint:"Ready when you are.",sendMessage:"Send message",generating:"Generating",stopGenerating:"Stop generating",settingsTitle:"Settings",general:"General",apiSettings:"API",connectionProvider:"Model Provider",providerWeb:"Gemini Web Client (Free)",webTemporaryChat:"Temporary chat",providerOfficial:"Gemini API",providerOpenAI:"OpenAI Compatible API",providerOpenAIOfficial:"OpenAI Official API",providerDeepSeek:"DeepSeek API",providerOpenRouter:"OpenRouter API",providerDashScope:"Qwen / DashScope API",providerAnthropic:"Anthropic API",providerZhipu:"Zhipu API",mcpTools:"External MCP Tools",mcpToolsDesc:"Connect to an MCP server and use its tools in chat.",mcpActiveServer:"Active Server",mcpAddServer:"Add",mcpRemoveServer:"Remove",mcpServerName:"Name",mcpTestConnection:"Test Connection",mcpToolMode:"Expose Tools",mcpToolModeAll:"All tools (default)",mcpToolModeSelected:"Selected tools only",mcpRefreshTools:"Refresh Tools",mcpEnableAllTools:"Enable All",mcpDisableAllTools:"Disable All",mcpToolSearchPlaceholder:"Search tools...",mcpSummarySetServerUrl:"Set Server URL to manage tools.",mcpSummaryAllTools:'All tools will be exposed. Click "Refresh Tools" to preview the tool list.',mcpSummaryNoTools:'No tool list loaded. Click "Refresh Tools" to load tools, then select which to expose.',mcpSummarySelected:"Mode: {mode}. Tools exposed: {count}/{total}.",mcpModeAll:"all",mcpModeSelected:"selected",mcpOtherTools:"Other tools",mcpSwitchToSelected:'Switch to "Selected tools only" to choose which tools the model can use.',mcpNoToolsLoaded:"No tools loaded yet.",mcpFetchingTools:"Fetching tools...",mcpTestingConnection:"Testing connection...",mcpConnectedTools:"Connected. Tools: {count}",mcpConnectionFailed:"Connection failed",mcpFailed:"Failed: {error}",mcpFetchToolsFailed:"Failed to fetch tools",mcpTransport:"MCP Transport",mcpServerUrl:"MCP Server URL",mcpHeaders:"Request Headers (JSON)",mcpHeadersPlaceholder:'{"Authorization":"Bearer xxx"}',mcpHeadersDesc:"Optional JSON object. Applied to SSE and Streamable HTTP requests.",enabled:"Enabled",apiKey:"API Key",apiKeyPlaceholder:"Paste your API Key",officialBaseUrlPlaceholder:"e.g. https://generativelanguage.googleapis.com/v1beta",officialWebSearch:"Enable Google Search grounding",openaiUseResponsesApi:"Use Responses API",openaiWebSearch:"Enable OpenAI API web search",providerRouting:"Provider Routing (JSON)",providerRoutingPlaceholder:'{"order":["openai"],"allow_fallbacks":true}',refreshModels:"Refresh",modelListFetching:"Fetching models...",modelListUpdated:"Loaded {count} models.",modelListFailed:"Failed to fetch models",modelIds:"Model IDs",modelIdsCommaSeparated:"Model IDs (comma separated)",officialModelPlaceholder:"e.g. gemini-3-flash-preview, gemini-3.1-pro-preview",thinkingLevel:"Thinking Level",thinkingLevelGemini3:"Thinking Level (Gemini 3)",thinkingMinimal:"Minimal",thinkingMinimalFlashOnly:"Minimal (Flash only)",thinkingLow:"Low",thinkingLowFaster:"Low (faster)",thinkingMedium:"Medium",thinkingMediumBalanced:"Medium (balanced)",thinkingHigh:"High",thinkingHighDeepReasoning:"High (deep reasoning)",sourcesLabel:"Sources",showMoreSources:"Show {count} more",showLessSources:"Show less",thoughtsStreaming:"Thinking...",thoughtsComplete:"Thought process",thoughtsCompleteWithDuration:"Thought for {seconds}s",thoughtsExpand:"Expand thought process",thoughtsCollapse:"Collapse thought process",editMessage:"Edit message",cancelEdit:"Cancel",saveEdit:"Send",editNotSupportedForWeb:"Message editing is not supported for Gemini Web Client.",baseUrl:"Base URL",baseUrlPlaceholder:"e.g. https://api.openai.com/v1",modelIdPlaceholder:"e.g. gpt-4o, claude-3-5-sonnet",textSelection:"Text Selection Toolbar",textSelectionDesc:"Show floating toolbar when selecting text.",textSelectionBlacklist:"Text Selection Blacklist",textSelectionBlacklistDesc:"Disable the text selection toolbar on matching sites.",textSelectionBlacklistPlaceholder:`github.com
*.google.com
example.com/docs`,customSelectionTools:"Custom Selection Tools",customSelectionToolsDesc:"Add your own prompts to the text selection toolbar.",customSelectionToolAdd:"Add Tool",customSelectionToolNamePlaceholder:"Tool name",customSelectionToolPromptPlaceholder:"Prompt template, use {text} for selected text",customSelectionToolRemove:"Remove",imageToolsToggle:"Show Image Tools Button",imageToolsToggleDesc:"Show the AI button when hovering over images.",generatedImageWatermarkToggle:"Auto Clean Generated Image Watermark",generatedImageWatermarkToggleDesc:"Automatically removes the Gemini corner mark only from images generated by Gemini Nexus.",sidebarBehavior:"When Sidebar Reopens",sidebarBehaviorAuto:"Auto restore or restart",sidebarBehaviorAutoDesc:"Restore if opened within 10 mins, otherwise start new chat.",sidebarBehaviorRestore:"Always restore previous chat",sidebarBehaviorNew:"Always start new chat",sidePanelScope:"Side Panel Visibility",sidePanelScopeGlobal:"All tabs",sidePanelScopeRememberedTabs:"Remember tabs where it was opened (Recommended)",accountIndices:"Account Indices (Multi-account)",accountIndicesDesc:"Comma-separated user indices (e.g., 0, 1, 2) for polling.",contextManagement:"Context Management",contextMode:"Mode",contextModeDesc:"Summarize older messages or keep only recent turns for API providers.",contextModeSummary:"Summary compression",contextModeRecent:"Recent turns only",contextRecentTurns:"Recent turns",contextRecentTurnsDesc:"Number of latest user turns kept verbatim.",contextCompressing:"Compressing conversation context...",contextCompressed:"Context automatically compressed",contextCompressionFallback:"Context compression failed, context has been truncated",appearance:"Appearance",theme:"Theme",language:"Language",keyboardShortcuts:"Keyboard Shortcuts",shortcutDesc:"Click input and press keys to change.",quickAsk:"Quick Ask (Floating)",openSidePanel:"Open Side Panel",shortcutFocusInput:"Focus Input",shortcutSwitchModel:"Switch Model (in Input)",shortcutBrowserControl:"Open Browser Control",shortcutOcrCapture:"Area OCR",resetDefault:"Reset Default",saveChanges:"Save Changes",settingsSaved:"Saved",debugLogs:"Debug Logs",downloadLogs:"Download Logs",dataManagement:"Data Management",historyDataTitle:"Chat History",settingsDataTitle:"Settings Backup",exportHistoryData:"Export History",importHistoryData:"Import History",exportSettingsData:"Export Settings",importSettingsData:"Import Settings",dataImportFailed:"Failed to read import file.",dataImportError:"Import failed: {error}",historyImportSuccess:"History imported.",settingsImportSuccess:"Settings imported.",about:"About",sourceCode:"Source Code",releases:"Releases",systemDefault:"System Default",light:"Light",dark:"Dark",cancelled:"Cancelled.",deleteChatConfirm:"Delete this chat?",delete:"Delete",renameChat:"Rename",pinChat:"Pin",unpinChat:"Unpin",pinnedChat:"Pinned",duplicateChat:"Duplicate",duplicateChatTitle:"{title} copy",shareChat:"Copy share text",shareChatCopied:"Share text copied.",shareChatFailed:"Failed to copy share text.",exportChatTxt:"Export TXT",exportChatJson:"Export JSON",exportRoleUser:"User",exportRoleAssistant:"Assistant",exportTitle:"Title",exportedAt:"Exported at",exportMessages:"Messages",exportAttachments:"Attachments",exportGeneratedImages:"Generated images",exportSources:"Sources",exportThoughts:"Thoughts",moreOptions:"More options",recentChats:"Recent chats",imageSent:"Image sent",selectOcr:"Select area for OCR...",selectSnip:"Select area to capture...",selectTranslate:"Select area to translate...",selectScreenCapture:"Choose a screen or window to capture...",processingImage:"Processing image...",screenCaptureFailed:"Screen capture failed.",failedLoadImage:"Failed to load image.",errorScreenshot:"Error processing screenshot.",noTextSelected:"No text selected on page.",ocrPrompt:'OCR this image. Extract visible text exactly as written, following reading order and preserving line breaks, lists, tables, and punctuation where practical. Output only the extracted text; if no text is visible, output "No text detected."',screenshotTranslatePrompt:'Extract visible text from this image and translate it into English. Follow reading order and preserve line breaks, lists, and tables where practical. Output ONLY the translation; if no text is visible, output "No text detected."',loadingImage:"Loading image...",noLogsToDownload:"No logs to download.",readingPage:"Reading page content...",pageReadSuccess:"Read page content (~{count} chars)",copy:"Copy",copied:"Copied",copyCode:"Copy code",copyContent:"Copy content",liveArtifactPreview:"Preview",liveArtifactPreviewTitle:"Artifact preview",liveArtifactRendering:"Rendering preview...",liveArtifactPreviewFailed:"Preview failed.",generatedImage:"Generated Image",customModel:"Custom Model",defaultMcpServer:"MCP Server",toolFallbackName:"tool",toolStatusRunning:"Using {name}...",toolStatusFailed:"Failed {name}",toolStatusCancelled:"Cancelled {name}",toolStatusUsed:"Used {name}",toolBadgeRunning:"Running",toolBadgeFailed:"Failed",toolBadgeCancelled:"Cancelled",toolBadgeDone:"Done",rawTool:"Raw tool",stepLabel:"Step {step}",callLabel:"Call {index}/{count}",durationLabel:"{duration}",collapseTool:"Collapse {name}",expandTool:"Expand {name}",toggleHistory:"Chat History",newChatTooltip:"New Chat",pageContextTooltip:"Toggle chat with page content",browserControlTooltip:"Allow model to control the browser",liveArtifactsTooltip:"Toggle Live Artifacts responses",quoteTooltip:"Quote selected text from page",ocrTooltip:"Capture area and extract text",screenshotTranslateTooltip:"Capture area and translate text",screenCaptureTooltip:"Capture another screen or app window",snipTooltip:"Capture area to input",uploadImageTooltip:"Upload File",zoomOut:"Zoom Out",zoomIn:"Zoom In",resetZoom:"Fit to Screen",downloadImage:"Download Image",close:"Close",sendMessageTooltip:"Send message",openFullPageTooltip:"Open in full page",modelSelectTooltip:"Select Model (Tab to cycle)",headerThinkingToggleAria:"Toggle thinking level",headerThinkingMinimalFastTitle:"Thinking: Minimal (Fast Mode)",headerThinkingLowFastTitle:"Thinking: Low (Fast Mode)",headerThinkingHighTitle:"Thinking: High (Deep Mode)",selectTab:"Select Active Tab",selectTabTooltip:"Select a tab to control",noTabsFound:"No open tabs found.",browserControlReady:"Ready",browserControlDebugging:"Debugging",browserControlNoTab:"Choose a tab to control",browserControlUnavailable:"Unavailable",browserControlUnavailableReason:"Cannot control this page",controlTabInBackground:"Control without switching",currentTab:"Current",stopBrowserControl:"Stop browser control"},zh:{searchPlaceholder:"搜索对话",historyToday:"今天",historyYesterday:"昨天",historyPrevious7Days:"最近 7 天",historyPrevious30Days:"最近 30 天",noConversations:"未找到对话。",newGroup:"新建分组",newGroupTitle:"无标题",newGroupTooltip:"创建分组",renameGroup:"重命名",deleteGroup:"删除分组",deleteGroupConfirm:"删除这个分组？其中的对话会移回最近。",settings:"设置",pageContext:"网页",browserControl:"浏览器控制",liveArtifacts:"产物",quote:"引用",ocr:"OCR",snip:"截图",screenshotTranslate:"截图翻译",screenCapture:"屏幕截图",askPlaceholder:"询问 Gemini...",chatEmptyTitle:"Gemini Nexus",chatEmptyHint:"随时可以开始。",sendMessage:"发送消息",generating:"正在生成",stopGenerating:"停止生成",settingsTitle:"设置",general:"常规",apiSettings:"API",connectionProvider:"模型来源",providerWeb:"Gemini 网页版 (免费)",webTemporaryChat:"临时对话",providerOfficial:"Gemini API",providerOpenAI:"OpenAI 兼容 API",providerOpenAIOfficial:"OpenAI 官方 API",providerDeepSeek:"DeepSeek API",providerOpenRouter:"OpenRouter API",providerDashScope:"通义 / DashScope API",providerAnthropic:"Anthropic API",providerZhipu:"智谱 API",mcpTools:"外部 MCP 工具",mcpToolsDesc:"连接到 MCP 服务器，并在对话中调用其工具。",mcpActiveServer:"当前服务器",mcpAddServer:"添加",mcpRemoveServer:"移除",mcpServerName:"名称",mcpTestConnection:"测试连接",mcpToolMode:"工具暴露方式",mcpToolModeAll:"全部工具（默认）",mcpToolModeSelected:"仅选择的工具",mcpRefreshTools:"刷新工具列表",mcpEnableAllTools:"全部启用",mcpDisableAllTools:"全部禁用",mcpToolSearchPlaceholder:"搜索工具...",mcpSummarySetServerUrl:"请先设置服务器地址以管理工具。",mcpSummaryAllTools:"将暴露全部工具。点击“刷新工具列表”可预览工具列表。",mcpSummaryNoTools:"尚未加载工具列表。点击“刷新工具列表”后选择要暴露的工具。",mcpSummarySelected:"模式：{mode}。已暴露工具：{count}/{total}。",mcpModeAll:"全部",mcpModeSelected:"已选择",mcpOtherTools:"其他工具",mcpSwitchToSelected:"切换到“仅选择的工具”后，可以选择模型可使用的工具。",mcpNoToolsLoaded:"尚未加载工具。",mcpFetchingTools:"正在获取工具列表...",mcpTestingConnection:"正在测试连接...",mcpConnectedTools:"已连接。工具数：{count}",mcpConnectionFailed:"连接失败",mcpFailed:"失败：{error}",mcpFetchToolsFailed:"获取工具列表失败",mcpTransport:"MCP 传输方式",mcpServerUrl:"MCP 服务器地址",mcpHeaders:"请求头（JSON）",mcpHeadersPlaceholder:'{"Authorization":"Bearer xxx"}',mcpHeadersDesc:"可选 JSON 对象，应用于 SSE 和 Streamable HTTP 请求。",enabled:"启用",apiKey:"API Key",apiKeyPlaceholder:"粘贴 API Key",officialBaseUrlPlaceholder:"例如 https://generativelanguage.googleapis.com/v1beta",officialWebSearch:"启用 Google 搜索联网",openaiUseResponsesApi:"使用 Responses API",openaiWebSearch:"启用 OpenAI API 联网搜索",providerRouting:"Provider Routing（JSON）",providerRoutingPlaceholder:'{"order":["openai"],"allow_fallbacks":true}',refreshModels:"刷新",modelListFetching:"正在获取模型列表...",modelListUpdated:"已加载 {count} 个模型。",modelListFailed:"获取模型列表失败",modelIds:"模型 IDs",modelIdsCommaSeparated:"模型 IDs（逗号分隔）",officialModelPlaceholder:"例如 gemini-3-flash-preview, gemini-3.1-pro-preview",thinkingLevel:"思考级别",thinkingLevelGemini3:"思考级别（Gemini 3）",thinkingMinimal:"Minimal",thinkingMinimalFlashOnly:"Minimal（仅 Flash）",thinkingLow:"Low",thinkingLowFaster:"Low（更快）",thinkingMedium:"Medium",thinkingMediumBalanced:"Medium（均衡）",thinkingHigh:"High",thinkingHighDeepReasoning:"High（深度推理）",sourcesLabel:"来源",showMoreSources:"展开剩余 {count} 条",showLessSources:"收起来源",thoughtsStreaming:"正在思考...",thoughtsComplete:"思考过程",thoughtsCompleteWithDuration:"已深度思考（用时 {seconds} 秒）",thoughtsExpand:"展开思考过程",thoughtsCollapse:"收起思考过程",editMessage:"编辑消息",cancelEdit:"取消",saveEdit:"发送",editNotSupportedForWeb:"Gemini 网页版暂不支持编辑历史消息。",baseUrl:"Base URL (接口地址)",baseUrlPlaceholder:"例如 https://api.openai.com/v1",modelIdPlaceholder:"例如 gpt-4o, claude-3-5-sonnet",textSelection:"划词工具栏",textSelectionDesc:"选中网页文本时显示悬浮工具栏。",textSelectionBlacklist:"划词黑名单",textSelectionBlacklistDesc:"在匹配的网站上禁用划词悬浮工具栏。",textSelectionBlacklistPlaceholder:`github.com
*.google.com
example.com/docs`,customSelectionTools:"自定义划词工具",customSelectionToolsDesc:"把你自己的 Prompt 添加到划词工具栏。",customSelectionToolAdd:"添加工具",customSelectionToolNamePlaceholder:"工具名称",customSelectionToolPromptPlaceholder:"Prompt 模板，用 {text} 表示划词内容",customSelectionToolRemove:"移除",imageToolsToggle:"显示图片工具按钮",imageToolsToggleDesc:"鼠标悬停在图片上时显示 AI 按钮。",generatedImageWatermarkToggle:"自动清理生图水印",generatedImageWatermarkToggleDesc:"仅对 Gemini Nexus 自己生成的图片自动移除 Gemini 角标/水印。",sidebarBehavior:"当侧边栏重新打开时",sidebarBehaviorAuto:"自动恢复或重新开始",sidebarBehaviorAutoDesc:"如果在10分钟内重新打开，聊天将恢复；如果超过10分钟，将开始新的聊天",sidebarBehaviorRestore:"始终恢复上次的聊天",sidebarBehaviorNew:"始终开始新的聊天",sidePanelScope:"侧边栏显示范围",sidePanelScopeGlobal:"所有标签页",sidePanelScopeRememberedTabs:"记住曾打开过的标签页（推荐）",accountIndices:"多账号轮询 (Account Indices)",accountIndicesDesc:"输入逗号分隔的账号索引值 (如 0, 1, 7) 以开启轮询。",contextManagement:"上下文管理",contextMode:"模式",contextModeDesc:"API 渠道可摘要旧消息，或只保留最近轮次。",contextModeSummary:"摘要压缩",contextModeRecent:"仅最近轮次",contextRecentTurns:"保留最近轮数",contextRecentTurnsDesc:"完整保留的最近用户轮次数量。",contextCompressing:"上下文压缩中...",contextCompressed:"上下文已自动压缩",contextCompressionFallback:"上下文压缩失败，已截取上下文",appearance:"外观",theme:"主题",language:"语言",keyboardShortcuts:"快捷键",shortcutDesc:"点击输入框并按下按键以修改。",quickAsk:"快速提问 (悬浮)",openSidePanel:"打开侧边栏",shortcutFocusInput:"聚焦输入框",shortcutSwitchModel:"切换模型 (输入框内)",shortcutBrowserControl:"打开浏览器控制",shortcutOcrCapture:"区域 OCR",resetDefault:"恢复默认",saveChanges:"保存更改",settingsSaved:"已保存",debugLogs:"调试日志",downloadLogs:"下载日志",dataManagement:"数据管理",historyDataTitle:"聊天历史",settingsDataTitle:"设置备份",exportHistoryData:"导出历史",importHistoryData:"导入历史",exportSettingsData:"导出设置",importSettingsData:"导入设置",dataImportFailed:"读取导入文件失败。",dataImportError:"导入失败：{error}",historyImportSuccess:"历史已导入。",settingsImportSuccess:"设置已导入。",about:"关于",sourceCode:"源代码",releases:"版本发布",systemDefault:"跟随系统",light:"浅色",dark:"深色",cancelled:"已取消",deleteChatConfirm:"确认删除此对话？",delete:"删除",renameChat:"重命名",pinChat:"置顶",unpinChat:"取消置顶",pinnedChat:"已置顶",duplicateChat:"复制",duplicateChatTitle:"{title} 副本",shareChat:"复制分享文本",shareChatCopied:"分享文本已复制。",shareChatFailed:"分享文本复制失败。",exportChatTxt:"导出 TXT",exportChatJson:"导出 JSON",exportRoleUser:"用户",exportRoleAssistant:"助手",exportTitle:"标题",exportedAt:"导出时间",exportMessages:"消息",exportAttachments:"附件",exportGeneratedImages:"生成图片",exportSources:"来源",exportThoughts:"思考过程",moreOptions:"更多选项",recentChats:"最近聊天",imageSent:"图片已发送",selectOcr:"请框选要识别的区域...",selectSnip:"请框选要截图的区域...",selectTranslate:"请框选要翻译的区域...",selectScreenCapture:"请选择要截取的屏幕或窗口...",processingImage:"正在处理图片...",screenCaptureFailed:"屏幕截图失败。",failedLoadImage:"图片加载失败。",errorScreenshot:"截图处理出错。",noTextSelected:"页面上未选择文本。",ocrPrompt:"请识别并提取这张图片中的可见文字 (OCR)。按阅读顺序输出，尽量保留换行、列表、表格和原始标点。仅输出识别到的文本；如果没有文字，仅输出“未检测到文字”。",screenshotTranslatePrompt:"请识别这张图片中的可见文字并翻译成中文。按阅读顺序处理，尽量保留换行、列表和表格结构。仅输出翻译结果；如果没有文字，仅输出“未检测到文字”。",loadingImage:"正在加载图片...",noLogsToDownload:"没有可下载的日志。",readingPage:"正在读取网页内容...",pageReadSuccess:"已读取网页内容 (约 {count} 字)",copy:"复制",copied:"已复制",copyCode:"复制代码",copyContent:"复制内容",liveArtifactPreview:"预览",liveArtifactPreviewTitle:"产物预览",liveArtifactRendering:"正在渲染预览...",liveArtifactPreviewFailed:"预览失败。",generatedImage:"生成的图片",customModel:"自定义模型",defaultMcpServer:"MCP 服务器",toolFallbackName:"工具",toolStatusRunning:"正在使用 {name}...",toolStatusFailed:"{name} 失败",toolStatusCancelled:"已取消 {name}",toolStatusUsed:"已使用 {name}",toolBadgeRunning:"运行中",toolBadgeFailed:"失败",toolBadgeCancelled:"已取消",toolBadgeDone:"完成",rawTool:"原始工具",stepLabel:"步骤 {step}",callLabel:"调用 {index}/{count}",durationLabel:"{duration}",collapseTool:"收起 {name}",expandTool:"展开 {name}",toggleHistory:"历史记录",newChatTooltip:"新对话",pageContextTooltip:"切换网页上下文对话",browserControlTooltip:"允许模型控制浏览器",liveArtifactsTooltip:"切换 Live Artifacts 回复",quoteTooltip:"引用网页选中内容",ocrTooltip:"区域截图 (OCR文字提取)",screenshotTranslateTooltip:"截取区域并翻译文字",screenCaptureTooltip:"截取其他屏幕或应用窗口",snipTooltip:"区域截图 (作为图片输入)",uploadImageTooltip:"上传文件",zoomOut:"缩小",zoomIn:"放大",resetZoom:"适应屏幕",downloadImage:"下载图片",close:"关闭",sendMessageTooltip:"发送消息",openFullPageTooltip:"新标签页打开",modelSelectTooltip:"选择模型 (按 Tab 切换)",headerThinkingToggleAria:"切换思考等级",headerThinkingMinimalFastTitle:"思考：最低（快速模式）",headerThinkingLowFastTitle:"思考：低（快速模式）",headerThinkingHighTitle:"思考：高（深度模式）",selectTab:"选择活动标签页",selectTabTooltip:"选择要控制的标签页",noTabsFound:"未找到打开的标签页。",browserControlReady:"就绪",browserControlDebugging:"调试中",browserControlNoTab:"选择要控制的标签页",browserControlUnavailable:"不可控制",browserControlUnavailableReason:"无法控制此页面",controlTabInBackground:"仅设为控制目标",currentTab:"当前",stopBrowserControl:"停止浏览器控制"}};function h(e){return e==="system"?navigator.language.startsWith("zh")?"zh":"en":e}let p="system",c=h(p);try{document.documentElement.lang=c}catch{}function k(e){p=e,c=h(e),document.documentElement.lang=c}function y(){return p}function d(e){return u[c][e]||e}function f(e,i={}){return d(e).replace(/\{(\w+)\}/g,(r,a)=>Object.prototype.hasOwnProperty.call(i,a)?String(i[a]):r)}function C(){document.querySelectorAll("[data-i18n]").forEach(a=>{const l=a.getAttribute("data-i18n"),n=d(l);n&&(a.textContent=n)}),document.querySelectorAll("[data-i18n-placeholder]").forEach(a=>{const l=a.getAttribute("data-i18n-placeholder"),n=d(l);n&&(a.placeholder=n)}),document.querySelectorAll("[data-i18n-title]").forEach(a=>{const l=a.getAttribute("data-i18n-title"),n=d(l);n&&(a.title=n,a.setAttribute("aria-label",n))})}function t(e,...i){return e.reduce((r,a,l)=>`${r}${a}${i[l]??""}`,"").replace(/\s+/g," ").trim()}const o={BROWSER_TAB:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <path d="M3 9h18"></path>
        </svg>
    `,BROWSER_CONTROL:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
            <path d="m13 13 6 6"></path>
        </svg>
    `,MOUSE_POINTER:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
            <path d="m13 13 6 6"></path>
        </svg>
    `,MOUSE_POINTER_CLICK:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
            <path d="m13 13 6 6"></path>
            <path d="M14 4.5V2"></path>
            <path d="M18.5 8H21"></path>
            <path d="m16.8 5.2 1.8-1.8"></path>
        </svg>
    `,FORM:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="3" width="16" height="18" rx="2"></rect>
            <path d="M8 8h8"></path>
            <path d="M8 12h8"></path>
            <path d="M8 16h5"></path>
        </svg>
    `,CLOCK:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 2"></path>
        </svg>
    `,CODE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m8 9-4 3 4 3"></path>
            <path d="m16 9 4 3-4 3"></path>
            <path d="m14 4-4 16"></path>
        </svg>
    `,MESSAGE_SQUARE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `,TERMINAL:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m4 17 6-6-6-6"></path>
            <path d="M12 19h8"></path>
        </svg>
    `,CHEVRON_LEFT:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    `,CHEVRON_RIGHT:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    `,CLOSE:t`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `,CHECK:t`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#4caf50" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    `,COPY:t`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `,DOWNLOAD:t`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    `,UPLOAD:t`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
    `,DATABASE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
        </svg>
    `,EDIT:t`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>
    `,EXTERNAL_OPEN:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"/>
            <path d="M10 14 21 3"/>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        </svg>
    `,FIT_TO_SCREEN:t`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
    `,GITHUB:t`
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"
            stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61
                c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77
                5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38
                0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0
                5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61
                6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
    `,HISTORY:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7"></path>
            <path d="M3 3v5h5"></path>
            <path d="M12 7v5l4 2"></path>
        </svg>
    `,SIDEBAR_TOGGLE:t`
        <svg class="sidebar-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="8" y2="8"></line>
            <line x1="4" x2="14" y1="16" y2="16"></line>
        </svg>
    `,NEW_CHAT:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"></path>
        </svg>
    `,NEW_GROUP:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"></path>
            <path d="M2 8v11a2 2 0 0 0 2 2h14"></path>
        </svg>
    `,CHEVRON_DOWN:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    `,MORE_HORIZONTAL:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
        </svg>
    `,TRASH:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
        </svg>
    `,OCR:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7V4h3"></path>
            <path d="M20 7V4h-3"></path>
            <path d="M4 17v3h3"></path>
            <path d="M20 17v3h-3"></path>
            <line x1="9" y1="12" x2="15" y2="12"></line>
        </svg>
    `,PAGE_CONTEXT:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
    `,PAPERCLIP:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19
                a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
    `,QUOTE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4
                c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2
                1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4
                c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2
                1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
        </svg>
    `,RELEASES:t`
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"
            stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
        </svg>
    `,SEARCH:t`
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18"
            height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    `,SCREEN_CAPTURE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="12" rx="2"></rect>
            <path d="M8 20h8"></path>
            <path d="M12 16v4"></path>
        </svg>
    `,SEND:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `,STOP:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="7" y="7" width="10" height="10" rx="1"></rect>
        </svg>
    `,SUMMARY:t`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
            <path d="M10 12h4"></path>
            <path d="M10 16h4"></path>
        </svg>
    `,SETTINGS:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83
                2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33
                1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2
                2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4
                a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0
                2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82
                1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2
                2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9
                a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83
                2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9
                a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2
                2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51
                1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0
                2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9
                a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2
                2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    `,SHARE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <path d="M8.59 13.51 15.42 17.49"></path>
            <path d="M15.41 6.51 8.59 10.49"></path>
        </svg>
    `,SNIP:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2v14a2 2 0 0 0 2 2h14"></path>
            <path d="M18 22V8a2 2 0 0 0-2-2H2"></path>
        </svg>
    `,ACTIVE_TAB:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <path d="M3 9h18"></path>
            <path d="M7 6.5h.01"></path>
            <path d="M10 6.5h.01"></path>
            <path d="M7 13h10"></path>
            <path d="M7 17h6"></path>
        </svg>
    `,TAB_STACK:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="7" y="3" width="14" height="12" rx="2"></rect>
            <path d="M7 7h14"></path>
            <path d="M3 8v11a2 2 0 0 0 2 2h12"></path>
            <path d="M3 12h4"></path>
        </svg>
    `,ZAP:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    `,TRANSLATE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 8 6 6"></path>
            <path d="m4 14 6-6 2-3"></path>
            <path d="M2 5h12"></path>
            <path d="M7 2h1"></path>
            <path d="m22 22-5-10-5 10"></path>
            <path d="M14 18h6"></path>
        </svg>
    `,ZOOM_IN:t`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `,ZOOM_OUT:t`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `,PLUG:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 2v4"></path>
            <path d="M15 2v4"></path>
            <path d="M18 6H6a2 2 0 0 0-2 2v3a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V8a2 2 0 0 0-2-2z"></path>
            <path d="M12 17v4"></path>
        </svg>
    `,KEY:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
        </svg>
    `,PALETTE:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 2 1 3 2.5 4.5.75.75 1.5 1.5 1.5 2.5.003 1.644 1.356 3 3 3H12z"></path>
            <circle cx="7.5" cy="10.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="11.5" cy="7.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="16.5" cy="9.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="15.5" cy="14.5" r="1.5" stroke="none" fill="currentColor"></circle>
        </svg>
    `,KEYBOARD:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M7 16h10M10 12h4"></path>
        </svg>
    `,LOCK_CLOSED:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    `,LOCK_OPEN:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
    `,INFO:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
    `,PIN:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"></path>
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a3 3 0 0 1 .88-2.12l.83-.83A1 1 0 0 0 16 2H8a1 1 0 0 0-.71 1.71l.83.83A3 3 0 0 1 9 7z"></path>
        </svg>
    `,PIN_OFF:t`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"></path>
            <path d="M15 10.34V7a3 3 0 0 1 .88-2.12l.71-.71"></path>
            <path d="m2 2 20 20"></path>
            <path d="M9 9.76v1a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"></path>
            <path d="M12.54 2H8a1 1 0 0 0-.71 1.71l.83.83A3 3 0 0 1 9 6.66"></path>
        </svg>
    `},v={mcpToolsDesc:"Connect to an MCP server and use its tools in chat.",mcpHeadersDesc:"Optional JSON object. Applied to SSE and Streamable HTTP requests.",shortcutDesc:"Click input and press keys to change.",textSelectionDesc:"Show floating toolbar when selecting text.",textSelectionBlacklistDesc:"Disable the text selection toolbar on matching sites.",customSelectionToolsDesc:"Add your own selection toolbar prompts.",imageToolsToggleDesc:"Show the AI button when hovering over images.",accountIndicesDesc:"Comma-separated user indices for polling.",contextModeDesc:"Summarize older messages or keep recent turns.",contextRecentTurnsDesc:"Number of latest user turns kept verbatim.",sidebarBehaviorAutoDesc:"Restore if opened soon, otherwise start new chat."};function s(e){const i=v[e];return i?`<button type="button" class="setting-help" data-i18n-title="${e}" title="${i}">?</button>`:""}const m=`
    <div class="setting-group">
        <h4 data-i18n="apiSettings">API</h4>

        <div class="setting-panel">
            <label class="setting-label" data-i18n="connectionProvider">Model Provider</label>
            <select id="provider-select" class="settings-input settings-select">
                <option value="web" data-i18n="providerWeb">Gemini Web Client (Free)</option>
                <option value="official" data-i18n="providerOfficial">Google Gemini API</option>
                <option value="openai" data-i18n="providerOpenAI">OpenAI Compatible API</option>
                <option value="openai_official" data-i18n="providerOpenAIOfficial">OpenAI Official API</option>
                <option value="deepseek" data-i18n="providerDeepSeek">DeepSeek API</option>
                <option value="openrouter" data-i18n="providerOpenRouter">OpenRouter API</option>
                <option value="dashscope" data-i18n="providerDashScope">Qwen / DashScope API</option>
                <option value="anthropic" data-i18n="providerAnthropic">Anthropic API</option>
                <option value="zhipu" data-i18n="providerZhipu">Zhipu API</option>
            </select>

            <div id="web-fields" class="settings-stack settings-section-offset">
                <div class="setting-panel-row">
                    <div class="setting-panel-header">
                        <h5 data-i18n="webTemporaryChat">Temporary chat</h5>
                    </div>
                    <input type="checkbox" id="web-temporary-chat-enabled" class="setting-toggle" />
                </div>
            </div>

            <div id="api-key-container" class="settings-stack settings-section-offset" hidden>
                <div id="official-fields" class="settings-stack tight" hidden>
                    <div class="setting-field">
                        <span data-i18n="baseUrl">Base URL</span>
                        <input type="text" id="official-base-url" class="settings-input settings-full-input" data-i18n-placeholder="officialBaseUrlPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="apiKey">API Key</span>
                        <input type="password" id="api-key-input" class="settings-input settings-full-input" data-i18n-placeholder="apiKeyPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="modelIds">Model IDs</span>
                        <input type="text" id="official-model" class="settings-input settings-full-input" data-i18n-placeholder="officialModelPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="thinkingLevelGemini3">Thinking Level</span>
                        <select id="thinking-level-select" class="settings-input settings-select">
                            <option value="minimal" data-i18n="thinkingMinimalFlashOnly">Minimal</option>
                            <option value="low" data-i18n="thinkingLowFaster">Low</option>
                            <option value="medium" data-i18n="thinkingMediumBalanced">Medium</option>
                            <option value="high" data-i18n="thinkingHighDeepReasoning">High</option>
                        </select>
                    </div>
                    <div class="setting-panel-row settings-section-offset">
                        <div class="setting-panel-header">
                            <h5 data-i18n="officialWebSearch">Google Search grounding</h5>
                        </div>
                        <input type="checkbox" id="official-web-search-enabled" class="setting-toggle" />
                    </div>
                </div>

                <div id="openai-fields" class="settings-stack tight" hidden>
                    <div class="setting-field">
                        <span data-i18n="baseUrl">Base URL</span>
                        <input type="text" id="openai-base-url" class="settings-input settings-full-input" data-i18n-placeholder="baseUrlPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="apiKey">API Key</span>
                        <input type="password" id="openai-api-key" class="settings-input settings-full-input" data-i18n-placeholder="apiKeyPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="modelIdsCommaSeparated">Model IDs</span>
                        <input type="text" id="openai-model" class="settings-input settings-full-input" data-i18n-placeholder="modelIdPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="thinkingLevel">Thinking Level</span>
                        <select id="openai-thinking-level-select" class="settings-input settings-select">
                            <option value="minimal" data-i18n="thinkingMinimal">Minimal</option>
                            <option value="low" data-i18n="thinkingLow">Low</option>
                            <option value="medium" data-i18n="thinkingMedium">Medium</option>
                            <option value="high" data-i18n="thinkingHigh">High</option>
                        </select>
                    </div>
                    <div class="setting-panel-row settings-section-offset">
                        <div class="setting-panel-header">
                            <h5 data-i18n="openaiUseResponsesApi">Use Responses API</h5>
                        </div>
                        <input type="checkbox" id="openai-use-responses-api" class="setting-toggle" />
                    </div>
                    <div class="setting-panel-row">
                        <div class="setting-panel-header">
                            <h5 data-i18n="openaiWebSearch">OpenAI Web search</h5>
                        </div>
                        <input type="checkbox" id="openai-web-search-enabled" class="setting-toggle" />
                    </div>
                </div>

                <div id="dedicated-api-fields" class="settings-stack tight" hidden>
                    <div class="setting-field">
                        <span data-i18n="baseUrl">Base URL</span>
                        <input type="text" id="dedicated-api-base-url" class="settings-input settings-full-input" data-i18n-placeholder="baseUrlPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="apiKey">API Key</span>
                        <input type="password" id="dedicated-api-api-key" class="settings-input settings-full-input" data-i18n-placeholder="apiKeyPlaceholder">
                    </div>
                    <div class="setting-field">
                        <span data-i18n="modelIdsCommaSeparated">Model IDs</span>
                        <div class="settings-action-row">
                            <input type="text" id="dedicated-api-model" class="settings-input settings-full-input settings-flex-fill" data-i18n-placeholder="modelIdPlaceholder">
                            <button id="dedicated-api-refresh-models" class="btn-secondary settings-small-button" type="button" data-i18n="refreshModels" hidden>Refresh</button>
                        </div>
                        <div id="dedicated-api-model-list-status" class="settings-muted-text" role="status" aria-live="polite" hidden></div>
                    </div>
                    <div class="setting-field">
                        <span data-i18n="thinkingLevel">Thinking Level</span>
                        <select id="dedicated-api-thinking-level-select" class="settings-input settings-select">
                            <option value="minimal" data-i18n="thinkingMinimal">Minimal</option>
                            <option value="low" data-i18n="thinkingLow">Low</option>
                            <option value="medium" data-i18n="thinkingMedium">Medium</option>
                            <option value="high" data-i18n="thinkingHigh">High</option>
                        </select>
                    </div>
                    <div id="dedicated-api-web-search-row" class="setting-panel-row settings-section-offset" hidden>
                        <div class="setting-panel-header">
                            <h5 data-i18n="openaiWebSearch">OpenAI Web search</h5>
                        </div>
                        <input type="checkbox" id="dedicated-api-web-search-enabled" class="setting-toggle" />
                    </div>
                    <div id="dedicated-api-provider-routing-row" class="setting-field" hidden>
                        <span data-i18n="providerRouting">Provider Routing (JSON)</span>
                        <textarea id="dedicated-api-provider-routing" class="settings-input settings-full-input settings-monospace-textarea" data-i18n-placeholder="providerRoutingPlaceholder"></textarea>
                    </div>
                </div>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-row">
                <div class="setting-panel-header">
                    <h5><span data-i18n="mcpTools">MCP External Tools</span>${s("mcpToolsDesc")}</h5>
                </div>
                <input type="checkbox" id="mcp-enabled" class="setting-toggle" />
            </div>

            <div id="mcp-fields" class="settings-stack settings-section-offset" hidden>
                <div class="setting-field">
                    <span data-i18n="mcpActiveServer">Active Server</span>
                    <div class="settings-action-row">
                        <select id="mcp-server-select" class="settings-input settings-select settings-flex-fill"></select>
                        <button id="mcp-add-server" class="btn-primary settings-small-button" type="button" data-i18n="mcpAddServer">Add</button>
                        <button id="mcp-remove-server" class="btn-secondary settings-small-button" type="button" data-i18n="mcpRemoveServer">Del</button>
                    </div>
                </div>

                <div class="setting-field">
                    <span data-i18n="mcpServerName">Name</span>
                    <input type="text" id="mcp-server-name" class="settings-input settings-full-input" placeholder="Local Proxy">
                </div>
                <div class="setting-field">
                    <span data-i18n="mcpTransport">Transport</span>
                    <select id="mcp-transport" class="settings-input settings-select">
                        <option value="streamable-http">Streamable HTTP (official, http://.../mcp)</option>
                        <option value="sse">SSE</option>
                        <option value="ws">Custom WebSocket (non-standard, ws://)</option>
                    </select>
                </div>
                <div class="setting-field">
                    <span data-i18n="mcpServerUrl">URL</span>
                    <input type="text" id="mcp-server-url" class="settings-input settings-full-input" placeholder="http://127.0.0.1:3006/mcp">
                </div>
                <div class="setting-field">
                    <span class="setting-field-label"><span data-i18n="mcpHeaders">Request Headers (JSON)</span>${s("mcpHeadersDesc")}</span>
                    <textarea id="mcp-headers" class="settings-input settings-full-input settings-monospace-textarea" data-i18n-placeholder="mcpHeadersPlaceholder"></textarea>
                </div>

                <div class="setting-panel-row settings-section-offset">
                    <div class="setting-panel-header">
                        <h5 data-i18n="enabled">Server Enabled</h5>
                    </div>
                    <div class="settings-action-row">
                        <button id="mcp-test-connection" class="btn-secondary settings-small-button" type="button" data-i18n="mcpTestConnection">Test</button>
                        <input type="checkbox" id="mcp-server-enabled" class="setting-toggle" />
                    </div>
                </div>
                <div id="mcp-test-status" class="settings-muted-text"></div>

                <div class="settings-stack compact settings-panel-fieldset">
                    <div class="setting-field">
                        <span data-i18n="mcpToolMode">Expose Tools</span>
                        <select id="mcp-tool-mode" class="settings-input settings-select">
                            <option value="all" data-i18n="mcpToolModeAll">All</option>
                            <option value="selected" data-i18n="mcpToolModeSelected">Selected</option>
                        </select>
                    </div>

                    <div class="mcp-action-row settings-action-row">
                        <button id="mcp-refresh-tools" class="btn-secondary settings-small-button" type="button" data-i18n="mcpRefreshTools">Refresh</button>
                        <button id="mcp-enable-all-tools" class="btn-secondary settings-small-button" type="button" data-i18n="mcpEnableAllTools">All</button>
                        <button id="mcp-disable-all-tools" class="btn-secondary settings-small-button" type="button" data-i18n="mcpDisableAllTools">None</button>
                    </div>

                    <input type="text" id="mcp-tool-search" class="settings-input settings-full-input" data-i18n-placeholder="mcpToolSearchPlaceholder">
                    <div id="mcp-tools-summary" class="settings-muted-text"></div>
                    <div id="mcp-tool-list" class="mcp-tool-list"></div>
                </div>
            </div>
        </div>
    </div>`,w=`
    <div class="setting-group">
        <h4 data-i18n="general">General</h4>

        <div class="setting-panel">
            <div class="setting-panel-row">
                <div class="setting-panel-header">
                    <h5><span data-i18n="textSelection">Text Selection Toolbar</span>${s("textSelectionDesc")}</h5>
                </div>
                <input type="checkbox" id="text-selection-toggle" class="setting-toggle">
            </div>

            <div class="settings-section-offset">
                <label class="setting-label"><span data-i18n="textSelectionBlacklist">Selection Blacklist</span>${s("textSelectionBlacklistDesc")}</label>
                <textarea id="text-selection-blacklist" class="settings-input settings-full-input settings-monospace-textarea" data-i18n-placeholder="textSelectionBlacklistPlaceholder"></textarea>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5><span data-i18n="customSelectionTools">Custom Selection Tools</span>${s("customSelectionToolsDesc")}</h5>
            </div>
            <div id="custom-selection-tools-list" class="custom-selection-tools-list"></div>
            <button type="button" id="add-custom-selection-tool" class="btn-secondary settings-secondary-action settings-section-offset" data-i18n="customSelectionToolAdd">Add Tool</button>
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="imageToolsToggle">Hover Image Tools</span>${s("imageToolsToggleDesc")}</h5>
            </div>
            <input type="checkbox" id="image-tools-toggle" class="setting-toggle">
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="generatedImageWatermarkToggle">Auto Clean Generated Image Watermark</span>${s("generatedImageWatermarkToggleDesc")}</h5>
            </div>
            <input type="checkbox" id="generated-image-watermark-toggle" class="setting-toggle">
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="accountIndices">Account Indices (Web)</span>${s("accountIndicesDesc")}</h5>
            </div>
            <input type="text" id="account-indices-input" class="settings-input setting-panel-small-input" placeholder="0">
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header">
                <h5 data-i18n="contextManagement">Context Management</h5>
            </div>
            <div class="setting-panel-grid settings-section-offset">
                <label class="setting-field">
                    <span class="setting-field-label"><span data-i18n="contextMode">Mode</span>${s("contextModeDesc")}</span>
                    <select id="context-mode-select" class="settings-input settings-select">
                        <option value="summary" data-i18n="contextModeSummary">Summary</option>
                        <option value="recent" data-i18n="contextModeRecent">Recent</option>
                    </select>
                </label>
                <div class="setting-field setting-field-number">
                    <label class="setting-field-label"><span data-i18n="contextRecentTurns">Turns</span>${s("contextRecentTurnsDesc")}</label>
                    <input type="number" id="context-recent-turns-input" class="settings-input" min="1" max="50">
                </div>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5><span data-i18n="sidebarBehavior">Sidebar Behavior</span>${s("sidebarBehaviorAutoDesc")}</h5>
            </div>
            <div class="setting-radio-list">
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidebar-behavior" value="auto">
                        <span class="setting-radio-title" data-i18n="sidebarBehaviorAuto">Smart (Auto restore)</span>
                    </label>
                </div>
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidebar-behavior" value="restore">
                        <span class="setting-radio-title" data-i18n="sidebarBehaviorRestore">Always Restore</span>
                    </label>
                </div>
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidebar-behavior" value="new">
                        <span class="setting-radio-title" data-i18n="sidebarBehaviorNew">Always New Chat</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5 data-i18n="sidePanelScope">Side Panel Visibility</h5>
            </div>
            <div class="setting-radio-list">
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidepanel-scope" value="remembered_tabs">
                        <span class="setting-radio-title" data-i18n="sidePanelScopeRememberedTabs">Remember tabs where it was opened (Recommended)</span>
                    </label>
                </div>
                <div class="setting-radio-option">
                    <label class="setting-radio-choice">
                        <input type="radio" name="sidepanel-scope" value="global">
                        <span class="setting-radio-title" data-i18n="sidePanelScopeGlobal">All tabs</span>
                    </label>
                </div>
            </div>
        </div>
    </div>`,S=`
<div class="setting-group">
    <h4 data-i18n="appearance">Appearance</h4>

    <div class="setting-panel">
        <div class="setting-panel-grid setting-panel-grid-even">
            <label class="setting-field">
                <span data-i18n="theme">Theme</span>
                <select id="theme-select" class="settings-input settings-select">
                    <option value="system" data-i18n="systemDefault">System</option>
                    <option value="light" data-i18n="light">Light</option>
                    <option value="dark" data-i18n="dark">Dark</option>
                </select>
            </label>

            <label class="setting-field">
                <span data-i18n="language">Language</span>
                <select id="language-select" class="settings-input settings-select">
                    <option value="system" data-i18n="systemDefault">System</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                </select>
            </label>
        </div>
    </div>
</div>`,T=`
    <div class="setting-group">
        <h4><span data-i18n="keyboardShortcuts">Keyboard Shortcuts</span>${s("shortcutDesc")}</h4>

        <div class="setting-panel">
            <div class="setting-shortcut-list">
                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="quickAsk">Quick Ask</span>
                    <input type="text" id="shortcut-quick-ask" class="shortcut-input" readonly value="Alt+Q">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="openSidePanel">Side Panel</span>
                    <input type="text" id="shortcut-open-panel" class="shortcut-input" readonly value="Alt+G">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutBrowserControl">Browser Control</span>
                    <input type="text" id="shortcut-browser-control" class="shortcut-input" readonly value="Ctrl+B">
                </div>

                <div class="setting-shortcut-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutOcrCapture">Area OCR</span>
                    <input type="text" id="shortcut-ocr-capture" class="shortcut-input" readonly value="Alt+O">
                </div>

                <div class="setting-shortcut-row setting-shortcut-static-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutFocusInput">Focus Input</span>
                    <input type="text" class="shortcut-input" readonly value="Ctrl+P">
                </div>

                <div class="setting-shortcut-row setting-shortcut-static-row">
                    <span class="setting-shortcut-title" data-i18n="shortcutSwitchModel">Switch Model</span>
                    <input type="text" class="shortcut-input" readonly value="Tab">
                </div>
            </div>
        </div>
    </div>`,b=`
<div class="setting-group data-management-group">
    <h4 data-i18n="dataManagement">Data Management</h4>

    <div class="data-management-shell">
        <div class="data-management-card">
            <div class="data-management-card-main">
                    <span class="data-management-card-icon">${o.HISTORY}</span>
                    <div class="data-management-card-copy">
                        <h5 data-i18n="historyDataTitle">Chat History</h5>
                </div>
            </div>
            <div class="data-management-card-actions">
                <button id="export-history-data" type="button" class="data-action-btn data-action-btn-primary" data-i18n-title="exportHistoryData" title="Export History">
                    <span class="data-action-icon">${o.DOWNLOAD}</span>
                    <span data-i18n="exportHistoryData">Export History</span>
                </button>
                <button id="import-history-data" type="button" class="data-action-btn data-action-btn-secondary" data-i18n-title="importHistoryData" title="Import History">
                    <span class="data-action-icon">${o.UPLOAD}</span>
                    <span data-i18n="importHistoryData">Import History</span>
                </button>
            </div>
        </div>

        <div class="data-management-card">
            <div class="data-management-card-main">
                    <span class="data-management-card-icon">${o.SETTINGS}</span>
                    <div class="data-management-card-copy">
                        <h5 data-i18n="settingsDataTitle">Settings Backup</h5>
                </div>
            </div>
            <div class="data-management-card-actions">
                <button id="export-settings-data" type="button" class="data-action-btn data-action-btn-primary" data-i18n-title="exportSettingsData" title="Export Settings">
                    <span class="data-action-icon">${o.DOWNLOAD}</span>
                    <span data-i18n="exportSettingsData">Export Settings</span>
                </button>
                <button id="import-settings-data" type="button" class="data-action-btn data-action-btn-secondary" data-i18n-title="importSettingsData" title="Import Settings">
                    <span class="data-action-icon">${o.UPLOAD}</span>
                    <span data-i18n="importSettingsData">Import Settings</span>
                </button>
            </div>
        </div>

        <div class="data-management-card data-management-card-muted">
            <div class="data-management-card-main">
                    <span class="data-management-card-icon">${o.DOWNLOAD}</span>
                    <div class="data-management-card-copy">
                        <h5 data-i18n="debugLogs">Debug Logs</h5>
                    </div>
            </div>
            <div class="data-management-card-actions">
                <button id="download-logs" type="button" class="data-action-btn data-action-btn-secondary" data-i18n-title="downloadLogs" title="Download Logs">
                    <span class="data-action-icon">${o.DOWNLOAD}</span>
                    <span data-i18n="downloadLogs">Download Logs</span>
                </button>
            </div>
        </div>
    </div>

    <input id="import-history-file" type="file" accept="application/json,.json" hidden>
    <input id="import-settings-file" type="file" accept="application/json,.json" hidden>
</div>`,x=`
<div class="setting-group" id="about-settings-group">
    <h4 data-i18n="about">About</h4>
    <div class="setting-panel">
        <div class="setting-panel-row about-version-row">
            <div class="setting-panel-header">
                <h5 class="about-title">Gemini Nexus</h5>
                <div class="about-version-meta">
                    <span id="app-current-version"></span>
                    <span id="app-update-status" class="app-update-status"></span>
                </div>
            </div>
        </div>

        <div class="about-link-row">
            <a href="https://github.com/yeahhe365/Gemini-Nexus" target="_blank" class="github-link">
                ${o.GITHUB}
                <span data-i18n="sourceCode">Source</span>
                <span id="star-count" class="star-badge"></span>
            </a>

            <a href="https://github.com/yeahhe365/Gemini-Nexus/releases" target="_blank" class="github-link">
                ${o.RELEASES}
                <span data-i18n="releases">Releases</span>
            </a>
        </div>
    </div>
</div>`,g=`
    <div class="settings-content split-layout">
        <div class="settings-sidebar">
            <div class="settings-sidebar-header">
                <h3 data-i18n="settingsTitle">Settings</h3>
            </div>
            <ul class="settings-tabs">
                <li class="settings-tab active" data-tab="connection" role="button" tabindex="0" aria-selected="true">
                    <span class="tab-icon">${o.KEY}</span>
                    <span class="tab-label" data-i18n="apiSettings">API</span>
                </li>
                <li class="settings-tab" data-tab="general" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${o.SETTINGS}</span>
                    <span class="tab-label" data-i18n="general">General</span>
                </li>
                <li class="settings-tab" data-tab="appearance" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${o.PALETTE}</span>
                    <span class="tab-label" data-i18n="appearance">Appearance</span>
                </li>
                <li class="settings-tab" data-tab="shortcuts" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${o.KEYBOARD}</span>
                    <span class="tab-label" data-i18n="keyboardShortcuts">Shortcuts</span>
                </li>
                <li class="settings-tab" data-tab="data" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${o.DATABASE}</span>
                    <span class="tab-label" data-i18n="dataManagement">Data Management</span>
                </li>
                <li class="settings-tab" data-tab="about" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${o.INFO}</span>
                    <span class="tab-label" data-i18n="about">About</span>
                </li>
            </ul>
        </div>
        <div class="settings-main">
            <div class="settings-header">
                <h3 id="settings-tab-title" data-i18n="apiSettings">API</h3>
                <div class="settings-header-actions">
                    <button id="reset-shortcuts" class="btn-secondary" data-i18n="resetDefault">Reset Default</button>
                    <button id="save-shortcuts" class="btn-primary" data-i18n="saveChanges">Save Changes</button>
                    <span id="settings-save-status" class="settings-save-status" role="status" aria-live="polite" hidden></span>
                    <button id="close-settings" class="icon-btn small" data-i18n-title="close" title="Close">${o.CLOSE}</button>
                </div>
            </div>
            <div class="settings-body">
                <div class="settings-section active" data-section="connection">
                    ${m}
                </div>
                <div class="settings-section" data-section="general">
                    ${w}
                </div>
                <div class="settings-section" data-section="appearance">
                    ${S}
                </div>
                <div class="settings-section" data-section="shortcuts">
                    ${T}
                </div>
                <div class="settings-section" data-section="data">
                    ${b}
                </div>
                <div class="settings-section" data-section="about">
                    ${x}
                </div>
            </div>
        </div>
    </div>
`,A=`
    <main id="settings-modal" class="settings-page visible">
        ${g}
    </main>
`,M=`
    <div id="settings-modal" class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-tab-title">
        ${g}
    </div>
`;function I(e){window.parent.postMessage({action:"FORWARD_TO_BACKGROUND",payload:e},"*")}function E(e,i=null){window.parent.postMessage({action:"SAVE_SESSIONS",payload:i?{sessions:e,mutation:i}:e},"*")}function P(e){window.parent.postMessage({action:"SAVE_GROUPS",payload:Array.isArray(e)?e:[]},"*")}function D(e,i,r="text/plain"){window.parent.postMessage({action:"DOWNLOAD_TEXT",payload:{text:e,filename:i,contentType:r}},"*")}function O(){window.parent.postMessage({action:"EXPORT_HISTORY_DATA"},"*")}function R(e){window.parent.postMessage({action:"IMPORT_HISTORY_DATA",payload:e},"*")}function B(){window.parent.postMessage({action:"EXPORT_SETTINGS_DATA"},"*")}function L(e){window.parent.postMessage({action:"IMPORT_SETTINGS_DATA",payload:e},"*")}function N(e){window.parent.postMessage({action:"SAVE_SHORTCUTS",payload:e},"*")}function H(e){window.parent.postMessage({action:"SAVE_THEME",payload:e},"*")}function G(e){window.parent.postMessage({action:"SAVE_LANGUAGE",payload:e},"*")}function _(){window.parent.postMessage({action:"GET_TEXT_SELECTION"},"*")}function F(e){window.parent.postMessage({action:"SAVE_TEXT_SELECTION",payload:e},"*")}function U(){window.parent.postMessage({action:"GET_TEXT_SELECTION_BLACKLIST"},"*")}function j(e){window.parent.postMessage({action:"SAVE_TEXT_SELECTION_BLACKLIST",payload:e},"*")}function V(){window.parent.postMessage({action:"GET_CUSTOM_SELECTION_TOOLS"},"*")}function W(e){window.parent.postMessage({action:"SAVE_CUSTOM_SELECTION_TOOLS",payload:Array.isArray(e)?e:[]},"*")}function $(){window.parent.postMessage({action:"GET_IMAGE_TOOLS"},"*")}function K(e){window.parent.postMessage({action:"SAVE_IMAGE_TOOLS",payload:e},"*")}function z(){window.parent.postMessage({action:"GET_GENERATED_IMAGE_WATERMARK_REMOVAL"},"*")}function q(e){window.parent.postMessage({action:"SAVE_GENERATED_IMAGE_WATERMARK_REMOVAL",payload:e},"*")}function Z(e){window.parent.postMessage({action:"SAVE_SIDEBAR_BEHAVIOR",payload:e},"*")}function X(){window.parent.postMessage({action:"GET_SIDEBAR_EXPANDED"},"*")}function J(e){window.parent.postMessage({action:"SAVE_SIDEBAR_EXPANDED",payload:!!e},"*")}function Y(e){window.parent.postMessage({action:"SAVE_SIDE_PANEL_SCOPE",payload:e},"*")}function Q(){window.parent.postMessage({action:"GET_ACCOUNT_INDICES"},"*")}function ee(e){window.parent.postMessage({action:"SAVE_ACCOUNT_INDICES",payload:e},"*")}function te(){window.parent.postMessage({action:"GET_CONTEXT_SETTINGS"},"*")}function oe(e){window.parent.postMessage({action:"SAVE_CONTEXT_SETTINGS",payload:e},"*")}function ae(){window.parent.postMessage({action:"GET_CONNECTION_SETTINGS"},"*")}function ie(e){window.parent.postMessage({action:"SAVE_CONNECTION_SETTINGS",payload:e},"*")}export{ie as A,O as B,R as C,B as D,L as E,H as F,k as G,G as H,E as I,D as J,P as K,M as S,o as T,C as a,A as b,J as c,Y as d,Z as e,f,q as g,K as h,F as i,y as j,_ as k,U as l,V as m,$ as n,z as o,Q as p,te as q,X as r,I as s,d as t,ae as u,N as v,j as w,W as x,ee as y,oe as z};
