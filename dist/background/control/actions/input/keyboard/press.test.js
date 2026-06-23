import { describe, expect, it, vi } from 'vitest';
import { handlePressKey } from './press.js';

function createHandler() {
    return {
        cmd: vi.fn(() => Promise.resolve({})),
        waitHelper: {
            execute: vi.fn(async (fn) => fn()),
        },
    };
}

describe('handlePressKey', () => {
    it('returns a clear error when key is missing', async () => {
        const handler = createHandler();

        const result = await handlePressKey(handler, {});

        expect(result).toBe("Error pressing key : 'key' must be a non-empty string.");
        expect(handler.cmd).not.toHaveBeenCalled();
    });

    it('dispatches modifier combinations in order', async () => {
        const handler = createHandler();

        const result = await handlePressKey(handler, { key: 'Control+Shift+R' });

        expect(result).toBe('Pressed key: Control+Shift+R');
        expect(handler.cmd.mock.calls.map((call) => [call[0], call[1].type, call[1].key])).toEqual([
            ['Input.dispatchKeyEvent', 'keyDown', 'Control'],
            ['Input.dispatchKeyEvent', 'keyDown', 'Shift'],
            ['Input.dispatchKeyEvent', 'keyDown', 'R'],
            ['Input.dispatchKeyEvent', 'keyUp', 'R'],
            ['Input.dispatchKeyEvent', 'keyUp', 'Shift'],
            ['Input.dispatchKeyEvent', 'keyUp', 'Control'],
        ]);
    });
});
