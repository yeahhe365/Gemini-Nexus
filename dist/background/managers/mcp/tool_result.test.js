import { describe, expect, it, vi } from 'vitest';
import { normalizeMcpToolResult, summarizeInputSchema } from './tool_result.js';

describe('MCP tool result helpers', () => {
    it('normalizes string and text-content tool results', () => {
        expect(normalizeMcpToolResult('plain')).toEqual({ text: 'plain', files: [] });
        expect(
            normalizeMcpToolResult({
                content: [
                    { type: 'text', text: 'hello' },
                    { type: 'text', text: ' world' },
                ],
            })
        ).toEqual({ text: 'hello world', files: [] });
    });

    it('normalizes image content to data-url files', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1234);

        expect(
            normalizeMcpToolResult({
                content: [{ type: 'image', mimeType: 'image/png', data: 'abc123' }],
            })
        ).toEqual({
            text: '',
            files: [
                {
                    base64: 'data:image/png;base64,abc123',
                    type: 'image/png',
                    name: 'mcp-image-1234.png',
                },
            ],
        });
    });

    it('normalizes audio content to data-url files', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1234);

        expect(
            normalizeMcpToolResult({
                content: [{ type: 'audio', mimeType: 'audio/wav', data: 'abc123' }],
            })
        ).toEqual({
            text: '',
            files: [
                {
                    base64: 'data:audio/wav;base64,abc123',
                    type: 'audio/wav',
                    name: 'mcp-audio-1234.wav',
                },
            ],
        });
    });

    it('includes resource links and embedded resources in text output', () => {
        expect(
            normalizeMcpToolResult({
                content: [
                    {
                        type: 'resource_link',
                        uri: 'file:///project/src/main.rs',
                        name: 'main.rs',
                        description: 'Primary entry point',
                        mimeType: 'text/x-rust',
                    },
                    {
                        type: 'resource',
                        resource: {
                            uri: 'file:///project/README.md',
                            mimeType: 'text/markdown',
                            text: '# Project',
                        },
                    },
                ],
            }).text
        ).toBe(
            'Resource Link: main.rs <file:///project/src/main.rs> (text/x-rust) - Primary entry point\n\nEmbedded Resource: file:///project/README.md (text/markdown)\n```text\n# Project\n```'
        );
    });

    it('preserves MCP tool error results returned as normal JSON-RPC results', () => {
        expect(
            normalizeMcpToolResult({
                isError: true,
                content: [{ type: 'text', text: 'permission denied' }],
            })
        ).toEqual({ text: 'permission denied', files: [], isError: true });
    });

    it('includes structuredContent in the normalized text output', () => {
        expect(
            normalizeMcpToolResult({
                content: [{ type: 'text', text: 'summary' }],
                structuredContent: { matches: [{ title: 'MCP spec' }] },
            }).text
        ).toBe(
            'summary\n\nStructured Content:\n```json\n{\n  "matches": [\n    {\n      "title": "MCP spec"\n    }\n  ]\n}\n```'
        );
    });

    it('summarizes required input schema fields', () => {
        expect(
            summarizeInputSchema({
                required: ['url', 'count'],
                properties: {
                    url: { type: 'string' },
                    count: { type: 'number' },
                },
            })
        ).toBe('{ url: string, count: number }');

        expect(summarizeInputSchema({ properties: { optional: { type: 'string' } } })).toBe('{}');
    });
});
