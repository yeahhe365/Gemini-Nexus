import { describe, expect, it } from 'vitest';
import {
    asHttpUrl,
    asWsUrl,
    hasHeaders,
    inferTransport,
    mergeHeaders,
    normalizeHeaders,
    stableHeadersKey,
} from './transport.js';

describe('MCP transport helpers', () => {
    it('converts HTTP URLs to WebSocket URLs for ws transport', () => {
        expect(asWsUrl('http://127.0.0.1:3006/mcp')).toBe('ws://127.0.0.1:3006/mcp');
        expect(asWsUrl('https://example.com/mcp')).toBe('wss://example.com/mcp');
        expect(asWsUrl('ws://localhost/mcp')).toBe('ws://localhost/mcp');
    });

    it('normalizes HTTP URL input without guessing protocols', () => {
        expect(asHttpUrl(' https://example.com/mcp ')).toBe('https://example.com/mcp');
        expect(asHttpUrl('localhost:3006/mcp')).toBe('localhost:3006/mcp');
        expect(asHttpUrl(null)).toBe('');
    });

    it('infers streamable HTTP for modern non-SSE HTTP endpoints', () => {
        expect(inferTransport('streamablehttp', 'http://localhost/mcp')).toBe('streamable-http');
        expect(inferTransport('websocket', 'ws://localhost/mcp')).toBe('ws');
        expect(inferTransport('sse', 'http://localhost/mcp')).toBe('streamable-http');
        expect(inferTransport('sse', 'http://localhost/sse')).toBe('sse');
    });

    it('normalizes and merges custom headers deterministically', () => {
        const headers = normalizeHeaders({ ' X-Zed ': ' z ', Empty: ' ', Missing: null, A: 1 });

        expect(headers).toEqual({ 'X-Zed': 'z', A: '1' });
        expect(hasHeaders(headers)).toBe(true);
        expect(stableHeadersKey(headers)).toBe('A:1\nX-Zed:z');
        expect(mergeHeaders({ Accept: 'application/json' }, headers)).toEqual({
            Accept: 'application/json',
            'X-Zed': 'z',
            A: '1',
        });
    });
});
