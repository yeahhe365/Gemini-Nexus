import {
    DEDICATED_API_PROVIDER_IDS,
    DEDICATED_API_PROVIDERS,
    DEFAULT_THINKING_LEVEL,
} from '../config/constants.js';

const STORAGE_SUFFIXES = Object.freeze({
    baseUrl: 'BaseUrl',
    apiKey: 'ApiKey',
    model: 'Model',
    selectedModel: 'SelectedModel',
    thinkingLevel: 'ThinkingLevel',
    webSearch: 'WebSearch',
    providerRouting: 'ProviderRouting',
});

function parseConfiguredModels(rawModels) {
    return String(rawModels || '')
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean);
}

function getProviderConfig(provider) {
    return DEDICATED_API_PROVIDERS?.[provider] || null;
}

function mergePlainObject(target, source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
    return Object.assign(target, source);
}

function parseProviderRouting(provider, rawRouting) {
    const value = String(rawRouting || '').trim();
    if (!value) return null;

    let parsed;
    try {
        parsed = JSON.parse(value);
    } catch {
        throw new Error(`${provider} provider routing must be valid JSON.`);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`${provider} provider routing must be a JSON object.`);
    }

    return parsed;
}

function getOpenRouterReasoningPayload(thinkingLevel = DEFAULT_THINKING_LEVEL) {
    const effort = String(thinkingLevel || DEFAULT_THINKING_LEVEL).trim() || DEFAULT_THINKING_LEVEL;
    return {
        reasoning: {
            effort,
            exclude: false,
        },
    };
}

function getDashScopeThinkingPayload(thinkingLevel = DEFAULT_THINKING_LEVEL) {
    return {
        enable_thinking: thinkingLevel !== 'minimal',
        stream_options: {
            include_usage: true,
        },
    };
}

function getZhipuThinkingPayload(thinkingLevel = DEFAULT_THINKING_LEVEL) {
    if (thinkingLevel === 'minimal') {
        return { thinking: { type: 'disabled' } };
    }
    return { thinking: { type: 'enabled' } };
}

export function isDedicatedApiProvider(provider) {
    return Boolean(getProviderConfig(provider));
}

export function getDedicatedApiProviderConfig(provider) {
    return getProviderConfig(provider);
}

export function getDedicatedApiStorageKeys(provider) {
    const config = getProviderConfig(provider);
    if (!config) return null;

    return Object.fromEntries(
        Object.entries(STORAGE_SUFFIXES).map(([field, suffix]) => [
            field,
            `gemini${config.storagePrefix}${suffix}`,
        ])
    );
}

export const DEDICATED_API_STORAGE_KEYS = DEDICATED_API_PROVIDER_IDS.flatMap((provider) =>
    Object.values(getDedicatedApiStorageKeys(provider) || {})
);

export const DEDICATED_API_SECRET_STORAGE_KEYS = DEDICATED_API_PROVIDER_IDS.map(
    (provider) => getDedicatedApiStorageKeys(provider)?.apiKey
).filter(Boolean);

export function getDedicatedApiDefaultModel(provider) {
    const config = getProviderConfig(provider);
    if (!config) return '';
    return config.defaultModel || parseConfiguredModels(config.defaultModels)[0] || '';
}

export function getDedicatedApiSelectedModel(storageData = {}, provider) {
    const config = getProviderConfig(provider);
    const keys = getDedicatedApiStorageKeys(provider);
    if (!config || !keys) return '';

    const selected = storageData[keys.selectedModel];
    if (selected) return selected;

    const models = parseConfiguredModels(storageData[keys.model] || config.defaultModels);
    return models[0] || getDedicatedApiDefaultModel(provider);
}

export function createDedicatedApiProviderSettings(storageData = {}, provider) {
    const config = getProviderConfig(provider);
    const keys = getDedicatedApiStorageKeys(provider);
    if (!config || !keys) return null;

    return {
        provider,
        baseUrl: storageData[keys.baseUrl] || config.defaultBaseUrl,
        apiKey: storageData[keys.apiKey] || '',
        model: storageData[keys.model] || config.defaultModels,
        selectedModel: storageData[keys.selectedModel] || '',
        thinkingLevel: storageData[keys.thinkingLevel] || DEFAULT_THINKING_LEVEL,
        webSearch: storageData[keys.webSearch] === true,
        providerRouting: storageData[keys.providerRouting] || '',
    };
}

export function createDedicatedApiSettingsPayload(storageData = {}) {
    return Object.fromEntries(
        DEDICATED_API_PROVIDER_IDS.map((provider) => [
            provider,
            createDedicatedApiProviderSettings(storageData, provider),
        ])
    );
}

export function normalizeDedicatedApiSettingsPayload(settings = {}) {
    return Object.fromEntries(
        DEDICATED_API_PROVIDER_IDS.map((provider) => {
            const config = getProviderConfig(provider);
            const stored = settings?.[provider] || {};
            return [
                provider,
                {
                    provider,
                    baseUrl: stored.baseUrl || config.defaultBaseUrl,
                    apiKey: stored.apiKey || '',
                    model: stored.model || config.defaultModels,
                    selectedModel: stored.selectedModel || '',
                    thinkingLevel: stored.thinkingLevel || DEFAULT_THINKING_LEVEL,
                    webSearch: stored.webSearch === true,
                    providerRouting: stored.providerRouting || '',
                },
            ];
        })
    );
}

export function getDedicatedApiRuntimeSettings(settings = {}, provider = settings.provider) {
    const allSettings = normalizeDedicatedApiSettingsPayload(settings.dedicatedApiProviders || {});
    return allSettings[provider] || null;
}

export function createDedicatedApiStorageUpdate(settings = {}) {
    const update = {};
    const normalized = normalizeDedicatedApiSettingsPayload(settings);

    DEDICATED_API_PROVIDER_IDS.forEach((provider) => {
        const keys = getDedicatedApiStorageKeys(provider);
        const providerSettings = normalized[provider];
        if (!keys || !providerSettings) return;

        update[keys.baseUrl] = providerSettings.baseUrl || '';
        update[keys.apiKey] = providerSettings.apiKey || '';
        update[keys.model] = providerSettings.model || '';
        update[keys.selectedModel] = providerSettings.selectedModel || '';
        update[keys.thinkingLevel] = providerSettings.thinkingLevel || DEFAULT_THINKING_LEVEL;
        update[keys.webSearch] = providerSettings.webSearch === true;
        update[keys.providerRouting] = providerSettings.providerRouting || '';
    });

    return update;
}

export function getDedicatedApiHeaders(provider) {
    const headers = getProviderConfig(provider)?.headers;
    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return null;
    return { ...headers };
}

export function getDedicatedApiReasoningEffort(provider, thinkingLevel = DEFAULT_THINKING_LEVEL) {
    const config = getProviderConfig(provider);
    if (!config) return thinkingLevel;
    if (config.transport === 'openai-responses') return thinkingLevel;
    return config.reasoningAdapter === 'reasoning_effort' ? thinkingLevel : null;
}

export function createDedicatedApiChatPayload(
    provider,
    providerSettings = {},
    thinkingLevel = providerSettings.thinkingLevel || DEFAULT_THINKING_LEVEL
) {
    const config = getProviderConfig(provider);
    if (!config) return null;

    const payload = {};

    if (config.reasoningAdapter === 'openrouter_reasoning') {
        mergePlainObject(payload, getOpenRouterReasoningPayload(thinkingLevel));
    } else if (config.reasoningAdapter === 'dashscope_enable_thinking') {
        mergePlainObject(payload, getDashScopeThinkingPayload(thinkingLevel));
    } else if (config.reasoningAdapter === 'zhipu_thinking') {
        mergePlainObject(payload, getZhipuThinkingPayload(thinkingLevel));
    }

    if (config.supportsProviderRouting === true) {
        const routing = parseProviderRouting(provider, providerSettings.providerRouting);
        if (routing) payload.provider = routing;
    }

    return Object.keys(payload).length > 0 ? payload : null;
}
