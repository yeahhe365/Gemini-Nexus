import { appendAiMessage, replaceSessionSnapshot } from '../../managers/history_manager.js';
import { PromptBuilder } from './prompt/builder.js';
import { ToolExecutor } from './prompt/tool_executor.js';
import {
    buildToolContinuationPrompt,
    detectPromptLanguage,
    executePendingToolResult,
    getToolResultsFiles,
    injectBrowserControlSnapshot,
    persistToolOutputMessages,
    updateBrowserControlFunctionResponses,
} from './prompt/tool_loop.js';
import { toControlTabSummary } from '../../control/tabs.js';

export { hasInlinePageSnapshot } from './prompt/tool_loop.js';

// Spaces out looped requests to avoid rate-limit bursts.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const REQUEST_CANCELLED_TEXT = 'Request cancelled.';

async function getStoredProvider() {
    const stored = await chrome.storage.local.get(['geminiProvider', 'geminiUseOfficialApi']);
    return stored.geminiProvider || (stored.geminiUseOfficialApi === true ? 'official' : 'web');
}

async function sendRuntimeMessage(message) {
    try {
        await chrome.runtime.sendMessage(message);
    } catch {}
}

function getBrowserControlTaskTitle(text) {
    const normalized = String(text || '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return 'Browser control';
    return normalized.length > 28 ? `${normalized.slice(0, 27)}...` : normalized;
}

export class PromptHandler {
    constructor(sessionManager, controlManager, mcpManager) {
        this.sessionManager = sessionManager;
        this.controlManager = controlManager;
        this.builder = new PromptBuilder(controlManager, mcpManager);
        this.toolExecutor = new ToolExecutor(controlManager, mcpManager);
        this.activeRuns = new Map();
    }

    cancel(sessionId = null) {
        if (sessionId) {
            this.cancelActiveRun({ sessionId });
            return;
        }
        this.cancelAllActiveRuns();
    }

    createCancellationReply(request) {
        return {
            action: 'GEMINI_REPLY',
            sessionId: request?.sessionId || null,
            text: REQUEST_CANCELLED_TEXT,
            status: 'cancelled',
        };
    }

    getRunKey(sessionId) {
        return sessionId || '__default__';
    }

    cancelAllActiveRuns({ notify = false } = {}) {
        let cancelled = false;
        for (const run of this.activeRuns.values()) {
            if (run && !run.cancelled) {
                run.cancelled = true;
                if (notify) {
                    sendRuntimeMessage(this.createCancellationReply(run.request));
                }
                cancelled = true;
            }
        }
        this.activeRuns.clear();
        this.sessionManager?.cancelCurrentRequest?.();
        return cancelled;
    }

    cancelActiveRun({ sessionId = null, notify = false } = {}) {
        const runKey = this.getRunKey(sessionId);
        const run = this.activeRuns.get(runKey);
        if (!run || run.cancelled) return false;

        run.cancelled = true;
        this.activeRuns.delete(runKey);
        this.sessionManager?.cancelCurrentRequest?.(sessionId);
        if (notify) {
            sendRuntimeMessage(this.createCancellationReply(run.request));
        }
        return true;
    }

    isRunCancelled(run) {
        return !run || run.cancelled || this.activeRuns.get(run.runKey) !== run;
    }

    handle(request, sendResponse) {
        const sessionId = request.sessionId || null;
        const runKey = this.getRunKey(sessionId);
        this.cancelActiveRun({ sessionId, notify: true });

        const run = {
            runKey,
            sessionId,
            request,
            cancelled: false,
        };
        this.activeRuns.set(runKey, run);

        (async () => {
            const onUpdate = (partialText, partialThoughts) => {
                // Catch errors if receiver (UI) is closed/unavailable
                chrome.runtime
                    .sendMessage({
                        action: 'GEMINI_STREAM_UPDATE',
                        sessionId: request.sessionId || null,
                        text: partialText,
                        thoughts: partialThoughts,
                    })
                    .catch(() => {});
            };

            try {
                if (request.sessionSnapshot) {
                    const provider = await getStoredProvider();
                    if (provider === 'web') {
                        throw new Error('History editing is not supported for Gemini Web Client.');
                    }
                    const snapshotSaved = await replaceSessionSnapshot(request.sessionSnapshot);
                    if (!snapshotSaved) {
                        throw new Error('Could not save edited session before sending prompt.');
                    }
                }

                // AUTO-LOCK: If browser control enabled and no tab locked, lock to active tab
                if (request.enableBrowserControl && this.controlManager) {
                    const targetSidePanelTabId = request.sidePanelTabId || null;
                    this.controlManager.setOwnerSidePanelTabId(targetSidePanelTabId);
                    this.controlManager.setControlTaskTitle(
                        getBrowserControlTaskTitle(request.text)
                    );
                    const currentLock = this.controlManager.getTargetTabId();
                    if (!currentLock) {
                        await this.controlManager.enableControl({
                            createDefaultTab: request.hostIsTab === true && !targetSidePanelTabId,
                        });
                        const lockedTabId = this.controlManager.getTargetTabId();
                        if (lockedTabId) {
                            try {
                                const tab = await chrome.tabs.get(lockedTabId);
                                // Notify UI to update the Tab Switcher icon so user knows which tab is locked
                                chrome.runtime
                                    .sendMessage({
                                        action: 'TAB_LOCKED',
                                        tabId: targetSidePanelTabId,
                                        tab: toControlTabSummary(tab),
                                    })
                                    .catch(() => {});
                            } catch {}
                        }
                    }
                }

                // Build the user prompt and separate system instruction.
                const buildResult = await this.builder.build(request);
                const systemInstruction = buildResult.systemInstruction;
                let currentPromptText = buildResult.userPrompt;
                let currentHistoryText = request.text;
                const continuationLanguage = detectPromptLanguage(request.text);

                let currentFiles = request.files;

                let loopCount = 0;
                // 0 means unlimited (Infinity). Default to 0 if undefined.
                const reqLoops = request.maxLoops !== undefined ? request.maxLoops : 0;
                const MAX_LOOPS = reqLoops === 0 ? Infinity : reqLoops;

                let keepLooping = true;

                // --- AUTOMATED FEEDBACK LOOP ---
                while (keepLooping && loopCount < MAX_LOOPS) {
                    if (this.isRunCancelled(run)) break;

                    const result = await this.sessionManager.handleSendPrompt(
                        {
                            ...request,
                            text: currentPromptText,
                            historyPromptText: currentHistoryText,
                            systemInstruction,
                            files: currentFiles,
                        },
                        onUpdate
                    );

                    if (this.isRunCancelled(run)) break;

                    if (!result || result.status !== 'success') {
                        // If error, notify UI and break loop
                        if (result) chrome.runtime.sendMessage(result).catch(() => {});
                        break;
                    }

                    const { toolResult, pendingNativeCalls } = await executePendingToolResult({
                        result,
                        request,
                        loopCount,
                        toolExecutor: this.toolExecutor,
                        onUpdate,
                    });

                    if (this.isRunCancelled(run)) break;

                    if (toolResult) {
                        // Feed tool output back to the model and continue the loop.
                        loopCount++;
                        const allToolFiles = getToolResultsFiles(
                            toolResult.results || [toolResult]
                        );
                        currentFiles = allToolFiles; // Send new files if any, or clear previous files

                        const outputForModel = await injectBrowserControlSnapshot({
                            toolResult,
                            outputForModel: toolResult.outputForModel,
                            request,
                            controlManager: this.controlManager,
                        });

                        const isOfficialFunctionResponse =
                            Array.isArray(toolResult.officialResponseParts) &&
                            toolResult.officialResponseParts.length > 0;

                        const nextToolResult = isOfficialFunctionResponse
                            ? updateBrowserControlFunctionResponses(toolResult, outputForModel)
                            : toolResult;

                        // Format observation for the model. Official native function
                        // calls use functionResponse parts instead of synthetic text.
                        currentPromptText = isOfficialFunctionResponse
                            ? ''
                            : buildToolContinuationPrompt(
                                  toolResult.toolName,
                                  outputForModel,
                                  continuationLanguage
                              );

                        // Save "User" message (Tool Output) to history to keep context in sync
                        // NOTE: We do NOT save the massive auto-snapshot text to the user history to keep the UI clean.
                        const persistedHistoryText = await persistToolOutputMessages({
                            request,
                            result,
                            toolResult: nextToolResult,
                            loopCount,
                            pendingNativeCalls,
                            sendRuntimeMessage,
                        });
                        if (persistedHistoryText !== null) {
                            currentHistoryText = persistedHistoryText;
                        }

                        if (isOfficialFunctionResponse) {
                            currentFiles = [];
                            request.officialUserParts = nextToolResult.officialResponseParts;
                            request.officialFunctionResponseBatchId =
                                nextToolResult.officialResponseBatchId;
                        } else {
                            request.officialUserParts = null;
                            request.officialFunctionResponseBatchId = null;
                        }

                        // === RATE LIMIT MITIGATION ===
                        // Wait 2-4 seconds before sending the next request.
                        // This prevents "No valid response" errors caused by rapid-fire requests.
                        await delay(2000 + Math.random() * 2000);

                        if (this.isRunCancelled(run)) break;
                    } else {
                        // No tool execution, final answer reached.
                        // Only final replies are persisted and sent as GEMINI_REPLY.
                        // Intermediate tool-call JSON is consumed by the loop and should not
                        // terminate the UI streaming state.
                        if (request.sessionId) {
                            await appendAiMessage(request.sessionId, result);
                        }

                        chrome.runtime.sendMessage(result).catch(() => {});
                        keepLooping = false;
                    }
                }
            } catch (error) {
                console.error('Prompt loop error:', error);
                if (!this.isRunCancelled(run)) {
                    chrome.runtime
                        .sendMessage({
                            action: 'GEMINI_REPLY',
                            sessionId: request.sessionId || null,
                            text: 'Error: ' + error.message,
                            status: 'error',
                        })
                        .catch(() => {});
                }
            } finally {
                if (this.activeRuns.get(run.runKey) === run) {
                    this.activeRuns.delete(run.runKey);
                }
                sendResponse({ status: 'completed' });
            }
        })();
        return true;
    }
}
