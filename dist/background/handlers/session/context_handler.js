export class ContextHandler {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
    }

    handleSetContext(request, sendResponse) {
        this.sessionManager
            .setContext(request.context, request.model)
            .then(() => sendResponse({ status: 'context_updated' }))
            .catch((error) => {
                console.error('[Gemini Nexus] Failed to set Web auth context:', error);
                sendResponse({ status: 'error', error: error?.message || String(error) });
            });
        return true;
    }

    handleResetContext(request, sendResponse) {
        this.sessionManager
            .resetContext()
            .then(() => sendResponse({ status: 'reset' }))
            .catch((error) => {
                console.error('[Gemini Nexus] Failed to reset Web auth context:', error);
                sendResponse({ status: 'error', error: error?.message || String(error) });
            });
        return true;
    }
}
