import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidePanelScopeManager, getPanelPathForTab } from './sidepanel_scope_manager.js';

function setupChrome() {
    globalThis.chrome = {
        sidePanel: {
            setOptions: vi.fn(() => Promise.resolve()),
            open: vi.fn(() => Promise.resolve()),
        },
        storage: {
            session: {
                set: vi.fn(() => Promise.resolve()),
            },
        },
    };
}

describe('SidePanelScopeManager tab-scoped paths', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupChrome();
    });

    it('builds stable owner-tab side panel paths', () => {
        expect(getPanelPathForTab(123)).toBe('sidepanel/index.html?tabId=123');
        expect(getPanelPathForTab(null)).toBe('sidepanel/index.html');
        expect(getPanelPathForTab(-1)).toBe('sidepanel/index.html');
    });

    it('opens remembered-tab panels with the owner tab id in the path', async () => {
        const manager = new SidePanelScopeManager();

        await manager.openForTab(123, 456);

        expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
            tabId: 123,
            path: 'sidepanel/index.html?tabId=123',
            enabled: true,
        });
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 123, windowId: 456 });
        expect(manager.isOpenForTab(123)).toBe(true);
    });

    it('toggles an open remembered-tab panel closed and restores tab options', async () => {
        vi.useFakeTimers();
        const manager = new SidePanelScopeManager();

        await manager.openForTab(123, 456);
        chrome.sidePanel.setOptions.mockClear();

        const result = await manager.toggleForTab(123, 456);

        expect(result).toEqual({ status: 'closed' });
        expect(manager.isOpenForTab(123)).toBe(false);
        expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ tabId: 123, enabled: false });

        await vi.runAllTimersAsync();
        expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({
            tabId: 123,
            path: 'sidepanel/index.html?tabId=123',
            enabled: true,
        });
        vi.useRealTimers();
    });

    it('toggles a closed remembered-tab panel open', async () => {
        const manager = new SidePanelScopeManager();

        const result = await manager.toggleForTab(123, 456);

        expect(result).toEqual({ status: 'opened' });
        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 123, windowId: 456 });
    });

    it('continues opening remembered-tab panels when enabled-tab persistence fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.storage.session.set.mockRejectedValueOnce(new Error('Session storage unavailable'));
        const manager = new SidePanelScopeManager();

        await expect(manager.openForTab(123, 456)).resolves.toBeUndefined();

        expect(chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 123, windowId: 456 });
        expect(manager.isOpenForTab(123)).toBe(true);
        expect(warnSpy).toHaveBeenCalledWith(
            '[SidePanelScopeManager] Failed to persist remembered tab state:',
            expect.any(Error)
        );
        warnSpy.mockRestore();
    });

    it('starts opening remembered-tab panels without waiting for async setup', async () => {
        const calls = [];
        let resolveSetOptions;
        chrome.sidePanel.setOptions.mockImplementation((options) => {
            if (!options.tabId) {
                calls.push('disableDefault');
                return Promise.resolve();
            }

            calls.push('enableTab:start');
            return new Promise((resolve) => {
                resolveSetOptions = () => {
                    calls.push('enableTab:done');
                    resolve();
                };
            });
        });
        chrome.sidePanel.open.mockImplementation(() => {
            calls.push('open');
            return Promise.resolve();
        });

        const manager = new SidePanelScopeManager();
        const opening = manager.openForTab(123, 456);

        await Promise.resolve();
        expect(calls).toEqual(['disableDefault', 'enableTab:start', 'open']);

        resolveSetOptions();
        await opening;

        expect(calls).toEqual(['disableDefault', 'enableTab:start', 'open', 'enableTab:done']);
    });

    it('retries opening remembered-tab panels after tab options settle', async () => {
        const calls = [];
        let resolveSetOptions;
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.sidePanel.setOptions.mockImplementation((options) => {
            if (!options.tabId) {
                calls.push('disableDefault');
                return Promise.resolve();
            }

            calls.push('enableTab:start');
            return new Promise((resolve) => {
                resolveSetOptions = () => {
                    calls.push('enableTab:done');
                    resolve();
                };
            });
        });
        chrome.sidePanel.open
            .mockImplementationOnce(() => {
                calls.push('open:first');
                return Promise.reject(new Error('side panel is not enabled'));
            })
            .mockImplementationOnce(() => {
                calls.push('open:retry');
                return Promise.resolve();
            });

        const manager = new SidePanelScopeManager();
        const opening = manager.openForTab(123, 456);

        await Promise.resolve();
        expect(calls).toEqual(['disableDefault', 'enableTab:start', 'open:first']);

        resolveSetOptions();
        await opening;

        expect(calls).toEqual([
            'disableDefault',
            'enableTab:start',
            'open:first',
            'enableTab:done',
            'open:retry',
        ]);
        expect(chrome.sidePanel.open).toHaveBeenCalledTimes(2);
        expect(chrome.sidePanel.open).toHaveBeenNthCalledWith(1, { tabId: 123, windowId: 456 });
        expect(chrome.sidePanel.open).toHaveBeenNthCalledWith(2, { tabId: 123, windowId: 456 });
        expect(warnSpy).toHaveBeenCalledWith(
            '[SidePanelScopeManager] Retrying side panel open after options settled:',
            expect.any(Error)
        );
        warnSpy.mockRestore();
    });
});
