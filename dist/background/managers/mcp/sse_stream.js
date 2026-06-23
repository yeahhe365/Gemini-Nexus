export async function readSseStream(
    conn,
    reader,
    baseUrl,
    { resolvePendingRpcMessage, clearPending }
) {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let eventType = 'message';
    let dataLines = [];

    const dispatch = () => {
        const eventData = dataLines.join('\n');
        const type = eventType || 'message';
        eventType = 'message';
        dataLines = [];

        const payload = eventData.trim();
        if (!payload) return;

        if (type === 'endpoint') {
            let endpoint = payload;
            try {
                const parsed = JSON.parse(payload);
                if (parsed && typeof parsed === 'object' && typeof parsed.endpoint === 'string') {
                    endpoint = parsed.endpoint;
                }
            } catch {}

            try {
                const url = new URL(endpoint, baseUrl).toString();
                if (!conn.ssePostUrl) {
                    conn.ssePostUrl = url;
                    if (conn._resolveSseEndpoint) conn._resolveSseEndpoint(url);
                }
            } catch {}
            return;
        }

        if (type === 'message' || type === 'mcp' || type === 'data') {
            try {
                const rpcMessage = JSON.parse(payload);
                resolvePendingRpcMessage(rpcMessage);
            } catch {}
        }
    };

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let lineBreakIndex;
            while ((lineBreakIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, lineBreakIndex);
                buffer = buffer.slice(lineBreakIndex + 1);
                const trimmed = line.replace(/\r$/, '');

                if (trimmed === '') {
                    dispatch();
                    continue;
                }
                if (trimmed.startsWith(':')) continue;
                if (trimmed.startsWith('event:')) {
                    eventType = trimmed.slice('event:'.length).trim() || 'message';
                    continue;
                }
                if (trimmed.startsWith('data:')) {
                    dataLines.push(trimmed.slice('data:'.length).trimStart());
                }
            }
        }
    } finally {
        try {
            reader.releaseLock();
        } catch {}
        clearPending(new Error('MCP SSE stream closed'));
        conn.initialized = false;
        conn.transport = null;
        conn.configKey = null;
        conn.sseAbort = null;
        conn.ssePostUrl = null;
    }
}
