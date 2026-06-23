// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function installSelectionObserver() {
    vi.resetModules();
    delete window.GeminiSelectionObserver;
    await import('./selection.js');
}

function selectNodeContents(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

describe('SelectionObserver', () => {
    beforeEach(async () => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
        window.Range.prototype.getBoundingClientRect = vi.fn(() => ({
            left: 10,
            top: 20,
            right: 80,
            bottom: 40,
            width: 70,
            height: 20,
        }));
        await installSelectionObserver();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('captures selected page text even when the page stops mouseup propagation', () => {
        const paragraph = document.createElement('p');
        paragraph.textContent = 'blocked bubble selection';
        paragraph.addEventListener('mouseup', (event) => event.stopPropagation());
        document.body.appendChild(paragraph);

        const onSelection = vi.fn();
        const observer = new window.GeminiSelectionObserver({ onSelection });

        selectNodeContents(paragraph);
        paragraph.dispatchEvent(
            new MouseEvent('mouseup', { bubbles: true, clientX: 24, clientY: 36 })
        );
        vi.advanceTimersByTime(20);

        expect(onSelection).toHaveBeenCalledTimes(1);
        expect(onSelection.mock.calls[0][0]).toMatchObject({
            text: 'blocked bubble selection',
            mousePoint: { x: 24, y: 36 },
        });

        observer.disconnect();
    });

    it('captures selected text from active text inputs', () => {
        const input = document.createElement('input');
        input.value = 'input selection';
        document.body.appendChild(input);
        input.focus();
        input.selectionStart = 0;
        input.selectionEnd = 5;

        const onSelection = vi.fn();
        const onClear = vi.fn();
        const observer = new window.GeminiSelectionObserver({ onSelection, onClear });

        input.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 12, clientY: 16 }));
        vi.advanceTimersByTime(20);

        expect(onSelection).toHaveBeenCalledTimes(1);
        expect(onSelection.mock.calls[0][0]).toMatchObject({
            text: 'input',
            rect: {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: 0,
                height: 0,
            },
            mousePoint: { x: 12, y: 16 },
        });
        expect(onClear).not.toHaveBeenCalled();

        observer.disconnect();
    });
});
