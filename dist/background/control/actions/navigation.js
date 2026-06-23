import { BaseActionHandler } from './base.js';
import { getTabUrl } from '../tabs.js';

function getTabLabel(tab) {
    return tab?.title || getTabUrl(tab) || 'Untitled';
}

export class NavigationActions extends BaseActionHandler {
    constructor(connection, snapshotManager, waitHelper, groupContext = {}) {
        super(connection, snapshotManager, waitHelper);
        this.groupContext = groupContext;
    }

    getControlledGroupId() {
        const groupId = this.groupContext.getControlledGroupId?.();
        return Number.isInteger(groupId) && groupId >= 0 ? groupId : null;
    }

    getScopedTabQuery() {
        const windowId = this.getControlledWindowId();
        const query = windowId === null ? { currentWindow: true } : { windowId };
        const groupId = this.getControlledGroupId();
        if (groupId !== null) query.groupId = groupId;
        return query;
    }

    async getScopedTabs() {
        return await chrome.tabs.query(this.getScopedTabQuery());
    }

    async addTabToControlledGroup(tabId) {
        const groupId = this.getControlledGroupId();
        if (groupId === null || !Number.isInteger(tabId) || !chrome.tabs?.group) return;
        try {
            await chrome.tabs.group({ groupId, tabIds: [tabId] });
        } catch {
            // A tab can close or move windows while it is being created; page control can continue.
        }
    }

    getControlledWindowId() {
        const windowId = this.groupContext.getControlledWindowId?.();
        return Number.isInteger(windowId) && windowId > 0 ? windowId : null;
    }

    async navigatePage({ url, type, ignoreCache = false } = {}) {
        // Use currentTabId (attached) or fallback to targetTabId (intent)
        const tabId = this.connection.targetTabId || this.connection.currentTabId;
        if (!tabId) return 'Error: No target tab identified.';

        const navigationType = type || (url ? 'url' : '');
        if (!['url', 'back', 'forward', 'reload'].includes(navigationType)) {
            return "Error: 'type' must be one of: url, back, forward, reload.";
        }
        if (navigationType === 'url' && (typeof url !== 'string' || !url.trim())) {
            return "Error: 'url' is required when type is 'url'.";
        }

        let action = '';
        const willNavigate = true;

        const waitResult = await this.waitHelper.execute(async () => {
            if (navigationType === 'back') {
                await chrome.tabs.goBack(tabId);
                action = 'Navigated back';
            } else if (navigationType === 'forward') {
                await chrome.tabs.goForward(tabId);
                action = 'Navigated forward';
            } else if (navigationType === 'reload') {
                await chrome.tabs.reload(tabId, { bypassCache: ignoreCache === true });
                action = ignoreCache === true ? 'Reloaded page bypassing cache' : 'Reloaded page';
            } else {
                const targetUrl = url.trim();
                await chrome.tabs.update(tabId, { url: targetUrl });
                action = `Navigating to ${targetUrl}`;
            }
        });

        if (willNavigate) {
            this.snapshotManager.reset?.();
        }

        if (!action) return 'Error: Invalid navigation arguments.';

        return waitResult?.navigatedToUrl
            ? `${action}. Current URL: ${waitResult.navigatedToUrl}`
            : action;
    }

    async newPage({ url, background = false }) {
        const targetUrl = url || 'about:blank';
        let tab;

        if (background) {
            // Use an unfocused popup to avoid throttling and visual interference.
            const popupWindow = await chrome.windows.create({
                url: targetUrl,
                type: 'popup',
                focused: false,
                width: 1280,
                height: 800,
            });
            tab = Array.isArray(popupWindow.tabs) ? popupWindow.tabs[0] : null;
        } else {
            const createOptions = { url: targetUrl };
            const windowId = this.getControlledWindowId();
            if (windowId !== null) createOptions.windowId = windowId;
            tab = await chrome.tabs.create(createOptions);
            await this.addTabToControlledGroup(tab.id);
        }

        if (!tab?.id) {
            return `Error: Created page did not return a tab id.`;
        }

        // Return object with metadata so ControlManager can update the locked tab
        return {
            output: `Created new page (id: ${tab.id}) loading ${targetUrl}`,
            _meta: {
                switchTabId: tab.id,
                allowOutsideControlledGroup: background === true,
            },
        };
    }

    async closePage({ index }) {
        if (index === undefined) return "Error: 'index' is required.";
        const tabs = await this.getScopedTabs();
        const tab = tabs[index];
        if (!tab) return `Error: Page index ${index} not found.`;
        if (!Number.isInteger(tab.id)) return `Error: Page index ${index} has no tab id.`;
        const targetTabId = this.connection.targetTabId || this.connection.currentTabId;
        const nextTab = tabs[index + 1] || tabs[index - 1] || null;

        await chrome.tabs.remove(tab.id);

        const output = `Closed page ${index}: ${getTabLabel(tab)}`;
        if (tab.id !== targetTabId) return output;

        return {
            output: nextTab
                ? `${output}. Selected page: ${getTabLabel(nextTab)}`
                : `${output}. No controlled pages remain.`,
            _meta: nextTab?.id ? { switchTabId: nextTab.id } : { clearTarget: true },
        };
    }

    async listPages() {
        const tabs = await this.getScopedTabs();
        const targetTabId = this.connection.targetTabId || this.connection.currentTabId;
        return tabs
            .map((tab, index) => {
                const selected = tab.id === targetTabId ? ' [selected]' : '';
                return `${index}: ${getTabLabel(tab)} (${getTabUrl(tab)})${selected}`;
            })
            .join('\n');
    }

    async selectPage({ index }) {
        const tabs = await this.getScopedTabs();
        const tab = tabs[index];
        if (!tab) return `Error: Index ${index} not found.`;

        // Return metadata so ControlManager can update the locked tab without forcing focus.
        return {
            output: `Selected page ${index}: ${getTabLabel(tab)}`,
            _meta: { switchTabId: tab.id },
        };
    }
}
