import { sendNotification } from './rpc_messages.js';
import { isStreamableHttpFallbackError } from './streamable_http.js';

export const DEFAULT_PROTOCOL_VERSIONS = [
    '2025-11-25',
    '2025-06-18',
    '2025-03-26',
    '2024-11-05',
    '2024-10-07',
    '2024-06-20',
];

function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUnsupportedProtocolError(error) {
    return (
        error &&
        typeof error.message === 'string' &&
        error.message.startsWith('Unsupported MCP protocol version:')
    );
}

export async function initializeMcpHandshake(
    conn,
    { clientName, clientVersion, sendRpc, sleep = defaultSleep }
) {
    let lastError = null;
    for (const protocolVersion of DEFAULT_PROTOCOL_VERSIONS) {
        try {
            const result = await sendRpc('initialize', {
                protocolVersion,
                capabilities: {},
                clientInfo: { name: clientName, version: clientVersion },
            });

            const selectedProtocolVersion =
                result && typeof result.protocolVersion === 'string'
                    ? result.protocolVersion
                    : protocolVersion;
            if (!DEFAULT_PROTOCOL_VERSIONS.includes(selectedProtocolVersion)) {
                throw new Error(`Unsupported MCP protocol version: ${selectedProtocolVersion}`);
            }

            conn.protocolVersion = selectedProtocolVersion;
            conn.serverCapabilities =
                result && result.capabilities && typeof result.capabilities === 'object'
                    ? result.capabilities
                    : {};
            conn.serverInfo =
                result && result.serverInfo && typeof result.serverInfo === 'object'
                    ? result.serverInfo
                    : null;
            conn.instructions =
                result && typeof result.instructions === 'string' ? result.instructions : '';
            sendNotification(conn, 'notifications/initialized', {});
            conn.initialized = true;
            return;
        } catch (error) {
            lastError = error;
            if (isStreamableHttpFallbackError(error)) throw error;
            if (isUnsupportedProtocolError(error)) throw error;
            await sleep(150);
        }
    }
    throw lastError || new Error('Failed to initialize MCP connection');
}
