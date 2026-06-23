import { getPanelPathForTab } from '../managers/sidepanel_scope_manager.js';
import { respondWithUiTask } from './ui_async.js';

export function handleOpenSidePanel(context, request, sender, sendResponse) {
    respondWithUiTask(sendResponse, () => openSidePanel(context, request, sender), {
        errorLabel: 'Side panel open error',
    });
}

export function handleToggleSidePanelControl(context, request, sender, sendResponse) {
    respondWithUiTask(
        sendResponse,
        async () => {
            const result = await toggleSidePanelControl(context, request, sender);
            if (result?.status === 'error') {
                return result;
            }
            return { status: 'processed' };
        },
        {
            errorLabel: 'Side panel control toggle error',
        }
    );
}

export function handleToggleSidePanel(context, request, sender, sendResponse) {
    respondWithUiTask(sendResponse, () => toggleSidePanel(context, request, sender), {
        errorLabel: 'Side panel toggle error',
    });
}

async function openSidePanel(context, request, sender) {
    if (!sender.tab) {
        return { status: 'error', error: 'No active tab for side panel.' };
    }

    let openPromise;
    try {
        if (context.sidePanelScopeManager) {
            openPromise = context.sidePanelScopeManager.openForTab(
                sender.tab.id,
                sender.tab.windowId
            );
        } else {
            chrome.sidePanel
                .setOptions({
                    tabId: sender.tab.id,
                    enabled: true,
                    path: getPanelPathForTab(sender.tab.id),
                })
                .catch(() => {});
            openPromise = chrome.sidePanel.open({
                tabId: sender.tab.id,
                windowId: sender.tab.windowId,
            });
        }
    } catch (error) {
        console.error('Could not start side panel open flow:', error);
        return { status: 'error', error: error.message || String(error) };
    }

    const pendingSidePanelUpdates = {};
    if (request.sessionId) pendingSidePanelUpdates.pendingSessionId = request.sessionId;
    if (request.mode) pendingSidePanelUpdates.pendingMode = request.mode;

    const pendingKeys = Object.keys(pendingSidePanelUpdates);
    const pendingActionsStored = await storePendingSidePanelActions(
        pendingSidePanelUpdates,
        pendingKeys
    );

    try {
        await openPromise;
    } catch (error) {
        if (pendingActionsStored) {
            clearPendingSidePanelActions(pendingKeys);
        }
        console.error('Could not open side panel:', error);
        return { status: 'error', error: error.message || String(error) };
    }

    queueSidePanelFollowupMessages(request, sender);
    return { status: 'opened' };
}

async function storePendingSidePanelActions(pendingSidePanelUpdates, pendingKeys) {
    if (pendingKeys.length === 0) return false;

    try {
        await chrome.storage.local.set(pendingSidePanelUpdates);
        setTimeout(() => {
            clearPendingSidePanelActions(pendingKeys);
        }, 5000);
        return true;
    } catch (error) {
        console.warn('Could not store pending side panel actions:', error);
        return false;
    }
}

function clearPendingSidePanelActions(pendingKeys) {
    if (pendingKeys.length === 0) return;
    chrome.storage.local.remove(pendingKeys).catch(() => {});
}

async function toggleSidePanel(context, request, sender) {
    if (!sender.tab) {
        return { status: 'error', error: 'No active tab for side panel.' };
    }

    if (context.sidePanelScopeManager?.toggleForTab) {
        return context.sidePanelScopeManager.toggleForTab(sender.tab.id, sender.tab.windowId);
    }

    return openSidePanel(context, request, sender);
}

async function toggleSidePanelControl(context, request, sender) {
    if (!sender.tab) {
        return { status: 'error', error: 'No active tab for side panel.' };
    }

    const tabId = sender.tab.id;
    const currentLock = context.controlManager?.getTargetTabId?.() ?? null;

    if (currentLock === tabId) {
        await closeControlledSidePanel(context, tabId);
        return { status: 'processed' };
    }

    if (context.controlManager) {
        context.controlManager.setOwnerSidePanelTabId(
            context.getTargetSidePanelTabId(request, sender)
        );
    }
    return openSidePanel(context, { ...request, mode: 'browser_control' }, sender);
}

async function closeControlledSidePanel(context, tabId) {
    if (context.controlManager) {
        await context.controlManager.disableControl();
    }

    try {
        await chrome.sidePanel.setOptions({ tabId, enabled: false });
        setTimeout(() => {
            chrome.sidePanel.setOptions({
                tabId,
                enabled: true,
                path: getPanelPathForTab(tabId),
            });
        }, 250);
    } catch (error) {
        console.error('Failed to toggle side panel close:', error);
    }
}

function queueSidePanelFollowupMessages(request, sender) {
    const sendMessage = chrome.runtime?.sendMessage?.bind(chrome.runtime);
    if (!sendMessage) return;

    setTimeout(() => {
        if (request.sessionId) {
            sendMessage({
                action: 'SWITCH_SESSION',
                tabId: sender.tab.id,
                sessionId: request.sessionId,
            }).catch(() => {});
        }
        if (request.mode === 'browser_control') {
            sendMessage({
                action: 'ACTIVATE_BROWSER_CONTROL',
                tabId: sender.tab.id,
            }).catch(() => {});
        }
    }, 500);
}
