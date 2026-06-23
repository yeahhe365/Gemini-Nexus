(function () {
    if (window.GeminiNexusPageGuard?.isDisabled) return;
    const shortcuts = window.GeminiShortcuts;
    const router = window.GeminiMessageRouter;
    const Overlay = window.GeminiNexusOverlay;
    const Controller = window.GeminiToolbarController;
    const settingsSync = window.GeminiContentSettingsSync;

    if (window.GeminiNexusContentReady === true) {
        const floatingToolbar = window.GeminiNexusToolbarControllerInstance;
        let selectionOverlay = window.GeminiNexusSelectionOverlayInstance;

        if (!selectionOverlay && Overlay) {
            selectionOverlay = new Overlay();
            window.GeminiNexusSelectionOverlayInstance = selectionOverlay;
        }

        if (router && floatingToolbar && selectionOverlay && router.isInitialized !== true) {
            router.init(floatingToolbar, selectionOverlay);
        }

        shortcuts?.setController?.(floatingToolbar);
        return;
    }

    const selectionOverlay = new Overlay();
    const floatingToolbar = new Controller();
    window.GeminiNexusSelectionOverlayInstance = selectionOverlay;
    window.GeminiNexusToolbarControllerInstance = floatingToolbar;

    router.init(floatingToolbar, selectionOverlay);

    shortcuts?.setController?.(floatingToolbar);

    settingsSync?.init?.(floatingToolbar);

    window.GeminiNexusContentReady = true;
})();
