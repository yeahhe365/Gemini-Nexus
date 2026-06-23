import { respondWithUiTask } from './ui_async.js';

async function loadMcpTools(mcpManager, request, fallbackServerId) {
    if (!mcpManager) throw new Error('MCP manager not available');

    const url = (request.url || '').trim();
    const transport = (request.transport || 'sse').toLowerCase();
    if (!url) throw new Error('Server URL is empty');

    const tools = await mcpManager.listTools({
        enableMcpTools: true,
        mcpTransport: transport,
        mcpServerUrl: url,
        mcpServerId: request.serverId || fallbackServerId,
        mcpHeaders: request.headers,
    });

    return { tools, transport, url };
}

export function handleMcpTestConnection(mcpManager, request, sendResponse) {
    respondWithUiTask(
        sendResponse,
        async () => {
            const { tools, transport, url } = await loadMcpTools(mcpManager, request, '_test_');

            return {
                action: 'MCP_TEST_RESULT',
                ok: true,
                serverId: request.serverId || null,
                transport,
                url,
                toolsCount: Array.isArray(tools) ? tools.length : 0,
            };
        },
        {
            errorResponse: (error) => ({
                action: 'MCP_TEST_RESULT',
                ok: false,
                serverId: request.serverId || null,
                transport: request.transport || 'sse',
                url: request.url || '',
                error: error.message || String(error),
            }),
        }
    );
}

export function handleMcpListTools(mcpManager, request, sendResponse) {
    respondWithUiTask(
        sendResponse,
        async () => {
            const { tools, transport, url } = await loadMcpTools(mcpManager, request, '_tools_');

            return {
                action: 'MCP_TOOLS_RESULT',
                ok: true,
                serverId: request.serverId || null,
                requestKey: request.requestKey || null,
                transport,
                url,
                tools: toSafeMcpTools(tools),
            };
        },
        {
            errorResponse: (error) => ({
                action: 'MCP_TOOLS_RESULT',
                ok: false,
                serverId: request.serverId || null,
                requestKey: request.requestKey || null,
                transport: request.transport || 'sse',
                url: request.url || '',
                error: error.message || String(error),
                tools: [],
            }),
        }
    );
}

function toSafeMcpTools(tools) {
    return Array.isArray(tools)
        ? tools.map((tool) => ({
              name: tool.name,
              description: tool.description || '',
          }))
        : [];
}
