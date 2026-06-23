import {
    DEFAULT_CONTEXT_MODE,
    DEFAULT_CONTEXT_RECENT_TURNS,
    DEFAULT_OFFICIAL_BASE_URL,
    DEFAULT_OFFICIAL_MODELS,
    DEFAULT_THINKING_LEVEL,
} from '../../../shared/config/constants.js';
import {
    getConnectionProvider,
    getOpenAIWebSearchStorageKeys,
    CONNECTION_STORAGE_KEYS,
} from '../../../shared/settings/connection.js';
import { normalizeWebThinkingLevel } from '../../../shared/models/web_thinking.js';
import { normalizeOpenAIWebSearchSettings } from '../../../shared/settings/openai.js';
import {
    createDedicatedApiSettingsPayload,
    isDedicatedApiProvider,
} from '../../../shared/settings/dedicated_providers.js';
import { debugLog } from '../../../shared/logging/debug.js';

function normalizeProviderOverride(provider) {
    const normalized = String(provider || '').trim();
    return normalized === 'web' ||
        normalized === 'official' ||
        normalized === 'openai' ||
        isDedicatedApiProvider(normalized)
        ? normalized
        : null;
}

export async function getConnectionSettings(options = {}) {
    const stored = await chrome.storage.local.get([
        ...CONNECTION_STORAGE_KEYS,
        'geminiApiKeyPointer',
        'geminiContextMode',
        'geminiContextRecentTurns',
    ]);

    const provider = normalizeProviderOverride(options.provider) || getConnectionProvider(stored);

    let activeApiKey = stored.geminiApiKey || '';

    if (provider === 'official' && activeApiKey.includes(',')) {
        const apiKeys = activeApiKey
            .split(',')
            .map((apiKey) => apiKey.trim())
            .filter((apiKey) => apiKey);

        if (apiKeys.length > 0) {
            let pointer = stored.geminiApiKeyPointer || 0;

            if (typeof pointer !== 'number' || pointer >= apiKeys.length || pointer < 0) {
                pointer = 0;
            }

            activeApiKey = apiKeys[pointer];

            const nextPointer = (pointer + 1) % apiKeys.length;
            try {
                await chrome.storage.local.set({ geminiApiKeyPointer: nextPointer });
            } catch (error) {
                console.warn(
                    '[Gemini Nexus] Failed to persist Official API key rotation pointer:',
                    error
                );
            }

            debugLog(`[Gemini Nexus] Rotating Official API Key (Index: ${pointer})`);
        }
    } else {
        activeApiKey = activeApiKey.trim();
    }

    const openaiSettings = normalizeOpenAIWebSearchSettings(
        stored,
        getOpenAIWebSearchStorageKeys()
    );

    return {
        provider: provider,
        webThinkingLevel: normalizeWebThinkingLevel(stored.geminiWebThinkingLevel),
        webTemporaryChat: stored.geminiWebTemporaryChat === true,
        officialBaseUrl: stored.geminiOfficialBaseUrl || DEFAULT_OFFICIAL_BASE_URL,
        apiKey: activeApiKey,
        officialModel: stored.geminiOfficialModel || DEFAULT_OFFICIAL_MODELS,
        thinkingLevel: stored.geminiThinkingLevel || DEFAULT_THINKING_LEVEL,
        officialWebSearch: stored.geminiOfficialWebSearch === true,
        openaiBaseUrl: stored.geminiOpenaiBaseUrl,
        openaiApiKey: stored.geminiOpenaiApiKey,
        openaiModel: stored.geminiOpenaiModel,
        openaiThinkingLevel: stored.geminiOpenaiThinkingLevel || DEFAULT_THINKING_LEVEL,
        openaiUseResponsesApi: openaiSettings.useResponsesApi,
        openaiWebSearch: openaiSettings.webSearch,
        dedicatedApiProviders: createDedicatedApiSettingsPayload(stored),
        contextMode: stored.geminiContextMode || DEFAULT_CONTEXT_MODE,
        contextRecentTurns: stored.geminiContextRecentTurns || DEFAULT_CONTEXT_RECENT_TURNS,
    };
}
