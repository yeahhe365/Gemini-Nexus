import { describe, expect, it } from 'vitest';
import { getPreferredModel } from './model_options.js';

describe('model options preferred selection', () => {
    it('upgrades a saved Web hash to the catalog value', () => {
        expect(getPreferredModel({ provider: 'web', selectedModel: 'cf41b0e0dd7d53e5' }, '')).toBe(
            '8c46e95b1a07cecc'
        );
        expect(getPreferredModel({ provider: 'web', selectedModel: '95a4c0abcba24364' }, '')).toBe(
            'argon'
        );
        expect(getPreferredModel({ provider: 'web', selectedModel: '56fdd199312815e2' }, '')).toBe(
            '56fdd199312815e2'
        );
    });

    it('keeps a current Web selection as-is', () => {
        expect(getPreferredModel({ provider: 'web', selectedModel: 'e6fa609c3fa255c0' }, '')).toBe(
            'e6fa609c3fa255c0'
        );
        expect(getPreferredModel({ provider: 'web', selectedModel: '' }, 'argon')).toBe('argon');
    });

    it('does not rewrite official API model ids that overlap Web aliases', () => {
        expect(
            getPreferredModel(
                { provider: 'official', selectedModel: 'gemini-3.8-flash' },
                'gemini-4-hydrogen'
            )
        ).toBe('gemini-3.8-flash');
    });
});
