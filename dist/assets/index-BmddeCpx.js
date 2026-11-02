import{y as j,k as D,z as x,A as he,B as F,E as ne,F as ue,q as P,G as W,H as K,I as ae,J as L,h as re,K as $,D as R,d as O,b as H,n as ge,L as me,M as ve,N as Se,w as Te}from"./selection_tools-ClHaGOaF.js";const fe={en:{searchPlaceholder:"Search for chats",historyToday:"Today",historyYesterday:"Yesterday",historyPrevious7Days:"Previous 7 Days",historyPrevious30Days:"Previous 30 Days",noConversations:"No conversations found.",newGroup:"New Group",newGroupTitle:"Untitled",newGroupTooltip:"Create new group",renameGroup:"Rename",deleteGroup:"Delete group",deleteGroupConfirm:"Delete this group? Chats inside it will move back to Recent.",settings:"Settings",pageContext:"Page",browserControl:"Browser Control",liveArtifacts:"Artifacts",quote:"Quote",ocr:"OCR",snip:"Snip",screenshotTranslate:"Translate",screenCapture:"Screen",askPlaceholder:"Ask Gemini...",chatEmptyTitle:"Gemini Nexus",chatEmptyHint:"Ready when you are.",sendMessage:"Send message",generating:"Generating",stopGenerating:"Stop generating",settingsTitle:"Settings",general:"General",apiSettings:"API",connectionProvider:"Model Provider",providerWeb:"Gemini Web Client (Free)",webTemporaryChat:"Temporary chat",providerOfficial:"Gemini API",providerOpenAI:"OpenAI Compatible API",providerOpenAIOfficial:"OpenAI Official API",providerDeepSeek:"DeepSeek API",providerOpenRouter:"OpenRouter API",providerDashScope:"Qwen / DashScope API",providerAnthropic:"Anthropic API",providerZhipu:"Zhipu API",mcpTools:"External MCP Tools",mcpToolsDesc:"Connect to an MCP server and use its tools in chat.",mcpActiveServer:"Active Server",mcpAddServer:"Add",mcpRemoveServer:"Remove",mcpServerName:"Name",mcpTestConnection:"Test Connection",mcpToolMode:"Expose Tools",mcpToolModeAll:"All tools (default)",mcpToolModeSelected:"Selected tools only",mcpRefreshTools:"Refresh Tools",mcpEnableAllTools:"Enable All",mcpDisableAllTools:"Disable All",mcpToolSearchPlaceholder:"Search tools...",mcpSummarySetServerUrl:"Set Server URL to manage tools.",mcpSummaryAllTools:'All tools will be exposed. Click "Refresh Tools" to preview the tool list.',mcpSummaryNoTools:'No tool list loaded. Click "Refresh Tools" to load tools, then select which to expose.',mcpSummarySelected:"Mode: {mode}. Tools exposed: {count}/{total}.",mcpModeAll:"all",mcpModeSelected:"selected",mcpOtherTools:"Other tools",mcpSwitchToSelected:'Switch to "Selected tools only" to choose which tools the model can use.',mcpNoToolsLoaded:"No tools loaded yet.",mcpFetchingTools:"Fetching tools...",mcpTestingConnection:"Testing connection...",mcpConnectedTools:"Connected. Tools: {count}",mcpConnectionFailed:"Connection failed",mcpFailed:"Failed: {error}",mcpFetchToolsFailed:"Failed to fetch tools",mcpTransport:"MCP Transport",mcpServerUrl:"MCP Server URL",mcpHeaders:"Request Headers (JSON)",mcpHeadersPlaceholder:'{"Authorization":"Bearer xxx"}',mcpHeadersDesc:"Optional JSON object. Applied to SSE and Streamable HTTP requests.",enabled:"Enabled",apiKey:"API Key",apiKeyPlaceholder:"Paste your API Key",officialBaseUrlPlaceholder:"e.g. https://generativelanguage.googleapis.com/v1beta",officialWebSearch:"Enable Google Search grounding",openaiUseResponsesApi:"Use Responses API",openaiWebSearch:"Enable OpenAI API web search",providerRouting:"Provider Routing (JSON)",providerRoutingPlaceholder:'{"order":["openai"],"allow_fallbacks":true}',refreshModels:"Refresh",modelListFetching:"Fetching models...",modelListUpdated:"Loaded {count} models.",modelListFailed:"Failed to fetch models",modelIds:"Model IDs",modelIdsCommaSeparated:"Model IDs (comma separated)",officialModelPlaceholder:"e.g. gemini-3.8-flash, gemini-3.5-flash-lite, gemini-3.1-pro-preview",thinkingLevel:"Thinking Level",thinkingLevelGemini3:"Thinking Level (Gemini 3)",thinkingMinimal:"Minimal",thinkingMinimalFlashOnly:"Minimal (Flash only)",thinkingLow:"Low",thinkingLowFaster:"Low (faster)",thinkingMedium:"Medium",thinkingMediumBalanced:"Medium (balanced)",thinkingHigh:"High",thinkingHighDeepReasoning:"High (deep reasoning)",sourcesLabel:"Sources",showMoreSources:"Show {count} more",showLessSources:"Show less",thoughtsStreaming:"Thinking...",thoughtsComplete:"Thought process",thoughtsCompleteWithDuration:"Thought for {seconds}s",thoughtsExpand:"Expand thought process",thoughtsCollapse:"Collapse thought process",editMessage:"Edit message",cancelEdit:"Cancel",saveEdit:"Send",editNotSupportedForWeb:"Message editing is not supported for Gemini Web Client.",baseUrl:"Base URL",baseUrlPlaceholder:"e.g. https://api.openai.com/v1",modelIdPlaceholder:"e.g. gpt-4o, claude-3-5-sonnet",textSelection:"Text Selection Toolbar",textSelectionDesc:"Show floating toolbar when selecting text.",textSelectionBlacklist:"Text Selection Blacklist",textSelectionBlacklistDesc:"Disable the text selection toolbar on matching sites.",textSelectionBlacklistPlaceholder:`github.com
*.google.com
example.com/docs`,customSelectionTools:"Custom Selection Tools",customSelectionToolsDesc:"Add your own prompts to the text selection toolbar.",customSelectionToolAdd:"Add Tool",customSelectionToolNamePlaceholder:"Tool name",customSelectionToolPromptPlaceholder:"Prompt template, use {text} for selected text",customSelectionToolRemove:"Remove",imageToolsToggle:"Show Image Tools Button",imageToolsToggleDesc:"Show the AI button when hovering over images.",generatedImageWatermarkToggle:"Auto Clean Generated Image Watermark",generatedImageWatermarkToggleDesc:"Automatically removes the Gemini corner mark only from images generated by Gemini Nexus.",sidebarBehavior:"When Sidebar Reopens",sidebarBehaviorAuto:"Auto restore or restart",sidebarBehaviorAutoDesc:"Restore if opened within 10 mins, otherwise start new chat.",sidebarBehaviorRestore:"Always restore previous chat",sidebarBehaviorNew:"Always start new chat",sidePanelScope:"Side Panel Visibility",sidePanelScopeGlobal:"All tabs",sidePanelScopeRememberedTabs:"Remember tabs where it was opened (Recommended)",accountIndices:"Account Indices (Multi-account)",accountIndicesDesc:"Comma-separated user indices (e.g., 0, 1, 2) for polling.",contextManagement:"Context Management",contextMode:"Mode",contextModeDesc:"Summarize older messages or keep only recent turns for API providers.",contextModeSummary:"Summary compression",contextModeRecent:"Recent turns only",contextRecentTurns:"Recent turns",contextRecentTurnsDesc:"Number of latest user turns kept verbatim.",contextCompressing:"Compressing conversation context...",contextCompressed:"Context automatically compressed",contextCompressionFallback:"Context compression failed, context has been truncated",appearance:"Appearance",theme:"Theme",language:"Language",keyboardShortcuts:"Keyboard Shortcuts",shortcutDesc:"Click input and press keys to change.",quickAsk:"Quick Ask (Floating)",openSidePanel:"Open Side Panel",shortcutFocusInput:"Focus Input",shortcutSwitchModel:"Switch Model (in Input)",shortcutBrowserControl:"Open Browser Control",shortcutOcrCapture:"Area OCR",resetDefault:"Reset Default",saveChanges:"Save Changes",settingsSaved:"Saved",debugLogs:"Debug Logs",downloadLogs:"Download Logs",dataManagement:"Data Management",historyDataTitle:"Chat History",settingsDataTitle:"Settings Backup",exportHistoryData:"Export History",importHistoryData:"Import History",exportSettingsData:"Export Settings",importSettingsData:"Import Settings",dataImportFailed:"Failed to read import file.",dataImportError:"Import failed: {error}",historyImportSuccess:"History imported.",settingsImportSuccess:"Settings imported.",about:"About",sourceCode:"Source Code",releases:"Releases",systemDefault:"System Default",light:"Light",dark:"Dark",cancelled:"Cancelled.",deleteChatConfirm:"Delete this chat?",delete:"Delete",renameChat:"Rename",pinChat:"Pin",unpinChat:"Unpin",pinnedChat:"Pinned",duplicateChat:"Duplicate",duplicateChatTitle:"{title} copy",shareChat:"Copy share text",shareChatCopied:"Share text copied.",shareChatFailed:"Failed to copy share text.",exportChatTxt:"Export TXT",exportChatJson:"Export JSON",exportRoleUser:"User",exportRoleAssistant:"Assistant",exportTitle:"Title",exportedAt:"Exported at",exportMessages:"Messages",exportAttachments:"Attachments",exportGeneratedImages:"Generated images",exportSources:"Sources",exportThoughts:"Thoughts",moreOptions:"More options",recentChats:"Recent chats",imageSent:"Image sent",selectOcr:"Select area for OCR...",selectSnip:"Select area to capture...",selectTranslate:"Select area to translate...",selectScreenCapture:"Choose a screen or window to capture...",processingImage:"Processing image...",screenCaptureFailed:"Screen capture failed.",failedLoadImage:"Failed to load image.",errorScreenshot:"Error processing screenshot.",noTextSelected:"No text selected on page.",ocrPrompt:'OCR this image. Extract visible text exactly as written, following reading order and preserving line breaks, lists, tables, and punctuation where practical. Output only the extracted text; if no text is visible, output "No text detected."',screenshotTranslatePrompt:'Extract visible text from this image and translate it into English. Follow reading order and preserve line breaks, lists, and tables where practical. Output ONLY the translation; if no text is visible, output "No text detected."',loadingImage:"Loading image...",noLogsToDownload:"No logs to download.",readingPage:"Reading page content...",pageReadSuccess:"Read page content (~{count} chars)",copy:"Copy",copied:"Copied",copyCode:"Copy code",copyContent:"Copy content",liveArtifactPreview:"Preview",liveArtifactPreviewTitle:"Artifact preview",liveArtifactRendering:"Rendering preview...",liveArtifactPreviewFailed:"Preview failed.",generatedImage:"Generated Image",customModel:"Custom Model",defaultMcpServer:"MCP Server",toolFallbackName:"tool",toolStatusRunning:"Using {name}...",toolStatusFailed:"Failed {name}",toolStatusCancelled:"Cancelled {name}",toolStatusUsed:"Used {name}",toolBadgeRunning:"Running",toolBadgeFailed:"Failed",toolBadgeCancelled:"Cancelled",toolBadgeDone:"Done",rawTool:"Raw tool",stepLabel:"Step {step}",callLabel:"Call {index}/{count}",durationLabel:"{duration}",collapseTool:"Collapse {name}",expandTool:"Expand {name}",toggleHistory:"Chat History",newChatTooltip:"New Chat",pageContextTooltip:"Toggle chat with page content",browserControlTooltip:"Allow model to control the browser",liveArtifactsTooltip:"Toggle Live Artifacts responses",quoteTooltip:"Quote selected text from page",ocrTooltip:"Capture area and extract text",screenshotTranslateTooltip:"Capture area and translate text",screenCaptureTooltip:"Capture another screen or app window",snipTooltip:"Capture area to input",uploadImageTooltip:"Upload File",zoomOut:"Zoom Out",zoomIn:"Zoom In",resetZoom:"Fit to Screen",downloadImage:"Download Image",close:"Close",sendMessageTooltip:"Send message",openFullPageTooltip:"Open in full page",modelSelectTooltip:"Select Model (Tab to cycle)",headerThinkingToggleAria:"Toggle thinking level",headerThinkingMinimalFastTitle:"Thinking: Minimal (Fast Mode)",headerThinkingLowFastTitle:"Thinking: Low (Fast Mode)",headerThinkingHighTitle:"Thinking: High (Deep Mode)",selectTab:"Select Active Tab",selectTabTooltip:"Select a tab to control",noTabsFound:"No open tabs found.",browserControlReady:"Ready",browserControlDebugging:"Debugging",browserControlNoTab:"Choose a tab to control",browserControlUnavailable:"Unavailable",browserControlUnavailableReason:"Cannot control this page",controlTabInBackground:"Control without switching",currentTab:"Current",stopBrowserControl:"Stop browser control"},zh:{searchPlaceholder:"搜索对话",historyToday:"今天",historyYesterday:"昨天",historyPrevious7Days:"最近 7 天",historyPrevious30Days:"最近 30 天",noConversations:"未找到对话。",newGroup:"新建分组",newGroupTitle:"无标题",newGroupTooltip:"创建分组",renameGroup:"重命名",deleteGroup:"删除分组",deleteGroupConfirm:"删除这个分组？其中的对话会移回最近。",settings:"设置",pageContext:"网页",browserControl:"浏览器控制",liveArtifacts:"产物",quote:"引用",ocr:"OCR",snip:"截图",screenshotTranslate:"截图翻译",screenCapture:"屏幕截图",askPlaceholder:"询问 Gemini...",chatEmptyTitle:"Gemini Nexus",chatEmptyHint:"随时可以开始。",sendMessage:"发送消息",generating:"正在生成",stopGenerating:"停止生成",settingsTitle:"设置",general:"常规",apiSettings:"API",connectionProvider:"模型来源",providerWeb:"Gemini 网页版 (免费)",webTemporaryChat:"临时对话",providerOfficial:"Gemini API",providerOpenAI:"OpenAI 兼容 API",providerOpenAIOfficial:"OpenAI 官方 API",providerDeepSeek:"DeepSeek API",providerOpenRouter:"OpenRouter API",providerDashScope:"通义 / DashScope API",providerAnthropic:"Anthropic API",providerZhipu:"智谱 API",mcpTools:"外部 MCP 工具",mcpToolsDesc:"连接到 MCP 服务器，并在对话中调用其工具。",mcpActiveServer:"当前服务器",mcpAddServer:"添加",mcpRemoveServer:"移除",mcpServerName:"名称",mcpTestConnection:"测试连接",mcpToolMode:"工具暴露方式",mcpToolModeAll:"全部工具（默认）",mcpToolModeSelected:"仅选择的工具",mcpRefreshTools:"刷新工具列表",mcpEnableAllTools:"全部启用",mcpDisableAllTools:"全部禁用",mcpToolSearchPlaceholder:"搜索工具...",mcpSummarySetServerUrl:"请先设置服务器地址以管理工具。",mcpSummaryAllTools:"将暴露全部工具。点击“刷新工具列表”可预览工具列表。",mcpSummaryNoTools:"尚未加载工具列表。点击“刷新工具列表”后选择要暴露的工具。",mcpSummarySelected:"模式：{mode}。已暴露工具：{count}/{total}。",mcpModeAll:"全部",mcpModeSelected:"已选择",mcpOtherTools:"其他工具",mcpSwitchToSelected:"切换到“仅选择的工具”后，可以选择模型可使用的工具。",mcpNoToolsLoaded:"尚未加载工具。",mcpFetchingTools:"正在获取工具列表...",mcpTestingConnection:"正在测试连接...",mcpConnectedTools:"已连接。工具数：{count}",mcpConnectionFailed:"连接失败",mcpFailed:"失败：{error}",mcpFetchToolsFailed:"获取工具列表失败",mcpTransport:"MCP 传输方式",mcpServerUrl:"MCP 服务器地址",mcpHeaders:"请求头（JSON）",mcpHeadersPlaceholder:'{"Authorization":"Bearer xxx"}',mcpHeadersDesc:"可选 JSON 对象，应用于 SSE 和 Streamable HTTP 请求。",enabled:"启用",apiKey:"API Key",apiKeyPlaceholder:"粘贴 API Key",officialBaseUrlPlaceholder:"例如 https://generativelanguage.googleapis.com/v1beta",officialWebSearch:"启用 Google 搜索联网",openaiUseResponsesApi:"使用 Responses API",openaiWebSearch:"启用 OpenAI API 联网搜索",providerRouting:"Provider Routing（JSON）",providerRoutingPlaceholder:'{"order":["openai"],"allow_fallbacks":true}',refreshModels:"刷新",modelListFetching:"正在获取模型列表...",modelListUpdated:"已加载 {count} 个模型。",modelListFailed:"获取模型列表失败",modelIds:"模型 IDs",modelIdsCommaSeparated:"模型 IDs（逗号分隔）",officialModelPlaceholder:"例如 gemini-3.8-flash, gemini-3.5-flash-lite, gemini-3.1-pro-preview",thinkingLevel:"思考级别",thinkingLevelGemini3:"思考级别（Gemini 3）",thinkingMinimal:"Minimal",thinkingMinimalFlashOnly:"Minimal（仅 Flash）",thinkingLow:"Low",thinkingLowFaster:"Low（更快）",thinkingMedium:"Medium",thinkingMediumBalanced:"Medium（均衡）",thinkingHigh:"High",thinkingHighDeepReasoning:"High（深度推理）",sourcesLabel:"来源",showMoreSources:"展开剩余 {count} 条",showLessSources:"收起来源",thoughtsStreaming:"正在思考...",thoughtsComplete:"思考过程",thoughtsCompleteWithDuration:"已深度思考（用时 {seconds} 秒）",thoughtsExpand:"展开思考过程",thoughtsCollapse:"收起思考过程",editMessage:"编辑消息",cancelEdit:"取消",saveEdit:"发送",editNotSupportedForWeb:"Gemini 网页版暂不支持编辑历史消息。",baseUrl:"Base URL (接口地址)",baseUrlPlaceholder:"例如 https://api.openai.com/v1",modelIdPlaceholder:"例如 gpt-4o, claude-3-5-sonnet",textSelection:"划词工具栏",textSelectionDesc:"选中网页文本时显示悬浮工具栏。",textSelectionBlacklist:"划词黑名单",textSelectionBlacklistDesc:"在匹配的网站上禁用划词悬浮工具栏。",textSelectionBlacklistPlaceholder:`github.com
*.google.com
example.com/docs`,customSelectionTools:"自定义划词工具",customSelectionToolsDesc:"把你自己的 Prompt 添加到划词工具栏。",customSelectionToolAdd:"添加工具",customSelectionToolNamePlaceholder:"工具名称",customSelectionToolPromptPlaceholder:"Prompt 模板，用 {text} 表示划词内容",customSelectionToolRemove:"移除",imageToolsToggle:"显示图片工具按钮",imageToolsToggleDesc:"鼠标悬停在图片上时显示 AI 按钮。",generatedImageWatermarkToggle:"自动清理生图水印",generatedImageWatermarkToggleDesc:"仅对 Gemini Nexus 自己生成的图片自动移除 Gemini 角标/水印。",sidebarBehavior:"当侧边栏重新打开时",sidebarBehaviorAuto:"自动恢复或重新开始",sidebarBehaviorAutoDesc:"如果在10分钟内重新打开，聊天将恢复；如果超过10分钟，将开始新的聊天",sidebarBehaviorRestore:"始终恢复上次的聊天",sidebarBehaviorNew:"始终开始新的聊天",sidePanelScope:"侧边栏显示范围",sidePanelScopeGlobal:"所有标签页",sidePanelScopeRememberedTabs:"记住曾打开过的标签页（推荐）",accountIndices:"多账号轮询 (Account Indices)",accountIndicesDesc:"输入逗号分隔的账号索引值 (如 0, 1, 7) 以开启轮询。",contextManagement:"上下文管理",contextMode:"模式",contextModeDesc:"API 渠道可摘要旧消息，或只保留最近轮次。",contextModeSummary:"摘要压缩",contextModeRecent:"仅最近轮次",contextRecentTurns:"保留最近轮数",contextRecentTurnsDesc:"完整保留的最近用户轮次数量。",contextCompressing:"上下文压缩中...",contextCompressed:"上下文已自动压缩",contextCompressionFallback:"上下文压缩失败，已截取上下文",appearance:"外观",theme:"主题",language:"语言",keyboardShortcuts:"快捷键",shortcutDesc:"点击输入框并按下按键以修改。",quickAsk:"快速提问 (悬浮)",openSidePanel:"打开侧边栏",shortcutFocusInput:"聚焦输入框",shortcutSwitchModel:"切换模型 (输入框内)",shortcutBrowserControl:"打开浏览器控制",shortcutOcrCapture:"区域 OCR",resetDefault:"恢复默认",saveChanges:"保存更改",settingsSaved:"已保存",debugLogs:"调试日志",downloadLogs:"下载日志",dataManagement:"数据管理",historyDataTitle:"聊天历史",settingsDataTitle:"设置备份",exportHistoryData:"导出历史",importHistoryData:"导入历史",exportSettingsData:"导出设置",importSettingsData:"导入设置",dataImportFailed:"读取导入文件失败。",dataImportError:"导入失败：{error}",historyImportSuccess:"历史已导入。",settingsImportSuccess:"设置已导入。",about:"关于",sourceCode:"源代码",releases:"版本发布",systemDefault:"跟随系统",light:"浅色",dark:"深色",cancelled:"已取消",deleteChatConfirm:"确认删除此对话？",delete:"删除",renameChat:"重命名",pinChat:"置顶",unpinChat:"取消置顶",pinnedChat:"已置顶",duplicateChat:"复制",duplicateChatTitle:"{title} 副本",shareChat:"复制分享文本",shareChatCopied:"分享文本已复制。",shareChatFailed:"分享文本复制失败。",exportChatTxt:"导出 TXT",exportChatJson:"导出 JSON",exportRoleUser:"用户",exportRoleAssistant:"助手",exportTitle:"标题",exportedAt:"导出时间",exportMessages:"消息",exportAttachments:"附件",exportGeneratedImages:"生成图片",exportSources:"来源",exportThoughts:"思考过程",moreOptions:"更多选项",recentChats:"最近聊天",imageSent:"图片已发送",selectOcr:"请框选要识别的区域...",selectSnip:"请框选要截图的区域...",selectTranslate:"请框选要翻译的区域...",selectScreenCapture:"请选择要截取的屏幕或窗口...",processingImage:"正在处理图片...",screenCaptureFailed:"屏幕截图失败。",failedLoadImage:"图片加载失败。",errorScreenshot:"截图处理出错。",noTextSelected:"页面上未选择文本。",ocrPrompt:"请识别并提取这张图片中的可见文字 (OCR)。按阅读顺序输出，尽量保留换行、列表、表格和原始标点。仅输出识别到的文本；如果没有文字，仅输出“未检测到文字”。",screenshotTranslatePrompt:"请识别这张图片中的可见文字并翻译成中文。按阅读顺序处理，尽量保留换行、列表和表格结构。仅输出翻译结果；如果没有文字，仅输出“未检测到文字”。",loadingImage:"正在加载图片...",noLogsToDownload:"没有可下载的日志。",readingPage:"正在读取网页内容...",pageReadSuccess:"已读取网页内容 (约 {count} 字)",copy:"复制",copied:"已复制",copyCode:"复制代码",copyContent:"复制内容",liveArtifactPreview:"预览",liveArtifactPreviewTitle:"产物预览",liveArtifactRendering:"正在渲染预览...",liveArtifactPreviewFailed:"预览失败。",generatedImage:"生成的图片",customModel:"自定义模型",defaultMcpServer:"MCP 服务器",toolFallbackName:"工具",toolStatusRunning:"正在使用 {name}...",toolStatusFailed:"{name} 失败",toolStatusCancelled:"已取消 {name}",toolStatusUsed:"已使用 {name}",toolBadgeRunning:"运行中",toolBadgeFailed:"失败",toolBadgeCancelled:"已取消",toolBadgeDone:"完成",rawTool:"原始工具",stepLabel:"步骤 {step}",callLabel:"调用 {index}/{count}",durationLabel:"{duration}",collapseTool:"收起 {name}",expandTool:"展开 {name}",toggleHistory:"历史记录",newChatTooltip:"新对话",pageContextTooltip:"切换网页上下文对话",browserControlTooltip:"允许模型控制浏览器",liveArtifactsTooltip:"切换 Live Artifacts 回复",quoteTooltip:"引用网页选中内容",ocrTooltip:"区域截图 (OCR文字提取)",screenshotTranslateTooltip:"截取区域并翻译文字",screenCaptureTooltip:"截取其他屏幕或应用窗口",snipTooltip:"区域截图 (作为图片输入)",uploadImageTooltip:"上传文件",zoomOut:"缩小",zoomIn:"放大",resetZoom:"适应屏幕",downloadImage:"下载图片",close:"关闭",sendMessageTooltip:"发送消息",openFullPageTooltip:"新标签页打开",modelSelectTooltip:"选择模型 (按 Tab 切换)",headerThinkingToggleAria:"切换思考等级",headerThinkingMinimalFastTitle:"思考：最低（快速模式）",headerThinkingLowFastTitle:"思考：低（快速模式）",headerThinkingHighTitle:"思考：高（深度模式）",selectTab:"选择活动标签页",selectTabTooltip:"选择要控制的标签页",noTabsFound:"未找到打开的标签页。",browserControlReady:"就绪",browserControlDebugging:"调试中",browserControlNoTab:"选择要控制的标签页",browserControlUnavailable:"不可控制",browserControlUnavailableReason:"无法控制此页面",controlTabInBackground:"仅设为控制目标",currentTab:"当前",stopBrowserControl:"停止浏览器控制"}};function le(t){return t==="system"?navigator.language.startsWith("zh")?"zh":"en":t}let q="system",G=le(q);try{document.documentElement.lang=G}catch{}function Y(t){q=t,G=le(t),document.documentElement.lang=G}function we(){return q}function S(t){return fe[G][t]||t}function _(t,e={}){return S(t).replace(/\{(\w+)\}/g,(i,s)=>Object.prototype.hasOwnProperty.call(e,s)?String(e[s]):i)}function vt(){document.querySelectorAll("[data-i18n]").forEach(s=>{const o=s.getAttribute("data-i18n"),n=S(o);n&&(s.textContent=n)}),document.querySelectorAll("[data-i18n-placeholder]").forEach(s=>{const o=s.getAttribute("data-i18n-placeholder"),n=S(o);n&&(s.placeholder=n)}),document.querySelectorAll("[data-i18n-title]").forEach(s=>{const o=s.getAttribute("data-i18n-title"),n=S(o);n&&(s.title=n,s.setAttribute("aria-label",n))})}function h(t,...e){return t.reduce((i,s,o)=>`${i}${s}${e[o]??""}`,"").replace(/\s+/g," ").trim()}const b={BROWSER_TAB:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
            <path d="M3 9h18"></path>
        </svg>
    `,BROWSER_CONTROL:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
            <path d="m13 13 6 6"></path>
        </svg>
    `,MOUSE_POINTER:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
            <path d="m13 13 6 6"></path>
        </svg>
    `,MOUSE_POINTER_CLICK:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
            <path d="m13 13 6 6"></path>
            <path d="M14 4.5V2"></path>
            <path d="M18.5 8H21"></path>
            <path d="m16.8 5.2 1.8-1.8"></path>
        </svg>
    `,FORM:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="3" width="16" height="18" rx="2"></rect>
            <path d="M8 8h8"></path>
            <path d="M8 12h8"></path>
            <path d="M8 16h5"></path>
        </svg>
    `,CLOCK:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <path d="M12 7v5l3 2"></path>
        </svg>
    `,CODE:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m8 9-4 3 4 3"></path>
            <path d="m16 9 4 3-4 3"></path>
            <path d="m14 4-4 16"></path>
        </svg>
    `,MESSAGE_SQUARE:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `,TERMINAL:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="m4 17 6-6-6-6"></path>
            <path d="M12 19h8"></path>
        </svg>
    `,CHEVRON_LEFT:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    `,CHEVRON_RIGHT:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    `,CLOSE:h`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `,CHECK:h`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#4caf50" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    `,COPY:h`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `,DOWNLOAD:h`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    `,UPLOAD:h`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
    `,DATABASE:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
        </svg>
    `,EDIT:h`
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>
    `,EXTERNAL_OPEN:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6"/>
            <path d="M10 14 21 3"/>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        </svg>
    `,FIT_TO_SCREEN:h`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
    `,GITHUB:h`
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"
            stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61
                c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77
                5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38
                0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0
                5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61
                6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
    `,HISTORY:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7"></path>
            <path d="M3 3v5h5"></path>
            <path d="M12 7v5l4 2"></path>
        </svg>
    `,SIDEBAR_TOGGLE:h`
        <svg class="sidebar-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="8" y2="8"></line>
            <line x1="4" x2="14" y1="16" y2="16"></line>
        </svg>
    `,NEW_CHAT:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"></path>
        </svg>
    `,NEW_GROUP:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"></path>
            <path d="M2 8v11a2 2 0 0 0 2 2h14"></path>
        </svg>
    `,CHEVRON_DOWN:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    `,MORE_HORIZONTAL:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
        </svg>
    `,TRASH:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
            <path d="M10 11v6"></path>
            <path d="M14 11v6"></path>
        </svg>
    `,OCR:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7V4h3"></path>
            <path d="M20 7V4h-3"></path>
            <path d="M4 17v3h3"></path>
            <path d="M20 17v3h-3"></path>
            <line x1="9" y1="12" x2="15" y2="12"></line>
        </svg>
    `,PAGE_CONTEXT:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
    `,PAPERCLIP:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19
                a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
        </svg>
    `,QUOTE:h`
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
    `,RELEASES:h`
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"
            stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
        </svg>
    `,SEARCH:h`
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18"
            height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    `,SCREEN_CAPTURE:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="12" rx="2"></rect>
            <path d="M8 20h8"></path>
            <path d="M12 16v4"></path>
        </svg>
    `,SEND:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    `,STOP:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="7" y="7" width="10" height="10" rx="1"></rect>
        </svg>
    `,SUMMARY:h`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
            <path d="M10 12h4"></path>
            <path d="M10 16h4"></path>
        </svg>
    `,SETTINGS:h`
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
    `,SHARE:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <path d="M8.59 13.51 15.42 17.49"></path>
            <path d="M15.41 6.51 8.59 10.49"></path>
        </svg>
    `,SNIP:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2v14a2 2 0 0 0 2 2h14"></path>
            <path d="M18 22V8a2 2 0 0 0-2-2H2"></path>
        </svg>
    `,ACTIVE_TAB:h`
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
    `,TAB_STACK:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="7" y="3" width="14" height="12" rx="2"></rect>
            <path d="M7 7h14"></path>
            <path d="M3 8v11a2 2 0 0 0 2 2h12"></path>
            <path d="M3 12h4"></path>
        </svg>
    `,ZAP:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    `,TRANSLATE:h`
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
    `,ZOOM_IN:h`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `,ZOOM_OUT:h`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `,PLUG:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 2v4"></path>
            <path d="M15 2v4"></path>
            <path d="M18 6H6a2 2 0 0 0-2 2v3a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V8a2 2 0 0 0-2-2z"></path>
            <path d="M12 17v4"></path>
        </svg>
    `,KEY:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
            <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
        </svg>
    `,PALETTE:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 2 1 3 2.5 4.5.75.75 1.5 1.5 1.5 2.5.003 1.644 1.356 3 3 3H12z"></path>
            <circle cx="7.5" cy="10.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="11.5" cy="7.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="16.5" cy="9.5" r="1.5" stroke="none" fill="currentColor"></circle>
            <circle cx="15.5" cy="14.5" r="1.5" stroke="none" fill="currentColor"></circle>
        </svg>
    `,KEYBOARD:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M7 16h10M10 12h4"></path>
        </svg>
    `,LOCK_CLOSED:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    `,LOCK_OPEN:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
    `,INFO:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
    `,PIN:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"></path>
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a3 3 0 0 1 .88-2.12l.83-.83A1 1 0 0 0 16 2H8a1 1 0 0 0-.71 1.71l.83.83A3 3 0 0 1 9 7z"></path>
        </svg>
    `,PIN_OFF:h`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"></path>
            <path d="M15 10.34V7a3 3 0 0 1 .88-2.12l.71-.71"></path>
            <path d="m2 2 20 20"></path>
            <path d="M9 9.76v1a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"></path>
            <path d="M12.54 2H8a1 1 0 0 0-.71 1.71l.83.83A3 3 0 0 1 9 6.66"></path>
        </svg>
    `},be={mcpToolsDesc:"Connect to an MCP server and use its tools in chat.",mcpHeadersDesc:"Optional JSON object. Applied to SSE and Streamable HTTP requests.",shortcutDesc:"Click input and press keys to change.",textSelectionDesc:"Show floating toolbar when selecting text.",textSelectionBlacklistDesc:"Disable the text selection toolbar on matching sites.",customSelectionToolsDesc:"Add your own selection toolbar prompts.",imageToolsToggleDesc:"Show the AI button when hovering over images.",accountIndicesDesc:"Comma-separated user indices for polling.",contextModeDesc:"Summarize older messages or keep recent turns.",contextRecentTurnsDesc:"Number of latest user turns kept verbatim.",sidebarBehaviorAutoDesc:"Restore if opened soon, otherwise start new chat."};function k(t){const e=be[t];return e?`<button type="button" class="setting-help" data-i18n-title="${t}" title="${e}">?</button>`:""}const Ae=`
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
                    <h5><span data-i18n="mcpTools">MCP External Tools</span>${k("mcpToolsDesc")}</h5>
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
                    <span class="setting-field-label"><span data-i18n="mcpHeaders">Request Headers (JSON)</span>${k("mcpHeadersDesc")}</span>
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
    </div>`,Ee=`
    <div class="setting-group">
        <h4 data-i18n="general">General</h4>

        <div class="setting-panel">
            <div class="setting-panel-row">
                <div class="setting-panel-header">
                    <h5><span data-i18n="textSelection">Text Selection Toolbar</span>${k("textSelectionDesc")}</h5>
                </div>
                <input type="checkbox" id="text-selection-toggle" class="setting-toggle">
            </div>

            <div class="settings-section-offset">
                <label class="setting-label"><span data-i18n="textSelectionBlacklist">Selection Blacklist</span>${k("textSelectionBlacklistDesc")}</label>
                <textarea id="text-selection-blacklist" class="settings-input settings-full-input settings-monospace-textarea" data-i18n-placeholder="textSelectionBlacklistPlaceholder"></textarea>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5><span data-i18n="customSelectionTools">Custom Selection Tools</span>${k("customSelectionToolsDesc")}</h5>
            </div>
            <div id="custom-selection-tools-list" class="custom-selection-tools-list"></div>
            <button type="button" id="add-custom-selection-tool" class="btn-secondary settings-secondary-action settings-section-offset" data-i18n="customSelectionToolAdd">Add Tool</button>
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="imageToolsToggle">Hover Image Tools</span>${k("imageToolsToggleDesc")}</h5>
            </div>
            <input type="checkbox" id="image-tools-toggle" class="setting-toggle">
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="generatedImageWatermarkToggle">Auto Clean Generated Image Watermark</span>${k("generatedImageWatermarkToggleDesc")}</h5>
            </div>
            <input type="checkbox" id="generated-image-watermark-toggle" class="setting-toggle">
        </div>

        <div class="setting-panel setting-panel-row">
            <div class="setting-panel-header">
                <h5><span data-i18n="accountIndices">Account Indices (Web)</span>${k("accountIndicesDesc")}</h5>
            </div>
            <input type="text" id="account-indices-input" class="settings-input setting-panel-small-input" placeholder="0">
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header">
                <h5 data-i18n="contextManagement">Context Management</h5>
            </div>
            <div class="setting-panel-grid settings-section-offset">
                <label class="setting-field">
                    <span class="setting-field-label"><span data-i18n="contextMode">Mode</span>${k("contextModeDesc")}</span>
                    <select id="context-mode-select" class="settings-input settings-select">
                        <option value="summary" data-i18n="contextModeSummary">Summary</option>
                        <option value="recent" data-i18n="contextModeRecent">Recent</option>
                    </select>
                </label>
                <div class="setting-field setting-field-number">
                    <label class="setting-field-label"><span data-i18n="contextRecentTurns">Turns</span>${k("contextRecentTurnsDesc")}</label>
                    <input type="number" id="context-recent-turns-input" class="settings-input" min="1" max="50">
                </div>
            </div>
        </div>

        <div class="setting-panel">
            <div class="setting-panel-header setting-panel-header-spaced">
                <h5><span data-i18n="sidebarBehavior">Sidebar Behavior</span>${k("sidebarBehaviorAutoDesc")}</h5>
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
    </div>`,Ce=`
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
</div>`,ke=`
    <div class="setting-group">
        <h4><span data-i18n="keyboardShortcuts">Keyboard Shortcuts</span>${k("shortcutDesc")}</h4>

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
    </div>`,ye=`
<div class="setting-group data-management-group">
    <h4 data-i18n="dataManagement">Data Management</h4>

    <div class="data-management-shell">
        <div class="data-management-card">
            <div class="data-management-card-main">
                    <span class="data-management-card-icon">${b.HISTORY}</span>
                    <div class="data-management-card-copy">
                        <h5 data-i18n="historyDataTitle">Chat History</h5>
                </div>
            </div>
            <div class="data-management-card-actions">
                <button id="export-history-data" type="button" class="data-action-btn data-action-btn-primary" data-i18n-title="exportHistoryData" title="Export History">
                    <span class="data-action-icon">${b.DOWNLOAD}</span>
                    <span data-i18n="exportHistoryData">Export History</span>
                </button>
                <button id="import-history-data" type="button" class="data-action-btn data-action-btn-secondary" data-i18n-title="importHistoryData" title="Import History">
                    <span class="data-action-icon">${b.UPLOAD}</span>
                    <span data-i18n="importHistoryData">Import History</span>
                </button>
            </div>
        </div>

        <div class="data-management-card">
            <div class="data-management-card-main">
                    <span class="data-management-card-icon">${b.SETTINGS}</span>
                    <div class="data-management-card-copy">
                        <h5 data-i18n="settingsDataTitle">Settings Backup</h5>
                </div>
            </div>
            <div class="data-management-card-actions">
                <button id="export-settings-data" type="button" class="data-action-btn data-action-btn-primary" data-i18n-title="exportSettingsData" title="Export Settings">
                    <span class="data-action-icon">${b.DOWNLOAD}</span>
                    <span data-i18n="exportSettingsData">Export Settings</span>
                </button>
                <button id="import-settings-data" type="button" class="data-action-btn data-action-btn-secondary" data-i18n-title="importSettingsData" title="Import Settings">
                    <span class="data-action-icon">${b.UPLOAD}</span>
                    <span data-i18n="importSettingsData">Import Settings</span>
                </button>
            </div>
        </div>

        <div class="data-management-card data-management-card-muted">
            <div class="data-management-card-main">
                    <span class="data-management-card-icon">${b.DOWNLOAD}</span>
                    <div class="data-management-card-copy">
                        <h5 data-i18n="debugLogs">Debug Logs</h5>
                    </div>
            </div>
            <div class="data-management-card-actions">
                <button id="download-logs" type="button" class="data-action-btn data-action-btn-secondary" data-i18n-title="downloadLogs" title="Download Logs">
                    <span class="data-action-icon">${b.DOWNLOAD}</span>
                    <span data-i18n="downloadLogs">Download Logs</span>
                </button>
            </div>
        </div>
    </div>

    <input id="import-history-file" type="file" accept="application/json,.json" hidden>
    <input id="import-settings-file" type="file" accept="application/json,.json" hidden>
</div>`,Ie=`
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
                ${b.GITHUB}
                <span data-i18n="sourceCode">Source</span>
                <span id="star-count" class="star-badge"></span>
            </a>

            <a href="https://github.com/yeahhe365/Gemini-Nexus/releases" target="_blank" class="github-link">
                ${b.RELEASES}
                <span data-i18n="releases">Releases</span>
            </a>
        </div>
    </div>
</div>`,ce=`
    <div class="settings-content split-layout">
        <div class="settings-sidebar">
            <div class="settings-sidebar-header">
                <h3 data-i18n="settingsTitle">Settings</h3>
            </div>
            <ul class="settings-tabs">
                <li class="settings-tab active" data-tab="connection" role="button" tabindex="0" aria-selected="true">
                    <span class="tab-icon">${b.KEY}</span>
                    <span class="tab-label" data-i18n="apiSettings">API</span>
                </li>
                <li class="settings-tab" data-tab="general" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${b.SETTINGS}</span>
                    <span class="tab-label" data-i18n="general">General</span>
                </li>
                <li class="settings-tab" data-tab="appearance" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${b.PALETTE}</span>
                    <span class="tab-label" data-i18n="appearance">Appearance</span>
                </li>
                <li class="settings-tab" data-tab="shortcuts" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${b.KEYBOARD}</span>
                    <span class="tab-label" data-i18n="keyboardShortcuts">Shortcuts</span>
                </li>
                <li class="settings-tab" data-tab="data" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${b.DATABASE}</span>
                    <span class="tab-label" data-i18n="dataManagement">Data Management</span>
                </li>
                <li class="settings-tab" data-tab="about" role="button" tabindex="0" aria-selected="false">
                    <span class="tab-icon">${b.INFO}</span>
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
                    <button id="close-settings" class="icon-btn small" data-i18n-title="close" title="Close">${b.CLOSE}</button>
                </div>
            </div>
            <div class="settings-body">
                <div class="settings-section active" data-section="connection">
                    ${Ae}
                </div>
                <div class="settings-section" data-section="general">
                    ${Ee}
                </div>
                <div class="settings-section" data-section="appearance">
                    ${Ce}
                </div>
                <div class="settings-section" data-section="shortcuts">
                    ${ke}
                </div>
                <div class="settings-section" data-section="data">
                    ${ye}
                </div>
                <div class="settings-section" data-section="about">
                    ${Ie}
                </div>
            </div>
        </div>
    </div>
`,St=`
    <main id="settings-modal" class="settings-page visible">
        ${ce}
    </main>
`,Tt=`
    <div id="settings-modal" class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-tab-title">
        ${ce}
    </div>
`;function B(t){window.parent.postMessage({action:"FORWARD_TO_BACKGROUND",payload:t},"*")}function ft(t,e=null){window.parent.postMessage({action:"SAVE_SESSIONS",payload:e?{sessions:t,mutation:e}:t},"*")}function wt(t){window.parent.postMessage({action:"SAVE_GROUPS",payload:Array.isArray(t)?t:[]},"*")}function bt(t,e,i="text/plain"){window.parent.postMessage({action:"DOWNLOAD_TEXT",payload:{text:t,filename:e,contentType:i}},"*")}function xe(){window.parent.postMessage({action:"EXPORT_HISTORY_DATA"},"*")}function _e(t){window.parent.postMessage({action:"IMPORT_HISTORY_DATA",payload:t},"*")}function Me(){window.parent.postMessage({action:"EXPORT_SETTINGS_DATA"},"*")}function Le(t){window.parent.postMessage({action:"IMPORT_SETTINGS_DATA",payload:t},"*")}function Re(t){window.parent.postMessage({action:"SAVE_SHORTCUTS",payload:t},"*")}function Pe(t){window.parent.postMessage({action:"SAVE_THEME",payload:t},"*")}function De(t){window.parent.postMessage({action:"SAVE_LANGUAGE",payload:t},"*")}function X(t){window.parent.postMessage({action:"SAVE_TEXT_SELECTION",payload:t},"*")}function Oe(t){window.parent.postMessage({action:"SAVE_TEXT_SELECTION_BLACKLIST",payload:t},"*")}function Ne(t){window.parent.postMessage({action:"SAVE_CUSTOM_SELECTION_TOOLS",payload:Array.isArray(t)?t:[]},"*")}function J(t){window.parent.postMessage({action:"SAVE_IMAGE_TOOLS",payload:t},"*")}function Z(t){window.parent.postMessage({action:"SAVE_GENERATED_IMAGE_WATERMARK_REMOVAL",payload:t},"*")}function Q(t){window.parent.postMessage({action:"SAVE_SIDEBAR_BEHAVIOR",payload:t},"*")}function At(){window.parent.postMessage({action:"GET_SIDEBAR_EXPANDED"},"*")}function Et(t){window.parent.postMessage({action:"SAVE_SIDEBAR_EXPANDED",payload:!!t},"*")}function ee(t){window.parent.postMessage({action:"SAVE_SIDE_PANEL_SCOPE",payload:t},"*")}function Be(t){window.parent.postMessage({action:"SAVE_ACCOUNT_INDICES",payload:t},"*")}function Ue(t){window.parent.postMessage({action:"SAVE_CONTEXT_SETTINGS",payload:t},"*")}function Fe(t){window.parent.postMessage({action:"SAVE_CONNECTION_SETTINGS",payload:t},"*")}function V(t,e){const i=String(t||"sse").toLowerCase();if(i==="streamablehttp")return"streamable-http";if(i==="websocket")return"ws";if(i==="sse"&&typeof e=="string")try{const s=new URL(e.trim()),o=s.pathname.replace(/\/+$/,"").toLowerCase();if(s.protocol.startsWith("http")&&!o.endsWith("/sse"))return"streamable-http"}catch{}return i}function M(t){if(!t||typeof t!="object"||Array.isArray(t))return{};const e={};for(const[i,s]of Object.entries(t)){const o=String(i||"").trim();if(!o||s===void 0||s===null)continue;const n=String(s).trim();n&&(e[o]=n)}return e}function He(t){const e=M(t);return Object.keys(e).length===0?"":JSON.stringify(e,null,2)}function Ge(t){const e=(t||"").trim();if(!e)return{};let i;try{i=JSON.parse(e)}catch{throw new Error("Request headers must be valid JSON.")}if(!i||typeof i!="object"||Array.isArray(i))throw new Error("Request headers must be a JSON object.");return M(i)}function Ve(t){const{providerSelect:e}=t.elements;e&&e.addEventListener("change",p=>{t._saveDedicatedApiProviderEdits(t.activeProvider),t.updateVisibility(p.target.value)});const{dedicatedApiRefreshModels:i}=t.elements;i&&i.addEventListener("click",()=>{const p=(e==null?void 0:e.value)||t.activeProvider,w=j(p);if(!D(p)||!(w!=null&&w.modelListUrl))return;t._saveDedicatedApiProviderEdits(p);const E=t.dedicatedApiProviders[p]||{};t.setProviderModelListStatus(S("modelListFetching")),i.disabled=!0,B({action:"GET_PROVIDER_MODELS",provider:p,baseUrl:E.baseUrl||w.defaultBaseUrl,apiKey:E.apiKey||""})});const{mcpEnabled:s}=t.elements;s&&s.addEventListener("change",p=>{t.updateMcpVisibility(p.target.checked===!0)});const{mcpServerSelect:o,mcpAddServer:n,mcpRemoveServer:a,mcpServerName:r,mcpTransport:l,mcpServerUrl:d,mcpHeaders:u,mcpServerEnabled:m,mcpTestConnection:v,mcpToolMode:f,mcpRefreshTools:A,mcpEnableAllTools:T,mcpDisableAllTools:I,mcpToolSearch:y}=t.elements;o&&o.addEventListener("change",p=>{t._saveCurrentServerEdits(),t.mcpActiveServerId=p.target.value,t._loadActiveServerIntoForm(),t._renderMcpServerOptions(),t.setMcpTestStatus("")}),n&&n.addEventListener("click",()=>{t._saveCurrentServerEdits();const p=t._getDefaultServer();t.mcpServers.push(p),t.mcpActiveServerId=p.id,t._renderMcpServerOptions(),t._loadActiveServerIntoForm(),t.setMcpTestStatus("")}),a&&a.addEventListener("click",()=>{t._saveCurrentServerEdits();const p=t.mcpActiveServerId;if(p){if(t.mcpServers=t.mcpServers.filter(w=>w.id!==p),t.mcpServers.length===0){const w=t._getDefaultServer();w.enabled=!1,t.mcpServers=[w]}t.mcpActiveServerId=t.mcpServers[0].id,t._renderMcpServerOptions(),t._loadActiveServerIntoForm(),t.setMcpTestStatus("")}});const C=()=>{t._saveCurrentServerEdits(),t._renderMcpServerOptions()};r&&r.addEventListener("input",C),d&&d.addEventListener("input",C),u&&u.addEventListener("input",C),l&&l.addEventListener("change",()=>{const p=t._getActiveServer(),w=p&&p.transport||"sse",E=l.value||"sse";if(d&&(d.placeholder=t._getDefaultUrlForTransport(E)),p&&d){const z=(d.value||"").trim(),pe=t._getDefaultUrlForTransport(w);(!z||z===pe)&&(d.value=t._getDefaultUrlForTransport(E))}C()}),m&&m.addEventListener("change",C),f&&f.addEventListener("change",()=>{t._saveCurrentServerEdits(),t._renderToolsUI()}),y&&y.addEventListener("input",()=>{t._renderToolsUI()}),A&&A.addEventListener("click",()=>{if(!t._saveCurrentServerEdits())return;const p=t._getActiveServer();p&&(t.setMcpTestStatus(S("mcpFetchingTools")),B({action:"MCP_LIST_TOOLS",serverId:p.id,requestKey:t._serverKey(p),transport:V(p.transport,p.url),url:p.url||"",headers:M(p.headers)}))}),T&&T.addEventListener("click",()=>{const p=t._getActiveServer();if(!p)return;const w=t._getCachedTools(p);!w||w.length===0||(p.toolMode="selected",p.enabledTools=w.map(E=>E.name).filter(Boolean),t._loadActiveServerIntoForm(),t._renderToolsUI())}),I&&I.addEventListener("click",()=>{const p=t._getActiveServer();p&&(p.toolMode="selected",p.enabledTools=[],t._loadActiveServerIntoForm(),t._renderToolsUI())}),v&&v.addEventListener("click",()=>{if(!t._saveCurrentServerEdits())return;const p=t._getActiveServer();p&&(t.setMcpTestStatus(S("mcpTestingConnection")),B({action:"MCP_TEST_CONNECTION",serverId:p.id,transport:V(p.transport,p.url),url:p.url||"",headers:M(p.headers)}))})}function We(t,e=t.activeProvider){if(!D(e))return;const i=j(e),{dedicatedApiBaseUrl:s,dedicatedApiKey:o,dedicatedApiModel:n,dedicatedApiThinkingLevel:a,dedicatedApiWebSearch:r,dedicatedApiProviderRouting:l}=t.elements,d=t.dedicatedApiProviders[e]||{provider:e};t.dedicatedApiProviders[e]={...d,provider:e,baseUrl:s?s.value.trim():d.baseUrl,apiKey:o?o.value.trim():d.apiKey,model:n?n.value.trim():d.model,thinkingLevel:a?a.value:d.thinkingLevel,webSearch:r?r.checked===!0:d.webSearch===!0,providerRouting:(i==null?void 0:i.supportsProviderRouting)===!0&&l?l.value.trim():d.providerRouting||""}}function Ke(t,e){if(!D(e))return;const i=j(e),s=t.dedicatedApiProviders[e]||{},{dedicatedApiBaseUrl:o,dedicatedApiKey:n,dedicatedApiModel:a,dedicatedApiRefreshModels:r,dedicatedApiModelListStatus:l,dedicatedApiThinkingLevel:d,dedicatedApiWebSearchRow:u,dedicatedApiWebSearch:m,dedicatedApiProviderRoutingRow:v,dedicatedApiProviderRouting:f}=t.elements;o&&(o.placeholder=i.defaultBaseUrl||"",o.value=s.baseUrl||i.defaultBaseUrl||""),n&&(n.value=s.apiKey||""),a&&(a.placeholder=i.defaultModels||"",a.value=s.model||i.defaultModels||""),r&&(r.hidden=!i.modelListUrl,r.disabled=!1),l&&(l.hidden=!0,l.textContent="",l.classList.remove("is-error")),d&&(d.value=s.thinkingLevel||x),u&&(u.hidden=i.supportsWebSearch!==!0),m&&(m.checked=s.webSearch===!0),v&&(v.hidden=i.supportsProviderRouting!==!0),f&&(f.placeholder=i.providerRoutingPlaceholder||"{}",f.value=s.providerRouting||"")}function je(t,e,i=!1){const{dedicatedApiModelListStatus:s,dedicatedApiRefreshModels:o}=t.elements;o&&(o.disabled=!1),s&&(s.textContent=e||"",s.hidden=!e,s.classList.toggle("is-error",i))}function $e(t,e,i){const s=(Array.isArray(i)?i:[]).map(a=>String(a||"").trim()).filter(Boolean);if(!e||s.length===0)return;const o=s.join(", "),n=t.dedicatedApiProviders[e]||{provider:e};t.dedicatedApiProviders[e]={...n,provider:e,model:o,selectedModel:s.includes(n.selectedModel)?n.selectedModel:""},t.activeProvider===e&&t.elements.dedicatedApiModel&&(t.elements.dedicatedApiModel.value=o),t.setProviderModelListStatus(_("modelListUpdated",{count:s.length}))}const c={MODAL:"settings-modal",BTN_CLOSE:"close-settings",BTN_SAVE_SHORTCUTS:"save-shortcuts",SAVE_STATUS:"settings-save-status",BTN_RESET_SHORTCUTS:"reset-shortcuts",TEXT_SELECTION_TOGGLE:"text-selection-toggle",TEXT_SELECTION_BLACKLIST:"text-selection-blacklist",IMAGE_TOOLS_TOGGLE:"image-tools-toggle",GENERATED_IMAGE_WATERMARK_TOGGLE:"generated-image-watermark-toggle",ACCOUNT_INDICES:"account-indices-input",CONTEXT_MODE:"context-mode-select",INPUT_RECENT_TURNS:"context-recent-turns-input",CONTAINER_SELECTION_TOOLS:"custom-selection-tools-list",BTN_ADD_SELECTION_TOOL:"add-custom-selection-tool",PROVIDER_SELECT:"provider-select",API_KEY_CONTAINER:"api-key-container",WEB_FIELDS:"web-fields",WEB_TEMPORARY_CHAT:"web-temporary-chat-enabled",OFFICIAL_FIELDS:"official-fields",OFFICIAL_BASE_URL:"official-base-url",OFFICIAL_API_KEY:"api-key-input",OFFICIAL_MODEL:"official-model",OFFICIAL_THINKING_LEVEL:"thinking-level-select",OFFICIAL_WEB_SEARCH:"official-web-search-enabled",OPENAI_FIELDS:"openai-fields",OPENAI_BASE_URL:"openai-base-url",OPENAI_API_KEY:"openai-api-key",OPENAI_MODEL:"openai-model",OPENAI_THINKING_LEVEL:"openai-thinking-level-select",OPENAI_USE_RESPONSES_API:"openai-use-responses-api",OPENAI_WEB_SEARCH:"openai-web-search-enabled",DEDICATED_API_FIELDS:"dedicated-api-fields",DEDICATED_API_BASE_URL:"dedicated-api-base-url",DEDICATED_API_API_KEY:"dedicated-api-api-key",DEDICATED_API_MODEL:"dedicated-api-model",DEDICATED_API_REFRESH_MODELS:"dedicated-api-refresh-models",DEDICATED_API_MODEL_LIST_STATUS:"dedicated-api-model-list-status",DEDICATED_API_THINKING_LEVEL:"dedicated-api-thinking-level-select",DEDICATED_API_WEB_SEARCH_ROW:"dedicated-api-web-search-row",DEDICATED_API_WEB_SEARCH:"dedicated-api-web-search-enabled",DEDICATED_API_PROVIDER_ROUTING_ROW:"dedicated-api-provider-routing-row",DEDICATED_API_PROVIDER_ROUTING:"dedicated-api-provider-routing",MCP_ENABLED:"mcp-enabled",MCP_FIELDS:"mcp-fields",MCP_SERVER_SELECT:"mcp-server-select",MCP_ADD_SERVER:"mcp-add-server",MCP_REMOVE_SERVER:"mcp-remove-server",MCP_SERVER_NAME:"mcp-server-name",MCP_TRANSPORT:"mcp-transport",MCP_SERVER_URL:"mcp-server-url",MCP_HEADERS:"mcp-headers",MCP_SERVER_ENABLED:"mcp-server-enabled",MCP_TEST_CONNECTION:"mcp-test-connection",MCP_TEST_STATUS:"mcp-test-status",MCP_TOOL_MODE:"mcp-tool-mode",MCP_REFRESH_TOOLS:"mcp-refresh-tools",MCP_ENABLE_ALL_TOOLS:"mcp-enable-all-tools",MCP_DISABLE_ALL_TOOLS:"mcp-disable-all-tools",MCP_TOOL_SEARCH:"mcp-tool-search",MCP_TOOLS_SUMMARY:"mcp-tools-summary",MCP_TOOL_LIST:"mcp-tool-list",DOWNLOAD_LOGS:"download-logs",EXPORT_HISTORY_DATA:"export-history-data",IMPORT_HISTORY_DATA:"import-history-data",IMPORT_HISTORY_FILE:"import-history-file",EXPORT_SETTINGS_DATA:"export-settings-data",IMPORT_SETTINGS_DATA:"import-settings-data",IMPORT_SETTINGS_FILE:"import-settings-file",ABOUT_GROUP:"about-settings-group",APP_CURRENT_VERSION:"app-current-version",APP_UPDATE_STATUS:"app-update-status",STAR_COUNT:"star-count"},N={RECENT_TURNS:he};function g(t){return document.getElementById(t)}function qe(t=g){return{providerSelect:t(c.PROVIDER_SELECT),apiKeyContainer:t(c.API_KEY_CONTAINER),webFields:t(c.WEB_FIELDS),webTemporaryChat:t(c.WEB_TEMPORARY_CHAT),officialFields:t(c.OFFICIAL_FIELDS),officialBaseUrl:t(c.OFFICIAL_BASE_URL),apiKeyInput:t(c.OFFICIAL_API_KEY),officialModel:t(c.OFFICIAL_MODEL),thinkingLevelSelect:t(c.OFFICIAL_THINKING_LEVEL),officialWebSearchEnabled:t(c.OFFICIAL_WEB_SEARCH),openaiFields:t(c.OPENAI_FIELDS),openaiBaseUrl:t(c.OPENAI_BASE_URL),openaiApiKey:t(c.OPENAI_API_KEY),openaiModel:t(c.OPENAI_MODEL),openaiThinkingLevelSelect:t(c.OPENAI_THINKING_LEVEL),openaiUseResponsesApi:t(c.OPENAI_USE_RESPONSES_API),openaiWebSearch:t(c.OPENAI_WEB_SEARCH),dedicatedApiFields:t(c.DEDICATED_API_FIELDS),dedicatedApiBaseUrl:t(c.DEDICATED_API_BASE_URL),dedicatedApiKey:t(c.DEDICATED_API_API_KEY),dedicatedApiModel:t(c.DEDICATED_API_MODEL),dedicatedApiRefreshModels:t(c.DEDICATED_API_REFRESH_MODELS),dedicatedApiModelListStatus:t(c.DEDICATED_API_MODEL_LIST_STATUS),dedicatedApiThinkingLevel:t(c.DEDICATED_API_THINKING_LEVEL),dedicatedApiWebSearchRow:t(c.DEDICATED_API_WEB_SEARCH_ROW),dedicatedApiWebSearch:t(c.DEDICATED_API_WEB_SEARCH),dedicatedApiProviderRoutingRow:t(c.DEDICATED_API_PROVIDER_ROUTING_ROW),dedicatedApiProviderRouting:t(c.DEDICATED_API_PROVIDER_ROUTING),mcpEnabled:t(c.MCP_ENABLED),mcpFields:t(c.MCP_FIELDS),mcpServerSelect:t(c.MCP_SERVER_SELECT),mcpAddServer:t(c.MCP_ADD_SERVER),mcpRemoveServer:t(c.MCP_REMOVE_SERVER),mcpServerName:t(c.MCP_SERVER_NAME),mcpTransport:t(c.MCP_TRANSPORT),mcpServerUrl:t(c.MCP_SERVER_URL),mcpHeaders:t(c.MCP_HEADERS),mcpServerEnabled:t(c.MCP_SERVER_ENABLED),mcpTestConnection:t(c.MCP_TEST_CONNECTION),mcpTestStatus:t(c.MCP_TEST_STATUS),mcpToolMode:t(c.MCP_TOOL_MODE),mcpRefreshTools:t(c.MCP_REFRESH_TOOLS),mcpEnableAllTools:t(c.MCP_ENABLE_ALL_TOOLS),mcpDisableAllTools:t(c.MCP_DISABLE_ALL_TOOLS),mcpToolSearch:t(c.MCP_TOOL_SEARCH),mcpToolsSummary:t(c.MCP_TOOLS_SUMMARY),mcpToolList:t(c.MCP_TOOL_LIST)}}const U="(other)";function te(t){const e=document.createElement("div");return e.className="mcp-tool-help-text",e.textContent=t,e}function ze({server:t,tools:e,toolMode:i,enabledSet:s}){const o=Array.isArray(e)?e.length:0,n=i==="all"?o:s.size,a=S(i==="all"?"mcpModeAll":"mcpModeSelected");return!t.url||!t.url.trim()?S("mcpSummarySetServerUrl"):o===0?S(i==="all"?"mcpSummaryAllTools":"mcpSummaryNoTools"):_("mcpSummarySelected",{mode:a,count:n,total:o})}function Ye(t,e=""){const i=(e||"").trim().toLowerCase(),s=i?t.filter(n=>(n.name||"").toLowerCase().includes(i)||(n.description||"").toLowerCase().includes(i)):t,o=new Map;for(const n of s){const a=n.name||"";if(!a)continue;const r=a.indexOf("."),l=r>0?a.slice(0,r):U;o.has(l)||o.set(l,[]),o.get(l).push(n)}return Array.from(o.keys()).sort((n,a)=>n===U?1:a===U?-1:n.localeCompare(a)).map(n=>({name:n,tools:o.get(n).sort((a,r)=>(a.name||"").localeCompare(r.name||""))}))}function Xe(t,e,i){const s=t.name||"",o=s.indexOf("."),n=o>0?s.slice(o+1):s,a=document.createElement("label");a.className="mcp-tool-row";const r=document.createElement("input");r.type="checkbox",r.checked=e.has(s),r.addEventListener("change",()=>{r.checked?e.add(s):e.delete(s),i(Array.from(e))});const l=document.createElement("div");l.className="mcp-tool-row-text";const d=document.createElement("div");d.className="mcp-tool-name",d.textContent=n;const u=document.createElement("div");u.className="mcp-tool-full-name",u.textContent=s;const m=document.createElement("div");return m.className="mcp-tool-description",m.textContent=t.description||"",l.appendChild(d),l.appendChild(u),t.description&&l.appendChild(m),a.appendChild(r),a.appendChild(l),a}function Je(t,e,i,s,o){const n=e.map(T=>T.name).filter(Boolean),a=n.filter(T=>i.has(T)).length,r=n.length,l=document.createElement("details");l.className="mcp-tool-group",l.open=s.openGroups.has(t),l.addEventListener("toggle",()=>{l.open?s.openGroups.add(t):s.openGroups.delete(t)});const d=document.createElement("summary");d.className="mcp-tool-group-summary";const u=document.createElement("div");u.className="mcp-tool-group-summary-left";const m=document.createElement("input");m.type="checkbox",m.checked=r>0&&a===r,m.indeterminate=a>0&&a<r,m.addEventListener("click",T=>{T.stopPropagation()}),m.addEventListener("change",()=>{if(m.checked)for(const T of n)i.add(T);else for(const T of n)i.delete(T);o(Array.from(i))});const v=document.createElement("div");v.className="mcp-tool-group-title",v.textContent=t===U?S("mcpOtherTools"):t,u.appendChild(m),u.appendChild(v);const f=document.createElement("div");f.className="mcp-tool-group-count",f.textContent=`${a}/${r}`,d.appendChild(u),d.appendChild(f);const A=document.createElement("div");A.className="mcp-tool-group-list";for(const T of e)A.appendChild(Xe(T,i,o));return l.appendChild(d),l.appendChild(A),l}function Ze({server:t,tools:e,search:i,summaryElement:s,listElement:o,uiState:n,onToolsChange:a}){const r=t.toolMode==="selected"?"selected":"all",l=new Set(Array.isArray(t.enabledTools)?t.enabledTools:[]),d=Array.isArray(e)?e:[];if(s.textContent=ze({server:t,tools:d,toolMode:r,enabledSet:l}),o.innerHTML="",r==="all"){o.appendChild(te(S("mcpSwitchToSelected")));return}if(d.length===0){o.appendChild(te(S("mcpNoToolsLoaded")));return}const u=document.createElement("div");u.className="mcp-tool-selection";const m=v=>{t.enabledTools=v,a()};for(const v of Ye(d,i))u.appendChild(Je(v.name,v.tools,l,n,m));o.appendChild(u)}function Qe(){return re("srv")}class et{constructor(){this.elements={},this.mcpServers=[],this.mcpActiveServerId=null,this.activeProvider=null,this.dedicatedApiProviders=F(),this.mcpToolsCache=new Map,this.mcpToolsUiState=new Map,this.queryElements(),this.bindEvents()}_makeServerId(){return Qe()}_getDefaultServer(){return ne(this._makeServerId())}_getDefaultUrlForTransport(e){return ue(e)}queryElements(){this.elements=qe(g)}bindEvents(){Ve(this)}setData(e){const{providerSelect:i,officialBaseUrl:s,apiKeyInput:o,officialModel:n,thinkingLevelSelect:a,webTemporaryChat:r,officialWebSearchEnabled:l,openaiBaseUrl:d,openaiApiKey:u,openaiModel:m,openaiThinkingLevelSelect:v,openaiUseResponsesApi:f,openaiWebSearch:A,mcpEnabled:T}=this.elements;if(i){const p=(e==null?void 0:e.provider)||P;i.value=p,this.updateVisibility(p)}s&&(s.value=(e==null?void 0:e.officialBaseUrl)||W),o&&(o.value=(e==null?void 0:e.apiKey)||""),n&&(n.value=(e==null?void 0:e.officialModel)||K),a&&(a.value=(e==null?void 0:e.thinkingLevel)||x),r&&(r.checked=(e==null?void 0:e.webTemporaryChat)===!0),l&&(l.checked=(e==null?void 0:e.officialWebSearch)===!0),d&&(d.value=(e==null?void 0:e.openaiBaseUrl)||""),u&&(u.value=(e==null?void 0:e.openaiApiKey)||""),m&&(m.value=(e==null?void 0:e.openaiModel)||""),v&&(v.value=(e==null?void 0:e.openaiThinkingLevel)||x);const I=ae(e||{});f&&(f.checked=I.useResponsesApi),A&&(A.checked=I.webSearch),this.dedicatedApiProviders=F(e==null?void 0:e.dedicatedApiProviders),this._loadDedicatedApiProviderIntoForm((i==null?void 0:i.value)||P),T&&(T.checked=(e==null?void 0:e.mcpEnabled)===!0,this.updateMcpVisibility(T.checked));const y=e&&Array.isArray(e.mcpServers)?e.mcpServers:null,C=e&&typeof e.mcpActiveServerId=="string"?e.mcpActiveServerId:null;if(y&&y.length>0)this.mcpServers=y.map(p=>({id:p.id||this._makeServerId(),name:p.name||"",transport:p.transport||L,url:p.url||"",headers:M(p.headers),enabled:p.enabled!==!1,toolMode:p.toolMode==="selected"?"selected":"all",enabledTools:Array.isArray(p.enabledTools)?p.enabledTools:[]})),this.mcpActiveServerId=C&&this.mcpServers.some(p=>p.id===C)?C:this.mcpServers[0].id;else{const p=(e==null?void 0:e.mcpServerUrl)||"",w=(e==null?void 0:e.mcpTransport)||L,E=this._getDefaultServer();E.transport=w,E.url=p||E.url,E.headers=M(e==null?void 0:e.mcpHeaders),E.enabled=(e==null?void 0:e.mcpEnabled)===!0,this.mcpServers=[E],this.mcpActiveServerId=E.id}this._renderMcpServerOptions(),this._loadActiveServerIntoForm(),this.setMcpTestStatus("")}getData(){const{providerSelect:e,officialBaseUrl:i,apiKeyInput:s,officialModel:o,thinkingLevelSelect:n,webTemporaryChat:a,officialWebSearchEnabled:r,openaiBaseUrl:l,openaiApiKey:d,openaiModel:u,openaiThinkingLevelSelect:m,openaiUseResponsesApi:v,openaiWebSearch:f,mcpEnabled:A}=this.elements,T=e?e.value:P;this._saveDedicatedApiProviderEdits(T),this._saveCurrentServerEdits();const I=Array.isArray(this.mcpServers)?this.mcpServers:[],y=I.find(C=>C.enabled!==!1&&C.url&&C.url.trim());return{provider:T,officialBaseUrl:i?i.value.trim():W,apiKey:s?s.value.trim():"",officialModel:o?o.value.trim():K,thinkingLevel:n?n.value:x,webTemporaryChat:a?a.checked===!0:!1,officialWebSearch:r?r.checked===!0:!1,openaiBaseUrl:l?l.value.trim():"",openaiApiKey:d?d.value.trim():"",openaiModel:u?u.value.trim():"",openaiThinkingLevel:m?m.value:x,openaiUseResponsesApi:v?v.checked===!0:!1,openaiWebSearch:f?f.checked===!0:!1,dedicatedApiProviders:this.dedicatedApiProviders,mcpEnabled:A?A.checked===!0:!1,mcpServers:I,mcpActiveServerId:this.mcpActiveServerId||(I[0]?I[0].id:null),mcpTransport:y?y.transport||L:L,mcpServerUrl:y&&y.url||""}}updateVisibility(e){const{apiKeyContainer:i,webFields:s,officialFields:o,openaiFields:n,dedicatedApiFields:a}=this.elements;i&&(s&&(s.hidden=e!=="web"),o&&(o.hidden=e!=="official"),n&&(n.hidden=e!=="openai"),a&&(a.hidden=!D(e)),e==="web"?i.hidden=!0:(i.hidden=!1,D(e)&&this._loadDedicatedApiProviderIntoForm(e)),this.activeProvider=e)}_saveDedicatedApiProviderEdits(e=this.activeProvider){We(this,e)}_loadDedicatedApiProviderIntoForm(e){Ke(this,e)}updateMcpVisibility(e){const{mcpFields:i}=this.elements;i&&(i.hidden=!e)}_getActiveServer(){if(!this.mcpServers||this.mcpServers.length===0)return null;const e=this.mcpActiveServerId;return(e?this.mcpServers.find(s=>s.id===e):null)||this.mcpServers[0]}_saveCurrentServerEdits(){const{mcpServerName:e,mcpTransport:i,mcpServerUrl:s,mcpHeaders:o,mcpServerEnabled:n,mcpToolMode:a}=this.elements,r=this._getActiveServer();if(!r)return!1;const l=this._serverKey(r);if(e&&(r.name=e.value||""),s&&(r.url=(s.value||"").trim()),i&&(r.transport=V(i.value||"sse",r.url)),o)try{r.headers=Ge(o.value),this.setMcpTestStatus("")}catch(u){return this.setMcpTestStatus(u.message||S("mcpConnectionFailed"),!0),!1}n&&(r.enabled=n.checked===!0),a&&(r.toolMode=a.value==="selected"?"selected":"all");const d=this._serverKey(r);return l!==d&&this.mcpToolsCache.delete(r.id),!0}_loadActiveServerIntoForm(){const{mcpServerSelect:e,mcpServerName:i,mcpTransport:s,mcpServerUrl:o,mcpHeaders:n,mcpServerEnabled:a,mcpToolMode:r}=this.elements,l=this._getActiveServer();if(!l)return;e&&(e.value=l.id),i&&(i.value=l.name||"");const d=V(l.transport||"sse",l.url||"");l.transport=d,s&&(s.value=d),o&&(o.value=l.url||""),o&&(o.placeholder=this._getDefaultUrlForTransport(l.transport||"sse")),n&&(n.value=He(l.headers)),a&&(a.checked=l.enabled!==!1),r&&(r.value=l.toolMode==="selected"?"selected":"all"),this._renderToolsUI()}_renderMcpServerOptions(){const{mcpServerSelect:e}=this.elements;if(!e)return;const i=this._getActiveServer();i&&(this.mcpActiveServerId=i.id),e.innerHTML="";for(const s of this.mcpServers){const o=document.createElement("option");o.value=s.id;const a=(s.name||"").trim()||s.url||S("defaultMcpServer"),r=s.enabled===!1?"✗":"✓";o.textContent=`${r} ${a}`,e.appendChild(o)}i&&(e.value=i.id)}setMcpTestStatus(e,i=!1){const{mcpTestStatus:s}=this.elements;s&&(s.textContent=e||"",s.classList.toggle("is-error",i))}setProviderModelListStatus(e,i=!1){je(this,e,i)}setProviderModelList(e,i){$e(this,e,i)}_serverKey(e){const i=(e.transport||"sse").toLowerCase(),s=(e.url||"").trim(),o=M(e.headers),n=Object.keys(o).sort((a,r)=>a.localeCompare(r)).map(a=>`${a}:${o[a]}`).join(`
`);return`${i}:${s}:${n}`}_getCachedTools(e){const i=this.mcpToolsCache.get(e.id);return!i||i.key!==this._serverKey(e)?null:Array.isArray(i.tools)?i.tools:null}setMcpToolsList(e,i,s,o,n=null){const a=e||(this._getActiveServer()?this._getActiveServer().id:null);a&&(this.mcpToolsCache.set(a,{key:n||`${(i||"sse").toLowerCase()}:${(s||"").trim()}:`,tools:Array.isArray(o)?o:[]}),this.setMcpTestStatus(""),this._renderToolsUI())}_renderToolsUI(){const{mcpToolsSummary:e,mcpToolList:i,mcpToolSearch:s}=this.elements,o=this._getActiveServer();if(!o||!i||!e)return;const n=this._getCachedTools(o)||[];Ze({server:o,tools:n,search:s&&s.value||"",summaryElement:e,listElement:i,uiState:this._getToolsUiState(o.id),onToolsChange:()=>this._renderToolsUI()})}_getToolsUiState(e){const i=e||"default",s=this.mcpToolsUiState.get(i);if(s)return s;const o={openGroups:new Set};return o.openGroups.add("(other)"),this.mcpToolsUiState.set(i,o),o}}function ie(){return re("custom_tool")}class tt{constructor(e){this.callbacks=e||{},this.elements={},this.queryElements(),this.bindEvents()}queryElements(){this.elements={textSelectionToggle:g(c.TEXT_SELECTION_TOGGLE),textSelectionBlacklistInput:g(c.TEXT_SELECTION_BLACKLIST),imageToolsToggle:g(c.IMAGE_TOOLS_TOGGLE),generatedImageWatermarkToggle:g(c.GENERATED_IMAGE_WATERMARK_TOGGLE),customSelectionToolsList:g(c.CONTAINER_SELECTION_TOOLS),customSelectionToolAdd:g(c.BTN_ADD_SELECTION_TOOL),accountIndicesInput:g(c.ACCOUNT_INDICES),contextModeSelect:g(c.CONTEXT_MODE),contextRecentTurnsInput:g(c.INPUT_RECENT_TURNS),sidebarRadios:document.querySelectorAll('input[name="sidebar-behavior"]'),sidePanelScopeRadios:document.querySelectorAll('input[name="sidepanel-scope"]')}}bindEvents(){const{textSelectionToggle:e,imageToolsToggle:i,generatedImageWatermarkToggle:s,customSelectionToolAdd:o,customSelectionToolsList:n,sidebarRadios:a,sidePanelScopeRadios:r,contextRecentTurnsInput:l}=this.elements;e&&e.addEventListener("change",d=>this.fire("onTextSelectionChange",d.target.checked)),i&&i.addEventListener("change",d=>this.fire("onImageToolsChange",d.target.checked)),s&&s.addEventListener("change",d=>this.fire("onGeneratedImageWatermarkRemovalChange",d.target.checked)),o&&o.addEventListener("click",()=>{this.addCustomSelectionToolRow({id:ie(),name:"",prompt:"",enabled:!0})}),n&&n.addEventListener("click",d=>{const u=d.target.closest(".custom-selection-tool-remove");if(u){const m=u.closest(".custom-selection-tool-row");m&&m.remove()}}),a&&a.forEach(d=>{d.addEventListener("change",u=>{u.target.checked&&this.fire("onSidebarBehaviorChange",u.target.value)})}),r&&r.forEach(d=>{d.addEventListener("change",u=>{u.target.checked&&this.fire("onSidePanelScopeChange",u.target.value)})}),l&&l.addEventListener("input",d=>{const u=Number.parseInt(d.target.value,10);Number.isFinite(u)&&(u<N.RECENT_TURNS.MIN?d.target.value=N.RECENT_TURNS.MIN:u>N.RECENT_TURNS.MAX&&(d.target.value=N.RECENT_TURNS.MAX))})}setToggles(e,i,s){this.elements.textSelectionToggle&&(this.elements.textSelectionToggle.checked=e),this.elements.imageToolsToggle&&(this.elements.imageToolsToggle.checked=i),this.elements.generatedImageWatermarkToggle&&(this.elements.generatedImageWatermarkToggle.checked=s!==!1)}setTextSelectionBlacklist(e){this.elements.textSelectionBlacklistInput&&(this.elements.textSelectionBlacklistInput.value=e||"")}setCustomSelectionTools(e){this.elements.customSelectionToolsList&&(this.elements.customSelectionToolsList.replaceChildren(),$(e).forEach(i=>{this.addCustomSelectionToolRow(i)}))}addCustomSelectionToolRow(e){const i=this.elements.customSelectionToolsList;if(!i)return;const s=document.createElement("div");s.className="custom-selection-tool-row",s.dataset.toolId=e.id||ie();const o=document.createElement("label");o.className="custom-selection-tool-enabled-label";const n=document.createElement("input");n.type="checkbox",n.className="custom-selection-tool-enabled",n.checked=e.enabled!==!1,o.appendChild(n);const a=document.createElement("div");a.className="custom-selection-tool-fields";const r=document.createElement("input");r.type="text",r.className="settings-input settings-full-input custom-selection-tool-name",r.placeholder=S("customSelectionToolNamePlaceholder"),r.value=e.name||"";const l=document.createElement("textarea");l.className="settings-input settings-full-input settings-monospace-textarea custom-selection-tool-prompt",l.placeholder=S("customSelectionToolPromptPlaceholder"),l.value=e.prompt||"",a.appendChild(r),a.appendChild(l);const d=document.createElement("button");d.type="button",d.className="btn-secondary settings-secondary-action custom-selection-tool-remove",d.textContent=S("customSelectionToolRemove"),s.appendChild(o),s.appendChild(a),s.appendChild(d),i.appendChild(s)}setAccountIndices(e){this.elements.accountIndicesInput&&(this.elements.accountIndicesInput.value=e||"0")}setSidebarBehavior(e){if(this.elements.sidebarRadios){const i=e||"auto";this.elements.sidebarRadios.forEach(s=>{s.checked=s.value===i})}}setSidePanelScope(e){if(this.elements.sidePanelScopeRadios){const s=new Set(Array.from(this.elements.sidePanelScopeRadios).map(o=>o.value)).has(e)?e:R;this.elements.sidePanelScopeRadios.forEach(o=>{o.checked=o.value===s})}}setContextSettings(e){const i=(e==null?void 0:e.mode)==="recent"?"recent":O,s=Number.parseInt(e==null?void 0:e.recentTurns,10);this.elements.contextModeSelect&&(this.elements.contextModeSelect.value=i),this.elements.contextRecentTurnsInput&&(this.elements.contextRecentTurnsInput.value=Number.isFinite(s)?s:H)}getData(){var f,A;const{textSelectionToggle:e,textSelectionBlacklistInput:i,imageToolsToggle:s,generatedImageWatermarkToggle:o,customSelectionToolsList:n,accountIndicesInput:a,contextModeSelect:r,contextRecentTurnsInput:l,sidebarRadios:d,sidePanelScopeRadios:u}=this.elements,m=((f=Array.from(d||[]).find(T=>T.checked))==null?void 0:f.value)||"auto",v=((A=Array.from(u||[]).find(T=>T.checked))==null?void 0:A.value)||R;return{textSelection:e?e.checked:!0,textSelectionBlacklist:i?i.value:"",imageTools:s?s.checked:!0,generatedImageWatermarkRemoval:o?o.checked:!0,customSelectionTools:this.getCustomSelectionTools(n),accountIndices:a?a.value:"0",sidebarBehavior:m,sidePanelScope:v,contextMode:r?r.value:O,contextRecentTurns:l?l.value:H}}getCustomSelectionTools(e=this.elements.customSelectionToolsList){return e?[...e.querySelectorAll(".custom-selection-tool-row")].map(i=>{var s,o,n;return{id:i.dataset.toolId||"",name:((s=i.querySelector(".custom-selection-tool-name"))==null?void 0:s.value)||"",prompt:((o=i.querySelector(".custom-selection-tool-prompt"))==null?void 0:o.value)||"",enabled:((n=i.querySelector(".custom-selection-tool-enabled"))==null?void 0:n.checked)!==!1}}):[]}fire(e,i){this.callbacks[e]&&this.callbacks[e](i)}}class it{constructor(e){this.callbacks=e||{},this.elements={},this.queryElements(),this.bindEvents()}queryElements(){this.elements={themeSelect:g("theme-select"),languageSelect:g("language-select")}}bindEvents(){const{themeSelect:e,languageSelect:i}=this.elements;e&&e.addEventListener("change",s=>this.fire("onThemeChange",s.target.value)),i&&i.addEventListener("change",s=>this.fire("onLanguageChange",s.target.value)),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{e&&e.value==="system"&&this.applyVisualTheme("system")})}setTheme(e){this.elements.themeSelect&&(this.elements.themeSelect.value=e),this.applyVisualTheme(e)}setLanguage(e){this.elements.languageSelect&&(this.elements.languageSelect.value=e)}applyVisualTheme(e){let i=e;e==="system"&&(i=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),document.documentElement.setAttribute("data-theme",i)}fire(e,i){this.callbacks[e]&&this.callbacks[e](i)}}function st(t){const e=typeof t.code=="string"?t.code:"",i=e.match(/^Key([A-Z])$/i);if(i)return i[1].toUpperCase();const s=e.match(/^Digit([0-9])$/);if(s)return s[1];let o=t.key.toUpperCase();return o===" "&&(o="Space"),o}class ot{constructor(){this.elements={},this.queryElements(),this.bindEvents()}queryElements(){this.elements={inputQuickAsk:g("shortcut-quick-ask"),inputOpenPanel:g("shortcut-open-panel"),inputBrowserControl:g("shortcut-browser-control"),inputOcrCapture:g("shortcut-ocr-capture")}}bindEvents(){this.setupShortcutInput(this.elements.inputQuickAsk),this.setupShortcutInput(this.elements.inputOpenPanel),this.setupShortcutInput(this.elements.inputBrowserControl),this.setupShortcutInput(this.elements.inputOcrCapture)}setupShortcutInput(e){e&&e.addEventListener("keydown",i=>{if(i.preventDefault(),i.stopPropagation(),["Control","Alt","Shift","Meta"].includes(i.key))return;const s=[];i.ctrlKey&&s.push("Ctrl"),i.altKey&&s.push("Alt"),i.shiftKey&&s.push("Shift"),i.metaKey&&s.push("Meta"),s.push(st(i)),e.value=s.join("+")})}setData(e){this.elements.inputQuickAsk&&(this.elements.inputQuickAsk.value=e.quickAsk),this.elements.inputOpenPanel&&(this.elements.inputOpenPanel.value=e.openPanel),this.elements.inputBrowserControl&&(this.elements.inputBrowserControl.value=e.browserControl||"Ctrl+B"),this.elements.inputOcrCapture&&(this.elements.inputOcrCapture.value=e.ocrCapture||"Alt+O")}getData(){const{inputQuickAsk:e,inputOpenPanel:i,inputBrowserControl:s,inputOcrCapture:o}=this.elements;return{quickAsk:e?e.value:null,openPanel:i?i.value:null,browserControl:s?s.value:"Ctrl+B",ocrCapture:o?o.value:"Alt+O"}}}class nt{constructor(e){this.callbacks=e||{},this.elements={},this.queryElements(),this.bindEvents()}queryElements(){this.elements={btnDownloadLogs:g(c.DOWNLOAD_LOGS),btnExportHistory:g(c.EXPORT_HISTORY_DATA),btnImportHistory:g(c.IMPORT_HISTORY_DATA),inputImportHistory:g(c.IMPORT_HISTORY_FILE),btnExportSettings:g(c.EXPORT_SETTINGS_DATA),btnImportSettings:g(c.IMPORT_SETTINGS_DATA),inputImportSettings:g(c.IMPORT_SETTINGS_FILE)}}bindEvents(){this.elements.btnDownloadLogs&&this.elements.btnDownloadLogs.addEventListener("click",()=>{this.callbacks.onDownloadLogs&&this.callbacks.onDownloadLogs()}),this.elements.btnExportHistory&&this.elements.btnExportHistory.addEventListener("click",()=>{this.callbacks.onExportHistory&&this.callbacks.onExportHistory()}),this.elements.btnImportHistory&&this.elements.inputImportHistory&&(this.elements.btnImportHistory.addEventListener("click",()=>{this.elements.inputImportHistory.click()}),this.elements.inputImportHistory.addEventListener("change",()=>{this.importJsonFile(this.elements.inputImportHistory,e=>{this.callbacks.onImportHistory&&this.callbacks.onImportHistory(e)})})),this.elements.btnExportSettings&&this.elements.btnExportSettings.addEventListener("click",()=>{this.callbacks.onExportSettings&&this.callbacks.onExportSettings()}),this.elements.btnImportSettings&&this.elements.inputImportSettings&&(this.elements.btnImportSettings.addEventListener("click",()=>{this.elements.inputImportSettings.click()}),this.elements.inputImportSettings.addEventListener("change",()=>{this.importJsonFile(this.elements.inputImportSettings,e=>{this.callbacks.onImportSettings&&this.callbacks.onImportSettings(e)})}))}importJsonFile(e,i){var a;const s=(a=e==null?void 0:e.files)==null?void 0:a[0];if(!s)return;const o=()=>{e.value=""},n=()=>{alert(S("dataImportFailed")),o()};try{const r=new FileReader;r.onload=()=>{try{const l=JSON.parse(String(r.result||""));i(l),o()}catch{n()}},r.onerror=n,r.readAsText(s)}catch{n()}}}class at{constructor(e){this.callbacks=e||{},this.elements={},this.queryElements(),this.bindEvents()}queryElements(){this.elements={aboutGroup:g(c.ABOUT_GROUP),starEl:g(c.STAR_COUNT),currentVersionEl:g(c.APP_CURRENT_VERSION),updateStatusEl:g(c.APP_UPDATE_STATUS)}}bindEvents(){document.addEventListener("click",e=>{const i=e.target.closest("#about-settings-group a[href]");if(!i||this.elements.aboutGroup&&!this.elements.aboutGroup.contains(i))return;const s=i.getAttribute("href");!s||!/^https?:\/\//i.test(s)||(e.preventDefault(),e.stopPropagation(),window.parent.postMessage({action:"OPEN_EXTERNAL_URL",payload:{url:s}},"*"))})}displayStars(e){const{starEl:i}=this.elements;if(i)if(e){const s=e>999?(e/1e3).toFixed(1)+"k":e;i.textContent=`★ ${s}`,i.classList.add("is-visible"),i.dataset.fetched="true"}else i.classList.remove("is-visible")}hasFetchedStars(){return this.elements.starEl&&this.elements.starEl.dataset.fetched==="true"}setCurrentVersion(e){this.elements.currentVersionEl&&(this.elements.currentVersionEl.textContent=e||"")}getCurrentVersion(){return this.elements.currentVersionEl?this.elements.currentVersionEl.textContent:null}displayUpdateStatus(e,i,s){const{updateStatusEl:o}=this.elements;if(o)if(o.replaceChildren(),o.classList.remove("is-muted"),s){const n=document.createElement("a");n.href="https://github.com/yeahhe365/Gemini-Nexus/releases",n.target="_blank",n.className="app-update-link",n.textContent=`Update available: ${e}`,o.appendChild(n)}else o.textContent=`(Latest: ${e})`,o.classList.add("is-muted")}}class rt{constructor(e){this.callbacks=e||{},this.elements={},this._escapeKeyHandler=null,this._saveFeedbackTimer=null,this.connection=new et,this.general=new tt({onTextSelectionChange:i=>this.fire("onTextSelectionChange",i),onImageToolsChange:i=>this.fire("onImageToolsChange",i),onSidebarBehaviorChange:i=>this.fire("onSidebarBehaviorChange",i),onSidePanelScopeChange:i=>this.fire("onSidePanelScopeChange",i)}),this.appearance=new it({onThemeChange:i=>this.fire("onThemeChange",i),onLanguageChange:i=>this.fire("onLanguageChange",i)}),this.shortcuts=new ot,this.dataManagement=new nt({onDownloadLogs:()=>this.fire("onDownloadLogs"),onExportHistory:()=>this.fire("onExportHistory"),onImportHistory:i=>this.fire("onImportHistory",i),onExportSettings:()=>this.fire("onExportSettings"),onImportSettings:i=>this.fire("onImportSettings",i)}),this.about=new at,this.queryElements(),this.bindEvents()}queryElements(){this.elements={modal:g(c.MODAL),btnClose:g(c.BTN_CLOSE),btnSave:g(c.BTN_SAVE_SHORTCUTS),saveStatus:g(c.SAVE_STATUS),btnReset:g(c.BTN_RESET_SHORTCUTS)}}bindEvents(){const{modal:e,btnClose:i,btnSave:s,btnReset:o}=this.elements;i&&i.addEventListener("click",()=>this.close()),e&&e.addEventListener("click",l=>{l.target===e&&this.close()}),s&&s.addEventListener("click",()=>this.handleSave()),o&&o.addEventListener("click",()=>this.handleReset());const n=document.querySelectorAll(".settings-tab"),a=document.querySelectorAll(".settings-section"),r=g("settings-tab-title");n.forEach(l=>{const d=()=>{const u=l.getAttribute("data-tab");n.forEach(v=>{v.classList.remove("active"),v.setAttribute("aria-selected","false")}),a.forEach(v=>v.classList.remove("active")),l.classList.add("active"),l.setAttribute("aria-selected","true");const m=document.querySelector(`.settings-section[data-section="${u}"]`);if(m&&m.classList.add("active"),r){const v=l.querySelector(".tab-label");if(v){r.textContent=v.textContent;const f=v.getAttribute("data-i18n");f?r.setAttribute("data-i18n",f):r.removeAttribute("data-i18n")}}};l.addEventListener("click",d),l.addEventListener("keydown",u=>{u.key!=="Enter"&&u.key!==" "||(u.preventDefault(),d())})})}handleSave(){const e=this.getFormData();this.fire("onSave",e),this.showSaveFeedback()}showSaveFeedback(){const{btnSave:e,saveStatus:i}=this.elements;this._saveFeedbackTimer&&(clearTimeout(this._saveFeedbackTimer),this._saveFeedbackTimer=null),e&&(e.classList.add("is-saved"),e.disabled=!0),i&&(i.textContent=S("settingsSaved"),i.hidden=!1,i.classList.add("is-visible")),this._saveFeedbackTimer=setTimeout(()=>{e&&(e.classList.remove("is-saved"),e.disabled=!1),i&&(i.classList.remove("is-visible"),i.hidden=!0,i.textContent=""),this._saveFeedbackTimer=null},1800)}getFormData(){const e=this.shortcuts.getData(),i=this.connection.getData(),s=this.general.getData();return{shortcuts:e,connection:i,textSelection:s.textSelection,textSelectionBlacklist:s.textSelectionBlacklist,customSelectionTools:s.customSelectionTools,imageTools:s.imageTools,accountIndices:s.accountIndices,sidebarBehavior:s.sidebarBehavior,sidePanelScope:s.sidePanelScope,contextMode:s.contextMode,contextRecentTurns:s.contextRecentTurns}}handleReset(){this.fire("onReset")}open(){if(this.elements.modal){this.elements.modal.classList.add("visible");const e=document.querySelector('.settings-tab[data-tab="connection"]');e&&e.click(),this._escapeKeyHandler||(this._escapeKeyHandler=i=>{i.key==="Escape"&&this.elements.modal&&this.elements.modal.classList.contains("visible")&&this.close()},document.addEventListener("keydown",this._escapeKeyHandler)),this.fire("onOpen")}}close(){this.elements.modal&&this.elements.modal.classList.remove("visible"),this._escapeKeyHandler&&(document.removeEventListener("keydown",this._escapeKeyHandler),this._escapeKeyHandler=null),this._saveFeedbackTimer&&(clearTimeout(this._saveFeedbackTimer),this._saveFeedbackTimer=null)}setShortcuts(e){this.shortcuts.setData(e)}setThemeValue(e){this.appearance.setTheme(e)}setLanguageValue(e){this.appearance.setLanguage(e)}applyVisualTheme(e){this.appearance.applyVisualTheme(e)}setToggles(e,i,s){this.general.setToggles(e,i,s)}setTextSelectionBlacklist(e){this.general.setTextSelectionBlacklist(e)}setCustomSelectionTools(e){this.general.setCustomSelectionTools(e)}setSidebarBehavior(e){this.general.setSidebarBehavior(e)}setAccountIndices(e){this.general.setAccountIndices(e)}setSidePanelScope(e){this.general.setSidePanelScope(e)}setContextSettings(e){this.general.setContextSettings(e)}setConnectionSettings(e){this.connection.setData(e)}displayStars(e){this.about.displayStars(e)}hasFetchedStars(){return this.about.hasFetchedStars()}getCurrentVersion(){return this.about.getCurrentVersion()}displayUpdateStatus(e,i,s){this.about.displayUpdateStatus(e,i,s)}setAppVersion(e){this.about.setCurrentVersion(e)}fire(e,i){this.callbacks[e]&&this.callbacks[e](i)}}const se="https://api.github.com/repos/yeahhe365/Gemini-Nexus";async function oe(t,e){if(!(t!=null&&t.ok))return null;try{const i=await t.json();return(i==null?void 0:i[e])??null}catch{return null}}async function lt(t=fetch,e=3500){const i=typeof AbortController<"u"?new AbortController:null,s=i?setTimeout(()=>i.abort(),e):null,o=i?{signal:i.signal}:void 0;try{const[n,a]=await Promise.allSettled([t(se,o),t(`${se}/releases/latest`,o)]);return{stars:n.status==="fulfilled"?await oe(n.value,"stargazers_count"):null,latestVersion:a.status==="fulfilled"?await oe(a.value,"tag_name"):null}}finally{s&&clearTimeout(s)}}function ct(t,e){const i=String(t||"").replace(/^v/,""),s=String(e).replace(/^v/,""),o=i.split(".").map(Number),n=s.split(".").map(Number);for(let a=0;a<Math.max(o.length,n.length);a++){const r=o[a]||0,l=n[a]||0;if(r>l)return 1;if(r<l)return-1}return 0}function dt(t){return t.map(e=>{const i=new Date(e.timestamp).toISOString(),s=e.data?` | Data: ${JSON.stringify(e.data)}`:"";return`[${i}] [${e.level}] [${e.context}] ${e.message}${s}`}).join(`
`)}function pt(t){return String(t||"").split(",").map(i=>i.trim()).filter(i=>/^\d+$/.test(i)).join(",")||"0"}function de(t){const e=Number.parseInt(t,10);return Number.isFinite(e)?Math.min(50,Math.max(1,e)):H}function ht(t){return{shortcuts:t.shortcuts,textSelectionEnabled:t.textSelection,textSelectionBlacklist:t.textSelectionBlacklist||"",customSelectionTools:$(t.customSelectionTools),imageToolsEnabled:t.imageTools,generatedImageWatermarkRemovalEnabled:t.generatedImageWatermarkRemoval!==!1,accountIndices:pt(t.accountIndices),sidebarBehavior:t.sidebarBehavior||"auto",sidePanelScope:t.sidePanelScope||R}}function ut(t){return{mode:t.contextMode==="recent"?"recent":O,recentTurns:de(t.contextRecentTurns)}}function gt(t,e={}){const i=ae(t);return{provider:t.provider,webThinkingLevel:ge(e.webThinkingLevel),webTemporaryChat:t.webTemporaryChat===!0,officialBaseUrl:t.officialBaseUrl,apiKey:t.apiKey,officialModel:t.officialModel,thinkingLevel:t.thinkingLevel,officialWebSearch:t.officialWebSearch===!0,openaiBaseUrl:t.openaiBaseUrl,openaiApiKey:t.openaiApiKey,openaiModel:t.openaiModel,openaiSelectedModel:e.openaiSelectedModel||"",openaiThinkingLevel:t.openaiThinkingLevel||x,openaiUseResponsesApi:i.useResponsesApi,openaiWebSearch:i.webSearch,dedicatedApiProviders:F(t.dedicatedApiProviders||e.dedicatedApiProviders),mcpEnabled:t.mcpEnabled===!0,mcpTransport:t.mcpTransport||L,mcpServerUrl:t.mcpServerUrl||"",mcpServers:Array.isArray(t.mcpServers)?t.mcpServers:[],mcpActiveServerId:t.mcpActiveServerId||null}}class Ct{constructor(e){this.callbacks=e||{},this.defaultShortcuts={...me},this.shortcuts={...this.defaultShortcuts},this.textSelectionEnabled=!0,this.textSelectionBlacklist="",this.customSelectionTools=[],this.imageToolsEnabled=!0,this.generatedImageWatermarkRemovalEnabled=!0,this.accountIndices="0",this.sidebarBehavior="auto",this.sidePanelScope=R,this.contextSettings={mode:O,recentTurns:H},this.connectionData={provider:P,useOfficialApi:!1,webThinkingLevel:Se,webTemporaryChat:!1,officialBaseUrl:W,apiKey:"",officialModel:K,thinkingLevel:x,officialWebSearch:!1,openaiBaseUrl:"",openaiApiKey:"",openaiModel:"",openaiSelectedModel:"",openaiThinkingLevel:x,openaiUseResponsesApi:!1,openaiWebSearch:!1,dedicatedApiProviders:F(),mcpEnabled:!1,mcpTransport:L,mcpServerUrl:ve,mcpServers:[ne()],mcpActiveServerId:null},this.view=new rt({onOpen:()=>this.handleOpen(),onSave:i=>this.saveSettings(i),onReset:()=>this.resetSettings(),onThemeChange:i=>this.setTheme(i),onLanguageChange:i=>this.setLanguage(i),onTextSelectionChange:i=>{this.textSelectionEnabled=i==="on"||i===!0,X(this.textSelectionEnabled)},onImageToolsChange:i=>{this.imageToolsEnabled=i==="on"||i===!0,J(this.imageToolsEnabled)},onGeneratedImageWatermarkRemovalChange:i=>{this.generatedImageWatermarkRemovalEnabled=i==="on"||i===!0,Z(this.generatedImageWatermarkRemovalEnabled)},onSidebarBehaviorChange:i=>{this.sidebarBehavior=i||"auto",Q(this.sidebarBehavior)},onSidePanelScopeChange:i=>{this.sidePanelScope=i||R,ee(this.sidePanelScope)},onDownloadLogs:()=>this.downloadLogs(),onExportHistory:()=>this.exportHistory(),onImportHistory:i=>this.importHistory(i),onExportSettings:()=>this.exportSettings(),onImportSettings:i=>this.importSettings(i)}),window.addEventListener("message",i=>{const{action:s,payload:o}=i.data||{};if(s==="BACKGROUND_MESSAGE"&&(o!=null&&o.logs)){this.saveLogFile(o.logs);return}if(s==="DATA_IMPORT_RESULT"){this.handleDataImportResult(o);return}})}open(){this.view.open()}close(){this.view.close()}handleOpen(){this.view.setShortcuts(this.shortcuts),this.view.setLanguageValue(we()),this.view.setToggles(this.textSelectionEnabled,this.imageToolsEnabled,this.generatedImageWatermarkRemovalEnabled),this.view.setTextSelectionBlacklist(this.textSelectionBlacklist),this.view.setCustomSelectionTools(this.customSelectionTools),this.view.setAccountIndices(this.accountIndices),this.view.setSidebarBehavior(this.sidebarBehavior),this.view.setSidePanelScope(this.sidePanelScope),this.view.setContextSettings(this.contextSettings),this.view.setConnectionSettings(this.connectionData),this.refreshGithubMetadata()}saveSettings(e){const i=this.connectionData.provider||(this.connectionData.useOfficialApi?"official":"web"),s=ht(e);this.shortcuts=s.shortcuts,Re(this.shortcuts),this.textSelectionEnabled=s.textSelectionEnabled,X(this.textSelectionEnabled),this.textSelectionBlacklist=s.textSelectionBlacklist,Oe(this.textSelectionBlacklist),this.customSelectionTools=s.customSelectionTools,this.view.setCustomSelectionTools(this.customSelectionTools),Ne(this.customSelectionTools),this.imageToolsEnabled=s.imageToolsEnabled,J(this.imageToolsEnabled),this.generatedImageWatermarkRemovalEnabled=s.generatedImageWatermarkRemovalEnabled,Z(this.generatedImageWatermarkRemovalEnabled),this.accountIndices=s.accountIndices,this.view.setAccountIndices(this.accountIndices),Be(this.accountIndices),this.sidebarBehavior=s.sidebarBehavior,Q(this.sidebarBehavior),this.sidePanelScope=s.sidePanelScope,ee(this.sidePanelScope),this.contextSettings=ut(e),Ue(this.contextSettings),this.connectionData=gt(e.connection,this.connectionData),Fe(this.connectionData),this.callbacks.onSettingsChanged&&this.callbacks.onSettingsChanged(this.connectionData,{providerChanged:i!==this.connectionData.provider})}resetSettings(){this.view.setShortcuts(this.defaultShortcuts),this.view.setAccountIndices("0")}downloadLogs(){B({action:"GET_LOGS"})}exportHistory(){xe()}importHistory(e){_e(e)}exportSettings(){Me()}importSettings(e){Le(e)}handleDataImportResult(e){if(!e||e.ok!==!0){const i=(e==null?void 0:e.error)||S("dataImportFailed");alert(_("dataImportError",{error:i}));return}if(e.kind==="history"){alert(S("historyImportSuccess"));return}e.kind==="settings"&&alert(S("settingsImportSuccess"))}saveLogFile(e){if(!e||e.length===0){alert(S("noLogsToDownload"));return}const i=dt(e);window.parent.postMessage({action:"DOWNLOAD_LOGS",payload:{text:i,filename:`gemini-nexus-logs-${Date.now()}.txt`}},"*")}setTheme(e){this.view.applyVisualTheme(e),Pe(e)}updateTheme(e){this.view.setThemeValue(e)}setLanguage(e){Y(e),De(e),document.dispatchEvent(new CustomEvent("gemini-language-changed"))}updateLanguage(e){Y(e),this.view.setLanguageValue(e),document.dispatchEvent(new CustomEvent("gemini-language-changed"))}updateShortcuts(e){this.shortcuts=Te(e),this.view.setShortcuts(this.shortcuts)}updateTextSelection(e){this.textSelectionEnabled=e,this.view.setToggles(this.textSelectionEnabled,this.imageToolsEnabled,this.generatedImageWatermarkRemovalEnabled)}updateTextSelectionBlacklist(e){this.textSelectionBlacklist=e||"",this.view.setTextSelectionBlacklist(this.textSelectionBlacklist)}updateCustomSelectionTools(e){this.customSelectionTools=$(e),this.view.setCustomSelectionTools(this.customSelectionTools)}updateImageTools(e){this.imageToolsEnabled=e,this.view.setToggles(this.textSelectionEnabled,this.imageToolsEnabled,this.generatedImageWatermarkRemovalEnabled)}updateGeneratedImageWatermarkRemoval(e){this.generatedImageWatermarkRemovalEnabled=e!==!1,this.view.setToggles(this.textSelectionEnabled,this.imageToolsEnabled,this.generatedImageWatermarkRemovalEnabled)}updateConnectionSettings(e){this.connectionData={...this.connectionData,...e},this.connectionData.provider||(e.useOfficialApi===!0?this.connectionData.provider="official":this.connectionData.provider=P),this.view.setConnectionSettings(this.connectionData)}updateAppVersion(e){this.view&&this.view.setAppVersion(e)}updateSidePanelScope(e){this.sidePanelScope=e||R,this.view.setSidePanelScope(this.sidePanelScope)}updateContextSettings(e){this.contextSettings={mode:(e==null?void 0:e.mode)==="recent"?"recent":O,recentTurns:de(e==null?void 0:e.recentTurns)},this.view.setContextSettings(this.contextSettings)}updateMcpTestResult(e){if(!this.view||!this.view.connection||typeof this.view.connection.setMcpTestStatus!="function")return;if(e&&e.ok===!0){const s=typeof e.toolsCount=="number"?e.toolsCount:0;this.view.connection.setMcpTestStatus(_("mcpConnectedTools",{count:s}),!1);return}const i=e&&e.error?e.error:S("mcpConnectionFailed");this.view.connection.setMcpTestStatus(_("mcpFailed",{error:i}),!0)}updateMcpToolsResult(e){if(!(!this.view||!this.view.connection||typeof this.view.connection.setMcpToolsList!="function")){if(!e||e.ok!==!0){const i=e&&e.error?e.error:S("mcpFetchToolsFailed");this.view.connection.setMcpTestStatus(_("mcpFailed",{error:i}),!0);return}this.view.connection.setMcpToolsList(e.serverId||null,e.transport||"sse",e.url||"",Array.isArray(e.tools)?e.tools:[],e.requestKey||null)}}updateProviderModelsResult(e){if(!(!this.view||!this.view.connection||typeof this.view.connection.setProviderModelList!="function")){if(!e||e.ok!==!0){const i=e&&e.error?e.error:S("modelListFailed");this.view.connection.setProviderModelListStatus(_("mcpFailed",{error:i}),!0);return}this.view.connection.setProviderModelList(e.provider||null,Array.isArray(e.models)?e.models:[])}}updateSidebarBehavior(e){this.sidebarBehavior=e||"auto",this.view.setSidebarBehavior(this.sidebarBehavior)}updateAccountIndices(e){this.accountIndices=e||"0",this.view.setAccountIndices(this.accountIndices)}async refreshGithubMetadata(){if(!this.view.hasFetchedStars())try{const{stars:e,latestVersion:i}=await lt();if(e!=null&&this.view.displayStars(e),i){const s=this.view.getCurrentVersion()||"v0.0.0",o=ct(i,s)>0;this.view.displayUpdateStatus(i,s,o)}}catch(e){console.warn("GitHub fetch failed",e),this.view.displayStars(null)}}}export{Tt as S,b as T,Et as a,Ct as b,ft as c,bt as d,wt as e,_ as f,vt as g,St as h,At as r,B as s,S as t};
