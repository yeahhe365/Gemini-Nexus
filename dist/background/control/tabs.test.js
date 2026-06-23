import { describe, expect, it } from 'vitest';
import { getTabControlAvailability, toControlTabSummary } from './tabs.js';

describe('browser control tab helpers', () => {
    it('marks normal web pages as controllable', () => {
        const tab = {
            id: 12,
            title: 'OpenAI News',
            url: 'https://openai.com/news/',
            favIconUrl: 'https://openai.com/favicon.ico',
            active: true,
        };

        expect(getTabControlAvailability(tab)).toEqual({
            controllable: true,
            reason: null,
        });
        expect(toControlTabSummary(tab)).toEqual({
            id: 12,
            title: 'OpenAI News',
            url: 'https://openai.com/news/',
            favIconUrl: 'https://openai.com/favicon.ico',
            active: true,
            controllable: true,
            reason: null,
        });
    });

    it('marks restricted browser pages as unavailable for control', () => {
        const tab = {
            id: 44,
            title: 'Extensions',
            url: 'chrome://extensions/',
            active: false,
        };

        expect(getTabControlAvailability(tab)).toEqual({
            controllable: false,
            reason: 'restricted',
        });
        expect(toControlTabSummary(tab)).toMatchObject({
            id: 44,
            controllable: false,
            reason: 'restricted',
        });
    });
});
