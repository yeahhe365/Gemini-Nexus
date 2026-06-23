import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiSessionManager } from './session_manager.js';
import { getConnectionSettings } from './session/settings_store.js';

vi.mock('./session/settings_store.js', () => ({
    getConnectionSettings: vi.fn(),
}));

function createAbortError() {
    return Object.assign(new Error('aborted'), { name: 'AbortError' });
}

async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

describe('GeminiSessionManager cancellation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getConnectionSettings.mockResolvedValue({ provider: 'official' });
        globalThis.chrome = {
            i18n: {
                getUILanguage: vi.fn(() => 'en'),
            },
            storage: {
                local: {
                    remove: vi.fn(async () => {}),
                },
            },
        };
    });

    it('returns a cancellation reply when a request is aborted', async () => {
        const manager = new GeminiSessionManager();
        manager.dispatcher = {
            dispatch: vi.fn((request, settings, files, onUpdate, signal) => {
                return new Promise((resolve, reject) => {
                    signal.addEventListener('abort', () => reject(createAbortError()));
                });
            }),
        };

        const resultPromise = manager.handleSendPrompt(
            { text: 'first', sessionId: 'session-1' },
            vi.fn()
        );
        await vi.waitFor(() => expect(manager.dispatcher.dispatch).toHaveBeenCalledTimes(1));

        expect(manager.cancelCurrentRequest()).toBe(true);

        await expect(resultPromise).resolves.toEqual(
            expect.objectContaining({
                action: 'GEMINI_REPLY',
                sessionId: 'session-1',
                status: 'cancelled',
            })
        );
    });

    it('does not let an aborted request clear a newer request controller', async () => {
        const manager = new GeminiSessionManager();
        let secondResolve;
        manager.dispatcher = {
            dispatch: vi.fn((request, settings, files, onUpdate, signal) => {
                if (request.text === 'second') {
                    return new Promise((resolve, reject) => {
                        secondResolve = resolve;
                        signal.addEventListener('abort', () => reject(createAbortError()));
                    });
                }

                return new Promise((resolve, reject) => {
                    signal.addEventListener('abort', () => reject(createAbortError()));
                });
            }),
        };

        const firstPromise = manager.handleSendPrompt(
            { text: 'first', sessionId: 'session-1' },
            vi.fn()
        );
        await vi.waitFor(() => expect(manager.dispatcher.dispatch).toHaveBeenCalledTimes(1));

        const secondPromise = manager.handleSendPrompt(
            { text: 'second', sessionId: 'session-1' },
            vi.fn()
        );
        await vi.waitFor(() => expect(manager.dispatcher.dispatch).toHaveBeenCalledTimes(2));
        await firstPromise;
        await flushPromises();

        try {
            expect(manager.cancelCurrentRequest()).toBe(true);
        } finally {
            if (secondResolve) {
                secondResolve({
                    action: 'GEMINI_REPLY',
                    sessionId: 'session-1',
                    status: 'success',
                    text: 'second result',
                });
            }
            await secondPromise;
        }
    });

    it('clears stale Web auth context and prompts login when request tokens are unavailable', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        getConnectionSettings.mockResolvedValue({ provider: 'web' });
        const manager = new GeminiSessionManager();
        manager.ensureInitialized = vi.fn(async () => {});
        manager.auth = {
            forceContextRefresh: vi.fn(),
            getCurrentIndex: vi.fn(() => '0'),
        };
        manager.dispatcher = {
            dispatch: vi.fn(async () => {
                throw new Error('Missing Gemini Web auth token: blValue');
            }),
        };

        const result = await manager.handleSendPrompt(
            { text: 'hello', sessionId: 'session-web' },
            vi.fn()
        );

        expect(manager.auth.forceContextRefresh).toHaveBeenCalledTimes(1);
        expect(chrome.storage.local.remove).toHaveBeenCalledWith(['geminiContext']);
        expect(result).toEqual(
            expect.objectContaining({
                action: 'GEMINI_REPLY',
                sessionId: 'session-web',
                status: 'error',
                text: expect.stringContaining('Please log in'),
            })
        );
        expect(result.text).toContain('gemini.google.com/u/0/');
        expect(result.text).toContain('class="gemini-auth-link"');
        expect(result.text).not.toContain('style=');
    });

    it('keeps the Web auth login prompt when clearing stale context fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const storageError = new Error('Storage write failed');
        chrome.storage.local.remove.mockRejectedValueOnce(storageError);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        getConnectionSettings.mockResolvedValue({ provider: 'web' });
        const manager = new GeminiSessionManager();
        manager.ensureInitialized = vi.fn(async () => {});
        manager.auth = {
            forceContextRefresh: vi.fn(),
            getCurrentIndex: vi.fn(() => '1'),
        };
        manager.dispatcher = {
            dispatch: vi.fn(async () => {
                throw new Error('Missing Gemini Web auth token: fSid');
            }),
        };

        try {
            const result = await manager.handleSendPrompt(
                { text: 'hello', sessionId: 'session-web' },
                vi.fn()
            );

            expect(manager.auth.forceContextRefresh).toHaveBeenCalledTimes(1);
            expect(chrome.storage.local.remove).toHaveBeenCalledWith(['geminiContext']);
            expect(warnSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to clear stale Web auth context:',
                storageError
            );
            expect(result).toEqual(
                expect.objectContaining({
                    action: 'GEMINI_REPLY',
                    sessionId: 'session-web',
                    status: 'error',
                    text: expect.stringContaining('Please log in'),
                })
            );
            expect(result.text).toContain('gemini.google.com/u/1/');
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('passes request provider overrides to connection settings lookup', async () => {
        getConnectionSettings.mockResolvedValue({ provider: 'openai' });
        const manager = new GeminiSessionManager();
        manager.dispatcher = {
            dispatch: vi.fn(async () => ({
                action: 'GEMINI_REPLY',
                status: 'success',
                text: 'ok',
            })),
        };

        await manager.handleSendPrompt(
            {
                text: 'describe image',
                provider: 'openai',
                model: 'grok-4.3',
                files: [
                    {
                        base64: 'data:image/png;base64,AAAA',
                        type: 'image/png',
                        name: 'image.png',
                    },
                ],
            },
            vi.fn()
        );

        expect(getConnectionSettings).toHaveBeenCalledWith({ provider: 'openai' });
        expect(manager.dispatcher.dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: 'openai',
                model: 'grok-4.3',
            }),
            expect.objectContaining({ provider: 'openai' }),
            [
                {
                    base64: 'data:image/png;base64,AAAA',
                    type: 'image/png',
                    name: 'image.png',
                },
            ],
            expect.any(Function),
            expect.any(AbortSignal)
        );
    });
});
