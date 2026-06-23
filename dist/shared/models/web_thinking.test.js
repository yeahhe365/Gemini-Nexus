import { describe, expect, it } from 'vitest';
import {
    DEFAULT_WEB_THINKING_LEVEL,
    WEB_NATIVE_THINKING_LEVELS,
    getNextWebThinkingLevel,
    getWebNativeThinkingLevel,
    getWebThinkingFastLevel,
    normalizeWebThinkingLevel,
    normalizeWebThinkingLevelForModel,
    supportsWebThinking,
} from './web_thinking.js';

describe('web thinking helpers', () => {
    it('defaults Gemini Web thinking to fast mode and normalizes invalid levels', () => {
        expect(DEFAULT_WEB_THINKING_LEVEL).toBe('minimal');
        expect(normalizeWebThinkingLevel('LOW')).toBe('low');
        expect(normalizeWebThinkingLevel('unknown')).toBe('minimal');
    });

    it('uses minimal as the fast toggle for Flash models and low for Pro', () => {
        expect(getWebThinkingFastLevel('8c46e95b1a07cecc')).toBe('minimal');
        expect(getWebThinkingFastLevel('56fdd199312815e2')).toBe('minimal');
        expect(getWebThinkingFastLevel('e6fa609c3fa255c0')).toBe('low');
        expect(normalizeWebThinkingLevelForModel('e6fa609c3fa255c0', 'minimal')).toBe('low');
    });

    it('toggles between model-specific fast mode and high mode', () => {
        expect(getNextWebThinkingLevel('8c46e95b1a07cecc', 'high')).toBe('minimal');
        expect(getNextWebThinkingLevel('8c46e95b1a07cecc', 'minimal')).toBe('high');
        expect(getNextWebThinkingLevel('e6fa609c3fa255c0', 'high')).toBe('low');
        expect(getNextWebThinkingLevel('e6fa609c3fa255c0', 'low')).toBe('high');
    });

    it('maps Nexus Web thinking levels to Gemini Web native levels', () => {
        expect(getWebNativeThinkingLevel('8c46e95b1a07cecc', 'minimal')).toBe(
            WEB_NATIVE_THINKING_LEVELS.STANDARD
        );
        expect(getWebNativeThinkingLevel('e6fa609c3fa255c0', 'minimal')).toBe(
            WEB_NATIVE_THINKING_LEVELS.STANDARD
        );
        expect(getWebNativeThinkingLevel('8c46e95b1a07cecc', 'medium')).toBe(
            WEB_NATIVE_THINKING_LEVELS.EXTENDED
        );
        expect(getWebNativeThinkingLevel('8c46e95b1a07cecc', 'high')).toBe(
            WEB_NATIVE_THINKING_LEVELS.EXTENDED
        );
    });

    it('only supports known Gemini Web reverse models', () => {
        expect(supportsWebThinking('gemini-3-flash-thinking')).toBe(true);
        expect(supportsWebThinking('gpt-5')).toBe(false);
    });
});
