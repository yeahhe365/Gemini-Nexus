// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function installOverlay() {
    vi.resetModules();
    globalThis.chrome = {
        runtime: {
            sendMessage: vi.fn(),
        },
    };
    await import('./overlay.js');
    return window.GeminiNexusOverlay;
}

function createPointerEvent(overrides = {}) {
    return {
        button: 0,
        clientX: 10,
        clientY: 10,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ...overrides,
    };
}

function setSelectionRect(overlay, rect) {
    overlay.selectionBox.getBoundingClientRect = () => rect;
}

describe('SelectionOverlay capture lifecycle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '';
        delete window.GeminiNexusOverlay;
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('notifies cancellation when Escape closes an active selection overlay', async () => {
        const Overlay = await installOverlay();
        const onCancel = vi.fn();
        const overlay = new Overlay();

        overlay.start('data:image/png;base64,SCREEN', { onCancel });
        overlay.onKeyDown(createPointerEvent({ key: 'Escape' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(document.getElementById('gemini-nexus-overlay')).toBeNull();
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('treats tiny selections as cancellation instead of sending an area', async () => {
        const Overlay = await installOverlay();
        const onCancel = vi.fn();
        const overlay = new Overlay();

        overlay.start('data:image/png;base64,SCREEN', { onCancel });
        overlay.onMouseDown(createPointerEvent({ clientX: 10, clientY: 10 }));
        setSelectionRect(overlay, { left: 10, top: 10, width: 3, height: 20 });
        overlay.onMouseUp(createPointerEvent({ clientX: 13, clientY: 30 }));
        await vi.advanceTimersByTimeAsync(60);

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('sends selected areas without firing the cancellation callback', async () => {
        const Overlay = await installOverlay();
        const onCancel = vi.fn();
        const overlay = new Overlay();

        overlay.start('data:image/png;base64,SCREEN', { onCancel });
        overlay.onMouseDown(createPointerEvent({ clientX: 10, clientY: 10 }));
        setSelectionRect(overlay, { left: 10, top: 10, width: 30, height: 40 });
        overlay.onMouseUp(createPointerEvent({ clientX: 40, clientY: 50 }));
        await vi.advanceTimersByTimeAsync(60);

        expect(onCancel).not.toHaveBeenCalled();
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            action: 'AREA_SELECTED',
            area: {
                x: 10,
                y: 10,
                width: 30,
                height: 40,
                pixelRatio: window.devicePixelRatio,
            },
        });
    });

    it('logs selected area message failures after cleaning up the overlay', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Overlay = await installOverlay();
        chrome.runtime.sendMessage.mockRejectedValueOnce(
            new Error('Extension context invalidated')
        );
        const overlay = new Overlay();

        try {
            overlay.start('data:image/png;base64,SCREEN');
            overlay.onMouseDown(createPointerEvent({ clientX: 10, clientY: 10 }));
            setSelectionRect(overlay, { left: 10, top: 10, width: 30, height: 40 });
            overlay.onMouseUp(createPointerEvent({ clientX: 40, clientY: 50 }));
            await vi.advanceTimersByTimeAsync(60);

            expect(document.getElementById('gemini-nexus-overlay')).toBeNull();
            expect(warnSpy).toHaveBeenCalledWith(
                'Could not send selected capture area:',
                expect.any(Error)
            );
        } finally {
            warnSpy.mockRestore();
        }
    });
});
