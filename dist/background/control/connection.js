import { debugLog } from '../../shared/logging/debug.js';

/**
 * Manages the connection to the Chrome Debugger API.
 */
export class BrowserConnection {
    constructor() {
        this.currentTabId = null;
        this.targetTabId = null; // Tracks the intended tab ID even if debugger is not attached
        this.attached = false;
        this.onDetachCallbacks = [];
        this.eventListeners = new Set();
        this.currentDialog = null;
        this.lastAttachErrorMessage = '';
        this.lastDetachReason = '';

        // Global listener for CDP events
        chrome.debugger.onEvent.addListener(this._handleEvent.bind(this));

        // Monitor external detachments (e.g. user closed tab or clicked "Cancel" on infobar)
        chrome.debugger.onDetach.addListener(this._onDebuggerDetached.bind(this));
    }

    _handleEvent(source, method, params) {
        if (this.attached && this.currentTabId === source.tabId) {
            if (method === 'Page.javascriptDialogOpening') {
                this.currentDialog = {
                    type: params?.type || 'dialog',
                    message: params?.message || '',
                    defaultPrompt: params?.defaultPrompt || '',
                };
            } else if (method === 'Page.javascriptDialogClosed') {
                this.currentDialog = null;
            }
            for (const callback of Array.from(this.eventListeners)) {
                try {
                    callback(method, params);
                } catch (error) {
                    debugLog('[BrowserConnection] Event listener failed:', error);
                }
            }
        }
    }

    _onDebuggerDetached(source, reason) {
        // If the browser detached our current session, clean up state immediately
        if (this.currentTabId === source.tabId) {
            debugLog('[BrowserConnection] Debugger detached by browser:', reason);
            this.lastDetachReason = reason || 'detached';
            this._cleanupState();
        }
    }

    _cleanupState() {
        this.attached = false;
        this.currentTabId = null;
        this.currentDialog = null;
        this.onDetachCallbacks.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                debugLog('[BrowserConnection] Detach callback failed:', error);
            }
        });
    }

    addListener(callback) {
        this.eventListeners.add(callback);
    }

    removeListener(callback) {
        this.eventListeners.delete(callback);
    }

    onDetach(callback) {
        this.onDetachCallbacks.push(callback);
    }

    getDialog() {
        return this.currentDialog;
    }

    clearDialog() {
        this.currentDialog = null;
    }

    async _enableDomains() {
        await this.sendCommand('Runtime.enable');
        await this.sendCommand('Page.enable');
        try {
            await this.sendCommand('Target.setAutoAttach', {
                autoAttach: true,
                waitForDebuggerOnStart: false,
                flatten: true,
            });
        } catch (error) {
            debugLog('[BrowserConnection] Target auto-attach unavailable:', error);
        }
    }

    async attach(tabId) {
        this.targetTabId = tabId; // Always store the intended tab

        // If already attached to the same tab, just ensure domains are enabled
        if (this.attached && this.currentTabId === tabId) {
            try {
                await this._enableDomains();
            } catch (error) {
                console.warn('Failed to refresh debugger domains:', error);
            }
            return true;
        }

        // If attached to a different tab, detach first
        if (this.attached && this.currentTabId !== tabId) {
            await this.detach();
        }

        return new Promise((resolve, reject) => {
            chrome.debugger.attach({ tabId }, '1.3', async () => {
                if (chrome.runtime.lastError) {
                    const attachErrorMessage = chrome.runtime.lastError.message;
                    this.lastAttachErrorMessage = attachErrorMessage;
                    // Suppress common expected errors for restricted targets to avoid log noise
                    if (
                        attachErrorMessage.includes('restricted URL') ||
                        attachErrorMessage.includes('Cannot access') ||
                        attachErrorMessage.includes('Attach to webui')
                    ) {
                        debugLog(
                            '[BrowserConnection] Attach skipped (restricted):',
                            attachErrorMessage
                        );
                    } else {
                        console.warn('[BrowserConnection] Attach failed:', attachErrorMessage);
                    }
                    // Resolve anyway to allow fallback actions (like navigation) to proceed without debugger
                    resolve(false);
                } else {
                    this.attached = true;
                    this.currentTabId = tabId;
                    this.lastAttachErrorMessage = '';
                    this.lastDetachReason = '';

                    try {
                        await this._enableDomains();
                    } catch (error) {
                        this.lastAttachErrorMessage = error?.message || String(error);
                        console.warn('Failed to enable collection domains:', error);
                        await this.detach();
                        resolve(false);
                        return;
                    }

                    resolve(true);
                }
            });
        });
    }

    async detach() {
        if (!this.attached || !this.currentTabId) return;
        return new Promise((resolve) => {
            chrome.debugger.detach({ tabId: this.currentTabId }, () => {
                // IMPORTANT: Consume lastError to prevent "Unchecked runtime.lastError"
                // if the tab was already closed or detached externally.
                if (chrome.runtime.lastError) {
                    debugLog(
                        '[BrowserConnection] Detach ignored:',
                        chrome.runtime.lastError.message
                    );
                }

                this._cleanupState();
                resolve();
            });
        });
    }

    sendCommand(method, params = {}) {
        if (!this.attached || !this.currentTabId) throw new Error('No active debugger session');
        return new Promise((resolve, reject) => {
            chrome.debugger.sendCommand({ tabId: this.currentTabId }, method, params, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result);
                }
            });
        });
    }
}
