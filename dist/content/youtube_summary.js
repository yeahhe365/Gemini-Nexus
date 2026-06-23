(function () {
    if (window.GeminiNexusPageGuard?.isDisabled) return;

    const REQUEST_SOURCE = 'youtube-summary';
    const CACHE_PREFIX = 'gemini-nexus-youtube-summary:';
    const VIDEO_CACHE_KEY_PREFIX = 'video:';
    const BUTTON_RESET_DELAY_MS = 1800;
    const PAGE_EVENTS = Object.freeze(['yt-navigate-finish', 'yt-page-data-updated', 'popstate']);
    const RUNTIME_ACTIONS = Object.freeze({
        quickAsk: 'QUICK_ASK',
        streamUpdate: 'GEMINI_STREAM_UPDATE',
        streamDone: 'GEMINI_STREAM_DONE',
        openSidePanel: 'OPEN_SIDE_PANEL',
    });
    const youtube = globalThis.GeminiNexusYouTube;
    const { createSummaryPrompt, getStrings } = window.GeminiYouTubeSummaryI18n;
    const { getStoredSummaryConfig } = window.GeminiYouTubeSummaryModel;
    const { SEEK_SECONDS_DATA_KEY, renderSummaryText, seekCurrentVideo, parseTimestampToSeconds } =
        window.GeminiYouTubeSummaryRender;
    const view = window.GeminiYouTubeSummaryView;
    const { CLASS_NAMES, PANEL_ACTIONS } = view;
    const DATA_KEYS = Object.freeze({
        sessionId: 'sessionId',
        videoUrl: 'videoUrl',
    });
    const ACTION_BUTTON_SELECTOR = `[data-${view.PANEL_ACTION_DATA_KEY}]`;

    function createRequestId() {
        const random =
            window.crypto?.randomUUID?.() || Math.random().toString(16).slice(2) + Date.now();
        return `${REQUEST_SOURCE}-${random}`;
    }

    function nextFrame(callback) {
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(callback);
            return;
        }
        window.setTimeout(callback, 0);
    }

    class YouTubeSummaryController {
        constructor() {
            this.activeRequestId = null;
            this.activeVideoUrl = null;
            this.summaryCache = new Map();
            this.syncScheduled = false;
            this.resetTimerId = null;
            this.observer = null;
            this.handleRuntimeMessage = this.handleRuntimeMessage.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.handlePanelClick = this.handlePanelClick.bind(this);
            this.scheduleSync = this.scheduleSync.bind(this);
        }

        start() {
            this.sync();
            this.observePageChanges();
            chrome.runtime?.onMessage?.addListener?.(this.handleRuntimeMessage);
            PAGE_EVENTS.forEach((eventName) => {
                window.addEventListener(eventName, this.scheduleSync);
            });
        }

        stop() {
            this.observer?.disconnect();
            this.observer = null;
            if (this.resetTimerId) window.clearTimeout(this.resetTimerId);
            chrome.runtime?.onMessage?.removeListener?.(this.handleRuntimeMessage);
            PAGE_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, this.scheduleSync);
            });
            this.getButton()?.remove();
            this.getPanel()?.remove();
            this.resetTimerId = null;
            this.syncScheduled = false;
        }

        observePageChanges() {
            const Observer = window.MutationObserver;
            if (typeof Observer !== 'function') return;
            this.observer = new Observer(this.scheduleSync);
            this.observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        }

        scheduleSync() {
            if (this.syncScheduled) return;
            this.syncScheduled = true;
            nextFrame(() => {
                this.syncScheduled = false;
                this.sync();
            });
        }

        getButton() {
            return document.getElementById(view.BUTTON_ID);
        }

        getPanel() {
            return document.getElementById(view.PANEL_ID);
        }

        getCurrentVideoUrl() {
            return youtube.getYouTubeVideoUrl(window.location.href);
        }

        getPanelElement(panel, className) {
            return panel.querySelector(`.${className}`);
        }

        getCacheKey(videoUrl) {
            const videoId = youtube.getYouTubeVideoId(videoUrl);
            return videoId ? `${VIDEO_CACHE_KEY_PREFIX}${videoId}` : videoUrl;
        }

        getStorageCacheKey(cacheKey) {
            return `${CACHE_PREFIX}${cacheKey}`;
        }

        getCachedSummary(videoUrl) {
            const key = this.getCacheKey(videoUrl);
            if (!key) return null;
            if (this.summaryCache.has(key)) return this.summaryCache.get(key);

            try {
                const raw = window.sessionStorage?.getItem?.(this.getStorageCacheKey(key));
                if (!raw) return null;
                const cached = JSON.parse(raw);
                if (cached?.videoUrl && typeof cached.text === 'string') {
                    this.summaryCache.set(key, cached);
                    return cached;
                }
            } catch {}

            return null;
        }

        saveCachedSummary(videoUrl, summary) {
            const key = this.getCacheKey(videoUrl);
            if (!key || typeof summary?.text !== 'string') return null;

            const cached = {
                videoUrl,
                text: summary.text,
                sessionId: summary.sessionId || null,
                updatedAt: Date.now(),
            };
            this.summaryCache.set(key, cached);

            try {
                window.sessionStorage?.setItem?.(
                    this.getStorageCacheKey(key),
                    JSON.stringify(cached)
                );
            } catch {}

            return cached;
        }

        updateButton(button, videoUrl) {
            const strings = getStrings();
            const cached = this.getCachedSummary(videoUrl);
            button.dataset[DATA_KEYS.videoUrl] = videoUrl;
            button.title = strings.title;
            button.setAttribute('aria-label', strings.title);
            view.setButtonLabel(
                button,
                this.activeRequestId
                    ? strings.loading
                    : cached
                      ? strings.viewSummary
                      : strings.label
            );
            button.hidden = false;
            button.disabled = Boolean(this.activeRequestId);
            button.classList.remove(CLASS_NAMES.error);
        }

        mountButton(button) {
            const container = view.findActionsContainer();
            if (container) {
                button.classList.remove(CLASS_NAMES.floating);
                if (button.parentElement !== container) {
                    container.insertBefore(button, container.firstChild || null);
                }
                return;
            }

            button.classList.add(CLASS_NAMES.floating);
            if (button.parentElement !== document.body) {
                document.body.appendChild(button);
            }
        }

        mountPanel(panel) {
            const container = view.findPanelContainer();
            if (container) {
                panel.classList.remove(CLASS_NAMES.floating);
                if (panel.parentElement !== container) {
                    container.appendChild(panel);
                }
                return;
            }

            panel.classList.add(CLASS_NAMES.floating);
            if (panel.parentElement !== document.body) {
                document.body.appendChild(panel);
            }
        }

        updatePanelActions(panel, { isStreaming = false, isError = false, sessionId = null } = {}) {
            const strings = getStrings();
            const regenerateButton = this.getPanelElement(panel, CLASS_NAMES.regenerateButton);
            const continueButton = this.getPanelElement(panel, CLASS_NAMES.continueButton);

            if (regenerateButton) {
                regenerateButton.disabled = Boolean(this.activeRequestId);
            }

            if (continueButton) {
                const canContinue = !isStreaming && !isError && Boolean(sessionId);
                continueButton.disabled = !canContinue;
                continueButton.dataset[DATA_KEYS.sessionId] = canContinue ? sessionId : '';
                continueButton.title = canContinue
                    ? strings.continueChat
                    : strings.continueChatUnavailable;
            }
        }

        showPanel(text, { isStreaming = false, isError = false, sessionId = null } = {}) {
            view.ensureStyles();
            const strings = getStrings();
            const videoUrl = this.activeVideoUrl || this.getCurrentVideoUrl();
            let panel = this.getPanel();
            if (!panel) panel = view.createPanel(strings, this.handlePanelClick);
            this.mountPanel(panel);

            const body = this.getPanelElement(panel, CLASS_NAMES.body);
            body.replaceChildren(renderSummaryText(text || strings.panelEmpty, videoUrl));
            panel.hidden = false;
            panel.classList.toggle(CLASS_NAMES.streaming, isStreaming);
            panel.classList.toggle(CLASS_NAMES.error, isError);
            this.updatePanelActions(panel, { isStreaming, isError, sessionId });
        }

        resetButton(videoUrl) {
            const button = this.getButton();
            this.activeRequestId = null;
            if (button) {
                this.updateButton(button, videoUrl || this.getCurrentVideoUrl());
            }
        }

        sync() {
            const videoUrl = this.getCurrentVideoUrl();
            let button = this.getButton();

            if (!videoUrl) {
                if (button) button.hidden = true;
                if (!this.activeRequestId) {
                    const panel = this.getPanel();
                    if (panel) panel.hidden = true;
                }
                return;
            }

            view.ensureStyles();
            if (!this.activeRequestId && this.activeVideoUrl && this.activeVideoUrl !== videoUrl) {
                const panel = this.getPanel();
                if (panel) panel.hidden = true;
                this.activeVideoUrl = null;
            }
            if (!button) button = view.createButton(this.handleClick);
            this.updateButton(button, videoUrl);
            this.mountButton(button);
        }

        async handleClick(event) {
            event.preventDefault();
            event.stopPropagation();

            const button = this.getButton();
            const videoUrl = youtube.getYouTubeVideoUrl(
                button?.dataset[DATA_KEYS.videoUrl] || window.location.href
            );
            if (!button || !videoUrl) return;

            const cached = this.getCachedSummary(videoUrl);
            if (cached && !this.activeRequestId) {
                this.activeVideoUrl = videoUrl;
                this.showPanel(cached.text, { sessionId: cached.sessionId });
                this.updateButton(button, videoUrl);
                return;
            }

            await this.startSummary(videoUrl);
        }

        async startSummary(videoUrl) {
            if (this.activeRequestId || !videoUrl) return;

            const button = this.getButton();
            const strings = getStrings();
            const requestId = createRequestId();
            this.activeRequestId = requestId;
            this.activeVideoUrl = videoUrl;
            if (button) {
                button.disabled = true;
                view.setButtonLabel(button, strings.loading);
            }
            this.showPanel(strings.panelEmpty, { isStreaming: true });

            try {
                const summaryConfig = await getStoredSummaryConfig();
                const message = {
                    action: RUNTIME_ACTIONS.quickAsk,
                    source: REQUEST_SOURCE,
                    requestId,
                    text: createSummaryPrompt(videoUrl),
                };
                if (summaryConfig?.provider) message.provider = summaryConfig.provider;
                if (summaryConfig?.model) message.model = summaryConfig.model;

                const response = await chrome.runtime.sendMessage(message);
                if (response?.status === 'error') throw new Error(response.error || strings.failed);
            } catch (error) {
                console.warn('Failed to summarize YouTube video:', error);
                if (this.activeRequestId === requestId) this.activeRequestId = null;
                if (button) {
                    button.classList.add(CLASS_NAMES.error);
                    view.setButtonLabel(button, strings.failed);
                }
                this.showPanel(error.message || strings.failed, { isError: true });
                if (button) {
                    this.resetTimerId = window.setTimeout(() => {
                        this.updateButton(button, videoUrl);
                        this.resetTimerId = null;
                    }, BUTTON_RESET_DELAY_MS);
                }
            } finally {
                if (this.activeRequestId === requestId) this.resetButton(videoUrl);
            }
        }

        handleRuntimeMessage(request) {
            if (
                request.source !== REQUEST_SOURCE ||
                !request.requestId ||
                request.requestId !== this.activeRequestId
            ) {
                return false;
            }

            if (request.action === RUNTIME_ACTIONS.streamUpdate) {
                this.showPanel(request.text || getStrings().panelEmpty, { isStreaming: true });
                return false;
            }

            if (request.action === RUNTIME_ACTIONS.streamDone) {
                const result = request.result || {};
                const videoUrl = this.activeVideoUrl;
                this.activeRequestId = null;

                if (result.status === 'success') {
                    const cached = this.saveCachedSummary(videoUrl, {
                        text: result.text || '',
                        sessionId: request.sessionId || null,
                    });
                    this.showPanel(cached?.text || '', {
                        isStreaming: false,
                        sessionId: cached?.sessionId || null,
                    });
                } else {
                    this.showPanel(result.text || getStrings().failed, { isError: true });
                }
                this.resetButton(videoUrl);
                return false;
            }

            return false;
        }

        async continueChat(sessionId) {
            if (!sessionId) return;
            try {
                const response = await chrome.runtime.sendMessage({
                    action: RUNTIME_ACTIONS.openSidePanel,
                    sessionId,
                });
                if (response?.status === 'error') {
                    throw new Error(response.error || getStrings().failed);
                }
            } catch (error) {
                console.warn('Failed to continue YouTube summary chat:', error);
                this.showPanel(error?.message || getStrings().failed, { isError: true });
            }
        }

        handlePanelClick(event) {
            const panel = this.getPanel();
            if (!panel) return;

            const actionButton = event.target?.closest?.(ACTION_BUTTON_SELECTOR);
            if (actionButton && panel.contains(actionButton)) {
                event.preventDefault();
                event.stopPropagation();

                const action = actionButton.dataset[view.PANEL_ACTION_DATA_KEY];
                if (action === PANEL_ACTIONS.regenerate) {
                    const videoUrl = this.activeVideoUrl || this.getCurrentVideoUrl();
                    this.startSummary(videoUrl);
                } else if (action === PANEL_ACTIONS.continueChat) {
                    this.continueChat(actionButton.dataset[DATA_KEYS.sessionId]);
                }
                return;
            }

            const link = event.target?.closest?.('a[href]');
            if (!link || !panel.contains(link)) return;

            const seconds = Number(link.dataset[SEEK_SECONDS_DATA_KEY]);
            if (Number.isFinite(seconds)) {
                event.preventDefault();
                seekCurrentVideo(seconds);
            }
        }
    }

    const controller = new YouTubeSummaryController();
    controller.start();

    window.GeminiYouTubeSummary = {
        createSummaryPrompt,
        getYouTubeVideoUrl: youtube.getYouTubeVideoUrl,
        parseTimestampToSeconds,
        controller,
    };
})();
