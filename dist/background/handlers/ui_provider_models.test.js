import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleProviderModelList } from './ui_provider_models.js';

describe('handleProviderModelList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn(async () => ({
            ok: true,
            json: async () => ({
                data: [
                    { id: 'openai/gpt-5.2' },
                    { id: 'anthropic/claude-sonnet-4.5' },
                    { id: 'openai/gpt-5.2' },
                ],
            }),
        }));
    });

    it('fetches OpenRouter model ids from the provider model-list endpoint', async () => {
        const sendResponse = vi.fn();

        handleProviderModelList(
            {
                provider: 'openrouter',
                baseUrl: 'https://openrouter.ai/api/v1/',
                apiKey: 'openrouter-key',
            },
            sendResponse
        );

        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                action: 'PROVIDER_MODELS_RESULT',
                ok: true,
                provider: 'openrouter',
                models: ['openai/gpt-5.2', 'anthropic/claude-sonnet-4.5'],
                modelText: 'openai/gpt-5.2, anthropic/claude-sonnet-4.5',
            })
        );
        expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Title': 'Gemini Nexus',
                Authorization: 'Bearer openrouter-key',
            },
        });
    });

    it('returns a structured error for providers without a model-list endpoint', async () => {
        const sendResponse = vi.fn();

        handleProviderModelList({ provider: 'dashscope' }, sendResponse);

        await vi.waitFor(() =>
            expect(sendResponse).toHaveBeenCalledWith({
                action: 'PROVIDER_MODELS_RESULT',
                ok: false,
                provider: 'dashscope',
                models: [],
                modelText: '',
                error: 'Provider model list is not available.',
            })
        );
    });
});
