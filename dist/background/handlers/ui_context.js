export function getTargetSidePanelTabId(request, sender) {
    const requestTabId = request?.sidePanelTabId;
    if (Number.isInteger(requestTabId) && requestTabId > 0) return requestTabId;

    const senderTabId = sender?.tab?.id;
    return Number.isInteger(senderTabId) && senderTabId > 0 ? senderTabId : null;
}

export function sendToRequestSource(sender, payload) {
    const result = sender.tab
        ? chrome.tabs.sendMessage(sender.tab.id, payload)
        : chrome.runtime.sendMessage(payload);

    return Promise.resolve(result).catch((error) => {
        console.warn('Could not send UI result to request source:', error);
        throw error;
    });
}

export function createUiMessageContext(handler) {
    return {
        imageHandler: handler.imageHandler,
        controlManager: handler.controlManager,
        sidePanelScopeManager: handler.sidePanelScopeManager,
        getTargetSidePanelTabId,
        sendToRequestSource,
    };
}
