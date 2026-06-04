export function handleToggleBrowserControl(context, request, sender, sendResponse) {
    if (context.controlManager) {
        const targetSidePanelTabId = context.getTargetSidePanelTabId(request, sender);
        context.controlManager.setOwnerSidePanelTabId?.(targetSidePanelTabId);
        if (request.enabled) {
            context.controlManager.enableControl({
                createDefaultTab: request.hostIsTab === true && !targetSidePanelTabId,
            });
        } else {
            context.controlManager.disableControl();
        }
    }
    sendResponse({ status: 'processed' });
}
