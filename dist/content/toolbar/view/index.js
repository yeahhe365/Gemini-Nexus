(function () {
    function getDefaultToolbarModel() {
        return (
            window.GeminiWebModels?.DEFAULT_WEB_MODEL ||
            globalThis.GeminiNexusConfig?.DEFAULT_STORED_GEMINI_MODEL ||
            ''
        );
    }

    /**
     * Main View Facade
     * Orchestrates WidgetView and WindowView
     */
    class ToolbarView {
        constructor(shadowRoot) {
            this.shadow = shadowRoot;
            this.elements = {};
            this.cacheElements();

            this.widgetView = new window.GeminiViewWidget(this.elements);
            this.windowView = new window.GeminiViewWindow(this.elements);

            // Initial resize of provider/model selects if present.
            const Layout = window.GeminiViewLayout;
            if (this.elements.askProviderSelect && Layout && Layout.resizeSelect) {
                Layout.resizeSelect(this.elements.askProviderSelect);
            }
            if (this.elements.askModelSelect && Layout && Layout.resizeSelect) {
                Layout.resizeSelect(this.elements.askModelSelect);
            }
        }

        cacheElements() {
            const getToolbarElement = (id) => this.shadow.getElementById(id);
            this.elements = {
                toolbar: getToolbarElement('toolbar'),
                toolbarDrag: getToolbarElement('toolbar-drag'),
                customSelectionTools: getToolbarElement('custom-selection-tools'),
                customSelectionMore: getToolbarElement('custom-selection-more'),
                customSelectionMoreMenu: getToolbarElement('custom-selection-more-menu'),
                imageBtn: getToolbarElement('image-btn'),
                askWindow: getToolbarElement('ask-window'),
                askHeader: getToolbarElement('ask-header'),
                windowTitle: getToolbarElement('window-title'),
                contextPreview: getToolbarElement('context-preview'),
                askInput: getToolbarElement('ask-input'),
                translationTargets: getToolbarElement('translation-targets'),
                translationTargetTrigger: getToolbarElement('translation-target-trigger'),
                translationTargetMenu: getToolbarElement('translation-target-menu'),
                translationTargetSummary: getToolbarElement('translation-target-summary'),
                translationTargetOptions: getToolbarElement('translation-target-options'),
                resultArea: getToolbarElement('result-area'),
                resultText: getToolbarElement('result-text'),
                askProviderSelect: getToolbarElement('ask-provider-select'),
                askModelSelect: getToolbarElement('ask-model-select'),
                askThinkingToggle: getToolbarElement('ask-thinking-toggle'),
                windowFooter: getToolbarElement('window-footer'),
                footerActions: getToolbarElement('footer-actions'),
                footerStop: getToolbarElement('footer-stop'),
                buttons: {
                    copySelection: getToolbarElement('btn-copy'),
                    ask: getToolbarElement('btn-ask'),
                    grammar: getToolbarElement('btn-grammar'),
                    translate: getToolbarElement('btn-translate'),
                    explain: getToolbarElement('btn-explain'),
                    summarize: getToolbarElement('btn-summarize'),
                    generateImage: getToolbarElement('btn-generate-image'),
                    readSelection: getToolbarElement('btn-read-selection'),
                    customSelectionMore: getToolbarElement('btn-custom-selection-more'),
                    headerClose: getToolbarElement('btn-header-close'),
                    stop: getToolbarElement('btn-stop-gen'),
                    continue: getToolbarElement('btn-continue-chat'),
                    copy: getToolbarElement('btn-copy-result'),
                    retry: getToolbarElement('btn-retry'),
                    insert: getToolbarElement('btn-insert'),
                    replace: getToolbarElement('btn-replace'),
                    imageChat: getToolbarElement('btn-image-chat'),
                    imageDescribe: getToolbarElement('btn-image-describe'),
                    imageExtract: getToolbarElement('btn-image-extract'),
                    imageTranslate: getToolbarElement('btn-image-translate'),
                    imageRemoveBg: getToolbarElement('btn-image-remove-bg'),
                    imageRemoveText: getToolbarElement('btn-image-remove-text'),
                    imageRemoveWatermark: getToolbarElement('btn-image-remove-watermark'),
                    imageUpscale: getToolbarElement('btn-image-upscale'),
                    imageExpand: getToolbarElement('btn-image-expand'),
                },
            };
        }

        showToolbar(rect, mousePoint) {
            this.widgetView.showToolbar(rect, mousePoint);
        }
        hideToolbar() {
            this.widgetView.hideToolbar();
        }
        showImageButton(rect) {
            this.widgetView.showImageButton(rect);
        }
        hideImageButton() {
            this.widgetView.hideImageButton();
        }
        isToolbarVisible() {
            return this.widgetView.isToolbarVisible();
        }
        toggleCopySelectionIcon(success) {
            this.widgetView.toggleCopySelectionIcon(success);
        }

        showAskWindow(rect, contextText, title, resetDrag, mousePoint) {
            return this.windowView.show(rect, contextText, title, resetDrag, mousePoint);
        }
        hideAskWindow() {
            this.windowView.hide();
        }
        showLoading(msg) {
            this.windowView.showLoading(msg);
        }

        showResult(text, title, isStreaming) {
            this.windowView.showResult(text, title, isStreaming);
        }

        updateStreamingState(isStreaming) {
            this.windowView.updateStreamingState(isStreaming);
        }

        showError(text) {
            this.windowView.showError(text);
        }
        toggleCopyIcon(success) {
            this.windowView.toggleCopyIcon(success);
        }
        setInputValue(text) {
            this.windowView.setInputValue(text);
        }
        setTranslationTargetsVisible(visible) {
            this.windowView.setTranslationTargetsVisible(visible);
        }
        toggleTranslationTargetDropdown() {
            this.windowView.toggleTranslationTargetDropdown();
        }
        getSelectedTranslationTargets() {
            return this.windowView.getSelectedTranslationTargets();
        }
        setSelectedTranslationTargets(targets) {
            this.windowView.setSelectedTranslationTargets(targets);
        }
        isWindowVisible() {
            return this.windowView.isVisible();
        }

        dockWindow(side, top) {
            this.windowView.dockWindow(side, top);
        }
        undockWindow() {
            this.windowView.undockWindow();
        }

        getSelectedModel() {
            return this.elements.askModelSelect
                ? this.elements.askModelSelect.value
                : getDefaultToolbarModel();
        }

        setSelectedProvider(provider) {
            const Layout = window.GeminiViewLayout;
            if (this.elements.askProviderSelect && provider) {
                this.elements.askProviderSelect.value = provider;
                if (Layout && Layout.resizeSelect)
                    Layout.resizeSelect(this.elements.askProviderSelect);
            }
        }

        setSelectedModel(model) {
            const Layout = window.GeminiViewLayout;
            if (this.elements.askModelSelect && model) {
                this.elements.askModelSelect.value = model;
                if (Layout && Layout.resizeSelect)
                    Layout.resizeSelect(this.elements.askModelSelect);
            }
        }

        updateModelOptions(options, selectedValue) {
            const select = this.elements.askModelSelect;
            if (!select) return;

            select.innerHTML = '';
            options.forEach((option) => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                select.appendChild(optionElement);
            });

            // Select value if valid, otherwise first option
            if (selectedValue && options.some((option) => option.value === selectedValue)) {
                select.value = selectedValue;
            } else if (options.length > 0) {
                select.value = options[0].value;
            }

            const Layout = window.GeminiViewLayout;
            if (Layout && Layout.resizeSelect) Layout.resizeSelect(select);
        }

        isHost(target, host) {
            return target === host || this.windowView.isHost(target);
        }
    }

    window.GeminiToolbarView = ToolbarView;
})();
