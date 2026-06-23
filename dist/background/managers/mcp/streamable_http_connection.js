import { asHttpUrl } from './transport.js';
import { isStreamableHttpFallbackError } from './streamable_http.js';
import { connectSse } from './sse_connection.js';

export async function ensureStreamableHttpConnected({
    conn,
    serverId,
    url,
    normalizedHeaders,
    headerKey,
    disconnectState,
    initializeHandshake,
    bumpIdleClose,
    onRpcMessage,
    clearPending,
}) {
    const httpUrl = asHttpUrl(url);
    if (!httpUrl) throw new Error('Invalid Streamable HTTP URL');
    const key = `streamable-http:${httpUrl}:${headerKey}`;

    if (
        conn.initialized &&
        conn.configKey === key &&
        ((conn.transport === 'streamable-http' && conn.httpPostUrl) ||
            (conn.transport === 'sse' && conn.ssePostUrl))
    ) {
        bumpIdleClose(conn, serverId);
        return conn;
    }

    disconnectState(conn);
    conn.configKey = key;
    conn.transport = 'streamable-http';
    conn.httpPostUrl = httpUrl;
    conn.headers = normalizedHeaders;
    conn.sessionId = null;
    conn.protocolVersion = null;

    try {
        await initializeHandshake(conn);
    } catch (error) {
        if (!isStreamableHttpFallbackError(error)) throw error;

        disconnectState(conn);
        conn.configKey = key;
        conn.transport = 'sse';
        conn.headers = normalizedHeaders;
        await connectSse(conn, httpUrl, { onRpcMessage, clearPending });
        await initializeHandshake(conn);
    }

    bumpIdleClose(conn, serverId);
    return conn;
}
