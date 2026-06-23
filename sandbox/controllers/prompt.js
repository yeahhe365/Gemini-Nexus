import { appendMessage } from '../render/message.js';
import { sendToBackground, saveSessionsToStorage } from '../../shared/messaging/index.js';
import { t } from '../core/i18n.js';
import {
    normalizeMessageImages,
    normalizeUserAttachments,
} from '../../shared/attachments/index.js';
import { getLiveArtifactsSystemInstruction } from '../core/live_artifacts.js';

export class PromptController {
    constructor(sessionManager, uiController, imageManager, appController) {
        this.sessionManager = sessionManager;
        this.ui = uiController;
        this.imageManager = imageManager;
        this.app = appController;
        this.cancellationTimestamp = new Map();
    }

    buildRequestPayload(text, files, sessionId, extra = {}) {
        // Use session's model if available, otherwise use selected model
        const session = this.sessionManager.getSessionById(sessionId);
        const selectedModel = session?.model || this.app.getSelectedModel();

        const conn = this.getConnectionData();
        const liveArtifactsInstruction =
            this.app.liveArtifactsEnabled === true
                ? getLiveArtifactsSystemInstruction(this.getUiLanguage())
                : '';
        const extraSystemInstruction =
            typeof extra.systemInstruction === 'string' ? extra.systemInstruction.trim() : '';
        const systemInstruction = [liveArtifactsInstruction, extraSystemInstruction]
            .filter(Boolean)
            .join('\n\n');
        const requestExtra = { ...extra };
        delete requestExtra.systemInstruction;

        // Multi-server MCP: collect all enabled servers
        let mcpServers = [];
        if (conn && Array.isArray(conn.mcpServers) && conn.mcpServers.length > 0) {
            mcpServers = conn.mcpServers.filter(
                (serverConfig) =>
                    serverConfig &&
                    serverConfig.enabled !== false &&
                    serverConfig.url &&
                    serverConfig.url.trim()
            );
        } else if (conn && (conn.mcpServerUrl || conn.mcpTransport)) {
            // Legacy single-server fallback
            mcpServers = [
                {
                    id: '_legacy_',
                    name: '',
                    transport: conn.mcpTransport || 'sse',
                    url: conn.mcpServerUrl || '',
                    enabled: true,
                    toolMode: 'all',
                    enabledTools: [],
                },
            ];
        }

        const enableMcpTools = conn.mcpEnabled === true && mcpServers.length > 0;
        const firstServer = mcpServers[0] || null;

        return {
            action: 'SEND_PROMPT',
            text,
            files,
            model: selectedModel,
            webThinkingLevel: conn.webThinkingLevel,
            includePageContext: this.app.pageContextActive,
            enableBrowserControl: this.app.browserControlActive,
            hostIsTab: this.app.hostIsTab === true,
            enableMcpTools,
            mcpServers,
            mcpTransport: firstServer ? firstServer.transport || 'sse' : 'sse',
            mcpServerUrl: firstServer ? firstServer.url || '' : '',
            mcpServerId: firstServer ? firstServer.id : null,
            mcpToolMode: firstServer && firstServer.toolMode ? firstServer.toolMode : 'all',
            mcpEnabledTools:
                firstServer && Array.isArray(firstServer.enabledTools)
                    ? firstServer.enabledTools
                    : [],
            sessionId,
            ...(systemInstruction ? { systemInstruction } : {}),
            ...requestExtra,
        };
    }

    getUiLanguage() {
        const lang = document.documentElement.lang || '';
        return lang.toLowerCase().startsWith('en') ? 'en' : 'zh';
    }

    getConnectionData() {
        return this.ui && this.ui.settings && this.ui.settings.connectionData
            ? this.ui.settings.connectionData
            : {};
    }

    getConnectionProvider() {
        const conn = this.getConnectionData();
        if (conn.provider) return conn.provider;
        return conn.useOfficialApi === true ? 'official' : 'web';
    }

    canEditHistory() {
        return this.getConnectionProvider() !== 'web';
    }

    getMessageEditOptions(messageIndex) {
        if (!this.canEditHistory()) return {};

        return {
            onEdit: (nextText) => this.resendFromMessage(messageIndex, nextText),
        };
    }

    isSessionGenerating(sessionId) {
        if (typeof this.app.isSessionGenerating === 'function') {
            return this.app.isSessionGenerating(sessionId);
        }
        return this.app.isGenerating === true && this.app.generatingSessionId === sessionId;
    }

    isCurrentSessionGenerating() {
        if (typeof this.app.isCurrentSessionGenerating === 'function') {
            return this.app.isCurrentSessionGenerating();
        }
        return this.isSessionGenerating(this.sessionManager.currentSessionId);
    }

    setGeneratingState(isGenerating, sessionId = null, metadata = {}) {
        if (isGenerating) {
            if (typeof this.app.startSessionGeneration === 'function') {
                this.app.startSessionGeneration(sessionId, metadata);
            } else {
                this.app.isGenerating = true;
                this.app.generatingSessionId = sessionId;
            }
        } else if (typeof this.app.finishSessionGeneration === 'function') {
            this.app.finishSessionGeneration(sessionId);
        } else if (this.app.generatingSessionId === sessionId) {
            this.app.isGenerating = false;
            this.app.generatingSessionId = null;
        }
        this.ui.setLoading(this.isCurrentSessionGenerating());
        this.app.sessionFlow.refreshHistoryUI();
    }

    getMessageFiles(message) {
        const attachments = normalizeUserAttachments(message?.attachments);
        if (attachments.length > 0) return attachments;
        return this.buildFilesFromImages(normalizeMessageImages(message?.image));
    }

    buildFilesFromImages(images) {
        return images.map((base64, index) => {
            const mimeMatch = typeof base64 === 'string' ? base64.match(/^data:([^;]+);/) : null;
            const type = mimeMatch ? mimeMatch[1] : 'image/png';
            const ext = type.split('/')[1] || 'png';
            return {
                base64,
                type,
                name: `edited-message-${index + 1}.${ext}`,
            };
        });
    }

    async sendPromptText(text, files = []) {
        if (!text && files.length === 0) return;

        const previousSessionId = this.sessionManager.currentSessionId;
        if (!this.sessionManager.currentSessionId) {
            // Create session with current model
            const currentModel = this.app.getSelectedModel();
            this.sessionManager.createSession(currentModel);
        }

        const currentId = this.sessionManager.currentSessionId;
        const session = this.sessionManager.getCurrentSession();
        if (!session || this.isSessionGenerating(currentId)) return;

        // Save current model to session if not set yet
        if (!session.model) {
            const currentModel = this.app.getSelectedModel();
            this.sessionManager.setSessionModel(currentId, currentModel);
        }
        const requestModel = session.model || this.app.getSelectedModel();

        if (session.messages.length === 0) {
            const titleUpdate = this.sessionManager.updateTitle(currentId, text || t('imageSent'));
            if (titleUpdate) this.app.sessionFlow.refreshHistoryUI();
        }

        const displayAttachments = files.length > 0 ? files : null;

        const messageIndex = session.messages.length;

        appendMessage(
            this.ui.historyDiv,
            text,
            'user',
            displayAttachments,
            null,
            null,
            this.getMessageEditOptions(messageIndex)
        );

        this.sessionManager.addMessage(currentId, 'user', text, displayAttachments);

        saveSessionsToStorage(this.sessionManager.getPersistableSessions(), {
            type: 'upsertSession',
            sessionId: currentId,
        });
        this.app.clearComposerDraftAfterSend?.(previousSessionId, currentId);
        this.app.sessionFlow.switchToSession(currentId);

        if (session.context) {
            sendToBackground({
                action: 'SET_CONTEXT',
                context: session.context,
                model: requestModel,
            });
        }

        this.ui.resetInput();
        this.imageManager.clearFile();

        this.setGeneratingState(true, currentId, { model: requestModel });

        sendToBackground(this.buildRequestPayload(text, files, currentId));
    }

    async send() {
        const text = this.ui.inputFn.value.trim();
        const files = this.imageManager.getFiles();

        await this.sendPromptText(text, files);
    }

    async sendText(text) {
        const nextText = String(text || '').trim();
        await this.sendPromptText(nextText, []);
    }

    async resendFromMessage(messageIndex, editedText) {
        const currentId = this.sessionManager.currentSessionId;
        if (this.isSessionGenerating(currentId)) return false;
        if (!this.canEditHistory()) {
            this.ui.updateStatus(t('editNotSupportedForWeb'));
            setTimeout(() => {
                if (!this.isCurrentSessionGenerating()) this.ui.updateStatus('');
            }, 3000);
            return false;
        }

        const session = this.sessionManager.getCurrentSession();
        if (!session || !Array.isArray(session.messages)) return false;

        const target = session.messages[messageIndex];
        const files = this.getMessageFiles(target);
        const nextText = (editedText || '').trim();
        if (!target || target.role !== 'user' || (!nextText && files.length === 0)) {
            return false;
        }

        const editResult = this.sessionManager.editUserMessageAndTruncate(
            currentId,
            messageIndex,
            nextText
        );
        if (!editResult) return false;

        saveSessionsToStorage(this.sessionManager.getPersistableSessions(), {
            type: 'replaceSession',
            sessionId: currentId,
        });
        this.app.sessionFlow.refreshHistoryUI();
        this.app.rerender();

        this.imageManager.clearFile();
        this.ui.resetInput();
        const requestModel = session.model || this.app.getSelectedModel();
        if (!session.model) this.sessionManager.setSessionModel(currentId, requestModel);
        this.setGeneratingState(true, currentId, { model: requestModel });

        sendToBackground(
            this.buildRequestPayload(nextText, files, currentId, {
                historyOverride: editResult.previousMessages,
                sessionSnapshot: editResult.session,
            })
        );

        return true;
    }

    cancel() {
        const currentId = this.sessionManager.currentSessionId;
        if (!this.isSessionGenerating(currentId)) return;

        this.cancellationTimestamp.set(currentId, Date.now());

        sendToBackground({ action: 'CANCEL_PROMPT', sessionId: currentId });
        this.app.messageHandler.clearActiveStream();

        this.app.cancelSessionGeneration(currentId);
        this.ui.setLoading(this.isCurrentSessionGenerating());
        this.app.sessionFlow.refreshHistoryUI();
        this.ui.updateStatus(t('cancelled'));

        // Clear the cancelled status after a delay to ensure UI is fully recoverable
        setTimeout(() => {
            if (!this.isCurrentSessionGenerating()) {
                this.ui.updateStatus('');
            }
        }, 3000);
    }

    isCancellationRecent(sessionId = null) {
        const timestamp = this.cancellationTimestamp.get(sessionId) || 0;
        return Date.now() - timestamp < 2000; // 2s window
    }
}
