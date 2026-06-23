import { t } from '../core/i18n.js';
import { TemplateIcons } from './templates/icons.js';

export function createSessionSection(controller, title, sessions) {
    const section = document.createElement('section');
    section.className = 'history-session-section';

    const heading = document.createElement('div');
    heading.className = 'history-session-section-title';
    heading.textContent = title;
    section.appendChild(heading);

    sessions.forEach((session) => section.appendChild(controller.createSessionRow(session)));
    return section;
}

export function createGroupElement(controller, group, sessions) {
    const isMenuOpen =
        controller.activeMenuType === 'group' && controller.activeMenuId === group.id;
    const groupElement = document.createElement('div');
    groupElement.className = ['history-group', isMenuOpen ? 'menu-open' : '']
        .filter(Boolean)
        .join(' ');
    controller.bindDropTarget(groupElement, group.id);

    const details = document.createElement('details');
    details.className = 'history-group-details';
    details.open = group.isExpanded !== false;

    const summary = document.createElement('summary');
    summary.className = 'history-group-summary';
    summary.onclick = (clickEvent) => {
        clickEvent.preventDefault();
        if (controller.itemCallbacks?.onToggleGroupExpansion) {
            controller.itemCallbacks.onToggleGroupExpansion(group.id);
        }
    };

    const titleWrap = document.createElement('div');
    titleWrap.className = 'history-group-title-wrap';

    const chevron = document.createElement('span');
    chevron.className = 'history-group-chevron';
    chevron.innerHTML = TemplateIcons.CHEVRON_DOWN;
    titleWrap.appendChild(chevron);

    if (controller.editingGroupId === group.id) {
        titleWrap.appendChild(controller.createGroupTitleEditor(group));
    } else {
        const titleElement = document.createElement('span');
        titleElement.className = 'history-group-title';
        titleElement.textContent = group.title;
        titleWrap.appendChild(titleElement);
    }

    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'history-menu-trigger history-group-menu-trigger';
    menuButton.innerHTML = TemplateIcons.MORE_HORIZONTAL;
    menuButton.title = t('moreOptions');
    menuButton.setAttribute('aria-label', t('moreOptions'));
    menuButton.setAttribute('aria-haspopup', 'menu');
    menuButton.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
    menuButton.onclick = (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        if (isMenuOpen) {
            controller.closeItemMenu();
            return;
        }
        controller.openGroupMenu(group.id);
    };
    menuButton.onkeydown = (keyboardEvent) => keyboardEvent.stopPropagation();

    summary.appendChild(titleWrap);
    summary.appendChild(menuButton);
    details.appendChild(summary);

    if (isMenuOpen) {
        details.appendChild(controller.createGroupItemMenu(group));
    }

    const groupSessions = document.createElement('div');
    groupSessions.className = 'history-group-sessions';
    sessions.forEach((session) => groupSessions.appendChild(controller.createSessionRow(session)));
    details.appendChild(groupSessions);

    groupElement.appendChild(details);
    return groupElement;
}

export function createSessionRow(controller, session) {
    const generatingSessionIds = Array.isArray(controller.renderState.generatingSessionIds)
        ? controller.renderState.generatingSessionIds
        : controller.renderState.generatingSessionId
          ? [controller.renderState.generatingSessionId]
          : [];
    const isGeneratingSession = generatingSessionIds.includes(session.id);
    const isMenuOpen =
        controller.activeMenuType === 'session' && controller.activeMenuId === session.id;
    const sessionRow = document.createElement('div');
    sessionRow.className = [
        'history-item',
        session.id === controller.currentSessionId ? 'active' : '',
        isMenuOpen ? 'menu-open' : '',
        session.isPinned === true ? 'pinned' : '',
    ]
        .filter(Boolean)
        .join(' ');
    sessionRow.setAttribute('role', 'button');
    sessionRow.draggable = true;
    sessionRow.tabIndex = 0;

    const handleSelect = () => {
        if (controller.itemCallbacks?.onSwitch) {
            controller.itemCallbacks.onSwitch(session.id);
        }
        if (window.innerWidth < 600) {
            controller.close();
        }
    };

    sessionRow.onclick = handleSelect;
    sessionRow.onkeydown = (keyboardEvent) => {
        if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;

        keyboardEvent.preventDefault();
        handleSelect();
    };
    sessionRow.oncontextmenu = (mouseEvent) => {
        mouseEvent.preventDefault();
        controller.openItemMenu(session.id);
    };
    sessionRow.ondragstart = (dragEvent) => {
        dragEvent.stopPropagation();
        dragEvent.dataTransfer?.setData('sessionId', session.id);
        dragEvent.dataTransfer?.setData('text/plain', session.id);
        if (dragEvent.dataTransfer) {
            dragEvent.dataTransfer.effectAllowed = 'move';
        }
        sessionRow.classList.add('dragging');
    };
    sessionRow.ondragend = () => {
        sessionRow.classList.remove('dragging');
        controller.clearDragState();
    };

    const titleWrap = document.createElement('div');
    titleWrap.className = 'history-title-wrap';

    if (session.isPinned === true) {
        const pinBadge = document.createElement('span');
        pinBadge.className = 'history-pin-badge';
        pinBadge.title = t('pinnedChat');
        pinBadge.setAttribute('aria-label', t('pinnedChat'));
        pinBadge.innerHTML = TemplateIcons.PIN;
        titleWrap.appendChild(pinBadge);
    }

    if (controller.editingSessionId === session.id) {
        titleWrap.appendChild(controller.createSessionTitleEditor(session));
    } else {
        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-title';
        titleSpan.textContent = session.title;
        titleWrap.appendChild(titleSpan);
    }

    const spinner = document.createElement('span');
    spinner.className = 'history-generating-spinner';
    spinner.title = t('generating');
    spinner.setAttribute('aria-label', t('generating'));

    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'history-menu-trigger';
    menuButton.innerHTML = TemplateIcons.MORE_HORIZONTAL;
    menuButton.title = t('moreOptions');
    menuButton.setAttribute('aria-label', t('moreOptions'));
    menuButton.setAttribute('aria-haspopup', 'menu');
    menuButton.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
    menuButton.onclick = (clickEvent) => {
        clickEvent.stopPropagation();
        if (isMenuOpen) {
            controller.closeItemMenu();
            return;
        }
        controller.openItemMenu(session.id);
    };
    menuButton.onkeydown = (keyboardEvent) => keyboardEvent.stopPropagation();

    sessionRow.appendChild(titleWrap);
    if (isGeneratingSession) {
        sessionRow.appendChild(spinner);
    }
    sessionRow.appendChild(menuButton);

    if (isMenuOpen) {
        sessionRow.appendChild(controller.createHistoryItemMenu(session));
    }

    return sessionRow;
}

export function bindDropTarget(controller, element, groupId) {
    const dragClass = 'drag-over';
    const dragKey = groupId || '__ungrouped__';

    element.ondragover = (dragEvent) => {
        dragEvent.preventDefault();
        dragEvent.stopPropagation();
        if (dragEvent.dataTransfer) {
            dragEvent.dataTransfer.dropEffect = 'move';
        }
    };
    element.ondragenter = (dragEvent) => {
        dragEvent.preventDefault();
        dragEvent.stopPropagation();
        controller.dragOverGroupId = dragKey;
        element.classList.add(dragClass);
    };
    element.ondragleave = (dragEvent) => {
        if (element.contains(dragEvent.relatedTarget)) return;
        element.classList.remove(dragClass);
        if (controller.dragOverGroupId === dragKey) {
            controller.dragOverGroupId = null;
        }
    };
    element.ondrop = (dropEvent) => {
        dropEvent.preventDefault();
        dropEvent.stopPropagation();
        element.classList.remove(dragClass);
        controller.dragOverGroupId = null;

        const sessionId =
            dropEvent.dataTransfer?.getData('sessionId') ||
            dropEvent.dataTransfer?.getData('text/plain');
        if (sessionId && controller.itemCallbacks?.onMoveSessionToGroup) {
            controller.itemCallbacks.onMoveSessionToGroup(sessionId, groupId);
        }
    };
}

export function clearDragState(controller) {
    controller.dragOverGroupId = null;
    controller.listEl
        ?.querySelectorAll('.drag-over')
        .forEach((element) => element.classList.remove('drag-over'));
}
