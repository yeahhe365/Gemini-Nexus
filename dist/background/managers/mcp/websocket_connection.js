import { asWsUrl, hasHeaders } from './transport.js';

export async function ensureWebSocketConnected({
    conn,
    serverId,
    url,
    normalizedHeaders,
    disconnectState,
    initializeHandshake,
    bumpIdleClose,
    clearPending,
    onRpcMessage,
}) {
    if (hasHeaders(normalizedHeaders)) {
        throw new Error(
            'Custom MCP headers are not supported for WebSocket transport in browser extensions. Use SSE or Streamable HTTP.'
        );
    }

    const wsUrl = asWsUrl(url);
    if (!wsUrl) throw new Error('Invalid MCP server URL');
    const key = `ws:${wsUrl}`;

    if (
        conn.ws &&
        conn.ws.readyState === WebSocket.OPEN &&
        conn.initialized &&
        conn.configKey === key
    ) {
        bumpIdleClose(conn, serverId);
        return conn;
    }

    disconnectState(conn);
    conn.configKey = key;
    conn.transport = 'ws';
    conn.headers = {};

    await new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        conn.ws = ws;
        let opened = false;

        const onOpen = () => {
            opened = true;
            resolve();
        };
        const onError = () => {
            if (!opened) reject(new Error(`Failed to connect to MCP WebSocket: ${wsUrl}`));
        };
        const onClose = () => {
            const error = new Error(`MCP WebSocket closed: ${wsUrl}`);
            clearPending(conn, error);
            conn.ws = null;
            conn.initialized = false;
            conn.configKey = null;
            conn.transport = null;
            if (!opened) reject(error);
        };
        const onMessage = (event) => {
            try {
                onRpcMessage(conn, JSON.parse(event.data));
            } catch {}
        };

        ws.addEventListener('open', onOpen);
        ws.addEventListener('error', onError);
        ws.addEventListener('close', onClose);
        ws.addEventListener('message', onMessage);
    });

    await initializeHandshake(conn);
    bumpIdleClose(conn, serverId);
    return conn;
}
