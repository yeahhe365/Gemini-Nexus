import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

async function installEvents() {
    await import('./events.js');
}

describe('ToolbarEvents', () => {
    let resizeObserverCallback;

    beforeEach(async () => {
        vi.resetModules();
        resizeObserverCallback = null;
        const dom = new JSDOM('<!doctype html><html><body></body></html>');
        globalThis.document = dom.window.document;
        globalThis.CustomEvent = dom.window.CustomEvent;
        globalThis.Event = dom.window.Event;
        globalThis.window = {};
        globalThis.ResizeObserver = class {
            constructor(callback) {
                resizeObserverCallback = callback;
            }
            observe() {}
            disconnect() {}
        };
        await installEvents();
    });

    it('binds the image translation menu item to the image_translate action', () => {
        const imageBtn = document.createElement('button');
        const imageTranslate = document.createElement('button');
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const triggerAction = vi.fn();

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction,
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleModelChange: vi.fn(),
            isWindowVisible: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions: vi.fn(),
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                imageBtn,
                askInput,
                askModelSelect,
                askWindow,
                resultText,
                buttons: {
                    imageTranslate,
                },
            },
            askWindow
        );

        imageTranslate.click();

        expect(triggerAction).toHaveBeenCalledTimes(1);
        expect(triggerAction.mock.calls[0][1]).toBe('image_translate');
        events.disconnect();
    });

    it('binds the selected-text image generation button to the generate_image action', () => {
        const generateImage = document.createElement('button');
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const triggerAction = vi.fn();

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction,
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleModelChange: vi.fn(),
            isWindowVisible: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions: vi.fn(),
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                askInput,
                askModelSelect,
                askWindow,
                resultText,
                buttons: {
                    generateImage,
                },
            },
            askWindow
        );

        generateImage.dispatchEvent(new Event('mousedown'));

        expect(triggerAction).toHaveBeenCalledTimes(1);
        expect(triggerAction.mock.calls[0][1]).toBe('generate_image');
        events.disconnect();
    });

    it('saves the ask window dimensions after the visible window is resized', () => {
        const askProviderSelect = document.createElement('select');
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const saveWindowDimensions = vi.fn();

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction: vi.fn(),
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleModelChange: vi.fn(),
            isWindowVisible: vi.fn(() => true),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions,
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                askInput,
                askProviderSelect,
                askModelSelect,
                askWindow,
                resultText,
                buttons: {},
            },
            askWindow
        );

        resizeObserverCallback([
            {
                contentRect: {
                    width: 640,
                    height: 520,
                },
            },
        ]);

        expect(saveWindowDimensions).toHaveBeenCalledWith(640, 520);
        events.disconnect();
    });

    it('notifies the controller when the ask window provider changes', () => {
        const askProviderSelect = document.createElement('select');
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const handleProviderChange = vi.fn();

        askProviderSelect.innerHTML = `
            <option value="web">Web</option>
            <option value="official">API</option>
            <option value="openai">OpenAI</option>
        `;
        askProviderSelect.value = 'official';

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction: vi.fn(),
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleProviderChange,
            handleModelChange: vi.fn(),
            isWindowVisible: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions: vi.fn(),
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                askInput,
                askProviderSelect,
                askModelSelect,
                askWindow,
                resultText,
                buttons: {},
            },
            askWindow
        );

        askProviderSelect.dispatchEvent(new Event('change'));

        expect(handleProviderChange).toHaveBeenCalledWith('official');
        events.disconnect();
    });

    it('notifies the controller when the Web thinking toggle is clicked', () => {
        const askThinkingToggle = document.createElement('button');
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const handleWebThinkingToggle = vi.fn();

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction: vi.fn(),
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleProviderChange: vi.fn(),
            handleModelChange: vi.fn(),
            handleWebThinkingToggle,
            isWindowVisible: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions: vi.fn(),
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                askInput,
                askModelSelect,
                askThinkingToggle,
                askWindow,
                resultText,
                buttons: {},
            },
            askWindow
        );

        askThinkingToggle.click();

        expect(handleWebThinkingToggle).toHaveBeenCalledTimes(1);
        events.disconnect();
    });

    it('notifies the controller when translation target choices change', () => {
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const translationTargets = document.createElement('div');
        const handleTranslationTargetsChange = vi.fn();

        translationTargets.innerHTML = `
            <label><input type="checkbox" name="translation-target" value="auto"></label>
            <label><input type="checkbox" name="translation-target" value="zh-Hans" checked></label>
            <label><input type="checkbox" name="translation-target" value="ja" checked></label>
        `;

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction: vi.fn(),
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleModelChange: vi.fn(),
            handleTranslationTargetsChange,
            isWindowVisible: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions: vi.fn(),
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                askInput,
                askModelSelect,
                askWindow,
                resultText,
                translationTargets,
                buttons: {},
            },
            askWindow
        );

        translationTargets
            .querySelector('[value="ja"]')
            .dispatchEvent(new Event('change', { bubbles: true }));

        expect(handleTranslationTargetsChange).toHaveBeenCalledWith(['zh-Hans', 'ja']);
        events.disconnect();
    });

    it('opens and closes the translation target dropdown from the trigger', () => {
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const translationTargetTrigger = document.createElement('button');
        const toggleTranslationTargetDropdown = vi.fn();

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction: vi.fn(),
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleModelChange: vi.fn(),
            handleTranslationTargetsChange: vi.fn(),
            toggleTranslationTargetDropdown,
            isWindowVisible: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions: vi.fn(),
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                askInput,
                askModelSelect,
                askWindow,
                resultText,
                translationTargetTrigger,
                buttons: {},
            },
            askWindow
        );

        translationTargetTrigger.click();

        expect(toggleTranslationTargetDropdown).toHaveBeenCalledWith();
        events.disconnect();
    });

    it('flips the image tools submenu left and clamps its vertical offset when it would overflow the viewport', () => {
        const imageBtn = document.createElement('button');
        const askModelSelect = document.createElement('select');
        const askInput = document.createElement('input');
        const askWindow = document.createElement('div');
        const resultText = document.createElement('div');
        const submenuTrigger = document.createElement('div');
        const submenu = document.createElement('div');

        submenuTrigger.className = 'has-submenu';
        submenu.className = 'submenu';
        submenuTrigger.appendChild(submenu);
        imageBtn.appendChild(submenuTrigger);
        document.body.appendChild(imageBtn);

        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 180 });
        submenuTrigger.getBoundingClientRect = () => ({
            left: 250,
            right: 310,
            top: 140,
            bottom: 172,
            width: 60,
            height: 32,
        });
        submenu.getBoundingClientRect = () => ({
            left: 318,
            right: 498,
            top: 140,
            bottom: 300,
            width: 180,
            height: 160,
        });

        const events = new window.GeminiToolbarEvents({
            actions: {
                triggerAction: vi.fn(),
                cancelAsk: vi.fn(),
                stopAsk: vi.fn(),
            },
            handleImageClick: vi.fn(),
            handleImageHover: vi.fn(),
            handleModelChange: vi.fn(),
            isWindowVisible: vi.fn(() => false),
            isVisible: vi.fn(() => false),
            hide: vi.fn(),
            hideImageButton: vi.fn(),
            saveWindowDimensions: vi.fn(),
            codeCopy: {
                handle: vi.fn(),
            },
        });

        events.bind(
            {
                imageBtn,
                askInput,
                askModelSelect,
                askWindow,
                resultText,
                buttons: {},
            },
            askWindow
        );

        submenuTrigger.dispatchEvent(new Event('mouseenter'));

        expect(submenuTrigger.classList.contains('submenu-open-left')).toBe(true);
        expect(submenu.style.getPropertyValue('--submenu-offset-y')).toBe('-128px');
        events.disconnect();
    });
});
