import { describe, expect, it } from 'vitest';
import {
    DEFAULT_WEB_MODEL,
    createWebModelOptionMarkup,
    createWebModelOptions,
    getSupportedWebModelValues,
    getWebModelHeaderConfig,
} from './web_models.js';

describe('web model metadata', () => {
    it('lists current chat models with stable values', () => {
        expect(DEFAULT_WEB_MODEL).toBe('56fdd199312815e2');

        expect(createWebModelOptions()).toEqual([
            { value: '56fdd199312815e2', label: '4 Hydrogen' },
            { value: '8c46e95b1a07cecc', label: '3.5 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
            { value: 'argon', label: '4 Argon' },
        ]);
    });

    it('renders option markup from the same shared model list', () => {
        const markup = createWebModelOptionMarkup();

        expect(markup).toContain('<option value="56fdd199312815e2">4 Hydrogen</option>');
        expect(markup).toContain('<option value="8c46e95b1a07cecc">3.5 Flash-Lite</option>');
        expect(markup).toContain('<option value="e6fa609c3fa255c0">3.1 Pro</option>');
        expect(markup).toContain('<option value="argon">4 Argon</option>');
        expect(markup).not.toContain('cf41b0e0dd7d53e5');
        expect(markup).not.toContain('95a4c0abcba24364');
        expect(markup).not.toContain('3.8 Flash');
        expect(markup).not.toContain('gemini-3.1-flash-image-preview');
        expect(markup).not.toContain('gemini-3-pro-image-preview-11-2025');
    });

    it('keeps the header config list aligned with the visible options', () => {
        expect(getSupportedWebModelValues()).toEqual([
            '56fdd199312815e2',
            '8c46e95b1a07cecc',
            'e6fa609c3fa255c0',
            'argon',
        ]);
    });

    it('does not support removed image-preview models through header lookup', () => {
        expect(getWebModelHeaderConfig('gemini-3.1-flash-image-preview')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3-pro-image-preview-11-2025')).toBeNull();
    });

    it('normalizes legacy model aliases through the public header lookup', () => {
        expect(getWebModelHeaderConfig('gemini-4-argon')).toEqual(getWebModelHeaderConfig('argon'));
        expect(getWebModelHeaderConfig('gemini-4')).toEqual(getWebModelHeaderConfig('argon'));
        expect(getWebModelHeaderConfig('95a4c0abcba24364')).toEqual(
            getWebModelHeaderConfig('argon')
        );
        expect(getWebModelHeaderConfig('gemini-4-hydrogen')).toEqual(
            getWebModelHeaderConfig('56fdd199312815e2')
        );
        expect(getWebModelHeaderConfig('gemini-3.8-flash')).toEqual(
            getWebModelHeaderConfig('56fdd199312815e2')
        );
        expect(getWebModelHeaderConfig('gemini-3.7-flash')).toEqual(
            getWebModelHeaderConfig('56fdd199312815e2')
        );
        expect(getWebModelHeaderConfig('gemini-3.5-flash-lite')).toEqual(
            getWebModelHeaderConfig('8c46e95b1a07cecc')
        );
        expect(getWebModelHeaderConfig('cf41b0e0dd7d53e5')).toEqual(
            getWebModelHeaderConfig('8c46e95b1a07cecc')
        );
        expect(getWebModelHeaderConfig('gemini-3.1-pro')).toEqual(
            getWebModelHeaderConfig('e6fa609c3fa255c0')
        );
        expect(getWebModelHeaderConfig('gemini-3.1-pro-preview')).toEqual(
            getWebModelHeaderConfig('e6fa609c3fa255c0')
        );
        expect(getWebModelHeaderConfig('gemini-3.6-flash')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3-flash-thinking')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3-flash')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3.5-flash')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3.1-flash-lite')).toBeNull();
    });
});
