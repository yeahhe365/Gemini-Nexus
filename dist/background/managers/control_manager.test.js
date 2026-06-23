import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserControlManager, DEFAULT_BROWSER_CONTROL_START_URL } from './control_manager.js';

function setupChrome() {
    globalThis.chrome = {
        debugger: {
            onEvent: { addListener: vi.fn() },
            onDetach: { addListener: vi.fn() },
            attach: vi.fn((target, version, callback) => callback()),
            sendCommand: vi.fn((target, method, params, callback) => callback({})),
        },
        runtime: {
            sendMessage: vi.fn(() => Promise.resolve()),
        },
        tabs: {
            get: vi.fn(() =>
                Promise.resolve({
                    id: 42,
                    title: 'OpenAI News | OpenAI',
                    url: 'https://openai.com/news/',
                    active: true,
                    windowId: 1,
                })
            ),
            query: vi.fn(() =>
                Promise.resolve([
                    {
                        id: 42,
                        title: 'OpenAI News | OpenAI',
                        url: 'https://openai.com/news/',
                        active: true,
                        windowId: 1,
                    },
                ])
            ),
            create: vi.fn(() =>
                Promise.resolve({
                    id: 700,
                    title: 'Google Search',
                    url: DEFAULT_BROWSER_CONTROL_START_URL,
                    active: false,
                    windowId: 1,
                })
            ),
            onUpdated: { addListener: vi.fn() },
            onRemoved: { addListener: vi.fn() },
        },
        tabGroups: {
            update: vi.fn(() => Promise.resolve()),
        },
    };
}

describe('BrowserControlManager native tab group indicator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupChrome();
    });

    it('groups the controlled tab with a green task title', async () => {
        chrome.tabs.group = vi.fn(() => Promise.resolve(9));
        const manager = new BrowserControlManager();

        manager.setControlTaskTitle('Scroll OpenAI news');
        manager.setTargetTab(42);
        await Promise.resolve();
        await Promise.resolve();

        expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [42] });
        expect(chrome.tabGroups.update).toHaveBeenCalledWith(9, {
            title: 'Scroll OpenAI news',
            color: 'green',
            collapsed: false,
        });
    });

    it('ungroups the previously controlled tab when control stops', async () => {
        chrome.tabs.group = vi.fn(() => Promise.resolve(9));
        chrome.tabs.ungroup = vi.fn(() => Promise.resolve());
        const manager = new BrowserControlManager();

        manager.setTargetTab(42);
        await Promise.resolve();
        await Promise.resolve();

        manager.setTargetTab(null);
        await Promise.resolve();

        expect(chrome.tabs.ungroup).toHaveBeenCalledWith(42);
    });

    it('keeps previously controlled tabs in the same group when switching control targets', async () => {
        chrome.tabs.group = vi.fn(({ groupId, tabIds }) =>
            Promise.resolve(Number.isInteger(groupId) ? groupId : 9)
        );
        const manager = new BrowserControlManager();

        manager.setTargetTab(42);
        await Promise.resolve();
        await Promise.resolve();

        chrome.tabs.get = vi.fn(() =>
            Promise.resolve({
                id: 77,
                title: 'Second tab',
                url: 'https://second.test/',
                active: false,
            })
        );

        manager.setTargetTab(77);
        await Promise.resolve();
        await Promise.resolve();

        expect(chrome.tabs.group).toHaveBeenNthCalledWith(1, { tabIds: [42] });
        expect(chrome.tabs.group).toHaveBeenNthCalledWith(2, { groupId: 9, tabIds: [77] });
    });

    it('ignores stale async tab lookups after the control target changes', async () => {
        const pendingTabLookups = new Map();
        chrome.tabs.get = vi.fn(
            (tabId) =>
                new Promise((resolve) => {
                    pendingTabLookups.set(tabId, resolve);
                })
        );
        chrome.tabs.group = vi.fn(() => Promise.resolve(9));
        const manager = new BrowserControlManager();

        manager.setTargetTab(42);
        manager.setTargetTab(77);

        pendingTabLookups.get(77)({
            id: 77,
            title: 'Current tab',
            url: 'https://current.test/',
            active: true,
            windowId: 1,
        });
        await Promise.resolve();
        await Promise.resolve();

        pendingTabLookups.get(42)({
            id: 42,
            title: 'Stale tab',
            url: 'https://stale.test/',
            active: false,
            windowId: 1,
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(manager.lockedTabId).toBe(77);
        expect(manager.connection.targetTabId).toBe(77);
        expect(chrome.tabs.group).toHaveBeenCalledTimes(1);
        expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [77] });
        expect(chrome.tabs.group).not.toHaveBeenCalledWith({ groupId: 9, tabIds: [42] });
        expect(chrome.runtime.sendMessage).toHaveBeenLastCalledWith(
            expect.objectContaining({
                action: 'TAB_LOCKED',
                tab: expect.objectContaining({ id: 77 }),
            })
        );
    });

    it('does not fail when tab group APIs are unavailable', async () => {
        delete chrome.tabs.group;
        delete chrome.tabGroups;
        const manager = new BrowserControlManager();

        expect(() => manager.setTargetTab(42)).not.toThrow();
        await Promise.resolve();
    });

    it('creates a background Google search tab for standalone chat browser control', async () => {
        chrome.tabs.group = vi.fn(({ groupId }) => Promise.resolve(groupId ?? 9));
        chrome.tabs.get = vi.fn((tabId) =>
            Promise.resolve(
                tabId === 700
                    ? {
                          id: 700,
                          title: 'Google Search',
                          url: DEFAULT_BROWSER_CONTROL_START_URL,
                          active: false,
                          windowId: 1,
                      }
                    : {
                          id: 42,
                          title: 'Gemini Nexus',
                          url: 'chrome-extension://id/sidepanel/index.html',
                          active: true,
                          windowId: 1,
                      }
            )
        );
        const manager = new BrowserControlManager();

        const enabled = await manager.enableControl({ createDefaultTab: true });
        await Promise.resolve();
        await Promise.resolve();

        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: DEFAULT_BROWSER_CONTROL_START_URL,
            active: false,
            windowId: 1,
        });
        expect(enabled).toBe(true);
        expect(manager.getTargetTabId()).toBe(700);
        expect(manager.connection.currentTabId).toBe(700);
        expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [700] });
        expect(chrome.tabGroups.update).toHaveBeenCalledWith(9, {
            title: 'Browser control',
            color: 'green',
            collapsed: false,
        });
    });

    it('keeps normal browser control on the active webpage without creating a default tab', async () => {
        chrome.tabs.group = vi.fn(() => Promise.resolve(9));
        const manager = new BrowserControlManager();

        const enabled = await manager.enableControl();
        await Promise.resolve();
        await Promise.resolve();

        expect(enabled).toBe(true);
        expect(chrome.tabs.create).not.toHaveBeenCalled();
        expect(manager.getTargetTabId()).toBe(42);
        expect(chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [42] });
    });

    it('rejects switching control to a tab outside the controlled group', async () => {
        chrome.tabs.group = vi.fn(() => Promise.resolve(9));
        chrome.tabs.query = vi.fn(({ groupId }) => {
            if (groupId === 9) {
                return Promise.resolve([{ id: 42, title: 'Inside', url: 'https://inside.test/' }]);
            }
            return Promise.resolve([]);
        });
        const manager = new BrowserControlManager();
        manager.dispatcher.dispatch = vi.fn(() =>
            Promise.resolve({
                output: 'Selected outside',
                _meta: { switchTabId: 99 },
            })
        );
        manager.connection.attached = true;
        manager.connection.currentTabId = 42;
        manager.lockedTabId = 42;
        manager.controlGroupId = 9;

        const result = await manager.execute({ name: 'select_page', args: { index: 1 } });

        expect(result).toBe('Error: Target tab is outside the controlled tab group.');
        expect(manager.lockedTabId).toBe(42);
    });

    it('allows tool-created popup tabs to become the controlled target outside the current group', async () => {
        chrome.tabs.group = vi.fn(() => Promise.resolve(9));
        chrome.tabs.query = vi.fn(({ groupId }) => {
            if (groupId === 9) {
                return Promise.resolve([{ id: 42, title: 'Inside', url: 'https://inside.test/' }]);
            }
            return Promise.resolve([]);
        });
        const manager = new BrowserControlManager();
        manager.dispatcher.dispatch = vi.fn(() =>
            Promise.resolve({
                output: 'Created worker',
                _meta: { switchTabId: 99, allowOutsideControlledGroup: true },
            })
        );
        manager.connection.attached = true;
        manager.connection.currentTabId = 42;
        manager.lockedTabId = 42;
        manager.controlGroupId = 9;

        const result = await manager.execute({ name: 'new_page', args: { background: true } });

        expect(result).toBe('Created worker');
        expect(manager.lockedTabId).toBe(99);
    });

    it('clears the controlled target when a page-management tool closes the last page', async () => {
        const manager = new BrowserControlManager();
        manager.dispatcher.dispatch = vi.fn(() =>
            Promise.resolve({
                output: 'Closed page 0: Last tab. No controlled pages remain.',
                _meta: { clearTarget: true },
            })
        );
        manager.connection.attached = true;
        manager.connection.currentTabId = 42;
        manager.lockedTabId = 42;
        manager.connection.targetTabId = 42;

        const result = await manager.execute({ name: 'close_page', args: { index: 0 } });

        expect(result).toBe('Closed page 0: Last tab. No controlled pages remain.');
        expect(manager.lockedTabId).toBeNull();
        expect(manager.connection.targetTabId).toBeNull();
    });

    it('runs browser-control tool executions sequentially against the shared debugger session', async () => {
        const manager = new BrowserControlManager();
        manager.connection.attached = true;
        manager.connection.currentTabId = 42;
        manager.lockedTabId = 42;
        let releaseFirst;
        const executionOrder = [];
        manager.dispatcher.dispatch = vi.fn(async (name) => {
            executionOrder.push(`${name}:start`);
            if (name === 'click') {
                await new Promise((resolve) => {
                    releaseFirst = resolve;
                });
            }
            executionOrder.push(`${name}:end`);
            return `${name} done`;
        });
        manager.ensureConnection = vi.fn(() => Promise.resolve(true));

        const first = manager.execute({ name: 'click', args: { uid: '1_2' } });
        const second = manager.execute({ name: 'take_snapshot', args: {} });

        await vi.waitFor(() => expect(executionOrder).toEqual(['click:start']));

        releaseFirst();

        await expect(first).resolves.toBe('click done');
        await expect(second).resolves.toBe('take_snapshot done');
        expect(executionOrder).toEqual([
            'click:start',
            'click:end',
            'take_snapshot:start',
            'take_snapshot:end',
        ]);
    });

    it('runs page-management tools even when the current tab cannot attach a debugger', async () => {
        const manager = new BrowserControlManager();
        manager.ensureConnection = vi.fn(() => Promise.resolve(false));
        manager.dispatcher.dispatch = vi.fn(() =>
            Promise.resolve('0: Extensions (chrome://extensions/)')
        );
        manager.lockedTabId = 42;

        const result = await manager.execute({ name: 'list_pages', args: {} });

        expect(result).toBe('0: Extensions (chrome://extensions/)');
        expect(manager.dispatcher.dispatch).toHaveBeenCalledWith('list_pages', {});
    });

    it('keeps the intended target on the connection when locking without debugger attachment', () => {
        const manager = new BrowserControlManager();

        manager.setTargetTab(42);

        expect(manager.connection.targetTabId).toBe(42);
    });

    it('does not force background popup tabs into the existing native tab group', async () => {
        chrome.tabs.group = vi.fn(() => Promise.resolve(9));
        chrome.tabs.get = vi.fn((tabId) =>
            Promise.resolve({
                id: tabId,
                title: tabId === 99 ? 'Worker' : 'Inside',
                url: `https://${tabId}.test/`,
                active: false,
                windowId: tabId === 99 ? 55 : 1,
            })
        );
        const manager = new BrowserControlManager();
        manager.dispatcher.dispatch = vi.fn(() =>
            Promise.resolve({
                output: 'Created worker',
                _meta: { switchTabId: 99, allowOutsideControlledGroup: true },
            })
        );
        manager.connection.attached = true;
        manager.connection.currentTabId = 42;
        manager.lockedTabId = 42;
        manager.controlGroupId = 9;
        manager.controlWindowId = 1;

        const result = await manager.execute({ name: 'new_page', args: { background: true } });
        await Promise.resolve();

        expect(result).toBe('Created worker');
        expect(manager.lockedTabId).toBe(99);
        expect(manager.getControlledGroupId()).toBe(null);
        expect(manager.getControlledWindowId()).toBe(55);
        expect(chrome.tabs.group).not.toHaveBeenCalled();
    });

    it('reattaches before taking a snapshot when the locked tab changed', async () => {
        const manager = new BrowserControlManager();
        chrome.tabs.get = vi.fn((tabId) =>
            Promise.resolve({
                id: tabId,
                title: `Tab ${tabId}`,
                url: `https://tab-${tabId}.test/`,
                active: tabId === 77,
                windowId: 1,
            })
        );
        const attach = vi.spyOn(manager.connection, 'attach').mockImplementation(async (tabId) => {
            manager.connection.attached = true;
            manager.connection.currentTabId = tabId;
            return true;
        });
        manager.snapshotManager.takeSnapshot = vi.fn(() => Promise.resolve('new snapshot'));
        manager.connection.attached = true;
        manager.connection.currentTabId = 42;
        manager.lockedTabId = 77;

        const snapshot = await manager.getSnapshot();

        expect(attach).toHaveBeenCalledWith(77);
        expect(snapshot).toBe('new snapshot');
    });

    it('does not report a debugger connection as enabled when attach fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.debugger.attach = vi.fn((target, version, callback) => {
            chrome.runtime.lastError = { message: 'Another debugger is already attached.' };
            callback();
            chrome.runtime.lastError = null;
        });
        const manager = new BrowserControlManager();
        manager.lockedTabId = 42;
        manager.connection.targetTabId = 42;

        try {
            const enabled = await manager.ensureConnection();

            expect(enabled).toBe(false);
            expect(manager.connection.attached).toBe(false);
            expect(manager.connection.currentTabId).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                '[BrowserConnection] Attach failed:',
                'Another debugger is already attached.'
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('returns true when the debugger is already attached to the requested tab', async () => {
        const manager = new BrowserControlManager();
        manager.connection.attached = true;
        manager.connection.currentTabId = 42;

        await expect(manager.connection.attach(42)).resolves.toBe(true);
        expect(chrome.debugger.attach).not.toHaveBeenCalled();
    });

    it('does not enable retired diagnostics domains when attaching debugger', async () => {
        const manager = new BrowserControlManager();

        await manager.connection.attach(42);

        const enabledMethods = chrome.debugger.sendCommand.mock.calls.map((call) => call[1]);
        expect(enabledMethods).toContain('Runtime.enable');
        expect(enabledMethods).toContain('Page.enable');
        expect(enabledMethods).toContain('Target.setAutoAttach');
        expect(enabledMethods).not.toContain('Network.enable');
        expect(enabledMethods).not.toContain('Log.enable');
        expect(enabledMethods).not.toContain('Audits.enable');
    });
});
