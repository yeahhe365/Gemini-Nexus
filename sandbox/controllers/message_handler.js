import { appendContextCompressionNotice } from '../render/context_compression.js';
import { t } from '../core/i18n.js';
import {
    handleCropScreenshotResult,
    handleGeneratedImageFetchResult,
    handleImageFetchResult,
    handleSelectionTextResult,
} from './message_results.js';
import { MessageReplyRenderState, renderGeminiReply } from './message_reply_renderer.js';
import {
    MessageStreamState,
    clearActiveStream as clearActiveStreamHelper,
    createStreamingBubble as createStreamingBubbleHelper,
    finalizeActiveStream as finalizeActiveStreamHelper,
    resetStream as resetStreamHelper,
    restoreStreamForSession as restoreStreamForSessionHelper,
} from './message_stream_state.js';
import {
    handleToolCallStatusMessage as handleToolCallStatusMessageRequest,
    handleToolOutputMessage as handleToolOutputMessageRequest,
} from './message_tool_messages.js';

export class MessageHandler {
    constructor(sessionManager, uiController, imageManager, appController) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;
        this.app = appController; // Reference back to app for state like captureMode
        this.streamingBubble = null;
        this.contextCompressionNotice = null;
        this.streamState = new MessageStreamState();
        this.replyRenderState = new MessageReplyRenderState();
    }

    async handle(request) {
        switch (request.action) {
            case 'MCP_TEST_RESULT':
                this.handleMcpTestResult(request);
                return;
            case 'MCP_TOOLS_RESULT':
                this.handleMcpToolsResult(request);
                return;
            case 'PROVIDER_MODELS_RESULT':
                this.handleProviderModelsResult(request);
                return;
            case 'GEMINI_STREAM_UPDATE':
                this.handleStreamUpdate(request);
                return;
            case 'GEMINI_CONTEXT_STATUS':
                this.handleContextStatus(request);
                return;
            case 'GEMINI_REPLY':
                this.handleGeminiReply(request);
                return;
            case 'TOOL_OUTPUT_MESSAGE':
                this.handleToolOutputMessage(request);
                return;
            case 'TOOL_CALL_STATUS_MESSAGE':
                this.handleToolCallStatusMessage(request);
                return;
            case 'FETCH_IMAGE_RESULT':
                this.handleImageResult(request);
                return;
            case 'SCREEN_CAPTURE_ERROR':
                this.handleScreenCaptureError(request);
                return;
            case 'GENERATED_IMAGE_RESULT':
                await this.handleGeneratedImageResult(request);
                return;
            case 'CROP_SCREENSHOT':
                await this.handleCropResult(request);
                return;
            case 'SELECTION_RESULT':
                this.handleSelectionResult(request);
                return;
            default:
                return;
        }
    }

    handleMcpTestResult(request) {
        if (typeof this.ui?.settings?.updateMcpTestResult === 'function') {
            this.ui.settings.updateMcpTestResult(request);
        }
    }

    handleMcpToolsResult(request) {
        if (typeof this.ui?.settings?.updateMcpToolsResult === 'function') {
            this.ui.settings.updateMcpToolsResult(request);
        }
    }

    handleProviderModelsResult(request) {
        if (typeof this.ui?.settings?.updateProviderModelsResult === 'function') {
            this.ui.settings.updateProviderModelsResult(request);
        }
    }

    handleScreenCaptureError(request) {
        this.ui.updateStatus(request.error || t('screenCaptureFailed'));
        setTimeout(() => this.ui.updateStatus(''), 3000);
    }

    isCurrentSessionMessage(request) {
        const currentSessionId = this.sessionManager.currentSessionId || null;
        const messageSessionId = request.sessionId || null;
        return currentSessionId !== null && messageSessionId === currentSessionId;
    }

    isGeneratingSessionMessage(request) {
        const messageSessionId = request.sessionId || null;
        if (typeof this.app.isSessionGenerating === 'function') {
            return this.app.isSessionGenerating(messageSessionId);
        }
        return this.app.isGenerating === true && this.app.generatingSessionId === messageSessionId;
    }

    isCurrentSessionGenerating() {
        if (typeof this.app.isCurrentSessionGenerating === 'function') {
            return this.app.isCurrentSessionGenerating();
        }
        return this.isGeneratingSessionMessage({ sessionId: this.sessionManager.currentSessionId });
    }

    hasPersistedAiReply(session, request) {
        return this.replyRenderState.hasPersistedAiReply(session, request);
    }

    markSessionRenderedFromStorage(sessionId, messageCount) {
        this.replyRenderState.markSessionRenderedFromStorage(sessionId, messageCount);
    }

    hasStorageRenderedAiReply(session, request) {
        return this.replyRenderState.hasStorageRenderedAiReply(session, request);
    }

    getRequestSessionId(request) {
        return request?.sessionId || null;
    }

    clearStreamState(sessionId = null) {
        this.streamState.clear(sessionId);
    }

    handleStreamUpdate(request) {
        const sessionId = this.getRequestSessionId(request);
        if (!this.isGeneratingSessionMessage(request)) return;

        // Prevent race condition: Ignore stream updates arriving shortly after user cancelled
        if (this.app.prompt.isCancellationRecent(sessionId)) {
            this.clearStreamState(sessionId);
            return;
        }

        const state = this.streamState.cache(request);
        const displayText = state?.text || '';

        if (!this.isCurrentSessionMessage(request)) {
            // Keep background session streams cached without re-rendering the sidebar on
            // every token. Rebuilding the history list during hover/click makes the
            // generating row flicker and can prevent selecting that session.
            return;
        }

        if (!this.streamingBubble) {
            createStreamingBubbleHelper(this, state);
        }

        this.streamingBubble.update(displayText, request.thoughts, { isStreaming: true });
        this.ui.setLoading(this.isCurrentSessionGenerating());
    }

    handleContextStatus(request) {
        if (!this.isGeneratingSessionMessage(request)) return;
        const state = this.streamState.cache({
            ...request,
            contextState: request.state === 'compressing' ? request.state : null,
        });
        if (!this.isCurrentSessionMessage(request)) return;

        if (request.state === 'compressing') {
            if (this.contextCompressionNotice) {
                this.contextCompressionNotice.dispose?.();
            }
            this.contextCompressionNotice = appendContextCompressionNotice(
                this.ui.historyDiv,
                t('contextCompressing')
            );
            return;
        }

        if (!this.contextCompressionNotice) return;

        if (request.state === 'compressed') {
            this.contextCompressionNotice.update(t('contextCompressed'));
            this.contextCompressionNotice = null;
            if (state) state.contextState = null;
            return;
        }

        if (request.state === 'compression_failed') {
            this.contextCompressionNotice.update(t('contextCompressionFallback'));
            this.contextCompressionNotice = null;
            if (state) state.contextState = null;
        }
    }

    handleGeminiReply(request) {
        const sessionId = this.getRequestSessionId(request);
        const wasGenerating = this.isGeneratingSessionMessage(request);
        if (wasGenerating) {
            if (typeof this.app.finishSessionGeneration === 'function') {
                this.app.finishSessionGeneration(sessionId);
            } else if (this.app.generatingSessionId === sessionId) {
                this.app.isGenerating = false;
                this.app.generatingSessionId = null;
            }
        }
        this.clearStreamState(sessionId);
        this.ui.setLoading(this.isCurrentSessionGenerating());
        this.app.sessionFlow.refreshHistoryUI();

        // Background session completion: keep the current visible stream untouched.
        if (!this.isCurrentSessionMessage(request)) {
            const targetSession = this.sessionManager.getSessionById(sessionId);
            if (targetSession && request.status === 'success') {
                this.sessionManager.updateContext(sessionId, request.context);
            }
            return;
        }

        // Current session: render the reply normally
        const session = this.sessionManager.getCurrentSession();
        renderGeminiReply(this, session, request);

        // Recovery: If this was a cancellation or error, ensure UI is in a fully recoverable state
        // Clear any lingering status messages and double-check the UI state after a delay
        if (request.status === 'cancelled' || request.status === 'error') {
            setTimeout(() => {
                // Only clear if no new generation has started in the current session
                if (!this.isCurrentSessionGenerating()) {
                    this.ui.updateStatus('');
                    // Double-check that loading state is cleared (safety measure)
                    this.ui.setLoading(false);
                }
            }, 3000);
        }
    }

    handleToolOutputMessage(request) {
        return handleToolOutputMessageRequest(this, request);
    }

    handleToolCallStatusMessage(request) {
        return handleToolCallStatusMessageRequest(this, request);
    }

    finalizeActiveStream(state = {}) {
        finalizeActiveStreamHelper(this, state);
    }

    getStreamToolCallText(sessionId) {
        return this.streamState.getToolCallText(sessionId);
    }

    getStreamRawText(sessionId) {
        return this.streamState.getRawText(sessionId);
    }

    getStreamThoughts(sessionId) {
        return this.streamState.getThoughts(sessionId);
    }

    getRequestToolCallText(request, sessionId) {
        return this.streamState.getRequestToolCallText(request, sessionId);
    }

    handleImageResult(request) {
        handleImageFetchResult(request, {
            ui: this.ui,
            imageManager: this.imageManager,
        });
    }

    async handleGeneratedImageResult(request) {
        await handleGeneratedImageFetchResult(request, {
            removeWatermark: this.ui?.settings?.generatedImageWatermarkRemovalEnabled !== false,
        });
    }

    async handleCropResult(request) {
        await handleCropScreenshotResult(request, {
            ui: this.ui,
            imageManager: this.imageManager,
            app: this.app,
        });
    }

    handleSelectionResult(request) {
        handleSelectionTextResult(request, { ui: this.ui });
    }

    // Called by AppController on cancel/switch
    resetStream(options = {}) {
        resetStreamHelper(this, options);
    }

    clearActiveStream() {
        clearActiveStreamHelper(this);
    }

    restoreStreamForSession(sessionId) {
        restoreStreamForSessionHelper(this, sessionId, (session, state) =>
            this.hasPersistedAiReply(session, state)
        );
    }
}
