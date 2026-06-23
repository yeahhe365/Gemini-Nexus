import { describe, expect, it } from 'vitest';
import {
    createOfficialFunctionResponseMessage,
    createOfficialModelMessage,
    hasNativeFunctionCalls,
} from './official_function_response.js';

describe('official function response utilities', () => {
    it('detects and converts native official function call messages', () => {
        expect(hasNativeFunctionCalls({ functionCalls: [{ name: 'take_snapshot' }] })).toBe(true);
        expect(hasNativeFunctionCalls({ functionCalls: [{ name: '   ' }] })).toBe(false);

        expect(
            createOfficialFunctionResponseMessage([
                {
                    id: 'call-1',
                    toolName: 'take_snapshot',
                    output: 'snapshot',
                    status: 'completed',
                },
            ])
        ).toEqual({
            role: 'user',
            text: '',
            officialContent: {
                role: 'user',
                parts: [
                    {
                        functionResponse: {
                            id: 'call-1',
                            name: 'take_snapshot',
                            response: {
                                output: 'snapshot',
                                status: 'completed',
                            },
                        },
                    },
                ],
            },
        });
    });

    it('preserves official model content for history replay', () => {
        const result = {
            text: 'Visible answer',
            thoughts: 'Reasoning',
            thoughtsDurationSeconds: 3,
            sources: [{ title: 'Source', url: 'https://example.com' }],
            images: [{ url: 'https://example.com/image.png' }],
            thoughtSignature: 'signature',
            officialContent: {
                role: 'model',
                parts: [{ text: 'Visible answer' }],
            },
        };

        expect(createOfficialModelMessage(result)).toEqual({
            role: 'ai',
            text: 'Visible answer',
            thoughts: 'Reasoning',
            thoughtsDurationSeconds: 3,
            sources: [{ title: 'Source', url: 'https://example.com' }],
            generatedImages: [{ url: 'https://example.com/image.png' }],
            thoughtSignature: 'signature',
            officialContent: {
                role: 'model',
                parts: [{ text: 'Visible answer' }],
            },
        });
    });
});
