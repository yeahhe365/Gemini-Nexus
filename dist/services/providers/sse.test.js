import { describe, expect, it } from 'vitest';
import { readSseJson } from './sse.js';

function createSseResponse(chunks) {
    const encoder = new TextEncoder();
    return {
        body: new ReadableStream({
            start(controller) {
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(chunk));
                }
                controller.close();
            },
        }),
    };
}

describe('readSseJson', () => {
    it('ignores malformed stream events while continuing to parse valid events', async () => {
        const events = [];
        const response = createSseResponse([
            'data: {"ok":true}\n',
            'data: {not-json}\n',
            'data: {"done":true}\n',
        ]);

        await readSseJson(response, (event) => {
            events.push(event);
        });

        expect(events).toEqual([{ ok: true }, { done: true }]);
    });

    it('propagates errors from the event callback', async () => {
        const response = createSseResponse(['data: {"ok":true}\n']);

        await expect(
            readSseJson(response, async () => {
                throw new Error('callback failed');
            })
        ).rejects.toThrow('callback failed');
    });
});
