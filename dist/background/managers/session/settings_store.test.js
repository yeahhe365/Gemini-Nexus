import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getConnectionSettings } from './settings_store.js';

describe('getConnectionSettings', () => {
    let storedSettings;

    beforeEach(() => {
        storedSettings = {};
        globalThis.chrome = {
            storage: {
                local: {
                    get: vi.fn(async () => storedSettings),
                    set: vi.fn(async () => {}),
                },
            },
        };
    });

    afterEach(() => {
        delete globalThis.chrome;
        vi.restoreAllMocks();
    });

    it('rotates official API keys from the stored pointer and wraps to the first key', async () => {
        storedSettings = {
            geminiProvider: 'official',
            geminiApiKey: ' key-a, key-b, key-c ',
            geminiApiKeyPointer: 2,
        };

        const settings = await getConnectionSettings();

        expect(settings.apiKey).toBe('key-c');
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ geminiApiKeyPointer: 0 });
    });

    it('resets an out-of-bounds official API key pointer before advancing it', async () => {
        storedSettings = {
            geminiProvider: 'official',
            geminiApiKey: 'key-a,key-b',
            geminiApiKeyPointer: 9,
        };

        const settings = await getConnectionSettings();

        expect(settings.apiKey).toBe('key-a');
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ geminiApiKeyPointer: 1 });
    });

    it('continues with the selected official API key when pointer persistence fails', async () => {
        storedSettings = {
            geminiProvider: 'official',
            geminiApiKey: 'key-a,key-b',
            geminiApiKeyPointer: 0,
        };
        chrome.storage.local.set.mockRejectedValueOnce(new Error('Storage quota exceeded'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
            const settings = await getConnectionSettings();

            expect(settings.apiKey).toBe('key-a');
            expect(warnSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to persist Official API key rotation pointer:',
                expect.any(Error)
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('restores Gemini Web thinking level with a fast default', async () => {
        storedSettings = {
            geminiProvider: 'web',
            geminiWebThinkingLevel: 'minimal',
        };

        await expect(getConnectionSettings()).resolves.toEqual(
            expect.objectContaining({
                provider: 'web',
                webThinkingLevel: 'minimal',
            })
        );

        storedSettings = { geminiProvider: 'web' };
        await expect(getConnectionSettings()).resolves.toEqual(
            expect.objectContaining({
                webThinkingLevel: 'minimal',
            })
        );
    });

    it('restores the Gemini Web temporary chat switch', async () => {
        storedSettings = {
            geminiProvider: 'web',
            geminiWebTemporaryChat: true,
        };

        await expect(getConnectionSettings()).resolves.toEqual(
            expect.objectContaining({
                provider: 'web',
                webTemporaryChat: true,
            })
        );

        storedSettings = { geminiProvider: 'web' };
        await expect(getConnectionSettings()).resolves.toEqual(
            expect.objectContaining({
                webTemporaryChat: false,
            })
        );
    });

    it('lets routed toolbar requests override the stored provider for one request', async () => {
        storedSettings = {
            geminiProvider: 'web',
            geminiOpenaiBaseUrl: 'https://api.x.ai/v1',
            geminiOpenaiApiKey: 'xai-key',
            geminiOpenaiModel: 'grok-4.3',
        };

        await expect(getConnectionSettings({ provider: 'openai' })).resolves.toEqual(
            expect.objectContaining({
                provider: 'openai',
                openaiBaseUrl: 'https://api.x.ai/v1',
                openaiApiKey: 'xai-key',
                openaiModel: 'grok-4.3',
            })
        );
    });

    it('restores dedicated provider credentials and allows provider overrides', async () => {
        storedSettings = {
            geminiProvider: 'web',
            geminiDeepseekApiKey: 'deepseek-key',
            geminiDeepseekModel: 'deepseek-v4-pro',
            geminiDeepseekThinkingLevel: 'high',
        };

        await expect(getConnectionSettings({ provider: 'deepseek' })).resolves.toEqual(
            expect.objectContaining({
                provider: 'deepseek',
                dedicatedApiProviders: expect.objectContaining({
                    deepseek: expect.objectContaining({
                        apiKey: 'deepseek-key',
                        model: 'deepseek-v4-pro',
                        thinkingLevel: 'high',
                    }),
                }),
            })
        );
    });
});
