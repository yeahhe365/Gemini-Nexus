import { toControlTabSummary } from '../control/tabs.js';
import { respondWithUiTask } from './ui_async.js';

function getErrorMessage(error) {
    return error?.message || String(error);
}

async function sendOpenTabsResult(context, request, sender, payload) {
    await chrome.runtime.sendMessage({
        action: 'OPEN_TABS_RESULT',
        tabId: context.getTargetSidePanelTabId(request, sender),
        ...payload,
    });
}

function getLockedTabId(context) {
    return context.controlManager ? context.controlManager.getTargetTabId() : null;
}

async function queryOpenTabs(context) {
    const tabQuery = { currentWindow: true };
    const groupId = context.controlManager?.getControlledGroupId?.();
    const windowId = context.controlManager?.getControlledWindowId?.();
    if (Number.isInteger(windowId) && windowId > 0) {
        delete tabQuery.currentWindow;
        tabQuery.windowId = windowId;
    }
    if (Number.isInteger(groupId) && groupId >= 0) {
        tabQuery.groupId = groupId;
    }

    const tabs = await chrome.tabs.query(tabQuery);
    return {
        tabs: tabs.map((tab) => toControlTabSummary(tab)),
        lockedTabId: getLockedTabId(context),
    };
}

export function handleGetOpenTabs(context, request, sender, sendResponse) {
    (async () => {
        let payload;
        try {
            payload = await queryOpenTabs(context);
        } catch (error) {
            console.error('Open tabs lookup error', error);
            payload = {
                tabs: [],
                lockedTabId: getLockedTabId(context),
                error: getErrorMessage(error),
            };
            try {
                await sendOpenTabsResult(context, request, sender, payload);
            } catch (deliveryError) {
                console.error('Open tabs delivery error', deliveryError);
                sendResponse({ status: 'error', error: getErrorMessage(deliveryError) });
                return;
            }
            sendResponse({ status: 'error', error: getErrorMessage(error) });
            return;
        }

        try {
            await sendOpenTabsResult(context, request, sender, payload);
            sendResponse({ status: 'completed' });
        } catch (error) {
            console.error('Open tabs delivery error', error);
            sendResponse({ status: 'error', error: getErrorMessage(error) });
        }
    })();
}

export function handleSwitchTab(context, request, sender, sendResponse) {
    respondWithUiTask(sendResponse, async () => {
        const tabId = request.tabId || null;
        if (
            tabId &&
            context.controlManager?.isTabControllable &&
            !(await context.controlManager.isTabControllable(tabId))
        ) {
            return { status: 'error', error: 'Tab cannot be controlled.' };
        }

        if (context.controlManager) {
            context.controlManager.setOwnerSidePanelTabId?.(
                context.getTargetSidePanelTabId(request, sender)
            );
            context.controlManager.setTargetTab(tabId);
        }
        if (tabId && request.switchVisual !== false) {
            chrome.tabs
                .update(tabId, { active: true })
                .catch((tabUpdateError) => console.warn(tabUpdateError));
        }
        return { status: 'switched' };
    });
}
