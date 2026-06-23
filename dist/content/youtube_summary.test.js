// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sourceFiles = [
    'shared/config/constants_global.js',
    'shared/models/web_model_catalog.js',
    'shared/media/youtube_global.js',
    'content/youtube_summary_i18n.js',
    'content/youtube_summary_model.js',
    'content/youtube_summary_render.js',
    'content/youtube_summary_view.js',
    'content/youtube_summary.js',
];
const sources = sourceFiles.map((sourcePath) =>
    fs.readFileSync(path.resolve(process.cwd(), sourcePath), 'utf8')
);

const TEST_VIDEO_ID = 'nU9c-PffHPg';
const TEST_WATCH_URL = `https://www.youtube.com/watch?v=${TEST_VIDEO_ID}`;
const TEST_SHORTS_URL = `https://www.youtube.com/shorts/${TEST_VIDEO_ID}`;
const TEST_YOUTU_BE_URL = `https://youtu.be/${TEST_VIDEO_ID}?t=18`;
const TEST_SUMMARY_CACHE_KEY = `gemini-nexus-youtube-summary:video:${TEST_VIDEO_ID}`;
const TEST_EXTENSION_BASE_URL = 'chrome-extension://id/';
const TEST_LOGO_URL = `${TEST_EXTENSION_BASE_URL}logo.png`;
const SUMMARY_SESSION_ID = 'summary-session';
const FIRST_SESSION_ID = 'first-session';
const SECOND_SESSION_ID = 'second-session';
const PANEL_LOADING_TEXT = 'Generating video summary';
const REQUEST_SOURCE = 'youtube-summary';
const REQUEST_ID_PATTERN = new RegExp(`^${REQUEST_SOURCE}-`);
const YOUTUBE_ACTIONS_CONTAINER_ID = 'top-level-buttons-computed';
const SEEK_SECONDS_ATTRIBUTE = 'data-seek-seconds';
const RUNTIME_ACTIONS = Object.freeze({
    quickAsk: 'QUICK_ASK',
    streamUpdate: 'GEMINI_STREAM_UPDATE',
    streamDone: 'GEMINI_STREAM_DONE',
    openSidePanel: 'OPEN_SIDE_PANEL',
});

const activeDoms = [];

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function createPage(url, body = '') {
    const dom = new JSDOM(`<!doctype html><html><head></head><body>${body}</body></html>`, {
        runScripts: 'dangerously',
        url,
    });
    activeDoms.push(dom);
    return dom;
}

function createActionsHtml(innerHtml = '') {
    return `<div id="${YOUTUBE_ACTIONS_CONTAINER_ID}">${innerHtml}</div>`;
}

function createWatchMetadataHtml(innerHtml = createActionsHtml()) {
    return `<ytd-watch-metadata>${innerHtml}</ytd-watch-metadata>`;
}

function installScript(
    dom,
    sendMessage = vi.fn(() => Promise.resolve({ status: 'completed' })),
    storageData = {}
) {
    let runtimeListener = null;
    dom.window.chrome = {
        runtime: {
            getURL: vi.fn((resourcePath) => `${TEST_EXTENSION_BASE_URL}${resourcePath}`),
            sendMessage,
            onMessage: {
                addListener: vi.fn((listener) => {
                    runtimeListener = listener;
                }),
                removeListener: vi.fn((listener) => {
                    if (runtimeListener === listener) runtimeListener = null;
                }),
            },
        },
        storage: {
            local: {
                get: vi.fn(() => Promise.resolve(storageData)),
            },
        },
    };
    sources.forEach((source) => dom.window.eval(source));
    return {
        sendMessage,
        dispatchRuntimeMessage(request) {
            return runtimeListener?.(request, {}, vi.fn());
        },
    };
}

function getSummaryView(dom) {
    return dom.window.GeminiYouTubeSummaryView;
}

function getSummaryButton(dom) {
    return dom.window.document.getElementById(getSummaryView(dom).BUTTON_ID);
}

function getSummaryPanel(dom) {
    return dom.window.document.getElementById(getSummaryView(dom).PANEL_ID);
}

function getSummaryStyle(dom) {
    return dom.window.document.getElementById(getSummaryView(dom).STYLE_ID);
}

function getSummaryClassElement(dom, className) {
    return dom.window.document.querySelector(classSelector(className));
}

function getSummaryButtonPart(dom, className) {
    return getSummaryButton(dom).querySelector(classSelector(className));
}

function getContinueButton(dom) {
    return getSummaryClassElement(dom, getSummaryView(dom).CLASS_NAMES.continueButton);
}

function getRegenerateButton(dom) {
    return getSummaryClassElement(dom, getSummaryView(dom).CLASS_NAMES.regenerateButton);
}

function getDefaultWebModel(dom) {
    return dom.window.GeminiNexusWebModelCatalog.DEFAULT_WEB_MODEL;
}

function classSelector(className) {
    return `.${className}`;
}

function seekLinkSelector(seconds) {
    return `a[${SEEK_SECONDS_ATTRIBUTE}="${seconds}"]`;
}

function clickSummaryButton(dom) {
    getSummaryButton(dom).dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
    );
}

describe('YouTube summary content script', () => {
    afterEach(() => {
        while (activeDoms.length > 0) {
            const dom = activeDoms.pop();
            dom.window.GeminiYouTubeSummary?.controller?.stop?.();
            dom.window.close();
        }
        vi.clearAllMocks();
    });

    it('inserts a visible summary button into YouTube video actions', () => {
        const dom = createPage(
            TEST_WATCH_URL,
            createWatchMetadataHtml(createActionsHtml('<button id="native"></button>'))
        );

        installScript(dom);

        const view = getSummaryView(dom);
        const button = getSummaryButton(dom);
        const actions = dom.window.document.getElementById(YOUTUBE_ACTIONS_CONTAINER_ID);

        expect(button).not.toBeNull();
        expect(button.hidden).toBe(false);
        expect(button.dataset.videoUrl).toBe(TEST_WATCH_URL);
        expect(button.classList.contains(view.CLASS_NAMES.floating)).toBe(false);
        expect(actions.firstElementChild).toBe(button);

        const logo = getSummaryButtonPart(dom, view.CLASS_NAMES.logo);
        const label = getSummaryButtonPart(dom, view.CLASS_NAMES.label);
        expect(logo).not.toBeNull();
        expect(logo.getAttribute('src')).toBe(TEST_LOGO_URL);
        expect(logo.getAttribute('aria-hidden')).toBe('true');
        expect(logo.getAttribute('alt')).toBe('');
        expect(label.textContent).toBe('Summarize');
    });

    it('matches YouTube action chip and themed panel styling', () => {
        const dom = createPage(TEST_WATCH_URL, createWatchMetadataHtml());

        installScript(dom);

        const view = getSummaryView(dom);
        const css = getSummaryStyle(dom)?.textContent;

        expect(css).toContain(`#${view.BUTTON_ID}`);
        expect(css).toContain(
            '--gemini-nexus-youtube-summary-text: var(--yt-spec-text-primary, #0f0f0f)'
        );
        expect(css).toContain(
            '--gemini-nexus-youtube-summary-chip: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, 0.05))'
        );
        expect(css).toContain(`#${view.BUTTON_ID}:hover`);
        expect(css).toContain('background: var(--gemini-nexus-youtube-summary-hover)');
        expect(css).toContain('color: var(--gemini-nexus-youtube-summary-text)');
        expect(css).toContain(`#${view.PANEL_ID}`);
        expect(css).toContain(
            '--gemini-nexus-youtube-summary-panel-bg: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, 0.04))'
        );
        expect(css).toContain(
            '--gemini-nexus-youtube-summary-surface: var(--yt-spec-base-background, rgba(255, 255, 255, 0.92))'
        );
        expect(css).toContain(
            `html[dark] #${view.BUTTON_ID},\n            html[dark] #${view.PANEL_ID}`
        );
        expect(css).toContain(
            '--gemini-nexus-youtube-summary-text: var(--yt-spec-text-primary, #f1f1f1)'
        );
        expect(css).toContain(
            '--gemini-nexus-youtube-summary-panel-bg: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.08))'
        );
        expect(css).not.toContain('background: #3ea6ff');
        expect(css).not.toContain('#65b8ff');
    });

    it('uses a floating fallback when YouTube actions have not rendered yet', () => {
        const dom = createPage(TEST_SHORTS_URL);

        installScript(dom);

        const view = getSummaryView(dom);
        const button = getSummaryButton(dom);

        expect(button).not.toBeNull();
        expect(button.hidden).toBe(false);
        expect(button.classList.contains(view.CLASS_NAMES.floating)).toBe(true);
        expect(button.parentElement).toBe(dom.window.document.body);
    });

    it('does not show the button on non-video YouTube pages', () => {
        const dom = createPage('https://www.youtube.com/feed/subscriptions');

        installScript(dom);

        expect(getSummaryButton(dom)).toBeNull();
    });

    it('starts a page-local quick ask instead of opening the side panel', async () => {
        const pending = deferred();
        const sendMessage = vi.fn(() => pending.promise);
        const dom = createPage(TEST_YOUTU_BE_URL);

        installScript(dom, sendMessage);

        const view = getSummaryView(dom);
        clickSummaryButton(dom);
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

        expect(sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: RUNTIME_ACTIONS.quickAsk,
                source: REQUEST_SOURCE,
                requestId: expect.stringMatching(REQUEST_ID_PATTERN),
                text: expect.stringContaining(TEST_WATCH_URL),
                provider: 'web',
                model: getDefaultWebModel(dom),
            })
        );
        expect(sendMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ action: RUNTIME_ACTIONS.openSidePanel })
        );

        const panel = getSummaryPanel(dom);
        expect(panel).not.toBeNull();
        expect(panel.hidden).toBe(false);
        expect(panel.textContent).toContain(PANEL_LOADING_TEXT);
        expect(getSummaryButtonPart(dom, view.CLASS_NAMES.logo)).not.toBeNull();
        expect(getSummaryButtonPart(dom, view.CLASS_NAMES.label)?.textContent).toBe(
            'Summarizing...'
        );

        pending.resolve({ status: 'completed' });
        await Promise.resolve();
    });

    it('routes YouTube summaries through the stored OpenAI-compatible provider', async () => {
        const pending = deferred();
        const sendMessage = vi.fn(() => pending.promise);
        const dom = createPage(TEST_WATCH_URL);

        installScript(dom, sendMessage, {
            geminiProvider: 'openai',
            geminiOpenaiModel: 'grok-4.3, gpt-5',
            geminiOpenaiSelectedModel: 'grok-4.3',
        });

        clickSummaryButton(dom);
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

        expect(sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: RUNTIME_ACTIONS.quickAsk,
                source: REQUEST_SOURCE,
                requestId: expect.stringMatching(REQUEST_ID_PATTERN),
                text: expect.stringContaining(TEST_WATCH_URL),
                provider: 'openai',
                model: 'grok-4.3',
            })
        );

        pending.resolve({ status: 'completed' });
        await Promise.resolve();
    });

    it('renders streamed summary text on the YouTube page with seekable timestamp links', async () => {
        const pending = deferred();
        const sendMessage = vi.fn(() => pending.promise);
        const dom = createPage(
            TEST_WATCH_URL,
            createWatchMetadataHtml(`${createActionsHtml()}<video></video>`)
        );
        const { dispatchRuntimeMessage } = installScript(dom, sendMessage);

        const video = dom.window.document.querySelector('video');
        video.play = vi.fn(() => Promise.resolve());

        clickSummaryButton(dom);
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

        const request = sendMessage.mock.calls[0][0];
        dispatchRuntimeMessage({
            action: RUNTIME_ACTIONS.streamUpdate,
            source: REQUEST_SOURCE,
            requestId: request.requestId,
            text: 'Intro at 0:12',
        });

        let panel = getSummaryPanel(dom);
        let timestampLink = panel.querySelector(seekLinkSelector(12));
        expect(timestampLink).not.toBeNull();
        expect(timestampLink.textContent).toBe('0:12');

        dispatchRuntimeMessage({
            action: RUNTIME_ACTIONS.streamDone,
            source: REQUEST_SOURCE,
            requestId: request.requestId,
            result: {
                status: 'success',
                text: `Intro at 0:12\nDeep dive ${TEST_WATCH_URL}&t=62s.\nTimestamp link [1:05](${TEST_WATCH_URL})`,
            },
        });

        panel = getSummaryPanel(dom);
        timestampLink = panel.querySelector(seekLinkSelector(12));
        const urlLink = panel.querySelector(seekLinkSelector(62));
        const markdownLink = panel.querySelector(seekLinkSelector(65));

        expect(timestampLink).not.toBeNull();
        expect(urlLink).not.toBeNull();
        expect(markdownLink).not.toBeNull();

        timestampLink.dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
        );

        expect(video.currentTime).toBe(12);
        expect(dom.window.location.href).toContain('t=12s');

        pending.resolve({ status: 'completed' });
        await Promise.resolve();
    });

    it('renders streamed markdown summary content as structured DOM', async () => {
        const pending = deferred();
        const sendMessage = vi.fn(() => pending.promise);
        const dom = createPage(TEST_WATCH_URL, createWatchMetadataHtml());
        const { dispatchRuntimeMessage } = installScript(dom, sendMessage);

        clickSummaryButton(dom);
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalled());

        const request = sendMessage.mock.calls[0][0];
        dispatchRuntimeMessage({
            action: RUNTIME_ACTIONS.streamDone,
            source: REQUEST_SOURCE,
            requestId: request.requestId,
            result: {
                status: 'success',
                text: [
                    '## Main points',
                    '',
                    '- **Intro** at 0:12',
                    '- Use `chapter markers`',
                    '',
                    '> Key takeaway',
                    '',
                    '| Time | Topic |',
                    '| --- | --- |',
                    `| [1:05](${TEST_WATCH_URL}) | Demo |`,
                    '',
                    '```text',
                    '<script>alert(1)</script>',
                    '```',
                ].join('\n'),
            },
        });

        const panel = getSummaryPanel(dom);
        expect(panel.querySelector('h2')?.textContent).toBe('Main points');
        expect(panel.querySelectorAll('li')).toHaveLength(2);
        expect(panel.querySelector('strong')?.textContent).toBe('Intro');
        expect(panel.querySelector('li code')?.textContent).toBe('chapter markers');
        expect(panel.querySelector('blockquote')?.textContent).toContain('Key takeaway');
        expect(panel.querySelector('table th')?.textContent).toBe('Time');
        expect(panel.querySelector(`table ${seekLinkSelector(65)}`)).not.toBeNull();
        expect(panel.querySelector('pre code')?.textContent).toBe('<script>alert(1)</script>');
        expect(panel.querySelector('script')).toBeNull();

        pending.resolve({ status: 'completed' });
        await Promise.resolve();
    });

    it('caches completed summaries on the page and reopens them without another request', async () => {
        const pending = deferred();
        const sendMessage = vi.fn(() => pending.promise);
        const dom = createPage(TEST_WATCH_URL, createWatchMetadataHtml());
        const { dispatchRuntimeMessage } = installScript(dom, sendMessage);

        const button = getSummaryButton(dom);
        clickSummaryButton(dom);
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

        const request = sendMessage.mock.calls[0][0];
        dispatchRuntimeMessage({
            action: RUNTIME_ACTIONS.streamDone,
            source: REQUEST_SOURCE,
            requestId: request.requestId,
            sessionId: SUMMARY_SESSION_ID,
            result: {
                status: 'success',
                text: 'Cached summary at 0:12',
            },
        });

        const panel = getSummaryPanel(dom);
        expect(panel.textContent).toContain('Cached summary');
        expect(button.textContent).toBe('View summary');
        expect(dom.window.sessionStorage.getItem(TEST_SUMMARY_CACHE_KEY)).toContain(
            'Cached summary'
        );

        panel.hidden = true;
        clickSummaryButton(dom);

        expect(sendMessage).toHaveBeenCalledTimes(1);
        expect(panel.hidden).toBe(false);
        expect(panel.textContent).toContain('Cached summary');
        expect(getContinueButton(dom).disabled).toBe(false);

        pending.resolve({ status: 'completed' });
        await Promise.resolve();
    });

    it('regenerates a cached summary and replaces the page cache', async () => {
        const firstPending = deferred();
        const secondPending = deferred();
        const sendMessage = vi
            .fn()
            .mockImplementationOnce(() => firstPending.promise)
            .mockImplementationOnce(() => secondPending.promise);
        const dom = createPage(TEST_WATCH_URL, createWatchMetadataHtml());
        const { dispatchRuntimeMessage } = installScript(dom, sendMessage);

        clickSummaryButton(dom);
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

        dispatchRuntimeMessage({
            action: RUNTIME_ACTIONS.streamDone,
            source: REQUEST_SOURCE,
            requestId: sendMessage.mock.calls[0][0].requestId,
            sessionId: FIRST_SESSION_ID,
            result: {
                status: 'success',
                text: 'First summary',
            },
        });

        const panel = getSummaryPanel(dom);
        getRegenerateButton(dom).dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
        );
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));

        expect(panel.textContent).toContain(PANEL_LOADING_TEXT);
        dispatchRuntimeMessage({
            action: RUNTIME_ACTIONS.streamDone,
            source: REQUEST_SOURCE,
            requestId: sendMessage.mock.calls[1][0].requestId,
            sessionId: SECOND_SESSION_ID,
            result: {
                status: 'success',
                text: 'Second summary',
            },
        });

        expect(panel.textContent).toContain('Second summary');
        expect(panel.textContent).not.toContain('First summary');
        expect(dom.window.sessionStorage.getItem(TEST_SUMMARY_CACHE_KEY)).toContain(
            'Second summary'
        );
        expect(getContinueButton(dom).dataset.sessionId).toBe(SECOND_SESSION_ID);

        firstPending.resolve({ status: 'completed' });
        secondPending.resolve({ status: 'completed' });
        await Promise.resolve();
    });

    it('opens the side panel for continuing the completed summary chat', async () => {
        const pending = deferred();
        const sendMessage = vi.fn((request) =>
            request.action === RUNTIME_ACTIONS.openSidePanel
                ? Promise.resolve({ status: 'opened' })
                : pending.promise
        );
        const dom = createPage(TEST_WATCH_URL, createWatchMetadataHtml());
        const { dispatchRuntimeMessage } = installScript(dom, sendMessage);

        clickSummaryButton(dom);
        await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

        dispatchRuntimeMessage({
            action: RUNTIME_ACTIONS.streamDone,
            source: REQUEST_SOURCE,
            requestId: sendMessage.mock.calls[0][0].requestId,
            sessionId: SUMMARY_SESSION_ID,
            result: {
                status: 'success',
                text: 'Ready to continue',
            },
        });

        const continueButton = getContinueButton(dom);
        expect(continueButton.disabled).toBe(false);
        continueButton.dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
        );

        await vi.waitFor(() =>
            expect(sendMessage).toHaveBeenCalledWith({
                action: RUNTIME_ACTIONS.openSidePanel,
                sessionId: SUMMARY_SESSION_ID,
            })
        );

        pending.resolve({ status: 'completed' });
        await Promise.resolve();
    });

    it('shows a panel error when continuing the summary chat cannot open the side panel', async () => {
        const pending = deferred();
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const sendMessage = vi.fn((request) =>
            request.action === RUNTIME_ACTIONS.openSidePanel
                ? Promise.resolve({ status: 'error', error: 'Cannot open side panel' })
                : pending.promise
        );
        try {
            const dom = createPage(TEST_WATCH_URL, createWatchMetadataHtml());
            const { dispatchRuntimeMessage } = installScript(dom, sendMessage);

            clickSummaryButton(dom);
            await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

            dispatchRuntimeMessage({
                action: RUNTIME_ACTIONS.streamDone,
                source: REQUEST_SOURCE,
                requestId: sendMessage.mock.calls[0][0].requestId,
                sessionId: SUMMARY_SESSION_ID,
                result: {
                    status: 'success',
                    text: 'Ready to continue',
                },
            });

            getContinueButton(dom).dispatchEvent(
                new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
            );

            await vi.waitFor(() => {
                expect(getSummaryPanel(dom).textContent).toContain('Cannot open side panel');
                expect(getContinueButton(dom).disabled).toBe(true);
            });
            expect(warnSpy).toHaveBeenCalledWith(
                'Failed to continue YouTube summary chat:',
                expect.objectContaining({ message: 'Cannot open side panel' })
            );

            pending.resolve({ status: 'completed' });
            await Promise.resolve();
        } finally {
            warnSpy.mockRestore();
        }
    });
});
