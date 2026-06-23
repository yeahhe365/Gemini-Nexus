// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionManager } from '../core/session_manager.js';
import { AppController } from './app_controller.js';
import { saveSessionsToStorage, sendToBackground } from '../../shared/messaging/index.js';

vi.mock('../render/message.js', () => ({
    appendMessage: vi.fn(),
}));

vi.mock('../render/context_compression.js', () => ({
    appendContextCompressionNotice: vi.fn(),
}));

vi.mock('../../shared/dom/crop_image.js', () => ({
    cropImage: vi.fn(),
}));

vi.mock('../../shared/messaging/index.js', () => ({
    downloadTextFile: vi.fn(),
    saveGroupsToStorage: vi.fn(),
    saveSessionsToStorage: vi.fn(),
    sendToBackground: vi.fn(),
}));

vi.mock('../core/i18n.js', () => ({
    t: (key) => key,
}));

function createUi() {
    const inputFn = document.createElement('textarea');
    inputFn.focus = vi.fn();

    return {
        chat: { togglePageContext: vi.fn(), toggleLiveArtifacts: vi.fn() },
        clearChatHistory: vi.fn(),
        historyDiv: document.createElement('div'),
        inputFn,
        modelSelect: { value: 'gemini-test' },
        renderHistoryList: vi.fn(),
        getInputValue: vi.fn(() => inputFn.value),
        setInputValue: vi.fn((value) => {
            inputFn.value = value;
        }),
        resetInput: vi.fn(() => {
            inputFn.value = '';
        }),
        getChatScrollState: vi.fn(() => ({ scrollTop: 120, isNearBottom: false })),
        restoreChatScrollState: vi.fn(),
        scrollToBottom: vi.fn(),
        settings: {
            connectionData: { provider: 'web' },
            updateContextSettings: vi.fn(),
            updateConnectionSettings: vi.fn(),
            updateSidebarBehavior: vi.fn(),
            updateSidePanelScope: vi.fn(),
        },
        setBrowserControlVisible: vi.fn(),
        setPageContextAvailable: vi.fn(),
        setLoading: vi.fn(),
        updateBrowserControlState: vi.fn(),
        updateWebThinkingToggle: vi.fn(),
        setBrowserControlCallbacks: vi.fn(),
        updateModelList: vi.fn(),
        openTabSelector: vi.fn(),
        updateStatus: vi.fn(),
    };
}

function createAppHarness() {
    const sessionManager = new SessionManager();
    const ui = createUi();
    const imageManager = {
        getFiles: vi.fn(() => []),
        clearFile: vi.fn(),
    };
    const app = new AppController(sessionManager, ui, imageManager);
    return { app, sessionManager, ui };
}

function restoreEvent(payload) {
    return {
        data: {
            action: 'RESTORE_SESSIONS',
            payload,
        },
    };
}

function realSession(overrides = {}) {
    return {
        id: 'real',
        title: 'Real chat',
        timestamp: 100,
        messages: [{ role: 'user', text: 'Hello' }],
        context: null,
        ...overrides,
    };
}

describe('AppController session restore behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
    });

    it('restores a valid remembered-tab bound session', async () => {
        const { app, sessionManager, ui } = createAppHarness();
        app.currentTabId = 123;
        app.boundSessionId = 'real';
        app.sidePanelScope = 'remembered_tabs';

        await app.handleIncomingMessage(restoreEvent([realSession()]));

        expect(sessionManager.currentSessionId).toBe('real');
        expect(app.boundSessionId).toBe('real');
        expect(window.parent.postMessage).toHaveBeenCalledWith(
            {
                action: 'SAVE_SIDE_PANEL_SESSION_BINDING',
                payload: {
                    tabId: 123,
                    sessionId: 'real',
                },
            },
            '*'
        );
        expect(ui.clearChatHistory).toHaveBeenCalled();
    });

    it('falls back to draft when a remembered-tab binding points to a removed blank session', async () => {
        const { app, sessionManager, ui } = createAppHarness();
        app.currentTabId = 123;
        app.boundSessionId = 'blank';
        app.sidePanelScope = 'remembered_tabs';

        await app.handleIncomingMessage(
            restoreEvent([
                {
                    id: 'blank',
                    title: 'New Chat',
                    timestamp: 200,
                    messages: [],
                },
                realSession(),
            ])
        );

        expect(sessionManager.currentSessionId).toBeNull();
        expect(sessionManager.sessions).toEqual([expect.objectContaining({ id: 'real' })]);
        expect(saveSessionsToStorage).toHaveBeenCalledWith(
            [expect.objectContaining({ id: 'real' })],
            { type: 'pruneSessions' }
        );
        expect(window.parent.postMessage).toHaveBeenCalledWith(
            {
                action: 'SAVE_SIDE_PANEL_SESSION_BINDING',
                payload: {
                    tabId: 123,
                    sessionId: null,
                },
            },
            '*'
        );
        expect(ui.clearChatHistory).toHaveBeenCalled();
    });

    it('restores the active tab binding after sessions are already loaded', async () => {
        const { app, sessionManager } = createAppHarness();
        app.sidePanelScope = 'remembered_tabs';

        await app.handleIncomingMessage(restoreEvent([realSession()]));
        expect(sessionManager.currentSessionId).toBeNull();

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: {
                    tabId: 123,
                    sessionId: 'real',
                },
            },
        });

        expect(app.currentTabId).toBe(123);
        expect(sessionManager.currentSessionId).toBe('real');
    });

    it('restores unsent composer drafts when returning to a remembered browser tab', async () => {
        const { app, sessionManager, ui } = createAppHarness();
        app.sidePanelScope = 'remembered_tabs';

        await app.handleIncomingMessage(
            restoreEvent([
                realSession({ id: 'session-1', title: 'Tab one' }),
                realSession({ id: 'session-2', title: 'Tab two' }),
            ])
        );

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 1, sessionId: 'session-1' },
            },
        });
        ui.inputFn.value = 'draft for tab one\nsecond line';

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 2, sessionId: 'session-2' },
            },
        });
        expect(sessionManager.currentSessionId).toBe('session-2');
        expect(ui.inputFn.value).toBe('');

        ui.inputFn.value = 'draft for tab two';

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 1, sessionId: 'session-1' },
            },
        });
        expect(sessionManager.currentSessionId).toBe('session-1');
        expect(ui.inputFn.value).toBe('draft for tab one\nsecond line');

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 2, sessionId: 'session-2' },
            },
        });
        expect(sessionManager.currentSessionId).toBe('session-2');
        expect(ui.inputFn.value).toBe('draft for tab two');
    });

    it('removes a cached composer draft when the user clears the input', async () => {
        const { app, ui } = createAppHarness();
        app.sidePanelScope = 'remembered_tabs';

        await app.handleIncomingMessage(restoreEvent([realSession({ id: 'session-1' })]));
        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 1, sessionId: 'session-1' },
            },
        });
        ui.inputFn.value = 'temporary draft';

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 2, sessionId: null },
            },
        });
        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 1, sessionId: 'session-1' },
            },
        });
        expect(ui.inputFn.value).toBe('temporary draft');

        ui.inputFn.value = '';
        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 2, sessionId: null },
            },
        });
        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 1, sessionId: 'session-1' },
            },
        });

        expect(ui.inputFn.value).toBe('');
    });

    it('updates page-context availability from restored tab context', async () => {
        const { app, ui } = createAppHarness();

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: 123 },
            },
        });
        expect(ui.setPageContextAvailable).toHaveBeenCalledWith(true);

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
                payload: { tabId: null },
            },
        });
        expect(ui.setPageContextAvailable).toHaveBeenCalledWith(false);
    });

    it('restores saved groups and rerenders history after sessions are loaded', async () => {
        const { app, sessionManager, ui } = createAppHarness();

        await app.handleIncomingMessage(restoreEvent([realSession()]));
        ui.renderHistoryList.mockClear();

        await app.handleIncomingMessage({
            data: {
                action: 'RESTORE_GROUPS',
                payload: [{ id: 'group-1', title: 'Work', timestamp: 1, isExpanded: false }],
            },
        });

        expect(sessionManager.groups).toEqual([
            { id: 'group-1', title: 'Work', timestamp: 1, isExpanded: false },
        ]);
        expect(ui.renderHistoryList).toHaveBeenCalledWith(
            [expect.objectContaining({ id: 'real' })],
            [expect.objectContaining({ id: 'group-1' })],
            sessionManager.currentSessionId,
            expect.objectContaining({ onAddGroup: expect.any(Function) }),
            { isGenerating: false, generatingSessionId: null }
        );
    });

    it('rerenders the current chat when storage updates add an AI reply', async () => {
        const { app, sessionManager, ui } = createAppHarness();
        const markRendered = vi.spyOn(app.messageHandler, 'markSessionRenderedFromStorage');
        app.sidePanelScope = 'remembered_tabs';
        sessionManager.setSessions([realSession()]);
        sessionManager.setCurrentId('real');

        await app.handleIncomingMessage(
            restoreEvent([
                realSession({
                    messages: [
                        { role: 'user', text: 'Hello' },
                        { role: 'ai', text: 'Hi there' },
                    ],
                }),
            ])
        );

        expect(sessionManager.currentSessionId).toBe('real');
        expect(ui.clearChatHistory).toHaveBeenCalled();
        expect(ui.getChatScrollState).toHaveBeenCalled();
        expect(ui.restoreChatScrollState).toHaveBeenCalledWith({
            scrollTop: 120,
            isNearBottom: false,
        });
        expect(ui.scrollToBottom).not.toHaveBeenCalled();
        expect(markRendered).toHaveBeenCalledWith('real', 2);
    });

    it('saves model changes with the active provider so OpenAI selection can persist separately', () => {
        const { app, ui } = createAppHarness();
        ui.settings.connectionData.provider = 'openai';

        app.handleModelChange('gpt-5');

        expect(window.parent.postMessage).toHaveBeenCalledWith(
            {
                action: 'SAVE_MODEL',
                payload: {
                    provider: 'openai',
                    model: 'gpt-5',
                },
            },
            '*'
        );
    });

    it('toggles Gemini Web thinking between high and the model fast level', () => {
        const { app, ui } = createAppHarness();
        ui.modelSelect.value = '8c46e95b1a07cecc';
        ui.settings.connectionData = { provider: 'web', webThinkingLevel: 'high' };

        app.handleWebThinkingToggle();

        expect(ui.settings.connectionData.webThinkingLevel).toBe('minimal');
        expect(ui.updateWebThinkingToggle).toHaveBeenCalledWith(ui.settings.connectionData);
        expect(window.parent.postMessage).toHaveBeenCalledWith(
            {
                action: 'SAVE_WEB_THINKING_LEVEL',
                payload: 'minimal',
            },
            '*'
        );

        app.handleWebThinkingToggle();

        expect(ui.settings.connectionData.webThinkingLevel).toBe('high');
        expect(window.parent.postMessage).toHaveBeenCalledWith(
            {
                action: 'SAVE_WEB_THINKING_LEVEL',
                payload: 'high',
            },
            '*'
        );
    });

    it('does not toggle Web thinking for non-Web providers', () => {
        const { app, ui } = createAppHarness();
        ui.settings.connectionData = { provider: 'official', webThinkingLevel: 'high' };

        app.handleWebThinkingToggle();

        expect(window.parent.postMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: 'SAVE_WEB_THINKING_LEVEL' }),
            '*'
        );
        expect(ui.updateWebThinkingToggle).toHaveBeenCalledWith(ui.settings.connectionData);
    });

    it('toggles Live Artifacts mode and updates the chat tool state', () => {
        const { app, ui } = createAppHarness();

        app.toggleLiveArtifacts();

        expect(app.liveArtifactsEnabled).toBe(true);
        expect(ui.chat.toggleLiveArtifacts).toHaveBeenCalledWith(true);

        app.toggleLiveArtifacts(false);

        expect(app.liveArtifactsEnabled).toBe(false);
        expect(ui.chat.toggleLiveArtifacts).toHaveBeenLastCalledWith(false);
    });

    it('formats Live Artifact follow-up payloads and sends them back into the current chat', async () => {
        const { app } = createAppHarness();
        const sendText = vi.spyOn(app.prompt, 'sendText').mockResolvedValue();

        await app.handleLiveArtifactFollowUp({
            instruction: '继续细化第二个方案',
            title: '方案矩阵',
            state: { selected: 'B' },
        });

        expect(sendText).toHaveBeenCalledWith(
            expect.stringContaining('请根据 Live Artifact 中的交互选择继续处理。')
        );
        expect(sendText).toHaveBeenCalledWith(expect.stringContaining('继续细化第二个方案'));
        expect(sendText).toHaveBeenCalledWith(expect.stringContaining('"selected": "B"'));
    });

    it('sends the standalone host flag when enabling browser control', () => {
        const { app, ui } = createAppHarness();

        app.setHostContext({ isTab: true });
        app.toggleBrowserControl(true);

        expect(app.browserControlActive).toBe(true);
        expect(ui.setBrowserControlVisible).toHaveBeenCalledWith(true);
        expect(sendToBackground).toHaveBeenCalledWith({
            action: 'TOGGLE_BROWSER_CONTROL',
            enabled: true,
            hostIsTab: true,
        });
    });

    it('rolls back optimistic browser control UI when background enable fails', async () => {
        const { app, ui } = createAppHarness();
        const button = document.createElement('button');
        button.id = 'browser-control-btn';
        document.body.appendChild(button);

        app.toggleBrowserControl(true);
        expect(app.browserControlActive).toBe(true);
        expect(button.classList.contains('active')).toBe(true);

        await app.handleIncomingMessage({
            data: {
                action: 'BACKGROUND_MESSAGE',
                payload: {
                    action: 'BROWSER_CONTROL_TOGGLE_RESULT',
                    enabled: true,
                    status: 'error',
                    error: 'No controllable browser tab is selected.',
                },
            },
        });

        expect(app.browserControlActive).toBe(false);
        expect(button.classList.contains('active')).toBe(false);
        expect(ui.setBrowserControlVisible).toHaveBeenLastCalledWith(false);
        expect(ui.updateStatus).toHaveBeenCalledWith('No controllable browser tab is selected.');
    });

    it('shows generic background request errors from the side panel bridge', async () => {
        const { app, ui } = createAppHarness();

        await app.handleIncomingMessage({
            data: {
                action: 'BACKGROUND_MESSAGE',
                payload: {
                    action: 'BACKGROUND_REQUEST_ERROR',
                    requestAction: 'GET_OPEN_TABS',
                    error: 'Side panel unavailable',
                },
            },
        });

        expect(ui.updateStatus).toHaveBeenCalledWith('Side panel unavailable');
    });

    it('shows open-tabs result errors instead of opening an empty selector', async () => {
        const { app, ui } = createAppHarness();

        await app.handleIncomingMessage({
            data: {
                action: 'BACKGROUND_MESSAGE',
                payload: {
                    action: 'OPEN_TABS_RESULT',
                    tabs: [],
                    lockedTabId: 1,
                    error: 'Tabs unavailable',
                },
            },
        });

        expect(ui.updateStatus).toHaveBeenCalledWith('Tabs unavailable');
        expect(ui.openTabSelector).not.toHaveBeenCalled();
    });

    it('forwards locked tab updates to the browser control bar state', async () => {
        const { app, ui } = createAppHarness();

        await app.handleIncomingMessage({
            data: {
                action: 'BACKGROUND_MESSAGE',
                payload: {
                    action: 'TAB_LOCKED',
                    attached: true,
                    tab: {
                        id: 7,
                        title: 'OpenAI News',
                        url: 'https://openai.com/news/',
                        controllable: true,
                    },
                },
            },
        });

        expect(ui.updateBrowserControlState).toHaveBeenCalledWith({
            attached: true,
            tab: {
                id: 7,
                title: 'OpenAI News',
                url: 'https://openai.com/news/',
                controllable: true,
            },
        });
    });

    it('ignores malformed incoming window messages', async () => {
        const { app, ui } = createAppHarness();

        await app.handleIncomingMessage({ data: null });
        await app.handleIncomingMessage({
            data: {
                action: 'BACKGROUND_MESSAGE',
                payload: null,
            },
        });

        expect(ui.updateBrowserControlState).not.toHaveBeenCalled();
        expect(ui.updateStatus).not.toHaveBeenCalled();
    });
});
