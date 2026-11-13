import { beforeAll, describe, expect, it } from 'vitest';

describe('toolbar web model helper', () => {
    beforeAll(async () => {
        globalThis.window = {};
        await import('../../shared/models/web_model_catalog.js');
        window.GeminiNexusWebModelCatalog = globalThis.GeminiNexusWebModelCatalog;
        await import('./model_options.js');
    });

    it('keeps image editing actions on the selected Web model', () => {
        expect(window.GeminiWebModels.resolveImagePromptModel('argon')).toBe('argon');
        expect(window.GeminiWebModels.resolveImagePromptModel('e6fa609c3fa255c0')).toBe(
            'e6fa609c3fa255c0'
        );
    });

    it('lists only current Web chat models', () => {
        expect(window.GeminiWebModels.createOptions()).toEqual([
            { value: '56fdd199312815e2', label: '4 Hydrogen' },
            { value: '8c46e95b1a07cecc', label: '3.5 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
            { value: 'argon', label: '4 Argon' },
        ]);
        expect(window.GeminiWebModels.createOptionMarkup()).not.toContain(
            'gemini-3-pro-image-preview-11-2025'
        );
        expect(window.GeminiWebModels.createOptionMarkup()).not.toContain(
            'gemini-3.1-flash-image-preview'
        );
        expect(window.GeminiWebModels.createOptionMarkup()).not.toContain('cf41b0e0dd7d53e5');
        expect(window.GeminiWebModels.createOptionMarkup()).not.toContain('95a4c0abcba24364');
    });

    it('keeps non-generation image analysis on the selected model', () => {
        expect(window.GeminiWebModels.resolveImagePromptModel('argon')).toBe('argon');
    });

    it('resolves retired Web hashes to the current catalog value', () => {
        expect(window.GeminiWebModels.normalizeModel('95a4c0abcba24364')).toBe('argon');
        expect(window.GeminiWebModels.normalizeModel('cf41b0e0dd7d53e5')).toBe('8c46e95b1a07cecc');
        expect(window.GeminiWebModels.normalizeModel('gemini-3.8-flash')).toBe('56fdd199312815e2');
        expect(window.GeminiWebModels.normalizeModel('')).toBe('56fdd199312815e2');
    });

    it('falls back to the default Web model when none is selected', () => {
        expect(window.GeminiWebModels.resolveImagePromptModel('')).toBe(
            window.GeminiWebModels.DEFAULT_WEB_MODEL
        );
    });
});
