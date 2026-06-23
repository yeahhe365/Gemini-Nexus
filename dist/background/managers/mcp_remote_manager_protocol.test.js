import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpRemoteManager } from './mcp_remote_manager.js';

function jsonResponse(body, headers = {}) {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });
}

describe('McpRemoteManager protocol integration', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('performs Streamable HTTP initialize, list, and call with session headers', async () => {
        const requests = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');
                requests.push({ url, headers: init.headers, body });

                if (body.method === 'initialize') {
                    return jsonResponse(
                        {
                            jsonrpc: '2.0',
                            id: body.id,
                            result: { protocolVersion: '2025-11-25' },
                        },
                        {
                            'MCP-Session-Id': 'session-1',
                        }
                    );
                }
                if (body.method === 'tools/list') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: { tools: [{ name: 'search', description: 'Search docs' }] },
                    });
                }
                if (body.method === 'tools/call') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: { content: [{ type: 'text', text: 'found it' }] },
                    });
                }
                return jsonResponse({ jsonrpc: '2.0', result: {} });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        const tools = await manager.listToolsForServer(
            'docs',
            'streamable-http',
            'http://localhost/mcp',
            { Authorization: 'Bearer local' }
        );
        const result = await manager.callToolById('docs__search', { q: 'nexus' }, [
            {
                id: 'docs',
                transport: 'streamable-http',
                url: 'http://localhost/mcp',
                headers: { Authorization: 'Bearer local' },
            },
        ]);

        expect(tools).toEqual([{ name: 'search', description: 'Search docs' }]);
        expect(result).toEqual({ text: 'found it', files: [] });
        const initializeRequest = requests.find((request) => request.body.method === 'initialize');
        expect(initializeRequest.body.params).toMatchObject({
            protocolVersion: '2025-11-25',
            capabilities: {},
        });
        expect(
            requests.find((request) => request.body.method === 'tools/list').headers
        ).toMatchObject({
            Authorization: 'Bearer local',
            'MCP-Session-Id': 'session-1',
            'MCP-Protocol-Version': '2025-11-25',
        });
        expect(
            requests.find((request) => request.body.method === 'tools/call').headers
        ).toMatchObject({
            Authorization: 'Bearer local',
            'MCP-Session-Id': 'session-1',
            'MCP-Protocol-Version': '2025-11-25',
        });
    });

    it('uses the protocol version selected by the server for later Streamable HTTP requests', async () => {
        const requests = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');
                requests.push({ headers: init.headers, body });

                if (body.method === 'initialize') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: { protocolVersion: '2025-03-26' },
                    });
                }
                return jsonResponse({
                    jsonrpc: '2.0',
                    id: body.id,
                    result: { tools: [] },
                });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        await manager.listToolsForServer('docs', 'streamable-http', 'http://localhost/mcp');

        expect(
            requests.find((request) => request.body.method === 'tools/list').headers
        ).toMatchObject({
            'MCP-Protocol-Version': '2025-03-26',
        });
    });

    it('rejects protocol versions not supported by the client', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');
                return jsonResponse({
                    jsonrpc: '2.0',
                    id: body.id,
                    result: { protocolVersion: '2099-01-01' },
                });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });

        await expect(
            manager.listToolsForServer('docs', 'streamable-http', 'http://localhost/mcp')
        ).rejects.toThrow('Unsupported MCP protocol version: 2099-01-01');
    });

    it('rejects Streamable HTTP JSON-RPC error responses', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');
                if (body.method === 'initialize') {
                    return jsonResponse({ jsonrpc: '2.0', id: body.id, result: {} });
                }
                return jsonResponse({
                    jsonrpc: '2.0',
                    id: body.id,
                    error: { code: -32601, message: 'Tool not found' },
                });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });

        await expect(
            manager.listToolsForServer('docs', 'streamable-http', 'http://localhost/mcp')
        ).rejects.toThrow('Tool not found');
    });

    it('follows tools/list pagination cursors', async () => {
        const listParams = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');

                if (body.method === 'initialize') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: { protocolVersion: '2025-11-25' },
                    });
                }
                if (body.method === 'tools/list') {
                    listParams.push(body.params || {});
                    if (!body.params?.cursor) {
                        return jsonResponse({
                            jsonrpc: '2.0',
                            id: body.id,
                            result: {
                                tools: [{ name: 'search', description: 'Search docs' }],
                                nextCursor: 'page-2',
                            },
                        });
                    }
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: {
                            tools: [{ name: 'read', description: 'Read docs' }],
                        },
                    });
                }
                return jsonResponse({ jsonrpc: '2.0', id: body.id, result: {} });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        const tools = await manager.listToolsForServer(
            'docs',
            'streamable-http',
            'http://localhost/mcp'
        );

        expect(listParams).toEqual([{}, { cursor: 'page-2' }]);
        expect(tools.map((tool) => tool.name)).toEqual(['search', 'read']);
    });

    it('parses Streamable HTTP text/event-stream responses', async () => {
        const encoder = new TextEncoder();

        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');

                if (body.method === 'initialize') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: { protocolVersion: '2025-11-25' },
                    });
                }
                if (body.method === 'tools/list') {
                    const stream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(
                                encoder.encode(
                                    `event: message\ndata: ${JSON.stringify({
                                        jsonrpc: '2.0',
                                        method: 'notifications/tools/list_changed',
                                    })}\n\n`
                                )
                            );
                            controller.enqueue(
                                encoder.encode(
                                    `event: message\ndata: ${JSON.stringify({
                                        jsonrpc: '2.0',
                                        id: body.id,
                                        result: {
                                            tools: [{ name: 'streamed', description: 'Streamed' }],
                                        },
                                    })}\n\n`
                                )
                            );
                            controller.close();
                        },
                    });
                    return new Response(stream, {
                        status: 200,
                        headers: { 'Content-Type': 'text/event-stream' },
                    });
                }

                return jsonResponse({ jsonrpc: '2.0', id: body.id, result: {} });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        const tools = await manager.listToolsForServer(
            'docs',
            'streamable-http',
            'http://localhost/mcp'
        );

        expect(tools).toEqual([{ name: 'streamed', description: 'Streamed' }]);
    });

    it('resumes Streamable HTTP SSE responses with Last-Event-ID after disconnects', async () => {
        const encoder = new TextEncoder();
        const requests = [];
        let listRequestId = null;

        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const method = init.method || 'GET';
                const body = init.body ? JSON.parse(init.body) : null;
                requests.push({ url, method, headers: init.headers || {}, body });

                if (body?.method === 'initialize') {
                    return jsonResponse(
                        {
                            jsonrpc: '2.0',
                            id: body.id,
                            result: { protocolVersion: '2025-11-25' },
                        },
                        { 'MCP-Session-Id': 'resume-session' }
                    );
                }

                if (method === 'POST' && body?.method === 'tools/list') {
                    listRequestId = body.id;
                    const stream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(
                                encoder.encode(
                                    `id: resume-1\nevent: message\ndata: ${JSON.stringify({
                                        jsonrpc: '2.0',
                                        method: 'notifications/tools/list_changed',
                                    })}\n\n`
                                )
                            );
                            controller.close();
                        },
                    });
                    return new Response(stream, {
                        status: 200,
                        headers: { 'Content-Type': 'text/event-stream' },
                    });
                }

                if (method === 'GET') {
                    const stream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(
                                encoder.encode(
                                    `event: message\ndata: ${JSON.stringify({
                                        jsonrpc: '2.0',
                                        id: listRequestId,
                                        result: {
                                            tools: [{ name: 'resumed', description: 'Resumed' }],
                                        },
                                    })}\n\n`
                                )
                            );
                            controller.close();
                        },
                    });
                    return new Response(stream, {
                        status: 200,
                        headers: { 'Content-Type': 'text/event-stream' },
                    });
                }

                return jsonResponse({ jsonrpc: '2.0', id: body?.id, result: {} });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        const tools = await manager.listToolsForServer(
            'docs',
            'streamable-http',
            'http://localhost/mcp'
        );

        expect(tools).toEqual([{ name: 'resumed', description: 'Resumed' }]);
        const resumeRequest = requests.find((request) => request.method === 'GET');
        expect(resumeRequest.headers).toMatchObject({
            Accept: 'text/event-stream',
            'Last-Event-ID': 'resume-1',
            'MCP-Session-Id': 'resume-session',
            'MCP-Protocol-Version': '2025-11-25',
        });
    });

    it('reinitializes Streamable HTTP sessions after a 404 session expiration', async () => {
        const requests = [];
        let initializeCount = 0;
        let expiredOnce = false;

        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');
                requests.push({ headers: init.headers, body });

                if (body.method === 'initialize') {
                    initializeCount++;
                    return jsonResponse(
                        {
                            jsonrpc: '2.0',
                            id: body.id,
                            result: { protocolVersion: '2025-11-25' },
                        },
                        { 'MCP-Session-Id': `session-${initializeCount}` }
                    );
                }

                if (body.method === 'tools/list' && !expiredOnce) {
                    expiredOnce = true;
                    return new Response('Expired session', { status: 404 });
                }

                return jsonResponse({
                    jsonrpc: '2.0',
                    id: body.id,
                    result: { tools: [{ name: 'fresh', description: 'Fresh session' }] },
                });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        const tools = await manager.listToolsForServer(
            'docs',
            'streamable-http',
            'http://localhost/mcp'
        );

        expect(initializeCount).toBe(2);
        expect(tools).toEqual([{ name: 'fresh', description: 'Fresh session' }]);
        expect(
            requests.filter((request) => request.body.method === 'tools/list')[1].headers
        ).toMatchObject({
            'MCP-Session-Id': 'session-2',
            'MCP-Protocol-Version': '2025-11-25',
        });
    });

    it('falls back from Streamable HTTP to legacy SSE on compatibility status codes', async () => {
        const encoder = new TextEncoder();
        const requests = [];
        let controller;

        const stream = new ReadableStream({
            start(nextController) {
                controller = nextController;
                controller.enqueue(encoder.encode('event: endpoint\ndata: /messages\n\n'));
            },
        });

        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const method = init?.method || 'GET';
                const body = init?.body ? JSON.parse(init.body) : null;
                requests.push({ url, method, body });

                if (url === 'http://localhost/sse' && method === 'POST') {
                    return new Response('Use legacy SSE', { status: 405 });
                }

                if (url === 'http://localhost/sse' && method === 'GET') {
                    return new Response(stream, {
                        status: 200,
                        headers: { 'Content-Type': 'text/event-stream' },
                    });
                }

                if (url === 'http://localhost/messages' && method === 'POST') {
                    queueMicrotask(() => {
                        const resultByMethod = {
                            initialize: { protocolVersion: '2025-11-25' },
                            'tools/list': {
                                tools: [{ name: 'legacy_search', description: 'Legacy search' }],
                            },
                            'tools/call': {
                                content: [{ type: 'text', text: 'legacy result' }],
                            },
                        };
                        controller.enqueue(
                            encoder.encode(
                                `event: message\ndata: ${JSON.stringify({
                                    jsonrpc: '2.0',
                                    id: body.id,
                                    result: resultByMethod[body.method] || {},
                                })}\n\n`
                            )
                        );
                    });
                    return new Response('', { status: 202 });
                }

                return new Response('Unexpected request', { status: 500 });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        const tools = await manager.listToolsForServer(
            'legacy',
            'streamable-http',
            'http://localhost/sse'
        );
        const result = await manager.callToolById('legacy__legacy_search', {}, [
            {
                id: 'legacy',
                transport: 'streamable-http',
                url: 'http://localhost/sse',
                headers: {},
            },
        ]);

        expect(tools).toEqual([{ name: 'legacy_search', description: 'Legacy search' }]);
        expect(result).toEqual({ text: 'legacy result', files: [] });
        expect(
            requests.filter(
                (request) => request.url === 'http://localhost/sse' && request.method === 'POST'
            )
        ).toHaveLength(1);

        await manager.disconnect('legacy');
    });

    it('lists official prompt and resource server features', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                const body = JSON.parse(init.body || '{}');

                if (body.method === 'initialize') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: {
                            protocolVersion: '2025-11-25',
                            capabilities: { prompts: {}, resources: {} },
                        },
                    });
                }
                if (body.method === 'prompts/list') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: { prompts: [{ name: 'summarize', description: 'Summarize' }] },
                    });
                }
                if (body.method === 'resources/list') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: { resources: [{ uri: 'file:///notes.md', name: 'Notes' }] },
                    });
                }
                if (body.method === 'resources/templates/list') {
                    return jsonResponse({
                        jsonrpc: '2.0',
                        id: body.id,
                        result: {
                            resourceTemplates: [
                                { uriTemplate: 'file:///{path}', name: 'File path' },
                            ],
                        },
                    });
                }

                return jsonResponse({ jsonrpc: '2.0', id: body.id, result: {} });
            })
        );

        const config = {
            enableMcpTools: true,
            mcpTransport: 'streamable-http',
            mcpServerUrl: 'http://localhost/mcp',
            mcpServerId: 'docs',
        };
        const manager = new McpRemoteManager({ clientVersion: 'test' });

        await expect(manager.listPrompts(config)).resolves.toEqual([
            { name: 'summarize', description: 'Summarize' },
        ]);
        await expect(manager.listResources(config)).resolves.toEqual([
            { uri: 'file:///notes.md', name: 'Notes' },
        ]);
        await expect(manager.listResourceTemplates(config)).resolves.toEqual([
            { uriTemplate: 'file:///{path}', name: 'File path' },
        ]);
    });

    it('performs SSE endpoint discovery and resolves RPC responses from the event stream', async () => {
        const encoder = new TextEncoder();
        let controller;

        const stream = new ReadableStream({
            start(nextController) {
                controller = nextController;
                controller.enqueue(encoder.encode('event: endpoint\ndata: /messages\n\n'));
            },
        });

        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                if (!init || init.method === 'GET') {
                    return new Response(stream, {
                        status: 200,
                        headers: { 'Content-Type': 'text/event-stream' },
                    });
                }

                const body = JSON.parse(init.body || '{}');
                queueMicrotask(() => {
                    const result =
                        body.method === 'tools/list'
                            ? { tools: [{ name: 'read_file', description: 'Read a file' }] }
                            : {};
                    controller.enqueue(
                        encoder.encode(
                            `event: message\ndata: ${JSON.stringify({
                                jsonrpc: '2.0',
                                id: body.id,
                                result,
                            })}\n\n`
                        )
                    );
                });
                return new Response('', { status: 202 });
            })
        );

        const manager = new McpRemoteManager({ clientVersion: 'test' });
        const tools = await manager.listToolsForServer('local', 'sse', 'http://localhost/sse');

        expect(tools).toEqual([{ name: 'read_file', description: 'Read a file' }]);
        expect(fetch).toHaveBeenCalledWith('http://localhost/messages', expect.any(Object));

        await manager.disconnect('local');
    });
});
