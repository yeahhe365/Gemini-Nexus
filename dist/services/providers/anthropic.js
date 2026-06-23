import {
    countUserAttachmentsByType,
    getDataUrlMime,
    normalizeUserAttachments,
} from '../../shared/attachments/index.js';
import { debugLog } from '../../shared/logging/debug.js';
import { readErrorMessage } from './openai_response_extractors.js';
import { readSseJson } from './sse.js';

const DEFAULT_MAX_TOKENS = 8192;
const THINKING_BUDGET_BY_LEVEL = Object.freeze({
    low: 1024,
    medium: 2048,
    high: 4096,
});
const ADAPTIVE_THINKING_MODEL_PATTERNS = Object.freeze([
    /^claude-jupiter(?:-|$)/i,
    /^claude-mythos(?:-|$)/i,
    /^claude-opus-4-(?:[7-9]|\d{2,})(?:-|$)/i,
]);

function normalizeBaseUrl(baseUrl) {
    return String(baseUrl || '').replace(/\/$/, '');
}

function getDataUrlPayload(dataUrl) {
    if (typeof dataUrl !== 'string') return '';
    const commaIndex = dataUrl.indexOf(',');
    return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : '';
}

function assertCurrentAttachmentsSupported(files) {
    const counts = countUserAttachmentsByType(files);
    if (counts.files === 0) return;

    throw new Error(
        'Anthropic API supports image attachments only. Remove non-image files or switch to Gemini Official/Web.'
    );
}

function textWithUnsupportedFileNotice(text, attachments) {
    const unsupported = normalizeUserAttachments(attachments).filter(
        (attachment) => !attachment.type.startsWith('image/')
    );
    if (unsupported.length === 0) return text || '';

    const names = unsupported
        .map((attachment) => attachment.name)
        .filter(Boolean)
        .join(', ');
    const suffix = names ? `: ${names}` : '';
    return [text, `[${unsupported.length} unsupported file attachment(s) omitted${suffix}]`]
        .filter(Boolean)
        .join('\n');
}

function getMessageAttachments(message) {
    if (message?.role !== 'user') return [];
    const attachments = normalizeUserAttachments(message?.attachments);
    if (attachments.length > 0) return attachments;
    return normalizeUserAttachments(message?.image);
}

function buildUserContent(text, attachments) {
    const normalized = normalizeUserAttachments(attachments);
    const content = [];

    normalized
        .filter((attachment) => attachment.type.startsWith('image/'))
        .forEach((attachment) => {
            content.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: attachment.type || getDataUrlMime(attachment.base64) || 'image/png',
                    data: getDataUrlPayload(attachment.base64),
                },
            });
        });

    const textContent = textWithUnsupportedFileNotice(text, normalized);
    if (textContent) {
        content.push({ type: 'text', text: textContent });
    }

    return content.length > 0 ? content : [{ type: 'text', text: '' }];
}

function buildMessages(prompt, history, files) {
    const messages = [];

    if (Array.isArray(history)) {
        history.forEach((historyMessage) => {
            const role = historyMessage.role === 'ai' ? 'assistant' : 'user';
            const attachments = getMessageAttachments(historyMessage);
            messages.push({
                role,
                content:
                    role === 'user'
                        ? buildUserContent(historyMessage.text, attachments)
                        : [{ type: 'text', text: historyMessage.text || '' }],
            });
        });
    }

    messages.push({
        role: 'user',
        content: buildUserContent(prompt, files),
    });

    return messages;
}

function shouldUseAdaptiveThinking(model) {
    const modelId = String(model || '').trim();
    return ADAPTIVE_THINKING_MODEL_PATTERNS.some((pattern) => pattern.test(modelId));
}

function getThinkingConfig(thinkingLevel, model) {
    const budgetTokens = THINKING_BUDGET_BY_LEVEL[thinkingLevel];
    if (!budgetTokens) return null;
    if (shouldUseAdaptiveThinking(model)) {
        return null;
    }
    return {
        thinking: {
            type: 'enabled',
            budget_tokens: budgetTokens,
        },
    };
}

function applyAnthropicStreamEvent(streamEvent, state, onUpdate) {
    if (streamEvent.type === 'content_block_delta') {
        const delta = streamEvent.delta || {};
        if (delta.type === 'text_delta' && delta.text) {
            state.text += delta.text;
            onUpdate(state.text, state.thoughts);
            return;
        }
        if (delta.type === 'thinking_delta' && delta.thinking) {
            state.thoughts += delta.thinking;
            onUpdate(state.text, state.thoughts);
            return;
        }
        if (delta.type === 'redacted_thinking_delta') {
            state.thoughts += state.thoughts ? '\n[redacted thinking]' : '[redacted thinking]';
            onUpdate(state.text, state.thoughts);
        }
        return;
    }

    if (streamEvent.type === 'error' && streamEvent.error?.message) {
        state.error = streamEvent.error.message;
    }
}

export async function sendAnthropicMessage(
    prompt,
    systemInstruction,
    history,
    config,
    files,
    signal,
    onUpdate
) {
    const baseUrl = normalizeBaseUrl(config?.baseUrl);
    const apiKey = config?.apiKey || '';
    const model = config?.model || '';

    if (!baseUrl) throw new Error('Base URL is missing.');
    if (!apiKey) throw new Error('API Key is missing.');
    if (!model) throw new Error('Model ID is missing.');

    assertCurrentAttachmentsSupported(files);

    const payload = {
        model,
        messages: buildMessages(prompt, history, files),
        max_tokens: config?.maxTokens || DEFAULT_MAX_TOKENS,
        stream: true,
    };

    if (systemInstruction) {
        payload.system = systemInstruction;
    }

    const thinkingConfig = getThinkingConfig(config?.thinkingLevel, model);
    if (thinkingConfig) {
        payload.thinking = thinkingConfig.thinking;
        if (thinkingConfig.outputConfig) {
            payload.output_config = thinkingConfig.outputConfig;
        }
    }

    const url = `${baseUrl}/messages`;
    debugLog(`[Anthropic API] Requesting ${model} at ${url}...`);

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': config?.anthropicVersion || '2023-06-01',
        },
        body: JSON.stringify(payload),
        signal,
    });

    // Retry without thinking config if the model doesn't support it
    if (!response.ok && thinkingConfig) {
        const errorText = await readErrorMessage(response.clone());
        if (errorText.includes('thinking') && errorText.includes('not supported')) {
            debugLog(`[Anthropic API] Retrying without thinking config for ${model}...`);
            delete payload.thinking;
            delete payload.output_config;
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': config?.anthropicVersion || '2023-06-01',
                },
                body: JSON.stringify(payload),
                signal,
            });
        }
    }

    if (!response.ok) {
        const errorText = await readErrorMessage(response);
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const state = {
        text: '',
        thoughts: '',
        error: null,
    };

    await readSseJson(response, (streamEvent) => {
        applyAnthropicStreamEvent(streamEvent, state, onUpdate);
    });

    if (state.error) {
        throw new Error(state.error);
    }

    return {
        text: state.text,
        thoughts: state.thoughts || null,
        sources: [],
        images: [],
        context: null,
    };
}
