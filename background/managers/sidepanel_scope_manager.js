import { DEFAULT_SIDE_PANEL_SCOPE } from '../../shared/config/constants.js';

const DEFAULT_PANEL_PATH = 'sidepanel/index.html';

function getFirefoxSidebarAction() {
    const sidebarAction = globalThis.browser?.sidebarAction;
    if (!sidebarAction || typeof sidebarAction.toggle !== 'function') return null;
    return sidebarAction;
}

export function getPanelPathForTab(tabId) {
    const normalizedTabId = Number(tabId);
    if (!Number.isInteger(normalizedTabId) || normalizedTabId <= 0) {
        return DEFAULT_PANEL_PATH;
    }

    return `${DEFAULT_PANEL_PATH}?tabId=${normalizedTabId}`;
}

export class SidePanelScopeManager {
    constructor() {
        this.scope = DEFAULT_SIDE_PANEL_SCOPE;
        this.enabledTabs = {};
        this.openTabs = {};
    }

    init() {
        (async () => {
            const [localState, sessionState] = await Promise.all([
                chrome.storage.local.get(['geminiSidePanelScope', 'geminiSidePanelEnabledTabs']),
                chrome.storage.session.get(['geminiSidePanelEnabledTabs']),
            ]);

            const normalizedScope = this.normalizeScope(localState.geminiSidePanelScope);
            this.scope = normalizedScope;
            this.enabledTabs = this.normalizeEnabledTabs(sessionState.geminiSidePanelEnabledTabs);

            if (localState.geminiSidePanelScope !== normalizedScope) {
                await chrome.storage.local.set({ geminiSidePanelScope: normalizedScope });
            }

            if (localState.geminiSidePanelEnabledTabs) {
                await chrome.storage.local.remove('geminiSidePanelEnabledTabs');
            }

            await this.refreshDefaultOptions();
            await this.refreshAllTabs();
        })().catch((error) => {
            console.warn('[SidePanelScopeManager] Failed to initialize scope state:', error);
        });

        chrome.storage.onChanged.addListener((changes, areaName) => {
            let needsRefresh = false;

            if (areaName === 'local' && changes.geminiSidePanelScope) {
                const normalizedScope = this.normalizeScope(changes.geminiSidePanelScope.newValue);
                if (changes.geminiSidePanelScope.newValue !== normalizedScope) {
                    chrome.storage.local
                        .set({ geminiSidePanelScope: normalizedScope })
                        .catch((error) => {
                            console.warn(
                                '[SidePanelScopeManager] Failed to migrate legacy scope:',
                                error
                            );
                        });
                }
                this.scope = normalizedScope;
                needsRefresh = true;
            }

            if (areaName === 'session' && changes.geminiSidePanelEnabledTabs) {
                this.enabledTabs = this.normalizeEnabledTabs(
                    changes.geminiSidePanelEnabledTabs.newValue
                );
                needsRefresh = true;
            }

            if (needsRefresh) {
                this.refreshDefaultOptions()
                    .then(() => this.refreshAllTabs())
                    .catch((error) =>
                        console.warn(
                            '[SidePanelScopeManager] Failed to refresh scope state:',
                            error
                        )
                    );
            }
        });

        chrome.tabs.onRemoved.addListener((tabId) => {
            this.markClosedForTab(tabId);

            if (this.enabledTabs[tabId]) {
                delete this.enabledTabs[tabId];
                this.persistEnabledTabs().catch((error) => {
                    console.warn(
                        '[SidePanelScopeManager] Failed to persist removed tab state:',
                        error
                    );
                });
            }
        });
    }

    normalizeScope(scope) {
        if (scope === 'global' || scope === DEFAULT_SIDE_PANEL_SCOPE) {
            return scope;
        }
        return DEFAULT_SIDE_PANEL_SCOPE;
    }

    normalizeEnabledTabs(value) {
        if (!value || typeof value !== 'object') return {};

        const normalized = {};
        for (const [key, enabled] of Object.entries(value)) {
            if (enabled !== true) continue;
            const tabId = Number(key);
            if (Number.isInteger(tabId) && tabId > 0) {
                normalized[tabId] = true;
            }
        }
        return normalized;
    }

    async persistEnabledTabs() {
        await chrome.storage.session.set({ geminiSidePanelEnabledTabs: this.enabledTabs });
    }

    async refreshAllTabs() {
        const tabs = await chrome.tabs.query({});
        await Promise.all(tabs.map((tab) => this.applyToTab(tab.id)));
    }

    async refreshDefaultOptions() {
        await chrome.sidePanel.setOptions({
            path: DEFAULT_PANEL_PATH,
            enabled: this.scope === 'global',
        });
    }

    isEnabledForTab(tabId) {
        if (!tabId) return false;
        if (this.scope === 'global') return true;
        return this.enabledTabs[tabId] === true;
    }

    isOpenForTab(tabId) {
        return this.openTabs[tabId] === true;
    }

    markOpenForTab(tabId) {
        if (!tabId) return;
        this.openTabs[tabId] = true;
    }

    markClosedForTab(tabId) {
        if (!tabId) return;
        delete this.openTabs[tabId];
    }

    async applyToTab(tabId) {
        if (!tabId) return;

        const enabled = this.isEnabledForTab(tabId);
        await chrome.sidePanel.setOptions({
            tabId,
            path: getPanelPathForTab(tabId),
            enabled,
        });
    }

    async openAfterSetup(openOptions, setupPromises) {
        let immediateOpenError = null;
        const immediateOpenPromise = chrome.sidePanel.open(openOptions).catch((error) => {
            immediateOpenError = error;
        });

        await Promise.all([...setupPromises, immediateOpenPromise]);

        if (!immediateOpenError) return;

        console.warn(
            '[SidePanelScopeManager] Retrying side panel open after options settled:',
            immediateOpenError
        );
        await chrome.sidePanel.open(openOptions);
    }

    async openForTab(tabId, windowId) {
        if (!tabId || !windowId) return;

        if (this.scope === DEFAULT_SIDE_PANEL_SCOPE) {
            const disableDefaultPromise = chrome.sidePanel
                .setOptions({
                    path: DEFAULT_PANEL_PATH,
                    enabled: false,
                })
                .catch(() => {});

            const enableTabPromise = chrome.sidePanel
                .setOptions({
                    tabId,
                    path: getPanelPathForTab(tabId),
                    enabled: true,
                })
                .catch((error) => {
                    console.warn(
                        '[SidePanelScopeManager] Failed to enable remembered side panel:',
                        error
                    );
                    throw error;
                });

            let persistPromise = Promise.resolve();
            if (!this.enabledTabs[tabId]) {
                this.enabledTabs[tabId] = true;
                persistPromise = this.persistEnabledTabs().catch((error) => {
                    console.warn(
                        '[SidePanelScopeManager] Failed to persist remembered tab state:',
                        error
                    );
                });
            }

            await this.openAfterSetup({ tabId, windowId }, [
                disableDefaultPromise,
                enableTabPromise,
                persistPromise,
            ]);
        } else {
            const defaultOptionsPromise = Promise.all([
                this.refreshDefaultOptions(),
                chrome.sidePanel.setOptions({
                    tabId,
                    path: getPanelPathForTab(tabId),
                    enabled: true,
                }),
            ]);
            await this.openAfterSetup({ tabId, windowId }, [defaultOptionsPromise]);
        }

        this.markOpenForTab(tabId);
    }

    async closeForTab(tabId) {
        if (!tabId) return;

        this.markClosedForTab(tabId);

        try {
            await chrome.sidePanel.setOptions({ tabId, enabled: false });
            setTimeout(() => {
                chrome.sidePanel
                    .setOptions({
                        tabId,
                        path: getPanelPathForTab(tabId),
                        enabled: this.isEnabledForTab(tabId),
                    })
                    .catch((error) => {
                        console.warn(
                            '[SidePanelScopeManager] Failed to restore side panel options:',
                            error
                        );
                    });
            }, 250);
        } catch (error) {
            console.error('Failed to close side panel:', error);
            throw error;
        }
    }

    async toggleForTab(tabId, windowId) {
        const sidebarAction = getFirefoxSidebarAction();
        if (sidebarAction) {
            return this.toggleFirefoxSidebar(tabId, windowId, sidebarAction);
        }

        if (this.isOpenForTab(tabId)) {
            await this.closeForTab(tabId);
            return { status: 'closed' };
        }

        await this.openForTab(tabId, windowId);
        return { status: 'opened' };
    }

    async isFirefoxSidebarOpen(sidebarAction, windowId) {
        if (typeof sidebarAction.isOpen !== 'function') return null;
        try {
            return await sidebarAction.isOpen(Number.isInteger(windowId) ? { windowId } : {});
        } catch (error) {
            console.warn('[SidePanelScopeManager] Failed to read Firefox sidebar state:', error);
            return null;
        }
    }

    async rememberEnabledTab(tabId) {
        if (!tabId || this.scope !== DEFAULT_SIDE_PANEL_SCOPE || this.enabledTabs[tabId]) return;
        this.enabledTabs[tabId] = true;
        try {
            await this.persistEnabledTabs();
        } catch (error) {
            console.warn('[SidePanelScopeManager] Failed to persist remembered tab state:', error);
        }
    }

    /**
     * Firefox does not open the sidebar from the toolbar button, and
     * `sidebarAction.toggle()` is the call that both opens and closes it.
     * It must run synchronously inside the action click: awaiting first drops
     * the user gesture, and `open()` / `close()` / `toggle()` reject any
     * arguments. In-memory `openTabs` also stays set when the user closes the
     * sidebar with its own button, so trusting it makes the next click try to
     * close an already-closed sidebar.
     */
    toggleFirefoxSidebar(tabId, windowId, sidebarAction) {
        const path = getPanelPathForTab(tabId);
        if (typeof sidebarAction.setPanel === 'function') {
            try {
                Promise.resolve(sidebarAction.setPanel({ panel: path, tabId })).catch((error) => {
                    console.warn(
                        '[SidePanelScopeManager] Failed to set Firefox sidebar panel:',
                        error
                    );
                });
            } catch (error) {
                console.warn('[SidePanelScopeManager] Failed to set Firefox sidebar panel:', error);
            }
        }

        let toggleResult;
        try {
            toggleResult = sidebarAction.toggle();
        } catch (error) {
            return Promise.reject(error);
        }

        return Promise.resolve(toggleResult).then(async () => {
            const opened = await this.isFirefoxSidebarOpen(sidebarAction, windowId);
            if (opened === true) {
                await this.rememberEnabledTab(tabId);
                this.markOpenForTab(tabId);
                return { status: 'opened' };
            }

            if (opened === false) {
                this.markClosedForTab(tabId);
                return { status: 'closed' };
            }

            if (this.isOpenForTab(tabId)) {
                this.markClosedForTab(tabId);
                return { status: 'closed' };
            }
            this.markOpenForTab(tabId);
            return { status: 'opened' };
        });
    }
}
