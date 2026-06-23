import './web_model_catalog.js';
import './web_thinking_global.js';

const webThinking = globalThis.GeminiNexusWebThinking;

export const DEFAULT_WEB_THINKING_LEVEL = webThinking.DEFAULT_WEB_THINKING_LEVEL;
export const WEB_THINKING_LEVELS = webThinking.WEB_THINKING_LEVELS;
export const WEB_NATIVE_THINKING_LEVELS = webThinking.WEB_NATIVE_THINKING_LEVELS;
const DEEP_WEB_THINKING_LEVEL = 'high';

export function normalizeWebThinkingLevel(level, fallback = DEFAULT_WEB_THINKING_LEVEL) {
    const normalized = String(level || '')
        .trim()
        .toLowerCase();
    return WEB_THINKING_LEVELS.includes(normalized) ? normalized : fallback;
}

export function supportsWebThinking(model) {
    return webThinking.supportsWebThinking(model);
}

export function getWebThinkingFastLevel(model) {
    return normalizeWebThinkingLevel(webThinking.getWebThinkingFastLevel(model), 'low');
}

export function normalizeWebThinkingLevelForModel(
    model,
    level,
    fallback = DEFAULT_WEB_THINKING_LEVEL
) {
    const normalized = normalizeWebThinkingLevel(level, fallback);
    if (normalized === 'minimal' && getWebThinkingFastLevel(model) !== 'minimal') {
        return 'low';
    }
    return normalized;
}

export function getNextWebThinkingLevel(model, currentLevel) {
    const normalized = normalizeWebThinkingLevelForModel(model, currentLevel);
    const fastLevel = getWebThinkingFastLevel(model);
    return normalized === fastLevel ? DEEP_WEB_THINKING_LEVEL : fastLevel;
}

export function getWebNativeThinkingLevel(model, level) {
    const normalized = normalizeWebThinkingLevelForModel(model, level);
    if (normalized === 'minimal' || normalized === 'low') {
        return WEB_NATIVE_THINKING_LEVELS.STANDARD;
    }
    return WEB_NATIVE_THINKING_LEVELS.EXTENDED;
}
