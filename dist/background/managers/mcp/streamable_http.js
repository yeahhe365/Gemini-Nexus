import { mergeHttpTransportHeaders } from './transport.js';

export const STREAMABLE_HTTP_ACCEPT = 'application/json, text/event-stream';
export const STREAMABLE_SESSION_HEADER = 'MCP-Session-Id';
const MAX_STREAMABLE_RESUME_ATTEMPTS = 3;

function extractJsonRpcResult(message) {
    if (message && message.error) throw new Error(message.error.message || 'MCP error');
    if (message && message.result !== undefined) return message.result;
    return message;
}

function parseJsonText(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;

    try {
        return extractJsonRpcResult(JSON.parse(trimmed));
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
            return extractJsonRpcResult(JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)));
        } catch (error) {
            if (!(error instanceof SyntaxError)) throw error;
        }
    }

    return { content: [{ type: 'text', text: trimmed }] };
}

function isResponseForRequest(message, requestId) {
    return (
        message &&
        typeof message === 'object' &&
        message.id === requestId &&
        (message.result !== undefined || message.error !== undefined)
    );
}

function createStreamEndedError(lastEventId) {
    const error = new Error('MCP Streamable HTTP SSE response ended without a JSON-RPC result');
    if (lastEventId) error.lastEventId = lastEventId;
    return error;
}

export function getStreamableSessionId(response) {
    return response.headers.get(STREAMABLE_SESSION_HEADER) || '';
}

export function isStreamableHttpFallbackError(error) {
    return error && [400, 404, 405].includes(error.status);
}

export async function readStreamableHttpError(response) {
    try {
        return await response.text();
    } catch {
        return '';
    }
}

export async function parseStreamableHttpResponse(response, requestId, onMessage = () => {}) {
    const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
    if (!contentType.includes('text/event-stream')) {
        return parseJsonText(await response.text());
    }

    if (!response.body) return null;

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let eventType = 'message';
    let dataLines = [];
    let eventId = null;
    let lastEventId = '';

    const dispatch = () => {
        const payload = dataLines.join('\n').trim();
        const type = eventType || 'message';
        const currentEventId = eventId;
        eventType = 'message';
        dataLines = [];
        eventId = null;

        if (currentEventId !== null) lastEventId = currentEventId;

        if (!payload || (type !== 'message' && type !== 'mcp' && type !== 'data')) {
            return undefined;
        }

        const message = JSON.parse(payload);
        onMessage(message);
        if (isResponseForRequest(message, requestId)) return extractJsonRpcResult(message);
        return undefined;
    };

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let lineBreakIndex;
            while ((lineBreakIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, lineBreakIndex).replace(/\r$/, '');
                buffer = buffer.slice(lineBreakIndex + 1);

                if (line === '') {
                    const result = dispatch();
                    if (result !== undefined) return result;
                    continue;
                }
                if (line.startsWith(':')) continue;
                if (line.startsWith('event:')) {
                    eventType = line.slice('event:'.length).trim() || 'message';
                    continue;
                }
                if (line.startsWith('data:')) {
                    dataLines.push(line.slice('data:'.length).trimStart());
                    continue;
                }
                if (line.startsWith('id:')) {
                    eventId = line.slice('id:'.length).trim();
                }
            }
        }

        if (dataLines.length) {
            const result = dispatch();
            if (result !== undefined) return result;
        }
    } finally {
        try {
            reader.releaseLock();
        } catch {}
    }

    throw createStreamEndedError(lastEventId);
}

export async function sendStreamableHttpRpc(conn, method, params, context) {
    return sendStreamableHttpRpcRequest(conn, method, params, context, true);
}

async function sendStreamableHttpRpcRequest(conn, method, params, context, allowSessionRestart) {
    if (!conn.httpPostUrl) throw new Error('MCP Streamable HTTP not connected');

    const id = context.nextId();
    const rpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params: params || {},
    };

    const response = await fetch(conn.httpPostUrl, {
        method: 'POST',
        headers: mergeHttpTransportHeaders(conn, {
            'Content-Type': 'application/json',
            Accept: STREAMABLE_HTTP_ACCEPT,
        }),
        body: JSON.stringify(rpcRequest),
    });

    if (response.status === 404 && conn.sessionId && method !== 'initialize') {
        if (!allowSessionRestart) {
            throw new Error('MCP Streamable HTTP session expired during retry');
        }

        conn.sessionId = null;
        conn.protocolVersion = null;
        conn.initialized = false;
        await context.initializeHandshake();
        return sendStreamableHttpRpcRequest(conn, method, params, context, false);
    }

    const sessionId = getStreamableSessionId(response);
    if (sessionId) conn.sessionId = sessionId;

    if (!response.ok) {
        const text = await readStreamableHttpError(response);
        const error = new Error(
            `MCP Streamable HTTP error (${response.status}): ${text || response.statusText}`
        );
        error.status = response.status;
        throw error;
    }

    try {
        return await parseStreamableHttpResponse(response, id, context.onMessage);
    } catch (error) {
        if (!error?.lastEventId) throw error;
        return resumeStreamableHttpRpc(conn, id, context, error.lastEventId);
    }
}

async function resumeStreamableHttpRpc(conn, requestId, context, lastEventId) {
    let cursor = lastEventId;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_STREAMABLE_RESUME_ATTEMPTS && cursor; attempt++) {
        const response = await fetch(conn.httpPostUrl, {
            method: 'GET',
            headers: mergeHttpTransportHeaders(conn, {
                Accept: 'text/event-stream',
                'Last-Event-ID': cursor,
            }),
        });

        const sessionId = getStreamableSessionId(response);
        if (sessionId) conn.sessionId = sessionId;

        if (!response.ok) {
            const text = await readStreamableHttpError(response);
            const error = new Error(
                `MCP Streamable HTTP resume error (${response.status}): ${
                    text || response.statusText
                }`
            );
            error.status = response.status;
            throw error;
        }

        try {
            return await parseStreamableHttpResponse(response, requestId, context.onMessage);
        } catch (error) {
            lastError = error;
            if (!error?.lastEventId) throw error;
            cursor = error.lastEventId;
        }
    }

    throw lastError || new Error('MCP Streamable HTTP resume exhausted without a JSON-RPC result');
}
