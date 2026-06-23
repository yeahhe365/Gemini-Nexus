import { describe, expect, it } from 'vitest';

import { buildSelectionToolPrompt, normalizeCustomSelectionTools } from './selection_tools.js';

describe('custom selection tools settings', () => {
    it('keeps only enabled text tools with names and prompts', () => {
        expect(
            normalizeCustomSelectionTools([
                {
                    id: 'formal',
                    name: '  Formal rewrite  ',
                    prompt: 'Rewrite: {text}',
                    enabled: true,
                },
                {
                    id: 'empty-prompt',
                    name: 'Empty prompt',
                    prompt: '   ',
                    enabled: true,
                },
                {
                    id: '<bad>',
                    name: 'Symbols',
                    prompt: 'Use symbols',
                    enabled: false,
                },
            ])
        ).toEqual([
            {
                id: 'formal',
                name: 'Formal rewrite',
                prompt: 'Rewrite: {text}',
                enabled: true,
            },
            {
                id: 'bad',
                name: 'Symbols',
                prompt: 'Use symbols',
                enabled: false,
            },
        ]);
    });

    it('applies the selected text placeholder or appends selected text when missing', () => {
        expect(buildSelectionToolPrompt('Rewrite: {text}', 'Hello')).toBe('Rewrite: Hello');
        expect(buildSelectionToolPrompt('Explain this', 'Hello')).toBe('Explain this\n\nHello');
    });
});
