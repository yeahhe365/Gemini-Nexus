import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupConsoleInterception } from './log_manager.js';

describe('console log redaction', () => {
    let originalConsole;

    beforeEach(() => {
        originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
        };
    });

    afterEach(() => {
        Object.assign(console, originalConsole);
    });

    it('redacts secrets before persisted console messages are stored', () => {
        const logManager = { add: vi.fn() };
        console.warn = vi.fn();
        setupConsoleInterception(logManager);

        console.warn('request failed', {
            Authorization: 'Bearer secret-token',
            apiKey: 'sk-secret',
            url: 'https://api.example.test/v1/models?key=query-secret&access_token=query-token',
            nested: {
                cookie: 'session=private-cookie',
                refreshToken: 'refresh-secret',
            },
        });

        const entry = logManager.add.mock.calls[0][0];

        expect(entry.message).toContain('[REDACTED]');
        expect(entry.message).not.toContain('secret-token');
        expect(entry.message).not.toContain('sk-secret');
        expect(entry.message).not.toContain('query-secret');
        expect(entry.message).not.toContain('query-token');
        expect(entry.message).not.toContain('private-cookie');
        expect(entry.message).not.toContain('refresh-secret');
    });
});
