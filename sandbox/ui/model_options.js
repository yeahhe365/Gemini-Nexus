import {
    DEFAULT_OFFICIAL_MODEL,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_PROVIDER,
} from '../../shared/config/constants.js';
import {
    getDedicatedApiDefaultModel,
    getDedicatedApiRuntimeSettings,
    isDedicatedApiProvider,
} from '../../shared/settings/dedicated_providers.js';
import { createWebModelOptions, normalizeWebModel } from '../../shared/models/web_models.js';
import { t } from '../core/i18n.js';

function getModelProvider(settings) {
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
    if (provider === DEFAULT_PROVIDER) {
        // Saved Web selections can still hold a retired hash; resolve it to the
        // catalog value so the picker does not silently fall back to the default.
        return normalizeWebModel(settings.selectedModel || currentValue);
    }
    return settings.selectedModel || currentValue;
}
