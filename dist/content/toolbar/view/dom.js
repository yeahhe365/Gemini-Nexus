(function () {
    const Templates = window.GeminiToolbarTemplates;

    class ToolbarDOM {
        constructor() {
            this.host = null;
            this.shadow = null;
        }

        create() {
            this.host = document.createElement('div');
            this.host.id = 'gemini-nexus-toolbar-host';
            Object.assign(this.host.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '0',
                height: '0',
                zIndex: '2147483647',
                pointerEvents: 'none',
            });
            document.documentElement.appendChild(this.host);
            this.shadow = this.host.attachShadow({ mode: 'closed' });

            this._render();
            this._loadMathLibs();

            return { host: this.host, shadow: this.shadow };
        }

        _render() {
            const container = document.createElement('div');
            container.innerHTML = Templates.mainStructure;
            this.shadow.appendChild(container);
        }

        rerender() {
            if (!this.shadow) return;
            this.shadow.innerHTML = '';
            this._render();
            this._loadMathLibs();
        }

        _loadMathLibs() {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL('vendor/katex/katex.min.css');
            this.shadow.appendChild(link);

            const hljsLink = document.createElement('link');
            hljsLink.rel = 'stylesheet';
            hljsLink.href = chrome.runtime.getURL('vendor/highlight.js/atom-one-dark.min.css');
            this.shadow.appendChild(hljsLink);
        }
    }

    window.GeminiToolbarDOM = ToolbarDOM;
})();
