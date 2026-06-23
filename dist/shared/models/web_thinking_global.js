(function () {
    const catalog = globalThis.GeminiNexusWebModelCatalog;

    const DEFAULT_WEB_THINKING_LEVEL = 'minimal';
    const DEEP_WEB_THINKING_LEVEL = 'high';
    const WEB_THINKING_LEVELS = Object.freeze(['minimal', 'low', 'medium', 'high']);
    const WEB_NATIVE_THINKING_LEVELS = Object.freeze({
        STANDARD: 1,
        EXTENDED: 2,
        DEEP_THINK: 3,
    });

    function normalizeWebThinkingLevel(level, fallback = DEFAULT_WEB_THINKING_LEVEL) {
        const normalized = String(level || '')
            .trim()
            .toLowerCase();
        return WEB_THINKING_LEVELS.includes(normalized) ? normalized : fallback;
    }

    function supportsWebThinking(model) {
        return Boolean(catalog?.getWebModelHeaderConfig?.(model));
    }

    function getWebThinkingFastLevel(model) {
        const config = catalog?.getWebModelHeaderConfig?.(model);
        return normalizeWebThinkingLevel(config?.fastThinkingLevel, 'low');
    }

    function normalizeWebThinkingLevelForModel(
        model,
        level,
        fallback = DEFAULT_WEB_THINKING_LEVEL
    ) {
        const normalized = normalizeWebThinkingLevel(level, fallback);
        if (normalized === 'minimal' && getWebThinkingFastLevel(model) !== 'minimal') {
            return 'low';
        }
        return normalized;
    }

    function getNextWebThinkingLevel(model, currentLevel) {
        const normalized = normalizeWebThinkingLevelForModel(model, currentLevel);
        const fastLevel = getWebThinkingFastLevel(model);
        return normalized === fastLevel ? DEEP_WEB_THINKING_LEVEL : fastLevel;
    }

    function getWebNativeThinkingLevel(model, level) {
        const normalized = normalizeWebThinkingLevelForModel(model, level);
        if (normalized === 'minimal' || normalized === 'low') {
            return WEB_NATIVE_THINKING_LEVELS.STANDARD;
        }
        return WEB_NATIVE_THINKING_LEVELS.EXTENDED;
    }

    globalThis.GeminiNexusWebThinking = Object.freeze({
        DEFAULT_WEB_THINKING_LEVEL,
        WEB_THINKING_LEVELS,
        WEB_NATIVE_THINKING_LEVELS,
        normalizeWebThinkingLevel,
        supportsWebThinking,
        getWebThinkingFastLevel,
        normalizeWebThinkingLevelForModel,
        getNextWebThinkingLevel,
        getWebNativeThinkingLevel,
    });
})();
