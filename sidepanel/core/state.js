import { CONNECTION_STORAGE_KEYS } from '../../shared/settings/connection.js';
import {
    getSidePanelInputDraftKey,
    normalizeSidePanelInputDrafts,
} from './bridge_storage.js';
import {
    createInitialRestoreMessages,
    createLocalStorageRestoreMessages,
} from './state_messages.js';

export function getOwnerTabIdFromLocation(locationLike = window.location) {
    try {
        const url = new URL(locationLike.href);
        const tabId = Number.parseInt(url.searchParams.get('tabId'), 10);
        return Number.isInteger(tabId) && tabId > 0 ? tabId : null;
    } catch {
        return null;
    }
}

export function isStandalonePageFromLocation(locationLike = window.location) {
    try {
        const url = new URL(locationLike.href);
        return url.searchParams.get('standalone') === '1';
    } catch {
        return false;
    }
}

export function isExtensionHostPageTab(tab) {
    if (!tab || typeof tab.url !== 'string') return false;

    try {
        const url = new URL(tab.url);
        if (url.protocol !== 'chrome-extension:') return false;

        const path = url.pathname.replace(/^\/+/, '');
        return (
            path === 'sidepanel/index.html' ||
            path === 'sandbox/index.html' ||
            path === 'settings/index.html'
        );
    } catch {
        return false;
    }
}

export function getContextTabFromTabs(tabs, fallback = null) {
    if (!Array.isArray(tabs)) return fallback;

    const pageTabs = tabs.filter((tab) => tab && !isExtensionHostPageTab(tab));
    const activeTab = pageTabs.find((tab) => tab.active === true);
    if (activeTab) return activeTab;

    return (
        pageTabs
            .slice()
            .sort((left, right) => (right.lastAccessed || 0) - (left.lastAccessed || 0))[0] ||
        fallback
    );
}

function cacheSidebarExpandedPreference(isExpanded) {
    localStorage.setItem('geminiSidebarExpanded', isExpanded === false ? 'false' : 'true');
}

function getRuntimeLastErrorMessage() {
    return chrome.runtime?.lastError?.message || null;
}

function logStorageWriteError(error) {
    console.warn('Failed to save side panel state:', error?.message || error);
}

function safeSetStorage(storageArea, update) {
    try {
        const writeResult = storageArea.set(update);
        writeResult?.catch?.(logStorageWriteError);
    } catch (error) {
        logStorageWriteError(error);
    }
}

function safeRemoveStorage(storageArea, keys) {
    try {
        const writeResult = storageArea.remove(keys);
        writeResult?.catch?.(logStorageWriteError);
    } catch (error) {
        logStorageWriteError(error);
    }
}

function applyLocalPreferenceSideEffects(key, value) {
    if (key === 'geminiTheme') localStorage.setItem('geminiTheme', value);
    if (key === 'geminiLanguage') localStorage.setItem('geminiLanguage', value);
    if (key === 'geminiSidebarExpanded') cacheSidebarExpandedPreference(value);
}

export class StateManager {
    constructor(frameManager) {
        this.frame = frameManager;
        this.localStorageData = null;
        this.sessionStorageData = null;
        this.ownerTabId = getOwnerTabIdFromLocation();
        this.isStandalonePage = isStandalonePageFromLocation();
        this.hostTabId = null;
        this.currentTabId = this.ownerTabId ?? (this.isStandalonePage ? null : undefined);
        this.uiIsReady = false;
        this.hasInitialized = false;
    }

    init() {
        chrome.storage.local.get(
            [
                'geminiSessions',
                'geminiGroups',
                'pendingSessionId',
                'pendingMode',
                'geminiShortcuts',
                'pendingImage',
                'geminiSidebarBehavior',
                'geminiSidebarExpanded',
                'geminiSidePanelScope',
                'geminiTextSelectionEnabled',
                'geminiTextSelectionBlacklist',
                'geminiImageToolsEnabled',
                'geminiGeneratedImageWatermarkRemovalEnabled',
                'geminiAccountIndices',
                ...CONNECTION_STORAGE_KEYS,
                'geminiContextMode',
                'geminiContextRecentTurns',
            ],
            (result) => {
                const errorMessage = getRuntimeLastErrorMessage();
                if (errorMessage) {
                    console.warn('Failed to load side panel local state:', errorMessage);
                    this.localStorageData = {};
                } else {
                    this.localStorageData = result || {};
                }
                this.trySendInitData();
            }
        );

        chrome.storage.session.get(['geminiSidePanelSessionBindings', 'geminiSidePanelInputDrafts'], (result) => {
            const errorMessage = getRuntimeLastErrorMessage();
            if (errorMessage) {
                console.warn('Failed to load side panel session state:', errorMessage);
                this.sessionStorageData = {
                    geminiSidePanelSessionBindings: {},
                    geminiSidePanelInputDrafts: {},
                };
            } else {
                this.sessionStorageData = {
                    ...(result || {}),
                    geminiSidePanelSessionBindings:
                        result?.geminiSidePanelSessionBindings || {},
                    geminiSidePanelInputDrafts: normalizeSidePanelInputDrafts(
                        result?.geminiSidePanelInputDrafts
                    ),
                };
            }
            this.trySendInitData();
        });

        if (chrome.tabs && typeof chrome.tabs.getCurrent === 'function') {
            chrome.tabs.getCurrent((tab) => {
                if (chrome.runtime?.lastError) return;
                if (Number.isInteger(tab?.id) && tab.id > 0) {
                    this.hostTabId = tab.id;
                }
            });
        }

        if (this.hasFixedTabContext() || this.isStandalonePage) {
            this.trySendInitData();
        } else {
            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                const errorMessage = getRuntimeLastErrorMessage();
                if (errorMessage) {
                    console.warn('Failed to resolve active side panel tab:', errorMessage);
                    this.currentTabId = null;
                } else {
                    const tab = getContextTabFromTabs(tabs);
                    this.currentTabId = this.getContextTabId(tab, null);
                }
                this.trySendInitData();
            });
        }

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'session') {
                if (changes.geminiSidePanelSessionBindings || changes.geminiSidePanelInputDrafts) {
                    this.sessionStorageData = {
                        ...(this.sessionStorageData || {}),
                        geminiSidePanelSessionBindings:
                            changes.geminiSidePanelSessionBindings?.newValue ||
                            this.sessionStorageData?.geminiSidePanelSessionBindings ||
                            {},
                        geminiSidePanelInputDrafts: normalizeSidePanelInputDrafts(
                            changes.geminiSidePanelInputDrafts?.newValue ||
                                this.sessionStorageData?.geminiSidePanelInputDrafts
                        ),
                    };
                    if (changes.geminiSidePanelSessionBindings) this.postCurrentTabContext();
                }
                return;
            }

            if (areaName === 'local') {
                this.syncLocalStorageChanges(changes);
            }
        });

        chrome.tabs.onActivated.addListener(({ tabId }) => {
            if (this.hasFixedTabContext()) return;
            if (this.isStandalonePage) return;

            this.updateCurrentTabFromActivatedTab(tabId);
        });

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (this.currentTabId !== tabId) return;
            if (!changeInfo?.url && !tab?.url && !changeInfo?.title && !tab?.title) return;

            this.postTabContextMessage(tab);
        });

        chrome.tabs.onRemoved.addListener((tabId) => {
            this.removeSessionBinding(tabId);

            if (this.ownerTabId === tabId) {
                this.currentTabId = null;
                this.postCurrentTabContext();
                return;
            }

            if (this.hasFixedTabContext()) return;
            if (this.isStandalonePage) return;

            if (this.currentTabId === tabId) {
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    if (getRuntimeLastErrorMessage()) {
                        this.currentTabId = null;
                    } else {
                        const tab = getContextTabFromTabs(tabs);
                        this.currentTabId = this.getContextTabId(tab, null);
                    }
                    this.postCurrentTabContext();
                });
            }
        });

        setTimeout(() => {
            if (!this.uiIsReady) {
                console.warn('UI_READY signal timeout, forcing skeleton removal');
                this.frame.reveal();
            }
        }, 1000);
    }

    markUiReady() {
        this.uiIsReady = true;
        this.trySendInitData();
    }

    trySendInitData() {
        if (this.hasInitialized) return;
        if (
            !this.uiIsReady ||
            !this.localStorageData ||
            this.sessionStorageData === null ||
            this.currentTabId === undefined
        )
            return;

        const frameWindow = this.frame.getWindow();
        if (!frameWindow) return;

        this.hasInitialized = true;
        this.frame.reveal();

        const restoreMessages = createInitialRestoreMessages(this.localStorageData, {
            theme: localStorage.getItem('geminiTheme') || 'system',
            language: localStorage.getItem('geminiLanguage') || 'system',
            appVersion: `v${chrome.runtime.getManifest().version}`,
        });
        cacheSidebarExpandedPreference(this.localStorageData.geminiSidebarExpanded);

        restoreMessages.beforeTabContext.forEach((message) => this.frame.postMessage(message));
        this.postCurrentTabContext();
        restoreMessages.afterTabContext.forEach((message) => this.frame.postMessage(message));

        this.replayPendingSidePanelActions();

        restoreMessages.afterPendingActions.forEach((message) => this.frame.postMessage(message));
    }

    replayPendingSidePanelActions() {
        if (!this.localStorageData) return;

        if (this.localStorageData.pendingSessionId) {
            this.frame.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: {
                    action: 'SWITCH_SESSION',
                    sessionId: this.localStorageData.pendingSessionId,
                },
            });
            safeRemoveStorage(chrome.storage.local, 'pendingSessionId');
            delete this.localStorageData.pendingSessionId;
        }

        if (this.localStorageData.pendingImage) {
            this.frame.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: this.localStorageData.pendingImage,
            });
            safeRemoveStorage(chrome.storage.local, 'pendingImage');
            delete this.localStorageData.pendingImage;
        }

        if (this.localStorageData.pendingMode === 'browser_control') {
            this.frame.postMessage({
                action: 'BACKGROUND_MESSAGE',
                payload: { action: 'ACTIVATE_BROWSER_CONTROL' },
            });
            safeRemoveStorage(chrome.storage.local, 'pendingMode');
            delete this.localStorageData.pendingMode;
        }
    }

    syncLocalStorageChanges(changes) {
        if (!this.localStorageData) return;

        const changedKeys = Object.keys(changes);
        for (const key of changedKeys) {
            const newValue = changes[key].newValue;
            if (newValue === undefined) delete this.localStorageData[key];
            else this.localStorageData[key] = newValue;
        }

        if (!this.hasInitialized) return;

        if (Object.prototype.hasOwnProperty.call(changes, 'geminiTheme')) {
            localStorage.setItem('geminiTheme', this.localStorageData.geminiTheme || 'system');
        }
        if (Object.prototype.hasOwnProperty.call(changes, 'geminiLanguage')) {
            localStorage.setItem(
                'geminiLanguage',
                this.localStorageData.geminiLanguage || 'system'
            );
        }
        if (Object.prototype.hasOwnProperty.call(changes, 'geminiSidebarExpanded')) {
            cacheSidebarExpandedPreference(this.localStorageData.geminiSidebarExpanded);
        }

        this.replayPendingSidePanelActions();

        createLocalStorageRestoreMessages(this.localStorageData, changedKeys).forEach((message) =>
            this.frame.postMessage(message)
        );
    }

    updateSessions(sessions) {
        if (this.localStorageData) this.localStorageData.geminiSessions = sessions;
    }

    save(key, value) {
        if (this.localStorageData) this.localStorageData[key] = value;

        const update = {};
        update[key] = value;
        safeSetStorage(chrome.storage.local, update);
        applyLocalPreferenceSideEffects(key, value);
    }

    saveMany(update) {
        if (!update || typeof update !== 'object' || Array.isArray(update)) return;

        for (const [key, value] of Object.entries(update)) {
            if (this.localStorageData) this.localStorageData[key] = value;
            applyLocalPreferenceSideEffects(key, value);
        }
        safeSetStorage(chrome.storage.local, update);
    }

    getCurrentTabId() {
        return this.currentTabId;
    }

    setHostTabId(tabId) {
        this.hostTabId = Number.isInteger(tabId) && tabId > 0 ? tabId : null;
    }

    getMessageTargetTabId() {
        return this.currentTabId || this.hostTabId;
    }

    getContextTabId(tab, fallback = null) {
        if (!tab || isExtensionHostPageTab(tab)) return fallback;
        return Number.isInteger(tab.id) && tab.id > 0 ? tab.id : fallback;
    }

    updateCurrentTabFromActivatedTab(tabId) {
        if (!Number.isInteger(tabId) || tabId <= 0) {
            this.currentTabId = null;
            this.postCurrentTabContext();
            return;
        }

        if (!chrome.tabs || typeof chrome.tabs.get !== 'function') {
            this.currentTabId = tabId;
            this.postCurrentTabContext();
            return;
        }

        try {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime?.lastError) return;
                const nextTabId = this.getContextTabId(tab, this.currentTabId ?? null);
                if (nextTabId === this.currentTabId) return;

                this.currentTabId = nextTabId;
                this.postCurrentTabContext();
            });
        } catch {
            this.currentTabId = tabId;
            this.postCurrentTabContext();
        }
    }

    hasFixedTabContext() {
        return Number.isInteger(this.ownerTabId) && this.ownerTabId > 0;
    }

    getSessionBindings() {
        return this.sessionStorageData?.geminiSidePanelSessionBindings || {};
    }

    getInputDraft(tabId, sessionId) {
        const key = getSidePanelInputDraftKey(tabId, sessionId);
        if (!key) return '';
        const drafts = normalizeSidePanelInputDrafts(
            this.sessionStorageData?.geminiSidePanelInputDrafts
        );
        return typeof drafts[key] === 'string' ? drafts[key] : '';
    }

    postTabContextMessage(tab = null) {
        if (!this.hasInitialized) return;
        if (!this.frame.getWindow()) return;

        const sessionBindings = this.getSessionBindings();
        const boundSessionId = this.currentTabId
            ? sessionBindings[this.currentTabId] || null
            : null;
        const tabMatchesCurrent = tab && tab.id === this.currentTabId;
        const draft = this.getInputDraft(this.currentTabId, boundSessionId);

        this.frame.postMessage({
            action: 'RESTORE_SIDE_PANEL_TAB_CONTEXT',
            payload: {
                tabId: this.currentTabId,
                sessionId: boundSessionId,
                draft,
                url: tabMatchesCurrent ? tab.url || '' : '',
                title: tabMatchesCurrent ? tab.title || '' : '',
            },
        });
    }

    postCurrentTabContext() {
        this.postTabContextMessage();
        this.postCurrentTabDetails();
    }

    postCurrentTabDetails() {
        if (!Number.isInteger(this.currentTabId) || this.currentTabId <= 0) return;
        if (!chrome.tabs || typeof chrome.tabs.get !== 'function') return;

        const tabId = this.currentTabId;
        try {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime?.lastError || !tab) return;
                if (this.currentTabId !== tabId) return;

                this.postTabContextMessage(tab);
            });
        } catch {
            // Some extension pages or browser states can reject tab detail lookup.
        }
    }

    removeSessionBinding(tabId) {
        if (!Number.isInteger(tabId) || tabId <= 0) return;

        const sessionBindings = this.getSessionBindings();
        if (!Object.prototype.hasOwnProperty.call(sessionBindings, tabId)) return;

        const nextBindings = { ...sessionBindings };
        delete nextBindings[tabId];
        this.sessionStorageData = { geminiSidePanelSessionBindings: nextBindings };
        safeSetStorage(chrome.storage.session, { geminiSidePanelSessionBindings: nextBindings });
    }
}
