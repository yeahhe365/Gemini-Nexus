import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendAnthropicMessage } from './anthropic.js';

function makeAnthropicSseStream(events) {
    const encoder = new TextEncoder();
    const payload = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join('');

    return {
        getReader() {
            return {
                read: vi
                    .fn()
                    .mockResolvedValueOnce({ done: false, value: encoder.encode(payload) })
                    .mockResolvedValueOnce({ done: true }),
            };
        },
    };
}

describe('sendAnthropicMessage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            body: makeAnthropicSseStream([
                {
                    type: 'content_block_delta',
                    delta: { type: 'thinking_delta', thinking: 'thinking...' },
                },
                {
                    type: 'content_block_delta',
                    delta: { type: 'text_delta', text: 'done' },
                },
            ]),
        });
    });

    it('sends native Anthropic messages and streams thinking deltas', async () => {
        const onUpdate = vi.fn();

        await expect(
            sendAnthropicMessage(
                'Hello',
                'system',
                [],
                {
                    baseUrl: 'https://api.anthropic.com/v1',
                    apiKey: 'anthropic-key',
                    model: 'claude-test',
                    thinkingLevel: 'high',
                },
                [],
                null,
                onUpdate
            )
        ).resolves.toEqual({
            text: 'done',
            thoughts: 'thinking...',
            sources: [],
            images: [],
            context: null,
        });

        const [url, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(url).toBe('https://api.anthropic.com/v1/messages');
        expect(init.headers).toEqual(
            expect.objectContaining({
                'x-api-key': 'anthropic-key',
                'anthropic-version': '2023-06-01',
            })
        );
        expect(payload).toEqual(
            expect.objectContaining({
                model: 'claude-test',
                system: 'system',
                thinking: { type: 'enabled', budget_tokens: 4096 },
                messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
                stream: true,
            })
        );
        expect(onUpdate).toHaveBeenCalledWith('', 'thinking...');
        expect(onUpdate).toHaveBeenCalledWith('done', 'thinking...');
    });

    it('encodes image attachments as Anthropic image content blocks', async () => {
        await sendAnthropicMessage(
            'Describe',
            '',
            [],
            {
                baseUrl: 'https://api.anthropic.com/v1',
                apiKey: 'anthropic-key',
                model: 'claude-test',
            },
            [
                {
                    base64: 'data:image/png;base64,AAAA',
                    type: 'image/png',
                    name: 'capture.png',
                },
            ],
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.messages[0].content).toEqual([
            {
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: 'AAAA',
                },
            },
            { type: 'text', text: 'Describe' },
        ]);
    });

    it('uses adaptive thinking for Claude models that reject fixed thinking budgets', async () => {
        for (const model of [
            'claude-jupiter-v1-p',
            'claude-mythos-preview',
            'claude-opus-4-7',
            'claude-opus-4-8-20261201',
        ]) {
            global.fetch.mockClear();

            await sendAnthropicMessage(
                'Think carefully',
                '',
                [],
                {
                    baseUrl: 'https://api.anthropic.com/v1',
                    apiKey: 'anthropic-key',
                    model,
                    thinkingLevel: 'medium',
                },
                [],
                null,
                vi.fn()
            );

            const [, init] = global.fetch.mock.calls[0];
            const payload = JSON.parse(init.body);
            expect(payload.thinking).toEqual({ type: 'adaptive' });
            expect(payload.output_config).toEqual({ effort: 'medium' });
        }
    });

    it('retries without thinking config when API rejects thinking parameters', async () => {
        const encoder = new TextEncoder();
        const errorResponse = {
            ok: false,
            status: 400,
            clone: vi.fn().mockReturnValue({
                ok: false,
                text: vi.fn().mockResolvedValue('thinking is not supported for this model'),
            }),
            text: vi.fn().mockResolvedValue('thinking is not supported for this model'),
        };
        const successResponse = {
            ok: true,
            body: {
                getReader: () => ({
                    read: vi
                        .fn()
                        .mockResolvedValueOnce({
                            done: false,
                            value: encoder.encode(
                                `data: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'done' } })}\n\n`
                            ),
                        })
                        .mockResolvedValueOnce({ done: true }),
                }),
            },
        };

        global.fetch
            .mockResolvedValueOnce(errorResponse)
            .mockResolvedValueOnce(successResponse);

        await sendAnthropicMessage(
            'Hello',
            '',
            [],
            {
                baseUrl: 'https://api.anthropic.com/v1',
                apiKey: 'anthropic-key',
                model: 'claude-unknown-model',
                thinkingLevel: 'high',
            },
            [],
            null,
            vi.fn()
        );

        expect(global.fetch).toHaveBeenCalledTimes(2);
        const [, firstInit] = global.fetch.mock.calls[0];
        const firstPayload = JSON.parse(firstInit.body);
        expect(firstPayload.thinking).toEqual({ type: 'enabled', budget_tokens: 4096 });

        const [, secondInit] = global.fetch.mock.calls[1];
        const secondPayload = JSON.parse(secondInit.body);
        expect(secondPayload.thinking).toBeUndefined();
        expect(secondPayload.output_config).toBeUndefined();
    });
});
