import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveNoAuthModel, sendNoAuthGeminiMessage } from './noauth.js';

const BL_HTML = '<html>...<script>boq_assistant-bard-web-server_20990101.01_p0</script></html>';

function makeWrbLine(inner) {
    return JSON.stringify([[0, 'wrb.fr', JSON.stringify(inner)]]);
}

function buildInner(text) {
    const inner = new Array(102).fill(null);
    inner[4] = [[null, [text]]];
    return inner;
}

function streamResponse(chunks) {
    const encoder = new TextEncoder();
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        body: new ReadableStream({
            start(controller) {
                for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
                controller.close();
            },
        }),
    };
}

let fetchMock;

beforeEach(() => {
    fetchMock = vi.fn(async (url) => {
        if (String(url).includes('/app') || !String(url).includes('StreamGenerate')) {
            return { ok: true, text: async () => BL_HTML };
        }
        throw new Error('unexpected stream URL');
    });
    global.fetch = fetchMock;
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('resolveNoAuthModel', () => {
    it('maps known model names to MODE_CATEGORY ids', () => {
        expect(resolveNoAuthModel('gemini-3.7-flash')).toMatchObject({ mode: 1, think: 4 });
        expect(resolveNoAuthModel('gemini-3.6-flash')).toMatchObject({ mode: 1, think: 4 });
        expect(resolveNoAuthModel('gemini-3.5-flash-thinking')).toMatchObject({
            mode: 2,
            think: 0,
        });
        expect(resolveNoAuthModel('gemini-auto')).toMatchObject({ mode: 4, think: 4 });
    });

    it('honors @think=N override and falls back on unknown names', () => {
        expect(resolveNoAuthModel('gemini-3.6-flash@think=2')).toMatchObject({
            mode: 1,
            thinkMode: 2,
        });
        expect(resolveNoAuthModel('unknown-model-xyz')).toMatchObject({
            mode: 1,
            modelId: 1,
            thinkMode: 4,
        });
        expect(resolveNoAuthModel('')).toMatchObject({ mode: 1, modelId: 1, thinkMode: 4 });
    });
});

describe('sendNoAuthGeminiMessage', () => {
    it('builds the web2api payload and streams prefix-consistent deltas', async () => {
        const t1 =
            'Hello world, this is a sufficiently long response text to make the wrb line exceed the two hundred character threshold that the parser requires.';
        const t2 = t1 + ' And here is the second streaming chunk that continues.';

        fetchMock.mockImplementation(async (url, opts) => {
            if (!String(url).includes('StreamGenerate')) {
                return { ok: true, text: async () => BL_HTML };
            }
            // Capture the outgoing payload for structural assertions.
            const body = opts.body;
            const parts = new URLSearchParams(body);
            const outer = JSON.parse(parts.get('f.req'));
            const inner = JSON.parse(outer[1]);
            expect(inner[79]).toBe(1); // gemini-3.6-flash mode
            expect(inner[17]).toEqual([[4]]); // default think depth
            expect(inner[0][0]).toBe('My question');

            const line1 = makeWrbLine(buildInner(t1));
            const line2 = makeWrbLine(buildInner(t2));
            return streamResponse([line1 + '\n' + line2]); // tail without trailing newline
        });

        const updates = [];
        const result = await sendNoAuthGeminiMessage(
            'My question',
            'gemini-3.7-flash',
            [],
            undefined,
            (text) => updates.push(text)
        );

        expect(result).toEqual({ text: t2 });
        expect(updates).toEqual([t1, t2]);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('bl=boq_assistant-bard-web-server_20990101.01_p0'),
            expect.objectContaining({ credentials: 'omit' })
        );
    });

    it('throws a clear error when files are provided', async () => {
        await expect(
            sendNoAuthGeminiMessage('q', 'gemini-3.6-flash', [{ name: 'x' }], undefined, () => {})
        ).rejects.toThrow(/does not support image\/file/);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
