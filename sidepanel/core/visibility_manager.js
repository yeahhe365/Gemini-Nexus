/**
 * Manages side panel visibility state across tab switches
 * Prevents streaming interruptions and UI loss when switching tabs
 */
export class VisibilityManager {
    constructor(frameManager, stateManager) {
        this.frame = frameManager;
        this.state = stateManager;
        this.isVisible = !document.hidden;
        this.wasStreamingBeforeHide = false;
    }

    init() {
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Also handle the pagehide event to distinguish between tab switches and actual closes
        window.addEventListener('pagehide', (event) => {
            // persisted=true means the page is going into bfcache (tab switch)
            // persisted=false means the page is actually being unloaded (tab close)
            if (!event.persisted) {
                // Only send close signal if the page is truly closing
                this.handlePageClose();
            }
        });

        // Handle pageshow for when returning from bfcache
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                // Restored from bfcache after tab switch back
                this.handlePageRestore();
            }
        });
    }

    handleVisibilityChange() {
        const wasVisible = this.isVisible;
        this.isVisible = !document.hidden;

        if (!wasVisible && this.isVisible) {
            // Tab became visible
            this.onBecomeVisible();
        } else if (wasVisible && !this.isVisible) {
            // Tab became hidden
            this.onBecomeHidden();
        }
    }

    onBecomeVisible() {
        console.log('[Gemini Nexus] Side panel became visible');

        // Ensure frame is properly displayed
        if (this.frame.ensureVisible) {
            this.frame.ensureVisible();
        }

        // Notify the sandbox frame that we're visible again
        this.frame.postMessage({
            action: 'VISIBILITY_CHANGED',
            payload: { visible: true }
        });
    }

    onBecomeHidden() {
        console.log('[Gemini Nexus] Side panel became hidden (tab switch)');

        // Notify the sandbox frame that we're hidden
        this.frame.postMessage({
            action: 'VISIBILITY_CHANGED',
            payload: { visible: false }
        });
    }

    handlePageClose() {
        const tabId = this.state.getMessageTargetTabId?.();
        if (!Number.isInteger(tabId) || tabId <= 0) return;

        chrome.runtime.sendMessage({
            action: 'SIDE_PANEL_CLOSED',
            tabId
        }).catch(() => {});
    }

    handlePageRestore() {
        console.log('[Gemini Nexus] Side panel restored from bfcache');

        // Ensure everything is properly visible after restoration
        this.isVisible = true;
        this.onBecomeVisible();
    }

    isCurrentlyVisible() {
        return this.isVisible;
    }
}
