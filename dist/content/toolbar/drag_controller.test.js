// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installDragController() {
    await import('./drag_controller.js');
}

function createDragElements() {
    const target = document.createElement('div');
    const handle = document.createElement('div');
    target.appendChild(handle);
    document.body.appendChild(target);

    target.getBoundingClientRect = vi.fn(() => ({
        left: 50,
        top: 40,
        right: 250,
        bottom: 160,
        width: 200,
        height: 120,
    }));

    return { target, handle };
}

describe('DragController', () => {
    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = '';
        window.matchMedia = vi.fn(() => ({ matches: false }));
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 300 });
        await installDragController();
    });

    it('moves fixed elements from the drag handle', () => {
        const { target, handle } = createDragElements();
        target.style.position = 'fixed';
        const onUndock = vi.fn();

        new window.GeminiDragController(target, handle, { onUndock });

        handle.dispatchEvent(
            new MouseEvent('mousedown', {
                button: 0,
                clientX: 70,
                clientY: 55,
                bubbles: true,
            })
        );
        document.dispatchEvent(
            new MouseEvent('mousemove', {
                clientX: 120,
                clientY: 95,
                bubbles: true,
            })
        );

        expect(onUndock).toHaveBeenCalledTimes(1);
        expect(target.classList.contains('dragging')).toBe(true);
        expect(target.style.left).toBe('100px');
        expect(target.style.top).toBe('80px');

        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

        expect(target.classList.contains('dragging')).toBe(false);
    });

    it('snaps to the closest horizontal edge after dragging', () => {
        const { target, handle } = createDragElements();
        target.style.position = 'fixed';
        const onSnap = vi.fn();

        new window.GeminiDragController(target, handle, { onSnap });
        handle.dispatchEvent(
            new MouseEvent('mousedown', {
                button: 0,
                clientX: 70,
                clientY: 55,
                bubbles: true,
            })
        );
        target.getBoundingClientRect = vi.fn(() => ({
            left: 5,
            top: 32,
            right: 205,
            bottom: 152,
            width: 200,
            height: 120,
        }));

        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

        expect(onSnap).toHaveBeenCalledWith('left', 32);
    });
});
