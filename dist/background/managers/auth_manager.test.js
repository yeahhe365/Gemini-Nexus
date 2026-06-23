import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRequestParams } from '../../services/auth.js';
import { AuthManager } from './auth_manager.js';

vi.mock('../../services/auth.js', () => ({
    fetchRequestParams: vi.fn(),
}));

describe('AuthManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.chrome = {
            storage: {
                local: {
                    get: vi.fn(async () => ({})),
                    set: vi.fn(async () => {}),
                    remove: vi.fn(async () => {}),
                },
            },
        };
    });

    it('refreshes cached Web context that predates current upload token fields', async () => {
        fetchRequestParams.mockResolvedValue({
            atValue: 'fresh-at',
            blValue: 'fresh-bl',
            fSid: 'fresh-fsid',
            locale: 'zh-CN',
            authUserIndex: '2',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        });

        const manager = new AuthManager();
        manager.currentContext = {
            atValue: 'cached-at',
            blValue: 'cached-bl',
            fSid: 'cached-fsid',
            locale: 'zh-CN',
            authUser: '2',
            contextIds: ['conversation', 'response', 'choice'],
        };
        manager.accountIndices = ['2'];

        await expect(manager.getOrFetchContext()).resolves.toEqual({
            atValue: 'fresh-at',
            blValue: 'fresh-bl',
            fSid: 'fresh-fsid',
            locale: 'zh-CN',
            authUser: '2',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        });
        expect(fetchRequestParams).toHaveBeenCalledWith('2');
    });

    it('refreshes cached Web context that is missing the current bl request token', async () => {
        fetchRequestParams.mockResolvedValue({
            atValue: 'fresh-at',
            blValue: 'fresh-bl',
            fSid: 'fresh-fsid',
            locale: 'zh-CN',
            authUserIndex: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        });

        const manager = new AuthManager();
        manager.currentContext = {
            atValue: 'cached-at',
            fSid: 'cached-fsid',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        };

        await expect(manager.getOrFetchContext()).resolves.toEqual({
            atValue: 'fresh-at',
            blValue: 'fresh-bl',
            fSid: 'fresh-fsid',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        });
        expect(fetchRequestParams).toHaveBeenCalledWith('0');
    });

    it('persists auth context without overwriting the selected model preference', async () => {
        const manager = new AuthManager();
        const context = {
            atValue: 'at-token',
            blValue: 'bl-token',
            fSid: 'fsid-token',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
            contextIds: ['stale-conversation', 'stale-response', 'stale-choice'],
        };
        const expectedContext = {
            atValue: 'at-token',
            blValue: 'bl-token',
            fSid: 'fsid-token',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        };

        await manager.updateContext(context, 'gemini-3-pro');

        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiContext: expectedContext,
        });
        expect(chrome.storage.local.set.mock.calls[0][0]).not.toHaveProperty('geminiModel');
        expect(manager.currentContext).toEqual(expectedContext);
    });

    it('continues account rotation when pointer persistence fails', async () => {
        chrome.storage.local.get.mockResolvedValueOnce({
            geminiAccountIndices: '0,1',
        });
        const storageError = new Error('Storage quota exceeded');
        chrome.storage.local.set.mockRejectedValueOnce(storageError);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const manager = new AuthManager();

        try {
            await expect(manager.rotateAccount()).resolves.toBe('1');

            expect(manager.currentAccountPointer).toBe(1);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ geminiAccountPointer: 1 });
            expect(warnSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to persist account rotation pointer:',
                storageError
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('continues account rotation with cached indices when storage refresh fails', async () => {
        const storageError = new Error('Storage read failed');
        chrome.storage.local.get.mockRejectedValueOnce(storageError);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const manager = new AuthManager();
        manager.accountIndices = ['0', '1'];

        try {
            await expect(manager.rotateAccount()).resolves.toBe('1');

            expect(manager.currentAccountPointer).toBe(1);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({ geminiAccountPointer: 1 });
            expect(warnSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to refresh account indices before rotation:',
                storageError
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('keeps refreshed Web auth context in memory when persistence fails', async () => {
        const storageError = new Error('Storage quota exceeded');
        chrome.storage.local.set.mockRejectedValueOnce(storageError);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const manager = new AuthManager();
        const context = {
            atValue: 'at-token',
            blValue: 'bl-token',
            fSid: 'fsid-token',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        };

        try {
            await expect(manager.updateContext(context)).resolves.toBeUndefined();

            expect(manager.currentContext).toEqual(context);
            expect(chrome.storage.local.set).toHaveBeenCalledWith({
                geminiContext: context,
            });
            expect(warnSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to persist Web auth context:',
                storageError
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('keeps Web auth context reset in memory when storage cleanup fails', async () => {
        const storageError = new Error('Storage cleanup failed');
        chrome.storage.local.remove.mockRejectedValueOnce(storageError);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const manager = new AuthManager();
        manager.currentContext = {
            atValue: 'at-token',
            blValue: 'bl-token',
            fSid: 'fsid-token',
            locale: 'zh-CN',
            authUser: '0',
            uploadPushId: 'feeds/upload-dynamic',
            uploadClientPctx: 'client-pctx-token',
        };

        try {
            await expect(manager.resetContext()).resolves.toBeUndefined();

            expect(manager.currentContext).toBeNull();
            expect(chrome.storage.local.remove).toHaveBeenCalledWith(['geminiContext']);
            expect(warnSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to clear Web auth context:',
                storageError
            );
        } finally {
            warnSpy.mockRestore();
        }
    });
});
