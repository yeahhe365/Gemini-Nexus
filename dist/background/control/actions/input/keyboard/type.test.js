import { describe, expect, it, vi } from 'vitest';
import { handleTypeText } from './type.js';

function createHandler() {
    return {
        cmd: vi.fn(() => Promise.resolve({})),
        waitHelper: {
            execute: vi.fn(async (fn) => fn()),
        },
    };
}

describe('handleTypeText', () => {
    it('inserts text into the focused element', async () => {
        const handler = createHandler();

        const result = await handleTypeText(handler, { text: 'hello' });

        expect(result).toBe('Typed text: hello');
        expect(handler.cmd).toHaveBeenCalledWith('Input.insertText', { text: 'hello' });
    });
});
