import { appendContextCompressionNotice } from '../render/context_compression.js';
import { appendMessage } from '../render/message.js';
import { hasDisplayableText, hasDisplayableThoughts } from '../core/displayable_content.js';
import { t } from '../core/i18n.js';
import { isToolCallOnlyText, splitToolCallFromText } from '../../shared/text/tool_call_text.js';

export class MessageStreamState {
    constructor() {
        this.states = new Map();
    }

    cache(request) {
        const sessionId = request?.sessionId || null;
        if (!sessionId) return null;

        const previous = this.states.get(sessionId) || {};
        const next = {
            ...previous,
            sessionId,
        };

        if (request.text !== undefined) {
            const rawText = request.text || '';
            const split = splitToolCallFromText(rawText, { allowPartial: true });
            next.rawText = rawText;
            next.text = split.displayText;
            if (split.hasToolCall) {
                next.toolCallText = split.toolCallText;
            }
        }
        if (request.thoughts !== undefined) {
            next.thoughts = request.thoughts || '';
        }
        if (hasDisplayableThoughts(next.thoughts)) {
            if (!Number.isFinite(next.thoughtsStartedAt)) {
                const elapsedSeconds = Number.isFinite(next.thoughtsElapsedSeconds)
                    ? next.thoughtsElapsedSeconds
                    : 0;
                next.thoughtsStartedAt = Date.now() - elapsedSeconds * 1000;
            }
            next.thoughtsElapsedSeconds = Math.max(0, (Date.now() - next.thoughtsStartedAt) / 1000);
        }
        if (request.contextState !== undefined) {
            next.contextState = request.contextState || null;
        }

        this.states.set(sessionId, next);
        return next;
    }

    clear(sessionId = null) {
        if (sessionId) {
            this.states.delete(sessionId);
            return;
        }
        this.states.clear();
    }

    get(sessionId) {
        return sessionId ? this.states.get(sessionId) : null;
    }

    getToolCallText(sessionId) {
        const state = this.get(sessionId);
        if (typeof state?.toolCallText === 'string' && state.toolCallText.trim()) {
            return state.toolCallText;
        }
        const split = splitToolCallFromText(state?.rawText || state?.text || '', {
            allowPartial: true,
        });
        return split.toolCallText;
    }

    getRawText(sessionId) {
        const state = this.get(sessionId);
        return typeof state?.rawText === 'string' ? state.rawText : state?.text || '';
    }

    getThoughts(sessionId) {
        const state = this.get(sessionId);
        return typeof state?.thoughts === 'string' ? state.thoughts : '';
    }

    getRequestToolCallText(request, sessionId) {
        const requestText = typeof request?.toolCallText === 'string' ? request.toolCallText : '';
        const split = splitToolCallFromText(requestText, { allowPartial: true });
        if (split.hasToolCall) return split.toolCallText;
        if (isToolCallOnlyText(requestText, { allowPartial: true })) return requestText.trim();
        return this.getToolCallText(sessionId);
    }
}

export function createStreamingBubble(handler, state = {}) {
    const bubble = appendMessage(handler.ui.historyDiv, '', 'ai', null, '', null, {
        isStreaming: true,
        thoughtsStartedAt: state.thoughtsStartedAt,
        thoughtsElapsedSeconds: state.thoughtsElapsedSeconds,
    });

    bubble.update(state.text || '', state.thoughts || '', {
        isStreaming: true,
        thoughtsStartedAt: state.thoughtsStartedAt,
        thoughtsElapsedSeconds: state.thoughtsElapsedSeconds,
    });
    handler.streamingBubble = bubble;
}

export function finalizeActiveStream(handler, state = {}) {
    if (!handler.streamingBubble) return;
    let finalText;
    if (state.clearToolCallJson) {
        const split = splitToolCallFromText(state.text || '', { allowPartial: true });
        if (split.hasToolCall) {
            finalText = split.displayText;
        } else if (isToolCallOnlyText(state.text, { allowPartial: true })) {
            finalText = '';
        }
        finalText = finalText || '';
    }
    if (
        state.clearToolCallJson &&
        !hasDisplayableText(finalText) &&
        !hasDisplayableThoughts(state.thoughts)
    ) {
        if (typeof handler.streamingBubble.dispose === 'function') {
            handler.streamingBubble.dispose();
        }
        if (
            handler.streamingBubble.div &&
            typeof handler.streamingBubble.div.remove === 'function'
        ) {
            handler.streamingBubble.div.remove();
        }
        handler.streamingBubble = null;
        return;
    }
    if (typeof handler.streamingBubble.finalize === 'function') {
        const finalThoughts = hasDisplayableThoughts(state.thoughts) ? state.thoughts : undefined;
        handler.streamingBubble.finalize(finalText, finalThoughts, {
            suppressCopy: state.clearToolCallJson === true,
        });
    } else if (typeof handler.streamingBubble.dispose === 'function') {
        handler.streamingBubble.dispose();
    }
    handler.streamingBubble = null;
}

export function resetStream(handler, options = {}) {
    if (handler.streamingBubble) {
        if (typeof handler.streamingBubble.dispose === 'function') {
            handler.streamingBubble.dispose();
        }
        if (options.remove === true && handler.streamingBubble.div) {
            handler.streamingBubble.div.remove();
        }
        handler.streamingBubble = null;
    }
    if (handler.contextCompressionNotice && options.remove === true) {
        handler.contextCompressionNotice.dispose?.();
    }
    handler.contextCompressionNotice = null;
}

export function clearActiveStream(handler) {
    const activeSessionId = handler.sessionManager.currentSessionId || null;
    handler.clearStreamState(activeSessionId);
    handler.resetStream({ remove: true });
}

export function restoreStreamForSession(handler, sessionId, hasPersistedAiReply) {
    const isGenerating =
        typeof handler.app.isSessionGenerating === 'function'
            ? handler.app.isSessionGenerating(sessionId)
            : handler.app.isGenerating === true && handler.app.generatingSessionId === sessionId;
    if (!sessionId || !isGenerating) return;
    const state = handler.streamState.get(sessionId);
    if (!state) return;
    const session = handler.sessionManager.getCurrentSession();
    if (hasPersistedAiReply(session, state)) {
        handler.clearStreamState(sessionId);
        return;
    }

    handler.resetStream();
    if (state.contextState === 'compressing') {
        handler.contextCompressionNotice = appendContextCompressionNotice(
            handler.ui.historyDiv,
            t('contextCompressing')
        );
    }
    createStreamingBubble(handler, state);
    handler.ui.setLoading(true);
}
