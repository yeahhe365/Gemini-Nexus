import { beforeAll, describe, expect, it } from 'vitest';

describe('toolbar web model helper', () => {
    beforeAll(async () => {
        globalThis.window = {};
        await import('../../shared/models/web_model_catalog.js');
        window.GeminiNexusWebModelCatalog = globalThis.GeminiNexusWebModelCatalog;
        await import('./model_options.js');
    });

    it('keeps image editing actions on the selected Web model', () => {
        expect(
            window.GeminiWebModels.resolveImagePromptModel({
                provider: 'web',
                mode: 'remove_bg',
                model: 'e6fa609c3fa255c0',
            })
        ).toBe('e6fa609c3fa255c0');
    });

    it('lists only current Web chat models', () => {
        expect(window.GeminiWebModels.createOptions()).toEqual([
            { value: '56fdd199312815e2', label: '3.7 Flash' },
            { value: 'fbb127bbb056c959', label: '3.6 Flash' },
            { value: 'cf41b0e0dd7d53e5', label: '3.5 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
        ]);
        expect(window.GeminiWebModels.createOptionMarkup()).not.toContain(
            'gemini-3-pro-image-preview-11-2025'
        );
        expect(window.GeminiWebModels.createOptionMarkup()).not.toContain(
            'gemini-3.1-flash-image-preview'
        );
        expect(window.GeminiWebModels.createOptionMarkup()).not.toContain('8c46e95b1a07cecc');
    });

    it('keeps non-generation image analysis on the selected model', () => {
        expect(
            window.GeminiWebModels.resolveImagePromptModel({
                provider: 'web',
                mode: 'ocr',
                model: 'e6fa609c3fa255c0',
            })
        ).toBe('e6fa609c3fa255c0');
    });
});
