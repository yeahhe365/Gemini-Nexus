import { beforeEach, describe, expect, it, vi } from 'vitest';
import { keepAliveManager } from './keep_alive.js';

describe('KeepAliveManager alarm listener', () => {
    let storageData;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        keepAliveManager.lastRotation = Date.now();
        keepAliveManager.isRotating = false;
        keepAliveManager.consecutiveErrors = 0;
        storageData = {};

        const listeners = new Set();
        globalThis.chrome = {
            alarms: {
                get: vi.fn((name, callback) => callback({ name })),
                create: vi.fn(),
                onAlarm: {
                    hasListener: vi.fn((listener) => listeners.has(listener)),
                    addListener: vi.fn((listener) => listeners.add(listener)),
                },
            },
            storage: {
                local: {
                    get: vi.fn(async (keys) =>
                        Object.fromEntries(keys.map((key) => [key, storageData[key]]))
                    ),
                    set: vi.fn(async (values) => {
                        Object.assign(storageData, values);
                    }),
                    remove: vi.fn(async (keys) => {
                        for (const key of keys) delete storageData[key];
                    }),
                },
            },
        };
    });

    it('does not add duplicate alarm listeners across repeated init calls', () => {
        keepAliveManager.init();
        keepAliveManager.init();

        expect(chrome.alarms.onAlarm.addListener).toHaveBeenCalledTimes(1);
    });

    it('throttles rotation attempts using stored timestamps across restarts', async () => {
        const now = 1_700_000_000_000;
        storageData.geminiKeepAliveLastRotationAttempt = now - 1000;
        keepAliveManager.lastRotation = 0;
        vi.spyOn(Date, 'now').mockReturnValue(now);
        vi.stubGlobal('fetch', vi.fn());

        await keepAliveManager.performRotation();

        expect(fetch).not.toHaveBeenCalled();
    });

    it('stores failed rotation attempts so reloads do not immediately retry', async () => {
        const now = 1_700_000_000_000;
        keepAliveManager.lastRotation = 0;
        vi.spyOn(Date, 'now').mockReturnValue(now);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: false, status: 429 }))
        );

        await keepAliveManager.performRotation();

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(storageData.geminiKeepAliveLastRotationAttempt).toBe(now);
    });

    it('does not let expired context cleanup failures escape error handling', async () => {
        const storageError = new Error('Session storage unavailable');
        chrome.storage.local.remove.mockRejectedValueOnce(storageError);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
            await expect(keepAliveManager._handleError(401)).resolves.toBeUndefined();

            expect(chrome.storage.local.remove).toHaveBeenCalledWith(['geminiContext']);
            expect(warnSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Keep-Alive: Failed to clear expired context:',
                storageError
            );
        } finally {
            warnSpy.mockRestore();
        }
    });
});
