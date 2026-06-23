import { beforeEach, describe, expect, it, vi } from 'vitest';

import { injectContentScriptsIntoTab } from './content_injection.js';
import { showQuickAskForTab, startAreaOcrForTab } from './page_shortcut_tab_actions.js';

vi.mock('./content_injection.js', () => ({
    injectContentScriptsIntoTab: vi.fn(() => Promise.resolve({ status: 'already-injected' })),
}));

describe('page shortcut tab actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.chrome = {
            tabs: {
                sendMessage: vi.fn(() => Promise.resolve({ status: 'ok' })),
            },
        };
    });

    it('opens quick ask through the content script', async () => {
        const tab = { id: 9, url: 'https://example.com/' };

        await showQuickAskForTab(tab);

        expect(injectContentScriptsIntoTab).toHaveBeenCalledWith(tab);
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(9, { action: 'SHOW_QUICK_ASK' });
    });

    it('force-refreshes old page content when quick ask messaging fails', async () => {
        const tab = { id: 9, url: 'https://example.com/' };
        chrome.tabs.sendMessage
            .mockRejectedValueOnce(new Error('Receiving end does not exist'))
            .mockResolvedValueOnce({ status: 'ok' });

        await showQuickAskForTab(tab);

        expect(injectContentScriptsIntoTab).toHaveBeenNthCalledWith(1, tab);
        expect(injectContentScriptsIntoTab).toHaveBeenNthCalledWith(2, tab, { force: true });
        expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
        expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(9, {
            action: 'SHOW_QUICK_ASK',
        });
    });

    it('force-refreshes old page content when OCR selection messaging fails', async () => {
        const tab = { id: 9, windowId: 4, url: 'https://example.com/' };
        const imageManager = {
            captureScreenshot: vi.fn(() =>
                Promise.resolve({ base64: 'data:image/png;base64,AAAA' })
            ),
        };
        chrome.tabs.sendMessage
            .mockRejectedValueOnce(new Error('Receiving end does not exist'))
            .mockResolvedValueOnce({ status: 'selection_started' });

        await startAreaOcrForTab(tab, imageManager);

        expect(imageManager.captureScreenshot).toHaveBeenCalledWith(4);
        expect(injectContentScriptsIntoTab).toHaveBeenNthCalledWith(1, tab);
        expect(injectContentScriptsIntoTab).toHaveBeenNthCalledWith(2, tab, { force: true });
        expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(9, {
            action: 'START_SELECTION',
            image: 'data:image/png;base64,AAAA',
            mode: 'ocr',
            source: 'local',
            targetSidePanelTabId: null,
        });
    });

    it('shows a refreshed page error when OCR selection cannot start after capture', async () => {
        const tab = { id: 9, windowId: 4, url: 'https://example.com/' };
        const imageManager = {
            captureScreenshot: vi.fn(() =>
                Promise.resolve({ base64: 'data:image/png;base64,AAAA' })
            ),
        };
        chrome.tabs.sendMessage
            .mockRejectedValueOnce(new Error('Receiving end does not exist'))
            .mockRejectedValueOnce(new Error('Still unavailable'))
            .mockResolvedValueOnce({ status: 'ok' });

        await startAreaOcrForTab(tab, imageManager);

        expect(chrome.tabs.sendMessage).toHaveBeenLastCalledWith(9, {
            action: 'SHOW_EXTENSION_ERROR',
            message: 'Still unavailable',
        });
    });

    it('shows a refreshed page error when OCR screenshot capture fails', async () => {
        const tab = { id: 9, windowId: 4, url: 'https://example.com/' };
        const imageManager = {
            captureScreenshot: vi.fn(() => Promise.resolve({ error: 'Capture denied' })),
        };

        await startAreaOcrForTab(tab, imageManager);

        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(9, {
            action: 'SHOW_EXTENSION_ERROR',
            message: 'Capture denied',
        });
    });
});
