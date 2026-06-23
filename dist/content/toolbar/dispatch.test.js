import { beforeEach, describe, expect, it, vi } from 'vitest';

async function installDispatcher() {
    await import('./dispatch.js');
}

describe('ToolbarDispatcher', () => {
    beforeEach(async () => {
        vi.resetModules();
        globalThis.window = {};
        await installDispatcher();
    });

    it('dispatches image text translation through the image translate prompt', async () => {
        const rect = { left: 10, top: 20, width: 200, height: 120 };
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
                hideImageButton: vi.fn(),
            },
            actions: {
                handleImagePrompt: vi.fn(),
            },
            imageDetector: {
                getCurrentImage: vi.fn(() => ({
                    src: 'data:image/png;base64,AAA',
                    getBoundingClientRect: () => rect,
                })),
            },
            inputManager: {},
            lastSessionId: 'previous-session',
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('image_translate');

        expect(controller.ui.hideImageButton).toHaveBeenCalledTimes(1);
        expect(controller.lastSessionId).toBeNull();
        expect(controller.actions.handleImagePrompt).toHaveBeenCalledWith(
            'data:image/png;base64,AAA',
            rect,
            'translate',
            'gemini-3-pro'
        );
    });

    it('opens image chat without dispatching an automatic image prompt', async () => {
        const rect = { left: 10, top: 20, width: 200, height: 120 };
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
                hideImageButton: vi.fn(),
            },
            actions: {
                handleImageChat: vi.fn(),
                handleImagePrompt: vi.fn(),
            },
            imageDetector: {
                getCurrentImage: vi.fn(() => ({
                    src: 'data:image/png;base64,AAA',
                    getBoundingClientRect: () => rect,
                })),
            },
            inputManager: {},
            lastSessionId: 'previous-session',
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('image_chat');

        expect(controller.ui.hideImageButton).toHaveBeenCalledTimes(1);
        expect(controller.lastSessionId).toBeNull();
        expect(controller.actions.handleImagePrompt).not.toHaveBeenCalled();
        expect(controller.actions.handleImageChat).toHaveBeenCalledWith(
            'data:image/png;base64,AAA',
            rect
        );
    });

    it('uses currentSrc for image editing when it differs from src', async () => {
        const rect = { left: 10, top: 20, width: 200, height: 120 };
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
                hideImageButton: vi.fn(),
            },
            actions: {
                handleImagePrompt: vi.fn(),
            },
            imageDetector: {
                getCurrentImage: vi.fn(() => ({
                    src: 'https://example.test/fallback-small.png',
                    currentSrc: 'https://example.test/actual-large.png',
                    getBoundingClientRect: () => rect,
                })),
            },
            inputManager: {},
            lastSessionId: 'previous-session',
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('image_remove_bg');

        expect(controller.actions.handleImagePrompt).toHaveBeenCalledWith(
            'https://example.test/actual-large.png',
            rect,
            'remove_bg',
            'gemini-3-pro'
        );
    });

    it('converts blob image URLs before dispatching image editing', async () => {
        const rect = { left: 10, top: 20, width: 200, height: 120 };
        globalThis.fetch = vi.fn(async () => ({
            ok: true,
            blob: async () => new Blob(['image-bytes'], { type: 'image/png' }),
        }));
        globalThis.FileReader = class {
            readAsDataURL(blob) {
                this.result = `data:${blob.type};base64,converted`;
                this.onloadend();
            }
        };
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
                hideImageButton: vi.fn(),
            },
            actions: {
                handleImagePrompt: vi.fn(),
            },
            imageDetector: {
                getCurrentImage: vi.fn(() => ({
                    src: 'blob:https://example.test/image-id',
                    currentSrc: 'blob:https://example.test/image-id',
                    getBoundingClientRect: () => rect,
                })),
            },
            inputManager: {},
            lastSessionId: 'previous-session',
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('image_remove_text');

        expect(fetch).toHaveBeenCalledWith('blob:https://example.test/image-id');
        expect(controller.actions.handleImagePrompt).toHaveBeenCalledWith(
            'data:image/png;base64,converted',
            rect,
            'remove_text',
            'gemini-3-pro'
        );
    });

    it('shows an error when a blob image cannot be read', async () => {
        const rect = { left: 10, top: 20, width: 200, height: 120 };
        globalThis.fetch = vi.fn(async () => ({
            ok: false,
            status: 404,
        }));
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
                hideImageButton: vi.fn(),
                showAskWindow: vi.fn(async () => {}),
                showError: vi.fn(),
            },
            actions: {
                handleImagePrompt: vi.fn(),
            },
            imageDetector: {
                getCurrentImage: vi.fn(() => ({
                    src: 'blob:https://example.test/missing',
                    currentSrc: 'blob:https://example.test/missing',
                    getBoundingClientRect: () => rect,
                })),
            },
            inputManager: {},
            lastSessionId: 'previous-session',
        };
        window.GeminiToolbarStrings = {
            errors: {
                imageLoadFailed: 'Could not read image.',
            },
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('image_expand');

        expect(controller.actions.handleImagePrompt).not.toHaveBeenCalled();
        expect(controller.ui.showAskWindow).toHaveBeenCalledWith(rect, null, 'Image tools');
        expect(controller.ui.showError).toHaveBeenCalledWith('Could not read image.');
    });

    it('dispatches custom selection tools with the current selection', async () => {
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
            },
            actions: {
                handleCustomSelectionTool: vi.fn(),
            },
            imageDetector: {},
            inputManager: {},
            currentSelection: 'Selected text',
            lastRect: { left: 1, top: 2 },
            lastMousePoint: { x: 4, y: 8 },
            lastSessionId: 'previous-session',
        };
        const tool = {
            id: 'formal',
            name: 'Formal',
            prompt: 'Rewrite: {text}',
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch(
            'custom_selection_tool',
            tool
        );

        expect(controller.lastSessionId).toBeNull();
        expect(controller.actions.handleCustomSelectionTool).toHaveBeenCalledWith(
            tool,
            'Selected text',
            { left: 1, top: 2 },
            'gemini-3-pro',
            { x: 4, y: 8 }
        );
    });

    it('dispatches read selection through the speech reader path', async () => {
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
            },
            actions: {},
            imageDetector: {},
            inputManager: {},
            currentSelection: 'Selected text',
            readSelectionAloud: vi.fn(),
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('read_selection');

        expect(controller.readSelectionAloud).toHaveBeenCalledTimes(1);
    });

    it('dispatches selected-text image generation with the current selection', async () => {
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
            },
            actions: {
                handleGenerateImage: vi.fn(),
            },
            imageDetector: {},
            inputManager: {},
            currentSelection: 'A glass city floating above the ocean',
            lastRect: { left: 1, top: 2 },
            lastMousePoint: { x: 4, y: 8 },
            lastSessionId: 'previous-session',
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('generate_image');

        expect(controller.lastSessionId).toBeNull();
        expect(controller.actions.handleGenerateImage).toHaveBeenCalledWith(
            'A glass city floating above the ocean',
            { left: 1, top: 2 },
            'gemini-3-pro',
            { x: 4, y: 8 }
        );
    });

    it('dispatches read page through the speech reader path', async () => {
        const controller = {
            ui: {
                getSelectedModel: vi.fn(() => 'gemini-3-pro'),
            },
            actions: {},
            imageDetector: {},
            inputManager: {},
            readPageAloud: vi.fn(),
        };

        await new window.GeminiToolbarDispatcher(controller).dispatch('read_page');

        expect(controller.readPageAloud).toHaveBeenCalledTimes(1);
    });
});
