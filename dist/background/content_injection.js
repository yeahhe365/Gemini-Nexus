const BLOCKED_URL_PREFIXES = [
    'chrome://',
    'edge://',
    'chrome-extension://',
    'about:',
    'view-source:',
];

const BLOCKED_WEB_ORIGINS = new Set([
    'https://chrome.google.com',
    'https://chromewebstore.google.com',
]);

const DEFAULT_CONTENT_SCRIPT_WORLD = 'ISOLATED';

function hasGeminiNexusContentScript() {
    return Boolean(
        window.GeminiNexusContentReady === true ||
        window.GeminiMessageRouter ||
        document.getElementById('gemini-nexus-toolbar-host')
    );
}

function hasGeminiNexusWatermarkPageScript() {
    return window.GeminiNexusGeminiWatermarkRemoverPage?.installed === true;
}

function hasGeminiNexusWatermarkBridgeScript() {
    return window.GeminiNexusGwrBridgeReady === true;
}

function hasGeminiNexusShortcutFrameBridge() {
    return window.GeminiNexusShortcutFrameBridgeReady === true;
}

function globToRegExp(glob) {
    return new RegExp(
        `^${glob
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')}$`
    );
}

function matchesHostPattern(hostname, hostPattern) {
    if (hostPattern === '*') return true;
    if (hostPattern.startsWith('*.')) {
        const domain = hostPattern.slice(2);
        return hostname === domain || hostname.endsWith(`.${domain}`);
    }
    return hostname === hostPattern;
}

function matchesChromePattern(url, pattern) {
    if (pattern === '<all_urls>') return true;

    const match = pattern.match(/^(\*|http|https):\/\/([^/]+)(\/.*)$/);
    if (!match) return false;

    try {
        const parsed = new URL(url);
        const [, schemePattern, hostPattern, pathPattern] = match;
        const scheme = parsed.protocol.slice(0, -1);

        if (schemePattern !== '*' && schemePattern !== scheme) return false;
        if (schemePattern === '*' && scheme !== 'http' && scheme !== 'https') return false;
        if (!matchesHostPattern(parsed.hostname, hostPattern)) return false;

        return globToRegExp(pathPattern).test(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    } catch {
        return false;
    }
}

function matchesContentScriptEntry(entry, url) {
    const matches = entry.matches || [];
    if (!matches.some((pattern) => matchesChromePattern(url, pattern))) return false;

    const excludeMatches = entry.exclude_matches || [];
    if (excludeMatches.some((pattern) => matchesChromePattern(url, pattern))) return false;

    const excludeGlobs = entry.exclude_globs || [];
    if (excludeGlobs.some((glob) => globToRegExp(glob).test(url))) return false;

    return true;
}

export function isInjectableTabUrl(url) {
    if (typeof url !== 'string' || url.length === 0) return false;
    if (BLOCKED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) return false;
    if (/\.(?:mhtml|mht)(?:[?#].*)?$/i.test(url)) return false;

    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
        if (BLOCKED_WEB_ORIGINS.has(parsed.origin)) return false;
        return true;
    } catch {
        return false;
    }
}

export function getContentScriptFiles(manifest = chrome.runtime.getManifest()) {
    const files = (manifest.content_scripts || []).flatMap((entry) => entry.js || []);
    return [...new Set(files)];
}

export function getMatchingContentScriptEntries(manifest = chrome.runtime.getManifest(), url = '') {
    return (manifest.content_scripts || [])
        .filter((entry) => matchesContentScriptEntry(entry, url))
        .map((entry) => ({
            ...entry,
            js: [...new Set(entry.js || [])],
            world: entry.world || DEFAULT_CONTENT_SCRIPT_WORLD,
        }))
        .filter((entry) => entry.js.length > 0);
}

async function isAlreadyInjected(tabId, scripting = chrome.scripting) {
    const results = await scripting.executeScript({
        target: { tabId },
        func: hasGeminiNexusContentScript,
    });
    return results?.some((result) => result.result === true) === true;
}

async function isWatermarkPageScriptInjected(tabId, scripting = chrome.scripting) {
    const results = await scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: hasGeminiNexusWatermarkPageScript,
    });
    return results?.some((result) => result.result === true) === true;
}

async function isWatermarkBridgeScriptInjected(tabId, scripting = chrome.scripting) {
    const results = await scripting.executeScript({
        target: { tabId },
        func: hasGeminiNexusWatermarkBridgeScript,
    });
    return results?.some((result) => result.result === true) === true;
}

async function isAllFrameShortcutBridgeInjected(tabId, scripting = chrome.scripting) {
    const results = await scripting.executeScript({
        target: { tabId, allFrames: true },
        func: hasGeminiNexusShortcutFrameBridge,
    });
    return results?.length > 0 && results.every((result) => result.result === true);
}

async function injectContentScriptEntry(tabId, entry, scripting = chrome.scripting) {
    const options = {
        target: {
            tabId,
            ...(entry.all_frames ? { allFrames: true } : {}),
        },
        files: entry.js,
    };

    if (entry.world && entry.world !== DEFAULT_CONTENT_SCRIPT_WORLD) {
        options.world = entry.world;
    }

    await scripting.executeScript(options);
}

export async function injectContentScriptsIntoTab(tab, options = {}) {
    const scripting = options.scripting || chrome.scripting;
    const manifest = options.manifest || chrome.runtime.getManifest();
    const force = options.force === true;
    const tabId = tab?.id;
    const url = tab?.url || tab?.pendingUrl || '';

    if (!Number.isInteger(tabId) || !isInjectableTabUrl(url) || tab?.discarded === true) {
        return { tabId, status: 'skipped' };
    }

    try {
        const entries = getMatchingContentScriptEntries(manifest, url);
        const allFrameShortcutBridgeEntries = entries.filter(
            (entry) =>
                entry.world !== 'MAIN' &&
                entry.all_frames === true &&
                entry.js.includes('content/shortcut_frame_bridge.js')
        );
        const watermarkBridgeEntries = entries.filter(
            (entry) =>
                entry.world !== 'MAIN' && entry.js.includes('content/gemini_watermark_bridge.js')
        );
        const normalEntries = entries.filter(
            (entry) =>
                entry.world !== 'MAIN' &&
                !allFrameShortcutBridgeEntries.includes(entry) &&
                !watermarkBridgeEntries.includes(entry)
        );
        const mainEntries = entries.filter((entry) => entry.world === 'MAIN');
        let injected = false;

        if (normalEntries.length > 0 && (force || !(await isAlreadyInjected(tabId, scripting)))) {
            for (const entry of normalEntries) {
                await injectContentScriptEntry(tabId, entry, scripting);
                injected = true;
            }
        }

        for (const entry of allFrameShortcutBridgeEntries) {
            if (!force && (await isAllFrameShortcutBridgeInjected(tabId, scripting))) continue;
            await injectContentScriptEntry(tabId, entry, scripting);
            injected = true;
        }

        for (const entry of watermarkBridgeEntries) {
            if (!force && (await isWatermarkBridgeScriptInjected(tabId, scripting))) continue;
            await injectContentScriptEntry(tabId, entry, scripting);
            injected = true;
        }

        if (
            mainEntries.length > 0 &&
            (force || !(await isWatermarkPageScriptInjected(tabId, scripting)))
        ) {
            for (const entry of mainEntries) {
                await injectContentScriptEntry(tabId, entry, scripting);
                injected = true;
            }
        }

        return { tabId, status: injected ? 'injected' : 'already-injected' };
    } catch (error) {
        console.warn('[Gemini Nexus] Failed to inject content scripts into existing tab:', error);
        return { tabId, status: 'failed', error };
    }
}

export async function injectContentScriptsIntoOpenTabs(options = {}) {
    const tabsApi = options.tabs || chrome.tabs;
    const tabs = await tabsApi.query({});
    const results = [];

    for (const tab of tabs) {
        results.push(await injectContentScriptsIntoTab(tab, options));
    }

    return results;
}

function initializeOpenTabs(reason) {
    injectContentScriptsIntoOpenTabs().catch((error) => {
        console.warn(`[Gemini Nexus] Failed to initialize existing tabs${reason}:`, error);
    });
}

export function setupContentScriptInjection(options = {}) {
    if (options.initializeOpenTabs !== false) {
        queueMicrotask(() => initializeOpenTabs(' on startup'));
    }

    chrome.runtime.onInstalled.addListener(() => {
        initializeOpenTabs(' after install or update');
    });

    chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
        if (changeInfo.status !== 'complete') return;
        await injectContentScriptsIntoTab(tab);
    });

    chrome.tabs.onActivated.addListener(async ({ tabId }) => {
        try {
            const tab = await chrome.tabs.get(tabId);
            await injectContentScriptsIntoTab(tab);
        } catch (error) {
            console.warn('[Gemini Nexus] Failed to check activated tab:', error);
        }
    });
}
