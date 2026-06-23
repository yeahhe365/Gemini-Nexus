import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationActions } from './navigation.js';

function createActions(groupContext = {}) {
    const connection = { currentTabId: 101, targetTabId: 101 };
    const snapshotManager = { reset: vi.fn() };
    const waitHelper = {
        execute: vi.fn(async (fn) => fn()),
    };
    return new NavigationActions(connection, snapshotManager, waitHelper, groupContext);
}

describe('NavigationActions controlled tab group scope', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.chrome = {
            tabs: {
                create: vi.fn(() => Promise.resolve({ id: 303, title: 'New', url: 'about:blank' })),
                group: vi.fn(() => Promise.resolve(7)),
                query: vi.fn((query) => {
                    if (query.groupId === 7) {
                        return Promise.resolve([
                            { id: 101, title: 'Grouped A', url: 'https://a.test/' },
                            { id: 202, title: 'Grouped B', url: 'https://b.test/' },
                        ]);
                    }
                    return Promise.resolve([
                        { id: 101, title: 'Grouped A', url: 'https://a.test/' },
                        { id: 202, title: 'Grouped B', url: 'https://b.test/' },
                        { id: 999, title: 'Outside', url: 'https://outside.test/' },
                    ]);
                }),
                remove: vi.fn(() => Promise.resolve()),
            },
            windows: {
                create: vi.fn(() =>
                    Promise.resolve({
                        id: 55,
                        tabs: [{ id: 404, title: 'Worker', url: 'https://worker.test/' }],
                    })
                ),
            },
        };
    });

    it('lists only tabs in the controlled group', async () => {
        const actions = createActions({ getControlledGroupId: () => 7 });

        const output = await actions.listPages();

        expect(chrome.tabs.query).toHaveBeenCalledWith({ currentWindow: true, groupId: 7 });
        expect(output).toContain('Grouped A');
        expect(output).toContain('Grouped B');
        expect(output).not.toContain('Outside');
    });

    it('lists tabs from the controlled popup window when no native group is active', async () => {
        const actions = createActions({
            getControlledGroupId: () => null,
            getControlledWindowId: () => 55,
        });

        await actions.listPages();

        expect(chrome.tabs.query).toHaveBeenCalledWith({ windowId: 55 });
    });

    it('navigates the intended target tab when debugger is still attached elsewhere', async () => {
        const connection = { currentTabId: 101, targetTabId: 202 };
        const snapshotManager = { reset: vi.fn() };
        const waitHelper = {
            execute: vi.fn(async (fn) => fn()),
        };
        const actions = new NavigationActions(connection, snapshotManager, waitHelper);
        chrome.tabs.update = vi.fn(() => Promise.resolve());

        await actions.navigatePage({ url: 'https://target.test/' });

        expect(chrome.tabs.update).toHaveBeenCalledWith(202, { url: 'https://target.test/' });
        expect(snapshotManager.reset).toHaveBeenCalledTimes(1);
    });

    it('clears cached snapshot UIDs after history navigation', async () => {
        const connection = { currentTabId: 101, targetTabId: 101 };
        const snapshotManager = { reset: vi.fn() };
        const waitHelper = {
            execute: vi.fn(async (fn) => fn()),
        };
        const actions = new NavigationActions(connection, snapshotManager, waitHelper);
        chrome.tabs.goBack = vi.fn(() => Promise.resolve());

        await actions.navigatePage({ type: 'back' });

        expect(chrome.tabs.goBack).toHaveBeenCalledWith(101);
        expect(snapshotManager.reset).toHaveBeenCalledTimes(1);
    });

    it('reloads with cache bypass when requested', async () => {
        const connection = { currentTabId: 101, targetTabId: 101 };
        const snapshotManager = { reset: vi.fn() };
        const waitHelper = {
            execute: vi.fn(async (fn) => fn()),
        };
        const actions = new NavigationActions(connection, snapshotManager, waitHelper);
        chrome.tabs.reload = vi.fn(() => Promise.resolve());

        const output = await actions.navigatePage({ type: 'reload', ignoreCache: true });

        expect(chrome.tabs.reload).toHaveBeenCalledWith(101, { bypassCache: true });
        expect(output).toBe('Reloaded page bypassing cache');
    });

    it('rejects invalid navigation arguments before waiting for page events', async () => {
        const actions = createActions();

        const output = await actions.navigatePage({ type: 'url' });

        expect(output).toBe("Error: 'url' is required when type is 'url'.");
        expect(actions.waitHelper.execute).not.toHaveBeenCalled();
    });

    it('includes the final URL when the action waiter observes a URL change', async () => {
        const connection = { currentTabId: 101, targetTabId: 101 };
        const snapshotManager = { reset: vi.fn() };
        const waitHelper = {
            execute: vi.fn(async (fn) => {
                await fn();
                return { navigationStarted: true, navigatedToUrl: 'https://target.test/done' };
            }),
        };
        const actions = new NavigationActions(connection, snapshotManager, waitHelper);
        chrome.tabs.update = vi.fn(() => Promise.resolve());

        const output = await actions.navigatePage({ url: 'https://target.test/' });

        expect(output).toBe(
            'Navigating to https://target.test/. Current URL: https://target.test/done'
        );
    });

    it('selects pages by index from the controlled group only', async () => {
        const actions = createActions({ getControlledGroupId: () => 7 });

        const result = await actions.selectPage({ index: 1 });

        expect(result).toMatchObject({
            output: 'Selected page 1: Grouped B',
            _meta: { switchTabId: 202 },
        });
    });

    it('switches to another grouped page after closing the current target', async () => {
        const actions = createActions({ getControlledGroupId: () => 7 });

        const result = await actions.closePage({ index: 0 });

        expect(chrome.tabs.remove).toHaveBeenCalledWith(101);
        expect(result).toMatchObject({
            output: 'Closed page 0: Grouped A. Selected page: Grouped B',
            _meta: { switchTabId: 202 },
        });
    });

    it('adds newly opened pages to the controlled group', async () => {
        const actions = createActions({ getControlledGroupId: () => 7 });

        const result = await actions.newPage({ url: 'https://openai.com/' });

        expect(chrome.tabs.group).toHaveBeenCalledWith({ groupId: 7, tabIds: [303] });
        expect(result).toMatchObject({
            _meta: { switchTabId: 303 },
        });
    });

    it('does not add popup-window pages to the current-window controlled group', async () => {
        const actions = createActions({ getControlledGroupId: () => 7 });

        const result = await actions.newPage({ url: 'https://worker.test/', background: true });

        expect(chrome.windows.create).toHaveBeenCalledWith({
            url: 'https://worker.test/',
            type: 'popup',
            focused: false,
            width: 1280,
            height: 800,
        });
        expect(chrome.tabs.group).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            _meta: {
                switchTabId: 404,
                allowOutsideControlledGroup: true,
            },
        });
    });
});
