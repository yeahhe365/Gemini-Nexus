import { describe, expect, it, vi } from 'vitest';
import { readSseStream } from './sse_stream.js';

function streamFromChunks(chunks) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
        },
    });
}

describe('readSseStream', () => {
    it('resolves JSON endpoint events and RPC messages split across chunks', async () => {
        const conn = {
            _resolveSseEndpoint: vi.fn(),
            configKey: 'sse:key',
            initialized: true,
            sseAbort: {},
            ssePostUrl: null,
            transport: 'sse',
        };
        const resolvePendingRpcMessage = vi.fn();
        const clearPending = vi.fn();
        const reader = streamFromChunks([
            'event: endpoint\ndata: {"endpoint":',
            '"/messages"}\n\n',
            'event: mcp\ndata: {"jsonrpc":"2.0","id":7,',
            '"result":{"ok":true}}\n\n',
        ]).getReader();

        await readSseStream(conn, reader, 'http://localhost/sse', {
            resolvePendingRpcMessage,
            clearPending,
        });

        expect(conn._resolveSseEndpoint).toHaveBeenCalledWith('http://localhost/messages');
        expect(resolvePendingRpcMessage).toHaveBeenCalledWith({
            jsonrpc: '2.0',
            id: 7,
            result: { ok: true },
        });
        expect(clearPending).toHaveBeenCalledWith(expect.any(Error));
        expect(conn.initialized).toBe(false);
        expect(conn.transport).toBeNull();
        expect(conn.ssePostUrl).toBeNull();
    });
});
