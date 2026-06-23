import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextHandler } from './context_handler.js';

describe('ContextHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('responds with an error when setting context fails', async () => {
        const error = new Error('Context persistence failed');
        const handler = new ContextHandler({
            setContext: vi.fn(async () => {
                throw error;
            }),
        });
        const sendResponse = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            expect(
                handler.handleSetContext({ context: {}, model: 'gemini-web' }, sendResponse)
            ).toBe(true);

            await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledTimes(1));
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'Context persistence failed',
            });
            expect(errorSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to set Web auth context:',
                error
            );
        } finally {
            errorSpy.mockRestore();
        }
    });

    it('responds with an error when resetting context fails', async () => {
        const error = new Error('Context cleanup failed');
        const handler = new ContextHandler({
            resetContext: vi.fn(async () => {
                throw error;
            }),
        });
        const sendResponse = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
            expect(handler.handleResetContext({}, sendResponse)).toBe(true);

            await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledTimes(1));
            expect(sendResponse).toHaveBeenCalledWith({
                status: 'error',
                error: 'Context cleanup failed',
            });
            expect(errorSpy).toHaveBeenCalledWith(
                '[Gemini Nexus] Failed to reset Web auth context:',
                error
            );
        } finally {
            errorSpy.mockRestore();
        }
    });
});
