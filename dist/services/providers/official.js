import {
    DEFAULT_OFFICIAL_BASE_URL,
    DEFAULT_OFFICIAL_MODEL,
    DEFAULT_THINKING_LEVEL,
} from '../../shared/config/constants.js';
import {
    attachmentToInlineData,
    normalizeUserAttachments,
} from '../../shared/attachments/index.js';
import { debugLog } from '../../shared/logging/debug.js';
import { readSseJson } from './sse.js';

function extractGroundingSources(groundingMetadata) {
    if (!groundingMetadata || !Array.isArray(groundingMetadata.groundingChunks)) {
        return [];
    }

    const sources = [];

    groundingMetadata.groundingChunks.forEach((chunk) => {
        const web = chunk && typeof chunk === 'object' ? chunk.web : null;
        if (!web || !web.uri) return;

        let title = web.title || web.uri;
        try {
            if (!web.title) {
                title = new URL(web.uri).hostname;
            }
        } catch {}

        sources.push({
            title,
            url: web.uri,
        });
    });

    return sources;
}

function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
    if (value === undefined) return undefined;
    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
}

function hasNativePart(part) {
    return (
        isPlainObject(part) &&
        (part.text !== undefined ||
            isPlainObject(part.functionCall) ||
            isPlainObject(part.functionResponse) ||
            isPlainObject(part.inlineData) ||
            part.thought !== undefined ||
            part.thoughtSignature !== undefined)
    );
}

function cloneOfficialParts(parts) {
    if (!Array.isArray(parts)) return [];
    return parts
        .filter(hasNativePart)
        .map((part) => cloneJson(part))
        .filter(Boolean);
}

function normalizeFunctionCall(part, partIndex) {
    const functionCall = part && isPlainObject(part.functionCall) ? part.functionCall : null;
    const name = typeof functionCall?.name === 'string' ? functionCall.name.trim() : '';
    if (!name) return null;

    return {
        id: typeof functionCall.id === 'string' ? functionCall.id : null,
        name,
        args: isPlainObject(functionCall.args) ? cloneJson(functionCall.args) : {},
        partIndex,
    };
}

function addAttachmentParts(parts, attachments) {
    normalizeUserAttachments(attachments).forEach((attachment) => {
        const inlineData = attachmentToInlineData(attachment);
        if (inlineData) {
            parts.push({ inlineData });
        }
    });
}

function buildMessageContent(historyMessage, targetModel) {
    void targetModel;
    const fallbackRole = historyMessage?.role === 'ai' ? 'model' : 'user';

    if (historyMessage?.kind === 'tool-output' && historyMessage.officialFunctionResponseBatchId) {
        return { role: fallbackRole, parts: [] };
    }

    const nativeContent = isPlainObject(historyMessage?.officialContent)
        ? historyMessage.officialContent
        : null;
    const nativeParts = nativeContent
        ? cloneOfficialParts(nativeContent.parts)
        : cloneOfficialParts(historyMessage?.officialParts);

    if (nativeParts.length > 0) {
        return {
            role:
                nativeContent?.role === 'model' || nativeContent?.role === 'user'
                    ? nativeContent.role
                    : fallbackRole,
            parts: nativeParts,
        };
    }

    const parts = [];

    if (historyMessage.role === 'ai') {
        // Model turn. For Gemini 3 function-calling, thought signatures must
        // stay attached to their original native parts; legacy text-only
        // history can only preserve a single signature on the text part.
        if (historyMessage.text !== undefined) {
            parts.push({ text: historyMessage.text });
        }
    } else {
        // User turn
        if (historyMessage.text) parts.push({ text: historyMessage.text });

        if (Array.isArray(historyMessage.attachments) && historyMessage.attachments.length > 0) {
            addAttachmentParts(parts, historyMessage.attachments);
        } else if (historyMessage.image && Array.isArray(historyMessage.image)) {
            addAttachmentParts(parts, historyMessage.image);
        }
    }

    return { role: fallbackRole, parts };
}

function normalizeOfficialModel(model) {
    if (model === 'gemini-3-flash') return 'gemini-3-flash-preview';
    if (model === 'gemini-3-flash-thinking') return 'gemini-3-flash-preview';
    if (model === 'gemini-3-pro') return 'gemini-3.1-pro-preview';
    if (model === 'gemini-3-pro-preview') return 'gemini-3.1-pro-preview';
    return model;
}

function normalizeThinkingLevelForModel(targetModel, thinkingLevel) {
    if (targetModel === 'gemini-3.1-pro-preview' && thinkingLevel === 'minimal') {
        return DEFAULT_THINKING_LEVEL;
    }
    return thinkingLevel;
}

export function extractOfficialResponseData(candidate) {
    const modelParts = [];
    const functionCalls = [];
    const seenFunctionCallIds = new Set();
    let text = '';
    let thoughts = '';
    let thoughtSignature = null;

    if (!candidate?.content || !Array.isArray(candidate.content.parts)) {
        return {
            text,
            thoughts,
            thoughtSignature,
            officialContent: null,
            functionCalls,
        };
    }

    candidate.content.parts.forEach((part, partIndex) => {
        if (!isPlainObject(part)) return;

        modelParts.push(cloneJson(part));

        if (part.thought === true && part.text) {
            thoughts += part.text;
        } else if (typeof part.thought === 'string') {
            thoughts += part.thought;
        } else if (part.text) {
            text += part.text;
        }

        const functionCall = normalizeFunctionCall(part, partIndex);
        if (functionCall) {
            const key =
                functionCall.id ||
                `${partIndex}:${functionCall.name}:${JSON.stringify(functionCall.args)}`;
            if (!seenFunctionCallIds.has(key)) {
                seenFunctionCallIds.add(key);
                functionCalls.push(functionCall);
            }
        }

        if (part.thoughtSignature) {
            thoughtSignature = part.thoughtSignature;
        }
    });

    return {
        text,
        thoughts,
        thoughtSignature,
        officialContent:
            modelParts.length > 0
                ? { role: candidate.content.role || 'model', parts: modelParts }
                : null,
        functionCalls,
    };
}

/**
 * Sends a message using the Official Google Gemini API.
 */
export async function sendOfficialMessage(
    prompt,
    systemInstruction,
    history,
    config,
    thinkingLevel,
    files,
    enableWebSearch,
    signal,
    onUpdate
) {
    let { baseUrl, apiKey, model: modelName, configuredModels } = config || {};
    if (!apiKey) throw new Error('API Key is missing.');
    if (!baseUrl) baseUrl = DEFAULT_OFFICIAL_BASE_URL;

    let targetModel = modelName;

    if (!targetModel) {
        const configured = (configuredModels || '')
            .split(',')
            .map((configuredModel) => configuredModel.trim())
            .filter(Boolean);
        targetModel = configured[0] || DEFAULT_OFFICIAL_MODEL;
    }

    targetModel = normalizeOfficialModel(targetModel);

    debugLog(`[Gemini Official API] Requesting ${targetModel} (Original: ${modelName})...`);

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const url = `${normalizedBaseUrl}/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const contents = [];

    if (history && Array.isArray(history)) {
        history.forEach((historyMessage) => {
            const content = buildMessageContent(historyMessage, targetModel);
            if (content.parts.length > 0) {
                contents.push(content);
            }
        });
    }

    const configuredCurrentParts = cloneOfficialParts(config?.officialUserParts);
    const currentParts = configuredCurrentParts.length > 0 ? configuredCurrentParts : [];
    if (configuredCurrentParts.length === 0 && prompt) currentParts.push({ text: prompt });

    if (configuredCurrentParts.length === 0 && files && files.length > 0) {
        addAttachmentParts(currentParts, files);
    }

    if (currentParts.length > 0) {
        contents.push({ role: 'user', parts: currentParts });
    }

    const payload = {
        contents: contents,
        generationConfig: {
            temperature: 1.0, // Official recommendation: Lock to 1.0 to prevent reasoning degradation
        },
    };

    if (enableWebSearch) {
        payload.tools = [{ google_search: {} }];
    }

    // Apply Thinking Config if requested or user has configured it level
    // Specifically enable thinking for "Thinking" model variant
    if (modelName === 'gemini-3-flash-thinking' || thinkingLevel) {
        payload.generationConfig.thinkingConfig = {
            includeThoughts: true, // Ensure thoughts are returned in response
            thinkingLevel: normalizeThinkingLevelForModel(
                targetModel,
                thinkingLevel || DEFAULT_THINKING_LEVEL
            ),
        };
    }

    if (systemInstruction) {
        payload.systemInstruction = {
            parts: [{ text: systemInstruction }],
        };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    let fullText = '';
    let fullThoughts = '';
    let finalThoughtSignature = null;
    const modelParts = [];
    const functionCalls = [];
    const sources = [];
    const seenSourceUrls = new Set();

    await readSseJson(response, (streamEvent) => {
        const candidate =
            streamEvent.candidates && streamEvent.candidates[0] ? streamEvent.candidates[0] : null;

        if (candidate && candidate.groundingMetadata) {
            extractGroundingSources(candidate.groundingMetadata).forEach((source) => {
                if (!source.url || seenSourceUrls.has(source.url)) return;
                seenSourceUrls.add(source.url);
                sources.push(source);
            });
        }

        if (candidate && candidate.content) {
            const parsed = extractOfficialResponseData(candidate);
            if (parsed.officialContent) {
                modelParts.push(...parsed.officialContent.parts);
            }
            if (parsed.functionCalls.length > 0) {
                functionCalls.push(...parsed.functionCalls);
            }
            if (parsed.text) fullText += parsed.text;
            if (parsed.thoughts) fullThoughts += parsed.thoughts;
            if (parsed.thoughtSignature) finalThoughtSignature = parsed.thoughtSignature;

            if (fullText || fullThoughts) {
                onUpdate(fullText, fullThoughts);
            }
        }
    });

    const seenCallIds = new Set();
    const dedupedFunctionCalls = functionCalls.filter((call) => {
        if (!call?.id) return true;
        if (seenCallIds.has(call.id)) return false;
        seenCallIds.add(call.id);
        return true;
    });

    return {
        text: fullText,
        thoughts: fullThoughts || null,
        sources,
        images: [],
        context: null, // Stateless
        thoughtSignature: finalThoughtSignature,
        officialContent: modelParts.length > 0 ? { role: 'model', parts: modelParts } : null,
        functionCalls: dedupedFunctionCalls,
    };
}
