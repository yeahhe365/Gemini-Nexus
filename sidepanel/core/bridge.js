import {
    DEFAULT_CONTEXT_MODE,
    normalizeContextRecentTurns,
} from '../../shared/config/constants.js';
import { createConnectionStorageUpdate } from '../../shared/settings/connection.js';
import { getDedicatedApiStorageKeys } from '../../shared/settings/dedicated_providers.js';
import {
    buildHistoryImportStorageUpdate,
    buildSettingsImportStorageUpdate,
} from '../../shared/data_management/index.js';
import {
    mergeSessionSaveWithCurrent,
    normalizeDeletedSessionIds,
    normalizeSessionSavePayload,
} from './session_merge.js';
import { captureDisplayStill } from './screen_capture.js';
import { handleWindowMessageAction } from './window_actions.js';
import {
    getRuntimeLastError,
    restoreConnectionSettings,
    restoreSidebarExpanded,
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

const FORWARDED_RESPONSE_ACTIONS = new Set([
    'GET_LOGS',
    'CHECK_PAGE_CONTEXT',
    'MCP_TEST_CONNECTION',
    'MCP_LIST_TOOLS',
    'GET_PROVIDER_MODELS',
]);

const HOST_ROUTED_ACTIONS = new Set(['GET_OPEN_TABS', 'SWITCH_TAB']);

function shouldRouteToHostTab(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (HOST_ROUTED_ACTIONS.has(payload.action)) return true;
    return payload.action === 'SEND_PROMPT' && payload.enableBrowserControl === true;
}

function shouldRequirePageContextRoute(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (payload.action === 'TOGGLE_BROWSER_CONTROL') return true;
    return payload.action === 'SEND_PROMPT' && payload.enableBrowserControl === true;
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
        const scopedPayload = this._attachCurrentTabContext(payload);
        chrome.runtime
            .sendMessage(scopedPayload)
            .then((response) => {
                if (response && FORWARDED_RESPONSE_ACTIONS.has(scopedPayload.action)) {
                    this.postBackgroundMessage(response);
                }
            })
            .catch((error) => console.warn('Error forwarding to background:', error));
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

    saveContextSettings(payload) {
        this.state.save(
            'geminiContextMode',
            payload?.mode === 'recent' ? 'recent' : DEFAULT_CONTEXT_MODE
        );
        this.state.save(
            'geminiContextRecentTurns',
            normalizeContextRecentTurns(payload?.recentTurns)
        );
    }

    saveConnectionSettings(payload) {
        const storageUpdate = createConnectionStorageUpdate(payload);
        for (const [key, value] of Object.entries(storageUpdate)) {
            this.state.save(key, value);
        }
    }

    importHistoryData(payload) {
        chrome.storage.local.get(
            ['geminiSessions', 'geminiGroups', 'geminiDeletedSessionIds'],
            (result) => {
                const readError = getRuntimeLastError();
                if (readError) {
                    this.postDataImportResult('history', false, readError);
                    return;
                }

                try {
                    const storageUpdate = buildHistoryImportStorageUpdate(payload, result || {});
                    this.writeImportedStorage('history', storageUpdate);
                } catch (error) {
                    this.postDataImportResult('history', false, error);
                }
            }
        );
    }

    importSettingsData(payload) {
        try {
            const storageUpdate = buildSettingsImportStorageUpdate(payload);
            this.writeImportedStorage('settings', storageUpdate);
        } catch (error) {
            this.postDataImportResult('settings', false, error);
        }
    }

    writeImportedStorage(kind, storageUpdate) {
        try {
            chrome.storage.local.set(storageUpdate, () => {
                const writeError = getRuntimeLastError();
                this.postDataImportResult(kind, !writeError, writeError);
            });
        } catch (error) {
            this.postDataImportResult(kind, false, error);
        }
    }

    postDataImportResult(kind, ok, error = null) {
        this.frame.postMessage({
            action: 'DATA_IMPORT_RESULT',
            payload: {
                kind,
                ok,
                error: error?.message || null,
            },
        });
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
            this.state.save('geminiSessions', merged);
            chrome.storage.local.set({ geminiDeletedSessionIds: deletedSessionIds });
        });
    }

    handleRuntimeMessage(message) {
        if (!this._isMessageForCurrentTab(message)) return;

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

    _attachCurrentTabContext(payload) {
        if (!payload || typeof payload !== 'object' || payload.sidePanelTabId != null) {
            return payload;
        }

        const tabId = shouldRequirePageContextRoute(payload)
            ? this.state.getCurrentTabId()
            : shouldRouteToHostTab(payload)
              ? this._getMessageTargetTabId()
              : this.state.getCurrentTabId();
        if (!Number.isInteger(tabId) || tabId <= 0) {
            return payload;
        }

        return {
            ...payload,
            sidePanelTabId: tabId,
        };
    }

    _getMessageTargetTabId() {
        return typeof this.state.getMessageTargetTabId === 'function'
            ? this.state.getMessageTargetTabId()
            : this.state.getCurrentTabId();
    }

    _isMessageForCurrentTab(message) {
        if (!message || !Object.prototype.hasOwnProperty.call(message, 'tabId')) {
            return true;
        }

        const messageTargetTabId = this._getMessageTargetTabId();
        return message.tabId == null || message.tabId === messageTargetTabId;
    }
}
