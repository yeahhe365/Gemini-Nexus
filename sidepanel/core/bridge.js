import {
    DEFAULT_CONTEXT_MODE,
    normalizeContextRecentTurns,
} from '../../shared/config/constants.js';
import { createConnectionStorageUpdate } from '../../shared/settings/connection.js';
import { getDedicatedApiStorageKeys } from '../../shared/settings/dedicated_providers.js';
import {
    mergeSessionSaveWithCurrent,
    normalizeDeletedSessionIds,
    normalizeSessionSavePayload,
} from './session_merge.js';
import { captureDisplayStill } from './screen_capture.js';
import { handleWindowMessageAction } from './window_actions.js';
import {
    forwardToBackground as forwardPayloadToBackground,
    isMessageForCurrentTab,
} from './background_forwarding.js';
import {
    importHistoryData as importHistoryDataPayload,
    importSettingsData as importSettingsDataPayload,
} from './data_import.js';
import {
    getRuntimeLastError,
    restoreConnectionSettings,
    restoreSidebarExpanded,
    saveSidePanelInputDraft,
    saveSidePanelSessionBinding,
} from './bridge_storage.js';

function getModelSaveKey(payload) {
    if (payload && typeof payload === 'object') {
        const dedicatedKeys = getDedicatedApiStorageKeys(payload.provider);
        if (dedicatedKeys) return dedicatedKeys.selectedModel;
        return payload.provider === 'openai' ? 'geminiOpenaiSelectedModel' : 'geminiModel';
    }

    return 'geminiModel';
}

function getModelSaveValue(payload) {
    if (payload && typeof payload === 'object') {
        return payload.model;
    }

    return payload;
}

export class MessageBridge {
    constructor(frameManager, stateManager) {
        this.frame = frameManager;
        this.state = stateManager;
    }

    init() {
        window.addEventListener('message', this.handleWindowMessage.bind(this));
        chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));
    }

    handleWindowMessage(event) {
        // Security check: Only accept messages from our direct iframe
        if (!this.frame.isWindow(event.source)) return;

        const { action, payload } = event.data || {};
        if (!action) return;

        handleWindowMessageAction(action, payload, this);
    }

    openFullPage() {
        const url = chrome.runtime.getURL('sidepanel/index.html?standalone=1');
        chrome.tabs.create({ url });
    }

    openSettingsPage() {
        this.isRunningInTab()
            .then((isTab) => {
                if (isTab) {
                    this.frame.postMessage({ action: 'OPEN_SETTINGS_MODAL' });
                    return;
                }

                const url = chrome.runtime.getURL('settings/index.html');
                chrome.tabs.create({ url });
            })
            .catch(() => {
                const url = chrome.runtime.getURL('settings/index.html');
                chrome.tabs.create({ url });
            });
    }

    isRunningInTab() {
        return new Promise((resolve) => {
            if (!chrome.tabs || typeof chrome.tabs.getCurrent !== 'function') {
                this.state.setHostTabId?.(null);
                resolve(false);
                return;
            }

            chrome.tabs.getCurrent((tab) => {
                const tabId = Number.isInteger(tab?.id) && tab.id > 0 ? tab.id : null;
                this.state.setHostTabId?.(tabId);
                resolve(Boolean(tabId));
            });
        });
    }

    openExternalUrl(payload) {
        const url = payload?.url;
        if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
            chrome.tabs.create({ url });
        }
    }

    requestScreenCapture() {
        captureDisplayStill()
            .then((payload) => {
                this.postBackgroundMessage(payload);
            })
            .catch((error) => {
                this.postBackgroundMessage({
                    action: 'SCREEN_CAPTURE_ERROR',
                    error: error?.message || 'Screen capture failed',
                });
            });
    }

    forwardToBackground(payload) {
        forwardPayloadToBackground(this, payload);
    }

    restoreConnectionSettings() {
        restoreConnectionSettings(this.frame);
    }

    restoreSidebarExpanded() {
        restoreSidebarExpanded(this.frame);
    }

    saveSidebarExpanded(payload) {
        this.state.save('geminiSidebarExpanded', payload !== false);
    }

    saveSelectedModel(payload) {
        const model = getModelSaveValue(payload);
        if (typeof model === 'string' && model.trim()) {
            this.state.save(getModelSaveKey(payload), model);
        }
    }

    saveSidePanelSessionBinding(payload) {
        saveSidePanelSessionBinding(payload);
    }

    saveSidePanelInputDraft(payload) {
        saveSidePanelInputDraft(payload);
    }

    saveContextSettings(payload) {
        const storageUpdate = {
            geminiContextMode: payload?.mode === 'recent' ? 'recent' : DEFAULT_CONTEXT_MODE,
            geminiContextRecentTurns: normalizeContextRecentTurns(payload?.recentTurns),
        };
        if (typeof this.state.saveMany === 'function') {
            this.state.saveMany(storageUpdate);
            return;
        }

        for (const [key, value] of Object.entries(storageUpdate)) {
            this.state.save(key, value);
        }
    }

    saveConnectionSettings(payload) {
        const storageUpdate = createConnectionStorageUpdate(payload);
        if (typeof this.state.saveMany === 'function') {
            this.state.saveMany(storageUpdate);
            return;
        }

        for (const [key, value] of Object.entries(storageUpdate)) {
            this.state.save(key, value);
        }
    }

    importHistoryData(payload) {
        importHistoryDataPayload(this.frame, payload);
    }

    importSettingsData(payload) {
        importSettingsDataPayload(this.frame, payload);
    }

    postBackgroundMessage(payload) {
        this.frame.postMessage({
            action: 'BACKGROUND_MESSAGE',
            payload,
        });
    }

    saveSessionsSafely(payload) {
        const { sessions, mutation } = normalizeSessionSavePayload(payload);
        if (!Array.isArray(sessions)) {
            this.state.save('geminiSessions', sessions);
            return;
        }

        chrome.storage.local.get(['geminiSessions', 'geminiDeletedSessionIds'], (result) => {
            const readError = getRuntimeLastError();
            if (readError) {
                console.warn('Unable to save sessions after storage read failed:', readError);
                return;
            }

            const deletedSessionIds = normalizeDeletedSessionIds(result?.geminiDeletedSessionIds);
            if (mutation?.type === 'deleteSession' && mutation.sessionId) {
                deletedSessionIds[mutation.sessionId] = Date.now();
            }

            const merged = mergeSessionSaveWithCurrent(
                sessions,
                result?.geminiSessions,
                mutation,
                deletedSessionIds
            );
            if (
                mutation?.type === 'deleteSession' &&
                mutation.sessionId &&
                typeof this.state.saveMany === 'function'
            ) {
                this.state.saveMany({
                    geminiSessions: merged,
                    geminiDeletedSessionIds: deletedSessionIds,
                });
                return;
            }

            this.state.save('geminiSessions', merged);
        });
    }

    handleRuntimeMessage(message) {
        if (!isMessageForCurrentTab(this.state, message)) return;

        if (message.action === 'SESSIONS_UPDATED') {
            this.state.updateSessions(message.sessions);
            this.frame.postMessage({
                action: 'RESTORE_SESSIONS',
                payload: message.sessions,
            });
            return;
        }

        this.frame.postMessage({
            action: 'BACKGROUND_MESSAGE',
            payload: message,
        });
    }
}
