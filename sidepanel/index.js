import { FrameManager } from './core/frame.js';
import { StateManager } from './core/state.js';
import { MessageBridge } from './core/bridge.js';
import { VisibilityManager } from './core/visibility_manager.js';

const frameManager = new FrameManager();

frameManager.init();

if (globalThis.chrome && chrome.runtime && chrome.storage && chrome.tabs) {
    const stateManager = new StateManager(frameManager);
    const messageBridge = new MessageBridge(frameManager, stateManager);
    const visibilityManager = new VisibilityManager(frameManager, stateManager);

    stateManager.init();
    messageBridge.init();
    visibilityManager.init();
} else {
    const iframe = document.getElementById('sandbox-frame');
    if (iframe) iframe.addEventListener('load', () => frameManager.reveal(), { once: true });
}
