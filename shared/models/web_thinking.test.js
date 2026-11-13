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

    it('uses the lowest level each Web model exposes as its fast toggle', () => {
        expect(getWebThinkingFastLevel('56fdd199312815e2')).toBe('low');
        expect(getWebThinkingFastLevel('argon')).toBe('low');
        expect(getWebThinkingFastLevel('e6fa609c3fa255c0')).toBe('low');
        expect(getWebThinkingFastLevel('8c46e95b1a07cecc')).toBe('minimal');
        expect(getWebThinkingFastLevel('unknown-model')).toBe('low');
        expect(normalizeWebThinkingLevelForModel('unknown-model', 'minimal')).toBe('low');
        expect(normalizeWebThinkingLevelForModel('56fdd199312815e2', 'minimal')).toBe('low');
        expect(normalizeWebThinkingLevelForModel('8c46e95b1a07cecc', 'minimal')).toBe('minimal');
    });

    it('toggles between model-specific fast mode and high mode', () => {
        expect(getNextWebThinkingLevel('56fdd199312815e2', 'high')).toBe('low');
        expect(getNextWebThinkingLevel('56fdd199312815e2', 'low')).toBe('high');
        expect(getNextWebThinkingLevel('argon', 'high')).toBe('low');
        expect(getNextWebThinkingLevel('e6fa609c3fa255c0', 'high')).toBe('low');
        expect(getNextWebThinkingLevel('8c46e95b1a07cecc', 'high')).toBe('minimal');
        expect(getNextWebThinkingLevel('unknown-model', 'high')).toBe('low');
        expect(getNextWebThinkingLevel('unknown-model', 'low')).toBe('high');
    });

    it('maps Nexus Web thinking levels to Gemini Web native levels', () => {
        expect(getWebNativeThinkingLevel('56fdd199312815e2', 'minimal')).toBe(
            WEB_NATIVE_THINKING_LEVELS.STANDARD
        );
        expect(getWebNativeThinkingLevel('8c46e95b1a07cecc', 'minimal')).toBe(
            WEB_NATIVE_THINKING_LEVELS.STANDARD
        );
        expect(getWebNativeThinkingLevel('argon', 'low')).toBe(WEB_NATIVE_THINKING_LEVELS.STANDARD);
        expect(getWebNativeThinkingLevel('56fdd199312815e2', 'medium')).toBe(
            WEB_NATIVE_THINKING_LEVELS.MEDIUM
        );
        expect(getWebNativeThinkingLevel('56fdd199312815e2', 'high')).toBe(
            WEB_NATIVE_THINKING_LEVELS.EXTENDED
        );
        expect(getWebNativeThinkingLevel('argon', 'high')).toBe(
            WEB_NATIVE_THINKING_LEVELS.EXTENDED
        );
    });

    it('only supports known Gemini Web reverse models', () => {
        expect(supportsWebThinking('gemini-4-argon')).toBe(true);
        expect(supportsWebThinking('gemini-4')).toBe(true);
        expect(supportsWebThinking('gemini-4-hydrogen')).toBe(true);
        expect(supportsWebThinking('gemini-3.8-flash')).toBe(true);
        expect(supportsWebThinking('gemini-3.7-flash')).toBe(true);
        expect(supportsWebThinking('gemini-3.5-flash-lite')).toBe(true);
        expect(supportsWebThinking('gemini-3.1-pro')).toBe(true);
        expect(supportsWebThinking('e6fa609c3fa255c0')).toBe(true);
        expect(supportsWebThinking('gemini-3.6-flash')).toBe(false);
        expect(supportsWebThinking('gemini-3-flash-thinking')).toBe(false);
        expect(supportsWebThinking('gemini-3-flash')).toBe(false);
        expect(supportsWebThinking('gpt-5')).toBe(false);
    });
});
