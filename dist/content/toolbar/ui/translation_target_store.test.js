// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('GeminiTranslationTargetStore', () => {
    beforeEach(async () => {
        vi.resetModules();
        window.GeminiTranslationTargetStore = undefined;
        window.GeminiToolbarStrings = {
            defaultTranslationTargets: ['auto'],
        };
        window.GeminiToolbarI18n = {
            normalizeTranslationTargets: vi.fn((targets) => {
                if (Array.isArray(targets) && targets.includes('zh-Hans')) return ['zh-Hans'];
                return ['auto'];
            }),
        };
        await import('./translation_target_store.js');
    });

    it('normalizes, stores, and restores toolbar translation targets', async () => {
        const storage = {
            get: vi.fn(async () => ({ geminiTranslationTargets: ['zh-Hans'] })),
            set: vi.fn(async () => {}),
        };
        const store = new window.GeminiTranslationTargetStore({ storage });

        expect(store.getTargets()).toEqual(['auto']);

        await store.restore();
        expect(store.getTargets()).toEqual(['zh-Hans']);

        await store.setTargets(['invalid']);
        expect(store.getTargets()).toEqual(['auto']);
        expect(storage.set).toHaveBeenCalledWith({ geminiTranslationTargets: ['auto'] });
    });
});
