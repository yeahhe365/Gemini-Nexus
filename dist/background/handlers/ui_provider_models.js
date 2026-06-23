import { respondWithUiTask } from './ui_async.js';
import {
    getDedicatedApiHeaders,
    getDedicatedApiProviderConfig,
} from '../../shared/settings/dedicated_providers.js';
import { normalizeBaseUrl } from '../../services/providers/openai_payloads.js';

function getModelListUrl(providerConfig, baseUrl) {
    if (!baseUrl && providerConfig?.modelListUrl) return providerConfig.modelListUrl;

    const normalizedBaseUrl = normalizeBaseUrl(baseUrl || providerConfig?.defaultBaseUrl || '');
    if (normalizedBaseUrl) return `${normalizedBaseUrl}/models`;
    return '';
}

function extractModelIds(payload) {
    const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
    const modelIds = items
        .map((item) => (typeof item === 'string' ? item : item?.id))
        .map((modelId) => String(modelId || '').trim())
        .filter(Boolean);

    return [...new Set(modelIds)];
}

async function readErrorMessage(response) {
    try {
        const payload = await response.json();
        return payload?.error?.message || payload?.message || JSON.stringify(payload);
    } catch {
        try {
            return await response.text();
        } catch {
            return response.statusText || 'Unknown error';
        }
    }
}

export function handleProviderModelList(request, sendResponse) {
    const provider = String(request.provider || '').trim();

    respondWithUiTask(
        sendResponse,
        async () => {
            const providerConfig = getDedicatedApiProviderConfig(provider);
            if (!providerConfig?.modelListUrl) {
                throw new Error('Provider model list is not available.');
            }

            const url = getModelListUrl(providerConfig, request.baseUrl);
            if (!url) throw new Error('Model list URL is missing.');

            const headers = {
                Accept: 'application/json',
                ...getDedicatedApiHeaders(provider),
            };
            if (request.apiKey) {
                headers.Authorization = `Bearer ${request.apiKey}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                throw new Error(
                    `API Error (${response.status}): ${await readErrorMessage(response)}`
                );
            }

            const modelIds = extractModelIds(await response.json());
            if (modelIds.length === 0) {
                throw new Error('No models returned.');
            }

            return {
                action: 'PROVIDER_MODELS_RESULT',
                ok: true,
                provider,
                models: modelIds,
                modelText: modelIds.join(', '),
            };
        },
        {
            errorResponse: (error) => ({
                action: 'PROVIDER_MODELS_RESULT',
                ok: false,
                provider,
                models: [],
                modelText: '',
                error: error.message || String(error),
            }),
        }
    );
}
