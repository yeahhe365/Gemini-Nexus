(function () {
    // Web model hashes verified against Gemini Web reverse catalogs (Gemi2Api-Server 2026-07-22
    // custom_models examples + free/Plus otAQ7b mode ids) and a live Gemini 3.7 Flash request
    // captured on 2026-08-22. Labels follow the public GA lineup.
    const DEFAULT_WEB_MODEL = 'fbb127bbb056c959';

    const WEB_MODEL_OPTIONS = Object.freeze(
        [
            { value: '56fdd199312815e2', label: '3.7 Flash' },
            { value: 'fbb127bbb056c959', label: '3.6 Flash' },
            { value: 'cf41b0e0dd7d53e5', label: '3.5 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
        ].map((option) => Object.freeze(option))
    );

    const LEGACY_WEB_MODEL_ALIASES = Object.freeze({
        'gemini-3.7-flash': '56fdd199312815e2',
        'gemini-3.6-flash': 'fbb127bbb056c959',
        'gemini-3-flash-thinking': 'fbb127bbb056c959',
        'gemini-3.5-flash-lite': 'cf41b0e0dd7d53e5',
        'gemini-3.1-pro': 'e6fa609c3fa255c0',
        'gemini-3-pro': 'e6fa609c3fa255c0',
    });

    const WEB_MODEL_HEADER_CONFIGS = Object.freeze({
        // Gemini 3.7 Flash: live Web request captured on 2026-08-22.
        '56fdd199312815e2': Object.freeze({
            hash: '56fdd199312815e2',
            // The live request uses different legacy and native mode fields.
            legacyMode: 2,
            mode: 1,
            capabilities: Object.freeze([4, 5, 6, 8, 4, 5, 6, 8]),
            fastThinkingLevel: 'minimal',
        }),
        // Current free-tier / GA Flash workhorse (Gemini 3.6 Flash).
        fbb127bbb056c959: Object.freeze({
            hash: 'fbb127bbb056c959',
            mode: 1,
            fastThinkingLevel: 'minimal',
        }),
        // Current free-tier / GA Flash-Lite (Gemini 3.5 Flash-Lite).
        cf41b0e0dd7d53e5: Object.freeze({
            hash: 'cf41b0e0dd7d53e5',
            mode: 6,
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
