import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getContentScriptFiles,
    getMatchingContentScriptEntries,
    injectContentScriptsIntoOpenTabs,
    injectContentScriptsIntoTab,
    isInjectableTabUrl,
    setupContentScriptInjection,
} from './content_injection.js';

const testManifest = {
    content_scripts: [
        {
            matches: ['<all_urls>'],
            js: ['content/page_guard.js', 'content/index.js'],
        },
        {
            matches: ['<all_urls>'],
            js: ['content/shortcut_frame_bridge.js'],
            run_at: 'document_start',
            all_frames: true,
            match_about_blank: true,
        },
        {
            matches: ['https://gemini.google.com/*'],
            js: ['content/gemini_watermark_bridge.js'],
            run_at: 'document_start',
        },
        {
            matches: ['https://gemini.google.com/*'],
            js: [
                'content/gemini_watermark_page.js',
                'vendor/gemini-watermark-remover/content_main.js',
            ],
            run_at: 'document_start',
            world: 'MAIN',
        },
    ],
};

describe('content script startup injection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.chrome = {
            runtime: {
                getManifest: vi.fn(() => testManifest),
                onInstalled: {
                    addListener: vi.fn(),
                },
            },
            tabs: {
                query: vi.fn(),
                onUpdated: { addListener: vi.fn() },
                onActivated: { addListener: vi.fn() },
                get: vi.fn(),
            },
            scripting: {
                executeScript: vi.fn(),
            },
        };
    });

    it('only considers normal web page URLs injectable', () => {
        expect(isInjectableTabUrl('https://example.com/docs')).toBe(true);
        expect(isInjectableTabUrl('http://localhost:3000')).toBe(true);
        expect(isInjectableTabUrl('chrome://extensions')).toBe(false);
        expect(isInjectableTabUrl('chrome-extension://id/page.html')).toBe(false);
        expect(isInjectableTabUrl('https://chromewebstore.google.com/detail/test')).toBe(false);
        expect(isInjectableTabUrl('file:///tmp/page.html')).toBe(false);
    });

    it('uses the manifest content script order for source and packaged builds', () => {
        expect(getContentScriptFiles()).toEqual([
            'content/page_guard.js',
            'content/index.js',
            'content/shortcut_frame_bridge.js',
            'content/gemini_watermark_bridge.js',
            'content/gemini_watermark_page.js',
            'vendor/gemini-watermark-remover/content_main.js',
        ]);
    });

    it('matches content script entries by page URL and execution world', () => {
        expect(getMatchingContentScriptEntries(testManifest, 'https://example.com/docs')).toEqual([
            expect.objectContaining({
                js: ['content/page_guard.js', 'content/index.js'],
                world: 'ISOLATED',
            }),
            expect.objectContaining({
                js: ['content/shortcut_frame_bridge.js'],
                all_frames: true,
                match_about_blank: true,
                world: 'ISOLATED',
            }),
        ]);
        expect(
            getMatchingContentScriptEntries(testManifest, 'https://gemini.google.com/app')
        ).toEqual([
            expect.objectContaining({
                js: ['content/page_guard.js', 'content/index.js'],
                world: 'ISOLATED',
            }),
            expect.objectContaining({
                js: ['content/shortcut_frame_bridge.js'],
                all_frames: true,
                match_about_blank: true,
                world: 'ISOLATED',
            }),
            expect.objectContaining({
                js: ['content/gemini_watermark_bridge.js'],
                world: 'ISOLATED',
            }),
            expect.objectContaining({
                js: [
                    'content/gemini_watermark_page.js',
                    'vendor/gemini-watermark-remover/content_main.js',
                ],
                world: 'MAIN',
            }),
        ]);
    });

    it('injects manifest content scripts into an open page that has no existing content script', async () => {
        chrome.scripting.executeScript
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }]);

        const result = await injectContentScriptsIntoTab({ id: 12, url: 'https://example.com' });

        expect(result.status).toBe('injected');
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(1, {
            target: { tabId: 12 },
            func: expect.any(Function),
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(2, {
            target: { tabId: 12 },
            files: ['content/page_guard.js', 'content/index.js'],
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(4, {
            target: { tabId: 12, allFrames: true },
            files: ['content/shortcut_frame_bridge.js'],
        });
    });

    it('injects the Gemini main-world watermark script only on Gemini pages', async () => {
        chrome.scripting.executeScript
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }])
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }])
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }])
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }]);

        const result = await injectContentScriptsIntoTab({
            id: 12,
            url: 'https://gemini.google.com/app',
        });

        expect(result.status).toBe('injected');
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(2, {
            target: { tabId: 12 },
            files: ['content/page_guard.js', 'content/index.js'],
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(4, {
            target: { tabId: 12, allFrames: true },
            files: ['content/shortcut_frame_bridge.js'],
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(5, {
            target: { tabId: 12 },
            func: expect.any(Function),
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(6, {
            target: { tabId: 12 },
            files: ['content/gemini_watermark_bridge.js'],
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(7, {
            target: { tabId: 12 },
            world: 'MAIN',
            func: expect.any(Function),
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(8, {
            target: { tabId: 12 },
            files: [
                'content/gemini_watermark_page.js',
                'vendor/gemini-watermark-remover/content_main.js',
            ],
            world: 'MAIN',
        });
    });

    it('adds Gemini watermark scripts when the normal content script is already present', async () => {
        chrome.scripting.executeScript
            .mockResolvedValueOnce([{ result: true }])
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }])
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }]);

        const result = await injectContentScriptsIntoTab({
            id: 12,
            url: 'https://gemini.google.com/app',
        });

        expect(result.status).toBe('injected');
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(2, {
            target: { tabId: 12, allFrames: true },
            func: expect.any(Function),
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(3, {
            target: { tabId: 12, allFrames: true },
            files: ['content/shortcut_frame_bridge.js'],
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(4, {
            target: { tabId: 12 },
            func: expect.any(Function),
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(5, {
            target: { tabId: 12 },
            files: ['content/gemini_watermark_bridge.js'],
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(6, {
            target: { tabId: 12 },
            world: 'MAIN',
            func: expect.any(Function),
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(7, {
            target: { tabId: 12 },
            files: [
                'content/gemini_watermark_page.js',
                'vendor/gemini-watermark-remover/content_main.js',
            ],
            world: 'MAIN',
        });
    });

    it('skips tabs that already have Gemini Nexus content scripts', async () => {
        chrome.scripting.executeScript
            .mockResolvedValueOnce([{ result: true }])
            .mockResolvedValueOnce([{ result: true }]);

        const result = await injectContentScriptsIntoTab({ id: 12, url: 'https://example.com' });

        expect(result.status).toBe('already-injected');
        expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
    });

    it('force-injects the current content bundle over older already-injected pages', async () => {
        chrome.scripting.executeScript.mockResolvedValue([{ result: undefined }]);

        const result = await injectContentScriptsIntoTab(
            { id: 12, url: 'https://example.com' },
            { force: true }
        );

        expect(result.status).toBe('injected');
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(1, {
            target: { tabId: 12 },
            files: ['content/page_guard.js', 'content/index.js'],
        });
        expect(chrome.scripting.executeScript).toHaveBeenNthCalledWith(2, {
            target: { tabId: 12, allFrames: true },
            files: ['content/shortcut_frame_bridge.js'],
        });
    });

    it('walks currently open tabs after install or update', async () => {
        chrome.tabs.query.mockResolvedValue([
            { id: 1, url: 'https://example.com' },
            { id: 2, url: 'chrome://extensions' },
            { id: 3, url: 'https://openai.com' },
        ]);
        chrome.scripting.executeScript
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }])
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }])
            .mockResolvedValueOnce([{ result: true }])
            .mockResolvedValueOnce([{ result: true }]);

        const results = await injectContentScriptsIntoOpenTabs();

        expect(chrome.tabs.query).toHaveBeenCalledWith({});
        expect(results.map((result) => result.status)).toEqual([
            'injected',
            'skipped',
            'already-injected',
        ]);
    });

    it('registers install-time startup injection', async () => {
        setupContentScriptInjection({ initializeOpenTabs: false });

        const listener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
        expect(listener).toEqual(expect.any(Function));

        chrome.tabs.query.mockResolvedValue([]);
        await listener();

        expect(chrome.tabs.query).toHaveBeenCalledWith({});
    });

    it('checks already open tabs when the background worker starts', async () => {
        chrome.tabs.query.mockResolvedValue([]);

        setupContentScriptInjection();
        await new Promise((resolve) => queueMicrotask(resolve));

        expect(chrome.tabs.query).toHaveBeenCalledWith({});
    });

    it('injects restored discarded tabs after they finish loading', async () => {
        setupContentScriptInjection({ initializeOpenTabs: false });
        const listener = chrome.tabs.onUpdated.addListener.mock.calls[0][0];
        chrome.scripting.executeScript
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }]);

        await listener(
            8,
            { status: 'complete', discarded: false },
            { id: 8, url: 'https://restored.test/' }
        );

        expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 8 },
            files: ['content/page_guard.js', 'content/index.js'],
        });
    });

    it('checks the active tab when the browser activates an existing page', async () => {
        setupContentScriptInjection({ initializeOpenTabs: false });
        const listener = chrome.tabs.onActivated.addListener.mock.calls[0][0];
        chrome.tabs.get.mockResolvedValue({ id: 8, url: 'https://active.test/' });
        chrome.scripting.executeScript
            .mockResolvedValueOnce([{ result: false }])
            .mockResolvedValueOnce([{ result: undefined }]);

        await listener({ tabId: 8 });

        expect(chrome.tabs.get).toHaveBeenCalledWith(8);
        expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 8 },
            files: ['content/page_guard.js', 'content/index.js'],
        });
    });
});
