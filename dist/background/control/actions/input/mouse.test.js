import { describe, expect, it, vi } from 'vitest';
import { MouseActions } from './mouse.js';

function createActions() {
    const connection = {
        sendCommand: vi.fn((method) => {
            if (method === 'DOM.resolveNode') {
                return Promise.resolve({ object: { objectId: 'object-1' } });
            }
            if (method === 'DOM.getBoxModel') {
                return Promise.resolve({
                    model: {
                        content: [0, 10, 20, 10, 20, 30, 0, 30],
                    },
                });
            }
            return Promise.resolve({ result: { value: true } });
        }),
    };
    const snapshotManager = {
        getBackendNodeId: vi.fn(() => 123),
    };
    const waitHelper = {
        execute: vi.fn(async (fn) => fn()),
    };
    return {
        actions: new MouseActions(connection, snapshotManager, waitHelper),
        connection,
    };
}

describe('MouseActions', () => {
    it('hovers over an element center using trusted mouse events', async () => {
        const { actions, connection } = createActions();

        const result = await actions.hoverElement({ uid: '1_2' });

        expect(result).toBe('Hovered element 1_2 at 10,20');
        expect(connection.sendCommand).toHaveBeenCalledWith('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: 10,
            y: 20,
        });
    });
});
