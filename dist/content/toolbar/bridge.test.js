// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('RendererBridge message origin', () => {
    const originalCrypto = globalThis.crypto;

    beforeEach(async () => {
        vi.resetModules();
        vi.useRealTimers();
        document.body.innerHTML = '';
        globalThis.GeminiNexusIds = {
            createPrefixedId: vi.fn((prefix) => `${prefix}_SHARED_ID`),
        };
        globalThis.chrome = {
            runtime: {
                getURL: vi.fn((path) => `chrome-extension://id/${path}`),
            },
        };
        await import('./bridge.js');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    async function startRenderRequest(bridge, host, text = 'safe') {
        const promise = bridge.render(text);
        const iframe = host.querySelector('iframe');
        iframe.dispatchEvent(new Event('load'));
        await Promise.resolve();
        await Promise.resolve();
        return {
            promise,
            iframeWindow: iframe.contentWindow,
            requestId: Object.keys(bridge.callbacksByRequestId)[0],
        };
    }

    it('does not add the sandbox iframe until rendering is requested', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        new window.GeminiRendererBridge(host);

        expect(host.querySelector('iframe')).toBeNull();
        expect(chrome.runtime.getURL).not.toHaveBeenCalled();
    });

    it('ignores render responses that do not come from its sandbox iframe', async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const bridge = new window.GeminiRendererBridge(host);
        const { promise, iframeWindow, requestId } = await startRenderRequest(bridge, host);

        expect(requestId).not.toBe('0');
        expect(requestId).toBe('req_SHARED_ID');

        window.dispatchEvent(
            new MessageEvent('message', {
                source: window,
                data: {
                    action: 'RENDER_RESULT',
                    reqId: requestId,
                    html: '<img src=x onerror=alert(1)>',
                    fetchTasks: [],
                },
            })
        );
        window.dispatchEvent(
            new MessageEvent('message', {
                source: iframeWindow,
                data: {
                    action: 'RENDER_RESULT',
                    reqId: requestId,
                    html: '<p>safe</p>',
                    fetchTasks: [],
                },
            })
        );

        await expect(promise).resolves.toEqual({ html: '<p>safe</p>', fetchTasks: [] });
    });

    it('removes the sandbox iframe after pending renderer work settles', async () => {
        vi.useFakeTimers();
        const host = document.createElement('div');
        document.body.appendChild(host);
        const bridge = new window.GeminiRendererBridge(host);
        const { promise, iframeWindow, requestId } = await startRenderRequest(bridge, host);

        window.dispatchEvent(
            new MessageEvent('message', {
                source: iframeWindow,
                data: {
                    action: 'RENDER_RESULT',
                    reqId: requestId,
                    html: '<p>safe</p>',
                    fetchTasks: [],
                },
            })
        );
        await expect(promise).resolves.toEqual({ html: '<p>safe</p>', fetchTasks: [] });

        expect(host.querySelector('iframe')).not.toBeNull();
        vi.advanceTimersByTime(250);
        expect(host.querySelector('iframe')).toBeNull();
    });

    it('keeps the sandbox iframe while another renderer request is pending', async () => {
        vi.useFakeTimers();
        let idCounter = 0;
        globalThis.GeminiNexusIds.createPrefixedId = vi.fn((prefix) => {
            idCounter += 1;
            return `${prefix}_${idCounter}`;
        });
        const host = document.createElement('div');
        document.body.appendChild(host);
        const bridge = new window.GeminiRendererBridge(host);
        const first = bridge.render('first');
        const second = bridge.render('second');
        const iframe = host.querySelector('iframe');
        iframe.dispatchEvent(new Event('load'));
        await Promise.resolve();
        await Promise.resolve();
        const iframeWindow = iframe.contentWindow;
        const [firstRequestId, secondRequestId] = Object.keys(bridge.callbacksByRequestId);

        window.dispatchEvent(
            new MessageEvent('message', {
                source: iframeWindow,
                data: {
                    action: 'RENDER_RESULT',
                    reqId: firstRequestId,
                    html: '<p>first</p>',
                    fetchTasks: [],
                },
            })
        );
        await expect(first).resolves.toEqual({ html: '<p>first</p>', fetchTasks: [] });

        vi.advanceTimersByTime(250);
        expect(host.querySelector('iframe')).not.toBeNull();

        window.dispatchEvent(
            new MessageEvent('message', {
                source: iframeWindow,
                data: {
                    action: 'RENDER_RESULT',
                    reqId: secondRequestId,
                    html: '<p>second</p>',
                    fetchTasks: [],
                },
            })
        );
        await expect(second).resolves.toEqual({ html: '<p>second</p>', fetchTasks: [] });

        vi.advanceTimersByTime(250);
        expect(host.querySelector('iframe')).toBeNull();
    });

    it('delegates request ID creation to the classic shared ID helper', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const bridge = new window.GeminiRendererBridge(host);

        expect(bridge.createRequestId()).toBe('req_SHARED_ID');
        expect(globalThis.GeminiNexusIds.createPrefixedId).toHaveBeenCalledWith('req');
    });

    it('keeps readable fallback request IDs without random helpers', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const bridge = new window.GeminiRendererBridge(host);
        delete globalThis.GeminiNexusIds;
        Object.defineProperty(globalThis, 'crypto', {
            value: {},
            configurable: true,
        });

        expect(bridge.createRequestId()).toBe('req_1');
        expect(bridge.createRequestId()).toBe('req_2');

        Object.defineProperty(globalThis, 'crypto', {
            value: originalCrypto,
            configurable: true,
        });
    });
});
