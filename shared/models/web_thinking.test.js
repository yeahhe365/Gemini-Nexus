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
        expect(getWebThinkingFastLevel('56fdd199312815e2')).toBe('minimal');
        expect(getWebThinkingFastLevel('fbb127bbb056c959')).toBe('minimal');
        expect(getWebThinkingFastLevel('cf41b0e0dd7d53e5')).toBe('minimal');
        expect(getWebThinkingFastLevel('e6fa609c3fa255c0')).toBe('low');
        expect(normalizeWebThinkingLevelForModel('e6fa609c3fa255c0', 'minimal')).toBe('low');
    });

    it('toggles between model-specific fast mode and high mode', () => {
        expect(getNextWebThinkingLevel('fbb127bbb056c959', 'high')).toBe('minimal');
        expect(getNextWebThinkingLevel('fbb127bbb056c959', 'minimal')).toBe('high');
        expect(getNextWebThinkingLevel('cf41b0e0dd7d53e5', 'high')).toBe('minimal');
        expect(getNextWebThinkingLevel('e6fa609c3fa255c0', 'high')).toBe('low');
        expect(getNextWebThinkingLevel('e6fa609c3fa255c0', 'low')).toBe('high');
    });

    it('maps Nexus Web thinking levels to Gemini Web native levels', () => {
        expect(getWebNativeThinkingLevel('fbb127bbb056c959', 'minimal')).toBe(
            WEB_NATIVE_THINKING_LEVELS.STANDARD
        );
        expect(getWebNativeThinkingLevel('cf41b0e0dd7d53e5', 'minimal')).toBe(
            WEB_NATIVE_THINKING_LEVELS.STANDARD
        );
        expect(getWebNativeThinkingLevel('e6fa609c3fa255c0', 'minimal')).toBe(
            WEB_NATIVE_THINKING_LEVELS.STANDARD
        );
        expect(getWebNativeThinkingLevel('fbb127bbb056c959', 'medium')).toBe(
            WEB_NATIVE_THINKING_LEVELS.EXTENDED
        );
        expect(getWebNativeThinkingLevel('fbb127bbb056c959', 'high')).toBe(
            WEB_NATIVE_THINKING_LEVELS.EXTENDED
        );
    });

    it('only supports known Gemini Web reverse models', () => {
        expect(supportsWebThinking('gemini-3.7-flash')).toBe(true);
        expect(supportsWebThinking('gemini-3.6-flash')).toBe(true);
        expect(supportsWebThinking('gemini-3.5-flash-lite')).toBe(true);
        expect(supportsWebThinking('gemini-3-flash-thinking')).toBe(true);
        expect(supportsWebThinking('gemini-3-flash')).toBe(false);
        expect(supportsWebThinking('gpt-5')).toBe(false);
    });
});
