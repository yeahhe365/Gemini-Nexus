(function () {
    // Web model hashes verified against Gemini Web reverse catalogs and live Gemini Web requests.
    // Labels follow the public GA lineup.
    const DEFAULT_WEB_MODEL = '56fdd199312815e2';

    const WEB_MODEL_OPTIONS = Object.freeze(
        [
            // Gemini Web now labels this Lite tier as 3.5 Flash-Lite. The
            // underlying Web model hash and request contract are unchanged.
            { value: '8c46e95b1a07cecc', label: '3.5 Flash-Lite' },
            { value: '56fdd199312815e2', label: '3.8 Flash' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
            { value: '95a4c0abcba24364', label: '4 Argon' },
        ].map((option) => Object.freeze(option))
    );

    const LEGACY_WEB_MODEL_ALIASES = Object.freeze({
        'gemini-2.5-flash': '8c46e95b1a07cecc',
        'gemini-3.1-flash-lite': '8c46e95b1a07cecc',
        'gemini-3.5-flash-lite': '8c46e95b1a07cecc',
        'gemini-3-flash': '8c46e95b1a07cecc',
        'gemini-3.8-flash': '56fdd199312815e2',
        'gemini-3.7-flash': '56fdd199312815e2',
        'gemini-3.5-flash': '56fdd199312815e2',
        'gemini-3-flash-thinking': '56fdd199312815e2',
        'gemini-3.1-pro': 'e6fa609c3fa255c0',
        'gemini-3-pro': 'e6fa609c3fa255c0',
        'gemini-4-argon': '95a4c0abcba24364',
    });

    const WEB_MODEL_HEADER_CONFIGS = Object.freeze({
        '8c46e95b1a07cecc': Object.freeze({
            hash: '8c46e95b1a07cecc',
            mode: 6,
            fastThinkingLevel: 'minimal',
        }),
        // Gemini 3.8 Flash: GA Flash lineup on Gemini Web.
        '56fdd199312815e2': Object.freeze({
            hash: '56fdd199312815e2',
            // The live request uses different legacy and native mode fields.
            legacyMode: 2,
            mode: 1,
            capabilities: Object.freeze([4, 5, 6, 8, 4, 5, 6, 8]),
            fastThinkingLevel: 'minimal',
        }),
        e6fa609c3fa255c0: Object.freeze({
            hash: 'e6fa609c3fa255c0',
            mode: 3,
            fastThinkingLevel: 'low',
        }),
        // 4 Argon is selected by mode 8 in header index 14. The otAQ7b menu
        // hash is still sent; index 11 stays 1, matching captured Web requests.
        '95a4c0abcba24364': Object.freeze({
            hash: '95a4c0abcba24364',
            legacyMode: 1,
            mode: 8,
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
