import { MessageHandler } from './message_handler.js';
import { SessionFlowController } from './session_flow.js';
import { PromptController } from './prompt.js';
import { t } from '../core/i18n.js';
import { saveSessionsToStorage, sendToBackground } from '../../shared/messaging/index.js';
import {
    DEFAULT_PROVIDER,
    DEFAULT_SIDE_PANEL_SCOPE,
    DEFAULT_STORED_GEMINI_MODEL,
} from '../../shared/config/constants.js';
import {
    getNextWebThinkingLevel,
    normalizeWebThinkingLevelForModel,
} from '../../shared/models/web_thinking.js';
import { isDedicatedApiProvider } from '../../shared/settings/dedicated_providers.js';
import { formatLiveArtifactFollowupPrompt } from '../core/live_artifacts.js';

export class AppController {
    constructor(sessionManager, uiController, imageManager) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;

        this.captureMode = 'snip';
        this.generatingSessions = new Map();
        this.isGenerating = false;
        this.generatingSessionId = null;
        this.pageContextActive = false;
        this.browserControlActive = false;
        this.liveArtifactsEnabled = false;
        this.sidePanelScope = DEFAULT_SIDE_PANEL_SCOPE;
        this.currentTabId = null;
        this.currentTabUrl = '';
        this.currentTabTitle = '';
        this.boundSessionId = null;
        this.hostIsTab = false;
        this.sessionsRestored = false;
        this.inputDrafts = new Map();
        this.isVisible = true;

        // Sidebar Restore Behavior: 'auto', 'restore', 'new'
        this.sidebarRestoreBehavior = 'auto';

        this.messageHandler = new MessageHandler(sessionManager, uiController, imageManager, this);

        this.sessionFlow = new SessionFlowController(sessionManager, uiController, this);
        this.prompt = new PromptController(sessionManager, uiController, imageManager, this);

        this.ui.inputFn?.addEventListener?.('input', () => this.saveCurrentInputDraft());

        document.addEventListener('gemini-provider-changed', () => {
            if (!this.isCurrentSessionGenerating()) this.rerender();
        });

        if (this.ui.setBrowserControlCallbacks) {
            this.ui.setBrowserControlCallbacks({
                onChoose: () => this.handleTabSwitcher(),
                onStop: () => this.toggleBrowserControl(false),
            });
        }
    }

    setCaptureMode(mode) {
        this.captureMode = mode;
    }

    syncLegacyGenerationState() {
        const generatingSessionIds = this.getGeneratingSessionIds();
        this.isGenerating = generatingSessionIds.length > 0;
        this.generatingSessionId = generatingSessionIds[0] || null;
    }

    startSessionGeneration(sessionId, metadata = {}) {
        if (!sessionId) return;
        this.generatingSessions.set(sessionId, {
            sessionId,
            startedAt: Date.now(),
            ...metadata,
        });
        this.syncLegacyGenerationState();
    }

    finishSessionGeneration(sessionId) {
        if (!sessionId) return;
        this.generatingSessions.delete(sessionId);
        this.syncLegacyGenerationState();
    }

    cancelSessionGeneration(sessionId) {
        this.finishSessionGeneration(sessionId);
    }

    isSessionGenerating(sessionId) {
        return !!sessionId && this.generatingSessions.has(sessionId);
    }

    hasActiveGenerations() {
        return this.generatingSessions.size > 0;
    }

    getGeneratingSessionIds() {
        return Array.from(this.generatingSessions.keys());
    }

    isCurrentSessionGenerating() {
        return this.isSessionGenerating(this.sessionManager.currentSessionId);
    }

    togglePageContext() {
        this.pageContextActive = !this.pageContextActive;
        this.ui.chat.togglePageContext(this.pageContextActive);

        if (this.pageContextActive) {
            this._checkPageContent();
        }
    }

    _checkPageContent() {
        this.ui.updateStatus(t('readingPage'));
        sendToBackground({ action: 'CHECK_PAGE_CONTEXT' });
    }

    toggleLiveArtifacts(forceState = null) {
        const nextState = forceState === null ? !this.liveArtifactsEnabled : forceState === true;
        this.liveArtifactsEnabled = nextState;
        this.ui.chat.toggleLiveArtifacts?.(this.liveArtifactsEnabled);
    }

    getUiLanguage() {
        const lang = document.documentElement.lang || '';
        return lang.toLowerCase().startsWith('en') ? 'en' : 'zh';
    }

    async handleLiveArtifactFollowUp(payload) {
        const prompt = formatLiveArtifactFollowupPrompt(payload, this.getUiLanguage());
        if (!prompt) return false;

        await this.prompt.sendText(prompt);
        return true;
    }

    setBrowserControlActiveState(active) {
        this.browserControlActive = active === true;

        const browserControlButton = document.getElementById('browser-control-btn');
        if (browserControlButton) {
            browserControlButton.classList.toggle('active', this.browserControlActive);
        }

        this.ui.setBrowserControlVisible(this.browserControlActive);
    }

    toggleBrowserControl(forceState = null) {
        if (forceState !== null) {
            if (this.browserControlActive === forceState) return;
            this.setBrowserControlActiveState(forceState);
        } else {
            this.setBrowserControlActiveState(!this.browserControlActive);
        }

        // Signal background to start/stop debugger session immediately
        sendToBackground({
            action: 'TOGGLE_BROWSER_CONTROL',
            enabled: this.browserControlActive,
            hostIsTab: this.hostIsTab,
        });
    }

    handleTabSwitcher() {
        sendToBackground({ action: 'GET_OPEN_TABS' });
    }

    handleTabSelected(tabId, shouldSwitch = true) {
        sendToBackground({ action: 'SWITCH_TAB', tabId: tabId, switchVisual: shouldSwitch });
    }

    handleNewChat() {
        this.sessionFlow.handleNewChat();
    }

    switchToSession(sessionId) {
        this.sessionFlow.switchToSession(sessionId);
    }

    rerender() {
        const currentId = this.sessionManager.currentSessionId;
        if (currentId) {
            this.switchToSession(currentId);
        }
    }

    getSelectedModel() {
        return this.ui.modelSelect ? this.ui.modelSelect.value : DEFAULT_STORED_GEMINI_MODEL;
    }

    getConnectionProvider() {
        const connectionData = this.ui.settings?.connectionData;
        if (connectionData?.provider) return connectionData.provider;
        return connectionData?.useOfficialApi === true ? 'official' : DEFAULT_PROVIDER;
    }

    setHostContext(context = {}) {
        this.hostIsTab = context.isTab === true;
    }

    handleVisibilityChange(payload) {
        const visible = payload?.visible === true;
        this.isVisible = visible;

        if (visible) {
            console.log('[Gemini Nexus] Sandbox became visible, resuming');
            // When becoming visible, ensure the UI is properly displayed
            // The streaming state is preserved, so ongoing streams will continue
        } else {
            this.saveCurrentInputDraft();
            console.log('[Gemini Nexus] Sandbox became hidden (tab switched away)');
            // When hidden, we keep the state but don't need to do anything special
            // Fetch streams will continue in the background
        }
    }

    handleModelChange(model) {
        // Save model to current session if exists
        const currentSessionId = this.sessionManager.currentSessionId;
        if (currentSessionId) {
            this.sessionManager.setSessionModel(currentSessionId, model);
            saveSessionsToStorage(this.sessionManager.getPersistableSessions(), {
                type: 'updateSessionMetadata',
                sessionId: currentSessionId,
                fields: ['model'],
            });
        }

        const connectionData = this.ui.settings?.connectionData;
        const provider =
            connectionData?.provider ||
            (connectionData?.useOfficialApi === true ? 'official' : DEFAULT_PROVIDER);
        if (provider === 'openai' && connectionData) {
            connectionData.openaiSelectedModel = model;
        }
        if (isDedicatedApiProvider(provider) && connectionData) {
            const providers = connectionData.dedicatedApiProviders || {};
            const current = providers[provider] || { provider };
            connectionData.dedicatedApiProviders = {
                ...providers,
                [provider]: {
                    ...current,
                    selectedModel: model,
                },
            };
        }
        if (provider === 'web') {
            this.syncWebThinkingForModel(model, { saveIfChanged: true });
        }
        window.parent.postMessage(
            {
                action: 'SAVE_MODEL',
                payload: { provider, model },
            },
            '*'
        );
    }

    syncWebThinkingForModel(model = this.getSelectedModel(), { saveIfChanged = false } = {}) {
        const connectionData = this.ui.settings?.connectionData;
        if (!connectionData) return null;

        const provider =
            connectionData.provider ||
            (connectionData.useOfficialApi === true ? 'official' : DEFAULT_PROVIDER);
        if (provider !== 'web') {
            this.ui.updateWebThinkingToggle?.(connectionData);
            return null;
        }

        const previousLevel = connectionData.webThinkingLevel;
        const nextLevel = normalizeWebThinkingLevelForModel(model, previousLevel);
        connectionData.webThinkingLevel = nextLevel;
        this.ui.updateWebThinkingToggle?.(connectionData);

        if (saveIfChanged && previousLevel && previousLevel !== nextLevel) {
            window.parent.postMessage(
                {
                    action: 'SAVE_WEB_THINKING_LEVEL',
                    payload: nextLevel,
                },
                '*'
            );
        }

        return nextLevel;
    }

    handleWebThinkingToggle() {
        const connectionData = this.ui.settings?.connectionData;
        if (!connectionData) return;

        const provider =
            connectionData.provider ||
            (connectionData.useOfficialApi === true ? 'official' : DEFAULT_PROVIDER);
        if (provider !== 'web') {
            this.ui.updateWebThinkingToggle?.(connectionData);
            return;
        }

        const model = this.getSelectedModel();
        const nextLevel = getNextWebThinkingLevel(model, connectionData.webThinkingLevel);
        connectionData.webThinkingLevel = nextLevel;
        this.ui.updateWebThinkingToggle?.(connectionData);
        window.parent.postMessage(
            {
                action: 'SAVE_WEB_THINKING_LEVEL',
                payload: nextLevel,
            },
            '*'
        );
    }

    handleDeleteSession(sessionId) {
        this.sessionFlow.handleDeleteSession(sessionId);
    }

    handleCancel() {
        this.prompt.cancel();
    }

    handleSendMessage() {
        this.prompt.send();
    }

    saveCurrentTabSessionBinding(sessionId) {
        if (!Number.isInteger(this.currentTabId) || this.currentTabId <= 0) return;
        window.parent.postMessage(
            {
                action: 'SAVE_SIDE_PANEL_SESSION_BINDING',
                payload: {
                    tabId: this.currentTabId,
                    sessionId,
                },
            },
            '*'
        );
    }

    getInputDraftKey(tabId = this.currentTabId, sessionId = this.sessionManager.currentSessionId) {
        if (!Number.isInteger(tabId) || tabId <= 0) return null;
        return sessionId ? `tab:${tabId}|session:${sessionId}` : `tab:${tabId}|draft`;
    }

    postInputDraftToHost(tabId, sessionId, value) {
        if (!Number.isInteger(tabId) || tabId <= 0) return;
        window.parent.postMessage(
            {
                action: 'SAVE_SIDE_PANEL_INPUT_DRAFT',
                payload: {
                    tabId,
                    sessionId: sessionId || null,
                    value,
                },
            },
            '*'
        );
    }

    saveInputDraftForContext(tabId, sessionId, value) {
        const key = this.getInputDraftKey(tabId, sessionId);
        if (!key) return;

        if (value) {
            this.inputDrafts.set(key, value);
        } else {
            this.inputDrafts.delete(key);
        }
        this.postInputDraftToHost(tabId, sessionId, value);
    }

    saveCurrentInputDraft() {
        const value = this.ui.getInputValue?.() ?? this.ui.inputFn?.value ?? '';
        this.saveInputDraftForContext(this.currentTabId, this.sessionManager.currentSessionId, value);
    }

    restoreCurrentInputDraft() {
        const key = this.getInputDraftKey();
        if (!key) return;

        const value = this.inputDrafts.get(key) || '';
        if (this.ui.setInputValue) {
            this.ui.setInputValue(value);
        } else if (this.ui.inputFn) {
            this.ui.inputFn.value = value;
        }
    }

    clearInputDraftForContext(tabId = this.currentTabId, sessionId = this.sessionManager.currentSessionId) {
        const key = this.getInputDraftKey(tabId, sessionId);
        if (key) this.inputDrafts.delete(key);
        this.postInputDraftToHost(tabId, sessionId, '');
    }

    clearComposerDraftAfterSend(previousSessionId, currentSessionId) {
        const tabId = this.currentTabId;
        this.clearInputDraftForContext(tabId, previousSessionId);
        this.clearInputDraftForContext(tabId, currentSessionId);
    }

    getBoundSession() {
        return this.boundSessionId ? this.sessionManager.getSessionById(this.boundSessionId) : null;
    }

    restoreRememberedTabSession() {
        const boundSession = this.getBoundSession();
        if (boundSession) {
            if (this.sessionManager.currentSessionId !== boundSession.id) {
                this.switchToSession(boundSession.id);
            }
            return;
        }

        this.sessionFlow.enterDraft();
    }

    getMessageCount(session) {
        return Array.isArray(session?.messages) ? session.messages.length : 0;
    }

    hasNewAiMessage(session, previousMessageCount) {
        const messages = Array.isArray(session?.messages) ? session.messages : [];
        if (messages.length <= previousMessageCount) return false;
        return messages.slice(previousMessageCount).some((message) => message?.role === 'ai');
    }

    syncCurrentSessionFromStorage(sessionId, previousMessageCount) {
        const session = this.sessionManager.getSessionById(sessionId);
        if (!this.hasNewAiMessage(session, previousMessageCount)) return false;

        const scrollState = this.ui.getChatScrollState ? this.ui.getChatScrollState() : null;
        this.sessionFlow.switchToSession(sessionId, { restoreScrollState: scrollState });
        this.messageHandler.markSessionRenderedFromStorage(
            sessionId,
            this.getMessageCount(session)
        );
        return true;
    }

    async handleIncomingMessage(event) {
        const { action, payload } = event.data || {};
        if (!action) return;

        if (action === 'RESTORE_SIDEBAR_BEHAVIOR') {
            this.sidebarRestoreBehavior = payload;
            this.ui.settings.updateSidebarBehavior(payload);
            return;
        }
        if (action === 'RESTORE_SIDE_PANEL_SCOPE') {
            this.sidePanelScope = payload || DEFAULT_SIDE_PANEL_SCOPE;
            this.ui.settings.updateSidePanelScope(payload);
            return;
        }
        if (action === 'RESTORE_CONTEXT_SETTINGS') {
            this.ui.settings.updateContextSettings(payload);
            return;
        }
        if (action === 'RESTORE_SIDE_PANEL_TAB_CONTEXT') {
            this.saveCurrentInputDraft();

            this.currentTabId = payload?.tabId || null;
            this.currentTabUrl = payload?.url || '';
            this.currentTabTitle = payload?.title || '';
            this.boundSessionId = payload?.sessionId || null;
            const draftKey = this.getInputDraftKey(this.currentTabId, this.boundSessionId);
            if (draftKey) {
                const draft = typeof payload?.draft === 'string' ? payload.draft : '';
                if (draft) this.inputDrafts.set(draftKey, draft);
                else this.inputDrafts.delete(draftKey);
            }
            this.ui.setPageContextAvailable?.(
                Number.isInteger(this.currentTabId) && this.currentTabId > 0
            );
            if (this.sessionsRestored && this.sidePanelScope === DEFAULT_SIDE_PANEL_SCOPE) {
                this.restoreRememberedTabSession();
                this.restoreCurrentInputDraft();
            }
            return;
        }
        if (action === 'RESTORE_GROUPS') {
            this.sessionManager.setGroups(payload);
            if (this.sessionsRestored) {
                this.sessionFlow.refreshHistoryUI();
            }
            return;
        }

        if (action === 'RESTORE_SESSIONS') {
            const restoredSessions = Array.isArray(payload) ? payload : [];
            const previousCurrentId = this.sessionManager.currentSessionId;
            const previousCurrentSession = this.sessionManager.getCurrentSession();
            const previousMessageCount = this.getMessageCount(previousCurrentSession);

            this.sessionManager.setSessions(restoredSessions);
            this.sessionsRestored = true;
            this.sessionFlow.refreshHistoryUI();
            if (this.sessionManager.sessions.length !== restoredSessions.length) {
                saveSessionsToStorage(this.sessionManager.getPersistableSessions(), {
                    type: 'pruneSessions',
                });
            }

            if (previousCurrentId && previousCurrentSession) {
                this.syncCurrentSessionFromStorage(previousCurrentId, previousMessageCount);
            }

            const currentId = this.sessionManager.currentSessionId;
            const currentSessionExists = this.sessionManager.getCurrentSession();

            // If we are initializing (no current session yet), apply the behavior logic
            if (!currentId || !currentSessionExists) {
                const sorted = this.sessionManager.getSortedSessions();

                let shouldRestore = false;

                if (this.sidebarRestoreBehavior === 'new') {
                    shouldRestore = false;
                } else if (this.sidebarRestoreBehavior === 'restore') {
                    shouldRestore = true;
                } else {
                    // 'auto' mode: Restore if last active within 10 minutes
                    if (sorted.length > 0) {
                        const lastActive = sorted[0].timestamp;
                        const now = Date.now();
                        const tenMinutes = 10 * 60 * 1000;
                        if (now - lastActive < tenMinutes) {
                            shouldRestore = true;
                        }
                    }
                }

                if (this.sidePanelScope === DEFAULT_SIDE_PANEL_SCOPE) {
                    this.restoreRememberedTabSession();
                    this.restoreCurrentInputDraft();
                } else if (shouldRestore && sorted.length > 0) {
                    this.switchToSession(sorted[0].id);
                } else {
                    this.handleNewChat();
                }
            }
            return;
        }

        if (action === 'RESTORE_CONNECTION_SETTINGS') {
            this.ui.settings.updateConnectionSettings(payload);
            // The model list depends on the full connection settings payload.
            this.ui.updateModelList(payload);
            return;
        }

        if (action === 'BACKGROUND_MESSAGE' && payload && typeof payload === 'object') {
            if (payload.action === 'SWITCH_SESSION') {
                this.switchToSession(payload.sessionId);
                return;
            }
            if (payload.action === 'ACTIVATE_BROWSER_CONTROL') {
                this.toggleBrowserControl(true);
                if (this.ui.inputFn) this.ui.inputFn.focus();
                return;
            }
            if (payload.action === 'BROWSER_CONTROL_TOGGLE_RESULT') {
                if (payload.status === 'error' && this.browserControlActive === payload.enabled) {
                    this.setBrowserControlActiveState(!payload.enabled);
                    this.ui.updateStatus(payload.error || 'Browser control could not be updated.');
                    setTimeout(() => {
                        if (!this.isCurrentSessionGenerating()) this.ui.updateStatus('');
                    }, 3000);
                }
                return;
            }
            if (payload.action === 'BACKGROUND_REQUEST_ERROR') {
                this.ui.updateStatus(payload.error || 'Background request failed.');
                setTimeout(() => {
                    if (!this.isCurrentSessionGenerating()) this.ui.updateStatus('');
                }, 3000);
                return;
            }
            if (payload.action === 'OPEN_TABS_RESULT') {
                if (payload.error) {
                    this.ui.updateStatus(payload.error);
                    setTimeout(() => {
                        if (!this.isCurrentSessionGenerating()) this.ui.updateStatus('');
                    }, 3000);
                    return;
                }
                this.ui.openTabSelector(
                    payload.tabs,
                    (tabId, shouldSwitch) => this.handleTabSelected(tabId, shouldSwitch),
                    payload.lockedTabId
                );
                return;
            }
            if (payload.action === 'TAB_LOCKED') {
                if (this.ui && this.ui.updateBrowserControlState) {
                    this.ui.updateBrowserControlState({
                        tab: payload.tab || null,
                        attached: payload.attached === true,
                    });
                } else if (this.ui && this.ui.tabSelector) {
                    this.ui.tabSelector.updateTrigger(payload.tab);
                }
                return;
            }
            if (payload.action === 'PAGE_CONTEXT_RESULT') {
                const pageContentLength = payload.length;
                const formattedLength = new Intl.NumberFormat().format(pageContentLength);
                const statusMessage = t('pageReadSuccess').replace('{count}', formattedLength);
                this.ui.updateStatus(statusMessage);
                setTimeout(() => {
                    if (!this.isCurrentSessionGenerating()) this.ui.updateStatus('');
                }, 3000);
                return;
            }

            await this.messageHandler.handle(payload);
        }
    }
}
