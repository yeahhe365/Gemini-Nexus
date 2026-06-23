import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./content_injection.js', () => ({
    injectContentScriptsIntoTab: vi.fn(),
}));

import { injectContentScriptsIntoTab } from './content_injection.js';
import { setupContextMenus } from './menus.js';

describe('context menu actions', () => {
    let clickListener;
    let installListener;

    beforeEach(() => {
        vi.clearAllMocks();
        clickListener = null;
        installListener = null;
        globalThis.chrome = {
            i18n: {
                getUILanguage: vi.fn(() => 'en-US'),
            },
            runtime: {
                lastError: null,
                onInstalled: {
                    addListener: vi.fn((listener) => {
                        installListener = listener;
                    }),
                },
            },
            contextMenus: {
                create: vi.fn((item, callback) => callback?.()),
                removeAll: vi.fn((callback) => callback?.()),
                onClicked: {
                    addListener: vi.fn((listener) => {
                        clickListener = listener;
                    }),
                },
            },
            scripting: {
                executeScript: vi.fn(() => Promise.resolve()),
            },
            tabs: {
                sendMessage: vi.fn(() => Promise.resolve({ status: 'ok' })),
            },
        };
    });

    it('limits menu visibility to web pages', async () => {
        await setupContextMenus();
        const createdItems = chrome.contextMenus.create.mock.calls.map(([item]) => item);

        expect(createdItems.every((item) => item.documentUrlPatterns?.includes('http://*/*'))).toBe(
            true
        );
        expect(
            createdItems.every((item) => item.documentUrlPatterns?.includes('https://*/*'))
        ).toBe(true);
    });

    it('injects missing content scripts before dispatching a context menu action', async () => {
        await setupContextMenus();
        injectContentScriptsIntoTab.mockResolvedValue({ status: 'injected' });

        await clickListener({ menuItemId: 'menu-ask' }, { id: 7, url: 'https://example.test/' });

        expect(injectContentScriptsIntoTab).toHaveBeenCalledWith({
            id: 7,
            url: 'https://example.test/',
        });
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, {
            action: 'CONTEXT_MENU_ACTION',
            mode: 'ask',
        });
    });

    it('creates page and selection reading context menu entries', async () => {
        await setupContextMenus();
        const createdItems = chrome.contextMenus.create.mock.calls.map(([item]) => item);
        const readPage = createdItems.find((item) => item.id === 'menu-read-page');
        const readSelection = createdItems.find((item) => item.id === 'menu-read-selection');

        expect(readPage).toEqual(
            expect.objectContaining({
                title: 'Read page aloud',
                contexts: ['all'],
            })
        );
        expect(readSelection).toEqual(
            expect.objectContaining({
                title: 'Read selection aloud',
                contexts: ['selection'],
            })
        );
    });

    it('shows an in-page failure notice when a context menu action cannot reach content scripts', async () => {
        await setupContextMenus();
        injectContentScriptsIntoTab.mockResolvedValue({ status: 'failed' });

        await clickListener({ menuItemId: 'menu-ask' }, { id: 7, url: 'https://example.test/' });

        expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
        expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 7 },
            func: expect.any(Function),
            args: [expect.stringContaining('Gemini Nexus')],
        });
    });

    it('serializes startup and install context menu rebuilds', async () => {
        const pending = [];
        let parentExists = false;

        chrome.contextMenus.removeAll = vi.fn((callback) => {
            pending.push({
                type: 'removeAll',
                run: () => {
                    parentExists = false;
                    chrome.runtime.lastError = null;
                    callback?.();
                },
            });
        });
        chrome.contextMenus.create = vi.fn((item, callback) => {
            pending.push({
                type: `create:${item.id}`,
                run: () => {
                    if (item.parentId && !parentExists) {
                        chrome.runtime.lastError = {
                            message: `Cannot find menu item with id ${item.parentId}`,
                        };
                    } else {
                        if (item.id === 'gemini-nexus-parent') parentExists = true;
                        chrome.runtime.lastError = null;
                    }
                    callback?.();
                    chrome.runtime.lastError = null;
                },
            });
        });

        const startupSetup = setupContextMenus();
        const installSetup = installListener();

        for (let index = 0; index < 5 && pending.length === 0; index += 1) {
            await Promise.resolve();
        }
        expect(pending.map((task) => task.type)).toEqual(['removeAll']);

        async function flushNextMenuBuild() {
            for (let index = 0; index < 9; index += 1) {
                expect(pending.length).toBeGreaterThan(0);
                pending.shift().run();
                await Promise.resolve();
            }
        }

        await flushNextMenuBuild();
        await startupSetup;
        await Promise.resolve();

        expect(pending.map((task) => task.type)).toEqual(['removeAll']);

        await flushNextMenuBuild();
        await installSetup;

        while (pending.length > 0) {
            pending.shift().run();
            await Promise.resolve();
        }

        const childCreates = chrome.contextMenus.create.mock.calls.filter(
            ([item]) => item.parentId === 'gemini-nexus-parent'
        );
        expect(childCreates).toHaveLength(14);
    });
});
