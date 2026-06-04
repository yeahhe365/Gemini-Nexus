// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageBridge } from './bridge.js';

function createFrame() {
    const sandboxWindow = {};
    return {
        getWindow: vi.fn(() => sandboxWindow),
        isWindow: vi.fn((source) => source === sandboxWindow),
        postMessage: vi.fn(),
    };
}

function createState() {
    return {
        getCurrentTabId: vi.fn(() => null),
        getMessageTargetTabId: vi.fn(() => null),
        markUiReady: vi.fn(),
        save: vi.fn(),
        setHostTabId: vi.fn(),
        updateSessions: vi.fn(),
    };
}

describe('MessageBridge model persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.chrome = {
            runtime: {
                lastError: null,
                onMessage: { addListener: vi.fn() },
                sendMessage: vi.fn(() => Promise.resolve()),
            },
            storage: {
                local: {
                    get: vi.fn(),
                    set: vi.fn(),
                },
                session: {
                    get: vi.fn(),
                    set: vi.fn(),
                },
            },
            tabs: {
                create: vi.fn(),
                getCurrent: vi.fn((callback) => callback(undefined)),
            },
        };
    });

    it('saves OpenAI model selections in the OpenAI-specific preference key', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_MODEL',
                payload: {
                    provider: 'openai',
                    model: 'gpt-5',
                },
            },
        });

        expect(state.save).toHaveBeenCalledWith('geminiOpenaiSelectedModel', 'gpt-5');
        expect(state.save).not.toHaveBeenCalledWith('geminiModel', 'gpt-5');
    });

    it('keeps legacy string model saves on the global Gemini model key', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_MODEL',
                payload: 'gemini-3-flash',
            },
        });

        expect(state.save).toHaveBeenCalledWith('geminiModel', 'gemini-3-flash');
    });

    it('saves dedicated provider model selections in provider-specific keys', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_MODEL',
                payload: {
                    provider: 'deepseek',
                    model: 'deepseek-v4-pro',
                },
            },
        });

        expect(state.save).toHaveBeenCalledWith('geminiDeepseekSelectedModel', 'deepseek-v4-pro');
        expect(state.save).not.toHaveBeenCalledWith('geminiModel', 'deepseek-v4-pro');
    });

    it('marks full-page chat launches as standalone tabs', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.runtime.getURL = vi.fn((path) => `chrome-extension://id/${path}`);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'OPEN_FULL_PAGE',
            },
        });

        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'chrome-extension://id/sidepanel/index.html?standalone=1',
        });
    });

    it('merges side panel session bindings with existing session storage', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.session.get.mockImplementation((keys, callback) =>
            callback({
                geminiSidePanelSessionBindings: {
                    7: 'existing-session',
                },
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SIDE_PANEL_SESSION_BINDING',
                payload: {
                    tabId: 42,
                    sessionId: 'session-42',
                },
            },
        });

        expect(chrome.storage.session.set).toHaveBeenCalledWith({
            geminiSidePanelSessionBindings: {
                7: 'existing-session',
                42: 'session-42',
            },
        });
    });

    it('does not overwrite side panel session bindings when session storage read fails', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.storage.session.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Session storage read failed' };
            callback({});
            chrome.runtime.lastError = null;
        });

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SIDE_PANEL_SESSION_BINDING',
                payload: {
                    tabId: 42,
                    sessionId: 'session-42',
                },
            },
        });

        expect(chrome.storage.session.set).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(
            'Unable to save side panel session binding after storage read failed:',
            expect.any(Error)
        );

        warn.mockRestore();
    });

    it('publishes tab host context when the sandbox UI is ready', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.tabs.getCurrent.mockImplementation((callback) => callback({ id: 42 }));

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'UI_READY',
            },
        });

        await Promise.resolve();

        expect(state.markUiReady).toHaveBeenCalled();
        expect(state.setHostTabId).toHaveBeenCalledWith(42);
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'SET_HOST_CONTEXT',
            payload: { isTab: true },
        });
    });

    it('publishes sidepanel host context when Chrome does not expose a current tab', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'UI_READY',
            },
        });

        await Promise.resolve();

        expect(state.setHostTabId).toHaveBeenCalledWith(null);
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'SET_HOST_CONTEXT',
            payload: { isTab: false },
        });
    });

    it('does not route browser control toggles through a standalone host tab without webpage context', () => {
        const frame = createFrame();
        const state = createState();
        state.getCurrentTabId.mockReturnValue(null);
        state.getMessageTargetTabId.mockReturnValue(777);
        const bridge = new MessageBridge(frame, state);

        bridge.forwardToBackground({
            action: 'TOGGLE_BROWSER_CONTROL',
            enabled: true,
            hostIsTab: true,
        });

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'TOGGLE_BROWSER_CONTROL',
            enabled: true,
            hostIsTab: true,
        });
    });

    it('routes browser-control prompts through the current webpage tab id', () => {
        const frame = createFrame();
        const state = createState();
        state.getCurrentTabId.mockReturnValue(33);
        state.getMessageTargetTabId.mockReturnValue(777);
        const bridge = new MessageBridge(frame, state);

        bridge.forwardToBackground({
            action: 'SEND_PROMPT',
            text: 'Open Google',
            enableBrowserControl: true,
            hostIsTab: true,
        });

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SEND_PROMPT',
            text: 'Open Google',
            enableBrowserControl: true,
            hostIsTab: true,
            sidePanelTabId: 33,
        });
    });

    it('keeps ordinary prompt routing on the current webpage tab id', () => {
        const frame = createFrame();
        const state = createState();
        state.getCurrentTabId.mockReturnValue(33);
        state.getMessageTargetTabId.mockReturnValue(777);
        const bridge = new MessageBridge(frame, state);

        bridge.forwardToBackground({
            action: 'SEND_PROMPT',
            text: 'Use page context only',
            enableBrowserControl: false,
        });

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SEND_PROMPT',
            text: 'Use page context only',
            enableBrowserControl: false,
            sidePanelTabId: 33,
        });
    });

    it('forwards runtime messages addressed to the standalone host tab', () => {
        const frame = createFrame();
        const state = createState();
        state.getCurrentTabId.mockReturnValue(null);
        state.getMessageTargetTabId.mockReturnValue(777);
        const bridge = new MessageBridge(frame, state);

        bridge.handleRuntimeMessage({
            action: 'TAB_LOCKED',
            tabId: 777,
            tab: { id: 700, url: 'https://www.google.com/search?q=' },
        });
        bridge.handleRuntimeMessage({
            action: 'TAB_LOCKED',
            tabId: 778,
            tab: { id: 701, url: 'https://example.test/' },
        });

        expect(frame.postMessage).toHaveBeenCalledTimes(1);
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'BACKGROUND_MESSAGE',
            payload: {
                action: 'TAB_LOCKED',
                tabId: 777,
                tab: { id: 700, url: 'https://www.google.com/search?q=' },
            },
        });
    });

    it('ignores malformed messages from the sandbox frame', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: null,
        });

        expect(state.save).not.toHaveBeenCalled();
        expect(state.markUiReady).not.toHaveBeenCalled();
    });

    it('opens the standalone settings page in a new tab from the Chrome side panel', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.runtime.getURL = vi.fn((path) => `chrome-extension://id/${path}`);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'OPEN_SETTINGS_PAGE',
            },
        });

        await Promise.resolve();

        expect(chrome.tabs.create).toHaveBeenCalledWith({
            url: 'chrome-extension://id/settings/index.html',
        });
    });

    it('opens settings inside the current sidepanel page when it is running as a tab', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.tabs.getCurrent.mockImplementation((callback) => callback({ id: 42 }));

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'OPEN_SETTINGS_PAGE',
            },
        });

        await Promise.resolve();

        expect(frame.postMessage).toHaveBeenCalledWith({ action: 'OPEN_SETTINGS_MODAL' });
        expect(chrome.tabs.create).not.toHaveBeenCalled();
    });

    it('saves the text selection blacklist preference', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_TEXT_SELECTION_BLACKLIST',
                payload: 'github.com\n*.google.com',
            },
        });

        expect(state.save).toHaveBeenCalledWith(
            'geminiTextSelectionBlacklist',
            'github.com\n*.google.com'
        );
    });

    it('saves the sidebar expanded preference from the sandbox frame', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SIDEBAR_EXPANDED',
                payload: false,
            },
        });

        expect(state.save).toHaveBeenCalledWith('geminiSidebarExpanded', false);
    });

    it('restores the sidebar expanded preference on request', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiSidebarExpanded: false,
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'GET_SIDEBAR_EXPANDED',
            },
        });

        expect(chrome.storage.local.get).toHaveBeenCalledWith(
            ['geminiSidebarExpanded'],
            expect.any(Function)
        );
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_SIDEBAR_EXPANDED',
            payload: false,
        });
    });

    it('does not restore the sidebar expanded preference when storage read fails', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Storage read failed' };
            callback({});
            chrome.runtime.lastError = null;
        });

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'GET_SIDEBAR_EXPANDED',
            },
        });

        expect(frame.postMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: 'RESTORE_SIDEBAR_EXPANDED' })
        );
        expect(warn).toHaveBeenCalledWith(
            'Unable to restore sidebar expanded state after storage read failed:',
            expect.any(Error)
        );

        warn.mockRestore();
    });

    it('restores connection settings on request', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiProvider: 'openai',
                geminiOpenaiModel: 'gpt-4.1, gpt-5',
                geminiOpenaiSelectedModel: 'gpt-5',
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'GET_CONNECTION_SETTINGS',
            },
        });

        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_CONNECTION_SETTINGS',
            payload: expect.objectContaining({
                provider: 'openai',
                openaiModel: 'gpt-4.1, gpt-5',
                openaiSelectedModel: 'gpt-5',
                selectedModel: 'gpt-5',
            }),
        });
    });

    it('does not restore connection settings when storage read fails', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Storage read failed' };
            callback({});
            chrome.runtime.lastError = null;
        });

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'GET_CONNECTION_SETTINGS',
            },
        });

        expect(frame.postMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: 'RESTORE_CONNECTION_SETTINGS' })
        );
        expect(warn).toHaveBeenCalledWith(
            'Unable to restore connection settings after storage read failed:',
            expect.any(Error)
        );

        warn.mockRestore();
    });

    it('restores the text selection blacklist preference', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiTextSelectionBlacklist: 'github.com',
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'GET_TEXT_SELECTION_BLACKLIST',
            },
        });

        expect(chrome.storage.local.get).toHaveBeenCalledWith(
            ['geminiTextSelectionBlacklist'],
            expect.any(Function)
        );
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_TEXT_SELECTION_BLACKLIST',
            payload: 'github.com',
        });
    });

    it('does not restore image tool preference when storage read fails', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Storage read failed' };
            callback({});
            chrome.runtime.lastError = null;
        });

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'GET_IMAGE_TOOLS',
            },
        });

        expect(frame.postMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: 'RESTORE_IMAGE_TOOLS' })
        );
        expect(warn).toHaveBeenCalledWith(
            '[Gemini Nexus] Failed to restore image tools setting:',
            'Storage read failed'
        );

        warn.mockRestore();
    });

    it('saves and restores custom selection tools', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        const tools = [{ id: 'formal', name: 'Formal', prompt: 'Rewrite: {text}' }];

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_CUSTOM_SELECTION_TOOLS',
                payload: tools,
            },
        });

        expect(state.save).toHaveBeenCalledWith('geminiCustomSelectionTools', tools);

        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({ geminiCustomSelectionTools: tools })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'GET_CUSTOM_SELECTION_TOOLS',
            },
        });

        expect(chrome.storage.local.get).toHaveBeenCalledWith(
            ['geminiCustomSelectionTools'],
            expect.any(Function)
        );
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'RESTORE_CUSTOM_SELECTION_TOOLS',
            payload: tools,
        });
    });

    it('saves connection settings through the shared storage mapping', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_CONNECTION_SETTINGS',
                payload: {
                    provider: 'official',
                    officialModel: 'gemini-test',
                    apiKey: 'key-test',
                    mcpEnabled: true,
                    mcpServers: [{ id: 'srv', url: 'http://localhost/mcp' }],
                    mcpActiveServerId: 'srv',
                },
            },
        });

        expect(state.save).toHaveBeenCalledWith('geminiProvider', 'official');
        expect(state.save).toHaveBeenCalledWith('geminiUseOfficialApi', true);
        expect(state.save).toHaveBeenCalledWith('geminiOfficialModel', 'gemini-test');
        expect(state.save).toHaveBeenCalledWith('geminiApiKey', 'key-test');
        expect(state.save).toHaveBeenCalledWith('geminiMcpEnabled', true);
        expect(state.save).toHaveBeenCalledWith('geminiMcpServers', [
            { id: 'srv', url: 'http://localhost/mcp' },
        ]);
        expect(state.save).toHaveBeenCalledWith('geminiMcpActiveServerId', 'srv');
    });

    it('does not let a stale full-session save truncate a session updated in storage', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiSessions: [
                    {
                        id: 'session-1',
                        title: 'Current',
                        timestamp: 200,
                        messages: [
                            { role: 'user', text: 'Hi' },
                            { role: 'ai', text: 'Hello' },
                        ],
                    },
                ],
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SESSIONS',
                payload: [
                    {
                        id: 'session-1',
                        title: 'Stale',
                        timestamp: 100,
                        messages: [{ role: 'user', text: 'Hi' }],
                    },
                ],
            },
        });

        await vi.waitFor(() =>
            expect(state.save).toHaveBeenCalledWith('geminiSessions', [
                expect.objectContaining({
                    id: 'session-1',
                    title: 'Current',
                    messages: [
                        { role: 'user', text: 'Hi' },
                        { role: 'ai', text: 'Hello' },
                    ],
                }),
            ])
        );
    });

    it('does not write stale sessions when the safe-save storage read fails', () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Storage read failed' };
            callback({});
            chrome.runtime.lastError = null;
        });

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SESSIONS',
                payload: [
                    {
                        id: 'session-1',
                        title: 'Stale',
                        timestamp: 100,
                        messages: [{ role: 'user', text: 'Hi' }],
                    },
                ],
            },
        });

        expect(state.save).not.toHaveBeenCalled();
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('applies group updates without truncating newer stored messages', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiSessions: [
                    {
                        id: 'session-1',
                        title: 'Current',
                        groupId: null,
                        messages: [
                            { role: 'user', text: 'Hi' },
                            { role: 'ai', text: 'Hello' },
                        ],
                    },
                ],
                geminiDeletedSessionIds: {},
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SESSIONS',
                payload: {
                    sessions: [
                        {
                            id: 'session-1',
                            title: 'Stale',
                            groupId: 'group-1',
                            messages: [{ role: 'user', text: 'Hi' }],
                        },
                    ],
                    mutation: { type: 'updateSessionGroups' },
                },
            },
        });

        await vi.waitFor(() =>
            expect(state.save).toHaveBeenCalledWith('geminiSessions', [
                expect.objectContaining({
                    id: 'session-1',
                    title: 'Current',
                    groupId: 'group-1',
                    messages: [
                        { role: 'user', text: 'Hi' },
                        { role: 'ai', text: 'Hello' },
                    ],
                }),
            ])
        );
    });

    it('applies session metadata updates without truncating newer stored messages', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiSessions: [
                    {
                        id: 'session-1',
                        title: 'Current',
                        isPinned: false,
                        messages: [
                            { role: 'user', text: 'Hi' },
                            { role: 'ai', text: 'Hello' },
                        ],
                    },
                ],
                geminiDeletedSessionIds: {},
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SESSIONS',
                payload: {
                    sessions: [
                        {
                            id: 'session-1',
                            title: 'Pinned title',
                            isPinned: true,
                            messages: [{ role: 'user', text: 'Hi' }],
                        },
                    ],
                    mutation: { type: 'updateSessionMetadata', sessionId: 'session-1' },
                },
            },
        });

        await vi.waitFor(() =>
            expect(state.save).toHaveBeenCalledWith('geminiSessions', [
                expect.objectContaining({
                    id: 'session-1',
                    title: 'Pinned title',
                    isPinned: true,
                    messages: [
                        { role: 'user', text: 'Hi' },
                        { role: 'ai', text: 'Hello' },
                    ],
                }),
            ])
        );
    });

    it('applies delete-session mutations against current storage and records a tombstone', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiSessions: [
                    {
                        id: 'session-1',
                        title: 'Deleted',
                        messages: [{ role: 'user', text: 'Remove me' }],
                    },
                    {
                        id: 'session-2',
                        title: 'Keep',
                        messages: [{ role: 'user', text: 'Keep me' }],
                    },
                ],
                geminiDeletedSessionIds: {},
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SESSIONS',
                payload: {
                    sessions: [
                        {
                            id: 'session-2',
                            title: 'Keep',
                            messages: [{ role: 'user', text: 'Keep me' }],
                        },
                    ],
                    mutation: { type: 'deleteSession', sessionId: 'session-1' },
                },
            },
        });

        await vi.waitFor(() =>
            expect(state.save).toHaveBeenCalledWith('geminiSessions', [
                expect.objectContaining({ id: 'session-2' }),
            ])
        );
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
            geminiDeletedSessionIds: expect.objectContaining({
                'session-1': expect.any(Number),
            }),
        });
    });

    it('does not revive a tombstoned session from a stale legacy full-session save', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiSessions: [],
                geminiDeletedSessionIds: { 'session-1': 123 },
            })
        );

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: {
                action: 'SAVE_SESSIONS',
                payload: [
                    {
                        id: 'session-1',
                        title: 'Stale',
                        messages: [{ role: 'user', text: 'Old' }],
                    },
                ],
            },
        });

        await vi.waitFor(() => expect(state.save).toHaveBeenCalledWith('geminiSessions', []));
    });

    it('imports history by merging new records and clearing matching tombstones', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) =>
            callback({
                geminiSessions: [{ id: 'existing-session', messages: [{ role: 'user' }] }],
                geminiGroups: [{ id: 'existing-group', title: 'Existing' }],
                geminiDeletedSessionIds: {
                    'new-session': 1,
                    other: 2,
                },
            })
        );
        chrome.storage.local.set.mockImplementation((update, callback) => callback?.());

        bridge.importHistoryData({
            type: 'GeminiNexus-History',
            history: [
                { id: 'existing-session', title: 'Imported duplicate' },
                { id: 'new-session', title: 'Imported' },
            ],
            groups: [
                { id: 'existing-group', title: 'Imported duplicate' },
                { id: 'new-group', title: 'Imported group' },
            ],
        });

        await vi.waitFor(() =>
            expect(chrome.storage.local.set).toHaveBeenCalledWith(
                {
                    geminiSessions: [
                        { id: 'existing-session', messages: [{ role: 'user' }] },
                        { id: 'new-session', title: 'Imported' },
                    ],
                    geminiGroups: [
                        { id: 'existing-group', title: 'Existing' },
                        { id: 'new-group', title: 'Imported group' },
                    ],
                    geminiDeletedSessionIds: { other: 2 },
                },
                expect.any(Function)
            )
        );
        expect(frame.postMessage).toHaveBeenCalledWith({
            action: 'DATA_IMPORT_RESULT',
            payload: { kind: 'history', ok: true, error: null },
        });
    });

    it('reports history import read failures instead of writing partial data', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            chrome.runtime.lastError = { message: 'Storage read failed' };
            callback({});
            chrome.runtime.lastError = null;
        });

        bridge.importHistoryData({
            type: 'GeminiNexus-History',
            history: [{ id: 'new-session', title: 'Imported' }],
        });

        await vi.waitFor(() =>
            expect(frame.postMessage).toHaveBeenCalledWith({
                action: 'DATA_IMPORT_RESULT',
                payload: {
                    kind: 'history',
                    ok: false,
                    error: 'Storage read failed',
                },
            })
        );
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it('reports settings import write failures instead of showing success', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        chrome.storage.local.set.mockImplementation((update, callback) => {
            chrome.runtime.lastError = { message: 'Storage quota exceeded' };
            callback?.();
            chrome.runtime.lastError = null;
        });

        bridge.importSettingsData({
            type: 'GeminiNexus-Settings',
            settings: {
                geminiTheme: 'dark',
            },
        });

        await vi.waitFor(() =>
            expect(frame.postMessage).toHaveBeenCalledWith({
                action: 'DATA_IMPORT_RESULT',
                payload: {
                    kind: 'settings',
                    ok: false,
                    error: 'Storage quota exceeded',
                },
            })
        );
    });

    it('captures a selected display and forwards a still frame to the sandbox', async () => {
        const frame = createFrame();
        const state = createState();
        const bridge = new MessageBridge(frame, state);
        const track = { stop: vi.fn() };
        const drawImage = vi.fn();
        const video = {
            srcObject: null,
            videoWidth: 640,
            videoHeight: 360,
            play: vi.fn(() => Promise.resolve()),
            removeEventListener: vi.fn(),
            addEventListener: vi.fn((event, callback) => {
                if (event === 'loadedmetadata') callback();
            }),
        };
        const canvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => ({ drawImage })),
            toDataURL: vi.fn(() => 'data:image/png;base64,SCREEN'),
        };
        const originalCreateElement = document.createElement.bind(document);

        navigator.mediaDevices = {
            getDisplayMedia: vi.fn(() =>
                Promise.resolve({
                    getTracks: () => [track],
                })
            ),
        };
        vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName === 'video') return video;
            if (tagName === 'canvas') return canvas;
            return originalCreateElement(tagName);
        });

        bridge.handleWindowMessage({
            source: frame.getWindow(),
            data: { action: 'REQUEST_SCREEN_CAPTURE' },
        });

        await vi.waitFor(() =>
            expect(frame.postMessage).toHaveBeenCalledWith({
                action: 'BACKGROUND_MESSAGE',
                payload: {
                    action: 'FETCH_IMAGE_RESULT',
                    base64: 'data:image/png;base64,SCREEN',
                    type: 'image/png',
                    name: 'screen_capture.png',
                },
            })
        );
        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
            video: true,
            audio: false,
        });
        expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 360);
        expect(track.stop).toHaveBeenCalled();
    });
});
