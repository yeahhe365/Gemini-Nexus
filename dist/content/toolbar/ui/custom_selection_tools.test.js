// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('GeminiCustomSelectionToolsUI', () => {
    beforeEach(async () => {
        vi.resetModules();
        window.GeminiCustomSelectionToolsUI = undefined;
        await import('./custom_selection_tools.js');
    });

    function createElements() {
        document.body.innerHTML = `
            <div id="custom-selection-tools"></div>
            <button id="custom-selection-more" class="hidden"></button>
            <div id="custom-selection-more-menu"></div>
        `;
        return {
            customSelectionTools: document.getElementById('custom-selection-tools'),
            customSelectionMore: document.getElementById('custom-selection-more'),
            customSelectionMoreMenu: document.getElementById('custom-selection-more-menu'),
        };
    }

    it('renders two direct custom tools and moves the rest into the more menu', () => {
        const onAction = vi.fn();
        const toolsUi = new window.GeminiCustomSelectionToolsUI({
            elements: createElements(),
            onAction,
        });

        toolsUi.setTools([
            { name: 'Formal', prompt: 'Rewrite', enabled: true },
            { name: 'Short', prompt: 'Summarize', enabled: true },
            { name: 'Disabled', prompt: 'Nope', enabled: false },
            { name: 'Explain', prompt: 'Explain', enabled: true },
        ]);

        expect(document.querySelectorAll('.custom-selection-tool-btn')).toHaveLength(2);
        expect(document.querySelector('.custom-selection-tool-btn').textContent).toBe('FO');
        expect(document.querySelectorAll('.custom-selection-more-item')).toHaveLength(1);
        expect(document.getElementById('custom-selection-more').classList.contains('hidden')).toBe(
            false
        );

        document.querySelector('.custom-selection-more-item').click();
        expect(onAction).toHaveBeenCalledWith('custom_selection_tool', {
            name: 'Explain',
            prompt: 'Explain',
            enabled: true,
        });
    });
});
