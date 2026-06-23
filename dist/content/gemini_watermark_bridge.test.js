// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installBridge(storageResult = {}) {
    vi.resetModules();
    const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {});

    globalThis.chrome = {
        runtime: {
            lastError: null,
            sendMessage: vi.fn((message, callback) => {
                callback?.({
                    ok: true,
                    finalUrl: message.request?.url,
                    status: 200,
                    statusText: 'OK',
                    headers: { 'content-type': 'image/png' },
                    bytes: [1, 2, 3],
                });
            }),
        },
        storage: {
            local: {
                get: vi.fn((defaults, callback) => {
                    callback({ ...defaults, ...storageResult });
                }),
            },
        },
    };

    await import('./gemini_watermark_bridge.js');
    return { postMessageSpy };
}

function dispatchPageMessage(data) {
    window.dispatchEvent(
        new MessageEvent('message', {
            source: window,
            data,
        })
    );
}

describe('Gemini watermark isolated bridge', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        delete window.GeminiNexusGwrBridgeReady;
    });

    it('answers GWR state requests from the existing generated-image watermark setting', async () => {
        const { postMessageSpy } = await installBridge({
            geminiGeneratedImageWatermarkRemovalEnabled: false,
        });

        dispatchPageMessage({
            type: 'GWR_EXTENSION_STATE_REQUEST',
            requestId: 'state-1',
        });

        expect(chrome.storage.local.get).toHaveBeenCalledWith(
            { geminiGeneratedImageWatermarkRemovalEnabled: true },
            expect.any(Function)
        );
        expect(postMessageSpy).toHaveBeenCalledWith(
            {
                type: 'GWR_EXTENSION_STATE_RESPONSE',
                requestId: 'state-1',
                enabled: false,
            },
            '*'
        );
    });

    it('forwards GWR XHR requests to the background handler and posts the response', async () => {
        const { postMessageSpy } = await installBridge();

        dispatchPageMessage({
            type: 'GWR_EXTENSION_GM_XHR_REQUEST',
            requestId: 'xhr-1',
            request: {
                method: 'GET',
                url: 'https://lh3.googleusercontent.com/gg/sample=s0',
            },
        });

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
            {
                action: 'GWR_EXTENSION_GM_XHR_REQUEST',
                request: {
                    method: 'GET',
                    url: 'https://lh3.googleusercontent.com/gg/sample=s0',
                },
            },
            expect.any(Function)
        );
        expect(postMessageSpy).toHaveBeenCalledWith(
            {
                type: 'GWR_EXTENSION_GM_XHR_RESPONSE',
                requestId: 'xhr-1',
                response: {
                    ok: true,
                    finalUrl: 'https://lh3.googleusercontent.com/gg/sample=s0',
                    status: 200,
                    statusText: 'OK',
                    headers: { 'content-type': 'image/png' },
                    bytes: [1, 2, 3],
                },
            },
            '*'
        );
    });

    it('posts an error-shaped GWR XHR response when the runtime message has no listener', async () => {
        const { postMessageSpy } = await installBridge();
        chrome.runtime.sendMessage.mockImplementation((_message, callback) => {
            chrome.runtime.lastError = { message: 'No listener' };
            callback?.();
            chrome.runtime.lastError = null;
        });

        dispatchPageMessage({
            type: 'GWR_EXTENSION_GM_XHR_REQUEST',
            requestId: 'xhr-2',
            request: { url: 'https://lh3.googleusercontent.com/gg/sample=s0' },
        });

        expect(postMessageSpy).toHaveBeenCalledWith(
            {
                type: 'GWR_EXTENSION_GM_XHR_RESPONSE',
                requestId: 'xhr-2',
                response: {
                    ok: false,
                    status: 0,
                    statusText: '',
                    headers: {},
                    bytes: [],
                    error: 'No listener',
                },
            },
            '*'
        );
    });
});
