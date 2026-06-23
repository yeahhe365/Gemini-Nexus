import { injectContentScriptsIntoTab } from './content_injection.js';

const WEB_PAGE_PATTERNS = ['http://*/*', 'https://*/*'];

const MENU_MODES = {
    'menu-ask': 'ask',
    'menu-page-chat': 'page_chat',
    'menu-read-page': 'read_page',
    'menu-read-selection': 'read_selection',
    'menu-ocr': 'ocr',
    'menu-screenshot-translate': 'screenshot_translate',
    'menu-snip': 'snip',
};

let contextMenuSetupPromise = Promise.resolve();

function showContextMenuFailureNotice(message) {
    const existing = document.getElementById('gemini-nexus-context-menu-error');
    if (existing) existing.remove();

    const notice = document.createElement('div');
    notice.id = 'gemini-nexus-context-menu-error';
    notice.textContent = message;
    Object.assign(notice.style, {
        position: 'fixed',
        top: '18px',
        right: '18px',
        zIndex: '2147483647',
        maxWidth: '320px',
        padding: '10px 12px',
        borderRadius: '8px',
        background: '#1f2937',
        color: '#ffffff',
        font: '13px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.28)',
    });

    document.documentElement.appendChild(notice);
    window.setTimeout(() => notice.remove(), 4200);
}

async function notifyContextMenuFailure(tabId) {
    if (!Number.isInteger(tabId)) return;
    await chrome.scripting
        .executeScript({
            target: { tabId },
            func: showContextMenuFailureNotice,
            args: ['Gemini Nexus 无法在当前页面启动，请刷新页面后重试。'],
        })
        .catch(() => {});
}

async function dispatchContextMenuAction(info, tab) {
    if (!tab?.id) return;

    const mode = MENU_MODES[info.menuItemId];
    if (!mode) return;

    const injection = await injectContentScriptsIntoTab(tab);
    if (injection.status === 'failed' || injection.status === 'skipped') {
        await notifyContextMenuFailure(tab.id);
        return;
    }

    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: 'CONTEXT_MENU_ACTION',
            mode,
        });
    } catch {
        await notifyContextMenuFailure(tab.id);
    }
}

function buildContextMenuItems() {
    const isZh = chrome.i18n.getUILanguage().startsWith('zh');

    const titles = {
        main: isZh ? 'Gemini Nexus' : 'Gemini Nexus',
        ask: isZh ? '快速提问' : 'Quick Ask',
        pageChat: isZh ? '与当前网页对话' : 'Chat with Page',
        readPage: isZh ? '朗读当前网页' : 'Read page aloud',
        readSelection: isZh ? '朗读选中内容' : 'Read selection aloud',
        ocr: isZh ? 'OCR (文字提取)' : 'OCR (Extract Text)',
        screenshotTranslate: isZh ? '截图翻译' : 'Screenshot Translate',
        snip: isZh ? '区域截图 (Snip)' : 'Snip (Capture Area)',
    };

    const parentMenu = {
        id: 'gemini-nexus-parent',
        title: titles.main,
        contexts: ['all'],
        documentUrlPatterns: WEB_PAGE_PATTERNS,
    };

    const childMenus = [
        {
            id: 'menu-ask',
            parentId: 'gemini-nexus-parent',
            title: titles.ask,
            contexts: ['all'],
            documentUrlPatterns: WEB_PAGE_PATTERNS,
        },
        {
            id: 'menu-page-chat',
            parentId: 'gemini-nexus-parent',
            title: titles.pageChat,
            contexts: ['all'],
            documentUrlPatterns: WEB_PAGE_PATTERNS,
        },
        {
            id: 'menu-read-page',
            parentId: 'gemini-nexus-parent',
            title: titles.readPage,
            contexts: ['all'],
            documentUrlPatterns: WEB_PAGE_PATTERNS,
        },
        {
            id: 'menu-read-selection',
            parentId: 'gemini-nexus-parent',
            title: titles.readSelection,
            contexts: ['selection'],
            documentUrlPatterns: WEB_PAGE_PATTERNS,
        },
        {
            id: 'menu-ocr',
            parentId: 'gemini-nexus-parent',
            title: titles.ocr,
            contexts: ['all'],
            documentUrlPatterns: WEB_PAGE_PATTERNS,
        },
        {
            id: 'menu-screenshot-translate',
            parentId: 'gemini-nexus-parent',
            title: titles.screenshotTranslate,
            contexts: ['all'],
            documentUrlPatterns: WEB_PAGE_PATTERNS,
        },
        {
            id: 'menu-snip',
            parentId: 'gemini-nexus-parent',
            title: titles.snip,
            contexts: ['all'],
            documentUrlPatterns: WEB_PAGE_PATTERNS,
        },
    ];

    return { parentMenu, childMenus };
}

function getRuntimeErrorMessage() {
    return chrome.runtime.lastError?.message || '';
}

function removeAllContextMenus() {
    return new Promise((resolve, reject) => {
        chrome.contextMenus.removeAll(() => {
            const message = getRuntimeErrorMessage();
            if (message) reject(new Error(message));
            else resolve();
        });
    });
}

function createContextMenu(item) {
    return new Promise((resolve, reject) => {
        chrome.contextMenus.create(item, () => {
            const message = getRuntimeErrorMessage();
            if (message) reject(new Error(message));
            else resolve();
        });
    });
}

async function createContextMenus() {
    const { parentMenu, childMenus } = buildContextMenuItems();

    await removeAllContextMenus();
    await createContextMenu(parentMenu);
    for (const item of childMenus) {
        await createContextMenu(item);
    }
}

function queueContextMenuSetup() {
    const setup = contextMenuSetupPromise.catch(() => {}).then(createContextMenus);
    contextMenuSetupPromise = setup;

    setup.catch((error) => {
        console.warn('Failed to create Gemini Nexus context menus:', error?.message || error);
    });

    return setup;
}

export function setupContextMenus() {
    const setup = queueContextMenuSetup();
    chrome.runtime.onInstalled?.addListener?.(queueContextMenuSetup);

    chrome.contextMenus.onClicked.addListener(dispatchContextMenuAction);
    return setup;
}
