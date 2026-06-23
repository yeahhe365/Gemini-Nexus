// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installContentIndex(storageResult, options = {}) {
    vi.resetModules();
    window.history.replaceState(null, '', '/docs/page');
    const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => {});

    let storageChanged;
    const controller = {
        setSelectionEnabled: vi.fn(),
        setImageToolsEnabled: vi.fn(),
        setGeneratedImageWatermarkRemovalEnabled: vi.fn(),
        setCustomSelectionTools: vi.fn(),
    };
    const router = { init: vi.fn() };
    const shortcuts = { setController: vi.fn() };

    window.GeminiNexusPageGuard = { isDisabled: false };
    window.GeminiMessageRouter = router;
    window.GeminiShortcuts = shortcuts;
    window.GeminiNexusOverlay = vi.fn();
    window.GeminiToolbarController = vi.fn(() => controller);

    globalThis.chrome = {
        runtime: {
            lastError: null,
        },
        storage: {
            local: {
                get: vi.fn((keys, callback) => {
                    if (options.storageReadError) {
                        chrome.runtime.lastError = { message: options.storageReadError };
                    }
                    callback(storageResult);
                    chrome.runtime.lastError = null;
                }),
            },
            onChanged: {
                addListener: vi.fn((listener) => {
                    storageChanged = listener;
                }),
            },
        },
    };

    await import('./selection_blacklist.js');
    await import('./settings_sync.js');
    await import('./index.js');

    return { controller, storageChanged, postMessageSpy };
}

describe('content index text selection blacklist', () => {
    beforeEach(() => {
        delete window.GeminiSelectionBlacklist;
        delete window.GeminiContentSettingsSync;
        delete window.GeminiNexusContentReady;
        delete window.GeminiNexusToolbarControllerInstance;
        delete window.GeminiNexusSelectionOverlayInstance;
    });

    it('disables selection toolbar on blacklisted current pages', async () => {
        const { controller } = await installContentIndex({
            geminiTextSelectionEnabled: true,
            geminiTextSelectionBlacklist: 'localhost/docs',
        });

        expect(controller.setSelectionEnabled).toHaveBeenCalledWith(false);
    });

    it('recomputes selection toolbar availability when blacklist changes', async () => {
        const { controller, storageChanged } = await installContentIndex({
            geminiTextSelectionEnabled: true,
            geminiTextSelectionBlacklist: '',
        });

        controller.setSelectionEnabled.mockClear();
        storageChanged(
            {
                geminiTextSelectionBlacklist: { newValue: 'localhost/docs' },
            },
            'local'
        );

        expect(controller.setSelectionEnabled).toHaveBeenCalledWith(false);
    });

    it('marks the page as initialized so startup injection can avoid duplicates', async () => {
        const { controller } = await installContentIndex({
            geminiTextSelectionEnabled: true,
            geminiTextSelectionBlacklist: '',
        });

        expect(window.GeminiNexusContentReady).toBe(true);
        expect(controller.setSelectionEnabled).toHaveBeenCalledWith(true);
    });

    it('rebinds shortcut events and message routing when content scripts are reinjected', async () => {
        vi.resetModules();
        const controller = {};
        const selectionOverlay = {};
        const shortcuts = { setController: vi.fn() };
        const router = { init: vi.fn() };

        window.GeminiNexusPageGuard = { isDisabled: false };
        window.GeminiNexusContentReady = true;
        window.GeminiNexusToolbarControllerInstance = controller;
        window.GeminiNexusSelectionOverlayInstance = selectionOverlay;
        window.GeminiShortcuts = shortcuts;
        window.GeminiMessageRouter = router;
        window.GeminiToolbarController = vi.fn();

        await import('./index.js');

        expect(shortcuts.setController).toHaveBeenCalledWith(controller);
        expect(window.GeminiToolbarController).not.toHaveBeenCalled();
        expect(router.init).toHaveBeenCalledWith(controller, selectionOverlay);
    });

    it('creates a fresh selection overlay when reinjecting over an older ready page', async () => {
        vi.resetModules();
        const controller = {};
        const overlay = {};
        const shortcuts = { setController: vi.fn() };
        const router = { init: vi.fn() };

        window.GeminiNexusPageGuard = { isDisabled: false };
        window.GeminiNexusContentReady = true;
        window.GeminiNexusToolbarControllerInstance = controller;
        window.GeminiShortcuts = shortcuts;
        window.GeminiMessageRouter = router;
        window.GeminiNexusOverlay = vi.fn(() => overlay);
        window.GeminiToolbarController = vi.fn();

        await import('./index.js');

        expect(window.GeminiNexusOverlay).toHaveBeenCalledWith();
        expect(window.GeminiNexusSelectionOverlayInstance).toBe(overlay);
        expect(router.init).toHaveBeenCalledWith(controller, overlay);
    });

    it('loads and hot-updates custom selection tools', async () => {
        const tools = [{ id: 'formal', name: 'Formal', prompt: 'Rewrite: {text}' }];
        const { controller, storageChanged } = await installContentIndex({
            geminiTextSelectionEnabled: true,
            geminiTextSelectionBlacklist: '',
            geminiCustomSelectionTools: tools,
        });

        expect(controller.setCustomSelectionTools).toHaveBeenCalledWith(tools);

        const nextTools = [{ id: 'explain', name: 'Explain code', prompt: 'Explain:\n{text}' }];
        storageChanged(
            {
                geminiCustomSelectionTools: { newValue: nextTools },
            },
            'local'
        );

        expect(controller.setCustomSelectionTools).toHaveBeenLastCalledWith(nextTools);
    });

    it('loads and hot-updates generated image watermark cleanup', async () => {
        const { controller, postMessageSpy, storageChanged } = await installContentIndex({
            geminiTextSelectionEnabled: true,
            geminiTextSelectionBlacklist: '',
            geminiGeneratedImageWatermarkRemovalEnabled: false,
        });

        expect(controller.setGeneratedImageWatermarkRemovalEnabled).toHaveBeenCalledWith(false);
        expect(postMessageSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'GEMINI_NEXUS_WATERMARK_REMOVAL_ENABLED',
            }),
            '*'
        );

        storageChanged(
            {
                geminiGeneratedImageWatermarkRemovalEnabled: { newValue: true },
            },
            'local'
        );

        expect(controller.setGeneratedImageWatermarkRemovalEnabled).toHaveBeenLastCalledWith(true);
        expect(postMessageSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'GEMINI_NEXUS_WATERMARK_REMOVAL_ENABLED',
            }),
            '*'
        );
    });

    it('keeps current toolbar state when the initial settings read fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try {
            const { controller } = await installContentIndex(
                {
                    geminiTextSelectionEnabled: false,
                    geminiTextSelectionBlacklist: '',
                    geminiCustomSelectionTools: [{ id: 'formal' }],
                    geminiImageToolsEnabled: false,
                },
                { storageReadError: 'Storage unavailable' }
            );

            expect(controller.setSelectionEnabled).not.toHaveBeenCalled();
            expect(controller.setImageToolsEnabled).not.toHaveBeenCalled();
            expect(controller.setGeneratedImageWatermarkRemovalEnabled).not.toHaveBeenCalled();
            expect(controller.setCustomSelectionTools).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledWith(
                'Failed to load content toolbar settings:',
                'Storage unavailable'
            );
        } finally {
            warnSpy.mockRestore();
        }
    });
});
