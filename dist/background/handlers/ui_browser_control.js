export function handleToggleBrowserControl(context, request, sender, sendResponse) {
    const createDisabledErrorResponse = () => ({
        status: 'error',
        error: context.controlManager?.lastControlError || 'Browser control could not be enabled.',
    });

    try {
        let controlResult;
        if (context.controlManager) {
            const targetSidePanelTabId = context.getTargetSidePanelTabId(request, sender);
            context.controlManager.setOwnerSidePanelTabId?.(targetSidePanelTabId);
            if (request.enabled) {
                controlResult = context.controlManager.enableControl({
                    createDefaultTab: request.hostIsTab === true && !targetSidePanelTabId,
                });
            } else {
                controlResult = context.controlManager.disableControl();
            }
        }

        if (controlResult && typeof controlResult.then === 'function') {
            controlResult
                .then((result) =>
                    sendResponse(
                        request.enabled && result === false
                            ? createDisabledErrorResponse()
                            : { status: 'processed' }
                    )
                )
                .catch((error) => {
                    console.error('Browser control toggle failed', error);
                    sendResponse({ status: 'error', error: error?.message || String(error) });
                });
        } else if (request.enabled && controlResult === false) {
            sendResponse(createDisabledErrorResponse());
        } else {
            sendResponse({ status: 'processed' });
        }
    } catch (error) {
        console.error('Browser control toggle failed', error);
        sendResponse({ status: 'error', error: error?.message || String(error) });
    }
}
