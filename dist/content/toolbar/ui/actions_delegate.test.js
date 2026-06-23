// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installActionsDelegate() {
    await import('./actions_delegate.js');
}

function createActionEvent() {
    return {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
    };
}

function createManager({ text = 'result text', inputValue = ' question ' } = {}) {
    return {
        fireCallback: vi.fn(),
        renderer: {
            currentText: text,
        },
        view: {
            elements: {
                askInput: {
                    value: inputValue,
                },
            },
            toggleCopyIcon: vi.fn(),
            showError: vi.fn(),
        },
    };
}

describe('ToolbarUIActions', () => {
    beforeEach(async () => {
        vi.useFakeTimers();
        vi.resetModules();
        globalThis.navigator.clipboard = {
            writeText: vi.fn(async () => {}),
        };
        await installActionsDelegate();
    });

    it('consumes interaction events before firing action callbacks', () => {
        const manager = createManager();
        const actions = new window.GeminiToolbarUIActions(manager);
        const event = createActionEvent();

        actions.triggerAction(event, 'translate');

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(event.stopPropagation).toHaveBeenCalledTimes(1);
        expect(manager.fireCallback).toHaveBeenCalledWith('onAction', 'translate');
    });

    it('copies the rendered result text and restores the copy icon', async () => {
        const manager = createManager({ text: 'copy me' });
        const actions = new window.GeminiToolbarUIActions(manager);
        const event = createActionEvent();

        await actions.copyResult(event);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy me');
        expect(manager.view.toggleCopyIcon).toHaveBeenCalledWith(true);

        vi.advanceTimersByTime(2000);

        expect(manager.view.toggleCopyIcon).toHaveBeenCalledWith(false);
    });

    it('submits trimmed Ask input text', () => {
        const manager = createManager({ inputValue: '  hello  ' });
        const actions = new window.GeminiToolbarUIActions(manager);

        actions.submitAsk();

        expect(manager.fireCallback).toHaveBeenCalledWith('onAction', 'submit_ask', 'hello');
    });
});
