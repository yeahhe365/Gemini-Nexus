// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    StateManager,
    getContextTabFromTabs,
    getOwnerTabIdFromLocation,
    isStandalonePageFromLocation,
    isExtensionHostPageTab,
} from './state.js';

function createFrame() {
    return {
        getWindow: vi.fn(() => ({})),
        postMessage: vi.fn(),
        reveal: vi.fn(),
    };
}

function normalizeTab(tabOrId) {
    return typeof tabOrId === 'number'
        ? { id: tabOrId, title: `Tab ${tabOrId}`, url: `https://tab-${tabOrId}.test/` }
        : tabOrId;
}

function setupChrome(activeTab = 33) {
    const listeners = {};
    const tab = normalizeTab(activeTab);

    globalThis.chrome = {
        storage: {
            local: {
                get: vi.fn((keys, callback) => callback({})),
            },
            session: {
                get: vi.fn((keys, callback) => callback({ geminiSidePanelSessionBindings: {} })),
                set: vi.fn(),
            },
            onChanged: {
                addListener: vi.fn((listener) => {
                    listeners.storageChanged = listener;
                }),
            },
        },
        tabs: {
            query: vi.fn((query, callback) => callback([tab])),
            get: vi.fn((tabId, callback) => callback(tabId === tab.id ? tab : normalizeTab(tabId))),
            onActivated: {
                addListener: vi.fn((listener) => {
                    listeners.activated = listener;
                }),
            },
            onUpdated: {
                addListener: vi.fn((listener) => {
                    listeners.updated = listener;
                }),
            },
            onRemoved: {
                addListener: vi.fn((listener) => {
                    listeners.removed = listener;
                }),
            },
        },
        runtime: {
            lastError: null,
            getManifest: vi.fn(() => ({ version: 'test' })),
        },
    };

    return listeners;
}

function setupChromeWithLocalData(localData, activeTabId = 33) {
    const listeners = setupChrome(activeTabId);
    chrome.storage.local.get.mockImplementation((keys, callback) => callback(localData));
    return listeners;
}

describe('StateManager tab ownership', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        window.history.replaceState(null, '', '/sidepanel/index.html');
    });

    it('parses a positive owner tab id from the side panel URL', () => {
        expect(
            getOwnerTabIdFromLocation({
                href: 'chrome-extension://id/sidepanel/index.html?tabId=123',
            })
        ).toBe(123);
        expect(
            getOwnerTabIdFromLocation({
                href: 'chrome-extension://id/sidepanel/index.html?tabId=0',
            })
        ).toBeNull();
        expect(getOwnerTabIdFromLocation({ href: 'not a url' })).toBeNull();
    });

    it('recognizes full-page chat launches as standalone pages', () => {
        expect(
            isStandalonePageFromLocation({
                href: 'chrome-extension://id/sidepanel/index.html?standalone=1',
            })
        ).toBe(true);
        expect(
            isStandalonePageFromLocation({
                href: 'chrome-extension://id/sidepanel/index.html',
            })
        ).toBe(false);
        expect(isStandalonePageFromLocation({ href: 'not a url' })).toBe(false);
    });

    it('recognizes extension-hosted chat pages as non-webpage tab contexts', () => {
        expect(
            isExtensionHostPageTab({
                id: 44,
                url: 'chrome-extension://id/sidepanel/index.html',
            })
        ).toBe(true);
        expect(
            isExtensionHostPageTab({
                id: 45,
                url: 'chrome-extension://id/sandbox/index.html?theme=dark',
            })
        ).toBe(true);
        expect(
            isExtensionHostPageTab({
                id: 46,
                url: 'https://example.test/',
            })
        ).toBe(false);
    });

    it('keeps a tab-scoped side panel bound to its owner tab when active tab changes', () => {
        window.history.replaceState(null, '', '/sidepanel/index.html?tabId=11');
        const listeners = setupChrome(22);
        const manager = new StateManager(createFrame());

        manager.init();
        listeners.activated({ tabId: 22 });

        expect(chrome.tabs.query).not.toHaveBeenCalled();
        expect(manager.getCurrentTabId()).toBe(11);
    });

    it('uses active tab tracking only for unscoped side panel pages', () => {
        const listeners = setupChrome(33);
        const manager = new StateManager(createFrame());

        manager.init();
        listeners.activated({ tabId: 44 });

        expect(chrome.tabs.query).toHaveBeenCalledWith(
            { currentWindow: true },
            expect.any(Function)
        );
        expect(manager.getCurrentTabId()).toBe(44);
    });

    it('does not bind an unscoped side panel to an active standalone chat tab', () => {
        setupChrome({
            id: 44,
            title: 'Gemini Nexus',
            url: 'chrome-extension://id/sidepanel/index.html',
        });
        const manager = new StateManager(createFrame());

        manager.init();

        expect(manager.getCurrentTabId()).toBeNull();
    });

    it('does not bind a marked standalone full-page chat to a recent webpage tab', () => {
        window.history.replaceState(null, '', '/sidepanel/index.html?standalone=1');
        const listeners = setupChrome({ id: 33, active: true, url: 'https://active.test/' });
        const manager = new StateManager(createFrame());

        manager.init();
        listeners.activated({ tabId: 33 });

        expect(chrome.tabs.query).not.toHaveBeenCalled();
        expect(manager.getCurrentTabId()).toBeNull();
    });

    it('falls back to the most recently accessed webpage when the active tab is an extension page', () => {
        const contextTab = getContextTabFromTabs([
            {
                id: 44,
                active: true,
                lastAccessed: 300,
                url: 'chrome-extension://id/sidepanel/index.html',
            },
            { id: 45, active: false, lastAccessed: 200, url: 'https://older.test/' },
            { id: 46, active: false, lastAccessed: 400, url: 'https://recent.test/' },
        ]);

        expect(contextTab.id).toBe(46);
    });

    it('uses the standalone host tab id for message routing without page context', () => {
        setupChrome({
            id: 44,
            title: 'Gemini Nexus',
            url: 'chrome-extension://id/sidepanel/index.html',
        });
        const manager = new StateManager(createFrame());

        manager.init();
        manager.setHostTabId(777);

        expect(manager.getCurrentTabId()).toBeNull();
        expect(manager.getMessageTargetTabId()).toBe(777);

        manager.setHostTabId(null);

        expect(manager.getMessageTargetTabId()).toBeNull();
    });

    it('prefers webpage context over the standalone host tab for message routing', () => {
        setupChrome(33);
        const manager = new StateManager(createFrame());

        manager.init();
        manager.setHostTabId(777);

        expect(manager.getCurrentTabId()).toBe(33);
        expect(manager.getMessageTargetTabId()).toBe(33);
    });

    it('keeps the previous webpage context when standalone chat becomes active', () => {
        const listeners = setupChrome(33);
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        chrome.tabs.get.mockImplementation((tabId, callback) => {
            if (tabId === 44) {
                callback({
                    id: 44,
                    title: 'Gemini Nexus',
                    url: 'chrome-extension://id/sidepanel/index.html',
                });
                return;
            }
            callback(normalizeTab(tabId));
        });

        listeners.activated({ tabId: 44 });

        expect(manager.getCurrentTabId()).toBe(33);
    });

    it('restores the OpenAI-specific selected model when the OpenAI provider is active', () => {
        setupChromeWithLocalData({
            geminiProvider: 'openai',
            geminiModel: 'gemini-3-flash',
            geminiOpenaiModel: 'gpt-4.1, gpt-5',
            geminiOpenaiSelectedModel: 'gpt-5',
        });
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        manager.markUiReady();

        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_CONNECTION_SETTINGS',
            payload: expect.objectContaining({
                provider: 'openai',
                openaiModel: 'gpt-4.1, gpt-5',
                openaiSelectedModel: 'gpt-5',
                selectedModel: 'gpt-5',
            }),
        });
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_MODEL',
            payload: 'gpt-5',
        });
    });

    it('restores text selection blacklist during initialization', () => {
        setupChromeWithLocalData({
            geminiTextSelectionBlacklist: 'github.com\n*.google.com',
        });
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        manager.markUiReady();

        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_TEXT_SELECTION_BLACKLIST',
            payload: 'github.com\n*.google.com',
        });
    });

    it('restores the persisted collapsed sidebar state during initialization', () => {
        setupChromeWithLocalData({
            geminiSidebarExpanded: false,
        });
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        manager.markUiReady();

        expect(chrome.storage.local.get).toHaveBeenCalledWith(
            expect.arrayContaining(['geminiSidebarExpanded']),
            expect.any(Function)
        );
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_SIDEBAR_EXPANDED',
            payload: false,
        });
        expect(localStorage.getItem('geminiSidebarExpanded')).toBe('false');
    });

    it('posts the current tab URL with side panel tab context', () => {
        setupChrome({
            id: 33,
            title: 'Video',
            url: 'https://www.youtube.com/watch?v=nU9c-PffHPg',
        });
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        manager.markUiReady();

        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
            payload: {
                tabId: 33,
                sessionId: null,
                title: 'Video',
                url: 'https://www.youtube.com/watch?v=nU9c-PffHPg',
            },
        });
    });

    it('continues initialization with default state when local storage cannot be read', () => {
        setupChrome(33);
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Local storage unavailable' };
            callback(undefined);
            chrome.runtime.lastError = null;
        });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const frame = createFrame();
        const manager = new StateManager(frame);

        try {
            manager.init();
            manager.markUiReady();

            expect(frame.reveal).toHaveBeenCalled();
            expect(frame.postMessage).toHaveBeenCalledWith({
                action: 'RESTORE_CONNECTION_SETTINGS',
                payload: expect.any(Object),
            });
            expect(warnSpy).toHaveBeenCalledWith(
                'Failed to load side panel local state:',
                'Local storage unavailable'
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('continues initialization with empty bindings when session storage cannot be read', () => {
        setupChrome(33);
        chrome.storage.session.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Session storage unavailable' };
            callback(undefined);
            chrome.runtime.lastError = null;
        });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const frame = createFrame();
        const manager = new StateManager(frame);

        try {
            manager.init();
            manager.markUiReady();

            expect(frame.reveal).toHaveBeenCalled();
            expect(frame.postMessage).toHaveBeenCalledWith({
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: expect.objectContaining({
                    tabId: 33,
                    sessionId: null,
                }),
            });
            expect(warnSpy).toHaveBeenCalledWith(
                'Failed to load side panel session state:',
                'Session storage unavailable'
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('continues initialization without a tab context when active tab lookup fails', () => {
        setupChrome(33);
        chrome.tabs.query.mockImplementation((query, callback) => {
            chrome.runtime.lastError = { message: 'Tabs unavailable' };
            callback(undefined);
            chrome.runtime.lastError = null;
        });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const frame = createFrame();
        const manager = new StateManager(frame);

        try {
            manager.init();
            manager.markUiReady();

            expect(manager.getCurrentTabId()).toBeNull();
            expect(frame.reveal).toHaveBeenCalled();
            expect(frame.postMessage).toHaveBeenCalledWith({
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: {
                    tabId: null,
                    sessionId: null,
                    title: '',
                    url: '',
                },
            });
            expect(warnSpy).toHaveBeenCalledWith(
                'Failed to resolve active side panel tab:',
                'Tabs unavailable'
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('updates tab context when the current tab URL changes', () => {
        const listeners = setupChrome(33);
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        manager.markUiReady();
        frame.postMessage.mockClear();

        listeners.updated(
            33,
            { url: 'https://www.youtube.com/watch?v=nU9c-PffHPg' },
            {
                id: 33,
                title: 'Video',
                url: 'https://www.youtube.com/watch?v=nU9c-PffHPg',
            }
        );

        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
            payload: {
                tabId: 33,
                sessionId: null,
                title: 'Video',
                url: 'https://www.youtube.com/watch?v=nU9c-PffHPg',
            },
        });
    });

    it('forwards sidebar expanded storage changes to the sandbox after initialization', () => {
        const listeners = setupChromeWithLocalData({
            geminiSidebarExpanded: true,
        });
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        manager.markUiReady();
        frame.postMessage.mockClear();

        listeners.storageChanged(
            {
                geminiSidebarExpanded: { oldValue: true, newValue: false },
            },
            'local'
        );

        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_SIDEBAR_EXPANDED',
            payload: false,
        });
        expect(localStorage.getItem('geminiSidebarExpanded')).toBe('false');
    });

    it('forwards local settings changes saved by the standalone settings page', () => {
        const listeners = setupChromeWithLocalData({
            geminiProvider: 'web',
            geminiOfficialModel: 'gemini-2.5-flash',
            geminiTextSelectionBlacklist: 'old.example',
        });
        const frame = createFrame();
        const manager = new StateManager(frame);

        manager.init();
        manager.markUiReady();
        frame.postMessage.mockClear();

        listeners.storageChanged(
            {
                geminiProvider: { oldValue: 'web', newValue: 'official' },
                geminiOfficialModel: {
                    oldValue: 'gemini-2.5-flash',
                    newValue: 'gemini-2.5-pro',
                },
                geminiTextSelectionBlacklist: {
                    oldValue: 'old.example',
                    newValue: 'github.com',
                },
            },
            'local'
        );

        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_TEXT_SELECTION_BLACKLIST',
            payload: 'github.com',
        });
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_CONNECTION_SETTINGS',
            payload: expect.objectContaining({
                provider: 'official',
                officialModel: 'gemini-2.5-pro',
            }),
        });
    });
});
