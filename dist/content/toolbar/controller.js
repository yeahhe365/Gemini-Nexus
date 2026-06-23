(function () {
    const TOOLBAR_PROVIDER_STORAGE_KEY = 'geminiToolbarProvider';
    const TOOLBAR_MODEL_STORAGE_KEY = 'geminiToolbarModel';
    const TOOLBAR_OPENAI_MODEL_STORAGE_KEY = 'geminiToolbarOpenaiSelectedModel';
    const TRANSLATION_TARGET_STORAGE_KEY = 'geminiTranslationTargets';
    const DEDICATED_FIELD_SUFFIXES = {
        baseUrl: 'BaseUrl',
        apiKey: 'ApiKey',
        model: 'Model',
        selectedModel: 'SelectedModel',
        thinkingLevel: 'ThinkingLevel',
        webSearch: 'WebSearch',
        providerRouting: 'ProviderRouting',
    };

    function getDedicatedProviderConfigs() {
        return globalThis.GeminiNexusConfig?.DEDICATED_API_PROVIDERS || {};
    }

    function getDedicatedProviderConfig(provider) {
        return getDedicatedProviderConfigs()[provider] || null;
    }

    function getDedicatedProviderStorageKeys(provider) {
        const config = getDedicatedProviderConfig(provider);
        if (!config) return null;
        return Object.fromEntries(
            Object.entries(DEDICATED_FIELD_SUFFIXES).map(([field, suffix]) => [
                field,
                `gemini${config.storagePrefix}${suffix}`,
            ])
        );
    }

    function getDedicatedStorageKeys() {
        return Object.keys(getDedicatedProviderConfigs()).flatMap((provider) =>
            Object.values(getDedicatedProviderStorageKeys(provider) || {})
        );
    }

    const TOOLBAR_MODEL_STORAGE_KEYS = [
        TOOLBAR_PROVIDER_STORAGE_KEY,
        TOOLBAR_MODEL_STORAGE_KEY,
        TOOLBAR_OPENAI_MODEL_STORAGE_KEY,
        'geminiModel',
        'geminiProvider',
        'geminiUseOfficialApi',
        'geminiWebThinkingLevel',
        'geminiOfficialModel',
        'geminiOpenaiModel',
        'geminiOpenaiSelectedModel',
        ...getDedicatedStorageKeys(),
    ];

    function createDedicatedProviderSettings(stored) {
        return Object.fromEntries(
            Object.keys(getDedicatedProviderConfigs()).map((provider) => {
                const config = getDedicatedProviderConfig(provider);
                const keys = getDedicatedProviderStorageKeys(provider);
                return [
                    provider,
                    {
                        provider,
                        baseUrl: stored[keys.baseUrl] || config.defaultBaseUrl,
                        apiKey: stored[keys.apiKey] || '',
                        model: stored[keys.model] || config.defaultModels,
                        selectedModel: stored[keys.selectedModel] || '',
                        thinkingLevel: stored[keys.thinkingLevel] || 'low',
                        webSearch: stored[keys.webSearch] === true,
                        providerRouting: stored[keys.providerRouting] || '',
                    },
                ];
            })
        );
    }

    function getDedicatedSelectedModel(stored, provider) {
        const config = getDedicatedProviderConfig(provider);
        const keys = getDedicatedProviderStorageKeys(provider);
        if (!config || !keys) return null;
        const selected = stored[keys.selectedModel];
        if (selected) return selected;
        return String(stored[keys.model] || config.defaultModels)
            .split(',')
            .map((model) => model.trim())
            .filter(Boolean)[0];
    }

    function getWebThinking() {
        return globalThis.GeminiNexusWebThinking || window.GeminiNexusWebThinking || null;
    }

    function saveToolbarSettings(update) {
        try {
            const writeResult = chrome.storage.local.set(update);
            writeResult?.catch?.((error) => {
                console.warn('Failed to save toolbar settings:', error?.message || error);
            });
        } catch (error) {
            console.warn('Failed to save toolbar settings:', error?.message || error);
        }
    }

    class ToolbarController {
        constructor() {
            this.ui = new window.GeminiToolbarUI();
            this.actions = new window.GeminiToolbarActions(this.ui);
            this.speechReader = new window.GeminiSpeechReader();

            this.imageDetector = new window.GeminiImageDetector({
                onShow: (rect) => this.ui.showImageButton(rect),
                onHide: () => this.ui.hideImageButton(),
            });

            const streamHandler = new window.GeminiStreamHandler(this.ui, {
                onSessionId: (id) => {
                    this.lastSessionId = id;
                },
            });
            streamHandler.init();

            this.inputManager = new window.GeminiInputManager();

            this.dispatcher = new window.GeminiToolbarDispatcher(this);

            new window.GeminiSelectionObserver({
                onSelection: this.handleSelection.bind(this),
                onClear: this.handleSelectionClear.bind(this),
                onClick: this.handleClick.bind(this),
            });

            this.visible = false;
            this.currentSelection = '';
            this.lastRect = null;
            this.lastMousePoint = null;
            this.lastSessionId = null;
            this.currentMode = 'ask';
            this.isSelectionEnabled = true;

            this.handleAction = this.handleAction.bind(this);

            this.init();
        }

        init() {
            this.ui.build();
            this.ui.setCallbacks({
                onAction: this.handleAction,
                onProviderChange: (provider) => this.handleProviderChange(provider),
                onModelChange: (model) => this.handleModelChange(model),
                onWebThinkingToggle: () => this.handleWebThinkingToggle(),
                onImageBtnHover: (isHovering) => {
                    if (isHovering) {
                        this.imageDetector.cancelHide();
                    } else {
                        this.imageDetector.scheduleHide();
                    }
                },
            });

            this.syncSettings();

            chrome.storage.onChanged.addListener((changes, area) => {
                if (area === 'local') {
                    if (TOOLBAR_MODEL_STORAGE_KEYS.some((key) => changes[key])) {
                        this.syncSettings();
                    }
                    if (changes[TRANSLATION_TARGET_STORAGE_KEY]) {
                        this.ui.restoreTranslationTargets?.();
                    }
                }
            });

            window.addEventListener('gemini-toolbar-language-changed', () => {
                this.ui.rebuildForLanguageChange();
                this.syncSettings();
            });
        }

        async syncSettings() {
            let result;
            try {
                result = await chrome.storage.local.get(TOOLBAR_MODEL_STORAGE_KEYS);
            } catch (error) {
                console.warn(
                    'Failed to sync toolbar provider/model settings:',
                    error?.message || error
                );
                return;
            }

            result = result || {};

            const settings = {
                provider: result.geminiProvider,
                useOfficialApi: result.geminiUseOfficialApi,
                officialModel: result.geminiOfficialModel,
                openaiModel: result.geminiOpenaiModel,
                webThinkingLevel: result.geminiWebThinkingLevel,
                dedicatedApiProviders: createDedicatedProviderSettings(result),
            };

            const provider =
                result[TOOLBAR_PROVIDER_STORAGE_KEY] ||
                settings.provider ||
                (settings.useOfficialApi ? 'official' : 'web');
            settings.provider = provider;
            const selectedModel =
                provider === 'openai'
                    ? result[TOOLBAR_OPENAI_MODEL_STORAGE_KEY] ||
                      result.geminiOpenaiSelectedModel ||
                      result.geminiModel
                    : getDedicatedProviderConfig(provider)
                      ? getDedicatedSelectedModel(result, provider) ||
                        result[TOOLBAR_MODEL_STORAGE_KEY] ||
                        result.geminiModel
                      : result[TOOLBAR_MODEL_STORAGE_KEY] || result.geminiModel;
            this.ui.updateModelList(settings, selectedModel);
        }

        setSelectionEnabled(enabled) {
            this.isSelectionEnabled = enabled;
            if (!enabled) {
                this.handleSelectionClear();
            }
        }

        setImageToolsEnabled(enabled) {
            this.imageDetector.setEnabled(enabled);
        }

        setGeneratedImageWatermarkRemovalEnabled(enabled) {
            this.ui.setGeneratedImageWatermarkRemovalEnabled?.(enabled !== false);
        }

        setCustomSelectionTools(tools) {
            this.ui.setCustomSelectionTools?.(Array.isArray(tools) ? tools : []);
        }

        handleContextAction(mode) {
            this.currentMode = mode;

            if (mode === 'ask') {
                this.showGlobalInput(false);
            } else if (mode === 'page_chat') {
                this.showGlobalInput(true);
            } else if (mode === 'read_page') {
                this.readPageAloud();
            } else if (mode === 'read_selection') {
                this.currentSelection = window.getSelection?.().toString().trim() || '';
                this.readSelectionAloud();
            } else {
                this.sendCaptureInitiationRequest();
            }
        }

        sendCaptureInitiationRequest() {
            try {
                const result = chrome.runtime.sendMessage({ action: 'INITIATE_CAPTURE' });
                result
                    ?.then?.((response) => {
                        if (response?.status === 'error') {
                            this.showExtensionError(
                                response.error || 'Could not start screen capture.'
                            );
                        }
                    })
                    ?.catch?.((error) => {
                        this.showExtensionError(error?.message || String(error));
                    });
            } catch (error) {
                this.showExtensionError(error?.message || String(error));
            }
        }

        async handleCropResult(request) {
            const rect = {
                left: window.innerWidth / 2 - 200,
                top: 100,
                right: window.innerWidth / 2 + 200,
                bottom: 200,
                width: 400,
                height: 100,
            };

            const model = this.ui.getSelectedModel();

            let finalImage = request.image;
            if (window.GeminiImageCropper && request.area) {
                try {
                    finalImage = await window.GeminiImageCropper.crop(request.image, request.area);
                } catch (error) {
                    console.error('Crop failed in content script', error);
                }
            }

            if (this.currentMode === 'ocr') {
                this.actions.handleImagePrompt(finalImage, rect, 'ocr', model);
            } else if (this.currentMode === 'screenshot_translate') {
                this.actions.handleImagePrompt(finalImage, rect, 'translate', model);
            } else if (this.currentMode === 'snip') {
                this.actions.handleImagePrompt(finalImage, rect, 'snip', model);
            }

            this.currentMode = 'ask';
            this.visible = true;
        }

        handleGeneratedImageResult(request) {
            if (this.ui) this.ui.handleGeneratedImageResult(request);
        }

        handleClick(event) {
            if (this.ui.isHost(event.target)) return;

            this.hide();
        }

        handleSelection(data) {
            if (!this.isSelectionEnabled) return;

            const { text, rect, mousePoint } = data;
            this.currentSelection = text;
            this.lastRect = rect;
            this.lastMousePoint = mousePoint;

            this.inputManager.capture();

            this.ui.showGrammarButton(this.inputManager.hasSource());

            this.show(rect, mousePoint);
        }

        handleSelectionClear() {
            if (!this.ui.isWindowVisible()) {
                this.currentSelection = '';
                this.inputManager.reset();
                this.hide();
            }
        }

        handleModelChange(model) {
            const provider = this.ui.getProvider ? this.ui.getProvider() : 'web';
            if (provider === 'web') {
                this.syncWebThinkingForModel(model, { saveIfChanged: true });
            }
            if (provider === 'openai') {
                saveToolbarSettings({ [TOOLBAR_OPENAI_MODEL_STORAGE_KEY]: model });
                return;
            }

            const dedicatedKeys = getDedicatedProviderStorageKeys(provider);
            if (dedicatedKeys) {
                saveToolbarSettings({ [dedicatedKeys.selectedModel]: model });
                return;
            }

            saveToolbarSettings({ [TOOLBAR_MODEL_STORAGE_KEY]: model });
        }

        handleProviderChange(provider) {
            if (provider !== 'web') {
                this.ui.updateWebThinkingToggle?.();
            } else {
                this.syncWebThinkingForModel(this.ui.getSelectedModel?.(), {
                    saveIfChanged: false,
                });
            }
            saveToolbarSettings({ [TOOLBAR_PROVIDER_STORAGE_KEY]: provider });
        }

        syncWebThinkingForModel(
            model = this.ui.getSelectedModel?.(),
            { saveIfChanged = false } = {}
        ) {
            const webThinking = getWebThinking();
            if (!webThinking || !this.ui) return null;

            const provider = this.ui.getProvider ? this.ui.getProvider() : 'web';
            if (provider !== 'web') {
                this.ui.updateWebThinkingToggle?.();
                return null;
            }

            const previousLevel =
                this.ui.getWebThinkingLevel?.() || webThinking.DEFAULT_WEB_THINKING_LEVEL;
            const nextLevel = webThinking.normalizeWebThinkingLevelForModel(model, previousLevel);
            this.ui.setWebThinkingLevel?.(nextLevel);

            if (saveIfChanged && previousLevel && previousLevel !== nextLevel) {
                saveToolbarSettings({ geminiWebThinkingLevel: nextLevel });
            }

            return nextLevel;
        }

        handleWebThinkingToggle() {
            const webThinking = getWebThinking();
            if (!webThinking || !this.ui) return;

            const provider = this.ui.getProvider ? this.ui.getProvider() : 'web';
            if (provider !== 'web') {
                this.ui.updateWebThinkingToggle?.();
                return;
            }

            const model = this.ui.getSelectedModel?.();
            const currentLevel =
                this.ui.getWebThinkingLevel?.() || webThinking.DEFAULT_WEB_THINKING_LEVEL;
            const nextLevel = webThinking.getNextWebThinkingLevel(model, currentLevel);
            this.ui.setWebThinkingLevel?.(nextLevel);
            saveToolbarSettings({ geminiWebThinkingLevel: nextLevel });
        }

        handleAction(actionType, data) {
            this.dispatcher.dispatch(actionType, data);
        }

        async readSelectionAloud() {
            try {
                await this.speechReader.readSelection(this.currentSelection);
            } catch (error) {
                this.showExtensionError(error.message || String(error));
            }
        }

        async readPageAloud() {
            try {
                await this.speechReader.readPage();
            } catch (error) {
                this.showExtensionError(error.message || String(error));
            }
        }

        show(rect, mousePoint) {
            this.lastRect = rect;
            this.ui.show(rect, mousePoint);
            this.visible = true;
        }

        hide() {
            if (this.ui.isWindowVisible()) return;
            if (!this.visible) return;
            this.ui.hide();
            this.visible = false;
        }

        hideAll() {
            this.ui.hideAll();
            this.visible = false;
        }

        showGlobalInput(withPageContext = false) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const width = 400;
            const height = 100;

            const left = (viewportWidth - width) / 2;
            const top = viewportHeight / 2 - 200;

            const rect = {
                left,
                top,
                right: left + width,
                bottom: top + height,
                width,
                height,
            };

            this.ui.hide();
            const strings = window.GeminiToolbarStrings || {};

            let title = strings.ask || 'Ask Gemini';
            if (withPageContext) {
                title = strings.chatWithPage || 'Chat with Page';
            }

            this.ui.showAskWindow(rect, null, title);

            this.ui.setInputValue('');
            this.currentSelection = '';
            this.lastSessionId = null;
            this.visible = true;

            if (withPageContext) {
                this.currentSelection = '__PAGE_CONTEXT_FORCE__';
            }
        }

        showExtensionError(message) {
            const width = 400;
            const height = 100;
            const left = (window.innerWidth - width) / 2;
            const top = Math.max(24, window.innerHeight / 2 - 200);
            const rect = {
                left,
                top,
                right: left + width,
                bottom: top + height,
                width,
                height,
            };
            const strings = window.GeminiToolbarStrings || {};

            this.ui.showAskWindow(rect, null, strings.error || 'Gemini Nexus');
            this.ui.showError(message || 'Could not open Gemini Nexus');
            this.visible = true;
        }
    }

    window.GeminiToolbarController = ToolbarController;
})();
