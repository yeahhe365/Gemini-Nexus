import { describe, expect, it } from 'vitest';
import {
    DEFAULT_WEB_MODEL,
    createWebModelOptionMarkup,
    createWebModelOptions,
    getWebModelHeaderConfig,
} from './web_models.js';

describe('web model metadata', () => {
    it('lists current chat models with stable values', () => {
        expect(DEFAULT_WEB_MODEL).toBe('fbb127bbb056c959');

        expect(createWebModelOptions()).toEqual([
            { value: '56fdd199312815e2', label: '3.7 Flash' },
            { value: 'fbb127bbb056c959', label: '3.6 Flash' },
            { value: 'cf41b0e0dd7d53e5', label: '3.5 Flash-Lite' },
            { value: 'e6fa609c3fa255c0', label: '3.1 Pro' },
        ]);
    });

    it('renders option markup from the same shared model list', () => {
        const markup = createWebModelOptionMarkup();

        expect(markup).toContain('<option value="56fdd199312815e2">3.7 Flash</option>');
        expect(markup).toContain('<option value="fbb127bbb056c959">3.6 Flash</option>');
        expect(markup).toContain('<option value="cf41b0e0dd7d53e5">3.5 Flash-Lite</option>');
        expect(markup).toContain('<option value="e6fa609c3fa255c0">3.1 Pro</option>');
        expect(markup).not.toContain('8c46e95b1a07cecc');
        expect(markup).not.toContain('gemini-3.1-flash-image-preview');
        expect(markup).not.toContain('gemini-3-pro-image-preview-11-2025');
    });

    it('does not support removed image-preview models through header lookup', () => {
        expect(getWebModelHeaderConfig('gemini-3.1-flash-image-preview')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3-pro-image-preview-11-2025')).toBeNull();
    });

    it('normalizes legacy model aliases through the public header lookup', () => {
        expect(getWebModelHeaderConfig('gemini-3.7-flash')).toEqual(
            getWebModelHeaderConfig('56fdd199312815e2')
        );
        expect(getWebModelHeaderConfig('gemini-3.6-flash')).toEqual(
            getWebModelHeaderConfig('fbb127bbb056c959')
        );
        expect(getWebModelHeaderConfig('gemini-3.5-flash-lite')).toEqual(
            getWebModelHeaderConfig('cf41b0e0dd7d53e5')
        );
        expect(getWebModelHeaderConfig('gemini-3-flash-thinking')).toEqual(
            getWebModelHeaderConfig('fbb127bbb056c959')
        );
        expect(getWebModelHeaderConfig('gemini-3-pro')).toEqual(
            getWebModelHeaderConfig('e6fa609c3fa255c0')
        );
        expect(getWebModelHeaderConfig('gemini-3-flash')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3.5-flash')).toBeNull();
        expect(getWebModelHeaderConfig('gemini-3.1-flash-lite')).toBeNull();
    });
});
