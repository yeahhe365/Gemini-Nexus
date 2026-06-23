// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installPageGuard(url) {
    vi.resetModules();
    window.history.replaceState({}, '', url);
    delete window.GeminiNexusPageGuard;

    await import('./page_guard.js');

    return window.GeminiNexusPageGuard;
}

describe('Gemini Nexus page guard', () => {
    beforeEach(() => {
        delete window.GeminiNexusPageGuard;
    });

    it('disables content scripts on MHTML archive URLs', async () => {
        const guard = await installPageGuard('/Users/jones/Downloads/saved-page.mhtml');

        expect(guard.isDisabled).toBe(true);
        expect(guard.reason).toBe('mhtml');
    });

    it('recognizes local uppercase MHT archive URLs', async () => {
        const guard = await installPageGuard('/article');

        expect(guard.isMhtmlArchiveUrl('file:///Users/jones/Downloads/SAVED-PAGE.MHT')).toBe(true);
    });

    it('allows ordinary web pages', async () => {
        const guard = await installPageGuard('/article');

        expect(guard.isDisabled).toBe(false);
        expect(guard.reason).toBeNull();
    });
});
