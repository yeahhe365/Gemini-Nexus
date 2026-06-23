// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installMessageRouter() {
    vi.resetModules();
    globalThis.chrome = {
        runtime: {
            onMessage: {
                addListener: vi.fn(),
                removeListener: vi.fn(),
            },
            sendMessage: vi.fn(),
        },
    };
    await import('./messages.js');
    return window.GeminiMessageRouter;
}

function createHarness() {
    return {
        overlay: {
            start: vi.fn(),
        },
        toolbar: {
            currentMode: 'ask',
            handleContextAction: vi.fn(),
            handleCropResult: vi.fn(),
            hideAll: vi.fn(),
            showGlobalInput: vi.fn(),
            showExtensionError: vi.fn(),
        },
    };
}

describe('GeminiMessageRouter capture routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete window.GeminiMessageRouter;
    });

    it('forwards side panel crop failures back to the requesting side panel tab', async () => {
        const router = await installMessageRouter();
        const { overlay, toolbar } = createHarness();
        router.init(toolbar, overlay);

        const sendResponse = vi.fn();
        router.handle(
            {
                action: 'START_SELECTION',
                image: 'data:image/png;base64,AAAA',
                mode: 'snip',
                source: 'sidepanel',
                targetSidePanelTabId: 123,
            },
            {},
            sendResponse
        );
        router.handle(
            {
                action: 'CROP_SCREENSHOT_FAILED',
                error: 'Capture failed',
            },
            {},
            sendResponse
        );

        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'SCREEN_CAPTURE_ERROR',
            error: 'Capture failed',
            tabId: 123,
        });
        expect(toolbar.showExtensionError).not.toHaveBeenCalled();
        expect(sendResponse).toHaveBeenLastCalledWith({ status: 'ok' });
    });

    it('logs side panel crop failure forwarding errors without keeping stale routing state', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const router = await installMessageRouter();
        chrome.runtime.sendMessage.mockRejectedValueOnce(new Error('Background unavailable'));
        const { overlay, toolbar } = createHarness();
        router.init(toolbar, overlay);
        const sendResponse = vi.fn();

        try {
            router.handle(
                {
                    action: 'START_SELECTION',
                    image: 'data:image/png;base64,AAAA',
                    mode: 'snip',
                    source: 'sidepanel',
                    targetSidePanelTabId: 123,
                },
                {},
                sendResponse
            );
            router.handle(
                {
                    action: 'CROP_SCREENSHOT_FAILED',
                    error: 'Capture failed',
                },
                {},
                sendResponse
            );
            await Promise.resolve();

            expect(warnSpy).toHaveBeenCalledWith(
                'Could not forward side panel capture message:',
                expect.any(Error)
            );
            expect(router.captureSource).toBeNull();
            expect(router.captureTargetSidePanelTabId).toBeNull();
            expect(sendResponse).toHaveBeenLastCalledWith({ status: 'ok' });
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('shows local crop failures in the floating toolbar', async () => {
        const router = await installMessageRouter();
        const { overlay, toolbar } = createHarness();
        router.init(toolbar, overlay);

        const sendResponse = vi.fn();
        router.handle(
            {
                action: 'START_SELECTION',
                image: 'data:image/png;base64,AAAA',
                mode: 'snip',
                source: 'local',
            },
            {},
            sendResponse
        );
        router.handle(
            {
                action: 'CROP_SCREENSHOT_FAILED',
                error: 'Capture failed',
            },
            {},
            sendResponse
        );

        expect(toolbar.showExtensionError).toHaveBeenCalledWith('Capture failed');
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: 'SCREEN_CAPTURE_ERROR' })
        );
    });

    it('opens quick ask when requested by the browser command', async () => {
        const router = await installMessageRouter();
        const { overlay, toolbar } = createHarness();
        router.init(toolbar, overlay);
        const sendResponse = vi.fn();

        const handled = router.handle({ action: 'SHOW_QUICK_ASK' }, {}, sendResponse);

        expect(handled).toBe(true);
        expect(toolbar.showGlobalInput).toHaveBeenCalledWith(false);
        expect(sendResponse).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('removes the previous router listener when content scripts are reinjected', async () => {
        const firstRouter = await installMessageRouter();
        const { overlay, toolbar } = createHarness();
        firstRouter.init(toolbar, overlay);

        vi.resetModules();
        await import('./messages.js');

        expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(
            firstRouter.handleRuntimeMessage
        );
        expect(window.GeminiMessageRouter).not.toBe(firstRouter);
    });

    it('clears side panel capture routing when the selection overlay is cancelled', async () => {
        const router = await installMessageRouter();
        const { overlay, toolbar } = createHarness();
        router.init(toolbar, overlay);

        const sendResponse = vi.fn();
        router.handle(
            {
                action: 'START_SELECTION',
                image: 'data:image/png;base64,AAAA',
                mode: 'snip',
                source: 'sidepanel',
                targetSidePanelTabId: 123,
            },
            {},
            sendResponse
        );

        const [, options] = overlay.start.mock.calls[0];
        options.onCancel();
        router.handle(
            {
                action: 'CROP_SCREENSHOT',
                image: 'data:image/png;base64,BBBB',
                area: { x: 1, y: 2, width: 10, height: 20 },
            },
            {},
            sendResponse
        );

        expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: 'PROCESS_CROP_IN_SIDEPANEL' })
        );
        expect(toolbar.handleCropResult).toHaveBeenCalledWith({
            action: 'CROP_SCREENSHOT',
            image: 'data:image/png;base64,BBBB',
            area: { x: 1, y: 2, width: 10, height: 20 },
        });
    });

    it('logs side panel crop result forwarding errors without keeping stale routing state', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const router = await installMessageRouter();
        chrome.runtime.sendMessage.mockRejectedValueOnce(new Error('Background unavailable'));
        const { overlay, toolbar } = createHarness();
        router.init(toolbar, overlay);
        const sendResponse = vi.fn();

        try {
            router.handle(
                {
                    action: 'START_SELECTION',
                    image: 'data:image/png;base64,AAAA',
                    mode: 'snip',
                    source: 'sidepanel',
                    targetSidePanelTabId: 123,
                },
                {},
                sendResponse
            );
            router.handle(
                {
                    action: 'CROP_SCREENSHOT',
                    image: 'data:image/png;base64,BBBB',
                    area: { x: 1, y: 2, width: 10, height: 20 },
                },
                {},
                sendResponse
            );
            await Promise.resolve();

            expect(warnSpy).toHaveBeenCalledWith(
                'Could not forward side panel capture message:',
                expect.any(Error)
            );
            expect(router.captureSource).toBeNull();
            expect(router.captureTargetSidePanelTabId).toBeNull();
            expect(toolbar.handleCropResult).not.toHaveBeenCalled();
            expect(sendResponse).toHaveBeenLastCalledWith({ status: 'ok' });
        } finally {
            warnSpy.mockRestore();
        }
    });
});
