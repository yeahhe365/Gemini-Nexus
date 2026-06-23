// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

async function createRendererHarness() {
    vi.resetModules();
    delete window.GeminiUIRenderer;
    await import('./renderer.js');

    const resultText = document.createElement('div');
    resultText.innerHTML = '<img data-req-id="req-1" class="generated-image loading">';
    const view = {
        elements: { resultText },
        showResult: vi.fn(),
    };

    return {
        renderer: new window.GeminiUIRenderer(view, null),
        imageElement: resultText.querySelector('img[data-req-id="req-1"]'),
    };
}

describe('toolbar generated image renderer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete globalThis.GeminiNexusWatermarkRemover;
        globalThis.chrome = {
            runtime: {
                sendMessage: vi.fn(() => Promise.resolve()),
            },
        };
    });

    it('auto-cleans fetched generated images when the setting is enabled', async () => {
        const process = vi.fn((base64Image) =>
            Promise.resolve(base64Image.replace('raw-image', 'clean-image'))
        );
        globalThis.GeminiNexusWatermarkRemover = { process };
        const { renderer, imageElement } = await createRendererHarness();

        await renderer.handleGeneratedImageResult({
            reqId: 'req-1',
            base64: 'data:image/png;base64,raw-image',
        });

        expect(process).toHaveBeenCalledWith('data:image/png;base64,raw-image');
        expect(imageElement.src).toContain('data:image/png;base64,clean-image');
        expect(imageElement.classList.contains('loading')).toBe(false);
    });

    it('keeps generated image pixels untouched when the setting is disabled', async () => {
        const process = vi.fn((base64Image) =>
            Promise.resolve(base64Image.replace('raw-image', 'clean-image'))
        );
        globalThis.GeminiNexusWatermarkRemover = { process };
        const { renderer, imageElement } = await createRendererHarness();
        renderer.setGeneratedImageWatermarkRemovalEnabled(false);

        await renderer.handleGeneratedImageResult({
            reqId: 'req-1',
            base64: 'data:image/png;base64,raw-image',
        });

        expect(process).not.toHaveBeenCalled();
        expect(imageElement.src).toContain('data:image/png;base64,raw-image');
        expect(imageElement.classList.contains('loading')).toBe(false);
    });

    it('removes loading state when a generated image fetch result fails', async () => {
        const { renderer, imageElement } = await createRendererHarness();

        await renderer.handleGeneratedImageResult({
            reqId: 'req-1',
            error: 'Image unavailable',
        });

        expect(imageElement.classList.contains('loading')).toBe(false);
        expect(imageElement.alt).toBe('Failed to load');
        expect(imageElement.style.background).toBe('rgb(255, 235, 238)');
    });

    it('removes loading state when requesting a generated image fails', async () => {
        chrome.runtime.sendMessage.mockRejectedValueOnce(
            new Error('Extension context invalidated')
        );
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const bridge = {
            render: vi.fn(async () => ({
                html: '<img data-req-id="req-1" class="generated-image loading">',
                fetchTasks: [{ reqId: 'req-1', url: 'https://example.test/generated.png' }],
            })),
        };
        const resultText = document.createElement('div');
        const view = {
            elements: { resultText },
            showResult: vi.fn((html) => {
                resultText.innerHTML = html;
            }),
        };
        await import('./renderer.js');
        const renderer = new window.GeminiUIRenderer(view, bridge);

        try {
            await renderer.show('image result', null, false, [
                { url: 'https://example.test/generated.png' },
            ]);
            await Promise.resolve();

            const imageElement = resultText.querySelector('img[data-req-id="req-1"]');
            expect(imageElement.classList.contains('loading')).toBe(false);
            expect(imageElement.alt).toBe('Failed to load');
            expect(warnSpy).toHaveBeenCalledWith(
                'Generated image fetch request failed:',
                expect.any(Error)
            );
        } finally {
            warnSpy.mockRestore();
        }
    });

    it('removes loading state when the background rejects a generated image fetch response', async () => {
        chrome.runtime.sendMessage.mockResolvedValueOnce({
            status: 'error',
            error: 'Image unavailable',
        });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const bridge = {
            render: vi.fn(async () => ({
                html: '<img data-req-id="req-1" class="generated-image loading">',
                fetchTasks: [{ reqId: 'req-1', url: 'https://example.test/generated.png' }],
            })),
        };
        const resultText = document.createElement('div');
        const view = {
            elements: { resultText },
            showResult: vi.fn((html) => {
                resultText.innerHTML = html;
            }),
        };
        await import('./renderer.js');
        const renderer = new window.GeminiUIRenderer(view, bridge);

        try {
            await renderer.show('image result', null, false, [
                { url: 'https://example.test/generated.png' },
            ]);
            await Promise.resolve();

            const imageElement = resultText.querySelector('img[data-req-id="req-1"]');
            expect(imageElement.classList.contains('loading')).toBe(false);
            expect(imageElement.alt).toBe('Failed to load');
            expect(warnSpy).toHaveBeenCalledWith(
                'Generated image fetch request failed:',
                expect.any(Error)
            );
        } finally {
            warnSpy.mockRestore();
        }
    });
});
