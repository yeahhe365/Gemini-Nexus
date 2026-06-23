const TOOL_LIST_CACHE_MS = 5 * 60 * 1000;
const MAX_TOOL_LIST_PAGES = 100;

async function listPaginatedItemsForConnection(
    conn,
    sendRpc,
    { cacheKey, method, resultKey, label },
    now = Date.now()
) {
    if (!conn.listCaches) conn.listCaches = new Map();

    const cached = conn.listCaches.get(cacheKey);
    if (cached && now - cached.cachedAt < TOOL_LIST_CACHE_MS) {
        return cached.items;
    }

    const items = [];
    let cursor = null;
    let pageCount = 0;

    do {
        const params = cursor ? { cursor } : {};
        const result = await sendRpc(method, params);
        if (result && Array.isArray(result[resultKey])) items.push(...result[resultKey]);

        cursor =
            result && typeof result.nextCursor === 'string' && result.nextCursor
                ? result.nextCursor
                : null;
        pageCount++;

        if (pageCount > MAX_TOOL_LIST_PAGES) {
            throw new Error(`MCP ${label} pagination exceeded 100 pages`);
        }
    } while (cursor);

    conn.listCaches.set(cacheKey, { items, cachedAt: now });
    return items;
}

export function clearListCache(conn, cacheKey) {
    if (!conn.listCaches) return;
    if (cacheKey) conn.listCaches.delete(cacheKey);
    else conn.listCaches.clear();
}

export async function listToolsForConnection(conn, sendRpc, now = Date.now()) {
    return listPaginatedItemsForConnection(
        conn,
        sendRpc,
        {
            cacheKey: 'tools',
            method: 'tools/list',
            resultKey: 'tools',
            label: 'tools/list',
        },
        now
    );
}

export async function listPromptsForConnection(conn, sendRpc, now = Date.now()) {
    return listPaginatedItemsForConnection(
        conn,
        sendRpc,
        {
            cacheKey: 'prompts',
            method: 'prompts/list',
            resultKey: 'prompts',
            label: 'prompts/list',
        },
        now
    );
}

export async function listResourcesForConnection(conn, sendRpc, now = Date.now()) {
    return listPaginatedItemsForConnection(
        conn,
        sendRpc,
        {
            cacheKey: 'resources',
            method: 'resources/list',
            resultKey: 'resources',
            label: 'resources/list',
        },
        now
    );
}

export async function listResourceTemplatesForConnection(conn, sendRpc, now = Date.now()) {
    return listPaginatedItemsForConnection(
        conn,
        sendRpc,
        {
            cacheKey: 'resourceTemplates',
            method: 'resources/templates/list',
            resultKey: 'resourceTemplates',
            label: 'resources/templates/list',
        },
        now
    );
}
