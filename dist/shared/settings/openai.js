const OPENAI_WEB_SEARCH_MODES = new Set(['off', 'responses', 'chat']);

function hasBoolean(settingsData, key) {
    if (!key) return false;
    return typeof settingsData?.[key] === 'boolean';
}

function isEnabled(settingsData, key) {
    if (!key) return false;
    return settingsData?.[key] === true;
}

export function normalizeOpenAIWebSearchSettings(settingsData, keys = {}) {
    const {
        useResponsesApiKey = 'openaiUseResponsesApi',
        webSearchKey = 'openaiWebSearch',
        webSearchModeKey = 'openaiWebSearchMode',
        fallbackUseResponsesApiKey = null,
        fallbackWebSearchKey = null,
        fallbackWebSearchModeKey = null,
    } = keys;

    const legacyMode = settingsData?.[webSearchModeKey] ?? settingsData?.[fallbackWebSearchModeKey];
    const hasUseResponsesSetting =
        hasBoolean(settingsData, useResponsesApiKey) ||
        hasBoolean(settingsData, fallbackUseResponsesApiKey);
    const hasWebSearchSetting =
        hasBoolean(settingsData, webSearchKey) || hasBoolean(settingsData, fallbackWebSearchKey);

    if (!hasUseResponsesSetting && OPENAI_WEB_SEARCH_MODES.has(legacyMode)) {
        return {
            useResponsesApi: legacyMode === 'responses',
            webSearch: legacyMode === 'responses' || legacyMode === 'chat',
        };
    }

    return {
        useResponsesApi:
            isEnabled(settingsData, useResponsesApiKey) ||
            isEnabled(settingsData, fallbackUseResponsesApiKey),
        webSearch: hasWebSearchSetting
            ? isEnabled(settingsData, webSearchKey) || isEnabled(settingsData, fallbackWebSearchKey)
            : false,
    };
}
