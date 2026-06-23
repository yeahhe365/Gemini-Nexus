import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installWidgetStyles() {
    await import('./widget.js');
}

describe('GeminiStyles.Widget', () => {
    beforeEach(async () => {
        vi.resetModules();
        globalThis.window = {};
        await installWidgetStyles();
    });

    it('renders the image tool trigger as a compact square', () => {
        const css = window.GeminiStyles.Widget;

        expect(css).toContain('width: 20px');
        expect(css).toContain('height: 20px');
        expect(css).toContain('border-radius: 5px');
        expect(css).not.toContain('border-radius: 999px');
        expect(css).not.toContain('.ai-tool-trigger-badge');
        expect(css).not.toContain('.ai-tool-trigger-main');
    });

    it('keeps toolbar logo sizing in CSS', () => {
        const css = window.GeminiStyles.Widget;

        expect(css).toContain('.toolbar-logo');
        expect(css).toContain('width: 20px');
        expect(css).toContain('height: 20px');
        expect(css).toContain('display: block');
    });
});
