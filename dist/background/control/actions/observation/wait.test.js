import { describe, expect, it, vi } from 'vitest';
import { ObservationActions } from './index.js';

describe('ObservationActions waitFor', () => {
    it('waits for any requested text and returns the matched text', async () => {
        const connection = {
            sendCommand: vi.fn(() => Promise.resolve({ result: { value: 'Dashboard' } })),
        };
        const actions = new ObservationActions(connection, {}, {});

        const result = await actions.waitFor({ text: ['Dashboard', 'Home'], timeout: 750 });

        expect(connection.sendCommand).toHaveBeenCalledWith(
            'Runtime.evaluate',
            expect.objectContaining({
                awaitPromise: true,
                returnByValue: true,
            })
        );
        expect(result).toBe('Found text: Dashboard');
    });
});
