(function () {
    const DOMBuilder = window.GeminiToolbarDOM;
    const View = window.GeminiToolbarView;
    const DragController = window.GeminiDragController;
    const Events = window.GeminiToolbarEvents;
    const GrammarManager = window.GeminiUIGrammar;
    const Renderer = window.GeminiUIRenderer;
    const ActionsDelegate = window.GeminiToolbarUIActions;
    const CodeCopyHandler = window.GeminiCodeCopyHandler;
    const CustomSelectionToolsUI = window.GeminiCustomSelectionToolsUI;
    const TranslationTargetStore = window.GeminiTranslationTargetStore;

    function getStrings() {
        return window.GeminiToolbarStrings || {};
    }

    function getConfig() {
        return globalThis.GeminiNexusConfig || {};
    }

    function getDefaultWebModel() {
        return (
            window.GeminiWebModels?.DEFAULT_WEB_MODEL ||
            getConfig().DEFAULT_STORED_GEMINI_MODEL ||
            ''
        );
    }

    function getDefaultOfficialModel() {
        return getConfig().DEFAULT_OFFICIAL_MODEL || '';
    }

    function getDefaultOpenAIModel() {
        return getConfig().DEFAULT_OPENAI_MODEL || '';
    }

    function getDedicatedProviderConfig(provider) {
        return getConfig().DEDICATED_API_PROVIDERS?.[provider] || null;
    }

    function createDedicatedModelOptions(settings, provider) {
        const providerConfig = getDedicatedProviderConfig(provider);
        const providerSettings = settings.dedicatedApiProviders?.[provider] || {};
        const fallback = providerConfig?.defaultModel || '';
        return createCustomModelOptions(providerSettings.model || providerConfig?.defaultModels, {
            value: fallback,
            label: fallback || getStrings().customModel || 'Custom Model',
        });
    }

    function getWebThinking() {
        return globalThis.GeminiNexusWebThinking || window.GeminiNexusWebThinking || null;
    }

    function getDefaultWebThinkingLevel() {
        return getWebThinking()?.DEFAULT_WEB_THINKING_LEVEL || 'minimal';
    }

    function getThinkingToggleTitle(level, fastLevel) {
        const strings = getStrings();
        if (level === fastLevel) {
            return fastLevel === 'minimal'
                ? strings.toolbarThinkingMinimalFastTitle || 'Thinking: Minimal (Fast Mode)'
                : strings.toolbarThinkingLowFastTitle || 'Thinking: Low (Fast Mode)';
        }
        return strings.toolbarThinkingHighTitle || 'Thinking: High (Deep Mode)';
    }

    function syncWebThinkingToggle(button, settings = {}, model) {
        const webThinking = getWebThinking();
        if (!button || !webThinking) return false;

        const shouldShow = settings.provider === 'web' && webThinking.supportsWebThinking?.(model);
        button.hidden = !shouldShow;
        if (!shouldShow) {
            button.classList.remove('is-fast');
            button.removeAttribute('data-thinking-level');
            button.removeAttribute('data-fast-thinking-level');
            button.setAttribute('aria-pressed', 'false');
            return false;
        }

        const level = webThinking.normalizeWebThinkingLevelForModel(
            model,
            settings.webThinkingLevel
        );
        const fastLevel = webThinking.getWebThinkingFastLevel(model);
        const isFast = level === fastLevel;

        button.classList.toggle('is-fast', isFast);
        button.dataset.thinkingLevel = level;
        button.dataset.fastThinkingLevel = fastLevel;
        button.title = getThinkingToggleTitle(level, fastLevel);
        button.setAttribute(
            'aria-label',
            getStrings().toolbarThinkingToggleAria || 'Toggle thinking level'
        );
        button.setAttribute('aria-pressed', isFast ? 'true' : 'false');
        return true;
    }

    function createCustomModelOptions(rawModels, fallbackOption) {
        const modelIds = String(rawModels || '')
            .split(',')
            .map((modelId) => modelId.trim())
            .filter(Boolean);

        if (modelIds.length === 0) return [fallbackOption];
        return modelIds.map((modelId) => ({ value: modelId, label: modelId }));
    }

    class ToolbarUI {
        constructor() {
            this.host = null;
            this.shadow = null;
            this.view = null;
            this.dragController = null;
            this.events = null;
            this.domBuilder = new DOMBuilder();
            this.callbacks = {};
            this.isBuilt = false;
            this.provider = getConfig().DEFAULT_PROVIDER || 'web';
            this.webThinkingLevel = getDefaultWebThinkingLevel();
            this.translationTargetStore = new TranslationTargetStore();

            this.grammarManager = null;
            this.bridge = null;
            this.renderer = null;
            this.actionsDelegate = null;
            this.codeCopyHandler = null;
            this.customSelectionTools = null;
        }

        setCallbacks(callbacks) {
            this.callbacks = callbacks;
        }

        _initializeRuntimeComponents({ createBridge = false } = {}) {
            this.view = new View(this.shadow);
            this.grammarManager = new GrammarManager(this.view);

            if (createBridge) {
                this.bridge = new window.GeminiRendererBridge(this.host);
            }

            this.renderer = new Renderer(this.view, this.bridge);
            this.actionsDelegate = new ActionsDelegate(this);
            this.codeCopyHandler = new CodeCopyHandler();
            this.customSelectionTools = new CustomSelectionToolsUI({
                elements: this.view.elements,
                tools: this.customSelectionTools?.getTools?.() || [],
                onAction: (...args) => this.fireCallback('onAction', ...args),
            });
            this.dragController = new DragController(
                this.view.elements.askWindow,
                this.view.elements.askHeader,
                {
                    onSnap: (side, top) => this.view.dockWindow(side, top),
                    onUndock: () => this.view.undockWindow(),
                }
            );

            new DragController(this.view.elements.toolbar, this.view.elements.toolbarDrag, {});

            this.events = new Events(this);
            this.events.bind(this.view.elements, this.view.elements.askWindow);
            this.view.setSelectedTranslationTargets(this.translationTargetStore.getTargets());
            this.customSelectionTools.render();
        }

        build() {
            if (this.isBuilt) return;

            const { host, shadow } = this.domBuilder.create();
            this.host = host;
            this.shadow = shadow;

            this._initializeRuntimeComponents({ createBridge: true });
            this.isBuilt = true;
            this.restoreTranslationTargets();
        }

        rebuildForLanguageChange() {
            if (!this.isBuilt || !this.domBuilder || !this.domBuilder.rerender) return;
            this.domBuilder.rerender();
            this._initializeRuntimeComponents();
        }

        get actions() {
            return this.actionsDelegate;
        }

        get codeCopy() {
            return this.codeCopyHandler;
        }

        handleImageClick() {
            this.fireCallback('onAction', 'image_analyze');
        }

        handleImageHover(isHovering) {
            this.fireCallback('onImageBtnHover', isHovering);
        }

        handleModelChange(model) {
            this.fireCallback('onModelChange', model);
            this.updateWebThinkingToggle();
        }

        handleProviderChange(provider) {
            this.provider = provider || 'web';
            this.updateWebThinkingToggle();
            this.fireCallback('onProviderChange', this.provider);
        }

        handleWebThinkingToggle() {
            this.fireCallback('onWebThinkingToggle');
        }

        setCustomSelectionTools(tools) {
            this.customSelectionTools?.setTools(tools);
        }

        setGeneratedImageWatermarkRemovalEnabled(enabled) {
            this.renderer?.setGeneratedImageWatermarkRemovalEnabled?.(enabled !== false);
        }

        handleTranslationTargetsChange(targets) {
            const storedTargets = this.translationTargetStore.setTargets(targets);
            this.view.setSelectedTranslationTargets(storedTargets);
        }

        async restoreTranslationTargets() {
            const targets = await this.translationTargetStore.restore();
            this.view?.setSelectedTranslationTargets(targets);
        }

        saveWindowDimensions(width, height) {
            const storage = globalThis.chrome?.storage?.local;
            if (!storage || typeof storage.set !== 'function') return;
            storage.set({ gemini_nexus_window_size: { w: width, h: height } }).catch?.(() => {});
        }

        fireCallback(type, ...args) {
            if (type === 'onImageBtnHover' && this.callbacks.onImageBtnHover) {
                this.callbacks.onImageBtnHover(...args);
            } else if (type === 'onModelChange' && this.callbacks.onModelChange) {
                this.callbacks.onModelChange(...args);
            } else if (type === 'onProviderChange' && this.callbacks.onProviderChange) {
                this.callbacks.onProviderChange(...args);
            } else if (type === 'onWebThinkingToggle' && this.callbacks.onWebThinkingToggle) {
                this.callbacks.onWebThinkingToggle(...args);
            } else if (this.callbacks.onAction) {
                this.callbacks.onAction(...args);
            }
        }

        show(rect, mousePoint) {
            this.view.showToolbar(rect, mousePoint);
        }

        hide() {
            this.view.hideToolbar();
        }

        hideAll() {
            this.hide();
            this.hideAskWindow();
            this.hideImageButton();
        }

        showImageButton(rect) {
            this.view.showImageButton(rect);
        }

        hideImageButton() {
            this.view.hideImageButton();
        }

        showAskWindow(
            rect,
            contextText,
            title = getStrings().ask || 'Ask Gemini',
            mousePoint = null
        ) {
            return this.view.showAskWindow(
                rect,
                contextText,
                title,
                () => this.dragController.reset(),
                mousePoint
            );
        }

        showLoading(msg) {
            this.view.showLoading(msg);
        }

        stopLoading() {
            this.view.updateStreamingState(false);
            if (this.grammarManager) {
                this.grammarManager.updateResultActions(false);
            }
        }

        async showResult(text, title, isStreaming, images = []) {
            if (this.renderer) {
                await this.renderer.show(text, title, isStreaming, images);
            }

            if (this.grammarManager) {
                this.grammarManager.updateResultActions(isStreaming);
            }
        }

        handleGeneratedImageResult(request) {
            if (this.renderer) {
                this.renderer.handleGeneratedImageResult(request);
            }
        }

        showError(text) {
            this.view.showError(text);
        }

        hideAskWindow() {
            this.view.hideAskWindow();
            this.resetGrammarMode();
        }

        setInputValue(text) {
            this.view.setInputValue(text);
        }

        setTranslationTargetMode(enabled) {
            this.view.setTranslationTargetsVisible(enabled);
            if (enabled)
                this.view.setSelectedTranslationTargets(this.translationTargetStore.getTargets());
        }

        toggleTranslationTargetDropdown() {
            this.view.toggleTranslationTargetDropdown();
        }

        getSelectedTranslationTargets() {
            const selected = this.view?.getSelectedTranslationTargets();
            if (selected) {
                this.translationTargetStore.normalizeTargets(selected);
            }
            return this.translationTargetStore.getTargets();
        }

        getSelectedModel() {
            return this.view ? this.view.getSelectedModel() : getDefaultWebModel();
        }

        getProvider() {
            return this.provider;
        }

        setSelectedModel(model) {
            if (this.view) {
                this.view.setSelectedModel(model);
            }
        }

        updateModelList(settings, currentModel) {
            const provider = settings.provider || (settings.useOfficialApi ? 'official' : 'web');
            this.provider = provider;
            this.webThinkingLevel =
                getWebThinking()?.normalizeWebThinkingLevel?.(settings.webThinkingLevel) ||
                getDefaultWebThinkingLevel();
            this.view.setSelectedProvider(provider);
            let options = [];

            if (provider === 'official') {
                const defaultOfficialModel = getDefaultOfficialModel();
                options = createCustomModelOptions(settings.officialModel, {
                    value: defaultOfficialModel,
                    label: defaultOfficialModel,
                });
            } else if (provider === 'openai') {
                options = createCustomModelOptions(settings.openaiModel, {
                    value: getDefaultOpenAIModel(),
                    label: getStrings().customModel || 'Custom Model',
                });
            } else if (getDedicatedProviderConfig(provider)) {
                options = createDedicatedModelOptions(settings, provider);
            } else {
                options = window.GeminiWebModels.createOptions();
            }

            this.view.updateModelOptions(options, currentModel);
            this.updateWebThinkingToggle();
        }

        getWebThinkingLevel() {
            return this.webThinkingLevel || getDefaultWebThinkingLevel();
        }

        setWebThinkingLevel(level) {
            const webThinking = getWebThinking();
            this.webThinkingLevel =
                webThinking?.normalizeWebThinkingLevelForModel?.(this.getSelectedModel(), level) ||
                getDefaultWebThinkingLevel();
            this.updateWebThinkingToggle();
        }

        updateWebThinkingToggle() {
            syncWebThinkingToggle(
                this.view?.elements?.askThinkingToggle,
                {
                    provider: this.provider,
                    webThinkingLevel: this.getWebThinkingLevel(),
                },
                this.getSelectedModel()
            );
        }

        setGrammarMode(enabled, sourceElement = null, selectionRange = null) {
            if (this.grammarManager) {
                this.grammarManager.setMode(enabled, sourceElement, selectionRange);
            }
        }

        resetGrammarMode() {
            if (this.grammarManager) {
                this.grammarManager.reset();
            }
        }

        showInsertReplaceButtons(show) {
            if (this.grammarManager) {
                this.grammarManager.toggleButtons(show);
            }
        }

        getSourceInfo() {
            return this.grammarManager
                ? this.grammarManager.getSourceInfo()
                : { element: null, range: null };
        }

        showGrammarButton(show) {
            if (this.grammarManager) {
                this.grammarManager.showTriggerButton(show);
            }
        }

        showCopySelectionFeedback(success) {
            this.view.toggleCopySelectionIcon(success);
            setTimeout(() => {
                this.view.toggleCopySelectionIcon(null);
            }, 2000);
        }

        isVisible() {
            if (!this.view) return false;
            return this.view.isToolbarVisible() || this.view.isWindowVisible();
        }

        isWindowVisible() {
            if (!this.view) return false;
            return this.view.isWindowVisible();
        }

        isHost(target) {
            if (!this.view) return false;
            return this.view.isHost(target, this.host);
        }
    }

    window.GeminiToolbarUI = ToolbarUI;
})();
