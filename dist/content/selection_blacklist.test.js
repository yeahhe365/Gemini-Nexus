// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installSelectionBlacklist() {
    vi.resetModules();
    delete window.GeminiSelectionBlacklist;
    await import('./selection_blacklist.js');
    return window.GeminiSelectionBlacklist;
}

describe('GeminiSelectionBlacklist', () => {
    beforeEach(() => {
        delete window.GeminiSelectionBlacklist;
    });

    it('matches exact host rules without matching unrelated subdomains', async () => {
        const blacklist = await installSelectionBlacklist();

        expect(
            blacklist.matchesLocation(
                { href: 'https://github.com/yeahhe365/Gemini-Nexus' },
                'github.com'
            )
        ).toBe(true);
        expect(
            blacklist.matchesLocation({ href: 'https://gist.github.com/yeahhe365' }, 'github.com')
        ).toBe(false);
    });

    it('matches wildcard host rules', async () => {
        const blacklist = await installSelectionBlacklist();

        expect(
            blacklist.matchesLocation({ href: 'https://mail.google.com/mail/u/0/' }, '*.google.com')
        ).toBe(true);
    });

    it('matches optional path prefixes', async () => {
        const blacklist = await installSelectionBlacklist();
        const rules = ['example.com/docs', 'github.com'];

        expect(blacklist.matchesLocation({ href: 'https://example.com/docs/page' }, rules)).toBe(
            true
        );
        expect(blacklist.matchesLocation({ href: 'https://example.com/blog' }, rules)).toBe(false);
    });
});
