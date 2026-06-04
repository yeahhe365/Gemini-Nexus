// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { UIController } from './ui_controller.js';

describe('UIController browser control visibility', () => {
    it('keeps the legacy switcher hidden with the hidden attribute', () => {
        const tabSwitcherBtn = document.createElement('button');
        const tabSelector = { setControlVisible: vi.fn() };
        const controller = Object.create(UIController.prototype);
        controller.tabSwitcherBtn = tabSwitcherBtn;
        controller.tabSelector = tabSelector;

        controller.setBrowserControlVisible(true);

        expect(tabSelector.setControlVisible).toHaveBeenCalledWith(true);
        expect(tabSwitcherBtn.hidden).toBe(true);
        expect(tabSwitcherBtn.style.display).toBe('');
    });
});

describe('UIController host context', () => {
    it('marks tab-hosted sidepanel pages so tab-only controls can be hidden', () => {
        const controller = Object.create(UIController.prototype);

        controller.setHostContext({ isTab: true });
        expect(document.body.classList.contains('host-tab')).toBe(true);

        controller.setHostContext({ isTab: false });
        expect(document.body.classList.contains('host-tab')).toBe(false);
    });

    it('marks whether the chat has a real webpage context', () => {
        const controller = Object.create(UIController.prototype);

        controller.setPageContextAvailable(true);
        expect(document.body.classList.contains('has-page-context')).toBe(true);

        controller.setPageContextAvailable(false);
        expect(document.body.classList.contains('has-page-context')).toBe(false);
    });
});
