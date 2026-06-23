function getErrorMessage(error, fallback) {
    return error?.message || fallback;
}

function respondWithShortcutTask(sendResponse, task, errorMessage) {
    task()
        .then(() => sendResponse({ status: 'ok' }))
        .catch((error) => {
            console.error(errorMessage, error);
            sendResponse({
                status: 'error',
                error: getErrorMessage(error, errorMessage),
            });
        });
}

export function createPageShortcutCommandHandler({ showQuickAskForTab, startAreaOcrForTab }) {
    return (request, sender, sendResponse) => {
        if (request.action === 'SHOW_QUICK_ASK_FROM_SHORTCUT') {
            respondWithShortcutTask(
                sendResponse,
                () => showQuickAskForTab(sender.tab),
                'Could not open quick ask from shortcut'
            );
            return true;
        }

        if (request.action === 'START_AREA_OCR_FROM_SHORTCUT') {
            respondWithShortcutTask(
                sendResponse,
                () => startAreaOcrForTab(sender.tab),
                'Could not start area OCR from shortcut'
            );
            return true;
        }

        return false;
    };
}

export function setupPageShortcutCommands(handlers) {
    chrome.runtime.onMessage.addListener(createPageShortcutCommandHandler(handlers));
}
