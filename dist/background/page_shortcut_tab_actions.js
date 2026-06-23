import { injectContentScriptsIntoTab } from './content_injection.js';

const CAPTURE_ERROR = 'Capture failed';

function isValidTab(tab) {
    return Number.isInteger(tab?.id) && tab.id > 0;
}

function isExpectedResponse(response, status) {
    return !status || response?.status === status;
}

async function sendMessageWithContentRefresh(tab, message, expectedStatus) {
    await injectContentScriptsIntoTab(tab);

    try {
        const response = await chrome.tabs.sendMessage(tab.id, message);
        if (isExpectedResponse(response, expectedStatus)) return response;
    } catch {}

    await injectContentScriptsIntoTab(tab, { force: true });
    return chrome.tabs.sendMessage(tab.id, message);
}

async function notifyTabError(tab, message) {
    if (!isValidTab(tab)) return;

    try {
        await sendMessageWithContentRefresh(
            tab,
            {
                action: 'SHOW_EXTENSION_ERROR',
                message,
            },
            'ok'
        );
    } catch {}
}

export async function showQuickAskForTab(tab) {
    if (!isValidTab(tab)) return;

    await sendMessageWithContentRefresh(tab, { action: 'SHOW_QUICK_ASK' }, 'ok');
}

export async function startAreaOcrForTab(tab, imageManager) {
    if (!isValidTab(tab)) return;

    let capture = null;
    try {
        capture = await imageManager.captureScreenshot(tab.windowId);
    } catch (error) {
        await notifyTabError(tab, error?.message || CAPTURE_ERROR);
        return;
    }

    if (!capture?.base64 || capture.error) {
        await notifyTabError(tab, capture?.error || CAPTURE_ERROR);
        return;
    }

    try {
        await sendMessageWithContentRefresh(
            tab,
            {
                action: 'START_SELECTION',
                image: capture.base64,
                mode: 'ocr',
                source: 'local',
                targetSidePanelTabId: null,
            },
            'selection_started'
        );
    } catch (error) {
        await notifyTabError(tab, error?.message || CAPTURE_ERROR);
    }
}
