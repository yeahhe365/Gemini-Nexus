// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installCopyFeedback() {
    await import('./copy_feedback.js');
}

describe('GeminiCopyFeedback', () => {
    beforeEach(async () => {
        vi.resetModules();
        delete globalThis.GeminiCopyFeedback;
        delete globalThis.GeminiToolbarIcons;
        await installCopyFeedback();
    });

    it('temporarily replaces button HTML and restores the original content', () => {
        vi.useFakeTimers();
        const button = document.createElement('button');
        button.innerHTML = '<svg data-icon="copy"></svg>';

        globalThis.GeminiCopyFeedback.showCopied(button, 'Copied');

        expect(button.innerHTML).toContain('Copied');
        expect(button.innerHTML).toContain('polyline');

        vi.advanceTimersByTime(2000);

        expect(button.innerHTML).toBe('<svg data-icon="copy"></svg>');
        vi.useRealTimers();
    });

    it('renders the copied label as text instead of HTML', () => {
        vi.useFakeTimers();
        const button = document.createElement('button');
        button.innerHTML = '<svg data-icon="copy"></svg>';

        globalThis.GeminiCopyFeedback.showCopied(button, '<img src=x onerror="alert(1)">Copied');

        expect(button.querySelector('img')).toBeNull();
        expect(button.textContent).toContain('<img src=x onerror="alert(1)">Copied');

        vi.useRealTimers();
    });

    it('reuses the toolbar check icon when it is available', async () => {
        vi.resetModules();
        delete globalThis.GeminiCopyFeedback;
        globalThis.GeminiToolbarIcons = {
            CHECK: '<svg data-icon="toolbar-check"></svg>',
        };
        await installCopyFeedback();

        vi.useFakeTimers();
        const button = document.createElement('button');
        button.innerHTML = '<svg data-icon="copy"></svg>';

        globalThis.GeminiCopyFeedback.showCopied(button, 'Copied');

        expect(button.querySelector('[data-icon="toolbar-check"]')).not.toBeNull();
        expect(button.innerHTML).not.toContain('polyline');

        vi.useRealTimers();
    });
});
