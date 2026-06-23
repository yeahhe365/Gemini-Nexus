import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendRawMessages, appendUserMessage } from '../../../managers/history_manager.js';
import { injectBrowserControlSnapshot, persistToolOutputMessages } from './tool_loop.js';

vi.mock('../../../managers/history_manager.js', () => ({
    appendAiMessageIfDisplayable: vi.fn(),
    appendRawMessages: vi.fn(),
    appendUserMessage: vi.fn(),
}));

describe('browser-control tool loop handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not inject a fresh page snapshot into failed browser-control outputs', async () => {
        const controlManager = {
            getSnapshot: vi.fn(() => Promise.resolve('snapshot')),
        };

        const output = await injectBrowserControlSnapshot({
            toolResult: {
                source: 'browser_control',
                toolName: 'click',
                status: 'failed',
            },
            outputForModel: 'Error: Element is detached.',
            request: {
                enableBrowserControl: true,
            },
            controlManager,
        });

        expect(output).toBe('Error: Element is detached.');
        expect(controlManager.getSnapshot).not.toHaveBeenCalled();
    });

    it('persists native function responses and UI tool output with the same batch id', async () => {
        const sendRuntimeMessage = vi.fn(async () => {});
        const toolResult = {
            toolName: 'take_snapshot',
            source: 'browser_control',
            output: 'Snapshot text',
            outputForModel: 'Snapshot text',
            status: 'completed',
            statusKey: 'session-1|take_snapshot|call:call-1',
            officialResponseBatchId: 'official-tools|session-1|123|1',
            officialResponseParts: [
                {
                    functionResponse: {
                        id: 'call-1',
                        name: 'take_snapshot',
                        response: {
                            output: 'Snapshot text',
                            status: 'completed',
                        },
                    },
                },
            ],
            results: [
                {
                    id: 'call-1',
                    toolName: 'take_snapshot',
                    args: { uid: 'root' },
                    output: 'Snapshot text',
                    status: 'completed',
                    statusKey: 'session-1|take_snapshot|call:call-1',
                    startedAt: 100,
                    completedAt: 140,
                    durationMs: 40,
                    callIndex: 1,
                    callCount: 1,
                },
            ],
        };

        const persistedHistoryText = await persistToolOutputMessages({
            request: { sessionId: 'session-1' },
            result: {
                text: 'I need a snapshot.',
                thoughts: 'Thinking',
                officialContent: {
                    role: 'model',
                    parts: [{ functionCall: { id: 'call-1', name: 'take_snapshot', args: {} } }],
                },
                functionCalls: [{ id: 'call-1', name: 'take_snapshot', args: {} }],
            },
            toolResult,
            loopCount: 1,
            pendingNativeCalls: true,
            sendRuntimeMessage,
        });

        expect(persistedHistoryText).toBe('');
        expect(sendRuntimeMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'TOOL_OUTPUT_MESSAGE',
                sessionId: 'session-1',
                toolName: 'take_snapshot',
                text: 'Snapshot text',
                toolCallText: JSON.stringify(
                    { tool: 'take_snapshot', args: { uid: 'root' } },
                    null,
                    2
                ),
                status: 'completed',
                step: 1,
            })
        );
        expect(appendRawMessages).toHaveBeenCalledWith('session-1', [
            expect.objectContaining({
                role: 'ai',
                text: 'I need a snapshot.',
                officialContent: expect.objectContaining({ role: 'model' }),
            }),
            expect.objectContaining({
                role: 'user',
                text: '',
                officialFunctionResponseBatchId: 'official-tools|session-1|123|1',
                officialContent: expect.objectContaining({ role: 'user' }),
            }),
            expect.objectContaining({
                role: 'user',
                kind: 'tool-output',
                toolName: 'take_snapshot',
                officialFunctionResponseBatchId: 'official-tools|session-1|123|1',
            }),
        ]);
        expect(appendUserMessage).not.toHaveBeenCalled();
    });
});
