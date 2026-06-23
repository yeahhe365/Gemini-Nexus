import { debugLog } from '../../../shared/logging/debug.js';

export async function getActiveTabContent(specificTabId = null) {
    try {
        let tab;
        if (specificTabId) {
            try {
                tab = await chrome.tabs.get(specificTabId);
            } catch {
                return null;
            }
        } else {
            const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            tab = tabs[0];
        }

        if (!tab || !tab.id) return null;

        if (
            tab.url &&
            (tab.url.startsWith('chrome://') ||
                tab.url.startsWith('edge://') ||
                tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('about:') ||
                tab.url.startsWith('view-source:') ||
                tab.url.startsWith('https://chrome.google.com/webstore') ||
                tab.url.startsWith('https://chromewebstore.google.com'))
        ) {
            return null;
        }

        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'GET_PAGE_CONTENT' });
            return response ? response.content : null;
        } catch {
            debugLog('Content script unavailable, attempting fallback injection...');
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => (document.body ? document.body.innerText : ''),
                });
                return results?.[0]?.result || null;
            } catch (injectionError) {
                console.error('Fallback injection failed:', injectionError);
                return null;
            }
        }
    } catch (error) {
        console.error('Failed to get page context:', error);
        return null;
    }
}
