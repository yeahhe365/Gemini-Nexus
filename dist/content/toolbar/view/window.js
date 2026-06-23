(function () {
    const Layout = window.GeminiViewLayout;
    const ICONS = window.GeminiToolbarIcons;
    const WINDOW_SIZE_STORAGE_KEY = 'gemini_nexus_window_size';

    function getDefaultTitle() {
        return window.GeminiToolbarStrings?.ask || 'Ask Gemini';
    }

    function isAllowedErrorLink(href) {
        try {
            const url = new URL(href);
            return url.protocol === 'https:' && url.hostname === 'gemini.google.com';
        } catch {
            return false;
        }
    }

    function appendSanitizedErrorNode(target, node) {
        if (node.nodeType === 3) {
            target.appendChild(document.createTextNode(node.textContent || ''));
            return;
        }
        if (node.nodeType !== 1) return;

        if (node.tagName.toLowerCase() === 'a') {
            const href = node.getAttribute('href') || '';
            if (isAllowedErrorLink(href)) {
                const link = document.createElement('a');
                link.href = href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'gemini-error-link';
                link.textContent = node.textContent || href;
                target.appendChild(link);
                return;
            }
        }

        node.childNodes.forEach((child) => appendSanitizedErrorNode(target, child));
    }

    function appendErrorText(target, text) {
        const raw = String(text || '');
        if (!/<a\b/i.test(raw)) {
            target.textContent = raw;
            return;
        }

        const template = document.createElement('template');
        template.innerHTML = raw;
        template.content.childNodes.forEach((node) => appendSanitizedErrorNode(target, node));
    }

    function createErrorIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '12');
        circle.setAttribute('cy', '12');
        circle.setAttribute('r', '10');

        const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        verticalLine.setAttribute('x1', '12');
        verticalLine.setAttribute('y1', '8');
        verticalLine.setAttribute('x2', '12');
        verticalLine.setAttribute('y2', '12');

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        dot.setAttribute('x1', '12');
        dot.setAttribute('y1', '16');
        dot.setAttribute('x2', '12.01');
        dot.setAttribute('y2', '16');

        svg.append(circle, verticalLine, dot);
        return svg;
    }

    function createErrorShell(titleText) {
        const card = document.createElement('div');
        card.className = 'gemini-error-card';

        const title = document.createElement('div');
        title.className = 'gemini-error-title';

        const label = document.createElement('span');
        label.textContent = titleText;
        title.append(createErrorIcon(), label);

        const body = document.createElement('div');
        body.className = 'gemini-error-text';

        card.append(title, body);
        return { card, body };
    }

    async function getSavedWindowSize() {
        const storage = globalThis.chrome?.storage?.local;
        if (!storage || typeof storage.get !== 'function') return null;

        try {
            const stored = await storage.get(WINDOW_SIZE_STORAGE_KEY);
            return stored?.[WINDOW_SIZE_STORAGE_KEY] || null;
        } catch {
            return null;
        }
    }

    /**
     * Sub-controller for the Ask Window
     */
    class WindowView {
        constructor(elements) {
            this.elements = elements;
            this.imagePreview = new window.GeminiImagePreviewController({
                resultText: this.elements.resultText,
                askWindow: this.elements.askWindow,
            });
            this.translationTargets = new window.GeminiTranslationTargetView(this.elements);
        }

        async show(rect, contextText, title, resetDrag = null, mousePoint = null) {
            if (!this.elements.askWindow) return;

            const savedSize = await getSavedWindowSize();
            if (savedSize) {
                let { w, h } = savedSize;
                const maxW = window.innerWidth * 0.95;
                const maxH = window.innerHeight * 0.95;
                if (w > maxW) w = maxW;
                if (h > maxH) h = maxH;
                this.elements.askWindow.style.width = `${w}px`;
                this.elements.askWindow.style.height = `${h}px`;
            }

            if (resetDrag) {
                resetDrag();
                this.undockWindow();
            }

            Layout.positionElement(this.elements.askWindow, rect, true, mousePoint);

            this.elements.windowTitle.textContent = title || getDefaultTitle();
            if (contextText) {
                this.elements.contextPreview.textContent = contextText;
                this.elements.contextPreview.classList.remove('hidden');
            } else {
                this.elements.contextPreview.classList.add('hidden');
            }

            this.elements.askInput.value = '';
            this.elements.resultText.innerHTML = '';
            this.translationTargets.hide();

            if (this.elements.windowFooter) this.elements.windowFooter.classList.add('hidden');

            this.elements.askWindow.classList.add('visible');
            setTimeout(() => this.elements.askInput.focus(), 50);
        }

        hide() {
            if (this.elements.askWindow) this.elements.askWindow.classList.remove('visible');
        }

        showLoading(msg) {
            if (!this.elements.askWindow) return;

            if (msg) {
                this.elements.resultText.innerHTML = '';
                const loading = document.createElement('div');
                loading.className = 'gemini-loading-message';
                loading.textContent = msg;
                this.elements.resultText.appendChild(loading);
            } else {
                this.elements.resultText.innerHTML = '';
            }

            if (this.elements.windowFooter) this.elements.windowFooter.classList.remove('hidden');
            if (this.elements.footerStop) this.elements.footerStop.classList.remove('hidden');
            if (this.elements.footerActions) this.elements.footerActions.classList.add('hidden');
        }

        showResult(htmlContent, title, isStreaming = false) {
            if (!this.elements.askWindow) return;

            if (title) this.elements.windowTitle.textContent = title;

            const resultArea = this.elements.resultArea;
            let shouldScrollBottom = false;

            if (resultArea && isStreaming) {
                const threshold = 50;
                const distanceToBottom =
                    resultArea.scrollHeight - resultArea.scrollTop - resultArea.clientHeight;
                shouldScrollBottom = distanceToBottom <= threshold;
            }

            this.elements.resultText.innerHTML = htmlContent;

            if (this.elements.windowFooter) this.elements.windowFooter.classList.remove('hidden');

            this.updateStreamingState(isStreaming);

            if (!isStreaming && !htmlContent) {
                if (this.elements.windowFooter) this.elements.windowFooter.classList.add('hidden');
            }

            if (resultArea) {
                if (isStreaming) {
                    if (shouldScrollBottom) {
                        resultArea.scrollTop = resultArea.scrollHeight;
                    }
                } else {
                    resultArea.scrollTop = 0;
                }
            }
        }

        updateStreamingState(isStreaming) {
            if (!this.elements.askWindow) return;

            if (isStreaming) {
                if (this.elements.footerStop) this.elements.footerStop.classList.remove('hidden');
                if (this.elements.footerActions)
                    this.elements.footerActions.classList.add('hidden');
            } else {
                if (this.elements.footerStop) this.elements.footerStop.classList.add('hidden');
                if (this.elements.footerActions)
                    this.elements.footerActions.classList.remove('hidden');
                if (this.elements.buttons.copy) this.elements.buttons.copy.innerHTML = ICONS.COPY;
            }
        }

        showError(text) {
            if (!this.elements.askWindow) return;

            const { card, body } = createErrorShell(window.GeminiToolbarStrings?.error || 'Error');
            this.elements.resultText.replaceChildren(card);
            appendErrorText(body, text);

            if (this.elements.windowFooter) this.elements.windowFooter.classList.remove('hidden');
            if (this.elements.footerStop) this.elements.footerStop.classList.add('hidden');
            if (this.elements.footerActions) this.elements.footerActions.classList.remove('hidden');
        }

        toggleCopyIcon(success) {
            if (!this.elements.buttons.copy) return;
            this.elements.buttons.copy.innerHTML = success ? ICONS.CHECK : ICONS.COPY;
        }

        setInputValue(text) {
            if (this.elements.askInput) this.elements.askInput.value = text;
        }

        setTranslationTargetsVisible(visible) {
            if (visible) {
                this.translationTargets.show();
            } else {
                this.translationTargets.hide();
            }
        }

        toggleTranslationTargetDropdown() {
            this.translationTargets.toggleDropdown();
        }

        getSelectedTranslationTargets() {
            return this.translationTargets.getSelected();
        }

        setSelectedTranslationTargets(targets) {
            this.translationTargets.setSelected(targets);
        }

        dockWindow(side, top) {
            const askWindow = this.elements.askWindow;
            if (!askWindow) return;
            askWindow.style.transform = '';
            askWindow.setAttribute('data-dock', side);
            askWindow.style.top = `${top}px`;
            if (side === 'left') {
                askWindow.style.left = '0';
                askWindow.style.right = 'auto';
            } else {
                askWindow.style.left = 'auto';
                askWindow.style.right = '0';
            }
        }

        undockWindow() {
            const askWindow = this.elements.askWindow;
            if (askWindow) {
                askWindow.removeAttribute('data-dock');
                askWindow.style.transform = '';
            }
        }

        isVisible() {
            return this.elements.askWindow && this.elements.askWindow.classList.contains('visible');
        }

        isHost(target) {
            return this.elements.askWindow && this.elements.askWindow.contains(target);
        }
    }

    window.GeminiViewWindow = WindowView;
})();
