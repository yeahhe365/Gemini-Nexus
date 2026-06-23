// @ts-check

/**
 * @param {unknown} url
 * @returns {string}
 */
export function asWsUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed;
    if (trimmed.startsWith('http://')) return `ws://${trimmed.slice('http://'.length)}`;
    if (trimmed.startsWith('https://')) return `wss://${trimmed.slice('https://'.length)}`;
    return trimmed;
}

/**
 * @param {unknown} url
 * @returns {string}
 */
export function asHttpUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return trimmed;
}

/**
 * @param {unknown} transport
 * @param {unknown} url
 * @returns {string}
 */
export function inferMcpTransport(transport, url) {
    const normalized = String(transport || 'sse').toLowerCase();
    if (normalized === 'streamablehttp') return 'streamable-http';
    if (normalized === 'websocket') return 'ws';

    if (normalized === 'sse' && typeof url === 'string') {
        try {
            const parsed = new URL(url.trim());
            const pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
            if (parsed.protocol.startsWith('http') && !pathname.endsWith('/sse')) {
                return 'streamable-http';
            }
        } catch {}
    }

    return normalized;
}

/**
 * @param {unknown} headers
 * @returns {Record<string, string>}
 */
export function normalizeMcpHeaders(headers) {
    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return {};

    /** @type {Record<string, string>} */
    const result = {};
    for (const [name, value] of Object.entries(headers)) {
        const key = String(name || '').trim();
        if (!key || value === undefined || value === null) continue;

        const text = String(value).trim();
        if (!text) continue;
        result[key] = text;
    }
    return result;
}

/**
 * @param {unknown} headers
 * @returns {boolean}
 */
export function hasMcpHeaders(headers) {
    return Object.keys(normalizeMcpHeaders(headers)).length > 0;
}

/**
 * @param {unknown} headers
 * @returns {string}
 */
export function stableMcpHeadersKey(headers) {
    const normalized = normalizeMcpHeaders(headers);
    return Object.keys(normalized)
        .sort((leftHeaderName, rightHeaderName) => leftHeaderName.localeCompare(rightHeaderName))
        .map((key) => `${key}:${normalized[key]}`)
        .join('\n');
}

/**
 * @param {Record<string, string>} baseHeaders
 * @param {unknown} customHeaders
 * @returns {Record<string, string>}
 */
export function mergeMcpHeaders(baseHeaders, customHeaders) {
    return {
        ...(baseHeaders || {}),
        ...normalizeMcpHeaders(customHeaders),
    };
}

/**
 * @param {{ headers?: unknown, sessionId?: string | null, protocolVersion?: string | null }} conn
 * @param {Record<string, string>} baseHeaders
 * @returns {Record<string, string>}
 */
export function mergeHttpTransportHeaders(conn, baseHeaders) {
    const headers = mergeMcpHeaders(baseHeaders, conn.headers);
    if (conn.sessionId) headers['MCP-Session-Id'] = conn.sessionId;
    if (conn.protocolVersion) headers['MCP-Protocol-Version'] = conn.protocolVersion;
    return headers;
}
