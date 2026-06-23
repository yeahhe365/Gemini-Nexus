(function () {
    const DEFAULT_SHORTCUTS = Object.freeze({
        quickAsk: 'Alt+Q',
        openPanel: 'Alt+G',
        browserControl: 'Ctrl+B',
        ocrCapture: 'Alt+O',
    });
    const LEGACY_DEFAULT_SHORTCUTS = Object.freeze([
        Object.freeze({
            quickAsk: 'Ctrl+Q',
            openPanel: 'Alt+G',
            browserControl: 'Ctrl+B',
            ocrCapture: 'Alt+O',
        }),
        Object.freeze({
            quickAsk: 'Ctrl+G',
            openPanel: 'Alt+S',
            browserControl: 'Ctrl+B',
            ocrCapture: 'Alt+O',
        }),
    ]);
    const SHORTCUT_KEYS = Object.freeze(Object.keys(DEFAULT_SHORTCUTS));

    function isShortcutObject(shortcuts) {
        return shortcuts && typeof shortcuts === 'object' && !Array.isArray(shortcuts);
    }

    function isDefaultShortcutValue(key, value) {
        return (
            value === DEFAULT_SHORTCUTS[key] ||
            LEGACY_DEFAULT_SHORTCUTS.some((shortcuts) => value === shortcuts[key])
        );
    }

    function normalizeDefaultShortcutValue(key, value) {
        return isDefaultShortcutValue(key, value) ? DEFAULT_SHORTCUTS[key] : value;
    }

    function normalizeShortcutDefaults(shortcuts) {
        const stored = isShortcutObject(shortcuts) ? shortcuts : {};
        const usesOnlyDefaultValues = SHORTCUT_KEYS.every((key) => {
            if (!Object.prototype.hasOwnProperty.call(stored, key)) return true;
            return isDefaultShortcutValue(key, stored[key]);
        });
        const migrated = { ...stored };

        if (usesOnlyDefaultValues) {
            SHORTCUT_KEYS.forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(migrated, key)) {
                    migrated[key] = normalizeDefaultShortcutValue(key, migrated[key]);
                }
            });
        }

        return { ...DEFAULT_SHORTCUTS, ...migrated };
    }

    const CONTEXT_RECENT_TURNS_LIMITS = Object.freeze({
        MIN: 1,
        MAX: 50,
        DEFAULT: 10,
    });

    const DEDICATED_API_PROVIDERS = Object.freeze({
        openai_official: Object.freeze({
            id: 'openai_official',
            storagePrefix: 'OpenaiOfficial',
            defaultBaseUrl: 'https://api.openai.com/v1',
            defaultModels: 'gpt-5.1, gpt-5, gpt-4.1',
            defaultModel: 'gpt-5.1',
            transport: 'openai-responses',
            supportsWebSearch: true,
        }),
        deepseek: Object.freeze({
            id: 'deepseek',
            storagePrefix: 'Deepseek',
            defaultBaseUrl: 'https://api.deepseek.com',
            defaultModels: 'deepseek-v4-pro, deepseek-v4-flash, deepseek-reasoner, deepseek-chat',
            defaultModel: 'deepseek-v4-pro',
            transport: 'openai-chat',
            reasoningAdapter: 'reasoning_effort',
            supportsWebSearch: false,
        }),
        openrouter: Object.freeze({
            id: 'openrouter',
            storagePrefix: 'Openrouter',
            defaultBaseUrl: 'https://openrouter.ai/api/v1',
            defaultModels:
                'openai/gpt-5.2, anthropic/claude-sonnet-4.5, google/gemini-3-pro-preview, deepseek/deepseek-v3.2',
            defaultModel: 'openai/gpt-5.2',
            modelListUrl: 'https://openrouter.ai/api/v1/models',
            transport: 'openai-chat',
            reasoningAdapter: 'openrouter_reasoning',
            supportsProviderRouting: true,
            providerRoutingPlaceholder: '{"order":["openai","anthropic"],"allow_fallbacks":true}',
            headers: Object.freeze({
                'X-Title': 'Gemini Nexus',
            }),
            supportsWebSearch: false,
        }),
        dashscope: Object.freeze({
            id: 'dashscope',
            storagePrefix: 'Dashscope',
            defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            defaultModels:
                'qwen3.7-max, qwen3.6-plus, qwen-plus, qwen3-vl-plus, qwen-vl-max, qwq-plus',
            defaultModel: 'qwen3.7-max',
            transport: 'openai-chat',
            reasoningAdapter: 'dashscope_enable_thinking',
            supportsWebSearch: false,
        }),
        anthropic: Object.freeze({
            id: 'anthropic',
            storagePrefix: 'Anthropic',
            defaultBaseUrl: 'https://api.anthropic.com/v1',
            defaultModels: 'claude-sonnet-4-5, claude-opus-4-1, claude-haiku-4-5',
            defaultModel: 'claude-sonnet-4-5',
            transport: 'anthropic-messages',
            supportsWebSearch: false,
        }),
        zhipu: Object.freeze({
            id: 'zhipu',
            storagePrefix: 'Zhipu',
            defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            defaultModels: 'glm-4.6, glm-4.5, glm-4-plus',
            defaultModel: 'glm-4.6',
            transport: 'openai-chat',
            reasoningAdapter: 'zhipu_thinking',
            supportsWebSearch: false,
        }),
    });

    globalThis.GeminiNexusConfig = Object.freeze({
        DEFAULT_SHORTCUTS,
        normalizeShortcutDefaults,
        DEFAULT_PROVIDER: 'web',
        DEFAULT_STORED_GEMINI_MODEL: '56fdd199312815e2',
        DEFAULT_OFFICIAL_MODEL: 'gemini-3-flash-preview',
        DEFAULT_OFFICIAL_MODELS: 'gemini-3-flash-preview, gemini-3.1-pro-preview',
        DEFAULT_OFFICIAL_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
        DEFAULT_OPENAI_MODEL: 'openai_custom',
        DEFAULT_THINKING_LEVEL: 'low',
        DEFAULT_CONTEXT_MODE: 'summary',
        DEFAULT_CONTEXT_RECENT_TURNS: CONTEXT_RECENT_TURNS_LIMITS.DEFAULT,
        CONTEXT_RECENT_TURNS_LIMITS,
        DEFAULT_SIDE_PANEL_SCOPE: 'remembered_tabs',
        DEFAULT_MCP_TRANSPORT: 'streamable-http',
        DEFAULT_MCP_HTTP_URL: 'http://127.0.0.1:3006/mcp',
        DEFAULT_MCP_SSE_URL: 'http://127.0.0.1:3006/sse',
        DEFAULT_MCP_WS_URL: 'ws://127.0.0.1:3006/mcp',
        DEDICATED_API_PROVIDERS,
        DEDICATED_API_PROVIDER_IDS: Object.freeze(Object.keys(DEDICATED_API_PROVIDERS)),
    });
})();
