(function () {
    const SANDBOX_CLEANUP_DELAY_MS = 250;

    class RendererBridge {
        constructor(hostElement) {
            this.host = hostElement;
            this.iframe = null;
            this.callbacksByRequestId = {};
            this.requestIdCounter = 0;
            this.cleanupTimer = null;
            this.iframeLoaded = false;
            this.iframeReady = null;
            this.handleMessage = this.handleMessage.bind(this);
            this.init();
        }

        init() {
            window.addEventListener('message', this.handleMessage);
        }

        ensureIframe() {
            if (this.cleanupTimer) {
                clearTimeout(this.cleanupTimer);
                this.cleanupTimer = null;
            }

            if (this.iframe && this.iframe.isConnected) {
                return this.iframe;
            }

            this.iframe = document.createElement('iframe');
            this.iframe.src = chrome.runtime.getURL('sandbox/index.html?mode=renderer');
            this.iframe.style.display = 'none';
            this.iframeLoaded = false;
            this.iframeReady = new Promise((resolve) => {
                this.iframe.addEventListener(
                    'load',
                    () => {
                        this.iframeLoaded = true;
                        resolve();
                    },
                    { once: true }
                );
            });
            this.host.appendChild(this.iframe);
            return this.iframe;
        }

        async waitForIframe(iframe) {
            if (this.iframeLoaded && iframe === this.iframe) return;
            await this.iframeReady;
        }

        handleMessage(event) {
            if (event.source !== this.iframe?.contentWindow) return;
            if (!event.data || typeof event.data !== 'object') return;

            if (event.data.action === 'RENDER_RESULT') {
                const { html, reqId: requestId, fetchTasks } = event.data;
                if (Object.prototype.hasOwnProperty.call(this.callbacksByRequestId, requestId)) {
                    this.callbacksByRequestId[requestId]({ html, fetchTasks });
                    delete this.callbacksByRequestId[requestId];
                    this.scheduleCleanup();
                }
            }
        }

        scheduleCleanup() {
            if (Object.keys(this.callbacksByRequestId).length > 0) return;

            this.cleanupTimer = setTimeout(() => {
                if (Object.keys(this.callbacksByRequestId).length > 0) return;
                this.iframe?.remove();
                this.iframe = null;
                this.iframeLoaded = false;
                this.iframeReady = null;
                this.cleanupTimer = null;
            }, SANDBOX_CLEANUP_DELAY_MS);
        }

        createRequestId() {
            if (globalThis.GeminiNexusIds?.createPrefixedId) {
                return globalThis.GeminiNexusIds.createPrefixedId('req');
            }
            if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
                return `req_${globalThis.crypto.randomUUID().toUpperCase()}`;
            }
            this.requestIdCounter += 1;
            return `req_${this.requestIdCounter}`;
        }

        async render(text, images = []) {
            const requestId = this.createRequestId();
            const iframe = this.ensureIframe();
            await this.waitForIframe(iframe);
            return new Promise((resolve) => {
                this.callbacksByRequestId[requestId] = resolve;
                if (iframe === this.iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(
                        { action: 'RENDER', text, images, reqId: requestId },
                        '*'
                    );
                } else {
                    delete this.callbacksByRequestId[requestId];
                    this.scheduleCleanup();
                    resolve({ html: text, fetchTasks: [] });
                }
            });
        }
    }

    window.GeminiRendererBridge = RendererBridge;
})();
