(function () {
    const DEFAULT_WEB_MODEL = '56fdd199312815e2';

    const WEB_MODEL_OPTIONS = Object.freeze(
        [
            { value: '56fdd199312815e2', label: '3.5 Flash' },
            { value: '8c46e95b1a07cecc', label: '3.1 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
        ].map((option) => Object.freeze(option))
    );

    const LEGACY_WEB_MODEL_ALIASES = Object.freeze({
        'gemini-2.5-flash': '8c46e95b1a07cecc',
        'gemini-3.1-flash-lite': '8c46e95b1a07cecc',
        'gemini-3-flash': '8c46e95b1a07cecc',
        'gemini-3.5-flash': '56fdd199312815e2',
        'gemini-3-flash-thinking': '56fdd199312815e2',
        'gemini-3.1-pro': 'e6fa609c3fa255c0',
        'gemini-3-pro': 'e6fa609c3fa255c0',
    });

    const WEB_MODEL_HEADER_CONFIGS = Object.freeze({
        '8c46e95b1a07cecc': Object.freeze({
            hash: '8c46e95b1a07cecc',
            mode: 6,
            fastThinkingLevel: 'minimal',
        }),
        '56fdd199312815e2': Object.freeze({
            hash: '56fdd199312815e2',
            mode: 1,
            fastThinkingLevel: 'minimal',
        }),
        e6fa609c3fa255c0: Object.freeze({
            hash: 'e6fa609c3fa255c0',
            mode: 3,
            fastThinkingLevel: 'low',
        }),
    });

    function normalizeWebModel(model) {
        const normalized = String(model || DEFAULT_WEB_MODEL).trim();
        return LEGACY_WEB_MODEL_ALIASES[normalized] || normalized;
    }

    function createWebModelOptions() {
        return WEB_MODEL_OPTIONS.map((option) => ({ ...option }));
    }

    function createWebModelOptionMarkup() {
        return WEB_MODEL_OPTIONS.map(
            (option) => `<option value="${option.value}">${option.label}</option>`
        ).join('');
    }

    function getWebModelHeaderConfig(model) {
        const normalized = normalizeWebModel(model);
        const config = WEB_MODEL_HEADER_CONFIGS[normalized];
        return config ? { ...config } : null;
    }

    function getSupportedWebModelValues() {
        return Object.keys(WEB_MODEL_HEADER_CONFIGS);
    }

    globalThis.GeminiNexusWebModelCatalog = Object.freeze({
        DEFAULT_WEB_MODEL,
        createWebModelOptions,
        createWebModelOptionMarkup,
        getSupportedWebModelValues,
        getWebModelHeaderConfig,
    });
})();
