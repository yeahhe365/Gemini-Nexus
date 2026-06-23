import { describe, expect, it, vi } from 'vitest';
import { ScriptEvaluationActions } from './script_evaluation.js';

function createActions(sendCommand) {
    const connection = {
        sendCommand,
    };
    const snapshotManager = {
        getBackendNodeId: vi.fn(() => 123),
    };
    return {
        actions: new ScriptEvaluationActions(connection, snapshotManager, {}),
        snapshotManager,
    };
}

describe('ScriptEvaluationActions', () => {
    it('evaluates page-level scripts with Runtime.evaluate', async () => {
        const sendCommand = vi.fn(() => Promise.resolve({ result: { value: 'Example' } }));
        const { actions } = createActions(sendCommand);

        const result = await actions.evaluateScript({
            script: 'return document.title;',
            args: [],
        });

        expect(sendCommand).toHaveBeenCalledWith(
            'Runtime.evaluate',
            expect.objectContaining({
                expression: expect.stringContaining('return document.title;'),
                awaitPromise: true,
                returnByValue: true,
                userGesture: true,
            })
        );
        expect(result).toBe('Example');
    });

    it('evaluates DOM UID scripts with Runtime.callFunctionOn', async () => {
        const sendCommand = vi.fn((method) => {
            if (method === 'DOM.resolveNode') {
                return Promise.resolve({ object: { objectId: 'object-1' } });
            }
            if (method === 'Runtime.callFunctionOn') {
                return Promise.resolve({ result: { value: 'Button text' } });
            }
            return Promise.resolve({});
        });
        const { actions } = createActions(sendCommand);

        const result = await actions.evaluateScript({
            script: 'return arguments[0].innerText;',
            args: [{ uid: '1_2' }],
        });

        expect(sendCommand).toHaveBeenCalledWith('DOM.resolveNode', { backendNodeId: 123 });
        expect(sendCommand).toHaveBeenCalledWith(
            'Runtime.callFunctionOn',
            expect.objectContaining({
                objectId: 'object-1',
                arguments: [{ objectId: 'object-1' }],
                awaitPromise: true,
                returnByValue: true,
                userGesture: true,
            })
        );
        expect(result).toBe('Button text');
    });
});
