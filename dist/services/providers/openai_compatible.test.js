import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendOpenAIMessage } from './openai_compatible.js';

function makeChatSseStream(text = 'ok') {
    const encoder = new TextEncoder();
    const payload = `data: ${JSON.stringify({
        choices: [{ delta: { content: text } }],
    })}\n\ndata: [DONE]\n\n`;

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

function makeOpenRouterReasoningStream() {
    const encoder = new TextEncoder();
    const payload = [
        {
            choices: [{ delta: { reasoning: 'thinking ', content: '' } }],
        },
        {
            choices: [{ delta: { reasoning_details: [{ text: 'more' }] } }],
        },
        {
            choices: [{ delta: { content: 'done' } }],
        },
    ]
        .map((event) => `data: ${JSON.stringify(event)}\n\n`)
        .join('');

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

describe('sendOpenAIMessage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            body: makeChatSseStream('done'),
        });
    });

    it('replays stored user image attachments from normalized metadata', async () => {
        await sendOpenAIMessage(
            'Continue',
            '',
            [
                {
                    role: 'user',
                    text: 'Look at this',
                    attachments: [
                        {
                            base64: 'data:image/png;base64,AAAA',
                            type: 'image/png',
                            name: 'image.png',
                        },
                    ],
                },
            ],
            {
                baseUrl: 'https://api.example.test/v1',
                model: 'gpt-test',
            },
            [],
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.messages[0]).toEqual({
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: 'data:image/png;base64,AAAA',
                        detail: 'high',
                    },
                },
                { type: 'text', text: 'Look at this' },
            ],
        });
    });

    it('marks stored non-image attachments instead of silently dropping them', async () => {
        await sendOpenAIMessage(
            'Continue',
            '',
            [
                {
                    role: 'user',
                    text: 'Review spec',
                    attachments: [
                        {
                            base64: 'data:application/pdf;base64,BBBB',
                            type: 'application/pdf',
                            name: 'spec.pdf',
                        },
                    ],
                },
            ],
            {
                baseUrl: 'https://api.example.test/v1',
                model: 'gpt-test',
            },
            [],
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.messages[0]).toEqual({
            role: 'user',
            content: 'Review spec\n[1 unsupported file attachment(s) omitted: spec.pdf]',
        });
    });

    it('rejects current non-image attachments before sending an OpenAI request', async () => {
        await expect(
            sendOpenAIMessage(
                'Review attached spec',
                '',
                [],
                {
                    baseUrl: 'https://api.example.test/v1',
                    model: 'gpt-test',
                },
                [
                    {
                        base64: 'data:application/pdf;base64,BBBB',
                        type: 'application/pdf',
                        name: 'spec.pdf',
                    },
                ],
                null,
                vi.fn()
            )
        ).rejects.toThrow(/supports image attachments only/);

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('keeps image data URLs with generic MIME metadata in Chat Completions payloads', async () => {
        await sendOpenAIMessage(
            'Describe this image',
            '',
            [],
            {
                baseUrl: 'https://api.x.ai/v1',
                model: 'grok-4.3',
            },
            [
                {
                    base64: 'data:application/octet-stream;base64,iVBORw0KGgoAAA',
                    type: 'application/octet-stream',
                    name: 'capture.bin',
                },
            ],
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.messages[payload.messages.length - 1]).toEqual({
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: 'data:image/png;base64,iVBORw0KGgoAAA',
                        detail: 'high',
                    },
                },
                { type: 'text', text: 'Describe this image' },
            ],
        });
    });

    it('merges provider-specific Chat Completions payload options', async () => {
        await sendOpenAIMessage(
            'Think',
            '',
            [],
            {
                baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
                model: 'glm-test',
                chatPayload: { thinking: { type: 'enabled' } },
            },
            [],
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.thinking).toEqual({ type: 'enabled' });
    });

    it('streams OpenRouter reasoning deltas into thoughts', async () => {
        const onUpdate = vi.fn();
        global.fetch.mockResolvedValueOnce({
            ok: true,
            body: makeOpenRouterReasoningStream(),
        });

        await expect(
            sendOpenAIMessage(
                'Think',
                '',
                [],
                {
                    baseUrl: 'https://openrouter.ai/api/v1',
                    model: 'openai/gpt-5.2',
                    chatPayload: {
                        reasoning: { effort: 'high', exclude: false },
                    },
                },
                [],
                null,
                onUpdate
            )
        ).resolves.toEqual(
            expect.objectContaining({
                text: 'done',
                thoughts: 'thinking more',
            })
        );

        expect(onUpdate).toHaveBeenLastCalledWith('done', 'thinking more');
    });

    it('keeps image data URLs in Responses API payloads with high detail', async () => {
        await sendOpenAIMessage(
            'Describe this image',
            '',
            [],
            {
                baseUrl: 'https://api.x.ai/v1',
                model: 'grok-4.3',
                useResponsesApi: true,
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

        const [url, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(url).toBe('https://api.x.ai/v1/responses');
        expect(payload.input[payload.input.length - 1]).toEqual({
            role: 'user',
            content: [
                {
                    type: 'input_image',
                    image_url: 'data:image/png;base64,AAAA',
                    detail: 'high',
                },
                { type: 'input_text', text: 'Describe this image' },
            ],
        });
        expect(payload.store).toBe(false);
    });

    it('does not disable storage for non-xAI Responses API image payloads', async () => {
        await sendOpenAIMessage(
            'Describe this image',
            '',
            [],
            {
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-5',
                useResponsesApi: true,
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
        expect(payload.input[payload.input.length - 1].content[0]).toEqual({
            type: 'input_image',
            image_url: 'data:image/png;base64,AAAA',
            detail: 'high',
        });
        expect(payload).not.toHaveProperty('store');
    });

    it('disables xAI Responses storage when replayed history contains image attachments', async () => {
        await sendOpenAIMessage(
            'Continue',
            '',
            [
                {
                    role: 'user',
                    text: 'Earlier image',
                    attachments: [
                        {
                            base64: 'data:image/png;base64,BBBB',
                            type: 'image/png',
                            name: 'earlier.png',
                        },
                    ],
                },
            ],
            {
                baseUrl: 'https://api.x.ai/v1',
                model: 'grok-4.3',
                useResponsesApi: true,
            },
            [],
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.store).toBe(false);
    });
});
