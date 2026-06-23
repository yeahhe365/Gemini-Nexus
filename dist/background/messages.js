import { SessionMessageHandler } from './handlers/session/index.js';
import { UIMessageHandler } from './handlers/ui.js';

/**
 * Sets up the global runtime message listener.
 * @param {GeminiSessionManager} sessionManager
 * @param {ImageHandler} imageHandler
 * @param {BrowserControlManager} controlManager
 * @param {McpRemoteManager} mcpManager
 * @param {LogManager} logManager
 * @param {SidePanelScopeManager} sidePanelScopeManager
 */
export function setupMessageListener(
    sessionManager,
    imageHandler,
    controlManager,
    mcpManager,
    logManager,
    sidePanelScopeManager
) {
    const sessionHandler = new SessionMessageHandler(
        sessionManager,
        imageHandler,
        controlManager,
        mcpManager
    );
    const uiHandler = new UIMessageHandler(
        imageHandler,
        controlManager,
        mcpManager,
        sidePanelScopeManager
    );

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'GET_LOGS') {
            sendResponse({ logs: logManager.getLogs() });
            return true;
        }

        // Delegate to Session Handler (Prompt, Context, Quick Ask, Browser Control)
        if (sessionHandler.handle(request, sender, sendResponse)) {
            return true;
        }

        // Delegate to UI Handler (Image, Capture, Sidepanel)
        if (uiHandler.handle(request, sender, sendResponse)) {
            return true;
        }

        return false;
    });
}
