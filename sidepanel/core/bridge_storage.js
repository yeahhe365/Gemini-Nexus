import {
    CONNECTION_STORAGE_KEYS,
    createConnectionSettingsPayload,
} from '../../shared/settings/connection.js';

export function getRuntimeLastError() {
    const message = chrome.runtime?.lastError?.message;
    return message ? new Error(message) : null;
}

const INPUT_DRAFTS_KEY = 'geminiSidePanelInputDrafts';

function logSessionBindingWriteError(error) {
    console.warn('Unable to save side panel session binding after storage write failed:', error);
}

function logInputDraftWriteError(error) {
    console.warn('Unable to save side panel input draft after storage write failed:', error);
}

export function getSidePanelInputDraftKey(tabId, sessionId = null) {
    if (!Number.isInteger(tabId) || tabId <= 0) return null;
    return sessionId ? `tab:${tabId}|session:${sessionId}` : `tab:${tabId}|draft`;
}

export function normalizeSidePanelInputDrafts(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function restoreConnectionSettings(frame) {
    chrome.storage.local.get(CONNECTION_STORAGE_KEYS, (result) => {
        const readError = getRuntimeLastError();
        if (readError) {
            console.warn(
                'Unable to restore connection settings after storage read failed:',
                readError
            );
            return;
        }

        frame.postMessage({
            action: 'RESTORE_CONNECTION_SETTINGS',
            payload: createConnectionSettingsPayload(result, { includeLegacyFallbacks: true }),
        });
    });
}

export function restoreSidebarExpanded(frame) {
    chrome.storage.local.get(['geminiSidebarExpanded'], (result) => {
        const readError = getRuntimeLastError();
        if (readError) {
            console.warn(
                'Unable to restore sidebar expanded state after storage read failed:',
                readError
            );
            return;
        }

        frame.postMessage({
            action: 'RESTORE_SIDEBAR_EXPANDED',
            payload: result.geminiSidebarExpanded !== false,
        });
    });
}

export function saveSidePanelInputDraft(payload) {
    const tabId = payload?.tabId;
    const sessionId = payload?.sessionId || null;
    const key = getSidePanelInputDraftKey(tabId, sessionId);
    if (!key) return;

    chrome.storage.session.get([INPUT_DRAFTS_KEY], (result) => {
        const readError = getRuntimeLastError();
        if (readError) {
            console.warn('Unable to save side panel input draft after storage read failed:', readError);
            return;
        }

        const drafts = { ...normalizeSidePanelInputDrafts(result?.[INPUT_DRAFTS_KEY]) };
        const value = typeof payload?.value === 'string' ? payload.value : '';
        if (value) {
            drafts[key] = value;
        } else {
            delete drafts[key];
        }

        try {
            const writeResult = chrome.storage.session.set({ [INPUT_DRAFTS_KEY]: drafts });
            writeResult?.catch?.(logInputDraftWriteError);
        } catch (error) {
            logInputDraftWriteError(error);
        }
    });
}

export function saveSidePanelSessionBinding(payload) {
    const tabId = payload?.tabId;
    const sessionId = payload?.sessionId || null;
    if (!Number.isInteger(tabId) || tabId <= 0) return;

    chrome.storage.session.get(['geminiSidePanelSessionBindings'], (result) => {
        const readError = getRuntimeLastError();
        if (readError) {
            console.warn(
                'Unable to save side panel session binding after storage read failed:',
                readError
            );
            return;
        }

        const bindings =
            result?.geminiSidePanelSessionBindings &&
            typeof result.geminiSidePanelSessionBindings === 'object' &&
            !Array.isArray(result.geminiSidePanelSessionBindings)
                ? { ...result.geminiSidePanelSessionBindings }
                : {};
        if (sessionId) {
            bindings[tabId] = sessionId;
        } else {
            delete bindings[tabId];
        }
        try {
            const writeResult = chrome.storage.session.set({
                geminiSidePanelSessionBindings: bindings,
            });
            writeResult?.catch?.(logSessionBindingWriteError);
        } catch (error) {
            logSessionBindingWriteError(error);
        }
    });
}
