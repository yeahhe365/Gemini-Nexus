// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindAppEvents, getToolsPageScrollDistance } from './events.js';
import { LIVE_ARTIFACT_FOLLOWUP_EVENT } from '../core/live_artifacts.js';

vi.mock('../../shared/messaging/index.js', () => ({
    sendToBackground: vi.fn(),
}));

function installFooterDom() {
    document.body.innerHTML = `
        <button id="new-chat-header-btn"></button>
        <button id="tab-switcher-btn"></button>
        <button id="open-full-page-btn"></button>
        <div class="tools-container">
            <button id="tools-scroll-left"></button>
            <div id="tools-row">
                <button id="browser-control-btn"></button>
                <button id="quote-btn"></button>
                <button id="ocr-btn"></button>
                <button id="screenshot-translate-btn"></button>
                <button id="screen-capture-btn"></button>
                <button id="snip-btn"></button>
                <button id="page-context-btn"></button>
                <button id="live-artifacts-btn"></button>
            </div>
            <button id="tools-scroll-right"></button>
        </div>
        <div class="model-select-wrapper">
            <select id="model-select" class="model-native-select">
                <option value="a">Gemini A Preview</option>
                <option value="b">Gemini B Preview</option>
            </select>
            <button id="model-picker-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="model-picker-listbox">
                <span class="model-picker-current"></span>
            </button>
            <div id="model-picker-menu" hidden>
                <div id="model-picker-listbox" role="listbox"></div>
            </div>
        </div>
        <textarea id="prompt"></textarea>
        <button id="send"></button>
    `;
    document.getElementById('tools-row').scrollBy = vi.fn();
}

describe('app events', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        installFooterDom();
        window.parent.postMessage = vi.fn();
        window.requestAnimationFrame = (callback) => {
            callback();
            return 1;
        };
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('requests the independent screen-capture mode from the parent bridge', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
        };

        bindAppEvents(app, ui);
        document.getElementById('screen-capture-btn').click();

        expect(app.setCaptureMode).toHaveBeenCalledWith('screen_capture');
        expect(window.parent.postMessage).toHaveBeenCalledWith(
            { action: 'REQUEST_SCREEN_CAPTURE' },
            '*'
        );
        expect(ui.updateStatus).toHaveBeenCalledWith('Choose a screen or window to capture...');
    });

    it('opens settings in a standalone extension page', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
        };

        document.body.insertAdjacentHTML('beforeend', '<button id="settings-btn"></button>');
        bindAppEvents(app, ui);
        document.getElementById('settings-btn').click();

        expect(window.parent.postMessage).toHaveBeenCalledWith(
            { action: 'OPEN_SETTINGS_PAGE' },
            '*'
        );
    });

    it('opens settings from the collapsed sidebar rail', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
        };

        document.body.insertAdjacentHTML(
            'beforeend',
            '<button id="collapsed-settings-btn"></button>'
        );
        bindAppEvents(app, ui);
        document.getElementById('collapsed-settings-btn').click();

        expect(window.parent.postMessage).toHaveBeenCalledWith(
            { action: 'OPEN_SETTINGS_PAGE' },
            '*'
        );
    });

    it('starts a new chat from the sidebar action row', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
            sidebar: { close: vi.fn() },
        };

        document.body.insertAdjacentHTML(
            'beforeend',
            '<button id="new-chat-sidebar-btn"></button>'
        );

        bindAppEvents(app, ui);
        document.getElementById('new-chat-sidebar-btn').click();

        expect(app.handleNewChat).toHaveBeenCalledTimes(1);
        expect(ui.sidebar.close).toHaveBeenCalledTimes(1);
    });

    it('starts a new chat from the collapsed sidebar rail', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
            sidebar: { close: vi.fn() },
        };

        document.body.insertAdjacentHTML(
            'beforeend',
            '<button id="collapsed-new-chat-btn"></button>'
        );

        bindAppEvents(app, ui);
        document.getElementById('collapsed-new-chat-btn').click();

        expect(app.handleNewChat).toHaveBeenCalledTimes(1);
        expect(ui.sidebar.close).toHaveBeenCalledTimes(1);
    });

    it('uses a page-sized distance for tools row navigation', () => {
        expect(getToolsPageScrollDistance({ clientWidth: 320 })).toBe(296);
        expect(getToolsPageScrollDistance({ clientWidth: 120 })).toBe(160);
    });

    it('scrolls the tools row by one visible page when using navigation buttons', () => {
        const toolsRow = document.getElementById('tools-row');
        Object.defineProperty(toolsRow, 'clientWidth', {
            value: 320,
            configurable: true,
        });
        Object.defineProperty(toolsRow, 'scrollWidth', {
            value: 720,
            configurable: true,
        });

        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
        };

        bindAppEvents(app, ui);
        document.getElementById('tools-scroll-right').click();

        expect(toolsRow.scrollBy).toHaveBeenCalledWith({ left: 296, behavior: 'smooth' });
    });

    it('selects models through the custom AMC-style model picker', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
        };

        bindAppEvents(app, ui);
        document.getElementById('model-picker-trigger').click();
        document.querySelectorAll('.model-picker-option')[1].click();

        expect(document.getElementById('model-select').value).toBe('b');
        expect(app.handleModelChange).toHaveBeenCalledWith('b');
        expect(document.querySelector('.model-picker-current').textContent).toBe('B');
    });

    it('toggles Live Artifacts mode from the tools row', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            toggleLiveArtifacts: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
        };

        bindAppEvents(app, ui);
        document.getElementById('live-artifacts-btn').click();

        expect(app.toggleLiveArtifacts).toHaveBeenCalledTimes(1);
        expect(ui.inputFn).toBe(document.activeElement);
    });

    it('routes Live Artifact follow-up events to the app controller', () => {
        const app = {
            handleNewChat: vi.fn(),
            handleTabSwitcher: vi.fn(),
            toggleBrowserControl: vi.fn(),
            toggleLiveArtifacts: vi.fn(),
            handleLiveArtifactFollowUp: vi.fn(),
            setCaptureMode: vi.fn(),
            togglePageContext: vi.fn(),
            handleModelChange: vi.fn(),
            handleSendMessage: vi.fn(),
            isGenerating: false,
        };
        const ui = {
            inputFn: document.getElementById('prompt'),
            updateStatus: vi.fn(),
        };
        const detail = { instruction: 'Continue' };

        bindAppEvents(app, ui);
        window.dispatchEvent(new CustomEvent(LIVE_ARTIFACT_FOLLOWUP_EVENT, { detail }));

        expect(app.handleLiveArtifactFollowUp).toHaveBeenCalledWith(detail);
    });
});
