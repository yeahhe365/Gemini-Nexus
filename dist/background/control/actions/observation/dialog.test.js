import { describe, expect, it, vi } from 'vitest';
import { DialogActions } from './dialog.js';

describe('DialogActions', () => {
    it('accepts a JavaScript dialog with optional prompt text', async () => {
        const connection = {
            sendCommand: vi.fn(() => Promise.resolve({})),
        };
        const actions = new DialogActions(connection, {}, {});

        const result = await actions.handleDialog({ action: 'accept', promptText: 'hello' });

        expect(connection.sendCommand).toHaveBeenCalledWith('Page.handleJavaScriptDialog', {
            accept: true,
            promptText: 'hello',
        });
        expect(result).toBe('Accepted dialog');
    });
});
