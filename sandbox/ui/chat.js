import { t } from '../core/i18n.js';
import { copyToClipboard } from '../render/clipboard.js';
import { TemplateIcons } from './templates/icons.js';
import '../../shared/ui/copy_feedback.js';

export class ChatController {
    constructor(elements) {
        this.historyDiv = elements.historyDiv;
        this.statusDiv = elements.statusDiv;
        this.inputFn = elements.inputFn;
        this.sendBtn = elements.sendBtn;
        this.pageContextBtn = document.getElementById('page-context-btn');
        this.liveArtifactsBtn = document.getElementById('live-artifacts-btn');
        this.footerEl = document.querySelector('.footer');
        this.shouldFollowBottom = true;
        this.scrollFrame = null;
        this.resizeObserver = null;
        this.footerResizeObserver = null;
        this.observedResizeElements = new WeakSet();

        this.initListeners();
        this.initFooterOffsetSync();
    }

    initListeners() {
        if (this.inputFn) {
            this.inputFn.addEventListener('input', () => {
                this.inputFn.style.height = 'auto';
                this.inputFn.style.height = this.inputFn.scrollHeight + 'px';
                this.updateFooterOffset();
            });
        }

        if (this.historyDiv) {
            this.historyDiv.addEventListener('click', async (clickEvent) => {
                const link = clickEvent.target.closest('a[href]');
                if (link) {
                    const href = link.getAttribute('href');
                    if (href && /^https?:\/\//i.test(href)) {
                        clickEvent.preventDefault();
                        clickEvent.stopPropagation();
                        window.parent.postMessage(
                            {
                                action: 'OPEN_EXTERNAL_URL',
                                payload: { url: href },
                            },
                            '*'
                        );
                        return;
                    }
                }

                const copyCodeButton = clickEvent.target.closest('.copy-code-btn');
                if (!copyCodeButton) return;

                const codeBlockWrapper = copyCodeButton.closest('.code-block-wrapper');
                const codeElement = codeBlockWrapper.querySelector('code');
                if (!codeElement) return;

                try {
                    await copyToClipboard(codeElement.textContent);

                    globalThis.GeminiCopyFeedback.showCopied(copyCodeButton, t('copied'));
                } catch (error) {
                    console.error('Failed to copy code', error);
                }
            });
        }

        if (this.historyDiv) {
            this.historyDiv.addEventListener('scroll', () => this.handleHistoryScroll(), {
                passive: true,
            });
            this.initScrollObservers();
        }
    }

    initFooterOffsetSync() {
        this.updateFooterOffset();

        if (!this.footerEl || typeof ResizeObserver === 'undefined') return;

        this.footerResizeObserver = new ResizeObserver(() => this.updateFooterOffset());
        this.footerResizeObserver.observe(this.footerEl);
    }

    updateFooterOffset() {
        if (!this.footerEl) return;

        const rect = this.footerEl.getBoundingClientRect();
        const height = Math.ceil(rect.height || 0);
        if (height > 0) {
            document.documentElement.style.setProperty('--footer-height', `${height}px`);
        }
    }

    updateStatus(text) {
        if (this.statusDiv) {
            this.statusDiv.innerText = text;
        }
    }

    clear() {
        if (this.historyDiv) this.historyDiv.innerHTML = '';
    }

    isNearBottom(threshold = 120) {
        if (!this.historyDiv) return null;

        const distanceFromBottom =
            this.historyDiv.scrollHeight - this.historyDiv.scrollTop - this.historyDiv.clientHeight;

        return distanceFromBottom <= threshold;
    }

    getScrollState() {
        if (!this.historyDiv) return null;

        return {
            scrollTop: this.historyDiv.scrollTop,
            scrollHeight: this.historyDiv.scrollHeight,
            clientHeight: this.historyDiv.clientHeight,
            isNearBottom: this.isNearBottom(),
        };
    }

    handleHistoryScroll() {
        const isNearBottom = this.isNearBottom();
        if (isNearBottom !== null) {
            this.shouldFollowBottom = isNearBottom;
        }
    }

    initScrollObservers() {
        if (!this.historyDiv) return;

        if (typeof MutationObserver !== 'undefined') {
            const mutationObserver = new MutationObserver(() => {
                this.observeScrollableChildren();
                this.followStreamingContent();
            });
            mutationObserver.observe(this.historyDiv, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.followStreamingContent());
            this.resizeObserver.observe(this.historyDiv);
            this.observeScrollableChildren();
        }
    }

    observeScrollableChildren() {
        if (!this.resizeObserver || !this.historyDiv) return;

        Array.from(this.historyDiv.children).forEach((child) => {
            if (this.observedResizeElements.has(child)) return;
            this.observedResizeElements.add(child);
            this.resizeObserver.observe(child);
        });
    }

    scheduleBottomScroll(behavior = 'instant') {
        if (!this.historyDiv) return;
        if (this.scrollFrame !== null) return;

        this.scrollFrame = window.requestAnimationFrame(() => {
            this.scrollFrame = null;
            if (!this.historyDiv) return;
            this.historyDiv.scrollTo({
                top: this.historyDiv.scrollHeight,
                behavior,
            });
        });
    }

    followStreamingContent() {
        if (!this.shouldFollowBottom) return;
        this.scheduleBottomScroll('instant');
    }

    restoreScrollState(state) {
        if (!this.historyDiv || !state) return;

        setTimeout(() => {
            if (state.isNearBottom) {
                this.shouldFollowBottom = true;
                this.scheduleBottomScroll('instant');
                return;
            }

            this.shouldFollowBottom = false;
            const maxScrollTop = Math.max(
                0,
                this.historyDiv.scrollHeight - this.historyDiv.clientHeight
            );
            this.historyDiv.scrollTop = Math.min(state.scrollTop, maxScrollTop);
        }, 50);
    }

    scrollToBottom(options = {}) {
        if (this.historyDiv) {
            setTimeout(() => {
                if (options.mode === 'bottom') {
                    this.shouldFollowBottom = true;
                    this.scheduleBottomScroll('instant');
                    return;
                }

                // Scroll to the start of the last message to ensure visibility from the beginning
                const lastMsg = this.historyDiv.lastElementChild;
                if (lastMsg) {
                    this.historyDiv.scrollTo({
                        top: lastMsg.offsetTop - 20,
                        behavior: 'smooth',
                    });
                } else {
                    this.historyDiv.scrollTop = this.historyDiv.scrollHeight;
                }
            }, 50);
        }
    }

    getInputValue() {
        return this.inputFn?.value || '';
    }

    setInputValue(value, options = {}) {
        if (!this.inputFn) return;

        this.inputFn.value = value;
        this.inputFn.style.height = 'auto';
        if (value) {
            this.inputFn.style.height = this.inputFn.scrollHeight + 'px';
        }
        this.updateFooterOffset();
        if (options.focus) this.inputFn.focus();
    }

    resetInput() {
        this.setInputValue('', { focus: true });
    }

    togglePageContext(isActive) {
        if (this.pageContextBtn) {
            this.pageContextBtn.classList.toggle('active', isActive);
        }
    }

    toggleLiveArtifacts(isActive) {
        if (this.liveArtifactsBtn) {
            this.liveArtifactsBtn.classList.toggle('active', isActive);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.updateStatus(''); // Clear status text, only show spinner
            if (this.statusDiv) this.statusDiv.classList.add('thinking');

            if (this.sendBtn) {
                this.sendBtn.innerHTML = TemplateIcons.STOP;
                this.sendBtn.title = t('stopGenerating');
                this.sendBtn.classList.add('generating');
            }
        } else {
            this.updateStatus('');
            if (this.statusDiv) this.statusDiv.classList.remove('thinking');

            if (this.sendBtn) {
                this.sendBtn.innerHTML = TemplateIcons.SEND;
                this.sendBtn.title = t('sendMessage');
                this.sendBtn.disabled = false;
                this.sendBtn.classList.remove('generating');
            }
        }
    }
}
