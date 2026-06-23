import { getActiveTabContent } from './session/active_tab_content.js';
import { respondWithUiTask } from './ui_async.js';

async function getRequestTab(context, request, sender) {
    const targetTabId = context.getTargetSidePanelTabId(request, sender);
    if (Number.isInteger(targetTabId) && targetTabId > 0) {
        try {
            return await chrome.tabs.get(targetTabId);
        } catch {}
    }

    if (sender.tab?.id) return sender.tab;

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab || null;
}

export function handleGetActiveSelection(context, request, sender, sendResponse) {
    respondWithUiTask(
        sendResponse,
        async () => {
            const tab = await getRequestTab(context, request, sender);
            if (tab) {
                await sendSelectionResult(context, request, sender, tab.id);
                return;
            }
            await sendSelectionMessage(context, request, sender, '');
        },
        { errorLabel: 'Active selection lookup error' }
    );
}

export function handleCheckPageContext(context, request, sender, sendResponse) {
    respondWithUiTask(sendResponse, async () => {
        const tab = await getRequestTab(context, request, sender);
        const content = await getActiveTabContent(tab?.id || null);
        return {
            action: 'PAGE_CONTEXT_RESULT',
            length: content ? content.length : 0,
        };
    });
}

async function sendSelectionResult(context, request, sender, tabId) {
    let selection = '';
    try {
        const response = await chrome.tabs.sendMessage(tabId, {
            action: 'GET_SELECTION',
        });
        selection = response ? response.selection : '';
    } catch {
        selection = '';
    }

    await sendSelectionMessage(
        context,
        request,
        sender,
        typeof selection === 'string' ? selection : ''
    );
}

async function sendSelectionMessage(context, request, sender, text) {
    await chrome.runtime.sendMessage({
        action: 'SELECTION_RESULT',
        tabId: context.getTargetSidePanelTabId(request, sender),
        text,
    });
}
