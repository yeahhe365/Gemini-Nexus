import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendOfficialMessage } from '../../../services/providers/official.js';
import { sendOpenAIMessage } from '../../../services/providers/openai_compatible.js';
import { sendAnthropicMessage } from '../../../services/providers/anthropic.js';
import { sendWebMessage } from '../../../services/providers/web.js';
import { prepareManagedContext } from './context_manager.js';
import { getHistory } from './history_store.js';
import { RequestDispatcher } from './request_dispatcher.js';

vi.mock('../../../services/providers/official.js', () => ({
    sendOfficialMessage: vi.fn(),
}));

vi.mock('../../../services/providers/openai_compatible.js', () => ({
    sendOpenAIMessage: vi.fn(),
}));

vi.mock('../../../services/providers/anthropic.js', () => ({
    sendAnthropicMessage: vi.fn(),
}));

vi.mock('../../../services/providers/web.js', () => ({
    sendWebMessage: vi.fn(),
}));

vi.mock('./history_store.js', () => ({
    getHistory: vi.fn(async () => []),
}));

vi.mock('./context_manager.js', () => ({
    prepareManagedContext: vi.fn(async () => ({
        history: [],
        systemInstruction: 'system',
    })),
}));

describe('RequestDispatcher response mapping', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('preserves official provider response metadata in a Gemini reply', async () => {
        sendOfficialMessage.mockResolvedValue({
            text: 'official text',
            thoughts: 'official thoughts',
            sources: [{ url: 'https://example.test' }],
            images: ['image-a'],
            thoughtSignature: 'signature',
            officialContent: { role: 'model', parts: [] },
            functionCalls: [{ name: 'take_snapshot', args: {} }],
        });
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', model: 'gemini-test', sessionId: 'session-1' },
                {
                    provider: 'official',
                    apiKey: 'key',
                    officialBaseUrl: 'https://api.example.test',
                    officialModel: 'gemini-test',
                },
                [],
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-1',
            text: 'official text',
            thoughts: 'official thoughts',
            sources: [{ url: 'https://example.test' }],
            images: ['image-a'],
            status: 'success',
            context: null,
            thoughtSignature: 'signature',
            officialContent: { role: 'model', parts: [] },
            functionCalls: [{ name: 'take_snapshot', args: {} }],
        });
    });

    it('falls back to configured Official API models when a stale request model is invalid', async () => {
        sendOfficialMessage.mockResolvedValue({
            text: 'official text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', model: '56fdd199312815e2', sessionId: null },
            {
                provider: 'official',
                apiKey: 'key',
                officialBaseUrl: 'https://api.example.test',
                officialModel: 'gemini-3-flash-preview, gemini-3.1-pro-preview',
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOfficialMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                model: 'gemini-3-flash-preview',
                configuredModels: 'gemini-3-flash-preview, gemini-3.1-pro-preview',
            }),
            undefined,
            [],
            false,
            null,
            expect.any(Function)
        );
    });

    it('maps OpenAI provider responses into the common Gemini reply shape', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'openai text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', model: 'gpt-test', sessionId: null },
                {
                    provider: 'openai',
                    openaiBaseUrl: 'https://api.example.test',
                    openaiApiKey: 'key',
                    openaiModel: 'gpt-test',
                },
                [],
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: null,
            text: 'openai text',
            thoughts: null,
            sources: [],
            images: [],
            status: 'success',
            context: null,
        });
        expect(prepareManagedContext).toHaveBeenCalled();
    });

    it('passes OpenAI image quick-ask attachments through to the provider', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'openai image text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});
        const files = [
            {
                base64: 'data:application/octet-stream;base64,iVBORw0KGgoAAA',
                type: 'application/octet-stream',
                name: 'capture.bin',
            },
        ];

        await dispatcher.dispatch(
            { text: 'Describe this image', model: 'grok-4.3', sessionId: null },
            {
                provider: 'openai',
                openaiBaseUrl: 'https://api.x.ai/v1',
                openaiApiKey: 'key',
                openaiModel: 'grok-4.3',
            },
            files,
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'Describe this image',
            'system',
            [],
            expect.objectContaining({
                baseUrl: 'https://api.x.ai/v1',
                model: 'grok-4.3',
            }),
            files,
            null,
            expect.any(Function)
        );
    });

    it('falls back to configured OpenAI models when a stale request model is invalid', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'openai text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', model: '56fdd199312815e2', sessionId: null },
            {
                provider: 'openai',
                openaiBaseUrl: 'https://api.openai.com/v1',
                openaiApiKey: 'key',
                openaiModel: 'gpt-5.1, gpt-4o',
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                model: 'gpt-5.1',
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('does not send the OpenAI custom-model placeholder as a real model id', async () => {
        sendOpenAIMessage.mockImplementation(async (prompt, systemInstruction, history, config) => {
            if (!config.model) throw new Error('Model ID is missing.');
            return {
                text: 'openai text',
                thoughts: null,
                sources: [],
                images: [],
            };
        });
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', model: 'openai_custom', sessionId: null },
                {
                    provider: 'openai',
                    openaiBaseUrl: 'https://api.openai.com/v1',
                    openaiApiKey: 'key',
                    openaiModel: '',
                },
                [],
                vi.fn(),
                null
            )
        ).rejects.toThrow(/Model ID is missing/);

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                model: '',
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('allows OpenAI Chat Completions web search for official search models', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'openai text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', model: 'gpt-5-search-api', sessionId: null },
                {
                    provider: 'openai',
                    openaiBaseUrl: 'https://api.openai.com/v1',
                    openaiApiKey: 'key',
                    openaiModel: 'gpt-5-search-api',
                    openaiUseResponsesApi: false,
                    openaiWebSearch: true,
                },
                [],
                vi.fn(),
                null
            )
        ).resolves.toEqual(expect.objectContaining({ status: 'success' }));
    });

    it('rejects OpenAI Chat Completions web search for non-search official models', async () => {
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', model: 'gpt-5', sessionId: null },
                {
                    provider: 'openai',
                    openaiBaseUrl: 'https://api.openai.com/v1',
                    openaiApiKey: 'key',
                    openaiModel: 'gpt-5',
                    openaiUseResponsesApi: false,
                    openaiWebSearch: true,
                    openaiThinkingLevel: 'low',
                },
                [],
                vi.fn(),
                null
            )
        ).rejects.toThrow(/Chat Completions web search requires an OpenAI search model/);

        expect(sendOpenAIMessage).not.toHaveBeenCalled();
    });

    it('does not apply Chat Completions search-model restrictions to Responses API web search', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'openai text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', model: 'gpt-5', sessionId: null },
                {
                    provider: 'openai',
                    openaiBaseUrl: 'https://api.openai.com/v1',
                    openaiApiKey: 'key',
                    openaiModel: 'gpt-5',
                    openaiUseResponsesApi: true,
                    openaiWebSearch: true,
                    openaiThinkingLevel: 'low',
                },
                [],
                vi.fn(),
                null
            )
        ).resolves.toEqual(expect.objectContaining({ status: 'success' }));
    });

    it('routes the dedicated DeepSeek provider through Chat Completions with reasoning settings', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'deepseek text',
            thoughts: 'deepseek thoughts',
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', sessionId: null },
                {
                    provider: 'deepseek',
                    dedicatedApiProviders: {
                        deepseek: {
                            baseUrl: 'https://api.deepseek.com',
                            apiKey: 'deepseek-key',
                            model: 'deepseek-v4-pro',
                            thinkingLevel: 'high',
                        },
                    },
                },
                [],
                vi.fn(),
                null
            )
        ).resolves.toEqual(expect.objectContaining({ text: 'deepseek text' }));

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                baseUrl: 'https://api.deepseek.com',
                apiKey: 'deepseek-key',
                model: 'deepseek-v4-pro',
                reasoningEffort: 'high',
                useResponsesApi: false,
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('falls back to configured dedicated provider models when a stale request model is invalid', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'deepseek text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', model: 'gpt-5-from-previous-provider', sessionId: null },
            {
                provider: 'deepseek',
                dedicatedApiProviders: {
                    deepseek: {
                        baseUrl: 'https://api.deepseek.com',
                        apiKey: 'deepseek-key',
                        model: 'deepseek-v4-pro, deepseek-chat',
                        thinkingLevel: 'high',
                    },
                },
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                model: 'deepseek-v4-pro',
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('uses a dedicated provider selected model when the request model is stale', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'deepseek text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', model: 'gpt-5-from-previous-provider', sessionId: null },
            {
                provider: 'deepseek',
                dedicatedApiProviders: {
                    deepseek: {
                        baseUrl: 'https://api.deepseek.com',
                        apiKey: 'deepseek-key',
                        model: 'deepseek-v4-pro, deepseek-chat',
                        selectedModel: 'deepseek-chat',
                        thinkingLevel: 'high',
                    },
                },
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                model: 'deepseek-chat',
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('keeps an explicitly requested dedicated provider default model when it is configured', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'deepseek text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', model: 'deepseek-v4-pro', sessionId: null },
            {
                provider: 'deepseek',
                dedicatedApiProviders: {
                    deepseek: {
                        baseUrl: 'https://api.deepseek.com',
                        apiKey: 'deepseek-key',
                        model: 'deepseek-chat, deepseek-v4-pro',
                        thinkingLevel: 'high',
                    },
                },
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                model: 'deepseek-v4-pro',
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('routes OpenRouter with provider routing and native reasoning payloads', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'openrouter text',
            thoughts: 'openrouter thoughts',
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', model: 'anthropic/claude-sonnet-4.5', sessionId: null },
            {
                provider: 'openrouter',
                dedicatedApiProviders: {
                    openrouter: {
                        baseUrl: 'https://openrouter.ai/api/v1',
                        apiKey: 'openrouter-key',
                        model: 'openai/gpt-5.2, anthropic/claude-sonnet-4.5',
                        thinkingLevel: 'medium',
                        providerRouting: '{"order":["anthropic"],"allow_fallbacks":false}',
                    },
                },
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                baseUrl: 'https://openrouter.ai/api/v1',
                apiKey: 'openrouter-key',
                model: 'anthropic/claude-sonnet-4.5',
                reasoningEffort: null,
                headers: { 'X-Title': 'Gemini Nexus' },
                chatPayload: {
                    reasoning: { effort: 'medium', exclude: false },
                    provider: { order: ['anthropic'], allow_fallbacks: false },
                },
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('routes DashScope through OpenAI-compatible Chat Completions with Qwen thinking controls', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'qwen text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', sessionId: null },
            {
                provider: 'dashscope',
                dedicatedApiProviders: {
                    dashscope: {
                        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                        apiKey: 'dashscope-key',
                        model: 'qwen3-vl-plus, qwen-plus',
                        thinkingLevel: 'minimal',
                    },
                },
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                apiKey: 'dashscope-key',
                model: 'qwen3-vl-plus',
                reasoningEffort: null,
                chatPayload: {
                    enable_thinking: false,
                    stream_options: { include_usage: true },
                },
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('routes the dedicated Anthropic provider through the Messages API adapter', async () => {
        sendAnthropicMessage.mockResolvedValue({
            text: 'claude text',
            thoughts: 'claude thoughts',
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await expect(
            dispatcher.dispatch(
                { text: 'hello', sessionId: null },
                {
                    provider: 'anthropic',
                    dedicatedApiProviders: {
                        anthropic: {
                            baseUrl: 'https://api.anthropic.com/v1',
                            apiKey: 'anthropic-key',
                            model: 'claude-sonnet-4-5',
                            thinkingLevel: 'medium',
                        },
                    },
                },
                [],
                vi.fn(),
                null
            )
        ).resolves.toEqual(expect.objectContaining({ text: 'claude text' }));

        expect(sendAnthropicMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                baseUrl: 'https://api.anthropic.com/v1',
                apiKey: 'anthropic-key',
                model: 'claude-sonnet-4-5',
                thinkingLevel: 'medium',
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('routes the dedicated OpenAI official provider through Responses API', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'openai official text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', model: 'gpt-5.1', sessionId: null },
            {
                provider: 'openai_official',
                dedicatedApiProviders: {
                    openai_official: {
                        baseUrl: 'https://api.openai.com/v1',
                        apiKey: 'openai-key',
                        model: 'gpt-5.1',
                        thinkingLevel: 'medium',
                        webSearch: true,
                    },
                },
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                baseUrl: 'https://api.openai.com/v1',
                apiKey: 'openai-key',
                model: 'gpt-5.1',
                useResponsesApi: true,
                webSearch: true,
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('adds native Zhipu thinking controls for the dedicated Zhipu provider', async () => {
        sendOpenAIMessage.mockResolvedValue({
            text: 'zhipu text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            { text: 'hello', sessionId: null },
            {
                provider: 'zhipu',
                dedicatedApiProviders: {
                    zhipu: {
                        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                        apiKey: 'zhipu-key',
                        model: 'glm-4.5',
                        thinkingLevel: 'high',
                    },
                },
            },
            [],
            vi.fn(),
            null
        );

        expect(sendOpenAIMessage).toHaveBeenCalledWith(
            'hello',
            'system',
            [],
            expect.objectContaining({
                baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                apiKey: 'zhipu-key',
                model: 'glm-4.5',
                chatPayload: { thinking: { type: 'enabled' } },
            }),
            [],
            null,
            expect.any(Function)
        );
    });

    it('maps web provider responses without persisting Web auth context into chat history', async () => {
        sendWebMessage.mockResolvedValue({
            text: 'web text',
            thoughts: 'web thoughts',
            images: ['image-b'],
            newContext: {
                atValue: 'at-token',
                uploadPushId: 'feeds/upload-dynamic',
                uploadClientPctx: 'client-pctx-token',
            },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ['old context']),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        await expect(
            dispatcher.dispatch(
                { text: 'hello', model: 'gemini-web', sessionId: 'session-web' },
                { provider: 'web' },
                [],
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-web',
            text: 'web text',
            thoughts: 'web thoughts',
            sources: [],
            images: ['image-b'],
            status: 'success',
            context: null,
        });
    });

    it('drops Gemini Web image echoes when the current request includes image attachments', async () => {
        const echoedInputImage = { url: 'https://lh3.googleusercontent.com/uploaded-input' };
        sendWebMessage.mockResolvedValue({
            text: 'web text',
            thoughts: null,
            images: [echoedInputImage],
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);
        const files = [
            {
                name: 'image.png',
                type: 'image/png',
                base64: 'data:image/png;base64,AAAA',
            },
        ];

        await expect(
            dispatcher.dispatch(
                { text: 'what is this?', model: 'gemini-web', sessionId: 'session-web' },
                { provider: 'web' },
                files,
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-web',
            text: 'web text',
            thoughts: null,
            sources: [],
            images: [],
            status: 'success',
            context: null,
        });

        expect(sendWebMessage).toHaveBeenCalledWith(
            'what is this?',
            expect.any(Object),
            'gemini-web',
            files,
            null,
            expect.any(Function)
        );
    });

    it('keeps Gemini Web generated images for uploaded-image edit responses', async () => {
        const generatedImage = { url: 'https://lh3.googleusercontent.com/gg-dl/generated-edit' };
        sendWebMessage.mockResolvedValue({
            text: '',
            thoughts: null,
            images: [generatedImage],
            hasGeneratedImagePlaceholder: true,
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);
        const files = [
            {
                name: 'image.png',
                type: 'image/png',
                base64: 'data:image/png;base64,AAAA',
            },
        ];

        await expect(
            dispatcher.dispatch(
                { text: 'edit this image', model: 'gemini-web', sessionId: 'session-web' },
                { provider: 'web' },
                files,
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-web',
            text: '',
            thoughts: null,
            sources: [],
            images: [generatedImage],
            status: 'success',
            context: null,
        });
    });

    it('keeps generated Gemini Web edit images without placeholder text', async () => {
        const generatedImage = { url: 'https://lh3.googleusercontent.com/gg-dl/generated-edit' };
        const echoedInputImage = { url: 'https://lh3.googleusercontent.com/uploaded-input' };
        sendWebMessage.mockResolvedValue({
            text: '已完成修改。',
            thoughts: null,
            images: [generatedImage, echoedInputImage],
            hasGeneratedImagePlaceholder: false,
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);
        const files = [
            {
                name: 'image.png',
                type: 'image/png',
                base64: 'data:image/png;base64,AAAA',
            },
        ];

        await expect(
            dispatcher.dispatch(
                { text: '把这张图改成赛博朋克风格', model: 'gemini-web', sessionId: 'session-web' },
                { provider: 'web' },
                files,
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-web',
            text: '已完成修改。',
            thoughts: null,
            sources: [],
            images: [generatedImage],
            status: 'success',
            context: null,
        });
    });

    it('keeps toolbar image edit mode results even when Gemini omits generated URL hints', async () => {
        const generatedImage = { url: 'https://lh3.googleusercontent.com/generated-primary' };
        sendWebMessage.mockResolvedValue({
            text: '',
            thoughts: null,
            images: [generatedImage],
            hasGeneratedImagePlaceholder: false,
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);
        const files = [
            {
                name: 'image.png',
                type: 'image/png',
                base64: 'data:image/png;base64,AAAA',
            },
        ];

        await expect(
            dispatcher.dispatch(
                {
                    text: 'remove background',
                    model: 'gemini-web',
                    sessionId: 'session-web',
                    imageMode: 'remove_bg',
                },
                { provider: 'web' },
                files,
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-web',
            text: '',
            thoughts: null,
            sources: [],
            images: [generatedImage],
            status: 'success',
            context: null,
        });
    });

    it('keeps uploaded-image edit prompt results when Gemini returns a generic image URL', async () => {
        const generatedImage = { url: 'https://lh3.googleusercontent.com/generated-primary' };
        sendWebMessage.mockResolvedValue({
            text: '已按要求改好了。',
            thoughts: null,
            images: [generatedImage],
            hasGeneratedImagePlaceholder: false,
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);
        const files = [
            {
                name: 'image.png',
                type: 'image/png',
                base64: 'data:image/png;base64,AAAA',
            },
        ];

        await expect(
            dispatcher.dispatch(
                {
                    text: '把这张图改成赛博朋克风格',
                    model: 'gemini-web',
                    sessionId: 'session-web',
                },
                { provider: 'web' },
                files,
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-web',
            text: '已按要求改好了。',
            thoughts: null,
            sources: [],
            images: [generatedImage],
            status: 'success',
            context: null,
        });
    });

    it('keeps only the primary generic Gemini Web image for uploaded-image edit responses', async () => {
        const generatedImage = { url: 'https://lh3.googleusercontent.com/generated-primary' };
        const echoedInputImage = { url: 'https://lh3.googleusercontent.com/original-reference' };
        sendWebMessage.mockResolvedValue({
            text: '已完成修改。',
            thoughts: null,
            images: [generatedImage, echoedInputImage],
            hasGeneratedImagePlaceholder: false,
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);
        const files = [
            {
                name: 'image.png',
                type: 'image/png',
                base64: 'data:image/png;base64,AAAA',
            },
        ];

        await expect(
            dispatcher.dispatch(
                {
                    text: '把这张图改成赛博朋克风格',
                    model: 'gemini-web',
                    sessionId: 'session-web',
                },
                { provider: 'web' },
                files,
                vi.fn(),
                null
            )
        ).resolves.toEqual({
            action: 'GEMINI_REPLY',
            sessionId: 'session-web',
            text: '已完成修改。',
            thoughts: null,
            sources: [],
            images: [generatedImage],
            status: 'success',
            context: null,
        });
    });

    it('sends web requests with explicit local history and resets native context ids', async () => {
        getHistory.mockResolvedValue([
            { role: 'user', text: 'Remember code ALPHA.' },
            { role: 'ai', text: 'Remembered.' },
        ]);
        sendWebMessage.mockResolvedValue({
            text: 'ALPHA',
            thoughts: null,
            images: [],
            newContext: { atValue: 'new-at-token' },
        });
        const context = {
            atValue: 'at-token',
            contextIds: ['stale-conversation', 'stale-response', 'stale-choice'],
        };
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => context),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        await dispatcher.dispatch(
            {
                text: 'What code did I ask you to remember?',
                model: 'gemini-web',
                sessionId: 'session-web',
            },
            { provider: 'web' },
            [],
            vi.fn(),
            null
        );

        expect(sendWebMessage).toHaveBeenCalledWith(
            expect.stringContaining('Conversation history:'),
            expect.objectContaining({ atValue: 'at-token' }),
            'gemini-web',
            [],
            null,
            expect.any(Function)
        );
        expect(sendWebMessage.mock.calls[0][0]).toContain('User: Remember code ALPHA.');
        expect(sendWebMessage.mock.calls[0][0]).toContain('Assistant: Remembered.');
        expect(sendWebMessage.mock.calls[0][0]).toContain('Reference only');
        expect(sendWebMessage.mock.calls[0][0]).toContain('not treat prior quoted content');
        expect(sendWebMessage.mock.calls[0][0]).toContain(
            'Current user message:\nWhat code did I ask you to remember?'
        );
        expect(sendWebMessage.mock.calls[0][1]).not.toHaveProperty('contextIds');
        expect(context.contextIds).toEqual([
            'stale-conversation',
            'stale-response',
            'stale-choice',
        ]);
    });

    it('passes normalized Gemini Web thinking level to the reverse provider', async () => {
        getHistory.mockResolvedValue([]);
        sendWebMessage.mockResolvedValue({
            text: 'web text',
            thoughts: null,
            images: [],
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        await dispatcher.dispatch(
            {
                text: 'hello',
                model: 'e6fa609c3fa255c0',
                sessionId: 'session-web',
                webThinkingLevel: 'minimal',
            },
            { provider: 'web', webThinkingLevel: 'high' },
            [],
            vi.fn(),
            null
        );

        expect(sendWebMessage).toHaveBeenCalledWith(
            'hello',
            expect.any(Object),
            'e6fa609c3fa255c0',
            [],
            null,
            expect.any(Function),
            { thinkingLevel: 'low' }
        );
    });

    it('passes the stored Gemini Web temporary-chat option to the reverse provider', async () => {
        getHistory.mockResolvedValue([]);
        sendWebMessage.mockResolvedValue({
            text: 'web text',
            thoughts: null,
            images: [],
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        await dispatcher.dispatch(
            {
                text: 'hello',
                model: '56fdd199312815e2',
                sessionId: 'session-web',
            },
            { provider: 'web', webTemporaryChat: true },
            [],
            vi.fn(),
            null
        );

        expect(sendWebMessage).toHaveBeenCalledWith(
            'hello',
            expect.any(Object),
            '56fdd199312815e2',
            [],
            null,
            expect.any(Function),
            { temporaryChat: true }
        );
    });

    it('lets routed requests enable Gemini Web temporary chat for one request', async () => {
        getHistory.mockResolvedValue([]);
        sendWebMessage.mockResolvedValue({
            text: 'web text',
            thoughts: null,
            images: [],
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        await dispatcher.dispatch(
            {
                text: 'hello',
                model: '56fdd199312815e2',
                sessionId: 'session-web',
                webTemporaryChat: true,
            },
            { provider: 'web', webTemporaryChat: false },
            [],
            vi.fn(),
            null
        );

        expect(sendWebMessage).toHaveBeenCalledWith(
            'hello',
            expect.any(Object),
            '56fdd199312815e2',
            [],
            null,
            expect.any(Function),
            { temporaryChat: true }
        );
    });

    it('includes attachment-only history turns in Gemini Web local history prompts', async () => {
        getHistory.mockResolvedValue([
            {
                role: 'user',
                text: '用这张图生成变体',
                attachments: [
                    {
                        base64: 'data:image/png;base64,AAAA',
                        type: 'image/png',
                        name: 'image.png',
                    },
                    {
                        base64: 'data:application/pdf;base64,BBBB',
                        type: 'application/pdf',
                        name: 'spec.pdf',
                    },
                ],
            },
            {
                role: 'ai',
                text: '',
                generatedImages: [
                    { url: 'https://lh3.googleusercontent.com/generated-1' },
                    { url: 'https://lh3.googleusercontent.com/generated-2' },
                ],
            },
            {
                role: 'ai',
                text: '',
                sources: [{ url: 'https://example.test/source' }],
            },
        ]);
        sendWebMessage.mockResolvedValue({
            text: '可以继续',
            thoughts: null,
            images: [],
            newContext: { atValue: 'new-at-token' },
        });
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({ atValue: 'at-token' })),
            updateContext: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        await dispatcher.dispatch(
            {
                text: '继续',
                model: 'gemini-web',
                sessionId: 'session-web',
            },
            { provider: 'web' },
            [],
            vi.fn(),
            null
        );

        const prompt = sendWebMessage.mock.calls[0][0];
        expect(prompt).toContain(
            'User: 用这张图生成变体 [1 image attachment(s)] [1 file attachment(s)]'
        );
        expect(prompt).toContain('Assistant: [2 generated image(s)]');
        expect(prompt).toContain('Assistant: [1 source link(s)]');
        expect(prompt).toContain('Current user message:\n继续');
    });

    it('omits the current user history row when the current request has non-image attachments', async () => {
        getHistory.mockResolvedValue([
            {
                role: 'user',
                text: 'Review attached spec',
                attachments: [
                    {
                        base64: 'data:application/pdf;base64,BBBB',
                        type: 'application/pdf',
                        name: 'spec.pdf',
                    },
                ],
            },
        ]);
        sendOfficialMessage.mockResolvedValue({
            text: 'official text',
            thoughts: null,
            sources: [],
            images: [],
        });
        const dispatcher = new RequestDispatcher({});

        await dispatcher.dispatch(
            {
                text: 'Review attached spec',
                model: 'gemini-test',
                sessionId: 'session-1',
            },
            {
                provider: 'official',
                apiKey: 'key',
                officialBaseUrl: 'https://api.example.test',
                officialModel: 'gemini-test',
            },
            [
                {
                    base64: 'data:application/pdf;base64,BBBB',
                    type: 'application/pdf',
                    name: 'spec.pdf',
                },
            ],
            vi.fn(),
            null
        );

        expect(prepareManagedContext).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            [],
            null,
            expect.any(Function)
        );
    });

    it('refreshes Web auth context and retries when upload tokens are missing', async () => {
        vi.useFakeTimers();
        vi.spyOn(Math, 'random').mockReturnValue(0);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        getHistory.mockResolvedValue([]);
        sendWebMessage
            .mockRejectedValueOnce(
                new Error('Missing Gemini Web upload tokens. Refresh Gemini Web authentication.')
            )
            .mockResolvedValueOnce({
                text: 'uploaded',
                thoughts: null,
                images: [],
                newContext: { atValue: 'fresh-at-token' },
            });

        const staleContext = {
            atValue: 'stale-at-token',
            blValue: 'stale-bl-token',
            fSid: 'stale-fsid-token',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: null,
            uploadClientPctx: null,
        };
        const freshContext = {
            atValue: 'fresh-at-token',
            blValue: 'fresh-bl-token',
            fSid: 'fresh-fsid-token',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        };
        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi
                .fn()
                .mockResolvedValueOnce(staleContext)
                .mockResolvedValueOnce(freshContext),
            updateContext: vi.fn(),
            forceContextRefresh: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        const promise = dispatcher.dispatch(
            {
                text: '分析图片',
                model: 'gemini-web',
                sessionId: 'session-web',
            },
            { provider: 'web' },
            [{ name: 'image.png', base64: 'data:image/png;base64,AAAA' }],
            vi.fn(),
            null
        );

        await vi.waitFor(() => expect(sendWebMessage).toHaveBeenCalledTimes(1));
        await vi.advanceTimersByTimeAsync(2000);

        await expect(promise).resolves.toEqual(
            expect.objectContaining({
                action: 'GEMINI_REPLY',
                text: 'uploaded',
                status: 'success',
            })
        );
        expect(auth.forceContextRefresh).toHaveBeenCalledTimes(1);
        expect(auth.getOrFetchContext).toHaveBeenCalledTimes(2);
        expect(sendWebMessage.mock.calls[1][1]).toEqual(freshContext);
    });

    it('does not retry when Gemini Web request tokens are unavailable', async () => {
        getHistory.mockResolvedValue([]);
        sendWebMessage.mockRejectedValue(new Error('Missing Gemini Web auth token: blValue'));

        const auth = {
            accountIndices: [0],
            getOrFetchContext: vi.fn(async () => ({
                atValue: 'at-token',
                fSid: 'fsid-token',
                locale: 'zh-CN',
                authUser: '0',
                uploadPushId: 'feeds/upload-dynamic',
                uploadClientPctx: 'client-pctx-token',
            })),
            updateContext: vi.fn(),
            forceContextRefresh: vi.fn(),
        };
        const dispatcher = new RequestDispatcher(auth);

        await expect(
            dispatcher.dispatch(
                {
                    text: 'hello',
                    model: 'gemini-web',
                    sessionId: 'session-web',
                },
                { provider: 'web' },
                [],
                vi.fn(),
                null
            )
        ).rejects.toThrow('Missing Gemini Web auth token: blValue');

        expect(auth.getOrFetchContext).toHaveBeenCalledTimes(1);
        expect(auth.forceContextRefresh).not.toHaveBeenCalled();
        expect(sendWebMessage).toHaveBeenCalledTimes(1);
    });
});
