import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

function iconProxy() {
    return new Proxy(
        {},
        {
            get: (_, key) => `<svg data-icon="${String(key)}"></svg>`,
        }
    );
}

async function installTemplates() {
    await import('./templates.js');
}

describe('GeminiToolbarTemplates', () => {
    beforeEach(async () => {
        vi.resetModules();
        const dom = new JSDOM('<!doctype html><html><body></body></html>');
        globalThis.document = dom.window.document;
        globalThis.window = {
            GeminiToolbarIcons: iconProxy(),
            GeminiToolbarStyles: '',
            GeminiWebModels: {
                createOptionMarkup: () => '<option value="gemini-3-pro">Gemini 3 Pro</option>',
            },
            GeminiToolbarStrings: {
                askAi: 'Ask AI',
                copy: 'Copy',
                fixGrammar: 'Fix grammar',
                translate: 'Translate',
                explain: 'Explain',
                summarize: 'Summarize',
                readSelection: 'Read selection aloud',
                generateImage: 'Generate image',
                customSelectionMore: 'More custom tools',
                aiTools: 'AI tools',
                chatWithImage: 'Chat with image',
                describeImage: 'Describe image',
                extractText: 'Extract text',
                translateImageText: 'Translate image text',
                imageTools: 'Image tools',
                removeBg: 'Remove background',
                removeText: 'Remove text',
                removeWatermark: 'Remove watermark',
                upscale: 'Upscale',
                expand: 'Expand',
                windowTitle: 'Gemini Nexus',
                close: 'Close',
                askPlaceholder: 'Ask Gemini...',
                toolbarProviderLabel: 'Popup provider',
                toolbarThinkingToggleAria: 'Toggle thinking level',
                providerWebShort: 'Web',
                providerOfficialShort: 'API',
                providerOpenAIShort: 'OpenAI',
                providerOpenAIOfficialShort: 'OpenAI API',
                providerDeepSeekShort: 'DeepSeek',
                providerOpenRouterShort: 'OpenRouter',
                providerDashScopeShort: 'DashScope',
                providerAnthropicShort: 'Anthropic',
                providerZhipuShort: 'Zhipu',
                translateTargetLabel: 'Translate to',
                translationTargetOptions: [
                    { value: 'auto', label: 'Auto' },
                    { value: 'zh-Hans', label: 'Chinese' },
                    { value: 'ja', label: 'Japanese' },
                ],
                retry: 'Retry',
                openSidebar: 'Open in Sidebar',
                chat: 'Chat',
                insertTooltip: 'Insert at cursor',
                insert: 'Insert',
                replaceTooltip: 'Replace selected text',
                replace: 'Replace',
                copyResult: 'Copy result',
                stopGenerating: 'Stop generating',
            },
        };
        await installTemplates();
    });

    it('includes a first-level image text translation menu item', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        const translationMenuItem = wrapper.querySelector('#btn-image-translate');

        expect(translationMenuItem).not.toBeNull();
        expect(translationMenuItem.textContent).toContain('Translate image text');
    });

    it('renders the image tools trigger with the Gemini logo', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        const trigger = wrapper.querySelector('.ai-tool-trigger');
        const logoIcon = trigger?.querySelector('[data-icon="LOGO"]');
        const plusIcon = trigger?.querySelector('[data-icon="PLUS"]');
        const externalIcon = trigger?.querySelector('[data-icon="EXTERNAL_OPEN"]');

        expect(trigger).not.toBeNull();
        expect(logoIcon).not.toBeNull();
        expect(plusIcon).toBeNull();
        expect(externalIcon).toBeNull();
    });

    it('renders a provider selector for the ask window', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        const providerSelect = wrapper.querySelector('#ask-provider-select');
        const options = [...providerSelect.querySelectorAll('option')];

        expect(providerSelect).not.toBeNull();
        expect(providerSelect.getAttribute('title')).toBe('Popup provider');
        expect(options.map((option) => option.value)).toEqual([
            'web',
            'official',
            'openai',
            'openai_official',
            'deepseek',
            'openrouter',
            'dashscope',
            'anthropic',
            'zhipu',
        ]);
        expect(options.map((option) => option.textContent)).toEqual([
            'Web',
            'API',
            'OpenAI',
            'OpenAI API',
            'DeepSeek',
            'OpenRouter',
            'DashScope',
            'Anthropic',
            'Zhipu',
        ]);
    });

    it('renders the Web thinking toggle with the lightning icon in the ask window header', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        const button = wrapper.querySelector('#ask-thinking-toggle');

        expect(button).not.toBeNull();
        expect(button.hidden).toBe(true);
        expect(button.getAttribute('title')).toBe('Toggle thinking level');
        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(button.querySelector('[data-icon="ZAP"]')).not.toBeNull();
    });

    it('renders a hidden multi-language translation target dropdown in the ask window', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        const panel = wrapper.querySelector('#translation-targets');
        const header = wrapper.querySelector('.ask-header');
        const body = wrapper.querySelector('.window-body');
        const trigger = wrapper.querySelector('#translation-target-trigger');
        const menu = wrapper.querySelector('#translation-target-menu');
        const options = [...wrapper.querySelectorAll('[name="translation-target"]')];

        expect(panel).not.toBeNull();
        expect(header.contains(panel)).toBe(true);
        expect(body.contains(panel)).toBe(false);
        expect(panel.classList.contains('hidden')).toBe(true);
        expect(panel.textContent).toContain('Translate to');
        expect(trigger).not.toBeNull();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.textContent).toContain('Auto');
        expect(menu).not.toBeNull();
        expect(menu.classList.contains('hidden')).toBe(true);
        expect(options.map((option) => option.value)).toEqual(['auto', 'zh-Hans', 'ja']);
    });

    it('includes a custom selection tools mount point in the text toolbar', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        expect(wrapper.querySelector('#custom-selection-tools')).not.toBeNull();
        expect(wrapper.querySelector('#custom-selection-more')).not.toBeNull();
        expect(wrapper.querySelector('#btn-custom-selection-more')).not.toBeNull();
    });

    it('renders a read selection button in the text toolbar', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        const button = wrapper.querySelector('#btn-read-selection');

        expect(button).not.toBeNull();
        expect(button.getAttribute('title')).toBe('Read selection aloud');
        expect(button.querySelector('[data-icon="SPEAKER"]')).not.toBeNull();
    });

    it('renders a one-click generated image button in the text toolbar', () => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = window.GeminiToolbarTemplates.mainStructure;

        const button = wrapper.querySelector('#btn-generate-image');

        expect(button).not.toBeNull();
        expect(button.getAttribute('title')).toBe('Generate image');
        expect(button.querySelector('[data-icon="IMAGE_SPARKLE"]')).not.toBeNull();
    });
});
