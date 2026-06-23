// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

function createElements() {
    const resultText = document.createElement('div');
    return {
        askWindow: document.createElement('div'),
        askInput: document.createElement('textarea'),
        contextPreview: document.createElement('div'),
        resultArea: document.createElement('div'),
        resultText,
        windowTitle: document.createElement('div'),
        windowFooter: document.createElement('div'),
        footerStop: document.createElement('div'),
        footerActions: document.createElement('div'),
        translationTargets: document.createElement('div'),
        translationTargetTrigger: document.createElement('button'),
        translationTargetMenu: document.createElement('div'),
        translationTargetSummary: document.createElement('span'),
        translationTargetOptions: document.createElement('div'),
        buttons: {
            copy: document.createElement('button'),
        },
    };
}

describe('WindowView', () => {
    beforeAll(async () => {
        window.GeminiViewLayout = {
            positionElement: vi.fn(),
        };
        window.GeminiToolbarIcons = {
            COPY: 'copy',
            CLOSE: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
        };
        await import('./image_preview.js');
        await import('./translation_targets.js');
        await import('./window.js');
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        delete globalThis.chrome;
        window.GeminiViewLayout.positionElement.mockClear();
    });

    it('renders arbitrary error HTML as text', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showError('<img src=x onerror="alert(1)">Boom');

        expect(elements.resultText.querySelector('img')).toBeNull();
        expect(elements.resultText.textContent).toContain('<img src=x onerror="alert(1)">Boom');
    });

    it('renders the error shell with semantic classes instead of inline styles', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showError('Boom');

        expect(elements.resultText.querySelector('.gemini-error-card')).not.toBeNull();
        expect(elements.resultText.querySelector('.gemini-error-title')).not.toBeNull();
        expect(elements.resultText.querySelector('.gemini-error-text')).not.toBeNull();
        expect(elements.resultText.querySelector('[style]')).toBeNull();
    });

    it('renders loading messages as text', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showLoading('<img src=x onerror="alert(1)">Loading');

        expect(elements.resultText.querySelector('img')).toBeNull();
        expect(elements.resultText.textContent).toContain('<img src=x onerror="alert(1)">Loading');
        expect(elements.resultText.querySelector('.gemini-loading-message')).not.toBeNull();
        expect(elements.resultText.querySelector('[style]')).toBeNull();
    });

    it('allows only Gemini login links in rich error text', () => {
        const elements = createElements();
        elements.askWindow.classList.add('visible');
        const view = new window.GeminiViewWindow(elements);

        view.showError(
            'Login at <a href="https://gemini.google.com/u/1/" onclick="alert(1)">Gemini</a> or <a href="https://evil.test/">evil</a>'
        );

        const links = [...elements.resultText.querySelectorAll('a')];
        expect(links).toHaveLength(1);
        expect(links[0].href).toBe('https://gemini.google.com/u/1/');
        expect(links[0].getAttribute('onclick')).toBeNull();
        expect(elements.resultText.textContent).toContain('evil');
    });

    it('restores the previously saved ask window size when showing', async () => {
        globalThis.chrome = {
            storage: {
                local: {
                    get: vi.fn(async () => ({
                        gemini_nexus_window_size: { w: 640, h: 520 },
                    })),
                },
            },
        };
        Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await view.show({ right: 20, bottom: 20 }, 'context', 'Ask');

        expect(elements.askWindow.style.width).toBe('640px');
        expect(elements.askWindow.style.height).toBe('520px');
        expect(window.GeminiViewLayout.positionElement).toHaveBeenCalled();
        expect(elements.askWindow.classList.contains('visible')).toBe(true);
    });

    it('still shows the ask window when saved size storage is unavailable', async () => {
        const elements = createElements();
        const view = new window.GeminiViewWindow(elements);

        await expect(
            view.show({ right: 20, bottom: 20 }, 'context', 'Ask')
        ).resolves.toBeUndefined();

        expect(elements.askWindow.classList.contains('visible')).toBe(true);
    });

    it('summarizes selected translation targets in the dropdown trigger', () => {
        const elements = createElements();
        elements.translationTargetMenu.classList.add('hidden');
        elements.translationTargetOptions.innerHTML = `
            <label><input type="checkbox" name="translation-target" value="auto"><span>Auto</span></label>
            <label><input type="checkbox" name="translation-target" value="zh-Hans"><span>Chinese</span></label>
            <label><input type="checkbox" name="translation-target" value="ja"><span>Japanese</span></label>
        `;
        const view = new window.GeminiViewWindow(elements);

        view.setSelectedTranslationTargets(['zh-Hans', 'ja']);

        expect(elements.translationTargetSummary.textContent).toBe('Chinese, Japanese');

        view.toggleTranslationTargetDropdown();

        expect(elements.translationTargetMenu.classList.contains('hidden')).toBe(false);
        expect(elements.translationTargetTrigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('opens generated result images in a zoomable preview', () => {
        const elements = createElements();
        document.body.appendChild(elements.askWindow);
        const view = new window.GeminiViewWindow(elements);

        view.showResult(
            '<div class="generated-images-grid"><img class="generated-image" src="data:image/png;base64,AAAA" alt="Generated"></div>',
            null,
            false
        );

        elements.resultText.querySelector('.generated-image').click();

        const preview = document.body.querySelector('.gemini-image-preview');
        const previewImage = preview.querySelector('.gemini-image-preview-img');
        expect(preview.classList.contains('visible')).toBe(true);
        expect(previewImage.src).toBe('data:image/png;base64,AAAA');

        preview.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));

        expect(previewImage.style.transform).toContain('scale(1.1)');

        preview.querySelector('.gemini-image-preview-close').click();

        expect(preview.classList.contains('visible')).toBe(false);
    });

    it('closes the zoom preview when the nested close icon is clicked', () => {
        const elements = createElements();
        document.body.appendChild(elements.askWindow);
        const view = new window.GeminiViewWindow(elements);

        view.showResult(
            '<div class="generated-images-grid"><img class="generated-image" src="data:image/png;base64,CCCC" alt="Generated"></div>',
            null,
            false
        );

        elements.resultText.querySelector('.generated-image').click();

        const preview = document.body.querySelector('.gemini-image-preview');
        const closeIconPath = preview.querySelector('.gemini-image-preview-close path');
        closeIconPath.dispatchEvent(
            new MouseEvent('mousedown', {
                button: 0,
                bubbles: true,
                cancelable: true,
            })
        );

        expect(preview.classList.contains('is-panning')).toBe(false);

        closeIconPath.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

        expect(preview.classList.contains('visible')).toBe(false);
        expect(preview.hidden).toBe(true);
    });
});
