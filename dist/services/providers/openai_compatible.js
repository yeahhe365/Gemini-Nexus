import { debugLog } from '../../shared/logging/debug.js';
import {
    assertCurrentAttachmentsSupported,
    buildChatMessages,
    buildResponsesInput,
    hasImageAttachmentsInRequest,
    normalizeBaseUrl,
} from './openai_payloads.js';
import {
    extractReasoningSummaryFromCompletedResponse,
    extractReasoningSummaryFromResponseItem,
    extractSourcesFromAnnotation,
    extractSourcesFromResponseItem,
    extractTextFromCompletedResponse,
    readErrorMessage,
} from './openai_response_extractors.js';
import { readSseJson } from './sse.js';

function isXAIBaseUrl(baseUrl) {
    try {
        const hostname = new URL(baseUrl).hostname.toLowerCase();
        return hostname === 'x.ai' || hostname.endsWith('.x.ai');
    } catch {
        return false;
    }
}

function mergePlainObject(target, source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
    return Object.assign(target, source);
}

function extractReasoningText(container = {}) {
    if (typeof container.reasoning_content === 'string') return container.reasoning_content;
    if (typeof container.reasoning === 'string') return container.reasoning;
    if (!Array.isArray(container.reasoning_details)) return '';

    return container.reasoning_details
        .map((detail) => detail?.text || detail?.summary || '')
        .filter(Boolean)
        .join('');
}

/**
 * Sends a message using an OpenAI Compatible API.
 */
export async function sendOpenAIMessage(
    prompt,
    systemInstruction,
    history,
    config,
    files,
    signal,
    onUpdate
) {
    let { baseUrl, apiKey, model } = config;

    if (!baseUrl) throw new Error('Base URL is missing.');
    if (!model) throw new Error('Model ID is missing.');

    baseUrl = normalizeBaseUrl(baseUrl);
    const useResponsesApi = config?.useResponsesApi === true;
    const webSearch = config?.webSearch === true;
    assertCurrentAttachmentsSupported(files);
    if (useResponsesApi) {
        return sendOpenAIResponsesMessage(
            prompt,
            systemInstruction,
            history,
            { ...config, baseUrl, apiKey, model },
            files,
            signal,
            onUpdate
        );
    }

    const url = `${baseUrl}/chat/completions`;

    const payload = {
        model: model,
        messages: buildChatMessages(prompt, systemInstruction, history, files),
        stream: true,
    };

    if (config.reasoningEffort) {
        payload.reasoning_effort = config.reasoningEffort;
    }

    if (webSearch) {
        payload.web_search_options = {};
    }
    mergePlainObject(payload, config.chatPayload);

    const headers = {
        'Content-Type': 'application/json',
    };

    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    mergePlainObject(headers, config.headers);

    const webSearchLabel = webSearch ? ' with Chat web search' : '';
    debugLog(`[OpenAI Compatible] Requesting ${model} at ${url}${webSearchLabel}...`);

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal,
    });

    if (!response.ok) {
        const errorText = await readErrorMessage(response);
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const sources = [];
    const seenSourceUrls = new Set();
    let fullText = '';
    let fullThoughts = ''; // Not standard in OpenAI, but some models (DeepSeek R1) might output <think> tags in content

    await readSseJson(response, (streamEvent) => {
        if (streamEvent.choices && streamEvent.choices.length > 0) {
            const choice = streamEvent.choices[0];
            const delta = choice.delta || {};

            // Standard Content
            if (delta.content) {
                fullText += delta.content;
                onUpdate(fullText, fullThoughts);
            }

            const reasoningText = extractReasoningText(delta);
            if (reasoningText) {
                fullThoughts += reasoningText;
                onUpdate(fullText, fullThoughts);
            }

            const completedReasoningText = extractReasoningText(choice.message);
            if (completedReasoningText && !fullThoughts) {
                fullThoughts = completedReasoningText;
                onUpdate(fullText, fullThoughts);
            }

            if (Array.isArray(delta.annotations)) {
                delta.annotations.forEach((annotation) =>
                    extractSourcesFromAnnotation(annotation, sources, seenSourceUrls)
                );
            }

            if (Array.isArray(choice.message?.annotations)) {
                choice.message.annotations.forEach((annotation) =>
                    extractSourcesFromAnnotation(annotation, sources, seenSourceUrls)
                );
            }
        }
    });

    return {
        text: fullText,
        thoughts: fullThoughts || null,
        sources,
        images: [],
        context: null,
    };
}

async function sendOpenAIResponsesMessage(
    prompt,
    systemInstruction,
    history,
    config,
    files,
    signal,
    onUpdate
) {
    const { baseUrl, apiKey, model } = config;
    const url = `${baseUrl}/responses`;
    const hasImages = hasImageAttachmentsInRequest(history, files);
    const payload = {
        model,
        input: buildResponsesInput(prompt, history, files),
        stream: true,
    };

    if (hasImages && isXAIBaseUrl(baseUrl)) {
        payload.store = false;
    }

    if (config.webSearch === true) {
        payload.tools = [{ type: 'web_search' }];
        payload.include = ['web_search_call.action.sources'];
    }

    if (systemInstruction) {
        payload.instructions = systemInstruction;
    }

    if (config.reasoningEffort) {
        payload.reasoning = {
            effort: config.reasoningEffort,
            summary: 'detailed',
        };
    }
    mergePlainObject(payload, config.responsesPayload);

    const headers = {
        'Content-Type': 'application/json',
    };

    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    mergePlainObject(headers, config.headers);

    const webSearchLabel = config.webSearch === true ? ' with web search' : '';
    debugLog(`[OpenAI Responses] Requesting ${model} at ${url}${webSearchLabel}...`);

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
    });

    if (!response.ok) {
        const errorText = await readErrorMessage(response);
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const sources = [];
    const seenSourceUrls = new Set();
    let fullText = '';
    let fullThoughts = '';
    let streamError = null;

    await readSseJson(response, (streamEvent) => {
        if (streamEvent.error?.message) {
            streamError = streamEvent.error.message;
            return;
        }

        if (streamEvent.type === 'response.output_text.delta' && streamEvent.delta) {
            fullText += streamEvent.delta;
            onUpdate(fullText, fullThoughts);
            return;
        }

        if (
            (streamEvent.type === 'response.reasoning_summary_text.delta' ||
                streamEvent.type === 'response.reasoning_text.delta') &&
            streamEvent.delta
        ) {
            fullThoughts += streamEvent.delta;
            onUpdate(fullText, fullThoughts);
            return;
        }

        if (
            (streamEvent.type === 'response.reasoning_summary_text.done' ||
                streamEvent.type === 'response.reasoning_text.done') &&
            streamEvent.text &&
            !fullThoughts
        ) {
            fullThoughts = streamEvent.text;
            onUpdate(fullText, fullThoughts);
            return;
        }

        if (streamEvent.type === 'response.output_text.annotation.added') {
            extractSourcesFromAnnotation(streamEvent.annotation, sources, seenSourceUrls);
            return;
        }

        if (streamEvent.type === 'response.output_item.done') {
            extractSourcesFromResponseItem(streamEvent.item, sources, seenSourceUrls);
            if (!fullThoughts) {
                const completedThoughts = extractReasoningSummaryFromResponseItem(streamEvent.item);
                if (completedThoughts) {
                    fullThoughts = completedThoughts;
                    onUpdate(fullText, fullThoughts);
                }
            }
            return;
        }

        if (streamEvent.type === 'response.completed' && streamEvent.response) {
            streamEvent.response.output?.forEach((item) =>
                extractSourcesFromResponseItem(item, sources, seenSourceUrls)
            );
            if (!fullThoughts) {
                fullThoughts = extractReasoningSummaryFromCompletedResponse(streamEvent.response);
            }
            if (!fullText) {
                fullText = extractTextFromCompletedResponse(streamEvent.response);
            }
            onUpdate(fullText, fullThoughts);
        }
    });

    if (streamError) {
        throw new Error(streamError);
    }

    return {
        text: fullText,
        thoughts: fullThoughts || null,
        sources,
        images: [],
        context: null,
    };
}
