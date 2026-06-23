import { clearListCache } from './tool_listing.js';
import { terminateStreamableHttpSession } from './rpc_messages.js';

const MCP_IDLE_CLOSE_MS = 120000;

export function createMcpConnectionState() {
    return {
        transport: null,
        ws: null,
        configKey: null,
        pending: new Map(),
        initialized: false,
        listCaches: new Map(),
        idleCloseTimer: null,
        sseAbort: null,
        ssePostUrl: null,
        sseReaderTask: null,
        httpPostUrl: null,
        headers: {},
        sessionId: null,
        protocolVersion: null,
        serverCapabilities: {},
        serverInfo: null,
        instructions: '',
        _resolveSseEndpoint: null,
    };
}

function clearMcpIdleTimer(conn) {
    if (conn.idleCloseTimer) {
        clearTimeout(conn.idleCloseTimer);
        conn.idleCloseTimer = null;
    }
}

export function bumpMcpIdleClose(conn, onIdle) {
    clearMcpIdleTimer(conn);
    conn.idleCloseTimer = setTimeout(onIdle, MCP_IDLE_CLOSE_MS);
}

export function rejectPendingMcpRequests(conn, error) {
    for (const [id, entry] of conn.pending.entries()) {
        clearTimeout(entry.timeout);
        entry.reject(error);
        conn.pending.delete(id);
    }
}

export function disconnectMcpConnectionState(conn) {
    clearMcpIdleTimer(conn);
    rejectPendingMcpRequests(conn, new Error('MCP connection closed'));
    clearListCache(conn);
    terminateStreamableHttpSession(conn);
    conn.initialized = false;
    conn.configKey = null;
    conn.transport = null;

    if (conn.ws) {
        try {
            conn.ws.close();
        } catch {}
    }
    conn.ws = null;

    if (conn.sseAbort) {
        try {
            conn.sseAbort.abort();
        } catch {}
    }
    conn.sseAbort = null;
    conn.ssePostUrl = null;
    conn.sseReaderTask = null;
    conn.httpPostUrl = null;
    conn.headers = {};
    conn.sessionId = null;
    conn.protocolVersion = null;
    conn.serverCapabilities = {};
    conn.serverInfo = null;
    conn.instructions = '';
}
