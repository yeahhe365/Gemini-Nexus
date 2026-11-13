(function () {
    // Web model hashes verified against the live Gemini Web mode picker and the
    // otAQ7b mode roster (2026-11-13), then replayed against StreamGenerate.
    // Labels follow the model names shown in the Gemini Web picker.
    const DEFAULT_WEB_MODEL = '56fdd199312815e2';

    const WEB_MODEL_OPTIONS = Object.freeze(
        [
            { value: '56fdd199312815e2', label: '4 Hydrogen' },
            { value: '8c46e95b1a07cecc', label: '3.5 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
            { value: 'argon', label: '4 Argon' },
        ].map((option) => Object.freeze(option))
    );

    const LEGACY_WEB_MODEL_ALIASES = Object.freeze({
        // Gemini 4 Hydrogen is the default and shares the old Flash hash.
        'gemini-4-hydrogen': '56fdd199312815e2',
        '4-hydrogen': '56fdd199312815e2',
        hydrogen: '56fdd199312815e2',
        'gemini-3.8-flash': '56fdd199312815e2',
        'gemini-3.7-flash': '56fdd199312815e2',
        // The picker now ships the Flash-Lite hash directly; the older hash still
        // resolves because Google keeps serving it for the same mode.
        'gemini-3.5-flash-lite': '8c46e95b1a07cecc',
        cf41b0e0dd7d53e5: '8c46e95b1a07cecc',
        'gemini-3.1-pro': 'e6fa609c3fa255c0',
        'gemini-3-pro': 'e6fa609c3fa255c0',
        'gemini-3.1-pro-preview': 'e6fa609c3fa255c0',
        // The picker ships 4 Argon under the symbolic mode id `argon`; the older
        // hash still routes here so saved selections keep working.
        'gemini-4-argon': 'argon',
        'gemini-4': 'argon',
        '4-argon': 'argon',
        '95a4c0abcba24364': 'argon',
        // Mode 8 is the top-tier slot: it resolves to 4 Argon on AI Pro accounts
        // and to 4 Carbon on AI Ultra accounts.
        'gemini-4-carbon': 'argon',
        '4-carbon': 'argon',
    });

    const WEB_MODEL_HEADER_CONFIGS = Object.freeze({
        // Gemini 4 Hydrogen: everyday help slot and the default Web model.
        '56fdd199312815e2': Object.freeze({
            hash: '56fdd199312815e2',
            // The live request uses different legacy and native mode fields.
            legacyMode: 2,
            mode: 1,
            capabilities: Object.freeze([4, 5, 6, 8, 4, 5, 6, 8]),
            fastThinkingLevel: 'low',
        }),
        // Gemini 3.5 Flash-Lite: quick answers slot.
        '8c46e95b1a07cecc': Object.freeze({
            hash: '8c46e95b1a07cecc',
            mode: 6,
            fastThinkingLevel: 'minimal',
        }),
        // Gemini 3.1 Pro: deep research slot.
        e6fa609c3fa255c0: Object.freeze({
            hash: 'e6fa609c3fa255c0',
            mode: 3,
            fastThinkingLevel: 'low',
        }),
        // Gemini 4 Argon: code and analysis slot (Ultra accounts get 4 Carbon).
        argon: Object.freeze({
            hash: 'argon',
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
        normalizeWebModel,
    });
})();
