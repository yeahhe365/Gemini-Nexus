export class FrameManager {
    constructor() {
        this.iframe = document.getElementById('sandbox-frame');
        this.skeleton = document.getElementById('skeleton');
    }

    init() {
        // Read cached shell preferences synchronously before the iframe loads.
        const cachedTheme = localStorage.getItem('geminiTheme') || 'system';
        const cachedLang = localStorage.getItem('geminiLanguage') || 'system';
        const cachedSidebarExpanded = localStorage.getItem('geminiSidebarExpanded');

        const params = new URLSearchParams({
            theme: cachedTheme,
            lang: cachedLang,
        });

        if (cachedSidebarExpanded === 'true' || cachedSidebarExpanded === 'false') {
            params.set('sidebarExpanded', cachedSidebarExpanded);
        }

        const sandboxPath = `sandbox/index.html?${params.toString()}`;
        const runtime = globalThis.chrome && globalThis.chrome.runtime;

        // Set an absolute extension URL to avoid relative-frame navigation errors.
        if (runtime && typeof runtime.getURL === 'function') {
            this.iframe.src = runtime.getURL(sandboxPath);
            return;
        }

        this.iframe.src = new URL(`../${sandboxPath}`, window.location.href).toString();
    }

    reveal() {
        this.iframe.classList.add('loaded');
        if (this.skeleton) this.skeleton.classList.add('hidden');
    }

    ensureVisible() {
        // Ensure iframe is visible (useful after tab switch restoration)
        if (this.iframe) {
            this.iframe.style.display = '';
            this.iframe.style.visibility = 'visible';
        }
    }

    postMessage(message) {
        if (this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage(message, '*');
        }
    }

    getWindow() {
        return this.iframe.contentWindow;
    }

    isWindow(sourceWindow) {
        return this.iframe.contentWindow && sourceWindow === this.iframe.contentWindow;
    }
}
