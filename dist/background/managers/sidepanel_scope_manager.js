import { DEFAULT_SIDE_PANEL_SCOPE } from '../../shared/config/constants.js';

const DEFAULT_PANEL_PATH = 'sidepanel/index.html';

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
        if (this.isOpenForTab(tabId)) {
            await this.closeForTab(tabId);
            return { status: 'closed' };
        }

        await this.openForTab(tabId, windowId);
        return { status: 'opened' };
    }
}
