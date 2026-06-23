import { describe, expect, it } from 'vitest';
import {
    createDedicatedApiChatPayload,
    createDedicatedApiSettingsPayload,
    createDedicatedApiStorageUpdate,
    getDedicatedApiReasoningEffort,
    getDedicatedApiSelectedModel,
    isDedicatedApiProvider,
} from './dedicated_providers.js';

describe('dedicated API provider settings', () => {
    it('recognizes dedicated providers and restores provider-specific settings', () => {
        expect(isDedicatedApiProvider('deepseek')).toBe(true);
        expect(isDedicatedApiProvider('openai')).toBe(false);

        expect(
            createDedicatedApiSettingsPayload({
                geminiDeepseekApiKey: 'deepseek-key',
                geminiDeepseekModel: 'deepseek-v4-pro, deepseek-chat',
                geminiDeepseekSelectedModel: 'deepseek-chat',
            }).deepseek
        ).toEqual(
            expect.objectContaining({
                provider: 'deepseek',
                baseUrl: 'https://api.deepseek.com',
                apiKey: 'deepseek-key',
                model: 'deepseek-v4-pro, deepseek-chat',
                selectedModel: 'deepseek-chat',
                providerRouting: '',
            })
        );
    });

    it('uses dedicated selected-model fallbacks before provider defaults', () => {
        expect(
            getDedicatedApiSelectedModel(
                {
                    geminiZhipuModel: 'glm-4.5, glm-4-plus',
                },
                'zhipu'
            )
        ).toBe('glm-4.5');
        expect(getDedicatedApiSelectedModel({}, 'anthropic')).toBe('claude-sonnet-4-5');
    });

    it('creates storage updates for all dedicated providers', () => {
        expect(
            createDedicatedApiStorageUpdate({
                anthropic: {
                    apiKey: 'anthropic-key',
                    model: 'claude-sonnet-4-5',
                    selectedModel: 'claude-sonnet-4-5',
                    thinkingLevel: 'medium',
                },
            })
        ).toEqual(
            expect.objectContaining({
                geminiAnthropicApiKey: 'anthropic-key',
                geminiAnthropicSelectedModel: 'claude-sonnet-4-5',
                geminiAnthropicThinkingLevel: 'medium',
                geminiOpenrouterProviderRouting: '',
            })
        );
    });

    it('creates OpenRouter reasoning and provider routing payloads', () => {
        expect(
            createDedicatedApiChatPayload('openrouter', {
                providerRouting: '{"order":["openai"],"allow_fallbacks":false}',
                thinkingLevel: 'high',
            })
        ).toEqual({
            reasoning: {
                effort: 'high',
                exclude: false,
            },
            provider: {
                order: ['openai'],
                allow_fallbacks: false,
            },
        });
        expect(getDedicatedApiReasoningEffort('openrouter', 'high')).toBeNull();
    });

    it('creates DashScope enable_thinking payloads from thinking settings', () => {
        expect(createDedicatedApiChatPayload('dashscope', { thinkingLevel: 'minimal' })).toEqual({
            enable_thinking: false,
            stream_options: {
                include_usage: true,
            },
        });
        expect(createDedicatedApiChatPayload('dashscope', { thinkingLevel: 'medium' })).toEqual({
            enable_thinking: true,
            stream_options: {
                include_usage: true,
            },
        });
        expect(getDedicatedApiReasoningEffort('dashscope', 'medium')).toBeNull();
    });

    it('rejects invalid OpenRouter provider routing JSON', () => {
        expect(() =>
            createDedicatedApiChatPayload('openrouter', {
                providerRouting: '[bad]',
                thinkingLevel: 'low',
            })
        ).toThrow(/valid JSON/);
    });
});
