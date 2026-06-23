// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';

describe('content toolbar panel spacing', () => {
    beforeEach(() => {
        window.GeminiStyles = {};
    });

    it('keeps the title-to-input vertical gap compact', async () => {
        await import('./header.js?compact-spacing-test');
        await import('./body.js?compact-spacing-test');

        expect(window.GeminiStyles.PanelHeader).toContain('padding: 8px 16px 4px 16px;');
        expect(window.GeminiStyles.PanelBody).toContain('padding: 4px 16px 16px 16px;');
    });

    it('lets the full-screen image preview receive pointer events inside the toolbar host', async () => {
        await import('./body.js?image-preview-pointer-events-test');

        const css = window.GeminiStyles.PanelBody;
        expect(css).toContain('.gemini-image-preview {');
        expect(css).toContain('pointer-events: none;');
        expect(css).toContain('.gemini-image-preview.visible {');
        expect(css).toContain('pointer-events: auto;');
        expect(css).toContain('.gemini-image-preview-close {');
        expect(css).toContain('pointer-events: auto;');
    });
});
