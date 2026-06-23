import { t } from '../core/i18n.js';
import * as collapsedRecent from './sidebar_collapsed_recent.js';
import { categorizeSessionsByDate, partitionSessionsByGroup } from './sidebar_grouping.js';
import * as sidebarMenus from './sidebar_menus.js';
import * as sidebarRendering from './sidebar_rendering.js';
import * as titleEdit from './sidebar_title_edit.js';
import {
    requestSidebarExpandedFromStorage,
    saveSidebarExpandedToStorage,
} from '../../shared/messaging/index.js';

function readInitialSidebarExpandedFromUrl(locationLike = window.location) {
    try {
        const url = new URL(locationLike.href);
        const value = url.searchParams.get('sidebarExpanded');
        if (value === 'true') return true;
        if (value === 'false') return false;
    } catch {
        return null;
    }

    return null;
}

export class SidebarController {
    constructor(elements, callbacks) {
        this.sidebar = elements.sidebar;
        this.overlay = elements.sidebarOverlay;
        this.listEl = elements.historyListEl;
        this.toggleBtn = elements.historyToggleBtn;
        this.closeBtn = elements.closeSidebarBtn;
        this.brandToggleBtn = document.getElementById('sidebar-brand-toggle');

        this.searchContainer = document.querySelector('.search-container');
        this.searchInput = document.getElementById('history-search');
        this.searchToggleBtn = document.getElementById('sidebar-search-toggle');
        this.searchClearBtn = document.getElementById('history-search-clear');
        this.sidebarHistory = document.querySelector('.sidebar-history');
        this.collapsedRail = document.querySelector('.collapsed-sidebar-rail');
        this.collapsedToggleBtn = document.getElementById('collapsed-sidebar-toggle');
        this.collapsedSearchBtn = document.getElementById('collapsed-search-btn');
        this.collapsedRecentBtn = document.getElementById('collapsed-recent-chats-btn');
        this.collapsedRecentPopover = document.getElementById('collapsed-recent-popover');

        this.callbacks = callbacks || {};

        this.allSessions = [];
        this.allGroups = [];
        this.currentSessionId = null;
        this.itemCallbacks = null;
        this.renderState = { isGenerating: false, generatingSessionId: null, generatingSessionIds: [] };
        this.searchOpen = this.searchContainer ? !this.searchContainer.hidden : false;
        this.activeMenuId = null;
        this.activeMenuType = null;
        this.editingSessionId = null;
        this.editingSessionTitle = '';
        this.editingGroupId = null;
        this.editingGroupTitle = '';
        this.dragOverGroupId = null;
        this.isCollapsedRecentOpen = false;
        this.collapsedRecentPinned = false;
        this.collapsedRecentCloseTimer = null;
        this.restoredSidebarExpanded = readInitialSidebarExpandedFromUrl();

        this.portalCollapsedRecentPopover();
        this.initListeners();
        this.restorePersistedWideSidebarState();
        requestSidebarExpandedFromStorage();
    }

    portalCollapsedRecentPopover() {
        if (
            !this.collapsedRecentPopover ||
            this.collapsedRecentPopover.parentElement === document.body
        ) {
            return;
        }

        document.body.appendChild(this.collapsedRecentPopover);
    }

    initListeners() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.toggle());
        }
        if (this.brandToggleBtn) {
            this.brandToggleBtn.addEventListener('click', () => this.close());
        }
        if (this.collapsedToggleBtn) {
            this.collapsedToggleBtn.addEventListener('click', () => this.toggle());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.close();
                if (this.callbacks.onOverlayClick) {
                    this.callbacks.onOverlayClick();
                }
            });
        }
        if (this.sidebarHistory) {
            this.sidebarHistory.addEventListener('click', (clickEvent) =>
                this.handleExpandedEmptySpaceClick(clickEvent)
            );
        }
        if (this.collapsedRail) {
            this.collapsedRail.addEventListener('click', (clickEvent) =>
                this.handleCollapsedRailEmptySpaceClick(clickEvent)
            );
        }
        if (this.searchToggleBtn) {
            this.searchToggleBtn.addEventListener('click', () => this.openSearch());
        }
        if (this.collapsedSearchBtn) {
            this.collapsedSearchBtn.addEventListener('click', () => this.openSearch());
        }
        if (this.collapsedRecentBtn) {
            this.collapsedRecentBtn.addEventListener('click', (clickEvent) => {
                clickEvent.stopPropagation();
                this.toggleCollapsedRecentPopover();
            });
            this.collapsedRecentBtn.addEventListener('mouseenter', () =>
                this.openCollapsedRecentPopover()
            );
            this.collapsedRecentBtn.addEventListener('mouseleave', () =>
                this.scheduleCollapsedRecentClose()
            );
            this.collapsedRecentBtn.addEventListener('focus', () =>
                this.openCollapsedRecentPopover()
            );
            this.collapsedRecentBtn.addEventListener('blur', () =>
                this.scheduleCollapsedRecentClose()
            );
        }
        if (this.collapsedRecentPopover) {
            this.collapsedRecentPopover.addEventListener('mouseenter', () =>
                this.clearCollapsedRecentCloseTimer()
            );
            this.collapsedRecentPopover.addEventListener('mouseleave', () =>
                this.scheduleCollapsedRecentClose()
            );
        }
        if (this.searchClearBtn) {
            this.searchClearBtn.addEventListener('click', () => this.clearSearch());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (inputEvent) =>
                this.handleSearch(inputEvent.target.value)
            );
            this.searchInput.addEventListener('keydown', (keyboardEvent) => {
                if (keyboardEvent.key !== 'Escape') return;

                if (this.searchInput.value.trim()) {
                    this.clearSearch();
                } else {
                    this.closeSearch();
                }
            });
        }

        document.addEventListener('click', (clickEvent) => this.handleDocumentClick(clickEvent));
        document.addEventListener('keydown', (keyboardEvent) =>
            this.handleDocumentKeydown(keyboardEvent)
        );
        window.addEventListener('resize', () => this.positionCollapsedRecentPopover());
        window.addEventListener('scroll', () => this.positionCollapsedRecentPopover(), true);
    }

    _isWideLayout() {
        return document.body.classList.contains('layout-wide');
    }

    handleExpandedEmptySpaceClick(clickEvent) {
        const target = clickEvent.target;
        const clickedHistoryShell = target === clickEvent.currentTarget;
        const clickedHistoryListBlank = target === this.listEl;

        if (!clickedHistoryShell && !clickedHistoryListBlank) return;

        this.toggle();
    }

    handleCollapsedRailEmptySpaceClick(clickEvent) {
        const target = clickEvent.target;
        const clickedRailShell = target === clickEvent.currentTarget;
        const clickedRailBlankChild =
            target instanceof Element &&
            Boolean(target.closest('.collapsed-sidebar-spacer, .collapsed-sidebar-separator'));

        if (!clickedRailShell && !clickedRailBlankChild) return;

        this.toggle();
    }

    handleDocumentClick(clickEvent) {
        const target = clickEvent.target;

        if (
            this.activeMenuId &&
            target instanceof Node &&
            !target.closest?.('.history-item-menu') &&
            !target.closest?.('.history-menu-trigger')
        ) {
            this.closeItemMenu();
        }

        if (
            this.isCollapsedRecentOpen &&
            target instanceof Node &&
            !this.collapsedRecentPopover?.contains(target) &&
            !this.collapsedRecentBtn?.contains(target)
        ) {
            this.closeCollapsedRecentPopover();
        }
    }

    handleDocumentKeydown(keyboardEvent) {
        if (keyboardEvent.key !== 'Escape') return;

        this.closeItemMenu();
        this.closeCollapsedRecentPopover();
    }

    _setMobileSidebarState(isOpen) {
        if (!this.sidebar) return;

        this.sidebar.classList.toggle('open', isOpen);
        document.body.classList.toggle('sidebar-open', isOpen);
        if (this.overlay) {
            this.overlay.classList.toggle('visible', isOpen);
        }

        if (!isOpen) {
            this.closeSearch();
            this.closeItemMenu();
            this.closeCollapsedRecentPopover();
        }
    }

    _setWideSidebarCollapsed(isCollapsed, { persist = true } = {}) {
        if (!this.sidebar) return;

        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        this.sidebar.classList.toggle('collapsed', isCollapsed);
        this.sidebar.classList.toggle('open', !isCollapsed);

        if (persist) {
            this.restoredSidebarExpanded = !isCollapsed;
            saveSidebarExpandedToStorage(!isCollapsed);
        }

        if (isCollapsed) {
            this.closeSearch();
        }

        this.closeItemMenu();
        this.closeCollapsedRecentPopover();
    }

    restoreSidebarExpanded(isExpanded) {
        if (typeof isExpanded !== 'boolean') return;

        this.restoredSidebarExpanded = isExpanded;

        if (!this.sidebar || !this._isWideLayout()) return;

        this._setWideSidebarCollapsed(!isExpanded, { persist: false });
    }

    restorePersistedWideSidebarState() {
        if (this.restoredSidebarExpanded === null) return;

        this.restoreSidebarExpanded(this.restoredSidebarExpanded);
    }

    handleLayoutModeChange(isWide) {
        if (!this.sidebar) return;

        if (isWide) {
            this.restorePersistedWideSidebarState();
            return;
        }

        document.body.classList.remove('sidebar-collapsed');
        this.sidebar.classList.remove('collapsed');
        this._setMobileSidebarState(false);
    }

    toggle() {
        if (!this.sidebar) return;

        if (this._isWideLayout()) {
            const willCollapse = !document.body.classList.contains('sidebar-collapsed');
            this._setWideSidebarCollapsed(willCollapse);
            return;
        }

        const willOpen = !this.sidebar.classList.contains('open');
        this._setMobileSidebarState(willOpen);
    }

    close() {
        if (!this.sidebar) return;

        if (this._isWideLayout()) {
            this._setWideSidebarCollapsed(true);
            return;
        }

        this._setMobileSidebarState(false);
    }

    openSearch() {
        if (!this.searchContainer || !this.searchInput || !this.searchToggleBtn) return;

        this.closeItemMenu();
        this.closeCollapsedRecentPopover();

        if (this._isWideLayout() && document.body.classList.contains('sidebar-collapsed')) {
            this._setWideSidebarCollapsed(false);
        }

        this.searchContainer.hidden = false;
        this.searchToggleBtn.hidden = true;
        this.searchOpen = true;
        document.body.classList.add('sidebar-search-open');
        this.searchInput.focus({ preventScroll: true });
        this.searchInput.select();
    }

    closeSearch({ clearQuery = true } = {}) {
        if (this.searchInput && clearQuery) {
            this.searchInput.value = '';
        }

        if (this.searchContainer) {
            this.searchContainer.hidden = true;
        }
        if (this.searchToggleBtn) {
            this.searchToggleBtn.hidden = false;
        }

        this.searchOpen = false;
        document.body.classList.remove('sidebar-search-open');

        this.closeItemMenu();

        if (clearQuery) {
            this._renderDOM(this.allSessions);
        }
    }

    clearSearch() {
        if (!this.searchInput) return;

        this.searchInput.value = '';
        this.handleSearch('');
        this.searchInput.focus({ preventScroll: true });
    }

    handleSearch(query) {
        if (!this.allSessions) return;

        const normalizedQuery = query.trim().toLowerCase();
        const displayList = normalizedQuery
            ? this.allSessions.filter((session) =>
                  this._sessionMatchesQuery(session, normalizedQuery)
              )
            : this.allSessions;

        this._renderDOM(displayList);
    }

    _sessionMatchesQuery(session, normalizedQuery) {
        const messageTexts = Array.isArray(session.messages)
            ? session.messages.map((message) =>
                  typeof message?.text === 'string' ? message.text : ''
              )
            : [];

        return [session.title || '', ...messageTexts].some((field) =>
            field.toLowerCase().includes(normalizedQuery)
        );
    }

    openItemMenu(sessionId) {
        this.activeMenuId = sessionId;
        this.activeMenuType = 'session';
        this.closeCollapsedRecentPopover();
        this._renderDOM(this._getDisplayedSessions());
    }

    openGroupMenu(groupId) {
        this.activeMenuId = groupId;
        this.activeMenuType = 'group';
        this.closeCollapsedRecentPopover();
        this._renderDOM(this._getDisplayedSessions());
    }

    closeItemMenu() {
        if (!this.activeMenuId) return;

        this.activeMenuId = null;
        this.activeMenuType = null;
        this._renderDOM(this._getDisplayedSessions());
    }

    _getDisplayedSessions() {
        const currentQuery = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        if (!currentQuery) return this.allSessions;

        return this.allSessions.filter((session) =>
            this._sessionMatchesQuery(session, currentQuery)
        );
    }

    getRecentSessions() {
        return collapsedRecent.getRecentSessions(this);
    }

    toggleCollapsedRecentPopover() {
        collapsedRecent.toggleCollapsedRecentPopover(this);
    }

    openCollapsedRecentPopover(options = {}) {
        collapsedRecent.openCollapsedRecentPopover(this, options);
    }

    positionCollapsedRecentPopover() {
        collapsedRecent.positionCollapsedRecentPopover(this);
    }

    closeCollapsedRecentPopover() {
        collapsedRecent.closeCollapsedRecentPopover(this);
    }

    clearCollapsedRecentCloseTimer() {
        collapsedRecent.clearCollapsedRecentCloseTimer(this);
    }

    scheduleCollapsedRecentClose() {
        collapsedRecent.scheduleCollapsedRecentClose(this);
    }

    renderCollapsedRecentPopover() {
        collapsedRecent.renderCollapsedRecentPopover(this);
    }

    renderList(
        sessions,
        groupsOrCurrentId,
        currentIdOrCallbacks,
        callbacksOrRenderState,
        renderState = {}
    ) {
        if (!this.listEl) return;

        const hasGroupsArgument = Array.isArray(groupsOrCurrentId);
        const groups = hasGroupsArgument ? groupsOrCurrentId : this.allGroups;
        const currentId = hasGroupsArgument ? currentIdOrCallbacks : groupsOrCurrentId;
        const itemCallbacks = hasGroupsArgument ? callbacksOrRenderState : currentIdOrCallbacks;
        const nextRenderState = hasGroupsArgument ? renderState : callbacksOrRenderState;

        this.allSessions = Array.isArray(sessions) ? sessions : [];
        this.allGroups = Array.isArray(groups) ? groups : [];
        this.currentSessionId = currentId;
        this.itemCallbacks = itemCallbacks || {};
        const generatingSessionIds = Array.isArray(nextRenderState?.generatingSessionIds)
            ? nextRenderState.generatingSessionIds.filter(Boolean)
            : nextRenderState?.generatingSessionId
              ? [nextRenderState.generatingSessionId]
              : [];
        this.renderState = {
            isGenerating: nextRenderState?.isGenerating === true || generatingSessionIds.length > 0,
            generatingSessionId: nextRenderState?.generatingSessionId || generatingSessionIds[0] || null,
            generatingSessionIds,
        };

        if (this.isCollapsedRecentOpen) {
            this.renderCollapsedRecentPopover();
        }

        const currentQuery = this.searchInput ? this.searchInput.value : '';
        if (currentQuery.trim()) {
            this.handleSearch(currentQuery);
        } else {
            this._renderDOM(this.allSessions);
        }
    }

    _renderDOM(sessions) {
        const fragment = document.createDocumentFragment();
        const groups = Array.isArray(this.allGroups) ? this.allGroups : [];

        if (sessions.length === 0 && groups.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-list-state';
            emptyState.textContent = t('noConversations');
            fragment.appendChild(emptyState);
            this.listEl.replaceChildren(fragment);
            return;
        }

        const { groupedSessions, ungroupedSessions } = this.partitionSessionsByGroup(sessions);

        groups.forEach((group) => {
            fragment.appendChild(
                this.createGroupElement(group, groupedSessions.get(group.id) || [])
            );
        });

        const ungroupedContainer = document.createElement('div');
        ungroupedContainer.className = 'history-ungrouped-dropzone';
        this.bindDropTarget(ungroupedContainer, null);

        const pinnedUngroupedSessions = ungroupedSessions.filter(
            (session) => session.isPinned === true
        );
        const unpinnedUngroupedSessions = ungroupedSessions.filter(
            (session) => session.isPinned !== true
        );
        if (pinnedUngroupedSessions.length > 0) {
            ungroupedContainer.appendChild(
                this.createSessionSection(t('pinnedChat'), pinnedUngroupedSessions)
            );
        }

        const { categories, categoryOrder } = categorizeSessionsByDate(unpinnedUngroupedSessions);
        categoryOrder.forEach((categoryName) => {
            ungroupedContainer.appendChild(
                this.createSessionSection(categoryName, categories.get(categoryName) || [])
            );
        });

        fragment.appendChild(ungroupedContainer);

        this.listEl.replaceChildren(fragment);
        this.focusEditingTitleInput();
    }

    partitionSessionsByGroup(sessions) {
        return partitionSessionsByGroup(sessions, this.allGroups);
    }

    createSessionSection(title, sessions) {
        return sidebarRendering.createSessionSection(this, title, sessions);
    }

    createGroupElement(group, sessions) {
        return sidebarRendering.createGroupElement(this, group, sessions);
    }

    createGroupTitleEditor(group) {
        return titleEdit.createGroupTitleEditor(this, group);
    }

    focusEditingTitleInput() {
        titleEdit.focusEditingTitleInput(this);
    }

    createSessionTitleEditor(session) {
        return titleEdit.createSessionTitleEditor(this, session);
    }

    startSessionTitleEdit(session) {
        titleEdit.startSessionTitleEdit(this, session);
    }

    confirmSessionTitleEdit() {
        titleEdit.confirmSessionTitleEdit(this);
    }

    cancelSessionTitleEdit() {
        titleEdit.cancelSessionTitleEdit(this);
    }

    startGroupTitleEdit(group) {
        titleEdit.startGroupTitleEdit(this, group);
    }

    confirmGroupTitleEdit() {
        titleEdit.confirmGroupTitleEdit(this);
    }

    cancelGroupTitleEdit() {
        titleEdit.cancelGroupTitleEdit(this);
    }

    createSessionRow(session) {
        return sidebarRendering.createSessionRow(this, session);
    }

    bindDropTarget(element, groupId) {
        sidebarRendering.bindDropTarget(this, element, groupId);
    }

    clearDragState() {
        sidebarRendering.clearDragState(this);
    }

    createGroupItemMenu(group) {
        return sidebarMenus.createGroupItemMenu(this, group);
    }

    createHistoryItemMenu(session) {
        return sidebarMenus.createHistoryItemMenu(this, session);
    }
}
