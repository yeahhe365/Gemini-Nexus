import { describe, expect, it } from 'vitest';
import {
    DEFAULT_WEB_MODEL,
    createWebModelOptionMarkup,
    createWebModelOptions,
    getWebModelHeaderConfig,
} from './web_models.js';

describe('web model metadata', () => {
    it('lists current chat models with stable values', () => {
        expect(DEFAULT_WEB_MODEL).toBe('56fdd199312815e2');

        expect(createWebModelOptions()).toEqual([
            { value: '56fdd199312815e2', label: '3.5 Flash' },
            { value: '8c46e95b1a07cecc', label: '3.1 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
        ]);
    });

    it('renders option markup from the same shared model list', () => {
        const markup = createWebModelOptionMarkup();

        expect(markup).toContain('<option value="8c46e95b1a07cecc">3.1 Flash-Lite</option>');
        expect(markup).toContain('<option value="56fdd199312815e2">3.5 Flash</option>');
        expect(markup).toContain('<option value="e6fa609c3fa255c0">3.1 Pro</option>');
        expect(markup).not.toContain('gemini-3.1-flash-image-preview');
        expect(markup).not.toContain('gemini-3-pro-image-preview-11-2025');
    });

    it('does not support removed image-preview models through header lookup', () => {
        expect(getWebModelHeaderConfig('gemini-3.1-flash-image-preview')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3-pro-image-preview-11-2025')).toBeNull();
    });

    it('normalizes legacy model aliases through the public header lookup', () => {
        expect(getWebModelHeaderConfig('gemini-2.5-flash')).toEqual(
            getWebModelHeaderConfig('8c46e95b1a07cecc')
        );
        expect(getWebModelHeaderConfig('gemini-3.1-flash-lite')).toEqual(
            getWebModelHeaderConfig('8c46e95b1a07cecc')
        );
        expect(getWebModelHeaderConfig('gemini-3-flash-thinking')).toEqual(
            getWebModelHeaderConfig('56fdd199312815e2')
        );
        expect(getWebModelHeaderConfig('gemini-3-pro')).toEqual(
            getWebModelHeaderConfig('e6fa609c3fa255c0')
        );
    });
});
