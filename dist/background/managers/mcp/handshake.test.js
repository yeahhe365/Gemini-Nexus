import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeMcpHandshake } from './handshake.js';

describe('MCP handshake helpers', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initializes connection state and emits the initialized notification', async () => {
        const sentNotifications = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url, init = {}) => {
                sentNotifications.push({ url, body: JSON.parse(init.body || '{}') });
                return new Response('', { status: 202 });
            })
        );

        const conn = {
            transport: 'sse',
            ssePostUrl: 'http://localhost/messages',
            headers: {},
        };
        const sendRpc = vi.fn(async () => ({
            protocolVersion: '2025-03-26',
            capabilities: { tools: {} },
            serverInfo: { name: 'docs-server' },
            instructions: 'Prefer concise answers.',
        }));

        await initializeMcpHandshake(conn, {
            clientName: 'test-client',
            clientVersion: '1.2.3',
            sendRpc,
            sleep: async () => {},
        });

        expect(sendRpc).toHaveBeenCalledWith('initialize', {
            protocolVersion: '2025-11-25',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.2.3' },
        });
        expect(conn).toMatchObject({
            protocolVersion: '2025-03-26',
            serverCapabilities: { tools: {} },
            serverInfo: { name: 'docs-server' },
            instructions: 'Prefer concise answers.',
            initialized: true,
        });
        expect(sentNotifications).toEqual([
            {
                url: 'http://localhost/messages',
                body: {
                    jsonrpc: '2.0',
                    method: 'notifications/initialized',
                    params: {},
                },
            },
        ]);
    });

    it('retries older protocol versions before failing the handshake', async () => {
        const failures = [
            new Error('Server does not support 2025-11-25'),
            new Error('Server does not support 2025-06-18'),
        ];
        const sendRpc = vi.fn(async () => {
            if (failures.length) throw failures.shift();
            return { protocolVersion: '2025-03-26' };
        });
        const sleep = vi.fn(async () => {});
        const conn = { transport: 'streamable-http' };

        await initializeMcpHandshake(conn, {
            clientName: 'test-client',
            clientVersion: '1.2.3',
            sendRpc,
            sleep,
        });

        expect(sendRpc.mock.calls.map(([, params]) => params.protocolVersion)).toEqual([
            '2025-11-25',
            '2025-06-18',
            '2025-03-26',
        ]);
        expect(sleep).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledWith(150);
        expect(conn.initialized).toBe(true);
    });

    it('rejects protocol versions not supported by the client', async () => {
        const conn = { transport: 'streamable-http' };
        const sendRpc = vi.fn(async () => ({ protocolVersion: '2099-01-01' }));

        await expect(
            initializeMcpHandshake(conn, {
                clientName: 'test-client',
                clientVersion: '1.2.3',
                sendRpc,
                sleep: async () => {},
            })
        ).rejects.toThrow('Unsupported MCP protocol version: 2099-01-01');
        expect(conn.initialized).not.toBe(true);
    });
});
