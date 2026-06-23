import { GeminiSessionManager } from './managers/session_manager.js';
import { ImageManager } from './managers/image_manager.js';
import { BrowserControlManager } from './managers/control_manager.js';
import { McpRemoteManager } from './managers/mcp_remote_manager.js';
import { LogManager, setupConsoleInterception } from './managers/log_manager.js';
import { SidePanelScopeManager } from './managers/sidepanel_scope_manager.js';
import { setupContextMenus } from './menus.js';
import { setupMessageListener } from './messages.js';
import { keepAliveManager } from './managers/keep_alive.js';
import { setupContentScriptInjection } from './content_injection.js';
import { setupPageShortcutCommands } from './page_shortcut_commands.js';
import {
    showQuickAskForTab,
    startAreaOcrForTab as startAreaOcrForTabWithManager,
} from './page_shortcut_tab_actions.js';

const logManager = new LogManager();

setupConsoleInterception(logManager);

console.info('[Gemini Nexus] Background Service Worker Started');

const sessionManager = new GeminiSessionManager();
const imageManager = new ImageManager();
const controlManager = new BrowserControlManager();
const sidePanelScopeManager = new SidePanelScopeManager();
const mcpManager = new McpRemoteManager({
    clientName: 'gemini-nexus',
    clientVersion: chrome.runtime.getManifest().version,
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
sidePanelScopeManager.init();
chrome.action.onClicked.addListener((tab) => {
    if (!tab?.id || !tab.windowId) return;
    sidePanelScopeManager.toggleForTab(tab.id, tab.windowId).catch((error) => {
        console.error('Could not toggle side panel from action click:', error);
    });
});

async function startAreaOcrForTab(tab) {
    await startAreaOcrForTabWithManager(tab, imageManager);
}

chrome.commands?.onCommand?.addListener((command, tab) => {
    if (command === 'quick-ask') {
        showQuickAskForTab(tab).catch((error) => {
            console.error('Could not open quick ask from command:', error);
        });
        return;
    }

    if (command === 'area-ocr') {
        startAreaOcrForTab(tab).catch((error) => {
            console.error('Could not start area OCR from command:', error);
        });
    }
});

setupPageShortcutCommands({
    showQuickAskForTab,
    startAreaOcrForTab,
});

setupContextMenus();
setupContentScriptInjection();
setupMessageListener(
    sessionManager,
    imageManager,
    controlManager,
    mcpManager,
    logManager,
    sidePanelScopeManager
);

keepAliveManager.init();
