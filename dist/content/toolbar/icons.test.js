// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installToolbarIcons() {
    await import('./icons.js');
}

describe('GeminiToolbarIcons', () => {
    beforeEach(async () => {
        vi.resetModules();
        globalThis.chrome = {
            runtime: {
                getURL: vi.fn((path) => `chrome-extension://id/${path}`),
            },
        };
        await installToolbarIcons();
    });

    it('keeps the logo icon presentation in CSS instead of inline styles', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarIcons.LOGO;
        const logo = wrapper.querySelector('img');

        expect(logo).not.toBeNull();
        expect(logo.getAttribute('src')).toBe('chrome-extension://id/logo.png');
        expect(logo.classList.contains('toolbar-logo')).toBe(true);
        expect(logo.hasAttribute('style')).toBe(false);
    });

    it('uses a tool-shaped icon for toolbar tool menus', () => {
        expect(window.GeminiToolbarIcons.TOOLS).toContain('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6');
        expect(window.GeminiToolbarIcons.TOOLS).not.toContain('M14.5 2H6a2 2 0 0 0-2 2v16');
        expect(window.GeminiToolbarIcons.TOOLS).not.toContain('14 2 14 8 20 8');
    });

    it('uses text lines instead of a person icon for removing image text', () => {
        expect(window.GeminiToolbarIcons.REMOVE_TEXT).toContain('M4 6h10');
        expect(window.GeminiToolbarIcons.REMOVE_TEXT).toContain('M4 10h12');
        expect(window.GeminiToolbarIcons.REMOVE_TEXT).toContain('m15 15 5 5');
        expect(window.GeminiToolbarIcons.REMOVE_TEXT).not.toContain('M20 21v-2a4 4 0 0 0-4-4H8');
        expect(window.GeminiToolbarIcons.REMOVE_TEXT).not.toContain('<circle cx="12" cy="7" r="4"');
    });

    it('matches the sidebar lightning icon shape for Web thinking', () => {
        expect(window.GeminiToolbarIcons.ZAP).toContain('13 2 3 14 12 14 11 22 21 10 12 10 13 2');
    });
});
