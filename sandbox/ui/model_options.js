import {
    DEFAULT_OFFICIAL_MODEL,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_PROVIDER,
    DEFAULT_NOAUTH_MODEL,
    DEFAULT_NOAUTH_MODELS,
} from '../../shared/config/constants.js';
import {
    getDedicatedApiDefaultModel,
    getDedicatedApiRuntimeSettings,
    isDedicatedApiProvider,
} from '../../shared/settings/dedicated_providers.js';
import { createWebModelOptions } from '../../shared/models/web_models.js';
import { t } from '../core/i18n.js';

export function getModelProvider(settings) {
    return settings.provider || (settings.useOfficialApi === true ? 'official' : DEFAULT_PROVIDER);
}

function parseConfiguredModels(rawModels) {
    return String(rawModels || '')
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean);
}

export function createModelOptions(settings) {
    const provider = getModelProvider(settings);

    if (provider === 'official') {
        const models = parseConfiguredModels(settings.officialModel);
        return models.length > 0
            ? models.map((model) => ({ value: model, label: model }))
            : [{ value: DEFAULT_OFFICIAL_MODEL, label: DEFAULT_OFFICIAL_MODEL }];
    }

    if (provider === 'openai') {
        const models = parseConfiguredModels(settings.openaiModel);
        return models.length > 0
            ? models.map((model) => ({ value: model, label: model }))
            : [{ value: DEFAULT_OPENAI_MODEL, label: t('customModel') }];
    }

    if (isDedicatedApiProvider(provider)) {
        const providerSettings = getDedicatedApiRuntimeSettings(settings, provider);
        const models = parseConfiguredModels(providerSettings?.model);
        const fallback = getDedicatedApiDefaultModel(provider);
        return models.length > 0
            ? models.map((model) => ({ value: model, label: model }))
            : [{ value: fallback, label: fallback || t('customModel') }];
    }

    if (provider === 'gemini_noauth') {
        const models = parseConfiguredModels(DEFAULT_NOAUTH_MODELS);
        return models.length > 0
            ? models.map((model) => ({ value: model, label: model }))
            : [{ value: DEFAULT_NOAUTH_MODEL, label: DEFAULT_NOAUTH_MODEL }];
    }

    return createWebModelOptions();
}

export function getPreferredModel(settings, currentValue) {
    const provider = getModelProvider(settings);
    if (provider === 'openai') {
        return settings.openaiSelectedModel || settings.selectedModel || currentValue;
    }
    if (isDedicatedApiProvider(provider)) {
        const providerSettings = getDedicatedApiRuntimeSettings(settings, provider);
        return providerSettings?.selectedModel || settings.selectedModel || currentValue;
    }
    return settings.selectedModel || currentValue;
}
