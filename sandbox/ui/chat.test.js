// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatController } from './chat.js';

vi.mock('../render/clipboard.js', () => ({
    copyToClipboard: vi.fn(),
}));

vi.mock('../core/i18n.js', () => ({
    t: (key) => key,
}));

function setScrollMetrics(element, { scrollHeight, clientHeight, scrollTop }) {
    Object.defineProperty(element, 'scrollHeight', {
        configurable: true,
        value: scrollHeight,
    });
    Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        value: clientHeight,
    });
    Object.defineProperty(element, 'scrollTop', {
        configurable: true,
        writable: true,
        value: scrollTop,
    });
}

function createController() {
    const historyDiv = document.createElement('div');
    historyDiv.scrollTo = vi.fn(({ top }) => {
        historyDiv.scrollTop = top;
    });

    const inputFn = document.createElement('textarea');
    const controller = new ChatController({
        historyDiv,
        inputFn,
        sendBtn: document.createElement('button'),
        statusDiv: document.createElement('div'),
    });

    return { controller, historyDiv, inputFn };
}

describe('ChatController composer input', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.documentElement.style.removeProperty('--footer-height');
        document.body.innerHTML = '<div class="footer"></div>';
    });

    it('sets the textarea value and refreshes composer layout', () => {
        const footer = document.querySelector('.footer');
        footer.getBoundingClientRect = vi.fn(() => ({ height: 42 }));
        const { controller, inputFn } = createController();
        Object.defineProperty(inputFn, 'scrollHeight', {
            configurable: true,
            value: 64,
        });

        controller.setInputValue('saved draft');

        expect(controller.getInputValue()).toBe('saved draft');
        expect(inputFn.style.height).toBe('64px');
        expect(document.documentElement.style.getPropertyValue('--footer-height')).toBe('42px');
    });

    it('clears and focuses the textarea when reset', () => {
        const { controller, inputFn } = createController();
        inputFn.focus = vi.fn();
        controller.setInputValue('saved draft');

        controller.resetInput();

        expect(inputFn.value).toBe('');
        expect(inputFn.style.height).toBe('auto');
        expect(inputFn.focus).toHaveBeenCalled();
    });
});

describe('ChatController footer spacing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.documentElement.style.removeProperty('--footer-height');
        document.body.innerHTML = '<div class="footer"></div>';
    });

    it('publishes the measured footer height for chat-history padding', () => {
        const footer = document.querySelector('.footer');
        footer.getBoundingClientRect = vi.fn(() => ({ height: 298.2 }));

        const { controller } = createController();
        controller.updateFooterOffset();

        expect(document.documentElement.style.getPropertyValue('--footer-height')).toBe('299px');
    });
});

describe('ChatController streaming scroll following', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
            callback();
            return 1;
        });
    });

    it('keeps following the bottom while streamed content grows', () => {
        const { controller, historyDiv } = createController();
        setScrollMetrics(historyDiv, {
            scrollHeight: 1000,
            clientHeight: 400,
            scrollTop: 600,
        });

        controller.handleHistoryScroll();
        setScrollMetrics(historyDiv, {
            scrollHeight: 1300,
            clientHeight: 400,
            scrollTop: 600,
        });
        controller.followStreamingContent();

        expect(historyDiv.scrollTo).toHaveBeenCalledWith({
            top: 1300,
            behavior: 'instant',
        });
    });

    it('stops following when the user scrolls away from the bottom', () => {
        const { controller, historyDiv } = createController();
        setScrollMetrics(historyDiv, {
            scrollHeight: 1000,
            clientHeight: 400,
            scrollTop: 300,
        });

        controller.handleHistoryScroll();
        setScrollMetrics(historyDiv, {
            scrollHeight: 1300,
            clientHeight: 400,
            scrollTop: 300,
        });
        controller.followStreamingContent();

        expect(historyDiv.scrollTo).not.toHaveBeenCalled();
    });
});
