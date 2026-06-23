// @ts-check

/**
 * @param {unknown} servers
 * @returns {Array<Record<string, any>>}
 */
export function getActiveMcpServers(servers) {
    if (!Array.isArray(servers) || servers.length === 0) return [];
    return servers.filter(
        (server) => server && server.enabled !== false && server.url && server.url.trim()
    );
}

/**
 * @param {Record<string, any>} server
 * @param {unknown} tools
 * @returns {Array<Record<string, any>>}
 */
export function tagToolsForServer(server, tools) {
    if (!server || !Array.isArray(tools)) return [];
    return tools.map((tool) => ({
        ...tool,
        _serverId: server.id,
        _serverName: server.name || server.url,
        _toolId: `${server.id}__${tool.name}`,
    }));
}

/**
 * @param {unknown} toolId
 * @returns {{ serverId: string, toolName: string }}
 */
export function parseToolId(toolId) {
    const sep = typeof toolId === 'string' ? toolId.indexOf('__') : -1;
    if (sep === -1) {
        throw new Error(`Invalid tool ID format: ${toolId}`);
    }
    const normalizedToolId = String(toolId);
    return {
        serverId: normalizedToolId.slice(0, sep),
        toolName: normalizedToolId.slice(sep + 2),
    };
}
