import { describe, expect, it, vi } from 'vitest';
import { extractOfficialResponseData, sendOfficialMessage } from './official.js';

function makeSseStream(text = 'ok') {
    const encoder = new TextEncoder();
    const payload = `data: ${JSON.stringify({
        candidates: [{ content: { role: 'model', parts: [{ text }] } }],
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

describe('extractOfficialResponseData', () => {
    it('extracts visible text, thoughts, signatures, and function calls', () => {
        const duplicateFunctionCallPart = {
            functionCall: {
                id: 'call-1',
                name: 'take_snapshot',
                args: { uid: 'root' },
            },
        };

        const result = extractOfficialResponseData({
            content: {
                role: 'model',
                parts: [
                    { text: 'Thinking...', thought: true, thoughtSignature: 'sig-1' },
                    { text: 'Visible answer.' },
                    duplicateFunctionCallPart,
                    duplicateFunctionCallPart,
                    { thought: 'More reasoning.' },
                ],
            },
            groundingMetadata: {
                groundingChunks: [{ web: { uri: 'https://example.com/source', title: 'Example' } }],
            },
        });

        expect(result).toEqual({
            text: 'Visible answer.',
            thoughts: 'Thinking...More reasoning.',
            thoughtSignature: 'sig-1',
            officialContent: {
                role: 'model',
                parts: [
                    { text: 'Thinking...', thought: true, thoughtSignature: 'sig-1' },
                    { text: 'Visible answer.' },
                    duplicateFunctionCallPart,
                    duplicateFunctionCallPart,
                    { thought: 'More reasoning.' },
                ],
            },
            functionCalls: [
                {
                    id: 'call-1',
                    name: 'take_snapshot',
                    args: { uid: 'root' },
                    partIndex: 2,
                },
            ],
        });
    });

    it('returns an empty result for malformed candidates', () => {
        expect(extractOfficialResponseData({})).toEqual({
            text: '',
            thoughts: '',
            thoughtSignature: null,
            officialContent: null,
            functionCalls: [],
        });
    });

    it('replays stored non-image user attachments as inline data', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            body: makeSseStream('done'),
        });

        await sendOfficialMessage(
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
                baseUrl: 'https://api.example.test/v1beta',
                apiKey: 'key',
                model: 'gemini-test',
            },
            null,
            [],
            false,
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.contents[0]).toEqual({
            role: 'user',
            parts: [
                { text: 'Review spec' },
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: 'BBBB',
                    },
                },
            ],
        });
    });

    it('maps the Gemini Pro UI alias to the current official Gemini 3.1 Pro model id', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            body: makeSseStream('done'),
        });

        await sendOfficialMessage(
            'Hello',
            '',
            [],
            {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                apiKey: 'key',
                model: 'gemini-3-pro',
            },
            'low',
            [],
            false,
            null,
            vi.fn()
        );

        const [url] = global.fetch.mock.calls[0];
        expect(url).toContain('/models/gemini-3.1-pro-preview:streamGenerateContent');
    });

    it('does not send unsupported minimal thinking level to Gemini Pro models', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            body: makeSseStream('done'),
        });

        await sendOfficialMessage(
            'Hello',
            '',
            [],
            {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                apiKey: 'key',
                model: 'gemini-3-pro',
            },
            'minimal',
            [],
            false,
            null,
            vi.fn()
        );

        const [, init] = global.fetch.mock.calls[0];
        const payload = JSON.parse(init.body);
        expect(payload.generationConfig.thinkingConfig.thinkingLevel).toBe('low');
    });
});
