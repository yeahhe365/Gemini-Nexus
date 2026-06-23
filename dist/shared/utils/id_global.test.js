import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('classic shared ID helpers', () => {
    beforeEach(async () => {
        vi.resetModules();
        delete globalThis.GeminiNexusIds;
        await import('./id_global.js');
    });

    it('exposes a classic-script-safe prefixed ID factory', () => {
        const id = globalThis.GeminiNexusIds.createPrefixedId('req');

        expect(id).toMatch(/^req_[A-Z0-9-]+$/);
    });

    it('normalizes unsafe prefixes before creating IDs', () => {
        const id = globalThis.GeminiNexusIds.createPrefixedId(' custom tool ');

        expect(id).toMatch(/^custom_tool_[A-Z0-9-]+$/);
    });
});
