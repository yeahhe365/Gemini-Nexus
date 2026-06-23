(function () {
    const BUTTON_ID = 'gemini-nexus-youtube-summary-btn';
    const PANEL_ID = 'gemini-nexus-youtube-summary-panel';
    const STYLE_ID = 'gemini-nexus-youtube-summary-style';
    const CLASS_NAMES = Object.freeze({
        action: 'gemini-nexus-youtube-summary-action',
        actions: 'gemini-nexus-youtube-summary-actions',
        body: 'gemini-nexus-youtube-summary-body',
        close: 'gemini-nexus-youtube-summary-close',
        continueButton: 'gemini-nexus-youtube-summary-continue',
        error: 'is-error',
        floating: 'is-floating',
        header: 'gemini-nexus-youtube-summary-header',
        label: 'gemini-nexus-youtube-summary-label',
        logo: 'gemini-nexus-youtube-summary-logo',
        regenerateButton: 'gemini-nexus-youtube-summary-regenerate',
        streaming: 'is-streaming',
        title: 'gemini-nexus-youtube-summary-title',
    });
    const PANEL_ACTIONS = Object.freeze({
        continueChat: 'continue-chat',
        regenerate: 'regenerate',
    });
    const PANEL_ACTION_DATA_KEY = 'action';
    const LOGO_PATH = 'logo.png';
    const ACTION_CONTAINER_SELECTORS = Object.freeze([
        'ytd-watch-metadata #top-level-buttons-computed',
        '#above-the-fold #top-level-buttons-computed',
        'ytd-watch-metadata #actions-inner',
        '#actions-inner',
    ]);
    const PANEL_CONTAINER_SELECTORS = Object.freeze([
        'ytd-watch-metadata',
        '#above-the-fold',
        'ytd-watch-flexy',
    ]);
    const CLOSE_ICON = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
        </svg>
    `;

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${BUTTON_ID},
            #${PANEL_ID} {
                --gemini-nexus-youtube-summary-text: var(--yt-spec-text-primary, #0f0f0f);
                --gemini-nexus-youtube-summary-secondary-text: var(--yt-spec-text-secondary, #606060);
                --gemini-nexus-youtube-summary-chip: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, 0.05));
                --gemini-nexus-youtube-summary-panel-bg: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, 0.04));
                --gemini-nexus-youtube-summary-surface: var(--yt-spec-base-background, rgba(255, 255, 255, 0.92));
                --gemini-nexus-youtube-summary-hover: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.1));
                --gemini-nexus-youtube-summary-border: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.12));
                --gemini-nexus-youtube-summary-link: var(--yt-spec-call-to-action, #065fd4);
                --gemini-nexus-youtube-summary-inline-code: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, 0.06));
            }

            html[dark] #${BUTTON_ID},
            html[dark] #${PANEL_ID},
            [dark] #${BUTTON_ID},
            [dark] #${PANEL_ID} {
                --gemini-nexus-youtube-summary-text: var(--yt-spec-text-primary, #f1f1f1);
                --gemini-nexus-youtube-summary-secondary-text: var(--yt-spec-text-secondary, #aaa);
                --gemini-nexus-youtube-summary-chip: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.1));
                --gemini-nexus-youtube-summary-panel-bg: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.08));
                --gemini-nexus-youtube-summary-surface: var(--yt-spec-raised-background, var(--yt-spec-base-background, #212121));
                --gemini-nexus-youtube-summary-hover: var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.16));
                --gemini-nexus-youtube-summary-border: var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.14));
                --gemini-nexus-youtube-summary-link: var(--yt-spec-call-to-action, #3ea6ff);
                --gemini-nexus-youtube-summary-inline-code: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.12));
            }

            #${BUTTON_ID} {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 7px;
                height: 36px;
                padding: 0 14px 0 12px;
                border: 0;
                border-radius: 18px;
                background: var(--gemini-nexus-youtube-summary-chip);
                color: var(--gemini-nexus-youtube-summary-text);
                font: 500 14px/1.1 Roboto, Arial, sans-serif;
                white-space: nowrap;
                cursor: pointer;
                flex: 0 0 auto;
                transition: background-color 120ms ease, opacity 120ms ease;
            }

            #${BUTTON_ID} .${CLASS_NAMES.logo} {
                width: 18px;
                height: 18px;
                flex: 0 0 auto;
                object-fit: contain;
                border-radius: 50%;
            }

            #${BUTTON_ID} .${CLASS_NAMES.label} {
                min-width: 0;
            }

            #${BUTTON_ID}:hover {
                background: var(--gemini-nexus-youtube-summary-hover);
            }

            #${BUTTON_ID}:disabled {
                cursor: default;
                opacity: 0.72;
            }

            #${BUTTON_ID}.${CLASS_NAMES.error} {
                background: rgba(242, 139, 130, 0.22);
                color: var(--gemini-nexus-youtube-summary-text);
            }

            #${BUTTON_ID}.${CLASS_NAMES.floating} {
                position: fixed;
                right: 20px;
                bottom: 96px;
                z-index: 2147483647;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
            }

            #${BUTTON_ID}[hidden] {
                display: none !important;
            }

            #${PANEL_ID} {
                margin-top: 12px;
                border: 1px solid var(--gemini-nexus-youtube-summary-border);
                border-radius: 12px;
                background: var(--gemini-nexus-youtube-summary-panel-bg);
                color: var(--gemini-nexus-youtube-summary-text);
                font: 400 14px/1.55 Roboto, Arial, sans-serif;
                overflow: hidden;
            }

            #${PANEL_ID}.${CLASS_NAMES.floating} {
                position: fixed;
                right: 20px;
                bottom: 144px;
                z-index: 2147483647;
                width: min(440px, calc(100vw - 40px));
                max-height: min(560px, calc(100vh - 190px));
                box-shadow: 0 14px 42px rgba(0, 0, 0, 0.32);
            }

            #${PANEL_ID}[hidden] {
                display: none !important;
            }

            #${PANEL_ID} .${CLASS_NAMES.header} {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px 14px 8px;
                border-bottom: 1px solid var(--gemini-nexus-youtube-summary-border);
                background: transparent;
            }

            #${PANEL_ID} .${CLASS_NAMES.title} {
                min-width: 0;
                color: var(--gemini-nexus-youtube-summary-text);
                font-weight: 600;
            }

            #${PANEL_ID} .${CLASS_NAMES.actions} {
                display: flex;
                align-items: center;
                gap: 6px;
                flex: 0 0 auto;
            }

            #${PANEL_ID} .${CLASS_NAMES.action} {
                height: 28px;
                padding: 0 10px;
                border: 1px solid var(--gemini-nexus-youtube-summary-border);
                border-radius: 14px;
                background: var(--gemini-nexus-youtube-summary-surface);
                color: var(--gemini-nexus-youtube-summary-text);
                cursor: pointer;
                font: 500 12px/1 Roboto, Arial, sans-serif;
                white-space: nowrap;
                transition: background-color 120ms ease, opacity 120ms ease;
            }

            #${PANEL_ID} .${CLASS_NAMES.action}:hover:not(:disabled) {
                background: var(--gemini-nexus-youtube-summary-hover);
            }

            #${PANEL_ID} .${CLASS_NAMES.action}:disabled {
                cursor: default;
                opacity: 0.52;
            }

            #${PANEL_ID} .${CLASS_NAMES.close} {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border: 0;
                border-radius: 50%;
                background: transparent;
                color: var(--gemini-nexus-youtube-summary-text);
                cursor: pointer;
                padding: 0;
            }

            #${PANEL_ID} .${CLASS_NAMES.close}:hover {
                background: var(--gemini-nexus-youtube-summary-hover);
            }

            #${PANEL_ID} .${CLASS_NAMES.body} {
                max-height: 460px;
                overflow: auto;
                padding: 12px 14px 14px;
                color: var(--gemini-nexus-youtube-summary-text);
                overflow-wrap: anywhere;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} p {
                margin: 0 0 10px;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} p:last-child,
            #${PANEL_ID} .${CLASS_NAMES.body} ul:last-child,
            #${PANEL_ID} .${CLASS_NAMES.body} ol:last-child,
            #${PANEL_ID} .${CLASS_NAMES.body} pre:last-child,
            #${PANEL_ID} .${CLASS_NAMES.body} blockquote:last-child,
            #${PANEL_ID} .${CLASS_NAMES.body} table:last-child {
                margin-bottom: 0;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} h1,
            #${PANEL_ID} .${CLASS_NAMES.body} h2,
            #${PANEL_ID} .${CLASS_NAMES.body} h3,
            #${PANEL_ID} .${CLASS_NAMES.body} h4 {
                margin: 14px 0 8px;
                color: var(--gemini-nexus-youtube-summary-text);
                font-weight: 600;
                line-height: 1.3;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} h1:first-child,
            #${PANEL_ID} .${CLASS_NAMES.body} h2:first-child,
            #${PANEL_ID} .${CLASS_NAMES.body} h3:first-child,
            #${PANEL_ID} .${CLASS_NAMES.body} h4:first-child {
                margin-top: 0;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} h1 {
                font-size: 18px;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} h2 {
                font-size: 16px;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} h3,
            #${PANEL_ID} .${CLASS_NAMES.body} h4 {
                font-size: 15px;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} ul,
            #${PANEL_ID} .${CLASS_NAMES.body} ol {
                margin: 0 0 10px;
                padding-left: 22px;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} li {
                margin: 3px 0;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} blockquote {
                margin: 10px 0;
                padding: 6px 10px;
                border-left: 3px solid var(--gemini-nexus-youtube-summary-link);
                background: var(--gemini-nexus-youtube-summary-panel-bg);
                color: var(--gemini-nexus-youtube-summary-secondary-text);
            }

            #${PANEL_ID} .${CLASS_NAMES.body} pre {
                margin: 10px 0;
                padding: 10px;
                overflow-x: auto;
                border-radius: 8px;
                background: var(--gemini-nexus-youtube-summary-surface);
                color: var(--gemini-nexus-youtube-summary-text);
            }

            #${PANEL_ID} .${CLASS_NAMES.body} code {
                font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
                font-size: 0.92em;
                padding: 1px 4px;
                border-radius: 4px;
                background: var(--gemini-nexus-youtube-summary-inline-code);
            }

            #${PANEL_ID} .${CLASS_NAMES.body} pre code {
                display: block;
                padding: 0;
                background: transparent;
                white-space: pre;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} table {
                width: 100%;
                margin: 10px 0;
                border-collapse: collapse;
                font-size: 13px;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} th,
            #${PANEL_ID} .${CLASS_NAMES.body} td {
                border: 1px solid var(--gemini-nexus-youtube-summary-border);
                padding: 6px 8px;
                text-align: left;
                vertical-align: top;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} th {
                font-weight: 600;
                background: var(--gemini-nexus-youtube-summary-panel-bg);
            }

            #${PANEL_ID} .${CLASS_NAMES.body} hr {
                margin: 12px 0;
                border: 0;
                border-top: 1px solid var(--gemini-nexus-youtube-summary-border);
            }

            #${PANEL_ID} .${CLASS_NAMES.body} a {
                color: var(--gemini-nexus-youtube-summary-link);
                text-decoration: none;
                font-weight: 500;
            }

            #${PANEL_ID} .${CLASS_NAMES.body} a:hover {
                text-decoration: underline;
            }

            #${PANEL_ID}.${CLASS_NAMES.error} {
                border-color: #f28b82;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    function findFirstElement(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    function findActionsContainer() {
        return findFirstElement(ACTION_CONTAINER_SELECTORS);
    }

    function findPanelContainer() {
        return findFirstElement(PANEL_CONTAINER_SELECTORS);
    }

    function createButton(onClick) {
        const button = document.createElement('button');
        button.id = BUTTON_ID;
        button.type = 'button';

        const logo = document.createElement('img');
        logo.className = CLASS_NAMES.logo;
        logo.src = chrome.runtime.getURL(LOGO_PATH);
        logo.alt = '';
        logo.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.className = CLASS_NAMES.label;

        button.appendChild(logo);
        button.appendChild(label);
        button.addEventListener('click', onClick);
        return button;
    }

    function setButtonLabel(button, label) {
        let labelElement = button.querySelector(`.${CLASS_NAMES.label}`);
        if (!labelElement) {
            labelElement = document.createElement('span');
            labelElement.className = CLASS_NAMES.label;
            button.appendChild(labelElement);
        }
        labelElement.textContent = label;
    }

    function createPanelActionButton(className, action, label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `${CLASS_NAMES.action} ${className}`;
        button.dataset[PANEL_ACTION_DATA_KEY] = action;
        button.textContent = label;
        return button;
    }

    function createPanel(strings, onPanelClick) {
        const panel = document.createElement('section');
        panel.id = PANEL_ID;
        panel.hidden = true;

        const header = document.createElement('div');
        header.className = CLASS_NAMES.header;

        const title = document.createElement('div');
        title.className = CLASS_NAMES.title;
        title.textContent = strings.panelTitle;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = CLASS_NAMES.close;
        closeButton.innerHTML = CLOSE_ICON;
        closeButton.title = strings.close;
        closeButton.setAttribute('aria-label', strings.close);
        closeButton.addEventListener('click', () => {
            panel.hidden = true;
        });

        const actions = document.createElement('div');
        actions.className = CLASS_NAMES.actions;

        const regenerateButton = createPanelActionButton(
            CLASS_NAMES.regenerateButton,
            PANEL_ACTIONS.regenerate,
            strings.regenerate
        );

        const continueButton = createPanelActionButton(
            CLASS_NAMES.continueButton,
            PANEL_ACTIONS.continueChat,
            strings.continueChat
        );
        continueButton.title = strings.continueChatUnavailable;
        continueButton.disabled = true;

        const body = document.createElement('div');
        body.className = CLASS_NAMES.body;

        actions.appendChild(regenerateButton);
        actions.appendChild(continueButton);
        actions.appendChild(closeButton);
        header.appendChild(title);
        header.appendChild(actions);
        panel.appendChild(header);
        panel.appendChild(body);
        panel.addEventListener('click', onPanelClick);
        return panel;
    }

    window.GeminiYouTubeSummaryView = {
        BUTTON_ID,
        CLASS_NAMES,
        PANEL_ID,
        PANEL_ACTIONS,
        PANEL_ACTION_DATA_KEY,
        STYLE_ID,
        ensureStyles,
        findActionsContainer,
        findPanelContainer,
        createButton,
        setButtonLabel,
        createPanel,
    };
})();
