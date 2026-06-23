import { describe, expect, it } from 'vitest';
import { normalizeOpenAIWebSearchSettings } from './openai.js';

describe('OpenAI settings helpers', () => {
    it('normalizes legacy web-search mode settings', () => {
        expect(normalizeOpenAIWebSearchSettings({ openaiWebSearchMode: 'responses' })).toEqual({
            useResponsesApi: true,
            webSearch: true,
        });
        expect(normalizeOpenAIWebSearchSettings({ openaiWebSearchMode: 'chat' })).toEqual({
            useResponsesApi: false,
            webSearch: true,
        });
    });

    it('prefers explicit boolean settings over legacy mode strings', () => {
        expect(
            normalizeOpenAIWebSearchSettings({
                openaiUseResponsesApi: false,
                openaiWebSearch: true,
                openaiWebSearchMode: 'responses',
            })
        ).toEqual({
            useResponsesApi: false,
            webSearch: true,
        });
    });

    it('supports prefixed storage keys with fallback keys for bridge callers', () => {
        expect(
            normalizeOpenAIWebSearchSettings(
                {
                    geminiOpenaiUseResponsesApi: true,
                    openaiWebSearch: true,
                    openaiWebSearchMode: 'chat',
                },
                {
                    useResponsesApiKey: 'geminiOpenaiUseResponsesApi',
                    webSearchKey: 'geminiOpenaiWebSearch',
                    webSearchModeKey: 'geminiOpenaiWebSearchMode',
                    fallbackUseResponsesApiKey: 'openaiUseResponsesApi',
                    fallbackWebSearchKey: 'openaiWebSearch',
                    fallbackWebSearchModeKey: 'openaiWebSearchMode',
                }
            )
        ).toEqual({
            useResponsesApi: true,
            webSearch: true,
        });
    });
});
