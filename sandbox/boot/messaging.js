export class AppMessageBridge {
    constructor() {
        this.app = null;
        this.ui = null;
        this.resizeCallback = null;
        this.queue = [];

        window.addEventListener('message', this.handleMessage.bind(this));
    }

    setApp(appInstance) {
        this.app = appInstance;
        this.flush();
    }

    setUI(uiInstance) {
        this.ui = uiInstance;
        this.flush();
    }

    setResizeCallback(resizeCallback) {
        this.resizeCallback = resizeCallback;
    }

    handleMessage(event) {
        const { action, payload } = event.data || {};
        if (!action) return;

        if (this.app && this.ui) {
            this.dispatch(action, payload, event);
        } else {
            this.queue.push({ action, payload, event });
        }
    }

    flush() {
        if (this.app && this.ui) {
            while (this.queue.length > 0) {
                const { action, payload, event } = this.queue.shift();
                this.dispatch(action, payload, event);
            }
        }
    }

    dispatch(action, payload, event) {
        if (action === 'RESTORE_SHORTCUTS') {
            this.ui.updateShortcuts(payload);
            return;
        }
        if (action === 'RESTORE_THEME') {
            this.ui.updateTheme(payload);
            return;
        }
        if (action === 'RESTORE_LANGUAGE') {
            this.ui.updateLanguage(payload);
            return;
        }
        if (action === 'RESTORE_MODEL') {
            if (this.ui.modelSelect) {
                const previousModelValue = this.ui.modelSelect.value;
                this.ui.modelSelect.value = payload;
                if (this.ui.modelSelect.selectedIndex === -1) {
                    this.ui.modelSelect.value =
                        previousModelValue ||
                        (this.ui.modelSelect.options.length > 0
                            ? this.ui.modelSelect.options[0].value
                            : '');
                    if (
                        this.ui.modelSelect.selectedIndex === -1 &&
                        this.ui.modelSelect.options.length > 0
                    ) {
                        this.ui.modelSelect.selectedIndex = 0;
                    }
                }
                if (this.resizeCallback) this.resizeCallback();
            }
            return;
        }
        if (action === 'RESTORE_TEXT_SELECTION') {
            this.ui.settings.updateTextSelection(payload);
            return;
        }
        if (action === 'RESTORE_TEXT_SELECTION_BLACKLIST') {
            this.ui.settings.updateTextSelectionBlacklist(payload);
            return;
        }
        if (action === 'RESTORE_CUSTOM_SELECTION_TOOLS') {
            this.ui.settings.updateCustomSelectionTools(payload);
            return;
        }
        if (action === 'RESTORE_IMAGE_TOOLS') {
            this.ui.settings.updateImageTools(payload);
            return;
        }
        if (action === 'RESTORE_GENERATED_IMAGE_WATERMARK_REMOVAL') {
            this.ui.settings.updateGeneratedImageWatermarkRemoval(payload);
            return;
        }
        if (action === 'RESTORE_ACCOUNT_INDICES') {
            this.ui.settings.updateAccountIndices(payload);
            return;
        }
        if (action === 'RESTORE_SIDEBAR_EXPANDED') {
            if (typeof this.ui.sidebar?.restoreSidebarExpanded === 'function') {
                this.ui.sidebar.restoreSidebarExpanded(payload);
            }
            return;
        }
        if (action === 'RESTORE_APP_VERSION') {
            this.ui.settings.updateAppVersion(payload);
            return;
        }
        if (action === 'OPEN_SETTINGS_MODAL') {
            this.ui.settings.open();
            return;
        }
        if (action === 'SET_HOST_CONTEXT') {
            if (typeof this.ui.setHostContext === 'function') {
                this.ui.setHostContext(payload || {});
            }
            if (typeof this.app.setHostContext === 'function') {
                this.app.setHostContext(payload || {});
            }
            return;
        }
        if (action === 'VISIBILITY_CHANGED') {
            if (typeof this.app.handleVisibilityChange === 'function') {
                this.app.handleVisibilityChange(payload);
            }
            return;
        }

        this.app.handleIncomingMessage(event);
    }
}
