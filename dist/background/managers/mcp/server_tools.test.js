import { describe, expect, it } from 'vitest';
import { getActiveMcpServers, parseToolId, tagToolsForServer } from './server_tools.js';

describe('MCP server tool helpers', () => {
    it('filters active servers that are enabled and have URLs', () => {
        expect(
            getActiveMcpServers([
                { id: 'a', enabled: true, url: 'http://localhost/mcp' },
                { id: 'b', enabled: false, url: 'http://localhost/mcp' },
                { id: 'c', enabled: true, url: ' ' },
                null,
            ])
        ).toEqual([{ id: 'a', enabled: true, url: 'http://localhost/mcp' }]);
    });

    it('tags tools with server routing metadata', () => {
        expect(
            tagToolsForServer({ id: 'srv', name: 'Local', url: 'http://localhost/mcp' }, [
                { name: 'search' },
            ])
        ).toEqual([
            {
                name: 'search',
                _serverId: 'srv',
                _serverName: 'Local',
                _toolId: 'srv__search',
            },
        ]);
    });

    it('parses routed tool ids', () => {
        expect(parseToolId('srv__search')).toEqual({ serverId: 'srv', toolName: 'search' });
        expect(() => parseToolId('search')).toThrow('Invalid tool ID format: search');
    });
});
